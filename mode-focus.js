// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MODE FOCUS & SATIETY OVERRIDE \u2014 Cap Sant\u00e9
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// Fichier d\u00e9di\u00e9 \u00e0 cette fonctionnalit\u00e9 (isol\u00e9e de dashboard.html) pour
// que les bugs soient plus faciles \u00e0 isoler et corriger. D\u00e9pend des
// variables/fonctions globales d\u00e9j\u00e0 d\u00e9finies dans dashboard.html : sb,
// USER, PROF, toast(), today(), refreshDash(). Charg\u00e9 via
// <script src="mode-focus.js"> \u2014 pas un module, partage le m\u00eame scope
// global que le reste de la page.
//
// R\u00c9VERSIBILIT\u00c9 : chaque affichage li\u00e9 au mode focus (carte kcal, cartes
// de repas, journal, repas r\u00e9cents...) est pilot\u00e9 par une lecture directe
// et syst\u00e9matique de PROF.hide_exact_kcal \u00e0 chaque rendu \u2014 rien n'est
// modifi\u00e9 de fa\u00e7on permanente. D\u00e9sactiver le mode focus fait donc
// toujours revenir l'affichage exactement \u00e0 l'identique d'avant, d\u00e8s le
// prochain refreshDash().
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

var SATIETY_TODAY = false; // vrai si "Je suis rassasi\u00e9(e)" a \u00e9t\u00e9 valid\u00e9 aujourd'hui


// \u2500\u2500 SATIETY OVERRIDE \u2500\u2500
// Valide la journ\u00e9e sur la base de la sensation r\u00e9elle de sati\u00e9t\u00e9, plut\u00f4t
// que d'un niveau th\u00e9orique de calories atteint. Une fois valid\u00e9e, les
// alertes de d\u00e9passement s'effacent pour le reste de la journ\u00e9e (voir
// genAlerts et la carte kcal dans dashboard.html, qui lisent SATIETY_TODAY)
// \u2014 le principe m\u00eame du bouton est que la sensation prime sur le chiffre.
function renderSatietyZone(){
  var el = document.getElementById('satiety-zone');
  if(!el) return;
  // En test \u2014 r\u00e9serv\u00e9 \u00e0 l'admin pour l'instant, le temps de v\u00e9rifier que
  // tout fonctionne correctement avant d'ouvrir \u00e0 tous les utilisateurs.
  if(!(PROF && PROF.role==='admin')){ el.innerHTML=''; return; }
  if(SATIETY_TODAY){
    el.innerHTML = '<div class="satiety-confirmed">'
      +'<div class="satiety-confirmed-ttl">\u2713 Zone d\'\u00e9quilibre atteinte par sati\u00e9t\u00e9</div>'
      +'<div class="satiety-confirmed-txt">Vous avez \u00e9cout\u00e9 votre corps aujourd\'hui \u2014 c\'est valid\u00e9, peu importe le chiffre th\u00e9orique.</div>'
      +'<button class="satiety-undo" onclick="undoSatiety()">Annuler</button>'
      +'</div>';
  } else {
    el.innerHTML = '<button class="satiety-btn" onclick="markSatiety()">\ud83d\uded1 Je suis rassasi\u00e9(e) pour aujourd\'hui</button>';
  }
}

async function markSatiety(){
  var r = await sb.from('satiety_logs').upsert({user_id:USER.id, date:today()}, {onConflict:'user_id,date'});
  if(r.error){ toast('\u274c '+r.error.message); return; }
  SATIETY_TODAY = true;
  toast('\u2713 Journ\u00e9e valid\u00e9e par sati\u00e9t\u00e9');
  refreshDash();
}
async function undoSatiety(){
  await sb.from('satiety_logs').delete().eq('user_id',USER.id).eq('date',today());
  SATIETY_TODAY = false;
  refreshDash();
}


// \u2500\u2500 TOGGLE MODE FOCUS \u2500\u2500
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
  if(r.error){ toast('\u274c '+r.error.message); return; }
  PROF.hide_exact_kcal = newVal;
  var sw = document.getElementById('focus-mode-switch');
  if(sw) sw.classList.toggle('on', newVal);
  if(newVal){
    toast('\ud83c\udf3f Mode focus activ\u00e9');
  } else {
    showDetailReactivatedBanner();
  }
  refreshDash();
}

