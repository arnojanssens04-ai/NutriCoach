# Questions de gouvernance — moteur de conseils nutritionnels (nutrition-*.js)

Ce document reconstitue les questions bloquantes identifiées avant toute
connexion du moteur `nutrition-*.js` (actuellement confiné à
`nutrition-simulator-admin.html`, profils fictifs uniquement) à un vrai
patient. Il n'a pas de valeur juridique — c'est une base de travail pour
trancher les décisions produit, à valider si besoin par un professionnel
qualifié (DPO / avocat spécialisé santé numérique) sur les points RGPD/MDR.

Statut : **Phase 0 — bloquante**. Rien de ce moteur n'est montré à un
patient réel tant que ces points ne sont pas explicitement tranchés.

---

## 1. Qualification "dispositif médical" (Règlement UE 2017/745, MDR)

**La question** : un logiciel qui analyse un journal alimentaire et
génère un conseil personnalisé ("mangez moins de X, plus de Y") peut, selon
la manière dont il est présenté, entrer dans la définition d'un dispositif
médical logiciel (SaMD) s'il vise un but médical (diagnostic, prévention,
surveillance d'une pathologie).

**Ce qui penche pour "hors MDR"** : le moteur actuel ne diagnostique rien,
ne traite aucune pathologie, formule des observations statistiques
descriptives ("apport en calcium inférieur à une référence générique") et
renvoie systématiquement vers "en discuter avec un professionnel" plutôt
que de prescrire.

**Ce qui penche vers "possible SaMD"** : le moteur croise déjà le contexte
clinique du profil (`hasConflictingClinicalContext`) et pourrait, si son
usage évolue, être perçu comme visant une "prévention ou surveillance"
d'une maladie plutôt qu'un simple bien-être général.

**Décision à prendre** : le produit reste-t-il positionné comme "coaching
nutritionnel bien-être", strictement hors du champ pathologie/diagnostic ?
Si oui, quelles garde-fous produits (texte affiché, périmètre des règles
actives) le garantissent concrètement ?

> **DÉCISION (2026-08-19)** : le moteur pourra un jour adapter ses
> conseils selon les pathologies déclarées (diabète, cholestérol, etc.),
> pas seulement rester un coaching bien-être générique. **Conséquence
> directe** : le risque de qualification en dispositif médical logiciel
> (SaMD) devient réel, pas seulement théorique. Ce point ne peut PAS être
> tranché uniquement par une analyse technique — un avis juridique formel
> sur la qualification MDR est nécessaire **avant toute connexion réelle
> à un patient** (le travail de préparation dans le simulateur confiné
> peut continuer, mais la mise en production reste bloquée par ce point).

## 2. Article 22 RGPD — décision individuelle automatisée

**La question** : l'article 22 encadre les décisions "fondées
exclusivement sur un traitement automatisé" produisant des "effets
juridiques" ou l'affectant "de manière significative". Un conseil
alimentaire seul n'est probablement pas une "décision" au sens strict,
mais le seuil est flou dès qu'il influence des choix de santé.

**Ce qui existe déjà côté garde-fou** : le moteur ne produit jamais un
résultat qu'un patient verrait sans validation humaine intermédiaire (à ce
stade, aucun patient ne le voit du tout) ; chaque carte renvoie vers "en
discuter avec un professionnel" plutôt que d'agir seule.

**Décision à prendre** : si/quand une carte est un jour montrée à un
patient, un humain (l'équipe Cap Santé) doit-il systématiquement valider
chaque carte avant affichage (comme on l'a fait pour l'ajustement kcal en
mode admin), ou seulement en assurer la supervision a posteriori (audit,
possibilité de retrait) ? Le mécanisme d'approbation admin construit pour
les calories (bilan_recap.html) est un précédent direct réutilisable ici.

> **DÉCISION (2026-08-19)** : génération et affichage 100% automatiques,
> propres à chaque patient (le moteur prend déjà `journalEntries` +
> `profile` d'un seul patient en entrée — jamais un conseil partagé entre
> patients). Aucune validation admin avant affichage. L'admin
> n'intervient que si le patient demande explicitement à en discuter
> davantage. **Conséquence** : c'est le scénario qui se rapproche le plus
> de l'art. 22 RGPD (décision automatisée sans validation humaine
> préalable). Deux garanties deviennent alors nécessaires : (1) un droit
> clair et accessible pour le patient de contester ou demander une
> intervention humaine — déjà prévu via "en discuter avec l'admin" ; (2)
> documenter cette logique explicitement dans les CGU avant mise en
> production réelle.

