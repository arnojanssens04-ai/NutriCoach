/* ──────────────────────────────────────────────────────────────────────
   clinical-context.js — Modèles neutres de contexte clinique et de
   signaux nutritionnels/symptomatiques — Cap Santé
   ──────────────────────────────────────────────────────────────────────
   Étape préparatoire uniquement. Ce fichier N'EST INCLUS PAR AUCUNE PAGE
   (ni conseils.html, ni admin.html, ni dashboard.html, ni aucune autre) —
   il n'a aucun effet sur l'application tant qu'aucune page ne le charge
   explicitement, décision qui reste à prendre séparément.

   Ce fichier ne contient :
   - aucun appel Supabase (aucun sb.from, aucune requête réseau) ;
   - aucune écriture de donnée (pas de localStorage, pas de cookie) ;
   - aucune lecture de l'URL ;
   - aucun diagnostic, aucune recommandation, aucune IA.

   Tous les signaux du registre restent enabled:false. Toutes les
   fonctions sont pures (aucun accès DOM, aucun effet de bord) sauf les
   fonctions de garde (assert*), qui ne font que lever une exception —
   elles ne modifient jamais d'état.
   ────────────────────────────────────────────────────────────────────── */

// ══════════════════════════════════════════════════════════════════════
// ClinicalContext — structure neutre, jamais pré-remplie par ce fichier.
// Chaque catégorie est un tableau d'éléments au format documenté plus bas.
// ══════════════════════════════════════════════════════════════════════

// Statuts autorisés pour un élément de ClinicalContext. Une information
// saisie par le patient ou déduite du journal ne doit JAMAIS être
// automatiquement placée à 'confirmed' — aucune fonction de ce fichier
// ne mute ce champ automatiquement ; c'est un choix éditorial qui reste
// entièrement à la charge de l'appelant (hors périmètre ici).
var CLINICAL_STATUS = {
  CONFIRMED: 'confirmed',
  TO_VERIFY: 'to_verify',
  DENIED: 'denied',
  UNKNOWN: 'unknown',
  INACTIVE: 'inactive'
};

// Origines autorisées. Règle documentée (non appliquée mécaniquement par
// ce fichier, qui ne fabrique jamais de statut 'confirmed' lui-même) :
// - 'journal_observation' ne peut jamais devenir un diagnostic ;
// - 'patient_report' ne peut jamais devenir une pathologie confirmée ;
// - seule une origine 'professional_entry', 'laboratory_result' ou
//   'medical_document' peut légitimement accompagner un statut confirmed,
//   et seulement via une décision humaine/professionnelle explicite,
//   jamais produite automatiquement par du code.
var CLINICAL_SOURCE = {
  PATIENT_REPORT: 'patient_report',
  PROFESSIONAL_ENTRY: 'professional_entry',
  LABORATORY_RESULT: 'laboratory_result',
  MEDICAL_DOCUMENT: 'medical_document',
  JOURNAL_OBSERVATION: 'journal_observation',
  IMPORTED_DATA: 'imported_data'
};

// Construit un ClinicalContext vide. Aucune donnée réelle n'est jamais
// instanciée par ce fichier — uniquement la structure.
function createEmptyClinicalContext(){
  return {
    conditions: [],
    allergies: [],
    intolerances: [],
    medications: [],
    supplements: [],
    labResults: [],
    symptoms: [],
    anthropometrics: [],
    verificationStatus: {},
    sources: {},
    updatedAt: null
  };
}

// Élément minimal d'une catégorie de ClinicalContext (conditions,
// allergies, etc.). Statut par défaut 'unknown' — jamais 'confirmed'.
function createClinicalContextItem(overrides){
  var base = {
    id: null,
    type: null,
    value: null,
    status: CLINICAL_STATUS.UNKNOWN,
    source: null,
    recordedAt: null,
    verifiedAt: null,
    verifiedBy: null,
    notes: ''
  };
  if(overrides){
    Object.keys(overrides).forEach(function(k){ base[k] = overrides[k]; });
  }
  return base;
}


