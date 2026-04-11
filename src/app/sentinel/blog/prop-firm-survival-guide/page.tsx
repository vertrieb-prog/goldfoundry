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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ marginBottom: 20, paddingLeft: 24 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 10, color: '#cccccc' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PropFirmSurvivalGuidePage() {
  return (
    <BlogPostLayout
      title="The Prop Firm Survival Guide -- How to Pass FTMO with Automated Risk Management"
      date="Apr 4, 2026"
      readTime="6 min"
      relatedArticles={[
        { title: 'Why a Trading Suite Beats 10 Individual EAs', slug: 'why-phantom-suite', readTime: '5 min' },
        { title: 'News Events Destroy Accounts', slug: 'news-trading-protection', readTime: '4 min' },
        { title: 'The Science of Trailing Stops', slug: 'trailing-stop-science', readTime: '4 min' },
      ]}
    >
      <Heading>The Numbers Do Not Lie</Heading>
      <P>
        Between 80% and 90% of prop firm challenges fail. That is not a guess -- it is the number that firms themselves have published or that independent researchers have calculated from public leaderboards. For every trader who passes FTMO, MFF, or E8, there are four to nine who do not.
      </P>
      <P>
        The conventional wisdom is that these traders fail because they have bad strategies. But that is only part of the story. A significant number of traders who fail have strategies that would have passed -- if they had not blown through a risk limit on day 6, or taken a massive loss during an unexpected news event, or revenge-traded after a losing streak.
      </P>
      <P>
        The number one reason for prop firm failure is not bad entries. It is bad risk management.
      </P>

      <Heading>The Five Ways Traders Blow Challenges</Heading>
      <BulletList items={[
        'Over-trading after losses. You lose two trades, your brain says "make it back." You double your lot size. You lose again. You are at 4% daily drawdown. One more loss and you are out.',
        'No daily loss limit enforcement. Your EA does not have a hard stop at the firm\'s daily limit. You hit -4.8% and your EA takes one more trade. It goes wrong. You are at -5.2%. Challenge over.',
        'Weekend gaps. You hold positions over the weekend. Monday opens with a 300-pip gap on GBPJPY. Your stop loss was 50 pips away. You just took a 300-pip loss on a position sized for 50.',
        'News events. NFP, CPI, FOMC -- you did not close your positions before the release. XAUUSD moves $25 in 90 seconds. Your trailing stop was 200 points away. It did not matter.',
        'Lot size calculation errors. You are risking 2% per trade but your lot size formula does not account for the current spread, which widened from 15 to 60 points during the Asian session. Your actual risk is 4.5%.',
      ]} />

      <Heading>How Guardian Prevents Each One</Heading>
      <P>
        Guardian was built specifically for prop firm traders. Not as an afterthought feature, not as a checkbox on a marketing page. Every single feature maps directly to a specific way traders fail challenges.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Daily loss limit:</strong> Guardian tracks your realized and unrealized PnL in real-time. When you approach the firm&apos;s daily limit -- configurable per firm, with FTMO, MFF, and E8 presets built in -- Guardian starts closing positions. Not at the limit. Before it. With a configurable buffer so that slippage and spread cannot push you over the edge.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Max drawdown protection:</strong> Same principle, applied to overall drawdown. Guardian knows the difference between a challenge phase (where drawdown is from starting balance) and a funded phase (where drawdown trails). It adjusts automatically.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Lot size enforcement:</strong> Every trade gets its lot size validated against your current balance, the specific instrument&apos;s tick value, the current spread, and your risk percentage. If the calculated lot size would put you over your risk limit, Guardian reduces it. No manual calculation, no spreadsheets, no mistakes.
      </P>
      <P>
        <strong style={{ color: '#f5f5f5' }}>Cooldown after losses:</strong> After consecutive losses, Guardian can enforce a pause period. No trading for N minutes after hitting a loss streak. This prevents the revenge trading cycle that destroys more challenges than any other single behavior.
      </P>

      <Heading>The PHANTOM Stack for Prop Firms</Heading>
      <P>
        While Guardian handles risk management, it works best as part of a coordinated stack. For prop firm challenges, the recommended setup is three tools working together:
      </P>
      <P>
        <strong style={{ color: '#d4af37' }}>Guardian</strong> handles all risk calculations, position sizing, daily limits, and drawdown protection. It is the foundation that makes everything else safe.
      </P>
      <P>
        <strong style={{ color: '#d4af37' }}>News Shield</strong> handles event-based risk. It reads the MT5 economic calendar and automatically protects your positions before high-impact events. You configure the minutes before and after, the impact level threshold, and what action to take (close all, tighten stops, or pause trading).
      </P>
      <P>
        <strong style={{ color: '#d4af37' }}>Trail Pro</strong> handles profit protection. Once you are in a winning trade, Trail Pro uses stepped ATR-based trailing to lock in profits without getting stopped out on normal retraces. It respects Guardian&apos;s risk limits, so it never sets a stop loss that would violate your daily loss threshold.
      </P>

      <Heading>If You Pass with PHANTOM, You Keep Passing</Heading>
      <P>
        Here is what most traders do not think about: the challenge is not the hard part. Staying funded is. The same risk management that helps you pass the challenge is the same risk management that keeps you funded for months and years.
      </P>
      <P>
        Traders who pass challenges through aggressive trading -- overleveraging during a favorable market period -- almost always fail within the first few months of being funded. The market conditions change, their aggressive approach turns into aggressive losses, and they hit the trailing drawdown limit.
      </P>
      <P>
        PHANTOM does not help you get lucky. It helps you survive consistently. The tools enforce the same discipline whether it is day 1 of the challenge or month 12 of being funded. There is no switch to flip, no behavior change needed. The same automated risk management that passes the challenge keeps you passing every day after.
      </P>

      <Heading>The Setup Takes 10 Minutes</Heading>
      <P>
        Select your prop firm from the preset list. Guardian automatically configures daily loss limits, max drawdown thresholds, lot size caps, and trading hour restrictions. Attach News Shield with default settings. Attach Trail Pro with the prop firm profile. That is it.
      </P>
      <P>
        Ten minutes of setup replaces hundreds of hours of manual risk monitoring. And unlike manual discipline, the system does not have bad days, does not get emotional after a loss, and does not "just this once" override the rules.
      </P>
    </BlogPostLayout>
  );
}