> **DÉCISION RÉVISÉE (2026-08-19, après retour du juriste)** : la
> décision ci-dessus est remplacée. Le juriste recommande un workflow de
> revue humaine RÉELLE avant tout affichage patient pour les règles
> liées à une pathologie, un symptôme ou un contexte médical :
>
> ```
> données patient → observation → proposition générée
>   → revue par un professionnel autorisé
>   → modification ou rejet éventuel → validation → affichage au patient
> ```
>
> Point clé : cette revue ne doit pas être un bouton "Approuver"
> mécanique — le réviseur doit pouvoir consulter l'observation complète
> (période, couverture du journal), les allergies/intolérances
> (confirmées et non vérifiées), comprendre la règle utilisée, modifier
> le texte ou les aliments proposés, rejeter, ou demander des
> informations complémentaires. Une approbation sans ce contexte peut
> être vue comme une intervention fictive plutôt que réelle — donc sans
> effet protecteur vis-à-vis de l'art. 22 RGPD.
>
> Rôles distincts recommandés par le juriste (admin technique / diététicien
> autorisé / professionnel référent / superviseur clinique / patient) —
> **non implémentés tels quels pour l'instant** : l'application n'a
> aujourd'hui qu'un seul rôle admin (`profiles.role`), pas de distinction
> diététicien/superviseur. Cette distinction de rôles reste une évolution
> future, pas un prérequis immédiat — mais le principe "un admin
> technique ne valide pas une recommandation liée à une pathologie
> simplement parce qu'il a un accès admin" est noté comme garde-fou à
> construire quand cette distinction de rôles existera.
>
> **Effet MDR rappelé par le juriste** : la revue humaine réduit le
> risque opérationnel et peut soutenir l'argument "pas une décision
> exclusivement automatisée" (art. 22), mais ne retire PAS
> automatiquement la qualification MDR — celle-ci dépend de la
> destination du logiciel, pas de la présence d'une supervision. Voir
> `docs/MDR_QUALIFICATION_BRIEF.md`.
>
> **Étape concrète retenue pour cette session** : construire, dans le
> simulateur admin confiné (jamais connecté à un patient réel), un
> panneau de revue qui donne à l'admin le contexte complet nécessaire
> pour comprendre *pourquoi* un conseil est proposé (observation, seuils
> franchis, aliments détectés, alternatives sélectionnées, garde-fous
> déclenchés) avant toute action d'approbation/rejet — pas encore les
> statuts de workflow complets (`pending_professional_review`, etc.) ni
> la distinction de rôles, qui restent des évolutions futures à
> construire quand la connexion réelle sera autorisée.

## 3. Chaîne de responsabilité professionnelle

**La question** : en cas de conseil inadapté (ex. suggestion incompatible
avec une pathologie non déclarée, ou déclarée mais mal cartographiée), qui
porte la responsabilité — l'éditeur du logiciel, l'équipe Cap Santé qui
valide, ou le patient qui applique le conseil sans consulter un
professionnel ?

**Ce qui existe déjà côté garde-fou** : filtrage sécurité prioritaire et
bloquant (`nutrition-safety.js`) sur allergies/intolérances confirmées OU
non vérifiées, blocage sur conflit clinique cartographié, formulation
systématiquement au conditionnel avec renvoi vers un professionnel,
traçabilité complète (`nutrition-audit.js`) de chaque décision.

**Décision à prendre** : ces garde-fous suffisent-ils pour limiter la
responsabilité à "outil d'aide à la décision, jamais prescriptif", ou
faut-il un texte contractuel explicite (CGU) le formalisant avant toute
mise en production, même en shadow mode réel ?

## 4. Politique de rétention des données d'audit

**La question** : aujourd'hui, `nutrition-audit.js` ne persiste rien
(mémoire du processus de simulation uniquement — aucune table Supabase
pour ce moteur). Le jour où une décision (proposée ou approuvée) doit
être tracée pour un vrai patient, combien de temps ces traces
doivent-elles être conservées, et sous quelle base légale ?

**Décision à prendre** : durée de rétention des enregistrements d'audit
(ex. alignée sur la durée de conservation du dossier patient existant ?),
et qui y a accès (admin uniquement, comme le reste du moteur ?).

---

## Points complémentaires soulevés lors de cette session

## 5. Consentement spécifique pour les données alimentaires "sensibles"

Le consentement santé existant (`toggleHealthConsent()` dans
dashboard.html) couvre déjà les pathologies déclarées. La question posée
aujourd'hui : faut-il un **consentement distinct et spécifique** pour que
le journal alimentaire soit exploité par ce moteur de conseils (au-delà
de son usage actuel purement descriptif dans le dashboard) ?

**Recommandation technique** (à valider) : oui, distinct — parce que la
finalité change (observation passive du journal vs. génération d'un
conseil personnalisé exploitant potentiellement des inférences sur des
habitudes ou une pathologie). Un consentement générique "je consens à
l'usage de mes données de santé" ne couvre pas clairement cette finalité
précise (principe de finalité déterminée, RGPD art. 5).

