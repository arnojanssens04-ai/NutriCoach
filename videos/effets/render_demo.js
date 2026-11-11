// node render_demo.js frames t1,t2,...   -> out/demo-<t>.png        (images de contrôle)
// node render_demo.js events             -> out/events.json          (événements sonores déclarés par les effets)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, 'demo.html') + '?render=1&bg=out/demo-bg.jpg'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(400);
  const cmd = process.argv[2];
  if (cmd === 'events') { const ev = await pg.evaluate(() => window.FX_SFX); fs.writeFileSync(path.join(__dirname, 'out', 'events.json'), JSON.stringify(ev, null, 1)); console.log(ev.length, 'événements sonores'); }
  else for (const t of process.argv[3].split(',').map(Number)) { await pg.evaluate(t => window.render(t), t); await pg.screenshot({ path: path.join(__dirname, 'out', `demo-${t}.png`) }); }
  await b.close();
})();
