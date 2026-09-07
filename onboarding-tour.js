// ── Visite guidée pour les nouveaux utilisateurs ──
// Sept arrêts, chacun ancré sur un vrai élément de l'app (jamais une
// capture d'écran statique) : calories -> journal -> recherche d'aliment
// -> démo IA + suppression -> plan -> ajouter -> coach. Toujours possible
// à quitter ("Passer"), ne se relance jamais automatiquement après la
// première fois (état par utilisateur dans localStorage) ; relançable à
// la main depuis "Réglages avancés" du profil (onbRestart()).

var ONB_STEPS = [
  { page:'dashboard', target:'#kcal-card', mode:'button',
    text:'Voici vos calories du jour : ce qu\'il vous reste à consommer aujourd\'hui.' },
  { page:'dashboard', target:'#nav-journal', mode:'click', pulse:true,
    text:'Entrons votre premier aliment — cliquez sur Journal.' },
  { page:'journal', target:'#srch', mode:'button', onAdvance:'demoAdd',
    text:'Recherchez un aliment ici — vous pouvez entrer absolument n\'importe lequel. Cliquez sur Suivant et l\'IA va en ajouter un pour vous montrer.' },
  { page:'journal', target:null, mode:'click', dynamic:true,
    text:'Voici comment supprimer un aliment — cliquez sur la croix.' },
  { page:'dashboard', target:'#nav-plan', mode:'click', pulse:true,
    text:'Cliquez sur Plan : il s\'adapte à VOS besoins, pas à ceux de vos voisins. Si vous préférez garder votre propre plan alimentaire, entrez d\'abord dans votre profil les aliments que vous consommez chaque jour, puis recliquez sur Plan — tout s\'adaptera à votre objectif personnel.' },
  { page:'*', target:'#nav-add', mode:'click', pulse:true, opensSheet:true,
    text:'Cliquez sur Ajouter : vous pouvez aussi scanner un code-barres ou photographier votre repas pour obtenir automatiquement les macros.' },
  { page:'*', target:'#nav-coach', mode:'click', pulse:true, final:true,
    text:'Cliquez sur Coach pour entrer en contact avec un diététicien — facilement joignable et disponible pour vous aider.' }
];

var ONB_DEMO_FOOD = {
  nom:'Pomme (démo)', kcal:52, prot:0.3, gluc:14, lip:0.2,
  fibres:2, sucres:10, na:1, cal:6, fer:0.1, pot:107
};

var onbStep = 0;
var onbActive = false;
var onbDynamicEl = null;
var onbPendingAfterSheet = false;

function onbKey(suffix){
  return 'onbTour_'+suffix+'_'+((typeof USER!=='undefined' && USER && USER.id) || 'anon');
}

function onbCurrentPage(){
  var on = document.querySelector('.page.on');
  return on ? on.id.replace('pg-','') : null;
}

function onbInit(){
  var status = localStorage.getItem(onbKey('status'));
  if(!status){
    // Jamais vu sur ce compte/navigateur -- on démarre automatiquement,
    // avec un léger délai pour laisser le tableau de bord finir de
    // s'afficher avant de poser le spotlight dessus.
    setTimeout(function(){ onbStart(); }, 900);
    return;
  }
  if(status==='active'){
    onbStep = parseInt(localStorage.getItem(onbKey('step'))||'0',10) || 0;
    onbActive = true;
    onbRender();
  }
}

function onbStart(){
  onbStep = 0;
  onbActive = true;
  localStorage.setItem(onbKey('status'),'active');
  localStorage.setItem(onbKey('step'),'0');
  onbRender();
}

function onbRestart(){
  if(typeof goPage==='function') goPage('dashboard');
  onbStart();
}

function onbSkip(){
  onbActive = false;
  localStorage.setItem(onbKey('status'),'skipped');
  onbTeardown();
}

function onbFinish(){
  onbActive = false;
  localStorage.setItem(onbKey('status'),'done');
  onbTeardown();
}

function onbTeardown(){
  var spot = document.getElementById('onb-spot');
  var tip = document.getElementById('onb-tooltip');
  if(spot) spot.remove();
  if(tip) tip.remove();
  onbDynamicEl = null;
  window.removeEventListener('scroll', onbReposition, true);
  window.removeEventListener('resize', onbReposition, true);
}

function onbPersistStep(){
  localStorage.setItem(onbKey('step'), String(onbStep));
}

async function onbAdvance(){
  var step = ONB_STEPS[onbStep];
  onbTeardown();
  if(step && step.onAdvance==='demoAdd'){
    await onbDemoAdd();
  }
  if(step && step.opensSheet){
    // Le tiroir "Ajouter" recouvre tout l'écran -- on n'affiche l'étape
    // suivante (Coach) qu'une fois le tiroir refermé (voir onbOnAddSheetClose).
    onbPendingAfterSheet = true;
    onbStep++;
    onbPersistStep();
    return;
  }
  if(step && step.final){ onbFinish(); return; }
  onbStep++;
  if(onbStep >= ONB_STEPS.length){ onbFinish(); return; }
  onbPersistStep();
  onbRender();
}

