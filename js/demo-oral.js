// Soutenance du 1er déc. 2026 · partie « Maquettage & UX » (demo-oral.html). Mode d'emploi : refs/demo-oral/MODE-EMPLOI.md.
// Nabih avance au clic ou au clavier (→, espace, Page suivante) et recule (←, Page précédente) :
//   0 fil · 1 la pub arrive · 2 la vidéo plein écran, avec le son · 3 le profil @teeqa.app · 4 la fiche de l'appli
//   5 Obtenir : l'anneau se remplit, puis « Ouvrir » · 6 Ouvrir : trois téléphones (la vraie appli) et le fil conducteur.
// Le fil du réseau social reprend des gestes et une mise en page génériques : aucun logo, aucun nom, aucune couleur d'une autre marque.
// Les trois téléphones chargent index.html?oral&role=… : le chantier passe de l'un à l'autre par le stockage du navigateur
// (crochet ORAL de js/store.js). Au premier chargement (ou après « Tout remettre à zéro »), l'étape 4 de Villa Nador est
// préparée « en cours » par les actions de l'appli, pour que l'entreprise déclare la fin devant le jury.
import { bellarejRig } from './bellarej-rig.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const scene = $('#scene'), ecran = $('#ecran');
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dort = (ms) => new Promise((r) => setTimeout(r, ms));
const VIDEO = 'assets/video/teeqa-hybride-9x16-son-web.mp4', AFFICHE = 'assets/video/teeqa-hybride-9x16-affiche.jpg';
const ICONE = 'assets/icone/icon-180.png';

// ---------- échelle : une scène 1920 × 1080 qui remplit l'écran ----------
let echelle = 1;
function ajuster() { echelle = Math.min(innerWidth / 1920, innerHeight / 1080); scene.style.transform = `scale(${echelle})`; }
addEventListener('resize', ajuster); ajuster();

// ---------- ressorts (masse, raideur, amortissement) rendus en courbe CSS linear() ----------
const LINEAR_OK = CSS.supports('animation-timing-function', 'linear(0, 1)');
function ressort({ k = 170, c = 22, m = 1 } = {}) {
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  const x = z < 1 ? (t) => { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
    : (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  let T = 0; for (let t = 0; t < 4; t += 1 / 240) if (Math.abs(1 - x(t)) > 0.0015) T = t;
  T += 1 / 60; const pts = []; for (let i = 0; i <= 60; i++) pts.push(+x((T * i) / 60).toFixed(4)); pts[60] = 1;
  return { easing: LINEAR_OK ? `linear(${pts.join(', ')})` : 'cubic-bezier(.2, .9, .25, 1.1)', duration: Math.round(T * 1000), x, T };
}
const VIF = ressort({ k: 210, c: 24 }), DOUX = ressort({ k: 120, c: 20 }), REBOND = ressort({ k: 160, c: 15 }), LENT = ressort({ k: 70, c: 17 });
// Joue une animation (sans état gardé : le style final est posé avant) ; en « Réduire les animations », un simple fondu court.
function bouge(el, images, sp = VIF, extra = {}) {
  if (!el) return null;
  if (calme) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, ...extra, delay: 0 });
  return el.animate(images, { duration: sp.duration, easing: sp.easing, ...extra });
}
// Défilement au ressort (le fil qui glisse jusqu'à la pub).
function defiler(el, vers, sp = LENT) {
  const de = el.scrollTop; if (calme) { el.scrollTop = vers; return Promise.resolve(); }
  return new Promise((ok) => { const t0 = performance.now();
    const pas = (t) => { const s = Math.min((t - t0) / 1000, sp.T); el.scrollTop = de + (vers - de) * sp.x(s); if (s < sp.T) requestAnimationFrame(pas); else { el.scrollTop = vers; ok(); } };
    requestAnimationFrame(pas); });
}

// ---------- icônes au trait (génériques) ----------
const P = {
  coeur: 'M12 20.3C6.2 16 3 12.6 3 8.9A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 9 2.3c0 3.7-3.2 7.1-9 11.4z',
  bulle: 'M20.8 11.6a8.6 8.6 0 0 1-12.7 7.5L3.2 20.8l1.6-4.8a8.6 8.6 0 1 1 16-4.4z',
  envoi: 'M21.4 3.2 3.4 10.1l7.2 3.2 3.3 7.4zM10.6 13.3l10.8-10.1',
  signet: 'M6.2 3.6h11.6v16.8L12 16.2l-5.8 4.2z',
  maison: 'M3.6 10.4 12 3.6l8.4 6.8V20a.9.9 0 0 1-.9.9H15v-6.2H9v6.2H4.5a.9.9 0 0 1-.9-.9z',
  loupe: 'M10.8 4a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6zM15.8 15.8l4.6 4.6',
  plus: 'M5 3.6h14a1.4 1.4 0 0 1 1.4 1.4v14a1.4 1.4 0 0 1-1.4 1.4H5A1.4 1.4 0 0 1 3.6 19V5A1.4 1.4 0 0 1 5 3.6zM12 8v8M8 12h8',
  film: 'M5 3.6h14a1.4 1.4 0 0 1 1.4 1.4v14a1.4 1.4 0 0 1-1.4 1.4H5A1.4 1.4 0 0 1 3.6 19V5A1.4 1.4 0 0 1 5 3.6zM3.6 8.4h16.8M8.4 3.6l2.4 4.8M13.8 3.6l2.4 4.8M10.2 11.6v5.6l4.6-2.8z',
  points: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  retour: 'M15 4.5 7.5 12l7.5 7.5',
  cloche: 'M6.4 16.2v-5a5.6 5.6 0 0 1 11.2 0v5l1.6 2H4.8zM10 20.6a2 2 0 0 0 4 0',
  grille: 'M3.6 3.6h16.8v16.8H3.6zM9.2 3.6v16.8M14.8 3.6v16.8M3.6 9.2h16.8M3.6 14.8h16.8',
  lien: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  muet: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l4.5 5M20.5 9.5l-4.5 5',
  question: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  roles: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2.8 19c.6-3 2.7-4.6 5.2-4.6s4.6 1.6 5.2 4.6M14 14.6c2.7-.5 5.6.6 6.6 4.4',
  oeil: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  porte: 'M3.5 7.5h17v11h-17zM3.5 7.5l2-3h13l2 3M15.5 13h2',
  bas: 'M12 4v12M6.5 11 12 16.5 17.5 11M5 20h14',
};
const ico = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const heure = () => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
const barreEtat = () => `<div class="barre-etat"><b data-heure>${heure()}</b><span class="ic-et">
  <svg width="18" height="12" viewBox="0 0 18 12"><g fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></g></svg>
  <svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 4.2a10 10 0 0 1 14 0M3.6 6.9a6.3 6.3 0 0 1 8.8 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="8" cy="10" r="1.6" fill="#fff"/></svg>
  <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="rgba(255,255,255,.45)"/><rect x="2.2" y="2.2" width="19.6" height="8.6" rx="2.4" fill="#fff"/><path d="M25.3 4.5v4" stroke="rgba(255,255,255,.45)" stroke-width="1.6" stroke-linecap="round"/></svg></span></div>`;
