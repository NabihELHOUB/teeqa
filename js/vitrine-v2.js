// Vitrine TEEQA, 13 nov. 2026 (v2) : les cinq sections refaites d'après les enregistrements d'écran de Nabih (css/vitrine-v2.css).

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/* ---------- 1. Ouverture : la scène suit la souris, et on peut la faire pivoter en la tenant ---------- */
{
  const boite = document.querySelector('.monde'), scene = document.getElementById('scene25'), plateau = scene && scene.querySelector('.plateau');
  if (boite && plateau) {
    let cx = 0, cy = 0, vx = 0, vy = 0, tx = 0, ty = 0, tient = false, x0 = 0, y0 = 0, dx = 0, dy = 0, vu = true;
    const poser = () => { plateau.style.setProperty('--ry', vx.toFixed(2) + 'deg'); plateau.style.setProperty('--rx', vy.toFixed(2) + 'deg'); };
    const boucle = () => {
      // Sans rien tenir : la scène penche un peu vers la souris. En tenant : elle suit le geste, puis revient doucement.
      const bx = tient ? clamp(dx * 0.11, -26, 26) : tx * 7, by = tient ? clamp(-dy * 0.07, -14, 14) : -ty * 4;
      vx += (bx - vx) * 0.09; vy += (by - vy) * 0.09; poser();
      if (vu) requestAnimationFrame(boucle);
    };
    if (!calme) {
      scene.addEventListener('pointermove', (e) => { const r = scene.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * 2 - 1; ty = (e.clientY - r.top) / r.height * 2 - 1; if (tient) { dx = e.clientX - x0; dy = e.clientY - y0; } });
      scene.addEventListener('pointerdown', (e) => { if (e.target.closest('a, button')) return; tient = true; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; boite.classList.add('tient'); });
      const lache = () => { tient = false; boite.classList.remove('tient'); };
      addEventListener('pointerup', lache); addEventListener('pointercancel', lache); scene.addEventListener('pointerleave', () => { tx = ty = 0; });
      new IntersectionObserver(([o]) => { const avant = vu; vu = o.isIntersecting; if (vu && !avant) requestAnimationFrame(boucle); }).observe(boite);
      requestAnimationFrame(boucle);
    }
  }
}

