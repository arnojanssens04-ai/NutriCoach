/* ──────────────────────────────────────────────────────────────────────
   nutrition-simulator-fixtures.js — Profils FICTIFS pour le simulateur
   admin de conseils nutritionnels — Cap Santé

   ⚠️ ÉTAPE ARCHITECTURALE CONFINÉE — voir avertissement complet en tête
   de nutrition-rule-engine.js. Aucune donnée réelle, aucun identifiant
   réel. Format aligné sur les colonnes réelles de la table journal
   (comme nutrition-observation-fixtures.js), avec en plus un objet
   `profile` fictif consommé par nutrition-safety.js /
   nutrition-rule-engine.js (jamais lu depuis une table Supabase ici).
   ────────────────────────────────────────────────────────────────────── */

function nsfEntry(date, repas, aliment, isUltraProcessed) {
  return { date: date, repas: repas, aliment: aliment, quantite: 100, kcal: 150, is_ultra_processed: isUltraProcessed };
}

var NUTRITION_SIMULATOR_FIXTURES = {
  standard_eligible: {
    label: 'Profil fictif — standard, éligible',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-1',
      age: 34,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'dinner', 'Frites', true),
      nsfEntry('2026-08-06', 'breakfast', 'Mousse au chocolat', true),
      nsfEntry('2026-08-07', 'dinner', 'Frites', true),
      nsfEntry('2026-08-08', 'dinner', 'Frites', true),
      nsfEntry('2026-08-08', 'breakfast', 'Mousse au chocolat', true),
      nsfEntry('2026-08-09', 'dinner', 'Frites', true),
      nsfEntry('2026-08-10', 'dinner', 'Frites', true),
      nsfEntry('2026-08-11', 'dinner', 'Frites', true),
      nsfEntry('2026-08-12', 'dinner', 'Frites', true)
    ]
  },

  occasional_social_event_not_a_trend: {
    label: 'Profil fictif — écart ponctuel (sortie sociale), pas une tendance',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-2',
      age: 29,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Poisson vapeur légumes', false),
      nsfEntry('2026-08-07', 'lunch', 'Salade composée', false),
      nsfEntry('2026-08-08', 'dinner', 'Frites (sortie entre amis)', true),
      nsfEntry('2026-08-09', 'lunch', 'Riz et légumineuses', false),
      nsfEntry('2026-08-10', 'lunch', 'Poulet légumes', false),
      nsfEntry('2026-08-11', 'dinner', 'Soupe maison', false),
      nsfEntry('2026-08-12', 'lunch', 'Quinoa légumes', false)
    ]
  },

  allergy_confirmed_nuts: {
    label: 'Profil fictif — allergie fruits à coque confirmée',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-3',
      age: 41,
      isPregnantOrBreastfeeding: false,
      allergies: [{ code: 'nuts', status: 'confirmed' }],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  },

  pregnancy_excluded: {
    label: 'Profil fictif — grossesse, exclu du moteur automatisé',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-4',
      age: 31,
      isPregnantOrBreastfeeding: true,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  },

  alcohol_regular_presence: {
    label: 'Profil fictif — alcool présent régulièrement',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_alcohol_v1',
    profile: {
      patientId: 'fictif-6',
      age: 38,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      { date: '2026-08-06', repas: 'dinner', aliment: 'Verre de vin', quantite: 1, kcal: 120, is_alcohol: true },
      { date: '2026-08-07', repas: 'dinner', aliment: 'Verre de vin', quantite: 1, kcal: 120, is_alcohol: true },
      { date: '2026-08-08', repas: 'dinner', aliment: 'Bière', quantite: 1, kcal: 150, is_alcohol: true },
      { date: '2026-08-09', repas: 'dinner', aliment: 'Verre de vin', quantite: 1, kcal: 120, is_alcohol: true },
      { date: '2026-08-10', repas: 'dinner', aliment: 'Salade composée', quantite: 200, kcal: 250, is_alcohol: false },
      { date: '2026-08-11', repas: 'dinner', aliment: 'Bière', quantite: 1, kcal: 150, is_alcohol: true },
      { date: '2026-08-12', repas: 'dinner', aliment: 'Verre de vin', quantite: 1, kcal: 120, is_alcohol: true }
    ]
  },

  alcohol_occasional_social_event_not_a_trend: {
    label: 'Profil fictif — alcool ponctuel (sortie sociale), pas une tendance',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_alcohol_v1',
    profile: {
      patientId: 'fictif-7',
      age: 27,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      { date: '2026-08-06', repas: 'dinner', aliment: 'Eau', quantite: 1, kcal: 0, is_alcohol: false },
      { date: '2026-08-07', repas: 'dinner', aliment: 'Soupe maison', quantite: 250, kcal: 120, is_alcohol: false },
      { date: '2026-08-08', repas: 'dinner', aliment: 'Verre de vin (anniversaire d\'un ami)', quantite: 1, kcal: 120, is_alcohol: true },
      { date: '2026-08-09', repas: 'dinner', aliment: 'Riz et légumineuses', quantite: 200, kcal: 300, is_alcohol: false },
      { date: '2026-08-10', repas: 'dinner', aliment: 'Poulet légumes', quantite: 200, kcal: 350, is_alcohol: false },
      { date: '2026-08-11', repas: 'dinner', aliment: 'Quinoa légumes', quantite: 200, kcal: 300, is_alcohol: false },
      { date: '2026-08-12', repas: 'dinner', aliment: 'Poisson vapeur', quantite: 180, kcal: 220, is_alcohol: false }
    ]
  },

  low_iron_source_presence: {
    label: 'Profil fictif — apport en fer nettement inférieur à la référence',
    referenceDate: '2026-08-12',
    ruleId: 'increase_iron_sources_v1',
    profile: {
      patientId: 'fictif-8',
      age: 36,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    // Cible générique réutilisée (NUTRIENT_DAILY_TARGETS_REFERENCE.iron_mg = 14mg/j) — apport
    // moyen ici ≈ 3mg/j, largement sous le seuil de déclenchement (60% de la cible).
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Pâtes au fromage', false), { iron_mg: 2.5 }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Riz blanc', false), { iron_mg: 1.8 }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Pain blanc et fromage', false), { iron_mg: 3.2 }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Pâtes au fromage', false), { iron_mg: 2.5 }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Riz blanc', false), { iron_mg: 1.8 }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Pommes de terre', false), { iron_mg: 3.0 }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Pâtes nature', false), { iron_mg: 2.9 })
    ]
  },

  low_magnesium_source_presence: {
    label: 'Profil fictif — apport en magnésium nettement inférieur à la référence',
    referenceDate: '2026-08-12',
    ruleId: 'increase_magnesium_sources_v1',
    profile: {
      patientId: 'fictif-10',
      age: 28,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    // Cible générique réutilisée (magnesium_mg = 300mg/j) — apport moyen ≈ 55mg/j.
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Riz blanc', false), { magnesium_mg: 40 }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Pâtes nature', false), { magnesium_mg: 50 }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Blanc de poulet', false), { magnesium_mg: 60 }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Riz blanc', false), { magnesium_mg: 40 }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Pommes de terre', false), { magnesium_mg: 65 }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Pain blanc', false), { magnesium_mg: 55 }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Riz blanc et légumes', false), { magnesium_mg: 70 })
    ]
  },

  low_zinc_source_presence: {
    label: 'Profil fictif — apport en zinc nettement inférieur à la référence',
    referenceDate: '2026-08-12',
    ruleId: 'increase_zinc_sources_v1',
    profile: {
      patientId: 'fictif-11',
      age: 44,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    // Cible générique réutilisée (zinc_mg = 10mg/j) — apport moyen ≈ 1,7mg/j.
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Riz blanc', false), { zinc_mg: 1.2 }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Pâtes nature', false), { zinc_mg: 1.5 }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Épinards cuits', false), { zinc_mg: 2.1 }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Riz blanc', false), { zinc_mg: 1.2 }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Pommes de terre', false), { zinc_mg: 1.8 }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Pain blanc', false), { zinc_mg: 1.9 }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Salade verte', false), { zinc_mg: 2.0 })
    ]
  },

  low_vitamin_c_source_presence: {
    label: 'Profil fictif — sources de vitamine C peu présentes',
    referenceDate: '2026-08-12',
    ruleId: 'increase_vitamin_c_sources_v1',
    profile: {
      patientId: 'fictif-12',
      age: 31,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Pâtes nature', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Riz blanc', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Blanc de poulet', false), { nutrient_sources: ['zinc'] }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Pâtes nature', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Riz blanc', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Pain blanc', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Orange', false), { nutrient_sources: ['vitamin_c'] })
    ]
  },

  low_vitamin_d_source_presence: {
    label: 'Profil fictif — sources de vitamine D peu présentes',
    referenceDate: '2026-08-12',
    ruleId: 'increase_vitamin_d_sources_v1',
    profile: {
      patientId: 'fictif-13',
      age: 52,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Salade verte', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Riz aux légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Pâtes tomate', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Salade composée', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Riz aux légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Soupe de légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Saumon', false), { nutrient_sources: ['vitamin_d', 'omega3'] })
    ]
  },

  low_potassium_source_presence: {
    label: 'Profil fictif — apport en potassium nettement inférieur à la référence',
    referenceDate: '2026-08-12',
    ruleId: 'increase_potassium_sources_v1',
    profile: {
      patientId: 'fictif-14',
      age: 39,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    // Cible générique réutilisée (potassium_mg = 3500mg/j) — apport moyen ≈ 650mg/j.
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Pain blanc', false), { potassium_mg: 500 }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Pâtes nature', false), { potassium_mg: 550 }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Riz blanc', false), { potassium_mg: 600 }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Pain blanc', false), { potassium_mg: 500 }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Pâtes nature', false), { potassium_mg: 700 }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Biscottes', false), { potassium_mg: 800 }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Riz blanc et légumes', false), { potassium_mg: 900 })
    ]
  },

  low_vitamin_b12_source_presence: {
    label: 'Profil fictif — sources de vitamine B12 peu présentes (régime végétalien déclaré)',
    referenceDate: '2026-08-12',
    ruleId: 'increase_vitamin_b12_sources_v1',
    profile: {
      patientId: 'fictif-15',
      age: 26,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: 'vegan',
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Riz et légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Lentilles', false), { nutrient_sources: ['iron', 'fiber'] }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Tofu et légumes', false), { nutrient_sources: ['iron', 'calcium'] }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Riz et légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Pois chiches', false), { nutrient_sources: ['iron', 'fiber'] }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Salade verte', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Quinoa légumes', false), { nutrient_sources: [] })
    ]
  },

  added_sugar_regular_presence: {
    label: 'Profil fictif — sucre ajouté présent régulièrement',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_added_sugar_v1',
    profile: {
      patientId: 'fictif-16',
      age: 24,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      { date: '2026-08-06', repas: 'snack', aliment: 'Biscuits fourrés', quantite: 60, kcal: 300, is_added_sugar_rich: true },
      { date: '2026-08-07', repas: 'snack', aliment: 'Barre chocolatée', quantite: 40, kcal: 210, is_added_sugar_rich: true },
      { date: '2026-08-08', repas: 'breakfast', aliment: 'Céréales sucrées', quantite: 50, kcal: 190, is_added_sugar_rich: true },
      { date: '2026-08-09', repas: 'snack', aliment: 'Biscuits fourrés', quantite: 60, kcal: 300, is_added_sugar_rich: true },
      { date: '2026-08-10', repas: 'lunch', aliment: 'Salade composée', quantite: 200, kcal: 250, is_added_sugar_rich: false },
      { date: '2026-08-11', repas: 'snack', aliment: 'Barre chocolatée', quantite: 40, kcal: 210, is_added_sugar_rich: true },
      { date: '2026-08-12', repas: 'breakfast', aliment: 'Céréales sucrées', quantite: 50, kcal: 190, is_added_sugar_rich: true }
    ]
  },

  added_sugar_occasional_birthday_not_a_trend: {
    label: 'Profil fictif — sucre ajouté ponctuel (anniversaire), pas une tendance',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_added_sugar_v1',
    profile: {
      patientId: 'fictif-17',
      age: 35,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      { date: '2026-08-06', repas: 'lunch', aliment: 'Salade composée', quantite: 200, kcal: 250, is_added_sugar_rich: false },
      { date: '2026-08-07', repas: 'lunch', aliment: 'Poulet légumes', quantite: 200, kcal: 350, is_added_sugar_rich: false },
      { date: '2026-08-08', repas: 'dinner', aliment: 'Part de gâteau (anniversaire)', quantite: 100, kcal: 350, is_added_sugar_rich: true },
      { date: '2026-08-09', repas: 'lunch', aliment: 'Riz et légumineuses', quantite: 200, kcal: 300, is_added_sugar_rich: false },
      { date: '2026-08-10', repas: 'lunch', aliment: 'Quinoa légumes', quantite: 200, kcal: 300, is_added_sugar_rich: false },
      { date: '2026-08-11', repas: 'dinner', aliment: 'Soupe maison', quantite: 250, kcal: 120, is_added_sugar_rich: false },
      { date: '2026-08-12', repas: 'lunch', aliment: 'Poisson vapeur', quantite: 180, kcal: 220, is_added_sugar_rich: false }
    ]
  },

  multi_signal_vegan_priority_demo: {
    label: 'Profil fictif — plusieurs signaux simultanés, régime végétalien (démo de priorité)',
    referenceDate: '2026-08-12',
    // Utilisé par la simulation multi-règles (runNutritionSimulationForAllRules),
    // pas par une seule règle — ruleId ci-dessous sert uniquement de valeur
    // par défaut pour les vues qui n'affichent qu'une règle à la fois.
    ruleId: 'increase_iron_sources_v1',
    profile: {
      patientId: 'fictif-18',
      age: 29,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: 'vegan',
      eligibleForAutomatedAdvice: true
    },
    // Apports faibles sur tous les nutriments quantitatifs (fer, calcium, fibres,
    // oméga-3, magnésium, zinc, potassium, protéines) ET rareté de sources pour
    // la vitamine B12 (restée sur l'ancien mécanisme, aucune cible chiffrée
    // disponible) — pour démontrer le tri de priorité sur un profil qui cumule
    // plusieurs signaux de nature différente en même temps.
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Riz blanc et pâtes', false), {
        nutrient_sources: [], iron_mg: 2, calcium_mg: 100, fiber_g: 3, omega3_g: 0.1, magnesium_mg: 50, zinc_mg: 1.5, potassium_mg: 500, protein_g: 10
      }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Pain blanc', false), {
        nutrient_sources: [], iron_mg: 2.5, calcium_mg: 120, fiber_g: 2.5, omega3_g: 0.1, magnesium_mg: 45, zinc_mg: 1.2, potassium_mg: 450, protein_g: 8
      }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Pommes de terre', false), {
        nutrient_sources: [], iron_mg: 3, calcium_mg: 90, fiber_g: 4, omega3_g: 0.1, magnesium_mg: 60, zinc_mg: 1.8, potassium_mg: 600, protein_g: 9
      }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Riz blanc', false), {
        nutrient_sources: [], iron_mg: 2, calcium_mg: 100, fiber_g: 3, omega3_g: 0.1, magnesium_mg: 50, zinc_mg: 1.5, potassium_mg: 500, protein_g: 10
      }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Pâtes nature', false), {
        nutrient_sources: [], iron_mg: 2.5, calcium_mg: 110, fiber_g: 2.8, omega3_g: 0.1, magnesium_mg: 55, zinc_mg: 1.4, potassium_mg: 480, protein_g: 9
      }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Biscottes', false), {
        nutrient_sources: [], iron_mg: 2.8, calcium_mg: 95, fiber_g: 3.2, omega3_g: 0.1, magnesium_mg: 48, zinc_mg: 1.6, potassium_mg: 520, protein_g: 8
      }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Riz blanc et légumes pauvres en fibres', false), {
        nutrient_sources: [], iron_mg: 3, calcium_mg: 105, fiber_g: 3, omega3_g: 0.1, magnesium_mg: 52, zinc_mg: 1.5, potassium_mg: 550, protein_g: 9
      })
    ]
  },

  low_protein_source_presence: {
    label: 'Profil fictif — apport en protéines nettement inférieur à la référence',
    referenceDate: '2026-08-12',
    ruleId: 'increase_protein_sources_v1',
    profile: {
      patientId: 'fictif-19',
      age: 22,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    // Cible générique réutilisée (protein_g = 56g/j) — apport moyen ≈ 14g/j.
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Riz blanc', false), { protein_g: 12 }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Pâtes nature', false), { protein_g: 14 }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Salade verte', false), { protein_g: 10 }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Riz blanc', false), { protein_g: 12 }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Pain blanc', false), { protein_g: 16 }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Pommes de terre', false), { protein_g: 15 }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Riz blanc et légumes', false), { protein_g: 13 })
    ]
  },

  low_hydration_presence: {
    label: 'Profil fictif — prises hydratantes peu présentes',
    referenceDate: '2026-08-12',
    ruleId: 'increase_hydration_v1',
    profile: {
      patientId: 'fictif-20',
      age: 40,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Salade composée', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Poulet légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Riz et légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Quinoa légumes', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Soupe maison', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Poisson vapeur', false), { nutrient_sources: [] }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Eau plate', false), { nutrient_sources: ['hydration'] })
    ]
  },

  low_food_variety_presence: {
    label: 'Profil fictif — variété alimentaire faible (même aliment répété)',
    referenceDate: '2026-08-12',
    ruleId: 'increase_food_variety_v1',
    profile: {
      patientId: 'fictif-21',
      age: 33,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    journalEntries: [
      { date: '2026-08-06', repas: 'lunch', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-06', repas: 'dinner', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-07', repas: 'lunch', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-07', repas: 'dinner', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-08', repas: 'lunch', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-09', repas: 'lunch', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-09', repas: 'dinner', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false },
      { date: '2026-08-10', repas: 'lunch', aliment: 'Riz et poulet', quantite: 300, kcal: 450, is_ultra_processed: false }
    ]
  },

  adequate_nutrient_sources_control: {
    label: 'Profil fictif — apport en fer adéquat (témoin, aucun signal attendu)',
    referenceDate: '2026-08-12',
    ruleId: 'increase_iron_sources_v1',
    profile: {
      patientId: 'fictif-9',
      age: 33,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: true
    },
    // Apport moyen ≈ 12mg/j, au-dessus du seuil de déclenchement (60% de 14mg/j = 8,4mg/j).
    journalEntries: [
      Object.assign(nsfEntry('2026-08-06', 'lunch', 'Lentilles et légumes', false), { iron_mg: 11 }),
      Object.assign(nsfEntry('2026-08-07', 'lunch', 'Épinards et tofu', false), { iron_mg: 13 }),
      Object.assign(nsfEntry('2026-08-08', 'lunch', 'Pois chiches', false), { iron_mg: 10 }),
      Object.assign(nsfEntry('2026-08-09', 'lunch', 'Viande rouge maigre', false), { iron_mg: 14 }),
      Object.assign(nsfEntry('2026-08-10', 'lunch', 'Lentilles', false), { iron_mg: 12 }),
      Object.assign(nsfEntry('2026-08-11', 'lunch', 'Épinards cuits', false), { iron_mg: 12 }),
      Object.assign(nsfEntry('2026-08-12', 'lunch', 'Tofu et brocolis', false), { iron_mg: 12 })
    ]
  },

  not_whitelisted: {
    label: 'Profil fictif — non whitelisté pour le moteur automatisé',
    referenceDate: '2026-08-12',
    ruleId: 'reduce_ultra_processed_foods_v1',
    profile: {
      patientId: 'fictif-5',
      age: 45,
      isPregnantOrBreastfeeding: false,
      allergies: [],
      intolerances: [],
      clinicalContext: [],
      symptoms: [],
      diet: null,
      eligibleForAutomatedAdvice: false
    },
    journalEntries: [
      nsfEntry('2026-08-06', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-07', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-08', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-09', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-10', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-11', 'lunch', 'Plat préparé industriel', true),
      nsfEntry('2026-08-12', 'lunch', 'Plat préparé industriel', true)
    ]
  }
};
