// Rend l'animation en MP4 (vertical 9:16).
// Usage : node render.js [preview|final] [--frames t1,t2,...]
//   preview : 540x960, 15 i/s  -> out/preview.mp4
//   final   : 1080x1920, 30 i/s -> out/ashwagandha.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const mode = process.argv[2] || 'preview';
const framesArg = process.argv.indexOf('--frames');
const cfg = mode === 'final' ? { w: 1080, h: 1920, fps: 30 } : { w: 540, h: 960, fps: 15 };
const DUR = 55;
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render=1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  if (framesArg > -1) {
    const ts = process.argv[framesArg + 1].split(',').map(Number);
    for (const t of ts) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(outDir, `frame-${String(t).padStart(5, '0')}.png`) });
    }
    await browser.close();
    return;
  }

  const file = path.join(outDir, mode === 'final' ? 'ashwagandha.mp4' : 'preview.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(cfg.fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', mode === 'final' ? '17' : '24', '-preset', 'medium',
    '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(DUR * cfg.fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.render(t), i / cfg.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (cfg.fps * 5) === 0) process.stdout.write(`${(i / cfg.fps).toFixed(0)}s `);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('\n->', file);
})();
