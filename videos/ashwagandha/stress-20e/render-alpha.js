// node render-alpha.js [--land]
//   -> out/stress-20e[_1920x1080]_transparent.mov  (ProRes 4444 + alpha, avec son)
//   -> out/stress-20e[_1920x1080]_fond-vert.mp4    (fond #00FF00, avec son)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const FPS = 30, DUR = 10;
const land = process.argv.includes('--land');
const W = land ? 1920 : 1080, H = land ? 1080 : 1920;
const base = path.join(__dirname, 'out', 'stress-20e' + (land ? '_1920x1080' : ''));
const wav = path.join(__dirname, 'out', 'son.wav');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render=1&alpha=1' + (land ? '&land=1' : ''));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', wav, '-f', 'lavfi', '-i', `color=c=0x00FF00:s=${W}x${H}:r=${FPS}`,
    '-filter_complex', '[0:v]split[a][b];[2:v][b]overlay=shortest=1,format=yuv420p[g]',
    '-map', '[a]', '-map', '1:a', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '9', '-c:a', 'pcm_s16le', '-shortest', base + '_transparent.mov',
    '-map', '[g]', '-map', '1:a', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', base + '_fond-vert.mp4'],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < DUR * FPS; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'png', omitBackground: true });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('ok', base);
})();
