// Liens longs (salle de démo, 14 nov.) : au-delà de 53 octets, on passe par qrcode-generator (MIT, js/vendor).
import qrcode from './vendor/qrcode-generator.js';
// Code QR réel, sans dépendance : version 3 (29 × 29), correction L, mode octets, masque 0.
// Suffit pour un lien d'invitation (53 octets au plus). Vérifié avec un lecteur (OpenCV) le 10 nov. 2026.
const SIZE = 29, DATA_CW = 55, EC_CW = 15;

function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
function ecc(data) {
  const div = Array(EC_CW).fill(0); div[EC_CW - 1] = 1;
  let root = 1;
  for (let i = 0; i < EC_CW; i++) { for (let j = 0; j < EC_CW; j++) { div[j] = mul(div[j], root); if (j + 1 < EC_CW) div[j] ^= div[j + 1]; } root = mul(root, 2); }
  const res = Array(EC_CW).fill(0);
  for (const b of data) { const f = b ^ res.shift(); res.push(0); div.forEach((c, i) => { res[i] ^= mul(c, f); }); }
  return res;
}

// Renvoie la matrice (true = module sombre), ou null si le texte est trop long.
export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > DATA_CW - 2) return null;
  const bits = [];
  const push = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  push(4, 4); push(bytes.length, 8); bytes.forEach(b => push(b, 8));
  push(0, Math.min(4, DATA_CW * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xEC; bits.length < DATA_CW * 8; pad ^= 0xEC ^ 0x11) push(pad, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  const all = [...data, ...ecc(data)];

  const m = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const fn = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) { m[y][x] = !!v; fn[y][x] = true; } };
  for (let i = 0; i < SIZE; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(SIZE - 4, 3); finder(3, SIZE - 4);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(22 + dx, 22 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  // Informations de format : correction L (01), masque 0
  const d = 8; let rem = d; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const f = ((d << 10) | rem) ^ 0x5412, bit = (i) => (f >>> i) & 1;
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(SIZE - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, SIZE - 15 + i, bit(i));
  set(8, SIZE - 8, true);
  // Données en zigzag, puis masque 0
  let k = 0;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < SIZE; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? SIZE - 1 - vert : vert;
      if (!fn[y][x] && k < all.length * 8) { m[y][x] = ((all[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
    }
  }
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!fn[y][x] && (x + y) % 2 === 0) m[y][x] = !m[y][x];
  return m;
}

// SVG : modules sombres sur fond clair, avec la marge blanche de 4 modules exigée par la norme.
export function qrSVG(text, { size = 180, dark = '#0E3B31', light = '#FBF8F2' } = {}) {
  let m = qrMatrix(text), n = SIZE;
  if (!m) { const q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make(); n = q.getModuleCount(); m = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => q.isDark(y, x))); }
  let d = '';
  m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  return `<svg class="qr" width="${size}" height="${size}" viewBox="0 0 ${n + 8} ${n + 8}" shape-rendering="crispEdges" role="img" aria-label="Code QR du lien d'invitation"><rect width="100%" height="100%" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}