// ══════════════════════════════════════════════════════════════════════
// SymptomEntry — journal des symptômes, structure DISTINCTE du journal
// alimentaire. Les types ci-dessous désignent des phénomènes
// physiologiquement différents et ne doivent jamais être fusionnés :
// 'bloating' (gaz/ballonnement digestif), 'abdominal_distension'
// (distension visible), 'peripheral_swelling' (rétention périphérique),
// 'rapid_weight_change' (variation rapide de poids), 'unknown'.
// ══════════════════════════════════════════════════════════════════════
var SYMPTOM_TYPES = {
  BLOATING: 'bloating',
  ABDOMINAL_DISTENSION: 'abdominal_distension',
  PERIPHERAL_SWELLING: 'peripheral_swelling',
  RAPID_WEIGHT_CHANGE: 'rapid_weight_change',
  UNKNOWN: 'unknown'
};

// Construit un SymptomEntry. Statut par défaut 'to_verify' (jamais
// 'confirmed'), source par défaut 'patient_report'.
function createSymptomEntry(overrides){
  var base = {
    id: null,
    type: SYMPTOM_TYPES.UNKNOWN,
    location: 'unknown', // 'abdominal' | 'peripheral' | 'unknown'
    occurredAt: null,
    intensity: null,
    durationMinutes: null,
    mealId: null,
    foodsOrGroups: [],
    quantityContext: null,
    bowelContext: null,
    stressContext: null,
    activityContext: null,
    medicationContext: null,
    cycleContext: null,
    patientComment: '',
    source: CLINICAL_SOURCE.PATIENT_REPORT,
    status: CLINICAL_STATUS.TO_VERIFY
  };
  if(overrides){
    Object.keys(overrides).forEach(function(k){ base[k] = overrides[k]; });
  }
  return base;
}


// ══════════════════════════════════════════════════════════════════════
// Niveaux de sortie nutritionnels — trois niveaux non interchangeables.
// Aucune fonction de ce fichier ne produit CONFIRMED_DEFICIENCY à partir
// du seul journal alimentaire : ce niveau nécessite une donnée externe
// documentée (résultat biologique, validation professionnelle), qui
// n'existe dans aucune structure manipulée ici.
// ══════════════════════════════════════════════════════════════════════
var NUTRITIONAL_SIGNAL_LEVELS = {
  DIETARY_PATTERN_OBSERVED: 'dietary_pattern_observed',
  NUTRITIONAL_RISK_TO_REVIEW: 'nutritional_risk_to_review',
  CONFIRMED_DEFICIENCY: 'confirmed_deficiency'
};


// ══════════════════════════════════════════════════════════════════════
// CLINICAL_SIGNAL_REGISTRY — registre séparé de PATTERN_REGISTRY
// (conseils.html). Décrit uniquement des signaux ; ne choisit jamais une
// intervention. Tous les signaux restent enabled:false à cette étape.
// ══════════════════════════════════════════════════════════════════════
var CLINICAL_SIGNAL_REGISTRY = {
  low_calcium_food_sources: {
    id: 'low_calcium_food_sources',
    type: 'dietary_signal',
    enabled: false,
    requiredData: ['journal', 'food_nutrients'],
    outputType: 'point_to_verify',
    diagnosisAllowed: false,
    recommendationAllowed: false,
    requiresProfessionalReview: true
  },

  low_iron_food_sources: {
    id: 'low_iron_food_sources',
    type: 'dietary_signal',
    enabled: false,
    requiredData: ['journal', 'food_nutrients'],
    outputType: 'point_to_verify',
    diagnosisAllowed: false,
    recommendationAllowed: false,
    requiresProfessionalReview: true
  },

  low_b12_food_sources: {
    id: 'low_b12_food_sources',
    type: 'dietary_signal',
    enabled: false,
    requiredData: ['journal', 'food_nutrients'],
    outputType: 'point_to_verify',
    diagnosisAllowed: false,
    recommendationAllowed: false,
    requiresProfessionalReview: true
  },

  repeated_bloating_after_meals: {
    id: 'repeated_bloating_after_meals',
    type: 'symptom_pattern',
    enabled: false,
    requiredData: ['symptom_log', 'meal_log'],
    outputType: 'temporal_association',
    diagnosisAllowed: false,
    recommendationAllowed: false,
    requiresProfessionalReview: true
  },

  repeated_abdominal_distension: {
    id: 'repeated_abdominal_distension',
    type: 'symptom_pattern',
    enabled: false,
    requiredData: ['symptom_log'],
    outputType: 'symptom_observation',
    diagnosisAllowed: false,
    recommendationAllowed: false,
    requiresProfessionalReview: true
  }
};


