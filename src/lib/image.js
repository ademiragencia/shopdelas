// Gera uma imagem SVG (data URI) bonita e determinística para cada produto/loja.
// Mantém o app 100% autocontido, sem depender de imagens externas.

const PALETTES = [
  ["#ff9a9e", "#fad0c4"],
  ["#a18cd1", "#fbc2eb"],
  ["#ffecd2", "#fcb69f"],
  ["#84fab0", "#8fd3f4"],
  ["#fccb90", "#d57eeb"],
  ["#e0c3fc", "#8ec5fc"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#330867"],
  ["#c79081", "#dfa579"],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function tile(seed, emoji = "👕", { w = 600, h = 600, label = "" } = {}) {
  const h1 = hash(seed);
  const [c1, c2] = PALETTES[h1 % PALETTES.length];
  const rot = (h1 % 60) - 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <g transform="translate(${w / 2} ${h / 2}) rotate(${rot})" opacity="0.15">
    <circle r="${w * 0.55}" fill="#ffffff"/>
  </g>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${w * 0.34}">${emoji}</text>
  ${label ? `<text x="50%" y="88%" dominant-baseline="central" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${w * 0.06}" font-weight="700" fill="rgba(0,0,0,.45)">${label}</text>` : ""}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function avatarTile(seed, emoji = "🏬") {
  return tile(seed, emoji, { w: 200, h: 200 });
}
