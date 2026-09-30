# Workout Player (POC)

Lecteur musical pour séances de sport : enchaîne des morceaux (YouTube / YT Music ou MP3 locaux)
pendant une durée fixe, avec pauses, décompte bipé (2 noires + 4 croches, 300 Hz), fondu de fin et départ à un timestamp.

- Durées : champ compact ; au clic, modale avec presets (1, 2, 3, 5 min, morceau entier) et deux roues à faire défiler (minutes | secondes par 10 s).
- Analyse de chaque morceau : durée réelle et libellé « Artiste - Titre » (tags ID3 pour les fichiers,
  lecteur YouTube + oEmbed pour les vidéos) ; alerte si l'étape dépasse la fin du morceau, avec ajustement en un clic.
- Préchargement du morceau suivant pendant les pauses.
- Sauvegarde automatique à chaque modification (pas de bouton Enregistrer) ; la validation se fait au lancement.
- Décompte départ, bips avant fin et fondu : roue de secondes (0 = « Non ») ; bouton pour écouter les bips.
- Mode application : barre fixe (logo, nom) et menu ⋮ avec Thème (couleur d'accent, clair / sombre / système) et Aide.

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

## Déploiement (GitHub Pages)

`.github/workflows/deploy.yml` : lint + tests + build à chaque push / PR ; sur `main`, publication sur GitHub Pages
à l'adresse https://app.workout.stemux.fr (`public/CNAME`).

Mise en place (une seule fois) :

1. DNS `stemux.fr` : enregistrement `CNAME app.workout -> <compte>.github.io.`
2. Créer le repo et pousser : `gh repo create workout-player --public --source . --push`
3. Activer Pages via Actions et le domaine :
   `gh api -X POST repos/<compte>/workout-player/pages -f build_type=workflow`
   puis `gh api -X PUT repos/<compte>/workout-player/pages -f cname=app.workout.stemux.fr`
4. Relancer le workflow (`gh workflow run deploy.yml`), puis cocher « Enforce HTTPS » une fois le certificat émis.

PWA : `public/manifest.webmanifest`, `public/sw.js` (network-first, cache hors ligne), icônes générées depuis
`public/icon*.svg` par `scripts/icons.mjs`.

## Stack

React 19 + Mantine 9 (UI, modales, notifications) + Tabler Icons (SVG), Vite, Vitest + Testing Library, ESLint.

## Architecture

```
src/
  core/        logique pure, sans DOM (temps, parsing YouTube, modèle de séance, plan des bips) — testée
  player/      WorkoutEngine : machine à états de la séance, indépendante de l'UI — testée
  media/       adaptateurs : lecteur YouTube, audio local, bips Web Audio
  services/    stockage (localStorage + IndexedDB pour les fichiers), wake lock
  app/         singletons runtime (moteur, médias), thème, providers, modales / notifications
  hooks/       useEngineState (useSyncExternalStore), useSessions
  components/  écrans React : SessionList, SessionEditor (+ StepCard, PlaylistImport), PlayerScreen
```

Le moteur et les médias vivent hors de React (ils doivent survivre aux changements d'écran) ;
les composants s'y abonnent via `useEngineState`. Pas d'`alert()`/`confirm()` : `app/feedback.jsx`.
Sur mobile, la taille de base (rem) est augmentée de 12,5 % (`src/app.css`), toute l'UI suit.
