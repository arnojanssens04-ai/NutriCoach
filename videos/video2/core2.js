const WPS = 2.7, START = 0.45;
const SEGS = [
  {id:'s1',  text:'Stop !|Mange pas cette *pomme*,|elle est *cancérogène* !'},
  {id:'s2',  text:'Pas exactement,|voilà ce qui est|plutôt *vrai* sur ceci.'},
  {id:'s3',  text:'Alors oui effectivement,|sur cette pomme,|il y a des *résidus*|de *pesticides*.'},
  {id:'s4',  text:'Mais ce qu’il faut bien comprendre,|c’est que ces *résidus*|sont encadrés par des *limites*.'},
  {id:'s5',  text:'Et évidemment, l’*EFSA*|juge le risque pour le consommateur|*très* *faible* pour sa santé.'},
  {id:'s6',  text:'Alors, est-ce que tu devrais|arrêter de consommer cette pomme|parce qu’elle contient des *pesticides* ?'},
  {id:'s7',  text:'Eh bien *pas* *du* *tout*,|parce qu’elle contient beaucoup plus|d’aspects *positifs* pour ta santé|que d’aspects *négatifs*.'},
  {id:'s8',  text:'Évidemment, il y a différentes *techniques*{🧼}|pour quand même *réduire* ces résidus|qu’on retrouve sur nos fruits.'},
  {id:'s9',  text:'Tout simplement|en *rinçant* le fruit|sous l’*eau*.'},
  {id:'s10', text:'Ce qui permet donc de *réduire*|déjà *d’un* *tiers*|les résidus supplémentaires|selon une *revue*.'},
  {id:'s11', text:'Alors si ce contenu te plaît,|n’hésite pas à *t’abonner*|et mange l’esprit *tranquille*.'},
];
/* scènes : quels segments, quand la scène commence = 1er mot - 0,1 s */
const SCENES = [];

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const p=(t,a,b)=>clamp((t-a)/(b-a));
const eo=x=>1-Math.pow(1-x,3);
const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const eb=x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
const norm=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');

/* ---------- layout des mots ---------- */
const CH=[]; let TOTAL=0; const SEG={};
(function layout(){
  const fix=s=>s.replace(/ ([?:!])/g,' $1');
  const all=[]; SEGS.forEach(s=>fix(s.text).split('|').forEach(c=>c.trim().split(/[ \t\n]+/).forEach(w=>all.push(w.replace(/\{[^}]*\}/g,'').replace(/\*/g,'')))));
  const avg=all.reduce((a,w)=>a+w.length,0)/all.length;
  let t=START; let wi=0; const REAL=(window.WORDS&&window.WORDS.words&&window.WORDS.words.length===all.length)?window.WORDS:null;
  if(window.WORDS&&!REAL) console.warn('WORDS ignoré : '+(window.WORDS.words||[]).length+' mots fournis, '+all.length+' attendus');
  SEGS.forEach(s=>{ s.words=[]; s.chunks=[];
    fix(s.text).split('|').forEach(ct=>{ const ch={seg:s.id,words:[]};
      ct.trim().split(/[ \t\n]+/).forEach(raw=>{ const emo=(raw.match(/\{([^}]+)\}/)||[])[1]; const c=raw.replace(/\{[^}]*\}/g,'').replace(/\*/g,''); const d=(c.length+2)/(avg+2)/WPS;
        const w={raw:c,norm:norm(c),key:raw.includes('*'),emo,t0:t,t1:t+d}; t+=d; const l=c.slice(-1);
        t+= c.endsWith('…')?.3 : l===','?.15 : l===':'?.2 : (l==='.'||l==='?')?.3 : 0;
        if(REAL){ w.t0=REAL.words[wi].t0; w.t1=REAL.words[wi].t1; } wi++;
        ch.words.push(w); s.words.push(w); });
      ch.t0=ch.words[0].t0; ch.t1=ch.words[ch.words.length-1].t1; s.chunks.push(ch); CH.push(ch); });
    s.t0=s.words[0].t0; s.t1=s.words[s.words.length-1].t1; t+=(s.after||0); SEG[s.id]=s; });
  TOTAL=REAL?REAL.total:Math.ceil((t+.2)*10)/10;
  window.LAYOUT_REAL=!!REAL;
})();
const wt=(id,key,n=0)=>{ const k=norm(key); const m=SEG[id].words.filter(w=>w.norm===k); if(!m[n]) throw new Error('mot introuvable '+id+' '+key); return m[n].t0; };
const wt1=(id,key,n=0)=>{ const k=norm(key); const m=SEG[id].words.filter(w=>w.norm===k); return m[n].t1; };

