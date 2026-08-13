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

// \u2500\u2500 DIAB\u00c8TE \u2014 MOTEUR "TAMPON GLYC\u00c9MIQUE" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Moteur PHYSIOLOGIQUE unique, appliqu\u00e9 de la m\u00eame fa\u00e7on \u00e0 n'importe quel
// aliment ou repas (actuel ou futur) \u2014 fonction PARTAG\u00c9E entre le journal
// et le dashboard : ne jamais recopier cette formule ailleurs.
//
// mealItems attend un tableau d'entr\u00e9es "journal" (m\u00eame forme que celles
// retourn\u00e9es par getEntries()) : glucides/proteines/lipides/kcal d\u00e9j\u00e0
// exprim\u00e9s en grammes r\u00e9els pour la quantit\u00e9 consomm\u00e9e, et food_*_100
// exprim\u00e9s pour 100g (\u00e0 multiplier par quantite/100).
//
// NOTE DONN\u00c9ES : les sucres simples (food_sucres_100) ne sont PAS renseign\u00e9s
// pour la tr\u00e8s grande majorit\u00e9 des aliments de la base Ciqual extraite dans
// ce projet (seuls les aliments personnalis\u00e9s / certains scans en disposent)
// \u2014 totalSugars peut donc valoir 0 m\u00eame pour un aliment r\u00e9ellement sucr\u00e9.
// C'est pr\u00e9cis\u00e9ment pour compenser ce trou de donn\u00e9e que la r\u00e8gle sur les
// jus/boissons sucr\u00e9es ci-dessous se base sur le NOM de l'aliment plut\u00f4t que
// sur cette seule valeur num\u00e9rique.
function evaluateGlycemicImpact(mealItems){
  mealItems = mealItems || [];
  var totalCarbs = 0, totalSugars = 0, totalFibers = 0, totalProteins = 0, totalFats = 0;
  mealItems.forEach(function(e){
    var qty = e.quantite || 0;
    totalCarbs    += e.glucides || 0;
    totalProteins += e.proteines || 0;
    totalFats     += e.lipides || 0;
    totalFibers   += (e.food_fibres_100 || 0) * qty / 100;
    totalSugars   += (e.food_sucres_100 || 0) * qty / 100;
  });

  var bufferPower = (totalFibers * 2.0) + (totalProteins * 1.0) + (totalFats * 0.5);
  var netCarbs = Math.max(totalCarbs - totalFibers, 1);

  // \u2500\u2500 Correction clinique : p\u00e9nalit\u00e9 sucres simples / matrice liquide \u2500\u2500
  // Sans cette correction, un jus de fruit "cach\u00e9" derri\u00e8re un aliment riche
  // en fibres (ex: flocons d'avoine) pouvait produire \u00e0 tort un statut
  // optimal \u2014 les fibres de l'un masquaient l'absorption rapide de l'autre.
  var sugarRatio = totalSugars / netCarbs;
  if(sugarRatio > 0.4){
    bufferPower = bufferPower * 0.5; // malus de 50% sur le pouvoir tampon
  }
  var bufferRatio = bufferPower / netCarbs;

  var state;
  if(netCarbs < 15) state = 'LOW_CARB';
  else if(bufferRatio >= 0.5) state = 'OPTIMAL_BUFFER';
  else if(bufferRatio >= 0.25) state = 'MODERATE_BUFFER';
  else state = 'FAST_ABSORPTION';

  // R\u00e8gle stricte jus/boissons sucr\u00e9es \u2014 d\u00e9tection par nom, ind\u00e9pendante de
  // totalSugars (voir note donn\u00e9es ci-dessus). Plafonne le statut : un jus ne
  // peut jamais faire passer un repas pour "optimal", quelles que soient les
  // fibres pr\u00e9sentes par ailleurs.
  var hasSweetLiquid = mealItems.some(function(e){ return isSweetLiquid(e.aliment); });
  var liquidWarning = null;
  if(hasSweetLiquid){
    if(state === 'OPTIMAL_BUFFER') state = 'MODERATE_BUFFER';
    liquidWarning = '\u26a1 Attention : la matrice liquide du jus de fruit s\'absorbe rapidement malgr\u00e9 les fibres associ\u00e9es.';
  }

  return {
    totalCarbs: totalCarbs, totalSugars: totalSugars, totalFibers: totalFibers,
    totalProteins: totalProteins, totalFats: totalFats,
    netCarbs: netCarbs, bufferPower: bufferPower, bufferRatio: bufferRatio,
    sugarRatio: sugarRatio, hasSweetLiquid: hasSweetLiquid, liquidWarning: liquidWarning,
    state: state
  };
}

