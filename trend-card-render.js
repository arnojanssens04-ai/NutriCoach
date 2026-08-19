/* ──────────────────────────────────────────────────────────────────────
   trend-card-render.js — Fonctions PURES de rendu HTML pour la carte de
   tendance — Cap Santé

   Étape A1 (extraction isolée). Fonctions extraites telles quelles de
   trend-card-component.html (aucune logique nouvelle, aucune fonction
   renommée, aucun comportement modifié) — trend-card-component.html reste
   la référence stable pendant cette étape et n'est pas modifié.

   Ce fichier ne contient :
   - aucun accès Supabase, aucun accès réseau (aucun sb., aucun supabase,
     aucun fetch(), aucun XMLHttpRequest) ;
   - aucun accès au DOM global de la page (pas de document.getElementById,
     pas de document.querySelector, pas de window.*) — la seule mention de
     `document` est dans escHtml(), qui crée un élément DÉTACHÉ
     (document.createElement('div')) pour échapper une chaîne, ne lit et
     n'écrit jamais dans le DOM affiché ;
   - aucun calcul métier (fenêtre, occurrence, confiance — tout cela reste
     dans trend-engine.js, lu ici uniquement via l'objet TrendCardResult
     déjà calculé et passé en paramètre) ;
   - aucune lecture de conseils.html ni référence à PATTERN_REGISTRY ;
   - aucun diagnostic, aucun conseil, aucune recommandation — uniquement
     les textes neutres déjà validés (ou leurs replis strictement
     factuels quand l'appelant ne fournit pas de message).

   Chaque fonction est pure : mêmes entrées => même chaîne HTML en sortie,
   aucun effet de bord, aucune mutation de l'objet TrendCardResult reçu.
   ────────────────────────────────────────────────────────────────────── */

