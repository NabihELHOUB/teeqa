// Point d'entrée : routeur par hash, transitions, délégation d'événements.
import * as store from './store.js';
import { actions, ROLES, get, simpleOn } from './store.js';
import { openSheet, closeSheet, sheetOpen, toast, esc, sfx, roleAvatar, explainWords } from './ui.js';
import { icon } from './icons.js';
import { spring, drag, reduced, staggerLists, stampFresh } from './motion.js';
import { photoSVG } from './art.js';
import { initLife, enliven } from './vie.js';
import { routes as entryRoutes } from './screens/entry.js';
import { routes as homeRoutes, humainSheet } from './screens/home.js';
import { routes as projectRoutes } from './screens/project.js';
import { routes as stepRoutes } from './screens/step.js';
import { routes as proRoutes } from './screens/pro.js';
import { routes as faillesRoutes } from './screens/failles.js';   // vague 25 : décès, gérant, accident, parrainage, décennale
import { initLangues, bindUi, speakScope } from './langues.js';

const ROUTES = [...entryRoutes, ...homeRoutes, ...projectRoutes, ...stepRoutes, ...proRoutes, ...faillesRoutes];
const app = document.getElementById('app');
let current = null;       // { route, params, view, el }
const stack = [];         // pile de navigation interne (sens des transitions)
let cutNext = false;      // onglets : coupure nette (comme mesuré dans la vidéo, docs/motion-duolingo.md)
let swipePreview = null;  // écran précédent déjà affiché sous le doigt (retour au glissé)
let settlePush = () => {}; // termine tout de suite une transition en cours

store.load();
applyPrefs();
// 19 nov. : langues (traduction à l'affichage, sens d'écriture), feuilles et toasts partagés avec langues.js.
bindUi({ openSheet, closeSheet, toast }); initLangues();

