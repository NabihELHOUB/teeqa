// Page vitrine de TEEQA (11 nov.). Rien d'installé : la page embarque l'appli elle-même dans des téléphones (index.html?vitrine,
// état gardé à part de l'essai en cours, voir js/store.js) et le laboratoire des widgets (widgets.html?embed).
import { bellarejRig } from './bellarej-rig.js';
import { qrSVG } from './qr.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STEPS = [
  ['Terrassement et fondations', '1-fondations', 'Semelles, longrines et ferraillage vérifiés avant coulage.'],
  ['Gros œuvre : murs et poteaux', '2-gros-oeuvre', 'Murs et poteaux photographiés sur place.'],
  ['Dalle et toiture-terrasse', '3-dalle-toiture', 'La dalle est contrôlée avant de payer la tranche.'],
  ['Menuiseries et réseaux', '4-menuiseries-reseaux', 'Portes, fenêtres, électricité et plomberie.'],
  ['Enduits et zellige', '5-enduits-zellige', 'Les finitions des murs et des sols.'],
  ['Finitions et remise des clés', '6-finitions-cles', 'Le rapport final est signé et scellé.'],
];

// ---------- Bellarej ----------
$('#heroBird').innerHTML = `<span class="hb-fly">${bellarejRig('vol', 120)}<i></i><i></i><i></i><i></i></span>`;
$('#heroBird').addEventListener('pointerdown', () => { const f = $('.hb-fly'); f.classList.remove('hop'); void f.offsetWidth; f.classList.add('hop'); });
$('#finalBird').innerHTML = bellarejRig('felicite', 150);

// ---------- téléphones qui font tourner l'appli ----------
const target = (cw, go) => { const p = cw.__teeqa.get().projects[0]; const s = (i) => `#/c/${p.id}/step/${p.steps[i].id}`;
  return go === 'home' ? '#/home' : go === 'path' ? `#/c/${p.id}` : go === 'report' ? `#/c/${p.id}/report` : /^step\d$/.test(go) ? s(+go.slice(4) - 1) : '#/home'; };
async function drive(lp, role, go) {
  const cw = lp.querySelector('iframe').contentWindow;
  for (let k = 0; k < 60 && !(cw.__teeqa && cw.__teeqa.get()); k++) await sleep(100);
  if (!cw.__teeqa) return;
  const st = cw.__teeqa.get(); Object.assign(st.session, { splashSeen: true, loggedIn: true, onboarded: true });
  if (st.role !== role) { st.role = role; cw.__teeqa.go('#/profile'); await sleep(350); }
  cw.__teeqa.go(target(cw, go)); lp.dataset.role = role; lp.dataset.go = go;
}
function boot(lp) {
  if (lp.dataset.live) return; lp.dataset.live = '1';
  lp.innerHTML = `<div class="lp-in"><iframe src="index.html?vitrine" title="Application TEEQA en direct" tabindex="-1"></iframe><div class="lp-wait"><img src="assets/icone/icon-180.png" alt="" width="64" height="64"></div><i class="lp-isle"></i></div>`;
  const fr = lp.querySelector('iframe');
  // v3.8 (Nabih : « le fond vert avec le logo, ça sert à rien ») : on n'attend plus la fin du chargement de toutes les images de
  // l'appli ni deux secondes de plus ; dès que l'appli répond, on l'amène sur le bon écran et on la montre.
  (async () => { for (let k = 0; k < 200 && !(fr.contentWindow && fr.contentWindow.__teeqa && fr.contentWindow.__teeqa.get()); k++) await sleep(60);
    await drive(lp, lp.dataset.role, lp.dataset.go); await sleep(220); lp.classList.add('ready'); })();
}
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { boot(e.target); io.unobserve(e.target); } }), { rootMargin: '300px' });
$$('.lp').forEach((lp) => io.observe(lp));

// widgets : chargés à l'approche, pilotés par messages
const wf = $('#wframe');
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { wf.src = wf.dataset.src; o.disconnect(); } }, { rootMargin: '400px' }).observe(wf);
wf.addEventListener('load', () => wf.contentWindow.postMessage({ teeqaIsland: 'exp' }, location.origin));
$$('[data-w]').forEach((b) => b.addEventListener('click', () => wf.contentWindow && wf.contentWindow.postMessage({ teeqaWidgets: b.dataset.w }, location.origin)));

