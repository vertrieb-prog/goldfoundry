export const dynamic = "force-dynamic";
// src/app/api/chat/route.ts
// FORGE Mentor Agent — mit Tool Use für Live-Daten + Aktionen
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { buildMentorPrompt, extractMemoryUpdates, cleanResponseForUser, saveMemoryUpdate } from "@/lib/forge-ai-mentor";
import { MENTOR_TOOLS, executeTool } from "@/lib/mentor-tools";
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
      let limitMsg = usage.upgradeMessage ?? "Nachrichten-Limit erreicht.";
      if (usage.redirectToUpline) {
        limitMsg += `\n\nDein Partner ${usage.redirectToUpline.name} hilft dir gerne weiter:\n📧 ${usage.redirectToUpline.email}`;
        if (usage.redirectToUpline.phone) limitMsg += `\n📱 ${usage.redirectToUpline.phone}`;
        limitMsg += `\n\nOder upgrade dein Abo für mehr Nachrichten → /pricing`;
      } else {
        limitMsg += `\n\nUpgrade für mehr Nachrichten → /pricing`;
      }
      return NextResponse.json({
        limitReached: true, message: limitMsg,
        usage: { used: usage.used, limit: usage.limit, remaining: 0 },
        upgradeUrl: "/pricing",
      });
    }

    // Load MENTOR system prompt — TIER-OPTIMIERT
    const { data: userProfile } = await (await import("@/lib/supabase/server")).createSupabaseAdmin()
      .from("profiles").select("subscription_tier, subscription_active").eq("id", user.id).single();
    const userTier = (userProfile?.subscription_active ? userProfile?.subscription_tier : "free") ?? "free";

    // Tool Use nur für zahlende User (Free bekommt Basic-Chat)
    const useTools = userTier !== "free" && userTier !== "analyzer";

    let systemPrompt: string;
    if (!useTools) {
      systemPrompt = `Du bist FORGE Mentor auf Gold Foundry. Kurze, hilfreiche Antworten. Max 100 Wörter. Wenn der User Fragen hat die über Basics hinausgehen, empfiehl das Copier-Abo (29€/Mo) für ausführlichere Analysen. Sei freundlich aber effizient.

FORMATIERUNG: Nutze ## für Überschriften, - für Listen, Zahlen mit Punkt für nummerierte Listen. KEINE langen Fliesstext-Absätze. Strukturiere visuell klar.`;
    } else {
      systemPrompt = await buildMentorPrompt(user.id, message);
    }

    // Page context für zahlende User
    if (pageContext?.page && useTools) {
      const { getPageGuidance } = await import("@/lib/page-context");
      const guidance = getPageGuidance(pageContext);
      systemPrompt += `\n\n═══ AKTUELLE SEITE ═══\n${pageContext.page}\n${guidance}`;
    }

    // Chat-History
    const historyLimit = userTier === "free" ? 4 : userTier === "analyzer" ? 8 : 20;
    const db = createSupabaseAdmin();
    const { data: history } = await db.from("chat_messages")
      .select("role, content").eq("user_id", user.id)
      .order("created_at", { ascending: true }).limit(historyLimit);

    const msgs: Anthropic.MessageParam[] = [];
    if (history) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          msgs.push({ role: msg.role, content: msg.content });
        }
      }
    }
    msgs.push({ role: "user", content: message });

    // Save user message
    await db.from("chat_messages").insert({ user_id: user.id, role: "user", content: message });

    // ── Stream Response (with Tool Use Loop) ─────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          // Tool Use Loop: Claude kann mehrfach Tools aufrufen
          let currentMessages = [...msgs];
          let toolRounds = 0;
          const MAX_TOOL_ROUNDS = 5;

          while (toolRounds < MAX_TOOL_ROUNDS) {
            toolRounds++;

            const createParams: Anthropic.MessageCreateParamsNonStreaming = {
              model: "claude-sonnet-4-20250514",
              max_tokens: usage.maxTokens || 1024,
              system: systemPrompt,
              messages: currentMessages,
            };

            // Tools nur für zahlende User
            if (useTools) {
              createParams.tools = MENTOR_TOOLS as any;
            }

            // Nicht-streaming Call wenn Tools möglich (brauchen wir für tool_use blocks)
            if (useTools && toolRounds === 1) {
              // Erste Runde: non-streaming um Tool-Calls zu erkennen
              const response = await anthropic.messages.create(createParams);

              // Check ob Claude Tools aufrufen will
              const toolUseBlocks = response.content.filter(b => b.type === "tool_use");
              const textBlocks = response.content.filter(b => b.type === "text");

              // Text vor Tool-Calls sofort streamen
              for (const block of textBlocks) {
                if (block.type === "text" && block.text) {
                  fullResponse += block.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: block.text })}\n\n`));
                }
              }

              if (toolUseBlocks.length === 0) {
                // Keine Tools → fertig
                break;
              }

              // Tools ausführen
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "Daten werden abgerufen..." })}\n\n`));

              const toolResults: Anthropic.ToolResultBlockParam[] = [];
              for (const toolBlock of toolUseBlocks) {
                if (toolBlock.type === "tool_use") {
                  try {
                    const result = await executeTool(toolBlock.name, toolBlock.input as Record<string, any>, user.id);
                    toolResults.push({ type: "tool_result", tool_use_id: toolBlock.id, content: result });
                  } catch (err) {
                    toolResults.push({
                      type: "tool_result", tool_use_id: toolBlock.id,
                      content: `Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`,
                      is_error: true,
                    });
                  }
                }
              }

              // Nächste Runde: Claude bekommt Tool-Ergebnisse
              currentMessages = [
                ...currentMessages,
                { role: "assistant", content: response.content as any },
                { role: "user", content: toolResults as any },
              ];
              continue;
            }

            // Letzte Runde oder Free-Tier: Streaming
            const streamResponse = await anthropic.messages.create({
              ...createParams,
              stream: true,
            } as any);

            for await (const event of streamResponse as any) {
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                const text = event.delta.text;
                fullResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            break; // Streaming-Runde = fertig
          }

          // Save assistant response + extract memory updates
          const memoryUpdates = extractMemoryUpdates(fullResponse);
          const cleanResponse = cleanResponseForUser(fullResponse);

          await db.from("chat_messages").insert({
            user_id: user.id, role: "assistant", content: cleanResponse,
          });

          if (memoryUpdates) {
            await saveMemoryUpdate(user.id, memoryUpdates);
          }

          // AUTO SUPPORT TICKET
          const problemKeywords = ["problem", "fehler", "bug", "funktioniert nicht", "hilfe", "kaputt", "geht nicht", "error", "broken", "support", "nicht möglich"];
          const isSupport = problemKeywords.some(k => message.toLowerCase().includes(k));
          if (isSupport) {
            try {
              const { logActivity } = await import("@/lib/crm/crm-engine");
              const { data: contact } = await db.from("crm_contacts").select("id").eq("profile_id", user.id).single();
              if (contact) {
                await logActivity(contact.id, "support_request", `User meldet Problem: "${message.slice(0, 200)}..." → AI-Antwort gegeben.`);
              }
              const { setUserData } = await import("@/lib/user-db");
              await setUserData(user.id, "notes", `support_${Date.now()}`, {
                problem: message.slice(0, 500), aiResponse: cleanResponse.slice(0, 500),
                timestamp: new Date().toISOString(), resolved: true,
              });
            } catch {}
          }

          // Track token usage
          const estimatedInputTokens = Math.ceil((systemPrompt.length + message.length) / 4);
          const estimatedOutputTokens = Math.ceil(cleanResponse.length / 4);
          try { await trackTokenUsage(user.id, estimatedInputTokens, estimatedOutputTokens, "claude-sonnet-4-20250514"); } catch {}

          // Send remaining count
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
    console.error("[FORGE Mentor] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
