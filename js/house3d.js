// Maison 3D du chemin — WebGL 1 écrit à la main, sans dépendance (Three.js mesuré à 531 Ko élagué : trop lourd
// pour une seule maison). Volumes de Fès au trait d'encre ; le niveau suit les étapes vérifiées (0..6).
// Rendu à la demande : une entrée courte, puis rien tant qu'on ne fait pas glisser la maison.
// Repli : si WebGL manque ou si le contexte est perdu, l'appelant garde le dessin SVG.

const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const C = {
  chaux: hex('#F1ECE2'), papier: hex('#E8E1D3'), pierre: hex('#CFC6B4'), fes: hex('#0E3B31'),
  fes2: hex('#14503F'), saffron: hex('#E2A33B'), pise: hex('#B8603A'), ink: hex('#1A1C20'),
};

// ---------- Géométrie : chaque pièce a une plage de niveaux [min, max] où elle est construite ----------
function builder() {
  const parts = [];
  const part = (min, max = 6, { lines = false } = {}) => { const p = { min, max, lines, tri: [], seg: [] }; parts.push(p); return p; };
  const quad = (p, a, b, c, d, n, col) => { for (const v of [a, b, c, a, c, d]) p.tri.push(...v, ...n, ...col); };
  const seg = (p, a, b) => p.seg.push(...a, 0, 0, 0, 0, 0, 0, ...b, 0, 0, 0, 0, 0, 0);
  function box(p, [cx, cy, cz], [w, h, d], col, { edges = true } = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const v = (x, y, z) => [x, y, z];
    quad(p, v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1), [0, 0, 1], col);
    quad(p, v(x1, y0, z0), v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0), [0, 0, -1], col);
    quad(p, v(x1, y0, z1), v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), [1, 0, 0], col);
    quad(p, v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0), [-1, 0, 0], col);
    quad(p, v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0), v(x0, y1, z0), [0, 1, 0], col);
    quad(p, v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), [0, -1, 0], col);
    if (!edges) return;
    for (const y of [y0, y1]) { seg(p, v(x0, y, z0), v(x1, y, z0)); seg(p, v(x1, y, z0), v(x1, y, z1)); seg(p, v(x1, y, z1), v(x0, y, z1)); seg(p, v(x0, y, z1), v(x0, y, z0)); }
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) seg(p, v(x, y0, z), v(x, y1, z));
  }
  // Polygone convexe (ou étoilé autour de son centre) posé sur une façade +z, extrudé de « depth »
  function plate(p, pts, z, depth, col) {
    const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    const zf = z + depth;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      for (const q of [[cx, cy], a, b]) p.tri.push(q[0], q[1], zf, 0, 0, 1, ...col);
      const nx = b[1] - a[1], ny = a[0] - b[0], l = Math.hypot(nx, ny) || 1;
      quad(p, [a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], zf], [a[0], a[1], zf], [nx / l, ny / l, 0], col);
      seg(p, [a[0], a[1], zf], [b[0], b[1], zf]);
    }
  }
  // Arc outrepassé (porte, fenêtres) : jambages + arc de ~240°
  const arch = (x, y0, w, h) => {
    const r = w / 2, cy = y0 + h - r, pts = [[x + r, y0]];
    for (let k = 0; k <= 14; k++) { const t = -0.35 + (Math.PI + 0.7) * k / 14; pts.push([x + Math.cos(t) * r * 1.08, cy + Math.sin(t) * r * 1.08]); }
    pts.push([x - r, y0]);
    return pts.filter((q, i) => i === 0 || i === pts.length - 1 || q[1] >= cy - r * .2 || Math.abs(q[0] - x) <= r);
  };
  const star = (x, y, R) => Array.from({ length: 16 }, (_, k) => { const a = Math.PI / 2 + k * Math.PI / 8, rr = k % 2 ? R * .62 : R; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; });

  // 0 terrain piqueté
  box(part(0), [0, -0.06, 0], [6.6, 0.12, 5.6], C.papier);
  const stakes = part(0, 0);
  for (const [x, z] of [[-2.6, -2.1], [2.6, -2.1], [2.6, 2.1], [-2.6, 2.1]]) box(stakes, [x, 0.3, z], [0.1, 0.6, 0.1], C.pise);
  const cord = part(0, 0, { lines: true });
  seg(cord, [-2.6, 0.5, -2.1], [2.6, 0.5, -2.1]); seg(cord, [2.6, 0.5, -2.1], [2.6, 0.5, 2.1]); seg(cord, [2.6, 0.5, 2.1], [-2.6, 0.5, 2.1]); seg(cord, [-2.6, 0.5, 2.1], [-2.6, 0.5, -2.1]);
  // 1 fondations
  box(part(1), [0, 0.15, 0], [5.4, 0.3, 4.4], C.pierre);
  // 2 murs du rez-de-chaussée
  box(part(2), [0, 1.2, 0], [5, 1.8, 4], C.chaux);
  // 3 dalle + acrotère (toit-terrasse)
  const roof = part(3);
  box(roof, [0, 2.2, 0], [5.3, 0.2, 4.3], C.chaux);
  box(roof, [0, 2.5, 2.08], [5.3, 0.4, 0.14], C.chaux); box(roof, [0, 2.5, -2.08], [5.3, 0.4, 0.14], C.chaux);
  box(roof, [2.58, 2.5, 0], [0.14, 0.4, 4.02], C.chaux); box(roof, [-2.58, 2.5, 0], [0.14, 0.4, 4.02], C.chaux);
  // 4 porte en arc (vert de Fès), fenêtres, pièce sur la terrasse (menzah)
  const open = part(4);
  plate(open, arch(0.2, 0.3, 1.0, 1.5), 2.0, 0.05, C.fes);
  for (const x of [-1.55, 1.7]) plate(open, arch(x, 1.0, 0.46, 0.7), 2.0, 0.04, C.fes2);
  box(open, [-1.2, 2.95, -0.8], [2.2, 1.3, 1.8], C.chaux);
  box(open, [-1.2, 3.65, -0.8], [2.36, 0.12, 1.96], C.chaux);
  plate(open, arch(-1.2, 2.3, 0.6, 0.95), 0.1, 0.04, C.fes);
  // 5 enduits : soubassement vert de Fès tout autour
  box(part(5), [0, 0.43, 0], [5.04, 0.26, 4.04], C.fes2);
  // 6 finitions : sceau safran (étoile à 8 branches) au-dessus de la porte — le seul safran
  plate(part(6), star(-0.55, 3.05, 0.22), 0.1, 0.05, C.saffron);
  // Échafaudage au trait (chantier en cours, niveaux 1 à 5)
  const scaf = part(1, 5, { lines: true }); scaf.scaffold = true;
  for (const z of [-1.9, 0, 1.9]) seg(scaf, [2.95, 0, z], [2.95, 3.0, z]);
  for (const y of [1.0, 2.0, 3.0]) seg(scaf, [2.95, y, -1.9], [2.95, y, 1.9]);
  seg(scaf, [2.95, 0, -1.9], [2.95, 2.0, 0]); seg(scaf, [2.95, 1.0, 0], [2.95, 3.0, 1.9]);
  return parts;
}

