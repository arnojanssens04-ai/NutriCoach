/* protect.js — Protection basique contre l'inspection du code source.
   IMPORTANT : cette protection est une dissuasion, pas une sécurité réelle.
   Un développeur déterminé peut toujours contourner ces mesures.
   La vraie protection est côté serveur (Edge Functions). */

(function(){
  // 1. Désactiver le clic droit
  document.addEventListener('contextmenu', function(e){ e.preventDefault(); });

  // 2. Désactiver les raccourcis clavier courants vers DevTools / source
  document.addEventListener('keydown', function(e){
    var k = e.key;
    var ctrl = e.ctrlKey || e.metaKey;

    // F12 seul
    if(k === 'F12'){ e.preventDefault(); return false; }

    // Ctrl/Cmd + U (view-source)
    if(ctrl && k.toLowerCase() === 'u'){ e.preventDefault(); return false; }

    // Ctrl/Cmd + Shift + I / J / C (DevTools)
    if(ctrl && e.shiftKey && ['i','j','c','I','J','C'].indexOf(k) >= 0){
      e.preventDefault(); return false;
    }

    // Ctrl/Cmd + S (sauvegarde de la page)
    if(ctrl && k.toLowerCase() === 's'){ e.preventDefault(); return false; }
  });

  // 3. Détection d'ouverture de DevTools (technique de timing)
  // Quand DevTools est ouvert, debugger; prend bien plus de temps à s'exécuter.
  var devtoolsOpen = false;
  var threshold = 160;
  setInterval(function(){
    var before = performance.now();
    (function(){ /* vide intentionnel */ })();
    var after = performance.now();
    if(after - before > threshold && !devtoolsOpen){
      devtoolsOpen = true;
      // On ne redirige pas — trop agressif pour un admin légitime.
      // On se contente d'effacer le contenu sensible de la console.
      console.clear();
      console.log('%c🔒 Ce code est protégé.', 'font-size:20px;color:#2d4f1c;font-weight:bold');
    }
    if(after - before <= threshold){ devtoolsOpen = false; }
  }, 1000);
})();
