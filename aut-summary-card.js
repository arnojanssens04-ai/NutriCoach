/* ──────────────────────────────────────────────────────────────────────
   aut-summary-card.js — Carte de synthèse "Aliments ultra-transformés"

   JS vanilla pur, CSS pur injecté (ZÉRO dépendance externe : pas de
   Tailwind, pas de CDN). Le CSS est entièrement scopé sous .aut-card
   avec un reset local (box-sizing, etc.) et des couleurs codées en dur
   -- s'affiche correctement même seul dans une page vierge, sans
   dépendre des variables CSS du reste de l'app.

   renderAUTCard(data, callbacks) retourne un vrai élément DOM prêt à
   insérer où vous voulez. Toute l'interactivité utilise addEventListener
   (jamais d'attribut onclick inline) et des callbacks fournis par
   l'appelant -- ce fichier ne connaît rien de Supabase, du journal ou de
   la navigation : c'est à l'appelant de décider ce qui se passe
   réellement quand on clique (écrire au journal, ouvrir le chat
   support...).

   Usage :
     var card = renderAUTCard(data, {
       onApplyRecommendation: function(recId){ ... },
       onViewRecipe: function(recId){ ... },
       onContactSupport: function(){ ... },
       onDismiss: function(){ ... },
       onClose: function(){ ... }
     });
     document.body.appendChild(card);
   ────────────────────────────────────────────────────────────────────── */

var AUT_SUMMARY_DEMO_DATA = {
  periodLabel: '18 août – 24 août 2026',
  completion: { days: 6, total: 7 },
  autShare: 32,
  brutShare: 68,
  totalOccurrences: 15,
  topImpact: { label: 'Petit-déjeuner', detail: '7× granolas industriels' },
  recommendations: [
    { id: 'breakfast', icon: '🥣', title: 'Petit-déjeuner', subtitle: 'Granola & muesli industriels — 7×',
      alternative: "Flocons d'avoine, oléagineux & filet de miel" },
    { id: 'quickmeals', icon: '🍟', title: 'Repas rapides & fritures', subtitle: 'Frites, nuggets, tenders — 7×',
      alternative: 'Aiguillettes de poulet grillées & patates douces au four' }
  ],
  groups: [
    { label: 'Petit-déjeuner', items: [
      { name: 'Granola croustillant aux céréales', count: 5 },
      { name: 'Granola au chocolat', count: 1 },
      { name: 'Muesli croustillant au chocolat', count: 1 }
    ]},
    { label: 'Plats & panés', items: [
      { name: 'Tenders de poulet panés (céréales cuites)', count: 1 },
      { name: 'Aiguillettes de poulet panées aux corn flakes', count: 1 },
      { name: 'Nuggets de poulet panés aux céréales', count: 1 },
      { name: 'Croquettes de fromage panées', count: 1 }
    ]},
    { label: 'Accompagnements', items: [
      { name: 'Frites cuites au four', count: 2 },
      { name: 'Pizza aux légumes (part)', count: 1 },
      { name: 'Sauce soja / huile sésame', count: 1 }
    ]}
  ]
};