// ══════════════════════════════════════════════════════════════════════
// Messages autorisés — constantes littérales, jamais générées
// dynamiquement à partir de données variables au-delà de ce qui est
// explicitement montré ici.
// ══════════════════════════════════════════════════════════════════════
var CLINICAL_ALLOWED_MESSAGES = {
  LOW_CALCIUM_SOURCES:
    'Peu de sources alimentaires de calcium sont identifiées dans les données disponibles. Cela ne permet pas de conclure à une carence.',
  REPEATED_BLOATING_SIMILAR_GROUP:
    'Des ballonnements ont été enregistrés après plusieurs repas contenant un groupe d’aliments similaire. Cette observation ne prouve pas que ce groupe soit la cause du symptôme.',
  PROFESSIONAL_REVIEW_POINT:
    'Ce point mérite d’être vérifié avec un professionnel de santé.'
};


// ══════════════════════════════════════════════════════════════════════
// Drapeaux d'orientation professionnelle — jamais de diagnostic, jamais
// activés à partir d'un seul mot sans contexte (aucune fonction de ce
// fichier ne les active automatiquement ; ils sont documentés comme
// vocabulaire commun pour une future couche de décision, hors périmètre
// ici). Le seul texte associé autorisé est CLINICAL_ALLOWED_MESSAGES.PROFESSIONAL_REVIEW_POINT.
// ══════════════════════════════════════════════════════════════════════
var PROFESSIONAL_REVIEW_FLAGS = {
  SYMPTOM_PERSISTENT: 'symptom_persistent',
  SYMPTOM_SEVERE: 'symptom_severe',
  PERIPHERAL_SWELLING: 'peripheral_swelling',
  RAPID_WEIGHT_CHANGE: 'rapid_weight_change',
  BLOOD_IN_STOOL_REPORTED: 'blood_in_stool_reported',
  VOMITING_REPORTED: 'vomiting_reported',
  DIFFICULTY_SWALLOWING_REPORTED: 'difficulty_swallowing_reported',
  SUSPECTED_ALLERGIC_REACTION: 'suspected_allergic_reaction',
  CONFIRMED_CONDITION_MISSING_CONTEXT: 'confirmed_condition_missing_context'
};


// ══════════════════════════════════════════════════════════════════════
// evaluateTemporalAssociation — fonction PURE. Aucun signal n'étant
// enabled:true dans le registre, elle n'est appelée par aucun code de
// production à cette étape.
//
// Contrat de retour actuel : associationStatus, numberOfSymptomEvents,
// numberOfLinkedMeals, repeatedFoodGroups, timeWindow, dataCompleteness.
// Ce contrat ne contient pas de champ de causalité, de diagnostic,
// d'intolérance, d'allergie ou d'exclusion. Cette règle est protégée par
// des tests et une revue de code — ce n'est pas une garantie absolue
// contre toute modification future du code de cette fonction.
// ══════════════════════════════════════════════════════════════════════
var TEMPORAL_ASSOCIATION_STATUS = {
  NO_OBSERVATION: 'no_observation',
  POSSIBLE_TEMPORAL_ASSOCIATION: 'possible_temporal_association',
  INSUFFICIENT_DATA: 'insufficient_data',
  NOT_EVALUATED: 'not_evaluated'
};

