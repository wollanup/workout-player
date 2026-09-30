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
  core/        logique pure, sans DOM (temps, parsing YouTube / Apple Music, modèle, sources, bips) — testée
  player/      WorkoutEngine : machine à états de la séance, indépendante de l'UI — testée
  media/       adaptateurs : lecteur YouTube, Apple Music (MusicKit JS), audio local, bips Web Audio
  services/    stockage (localStorage + IndexedDB pour les fichiers), wake lock, analyse des morceaux
  app/         singletons runtime (moteur, médias), thème, providers, modales / notifications
  hooks/       useEngineState (useSyncExternalStore), useSessions, useAccent, useSources, useAppleAuth
  components/  écrans React : SessionList, SessionEditor (+ StepCard, PlaylistImport, pickers), PlayerScreen
    shell/     barre d'application, menu (sources, thème, aide)
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

## Sources

- Chaque étape musicale a sa `source` : `yt` (`videoId`), `apple` (`appleId`) ou `local` (`fileId`).
  Une séance peut les mélanger ; le moteur délègue à l'adaptateur de la source (`media` dans `app/runtime.js`).
- Contrat d'un adaptateur : `load(step, {onPlaying, onError})`, `pause`, `resume`, `stop`, `setVolume`,
  optionnels `preload()` (au lancement, pour chaque source utilisée), `prepare(step)` (morceau suivant
  pendant une pause) et `stallHint`.
- Menu > Sources (`wp.sources` dans localStorage) : sources proposées dans l'éditeur ; au moins une reste
  active. Apple Music n'apparaît activable que si l'application a été construite avec un jeton développeur.
- Import de playlist : on choisit d'abord le fournisseur (étape sautée s'il n'y en a qu'un), puis son
  formulaire (`PlaylistImport.jsx`).

## Apple Music

Lecture via [MusicKit JS v3](https://js-cdn.music.apple.com/musickit/v3/docs/), chargé à la demande.
L'utilisateur se connecte à son compte (abonnement requis pour la lecture complète, sinon Apple ne
fournit que des extraits : l'app demande alors de se connecter plutôt que de jouer 30 s).

### Jeton développeur

MusicKit exige un *developer token* : un JWT ES256 signé avec une clé MusicKit, valable 6 mois au plus.
Il est public (inclus dans le bundle) mais limité aux origines déclarées.

1. Compte [Apple Developer Program](https://developer.apple.com/programs/) (payant).
2. *Certificates, Identifiers & Profiles* > *Identifiers* > « + » > **Media IDs** : créer un identifiant
   avec le service MusicKit.
3. *Keys* > « + » : cocher **Media Services (MusicKit, ShazamKit…)**, associer le Media ID, télécharger
   le fichier `AuthKey_XXXXXXXXXX.p8` (une seule fois possible) et noter le **Key ID**.
4. Noter le **Team ID** (*Membership details*).

En local :

```bash
APPLE_TEAM_ID=… APPLE_KEY_ID=… APPLE_PRIVATE_KEY=~/AuthKey_XXXXXXXXXX.p8 \
  APPLE_ORIGINS=http://localhost:5173 \
  node scripts/apple-token.mjs | sed 's/^/VITE_APPLE_MUSIC_TOKEN=/' > .env.local
npm run dev
```

(`.env.local` n'est pas versionné. `APPLE_ORIGINS` est facultatif : sans lui, le jeton marche partout.)

En CI : secrets du dépôt `APPLE_TEAM_ID`, `APPLE_KEY_ID` et `APPLE_PRIVATE_KEY` (contenu du `.p8`) :

```bash
gh secret set APPLE_TEAM_ID -R wollanup/workout-player
gh secret set APPLE_KEY_ID -R wollanup/workout-player
gh secret set APPLE_PRIVATE_KEY -R wollanup/workout-player < AuthKey_XXXXXXXXXX.p8
```

Le workflow génère le jeton à chaque build (limité à `https://app.workout.stemux.fr`) et reconstruit le
site chaque mois pour le renouveler. Sans secrets, le build passe et Apple Music reste désactivé
(« Non configuré » dans Menu > Sources).

### Limites

- Liens acceptés : morceau (`/song/…`, `/album/…?i=…`), album, playlist du catalogue (`pl.…`) ou de la
  bibliothèque (`p.…`). La recherche utilise le catalogue du pays du compte.
- Lecture dans le navigateur uniquement tant que la page est active (comme YouTube, écran allumé).

## PWA

- `public/manifest.webmanifest`, `public/sw.js` (network-first, cache pour le hors ligne), enregistré en production.
- Icônes générées depuis `public/icon.svg` et `public/icon-maskable.svg` :
  `npm i --no-save sharp && node scripts/icons.mjs` (les PNG sont versionnés).

## Déploiement (GitHub Pages)

`.github/workflows/deploy.yml` : lint + tests + build à chaque push / PR ; sur `main` (et chaque mois,
pour renouveler le jeton Apple Music), publication sur GitHub Pages à l'adresse
https://app.workout.stemux.fr (`public/CNAME`).

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