// ── Style injecté une seule fois, entièrement scopé sous .aut-card ──
var AUT_SUMMARY_STYLE_ID = 'aut-summary-card-style';
function ensureAUTSummaryStyle(){
  if(document.getElementById(AUT_SUMMARY_STYLE_ID)) return;
  var style = document.createElement('style');
  style.id = AUT_SUMMARY_STYLE_ID;
  style.textContent = [
    /* Reset local -- n'affecte rien en dehors de .aut-card */
    '.aut-card, .aut-card *{ box-sizing:border-box; }',
    '.aut-card{ font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:#334155;',
    'background:#ffffff; border:1px solid #e2e8f0; border-radius:16px;',
    'box-shadow:0 4px 20px rgba(0,0,0,0.04); max-width:560px; overflow:hidden; line-height:1.5; }',

    '.aut-hdr{ padding:20px 24px 18px; border-bottom:1px solid #e2e8f0;',
    'display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }',
    '.aut-hdr-ttl{ font-size:1.02rem; font-weight:600; color:#0f172a; margin:0 0 7px;',
    'display:flex; align-items:center; gap:8px; }',
    '.aut-hdr-meta{ display:flex; flex-wrap:wrap; gap:8px; font-size:.78rem; color:#64748b; font-weight:500; }',
    '.aut-badge{ display:inline-flex; align-items:center; gap:5px; background:#f8fafc;',
    'border:1px solid #e2e8f0; border-radius:999px; padding:3px 10px; font-weight:500; }',
    '.aut-close{ flex-shrink:0; width:28px; height:28px; border-radius:999px; border:1px solid #e2e8f0;',
    'background:#f8fafc; color:#64748b; cursor:pointer; font-size:.85rem; line-height:1;',
    'display:flex; align-items:center; justify-content:center; padding:0; }',
    '.aut-close:hover{ background:#f1f5f9; }',

    '.aut-section{ padding:20px 24px; border-bottom:1px solid #e2e8f0; }',
    '.aut-section-lbl{ display:flex; align-items:center; gap:6px; font-size:.68rem; font-weight:600;',
    'letter-spacing:.05em; text-transform:uppercase; color:#64748b; }',

    '.aut-gauge-row{ display:flex; gap:20px; align-items:center; flex-wrap:wrap; }',
    '.aut-gauge{ flex:1 1 200px; min-width:180px; }',
    '.aut-gauge-bar{ display:flex; height:26px; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; }',
    '.aut-gauge-seg{ display:flex; align-items:center; justify-content:center; color:#ffffff;',
    'font-size:.68rem; font-weight:600; }',
    '.aut-gauge-seg.aut{ background:#ea580c; }',
    '.aut-gauge-seg.brut{ background:#059669; }',
    '.aut-gauge-legend{ display:flex; gap:16px; margin-top:9px; font-size:.75rem; color:#64748b; }',
    '.aut-gauge-legend span{ display:flex; align-items:center; gap:6px; }',
    '.aut-dot{ width:7px; height:7px; border-radius:999px; display:inline-block; }',
    '.aut-dot.aut{ background:#ea580c; }',
    '.aut-dot.brut{ background:#059669; }',
    '.aut-stat{ flex:0 0 auto; border-left:1px solid #e2e8f0; padding-left:20px; }',
    '.aut-stat-num{ font-size:1.3rem; font-weight:600; color:#0f172a; line-height:1; display:block; }',
    '.aut-stat-lbl{ font-size:.72rem; color:#64748b; }',
    '.aut-stat-impact{ font-size:.75rem; color:#64748b; margin-top:7px; display:block; }',
    '.aut-stat-impact strong{ color:#334155; font-weight:600; }',

    '.aut-rec-list{ display:flex; flex-direction:column; gap:12px; margin-top:14px; }',
    '.aut-rec-card{ background:#f0fdf4; border:1px solid #dcfce7; border-radius:12px;',
    'padding:14px; display:flex; flex-direction:column; gap:10px; }',
    '.aut-rec-head{ display:flex; gap:9px; align-items:flex-start; }',
    '.aut-rec-title{ font-weight:600; font-size:.87rem; color:#0f172a; }',
    '.aut-rec-sub{ font-size:.77rem; color:#64748b; margin-top:2px; }',
    '.aut-rec-alt{ font-size:.79rem; color:#334155; background:#ffffff; border:1px solid #dcfce7;',
    'border-radius:8px; padding:9px 11px; display:flex; gap:6px; }',
    '.aut-rec-actions{ display:flex; gap:8px; }',
    '.aut-btn{ flex:1; padding:8px 14px; border-radius:8px; border:none; font-weight:500; font-size:.81rem;',
    'cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;',
    'font-family:inherit; line-height:1.2; transition:opacity .15s ease, background .15s ease; }',
    '.aut-btn-primary{ background:#059669; color:#ffffff; }',
    '.aut-btn-primary:hover{ opacity:.9; }',
    '.aut-btn-primary[disabled]{ background:#dcfce7; color:#059669; opacity:1; cursor:default; }',
    '.aut-btn-outline{ background:#ffffff; border:1px solid #e2e8f0; color:#334155; }',
    '.aut-btn-outline:hover{ background:#f8fafc; }',

    '.aut-details{ }',
    '.aut-details > summary{ list-style:none; padding:16px 24px; cursor:pointer;',
    'display:flex; align-items:center; justify-content:space-between; gap:10px; }',
    '.aut-details > summary::-webkit-details-marker{ display:none; }',
    '.aut-details > summary:hover{ background:#f8fafc; }',
    '.aut-chevron{ font-size:.8rem; color:#64748b; transition:transform .15s ease; flex-shrink:0; }',
    '.aut-details[open] .aut-chevron{ transform:rotate(180deg); }',
    '.aut-details-body{ padding:0 24px 20px; display:flex; flex-direction:column; gap:14px; }',
    '.aut-group-lbl{ font-size:.7rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase;',
    'color:#64748b; margin-bottom:6px; }',
    '.aut-group-items{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0; }',
    '.aut-group-item{ display:flex; justify-content:space-between; gap:10px; font-size:.81rem;',
    'color:#334155; padding:4px 0; }',
    '.aut-group-count{ color:#94a3b8; flex-shrink:0; }',

    '.aut-footer{ padding:20px 24px; }',
    '.aut-footer-actions{ display:flex; gap:10px; margin-top:14px; }',
    '.aut-btn-dark{ background:#0f172a; color:#ffffff; flex:1; padding:10px 16px;',
    'border-radius:8px; border:none; font-weight:500; font-size:.81rem; cursor:pointer; font-family:inherit;',
    'transition:opacity .15s ease; }',
    '.aut-btn-dark:hover{ opacity:.9; }',
    '.aut-btn-ghost{ flex:0 0 auto; padding:10px 16px; border-radius:8px; border:1px solid #cbd5e1;',
    'background:transparent; color:#475569; font-weight:500; font-size:.81rem; cursor:pointer; font-family:inherit;',
    'transition:background .15s ease; }',
    '.aut-btn-ghost:hover{ background:#f8fafc; }'
  ].join('');
  document.head.appendChild(style);
}