// ---------- Mathématiques minimales (matrices colonne) ----------
function persp(fy, asp, n, f) { const t = 1 / Math.tan(fy / 2), nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }
function look(e, c) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], nrm = (a) => { const l = Math.hypot(...a); return a.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const z = nrm(sub(e, c)), x = nrm(cross([0, 1, 0], z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
}
function mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }

const VS = `attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 M;uniform vec2 off;uniform float dy;varying vec3 vn;varying vec3 vc;
void main(){vn=n;vc=c;gl_Position=M*vec4(p.x,p.y+dy,p.z,1.);gl_Position.xy+=off*gl_Position.w;}`;
const FS = `precision mediump float;varying vec3 vn;varying vec3 vc;uniform float lit;uniform vec4 ink;uniform float a;
void main(){if(lit>.5){float d=max(dot(normalize(vn),normalize(vec3(.55,.9,.7))),0.);vec3 col=vc*(.76+.3*d);gl_FragColor=vec4(col*a,a);}
else{gl_FragColor=vec4(ink.rgb*ink.a*a,ink.a*a);}}`;

let live = null;           // une seule maison active (un seul contexte WebGL dans l'app)
const seen = new Map();    // dernier niveau montré par chantier → anime seulement ce qui vient d'être vérifié

export function supported() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && c.getContext('webgl')); } catch { return false; }
}

export function disposeHouse3D() {
  if (!live) return;
  live.stop();
  const ext = live.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
  live.canvas.remove(); live = null;
}

