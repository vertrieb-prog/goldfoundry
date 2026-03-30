export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// CRON: Signal Health Check
// Runs daily at 07:00 BEFORE the signal cron at 08:00
// Verifies all channels have valid linked accounts & MetaApi deployed
// Auto-fixes any issues found
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const META_PROV_BASE =
  "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

const log = (level: string, msg: string) => {
  console.log(
    `[${new Date().toISOString()}] [HEALTH-CHECK] [${level}] ${msg}`
  );
};

async function metaApiFetch(
  url: string,
  token: string,
  options?: RequestInit
) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "auth-token": token,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi ${res.status}`;
    try {
      msg = JSON.parse(body).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret)
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const report: {
    channelsChecked: number;
    accountsChecked: number;
    issuesFound: string[];
    issuesFixed: string[];
    errors: string[];
  } = {
    channelsChecked: 0,
    accountsChecked: 0,
    issuesFound: [],
    issuesFixed: [],
    errors: [],
  };

  try {
    const metaApiToken = (
      process.env.METAAPI_TOKEN ||
      process.env.META_API_TOKEN ||
      ""
    ).trim();

    // 1. Check all active channels have valid linked accounts
    const { data: channels } = await db
      .from("telegram_active_channels")
      .select("*")
      .eq("status", "active");

    if (!channels?.length) {
      return NextResponse.json({
        message: "No active channels",
        report,
      });
    }

    report.channelsChecked = channels.length;
    log("INFO", `Checking ${channels.length} active channels`);

    for (const channel of channels) {
      const settings = (channel.settings as any) || {};
      const linkedAccountId = settings.linkedAccountId;
      const userId = channel.user_id;
      const channelId = channel.channel_id;
      const channelName = channel.channel_name || channelId;

      if (!linkedAccountId) {
        // No linked account — try to link one
        report.issuesFound.push(
          `${channelName}: No linked account`
        );
        const { data: anyAccount } = await db
          .from("slave_accounts")
          .select("id")
          .eq("user_id", userId)
          .is("copier_active", true)
          .limit(1)
          .single();

        if (anyAccount) {
          await db
            .from("telegram_active_channels")
            .update({
              settings: { ...settings, linkedAccountId: anyAccount.id },
            })
            .eq("user_id", userId)
            .eq("channel_id", channelId);
          report.issuesFixed.push(
            `${channelName}: Auto-linked to ${anyAccount.id}`
          );
          log(
            "INFO",
            `Fixed: ${channelName} linked to ${anyAccount.id}`
          );
        } else {
          report.errors.push(
            `${channelName}: No accounts available for user ${userId}`
          );
        }
        continue;
      }

      // Check linked account still exists
      const { data: linkedAccount } = await db
        .from("slave_accounts")
        .select("id, copier_active, metaapi_account_id")
        .eq("id", linkedAccountId)
        .eq("user_id", userId)
        .single();

      if (!linkedAccount) {
        report.issuesFound.push(
          `${channelName}: Linked account ${linkedAccountId} DELETED`
        );
        // Find replacement
        const { data: replacement } = await db
          .from("slave_accounts")
          .select("id")
          .eq("user_id", userId)
          .is("copier_active", true)
          .limit(1)
          .single();

        if (replacement) {
          await db
            .from("telegram_active_channels")
            .update({
              settings: { ...settings, linkedAccountId: replacement.id },
            })
            .eq("user_id", userId)
            .eq("channel_id", channelId);
          report.issuesFixed.push(
            `${channelName}: Re-linked to ${replacement.id}`
          );
          log(
            "INFO",
            `Fixed: ${channelName} re-linked to ${replacement.id}`
          );
        } else {
          report.errors.push(
            `${channelName}: Linked account deleted, no replacement found`
          );
        }
        continue;
      }

      if (!linkedAccount.copier_active) {
        report.issuesFound.push(
          `${channelName}: Account ${linkedAccountId} copier disabled`
        );
        await db
          .from("slave_accounts")
          .update({ copier_active: true })
          .eq("id", linkedAccountId);
        report.issuesFixed.push(
          `${channelName}: Re-enabled copier on ${linkedAccountId}`
        );
        log("INFO", `Fixed: Re-enabled copier on ${linkedAccountId}`);
      }
    }

    // 2. Check all MetaApi accounts are DEPLOYED
    if (metaApiToken) {
      const { data: allAccounts } = await db
        .from("slave_accounts")
        .select("id, metaapi_account_id, user_id, label, login")
        .is("copier_active", true);

      if (allAccounts?.length) {
        report.accountsChecked = allAccounts.length;
        log(
          "INFO",
          `Checking ${allAccounts.length} MetaApi accounts`
        );

        for (const acc of allAccounts) {
          if (!acc.metaapi_account_id) continue;
          try {
            const status = await metaApiFetch(
              `${META_PROV_BASE}/users/current/accounts/${acc.metaapi_account_id}`,
              metaApiToken
            );
            if (status.state === "UNDEPLOYED") {
              const accLabel =
                acc.label || acc.login || acc.metaapi_account_id;
              report.issuesFound.push(
                `MetaApi account ${accLabel} is UNDEPLOYED`
              );
              // Redeploy
              await fetch(
                `${META_PROV_BASE}/users/current/accounts/${acc.metaapi_account_id}/deploy`,
                {
                  method: "POST",
                  headers: { "auth-token": metaApiToken },
                }
              );
              report.issuesFixed.push(
                `MetaApi account ${accLabel}: Redeployed`
              );
              log("INFO", `Fixed: Redeployed ${accLabel}`);
            }
          } catch (e: any) {
            report.errors.push(
              `MetaApi check failed for ${acc.metaapi_account_id}: ${e.message}`
            );
            log(
              "WARN",
              `MetaApi check failed for ${acc.metaapi_account_id}: ${e.message}`
            );
          }
        }
      }
    } else {
      report.errors.push("METAAPI_TOKEN not configured");
    }

    // Log health check results to DB
    try {
      await db.from("telegram_signals").insert({
        channel_id: "SYSTEM",
        user_id: "00000000-0000-0000-0000-000000000000",
        telegram_message_id: 0,
        raw_message: `[HEALTH-CHECK] ${report.issuesFound.length} issues found, ${report.issuesFixed.length} fixed, ${report.errors.length} errors`,
        parsed: report as any,
        status: "self_healed",
      });
    } catch (e: any) {
      log("WARN", `Failed to log health check: ${e.message}`);
    }

    const healthy =
      report.issuesFound.length === 0 && report.errors.length === 0;
    log(
      healthy ? "INFO" : "WARN",
      `Health check complete: ${report.issuesFound.length} issues, ${report.issuesFixed.length} fixed, ${report.errors.length} errors`
    );

    return NextResponse.json({
      healthy,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    log("ERROR", `Health check error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
