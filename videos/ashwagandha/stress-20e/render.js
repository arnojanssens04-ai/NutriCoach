// node render.js [frames|video] [--land]  ->  out/stress-20e.mp4 (1080x1920) ou out/stress-20e_1920x1080.mp4 (--land), 30 i/s, avec son
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const FPS = 30, DUR = 10;
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mode = process.argv[2] || 'video';
const land = process.argv.includes('--land');
const W = land ? 1920 : 1080, H = land ? 1080 : 1920;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render=1' + (land ? '&land=1' : ''));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  if (mode === 'frames') {
    for (const t of [0.9, 2.3, 3.0, 3.5, 5.0, 6.6, 7.4, 9.4]) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(out, `f${land ? 'L' : ''}-${t}.png`) });
    }
    await browser.close(); return;
  }

  if (!land) execFileSync('python3', [path.join(__dirname, 'audio.py'), path.join(out, 'son.wav')], { stdio: 'inherit' });
  const file = path.join(out, land ? 'stress-20e_1920x1080.mp4' : 'stress-20e.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', path.join(out, 'son.wav'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < DUR * FPS; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('->', file);
})();