// Rappel bienveillant \u00e0 la d\u00e9sactivation du mode focus \u2014 les chiffres
// reviennent \u00e0 l'\u00e9cran, mais on ne veut pas que \u00e7a sonne comme "retour \u00e0
// la normale, maintenant g\u00e9rez bien votre solde". Auto-masqu\u00e9 apr\u00e8s un
// moment, avec un raccourci pour revenir en mode focus si la personne
// change d'avis tout de suite.
function showDetailReactivatedBanner(){
  var old = document.getElementById('detail-reactivated-banner');
  if(old) old.remove();
  var b = document.createElement('div');
  b.id = 'detail-reactivated-banner';
  b.style.cssText = 'position:fixed;top:14px;left:14px;right:14px;max-width:420px;margin:0 auto;background:var(--card);border:1px solid var(--border2);border-radius:14px;padding:14px 16px;box-shadow:0 8px 26px rgba(0,0,0,0.14);z-index:500;animation:slideDownBanner .3s ease';
  b.innerHTML = '<div style="font-weight:700;font-size:.86rem;margin-bottom:4px">\ud83d\udca1 Mode d\u00e9taill\u00e9 r\u00e9activ\u00e9</div>'
    +'<div style="font-size:.8rem;color:var(--text2);line-height:1.5;margin-bottom:10px">Les chiffres sont des outils pour votre suivi, pas des objectifs rigides \u00e0 atteindre absolument. \u00c9coutez votre corps avant tout.</div>'
    +'<button onclick="setFocusMode(true);document.getElementById(\'detail-reactivated-banner\').remove()" style="font-size:.76rem;font-weight:700;color:var(--gold);background:var(--gold-l);border:none;border-radius:999px;padding:6px 13px;cursor:pointer">Repasser en mode focus</button>';
  document.body.appendChild(b);
  setTimeout(function(){ if(b.parentNode) b.remove(); }, 9000);
}

// Avertissement requis avant d'activer le mode focus \u2014 masquer les
// chiffres n'est pas automatiquement le bon choix pour tout le monde non
// plus : \u00e7a peut, selon la situation, devenir un \u00e9vitement plut\u00f4t qu'un
// rapport plus sain \u00e0 l'alimentation. On demande une vraie confirmation
// plut\u00f4t qu'un simple clic silencieux.
function openFocusWarning(){
  var ov = document.createElement('div');
  ov.id = 'focus-warning-ov';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(22,36,27,0.55);z-index:998;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.innerHTML = '<div style="background:var(--card);border-radius:16px;padding:22px 20px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.2)">'
    +'<div style="font-size:1.6rem;margin-bottom:10px;text-align:center">\u26a0\ufe0f</div>'
    +'<div style="font-family:\'Lora\',serif;font-weight:700;font-size:1.05rem;margin-bottom:10px;text-align:center">Avant d\'activer le mode focus</div>'
    +'<div style="font-size:.86rem;color:var(--text2);line-height:1.6;margin-bottom:18px">Masquer les chiffres peut aider certaines personnes \u00e0 moins raisonner en "solde \u00e0 d\u00e9penser" \u2014 mais chez d\'autres, \u00e7a peut aussi devenir une fa\u00e7on d\'\u00e9viter de regarder son alimentation en face, ce qui n\'est pas plus sain sur le long terme. Ce n\'est pas un r\u00e9glage que nous recommandons par d\u00e9faut : on vous laisse ce choix, mais on pr\u00e9f\u00e8re \u00eatre honn\u00eate sur le fait qu\'il n\'est pas neutre.</div>'
    +'<button onclick="confirmFocusMode()" style="width:100%;padding:12px;border-radius:10px;border:none;background:var(--gold);color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;margin-bottom:8px">J\'ai compris, activer quand m\u00eame</button>'
    +'<button onclick="document.getElementById(\'focus-warning-ov\').remove()" style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--border2);background:none;color:var(--text2);font-weight:600;font-size:.9rem;cursor:pointer">Annuler</button>'
    +'</div>';
  document.body.appendChild(ov);
}
function confirmFocusMode(){
  document.getElementById('focus-warning-ov').remove();
  setFocusMode(true);
}

