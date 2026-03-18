// src/lib/profit/profit-engine.ts
// ============================================================
// GOLD FOUNDRY — Profit Sharing Engine
// 
// Modell: Follower kopiert Trader via FORGE COPY.
// Wenn Profit entsteht → 40% Gold Foundry, 60% Trader.
// High Water Mark: Trader verdient NUR bei neuem Profit.
// Abrechnung: Monatlich (1. des Monats für Vormonat).
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

const log = (msg: string, data?: any) =>
  console.log(`[${new Date().toISOString()}] [PROFIT-ENGINE] ${msg}`, data ?? "");

const PLATFORM_CUT = 40; // Prozent
const TRADER_CUT = 60;
const VERTRIEB_SHARE = 50; // 50% der Platform Fee geht an Vertrieb

// ══════════════════════════════════════════════════════════════
// AGREEMENT ERSTELLEN (wenn Follower sich an Trader anbindet)
// ══════════════════════════════════════════════════════════════

export async function createProfitAgreement(
  followerAccountId: string,
  masterAccountId: string,
  traderUserId: string,
  followerUserId: string,
  currentEquity: number
) {
  const db = createSupabaseAdmin();

  const { data, error } = await db.from("profit_sharing").insert({
    follower_account_id: followerAccountId,
    master_account_id: masterAccountId,
    trader_user_id: traderUserId,
    follower_user_id: followerUserId,
    platform_cut_pct: PLATFORM_CUT,
    trader_cut_pct: TRADER_CUT,
    hwm_equity: currentEquity,
    hwm_set_at: new Date().toISOString(),
  }).select().single();

  if (error) throw error;

  // Sicherstellen dass trader_earnings existiert
  await db.from("trader_earnings").upsert({
    trader_user_id: traderUserId,
    total_followers: 1,
    active_followers: 1,
  }, { onConflict: "trader_user_id" });

  // Follower-Count updaten
  const { count } = await db.from("profit_sharing")
    .select("*", { count: "exact", head: true })
    .eq("trader_user_id", traderUserId)
    .eq("active", true);

  await db.from("trader_earnings").update({
    active_followers: count ?? 1,
    updated_at: new Date().toISOString(),
  }).eq("trader_user_id", traderUserId);

  log(`Agreement erstellt: Follower ${followerUserId} → Trader ${traderUserId}, HWM: €${currentEquity}`);
  return data;
}

// ══════════════════════════════════════════════════════════════
// MONATLICHE ABRECHNUNG — Das Herzstück
// ══════════════════════════════════════════════════════════════

