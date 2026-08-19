/* ──────────────────────────────────────────────────────────────────────
   nutrition-observation-fixtures.js — Données FICTIVES pour le prototype
   admin nutrition-observation-admin-prototype — Cap Santé

   Aucun identifiant réel. Aucune donnée clinique, allergie ou symptôme.
   Format aligné sur les colonnes réelles de la table journal (date,
   repas, aliment, quantite, kcal, is_ultra_processed), comme DEMO_JOURNAL
   dans conseils.html.
   ────────────────────────────────────────────────────────────────────── */

var NUTRITION_OBSERVATION_FIXTURES = {
  muesli_chocolate_routine: {
    label: 'Profil fictif — routine muesli au chocolat',
    referenceDate: '2026-08-12',
    journalEntries: [
      { date: '2026-08-06', repas: 'breakfast', aliment: 'Muesli au chocolat', quantite: 40, kcal: 180, is_ultra_processed: true },
      { date: '2026-08-06', repas: 'lunch', aliment: 'Poulet riz légumes', quantite: 300, kcal: 420, is_ultra_processed: false },
      { date: '2026-08-07', repas: 'breakfast', aliment: 'Muesli au chocolat', quantite: 40, kcal: 180, is_ultra_processed: true },
      { date: '2026-08-08', repas: 'breakfast', aliment: 'Muesli au chocolat', quantite: 40, kcal: 180, is_ultra_processed: true },
      { date: '2026-08-09', repas: 'breakfast', aliment: 'Pain et confiture', quantite: 60, kcal: 220, is_ultra_processed: false },
      { date: '2026-08-10', repas: 'breakfast', aliment: 'Muesli au chocolat', quantite: 40, kcal: 180, is_ultra_processed: true },
      { date: '2026-08-11', repas: 'breakfast', aliment: 'Muesli au chocolat', quantite: 40, kcal: 180, is_ultra_processed: true },
      { date: '2026-08-12', repas: 'lunch', aliment: 'Salade composée', quantite: 200, kcal: 250, is_ultra_processed: false }
    ]
  },

  no_recurrence_detected: {
    label: 'Profil fictif — aucune récurrence détectable',
    referenceDate: '2026-08-12',
    journalEntries: [
      { date: '2026-08-06', repas: 'breakfast', aliment: 'Œufs brouillés', quantite: 100, kcal: 150, is_ultra_processed: false },
      { date: '2026-08-07', repas: 'lunch', aliment: 'Poisson vapeur', quantite: 150, kcal: 200, is_ultra_processed: false },
      { date: '2026-08-08', repas: 'dinner', aliment: 'Soupe de légumes', quantite: 250, kcal: 120, is_ultra_processed: false },
      { date: '2026-08-09', repas: 'breakfast', aliment: 'Fruits frais', quantite: 150, kcal: 90, is_ultra_processed: false },
      { date: '2026-08-10', repas: 'lunch', aliment: 'Quinoa légumes', quantite: 200, kcal: 300, is_ultra_processed: false },
      { date: '2026-08-11', repas: 'dinner', aliment: 'Tofu sauté', quantite: 180, kcal: 220, is_ultra_processed: false },
      { date: '2026-08-12', repas: 'breakfast', aliment: 'Yaourt et fruits', quantite: 120, kcal: 110, is_ultra_processed: false }
    ]
  },

  insufficient_coverage: {
    label: 'Profil fictif — couverture insuffisante',
    referenceDate: '2026-08-12',
    journalEntries: [
      { date: '2026-08-10', repas: 'breakfast', aliment: 'Café et tartine', quantite: 50, kcal: 150, is_ultra_processed: false },
      { date: '2026-08-12', repas: 'lunch', aliment: 'Sandwich', quantite: 200, kcal: 350, is_ultra_processed: true }
    ]
  }
};
