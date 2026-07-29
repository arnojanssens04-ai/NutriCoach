// ═══════════════════════════════════════════════════════════════════════
// MODE FOCUS & SATIETY OVERRIDE — Cap Santé
// ═══════════════════════════════════════════════════════════════════════
// Fichier dédié à cette fonctionnalité (isolée de dashboard.html) pour
// que les bugs soient plus faciles à isoler et corriger. Dépend des
// variables/fonctions globales déjà définies dans dashboard.html : sb,
// USER, PROF, toast(), today(), refreshDash(). Chargé via
// <script src="mode-focus.js"> — pas un module, partage le même scope
// global que le reste de la page.
//
// RÉVERSIBILITÉ : chaque affichage lié au mode focus (carte kcal, cartes
// de repas, journal, repas récents...) est piloté par une lecture directe
// et systématique de PROF.hide_exact_kcal à chaque rendu — rien n'est
// modifié de façon permanente. Désactiver le mode focus fait donc
// toujours revenir l'affichage exactement à l'identique d'avant, dès le
// prochain refreshDash().
// ═══════════════════════════════════════════════════════════════════════

var SATIETY_TODAY = false; // vrai si "Je suis rassasié(e)" a été validé aujourd'hui


// ── SATIETY OVERRIDE ──
// Valide la journée sur la base de la sensation réelle de satiété, plutôt
// que d'un niveau théorique de calories atteint. Une fois validée, les
// alertes de dépassement s'effacent pour le reste de la journée (voir
// genAlerts et la carte kcal dans dashboard.html, qui lisent SATIETY_TODAY)
// — le principe même du bouton est que la sensation prime sur le chiffre.
function renderSatietyZone(){
  var el = document.getElementById('satiety-zone');
  if(!el) return;
  // En test — réservé à l'admin pour l'instant, le temps de vérifier que
  // tout fonctionne correctement avant d'ouvrir à tous les utilisateurs.
  if(!(PROF && PROF.role==='admin')){ el.innerHTML=''; return; }
  if(SATIETY_TODAY){
    el.innerHTML = '<div class="satiety-confirmed">'
      +'<div class="satiety-confirmed-ttl">✓ Zone d\'équilibre atteinte par satiété</div>'
      +'<div class="satiety-confirmed-txt">Vous avez écouté votre corps aujourd\'hui — c\'est validé, peu importe le chiffre théorique.</div>'
      +'<button class="satiety-undo" onclick="undoSatiety()">Annuler</button>'
      +'</div>';
  } else {
    el.innerHTML = '<button class="satiety-btn" onclick="markSatiety()">🛑 Je suis rassasié(e) pour aujourd\'hui</button>';
  }
}

async function markSatiety(){
  var r = await sb.from('satiety_logs').upsert({user_id:USER.id, date:today()}, {onConflict:'user_id,date'});
  if(r.error){ toast('❌ '+r.error.message); return; }
  SATIETY_TODAY = true;
  toast('✓ Journée validée par satiété');
  refreshDash();
}
async function undoSatiety(){
  await sb.from('satiety_logs').delete().eq('user_id',USER.id).eq('date',today());
  SATIETY_TODAY = false;
  refreshDash();
}


// ── TOGGLE MODE FOCUS ──
async function toggleFocusMode(){
  var willEnable = !(PROF && PROF.hide_exact_kcal === true);
  if(willEnable){
    openFocusWarning();
    return;
  }
  await setFocusMode(false);
}

async function setFocusMode(newVal){
  var r = await sb.from('profiles').update({hide_exact_kcal:newVal}).eq('id',USER.id);
  if(r.error){ toast('❌ '+r.error.message); return; }
  PROF.hide_exact_kcal = newVal;
  var sw = document.getElementById('focus-mode-switch');
  if(sw) sw.classList.toggle('on', newVal);
  if(newVal){
    toast('🌿 Mode focus activé');
  } else {
    showDetailReactivatedBanner();
  }
  refreshDash();
}