// ---------- démonstration des six étapes ----------
const demo = { d: 1, busy: false };
function demoPaint(just = false) {
  $('#demoSteps').innerHTML = STEPS.map(([t, f, s], i) => {
    const cls = i < demo.d ? 'done' : i === demo.d ? 'cur' : '';
    return `<li class="${cls} ${just && i === demo.d - 1 ? 'just' : ''}"><img src="assets/etapes/etape-${f}.webp" alt="" width="56" height="56" loading="lazy"><div><b>${i + 1}. ${t}</b><span>${i < demo.d ? 'Vérifiée · avis Validé' : i === demo.d ? 'Fin déclarée · avis attendu' : s}</span></div><i aria-hidden="true">${i < demo.d ? '✓' : ''}</i></li>`; }).join('');
  const done = demo.d >= 6;
  $('#demoBird').innerHTML = bellarejRig(done ? 'felicite' : just ? 'annonce' : 'batit', 150, { gear: 'orange' });
  $('#demoCard').innerHTML = done ? `<span>Chantier clos</span><b>Rapport signé et scellé</b><small>Six étapes vérifiées sur place. Tout l'historique est archivé.</small>`
    : just ? `<span>En clair</span><b>Paiement recommandé</b><small>Le contrôleur est passé sur place et a validé « ${STEPS[demo.d - 1][0]} ». Vous pouvez payer cette tranche.</small>`
    : `<span>Étape ${demo.d + 1} sur 6</span><b>${STEPS[demo.d][0]}</b><small>L'entreprise a déclaré la fin des travaux. Faites passer le contrôleur.</small>`;
  $('#demoCard').className = `demo-card ${just || done ? 'ok pop' : ''}`;
  $('#demoNext').disabled = done; $('#demoNext').textContent = done ? 'Chantier terminé' : 'Faire passer le contrôleur';
}
// 13 nov. : cette démonstration a été remplacée dans la page par « La maison qui monte » (js/vitrine-v2.js) ; elle ne se lance que si elle est encore là.
if ($('#demoNext')) {
  $('#demoNext').addEventListener('click', () => { if (demo.d < 6) { demo.d += 1; demoPaint(true); } });
  $('#demoReset').addEventListener('click', () => { demo.d = 0; demoPaint(); });
  demoPaint();
}

// ---------- rôles et étapes ----------
const ROLES = {
  client: ['Karim, le client', 'Il fait construire à Nador depuis Lyon.', ['Il suit les six étapes et les photos prises sur place.', 'Il lit, en clair, « Paiement recommandé » ou « Paiement différé ».', 'Il confirme « J\'ai payé cette tranche » et garde tout l\'historique.']],
  entreprise: ['Rachid, l\'entreprise', 'Il réalise les travaux sur le terrain.', ['Il déclare le début et la fin de chaque étape, photos à l\'appui.', 'Une réserve ? Il envoie la photo de la correction, sans nouvelle visite.', 'Il indique quand le paiement est reçu.']],
  controleur: ['Amina, la contrôleuse', 'Elle se rend sur le chantier, sans compte à créer.', ['Elle ouvre le chantier par un lien, valable jusqu\'à la clôture.', 'Elle photographie sur place, même sans réseau.', 'Elle rédige son avis, Validé, Réserves ou Refusé, et le signe au doigt.']],
};
let role = 'client';
function rolePaint() {
  const [n, w, l] = ROLES[role];
  $('#rolePanel').innerHTML = `<h3>${n}</h3><p>${w}</p><ul>${l.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  $$('.tabs [role="tab"]').forEach((b) => b.setAttribute('aria-selected', b.dataset.role === role));
}
$('#stepChips').innerHTML = STEPS.map(([t], i) => `<button data-step="${i + 1}" title="${t}">${i + 1}</button>`).join('') + `<button data-step="0">Le chemin</button>`;
const phone = $('#rolePhone');
$$('.tabs [role="tab"]').forEach((b) => b.addEventListener('click', () => { role = b.dataset.role; rolePaint(); if (phone.classList.contains('ready')) drive(phone, role, phone.dataset.go); else phone.dataset.role = role; }));
$('#stepChips').addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (!b) return; const go = +b.dataset.step ? `step${b.dataset.step}` : 'path';
  $$('#stepChips button').forEach((x) => x.classList.toggle('on', x === b)); if (phone.classList.contains('ready')) drive(phone, role, go); else phone.dataset.go = go; });
rolePaint();

// ---------- QR vers l'appli ----------
$('#qr').innerHTML = qrSVG(new URL('./', location.href).href, { size: 132 });

// ---------- défilement en 3D et cartes qui flottent ----------
const tilts = $$('[data-tilt]');
let tick = 0;
function frame() {
  tick = 0; const vh = innerHeight;
  for (const el of tilts) { const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) continue;
    const p = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2))); el.style.setProperty('--p', p.toFixed(3)); }
  $('#nav').classList.toggle('scrolled', scrollY > 24);
}
const ask = () => { if (!tick) tick = requestAnimationFrame(frame); };
if (!calm) { addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); }
frame();
const scene = $('[data-mouse]');
if (!calm && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', (e) => { scene.style.setProperty('--mx', ((e.clientX / innerWidth) - .5).toFixed(3)); scene.style.setProperty('--my', ((e.clientY / innerHeight) - .5).toFixed(3)); }, { passive: true });

// sections qui arrivent
const rev = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: .12 });
$$('.sec-head, .proofs li, .gains li, .tour figure, .compare, .faq-list details, .demo').forEach((el) => { el.classList.add('rv'); rev.observe(el); });
