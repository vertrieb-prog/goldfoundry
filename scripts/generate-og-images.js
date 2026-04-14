/**
 * Generate OG images for Sentinel product pages (1200x630).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '..', 'public', 'sentinel');

const products = [
  { slug: 'guardian', title: 'Phantom Guardian', tagline: 'Prop firm risk manager — automate the rules that save your account.' },
  { slug: 'news-shield', title: 'Phantom News Shield', tagline: 'Never trade through red news again.' },
  { slug: 'trail-pro', title: 'Phantom Trail Pro', tagline: 'Smart trailing stop that locks in profit and lets winners run.' },
  { slug: 'airbag', title: 'Phantom Airbag', tagline: 'AI trade filter — block bad setups before they cost you.' },
  { slug: 'dss', title: 'Phantom Trader DSS', tagline: 'Autonomous AI trader for disciplined edge execution.' },
  { slug: 'copier', title: 'Phantom Copier', tagline: 'Smart trade copier — mirror strategies across accounts instantly.' },
  { slug: '', title: 'PHANTOM Suite', tagline: '14 EAs, 28 listings live on MQL5 Market. Built for serious traders.' },
];

const GOLD = '#d4af37';
const BLACK = '#0a0a0a';
const DARK = '#141414';
const MUTED = '#a8a8a8';

function html(title, tagline) {
  return `<!doctype html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif;}
    body{width:1200px;height:630px;background:${BLACK};color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:80px 90px;background-image:radial-gradient(circle at 85% 20%, rgba(212,175,55,0.18) 0%, transparent 55%);}
    .top{display:flex;align-items:center;gap:14px;}
    .dot{width:28px;height:28px;background:${GOLD};border-radius:50%;}
    .brand{font-family:'JetBrains Mono',monospace;color:${GOLD};font-size:16px;letter-spacing:3px;font-weight:700;}
    h1{font-size:84px;font-weight:800;line-height:1.02;letter-spacing:-2.5px;margin-bottom:28px;}
    p{font-size:32px;color:${MUTED};line-height:1.35;max-width:1020px;font-weight:400;}
    .bottom{display:flex;justify-content:space-between;align-items:flex-end;}
    .pill{display:inline-block;padding:12px 24px;background:${GOLD};color:${BLACK};border-radius:100px;font-weight:700;font-size:18px;letter-spacing:0.5px;}
    .url{font-family:'JetBrains Mono',monospace;color:${MUTED};font-size:18px;letter-spacing:1px;}
  </style></head><body>
    <div class="top">
      <div class="dot"></div>
      <span class="brand">PHANTOM SUITE</span>
    </div>
    <div>
      <h1>${title}</h1>
      <p>${tagline}</p>
    </div>
    <div class="bottom">
      <span class="pill">Live on MQL5 Market</span>
      <span class="url">goldfoundry.de/sentinel</span>
    </div>
  </body></html>`;
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  for (const p of products) {
    await page.setContent(html(p.title, p.tagline), { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const dir = p.slug ? path.join(OUT_DIR, p.slug) : OUT_DIR;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'og.png');
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    console.log(`✓ ${out}`);
  }
  await browser.close();
})();