export async function runMonthlySettlement(): Promise<{
  processed: number;
  totalPlatformFee: number;
  totalTraderPayout: number;
  settlements: any[];
}> {
  const db = createSupabaseAdmin();
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Letzter Tag Vormonat
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1); // 1. des Vormonats

  log(`Settlement für ${periodStart.toISOString().split("T")[0]} → ${periodEnd.toISOString().split("T")[0]}`);

  // Alle aktiven Profit-Sharing Agreements
  const { data: agreements } = await db.from("profit_sharing")
    .select("*, slave_accounts(current_equity, mt_login)")
    .eq("active", true);

  if (!agreements?.length) {
    log("Keine aktiven Agreements");
    return { processed: 0, totalPlatformFee: 0, totalTraderPayout: 0, settlements: [] };
  }

  let totalPlatformFee = 0;
  let totalTraderPayout = 0;
  const settlements: any[] = [];

  for (const agreement of agreements) {
    const currentEquity = Number((agreement.slave_accounts as any)?.current_equity ?? 0);
    const hwm = Number(agreement.hwm_equity);

    // HIGH WATER MARK CHECK
    // Nur wenn aktuelle Equity > HWM = neuer Profit
    const grossProfit = Math.max(currentEquity - hwm, 0);

    if (grossProfit <= 0) {
      log(`Kein Profit für Agreement ${agreement.id}: Equity €${currentEquity} ≤ HWM €${hwm}`);
      
      // Trotzdem Settlement erstellen (für Transparenz)
      await db.from("profit_settlements").insert({
        profit_sharing_id: agreement.id,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
        equity_start: hwm,
        equity_end: currentEquity,
        gross_profit: 0,
        platform_fee: 0,
        trader_payout: 0,
        follower_net_profit: 0,
        status: "completed",
        new_hwm: hwm, // HWM bleibt gleich wenn kein Profit
      });
      continue;
    }

    // PROFIT SPLIT
    const platformFee = Math.round(grossProfit * (PLATFORM_CUT / 100) * 100) / 100;
    const traderPayout = Math.round(grossProfit * (TRADER_CUT / 100) * 100) / 100;
    const followerNet = Math.round((grossProfit - platformFee - traderPayout) * 100) / 100;
    // followerNet sollte ~0 sein (40+60=100%), aber für Rundungsdifferenzen

    // VERTRIEB: 50% der Platform Fee wird an Partner-Netzwerk ausgeschüttet
    const vertriebPool = Math.round(platformFee * (VERTRIEB_SHARE / 100) * 100) / 100;
    const platformNet = Math.round((platformFee - vertriebPool) * 100) / 100;

    // Neuer HWM = aktuelle Equity (Trader verdient erst wieder wenn es darüber geht)
    const newHWM = currentEquity;

    // Idempotency: Check if settlement already exists for this period
    const { data: existingSettlement } = await db.from("profit_settlements")
      .select("id")
      .eq("profit_sharing_id", agreement.id)
      .eq("period_start", periodStart.toISOString().split("T")[0])
      .eq("period_end", periodEnd.toISOString().split("T")[0])
      .limit(1)
      .single();

    if (existingSettlement) {
      log(`Settlement bereits vorhanden für Agreement ${agreement.id}, überspringe`);
      continue;
    }

    // Optimistic concurrency: Only update HWM if it hasn't changed since we read it
    const { data: hwmUpdate, error: hwmError } = await db.from("profit_sharing").update({
      hwm_equity: newHWM,
      hwm_set_at: new Date().toISOString(),
    }).eq("id", agreement.id).eq("hwm_equity", hwm).select().single(); // CAS: only if HWM unchanged

    if (hwmError || !hwmUpdate) {
      log(`HWM-Conflict für Agreement ${agreement.id}: wurde parallel geändert, überspringe`);
      continue;
    }

    const { data: settlement } = await db.from("profit_settlements").insert({
      profit_sharing_id: agreement.id,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
      equity_start: hwm,
      equity_end: currentEquity,
      gross_profit: grossProfit,
      platform_fee: platformFee,
      trader_payout: traderPayout,
      follower_net_profit: followerNet,
      status: "completed",
      new_hwm: newHWM,
    }).select().single();

    // Trader Earnings updaten
    await db.rpc("increment_trader_earnings", {
      p_trader_id: agreement.trader_user_id,
      p_gross: grossProfit,
      p_payout: traderPayout,
      p_fee: platformFee,
    }).catch(async () => {
      // Fallback: manuelles Update
      const { data: existing } = await db.from("trader_earnings")
        .select("*").eq("trader_user_id", agreement.trader_user_id).single();

      if (existing) {
        await db.from("trader_earnings").update({
          lifetime_gross_profit: Number(existing.lifetime_gross_profit) + grossProfit,
          lifetime_trader_payout: Number(existing.lifetime_trader_payout) + traderPayout,
          lifetime_platform_fee: Number(existing.lifetime_platform_fee) + platformFee,
          pending_balance: Number(existing.pending_balance) + traderPayout,
          updated_at: new Date().toISOString(),
        }).eq("trader_user_id", agreement.trader_user_id);
      }
    });

    totalPlatformFee += platformFee;
    totalTraderPayout += traderPayout;
    settlements.push({
      agreement: agreement.id,
      follower: (agreement.slave_accounts as any)?.mt_login,
      grossProfit,
      platformFee,
      platformNet,
      vertriebPool,
      traderPayout,
    });

    // Vertrieb-Provision für den Referrer des Followers verbuchen
    if (vertriebPool > 0) {
      await distributeVertriebCommission(
        db, agreement.follower_user_id, vertriebPool,
        periodStart.toISOString().split("T")[0],
        periodEnd.toISOString().split("T")[0]
      );
    }

    log(`Settlement: Follower ${(agreement.slave_accounts as any)?.mt_login} | Profit: €${grossProfit} | Platform: €${platformFee} (netto: €${platformNet}, Vertrieb: €${vertriebPool}) | Trader: €${traderPayout}`);
  }

  // AUM Update für alle Trader
  const traderIds = [...new Set(agreements.map(a => a.trader_user_id))];
  for (const traderId of traderIds) {
    const { data: traderAgreements } = await db.from("profit_sharing")
      .select("slave_accounts(current_equity)")
      .eq("trader_user_id", traderId)
      .eq("active", true);

    const totalAUM = (traderAgreements ?? []).reduce(
      (s, a) => s + Number((a.slave_accounts as any)?.current_equity ?? 0), 0
    );

    await db.from("trader_earnings").update({
      total_aum: totalAUM,
      current_period_profit: 0, // Reset für neuen Zyklus
      current_period_estimated_payout: 0,
      updated_at: new Date().toISOString(),
    }).eq("trader_user_id", traderId);
  }

  const totalVertrieb = settlements.reduce((s, x) => s + (x.vertriebPool ?? 0), 0);
  log(`Settlement fertig: ${settlements.length} Abrechnungen, Platform: €${totalPlatformFee} (netto: €${Math.round((totalPlatformFee - totalVertrieb) * 100) / 100}, Vertrieb: €${totalVertrieb}), Trader: €${totalTraderPayout}`);

  return { processed: settlements.length, totalPlatformFee, totalTraderPayout, settlements };
}

