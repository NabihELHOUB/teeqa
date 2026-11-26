// Vitrine TEEQA, 13 nov. 2026 (v3) : retours de Nabih sur la v2, section par section. Styles : css/vitrine-v3.css.
// Rien ne bouge si « Réduire les animations » est activé ; tout se recalcule quand la fenêtre change de taille.
import { bellarejRig } from './bellarej-rig.js';

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ETOILE = 'M0-10 2.3-5.5 7.1-7.1 5.5-2.3 10 0 5.5 2.3 7.1 7.1 2.3 5.5 0 10-2.3 5.5-7.1 7.1-5.5 2.3-10 0-5.5-2.3-7.1-7.1-2.3-5.5Z';
const etoileSVG = (cls = '') => `<svg class="${cls}" viewBox="-10 -10 20 20" aria-hidden="true"><path d="${ETOILE}" fill="currentColor"/></svg>`;
const visible = new WeakMap();
const veille = new IntersectionObserver((es) => es.forEach((e) => { visible.set(e.target, e.isIntersecting); e.target.dispatchEvent(new CustomEvent(e.isIntersecting ? 'vu' : 'cache')); }), { rootMargin: '80px' });

/* ---------- 1. Ouverture ---------- */
{
  const monde = $('.monde'), plateau = $('.monde .plateau');
  // Plus de lueur au sol (sous la flèche, rougeâtre sous le Maroc).
  const sol = $('.monde .sol'); if (sol) sol.remove();

  // La flèche part toujours de la France et pointe toujours le Maroc, quelle que soit la taille de l'écran : on la redessine
  // à partir de la place réelle des deux pays (coordonnées du plateau, sans ses rotations).
  const svg = $('.monde .fleche'), fr = $('.monde .pays.fr'), ma = $('.monde .pays.ma'), milieu = $$('.monde .plateau > .objet').find((o) => !o.classList.contains('loin') && /etape-2/.test(o.innerHTML));
  const tracer = () => {
    if (!svg || !fr || !ma) return;
    const W = plateau.offsetWidth, H = plateau.offsetHeight;
    const a = { x: fr.offsetLeft, y: fr.offsetTop, w: fr.offsetWidth, h: fr.offsetHeight }, b = { x: ma.offsetLeft, y: ma.offsetTop, w: ma.offsetWidth, h: ma.offsetHeight };
    // Départ : l'est de la France (vers Lyon) ; arrivée : le nord du Maroc, juste à gauche de la maison posée dessus.
    const S = [a.x + a.w * 0.8, a.y + a.h * 0.56], E = [b.x + b.w * 0.2, b.y + b.h * 0.42];
    // Hauteur de l'arc : assez pour être une belle courbe, jamais au-dessus du plateau (sinon elle passe sur le texte).
    const d = E[0] - S[0], haut = Math.min(Math.max(H * 0.34, d * 0.32), (Math.min(S[1], E[1]) - H * 0.04) / 0.75);
    const C1 = [S[0] + d * 0.22, S[1] - haut], C2 = [E[0] - d * 0.2, E[1] - haut * 0.95];
    const courbe = `M${S[0].toFixed(1)} ${S[1].toFixed(1)} C ${C1[0].toFixed(1)} ${C1[1].toFixed(1)}, ${C2[0].toFixed(1)} ${C2[1].toFixed(1)}, ${E[0].toFixed(1)} ${E[1].toFixed(1)}`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
    $$('.fl-trace, .fl-pts', svg).forEach((p) => p.setAttribute('d', courbe));
    // Pointe : deux traits dans le sens d'arrivée de la courbe.
    const ang = Math.atan2(E[1] - C2[1], E[0] - C2[0]), L = clamp(W * 0.035, 22, 46);
    const pt = (da) => `${(E[0] - L * Math.cos(ang + da)).toFixed(1)} ${(E[1] - L * Math.sin(ang + da)).toFixed(1)}`;
    $$('.fl-pointe path', svg).forEach((p) => p.setAttribute('d', `M${pt(0.55)} L${E[0].toFixed(1)} ${E[1].toFixed(1)} L${pt(-0.55)}`));
    svg.style.setProperty('--ep', clamp(W / 82, 9, 15).toFixed(1) + 'px');
    // L'étape 2 en volume reste posée au sommet de la flèche.
    if (milieu) { const m = [0.125 * S[0] + 0.375 * C1[0] + 0.375 * C2[0] + 0.125 * E[0], 0.125 * S[1] + 0.375 * C1[1] + 0.375 * C2[1] + 0.125 * E[1]];
      milieu.style.marginTop = '0'; milieu.style.transform = 'translateZ(40px)';
      const bas = Math.max(S[1], E[1]) - milieu.offsetHeight * 0.55;   // v3.2 : sous la flèche, entre les deux pays
      milieu.style.left = (m[0] - milieu.offsetWidth / 2).toFixed(1) + 'px'; milieu.style.top = bas.toFixed(1) + 'px'; }
  };
  if (plateau) { new ResizeObserver(tracer).observe(plateau); $$('.monde .pays img').forEach((i) => i.complete || i.addEventListener('load', tracer)); tracer(); }

  // v3.2 (Nabih) : le chemin de l'appli, couché de gauche à droite et en zigzag (comme dans l'appli, qui va de gauche à droite en
  // descendant), plus grand, et qui sort de la page des deux côtés. Pastilles, dalles et anneau sont ceux de l'appli
  // (photographiés par vitrine-pieces.mjs, assets/vitrine/chemin/) : quatre pastilles validées, la cinquième en cours avec son
  // anneau posé au sol qui se remplit, puis les dalles des étapes à venir, plus pâles. Bellarej le longe, vu d'en haut.
  const chemin = $('#mondeChemin');
  if (chemin) {
    const DOS = 'assets/vitrine/chemin/';
    const ANNEAU = 'M55 18.2 a50 40 0 1 1 -0.01 0';
    // v3.4 (Nabih : « il ressemble pas à notre Bellarej… refais-moi une vraie animation ») : c'est le MARCHEUR du film de lancement
    // (js/video-hybride.js), le Bellarej que Nabih a validé, vu d'un peu au-dessus, avec la même démarche : la patte posée reste
    // à sa place sur le sol pendant que le corps passe au-dessus, puis se lève et repart devant ; le corps se dandine, la tête
    // compense. Il marche SUR le chemin (il suit la courbe des dalles d'une pastille à l'autre), tourné vers la droite.
    const MARCHEUR = `<svg viewBox="0 0 120 140" aria-hidden="true"><defs>
      <radialGradient id="mkVolCorps" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#F6F0E2"/><stop offset=".85" stop-color="#DCCFB6"/><stop offset="1" stop-color="#C9BB9F"/></radialGradient>
      <radialGradient id="mkVolTete" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F7F2E6"/><stop offset=".88" stop-color="#DED2BA"/><stop offset="1" stop-color="#CDBFA4"/></radialGradient>
      <radialGradient id="mkVolCol" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#2A7A5E"/><stop offset="1" stop-color="#0E3B31"/></radialGradient></defs>
      <ellipse cx="60" cy="126" rx="34" ry="10" fill="#03140F" opacity=".28"/>
      <g class="mk-corps">
        <g class="mk-pg"><ellipse cx="46" cy="121" rx="9" ry="6" fill="#EE9140"/></g><g class="mk-pd"><ellipse cx="74" cy="121" rx="9" ry="6" fill="#C96F2A"/></g>
        <path class="mk-queue" d="M36 66 L27 46 L44 56 L50 38 L60 54 L70 38 L76 56 L93 46 L84 66 Z" fill="#2B2D31"/>
        <ellipse cx="60" cy="90" rx="36" ry="29" fill="url(#mkVolCorps)" stroke="#D9CDB4" stroke-width="2"/>
        <ellipse cx="62" cy="80" rx="26" ry="9" fill="#8A7A5C" opacity=".22"/>
        <path d="M25 86 C21 102 30 115 44 117 C34 107 30 97 30 85 Z" fill="#2B2D31"/><path d="M95 86 C99 102 90 115 76 117 C86 107 90 97 90 85 Z" fill="#2B2D31"/>
        <ellipse cx="60" cy="76" rx="24" ry="9.5" fill="url(#mkVolCol)"/>
        <g class="mk-tete">
          <ellipse cx="60" cy="50" rx="30" ry="27" fill="url(#mkVolTete)" stroke="#D9CDB4" stroke-width="2"/>
          <ellipse cx="60" cy="39" rx="19" ry="11" fill="#fff" opacity=".75"/>
          <g class="mk-face" transform="translate(6 -8)"><g class="mk-og" transform="translate(1.5 0)"><ellipse cx="45" cy="60" rx="5" ry="6.5" fill="#2B2D31"/><circle cx="43.5" cy="58" r="1.8" fill="#fff"/></g><g class="mk-od" transform="translate(2 0) translate(75 60) scale(.62 1) translate(-75 -60)"><ellipse cx="75" cy="60" rx="5" ry="6.5" fill="#2B2D31"/><circle cx="73.5" cy="58" r="1.8" fill="#fff"/></g>
          <g class="mk-bec" transform="translate(60 67) rotate(-48) scale(.92 .68) translate(-60 -67)"><path d="M50 67 C54 63 66 63 70 67 C68 85 64 97 60 105 C56 97 52 85 50 67 Z" fill="#EE9140"/>
          <path d="M60 67 C62 83 61 95 60 105 C64 97 68 85 70 67 C66 64 62 64 60 67 Z" fill="#C96F2A" opacity=".55"/></g></g>
        </g>
      </g></svg>`;
    // v3.5 (Nabih, retour de 17 h 09) : le chemin raconte la validation, comme dans l'appli. Au départ, toutes les étapes à l'écran
    // sont grises et leurs dalles aussi ; la première est « en attente » (la pastille dorée). Bellarej arrive, monte dessus et
    // appuie de tout son corps : elle passe au vert, les dalles se posent une à une (tac-tac-tac-tac), la suivante devient « en
    // attente », il repart… jusqu'au bout. Il sort à droite, on attend un peu, tout redevient gris, et ça recommence.
    let L = 0, geo = null, plan = null;
    const VITESSE = 64, APPUI = 0.55, POSE = 0.13, ATTENTE_FIN = 2.2, PREP = 0.34, SAUT = 0.46, VAGUE = 0.11;
    const construire = () => {
      const W = chemin.clientWidth, H = chemin.clientHeight, large = W > 760;
      // v3.17 (Nabih, 14 nov. 9 h 07 : « ce bouton-là, il est jamais animé ») : la dernière pastille dépassait du bord droit, donc
      // Bellarej ne s'y arrêtait jamais. Les pastilles sont maintenant réparties pour que la première et la dernière tiennent
      // entièrement dans l'écran ; celles d'avant et d'après sont complètement dehors.
      const tc = large ? clamp(W * 0.062, 70, 92) : 54, td = large ? clamp(W * 0.022, 26, 34) : 18;
      const marge = tc * 0.8, pas0 = large ? Math.max(210, W / 6.2) : 128, nVis = Math.max(2, Math.floor((W - 2 * marge) / pas0) + 1);
      const pas = (W - 2 * marge) / (nVis - 1), amp = large ? 24 : 14, y0 = H * 0.42, x0 = marge;
      const n0 = -1, n1 = nVis;
      const P = (k) => [k * pas + x0, y0 + (k % 2 ? amp : -amp)];
      let h = '';
      for (let k = n0; k <= n1; k++) {
        const [x, y] = P(k), [x2, y2] = P(k + 1);
        if (k < n1) for (let j = 1; j <= 4; j++) { const f = j / 5, e = (1 - Math.cos(f * Math.PI)) / 2;
          h += `<img class="dalle" data-seg="${k}" data-j="${j}" src="${DOS}dalle-${(k * 4 + j + 30) % 3}.webp" alt="" style="left:${(x + (x2 - x) * f).toFixed(1)}px;top:${(y + (y2 - y) * e).toFixed(1)}px;width:${td}px">`; }
        h += `<span class="past" data-k="${k}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${tc}px"><img class="v" src="${DOS}pastille-validee.webp" alt=""><img class="e" src="${DOS}pastille-encours.webp" alt=""></span>`;
      }
      chemin.innerHTML = `<div class="rail">${h}</div><div class="oiseau">${MARCHEUR}</div>`;
      geo = { P, pas, x0 }; L = W;
      // Le scénario : les étapes entièrement visibles, et les temps où Bellarej y arrive, appuie, repart.
      const w0 = $('.oiseau', chemin).offsetWidth || 60;
      const ks = []; for (let k = n0; k <= n1; k++) { const x = P(k)[0]; if (x >= tc * 0.45 && x <= W - tc * 0.45) ks.push(k); }
      let t = 0, xc = -1.2 * w0; const etapes = [], marches = [];
      // v3.8 (Nabih, 18 h 51 : « il arrive, il se prépare, hop, il saute, bing ») : il s'arrête juste avant la pastille, se ramasse,
      // saute dessus en arc, et c'est en retombant de tout son poids qu'il l'enfonce et la valide.
      const ELAN = tc * 0.62;
      ks.forEach((k) => { const x = P(k)[0], xs = Math.max(xc, x - ELAN), d = (xs - xc) / VITESSE; marches.push([t, t + d, xc, xs]); t += d;
        const prep = t, saut = t + PREP, arrive = saut + SAUT, valide = arrive + 0.08, attenteSuivante = valide + 0.25 + 4 * POSE;
        etapes.push({ k, x, xs, prep, saut, arrive, valide, suite: attenteSuivante });
        t = attenteSuivante + 0.15; xc = x; });
      const xFin = W + 1.4 * w0; marches.push([t, t + (xFin - xc) / VITESSE, xc, xFin]); t += (xFin - xc) / VITESSE;
      // Fin de tour : les étapes s'éteignent une à une, de la dernière à la première (les dalles se soulèvent avec), puis la
      // première se rallume en « attente » avec son animation, et Bellarej revient.
      const reset = t + ATTENTE_FIN, nb = ks.length;
      plan = { ks, etapes, marches, reset, nb, duree: reset + nb * VAGUE + 0.9, pasts: $$('.past', chemin), dalles: $$('.dalle', chemin) };
    };
    new ResizeObserver(() => { if (chemin.clientWidth !== L) construire(); }).observe(chemin); construire();
    let t0 = performance.now(), actif = !calme, cap = 0, avantCap = performance.now();
    const etatPast = (k, t) => {
      const { ks, etapes, reset } = plan;
      if (k < ks[0]) return 'ok';
      const i = ks.indexOf(k); if (i < 0) return 'gris';
      if (t >= reset) return t >= reset + (plan.nb - 1 - i) * VAGUE ? 'gris' : 'ok';
      if (t >= etapes[i].valide) return 'ok';
      if (i === 0 || t >= etapes[i - 1].suite) return 'attente';
      return 'gris';
    };
    const poseeDalle = (seg, j, t) => {
      const { ks, etapes, reset } = plan;
      if (seg < ks[0]) return true;
      const i = ks.indexOf(seg); if (i < 0) return false;
      if (t >= reset) return t < reset + (plan.nb - 1 - i) * VAGUE - 0.04 * j;
      return t >= etapes[i].valide + 0.15 + (j - 1) * POSE;
    };
    const poser = (now) => {
      const mk = $('.oiseau', chemin); if (!mk || !geo || !plan) return;
      const t = calme ? plan.reset - 0.01 : ((now - t0) / 1000) % plan.duree;
      // États des pastilles et des dalles (on ne touche au DOM que quand ça change).
      plan.pasts.forEach((p) => { const e = etatPast(+p.dataset.k, t); if (p.dataset.s !== e) p.dataset.s = e; });
      plan.dalles.forEach((d) => { const v = poseeDalle(+d.dataset.seg, +d.dataset.j, t); if (d.classList.contains('posee') !== v) d.classList.toggle('posee', v); });
      // Où est Bellarej : en marche sur un tronçon, ou arrêté sur une pastille (il appuie dessus).
      let x, marche = false, D = 0, appui = 0, ramasse = 0, vol = 0, envol = 0, ici = null;
      const w0 = mk.offsetWidth, h0 = mk.offsetHeight, u = w0 / 120;
      for (const [a, b, xa, xb] of plan.marches) { if (t >= b) { D += xb - xa; continue; } if (t >= a) { const f = (t - a) / (b - a); x = xa + (xb - xa) * f; D += (xb - xa) * f; marche = true; } break; }
      if (x === undefined) { // à l'arrêt : sur la dernière pastille atteinte, ou sorti à droite
        const fin = plan.marches[plan.marches.length - 1]; if (t >= fin[1]) x = fin[3];
        else { const e = [...plan.etapes].reverse().find((q) => t >= q.prep) || plan.etapes[0]; ici = e;
          if (t < e.saut) { x = e.xs; const v = (t - e.prep) / PREP; ramasse = Math.sin(Math.min(1, v * 1.15) * Math.PI / 2); }      // il se ramasse
          else if (t < e.arrive) { const v = (t - e.saut) / SAUT, ev = v < .5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v);            // hop
            x = e.xs + (e.x - e.xs) * ev; vol = Math.sin(v * Math.PI); envol = 1 - v; ramasse = Math.max(0, 1 - v * 5) * 0.6; }
          else { x = e.x; const v = (t - e.arrive) / APPUI; appui = v > 0 && v < 1 ? Math.sin(Math.pow(v, .6) * Math.PI) : 0; } } }   // bing
      const kf = (x - geo.x0) / geo.pas, k = Math.floor(kf), f = kf - k, ya = geo.P(k)[1], yb = geo.P(k + 1)[1], y = ya + (yb - ya) * (1 - Math.cos(f * Math.PI)) / 2;
      mk.style.transform = `translate3d(${(x - w0 / 2).toFixed(1)}px,${(y - h0 * 0.86 + 2 - vol * h0 * 0.62).toFixed(1)}px,0)`;
      // La pastille s'enfonce sous son poids.
      plan.pasts.forEach((p) => { const sous = ici && +p.dataset.k === ici.k && appui > 0; const v = sous ? `${(1 + 0.05 * appui).toFixed(3)} ${(1 - 0.13 * appui).toFixed(3)}` : ''; if (p.style.scale !== v) p.style.scale = v; });
      // v3.6 (Nabih : « il regarde toujours en bas à droite, ça n'a pas de logique ») : il regarde où va le chemin. La pente est lue
      // un peu devant lui (il anticipe le virage) ; à l'arrêt sur une pastille, il regarde déjà vers la suivante. On ne fait jamais
      // pivoter le dessin dans le plan : comme vu d'en haut, le visage glisse vers le haut ou le bas de la tête, le bec raccourcit
      // quand il lève la tête (il pointe loin devant) et s'allonge quand il la baisse, la queue part de l'autre côté.
      const xa = marche ? x + 0.35 * geo.pas : x + 0.5 * geo.pas, ka = Math.floor((xa - geo.x0) / geo.pas), fa = (xa - geo.x0) / geo.pas - ka;
      const pente = (geo.P(ka + 1)[1] - geo.P(ka)[1]) * Math.PI / 2 * Math.sin(fa * Math.PI) / geo.pas;
      // v3.8 (Nabih : « quand il baisse la tête, avec son bec qui s'allonge, c'est chelou ») : il ne plonge plus jamais la tête ;
      // en descente il la garde droite, et pendant le saut il la lève vers sa cible.
      const vise = vol > 0 || ramasse > 0 ? -0.55 : appui > 0.02 ? -0.15 : clamp(Math.atan(pente) * 3.4, -1, 0.25), dtc = Math.min(0.1, (now - avantCap) / 1000); avantCap = now;
      cap += (vise - cap) * Math.min(1, dtc * 5);
      const sc = cap;   // -1 : il monte (regarde en haut à droite) ; +1 : il descend, ou regarde le bouton sur lequel il appuie
      // v3.7 (Nabih : « bouge sa tête, son bec peut aller plus haut, il lève la tête, il bouge son corps ») : gestes beaucoup plus
      // nets. Le visage glisse franchement vers le haut ou le bas de la tête, la tête elle-même se lève ou se baisse, le corps pivote
      // (le collier et les ailes glissent du côté où il se tourne), le bec monte et raccourcit quand il regarde loin devant.
      // v3.9 (Nabih, 19 h 11 : « j'en ai marre qu'il regarde par terre… tu l'as aplati ») : il garde toujours la tête levée, le bec
      // pointé devant lui ; il la lève encore un peu plus en montée et pendant le saut. Le corps ne se déforme plus en biais.
      const leve = clamp(0.5 - 0.5 * sc, 0.35, 1);
      $('.mk-face', mk).setAttribute('transform', `translate(${(7.5 - 2.5 * leve).toFixed(2)} ${(-4 - 7 * leve).toFixed(2)})`);
      $('.mk-bec', mk).setAttribute('transform', `translate(60 67) rotate(${(-40 - 18 * leve).toFixed(2)}) scale(.92 ${(0.72 - 0.08 * leve).toFixed(3)}) translate(-60 -67)`);
      const cps = $('.mk-corps', mk);
      const allure = marche ? 1 : 0, LONG = 56, A = 0.3 * LONG, c = (D / u) / LONG;
      const patte = (ph) => { const fr = ph - Math.floor(ph); if (fr < 0.6) return [A - 2 * A * fr / 0.6, 0]; const q = (fr - 0.6) / 0.4, dq = q * q * (3 - 2 * q); return [-A + 2 * A * dq, Math.sin(q * Math.PI)]; };
      const [xg, lg] = patte(c), [xd, ld] = patte(c + 0.5), w = 2 * Math.PI * c;
      $('.mk-pg', mk).setAttribute('transform', `translate(${(xg * allure + 4).toFixed(2)} ${(-3 * lg * allure).toFixed(2)}) scale(${(1 + 0.14 * lg * allure).toFixed(3)})`);
      $('.mk-pd', mk).setAttribute('transform', `translate(${(xd * allure + 4).toFixed(2)} ${(-3 * ld * allure).toFixed(2)}) scale(${(1 + 0.14 * ld * allure).toFixed(3)})`);
      $('.mk-queue', mk).setAttribute('transform', `translate(-9 ${(2 + 3 * leve).toFixed(2)})`);
      // Il appuie : le corps se tasse vers le sol puis se relève (centre du tassement : ses pieds).
      // Ramassé avant le saut, étiré en l'air, écrasé à l'atterrissage (il enfonce le bouton), centre : ses pieds.
      const sy = 1 - 0.16 * appui - 0.15 * ramasse + 0.1 * envol * vol, sx = 1 + 0.07 * appui + 0.07 * ramasse - 0.04 * envol * vol;
      cps.setAttribute('transform', `translate(${(2.2 * Math.sin(w) * allure + 3 * Math.abs(cap)).toFixed(2)} ${(-1.8 * Math.abs(Math.cos(w)) * allure + 6 * appui + 5 * ramasse).toFixed(2)}) rotate(${(2.6 * Math.sin(w) * allure - 6 * ramasse + 5 * vol * (envol - .5)).toFixed(2)} 60 112) translate(60 121) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-60 -121)`);
      // En l'air, les pattes se replient sous lui.
      if (vol > 0) { $('.mk-pg', mk).setAttribute('transform', `translate(6 ${(-7 * vol).toFixed(2)}) scale(.9)`); $('.mk-pd', mk).setAttribute('transform', `translate(2 ${(-7 * vol).toFixed(2)}) scale(.9)`); }
      $('.mk-tete', mk).setAttribute('transform', `translate(${(1.5 * leve).toFixed(2)} ${(1.6 * Math.sin(2 * w) * allure - 3 * leve + 3 * ramasse - 2 * appui).toFixed(2)}) rotate(${(-3.2 * Math.sin(w) * allure).toFixed(2)} 60 62)`);
    };
    const marche = (now) => { if (!actif) return; poser(now); requestAnimationFrame(marche); };
    if (calme) requestAnimationFrame(() => poser(t0));
    else { veille.observe(monde); monde.addEventListener('vu', () => { if (!actif) { actif = true; requestAnimationFrame(marche); } }); monde.addEventListener('cache', () => { actif = false; }); requestAnimationFrame(marche); }
  }

  // Profondeur derrière la scène (v3.2 : beaucoup moins de motifs) : quelques grandes étoiles de zellige dorées, éparses, à trois
  // distances ; les plus proches sont plus grandes, plus nettes et bougent plus avec la souris.
  if (monde) {
    const fond = document.createElement('div'); fond.className = 'monde-motifs'; fond.setAttribute('aria-hidden', 'true');
    const NAPPES = [
      [[6, 18, 70], [30, 8, 54], [72, 12, 62], [92, 30, 48], [50, 30, 40]],
      [[3, 46, 120], [86, 52, 110], [62, 4, 96]],
      [[-4, 6, 220], [96, 8, 200]],
    ];
    fond.innerHTML = NAPPES.map((n, k) => `<i class="n${k + 1}">${n.map(([x, y, w], i) => `<span style="left:${x}%;top:${y}%;width:${w}px;--t:${70 + i * 17 + k * 30}s">${etoileSVG()}</span>`).join('')}</i>`).join('');
    monde.prepend(fond);
    if (!calme) {
      let mx = 0, my = 0, vx = 0, vy = 0;
      monde.addEventListener('pointermove', (e) => { const r = monde.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
      const nappes = $$(':scope > i', fond);
      const boucle = (now) => {
        vx += (mx - vx) * 0.05; vy += (my - vy) * 0.05; const t = now / 1000;
        nappes.forEach((n, k) => { const p = [12, 26, 48][k], d = [9, 13, 17][k];
          n.style.transform = `translate3d(${(-vx * p + Math.sin(t / d) * 14).toFixed(1)}px, ${(-vy * p * 0.6 + Math.cos(t / (d * 1.3)) * 8).toFixed(1)}px, 0)`; });
        requestAnimationFrame(boucle);
      };
      requestAnimationFrame(boucle);
    }
  }
}

/* ---------- 1 bis. Héros : les bulles arrivent à côté du téléphone quand on le voit ---------- */
{
  const sc = $('.hero .hero-scene');
  if (sc) new IntersectionObserver(([o], ob) => { if (o.isIntersecting) { sc.classList.add('vu'); ob.disconnect(); } }, { threshold: 0.3 }).observe(sc);
  // v3.3 (Nabih) : à certaines largeurs, la bulle de droite sortait de l'écran. On décale alors le téléphone vers la gauche, juste
  // assez, sans que les bulles de gauche touchent le texte ; s'il n'y a pas la place, la bulle de droite passe sous le téléphone.
  const caler = () => {
    if (!sc || innerWidth <= 1080) { if (sc) { sc.style.translate = ''; sc.classList.remove('serre'); } return; }
    sc.style.translate = ''; sc.classList.remove('serre');
    const d = $('.fl-2', sc).getBoundingClientRect().right - (document.documentElement.clientWidth - 18);
    const g = Math.min(...$$('.fl-1, .fl-3', sc).map((b) => b.getBoundingClientRect().left)) - ($('.hero-txt').getBoundingClientRect().right + 18);
    if (d <= 0) return;
    if (d <= g) sc.style.translate = `${-d}px 0`; else sc.classList.add('serre');
  };
  addEventListener('resize', caler); setTimeout(caler, 400); caler();
}

/* ---------- 2. Fonds vivants : nuages dessinés (vert, liseré doré qui brille) ou étoiles de zellige, qui dérivent ---------- */
{
  // v3.1 (Nabih) : plus de nuages, plus gros, et parfois des groupes de deux ou trois nuages dessinés ensemble.
  const NUAGE = 'M22 62 C8 62 4 46 16 40 C13 25 30 18 41 27 C46 10 74 9 80 26 C92 17 109 27 103 42 C116 44 116 62 101 62 Z';
  const GROUPES = [
    [[0, 0, 1]], [[0, 18, .8], [70, 0, 1]], [[0, 10, .7], [52, 0, 1], [118, 20, .65]], [[0, 0, 1], [86, 26, .6]], [[30, 0, .75], [0, 24, 1], [96, 22, .8]],
  ];
  // Un plan de maison d'architecte (pièces, portes, cotes), qui se dessine lentement puis s'efface, pour la section des rôles.
  const PLAN = [
    'M60 60 H420 V300 H60 Z', 'M60 170 H210 M250 170 H420', 'M210 60 V130 M210 160 V300', 'M300 170 V300', 'M120 300 v14 M180 300 v14',
    'M210 130 a30 30 0 0 1 30 30', 'M300 230 a26 26 0 0 0 -26 -26', 'M60 330 H420 M60 324 v12 M420 324 v12', 'M440 60 V300 M434 60 h12 M434 300 h12',
    'M90 90 h60 v50 h-60 Z', 'M330 90 h60 v50 h-60 Z', 'M330 200 c10 -16 40 -16 50 0 c-10 16 -40 16 -50 0',
  ];
  $$('.avec-ciel').forEach((sec) => {
    const genre = sec.dataset.ciel || 'nuages', ciel = document.createElement('div');
    ciel.className = 'ciel'; ciel.setAttribute('aria-hidden', 'true');
    // Façade d'architecte (élévation) : sol, murs, arcs des fenêtres, acrotère, cotes en safran.
    const FACADE = ['M40 300 H440', 'M80 300 V120 H400 V300', 'M70 120 H410 M70 112 H410 V120 M70 112 V120', 'M130 300 V230 a30 30 0 0 1 60 0 V300',
      'M250 200 V160 a24 24 0 0 1 48 0 V200 Z', 'M330 200 V160 a24 24 0 0 1 48 0 V200 Z', 'M110 200 V160 a24 24 0 0 1 48 0 V200 Z', 'M80 210 H400',
      'M460 120 V300 M454 120 h12 M454 300 h12', 'M80 330 H400 M80 324 v12 M400 324 v12'];
    // v3.7 (Nabih : « ces dessins évoquent le papier, le plan ; rajoute-en un peu ici, un peu là ») : petits dessins d'architecte en
    // plus, dans les marges : une équerre, une rose des vents, une porte en élévation, un compas.
    const PETITS = {
      equerre: ['M10 110 L10 10 L110 110 Z', 'M28 92 L28 52 L68 92 Z', 'M10 30 h8 M10 50 h8 M10 70 h8 M10 90 h8 M30 110 v-8 M50 110 v-8 M70 110 v-8 M90 110 v-8'],
      rose: ['M60 10 L68 52 L110 60 L68 68 L60 110 L52 68 L10 60 L52 52 Z', 'M60 60 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0', 'M60 4 v6 M56 0 l8 0'],
      porte: ['M30 110 V40 a30 30 0 0 1 60 0 V110', 'M40 110 V46 a20 20 0 0 1 40 0 V110', 'M20 110 H100', 'M74 80 h4'],
      compas: ['M60 14 L30 108 M60 14 L92 104', 'M60 14 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0', 'M40 76 Q61 86 84 74', 'M92 104 l-3 8'],
    };
    const petit = (nom, x, y, w, k) => `<svg class="plan-trait petit" viewBox="0 0 120 120" style="left:${x}%;top:${y}%;width:${w}px;height:auto;inset:auto">${PETITS[nom].map((d, i) => `<path class="${i === 0 ? 'or' : ''}" pathLength="1" d="${d}" style="--r:${(k * 3 + i * 0.5).toFixed(2)}s"/>`).join('')}</svg>`;
    if (genre === 'facade') {
      ciel.innerHTML = [[66, 6, 460], [2, 52, 380]].map(([x, y, w], k) => `<svg class="plan-trait" viewBox="0 0 480 360" style="left:${x}%;top:${y}%;width:${w}px;height:auto;inset:auto">${FACADE.map((d, i) => `<path class="${i > 7 ? 'or' : ''}" pathLength="1" d="${d}" style="--r:${(k * 5 + i * 0.4).toFixed(2)}s"/>`).join('')}</svg>`).join('');
      ciel.insertAdjacentHTML('beforeend', petit('compas', 90, 8, 110, 1) + petit('porte', 3, 84, 120, 2) + petit('rose', 46, 2, 96, 3));
      sec.prepend(ciel); return;
    }
    if (genre === 'plan') {
      ciel.innerHTML = [[4, 8, 420], [62, 46, 520]].map(([x, y, w], k) => `<svg class="plan-trait" viewBox="0 0 480 360" style="left:${x}%;top:${y}%;width:${w}px;height:auto;inset:auto">${PLAN.map((d, i) => `<path class="${i > 6 && i < 9 ? 'or' : ''}" pathLength="1" d="${d}" style="--r:${(k * 5 + i * 0.35).toFixed(2)}s"/>`).join('')}</svg>`).join('');
      ciel.insertAdjacentHTML('beforeend', petit('equerre', 88, 4, 120, 1) + petit('rose', 44, 3, 100, 2) + petit('compas', 2, 62, 110, 3));
      sec.prepend(ciel); return;
    }
    const nb = +(sec.dataset.nb || (genre === 'nuages' ? 8 : 9));
    ciel.innerHTML = Array.from({ length: nb }, (_, i) => {
      const y = (4 + (i * 53) % 74).toFixed(0) + '%', d = (genre === 'nuages' ? 80 : 50) + (i % 3) * 22, r = (-d * (i / nb)).toFixed(1) + 's';
      if (genre === 'nuages') {
        const g = GROUPES[i % GROUPES.length], w = 170 + (i % 4) * 70 + (g.length - 1) * 60, vb = 120 + Math.max(...g.map(([x, , s]) => x + 120 * s - 120));
        const corps = g.map(([x, yy, s]) => `<g transform="translate(${x} ${yy}) scale(${s})"><path class="corps" d="${NUAGE}"/><path class="lisere" d="${NUAGE}"/><path class="eclat" pathLength="1" d="${NUAGE}"/></g>`).join('');
        return `<span class="nuage" style="--y:${y};--w:${w}px;--d:${d}s;--r:${r};--o:${(0.38 + (i % 2) * 0.18).toFixed(2)};--e:${(i * 1.3).toFixed(1)}s"><svg viewBox="0 0 ${vb} 96">${corps}</svg></span>`;
      }
      const w = 18 + (i % 4) * 12;
      return `<span class="astre ${i % 3 ? '' : 'or'}" style="--y:${y};--w:${w}px;--d:${d}s;--r:${r};--o:${(0.1 + (i % 3) * 0.06).toFixed(2)};--t:${30 + i * 6}s">${etoileSVG()}</span>`;
    }).join('');
    sec.prepend(ciel);
  });
}

/* ---------- 3. Les quatre repères : une image chacun ---------- */
{
  const IMG = ['assets/etapes/etape-2-gros-oeuvre.webp', 'assets/icones-3d/camera.webp', 'assets/icones-3d/hourglass.webp', 'assets/icones-3d/pen.webp'];
  $$('.proofs li').forEach((li, k) => { li.style.setProperty('--k', k); li.insertAdjacentHTML('afterbegin', `<img src="${IMG[k]}" alt="" loading="lazy">`); });
}

/* ---------- 4. La maison : à la sixième étape, confettis et Bellarej qui fête ---------- */
{
  const plat = $('.maison-plateau');
  if (plat) {
    const fete = document.createElement('div'); fete.className = 'maison-fete'; fete.setAttribute('aria-hidden', 'true');
    const C = ['#E2A33B', '#14503F', '#1F7A5C', '#F2B84E', '#B8603A', '#FBF8F2'];
    fete.innerHTML = `<div class="bel">${bellarejRig('felicite', 150)}</div>` + Array.from({ length: 46 }, (_, i) => {
      const a = (i / 46) * Math.PI * 2 + (i % 3) * 0.4, v = 140 + (i * 53) % 190;
      return `<i class="cf" style="--c:${C[i % C.length]};--x:${(Math.cos(a) * v).toFixed(0)}px;--y:${(Math.sin(a) * v * 0.8 - 40).toFixed(0)}px;--a:${(i * 97) % 540}deg;--r:${((i % 7) * 0.03).toFixed(2)}s"></i>`;
    }).join('');
    plat.appendChild(fete);
    document.addEventListener('maison:etape', (e) => { const fin = e.detail === 5; fete.classList.toggle('on', fin); if (fin) { fete.classList.remove('on'); void fete.offsetWidth; fete.classList.add('on'); } });
  }
}

/* ---------- 5. Comment ça marche : une flèche dessinée à la main, avec des boucles, qui avance avec le défilement ---------- */
{
  const liste = $('#commentListe');
  if (liste) {
    const fil = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fil.setAttribute('class', 'comment-fil'); fil.setAttribute('aria-hidden', 'true');
    fil.innerHTML = `<defs><linearGradient id="filDeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14503F"/><stop offset=".55" stop-color="#1F7A5C"/><stop offset="1" stop-color="#E2A33B"/></linearGradient></defs>
      <path class="fond"/><path class="cerne"/><path class="trace"/><path class="reflet"/><path class="pointe-cerne"/><path class="pointe"/>`;
    liste.prepend(fil);
    const [fond, cerne, trace, reflet, pointeCerne, pointe] = $$('path', fil);
    // Points de passage entre deux numéros (x en px depuis l'axe, y en part de l'intervalle) : une seule boucle bien ronde, façon
    // dessin animé (v3.1 : la première version faisait gribouillage).
    const MOTIF = [[0, 0], [24, .22], [30, .42], [14, .58], [-10, .52], [-12, .36], [6, .28], [26, .4], [22, .66], [6, .86], [0, 1]];
    let L = 0, centres = [];
    const construire = () => {
      // v3.3 (Nabih) : le fil sort de sous le numéro 1, plonge sous chaque numéro et en ressort, jusqu'au 4. Entre deux numéros il
      // fait UNE boucle, qui est un vrai cercle (deux arcs de cercle, pas une courbe approchée qui faisait un coin).
      const r = liste.getBoundingClientRect(), large = innerWidth > 900;
      const axe = large ? 73 : 33, R = large ? 22 : 13, haut = -30;
      fil.setAttribute('viewBox', `0 ${haut} ${large ? 132 : 74} ${r.height + 60}`);
      const cs = $$(':scope > li', liste).map((li) => li.offsetTop + (large ? 57 : 51));
      // v3.4 (Nabih : « la droite est trop parfaite, fais de vraies vagues, sans exagérer ») : entre les numéros et la boucle, le fil
      // ondule doucement (il part et arrive toujours à la verticale, pour se raccorder sans coin au cercle et aux numéros).
      const amp = large ? 11 : 7, f2 = (v) => v.toFixed(1);
      const vague = (ya, yb, sg) => { const hh = yb - ya, xm = axe + amp * sg; return ` C${axe} ${f2(ya + hh * .25)} ${f2(xm)} ${f2(ya + hh * .25)} ${f2(xm)} ${f2(ya + hh / 2)} C${f2(xm)} ${f2(ya + hh * .75)} ${axe} ${f2(ya + hh * .75)} ${axe} ${f2(yb)}`; };
      centres = cs;
      let d = `M${axe} ${cs[0]}`;
      for (let i = 0; i < cs.length - 1; i++) {
        const y0 = cs[i], y1 = cs[i + 1], ym = (y0 + y1) / 2, s = i % 2 ? -1 : 1;
        // Ondule jusqu'au bas de la boucle, fait le tour complet d'un cercle de rayon R posé à côté de l'axe, puis repart en ondulant.
        d += vague(y0, ym + R, -s);
        d += ` A${R} ${R} 0 0 ${s > 0 ? 0 : 1} ${(axe + 2 * R * s).toFixed(1)} ${(ym + R).toFixed(1)}`;   // demi-cercle vers le côté
        d += ` A${R} ${R} 0 0 ${s > 0 ? 0 : 1} ${axe} ${(ym + R).toFixed(1)}`;                           // et retour : un cercle complet
        d += vague(ym + R, y1, s);
      }
      [fond, cerne, trace, reflet].forEach((q) => q.setAttribute('d', d)); L = trace.getTotalLength();
      [cerne, trace].forEach((q) => { q.style.strokeDasharray = `${L} ${L}`; }); reflet.style.display = 'none'; maj();
    };
    const maj = () => {
      const r = liste.getBoundingClientRect(), lis = [...liste.children].filter((e) => e.tagName === 'LI'), y1 = lis[0].offsetTop, y4 = lis[lis.length - 1].offsetTop;
      const p = calme ? 1 : clamp((innerHeight * 0.62 - r.top - y1) / Math.max(1, y4 - y1));
      [cerne, trace].forEach((q) => { q.style.strokeDashoffset = (L * (1 - p)).toFixed(1); });
      // La pointe de la flèche, au bout du trait.
      const l = Math.max(2, L * p), a = trace.getPointAtLength(l), b = trace.getPointAtLength(Math.max(0, l - 8)), ang = Math.atan2(a.y - b.y, a.x - b.x), k = 16;
      const pt = (da) => `${(a.x - k * Math.cos(ang + da)).toFixed(1)} ${(a.y - k * Math.sin(ang + da)).toFixed(1)}`;
      const dp = `M${pt(0.62)} L${a.x.toFixed(1)} ${a.y.toFixed(1)} L${pt(-0.62)}`; pointe.setAttribute('d', dp); pointeCerne.setAttribute('d', dp);
      const vis = p > 0.02 && p < 0.985 ? 1 : 0; pointe.style.opacity = vis; pointeCerne.style.opacity = vis;
      // v3.4 (Nabih : « quand la flèche arrive, le bouton devient vert ; avant, on ne voit pas le fil derrière ») : un numéro reste
      // gris et opaque tant que la pointe ne l'a pas atteint, puis passe au vert. Le 1 s'allume dès que le fil en sort.
      const lis2 = [...liste.children].filter((e) => e.tagName === 'LI');
      lis2.forEach((li, i) => li.classList.toggle('atteint', calme || (i === 0 ? p > 0.004 : (p >= 0.985 || a.y >= (centres[i] || 1e9) - 4))));
    };
    addEventListener('scroll', maj, { passive: true }); new ResizeObserver(construire).observe(liste); construire();
  }
}

/* ---------- v3.7 : l'étagère est fixée à un vrai mur : consoles sous chaque planche ---------- */
{
  const mur = $('#etagMur');
  // v3.8 (Nabih : « les appuis, quand je les vois, ça me dit rien ») : de vraies consoles marocaines en cèdre sculpté, vissées au mur,
  // en gradins comme sous les poutres des riads. Elles portent la planche et projettent leur ombre sur l'enduit.
  const CONSOLE = `<svg viewBox="0 0 80 96" aria-hidden="true"><defs><linearGradient id="cedre" x1="0" x2="1"><stop offset="0" stop-color="#7A4A2A"/><stop offset=".55" stop-color="#9A6238"/><stop offset="1" stop-color="#6A3E22"/></linearGradient></defs>
    <path d="M0 0 H80 V10 H74 C74 18 68 20 66 22 V28 H60 C60 36 54 38 52 40 V46 H48 C48 56 44 60 40 62 C36 60 32 56 32 46 H28 V40 C26 38 20 36 20 28 H14 V22 C12 20 6 18 6 10 H0 Z" fill="url(#cedre)"/>
    <path d="M0 10 H80 M6 22 H74 M14 28 H66 M20 40 H60 M28 46 H52" stroke="#4A2A16" stroke-width="1.6" opacity=".6"/>
    <path d="M2 2 H78" stroke="#C48A55" stroke-width="2" opacity=".7"/>
    <circle cx="40" cy="34" r="3.2" fill="#E2A33B"/><circle cx="40" cy="34" r="1.3" fill="#7A4A2A"/>
    <circle cx="40" cy="54" r="2.4" fill="#3A2416"/><path d="M38.6 54 h2.8" stroke="#9A6238" stroke-width=".8"/></svg>`;
  const poser = () => $$('.etag-rang', mur || document).forEach((r) => { $$(':scope > .console', r).forEach((c) => { if (!c.firstChild) c.remove(); });
    if (!$(':scope > .console', r)) r.insertAdjacentHTML('beforeend', `<i class="console g" aria-hidden="true">${CONSOLE}</i><i class="console d" aria-hidden="true">${CONSOLE}</i>`); });
  if (mur) { poser(); new MutationObserver(poser).observe(mur, { childList: true }); }
  // Un rappel du zellige en haut du mur (sous les arcades), pour qu'on comprenne tout de suite qu'on est devant un mur.
  const et = $('#etagere'); if (et && !$(':scope > .frise-mur', et)) et.insertAdjacentHTML('afterbegin', '<i class="frise-mur" aria-hidden="true"></i>');
}

/* ---------- v3.4 : Coup d'œil, le fond vert n'est plus vide (Nabih : « cette zone verte, tu me mets rien ») ---------- */
{
  const cd = $('#coup-doeil');
  if (cd) {
    // De grandes étoiles de zellige (le même dessin que partout), dorées ou vert clair, à trois distances, qui tournent très
    // lentement, scintillent et suivent un peu la souris. Elles restent sur les bords et entre les téléphones, jamais sous le texte.
    const PL = [[3, 8, 110, 2], [86, 6, 120, 2], [10, 38, 70, 1], [88, 34, 80, 1], [2, 64, 130, 3], [87, 60, 120, 3], [30, 52, 46, 0], [70, 50, 52, 0],
      [18, 82, 90, 1], [80, 80, 100, 2], [50, 90, 56, 0]];
    const box = document.createElement('div'); box.className = 'cd-motifs'; box.setAttribute('aria-hidden', 'true');
    box.innerHTML = PL.map(([x, y, w, z], k) => `<span class="z${z}" style="left:${x}%;top:${y}%;width:${w}px;--k:${k}"><svg viewBox="-12 -12 24 24"><path d="${ETOILE}" fill="none" stroke="currentColor" stroke-width=".7"/><path d="${ETOILE}" transform="scale(.55)" fill="currentColor" opacity=".35"/></svg></span>`).join('');
    cd.prepend(box);
    // v3.6 (Nabih : « pourquoi t'as enlevé le bandeau ? ») : la frise de zellige qui défile de gauche à droite est de retour en haut.
    if (!$(':scope > .frise', cd)) { const fr = document.createElement('div'); fr.className = 'frise'; fr.setAttribute('aria-hidden', 'true'); cd.prepend(fr); }
    // v3.6 (Nabih : « propose-moi une décoration pour dire qu'on passe à la section suivante ») : le vert ne s'efface plus en fondu, il
    // se termine par une rangée d'arcs outrepassés (les arcs des portes de médina), cernés d'un filet doré qui scintille, une étoile
    // de zellige au creux de chaque arc. On passe sous les arcs pour entrer dans l'étagère.
    const et = $('#etagere');
    if (et && !$(':scope > .arcades', et)) {
      const arc = document.createElement('div'); arc.className = 'arcades'; arc.setAttribute('aria-hidden', 'true'); et.prepend(arc);
      const dessiner = () => { const W = arc.clientWidth || innerWidth, n = Math.max(4, Math.round(W / 150)), u = W / n, h = 62, p = Math.max(7, u * 0.07), haut = 14;
        // Le vert est le mur, les arcs sont les ouvertures : entre deux piliers, le bord remonte en arc outrepassé (il s'élargit un
        // peu au-dessus de la naissance, comme les portes de médina) jusqu'à la clé, puis redescend.
        let d = `M0 0 H${W} V${h}`, fil = '', et2 = '';
        for (let i = n - 1; i >= 0; i--) { const x1 = (i + 1) * u, x0 = i * u, m = (x0 + x1) / 2, a1 = x1 - p, a0 = x0 + p, w2 = (a1 - a0) / 2, yn = h * 0.72;
          const seg = ` L${a1.toFixed(1)} ${h} L${a1.toFixed(1)} ${yn.toFixed(1)} C${(a1 + w2 * 0.16).toFixed(1)} ${(yn - h * 0.34).toFixed(1)} ${(m + w2 * 0.72).toFixed(1)} ${haut} ${m.toFixed(1)} ${haut} C${(m - w2 * 0.72).toFixed(1)} ${haut} ${(a0 - w2 * 0.16).toFixed(1)} ${(yn - h * 0.34).toFixed(1)} ${a0.toFixed(1)} ${yn.toFixed(1)} L${a0.toFixed(1)} ${h}`;
          d += seg; fil += (fil ? '' : `M${W} ${h}`) + seg + ` L${(x0 - (i ? p : 0)).toFixed(1)} ${h}`;
          if (i) et2 += `<path class="et" style="--k:${i}" d="${ETOILE}" transform="translate(${x0.toFixed(1)} ${(h * 0.42).toFixed(1)}) scale(.62)"/>`; }
        d += ` L0 ${h} Z`;
        arc.innerHTML = `<svg viewBox="0 0 ${W} ${h + 6}" width="${W}" height="${h + 6}"><path class="plein" d="${d}"/><path class="filet" d="${fil}"/>${et2}</svg>`; };
      new ResizeObserver(dessiner).observe(arc); dessiner();
    }
    if (!calme) cd.addEventListener('pointermove', (e) => { const r = cd.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5;
      $$('span', box).forEach((sp) => { const z = +sp.className.slice(1) + 1; sp.style.translate = `${(-mx * 14 * z).toFixed(1)}px ${(-my * 10 * z).toFixed(1)}px`; }); });
  }
}

/* ---------- 6. Familles : une rosace qui tourne lentement derrière le titre ---------- */
{
  const sc = $('#confScene');
  if (sc) { const r = document.createElement('div'); r.className = 'conf-rosace'; r.setAttribute('aria-hidden', 'true');
    const ros = (n, rr) => `<svg viewBox="-100 -100 200 200" overflow="visible">${Array.from({ length: n }, (_, i) => `<path d="${ETOILE}" transform="rotate(${(360 / n) * i}) translate(0 ${-rr}) scale(1.25)" fill="none" stroke="currentColor" stroke-width=".45"/>`).join('')}<circle r="${rr}" fill="none" stroke="currentColor" stroke-width=".25" stroke-dasharray="1.2 2.4"/><circle r="${rr * .62}" fill="none" stroke="currentColor" stroke-width=".25"/></svg>`;
    r.innerHTML = ros(18, 86) + ros(14, 70);   /* v3.8 : étoiles entières, sans se chevaucher (« il manque des pics ») */ sc.prepend(r); }
}

/* ---------- 7. Dynamic Island, écran verrouillé, écran d'accueil : les trois avancent ensemble, de l'étape 1 à 6, en boucle ---------- */
{
  const wf = $('#wframe'), sec = $('#coup-doeil');
  if (wf && sec) {
    const fete = document.createElement('div'); fete.className = 'w-fete'; fete.setAttribute('aria-hidden', 'true'); sec.appendChild(fete);
    const C = ['#E2A33B', '#F2B84E', '#1F7A5C', '#FBF8F2', '#B8603A'];
    const ondes = document.createElement('div'); ondes.className = 'w-ondes'; ondes.setAttribute('aria-hidden', 'true');
    const trame = document.createElement('div'); trame.className = 'w-trame'; trame.setAttribute('aria-hidden', 'true'); sec.prepend(ondes); sec.prepend(trame);
    // Une onde part de la Dynamic Island de chacun des trois téléphones, en même temps : c'est la même information qui arrive partout.
    const onder = (vert) => { const f = wf.getBoundingClientRect(), s = sec.getBoundingClientRect(); ondes.innerHTML = [0.17, 0.5, 0.83].map((x, k) => `<i class="${vert ? 'v' : ''}" style="left:${(f.left - s.left + f.width * x).toFixed(0)}px;top:${(f.top - s.top + f.height * 0.16).toFixed(0)}px;animation-delay:${k * 40}ms"></i>`).join(''); };
    const feter = () => { fete.innerHTML = Array.from({ length: 60 }, (_, i) => `<i style="--l:${(5 + (i * 37) % 90)}%;--c:${C[i % 5]};--x:${((i % 2 ? 1 : -1) * (40 + (i * 29) % 160))}px;--y:${-(160 + (i * 41) % 260)}px;--a:${(i * 83) % 600}deg;--r:${((i % 9) * 0.04).toFixed(2)}s"></i>`).join(''); };
    let pause = 0, minuterie = null, attente = 0;
    const W = () => { try { return wf.contentWindow && wf.contentWindow.__widgets; } catch { return null; } };
    const envoyer = (a) => wf.contentWindow && wf.contentWindow.postMessage({ teeqaWidgets: a }, location.origin);
    const tour = () => {
      const w = W(); if (!w || !visible.get(sec) || Date.now() < pause) return;
      if (attente > 0) { attente--; return; }
      if (w.st.d >= 6) { envoyer('reset'); attente = 1; return; }
      envoyer('next'); onder(w.st.d + 1 >= 6);
      if (w.st.d + 1 >= 6) { feter(); attente = 3; }   // la sixième : petite fête, puis on recommence
    };
    wf.addEventListener('load', () => { wf.contentWindow.postMessage({ teeqaIsland: 'exp' }, location.origin); envoyer('reset'); if (!calme && !minuterie) minuterie = setInterval(tour, 820); });
    veille.observe(sec);
    // Si quelqu'un clique sur un bouton, on le laisse faire : l'animation reprend après huit secondes.
    $$('[data-w]', sec).forEach((b) => b.addEventListener('click', () => { pause = Date.now() + 8000; attente = 0; }));
  }
}

/* ---------- 8. Témoignages (v3.1) : un album de photos qui changent de place, des souvenirs du chantier qui flottent autour ---------- */
{
  const sec = $('#temoins'), cadre = $('#temoinsCadre');
  if (sec && cadre) {
    // Autour : des photos du chantier (celles de l'appli), en polaroïd, à des distances différentes ; les plus lointaines floues.
    const sv = document.createElement('div'); sv.className = 'temoins-souvenirs'; sv.setAttribute('aria-hidden', 'true');
    // Jamais sur le texte (colonne de gauche, moitié basse) : le long du haut et du bord droit seulement.
    const POS = [[1, 4, 116, -8, .55, 0], [21, 0, 84, 6, .38, 1.6], [43, 7, 92, 4, .32, 2], [84, 0, 100, 7, .5, 1], [95, 52, 86, -6, .4, 1.2], [93, 88, 74, 10, .3, 2.4],
      // v3.7 (Nabih : « rajoute-en ici, un peu plus, et un peu ici ; il ne faut pas que ça touche le texte ») : dans le vide au-dessus du texte et dans la marge de gauche.
      [15, 24, 112, -7, .8, 0], [33, 30, 96, 6, .7, .3], [2, 52, 92, 9, .55, .6], [47, 20, 70, -4, .45, 1.2]];
    sv.innerHTML = POS.map(([x, y, w, a, o, b], i) => `<figure style="--x:${x}%;--y:${y}%;--w:${w}px;--a:${a}deg;--o:${o};--b:${b}px;--d:${9 + i * 2}s;--dx:${(i % 2 ? -1 : 1) * (8 + i * 2)}px;--dy:${-10 - i * 2}px"><img src="assets/photos/p${(i * 2) % 12 + 1}.webp" alt="" loading="lazy"></figure>`).join('');
    sec.prepend(sv);
    // Et quelques polaroïds au premier plan, plus grands et flous (comme vus de tout près), dans les coins, devant le décor mais
    // jamais devant le texte ni la photo.
    const av = document.createElement('div'); av.className = 'temoins-avant'; av.setAttribute('aria-hidden', 'true');
    av.innerHTML = [[-2, 74, 168, -11, 2.6, 'p3'], [25, -4, 150, 8, 2.2, 'p9']].map(([x, y, w, a, b, p], i) => `<figure style="--x:${x}%;--y:${y}%;--w:${w}px;--a:${a}deg;--b:${b}px;--d:${12 + i * 3}s;--dx:${i ? -10 : 12}px;--dy:-12px"><img src="assets/photos/${p}.webp" alt="" loading="lazy"></figure>`).join('');
    sec.appendChild(av);
    // v3.8 (Nabih : « là, t'as caché le truc, on ne voit plus le texte ») : chaque polaroïd du premier plan cherche une place où il
    // ne touche ni le texte d'aucune fiche ni l'album des portraits ; s'il n'en trouve pas, il ne s'affiche pas.
    const PLACES_AV = [[-6, 86], [-5, -6], [52, 90], [44, -7], [-7, 34], [60, -6]];
    const placerAvant = () => {
      const zones = [...$$('.temoin .dit', cadre), $('.temoins-album', cadre)].filter(Boolean).map((e) => e.getBoundingClientRect()).filter((r) => r.width);
      const prises = [];
      $$('figure', av).forEach((f, i) => { f.style.display = ''; let ok = false;
        for (let e = 0; e < PLACES_AV.length && !ok; e++) { const q = (i * 2 + e) % PLACES_AV.length; if (prises.includes(q)) continue;
          f.style.setProperty('--x', PLACES_AV[q][0] + '%'); f.style.setProperty('--y', PLACES_AV[q][1] + '%');
          const r = f.getBoundingClientRect(), m = 24;
          if (!zones.some((z) => r.left < z.right + m && z.left < r.right + m && r.top < z.bottom + m && z.top < r.bottom + m)) { ok = true; prises.push(q); } }
        if (!ok) f.style.display = 'none'; });
    };
    requestAnimationFrame(placerAvant); addEventListener('resize', placerAvant); addEventListener('load', placerAvant);
    // L'album : les trois portraits en paquet ; quand la fiche change, la photo de devant glisse vers la gauche et repasse derrière.
    const fiches = $$('.temoin', cadre), photos = fiches.map((f) => $('.photo img', f));
    const album = document.createElement('div'); album.className = 'temoins-album'; album.setAttribute('aria-hidden', 'true');
    // v3.8 (Nabih : « ici, mets le nom et la fonction de la personne ») : sous chaque portrait, dans la marge blanche du polaroïd,
    // le prénom et ce que fait la personne, comme écrits au feutre.
    album.innerHTML = photos.map((im, i) => { const f = fiches[i], nom = $('.signe b', f)?.textContent || '', role = $('.qui', f)?.textContent.trim() || '';
      return `<figure><img src="${im.getAttribute('src')}" alt=""><figcaption><b>${nom}</b><span>${role}</span></figcaption></figure>`; }).join('');
    cadre.appendChild(album);
    const cartes = $$('figure', album);
    let avant = 0;
    const ranger = () => {
      const n = Math.max(0, fiches.findIndex((f) => f.classList.contains('actif')));
      if (n !== avant) { const c = cartes[avant]; c.classList.add('part'); setTimeout(() => c.classList.remove('part'), 650); }
      cartes.forEach((c, k) => c.dataset.r = (k - n + cartes.length) % cartes.length);
      avant = n;
    };
    new MutationObserver(ranger).observe(cadre, { subtree: true, attributes: true, attributeFilter: ['class'] });
    ranger();
  }
}

/* ---------- 9. Trois rôles : la même étape, vue par chacun, et Bellarej habillé pour le rôle ---------- */
{
  const leg = $('#roleLegende'), illu = $('#roleIllu');
  if (leg && illu) {
    const R = {
      client: ['Ce que voit Karim, le client, à l\'étape 2', () => bellarejRig('attend', 150, { seat: 'transat' })],
      entreprise: ['Ce que voit Rachid, l\'entreprise, à l\'étape 2', () => bellarejRig('batit', 150, { gear: 'orange' })],
      controleur: ['Ce que voit Amina, la contrôleuse, à l\'étape 2', () => bellarejRig('photo', 150, { gear: 'jaune' })],
    };
    const peindre = (r) => { leg.textContent = R[r][0]; illu.innerHTML = R[r][1](); illu.classList.remove('arrive'); void illu.offsetWidth; illu.classList.add('arrive'); };
    // v3.1 (Nabih) : les gens ne cliquent pas ; on passe tout seul du client à l'entreprise puis au contrôleur, toutes les six
    // secondes, tant que la section est à l'écran. Un clic reprend la main (le défilement automatique s'arrête).
    const onglets = $$('#roles .tabs [role="tab"]'), sec = $('#roles');
    let auto = null, n = 0, main = false;
    const montrer = (k) => { n = k; onglets[k].click(); onglets.forEach((b, i) => b.classList.toggle('auto', !main && i === k)); };
    onglets.forEach((b, k) => b.addEventListener('click', (e) => { peindre(b.dataset.role); if (e.isTrusted) { main = true; clearInterval(auto); auto = null; onglets.forEach((x) => x.classList.remove('auto')); } }));
    peindre('client');
    if (!calme && sec) { veille.observe(sec);
      sec.addEventListener('vu', () => { if (!main && !auto) { montrer(n); auto = setInterval(() => montrer((n + 1) % onglets.length), 6000); } });
      sec.addEventListener('cache', () => { clearInterval(auto); auto = null; }); }
  }
}

/* ---------- 10. La fin : Bellarej au centre de ses motifs, comme à la première ouverture de l'appli ---------- */
{
  const fin = $('.final'), oiseau = $('#finalBird');
  if (fin && oiseau) {
    const d = document.createElement('div'); d.className = 'final-deco'; d.setAttribute('aria-hidden', 'true');
    const anneau = (n, D, z, t, c, s, o) => `<div class="tour" style="--d:${D}px;--t:${t}s;--s:${s}">${Array.from({ length: n }, (_, i) => `<i style="--a:${(360 / n) * i}deg;--z:${z}px;--c:${c};--o:${o}">${etoileSVG()}</i>`).join('')}</div>`;
    d.innerHTML = `<div class="halo"></div>${anneau(10, 250, 22, 60, '#F2B84E', 'normal', .9)}${anneau(16, 400, 16, 90, '#1F7A5C', 'reverse', .9)}${anneau(24, 560, 12, 120, '#E2A33B', 'normal', .55)}${anneau(30, 740, 10, 150, '#F1ECE2', 'reverse', .22)}`;
    fin.prepend(d);
  }
}

/* ---------- 11. L'étagère : chaque écran bouge (le chemin filmé en boucle, la surbrillance du bouton utile, l'éclair de la photo,
   les feuilles de l'avis signé), sur les petits téléphones comme sur le grand qu'on a pris en main. ---------- */
{
  const mur = $('#etagMur');
  const NOMS = ['H01-chemin-avant', 'H02a-entreprise-en-cours', 'H03b-client-avis-attendu', 'H04-controleur-photo', 'H05e-avis-signe-vide', 'H06a-client-en-clair', 'H06b-client-decision', 'H07-chemin-apres'];
  const FILM = { 'H01-chemin-avant': 'chemin-avant', 'H07-chemin-apres': 'chemin-apres' };
  const DOS = 'assets/vitrine/ecrans/';
  // Bellarej de face, tout content, avec son stylo et des feuilles derrière lui : le même dessin que dans le film (js/fete-hero.js).
  let JOIE = '';
  import('./fete-hero.js').then((m) => {
    const d = new DOMParser().parseFromString(`<div>${m.feteHero(true)}</div>`, 'text/html'), g = d.querySelector('.pz-front');
    if (!g) return; ['.fe-open', '.fe-wink', '.fe-glow', '.fh-beak'].forEach((q) => g.querySelectorAll(q).forEach((e) => e.setAttribute('style', 'display:none')));
    const F = [[-140, -150, -200, 0], [-70, -170, 160, .5], [60, -160, -120, 1], [130, -130, 220, 1.5], [-20, -190, 90, 2]];
    JOIE = `<i class="joie">${F.map(([dx, dy, a, r]) => `<i class="fv" style="--dx:${dx}%;--dy:${dy}%;--a:${a}deg;--r:${r}s"></i>`).join('')}<i class="jb"><svg viewBox="0 0 240 300" aria-hidden="true">${g.outerHTML}</svg></i></i>`;
    $$('.etag-tel', mur).forEach((t) => { if (+t.dataset.k === 4 && window.__habiller) window.__habiller($('.ecran', t), 4); });
  }).catch(() => {});
  if (mur) fetch(DOS + 'reperes.json').then((r) => r.json()).catch(() => ({})).then((REP) => {
    // v3.1 (Nabih) : un effet différent par écran. Le contour se trace autour du bouton en suivant sa vraie forme ; ailleurs, un
    // reflet qui passe, un doigt qui appuie, le cadre du viseur, et Bellarej content avec son stylo et ses feuilles (comme le film).
    const zone = (r) => `--x:${(r.x * 100).toFixed(2)}%;--y:${(r.y * 100).toFixed(2)}%;--w:${(r.w * 100).toFixed(2)}%;--h:${(r.h * 100).toFixed(2)}%`;
    const contour = (r, c = '#E2A33B') => { const W = r.w * 402, H = r.h * 874, R = Math.min(r.ra * H, H / 2);
      return `<svg class="contour" style="${zone(r)};--c:${c}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" preserveAspectRatio="none"><rect x="0" y="0" width="${W.toFixed(1)}" height="${H.toFixed(1)}" rx="${R.toFixed(1)}" pathLength="1"/></svg>`; };
    const EFFET = {
      'H01-chemin-avant': (r) => `<i class="appui" style="${zone(r)}"></i>`,
      'H02a-entreprise-en-cours': (r) => contour(r, '#14503F'),
      'H03b-client-avis-attendu': (r) => `<i class="reflet" style="${zone(r)}"></i>`,
      'H04-controleur-photo': () => '<i class="viseur"><b></b><b></b><b></b><b></b></i><i class="eclair"></i>',
      'H05e-avis-signe-vide': () => JOIE,
      'H06a-client-en-clair': (r) => `<i class="appui" style="${zone(r)}"></i>`,
      'H06b-client-decision': (r) => contour(r, '#1F7A5C'),
      'H07-chemin-apres': (r) => contour(r, '#14503F'),
    };
    const vie = (nom) => {
      let h = '';
      if (FILM[nom] && !calme) h += `<video src="${DOS}${FILM[nom]}.mp4" muted loop playsinline autoplay preload="none" aria-hidden="true"></video>`;
      if (EFFET[nom]) h += EFFET[nom](REP[nom] || {});
      return h;
    };
    const habiller = (ecran, k) => {
      const ancien = $('.vie', ecran); if (ancien) ancien.replaceWith();
      const v = document.createElement('span'); v.className = 'vie'; v.innerHTML = vie(NOMS[k]); ecran.appendChild(v);
      const vid = $('video', v); if (vid) { vid.addEventListener('playing', () => v.classList.add('joue'), { once: true }); vid.play().catch(() => {}); }
    };
    window.__habiller = habiller;
    $$('.etag-tel', mur).forEach((t) => habiller($('.ecran', t), +t.dataset.k));
    // Le grand téléphone : il prend la vie de l'écran choisi chaque fois qu'on en ouvre un.
    const grand = $('.etag-vedette .grand .ecran', mur), img = grand && $('img', grand);
    if (img) new MutationObserver(() => { const k = NOMS.findIndex((n) => img.src.includes(n)); if (k >= 0) habiller(grand, k); }).observe(img, { attributes: true, attributeFilter: ['src'] });
  });
}


/* ---------- v3.5 : la médina à l'horizon et les cigognes (Nabih : « propose-moi quelque chose pour ces zones vides ») ---------- */
// Au-dessus du terrain, là où il restait du vide : la ligne d'une ville marocaine, très pâle, comme dessinée au trait (coupoles,
// minaret avec son nid de cigogne, remparts crénelés, arcs), et quelques cigognes qui la survolent lentement, ailes battantes.
const MEDINA = `<svg viewBox="0 0 1440 170" preserveAspectRatio="xMidYMax slice"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
  <path d="M0 170 V128 H40 V112 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 V128 H150 V100 C150 72 196 72 196 100 V128 H230 V118 H290 V96 h10 v-8 h10 v8 h10 V118 H360 V128"/>
  <path d="M360 170 V40 H392 V128"/><path d="M356 40 H396 M362 40 V26 H390 V40 M366 26 V16 H386 V26 M376 16 V6"/><path d="M366 6 C370 1 382 1 386 6 C382 9 370 9 366 6 Z"/>
  <path d="M372 70 C372 60 380 60 380 70 V80 H372 Z M372 100 C372 92 380 92 380 100 V108 H372 Z"/>
  <path d="M392 128 H470 V104 C470 66 540 66 540 104 V128 H600 V112 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 V112 H700 V128 H760 V96 C760 80 790 80 790 96 V128"/>
  <path d="M790 128 H880 V84 C880 50 940 50 940 84 V128 H990 V110 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 V110 H1100 V128 H1150 V60 H1176 V128"/><path d="M1146 60 H1180 M1152 60 V50 H1174 V60 M1163 50 V42"/>
  <path d="M1176 128 H1240 V102 C1240 76 1290 76 1290 102 V128 H1340 V114 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 V114 H1440"/>
  <path d="M500 128 V112 C500 104 510 104 510 112 V128 M910 128 V108 C910 98 922 98 922 108 V128 M1265 128 V114 C1265 106 1275 106 1275 114 V128"/></g></svg>`;
const LANTERNE = `<svg viewBox="0 0 40 74"><path d="M20 0 V10" stroke="#9C7442" stroke-width="1.6"/><circle cx="20" cy="11" r="2.4" fill="none" stroke="#9C7442" stroke-width="1.4"/>
  <path d="M12 20 C12 14 28 14 28 20 Z" fill="#B88A4E"/><path d="M14 20 h12 l4 8 h-20 Z" fill="#C9A16A"/>
  <path class="verre" d="M10 28 h20 C34 38 34 52 28 60 H12 C6 52 6 38 10 28 Z" fill="#F2B84E"/>
  <path d="M10 28 h20 C34 38 34 52 28 60 H12 C6 52 6 38 10 28 Z M20 28 V60 M13 30 C11 42 11 50 14 59 M27 30 C29 42 29 50 26 59" fill="none" stroke="#8A6534" stroke-width="1.5"/>
  <path d="M16 36 C16 33 24 33 24 36 V44 H16 Z" fill="#FFF3D1" opacity=".75"/>
  <path d="M12 60 h16 l-3 6 h-10 Z" fill="#B88A4E"/><path d="M20 66 V73" stroke="#9C7442" stroke-width="1.6"/><circle cx="20" cy="73" r="1.6" fill="#9C7442"/></svg>`;
const CIGOGNE = `<svg viewBox="0 0 60 30"><path class="ai a1" d="M30 15 C22 4 10 4 2 8 C12 10 20 13 30 16 Z"/><path class="ai a2" d="M30 15 C38 4 50 4 58 8 C48 10 40 13 30 16 Z"/><path d="M18 16 C24 13 36 13 42 16 C36 19 24 19 18 16 Z M42 16 L56 15 M18 16 L4 18"/></svg>`;

/* ---------- 12. v3.2 : le terrain entre la maison et « Comment ça marche » (le décor du chemin de l'appli, vu d'en haut) ---------- */
{
  const t = $('#terrain');
  if (t) {
    const D = 'assets/vitrine/chemin/';
    // v3.4 (Nabih : « il y a trop de trucs un peu partout, c'est dégueulasse… il est caché le petit truc ») : une seule rangée, tout
    // posé sur la même ligne de sol, bien espacé, aucun objet devant un autre, plus de doublons ni de dalles éparpillées.
    // [image, centre %, largeur px à 1440 px de large, profondeur, animation]
    const POSE = [['decor-0', 9, 230, .8, 'palme'], ['decor-1', 17, 64, .4, ''], ['decor-2', 28.5, 220, .7, ''], ['decor-6', 41, 112, .5, 'grue'],
      ['decor-3', 54, 210, 1, 'batit'], ['decor-4', 67, 96, .6, 'coucou'], ['decor-5', 76.5, 60, .4, ''], ['decor-0', 91, 224, .8, 'palme']];
    // v3.5 (Nabih : « le sol, il bouge pas ; les palmiers bougent comme dans le vent, Bellarej bouge son corps, la grue tourne ») :
    // chaque décor est posé deux fois, l'une sur l'autre. La copie du bas ne garde que le socle de sable (immobile), celle du haut
    // ne garde que ce qui est au-dessus du sable (mesuré : le sable commence à 70 % de la hauteur) et c'est elle qui s'anime,
    // pivotant autour de son point d'appui sur le socle. Plus de défilement décalé : le terrain reste posé.
    t.innerHTML = `<div class="horizon" aria-hidden="true">${MEDINA}</div><div class="vols" aria-hidden="true">${[0, 1, 2].map((k) => `<span class="vol v${k}">${CIGOGNE}</span>`).join('')}</div>`
      + `<div class="sol">${POSE.map(([n, x, w, z, a], k) => `<span class="dec-pose${w < 70 ? ' petit' : ''}" style="left:${x}%;width:min(${w}px,${(w / 14.4).toFixed(2)}vw);--z:${z};--r:${(k * -0.9).toFixed(1)}s"><img class="dec socle" src="${D}${n}${a === 'batit' || a === 'coucou' ? '-socle' : ''}.webp" alt="">${a === 'batit' ? `<span class="rig">${bellarejRig('batit', 150, { gear: 'orange' })}</span>` : a === 'coucou' ? `<span class="rig petit">${bellarejRig('annonce', 120, { gear: 'jaune' })}</span>` : a ? `<img class="dec dessus ${a}" src="${D}${n}.webp" alt="">` : ''}</span>`).join('')}</div>`;
    // v3.6 (Nabih : « propose-moi un truc nouveau qui change la donne, c'est un peu vide ») : une guirlande de lanternes marocaines
    // tendue au-dessus du chantier, qui se balancent et s'allument l'une après l'autre, comme un soir de fête quand la maison avance.
    const nL = innerWidth < 760 ? 5 : 9;
    t.insertAdjacentHTML('afterbegin', `<div class="guirlande" aria-hidden="true"><svg class="fil-g" viewBox="0 0 1000 80" preserveAspectRatio="none"><path d="M0 6 Q250 70 500 46 T1000 8"/></svg>${Array.from({ length: nL }, (_, k) => { const u = (k + 0.5) / nL, yy = u < .5 ? 6 + 64 * Math.sin(u * Math.PI * 1.15) * 0.9 : 8 + 60 * Math.sin((1 - u) * Math.PI * 1.1) * 0.75;
      return `<span class="lanterne" style="left:${(u * 100).toFixed(1)}%;top:${(yy * 0.9).toFixed(0)}%;--k:${k}">${LANTERNE}</span>`; }).join('')}</div>`);
  }
  // Passage vers les familles : les dalles du chemin en pas japonais.
  const pd = $('#passageDalles');
  if (pd) pd.insertAdjacentHTML('beforeend', Array.from({ length: 9 }, (_, i) => `<img class="pas" src="assets/vitrine/chemin/dalle-${i % 3}.webp" alt="" style="left:${(10 + i * 10).toFixed(0)}%;top:${(12 + 30 * (i / 8) + 8 * Math.sin(i * 1.3)).toFixed(0)}%;--n:${i}">`).join(''));
  // La cote d'architecte se trace quand on arrive dessus.
  const pc = $('#passageCote');
  if (pc) { const g = pc.querySelector('svg'); if (g) g.outerHTML = `<div class="cote"><i class="bout g"></i><i class="trait"></i>${Array.from({ length: 19 }, (_, k) => `<i class="grad" style="left:${(5 + k * 5)}%;--k:${k}"></i>`).join('')}<i class="bout d"></i></div>`; }
  if (pc) new IntersectionObserver(([o]) => pc.classList.toggle('trace', o.isIntersecting), { threshold: .4 }).observe(pc);
}
