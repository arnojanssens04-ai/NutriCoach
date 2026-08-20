/* ──────────────────────────────────────────────────────────────────────
   meal-pattern-clarifying-questions.js — Questions de clarification
   fixes, sélectionnées par règle — Cap Santé

   Chantier SÉPARÉ du moteur confiné nutrition-*.js (jamais chargé,
   jamais référencé, jamais modifié par ce fichier). Aucun réseau, aucune
   persistance, aucune IA, AUCUNE génération de texte : uniquement une
   sélection déterministe parmi un jeu FIXE de questions et d'options
   pré-rédigées, jamais assemblées dynamiquement à partir de données du
   journal (contrairement au corps de conseil, qui interpole des noms
   d'aliments, aucune question de ce fichier ne cite un aliment précis —
   elles restent volontairement génériques et validées à l'avance).

   Objectif : quand les alternatives proposées par le moteur sont déjà
   toutes couvertes par la routine détectée (meal-pattern-exclusion.js),
   poser d'abord une question plutôt que de répéter une suggestion
   redondante — jamais une supposition sur ce que la personne veut.
   ────────────────────────────────────────────────────────────────────── */

// Catalogue fixe — chaque question a un id stable, un texte validé, et
// des options fermées (jamais de champ libre). Rien ici n'est généré :
// ajouter une question = ajouter une entrée revue par un humain.
var MEAL_PATTERN_CLARIFYING_QUESTIONS = {
  goal_clarification: {
    id: 'goal_clarification',
    text: 'Que souhaitez-vous améliorer avec ce repas ?',
    options: [
      'Réduire progressivement un aliment précis',
      'Varier les options tout en gardant la même structure',
      'Ne rien changer pour le moment',
      'En discuter avec un professionnel'
    ]
  },
  satiety_check: {
    id: 'satiety_check',
    text: 'Après ce repas, ressentez-vous encore faim avant le repas suivant ?',
    options: ['Oui, souvent', 'Non, rarement', 'Parfois', 'Je ne sais pas']
  },
  keep_or_adjust: {
    id: 'keep_or_adjust',
    text: 'Souhaitez-vous modifier la composition de ce repas, ou seulement réduire un aliment en particulier ?',
    options: [
      'Modifier la composition du repas',
      'Réduire un aliment en particulier',
      'Garder ce repas tel quel',
      'En discuter avec un professionnel'
    ]
  }
};

/* -----------------------------------------------------------------------
   selectClarifyingQuestion(context)

   context: { hasRedundantSuggestions: boolean, recurringFoodCount: number }

   Sélection PAR RÈGLE, jamais par génération : si les alternatives
   proposées par le moteur sont déjà toutes couvertes par la routine
   détectée (hasRedundantSuggestions), la suggestion résiduelle est
   faible — poser une question plutôt qu'insister sur une alternative
   redondante. Si le repas comporte de nombreux aliments récurrents
   (routine bien établie, >= 3), demander explicitement si un ajustement
   ou une réduction ciblée est souhaité(e). Sinon, retombe sur la
   question générale. Ne retourne jamais null pour un contexte fourni
   (toujours au moins une question par défaut) — mais ne doit être
   appelée QUE lorsqu'un contexte de redondance a été identifié par
   l'appelant (voir nutrition-simulator-admin.html).
   ----------------------------------------------------------------------- */
function selectClarifyingQuestion(context) {
  context = context || {};
  if (!context.hasRedundantSuggestions) return null;
  if (typeof context.recurringFoodCount === 'number' && context.recurringFoodCount >= 3) {
    return MEAL_PATTERN_CLARIFYING_QUESTIONS.keep_or_adjust;
  }
  return MEAL_PATTERN_CLARIFYING_QUESTIONS.goal_clarification;
}