// Pr\u00e9visualisation admin-only du nouvel affichage kcal (plage dynamique).
// Pas d'avertissement ici (contrairement au mode focus) \u2014 c'est un simple
// r\u00e9glage d'affichage en test, pas un choix qui touche le rapport \u00e0
// l'alimentation de qui que ce soit d'autre que l'admin lui-m\u00eame.
async function togglePreviewKcal(){
  var newVal = !(PROF && PROF.preview_new_kcal === true);
  var r = await sb.from('profiles').update({preview_new_kcal:newVal}).eq('id',USER.id);
  if(r.error){ toast('\u274c '+r.error.message); return; }
  PROF.preview_new_kcal = newVal;
  document.getElementById('preview-kcal-switch').classList.toggle('on', newVal);
  toast(newVal ? '\ud83d\udd0d Pr\u00e9visualisation activ\u00e9e' : 'Retour \u00e0 l\'ancien affichage');
  refreshDash();
}


// \u2500\u2500 SUIVI \u00c9NERGIE / DIGESTION POST-REPAS \u2500\u2500
// Une \u00e9valuation rapide en un tap, propos\u00e9e dans le journal une fois qu'un
// repas contient au moins un aliment \u2014 sert de signal biologique concret
// (comment le corps r\u00e9agit) en compl\u00e9ment des chiffres, jamais \u00e0 la place.
var ENERGY_LABELS = {
  forme: {ico:'\ud83d\udfe2', lbl:'Pleine forme'},
  pompe: {ico:'\ud83d\udfe1', lbl:'Coup de pompe'},
  faim:  {ico:'\ud83d\udd34', lbl:'Faim persistante'}
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
    el.innerHTML = '<div class="energy-done">'+info.ico+' Ressenti enregistr\u00e9 : '+info.lbl
      +'<button onclick="undoEnergyCheckin()">Modifier</button></div>';
  } else {
    el.innerHTML = '<div class="energy-checkin">'
      +'<div class="energy-checkin-ttl">Comment vous sentez-vous apr\u00e8s ce repas ?</div>'
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
  if(r.error){ toast('\u274c '+r.error.message); return; }
  toast('Merci, c\'est not\u00e9');
  renderEnergyCheckin(true);
}
async function undoEnergyCheckin(){
  await sb.from('energy_checkins').delete().eq('user_id',USER.id).eq('date',today()).eq('repas',activeMeal);
  renderEnergyCheckin(true);
}


// \u2500\u2500 MOTEUR D'ALTERNATIVES ("Pantry Core") \u2500\u2500
// Pour un repas sugg\u00e9r\u00e9 donn\u00e9, propose deux types d'alternatives plut\u00f4t
// qu'un tirage al\u00e9atoire aveugle (l'ancien comportement du bouton \u21c4) :
// "Vos Classiques" (repas r\u00e9ellement mang\u00e9s le plus souvent par cette
// personne, tir\u00e9s de son propre historique) et "\u00c9quivalents Di\u00e9t\u00e9ticien"
// (vraies recettes cr\u00e9\u00e9es c\u00f4t\u00e9 admin, filtr\u00e9es pour ce type de repas).
// Volontairement, aucune diff\u00e9rence calorique n'est affich\u00e9e dans ce
// tiroir \u2014 le choix se fait sur ce que c'est, pas sur un delta de chiffre.

