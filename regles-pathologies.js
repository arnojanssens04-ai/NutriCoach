/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   regles-pathologies.js \u2014 R\u00e8gles nutritionnelles partag\u00e9es NutriCoach
   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Fichier JS partag\u00e9 entre dashboard.html, plan-fixe.html et recette.html
   (via <script src="regles-pathologies.js"></script>) \u2014 toute la logique
   li\u00e9e aux pathologies vit ICI, en un seul endroit. C'est pr\u00e9cis\u00e9ment ce
   qui manquait avant : un m\u00eame filtre diab\u00e8te existait en double dans
   dashboard.html, et une correction faite \u00e0 un endroit a \u00e9t\u00e9 oubli\u00e9e \u00e0
   l'autre. Avec un seul fichier partag\u00e9, ce type de bug ne peut plus se
   reproduire \u2014 toute correction future profite automatiquement \u00e0 toutes
   les pages qui l'incluent.

   IMPORTANT POUR LE D\u00c9PLOIEMENT : ce fichier doit \u00eatre upload\u00e9 sur GitHub
   au M\u00caME niveau que les fichiers .html (pas dans un sous-dossier), pour
   que le chemin relatif "regles-pathologies.js" utilis\u00e9 dans les balises
   <script> fonctionne correctement une fois le site d\u00e9ploy\u00e9.
   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

// \u2500\u2500 DIAB\u00c8TE \u2500\u2500 proxy d'impact glyc\u00e9mique : ratio fibres/glucides \u2500\u2500
// Le riz blanc a ~28g de glucides et seulement ~0,4g de fibres pour 100g
// (ratio 1,4%) \u2014 un tr\u00e8s mauvais choix glyc\u00e9mique malgr\u00e9 un total de
// fibres journalier qui peut sembler correct par ailleurs.
// Seuils : \u226510% bon, 5-10% moyen, <5% \u00e0 \u00e9viter.
function fibreGlucRatio(gluc100, fibres100){
  if(!gluc100 || gluc100<=0) return null;
  return (fibres100||0)/gluc100*100;
}

// Table de fibres d\u00e9di\u00e9e aux aliments utilis\u00e9s dans les recettes
// sugg\u00e9r\u00e9es \u2014 ind\u00e9pendante du chargement asynchrone de la base Ciqual
// (qui peut ne pas \u00eatre encore pr\u00eat au moment de g\u00e9n\u00e9rer un plan) et de
// tout risque d'incoh\u00e9rence de code. Garantit que le filtre fonctionne
// de fa\u00e7on fiable et imm\u00e9diate, \u00e0 chaque fois.
var RECIPE_FIBRES_BY_NOM = {
  'Pain blanc':2.7, 'Beurre':0, 'Yaourt nature':0, 'Banane':1.7, '\u0152uf dur':0,
  'Avocat':6.7, 'Orange':1.9, "Flocons d'avoine":9.0, 'Lait demi-\u00e9cr\u00e9m\u00e9':0,
  'Pomme':2.0, 'Amandes':9.4, 'Fromage blanc':0, 'Kiwi':2.6,
  'Blanc de poulet':0, 'Riz blanc cuit':0.4, 'Brocoli':2.5, "Huile d'olive":0,
  'Cabillaud':0, 'Patate douce cuite':2.5, 'Courgette':1.1, 'Saumon':0,
  'Quinoa cuit':2.8, '\u00c9pinards':2.2, 'Steak de b\u0153uf grill\u00e9':0,
  'P\u00e2tes cuites':1.8, 'P\u00e2tes compl\u00e8tes cuites':5.0, 'Carotte':2.6,
  'Tofu nature':0.7, 'Boulgour cuit':4.5, 'Poivron rouge':1.6,
  'Colin (lieu jaune)':0, 'Pomme de terre cuite':1.8, 'Haricots verts':2.7,
  'Dinde r\u00f4tie':0, 'Chou-fleur':2.0, 'Salade verte':1.5, 'Huile de colza':0,
  'P\u00eache':1.4, 'Lentilles cuites':7.9, 'Riz complet cuit':1.8,
  'Pois chiches cuits':7.6, 'Haricots rouges cuits':6.0, 'Noix':5.0,
  'Tomate':1.2, 'Framboises':6.5, 'Myrtilles':2.4, 'Pain complet':6.9,
  // \u2500\u2500 Ajouts Phase 2 (\u00e9largissement de la base de recettes) \u2500\u2500
  'Pain de seigle':4.5, 'Fromage de ch\u00e8vre frais':0, 'Raisin':1.4,
  'Graines de chia':34.4, 'Pruneaux':5.1, 'Noisettes':11.6, 'Faisselle 0%':0.1,
  'Mangue':1.6, 'Graines de lin':24.4, 'Houmous':5.2, 'Champignons de Paris':2.2,
  'Cerises':1.6, 'Jambon de dinde':0.4, 'Ananas':1.2, 'Noix de cajou':8.4,
  'Abricots':1.7, 'Pain aux c\u00e9r\u00e9ales':5.8, 'Crevettes cuites':0, 'Petits pois':5.8,
  'Filet mignon de porc':0, "Gigot d'agneau r\u00f4ti":0, 'Thon au naturel':0,
  'Lapin cuit':0, 'Tempeh':6.2, 'Haricots blancs cuits':13.8, 'Escalope de dinde':0,
  "Sardines \u00e0 l'huile d'olive":0, 'Aubergine cuite':2.5, 'Fenouil':2.6,
  'Betterave cuite':2.5, 'Chou rouge cuit':3.0, 'Courge butternut':1.8,
  'Dattes':7.3, 'Pistaches':10.2, 'Concombre':0.5,
  // \u2500\u2500 Ajouts collations sal\u00e9es/vari\u00e9es \u2500\u2500
  'Cracker de seigle':16.7, 'Galette de riz souffl\u00e9':3.4, 'Chocolat noir 70%':12.8,
  'Olives noires':6.5, 'Radis':1.4, 'Tomates cerises':1.2
};