// D\u00e9tection des jus/boissons sucr\u00e9es par nom \u2014 volontairement bas\u00e9e sur le
// nom plut\u00f4t que sur une valeur nutritionnelle, car cette derni\u00e8re n'est pas
// toujours disponible (voir note dans evaluateGlycemicImpact). Style et
// normalisation identiques \u00e0 isAlcohol/isLegume (dashboard.html).
var SWEET_LIQUID_REGEX = /jus de fruit|jus d.orange|jus de pomme|jus de raisin|jus multifruits|nectar de|smoothie|boisson (sucree|energisante|gazeuse|au cola)|\bsodas?\b|\bcolas?\b|limonade|\bsirop\b/;
function isSweetLiquid(nom){
  if(!nom) return false;
  var n = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return SWEET_LIQUID_REGEX.test(n);
}

// \u2500\u2500 MOTEUR DE TAGS PAR REPAS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// M\u00eame principe que le tableau "tips" tri\u00e9 par priorit\u00e9 d\u00e9j\u00e0 utilis\u00e9 au
// niveau JOUR (voir calcScore dans dashboard.html), appliqu\u00e9 ici au niveau
// du REPAS. Chaque r\u00e8gle est ind\u00e9pendante et ne recalcule JAMAIS un
// r\u00e9sultat qui existe d\u00e9j\u00e0 ailleurs (le tampon glyc\u00e9mique reste calcul\u00e9
// une seule fois, par evaluateGlycemicImpact) -- ce moteur se contente de
// COLLECTER, PRIORISER et PLAFONNER (max 2 messages, jamais plus, m\u00eame
// principe qu'au niveau jour).
//
// Volontairement limit\u00e9 aux r\u00e8gles qui tournent avec des donn\u00e9es DEJA
// disponibles aujourd'hui (glyc\u00e9mie, ultra-transform\u00e9, sodium/potassium).
// Les r\u00e8gles n\u00e9cessitant des donn\u00e9es qu'on ne collecte pas encore (stress,
// sommeil, hydratation, repas saut\u00e9, horaire du repas) restent
// volontairement hors p\u00e9rim\u00e8tre tant que ces donn\u00e9es n'existent pas -- pas
// de fausse promesse sur des signaux qu'on n'a pas.
function evaluateMealTags(mealItems, pathos){
  mealItems = mealItems || [];
  pathos = pathos || [];
  if(!mealItems.length) return [];

  var tags = [];

  // Tampon glyc\u00e9mique (diab\u00e8te) -- d\u00e9l\u00e9gu\u00e9 \u00e0 evaluateGlycemicImpact,
  // jamais recalcul\u00e9 ici.
  if(pathos.indexOf('diabetes')>=0 && typeof evaluateGlycemicImpact==='function'){
    var glyc = evaluateGlycemicImpact(mealItems);
    if(glyc.state==='FAST_ABSORPTION'){
      tags.push({priority:1, level:'warn', badge:'\ud83d\udfe1 Glucides \u00e0 absorption rapide',
        tip: glyc.liquidWarning || 'Associez ces glucides \u00e0 des fibres ou des prot\u00e9ines au prochain repas.'});
    } else if(glyc.state==='MODERATE_BUFFER'){
      tags.push({priority:3, level:'mid', badge:'\ud83d\udfe0 Tampon glyc\u00e9mique mod\u00e9r\u00e9', tip: glyc.liquidWarning||null});
    } else if(glyc.state==='OPTIMAL_BUFFER'){
      tags.push({priority:6, level:'ok', badge:'\ud83d\udfe2 Glyc\u00e9mie stabilis\u00e9e', tip:null});
    }
  }

  // Veto ultra-transform\u00e9 -- au moins 2 aliments ultra-transform\u00e9s dans CE
  // repas pr\u00e9cis (pas la journ\u00e9e enti\u00e8re, d\u00e9j\u00e0 couverte ailleurs). R\u00e9utilise
  // le m\u00eame signal que le reste de l'app (is_ultra_processed post\u00e9 par
  // l'IA/OFF, ou le m\u00eame ULTRA_PROCESSED_REGEX en repli).
  var ultraCount = 0;
  mealItems.forEach(function(e){
    if(e.is_ultra_processed === true){ ultraCount++; return; }
    if(e.is_ultra_processed === false) return;
    if(typeof ULTRA_PROCESSED_REGEX !== 'undefined'){
      var n = (e.aliment||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(ULTRA_PROCESSED_REGEX.test(n)) ultraCount++;
    }
  });
  if(ultraCount >= 2){
    tags.push({priority:2, level:'mid', badge:'\ud83d\udfe0 Plusieurs aliments transform\u00e9s',
      tip:'Rien de grave ponctuellement, mais essayez de garder au moins un aliment brut au prochain repas.'});
  }

  // Sodium \u00e9lev\u00e9 sur CE repas + hypertension -- seuil : ~1/3 de la cible
  // journali\u00e8re OMS (2000mg/jour), coh\u00e9rent avec un repas parmi 3-5 dans
  // la journ\u00e9e. R\u00e9utilise suggestPotassiumBoost, jamais un nouveau texte.
  if(pathos.indexOf('hypertension')>=0){
    var mealNa = 0;
    mealItems.forEach(function(e){ mealNa += (e.food_na_100||0) * (e.quantite||0) / 100; });
    if(mealNa > 800){
      tags.push({priority:2, level:'mid', badge:'\ud83e\uddc2 Sodium \u00e9lev\u00e9 sur ce repas',
        tip: (typeof suggestPotassiumBoost==='function') ? suggestPotassiumBoost(mealNa) : 'Pensez au potassium au prochain repas (banane, l\u00e9gumineuses, \u00e9pinards).'});
    }
  }

  // Renforcement positif -- uniquement si AUCUNE alerte n'a \u00e9t\u00e9 lev\u00e9e sur ce
  // repas ET qu'il contient r\u00e9ellement des fibres ou des prot\u00e9ines
  // (\u00e9vite de f\u00e9liciter un repas simplement parce qu'il n'a rien de mauvais
  // \u00e0 signaler -- il faut un vrai point positif \u00e0 souligner).
  if(!tags.length){
    var hasFiberOrProtein = mealItems.some(function(e){
      return (e.food_fibres_100||0) > 2 || (e.proteines||0) > 5;
    });
    if(hasFiberOrProtein){
      tags.push({priority:8, level:'ok', badge:'\u2705 Repas \u00e9quilibr\u00e9', tip:null});
    }
  }

  tags.sort(function(a,b){ return a.priority-b.priority; });
  return tags.slice(0,2); // jamais plus de 2, m\u00eame plafond qu'au niveau jour
}

// Rendu HTML commun \u00e0 tous les tags de repas -- un seul badge (le plus
// prioritaire) plus sa ligne de conseil si elle existe. Utilis\u00e9 partout o\u00f9
// une carte de repas doit afficher ce statut (accueil, journal).
function renderMealTagsHTML(mealItems, pathos){
  var tags = evaluateMealTags(mealItems, pathos);
  if(!tags.length) return '';
  var primary = tags[0];
  var cls = primary.level==='warn' ? 'meal-glyc-warn' : primary.level==='mid' ? 'meal-glyc-mid' : 'meal-glyc-ok';
  var html = '<div class="meal-glyc-badge '+cls+'">'+primary.badge+'</div>';
  if(primary.tip) html += '<div class="meal-glyc-tip">'+primary.tip+'</div>';
  return html;
}

// \u2500\u2500 SANT\u00c9 CARDIOVASCULAIRE \u2014 MOTEUR "PROTECTION CARDIOVASCULAIRE" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Une SEULE formule de notation (scoreCardioFromTotals), utilis\u00e9e \u00e0 la fois
// par evaluateCardioProfile (niveau repas/aliment, donn\u00e9es brutes) et par
// cardioProtectiveScore (niveau jour, totaux d\u00e9j\u00e0 agr\u00e9g\u00e9s T) \u2014 pour ne
// jamais faire cohabiter deux calculs qui pourraient se contredire sur les
// m\u00eames donn\u00e9es (voir section 3.2 du prompt de passation).
//
// Rep\u00e8re "fibres suffisantes" : ~14g de fibres / 1000kcal (recommandation
// courante, ex. Institute of Medicine) \u2014 fiberDensity est d\u00e9j\u00e0 exprim\u00e9e
// dans cette unit\u00e9.
function scoreCardioFromTotals(totals){
  var totalSodium = totals.totalSodium || 0;
  var totalPotassium = totals.totalPotassium || 0;
  var totalSaturatedFats = totals.totalSaturatedFats || 0;
  var totalUnsaturatedFats = totals.totalUnsaturatedFats || 0;
  var totalFibers = totals.totalFibers || 0;
  var totalCalories = totals.totalCalories || 0;

  var ratioNaK = totalSodium / Math.max(totalPotassium, 1);
  var ratioFat = totalUnsaturatedFats / Math.max(totalSaturatedFats, 1);
  var fiberDensity = totalCalories > 0 ? (totalFibers / totalCalories) * 1000 : 0;

  var naKOk = ratioNaK <= 1.0;
  var fatOk = ratioFat > 1.0;
  var fiberOk = fiberDensity >= 14;

  var score = 0;
  if(naKOk) score += 40;
  if(fatOk) score += 30;
  if(fiberOk) score += 30;

  return {
    ratioNaK: ratioNaK, ratioFat: ratioFat, fiberDensity: fiberDensity,
    naKOk: naKOk, fatOk: fatOk, fiberOk: fiberOk, score: score
  };
}

// Niveau repas/aliment \u2014 mealItems : tableau d'entr\u00e9es journal (m\u00eame forme
// que pour evaluateGlycemicImpact).
function evaluateCardioProfile(mealItems){
  mealItems = mealItems || [];
  var totals = {totalSodium:0, totalPotassium:0, totalSaturatedFats:0, totalUnsaturatedFats:0, totalFibers:0, totalCalories:0};
  mealItems.forEach(function(e){
    var qty = e.quantite || 0;
    totals.totalCalories += e.kcal || 0;
    totals.totalFibers   += (e.food_fibres_100 || 0) * qty / 100;
    totals.totalSodium   += (e.food_na_100 || 0) * qty / 100;
    totals.totalPotassium+= (e.food_pot_100 || 0) * qty / 100;
    totals.totalSaturatedFats   += (e.food_ags_100 || 0) * qty / 100;
    totals.totalUnsaturatedFats += ((e.food_mono_100||0)+(e.food_o3a_100||0)+(e.food_o3e_100||0)+(e.food_o3d_100||0)+(e.food_o6_100||0)) * qty / 100;
  });
  var res = scoreCardioFromTotals(totals);
  res.totals = totals;
  return res;
}

// Niveau jour \u2014 T : totaux d\u00e9j\u00e0 agr\u00e9g\u00e9s (voir dashboard.html), tgt : objectifs
// du profil. Conserve l'affichage 3 barres existant (Sodium/Potassium,
// Qualit\u00e9 des lipides, Fibres) mais son score global provient d\u00e9sormais de
// scoreCardioFromTotals, comme evaluateCardioProfile \u2014 seule la pr\u00e9sentation
// diff\u00e8re, jamais le calcul.
function cardioProtectiveScore(T, tgt){
  var totals = {
    totalSodium: T.na||0, totalPotassium: T.pot||0,
    totalSaturatedFats: T.ags||0,
    totalUnsaturatedFats: (T.mono||0)+(T.o3a||0)+(T.o3e||0)+(T.o3d||0)+(T.o6||0),
    totalFibers: T.fibres||0, totalCalories: T.kcal||0
  };
  var core = scoreCardioFromTotals(totals);

  var unsatG = totals.totalUnsaturatedFats;
  var factors = [
    {key:'naK', label:'Ratio Sodium / Potassium', score: core.naKOk ? 100 : Math.max(0, Math.round(100-(core.ratioNaK-1.0)*60)),
      detail: Math.round(totals.totalSodium)+'mg sodium / '+Math.round(totals.totalPotassium)+'mg potassium'},
    {key:'fat', label:'Qualit\u00e9 des lipides (satur\u00e9s vs insatur\u00e9s/om\u00e9ga-3)', score: core.fatOk ? 100 : Math.max(0, Math.round(core.ratioFat*80)),
      detail: Math.round(totals.totalSaturatedFats)+'g satur\u00e9es / '+unsatG.toFixed(1)+'g insatur\u00e9es (mono + om\u00e9ga-3/6)'},
    {key:'fibres', label:'Fibres (l\u00e9gumineuses, avoine, l\u00e9gumes...)', score: Math.max(0, Math.min(100, Math.round(core.fiberDensity/14*100))),
      detail: totals.totalFibers.toFixed(1)+'g de fibres ('+core.fiberDensity.toFixed(1)+'g/1000kcal, rep\u00e8re 14g)'}
  ];

  var overall = core.score; // formule unique et partag\u00e9e, voir scoreCardioFromTotals
  var level = overall>=70 ? {cls:'ok', lbl:'Profil cardioprotecteur'}
    : overall>=40 ? {cls:'mid', lbl:'Profil cardio \u00e0 renforcer'}
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

// \u2500\u2500 OBJECTIFS KCAL/MACROS (version partag\u00e9e recette.html / recette-prep.html) \u2500\u2500
// Centralise la logique qui existait \u00e0 l'identique dans ces deux fichiers
// (copi\u00e9-coll\u00e9 confirm\u00e9 strictement identique). Fonction PURE : ne lit ni
// PROF, ni le DOM, ni aucune variable globale \u2014 tout vient du param\u00e8tre
// `profile`, pour rester testable en dehors du navigateur et simulable
// avec un profil hypoth\u00e9tique (ex: bilan.html dans une \u00e9tape future).
//
// IMPORTANT : cette version reste la formule SIMPLIFI\u00c9E historique de
// recette.html/recette-prep.html (macros en pourcentages fixes). Elle ne
// doit PAS \u00eatre confondue avec la formule plus riche de dashboard.html
// (prot\u00e9ines en g/kg, ajustements m\u00e9nopause/diab\u00e8te) \u2014 l'harmonisation
// des deux est un sujet volontairement report\u00e9 \u00e0 une \u00e9tape s\u00e9par\u00e9e et
// valid\u00e9e s\u00e9par\u00e9ment. Ne pas modifier cette formule sans revalider les
// pages qui en d\u00e9pendent.
function calculateTargetsShared(profile){
  var p = profile || {};
  var w=p.poids||70, h=p.taille||170, a=p.age||35, g=p.sexe||'F';
  var act=p.activite||'sedentary', pathos=p.pathologies||[];
  var bmr = g==='M' ? 10*w+6.25*h-5*a+5 : 10*w+6.25*h-5*a-161;
  var af = {sedentary:1.2, light:1.375, moderate:1.55, active:1.725, sportif:1.9};
  var hasMet = p.activite_met_kcal && p.activite_met_kcal>0;
  var tdee = hasMet ? bmr*1.2+p.activite_met_kcal : bmr*(af[act]||1.2);
  var objectif = p.objectif || (pathos.indexOf('obesity')>=0 ? 'perte' : 'maintien');
  var kcal = tdee;
  if(objectif==='perte') kcal = tdee-200;
  if(objectif==='prise') kcal = tdee+300;
  kcal += (p.kcal_adjustment||0);
  kcal = Math.max(1200, Math.min(5000, Math.round(kcal)));
  return {kcal:kcal, prot:Math.round(kcal*0.15/4), gluc:Math.round(kcal*0.50/4), lip:Math.round(kcal*0.35/9)};
}
