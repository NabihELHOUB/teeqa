// Laboratoire des widgets iOS de TEEQA (11 nov.) : Dynamic Island, activité en direct de l'écran verrouillé, widget carré.
// Règles Apple suivies (refs/CHANTIER-WIDGETS-ET-LANDING-PAGE.md, 2.2) : rien ne tourne en boucle ; une mise à jour dure
// 2 s au plus et ne part que lorsqu'une donnée change (classe .upd posée sur <body> pendant 2 s) ; îlot noir pur ;
// même ordre gauche / droite entre la vue compacte et la vue étendue.
import { bellarejRig } from './bellarej-rig.js';

const STEPS = ['Terrassement et fondations', 'Gros œuvre : murs et poteaux', 'Dalle et toiture-terrasse', 'Menuiseries et réseaux', 'Enduits et zellige', 'Finitions et remise des clés'];
const SHORT = ['Fondations', 'Gros œuvre', 'Dalle', 'Menuiseries', 'Enduits', 'Finitions'];
const NOTES = { verrou: ['', 'Verre vert, rosace de zellige derrière Bellarej.', 'Verre sombre, Bellarej sous une arche.', 'Verre clair, six carreaux de zellige.'] };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get: (k, d) => { try { return +(localStorage.getItem('teeqa-essai-' + k) || d); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem('teeqa-essai-' + k, v); } catch { /* navigation privée */ } } };

const st = { d: 1, reserves: false, offline: false, last: 'idle' };
// Tranché par l'utilisateur le 11 nov. : jauge 1 (anneau, découpé en six), widget 3 (carreaux de zellige). Reste l'essai « verrou ».
// Écran verrouillé tranché le 11 nov. : fusion de 1 (verre vert, rosaces) et de 3 (carreaux de zellige, frise posée en bas).
const trial = { verrou: 4 };
const embed = /[?&]embed\b/.test(location.search);
if (embed) document.body.classList.add('embed');

// --- motifs de zellige (les mêmes que les carreaux du chemin : étoile à huit branches, en volume) ---
const STAR = '<rect x="7" y="7" width="26" height="26" rx="1.5"/><rect x="7" y="7" width="26" height="26" rx="1.5" transform="rotate(45 20 20)"/>';
const tile = () => `<i><svg viewBox="0 0 40 46" aria-hidden="true"><g class="d" transform="translate(0 5)">${STAR}</g><g class="f1">${STAR}</g><circle class="f2" cx="20" cy="20" r="8.5"/><path class="f3" d="M20 14 l1.8 4.2 l4.2 1.8 l-4.2 1.8 l-1.8 4.2 l-1.8 -4.2 l-4.2 -1.8 l4.2 -1.8 Z"/></svg></i>`;
const tiles = () => tile().repeat(6);
const rosace = (c1, c2) => `<svg viewBox="0 0 120 120"><g fill="none" stroke="${c1}" stroke-width="2.2"><rect x="24" y="24" width="72" height="72"/><rect x="24" y="24" width="72" height="72" transform="rotate(45 60 60)"/><circle cx="60" cy="60" r="33"/><circle cx="60" cy="60" r="51"/></g><g fill="${c2}"><rect x="46" y="46" width="28" height="28"/><rect x="46" y="46" width="28" height="28" transform="rotate(45 60 60)"/></g></svg>`;
const frieze = (a, b) => `<svg class="fz" viewBox="0 0 240 10" preserveAspectRatio="none">${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 12 + 6} 0 l5 5 l-5 5 l-5 -5 Z" fill="${i % 2 ? a : b}"/>`).join('')}</svg>`;
const arch = () => `<svg viewBox="0 0 100 130"><path d="M14 130 V62 C4 50 6 14 50 8 C94 14 96 50 86 62 V130" fill="rgba(241,236,226,.1)" stroke="#E2A33B" stroke-width="2.5"/><path d="M22 130 V64 C14 52 16 24 50 18 C84 24 86 52 78 64 V130" fill="none" stroke="rgba(241,236,226,.4)" stroke-width="1.5" stroke-dasharray="3 4"/></svg>`;
const laDeco = () => `<span class="ld-ros r">${rosace('rgba(241,236,226,.2)', 'rgba(226,163,59,.13)')}</span><span class="ld-ros l">${rosace('rgba(241,236,226,.1)', 'rgba(241,236,226,.07)')}</span><span class="ld-fz b">${frieze('#E2A33B', 'rgba(241,236,226,.6)')}</span>`;

// --- jauge : anneau découpé en six arcs, un par étape ---
const segs = (n = 6) => `<span class="g-segs" data-segs>${'<i></i>'.repeat(n)}</span>`;
const ARC = 100 / 6, GAP = 3.4;
function gauge(big) {
  const arcs = Array.from({ length: 6 }, (_, i) => `<circle cx="18" cy="18" r="14.5" pathLength="100" stroke-dasharray="${(ARC - GAP).toFixed(2)} ${(100 - ARC + GAP).toFixed(2)}" transform="rotate(${i * 60 + 3} 18 18)"/>`).join('');
  return `<span class="g g-ring ${big ? 'big' : ''}"><svg viewBox="0 0 36 36" aria-hidden="true"><g class="g-arcs" data-segs>${arcs}</g></svg>${big ? '<span class="g-num"><span class="roll" data-roll></span></span>' : ''}</span>`;
}
const roll = () => `<span class="roll-in">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<i>${n}</i>`).join('')}</span>`;

