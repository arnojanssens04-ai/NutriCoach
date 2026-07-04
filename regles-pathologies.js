/* ──────────────────────────────────────────────────────────────────────
   regles-pathologies.js — Règles nutritionnelles partagées NutriCoach
   ──────────────────────────────────────────────────────────────────────
   Fichier JS partagé entre dashboard.html, plan-fixe.html et recette.html
   (via <script src="regles-pathologies.js"></script>) — toute la logique
   liée aux pathologies vit ICI, en un seul endroit. C'est précisément ce
   qui manquait avant : un même filtre diabète existait en double dans
   dashboard.html, et une correction faite à un endroit a été oubliée à
   l'autre. Avec un seul fichier partagé, ce type de bug ne peut plus se
   reproduire — toute correction future profite automatiquement à toutes
   les pages qui l'incluent.

   IMPORTANT POUR LE DÉPLOIEMENT : ce fichier doit être uploadé sur GitHub
   au MÊME niveau que les fichiers .html (pas dans un sous-dossier), pour
   que le chemin relatif "regles-pathologies.js" utilisé dans les balises
   <script> fonctionne correctement une fois le site déployé.
   ────────────────────────────────────────────────────────────────────── */

// ── DIABÈTE ── proxy d'impact glycémique : ratio fibres/glucides ──
// Le riz blanc a ~28g de glucides et seulement ~0,4g de fibres pour 100g
// (ratio 1,4%) — un très mauvais choix glycémique malgré un total de
// fibres journalier qui peut sembler correct par ailleurs.
// Seuils : ≥10% bon, 5-10% moyen, <5% à éviter.
function fibreGlucRatio(gluc100, fibres100){
  if(!gluc100 || gluc100<=0) return null;
  return (fibres100||0)/gluc100*100;
}

// Table de fibres dédiée aux aliments utilisés dans les recettes
// suggérées — indépendante du chargement asynchrone de la base Ciqual
// (qui peut ne pas être encore prêt au moment de générer un plan) et de
// tout risque d'incohérence de code. Garantit que le filtre fonctionne
// de façon fiable et immédiate, à chaque fois.
var RECIPE_FIBRES_BY_NOM = {
  'Pain blanc':2.7, 'Beurre':0, 'Yaourt nature':0, 'Banane':1.7, 'Œuf dur':0,
  'Avocat':6.7, 'Orange':1.9, "Flocons d'avoine":9.0, 'Lait demi-écrémé':0,
  'Pomme':2.0, 'Amandes':9.4, 'Fromage blanc':0, 'Kiwi':2.6,
  'Blanc de poulet':0, 'Riz blanc cuit':0.4, 'Brocoli':2.5, "Huile d'olive":0,
  'Cabillaud':0, 'Patate douce cuite':2.5, 'Courgette':1.1, 'Saumon':0,
  'Quinoa cuit':2.8, 'Épinards':2.2, 'Steak de bœuf grillé':0,
  'Pâtes cuites':1.8, 'Pâtes complètes cuites':5.0, 'Carotte':2.6,
  'Tofu nature':0.7, 'Boulgour cuit':4.5, 'Poivron rouge':1.6,
  'Colin (lieu jaune)':0, 'Pomme de terre cuite':1.8, 'Haricots verts':2.7,
  'Dinde rôtie':0, 'Chou-fleur':2.0, 'Salade verte':1.5, 'Huile de colza':0,
  'Pêche':1.4, 'Lentilles cuites':7.9, 'Riz complet cuit':1.8,
  'Pois chiches cuits':7.6, 'Haricots rouges cuits':6.0, 'Noix':5.0,
  'Tomate':1.2, 'Framboises':6.5, 'Myrtilles':2.4, 'Pain complet':6.9
};

// Repère si UN SEUL ingrédient de la recette (à sa quantité de base, avant
// mise à l'échelle) a un impact glycémique marqué — plus de 15g de
// glucides apportés, et moins de 5% de fibres par rapport aux glucides.
// Le pain blanc, par exemple, est détecté ainsi sans avoir besoin d'une
// liste figée de noms d'aliments à exclure.
function recipeHasGlycemicCulprit(recipe){
  return recipe.ing.some(function(ing){
    var carbGrams = (ing.gluc||0)*ing.qty/100;
    if(carbGrams<=15) return false;
    if(!RECIPE_FIBRES_BY_NOM.hasOwnProperty(ing.nom)) return false; // donnée inconnue -> jamais pénalisé par défaut
    var ratio = fibreGlucRatio(ing.gluc, RECIPE_FIBRES_BY_NOM[ing.nom]);
    return ratio!==null && ratio<5;
  });
}

