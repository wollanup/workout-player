// Collects the licenses of the runtime dependencies (the code shipped in the bundle) and writes:
//  - THIRD_PARTY_LICENSES.md : summary table (committed)
//  - public/licenses.txt     : full license texts, served with the app (generated, git-ignored)
// Runs automatically before `npm run build`; fails if a license is not in the allow-list.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED = new Set(['MIT', 'ISC', '0BSD', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '(MIT OR CC0-1.0)']);

// Some MIT packages ship no LICENSE file: use the standard text with the author from package.json.
const mitText = author => `MIT License

Copyright (c) ${author ?? 'the package authors'}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

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

const own = `Copyright (C) 2026 wollanup
Source code: https://github.com/wollanup/workout-player

This program is free software: you can redistribute it and/or modify it under the terms of the
GNU Affero General Public License as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Affero General Public License below for more details.

${readFileSync('LICENSE', 'utf8').trim()}`;
const sep = '-'.repeat(72);
writeFileSync(join('public', 'licenses.txt'), [
  'Workout Player', '', own, '', sep, 'Third-party software included in this application', sep,
  ...list.map(p => `\n${p.name} ${p.version} (${p.license})${p.url ? `\n${p.url}` : ''}\n\n${p.text ?? `Licensed under ${p.license}.`}\n\n${sep}`),
].join('\n') + '\n');

console.log(`${list.length} packages -> THIRD_PARTY_LICENSES.md, public/licenses.txt`);
