// Usage :
//   node render.js prep                 -> out/layout.json, out/sous-titres.srt, out/tableau.md
//   node render.js frames [t1,t2,...]   -> images clés de contrôle (out/k-*.png)
//   node render.js pass all|subs|vis    -> exports vidéo (voir plus bas)
//     all  : out/video_complete.mp4 (fond + visuels + sous-titres + son)
//     subs : out/sous-titres_transparent.mov + sous-titres_fond-vert.mp4 (sans son)
//     vis  : out/visuels_transparent.mov + visuels_fond-vert.mp4 (avec bruitages)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const FPS = 30, W = 1080, H = 1920;
const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
const [, , cmd = 'prep', arg] = process.argv;
const url = q => 'file://' + path.join(__dirname, 'index.html') + '?render=1&' + q;
const srtT = s => { const ms = Math.round(s * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
const sec = s => s.toFixed(1) + ' s';
const run = (args, stdio) => { const f = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: stdio || ['pipe', 'inherit', 'inherit'] }); f.done = new Promise(r => f.on('close', r)); return f; };
const write = async (ff, b) => { if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const wj = path.join(out, 'words.json');
  if (fs.existsSync(wj) && !process.env.NO_WORDS) { await page.addInitScript(`window.WORDS=${fs.readFileSync(wj, 'utf8')};`); console.log('horaires réels : words.json'); }
  const open = async q => { await page.goto(url(q)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300); };

  if (cmd === 'prep') {
    await open('');
    const L = await page.evaluate(() => window.LAYOUT);
    fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify(L, null, 1));
    fs.writeFileSync(path.join(out, 'sous-titres.srt'), L.chunks.map((c, i) => `${i + 1}\n${srtT(c.t0)} --> ${srtT(c.t1)}\n${c.text}\n`).join('\n'));
    const vis = { sc1: 'Étiquette FATIGUE, 😴 + ✓ « correctement », batterie qui se vide, 🥱', sc2: 'Carte Sommeil ✓, carte « Autre piste ? »', sc3: 'Carte « nutriments · allégation européenne », 8 cases « ? » avec projecteur sur « lesquels ? »', sc4: 'Bandeau de 8 « ? », « Fatigue réduite » + « quand il en manque » ; puis « de l’énergie en plus » barré + ✕', sc5: 'Carte « Les nutriments », 8 tuiles B2, B3, B5, B6, B9, B12, C, Mg une à une', sc6: 'Bandeau ⚠️ « Fatigue qui persiste », carte 👩‍⚕️ « En parler à ton médecin » (≥ 3 s)', sc7: 'Carte « Mange l’esprit tranquille » + 🌿, logo CapSanté' };
    let md = '| Temps | Phrase | Visuel prévu |\n|---|---|---|\n';
    L.scenes.forEach(s => { const segs = L.segs.filter(g => s.segs.includes(g.id)); md += `| ${sec(s.a)} → ${sec(s.b)} | ${segs.map(g => g.text).join(' ')} | ${vis[s.id]} |\n`; });
    fs.writeFileSync(path.join(out, 'tableau.md'), md);
    console.log('durée', L.total, 's' + (L.real ? ' (horaires réels)' : ' (estimée)') + '\n' + md); (L.notes || []).forEach(n => console.log('⚠', n));
  } else if (cmd === 'frames') {
    await open('');
    const L = await page.evaluate(() => window.LAYOUT);
    const ts = arg ? arg.split(',').map(Number) : L.scenes.flatMap(s => [s.a + .9, (s.a + s.b) / 2, s.b - .45]);
    for (const t of ts) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(out, `k-${t.toFixed(2).padStart(6, '0')}.png`) }); }
    console.log(ts.length, 'images');
  } else if (cmd === 'pass') {
    const layer = arg;
    await open(layer === 'all' ? '' : `alpha=1&layer=${layer}`);
    const L = await page.evaluate(() => window.LAYOUT);
    const n = Math.round(L.total * FPS);
    const name = { all: 'video_complete', subs: 'sous-titres', vis: 'visuels' }[layer];
    const voice = path.join(out, 'voix.wav'), hasVoice = fs.existsSync(voice); // aucun effet sonore : seulement ta voix, jamais de bruitage
    let ff;
    if (layer === 'all') {
      ff = run(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', ...(hasVoice ? ['-i', voice] : []), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', ...(hasVoice ? ['-c:a', 'aac', '-b:a', '192k'] : []), '-shortest', '-movflags', '+faststart', path.join(out, `${name}.mp4`)]);
    } else {
      ff = run(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-f', 'lavfi', '-i', `color=c=0x00FF00:s=${W}x${H}:r=${FPS}`,
        '-filter_complex', '[0:v]split[a][b];[1:v][b]overlay=shortest=1,format=yuv420p[g]',
        '-map', '[a]', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '11', '-shortest', path.join(out, `${name}_transparent.mov`),
        '-map', '[g]', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-shortest', '-movflags', '+faststart', path.join(out, `${name}_fond-vert.mp4`)]);
    }
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.render(t), i / FPS);
      const b = layer === 'all' ? await page.screenshot({ type: 'jpeg', quality: 93 }) : await page.screenshot({ type: 'png', omitBackground: true });
      await write(ff, b);
      if (i % 150 === 0) process.stdout.write(`${layer}:${(i / FPS).toFixed(0)}s `);
    }
    ff.stdin.end(); await ff.done; console.log('\nok', layer);
  } else if (cmd === 'compose') {
    // pose les calques transparents sur TA vidéo, en gardant son audio d'origine (aucun son ajouté)
    const src = arg || path.join(__dirname, 'in', 'voix-video.mp4');
    const sub = path.join(out, 'sous-titres_transparent.mov'), vis = path.join(out, 'visuels_transparent.mov');
    const jobs = [['sous-titres_sur_ta_video.mp4', ['-i', src, '-i', sub, '-filter_complex', '[0:v][1:v]overlay=shortest=1,format=yuv420p[v]']],
                  ['visuels_et_sous-titres_sur_ta_video.mp4', ['-i', src, '-i', vis, '-i', sub, '-filter_complex', '[0:v][1:v]overlay=shortest=1[a];[a][2:v]overlay=shortest=1,format=yuv420p[v]']]];
    for (const [name, a] of jobs) { const f = run([...a, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-c:a', 'copy', '-movflags', '+faststart', path.join(out, name)], 'inherit'); await f.done; console.log('ok', name); }
  }
  await browser.close();
})();