function evaluateTemporalAssociation(symptoms, meals){
  symptoms = symptoms || [];
  meals = meals || [];

  var numberOfSymptomEvents = symptoms.length;

  if(numberOfSymptomEvents === 0){
    return {
      associationStatus: TEMPORAL_ASSOCIATION_STATUS.NO_OBSERVATION,
      numberOfSymptomEvents: 0,
      numberOfLinkedMeals: 0,
      repeatedFoodGroups: [],
      timeWindow: null,
      dataCompleteness: 0
    };
  }

  var linkedMeals = symptoms
    .map(function(s){ return s.mealId; })
    .filter(function(id){ return id !== null && id !== undefined; });
  var uniqueLinkedMeals = linkedMeals.filter(function(id, idx){ return linkedMeals.indexOf(id) === idx; });
  var numberOfLinkedMeals = uniqueLinkedMeals.length;

  var dataCompleteness = numberOfSymptomEvents > 0 ? numberOfLinkedMeals / numberOfSymptomEvents : 0;

  // Groupes d'aliments apparaissant sur plusieurs symptômes distincts —
  // simple comptage d'occurrences, aucune inférence de cause.
  var groupCounts = {};
  symptoms.forEach(function(s){
    (s.foodsOrGroups || []).forEach(function(g){
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
  });
  var repeatedFoodGroups = Object.keys(groupCounts).filter(function(g){ return groupCounts[g] >= 2; });

  var associationStatus;
  if(numberOfLinkedMeals === 0 || dataCompleteness < 0.5){
    associationStatus = TEMPORAL_ASSOCIATION_STATUS.INSUFFICIENT_DATA;
  } else if(numberOfSymptomEvents >= 2 && repeatedFoodGroups.length > 0){
    associationStatus = TEMPORAL_ASSOCIATION_STATUS.POSSIBLE_TEMPORAL_ASSOCIATION;
  } else {
    associationStatus = TEMPORAL_ASSOCIATION_STATUS.INSUFFICIENT_DATA;
  }

  return {
    associationStatus: associationStatus,
    numberOfSymptomEvents: numberOfSymptomEvents,
    numberOfLinkedMeals: numberOfLinkedMeals,
    repeatedFoodGroups: repeatedFoodGroups,
    timeWindow: null,
    dataCompleteness: dataCompleteness
  };
}


// ══════════════════════════════════════════════════════════════════════
// Fonctions de garde — ne font que vérifier/lever une exception, ne
// modifient jamais d'état, n'accèdent ni au DOM ni au réseau.
// ══════════════════════════════════════════════════════════════════════

// Lève une exception si le signal demandé n'est pas désactivé — garde
// défensive pour empêcher qu'un futur appelant évalue un signal actif
// sans passer par une validation explicite du registre.
function assertSignalDisabled(id){
  var entry = CLINICAL_SIGNAL_REGISTRY[id];
  if(!entry){
    throw new Error('Signal clinique inconnu : ' + id);
  }
  if(entry.enabled !== false){
    throw new Error('Signal clinique non désactivé : ' + id);
  }
}

// Lève une exception si l'objet fourni ressemble à une tentative de
// diagnostic/recommandation automatique (présence d'une des clés
// interdites). Garde défensive, pas un filtre de texte.
function assertNoAutomaticDiagnosis(result){
  var forbiddenKeys = ['cause', 'diagnosis', 'intolerance', 'allergy', 'exclusionRecommendation'];
  var found = forbiddenKeys.filter(function(k){ return result && Object.prototype.hasOwnProperty.call(result, k); });
  if(found.length){
    throw new Error('Champ interdit présent dans le résultat : ' + found.join(', '));
  }
}

// Lève systématiquement une exception — ce fichier ne doit jamais
// écrire de donnée. Présente pour documenter explicitement l'absence
// d'écriture et servir de garde si un appel était ajouté par erreur.
function assertNoWriteOperation(){
  throw new Error('Aucune écriture de donnée autorisée depuis clinical-context.js à cette étape.');
}