async function openAlternativesDrawer(mealKey){
  var old = document.getElementById('alt-drawer-ov');
  if(old) old.remove();

  var ov = document.createElement('div');
  ov.id = 'alt-drawer-ov';
  ov.className = 'alt-drawer-ov';
  ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML = '<div class="alt-drawer">'
    +'<div class="alt-drawer-hdr"><span>Alternatives \u2014 '+(MEAL_META[mealKey]?MEAL_META[mealKey].l:'')+'</span>'
    +'<button onclick="document.getElementById(\'alt-drawer-ov\').remove()" style="background:var(--bg2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer">\u2715</button></div>'
    +'<div class="alt-section-lbl">\ud83d\udd01 Vos classiques</div>'
    +'<div id="alt-classiques">Chargement\u2026</div>'
    +'<div class="alt-section-lbl">\ud83e\udd57 \u00c9quivalents di\u00e9t\u00e9ticien</div>'
    +'<div id="alt-dietitian">Chargement\u2026</div>'
    +'<button class="alt-surprise" onclick="document.getElementById(\'alt-drawer-ov\').remove();changeMealRecipe(\''+mealKey+'\')">\ud83c\udfb2 Surprends-moi</button>'
    +'</div>';
  document.body.appendChild(ov);

  var classiques = await computeVosClassiques(mealKey);
  var classEl = document.getElementById('alt-classiques');
  if(!classiques.length){
    classEl.innerHTML = '<div class="alt-empty">Pas encore assez d\'historique pour ce repas \u2014 revenez dans quelques jours.</div>';
  } else {
    classEl.innerHTML = classiques.map(function(g,idx){
      var names = g.entries.map(function(e){ return e.aliment; }).join(', ');
      var freqLbl = g.count>1 ? g.count+'x r\u00e9cemment' : 'Mang\u00e9 r\u00e9cemment';
      return '<div class="alt-item" onclick="applyClassique(\''+mealKey+'\','+idx+')">'
        +'<span class="alt-item-ico">\ud83d\udd01</span>'
        +'<div class="alt-item-body"><div class="alt-item-name">'+esc(names.length>50?names.slice(0,50)+'\u2026':names)+'</div>'
        +'<div class="alt-item-sub">'+freqLbl+'</div></div></div>';
    }).join('');
    window._altClassiques = classiques;
  }

  var equivalents = await fetchDietitianEquivalents(mealKey);
  var dietEl = document.getElementById('alt-dietitian');
  if(!equivalents.length){
    dietEl.innerHTML = '<div class="alt-empty">Aucune recette di\u00e9t\u00e9ticien disponible pour ce repas pour l\'instant.</div>';
  } else {
    dietEl.innerHTML = equivalents.map(function(r,idx){
      return '<div class="alt-item" onclick="applyDietitianRecipe(\''+mealKey+'\','+idx+')">'
        +'<span class="alt-item-ico">\ud83e\udd57</span>'
        +'<div class="alt-item-body"><div class="alt-item-name">'+esc(r.nom)+'</div>'
        +'<div class="alt-item-sub">Suggestion de l\'\u00e9quipe</div></div></div>';
    }).join('');
    window._altEquivalents = equivalents;
  }
}

// Analyse les 21 derniers jours du journal pour ce type de repas, regroupe
// par jour, et fait remonter les combinaisons d'aliments qui reviennent le
// plus souvent \u2014 m\u00eame logique que "Repas r\u00e9cents" dans le journal, mais
// appliqu\u00e9e ici au plan alimentaire.
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
  // Petite vari\u00e9t\u00e9 \u00e0 chaque ouverture plut\u00f4t que toujours les m\u00eames en t\u00eate
  for(var i=list.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=list[i]; list[i]=list[j]; list[j]=t; }
  return list.slice(0,4);
}

// Cat\u00e9gories utilis\u00e9es pour savoir QUOI ajuster quand il manque des
// calories \u00e0 combler sur un "classique" \u2014 certains aliments ont une
// portion naturelle qu'on ne force pas au-del\u00e0 (un yaourt ne se mange pas
// par tranches de 200g), d'autres se pr\u00eatent bien \u00e0 un ajustement, mais
// pas pour tout le monde (noix/miel \u00e0 \u00e9viter si diab\u00e8te ou pathologie
// concern\u00e9e, on pr\u00e9f\u00e8re alors fruits/craquelins).
var FIXED_PORTION_REGEX = /yaourt|yoghourt|yoghurt|fromage blanc|skyr|petit.suisse/;
var DENSE_FLEX_REGEX = /noix|amande|noisette|miel|sucre|fruits? secs?|raisins? secs?|beurre de cacahuete/;
var SAFE_FLEX_REGEX = /cracker|craquelin|biscotte|pomme|banane|orange|poire|kiwi|fraise|fruit/;