// ══════════════════════════════════════════════════════════════
// ECHTZEIT-SCHÄTZUNG (zwischen Settlements)
// ══════════════════════════════════════════════════════════════

export async function getRealtimeEstimate(traderUserId: string) {
  const db = createSupabaseAdmin();

  const { data: agreements } = await db.from("profit_sharing")
    .select("*, slave_accounts(current_equity, mt_login, firm_profile)")
    .eq("trader_user_id", traderUserId)
    .eq("active", true);

  if (!agreements?.length) return { followers: [], totalEstimatedPayout: 0, totalAUM: 0 };

  let totalEstPayout = 0;
  let totalAUM = 0;

  const followers = agreements.map(a => {
    const equity = Number((a.slave_accounts as any)?.current_equity ?? 0);
    const hwm = Number(a.hwm_equity);
    const unrealizedProfit = Math.max(equity - hwm, 0);
    const estTraderPayout = unrealizedProfit * (TRADER_CUT / 100);
    const estPlatformFee = unrealizedProfit * (PLATFORM_CUT / 100);

    totalEstPayout += estTraderPayout;
    totalAUM += equity;

    return {
      login: (a.slave_accounts as any)?.mt_login,
      firm: (a.slave_accounts as any)?.firm_profile,
      equity,
      hwm,
      unrealizedProfit: Math.round(unrealizedProfit * 100) / 100,
      estimatedTraderPayout: Math.round(estTraderPayout * 100) / 100,
      estimatedPlatformFee: Math.round(estPlatformFee * 100) / 100,
      profitable: equity > hwm,
    };
  });

  return {
    followers,
    totalEstimatedPayout: Math.round(totalEstPayout * 100) / 100,
    totalAUM: Math.round(totalAUM * 100) / 100,
    followerCount: followers.length,
    profitableFollowers: followers.filter(f => f.profitable).length,
  };
}

// ══════════════════════════════════════════════════════════════
// TRADER DASHBOARD DATA
// ══════════════════════════════════════════════════════════════

export async function getTraderDashboard(traderUserId: string) {
  const db = createSupabaseAdmin();

  // Earnings overview
  const { data: earnings } = await db.from("trader_earnings")
    .select("*").eq("trader_user_id", traderUserId).single();

  // Recent settlements
  const { data: settlements } = await db.from("profit_settlements")
    .select("*, profit_sharing(slave_accounts(mt_login, firm_profile))")
    .in("profit_sharing_id",
      (await db.from("profit_sharing").select("id").eq("trader_user_id", traderUserId)).data?.map(a => a.id) ?? []
    )
    .order("period_end", { ascending: false })
    .limit(20);

  // Realtime estimates
  const realtime = await getRealtimeEstimate(traderUserId);

  // Payout history
  const { data: payouts } = await db.from("affiliate_payouts")
    .select("*")
    .in("affiliate_id",
      (await db.from("affiliate_profiles").select("id").eq("user_id", traderUserId)).data?.map(a => a.id) ?? []
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    earnings: earnings ?? {
      total_followers: 0, active_followers: 0, total_aum: 0,
      lifetime_gross_profit: 0, lifetime_trader_payout: 0,
      pending_balance: 0, total_paid: 0,
    },
    realtime,
    recentSettlements: settlements ?? [],
    payouts: payouts ?? [],
    split: { platform: PLATFORM_CUT, trader: TRADER_CUT },
  };
}

// ══════════════════════════════════════════════════════════════
// FOLLOWER VIEW — Was sieht der Follower?
// ══════════════════════════════════════════════════════════════