export function go(hash, { replace = false, cut = false } = {}) {
  // Vague 20 (doigt : Salma) : redessiner le même écran (un choix, un interrupteur) garde la position de défilement et les
  // blocs ouverts : avant, l'écran remontait en haut et le toucher suivant tombait sur un autre bouton.
  if (replace && hash === location.hash && current && current.path === hash.replace(/^#/, '')) { refresh(true); return; }
  if (replace) { const same = hash === location.hash; history.replaceState(null, '', hash); stack[Math.max(0, stack.length - 1)] = hash; render('none'); }
  else if (location.hash === hash) render('none');
  else { if (cut) cutNext = true; location.hash = hash; }
}
function redirectTo(hash) { history.replaceState(null, '', hash); stack[Math.max(0, stack.length - 1)] = hash; render('none'); }
function back(fallback) {
  // Vague 20 (doigt : Youssef) : connecté, « Retour » ne ramène jamais à l'accueil, à l'inscription ni aux portes.
  const ENTREE = /^#\/(splash|welcome|signup|login)\b/;
  if (stack.length > 1 && get().session.loggedIn && ENTREE.test(stack[stack.length - 2] || '')) { stack.splice(0, stack.length - 1); go(fallback || '#/home', { replace: true }); return; }
  // 28 nov. (démo de l'oral, trois téléphones dans une page) : dans un cadre, history.back() recule l'historique COMMUN de la
  // page : c'était le dernier téléphone touché qui reculait, pas celui-ci. Dans un cadre, le retour se fait donc ici même.
  // On remplace l'adresse puis on prévient comme un vrai retour (hashchange) : le routeur dépile, et les autres écouteurs
  // (caméra arrêtée, carte de chantier refermée) font leur travail.
  if (stack.length > 1 && window.parent !== window) { history.replaceState(null, '', stack[stack.length - 2]); window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
  if (stack.length > 1) history.back();
  else go(fallback || '#/home', { replace: true });
}

function match(path) {
  for (const r of ROUTES) { const m = path.match(r.pattern); if (m) return { route: r, params: m.slice(1).map(decodeURIComponent) }; }
  return null;
}

function guard(path) {
  const s = get().session;
  if (!s.splashSeen && path !== '/splash') return '#/splash';
  if (s.splashSeen && !s.onboarded && !['/welcome', '/splash', '/signup', '/apercu'].includes(path)) return '#/welcome';
  if (s.onboarded && !s.loggedIn && !['/login', '/welcome', '/splash', '/signup', '/apercu'].includes(path)) return '#/login';
  if (s.loggedIn && s.splashSeen && ['/welcome', '/signup'].includes(path) && get().account) return '#/home';   // vague 20 : un compte ouvert ne revoit pas l'accueil
  // Problème 7 : le chemin, l'étape, le rapport… ne s'ouvrent qu'avec un accès actif. Une entreprise pas encore acceptée,
  // un contrôleur dont le lien est retiré ou expiré sont renvoyés vers leur invitation (qui dit pourquoi).
  const m = /^\/c\/([^/]+)/.exec(path), p = m && store.project(m[1]);
  // 20 nov. : le chantier d'un autre client ne s'ouvre pas ; s'il est publié avec l'accord de son client, seul son rapport se lit.
  if (p && p.client && get().role === 'client' && !store.forMe(p, 'client')) return p.publie && !/\/report$/.test(path) ? `#/c/${p.id}/report` : p.publie ? null : '#/home';
  if (p) { const r = get().role, a = store.access(p, r);
    if (a !== 'ok' && !(a === 'expiree' && /\/report$/.test(path))) return `#/invite/${p.id}/${r}`; }
  return null;
}

function render(dir = 'none') {
  const path = (location.hash || '#/home').slice(1) || '/home';
  const redirect = guard(path);
  if (redirect) { redirectTo(redirect); return; }
  const m = match(path) || match('/home');
  closeSheet(true); document.querySelectorAll('.sig-full').forEach((n) => n.remove());
  store.vueChantier(path);   // 20 nov. : nom du client du chantier affiché
  const view = m.route.render(...m.params);
  if (view && view.redirect) { redirectTo(view.redirect); return; }
  const el = document.createElement('section');
  el.className = `screen ${view.cls || ''}`;
  el.dataset.route = m.route.name;
  el.setAttribute('aria-label', m.route.name);
  el.innerHTML = withDemo(view); store.tauxEcran(el);
  settlePush();
  const old = current && current.el;
  if (swipePreview) { dir = 'none'; }
  if (old && dir === 'back' && !reduced()) app.insertBefore(el, old);
  else app.insertBefore(el, app.querySelector('.sheet-wrap, .toast-zone'));
  if (swipePreview) { swipePreview.remove(); swipePreview = null; }
  if (old) {
    if (!reduced() && dir !== 'none') push(el, old, dir);
    else old.remove();
  }
  current = { route: m.route, params: m.params, view, el, path };
  view.mount && view.mount(el);
  // Vague 25 (axe-core) : une zone qui défile sans rien de touchable reste atteignable au clavier.
  clavierZones(el);
  if (m.route.name !== 'help') explainWords(el);
  edgeBack(el);
  staggerLists(el); stampFresh(el); initLife(); enliven(el);
  if (!['splash'].includes(m.route.name)) actions.rememberRoute('#' + path);
  syncChrome(); requestAnimationFrame(syncChrome); syncPill();
  const h = el.querySelector('h1, .h1, .display');
  document.title = h && h.textContent.trim() ? `TEEQA · ${h.textContent.trim().slice(0, 40)}` : 'TEEQA';
  // Vague 22 (IDF, 9 fiches : « un parent qui ne lit pas ») : mode « Tout écouter » : chaque écran ouvert est lu à voix haute, sans rien toucher.
  if (store.get().prefs && store.get().prefs.toutEcouter && !['splash', 'welcome', 'signup'].includes(m.route.name)) setTimeout(() => { if (current && current.el === el) { const b = el.querySelector('[data-lact="listen"]'); if (b && !b.classList.contains('playing')) b.click(); else if (!b) speakScope('[data-listen]'); } }, 700);
}

// Rendu sur place (changement d'état) : conserve le défilement, pas de transition.
// Vague 25 (axe-core) : une zone qui défile sans rien de touchable reste atteignable au clavier.
function clavierZones(el) { el.querySelectorAll('.scroll').forEach((z) => { if (!z.querySelector('button, a[href], input, select, textarea, summary, [tabindex]')) { z.tabIndex = 0; z.setAttribute('role', 'region'); z.setAttribute('aria-label', 'Contenu'); } }); }
function refresh(force = false) {
  if (!current) return;
  const ae = document.activeElement;
  if (!force && ae && current.el.contains(ae) && /INPUT|TEXTAREA/.test(ae.tagName)) return; // ne pas casser la saisie
  if (!force && current.el.querySelector('.step-card')) return;   // vague 20 (doigt : Leila) : la fiche d'étape ouverte sur le chemin reste affichée
  const sc = current.el.querySelector('.scroll');
  const top = sc ? sc.scrollTop : 0;
  // Vague 20 (doigt : Hamid, Leila) : un rendu sur place (envoi qui avance, nouvel état) ne referme plus un bloc ouvert
  // (« En savoir plus ») et n'arrête pas « Écouter » : on note ce qui était ouvert, on le rouvre après.
  const dkey = (d) => d.dataset.testid || (d.querySelector('summary') || {}).textContent || '';
  const opened = [...current.el.querySelectorAll('details[open]')].map(dkey);
  const playing = current.el.querySelector('[data-lact="listen"].playing'), listenBox = current.el.querySelector('.listen-now');
  store.vueChantier(current.path);
  const view = current.route.render(...current.params);
  if (view && view.redirect) { redirectTo(view.redirect); return; }
  current.view = view;
  current.el.className = `screen ${view.cls || ''}`;
  current.el.innerHTML = withDemo(view); store.tauxEcran(current.el);
  if (opened.length) current.el.querySelectorAll('details').forEach((d) => { if (opened.includes(dkey(d))) d.open = true; });
  if (playing) { const nb = current.el.querySelector(`[data-lact="listen"][data-scope="${playing.dataset.scope || ''}"]`) || current.el.querySelector('[data-lact="listen"]');
    if (nb) { nb.dataset.html = playing.dataset.html || nb.innerHTML; nb.className = playing.className; nb.innerHTML = playing.innerHTML; nb.setAttribute('aria-pressed', 'true'); if (listenBox) nb.parentElement.insertAdjacentElement('afterend', listenBox); } }
  const sc2 = current.el.querySelector('.scroll'); if (sc2) { sc2.style.scrollBehavior = 'auto'; sc2.scrollTop = top; requestAnimationFrame(() => { sc2.scrollTop = top; sc2.style.scrollBehavior = ''; }); }
  view.mount && view.mount(current.el, { refresh: true }); clavierZones(current.el);
  if (current.route.name !== 'help') explainWords(current.el);
  edgeBack(current.el);
  stampFresh(current.el);
  syncChrome();
}

// Pousser un écran : la surface entre au ressort, l'écran d'en dessous recule d'un quart.
function push(el, old, dir) {
  const W = app.clientWidth, top = dir === 'back' ? old : el, under = dir === 'back' ? el : old;
  top.classList.add('pushing');
  const set = (p) => { // p : 0 = arrivé, 1 = départ
    const t = dir === 'back' ? 1 - p : p;
    top.style.transform = `translate3d(${t * W}px,0,0)`;
    under.style.transform = `translate3d(${-(1 - t) * W * 0.28}px,0,0)`;
  };
  let done = false;
  const finish = () => { if (done) return; done = true; stop(); old.remove(); el.style.transform = ''; el.classList.remove('pushing'); settlePush = () => {}; };
  set(1);
  const stop = spring({ from: 1, to: 0, onUpdate: set, onDone: finish });
  settlePush = finish;
}

// Ouvrir un chantier : la carte touchée grandit jusqu'à remplir l'écran et le chantier apparaît dedans, au lieu d'un écran
// qui glisse depuis la droite (geste des fiches d'Airbnb et de l'App Store : on entre dans ce qu'on a touché).
// Le retour reste le glissement habituel. Durée 440 ms ; la carte reste nette jusqu'à 55 %, puis s'efface sur le nouvel écran.
function openCard(card, hash) {
  const a = app.getBoundingClientRect(), r = card.getBoundingClientRect(), k = a.width / app.offsetWidth || 1; // k : cadre de bureau réduit
  const from = { left: (r.left - a.left) / k, top: (r.top - a.top) / k, width: r.width / k, height: r.height / k };
  const ghost = document.createElement('div');             // un bloc, pas un bouton : un bouton recentre son contenu en hauteur
  ghost.innerHTML = card.innerHTML; ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
  ghost.className = 'project-card card-ghost';
  Object.assign(ghost.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
  const radius = getComputedStyle(card).borderRadius, D = 440, ease = 'cubic-bezier(.2, .85, .25, 1)';
  // L'écran de départ reste dessous le temps que la carte le recouvre (sinon il disparaît d'un coup sous la carte).
  const back = current.el.cloneNode(true);
  back.setAttribute('aria-hidden', 'true'); back.inert = true; back.classList.add('card-back');
  const sc = current.el.querySelector('.scroll'), top = sc ? sc.scrollTop : 0;
  app.appendChild(back); app.appendChild(ghost);
  const sc2 = back.querySelector('.scroll'); if (sc2) sc2.scrollTop = top;
  const twin = back.querySelector(`.project-card[data-pid="${card.dataset.pid}"]`); if (twin) twin.style.visibility = 'hidden';
  window.addEventListener('hashchange', () => {            // inscrit après celui du routeur : le nouvel écran est déjà en place
    const el = current && current.el;
    // Les opacités sont linéaires et à part : une courbe posée sur toute l'animation aurait avancé leurs repères.
    back.animate([{ opacity: 1 }, { opacity: 0, offset: .45 }, { opacity: 0 }], { duration: D, fill: 'both' }).onfinish = () => back.remove();
    if (el) {
      el.animate([{ opacity: 0 }, { opacity: 0, offset: .35 }, { opacity: 1, offset: .9 }, { opacity: 1 }], { duration: D });
      el.animate([{ transform: 'scale(.955)' }, { transform: 'none' }], { duration: D, easing: ease });
    }
    ghost.animate([{ opacity: 1 }, { opacity: 1, offset: .45 }, { opacity: 0 }], { duration: D, fill: 'both' });
    const an = ghost.animate([
      { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: radius },
      { left: '0px', top: '0px', width: app.offsetWidth + 'px', height: app.offsetHeight + 'px', borderRadius: '0px' }], { duration: D, easing: ease, fill: 'both' });
    an.onfinish = an.oncancel = () => ghost.remove();
  }, { once: true });
  go(hash, { cut: true });
  setTimeout(() => { ghost.remove(); back.remove(); }, 1200); // filet : si l'écran n'a pas changé, les copies ne restent pas
}

// Retour au doigt : bande de 20 px au bord gauche, sous la barre d'app, si l'écran a un retour.
function edgeBack(el) {
  const btn = el.querySelector('.appbar [data-act="back"]');
  if (!btn || el.querySelector('.edge-swipe')) return;
  const bar = btn.closest('.appbar');
  const strip = document.createElement('div');
  strip.className = 'edge-swipe'; strip.setAttribute('aria-hidden', 'true');
  strip.style.top = (bar.offsetTop + bar.offsetHeight) + 'px';
  el.appendChild(strip);
  let prev = null, W = 1, stop = () => {};
  const set = (x) => { el.style.transform = `translate3d(${x}px,0,0)`; if (prev) prev.style.transform = `translate3d(${-W * 0.28 * (1 - x / W)}px,0,0)`; };
  drag(strip, {
    axis: 'x',
    start: () => !sheetOpen() && current && current.el === el,
    move: (d) => {
      if (!prev) {
        settlePush(); W = app.clientWidth;
        const target = stack.length > 1 ? stack[stack.length - 2] : (btn.dataset.fallback || '#/home');
        prev = preview(target); if (!prev) return;
        app.insertBefore(prev, el); el.classList.add('pushing');
      }
      stop(); set(Math.min(d, W));
    },
    end: (d, v) => {
      if (!prev) return;
      if (d > W * 0.35 || v > 0.5) {
        stop = spring({ from: d, to: W, velocity: v, onUpdate: set, onDone: () => { swipePreview = prev; prev = null; back(btn.dataset.fallback); } });
      } else {
        stop = spring({ from: d, to: 0, velocity: v, onUpdate: set, onDone: () => { prev && prev.remove(); prev = null; el.style.transform = ''; el.classList.remove('pushing'); } });
      }
    },
  });
}
// Écran précédent rendu sans être monté (pas de 3D, pas d'écouteurs) : seulement pour être vu sous le doigt.
function preview(hash) {
  const m = match(hash.slice(1) || '/home'); if (!m) return null;
  store.vueChantier(hash.slice(1)); const view = m.route.render(...m.params); store.vueChantier(current ? current.path : '');
  if (!view || view.redirect) return null;
  const p = document.createElement('section');
  p.className = `screen ${view.cls || ''}`; p.setAttribute('aria-hidden', 'true'); p.inert = true;
  p.innerHTML = withDemo(view); store.tauxEcran(p);
  return p;
}
store.subscribe(refresh);

window.addEventListener('hashchange', () => {
  const h = location.hash, cut = cutNext; cutNext = false;
  let dir = cut ? 'none' : 'fwd';
  // Changement d'onglet : toujours une coupe nette. Avant le 11 nov., revenir sur l'onglet précédent était pris pour un « retour »
  // et faisait glisser deux écrans et deux barres d'onglets l'un sur l'autre (bug vu sur iPhone, de gauche à droite).
  if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); if (!cut) dir = 'back'; }
  else if (stack[stack.length - 1] !== h) stack.push(h);
  render(swipePreview ? 'none' : dir);
});

// ---------- Délégation ----------
app.addEventListener('click', (e) => {
  if (longPressed) { longPressed = false; e.preventDefault(); return; }
  const goEl = e.target.closest('[data-go]');
  if (goEl && goEl.dataset.go && !goEl.disabled) { e.preventDefault(); closeSheet(true);
    if (goEl.classList.contains('project-card') && goEl.dataset.go.startsWith('#/c/') && !reduced() && goEl.animate) { openCard(goEl, goEl.dataset.go); return; }
    if (goEl.closest('.tabbar')) { cutNext = true; tabPicked(); } go(goEl.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (!a || a.disabled || a.getAttribute('aria-disabled') === 'true') {
    // Vague 24 (contrôleurs) : un bouton grisé qui sait où est ce qui manque y mène (« Relire et signer » → le point à noter).
    const vers = a && a.getAttribute('aria-disabled') === 'true' && a.dataset.vers && a.closest('.screen') && a.closest('.screen').querySelector(a.dataset.vers);
    if (vers) { vers.click(); return; }
    if (a && a.getAttribute('aria-disabled') === 'true' && a.dataset.why) toast(a.dataset.why, 'info');
    return;
  }
  const act = a.dataset.act;
  if (act === 'back') { back(a.dataset.fallback); return; }
  if (act === 'sheet-close') { closeSheet(); return; }
  if (act === 'role-sheet') { roleSheet(); return; }
  if (act === 'set-role') { setRole(a.dataset.role); return; }
  if (act === 'install') { installSheet(); return; }
  if (act === 'report-issue') { reportSheet(); return; }
  if (act === 'pilote') { toast('Demande envoyée : un conseiller vous rappelle sous 2 h', 'check'); return; }
  if (act === 'humain' && !(current && current.view.on && current.view.on.humain)) { humainSheet(); return; }   // vague 9 : un humain joignable depuis chaque écran
  if (act === 'unavailable') { toast(a.dataset.why || 'Bientôt disponible', 'info'); return; }
  const handler = current && current.view.on && current.view.on[act];
  if (handler) handler(a, e);
});
app.addEventListener('input', (e) => {
  const t = e.target.closest('[data-input]');
  const h = t && current && current.view.on && current.view.on[t.dataset.input];
  if (h) h(t, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen()) closeSheet();
});

// Onglet touché : son icône, rétrécie sous le doigt, reprend sa taille sur le nouvel écran (mesuré sur la vidéo de référence).
let tabPickT = 0;
function tabPicked() { const r = document.documentElement; r.classList.add('tab-picked'); clearTimeout(tabPickT); tabPickT = setTimeout(() => r.classList.remove('tab-picked'), 280); }

function roleSheet() {
  if (store.SALLE) { toast(`Salle partagée : ce téléphone reste ${ROLES[get().role].label}`, 'users'); return; }
  const r = get().role;
  openSheet(`<h2>Changer de vue</h2>
    <p class="muted small" style="margin-bottom:14px">Un seul chantier partagé ; chaque rôle ne voit que ses actions.</p>
    <div class="list">${Object.entries(ROLES).map(([k, v]) => `
      <button class="list-item" data-role="${k}" aria-pressed="${k === r}">
        ${roleAvatar(k, 36, k)}
        <span class="grow"><span class="t">${v.label}</span><div class="s">${esc(v.name)} · ${v.where}</div></span>
        ${k === r ? `<span style="color:var(--success-ink)">${icon('check')}</span>` : ''}
      </button>`).join('')}</div>`, {
    label: 'Changer de point de vue',
    onMount: (el) => el.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', () => {
      closeSheet(); setRole(b.dataset.role);
    })),
  });
}
function setRole(k) {
  if (!ROLES[k] || k === get().role) return;
  if (store.SALLE) { toast(`Salle partagée : ce téléphone reste ${ROLES[get().role].label}`, 'users'); return; }
  actions.setRole(k); sfx('pop'); toast(`Vue ${ROLES[k].label}`, 'users');
}

// Appui long sur l'onglet Profil : raccourci vers le changement de rôle (décision D1).
let longPressed = false, lpTimer = 0;
app.addEventListener('pointerdown', (e) => {
  const tab = e.target.closest('.tab[data-go="#/profile"]');
  if (!tab) return;
  longPressed = false;
  clearTimeout(lpTimer);
  lpTimer = setTimeout(() => { longPressed = true; navigator.vibrate && navigator.vibrate(8); roleSheet(); }, 480);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => app.addEventListener(t, () => clearTimeout(lpTimer), true));
app.addEventListener('contextmenu', (e) => { if (e.target.closest('.tabbar')) e.preventDefault(); });

// ---------- Signalement à TEEQA (différent d'une contestation entre les parties) ----------
const REPORT_REASONS = ['Comportement inapproprié', 'Soupçon de fraude ou de fausse preuve', "Demande d'argent hors cadre (tout le chantier est prévenu)", 'Quelqu’un se présente comme contrôleur sans être annoncé ici (tout le chantier est prévenu)', 'Autre'];
function reportSheet() {
  let reason = null;
  openSheet(`<h2>Signaler un problème</h2>
    <p class="muted small" style="margin-bottom:14px">Votre signalement est transmis à TEEQA, pas aux autres personnes du chantier. TEEQA l'examine, mais ne tranche pas un désaccord sur les travaux : pour cela, utilisez « Contester » dans l'étape.</p>
    <div class="list" role="radiogroup" aria-label="Motif du signalement">${REPORT_REASONS.map((t, i) => `
      <button class="list-item" role="radio" aria-checked="false" data-reason="${i}"><span class="grow t">${t}</span><span class="radio-mark" aria-hidden="true"></span></button>`).join('')}</div>
    <div class="field" style="margin-top:14px"><label for="sg-text">Ce qui s'est passé</label><textarea id="sg-text" class="textarea" style="min-height:90px" placeholder="Décrivez les faits en quelques mots."></textarea></div>
    <div class="stack" style="margin-top:14px"><button class="btn block" data-send disabled>Envoyer le signalement</button>
    <button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`, {
    label: 'Signaler un problème',
    onMount: (el) => {
      const send = el.querySelector('[data-send]'), ta = el.querySelector('textarea');
      const sync = () => { send.disabled = reason === null || ta.value.trim().length < 5; };
      el.querySelectorAll('[data-reason]').forEach(b => b.addEventListener('click', () => {
        reason = +b.dataset.reason;
        el.querySelectorAll('[data-reason]').forEach(x => { const on = x === b; x.setAttribute('aria-checked', on); x.querySelector('.radio-mark').innerHTML = on ? icon('check', 'sm') : ''; });
        sync();
      }));
      ta.addEventListener('input', sync);
      send.addEventListener('click', () => {
        const id = actions.addReport({ role: get().role, reason: REPORT_REASONS[reason], text: ta.value.trim(), route: location.hash });
        const g = (get().reports || []).find(x => x.id === id), wait = g.status === 'en_attente';
        closeSheet(true);
        // Accusé : la référence, où en est le signalement, et ce qui se passe ensuite.
        openSheet(`<div class="stack" style="gap:10px;text-align:center;justify-items:center"><span class="ico-tile ${wait ? 'saffron' : 'success'}" style="width:52px;height:52px">${icon(wait ? 'clock' : 'shield')}</span>
          <h2 style="margin:0">${wait ? 'Signalement gardé' : 'Signalement reçu'}</h2><p class="mono" style="margin:0;font-size:17px" data-testid="report-ref">${g.ref}</p>
          <p class="muted" style="margin:0">${wait ? "Vous êtes hors ligne : il partira tout seul au retour du réseau. Rien n'est perdu." : "TEEQA l'a reçu. Lui seul le lit : les autres personnes du chantier ne sont pas prévenues."}</p>
          <p class="meta" style="margin:0">Vous pouvez le suivre dans Profil › Mes signalements. TEEQA ne tranche pas un désaccord sur les travaux.</p></div>
          <div class="stack" style="margin-top:14px"><button class="btn block" data-go="#/reports">Suivre mes signalements</button><button class="btn ghost block" data-act="sheet-close">Fermer</button></div>`, { label: 'Signalement envoyé' });
      });
    },
  });
}

// ---------- Installation sur l'écran d'accueil ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function installSheet() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const done = standalone();
  openSheet(`<div class="install-head"><img src="assets/icone/icon-192.png" width="64" height="64" alt=""><div><h2>TEEQA sur l'écran d'accueil</h2>
      <p class="muted small">${done ? "C'est fait : TEEQA est ouverte depuis l'écran d'accueil." : "L'appli s'ouvre en plein écran, sans barre de navigateur."}</p></div></div>
    ${done ? '' : installEvt ? `<button class="btn saffron block" data-install>Installer</button>` : `<ol class="steps-list">
      ${ios ? `<li><span>Dans Safari, touchez <b>Partager</b></span></li><li><span>Choisissez <b>Sur l'écran d'accueil</b></span></li><li><span>Touchez <b>Ajouter</b></span></li>`
            : `<li><span>Ouvrez le menu du navigateur</span></li><li><span>Choisissez <b>Installer l'application</b> ou <b>Ajouter à l'écran d'accueil</b></span></li><li><span>Confirmez</span></li>`}
    </ol>`}
    <button class="btn ghost block" data-act="sheet-close" style="margin-top:12px">Fermer</button>`, {
    label: "Installer sur l'écran d'accueil",
    onMount: (el) => { const b = el.querySelector('[data-install]'); b && b.addEventListener('click', async () => { closeSheet(); installEvt.prompt(); await installEvt.userChoice; installEvt = null; }); },
  });
}

// ---------- Cadre : couleur de la barre d'état selon l'écran, échelle du cadre iPhone sur ordinateur ----------
const device = document.querySelector('.device');
const themeMeta = document.querySelector('meta[name="theme-color"]');
function syncChrome() {
  const r = app.getBoundingClientRect();
  let bg = null;
  for (const n of document.elementsFromPoint(r.left + r.width / 2, r.top + 6 * (r.height / (app.offsetHeight || 1)))) {
    if (!app.contains(n)) continue;
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
    if (m && (m.length < 4 || +m[3] > 0.5)) { bg = m.slice(0, 3).map(Number); break; }
  }
  if (!bg) return;
  const lum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
  if (device) device.dataset.tone = lum > 0.5 ? 'light' : 'dark';
  if (themeMeta) themeMeta.content = `rgb(${bg.join(',')})`;
}
function fitDevice() {
  if (!device) return;
  const framed = matchMedia('(min-width: 520px) and (min-height: 520px)').matches;
  const vh = innerHeight || document.documentElement.clientHeight || 898;
  device.style.setProperty('--device-scale', framed ? Math.max(0.3, Math.min(1, (vh - 40) / 898)).toFixed(4) : 1);
}
addEventListener('resize', () => { fitDevice(); syncChrome(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { refresh(); syncChrome(); });
function tickClock() { const c = document.querySelector('.sb-time'); if (c) c.textContent = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' }).format(new Date()); }
fitDevice(); tickClock(); setInterval(tickClock, 20000);

// Plus de bandeau : le rôle se change dans Profil › Changer de vue.
// Typographie française : une espace insécable à l'intérieur des guillemets, pour qu'un « » ne parte jamais seul à la ligne
// (vu sur Activité : le guillemet fermant et le point isolés sur une ligne).
function withDemo(view) { return store.heureClient(view.html).replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»')
  // Vague 22 (jury n° 7) : « le 29 oct.. » : le point de l'abréviation du mois sert de point final.
  .replace(/\b(janv|févr|avr|juil|sept|oct|nov|déc)\.((?:<\/b>|<\/strong>)?)\./g, '$1.$2'); }

function applyPrefs() { document.documentElement.classList.toggle('reduce-motion', !!get().prefs.reduceMotion); document.documentElement.classList.toggle('simple-mode', simpleOn(get())); }   // vague 8 : mode simple (gros texte, l'essentiel, une action)
store.subscribe(applyPrefs);

// ---------- Simulation d'envoi ----------
// Pastille « Envoi en cours » (cahier 5.7 / 5.12) : l'envoi continue en arrière-plan, visible sur tous les écrans.
let pillDone = 0, pillHad = false;
function syncPill() {
  const st = get(), act = st.uploads.filter(u => ['en_attente', 'envoi', 'hors_ligne'].includes(u.status));
  const name = current && current.route.name;
  let el = app.querySelector('.upload-pill');
  if (pillHad && !act.length && !st.uploads.some(u => u.status === 'echec')) pillDone = Date.now() + 1400;
  pillHad = act.length > 0;
  const show = (act.length || Date.now() < pillDone) && st.session.loggedIn && !['uploads', 'camera', 'splash', 'welcome', 'login', 'review'].includes(name);
  if (!show) { if (el && !el.classList.contains('out')) { el.classList.add('out'); setTimeout(() => el.classList.contains('out') && el.remove(), 260); } return; }
  if (!el) { el = document.createElement('button'); el.className = 'upload-pill'; el.dataset.go = '#/uploads'; app.appendChild(el); }
  el.classList.remove('out');
  const u = act[0] || st.uploads[0], p = u && store.project(u.pid), s = p && store.step(p, u.sid), ph = s && s.photos.find(x => x.id === u.photoId);
  const thumb = ph ? (ph.dataUrl ? `<img src="${ph.dataUrl}" alt="">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction, stamp: false })) : '';
  const n = act.length, pct = n ? Math.round(act.reduce((a, x) => a + (x.progress || 0), 0) / n) : 100, off = st.net.offline && n;
  const text = !n ? 'Envoyé' : off ? `${n} photo${n > 1 ? 's' : ''} gardée${n > 1 ? 's' : ''} · hors ligne` : `${n} photo${n > 1 ? 's' : ''} en cours d'envoi…`;
  const sig = `${text}|${pct}|${ph && ph.id}`;
  if (el.dataset.sig === sig) return; el.dataset.sig = sig;
  el.setAttribute('aria-label', `${text} Ouvrir les envois.`);
  el.innerHTML = `<span class="up-thumb">${thumb}</span><span class="up-text">${text}</span><span class="up-ring ${!n ? 'done' : ''}" style="--p:${pct}">${!n ? icon('check', 'xs') : off ? icon('wifiOff', 'xs') : `<b>${pct}</b>`}</span>`;
}

setInterval(() => {
  syncPill();
  const changed = actions.uploadTick();
  if (changed && current && ['uploads', 'step', 'camera-preview', 'home', 'path'].includes(current.route.name)) refresh();
  else if (changed && current) { const tb = current.el.querySelector('.tabbar'); if (tb) refresh(); }
}, 450);

// Délais (problème 10) : une mission sans réponse sous 24 h passe à une autre agence ; vérifié à l'ouverture puis chaque minute.
actions.checkDelays(); setInterval(() => actions.checkDelays(), 60000);

// Démarrage
if (!location.hash) history.replaceState(null, '', get().lastRoute && get().session.loggedIn ? get().lastRoute : '#/home');
stack.push(location.hash);
render('none');

// API de test (Playwright) — lecture seule de l'état
window.__teeqa = { get, go, actions };

// Essais 1-2-3 (voir trial() dans js/ui.js) : on enregistre le choix et on redessine l'écran.
document.addEventListener('click', (e) => { const b = e.target.closest('[data-trial]'); if (!b) return;
  try { localStorage.setItem('teeqa-essai-' + b.dataset.trial, b.dataset.n); } catch { /* stockage indisponible */ }
  e.preventDefault(); e.stopPropagation(); actions.session({}); }, true);


// Salle de démo (14 nov.) : quand un autre téléphone agit, la notification arrive ici comme une vraie notification.
if (store.SALLE) {
  window.addEventListener('teeqa-salle-notif', (e) => {
    const n = e.detail[e.detail.length - 1]; if (!n) return;
    toast(n.text.length > 90 ? n.text.slice(0, 88) + '…' : n.text, 'bell'); sfx('pop'); navigator.vibrate && navigator.vibrate([12, 60, 12]);
  });
  const pastille = document.createElement('div'); pastille.className = 'salle-direct'; pastille.setAttribute('aria-live', 'polite');
  document.body.appendChild(pastille);
  const peindre = (etat) => { pastille.dataset.etat = etat; pastille.textContent = etat === 'ok' ? `En direct · ${ROLES[get().role].label}` : etat === 'hors' ? 'Hors connexion · nouvel essai…' : 'Connexion…'; };
  store.onSalle(peindre); store.subscribe(() => peindre(store.salleInfo().etat)); peindre(store.salleInfo().etat);
}
// Vague 22 (doigt : Lina) : un bloc replié qu'on ouvre près du bas de l'écran défile pour se montrer (« Photos et historique » s'ouvrait sous le bord).
// Vague 23 (doigt : Nadia) : un bloc affiché déjà ouvert (« Ce que vous signez ») lance aussi « toggle » : seul un bloc ouvert au doigt fait défiler.
let sumTouch = 0; document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('summary')) sumTouch = Date.now(); }, true);
document.addEventListener('toggle', (e) => { const d = e.target; if (!(d instanceof HTMLDetailsElement) || !d.open || d.classList.contains('thread-opts') || Date.now() - sumTouch > 800) return;
  const sc = d.closest('.scroll, .sheet'); if (!sc) return; requestAnimationFrame(() => { const r = d.getBoundingClientRect(), b = sc.getBoundingClientRect(), bas = b.bottom - 90;
    if (r.bottom > bas) sc.scrollBy({ top: Math.min(r.bottom - bas, r.top - b.top - 60), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }); }, true);
