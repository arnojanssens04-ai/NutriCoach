# AUDIT.md — Cap Santé, état réel du projet

### Étape 1 du pipeline défini dans la spécification — aucune ligne de code modifiée

Ce document a été produit par lecture directe et systématique des fichiers du dépôt (pas par mémoire de conversation ni par reprise d'un audit antérieur). Chaque affirmation ci-dessous a été vérifiée par grep/lecture au moment de la rédaction.

**Remarque préliminaire importante :** un document nommé « CLAUDE.md » a été fourni avec cette demande, mais son contenu est en réalité une version antérieure de cet audit (mêmes titres, même structure), pas un fichier de configuration projet. Aucun fichier `CLAUDE.md` n'existe dans ce dépôt (`find` sur l'arborescence : aucun résultat). Plusieurs affirmations de ce document fourni ne correspondent pas au code actuel — elles sont signalées et corrigées en section 7 pour éviter de propager une compréhension erronée du projet.

---

## 0. Stack technique confirmée

- **Frontend** : HTML/CSS/JS vanilla, un fichier par page, aucun framework, aucun bundler, aucun `package.json`.
- **Backend** : Supabase (Postgres + Auth), interrogé directement depuis le navigateur via `@supabase/supabase-js@2` chargé en CDN. Clé anonyme (`sb_publishable_...`) et URL de projet en clair dans chaque fichier HTML.
- **Fonctions serveur** : au moins un endpoint Supabase Edge Function est appelé (`/functions/v1/dynamic-endpoint`, utilisé par `photo-ia.html` pour le scan photo). **Le code de ces fonctions n'est pas présent dans ce dépôt** — impossible d'auditer leur logique, leur gestion des données envoyées (photos en base64) ou leur éventuel appel à un modèle d'IA externe depuis les fichiers disponibles ici.
- **Hébergement** : Cloudflare (voir `wrangler.toml`, `_headers`, `assetsignore`) — site statique servi comme SPA (`not_found_handling = "single-page-application"`).
- **IA de production** : aucune trace dans ce dépôt d'appel à un modèle de langage pour la formulation de conseils. Le seul point d'IA identifiable est l'appel à l'edge function depuis `photo-ia.html`, dont le contenu réel (modèle utilisé, prompt, etc.) est invisible ici.

---

## 1. Structure des dossiers

Dépôt à plat, aucune arborescence `src/`, `lib/`, `tests/` ou équivalent :

```
NutriCoach/
├── _headers                  # règles de cache Cloudflare
├── assetsignore               # fichiers exclus du déploiement Cloudflare
├── wrangler.toml               # config Cloudflare Pages/Workers
├── data/
│   └── ciqual.json             # base alimentaire CIQUAL (532 Ko), chargée côté client
├── logo-capsante.png
├── protect.js                  # utilitaire partagé (47 lignes)
├── mode-focus.js                # logique Mode Focus / satiété (322 lignes)
├── recettes-data.js             # données de recettes statiques (727 lignes)
├── regles-pathologies.js        # SEUL fichier de règles nutritionnelles partagé (318 lignes)
├── index.html                   # vitrine + authentification (630 lignes)
├── dashboard.html               # cœur applicatif (5723 lignes)
├── bilan.html                   # bilan hebdomadaire patient (649 lignes)
├── bilan_recap.html             # vue admin des bilans (375 lignes)
├── recette.html / recette-prep.html  # fiches recettes, mode cuisine
├── plan-fixe.html                # constructeur de plan alimentaire fixe
├── photo-ia.html                 # scan photo par IA (933 lignes)
├── aliments.html                 # ajout d'aliments personnalisés (admin)
├── admin.html                    # hub admin
├── chat.html / chat-admin.html   # messagerie patient ↔ diététicien
├── annonces.html                 # annonces/changelog utilisateur
├── met.html                      # calcul MET (activité physique détaillée)
├── gouts.html                    # préférences alimentaires
├── cgu.html / confidentialite.html  # pages légales statiques
└── docs/                         # n'existait pas avant ce document
```

Il n'existe **aucun dossier de code serveur** dans ce dépôt (pas d'Edge Functions, pas de migrations SQL, pas de schéma Supabase versionné). Toute la logique de plateforme (tables, policies RLS, fonctions Deno, cron) vit exclusivement dans le tableau de bord Supabase, hors du contrôle de version accessible ici. C'est une zone aveugle significative pour cet audit.

---

## 2. Modèles de données