export async function getFollowerProfitView(followerUserId: string) {
  const db = createSupabaseAdmin();

  // Alle Agreements wo ich Follower bin
  const { data: agreements } = await db.from("profit_sharing")
    .select("*, master_accounts(name, strategy_type), slave_accounts(current_equity, mt_login)")
    .eq("follower_user_id", followerUserId);

  if (!agreements?.length) return { subscriptions: [], totalFees: 0 };

  const subscriptions: any[] = [];
  let totalFees = 0;

  for (const a of agreements) {
    const equity = Number((a.slave_accounts as any)?.current_equity ?? 0);
    const hwm = Number(a.hwm_equity);
    const unrealized = Math.max(equity - hwm, 0);
    const estFee = unrealized * ((PLATFORM_CUT + TRADER_CUT) / 100); // Was der Follower "zahlt"

    totalFees += estFee;

    // Letzte Settlements
    const { data: setts } = await db.from("profit_settlements")
      .select("*").eq("profit_sharing_id", a.id)
      .order("period_end", { ascending: false }).limit(3);

    subscriptions.push({
      strategyName: (a.master_accounts as any)?.name,
      strategyType: (a.master_accounts as any)?.strategy_type,
      accountLogin: (a.slave_accounts as any)?.mt_login,
      equity,
      hwm,
      currentProfit: Math.round(unrealized * 100) / 100,
      estimatedFee: Math.round(estFee * 100) / 100,
      // Klarstellung: Performance Fee wird separat abgerechnet, nicht vom Konto abgezogen.
      // Der Follower profitiert durch Equity-Wachstum auf seinem Konto.
      feeNote: "Die Performance Fee wird separat abgerechnet — dein Kontostand bleibt davon unberührt.",
      recentSettlements: setts ?? [],
      split: { platform: PLATFORM_CUT, trader: TRADER_CUT },
      active: a.active,
    });
  }

  return { subscriptions, totalEstimatedFees: Math.round(totalFees * 100) / 100 };
}

// ══════════════════════════════════════════════════════════════
// VERTRIEB COMMISSION — 50% der Platform Fee an Partner-Netzwerk
// Verteilt auf bis zu 3 MLM-Ebenen (gleiche Raten wie Abo-Provision)
// ══════════════════════════════════════════════════════════════

async function distributeVertriebCommission(
  db: ReturnType<typeof createSupabaseAdmin>,
  followerUserId: string,
  vertriebPool: number,
  periodStart: string,
  periodEnd: string
) {
  // Upline des Followers finden (wer hat ihn geworben?)
  const { data: profile } = await db.from("profiles")
    .select("referred_by").eq("id", followerUserId).single();

  if (!profile?.referred_by) return; // Kein Referrer → kein Vertrieb

  // Bis zu 3 Ebenen nach oben
  let currentReferrerId: string | null = profile.referred_by;
  const levels = [
    { level: 1, rate: 0.30 }, // L1 bekommt 30% des Vertriebspools (Standard)
    { level: 2, rate: 0.10 }, // L2 bekommt 10%
    { level: 3, rate: 0.05 }, // L3 bekommt 5%
  ];

  for (const { level, rate } of levels) {
    if (!currentReferrerId) break;

    const { data: referrer } = await db.from("profiles")
      .select("id, referred_by, subscription_active")
      .eq("id", currentReferrerId)
      .single();

    if (!referrer) break;

    // Nur Partner mit Builder Pack bekommen Provision
    const { count: packCount } = await db.from("builder_packs")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", referrer.id);

    if (!packCount || packCount === 0) {
      log(`Vertrieb L${level}: Partner ${referrer.id} hat kein Builder Pack — übersprungen`);
      currentReferrerId = referrer.referred_by;
      continue;
    }

    if (!referrer.subscription_active) {
      currentReferrerId = referrer.referred_by;
      continue;
    }

    const commission = Math.round(vertriebPool * rate * 100) / 100;
    if (commission <= 0) break;

    // In commission_log verbuchen
    await db.from("commission_log").insert({
      partner_id: referrer.id,
      from_user_id: followerUserId,
      level,
      amount: commission,
      percentage: rate * 100,
      type: "profit_share",
      month: periodStart.substring(0, 7),
    });

    // FORGE Points gutschreiben (1 FP = €0.10 → commission / 0.10 = FP)
    const fpAmount = Math.round(commission / 0.10);
    if (fpAmount > 0) {
      await db.from("fp_transactions").insert({
        user_id: referrer.id,
        amount: fpAmount,
        type: "profit_share",
        description: `Profit Share L${level}: €${commission} von Follower-Gewinnen`,
      });

      // Balance updaten
      await db.rpc("increment_fp_balance", {
        p_user_id: referrer.id,
        p_amount: fpAmount,
      }).catch(async () => {
        const { data: fp } = await db.from("forge_points")
          .select("balance, total_earned").eq("user_id", referrer.id).single();
        if (fp) {
          await db.from("forge_points").update({
            balance: Number(fp.balance) + fpAmount,
            total_earned: Number(fp.total_earned) + fpAmount,
            updated_at: new Date().toISOString(),
          }).eq("user_id", referrer.id);
        }
      });
    }

    log(`Vertrieb L${level}: Partner ${referrer.id} bekommt €${commission} (${fpAmount} FP) aus Profit Share`);

    currentReferrerId = referrer.referred_by;
  }
}
