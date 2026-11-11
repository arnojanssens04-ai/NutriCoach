# Bruitages calés (SFX Kit CC0)
- `python3 fetch_sfx.py roles` : télécharge les sons utiles dans `kit/sounds/` (non versionnés, vérifiés par sha256).
- `python3 sfx_mix.py events.json --out out/sfx [--voice voix.wav] [--speech words.json]` : voir l'en-tête du script.
- `roles.json` relie un rôle (ding, stamp, chalk_write…) à un son ; `kit/GUIDE.md` explique les points de synchronisation.