setInterval(() => $$('[data-heure]').forEach((e) => { e.textContent = heure(); }), 15000);

// ---------- les écrans du téléphone ----------
const AMI = (n) => `assets/video/reels/ami-${n}.png`;
const LEGENDE = 'Ta maison au Maroc, suivie de France. L’entreprise déclare en photos, un contrôleur indépendant vérifie, tu décides de payer.';
ecran.innerHTML = `
<section class="couche fil" id="fil">
  <div class="fil-tete"><b>Pour vous</b>${ico('coeur')}${ico('envoi')}</div>
  <div class="histoires">
    <div><span class="rond vu"><span class="moi">+</span></span>Votre story</div>
    <div><span class="rond"><img src="${AMI(1)}" alt=""></span>yasmine.k</div>
    <div><span class="rond"><img src="${AMI(2)}" alt=""></span>mehdi_bxl</div>
    <div><span class="rond"><img src="${AMI(3)}" alt=""></span>lina.voyage</div>
    <div><span class="rond vu"><img src="assets/vitrine/temoins/femme.jpg" alt=""></span>samira.k</div>
  </div>
  <article class="post"><div class="post-tete"><img src="${AMI(2)}" alt=""><span class="qui"><b>mehdi_bxl</b><small>Nador</small></span>${ico('points')}</div>
    <div class="post-media"><img src="assets/photos/p6.webp" alt="Un chantier de maison au Maroc"></div>
    <div class="post-actions">${ico('coeur')}${ico('bulle')}${ico('envoi')}<span class="droite">${ico('signet')}</span></div>
    <p class="j">86 J’aime</p><p><b>mehdi_bxl</b> Le cousin m’envoie ça. « Ça avance, hamdoullah. » Et moi, de Bruxelles, je dois deviner.</p><p class="quand">Il y a 2 heures</p></article>
  <article class="post"><div class="post-tete"><img src="${AMI(3)}" alt=""><span class="qui"><b>lina.voyage</b><small>Saïdia</small></span>${ico('points')}</div>
    <div class="post-media"><img src="assets/vitrine/ciel/ciel.webp" alt="Un ciel du matin"></div>
    <div class="post-actions">${ico('coeur')}${ico('bulle')}${ico('envoi')}<span class="droite">${ico('signet')}</span></div>
    <p class="j">214 J’aime</p><p><b>lina.voyage</b> Le ciel de ce matin, avant de reprendre la route vers Lyon.</p><p class="quand">Il y a 5 heures</p></article>
  <article class="post pub" id="pub"><div class="post-tete"><img src="${ICONE}" alt=""><span class="qui"><b>teeqa.app</b><small>Sponsorisé</small></span>${ico('points')}</div>
    <div class="post-media"><video id="apercu" src="${VIDEO}" poster="${AFFICHE}" muted loop playsinline preload="auto"></video><span class="son-coupe">${ico('muet')}</span></div>
    <div class="cta">Télécharger l’appli <svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6"/></svg></div>
    <div class="post-actions">${ico('coeur')}${ico('bulle')}${ico('envoi')}<span class="droite">${ico('signet')}</span></div>
    <p><b>teeqa.app</b> ${LEGENDE}</p></article>
  <article class="post"><div class="post-tete"><img src="assets/vitrine/temoins/femme.jpg" alt=""><span class="qui"><b>samira.k</b><small>Lyon</small></span>${ico('points')}</div>
    <div class="post-media"><img src="assets/photos/p2.webp" alt=""></div>
    <div class="post-actions">${ico('coeur')}${ico('bulle')}${ico('envoi')}<span class="droite">${ico('signet')}</span></div></article>
</section>
<nav class="onglets-bas" aria-hidden="true">${ico('maison')}${ico('loupe')}${ico('plus')}${ico('film')}<img src="${AMI(1)}" alt=""></nav>

<section class="couche reel" id="reel" hidden>
  <video id="film" src="${VIDEO}" poster="${AFFICHE}" playsinline preload="auto"></video><div class="ombre"></div>
  <div class="haut">${ico('retour')}<span>Pour vous</span></div>
  <div class="toucher"><svg width="34" height="34" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg></div>
  <div class="colonne"><div>${ico('coeur')}1 204</div><div>${ico('bulle')}96</div><div>${ico('envoi')}312</div><div>${ico('points')}</div></div>
  <div class="bas"><span class="compte" id="compte"><img src="${ICONE}" alt="">teeqa.app<span class="suivre">Suivre</span></span>
    <p>${LEGENDE}</p><small>Sponsorisé · musique originale</small></div>
  <div class="cta" id="cta-reel">Télécharger l’appli <svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6"/></svg></div>
  <div class="piste"><i id="piste"></i></div>
</section>

<section class="couche profil" id="profil" hidden>
  <div class="pf-nav"><span data-retour>${ico('retour')}</span><b>teeqa.app</b>${ico('cloche')}${ico('points')}</div>
  <div class="pf-haut"><span class="pf-av"><img src="${ICONE}" alt="TEEQA"></span>
    <div class="pf-chiffres"><span><b>24</b>publications</span><span><b>1 284</b>abonnés</span><span><b>12</b>suivis</span></div></div>
  <div class="pf-bio"><b>TEEQA | Suivi chantier Maroc</b><p class="cat">Application</p>
    <p>Ta maison au Maroc, suivie de France.</p><p>L’entreprise déclare en photos, un contrôleur indépendant vérifie, tu décides de payer.</p><p>L’appli est disponible 👇</p>
    <span class="pf-lien" id="lien"><svg viewBox="0 0 24 24"><path d="${P.lien}"/></svg>teeqa.app/appli</span></div>
  <div class="pf-boutons"><span class="fort">Suivre</span><span>Message</span><span class="petit">+</span></div>
  <div class="alaune">${[['question', 'C’est quoi ?'], ['roles', 'Comment ça marche'], ['oeil', 'La visite'], ['porte', 'Ton argent'], ['bulle', 'Questions'], ['bas', 'L’appli', 'safran']]
    .map(([i, t, c]) => `<div class="${c || ''}"><i><span>${ico(i, '')}</span></i>${t}</div>`).join('')}</div>
  <div class="pf-tabs"><button class="on" data-tab="grille">${ico('grille')}</button><button data-tab="reels">${ico('film')}</button></div>
  <div class="grille" id="grille"></div>
</section>

<section class="couche fiche" id="fiche" hidden></section>`;

