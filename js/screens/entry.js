// Ouverture, première visite, connexion — DA : on entre dans le chantier par une porte.
import { save, actions, get, reset, ROLES, TEMPLATE_STEPS, TARIFS, dh, PAYS, enDeviseTxt, ORAL_INSCRIPTION } from '../store.js';
// Vague 21 (diaspora) : dès l'accueil, le prix dans la monnaie du pays du téléphone (euros en France, francs en Suisse), avant toute inscription.
const deviseTel = () => { try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; const k = Object.keys(PAYS).find((c) => PAYS[c].tz === tz); return k ? PAYS[k].devise : null; } catch { return null; } };
// Vague 26 (jury n° 1, GPT 9 et 10) : avant le choix du pays, les prix restent en dirhams ; la devise vient après l'inscription.
const prixTel = (n) => dh(n); void deviseTel; void enDeviseTxt;
import { icon } from '../icons.js';
import { logoSymbol, wordmark, doorLeaves, khatam, stepIcon3D, bellarej, stepIconFlat } from '../art.js';
import { esc, sfx, trial, trialPick, avatar, openSheet, closeSheet, roleAvatar, toast } from '../ui.js';
import { bellarejRig } from '../bellarej-rig.js';
import { go } from '../app.js';
import { spring, reduced } from '../motion.js';

// Bellarej vue de face, dessinée en code : aucune pose de face n'existe en image, et au lancement les yeux doivent bouger.
// Emplacement prévu : si une tête de face arrive un jour (assets/mascotte), remplacer ce dessin en gardant les classes.
// Dessin refait le 10 nov. dans le style de la Bellarej de profil (js/bellarej-rig.js) : tête ronde, grands yeux sombres
// à deux reflets, joues, bec épais avec reflet. Les classes (.bf, .bf-open, .bf-shut, .bf-pupil, .bfr-*) n'ont pas changé.
const BF = { w: '#FAF6EC', w2: '#E6DCC8', k: '#2B2D31', o: '#EE9140', o2: '#C96F2A', g: '#14503F', g2: '#0E3B31', s: '#E2A33B' };
const bfEye = (cx, dir) => `<g transform="translate(${cx} 76)"><ellipse rx="18" ry="20.5" fill="#F1E9DA"/>
    <g class="bf-pupil"><ellipse rx="11.5" ry="14.5" fill="${BF.k}"/><circle cx="-4" cy="-6" r="4.4" fill="#fff"/><circle cx="4.5" cy="6.5" r="2" fill="#fff" opacity=".8"/></g>
    <path d="M${13 * dir} -15 C${20 * dir} -13 ${25 * dir} -8 ${27 * dir} -1" fill="none" stroke="${BF.k}" stroke-width="3.4" stroke-linecap="round"/></g>`;