// Filtre commun à tous les endroits où une recette est choisie pour une
// personne (génération initiale du plan, bouton "⇄" pour changer de
// suggestion, etc.) — une seule fonction partagée évite qu'un filtre
// corrigé à un endroit soit oublié ailleurs.
function filterRecipesForPathologies(pool, pathologies){
  var filtered = pool.filter(function(r){
    return !r.excludeFor.some(function(p){ return pathologies.indexOf(p)>=0; });
  });
  if(pathologies.indexOf('diabetes')>=0){
    var noCulprit = filtered.filter(function(r){ return !recipeHasGlycemicCulprit(r); });
    if(noCulprit.length) filtered = noCulprit;
  }
  // Maladie cœliaque : exclure toute recette dont au moins un ingrédient
  // est une source de gluten connue — même logique que pour le diabète,
  // avec un filet de sécurité si le pool deviendrait vide.
  if(pathologies.indexOf('coeliac')>=0 || pathologies.indexOf('coeliaque')>=0){
    var noGluten = filtered.filter(function(r){
      return !r.ing.some(function(ing){ return !!containsGluten(ing.nom); });
    });
    if(noGluten.length) filtered = noGluten;
  }
  return filtered;
}

// Badge discret 🌿 affiché à côté d'un aliment dans le Plan fixe ou une
// Recette, quand son impact glycémique est marqué (diabète uniquement).
// Non bloquant — juste informatif, pour décider en connaissance de cause.
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
  return ' <span title="Peu de fibres pour la quantité de glucides — impact glycémique plus marqué" style="cursor:help">🌿</span>';
}

// ── DIABÈTE — BISCUITS ── règle dédiée, prête à être utilisée dès qu'un
// aliment ou une recette "biscuit" est ajouté avec un champ "sucres"
// distinct du total des glucides (les biscuits sont jugés sur leur taux
// de sucres, pas sur le ratio fibres/glucides classique).
var MAX_SUCRES_BISCUITS_PER_100G = 15;
function biscuitTropSucre(sucres100){
  return (sucres100||0) > MAX_SUCRES_BISCUITS_PER_100G;
}

// ── CŒLIAQUE (à venir) ──
// Emplacement réservé : liste d'aliments/ingrédients contenant du gluten
// à exclure automatiquement des suggestions pour les profils cœliaques.

// ── FODMAP (à venir) ──
// Emplacement réservé : règles d'exclusion des aliments riches en FODMAPs
// pour les profils concernés (troubles digestifs).

// ── ALTERNATIVES PAR CATÉGORIE ──
// Données nutritionnelles complètes (vérifiées) pour chaque alternative —
// indispensable pour que le remplacement dans le plan fixe fonctionne sans
// que l'utilisateur ait à rechercher les valeurs à la main.
// La quantité proposée correspond à une portion courante de l'aliment.
var ALTERNATIVES_PAR_CATEGORIE = {
  biscuit: [
    {code:'32053', nom:'Galette de riz soufflé', kcal:391, prot:7.2, gluc:81.7, lip:2.7, ags:0.9, fibres:3.4, pot:120, qty:15, unit:'g',
     raison:'0.5g de sucres / 100g vs 20–30g pour la plupart des biscuits'},
    {code:'31063', nom:'Cracker de seigle (Wasa)', kcal:297, prot:11.6, gluc:50.4, lip:1.5, ags:0.2, fibres:16.7, pot:340, qty:20, unit:'g',
     raison:'16g de fibres / 100g — l\'une des meilleures options dans la catégorie "à grignoter"'}
  ],
  pain_blanc: [
    {code:'7004', nom:'Pain complet', kcal:246, prot:8.8, gluc:41.4, lip:2.7, ags:0.5, fibres:6.9, pot:230, qty:60, unit:'g',
     raison:'Ratio fibres/glucides de 16.7% vs 4.6% pour le pain blanc'},
    {code:'7009', nom:'Pain de seigle', kcal:219, prot:6.7, gluc:42.5, lip:1.7, ags:0.2, fibres:6.2, pot:190, qty:60, unit:'g',
     raison:'Index glycémique sensiblement plus bas que le pain blanc'}
  ],
  riz_blanc: [
    {code:'9410', nom:'Riz complet cuit', kcal:123, prot:2.7, gluc:25.8, lip:1.0, ags:0.2, fibres:1.8, pot:86, qty:150, unit:'g',
     raison:'Fibres préservées, index glycémique plus bas'},
    {code:'9341', nom:'Quinoa cuit', kcal:149, prot:4.7, gluc:27.9, lip:1.1, ags:0.14, fibres:2.8, pot:220, qty:150, unit:'g',
     raison:'Protéines complètes et meilleur ratio fibres/glucides'}
  ],
  pates_blanches: [
    {code:'9813', nom:'Pâtes complètes cuites', kcal:124, prot:5.3, gluc:23.6, lip:0.9, ags:0.17, fibres:5.0, pot:80, qty:150, unit:'g',
     raison:'5× plus de fibres que les pâtes blanches — même plaisir, meilleur profil'}
  ],
  cereales_sucrees: [
    {code:'32140', nom:"Flocons d'avoine", kcal:369, prot:10.6, gluc:57.7, lip:7.8, ags:1.4, fibres:9.0, pot:320, qty:40, unit:'g',
     raison:'Fibres solubles excellentes pour la régulation de la glycémie'},
    {code:'32001', nom:'Muesli sans sucre ajouté', kcal:362, prot:9.0, gluc:59.0, lip:7.5, ags:1.2, fibres:7.0, pot:300, qty:40, unit:'g',
     raison:'Pas de sucres ajoutés, fibres intégrales préservées'}
  ],
  // Le chocolat blanc est presque entièrement composé de sucres et de graisses
  // saturées, sans la moindre fibre — la catégorie la plus problématique pour
  // le diabète dans la famille "chocolat". L'alternative naturelle : chocolat
  // noir ≥70%, dont les polyphénols améliorent même la sensibilité à l'insuline.
  chocolat: [
    {code:'19101', nom:'Chocolat noir 70%', kcal:598, prot:7.9, gluc:32.4, lip:42.6, ags:24.9, fibres:12.1, pot:715, qty:20, unit:'g',
     raison:'14g de sucres vs ~55g pour le chocolat blanc, + 12g de fibres / 100g'},
    {code:'19102', nom:'Chocolat noir 85%', kcal:598, prot:9.0, gluc:22.4, lip:52.5, ags:32.4, fibres:14.3, pot:800, qty:15, unit:'g',
     raison:'Encore moins de sucres, index glycémique très bas pour du chocolat'}
  ],
  bonbon: [
    {code:'15000', nom:'Amandes', kcal:615, prot:18.8, gluc:9.5, lip:51.3, ags:4.11, fibres:9.4, pot:800, qty:15, unit:'g',
     raison:'Croquant naturel, sucres négligeables, fibres et bons acides gras'},
    {code:'13057', nom:'Framboises', kcal:33, prot:1.2, gluc:4.4, lip:0.4, ags:0.02, fibres:6.5, pot:151, qty:80, unit:'g',
     raison:'Saveur sucrée naturelle avec 6.5g de fibres / 100g — excellent pour le diabète'}
  ]
};