// Rep\u00e8re si UN SEUL ingr\u00e9dient de la recette (\u00e0 sa quantit\u00e9 de base, avant
// mise \u00e0 l'\u00e9chelle) a un impact glyc\u00e9mique marqu\u00e9 \u2014 plus de 15g de
// glucides apport\u00e9s, et moins de 5% de fibres par rapport aux glucides.
// Le pain blanc, par exemple, est d\u00e9tect\u00e9 ainsi sans avoir besoin d'une
// liste fig\u00e9e de noms d'aliments \u00e0 exclure.
function recipeHasGlycemicCulprit(recipe){
  return recipe.ing.some(function(ing){
    var carbGrams = (ing.gluc||0)*ing.qty/100;
    if(carbGrams<=15) return false;
    if(!RECIPE_FIBRES_BY_NOM.hasOwnProperty(ing.nom)) return false; // donn\u00e9e inconnue -> jamais p\u00e9nalis\u00e9 par d\u00e9faut
    var ratio = fibreGlucRatio(ing.gluc, RECIPE_FIBRES_BY_NOM[ing.nom]);
    return ratio!==null && ratio<5;
  });
}

// Filtre commun \u00e0 tous les endroits o\u00f9 une recette est choisie pour une
// personne (g\u00e9n\u00e9ration initiale du plan, bouton "\u21c4" pour changer de
// suggestion, etc.) \u2014 une seule fonction partag\u00e9e \u00e9vite qu'un filtre
// corrig\u00e9 \u00e0 un endroit soit oubli\u00e9 ailleurs.
function filterRecipesForPathologies(pool, pathologies){
  var filtered = pool.filter(function(r){
    return !r.excludeFor.some(function(p){ return pathologies.indexOf(p)>=0; });
  });
  if(pathologies.indexOf('diabetes')>=0){
    var noCulprit = filtered.filter(function(r){ return !recipeHasGlycemicCulprit(r); });
    if(noCulprit.length) filtered = noCulprit;
  }
  // Maladie c\u0153liaque : exclure toute recette dont au moins un ingr\u00e9dient
  // est une source de gluten connue \u2014 m\u00eame logique que pour le diab\u00e8te,
  // avec un filet de s\u00e9curit\u00e9 si le pool deviendrait vide.
  if(pathologies.indexOf('coeliac')>=0 || pathologies.indexOf('coeliaque')>=0){
    var noGluten = filtered.filter(function(r){
      return !r.ing.some(function(ing){ return !!containsGluten(ing.nom); });
    });
    if(noGluten.length) filtered = noGluten;
  }
  return filtered;
}

// Badge discret \ud83c\udf3f affich\u00e9 \u00e0 c\u00f4t\u00e9 d'un aliment dans le Plan fixe ou une
// Recette, quand son impact glyc\u00e9mique est marqu\u00e9 (diab\u00e8te uniquement).
// Non bloquant \u2014 juste informatif, pour d\u00e9cider en connaissance de cause.
function glycemicBadge(it){
  var pathos = (typeof PROF!=='undefined' && PROF && PROF.pathologies) || [];
  if(pathos.indexOf('diabetes')<0) return '';
  var g = (typeof pN==='function') ? pN(it.gluc) : (it.gluc||0);
  var q = (typeof pN==='function') ? pN(it.qty) : (it.qty||0);
  var f = (typeof pN==='function') ? pN(it.fibres) : (it.fibres||0);
  var carbGrams = g*q/100;
  if(carbGrams<=15) return '';
  var ratio = fibreGlucRatio(g, f);
  if(ratio===null || ratio>=5) return '';
  return ' <span title="Peu de fibres pour la quantit\u00e9 de glucides \u2014 impact glyc\u00e9mique plus marqu\u00e9" style="cursor:help">\ud83c\udf3f</span>';
}