// Grille du profil : publications et Reels repris de reports/Stratégie Instagram TEEQA 2026.md (séries C et R).
const POSTS = [
  ['fes', 'Ta maison au Maroc. <em>Trois rôles,</em> une règle simple.'],
  ['photo', '« Paiement recommandé. » Deux mots. Derrière, trois personnes.', 'p3', 1],
  ['safran', 'TEEQA est sortie. Ta place t’attend.'],
  ['chaux', 'Trois avis possibles après une visite. Aucun n’est une punition.'],
  ['photo', 'Tu demandes : « Ça avance ? » Et tu sais quoi de plus ?', 'p5', 1],
  ['fes', 'Pourquoi une cigogne ?', null, 0, 'vol'],
  ['chaux', 'Avant de payer une tranche, <em>cinq questions.</em>'],
  ['photo', 'Les fondations, une fois coulées, on ne les voit plus jamais.', 'p1', 1],
  ['encre', 'Ce que TEEQA fait. Ce qu’elle ne fera jamais.'],
  ['photo', 'Cinq moments où un chantier se joue.', 'p8'],
  ['chaux', 'Quarante vocaux, <em>ou une page claire.</em>'],
  ['fes', 'Maâlem. Celui dont toute la famille a le numéro.'],
];
const REELS = [['« Paiement différé », ça ne veut pas dire dispute.', 'p9'], ['« Paiement recommandé. » Deux mots. Derrière, trois personnes.', 'p3'],
  ['Tu descends cet été ? Trois choses à regarder.', 'p10'], ['Regarde bien cette photo. Qu’est-ce que tu vérifierais ?', 'p4'],
  ['Les fondations, une fois coulées, on ne les voit plus jamais.', 'p1'], ['Tu viens de rentrer. Le chantier, lui, continue.', 'p11']];
const LECTURE = '<svg class="lecture" viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
function grille(quoi) {
  const g = $('#grille'); g.className = `grille ${quoi}`;
  g.innerHTML = quoi === 'reels'
    ? REELS.map(([t, ph]) => `<div class="tuile photo"><img src="assets/photos/${ph}.webp" alt="" loading="lazy">${LECTURE}<span>${t}</span></div>`).join('')
    : POSTS.map(([c, t, ph, lit, oiseau]) => `<div class="tuile ${c}">${ph ? `<img src="assets/photos/${ph}.webp" alt="" loading="lazy">` : ''}${lit ? LECTURE : ''}${oiseau ? `<span class="oiseau">${bellarejRig(oiseau, 74)}</span>` : ''}<span>${t}</span></div>`).join('');
  $$('.pf-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === quoi));
}
grille('grille');
ecran.insertAdjacentHTML('beforeend', barreEtat());

// ---------- la fiche de l'appli : appstore.html dans le téléphone ----------
try { localStorage.removeItem('teeqa-projection-obtenu'); } catch { /* stockage indisponible */ }
const fiche = $('#fiche');
fiche.innerHTML = '<iframe id="store" src="appstore.html#fiche" title="Fiche de l’appli TEEQA" tabindex="-1"></iframe>';
const store = $('#store');
let ficheEtat = 'obtenir';   // obtenir · charge · ouvrir
const STYLE_FICHE = `:root { --st: 52px !important; --sb: 18px !important; }
  .proj { display: none !important; } .sbar .round[href] { visibility: hidden; }
  .get.dl { min-width: 32px !important; width: 32px; padding: 0; background: none !important; color: transparent !important; }
  .get.dl::after { content: ""; position: absolute; inset: 1px; border-radius: 50%; border: 0; animation: none;
    background: conic-gradient(var(--blue) calc(var(--p, 0) * 1%), var(--card2) 0);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px)); }
  .get.dl.attente::after { background: conic-gradient(var(--blue) 0 24%, var(--card2) 0); animation: spin .8s linear infinite; }
  .get.dl::before { content: ""; position: absolute; left: 11px; top: 11px; width: 10px; height: 10px; border-radius: 2px; background: var(--blue); }
  .get.pret { animation: pret .5s cubic-bezier(.3, 1.6, .5, 1); } @keyframes pret { from { transform: scale(.55); } }`;
store.addEventListener('load', () => {
  const d = store.contentDocument; if (!d) return;
  const st = d.createElement('style'); st.textContent = STYLE_FICHE; d.head.appendChild(st);
  // « Obtenir » / « Ouvrir » : c'est la page qui mène le jeu (la fiche ne s'installe ni ne quitte la page).
  d.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-get]'); if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (ficheEtat === 'obtenir') aller(5); else if (ficheEtat === 'ouvrir') aller(6); }, true);
  relayerTouches(store.contentWindow);
  peindreBoutons();
});
const boutonsFiche = () => { try { return $$('[data-get]', store.contentDocument); } catch { return []; } };
function peindreBoutons() {
  boutonsFiche().forEach((b) => { b.classList.remove('dl', 'attente', 'load', 'pret'); b.style.removeProperty('--p'); b.textContent = ficheEtat === 'ouvrir' ? 'Ouvrir' : 'Obtenir'; });
}
let telechargement = null;
async function obtenir() {
  ficheEtat = 'charge'; const jeton = telechargement = {};
  const bs = boutonsFiche(); bs.forEach((b) => { b.textContent = ''; b.classList.add('dl', 'attente'); b.style.setProperty('--p', 0); });
  await dort(calme ? 150 : 750); if (jeton !== telechargement) return;
  bs.forEach((b) => b.classList.remove('attente'));
  const duree = calme ? 300 : 2300, t0 = performance.now();
  // Un vrai téléchargement : rapide au départ, un palier, puis la fin d'un coup.
  const courbe = (u) => u < .45 ? 1.25 * u : u < .7 ? .5625 + .3 * (u - .45) : .6375 + 1.2083 * (u - .7);
  await new Promise((ok) => { const pas = (t) => { if (jeton !== telechargement) return ok();
    const u = Math.min((t - t0) / duree, 1); bs.forEach((b) => b.style.setProperty('--p', (Math.min(courbe(u), 1) * 100).toFixed(1)));
    if (u < 1) requestAnimationFrame(pas); else ok(); }; requestAnimationFrame(pas); });
  if (jeton !== telechargement) return;
  ficheEtat = 'ouvrir'; peindreBoutons(); bs.forEach((b) => b.classList.add('pret'));
}
function lancerSplash() {
  try { const d = store.contentDocument, root = d.getElementById('as'), s = d.getElementById('splash');
    const b = boutonsFiche().find((x) => x.getBoundingClientRect().width > 0 && getComputedStyle(x).opacity !== '0') || boutonsFiche()[0];
    const a = root.getBoundingClientRect(), r = b.getBoundingClientRect();
    s.style.setProperty('--x', `${r.left + r.width / 2 - a.left}px`); s.style.setProperty('--y', `${r.top + r.height / 2 - a.top}px`); s.classList.add('on'); } catch { /* fiche absente */ }
}
const fermerSplash = () => { try { store.contentDocument.getElementById('splash').classList.remove('on'); } catch { /* fiche absente */ } };

