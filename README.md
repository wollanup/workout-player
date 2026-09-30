# Workout Player (POC)

Lecteur musical pour séances de sport : enchaîne des morceaux (YouTube / YT Music ou MP3 locaux)
pendant une durée fixe, avec pauses, décompte bipé qui accélère, fondu de fin et départ à un timestamp.

## Démarrage

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev:mobile   # HTTPS auto-signé exposé sur le LAN -> https://<IP-du-PC>:5173 depuis le téléphone
npm test             # Vitest
npm run lint         # ESLint
npm run build        # build statique dans dist/ (npm run preview pour le servir en HTTPS sur le LAN)
```

Sur mobile : accepter l’avertissement de certificat. HTTPS est nécessaire pour le maintien de l’écran
allumé (Wake Lock) et le service worker. PC et téléphone doivent être sur le même réseau (port 5173 ouvert).

## YouTube

- Lecteur officiel (IFrame API) : être connecté à YouTube dans le navigateur pour le Premium (sans pub).
- Erreur 153 = pas de Referer envoyé : ne pas ouvrir `index.html` en `file://`, passer par le serveur.
- Playlists : publiques ou non répertoriées uniquement ; certains clips interdisent la lecture intégrée (erreurs 101/150).
- Lecture YouTube = écran allumé obligatoire. Les MP3 locaux fonctionnent écran éteint et hors ligne.

## Architecture

```
src/
  core/      logique pure, sans DOM (temps, parsing YouTube, modèle de séance, plan des bips) — testée
  player/    WorkoutEngine : machine à états de la séance, UI-agnostique (subscribe/getState) — testée
  media/     adaptateurs : lecteur YouTube, audio local, bips Web Audio
  services/  stockage (localStorage + IndexedDB pour les fichiers), wake lock
  ui/        vues DOM vanilla (liste, éditeur, lecture) — seule couche à remplacer pour passer à React
  main.js    câblage
```

Migration React : `engine.subscribe` / `engine.getState` se branchent directement sur
`useSyncExternalStore`; `core`, `player`, `media` et `services` restent inchangés.