function normalizeTxt(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

// Ajuste les quantit\u00e9s d'un combo "classique" pour se rapprocher du
// besoin calorique du repas \u2014 seulement \u00e0 la hausse, seulement sur les
// aliments qui s'y pr\u00eatent, jamais sur les portions \u00e0 taille naturelle
// fixe (yaourt, fromage blanc...).
function adjustClassiqueForGap(items, mealKey){
  var tgt = calcTargets();
  var mealPcts = getMealPcts();
  var mealTarget = tgt.kcal * (mealPcts[mealKey]||0.2);
  var currentKcal = items.reduce(function(s,it){ return s+pN2(it.food.kcal)*it.qty/100; },0);
  var gap = mealTarget - currentKcal;

  // \u00c9cart trop faible pour justifier d'y toucher, ou d\u00e9j\u00e0 au-dessus \u2014
  // on laisse le classique tel quel (c'est tout le principe de cette
  // alternative : rester fid\u00e8le \u00e0 ce que la personne mange vraiment).
  if(gap < 80) return items;

  var pathos = (PROF && PROF.pathologies) || [];
  var avoidDenseSugar = pathos.indexOf('diabetes')>=0;

  // On identifie quels items du combo peuvent absorber l'\u00e9cart.
  var flexItems = items.filter(function(it){
    var n = normalizeTxt(it.food.nom);
    if(FIXED_PORTION_REGEX.test(n)) return false; // jamais ces portions-l\u00e0
    if(DENSE_FLEX_REGEX.test(n) && avoidDenseSugar) return false; // noix/miel \u00e9cart\u00e9s si pathologie concern\u00e9e
    return DENSE_FLEX_REGEX.test(n) || SAFE_FLEX_REGEX.test(n);
  });

  if(!flexItems.length) return items; // rien dans ce combo ne se pr\u00eate \u00e0 l'ajustement, on ne force rien

  var flexKcalTotal = flexItems.reduce(function(s,it){ return s+pN2(it.food.kcal)*it.qty/100; },0);
  if(flexKcalTotal<=0) return items;

  var scaleFactor = Math.min(2.2, (flexKcalTotal+gap)/flexKcalTotal); // jamais plus de 2.2x la quantit\u00e9 d'origine
  flexItems.forEach(function(it){ it.qty = Math.round(it.qty*scaleFactor); });
  return items;
}

function applyClassique(mealKey, idx){
  var g = window._altClassiques[idx];
  if(!g) return;
  // Les quantit\u00e9s historiques sont le point de d\u00e9part \u2014 c'est le principe
  // d'un "classique" : ce que la personne mange vraiment. On ajuste
  // seulement les aliments qui s'y pr\u00eatent si le besoin du jour est plus
  // \u00e9lev\u00e9 que d'habitude pour ce repas.
  var items = g.entries.map(function(e){
    return { food:{nom:e.aliment, unit:'g', kcal:e.food_kcal_100||0, prot:e.food_prot_100||0, gluc:e.food_gluc_100||0, lip:e.food_lip_100||0, fibres:e.food_fibres_100||0, pot:e.food_pot_100||0, cal:e.food_cal_100||0, fer:e.food_fer_100||0, mg:e.food_mg_100||0, zn:e.food_zn_100||0}, qty:e.quantite };
  });
  items = adjustClassiqueForGap(items, mealKey);
  CURRENT_PLAN[mealKey] = { recipeName:'Votre classique', recipeId:null, items:items };
  saveGenericPlan();
  document.getElementById('alt-drawer-ov').remove();
  renderMealPlan();
  toast('\u2705 Repas remplac\u00e9 par un de vos classiques');
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
  // scaleRecipe (ing) \u2014 m\u00eame contenu, avec unit:'g' explicite car les
  // vraies recettes n'ont pas ce champ (contrairement au pool statique),
  // et fmtQty() en a besoin pour afficher correctement les quantit\u00e9s.
  var adapted = { ing: (recipe.ingredients||[]).map(function(i){ return Object.assign({unit:'g'}, i); }) };
  CURRENT_PLAN[mealKey] = { recipeName:recipe.nom, recipeId:recipe.id, items:scaleRecipe(adapted, mealKcalTarget) };
  saveGenericPlan();
  document.getElementById('alt-drawer-ov').remove();
  renderMealPlan();
  toast('\u2705 Repas remplac\u00e9 par '+recipe.nom);
}


// \u2500\u2500 TENDANCE DE LA SEMAINE \u2500\u2500
// Un rep\u00e8re de progression narratif plut\u00f4t que chiffr\u00e9 : on regarde les 7
// derniers jours, on classe chaque jour selon l'\u00e9quilibre de l'assiette
// (m\u00eame logique que la carte du jour, appliqu\u00e9e r\u00e9trospectivement), et on
// en tire une phrase de synth\u00e8se plut\u00f4t qu'un tableau de chiffres.
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
    var vegW=0, protW=0, starchW=0, fatW=0;
    dayEntries.forEach(function(e){
      var n = normalizeTxt(e.aliment);
      var w = e.quantite||0;
      if(isLegume(e.aliment) || FRUIT_REGEX.test(n) || LEGUMINEUSE_REGEX.test(n)) vegW+=w;
      else if(PROTEIN_SRC_REGEX.test(n)) protW+=w;
      else if(STARCH_REGEX.test(n)) starchW+=w;
      else if(FAT_SRC_REGEX.test(n)) fatW+=w;
    });
    var totalW = vegW+protW+starchW+fatW;
    if(totalW<=0) return 'none';
    var vegPct=vegW/totalW*100, protPct=protW/totalW*100, starchPct=starchW/totalW*100, fatPct=100-vegPct-protPct-starchPct;
    var plateTgt = getPlateTargets();
    var deviation = Math.abs(vegPct-plateTgt.veg)+Math.abs(protPct-plateTgt.prot)+Math.abs(starchPct-plateTgt.starch)+Math.abs(fatPct-plateTgt.fat);
    return deviation<=32 ? 'good' : deviation<=52 ? 'mid' : 'low';
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
    narrative = 'Belle semaine \u2014 votre assiette est rest\u00e9e \u00e9quilibr\u00e9e '+goodCount+' jour'+(goodCount>1?'s':'')+' sur '+trackedCount+'.';
  } else if(goodCount>=3){
    narrative = 'Semaine plut\u00f4t r\u00e9guli\u00e8re, avec '+goodCount+' jours bien \u00e9quilibr\u00e9s sur '+trackedCount+' suivis.';
  } else {
    narrative = 'Une semaine un peu plus irr\u00e9guli\u00e8re \u2014 pas grave, chaque jour repart de z\u00e9ro.';
  }
  document.getElementById('weekly-trend-narrative').textContent = narrative;
}


