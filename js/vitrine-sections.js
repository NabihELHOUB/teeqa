// Vitrine TEEQA, 13 nov. 2026 : animations des sections « Fondu » et « Confiance » (références Mobbin de Nabih).
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const visibles = new WeakMap();
const veille = new IntersectionObserver((es) => es.forEach((e) => visibles.set(e.target, e.isIntersecting)), { rootMargin: '120px' });

/* ---------- Fondu : les très grands titres s'allument en montant ---------- */
const fondu = document.getElementById('fondu');
if (fondu) {
  const lignes = [...fondu.querySelectorAll('.geant span'), fondu.querySelector('.fondu-sous')];
  const poser = () => lignes.forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--v', calme ? 1 : clamp((innerHeight * 0.95 - r.top) / (innerHeight * 0.32)).toFixed(3));
  });
  addEventListener('scroll', poser, { passive: true }); addEventListener('resize', poser); poser();
}

/* ---------- Petites étoiles de zellige (8 branches) ---------- */
function etoile(c, x, y, r, rot = 0) {
  c.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = rot + (i * Math.PI) / 8, k = i % 2 ? r * 0.56 : r;
    c.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  c.closePath(); c.fill();
}

/* ---------- Confiance : des familles apparaissent dans un tourbillon de zelliges ---------- */
// Familles INVENTÉES pour la maquette : à remplacer par de vrais témoignages avant la mise en ligne.
const familles = [
  { n: 'Samira B.', v: 'Lyon → Nador', c: '#1F7A5C', q: "J'ai vu ma dalle coulée sans prendre l'avion." },
  { n: 'Youssef & Inès', v: 'Bruxelles → Agadir', c: '#B07A1E' },
  { n: 'Karim T.', v: 'Montréal → Fès', c: '#C4623A', q: 'Je paie quand le contrôleur a signé. Point.' },
  { n: 'Nadia E.', v: 'Paris → Tanger', c: '#14503F' },
  { n: 'Hamid A.', v: 'Marseille → Oujda', c: '#8A5A12', q: 'Mon père n’a plus besoin d’aller sur le chantier.' },
  { n: 'Leïla M.', v: 'Lille → Marrakech', c: '#1F7A5C' },
  { n: 'Rachid O.', v: 'Toulouse → Meknès', c: '#C4623A' },
  { n: 'Fatima Z.', v: 'Bordeaux → Tétouan', c: '#14503F', q: 'Les photos arrivent même quand il n’y a pas de réseau là-bas.' },
];
// Places autour du titre (en % de la scène). Les bulles de citation vont plutôt sur les côtés.
const placesLarges = [[5, 9], [78, 7], [2, 42], [84, 38], [6, 68], [80, 66], [22, 86], [62, 88]];
const placesEtroites = [[4, 78], [48, 86], [6, 91], [46, 79]];
const scene = document.getElementById('confScene'), toile = document.getElementById('confPoussiere');
if (scene && toile) {
  veille.observe(scene);
  const c = toile.getContext('2d');
  const couleurs = ['#E2A33B', '#1F7A5C', '#0E3B31', '#C4623A', '#F2B84E'];
  let grains = [], L = 0, H = 0, dpr = 1;
  // v3.6 (Nabih : « ça coupe, on voit que c'est deux trucs différents ») : la toile déborde de la scène (OX, OY de chaque côté) pour
  // que les cercles des familles du bord s'étendent en entier, au-dessus des sections voisines, au lieu d'être coupés net.
  const OX = 90, OY = 300;
  const taille = () => { dpr = Math.min(2, devicePixelRatio || 1); L = scene.clientWidth + 2 * OX; H = scene.clientHeight + 2 * OY; toile.width = L * dpr; toile.height = H * dpr; };
  new ResizeObserver(taille).observe(scene); taille();

  // v3.1 (Nabih, d'après son enregistrement « 1000+ creators ») : ni étoiles qui volent, ni explosion. Une nappe de tout petits
  // carreaux pâles, alignés sur une grille, s'étend en vague autour de l'avatar (partie de sous la bulle) puis se dissout.
  // Large, mais légère : on lit toujours le texte à travers.
  const GRILLE = 7;
  const tourbillon = (x, y, entre) => {
    if (calme) return;
    if (grains.length > 6) grains.shift();
    grains.push({ x, y, t: 0, d: entre ? 1.5 : 1.1, r: entre ? 300 : 200, ep: entre ? 90 : 70, graine: Math.random() * 1000, entre,
      c: couleurs[Math.floor(Math.random() * couleurs.length)] });
  };
  // Bruit fixe par carreau (le même carreau s'allume toujours de la même façon pendant la vague : pas de scintillement).
  const hasard = (i, j, g) => { const v = Math.sin(i * 127.1 + j * 311.7 + g * 74.7) * 43758.5453; return v - Math.floor(v); };

  const avas = familles.map((f) => {
    const el = document.createElement('div');
    el.className = 'conf-ava';
    const ini = f.n.split(/[ &]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('');
    el.innerHTML = `<i style="background:${f.c}">${ini}</i><div><b>${f.n}</b><small>${f.v}</small>${f.q ? `<q>${f.q}</q>` : ''}</div>`;
    el.setAttribute('aria-hidden', 'true');
    scene.appendChild(el);
    return el;
  });

  // v3 (Nabih) : une bulle ne doit jamais cacher le grand titre, quelle que soit la largeur. On mesure la zone du texte et on
  // n'accepte une place que si la carte de la famille, posée là, ne la touche pas (sinon on en essaie une autre, ou on attend).
  const PLACES = [[3, 6], [80, 5], [2, 30], [84, 28], [2, 56], [84, 56], [4, 82], [76, 84], [36, 92], [60, 2], [22, 2]];
  const libres = () => PLACES;
  const interdit = () => { const s = scene.getBoundingClientRect(); return ['.conf-h', '.conf-sous', '.conf-cta', '.conf-points'].map((q) => scene.querySelector(q)).filter(Boolean)
    .map((e) => { const r = e.getBoundingClientRect(); return { l: r.left - s.left - 16, t: r.top - s.top - 12, r: r.right - s.left + 16, b: r.bottom - s.top + 12 }; }); };
  const touche = (el) => { const s = scene.getBoundingClientRect(), r = el.getBoundingClientRect(), b = { l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top };
    return b.l < 0 || b.r > s.width || b.t < 0 || b.b > s.height || interdit().some((z) => b.l < z.r && z.l < b.r && b.t < z.b && z.t < b.b) || montres.some((m) => { const o = m.el.getBoundingClientRect(); return r.left < o.right + 10 && o.left < r.right + 10 && r.top < o.bottom + 10 && o.top < r.bottom + 10; }); };
  let montres = [], k = 0;
  const centre = (el) => { const r = el.querySelector('i').getBoundingClientRect(), s = scene.getBoundingClientRect(); return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2]; };
  const suivant = () => {
    if (!visibles.get(scene) && montres.length >= 3) return;
    const places = libres(), max = innerWidth < 760 ? 2 : 5;
    if (montres.length >= max) {
      const { el } = montres.shift();
      tourbillon(...centre(el), false); el.classList.remove('on');
    }
    const prises = montres.map((m) => m.p);
    const el = avas[k % avas.length];
    let p = -1;
    for (let essai = 0; essai < places.length; essai++) {
      const q = (k * 3 + essai) % places.length; if (prises.includes(q)) continue;
      const [x, y] = places[q];
      el.style.left = x + '%'; el.style.top = y + '%';
      // La bulle de citation passe à gauche quand l'avatar est sur le bord droit.
      el.style.flexDirection = x > 60 ? 'row-reverse' : ''; el.querySelector('div').style.textAlign = x > 60 ? 'right' : 'left';
      // v3.5 (Nabih : « c'est coupé ») : on mesure la bulle à sa vraie taille, sans la transition d'apparition (qui faisait mesurer une
      // bulle encore rétrécie, donc acceptée trop près du bord), et elle doit aussi tenir dans la fenêtre avec une marge.
      el.style.transition = 'none'; el.style.scale = '1'; const rr = el.getBoundingClientRect(); const ok = !touche(el) && rr.left > 12 && rr.right < document.documentElement.clientWidth - 12; el.style.scale = ''; el.offsetWidth; el.style.transition = '';
      if (ok) { p = q; break; }
    }
    if (p < 0) { k++; return; }
    requestAnimationFrame(() => { el.classList.add('on'); tourbillon(...centre(el), true); });
    montres.push({ el, p }); k++;
  };
  for (let i = 0; i < (innerWidth < 760 ? 2 : 4); i++) setTimeout(suivant, 300 + i * 450);
  setInterval(suivant, 1900);

  let avant = performance.now();
  const anim = (now) => {
    const dt = Math.min(0.05, (now - avant) / 1000); avant = now;
    // v3.8 (Nabih, 18 h 51 : « pourquoi c'est bugué ? ») : la toile déborde de la scène ; quand la scène sortait de l'écran, la vague
    // en cours restait figée, à moitié dessinée, par-dessus la section voisine. Maintenant la vague finit toujours (le temps avance
    // même hors écran) et la toile est effacée dès qu'elle n'a plus rien à montrer.
    if (!visibles.get(scene)) { if (grains.length || c._sale) { grains = []; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, toile.width, toile.height); c._sale = false; } }
    else if (grains.length || c._sale) {
      c.setTransform(dpr, 0, 0, dpr, OX * dpr, OY * dpr); c.clearRect(-OX, -OY, L, H);
      grains = grains.filter((g) => {
        g.t += dt; const p = clamp(g.t / g.d);
        const e = 1 - Math.pow(1 - p, 2.4), R = 24 + g.r * e, ep = g.ep * (0.6 + 0.6 * e), fade = 1 - p;
        const i0 = Math.floor((g.x - R - 4) / GRILLE), i1 = Math.ceil((g.x + R + 4) / GRILLE), j0 = Math.floor((g.y - R - 4) / GRILLE), j1 = Math.ceil((g.y + R + 4) / GRILLE);
        c.fillStyle = g.c;
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
          const cx = i * GRILLE + GRILLE / 2, cy = j * GRILLE + GRILLE / 2, dd = Math.hypot(cx - g.x, (cy - g.y) * 1.15);
          const bande = 1 - Math.abs(dd - (R - ep / 2)) / (ep / 2); if (bande <= 0) continue;
          const h = hasard(i, j, g.graine); if (h > bande * 0.95) continue;
          c.globalAlpha = bande * fade * (0.42 + 0.45 * h);
          c.fillRect(cx - 2.1, cy - 2.1, 4.2, 4.2);
        }
        return p < 1;
      });
      c.globalAlpha = 1; c._sale = grains.length > 0;
    }
    requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);
}

