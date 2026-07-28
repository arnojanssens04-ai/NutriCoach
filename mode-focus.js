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

function applyClassique(mealKey, idx){
  var g = window._altClassiques[idx];
  if(!g) return;
  // Les quantités historiques sont reprises telles quelles — c'est
  // justement le principe d'un "classique" : ce que la personne mange
  // vraiment, pas une portion recalculée pour coller à un chiffre.
  var items = g.entries.map(function(e){
    return { food:{nom:e.aliment, unit:'g', kcal:e.food_kcal_100||0, prot:e.food_prot_100||0, gluc:e.food_gluc_100||0, lip:e.food_lip_100||0, fibres:e.food_fibres_100||0, pot:e.food_pot_100||0, cal:e.food_cal_100||0, fer:e.food_fer_100||0, mg:e.food_mg_100||0, zn:e.food_zn_100||0}, qty:e.quantite };
  });
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
