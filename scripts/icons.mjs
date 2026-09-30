// Regenerates the PNG icons from the SVG sources:
//   npm i --no-save sharp && node scripts/icons.mjs
// (sharp is not a project dependency; the generated PNGs are committed.)
import sharp from 'sharp';

const out = [
  ['public/icon.svg', 'public/icon-192.png', 192],
  ['public/icon.svg', 'public/icon-512.png', 512],
  ['public/icon-maskable.svg', 'public/icon-maskable-512.png', 512],
  ['public/icon-maskable.svg', 'public/apple-touch-icon.png', 180],
];
for (const [src, dest, size] of out) {
  await sharp(src, { density: 300 }).resize(size, size).png().toFile(dest);
  console.log(dest);
}
