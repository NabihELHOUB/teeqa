// Mouvement TEEQA : un seul ressort, transform + opacity seulement (docs/motion-duolingo.md).
// Le geste vient de Duolingo (la surface suit le doigt, puis un ressort) ; la marque reste TEEQA.

// Le ressort unique. Amortissement ~0,92 : il se pose sans flotter. Même réglage partout.
const K = 520, C = 42;

export const reduced = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

// Anime une valeur de `from` vers `to` (vitesse initiale en unités/ms, ex. vitesse du doigt).
// Retourne une fonction d'arrêt. En mouvement réduit : saut direct à la fin.
export function spring({ from, to, velocity = 0, onUpdate, onDone }) {
  if (reduced()) { onUpdate(to); onDone && onDone(); return () => {}; }
  let x = from, v = velocity * 1000, last = performance.now(), raf = 0, stopped = false;
  const step = (t) => {
    if (stopped) return;
    let dt = Math.min(0.032, (t - last) / 1000); last = t;
    // deux sous-pas : stable même si une image saute
    for (let i = 0; i < 2; i++) { const h = dt / 2; const a = -K * (x - to) - C * v; v += a * h; x += v * h; }
    if (Math.abs(x - to) < 0.3 && Math.abs(v) < 8) { onUpdate(to); onDone && onDone(); return; }
    onUpdate(x); raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

// Suivi du doigt sur un axe. `axis` 'x' ou 'y'. `start(e)` dit si le geste peut commencer.
// Le geste ne démarre qu'après 6 px dans le bon sens ; un clic simple reste un clic.
export function drag(el, { axis = 'y', start = () => true, move, end }) {
  let s = null;
  const pos = (e) => axis === 'y' ? e.clientY : e.clientX;
  const other = (e) => axis === 'y' ? e.clientX : e.clientY;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !start(e)) return;
    s = { id: e.pointerId, p0: pos(e), o0: other(e), on: false, hist: [[performance.now(), pos(e)]] };
  });
  el.addEventListener('pointermove', (e) => {
    if (!s || e.pointerId !== s.id) return;
    const d = pos(e) - s.p0;
    if (!s.on) {
      if (Math.abs(other(e) - s.o0) > 10 && Math.abs(d) < 6) { s = null; return; } // geste dans l'autre axe
      if (d < 6) return;                                                             // vers le haut / la gauche : pas pour nous
      s.on = true; try { el.setPointerCapture(e.pointerId); } catch {}
    }
    e.preventDefault();
    s.hist.push([performance.now(), pos(e)]); if (s.hist.length > 6) s.hist.shift();
    move(Math.max(0, d));
  });
  const finish = (e) => {
    if (!s || e.pointerId !== s.id) return;
    const was = s; s = null;
    if (!was.on) return;
    // vitesse du doigt sur les 100 dernières ms ; un doigt arrêté avant de lâcher n'a plus d'élan
    const now = performance.now(), h = was.hist.filter(([t]) => now - t < 100);
    const a = h[0], b = h[h.length - 1];
    const v = h.length > 1 && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0; // px/ms
    // le clic qui suit un glissé ne doit rien déclencher
    const kill = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    el.addEventListener('click', kill, { capture: true, once: true }); setTimeout(() => el.removeEventListener('click', kill, { capture: true }), 0);
    end(Math.max(0, pos(e) - was.p0), v);
  };
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);
}

// Liste qui arrive : lignes décalées de 40 ms (8 premières), une fois à l'entrée de l'écran.
export function staggerLists(root) {
  if (reduced()) return;
  root.querySelectorAll('[data-stagger]').forEach(list => {
    const kids = [...list.children];
    (list.dataset.stagger === 'end' ? kids.slice(-8) : kids.slice(0, 8)).forEach((li, i) => { li.style.setProperty('--i', i); li.classList.add('arrive'); });
  });
}

// Le seul moment de réussite : une étape validée se tamponne, une fois.
const SEEN = 'teeqa-stamped';
export function stampFresh(root) {
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN) || '[]'));
  let changed = false;
  root.querySelectorAll('[data-stamp]').forEach(el => {
    const k = el.dataset.stamp;
    if (seen.has(k)) return;
    seen.add(k); changed = true;
    if (!reduced()) el.classList.add('stamp-in');
  });
  if (changed) localStorage.setItem(SEEN, JSON.stringify([...seen].slice(-60)));
}
