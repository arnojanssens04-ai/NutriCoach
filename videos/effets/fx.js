/* Bibliothèque d'effets : reproduit les effets du montage de référence (voir videos/MODELE_MONTAGE_REFERENCE.md).
   Usage :
     const fx = new FX(document.getElementById('stage'));
     fx.titleBars({t0:0,t1:6,lines:['APPRENDS À MONTER','TES VIDÉOS AVEC CLAUDE'],y:270});
     fx.typed({t0:4.6,dur:1.1,text:'COURS DE MONTAGE',x:90,y:300,size:84,heading:true});
     fx.ellipse({t0:8.6,dur:.5,cx:300,cy:400,rx:220,ry:50});
     fx.stamp({t0:61.5,text:'VALIDÉ ✓',x:500,y:1500,rot:-8});
     ...
     function render(t){ fx.render(t); }                      // appelé image par image
     window.FX_SFX = fx.sfx;                                   // événements sonores (rôles de videos/sfx/roles.json)
   Chaque effet enregistre ses événements sonores : l'image et le son partent de la même chronologie. */
class FX {
  constructor(stage){
    this.stage = stage; this.items = []; this.sfx = [];
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'svg'); defs.setAttribute('width', 0); defs.setAttribute('height', 0); defs.style.position = 'absolute';
    defs.innerHTML = '<filter id="fx-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/><feGaussianBlur stdDeviation=".35"/></filter>';
    stage.appendChild(defs);
    this.svg = document.createElementNS(ns, 'svg'); this.svg.setAttribute('class', 'fx-svg'); this.svg.setAttribute('viewBox', '0 0 1080 1920'); stage.appendChild(this.svg);
  }
  static clamp(x, a = 0, b = 1){ return Math.min(b, Math.max(a, x)); }
  static p(t, a, b){ return FX.clamp((t - a) / (b - a)); }
  static eo(x){ return 1 - Math.pow(1 - x, 3); }
  static eio(x){ return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  static eb(x){ const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  _el(cls, html, css){ const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; if (css) Object.assign(e.style, css); this.stage.appendChild(e); return e; }
  _on(role, t, extra){ this.sfx.push(Object.assign({ t, role }, extra || {})); }
  add(item){ this.items.push(item); return item; }
  render(t){ this.items.forEach(i => i.update(t)); }
  _vis(t, a, b, fin = .0, fout = .25){ return Math.min(fin ? FX.p(t, a, a + fin) : (t >= a ? 1 : 0), fout ? 1 - FX.p(t, b - fout, b) : (t <= b ? 1 : 0)); }

  /* 1. Deux bandes blanches, texte noir très gras en majuscules (apparaît d'un coup, s'efface en fondu) */
  titleBars({ t0, t1, lines, y = 270, size = 52, barH = 76, widths }){
    const els = lines.map((s, i) => this._el('fx-bar', s, { top: (y + i * barH) + 'px', height: barH + 'px', fontSize: size + 'px', left: (widths ? 0 : (i === 0 ? 150 : 0)) + 'px' }));
    this.add({ update: t => { const v = this._vis(t, t0, t1, 0, .3); els.forEach(e => e.style.opacity = v); } });
  }
  /* 2. Sous-titres éditoriaux : groupes [{t0,t1,text}], changement sec, petit italique */
  subtitles({ chunks, y = 1190, size = 36 }){
    const e = this._el('fx-sub', '', { top: y + 'px', fontSize: size + 'px', opacity: 1 });
    this.add({ update: t => { const c = chunks.find(c => t >= c.t0 && t < c.t1); e.textContent = c ? c.text : ''; } });
  }
  /* 3. Texte écrit lettre par lettre (machine à écrire) : tableau (craie) ou chat */
  typed({ t0, dur, text, x, y, size = 44, heading = false, role, lines }){
    const e = this._el('fx-chalk' + (heading ? ' h' : ''), '', { left: x + 'px', top: y + 'px', fontSize: size + 'px' });
    this._on(role || (heading ? 'chalk_write' : 'chalk_write'), t0 - .05, { dur: dur + .05 });
    this.add({ update: t => { const k = FX.p(t, t0, t0 + dur); e.style.opacity = t >= t0 ? .95 : 0; e.textContent = text.slice(0, Math.round(k * text.length)); } });
    return e;
  }
  /* 4. Cercle à la craie autour d'un mot (tracé qui se dessine, dépasse un peu son départ) */
  ellipse({ t0, dur = .5, cx, cy, rx, ry, w = 4, fadeAt }){
    const ns = 'http://www.w3.org/2000/svg', p = document.createElementNS(ns, 'path'); p.setAttribute('class', 'ch'); p.setAttribute('stroke-width', w); p.setAttribute('pathLength', 100);
    const a = 6 * Math.PI / 180; const sx = cx + rx * Math.cos(-a), sy = cy + ry * Math.sin(-a);
    p.setAttribute('d', `M${sx} ${sy} A${rx} ${ry} -4 1 1 ${cx + rx * Math.cos(-a + 6.1)} ${cy + ry * Math.sin(-a + 6.1)} A${rx} ${ry} -4 0 1 ${cx + rx * Math.cos(-a + 6.6)} ${cy + ry * Math.sin(-a + 6.6)}`);
    p.setAttribute('stroke-dasharray', 100); p.setAttribute('stroke-dashoffset', 100); this.svg.appendChild(p);
    this._on('chalk_draw', t0, { dur });
    this.add({ update: t => { p.setAttribute('stroke-dashoffset', 100 * (1 - FX.eio(FX.p(t, t0, t0 + dur)))); p.style.opacity = fadeAt ? 1 - FX.p(t, fadeAt, fadeAt + .35) : 1; } });
  }
  /* 5. Coche ou croix dessinée à la craie */
  mark({ t0, kind = 'check', x, y, size = 60, color }){
    const ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'ch');
    const paths = kind === 'check' ? [`M${x} ${y + size * .5} L${x + size * .35} ${y + size * .85} L${x + size} ${y}`] : [`M${x} ${y} L${x + size} ${y + size}`, `M${x + size} ${y} L${x} ${y + size}`];
    const ps = paths.map(d => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'ch'); p.setAttribute('stroke-width', 7); p.setAttribute('pathLength', 100); p.setAttribute('stroke-dasharray', 100); p.setAttribute('stroke-dashoffset', 100); if (color) p.style.stroke = color; this.svg.appendChild(p); return p; });
    this._on('chalk_tick', t0 + .02);
    this.add({ update: t => ps.forEach((p, i) => p.setAttribute('stroke-dashoffset', 100 * (1 - FX.eo(FX.p(t, t0 + i * .12, t0 + i * .12 + .22))))) });
  }
  /* 6. Nombre qui monte (puis se pose) */
  countup({ t0, dur, from, to, x, y, size = 72, fmt }){
    const e = this._el('fx-num', '', { left: x + 'px', top: y + 'px', fontSize: size + 'px' }); const f = fmt || (n => Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' '));
    this._on('countup', t0, { dur }); this._on('number_land', t0 + dur);
    this.add({ update: t => { const k = FX.p(t, t0, t0 + dur); e.style.opacity = t >= t0 ? 1 : 0; e.textContent = f(from + (to - from) * FX.eo(k)); const s = t > t0 + dur ? 1 + .12 * Math.sin(FX.p(t, t0 + dur, t0 + dur + .25) * Math.PI) : 1; e.style.transform = `scale(${s})`; } });
  }
  /* 7. Carte crème qui glisse depuis le bas (contenu libre) */
  card({ t0, t1, x = 135, y = 1500, w = 810, h = 200, html, slide = 60, role = 'card_slide' }){
    const e = this._el('fx-card fx', html, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    this._on(role, t0 + .12);
    this.add({ update: t => { const k = FX.eo(FX.p(t, t0, t0 + .32)), v = k * (1 - FX.p(t, t1 - .3, t1)); e.style.opacity = v; e.style.transform = `translateY(${(1 - k) * 300 + 0 * slide}px)`; } });
    return e;
  }
  /* 8. Fenêtre de chat : message tapé, points de suspension, réponse + ding */
  chat({ t0, t1, x = 135, y = 1480, w = 810, user, reply, typeDur = .9, name = 'Assistant', tag = 'ASSISTANT IA' }){
    const ast = '<svg class="fx-ast" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1l2.4 7.6L22 6l-5.2 6 5.2 6-7.6-2.6L12 23l-2.4-7.6L2 18l5.2-6L2 6l7.6 2.6z"/></svg>';
    const e = this._el('fx-card fx', `<div class="hd">${ast}<span>${name}</span><span class="tag">${tag}</span></div><div class="body" style="padding:18px 26px;min-height:150px;position:relative"><div class="u" style="text-align:right;min-height:64px"></div><div class="r" style="margin-top:14px;font-size:30px;font-weight:700;min-height:40px"></div></div>`, { left: x + 'px', top: y + 'px', width: w + 'px' });
    const u = e.querySelector('.u'), r = e.querySelector('.r'); const tdots = t0 + .35 + typeDur + .35, trep = tdots + .75;
    this._on('card_slide', t0 + .12); this._on('typing_medium', t0 + .35, { dur: typeDur }); this._on('ding', trep);
    this.add({ update: t => { const k = FX.eo(FX.p(t, t0, t0 + .32)), v = k * (1 - FX.p(t, t1 - .3, t1)); e.style.opacity = v; e.style.transform = `translateY(${(1 - k) * 300}px)`;
      const n = Math.round(FX.p(t, t0 + .35, t0 + .35 + typeDur) * user.length); u.innerHTML = n ? `<span class="fx-bubble">${user.slice(0, n)}</span>` : '';
      r.innerHTML = t >= trep ? reply : (t >= tdots - .35 + typeDur * 0 && t >= t0 + .35 + typeDur + .2 ? '<span class="fx-dots"><i></i><i></i><i></i></span>' : ''); } });
  }
  /* 9. Tableau (liste à lignes horodatées) + tampon par-dessus */
  table({ t0, t1, x = 135, y = 1460, w = 810, title = 'TABLEAU', status = 'à valider', rows }){
    const ast = '<svg class="fx-ast" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1l2.4 7.6L22 6l-5.2 6 5.2 6-7.6-2.6L12 23l-2.4-7.6L2 18l5.2-6L2 6l7.6 2.6z"/></svg>';
    const e = this._el('fx-card fx', `<div class="hd">${ast}<span style="font-family:Mono,monospace;font-weight:500;letter-spacing:.14em;font-size:24px;color:#8A6D2F">${title}</span><span class="tag">${status}</span></div>` + rows.map(r => `<div class="row"><span class="ts">${r[0]}</span><span>${r[1]}</span></div>`).join(''), { left: x + 'px', top: y + 'px', width: w + 'px' });
    this._on('card_slide', t0 + .12);
    this.add({ update: t => { const k = FX.eo(FX.p(t, t0, t0 + .32)), v = k * (1 - FX.p(t, t1 - .3, t1)); e.style.opacity = v; e.style.transform = `translateY(${(1 - k) * 320}px)`; } });
    return e;
  }
  stamp({ t0, t1, text = 'VALIDÉ ✓', x, y, rot = -8, size = 56 }){
    const e = this._el('fx-stamp fx', text, { left: x + 'px', top: y + 'px', fontSize: size + 'px' });
    this._on('stamp', t0);
    this.add({ update: t => { const k = FX.p(t, t0, t0 + .2), v = (t >= t0 ? 1 : 0) * (t1 ? 1 - FX.p(t, t1 - .3, t1) : 1); e.style.opacity = v; e.style.transform = `rotate(${rot}deg) scale(${2.4 - 1.4 * FX.eo(k)})`; } });
  }
  /* 10. Étiquette « À RETENIR » qui se colle en biais */
  sticker({ t0, t1, text = 'À RETENIR', x, y, rot = -4, size = 40, w = 360, h = 100 }){
    const e = this._el('fx-sticker fx', text, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', fontSize: size + 'px' });
    this._on('sticker_in', t0);
    this.add({ update: t => { const k = FX.p(t, t0, t0 + .28), v = (t >= t0 ? 1 : 0) * (1 - FX.p(t, t1 - .35, t1)); e.style.opacity = v; e.style.transform = `rotate(${rot}deg) scale(${.55 + .45 * FX.eb(k)})`; } });
  }
  /* 11. Barre de progression « EN COURS… » puis « TERMINÉ ✓ » (+ ding) */
  progress({ t0, dur, t1, x = 135, y = 1500, w = 810, label = 'MONTAGE EN COURS…', done = 'MONTAGE TERMINÉ ✓' }){
    const e = this._el('fx-prog fx', `<div class="lb" style="font-size:30px">${label}</div><div class="tr"><div class="fl"></div></div>`, { left: x + 'px', top: y + 'px', width: w + 'px' });
    const lb = e.querySelector('.lb'), fl = e.querySelector('.fl');
    this._on('card_slide', t0 + .1); this._on('progress', t0 + .3, { dur }); this._on('ding', t0 + .3 + dur + .05);
    this.add({ update: t => { const k = FX.eo(FX.p(t, t0, t0 + .28)), pr = FX.p(t, t0 + .3, t0 + .3 + dur); e.style.opacity = k * (1 - FX.p(t, t1 - .3, t1)); e.style.transform = `translateY(${(1 - k) * 200}px)`; fl.style.width = (pr * 100) + '%'; lb.textContent = pr >= 1 ? done : label; } });
  }
}
window.FX = FX;