function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function formatDateFr(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  var parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

var CONFIDENCE_LABELS = {
  high: 'Haute',
  moderate: 'Modérée',
  low: 'Basse',
  unknown: 'Non déterminée'
};

/* -----------------------------------------------------------------------
   Repère visuel par état — émoji + libellé de tag. L'émoji est TOUJOURS
   accompagné du libellé texte (jamais seul porteur d'information), et
   marqué aria-hidden pour ne pas être lu deux fois par un lecteur d'écran
   (le libellé textuel suffit).
   ----------------------------------------------------------------------- */
var STATE_META = {
  present: { emoji: '📊', tag: 'Observation présente' },
  absent: { emoji: '✅', tag: 'Observation absente' },
  insufficient: { emoji: '❔', tag: 'Données insuffisantes' },
  not_evaluated: { emoji: '⏳', tag: 'Non évaluée' },
  error: { emoji: '⚠️', tag: 'Erreur' }
};
function stateMetaFor(state) {
  return STATE_META[state] || STATE_META.not_evaluated;
}

/* -----------------------------------------------------------------------
   Textes de repli STRICTEMENT NEUTRES — utilisés seulement si l'appelant
   ne fournit pas observationMessage / insufficientDataMessage. Jamais de
   jugement, jamais de vocabulaire culpabilisant, uniquement des faits.
   ----------------------------------------------------------------------- */
function fallbackPresentText(r) {
  return 'Sur les ' + r.evaluatedDays + ' jour' + (r.evaluatedDays > 1 ? 's' : '') + ' évalué' + (r.evaluatedDays > 1 ? 's' : '')
    + ', ' + r.occurrenceDays + ' présente' + (r.occurrenceDays > 1 ? 'nt' : '') + ' cette observation.';
}
function fallbackAbsentText(r) {
  return 'Sur les ' + r.evaluatedDays + ' jour' + (r.evaluatedDays > 1 ? 's' : '') + ' évalué' + (r.evaluatedDays > 1 ? 's' : '')
    + ', cette observation n\'a pas été identifiée.';
}
function fallbackInsufficientText(r) {
  var n = (r.insufficientDays || []).length;
  return 'Les données disponibles ne permettent pas d\'évaluer cette observation pour la période analysée'
    + (n > 0 ? ' (' + n + ' jour' + (n > 1 ? 's' : '') + ' concerné' + (n > 1 ? 's' : '') + ')' : '') + '.';
}

/* -----------------------------------------------------------------------
   Phrase courte pour la CARTE COMPACTE — un seul texte par état, jamais
   de nom technique de propriété, jamais de liste de compteurs.
   ----------------------------------------------------------------------- */
function compactDescriptionFor(r) {
  if (r.state === 'present') return r.observationMessage || fallbackPresentText(r);
  if (r.state === 'absent') return r.observationMessage || fallbackAbsentText(r);
  if (r.state === 'insufficient') return 'Données insuffisantes pour observer cette tendance sur la période.';
  if (r.state === 'not_evaluated') return 'Cette observation n\'est pas active pour le moment.';
  return 'Cette observation ne peut pas être affichée pour le moment.';
}

/* -----------------------------------------------------------------------
   Une seule métrique principale (ou aucune) pour la carte compacte.
   ----------------------------------------------------------------------- */
function compactMetricHtml(r) {
  if (r.state === 'present') {
    return '<div class="tc-metric"><span class="tc-metric-val">' + Math.round((r.occurrenceRate || 0) * 100) + ' %</span><span class="tc-metric-lbl">des jours évalués</span></div>';
  }
  if (r.state === 'absent') {
    return '<div class="tc-metric-none">Aucune occurrence sur la période</div>';
  }
  return '<div class="tc-metric-none">Pas de métrique disponible</div>';
}

function periodSummary(r) {
  return r.calendarDays + ' derniers jours';
}

/* -----------------------------------------------------------------------
   Rendu de la carte compacte — titre, phrase courte, une métrique max,
   période résumée, bouton d'ouverture de la modale.
   ----------------------------------------------------------------------- */
function renderCompactCard(r, dialogId, buttonId) {
  var meta = stateMetaFor(r.state);
  return '<div class="trend-card-compact state-' + r.state + '">'
    + '<div class="tc-state-tag"><span class="emoji" aria-hidden="true">' + meta.emoji + '</span><span>' + escHtml(meta.tag) + '</span></div>'
    + '<div class="tc-title">' + escHtml(r.label || '') + '</div>'
    + '<div class="tc-desc">' + escHtml(compactDescriptionFor(r)) + '</div>'
    + compactMetricHtml(r)
    + '<div class="tc-period">' + escHtml(periodSummary(r)) + '</div>'
    + '<button type="button" class="tc-detail-btn" id="' + buttonId + '" data-dialog-target="' + dialogId + '">Voir le détail</button>'
    + '</div>';
}

/* -----------------------------------------------------------------------
   Détails des jours exclus — utilisé dans la modale uniquement.
   ----------------------------------------------------------------------- */
function renderExclusionsDetails(insufficientDays) {
  var days = insufficientDays || [];
  if (days.length === 0) {
    return '<details class="day-details">'
      + '<summary><span>Jours exclus du calcul</span><span class="chev" aria-hidden="true">&rsaquo;</span></summary>'
      + '<div class="no-exclusions">Aucun jour exclu sur la période analysée.</div>'
      + '</details>';
  }
  var rows = days.map(function (d) {
    return '<div class="excluded-day-row">'
      + '<span class="excluded-day-date">' + escHtml(formatDateFr(d.date)) + '</span>'
      + '<span>' + escHtml(d.reason) + '</span>'
      + '</div>';
  }).join('');
  var n = days.length;
  return '<details class="day-details">'
    + '<summary><span>' + n + ' jour' + (n > 1 ? 's' : '') + ' exclu' + (n > 1 ? 's' : '') + ' du calcul</span><span class="chev" aria-hidden="true">&rsaquo;</span></summary>'
    + rows
    + '</details>';
}

/* -----------------------------------------------------------------------
   Contenu de la modale, par état. Chaque section demandée est présente :
   titre, période, "ce qui a été observé", données disponibles, métrique
   principale, confiance, limites, statut, jours exclus — sauf pour
   not_evaluated / error où seul un texte générique a du sens.
   ----------------------------------------------------------------------- */
function renderDialogBody(r) {
  var period = 'Période observée : ' + formatDateFr(r.windowStart) + ' au ' + formatDateFr(r.windowEnd)
    + ' (' + r.calendarDays + ' jours)';

  if (r.state === 'present' || r.state === 'absent') {
    var text = r.observationMessage || (r.state === 'present' ? fallbackPresentText(r) : fallbackAbsentText(r));
    var metricsSection = r.state === 'present'
      ? '<div class="td-section"><div class="td-section-lbl">Métrique principale</div>'
        + '<div class="td-metric-row">'
        + '<div class="td-metric-box"><div class="td-metric-val">' + r.occurrenceDays + ' / ' + r.evaluatedDays + '</div><div class="td-metric-lbl">jours avec observation</div></div>'
        + '<div class="td-metric-box"><div class="td-metric-val">' + Math.round((r.occurrenceRate || 0) * 100) + ' %</div><div class="td-metric-lbl">taux d\'occurrence</div></div>'
        + '</div></div>'
        + '<div class="td-section"><div class="td-section-lbl">Confiance du calcul</div><div class="td-datarow">' + (CONFIDENCE_LABELS[r.confidence] || CONFIDENCE_LABELS.unknown) + '</div></div>'
      : '';
    return period
      + '<div class="td-section"><div class="td-section-lbl">Ce qui a été observé</div>'
      + '<div class="td-observation tone-' + r.state + '"><div class="td-observation-text">' + escHtml(text) + '</div></div></div>'
      + '<div class="td-section"><div class="td-section-lbl">Données disponibles</div>'
      + '<div class="td-datarow">' + r.analyzableDays + ' jours analysables sur ' + r.calendarDays + ' jours calendaires (' + Math.round((r.coverageRate || 0) * 100) + ' % de couverture).</div></div>'
      + metricsSection
      + '<div class="td-section"><div class="td-section-lbl">Limites</div><ul class="td-limits-list">'
      + '<li>Cette observation ne mesure pas la quantité concernée.</li>'
      + '<li>Elle ne mesure pas la fréquence au cours d\'une même journée.</li>'
      + '<li>Elle n\'établit aucun lien avec un symptôme ou une pathologie.</li>'
      + '</ul></div>'
      + renderStatusAndExclusions(r);
  }

  if (r.state === 'insufficient') {
    var insuffText = r.insufficientDataMessage || fallbackInsufficientText(r);
    return period
      + '<div class="td-section"><div class="td-section-lbl">Ce qui a été observé</div>'
      + '<div class="td-observation tone-insufficient"><div class="td-observation-text">' + escHtml(insuffText) + '</div></div></div>'
      + '<div class="td-section"><div class="td-section-lbl">Données disponibles</div>'
      + '<div class="td-datarow">' + r.analyzableDays + ' jours analysables sur ' + r.calendarDays + ' jours calendaires (' + Math.round((r.coverageRate || 0) * 100) + ' % de couverture).</div></div>'
      + '<div class="td-section"><div class="td-section-lbl">Limites</div><p class="td-datarow">Cette observation dépend de la qualité des données saisies et ne peut pas être calculée de façon fiable ici.</p></div>'
      + renderStatusAndExclusions(r);
  }

  if (r.state === 'not_evaluated') {
    return period
      + '<div class="td-section"><p class="td-plain">Cette observation n\'est pas active pour le moment. Aucun résultat n\'est disponible.</p></div>';
  }

  // error
  return period
    + '<div class="td-section"><div class="td-observation tone-error"><div class="td-observation-text">Cette observation ne peut pas être affichée pour le moment.</div></div></div>';
}

function renderStatusAndExclusions(r) {
  var statusText = r.isConfirmed
    ? 'Observation confirmée par un professionnel'
    : 'Observation non validée par un professionnel';
  return '<div class="td-section"><div class="td-status"><span class="dot" aria-hidden="true"></span><span>' + escHtml(statusText) + '</span></div></div>'
    + '<div class="td-section">' + renderExclusionsDetails(r.insufficientDays) + '</div>';
}

/* -----------------------------------------------------------------------
   Rendu d'une modale <dialog> complète pour une tendance.
   ----------------------------------------------------------------------- */
function renderDialog(r, dialogId, titleId) {
  var meta = stateMetaFor(r.state);
  return '<dialog class="trend-dialog state-' + r.state + '" id="' + dialogId + '" aria-labelledby="' + titleId + '">'
    + '<div class="td-inner">'
    + '<div class="td-hdr">'
    + '<div class="td-title-wrap">'
    + '<div class="td-state-tag"><span class="emoji" aria-hidden="true">' + meta.emoji + '</span><span>' + escHtml(meta.tag) + '</span></div>'
    + '<div class="td-title" id="' + titleId + '">' + escHtml(r.label || '') + '</div>'
    + '<div class="td-period">' + periodSummary(r) + '</div>'
    + '</div>'
    + '<button type="button" class="td-close" data-dialog-close aria-label="Fermer">&times;</button>'
    + '</div>'
    + '<div class="td-body">' + renderDialogBody(r) + '</div>'
    + '</div>'
    + '</dialog>';
}