function build() {
  $$('[data-gauge]').forEach((el) => { el.innerHTML = gauge(false); });
  $$('[data-gauge-big]').forEach((el) => { el.innerHTML = gauge(true); });
  $$('[data-roll]').forEach((el) => { el.innerHTML = roll(); });
  $('[data-jalons]').innerHTML = STEPS.map((t, i) => `<li title="${t}"><span>${i + 1}</span></li>`).join('');
  $('#la').dataset.v = trial.verrou;
  $('[data-ladeco]').innerHTML = laDeco(trial.verrou);
  const bar = $('[data-bar]'); bar.innerHTML = `<span class="zt" data-segs>${tiles()}</span>`;
  $('.wg-tiles').innerHTML = tiles();
  $('[data-wgdeco]').innerHTML = `<span class="wd-fz">${frieze('#14503F', '#E2A33B')}</span><span class="wd-ros">${rosace('rgba(14,59,49,.13)', 'rgba(226,163,59,.1)')}</span>`;
  $$('[data-trial]').forEach((b) => b.classList.toggle('on', +b.dataset.v === trial[b.dataset.trial]));
  $('[data-note-ilot]').textContent = "Anneau découpé en six arcs, un par étape. Touchez l'îlot pour l'agrandir.";
  $('[data-note-verrou]').textContent = 'Verre vert, six carreaux de zellige, frise posée en bas. Elle ne bouge que lorsqu\'une information change.';
  $('[data-note-widget]').textContent = 'Six carreaux de zellige, posés un à un comme sur le chemin.';
}

// --- textes selon l'état ---
function words() {
  const cur = Math.min(st.d + 1, 6), done = st.d >= 6;
  if (done) return { headline: 'Chantier terminé', sub: 'Six étapes closes · rapport archivé', short: 'Clos', tone: 'ok', wstep: 'Rapport archivé', cta: 'Voir le rapport', mood: 'felicite' };
  if (st.reserves) return { headline: 'Avis avec réserves', sub: `Étape ${cur} · correction par photo, sans nouvelle visite`, short: 'Réserves', tone: 'pise', wstep: `${SHORT[cur - 1]} · réserves`, cta: 'Voir la réserve', mood: 'inquiete' };
  if (st.last === 'next') return { headline: 'Avis Validé · paiement recommandé', sub: `Étape ${st.d} close · étape ${cur} : ${SHORT[cur - 1]}`, short: `Étape ${cur}`, tone: 'ok', wstep: SHORT[cur - 1], cta: '+ Photo sur place', mood: 'posee' };
  return { headline: `Étape ${cur} sur 6 en cours`, sub: STEPS[cur - 1], short: `Étape ${cur}`, tone: 'saf', wstep: SHORT[cur - 1], cta: '+ Photo sur place', mood: 'posee' };
}