// Rappel bienveillant à la désactivation du mode focus — les chiffres
// reviennent à l'écran, mais on ne veut pas que ça sonne comme "retour à
// la normale, maintenant gérez bien votre solde". Auto-masqué après un
// moment, avec un raccourci pour revenir en mode focus si la personne
// change d'avis tout de suite.
function showDetailReactivatedBanner(){
  var old = document.getElementById('detail-reactivated-banner');
  if(old) old.remove();
  var b = document.createElement('div');
  b.id = 'detail-reactivated-banner';
  b.style.cssText = 'position:fixed;top:14px;left:14px;right:14px;max-width:420px;margin:0 auto;background:var(--card);border:1px solid var(--border2);border-radius:14px;padding:14px 16px;box-shadow:0 8px 26px rgba(0,0,0,0.14);z-index:500;animation:slideDownBanner .3s ease';
  b.innerHTML = '<div style="font-weight:700;font-size:.86rem;margin-bottom:4px">💡 Mode détaillé réactivé</div>'
    +'<div style="font-size:.8rem;color:var(--text2);line-height:1.5;margin-bottom:10px">Les chiffres sont des outils pour votre suivi, pas des objectifs rigides à atteindre absolument. Écoutez votre corps avant tout.</div>'
    +'<button onclick="setFocusMode(true);document.getElementById(\'detail-reactivated-banner\').remove()" style="font-size:.76rem;font-weight:700;color:var(--gold);background:var(--gold-l);border:none;border-radius:999px;padding:6px 13px;cursor:pointer">Repasser en mode focus</button>';
  document.body.appendChild(b);
  setTimeout(function(){ if(b.parentNode) b.remove(); }, 9000);
}

// Avertissement requis avant d'activer le mode focus — masquer les
// chiffres n'est pas automatiquement le bon choix pour tout le monde non
// plus : ça peut, selon la situation, devenir un évitement plutôt qu'un
// rapport plus sain à l'alimentation. On demande une vraie confirmation
// plutôt qu'un simple clic silencieux.
function openFocusWarning(){
  var ov = document.createElement('div');
  ov.id = 'focus-warning-ov';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(22,36,27,0.55);z-index:998;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.innerHTML = '<div style="background:var(--card);border-radius:16px;padding:22px 20px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.2)">'
    +'<div style="font-size:1.6rem;margin-bottom:10px;text-align:center">⚠️</div>'
    +'<div style="font-family:\'Lora\',serif;font-weight:700;font-size:1.05rem;margin-bottom:10px;text-align:center">Avant d\'activer le mode focus</div>'
    +'<div style="font-size:.86rem;color:var(--text2);line-height:1.6;margin-bottom:18px">Masquer les chiffres peut aider certaines personnes à moins raisonner en "solde à dépenser" — mais chez d\'autres, ça peut aussi devenir une façon d\'éviter de regarder son alimentation en face, ce qui n\'est pas plus sain sur le long terme. Ce n\'est pas un réglage que nous recommandons par défaut : on vous laisse ce choix, mais on préfère être honnête sur le fait qu\'il n\'est pas neutre.</div>'
    +'<button onclick="confirmFocusMode()" style="width:100%;padding:12px;border-radius:10px;border:none;background:var(--gold);color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;margin-bottom:8px">J\'ai compris, activer quand même</button>'
    +'<button onclick="document.getElementById(\'focus-warning-ov\').remove()" style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--border2);background:none;color:var(--text2);font-weight:600;font-size:.9rem;cursor:pointer">Annuler</button>'
    +'</div>';
  document.body.appendChild(ov);
}
function confirmFocusMode(){
  document.getElementById('focus-warning-ov').remove();
  setFocusMode(true);
}

// Prévisualisation admin-only du nouvel affichage kcal (plage dynamique).
// Pas d'avertissement ici (contrairement au mode focus) — c'est un simple
// réglage d'affichage en test, pas un choix qui touche le rapport à
// l'alimentation de qui que ce soit d'autre que l'admin lui-même.
async function togglePreviewKcal(){
  var newVal = !(PROF && PROF.preview_new_kcal === true);
  var r = await sb.from('profiles').update({preview_new_kcal:newVal}).eq('id',USER.id);
  if(r.error){ toast('❌ '+r.error.message); return; }
  PROF.preview_new_kcal = newVal;
  document.getElementById('preview-kcal-switch').classList.toggle('on', newVal);
  toast(newVal ? '🔍 Prévisualisation activée' : 'Retour à l\'ancien affichage');
  refreshDash();
}


// ── SUIVI ÉNERGIE / DIGESTION POST-REPAS ──
// Une évaluation rapide en un tap, proposée dans le journal une fois qu'un
// repas contient au moins un aliment — sert de signal biologique concret
// (comment le corps réagit) en complément des chiffres, jamais à la place.
var ENERGY_LABELS = {
  forme: {ico:'🟢', lbl:'Pleine forme'},
  pompe: {ico:'🟡', lbl:'Coup de pompe'},
  faim:  {ico:'🔴', lbl:'Faim persistante'}
};

