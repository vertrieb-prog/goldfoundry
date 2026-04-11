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

function CheckGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        marginBottom: 24,
        padding: '20px 24px',
        background: '#111111',
        border: '1px solid #222222',
        borderRadius: 10,
      }}
    >
      <h4
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#d4af37',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          marginBottom: 12,
        }}
      >
        {title}
      </h4>
      <ul style={{ paddingLeft: 20 }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: 6, color: '#cccccc', fontSize: 14 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AITradeFilteringPage() {
  return (
    <BlogPostLayout
      title="How Trade Filtering Actually Works -- No Black Boxes, No BS"
      date="Mar 28, 2026"
      readTime="5 min"
      relatedArticles={[
        { title: 'Why a Trading Suite Beats 10 Individual EAs', slug: 'why-phantom-suite', readTime: '5 min' },
        { title: 'The Science of Trailing Stops', slug: 'trailing-stop-science', readTime: '4 min' },
        { title: 'Copy Trading Done Right', slug: 'copy-trading-done-right', readTime: '4 min' },
      ]}
    >
      <Heading>The Problem with &quot;Smart EAs&quot;</Heading>
      <P>
        Go to the MQL5 marketplace and search for any EA with &quot;smart&quot; or &quot;intelligent&quot; in the name. You will find hundreds. Most of them cost $200-500. Their descriptions are full of promises about advanced algorithms and sophisticated analysis.
      </P>
      <P>
        Here is what 90% of them actually do: they check if RSI is above 70 or below 30, maybe add a moving average crossover, perhaps look at a Bollinger Band, and call it &quot;intelligent filtering.&quot; These are indicators that have been available for free since the 1990s. Wrapping them in a compiled .ex5 file and adding the word &quot;smart&quot; to the product name does not make them intelligent. It makes them expensive indicators.
      </P>

      <Heading>What Real Filtering Means</Heading>
      <P>
        Real trade filtering is not about checking one or two numbers. It is about understanding context. A trade that looks good on a chart might be terrible when you consider the current spread, the time of day, the correlation with your other open positions, the proximity to a high-impact news event, the current market structure, and a dozen other factors that no single indicator captures.
      </P>
      <P>
        PHANTOM Airbag runs 41 distinct checks on every trade signal before it reaches your account. Not sequentially -- in parallel, in under 200 milliseconds. If any critical check fails, the trade is blocked. If non-critical checks raise warnings, the trade is flagged but allowed through with a note in the log.
      </P>

      <Heading>The 41 Checks, Grouped</Heading>

      <CheckGroup
        title="Technical Analysis (12 checks)"
        items={[
          'Smart Money Concept (SMC) structure validation',
          'Volume profile analysis -- is there enough volume to support this move?',
          'Candle pattern recognition -- does the current price action confirm the signal?',
          'Multi-timeframe alignment -- do H1, H4, and D1 agree?',
          'Support and resistance proximity -- are we trading into a wall?',
          'Trend strength measurement -- is this a real trend or a range?',
          'Momentum confirmation across multiple indicators',
          'Order block detection and validation',
          'Liquidity sweep identification',
          'Fair value gap analysis',
          'Market structure break confirmation',
          'Divergence detection (price vs momentum)',
        ]}
      />

      <CheckGroup
        title="Risk Assessment (10 checks)"
        items={[
          'Spread validation -- is the current spread acceptable for this pair?',
          'Correlation check -- does this trade duplicate risk from open positions?',
          'Drawdown proximity -- how close are we to daily/total limits?',
          'Lot size validation against account risk parameters',
          'Stop loss distance vs ATR -- is the SL realistic for current volatility?',
          'Risk-reward ratio minimum threshold',
          'Maximum open positions check',
          'Maximum exposure per currency check',
          'Margin level validation',
          'Weekend proximity -- should we be opening trades this close to market close?',
        ]}
      />

      <CheckGroup
        title="Timing (9 checks)"
        items={[
          'Trading session validation -- is this the right session for this pair?',
          'News proximity -- is a high-impact event within the buffer window?',
          'Hour-of-day statistics -- does this pair historically perform at this hour?',
          'Day-of-week filter -- some pairs are statistically worse on certain days',
          'Rollover period detection',
          'Low liquidity period identification',
          'Market open/close volatility check',
          'Public holiday detection for relevant markets',
          'End-of-month rebalancing period awareness',
        ]}
      />

      <CheckGroup
        title="Contextual Intelligence (10 checks)"
        items={[
          'Context reasoning -- does the overall market picture support this trade?',
          'Confidence scoring -- how many signals agree vs disagree?',
          'Recent performance analysis -- is the strategy currently in a good phase?',
          'Regime detection -- trending, ranging, or volatile?',
          'Sentiment alignment from multiple data points',
          'Intermarket analysis -- what are correlated markets doing?',
          'Unusual activity detection -- is something abnormal happening?',
          'Pattern completion probability',
          'Historical accuracy for this specific setup type',
          'Composite confidence score with weighted factors',
        ]}
      />

      <Heading>Explainability: Every Decision Has a Reason</Heading>
      <P>
        When Airbag blocks a trade, it does not just say &quot;rejected.&quot; It tells you exactly which checks failed and why. You get a structured log entry that reads like a report: &quot;Trade XAUUSD BUY rejected. Spread check FAILED (current: 45, max: 30). News check FAILED (FOMC in 22 minutes). Confidence score: 34/100 (minimum: 60). 3 of 41 checks failed, 2 critical.&quot;
      </P>
      <P>
        This matters for two reasons. First, you can learn from the filtering. If you see that your strategy consistently generates signals that fail the spread check during Asian session, you know to adjust your strategy&apos;s trading hours. Second, you can trust the system because you can verify its reasoning. There is no mystery, no hidden algorithm, no proprietary black box that you just have to believe in.
      </P>

      <Heading>The Fail-Safe Principle</Heading>
      <P>
        Here is something no other &quot;smart EA&quot; will tell you: what happens when the intelligence layer goes down? If Airbag&apos;s server is unreachable -- internet outage, server maintenance, anything -- trades go through. The system fails open, not closed.
      </P>
      <P>
        Why? Because the worst thing a filter can do is prevent you from trading when you should be trading. If the checks cannot be performed, the base version of your EA operates normally. You might miss some filtering, but you will never miss a trade because of a server hiccup. The base EA on your MT5 terminal always works, regardless of what is happening with external services.
      </P>

      <Heading>Why This Is Different</Heading>
      <P>
        Most EAs that claim to have advanced filtering are doing three things: checking an indicator, checking the time, and maybe checking the spread. That is not filtering. That is a basic entry condition that should have been in the EA already.
      </P>
      <P>
        Airbag runs 41 independent checks across four categories, returns a composite score, logs every decision with full reasoning, and fails safely when it cannot reach its intelligence layer. That is the difference between a marketing claim and an actual system.
      </P>
    </BlogPostLayout>
  );
}
