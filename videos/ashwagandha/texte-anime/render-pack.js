// Exporte chaque clip du pack de texte animé.
// Usage : node render-pack.js [--only 1,4] [--frames]   (--frames : une image clé par clip, pour vérifier)
// Sorties dans out/ :
//   NN-nom.mov        ProRes 4444 avec transparence (CapCut, Premiere, Final Cut, DaVinci)
//   NN-nom_vert.mp4   fond vert #00FF00 (n'importe quelle appli avec chroma key)
//   apercu.mp4        tous les clips enchaînés sur un faux fond vidéo (basse déf.)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',').map(n => +n - 1) : null;
const framesOnly = args.includes('--frames');
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const url = q => 'file://' + path.join(__dirname, 'pack.html') + '?render=1&' + q;

function ffmpeg(argv) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.done = new Promise(r => ff.on('close', r));
  return ff;
}
async function write(ff, buf) { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(url('alpha=1'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const clips = await page.evaluate(() => window.CLIP_INFO);

  if (framesOnly) {
    await page.goto(url('')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
    for (let i = 0; i < clips.length; i++) {
      if (only && !only.includes(i)) continue;
      await page.evaluate(([i, t]) => window.render(i, t), [i, clips[i].dur - 0.45]);
      await page.screenshot({ path: path.join(out, `key-${clips[i].name}.png`) });
    }
    await browser.close(); return;
  }

  for (let i = 0; i < clips.length; i++) {
    if (only && !only.includes(i)) continue;
    const { name, dur } = clips[i];
    const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-f', 'lavfi', '-i', `color=c=0x00FF00:s=1080x1920:r=${FPS}`,
      '-filter_complex', '[0:v]split[a][b];[1:v][b]overlay=shortest=1,format=yuv420p[g]',
      '-map', '[a]', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '9', path.join(out, `${name}.mov`),
      '-map', '[g]', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-movflags', '+faststart', path.join(out, `${name}_vert.mp4`)]);
    const n = Math.round(dur * FPS);
    for (let f = 0; f < n; f++) {
      await page.evaluate(([i, t]) => window.render(i, t), [i, f / FPS]);
      await write(ff, await page.screenshot({ type: 'png', omitBackground: true }));
    }
    ff.stdin.end(); await ff.done;
    console.log('✓', name);
  }

  // aperçu enchaîné, fond démo, basse déf.
  if (!only) {
    const p2 = await browser.newPage({ viewport: { width: 540, height: 960 } });
    await p2.goto(url('')); await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(200);
    const pf = 15;
    const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(pf), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', path.join(out, 'apercu.mp4')]);
    for (let i = 0; i < clips.length; i++)
      for (let f = 0; f < Math.round(clips[i].dur * pf); f++) {
        await p2.evaluate(([i, t]) => window.render(i, t), [i, f / pf]);
        await write(ff, await p2.screenshot({ type: 'jpeg', quality: 90 }));
      }
    ff.stdin.end(); await ff.done;
    console.log('✓ apercu');
  }
  await browser.close();
})();