async function renderEnergyCheckin(hasItems){
  var el = document.getElementById('energy-checkin-zone');
  if(!el) return;
  if(!(PROF && PROF.role==='admin')){ el.innerHTML=''; return; }
  if(!hasItems){ el.innerHTML=''; return; }

  var r = await sb.from('energy_checkins').select('rating').eq('user_id',USER.id).eq('date',today()).eq('repas',activeMeal).maybeSingle();
  var existing = r.data && r.data.rating;

  if(existing && ENERGY_LABELS[existing]){
    var info = ENERGY_LABELS[existing];
    el.innerHTML = '<div class="energy-done">'+info.ico+' Ressenti enregistré : '+info.lbl
      +'<button onclick="undoEnergyCheckin()">Modifier</button></div>';
  } else {
    el.innerHTML = '<div class="energy-checkin">'
      +'<div class="energy-checkin-ttl">Comment vous sentez-vous après ce repas ?</div>'
      +'<div class="energy-opts">'
        +Object.keys(ENERGY_LABELS).map(function(key){
          var info = ENERGY_LABELS[key];
          return '<div class="energy-opt" onclick="submitEnergyCheckin(\''+key+'\')"><span class="ico">'+info.ico+'</span>'+info.lbl+'</div>';
        }).join('')
      +'</div></div>';
  }
}

async function submitEnergyCheckin(rating){
  var r = await sb.from('energy_checkins').upsert(
    {user_id:USER.id, date:today(), repas:activeMeal, rating:rating},
    {onConflict:'user_id,date,repas'}
  );
  if(r.error){ toast('❌ '+r.error.message); return; }
  toast('Merci, c\'est noté');
  renderEnergyCheckin(true);
}
async function undoEnergyCheckin(){
  await sb.from('energy_checkins').delete().eq('user_id',USER.id).eq('date',today()).eq('repas',activeMeal);
  renderEnergyCheckin(true);
}


// ── MOTEUR D'ALTERNATIVES ("Pantry Core") ──
// Pour un repas suggéré donné, propose deux types d'alternatives plutôt
// qu'un tirage aléatoire aveugle (l'ancien comportement du bouton ⇄) :
// "Vos Classiques" (repas réellement mangés le plus souvent par cette
// personne, tirés de son propre historique) et "Équivalents Diététicien"
// (vraies recettes créées côté admin, filtrées pour ce type de repas).
// Volontairement, aucune différence calorique n'est affichée dans ce
// tiroir — le choix se fait sur ce que c'est, pas sur un delta de chiffre.

async function openAlternativesDrawer(mealKey){
  var old = document.getElementById('alt-drawer-ov');
  if(old) old.remove();

  var ov = document.createElement('div');
  ov.id = 'alt-drawer-ov';
  ov.className = 'alt-drawer-ov';
  ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML = '<div class="alt-drawer">'
    +'<div class="alt-drawer-hdr"><span>Alternatives — '+(MEAL_META[mealKey]?MEAL_META[mealKey].l:'')+'</span>'
    +'<button onclick="document.getElementById(\'alt-drawer-ov\').remove()" style="background:var(--bg2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer">✕</button></div>'
    +'<div class="alt-section-lbl">🔁 Vos classiques</div>'
    +'<div id="alt-classiques">Chargement…</div>'
    +'<div class="alt-section-lbl">🥗 Équivalents diététicien</div>'
    +'<div id="alt-dietitian">Chargement…</div>'
    +'<button class="alt-surprise" onclick="document.getElementById(\'alt-drawer-ov\').remove();changeMealRecipe(\''+mealKey+'\')">🎲 Surprends-moi</button>'
    +'</div>';
  document.body.appendChild(ov);

  var classiques = await computeVosClassiques(mealKey);
  var classEl = document.getElementById('alt-classiques');
  if(!classiques.length){
    classEl.innerHTML = '<div class="alt-empty">Pas encore assez d\'historique pour ce repas — revenez dans quelques jours.</div>';
  } else {
    classEl.innerHTML = classiques.map(function(g,idx){
      var names = g.entries.map(function(e){ return e.aliment; }).join(', ');
      var freqLbl = g.count>1 ? g.count+'x récemment' : 'Mangé récemment';
      return '<div class="alt-item" onclick="applyClassique(\''+mealKey+'\','+idx+')">'
        +'<span class="alt-item-ico">🔁</span>'
        +'<div class="alt-item-body"><div class="alt-item-name">'+esc(names.length>50?names.slice(0,50)+'…':names)+'</div>'
        +'<div class="alt-item-sub">'+freqLbl+'</div></div></div>';
    }).join('');
    window._altClassiques = classiques;
  }

  var equivalents = await fetchDietitianEquivalents(mealKey);
  var dietEl = document.getElementById('alt-dietitian');
  if(!equivalents.length){
    dietEl.innerHTML = '<div class="alt-empty">Aucune recette diététicien disponible pour ce repas pour l\'instant.</div>';
  } else {
    dietEl.innerHTML = equivalents.map(function(r,idx){
      return '<div class="alt-item" onclick="applyDietitianRecipe(\''+mealKey+'\','+idx+')">'
        +'<span class="alt-item-ico">🥗</span>'
        +'<div class="alt-item-body"><div class="alt-item-name">'+esc(r.nom)+'</div>'
        +'<div class="alt-item-sub">Suggestion de l\'équipe</div></div></div>';
    }).join('');
    window._altEquivalents = equivalents;
  }
}

