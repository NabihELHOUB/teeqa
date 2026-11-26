// Oral du 1er décembre 2026 (oral-1-dec.html) : navigation au clavier, mise à l'échelle 1920 × 1080, arrivées en cascade,
// chiffres qui se comptent, notes d'orateur (N), fenêtre de l'orateur synchronisée (P), plein écran (F), écran noir (B), démo (D).
// Indépendant de l'appli : seule la cigogne Bellarej (js/bellarej-rig.js) est reprise.
import { bellarejRig } from './bellarej-rig.js';

const deck = document.getElementById('deck');
const slides = [...deck.querySelectorAll('.slide')];
const N = slides.length;
const ORATEUR = new URLSearchParams(location.search).has('orateur');
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canal = 'BroadcastChannel' in window ? new BroadcastChannel('teeqa-oral-1-dec') : null;
const PARTIES = ['Ouverture', 'Proposition de valeur', 'Marché et cibles', 'Concurrence', 'Business model', 'Trajectoire', 'Maquettage et UX', 'Conclusion', 'Annexe'];
let ici = 0, debut = 0, tampon = '';

// ---------- Mise à l'échelle de la scène ----------
const ajuste = () => { const k = Math.min(innerWidth / 1920, innerHeight / 1080); document.documentElement.style.setProperty('--k', k); };
addEventListener('resize', ajuste); ajuste();

// ---------- Cascade : --i sur chaque [data-r], dans l'ordre du document ----------
for (const s of slides) [...s.querySelectorAll('[data-r]')].forEach((el, i) => el.style.setProperty('--i', i));

// ---------- Bellarej (vectorielle, animée) ----------
for (const el of document.querySelectorAll('[data-bellarej]')) {
  try {
    el.innerHTML = bellarejRig(el.dataset.bellarej, Number(el.dataset.h) || 200, { gear: el.dataset.gear || '', seat: el.dataset.seat || '', alt: '' });
  } catch (e) { el.remove(); }
}

// ---------- Chiffres qui se comptent ----------
const fr = (v, dec) => v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ /g, ' ');
const compte = (s) => {
  for (const el of s.querySelectorAll('.count[data-to]')) {
    const to = Number(el.dataset.to), dec = Number(el.dataset.dec || 0);
    if (calme) { el.textContent = fr(to, dec); continue; }
    const t0 = performance.now(), dur = 1100 + Math.min(600, String(Math.round(to)).length * 90);
    const pas = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fr(to * e, dec); if (p < 1) requestAnimationFrame(pas); };
    el.textContent = fr(0, dec); requestAnimationFrame(pas);
  }
};

// ---------- Progression par partie ----------
const barre = document.getElementById('parties');
const parts = [...new Set(slides.map((s) => Number(s.dataset.part)))];
barre.innerHTML = parts.map((p) => `<span style="--n:${slides.filter((s) => Number(s.dataset.part) === p).length}" title="${PARTIES[p] || ''}"><i></i></span>`).join('');
const compteur = document.getElementById('compteur');

