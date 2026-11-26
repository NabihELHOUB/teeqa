// « Vie » de l'appli : ce qui sépare une maquette d'une appli qu'on a en main (demande de l'utilisateur, 10 nov. :
// le niveau de Duolingo, Revolut, Airbnb). Trois écarts mesurés sur les références et comblés ici, sans dépendance :
//  1. Le toucher se sent. iOS n'a pas `navigator.vibrate` : toutes les vibrations de l'appli étaient muettes sur iPhone.
//     On les fait passer par l'interrupteur natif de Safari (iOS 17.4+), qui déclenche le vrai moteur haptique.
//  2. Le personnage sait que vous êtes là. Bellarej était un film en boucle ; c'est maintenant une petite machine à états
//     (ce que fait Rive) : son regard suit le doigt, elle réagit quand on la touche, et s'agace si on insiste.
//  3. Les chiffres se gagnent. Pourcentages et jauges arrivaient déjà remplis ; ils se comptent et se remplissent à l'entrée.
import { reduced } from './motion.js';
import { sfx, sfxTap } from './ui.js';

/* ---------- 1. Retour haptique ---------- */
let hLabel = null;
function iosTick() {
  if (!hLabel) {
    hLabel = document.createElement('label');
    hLabel.setAttribute('aria-hidden', 'true');
    hLabel.style.cssText = 'position:fixed;left:-99px;top:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none';
    const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
    hLabel.appendChild(i); document.body.appendChild(hLabel);
  }
  // L'interrupteur caché ne doit jamais prendre la main à un champ de saisie : sur iPhone, le clavier ne s'ouvrait pas ou se refermait (retour du 11 nov.).
  const ae = document.activeElement;
  if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && !hLabel.contains(ae)) return;
  hLabel.click();
  const now = document.activeElement; if (now && hLabel.contains(now)) now.blur();
}
// Même signature que navigator.vibrate : un nombre, ou un motif [vibre, pause, vibre…] (un « tic » par temps de vibration).
let lastHaptic = 0;
const hapticsOn = () => { try { return JSON.parse(localStorage.getItem('teeqa-vibrations') ?? 'true') !== false; } catch { return true; } };
export function haptic(pattern = 8) {
  try {
    // Règles (11 nov., d'après les recommandations d'Android, Meta et Microsoft) : coupable dans Paramètres ; jamais deux
    // vibrations légères à moins de 120 ms ; un motif (validation, signature) passe toujours et impose 400 ms de calme ensuite.
    if (!hapticsOn()) return;
    const now = performance.now(), strong = Array.isArray(pattern);
    if (!strong && now - lastHaptic < 120) return;
    lastHaptic = strong ? now + 400 : now;
    if (nativeVibrate) { nativeVibrate(pattern); return; }
    const beats = Array.isArray(pattern) ? pattern : [pattern];
    let t = 0;
    beats.forEach((ms, k) => { if (k % 2 === 0) { t ? setTimeout(iosTick, t) : iosTick(); } t += ms + (k % 2 === 0 ? 30 : 0); });
  } catch { /* pas de retour haptique : sans gravité */ }
}
const nativeVibrate = typeof navigator.vibrate === 'function' ? navigator.vibrate.bind(navigator) : null;
// Les appels existants (`navigator.vibrate && navigator.vibrate(8)`) passent ainsi par le moteur haptique de l'iPhone.
if (!nativeVibrate) { try { Object.defineProperty(navigator, 'vibrate', { value: (p) => { haptic(p); return true; }, configurable: true }); } catch { /* navigateur verrouillé */ } }

/* ---------- 1 bis. Vibration au vrai toucher (iPhone, iOS 26.5 et suivants) ----------
   Retour de l'utilisateur (11 nov., iPhone 17) : « les vibrations, il ne se passe rien ». Cause : depuis iOS 26.5, Safari
   n'accorde plus la vibration d'un interrupteur quand c'est le code qui clique dessus (iosTick ci-dessus). Elle reste
   accordée quand c'est le doigt qui touche l'étiquette de l'interrupteur. On pose donc, sur chaque élément qui doit
   vibrer, une étiquette transparente qui le recouvre, reliée à un interrupteur invisible : le doigt touche l'étiquette,
   Safari transmet le toucher à l'interrupteur et fait vibrer, et le clic remonte normalement jusqu'au bouton.
   Méthode reprise de la bibliothèque ios-haptics (tijnjh, licence MIT, fonction hapticTrigger) ; voir docs du projet.
   Limite : une vibration par toucher. Les motifs lancés par une minuterie (célébration, signature) ne vibrent plus sur
   ces versions d'iOS : aucune page web ne le peut. */