// \u2500\u2500 DIAB\u00c8TE \u2014 BISCUITS \u2500\u2500 r\u00e8gle d\u00e9di\u00e9e, pr\u00eate \u00e0 \u00eatre utilis\u00e9e d\u00e8s qu'un
// aliment ou une recette "biscuit" est ajout\u00e9 avec un champ "sucres"
// distinct du total des glucides (les biscuits sont jug\u00e9s sur leur taux
// de sucres, pas sur le ratio fibres/glucides classique).
var MAX_SUCRES_BISCUITS_PER_100G = 15;
function biscuitTropSucre(sucres100){
  return (sucres100||0) > MAX_SUCRES_BISCUITS_PER_100G;
}

// \u2500\u2500 DIAB\u00c8TE \u2014 TAMPON GLYC\u00c9MIQUE PAR REPAS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Version "par repas" du m\u00eame principe que le tampon glyc\u00e9mique journalier
// d\u00e9j\u00e0 affich\u00e9 sur la carte kcal (ratio fibres/glucides du jour) : ici on
// \u00e9value UN repas pr\u00e9cis, avec en plus la pr\u00e9sence de prot\u00e9ines (qui
// ralentissent elles aussi la vidange gastrique et la r\u00e9ponse glyc\u00e9mique,
// en compl\u00e9ment des fibres). Fonction PARTAG\u00c9E pour que dashboard.html et
// tout futur \u00e9cran (tendance hebdo, etc.) utilisent la m\u00eame r\u00e8gle \u2014 ne
// jamais recopier ces seuils ailleurs.
//
// Seuils choisis pour rester coh\u00e9rents avec le tampon journalier existant
// (12%/6% de fibres sur glucides) tout en tenant compte du fait qu'un seul
// repas est un \u00e9chantillon plus petit et plus bruit\u00e9 qu'une journ\u00e9e enti\u00e8re :
// on assouplit donc l\u00e9g\u00e8rement (10%/5%) et on donne un second chemin de
// validation via les prot\u00e9ines quand les fibres seules sont un peu justes.
function mealGlycemicBuffer(gluc, fibres, prot){
  gluc = gluc||0; fibres = fibres||0; prot = prot||0;
  var netCarbs = Math.max(0, gluc - fibres);
  if(gluc < 8) return null; // charge glucidique trop faible pour \u00eatre \u00e9valu\u00e9e utilement
  var fibreRatio = fibres / gluc; // proportion de fibres par rapport aux glucides
  // Pr\u00e9sence prot\u00e9ique jug\u00e9e significative si le repas apporte au moins
  // 10g de prot\u00e9ines OU si les prot\u00e9ines repr\u00e9sentent au moins un quart
  // du poids des glucides \u2014 les deux cas courants d'un repas construit
  // autour d'une source prot\u00e9ique (viande, poisson, \u0153ufs, l\u00e9gumineuses...).
  var proteinPresent = prot >= 10 || (gluc > 0 && prot / gluc >= 0.25);
  var optimal = fibreRatio >= 0.10 || (fibreRatio >= 0.05 && proteinPresent);
  return {
    netCarbs: netCarbs,
    fibreRatio: fibreRatio,
    proteinPresent: proteinPresent,
    level: optimal ? 'optimal' : 'risque'
  };
}

// Construit le badge HTML affich\u00e9 sur une carte "repas" (dashboard.html,
// grille "Mes repas") \u2014 n'affiche rien si le profil n'est pas diab\u00e9tique ou
// si le repas n'apporte pas assez de glucides pour \u00eatre \u00e9valu\u00e9.
function mealGlycemicBadgeHTML(gluc, fibres, prot){
  var pathos = (typeof PROF!=='undefined' && PROF && PROF.pathologies) || [];
  if(pathos.indexOf('diabetes')<0) return '';
  var res = mealGlycemicBuffer(gluc, fibres, prot);
  if(!res) return '';
  if(res.level==='optimal'){
    return '<div class="meal-glyc-badge meal-glyc-ok" title="Fibres et/ou prot\u00e9ines pr\u00e9sentes avec les glucides de ce repas \u2014 la r\u00e9ponse glyc\u00e9mique tend \u00e0 \u00eatre mieux liss\u00e9e">\ud83d\udfe2 Tampon glyc\u00e9mique optimal</div>';
  }
  return '<div class="meal-glyc-badge meal-glyc-warn" title="Peu de fibres et de prot\u00e9ines pour accompagner les glucides de ce repas \u2014 risque de pic glyc\u00e9mique plus marqu\u00e9">\ud83d\udfe0 Risque de pic glyc\u00e9mique</div>';
}

