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

export default function TrailingStopSciencePage() {
  return (
    <BlogPostLayout
      title="The Science of Trailing Stops -- Why Stepped ATR Beats Everything Else"
      date="Mar 21, 2026"
      readTime="4 min"
      relatedArticles={[
        { title: 'The Prop Firm Survival Guide', slug: 'prop-firm-survival-guide', readTime: '6 min' },
        { title: 'How Trade Filtering Actually Works', slug: 'ai-trade-filtering-explained', readTime: '5 min' },
        { title: 'Why a Trading Suite Beats 10 Individual EAs', slug: 'why-phantom-suite', readTime: '5 min' },
      ]}
    >
      <Heading>Standard Trailing: The Problem Everyone Ignores</Heading>
      <P>
        The standard trailing stop in MT5 follows price continuously. You set it to 200 points, and the stop loss moves up by 1 point for every 1 point of favorable price movement. This sounds reasonable until you realize what it actually does in practice.
      </P>
      <P>
        Gold (XAUUSD) routinely pulls back $3-5 during a $15 trending move. A standard 200-point trailing stop gets hit on almost every one of these pullbacks. You entered at the right time, you had the right direction, and the trade eventually went $15 in your favor -- but you got stopped out at +$2 because the trail was too tight and too responsive to normal market noise.
      </P>
      <P>
        The result: small wins that should have been big wins. Over time, this destroys your risk-reward ratio. You need a 70%+ win rate to be profitable with tiny trailing stop wins, when you could have a 45% win rate and be very profitable with proper position management.
      </P>

      <Heading>ATR-Based Trailing: Understanding Volatility</Heading>
      <P>
        The Average True Range (ATR) measures how much an instrument typically moves in a given period. If gold&apos;s ATR(14) on the H1 timeframe is $8, that means it normally moves about $8 per hour. A trailing stop set inside this range will get hit by normal price action. A trailing stop set outside this range will only get hit by actual reversals.
      </P>
      <P>
        ATR-based trailing sets the stop loss distance as a multiple of ATR. Instead of a fixed 200 points, you set it to 1.5x ATR. When volatility is high (ATR = $12), the stop is $18 away -- giving room for larger swings. When volatility is low (ATR = $5), the stop tightens to $7.50 -- because the market does not need as much room.
      </P>
      <P>
        This is already a massive improvement over fixed trailing. But Trail Pro takes it one step further.
      </P>

      <Heading>The 4-Step Approach: Jumps Beat Continuous</Heading>
      <P>
        Instead of moving the stop continuously (every tick), Trail Pro moves it in calculated steps. The stop only advances when price has moved far enough to justify the next step. Think of it as a staircase instead of a ramp.
      </P>
      <P>
        Why does this work? Because a continuous trail creates a stop level that is always exactly N points behind the current price. Any pullback of N points triggers it. A stepped trail creates a stop level that is N points behind the last step level, not the current price. A pullback has to go all the way back past the last step to trigger the stop.
      </P>
      <P>
        The four steps are calibrated to lock in profit at meaningful levels. Step 1 moves the stop to break even plus buffer. Step 2 locks in roughly 25% of the move. Step 3 locks in about 50%. Step 4 tightens for the final run. Each step only activates when price has proven it wants to go further.
      </P>
      <P>
        In practical terms: a $15 gold move with a continuous trail at 200 points might stop you out at +$2 on a normal pullback. The same move with a 4-step ATR trail locks in at least +$7.50 at step 3, and gives the trade room to potentially capture +$12-14 before the stop at step 4 gets hit.
      </P>

      <Heading>Break Even with Buffer: Why Exact Entry Is a Mistake</Heading>
      <P>
        Most trailing stop EAs move to break even as their first step. The stop goes to the exact entry price. This feels safe. It is actually a trap.
      </P>
      <P>
        When you enter a trade, you pay spread and commission. On gold, that might be $1.50-3.00 combined. If your break even stop is at the exact entry price, you actually lock in a loss equal to the spread plus commission every time it gets hit. You think you broke even. Your account says otherwise.
      </P>
      <P>
        Trail Pro adds a configurable buffer above break even. If your spread plus commission is $2.00, the break even stop goes to entry +$2.50. Now when the break even stop hits, you actually break even -- or make a tiny profit. This seems like a small detail but it compounds dramatically over hundreds of trades.
      </P>

      <Heading>Partial Close: Lock In and Let It Run</Heading>
      <P>
        The mathematically optimal approach to position management is not all-or-nothing. It is partial closing. Trail Pro can close 30% of your position at the first take-profit level, move the remaining 70% to break even, and then trail the rest with stepped ATR.
      </P>
      <P>
        This achieves two things simultaneously. First, you lock in real profit early, which protects your daily PnL (critical for prop firm traders). Second, you let the majority of the position run for the full move, which preserves your risk-reward ratio.
      </P>
      <P>
        A trader who closes 30% at TP1 and trails the remaining 70% will consistently outperform a trader who either closes everything at TP1 (leaving money on the table) or trails everything (risking the full position on every pullback). The math is clear, and Trail Pro automates the execution so you do not have to watch every tick.
      </P>

      <Heading>Visualizing the Difference</Heading>
      <P>
        Imagine a gold buy trade that goes from $2,300 to $2,315, pulls back to $2,308, then continues to $2,322 before finally reversing.
      </P>
      <P>
        With a standard 200-point trail: stopped at approximately $2,306 during the pullback. Net result: +$6.
      </P>
      <P>
        With stepped ATR trail: Step 1 (break even +buffer) at $2,302.50. Step 2 at $2,307. Step 3 at $2,312 (held through the pullback because $2,308 is above the step 2 level of $2,307). Step 4 at $2,318. Final stop hit at approximately $2,318 on the reversal. Net result: +$18.
      </P>
      <P>
        Same trade. Same entry. Same direction. Three times the profit. That is the difference between a trailing method designed around how markets actually move versus a trailing method that just follows price by a fixed distance.
      </P>
    </BlogPostLayout>
  );
}