// container : élément qui contient le SVG de repli. Renvoie false si WebGL n'est pas disponible.
export function mountHouse3D(container, { level = 0, key = 'x', crane = true, label = '' } = {}) {
  const L = Math.max(0, Math.min(6, level));
  const svg = container.querySelector('svg');
  // Même chantier, même maison : on déplace le canvas existant dans le nouveau DOM (rafraîchissement d'état)
  if (live && live.key === key) { container.prepend(live.canvas); live.attach(container, svg); live.set(L, crane); return true; }
  disposeHouse3D();
  const canvas = document.createElement('canvas');
  canvas.className = 'house3d';
  canvas.setAttribute('role', 'img');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return false;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);
  const U = Object.fromEntries(['M', 'off', 'dy', 'lit', 'ink', 'a'].map(k => [k, gl.getUniformLocation(prog, k)]));
  const A = Object.fromEntries(['p', 'n', 'c'].map(k => [k, gl.getAttribLocation(prog, k)]));
  const upload = (arr) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return { b, n: arr.length / 9 }; };
  const parts = builder().map(p => ({ ...p, T: upload(p.tri), S: upload(p.seg) }));
  const bind = (buf) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf.b); for (const [k, o] of [['p', 0], ['n', 12], ['c', 24]]) { gl.enableVertexAttribArray(A[k]); gl.vertexAttribPointer(A[k], 3, gl.FLOAT, false, 36, o); } };

  const st = { L, crane, yaw: 0.62, raf: 0, t0: 0, from: -1, swing: true, svg, container };
  const prev = seen.get(key);
  st.from = prev == null ? -1 : prev < L ? prev : L;   // niveaux > from : animés à l'entrée
  seen.set(key, L);

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return dpr;
  }
  function draw(now = performance.now()) {
    const dpr = size(), W = canvas.width, H = canvas.height;
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const ease = (ms) => { const t = Math.max(0, Math.min(1, ms)); return 1 - Math.pow(1 - t, 3); };
    const el = st.t0 ? now - st.t0 : 1e9, e = ease(el / 900);
    const yaw = st.yaw + (st.swing ? (1 - e) * -0.5 : 0), pitch = 0.5, dist = 21, tg = [0, 1.55, 0];
    const eye = [tg[0] + Math.sin(yaw) * Math.cos(pitch) * dist, tg[1] + Math.sin(pitch) * dist, tg[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
    gl.uniformMatrix4fv(U.M, false, new Float32Array(mul(persp(0.42, W / H, 1, 60), look(eye, tg))));
    // ce qui vient d'être vérifié monte en place, niveau après niveau (120 ms d'écart, 650 ms chacun)
    const anim = (p) => {
      if (!(p.min > st.from && p.min > 0)) return { dy: 0, a: 1 };
      const k = ease((el - (p.min - Math.max(st.from, 0) - 1) * 120) / 650);
      return { dy: (1 - k) * 1.2, a: Math.min(1, k * 1.4) };
    };
    const total = 900 + 120 * Math.max(0, st.L - Math.max(st.from, 0));
    const built = parts.filter(p => p.min <= st.L && st.L <= p.max && (!p.scaffold || st.crane));
    const ghost = parts.filter(p => p.min === st.L + 1 && !p.scaffold && !p.lines);
    // faces
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2); gl.uniform1f(U.lit, 1); gl.uniform2f(U.off, 0, 0);
    for (const p of built) if (p.T.n) { const m = anim(p); bind(p.T); gl.uniform1f(U.dy, m.dy); gl.uniform1f(U.a, m.a); gl.drawArrays(gl.TRIANGLES, 0, p.T.n); }
    gl.disable(gl.POLYGON_OFFSET_FILL);
    // trait d'encre : lignes épaissies par décalage d'un demi-pixel (lineWidth > 1 n'est pas garanti)
    gl.uniform1f(U.lit, 0); gl.depthMask(false);
    const px = 0.55 * dpr, offs = [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px]];
    const stroke = (list, rgba, alpha = (p) => anim(p).a) => {
      gl.uniform4f(U.ink, ...rgba);
      for (const p of list) if (p.S.n) {
        const m = anim(p); bind(p.S); gl.uniform1f(U.dy, m.dy); gl.uniform1f(U.a, alpha(p));
        for (const [ox, oy] of offs) { gl.uniform2f(U.off, ox * 2 / W, oy * 2 / H); gl.drawArrays(gl.LINES, 0, p.S.n); }
      }
    };
    stroke(built.filter(p => !p.lines), [...C.ink, 0.92]);
    stroke(built.filter(p => p.lines), [...C.ink, 0.5]);
    stroke(ghost, [...C.ink, 0.22], () => 1);   // ce qui vient : en pointillé fantôme
    gl.depthMask(true);
    if (st.t0 && el < total) st.raf = requestAnimationFrame(draw); else { st.t0 = 0; st.raf = 0; st.swing = false; st.from = st.L; }
  }
  const kick = (animate) => { cancelAnimationFrame(st.raf); st.t0 = animate ? performance.now() : 0; st.raf = requestAnimationFrame(draw); };

  // Glisser horizontalement pour tourner la maison ; le défilement vertical reste au conteneur.
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => { drag = { x: ev.clientX, yaw: st.yaw }; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointermove', (ev) => { if (!drag) return; st.yaw = Math.max(-0.4, Math.min(1.5, drag.yaw + (ev.clientX - drag.x) / 90)); if (!st.raf) st.raf = requestAnimationFrame((n) => { st.raf = 0; draw(n); }); });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); live = null; canvas.remove(); if (st.svg) st.svg.style.display = ''; st.container.dataset.house3d = 'svg:contexte-perdu'; });

  live = {
    key, gl, canvas,
    stop() { cancelAnimationFrame(st.raf); st.raf = 0; },
    attach(c, s) { st.container = c; st.svg = s; if (s) s.style.display = 'none'; c.dataset.house3d = 'webgl'; c.dataset.level = String(st.L); canvas.setAttribute('aria-label', label || `Maison en volume, niveau ${st.L} sur 6`); },
    set(l, cr) { const changed = l !== st.L || cr !== st.crane; st.from = Math.min(st.L, l); st.L = l; st.crane = cr; seen.set(key, l); live.attach(st.container, st.svg); if (changed) kick(true); else kick(false); },
  };
  container.prepend(canvas);
  live.attach(container, svg);
  kick(true);
  return true;
}
