
/* style des sous-titres : ?style=1 (karaoké jaune), 2 (accent jaune), 3 (accent menthe, par défaut) */
document.body.classList.add('ss'+((new URLSearchParams(location.search)).get('style')||'3'));

/* ---------- où est ton visage ? (mesuré dans ta vidéo) : rien ne doit passer dessus ---------- */
const ZN=Object.assign({closeups:[],faces:[],nodet:[]},window.ZONES||{});
const ZC={x:540,y:700}, INTRO_END=9.0;
const ZP=[]; const smooth=x=>x*x*(3-2*x);
function zoomAt(t){ let s=1; ZP.forEach(z=>{ const u=clamp((t-z.t0)/z.in), v=clamp((t-z.t0-z.in-z.hold)/z.out); s+=z.amp*smooth(u)*(1-smooth(v)); }); return s; }
function fbAt(t){
  let v;
  if(ZN.nodet.some(([a,b])=>t>=a&&t<=b)) v=1630;
  else{ let m=0,found=false; ZN.faces.forEach(([ft,x,y,w,h])=>{ if(Math.abs(ft-t)<=.3){ m=Math.max(m,y+h+60); found=true; } });
    if(found) v=m; else{ let best=1630,bd=9; ZN.faces.forEach(([ft,x,y,w,h])=>{ const d=Math.abs(ft-t); if(d<bd){ bd=d; best=y+h+60; } }); v=bd<=1.0?best:1630; } }
  v=ZC.y+(v-ZC.y)*zoomAt(t);
  if(t<INTRO_END+.3) v=Math.max(v,1260);
  return v; }
function topLimitAt(t){ let s=0,n=0; for(let d=-.2;d<=.2001;d+=.05){ s+=fbAt(t+d); n++; } return Math.max(1075,s/n+12); }

/* ---------- cues ---------- */
const EV={subs:[],vis:[]}; const Q={};
Q.res3=wt('s3','résidus'); Q.pest3=wt('s3','pesticides');
Q.res4=wt('s4','résidus'); Q.enc=wt('s4','encadrés'); Q.lim=wt('s4','limites');
Q.efsa=wt('s5','lefsa'); Q.tres=wt('s5','très'); Q.faible=wt('s5','faible');
Q.arret=wt('s6','arrêter');
Q.pas=wt('s7','pas'); Q.beau=wt('s7','beaucoup'); Q.posi=wt('s7','positifs');
Q.red8=wt('s8','réduire'); Q.res8=wt('s8','résidus');
Q.tiers=wt('s10','tiers'); Q.revue=wt('s10','revue');
Q.abo=wt('s11','tabonner'); Q.mange=wt('s11','mange');

/* ---------- zooms : seulement aux vrais moments « étonnants » ---------- */
[ ['s1','stop',.07,'« Stop ! » : l’accroche'], ['s5','faible',.08,'« risque très faible » : la bonne nouvelle'],
  ['s7','pas',.10,'« pas du tout » : la réponse qui surprend'], ['s10','tiers',.08,'« d’un tiers » : le chiffre' ] ]
  .forEach(([id,key,amp,why])=>ZP.push({t0:wt(id,key)-.05,in:.15,hold:.9,out:.4,amp,why}));