// \u2500\u2500 SANT\u00c9 CARDIOVASCULAIRE \u2014 INDICATEUR DE PROTECTION CARDIOVASCULAIRE \u2500\u2500\u2500\u2500\u2500
// Synth\u00e8se cardioprotectrice construite \u00e0 partir des M\u00caMES donn\u00e9es que les
// cartes "Sodium" et "Graisses satur\u00e9es" d\u00e9j\u00e0 affich\u00e9es (aucune contradiction
// possible : c'est une lecture combin\u00e9e des m\u00eames chiffres, pas un mod\u00e8le
// ind\u00e9pendant qui pourrait raconter une histoire diff\u00e9rente).
//
// Trois facteurs, pond\u00e9r\u00e9s \u00e0 parts \u00e9gales :
//  1. Ratio Sodium/Potassium \u2014 un ratio bas est associ\u00e9 \u00e0 une meilleure
//     r\u00e9gulation de la tension art\u00e9rielle (rep\u00e8re OMS ~2000mg Na / 3500mg K).
//  2. Qualit\u00e9 des lipides \u2014 part des graisses satur\u00e9es dans le total des
//     lipides (rep\u00e8re 10% des kcal / max 20% des lipides totaux, d\u00e9j\u00e0 utilis\u00e9
//     dans le Score Sant\u00e9) \u2014 les acides gras mono-insatur\u00e9s et om\u00e9ga-3
//     disponibles dans les donn\u00e9es (colonnes food_mono_100/food_o3*_100) sont
//     valoris\u00e9s positivement.
//  3. Fibres \u2014 la base Ciqual actuellement extraite ne distingue pas les
//     fibres solubles des fibres totales ; on utilise donc les fibres
//     totales comme approximation, en le pr\u00e9cisant dans le libell\u00e9 plut\u00f4t
//     que d'annoncer une pr\u00e9cision qu'on n'a pas.
//
// IMPORTANT : ne jamais faire d\u00e9pendre ce score des calories consomm\u00e9es \u2014
// uniquement de la composition des aliments (voir philosophie Mode Focus,
// section 3.1 du prompt de passation : jamais de garde-fou anti-restriction
// contourn\u00e9 ici).
function cardioProtectiveScore(T, tgt){
  var factors = [];

  // 1. Sodium / Potassium
  var naKScore = 50;
  if(T.pot > 0){
    var ratioNaK = T.na / T.pot;
    if(ratioNaK <= 0.66) naKScore = 100;
    else if(ratioNaK >= 1.5) naKScore = 15;
    else naKScore = Math.round(100 - (ratioNaK-0.66)/(1.5-0.66)*85);
  }
  factors.push({key:'naK', label:'Ratio Sodium / Potassium', score:naKScore});

  // 2. Qualit\u00e9 des lipides (part des graisses satur\u00e9es + apport insatur\u00e9/om\u00e9ga-3)
  var fatScore = 50;
  if(T.lip > 0){
    var agsShare = T.ags / T.lip; // part des lipides totaux qui est satur\u00e9e
    var unsatG = (T.mono||0) + (T.o3a||0) + (T.o3e||0) + (T.o3d||0);
    var base = agsShare <= 0.20 ? 100 : Math.max(0, 100 - (agsShare-0.20)*400);
    var bonus = Math.min(15, (unsatG / T.lip) * 30); // petit bonus si mono-insatur\u00e9s/om\u00e9ga-3 bien repr\u00e9sent\u00e9s
    fatScore = Math.max(0, Math.min(100, Math.round(base + bonus)));
  }
  factors.push({key:'fat', label:'Qualit\u00e9 des lipides (satur\u00e9s vs insatur\u00e9s/om\u00e9ga-3)', score:fatScore});

  // 3. Fibres (approximation des fibres solubles \u2014 voir note ci-dessus)
  var fibresScore = Math.max(0, Math.min(100, Math.round((T.fibres/(tgt.fibres||27))*100)));
  factors.push({key:'fibres', label:'Fibres (l\u00e9gumineuses, avoine, l\u00e9gumes...)', score:fibresScore});

  var overall = Math.round(factors.reduce(function(s,f){return s+f.score;},0)/factors.length);
  var level = overall>=80 ? {cls:'ok', lbl:'Profil cardioprotecteur'}
    : overall>=55 ? {cls:'mid', lbl:'Profil cardio \u00e0 renforcer'}
    : {cls:'low', lbl:'Vigilance cardiovasculaire'};

  return {score:overall, level:level.cls, label:level.lbl, factors:factors};
}