async function onbDemoAdd(){
  var f = ONB_DEMO_FOOD;
  var meal = (typeof activeMeal!=='undefined' && activeMeal) || 'lunch';
  var qty = 150;
  var r = await sb.from('journal').insert({
    user_id:USER.id, date:today(), repas:meal, aliment:f.nom,
    kcal:f.kcal*qty/100, proteines:f.prot*qty/100, glucides:f.gluc*qty/100, lipides:f.lip*qty/100,
    quantite:qty, food_source:'demo',
    food_kcal_100:f.kcal, food_prot_100:f.prot, food_gluc_100:f.gluc, food_lip_100:f.lip,
    food_fibres_100:f.fibres, food_sucres_100:f.sucres, food_na_100:f.na,
    food_cal_100:f.cal, food_fer_100:f.fer, food_pot_100:f.pot,
    is_ultra_processed:false
  }).select();
  if(r.error || !r.data || !r.data[0]) return;
  var demoId = r.data[0].id;
  if(typeof afterJournalChange==='function') afterJournalChange();
  // Le rendu de la liste est asynchrone -- on patiente jusqu'à ce que le
  // bouton de suppression du nouvel aliment démo apparaisse réellement.
  for(var i=0;i<20;i++){
    await new Promise(function(res){ setTimeout(res,150); });
    var btn = document.querySelector('[onclick*="delEntry(\'' + demoId + '\'"]');
    if(btn){ onbDynamicEl = btn; return; }
  }
}

function onbOnPageChange(page){
  if(!onbActive) return;
  var step = ONB_STEPS[onbStep];
  if(!step) return;
  if(step.page==='*' || step.page===page) onbRender();
}

function onbOnAddSheetClose(){
  if(!onbActive || !onbPendingAfterSheet) return;
  onbPendingAfterSheet = false;
  onbRender();
}

function onbFindTarget(step){
  if(step.dynamic) return onbDynamicEl;
  return step.target ? document.querySelector(step.target) : null;
}

function onbRender(){
  if(!onbActive) return;
  var step = ONB_STEPS[onbStep];
  if(!step) return;
  var page = onbCurrentPage();
  if(step.page!=='*' && step.page!==page) return; // en attente que l'utilisateur change de page
  var target = onbFindTarget(step);
  if(!target) return; // dynamique pas encore prêt, ou élément absent (ex: admin only)

  onbTeardown();

  var rect = target.getBoundingClientRect();
  var spot = document.createElement('div');
  spot.id = 'onb-spot';
  spot.className = 'onb-spot' + (step.pulse ? ' onb-pulse' : '');
  document.body.appendChild(spot);

  var tip = document.createElement('div');
  tip.id = 'onb-tooltip';
  tip.className = 'onb-tooltip';
  var btnHtml = step.mode==='button'
    ? '<button class="onb-next" onclick="onbAdvance()">' + (step.final?'Terminer':'Suivant') + '</button>'
    : '<div class="onb-hint">&#8594; cliquez sur l\'élément mis en valeur</div>';
  tip.innerHTML = '<div class="onb-progress">Étape ' + (onbStep+1) + ' / ' + ONB_STEPS.length + '</div>'
    + '<div class="onb-text">' + step.text + '</div>'
    + '<div class="onb-actions">' + btnHtml + '<button class="onb-skip" onclick="onbSkip()">Passer</button></div>';
  document.body.appendChild(tip);

  onbPosition(target, spot, tip);

  if(step.mode==='click'){
    target.addEventListener('click', onbAdvance, { once:true });
  }

  window.addEventListener('scroll', onbReposition, true);
  window.addEventListener('resize', onbReposition, true);
}

function onbReposition(){
  var step = ONB_STEPS[onbStep];
  var spot = document.getElementById('onb-spot');
  var tip = document.getElementById('onb-tooltip');
  if(!step || !spot || !tip) return;
  var target = onbFindTarget(step);
  if(!target) return;
  onbPosition(target, spot, tip);
}

function onbPosition(target, spot, tip){
  var rect = target.getBoundingClientRect();
  var pad = 6;
  spot.style.left = (rect.left-pad)+'px';
  spot.style.top = (rect.top-pad)+'px';
  spot.style.width = (rect.width+pad*2)+'px';
  spot.style.height = (rect.height+pad*2)+'px';

  var tipW = 300;
  var left = Math.min(Math.max(8, rect.left), window.innerWidth - tipW - 8);
  var spaceBelow = window.innerHeight - rect.bottom;
  var top;
  if(spaceBelow > 160 || spaceBelow > rect.top){
    top = rect.bottom + 14;
  } else {
    top = Math.max(8, rect.top - 14 - tip.offsetHeight);
  }
  tip.style.left = left+'px';
  tip.style.top = top+'px';
}

(function(){
  var style = document.createElement('style');
  style.textContent =
    '#onb-spot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(15,23,20,.68);z-index:9998;pointer-events:none;transition:all .3s ease}'
  + '.onb-pulse{animation:onbPulse 1.3s ease-in-out infinite}'
  + '@keyframes onbPulse{0%,100%{outline:3px solid var(--gold,#c9973f)}50%{outline:3px solid transparent}}'
  + '#onb-tooltip{position:fixed;z-index:9999;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);padding:16px;width:300px;max-width:calc(100vw - 24px);font-family:inherit}'
  + '.onb-progress{font-size:.68rem;font-weight:700;letter-spacing:.03em;color:var(--gold,#c9973f);text-transform:uppercase;margin-bottom:6px}'
  + '.onb-text{font-size:.86rem;line-height:1.45;color:#1f2a22;margin-bottom:12px}'
  + '.onb-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}'
  + '.onb-next{background:var(--gold,#c9973f);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:.82rem;font-weight:700;cursor:pointer}'
  + '.onb-hint{font-size:.78rem;color:#5b6b60;font-style:italic}'
  + '.onb-skip{background:none;border:none;color:#8a948d;font-size:.76rem;cursor:pointer;text-decoration:underline}';
  document.head.appendChild(style);
})();