// Retour du 11 nov. (après essai sur iPhone 17 : « ça vibre sur certains boutons, je veux une petite vibration sur tous ») :
// tout ce qui se touche vibre, pas seulement les boutons principaux.
const VIBRE = 'button, a[href], [data-go], [data-act], [role="button"], [role="tab"], [role="switch"], [role="radio"], [data-haptic]';
// Un élément qui contient lui-même des boutons (une carte avec ses actions) n'est pas recouvert : l'étiquette passerait
// devant ses boutons et le toucher irait à la carte.
const INNER = 'button, a[href], [data-go], [data-act], [role="button"], input, textarea, select';
let iosTouch = !nativeVibrate && typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
let watching = false;
let armQueued = false;
const armSoon = () => { if (armQueued) return; armQueued = true; queueMicrotask(() => { armQueued = false; armAll(); }); };
const watch = () => { if (watching) return; watching = true; armAll(); new MutationObserver(armSoon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled'] }); };
// Force ce mode sur ordinateur, pour les tests (tests/e2e.mjs).
export function forceIosHaptics() { iosTouch = true; watch(); }
function arm(el) {
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || /^(INPUT|TEXTAREA|SELECT|LABEL)$/.test(el.tagName) || el.closest('[data-haptic-trigger]') || el.querySelector(':scope > [data-haptic-trigger]')) return;
  if ([...el.querySelectorAll(INNER)].some((x) => !x.closest('[data-haptic-trigger]'))) return;
  const label = document.createElement('label');
  label.setAttribute('data-haptic-trigger', ''); label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:absolute;inset:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;margin:0;padding:0;border:0;background:none';
  const sw = document.createElement('input'); sw.type = 'checkbox'; sw.setAttribute('switch', ''); sw.tabIndex = -1;
  // L'interrupteur n'est jamais sous le doigt : sinon Safari retient le toucher et le défilement se bloque.
  sw.style.cssText = 'position:absolute;width:1px;height:1px;margin:0;visibility:hidden';
  // Le clic que l'étiquette transmet à l'interrupteur ne doit jamais remonter jusqu'au bouton : sinon l'action part deux fois.
  // L'arrêt à la fenêtre (initLife) ne suffit pas quand le bouton vient de retirer sa propre feuille de l'écran : l'interrupteur
  // n'est alors plus relié à la page, son clic ne passe plus par la fenêtre mais atteint encore le bouton (défaut trouvé le
  // 11 nov. par les tests en mode --ios : « Envoyer le signalement » créait deux signalements).
  sw.addEventListener('click', (e) => e.stopPropagation());
  label.append(sw);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.append(label);
}
function armAll(root = document) {
  if (!iosTouch) return;
  if (!hapticsOn()) { root.querySelectorAll('[data-haptic-trigger]').forEach((l) => l.remove()); return; }
  root.querySelectorAll(VIBRE).forEach(arm);
}
// À rappeler quand l'interrupteur « Vibrations » des Paramètres change.
export function refreshHaptics() { document.querySelectorAll('[data-haptic-trigger]').forEach((l) => l.remove()); armAll(); }

/* ---------- 2. Bellarej, machine à états ---------- */
// États : repos (boucle CSS de l'humeur) → regarde (le doigt bouge) → touchée (1, 2) → agacée (3 touchers de suite) → repos.
const birds = () => [...document.querySelectorAll('#app .screen:last-of-type .br, .fete .br, .sheet .br')].filter((b) => b.getClientRects().length);
let gazeRaf = 0, gazeIdle = 0, lastPt = null;
function gaze() {
  gazeRaf = 0;
  if (!lastPt) return;
  for (const b of birds()) {
    const eye = b.querySelector('.br-eye'); if (!eye) continue;
    const r = eye.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = lastPt.x - cx, dy = lastPt.y - cy; const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 90);                        // tout près : elle louche à peine ; au-delà de 90 px : regard franc
    dx = (dx / d) * k; dy = (dy / d) * k;
    if (new DOMMatrixReadOnly(getComputedStyle(b).transform).a < 0) dx = -dx;   // dessin retourné (elle regarde à gauche)
    b.style.setProperty('--gx', dx.toFixed(3)); b.style.setProperty('--gy', dy.toFixed(3));
    b.classList.add('br-look');
  }
}
function look(e) {
  if (reduced()) return;
  lastPt = { x: e.clientX, y: e.clientY };
  if (!gazeRaf) gazeRaf = requestAnimationFrame(gaze);
  clearTimeout(gazeIdle);
  gazeIdle = setTimeout(() => { lastPt = null; document.querySelectorAll('.br-look').forEach((b) => { b.classList.remove('br-look'); b.style.removeProperty('--gx'); b.style.removeProperty('--gy'); }); }, 1400);
}

