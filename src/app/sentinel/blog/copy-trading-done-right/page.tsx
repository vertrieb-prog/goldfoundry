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

export default function CopyTradingPage() {
  return (
    <BlogPostLayout
      title="Copy Trading Done Right -- No $200/Month Subscription Required"
      date="Mar 14, 2026"
      readTime="4 min"
      relatedArticles={[
        { title: 'Why a Trading Suite Beats 10 Individual EAs', slug: 'why-phantom-suite', readTime: '5 min' },
        { title: 'The Prop Firm Survival Guide', slug: 'prop-firm-survival-guide', readTime: '6 min' },
        { title: 'News Events Destroy Accounts', slug: 'news-trading-protection', readTime: '4 min' },
      ]}
    >
      <Heading>The Subscription Trap</Heading>
      <P>
        Trade copiers are one of the most overpriced categories in the MT5 ecosystem. The popular options charge $50 to $200 per month. Per month. That is $600 to $2,400 per year for a tool that does one thing: detect a trade on one account and replicate it on another.
      </P>
      <P>
        Let that sink in. A trade copier does not generate signals. It does not analyze markets. It does not manage risk. It copies trades. The core functionality is straightforward: read a trade event, transform the parameters, send an order. Yet somehow this commands monthly fees that exceed what many traders earn in profit.
      </P>
      <P>
        For a trader running a $10,000 funded account and making $500-800 per month, spending $150/month on a trade copier is giving up 20-30% of profits on infrastructure. That is not a tool fee. That is a partner taking a cut for doing minimal work.
      </P>

      <Heading>PHANTOM Copier: $79. Once. Forever.</Heading>
      <P>
        PHANTOM Copier costs $79 as a one-time purchase. No monthly fees. No per-account charges. No renewal after 12 months. Buy it, install it, use it for as long as you want.
      </P>
      <P>
        It supports cross-broker copying, lot scaling, reverse copy mode, symbol mapping, and sub-2-second execution. Everything the $200/month options offer, without the recurring drain on your trading capital.
      </P>

      <Heading>How It Works</Heading>
      <P>
        The architecture is simple and reliable. The master account runs the PHANTOM Copier EA, which monitors for new trades, modifications, and closures. When a trade event is detected, the details are sent to a lightweight cloud relay. The follower account, also running the PHANTOM Copier EA, picks up the signal and executes the corresponding action.
      </P>
      <P>
        Total latency from master execution to follower execution is under 2 seconds in typical conditions. For most trading strategies, this is effectively instant -- the price difference in a 2-second window is negligible compared to the trade&apos;s target movement.
      </P>
      <P>
        The cloud relay is not a subscription service. It is included with the one-time purchase. It does not store your data, does not analyze your trades, and does not have access to your account credentials. It is a pass-through that ensures reliability when both accounts are not on the same network.
      </P>

      <Heading>Use Cases</Heading>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Copy your own accounts.</strong> You trade on your personal account and want the same trades on your funded account. Or you have two funded accounts with different firms. Instead of placing the same trade manually on each account (risking delays and mistakes), the copier handles it automatically.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Share with friends or team members.</strong> You are part of a trading group. One person generates the signals, and the others copy automatically. No signal service needed, no Telegram delays, no manual execution from a phone while you are at work.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Manage client accounts.</strong> If you manage money for others (with appropriate legal arrangements), the copier lets you trade once on your master account and have every client account follow automatically. Lot scaling ensures each account trades proportionally to its balance.
      </P>

      <Heading>Lot Scaling Explained</Heading>
      <P>
        Not every account should trade the same lot size. A $100,000 account and a $10,000 account copying the same 1.0 lot trade means very different risk levels. PHANTOM Copier offers three scaling modes:
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Fixed:</strong> The follower uses a fixed lot size regardless of what the master trades. Useful when you want consistent position sizes on the follower account.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Multiplier:</strong> The follower multiplies the master&apos;s lot size by a configurable factor. Master trades 0.5 lots, multiplier is 2.0, follower trades 1.0 lots. Simple and predictable.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Risk-based:</strong> The follower calculates its own lot size based on its account balance and the configured risk percentage. Master trades 1.0 lot risking 2% of a $50,000 account. Follower has a $10,000 account and also risks 2%, so it trades 0.2 lots. This is the safest mode because each account always risks the same percentage, regardless of the master&apos;s position size.
      </P>

      <Heading>Reverse Copy: The Contrarian Feature</Heading>
      <P>
        PHANTOM Copier includes a reverse copy mode. When the master buys, the follower sells. When the master sells, the follower buys. Stop loss and take profit are mirrored accordingly.
      </P>
      <P>
        This is not a gimmick. If you are testing a strategy and it is consistently losing, reverse copy lets you profit from its consistency. Some traders use it to hedge: run a trend strategy on one account and reverse-copy it on another as a mean-reversion hedge. The applications are more creative than they first appear.
      </P>

      <Heading>The Math</Heading>
      <P>
        At $79 one-time versus $100/month for a typical subscription copier, the PHANTOM Copier pays for itself in 24 days. After that, every month is pure savings. Over a year, you save $1,121. Over two years, $2,321. That money stays in your trading account where it belongs -- compounding instead of paying someone else&apos;s server bill.
      </P>
    </BlogPostLayout>
  );
}