// \u2500\u2500 RECOMMANDATIONS CULINAIRES CONCR\u00c8TES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Remplace les conseils th\u00e9oriques bruts ("il vous manque Xg de fibres") par
// une suggestion d'aliment pr\u00e9cis, avec une portion r\u00e9aliste et son apport
// r\u00e9el \u2014 en r\u00e9utilisant les donn\u00e9es d\u00e9j\u00e0 v\u00e9rifi\u00e9es de RECIPE_FIBRES_BY_NOM
// plut\u00f4t que d'inventer de nouveaux chiffres non v\u00e9rifi\u00e9s.
// Portions calibr\u00e9es pour \u00eatre r\u00e9alistes en accompagnement d'un repas (pas
// une portion "plat principal" \u00e0 elles seules).
var FIBER_BOOST_SUGGESTIONS = [
  {nom:'lentilles cuites', portion:150, unite:'g', fibres100:7.9},
  {nom:'pois chiches cuits', portion:150, unite:'g', fibres100:7.6},
  {nom:'un demi-avocat', portion:75, unite:'g', fibres100:6.7},
  {nom:'framboises', portion:125, unite:'g', fibres100:6.5},
  {nom:'flocons d\'avoine', portion:40, unite:'g', fibres100:9.0},
  {nom:'brocoli', portion:150, unite:'g', fibres100:2.5}
];
function suggestFiberBoost(seed){
  var idx = (typeof seed==='number' && isFinite(seed)) ? Math.abs(Math.round(seed))%FIBER_BOOST_SUGGESTIONS.length : Math.floor(Math.random()*FIBER_BOOST_SUGGESTIONS.length);
  var s = FIBER_BOOST_SUGGESTIONS[idx];
  var apport = (s.fibres100 * s.portion / 100).toFixed(1);
  var qty = s.unite==='g' && s.nom.indexOf('avocat')>=0 ? '' : s.portion+s.unite+' de ';
  return 'Pour amortir ce repas, ajoutez '+(s.nom.indexOf('avocat')>=0 ? s.nom : qty+s.nom)+' (+'+apport+'g de fibres).';
}

var POTASSIUM_BOOST_SUGGESTIONS = [
  {nom:'une banane', pot100:358, portion:120},
  {nom:'150g de lentilles cuites', pot100:270, portion:150},
  {nom:'150g d\'\u00e9pinards cuits', pot100:466, portion:150},
  {nom:'une pomme de terre cuite avec la peau', pot100:420, portion:150}
];
function suggestPotassiumBoost(seed){
  var idx = (typeof seed==='number' && isFinite(seed)) ? Math.abs(Math.round(seed))%POTASSIUM_BOOST_SUGGESTIONS.length : Math.floor(Math.random()*POTASSIUM_BOOST_SUGGESTIONS.length);
  var s = POTASSIUM_BOOST_SUGGESTIONS[idx];
  var apport = Math.round(s.pot100 * s.portion / 100);
  return 'Pour r\u00e9\u00e9quilibrer, ajoutez '+s.nom+' (+'+apport+'mg de potassium).';
}

// \u2500\u2500 ORDRE DE CONSOMMATION DES ALIMENTS (rep\u00e8re informatif) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Certaines \u00e9tudes sugg\u00e8rent qu'\u00e0 repas identique, commencer par les
// l\u00e9gumes/fibres, puis les prot\u00e9ines, et terminer par les f\u00e9culents peut
// att\u00e9nuer le pic glyc\u00e9mique post-prandial. Message volontairement pr\u00e9sent\u00e9
// comme un rep\u00e8re simple, pas une r\u00e8gle stricte \u00e0 culpabiliser si non suivie.
var MEAL_ORDER_TIP = 'Astuce : \u00e0 repas identique, commencer par les l\u00e9gumes, '
  +'puis les prot\u00e9ines, et terminer par les f\u00e9culents peut aider \u00e0 lisser la '
  +'r\u00e9ponse glyc\u00e9mique.';

// \u2500\u2500 C\u0152LIAQUE (\u00e0 venir) \u2500\u2500
// Emplacement r\u00e9serv\u00e9 : liste d'aliments/ingr\u00e9dients contenant du gluten
// \u00e0 exclure automatiquement des suggestions pour les profils c\u0153liaques.

// \u2500\u2500 FODMAP (\u00e0 venir) \u2500\u2500
// Emplacement r\u00e9serv\u00e9 : r\u00e8gles d'exclusion des aliments riches en FODMAPs
// pour les profils concern\u00e9s (troubles digestifs).