const bfHead = (beakEnd) => `<ellipse cx="110" cy="78" rx="66" ry="61" fill="${BF.w}"/>
    <path d="M52 100 C70 136 150 136 168 100 C150 124 70 124 52 100 Z" fill="${BF.w2}"/>
    <circle cx="62" cy="104" r="11" fill="${BF.o}" opacity=".2"/><circle cx="158" cy="104" r="11" fill="${BF.o}" opacity=".2"/>
    <g class="bf-open">${bfEye(78, -1)}${bfEye(142, 1)}</g>
    <g class="bf-shut" fill="none" stroke="${BF.k}" stroke-width="6" stroke-linecap="round"><path d="M61 82 Q78 64 95 82"/><path d="M125 82 Q142 64 159 82"/></g>
    <path d="M94 96 C98 84 122 84 126 96 C125 134 117 ${beakEnd - 22} 110 ${beakEnd} C103 ${beakEnd - 22} 95 134 94 96 Z" fill="${BF.o}"/>
    <path d="M110 100 C114 130 113 ${beakEnd - 30} 110 ${beakEnd} C117 ${beakEnd - 22} 125 134 126 96 C122 90 116 92 110 100 Z" fill="${BF.o2}" opacity=".55"/>
    <path d="M102 100 C101 122 103 142 106 ${beakEnd - 34}" fill="none" stroke="#F8B26E" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
function bellarejFace() {
  // Une cigogne, pas un hibou : long bec orangé, cou, collier vert et étoile safran de Bellarej.
  return `<svg class="bf" viewBox="0 0 220 250" aria-hidden="true">
    <path d="M84 120 C82 160 80 196 76 250 L144 250 C140 196 138 160 136 120 Z" fill="${BF.w}"/>
    <path d="M122 126 C126 170 128 206 132 250 L144 250 C140 196 138 160 136 120 Z" fill="${BF.w2}"/>
    <path d="M78 204 C97 213 123 213 142 204 L143 224 C123 233 97 233 77 224 Z" fill="${BF.g}"/>
    <path d="M78 218 C97 227 123 227 143 218 L143 224 C123 233 97 233 77 224 Z" fill="${BF.g2}" opacity=".5"/>
    <path d="M110 203 l4.6 10 l10 4.6 l-10 4.6 l-4.6 10 l-4.6 -10 l-10 -4.6 l10 -4.6 z" fill="${BF.s}"/>
    ${bfHead(194)}
  </svg>`;
}
// Bellarej de face, en pied, pour le panneau d'accueil : même tête que le visage du lancement, avec le corps,
// les ailes à bout noir et les pattes. Elle vit toute seule : elle cligne, jette un regard de côté et respire (boucle de 2,6 s,
// mesurée sur la référence de l'utilisateur, enregistrement du 10 nov., 15 h 35). Animation en CSS : classes .bfr*.
function bellarejFront() {
  const foot = (x, c) => `<path d="M${x} 282 L${x} 318 M${x} 318 l-14 7 M${x} 318 l0 10 M${x} 318 l14 7" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg class="bf bfr" viewBox="0 0 220 336" aria-hidden="true">
    <ellipse class="bfr-ground" cx="110" cy="304" rx="88" ry="28"/>
    ${foot(92, BF.o2)}${foot(128, BF.o)}
    <g class="bfr-top">
      <path d="M56 194 C28 222 34 268 68 288 C58 258 58 224 66 196 Z M164 194 C192 222 186 268 152 288 C162 258 162 224 154 196 Z" fill="${BF.k}"/>
      <ellipse cx="110" cy="228" rx="58" ry="64" fill="${BF.w}"/>
      <path d="M58 250 C70 300 150 300 162 250 C146 280 74 280 58 250 Z" fill="${BF.w2}"/>
      <path d="M84 120 C83 140 82 156 80 178 L140 178 C138 156 137 140 136 120 Z" fill="${BF.w}"/>
      <path d="M79 154 C98 163 122 163 141 154 L142 174 C122 183 98 183 78 174 Z" fill="${BF.g}"/>
      <path d="M79 168 C98 177 122 177 142 168 L142 174 C122 183 98 183 78 174 Z" fill="${BF.g2}" opacity=".5"/>
      <path d="M110 196 l4.6 10 l10 4.6 l-10 4.6 l-4.6 10 l-4.6 -10 l-10 -4.6 l10 -4.6 z" fill="${BF.s}"/>
      ${bfHead(186)}
    </g>
  </svg>`;
}
// Accueil, version 3 (18 nov. 2026, validée par l'utilisateur sur comparatif-accueil.html) : même pose, même cadre et même ombre
// que bellarejFront(), mais la nouvelle Bellarej en argile, en vidéo en boucle détourée (assets/decor-v3/bellarej-accueil.*).
// La vidéo a 10 % de marge de chaque côté du personnage ; ses pieds sont au ras du bas, posés au même endroit que l'ancien dessin.
// Accueil 1 (18 nov.) : Bellarej en argile qui bat des ailes (vidéo en boucle détourée) ; la traversée reste en CSS (.onb-fly-x).
function bellarejVol() {
  const V = 'assets/decor-v3/bellarej-vol';
  return `<video class="onb-vid" autoplay muted loop playsinline preload="auto" poster="${V}.png" aria-hidden="true">`
    + `<source src="${V}.mov" type='video/mp4; codecs="hvc1"'><source src="${V}.webm" type="video/webm"></video>`;
}

// Accueil 2 (18 nov.) : Bellarej contrôleur en argile qui photographie avec un iPhone (vidéo en boucle détourée).
function bellarejPhoto() {
  const V = 'assets/decor-v3/bellarej-photo';
  return `<video class="onb-vid-photo" autoplay muted loop playsinline preload="auto" poster="${V}.png" aria-hidden="true">`
    + `<source src="${V}.mov" type='video/mp4; codecs="hvc1"'><source src="${V}.webm" type="video/webm"></video>`;
}

function bellarejAccueil() {
  const V = 'assets/decor-v3/bellarej-accueil';
  return `<svg class="bf bfr" viewBox="0 0 220 336" aria-hidden="true"><ellipse class="bfr-ground" cx="110" cy="304" rx="88" ry="28"/></svg>`
    + `<video class="land-vid" autoplay muted loop playsinline preload="auto" poster="${V}.png" aria-hidden="true">`
    + `<source src="${V}.mov" type='video/mp4; codecs="hvc1"'><source src="${V}.webm" type="video/webm"></video>`;
}
// Lancement, réglé sur la référence de l'utilisateur (enregistrement du 10 nov., 15 h 24) : le visage regarde, cligne,
// grossit en regardant de côté, plisse les yeux, rétrécit, puis l'écran suivant s'ouvre en cercle depuis le centre.
// Le lancement est une surcouche posée sur l'appli : l'écran suivant est déjà dessous quand le cercle s'ouvre.
let launching = false, landing = true;
function launch(next) {
  if (launching) return; launching = true;
  dispatchEvent(new Event('teeqa-lancement'));   // son d'ouverture (js/ui.js) ; l'animation elle-même n'est pas modifiée
  const app = document.getElementById('app');
  const o = document.createElement('div'); o.className = 'launch';
  o.innerHTML = `<div class="launch-face">${bellarejFace()}</div><div class="launch-word">${wordmark()}</div>`;
  app.appendChild(o);
  const face = o.firstElementChild, svg = face.firstElementChild;
  const end = () => { o.remove(); launching = false; dispatchEvent(new Event('resize')); };   // « resize » : la barre d'état reprend la teinte de l'écran
  if (reduced()) { setTimeout(() => { next(); end(); }, 800); return; }
  const at = (ms, fn) => setTimeout(fn, ms);
  at(450, () => svg.classList.add('shut'));
  at(600, () => { svg.classList.remove('shut'); svg.classList.add('look'); face.classList.add('big'); });
  at(1000, () => svg.classList.add('shut'));
  at(1080, () => face.classList.add('tiny'));
  at(1280, () => { next(); o.classList.add('open'); });
  at(1760, end);
}

let slide = 0;

// ---------- Retours de l'utilisateur du 11 nov. sur les écrans d'entrée ----------
// Cadre gravé autour des arches (les trois écrans d'accueil) : clé de voûte en étoile, deux rangs safran. Voir .onb-stage en CSS.
const archDeco = () => `<span class="onb-key" aria-hidden="true">${khatam(26, { spin: false })}</span><span class="onb-foot-l" aria-hidden="true"></span><span class="onb-foot-r" aria-hidden="true"></span>`;
// Pastille verte sous l'image : trois icônes en vecteur plat, une légende courte sous chacune (même gabarit sur les écrans 1 et 2).
const pill = (items, cls = '') => `<div class="onb-steps" data-par="-22"><span class="onb-pill ${cls}">${items.map(([svg, cap], n) => `${n ? '<span class="onb-tiles"><i></i><i></i><i></i></span>' : ''}<span class="onb-ic" style="--n:${n}">${svg}<small>${cap}</small>${n === items.length - 1 && cls.includes('conf') ? `<span class="onb-conf">${'<i></i>'.repeat(10)}</span>` : ''}</span>`).join('')}</span></div>`;
// Trois icônes plates pour l'écran 2 (date, lieu, envoi), dans la palette des icônes d'étapes.
const FI = { w: '#FAF6EC', w2: '#E6DCC8', s: '#E2A33B', s2: '#B07A1E', g: '#3F9B78', g2: '#14503F', p: '#DD9166', p2: '#B8603A', k: '#2B2D31' };
const flat = (inner) => `<svg class="stepv" viewBox="0 0 96 96" width="54" height="54" aria-hidden="true">${inner}</svg>`;
const icDate = () => flat(`<rect x="16" y="24" width="64" height="58" rx="11" fill="${FI.w2}"/><rect x="16" y="20" width="64" height="58" rx="11" fill="${FI.w}"/><path d="M16 40 V31 a11 11 0 0 1 11 -11 H69 a11 11 0 0 1 11 11 V40 Z" fill="${FI.s}"/><rect x="30" y="12" width="7" height="17" rx="3.5" fill="${FI.s2}"/><rect x="59" y="12" width="7" height="17" rx="3.5" fill="${FI.s2}"/><circle cx="48" cy="59" r="11.5" fill="none" stroke="${FI.g2}" stroke-width="4"/><path d="M48 52 V59 L53.5 62.5" fill="none" stroke="${FI.g2}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);
const icPlace = () => flat(`<ellipse cx="48" cy="80" rx="26" ry="7" fill="${FI.p2}"/><ellipse cx="48" cy="77" rx="26" ry="7" fill="${FI.p}"/><path d="M48 78 C36 60 26 50 26 37 a22 22 0 0 1 44 0 C70 50 60 60 48 78 Z" fill="${FI.s}"/><path d="M48 78 C54 68 70 52 70 37 a22 22 0 0 0 -22 -22 Z" fill="${FI.s2}" opacity=".45"/><circle cx="48" cy="37" r="9" fill="${FI.w}"/>`);
const icSync = () => flat(`<path d="M26 70 a15 15 0 0 1 1 -30 a20 20 0 0 1 38 -5 a17.5 17.5 0 0 1 4 35 Z" fill="${FI.w2}"/><path d="M26 66 a15 15 0 0 1 1 -30 a20 20 0 0 1 38 -5 a17.5 17.5 0 0 1 4 35 Z" fill="${FI.w}"/><circle class="sy-ring" cx="66" cy="66" r="15" fill="none" stroke="#7BD0AE" stroke-width="4"/><g class="sy-badge"><circle cx="66" cy="68" r="15" fill="#0A3329"/><circle cx="66" cy="66" r="15" fill="${FI.g}"/><path class="sy-check" d="M59 66.5 l5 5 l9.5 -10" pathLength="1" fill="none" stroke="${FI.w}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></g>`);
// Bellarej qui signe (écran 3) : vue de dos, penchée sur la feuille. Son aile et le stylo sont redessinés à chaque image
// par signer() : la pointe du stylo est posée exactement sur le bout du trait qui se trace (retour de l'utilisateur, 11 nov.).
function bellarejSigne() {
  return `<svg class="sg" viewBox="-44 0 204 214" aria-hidden="true">
    <path d="M70 176 V204 M70 204 l-9 5 M70 204 l9 5 M92 176 V204 M92 204 l-9 5 M92 204 l9 5" fill="none" stroke="${BF.o2}" stroke-width="6" stroke-linecap="round"/>
    <g class="sg-top">
      <path d="M52 168 L46 196 L62 186 L72 200 L82 186 L92 200 L100 186 L116 196 L110 168 Z" fill="${BF.k}"/>
      <ellipse cx="81" cy="132" rx="45" ry="52" fill="${BF.w}"/>
      <path d="M40 150 C46 180 116 180 122 150 C108 170 54 170 40 150 Z" fill="${BF.w2}"/>
      <path d="M116 108 C134 126 132 160 110 176 C118 152 118 128 112 110 Z" fill="${BF.k}"/>
      <defs><clipPath id="sg-body"><ellipse cx="81" cy="132" rx="45" ry="52"/></clipPath></defs>
      <g clip-path="url(#sg-body)"><path d="M30 92 H132 V190 H30 Z" fill="#F2B632"/><path d="M96 92 H132 V190 H104 Z" fill="#D99A1C" opacity=".55"/>
        <path d="M30 138 H132 v11 H30 Z M30 158 H132 v11 H30 Z" fill="#F4EFE4"/><path d="M30 147 H132 v2.500 H30 Z M30 167 H132 v2.500 H30 Z" fill="#BEB7A6"/>
        <path d="M60 92 L76 138 M102 92 L86 138" stroke="#F4EFE4" stroke-width="8"/></g>
      <g class="sg-head"><path d="M66 60 h30 v34 h-30 z" fill="${BF.w}"/><path d="M62 82 C74 89 88 89 100 82 V93 C88 100 74 100 62 93 Z" fill="${BF.g}"/>
        <path d="M58 48 C40 50 22 58 12 70 C28 70 46 66 60 60 Z" fill="${BF.o}"/><circle cx="81" cy="44" r="30" fill="${BF.w}"/><path d="M57 60 C68 74 94 74 105 60 C94 68 68 68 57 60 Z" fill="${BF.w2}"/>
        <path d="M49 42 C49 2 113 2 113 42 Z" fill="#F2B632"/><path d="M84 12 C100 14 110 26 113 42 H100 C99 30 93 20 84 12 Z" fill="#D99A1C" opacity=".6"/><path d="M75 11 h12 v31 h-12 z" fill="#F7CB5A"/>
        <rect x="42" y="37" width="78" height="11" rx="5.500" fill="#D99A1C"/><rect x="42" y="35.500" width="78" height="9" rx="4.500" fill="#F2B632"/></g>
      <circle class="sg-sh" cx="50" cy="118" r=".5" fill="none"/>
    </g>
    <path class="sg-wing-sh" fill="${BF.w2}"/><path class="sg-wing" fill="${BF.w}"/><path class="sg-wing-tip" fill="${BF.k}"/>
    <g class="sg-pen"><path d="M0 0 L-2.6 -8 H2.6 Z" fill="${BF.k}"/><path d="M-2.9 -8 h5.8 v-7 h-5.8 z" fill="${BF.s}"/><path d="M0 -15 V-50" stroke="${BF.g}" stroke-width="5.8" stroke-linecap="round"/><path d="M1.6 -18 V-48" stroke="#3F9B78" stroke-width="1.6" stroke-linecap="round"/></g>
  </svg>`;
}
// Écran 3 en argile (18 nov.) : marionnette en deux morceaux tirés de la même image (signe-a.png, vue de dos).
// Le corps sans l'aile (signe-corps.png) reste fixe ; l'aile avec le stylo (signe-aile.png) pivote à l'épaule et s'étire
// un peu pour que la pointe du stylo soit, à chaque image, au bout du trait de la signature (piloté par signer()).
// Repères en unités de l'image (520 x 708) : épaule (pivot) et pointe de la plume.
const SG3 = { w: 520, h: 708, sh: { x: 280.6, y: 342.9 }, tip: { x: 7, y: 241.1 } };
function bellarejSigneV3() {
  const V = 'assets/decor-v3/';
  return `<svg class="sg v3" viewBox="0 0 ${SG3.w} ${SG3.h}" aria-hidden="true">
    <image class="sg-corps" href="${V}signe-corps.png" width="${SG3.w}" height="${SG3.h}"/>
    <g class="sg-aile"><image href="${V}signe-aile.png" width="${SG3.w}" height="${SG3.h}"/></g>
    <circle class="sg-sh" cx="${SG3.sh.x}" cy="${SG3.sh.y}" r=".5" fill="none"/>
  </svg>`;
}
// Pilote de la signature : une seule horloge pour le trait et pour la pointe du stylo, donc aucun décalage possible.
// La cigogne avance avec sa main (elle suit le stylo d'un pas), l'aile s'allonge ou se replie pour le reste.
function signer(root) {
  const sig = root.querySelector('.onb-sig'), sg = root.querySelector('.sg'), none = { start() {}, reset() {} };
  if (!sig || !sg || !sig.getScreenCTM) return none;
  const [p1, p2] = sig.querySelectorAll('path'), L1 = p1.getTotalLength(), L2 = p2.getTotalLength();
  const move = root.querySelector('.sg-move'), wing = sg.querySelector('.sg-wing'), wsh = sg.querySelector('.sg-wing-sh'), wtip = sg.querySelector('.sg-wing-tip'), pen = sg.querySelector('.sg-pen'), sh = sg.querySelector('.sg-sh');
  const A = p1.getPointAtLength(0), B = p1.getPointAtLength(L1), C = p2.getPointAtLength(0), D = p2.getPointAtLength(L2), app = document.getElementById('app');
  const f = (v) => v.toFixed(1), mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const quad = (a, c, b, t) => mix(mix(a, c, t), mix(c, b, t), t);
  let raf = 0, bx = null;
  const v3 = sg.classList.contains('v3'), aile = sg.querySelector('.sg-aile');
  const v0 = { x: SG3.tip.x - SG3.sh.x, y: SG3.tip.y - SG3.sh.y }, l0 = Math.hypot(v0.x, v0.y), a0 = Math.atan2(v0.y, v0.x) * 180 / Math.PI;
  function pose3(pt, lift, snap) {   // argile : le corps suit la plume à 90 % (par rapport à sa place au repos, pour que l aile ne s étire presque pas), l'aile fait le reste
    const m = sig.getScreenCTM(); if (!m) return;
    const k = app.getBoundingClientRect().width / app.offsetWidth || 1, scr = new DOMPoint(pt.x, pt.y).matrixTransform(m);
    const tip = new DOMPoint(SG3.tip.x, SG3.tip.y).matrixTransform(sg.getScreenCTM()), base = tip.x - (bx || 0) * k;
    const tx = ((scr.x - base) * 0.9) / k;
    bx = tx;   // pas de retard : l'aile en image ne peut pas s'allonger beaucoup, le corps suit donc la plume directement
    move.style.transform = `translate3d(${bx.toFixed(2)}px,0,0)`;
    const T = new DOMPoint(scr.x, scr.y).matrixTransform(sg.getScreenCTM().inverse()); T.y -= lift * 2.4;
    const v = { x: T.x - SG3.sh.x, y: T.y - SG3.sh.y }, a = Math.atan2(v.y, v.x) * 180 / Math.PI, q = Math.hypot(v.x, v.y) / l0;
    aile.setAttribute('transform', `translate(${f(SG3.sh.x)} ${f(SG3.sh.y)}) rotate(${f(a)}) scale(${q.toFixed(3)} 1) rotate(${f(-a0)}) translate(${f(-SG3.sh.x)} ${f(-SG3.sh.y)})`);
  }
  function pose(pt, lift, snap) {
    if (v3) return pose3(pt, lift, snap);
    const m = sig.getScreenCTM(); if (!m) return;
    const k = app.getBoundingClientRect().width / app.offsetWidth || 1;
    const tx = ((pt.x - 150) * m.a * 0.74) / k;                     // la cigogne suit le stylo aux trois quarts
    bx = snap || bx === null ? tx : bx + (tx - bx) * 0.14;
    move.style.transform = `translate3d(${bx.toFixed(2)}px,0,0)`;
    const inv = sg.getScreenCTM().inverse(), scr = new DOMPoint(pt.x, pt.y).matrixTransform(m);
    const T = new DOMPoint(scr.x, scr.y).matrixTransform(inv); T.y -= lift;
    const r = sh.getBoundingClientRect(), S = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(inv);
    const ang = 34 + Math.max(-10, Math.min(12, (S.x - T.x - 70) * 0.18)), a = (ang - 90) * Math.PI / 180, d = { x: Math.cos(a), y: Math.sin(a) };
    pen.setAttribute('transform', `translate(${f(T.x)} ${f(T.y)}) rotate(${f(ang)})`);
    const H = { x: T.x + d.x * 27, y: T.y + d.y * 27 }, len = Math.hypot(H.x - S.x, H.y - S.y) || 1, u = { x: (H.x - S.x) / len, y: (H.y - S.y) / len };
    const sag = Math.max(0, 118 - len) * 0.3, mid = { x: (S.x + H.x) / 2, y: (S.y + H.y) / 2 + sag };
    const U0 = { x: S.x + 4, y: S.y - 17 }, Cu = { x: mid.x, y: mid.y - 13 }, E = { x: H.x + u.x * 7, y: H.y + u.y * 7 }, U2 = { x: E.x, y: E.y - 5 }, L2e = { x: E.x - 2, y: E.y + 6 }, Cl = { x: mid.x, y: mid.y + 17 }, L0 = { x: S.x + 6, y: S.y + 20 };
    const body = `M${f(U0.x)} ${f(U0.y)} Q${f(Cu.x)} ${f(Cu.y)} ${f(U2.x)} ${f(U2.y)} L${f(L2e.x)} ${f(L2e.y)} Q${f(Cl.x)} ${f(Cl.y)} ${f(L0.x)} ${f(L0.y)} Z`;
    wing.setAttribute('d', body); wsh.setAttribute('d', body); wsh.setAttribute('transform', 'translate(1.5 4)');
    const t = 0.6, Pu = quad(U0, Cu, U2, t), Pl = quad(L0, Cl, L2e, t), cu = mix(Cu, U2, t), cl = mix(Cl, L2e, t);
    wtip.setAttribute('d', `M${f(Pu.x)} ${f(Pu.y)} Q${f(cu.x)} ${f(cu.y)} ${f(U2.x)} ${f(U2.y)} L${f(L2e.x)} ${f(L2e.y)} Q${f(cl.x)} ${f(cl.y)} ${f(Pl.x)} ${f(Pl.y)} Z`);
  }
  const dash = (a, b) => { p1.style.strokeDashoffset = a; p2.style.strokeDashoffset = b; };
  const reset = () => { cancelAnimationFrame(raf); raf = 0; dash(1, 1); pose(A, 10, true); };
  const T1 = 2050, TH = 190, T2 = 560;
  return { reset,
    start() {
      cancelAnimationFrame(raf);
      if (reduced()) { dash(0, 0); pose(D, 10, true); return; }
      reset(); const t0 = performance.now() + 520;
      const step = (now) => { const t = now - t0; let pt, lift = 0;
        if (t < 0) { pt = A; lift = 10 * Math.min(1, -t / 220); }
        else if (t < T1) { const q = t / T1, e = 0.72 * q + 0.28 * q * q * (3 - 2 * q); dash(1 - e, 1); pt = p1.getPointAtLength(e * L1); }
        else if (t < T1 + TH) { const q = (t - T1) / TH; dash(0, 1); pt = mix(B, C, q * q * (3 - 2 * q)); lift = 9 * Math.sin(Math.PI * q); }
        else if (t < T1 + TH + T2) { const q = (t - T1 - TH) / T2, e = q * (2 - q) * 0.5 + q * 0.5; dash(0, 1 - e); pt = p2.getPointAtLength(e * L2); }
        else { const q = Math.min(1, (t - T1 - TH - T2) / 320), e = q * (2 - q); dash(0, 0); pt = { x: D.x + 5 * e, y: D.y - 3 * e }; lift = 11 * e; if (t > T1 + TH + T2 + 1100) { pose(pt, lift); raf = 0; return; } }
        pose(pt, lift); raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    } };
}
// Frises de zellige (11 nov. soir) : bandeaux rectangulaires de motifs, pour habiller les fonds unis sans les charger.
// 1 étoiles à huit branches et losanges, 2 tresse (deux brins qui se croisent), 3 merlons en escalier. Couleur : currentColor.
export function frieze(kind = 1, h = 20) {
  const W = 528; let d = '', f = '';
  if (kind === 1) for (let x = 12; x < W; x += 24) { let st = ''; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, q = i % 2 ? 3.3 : 6.200; st += `${i ? 'L' : 'M'}${(x + Math.cos(a) * q).toFixed(1)} ${(10 + Math.sin(a) * q).toFixed(1)} `; } d += st + 'Z '; f += `M${x + 12} 7.500 l2.500 2.500 l-2.500 2.500 l-2.500 -2.500 Z `; }
  else if (kind === 2) for (let x = 0; x < W; x += 24) { d += `M${x} 15 C${x + 6} 15 ${x + 6} 5 ${x + 12} 5 C${x + 18} 5 ${x + 18} 15 ${x + 24} 15 M${x} 5 C${x + 6} 5 ${x + 6} 15 ${x + 12} 15 C${x + 18} 15 ${x + 18} 5 ${x + 24} 5 `; f += `M${x + 12} 8 l2 2 l-2 2 l-2 -2 Z `; }
  else for (let x = 0; x < W; x += 24) { d += `M${x} 15 h4 v-4 h4 v-4 h8 v4 h4 v4 h4 `; f += `M${x + 10} 12 h4 v4 h-4 Z `; }
  return `<svg class="frz k${kind}" viewBox="0 0 ${W} 20" preserveAspectRatio="xMidYMid slice" width="100%" height="${h}" aria-hidden="true"><path d="M0 1.200 H${W} M0 18.800 H${W}" stroke="currentColor" stroke-width="1.400" fill="none"/><path d="${d}" stroke="currentColor" stroke-width="1.300" fill="none" stroke-linejoin="round"/><path d="${f}" fill="currentColor"/></svg>`;
}
const FEATHER = `<svg viewBox="0 0 20 10" aria-hidden="true"><path d="M1 5 C5 -1 14 -1 19 5 C14 10 5 11 1 5 Z" fill="#FAF6EC"/><path d="M12 .800 C15 1.500 17.500 3 19 5 C17.500 7.200 15 8.800 12 9.300 Z" fill="#2B2D31"/><path d="M1 5 H18" stroke="#CFC5AF" stroke-width="1" stroke-linecap="round"/></svg>`;
// Icônes plates pour la pastille de l'accueil 3 (trois propositions, voir SLIDES).
const icLoupe = () => flat(`<ellipse cx="46" cy="82" rx="26" ry="6" fill="${FI.p2}" opacity=".5"/><path d="M60 58 L80 78" stroke="${FI.s2}" stroke-width="12" stroke-linecap="round"/><path d="M60 58 L78 76" stroke="${FI.s}" stroke-width="7" stroke-linecap="round"/><circle cx="42" cy="40" r="26" fill="${FI.g2}"/><circle cx="42" cy="40" r="18" fill="#BFD9D2"/><path d="M31 36 a12 12 0 0 1 11 -8" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);
const icDoc = () => flat(`<path d="M24 14 H60 L76 30 V80 a6 6 0 0 1 -6 6 H24 a6 6 0 0 1 -6 -6 V20 a6 6 0 0 1 6 -6 Z" fill="${FI.w2}" transform="translate(2 3)"/><path d="M24 12 H58 L76 30 V78 a6 6 0 0 1 -6 6 H24 a6 6 0 0 1 -6 -6 V18 a6 6 0 0 1 6 -6 Z" fill="${FI.w}"/><path d="M58 12 L76 30 H64 a6 6 0 0 1 -6 -6 Z" fill="${FI.w2}"/><path d="M28 42 H62 M28 54 H62 M28 66 H48" stroke="${FI.g}" stroke-width="5" stroke-linecap="round"/>`);
const icSeal = () => flat(`<path d="M34 56 L26 88 L40 80 L48 92 L56 80 L70 88 L62 56 Z" fill="${FI.p}"/><g fill="${FI.s}"><rect x="24" y="16" width="48" height="48" rx="4"/><rect x="24" y="16" width="48" height="48" rx="4" transform="rotate(45 48 40)"/></g><circle cx="48" cy="40" r="19" fill="${FI.s2}"/><path class="sy-check" d="M38 40.500 l7 7 l13 -14" pathLength="1" fill="none" stroke="${FI.w}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
const icBadge = (col, col2, glyph) => flat(`<circle cx="48" cy="52" r="36" fill="${col2}"/><circle cx="48" cy="47" r="36" fill="${col}"/>${glyph}`);
const icOk = () => icBadge(FI.g, FI.g2, `<path d="M32 48 l11 11 l21 -23" fill="none" stroke="${FI.w}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`);
const icWarn = () => icBadge(FI.s, FI.s2, `<path d="M48 28 V52" stroke="${FI.g2}" stroke-width="9" stroke-linecap="round"/><circle cx="48" cy="66" r="5.500" fill="${FI.g2}"/>`);
const icNo = () => icBadge('#C9474C', '#7E1C20', `<path d="M35 34 L61 60 M61 34 L35 60" stroke="${FI.w}" stroke-width="9" stroke-linecap="round"/>`);
const icCam = () => flat(`<rect x="12" y="34" width="72" height="50" rx="12" fill="${FI.w2}"/><rect x="34" y="18" width="28" height="18" rx="6" fill="${FI.w2}"/><rect x="12" y="30" width="72" height="50" rx="12" fill="${FI.w}"/><circle cx="48" cy="55" r="19" fill="${FI.g2}"/><circle cx="48" cy="55" r="11" fill="${FI.g}"/><circle cx="43" cy="50" r="3.500" fill="#fff" opacity=".8"/><circle cx="72" cy="41" r="5" fill="${FI.s}"/>`);
const icChoice = () => flat(`<rect x="10" y="34" width="76" height="40" rx="20" fill="${FI.g2}"/><rect x="10" y="30" width="76" height="40" rx="20" fill="${FI.g}"/><circle cx="66" cy="50" r="15" fill="${FI.w2}"/><circle cx="66" cy="48" r="15" fill="${FI.w}"/><path d="M59 48.500 l5 5 l9 -10" fill="none" stroke="${FI.g2}" stroke-width="4.400" stroke-linecap="round" stroke-linejoin="round"/>`);
const AVIS_PILLS = { 1: () => [[icLoupe(), 'Visite sur place'], [icDoc(), 'Avis rédigé'], [icSeal(), 'Signé']],
  2: () => [[icOk(), 'Validé'], [icWarn(), 'Réserves'], [icNo(), 'Refusé']],
  3: () => [[icCam(), 'Photos'], [icSeal(), 'Avis horodaté'], [icChoice(), 'Vous décidez']] };
// Décor discret des écrans d'accueil et des portes : trois propositions (rangée « Décor »).
const onbDeco = (v) => `<div class="onb-deco v${v}" aria-hidden="true">${v === 3 ? `<span class="od-l">${frieze(3)}</span><span class="od-r">${frieze(3)}</span>` : `<span class="od-t">${frieze(v)}</span>${v === 1 ? `<span class="od-b">${frieze(1)}</span>` : `<span class="od-c l">${khatam(150, { spin: false })}</span><span class="od-c r">${khatam(150, { spin: false })}</span>`}`}</div>`;
// Fond de la première page : des motifs de zellige se tracent autour de Bellarej, du centre vers l'extérieur.
// Trois propositions (l'utilisateur choisira) : 1 « Halo » (un seul rang d'étoiles), 2 « Rosace » (trois rangs qui s'estompent),
// 3 « Tapis » (tout le fond, étoiles et croix). Le choix se fait par les trois pastilles en haut à droite de la page (provisoires).
function landBg(v) {
  const star = (x, y, r, rot = 0) => { let d = ''; for (let i = 0; i < 16; i++) { const a = rot + (i * Math.PI) / 8, q = i % 2 ? r * 0.54 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * q).toFixed(1)} ${(y + Math.sin(a) * q).toFixed(1)} `; } return d + 'Z'; };
  const item = (d, delay, o = 1) => `<path d="${d}" pathLength="1" style="--d:${Math.round(delay)};--o:${o.toFixed(2)}"/>`;
  let out = '';
  const ring = (n, R, r, delay, o, rot = 0) => { for (let i = 0; i < n; i++) { const a = rot + (i * 2 * Math.PI) / n - Math.PI / 2; out += item(star(Math.cos(a) * R, Math.sin(a) * R, r, a), delay + i * (420 / n), o); } };
  const circle = (R, delay, o) => { out += item(`M${-R} 0 a${R} ${R} 0 1 1 ${2 * R} 0 a${R} ${R} 0 1 1 ${-2 * R} 0`, delay, o); };
  if (v === 1) { circle(96, 0, .55); ring(8, 122, 20, 250, .95); circle(148, 700, .4); }
  else if (v === 2) { circle(96, 0, .5); ring(8, 122, 20, 200, .95); ring(12, 176, 17, 650, .6, Math.PI / 12); ring(16, 228, 15, 1100, .34); circle(256, 1500, .2); }
  else { const P = 62; for (let gy = -6; gy <= 6; gy++) for (let gx = -4; gx <= 4; gx++) { const x = gx * P, y = gy * P, dist = Math.hypot(x, y); if (dist < 70) continue;
      out += item(star(x, y, 21, Math.PI / 8), dist * 3.2, Math.max(.16, .8 - dist / 520));
      out += item(`M${x + P / 2} ${y + P / 2 - 9} l9 9 l-9 9 l-9 -9 Z`, dist * 3.2 + 160, Math.max(.12, .6 - dist / 520)); } }
  return `<svg class="land-bg" viewBox="-201 -437 402 874" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${out}</svg>`;
}
const LAND_BG = 'teeqa-fond-accueil';
const landChoice = () => 3;   // 11 nov. soir : l'utilisateur garde « Tapis » ; les fonds 1 et 2 ne sont plus proposés
// Bandeau derrière le nom et la phrase (l'endroit laissé vide dans le tapis) : trois propositions.
// 1 deux frises fines, au-dessus et au-dessous ; 2 un bandeau vert plein bordé de frises, texte clair ; 3 un cartouche encadré, panneaux de motifs sur les côtés.
const landBand = (v, inner) => `<div class="land-band v${v}"><span class="lb-f t">${frieze(v === 2 ? 2 : 1)}</span>${v === 3 ? `<span class="lb-side l">${frieze(3, 60)}</span><span class="lb-side r">${frieze(3, 60)}</span>` : ''}<div class="lb-in">${inner}</div><span class="lb-f b">${frieze(v === 2 ? 2 : 1)}</span></div>`;
// Accueil : trois idées, trois visuels « en arc » faits avec les images du projet (photos, icônes 3D, Bellarej).
// Emplacements prévus : si assets/accueil/accueil-{1,2,3}.webp arrivent un jour, il suffit de remplacer `art`.
const SIG = 'M12 42 C14 24 22 6 30 8 C38 10 30 34 18 42 C10 47 8 38 18 33 C26 29 36 30 38 36 C40 42 34 43 36 37 C38 31 46 30 48 36 C50 42 44 43 47 36 C52 24 58 8 62 6 C66 5 64 16 58 30 C55 37 56 42 61 40 C66 38 66 31 71 31 C76 31 72 41 77 40 C82 39 83 32 88 32 C92 32 89 40 94 40 C104 40 116 34 130 24 M22 51 C58 45 104 46 152 39 C140 43 134 47 130 52';
const SLIDES = [
  { over: 'Sur place ou à distance', title: 'Votre chantier, <span class="kw">pas à pas</span>.', text: "Chaque étape est déclarée par l'entreprise avec ses photos ; en Suivi contrôlé, un contrôleur passe aux étapes clés.",
    art: () => `${archDeco()}<div class="onb-arch"><img src="assets/photos/p12.webp" alt="" draggable="false"></div>
      <span class="onb-fly" data-par="34" aria-hidden="true"><span class="onb-fly-x"><span class="onb-fly-y">${bellarejVol()}</span></span></span>
      ${pill([[stepIconFlat(0, 54), 'Fondations'], [stepIconFlat(2, 54), 'Murs et dalle'], [stepIconFlat(5, 54), 'Les clés']], 'count conf')}` },
  { over: 'Preuves datées', title: 'Des photos <span class="kw">datées</span>, prises sur place.', text: "Le contrôleur photographie dans l'appli : date, ville et envoi restent visibles. TEEQA ne certifie pas les photos.",
    art: () => `${archDeco()}<div class="onb-arch shot"><img src="assets/photos/p8.webp" alt="" draggable="false"><span class="onb-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>
      <span class="onb-ctl rig v3" data-par="30">${bellarejPhoto()}</span>
      ${pill([[icDate(), '22 sept. · 10:42'], [icPlace(), 'Sur place'], [icSync(), 'Envoyée']], 'count tick')}` },
  { over: 'Avis horodaté', title: 'Un avis <span class="kw">horodaté</span> de l\'agence de contrôle.', text: "En Suivi contrôlé : Validé, Réserves ou Refusé, signé simplement. TEEQA ne tranche pas et ne détient pas l'argent.",
    art: () => `${archDeco()}<div class="onb-arch zel"></div>
      <div class="onb-doc" data-par="-20"><span class="chip success">${icon('checkCircle', 'xs')}Avis Validé</span><span class="onb-doc-meta">Signé · sur place</span>${/* vague 23 (doigt : Ilyas) : la mention passe en haut, Bellarej ne la cache plus */''}
        <i class="ln"></i><i class="ln" style="width:72%"></i>
        <svg class="onb-sig" viewBox="0 0 168 56" aria-hidden="true">${SIG.split(' M').map((d, n) => `<path d="${n ? 'M' : ''}${d}" pathLength="1"/>`).join('')}</svg>
        <span class="onb-seal">${khatam(46)}</span></div>
      <span class="onb-signer v3" data-par="30"><span class="sg-move">${bellarejSigneV3()}</span></span>
      ${pill(AVIS_PILLS[1](), 'count tick')}` },
];
// Ce qu'on aperçoit derrière chaque porte (emplacement : assets/portes/porte-<rôle>.webp si elles arrivent un jour).
const DOOR_PHOTO = { client: 'p12', entreprise: 'p6', controleur: 'p8' };
// « Entrer » : on passe la porte. Les battants finissent de s'ouvrir, puis tout l'écran avance vers la porte choisie
// (l'écran grossit autour d'elle, de plus en plus vite, comme un pas en avant) jusqu'à ce que ce qu'on voit derrière remplisse
// l'écran ; l'appli apparaît alors dans un fondu, en reculant légèrement à sa place. Retours de l'utilisateur du 11 nov.
function enterDoor(then) {
  const card = document.querySelector('.door-card[aria-checked="true"]'), inside = card && card.querySelector('.door-inside'), app = document.getElementById('app');
  const screen = card && card.closest('.screen');
  if (!inside || !screen || reduced() || !screen.animate) return then();
  const a = app.getBoundingClientRect(), r = inside.getBoundingClientRect(), k = a.width / app.offsetWidth || 1;
  const cx = (r.left + r.width / 2 - a.left) / k, cy = (r.top + r.height * 0.56 - a.top) / k;
  const zoom = Math.max(app.offsetWidth / (r.width / k), app.offsetHeight / (r.height / k)) * 1.25;
  let done = false;
  const veil = document.createElement('div'); veil.className = 'door-enter'; veil.innerHTML = inside.innerHTML;
  const finish = () => { if (done) return; done = true;
    app.appendChild(veil); then();
    const next = [...app.querySelectorAll('.screen')].pop();
    if (next && next.animate) next.animate([{ transform: 'scale(1.08)' }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    requestAnimationFrame(() => veil.classList.add('out')); setTimeout(() => veil.remove(), 560); };
  card.classList.add('going');
  screen.style.transformOrigin = `${cx}px ${cy}px`;
  const an = screen.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: .22, easing: 'cubic-bezier(.6, 0, .9, .5)' }, { transform: `scale(${zoom.toFixed(2)})` }], { duration: 760, fill: 'forwards' });
  an.onfinish = finish;
  setTimeout(finish, 1100);   // filet de sécurité : si l'animation ne tourne pas (onglet en arrière-plan), on entre quand même
}
// Vague 20 (doigt : Yousef, Fatima) : une seule touche « Langue » au premier écran (six puces se posaient sur le titre à 150 %).
const LANG_LABELS = { fr: 'Français', ar: 'العربية', dar: 'Darija', shi: 'Tachelhit', rif: 'Tarifit', tzm: 'Tamazight' };
const DOOR_TEXT = { client: 'Je suis mon chantier, sur place ou à distance', entreprise: 'Je déclare les étapes', controleur: 'Je vérifie sur place, par lien' };

// ---------- Création de compte (11 nov.) : une question par écran, comme Duolingo. Bellarej pose la question dans une bulle,
// la barre du haut avance, le bouton du bas ne s'allume que quand la réponse est là. Quatre temps : qui êtes-vous, votre nom,
// votre chantier (le client peut le poser tout de suite), puis « compte prêt ». Rien n'est envoyé nulle part : tout reste dans le navigateur.
let su = null;
const suNew = () => ({ step: 0, from: 0, role: '', name: '', email: '', has: '', pname: '', city: '', pays: '' });
// Soutenance (demo-oral.html, 27 nov.) : devant le jury, on touche, on ne tape pas : prénom, pays et téléphone de Karim
// sont déjà saisis (comme le remplissage automatique du téléphone) ; le rôle se choisit au doigt.
const suNewOral = () => ({ ...suNew(), name: 'Karim', pays: 'FR', tel: '+33 6 12 48 57 30' });
const SU_N = 4;
const suMail = (m) => !m.trim() || /.+@.+\..+/.test(m.trim());
const suValid = (d) => d.step === 0 ? !!d.role : d.step === 1 ? d.name.trim().length > 1 && suMail(d.email) && (d.role !== 'client' || !!d.pays)
  : d.step === 2 ? (d.role === 'entreprise' || d.has === 'non' || (d.has === 'oui' && d.pname.trim().length > 1 && d.city.trim().length > 1)) : true;
// Vague 24 (doigt : Sofiane) : sous « Continuer » grisé, une ligne dit ce qui manque.
const suManque = (d) => { if (suValid(d)) return ''; const m = d.step === 0 ? ['votre rôle'] : d.step === 1 ? [d.name.trim().length > 1 ? '' : 'votre prénom', suMail(d.email) ? '' : 'un e-mail complet (ou rien)', d.role === 'client' && !d.pays ? 'votre pays' : ''] : d.step === 2 ? (d.has === 'oui' ? [d.pname.trim().length > 1 ? '' : 'le nom du chantier', d.city.trim().length > 1 ? '' : 'sa ville'] : ['votre réponse']) : [];
  const l = m.filter(Boolean); return l.length ? `Il manque : ${l.join(', ')}.` : ''; };
const suFirst = (d) => esc(d.name.trim().split(' ')[0] || '');
const suAsk = (d) => d.step === 0 ? ['Bienvenue ! Moi, c\'est Bellarej.', 'Qui êtes-vous sur le chantier ?']
  : d.step === 1 ? [d.role === 'entreprise' ? 'Une entreprise, parfait.' : 'Un chantier à suivre, parfait.', d.role === 'entreprise' ? 'Quel est le nom de votre entreprise ?' : 'Comment vous appelle-t-on ?']
  : d.step === 2 ? (d.role === 'entreprise' ? [`Bienvenue, ${suFirst(d)} !`, 'Vos chantiers arrivent par invitation.'] : [`Bienvenue, ${suFirst(d)} !`, d.parents ? 'Le chantier de vos parents est-il déjà en cours ?' : 'Avez-vous déjà un chantier en cours ?'])
  : ['', ''];
const suMood = (d) => d.step === 0 ? 'posee' : d.step === 1 ? 'annonce' : d.role === 'entreprise' ? 'batit' : 'annonce';
const suAv = (kind, size) => `<span class="av-wrap" style="width:${size}px;height:${size}px">${avatar(kind, size)}</span>`;
const suCard = (act, val, on, art, title, sub) => `<button class="su-card" role="radio" aria-checked="${on}" data-act="${act}" data-v="${val}"><span class="su-card-art">${art}</span><span class="grow"><b>${title}</b><small>${sub}</small></span><span class="su-radio" aria-hidden="true"></span></button>`;
function suBody(d) {
  if (d.step === 0) return `<div class="su-cards" role="radiogroup" aria-label="Votre rôle">
      ${suCard('su-role', 'client', d.role === 'client' && !d.parents, suAv('client', 52), 'Je fais construire ma maison', 'Particulier : je suis mon chantier, sur place ou à distance')}
      ${/* Vague 24 (Belgique 5, IDF) : beaucoup gèrent le chantier de leurs parents. */''}${suCard('su-role', 'parents', d.role === 'client' && !!d.parents, suAv('client', 52), 'Je gère pour mes parents', 'Leur maison, mon téléphone : je suis le chantier et je les invite à le lire')}
      ${suCard('su-role', 'entreprise', d.role === 'entreprise', suAv('entreprise', 52), 'Je suis une entreprise du bâtiment', 'Entreprise, artisan ou tâcheron : je déclare les étapes de mes chantiers')}
    </div>
    <button class="su-note" data-act="su-ctl">${suAv('controleur', 34)}<span class="grow"><b>Contrôleur ?</b> Vous entrez par un lien d'invitation, sans compte.</span>${icon('chevron', 'sm')}</button>`;
  if (d.step === 1) return `<div class="su-fields">
      <div class="field"><label for="su-name">${d.role === 'entreprise' ? "Nom de l'entreprise" : 'Votre prénom'}</label><input id="su-name" class="input" data-input="su-field" data-k="name" value="${esc(d.name)}" placeholder="${d.role === 'entreprise' ? 'Ex. Atlas Bâtiment' : 'Ex. Karim'}" autocomplete="off" autocapitalize="words" maxlength="28"></div>
      ${d.role === 'client' ? `<div class="field"><span class="label" id="su-pays-l">Vous vivez</span><button class="input su-pick" data-act="su-pays-open" data-testid="su-pays" aria-labelledby="su-pays-l" aria-haspopup="dialog" style="display:flex;align-items:center;justify-content:space-between;text-align:start;min-height:48px">${d.pays ? `<b>${esc(PAYS[d.pays].nom)}</b>` : '<span class="meta">Choisir votre pays</span>'}${icon('chevronDown', 'sm')}</button><p class="meta">Pour vos montants (dirhams, et votre devise si vous vivez ailleurs) et votre heure.</p></div>` : ''}
      <div class="field"><span class="label" id="su-lang-l">Votre langue</span><button class="input su-pick" data-act="su-lang-open" data-testid="su-lang" aria-labelledby="su-lang-l" aria-haspopup="dialog" data-notr style="display:flex;align-items:center;justify-content:space-between;text-align:start;min-height:48px">${esc(LANG_LABELS[get().langDefault || 'fr'] || 'Français')}${icon('chevronDown', 'sm')}</button></div>
      <div class="field"><label for="su-mail">Votre e-mail <i>(facultatif)</i></label><input id="su-mail" class="input" type="email" inputmode="email" data-input="su-field" data-k="email" value="${esc(d.email)}" placeholder="vous@exemple.com" autocomplete="off"></div>
      <div class="field"><label for="su-tel">Votre téléphone <i>(facultatif : alertes par SMS ou WhatsApp)</i></label><input id="su-tel" class="input" type="tel" inputmode="tel" data-input="su-field" data-k="tel" data-testid="su-tel" value="${esc(d.tel || '')}" placeholder="${d.pays && d.pays !== 'MA' ? '+33 6 …, +32 4 …' : '+212 6 …'}" autocomplete="off"></div>${/* vague 25 (5 groupes) : le numéro dès l'inscription, puisque les alertes passent par SMS et WhatsApp */''}
      <p class="meta">${icon('lock', 'xs')} Votre chantier n'est jamais public : seules les personnes que vous invitez le voient.</p></div>`;
  if (d.step === 2 && d.role === 'entreprise') return `<div class="su-info">
      <div class="su-info-row"><span class="su-num">1</span><span>Votre client crée le chantier et <b>vous invite</b> par e-mail.</span></div>
      <div class="su-info-row"><span class="su-num">2</span><span>Vous <b>déclarez</b> le début et la fin de chaque étape, en photos.</span></div>
      <div class="su-info-row"><span class="su-num">3</span><span>Un contrôleur passe sur place et <b>signe un avis</b>.</span></div></div>`;
  if (d.step === 2) return `<div class="su-cards" role="radiogroup" aria-label="Votre chantier">
      ${suCard('su-has', 'oui', d.has === 'oui', stepIconFlat(2, 52), "Oui, j'ai un chantier", 'Je le pose tout de suite')}
      ${d.has === 'oui' ? `<div class="su-fields in"><div class="field"><label for="su-pname">Nom du chantier</label><input id="su-pname" class="input" data-input="su-field" data-k="pname" value="${esc(d.pname)}" placeholder="Ex. Maison familiale" autocomplete="off" maxlength="34"></div>
        <div class="field"><label for="su-city">Ville</label><input id="su-city" class="input" data-input="su-field" data-k="city" value="${esc(d.city)}" placeholder="Ex. Nador" autocomplete="off" maxlength="28"></div></div>` : ''}
      ${suCard('su-has', 'non', d.has === 'non', stepIconFlat(0, 52), 'Pas encore', 'Je découvre, je le créerai plus tard')}
    </div>`;
  const proj = d.role === 'client' && d.has === 'oui';
  return `<div class="su-done">
      <span class="su-burst" aria-hidden="true">${'<i></i>'.repeat(14)}</span>
      <div class="su-done-bird">${bellarejRig('felicite', 190, { gear: d.role === 'entreprise' ? 'orange' : '' })}</div>
      <h1 class="display">Bienvenue, <span class="kw">${suFirst(d)}</span> !</h1>
      <p class="muted">Votre compte est prêt.</p>
      <div class="su-recap"><div class="row" style="gap:12px">${suAv(d.role, 44)}<div class="grow"><b>${esc(d.name.trim())}</b><small>${d.role === 'entreprise' ? 'Compte entreprise' : 'Compte client'}</small></div><span class="su-ok">${icon('check', 'sm')}</span></div>
        ${proj ? `<div class="row su-recap-p" style="gap:12px">${stepIconFlat(2, 44)}<div class="grow"><b>${esc(d.pname.trim())}</b><small>${esc(d.city.trim())} · ${TEMPLATE_STEPS.length} étapes prêtes</small></div><span class="su-ok">${icon('check', 'sm')}</span></div>` : ''}</div>
    </div>`;
}
// A5 : le code part par SMS au téléphone donné (sinon par e-mail) ; il s'affiche ici comme le message qui arrive sur le téléphone.
const suContact = (d) => String(d.tel || '').replace(/\D/g, '').length >= 9 || /.+@.+\..+/.test(d.email.trim());
function suCode(d) {
  d.code = String(1000 + Math.floor(Math.random() * 9000)); const tel = String(d.tel || '').replace(/\D/g, '').length >= 9, dest = tel ? esc(String(d.tel).trim()) : esc(d.email.trim());
  openSheet(`<h2>Code de vérification</h2><p class="muted small" style="margin:4px 0 12px">Envoyé ${tel ? 'par SMS au' : 'par e-mail à'} <b>${dest}</b>. Il vérifie que ce ${tel ? 'numéro' : 'courriel'} est bien le vôtre ; les invitations qui l'attendent se rattachent à votre compte.</p>
    <div class="notice" data-testid="su-code-sms" data-code="${d.code}">${icon('message', 'sm')}<span><b>${tel ? 'SMS' : 'E-mail'} · TEEQA</b><br>Votre code TEEQA : <b class="mono">${d.code}</b>. Il expire dans 10 minutes. Ne le donnez à personne.</span></div>
    <div class="field" style="margin-top:12px"><label for="su-code-in">Code reçu (4 chiffres)</label><input id="su-code-in" class="input mono" data-testid="su-code" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="• • • •"${ORAL_INSCRIPTION ? ` value="${d.code}"` : ''}></div>
    <p class="meta" data-testid="su-code-err" aria-live="polite" style="color:var(--danger-ink);min-height:1em"></p>
    <div class="stack" style="gap:8px"><button class="btn success block" data-act="su-code-ok" data-testid="su-code-ok">Vérifier</button><button class="btn text block" data-act="su-code-again">Renvoyer le code</button></div>`, { label: 'Code de vérification' });
}
function suFinish() {
  const d = su; if (!d) return;
  // Problème 11 : créer un compte n'efface plus rien. Le compte est enregistré d'abord ; le chantier créé ensuite lui est
  // rattaché (p.owner), et « Mes chantiers » ne montre à chacun que les siens (forMe).
  actions.setAccount({ role: d.role, name: d.name.trim(), email: d.email.trim(), tel: String(d.tel || '').trim(), verifiedAt: d.verifiedAt || null });
  if (d.role === 'client' && d.pays) actions.pref({ pays: d.pays, ville: '', villePays: '' });
  if (d.role === 'client') actions.pref({ pourParents: !!d.parents });   // vague 20 : pays de résidence demandé à l'inscription
  actions.session({ loggedIn: true, onboarded: true, splashSeen: true });
  let id = null;
  if (d.role === 'client' && d.has === 'oui') id = actions.createProject({ name: d.pname.trim(), city: d.city.trim(), steps: [...TEMPLATE_STEPS], email: '', controls: TEMPLATE_STEPS.length });
  su = null; landing = true;
  go(id ? `#/c/${id}` : '#/home', { replace: true });
}

export const routes = [
  {
    name: 'signup', pattern: /^\/signup$/,
    render() {
      const d = su || (su = ORAL_INSCRIPTION ? suNewOral() : suNew()), last = d.step === SU_N - 1, [hi, ask] = suAsk(d);
      const fwd = d.step >= d.from, moved = d.step !== d.from, from = d.from; d.from = d.step;
      const redraw = () => { const ae = document.activeElement; if (ae && ae.blur && /INPUT|TEXTAREA/.test(ae.tagName)) ae.blur(); actions.session({}); };   // un champ actif bloque le redessin (voir refresh dans app.js)
      const setStep = (n) => { d.step = n; sfx('pop'); redraw(); };
      return {
        cls: 'onb-screen su' + (last ? ' su-end' : ''),
        html: `${onbDeco(2)}
        <div class="su-top"><button class="icon-btn" data-act="su-back" aria-label="${d.step ? 'Question précédente' : 'Retour'}">${icon(d.step ? 'back' : 'close')}</button>
          <div class="su-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${SU_N}" aria-valuenow="${d.step + 1}" aria-label="Création du compte"><i style="--from:${((from + 1) / SU_N * 100).toFixed(0)}%;--to:${((d.step + 1) / SU_N * 100).toFixed(0)}%"></i></div></div>
        <div class="scroll"><div class="su-page ${moved ? (fwd ? 'in-r' : 'in-l') : 'in-0'}">
          ${last ? '' : `<div class="su-ask"><span class="su-bird">${bellarejRig(suMood(d), 132, { gear: d.step === 2 && d.role === 'entreprise' ? 'orange' : '' })}</span>
            <div class="su-bubble" role="heading" aria-level="1"><small>${hi}</small><b>${ask}</b></div></div>`}
          ${suBody(d)}
        </div></div>
        <div class="footer-cta su-foot">
          ${last ? `<button class="btn success block" data-act="su-enter">Entrer dans TEEQA</button>`
            : `<button class="btn success block" data-act="su-next" ${suValid(d) ? '' : 'disabled'}>Continuer</button><p class="meta su-manque" data-testid="su-manque" aria-live="polite" style="margin:6px 0 0;text-align:center">${suManque(d)}</p>`}
          ${d.step === 0 ? `<button class="btn text onb-have" data-act="su-have">J'ai déjà un compte</button>` : ''}
          <button class="btn text" style="min-height:44px" data-act="humain" data-testid="humain-signup">Une question ? Parler à quelqu'un</button>
        </div>`,
        on: {
          'su-role'(b) { d.parents = b.dataset.v === 'parents'; d.role = d.parents ? 'client' : b.dataset.v; redraw(); },
          'su-has'(b) { d.has = b.dataset.v; redraw(); if (d.has === 'oui') setTimeout(() => document.getElementById('su-pname')?.focus({ preventScroll: true }), 380); },
          // Vague 21 (doigt : Mehdi) : la liste native ne s'ouvrait pas à l'écran ; une feuille avec de gros boutons, Maroc et France d'abord.
          'su-lang-open'() { const cur = get().langDefault || 'fr';   // vague 22 (7 groupes) : la langue se choisit aussi à l'inscription, pas seulement dans Profil
            openSheet(`<h2>Langue · اللغة · Tutlayt</h2><div class="list" role="radiogroup" aria-label="Langue" style="margin-top:10px">${Object.entries(LANG_LABELS).map(([k, t]) => `<button class="list-item" role="radio" aria-checked="${cur === k}" data-lact="first-lang" data-lang="${k}" data-testid="su-lang-${k}" data-notr><span class="grow"><span class="t">${t}</span></span>${cur === k ? icon('check', 'sm') : ''}</button>`).join('')}</div>`, { label: 'Langue' }); },
          'su-pays-open'() { openSheet(`<h2>Vous vivez</h2><div class="list" role="radiogroup" aria-label="Pays" style="margin-top:10px">${Object.entries(PAYS).map(([k, v]) => `<button class="list-item" role="radio" aria-checked="${d.pays === k}" data-act="su-pays-pick" data-v="${k}" data-testid="su-pays-${k}" style="min-height:48px"><span class="grow"><span class="t">${esc(v.nom)}</span></span>${d.pays === k ? icon('check', 'sm') : ''}</button>`).join('')}</div>`, { label: 'Pays' }); },
          'su-pays-pick'(b) { d.pays = b.dataset.v; closeSheet(); redraw(); },   // vague 23 (doigt : Omar) : on ne défile plus après le pays : le prénom reste visible
          'su-field'(t) { d[t.dataset.k] = t.value; const b = t.closest('.screen').querySelector('[data-act="su-next"]'); if (b) b.disabled = !suValid(d); const mq = t.closest('.screen').querySelector('[data-testid="su-manque"]'); if (mq) mq.textContent = suManque(d); },
          'su-next'() { if (!suValid(d)) return; if (d.step === 1 && suContact(d) && !d.verifiedAt) return suCode(d); if (d.step === SU_N - 2) sfx('success'); setStep(d.step + 1); },
          // Parcours A (26 nov.) · A5 du workflow : un téléphone ou un e-mail donné se vérifie par un code reçu.
          'su-code-ok'() { const v = String((document.getElementById('su-code-in') || {}).value || '').replace(/\D/g, ''), er = document.querySelector('[data-testid="su-code-err"]');
            if (v !== d.code) { if (er) er.textContent = 'Code incorrect. Vérifiez le message reçu, ou demandez un nouveau code.'; sfx('erreur'); return; }
            d.verifiedAt = new Date().toISOString(); closeSheet(true); setStep(d.step + 1); },
          'su-code-again'() { suCode(d); },
          'su-back'() { if (d.step) setStep(d.step - 1); else { su = null; history.length > 1 ? history.back() : go('#/welcome', { replace: true }); } },
          'su-have'() { su = null; actions.session({ onboarded: true }); go('#/login', { replace: true }); },
          'su-ctl'() { su = null; actions.setRole('controleur'); actions.session({ onboarded: true }); go('#/login', { replace: true }); },
          'su-enter': suFinish,
        },
        mount(el) {
          if (d.step === 1 && moved && !reduced()) setTimeout(() => el.querySelector('#su-name')?.focus({ preventScroll: true }), 420);
          el.addEventListener('focusin', (e) => { if (e.target.matches('input')) setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }), 250); });   // vague 21 : le champ touché remonte au-dessus de CONTINUER
          el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); const b = el.querySelector('[data-act="su-next"]'); if (b && !b.disabled) b.click(); else { const ins = [...el.querySelectorAll('input')], n = ins[ins.indexOf(e.target) + 1]; n && n.focus(); } } });
        },
      };
    },
  },
  {
    name: 'splash', pattern: /^\/splash$/,
    render() {
      return {
        html: `<div class="splash"></div>`,
        mount() {
          launch(() => { actions.session({ splashSeen: true }); const s = get().session; landing = true; go(s.loggedIn ? (get().lastRoute || '#/home') : s.onboarded ? '#/login' : '#/welcome', { replace: true }); });
        },
      };
    },
  },
  { // Vague 24 (doigt : Meryem) : avant l'exemple sans compte, TEEQA en 3 cartes illustrées par Bellarej (qui fait quoi),
    // avec « Voir l'exemple » et « Créer mon chantier » : l'idée se comprend en 10 secondes.
    name: 'apercu', pattern: /^\/apercu$/,
    render() {
      const C = [['client', 'Vous suivez', 'Chaque étape de votre maison, ses photos datées, et quand payer l’entreprise. Même de loin.'], ['entreprise', 'L’entreprise déclare', 'Elle photographie le début et la fin de chaque étape, dans l’appli.'], ['controleur', 'Un contrôleur vérifie', 'Un ingénieur d’une agence indépendante passe sur place aux étapes clés et signe un avis.']];
      return {
        cls: 'onb-screen',
        html: `<div class="scroll"><div class="content stack" style="gap:14px;padding-top:calc(var(--safe-top) + 18px);padding-bottom:calc(var(--safe-bottom) + 18px)" data-testid="apercu">
          <div class="row" style="gap:8px">${logoSymbol(22)}<b class="onb-brand">TEEQA</b></div>
          <h1 class="h1" style="margin:0">Trois rôles, un seul chantier<span class="kw">.</span></h1>
          ${C.map(([r, t, d], i) => `<div class="card row apercu-carte" style="gap:14px;align-items:center" data-testid="apercu-${r}"><span class="apercu-av" aria-hidden="true">${roleAvatar(r, 64, 'client')}</span><span class="grow"><span class="over">${i + 1} sur 3</span><b style="display:block;font-size:18px">${t}</b><span class="meta">${d}</span></span></div>`).join('')}
          <p class="meta" style="margin:0">L’exemple : Villa Nador, à Nador. Vous la voyez comme son client, Karim, sans compte et sans rien casser.</p>
          <button class="btn success block" data-act="apercu-voir" data-testid="apercu-voir">${icon('eye', 'sm')}Voir l’exemple</button>
          <button class="btn saffron block" data-act="apercu-creer" data-testid="apercu-creer">${icon('plus', 'sm')}Créer mon chantier</button>
          <button class="btn text block" style="min-height:44px" data-act="apercu-retour">Retour</button>
        </div></div>`,
        on: {
          'apercu-voir'() { sfx('pop'); actions.setRole('client'); actions.session({ loggedIn: true, onboarded: true, splashSeen: true, exemple: true }); go('#/c/villa-demo', { replace: true }); },
          'apercu-creer'() { sfx('pop'); go('#/signup'); },
          'apercu-retour'() { landing = true; go('#/welcome', { replace: true }); },
        },
      };
    },
  },
  {
    name: 'welcome', pattern: /^\/welcome$/,
    render() {
      const N = SLIDES.length;
      const done = () => { slide = 0; actions.session({ onboarded: true }); go('#/login', { replace: true }); };
      const create = () => { slide = 0; go('#/signup'); };
      let goTo = () => {};
      if (landing) return {
        html: `<div class="land" data-fond="${landChoice()}">${landBg(landChoice())}
          <div class="land-mid"><div class="land-mascot v3" role="img" aria-label="Bellarej, la cigogne de TEEQA">${bellarejAccueil()}</div>
            ${landBand(1, `<div class="land-word">${wordmark()}</div><p class="land-tag">Votre chantier, suivi pas à pas.</p><p class="land-pour" data-testid="land-pour">Pour suivre la construction de votre maison au Maroc, même de loin : photos datées, contrôleur indépendant.</p>`)}</div>
          <div class="land-foot"><button class="btn ghost sm land-lang" data-act="first-langs" data-testid="first-lang" title="Changer de langue">${icon('globe', 'sm')}<span data-notr class="ll-list">${[esc(LANG_LABELS[get().langDefault || 'fr'] || 'Français'), ...((get().langDefault || 'fr') === 'fr' ? ['العربية', 'Darija', 'Amazigh'] : [])].map((t, i) => `<span class="ll-i">${i ? '· ' : ''}${t}</span>`).join(' ')}</span>${icon('chevronDown', 'xs')}</button>
            <button class="btn success block" data-act="begin">Commencer</button>
            <button class="btn ghost block" data-act="land-exemple" data-testid="land-exemple">Voir un exemple, sans compte</button>
            <button class="btn text block" style="min-height:44px" data-act="skip">J'ai déjà un compte</button>
            ${/* Vague 24 (Belgique, IDF : « un parent qui ne lit pas ») : la voix dès l’accueil, pour qui la demande ; ensuite, chaque écran est lu. */''}${/* Vague 25 (Île-de-France : la voix proposée dès le premier lancement) : une question, Oui ou Non, mémorisée. */''}${get().prefs && get().prefs.voixDemandee ? '' : `<div class="voix-q" data-testid="voix-question" role="group" aria-label="Lecture à voix haute"><p class="meta" style="margin:0 0 6px;text-align:center"><b>Voulez-vous que l’appli vous lise les écrans ?</b></p><div class="row" style="gap:8px"><button class="btn ghost grow" style="min-height:44px" data-testid="voix-oui">${icon('speaker', 'sm')}Oui</button><button class="btn ghost grow" style="min-height:44px" data-testid="voix-non">Non</button></div></div>`}<button class="btn ghost block land-ecouter" data-lact="listen" data-scope=".land" data-testid="land-ecouter"${get().prefs && get().prefs.voixDemandee ? '' : ' hidden style="display:none"'}>${icon('speaker', 'sm')}Tout écouter, à voix haute</button>
            <p class="meta" style="text-align:center;margin:6px 0 0" data-testid="prix-appel">À partir de ${prixTel(TARIFS.suivi.dh)} par chantier · ${prixTel(TARIFS.controle.dh)} avec ${TARIFS.controle.visites} visites d’un contrôleur. Votre devise s’ajoute une fois votre pays choisi.</p>
            <button class="btn text block" style="min-height:44px" data-act="humain" data-testid="humain-accueil">Parler à quelqu'un avant de commencer</button></div></div>`,
        // Le tapis s'arrête net avant le bandeau : on retire les motifs qui touchent la zone du nom (entre les deux frises, plus une marge).
        mount(el) { const le = el.querySelector('[data-testid="land-ecouter"]'); if (le) le.addEventListener('click', () => { if (!le.classList.contains('playing')) { get().prefs.toutEcouter = true; save(); } });
          const vq = el.querySelector('[data-testid="voix-question"]'); if (vq) vq.addEventListener('click', (e) => { const b = e.target.closest('[data-testid="voix-oui"], [data-testid="voix-non"]'); if (!b) return; const oui = b.dataset.testid === 'voix-oui';
            const st = get(); st.prefs = st.prefs || {}; st.prefs.voixDemandee = true; st.prefs.toutEcouter = oui; save(); vq.remove(); if (le) { le.hidden = false; le.style.display = ''; if (oui) le.click(); } toast(oui ? 'Tout écouter : chaque écran sera lu à voix haute' : 'D’accord : « Écouter » reste sur chaque écran', oui ? 'speaker' : 'check'); });
          const band = el.querySelector('.land-band'), bg = el.querySelector('.land-bg'); if (!band || !bg) return;
          const b = band.getBoundingClientRect(), k = b.width / (band.offsetWidth || 1), m = 14 * k;
          bg.querySelectorAll('path').forEach((p) => { const r = p.getBoundingClientRect(); if (r.bottom > b.top - m && r.top < b.bottom + m) p.style.display = 'none'; }); },
        on: { begin() { landing = false; go('#/welcome', { replace: true }); }, skip: done,
          // Vague 23 (doigt : Ilyas) : voir un vrai chantier avant de dire qui l'on est (le chantier d'exemple, vu par son client).
          'land-exemple'() { landing = false; sfx('pop'); go('#/apercu'); },   // vague 24 (doigt : Meryem) : d'abord les 3 rôles en 3 cartes, puis l'exemple
          'first-langs'() { const cur = get().langDefault || 'fr';
            openSheet(`<h2>Langue · اللغة · Tutlayt</h2><p class="meta" style="margin:6px 0 0" data-testid="langue-portee">Écrans de tous les jours et messages traduits ; la convention complète reste en français (résumé dans votre langue).</p><div class="list" role="radiogroup" aria-label="Langue" style="margin-top:10px">${Object.entries(LANG_LABELS).map(([k, t]) => `<button class="list-item" role="radio" aria-checked="${cur === k}" data-lact="first-lang" data-lang="${k}" data-testid="first-lang-${k}" data-notr><span class="grow"><span class="t">${t}</span></span>${cur === k ? icon('check', 'sm') : ''}</button>`).join('')}</div>`,
              { label: 'Langue' }); },
          fond(b) { try { localStorage.setItem(LAND_BG, b.dataset.n); } catch { /* stockage indisponible */ } sfx('pop'); actions.session({ splashSeen: true }); } },   // enregistrer la session redessine la page : le fond se retrace
      };
      return {
        cls: 'onb-screen',
        html: `${onbDeco(2)}
        <div class="onb-top"><span class="row" style="gap:8px">${logoSymbol(22)}<b class="onb-brand">TEEQA</b></span>
          <button class="btn ghost sm" style="min-height:44px;min-width:96px" data-act="create" data-testid="onb-passer">Passer</button></div>
        <div class="onb-pager" id="onb-pager" role="group" aria-roledescription="carrousel" aria-label="Présentation de TEEQA"><div class="onb-track">
          ${SLIDES.map((s, i) => `<section class="onb-slide" aria-roledescription="diapositive" aria-label="${i + 1} sur ${N}">
            <div class="onb-visual"><div class="onb-stage" aria-hidden="true">${s.art()}</div></div>
            <div class="onb-text"><span class="over"><b>${i + 1} / ${N}</b><span class="rule"></span>${s.over}</span>
              <h2 class="display">${s.title}</h2><p class="muted">${s.text}</p></div>
          </section>`).join('')}
        </div></div>
        <div class="onb-foot">
          <div class="dots" aria-hidden="true">${SLIDES.map((_, i) => `<i style="--on:${i === slide ? 1 : 0}"></i>`).join('')}</div>
          <button class="btn block" data-act="next">Continuer</button>
          <button class="btn text onb-have" data-act="skip">J'ai déjà un compte</button>
        </div>`,
        on: {
          next() { if (slide === N - 1) create(); else goTo(slide + 1); },
          skip: done, create,
        },
        // Carrousel : la piste suit le doigt, puis un ressort la pose sur l'écran le plus proche.
        mount(el) {
          const pg = el.querySelector('#onb-pager'), tr = pg.firstElementChild;
          const slides = [...tr.children], dots = [...el.querySelectorAll('.dots i')], btn = el.querySelector('[data-act="next"]');
          let W = pg.clientWidth || 1, x = -slide * W, stop = () => {}, g = null;
          const sign = signer(el);
          const set = (v) => {
            x = v; tr.style.transform = `translate3d(${v}px,0,0)`;
            const p = -v / W;
            dots.forEach((d, i) => d.style.setProperty('--on', Math.max(0, 1 - Math.abs(p - i)).toFixed(3)));
            slides.forEach((s, i) => { const o = p - i; if (Math.abs(o) < 1.2) s.querySelectorAll('[data-par]').forEach(n => { n.style.transform = `translate3d(${(o * +n.dataset.par).toFixed(1)}px,0,0)`; }); });
          };
          const sync = () => {
            btn.textContent = slide === N - 1 ? 'Créer mon compte' : 'Continuer';
            el.querySelector('.onb-top .btn').style.visibility = slide === N - 1 ? 'hidden' : '';
            slides.forEach((s, i) => { s.inert = i !== slide; s.classList.toggle('on', i === slide); });
            if (slide === N - 1) sign.start(); else sign.reset();
          };
          // Sillage de l'oiseau (accueil 1), trois propositions : 1 des plumes qui tombent, 2 des étoiles dorées, 3 un ruban de
          // petits carreaux avec une plume de temps en temps. Les particules naissent à la queue de l'oiseau, là où il est vraiment.
          const fly = el.querySelector('.onb-fly-y'), stage0 = slides[0].querySelector('.onb-stage'); let trT = 0, trN = 0;
          const trTick = (now) => { if (!pg.isConnected) return; requestAnimationFrame(trTick); if (slide !== 0 || reduced() || !fly || g) return;
            const tv = 2, gap = tv === 1 ? 240 : tv === 2 ? 80 : 65; if (now - trT < gap) return; trT = now;
            const a = stage0.getBoundingClientRect(), r = fly.getBoundingClientRect(), k = a.width / stage0.offsetWidth || 1;
            if (r.right < a.left - 70 || r.left > a.right + 70 || !r.width) return;
            const n = trN++, kind = tv === 1 ? 'f' : tv === 2 ? 's' : n % 10 === 0 ? 'f' : 'z', p = document.createElement('i');
            p.className = `trail ${kind} c${n % 3}`; if (kind === 'f') p.innerHTML = FEATHER;
            p.style.cssText = `left:${((r.left + r.width * .2 - a.left) / k).toFixed(1)}px;top:${((r.top + r.height * .56 - a.top) / k + (kind === 'f' ? 0 : (n % 5 - 2) * 4)).toFixed(1)}px;--r:${(n * 47) % 70 - 35}deg;--dx:${(n * 31) % 44 - 22}px`;
            stage0.appendChild(p); setTimeout(() => p.remove(), kind === 'f' ? 2400 : 1300); };
          requestAnimationFrame(trTick);
          goTo = (i, v = 0) => { slide = Math.max(0, Math.min(N - 1, i)); sync(); stop(); stop = spring({ from: x, to: -slide * W, velocity: v, onUpdate: set }); };
          set(x); sync();
          pg.addEventListener('pointerdown', (e) => { if (e.button === 0) g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, base: x, on: false, h: [[performance.now(), e.clientX]] }; });
          pg.addEventListener('pointermove', (e) => {
            if (!g || e.pointerId !== g.id) return;
            const d = e.clientX - g.x0;
            if (!g.on) { if (Math.abs(e.clientY - g.y0) > 10 && Math.abs(d) < 6) { g = null; return; } if (Math.abs(d) < 6) return; g.on = true; stop(); try { pg.setPointerCapture(e.pointerId); } catch {} }
            e.preventDefault();
            g.h.push([performance.now(), e.clientX]); if (g.h.length > 6) g.h.shift();
            let v = g.base + d; const min = -(N - 1) * W;
            if (v > 0) v *= 0.3; else if (v < min) v = min + (v - min) * 0.3;   // résistance aux deux bouts
            set(v);
          });
          const end = (e) => {
            if (!g || e.pointerId !== g.id) return; const was = g; g = null; if (!was.on) return;
            const now = performance.now(), h = was.h.filter(([t]) => now - t < 100), a = h[0], b = h[h.length - 1];
            const vel = h.length > 1 && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
            const d = e.clientX - was.x0, from = Math.round(-was.base / W);
            goTo(from + (d < -W * 0.22 || vel < -0.4 ? 1 : d > W * 0.22 || vel > 0.4 ? -1 : 0), vel);
          };
          pg.addEventListener('pointerup', end); pg.addEventListener('pointercancel', end);
          const onResize = () => { if (!pg.isConnected) return removeEventListener('resize', onResize); W = pg.clientWidth || 1; stop(); set(-slide * W); };
          addEventListener('resize', onResize);
        },
      };
    },
  },
  {
    name: 'login', pattern: /^\/login$/,
    render() {
      const r = get().role;
      return {
        cls: 'dark',
        html: `
        <div class="scroll"><div class="content" style="display:grid;gap:22px;padding-top:28px">
          <div class="row" style="gap:10px">${logoSymbol(30)}<b style="font-stretch:125%;font-weight:900;letter-spacing:.08em;font-size:20px">TEEQA</b></div>
          <div style="display:grid;gap:10px"><span class="over"><b>Bienvenue</b><span class="rule"></span>Votre rôle</span>
            <h1 class="display">Choisissez <span class="kw">votre porte</span>.</h1>
            <p class="muted">Client et entreprise ont un compte. Le contrôleur entre par un lien, sans compte.</p></div>
          <div class="doors" role="radiogroup" aria-label="Votre rôle">
            ${Object.entries(ROLES).map(([k, v]) => `
              <button class="door-card" role="radio" aria-checked="${k === r}" data-act="pick" data-role="${k}" aria-label="${v.label} : ${DOOR_TEXT[k]}">
                <span class="door-frame"><span class="door-inside"><img src="assets/photos/${DOOR_PHOTO[k]}.webp" alt="" draggable="false"></span>${doorLeaves()}</span>
                <span class="dl">${v.label}</span><span class="ds">${DOOR_TEXT[k]}</span>
              </button>`).join('')}
          </div>
          <div class="doors-frieze" aria-hidden="true">${frieze(2, 22)}</div>
        </div></div>
        <div class="footer-cta">
          <button class="btn saffron block" data-act="login">${r === 'controleur' ? "Ouvrir mon lien d'invitation" : `Entrer · ${esc(ROLES[r].label)}`}</button>
          <button class="btn text" style="--fg:var(--sage-ink);justify-self:center" data-go="#/signup">Je n'ai pas encore de compte</button>
        </div>`,
        on: {
          pick(b) { actions.setRole(b.dataset.role); },
          login() {
            sfx('pop');
            enterDoor(() => {
              actions.session({ loggedIn: true });
              // Le contrôleur n'a pas de compte : il arrive par son lien d'invitation.
              const p = get().role === 'controleur' && get().projects.find(x => x.invites.controleur && x.invites.controleur.status !== 'non_creee');
              go(p ? `#/invite/${p.id}/controleur` : '#/home', { replace: true });
            });
          },
          'login-empty'() { reset({ empty: true }); actions.session({ loggedIn: true, onboarded: true, splashSeen: true }); go('#/home', { replace: true }); },
        },
      };
    },
  },
];

// Pour les planches d'inventaire (refs/planche-*.html, 16 nov.) : les dessins internes sont lisibles de l'extérieur, sans rien changer à l'appli.
export { bellarejFace, bellarejFront, bellarejSigne, landBg, icDate, icPlace, icSync, icLoupe, icDoc, icSeal, icOk, icWarn, icNo, icCam, icChoice };