// ---------- Notes ----------
const panneau = document.getElementById('panneau');
const notesDe = (i) => {
  const a = slides[i].querySelector('.notes');
  return a ? { orateur: a.dataset.orateur || '', duree: a.dataset.duree || '', html: a.innerHTML } : { orateur: '', duree: '', html: '' };
};
const chrono = () => { const s = Math.floor((Date.now() - debut) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const peintNotes = () => {
  if (panneau.hidden) return;
  const n = notesDe(ici);
  panneau.innerHTML = `<div class="pn-tete"><b>${ici + 1} / ${N}</b><span>${PARTIES[slides[ici].dataset.part] || ''}</span><span>Orateur : ${n.orateur}</span><span>Durée cible : ${n.duree}</span><span class="pn-chrono">${debut ? chrono() : 'chrono : touche T'}</span></div>${n.html}`;
};
setInterval(() => { if (!panneau.hidden && debut) { const c = panneau.querySelector('.pn-chrono'); if (c) c.textContent = chrono(); } }, 1000);

// ---------- Aller à une diapo ----------
function va(i, { depuis = false } = {}) {
  i = Math.max(0, Math.min(N - 1, i));
  slides.forEach((s, k) => { s.classList.toggle('active', k === i); s.classList.toggle('avant', k < i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
  if (i !== ici || !slides[i].dataset.vu) { compte(slides[i]); slides[i].dataset.vu = '1'; }
  ici = i;
  const p = Number(slides[i].dataset.part);
  [...barre.children].forEach((el, k) => {
    const lot = slides.filter((s) => Number(s.dataset.part) === parts[k]), pos = lot.indexOf(slides[i]);
    el.firstChild.style.setProperty('--p', parts[k] < p ? 1 : parts[k] === p ? (pos + 1) / lot.length : 0);
  });
  compteur.textContent = `${i + 1} / ${N}`;
  if (location.hash !== `#${i + 1}`) history.replaceState(null, '', `#${i + 1}`);
  document.title = `TEEQA · ${slides[i].dataset.titre || 'Oral'} (${i + 1}/${N})`;
  peintNotes();
  if (canal && !depuis) canal.postMessage({ type: 'va', i });
  if (ORATEUR) peintOrateur();
}
const suivante = () => va(ici + 1), precedente = () => va(ici - 1);

// ---------- Clavier, souris, toucher ----------
const plein = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
const noir = document.getElementById('noir'), aide = document.getElementById('aide');
const demo = () => { const a = slides[ici].querySelector('[data-demo]') || deck.querySelector('[data-demo]'); if (a) location.href = a.getAttribute('href'); };
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (/^[0-9]$/.test(k)) { tampon += k; return; }
  if (k === 'Enter' && tampon) { va(Number(tampon) - 1); tampon = ''; e.preventDefault(); return; }
  tampon = '';
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); suivante(); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); precedente(); }
  else if (k === 'Home') va(0);
  else if (k === 'End') va(N - 1);
  else if (k === 'n' || k === 'N') { panneau.hidden = !panneau.hidden; peintNotes(); }
  else if (k === 'f' || k === 'F') plein();
  else if (k === 'b' || k === 'B' || k === '.') noir.hidden = !noir.hidden;
  else if (k === 't' || k === 'T') { debut = Date.now(); peintNotes(); if (canal) canal.postMessage({ type: 'chrono', debut }); }
  else if (k === 'p' || k === 'P') window.open(`${location.pathname}?orateur#${ici + 1}`, 'teeqa-orateur', 'width=1100,height=760');
  else if (k === 'd' || k === 'D') demo();
  else if (k === '?') aide.hidden = !aide.hidden;
  else if (k === 'Escape') { noir.hidden = true; aide.hidden = true; panneau.hidden = true; }
});
deck.addEventListener('click', (e) => { if (e.target.closest('a, button')) return; (e.clientX < innerWidth * .25 ? precedente : suivante)(); });
let x0 = null;
addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) (dx < 0 ? suivante : precedente)(); x0 = null; }, { passive: true });
addEventListener('hashchange', () => { const i = Number(location.hash.slice(1)) - 1; if (i >= 0 && i !== ici) va(i); });

// ---------- Fenêtre de l'orateur (synchronisée par BroadcastChannel) ----------
let vue;
function peintOrateur() {
  if (!vue) return;
  const n = notesDe(ici), s = slides[ici + 1];
  vue.innerHTML = `<section><p class="vo-meta">${ici + 1} / ${N} · ${PARTIES[slides[ici].dataset.part] || ''} · orateur : ${n.orateur} · durée cible : ${n.duree}</p>
    <h1>${slides[ici].dataset.titre || ''}</h1>${n.html}</section>
    <aside><p class="vo-chrono">${debut ? chrono() : '0:00'}</p><p>Objectif : 15 min au total, 5 pour le maquettage.</p>
    <button type="button" data-o="prec">← Précédente</button><button type="button" data-o="suiv">Suivante →</button><button type="button" data-o="chrono">Lancer le chrono</button>
    <p class="vo-suivante">Ensuite <b>${s ? s.dataset.titre : 'fin'}</b></p>
    <ul class="vo-plan">${slides.map((x, k) => `<li class="${k === ici ? 'ici' : ''}">${k + 1}. ${x.dataset.titre} · ${notesDe(k).duree}</li>`).join('')}</ul></aside>`;
}
if (ORATEUR) {
  document.body.classList.add('orateur');
  vue = document.createElement('div'); vue.className = 'vue-orateur'; document.body.append(vue);
  vue.addEventListener('click', (e) => { const o = e.target.closest('[data-o]'); if (!o) return;
    if (o.dataset.o === 'prec') precedente(); else if (o.dataset.o === 'suiv') suivante();
    else { debut = Date.now(); if (canal) canal.postMessage({ type: 'chrono', debut }); peintOrateur(); } });
  setInterval(() => { const c = vue.querySelector('.vo-chrono'); if (c && debut) c.textContent = chrono(); }, 1000);
}
if (canal) canal.onmessage = ({ data }) => { if (data.type === 'va') va(data.i, { depuis: true }); else if (data.type === 'chrono') { debut = data.debut; peintNotes(); if (ORATEUR) peintOrateur(); } };

// ---------- Départ ----------
va(Math.max(0, (Number(location.hash.slice(1)) || 1) - 1));
window.__oral = { va, get ici() { return ici; }, N };
