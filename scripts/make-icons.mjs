// Generates PWA icons from an inline SVG in the Features 01 palette. Run: node scripts/make-icons.mjs
import sharp from "sharp";

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6c76b"/>
      <stop offset="0.5" stop-color="#fdf3e1"/>
      <stop offset="1" stop-color="#bce7f8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
    <rect x="96" y="96" width="320" height="320" rx="72" fill="#ffffff" stroke="#9bd3e9" stroke-width="10"/>
    <path d="M196 170 v172 M196 262 l92 -92 M222 236 l72 106" stroke="#1e1e1e" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="330" cy="186" r="16" fill="#90d7f3"/>
  </g>
</svg>`;

const out = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/icon-maskable-512.png", 512, 56],
  ["public/icons/apple-touch-icon.png", 180, 0],
  ["app/icon.png", 64, 0],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
