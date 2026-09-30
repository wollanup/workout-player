# Mentions légales et confidentialité

## Éditeur et hébergement

- Workout Player est un projet personnel, non commercial et open source (licence MIT),
  publié par [wollanup](https://github.com/wollanup).
- Code source : https://github.com/wollanup/workout-player
- Hébergeur : GitHub, Inc. (GitHub Pages), 88 Colin P Kelly Jr St, San Francisco, CA 94107, États-Unis.

## Données personnelles

- Aucun compte, aucune publicité, aucun outil de mesure d'audience.
- Les séances et les fichiers audio importés restent **sur ton appareil** (stockage du navigateur :
  localStorage et IndexedDB). Rien n'est envoyé à un serveur de Workout Player, qui n'en a pas.
- Effacer les données du site dans le navigateur supprime tout.

## YouTube

- Les vidéos sont lues avec le lecteur officiel YouTube (YouTube IFrame Player API). Lorsqu'une séance
  contient une vidéo YouTube, le navigateur se connecte aux serveurs de Google, qui peut déposer des cookies
  et collecter des données selon ses propres règles :
  [conditions d'utilisation de YouTube](https://www.youtube.com/t/terms) et
  [règles de confidentialité de Google](https://policies.google.com/privacy).
- Le titre et l'auteur des vidéos sont récupérés via le service oEmbed de YouTube.
- Workout Player n'est ni affilié à YouTube ni approuvé par Google. YouTube est une marque de Google LLC.
- Aucun contenu n'est téléchargé, copié ni redistribué : la lecture, les publicités et l'accès Premium
  restent gérés par YouTube. La présence de publicités dépend de ton abonnement YouTube / YouTube Music
  (aucune avec Premium).

## Apple Music

- Désactivé sur l'instance officielle (app.workout.stemux.fr) ; seules les versions qui l'activent
  (fork avec son propre compte Apple Developer) sont concernées par ce qui suit.
- Les morceaux Apple Music sont lus avec la bibliothèque officielle d'Apple, MusicKit JS, chargée depuis
  les serveurs d'Apple (`js-cdn.music.apple.com`) uniquement si la source Apple Music est utilisée.
- La connexion au compte se fait chez Apple : Workout Player ne voit jamais tes identifiants. Apple fournit
  un jeton d'accès conservé par MusicKit dans ton navigateur ; « Déconnecter » (Menu > Sources) le supprime.
- Les recherches, la lecture et l'accès à ta bibliothèque passent directement entre ton navigateur et Apple,
  selon ses [conditions](https://www.apple.com/legal/internet-services/itunes/) et sa
  [politique de confidentialité](https://www.apple.com/legal/privacy/).
- Un abonnement Apple Music est nécessaire pour la lecture complète. Workout Player n'est ni affilié à
  Apple ni approuvé par Apple. Apple Music est une marque d'Apple Inc.

## Fichiers audio

Les fichiers importés restent privés, sur ton appareil. À toi d'utiliser des fichiers que tu as le droit d'écouter.

## Licences

- Workout Player : [licence MIT](../LICENSE).
- Bibliothèques tierces : [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md) ;
  textes complets servis avec l'application (`/licenses.txt`).