/* ---------- 2. La maison qui monte, étape par étape ---------- */
{
  const ETAPES = [
    ['Terrassement et fondations', 'Le sol est préparé, les fondations coulées.'],
    ['Gros œuvre : murs et poteaux', 'Les murs montent, les poteaux sont coulés.'],
    ['Dalle et toiture-terrasse', 'La maison est couverte.'],
    ['Menuiseries et réseaux', 'Portes, fenêtres, électricité, plomberie.'],
    ['Enduits et zellige', 'Les finitions des murs et des sols.'],
    ['Finitions et remise des clés', 'Le rapport final est signé.'],
  ];
  const IMG = ['etape-1-fondations', 'etape-2-gros-oeuvre', 'etape-3-dalle-toiture', 'etape-4-menuiseries-reseaux', 'etape-5-enduits-zellige', 'etape-6-finitions-cles'];
  const vue = document.getElementById('maisonVue'), rail = document.getElementById('maisonRail'), fiche = document.getElementById('maisonFiche');
  if (vue && rail && fiche) {
    rail.innerHTML = ETAPES.map(([t], i) => `<li><button type="button" data-i="${i}" aria-pressed="false"><i>${i + 1}</i><span>${t}</span></button></li>`).join('');
    const boutons = [...rail.querySelectorAll('button')];
    let n = -1, auto = null;
    const montrer = (i) => {
      if (i === n) return; n = i;
      // La maison à cette étape : la grande image en pâte d'argile de l'étape (les mêmes que dans l'appli), pas un dessin au trait.
      // v3.8 (Nabih, 18 h 51 : « comme une sélection de personnages ») : les six maisons sont sur un carrousel. L'étape choisie est
      // devant ; la précédente recule en fond à gauche, la suivante attend en fond à droite. À la première, rien à gauche ; à la
      // dernière, rien à droite.
      if (!vue.children.length) vue.innerHTML = IMG.map((m, k) => `<img data-k="${k}" src="assets/etapes/${m}.webp" alt="">`).join('');
      // v3.14 (Nabih, 21 h 11 : « au moment de l'échange, il faut pas que les deux se touchent ») : celle qui part recule d'abord,
      // celle qui arrive ne descend qu'ensuite (classes sort / entre, délais dans css/vitrine-v3.css).
      [...vue.children].forEach((im, k) => { const d = Math.max(-2, Math.min(2, k - i)); im.classList.toggle('sort', im.dataset.d === '0' && d !== 0); im.classList.toggle('entre', d === 0 && im.dataset.d !== undefined && im.dataset.d !== '0'); im.dataset.d = d; im.alt = d === 0 ? `La maison à l'étape ${i + 1} sur 6 : ${ETAPES[i][0]}` : ''; });
      vue.classList.remove('change'); void vue.offsetWidth; vue.classList.add('change');
      boutons.forEach((b, k) => { b.classList.toggle('fait', k < i); b.classList.toggle('ici', k === i); b.setAttribute('aria-pressed', k === i); });
      rail.style.setProperty('--p', (i / 5).toFixed(3));
      document.dispatchEvent(new CustomEvent('maison:etape', { detail: i }));   // v3 : la fête de la sixième étape (js/vitrine-v3.js)
      fiche.innerHTML = `<i>${i + 1}</i><span><small>Étape ${i + 1} sur 6 · vérifiée sur place</small><b>${ETAPES[i][0]}</b><span>${ETAPES[i][1]}</span></span>`;
    };
    const arret = () => { clearInterval(auto); auto = null; };
    boutons.forEach((b) => { b.addEventListener('click', () => { arret(); montrer(+b.dataset.i); }); b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { arret(); montrer(+b.dataset.i); } }); });
    montrer(0);
    // Tant qu'on n'y touche pas, la maison monte toute seule quand la section est à l'écran.
    const scene = vue.closest('.maison-scene');
    // v3 (Nabih) : plus rapide ; après la sixième étape et sa fête, la maison recommence.
    let repos = 0;
    if (!calme) new IntersectionObserver(([o]) => { if (o.isIntersecting && !auto) auto = setInterval(() => { if (n >= 5) { if (++repos < 2) return; repos = 0; return montrer(0); } montrer(n + 1); }, 3200);   /* v3.9 (Nabih : « c'était rapide, ça m'a fait mal aux yeux ») : on prend son temps */ else if (!o.isIntersecting) arret(); }, { threshold: 0.5 }).observe(scene);
    else montrer(5);
    if (!calme) scene.addEventListener('pointermove', (e) => { const r = scene.getBoundingClientRect(); vue.style.setProperty('--my', (-14 + ((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(1) + 'deg'); vue.style.setProperty('--mx', (6 - ((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1) + 'deg'); });
  }
}

/* ---------- 3. Comment ça marche : la ligne se remplit et les cartes s'allument au défilement ---------- */
{
  const liste = document.getElementById('commentListe');
  if (liste) {
    const cartes = [...liste.children];
    const maj = () => {
      const r = liste.getBoundingClientRect(), repere = innerHeight * 0.62;
      liste.style.setProperty('--p', clamp((repere - r.top) / r.height, 0, 1).toFixed(4));
      cartes.forEach((c) => { const b = c.getBoundingClientRect(); c.classList.toggle('vu', b.top + 50 < repere || calme); });
      // v3.14 : la scène sous le titre montre l'étape la plus avancée allumée.
      const sc = document.getElementById('commentScene');
      if (sc) {
        const k = Math.max(0, cartes.filter((c) => c.classList.contains('vu')).length - 1);
        if (sc.dataset.k !== String(k)) {
          sc.dataset.k = k;
          sc.querySelectorAll('img').forEach((im) => im.classList.toggle('on', +im.dataset.k === k));
          sc.querySelector('b').textContent = String(k + 1).padStart(2, '0');
        }
      }
    };
    addEventListener('scroll', maj, { passive: true }); addEventListener('resize', maj); maj();
  }
}

/* ---------- 4. L'étagère : on prend un téléphone, il vient devant ---------- */
{
  const ECRANS = [
    ['H01-chemin-avant', 'Le chemin du chantier', 'Six étapes, six pastilles de zellige. On voit d\'un coup d\'œil où en est la maison.'],
    ['H02a-entreprise-en-cours', 'L\'entreprise déclare', 'À la fin d\'une étape, l\'entreprise déclare les travaux terminés.'],
    ['H03b-client-avis-attendu', 'La visite est demandée', 'Vous êtes prévenu : un contrôleur indépendant va passer sur place.'],
    ['H04-controleur-photo', 'Les photos sur place', 'Le contrôleur photographie le chantier. Chaque photo est datée et localisée.'],
    ['H05e-avis-signe-vide', 'L\'avis est signé', 'Le contrôleur signe son avis : validé, validé avec réserves, ou refusé.'],
    ['H06a-client-en-clair', 'En clair, pour vous', 'Une recommandation simple : paiement recommandé, ou paiement différé.'],
    ['H06b-client-decision', 'Vous décidez', 'Payer ou attendre : la décision vous appartient. Le paiement se fait hors de TEEQA.'],
    ['H07-chemin-apres', 'L\'étape est validée', 'La pastille passe au vert, le chemin avance jusqu\'à l\'étape suivante.'],
  ];
  const zone = document.getElementById('etagere'), mur = document.getElementById('etagMur'), fil = document.getElementById('etagFil');
  if (zone && mur && fil) {
    const src = (k) => `assets/video/hybride/ecrans/${ECRANS[k][0]}.png`;
    const tel = (k) => `<button type="button" class="etag-tel" data-k="${k}" aria-label="${k + 1}. ${ECRANS[k][1]}"><em>${k + 1}. ${ECRANS[k][1]}</em><span class="ecran"><img src="${src(k)}" alt="" loading="lazy" decoding="async"></span></button>`;
    mur.innerHTML = `<div class="etag-rang">${[0, 1, 2, 3].map(tel).join('')}</div><div class="etag-rang">${[4, 5, 6, 7].map(tel).join('')}</div>
      <div class="etag-vedette" id="etagVedette" aria-live="polite"><div class="texte"><small></small><b></b><p></p></div>
        <div class="grand"><span class="ecran"><img alt=""></span><span class="pastille">Écran réel</span></div>
        <div class="cote"><button type="button" data-v="suiv">Écran suivant →</button><button type="button" class="clair" data-v="ferme">Reposer</button></div></div>`;
    fil.innerHTML = ECRANS.map((e, k) => `<li><button type="button" data-k="${k}" aria-pressed="false">${e[1]}</button></li>`).join('');
    const tels = [...mur.querySelectorAll('.etag-tel')], puces = [...fil.querySelectorAll('button')], ved = document.getElementById('etagVedette');
    const grand = ved.querySelector('.grand'), image = grand.querySelector('img');
    let ouvert = -1;
    const fermer = () => { if (ouvert < 0) return; const t = tels[ouvert]; ouvert = -1; zone.classList.remove('ouvert', 'pose'); tels.forEach((x) => x.classList.remove('choisi')); puces.forEach((p) => p.setAttribute('aria-pressed', 'false')); t.focus({ preventScroll: true }); };
    const ouvrir = (k) => {
      const de = tels[k].querySelector('.ecran').getBoundingClientRect();
      ouvert = k; image.src = src(k); image.alt = ECRANS[k][1];
      ved.querySelector('small').textContent = `Écran ${k + 1} sur ${ECRANS.length}`; ved.querySelector('b').textContent = ECRANS[k][1]; ved.querySelector('p').textContent = ECRANS[k][2];
      tels.forEach((x, i) => x.classList.toggle('choisi', i === k)); puces.forEach((p, i) => p.setAttribute('aria-pressed', i === k));
      zone.classList.remove('pose'); zone.classList.add('ouvert');
      // Le grand téléphone part de la place du petit (même image), puis vient devant.
      const a = grand.getBoundingClientRect();
      if (!calme && grand.animate) grand.animate([{ transform: `translate(${(de.left + de.width / 2 - a.left - a.width / 2).toFixed(1)}px, ${(de.top + de.height / 2 - a.top - a.height / 2).toFixed(1)}px) scale(${(de.width / a.width).toFixed(4)})` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.2,1)' });
      requestAnimationFrame(() => zone.classList.add('pose'));
    };
    tels.forEach((t) => t.addEventListener('click', () => ouvrir(+t.dataset.k)));
    puces.forEach((p) => p.addEventListener('click', () => ouvrir(+p.dataset.k)));
    ved.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.v === 'ferme') fermer(); else ouvrir((ouvert + 1) % ECRANS.length); });
    addEventListener('keydown', (e) => { if (ouvert < 0) return; if (e.key === 'Escape') fermer(); if (e.key === 'ArrowRight') ouvrir((ouvert + 1) % ECRANS.length); if (e.key === 'ArrowLeft') ouvrir((ouvert + ECRANS.length - 1) % ECRANS.length); });
  }
}

/* ---------- 5. Témoignages : trois voix, une par rôle ---------- */
{
  const cadre = document.getElementById('temoinsCadre');
  if (cadre) {
    const fiches = [...cadre.querySelectorAll('.temoin')], points = [...cadre.querySelectorAll('.temoins-points button')];
    let n = 0, auto = null;
    const montrer = (i) => { n = (i + fiches.length) % fiches.length; fiches.forEach((f, k) => f.classList.toggle('actif', k === n)); points.forEach((p, k) => p.setAttribute('aria-pressed', k === n)); };
    points.forEach((p, k) => p.addEventListener('click', () => { clearInterval(auto); auto = null; montrer(k); }));
    montrer(0);
    if (!calme) new IntersectionObserver(([o]) => { if (o.isIntersecting && !auto) auto = setInterval(() => montrer(n + 1), 4200); else if (!o.isIntersecting) { clearInterval(auto); auto = null; } }, { threshold: 0.4 }).observe(cadre);
  }
}
