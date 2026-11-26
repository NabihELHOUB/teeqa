// Décor du chemin du chantier, refait le 11 nov. au soir (retour de l'utilisateur : « c'est pas posé, les animations sont pauvres,
// regarde Duolingo »). Principe repris des captures de Duolingo (refs/mobbin/apps/duolingo/chemin-*) : chaque objet a du volume
// (une face claire, une face sombre, un dessus), il tient sur un socle posé au sol comme les pastilles (dessus + tranche + ombre),
// et il vit par plusieurs petits mouvements décalés plutôt que par un seul balancement.
// Tout est dessiné ici, en vecteur ; les mouvements sont dans css/app.css (bloc « Décor du chemin, version 2 »).
const K = {
  sand: '#EDD6AA', sand2: '#D4B07A', sand3: '#B8915C', sandHi: '#F6E7C6',
  g1: '#1F6F58', g2: '#2E8B6A', g3: '#46A882', gHi: '#8AD6B6', gDk: '#0E3B31',
  wood: '#C9A16A', wood2: '#9C7442', wood3: '#7A5730',
  tc: '#DE9468', tc2: '#BE7148', tc3: '#8E4526', tcHi: '#EDB08A',
  lime: '#F6EEDD', lime2: '#DCCFB6', lime3: '#C2B394',
  saf: '#E2A33B', saf2: '#B07A1E', safHi: '#F5C766',
  ink: '#2B2D31', steel: '#5A5F66', steel2: '#3E4248', glass: '#BFD9D2', or: '#EE9140', or2: '#C96F2A',
};
const f = (n) => (Math.round(n * 10) / 10).toString();