Il n'existe aucun schéma formel (pas de fichier `.sql`, pas de définition TypeScript/JSON Schema). Les modèles sont déduits des appels `sb.from(...)` dans le code client.

### 2.1 Tables Supabase effectivement utilisées (13, confirmées par grep exhaustif)

| Table | Usage principal | Fichiers qui l'utilisent |
|---|---|---|
| `profiles` | Profil utilisateur (identité, mesures, objectifs, pathologies, préférences) | quasiment tous |
| `journal` | Entrées alimentaires quotidiennes | `dashboard.html` (lecture/écriture principale) |
| `bilans` | Bilans hebdomadaires qualitatifs + décision kcal | `bilan.html`, `bilan_recap.html`, `dashboard.html` |
| `aliments_custom` | Aliments ajoutés manuellement par un admin | `aliments.html`, `dashboard.html`, `recette.html` |
| `recettes` | Recettes (ingrédients, étapes) | `recette.html`, `recette-prep.html` |
| `messages` | Messagerie patient ↔ admin | `chat.html`, `chat-admin.html` |
| `annonces` / `annonce_reactions` | Annonces + réactions | `annonces.html` |
| `satiety_logs` | Validation « je suis rassasié(e) » du jour | `mode-focus.js` |
| `poids_history` | Historique du poids | `dashboard.html` |
| `energy_checkins` | Check-in d'énergie/forme (usage exact non détaillé ici) | `dashboard.html` |
| `photo_scan_logs` | Compteur d'utilisation du scan photo (limite plan gratuit) | `photo-ia.html` |
| `photo_corrections` | Corrections utilisateur après scan IA (nom aliment, quantité IA vs réelle) | `photo-ia.html` |

**Aucune trace** de tables `changelog` ou `ciqual_micronutriments` dans le code client — ces noms n'apparaissent nulle part comme argument de `sb.from()`. Le « changelog » visible dans `dashboard.html` est en réalité une clé `localStorage` (`capsante_changelog_seen`), pas une table.

### 2.2 Colonnes `profiles` confirmées par usage direct dans le code

`age`, `poids`, `poids_initial`, `taille`, `sexe`, `activite`, `activite_met_kcal`, `objectif`, `pathologies` (tableau), `kcal_adjustment`, `kcal_target`, `plan_fixe`, `generic_meal_plan`, `food_preferences`, `hide_exact_kcal`, `menophase`, `menoths`, `suivi_cycle_actif`, `jour_bilan`, `role`, `plan` (free/premium), plus des indicateurs UI (`last_seen_changelog_version` en `localStorage`, pas confirmé côté table).

### 2.3 Modèle des 6 pathologies formalisées

`dashboard.html:1462` — objet `PATHO_META` :

```js
{ diabetes, cholesterol, hypertension, cardiac, renal, obesity }
```