/* ---------- fenêtres d'affichage des animations ---------- */
const SC=[
 {id:'c3', a:Q.res3-.3, b:SEG.s3.t1+.5, desc:'🍎 + petits points qui apparaissent (les résidus)', say:'…il y a des résidus de pesticides.'},
 {id:'c4', a:Q.res4-.3, b:SEG.s4.t1+.5, desc:'Jauge : l’aiguille reste dans le vert, sous la zone rouge « limite »', say:'…ces résidus sont encadrés par des limites.'},
 {id:'c5', a:Q.efsa-.3, b:SEG.s5.t1+.5, desc:'Bouclier « EFSA » qui se coche + barre de risque « très faible »', say:'…l’EFSA juge le risque très faible.'},
 {id:'c6', a:Q.arret-.3, b:SEG.s6.t1+.5, desc:'🍎 + bulle « ? » qui rebondit', say:'…est-ce que tu devrais arrêter de consommer cette pomme ?'},
 {id:'c7', a:Q.pas-.3,   b:Q.beau-.15,    desc:'✓ vert qui se dessine', say:'Eh bien pas du tout…'},
 {id:'c7b',a:Q.beau-.2,  b:SEG.s7.t1+.6,  desc:'Balance qui penche du côté positif', say:'…beaucoup plus d’aspects positifs que négatifs.'},
 {id:'c8', a:Q.red8-.7,  b:Q.res8+1.2,    desc:'Les points s’envolent, ✨', say:'…réduire ces résidus.'},
 {id:'c9', a:SEG.s9.t0-.1, b:SEG.s9.t1+.6, desc:'Robinet, eau qui coule sur la pomme', say:'Tout simplement en rinçant le fruit sous l’eau.'},
 {id:'c10',a:Q.tiers-.4, b:SEG.s10.t1+.6, desc:'Camembert qui se remplit à 1/3 « résidus en moins » · selon une revue', say:'…réduire déjà d’un tiers les résidus supplémentaires selon une revue.'},
 {id:'c11',a:Q.abo-.4,   b:Q.mange-.12,   desc:'🔔 qui sonne + « S’abonner »', say:'…n’hésite pas à t’abonner…'},
 {id:'c12',a:Q.mange-.1, b:TOTAL,         desc:'🌿 qui pousse', say:'…et mange l’esprit tranquille.'},
];
for(let i=0;i<SC.length-1;i++){ if(SC[i].b>SC[i+1].a) SC[i].b=Math.max(SC[i].a+.7,SC[i+1].a); }
/* le texte ne remonte que pendant de vrais temps sans animation (les trous < 1,5 s sont ignorés : pas de yoyo) */
const PRES=[]; SC.forEach(s=>{ const l=PRES[PRES.length-1]; if(l&&s.a-l[1]<1.5) l[1]=s.b; else PRES.push([s.a,s.b]); });
const NOTES=[];

/* ---------- rythme ---------- */
const EMOT=[]; SEGS.forEach(s=>s.words.forEach(w=>{ if(w.emo) EMOT.push(w.t0); }));
const RYTHME=(()=>{ const ev=[...ZP.map(z=>z.t0),...SC.map(s=>s.a),...EMOT,Q.pest3,Q.enc,Q.lim,Q.tres,Q.faible,Q.posi,Q.revue].filter(t=>t>=INTRO_END).sort((a,b)=>a-b); let mg=0,at=0; for(let i=1;i<ev.length;i++){ if(ev[i]-ev[i-1]>mg){ mg=ev[i]-ev[i-1]; at=ev[i-1]; } }
  return {events:ev.map(x=>+x.toFixed(2)),maxGap:+mg.toFixed(2),maxGapAt:+at.toFixed(2),count:ev.length}; })();

