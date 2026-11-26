// Chemin d'avancement animé, invitations, rapport, clôture.
import { enGarantie, entNow, CV_EQUITE, seqFraisChantierTxt, FORFAIT_AGENCES, forfaitTiers, repriseArgent, pourSortante, sortanteNom, resteDu, cvRepartTxt, MARGE_DETAIL, SUIVI_DETAIL, forMe, seqActif, seqSolde, seqEtatTxt, seqSurCompte, sequestreFraisTxt, SEQUESTRE, missionEnCours, agenceEtape, agrementEtape, resteDuTxt, enDeviseTaux, retardJours as retardJoursV17, echeance as echeanceV17, tranchesTxt, missionPending as mPend, edlLimite, edlClos, forfaitCalc, marge, REGLES, TARIFS, tarif, forfait, prix, budgetOf, dh, langOf, enDeviseTxt, deviseVue, tauxLigne, trancheDh, EQUIPE_ROLES, ENGAGEMENTS, forfaitDh, slotTz } from '../store.js';
import { ABANDON_J, abandonLimite, finAffichee, joursSuspendus, nomPartie, nowMs, endWord, agenceLine, AGENCES, visitDelay, GARANTIE_TXT, coulageDue, recuseBlocked, trancheName, HORS_ZONE, empreinte, AGENCE, SALLE, salleBase, pendingFete, actions, get, project, progress, currentStep, access, can, latestReview, doneLike, freshValid, who, avisLabel, isControlled, allControlled, statusKey, ROLES, STATUS, VERDICTS, STEP_ICONS, SITE_TYPES, conventionOk, documents, canSeeDocuments, proIdOf, closeBlockers, closeWarnings, overdue, DELAI_LABEL, FORMULES, formuleOf, MIN_VISITS, keyStep, controlledIndexes, abandonDue, visitBy, holdPoint, firstEndAt, coDecideurs, decideursLine, DROITS, SUPPORT } from '../store.js';
import { icon } from '../icons.js';
import { photoSVG, workerScene, houseSVG, signatureSVG, khatam, stepIcon3D, bellarej, stepArt } from '../art.js';
import { recompense, demobar, appbar, tabbar, esc, fmtDate, fmtFull, statusChip, toast, confirmSheet, openSheet, roleChip, sfx, roleAvatar, closeSheet, trial, trialPick, avatar, def, fold } from '../ui.js';
import { forfaitCards, prochaineTranche } from './home.js';
import { pointsList, fete, PREUVE, noteSheet, paidSheet } from './step.js';
import { go } from '../app.js';
import { qrSVG } from '../qr.js';
import { faillesListe } from './failles.js';
import { resumeBlock } from '../langues.js';
import { reduced } from '../motion.js';
import { decorScene, decorFiller, decorVideo } from '../decor.js';

// Carte d'étape : elle sort du nœud (origine = le nœud, un dépassement) et se pose ; le chemin reste visible derrière.
// Toucher ailleurs ou Échap la ferme. Geste repris de Duolingo, contenu TEEQA (docs/motion-duolingo.md).
let card = null;
// Vague 23 (jury n° 1 et 2, 7 jurés) : après un changement d'entreprise, le Budget dit ce qui a été versé à l'entreprise sortante,
// arrêté par l'état des lieux, et que la suite se paie à la reprenante (une seule ligne, mêmes chiffres que les tranches).

function versesSortante(p) {
  if (!p.reprise || !(p.formerPros || []).length) return '';
  const ra = repriseArgent(p); if (!ra) return '';
  // Vague 24 (jury n° 1, 9 personas) : la règle de l'argent de la reprise, avec ses chiffres, et un total qui tombe juste.
  const so = p.steps.filter(x => pourSortante(p, x) && resteDu(p, x)), re = p.steps.filter(x => !pourSortante(p, x) && resteDu(p, x));
  const ligne = (x) => { const i = p.steps.indexOf(x) + 1, e = echeanceV17(p, x); return `tranche ${i} : ${dh(resteDu(p, x))}${x.sequestre && seqSurCompte(x) ? `, sur le compte de séquestre ; ${esc(SEQUESTRE.banque)} la verse après l’avis favorable de l’étape ${i}` : e ? `, à payer avant le ${fmtDate(e)}` : p.reprise.clientAt ? '' : ', échéance fixée à la signature de l’état des lieux (+ 7 jours)'}`; };
  return `<div class="meta stack" style="gap:4px;color:var(--sage-ink)" data-testid="verse-sortante"><b>Reprise : à qui va l’argent</b>
    <span>Versé à ${esc(ra.sortante)} (entreprise sortante), avant le ${fmtDate(p.reprise.at)} : <b>${dh(ra.verse)}</b>.</span>
    <span data-testid="du-sortante">Encore dû à ${esc(ra.sortante)}, pour le travail qu’elle a fini : <b>${dh(ra.duSortante)}</b>${so.length ? ` (${so.map(ligne).join(' ; ')})` : ''}.</span>
    <span data-testid="a-reprenante">À ${esc(entNow(p))} (entreprise reprenante), d’après son devis : <b>${dh(ra.aReprenante)}</b>${re.length ? ` (tranche${re.length > 1 ? 's' : ''} ${re.map(x => p.steps.indexOf(x) + 1).join(' et ')})` : ''}.</span>
    <span data-testid="reprise-total">Total : ${dh(ra.verse)} + ${dh(ra.duSortante)} + ${dh(ra.aReprenante)} = <b>${dh(ra.verse + ra.duSortante + ra.aReprenante)}</b>${ra.juste ? ', le total prévu' : ''}.</span>
    <span>L’ouvrage laissé est décrit dans l’état des lieux${p.reprise.entrepriseAt ? ` du ${fmtDate(p.reprise.entrepriseAt)}` : ''}${p.reprise.clientAt ? `, signé le ${fmtDate(p.reprise.clientAt)}` : ', à signer'}. Règle complète : Invitations et accès › État des lieux de reprise.</span></div>`;
}
// Vague 23 : nom court d'une étape (« Gros œuvre : murs et poteaux » → « Gros œuvre »), sous sa pastille.
const nomCourt = (t) => { const a = String(t || '').split(/\s*[:,(]\s*/)[0]; return a.length > 22 ? a.slice(0, 21).replace(/\s+\S*$/, '') + '…' : a; };
function closeCard(now = false) {
  if (!card) return;
  const c = card; card = null;
  document.querySelectorAll('.node[aria-expanded="true"]').forEach(n => n.setAttribute('aria-expanded', 'false'));
  if (now || reduced()) { c.remove(); return; }
  c.classList.add('leaving'); setTimeout(() => c.remove(), 140);
}
function openCard(b) {
  const same = card && card.dataset.for === b.dataset.i;
  closeCard(true);
  if (same) return;
  const wrap = b.closest('.path-wrap'), wr = wrap.getBoundingClientRect(), nr = b.getBoundingClientRect();
  const W = wrap.clientWidth, cw = Math.min(W - 32, 320);
  const cx = nr.left - wr.left + nr.width / 2;
  const left = Math.max(16, Math.min(W - 16 - cw, cx - cw / 2));
  const el = document.createElement('div');
  el.className = 'step-card'; el.dataset.for = b.dataset.i; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `Étape ${+b.dataset.i + 1}`);
  el.style.cssText = `left:${left}px;top:${nr.bottom - wr.top + 10}px;width:${cw}px;--tip:${cx - left}px;transform-origin:${cx - left}px -10px`;
  el.innerHTML = `<div class="sc-over"><span class="mono">ÉTAPE ${String(+b.dataset.i + 1).padStart(2, '0')}</span>${statusChip(b.dataset.st)}</div>
    <div class="row" style="gap:12px;margin:8px 0 6px">${stepIcon3D(+b.dataset.i, wrap.querySelectorAll('.node').length, 60, 'pop-in')}<div class="grow"><div class="sc-title" style="margin:0 0 2px">${esc(b.dataset.title)}</div>
    ${b.dataset.hint ? `<p class="sc-hint" style="margin:0">${esc(b.dataset.hint)}</p>` : ''}</div></div>
    <button class="btn block ${b.dataset.saffron ? 'saffron' : ''}" data-act="open-step" data-href="${b.dataset.href}">Ouvrir l'étape</button>`;
  wrap.appendChild(el);
  b.setAttribute('aria-expanded', 'true');
  card = el;
  // garder la carte entière à l'écran sans perdre le nœud de vue
  const sc = wrap.closest('.scroll');
  if (sc) {
    // vague 21 (doigt : Anas) : la bulle ne passe plus sous le bandeau « Voir » ni sous les onglets
    const sr = sc.getBoundingClientRect(), cr = { bottom: wr.top + el.offsetTop + el.offsetHeight };   // taille réelle : la bulle entre en grandissant
    const scr = sc.closest('.screen') || document;
    const bas = Math.min(sr.bottom, ...[...scr.querySelectorAll('.next-panel, .tabbar, .tabs')].map((x) => x.getBoundingClientRect()).filter((r) => r.height && r.top > sr.top + 40).map((r) => r.top));
    if (cr.bottom > bas - 8) sc.scrollBy({ top: Math.min(cr.bottom - bas + 16, nr.top - sr.top - 8), behavior: reduced() ? 'auto' : 'smooth' });
  }
  setTimeout(() => el.querySelector('.btn').focus({ preventScroll: true }), 0);
}
// Rideau, aux temps lus image par image sur la vidéo de référence (refs/ANIMATIONS-REFERENCE.md, section 2) :
// relâché → bandeau sur toute la largeur en 0,07 s → écran couvert à 0,20 s → l'étape entre par la droite (25 px, 0,27 s, sans rebond).
// La pause blanche de 0,4 s de la référence est un temps de chargement : on ne la copie pas.
// Minuteries et transitions CSS : rien ne reste bloqué si l'onglet est en arrière-plan.
function curtain(from, href) {
  if (reduced() || !from) return go(href);
  const app = document.getElementById('app'), a = app.getBoundingClientRect(), r = from.getBoundingClientRect(), k = a.width / app.offsetWidth || 1;
  const top = (r.top - a.top) / k, h = r.height / k;
  const o = document.createElement('div'); o.className = 'curtain'; o.setAttribute('aria-hidden', 'true');
  o.innerHTML = Array.from({ length: 7 }, (_, i) => `<i style="left:${8 + ((i * 29) % 84)}%;top:${12 + ((i * 41) % 70)}%;--d:${i * 12}ms"></i>`).join('');
  Object.assign(o.style, { left: (r.left - a.left) / k + 'px', top: top + 'px', width: r.width / k + 'px', height: h + 'px' });
  app.appendChild(o); void o.offsetWidth;
  Object.assign(o.style, { left: '0px', width: '100%', top: top - 20 + 'px', height: h + 40 + 'px', borderRadius: '0px' });
  setTimeout(() => { o.classList.add('full'); Object.assign(o.style, { top: '0px', height: '100%' }); }, 80);
  setTimeout(() => go(href, { cut: true }), 200);
  setTimeout(() => {
    const scr = [...app.querySelectorAll(':scope > .screen')].pop();
    if (scr) { scr.classList.add('from-right'); scr.addEventListener('animationend', (e) => { if (e.target === scr) scr.classList.remove('from-right'); }); }
    o.classList.add('out');
  }, 250);
  setTimeout(() => o.remove(), 420);
}
document.addEventListener('pointerdown', (e) => { if (card && !card.contains(e.target) && !e.target.closest('.node')) closeCard(); }, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && card) { const n = document.querySelector(`.node[data-i="${card.dataset.for}"]`); closeCard(); n && n.focus(); } });
window.addEventListener('hashchange', () => closeCard(true));

// Maison 3D : seulement ici, chargée à la demande ; dessin SVG gardé si WebGL manque ou si le mouvement est réduit.
function mountHouse(box, opts) {
  const reduce = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!box || reduce) {
    if (box) box.dataset.house3d = 'svg:mouvement-reduit';
    import('../house3d.js').then(m => m.disposeHouse3D());
    return;
  }
  import('../house3d.js').then(m => {
    if (!box.isConnected) return;
    if (!m.supported() || !m.mountHouse3D(box, opts)) box.dataset.house3d = 'svg:sans-webgl';
  }).catch(() => { box.dataset.house3d = 'svg:erreur'; });
}

// Pastille de zellige : étoile à 8 branches (deux carrés croisés), 8 petits carreaux autour, cœur qui porte l'icône.
const ZEL = `<svg class="zel" viewBox="0 0 76 76" aria-hidden="true"><circle class="z-ring" cx="38" cy="38" r="34.5"/><g class="z-pet">${Array.from({ length: 8 }, (_, k) => `<rect x="34" y="6.5" width="8" height="8" transform="rotate(${k * 45 + 22.5} 38 38) rotate(45 38 10.5)"/>`).join('')}</g><g class="z-star"><rect x="17" y="17" width="42" height="42" rx="1.5"/><rect x="17" y="17" width="42" height="42" rx="1.5" transform="rotate(45 38 38)"/></g><circle class="z-core" cx="38" cy="38" r="16.5"/></svg>`;
// ---------- Décor vivant du chemin, version 2 (11 nov. au soir) : les dessins sont dans js/decor.js ----------
// Une grande scène du côté libre de chaque rangée (palmiers, mur en cours, grue, petite maison, bétonnière), posée sur son socle ;
// les deux autres cigognes du chantier sur leur propre socle (le client suit depuis son transat, l'entreprise plante un piquet
// au marteau, le contrôleur porte casque jaune et gilet) ; un petit remplissage au bord quand la pastille est au milieu.
function pathDecor(p, r, workerRow) {
  const n = p.steps.length; let out = '', k = 0, q = 0; const extra = ['client', 'entreprise', 'controleur'].filter(x => x !== r);
  for (let i = 0; i < n; i++) {
    const L = LEFTS[i % LEFTS.length], side = L <= 50 ? 'r' : 'l';
    if (i !== workerRow) {
      let inner, cls = '';
      if (Math.abs(i - workerRow) >= 2 && extra.length) {
        const who = extra.shift(); cls = ' bird ' + who;
        // Décor v3 (18 nov.) : chaque cigogne a sa tenue et son geste de chantier, sur son îlot, en vidéo en boucle.
        inner = decorVideo(who === 'entreprise' ? 'bellarej-batit' : who === 'controleur' ? 'bellarej-macon' : 'bellarej-attend');
      } else inner = decorScene(k++);
      out += `<div class="dc ${side}${cls}" style="top:${i * ROW + 2}px;--row:${i}">${inner}</div>`;
    }
    if (L >= 44 && L <= 60 && n > 1) out += `<div class="dc-fill ${side === 'r' ? 'l' : 'r'}" style="top:${i * ROW + 76}px;--row:${i}">${decorFiller(q++)}</div>`;  // q : les cailloux alternent d'un remplissage au suivant
  }
  return `<div class="path-decor" aria-hidden="true">${out}</div>`;
}
// Carreau du chemin : étoile à huit branches (choix de l'utilisateur, 11 nov.). Classes : .d tranche, .f1 fond, .f2 motif, .f3 cabochon.
const TILE = `<svg viewBox="0 0 40 46"><g class="d" transform="translate(0 5)"><rect x="7" y="7" width="26" height="26" rx="1.5"/><rect x="7" y="7" width="26" height="26" rx="1.5" transform="rotate(45 20 20)"/></g><g class="f1"><rect x="7" y="7" width="26" height="26" rx="1.5"/><rect x="7" y="7" width="26" height="26" rx="1.5" transform="rotate(45 20 20)"/></g><circle class="f2" cx="20" cy="20" r="8.5"/><path class="f3" d="M20 14 l1.8 4.2 l4.2 1.8 l-4.2 1.8 l-1.8 4.2 l-1.8 -4.2 l-4.2 -1.8 l4.2 -1.8 Z"/></svg>`;
// Pose des carreaux, une fois l'écran dessiné : on MESURE les boutons, l'anneau de l'étape en cours et la bulle, puis on trace
// entre deux boutons une courbe douce qui les évite, et on y pose les carreaux à intervalle régulier. Aucun carreau ne monte
// sur un bouton, sur l'anneau ou sous la bulle, quelle que soit la largeur de l'écran (retour de l'utilisateur, 11 nov.).
// Remerciement après un avis public (12 nov.) : Bellarej salue, quelques éclats, puis l'écran se referme tout seul. Pas de flamme :
// ce n'est pas une étape validée. « Réduire les animations » : le panneau s'affiche sans mouvement et se ferme au toucher.
function merci() {
  const app = document.getElementById('app'); if (app.querySelector('.merci')) return;
  const o = document.createElement('div'); o.className = 'merci'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Merci pour votre avis');
  o.innerHTML = `<div class="merci-in"><span class="su-burst" aria-hidden="true">${'<i></i>'.repeat(14)}</span><span class="merci-bird">${bellarej('felicite', 170)}</span>
    <h2>Merci pour votre avis !</h2><p>Il est publié sur la fiche de l'entreprise, avec sa provenance. Vous pouvez le retirer quand vous voulez.</p><button class="btn block">Continuer</button></div>`;
  app.appendChild(o); sfx('valide'); navigator.vibrate && navigator.vibrate([12, 40, 18]);
  const close = () => { o.classList.add('bye'); setTimeout(() => o.remove(), 240); };
  o.addEventListener('click', close); o.querySelector('button').focus({ preventScroll: true }); setTimeout(() => o.isConnected && close(), 4200);
}

function layTiles(root) {
  // 12 nov. (midi) : plus aucune mesure à l'écran. Safari sur iPhone ne mesure pas comme Chrome les boutons agrandis (propriété zoom),
  // et les carreaux se posaient de travers. Tout se calcule maintenant à partir de nombres sûrs : la largeur du chemin, le haut de
  // chaque rangée, et les tailles fixes du bouton (40 × 48 autour de son centre), de l'anneau (rayon 62) et de la bulle.
  const wrap = root.querySelector('.path-wrap'); if (!wrap) return;
  wrap.querySelectorAll('.tl').forEach((t) => t.remove());
  const W = wrap.offsetWidth || 1, rows = [...wrap.querySelectorAll('.path-row')];
  const zones = rows.map((row) => { const top = row.offsetTop, cx = (+row.dataset.x || 50) / 100 * W, ring = row.dataset.ring === '1', [bh, bx] = (row.dataset.bub || '').split(',').map(Number);
    return { row, c: { cx, cy: top + 69 }, keep: ring ? { cx, cy: top + 71, rx: 76, ry: 76 } : { cx, cy: top + 69, rx: 52, ry: 60 }, bub: bh ? { cx: cx + bx * 1.12, cy: top - 2, rx: bh * 1.12 + 12, ry: 30 } : null }; });
  const inside = (z, x, y) => ((x - z.cx) / z.rx) ** 2 + ((y - z.cy) / z.ry) ** 2 < 1;
  const inRect = (z, x, y) => Math.abs(x - z.cx) < z.rx && Math.abs(y - z.cy) < z.ry;
  const GAP = 25;
  let html = '';
  zones.forEach((A, i) => { const B = zones[i + 1], state = A.row.dataset.tiles; if (!B || !state) return;
    const side = Math.sign(A.c.cx - B.c.cx) || 1;
    let pts = null;
    // D'abord une courbe douce ; si elle passe sous la bulle du bouton suivant, on l'arrondit un peu plus du côté opposé.
    for (const bow of [8, 18, 28, 38, 50, 62]) {
      const P = (t) => ({ x: A.c.cx + (B.c.cx - A.c.cx) * t + side * bow * Math.sin(Math.PI * t), y: A.c.cy + (B.c.cy - A.c.cy) * t });
      const free = []; let len = 0, prev = null;
      for (let q = 0; q <= 240; q++) { const pt = P(q / 240); if (prev) len += Math.hypot(pt.x - prev.x, pt.y - prev.y); prev = pt;
        if (!inside(A.keep, pt.x, pt.y) && !inside(B.keep, pt.x, pt.y)) free.push({ ...pt, s: len, hit: !!(B.bub && inRect(B.bub, pt.x, pt.y)) }); }
      if (free.length < 2) continue;
      pts = free; if (!free.some((f) => f.hit)) break;
    }
    if (!pts) return;
    const runs = []; let cur = [];
    for (const f of pts) { if (f.hit) { if (cur.length) runs.push(cur); cur = []; } else cur.push(f); }
    if (cur.length) runs.push(cur);
    pts = runs.sort((a, b) => (b[b.length - 1].s - b[0].s) - (a[a.length - 1].s - a[0].s))[0] || []; if (pts.length < 2) return;
    const s0 = pts[0].s, s1 = pts[pts.length - 1].s, count = Math.max(1, Math.round((s1 - s0) / GAP) + 1);
    for (let j = 0; j < count; j++) { const want = count === 1 ? (s0 + s1) / 2 : s0 + (s1 - s0) * j / (count - 1); const pt = pts.reduce((a, b) => Math.abs(b.s - want) < Math.abs(a.s - want) ? b : a);
      html += `<i class="tl v2 ${state === 'todo' ? '' : 'on c' + (j % 3)} ${state === 'lay' ? 'lay' : ''}" style="left:${pt.x.toFixed(1)}px;top:${pt.y.toFixed(1)}px;--i:${j}" aria-hidden="true">${TILE}</i>`; }
  });
  wrap.insertAdjacentHTML('afterbegin', html);
}
const LEFTS = [50, 32, 24, 36, 58, 72, 64, 44];   // rythme sinueux (en % de largeur)
const ROW = 196;   // 178 avant le 11 nov. : les titres sous les pastilles ont été retirés (ils sont dans la bulle)

function nodeIcon(s, i) {
  if (s.status === 'verrouillee') return icon(STEP_ICONS[i % STEP_ICONS.length]);
  if (s.status === 'vue') return icon('eye');
  if (doneLike(s)) return icon('check');
  if (s.status === 'refusee') return icon('close');
  if (s.status === 'fin_declaree') return icon('hourglass');
  if (s.status === 'retardee') return icon('alert');
  if (s.status === 'correction_soumise') return icon('image');
  return icon(STEP_ICONS[i % STEP_ICONS.length]);
}

function bubbleText(role, p, s) {
  if (p.status === 'clos') return null;
  if (coulageDue(p, s)) return role === 'entreprise' ? 'COULAGE À DÉCLARER' : 'COULAGE À VENIR';
  if (s.status === 'a_venir') return role === 'entreprise' ? 'DÉBUTER' : 'À DÉBUTER';
  if (s.status === 'debutee') return 'EN COURS';
  if (s.status === 'fin_declaree' && !isControlled(s)) return role === 'client' ? 'À CONSULTER' : 'DÉCLARÉE';
  if (s.status === 'fin_declaree') return s.mission && mPend(s) ? (role === 'controleur' ? 'MISSION PROPOSÉE' : 'VISITE DEMANDÉE') : role === 'controleur' ? 'VÉRIFIER' : 'VISITE ATTENDUE';
  if (s.status === 'refusee') return role === 'entreprise' ? 'À REPRENDRE' : 'REFUSÉE';
  if (s.status === 'retardee') return role === 'entreprise' ? 'CORRIGER' : 'RÉSERVES';
  if (s.status === 'correction_soumise') return role === 'client' ? 'VOIR LA CORRECTION' : 'CORRECTION ENVOYÉE';
  return null;
}

// Prochaine action selon le rôle (panneau ancré, comme « UP NEXT »).
function nextAction(role, p) {
  if (p.status === 'clos') return { text: 'Chantier clôturé · rapport archivé', btn: 'Rapport', go: `#/c/${p.id}/report`, ic: 'archive' };
  const acc = access(p, role);
  if (acc !== 'ok') return { text: 'Accès non actif pour ce rôle', btn: 'Invitation', go: `#/invite/${p.id}/${role}`, ic: 'link' };
  const s = currentStep(p);
  const base = `#/c/${p.id}/step/${s.id}`;
  // Vague 20 (doigt : Youssef) : sans entreprise invitée, rien ne peut avancer : c'est la première action, en clair.
  if (role === 'client' && p.status !== 'clos' && p.invites.entreprise && p.invites.entreprise.status === 'non_creee') return { text: 'Votre entreprise n’est pas encore invitée', btn: 'Inviter', go: `#/c/${p.id}/share`, ic: 'users', saffron: true };
  // M03 : tant que la convention n'est pas acceptée des deux côtés, c'est la première chose à faire.
  if (p.convention && !conventionOk(p) && (role === 'client' || role === 'entreprise')) return p.convention[role]
    ? { text: `Convention acceptée · en attente ${role === 'client' ? "de l'entreprise" : 'du client'}`, btn: 'Voir', go: `#/c/${p.id}/convention`, ic: 'file' }
    : { text: 'Convention à lire et à accepter avant les travaux', btn: 'Lire', go: `#/c/${p.id}/convention`, ic: 'file', saffron: true };
  // Problème 10 : un délai dépassé se dit tout de suite (« En retard »).
  const late = overdue(p, s), lateP = overdue(p, null);
  const allDone = p.steps.every(doneLike), blockers = closeBlockers(p);
  if (role === 'client') {
    if (abandonDue(p)) return { text: `Arrêt du chantier : ${ABANDON_J} jours sans activité de l'entreprise`, btn: 'Choisir', go: `#/c/${p.id}/share`, ic: 'alert', saffron: true };
    if (can(role, p, null, 'close')) return { text: 'Toutes les étapes sont closes', btn: 'Réception', go: `#/c/${p.id}/close`, ic: 'archive', saffron: true };
    if (lateP.includes('invitation')) return { text: `En retard · ${DELAI_LABEL.invitation}`, btn: 'Relancer', go: `#/c/${p.id}/share`, ic: 'clock', saffron: true };
    if (s.status === 'correction_soumise') return { text: `Correction apportée sur « ${s.title} »`, btn: 'Consulter', go: base, ic: 'image', saffron: true };
    if (can(role, p, s, 'ack')) return { text: `Fin déclarée, sans contrôle : « ${s.title} »`, btn: 'Consulter', go: base, ic: 'eye', saffron: true };
    const toDecide = p.steps.find(x => can(role, p, x, 'decide'));
    if (toDecide) return { text: `Payer ou attendre : ${trancheName(p, toDecide)}`, btn: 'Décider', go: `#/c/${p.id}/step/${toDecide.id}`, ic: 'pen', saffron: true };
    const avP = (p.avenants || []).find(a => a.status === 'propose' && a.by !== role);
    if (avP) return { text: `Avenant à examiner : « ${avP.title} »`, btn: 'Voir', go: `#/c/${p.id}/avenants`, ic: 'file', saffron: true };
    // Problème 8 : étapes closes mais réception impossible → dire ce qui manque.
    if (allDone && blockers.length) return { text: `Avant la réception : ${blockers[0]}`, btn: 'Voir', go: `#/c/${p.id}/close`, ic: 'wallet' };
    if (late.length) return { text: `En retard · ${DELAI_LABEL[late[0]]} : « ${s.title} »`, btn: 'Voir', go: base, ic: 'clock', saffron: true };
    // Horloge des visites (19 nov.) : le client voit l'échéance de la visite demandée à la fin déclarée.
    const m = s.mission;
    if (isControlled(s) && m && ['proposee', 'acceptee'].includes(m.status) && m.dueAt && ['fin_declaree', 'correction_soumise'].includes(s.status))
      return { text: m.escalated ? `TEEQA choisit une autre agence : « ${s.title} »` : `Visite au plus tard le ${fmtDate(visitBy(m))}`, btn: 'Voir', go: base, ic: 'calendar' };
    if (p.invites.controleur.status !== 'acceptee' && p.steps.some(isControlled)) return { text: p.invites.controleur.status === 'non_creee' ? 'Contrôleur : TEEQA le missionnera après la convention' : 'Contrôleur missionné par TEEQA', btn: 'Voir', go: `#/c/${p.id}/share`, ic: 'shield' };
    return { text: `${STATUS[statusKey(s, p)].label}`, btn: 'Voir', go: base, ic: STATUS[statusKey(s, p)].icon };
  }
  if (role === 'entreprise') {
    if (can(role, p, null, 'resume')) return { text: `Arrêt du chantier signalé par le client · reprendre avant le ${fmtDate(abandonLimite(p))}`, btn: 'Répondre', go: `#/c/${p.id}/share`, ic: 'alert', saffron: true };
    const cou = p.steps.find(x => can(role, p, x, 'coulage'));
    if (cou) return { text: `Ferraillage contrôlé : coulage de « ${cou.title} » à déclarer`, btn: 'Déclarer', go: `#/c/${p.id}/step/${cou.id}`, ic: 'camera', saffron: true };
    if (can(role, p, s, 'declareStart')) return { text: `« ${s.title} » est prête`, btn: 'Débuter', go: base, ic: 'play', saffron: true };
    if (can(role, p, s, 'declareEnd')) return { text: s.status === 'refusee' ? `Avis Refusé : « ${s.title} » à reprendre` : `« ${s.title} » en cours`, btn: holdPoint(p, s) ? 'Ferraillage prêt' : 'Déclarer la fin', go: base, ic: 'flag', saffron: true };
    if (can(role, p, s, 'correction')) return { text: `Réserves sur « ${s.title} »`, btn: 'Corriger', go: base, ic: 'camera', saffron: true };
    const paid = p.steps.find(x => can(role, p, x, 'confirmPayment'));
    if (paid) return { text: `Paiement indiqué : « ${paid.title} »`, btn: 'Confirmer', go: `#/c/${p.id}/step/${paid.id}`, ic: 'wallet', saffron: true };
    const avP = (p.avenants || []).find(a => a.status === 'propose' && a.by !== role);
    if (avP) return { text: `Avenant à examiner : « ${avP.title} »`, btn: 'Voir', go: `#/c/${p.id}/avenants`, ic: 'file', saffron: true };
    if (allDone) return { text: blockers.length ? `Avant la réception : ${blockers[0]}` : 'Réception des travaux : en attente du client', btn: 'Voir', go: `#/c/${p.id}/close`, ic: 'archive' };
    if (late.length) return { text: `En retard · ${DELAI_LABEL[late[0]]} : « ${s.title} »`, btn: 'Voir', go: base, ic: 'clock' };
    return { text: STATUS[statusKey(s, p)].label, btn: 'Voir', go: base, ic: STATUS[statusKey(s, p)].icon };
  }
  const tard = late.length ? `En retard · ${DELAI_LABEL[late[0]]} · ` : '';
  if (s.status === 'fin_declaree' && !isControlled(s)) return { text: 'Étape sans visite de contrôle', btn: 'Voir', go: base, ic: 'eye' };
  if (s.status === 'fin_declaree') {
    if (can(role, p, s, 'acceptMission')) return { text: `${tard}Mission proposée par TEEQA : « ${s.title} »`, btn: 'Voir la mission', go: base, ic: 'shield', saffron: true };
    if (can(role, p, s, 'review')) return { text: `${tard}Photos prises sur place`, btn: "Rédiger l'avis", go: `${base}/review`, ic: 'pen', saffron: true };
    if (can(role, p, s, 'photoControl')) return { text: `${tard}${endWord(p, s)} : « ${s.title} »`, btn: 'Photographier', go: `${base}/camera`, ic: 'camera', saffron: true };
    return { text: `${tard}${endWord(p, s)} : « ${s.title} »`, btn: 'Voir', go: base, ic: 'hourglass' };
  }
  if (can(role, p, s, 'verifyCorrection')) return { text: `${tard}Correction à vérifier : « ${s.title} »`, btn: 'Vérifier', go: base, ic: 'image', saffron: true };
  return { text: tard + STATUS[statusKey(s, p)].label, btn: 'Voir', go: base, ic: STATUS[statusKey(s, p)].icon };
}

// M03 : état de la convention, en une ligne.
const conventionState = (p) => conventionOk(p) ? `Acceptée par le client le ${fmtDate(p.convention.client)} et par l'entreprise le ${fmtDate(p.convention.entreprise)}`
  : p.convention.client ? "Acceptée par le client · en attente de l'entreprise" : p.convention.entreprise ? "Acceptée par l'entreprise · en attente du client" : 'À lire et à accepter par le client et l\'entreprise';
