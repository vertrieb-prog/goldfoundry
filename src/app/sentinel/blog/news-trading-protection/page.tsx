'use client';

import BlogPostLayout from '../../components/BlogPostLayout';

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 22,
        color: '#f5f5f5',
        marginTop: 40,
        marginBottom: 16,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 20 }}>{children}</p>;
}

function NewsExample({ event, date, detail }: { event: string; date: string; detail: string }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        background: '#111111',
        border: '1px solid #222222',
        borderLeft: '3px solid #ff6b6b',
        borderRadius: '0 8px 8px 0',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#f5f5f5', fontWeight: 600 }}>
          {event}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#888888' }}>
          {date}
        </span>
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#cccccc', lineHeight: 1.6 }}>
        {detail}
      </p>
    </div>
  );
}

export default function NewsTradingProtectionPage() {
  return (
    <BlogPostLayout
      title="News Events Destroy Accounts -- Here is How to Protect Yourself Automatically"
      date="Mar 7, 2026"
      readTime="4 min"
      relatedArticles={[
        { title: 'The Prop Firm Survival Guide', slug: 'prop-firm-survival-guide', readTime: '6 min' },
        { title: 'Why a Trading Suite Beats 10 Individual EAs', slug: 'why-phantom-suite', readTime: '5 min' },
        { title: 'The Science of Trailing Stops', slug: 'trailing-stop-science', readTime: '4 min' },
      ]}
    >
      <Heading>Three Letters That Destroy Accounts</Heading>
      <P>
        NFP. FOMC. CPI. If you trade gold, forex, or indices, these three-letter acronyms should be burned into your consciousness. They represent scheduled economic events that move markets more in 3 minutes than most traders expect in 3 days.
      </P>
      <P>
        Non-Farm Payrolls (NFP) is released on the first Friday of every month. The Federal Open Market Committee (FOMC) announces rate decisions eight times per year. Consumer Price Index (CPI) data drops monthly. Each one can move XAUUSD by $15-40 in minutes. And these are just the US events -- every major economy has its own calendar of market-moving releases.
      </P>

      <Heading>Real Examples</Heading>

      <NewsExample
        event="NFP -- March 8, 2024"
        date="8:30 AM ET"
        detail="Actual: +275K vs Expected: +198K. XAUUSD dropped $28 in 3 minutes. Any buy position without proper protection was destroyed. Standard stop losses of 200-300 points were obliterated by the speed of the move."
      />

      <NewsExample
        event="CPI -- February 13, 2024"
        date="8:30 AM ET"
        detail="Core CPI came in at 3.9% vs expected 3.7%. XAUUSD fell $35 in under 5 minutes. Spread widened to 80+ points during the first 30 seconds, triggering stop losses at much worse prices than expected."
      />

      <NewsExample
        event="FOMC Rate Decision -- January 31, 2024"
        date="2:00 PM ET"
        detail="Rate held at 5.25-5.50% as expected, but the statement language shifted hawkish. XAUUSD dropped $22, recovered $15, then dropped another $18 over the next hour. The whipsaw stopped out traders in both directions."
      />

      <P>
        These are not exceptions. This happens every single month. The only question is whether your account is protected when it does.
      </P>

      <Heading>Why Most EAs Skip News Protection</Heading>
      <P>
        Building a news filter requires extra work. The developer has to parse the MT5 economic calendar, categorize events by impact level and currency, calculate time buffers, decide on protection modes, and handle edge cases like unscheduled central bank statements. Most EA developers skip this entirely because it is not what they are selling -- they are selling a signal generator, and news filtering is a separate problem.
      </P>
      <P>
        The result: thousands of EAs on the market that happily open trades 5 minutes before NFP, hold positions through FOMC, and have no idea that CPI is about to drop. The backtest looks great because historical data does not show the 80-point spread spike that happened during the event. Live trading tells a very different story.
      </P>

      <Heading>How News Shield Works</Heading>
      <P>
        News Shield reads the built-in MT5 economic calendar. No external data feed, no additional subscription, no API key. The calendar is part of MT5 and is maintained by MetaQuotes with data from major economic sources.
      </P>
      <P>
        Before each candle close and at configurable intervals, News Shield scans for upcoming events. It filters by impact level (you choose: high only, high + medium, or all events) and by currency (you can protect all currencies or only the ones you trade). When an event falls within the protection window, News Shield takes action.
      </P>

      <Heading>The Three Protection Modes</Heading>
      <P>
        <strong style={{ color: '#d4af37' }}>Close All (safest):</strong> All open positions are closed before the event. No exposure during the release. After the post-event buffer expires, trading resumes normally. This is the recommended mode for prop firm traders where a single event can blow the daily loss limit.
      </P>
      <P>
        <strong style={{ color: '#d4af37' }}>Tighten SL (moderate):</strong> Instead of closing positions, News Shield moves stop losses closer to current price. If the event goes in your favor, you profit. If it goes against you, the tighter stop limits the damage. This mode keeps you in winning trades while reducing downside risk.
      </P>
      <P>
        <strong style={{ color: '#d4af37' }}>Pause EAs (flexible):</strong> News Shield sends a signal to other PHANTOM tools (and compatible third-party EAs) to stop opening new trades. Existing positions remain open and unmodified. This mode prevents new exposure during the event without affecting current positions.
      </P>

      <Heading>Buffer Minutes: The Science of Timing</Heading>
      <P>
        News Shield uses configurable buffer periods before and after events. The defaults are 15 minutes before and 10 minutes after. Here is why those numbers matter.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>15 minutes before:</strong> Spreads typically start widening 5-10 minutes before a major release as liquidity providers pull their orders. Trading during this period means worse fills, wider stops, and artificially inflated costs. The 15-minute buffer ensures you are protected before the spread expansion begins, not just before the data drops.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>10 minutes after:</strong> The initial reaction to a news event is often not the final reaction. Markets frequently spike in one direction, reverse, and then settle on a direction over the following 5-10 minutes. The 10-minute post-event buffer keeps you out during this whipsaw period. Traders who re-enter immediately after a release often get caught in the reversal.
      </P>
      <P>
        You can adjust both buffers. Some traders use 30 minutes before and 20 after for FOMC (which has the press conference 30 minutes after the announcement). Others use 10/5 for lower-impact events. The defaults work well for the majority of situations, and News Shield logs every event it protects against so you can optimize over time.
      </P>

      <Heading>Set It and Forget It</Heading>
      <P>
        Once News Shield is configured, there is nothing to maintain. The MT5 calendar updates automatically. New events appear as central banks schedule them. You do not need to check an economic calendar website, set phone reminders, or manually close trades before each release. The protection is always on, always accurate, and always faster than your manual reaction could be.
      </P>
      <P>
        Your EA does not need to know about news events. News Shield handles that layer. Your EA does not need to know about other EAs. The PHANTOM Suite handles coordination. You focus on your strategy. The tools handle everything else.
      </P>
    </BlogPostLayout>
  );
}
