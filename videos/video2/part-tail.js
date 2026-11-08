
/* ---------- où est ton visage ? (mesuré dans ta vidéo) : rien ne doit passer dessus ---------- */
const ZN=Object.assign({closeups:[],faces:[],nodet:[]},window.ZONES||{});
const ZC={x:540,y:700}, INTRO_END=9.0;               /* zoom centré sur le visage ; début de vidéo = sous-titres seuls */
const ZP=[]; const smooth=x=>x*x*(3-2*x);
function zoomAt(t){ let s=1; ZP.forEach(z=>{ const u=clamp((t-z.t0)/z.in), v=clamp((t-z.t0-z.in-z.hold)/z.out); s+=z.amp*smooth(u)*(1-smooth(v)); }); return s; }
function fbAt(t){ /* bas du visage (menton + cou) à l'instant t, en px dans l'image finale (zoom compris) */
  let v;
  if(ZN.nodet.some(([a,b])=>t>=a&&t<=b)) v=1630;
  else{ let m=0,found=false; ZN.faces.forEach(([ft,x,y,w,h])=>{ if(Math.abs(ft-t)<=.3){ m=Math.max(m,y+h+60); found=true; } });
    if(found) v=m; else{ let best=1630,bd=9; ZN.faces.forEach(([ft,x,y,w,h])=>{ const d=Math.abs(ft-t); if(d<bd){ bd=d; best=y+h+60; } }); v=bd<=1.0?best:1630; } }
  v=ZC.y+(v-ZC.y)*zoomAt(t);                          /* le zoom fait descendre un peu le menton */
  if(t<INTRO_END+.3) v=Math.max(v,1260);              /* début : tu tournes la tête, pomme près du visage -> prudence, texte seul */
  return v; }
function topLimitAt(t){ let s=0,n=0; for(let d=-.2;d<=.2001;d+=.05){ s+=fbAt(t+d); n++; } return Math.max(1075,s/n+12); }

/* ---------- cues ---------- */
const EV={subs:[],vis:[]}; const Q={};
Q.res3=wt('s3','résidus'); Q.pest3=wt('s3','pesticides');
Q.res4=wt('s4','résidus'); Q.enc=wt('s4','encadrés'); Q.lim=wt('s4','limites');
Q.efsa=wt('s5','lefsa'); Q.tres=wt('s5','très'); Q.faible=wt('s5','faible');
Q.arret=wt('s6','arrêter'); Q.pest6=wt('s6','pesticides');
Q.pas=wt('s7','pas'); Q.beau=wt('s7','beaucoup'); Q.posi=wt('s7','positifs'); Q.nega=wt('s7','négatifs');
Q.rinc=wt('s9','rinçant'); Q.tiers=wt('s10','tiers'); Q.revue=wt('s10','revue');
Q.abo=wt('s11','tabonner'); Q.mange=wt('s11','mange');

/* ---------- zooms rapides sur la vidéo : un petit coup de zoom au début de chaque idée, jamais pendant l'intro ---------- */
{ const AMP=[.07,.06,.08,.07]; const Zt=[];
  SEGS.forEach(s=>{ if(s.t0>=INTRO_END+.1) Zt.push({id:s.id,t:s.t0-.05,amp:AMP[Zt.length%4]}); });
  const anchor=(id,key,amp)=>{ const z=Zt.find(z=>z.id===id); if(z){ z.t=wt(id,key)-.05; z.amp=amp; } };
  anchor('s5','lefsa',.09); anchor('s7','pas',.10);
  Zt.sort((a,b)=>a.t-b.t);
  Zt.forEach(z=>ZP.push({t0:z.t,in:.15,hold:.9,out:.4,amp:z.amp})); }

/* ---------- fenêtres d'affichage des cartes ---------- */
const SC=[
 {id:'c3', a:Q.res3-.3, b:SEG.s3.t1+.5, desc:'🍎 « Résidus de pesticides »', say:'…il y a des résidus de pesticides.'},
 {id:'c4', a:Q.res4-.3, b:SEG.s4.t1+.5, desc:'📏 jauge : résidus sous la « limite »', say:'…ces résidus sont encadrés par des limites.'},
 {id:'c5', a:Q.efsa-.3, b:SEG.s5.t1+.5, desc:'🛡️ « EFSA » + « risque très faible »', say:'…l’EFSA juge le risque très faible pour sa santé.'},
 {id:'c6', a:Q.arret-.3, b:SEG.s6.t1+.5, desc:'🍎 « Arrêter ? » + 🤔', say:'…est-ce que tu devrais arrêter de consommer cette pomme ?'},
 {id:'c7', a:Q.pas-.3,   b:SEG.s7.t1+.6, desc:'✅ « Pas du tout » + balance penchée côté positifs', say:'Eh bien pas du tout… beaucoup plus d’aspects positifs que négatifs.'},
 {id:'c9', a:SEG.s9.t0-.1, b:SEG.s9.t1+.6, desc:'🚿 « Rincer sous l’eau »', say:'Tout simplement en rinçant le fruit sous l’eau.'},
 {id:'c10',a:Q.tiers-.4, b:SEG.s10.t1+.6, desc:'💧 « −1/3 de résidus supplémentaires · selon une revue »', say:'…réduire déjà d’un tiers les résidus supplémentaires selon une revue.'},
 {id:'c11',a:Q.abo-.4,   b:TOTAL,        desc:'🔔 S’abonner + « Mange l’esprit tranquille » 🌿 + logo', say:'…n’hésite pas à t’abonner et mange l’esprit tranquille.'},
];
for(let i=0;i<SC.length-1;i++){ if(SC[i].b>SC[i+1].a) SC[i].b=Math.max(SC[i].a+.7,SC[i+1].a); }
const PRES=[]; SC.forEach(s=>{ const l=PRES[PRES.length-1]; if(l&&s.a-l[1]<.5) l[1]=s.b; else PRES.push([s.a,s.b]); });
const NOTES=[];