`menopause` est traité comme un cas à part (n'apparaît pas dans `PATHO_META`, géré par des champs profil dédiés `menophase`/`menoths`). Il n'existe **aucun modèle de « symptôme »** au sens de la spécification (intensité, fréquence, aliments concernés, délai d'apparition) — les seules données de type symptôme sont des champs qualitatifs à choix fermé (`bien`/`moyen`/`difficile`) dans le formulaire de bilan hebdomadaire (`troubles_digestifs`, `hta_symptomes`), sans texte libre structuré ni suivi dans le temps au niveau d'un aliment précis.

### 2.4 Modèle du journal alimentaire (`journal`, table la plus riche)

Une ligne par aliment ajouté : `user_id`, `date`, `repas`, `aliment`, quantité, valeurs nutritionnelles calculées (`kcal`, `proteines`, `glucides`, `lipides`) **et** valeurs pour-100g dupliquées (`food_kcal_100`, `food_prot_100`, etc. — 11 champs `food_*_100`), plus `is_ultra_processed` (booléen ou `null`), `recette_id` optionnel. La duplication valeur-calculée/valeur-pour-100g est volontaire (permet de recalculer si la quantité change sans re-requêter la base alimentaire) mais alourdit chaque ligne.

---

## 3. Fonctions de calcul nutritionnel

### 3.1 Dans `regles-pathologies.js` (le seul fichier de règles réellement partagé)

Fonctions confirmées présentes par lecture complète du fichier (318 lignes) :

- `fibreGlucRatio(gluc100, fibres100)` — ratio fibres/glucides, proxy d'impact glycémique.
- `recipeHasGlycemicCulprit(recipe)` / `filterRecipesForPathologies(pool, pathologies)` — filtre les recettes incompatibles (diabète : impact glycémique ; cœliaque : présence de gluten).
- `glycemicBadge(it)` / `diabetePlanBadge(it)` — badges d'alerte glycémique affichés sur un aliment.
- `biscuitTropSucre(sucres100)`, `detectFoodCategory(nom)`, `suggestAlternatives(nom)` — détection de catégorie « à risque » (biscuit, bonbon, chocolat) et alternatives associées.
- `containsGluten(nom)` — détection par mots-clés (`indexOf`, pas de regex complexe) sur le nom de l'aliment ; retourne la catégorie de gluten détectée ou `false`.
- `glutenAlternatives(nom)` / `GLUTEN_SYMPTOMS` — alternatives sans gluten et texte informatif sur les symptômes de la maladie cœliaque.

**Correction par rapport au document de référence fourni :** les fonctions `evaluateGlycemicImpact`, `evaluateMealTags`, `renderMealTagsHTML`, `scoreCardioFromTotals`, `evaluateCardioProfile`, `cardioProtectiveScore`, `suggestFiberBoost`, `suggestPotassiumBoost` **n'existent nulle part dans le dépôt** (recherche exhaustive sans aucun résultat sur ces 8 noms). Il n'y a pas de moteur de tags par repas plafonné, ni de score cardiovasculaire dédié — seulement des messages ponctuels sur les graisses saturées intégrés directement dans `genAlerts()` et `calcScore()` (`dashboard.html`).

### 3.2 Dans `dashboard.html` (non partagées — vivent uniquement ici)

- **`calcTargets()`** (ligne 1630) — calcul des objectifs kcal/macros. C'est la version la plus complète du projet : Mifflin-St Jeor pour le métabolisme de base, prise en compte du MET précis si renseigné (`met.html`), protéines calculées en g/kg selon niveau d'activité (1.2 à 1.7 g/kg, plancher spécifique en perte de poids chez les sportifs), répartition glucides/lipides ajustée pour le diabète, ajustements spécifiques ménopause, plafonds absolus 1200–5000 kcal.
- **`calcScore()`** (ligne 1851) — « Score Santé » du jour : barème sur 100 points (protéines/glucides/lipides/fibres vers l'objectif, qualité alimentaire pénalisée par aliment ultra-transformé selon un barème progressif, bonus légumes/fibres/AGS, pénalités sodium/dépassement calorique/alcool).
- **`getUltraProcessedList()` / `countUltraProcessed()`** (ligne 1795) — détection d'aliments ultra-transformés par regex de mots-clés (`ULTRA_PROCESSED_REGEX`, ~60 motifs), utilisée uniquement si aucun signal fiable (`is_ultra_processed` posé par l'IA du scan photo, ou classification NOVA) n'est déjà disponible pour l'aliment.
- **`genAlerts()`** (ligne 2256) — alertes du jour : dépassement calorique, alcool (≥3 verres), protéines insuffisantes, et alertes spécifiques par pathologie (glucides pour diabète, graisses saturées pour cholestérol/cardiaque, potassium pour hypertension/insuffisance rénale).
- **`estimateFibresFallback()`** — estimation heuristique des fibres manquantes par catégorie d'aliment déduite du nom (légumineuse, céréale complète, légume, fruit).

### 3.3 Duplication confirmée de `calcTargets` (voir aussi section 6)

La formule kcal/macros existe sous **quatre versions différentes** :

1. `dashboard.html:1630` — version complète (référence, g/kg, ménopause, diabète).
2. `recette.html:435` — version simplifiée, pourcentages fixes (15 %/50 %/35 %), sans les ajustements g/kg, ménopause ou diabète.
3. `recette-prep.html:202` — identique à la version de `recette.html` (copie de copie).
4. `bilan.html:503` (`computeKcalCible`) — reproduit uniquement la portion kcal (pas les macros), avec un commentaire explicite dans le code signalant le risque : *« ⚠️ Si la formule de calcTargets() change côté dashboard, la répercuter ici »*.

Aucune des trois copies simplifiées n'a été mise à jour en même temps que les évolutions visibles de la version de référence (g/kg protéines, ajustements ménopause) — elles utilisent toutes l'ancien modèle en pourcentages fixes.

---

## 4. Logique actuelle des conseils

Le système est **entièrement réactif et journalier**, sans aucune des couches décrites dans la spécification (observation multi-jours, tendance, confiance) :

- **Granularité repas** : aucun moteur de tags par repas plafonné n'existe (voir 3.1 — correction du document de référence). Seuls des badges ponctuels (`glycemicBadge`, `diabetePlanBadge`) s'affichent sur un aliment individuel selon son impact glycémique ou sa teneur en sucre.
- **Granularité jour** : `genAlerts()` calcule une liste d'alertes à partir des totaux du jour courant uniquement (`T`, objet de totaux recalculé à chaque chargement). Chaque règle est un `if` indépendant, sans notion de fenêtre d'observation, de nombre d'occurrences minimal, ni de niveau de confiance. Rien n'empêche plusieurs alertes de s'afficher simultanément (pas de plafond « max 2 messages » constaté dans `genAlerts`, contrairement à ce qu'affirme le document de référence).
- **Granularité semaine** : `bilan.html` contient un algorithme adaptatif (`checkAndAdjustKcal`) qui ajuste `kcal_adjustment` de ±200 kcal si le poids stagne sur deux semaines **et** si le ressenti qualitatif du bilan (score sur 14, seuil 7) n'est pas mauvais. C'est la seule logique du projet qui regarde plusieurs points dans le temps avant d'agir — mais elle reste spécifique au poids/kcal, pas généralisable à d'autres tendances (calcium, transformés, symptômes).
- **Aucune notion de confiance explicite** (`unknown/low/moderate/high`) n'existe où que ce soit dans le code : chaque règle est binaire (déclenchée ou non), jamais accompagnée d'un niveau de certitude ni d'une justification structurée du type « sur quelles données ».
- **Aucune mémoire des conseils acceptés/refusés/reportés** : les alertes sont recalculées à chaque affichage, rien n'est persistant sur la réaction de l'utilisateur à une alerte donnée.
- **Pas de composant « carte centrale »** générique et modal tel que décrit dans la spécification (section 16). L'affichage actuel se fait via des cartes intégrées au flux normal de la page (`.card`) et des toasts, sans voile de filtrage de page ni limite stricte « une carte active à la fois ».
- **Reinforcement first** : partiellement présent — `genAlerts` inclut un message positif (`t:'good'`) quand le quota est atteint sans dépassement, et `calcScore` valorise les bons choix par des bonus, mais ce n'est pas un principe formalisé/documenté comme règle transversale, plutôt une conséquence du barème.
- **Garde-fou anti-restriction** : le bouton satiété (`mode-focus.js`, `SATIETY_TODAY`) permet à l'utilisateur de faire taire les alertes de dépassement calorique pour la journée sur la base du ressenti plutôt que du chiffre — c'est le mécanisme anti-restriction le plus concret du projet actuel.

---

## 5. Données enregistrées

Résumé par catégorie, sur la base des colonnes/tables confirmées en section 2 :

- **Identité et mesures** : âge, sexe, taille, poids (courant + initial), historique de poids (`poids_history`).
- **Objectifs et contraintes** : objectif (perte/prise/maintien), niveau d'activité, préférences alimentaires (`food_preferences`), plan fixe/généré.
- **Santé** : pathologies déclarées (liste fermée de 6 + ménopause), champs bilan qualitatifs (digestion, sommeil, énergie, humeur, symptômes liés au diabète/HTA — tous sur échelle fermée, pas de texte libre structuré).
- **Alimentation** : chaque entrée du journal (aliment, quantité, macronutriments détaillés, micronutriments partiels : fer, calcium, potassium, magnésium, zinc, oméga-3, sodium, fibres, flag ultra-transformé).
- **Comportemental/usage** : validations de satiété par jour, corrections après scan photo (nom aliment, quantité proposée par l'IA vs quantité réelle), compteur d'utilisation du scan photo (throttling plan gratuit).
- **Messagerie** : contenu textuel complet des échanges patient ↔ admin (`messages.content`), avec statut lu/non lu.
- **Photos** : les images elles-mêmes ne transitent pas par une table Supabase visible dans ce dépôt — elles sont compressées côté client puis envoyées en base64 à une Edge Function externe au dépôt. **Impossible de confirmer depuis ce code si elles sont conservées, pour combien de temps, ou transmises à un tiers (Gemini ou autre)** — zone aveugle à couvrir explicitement à l'étape RGPD (section 2 du pipeline).

---

## 6. Tests existants

**Aucun.** Recherche exhaustive de fichiers `*test*`, `*spec*`, de `package.json`, de configuration de test (Jest, Vitest, Playwright, etc.) : aucun résultat. Il n'existe aucune vérification automatisée des calculs (`calcTargets`, `calcScore`, `genAlerts`, `containsGluten`...), aucun test de non-régression, aucun test des règles de sécurité (filtrage pathologie), aucun test de migration ou de suppression de données. Toute validation actuelle est manuelle.

---

## 7. Doublons éventuels

| Doublon | Détail | Sévérité |
|---|---|---|
| **`calcTargets()` × 4** | `dashboard.html` (référence complète), `recette.html`, `recette-prep.html` (copies simplifiées identiques entre elles), `bilan.html` (`computeKcalCible`, portion kcal seule). Confirmé dérivé — les copies n'ont pas suivi les évolutions de la version de référence. | **Élevée** |
| **Score qualitatif bilan × 2** | `qualiteBilanScore()` dans `bilan.html:490` et `bilanScore()` dans `bilan_recap.html:201`, même table `PILL_SCORE`, même liste de 7 champs, même seuil (7/14). Le second porte un commentaire reconnaissant la duplication (« même logique que qualiteBilanScore() côté bilan.html »). | Moyenne |
| **`ALTERNATIVES_PAR_CATEGORIE` vs `GLUTEN_ALTERNATIVES`** | Deux tables de correspondance distinctes dans `regles-pathologies.js` pour deux besoins différents (diabète/sucre vs gluten) — pas un doublon au sens strict, mais deux mini-registres non unifiés qui pourraient diverger si une même règle devait s'appliquer aux deux. | Faible |

**Correction par rapport au document de référence fourni** : `getUltraProcessedList()` n'est **pas** dupliquée dans `bilan_recap.html` — cette fonction n'apparaît que dans `dashboard.html`. `bilan_recap.html` ne recalcule aucune donnée nutritionnelle ; il affiche uniquement les colonnes déjà stockées dans `bilans` (dont la décision kcal déjà calculée et persistée par `bilan.html`). Il n'existe pas non plus de fonction nommée `estimateWeeklyKcalTarget` où que ce soit dans le dépôt — le nom réel de l'équivalent est `computeKcalCible` (voir tableau ci-dessus).

Il n'existe **aucun registre central des règles actives** au sens de la spécification (fichier listant chaque règle avec un statut `enabled/disabled`) : désactiver une règle aujourd'hui signifie commenter ou supprimer du code directement dans le fichier concerné.

---

## 8. Risques de régression

- **Modifier `calcTargets()` dans `dashboard.html` sans répercuter dans les 3 autres copies** casse silencieusement la cohérence des objectifs affichés entre le tableau de bord, les recettes et le bilan hebdomadaire — aucun test ne le détecterait.
- **`regles-pathologies.js` est chargé par référence relative** (`<script src="regles-pathologies.js">`) sur plusieurs pages ; le commentaire en tête de fichier signale explicitement que le fichier doit être déployé au même niveau que les `.html` — un mauvais chemin lors d'un futur réarrangement de dossiers casserait silencieusement `containsGluten`, `filterRecipesForPathologies`, `glycemicBadge` sur toutes les pages qui en dépendent, sans erreur JS bloquante visible immédiatement (fonctions simplement `undefined`).
- **`journal` porte à la fois les valeurs calculées et les valeurs pour-100g** — toute modification du format d'insertion (`addEntry`) doit rester compatible avec l'historique déjà stocké, sous peine de fausser rétroactivement les agrégats (`calcScore`, `genAlerts`) sur les anciennes entrées.
- **Aucun test automatisé** signifie que toute modification des fonctions de calcul (section 3) ne peut être validée que manuellement — risque élevé de régression silencieuse sur les règles de sécurité (ex. `containsGluten`, alertes pathologie) à chaque étape future du pipeline.
- **Edge Functions absentes du dépôt** : toute étape qui toucherait au scan photo ou à un futur appel IA de formulation devra d'abord localiser et auditer ce code ailleurs (dashboard Supabase) — un agent qui modifierait uniquement les fichiers de ce dépôt aurait une vision incomplète du système.
- **Pas de registre de versions verrouillées** (`v0.1.0-audit`, etc. comme suggéré section 26 de la spécification) : aucun tag Git n'existe actuellement (`git tag` vide), seulement un historique de 52 commits sans convention de version visible.

---

## 9. Données potentiellement sensibles

Au sens de l'article 9 du RGPD (données de santé) et plus largement des données à caractère personnel sensibles :

- **Pathologies déclarées** (`profiles.pathologies`) — diabète, cholestérol, hypertension, maladies cardiaques, insuffisance rénale, obésité, ménopause. Une page `confidentialite.html` existe déjà et mentionne explicitement l'article 9 et un consentement séparé pour ces données — bonne pratique déjà en place, mais son contenu n'est pas généré depuis un inventaire réel (texte statique).
- **Champs de bilan hebdomadaire** liés à la santé : `troubles_digestifs`, `hta_symptomes`, `diabetes_fatigue`, `diabetes_envies_sucre`, `sommeil`, `niveau_energie`, `humeur_semaine` — données de santé/bien-être qualitatives.
- **Journal alimentaire complet** — peut, par recoupement (horaires, quantités, choix), révéler des informations sur l'état de santé, des troubles du comportement alimentaire ou des habitudes de vie.
- **Poids et historique de poids** (`poids_history`) — donnée sensible dans le contexte d'un objectif de perte de poids, en particulier croisée avec un profil « obesity » ou un ressenti « difficile » au bilan.
- **Consommation d'alcool** — détectée et quantifiée (`countAlcoholUnits`, alerte dès 3 verres) : donnée comportementale sensible.
- **Contenu des messages** (`messages.content`) — échanges patient/diététicien en texte libre, potentiellement très riches en informations de santé, stockés sans mention de chiffrement applicatif constatée dans ce code (dépend uniquement du chiffrement au repos de Supabase).
- **Photos de repas** — transmises à un service externe (Edge Function → probablement un modèle IA) ; contenu et conservation non auditables depuis ce dépôt (voir section 5).
- **Aucun mécanisme de suppression en libre-service constaté côté utilisateur** : la fonction `deleteUserData()` (`admin.html:433`) est réservée à l'admin et son propre commentaire indique que la suppression du compte d'authentification doit être faite « séparément via le dashboard Supabase Auth si besoin » — un vrai droit à l'effacement self-service, tel que promis dans `confidentialite.html` (« demander la suppression de votre compte et de vos données »), n'est pas visible dans le code applicatif actuel.
- **Clé Supabase anonyme et URL de projet en clair** dans chaque fichier HTML — usage standard pour une clé `anon`/`publishable` protégée par des policies RLS côté serveur (non auditables ici), mais cela signifie que la sécurité réelle des données dépend entièrement d'une configuration RLS invisible depuis ce dépôt.

---

## 10. Informations manquantes pour commencer l'étape suivante du pipeline

1. **Schéma Supabase complet** (colonnes exactes, types, contraintes, policies RLS) pour toutes les tables, en particulier `energy_checkins`, `photo_scan_logs`, `photo_corrections`, `poids_history` dont seules les colonnes effectivement lues/écrites par le code client ont pu être confirmées ici — une colonne peut exister côté base sans être utilisée dans ce dépôt, et inversement une policy RLS mal configurée ne serait pas détectable depuis le code client seul.
2. **Code des Supabase Edge Functions** (notamment `dynamic-endpoint` utilisée par le scan photo) — actuellement absent du dépôt, or c'est là que se joue potentiellement l'essentiel du traitement par IA externe (Gemini ou autre), avec des implications RGPD directes (transfert hors UE, conservation des photos).
3. **Confirmation de la base légale et de la durée de conservation** pour chaque catégorie de donnée sensible identifiée en section 9 — aucun élément dans le code ne permet de déduire une politique de rétention.
4. **Décision produit sur le périmètre de la phase d'observation** (section 5 de la spécification) : durée indicative 4–7 jours, mais aucun critère chiffré n'a encore été validé humainement pour ce projet précis (nombre de jours valides minimal, seuil de complétude).
5. **Confirmation qu'aucune Edge Function ou logique serveur supplémentaire** n'existe en dehors de celle observée dans `photo-ia.html`, avant de considérer ce dépôt comme la source complète de vérité pour les prochaines étapes.
6. **Validation humaine de ce document** — conformément au principe non négociable n°25 de la spécification, aucune étape suivante ne doit démarrer avant confirmation explicite que cette lecture correspond à la compréhension réelle du projet par l'équipe, et correction de tout élément inexact ou incomplet ci-dessus.

---

## Décision

- **Statut** : audit terminé, aucune ligne de code modifiée, aucun fichier créé hors `docs/AUDIT.md`.
- **Validation humaine attendue** : confirmer que cette lecture correspond à la compréhension réelle du projet, en particulier les corrections apportées en sections 3.1, 4 et 7 par rapport au document de référence fourni, et combler les informations manquantes listées en section 10.
- **Je n'implémente aucune étape suivante** tant que ce document n'est pas validé.
