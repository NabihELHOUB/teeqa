import { bellarejRig } from './bellarej-rig.js';
// Illustrations SVG au trait — DA TEEQA (brand-source) : « tout est dessiné au trait »,
// encre 1–3 px bouts arrondis sur chaux, ou chaux sur vert de Fès ; safran rare (ce qui bouge / valide).
// Interprétation du chemin Duolingo : une cheffe de chantier fictive dessinée au trait, assise sur des
// briques, truelle en main, verre de thé au-dessus d'un brasero (kanoun) — visage, mains, objet, flamme animés.

const C = {
  chaux: '#F1ECE2', paper: '#E8E1D3', ink: '#1A1C20', ink2: '#4A4A48', fes: '#0E3B31', fes2: '#14503F', fesInk: '#E9E4D6',
  saffron: '#E2A33B', pise: '#B8603A', rouge: '#A8262C',
  // alias conservés pour les photos simulées
  night: '#0E3B31', surface: '#14503F', danger: '#A8262C', success: '#14503F', saffronEdge: '#B07A1E',
  brick: '#C2683F', brickEdge: '#9A4D2C', plaster: '#E8D3AE', plasterShade: '#D4BA8E', zellige: '#1F7A6A',
};

// ---------- Logo officiel (tracés de brand-source/logo-symbole.svg) ----------
export function logoSymbol(size = 40, color = 'currentColor', { draw = false } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="logo-symbol ${draw ? 'draw' : ''}">
    <rect x="3" y="3" width="34" height="34" pathLength="1"/><path d="M13 35V21a7 7 0 1 1 14 0v14" pathLength="1"/><path d="M20 3v5M3 20h5M37 20h-5" pathLength="1"/></svg>`;
}
// Mot-marque : Archivo 125 %, 900, capitales ; les lettres montent une à une (décalage 80 ms)
export function wordmark(cls = '') {
  return `<span class="wordmark ${cls}" role="img" aria-label="TEEQA">${'TEEQA'.split('').map((l, i) => `<span style="animation-delay:${i * 80}ms" aria-hidden="true">${l}</span>`).join('')}</span>`;
}
export const logoMark = (size = 64, color = 'currentColor') => logoSymbol(size, color);

// ---------- Porte-portail (tracés de brand-source/porte-portail.svg, recadrés) ----------
export function doorPortal({ stroke = C.ink, door = C.fes, draw = true, stars = C.fes } = {}) {
  return `<svg viewBox="500 340 760 670" class="portal ${draw ? 'draw' : ''}" role="img" aria-label="Porte marocaine dessinée au trait">
  <defs>
    <clipPath id="door-z"><path d="M720 1000 L720 600 A100 100 0 1 1 880 600 L880 1000 Z"/></clipPath>
  </defs>
  <g clip-path="url(#door-z)" class="zellige">
    <rect x="700" y="540" width="200" height="470" fill="#0E3B31"/>
    ${[0,1,2,3,4,5].map(r => [0,1,2,3].map(c => {
      const x = 712 + c * 42, y = 575 + r * 42;
      const fill = (r + c) % 3 === 0 ? '#234F8E' : (r + c) % 3 === 1 ? '#1F7A6A' : '#14503F';
      return `<polygon points="${x+16},${y} ${x+32},${y+16} ${x+16},${y+32} ${x},${y+16}" fill="${fill}"/><polygon points="${x+16},${y+8} ${x+24},${y+16} ${x+16},${y+24} ${x+8},${y+16}" fill="#E8E1D3" opacity=".55"/>`;
    }).join('')).join('')}
    <rect class="glaze" x="680" y="520" width="70" height="520" fill="rgba(241,236,226,.45)"/>
  </g>
  <g fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">
    <rect x="640" y="360" width="320" height="640" stroke-width="3" pathLength="1"/>
    <path d="M720 1000 L720 600 A100 100 0 1 1 880 600 L880 1000" stroke-width="5" pathLength="1"/>
    <path d="M700 1000 L700 600 A120 120 0 1 1 900 600 L900 1000" stroke-width="2" pathLength="1"/>
    <line x1="640" y1="395" x2="960" y2="395" stroke-width="1.6" pathLength="1"/>
    <path d="M520 1000 V520 H560 V480 H600 V520 H640" stroke-width="2.2" pathLength="1"/>
    <path d="M1080 1000 V540 H1040 V500 H1000 V540 H960" stroke-width="2.2" pathLength="1"/>
    <path d="M1100 1000 V430 H1170 V380 H1210 V430 H1230 V1000" stroke-width="2.2" pathLength="1"/>
    <path d="M500 1000 H1250" stroke-width="2" pathLength="1"/>
  </g>
  <g fill="none" stroke="${stars}" stroke-width="2" opacity=".6">${[672, 736, 800, 864, 928].map(x => `<path d="M${x} 364 L${x + 4} 376 L${x + 16} 380 L${x + 4} 384 L${x} 396 L${x - 4} 384 L${x - 16} 380 L${x - 4} 376 Z"/>`).join('')}</g>
</svg>`;
}

// ---------- Khatam / sceau (brand-source/khatam.svg) : marque un rapport validé, tourne en 18 s ----------
export function khatam(size = 64, { color = C.saffron, bg = 'none', spin = true } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true" class="khatam">${bg !== 'none' ? `<rect width="120" height="120" rx="14" fill="${bg}"/>` : ''}
    <g class="${spin ? 'a-seal' : ''}" fill="none" stroke="${color}" stroke-width="4" style="transform-origin:60px 60px;transform-box:view-box">
    <rect x="25" y="25" width="70" height="70"/><rect x="25" y="25" width="70" height="70" transform="rotate(45 60 60)"/></g>
    <circle cx="60" cy="60" r="16" fill="none" stroke="${color}" stroke-width="4"/></svg>`;
}