/* ---------- rythme : quelque chose (carte, zoom, emoji) toutes les 3-4 s ---------- */
const EMOT=[]; SEGS.forEach(s=>s.words.forEach(w=>{ if(w.emo) EMOT.push(w.t0); }));
/* compléter le rythme : si deux événements (zoom, carte, emoji) sont séparés de plus de 3,8 s, on ajoute un petit zoom au milieu */
for(let k=0;k<12;k++){
  const ev=[...ZP.map(z=>z.t0),...SC.map(s=>s.a),...EMOT].filter(t=>t>=INTRO_END).sort((a,b)=>a-b);
  let gi=-1,mg=0; for(let i=1;i<ev.length;i++){ if(ev[i]-ev[i-1]>mg){ mg=ev[i]-ev[i-1]; gi=i; } }
  if(mg<=3.8) break;
  const mid=(ev[gi]+ev[gi-1])/2; if(ZP.some(z=>Math.abs(z.t0-mid)<1.8)) break;
  ZP.push({t0:mid,in:.15,hold:.9,out:.4,amp:.06}); }
ZP.sort((a,b)=>a.t0-b.t0);
const RYTHME=(()=>{ const ev=[...ZP.map(z=>z.t0),...SC.map(s=>s.a),...EMOT].filter(t=>t>=INTRO_END).sort((a,b)=>a-b); let mg=0,at=0; for(let i=1;i<ev.length;i++){ if(ev[i]-ev[i-1]>mg){ mg=ev[i]-ev[i-1]; at=ev[i-1]; } }
  return {events:ev.map(x=>+x.toFixed(2)),maxGap:+mg.toFixed(2),maxGapAt:+at.toFixed(2),count:ev.length}; })();

/* ---------- DOM ---------- */
const SB=$('#subs');
CH.forEach(c=>{ const d=document.createElement('div'); d.className='sb';
  d.innerHTML='<div>'+c.words.map(w=>`<span class="w${w.key?' k':''}">${w.raw}${w.emo?`<span class="em">${w.emo}</span>`:''}</span>`).join(' ')+'</div>';
  SB.appendChild(d); c.el=d; c.ws=[...d.querySelectorAll('.w')]; c.ems=c.ws.map(s=>s.querySelector('.em')); });
CH.forEach((c,i)=>{ const nx=CH[i+1]; c.show0=c.t0-.05; c.show1=Math.min(c.t1+.3, nx?nx.t0-.05:1e9); });

/* ---------- helpers d'animation ---------- */
function tf(el,{o=1,x=0,y=0,s=1,r=0}={}){ el.style.opacity=o; el.style.transform=`translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`; }
const K={
  pop:(t,st)=>{const k=p(t,st,st+.4);return{o:clamp(k*3),s:.55+.45*eb(k),y:(1-eo(k))*20};},
  stamp:(t,st)=>{const k=p(t,st,st+.3);return{o:clamp(k*4),s:1.9-.9*eo(k),r:(1-eo(k))*-10};},
};
function put(el,t,kind,st,o={}){ const a=K[kind](t,st); a.r=(a.r||0)+(o.r||0);
  if(o.float&&t>st+.5){ a.y=(a.y||0)+Math.sin((t-st)*3)*4; a.r+=Math.sin((t-st)*2.4)*3; }
  tf(el,a); }

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

  put($('#r-card'),t,'pop',Q.res3-.1); put($('#r-stk'),t,'pop',Q.pest3,{float:1});
  { put($('#l-card'),t,'pop',Q.res4-.1); $('#l-fill').style.width=(eo(p(t,Q.res4,Q.res4+.6))*32)+'%';
    $('#l-mark').style.opacity=clamp(p(t,Q.enc,Q.enc+.3)); $('#l-lab').style.opacity=clamp(p(t,Q.lim,Q.lim+.25)); }
  { put($('#f-card'),t,'pop',Q.efsa-.1); $('#f-fill').style.width=(eo(p(t,Q.tres,Q.tres+.5))*14)+'%'; $('#f-lab').style.opacity=clamp(p(t,Q.faible,Q.faible+.25)); }
  put($('#a-card'),t,'stamp',Q.arret-.1); put($('#a-stk'),t,'pop',Q.pest6,{float:1});
  { put($('#y-card'),t,'stamp',Q.pas-.1); put($('#b-card'),t,'pop',Q.beau-.1);
    const ang=-15*eo(p(t,Q.posi-.1,Q.posi+.55))+(t<Q.posi?Math.sin((t-Q.beau)*5)*4*p(t,Q.beau,Q.beau+.3):0);
    $('#b-beam').setAttribute('transform',`rotate(${ang} 200 59)`); $('#b-l').setAttribute('transform',`rotate(${-ang} 60 64)`); $('#b-r').setAttribute('transform',`rotate(${-ang} 340 64)`); }
  { put($('#w-card'),t,'pop',SEG.s9.t0-.05); const dr=$('#w-drops'); dr.style.opacity=.55+.4*Math.sin(t*7); dr.style.transform=`translateY(${(t*34)%14}px)`; }
  { put($('#t-card'),t,'pop',Q.tiers-.15); $('#t-rev').style.opacity=clamp(p(t,Q.revue-.1,Q.revue+.25)); }
  { put($('#s-pill'),t,'stamp',Q.abo-.1); put($('#e-card'),t,'stamp',Q.mange-.1); put($('#e-leaf'),t,'pop',Q.mange+.3,{float:1}); put($('#e-logo'),t,'pop',Q.mange+.5); }

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