// Analyse les 21 derniers jours du journal pour ce type de repas, regroupe
// par jour, et fait remonter les combinaisons d'aliments qui reviennent le
// plus souvent — même logique que "Repas récents" dans le journal, mais
// appliquée ici au plan alimentaire.
async function computeVosClassiques(mealKey){
  var since = new Date(); since.setDate(since.getDate()-21);
  var r = await sb.from('journal').select('*')
    .eq('user_id',USER.id).eq('repas',mealKey)
    .gte('date', since.toISOString().slice(0,10))
    .neq('date', today());
  var entries = r.data || [];
  if(!entries.length) return [];

  var byDate = {};
  entries.forEach(function(e){ if(!byDate[e.date]) byDate[e.date]=[]; byDate[e.date].push(e); });

  function signature(dayEntries){
    return dayEntries.map(function(e){ return e.aliment+'|'+Math.round(e.quantite); }).sort().join('||');
  }
  var groups = {};
  Object.keys(byDate).forEach(function(d){
    var sig = signature(byDate[d]);
    if(!groups[sig]) groups[sig] = { entries: byDate[d], count: 0 };
    groups[sig].count++;
  });

  return Object.keys(groups).map(function(k){ return groups[k]; })
    .sort(function(a,b){ return b.count-a.count; })
    .slice(0,3);
}

async function fetchDietitianEquivalents(mealKey){
  var r = await sb.from('recettes').select('*').contains('repas_types',[mealKey]).limit(20);
  var list = r.data || [];
  // Petite variété à chaque ouverture plutôt que toujours les mêmes en tête
  for(var i=list.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=list[i]; list[i]=list[j]; list[j]=t; }
  return list.slice(0,4);
}

// Catégories utilisées pour savoir QUOI ajuster quand il manque des
// calories à combler sur un "classique" — certains aliments ont une
// portion naturelle qu'on ne force pas au-delà (un yaourt ne se mange pas
// par tranches de 200g), d'autres se prêtent bien à un ajustement, mais
// pas pour tout le monde (noix/miel à éviter si diabète ou pathologie
// concernée, on préfère alors fruits/craquelins).
var FIXED_PORTION_REGEX = /yaourt|yoghourt|yoghurt|fromage blanc|skyr|petit.suisse/;
var DENSE_FLEX_REGEX = /noix|amande|noisette|miel|sucre|fruits? secs?|raisins? secs?|beurre de cacahuete/;
var SAFE_FLEX_REGEX = /cracker|craquelin|biscotte|pomme|banane|orange|poire|kiwi|fraise|fruit/;

