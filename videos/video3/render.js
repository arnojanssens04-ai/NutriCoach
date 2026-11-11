// node render.js frames t1,t2 | prep | pass   (calque unique transparent : sous-titres + animations)
const { chromium } = require('playwright'); const { spawn, spawnSync } = require('child_process'); const path = require('path'), fs = require('fs');
const FPS = 30, W = 1080, H = 1920, out = path.join(__dirname, 'out'); const [, , cmd = 'prep', arg] = process.argv;
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: W, height: H } });
  await page.addInitScript(`window.WORDS=${fs.readFileSync(path.join(out, 'words.json'), 'utf8')};`);
  const zj = path.join(out, 'zones.json'); if (fs.existsSync(zj)) await page.addInitScript(`window.ZONES=${fs.readFileSync(zj, 'utf8')};`);
  const open = async q => { await page.goto('file://' + path.join(__dirname, 'index.html') + '?' + q); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300); };
  if (cmd === 'prep') { await open(''); fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify(await page.evaluate(() => window.LAYOUT), null, 1)); console.log('layout ok'); }
  else if (cmd === 'frames') { await open('alpha=1'); for (const t of arg.split(',').map(Number)) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(out, `ov-${t}.png`), omitBackground: true }); spawnSync('python3', ['zoom_render.py', '--still', String(t)], { stdio: 'inherit' }); } }
  else if (cmd === 'pass') {
    await open('alpha=1'); const L = await page.evaluate(() => window.LAYOUT); const n = Math.round(L.total * FPS);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '11', path.join(out, 'calque_transparent.mov')], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    for (let i = 0; i < n; i++) { await page.evaluate(t => window.render(t), i / FPS); const buf = await page.screenshot({ type: 'png', omitBackground: true }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 150 === 0) process.stdout.write(i / FPS + 's '); }
    ff.stdin.end(); await done; console.log('ok');
  }
  await b.close();
})();