> **DÉCISION (2026-08-19)** : case de consentement distincte, séparée du
> consentement santé existant (`toggleHealthConsent()`). D'autant plus
> nécessaire que la génération est désormais automatique et sans
> validation admin préalable (voir point 2) — le patient doit savoir
> explicitement à quoi il consent avant que le moteur n'exploite son
> journal à cette fin précise.

## 6. Portée de l'engagement pris par l'équipe si une carte est validée

Si un admin "valide" une carte avant affichage (mécanisme proposé au
point 2), cela crée-t-il une obligation de suivi (ex. si le patient suit
le conseil et que son état se dégrade) ? Comparer avec le mécanisme
d'approbation kcal déjà en place, où l'admin valide un ajustement après
consultation du bilan.

## 7. Traitement des mineurs et grossesse/allaitement

Déjà bloqué techniquement (`isProfileEligibleForAutomatedAdvice` refuse
mineurs et grossesse/allaitement). Question ouverte : ce blocage
technique suffit-il, ou faut-il documenter explicitement cette exclusion
dans les CGU comme périmètre du service ?

## 8. Droit à l'explication / accès à la logique

Si un patient demande "pourquoi ce conseil m'a été montré", l'audit
actuel (`nutrition-audit.js`) contient déjà tout le nécessaire
(observationSnapshot, blockReason, selectedFoodCodes, flaggedFoodNames).
Question : ce niveau de détail doit-il être exposable au patient
lui-même, ou seulement à l'équipe Cap Santé sur demande ?

---

## Analyse externe reçue le 2026-08-19 — consentement par finalité

L'utilisateur a transmis une analyse externe (source non précisée dans
cette session — traitée comme une contribution à évaluer, pas comme un
avis juridique formellement engagé pour ce projet) recommandant une
architecture de consentement structurée par finalité plutôt qu'une case
générique unique, avec le principe suivant : *"le consentement ne
transforme pas une collecte illimitée en collecte conforme"* — le RGPD
exige des finalités précises, une minimisation documentée, et des
consentements distincts, prouvables, aussi faciles à retirer qu'à donner.

Cette analyse recommandait aussi une distinction entre automatisations à
faible risque (résumé du journal, détection d'habitudes) et
automatisations sensibles (adaptation à une pathologie, filtrage selon
une allergie) nécessitant chacune une DPIA, une analyse art. 22, une
procédure d'intervention humaine et une revue MDR séparée si la finalité
devient médicale — cohérent avec les décisions déjà prises aux points 1
et 2 ci-dessus.

> **DÉCISION (2026-08-19)** : plutôt que le schéma générique à 8 blocs
> proposé (qui inclut des finalités — sport, stress, confiance, budget —
> dont les données ne sont pas toutes collectées aujourd'hui par
> l'application réelle), architecture pragmatique retenue, alignée sur
> les données réellement présentes dans `profiles` :
> 1. **Consentement santé** (existant, `toggleHealthConsent()`) —
>    inchangé, personnalise déjà les objectifs kcal/macros.
> 2. **`consent_nutrition_advice`** (finalité générale) — analyse du
>    journal pour des suggestions non liées aux pathologies (sources de
>    nutriments, alternatives aux aliments ultra-transformés).
> 3. **`consent_nutrition_advice_pathology`** (nouveau, finalité
>    sensible séparée) — adaptation de ces conseils aux pathologies
>    déclarées. Distinct du consentement santé existant car la finalité
>    change (personnalisation kcal/macros vs. moteur de conseils
>    automatisé) — c'est précisément l'automatisation classée "sensible"
>    par l'analyse externe.
> 4. **`consent_nutrition_advice_sport`** (nouveau) — adaptation de ces
>    conseils à l'activité sportive déclarée (`activite`,
>    `activite_met_kcal`, déjà collectées pour le calcul kcal — aucune
>    nouvelle donnée collectée, seulement une nouvelle finalité
>    consentie).
>
> **Exclu explicitement** : aucune adaptation des conseils selon les
> horaires de repas — ni collecte dédiée à cette fin, ni logique dans le
> moteur ne doit s'appuyer sur l'heure des prises alimentaires pour
> personnaliser quoi que ce soit (vérifié : `nutrition-*.js` ne référence
> aucun champ horaire à ce jour).
>
> **Non retenu pour l'instant** : consentements pour stress/confiance/
> budget/temps — ces données ne sont pas collectées par l'application
> réelle ; construire un consentement pour une donnée non recueillie
> serait prématuré et source de confusion. À réévaluer si ces données
> sont un jour effectivement ajoutées au profil patient.
>
> Rappel : cette analyse externe, comme la mienne, reste une contribution
> à évaluer — la détermination formelle de la base légale (art. 6), de
> l'exception applicable pour les données de santé (art. 9), et du rôle
> exact de l'éditeur vs. d'un éventuel professionnel de santé impliqué,
> reste à faire trancher par un DPO/avocat qualifié avant toute
> production réelle.