// ---------- le récit à gauche, les jalons à droite ----------
const RECIT = [
  ['Un dimanche soir, à Lyon', 'Karim fait défiler son fil, <b>sans rien chercher.</b>'],
  ['Un dimanche soir, à Lyon', 'Entre deux photos, une vidéo <b>l’arrête.</b>'],
  ['La publicité', 'Il touche. La vidéo se lance, <b>avec le son.</b>'],
  ['Le profil', 'Qui est derrière ? Il ouvre <b>@teeqa.app.</b>'],
  ['La fiche de l’appli', 'Le lien de la bio mène à la fiche : <b>captures, note, avis.</b>'],
  ['Le téléchargement', 'Obtenir. L’anneau se remplit, <b>puis Ouvrir.</b>'],
];
const JALONS = ['Le fil', 'La vidéo', 'Le profil', 'La fiche', 'L’appli'], JALON = [0, 0, 1, 2, 3, 3, 4];
$('#jalons').innerHTML = JALONS.map((t) => `<li><i></i>${t}</li>`).join('');
function peindreRecit(n) {
  const r = RECIT[Math.min(n, RECIT.length - 1)], el = $('#recit'), html = `<small>${r[0]}</small><p>${r[1]}</p>`;
  if (el.innerHTML !== html) { el.innerHTML = html; bouge(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], DOUX); }
  $$('#jalons li').forEach((li, i) => { li.className = i < JALON[n] ? 'fait' : i === JALON[n] ? 'ici' : ''; });
}

// ---------- vidéo ----------
const apercu = $('#apercu'), film = $('#film'), reel = $('#reel');
apercu.play().catch(() => {});
film.addEventListener('timeupdate', () => { $('#piste').style.width = `${(film.currentTime / (film.duration || 55)) * 100}%`; });
film.addEventListener('ended', () => reel.classList.add('pause'));
let fondu = 0;
function volume(vers, ms = 450) {
  cancelAnimationFrame(fondu); const de = film.volume, t0 = performance.now();
  return new Promise((ok) => { const pas = (t) => { const u = Math.min((t - t0) / ms, 1); film.volume = Math.max(0, Math.min(1, de + (vers - de) * u)); if (u < 1) fondu = requestAnimationFrame(pas); else ok(); }; fondu = requestAnimationFrame(pas); });
}
async function jouer(depuisDebut) {
  if (depuisDebut) film.currentTime = 0;
  film.muted = false; film.volume = depuisDebut ? 1 : 0;
  try { await film.play(); reel.classList.remove('pause'); if (!depuisDebut) volume(1, 350); } catch { reel.classList.add('pause'); }
}
async function couper() { if (film.paused) return; await volume(0, 380); film.pause(); }
reel.addEventListener('click', (e) => {
  if (e.target.closest('#compte')) return aller(3);
  if (e.target.closest('#cta-reel')) return aller(4);
  if (e.target.closest('.haut')) return aller(1);
  if (film.paused) jouer(false); else { film.pause(); reel.classList.add('pause'); }
});

// ---------- les gestes dans le téléphone ----------
$('#pub').addEventListener('click', () => aller(2));
$('#lien').addEventListener('click', () => aller(4));
$('[data-retour]').addEventListener('click', () => aller(2));
$$('.pf-tabs button').forEach((b) => b.addEventListener('click', () => grille(b.dataset.tab)));
const fil = $('#fil');
const cibleFil = () => { const p = $('#pub'); return Math.max(0, p.offsetTop - 104); };

// ---------- les étapes de l'acte 1 ----------
let beat = 0, occupe = false;
const montrer = (el, oui) => { el.hidden = !oui; };
async function aller(n) {
  n = Math.max(0, Math.min(6, n));
  if (occupe || n === beat) return;
  const de = beat; occupe = true; beat = n; scene.dataset.beat = n;
  try { await transition(de, n); } finally { occupe = false; }
  peindreRecit(Math.min(n, 5));
}
async function transition(de, n) {
  const avant = n > de;
  if (de === 6) await quitterTrio();
  if (n <= 1) {   // le fil
    if (!reel.hidden) { couper(); const r = rectPub(); await bouge(reel, [{ clipPath: 'inset(0 round 0px)' }, { clipPath: r }], VIF)?.finished; }
    montrer(reel, false); montrer($('#profil'), false); montrer(fiche, false);
    apercu.play().catch(() => {});
    peindreRecit(n);
    await defiler(fil, n === 1 ? cibleFil() : 0, n === 1 ? LENT : DOUX);
    return;
  }
  if (n === 2) {   // la vidéo plein écran
    if (de <= 1) {
      if (Math.abs(fil.scrollTop - cibleFil()) > 4) await defiler(fil, cibleFil(), VIF);
      montrer(reel, true); jouer(true); apercu.pause();
      peindreRecit(2);
      await bouge(reel, [{ clipPath: rectPub() }, { clipPath: 'inset(0 round 0px)' }], DOUX)?.finished;
    } else { await sortir($$('#profil, #fiche').filter((x) => !x.hidden)); montrer(reel, true); jouer(false); }
    return;
  }
  if (n === 3) {   // le profil
    couper();
    if (de < 3) { montrer($('#profil'), true); $('#profil').scrollTop = 0; await pousser($('#profil')); montrer(reel, de >= 2); }
    else { if ($('#profil').hidden) montrer($('#profil'), true); await sortir([fiche]); }
    return;
  }
  if (n === 4) {   // la fiche
    couper();
    if (de < 4) { const l = $('#lien'); l.classList.remove('touche'); void l.offsetWidth; if (de === 3) { l.classList.add('touche'); await dort(260); }
      telechargement = null; ficheEtat = 'obtenir'; peindreBoutons(); montrer(fiche, true); await pousser(fiche); }
    else { telechargement = null; ficheEtat = 'obtenir'; peindreBoutons(); }
    return;
  }
  if (n === 5) {   // Obtenir → Ouvrir
    if (de < 4) { await transition(de, 4); }
    if (avant) { obtenir(); }
    else { fermerSplash(); ficheEtat = 'ouvrir'; peindreBoutons(); }
    return;
  }
  if (n === 6) {   // Ouvrir : les trois téléphones
    if (ficheEtat !== 'ouvrir') { telechargement = null; ficheEtat = 'ouvrir'; peindreBoutons(); }
    await entrerTrio();
  }
}
const rectPub = () => { const m = $('#pub .post-media').getBoundingClientRect(), e = ecran.getBoundingClientRect(), k = e.width / ecran.offsetWidth;
  const t = (m.top - e.top) / k, l = (m.left - e.left) / k, b = (e.bottom - m.bottom) / k, r = (e.right - m.right) / k; return `inset(${t}px ${r}px ${b}px ${l}px round 0px)`; };