// R\u00e9partition du poids (grammes) des aliments du jour entre v\u00e9g\u00e9taux,
// prot\u00e9ines et f\u00e9culents \u2014 bas\u00e9 sur le poids plut\u00f4t que les calories,
// pour rester fid\u00e8le \u00e0 la m\u00e9taphore visuelle de l'assiette (les
// mati\u00e8res grasses par ex. p\u00e8sent peu \u00e0 l'\u0153il mais beaucoup en kcal,
// ce qui fausserait la lecture si on utilisait les calories ici).
var PROTEIN_SRC_REGEX = /poulet|boeuf|porc|jambon|thon|saumon|cabillaud|dinde|veau|agneau|oeuf|tofu|poisson|crevette|merlu|colin|sardine|steak|escalope|filet de|blanc de|viande|charcuterie|seitan|tempeh/;
var STARCH_REGEX = /pates|riz|pain|pomme de terre|patate|quinoa|semoule|boulgour|cereales?|avoine|flocons|biscotte|tortilla|couscous/;
// Volontairement SANS les poissons gras (saumon, thon, sardine...) d\u00e9j\u00e0
// compt\u00e9s dans les prot\u00e9ines, ni les fruits secs (noix, amande...) d\u00e9j\u00e0
// utilis\u00e9s ailleurs dans le mode focus \u2014 \u00e9vite qu'un m\u00eame aliment ne
// compte deux fois dans deux cat\u00e9gories diff\u00e9rentes de l'assiette.
var FAT_SRC_REGEX = /huile|beurre|margarine|avocat|olives?|creme (fraiche|liquide|epaisse|culinaire|entiere|legere)|mayonnaise|noix|amande|noisette|graines? de (lin|chia|sesame|tournesol|courge)|pesto|tahin|saindoux|lard\b/;