/* -----------------------------------------------------------------------
   renderAUTCard(data, callbacks)

   Retourne un élément DOM autonome, parfaitement stylisé par défaut.
   L'accordéon utilise <details>/<summary> natif (état ouvert/fermé géré
   par le navigateur, pas de JS nécessaire pour ça) -- seul le chevron
   utilise une classe CSS pilotée par [open].
   ----------------------------------------------------------------------- */
function renderAUTCard(data, callbacks){
  data = data || AUT_SUMMARY_DEMO_DATA;
  callbacks = callbacks || {};
  ensureAUTSummaryStyle();

  var completionPct = Math.round((data.completion.days / data.completion.total) * 100);

  var card = document.createElement('div');
  card.className = 'aut-card';
  card.innerHTML =
    '<div class="aut-hdr">'
      + '<div>'
        + '<div class="aut-hdr-ttl"><span aria-hidden="true">🥑</span>Synthèse nutritionnelle</div>'
        + '<div class="aut-hdr-meta">'
          + '<span class="aut-badge">📅 ' + esc(data.periodLabel) + '</span>'
          + '<span>Journal complété à ' + completionPct + '% <span style="color:#a8a29e">(' + data.completion.days + '/' + data.completion.total + 'j)</span></span>'
        + '</div>'
      + '</div>'
      + '<button type="button" class="aut-close" data-action="close" aria-label="Fermer">✕</button>'
    + '</div>'

    + '<div class="aut-section">'
      + '<div class="aut-gauge-row">'
        + '<div class="aut-gauge">'
          + '<div class="aut-gauge-bar" role="img" aria-label="' + data.autShare + '% d\'aliments ultra-transformés, ' + data.brutShare + '% d\'aliments bruts">'
            + '<div class="aut-gauge-seg aut" style="width:' + data.autShare + '%">' + data.autShare + '%</div>'
            + '<div class="aut-gauge-seg brut" style="width:' + data.brutShare + '%">' + data.brutShare + '%</div>'
          + '</div>'
          + '<div class="aut-gauge-legend">'
            + '<span><span class="aut-dot aut"></span>Ultra-transformés</span>'
            + '<span><span class="aut-dot brut"></span>Bruts / peu transformés</span>'
          + '</div>'
        + '</div>'
        + '<div class="aut-stat">'
          + '<span class="aut-stat-num">' + data.totalOccurrences + '</span>'
          + '<span class="aut-stat-lbl">consommations relevées</span>'
          + '<span class="aut-stat-impact">Impact majeur : <strong>' + esc(data.topImpact.label) + '</strong><br>' + esc(data.topImpact.detail) + '</span>'
        + '</div>'
      + '</div>'
    + '</div>'

    + '<div class="aut-section">'
      + '<div class="aut-section-lbl"><span aria-hidden="true">💡</span>Pistes d\'amélioration ciblées</div>'
      + '<div class="aut-rec-list">' + data.recommendations.map(renderRecCard).join('') + '</div>'
    + '</div>'

    + '<details class="aut-details">'
      + '<summary>'
        + '<span class="aut-section-lbl"><span aria-hidden="true">🔍</span>Détails des consommations (' + data.totalOccurrences + ' items)</span>'
        + '<span class="aut-chevron" aria-hidden="true">▾</span>'
      + '</summary>'
      + '<div class="aut-details-body">' + data.groups.map(renderGroup).join('') + '</div>'
    + '</details>'

    + '<div class="aut-footer">'
      + '<div class="aut-section-lbl"><span aria-hidden="true">💬</span>Accompagnement</div>'
      + '<div class="aut-footer-actions">'
        + '<button type="button" class="aut-btn-dark" data-action="contact-support">Contacter le support</button>'
        + '<button type="button" class="aut-btn-ghost" data-action="dismiss">Mettre de côté</button>'
      + '</div>'
    + '</div>';

  wireAUTSummaryEvents(card, data, callbacks);
  return card;
}

