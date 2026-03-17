// src/app/api/chat/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { buildMentorPrompt, extractMemoryUpdates, cleanResponseForUser, saveMemoryUpdate } from "@/lib/forge-ai-mentor";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, pageContext } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // ── USAGE LIMIT CHECK ─────────────────────────────────────
    const { checkUsageLimit, trackTokenUsage } = await import("@/lib/usage-limiter");
    const usage = await checkUsageLimit(user.id);

    if (!usage.allowed) {
      // Limit reached → return limit message + upline redirect
      let limitMsg = usage.upgradeMessage ?? "Nachrichten-Limit erreicht.";

      if (usage.redirectToUpline) {
        limitMsg += `\n\nDein Partner ${usage.redirectToUpline.name} hilft dir gerne weiter:\n📧 ${usage.redirectToUpline.email}`;
        if (usage.redirectToUpline.phone) limitMsg += `\n📱 ${usage.redirectToUpline.phone}`;
        limitMsg += `\n\nOder upgrade dein Abo für mehr Nachrichten → /pricing`;
      } else {
        limitMsg += `\n\nUpgrade für mehr Nachrichten → /pricing`;
      }

      return NextResponse.json({
        limitReached: true,
        message: limitMsg,
        usage: { used: usage.used, limit: usage.limit, remaining: 0 },
        upgradeUrl: "/pricing",
      });
    }

    // Load MENTOR system prompt — TIER-OPTIMIERT für Kosteneffizienz
    const { data: userProfile } = await (await import("@/lib/supabase/server")).createSupabaseAdmin()
      .from("profiles").select("subscription_tier, subscription_active").eq("id", user.id).single();
    const userTier = (userProfile?.subscription_active ? userProfile?.subscription_tier : "free") ?? "free";

    let systemPrompt: string;
    if (userTier === "free" || userTier === "analyzer") {
      // KOMPAKT-PROMPT für Free/Analyzer (spart ~60% Input-Tokens)
      systemPrompt = `Du bist FORGE AI auf Gold Foundry. Kurze, hilfreiche Antworten. Max 100 Wörter. Wenn der User Fragen hat die über Basics hinausgehen, empfiehl das Copier-Abo ($29/Mo) für ausführlichere Analysen. Sei freundlich aber effizient.`;
    } else {
      // VOLLER Mentor-Prompt für zahlende User
      systemPrompt = await buildMentorPrompt(user.id, message);
    }

    // Page context NUR für zahlende User (spart Tokens für Free)
    if (pageContext?.page && userTier !== "free") {
      const { getPageGuidance } = await import("@/lib/page-context");
      const guidance = getPageGuidance(pageContext);
      systemPrompt += `\n\n═══ AKTUELLE SEITE ═══\n${pageContext.page}\n${guidance}`;
    }

    // Chat-History: weniger für niedrigere Tiers
    const historyLimit = userTier === "free" ? 4 : userTier === "analyzer" ? 8 : 20;

    // Load recent chat history (last 20 messages)
    const db = createSupabaseAdmin();
    const { data: history } = await db
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(historyLimit);

    // Build messages array
    const messages: Anthropic.MessageParam[] = [];
    if (history) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: "user", content: message });

    // Save user message
    await db.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Stream response from Claude
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: usage.maxTokens, // Tier-basiert: free=300, copier=800, pro=1000
            system: systemPrompt,
            messages,
            stream: true,
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Save assistant response + extract memory updates
          const memoryUpdates = extractMemoryUpdates(fullResponse);
          const cleanResponse = cleanResponseForUser(fullResponse);

          await db.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: cleanResponse,
          });

          // Auto-save personal info the AI learned
          if (memoryUpdates) {
            await saveMemoryUpdate(user.id, memoryUpdates);
          }

          // AUTO SUPPORT TICKET: Detect problems + log to CRM
          const problemKeywords = ["problem", "fehler", "bug", "funktioniert nicht", "hilfe", "kaputt", "geht nicht", "error", "broken", "support", "nicht möglich"];
          const isSupport = problemKeywords.some(k => message.toLowerCase().includes(k));
          if (isSupport) {
            try {
              const { logActivity } = await import("@/lib/crm/crm-engine");
              const { data: contact } = await db.from("crm_contacts").select("id").eq("profile_id", user.id).single();
              if (contact) {
                await logActivity(contact.id, "support_request", `User meldet Problem: "${message.slice(0, 200)}..." → AI-Antwort gegeben.`);
              }
              // Save as note in user micro-DB
              const { setUserData } = await import("@/lib/user-db");
              await setUserData(user.id, "notes", `support_${Date.now()}`, {
                problem: message.slice(0, 500),
                aiResponse: cleanResponse.slice(0, 500),
                timestamp: new Date().toISOString(),
                resolved: true, // AI handled it
              });
            } catch {} // Non-blocking
          }

          // Track token usage for cost control
          const estimatedInputTokens = Math.ceil((systemPrompt.length + message.length) / 4);
          const estimatedOutputTokens = Math.ceil(cleanResponse.length / 4);
          try { await trackTokenUsage(user.id, estimatedInputTokens, estimatedOutputTokens, "claude-sonnet-4-20250514"); } catch {}

          // Send remaining count to frontend
          const newUsage = await checkUsageLimit(user.id);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, usage: { remaining: newUsage.remaining, limit: newUsage.limit, used: newUsage.used } })}\n\n`));
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "AI Error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[FORGE AI] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