const pokes = new WeakMap();
function poke(b, quiet) {
  const now = performance.now(), p = pokes.get(b) || { n: 0, t: 0 };
  p.n = now - p.t < 1600 ? p.n + 1 : 1; p.t = now; pokes.set(b, p);
  const angry = p.n >= 3;
  b.classList.remove('br-poked', 'br-miffed'); void b.getBoundingClientRect();
  b.classList.add(angry ? 'br-miffed' : 'br-poked');
  clearTimeout(p.off); p.off = setTimeout(() => { b.classList.remove('br-poked', 'br-miffed'); if (angry) p.n = 0; }, angry ? 1500 : 760);
  if (quiet) return;                                       // la carte du chantier a déjà son saut, son bruit et sa vibration
  haptic(angry ? [10, 40, 10, 40, 14] : 6); sfx(angry ? 'warn' : 'pop');
  if (reduced() || !b.animate) return;
  // `translate` et `scale` (et non `transform`) : ils s'ajoutent au retournement et aux boucles déjà en place.
  b.animate(angry
    ? [{ translate: '0 0', scale: '1 1' }, { translate: '-5px 0', scale: '1.04 .97', offset: .12 }, { translate: '5px 0', offset: .26 }, { translate: '-4px 0', offset: .4 }, { translate: '4px 0', offset: .54 }, { translate: '-2px 0', offset: .68 }, { translate: '0 0', scale: '1 1' }]
    : [{ translate: '0 0', scale: '1 1' }, { translate: '0 3px', scale: '1.07 .9', offset: .16 }, { translate: `0 ${p.n > 1 ? -22 : -14}px`, scale: '.95 1.07', offset: .46 }, { translate: '0 0', scale: '1.05 .94', offset: .76 }, { translate: '0 0', scale: '1 1' }],
    { duration: angry ? 620 : 520, easing: 'cubic-bezier(.3, .7, .4, 1)' });
}
function tap(e) {
  if (hLabel && hLabel.contains(e.target)) return;
  const armed = !!(e.target.closest && e.target.closest('[data-haptic-trigger]'));   // le vrai toucher fait déjà vibrer
  const hit = birds().find((b) => { const r = b.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
  const ctl = e.target.closest && e.target.closest('button, a, input, textarea, [data-go], [data-act], [role="button"]');
  if (hit && (!ctl || ctl.matches('[data-act="mascot"]'))) { poke(hit, !!ctl); return; }
  if (ctl && ctl.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, select')) return;   // toucher un champ : pas de vibration, on laisse le clavier s'ouvrir
  if (!ctl || ctl.disabled) return;
  // On ne vibre plus à chaque toucher (retour du 11 nov. : agréable, jamais envahissant) : seulement sur ce qui engage.
  // Tout toucher vibre (retour du 11 nov.). Sur iPhone récent, l'étiquette l'a déjà fait ; sinon on demande la vibration ici.
  if (!armed) haptic(ctl.matches('.btn:not(.text):not(.ghost)') ? 8 : 6);
  // Dès la première page : tout bouton et toute carte qui mène quelque part répond par un son (demande du 11 nov.).
  if (ctl.matches('.btn, [data-go], .list-item, .door, .su-card') && !ctl.matches('.tab, .toggle, .seg-opt, [role="tab"], [role="switch"], [data-act="print"]')) sfxTap();
}

/* ---------- 3. Chiffres et jauges ---------- */
function countUp(el, to, ms = 760) {
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1 && el.isConnected) requestAnimationFrame(step); else el.textContent = to; };
  el.textContent = 0; requestAnimationFrame(step);
}
// À appeler à l'entrée d'un écran (pas à chaque rafraîchissement sur place : les chiffres ne doivent pas repartir de zéro).
export function enliven(root) {
  if (reduced()) return;
  root.querySelectorAll('.pc-pct b').forEach((b, i) => { const to = parseInt(b.textContent, 10); if (to > 0) { b.textContent = 0; setTimeout(() => b.isConnected && countUp(b, to), 140 + i * 90); } });   // 0 tout de suite : pas d'éclair du chiffre final
  root.querySelectorAll('.progress > i, .bar > i').forEach((bar, i) => {
    const w = bar.style.width; if (!w || parseFloat(w) <= 0 || !bar.animate) return;
    bar.animate([{ width: '0%' }, { width: w }], { duration: 820, delay: 140 + i * 90, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' });
  });
}

/* ---------- 4. Barre d'onglets : la surbrillance suit le doigt (demande de l'utilisateur, 11 nov.) ---------- */
// Comme les barres « en verre » d'iOS : on pose le doigt, la pastille de verre glisse avec lui d'un onglet à l'autre,
// l'icône survolée grossit, et on arrive sur l'onglet où le doigt se lève. Un simple appui reste un simple appui.
let slide = null;
function tabDown(e) {
  const bar = e.target.closest && e.target.closest('.tabbar'); if (!bar || e.button > 0) return;
  const tabs = [...bar.querySelectorAll('.tab')], from = e.target.closest('.tab');
  slide = { bar, tabs, from, x0: e.clientX, moved: false, glass: null, id: e.pointerId };
}
function tabMove(e) {
  if (!slide || e.pointerId !== slide.id) return;
  if (!slide.moved) {
    if (Math.abs(e.clientX - slide.x0) < 8) return;
    slide.moved = true; slide.bar.classList.add('sliding');
    slide.glass = document.createElement('span'); slide.glass.className = 'tab-glass'; slide.bar.appendChild(slide.glass);
    haptic(6);
  }
  const b = slide.bar.getBoundingClientRect(), k = b.width / slide.bar.offsetWidth || 1, w = 62;
  const x = Math.max(4, Math.min(slide.bar.offsetWidth - w - 4, (e.clientX - b.left) / k - w / 2));
  slide.glass.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
  const hot = slide.tabs.find((t) => { const r = t.getBoundingClientRect(); return e.clientX >= r.left && e.clientX < r.right; });
  if (hot !== slide.hot) { if (slide.hot) slide.hot.classList.remove('hot'); if (hot) { hot.classList.add('hot'); haptic(4); } slide.hot = hot; }
}
function tabUp(e) {
  if (!slide || e.pointerId !== slide.id) return;
  const s = slide; slide = null;
  if (!s.moved) return;
  const target = s.hot;
  const done = () => { s.bar.classList.remove('sliding'); if (s.glass) s.glass.remove(); if (s.hot) s.hot.classList.remove('hot'); };
  // Le navigateur ne déclenche un clic que si le doigt se lève sur l'élément où il s'est posé : sinon on le fait nous-mêmes.
  if (target && target !== s.from && !target.hasAttribute('aria-current') && e.type === 'pointerup') { target.click(); setTimeout(done, 60); } else done();
}

let started = false;
export function initLife() {
  if (started) return; started = true;
  document.addEventListener('pointerdown', look, { passive: true });
  document.addEventListener('pointermove', look, { passive: true });
  // Le clic que l'étiquette transmet à son interrupteur invisible ne doit atteindre aucun écouteur de l'appli (sinon l'action
  // partirait deux fois). On l'arrête dès la fenêtre ; l'interrupteur bascule quand même, et c'est ce qui fait vibrer.
  window.addEventListener('click', (e) => { if (e.target && e.target.matches && e.target.matches('[data-haptic-trigger] > input')) e.stopImmediatePropagation(); }, true);
  if (iosTouch) watch();
  document.addEventListener('click', tap, true);
  document.addEventListener('pointerdown', tabDown, { passive: true });
  document.addEventListener('pointermove', tabMove, { passive: true });
  document.addEventListener('pointerup', tabUp); document.addEventListener('pointercancel', tabUp);
}
