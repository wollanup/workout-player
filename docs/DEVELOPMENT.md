# Documentation technique

## Démarrage

```bash
npm install
npm run dev          # http://localhost:5173 (hot reload)
npm run dev:mobile   # HTTPS auto-signé exposé sur le LAN -> https://<IP-du-PC>:5173 depuis le téléphone
npm test             # Vitest
npm run lint         # ESLint
npm run build        # build statique dans dist/ (npm run preview pour le servir en HTTPS sur le LAN)
npm run licenses     # régénère THIRD_PARTY_LICENSES.md et public/licenses.txt (fait aussi avant build/dev)
```

Sur mobile : accepter l'avertissement de certificat. HTTPS est nécessaire pour le maintien de l'écran
allumé (Wake Lock) et le service worker. PC et téléphone doivent être sur le même réseau (port 5173 ouvert).

## Stack

React 19 + Mantine 9 (UI, modales, notifications) + Tabler Icons (SVG), Vite, Vitest + Testing Library, ESLint.

## Architecture

```
src/
  core/        logique pure, sans DOM (temps, parsing YouTube, modèle de séance, plan des bips) — testée
  player/      WorkoutEngine : machine à états de la séance, indépendante de l'UI — testée
  media/       adaptateurs : lecteur YouTube, audio local, bips Web Audio
  services/    stockage (localStorage + IndexedDB pour les fichiers), wake lock, analyse des morceaux
  app/         singletons runtime (moteur, médias), thème, providers, modales / notifications
  hooks/       useEngineState (useSyncExternalStore), useSessions, useAccent
  components/  écrans React : SessionList, SessionEditor (+ StepCard, PlaylistImport, pickers), PlayerScreen
    shell/     barre d'application, menu (thème, aide)
```

- Le moteur et les médias vivent hors de React (ils doivent survivre aux changements d'écran) ;
  les composants s'y abonnent via `useEngineState`.
- Pas d'`alert()` / `confirm()` : `app/feedback.jsx` (modales et notifications Mantine).
- Sur mobile, la taille de base (rem) est augmentée de 12,5 % (`src/app.css`), toute l'UI suit.
- Les fichiers de composants n'exportent que des composants (règle react-refresh) :
  constantes dans `core/`, hooks dans `hooks/`.

## Comportements

- Bips de fin d'étape : 2 noires + 4 croches puis un bip long, 300 Hz (`core/beeps.js`).
- Durées : champ compact ; au clic, modale avec presets (1, 2, 3, 5 min, morceau entier) et deux roues
  (minutes | secondes par 10 s). Décompte départ, bips et fondu : une roue de secondes (0 = « Non »).
- Analyse de chaque morceau : durée réelle et libellé « Artiste - Titre » (tags ID3 pour les fichiers,
  lecteur YouTube + oEmbed pour les vidéos) ; alerte si l'étape dépasse la fin du morceau.
- Préchargement du morceau suivant pendant les pauses.
- Sauvegarde automatique (debounce 400 ms) ; validation au lancement ; nettoyage des fichiers orphelins
  au retour à la liste.

## YouTube

- Lecteur officiel (IFrame API) : être connecté à YouTube dans le navigateur pour le Premium (sans pub).
- Erreur 153 = pas de Referer envoyé : ne pas ouvrir `index.html` en `file://`, passer par le serveur.
- Playlists : publiques ou non répertoriées uniquement ; certains clips interdisent la lecture intégrée (erreurs 101/150).
- Lecture YouTube = écran allumé obligatoire. Les fichiers locaux fonctionnent écran éteint et hors ligne.

## PWA

- `public/manifest.webmanifest`, `public/sw.js` (network-first, cache pour le hors ligne), enregistré en production.
- Icônes générées depuis `public/icon.svg` et `public/icon-maskable.svg` :
  `npm i --no-save sharp && node scripts/icons.mjs` (les PNG sont versionnés).

## Déploiement (GitHub Pages)

`.github/workflows/deploy.yml` : lint + tests + build à chaque push / PR ; sur `main`, publication sur
GitHub Pages à l'adresse https://app.workout.stemux.fr (`public/CNAME`).

Mise en place (déjà faite, pour mémoire) :

1. DNS `stemux.fr` : `CNAME app.workout -> wollanup.github.io.`
2. `gh repo create wollanup/workout-player --public --source . --push`
3. `gh api -X POST repos/wollanup/workout-player/pages -f build_type=workflow`
   puis `gh api -X PUT repos/wollanup/workout-player/pages -f cname=app.workout.stemux.fr`
4. Une fois le certificat émis : `gh api -X PUT repos/wollanup/workout-player/pages -F https_enforced=true`

## Licences

Le projet est sous licence MIT (`LICENSE`). `scripts/licenses.mjs` recense les dépendances d'exécution,
refuse toute licence hors liste blanche (build en échec) et produit `THIRD_PARTY_LICENSES.md` et
`public/licenses.txt` (textes complets, servis avec l'app).