// \u2500\u2500 ALTERNATIVES PAR CAT\u00c9GORIE \u2500\u2500
// Donn\u00e9es nutritionnelles compl\u00e8tes (v\u00e9rifi\u00e9es) pour chaque alternative \u2014
// indispensable pour que le remplacement dans le plan fixe fonctionne sans
// que l'utilisateur ait \u00e0 rechercher les valeurs \u00e0 la main.
// La quantit\u00e9 propos\u00e9e correspond \u00e0 une portion courante de l'aliment.
var ALTERNATIVES_PAR_CATEGORIE = {
  biscuit: [
    {code:'32053', nom:'Galette de riz souffl\u00e9', kcal:391, prot:7.2, gluc:81.7, lip:2.7, ags:0.9, fibres:3.4, pot:120, qty:15, unit:'g',
     raison:'0.5g de sucres / 100g vs 20\u201330g pour la plupart des biscuits'},
    {code:'31063', nom:'Cracker de seigle (Wasa)', kcal:297, prot:11.6, gluc:50.4, lip:1.5, ags:0.2, fibres:16.7, pot:340, qty:20, unit:'g',
     raison:'16g de fibres / 100g \u2014 l\'une des meilleures options dans la cat\u00e9gorie "\u00e0 grignoter"'}
  ],
  pain_blanc: [
    {code:'7004', nom:'Pain complet', kcal:246, prot:8.8, gluc:41.4, lip:2.7, ags:0.5, fibres:6.9, pot:230, qty:60, unit:'g',
     raison:'Ratio fibres/glucides de 16.7% vs 4.6% pour le pain blanc'},
    {code:'7009', nom:'Pain de seigle', kcal:219, prot:6.7, gluc:42.5, lip:1.7, ags:0.2, fibres:6.2, pot:190, qty:60, unit:'g',
     raison:'Index glyc\u00e9mique sensiblement plus bas que le pain blanc'}
  ],
  riz_blanc: [
    {code:'9410', nom:'Riz complet cuit', kcal:123, prot:2.7, gluc:25.8, lip:1.0, ags:0.2, fibres:1.8, pot:86, qty:150, unit:'g',
     raison:'Fibres pr\u00e9serv\u00e9es, index glyc\u00e9mique plus bas'},
    {code:'9341', nom:'Quinoa cuit', kcal:149, prot:4.7, gluc:27.9, lip:1.1, ags:0.14, fibres:2.8, pot:220, qty:150, unit:'g',
     raison:'Prot\u00e9ines compl\u00e8tes et meilleur ratio fibres/glucides'}
  ],
  pates_blanches: [
    {code:'9813', nom:'P\u00e2tes compl\u00e8tes cuites', kcal:124, prot:5.3, gluc:23.6, lip:0.9, ags:0.17, fibres:5.0, pot:80, qty:150, unit:'g',
     raison:'5\u00d7 plus de fibres que les p\u00e2tes blanches \u2014 m\u00eame plaisir, meilleur profil'}
  ],
  cereales_sucrees: [
    {code:'32140', nom:"Flocons d'avoine", kcal:369, prot:10.6, gluc:57.7, lip:7.8, ags:1.4, fibres:9.0, pot:320, qty:40, unit:'g',
     raison:'Fibres solubles excellentes pour la r\u00e9gulation de la glyc\u00e9mie'},
    {code:'32001', nom:'Muesli sans sucre ajout\u00e9', kcal:362, prot:9.0, gluc:59.0, lip:7.5, ags:1.2, fibres:7.0, pot:300, qty:40, unit:'g',
     raison:'Pas de sucres ajout\u00e9s, fibres int\u00e9grales pr\u00e9serv\u00e9es'}
  ],
  // Le chocolat blanc est presque enti\u00e8rement compos\u00e9 de sucres et de graisses
  // satur\u00e9es, sans la moindre fibre \u2014 la cat\u00e9gorie la plus probl\u00e9matique pour
  // le diab\u00e8te dans la famille "chocolat". L'alternative naturelle : chocolat
  // noir \u226570%, dont les polyph\u00e9nols am\u00e9liorent m\u00eame la sensibilit\u00e9 \u00e0 l'insuline.
  chocolat: [
    {code:'19101', nom:'Chocolat noir 70%', kcal:598, prot:7.9, gluc:32.4, lip:42.6, ags:24.9, fibres:12.1, pot:715, qty:20, unit:'g',
     raison:'14g de sucres vs ~55g pour le chocolat blanc, + 12g de fibres / 100g'},
    {code:'19102', nom:'Chocolat noir 85%', kcal:598, prot:9.0, gluc:22.4, lip:52.5, ags:32.4, fibres:14.3, pot:800, qty:15, unit:'g',
     raison:'Encore moins de sucres, index glyc\u00e9mique tr\u00e8s bas pour du chocolat'}
  ],
  bonbon: [
    {code:'15000', nom:'Amandes', kcal:615, prot:18.8, gluc:9.5, lip:51.3, ags:4.11, fibres:9.4, pot:800, qty:15, unit:'g',
     raison:'Croquant naturel, sucres n\u00e9gligeables, fibres et bons acides gras'},
    {code:'13057', nom:'Framboises', kcal:33, prot:1.2, gluc:4.4, lip:0.4, ags:0.02, fibres:6.5, pot:151, qty:80, unit:'g',
     raison:'Saveur sucr\u00e9e naturelle avec 6.5g de fibres / 100g \u2014 excellent pour le diab\u00e8te'}
  ]
};

