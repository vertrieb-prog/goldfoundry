/**
 * MyFXBook API Client — server-only
 * Session caching (valid ~1 month), auto-refresh on error.
 * Credentials come from ENV: MYFXBOOK_EMAIL, MYFXBOOK_PASSWORD
 */

const API = "https://www.myfxbook.com/api";
const EMAIL = process.env.MYFXBOOK_EMAIL ?? "";
const PASSWORD = process.env.MYFXBOOK_PASSWORD ?? "";

let sessionCache: { session: string; ts: number } | null = null;
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // refresh weekly (valid ~1 month)

async function getSession(): Promise<string> {
  if (sessionCache && Date.now() - sessionCache.ts < SESSION_TTL) {
    return sessionCache.session;
  }

  const url = `${API}/login.json?email=${encodeURIComponent(EMAIL)}&password=${encodeURIComponent(PASSWORD)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const data = await res.json();

  if (data.error) {
    throw new Error(`MyFXBook login failed: ${data.message}`);
  }

  // Store raw session as-is from API response
  sessionCache = { session: data.session, ts: Date.now() };
  return data.session;
}

function invalidateSession() {
  sessionCache = null;
}

function buildUrl(endpoint: string, session: string, params: Record<string, string> = {}): string {
  // Session may contain pre-encoded chars — keep as-is, encode other params separately
  const extra = Object.entries(params).map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("");
  return `${API}/${endpoint}?session=${session}${extra}`;
}

async function apiFetch<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const session = await getSession();
  const res = await fetch(buildUrl(endpoint, session, params), {
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();

  // Session expired — retry once
  if (data.error && data.message?.includes("session")) {
    invalidateSession();
    const newSession = await getSession();
    const retryRes = await fetch(buildUrl(endpoint, newSession, params), {
      signal: AbortSignal.timeout(10000),
    });
    return retryRes.json();
  }

  return data;
}

export interface MyfxAccount {
  id: number;
  name: string;
  gain: number;
  absGain: number;
  daily: number;
  monthly: number;
  drawdown: number;
  balance: number;
  equity: number;
  profit: number;
  pips: number;
  deposits: number;
  profitFactor: number;
}

export interface MyfxPortfolio {
  accounts: MyfxAccount[];
  totalGain: number;
  totalBalance: number;
  totalEquity: number;
  totalProfit: number;
  totalDrawdown: number;
  totalDaily: number;
  totalMonthly: number;
}

/** Fetch all accounts + compute totals */
export async function getPortfolio(): Promise<MyfxPortfolio> {
  const data = await apiFetch("get-my-accounts.json");

  if (data.error || !data.accounts) {
    throw new Error(`MyFXBook: ${data.message ?? "no accounts"}`);
  }

  const accounts: MyfxAccount[] = data.accounts.map((a: any) => ({
    id: a.id,
    name: a.name,
    gain: a.gain ?? 0,
    absGain: a.absGain ?? 0,
    daily: a.daily ?? 0,
    monthly: a.monthly ?? 0,
    drawdown: a.drawdown ?? 0,
    balance: a.balance ?? 0,
    equity: a.equity ?? 0,
    profit: a.profit ?? 0,
    pips: a.pips ?? 0,
    deposits: a.deposits ?? 0,
    profitFactor: a.profitFactor ?? 0,
  }));

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = accounts.reduce((s, a) => s + a.equity, 0);
  const totalProfit = accounts.reduce((s, a) => s + a.profit, 0);

  // Weighted gain by deposit
  const totalDeposits = accounts.reduce((s, a) => s + a.deposits, 0);
  const totalGain = totalDeposits > 0
    ? accounts.reduce((s, a) => s + a.gain * (a.deposits / totalDeposits), 0)
    : 0;

  // Max drawdown across accounts
  const totalDrawdown = Math.max(...accounts.map((a) => a.drawdown));

  // Weighted daily/monthly
  const totalDaily = totalDeposits > 0
    ? accounts.reduce((s, a) => s + a.daily * (a.deposits / totalDeposits), 0)
    : 0;
  const totalMonthly = totalDeposits > 0
    ? accounts.reduce((s, a) => s + a.monthly * (a.deposits / totalDeposits), 0)
    : 0;

  return {
    accounts,
    totalGain: Math.round(totalGain * 100) / 100,
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalDrawdown: Math.round(totalDrawdown * 100) / 100,
    totalDaily: Math.round(totalDaily * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
  };
}

/** Force MyFXBook to re-fetch data from the broker for a specific account */
export async function updateAccount(accountId: number): Promise<boolean> {
  try {
    const data = await apiFetch("update-account.json", { id: String(accountId) });
    return !data.error;
  } catch {
    return false;
  }
}

/** Check if account data is stale and trigger update if needed */
export async function refreshStaleAccounts(
  accounts: Array<{ id: number; lastUpdateDate?: string }>,
  maxAgeMs = 60 * 60 * 1000, // 1 hour default
): Promise<number> {
  const now = Date.now();
  let refreshed = 0;

  for (const acc of accounts) {
    if (!acc.lastUpdateDate) {
      await updateAccount(acc.id);
      refreshed++;
      continue;
    }
    const lastUpdate = new Date(acc.lastUpdateDate).getTime();
    if (isNaN(lastUpdate) || now - lastUpdate > maxAgeMs) {
      await updateAccount(acc.id);
      refreshed++;
    }
  }
  return refreshed;
}

/** Fetch daily gain data for a specific account (for chart) */
export async function getDailyGain(accountId: number, startDate: string, endDate: string) {
  const data = await apiFetch("get-daily-gain.json", {
    id: String(accountId),
    start: startDate,
    end: endDate,
  });

  if (data.error || !data.dailyGain) return [];

  return (data.dailyGain as any[]).map((d) => ({
    date: d.date?.[0] ?? d.date,
    value: d.value ?? 0,
    profit: d.profit ?? 0,
  }));
}