// Alias rétro-compatible avec le nom utilisé dans les échanges précédents.
var renderAUTSummaryCard = renderAUTCard;

function renderRecCard(rec){
  return '<div class="aut-rec-card" data-rec-id="' + esc(rec.id) + '">'
    + '<div class="aut-rec-head">'
      + '<div><div class="aut-rec-title">' + esc(rec.title) + '</div><div class="aut-rec-sub">' + esc(rec.subtitle) + '</div></div>'
    + '</div>'
    + '<div class="aut-rec-alt"><span aria-hidden="true">→</span><span>' + esc(rec.alternative) + '</span></div>'
    + '<div class="aut-rec-actions">'
      + '<button type="button" class="aut-btn aut-btn-primary" data-action="apply-recommendation" data-rec-id="' + esc(rec.id) + '">Appliquer au journal</button>'
      + '<button type="button" class="aut-btn aut-btn-outline" data-action="view-recipe" data-rec-id="' + esc(rec.id) + '">Voir la recette</button>'
    + '</div>'
  + '</div>';
}

function renderGroup(g){
  return '<div>'
    + '<div class="aut-group-lbl">' + esc(g.label) + '</div>'
    + '<ul class="aut-group-items">' + g.items.map(function(it){
        return '<li class="aut-group-item"><span>' + esc(it.name) + '</span><span class="aut-group-count">' + it.count + '×</span></li>';
      }).join('') + '</ul>'
  + '</div>';
}

function esc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* -----------------------------------------------------------------------
   wireAUTSummaryEvents(card, data, callbacks)

   Un seul écouteur délégué sur la carte (addEventListener, lecture de
   data-action au clic) plutôt qu'un écouteur par bouton.
   ----------------------------------------------------------------------- */
function wireAUTSummaryEvents(card, data, callbacks){
  card.addEventListener('click', function(e){
    var target = e.target.closest('[data-action]');
    if(!target) return;
    var action = target.getAttribute('data-action');

    if(action === 'close'){
      if(typeof callbacks.onClose === 'function') callbacks.onClose();
      return;
    }

    if(action === 'dismiss'){
      if(typeof callbacks.onDismiss === 'function') callbacks.onDismiss();
      return;
    }

    if(action === 'contact-support'){
      if(typeof callbacks.onContactSupport === 'function') callbacks.onContactSupport();
      return;
    }

    if(action === 'apply-recommendation'){
      var recId = target.getAttribute('data-rec-id');
      if(target.hasAttribute('disabled')) return;
      target.setAttribute('disabled', 'true');
      target.textContent = 'Ajouté au journal';
      if(typeof callbacks.onApplyRecommendation === 'function') callbacks.onApplyRecommendation(recId);
      return;
    }

    if(action === 'view-recipe'){
      var viewRecId = target.getAttribute('data-rec-id');
      if(typeof callbacks.onViewRecipe === 'function') callbacks.onViewRecipe(viewRecId);
      return;
    }
  });
}