// Détecte la catégorie d'un aliment par son nom — pas parfait, mais
// couvre les cas les plus courants dans l'alimentation quotidienne.
function detectFoodCategory(nom){
  var n = (nom||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(/biscuit|frangipane|sable|cookie|gaufrette|speculoos|madeleine|brownie|gateau sec|cake/.test(n)) return 'biscuit';
  if(/bonbon|caramel|sucette|guimauve|reglisse|confiserie|dragee/.test(n)) return 'bonbon';
  // Tout chocolat sauf "noir" est à surveiller pour le diabète — le chocolat
  // noir >70% reste acceptable en petite quantité (polyphénols, moins de sucres).
  if(/chocolat/.test(n) && !/chocolat noir/.test(n)) return 'chocolat';
  return null;
}

// Retourne les alternatives disponibles pour un aliment donné.
// null si aucune catégorie reconnue ou aucune alternative définie.
function suggestAlternatives(nom){
  var cat = detectFoodCategory(nom);
  if(!cat) return null;
  return ALTERNATIVES_PAR_CATEGORIE[cat] || null;
}

// Badge diabète simplifié pour la vue "Mon plan alimentaire" du dashboard —
// le même avertissement visuel que dans le constructeur du plan fixe,
// mais sans bouton "Utiliser" (l'aliment est déjà enregistré, il faut
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

  var emoji = showSugar ? '🍬' : '🌿';
  var msg = showSugar
    ? 'Teneur en sucres élevée'
    : 'Impact glycémique à surveiller';

  return ' <button onclick="showPlanDiabetesBadge(\''+msg+'\')" '
    +'style="background:none;border:none;cursor:pointer;padding:0;font-size:.85rem" '
    +'title="'+msg+' — cliquez pour en savoir plus">'+emoji+'</button>';
}

// ── MALADIE CŒLIAQUE ──────────────────────────────────────────────────────
// Seuil légal : un aliment est "sans gluten" en-dessous de 20mg/kg (20 ppm).
// Pour la maladie cœliaque, même des traces peuvent provoquer des dommages
// intestinaux — on alerte donc dès qu'un aliment EST une source de gluten
// reconnue, pas seulement au-dessus d'un seuil analytique.
//
// Signes cliniques à mentionner dans le message :
// douleurs abdominales, diarrhées chroniques, malabsorption des nutriments,
// fatigue intense, anémie, perte de poids, et à long terme : ostéoporose.


// MALADIE COELIAQUE
// Seuil legal : un aliment est "sans gluten" en-dessous de 20mg/kg.
// Pour la maladie coeliaque, meme des traces peuvent provoquer des dommages
// intestinaux — on alerte des qu'un aliment EST une source de gluten reconnue.

// Detection par mots-cles simples (indexOf) — evite les regex complexes
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

// Retourne les alternatives sans gluten pour un aliment donné.
function glutenAlternatives(nom){
  var cat = containsGluten(nom);
  if(!cat) return null;
  return GLUTEN_ALTERNATIVES[cat] || GLUTEN_ALTERNATIVES['ble'] || [];
}

// Message clinique affiché dans la popup — liste les principaux symptômes
// pour sensibiliser sans alarmer.
var GLUTEN_SYMPTOMS = 'douleurs abdominales, diarrhées, fatigue intense, '
  +'malabsorption des nutriments et anémie. À long terme, une consommation '
  +'répétée peut entraîner une ostéoporose et augmenter le risque de certains cancers intestinaux.';