// Le mod\u00e8le "assiette \u00e9quilibr\u00e9e" (v\u00e9g\u00e9taux / prot\u00e9ines / f\u00e9culents /
// mati\u00e8res grasses) est pens\u00e9 pour un adulte s\u00e9dentaire moyen \u2014 les besoins
// r\u00e9els changent avec le niveau d'activit\u00e9 : plus on bouge, plus les
// besoins en prot\u00e9ines (r\u00e9cup\u00e9ration musculaire) et en glucides complexes
// (\u00e9nergie, r\u00e9serves de glycog\u00e8ne) augmentent, proportionnellement moins
// de place pour les v\u00e9g\u00e9taux dans l'assiette (pas moins de v\u00e9g\u00e9taux en
// valeur absolue \u2014 l'assiette globale est simplement plus grande). La part
// de mati\u00e8res grasses reste volontairement petite en POIDS (une cuill\u00e8re
// d'huile p\u00e8se peu m\u00eame si elle compte beaucoup en kcal) \u2014 cette carte
// travaille en grammes, pas en calories, pour rester fid\u00e8le \u00e0 ce qu'on voit
// vraiment dans l'assiette.
var ACTIVITY_PLATE_TARGETS = {
  sedentary: {veg:47, prot:19, starch:28, fat:6},
  light:     {veg:42, prot:21, starch:30, fat:7},
  moderate:  {veg:37, prot:23, starch:33, fat:7},
  active:    {veg:33, prot:26, starch:34, fat:7},
  sportif:   {veg:28, prot:28, starch:36, fat:8}
};
function getPlateTargets(){
  var act = (PROF && PROF.activite) || 'sedentary';
  return ACTIVITY_PLATE_TARGETS[act] || ACTIVITY_PLATE_TARGETS.sedentary;
}

function renderBalancedPlate(entries){
  var plateCard = document.getElementById('balanced-plate-card');
  if(!plateCard) return;
  var today_ = entries.filter(function(e){ return e.date===today(); });
  if(!today_.length){ plateCard.style.display='none'; return; }

  var vegW=0, protW=0, starchW=0, fatW=0;
  today_.forEach(function(e){
    var n = normalizeTxt(e.aliment);
    var w = e.quantite||0;
    if(isLegume(e.aliment) || FRUIT_REGEX.test(n) || LEGUMINEUSE_REGEX.test(n)) vegW += w;
    else if(PROTEIN_SRC_REGEX.test(n)) protW += w;
    else if(STARCH_REGEX.test(n)) starchW += w;
    else if(FAT_SRC_REGEX.test(n)) fatW += w;
  });

  var totalW = vegW+protW+starchW+fatW;
  plateCard.style.display = 'block';
  if(totalW<=0){
    document.getElementById('plate-status').textContent = 'Ajoutez vos repas pour voir la structure de votre assiette.';
    document.getElementById('plate-ultra-status').style.display = 'none';
    ['veg','prot','starch','fat'].forEach(function(k){
      document.getElementById('plate-'+k+'-fill').style.width='0%';
      document.getElementById('plate-'+k+'-pct').textContent='0%';
    });
    return;
  }

  var vegPct = Math.round(vegW/totalW*100);
  var protPct = Math.round(protW/totalW*100);
  var starchPct = Math.round(starchW/totalW*100);
  var fatPct = 100-vegPct-protPct-starchPct;

  var plateTgt = getPlateTargets();
  var actLabels = {sedentary:'s\u00e9dentaire', light:'l\u00e9g\u00e8rement actif', moderate:'mod\u00e9r\u00e9ment actif', active:'actif', sportif:'sportif'};
  var actKey = (PROF && PROF.activite) || 'sedentary';
  var capEl = document.getElementById('plate-tgt-caption');
  if(capEl) capEl.textContent = 'Rep\u00e8re ajust\u00e9 \u00e0 votre niveau d\'activit\u00e9 ('+(actLabels[actKey]||'s\u00e9dentaire')+') : ~'+plateTgt.veg+'/'+plateTgt.prot+'/'+plateTgt.starch+'/'+plateTgt.fat;

  document.getElementById('plate-veg-fill').style.width=vegPct+'%';
  document.getElementById('plate-veg-pct').textContent=vegPct+'%';
  document.getElementById('plate-prot-fill').style.width=protPct+'%';
  document.getElementById('plate-prot-pct').textContent=protPct+'%';
  document.getElementById('plate-starch-fill').style.width=starchPct+'%';
  document.getElementById('plate-starch-pct').textContent=starchPct+'%';
  document.getElementById('plate-fat-fill').style.width=fatPct+'%';
  document.getElementById('plate-fat-pct').textContent=fatPct+'%';

  // Dimension ultra-transform\u00e9 \u2014 calcul\u00e9e AVANT le verdict de structure,
  // pour que les deux messages de cette m\u00eame carte ne se contredisent
  // jamais (le pi\u00e8ge qu'on avait d\u00e9j\u00e0 rencontr\u00e9 avec le tampon glyc\u00e9mique).
  // R\u00e9utilise la m\u00eame d\u00e9tection que le Score Sant\u00e9 (signal explicite
  // IA/NOVA en priorit\u00e9, mots-cl\u00e9s en repli).
  var ultraN = 0;
  if(typeof getUltraProcessedList==='function'){
    ultraN = getUltraProcessedList(today_).length;
  }

  // \u00c9cart par rapport au rep\u00e8re ajust\u00e9 au niveau d'activit\u00e9 (voir
  // getPlateTargets) \u2014 statut qualitatif doux, jamais un chiffre \u00e0
  // atteindre au pourcentage pr\u00e8s. La structure peut \u00eatre parfaite sur le
  // papier (poids) tout en \u00e9tant tr\u00e8s transform\u00e9e dans les faits (pizza,
  // p\u00e2tisserie...) \u2014 le verdict "tr\u00e8s \u00e9quilibr\u00e9e" est donc r\u00e9serv\u00e9 aux
  // journ\u00e9es qui le sont vraiment sur les deux plans.
  var deviation = Math.abs(vegPct-plateTgt.veg)+Math.abs(protPct-plateTgt.prot)+Math.abs(starchPct-plateTgt.starch)+Math.abs(fatPct-plateTgt.fat);
  var statusTxt = (deviation<=27 && ultraN<=1) ? 'Structure de l\'assiette : tr\u00e8s \u00e9quilibr\u00e9e aujourd\'hui.'
    : (deviation<=27 && ultraN>=2) ? 'Bonne r\u00e9partition des familles, mais plusieurs aliments transform\u00e9s aujourd\'hui \u2014 la qualit\u00e9 compte autant que la structure.'
    : deviation<=48 ? 'Structure de l\'assiette : plut\u00f4t \u00e9quilibr\u00e9e.'
    : vegPct<30 ? 'Une portion de l\u00e9gumes ou de fruits en plus donnerait plus de place aux v\u00e9g\u00e9taux.'
    : 'Continuez \u00e0 varier les trois familles \u00e0 chaque repas.';
  document.getElementById('plate-status').textContent = statusTxt;

  // Ton encourageant m\u00eame quand il y en a, pas de liste culpabilisante ici
  // \u2014 le d\u00e9tail existe d\u00e9j\u00e0 dans Qualit\u00e9 nutritionnelle si besoin.
  var ultraEl = document.getElementById('plate-ultra-status');
  if(typeof getUltraProcessedList==='function'){
    ultraEl.style.display = 'block';
    if(ultraN===0){
      ultraEl.innerHTML = '<b>\ud83c\udf3f Aucun aliment ultra-transform\u00e9 aujourd\'hui</b> \u2014 de l\'assiette brute du d\u00e9but \u00e0 la fin.';
    } else if(ultraN===1){
      ultraEl.textContent = '1 aliment ultra-transform\u00e9 aujourd\'hui \u2014 le reste de l\'assiette reste bien brut.';
    } else {
      ultraEl.textContent = ultraN+' aliments ultra-transform\u00e9s aujourd\'hui \u2014 rien de grave ponctuellement, viser des aliments bruts reste le repère à garder en tête.';
    }
  }
}