/* ---------- DOM ---------- */
const SVGNS='http://www.w3.org/2000/svg';
function mk(parent,tag,attrs){ const e=document.createElementNS(SVGNS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); parent.appendChild(e); return e; }
const DOTS=Array.from({length:10},(_,i)=>{ const a=(i*36+12)*Math.PI/180, r=92+(i%3)*14; return {x:190+Math.cos(a)*r*1.25,y:100+Math.sin(a)*r*.8,r:6+(i%3)*2.2,ph:i*.7,a}; });
const D3=DOTS.map(d=>mk($('#v3-dots'),'circle',{r:d.r,fill:'#EFE9DC',stroke:'#14201A','stroke-width':3}));
const D8=DOTS.map(d=>mk($('#v8-dots'),'circle',{r:d.r,fill:'#EFE9DC',stroke:'#14201A','stroke-width':3}));
const SEGR=[0,1,2,3,4].map(i=>mk($('#e-seg'),'rect',{x:236+i*50,y:82,width:42,height:34,rx:10,fill:i===0?'#6FCF7A':'rgba(255,255,255,.4)',stroke:'#fff','stroke-width':3,opacity:i===0?0:1}));
const DR=[0,1,2].map(i=>mk($('#w-drops'),'circle',{r:7,fill:'#5CC8FF',stroke:'#fff','stroke-width':2}));
const SB=$('#subs');
CH.forEach(c=>{ const d=document.createElement('div'); d.className='sb';
  d.innerHTML='<div>'+c.words.map(w=>`<span class="w${w.key?' k':''}">${w.raw}${w.emo?`<span class="em">${w.emo}</span>`:''}</span>`).join(' ')+'</div>';
  SB.appendChild(d); c.el=d; c.ws=[...d.querySelectorAll('.w')]; c.ems=c.ws.map(s=>s.querySelector('.em')); });
CH.forEach((c,i)=>{ const nx=CH[i+1]; c.show0=c.t0-.05; c.show1=Math.min(c.t1+.3, nx?nx.t0-.05:1e9); });

/* ---------- helpers ---------- */
function sc(el,t,st,ox,oy,{d=.4,rot=0,dy=0}={}){ const k=p(t,st,st+d); el.style.opacity=clamp(k*3); el.style.transformOrigin=`${ox}px ${oy}px`; el.style.transform=`translateY(${(1-eo(k))*20+dy}px) scale(${.5+.5*eb(k)}) rotate(${rot}deg)`; return k; }
function setp(el,attrs){ Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); }