// M02 : type et adresse du chantier, en une ligne.
const prepLine = (p) => [SITE_TYPES[p.prep.type] ? SITE_TYPES[p.prep.type].label : '', p.prep.address, p.prep.proprietaire ? `terrain de ${p.prep.proprietaire}` : ''].filter(Boolean).join(' · ');
// « Vérifiée » : seulement une étape validée sur place par le contrôleur (panel du 19 nov.). Une correction sur photo, une étape
// consultée sans visite ou la formule Suivi ne sont jamais dites vérifiées.
const onSite = (p) => p.steps.filter(s => isControlled(s) && s.status === 'validee').length;
const allVerified = (p) => allControlled(p) && p.steps.length > 0 && onSite(p) === p.steps.length;
// Compteur : « closes » partout, comme l'accueil (vague 2 du panel) ; « vérifiées » reste réservé à la fin, toutes validées sur place.
const closedWord = () => 'closes';
// Arrêt du chantier (19 nov., 21 jours depuis le 26 nov.) : signalé par le client ; 21 jours sans activité de l'entreprise ; ensuite, le client choisit la suite.
const abandonOpen = (p) => !!(p.abandon && !p.abandon.resumedAt);
function abandonBlock(p, r) {
  if (p.status === 'clos') return '';
  if (abandonOpen(p)) {
    const due = abandonDue(p);
    return `<div class="notice ${due ? '' : 'saffron'}" data-testid="abandon">${icon('alert', 'sm')}<span><b>Arrêt du chantier signalé le ${fmtDate(p.abandon.at)}</b>${p.abandon.motif ? ` : « ${esc(p.abandon.motif)} »` : ''}. ${due ? `L'entreprise n'a pas repris les travaux : ${ABANDON_J} jours sans activité.` : `L'entreprise peut reprendre les travaux jusqu'au ${fmtDate(abandonLimite(p))} (${ABANDON_J} jours sans activité, comme le prévoit le workflow).`} <span data-testid="abandon-suite">Après ${ABANDON_J} jours sans activité : état des lieux contradictoire (photos, travail fait et payé), puis une autre entreprise peut reprendre le chantier là où il en est, ou réception en l'état.</span> TEEQA date et garde la trace ; il ne tranche pas.</span></div>
      <p class="meta" style="margin:0" data-testid="arret-mesures">Sans attendre les 21 jours : photographiez l’état du chantier (photos datées). Aucun jour n’est ajouté si l’entreprise répond avant. ${esc(REGLES.protection)}</p>
      ${r === 'client' && !p.constatArret ? `<button class="btn sm ghost" style="justify-self:start" data-act="constat-arret" data-testid="constat-arret">${icon('pin', 'sm')}Demander une visite de constat (${dh(TARIFS.visite.dh)}, payée par vous)</button>` : ''}
      ${p.constatArret ? `<div class="meta" data-testid="constat-arret-etat"><b>Visite de constat demandée le ${fmtDate(p.constatArret.at)}</b> : un contrôleur de l’agence décrit et date l’état du chantier, sans trancher ; son constat est joint à l’état des lieux de reprise.</div>` : ''}
      ${can(r, p, null, 'resume') ? `<button class="btn saffron block" data-act="resume" data-testid="resume">${icon('play', 'sm')}Reprendre les travaux</button>` : ''}
      ${due && r === 'client' ? `<div class="list"><button class="list-item" data-go="#/c/${p.id}/share" data-testid="abandon-change"><span class="ico-tile saffron">${icon('refresh')}</span><span class="grow"><span class="t">Changer d'entreprise</span><div class="s">Inviter une autre entreprise pour finir le chantier</div></span>${icon('chevron', 'sm chev')}</button>
        <button class="list-item" data-go="#/c/${p.id}/close" data-testid="abandon-close"><span class="ico-tile">${icon('archive')}</span><span class="grow"><span class="t">Réception en l'état</span><div class="s">Avec un constat des étapes non terminées</div></span>${icon('chevron', 'sm chev')}</button></div>` : ''}`;
  }
  return can(r, p, null, 'abandon') ? `<div class="list"><button class="list-item" data-act="abandon" data-testid="abandon-declare"><span class="ico-tile">${icon('alert')}</span><span class="grow"><span class="t">Signaler un arrêt du chantier</span><div class="s">Plus personne sur le chantier ? Après 21 jours sans activité de l'entreprise, vous pourrez en changer</div></span>${icon('chevron', 'sm chev')}</button></div>` : '';
}
// Feuille à motif obligatoire (arrêt du chantier, récusation du contrôleur).
function motifSheet({ title, body, label, placeholder, confirm, onOk }) {
  openSheet(`<h2>${title}</h2><div class="notice" style="margin:10px 0 14px">${icon('info', 'sm')}<span>${body}</span></div>
    <div class="field"><label for="mt-text">${label}</label><textarea id="mt-text" class="input" rows="3" style="width:100%;box-sizing:border-box;height:auto;padding-top:12px;padding-bottom:12px" placeholder="${placeholder}"></textarea></div>
    <div class="stack" style="margin-top:14px"><button class="btn saffron block" data-mt-ok disabled>${confirm}</button><button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`,
  { label: title, onMount: (el) => { const t = el.querySelector('#mt-text'), ok = el.querySelector('[data-mt-ok]');
    t.addEventListener('input', () => { ok.disabled = !t.value.trim(); });
    ok.addEventListener('click', () => { const m = t.value.trim(); if (!m) return; closeSheet(true); onOk(m); }); } });
}
const abandonOn = (p, back) => ({
  abandon() { motifSheet({ title: 'Signaler un arrêt du chantier', body: "L'entreprise est prévenue. Après 21 jours sans aucune activité de sa part (photo, déclaration, message), comptés depuis sa dernière activité, vous pourrez changer d'entreprise ou faire la réception en l'état.", label: 'Ce que vous constatez (obligatoire)', placeholder: 'Ex. : plus personne sur le chantier depuis trois semaines.', confirm: "Signaler l'arrêt",
    onOk: (m) => { actions.declareAbandon(p.id, m); toast("Arrêt signalé à l'entreprise", 'send'); go(back, { replace: true }); } }); },
  'constat-arret'() { motifSheet({ title: 'Visite de constat', body: `${REGLES.constat.replace('sur une étape close, si un désordre apparaît (fissure, infiltration)', 'à l’arrêt du chantier')}`, label: 'Ce qu’il faut décrire (10 caractères au moins)', placeholder: 'Ex. : état des murs du 1er étage et des aciers en attente', confirm: 'Demander la visite',
    onOk: (m) => { actions.askConstatArret(p.id, m); toast('Visite de constat demandée · un contrôleur décrira sans trancher', 'send'); go(back, { replace: true }); } }); },
  resume() { confirmSheet({ title: 'Reprendre les travaux ?', body: 'Le client est prévenu que vous reprenez le chantier.', confirm: 'Reprendre',
    onConfirm: () => { actions.resumeWork(p.id); sfx('pose'); toast('Reprise des travaux indiquée au client', 'check'); go(back, { replace: true }); } }); },
});
// Vague 3 : un proche du client (famille sur place, conjoint…) en lecture seule. Pas un rôle : il ne décide ni ne paie.
const coDecideursN = (p) => (p.proches || []).filter(x => x.role === 'codecideur').length;
function procheBlock(p, open) {
  // Vague 8 : un proche reste en lecture seule, ou devient co-décideur par délégation explicite du client (droits cochés un par un).
  const list = p.proches || [];
  const droitsTxt = (x) => { const d = Object.keys(DROITS).filter(k => x.droits && x.droits[k]).map(k => DROITS[k].toLowerCase()); return d.length ? `Co-décideur : ${d.join(', ')}` : "Lecture seule : voit l'avancement et les avis"; };
  return `<div class="section-title" style="margin-bottom:0"><span class="over">Proches · famille</span><span class="meta">${list.length}</span></div>
    <div class="list" data-testid="proches">${list.map(x => `<div class="list-item" style="align-items:flex-start"><span class="ico-tile ${x.role === 'codecideur' ? 'success' : ''}">${icon(x.role === 'codecideur' ? 'users' : 'eye')}</span><span class="grow"><span class="t">${esc(x.name)}${x.lien ? ` <span class="muted">· ${esc(x.lien)}</span>` : ''}</span><div class="s" data-testid="proche-droits">${esc(droitsTxt(x))}</div><div class="meta">Invité le ${fmtDate(x.at)}${x.delegueAt ? ` · délégation du ${fmtDate(x.delegueAt)}` : ''}</div>
      ${open ? `<div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn sm ghost" data-act="proche-droits" data-id="${x.id}" data-testid="proche-droits-btn">${icon('users', 'sm')}Droits</button><button class="btn sm ghost" data-act="proche-del" data-id="${x.id}" aria-label="Retirer l'accès de ${esc(x.name)}">Retirer</button></div>` : ''}</span></div>`).join('')}
      ${open ? `<button class="list-item" data-act="proche-add" data-testid="proche-add"><span class="ico-tile saffron">${icon('plus')}</span><span class="grow"><span class="t">Inviter un proche</span><div class="s">En lecture seule, ou co-décideur si vous lui déléguez des droits (paiements, échanges, photos)</div></span>${icon('chevron', 'sm chev')}</button>` : ''}</div>
    ${open ? fold('Un parent qui ne lit pas ?', 'Lecture seule, et « Tout écouter » dans son Profil : chaque écran est lu à voix haute', `<p class="meta" style="margin:0" data-testid="parent-vocal">Invitez-le en lecture seule : son lien s’ouvre sans mot de passe, dans sa langue, et l’appli lui lit l’avancement à voix haute (bouton Écouter), en tachelhit, tarifit ou tamazight aussi.</p>`, 'parent-vocal-fold') : ''}
    <p class="meta" style="margin:0">L'entreprise voit qui décide des paiements : ${esc(decideursLine(p))}.</p>
    <div class="card stack" style="gap:8px" data-testid="suppleant"><span class="over">Si vous êtes empêché</span>
      ${p.empeche && !p.empeche.finAt ? `<div class="notice saffron" data-testid="empeche-actif">${icon('alert', 'sm')}<span><b>Titulaire empêché depuis le ${fmtDate(p.empeche.at)}</b>${get().role === 'client' ? ` (${esc(p.empeche.motif)})` : ''} : ${esc(p.empeche.suppleant || 'TEEQA attend le justificatif d’un proche')}${p.empeche.suppleant ? ' décide à votre place' : ''}. Retard des tranches suspendu.</span></div>${open ? `<button class="btn sm ghost" data-act="fin-empeche" data-testid="fin-empeche">Je reprends la main</button>` : ''}` : open ? `<button class="btn sm ghost" data-act="empeche" data-testid="empeche-btn">${icon('alert', 'sm')}Déclarer le titulaire empêché</button>` : ''}
      <p class="meta" style="margin:0" data-testid="code-prete"><b>Ne prêtez pas votre téléphone ni le code de connexion reçu par SMS</b> : désignez un suppléant ; ses gestes seront signés de son nom, pas du vôtre.</p>
      ${fold('Les règles en détail', 'Suppléant, consigne d’un proche', `<p class="meta" style="margin:0">${esc(REGLES.suppleant)}</p><p class="meta" style="margin:0">${esc(REGLES.consigneProche)} ${esc(REGLES.consigneSuite)}</p>`, 'suppleant-regles')}</div>
    <div class="card stack" style="gap:8px" data-testid="evenements-graves"><span class="over">Si un événement grave arrive</span>${faillesListe(p.id, get().role)}</div>
    ${coDecideursN(p) ? `<p class="meta" style="margin:0" data-testid="regle-decideurs">${esc(REGLES.decideurs.replace('le client titulaire du chantier', `le client titulaire du chantier (${ROLES.client.name})`))}</p>` : ''}`;
}
// Vague 8 : feuille des droits d'un proche (délégation explicite du client).
function procheDroitsSheet(p, x) {
  openSheet(`<h2>Droits de ${esc(x.name)}</h2>
    <p class="muted small" style="margin-bottom:12px">Sans case cochée, ${esc(x.name)} suit le chantier en lecture seule. Chaque case est une délégation de votre part : ses gestes sont signés de son nom, l'entreprise le voit. Vous pouvez la retirer à tout moment.</p>
    <div class="chips" role="group" aria-label="Profils prêts" data-testid="droits-profils" style="margin-bottom:8px"><button class="chip outline" data-preset="">Voir seulement</button><button class="chip outline" data-preset="ecrire photos">Voir et écrire</button><button class="chip outline" data-preset="payer ecrire photos ordres avenant">Décider avec moi</button></div>
    <div class="list">${Object.entries(DROITS).map(([k, t]) => `<label class="list-item" style="cursor:pointer"><input type="checkbox" data-dr="${k}" ${x.droits && x.droits[k] ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--success)"><span class="grow"><span class="t">${t}</span><div class="s">${k === 'payer' ? "Indiquer « J'ai payé cette tranche » ou « Je préfère attendre » à votre place" : k === 'ecrire' ? 'Poser des questions, répondre, contester dans les échanges' : k === 'ordres' ? "Donner des consignes à l'entreprise sur le chantier, en votre nom" : k === 'avenant' ? 'Accepter ou refuser un avenant (travaux en plus) à votre place' : 'Ajouter des photos prises sur place (elles restent signées de son nom)'}</div></span></label>`).join('')}</div>
    <p class="meta" style="margin-top:10px">${esc(REGLES.decideurs)} ${esc(REGLES.procheVisite)}</p>
    <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-dr-ok data-testid="proche-droits-ok">Enregistrer</button></div>`, { label: 'Droits du proche',
    onMount: (el) => (el.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); const on = b.dataset.preset.split(' '); el.querySelectorAll('[data-dr]').forEach(c => { c.checked = on.includes(c.dataset.dr); }); })), el.querySelector('[data-dr-ok]').addEventListener('click', () => { const d = {}; el.querySelectorAll('[data-dr]').forEach(c => { d[c.dataset.dr] = c.checked; }); actions.setProcheDroits(p.id, x.id, d); closeSheet(true); toast(Object.values(d).some(Boolean) ? 'Délégation enregistrée · entreprise prévenue' : 'Lecture seule', 'check'); go(`#/c/${p.id}/share`, { replace: true }); })) });
}
// Vague 8 : l'équipe de l'entreprise dans les échanges (chef de chantier…), vue par le client et par l'entreprise.
function equipeBlock(p, r, open) {
  const list = p.equipe || [];
  if (r === 'controleur') return '';
  return `<div class="section-title" style="margin-bottom:0"><span class="over">Équipe de l'entreprise dans les échanges</span><span class="meta">${list.length}</span></div>
    <div class="list" data-testid="equipe">${list.map(x => `<div class="list-item"><span class="ico-tile">${icon('users')}</span><span class="grow"><span class="t">${esc(x.name)} <span class="muted">· ${esc(x.role)}</span></span><div class="s" data-testid="equipe-droits">${esc((EQUIPE_ROLES[x.role] || EQUIPE_ROLES['Chef de chantier']).droits.join(' · '))}</div></span></div>`).join('')}
    ${r === 'entreprise' && open ? `<button class="list-item" data-act="equipe-add" data-testid="equipe-add"><span class="ico-tile saffron">${icon('plus')}</span><span class="grow"><span class="t">Inviter un membre de mon équipe</span><div class="s">Chef de chantier, conducteur de travaux, ouvrier ou comptable : chacun avec ses droits, par SMS ou WhatsApp</div></span>${icon('chevron', 'sm chev')}</button>` : ''}</div>
    ${fold('Qui peut faire quoi dans l’équipe', 'Signé du nom de chacun', `<p class="meta" style="margin:0">Le patron garde la convention et le changement d'agence ; il peut déléguer les avenants à son conducteur de travaux. Ce que fait un membre de l'équipe est signé de son nom (« Nadia, comptable de Rachid BTP »). L'entreprise répond de ses équipes ; TEEQA ne vérifie ni l'âge ni l'identité de ses membres.</p>`, 'equipe-regles')}`;
}
// Vague 8 : état des lieux à la reprise par une nouvelle entreprise (contradictoire : l'entreprise décrit, le client signe).
function repriseBlock(p, r) {
  const rp = p.reprise; if (!rp || r === 'controleur') return '';
  return `<div class="card stack" style="gap:8px" data-testid="reprise"><span class="over"><b>État des lieux de reprise</b></span>
    <p class="meta" style="margin:0">Avant toute nouvelle étape : la nouvelle entreprise décrit ce qu'elle trouve, le client signe.${p.constatArret ? ` <span data-testid="edl-constat">Constat neutre d’un contrôleur, demandé le ${fmtDate(p.constatArret.at)}, joint à côté.</span>` : ''}</p>
    ${fold('Les règles de la reprise', 'Étape en cours, visite, tranche, garanties', `<ul class="losange"><li>Une étape finie par l'ancienne entreprise garde sa visite, sur ce travail-là, avec la même agence : elle est suspendue pendant le changement, puis reprend.</li><li>Une étape commencée et pas finie repart avec la nouvelle entreprise ; la part déjà faite, décrite dans l'état des lieux, se règle avec l'ancienne.</li><li>Chacun répond de ce qu'il a fait : l'ancienne de ses travaux (garantie décennale), la nouvelle de ce qu'elle reprend.</li><li>Un contrôleur peut faire l'état des lieux à la place de l'entreprise, à la demande du client (prix d'une visite).</li><li>La convention est acceptée à nouveau par la nouvelle entreprise ; le forfait déjà payé reste au chantier.</li><li data-testid="reprise-remise">Remise en état due à l’arrêt (aciers rouillés, enduit à refaire) : un avenant, avec sa cause écrite. TEEQA ne répartit pas ce coût entre l’ancienne entreprise, vous et la nouvelle : il le date et le garde.</li><li data-testid="reprise-especes">Paiement contesté par l’entreprise sortante dans sa réponse (par exemple des espèces sans reçu) : la somme est écrite « contestée » au dossier, ni confirmée ni tenue pour reçue ; vous ne la payez pas une seconde fois tant qu’un accord écrit, un médiateur ou un juge n’a rien décidé. Ce que chacun peut montrer compte : reçu signé, relevé, témoin. TEEQA date et garde, il ne tranche pas.</li><li data-testid="reprise-tardive">Réponse de l’ancienne entreprise arrivée après la clôture de l’état des lieux : ajoutée au dossier, datée, sans rouvrir l’état des lieux.</li><li>Bâti ancien ou rénové : la garantie de l’entreprise ne porte que sur ce qu’elle a refait.</li></ul>`)}
    <dl class="kv" style="margin:0"><dt>Entreprise</dt><dd>${rp.entrepriseAt ? `Décrit le ${fmtFull(rp.entrepriseAt)}${rp.photos ? ` · ${rp.photos} photos` : ''}${rp.note ? `<br><span class="meta">« ${esc(rp.note)} »</span>` : ''}` : 'À faire avant tout nouveau début'}</dd><dt>Client</dt><dd>${rp.clientAt ? `Signé le ${fmtFull(rp.clientAt)}` : rp.entrepriseAt ? 'À relire et signer' : '—'}</dd></dl>
    <p class="meta" style="margin:0" data-testid="regle-reprise">${esc(REGLES.reprise)}</p>
    ${rp.entrepriseAt ? `<div class="meta" data-testid="edl-sortante"><b>Réponse de l'entreprise sortante :</b> ${rp.sortante ? `« ${esc(rp.sortante.text)} » (${fmtFull(rp.sortante.at)})` : edlClos(p) ? `<span data-testid="edl-sans-reponse">8 jours à partir de l’état des lieux décrit par la nouvelle entreprise (${fmtDate(rp.entrepriseAt)}), passés le ${fmtDate(edlLimite(p))}, sans réponse : elle ne peut plus le contester dans TEEQA.${rp.clientAt ? ` Votre signature (${fmtDate(rp.clientAt)}) ne rouvre pas ce délai.` : ''}</span>` : `lien envoyé par TEEQA le ${fmtDate(rp.entrepriseAt)}, quand la nouvelle entreprise a décrit l’état des lieux ; elle peut répondre jusqu'au ${fmtDate(edlLimite(p))} (8 jours), que vous ayez signé ou non, sinon l'état des lieux est clos « sans réponse de l'entreprise »`}${!rp.sortante ? ` <span data-testid="edl-ecran-sortante">Son écran : l’état des lieux et ses photos, les paiements que vous avez indiqués, et trois réponses : « Je confirme », « Je conteste un paiement » (montant et motif) ou « J’ajoute une pièce » ; sa réponse s’ajoute ici, datée, sans rien effacer.</span>` : ''}</div>` : ''}
    ${(() => { const b = budgetOf(p); const fait = p.steps.map((x, i) => [x, i + 1]).filter(([x]) => ['validee', 'corrigee', 'vue'].includes(x.status)).map(([, n]) => n); const enCours = p.steps.map((x, i) => [x, i + 1]).filter(([x]) => ['debutee', 'fin_declaree', 'retardee', 'refusee', 'correction_soumise'].includes(x.status)).map(([, n]) => n);
      return `<p class="meta" style="margin:0" data-testid="edl-bilan"><b>En une ligne :</b> payé à l'entreprise sortante, indiqué par le client : ${b ? `${dh(b.paye)} (dont ${b.recu ? dh(b.recu) : 'rien'} confirmé reçu${b.paye - b.recu > 0 ? (edlClos(p) && !rp.sortante ? ` et <span data-testid="edl-tenu">${dh(b.paye - b.recu)} tenu pour reçu : ${esc(sortanteNom(p))} n’a pas répondu dans les 8 jours, ce montant ne se conteste plus dans TEEQA</span>` : rp.sortante ? ` ; ${dh(b.paye - b.recu)} : voir sa réponse ci-dessus` : ` ; ${dh(b.paye - b.recu)} à confirmer ou contester dans sa réponse, jusqu’au ${fmtDate(edlLimite(p))}`) : ''})` : 'non indiqué'} · constaté fait (avis ou déclaration consultée) : ${fait.length ? `étape${fait.length > 1 ? 's' : ''} ${fait.join(', ')}` : 'aucune étape'}${b && fait.length ? (() => { const ra = repriseArgent(p), du = ra ? ra.duSortante : b.lignes.filter(l => fait.includes(l.n)).reduce((a, l) => a + l.dh - (l.paye ? l.dh : l.partiel), 0); return du > 0 ? ` · <b data-testid="edl-du">encore dû à ${esc(sortanteNom(p))} : ${dh(du)}</b> (le même chiffre qu’au Budget)` : ' · travail constaté entièrement payé'; })() : ''}${enCours.length ? ` · ${enCours.map(n => `étape ${n} : ${p.steps[n - 1].status === 'fin_declaree' ? `fin déclarée, pas encore contrôlée : sa tranche (${dh(trancheDh(p, p.steps[n - 1]))})${pourSortante(p, p.steps[n - 1]) && repriseArgent(p) ? `, comprise dans ce qui est encore dû,` : ''} va à ${esc(sortanteNom(p))} après l’avis favorable` : 'en cours, non constatée'}`).join(' ; ')}` : ''}. TEEQA ne tranche pas.</p>`; })()}
    ${can(r, p, null, 'etatDesLieux') ? `<button class="btn saffron block" data-act="edl" data-testid="edl-btn">${icon('camera', 'sm')}Faire l'état des lieux</button>` : ''}
    ${repriseSuite(p)}
    ${can(r, p, null, 'etatDesLieuxClient') ? `<button class="btn saffron block" data-act="edl-client" data-testid="edl-client-btn">${icon('pen', 'sm')}Relire et signer l'état des lieux</button>` : ''}</div>`;
}
// Vague 21 (jury : 9 mentions) : la reprise jusqu'au bout, en quatre gestes datés, pour que chacun sache ce qui reste.
function repriseSuite(p) { const rp = p.reprise, ent = p.invites.entreprise, conv = p.convention || {}, susp = p.steps.find(x => x.mission && x.mission.status === 'suspendue');
  const pas = [["L'entreprise reprenante décrit ce qu'elle trouve", rp.entrepriseAt], ['Le client signe l’état des lieux', rp.clientAt], ["L'entreprise reprenante accepte la convention (avec ses justificatifs : décennale, registre de commerce)", ent.status === 'acceptee' && conv.entreprise ? conv.entreprise : null], [`Elle reconfirme le budget du reste à faire (${(() => { const t = p.steps.filter(x => !pourSortante(p, x)).map(x => p.steps.indexOf(x) + 1); return t.length ? `tranche${t.length > 1 ? 's' : ''} ${t.join(' et ')}, qui lui seront versées` : 'les tranches restantes' })()} ; les tranches du travail fini par l’entreprise sortante restent à celle-ci)`, p.budget && p.budget.entrepriseAt && p.budget.entrepriseAt > (rp.at || '') ? p.budget.entrepriseAt : null], [susp ? `La visite de l’étape ${p.steps.indexOf(susp) + 1} reprend, avec ${agenceEtape(p, susp)} (l’agence qui l’avait acceptée)` : 'Les visites et les tranches reprennent', !susp && conv.entreprise && conv.client ? conv.entreprise : null]];
  return `<ol class="reprise-suite" data-testid="reprise-suite">${pas.map(([t, at]) => `<li class="${at ? 'fait' : ''}">${icon(at ? 'checkCircle' : 'hourglass', 'xs')}<span>${t}${at ? ` · <span class="meta">${fmtDate(at)}</span>` : ''}</span></li>`).join('')}</ol>`; }
// Vague 20 (doigt : Youssef, Omar) : inviter son entreprise sans e-mail : WhatsApp, SMS ou lien à copier. Nom et numéro facultatifs.
// Vague 21 (jury n° 13, 6 mentions) : jamais d'adresse locale (127.0.0.1, localhost, réseau de la maison) dans un lien partagé.
// Adresse de la salle (Internet) si elle existe, sinon l'adresse de la page si elle est publique, sinon l'adresse publique de TEEQA.
const LOCALE = /^(127\.|localhost$|\[?::1\]?$|0\.0\.0\.0$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^.]+\.local$|[^.]+\.localhost$)/;
export const appBase = () => { try { const b = new URL(salleBase()); if (!LOCALE.test(b.hostname)) return b.origin + (b.origin === location.origin ? location.pathname.replace(/[^/]*$/, '') : '/'); } catch { /* rien */ } return 'https://teeqa.app/'; };
export const shareUrl = (p, x) => `${appBase()}#/c/${p.id}/report?lien=${x.id}`;
export const inviteUrl = (p) => `${appBase()}#/invite/${p.id}/entreprise`;
const inviteLinkBox = (p) => `<div class="linkbox" data-testid="invite-ent-link">${icon('link', 'sm')}<span data-notr>${esc(inviteUrl(p))}</span></div><button class="btn ghost block" data-act="ent-copy" data-testid="ent-copy">${icon('copy', 'sm')}Copier le lien d'invitation</button>`;
export const inviteEntCard = (p) => `<div class="card stack invite-ent" style="gap:10px" data-testid="invite-ent">
  <b style="font-size:17px">Inviter mon entreprise</b><p class="meta" style="margin:0">Elle reçoit un lien, crée son compte et accepte le chantier. Rien n'est envoyé tant que vous n'avez pas choisi.</p>
  <div class="field"><label for="ie-nom">Nom de l'entreprise (facultatif)</label><input id="ie-nom" class="input" autocomplete="off" placeholder="Ex. Atlas Bâtiment"></div>
  <div class="field"><label for="ie-tel">Téléphone ou e-mail (facultatif)</label><input id="ie-tel" class="input" inputmode="tel" autocomplete="off" placeholder="+212 6 … ou contact@…"></div>
  <button class="btn saffron block" data-act="ent-wa" data-testid="ent-wa">${icon('message', 'sm')}Inviter par WhatsApp</button>
  <div class="btn-row"><button class="btn ghost" data-act="ent-sms" data-testid="ent-sms">${icon('phone', 'sm')}SMS</button><button class="btn ghost" data-act="ent-copy" data-testid="ent-copy">${icon('copy', 'sm')}Copier le lien</button></div></div>`;
export function inviteEntOn(p, back) {
  const vals = () => ({ name: (document.getElementById('ie-nom') || {}).value || '', contact: (document.getElementById('ie-tel') || {}).value || '' });
  const msg = () => encodeURIComponent(`Bonjour, je suis mon chantier « ${p.name} » (${p.city}) avec TEEQA. Ouvrez ce lien pour accepter d'y déclarer les étapes : ${inviteUrl(p)}`);
  // Vague 25 (doigt : Bilal) : la confirmation se voit en entier (la carte « Invitation envoyée » est amenée sous la barre, sans saut brusque), et Bellarej félicite.
  const done = (canal, t) => { actions.inviteEntreprise(p.id, { ...vals(), canal }); go(back, { replace: true }); recompense(t); requestAnimationFrame(() => { const c = document.querySelector('#app .screen:last-of-type [data-testid="invite-envoyee"]'); if (c) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); }); };
  return {
    'ent-wa'() { const v = vals(), n = v.contact.replace(/\D/g, ''); try { window.open(`https://wa.me/${/@/.test(v.contact) ? '' : n}?text=${msg()}`, '_blank', 'noopener'); } catch { /* fenêtre bloquée */ } done('whatsapp', `Invitation pour ${v.name.trim() || "votre entreprise"} partagée par WhatsApp`); },
    'ent-sms'() { const v = vals(); try { location.href = `sms:${/@/.test(v.contact) ? '' : v.contact.replace(/\s/g, '')}?&body=${msg()}`; } catch { /* rien */ } done('sms', `Invitation pour ${v.name.trim() || "votre entreprise"} partagée par SMS`); },
    'ent-copy'() { const u = inviteUrl(p); try { navigator.clipboard && navigator.clipboard.writeText(u); } catch { /* presse-papiers indisponible */ } if (p.invites.entreprise.status === 'non_creee') done('lien', 'Lien copié · collez-le dans un message à votre entreprise'); else toast('Lien copié', 'copy'); },
  };
}
// Vague 8 : envoyer une invitation là où les gens lisent leurs messages (WhatsApp, SMS), pas seulement par e-mail.
const inviteShare = (p, who0 = "l'entreprise") => { const t = encodeURIComponent(`Invitation TEEQA : suivi du chantier « ${p.name} » (${p.city}). Ouvrez le lien reçu pour accepter.`);
  return `<div class="row" style="gap:8px;flex-wrap:wrap" data-testid="invite-canaux"><a class="btn sm ghost" href="https://wa.me/?text=${t}" target="_blank" rel="noopener">${icon('message', 'sm')}WhatsApp</a><a class="btn sm ghost" href="sms:?&body=${t}">${icon('phone', 'sm')}SMS</a><span class="meta" style="align-self:center">Renvoyer l'invitation à ${who0}</span></div>`; };
// Vague 4 : les villes couvertes par l'agence partenaire, et ce qui se passe hors zone.
// Vague 5 : un réseau national d'agences partenaires ; l'agence du chantier dépend de sa ville.
export const zoneLine = (p) => `<div class="stack" style="gap:6px" data-testid="zone"><p class="meta" style="margin:0">${agenceLine(p && p.city)}</p>
  <details class="more"><summary>${icon('chevronDown', 'sm')}<span><b>Le réseau d'agences partenaires</b><small>${AGENCES.length} régions · chacune agréée et assurée</small></span></summary>
  <div class="list" style="margin-top:6px">${AGENCES.map(a => `<div class="list-item" style="align-items:flex-start"><span class="ico-tile">${icon('shield')}</span><span class="grow"><span class="t">${esc(a.agence.split(' · ')[0])} · ${esc(a.region)}</span><div class="s">${esc(a.zone.join(', '))}</div><div class="meta">${esc(a.agrement)} · RC professionnelle</div></span></div>`).join('')}</div>
  <p class="meta" style="margin:6px 0 0">${HORS_ZONE}</p></details></div>`;
// Vague 3 : l'annexe tarifaire décrit QUI paie QUOI et QUAND. 19 nov. : avec le montant de chaque ligne, tiré de TARIFS.
export const ANNEXE_PRIX = ['controle', 'contreVisite', 'contreVisiteGrad', 'visiteClient', 'secondAvis', null, 'correctionPhoto'];
export const ANNEXE = [
  ['Visite (comprise ou ajoutée)', "Les visites de la formule choisie, aux étapes clés et à celles ajoutées : même prix pour chacune.", "Le client, avec le forfait TEEQA, quand le client et l'entreprise ont tous deux accepté la convention (jamais avant). Les visites pas encore faites sont remboursées si le chantier s'arrête. Si le client change d'entreprise, elles restent dues au chantier et servent à la nouvelle."],
  ['Contre-visite après un Refusé', "Le contrôleur repasse pour voir le travail repris.", "L'entreprise, facturée par TEEQA quand la contre-visite est faite."],
  ['Contre-visite pour une réserve de structure', "Le contrôleur repasse voir une correction cachée ou de structure. Courte (1 ou 2 points à reprendre) ou complète (3 points ou plus).", "L'entreprise, facturée par TEEQA quand la contre-visite est faite."],
  ['Visite demandée par le client', "À la place d'un contrôle sur photo d'une correction.", "Le client ; l'entreprise si la visite montre que la correction n'est pas faite (règle acceptée par les deux dans la convention)."],
  ['Second avis (recours ou désaccord)', "Un contrôleur d'une autre agence donne un nouvel avis.", "La partie qui le demande, seulement si le second avis confirme le premier. S'il l'annule, ni le second avis ni la contre-visite ne lui sont facturés."],
  ['Visite après un retard du contrôleur', "L'agence a dépassé la date limite ; une autre agence passe.", "Personne : TEEQA ne la facture pas. Les délais du chantier sont suspendus jusqu'à l'avis."],
  ['Contrôle d\'une correction sur photo', "Le contrôleur regarde la photo de correction, à distance.", 'Compris dans la visite, deux fois au plus.'],
];
function annexeBody() {
  // Vague 9 : les prix d'abord, en une carte ; les cas, les plafonds et le modèle se replient.
  return `<div class="card stack" style="gap:6px" data-testid="grille-prix"><span class="over"><b>Les prix de TEEQA</b></span>
      <p class="meta" style="margin:0" data-testid="prix-resume"><b>En une ligne :</b> ${prix(TARIFS.suivi.dh, { eur: false })} sans visite · ${forfait(TARIFS.controle.visites)} avec ${TARIFS.controle.visites} visites clés · ${prix(TARIFS.visite.dh, { eur: false })} par visite en plus.</p>
      <dl class="kv" style="margin:0"><dt>Payer le forfait</dt><dd data-testid="forfait-fois">En une fois (dû avant la première visite), ou en 3 fois sans frais par carte (un tiers avant chacune des 3 premières visites, le premier dès la convention), prix TTC : carte bancaire depuis tous les pays (Maroc, Europe, Suisse, Canada, Golfe…), virement bancaire international vers le compte de TEEQA au Maroc (frais de votre banque à votre charge), ou en espèces dans une agence de paiement au Maroc (${FORFAIT_AGENCES}) ; reçu dans Documents</dd><dt>Formule Suivi</dt><dd>${forfait(0)} par chantier, sans visite</dd><dt>Chaque visite</dt><dd>${tarif('visite')}, comprise ou ajoutée : le même prix partout</dd><dt>Suivi contrôlé</dt><dd>${forfait(TARIFS.controle.visites)} = ${prix(TARIFS.suivi.dh, { eur: false })} + ${TARIFS.controle.visites} × ${prix(TARIFS.visite.dh, { eur: false })}, avec ${TARIFS.controle.visites} visites clés</dd><dt>Visite en plus</dt><dd data-testid="annexe-visite-plus">+ ${prix(TARIFS.visite.dh, { eur: false })} par visite ajoutée (ex. 6 visites : ${esc(forfaitCalc(TARIFS.controle.visites + 2))})</dd><dt>Contre-visite courte</dt><dd>${tarif('contreVisiteMineure')} · 1 ou 2 points à reprendre</dd><dt>Contre-visite</dt><dd>${tarif('contreVisite')} · Refusé, ou 3 points à reprendre ou plus</dd><dt>Second avis</dt><dd>${tarif('secondAvis')}, le prix d'une visite</dd><dt>Correction sur photo</dt><dd>Comprise, deux fois au plus</dd></dl>
      <p class="meta" style="margin:0" data-testid="prix-logique"><b>Une seule règle :</b> le forfait = le suivi (${prix(TARIFS.suivi.dh, { eur: false })}) + ${prix(TARIFS.visite.dh, { eur: false })} par visite. Une visite ajoutée, une visite demandée par le client ou un second avis coûtent le même prix qu'une visite du forfait.</p>
      <p class="meta" style="margin:0" data-testid="cv-equite">${esc(CV_EQUITE)}</p>
      <p class="meta" style="margin:0" data-testid="prix-court"><b>Où va votre argent :</b> la TVA, l'agence de contrôle et son contrôleur, puis les frais de TEEQA (preuves datées, hébergement 10 ans, assurance, aide humaine).</p></div>
    ${(() => { const m = marge(); return fold('Le détail des coûts de TEEQA', 'Pour un lecteur averti : estimations, pas encore mesurées', `<p class="meta" style="margin:0" data-testid="marge"><b>Où va le prix d'une visite :</b> ${dh(m.ttc)} TTC = ${dh(m.tva)} de TVA + ${dh(m.agence)} versés à l'agence de contrôle (dont ${dh(m.controleur)} à son contrôleur, déplacement compris) + ${dh(m.teeqa)} pour TEEQA, qui paient, en moyenne par visite : l'horodatage et l'hébergement au Maroc (${dh(MARGE_DETAIL.horodatage)}), la part de la prime d'assurance de groupe de TEEQA (${dh(MARGE_DETAIL.assurance)} ; la police est mutualisée sur tous les chantiers, son plafond de 1 000 000 DH vaut par sinistre), la part du support humain partagé entre tous les chantiers (${dh(MARGE_DETAIL.support)}), les visites non facturées à personne (retards, second avis qui annule : ${dh(MARGE_DETAIL.nonFacturees)}) et l'appli avec les frais de paiement (${dh(MARGE_DETAIL.appli)}). <b data-testid="marge-visite">Reste à TEEQA : ${dh(m.margeVisite)} par visite.</b></p>
      <p class="meta" style="margin:0" data-testid="marge-chantier"><b>Par chantier, avec 4 visites :</b> la part fixe du forfait rapporte ${dh(m.suiviHt)} HT, qui paient le conseiller et le support (${dh(SUIVI_DETAIL.conseiller)}), l'hébergement des pièces pendant 10 ans (${dh(SUIVI_DETAIL.hebergement)}), les frais de paiement (${dh(SUIVI_DETAIL.paiement)}) et l'assurance (${dh(SUIVI_DETAIL.assurance)}) : il reste ${dh(m.margeSuivi)}. Avec ${m.visitesChantier} visites : ${m.visitesChantier} × ${dh(m.teeqa)} HT (part de TEEQA sur chaque visite) − ${m.visitesChantier} × ${dh(m.couts)} de frais par visite = ${dh(m.visitesChantier * m.margeVisite)} ; ${dh(m.margeSuivi)} + ${dh(m.visitesChantier * m.margeVisite)} = <b data-testid="marge-calcul">${dh(m.margeChantier)} HT pour TEEQA par chantier</b>, avant les salaires de l'équipe et la prospection, payés par le nombre de chantiers : le seuil sera mesuré pendant le programme pilote. Coûts estimés, pas encore mesurés sur des chantiers.</p><p class="meta" style="margin:0" data-testid="cv-ventile"><b>Contre-visite :</b> ${esc(cvRepartTxt('contreVisite'))} Courte : ${esc(cvRepartTxt('contreVisiteMineure').replace(/^À la charge[^:]*: [^.]*\. /, ''))} <b>Second avis :</b> même partage qu’une visite.</p><p class="meta" style="margin:0" data-testid="support-pilote"><b>Support :</b> pendant le programme pilote (10 chantiers), le conseiller de chaque chantier est payé par TEEQA hors de ce prix ; ensuite, l’aide humaine (urgences 7 j/7) est partagée entre tous les chantiers.</p>`, 'annexe-couts'); })()}
    <p class="meta" style="margin:0">Règles fixées d'avance dans la convention : TEEQA les applique, il ne décide pas au cas par cas. ${REGLES.argent}</p>
    ${fold('Qui paie, et quand', `${ANNEXE.length} cas, du forfait au second avis`, `<div class="list" data-testid="annexe">${ANNEXE.map(([t, quoi, qui], i) => `<div class="list-item" style="align-items:flex-start"><span class="ico-tile">${icon('wallet')}</span><span class="grow"><span class="t">${t}</span><div class="price-line"><b>${ANNEXE_PRIX[i] ? (ANNEXE_PRIX[i] === 'controle' ? `${tarif('visite')} par visite, comprise ou ajoutée` : ANNEXE_PRIX[i] === 'contreVisiteGrad' ? `${tarif('contreVisiteMineure')} ou ${tarif('contreVisite')}` : ANNEXE_PRIX[i] === 'correctionPhoto' ? 'Compris' : tarif(ANNEXE_PRIX[i])) : 'Gratuit'}</b></div><div class="s">${quoi}</div><div class="meta" style="margin-top:4px"><b>Qui paie, et quand :</b> ${qui}</div></span></div>`).join('')}</div>`, 'annexe-cas')}
    ${fold('Plafond, factures, retard, remboursement', 'Jamais plus que le prix d’une visite', `<div class="notice success">${icon('shield', 'sm')}<span><b>Plafond :</b> une contre-visite (${tarif('contreVisiteMineure', { eur: false })} ou ${tarif('contreVisite', { eur: false })} selon le nombre de points à reprendre) ou un second avis (${tarif('secondAvis', { eur: false })}), jamais plus que le prix d'une visite (${tarif('visite', { eur: false })}). La même règle est écrite dans la convention, l'invitation et l'étape.</span></div>
<div class="notice" data-testid="annexe-delais">${icon('calendar', 'sm')}<span><b>Facture et délai :</b> une contre-visite à la charge de l'entreprise lui est facturée par TEEQA après l'avis signé, avec la date et le motif de la visite ; elle se règle sous 30 jours. Le montant est celui de cette annexe, le même dans toutes les régions.</span></div>
<div class="notice" data-testid="annexe-retard">${icon('clock', 'sm')}<span><b>Si le contrôleur est en retard :</b> au-delà de la date limite, le client ou l'entreprise peut relancer, puis demander une autre agence d'un geste. Cette visite n'est facturée à personne ; les délais du chantier sont suspendus du jour du retard jusqu'à l'avis, et la fin prévue se décale d'autant. L'entreprise n'est pas tenue pour responsable de ce retard. Pour éviter l'attente, l'entreprise peut réserver la visite d'avance (48 h au moins).</span></div>
<div class="notice">${icon('refresh', 'sm')}<span><b>Second avis qui annule :</b> ni le second avis ni la contre-visite ne sont facturés à celui qui l'a demandé ; l'agence du premier avis les prend en charge. C'est le second avis qui le dit, pas TEEQA.</span></div>`, 'annexe-regles')}
    ${(() => { const m = marge(); return `<div class="card stack" style="gap:6px" data-testid="modele-chiffres"><span class="over"><b>Le modèle de TEEQA en chiffres</b></span><p class="meta" style="margin:0"><b>Une visite à ${dh(m.ttc)} TTC</b> = ${dh(m.tva)} de TVA + ${dh(m.agence)} à l’agence de contrôle (dont ${dh(m.controleur)} à son contrôleur) + <b>${dh(m.teeqa)} pour TEEQA</b>.</p><p class="meta" style="margin:0" data-testid="modele-couts">Ces ${dh(m.teeqa)} paient : preuves datées et hébergement ${dh(MARGE_DETAIL.horodatage)} · assurance ${dh(MARGE_DETAIL.assurance)} · <b>aide humaine 7 j/7, 7 h – 22 h : ${dh(MARGE_DETAIL.support)}</b> (partagée entre tous les chantiers) · visites non facturées ${dh(MARGE_DETAIL.nonFacturees)} · appli et paiement ${dh(MARGE_DETAIL.appli)} · <b>reste ${dh(m.margeVisite)}</b>.</p><p class="meta" style="margin:0" data-testid="modele-calcul">Par chantier de ${m.visitesChantier} visites : ${m.visitesChantier} × ${dh(m.teeqa)} HT (part de TEEQA sur chaque visite) − ${m.visitesChantier} × ${dh(m.couts)} de frais par visite = ${dh(m.visitesChantier * m.margeVisite)}, plus ${dh(m.margeSuivi)} restés sur la part fixe du forfait = <b>${dh(m.margeChantier)} HT pour TEEQA</b>, avant les salaires. Le conseiller du programme pilote (10 chantiers) est payé par TEEQA hors de ce prix. Estimations, pas encore mesurées.</p></div>`; })()}
    <div class="card stack" style="gap:6px" data-testid="modele"><span class="over"><b>Le modèle de TEEQA : qui paie quoi, à qui, quand</b></span>
<ul style="margin:0;padding-left:18px;display:grid;gap:4px" class="meta"><li><b>Le client paie TEEQA</b> : le forfait de suivi (visites de la formule comprises), une fois. ${esc(REGLES.forfaitMission)}</li><li><b>L'entreprise ne paie rien pour être invitée ni référencée</b> ; elle paie seulement une contre-visite qu'elle a causée (Refusé, réserve de structure) ou un second avis qu'elle demande, après l'avis signé.</li><li><b>TEEQA paie l'agence de contrôle</b> (${prix(TARIFS.agence.visite, { eur: false })} par visite ou second avis, ${prix(TARIFS.agence.contreVisite, { eur: false })} par contre-visite, ${prix(TARIFS.agence.contreVisiteMineure, { eur: false })} par contre-visite courte), acte par acte, sous 15 jours après chaque avis signé ; l'agence paie son contrôleur (${prix(TARIFS.remuneration.visite, { eur: false })} par visite et ${prix(TARIFS.remuneration.deplacement, { eur: false })} de déplacement dans le rayon prévu de 40 km, soit ${prix(TARIFS.remuneration.visite + TARIFS.remuneration.deplacement, { eur: false })} ; au-delà, ${TARIFS.remuneration.km} DH par km en plus).</li><li><b>Le prix des travaux</b> va directement du client à l'entreprise, jamais par TEEQA. <span data-testid="modele-sequestre">Avec le séquestre facultatif, il passe par un compte ouvert au nom du client chez ${esc(SEQUESTRE.banque)} : c’est la banque qui garde, verse à l’entreprise ou restitue au client, sur les ordres du client (confirmation, opposition, restitution) ; TEEQA ne fait que lui transmettre ces ordres et les dates des avis. Le versement d’office (5 jours après l’échéance, sans opposition) est une clause de la convention de séquestre signée par le client et l’entreprise : c’est la banque qui l’applique, pas un ordre de TEEQA.</span></li><li>TEEQA ne touche aucune commission sur les travaux ni sur le choix d'une entreprise.</li></ul></div>
<div class="notice">${icon('info', 'sm')}<span>Ces frais concernent seulement les services de TEEQA (forfait et visites de contrôle), qu'il facture lui-même. Le prix des travaux se règle entre le client et l'entreprise, hors de TEEQA, qui ne détient jamais cet argent : TEEQA n'encaisse que le prix de ses propres services (forfait, visites), avec lequel il paie l'agence de contrôle.</span></div>`;
}

// Vague 6 : écart au planning. Rythme régulier entre la convention et la fin prévue : combien d'étapes devraient être closes ?
function planGap(p) {
  if (!p.finPrevue || !conventionOk(p) || !p.convention) return 0;
  const start = new Date([p.convention.client, p.convention.entreprise].filter(Boolean).sort().pop() || p.createdAt).getTime(), end = new Date(p.finPrevue).getTime();
  if (!(end > start)) return 0;
  const frac = Math.min(1, Math.max(0, (nowMs() - start) / (end - start)));
  return Math.max(0, Math.floor(frac * p.steps.length) - progress(p).done);
}
// Vague 5 : les articles de la convention, lisibles aussi dans l'invitation de l'entreprise, AVANT d'accepter.
function conventionArticles(p, n = p.steps.filter(isControlled).length) {
  return [
        ['Objet', `Le client et l'entreprise suivent ensemble le chantier « ${esc(p.name)} » à ${esc(p.city)}, étape par étape, dans TEEQA.`],
        ['Étapes', `<ol style="margin:4px 0 0;padding-left:20px;display:grid;gap:3px">${p.steps.map((x) => `<li>${esc(x.title)}${isControlled(x) ? '' : ' <span class="meta">· sans visite</span>'}</li>`).join('')}</ol>`],
        ['Visites de contrôle', `${n ? `Formule Suivi contrôlé : ${n} visite${n > 1 ? 's' : ''} sur ${p.steps.length} étapes, aux étapes clés et à celles ajoutées par le client, par un contrôleur indépendant ${p.invites.controleur && p.invites.controleur.agence ? `de l'agence ${esc(p.invites.controleur.agence)}` : "d'une agence de la zone, nommée après les deux acceptations"}, missionné par TEEQA.` : "Formule Suivi : aucune visite de contrôle ; rien n'est vérifié sur place."} Une étape sans visite est déclarée par l'entreprise et consultée par le client : elle n'est jamais dite vérifiée. L'entreprise prend une photo au début de chaque étape et au moins 3 à la fin. Pour les fondations, les murs et poteaux et la dalle, la visite a lieu au point d'arrêt, ferraillage prêt : le béton n'est coulé qu'après l'avis, puis l'entreprise déclare le coulage avec une photo. Le client et l'entreprise peuvent chacun changer d'agence de contrôle une fois, avec un motif, mais jamais pour défaire un avis déjà signé. ${esc(REGLES.autresAgences.split('. ')[1])}`],
        ['Prix de TEEQA', `Forfait TEEQA : <b data-testid="convention-prix">${forfait(n)}</b> (${esc(forfaitCalc(n))}), payé une fois à TEEQA par le client après les deux acceptations, remboursé en entier si aucune entreprise n'accepte. Chaque visite : ${tarif('visite')}, comprise ou ajoutée. Contre-visite : ${tarif('contreVisiteMineure')} pour 1 ou 2 points à reprendre, ${tarif('contreVisite')} au-delà ou après un Refusé ; second avis : ${tarif('secondAvis')}. Ces prix ne concernent que les services de TEEQA, jamais le prix des travaux.`],
        ['Avis du contrôleur', `<ul style="margin:4px 0 0;padding-left:18px;display:grid;gap:4px"><li><b>Validé</b> : l'étape est close (au point d'arrêt, une fois le coulage déclaré).</li><li><b>Réserves de finition</b> (ce qui reste apparent une fois les travaux finis) : l'ouvrage reste en place ; l'entreprise corrige et envoie une photo ; la correction est contrôlée sur photo, 2 fois au plus, puis l'avis devient Refusé.</li><li><b>Réserves de structure ou d'ouvrage caché</b> (aciers, enrobage, recouvrement, coffrage, et toute réserve au point d'arrêt avant coulage) : la correction est toujours contrôlée lors d'une contre-visite sur place, jamais sur photo. Ce classement est fait par l'appli, pas au choix du contrôleur.</li><li><b>Non vu</b> : ${esc(REGLES.nonVu.replace(/^« Non vu » : /, ''))}</li><li><b>Recours</b> : le client ou l'entreprise peut demander un second avis par une autre agence contre un avis Réserves ou Refusé.</li><li><b>Refusé</b> : l'ouvrage est à refaire ; après la reprise, tous les points de l'étape sont revus sur place ; la contre-visite est facturée par TEEQA à l'entreprise, jamais plus que le prix d'une visite ordinaire (annexe tarifaire de la convention), et non facturée si un second avis annule le Refusé.</li><li><b>Visite demandée par le client</b> à la place d'un contrôle sur photo : à la charge du client, sauf si elle montre que la correction n'est pas faite ; elle est alors à la charge de l'entreprise.</li><li><b>Second avis</b> après un désaccord : à la charge de la partie qui le demande, non facturé si le second avis annule le premier.</li></ul>
          <button class="btn sm ghost" style="margin-top:8px" data-go="#/c/${p.id}/annexe" data-testid="annexe-link">${icon('wallet', 'sm')}Voir l'annexe tarifaire</button>`],
        ['Délais', `<ul style="margin:4px 0 0;padding-left:18px;display:grid;gap:4px"><li><b>Visite réservée d'avance</b> : l'entreprise annonce « ferraillage prêt prévu le … » au moins 48 h avant ; l'agence confirme et le contrôleur passe ce jour-là ;</li><li>sans réservation : 24 h pour qu'une agence accepte la mission de contrôle ;</li><li>${REGLES.delaiVisite} La fin prévue se décale d'autant${p.horsZone ? ' (ce chantier est hors des villes desservies : 6 jours)' : ''} ;</li><li>48 h pour répondre à un désaccord ;</li><li>7 jours au client qui préfère attendre avant de payer, puis relance possible ;</li><li>21 jours sans activité de l’entreprise avant de pouvoir changer d’entreprise (alerte au 10e jour).</li><li>Intempéries ou congé déclarés par l'entreprise et acceptés par le client : les délais sont suspendus pendant l'arrêt.</li></ul>`],
        ['Paiement', 'Le paiement se fait entre le client et l\'entreprise, hors de TEEQA, par tranche (Tranche n · nom de l\'étape). « Paiement recommandé » ou « Paiement différé » est une recommandation au client, qui décide ; TEEQA ne détient ni ne retient l\'argent des travaux. ' + REGLES.trancheDue + ' Réserve de finition, mineure, étape finie : paiement recommandé, sauf la part liée à la réserve, gardée jusqu\'à sa levée. Le client qui préfère attendre donne un motif ; l\'entreprise le voit, avec la date de relance. Un paiement indiqué que l\'entreprise ne confirme pas ne bloque pas la réception : il reste signalé.' + (p.sequestre ? ` <b>Séquestre choisi par le client :</b> ${esc(REGLES.sequestre)} ${esc(sequestreFraisTxt())}` : '')],
        ['Réception et garanties', `À la fin, le client signe la réception provisoire (procès-verbal, avec ou sans réserves), contresignée par l\'entreprise. ${GARANTIE_TXT}`],
        ['Responsabilité', REGLES.responsabilite],
        ['Données personnelles', 'Photos, avis et échanges sont gardés 10 ans après la réception, pour la garantie décennale, puis supprimés. Chacun peut y accéder et les faire rectifier (loi 09-08, CNDP). Ils ne sont jamais vendus ni partagés hors du chantier. ' + REGLES.donnees],
        ['Désaccord et historique', "TEEQA ne tranche pas un désaccord. L'entreprise peut joindre une observation à un avis ; le contrôleur peut répondre à une contestation. Photos, avis, corrections et échanges restent consultables, puis sont figés dans le rapport à la clôture."],
      ];
}
// 20 nov. (réalisme) : séquestre bancaire facultatif, dans Budget. Le détail (règle, frais) reste replié.
const jm = (x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const seqCourt = (s) => { const q = s.sequestre; return !q ? '' : q.verseAt ? `Versée par ${SEQUESTRE.banque} le ${jm(q.verseAt)}${q.via === 'delai' ? ", d'office" : ''}` : q.opposition ? `Sur le compte de ${SEQUESTRE.banque} · opposition du client le ${jm(q.opposition.at)}` : `Sur le compte de ${SEQUESTRE.banque} depuis le ${jm(q.at)} · argent sur le compte de la banque`; };
function seqBlock(p, r) {
  const q = p.sequestre, clos = p.status === 'clos';
  const regle = `<p class="meta" style="margin:0" data-testid="seq-regle">${esc(REGLES.sequestre)}</p><p class="meta" style="margin:0" data-testid="seq-frais">${esc(sequestreFraisTxt())}</p>${seqFraisChantierTxt(p) ? `<p class="meta" style="margin:0" data-testid="seq-frais-total"><b>${esc(seqFraisChantierTxt(p))}</b></p>` : ''}`;
  if (!q) return r !== 'client' || clos ? '' : fold('Séquestre bancaire, facultatif', `${SEQUESTRE.banque} garde chaque tranche jusqu’à son versement`, `${regle}<p class="meta" style="margin:0">Sans séquestre, rien ne change : vous payez l'entreprise directement (virement, espèces contre reçu, chèque) et indiquez « J'ai payé cette tranche ».</p><button class="btn saffron block" data-act="seq-choisir" data-testid="seq-choisir">${icon('shield', 'sm')}Choisir le séquestre</button>`, 'seq-offre');
  const solde = seqSolde(p), convAtt = !!(p.convention && !p.convention.entreprise);
  return `<div class="card stack" style="gap:6px" data-testid="seq-etat"><span class="over"><b>Séquestre · ${esc(SEQUESTRE.banque)}</b></span>
    ${!q.entrepriseAt ? `<p class="meta" style="margin:0">${r === 'client' ? `Choisi le ${fmtDate(q.choisiAt)} ; en attente de l'accord de ${esc(who('entreprise'))}${convAtt ? ', avec la convention' : ''}.` : `Proposé par ${esc(who('client'))} le ${fmtDate(q.choisiAt)} : chaque tranche sera sur un compte de la banque avant de vous être versée. Une tranche déjà due ne peut plus être déposée sur ce compte : elle se règle comme avant. Une tranche déposée vous est versée par la banque sur l’ordre du client, ou d’office 5 jours après son échéance s’il ne s’y oppose pas.`}</p>${r === 'entreprise' && !clos && !convAtt ? `<button class="btn saffron block" data-act="seq-accepter" data-testid="seq-accepter">${icon('check', 'sm')}J'accepte le séquestre</button>` : ''}`
    : `<p class="meta" style="margin:0" data-testid="seq-compte">Compte n° ${esc(q.compte)}, ouvert le ${fmtDate(q.entrepriseAt)} · <b>${solde ? `${dh(solde)} sur le compte` : 'rien sur le compte pour l’instant'}</b>${r === 'entreprise' && solde ? ' : argent sur le compte de la banque' : ''}</p>
      ${q.restitution ? `<p class="meta" style="margin:0" data-testid="seq-restitution">Restitution demandée par ${esc(who('client'))} le ${fmtDate(q.restitution.at)} (${dh(q.restitution.dh)}) : ${esc(SEQUESTRE.banque)} rend l’argent au client, sauf une tranche d’étape terminée que l’entreprise réclame par écrit avant le ${fmtDate(q.restitution.finReclamation)}. TEEQA ne touche pas l’argent.</p>`
        : r !== 'controleur' && solde && !clos && p.reprise && p.steps.filter(seqSurCompte).every(x => pourSortante(p, x)) ? `<p class="meta" style="margin:0" data-testid="seq-reprise">Reprise : ${p.steps.filter(seqSurCompte).map(x => `la tranche ${p.steps.indexOf(x) + 1} paie un travail fini par ${esc(sortanteNom(p))} (état des lieux) ; elle reste sur le compte jusqu’à l’avis de l’étape ${p.steps.indexOf(x) + 1}, puis ${esc(SEQUESTRE.banque)} la verse à ${esc(sortanteNom(p))}`).join(' ; ')}. Ce travail est fait : cette tranche n’est pas restituée au client (la règle du séquestre ne restitue que l’argent d’un travail pas fait) ; ${esc(sortanteNom(p))} n’a donc pas à la réclamer par écrit. Même règle que dans « Choisir le séquestre » : si vous demandiez la restitution, une tranche d’étape terminée réclamée par écrit sous 8 jours resterait bloquée ; une étape terminée mais pas encore contrôlée garde sa visite, et sa tranche suit l’avis.</p>`
        : r === 'client' && solde && !clos && (p.reprise || abandonOpen(p)) ? `<p class="meta" style="margin:0">${p.reprise ? 'Vous changez d’entreprise' : 'Le chantier est arrêté'} : vous pouvez laisser l’argent pour la suite, ou demander à la banque de vous le rendre (ordre écrit, transmis par TEEQA).</p><button class="btn ghost block" data-act="seq-restituer" data-testid="seq-restituer">${icon('wallet', 'sm')}Demander la restitution à ${esc(SEQUESTRE.banque)}</button>` : ''}`}
    <p class="meta" style="margin:0" data-testid="seq-frais-vu">${esc(seqFraisChantierTxt(p))}</p>
    ${fold('La règle du séquestre', 'Quand la banque verse, opposition, frais', regle, 'seq-regle-pli')}</div>`;
}
// Vague 18 NT : la feuille « Proposer un avenant », réutilisée par la contre-proposition (titre et précisions préremplis).
function avNewSheet(p, r, pre = {}) {
            openSheet(`<h2>Proposer un avenant</h2><p class="muted" style="margin-bottom:12px">${r === 'client' ? "L'entreprise" : 'Le client'} devra l'accepter. Accepté, il ajoute une étape avant la visite de réception.</p>
              <div class="field"><label for="av-title">Travaux en plus</label><input id="av-title" class="input" type="text" maxlength="80" placeholder="Ex. : Mur de clôture" value="${esc(pre.title || '')}"></div>
              <div class="field" style="margin-top:12px"><label for="av-note">Précisions (facultatif)</label><textarea id="av-note" class="input" rows="3" style="width:100%;box-sizing:border-box;height:auto;padding-top:12px;padding-bottom:12px" placeholder="Ce qui est prévu, délai envisagé.">${esc(pre.note || '')}</textarea></div>
              <div class="field" style="margin-top:12px"><label for="av-file">Joindre un plan ou une photo (facultatif)</label><input id="av-file" class="input" type="file" accept="application/pdf,image/*"></div>
              <div class="field" style="margin-top:12px"><label for="av-dh">Montant des travaux en DH (d'après le devis)</label><input id="av-dh" class="input" inputmode="numeric" maxlength="9" placeholder="Ex. 85000"></div>
              <label class="row" style="gap:10px;margin-top:12px;min-height:44px"><input id="av-ctl" type="checkbox" style="width:22px;height:22px"><span>Avec visite de contrôle (${tarif('visite', { eur: false })}, payée par le client) : conseillée pour un ouvrage caché (réseaux enterrés). Obligatoire pour la structure (béton armé, radier, fondations, piscine) : visite au point d’arrêt, avant coulage</span></label>
              <div class="stack" style="margin-top:12px"><button class="btn saffron block" data-av-ok disabled>Envoyer la proposition</button><button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`,
            { label: 'Proposer un avenant', onMount: (el) => { const t = el.querySelector('#av-title'), ok = el.querySelector('[data-av-ok]');
              t.addEventListener('input', () => { ok.disabled = !t.value.trim(); }); ok.disabled = !t.value.trim();
              ok.addEventListener('click', () => { if (!t.value.trim()) return; actions.proposeAvenant(p.id, r, { title: t.value.trim(), note: [el.querySelector('#av-note').value.trim(), (el.querySelector('#av-file').files[0] ? `pièce jointe : ${el.querySelector('#av-file').files[0].name}` : '')].filter(Boolean).join(' · '), controlled: el.querySelector('#av-ctl').checked, dh: +String(el.querySelector('#av-dh').value).replace(/\D/g, '') || 0 });
                closeSheet(true); sfx('pop'); toast('Avenant proposé', 'send'); go(`#/c/${p.id}/avenants`, { replace: true }); }); } });
          }
export const routes = [
  { // Vague 24 (jury n° 3 et 13, 8 personas) : « Payer le forfait » mène à un vrai écran : 1 ou 3 fois, moyen, reçu. Jamais l'argent des travaux.
    name: 'forfait', pattern: /^\/c\/([^/]+)\/forfait$/,
    render(pid) {
      const p = project(pid); if (!p) return { redirect: '#/home' };
      if (get().role !== 'client') return { redirect: `#/c/${pid}` };
      const k = p.steps.filter(isControlled).length, tot = forfaitDh(k), [t1, t2, t3] = forfaitTiers(tot), F = p.forfait || {}, paye = !!F.paidAt;
      const pret = conventionOk(p) && p.invites.entreprise && p.invites.entreprise.status === 'acceptee' && p.status !== 'clos';
      const ttc = (x) => `${dh(x)} TTC, dont ${dh(x - Math.round(x / (1 + TARIFS.tva)))} de TVA`;
      const M = [['carte', 'Carte bancaire', 'Marocaine ou étrangère ; la page sécurisée de la banque s’ouvre (3-D Secure)', true], ['national', 'Virement depuis le Maroc', 'Vers le compte de TEEQA SARL, RIB 190 780 21211 0045678 0012 45, référence ' + 'FORFAIT-' + p.id.toUpperCase() + ' ; 1 à 2 jours ouvrés', false], ['sepa', 'Virement depuis l’étranger', 'Même compte (IBAN MA64 1907 8021 2110 0456 7800 1245), frais de votre banque à votre charge ; 2 à 4 jours ouvrés', false], ['agence', 'Espèces en agence de paiement', `Chez ${FORFAIT_AGENCES}, avec le code envoyé par SMS ; reçu remis au guichet`, false]];
      return {
        html: `${appbar({ title: 'Payer le forfait', back: `#/c/${p.id}/controles`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px" data-testid="forfait-ecran">
          <div class="card dark stack" style="gap:6px"><span class="over" style="color:var(--saffron)">${esc(p.name)} · forfait TEEQA</span>
            <div class="h1">${dh(tot)}<span class="kw">.</span></div><div class="meta" style="color:var(--sage-ink)">${esc(forfaitCalc(k))}</div>
            <p class="meta" style="margin:0;color:var(--sage-ink)" data-testid="forfait-pas-travaux">C’est le prix des services de TEEQA (suivi, ${k} visite${k > 1 ? 's' : ''}). L’argent des travaux ne passe jamais par TEEQA : il se paie à l’entreprise, à part.</p></div>
          ${paye ? `<div class="card stack" style="gap:6px" data-testid="forfait-recu"><div class="row" style="gap:10px"><span class="ico-tile success">${icon('checkCircle')}</span><b>${F.moyen === 'carte3' ? 'Premier tiers payé' : F.aReception ? 'Paiement annoncé' : 'Forfait payé'}</b></div>
              <dl class="kv" style="margin:0"><dt>Reçu</dt><dd>n° ${esc(F.recu || 'TQ-' + p.id)}</dd><dt>Montant</dt><dd>${ttc(F.moyen === 'carte3' ? t1 : tot)}</dd><dt>Le</dt><dd>${fmtFull(F.paidAt)}</dd><dt>Moyen</dt><dd>${esc((M.find(x => x[0] === (F.moyen === 'carte3' ? 'carte' : F.moyen)) || M[0])[1])}${F.moyen === 'carte3' ? ', en 3 fois sans frais' : ''}</dd></dl>
              ${F.moyen === 'carte3' ? `<p class="meta" style="margin:0" data-testid="forfait-tiers-suite">Ensuite, sur la même carte, sans frais : ${dh(t2)} avant la 2ᵉ visite, puis ${dh(t3)} avant la 3ᵉ. Un rappel 2 jours avant chaque prélèvement.</p>` : ''}
              ${F.aReception ? `<p class="meta" style="margin:0">Le reçu définitif arrive dans Documents à réception de l’argent ; les visites ne sont pas retenues d’ici là.</p>` : ''}
              <button class="btn ghost block" data-go="#/c/${p.id}/documents" data-testid="forfait-recu-doc">${icon('file', 'sm')}Voir le reçu dans Documents</button></div>`
          : !pret ? `<div class="notice">${icon('lock', 'sm')}<span>${esc(REGLES.forfaitMission)}</span></div>` : `
          <div class="field"><label id="lbl-fois">En combien de fois ?</label><div class="seg" role="radiogroup" aria-labelledby="lbl-fois">
            <button class="seg-opt" role="radio" aria-checked="true" data-act="fois" data-n="1" data-testid="forfait-1fois"><b>En une fois</b><span style="font-size:12px;font-weight:600">${dh(tot)} avant la 1re visite</span></button>
            <button class="seg-opt" role="radio" aria-checked="false" data-act="fois" data-n="3" data-testid="forfait-3fois"><b>En 3 fois</b><span style="font-size:12px;font-weight:600">sans frais, par carte</span></button></div>
            <p class="meta" data-testid="forfait-echeancier" hidden>1er tiers : ${dh(t1)} maintenant · 2e : ${dh(t2)} avant la 2ᵉ visite · 3e : ${dh(t3)} avant la 3ᵉ visite. Rien de plus que ${dh(tot)}.</p></div>
          <div class="field"><label id="lbl-moyen">Comment payer ?</label><div class="list" role="radiogroup" aria-labelledby="lbl-moyen">${M.map(([key, t, d], i) => `<button class="list-item" role="radio" aria-checked="${i === 0}" data-act="moyen" data-m="${key}" data-testid="forfait-m-${key}"><span class="ico-tile ${i === 0 ? 'success' : ''}">${icon(i === 0 ? 'check' : 'wallet')}</span><span class="grow"><span class="t">${t}</span><span class="s">${esc(d)}</span></span></button>`).join('')}</div></div>
          <button class="btn saffron block" data-act="forfait-go" data-testid="forfait-go">Payer ${dh(tot)} par carte</button>
          <p class="meta" style="margin:0" data-testid="forfait-refus">Carte refusée ? Rien n’est débité : réessayez, ou choisissez un autre moyen. Les visites ne sont pas retenues avant la première. En 3 fois, si le 2ᵉ ou le 3ᵉ prélèvement est refusé : vous êtes prévenu, et vous avez 7 jours pour le payer autrement (virement ou agence) ; la visite prévue a lieu quand même, le chantier ne s’arrête pas pour le forfait. Le reçu (avec la TVA) arrive dans Documents.</p>`}
          <p class="meta" style="margin:0">Visites pas encore faites remboursées si le chantier s’arrête. Un contrôleur ne vous demande jamais d’argent.</p>
        </div></div>`,
        mount(el) { let fois = 1, moyen = 'carte'; const go1 = el.querySelector('[data-act="forfait-go"]'); if (!go1) return;
          const maj = () => { el.querySelectorAll('[data-act="fois"]').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.n === fois)));
            el.querySelectorAll('[data-act="moyen"]').forEach(b => { const on = b.dataset.m === moyen, off = fois === 3 && b.dataset.m !== 'carte'; b.setAttribute('aria-checked', String(on)); b.disabled = off; b.style.opacity = off ? '.45' : ''; const t = b.querySelector('.ico-tile'); t.classList.toggle('success', on); t.innerHTML = icon(on ? 'check' : 'wallet'); });
            const ech = el.querySelector('[data-testid="forfait-echeancier"]'); if (ech) ech.hidden = fois !== 3;
            go1.textContent = moyen === 'carte' ? (fois === 3 ? `Payer le 1er tiers : ${dh(t1)}` : `Payer ${dh(tot)} par carte`) : moyen === 'agence' ? 'Recevoir mon code de paiement par SMS' : `J’ai fait le virement de ${dh(tot)}`; };
          el.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b || !el.contains(b)) return;
            if (b.dataset.act === 'fois') { fois = +b.dataset.n; if (fois === 3) moyen = 'carte'; maj(); sfx('choix'); }
            else if (b.dataset.act === 'moyen' && !b.disabled) { moyen = b.dataset.m; maj(); sfx('choix'); }
            else if (b.dataset.act === 'forfait-go') { const m2 = moyen === 'carte' && fois === 3 ? 'carte3' : moyen; actions.payForfait(p.id, m2); sfx('tampon'); toast(m2 === 'carte3' ? 'Premier tiers payé · reçu dans Documents' : m2 === 'carte' ? 'Forfait payé · reçu dans Documents' : 'Paiement annoncé · reçu à réception', 'check'); go(`#/c/${p.id}/forfait`, { replace: true }); } });
          maj(); },
      };
    },
  },
  { // Vague 8 : budget des travaux. Le montant de chaque tranche est saisi par le client d'après le devis ; TEEQA ne le détient pas.
    // Vague 25 (entreprises) : aperçu de la facture de l'entreprise, faite de ses situations reçues (TTC, HT, TVA) ; à imprimer en PDF.
    name: 'facture', pattern: /^\/c\/([^/]+)\/facture$/,
    render(pid) {
      const p = project(pid); if (!p) return { redirect: '#/home' };
      if (get().role !== 'entreprise') return { redirect: `#/c/${pid}/budget` };
      const b = budgetOf(p), sit = []; let horsSortante = 0; if (b) p.steps.forEach((x, k) => { const l = b.lignes[k]; if (l && l.recu && pourSortante(p, x)) horsSortante++; if (!l || pourSortante(p, x)) return;   /* vague 26 (jury n° 17, GPT 14) : jamais les sommes reçues par l'entreprise sortante */ const pr = (x.partiels || []).filter(y => y.receivedAt);
        pr.forEach(y => sit.push({ dh: y.dh, at: y.receivedAt, quoi: `${y.acompte ? 'Acompte' : 'Versement partiel'} sur la ${trancheName(p, x).toLowerCase()}` }));
        if (l.recu) { const reste = l.dh - pr.reduce((a, y) => a + y.dh, 0); if (reste > 0) sit.push({ dh: reste, at: (x.decision && (x.decision.receivedAt || x.decision.at)) || '', quoi: pr.length ? `Solde de la ${trancheName(p, x).toLowerCase()}` : trancheName(p, x) }); } });
      sit.sort((a, c) => String(a.at).localeCompare(String(c.at)));
      const ttc = sit.reduce((a, y) => a + y.dh, 0), ht = Math.round(ttc / 1.2), num = sit.length ? `F-${new Date(nowMs()).getFullYear()}-${String(p.id).replace(/\W/g, '').slice(0, 4).toUpperCase()}-${String(sit.length).padStart(3, '0')}` : 'Sans numéro : rien à facturer';   // vague 26 (jury) : plus de « -000 »
      return {
        html: `${appbar({ title: 'Aperçu de la facture', back: `#/c/${pid}/budget`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div class="card stack" style="gap:8px" data-testid="facture">
            <div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><div><b>${esc(entNow(p))}</b><div class="meta">Chantier à ${esc(p.city)} · ICE et RC : ceux de votre fiche</div></div><div style="text-align:end"><b>Facture</b><div class="meta" data-notr>${num}</div><div class="meta">${fmtDate(new Date(nowMs()).toISOString())}</div></div></div>
            <div class="meta"><b>Client :</b> ${esc(who('client'))} · chantier « ${esc(p.name)} »</div>
            <dl class="kv" style="margin:0">${sit.length ? sit.map(y => `<dt>${esc(y.quoi)}<br><span class="meta">reçue le ${fmtDate(y.at)}</span></dt><dd>${dh(Math.round(y.dh / 1.2))} HT</dd>`).join('') : `<dt>${horsSortante ? `Aucune tranche reçue par vous pour l’instant (${horsSortante} reçue${horsSortante > 1 ? 's' : ''} par l’entreprise sortante, sur son dossier)` : 'Aucune tranche reçue pour l’instant'}</dt><dd>—</dd>`}
              <dt>Total HT</dt><dd data-testid="facture-ht">${dh(ht)}</dd><dt>TVA 20 %</dt><dd>${dh(ttc - ht)}</dd><dt><b>Total TTC</b></dt><dd data-testid="facture-ttc"><b>${dh(ttc)}</b></dd></dl>
            <p class="meta" style="margin:0">Payé directement par le client à ${esc(entNow(p))}, hors de TEEQA. Aperçu fait de vos situations « confirmé reçu » : reprenez-le dans votre facturation ; TEEQA ne facture pas les travaux et ne détient pas cet argent.</p></div>
          <button class="btn block" data-act="facture-pdf" data-testid="facture-pdf">${icon('file', 'sm')}Enregistrer en PDF</button>
        </div></div>`,
        on: { 'facture-pdf'() { try { window.print(); } catch { /* rien */ } } },
      };
    },
  },
  {
    name: 'budget', pattern: /^\/c\/([^/]+)\/budget$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role; if (r === 'controleur') return { redirect: `#/c/${pid}` };
      const b = budgetOf(p), edit = r === 'client' && p.status !== 'clos';
      // Vague 11 : équivalent dans la devise du pays du client, seulement s'il vit hors du Maroc (sinon dirhams seuls).
      const dv = deviseVue(), fx = (n) => dv ? `<br><span class="meta" style="color:inherit;opacity:.8">≈ ${enDeviseTaux(n, dv)}</span>` : '';   // vague 19 : « ≈ 102 € » à côté du montant ; le taux daté est dit une fois (data-testid="taux")
      const conf = p.budget && p.budget.entrepriseAt;
      return {
        html: `${appbar({ title: 'Budget des travaux', back: `#/c/${p.id}/share`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div class="card dark stack" style="gap:8px" data-testid="budget-total"><span class="over" style="color:var(--saffron)">${esc(p.name)} · prix des travaux</span>
            ${b ? `<dl class="kv" style="margin:0"><dt>Total prévu</dt><dd><b>${dh(b.total)}</b>${fx(b.total)}</dd><dt>Payé (indiqué)</dt><dd>${dh(b.paye)}${fx(b.paye)}${b.partiel ? `<br><span class="meta" data-testid="dont-partiel">dont ${dh(b.partiel)} de versement partiel</span>` : ''}<br><span class="meta" data-testid="dont-recu">dont ${b.recu ? dh(b.recu) : 'rien'} confirmé reçu par l'entreprise${b.tenu ? ` et ${dh(b.tenu)} tenu pour reçu (${esc(sortanteNom(p))} n’a pas répondu à l’état des lieux)` : ''}${b.paye - b.recu - (b.tenu || 0) > 0 ? ` ; ${dh(b.paye - b.recu - (b.tenu || 0))} indiqués par le client, non vérifiés` : ''}</span></dd>${b.seq ? `<dt>Sur le compte de séquestre</dt><dd data-testid="budget-seq">${dh(b.seq)}${fx(b.seq)}<br><span class="meta">versé par le client à ${esc(SEQUESTRE.banque)}, pas encore à l’entreprise</span></dd>` : ''}${/* Vague 25 (jury n° 4) : après une reprise, UN seul « reste à payer » (le même que l'état des lieux et « à qui va l'argent »). */''}${p.reprise && repriseArgent(p) ? `<dt>Reste à payer</dt><dd data-testid="reste-unique"><b>${dh(b.resteAPayer)}</b>${fx(b.resteAPayer)}<br><span class="meta">= ${dh(repriseArgent(p).duSortante)} à ${esc(repriseArgent(p).sortante)} + ${dh(repriseArgent(p).aReprenante)} à ${esc(entNow(p))}</span>${b.seq ? `<br><span class="meta">dont ${dh(b.seq)} déjà posé sur le compte de séquestre (la banque le verse, vous n’avez plus rien à envoyer pour cette part)</span>` : ''}</dd>` : `<dt>Reste${b.seq ? ' à verser' : ''}</dt><dd>${dh(b.reste)}${fx(b.reste)}</dd>`}</dl>
            <div class="meta" style="color:var(--sage-ink)">Source : ${esc(b.source)}</div>
            <div class="meta" style="color:var(--sage-ink)" data-testid="budget-confirme">${conf ? `Montants confirmés par ${esc(entNow(p))} le ${fmtDate(conf)}${p.reprise && (p.formerPros || []).length ? ` : son devis reprend les montants du devis initial pour les tranches qu’elle fera (${p.steps.filter(x => !pourSortante(p, x)).map(x => p.steps.indexOf(x) + 1).join(' et ')}), ce qu’elle a choisi et signé` : ''}` : `Pas encore confirmés par ${esc(entNow(p))}`}</div>${versesSortante(p)}` : `<p class="meta" style="margin:0;color:var(--sage-ink)">Pas encore de montants. Saisissez le montant de chaque tranche d'après votre devis.</p>`}</div>
          ${dv ? `<p class="meta" style="margin:0" data-testid="taux">${esc(tauxLigne())}</p>` : ''}
          ${dv && get().role === 'client' ? `<p class="meta" style="margin:0" data-testid="envoi-etranger"><b>Payer une tranche depuis l’étranger :</b> virement international au nom de l’entreprise à qui la tranche est due${p.reprise && (p.formerPros || []).length ? ` (${esc(sortanteNom(p))} pour une étape qu’elle a finie, sur le compte de son devis ; ${esc(entNow(p))} pour la suite, sur le compte du sien)` : ` (${esc(entNow(p))}), sur le compte écrit dans son devis`}. Les frais de votre banque et son taux de change s’ajoutent : demandez-les-lui avant d’envoyer ; un virement international met en général 2 à 4 jours ouvrés à arriver ; gardez le reçu de votre banque et joignez-le avec « J'ai payé cette tranche ». TEEQA ne fait pas le transfert.</p>` : ''}
          ${get().role === 'client' && b && p.status !== 'clos' ? `<p class="meta" style="margin:0" data-testid="moyens-paiement"><b>Moyens :</b> virement, chèque certifié ou espèces contre reçu signé de l’entreprise ; joignez le justificatif. Frais : ceux de votre banque ou du service choisi, TEEQA n’en perçoit aucun. <b>Compte de l’entreprise :</b> celui de son devis ; si on vous en donne un autre par message, appelez l’entreprise au numéro du devis avant de payer (fraude courante).</p>` : ''}
          ${seqBlock(p, r)}
          ${r === 'entreprise' && b ? (() => { const recues = p.steps.map((x, i) => [x, b.lignes[i], i + 1]).filter(([, l]) => l && l.recu);   // vague 22 (entreprises, 8 fiches) : situation de travaux et export comptable
            return `<div class="card stack" style="gap:8px" data-testid="compta-ent"><b>Facturation et comptabilité</b><p class="meta" style="margin:0">Pour chaque tranche reçue, une situation de travaux toute prête (TTC, HT, TVA 20 %) à reporter dans votre facture ; l’export donne toutes les tranches en tableur. TEEQA ne facture pas les travaux à votre place.</p>${(() => {   // vague 23 (jury n° 4) : une situation par somme reçue (tranche, acompte ou versement partiel confirmés), numérotées dans l'ordre, et leur total = « confirmé reçu »
              const sit = []; p.steps.forEach((x, k) => { const l = b.lignes[k]; if (!l || pourSortante(p, x)) return; const pr = (x.partiels || []).filter(y => y.receivedAt);
                pr.forEach(y => sit.push({ dh: y.dh, at: y.receivedAt, quoi: `${y.acompte ? 'Acompte' : 'Versement partiel'} sur la ${trancheName(p, x).toLowerCase()}` }));
                if (l.recu) { const reste = l.dh - pr.reduce((a, y) => a + y.dh, 0); if (reste > 0) sit.push({ dh: reste, at: (x.decision && (x.decision.receivedAt || x.decision.at)) || '', quoi: pr.length ? `Solde de la ${trancheName(p, x).toLowerCase()}` : trancheName(p, x) }); } });
              sit.sort((a, c) => String(a.at).localeCompare(String(c.at))); const tot = sit.reduce((a, y) => a + y.dh, 0);
              return sit.length ? `<div class="meta" data-testid="situations">${sit.map((y, n) => `Situation n° ${n + 1} · ${esc(y.quoi)} : ${dh(y.dh)} TTC, soit ${dh(Math.round(y.dh / 1.2))} HT et ${dh(y.dh - Math.round(y.dh / 1.2))} de TVA · reçue le ${fmtDate(y.at)}`).join('<br>')}<br><b data-testid="situations-total">Total des situations : ${dh(tot)} TTC</b>${(p.formerPros || []).length ? '' : ', c’est le « confirmé reçu » ci-dessus'}.</div>` : ''; })()}${(p.formerPros || []).length ? `<p class="meta" style="margin:0" data-testid="situations-sortante">Les sommes reçues par ${esc(sortanteNom(p))} avant la reprise sont à elle : elles ne figurent ni ici ni dans votre facture.</p>` : ''}<button class="btn ghost block" data-go="#/c/${p.id}/facture" data-testid="facture-btn">${icon('file', 'sm')}Aperçu de la facture (PDF)</button><button class="btn ghost block" data-act="export-compta" data-testid="export-compta">${icon('file', 'sm')}Exporter les tranches (tableur)</button></div>`; })() : ''}
          <div class="list" data-testid="budget-lignes">${p.steps.map((s, i) => { const l = b && b.lignes[i]; const pa = (s.partiels || []);
            return `<div class="list-item" style="align-items:flex-start"><span class="ico-tile ${l && l.recu ? 'success' : l && (l.paye || l.partiel) ? 'saffron' : ''}">${icon('wallet')}</span><span class="grow"><span class="t">${esc(trancheName(p, s))}${s.avenant ? ' (avenant)' : ''}</span>
            <div class="s">${l && l.dh ? `<b>${dh(l.dh)}</b>` : 'Montant non saisi'}${l && l.recu ? ' · payée, reçu confirmé' : l && l.paye ? (pourSortante(p, s) && edlClos(p) ? ` · payée (indiqué), tenue pour reçue : ${esc(sortanteNom(p))} n’a pas répondu à l’état des lieux` : ' · payée (indiqué), reçu à confirmer') : ''}${p.reprise && (p.formerPros || []).length && l && l.dh && !(l.paye) ? ` · <span data-testid="tranche-a">${pourSortante(p, s) ? `à ${esc(sortanteNom(p))} (entreprise sortante)` : `à ${esc(entNow(p))}`}</span>` : ''}${s.decision && s.decision.ref ? ` · réf. ${esc(s.decision.ref)}` : ''}${s.decision && s.decision.payer ? ` · payée par ${esc(s.decision.payer)}` : ''}</div>
            ${(n => (n || (echeanceV17(p, s) && !s.sequestre)) && l && !l.paye ? `<div class="meta" style="color:var(--saffron-ink)" data-testid="budget-retard"><b>${s.contest && s.contest.open ? 'Paiement différé : désaccord ouvert' : n ? `Échéance dépassée de ${n} jour${n > 1 ? 's' : ''}` : `À payer${pourSortante(p, s) ? ` à ${esc(sortanteNom(p))}` : ''} avant le ${fmtDate(echeanceV17(p, s))}`}</b>${n ? ` (échéance du ${fmtDate(echeanceV17(p, s))})` : ''} · ${resteDuTxt(p, s)}${n ? ` · <span data-testid="retard-qui">${r === 'entreprise' ? 'au client de payer, ou de dire pourquoi dans les échanges' : r === 'client' ? 'déjà payé ? Indiquez-le ici ; sinon, dites à l’entreprise quand vous paierez' : 'entre le client et l’entreprise'}</span>` : ''}</div>${/* Vague 23 (régions de France, 7 fiches) : le geste « virement envoyé » là où le retard s'affiche. Vague 24 (diaspora, 4 groupes) : une phrase par bouton, et une seule date. */''}${r === 'client' && can('client', p, s, 'decide') ? `<div class="stack" style="gap:6px;margin-top:6px" data-testid="budget-boutons"><button class="btn sm" data-act="budget-paid" data-sid="${s.id}" data-testid="budget-paid-${s.id}">${icon('wallet', 'sm')}J'ai payé</button><span class="meta">Vous l’avez déjà payée : joignez le reçu, l’entreprise confirme la réception.</span><button class="btn sm ghost" data-act="budget-transit" data-sid="${s.id}" data-testid="budget-transit-${s.id}">Virement envoyé, en transit</button><span class="meta">Le virement est parti mais pas encore arrivé (2 à 4 jours ouvrés) : l’entreprise le sait.</span></div>` : ''}` : '')(retardJoursV17(p, s))}
            ${s.sequestre ? `<div class="meta" data-testid="seq-ligne">${esc(seqCourt(s))}</div>` : ''}
            ${r === 'client' && seqActif(p) && s === p.steps.find(x => !x.sequestre && !x.decision && !(x.partiels || []).length && trancheDh(p, x) && !echeanceV17(p, x) && !doneLike(x, p))   /* vague 21 (jury n° 4) : jamais sur une tranche déjà due */ && l && l.dh && p.status !== 'clos' ? `<button class="btn sm ghost" style="margin-top:6px" data-act="seq-deposer" data-sid="${s.id}" data-testid="seq-deposer-${s.id}">${icon('shield', 'sm')}Verser sur le compte de séquestre</button><span class="meta" style="display:block">La banque garde l’argent ; elle le verse à l’entreprise après l’avis favorable, quand vous confirmez.</span>` : ''}
            ${pa.length && !(l && l.paye) ? `<div class="meta" data-testid="partiels">${l.partielRecu === l.partiel ? `Versé en partie, reçu confirmé : ${dh(l.partiel)} sur ${dh(l.dh)} · reste dû ${dh(l.dh - l.partiel)}` : `Versé en partie, indiqué par le client : ${dh(l.partiel)} sur ${dh(l.dh)}${l.partielRecu ? ` (dont ${dh(l.partielRecu)} reçus)` : ''} · reste dû ${dh(l.dh - l.partielRecu)} tant que l’entreprise n’a pas confirmé ; ${dh(l.dh - l.partiel)} une fois confirmé`}${pa.filter(y => y.ref).map(y => `<br>« ${esc(y.ref)} »`).join('')}</div>` : ''}
            ${pa.map(x => `<div class="meta">${x.acompte ? 'Acompte de démarrage' : 'Versement partiel'} : ${dh(x.dh)} · ${fmtDate(x.at)}${x.by ? ` · par ${esc(x.by)}` : ''} · ${x.receivedAt ? 'reçu confirmé' : 'reçu à confirmer'}${!x.receivedAt && r === 'entreprise' && p.status !== 'clos' ? `<br><button class="btn sm saffron" style="margin-top:6px" data-act="confirm-partial" data-sid="${s.id}" data-id="${x.id}">Confirmer la réception</button> <span class="meta" data-testid="rappel-confirmer">Rappel automatique chaque 3 jours tant que ce n’est ni confirmé ni contesté.</span>` : ''}</div>`).join('')}
            ${r === 'client' && (can('client', p, s, 'acompte') || can('client', p, s, 'partiel')) ? `<button class="btn sm ghost" style="margin-top:6px" data-act="partiel" data-sid="${s.id}" data-a="${can('client', p, s, 'acompte') && !s.startedAt ? 1 : ''}" data-testid="partiel-${s.id}">${can('client', p, s, 'acompte') && !s.startedAt ? 'Verser un acompte de démarrage' : echeanceV17(p, s) || doneLike(s, p) ? 'Verser une partie de la tranche' : 'Verser une partie avant l’avis (TEEQA conseille d’attendre)'}</button><span class="meta" style="display:block">Vous payez une partie maintenant ; elle est déduite de cette tranche, l’entreprise confirme la réception.</span>` : ''}</span></div>`; }).join('')}</div>
          ${(() => { if (!b) return ''; const m = new Map(); const add = (n, v) => { if (v > 0) m.set(n, (m.get(n) || 0) + v); };
            p.steps.forEach((s, i) => { const l = b.lignes[i]; const pa = s.partiels || []; pa.forEach(x => add(x.by || who('client'), x.dh)); if (l && l.paye && l.dh) add((s.decision && s.decision.payer) || who('client'), l.dh - pa.reduce((t, x) => t + x.dh, 0)); });
            return m.size ? `<p class="meta" style="margin:0" data-testid="par-payeur"><b>Indiqué par payeur :</b> ${[...m].map(([n, v]) => `${esc(n)} ${dh(v)}`).join(' · ')} (déclaré, non vérifié par TEEQA).</p>` : ''; })()}
          ${edit ? fold('Saisir ou modifier les montants', "D'après votre devis ; l'entreprise les confirme ensuite", `${p.steps.map((s, i) => { const l = b && b.lignes[i]; return `<label class="meta" style="display:block">${esc(trancheName(p, s))}<input class="input" style="margin-top:4px;max-width:200px;display:block" inputmode="numeric" data-tr="${s.id}" aria-label="Montant de la tranche ${i + 1} en dirhams" value="${l && l.dh ? l.dh : ''}" placeholder="Montant en DH"></label>`; }).join('')}<button class="btn saffron block" data-act="budget-save" data-testid="budget-save">${icon('check', 'sm')}Enregistrer les montants</button>`, 'budget-edit')
            : r === 'entreprise' && b && !conf && p.status !== 'clos' ? `<button class="btn saffron block" data-act="budget-ok" data-testid="budget-ok">${icon('check', 'sm')}Ces montants sont ceux de mon devis</button><p class="meta">Un écart avec votre devis ? Écrivez-le au client dans les échanges.</p>` : `<p class="meta">Saisi par ${esc(who('client'))} d'après le devis${conf ? `, confirmé par ${esc(entNow(p))}` : ''}.</p>`}
          ${fold('Comment ça marche', 'Paiement hors TEEQA, acompte, versements partiels', `<p class="meta" style="margin:0">Ces montants viennent du devis : ils aident à suivre ce que le client paie à l'entreprise. ${esc(REGLES.argent)} « Payé » veut dire « indiqué par le client ». Un acompte de démarrage ou un versement partiel est déduit de sa tranche ; l'entreprise confirme chaque réception. Un avenant accepté ajoute sa ligne.</p>`)}
        </div></div>`,
        on: {
          'budget-save'(b) { const t = {}; (b.closest('.screen') || document).querySelectorAll('[data-tr]').forEach(i => { const v = +String(i.value).replace(/\D/g, ''); t[i.dataset.tr] = v || 0; }); actions.setBudget(p.id, t); toast('Montants enregistrés', 'check'); go(`#/c/${p.id}/budget`, { replace: true }); },
          'export-compta'() { const b2 = budgetOf(p); if (!b2) return; const rows = [['Tranche', 'Étape', 'Montant TTC (DH)', 'HT (DH)', 'TVA 20 % (DH)', 'État', 'Indiquée payée le', 'Reçue le', 'Référence']].concat(p.steps.map((x, i) => { const l = b2.lignes[i] || {}, d = x.decision || {}; return [i + 1, x.title, l.dh || 0, Math.round((l.dh || 0) / 1.2), (l.dh || 0) - Math.round((l.dh || 0) / 1.2), l.recu ? 'reçue' : l.paye ? 'indiquée payée, à confirmer' : x.sequestre ? 'sur le compte de séquestre' : 'à venir', d.at ? fmtDate(d.at) : '', d.receivedAt ? fmtDate(d.receivedAt) : '', d.ref || '']; }));
            const csv = '\ufeff' + rows.map(r0 => r0.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n'), nom = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tranches.csv`;
            try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); } catch { /* téléchargement indisponible */ }
            toast(`Tableur « ${nom} » enregistré`, 'file'); },
          'budget-ok'() { actions.confirmBudget(p.id); toast('Montants confirmés', 'check'); go(`#/c/${p.id}/budget`, { replace: true }); },
          'seq-choisir'() { confirmSheet({ title: 'Choisir le séquestre ?', body: `${esc(REGLES.sequestre)}<br><br>${esc(sequestreFraisTxt())}`, confirm: 'Choisir le séquestre', onConfirm: () => { actions.choisirSequestre(p.id); toast(`Séquestre choisi · ${who('entreprise')} est prévenue`, 'check'); go(`#/c/${p.id}/budget`, { replace: true }); } }); },
          'seq-accepter'() { confirmSheet({ title: 'Accepter le séquestre ?', body: `${esc(REGLES.sequestre)}`, confirm: "J'accepte le séquestre", onConfirm: () => { actions.accepterSequestre(p.id); toast('Séquestre accepté', 'check'); go(`#/c/${p.id}/budget`, { replace: true }); } }); },
          'seq-restituer'() { confirmSheet({ title: `Demander la restitution ?`, body: `${esc(SEQUESTRE.banque)} vous rendra ${dh(seqSolde(p))}. L’entreprise a 8 jours pour réclamer par écrit une tranche d’étape terminée ; cette tranche reste alors bloquée jusqu’à un accord ou une décision. TEEQA transmet seulement votre ordre.`, confirm: 'Demander la restitution', onConfirm: () => { actions.restituerSequestre(p.id); toast('Ordre de restitution transmis à la banque', 'send'); go(`#/c/${p.id}/budget`, { replace: true }); } }); },
          'budget-paid'(b) { paidSheet(p.id, b.dataset.sid); },
          'budget-transit'(b) { paidSheet(p.id, b.dataset.sid, { transit: true }); },
          'seq-deposer'(b) { const s = p.steps.find(x => x.id === b.dataset.sid); confirmSheet({ title: 'Verser sur le compte de séquestre ?', body: `${esc(trancheName(p, s))} : ${dh(trancheDh(p, s))}, par virement sur le compte n° ${esc(p.sequestre.compte)} de ${esc(SEQUESTRE.banque)}, qui confirme sa réception. ${esc(who('entreprise'))} voit que la tranche y est ; la banque la lui verse quand vous confirmez, ou d'office 5 jours après l'échéance si vous ne vous y opposez pas.`, confirm: 'Verser sur le compte', onConfirm: () => { actions.deposerSequestre(p.id, s.id); toast('Tranche sur le compte de séquestre', 'wallet'); go(`#/c/${p.id}/budget`, { replace: true }); } }); },
          'confirm-partial'(b) { actions.confirmPartial(p.id, b.dataset.sid, b.dataset.id); toast('Réception confirmée', 'check'); go(`#/c/${p.id}/budget`, { replace: true }); },
          partiel(b) { const s = p.steps.find(x => x.id === b.dataset.sid), ac = !!b.dataset.a, max = trancheDh(p, s) - (s.partiels || []).reduce((a, x) => a + x.dh, 0);
            const avant = p.steps.slice(0, p.steps.indexOf(s)).find(x => resteDu(p, x) > 0 && echeanceV17(p, x));   // vague 26 (jury n° 11) : une tranche plus ancienne due passe d'abord, l'écran le dit
            openSheet(`<h2>${ac ? 'Acompte de démarrage' : 'Verser une partie'}</h2>${avant ? `<div class="notice warn" data-testid="partiel-avant" style="margin-bottom:10px">${icon('alert', 'sm')}<span><b>À payer d’abord : tranche ${p.steps.indexOf(avant) + 1}</b> (${dh(resteDu(p, avant))}, due depuis le ${fmtDate(echeanceV17(p, avant))}). Ce versement ira sur la ${esc(trancheName(p, s).toLowerCase())}, celle que vous avez ouverte ; il ne règle pas la tranche ${p.steps.indexOf(avant) + 1}.</span></div>` : ''}<p class="muted small" style="margin-bottom:10px">${esc(trancheName(p, s))} · reste ${dh(max)}. Vous payez l'entreprise directement ; indiquez ici le montant versé. ${esc(REGLES.argent)}</p>
              <input class="input" id="vp-dh" inputmode="numeric" placeholder="Montant en DH (moins de ${dh(max)})" aria-label="Montant versé en dirhams" style="margin-bottom:8px">
              <input class="input" id="vp-by" placeholder="Payé par (facultatif)" aria-label="Payé par" style="margin-bottom:8px"><input class="input" id="vp-ref" placeholder="Pourquoi ou référence (facultatif)" aria-label="Pourquoi ou référence du versement" style="margin-bottom:10px">
              <button class="btn saffron block" id="vp-ok">Indiquer ce versement</button>`, { label: 'Versement partiel', onMount(sh) { sh.querySelector('#vp-ok').addEventListener('click', () => { const v = +String(sh.querySelector('#vp-dh').value).replace(/\D/g, ''); const id = actions.payPartial(p.id, s.id, { dh: v, by: sh.querySelector('#vp-by').value, ref: sh.querySelector('#vp-ref').value, acompte: ac }); if (!id) { toast(`Montant entre 1 DH et ${dh(max - 1)}`, 'info'); return; } closeSheet(); toast('Versement indiqué · l’entreprise confirme la réception', 'send'); go(`#/c/${p.id}/budget`, { replace: true }); }); } }); },
        },
      };
    },
  },
  {
    name: 'path', pattern: /^\/c\/([^/]+)$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role;
      const pr = progress(p);
      const cur = currentStep(p);
      const ci = p.steps.indexOf(cur);
      const contests = p.steps.filter(s => s.contest && s.contest.open).length;
      const allDone = p.steps.every(doneLike);
      const n = p.steps.length;
      // positions
      const side = (i) => (LEFTS[i % LEFTS.length] < 50 ? 'left' : LEFTS[i % LEFTS.length] > 50 ? 'right' : 'center');
      const workerRow = p.status === 'clos' ? n - 1 : ci;
      const wLeftNode = LEFTS[workerRow % LEFTS.length];
      const workerOnRight = wLeftNode <= 50;
      // maison : rangée éloignée du personnage, là où le chemin est le plus décentré
      const cand = p.steps.map((_, r) => r).filter(r => Math.abs(r - workerRow) >= 2);
      const houseRow = -1;   // la maison dessinée du chemin est retirée (11 nov.) : le décor vivant la remplace
      const hLeftNode = LEFTS[houseRow % LEFTS.length];
      const houseOnRight = hLeftNode <= 50;
      const na = nextAction(r, p);
      const nodes = p.steps.map((s, i) => {
        const isCur = i === ci && p.status !== 'clos' && !allDone;
        const bt = isCur ? bubbleText(r, p, s) : null;
        const ring = isCur && ['a_venir', 'debutee', 'fin_declaree', 'retardee', 'refusee', 'correction_soumise'].includes(s.status);
        // avancement de l'étape courante : part de l'arc tracé (porte qui se dessine)
        const ringPct = s.status === 'fin_declaree' || s.status === 'correction_soumise' ? .75 : s.status === 'debutee' || s.status === 'retardee' ? .45 : .12;
        // Anneau de l'étape en cours (refait le 11 nov. au soir, mesuré sur les captures de Duolingo, refs/mobbin/apps/duolingo/chemin-1 et 3) :
        // il suit toute la silhouette de la pastille, face et tranche comprises, à distance égale partout. Il a lui-même une tranche,
        // comme un cerceau posé au sol autour du bouton.
        // 12 nov., soir (Nabih, film à 40 s) : le cerceau était presque rond alors que la pastille est vue en perspective, il
        // paraissait plat, collé à l'écran. Il est maintenant posé au sol comme elle : même aplatissement (0,8), centré sur
        // le pied de la pastille ; l'arrière passe juste derrière elle, l'avant s'écarte devant sa tranche.
        const ARCH = 'M55 18.2 a50 40 0 1 1 -0.01 0';
        // Carreaux de zellige posés entre cette pastille et la suivante : colorés quand l'étape est close.
        const x0 = LEFTS[i % LEFTS.length], x1 = LEFTS[(i + 1) % LEFTS.length];
        const laid = doneLike(s);
        // Chemin carrelé entre deux pastilles (11 nov. soir) : des carreaux de zellige posés au sol, en vraie matière (dessus + tranche).
        // Trois propositions (pavés 1-2-3 en haut du chemin) : 1 losanges, 2 étoiles à huit branches, 3 dalles jointives à motif.
        // Étape close : carreaux posés et colorés ; sinon seulement leur tracé en pointillé, comme un chemin à construire.
        const nextRing = i + 1 === ci && p.status !== 'clos' && !allDone;
        // La bulle se décale du côté opposé au chemin qui arrive, pour ne pas le cacher ; sa pointe reste sur la pastille.
        // Largeur estimée de la bulle : elle se range entièrement d'un côté, son bord arrive juste au-dessus de la pastille.
        const xp = i ? LEFTS[(i - 1) % LEFTS.length] : x0, half = ((bt || '').length * 9.4 + 30) / 2 / 1.12, want = half - 14;
        const bx = !bt || xp === x0 ? 0 : xp > x0 ? -Math.max(0, Math.min(want, x0 * 3.6 / 1.12 - half - 6)) : want;
        return `<div class="path-row" style="height:${ROW}px" data-x="${LEFTS[i % LEFTS.length]}" data-ring="${ring ? 1 : 0}" data-bub="${bt ? `${half.toFixed(1)},${Math.round(bx)}` : ''}" data-tiles="${i < n - 1 ? (laid ? (freshValid(s) ? 'lay' : 'on') : 'todo') : ''}">
          <button class="node s-${s.status}" style="left:${LEFTS[i % LEFTS.length]}%" data-i="${i}" ${s.status === 'verrouillee' ? `data-act="locked"` : `data-act="node" aria-expanded="false" data-href="#/c/${p.id}/step/${s.id}" data-st="${statusKey(s, p)}" data-title="${esc(s.title)}" data-hint="${esc(isCur ? na.text : s.status === 'vue' ? 'Déclarée, vue par le client · sans contrôle' : s.status === 'corrigee' ? 'Corrigée · contrôlée sur photo' : s.status === 'validee' && isControlled(s) ? 'Vérifiée sur place' : doneLike(s) ? 'Close' : '')}" ${isCur && na.saffron ? 'data-saffron="1"' : ''}`} ${freshValid(s) ? `data-stamp="${p.id}:${s.id}"` : ''}>
            <span class="sr-only">Étape ${i + 1} : ${esc(s.title)} — ${STATUS[statusKey(s, p)].label}</span>
            ${ring ? `<svg class="halo" viewBox="0 0 110 110" aria-hidden="true"><path class="h-lip" d="${ARCH}"/><path class="h-bg" d="${ARCH}"/><path class="h-flip" d="${ARCH}" pathLength="1" style="--pct:${ringPct}"/><path class="h-fg" d="${ARCH}" pathLength="1" style="--pct:${ringPct}"/></svg>` : ''}
            <span class="face">${ZEL}<span class="core">${nodeIcon(s, i)}</span></span>
            ${s.contest && s.contest.open ? `<span class="flag" title="Contestation signalée">${icon('flag')}</span>` : ''}
            ${bt ? `<span class="bubble ${s.status === 'fin_declaree' || s.status === 'retardee' ? 'saffron' : ''}" style="--bx:${Math.round(bx)}px">${bt}</span>` : ''}
          </button>
          ${/* Vague 23 (doigt : Ilyas) : le nom court de chaque étape sous sa pastille, verrouillées comprises. */''}<div class="node-label${ring ? ' under-ring' : ''}" style="left:${LEFTS[i % LEFTS.length]}%" data-testid="node-name">${isControlled(s) ? '' : '<span class="nc">SANS CONTRÔLE</span>'}<span class="nn">${esc(nomCourt(s.title))}</span></div>
        </div>`;
      }).join('');
      return {
        html: `${demobar()}
        ${appbar({ title: esc(p.name), back: '#/home', right: `${r === 'client' && SALLE ? `<button class="icon-btn" data-act="share-link" aria-label="Partager le lien ou le code QR du chantier">${icon('share')}</button>` : ''}<button class="icon-btn" data-go="#/c/${p.id}/share" aria-label="Invitations et accès">${icon('users')}</button>` })}
        <div class="scroll" id="path-scroll">
          <div class="unit-banner">
            <button class="ub-main" data-go="#/c/${p.id}/step/${cur.id}">
              <div class="ub-over">${enGarantie(p) ? '<b>En garantie</b>' : p.status === 'clos' ? '<b>Archivé</b>' : allDone ? '<b>Prêt</b>' : `<b>Étape ${ci + 1} sur ${n}</b>`}<span class="rule"></span>${esc(p.city)}</div>
              <div class="ub-title">${p.status === 'clos' || allDone ? (allVerified(p) ? 'Toutes les étapes, vérifiées.' : 'Toutes les étapes, closes.') : esc(cur.title)}</div>
            </button>
            <button class="ub-side" data-go="#/c/${p.id}/report" aria-label="Rapport et documents">${icon('doc2', 'lg')}</button>
          </div>
          <div class="statusline" style="flex-wrap:wrap;row-gap:6px">
            <span class="chip success"><span class="dot"></span>${pr.done}/${pr.total} ${closedWord(p)}</span>
            ${abandonOpen(p) && p.status !== 'clos' ? `<span class="chip danger">${icon('alert', 'xs')}Arrêt signalé</span>` : ''}
            ${contests ? `<span class="chip danger">${icon('flag', 'xs')}${contests} contestation${contests > 1 ? 's' : ''}</span>` : `<span class="chip">${icon('shield', 'xs')}Accès sur invitation</span>`}
            ${p.finPrevue && p.status !== 'clos' ? (conventionOk(p) ? `<span class="chip" data-testid="fin-prevue">${icon('calendar', 'xs')}Fin prévue : ${fmtDate(finAffichee(p))}${joursSuspendus(p) ? ` (+${joursSuspendus(p)} j de délais suspendus)` : ''}</span>` : `<span class="chip" data-testid="fin-prevue">${icon('calendar', 'xs')}Fin prévue : ${fmtDate(p.finPrevue)}, à confirmer dans la convention</span>`) : ''}
            ${p.status !== 'clos' && planGap(p) > 0 ? `<span class="chip pise" data-testid="ecart-planning">${icon('clock', 'xs')}${planGap(p)} étape${planGap(p) > 1 ? 's' : ''} de retard sur le planning</span>` : ''}
            ${p.status === 'clos' ? '' : [...(allDone ? [] : overdue(p, cur)), ...overdue(p, null)].map(k => `<span class="chip danger" data-testid="en-retard">${icon('clock', 'xs')}En retard · ${DELAI_LABEL[k]}</span>`).join('')}
          </div>
          ${/* Vague 24 (doigt : Sofiane) : juste après l'inscription, la suite logique en grand : inviter l'entreprise. */''}${r === 'client' && p.status !== 'clos' && p.invites.entreprise && p.invites.entreprise.status === 'non_creee' ? `<div class="card stack invite-grand" style="gap:8px" data-testid="invite-grand"><b style="font-size:18px">Prochaine étape : inviter votre entreprise</b><p class="meta" style="margin:0">Elle accepte le chantier, puis déclare chaque étape avec ses photos. Un message WhatsApp ou SMS suffit.</p><button class="btn saffron block" data-go="#/c/${p.id}/share" data-testid="invite-grand-btn">${icon('users', 'sm')}Inviter mon entreprise</button></div>` : ''}
          ${/* Vague 26 (doigt : Anouar) : de retour sur le chantier, la preuve que l'invitation est partie et qu'on attend */''}${r === 'client' && p.status !== 'clos' && p.invites.entreprise && p.invites.entreprise.status === 'envoyee' ? `<button class="notice keep" style="width:100%;text-align:left" data-go="#/c/${p.id}/share" data-testid="invite-attente">${icon('hourglass', 'sm')}<span><b>${esc(p.invites.entreprise.name || 'Votre entreprise')} invitée le ${fmtDate(p.invites.entreprise.at)}</b> · en attente de sa réponse. Vous serez prévenu dès qu’elle accepte.</span></button>` : ''}
          ${p.status !== 'clos' && !allDone ? `<div class="path-now" data-testid="path-now"><b>Étape ${ci + 1} sur ${n} :</b> ${esc(STATUS[statusKey(cur, p)].label)}${prochaineTranche(p, r, 'path-tranche')}</div>` : ''}
          <div class="path-wrap ${ci === 0 && p.status !== 'clos' ? 'first-cur' : ''}" style="height:${n * ROW + 40}px">
            ${pathDecor(p, r, workerRow)}
            ${nodes}
            ${/* Personnage de la carte : Bellarej en 3D, posée sur son ombre, qui respire ; sa pose suit l'état du chantier. */''}
            <button class="mascot ${workerOnRight ? 'r' : 'l'}" data-act="mascot" style="top:${workerRow * ROW + 4}px" aria-label="Bellarej, la cigogne du chantier">
              ${/* Décor v3 (18 nov.) : Bellarej sur son îlot, en vidéo en boucle comme le reste du chemin (celle qui attend ; celle qui bâtit quand l'entreprise a commencé). */''}
              <span class="mascot-body mascot-vid">${decorVideo(r === 'entreprise' && cur.status === 'debutee' ? 'bellarej-batit' : 'bellarej-attend')}</span>
            </button>
            ${houseRow < 0 ? '' : `<div class="scene house-scene" data-house3d="svg" style="top:${houseRow * ROW + 6}px;${houseOnRight ? 'right:3%' : 'left:3%'};width:min(46%,190px);height:170px">${houseSVG(pr.done, { crane: p.status !== 'clos', label: `${pr.done} étapes ${closedWord(p)}` })}</div>`}
          </div>
          <div class="zellige" aria-hidden="true" style="margin:0 20px 10px"></div>
          <div class="next-divider"><span class="over">${p.status === 'clos' ? 'Archive' : 'Après les étapes'}</span></div>
          <div class="content stack" style="padding-top:0;gap:12px">
            ${abandonBlock(p, r)}
            ${/* Vague 25 (faille : contournement) : après 2 étapes, dire pourquoi garder le suivi, sans pression ; décennale ; accident. */''}${(r === 'client' || r === 'entreprise') && p.status !== 'clos' && progress(p).done >= 2 ? `<div class="list"><button class="list-item" data-go="#/c/${p.id}/rester" data-testid="rester-entree"><span class="ico-tile">${icon('flag')}</span><span class="grow"><span class="t">Continuer avec TEEQA ?</span><div class="s">Les étapes qui seront cachées arrivent ; parrainer un autre chantier</div></span>${icon('chevron', 'sm chev')}</button></div>` : ''}
            <div class="list"><button class="list-item" data-go="#/c/${p.id}/decennale" data-testid="decennale-entree"><span class="ico-tile ${p.decennale ? 'success' : 'saffron'}">${icon('shield')}</span><span class="grow"><span class="t">Attestation décennale</span><div class="s">${p.decennale ? `Police <span data-notr>${esc(p.decennale.police)}</span> · ${esc(p.decennale.assureur)}` : 'À déposer par l’entreprise avant le début'}</div></span>${icon('chevron', 'sm chev')}</button>${p.status !== 'clos' ? `<button class="list-item" data-go="#/c/${p.id}/accident" data-testid="accident-entree"><span class="ico-tile">${icon('alert')}</span><span class="grow"><span class="t">Signaler un accident</span><div class="s">Secours d’abord (15 ou 150) ; daté, vu par tous</div></span>${icon('chevron', 'sm chev')}</button>` : ''}</div>
            ${r === 'client' || r === 'entreprise' ? (() => { const av = p.avenants || [], wait = av.filter(a => a.status === 'propose' && a.by !== r).length;
              return `<div class="list"><button class="list-item" data-go="#/c/${p.id}/avenants" data-testid="avenants"><span class="ico-tile ${wait ? 'saffron' : ''}">${icon('plus')}</span><span class="grow"><span class="t">Avenants</span><div class="s">${wait ? `${wait} à examiner` : av.length ? `${av.length} avenant${av.length > 1 ? 's' : ''} · travaux en plus` : 'Travaux en plus, proposés et acceptés à deux'}</div></span>${icon('chevron', 'sm chev')}</button></div>`; })() : ''}
            <div class="card row" style="gap:14px">
              <span class="ico-tile ${p.status === 'clos' ? 'success' : can(r, p, null, 'close') ? 'saffron' : ''}">${icon(p.status === 'clos' ? 'archive' : 'lock')}</span>
              <div class="grow"><b>Réception des travaux</b><div class="meta">${p.status === 'clos' ? `Réception provisoire le ${fmtDate(p.closedAt)} · contrôleur en lecture seule` : closeBlockers(p).length ? `Avant la réception : ${closeBlockers(p).join(' · ')}` : 'Procès-verbal signé par le client, contresigné par l’entreprise'}</div></div>
              ${p.status === 'clos' ? `<button class="btn sm ghost" data-go="#/c/${p.id}/report">Rapport</button>` : can(r, p, null, 'close') ? `<button class="btn sm saffron" data-go="#/c/${p.id}/close">Réception</button>` : `<button class="btn sm ghost" data-go="#/c/${p.id}/close">Voir</button>`}
            </div>
          </div>
        </div>
        <div class="next-panel">
          <button class="fab-cur" data-act="to-current" hidden aria-label="Revenir à l'étape en cours">${icon('chevronDown', 'sm')}Étape en cours</button>
          <div class="row"><span class="ico-tile ${na.saffron ? 'saffron' : ''}">${icon(na.ic)}</span>
            <div class="np-text">${esc(na.text)}</div>
            <button class="btn sm ${na.saffron ? 'saffron' : ''}" data-go="${na.go}" data-testid="next-action">${na.btn}</button></div>
        </div>
        ${tabbar('home')}`,
        on: {
          ...abandonOn(p, `#/c/${p.id}`),
          'open-step'(b) { sfx('pop'); curtain(b.closest('.step-card'), b.dataset.href); },
          // Toucher Bellarej : elle sautille (petit moment de vie, comme le personnage de la carte de référence)
          // Partage direct : la page des invitations, déjà descendue sur le code QR et le lien à copier.
          'share-link'() { go(`#/c/${p.id}/share`); setTimeout(() => { const q = document.querySelector('#app .screen:last-of-type .qr-card'); if (q) q.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 520); },
          mascot(b) { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); sfx('pop'); navigator.vibrate && navigator.vibrate(6); },
          node(b) { openCard(b); },
          'to-current'() { const sc = document.querySelector('#path-scroll'); sc && sc.scrollTo({ top: ci <= 1 ? 0 : (ci - 1) * ROW, behavior: reduced() ? 'auto' : 'smooth' }); },
          locked(b) { toast(`Étape ${+b.dataset.i + 1} verrouillée : l'étape précédente doit être ${isControlled(p.steps[+b.dataset.i - 1] || {}) ? 'vérifiée ou corrigée' : 'consultée par le client'}`, 'lock'); },
        },
        mount(el, { refresh } = {}) {
          layTiles(el);
          if (!refresh) { const again = () => { if (!el.isConnected) return removeEventListener('resize', again); layTiles(el); }; addEventListener('resize', again); }
          // Célébration : elle se joue toute seule quand on ouvre le chantier après une validation pas encore vue (retour du 12 nov.).
          if (!refresh) { const sf = pendingFete(p, r); if (sf) { actions.feteVue(p.id, sf.id, r); setTimeout(() => fete(p, sf, latestReview(sf)), 600); } }
          mountHouse(el.querySelector('.house-scene'), { level: pr.done, key: p.id, crane: p.status !== 'clos', label: `Maison en volume : ${pr.done} étapes ${closedWord(p)} sur ${pr.total}` });
          if (refresh) return;
          const sc = el.querySelector('#path-scroll');
          const top = ci <= 1 ? 0 : (ci - 1) * ROW;
          sc.style.scrollBehavior = 'auto'; sc.scrollTop = top; sc.style.scrollBehavior = '';
          // bouton flottant : visible seulement quand l'étape en cours est sortie de l'écran
          const fab = el.querySelector('.fab-cur'), node = el.querySelector(`.node[data-i="${ci}"]`);
          const sync = () => { if (!fab || !node) return; const a = node.getBoundingClientRect(), b = sc.getBoundingClientRect(); const out = a.bottom < b.top + 60 || a.top > b.bottom - 40; fab.hidden = !out || !!el.querySelector('[data-testid="invite-grand"]') || p.steps.every(x => ['a_venir', 'verrouillee'].includes(x.status)) /* vague 25 (doigt : Bilal) : sur un chantier neuf, la pastille ne flotte plus sur la carte « Étape 1 sur 6 » */; fab.classList.toggle('up', a.bottom < b.top + 60); };
          sc.addEventListener('scroll', sync, { passive: true }); sync();
        },
      };
    },
  },
  {
    name: 'share', pattern: /^\/c\/([^/]+)\/share$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role;
      const inv = p.invites.controleur;
      // Problème 6 : le contrôleur est missionné par TEEQA (agence de la zone). Le client ne crée plus le lien ;
      // le code QR reste affiché quand le lien existe déjà, pour ouvrir le téléphone du contrôleur dans la salle.
      // 19 nov. : le lien du contrôleur n'est plus jamais montré ni copiable, ni par le client ni par l'entreprise. Seule exception :
      // la salle de présentation, où le client garde le code QR pour ouvrir le téléphone du contrôleur.
      const salleQR = SALLE && r === 'client';
      const url = !inv.token ? '' : salleQR ? `${salleBase()}/index.html?salle&role=controleur#/invite/${p.id}/controleur` : r === 'entreprise' ? "Lien masqué pour l'entreprise : TEEQA l'envoie au contrôleur seulement" : "Lien masqué : TEEQA l'envoie au contrôleur seulement";
      const recu = p.recusations || {}, mine = recu[r];
      const st = { non_creee: ['Pas encore missionné', ''], envoyee: ['Mission proposée', 'saffron'], acceptee: ['Agence missionnée', 'success'], revoquee: ['Retiré', 'danger'], expiree: ['Expiré (chantier clôturé)', ''] };
      const ctlText = { envoyee: 'TEEQA a envoyé le lien au contrôleur (valable jusqu’à la réception). En attente de son ouverture.', acceptee: 'Le contrôleur de l’agence a ouvert le lien envoyé par TEEQA : il a accès au chantier jusqu’à la réception, puis garde la lecture de ses avis. Chaque visite lui est ensuite proposée à part, et le contrôleur l’accepte ou la refuse.', revoquee: 'Ce lien a été retiré. TEEQA missionne une autre agence de contrôle de la zone.', expiree: 'Depuis la réception, le contrôleur n’agit plus ; il garde la lecture de ses avis (archive).' };
      // Vague 18 (jury, n° 4 et 5) : un seul état. Une visite proposée et pas acceptée : personne n'est encore désigné ; l'agence affichée est celle de la visite en cours.
      const enCours = missionEnCours(p), attenteCtl = !!enCours && enCours.mission.status === 'proposee';
      const susp = p.steps.find(x => x.mission && x.mission.status === 'suspendue' && x.status === 'fin_declaree');
      const ctlNom = susp ? `Visite de l’étape ${p.steps.indexOf(susp) + 1} (${agenceEtape(p, susp)}) : suspendue pendant le changement d’entreprise, elle reprend après la convention, avec la même agence` : attenteCtl ? `Visite de l’étape ${p.steps.indexOf(enCours) + 1} : contrôleur pas encore désigné` : enCours && enCours.mission.agence ? `Contrôleur de ${enCours.mission.agence}` : who('controleur', r);
      const ctlChip = inv.status !== 'acceptee' ? st[inv.status] : susp ? ['Visite suspendue', 'saffron'] : attenteCtl ? ['Visite proposée à l’agence', 'saffron'] : enCours ? ['Visite acceptée', 'success'] : ['Agence missionnée', 'success'];
      const ent = p.invites.entreprise;
      const entSt = { envoyee: ['Envoyée', 'saffron'], acceptee: ['Acceptée', 'success'], refusee: ['Refusée', 'danger'], revoquee: ['Retirée', 'danger'], expiree: ['Expirée', ''], non_creee: ['Pas encore invitée', ''] }[ent.status] || ['—', ''];
      const live = inv.status === 'envoyee' || inv.status === 'acceptee';
      const isClient = r === 'client', open = p.status !== 'clos';
      const lateInv = overdue(p, null).includes('invitation');
      return {
        html: `${appbar({ title: 'Invitations et accès', back: `#/c/${p.id}`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          ${isClient && open && ent.status === 'non_creee' ? inviteEntCard(p) : ''}
          ${isClient && open && ent.stepsAsk && !ent.stepsDone && ent.status === 'envoyee' ? `<div class="notice saffron keep" data-testid="steps-ask">${icon('message', 'sm')}<span class="grow"><b>L’entreprise demande à revoir les étapes</b> (le ${fmtDate(ent.stepsAsk)}). Elle acceptera ensuite l’invitation.</span></div>` : ''}
          ${isClient && open && ent.status !== 'acceptee' && p.id !== 'villa-demo' ? `<div class="card stack" style="gap:8px" data-testid="chantier-edit"><span class="over"><b>Ce chantier</b></span><p class="meta" style="margin:0">Tant que l’entreprise n’a pas accepté, vous pouvez le corriger ou l’annuler.</p>
            <div class="stack" style="gap:8px"><button class="btn ghost block" data-act="ch-edit" data-testid="ch-edit">${icon('pen', 'sm')}Modifier le nom, la ville, les étapes</button><button class="btn ghost block" data-act="ch-cancel" data-testid="ch-cancel">${icon('close', 'sm')}Annuler le chantier</button></div></div>` : ''}
          ${isClient && open ? `${ent.status === 'envoyee' ? `<div class="card stack" style="gap:10px" data-testid="invite-envoyee">
              <p class="muted" style="margin:0">${ent.canal === 'lien' && !ent.lastRemindAt ? `Lien d’invitation copié pour ${esc(ent.name || ent.email || ent.phone || "l'entreprise")} le ${fmtDate(ent.at)} : rien n’est parti, collez-le dans un message.` : `Invitation ${ent.canal === 'whatsapp' ? 'partagée par WhatsApp' : ent.canal === 'sms' ? 'partagée par SMS' : ent.canal === 'lien' ? 'partagée par lien' : 'envoyée'} à ${esc(ent.name || ent.email || ent.phone || "l'entreprise")} le ${fmtDate(ent.at)}${ent.lastRemindAt ? `, relancée le ${fmtDate(ent.lastRemindAt)}` : ''} : elle doit l'accepter, puis accepter la convention.`}</p>
              ${lateInv ? `<span class="chip danger" style="justify-self:start" data-testid="en-retard">${icon('clock', 'xs')}En retard · ${DELAI_LABEL.invitation}</span>` : ''}
              ${lateInv ? '' : `<div class="notice success" data-testid="invite-ok">${icon('checkCircle', 'sm')}<span>${ent.canal === 'lien' && !ent.lastRemindAt ? '<b>Lien prêt.</b> Collez-le dans un message à l’entreprise ; on vous prévient dès qu’elle accepte.' : '<b>Envoyé.</b> On vous prévient dès qu’elle accepte.'}</span></div>`}<button class="btn ${lateInv ? 'saffron block' : 'ghost sm'}" data-act="remind-ent">${icon('send', 'sm')}Relancer l'entreprise</button>${inviteShare(p)}${inviteLinkBox(p)}</div>` : ''}` : ''}
          <div class="list">
            <div class="list-item">${roleDot('client')}<span class="grow"><span class="t">${esc(ROLES.client.name)}${r === 'client' ? ' <span class="muted">(vous)</span>' : ''}</span><div class="s">Propriétaire du chantier</div></span></div>
            <div class="list-item">${roleDot('entreprise')}<span class="grow"><span class="t">${esc(ent.status === 'acceptee' ? (ent.name || ((p.formerPros || []).length ? 'Entreprise reprenante' : ROLES.entreprise.name)) : ent.status === 'non_creee' ? 'Votre entreprise' : (ent.name || 'Entreprise invitée'))}</span><div class="s">${ent.status === 'non_creee' ? 'Pas encore invitée : invitez-la ci-dessous' : `Compte entreprise${ent.email || ent.phone ? ` · ${esc(ent.email || ent.phone)}` : ent.canal ? ` · invitée par ${ent.canal === 'whatsapp' ? 'WhatsApp' : ent.canal === 'sms' ? 'SMS' : 'lien copié'}` : ''}`}${(p.formerPros || []).length && ent.status === 'acceptee' && !(p.convention && p.convention.entreprise) ? ' · justificatifs à déposer avant la convention (registre de commerce, assurance décennale, patente, CNSS) ; d’ici là, elle lit et écrit dans les échanges mais ne déclare aucune étape' : ''}</div></span><span class="chip ${entSt[1]}">${ent.status === 'acceptee' && p.convention && !p.convention.entreprise ? 'Invitation acceptée · convention à accepter' : entSt[0]}</span></div>
            <div class="list-item" data-testid="ctl-ligne">${roleDot('controleur')}<span class="grow"><span class="t">${inv.status === 'non_creee' ? 'Contrôleur' : esc(ctlNom)}</span><div class="s">${inv.status === 'non_creee' ? 'Missionné par TEEQA après la convention' : `Agence missionnée par TEEQA : ${esc(agenceEtape(p))}`}</div></span><span class="chip ${ctlChip[1]}">${ctlChip[0]}</span></div>
            <button class="list-item" data-go="#/c/${p.id}/documents" data-testid="documents"><span class="ico-tile">${icon('archive')}</span><span class="grow"><span class="t">Documents du chantier</span><div class="s">Devis, convention, photos, avis, rapport</div></span>${icon('chevron', 'sm chev')}</button>
            <button class="list-item" data-go="#/c/${p.id}/controles"><span class="ico-tile success">${icon('shield')}</span><span class="grow"><span class="t">Contrôles et forfait</span><div class="s">${formuleOf(p) === 'suivi' ? `${FORMULES.suivi.label} · aucune visite de contrôle` : `${FORMULES.controle.label} · ${(k => `${k} visite${k > 1 ? 's' : ''} sur ${p.steps.length} étapes${k > TARIFS.controle.visites ? ` (${TARIFS.controle.visites} clés + ${k - TARIFS.controle.visites} ajoutée${k - TARIFS.controle.visites > 1 ? 's' : ''})` : ''}`)(p.steps.filter(isControlled).length)}`}</div></span>${icon('chevron', 'sm chev')}</button>
            ${r !== 'controleur' ? `<button class="list-item" data-go="#/c/${p.id}/budget" data-testid="budget-link"><span class="ico-tile">${icon('wallet')}</span><span class="grow"><span class="t">Budget des travaux</span><div class="s">${budgetOf(p) ? `${dh(budgetOf(p).total)} prévus · ${dh(budgetOf(p).paye)} payés (indiqués)${budgetOf(p).partiel ? `, dont ${dh(budgetOf(p).partiel)} de versement partiel` : ''}` : 'Montant de chaque tranche, d’après le devis'}</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
            ${p.convention ? `<button class="list-item" data-go="#/c/${p.id}/convention"><span class="ico-tile ${conventionOk(p) ? 'success' : 'saffron'}">${icon('file')}</span><span class="grow"><span class="t">Convention avant travaux</span><div class="s">${conventionState(p)}</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
            ${r !== 'controleur' ? `<button class="list-item" data-go="#/c/${p.id}/avenants"><span class="ico-tile">${icon('plus')}</span><span class="grow"><span class="t">Avenants</span><div class="s">Travaux en plus, proposés et acceptés à deux</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
            <div class="list-item"><span class="ico-tile">${icon('lock')}</span><span class="grow"><span class="t">Accès : uniquement les personnes invitées</span><div class="s">Le chantier n'est jamais public ; un rapport ne sort que par un lien que vous créez, limité dans le temps</div></span></div>
          </div>
          ${isClient && open ? `<div class="section-title" style="margin-bottom:0"><span class="over">Entreprise</span></div>

            ${ent.status === 'refusee' ? `<div class="notice">${icon('alert', 'sm')}<span>L'entreprise a refusé l'invitation${ent.why ? ` : « ${esc(ent.why)} »` : ''}. Vous pouvez inviter une autre entreprise.</span></div>` : ''}
            <div class="list"><button class="list-item" data-act="change-ent" data-testid="change-ent"><span class="ico-tile ${ent.status === 'refusee' ? 'saffron' : ''}">${icon('refresh')}</span><span class="grow"><span class="t">Changer d'entreprise</span><div class="s">${ent.status === 'refusee' ? 'Inviter une autre entreprise' : "L'entreprise sortante ne peut plus que répondre à l'état des lieux (8 jours), où elle confirme ou conteste les paiements indiqués ; elle garde le dossier de ce qu'elle a fait"}</div></span>${icon('chevron', 'sm chev')}</button></div>` : ''}
          ${repriseBlock(p, r)}
          ${isClient ? procheBlock(p, open) : r === 'entreprise' ? `<div class="notice" data-testid="qui-decide-ent">${icon('users', 'sm')}<span><b>Qui décide des paiements :</b> ${esc(decideursLine(p))}.${(p.proches || []).length ? `<br><span data-testid="droits-proches-ent">${(p.proches || []).map(x => { const d = Object.keys(DROITS).filter(k => x.droits && x.droits[k]).map(k => DROITS[k].toLowerCase()); return `${esc(x.name)}${x.lien ? ` (${esc(x.lien.toLowerCase())})` : ''} : ${d.length ? `co-décideur, ${esc(d.join(', '))}` : 'lecture seule, ne décide de rien'}`; }).join(' · ')}. Le client titulaire a le dernier mot.</span>` : ''}</span></div>` : ''}
          ${!isClient ? `<div class="card stack" style="gap:8px" data-testid="evenements-graves"><span class="over">Si un événement grave arrive</span>${faillesListe(p.id, r)}</div>` : ''}
          ${equipeBlock(p, r, open)}
          <div class="section-title" style="margin-bottom:0"><span class="over">Contrôleur missionné par TEEQA</span></div>
          ${inv.status === 'non_creee' ? `
            <div class="card stack"><p class="muted" style="margin:0">TEEQA missionnera une agence de contrôle dès que l'entreprise et la convention seront acceptées. TEEQA envoie au contrôleur de l'agence de la zone un lien, sans compte, valable jusqu'à la réception des travaux (ensuite, lecture de ses avis seulement).</p>${zoneLine(p)}</div>` : `
            <div class="card stack" style="gap:10px" data-testid="agence">
              <div class="row" style="gap:12px">${roleDot('controleur')}<span class="grow"><b>${esc(attenteCtl ? 'Contrôleur pas encore désigné' : (susp || enCours) && (susp || enCours).mission.agence ? `Contrôleur de ${(susp || enCours).mission.agence}` : who('controleur', r))}</b><div class="meta">${esc(agenceEtape(p))}${(susp || enCours) && (susp || enCours).mission.agence ? ` (autre agence pour la visite de l’étape ${p.steps.indexOf(susp || enCours) + 1} ; l’agence du chantier reste ${esc((inv.agence || '').split(' · ')[0])})` : ''}</div>${enCours ? `<div class="meta" data-testid="visite-en-cours">Visite de l’étape ${p.steps.indexOf(enCours) + 1} : ${enCours.mission.lateFrom && enCours.mission.agence ? `confiée le ${fmtDate(enCours.mission.at)} à ${esc(enCours.mission.agence)}, après le retard de la première agence (sa visite acceptée n’a pas eu lieu à temps) ; ` : ''}${attenteCtl ? `${enCours.mission.lateFrom && enCours.mission.agence ? 'cette agence ne l’a' : 'proposée à l’agence, elle ne l’a'} pas encore acceptée ; le contrôleur qui passera n’est pas encore désigné` : 'acceptée'}</div>` : ''}</span><span class="chip ${ctlChip[1]}">${ctlChip[0]}</span></div>
              <div class="meta" data-testid="agence-qualif">${agrementEtape(p) ? `Agrément ${esc(String(agrementEtape(p)).replace(/^agrément\s*/i, ''))} · ` : ''}bureau de contrôle assuré pour ses propres erreurs (responsabilité civile de l’agence, qui ne remplace pas la décennale de l’entreprise), vérifié par TEEQA avant toute mission</div>
              ${r === 'client' || r === 'entreprise' ? `<p class="meta" style="margin:0" data-testid="anti-arnaque"><b>${esc(REGLES.arnaque)}</b>${r === 'entreprise' ? ' Un doute sur la personne qui se présente ? Ne lui remettez rien et appelez l’agence annoncée ici.' : ''}</p>` : ''}
              <details class="more"><summary>${icon('chevronDown', 'sm')}<span><b>Agence, agrément, assurance</b><small>Ce que TEEQA a vérifié</small></span></summary><div class="more-in stack" style="gap:8px"><p class="meta" style="margin:0">${ctlText[inv.status] || ''}</p>
              <dl class="kv" style="margin:0">
                <dt>Agence</dt><dd>${esc(inv.agence || '—')}${inv.siege ? ` · ${esc(inv.siege)}` : ''}</dd>
                <dt>Agrément</dt><dd>${esc(inv.agrement || '—')}</dd>
                <dt>Assurance</dt><dd>${esc(inv.assurance || '—')}</dd>
                ${r === 'entreprise' ? `</dl>`
                : `<dt>Qualité</dt><dd>${esc(inv.qualite || '—')}</dd>
                <dt>Indépendance</dt><dd>${inv.independance ? "Déclaration d'indépendance signée" : 'Déclaration attendue'}</dd>
              </dl>`}</div></details>
              ${r === 'entreprise' ? `<p class="meta" style="margin:0" data-testid="anon-why">${esc(REGLES.anonyme)} L'agence répond de lui.</p>` : ''}
            </div>
            ${salleQR && live && inv.token ? `<div class="qr-card">${qrSVG(url, { size: 176 })}
              <p class="meta">Salle de présentation : scannez ce code avec le téléphone du contrôleur pour ouvrir sa mission.</p></div>` : ''}
            ${inv.token && r !== 'controleur' ? `<div class="linkbox ${salleQR && live ? '' : 'dead'}" data-testid="invite-link">${icon(salleQR ? 'link' : 'lock', 'sm')}<span>${url}</span></div>` : ''}
            <details class="more"><summary>${icon('chevronDown', 'sm')}<span><b>Rôle, visites et durée de l'accès</b><small>Ce que le contrôleur peut faire ici</small></span></summary>
            <dl class="kv card" style="margin:8px 0 0">
              <dt>Rôle</dt><dd>Contrôleur tiers sur place, missionné par TEEQA, sans compte</dd>
              <dt>Visites</dt><dd>${allControlled(p) ? `Chaque étape (${p.steps.length})` : `Étapes ${p.steps.map((s, i) => isControlled(s) ? i + 1 : 0).filter(Boolean).join(', ')} sur ${p.steps.length}`}</dd>
              <dt>Périmètre</dt><dd>Ce chantier uniquement : consulter, photographier, signer un avis</dd>
              <dt>Durée</dt><dd>${inv.status === 'expiree' ? `Lecture seule depuis le ${fmtDate(inv.expiredAt)}` : 'Jusqu’à la réception, puis lecture de ses avis'}</dd>
              <dt>Statut</dt><dd>${st[inv.status][0]}${inv.acceptedAt ? ` · ${fmtDate(inv.acceptedAt)}` : ''}</dd>
            </dl></details>
            ${(r === 'client' || r === 'entreprise') && open ? (can(r, p, null, 'recuse') ? `<div class="list">
              <button class="list-item" data-act="recuse" data-testid="recuse"><span class="ico-tile saffron">${icon('refresh')}</span><span class="grow"><span class="t">Demander une autre agence de contrôle</span><div class="s">Récusation : une fois, avec un motif. Changer d’agence pour un retard ne la compte pas.</div></span>${icon('chevron', 'sm chev')}</button>
            </div>` : mine ? `<div class="notice">${icon('info', 'sm')}<span>Vous avez demandé une autre agence le ${fmtDate(mine.at)} (une fois par partie).</span></div>` : recuseBlocked(p) ? `<div class="notice" data-testid="recuse-blocked">${icon('info', 'sm')}<span>${esc(REGLES.recuse)}</span></div>` : '') : ''}`}
          ${inv.status !== 'non_creee' && r === 'controleur' ? `<button class="btn ghost block" data-go="#/invite/${p.id}/controleur">${icon('eye', 'sm')}Voir la mission reçue</button>` : ''}
          ${(r === 'client' || r === 'entreprise') && p.status !== 'clos' && (abandonOpen(p) || can(r, p, null, 'abandon')) ? `<div class="section-title" style="margin-bottom:0"><span class="over">Arrêt du chantier</span></div>${abandonBlock(p, r)}` : ''}
        </div></div>`,
        on: {
          'ch-edit'() { openSheet(`<h2>Modifier le chantier</h2><div class="field"><label for="ce-name">Nom</label><input id="ce-name" class="input" maxlength="40" value="${esc(p.name)}"></div><div class="field" style="margin-top:8px"><label for="ce-city">Ville</label><input id="ce-city" class="input" maxlength="40" value="${esc(p.city)}"></div>
              <p class="over" style="margin:12px 0 4px"><b>Étapes</b> <span class="meta">(trois au moins ; décochez pour retirer)</span></p><div class="stack" style="gap:6px">${p.steps.map((x, k) => `<label class="row" style="gap:8px;min-height:44px"><input type="checkbox" data-ce-keep="${x.id}" checked style="width:22px;height:22px;accent-color:var(--success)"><input class="input grow" data-ce-t="${x.id}" maxlength="50" value="${esc(x.title)}" aria-label="Étape ${k + 1}"></label>`).join('')}</div>
              <div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-ce-ok data-testid="ce-ok">Enregistrer</button></div>`, { label: 'Modifier le chantier',
              onMount: (el) => el.querySelector('[data-ce-ok]').addEventListener('click', () => { const steps = p.steps.filter(x => el.querySelector(`[data-ce-keep="${x.id}"]`).checked).map(x => ({ id: x.id, title: el.querySelector(`[data-ce-t="${x.id}"]`).value }));
                if (steps.length < 3) return toast('Gardez au moins trois étapes', 'info'); actions.editProject(p.id, { name: el.querySelector('#ce-name').value, city: el.querySelector('#ce-city').value, steps }); closeSheet(true); toast('Chantier modifié', 'check'); go(`#/c/${p.id}/share`, { replace: true }); }) }); },
          'ch-cancel'() { confirmSheet({ title: 'Annuler ce chantier ?', body: `« ${p.name} » disparaît de vos chantiers et le lien d’invitation ne marche plus.`, confirm: 'Annuler le chantier', danger: true,
            onConfirm: () => { actions.cancelProject(p.id); toast('Chantier annulé', 'check'); go('#/home', { replace: true }); } }); },
          ...abandonOn(p, `#/c/${p.id}/share`),
          ...inviteEntOn(p, `#/c/${p.id}/share`),
          recuse() {
            motifSheet({ title: 'Demander une autre agence', body: `${REGLES.recuse} L'accès actuel est retiré ; ses photos et ses avis signés restent conservés.`, label: 'Motif (obligatoire)', placeholder: 'Ex. : lien de parenté avec une des parties.', confirm: 'Récuser',
              onOk: (m) => { actions.recuseController(p.id, r, m); toast('Récusation transmise à TEEQA', 'refresh'); go(`#/c/${p.id}/share`, { replace: true }); } });
          },
          'proche-droits'(b) { const x = (p.proches || []).find(y => y.id === b.dataset.id); if (x) procheDroitsSheet(p, x); },
          'equipe-add'() { openSheet(`<h2>Inviter un membre de mon équipe</h2><p class="muted small" style="margin-bottom:12px">Il reçoit un lien par SMS ou WhatsApp, sans compte, et agit dans sa langue, avec les seuls droits de sa fonction :</p>
              <dl class="kv" style="margin:0 0 10px">${Object.entries(EQUIPE_ROLES).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v.txt)}</dd>`).join('')}</dl>
              <div class="field"><label for="eq-name">Prénom</label><input id="eq-name" class="input" maxlength="40" autocomplete="off" placeholder="Ex. Saïd"></div>
              <div class="field"><label for="eq-role">Fonction</label><select id="eq-role" class="input">${Object.keys(EQUIPE_ROLES).map(k => `<option>${esc(k)}</option>`).join('')}</select></div>
              <div class="field"><label for="eq-tel">Téléphone (SMS ou WhatsApp)</label><input id="eq-tel" class="input" inputmode="tel" maxlength="30" autocomplete="off" placeholder="+212 6 •• •• •• ••"></div>
              <details class="more" data-testid="equipe-qr"><summary>${icon('chevronDown', 'sm')}<span><b>Sur le chantier : montrer un code QR</b><small>Il le scanne, puis donne son prénom et sa fonction</small></span></summary><div class="more-in" style="justify-items:center">${qrSVG(`${appBase()}#/c/${p.id}`, { size: 160 })}</div></details>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-eq-ok disabled>Envoyer le lien</button></div>`, { label: 'Inviter un membre de mon équipe',
              onMount: (el) => { const n = el.querySelector('#eq-name'), t = el.querySelector('#eq-tel'), ok = el.querySelector('[data-eq-ok]'); const v = () => n.value.trim().length > 1 && t.value.replace(/\D/g, '').length >= 8; [n, t].forEach(x => x.addEventListener('input', () => { ok.disabled = !v(); }));
                ok.addEventListener('click', () => { actions.inviteEquipe(p.id, { name: n.value, role: el.querySelector('#eq-role').value || 'Chef de chantier', contact: t.value }); closeSheet(true); toast('Lien prêt : partagez-le par SMS ou WhatsApp', 'link'); go(`#/c/${p.id}/share`, { replace: true }); }); } }); },
          edl() { openSheet(`<h2>État des lieux de reprise</h2><p class="muted small" style="margin-bottom:12px">Décrivez ce que vous trouvez : ouvrages commencés, état du ferraillage, matériaux sur place. Joignez les photos prises dans l'appli (datées). Le client le relit et le signe.</p>
              <div class="field"><label for="edl-note">Ce que vous constatez</label><textarea id="edl-note" class="textarea" maxlength="400" placeholder="Ex. Poteaux de l'étage montés à moitié, aciers en attente rouillés en surface, 40 sacs de ciment sur place."></textarea></div>
              <label class="card row" style="gap:12px;cursor:pointer;margin-top:10px"><input type="checkbox" id="edl-ph" checked style="width:22px;height:22px;accent-color:var(--success)"><span class="grow"><b>Joindre 6 photos prises sur place</b><div class="meta">Heure de prise gardée, même sans réseau</div></span></label>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-edl-ok disabled>Envoyer au client</button></div>`, { label: 'État des lieux',
              onMount: (el) => { const t = el.querySelector('#edl-note'), ok = el.querySelector('[data-edl-ok]'); t.addEventListener('input', () => { ok.disabled = t.value.trim().length < 10; });
                ok.addEventListener('click', () => { actions.etatDesLieux(p.id, { note: t.value, photos: el.querySelector('#edl-ph').checked ? 6 : 0, role: 'entreprise' }); closeSheet(true); toast('État des lieux envoyé au client', 'send'); go(`#/c/${p.id}/share`, { replace: true }); }); } }); },
          'edl-client'() { confirmSheet({ title: "Signer l'état des lieux ?", body: `Vous confirmez avoir lu l'état des lieux décrit par la nouvelle entreprise : « ${esc((p.reprise && p.reprise.note) || '')} ». Pour un désaccord, écrivez-le dans les échanges avant de signer.`, confirm: 'Signer',
              onConfirm: () => { actions.etatDesLieux(p.id, { role: 'client' }); toast('État des lieux signé', 'check'); go(`#/c/${p.id}/share`, { replace: true }); } }); },
          empeche() { noteSheet({ title: 'Titulaire empêché', intro: `${REGLES.suppleant}`, onOk: (t) => { actions.empecheTitulaire(p.id, { motif: t }); toast('Empêchement enregistré · entreprise prévenue', 'check'); go(`#/c/${p.id}/share`, { replace: true }); } }); },
          'fin-empeche'() { actions.finEmpeche(p.id); toast('Vous reprenez la main', 'check'); go(`#/c/${p.id}/share`, { replace: true }); },
          'proche-add'() {
            openSheet(`<h2>Inviter un proche</h2>
              <div class="notice" style="margin:10px 0 14px">${icon('eye', 'sm')}<span>D'abord en lecture seule : votre proche voit l'avancement des étapes et les avis du contrôleur. Ensuite, si vous le voulez, le bouton « Droits » lui délègue des gestes (décider des paiements, écrire, envoyer des photos).</span></div>
              <div class="field"><label for="pr-name">Prénom</label><input id="pr-name" class="input" autocomplete="off" maxlength="40" placeholder="Ex. Samira"></div>
              <div class="field"><label for="pr-lien">Lien <span class="meta">(facultatif)</span></label><input id="pr-lien" class="input" autocomplete="off" maxlength="40" placeholder="Ex. Sœur, sur place à Nador"></div>
              <div class="field"><label for="pr-contact">Téléphone ou e-mail</label><input id="pr-contact" class="input" autocomplete="off" maxlength="60" placeholder="Ex. +212 6 00 00 00 00"></div>
              <div class="stack" style="margin-top:14px"><button class="btn saffron block" data-pr-ok disabled>Envoyer l'invitation en lecture seule</button><button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`,
            { label: 'Inviter un proche', onMount: (el) => { const n = el.querySelector('#pr-name'), c = el.querySelector('#pr-contact'), ok = el.querySelector('[data-pr-ok]');
              const valid = () => n.value.trim().length > 1 && c.value.trim().length > 5;
              [n, c].forEach(x => x.addEventListener('input', () => { ok.disabled = !valid(); }));
              ok.addEventListener('click', () => { if (!valid()) return; actions.inviteProche(p.id, { name: n.value, lien: el.querySelector('#pr-lien').value, contact: c.value }); closeSheet(true); toast('Invitation en lecture seule envoyée', 'send'); go(`#/c/${p.id}/share`, { replace: true }); }); } });
          },
          'proche-del'(b) { confirmSheet({ title: 'Retirer cet accès ?', body: 'Votre proche ne verra plus le chantier.', confirm: 'Retirer', danger: true, onConfirm: () => { actions.removeProche(p.id, b.dataset.id); toast('Accès retiré', 'check'); go(`#/c/${p.id}/share`, { replace: true }); } }); },
          'remind-ent'() { actions.remind(p.id, null, 'invitation'); sfx('pop'); toast("Relance envoyée à l'entreprise", 'send'); go(`#/c/${p.id}/share`, { replace: true }); },
          'change-ent'() {
            openSheet(`<h2>Changer d'entreprise</h2>
              <div class="notice" style="margin:10px 0 14px">${icon('alert', 'sm')}<span>${ent.status === 'acceptee' ? "L'entreprise actuelle ne peut plus agir sur le chantier, sauf répondre à l'état des lieux (8 jours) ; TEEQA lui remet le dossier de ce qu'elle a fait (photos, déclarations, avis, échanges), qui reste aussi au dossier du chantier. " : ''}La nouvelle entreprise reçoit une invitation : elle devra l'accepter, puis accepter la convention avant de reprendre les travaux.</span></div>
              <div class="field"><label for="ce-nom">Nom de la nouvelle entreprise <span class="meta">(facultatif)</span></label><input id="ce-nom" class="input" autocomplete="off" maxlength="40" placeholder="Ex. Atlas Bâtiment" data-testid="ce-nom"></div>
              <div class="field"><label for="ce-mail">E-mail ou téléphone (SMS, WhatsApp) de la nouvelle entreprise</label><input id="ce-mail" class="input" autocomplete="off" placeholder="contact@entreprise.ma ou +212 6 …"></div>
              ${p.steps.some(x => x.startedAt) ? `<p class="meta" style="margin-top:8px">Les travaux ont commencé : la nouvelle entreprise fera un <b>état des lieux de reprise</b> (photos et description), que vous signerez, avant toute nouvelle étape.</p>` : ''}
              <div class="stack" style="margin-top:14px"><button class="btn saffron block" data-ce-ok disabled>Envoyer l'invitation</button><button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`,
            { label: "Changer d'entreprise", onMount: (el) => { const m = el.querySelector('#ce-mail'), ok = el.querySelector('[data-ce-ok]');
              const valid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim()) || m.value.replace(/\D/g, '').length >= 9;
              m.addEventListener('input', () => { ok.disabled = !valid(); });
              ok.addEventListener('click', () => { if (!valid()) return; actions.changeEntreprise(p.id, m.value.trim(), el.querySelector('#ce-nom').value.trim()); closeSheet(true); toast('Invitation envoyée à la nouvelle entreprise', 'send'); go(`#/c/${p.id}/share`, { replace: true }); }); } });
          },
        },
      };
    },
  },
  {
    name: 'invite', pattern: /^\/invite\/([^/]+)\/(entreprise|controleur)$/,
    render(pid, role) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role;
      const inv = p.invites[role];
      // app.js renvoie ici toute personne sans accès actif : l'écran explique chaque cas (refus, lien retiré, entreprise remplacée, fin d'accès).
      const me = get().account, myMail = me && me.role === 'entreprise' && me.email ? me.email.toLowerCase() : '';
      const replaced = role === 'entreprise' && myMail && (inv.email || '').toLowerCase() !== myMail && [...(p.formerPros || []), ...(p.formerInvites || [])].some(f => f && ((f.email || '').toLowerCase() === myMail || f.by === myMail));
      const status = replaced ? 'remplacee' : role === 'controleur' && p.status === 'clos' && inv.status === 'acceptee' ? 'expiree' : inv.status;
      const ctl = role === 'controleur', client1 = ROLES.client.name.split(' ')[0];
      const states = {
        envoyee: ctl ? { over: 'Mission reçue', title: `TEEQA vous confie le contrôle de « ${p.name} »`, chip: ['Valide', 'success'], why: `Mission confiée par TEEQA, pour ${ROLES.client.name}. Ce lien temporaire, sans compte, vous donne accès à ce chantier seulement.` }
          : { over: 'Invitation reçue', title: `${client1} vous invite sur « ${p.name} »`, chip: ['Valide', 'success'], why: "Acceptez l'invitation, puis la convention de suivi, avant de débuter les travaux. Vous pouvez aussi la refuser : le client sera prévenu." },
        acceptee: { over: ctl ? 'Mission acceptée' : 'Invitation acceptée', title: `Vous avez accès à « ${p.name} »`, chip: ['Active', 'success'] },
        refusee: { over: 'Invitation refusée', title: r === role ? 'Vous avez refusé ce chantier' : "L'entreprise a refusé ce chantier", chip: ['Refusée', 'danger'], why: `Refusée le ${fmtDate(inv.refusedAt)}${inv.why ? ` : « ${inv.why} »` : ''}. Vous n'avez pas accès au chantier ; le client peut inviter une autre entreprise.` },
        revoquee: ctl ? { over: 'Lien retiré', title: 'Ce lien de contrôle a été retiré', chip: ['Retiré', 'danger'], why: `Une des parties a récusé le contrôleur ou TEEQA a confié la mission à une autre agence${inv.revokedAt ? ` (le ${fmtDate(inv.revokedAt)})` : ''}. Vos photos et vos avis signés restent conservés dans l'historique.` }
          : { over: 'Accès retiré', title: "Votre accès à ce chantier a été retiré", chip: ['Retiré', 'danger'], why: "Le client a changé d'entreprise. Votre historique (photos, déclarations, échanges) reste conservé dans le dossier du chantier." },
        remplacee: { over: 'Accès retiré', title: 'Le client a choisi une autre entreprise', chip: ['Retiré', 'danger'], why: "Une autre entreprise a été invitée sur ce chantier. Vous n'y avez plus accès ; votre historique reste conservé dans le dossier." },
        expiree: { over: ctl ? 'Lien expiré' : 'Invitation expirée', title: p.status === 'clos' ? (enGarantie(p) ? 'Réception signée, chantier en garantie\u00a0: cet accès a pris fin' : 'Le chantier est clôturé\u00a0: cet accès a pris fin') : 'Cette invitation a expiré', chip: ['Expiré', ''], why: p.status === 'clos' ? "Depuis la réception, le contrôleur n'agit plus. Il garde la lecture de ses avis et du rapport (archive)." : "Demandez au client de vous inviter à nouveau." },
        non_creee: ctl ? { over: 'Pas encore de mission', title: 'Aucun contrôleur missionné pour l’instant', chip: ['—', ''], why: "TEEQA missionnera une agence de contrôle dès que l'entreprise et la convention seront acceptées." }
          : { over: 'Aucune invitation', title: "Pas d'invitation pour ce rôle", chip: ['—', ''], why: "Le client n'a pas encore invité d'entreprise sur ce chantier." },
      };
      const S = states[status] || states.non_creee;
      const ended = ['revoquee', 'expiree', 'refusee', 'remplacee'].includes(status);
      return {
        html: `${appbar({ title: 'Invitation', back: '#/home', close: true })}
        <div class="scroll"><div class="content stack" style="gap:16px">
          <div class="invite-hero">
            <div class="row" style="justify-content:space-between"><span class="over" style="color:var(--saffron)">${S.over}</span><span class="chip ${S.chip[1]}">${S.chip[0]}</span></div>
            <div class="h1">${esc(S.title)}</div>
            <div class="arch-frame" style="${ended ? 'opacity:.45' : ''}">${houseSVG(progress(p).done, { crane: false, dark: true })}</div>
          </div>
          ${role === 'entreprise' && !ended ? `<div class="resume stack" style="gap:4px" data-testid="invite-resume"><div class="meta"><b>Chantier :</b> ${esc(p.name)} · ${esc(p.city)}, pour ${esc(ROLES.client.name)}</div><div class="meta"><b>Pour vous :</b> accepter ou refuser ; puis accepter la convention avant de débuter.</div></div>` : ''}
          ${role === 'entreprise' && !ended && p.steps.some(isControlled) ? `<div class="notice" data-testid="invite-frais">${icon('wallet', 'sm')}<span><b>Ce qui peut vous être facturé :</b> une contre-visite (${tarif('contreVisiteMineure', { eur: false })} ou ${tarif('contreVisite', { eur: false })}), ou un second avis si vous le demandez (${tarif('secondAvis', { eur: false })}, non facturé si l'avis est annulé) ; jamais plus qu'une visite.</span></div>` : ''}
          ${role !== 'entreprise' || ended ? '' : (() => { const z = (get().pro && get().pro.zone) || 'Nador et Berkane, Oriental'; return z.toLowerCase().includes(String(p.city || '').toLowerCase()) ? '' : `<div class="notice saffron" data-testid="hors-zone-pro">${icon('pin', 'sm')}<span><b>Hors de votre zone :</b> ce chantier est à ${esc(p.city)}, votre fiche indique « ${esc(z)} ». Vérifiez que vous pouvez y intervenir avant d'accepter.</span></div><button class="btn sm ghost" style="justify-self:start" data-act="zone-add" data-testid="zone-add">${icon('plus', 'sm')}Ajouter ${esc(p.city)} à ma zone</button>`; })()}
          ${role === 'entreprise' && !ended ? '' : `<dl class="kv card" style="margin:0">
            <dt>Chantier</dt><dd>${esc(p.name)} · ${esc(p.city)}</dd>
            <dt>${role === 'controleur' ? 'Mission' : 'Invité par'}</dt><dd>${role === 'controleur' ? `Confiée par TEEQA, pour ${esc(ROLES.client.name)}` : esc(ROLES.client.name)}</dd>
            <dt>Votre rôle</dt><dd>${ROLES[role].label}${role === 'controleur' ? ' tiers sur place' : ' (compte)'}</dd>
            <dt>Périmètre</dt><dd>${role === 'controleur' ? 'Consulter, photographier sur place, signer un avis' : 'Déclarer début et fin, ajouter des photos, corriger'}</dd>
            <dt>${ended ? 'Accès' : 'Expiration'}</dt><dd>${status === 'revoquee' || status === 'remplacee' ? 'Retiré' : status === 'refusee' ? 'Invitation refusée' : status === 'expiree' ? (p.status === 'clos' ? (ctl ? 'Lecture seule de vos avis depuis la réception' : 'Expiré à la réception des travaux') : 'Expiré') : ctl ? 'À la réception des travaux' : 'Compte permanent'}</dd>
          </dl>`}
          ${role === 'entreprise' && !ended ? '' : `${S.why ? `<div class="notice ${ended ? '' : 'saffron'}" data-testid="invite-why">${icon(ended ? 'info' : 'shield', 'sm')}<span>${esc(S.why)}</span></div>` : ''}`}
          ${role === 'entreprise' && p.prep ? `<details class="more" data-testid="invite-etapes"><summary>${icon('chevronDown', 'sm')}<span><b>Les ${p.steps.length} étapes proposées</b><small>${p.prep.confirmedAt ? 'Confirmées' : 'À confirmer en acceptant'} · ${p.prep.quote ? 'devis joint' : 'sans devis'}</small></span></summary><div class="more-in stack" style="gap:10px">
            <ol style="margin:0;padding-left:20px;display:grid;gap:4px">${p.steps.map((x) => `<li>${esc(x.title)}${isControlled(x) ? '' : ' <span class="meta">· sans visite</span>'}</li>`).join('')}</ol>
            <div class="meta">${esc(prepLine(p))}</div>
            <div class="meta">${p.prep.quote ? `${icon('file', 'xs')} Devis joint par le client : ${esc(p.prep.quote.name)}` : 'Aucun devis joint.'}</div>
            ${p.prep.confirmedAt ? `<div class="meta" style="color:var(--success-ink)">Confirmées par l'entreprise le ${fmtDate(p.prep.confirmedAt)}.</div>` : `<p class="meta">En acceptant, vous confirmez ce découpage. Pour le changer, parlez-en au client avant d'accepter : lui seul modifie les étapes.</p>`}
          ${role === 'entreprise' && !ended && p.prep && !p.prep.confirmedAt ? `<button class="btn ghost block" data-act="ask-steps" data-testid="ask-steps">${icon('message', 'sm')}Demander au client de revoir les étapes</button>` : ''}</div></details>` : ''}
          ${role === 'entreprise' && !ended && p.steps.some(isControlled) ? `<details class="more" data-testid="invite-agence"><summary>${icon('chevronDown', 'sm')}<span><b>Contrôle de ce chantier</b><small>Agence, délais, anonymat du contrôleur</small></span></summary><div class="more-in stack" style="gap:6px">${zoneLine(p)}<p class="meta" style="margin:0">${esc(REGLES.anonyme)} ${esc(REGLES.recuse)}</p></div></details>` : ''}
          ${role === 'entreprise' && !ended ? `<details class="more" data-testid="benefice-entreprise"><summary>${icon('chevronDown', 'sm')}<span><b>Ce que TEEQA vous apporte</b><small>Preuve, paiement plus rapide, rapport</small></span></summary><div class="more-in">
            <ul class="losange"><li><b>La preuve de votre travail</b> : vos photos datées et les avis signés montrent ce qui était fait, et quand.</li>
              <li><b>Un paiement plus rapide quand l'avis est bon</b> : dès l'étape close, TEEQA dit au client « Paiement recommandé ».</li>
              <li><b>Un rapport à montrer à vos futurs clients</b>, et une fiche pro qui affiche vos chantiers suivis.</li></ul></div></details>
          ${p.convention && !p.convention.entreprise ? `
          <details class="more" data-testid="invite-convention"><summary>${icon('chevronDown', 'sm')}<span><b>La convention de suivi</b><small>${conventionArticles(p).length} articles, acceptés juste après l'invitation</small></span></summary>
            <div class="more-in stack" style="gap:8px">${conventionArticles(p).map(([t, b], i) => `<div><b>${i + 1}. ${t}</b><div class="meta cv-body" style="margin-top:2px">${b}</div></div>`).join('')}</div></details>
          <details class="more" data-testid="invite-annexe"><summary>${icon('chevronDown', 'sm')}<span><b>L'annexe tarifaire</b><small>Qui paie quoi, combien et quand</small></span></summary><div class="more-in stack" style="gap:8px">${annexeBody()}</div></details>` : ''}` : ''}
          ${r !== role && !SALLE ? `<div class="notice saffron">${icon('users', 'sm')}<span>Cette invitation est destinée au rôle ${ROLES[role].label}. Vous êtes en vue ${ROLES[r].label}.</span></div>
            <button class="btn ghost block" data-act="as-role">Passer en vue ${ROLES[role].label}</button>` : ''}
        </div></div>
        <div class="footer-cta">
          ${status === 'envoyee' && r === role ? `<button class="btn saffron block" data-act="accept">${role === 'entreprise' && p.prep ? 'Accepter et confirmer les étapes' : ctl ? 'Ouvrir la mission' : "Accepter l'invitation"}</button>${role === 'entreprise' ? `<button class="btn ghost block" data-act="decline" data-testid="decline-invite">Refuser l'invitation</button>` : `<button class="btn ghost block" data-go="#/home">Plus tard</button>`}` : ''}
          ${status === 'acceptee' ? `<button class="btn block" data-go="#/c/${p.id}">Ouvrir le chantier</button>` : ''}
          ${status === 'expiree' && p.status === 'clos' && ctl ? `<button class="btn block" data-go="#/c/${p.id}/report">Voir le rapport</button>` : ''}
          ${ended ? `<button class="btn ghost block" data-go="#/home">Retour à l'accueil</button>` : ''}
        </div>`,
        on: {
          'zone-add'() { const z = (get().pro && get().pro.zone) || 'Nador et Berkane, Oriental'; actions.setPro({ zone: `${z}, ${p.city}` }); sfx('choix'); toast(`${p.city} ajoutée à votre fiche`, 'check'); go(location.hash, { replace: true }); },
          'ask-steps'() { actions.requestStepChange(p.id); sfx('send'); toast('Demande envoyée au client', 'message'); },
          accept() { actions.acceptInvite(p.id, role); sfx('pose'); toast(role === 'entreprise' && p.prep ? 'Étapes confirmées' : 'Invitation acceptée', 'check'); go(`#/c/${p.id}`, { replace: true }); },
          decline() {
            confirmSheet({ title: "Refuser l'invitation ?", body: `Vous n'aurez pas accès au chantier « ${p.name} ». Le client sera prévenu et pourra inviter une autre entreprise.`, confirm: 'Refuser', danger: true,
              onConfirm: () => { actions.declineInvite(p.id); toast('Invitation refusée', 'close'); go(`#/invite/${p.id}/entreprise`, { replace: true }); } });
          },
          'as-role'() { actions.setRole(role); },
        },
      };
    },
  },
  { // M06 : les visites choisies, les étapes concernées, et la différence entre le forfait TEEQA et le paiement des travaux.
    name: 'controles', pattern: /^\/c\/([^/]+)\/controles$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role, n = p.steps.length, k = p.steps.filter(isControlled).length, f = formuleOf(p);
      const open = r === 'client' && p.status !== 'clos' && p.steps.every(x => x.status === 'a_venir' || x.status === 'verrouillee');
      // 19 nov. : deux formules. « Suivi contrôlé » (présélectionné) : au moins MIN_VISITS visites, les étapes clés ne se retirent pas.
      // « Suivi » : aucune visite, rien n'est vérifié sur place.
      const visit = (x, i) => !isControlled(x) ? ['Sans visite', 'outline', f === 'suivi' ? "Déclarée par l'entreprise, consultée par le client · rien n'est vérifié sur place" : /réseaux/i.test(x.title) ? "Déclarée par l'entreprise, consultée par le client · visite recommandée : l'étanchéité de la toiture et les gaines s'y cachent" : "Déclarée par l'entreprise, consultée par le client"]
        : x.reviews.length ? ['Visite faite', 'success', `Avis ${avisLabel(latestReview(x).verdict)}`]
        : keyStep(n, i) ? ['Visite obligatoire', 'saffron', "Étape clé : le contrôleur passe sur place, cette visite ne peut pas être retirée"] : ['Visite ajoutée', 'saffron', x.status === 'fin_declaree' ? (overdue(p, x).includes('visite') ? 'Fin déclarée · visite en retard : autre agence possible, sans frais (sur l’étape)' : x.mission && x.mission.status === 'suspendue' ? 'Fin déclarée · visite suspendue pendant le changement d’entreprise' : 'Fin déclarée · visite attendue') : "Le contrôleur passera à la fin de l'étape"];   // vague 25 (jury n° 9)
      const lo = Math.min(MIN_VISITS, n);
      let opts = Array.from({ length: n - lo + 1 }, (_, i) => lo + i);
      if (opts.length > 4) opts = [...new Set([lo, lo + 1, Math.round((lo + 1 + n) / 2), n])];
      // Vague 7 (jury, incohérence 17) : une visite ajoutée dit à quelle étape elle va.
      const optLabel = (c) => { if (c === n) return 'Chaque étape'; if (c === lo) return 'Étapes clés'; const add = [...controlledIndexes(n, c)].filter(i => !keyStep(n, i)).map(i => i + 1).sort((a, b) => a - b); return `+ étape${add.length > 1 ? 's' : ''} ${add.join(', ')}`; };
      const formule = (key) => { const on = f === key, F = FORMULES[key];
        return `<button class="list-item" role="radio" aria-checked="${on}" data-act="formule" data-f="${key}" data-testid="formule-${key}"><span class="ico-tile ${on ? (key === 'controle' ? 'success' : 'saffron') : ''}">${icon(on ? 'check' : key === 'controle' ? 'shield' : 'eye')}</span><span class="grow"><span class="t">${F.label}${key === 'controle' ? ' <span class="muted">(recommandé)</span>' : ''}</span><div class="s">${F.text}</div></span></button>`; };
      return {
        html: `${appbar({ title: 'Contrôles et forfait', back: `#/c/${p.id}/share`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:16px;padding-top:14px">
          <div class="card dark stack" style="gap:6px"><span class="over" style="color:var(--saffron)">${esc(p.name)} · ${FORMULES[f].label}</span>
            <div class="h1">${k ? `${k} visite${k > 1 ? 's' : ''} de contrôle` : 'Aucune visite de contrôle'}<span class="kw">.</span></div><div class="meta" style="color:var(--sage-ink)">sur ${n} étapes${k && k < n ? ` · ${n - k} sans visite` : ''}</div></div>
          ${r === 'client' ? `<div class="card stack" style="gap:6px" data-testid="forfait-etat"><div class="row" style="gap:10px"><span class="ico-tile ${p.forfait && p.forfait.paidAt ? 'success' : 'saffron'}">${icon('wallet')}</span><b>Forfait TEEQA : ${prix(forfaitDh(k))}</b></div>
            <p class="meta" style="margin:0" data-testid="forfait-calc">${esc(forfaitCalc(k))}</p>
            <p class="meta" style="margin:0">${p.forfait && p.forfait.paidAt ? `Payé le ${fmtDate(p.forfait.paidAt)} (${({ sepa: 'virement international', national: 'virement national', agence: 'espèces en agence', carte3: 'carte, en 3 fois sans frais' })[p.forfait.moyen] || 'carte bancaire'}) · <button class="linklike" data-go="#/c/${p.id}/documents" data-testid="recu-forfait-link">reçu dans Documents</button>` : conventionOk(p) && p.invites.entreprise && p.invites.entreprise.status === 'acceptee' ? `Moyens : carte marocaine ou étrangère (en une fois ou en 3 fois sans frais), virement national ou international, espèces en agence de paiement (${FORFAIT_AGENCES}). Les visites pas encore faites sont remboursées si le chantier s’arrête. <span data-testid="forfait-mission">${esc(REGLES.forfaitMission)}</span>` : esc(REGLES.forfaitMission)}</p>
            ${!(p.forfait && p.forfait.paidAt) && conventionOk(p) && p.invites.entreprise && p.invites.entreprise.status === 'acceptee' && p.status !== 'clos' ? `<button class="btn saffron block" data-go="#/c/${p.id}/forfait" data-testid="forfait-pay">Payer le forfait</button><p class="meta" style="margin:4px 0 0" data-testid="forfait-plus-tard">${/* vague 23 (jury n° 6, 6 jurés : « pas de suite si le forfait est reporté ») */''}Pas tout de suite ? Rien ne bloque l’entreprise : elle peut commencer. Le forfait (ou son premier tiers, en 3 fois) est dû avant la première visite de contrôle ; TEEQA vous le rappelle avant. Ce n’est jamais l’argent des travaux, qui se paie à part, à l’entreprise.</p>` : ''}</div>` : ''}
          ${open ? `<div class="field"><label id="lbl-form">Formule</label><div class="list" role="radiogroup" aria-labelledby="lbl-form">${formule('controle')}${formule('suivi')}</div></div>
            ${f === 'controle' ? `<div class="field"><label id="lbl-ctl">Nombre de visites</label><div class="seg" role="radiogroup" aria-labelledby="lbl-ctl">${opts.map((c) => `<button class="seg-opt" role="radio" aria-checked="${k === c}" aria-pressed="${k === c}" data-act="set" data-c="${c}"><b class="mono" style="font-size:18px">${c}</b><span style="font-size:12px;font-weight:600">${optLabel(c)}</span></button>`).join('')}</div>
              <p class="meta">Au moins ${lo} visites, aux étapes clés. Vous pouvez en ajouter avant le début de la 1re étape ; ensuite, seulement par un avenant. L'entreprise est prévenue.</p></div>` : ''}`
          : r === 'client' && p.status !== 'clos' ? `<div class="notice">${icon('lock', 'sm')}<span>Le chantier a commencé : la formule ne se change plus ; une visite s'ajoute seulement avec un avenant (nouveaux travaux).</span></div>` : ''}
          ${f === 'suivi' ? `<div class="notice saffron" data-testid="suivi-warning">${icon('alert', 'sm')}<span><b>Formule Suivi :</b> aucune étape ne sera vérifiée sur place. L'entreprise déclare chaque étape avec ses photos, et vous les consultez.</span></div>` : ''}
          <ol class="ctl-frise">${p.steps.map((x, i) => { const [t, c, sub] = visit(x, i); return `<li class="${isControlled(x) ? 'on' : ''} ${x.reviews.length ? 'fait' : ''}"><span class="cf-ic">${stepIcon3D(i, n, 58)}</span><div class="cf-t"><b>${i + 1}. ${esc(x.title)}</b><small>${sub}</small><span class="chip ${c}">${t}</span></div>${isControlled(x) ? `<span class="cf-av" aria-hidden="true">${avatar('controleur', 38)}</span>` : ''}</li>`; }).join('')}</ol>
          <p class="meta">Une étape sans visite n'est jamais dite « vérifiée ». ${f === 'controle' ? 'Les étapes clés (fondations, murs et poteaux, dalle, finitions) gardent toujours leur visite.' : 'Vous pouvez passer en Suivi contrôlé tant qu\'aucune étape n\'a commencé.'}</p>
          ${f === 'controle' ? zoneLine(p) : ''}
          ${k ? forfaitCards(k) : `<div class="stack" style="gap:8px">
            <div class="card stack" style="gap:4px"><div class="row" style="gap:10px"><span class="ico-tile">${icon('eye')}</span><b>La formule Suivi</b></div>
              <p class="meta" style="margin:0">Le suivi des étapes, les photos de l'entreprise, l'historique et le rapport final, sans visite de contrôle.</p><div class="row" style="justify-content:space-between;gap:8px" data-testid="forfait-prix"><span class="meta">Prix du forfait</span><b class="price">${forfait(0)}</b></div></div>
            <div class="card stack" style="gap:4px"><div class="row" style="gap:10px"><span class="ico-tile">${icon('wallet')}</span><b>Le paiement des travaux</b></div>
              <p class="meta" style="margin:0">Il se fait directement entre vous et l'entreprise, hors de TEEQA. TEEQA ne reçoit ni ne garde cet argent.</p></div></div>`}
        </div></div>`,
        on: {
          set(b) { actions.setControls(p.id, +b.dataset.c); sfx('choix'); go(`#/c/${p.id}/controles`, { replace: true }); },
          // Vague 22 (clients Maroc, 7 fiches) : les moyens de paiement du forfait, nommés : carte marocaine ou étrangère, 3 fois sans frais, virement national ou international, espèces en agence.
          'forfait-moyens'() { const M = [['carte', 'Carte bancaire, en une fois', 'Carte marocaine (paiement sécurisé 3-D Secure) ou carte étrangère'], ['carte3', 'Carte bancaire, en 3 fois sans frais', 'À la convention, puis à la 2ᵉ et à la 3ᵉ visite'], ['national', 'Virement bancaire national', 'Depuis une banque au Maroc, vers le RIB de TEEQA (sur le reçu) ; compté à réception, 1 à 2 jours ouvrés'], ['sepa', 'Virement international', 'Depuis l’étranger, vers le compte de TEEQA au Maroc ; 2 à 4 jours ouvrés'], ['agence', 'Espèces en agence de paiement', 'Avec le code de paiement envoyé par SMS ; reçu remis au guichet']];
            openSheet(`<h2>Payer le forfait</h2><p class="muted small" style="margin-bottom:10px">${dh(forfaitDh(p.steps.filter(isControlled).length))} pour ce chantier. TEEQA encaisse seulement ses services, jamais l’argent des travaux.</p><div class="list" role="radiogroup" aria-label="Moyen de paiement">${M.map(([k, t, d]) => `<button class="list-item" data-fm="${k}" data-testid="forfait-m-${k}"><span class="grow"><span class="t">${t}</span><span class="s">${d}</span></span>${icon('chevron', 'sm')}</button>`).join('')}</div><button class="btn ghost block" style="margin-top:10px" data-act="sheet-close">Annuler</button>`, { label: 'Payer le forfait', onMount: (el) => el.querySelectorAll('[data-fm]').forEach(x => x.addEventListener('click', () => { closeSheet(true); actions.payForfait(p.id, x.dataset.fm); sfx('tampon'); toast(x.dataset.fm === 'carte3' ? 'Premier tiers payé · reçu dans Documents' : ['national', 'sepa', 'agence'].includes(x.dataset.fm) ? 'Paiement annoncé · reçu dans Documents à réception' : 'Forfait payé · reçu dans Documents', 'check'); go(`#/c/${p.id}/controles`, { replace: true }); })) }); },
          'forfait-pay'(b) { actions.payForfait(p.id, b.dataset.m); sfx('tampon'); toast('Forfait payé · reçu dans Documents', 'check'); go(`#/c/${p.id}/controles`, { replace: true }); },
          formule(b) {
            const key = b.dataset.f; if (key === f) return;
            if (key === 'controle') { actions.setControls(p.id, MIN_VISITS); sfx('choix'); go(`#/c/${p.id}/controles`, { replace: true }); return; }
            confirmSheet({ title: 'Choisir la formule Suivi ?', body: "Aucune étape ne sera vérifiée sur place par un contrôleur : l'entreprise déclare chaque étape avec ses photos et vous les consultez. Vous pourrez repasser en Suivi contrôlé tant qu'aucune étape n'a commencé.", confirm: 'Choisir Suivi', danger: true,
              onConfirm: () => { actions.setControls(p.id, 0); sfx('choix'); go(`#/c/${p.id}/controles`, { replace: true }); } });
          },
        },
      };
    },
  },
  {
    // Vague 3 : annexe tarifaire de la convention (19 nov. : avec les montants de TARIFS).
    name: 'annexe', pattern: /^\/(?:c\/([^/]+)\/)?annexe$/,
    render(pid) {
      const p = pid && pid !== 'undefined' ? project(pid) : null;
      return { html: `${appbar({ title: 'Annexe tarifaire', back: p ? `#/c/${p.id}/convention` : '#/help', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div><span class="over">${p ? `${esc(p.name)} · annexe tarifaire de la convention` : 'Convention de suivi · annexe tarifaire'}</span><h1 class="h2" style="margin:4px 0 0">Qui paie les visites, et quand</h1></div>
          ${resumeBlock('annexe', langOf(get().role), { S: dh(TARIFS.suivi.dh), V: dh(TARIFS.visite.dh), F: dh(TARIFS.controle.dh), C: dh(TARIFS.contreVisite.dh), CM: dh(TARIFS.contreVisiteMineure.dh) })}
          ${annexeBody()}
        </div></div>` };
    },
  },
  {
    // M12 : le coffre des documents. Tout ce que le chantier a produit, par étape, avec auteur, date et version.
    name: 'documents', pattern: /^\/c\/([^/]+)\/documents$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role, bar = appbar({ title: 'Documents', back: `#/c/${p.id}/share`, sep: true, right: `<button class="icon-btn" data-act="print" aria-label="Exporter la liste en PDF">${icon('share')}</button>` });
      if (!canSeeDocuments(p, r)) return { html: `${appbar({ title: 'Documents', back: '#/home', sep: true })}<div class="scroll"><div class="content stack" style="padding-top:14px"><div class="notice" data-testid="docs-locked">${icon('lock', 'sm')}<span><b>Votre accès à ce chantier a pris fin.</b> Les documents, y compris vos photos et vos avis, restent conservés pour le client et l'entreprise.</span></div></div></div>` };
      const all = documents(p).filter(d => (get().role !== 'controleur' || d.kind !== 'devis') && (!d.seul || d.seul === get().role)), f = (get().drafts['docs:' + pid] || {}).f || 'tout', list = all.filter(d => f === 'tout' || d.group === f);
      const IC = { recu: 'wallet', plan: 'file', pdf: 'file', devis: 'file', convention: 'file', photo: 'camera', correction: 'image', avis: 'pen', levee: 'checkCircle', rapport: 'archive' };
      const author = (d) => d.by ? esc(who(d.by, r).replace(' (démo)', '')) : d.kind === 'rapport' ? 'TEEQA' : d.kind === 'recu' ? 'Client' : 'Client et entreprise';
      const row = (d) => `<${d.go ? 'button' : 'div'} class="list-item doc-row ${d.kept === false ? 'pending' : ''}" ${d.go ? `data-go="${d.go}"` : ''} data-doc="${d.kind}">
          <span class="ico-tile ${d.kind === 'avis' || d.kind === 'levee' ? 'success' : d.kind === 'correction' ? 'saffron' : ''}">${icon(IC[d.kind])}</span>
          <span class="grow"><span class="t">${esc(d.title)}${d.version > 1 ? ` <span class="chip" style="height:22px;font-size:11px;padding:0 8px">v${d.version}</span>` : ''}</span>
            <div class="s">${author(d)} · ${fmtFull(d.at)}${d.group === 'photo' || d.kind === 'avis' ? (d.recu ? (String(d.recu).slice(0, 16) === String(d.at).slice(0, 16) ? ' · reçue par TEEQA à la même minute' : ` · reçue par TEEQA le ${fmtFull(d.recu)}`) : ' · pas encore reçue par TEEQA') : ''}</div>${d.note ? `<div class="meta">${esc(d.note)}</div>` : ''}</span>${d.go ? icon('chevron', 'sm chev') : ''}</${d.go ? 'button' : 'div'}>`;
      const whole = list.filter(d => !d.sid), n = (g) => all.filter(d => d.group === g).length;
      return {
        html: `${bar}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div><span class="over">${esc(p.name)} · ${esc(p.city)}</span><h1 class="h2" style="margin:4px 0 0">${all.length} pièce${all.length > 1 ? 's' : ''} conservée${all.length > 1 ? 's' : ''}</h1></div>
          ${p.status === 'clos' ? `<div class="notice">${icon('archive', 'sm')}<span>Chantier clôturé : les documents sont conservés, en lecture seule.</span></div>` : ''}
          ${['client', 'entreprise'].includes(r) && p.status !== 'clos' ? `<button class="btn ghost block" data-act="add-piece" data-testid="add-piece">${icon('plus', 'sm')}Ajouter un plan ou un PDF</button>` : ''}
          <div class="chips" role="radiogroup" aria-label="Filtrer les documents">${[['tout', `Tout · ${all.length}`], ['doc', `Documents · ${n('doc')}`], ['photo', `Photos · ${n('photo')}`], ['avis', `Avis · ${n('avis')}`]].map(([k, l]) => `<button class="chip ${f === k ? 'dark' : ''}" role="radio" aria-checked="${f === k}" data-act="filter" data-f="${k}">${l}</button>`).join('')}</div>
          ${whole.length ? `<div class="section-title" style="margin-bottom:0"><span class="over">Le chantier</span></div><div class="list">${whole.map(row).join('')}</div>` : ''}
          ${p.steps.map((s, i) => { const it = list.filter(d => d.sid === s.id); return it.length ? `<div class="section-title" style="margin-bottom:0"><span class="over">Étape ${i + 1} · ${esc(s.title)}</span><span class="meta">${it.length}</span></div><div class="list">${it.map(row).join('')}</div>` : ''; }).join('')}
          ${!list.length ? `<p class="muted">Rien dans ce filtre pour l'instant.</p>` : ''}
          <p class="meta">Chaque pièce garde son auteur, sa date et sa version ; une correction ou un nouvel avis s'ajoute sans effacer le précédent. Révoquer un lien ou clôturer le chantier ne retire aucune pièce. Le devis est gardé par son nom ; TEEQA ne lit pas son contenu.</p>
        </div></div>`,
        on: { filter(b) { actions.setDraft('docs:' + pid, { f: b.dataset.f }); go(`#/c/${pid}/documents`, { replace: true }); }, print() { window.print(); },
          // Vague 10 : un plan, une note de calcul ou un PDF ajouté en cours de chantier ; même nom = nouvelle version, l'ancienne reste.
          'add-piece'() { const noms = [...new Set((p.pieces || []).map(x => x.title))];
            openSheet(`<h2>Ajouter un plan ou un PDF</h2><p class="muted small" style="margin-bottom:10px">Même nom qu'une pièce existante : elle devient la version suivante, la précédente reste au dossier. Tous sont prévenus ; le contrôleur s'appuie sur la dernière version.</p>
              <div class="field"><label for="pc-title">Nom de la pièce</label><input id="pc-title" class="input" list="pc-noms" maxlength="60" autocomplete="off" placeholder="Ex. Plan de ferraillage de la dalle"><datalist id="pc-noms">${noms.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
              <div class="field"><label for="pc-file">Fichier (PDF ou image)</label><input id="pc-file" class="input" type="file" accept="application/pdf,image/*"></div>
              <div class="field"><label for="pc-note">Ce qui change (facultatif)</label><input id="pc-note" class="input" maxlength="80" autocomplete="off" placeholder="Ex. Poutre du salon passée de 25 à 30 cm"></div>
              <div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-pc-ok>Ajouter</button></div>`, { label: 'Ajouter un document',
              onMount: (el) => el.querySelector('[data-pc-ok]').addEventListener('click', () => { const f = el.querySelector('#pc-file').files[0] || null, t = el.querySelector('#pc-title').value || (f && f.name) || '';
                const v = actions.addPiece(p.id, { title: t, kind: f && /image/.test(f.type) ? 'plan' : 'pdf', role: r, note: el.querySelector('#pc-note').value, file: f }); if (!v) { toast('Donnez un nom à la pièce', 'info'); return; }
                closeSheet(true); toast(v > 1 ? `Version ${v} ajoutée · tous sont prévenus` : 'Pièce ajoutée · tous sont prévenus', 'check'); go(`#/c/${pid}/documents`, { replace: true }); }) }); } },
      };
    },
  },
  {
    // M03 : convention avant travaux. Le client et l'entreprise la lisent et l'acceptent ; le contrôleur la lit seulement.
    // Ce n'est ni une signature électronique qualifiée, ni l'avis du contrôleur : l'écran le dit.
    name: 'convention', pattern: /^\/c\/([^/]+)\/convention$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role, c = p.convention, n = p.steps.filter(isControlled).length;
      if (!c) return { html: `${appbar({ title: 'Convention', back: `#/c/${p.id}`, sep: true })}<div class="content"><div class="notice">${icon('info', 'sm')}<span>Ce chantier a été créé sans convention. Elle est proposée à la création d'un nouveau chantier.</span></div></div>` };
      // Problème 13 : l'entreprise accepte d'abord l'invitation, puis la convention.
      const mine = can(r, p, null, 'acceptConvention');
      const invFirst = r === 'entreprise' && !c.entreprise && p.invites.entreprise.status !== 'acceptee' && p.status !== 'clos';
      const ART = conventionArticles(p, n);
      const party = (role, at) => `<div class="list-item">${roleAvatar(role, 36)}<span class="grow"><span class="t">${esc(ROLES[role].name)}</span><div class="s">${role === 'client' ? 'Client' : 'Entreprise'}</div></span><span class="chip ${at ? 'success' : 'saffron'}">${at ? `Acceptée · ${fmtDate(at)}` : 'En attente'}</span></div>`;
      return {
        html: `${appbar({ title: 'Convention', back: `#/c/${p.id}`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:16px;padding-top:14px">
          <div class="card dark stack" style="gap:8px">
            <div class="row" style="justify-content:space-between"><span class="over" style="color:var(--saffron)">Avant travaux</span><span class="chip ${conventionOk(p) ? 'success' : 'saffron'}">${conventionOk(p) ? 'Acceptée' : 'En attente'}</span></div>
            <div class="h1">Convention de suivi<span class="kw">.</span></div>
            <div class="meta" style="color:var(--sage-ink)">${esc(p.name)} · ${esc(p.city)} · version ${c.v}</div>
          </div>
          ${langOf(r) === 'fr' ? fold('Résumé en arabe, darija et amazigh · ملخص بالعربية', 'Pour vos proches ; le texte qui engage reste le français ci-dessous', ['ar', 'dar', 'shi', 'rif', 'tzm'].map(L => resumeBlock('convention', L)).join(''), 'conv-resume-ar') : resumeBlock('convention', langOf(r))}
          <div class="card stack" style="gap:8px" data-testid="conv-resume"><span class="over"><b>En bref</b></span>
            <ul class="losange">
              <li>${n ? "L'entreprise déclare chaque étape avec ses photos ; un contrôleur indépendant, missionné par TEEQA, passe sur place aux étapes clés et signe un avis." : "L'entreprise déclare chaque étape avec ses photos ; sans visite de contrôle, rien n'est vérifié sur place."}</li>
              <li>« Paiement recommandé » ou « Paiement différé » : une recommandation au client, qui décide. Vous payez entre vous, hors de TEEQA : il ne détient jamais l'argent des travaux.</li>
              <li>TEEQA ne tranche pas un désaccord ; il garde l'historique.</li>
            </ul></div>
          <div class="list">${party('client', c.client)}${party('entreprise', c.entreprise)}<div class="list-item" data-testid="conv-teeqa"><span class="ico-tile">${icon('shield')}</span><span class="grow"><span class="t">TEEQA SARL</span><div class="s">Pour ses seuls articles : prix de TEEQA, responsabilité, données</div></span><span class="chip success">Engagée · ${fmtDate(c.teeqa || p.createdAt)}</span></div></div>
          <div class="section-title" style="margin:0"><span class="over">Les ${ART.length} articles</span><span class="row" style="gap:4px"><button class="btn text" style="min-height:44px" data-act="conv-all" data-testid="conv-all">Tout lire</button><button class="btn text" style="min-height:44px" data-act="print" data-testid="conv-pdf">${icon('share', 'sm')}PDF</button></span></div>
          <div class="stack" style="gap:6px" data-testid="articles">${ART.map(([t, b], i) => `<details class="more cv-art"><summary>${icon('chevronDown', 'sm')}<span><b>${i + 1}. ${t}</b></span></summary><div class="more-in cv-body" style="margin-top:6px">${b}</div></details>`).join('')}</div>
          <div class="list"><button class="list-item" data-go="#/c/${p.id}/annexe"><span class="ico-tile">${icon('wallet')}</span><span class="grow"><span class="t">Annexe tarifaire</span><div class="s">Prix de chaque visite, qui paie, quand, avec quel plafond</div></span>${icon('chevron', 'sm chev')}</button></div>
          <div class="notice">${icon('info', 'sm')}<span>La convention lie le client et l'entreprise ; TEEQA SARL y est aussi partie pour les seuls articles qui l'engagent (prix de TEEQA, responsabilité, données). L'accepter vaut signature électronique simple au sens de la loi 53-05 (elle prouve qui a accepté et quand), pas une signature qualifiée ; elle est distincte de l'avis signé par le contrôleur à chaque visite.</span></div>
          ${r === 'controleur' ? `<div class="notice">${icon('lock', 'sm')}<span>Le contrôleur lit la convention ; il ne l'accepte pas.</span></div>` : ''}
        </div></div>
        ${mine ? `<div class="footer-cta"><button class="btn saffron block" data-act="accept-conv">J'accepte la convention</button></div>`
          : invFirst ? `<div class="footer-cta"><p class="meta" style="text-align:center">Acceptez d'abord l'invitation : la convention s'accepte ensuite.</p><button class="btn saffron block" data-go="#/invite/${p.id}/entreprise">Voir l'invitation</button></div>`
          : !conventionOk(p) && c[r] && (r === 'client' || r === 'entreprise') ? `<div class="footer-cta"><p class="meta" style="text-align:center">Vous avez accepté. Les travaux pourront débuter dès l'acceptation ${r === 'client' ? "de l'entreprise" : 'du client'}.</p></div>` : ''}`,
        on: { 'conv-all'(b) { const all = [...b.closest('.screen').querySelectorAll('.cv-art')], open = all.some(d => !d.open); all.forEach(d => { d.open = open; }); b.textContent = open ? 'Tout replier' : 'Tout lire'; }, print() { document.querySelectorAll('.cv-art').forEach(d => { d.open = true; }); window.print(); },
          'accept-conv'() { actions.acceptConvention(p.id, r); sfx('tampon'); toast('Convention acceptée', 'check'); go(`#/c/${p.id}/convention`, { replace: true }); } },
      };
    },
  },
  {
    name: 'report', pattern: /^\/c\/([^/]+)\/report(?:\?lien=[\w-]+)?$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const pr = progress(p), rr = get().role, lien = /[?]lien=/.test(location.hash), rc = p.reception, avs = p.avenants || [];
      // 20 nov. : rapport publié d'un chantier clos qui n'est pas le vôtre (avec l'accord de son client) : lecture seule,
      // sans nom de famille ni adresse ; le contrôleur n'est pas nommé, seulement son agence. Les échanges restent privés.
      const pub = rr === 'client' && !!p.client && !forMe(p, 'client'), agN = ((p.invites.controleur && p.invites.controleur.agence) || '').split(' · ')[0], ctlN = pub ? `contrôleur de ${agN} (nom caché : rapport d’une autre cliente)` : who('controleur');   // vague 25 (jury n° 20)
      const AV_ST = { propose: ['Proposé', 'saffron'], accepte: ['Accepté', 'success'], refuse: ['Refusé', 'danger'], caduc: ['Tombé au changement d’entreprise', ''], expire: ['Expiré sans réponse (5 jours)', ''] };
      return {
        html: `${appbar({ title: pub ? 'Chantier mené jusqu’à la réception' : 'Rapport', back: pub ? '#/home' : `#/c/${p.id}`, sep: true, right: `<button class="icon-btn" data-act="print" aria-label="Exporter le rapport en PDF">${icon('share')}</button>` })}
        <div class="scroll"><div class="content stack" style="gap:16px;padding-top:14px">
          ${['ar', 'dar'].includes(langOf(get().role)) ? `<div class="notice keep" data-notr dir="rtl" lang="ar" data-testid="rapport-resume-ar">${icon('globe', 'sm')}<span>${langOf(get().role) === 'ar' ? 'هذا التقرير يجمع المراحل والصور وآراء المراقب والدفعات. النص القانوني في الأسفل بالفرنسية، وهو المرجع.' : 'Had rapport fih lmarahil, tswer, ra2y lmouraqib w lkhlas. Nnass l9anouni lta7t b lfransawiya, howa lmarje3.'}</span></div>` : ''}
          <div class="card dark stack" style="gap:8px">
            <div class="row rep-head" style="justify-content:space-between;flex-wrap:wrap;gap:4px 10px"><span class="over"><b>${enGarantie(p) ? 'En garantie' : p.status === 'clos' ? 'Archivé' : 'En cours'}</b><span class="rule"></span>Rapport</span><span class="mono" style="font-size:11px;color:var(--sage-ink)" data-testid="rapport-date">Généré le ${fmtFull(p.status === 'clos' ? p.closedAt : nowMs())}</span></div>
            <div class="h1">${esc(p.name)}<span class="kw">.</span></div>
            <div style="max-width:220px;justify-self:center;width:100%">${houseSVG(pr.done, { crane: false, dark: true })}</div>
            <div class="row"><div class="progress grow"><i style="width:${pr.pct}%"></i></div><span class="mono" style="font-size:12px">${pr.done} étape${pr.done > 1 ? 's' : ''} close${pr.done > 1 ? 's' : ''} sur ${pr.total}${pr.declared ? ` · dont ${pr.declared} déclarée${pr.declared > 1 ? 's' : ''} sans visite` : ''}</span></div>
          </div>
          ${pub ? `<div class="notice" data-testid="rapport-publie">${icon('info', 'sm')}<span><b>Rapport publié avec l'accord de sa cliente</b>, ${esc(ROLES.client.name)}, qui vit à Bruxelles et a fait construire cette villa à Berkane avec ${esc(ROLES.entreprise.name)}. Sans son nom de famille ni son adresse ; les échanges ne sont pas publiés. Lecture seule.</span></div>` : ''}
          ${p.status === 'clos' ? `<div class="seal">${khatam(52, { color: '#E2A33B' })}<div><b>Rapport archivé.</b><div class="meta">Étapes figées le ${fmtFull(p.closedAt)} · ce qui suit (procès-verbal, avis, réponse) est ajouté et daté · non certifié</div></div></div>` : ''}
          ${fold('Fiche du chantier', 'Lieu, parties, agence, convention, fin prévue', `          <dl class="kv" style="margin:0">
            <dt>Lieu</dt><dd>${esc(p.city)}${p.region ? ', ' + esc(p.region) : ''}</dd>
            <dt>Client</dt><dd>${esc(ROLES.client.name)}${p.client ? ` · ${esc(p.client.where.replace(/^à distance · /, 'vit à '))}` : ''}</dd>
            <dt>Entreprise</dt><dd>${esc(ROLES.entreprise.name)}</dd>
            <dt>Agence</dt><dd>${esc((p.invites.controleur && p.invites.controleur.agence) || '—')}</dd><dt>Décennale</dt><dd data-testid="rapport-decennale">${p.decennale ? `police <span data-notr>${esc(p.decennale.police)}</span>, ${esc(p.decennale.assureur)} (attestation nominative du chantier, déposée le ${fmtDate(p.decennale.at)}${p.decennale.jusqu ? `, valable jusqu’au ${fmtDate(p.decennale.jusqu)}` : ''}${p.decennale.contact ? ` ; sinistres : <span data-notr>${esc(p.decennale.contact)}</span>` : ''})${(p.desordres || []).length ? ` · ${p.desordres.length} désordre${p.desordres.length > 1 ? 's' : ''} signalé${p.desordres.length > 1 ? 's' : ''} après la réception` : ''}${p.liquidation ? ` · entreprise déclarée en ${esc(p.liquidation.quoi)} le ${fmtDate(p.liquidation.at)}` : ''}` : 'attestation nominative non déposée'}</dd>
            <dt>Contrôleur</dt><dd>${esc(ctlN)} · accès ${{ acceptee: 'actif', envoyee: 'en attente', revoquee: 'révoqué', expiree: 'expiré', non_creee: 'non créé' }[p.invites.controleur.status]}</dd>
            <dt>Contrôles</dt><dd>${p.steps.filter(isControlled).length} visite${p.steps.filter(isControlled).length > 1 ? 's' : ''} prévue${p.steps.filter(isControlled).length > 1 ? 's' : ''} sur ${p.steps.length} étapes</dd>
            ${p.prep ? `<dt>Chantier</dt><dd>${esc(prepLine(p))}</dd>
            <dt>Devis</dt><dd>${p.prep.quote ? `${esc(p.prep.quote.name)} · joint par le client, non lu par TEEQA` : 'Non joint'}</dd>
            <dt>Étapes</dt><dd>${p.prep.confirmedAt ? `Confirmées par l'entreprise le ${fmtDate(p.prep.confirmedAt)}` : "En attente de confirmation par l'entreprise"}</dd>` : ''}
            ${p.convention ? `<dt>Convention</dt><dd>${conventionState(p)}</dd>` : ''}
            <dt>Créé le</dt><dd>${fmtDate(p.createdAt)}</dd>
            <dt>Fin prévue</dt><dd>${p.finPrevue && conventionOk(p) ? fmtDate(finAffichee(p)) + (joursSuspendus(p) ? ` (dont ${joursSuspendus(p)} jours de délais suspendus à ce jour)` : '') + ' (convention ; se décale d’autant si une visite dépasse son délai, ou par avenant)' : p.finPrevue ? 'Fixée dans la convention, pas encore acceptée' : '—'}</dd>
            <dt>Heures</dt><dd>Heure du Maroc</dd>
            <dt>Réception</dt><dd>${p.closedAt ? `Provisoire le ${fmtFull(p.closedAt)}` : '—'}</dd>
          </dl>`, 'rapport-fiche')}
          <div class="card">${p.steps.map((s, i) => {
            const rv = latestReview(s);
            return `<div class="report-step">
              <div class="row" style="gap:10px">${stepIcon3D(i, p.steps.length, 44)}<div class="grow"><b class="rs-title">${i + 1}. ${esc(s.title)}</b><div style="margin-top:4px">${statusChip(statusKey(s, p))}</div></div></div>
              <div class="meta" style="margin-top:6px">Début déclaré ${fmtDate(s.startedAt)} · ${endWord(p, s)} ${fmtDate(firstEndAt(s))}${holdPoint(p, s) ? ` · coulage déclaré ${fmtDate(s.coulage && s.coulage.at)}` : ''} · ${s.photos.length} photo${s.photos.length > 1 ? 's' : ''}${s.reviews.length ? ` et ${s.reviews.length} avis signé${s.reviews.length > 1 ? 's' : ''}` : ''}</div>
              ${isControlled(s) ? '' : `<div class="small" style="margin-top:6px;color:var(--pise-ink)">${icon('eye', 'xs')} Sans visite de contrôle · déclaration non vérifiée</div>`}
              ${s.reviews.map(v => `<div class="small" style="margin-top:8px"><b>Avis ${avisLabel(v.verdict)}</b> · ${esc(ctlN)} · <span class="mono" style="font-size:12px">${fmtFull(v.signedAt)}</span><div class="muted">«&nbsp;${esc(v.motif)}&nbsp;»</div>${pointsList(v)}</div>`).join('')}
              ${(phs => phs.length ? `<details class="def" data-testid="photos-avis"><summary class="meta">${icon('camera', 'xs')}Photos du contrôleur : ${phs.length}</summary><div class="pieces-strip" style="margin-top:6px">${phs.map(ph => `<span class="photo" style="pointer-events:none">${photoSVG(ph.sim.step, ph.sim.variant, { stamp: false })}</span>`).join('')}</div><ul class="meta" style="margin:6px 0 0;padding-left:18px">${phs.map(ph => `<li>${esc(ph.caption || 'Photo prise sur place')} · ${fmtFull(ph.at)}</li>`).join('')}</ul></details>` : '')(rv ? (rv.pieces || []).map(id => s.photos.find(ph => ph.id === id)).filter(ph => ph && ph.by === 'controleur' && !ph.dataUrl) : [])}
              ${s.corrections.map(c => `<div class="small" style="margin-top:6px">${icon('image', 'xs')} ${c.visite ? 'Correction déclarée (photo pour information, contrôle sur place)' : `Correction v${c.version}`} · ${fmtFull(c.at)}${c.levee ? ` · <b>levée des réserves signée par ${esc(ctlN)}</b> le ${fmtFull(c.levee.at)} (contrôle sur photo)` : ''}</div>`).join('')}
              ${s.contest ? `<div class="small" style="margin-top:6px;color:var(--danger-ink)">${icon('flag', 'xs')} Contestation ${s.contest.open ? 'ouverte' : 'retirée'} · non tranchée par TEEQA</div>` : ''}
              ${s.decision && rr !== 'controleur' ? `<div class="small" style="margin-top:6px">${icon('wallet', 'xs')} ${s.decision.moyen === 'sequestre' ? `Versée par ${esc(SEQUESTRE.banque)} (séquestre)` : s.decision.status === 'indique' ? "« J'ai payé cette tranche » indiqué par le client (non vérifié)" : 'Client en attente'} · ${fmtDate(s.decision.at)}${s.decision.receivedAt ? ` · reçu indiqué par l'entreprise le ${fmtDate(s.decision.receivedAt)}` : ''}</div>` : ''}
              ${rv && rv.signature ? `<div class="sig-mini">${signatureSVG(rv.signature)}</div>` : ''}
            </div>`; }).join('')}</div>
          ${['client', 'entreprise'].includes(rr) && !pub && budgetOf(p) ? (() => { const b = budgetOf(p);   // vague 26 (doigt : Khadija) : le rapport annonce les paiements ; les voici, tranche par tranche
            return `<div class="card stack" style="gap:6px" data-testid="rapport-paiements"><span class="over"><b>Paiements</b></span>${b.lignes.filter(l => l.dh).map(l => { const st = p.steps[l.n - 1], e = echeanceV17(p, st), a = pourSortante(p, st) ? sortanteNom(p) : entNow(p);
              return `<div class="meta">${`Tranche ${l.n} · ${dh(l.dh)} · ${l.recu ? `payée, reçu confirmé par ${a}` : l.paye ? `payée (indiqué par le client), à confirmer par ${a}` : l.partiel ? `${dh(l.partiel)} versés en partie, reste ${dh(l.dh - l.partiel)} à ${a}` : st.sequestre && !st.sequestre.verseAt ? `sur le compte de séquestre, pour ${a}` : e ? `à payer à ${a} avant le ${fmtDate(e)}` : `à venir, à ${a}`}`}</div>`; }).join('')}<div class="meta"><b>${`Total : ${dh(b.total)} · payé (indiqué) : ${dh(b.paye)} · reste : ${dh(b.resteAPayer)}`}</b></div></div>`; })() : ''}
          ${rc ? `<div class="card stack" style="gap:10px" data-testid="reception"><span class="over"><b>Réception des travaux</b></span>
            <dl class="kv" style="margin:0">
              <dt>Provisoire</dt><dd>Prononcée par le client le ${fmtDate(rc.provisoireAt)}</dd>
              <dt>Réserves</dt><dd>${rc.redigeAt ? `<span data-testid="pv-redige">Relevées par le contrôleur le ${fmtDate(rc.redigeAt)}</span> · ` : ''}${rc.reserves ? `« ${esc(rc.reserves)} »${rc.leveeAt ? ` · <span data-testid="reserves-levees">levées le ${fmtDate(rc.leveeAt)}, indiqué par l’entreprise</span>` : ''}` : 'Aucune réserve'}</dd>
              <dt>Clés</dt><dd data-testid="pv-cles">${rc.clesAt ? `Remises au client le ${fmtDate(rc.clesAt)}` : 'Remise non notée au procès-verbal'}</dd>
              <dt>Entreprise</dt><dd>${rc.entrepriseAt ? `Procès-verbal contresigné le ${fmtDate(rc.entrepriseAt)}` : 'Contresignature en attente'}</dd>
              <dt>Définitive</dt><dd data-testid="definitive">${rc.definitiveAt ? `Prononcée le ${fmtDate(rc.definitiveAt)}` : rc.reserves && rc.leveeAt ? 'Réserves levées selon l’entreprise : le client les vérifie, puis prononce la réception définitive' : rc.reserves ? 'Pas encore prononcée : elle se signe quand les réserves du procès-verbal sont levées' : `Sans réserve à lever : le client la signe quand il veut, au plus tard à la fin de l’année de garantie (${rc.parfaitJusqu ? fmtDate(rc.parfaitJusqu) : 'un an après la provisoire'})`}</dd>
              <dt>Un an</dt><dd>Garantie prévue par la convention, jusqu'au ${fmtDate(rc.parfaitJusqu)}</dd>
              <dt>Décennale</dt><dd>10 ans pour la solidité de l'ouvrage (art. 769 du DOC), à compter de la réception provisoire : jusqu'au ${fmtDate(rc.decennaleJusqu || new Date(new Date(rc.provisoireAt || nowMs()).setFullYear(new Date(rc.provisoireAt || nowMs()).getFullYear() + 10)).toISOString())}, portée par l'entreprise et son assureur</dd>
            </dl>
            ${can(rr, p, null, 'reception') && !pub ? `<button class="btn saffron block" data-act="pv-sign" data-testid="pv-sign">${icon('pen', 'sm')}Contresigner le procès-verbal</button>` : ''}
            ${can(rr, p, null, 'leverReserves') && !pub ? `<button class="btn saffron block" data-act="pv-levee" data-testid="pv-levee">${icon('check', 'sm')}Réserves levées · prévenir le client</button>` : ''}
            ${can(rr, p, null, 'definitive') && !pub ? `<button class="btn block" data-act="pv-def" data-testid="pv-def">${icon('check', 'sm')}Prononcer la réception définitive</button>` : ''}
            <p class="meta" style="margin:0">Le procès-verbal est signé par le client, puis contresigné par l'entreprise. TEEQA le conserve et ne certifie rien ; les garanties relèvent de l'entreprise et de son assurance.</p></div>` : ''}
          ${avs.length ? `<div class="card stack" style="gap:8px"><span class="over"><b>Avenants</b></span>
            ${avs.map(a => `<div class="row" style="justify-content:space-between;gap:10px"><span class="grow"><b>${esc(a.title)}</b><div class="meta">Proposé par ${a.by === 'client' ? 'le client' : "l'entreprise"} le ${fmtDate(a.at)}${a.answeredAt ? ` · réponse le ${fmtDate(a.answeredAt)}` : ''}</div></span><span class="chip ${AV_ST[a.status][1]}">${AV_ST[a.status][0]}</span></div>`).join('')}</div>` : ''}
          ${p.rating && p.rating.comment && !pub && ['client', 'entreprise'].includes(rr) && !lien ? `<div class="card stack" style="gap:8px" data-testid="mot-prive"><span class="over"><b>Mot du client à l’entreprise (non public)</b></span><p class="muted small" style="margin:0">« ${esc(p.rating.comment)} »</p><p class="meta" style="margin:0">Mot non public : seuls le client, l'entreprise et TEEQA le lisent ; ni le contrôleur ni un lien partagé ne le voient. Il n'est ni publié ni utilisé pour classer qui que ce soit. TEEQA ne note personne.</p></div>` : ''}
          ${p.status === 'clos' ? (() => { const av = (get().avis || []).find(a => a.pid === p.id), r = get().role;
            return `<div class="card stack" style="gap:8px" data-testid="avis-client"><span class="over"><b>${pub || p.client ? `Avis de ${esc(av ? av.author : ROLES.client.name)} sur son chantier` : "Avis public sur l'entreprise"}</b></span>
              ${av ? `<p style="margin:0">« ${esc(av.text)} »</p><div class="meta">${av.recommend ? 'Le client recommande cette entreprise.' : 'Le client ne recommande pas cette entreprise.'} Écrit dans TEEQA après la réception, publié sur la fiche de l'entreprise le ${fmtDate(av.at).replace(/\.$/, '')}.</div>${av.reply ? `<div class="meta"><b>Réponse de ${esc(ROLES.entreprise.name)}</b> · ${fmtDate(av.reply.at)} : « ${esc(av.reply.text)} »</div>` : ''}
                <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm ghost" data-go="#/pros/${proIdOf(p)}">Voir sur la fiche</button>${r === 'client' && !pub ? `<button class="btn sm ghost" data-act="avis-off">Retirer mon avis</button>` : ''}</div>`
              : r === 'client' && !pub ? `<p class="meta" style="margin:0">Facultatif, et distinct du mot laissé à l’entreprise : cet avis sera visible sur la fiche de l'entreprise, avec le nom de votre chantier comme provenance.</p>
                <button class="btn sm" data-act="avis-new" style="justify-self:start">Écrire un avis public</button>` : `<p class="meta" style="margin:0">Le client n'a pas publié d'avis. Le mot laissé à l’entreprise n'est jamais publiée.</p>`}
            </div>`; })() : ''}
          <p class="meta" style="margin:0" data-testid="valeur-courte"><b>Valeur de ce rapport :</b> il date et garde les avis et les photos. C’est un début de preuve, pas une certification : un médiateur, un notaire, un juge ou vos héritiers peuvent s’en servir, avec d’autres pièces. TEEQA ne tranche pas.</p>
          ${fold('Valeur de ce rapport : le détail', 'Heures, signatures, empreinte', `          <div class="stack" style="gap:8px" data-testid="valeur-preuves">
            <p class="meta" style="margin:0">${PREUVE} TEEQA ne tranche pas un désaccord.</p>
            <p class="meta" style="margin:0" data-testid="preuve-tiers"><b>Comment le vérifier :</b> chaque pièce porte son heure de prise et son heure de réception par le serveur de TEEQA, et une empreinte (un code qui change si un seul mot change). N'importe qui peut recalculer l'empreinte du PDF : si un mot a changé, elle diffère. Chaque avis porte la signature identifiée du contrôleur (code à usage unique, carte professionnelle) et la cosignature de son agence.</p>
            <p class="meta" style="margin:0">${esc(REGLES.responsabilite)}</p>
            <p class="meta" style="margin:0" data-testid="limites-visite"><b>Limites d'un avis :</b> il porte sur les points listés, tels que le contrôleur les a vus le jour de sa visite. Ce n'est ni une garantie de l'ouvrage, ni le permis d'habiter, ni un certificat de conformité ; l'agence répond de son contrôleur.</p>
            <div class="meta mono">Empreinte du rapport : ${empreinte({ id: p.id, steps: p.steps.map(s => [s.status, s.photos.length, s.reviews.map(v => v.signedAt), s.corrections.length, s.decision]), rc })}</div></div>`, 'rapport-valeur')}
          <div class="list">
            ${['client', 'entreprise'].includes(rr) && !pub ? `<button class="list-item" data-act="share-report" data-testid="share-report"><span class="ico-tile success">${icon('link')}</span><span class="grow"><span class="t">Partager le rapport</span><div class="s">Lien en lecture seule pour la famille, la banque, le notaire · vous le retirez quand vous voulez</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
            <button class="list-item" data-act="print"><span class="ico-tile">${icon('file')}</span><span class="grow"><span class="t">Exporter en PDF</span><div class="s">Imprimer ou enregistrer le rapport</div></span>${icon('chevron', 'sm chev')}</button>
          </div>
          ${(p.partages || []).filter(x => x.by === rr).length ? `<div class="list" data-testid="partages">${p.partages.filter(x => x.by === rr).map(x => { const on = !x.revokedAt && new Date(x.expiresAt).getTime() > nowMs(); return `<div class="list-item"><span class="ico-tile ${on ? 'success' : ''}">${icon('link')}</span><span class="grow"><span class="t">${esc(x.to)}</span><div class="s">${on ? `Lien actif jusqu'au ${fmtDate(x.expiresAt)} · ${x.vues || 0} ouverture${(x.vues || 0) > 1 ? 's' : ''}${x.sansPaiements ? ' · sans les paiements' : ''}` : x.revokedAt ? `Retiré le ${fmtDate(x.revokedAt)}` : 'Expiré'}</div></span>${on ? `<button class="btn sm ghost" data-act="copy-share" data-id="${x.id}" data-testid="copy-share">${icon('copy', 'sm')}Copier</button><button class="btn sm ghost" data-act="unshare" data-id="${x.id}">Retirer</button>` : ''}</div>${on ? `<div class="linkbox" data-testid="share-url">${icon('link', 'sm')}<span data-notr>${esc(shareUrl(p, x))}</span></div>` : ''}`; }).join('')}</div>` : ''}
          <p class="meta">TEEQA ne détient pas l'argent des travaux : chaque tranche se paie directement du client à l'entreprise${p.sequestre ? `, ou par le compte de séquestre de ${esc(SEQUESTRE.banque)}` : ''}. Seuls les services de TEEQA sont facturés par TEEQA (forfait de suivi, visites ajoutées, contre-visites, second avis : prix dans l’annexe tarifaire), qui paie l'agence de contrôle.</p>
        </div></div>`,
        // Export : la feuille d'impression du système (« Enregistrer en PDF »), mise en page par @media print.
        on: { print() { window.print(); },
          'copy-share'(b) { const x = (p.partages || []).find(y => y.id === b.dataset.id); if (!x) return; try { navigator.clipboard && navigator.clipboard.writeText(shareUrl(p, x)); } catch { /* presse-papiers indisponible */ } toast('Lien copié · collez-le dans WhatsApp ou un e-mail', 'copy'); },   // export du rapport : une vibration, aucun son (choix du 11 nov.)
          // Vague 10 : rapport partageable par lien en lecture seule (durée choisie, retirable) ; le PDF reste l'autre voie.
          'share-report'() { openSheet(`<h2>Partager le rapport</h2><p class="muted small" style="margin-bottom:10px">La personne ouvre un lien en lecture seule : étapes, avis signés, photos datées, et les paiements indiqués si vous laissez la case cochée plus bas. Elle ne voit ni les échanges ni le nom du contrôleur (seulement son agence), ne peut rien modifier, et vous voyez quand elle l'ouvre.</p>
              <div class="chips" role="radiogroup" aria-label="Pour qui">${['Famille', 'Banque', 'Notaire', 'Architecte', 'Acheteur'].map((t, i) => `<button class="chip ${i ? 'outline' : 'success'}" role="radio" aria-checked="${!i}" data-to="${t}">${t}</button>`).join('')}</div>
              <div class="field" style="margin-top:10px"><label for="sh-name">Nom (facultatif)</label><input id="sh-name" class="input" maxlength="40" autocomplete="off" placeholder="Ex. Crédit de l’Atlas, agence de Lyon"></div>
              <label class="row" style="gap:10px;margin-top:10px;min-height:44px"><input id="sh-pay" type="checkbox" checked style="width:22px;height:22px;accent-color:var(--success)"><span>Montrer les paiements indiqués</span></label>
              <div class="seg" role="radiogroup" aria-label="Durée du lien" style="margin-top:10px">${[7, 30, 90].map((d, i) => `<button class="seg-opt" role="radio" aria-checked="${i === 1}" aria-pressed="${i === 1}" data-days="${d}"><b>${d} jours</b></button>`).join('')}</div>
              <div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-sh-ok data-testid="share-ok">Créer le lien</button></div>`, { label: 'Partager le rapport',
              onMount: (el) => { let to = 'Famille', days = 30;
                el.querySelectorAll('[data-to]').forEach(b => b.addEventListener('click', () => { to = b.dataset.to; el.querySelectorAll('[data-to]').forEach(x => { const on = x === b; x.classList.toggle('success', on); x.classList.toggle('outline', !on); x.setAttribute('aria-checked', String(on)); }); }));
                el.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => { days = +b.dataset.days; el.querySelectorAll('[data-days]').forEach(x => { x.setAttribute('aria-checked', String(x === b)); x.setAttribute('aria-pressed', String(x === b)); }); }));
                el.querySelector('[data-sh-ok]').addEventListener('click', () => { const n = el.querySelector('#sh-name').value.trim(); actions.shareReport(p.id, { to: n ? `${to} · ${n}` : to, days, by: rr, sansPaiements: !el.querySelector('#sh-pay').checked }); closeSheet(true); toast('Lien créé : copiez-le ci-dessous', 'link'); go(`#/c/${p.id}/report`, { replace: true }); }); } }); },
          unshare(b) { actions.unshareReport(p.id, b.dataset.id); toast('Lien retiré', 'check'); go(`#/c/${p.id}/report`, { replace: true }); },
          'pv-sign'() { confirmSheet({ title: 'Contresigner le procès-verbal ?', body: `Vous confirmez la réception provisoire de « ${p.name} »${rc && rc.reserves ? ', avec les réserves notées par le client' : ', sans réserve'}. La garantie d'un an prévue par la convention commence ; la garantie décennale (art. 769 du DOC) court 10 ans à compter de la réception provisoire.`, confirm: 'Contresigner',
            onConfirm: () => { actions.acceptReception(p.id); sfx('tampon'); toast('Procès-verbal contresigné', 'check'); go(`#/c/${p.id}/report`, { replace: true }); } }); },
          'pv-levee'() { confirmSheet({ title: 'Réserves levées ?', body: `Vous indiquez avoir repris : « ${esc(rc.reserves)} ». Le client vérifie, puis prononce la réception définitive. TEEQA ne certifie pas la levée.`, confirm: 'Prévenir le client',
            onConfirm: () => { actions.leverReservesReception(p.id); sfx('send'); toast('Client prévenu', 'check'); go(`#/c/${p.id}/report`, { replace: true }); } }); },
          'pv-def'() { confirmSheet({ title: 'Prononcer la réception définitive ?', body: `${rc && rc.reserves ? 'Vous confirmez que les réserves sont levées. ' : ''}La réception définitive n'est ni le permis d'habiter ni le certificat de conformité.`, confirm: 'Prononcer',
            onConfirm: () => { actions.receptionDefinitive(p.id); sfx('tampon'); toast('Réception définitive prononcée', 'check'); go(`#/c/${p.id}/report`, { replace: true }); } }); },
          'avis-off'() { actions.removeAvis(p.id); toast('Avis retiré', 'check'); go(`#/c/${p.id}/report`, { replace: true }); },
          'avis-new'() { openSheet(`<h2>Avis public</h2><p class="muted" style="margin-bottom:12px">Il paraîtra sur la fiche de l'entreprise avec cette provenance : chantier « ${esc(p.name)} », clôturé dans TEEQA.</p>
              <div class="field"><label for="av-text">Votre avis</label><textarea id="av-text" class="input" rows="4" style="width:100%;box-sizing:border-box;height:auto;padding-top:12px;padding-bottom:12px" placeholder="Ce qui s'est bien passé, ce qui pourrait être mieux."></textarea></div>
              <div class="field" style="margin-top:14px"><label id="av-l">Recommandez-vous cette entreprise ?</label><div class="seg" role="radiogroup" aria-labelledby="av-l"><button class="seg-opt" role="radio" aria-checked="true" aria-pressed="true" data-rec="1">Oui</button><button class="seg-opt" role="radio" aria-checked="false" aria-pressed="false" data-rec="0">Non</button></div></div>
              <div class="stack" style="margin-top:8px"><button class="btn saffron block" data-av-ok disabled>Publier l'avis</button><button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`,
            { label: 'Avis public', onMount: (el) => { let rec = true; const ta = el.querySelector('#av-text'), ok = el.querySelector('[data-av-ok]');
              ta.addEventListener('input', () => { ok.disabled = ta.value.trim().length < 10; });
              el.querySelectorAll('[data-rec]').forEach((b) => b.addEventListener('click', () => { rec = b.dataset.rec === '1'; el.querySelectorAll('[data-rec]').forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.setAttribute('aria-pressed', on); }); }));
              ok.addEventListener('click', () => { actions.publishAvis(p.id, { text: ta.value, recommend: rec }); closeSheet(true); go(`#/c/${p.id}/report`, { replace: true }); merci(); }); } }); } },
      };
    },
  },
  {
    // Problèmes 8 et 19 : la clôture devient la réception des travaux (réception provisoire, procès-verbal).
    name: 'close', pattern: /^\/c\/([^/]+)\/close$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      if (p.status === 'clos') return { redirect: `#/c/${p.id}/report` };
      const r = get().role;
      const ok = can(r, p, null, 'close');
      const blockers = closeBlockers(p), warnings = closeWarnings(p);
      const contests = p.steps.filter(s => s.contest && s.contest.open);
      const key = `close:${pid}`;
      const rt = { entreprise: 0, controle: 0, comment: '', reserves: '', ...(get().drafts[key] || {}) };
      return {
        html: `${appbar({ title: 'Réception des travaux', back: `#/c/${p.id}`, close: true })}
        <div class="scroll"><div class="content stack" style="gap:16px">
          <div style="max-width:260px;justify-self:center;width:100%">${houseSVG(progress(p).done, { crane: false })}</div>
          <h2 class="h1" style="text-align:center">Réception de ${esc(p.name)}<span class="kw">.</span></h2>
          ${blockers.length ? `<div class="section-title" style="margin-bottom:0"><span class="over">Avant la réception</span></div>
            <div class="list" data-testid="close-blockers">${blockers.map(b => `<div class="list-item"><span class="ico-tile danger">${icon('close')}</span><span class="grow"><span class="t">${esc(b)}</span></span></div>`).join('')}</div>`
          : `<div class="list">
            <div class="list-item"><span class="ico-tile success">${icon('check')}</span><span class="grow"><span class="t">${abandonDue(p) ? "Réception en l'état" : 'Toutes les étapes closes'}</span><div class="s">${progress(p).done}/${p.steps.length} ${formuleOf(p) === 'suivi' ? 'déclarées et consultées par le client' : 'vérifiées, corrigées ou consultées'}</div></span></div>
            ${warnings.some(w => /tranche/.test(w)) ? '' : `<div class="list-item"><span class="ico-tile success">${icon('wallet')}</span><span class="grow"><span class="t">Toutes les tranches soldées</span><div class="s">Paiement indiqué par le client et reçu par l'entreprise</div></span></div>`}
            <div class="list-item"><span class="ico-tile success">${icon('check')}</span><span class="grow"><span class="t">${contests.length ? `${contests.length} désaccord(s)` : 'Aucun désaccord ouvert'}</span><div class="s">Historique complet conservé</div></span></div>
          </div>`}
          ${warnings.length ? `<div class="list" data-testid="close-warnings">${warnings.map(w => `<div class="list-item"><span class="ico-tile saffron">${icon('alert')}</span><span class="grow"><span class="t" style="color:var(--saffron-ink)">${esc(w)}</span></span></div>`).join('')}</div>` : ''}
          <div class="card stack" style="gap:12px">
            <span class="over"><b>À la réception</b></span>
            <ul class="losange">
              <li>Un procès-verbal signé par le client, puis contresigné par l'entreprise</li>
              <li>${GARANTIE_TXT}</li>
              <li>Ce n'est ni le permis d'habiter ni le certificat de conformité : ils se demandent à la commune, avec votre architecte</li>
              <li>Rapport et historique figés ; le contrôleur garde la lecture de ses avis</li>
            </ul>${def('reception')}
            <p class="meta" style="margin:0">TEEQA conserve le procès-verbal et ne certifie rien : ni les travaux, ni les photos, ni les réserves.</p>
          </div>
          ${p.pvControleur ? `<div class="card stack" style="gap:8px" data-testid="pv-controleur"><span class="over"><b>Procès-verbal de réception</b></span>
            <p class="meta" style="margin:0">Rédigé par le contrôleur de ${esc((p.invites.controleur && p.invites.controleur.agence) || 'l’agence')} pendant la visite de réception, le ${fmtDate(p.pvControleur.at)}.</p>
            ${p.pvControleur.reserves ? `<ul class="losange">${p.pvControleur.reserves.split(/\n|;\s*/).filter(x => x.trim()).map(x => `<li>${esc(x.trim())}</li>`).join('')}</ul><p class="meta" style="margin:0">L'entreprise lèvera ces réserves avant la réception définitive.</p>` : '<p style="margin:0"><b>Sans réserve.</b></p>'}
            ${r === 'client' ? '<p class="meta" style="margin:0">Vous le lisez et vous le signez ; l’entreprise le contresigne ensuite.</p>' : ''}</div>`
          : ok && r === 'client' ? `<div class="card stack" style="gap:10px">
            <div><span class="over"><b>Réserves à la réception</b></span><p class="muted small" style="margin-top:4px">Facultatif. Notez ce qui reste à reprendre : l'entreprise les lèvera avant la réception définitive.</p></div>
            <textarea class="textarea" style="min-height:76px" data-input="reserves" aria-label="Réserves à la réception" placeholder="Ex. : joint de la fenêtre de la cuisine à reprendre.">${esc(rt.reserves)}</textarea>
          </div>` : ''}
          ${ok && r === 'client' ? `
          <button class="list-item card" role="switch" aria-checked="${!!rt.cles}" data-act="cles" data-testid="cles" style="text-align:left"><span class="ico-tile ${rt.cles ? 'success' : ''}">${icon(rt.cles ? 'check' : 'lock')}</span><span class="grow"><span class="t">Clés remises</span><div class="s">${rt.cles ? 'Noté au procès-verbal : vous prenez possession de la maison aujourd’hui' : 'Cochez quand l’entreprise vous a remis les clés'}</div></span></button>
          <div class="card stack" style="gap:14px">
            <div><span class="over"><b>Un mot pour l’entreprise (non public)</b></span><p class="muted small" style="margin-top:4px">Facultatif. Lu par l'entreprise et TEEQA seulement. Pas de note, pas de classement.</p></div>
            <textarea class="textarea" style="min-height:76px" data-input="rate-comment" aria-label="Commentaire" placeholder="Un mot sur le déroulement du chantier (facultatif).">${esc(rt.comment)}</textarea>
          </div>` : ''}
          ${/* Vague 25 (jury : réception sans suite) : le titulaire à l'étranger peut donner procuration ; la suite est écrite. */''}${r === 'client' ? `<div class="card stack" style="gap:6px" data-testid="reception-suite"><span class="over"><b>Si vous n’êtes pas sur place</b></span><p class="meta" style="margin:0" data-testid="reception-distance"><b>À distance ?</b> Un proche signe à votre place s’il remplit les deux conditions : il est co-décideur (Droits) et sa procuration légalisée est déposée dans Documents. Il reçoit alors les clés ; sa signature porte son nom. Après la réception, le rapport sert pour le permis d’habiter, les raccordements (eau, électricité) et une mise en location : TEEQA ne les demande pas pour vous.</p><p class="meta" style="margin:0" data-testid="procuration">Vous pouvez signer d’ici, ou donner procuration à un proche co-décideur (Invitations et accès › Droits) : il fait le tour avec l’entreprise et signe à votre place ; son nom, le vôtre et la date sont écrits au procès-verbal, et vous le relisez avant qu’il parte.</p><p class="meta" style="margin:0"><b>Ensuite :</b> l’entreprise contresigne sous 8 jours ; les réserves écrites ont chacune un délai ; quand elles sont levées (photo ou visite), vous signez la réception définitive ; les garanties de 1 an et 10 ans partent de la réception provisoire.</p></div>` : ''}
        </div></div>
        <div class="footer-cta">
          <button class="btn saffron block" data-act="close" ${ok && r === 'client' ? '' : 'disabled'}>Signer la réception provisoire</button>${!ok && r === 'client' ? `<p class="meta" style="text-align:center" data-testid="reception-pourquoi">Grisé tant qu’une étape n’est pas close ou qu’une tranche n’est pas payée : une étape peut être close avant d’être payée, la réception attend les deux. La liste est au-dessus.</p>` : ''}
          ${r !== 'client' ? `<p class="meta" style="text-align:center">Le client signe la réception ; ${r === 'entreprise' ? 'vous contresignerez ensuite le procès-verbal' : "l'entreprise la contresigne ensuite"}.</p>` : ''}
        </div>`,
        on: {
          rate(b) { const k = b.dataset.k, n = +b.dataset.n; rt[k] = rt[k] === n ? 0 : n; actions.setDraft(key, rt);
            b.parentElement.querySelectorAll('.star').forEach(x => { x.dataset.on = +x.dataset.n <= rt[k]; x.setAttribute('aria-checked', +x.dataset.n === rt[k]); }); },
          'rate-comment'(t) { rt.comment = t.value; actions.setDraft(key, rt); },
          reserves(t) { rt.reserves = t.value; actions.setDraft(key, rt); },
          cles() { rt.cles = !rt.cles; actions.setDraft(key, rt); sfx('choix'); go(location.hash, { replace: true }); },
          close() {
            const done = p.steps.length, reserves = (p.pvControleur ? p.pvControleur.reserves : rt.reserves || '').trim();
            const rating = rt.comment.trim() ? { comment: rt.comment.trim() } : null;
            actions.closeProject(p.id, rating, { reserves, cles: !!rt.cles }); go(`#/c/${p.id}/report`, { replace: true });
            openSheet(`<div class="celebrate">
                <div class="celebrate-art">${bellarej('felicite', 190, { cls: 'pop-in', alt: 'Bellarej, la cigogne, vous félicite' })}</div>
                <span class="over"><b>${esc(p.city)}</b><span class="rule"></span>Réception provisoire</span>
                <h2>${esc(p.name)} est <span class="kw">réceptionnée</span>.</h2>
                <p class="muted">${done} étapes closes, ${reserves ? 'avec réserves' : 'sans réserve'}. Le procès-verbal attend la contresignature de l'entreprise. Le chantier passe <b>en garantie</b> ; il sera clos et archivé à la réception définitive.</p>
                <button class="btn saffron block" data-act="sheet-close" style="margin-top:6px">Voir le rapport</button></div>`, { label: 'Réception provisoire' });
          },
        },
      };
    },
  },
  {
    // Problème 20 : avenants. Des travaux en plus, proposés par l'un, acceptés par l'autre ; acceptés, ils ajoutent une étape au chemin.
    name: 'avenants', pattern: /^\/c\/([^/]+)\/avenants$/,
    render(pid) {
      const p = project(pid);
      if (!p) return { redirect: '#/home' };
      const r = get().role, avs = (p.avenants || []).slice().reverse();
      const AV_ST = { propose: ['Proposé · en attente', 'saffron'], accepte: ['Accepté', 'success'], refuse: ['Refusé', 'danger'], caduc: ['Tombé au changement d’entreprise', ''], expire: ['Expiré sans réponse (5 jours)', ''] };
      const late = overdue(p, null).includes('avenant');
      const byLabel = (b) => b === 'client' ? 'le client' : "l'entreprise";
      return {
        html: `${appbar({ title: 'Avenants', back: `#/c/${p.id}`, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div><span class="over">${esc(p.name)} · ${esc(p.city)}</span><h1 class="h2" style="margin:4px 0 0">${avs.length ? `${avs.length} avenant${avs.length > 1 ? 's' : ''}` : 'Aucun avenant'}</h1></div>
          <div class="notice">${icon('info', 'sm')}<span>L'un le propose, l'autre l'accepte ou le refuse (exemple : l'entreprise propose une pergola avec son prix ; vous l'acceptez, son montant s'ajoute au budget). Une fois accepté, l'étape ajoutée se place avant la dernière étape (visite de réception), qui reste la dernière. Son montant s'ajoute au budget des travaux ; le paiement se fait hors de TEEQA. Une visite de contrôle peut y être ajoutée (${tarif('visite')}, payée par le client) ; pour un ouvrage de structure (béton armé, radier, fondations, dalle, piscine), elle est obligatoire, au point d’arrêt avant le coulage, quelle que soit sa place dans le chemin.</span></div>${def('avenant')}
          ${late ? `<span class="chip danger" style="justify-self:start" data-testid="en-retard">${icon('clock', 'xs')}En retard · ${DELAI_LABEL.avenant}</span>` : ''}
          ${avs.length ? `<div class="list">${avs.map(a => `<div class="list-item" style="align-items:flex-start" data-testid="avenant">
              <span class="ico-tile ${AV_ST[a.status][1]}">${icon(a.status === 'accepte' ? 'check' : a.status === 'refuse' ? 'close' : 'file')}</span>
              <span class="grow stack" style="gap:6px"><span class="t">${esc(a.title)}</span>
                ${a.note ? `<div class="s">${esc(a.note)}</div>` : ''}
                <div class="meta">Proposé par ${byLabel(a.by)}${a.by === r ? ' (vous)' : ''} le ${fmtDate(a.at)} · ${a.structure ? `<b>structure : visite obligatoire au point d’arrêt, avant coulage</b> (${tarif('visite', { eur: false })})` : a.controlled ? `avec visite de contrôle (${tarif('visite', { eur: false })})` : 'sans visite de contrôle'}${a.dh ? ` · montant ${dh(a.dh)}${a.status === 'accepte' ? ', ajouté au budget' : ''}` : ''}${a.answeredAt ? ` · réponse le ${fmtDate(a.answeredAt)}` : ''}</div>
                ${['propose', 'accepte'].includes(a.status) ? `<div class="meta" data-testid="avenant-effets"><b>${a.status === 'accepte' ? 'Ce que cela a changé' : 'Si vous l’acceptez'} :</b> une étape « ${esc(a.title)} » avant la réception${a.dh ? `, avec sa tranche de ${dh(a.dh)}, due 7 jours après ${a.structure ? 'son coulage (après l’avis favorable)' : a.controlled ? 'son avis favorable' : 'la déclaration consultée'}` : ''} ; ${a.dh ? `budget ${a.status === 'accepte' ? 'porté' : 'porté à'} ${a.status === 'accepte' ? 'à ' + dh((budgetOf(p) || {}).total || 0) : dh(((budgetOf(p) || {}).total || 0) + a.dh)} ; ` : ''}le rapport la montre comme les autres ; la fin prévue ne bouge que si l’avenant le dit ; décennale : l’entreprise fait ajouter cet ouvrage à son assurance (TEEQA ne la vérifie pas).</div>` : ''}${/* vague 23 (jury n° 11 ; 5 jurés : avenant sans règle de prix, de délai ni d'effet sur la tranche) */''}
                <span class="chip ${AV_ST[a.status][1]}" style="justify-self:start">${AV_ST[a.status][0]}</span>${a.status === 'caduc' ? `<div class="meta" data-testid="avenant-caduc">Proposé par l’entreprise sortante et pas accepté avant le changement d’entreprise (${fmtDate(a.caducAt)}) : il ne vaut plus. L’entreprise reprenante peut le proposer de nouveau.</div>` : ''}
                ${a.status === 'propose' && a.by !== r && can(r, p, null, 'avenant') ? `<div class="btn-row" style="flex-wrap:wrap"><button class="btn sm saffron" data-act="av-yes" data-id="${a.id}">Accepter</button><button class="btn sm ghost" data-act="av-no" data-id="${a.id}">Refuser</button><button class="btn sm ghost" data-act="av-counter" data-id="${a.id}" data-testid="av-counter">Contre-proposer</button></div>` : ''}
                ${a.status === 'propose' && a.by === r ? `<div class="meta">En attente de la réponse de ${byLabel(a.by === 'client' ? 'entreprise' : 'client')}.</div>` : ''}
              </span></div>`).join('')}</div>` : `<p class="muted">Aucun avenant pour l'instant.</p>`}
          ${p.status === 'clos' ? `<div class="notice">${icon('lock', 'sm')}<span>Chantier réceptionné : les avenants sont archivés, en lecture seule.</span></div>` : ''}
          ${r === 'controleur' ? `<div class="notice">${icon('lock', 'sm')}<span>Seuls le client et l'entreprise proposent ou acceptent un avenant.</span></div>` : ''}
        </div></div>
        ${can(r, p, null, 'avenant') ? `<div class="footer-cta"><button class="btn saffron block" data-act="av-new" data-testid="av-new">${icon('plus', 'sm')}Proposer un avenant</button></div>` : ''}`,
        on: {
          'av-new'() { avNewSheet(p, r); },
          // Vague 18 NT (scène 1) : refuser en proposant autre chose ; le refus et la contre-proposition restent datés.
          'av-counter'(b) { const a = (p.avenants || []).find(x => x.id === b.dataset.id); if (!a) return; actions.answerAvenant(p.id, a.id, r, false);
            avNewSheet(p, r, { title: a.title, note: `Contre-proposition à « ${a.title} »${a.dh ? ` (proposé à ${dh(a.dh)})` : ''} : ` }); },
          'av-yes'(b) { const a = (p.avenants || []).find(x => x.id === b.dataset.id); if (!a) return;
            confirmSheet({ title: "Accepter l'avenant ?", body: `« ${a.title} » s'ajoutera comme nouvelle étape avant la visite de réception${a.controlled ? ', avec une visite de contrôle' : ', sans visite de contrôle'}${a.dh ? `, et ${dh(a.dh)} au budget des travaux` : ''}.`, confirm: 'Accepter',
              onConfirm: () => { actions.answerAvenant(p.id, a.id, r, true); sfx('tampon'); toast('Avenant accepté : étape ajoutée', 'check'); go(`#/c/${p.id}/avenants`, { replace: true }); } }); },
          'av-no'(b) { const a = (p.avenants || []).find(x => x.id === b.dataset.id); if (!a) return;
            confirmSheet({ title: "Refuser l'avenant ?", body: `« ${a.title} » ne sera pas ajouté au chemin. ${byLabel(a.by) === 'le client' ? 'Le client' : "L'entreprise"} sera prévenu.`, confirm: 'Refuser', danger: true,
              onConfirm: () => { actions.answerAvenant(p.id, a.id, r, false); toast('Avenant refusé', 'close'); go(`#/c/${p.id}/avenants`, { replace: true }); } }); },
        },
      };
    },
  },
];

function roleDot(k) { return roleAvatar(k, 40); }
