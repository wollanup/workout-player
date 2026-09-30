// Collects the licenses of the runtime dependencies (the code shipped in the bundle) and writes:
//  - THIRD_PARTY_LICENSES.md : summary table (committed)
//  - public/licenses.txt     : full license texts, served with the app (generated, git-ignored)
// Runs automatically before `npm run build`; fails if a license is not in the allow-list.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED = new Set(['MIT', 'ISC', '0BSD', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '(MIT OR CC0-1.0)']);

// Some MIT packages ship no LICENSE file: use the standard text with the author from package.json.
const mitText = author => readFileSync('LICENSE', 'utf8').trim()
  .replace(/^Copyright .*$/m, `Copyright (c) ${author ?? 'the package authors'}`);

const tree = JSON.parse(execSync('npm ls --omit=dev --all --json', { encoding: 'utf8', maxBuffer: 1e8 }));
const pkgs = new Map();
(function walk(deps = {}) {
  for (const [name, dep] of Object.entries(deps)) {
    if (name.startsWith('@types/') || pkgs.has(name)) continue;
    const dir = join('node_modules', name);
    const pj = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const file = readdirSync(dir).find(f => /^(licen[cs]e|copying)/i.test(f));
    const repo = (typeof pj.repository === 'string' ? pj.repository : pj.repository?.url) ?? '';
    pkgs.set(name, {
      name, version: pj.version, license: pj.license ?? 'UNKNOWN',
      url: repo.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://').replace(/^github:/, 'https://github.com/'),
      text: file ? readFileSync(join(dir, file), 'utf8').trim()
        : pj.license === 'MIT' ? mitText(typeof pj.author === 'string' ? pj.author : pj.author?.name) : null,
    });
    walk(dep.dependencies);
  }
})(tree.dependencies);

const list = [...pkgs.values()].sort((a, b) => a.name.localeCompare(b.name));
const bad = list.filter(p => !ALLOWED.has(p.license));
if (bad.length) {
  console.error('Unexpected licenses:', bad.map(p => `${p.name} (${p.license})`).join(', '));
  process.exit(1);
}

writeFileSync('THIRD_PARTY_LICENSES.md', `# Licences tierces

Workout Player embarque les bibliothèques open source ci-dessous (dépendances d'exécution).
Toutes sont sous licence permissive ; leurs textes complets sont publiés avec l'application
(\`/licenses.txt\`, lien dans le menu Aide).

Fichier généré par \`node scripts/licenses.mjs\` (lancé automatiquement avant chaque build) : ne pas éditer à la main.

| Paquet | Version | Licence |
|---|---|---|
${list.map(p => `| ${p.url ? `[${p.name}](${p.url})` : p.name} | ${p.version} | ${p.license} |`).join('\n')}

## Autres éléments

- Icônes : [Tabler Icons](https://tabler.io/icons) (MIT) ; l'icône de l'application est dérivée de l'icône « barbell ».
- Polices : polices système de l'appareil, aucune police téléchargée.
- YouTube est une marque de Google LLC. La lecture passe par le lecteur officiel (YouTube IFrame Player API),
  soumis aux [conditions d'utilisation de YouTube](https://www.youtube.com/t/terms) ; aucun contenu n'est copié ni redistribué.
- Apple Music est une marque d'Apple Inc. MusicKit JS est chargé depuis les serveurs d'Apple (non inclus
  dans l'application) et soumis aux conditions d'Apple.
`);

const own = readFileSync('LICENSE', 'utf8').trim();
const sep = '-'.repeat(72);
writeFileSync(join('public', 'licenses.txt'), [
  'Workout Player', '', own, '', sep, 'Third-party software included in this application', sep,
  ...list.map(p => `\n${p.name} ${p.version} (${p.license})${p.url ? `\n${p.url}` : ''}\n\n${p.text ?? `Licensed under ${p.license}.`}\n\n${sep}`),
].join('\n') + '\n');

console.log(`${list.length} packages -> THIRD_PARTY_LICENSES.md, public/licenses.txt`);