/* ---------- rendu ---------- */
let LASTPOS={};
function render(t){
  const top=topLimitAt(t);
  const allowed=clamp((1180-top)/30,0,1);
  let pres=0; PRES.forEach(([A,B])=>{ pres=Math.max(pres,Math.min(p(t,A,A+.3),1-p(t,B-.3,B))); });
  const a=clamp(pres)*allowed;
  const noAnimBottom=Math.min(top+165,1850), withAnimBottom=Math.max(1450,top+362);
  const textBottom=noAnimBottom+(withAnimBottom-noAnimBottom)*a;
  $('#anim').style.transform=`translateY(${top}px)`;
  SB.style.transform=`translateY(${textBottom-140}px)`;
  LASTPOS={t,top,textBottom,a,zoom:zoomAt(t)};
  SC.forEach(s=>{ const el=$('#'+s.id); const v=Math.min(p(t,s.a,s.a+.25),1-p(t,s.b-.25,s.b))*allowed; el.style.opacity=clamp(v); el.style.visibility=v<=.001?'hidden':'visible'; });

  /* 3 : résidus = petits points autour de la pomme */
  { sc($('#v3-apple'),t,Q.res3-.25,190,100,{rot:Math.sin(t*3)*2});
    DOTS.forEach((d,i)=>{ const k=p(t,Q.res3+i*.07,Q.res3+i*.07+.35), pulse=t>Q.pest3?1+.18*Math.sin((t-Q.pest3)*9-i):1;
      setp(D3[i],{cx:d.x,cy:d.y+Math.sin(t*2+d.ph)*3,opacity:clamp(k*3),transform:`translate(${d.x} ${d.y}) scale(${(.3+.7*eb(k))*pulse}) translate(${-d.x} ${-d.y})`}); }); }
  /* 4 : jauge, l'aiguille reste dans le vert */
  { const k=p(t,Q.res4-.25,Q.res4+.15), pct=.27*eo(p(t,Q.res4,Q.res4+.7))+(t>Q.res4+.7?Math.sin((t-Q.res4)*3)*.012:0);
    $('#v4').style.opacity=clamp(k*3); setp($('#g-needle'),{transform:`rotate(${-90+180*pct} 190 165)`});
    $('#g-lim').setAttribute('stroke-dasharray',`${14*eo(p(t,Q.enc,Q.enc+.4))} 100`); $('#g-lab').setAttribute('opacity',clamp(p(t,Q.lim,Q.lim+.25))); }
  /* 5 : bouclier EFSA + barre de risque */
  { sc($('#e-shield'),t,Q.efsa-.25,100,95); $('#e-check').setAttribute('stroke-dashoffset',100*(1-eo(p(t,Q.efsa+.25,Q.efsa+.75))));
    $('#e-risk').style.opacity=clamp(p(t,Q.tres-.2,Q.tres+.2)); SEGR[0].setAttribute('opacity',clamp(p(t,Q.tres,Q.tres+.3)));
    $('#e-lab').setAttribute('opacity',clamp(p(t,Q.faible,Q.faible+.25))); }
  /* 6 : arrêter ? */
  { sc($('#v6-apple'),t,Q.arret-.2,110,100,{rot:Math.sin(t*6)*4*p(t,Q.arret,Q.arret+.3)}); sc($('#v6-q'),t,Q.arret,236,70,{dy:t>Q.arret+.4?-Math.abs(Math.sin((t-Q.arret)*3.5))*14:0}); }
  /* 7 : ✓ qui se dessine */
  { $('#y-ring').setAttribute('stroke-dashoffset',100*(1-eo(p(t,Q.pas-.1,Q.pas+.35)))); $('#y-chk').setAttribute('stroke-dashoffset',100*(1-eo(p(t,Q.pas+.2,Q.pas+.55))));
    const k=p(t,Q.pas+.5,Q.pas+.85); $('#v7').style.transform=`scale(${1+.12*Math.sin(k*Math.PI)})`; }
  /* 7b : balance */
  { const k=p(t,Q.beau-.25,Q.beau+.1); $('#v7b').style.opacity=clamp(k*3);
    const ang=-15*eo(p(t,Q.posi-.1,Q.posi+.55))+(t<Q.posi?Math.sin((t-Q.beau)*5)*4*p(t,Q.beau,Q.beau+.3):0);
    $('#b-beam').setAttribute('transform',`rotate(${ang} 200 62)`); $('#b-l').setAttribute('transform',`rotate(${-ang} 60 68)`); $('#b-r').setAttribute('transform',`rotate(${-ang} 340 68)`); }
  /* 8 : les points s'envolent */
  { const u=p(t,Q.red8,Q.red8+.9); sc($('#v8-apple'),t,Q.red8-.75,190,100);
    DOTS.forEach((d,i)=>{ const k=p(t,Q.red8-.7+i*.04,Q.red8-.7+i*.04+.3), fly=1+2.2*eo(u), x=190+(d.x-190)*fly, y=100+(d.y-100)*fly-60*eo(u);
      setp(D8[i],{cx:x,cy:y,opacity:clamp(k*3)*(1-eo(u)),transform:`translate(${x} ${y}) scale(${(1-eo(u))}) translate(${-x} ${-y})`}); });
    sc($('#v8-spark'),t,Q.red8+.3,282,58,{rot:Math.sin(t*5)*8}); }
  /* 9 : rinçage */
  { $('#w-stream').setAttribute('stroke-dashoffset',-(t*95)); sc($('#w-apple'),t,SEG.s9.t0-.05,177,150);
    DR.forEach((c,i)=>{ const ph=(t*2.2+i*.34)%1; setp(c,{cx:177+(i-1)*34*(.4+ph),cy:128+ph*36,opacity:1-ph*.9}); }); }
  /* 10 : camembert 1/3 */
  { $('#t-arc').setAttribute('stroke-dasharray',`${33.3*eo(p(t,Q.tiers-.1,Q.tiers+.9))} 100`); $('#t-frac').setAttribute('opacity',clamp(p(t,Q.tiers+.5,Q.tiers+.8))); $('#t-rev').setAttribute('opacity',clamp(p(t,Q.revue-.1,Q.revue+.25))); }
  /* 11 : cloche */
  { const u=t-Q.abo, sw=u>0?24*Math.exp(-2.6*u)*Math.sin(15*u):0; setp($('#n-bell'),{transform:`rotate(${sw} 110 50)`}); $('#n-bell').style.opacity=clamp(p(t,Q.abo-.35,Q.abo-.05));
    [$('#n-r1'),$('#n-r2')].forEach((r,i)=>{ const ph=((t-Q.abo)*1.4+i*.5)%1; if(u>0){ setp(r,{r:40+ph*60,opacity:.7*(1-ph)}); } });
    sc($('#n-pill'),t,Q.abo-.1,305,100); }
  /* 12 : feuille qui pousse */
  { const k=p(t,Q.mange-.05,Q.mange+.5); const el=$('#l-leaf'); el.style.opacity=clamp(k*3); el.style.transformOrigin='120px 150px'; el.style.transform=`scale(${.3+.7*eb(k)}) rotate(${Math.sin(t*2.2)*3}deg)`;
    $('#l-sp1').setAttribute('opacity',clamp(p(t,Q.mange+.4,Q.mange+.6))*(.5+.5*Math.sin(t*6))); $('#l-sp2').setAttribute('opacity',clamp(p(t,Q.mange+.6,Q.mange+.8))*(.5+.5*Math.sin(t*6+2))); }

  /* sous-titres */
  CH.forEach(c=>{ const on=t>=c.show0&&t<c.show1; const k=p(t,c.show0,c.show0+.14); c.el.style.opacity=on?clamp(k*1.5):0; c.el.style.transform=`translateY(${(1-eo(k))*10}px)`;
    if(on) c.ws.forEach((s,i)=>{ const w=c.words[i]; const cur=t>=w.t0&&t<w.t1+.08, done=t>=w.t1+.08; s.className='w'+(w.key?' k':'')+(done?' done':'')+(cur?' cur':'');
      const em=c.ems[i]; if(em){ const q=p(t,w.t0,w.t0+.3); em.style.opacity=clamp(q*3); em.style.transform=`scale(${.4+.6*eb(q)})`; } }); });
}
window.render=render; window.positionsAt=t=>{ render(t); return LASTPOS; };
window.LAYOUT={notes:NOTES,real:window.LAYOUT_REAL,words:SEGS.flatMap(g=>g.words.map(w=>({seg:g.id,raw:w.raw.replace(/ /g,' ')}))),total:TOTAL,
  segs:SEGS.map(s=>({id:s.id,text:s.text.replace(/[|*]/g,m=>m==='|'?' / ':'').replace(/\{[^}]*\}/g,''),t0:s.t0,t1:s.t1})),
  chunks:CH.map(c=>({seg:c.seg,t0:c.show0,t1:c.show1,text:c.words.map(w=>w.raw).join(' ').replace(/ /g,' ')})),
  badges:SC.map(s=>({id:s.id,a:s.a,b:s.b,desc:s.desc,say:s.say})),pres:PRES,zooms:ZP,zoomCenter:ZC,introEnd:INTRO_END,rythme:RYTHME,scenes:[],events:EV};

/* lecteur */
const q=new URLSearchParams(location.search);
if(q.has('alpha')){document.body.classList.add('alpha');document.documentElement.classList.add('alpha');}
if(q.get('layer')==='subs')document.body.classList.add('l-subs'); if(q.get('layer')==='vis')document.body.classList.add('l-vis');
const stage=$('#stage');
function fit(){const s=Math.min(innerWidth/1080,innerHeight/1920);stage.style.transform=`scale(${s})`;}
addEventListener('resize',fit);fit();
const t0q=+(q.get('t')||0);
document.fonts.ready.then(()=>render(t0q));render(t0q);
if(!q.has('render')){let t0=performance.now();(function loop(n){render(((n-t0)/1000)%TOTAL);requestAnimationFrame(loop);})(t0);}
</script>
</body>
</html>
