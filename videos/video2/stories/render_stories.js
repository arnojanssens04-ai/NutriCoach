const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const s of [1,2,3,4,5]) { await p.goto('file://' + path.join(__dirname, 'stories.html') + '?s=' + s); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); await p.screenshot({ path: path.join(__dirname, `story-${s}.png`) }); }
  await b.close(); })();