// Vantaux de porte (connexion par rôle) : deux vantaux vert clair arrondis en haut, étoile au trait.
export function doorLeaves(star = C.saffron) {
  const leaf = (side) => `<span class="leaf ${side}"><svg viewBox="0 0 40 100" aria-hidden="true"><path d="M20 34 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z" fill="none" stroke="${star}" stroke-width="1.8"/></svg></span>`;
  return `<span class="leaves">${leaf('l')}${leaf('r')}</span>`;
}

// ---------- Personnage au trait (animé) ----------
export function workerScene() {
  const S = `stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  return `
<svg viewBox="0 0 190 210" class="anim" role="img" aria-label="Illustration animée : cheffe de chantier au trait, assise près d'un brasero">
  <path d="M16 190 H176" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
  <g fill="${C.chaux}" stroke="${C.pise}" stroke-width="2" stroke-linejoin="round">
    <rect x="44" y="134" width="64" height="15" rx="2"/>
    <rect x="40" y="150" width="34" height="16" rx="2"/><rect x="76" y="150" width="36" height="16" rx="2"/>
    <rect x="42" y="167" width="70" height="16" rx="2"/>
    <path d="M76 134v15M58 167v16M88 167v16" fill="none"/>
  </g>
  <g fill="${C.paper}" ${S}>
    <path d="M54 140 q10 -8 22 0 l-2 10 q-9 4 -18 0z"/>
    <path d="M78 140 q12 -8 24 0 l-2 10 q-10 4 -20 0z"/>
    <path d="M56 150 l-4 24 h12 l2 -24z"/><path d="M90 150 l4 24 h12 l-4 -24z"/>
  </g>
  <g fill="${C.ink}"><path d="M44 174 q2 -5 10 -5 h12 v7 h-22z"/><path d="M92 169 h12 q9 0 10 5 v2 h-22z"/></g>
  <path d="M56 98 q20 -10 40 0 l4 38 q-24 9 -48 0z" fill="${C.fes2}" ${S}/>
  <path d="M70 96 l6 12 l6 -12" fill="none" stroke="${C.chaux}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="a-arm-l vb" style="transform-origin: 62px 102px">
    <path d="M60 102 q-14 14 -4 28 q6 6 18 -2" fill="none" stroke="${C.ink}" stroke-width="11" stroke-linecap="round"/>
    <path d="M60 102 q-14 14 -4 28 q6 6 18 -2" fill="none" stroke="${C.fes2}" stroke-width="6.5" stroke-linecap="round"/>
    <circle cx="76" cy="126" r="5.5" fill="${C.paper}" ${S}/>
    <path d="M70 111 l12 0 l-2 14 l-8 0z" fill="${C.chaux}" ${S}/>
    <path d="M72 117 l8 0 l-1 6 l-6 0z" fill="${C.saffron}"/>
    <g fill="none" stroke="${C.ink2}" stroke-width="1.6" stroke-linecap="round">
      <path class="a-steam" d="M74 106 q-3 -5 0 -9 q3 -4 0 -8"/><path class="a-steam d2" d="M79 106 q-3 -5 0 -9 q3 -4 0 -8"/>
    </g>
  </g>
  <g transform="translate(77 96) scale(1.22) translate(-77 -96)"><g class="a-head vb" style="transform-origin: 77px 96px">
    <path d="M72 86 v10 h10 v-10" fill="${C.paper}" ${S}/>
    <ellipse cx="77" cy="72" rx="18.5" ry="19.5" fill="${C.paper}" ${S}/>
    <path d="M57 72 q-4 3 0 7" fill="none" ${S}/>
    <path d="M57 64 q0 -20 20 -20 q20 0 20 20z" fill="${C.chaux}" ${S}/>
    <path d="M52 66 h50" ${S}/><path d="M58 60 h38" stroke="${C.pise}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M77 44 v15" ${S}/>
    <g class="a-brow"><path d="M67 71 q4 -3 8 0 M81 71 q4 -3 8 0" fill="none" ${S}/></g>
    <g class="a-blink vb" style="transform-origin: 78px 77px"><circle cx="71" cy="77" r="2.6" fill="${C.ink}"/><circle cx="85" cy="77" r="2.6" fill="${C.ink}"/></g>
    <path class="a-mouth-smile" d="M73 85 q5 5 10 0" fill="none" ${S}/>
    <ellipse class="a-mouth-o" cx="79" cy="86.5" rx="2.4" ry="2.8" fill="none" ${S}/>
  </g></g>
  <g class="a-arm-r vb" style="transform-origin: 96px 102px">
    <path d="M96 102 q16 6 22 18" fill="none" stroke="${C.ink}" stroke-width="11" stroke-linecap="round"/>
    <path d="M96 102 q16 6 22 18" fill="none" stroke="${C.fes2}" stroke-width="6.5" stroke-linecap="round"/>
    <circle cx="119" cy="122" r="5.5" fill="${C.paper}" ${S}/>
    <path d="M121 118 l6 -6" ${S}/>
    <path d="M124 110 l20 -6 l-6 18z" fill="${C.chaux}" ${S}/>
  </g>
  <g transform="translate(138 136)">
    <path class="a-flame" d="M18 2 q12 14 10 24 q-2 10 -10 10 q-10 0 -11 -10 q-1 -9 5 -14 q0 6 4 8 q-3 -10 2 -18z" fill="${C.saffron}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>
    <path class="a-flame inner" d="M18 18 q6 7 4 12 q-2 4 -4 4 q-4 0 -4 -4 q0 -5 4 -12z" fill="${C.chaux}"/>
    <circle class="a-spark" cx="22" cy="4" r="1.6" fill="${C.saffron}"/><circle class="a-spark d2" cx="12" cy="8" r="1.3" fill="${C.saffron}"/>
    <path d="M0 32 h36 l-4 14 h-28z" fill="${C.chaux}" stroke="${C.pise}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-2 31 h40" ${S}/><path d="M8 40 h20" stroke="${C.pise}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M7 46 v6 M29 46 v6" ${S}/>
  </g>
</svg>`;
}

// ---------- Maison au trait qui se construit (niveau 0..6) ----------
// 0 terrain piqueté · 1 fondations · 2 murs · 3 dalle + acrotère · 4 porte en arc outrepassé + fenêtres
// 5 enduits + frise d'étoiles · 6 finitions (palmier au trait, sceau safran)
const prefersDark = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
export function houseSVG(level = 0, { crane = true, label = '', dark = prefersDark() } = {}) {
  const L = Math.max(0, Math.min(6, level));
  const ink = dark ? C.fesInk : C.ink;
  const fill = dark ? C.fes : C.chaux;
  const S = (w = 2) => `stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const plan = (on, svg) => on ? svg : `<g opacity=".3" stroke-dasharray="4 5">${svg}</g>`;
  const hatch = L >= 2 && L < 5 ? Array.from({ length: 4 }, (_, r) => `<path d="M42 ${90 + r * 12} h116" stroke="${C.pise}" stroke-width="1.1" opacity=".75"/>`).join('') : '';
  return `
<svg viewBox="0 0 200 170" class="anim house" role="img" aria-label="Maison au trait, niveau ${L} sur 6${label ? ' — ' + label : ''}">
  <path d="M8 146 H192" ${S(1.6)} opacity=".6"/>
  ${crane && L >= 1 && L <= 5 ? `<g>
    <path d="M174 146 V36" ${S(2)}/><path d="M170 146 l4 -8 l4 8" ${S(1.4)}/>
    <g class="a-crane vb" style="transform-origin: 174px 38px">
      <path d="M112 36 H188" ${S(2)}/><path d="M174 36 l-14 -8 M174 36 l12 -8" ${S(1.2)}/>
      <g class="a-hook"><path d="M128 36 v24" ${S(1.2)}/><rect x="121" y="60" width="14" height="8" fill="none" stroke="${C.pise}" stroke-width="1.6"/></g>
    </g></g>` : ''}
  ${L === 0 ? `<g fill="none" stroke="${C.pise}" stroke-width="2" stroke-linecap="round"><path d="M36 146v-14M164 146v-14"/><path d="M36 134h128" stroke-dasharray="5 6"/></g>` : ''}
  ${plan(L >= 1, `<path d="M32 138 H168 V146 H32z" ${S(2)}/>${[48, 72, 96, 120, 144].map(x => `<path d="M${x} 138 v8" ${S(1.2)}/>`).join('')}`)}
  ${plan(L >= 2, `<rect x="40" y="78" width="120" height="60" fill="${fill}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>${hatch}`)}
  ${L >= 5 ? `<g fill="none" stroke="${dark ? C.saffron : C.fes}" stroke-width="1.2">${Array.from({ length: 10 }, (_, i) => `<path d="M${48 + i * 11} 124 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1 l4 -1z"/>`).join('')}</g><path d="M40 120 H160" ${S(1)} opacity=".6"/>` : ''}
  ${plan(L >= 3, `<path d="M34 78 H166 V70 H34z" fill="${fill}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M36 70 v-7 h10 v4 h10 v-4 h10 v4 h10 v-4 h10 v4 h10 v-4 h10 v4 h10 v-4 h10 v4 h10 v-4 h10 v4 h10 v-4 h8 v7" ${S(1.6)}/>`)}
  ${plan(L >= 4, `
    <path d="M90 138 V112 A11 11 0 1 1 110 112 V138" fill="${L >= 5 ? (dark ? C.fes2 : C.fes) : fill}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M86 138 V111 A14 14 0 1 1 114 111 V138" ${S(1.1)}/>
    <path d="M56 112 V98 A7 7 0 1 1 70 98 V112z M130 112 V98 A7 7 0 1 1 144 98 V112z" ${S(1.8)}/>
    <path d="M63 90 v22 M137 90 v22" ${S(1)}/>`)}
  ${L === 4 ? `<path d="M150 136 v-18 h8 M46 86 h10 v8" stroke="${C.rouge}" stroke-width="1.6" fill="none" stroke-dasharray="3 3"/>` : ''}
  ${L >= 6 ? `<g class="a-bob" ${S(2)}>
      <path d="M22 146 q2 -32 6 -50"/><path d="M28 96 q-14 -4 -20 6 M28 96 q-6 -14 -18 -14 M28 96 q8 -14 20 -10 M28 96 q14 0 16 12"/></g>
    <g transform="translate(150 14)">${khatam(30, { color: C.saffron, spin: true })}</g>` : ''}
  ${L >= 2 && L <= 4 ? `<rect class="a-brick" x="146" y="130" width="14" height="7" fill="${fill}" stroke="${C.pise}" stroke-width="1.6"/>` : ''}
</svg>`;
}

// ---------- Photos de preuve SIMULÉES ----------
// Générées en SVG, toujours marquées « SIMULÉE ». Ce ne sont pas des photos réelles.
// Photos d'illustration générées (Higgsfield), une ou plusieurs par étape. Toujours marquées « SIMULÉE ».
const PHOTOS = [
  ['p0', 'p1', 'p2'],   // 0 terrassement et fondations
  ['p1', 'p2', 'p0', 'p3', 'p4'],   // 1 gros œuvre : murs et poteaux · vague 26 (doigt : Ilyas) : aciers en attente avant le coulage, une image par légende
  ['p6', 'p7'],         // 2 dalle / toiture
  ['p8', 'p9'],         // 3 menuiseries et réseaux
  ['p10', 'p11'],       // 4 enduits et zellige
  ['p12'],              // 5 finitions
];
const CORRECTIONS = { 1: 'p5' };
const READY = new Set(['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12']);
export function photoSrc(stepIndex = 0, variant = 0, { correction = false } = {}) {
  const i = Math.max(0, Math.min(5, stepIndex));
  const list = PHOTOS[i];
  const id = correction && CORRECTIONS[i] ? CORRECTIONS[i] : list[variant % list.length];
  return READY.has(id) ? `assets/photos/${id}.webp` : null;
}
export function photoSVG(stepIndex = 0, variant = 0, { correction = false, stamp = true } = {}) {
  stamp = false;   // 11 nov., décision de l'utilisateur : plus aucune mention « Simulée » sur les photos
  const src = photoSrc(stepIndex, variant, { correction });
  if (src) return `<span class="real-photo" aria-hidden="true"><img src="${src}" alt="" decoding="async" draggable="false"></span>`;
  const sky = ['#BFD9E6', '#D7E6EC', '#F2D7B0', '#C9DCE3'][variant % 4];
  const ang = (variant % 3 - 1) * 6;
  const scenes = [
    // 0 fondations : tranchée + ferraillage
    `<rect x="0" y="190" width="300" height="110" fill="#B79E79"/><path d="M30 230 h240 v40 h-240z" fill="#8F7A5C"/>
     ${Array.from({ length: 10 }, (_, i) => `<path d="M${42 + i * 24} 222 v52" stroke="#5A4A3A" stroke-width="3"/>`).join('')}
     <path d="M36 236 h228 M36 256 h228" stroke="#6B5946" stroke-width="3"/>
     <rect x="200" y="150" width="60" height="40" rx="4" fill="${C.saffron}"/><circle cx="214" cy="194" r="9" fill="#333"/><circle cx="248" cy="194" r="9" fill="#333"/>`,
    // 1 gros œuvre : murs de briques
    `<rect x="0" y="210" width="300" height="90" fill="#B9A586"/>
     <rect x="40" y="110" width="200" height="110" fill="${C.brick}"/>
     ${Array.from({ length: 9 }, (_, r) => `<path d="M40 ${122 + r * 12} h200" stroke="${C.brickEdge}" stroke-width="2"/>` + Array.from({ length: 8 }, (_, c) => `<path d="M${52 + c * 26 + (r % 2) * 13} ${110 + r * 12} v12" stroke="${C.brickEdge}" stroke-width="2"/>`).join('')).join('')}
     <rect x="120" y="150" width="40" height="70" fill="#4A3B30"/>
     ${correction ? `<rect x="54" y="132" width="56" height="34" fill="#D9A07C"/><path d="M54 132 h56 v34 h-56z" fill="none" stroke="${C.success}" stroke-width="4" stroke-dasharray="6 4"/>` : `<path d="M70 130 l14 18 l-6 10 l12 14" stroke="#3A2A20" stroke-width="3" fill="none"/>`}`,
    // 2 dalle / toiture
    `<rect x="0" y="220" width="300" height="80" fill="#B9A586"/>
     <rect x="40" y="130" width="220" height="90" fill="#C9C4B8"/>
     <rect x="30" y="112" width="240" height="20" fill="#9AA3A0"/>
     ${Array.from({ length: 8 }, (_, i) => `<rect x="${46 + i * 28}" y="132" width="6" height="88" fill="#C7A16B"/>`).join('')}
     <path d="M30 112 v-14 h20 v8 h20 v-8 h20 v8 h20 v-8 h20 v8 h20 v-8 h20 v8 h20 v-8 h20 v8 h20 v-8 h20 v14z" fill="#A9B1AE"/>`,
    // 3 menuiseries + réseaux
    `<rect x="0" y="0" width="300" height="300" fill="#D9D2C3"/>
     <rect x="20" y="20" width="260" height="230" fill="#E6DFD1"/>
     <path d="M110 230 v-90 a40 40 0 0 1 80 0 v90z" fill="#7B5A3C"/>
     <path d="M118 230 v-88 a32 32 0 0 1 64 0 v88" fill="none" stroke="${C.saffron}" stroke-width="4"/>
     <path d="M40 60 h60 v80 M240 40 v120 h20" stroke="#E07B39" stroke-width="5" fill="none"/>
     <rect x="225" y="160" width="30" height="40" rx="3" fill="#F7F3EA" stroke="#999"/>`,
    // 4 enduits + zellige
    `<rect x="0" y="0" width="300" height="300" fill="${C.plaster}"/>
     <rect x="0" y="200" width="300" height="100" fill="#EDE3CF"/>
     ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 20}" y="186" width="14" height="14" transform="rotate(45 ${i * 20 + 7} 193)" fill="${i % 2 ? C.zellige : C.saffron}"/>`).join('')}
     <path d="M100 186 v-80 a50 50 0 0 1 100 0 v80" fill="none" stroke="#C9AE80" stroke-width="10"/>`,
    // 5 finitions
    `<rect x="0" y="210" width="300" height="90" fill="#9CC59A"/>
     <rect x="50" y="100" width="200" height="115" fill="${C.plaster}"/>
     <path d="M44 100 v-12 h18 v6 h18 v-6 h18 v6 h18 v-6 h18 v6 h18 v-6 h18 v6 h18 v-6 h18 v6 h18 v-6 h18 v12z" fill="#F3E6CC"/>
     <path d="M130 215 v-50 a20 20 0 0 1 40 0 v50z" fill="${C.surface}"/>
     <path d="M70 160 v-24 a12 12 0 0 1 24 0 v24z M206 160 v-24 a12 12 0 0 1 24 0 v24z" fill="#9FC9D8"/>`,
  ];
  const body = scenes[Math.max(0, Math.min(5, stepIndex))];
  return `<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="300" height="300" fill="${sky}"/>
    <g transform="rotate(${ang} 150 150) translate(0 ${variant * 4})">${body}</g>
    ${stamp ? `<rect x="8" y="8" width="96" height="22" rx="6" fill="rgba(8,38,31,.8)"/>
    <text x="56" y="23.5" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="11" fill="#F1ECE2" letter-spacing="1">SIMULÉE</text>` : ''}
  </svg>`;
}

// ---------- Signature (rendu des points) ----------
export function signatureSVG(strokes = [], { w = 300, h = 120, color = C.night } = {}) {
  const d = strokes.map(s => s.length ? 'M' + s.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') : '').join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" aria-label="Signature"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export { C as COLORS };

// ---------- Images « matière » générées (Higgsfield) : icônes 3D d'étapes et Bellarej, la cigogne ----------
const STEP_3D = ['1-fondations', '2-gros-oeuvre', '3-dalle-toiture', '4-menuiseries-reseaux', '5-enduits-zellige', '6-finitions-cles'];
// Un chantier peut avoir moins ou plus de 6 étapes : on répartit les 6 icônes sur sa longueur.
export function stepIcon3D(i, n = 6, size = 88, cls = '') {
  const k = n <= 1 ? 5 : Math.round((i * 5) / (n - 1));
  return `<img class="step3d ${cls}" src="assets/etapes/etape-${STEP_3D[Math.max(0, Math.min(5, k))]}.webp" width="${size}" height="${size}" alt="" aria-hidden="true" decoding="async" draggable="false">`;
}
// ---------- Icônes d'étapes en vecteur plat (11 nov.) ----------
// Essayées partout le 11 nov., puis décision de l'utilisateur : dans l'appli, on garde les icônes 3D (stepIcon3D) et la maison
// au trait (houseSVG). Les icônes plates ne servent que sur le premier écran d'accueil (« Votre chantier, pas à pas »),
// sous l'image, sur une pastille verte. Une même maison vue de face, à six moments du chantier.
const V = { brick: '#C96F45', brickD: '#9A4D2C', hole: '#7A3C20', conc: '#C4BEB1', concD: '#99938A', w: '#FAF6EC', w2: '#E6DCC8',
  g: '#14503F', g2: '#0E3B31', s: '#E2A33B', s2: '#B07A1E', earth: '#DD9166', earthD: '#B8603A', glass: '#BFD9D2', wood: '#C9A16B', k: '#2B2D31', bar: '#6F7480', leaf: '#3F9B78' };   // bar et leaf : lisibles sur la chaux comme sur le vert
// k : 0 fondations · 1 murs et poteaux · 2 dalle et acrotère · 3 menuiseries et réseaux · 4 enduits et zellige · 5 finitions et clés
export function stepArt(k) {
  const ground = `<rect x="5" y="72" width="86" height="15" rx="7.5" fill="${V.earthD}"/><rect x="5" y="66" width="86" height="15" rx="7.5" fill="${V.earth}"/>`;
  const plaster = k >= 4, wall = plaster ? V.w : V.brick, wallD = plaster ? V.w2 : V.brickD, top = plaster ? V.w : V.conc, topD = plaster ? V.w2 : V.concD;
  const mortar = plaster ? '' : `<path d="M24 50.5 H72 M24 58 H72 M24 65.5 H72 M34 43 v7.5 M50 43 v7.5 M64 43 v7.5 M28 50.5 v7.5 M42 50.5 v7.5 M58 50.5 v7.5 M34 58 v7.5 M50 58 v7.5 M64 58 v7.5" stroke="${V.brickD}" stroke-width="1.3" opacity=".55" fill="none"/>`;
  const walls = `<rect x="24" y="43" width="48" height="29" fill="${wall}"/>${mortar}<rect x="65" y="43" width="7" height="29" fill="${wallD}" opacity="${plaster ? .7 : .4}"/>`;
  const slab = `<rect x="19" y="35" width="58" height="9" rx="2.5" fill="${top}"/><rect x="19" y="40.5" width="58" height="3.5" rx="1.75" fill="${topD}"/>
    ${[21, 31.5, 42, 52.5, 63, 68].slice(0, 5).map(x => `<rect x="${x}" y="28.5" width="8" height="8" rx="1.8" fill="${top}"/>`).join('')}<rect x="67" y="28.5" width="8" height="8" rx="1.8" fill="${top}"/>`;
  const arch = (fill) => `<path d="M41 72 V57.5 a7 7 0 0 1 14 0 V72 Z" fill="${fill}"/>`;
  const win = (x, fill, frame) => `<path d="M${x} 62 V55 a3.8 3.8 0 0 1 7.6 0 V62 Z" fill="${fill}" ${frame ? `stroke="${V.w}" stroke-width="1.6" stroke-linejoin="round"` : ''}/>`;
  const openings = arch(V.hole) + win(28.5, V.hole) + win(60, V.hole);
  const joinery = `${arch(V.g)}<path d="M48 50.5 a7 7 0 0 1 7 7 V72 H48 Z" fill="${V.g2}" opacity=".45"/><circle cx="51.6" cy="63" r="1.4" fill="${V.s}"/>${win(28.5, V.glass, true)}${win(60, V.glass, true)}`;
  const band = `${[27, 33, 39, 45, 51, 57, 63, 69].map((x, i) => `<path d="M${x} 44.6 l2.6 2.6 l-2.6 2.6 l-2.6 -2.6 Z" fill="${i % 2 ? V.s : V.g}"/>`).join('')}`;
  const posts = [21, 45, 69].map(x => `<rect x="${x}" y="36" width="6" height="36" rx="1.2" fill="${V.conc}"/><rect x="${x + 4}" y="36" width="2" height="36" fill="${V.concD}" opacity=".6"/><path d="M${x + 1.6} 36 v-6 M${x + 4.2} 36 v-7.5" stroke="${V.bar}" stroke-width="1.5" stroke-linecap="round"/>`).join('');
  const scenes = [
    // 0 · fondations : fouille, semelles en béton avec leurs fers, tas de terre, pelle
    `<rect x="20" y="62" width="56" height="11" rx="4" fill="${V.hole}"/>
     ${[24, 42, 60].map(x => `<rect x="${x}" y="54" width="13" height="13" rx="2.5" fill="${V.conc}"/><rect x="${x}" y="62.5" width="13" height="4.5" rx="2" fill="${V.concD}"/><path d="M${x + 4} 54 v-9 M${x + 9} 54 v-11" stroke="${V.bar}" stroke-width="1.6" stroke-linecap="round"/>`).join('')}
     <path d="M4 70 a9 7 0 0 1 18 0 Z" fill="${V.earthD}"/>
     <path d="M84 30 L78 62" stroke="${V.wood}" stroke-width="4" stroke-linecap="round"/><path d="M80.5 28 h7" stroke="${V.wood}" stroke-width="4" stroke-linecap="round"/><path d="M72.5 60 l10.5 2 l-1.6 9 q-6 3 -10.6 -1.8 Z" fill="${V.concD}"/>`,
    // 1 · gros œuvre : poteaux coulés, murs de brique qui montent (profil en escalier)
    `<path d="M24 72 V54 H36 V47 H50 V54 H60 V60 H72 V72 Z" fill="${V.brick}"/><path d="M24 60 H60 M24 66 H72 M30 54 v6 M44 47 v7 M42 54 v6 M54 54 v6 M34 60 v6 M50 60 v6 M64 60 v6 M36 54 H50" stroke="${V.brickD}" stroke-width="1.3" opacity=".55" fill="none"/>
     ${posts}<rect x="78" y="64" width="9" height="5" rx="1" fill="${V.brick}"/><rect x="80" y="59" width="9" height="5" rx="1" fill="${V.brickD}"/>`,
    // 2 · dalle et toiture-terrasse : murs finis, dalle et acrotère crénelé, ouvertures encore vides
    `${walls}${openings}${slab}`,
    // 3 · menuiseries et réseaux : porte en arc, fenêtres vitrées, colonne d'eau et sa vanne
    `${walls}${joinery}${slab}<path d="M79 72 V52 h-7" fill="none" stroke="${V.concD}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="79" cy="60" r="3.2" fill="${V.s}"/><circle cx="79" cy="60" r="1.2" fill="${V.s2}"/>`,
    // 4 · enduits et zellige : la maison passe à la chaux, frise de zellige sous l'acrotère
    `${walls}${joinery}${slab}${band}`,
    // 5 · finitions et remise des clés : palmier, et la clé
    `${walls}${joinery}${slab}${band}
     <path d="M13 72 q1 -13 3.5 -20" fill="none" stroke="${V.wood}" stroke-width="3.2" stroke-linecap="round"/><path d="M16.5 52 q-8 -3 -11.5 3.5 M16.5 52 q-3 -8.5 -9.5 -8 M16.5 52 q4 -8.5 10.5 -6 M16.5 52 q8.5 0 9 7" fill="none" stroke="${V.leaf}" stroke-width="3.2" stroke-linecap="round"/>
     <g transform="rotate(18 80 62)"><circle cx="80" cy="54.5" r="6" fill="none" stroke="${V.s2}" stroke-width="4.4"/><path d="M80 61.5 V81.5 M80 74.5 h5.4 M80 80 h4" fill="none" stroke="${V.s2}" stroke-width="4.4" stroke-linecap="round"/>
       <circle cx="80" cy="53" r="6" fill="none" stroke="${V.s}" stroke-width="4"/><path d="M80 60 V80 M80 73 h5.4 M80 78.5 h4" fill="none" stroke="${V.s}" stroke-width="4" stroke-linecap="round"/></g>`,
  ];
  return ground + scenes[Math.max(0, Math.min(5, k))];
}
export function stepIconFlat(k, size = 52, cls = '') {
  return `<svg class="stepv ${cls}" viewBox="4 14 88 88" width="${size}" height="${size}" aria-hidden="true">${stepArt(k)}</svg>`;
}
// Bellarej : depuis le 10 nov. (décision de l'utilisateur), c'est la version vectorielle animée de js/bellarej-rig.js partout.
// Les images 3D (assets/mascotte/*.webp) et les vidéos restent sur le disque mais ne sont plus appelées.
// h = hauteur affichée ; alt vide par défaut : Bellarej accompagne, elle ne porte jamais seule une information.
export function bellarej(pose = 'posee', h = 120, opts = {}) {
  return bellarejRig(pose, pose === 'vol' ? Math.round(h * 1.35) : h, opts);
}
const CLIPS = { felicitations: 'felicite', envol: 'vol' };
export function bellarejClip(name, h = 190, opts = {}) { return bellarej(CLIPS[name] || 'posee', h, opts); }
