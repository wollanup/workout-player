<p align="center">
  <img src="public/icon.svg" width="96" alt="">
</p>

<h1 align="center">Workout Player</h1>

<p align="center">
  <b>Ta musique, ton rythme, ta séance.</b><br>
  Le lecteur qui enchaîne tes morceaux préférés au chrono près, avec pauses et bips de décompte.
</p>

<p align="center">
  <a href="https://app.workout.stemux.fr"><b>Ouvrir l'application</b></a>
  ·
  <a href="#installer-sur-ton-téléphone">L'installer sur ton téléphone</a>
  ·
  <a href="https://github.com/wollanup/workout-player/actions/workflows/deploy.yml"><img src="https://github.com/wollanup/workout-player/actions/workflows/deploy.yml/badge.svg" alt="Déploiement" align="center"></a>
</p>

---

Tu fais du HIIT, du fractionné, du gainage ou du circuit training ? Tu connais le problème : l'œil rivé sur
le chrono, le téléphone à déverrouiller entre deux séries, la playlist qui ne tombe jamais au bon moment.

**Workout Player fait le chrono à ta place.** Tu construis ta séance une fois (« 3 min de ce morceau,
20 s de pause, puis 5 min de celui-là… »), tu appuies sur Lancer, et tu n'as plus qu'à transpirer.

<p align="center">
  <img src="docs/screenshots/sessions.png" width="200" alt="Liste des séances">
  <img src="docs/screenshots/editor.png" width="200" alt="Construction d'une séance">
  <img src="docs/screenshots/duration-picker.png" width="200" alt="Choix d'une durée">
  <img src="docs/screenshots/player.png" width="200" alt="Séance en cours">
</p>

<p align="center">
  <img src="docs/screenshots/sources.png" width="200" alt="Choix des sources musicales">
  <img src="docs/screenshots/mixed-session.png" width="200" alt="Séance mêlant YouTube et Apple Music">
  <img src="docs/screenshots/apple-search.png" width="200" alt="Recherche Apple Music">
  <img src="docs/screenshots/playlist-provider.png" width="200" alt="Import de playlist : choix du service">
  <img src="docs/screenshots/playlist-apple.png" width="200" alt="Import d'une playlist Apple Music">
</p>

## Ce qu'il sait faire

- **Tes morceaux, découpés au chrono.** Chaque étape joue un morceau pendant la durée choisie, à partir du
  passage que tu veux (le refrain qui envoie, pas l'intro de 40 secondes), avec un fondu en fin d'étape.
- **Pauses et décomptes.** Un décompte avant le départ, des pauses entre les exercices et des bips
  rythmés avant chaque changement : tu sais que ça tourne sans regarder l'écran.
- **YouTube et YouTube Music.** Colle un lien de vidéo ou importe une playlist entière. Les publicités
  dépendent de ton abonnement : avec YouTube Premium (ou YouTube Music Premium), aucune pub au milieu de
  la dernière série ; sans abonnement, YouTube peut en insérer.
- **Apple Music.** Cherche un morceau ou colle un lien, importe une playlist ou un album, ou directement
  tes playlists. Abonnement Apple Music requis pour la lecture complète.
- **Mélange les sources.** Une même séance peut enchaîner YouTube, Apple Music et tes fichiers.
  Menu ⋮ > Sources pour n'afficher que celles que tu utilises.
- **Tes propres fichiers.** Ajoute tes MP3 : ils restent sur le téléphone et fonctionnent hors ligne,
  même écran éteint.
- **Rapide à construire.** Durées en un geste (presets 1, 2, 3, 5 min ou roues façon réveil),
  titre « Artiste - Titre » retrouvé automatiquement, alerte si le morceau est plus court que l'étape.
- **Toujours sous les yeux.** Durée totale de la séance, temps restant, morceau suivant, gros boutons
  faciles à viser avec les mains moites.
- **Rien à enregistrer.** Chaque modification est sauvegardée automatiquement.
- **À ton goût.** Thème clair, sombre ou selon le système, et couleur d'accent au choix.

## Exemple

Un HIIT de 14 minutes :

| Étape | Durée |
|---|---|
| Décompte de départ | 10 s |
| Daft Punk - Harder, Better, Faster, Stronger | 3:00 |
| Pause | 0:20 |
| The Prodigy - Firestarter | 3:00 |
| Pause | 0:20 |
| Queen - Don't Stop Me Now (à partir de 0:30) | 5:00 |
| Pause | 0:30 |
| Survivor - Eye of the Tiger | 2:00 |

Tu crées la séance une fois, puis c'est un seul bouton à chaque entraînement.

## Installer sur ton téléphone

Workout Player est une application web installable, sans store ni compte :

- **Android (Chrome)** : ouvre [app.workout.stemux.fr](https://app.workout.stemux.fr), menu ⋮ puis
  « Installer l'application ».
- **iPhone (Safari)** : ouvre le site, bouton Partager puis « Sur l'écran d'accueil ».

Elle s'ouvre ensuite en plein écran comme une vraie app et garde l'écran allumé pendant la séance.

## Bon à savoir

- **Publicités YouTube** : elles dépendent de ton abonnement YouTube / YouTube Music, pas de Workout Player.
  Pour profiter de Premium (sans pub), connecte-toi à YouTube dans le même navigateur.
- **Apple Music** : connecte ton compte (Menu ⋮ > Sources) ; sans abonnement actif, Apple ne permet pas la
  lecture complète des morceaux.
- Les playlists doivent être publiques ou non répertoriées (les playlists privées, comme « J'aime »,
  ne sont pas lisibles par le lecteur intégré). Certains clips interdisent la lecture hors de YouTube :
  le lecteur le signale et le chrono continue.
- Avec YouTube, l'écran doit rester allumé (l'app s'en charge). Avec tes fichiers, pas besoin.

## Vie privée

Pas de compte, pas de pub, pas de pistage. Tes séances et tes fichiers restent sur ton appareil.
Seuls les services de musique que tu utilises (YouTube, Apple Music) communiquent avec leurs serveurs.
Détails dans les [mentions légales](docs/LEGAL.md).

## Contribuer

Idées, bugs, envies : ouvre une [issue](https://github.com/wollanup/workout-player/issues).
Pour lancer le projet en local et comprendre son architecture, voir la
[documentation technique](docs/DEVELOPMENT.md).

## Licence

[MIT](LICENSE). Les bibliothèques utilisées et leurs licences sont listées dans
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

Workout Player n'est affilié ni à YouTube / Google, ni à Apple. YouTube est une marque de Google LLC,
Apple Music une marque d'Apple Inc.