async function pousser(el) {
  const sous = [...ecran.querySelectorAll('.couche:not([hidden])')].filter((x) => x !== el).pop();
  sous && bouge(sous, [{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-28%)', filter: 'brightness(.6)' }], VIF);
  await bouge(el, [{ transform: 'translateX(100%)', boxShadow: '-20px 0 40px rgba(0,0,0,0)' }, { transform: 'none', boxShadow: '-20px 0 40px rgba(0,0,0,.4)' }], VIF)?.finished;
}
async function sortir(els) {
  for (const el of els) { await bouge(el, [{ transform: 'none' }, { transform: 'translateX(100%)' }], VIF)?.finished; montrer(el, false); }
}

function LANCE_HTML() { return `<div class="lance"><img src="${ICONE}" alt=""><b>TEEQA</b></div>`; }
// ---------- acte 2 : trois téléphones ----------
// 26 nov. (retour de Nabih) : l'histoire commence par le client, sur un chantier vide. Acte A : il crée le chantier et
// invite l'entreprise, convention acceptée des deux côtés, forfait payé. « Trois mois plus tard » fait le saut dans le
// temps (fondations, murs et dalle faits, vérifiés, payés). Acte B : une étape contrôlée, de la fin déclarée au paiement.
const ROLES3 = [
  ['client', 'Client', 'Karim · Lyon', '#14503F'],
  ['entreprise', 'Entreprise', 'Rachid BTP · Nador', '#B8603A'],
  ['controleur', 'Contrôleur', 'agence de l’Oriental', '#2E6FB0'],
];
$('#trio').innerHTML = ROLES3.map(([r, t, q, c]) => `<div class="place" data-role="${r}" style="--c:${c}">
  <div class="etiquette"><i></i>${t}<small>${q}</small></div>
  <div class="cadre"><iframe data-role="${r}" title="TEEQA · ${t}" tabindex="-1"></iframe>${LANCE_HTML()}</div></div>`).join('');
const cadre = (r) => $(`.place[data-role="${r}"] .cadre`), fen = (r) => $(`iframe[data-role="${r}"]`);
const urlRole = (r) => `index.html?oral&direct&role=${r}#/home`;
async function attendreAppli(r, ms = 60000) {
  const t0 = Date.now();
  for (;;) { const w = fen(r).contentWindow; try { if (w && w.__teeqa && w.__teeqa.get()) return w; } catch { /* chargement */ } if (Date.now() - t0 > ms) throw new Error('appli ' + r); await dort(120); }
}
function brancher(r, w) {
  // Devant le jury, rien qui casse la scène : ni « Changer de vue », ni le chantier d'exemple, ni les outils de présentation.
  try { const st = w.document.createElement('style'); st.textContent = '[data-act="role-sheet"], [data-act="exemple"], [data-testid="voir-exemple"], [data-testid="voir-exemple"] + p, [data-testid="presentation-tools"] { display: none !important; }'; w.document.head.appendChild(st); } catch { /* autre origine */ }
  w.addEventListener('teeqa-salle-notif', (e) => bandeau(r, e.detail));
  // Dans un cadre, le navigateur ne prête pas la webcam : la caméra de l'appli s'ouvre directement (pas de demande à l'écran).
  if (r !== 'client') try { if (!w.__teeqa.get().drafts.camPerm) w.__teeqa.actions.setDraft('camPerm', 'simulee'); } catch { /* ancien état */ }
  relayerTouches(w);
}
// Chaque téléphone garde son écran de lancement (jamais noir) jusqu'à ce que son appli réponde ; un échec recharge.
const prets = {};
async function chargerRole(r) {
  const f = fen(r); prets[r] = false; if (!cadre(r).querySelector('.lance')) cadre(r).insertAdjacentHTML('beforeend', LANCE_HTML());
  for (let essai = 0; essai < 3; essai++) {
    f.src = 'about:blank'; await dort(30); f.src = urlRole(r);
    try { const w = await attendreAppli(r); brancher(r, w); await dort(350); prets[r] = true;
      // Une remise à zéro pendant les trois téléphones : le lancement s'efface ici (à l'entrée, c'est entrerTrio).
      if (scene.classList.contains('trois') && !enEntree) { const l = cadre(r).querySelector('.lance'); if (l) l.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' }).finished.then(() => l.remove()); }
      return w; }
    catch (e) { console.warn('Nouvel essai de chargement :', r); }
  }
  throw new Error('appli ' + r + ' injoignable');
}
const DOC_VIDE = { projects: [], notifications: [], reports: [], avis: [], noms: {} };
const projetDemo = (doc) => doc && doc.projects && doc.projects.find((x) => x.name === 'Villa Nador');
const lireDoc = () => { try { const d = JSON.parse(localStorage.getItem('teeqa-oral-chantier') || 'null'); return d && d.doc; } catch { return null; } };
// Le formulaire du client est déjà rempli : devant le jury, on touche, on ne tape pas.
function preremplir(w) {
  try { if (!(w.__teeqa.get().drafts || {}).newProject) w.__teeqa.actions.setDraft('newProject', {
    name: 'Villa Nador', city: 'Nador', address: 'Lotissement Al Matar, lot 14', type: 'neuf', email: 'contact@rachid-btp.ma', stage: 1,
    quote: { name: 'Devis-Rachid-BTP-2026-118.pdf', size: 48213 } }); } catch { /* ancien état */ }
}

// « Deux mois plus tard » : la préparation recule de 75 jours ; étapes 1 et 2 faites, contrôlées, payées ;
// la dalle (étape 3, contrôlée) a commencé il y a deux jours. Fait par les actions de l'appli, comme tests/e2e.mjs.
async function avancer() {
  const w = fen('entreprise').contentWindow;
  const S = await w.eval("import('/js/store.js')"), A = S.actions, sig = [[[20, 60], [120, 40], [220, 70], [300, 52]]];
  const J = 864e5, base = Date.now(), RECUL = 75 * J;
  let p = projetDemo(S.get());
  if (!p) {   // l'acte A a été sauté : on crée le chantier comme l'aurait fait le client
    const id = A.createProject({ name: 'Villa Nador', city: 'Nador', steps: [...S.TEMPLATE_STEPS], email: 'contact@rachid-btp.ma', controls: 4, prep: { type: 'neuf', address: 'Lotissement Al Matar, lot 14', quote: { name: 'Devis-Rachid-BTP-2026-118.pdf', size: 48213 } } });
    p = S.project(id);
  }
  const PID = p.id;
  if (p.invites.entreprise.status === 'envoyee') A.acceptInvite(PID, 'entreprise');
  if (S.project(PID).convention && !S.conventionOk(S.project(PID))) { A.acceptConvention(PID, 'entreprise'); A.acceptConvention(PID, 'client'); }
  if (!(S.project(PID).forfait && S.project(PID).forfait.paidAt)) A.payForfait(PID, 'carte');
  // Le devis de Rachid BTP découpé par étape (1 000 000 DH), confirmé par l'entreprise : chaque étape a sa tranche.
  if (!S.project(PID).budget) S.commit(() => { const q = S.project(PID); q.budget = { source: 'Devis Rachid BTP n° 2026-118', at: new Date().toISOString(),
    tranches: Object.fromEntries(q.steps.map((x, i) => [x.id, [180000, 260000, 210000, 150000, 120000, 80000][i] || 0])), entrepriseAt: new Date().toISOString() }; });
  // L'agence de contrôle a ouvert le lien de sa mission (sans compte) : elle voit le chantier.
  if (S.project(PID).invites.controleur && S.project(PID).invites.controleur.status === 'envoyee') A.acceptInvite(PID, 'controleur');
  // Tout ce qui date d'aujourd'hui (création, invitation, convention, forfait, nouvelles) recule de 75 jours.
  const reculer = (o) => { for (const k in o) { const v = o[k];
    if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) && Date.parse(v) > base - 2 * J) o[k] = new Date(Date.parse(v) - RECUL).toISOString();
    else if (v && typeof v === 'object') reculer(v); } };
  S.commit((st) => { reculer(S.project(PID)); for (const n of st.notifications) reculer(n); });
  const St = (sid) => S.step(S.project(PID), sid);
  const envoyer = () => { for (let k = 0; k < 80 && S.get().uploads.some((u) => !['synchronisee', 'echec'].includes(u.status)); k++) A.uploadTick(); };
  const photo = (sid, role, v = 0) => { if (role === 'controleur' && S.missionPending(St(sid))) A.acceptMission(PID, sid); A.addPhoto(PID, sid, { role, sim: { step: S.project(PID).steps.findIndex((x) => x.id === sid), variant: v % 3 } }); envoyer(); };
  const debut = (sid) => { const ss = S.project(PID).steps, k = ss.findIndex((x) => x.id === sid); if (k > 0 && S.coulageDue(S.project(PID), ss[k - 1])) A.declareCoulage(PID, ss[k - 1].id); photo(sid, 'entreprise'); A.declareStart(PID, sid); };
  const fin = (sid) => { for (let k = 0; k < S.MIN_PHOTOS; k++) photo(sid, 'entreprise', k); A.declareEnd(PID, sid); };
  const a = (j) => S.setClock(new Date(base - j * J).toISOString());
  const MOTIFS = ['Fouilles, semelles et longrines conformes aux plans : ferraillage et enrobage vérifiés avant coulage.',
    'Murs, poteaux et chaînages conformes aux plans : aplomb, ferraillage et enrobage vérifiés sur place.',
    'Dalle et toiture-terrasse conformes : épaisseur, ferraillage et réservations des réseaux vérifiés avant coulage.'];
  const ss = S.project(PID).steps;
  // L'étape jouée devant le jury : la dalle (3e étape, contrôlée avec 4 visites) ; à défaut, la première contrôlée après la 2e.
  const cible = ss.findIndex((x, i) => i >= 2 && S.isControlled(x));
  const jours = [62, 33, 20, 12, 6];
  try {
    for (let i = 0; i < cible; i++) {
      const sid = ss[i].id, j = jours[Math.min(i, 4)];
      a(j + 9); if (['verrouillee', 'a_venir'].includes(St(sid).status)) debut(sid); a(j + 1); if (!['fin_declaree', 'validee', 'corrigee', 'vue'].includes(St(sid).status)) fin(sid);
      a(j);
      if (S.isControlled(St(sid))) { for (let k = 0; k < 3; k++) photo(sid, 'controleur', k); A.signReview(PID, sid, { verdict: 'validee', motif: MOTIFS[Math.min(i, 2)], pieces: [], signature: sig }); }
      else A.ackStep(PID, sid);
      a(j - 1); if (S.coulageDue(S.project(PID), St(sid))) A.declareCoulage(PID, sid);
      St(sid).decision = { status: 'indique', at: new Date(base - (j - 2) * J).toISOString(), receivedAt: new Date(base - (j - 3) * J).toISOString() };
    }
    a(2); debut(ss[cible].id);
  } finally { S.setClock(null); }
  // Les rappels nés pendant le saut (« en retard », « en attente depuis… ») n'ont pas de sens : tout a été fait à temps.
  S.commit((st) => { st.notifications = st.notifications.filter((n) => !(Date.parse(n.at) < base - J && /retard|en attente|attend votre|relance|rappel|sans réponse|toujours pas/i.test(n.text || ''))); });
  const bilan = S.project(PID).steps.map((x) => x.status).join(' ');
  if (!S.project(PID).steps[cible].startedAt) console.warn('Saut incomplet :', bilan, '· contrôleur', S.project(PID).invites.controleur.status);
  S.commit(() => {});   // partage le dernier état aux deux autres téléphones
  for (const r of ['client', 'entreprise', 'controleur']) { for (const x of ss.slice(0, cible)) A.feteVue(PID, x.id, r); A.markAllRead(r); }
  try { localStorage.setItem('teeqa-oral-cible', ss[cible].id); } catch { /* stockage plein */ }
  for (const r of ['client', 'entreprise', 'controleur']) try { fen(r).contentWindow.__teeqa.go('#/home'); } catch { /* chargement */ }
  return { PID, sid: ss[cible].id };
}
let trioPret = null;
function demarrerTrio({ neuf = false } = {}) {
  return trioPret = (async () => {
    if (neuf) { for (const r of ['client', 'controleur', 'entreprise']) fen(r).src = 'about:blank'; await dort(120);
      for (const k of Object.keys(localStorage)) if (k.startsWith('teeqa-oral-')) localStorage.removeItem(k); }
    if (!localStorage.getItem('teeqa-oral-chantier')) localStorage.setItem('teeqa-oral-chantier', JSON.stringify({ v: 1, doc: DOC_VIDE }));
    const [wc] = await Promise.all(['client', 'entreprise', 'controleur'].map(chargerRole));
    preremplir(wc); wc.__teeqa.go('#/home');
    lireChantier();
  })().catch((e) => { console.warn('Trois téléphones :', e.message); });
}

// La transition « Ouvrir » : la fiche s'ouvre en vert, le téléphone recule, deux autres arrivent, la chaux remplit la scène.
const LANCE = LANCE_HTML();
let enEntree = false;
async function entrerTrio() {
  enEntree = true;
  lancerSplash(); await dort(calme ? 60 : 560);
  // On n'attend pas les trois applis : chaque téléphone garde son écran de lancement tant que la sienne charge.
  $$('.cadre').forEach((c) => { if (!c.querySelector('.lance')) c.insertAdjacentHTML('beforeend', LANCE); });
  const tel = $('#tel').getBoundingClientRect();
  scene.classList.add('trois');
  const sc = scene.getBoundingClientRect(), k = sc.width / 1920;
  const c = cadre('client').getBoundingClientRect();
  const dx = ((tel.left + tel.width / 2) - (c.left + c.width / 2)) / k, dy = ((tel.top + tel.height / 2) - (c.top + c.height / 2)) / k, s0 = tel.width / c.width;
  bouge($('.monde'), [{ clipPath: 'circle(0px at 50% 50%)' }, { clipPath: 'circle(1400px at 50% 50%)' }], { ...LENT, duration: LENT.duration * 1.1, easing: 'cubic-bezier(.6, 0, .2, 1)' });
  bouge(cadre('client'), [{ transform: `translate(${dx}px, ${dy}px) scale(${s0})` }, { transform: 'none' }], DOUX);
  bouge(cadre('entreprise'), [{ transform: 'translate(0, 720px) rotate(4deg) scale(.86)', opacity: 0 }, { transform: 'none', opacity: 1 }], REBOND, { delay: 140, fill: 'backwards' });
  bouge(cadre('controleur'), [{ transform: 'translate(760px, 140px) rotate(9deg) scale(.86)', opacity: 0 }, { transform: 'none', opacity: 1 }], REBOND, { delay: 220, fill: 'backwards' });
  $$('.etiquette').forEach((e, i) => { e.style.opacity = 1; bouge(e, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], DOUX, { delay: 700 + i * 90, fill: 'backwards' }); });
  const g = $('#guide'); g.style.opacity = 1; bouge(g, [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none' }], DOUX, { delay: 900, fill: 'backwards' });
  await dort(calme ? 100 : 1050);
  Promise.all(['client', 'entreprise', 'controleur'].map(async (r, i) => {
    await dort(i * 150);
    for (let t = 0; !prets[r] && t < 900; t++) await dort(100);   // jusqu'à 90 s sur une connexion lente
    const l = cadre(r).querySelector('.lance'); if (!l) return;
    const fin = () => l.remove();
    if (calme) return fin();
    l.querySelector('img').animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
    await l.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: 140, easing: 'ease-out', fill: 'forwards' }).finished; fin();
  })).then(() => { enEntree = false; });
  if (!chrono.t0) chrono.t0 = Date.now();
  lireChantier();
}
async function quitterTrio() {
  scene.classList.remove('trois'); fermerSplash();
  await bouge($('#tel'), [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], DOUX)?.finished;
}

