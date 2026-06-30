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
  'Tomate':1.2, 'Framboises':6.5, 'Myrtilles':2.4
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