/* ---------- Bande de motifs : du blanc au vert, en étoiles de zellige ---------- */
// Même principe que le dégradé « pixelisé » de la référence (tramage ordonné) mais avec nos étoiles,
// et une vague lente qui fait respirer la limite.
const bande = document.querySelector('.motif'), mt = document.getElementById('motifToile');
if (bande && mt) {
  veille.observe(bande);
  const c = mt.getContext('2d');
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  let L = 0, H = 0, dpr = 1;
  const taille = () => { dpr = Math.min(2, devicePixelRatio || 1); L = bande.clientWidth; H = bande.clientHeight; mt.width = L * dpr; mt.height = H * dpr; };
  new ResizeObserver(taille).observe(bande); taille();
  const dessiner = (t) => {
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, L, H);
    const pas = L < 700 ? 13 : 16;
    // v3.7 (Nabih : « ça aussi il faut que ça se voie animé, de droite à gauche ») : toute la nappe d'étoiles glisse lentement vers la
    // gauche, en sens inverse du bandeau de zellige juste en dessous. Les carreaux gardent leur identité (indices « du monde »).
    const glisse = t * 18, k0 = Math.floor(glisse / pas), dx = glisse - k0 * pas;
    for (let j = 0, y = pas / 2; y < H; j++, y += pas) {
      const v = y / H;
      for (let i0 = 0, x = pas / 2 - dx; x < L + pas; i0++, x += pas) { const i = i0 + k0;
        const vague = 0.11 * Math.sin(x * 0.005 + t * 0.16) + 0.06 * Math.sin(x * 0.011 - t * 0.12 + v * 2) + 0.03 * Math.sin(x * 0.02 + t * 0.21);
        const f = v * 1.55 - 0.42 + vague;
        const seuil = bayer[(j % 4) * 4 + (i % 4)];
        if (f < seuil) continue;
        const force = clamp((f - seuil) * 2.2);
        // Haut : poussière safran ; milieu : vert zellige ; bas : vert Fès, avec quelques étoiles chaux qui scintillent.
        let col = v < 0.42 ? '#E2A33B' : v < 0.62 ? '#C99A3E' : v < 0.78 ? '#1F7A5C' : '#0E3B31';
        if (v > 0.8 && (i * 7 + j * 13) % 23 === 0) { col = '#F1ECE2'; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.6 + i + j); } else c.globalAlpha = 0.35 + 0.65 * force;
        c.fillStyle = col;
        etoile(c, x, y, pas * (0.18 + 0.32 * force), (i + j) % 2 ? Math.PI / 8 : 0);
      }
    }
    c.globalAlpha = 1;
  };
  const anim = (now) => { if (visibles.get(bande)) dessiner(now / 1000); requestAnimationFrame(anim); };
  if (calme) { dessiner(0); new ResizeObserver(() => dessiner(0)).observe(bande); } else requestAnimationFrame(anim);
}
