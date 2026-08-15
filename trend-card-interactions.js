/* ──────────────────────────────────────────────────────────────────────
   trend-card-interactions.js — Câblage DOM générique pour une carte de
   tendance (bouton "Voir le détail" + modale <dialog>) — Cap Santé

   Étape A1 (extraction isolée). Généralise le câblage extrait de
   trend-card-component.html (qui bouclait sur DEMO_RESULTS codé en dur)
   en une fonction indépendante de toute donnée de démonstration et de
   toute page particulière — trend-card-component.html reste la référence
   stable pendant cette étape et n'est pas modifié.

   Ce fichier ne contient :
   - aucun accès Supabase, aucun accès réseau ;
   - aucune dépendance à DEMO_RESULTS ni à un id de page précis ;
   - aucun calcul métier, aucun texte, aucune donnée de tendance — il ne
     fait que relier un bouton déjà rendu à une modale déjà rendue
     (toutes deux produites par trend-card-render.js, mais ce fichier ne
     dépend pas non plus de trend-card-render.js : il agit uniquement sur
     des éléments DOM déjà existants, quel que soit ce qui les a créés).
   ────────────────────────────────────────────────────────────────────── */

/* -----------------------------------------------------------------------
   wireTrendDialog(buttonEl, dialogEl)

   Relie un bouton "Voir le détail" à sa modale <dialog> :
   - clic sur le bouton -> showModal() + focus sur le bouton de fermeture ;
   - clic sur le bouton de fermeture (élément portant l'attribut
     data-dialog-close, recherché DANS dialogEl) -> close() ;
   - clic sur le fond (le <dialog> lui-même, hors de sa boîte de contenu)
     -> close(), en plus du bouton visible et de la touche Échap (native,
     gérée par <dialog> lui-même sans code supplémentaire) ;
   - fermeture de la modale (quelle qu'en soit la cause) -> le focus
     revient sur buttonEl, l'élément déclencheur d'origine.

   Ne fait rien si buttonEl, dialogEl, ou le bouton de fermeture interne
   sont absents — pas d'exception levée, pour rester robuste à un
   appelant qui n'aurait pas encore inséré ces éléments dans le DOM.
   ----------------------------------------------------------------------- */
function wireTrendDialog(buttonEl, dialogEl) {
  if (!buttonEl || !dialogEl) return;
  var closeEl = dialogEl.querySelector('[data-dialog-close]');
  if (!closeEl) return;

  buttonEl.addEventListener('click', function () {
    dialogEl.showModal();
    closeEl.focus();
  });

  closeEl.addEventListener('click', function () {
    dialogEl.close();
  });

  dialogEl.addEventListener('click', function (ev) {
    if (ev.target === dialogEl) dialogEl.close();
  });

  dialogEl.addEventListener('close', function () {
    buttonEl.focus();
  });
}

/* -----------------------------------------------------------------------
   wireTrendDialogs(pairs)

   Confort pour câbler plusieurs paires {buttonEl, dialogEl} en un seul
   appel — n'ajoute aucune logique par rapport à des appels répétés de
   wireTrendDialog(), simple raccourci pour l'appelant.
   ----------------------------------------------------------------------- */
function wireTrendDialogs(pairs) {
  (pairs || []).forEach(function (p) {
    wireTrendDialog(p.buttonEl, p.dialogEl);
  });
}