function normalizeTxt(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

// Ajuste les quantités d'un combo "classique" pour se rapprocher du
// besoin calorique du repas — seulement à la hausse, seulement sur les
// aliments qui s'y prêtent, jamais sur les portions à taille naturelle
// fixe (yaourt, fromage blanc...).
function adjustClassiqueForGap(items, mealKey){
  var tgt = calcTargets();
  var mealPcts = getMealPcts();
  var mealTarget = tgt.kcal * (mealPcts[mealKey]||0.2);
  var currentKcal = items.reduce(function(s,it){ return s+pN2(it.food.kcal)*it.qty/100; },0);
  var gap = mealTarget - currentKcal;

  // Écart trop faible pour justifier d'y toucher, ou déjà au-dessus —
  // on laisse le classique tel quel (c'est tout le principe de cette
  // alternative : rester fidèle à ce que la personne mange vraiment).
  if(gap < 80) return items;

  var pathos = (PROF && PROF.pathologies) || [];
  var avoidDenseSugar = pathos.indexOf('diabetes')>=0;

  // On identifie quels items du combo peuvent absorber l'écart.
  var flexItems = items.filter(function(it){
    var n = normalizeTxt(it.food.nom);
    if(FIXED_PORTION_REGEX.test(n)) return false; // jamais ces portions-là
    if(DENSE_FLEX_REGEX.test(n) && avoidDenseSugar) return false; // noix/miel écartés si pathologie concernée
    return DENSE_FLEX_REGEX.test(n) || SAFE_FLEX_REGEX.test(n);
  });

  if(!flexItems.length) return items; // rien dans ce combo ne se prête à l'ajustement, on ne force rien

  var flexKcalTotal = flexItems.reduce(function(s,it){ return s+pN2(it.food.kcal)*it.qty/100; },0);
  if(flexKcalTotal<=0) return items;

  var scaleFactor = Math.min(2.2, (flexKcalTotal+gap)/flexKcalTotal); // jamais plus de 2.2x la quantité d'origine
  flexItems.forEach(function(it){ it.qty = Math.round(it.qty*scaleFactor); });
  return items;
}

function applyClassique(mealKey, idx){
  var g = window._altClassiques[idx];
  if(!g) return;
  // Les quantités historiques sont le point de départ — c'est le principe
  // d'un "classique" : ce que la personne mange vraiment. On ajuste
  // seulement les aliments qui s'y prêtent si le besoin du jour est plus
  // élevé que d'habitude pour ce repas.
  var items = g.entries.map(function(e){
    return { food:{nom:e.aliment, unit:'g', kcal:e.food_kcal_100||0, prot:e.food_prot_100||0, gluc:e.food_gluc_100||0, lip:e.food_lip_100||0, fibres:e.food_fibres_100||0, pot:e.food_pot_100||0, cal:e.food_cal_100||0, fer:e.food_fer_100||0, mg:e.food_mg_100||0, zn:e.food_zn_100||0}, qty:e.quantite };
  });
  items = adjustClassiqueForGap(items, mealKey);
  CURRENT_PLAN[mealKey] = { recipeName:'Votre classique', recipeId:null, items:items };
  saveGenericPlan();
  document.getElementById('alt-drawer-ov').remove();
  renderMealPlan();
  toast('✅ Repas remplacé par un de vos classiques');
}

function applyDietitianRecipe(mealKey, idx){
  var recipe = window._altEquivalents[idx];
  if(!recipe) return;
  var tgt = calcTargets();
  var need2ndSnack = needsSecondSnack();
  var mealPcts = need2ndSnack
    ? {breakfast:0.25, lunch:0.30, snack:0.10, dinner:0.25, snack2:0.10}
    : {breakfast:0.25, lunch:0.35, snack:0.10, dinner:0.30};
  var mealKcalTarget = tgt.kcal * (mealPcts[mealKey]||0.2);
  // Adapte le format Supabase (ingredients) au format attendu par
  // scaleRecipe (ing) — même contenu, avec unit:'g' explicite car les
  // vraies recettes n'ont pas ce champ (contrairement au pool statique),
  // et fmtQty() en a besoin pour afficher correctement les quantités.
  var adapted = { ing: (recipe.ingredients||[]).map(function(i){ return Object.assign({unit:'g'}, i); }) };
  CURRENT_PLAN[mealKey] = { recipeName:recipe.nom, recipeId:recipe.id, items:scaleRecipe(adapted, mealKcalTarget) };
  saveGenericPlan();
  document.getElementById('alt-drawer-ov').remove();
  renderMealPlan();
  toast('✅ Repas remplacé par '+recipe.nom);
}


// ── JAUGE D'ÉNERGIE QUOTIDIENNE (Mode Focus) ──
// Contrairement à la première version (un simple nombre figé), la jauge
// se RECALCULE en direct à chaque affichage à partir de trois éléments :
// - une base fixée le matin par le checkin sommeil
// - une décroissance selon le temps écoulé depuis ce checkin (façon
//   Garmin Connect / Body Battery — l'énergie s'use au fil de la journée)
// - les recharges de la journée, une par repas, dont l'ampleur dépend à
//   la fois de l'équilibre protéines/fibres ET de la densité énergétique
//   du repas (un repas léger et riche en aliments bruts recharge mieux
//   qu'un repas calorique dense, même à équilibre protéines/fibres égal).
var ENERGY_GAUGE_TODAY = null; // {base_value, checkin_at, recharges} ou null si pas encore chargé
var ENERGY_DECAY_PER_HOUR = 3.5; // %/heure, plafonné à 16h de décroissance
var ENERGY_DECAY_MAX_HOURS = 16;

function computeEnergyGaugeValue(){
  if(!ENERGY_GAUGE_TODAY) return null;
  var elapsedH = (Date.now() - new Date(ENERGY_GAUGE_TODAY.checkin_at).getTime()) / 3600000;
  elapsedH = Math.max(0, Math.min(ENERGY_DECAY_MAX_HOURS, elapsedH));
  var decay = elapsedH * ENERGY_DECAY_PER_HOUR;
  var rechargeTotal = (ENERGY_GAUGE_TODAY.recharges||[]).reduce(function(s,r){ return s+r.amount; },0);
  return Math.max(8, Math.min(100, Math.round(ENERGY_GAUGE_TODAY.base_value - decay + rechargeTotal)));
}

async function loadEnergyGauge(){
  var r = await sb.from('energy_gauge').select('*').eq('user_id',USER.id).eq('date',today()).maybeSingle();
  ENERGY_GAUGE_TODAY = r.data || null;

  if(!(PROF && PROF.hide_exact_kcal===true)) return; // pas en mode focus, rien à afficher

  if(!ENERGY_GAUGE_TODAY || !ENERGY_GAUGE_TODAY.checkin_at){
    document.getElementById('sleep-checkin-ov').style.display='flex';
  } else {
    renderEnergyGaugeDisplay();
    // Rafraîchit l'affichage toutes les 5 minutes tant que le dashboard
    // reste ouvert, pour que la décroissance se voie vraiment évoluer
    // sans avoir à recharger la page.
    if(!window._energyGaugeInterval){
      window._energyGaugeInterval = setInterval(renderEnergyGaugeDisplay, 5*60*1000);
    }
  }
}

function renderEnergyGaugeDisplay(){
  var val = computeEnergyGaugeValue();
  if(val===null) return;
  document.getElementById('energy-gauge-fill').style.width = val+'%';
  document.getElementById('energy-gauge-pct').textContent = val+'%';
  var msgEl = document.getElementById('energy-gauge-msg');
  if(msgEl){
    msgEl.textContent = val>=75 ? 'Belle énergie — continuez comme ça.'
      : val>=45 ? 'Un repas équilibré et pas trop dense rechargera votre jauge.'
      : 'Un repas léger avec protéines et fibres pourrait vous aider à retrouver de l\'énergie.';
  }
}

async function submitSleepCheckin(rating){
  var startVal = rating==='difficile' ? 40 : rating==='moyen' ? 70 : 90;
  var r = await sb.from('energy_gauge').upsert(
    {user_id:USER.id, date:today(), base_value:startVal, checkin_at:new Date().toISOString(), sleep_rating:rating, recharges:[], value:startVal},
    {onConflict:'user_id,date'}
  ).select().single();
  document.getElementById('sleep-checkin-ov').style.display='none';
  if(!r.error) ENERGY_GAUGE_TODAY = r.data;
  renderEnergyGaugeDisplay();
}
async function skipSleepCheckin(){
  var r = await sb.from('energy_gauge').upsert(
    {user_id:USER.id, date:today(), base_value:70, checkin_at:new Date().toISOString(), sleep_rating:null, recharges:[], value:70},
    {onConflict:'user_id,date'}
  ).select().single();
  document.getElementById('sleep-checkin-ov').style.display='none';
  if(!r.error) ENERGY_GAUGE_TODAY = r.data;
  renderEnergyGaugeDisplay();
}

// Appelée après l'ajout d'un aliment au journal — si CE repas atteint un
// bon équilibre protéines/fibres pour la première fois aujourd'hui, la
// jauge se recharge. L'ampleur dépend aussi de la densité énergétique du
// repas (kcal par gramme) : un repas léger et riche en aliments bruts
// recharge mieux qu'un repas très calorique au même poids.
async function maybeRechargeEnergyGauge(mealKey){
  if(!(PROF && PROF.hide_exact_kcal===true)) return;
  if(!ENERGY_GAUGE_TODAY) return;

  var entries = await getEntries();
  var mealEntries = entries.filter(function(e){ return e.repas===mealKey; });
  var mealProt = mealEntries.reduce(function(s,e){ return s+(e.food_prot_100||0)*e.quantite/100; },0);
  var mealFibres = mealEntries.reduce(function(s,e){ return s+(e.food_fibres_100||0)*e.quantite/100; },0);
  var isBalanced = mealProt>=12 && mealFibres>=3;
  if(!isBalanced) return;

  var already = (ENERGY_GAUGE_TODAY.recharges||[]);
  if(already.some(function(r){ return r.meal===mealKey; })) return; // déjà rechargé pour ce repas aujourd'hui

  var mealKcal = mealEntries.reduce(function(s,e){ return s+(e.food_kcal_100||0)*e.quantite/100; },0);
  var mealWeight = mealEntries.reduce(function(s,e){ return s+(e.quantite||0); },0);
  var density = mealWeight>0 ? mealKcal/mealWeight : 2;

  // Un repas léger et peu dense (légumes, fruits, aliments bruts) profite
  // davantage à l'énergie ressentie qu'un repas très calorique au même
  // poids (fritures, plats très transformés) — même à protéines/fibres
  // suffisantes dans les deux cas.
  var densityMult = density<1.5 ? 1.25 : density>2.5 ? 0.6 : 1.0;
  var baseGain = 15 + Math.round(Math.random()*10); // +15 à +25 avant modulation
  var gain = Math.round(baseGain * densityMult);

  var newRecharges = already.concat([{meal:mealKey, amount:gain, at:new Date().toISOString()}]);
  var r = await sb.from('energy_gauge').update({recharges:newRecharges}).eq('user_id',USER.id).eq('date',today());
  if(!r.error){
    ENERGY_GAUGE_TODAY.recharges = newRecharges;
    renderEnergyGaugeDisplay();
    var densityNote = densityMult>1 ? ' (repas léger, bon impact)' : densityMult<1 ? ' (repas plus dense, impact modéré)' : '';
    toast('🌿 +'+gain+'% d\'énergie — bel équilibre protéines/fibres'+densityNote);
  }
}


// ── TENDANCE DE LA SEMAINE ──
// Un repère de progression narratif plutôt que chiffré : on regarde les 7
// derniers jours, on classe chaque jour selon l'équilibre de l'assiette
// (même logique que la carte du jour, appliquée rétrospectivement), et on
// en tire une phrase de synthèse plutôt qu'un tableau de chiffres.
async function renderWeeklyTrend(){
  var card = document.getElementById('weekly-trend-card');
  if(!card) return;

  var days = [];
  for(var i=6;i>=0;i--){
    var d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }

  var since = days[0];
  var r = await sb.from('journal').select('date,aliment,quantite').eq('user_id',USER.id).gte('date',since);
  var allEntries = r.data || [];
  if(!allEntries.length){ card.style.display='none'; return; }

  var dayStatus = days.map(function(dateStr){
    var dayEntries = allEntries.filter(function(e){ return e.date===dateStr; });
    if(!dayEntries.length) return 'none';
    var vegW=0, protW=0, starchW=0;
    dayEntries.forEach(function(e){
      var n = normalizeTxt(e.aliment);
      var w = e.quantite||0;
      if(isLegume(e.aliment) || FRUIT_REGEX.test(n) || LEGUMINEUSE_REGEX.test(n)) vegW+=w;
      else if(PROTEIN_SRC_REGEX.test(n)) protW+=w;
      else if(STARCH_REGEX.test(n)) starchW+=w;
    });
    var totalW = vegW+protW+starchW;
    if(totalW<=0) return 'none';
    var vegPct=vegW/totalW*100, protPct=protW/totalW*100, starchPct=100-vegPct-protPct;
    var deviation = Math.abs(vegPct-50)+Math.abs(protPct-25)+Math.abs(starchPct-25);
    return deviation<=25 ? 'good' : deviation<=45 ? 'mid' : 'low';
  });

  var goodCount = dayStatus.filter(function(s){ return s==='good'; }).length;
  var trackedCount = dayStatus.filter(function(s){ return s!=='none'; }).length;

  card.style.display='block';
  var dayLabels = ['L','M','M','J','V','S','D'];
  var todayIdx = (new Date().getDay()+6)%7; // lundi=0
  var sparkRow = document.getElementById('sparkline-row');
  var sparkDays = document.getElementById('sparkline-days');
  sparkRow.innerHTML = dayStatus.map(function(s){
    return '<div class="spark-dot-wrap"><div class="spark-dot '+s+'"></div></div>';
  }).join('');
  sparkDays.innerHTML = days.map(function(dateStr){
    var d = new Date(dateStr+'T00:00:00');
    var lbl = ['D','L','M','M','J','V','S'][d.getDay()];
    return '<span>'+lbl+'</span>';
  }).join('');

  var narrative;
  if(trackedCount<3){
    narrative = 'Encore quelques jours pour dresser un vrai portrait de votre semaine.';
  } else if(goodCount>=5){
    narrative = 'Belle semaine — votre assiette est restée équilibrée '+goodCount+' jour'+(goodCount>1?'s':'')+' sur '+trackedCount+'.';
  } else if(goodCount>=3){
    narrative = 'Semaine plutôt régulière, avec '+goodCount+' jours bien équilibrés sur '+trackedCount+' suivis.';
  } else {
    narrative = 'Une semaine un peu plus irrégulière — pas grave, chaque jour repart de zéro.';
  }
  document.getElementById('weekly-trend-narrative').textContent = narrative;
}


// Répartition du poids (grammes) des aliments du jour entre végétaux,
// protéines et féculents — basé sur le poids plutôt que les calories,
// pour rester fidèle à la métaphore visuelle de l'assiette (les
// matières grasses par ex. pèsent peu à l'œil mais beaucoup en kcal,
// ce qui fausserait la lecture si on utilisait les calories ici).
var PROTEIN_SRC_REGEX = /poulet|boeuf|porc|jambon|thon|saumon|cabillaud|dinde|veau|agneau|oeuf|tofu|poisson|crevette|merlu|colin|sardine|steak|escalope|filet de|blanc de|viande|charcuterie|seitan|tempeh/;
var STARCH_REGEX = /pates|riz|pain|pomme de terre|patate|quinoa|semoule|boulgour|cereales?|avoine|flocons|biscotte|tortilla|couscous/;

function renderBalancedPlate(entries){
  var plateCard = document.getElementById('balanced-plate-card');
  if(!plateCard) return;
  var today_ = entries.filter(function(e){ return e.date===today(); });
  if(!today_.length){ plateCard.style.display='none'; return; }

  var vegW=0, protW=0, starchW=0;
  today_.forEach(function(e){
    var n = normalizeTxt(e.aliment);
    var w = e.quantite||0;
    if(isLegume(e.aliment) || FRUIT_REGEX.test(n) || LEGUMINEUSE_REGEX.test(n)) vegW += w;
    else if(PROTEIN_SRC_REGEX.test(n)) protW += w;
    else if(STARCH_REGEX.test(n)) starchW += w;
  });

  var totalW = vegW+protW+starchW;
  plateCard.style.display = 'block';
  if(totalW<=0){
    document.getElementById('plate-status').textContent = 'Ajoutez vos repas pour voir la structure de votre assiette.';
    ['veg','prot','starch'].forEach(function(k){
      document.getElementById('plate-'+k+'-fill').style.width='0%';
      document.getElementById('plate-'+k+'-pct').textContent='0%';
    });
    return;
  }

  var vegPct = Math.round(vegW/totalW*100);
  var protPct = Math.round(protW/totalW*100);
  var starchPct = 100-vegPct-protPct;

  document.getElementById('plate-veg-fill').style.width=vegPct+'%';
  document.getElementById('plate-veg-pct').textContent=vegPct+'%';
  document.getElementById('plate-prot-fill').style.width=protPct+'%';
  document.getElementById('plate-prot-pct').textContent=protPct+'%';
  document.getElementById('plate-starch-fill').style.width=starchPct+'%';
  document.getElementById('plate-starch-pct').textContent=starchPct+'%';

  // Écart par rapport à la répartition-repère 50/25/25 (modèle "assiette
  // équilibrée" classique) — statut qualitatif doux, jamais un chiffre à
  // atteindre au pourcentage près.
  var deviation = Math.abs(vegPct-50)+Math.abs(protPct-25)+Math.abs(starchPct-25);
  var statusTxt = deviation<=20 ? 'Structure de l\'assiette : très équilibrée aujourd\'hui.'
    : deviation<=40 ? 'Structure de l\'assiette : plutôt équilibrée.'
    : vegPct<30 ? 'Une portion de légumes ou de fruits en plus donnerait plus de place aux végétaux.'
    : 'Continuez à varier les trois familles à chaque repas.';
  document.getElementById('plate-status').textContent = statusTxt;
}

// ── DIVERSITÉ VÉGÉTALE DE LA SEMAINE ──
// Compte les végétaux DISTINCTS (légumes, fruits, céréales complètes,
// légumineuses, graines) consommés sur les 7 derniers jours — un
// indicateur associé à la diversité du microbiote, indépendant des
// quantités ou des calories.
var SEEDS_HERBS_REGEX = /graines?|lin|chia|sesame|tournesol|courge \(graines\)|persil|basilic|coriandre|menthe|thym|romarin|ciboulette/;

async function renderPlantDiversity(){
  var card = document.getElementById('plant-diversity-card');
  if(!card) return;
  var since = new Date(); since.setDate(since.getDate()-6);
  var r = await sb.from('journal').select('aliment').eq('user_id',USER.id).gte('date', since.toISOString().slice(0,10));
  var entries = r.data || [];
  if(!entries.length){ card.style.display='none'; return; }

  var distinctPlants = {};
  entries.forEach(function(e){
    var n = normalizeTxt(e.aliment);
    if(isLegume(e.aliment) || FRUIT_REGEX.test(n) || LEGUMINEUSE_REGEX.test(n) || WHOLEGRAIN_REGEX.test(n) || SEEDS_HERBS_REGEX.test(n)){
      distinctPlants[e.aliment.trim().toLowerCase()] = true;
    }
  });

  var count = Object.keys(distinctPlants).length;
  card.style.display = 'block';
  document.getElementById('diversity-count').textContent = count+' / 20 végétaux';
  document.getElementById('diversity-fill').style.width = Math.min(100, count/20*100)+'%';
  document.getElementById('diversity-msg').textContent = count>=20
    ? 'Superbe diversité cette semaine — votre microbiote vous dit merci.'
    : count>=12
    ? 'Belle diversité cette semaine, encore quelques végétaux différents pour viser les 20.'
    : 'Plus vous variez légumes, fruits, céréales et légumineuses, mieux c\'est pour votre microbiote.';
}