// D\u00e9tecte la cat\u00e9gorie d'un aliment par son nom \u2014 pas parfait, mais
// couvre les cas les plus courants dans l'alimentation quotidienne.
function detectFoodCategory(nom){
  var n = (nom||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(/biscuit|frangipane|sable|cookie|gaufrette|speculoos|madeleine|brownie|gateau sec|cake/.test(n)) return 'biscuit';
  if(/bonbon|caramel|sucette|guimauve|reglisse|confiserie|dragee/.test(n)) return 'bonbon';
  // Tout chocolat sauf "noir" est \u00e0 surveiller pour le diab\u00e8te \u2014 le chocolat
  // noir >70% reste acceptable en petite quantit\u00e9 (polyph\u00e9nols, moins de sucres).
  if(/chocolat/.test(n) && !/chocolat noir/.test(n)) return 'chocolat';
  return null;
}

// Retourne les alternatives disponibles pour un aliment donn\u00e9.
// null si aucune cat\u00e9gorie reconnue ou aucune alternative d\u00e9finie.
function suggestAlternatives(nom){
  var cat = detectFoodCategory(nom);
  if(!cat) return null;
  return ALTERNATIVES_PAR_CATEGORIE[cat] || null;
}

// Badge diab\u00e8te simplifi\u00e9 pour la vue "Mon plan alimentaire" du dashboard \u2014
// le m\u00eame avertissement visuel que dans le constructeur du plan fixe,
// mais sans bouton "Utiliser" (l'aliment est d\u00e9j\u00e0 enregistr\u00e9, il faut
// aller dans le constructeur pour le remplacer).
function diabetePlanBadge(it){
  var pathos = (typeof PROF!=='undefined' && PROF && PROF.pathologies) || [];
  if(pathos.indexOf('diabetes')<0) return '';

  var carbGrams = (it.gluc||0)*(it.qty||0)/100;
  var showGlycemic = false;
  var showSugar = false;

  if(carbGrams>15){
    var ratio = fibreGlucRatio(it.gluc||0, it.fibres||0);
    if(ratio!==null && ratio<5) showGlycemic = true;
  }
  if(!showGlycemic){
    showSugar = ((it.sucres||0)>0 && biscuitTropSucre(it.sucres)) || !!detectFoodCategory(it.nom);
  }

  if(!showGlycemic && !showSugar) return '';

  var emoji = showSugar ? '\ud83c\udf6c' : '\ud83c\udf3f';
  var msg = showSugar
    ? 'Teneur en sucres \u00e9lev\u00e9e'
    : 'Impact glyc\u00e9mique \u00e0 surveiller';

  return ' <button onclick="showPlanDiabetesBadge(\''+msg+'\')" '
    +'style="background:none;border:none;cursor:pointer;padding:0;font-size:.85rem" '
    +'title="'+msg+' \u2014 cliquez pour en savoir plus">'+emoji+'</button>';
}

// \u2500\u2500 MALADIE C\u0152LIAQUE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Seuil l\u00e9gal : un aliment est "sans gluten" en-dessous de 20mg/kg (20 ppm).
// Pour la maladie c\u0153liaque, m\u00eame des traces peuvent provoquer des dommages
// intestinaux \u2014 on alerte donc d\u00e8s qu'un aliment EST une source de gluten
// reconnue, pas seulement au-dessus d'un seuil analytique.
//
// Signes cliniques \u00e0 mentionner dans le message :
// douleurs abdominales, diarrh\u00e9es chroniques, malabsorption des nutriments,
// fatigue intense, an\u00e9mie, perte de poids, et \u00e0 long terme : ost\u00e9oporose.


// MALADIE COELIAQUE
// Seuil legal : un aliment est "sans gluten" en-dessous de 20mg/kg.
// Pour la maladie coeliaque, meme des traces peuvent provoquer des dommages
// intestinaux \u2014 on alerte des qu'un aliment EST une source de gluten reconnue.

// Detection par mots-cles simples (indexOf) \u2014 evite les regex complexes
// avec lookahead qui peuvent planter dans certains environnements JS.
function containsGluten(nom){
  if(!nom) return false;
  var n = nom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  // Exclusions : produits explicitement sans gluten
  if(n.indexOf('sans gluten')>=0) return false;
  if(n.indexOf('riz')>=0 && n.indexOf('pain')>=0 && n.indexOf('ble')<0) return false;

  // Sources de gluten par categorie
  if(n.indexOf('boulgour')>=0) return 'boulgour';
  if(n.indexOf('couscous')>=0) return 'couscous';
  if(n.indexOf('semoule')>=0) return 'semoule';
  if(n.indexOf('epeautre')>=0 || n.indexOf('kamut')>=0 || n.indexOf('triticale')>=0) return 'ble';
  if(n.indexOf('froment')>=0) return 'ble';
  if((n.indexOf('farine')>=0 || n.indexOf('ble')>=0) && n.indexOf('riz')<0 && n.indexOf('mais')<0 && n.indexOf('sarrasin')<0 && n.indexOf('chataigne')<0) return 'ble';
  if(n.indexOf('seigle')>=0) return 'seigle';
  if((n.indexOf('orge')>=0 || n.indexOf('malt')>=0) && n.indexOf('sucre de malt')<0) return 'orge';
  if(n.indexOf('chapelure')>=0 || (n.indexOf('pane')>=0 && n.indexOf('pain')<0)) return 'panure';
  if(n.indexOf('biere')>=0) return 'biere';
  if(n.indexOf('brioche')>=0 || n.indexOf('croissant')>=0 || n.indexOf('viennoiserie')>=0) return 'brioche';
  if(n.indexOf('pizza')>=0 || n.indexOf('quiche')>=0) return 'gateaux';
  if(n.indexOf('biscuit')>=0 || n.indexOf('gaufrette')>=0 || n.indexOf('cookie')>=0) return 'biscuit';
  if(n.indexOf('gateau')>=0 && n.indexOf('sans gluten')<0) return 'gateaux';
  if(n.indexOf('pain')>=0 && n.indexOf('riz')<0 && n.indexOf('mais')<0 && n.indexOf('sarrasin')<0) return 'pain';
  if(n.indexOf('pates')>=0 && n.indexOf('riz')<0 && n.indexOf('mais')<0 && n.indexOf('sarrasin')<0) return 'pates';

  return false;
}

// Alternatives sans gluten par categorie
var GLUTEN_ALTERNATIVES = {
  pain:     [{nom:'Pain de riz (sans gluten)', raison:'Texture proche du pain blanc, naturellement sans gluten'},
             {nom:'Pain de sarrasin (sans gluten)', raison:'Riche en fibres et proteines, saveur marquee'}],
  pates:    [{nom:'Pates de riz (sans gluten)', raison:'Cuisson identique aux pates classiques'},
             {nom:'Pates de mais (sans gluten)', raison:'Bonne tenue a la cuisson, gout neutre'}],
  couscous: [{nom:'Quinoa', raison:'Substitut direct du couscous, proteines completes'}],
  boulgour: [{nom:'Riz complet', raison:'Substitut aux glucides complexes sans gluten'}],
  semoule:  [{nom:'Farine de riz', raison:'Substitut direct en cuisine et patisserie'}],
  biscuit:  [{nom:'Galette de riz (sans gluten)', raison:'Croustillant naturellement sans gluten'}],
  brioche:  [{nom:'Pain de riz (sans gluten)', raison:'Alternative aux viennoiseries classiques'}],
  gateaux:  [{nom:'Farine de riz ou de chataigne', raison:'Farine sans gluten pour la patisserie maison'}],
  biere:    [{nom:'Cidre ou biere sans gluten', raison:'Meme plaisir, sans reaction immunitaire'}],
  panure:   [{nom:'Farine de riz ou chapelure sans gluten', raison:'Meme resultat croustillant'}],
  ble:      [{nom:'Farine de riz ou fecule de mais', raison:'Substitut de la farine de ble en cuisine'}],
  orge:     [{nom:'Flocons de riz ou flocons de quinoa', raison:'Alternative aux cereales a base de malt'}],
  seigle:   [{nom:'Pain de sarrasin (sans gluten)', raison:'Substitut du pain de seigle'}]
};

// Retourne les alternatives sans gluten pour un aliment donn\u00e9.
function glutenAlternatives(nom){
  var cat = containsGluten(nom);
  if(!cat) return null;
  return GLUTEN_ALTERNATIVES[cat] || GLUTEN_ALTERNATIVES['ble'] || [];
}

// Message clinique affich\u00e9 dans la popup \u2014 liste les principaux sympt\u00f4mes
// pour sensibiliser sans alarmer.
var GLUTEN_SYMPTOMS = 'douleurs abdominales, diarrh\u00e9es, fatigue intense, '
  +'malabsorption des nutriments et an\u00e9mie. \u00c0 long terme, une consommation '
  +'r\u00e9p\u00e9t\u00e9e peut entra\u00eener une ost\u00e9oporose et augmenter le risque de certains cancers intestinaux.';