function birds(mood) { $$('[data-bird]').forEach((el) => { el.innerHTML = bellarejRig(mood, +el.dataset.bird); }); }

let timer = 0;
function paint(update = false) {
  const w = words(), cur = Math.min(st.d + 1, 6), b = document.body;
  b.style.setProperty('--d', st.d); b.style.setProperty('--pct', Math.round((st.d / 6) * 100));
  b.dataset.tone = w.tone; b.classList.toggle('offline', st.offline);
  $$('[data-headline]').forEach((el) => { el.textContent = w.headline; });
  $$('[data-sub]').forEach((el) => { el.textContent = st.offline ? 'Hors ligne · mise à jour au retour du réseau' : w.sub; });
  $$('[data-short]').forEach((el) => { el.textContent = st.offline ? 'Hors ligne' : w.short; });
  $('[data-wstep]').textContent = w.wstep; $('[data-wcta]').textContent = st.offline ? 'Photo gardée en file' : w.cta;
  $$('[data-segs]').forEach((g) => [...g.children].forEach((s, i) => { s.setAttribute('class', i < st.d ? 'on' : (i === st.d && st.d < 6 ? (st.reserves ? 'res' : 'cur') : '')); }));
  [...$('[data-jalons]').children].forEach((li, i) => { li.className = i < st.d ? 'on' : (i === cur - 1 && st.d < 6 ? (st.reserves ? 'res' : 'cur') : ''); });
  $('#live').textContent = `${w.headline}. ${w.sub}.`;
  clearTimeout(timer);
  if (update) {
    // mise à jour : 2 s au plus, puis tout se fige
    b.classList.remove('upd'); void b.offsetWidth; b.classList.add('upd');
    birds(st.reserves ? 'inquiete' : 'felicite');
    timer = setTimeout(() => { b.classList.remove('upd'); birds(w.mood === 'felicite' ? 'posee' : w.mood); }, 2000);
  } else birds(w.mood === 'felicite' ? 'posee' : w.mood);
}

const act = {
  next() { if (st.d >= 6) return; if (st.reserves) { st.reserves = false; } st.d += 1; st.last = 'next'; paint(true); },
  reserves() { if (st.d >= 6) return; st.reserves = !st.reserves; st.last = 'reserves'; paint(true); },
  offline() { st.offline = !st.offline; $('[data-do="offline"]').setAttribute('aria-pressed', st.offline); paint(true); },
  reset() { Object.assign(st, { d: 0, reserves: false, offline: false, last: 'idle' }); $('[data-do="offline"]').setAttribute('aria-pressed', false); paint(true); },
};

function setIsland(mode) {
  const di = $('#di'); di.className = `di di-${mode === 'min' ? 'rest' : mode}`;
  $('#di-mini').classList.toggle('show', mode === 'min');
  $$('[data-di]').forEach((b) => b.classList.toggle('on', b.dataset.di === mode));
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-do],[data-di],[data-trial],#di');
  if (!t) return;
  if (t.dataset.do) act[t.dataset.do]();
  else if (t.dataset.di) setIsland(t.dataset.di);
  else if (t.dataset.trial) { trial[t.dataset.trial] = +t.dataset.v; store.set(t.dataset.trial, t.dataset.v); build(); paint(); }
  else if (t.id === 'di') setIsland(t.classList.contains('di-exp') ? 'com' : 'exp');
});
$('#di').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#di').click(); } });
// La page vitrine pilote ce laboratoire quand elle l'embarque (même origine).
window.addEventListener('message', (e) => { if (e.origin === location.origin && e.data && act[e.data.teeqaWidgets]) act[e.data.teeqaWidgets](); else if (e.origin === location.origin && e.data && e.data.teeqaIsland) setIsland(e.data.teeqaIsland); });
window.__widgets = { st, act, setIsland };

build(); paint();