// ---------- notifications : un bandeau en haut du téléphone qui la reçoit ----------
const bandeaux = {};
function bandeau(r, liste) {
  const n = liste && liste[liste.length - 1]; if (!n || !scene.classList.contains('trois')) return;
  const c = cadre(r); c.querySelector('.bandeau')?.remove(); clearTimeout(bandeaux[r]);
  const t = n.text.length > 150 ? n.text.slice(0, 148) + '…' : n.text;
  c.insertAdjacentHTML('beforeend', `<div class="bandeau"><img src="${ICONE}" alt=""><div><b>TEEQA<small>maintenant</small></b><span></span></div></div>`);
  const el = c.querySelector('.bandeau'); el.querySelector('span').textContent = t;
  bouge(el, [{ transform: 'translateY(-130%) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], REBOND);
  bandeaux[r] = setTimeout(async () => { await bouge(el, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-130%)', opacity: 0 }], VIF, { fill: 'forwards' })?.finished; el.remove(); }, 5200);
}

// ---------- le fil conducteur ----------
// Chaque geste se coche tout seul quand le chantier partagé montre qu'il est fait ; → le coche à la main s'il le faut.
const OK = ['validee', 'corrigee', 'vue'], APRES_FIN = ['fin_declaree', 'retardee', 'refusee', ...OK];
// [rôle, geste, précision, fait ?(chantier, étape cible)] ; rôle « saut » = le bouton « Trois mois plus tard ».
const GESTES = [
  ['client', 'Touche « Nouveau chantier » : tout est déjà rempli (Villa Nador, devis de Rachid BTP). « Continuer » deux fois.', 'Le client commence : c’est lui qui fait construire.', (p) => !!p],
  ['client', '« Suivi contrôlé », puis « Créer et envoyer l’invitation », et confirme.', 'Un seul prix pour tout le chantier, payé une fois.', (p) => !!p],
  ['entreprise', 'Touche la nouvelle « Invitation reçue », puis « Accepter et confirmer les étapes ».', 'L’entreprise s’inscrit gratuitement.', (p) => p && p.invites.entreprise.status === 'acceptee'],
  ['entreprise', 'En bas : « Lire » la convention, puis « J’accepte la convention ».', 'Rien ne commence sans elle.', (p) => p && p.convention && !!p.convention.entreprise],
  ['client', 'En bas : « Lire » la convention, puis « J’accepte la convention ».', 'TEEQA confie les visites à une agence de la zone.', (p) => p && p.convention && !!p.convention.client],
  ['client', 'En bas : « Payer » le forfait TEEQA, puis « Payer ».', 'Le forfait TEEQA, jamais l’argent des travaux.', (p) => !!(p && p.forfait && p.forfait.paidAt)],
  ['saut', 'Deux mois plus tard.', 'Fondations et murs : faits, vérifiés, payés. Aujourd’hui, la dalle.', (p, s) => !!s && !!s.startedAt],
  ['entreprise', 'Touche « Villa Nador », puis l’étape 3 « Dalle et toiture-terrasse » : « Ouvrir l’étape ».', 'Le même chantier sur les trois téléphones.', (p, s) => !!s && (s.photos.filter((x) => x.by === 'entreprise').length >= 2 || APRES_FIN.includes(s.status))],
  ['entreprise', 'Trois fois : « Ajouter une photo », déclencher, « Utiliser la photo ».', 'Les aciers, photographiés dans l’appli, datés et situés.', (p, s) => !!s && (s.photos.filter((x) => x.by === 'entreprise').length >= 4 || APRES_FIN.includes(s.status))],
  ['entreprise', '« Ferraillage prêt : déclarer la fin », puis confirme.', 'Avant de couler : le contrôleur doit voir les aciers.', (p, s) => !!s && APRES_FIN.includes(s.status)],
  ['controleur', 'Touche la nouvelle « Mission de contrôle… », puis « Accepter cette visite ».', 'Il reste anonyme pour l’entreprise.', (p, s) => !!s && (!!(s.mission && s.mission.acceptedAt) || s.reviews.length > 0)],
  ['controleur', 'Sur place : « Photographier », un toucher par point clé.', null, (p, s) => !!s && s.photos.some((x) => x.by === 'controleur')],
  ['controleur', 'Tape les 2 mesures (épaisseur 16 cm, enrobage 3 cm), « Validé », « Relire et signer » : signe, code, « Signer l’avis », « Fermer ».', 'Avis signé, horodaté, avec ses mesures.', (p, s) => !!s && s.reviews.length > 0],
  ['entreprise', '« Coulage fait », puis confirme.', 'Deux photos du béton coulé, après l’avis.', (p, s) => !!s && !!s.coulage],
  ['client', 'Touche la nouvelle, puis « J’ai payé cette tranche » et confirme.', '« Paiement recommandé » : l’argent ne passe jamais par TEEQA.', (p, s) => !!s && !!s.decision],
  ['entreprise', 'Touche la nouvelle, « Paiement reçu », puis « J’ai reçu le paiement ».', 'La tranche de la dalle est soldée.', (p, s) => !!(s && s.decision && s.decision.receivedAt)],
  ['client', 'Touche « Retour » : 3 étapes closes sur 6, la suivante s’ouvre.', null, null],
];
const SAUT = GESTES.findIndex((g) => g[0] === 'saut');
const NOM = { ...Object.fromEntries(ROLES3.map(([r, t, , c]) => [r, [t, c]])), saut: ['Le temps passe', '#C9962E'] };
$('#gestes').innerHTML = GESTES.map(([r, t, d], i) => r === 'saut'
  ? `<li data-i="${i}" class="saut-li" style="--c:${NOM[r][1]}"><button class="saut" id="saut" type="button"><b>${t}</b><small>${d}</small></button></li>`
  : `<li data-i="${i}" style="--c:${NOM[r][1]}"><span class="qui"><i></i>${NOM[r][0]}</span><span>${t}</span>${d ? `<small>${d}</small>` : ''}</li>`).join('');
const main = new Set();   // gestes cochés à la main (→)
let auto = [];
function lireChantier() {
  const p = projetDemo(lireDoc()); let sid = null; try { sid = localStorage.getItem('teeqa-oral-cible'); } catch { /* */ }
  const s = p && sid ? p.steps.find((x) => x.id === sid) : null;
  auto = GESTES.map((g) => !!(g[3] && g[3](p, s)));
  // Un geste coché par le chantier coche aussi ceux d'avant.
  for (let i = auto.length - 1; i > 0; i--) if (auto[i]) for (let j = 0; j < i; j++) auto[j] = true;
  peindreGuide();
}
const faits = () => GESTES.map((_, i) => auto[i] || main.has(i));
function peindreGuide() {
  const f = faits(), ici = f.indexOf(false);
  $$('#gestes li').forEach((li, i) => { li.className = f[i] ? 'fait' : i === ici ? 'ici' : ''; });
  const r = ici >= 0 ? GESTES[ici][0] : null;
  $$('.place').forEach((p) => p.classList.toggle('atoi', scene.classList.contains('trois') && p.dataset.role === r));
  // Défilement à la main (scrollIntoView ferait aussi glisser la scène, qui déborde).
  const ol = $('#gestes'), li = $(`#gestes li[data-i="${ici}"]`);
  if (li && (li.offsetTop < ol.scrollTop || li.offsetTop + li.offsetHeight > ol.scrollTop + ol.clientHeight)) ol.scrollTo({ top: li.offsetTop - 12, behavior: calme ? 'auto' : 'smooth' });
}
addEventListener('storage', (e) => { if (e.key === 'teeqa-oral-chantier') lireChantier(); });
setInterval(lireChantier, 1500);
$('#gestes').addEventListener('click', (e) => { const li = e.target.closest('li'); if (!li) return; const i = +li.dataset.i; if (main.has(i)) main.delete(i); else main.add(i); peindreGuide(); });
function gesteSuivant() { const f = faits(), i = f.indexOf(false); if (i === SAUT) return sauter(); if (i >= 0) { main.add(i); peindreGuide(); } }
// « Deux mois plus tard » : un voile de chaux traverse la scène, les mois défilent, puis le chantier a avancé.
let enSaut = false;
async function sauter() {
  if (enSaut) return; enSaut = true;
  const v = document.createElement('div'); v.className = 'saut-voile';
  v.innerHTML = `<div class="saut-carte"><small>Villa Nador · Nador</small><b>Deux mois plus tard</b><div class="saut-mois"><span>Fondations</span><span>Murs et poteaux</span><span>Dalle</span></div><p>Fondations et murs : faits, vérifiés, payés. Aujourd’hui, la dalle.</p></div>`;
  scene.appendChild(v);
  await bouge(v, [{ opacity: 0 }, { opacity: 1 }], DOUX)?.finished;
  const t0 = Date.now();
  try { await trioPret; await avancer(); } catch (e) { console.warn('Saut :', e.message); }
  await dort(Math.max(0, (calme ? 300 : 2600) - (Date.now() - t0)));
  await bouge(v, [{ opacity: 1 }, { opacity: 0 }], DOUX, { fill: 'forwards' })?.finished; v.remove();
  enSaut = false; lireChantier();
}
document.addEventListener('click', (e) => { if (e.target.closest('#saut')) { e.stopPropagation(); sauter(); } }, true);
function gestePrecedent() { const f = faits(); for (let i = f.length - 1; i >= 0; i--) if (main.has(i)) { main.delete(i); peindreGuide(); return true; } return false; }
const chrono = { t0: 0 };
setInterval(() => { const s = chrono.t0 ? Math.floor((Date.now() - chrono.t0) / 1000) : 0; $('#chrono').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
function guide(montre) { $('#guide').classList.toggle('cache', !montre); }
$('#masquer').addEventListener('click', () => guide(false));
$('#rouvrir').addEventListener('click', () => guide(true));
let confirmer = 0;
$('#zero').addEventListener('click', async () => {
  const b = $('#zero');
  if (!b.classList.contains('sur')) { b.classList.add('sur'); b.textContent = 'Toucher encore pour confirmer'; clearTimeout(confirmer);
    confirmer = setTimeout(() => { b.classList.remove('sur'); b.textContent = 'Tout remettre à zéro'; }, 3500); return; }
  clearTimeout(confirmer); b.classList.remove('sur'); b.textContent = 'Remise à zéro…'; b.disabled = true;
  main.clear(); chrono.t0 = Date.now();
  await demarrerTrio({ neuf: true });
  b.textContent = 'Tout remettre à zéro'; b.disabled = false; lireChantier();
});

// ---------- clavier et clics ----------
function suivant() { if (beat === 6) return gesteSuivant(); aller(beat + 1); }
function precedent() { if (beat === 6) { if (gestePrecedent()) return; return aller(5); } aller(beat - 1); }
function touche(e) {
  const t = e.target, saisie = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  if (saisie) return;
  const dehors = e.view !== window;   // touche venue d'un téléphone : seules les flèches et Page suivante/précédente passent
  if (['ArrowRight', 'PageDown'].includes(e.key) || (!dehors && [' ', 'Enter'].includes(e.key))) { e.preventDefault(); suivant(); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key) || (!dehors && e.key === 'Backspace')) { e.preventDefault(); precedent(); }
  else if (!dehors && /^[hH]$/.test(e.key)) guide($('#guide').classList.contains('cache'));
  else if (!dehors && /^[fF]$/.test(e.key)) { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }
  else if (!dehors && e.key === 'Home') aller(0);
  else if (!dehors && /^[oO]$/.test(e.key)) location.href = 'oral-1-dec.html#15';   // retour à la diapo de conclusion
}
addEventListener('keydown', touche);
function relayerTouches(w) { try { w.addEventListener('keydown', touche); } catch { /* autre origine */ } }
// Dans l'acte 1, un clic sur le fond (hors du téléphone) fait aussi avancer.
$('.acte1').addEventListener('click', (e) => { if (!e.target.closest('#tel')) suivant(); });

// ---------- départ ----------
peindreRecit(0); lireChantier(); guide(true);
demarrerTrio();
// Accès direct pour répéter : demo-oral.html#trois ouvre les trois téléphones (sans le fil).
if (location.hash === '#trois') { trioPret.then(() => { beat = 5; ficheEtat = 'ouvrir'; aller(6); }); }
window.__oral = { aller, get beat() { return beat; }, faits, lireChantier, demarrerTrio };