// Socle : une galette de sable vue de trois quarts, avec sa tranche et une ombre douce. Les objets y sont plantés.
function island(cx, cy, rx, { ry = rx * 0.3, depth = 8, pebbles = true } = {}) {
  const x0 = cx - rx, x1 = cx + rx;
  return `<ellipse cx="${cx}" cy="${cy + depth + 5}" rx="${rx + 7}" ry="${ry + 3}" fill="#08261F" opacity=".13"/>
    <path d="M${x0} ${cy} v${depth} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-depth} Z" fill="${K.sand3}"/>
    <path d="M${x0} ${cy} v${depth * 0.45} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-depth * 0.45} Z" fill="${K.sand2}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${K.sand}"/>
    <ellipse cx="${cx - rx * 0.18}" cy="${cy - ry * 0.22}" rx="${rx * 0.6}" ry="${ry * 0.48}" fill="${K.sandHi}" opacity=".7"/>
    ${pebbles ? `<ellipse cx="${cx - rx * 0.62}" cy="${cy + ry * 0.3}" rx="3.4" ry="1.8" fill="${K.sand3}" opacity=".7"/><ellipse cx="${cx + rx * 0.55}" cy="${cy + ry * 0.45}" rx="2.6" ry="1.4" fill="${K.sand3}" opacity=".6"/><ellipse cx="${cx + rx * 0.7}" cy="${cy - ry * 0.1}" rx="1.8" ry="1" fill="${K.sand3}" opacity=".5"/>` : ''}`;
}
const shadow = (cx, cy, rx, ry = rx * 0.3, o = 0.2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#5B3F1C" opacity="${o}"/>`;

// Palme : un croissant qui monte puis retombe, bord inférieur dentelé, nervure claire.
function frond(L) {
  const up = `C${f(0.22 * L)} ${f(-0.36 * L)} ${f(0.68 * L)} ${f(-0.38 * L)} ${f(L)} ${f(0.18 * L)}`;
  const P = [[1, 0.18], [0.86, 0.02], [0.72, -0.07], [0.58, -0.115], [0.44, -0.125], [0.3, -0.105], [0.16, -0.06], [0, 0]];
  let low = '';
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; low += `L${f((a[0] + b[0]) / 2 * L)} ${f(((a[1] + b[1]) / 2 - 0.05) * L)} L${f(b[0] * L)} ${f(b[1] * L)} `; }
  return [`M0 0 ${up} ${low}Z`, `M0 0 C${f(0.24 * L)} ${f(-0.25 * L)} ${f(0.66 * L)} ${f(-0.27 * L)} ${f(0.97 * L)} ${f(0.15 * L)}`];
}
// Palmier : tronc épais à anneaux (côté clair à gauche, sombre à droite), sept palmes sur trois plans, régime de dattes.
// Trois mouvements superposés : l'arbre plie depuis le pied (avec une rafale de temps en temps), la tête suit en retard,
// chaque palme frémit à son rythme.
function palm(x, by, h, lean = 10, seed = 0) {
  const P0 = [x, by], P1 = [x, by - h * 0.4], P2 = [x + lean * 0.45, by - h * 0.75], P3 = [x + lean, by - h];
  const bz = (t) => { const u = 1 - t; return [0, 1].map(i => u * u * u * P0[i] + 3 * u * u * t * P1[i] + 3 * u * t * t * P2[i] + t * t * t * P3[i]); };
  const w = (t) => 13 - 4.5 * t;
  let L = '', R = '', rings = '';
  for (let i = 0; i <= 8; i++) { const t = i / 8, [cx, cy] = bz(t); L += `${i ? 'L' : 'M'}${f(cx - w(t) / 2)} ${f(cy)} `; R = `L${f(cx + w(t) / 2)} ${f(cy)} ` + R; }
  let mid = '';
  for (let i = 8; i >= 0; i--) { const t = i / 8, [cx, cy] = bz(t); mid += `L${f(cx + 1)} ${f(cy)} `; }
  for (let i = 1; i <= 6; i++) { const t = i / 7.2, [cx, cy] = bz(t), ww = w(t); rings += `M${f(cx - ww / 2)} ${f(cy)} q${f(ww / 2)} 3.6 ${f(ww)} 0 `; }
  const Lf = h * 0.6, [fp, rib] = frond(Lf);
  const leaf = (rot, flip, sc, col, k, t, d) => `<g class="pf" style="--k:${k}deg;--t:${t}s;--d:${d}s"><g transform="${flip ? 'scale(-1 1) ' : ''}rotate(${rot}) scale(${sc})"><path d="${fp}" fill="${col}"/><path d="${rib}" fill="none" stroke="${K.gHi}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/></g></g>`;
  const s = seed * 0.37;
  return `${shadow(x + 10, by + 1, 24, 6, 0.22)}
    <g class="pm-tree" style="transform-origin:${x}px ${by}px;--d:${f(-s * 3)}s">
      <ellipse cx="${x}" cy="${by}" rx="9.5" ry="3.6" fill="${K.wood3}"/>
      <path d="${L}${R}Z" fill="${K.wood}"/><path d="M${f(P3[0] + 1)} ${f(P3[1])} ${R}${mid}Z" fill="${K.wood2}" opacity=".85"/>
      <path d="${rings}" fill="none" stroke="${K.wood3}" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
      <g class="pm-crown" transform="translate(${f(P3[0])} ${f(P3[1] + 2)})"><g class="pm-crown-in" style="--d:${f(-s * 3 - 0.5)}s">
        ${leaf(-64, 0, 0.78, K.g1, 3, 3.3, -0.2 - s)}${leaf(-64, 1, 0.78, K.g1, -3, 3.7, -1.1 - s)}${leaf(-98, 0, 0.6, K.g1, 4, 2.9, -0.7 - s)}
        ${leaf(-26, 0, 1, K.g2, 4, 3.1, -1.6 - s)}${leaf(-26, 1, 1, K.g2, -4, 2.7, -0.4 - s)}
        <g class="pm-dates"><circle cx="-4" cy="6" r="3.6" fill="${K.or2}"/><circle cx="4" cy="7.5" r="3.6" fill="${K.or}"/><circle cx="0" cy="11.5" r="3.2" fill="${K.or2}"/><circle cx="3" cy="6.4" r="1" fill="#F8B26E"/></g>
        ${leaf(12, 0, 0.9, K.g3, 5, 2.5, -0.9 - s)}${leaf(12, 1, 0.9, K.g3, -5, 2.8, -1.9 - s)}
        <circle r="5" fill="${K.wood2}"/>
      </g></g>
    </g>`;
}
// Touffe d'herbe sèche et petits cailloux : remplissage, toujours en mouvement léger.
const tuft = (x, y, s = 1) => `<g class="tf" style="transform-origin:${x}px ${y}px;--d:${f(-(x % 7) * 0.3)}s"><path d="M${x} ${y} q${-7 * s} ${-8 * s} ${-9 * s} ${-16 * s} q${5 * s} ${5 * s} ${9 * s} ${16 * s} q${-1 * s} ${-12 * s} ${1 * s} ${-21 * s} q${4 * s} ${9 * s} ${-1 * s} ${21 * s} q${5 * s} ${-9 * s} ${10 * s} ${-14 * s} q${-3 * s} ${8 * s} ${-10 * s} ${14 * s} Z" fill="${K.g2}"/><path d="M${x} ${y} q${-1 * s} ${-12 * s} ${1 * s} ${-21 * s}" fill="none" stroke="${K.g3}" stroke-width="${1.4 * s}" stroke-linecap="round"/></g>`;
const rock = (x, y, s = 1) => `<path d="M${x - 9 * s} ${y} c${-1 * s} ${-8 * s} ${5 * s} ${-12 * s} ${10 * s} ${-11 * s} c${6 * s} ${0} ${9 * s} ${5 * s} ${8 * s} ${11 * s} Z" fill="${K.lime3}"/><path d="M${x - 9 * s} ${y} c${-1 * s} ${-8 * s} ${5 * s} ${-12 * s} ${10 * s} ${-11 * s} c${-4 * s} ${2 * s} ${-6 * s} ${6 * s} ${-5 * s} ${11 * s} Z" fill="${K.lime}"/>`;
// Brique vue de trois quarts (dessus, face, côté).
const brick = (x, y, w = 15, h = 8, dx = 6, dy = -3) => `<path d="M${x} ${y} l${dx} ${dy} h${w} l${-dx} ${-dy} Z" fill="${K.tcHi}"/><path d="M${x + w} ${y} l${dx} ${dy} v${h} l${-dx} ${-dy} Z" fill="${K.tc3}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${K.tc}"/>`;
const cone = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="2.8" fill="${K.or2}"/><path d="M${x - 5.5} ${y} L${x - 1.5} ${y - 17} h3 L${x + 5.5} ${y} Z" fill="${K.or}"/><path d="M${x - 3.9} ${y - 7} h7.8 l-.9 -4 h-6 Z" fill="${K.lime}"/><path d="M${x + 1.5} ${y - 17} L${x + 5.5} ${y} h-3 Z" fill="${K.or2}" opacity=".6"/>`;
const flag = (x, y, hgt = 22, col = K.saf, col2 = K.saf2) => `<path d="M${x} ${y} V${y - hgt}" stroke="${K.wood3}" stroke-width="2.2" stroke-linecap="round"/><g class="fl" style="transform-origin:${x}px ${y - hgt + 6}px"><path d="M${x} ${y - hgt} q8 -2 15 4 q-8 1 -15 7 Z" fill="${col}"/><path d="M${x} ${y - hgt + 6} q8 -2 15 -2 q-8 1 -15 7 Z" fill="${col2}" opacity=".55"/></g>`;

const SC = (inner, cls = '') => `<svg class="dcs ${cls}" viewBox="0 0 160 150" width="150" height="141" aria-hidden="true">${inner}</svg>`;

// --- Scènes ---
function scPalms(n) {
  return SC(`${island(80, 122, 64)}${tuft(34, 121, 0.7)}${rock(122, 126, 0.9)}${palm(64, 119, 66, -8, n + 1)}${palm(98, 122, 86, 12, n)}${tuft(118, 119, 0.55)}`);
}
function scPalm(n) {
  return SC(`${island(80, 122, 60)}${rock(44, 125, 1)}${rock(56, 127, 0.6)}${palm(84, 121, 88, 13, n)}${tuft(112, 122, 0.75)}${tuft(40, 119, 0.5)}`);
}
// Mur en cours : une brique descend, se pose (petit écrasement, poussière), le rang reste un moment, puis ça recommence.
function scWall() {
  const fy = [79, 88, 97, 106, 115];
  let joints = '', side = '';
  fy.forEach((y, r) => { joints += `M38 ${y} H98 `; for (let x = 38 + (r % 2 ? 7.5 : 15); x < 98; x += 15) joints += `M${x} ${y - 9} v9 `; side += `M98 ${y} l22 -11 `; });
  for (let x = 53; x < 98; x += 15) joints += `M${x} 115 v9 `;
  return SC(`${island(80, 124, 66)}
    ${shadow(92, 126, 46, 9, 0.2)}
    <path d="M26 124 V54 M34 121 V50" stroke="${K.wood2}" stroke-width="3" stroke-linecap="round"/><path d="M26 112 L34 84 M26 84 L34 58" stroke="${K.wood3}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M21 92 l8 -4 h14 l-8 4 Z" fill="${K.wood}"/><path d="M21 92 h14 v3 h-14 Z" fill="${K.wood2}"/><path d="M21 66 l8 -4 h14 l-8 4 Z" fill="${K.wood}"/><path d="M21 66 h14 v3 h-14 Z" fill="${K.wood2}"/>
    <path d="M38 70 l22 -11 h60 l-22 11 Z" fill="${K.tc3}"/>
    <path d="M98 70 l22 -11 v54 l-22 11 Z" fill="${K.tc2}"/><rect x="38" y="70" width="60" height="54" fill="${K.tc}"/>
    <path d="${joints}" stroke="${K.tc2}" stroke-width="1.1" fill="none"/><path d="${side}" stroke="${K.tc3}" stroke-width="1.1" fill="none" opacity=".7"/>
    <path d="M38 70 H98 l22 -11" fill="none" stroke="${K.tcHi}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M59 124 V101 a10 10 0 0 1 20 0 V124 Z" fill="${K.gDk}"/><path d="M59 124 V101 a10 10 0 0 1 20 0 V124" fill="none" stroke="${K.lime}" stroke-width="2.2"/>
    <path d="M104 86 l10 -5 v15 l-10 5 Z" fill="${K.gDk}"/><path d="M104 86 l10 -5 v15 l-10 5 Z" fill="none" stroke="${K.lime2}" stroke-width="1.4"/>
    ${brick(38, 62)}${brick(53, 62)}
    <g class="hs-brick">${brick(68, 62)}</g>
    <g class="hs-dust" fill="${K.sandHi}"><circle cx="66" cy="70" r="3.2"/><circle cx="86" cy="70" r="2.6"/><circle cx="76" cy="60" r="2"/></g>
    ${flag(120, 59, 24)}
    ${brick(118, 119, 13, 7, 5, -2.5)}${brick(124, 112, 13, 7, 5, -2.5)}${cone(30, 130)}`, 'wall');
}
// Petite maison finie : murs à la chaux, bandeau de zellige, porte en arc, lanterne qui palpite, plante en pot.
function scRiad() {
  let merl = '';
  for (let x = 40; x < 100; x += 12.4) merl += `<path d="M${f(x)} 66 v-6 l3 -1.5 h7 v7.5 Z" fill="${K.lime}"/><path d="M${f(x + 10)} 58.5 l3 -1.5 v7.5 l-3 1.5 Z" fill="${K.lime2}"/>`;
  let zel = '';
  for (let x = 45; x < 98; x += 9) zel += `<path d="M${x} 72.5 l3 -3 l3 3 l-3 3 Z" fill="${K.saf}"/>`;
  return SC(`${island(80, 124, 66)}${shadow(94, 126, 48, 9, 0.2)}
    <path d="M40 66 l22 -11 h60 l-22 11 Z" fill="${K.lime2}"/>
    <path d="M100 66 l22 -11 v58 l-22 11 Z" fill="${K.lime2}"/><path d="M100 66 l22 -11 v10 l-22 11 Z" fill="${K.lime3}" opacity=".5"/>
    <rect x="40" y="66" width="60" height="58" fill="${K.lime}"/>
    <rect x="40" y="68" width="60" height="9" fill="${K.g1}"/>${zel}<path d="M100 68 l22 -11 v9 l-22 11 Z" fill="${K.gDk}"/>
    ${merl}
    <path d="M56 124 V99 a11 11 0 0 1 22 0 V124 Z" fill="${K.g1}"/><path d="M67 88 V124" stroke="${K.gDk}" stroke-width="1.6"/><circle cx="63.5" cy="108" r="1.6" fill="${K.saf}"/><circle cx="70.5" cy="108" r="1.6" fill="${K.saf}"/>
    <path d="M53 124 V99 a14 14 0 0 1 28 0 V124" fill="none" stroke="${K.saf}" stroke-width="2.6"/>
    <path d="M85 104 v-9 a4.5 4.5 0 0 1 9 0 v9 Z" fill="${K.gDk}"/><path d="M85 99 h9 M89.5 92 v12" stroke="${K.saf}" stroke-width="1"/>
    <path d="M106 90 l10 -5 v-7 a5 6 0 0 0 -10 5 Z" fill="${K.gDk}"/>
    <g class="lan"><circle cx="47" cy="94" r="9" fill="${K.safHi}" opacity=".35"/><path d="M47 84 v4" stroke="${K.ink}" stroke-width="1.4"/><path d="M43.5 88 h7 l1 9 h-9 Z" fill="${K.safHi}"/><path d="M43.5 88 h7 l1 9 h-9 Z" fill="none" stroke="${K.saf2}" stroke-width="1.4"/></g>
    <path d="M104 128 l2 9 h10 l2 -9 Z" fill="${K.tc}"/><path d="M112 128 l-1 9 h5 l2 -9 Z" fill="${K.tc2}"/><rect x="102.5" y="125.5" width="17" height="4" rx="2" fill="${K.tcHi}"/>${tuft(111, 126, 0.75)}
    ${flag(122, 55, 22, '#C9474C', '#7E1C20')}${tuft(30, 123, 0.6)}`, 'riad');
}
// Grue : le chariot va et vient sous la flèche, la charge de briques se balance au bout du câble.
function scCrane() {
  let lat = '', jib = '';
  for (let y = 118; y > 44; y -= 12) lat += `M64 ${y} L76 ${y - 6} L64 ${y - 12} `;
  for (let x = 82; x < 146; x += 10) jib += `M${x} 37 l5 -6 l5 6 `;
  return SC(`${island(72, 124, 60)}${shadow(72, 126, 26, 7, 0.22)}
    <path d="M56 124 l5 -2.5 h22 l-5 2.5 Z" fill="${K.lime}"/><rect x="56" y="124" width="22" height="7" fill="${K.lime2}"/><path d="M78 124 l5 -2.5 v7 l-5 2.5 Z" fill="${K.lime3}"/>
    <path d="M64 124 V44 M76 124 V44" stroke="${K.saf}" stroke-width="3.2" stroke-linecap="round"/><path d="M76 124 V44" stroke="${K.saf2}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="${lat}" fill="none" stroke="${K.saf}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M70 12 L146 31 M70 12 L34 33 M70 12 V30" stroke="${K.steel}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M30 31 H152 M82 37 H148" stroke="${K.saf}" stroke-width="3" stroke-linecap="round"/><path d="${jib}" fill="none" stroke="${K.saf2}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="30" y="33" width="18" height="13" rx="2" fill="${K.steel}"/><rect x="30" y="33" width="18" height="5" rx="2" fill="#7A8088"/>
    <rect x="59" y="28" width="23" height="18" rx="3.5" fill="${K.safHi}"/><path d="M73 28 h5.500 a3.5 3.500 0 0 1 3.500 3.500 v11 a3.500 3.500 0 0 1 -3.500 3.500 h-5.500 Z" fill="${K.saf}"/><rect x="62.500" y="31.500" width="9" height="8" rx="1.500" fill="${K.glass}"/>
    <g class="cr-trolley"><rect x="125" y="36" width="14" height="5.500" rx="2" fill="${K.steel2}"/>
      <g class="cr-load" style="transform-origin:132px 41px"><path d="M132 41 V74" stroke="${K.ink}" stroke-width="1.5"/><path d="M132 74 l-12 9 M132 74 l12 9" stroke="${K.ink}" stroke-width="1.3"/>
        ${brick(118, 83, 12, 7, 5, -2.5)}${brick(130, 83, 12, 7, 5, -2.5)}${brick(124, 76, 12, 7, 5, -2.5)}<path d="M116 90 l5 -2.500 h26 l-5 2.500 Z" fill="${K.wood}"/><rect x="116" y="90" width="26" height="3" fill="${K.wood2}"/></g></g>
    ${brick(100, 119, 13, 7, 5, -2.5)}${brick(96, 126, 13, 7, 5, -2.5)}${cone(36, 128)}${tuft(26, 122, 0.55)}`, 'crane');
}
// Bétonnière : la cuve tourne (ses bandes défilent), toute la machine tremble, un tas de sable et une pelle à côté.
function scMixer() {
  return SC(`<defs><clipPath id="mx-clip"><path d="M56 66 C58 56 106 56 108 66 L103 98 C101 107 63 107 61 98 Z"/></clipPath></defs>
    ${island(80, 124, 62)}${shadow(86, 126, 36, 8, 0.22)}
    <path d="M22 126 q16 -30 36 0 Z" fill="${K.sand2}"/><path d="M22 126 q16 -30 36 0 q-12 -14 -22 -6 Z" fill="${K.sandHi}"/>
    <path d="M50 96 L40 120" stroke="${K.wood2}" stroke-width="3" stroke-linecap="round"/><path d="M36 117 l9 3 l-3 9 q-7 0 -9 -5 Z" fill="${K.steel}"/>
    <g class="mx-jit">
      <path d="M66 124 L76 100 M104 124 L94 100" stroke="${K.ink}" stroke-width="4.200" stroke-linecap="round"/><path d="M62 112 H110" stroke="${K.steel2}" stroke-width="3.400" stroke-linecap="round"/>
      <g transform="rotate(-22 82 84)">
        <path d="M56 66 C58 56 106 56 108 66 L103 98 C101 107 63 107 61 98 Z" fill="${K.or}"/>
        <g clip-path="url(#mx-clip)"><g class="mx-bands" fill="${K.or2}"><path d="M40 60 l8 0 l8 50 l-8 0 Z"/><path d="M62 60 l8 0 l8 50 l-8 0 Z"/><path d="M84 60 l8 0 l8 50 l-8 0 Z"/><path d="M106 60 l8 0 l8 50 l-8 0 Z"/><path d="M128 60 l8 0 l8 50 l-8 0 Z"/></g>
          <path d="M92 56 C100 58 108 62 108 66 L103 98 C102 103 96 106 90 106 Z" fill="#8E4526" opacity=".35"/><path d="M58 80 H106 v6 H58 Z" fill="${K.steel2}" opacity=".85"/></g>
        <ellipse cx="82" cy="62" rx="26" ry="8.500" fill="${K.or2}"/><ellipse cx="82" cy="62" rx="21" ry="6.200" fill="#4A2E1C"/><ellipse class="mx-mix" cx="82" cy="64" rx="15" ry="3.600" fill="#A9A498"/>
      </g>
      <rect x="100" y="96" width="20" height="18" rx="3" fill="${K.g1}"/><path d="M112 96 h5 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-5 Z" fill="${K.gDk}"/><path d="M103.500 101 h6 M103.500 105 h6 M103.500 109 h6" stroke="${K.gHi}" stroke-width="1.300" stroke-linecap="round"/>
      <circle cx="66" cy="123" r="9" fill="${K.ink}"/><circle cx="66" cy="123" r="3.600" fill="${K.saf}"/><circle cx="106" cy="124" r="7.500" fill="${K.ink}"/><circle cx="106" cy="124" r="3" fill="${K.saf}"/>
    </g>
    <g class="mx-puff" fill="${K.lime}"><circle cx="124" cy="90" r="3.200"/><circle cx="129" cy="84" r="2.400"/></g>
    ${tuft(132, 122, 0.6)}`, 'mixer');
}
const SCENES = [scPalms, scWall, scCrane, scRiad, scMixer, scPalm];
// Ancien décor vectoriel (vu de profil), gardé pour la planche d'inventaire.
export const decorSceneSVG = (n) => SCENES[((n % SCENES.length) + SCENES.length) % SCENES.length](n);

// ---------- Décor version 3 (17-18 nov. 2026, validé par l'utilisateur îlot par îlot) ----------
// Îlots en argile vus d'en haut, au même angle que les pastilles, animés en boucle sans couture (Kling, même image
// au début et à la fin, détourés par tests/chemin/detourer.py). Tous sortent au même cadrage : même largeur CSS pour tous.
// Les îlots de droite regardent vers la gauche (vers le chemin) ; ceux de gauche sont retournés en CSS (.dc.l .dc-vid).
// Safari/iPhone lit le .mov (HEVC avec transparence), Chrome/Android le .webm (VP9 avec transparence).
const V3 = 'assets/decor-v3/';
export const decorVideo = (nom) => `<video class="dc-vid" autoplay muted loop playsinline preload="auto" poster="${V3}${nom}.png" aria-hidden="true">`
  + `<source src="${V3}${nom}.mov" type='video/mp4; codecs="hvc1"'><source src="${V3}${nom}.webm" type="video/webm"></video>`;
const SCENES_V3 = ['palmiers', 'maison', 'grue'];
export const decorScene = (n) => decorVideo(SCENES_V3[((n % SCENES_V3.length) + SCENES_V3.length) % SCENES_V3.length]);
// Socle seul, pour poser une cigogne dessus.
export const decorIsland = (wide = false) => `<svg class="dc-isle" viewBox="0 0 160 44" width="150" height="41" aria-hidden="true">${island(80, 18, wide ? 70 : 58, { ry: wide ? 16 : 14 })}${tuft(wide ? 22 : 30, 18, 0.55)}${rock(wide ? 142 : 130, 22, 0.7)}</svg>`;
// Petits remplissages posés au bord, du côté de la pastille quand il reste de la place.
// Version 3 : deux petits cailloux en argile, fixes, en alternance (choix de l'utilisateur, 18 nov.).
export const decorFiller = (n) => `<img class="dcf-img" src="${V3}caillou-${((n % 2) + 2) % 2 ? 'b' : 'a'}-cadre.png" alt="" width="60" height="60">`;
// Ancienne version vectorielle, gardée pour la planche d'inventaire.
export function decorFillerSVG(n) {
  const v = [
    `${shadow(30, 44, 18, 5, 0.16)}${rock(26, 44, 1.1)}${rock(40, 46, 0.7)}${tuft(40, 43, 0.6)}`,
    `${shadow(30, 44, 16, 4.500, 0.16)}${tuft(24, 44, 0.9)}${tuft(36, 45, 0.65)}`,
    `${shadow(32, 46, 20, 5, 0.18)}${brick(16, 38, 13, 7, 5, -2.5)}${brick(30, 38, 13, 7, 5, -2.5)}${brick(23, 31, 13, 7, 5, -2.5)}${cone(46, 48)}`,
    `${shadow(30, 45, 15, 4.500, 0.16)}<g class="tf" style="transform-origin:30px 45px"><path d="M30 45 C22 40 18 30 20 22 C26 28 30 36 30 45 C28 34 30 22 34 14 C38 24 36 36 30 45 C34 38 40 32 46 30 C44 38 38 43 30 45 Z" fill="${K.g2}"/><path d="M30 45 C28 34 30 22 34 14" fill="none" stroke="${K.gHi}" stroke-width="1.200" opacity=".7"/></g>`,
  ];
  return `<svg class="dcf" viewBox="0 0 60 54" width="60" height="54" aria-hidden="true">${v[((n % v.length) + v.length) % v.length]}</svg>`;
}
