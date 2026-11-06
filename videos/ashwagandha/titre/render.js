// node render.js [frames|video] [--land]
//  frames : images clés de contrôle (out/k*.png)
//  video  : out/titre[_1920x1080]_transparent.mov (ProRes 4444 + alpha + son) et _fond-vert.mp4
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const FPS = 30, DUR = 4.5;
const land = process.argv.includes('--land');
const mode = process.argv.includes('frames') ? 'frames' : 'video';
const W = land ? 1920 : 1080, H = land ? 1080 : 1920;
const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
const base = path.join(out, 'titre' + (land ? '_1920x1080' : ''));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render=1' + (land ? '&land=1' : '') + (mode === 'video' ? '&alpha=1' : ''));
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  if (mode === 'frames') {
    for (const t of [.3, .7, 1.1, 1.6, 2.6, 3.6]) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(out, `k${land ? 'L' : ''}-${t}.png`) });
    }
    return browser.close();
  }
  const wav = path.join(out, 'son.wav');
  if (!fs.existsSync(wav)) execFileSync('python3', [path.join(__dirname, 'audio.py'), wav], { stdio: 'inherit' });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', wav, '-f', 'lavfi', '-i', `color=c=0x00FF00:s=${W}x${H}:r=${FPS}`,
    '-filter_complex', '[0:v]split[a][b];[2:v][b]overlay=shortest=1,format=yuv420p[g]',
    '-map', '[a]', '-map', '1:a', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '9', '-c:a', 'pcm_s16le', '-shortest', base + '_transparent.mov',
    '-map', '[g]', '-map', '1:a', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', base + '_fond-vert.mp4'],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < Math.round(DUR * FPS); i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'png', omitBackground: true });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('ok', base);
})();