// \u2500\u2500 DIVERSIT\u00c9 V\u00c9G\u00c9TALE DE LA SEMAINE \u2500\u2500
// Compte les v\u00e9g\u00e9taux DISTINCTS (l\u00e9gumes, fruits, c\u00e9r\u00e9ales compl\u00e8tes,
// l\u00e9gumineuses, graines) consomm\u00e9s sur les 7 derniers jours \u2014 un
// indicateur associ\u00e9 \u00e0 la diversit\u00e9 du microbiote, ind\u00e9pendant des
// quantit\u00e9s ou des calories.
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
  document.getElementById('diversity-count').textContent = count+' / 20 v\u00e9g\u00e9taux';
  document.getElementById('diversity-fill').style.width = Math.min(100, count/20*100)+'%';
  document.getElementById('diversity-msg').textContent = count>=20
    ? 'Superbe diversit\u00e9 cette semaine \u2014 votre microbiote vous dit merci.'
    : count>=12
    ? 'Belle diversit\u00e9 cette semaine, encore quelques v\u00e9g\u00e9taux diff\u00e9rents pour viser les 20.'
    : 'Plus vous variez l\u00e9gumes, fruits, c\u00e9r\u00e9ales et l\u00e9gumineuses, mieux c\'est pour votre microbiote.';
}
