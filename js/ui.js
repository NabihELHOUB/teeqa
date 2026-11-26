// Composants d'interface partagés (chaînes HTML) + feuilles et toasts.
import { icon } from './icons.js';
import { play as playSon, warm as warmSons, unlock as unlockSons, ready as sonsReady, wake as wakeSons } from './sons.js';
import { CLOS_ID, ROLES, STATUS, get, unread, waitingActions, nowMs, tarif, langOf, PILOTE, ENGAGEMENTS, heureClient, tauxEcran } from './store.js';
import { spring, drag, reduced } from './motion.js';
import { bellarejRig } from './bellarej-rig.js';

export const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Vague 8 : les dates suivent la langue du lecteur (arabe : mois en arabe, chiffres latins ; darija et tamazight : en lettres latines, comme le français).
const FMT = {};
const fmtr = (kind) => { let L = 'fr'; try { L = langOf(); } catch { /* état pas encore chargé */ } const loc = L === 'ar' ? 'ar-MA-u-nu-latn' : 'fr-FR', k = loc + kind;
  return FMT[k] || (FMT[k] = new Intl.DateTimeFormat(loc, kind === 'd' ? { day: 'numeric', month: 'short' } : kind === 'y' ? { day: 'numeric', month: 'short', year: 'numeric' } : kind === 'f' ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit' })); };
// 20 nov. : une date d'une autre année porte son année (chantier clos de 2025, lu en 2026).
export const fmtDate = (d) => d ? (new Date(d).getFullYear() !== new Date(nowMs()).getFullYear() ? fmtr('y') : fmtr('d')).format(new Date(d)) : '—';
export const fmtFull = (d) => d ? fmtr('f').format(new Date(d)) : '—';
export const fmtTime = (d) => d ? fmtr('t').format(new Date(d)) : '';
export function fmtRel(d) {
  const diff = (nowMs() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return fmtDate(d);
}

// Le bandeau « Démo · fictif » est supprimé (décision du 10 nov.) : le changement de rôle
// vit dans Profil › Mode démo, et par appui long sur l'onglet Profil. Conservé vide pour les écrans qui l'appellent.
export function demobar() { return ''; }

export function appbar({ title = '', back = null, right = '', dark = false, sep = false, left = false, close = false } = {}) {
  return `<header class="appbar ${dark ? 'dark' : ''} ${sep ? 'sep' : ''}">
    ${back ? `<button class="icon-btn" data-act="back" data-fallback="${esc(back)}" aria-label="${close ? 'Fermer' : 'Retour'}">${icon(close ? 'close' : 'back')}</button>` : (left ? '' : '<span class="spacer"></span>')}
    <h1 class="${left ? 'left-title' : ''}">${title}</h1>
    ${right || (left ? '' : '<span class="spacer"></span>')}
  </header>`;
}

export function tabbar(active) {
  const r = get().role;
  const n = unread(r);
  const up = get().uploads.filter(u => u.status !== 'synchronisee').length;
  // Vague 3 : un nombre n'apparaît que s'il compte ce qui VOUS attend (onglet Chantiers / Missions). Les nouvelles non lues
  // ont un simple point, sans nombre ; les envois en attente gardent leur nombre, avec une étiquette qui le dit.
  const todo = waitingActions(r), s = (k) => k > 1 ? 's' : '';
  const tabs = [
    ['home', '#/home', 'home', r === 'controleur' ? 'Missions' : 'Chantiers', todo, `${todo} action${s(todo)} vous attend${todo > 1 ? 'ent' : ''}`],
    ['notifs', '#/notifications', 'bell', 'Activité', n ? '' : 0, `${n} nouvelle${s(n)} non lue${s(n)}`],
    ['uploads', '#/uploads', 'cloudUp', 'Envois', up, `${up} envoi${s(up)} en attente`],
    ['profile', '#/profile', 'user', 'Profil'],
  ];
  return `<nav class="tabbar" aria-label="Navigation principale">${tabs.map(([k, href, ic, label, badge, said]) => { const dot = badge === '' ;
    return `<button class="tab ${k === 'notifs' && dot && active !== k ? 'ring' : ''}" data-go="${href}" ${active === k ? 'aria-current="page"' : ''} ><span class="tab-ico">${stamp(ic, active === k)}</span>${badge ? `<span class="badge-dot" aria-hidden="true">${badge}</span>` : dot ? `<span class="badge-dot" aria-hidden="true" style="min-width:10px;width:10px;height:10px;padding:0"></span>` : ''}<span>${label}</span>${badge || dot ? `<span class="sr-only"> : ${said}</span>` : ''}</button>`; }).join('')}</nav>`;
}

// Onglets (référence de l'utilisateur : la barre de Duolingo) : de gros objets simples, en relief mat comme
// Bellarej et l'icône de l'appli (dégradé doux, rebord sombre dessous, reflet). L'onglet choisi est entouré (voir app.css).
// Emplacement prévu : si de vraies icônes 3D arrivent (assets/onglets/onglet-<nom>.webp), remplacer le contenu de TABS.
const GR = [['cream', '#FBF7EE', '#DDD2BC'], ['terra', '#D98A5F', '#A9552F'], ['green', '#3A9A78', '#0E3B31'], ['saf', '#F4C25C', '#C68620'], ['sky', '#CFE6EE', '#9CC3D0']];
const DEFS = `<defs>${GR.map(([n, a, b]) => `<linearGradient id="tg-${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}</defs>`;
const TABS = {
  // Chantiers : la maison à toit plat, sa porte en arc
  home: `<rect x="4" y="35.5" width="40" height="9" rx="4.5" fill="#7E3D20"/><rect x="4" y="33" width="40" height="9" rx="4.5" fill="url(#tg-terra)"/>
    <path d="M10 36V15.5h6v3.2h5v-3.2h6v3.2h5v-3.2h6V36z" fill="#B9AD95" stroke="#B9AD95" stroke-width="2.4" stroke-linejoin="round" transform="translate(0 1.6)"/>
    <path d="M10 36V15.5h6v3.2h5v-3.2h6v3.2h5v-3.2h6V36z" fill="url(#tg-cream)" stroke="url(#tg-cream)" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M18.2 37.2V28a5.8 5.8 0 0 1 11.6 0v9.2z" fill="url(#tg-green)"/>
    <circle cx="26.6" cy="31.6" r="1.25" fill="#F4C25C"/>
    <path d="M12.2 20.5v9" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
  // Activité : la cloche
  bell: `<circle cx="24" cy="39" r="4.6" fill="url(#tg-terra)"/>
    <path d="M24 6.5a11.5 11.5 0 0 1 11.5 11.5v7.6l3.6 5.6a2.3 2.3 0 0 1-1.9 3.6H10.8a2.3 2.3 0 0 1-1.9-3.6l3.6-5.6V18A11.5 11.5 0 0 1 24 6.5z" fill="#99610F" transform="translate(0 2.2)"/>
    <path d="M24 6.5a11.5 11.5 0 0 1 11.5 11.5v7.6l3.6 5.6a2.3 2.3 0 0 1-1.9 3.6H10.8a2.3 2.3 0 0 1-1.9-3.6l3.6-5.6V18A11.5 11.5 0 0 1 24 6.5z" fill="url(#tg-saf)"/>
    <circle cx="24" cy="6.3" r="2.7" fill="url(#tg-saf)"/>
    <path d="M16.6 17.5c.4-3.4 2.6-6 5.6-6.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>`,
  // Envois : la photo qui part
  cloudUp: `<g transform="rotate(-7 22 24)"><rect x="5" y="10.2" width="33" height="29" rx="5" fill="#B9AD95"/><rect x="5" y="8" width="33" height="29" rx="5" fill="url(#tg-cream)"/>
      <rect x="9" y="12" width="25" height="17.5" rx="2.6" fill="url(#tg-sky)"/>
      <path d="M9 29.5v-5.2l6.4-5 5.2 3.8 4.4-3 9 6v3.4a2.6 2.6 0 0 1-2.6 2.6H11.6A2.6 2.6 0 0 1 9 29.5z" fill="url(#tg-terra)"/><circle cx="29" cy="16.6" r="2.3" fill="#F4C25C"/></g>
    <circle cx="35" cy="35.2" r="9.6" fill="#082A22"/><circle cx="35" cy="33.4" r="9.6" fill="url(#tg-green)"/>
    <path d="M35 38.2v-9.2M30.8 32.6l4.2-4.2 4.2 4.2" fill="none" stroke="#FBF7EE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Profil : un buste dans un médaillon
  user: `<circle cx="24" cy="25.8" r="19.5" fill="#082A22"/><circle cx="24" cy="23.4" r="19.5" fill="url(#tg-green)"/>
    <path d="M11.4 37.6c1.6-7.4 6.4-11 12.6-11s11 3.6 12.6 11a19.4 19.4 0 0 1-25.2 0z" fill="url(#tg-saf)"/>
    <circle cx="24" cy="18.2" r="7" fill="url(#tg-cream)"/>
    <path d="M10.6 17c1.6-4 4.6-6.8 8.4-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/>`,
};
// Icônes 3D « matière » (Higgsfield) : elles remplacent les dessins ci-dessus seulement quand les QUATRE sont là,
// pour ne jamais mélanger deux styles dans la barre. Ajouter le nom à TAB_3D_READY dès qu'un fichier est rangé.
const TAB_3D = { home: 'chantiers', bell: 'activite', cloudUp: 'envois', user: 'profil' };
const TAB_3D_READY = ['chantiers', 'activite'];
const TAB_3D_ON = Object.values(TAB_3D).every((n) => TAB_3D_READY.includes(n));
function stamp(kind, on) {
  if (TAB_3D_ON && TAB_3D[kind]) return `<img class="stamp ${on ? 'on' : ''}" src="assets/onglets/onglet-${TAB_3D[kind]}.webp" alt="" width="38" height="38" decoding="async" draggable="false">`;
  return `<svg class="stamp ${on ? 'on' : ''}" viewBox="0 0 48 48" aria-hidden="true">${DEFS}${TABS[kind] || TABS.home}</svg>`;
}

export function statusChip(status) {
  const s = STATUS[status];
  return `<span class="chip ${s.chip}">${icon(s.icon, 'xs')}${s.label}</span>`;
}
export const simChip = (t = 'Simulé') => `<span class="chip sim">${t}</span>`;
// ---------- Photos de profil : Bellarej habillée selon le rôle (demande de l'utilisateur, 11 nov.) ----------
// client : collier vert et étoile · entreprise : casque de chantier orange · contrôleur : casque jaune et gilet
// masque : le contrôleur tel que l'entreprise le voit (anonyme) : même tenue, un loup sur les yeux.
const AV = { w: '#FAF6EC', w2: '#E6DCC8', k: '#2B2D31', o: '#EE9140', o2: '#C96F2A', g: '#14503F', s: '#E2A33B' };
export function avatar(kind = 'client', size = 40) {
  const bg = { client: '#F3D9A4', entreprise: '#F1C9B0', controleur: '#BFDCCB', masque: '#0E3B31' }[kind] || '#F3D9A4';
  const hat = kind === 'entreprise' ? ['#E0703A', '#B8542A', '#F08A54'] : kind === 'client' ? null : ['#F2B632', '#D99A1C', '#F7CB5A'];
  const eye = (x) => `<g class="av-eye ${x < 60 ? 'l' : 'r'}"><ellipse cx="${x}" cy="55" rx="6.4" ry="8" fill="${AV.k}"/><circle cx="${x - 2}" cy="51.6" r="2.5" fill="#fff"/></g>`;   // classes : pour le clin d'œil (convention, article 3)
  const shoulders = kind === 'client' ? `<path d="M30 122 C32 96 88 96 90 122 Z" fill="${AV.w}"/><path d="M41 96 C52 102 68 102 79 96 V105 C68 111 52 111 41 105 Z" fill="${AV.g}"/><path d="M60 103 l2.4 5 l5 2.4 l-5 2.4 l-2.4 5 l-2.4 -5 l-5 -2.4 l5 -2.4 z" fill="${AV.s}"/>`
    : `<path d="M26 122 C28 94 92 94 94 122 Z" fill="${hat[0]}"/><path d="M52 96 L60 116 L68 96 Z" fill="${AV.w}"/>${kind === 'entreprise' ? '' : `<path d="M26 112 H94 v6 H26 Z" fill="#F4EFE4"/>`}`;
  return `<svg class="av av-${kind}" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
    <defs><clipPath id="avc"><circle cx="60" cy="60" r="60"/></clipPath></defs>
    <g clip-path="url(#avc)"><rect width="120" height="120" fill="${bg}"/>${shoulders}
      <path d="M48 78 h24 v22 h-24 z" fill="${AV.w}"/>
      <ellipse cx="60" cy="56" rx="35" ry="32" fill="${AV.w}"/><path d="M29 68 C38 88 82 88 91 68 C80 80 40 80 29 68 Z" fill="${AV.w2}"/>
      <circle cx="35" cy="69" r="6" fill="${AV.o}" opacity=".22"/><circle cx="85" cy="69" r="6" fill="${AV.o}" opacity=".22"/>
      ${kind === 'masque' ? `<rect x="26" y="44" width="68" height="22" rx="11" fill="${AV.k}"/><ellipse cx="45" cy="55" rx="7.5" ry="6" fill="${AV.w}"/><ellipse cx="75" cy="55" rx="7.5" ry="6" fill="${AV.w}"/><circle cx="46" cy="55" r="3.4" fill="${AV.k}"/><circle cx="76" cy="55" r="3.4" fill="${AV.k}"/>` : eye(45) + eye(75)}
      <path d="M52 66 C54 60 66 60 68 66 C67.5 82 64 92 60 100 C56 92 52.5 82 52 66 Z" fill="${AV.o}"/><path d="M60 68 C62 82 61.5 92 60 100 C64 92 67.5 82 68 66 C66 63 63 64 60 68 Z" fill="${AV.o2}" opacity=".55"/>
      ${hat ? `<path d="M23 44 C23 2 97 2 97 44 Z" fill="${hat[0]}"/><path d="M54 13 h12 v31 h-12 z" fill="${hat[2]}"/><rect x="15" y="40" width="90" height="10" rx="5" fill="${hat[1]}"/><rect x="15" y="38.5" width="90" height="8" rx="4" fill="${hat[0]}"/>` : ''}
    </g></svg>`;
}
// Le contrôleur reste anonyme pour l'entreprise : elle voit la cigogne masquée.
export function roleAvatar(role, size = 36, viewer = get().role) {
  const kind = role === 'controleur' && viewer === 'entreprise' ? 'masque' : role;
  return `<span class="role-dot av-wrap" style="width:${size}px;height:${size}px;--dot-w:${size}px">${avatar(kind, size)}</span>`;
}
export function roleChip(role) { return `<span class="chip">${roleAvatar(role, 18)}${ROLES[role].label}</span>`; }

// ---------- Feuilles ----------
// Elles montent au ressort, suivent le doigt vers le bas et se ferment au ressort (docs/motion-duolingo.md).
let sheetEl = null;
export function openSheet(html, { onMount, label = 'Feuille' } = {}) {
  closeSheet(true);
  sfx('ouvre');
  const app = document.getElementById('app');
  sheetEl = document.createElement('div');
  sheetEl.className = 'sheet-wrap';
  sheetEl.innerHTML = `<div class="sheet-backdrop" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="grabber" aria-hidden="true"></div>${heureClient(html)}</div>`;
  app.appendChild(sheetEl); tauxEcran(sheetEl.querySelector('.sheet'));
  const wrap = sheetEl, sh = wrap.querySelector('.sheet'), bd = wrap.querySelector('.sheet-backdrop');
  const h = () => sh.offsetHeight || 1;
  let stop = () => {};
  const set = (y) => { sh.style.transform = `translate3d(0,${y}px,0)`; bd.style.opacity = String(Math.max(0, 1 - y / h())); };
  wrap._set = set; wrap._stop = () => stop();
  set(h());
  stop = spring({ from: h(), to: 0, onUpdate: set, onDone: () => { sh.style.transform = ''; } });
  // Glisser vers le bas : depuis la poignée / le haut, ou n'importe où si la feuille est en haut de son défilement.
  drag(sh, {
    axis: 'y',
    // jamais depuis une zone qui a son propre geste (signature, saisie)
    start: (e) => { if (e.target.closest('.sigpad, canvas, input, textarea')) return false; const top = e.clientY - sh.getBoundingClientRect().top < 64; return top || sh.scrollTop <= 0; },
    move: (d) => { stop(); set(d); },
    end: (d, v) => {
      if (d > h() * 0.28 || v > 0.5) { if (sheetEl === wrap) closeSheet(false, v); }
      else stop = spring({ from: d, to: 0, velocity: v, onUpdate: set, onDone: () => { sh.style.transform = ''; } });
    },
  });
  // tactile : sans défilement interne, toute la feuille appartient au geste
  requestAnimationFrame(() => { if (sh.scrollHeight <= sh.clientHeight + 1) sh.style.touchAction = 'none'; });
  const first = sheetEl.querySelector('button, input, textarea, [tabindex]');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
  onMount && onMount(sheetEl);
  return sheetEl;
}
export function closeSheet(immediate = false, velocity = 0) {
  if (!sheetEl) return;
  const el = sheetEl; sheetEl = null;
  el._stop && el._stop();
  if (immediate || reduced()) { el.remove(); return; }
  el.classList.add('closing');
  const sh = el.querySelector('.sheet');
  const m = new DOMMatrixReadOnly(getComputedStyle(sh).transform);
  spring({ from: m.m42 || 0, to: sh.offsetHeight + 24, velocity: Math.max(velocity, 0.4), onUpdate: el._set, onDone: () => el.remove() });
}
export const sheetOpen = () => !!sheetEl;

let toastTimer;
export function toast(text, ic = 'check') {
  const app = document.getElementById('app');
  let zone = app.querySelector('.toast-zone');
  if (!zone) { zone = document.createElement('div'); zone.className = 'toast-zone'; zone.setAttribute('role', 'status'); zone.setAttribute('aria-live', 'polite'); app.appendChild(zone); }
  zone.innerHTML = `<div class="toast">${icon(ic, 'sm')}<span>${esc(text)}</span></div>`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { zone.innerHTML = ''; }, 2600);
}

// Vague 25 (doigt : Reda, Meryem) : une petite récompense après une action réussie : Bellarej qui félicite, un son doux, une vibration.
export function recompense(text) {
  const app = document.getElementById('app'); if (!app) return;
  let zone = app.querySelector('.toast-zone');
  if (!zone) { zone = document.createElement('div'); zone.className = 'toast-zone'; zone.setAttribute('role', 'status'); zone.setAttribute('aria-live', 'polite'); app.appendChild(zone); }
  zone.innerHTML = `<div class="toast recompense" data-testid="recompense"><span class="rc-bird" aria-hidden="true">${bellarejRig('felicite', 34)}</span><span>${esc(text)}</span></div>`;
  sfx('valide'); try { if (navigator.vibrate && !reduced()) navigator.vibrate([10, 40, 14]); } catch { /* rien */ }
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { zone.innerHTML = ''; }, 2600);
}
export function confirmSheet({ title, body, confirm, danger = false, onConfirm }) {
  openSheet(`<h2>${title}</h2><p class="muted" style="margin-bottom:18px">${body}</p>
    <div class="stack"><button class="btn block ${danger ? 'danger' : ''}" data-sheet-confirm>${confirm}</button>
    <button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`, {
    label: title,
    onMount: (el) => el.querySelector('[data-sheet-confirm]').addEventListener('click', () => { closeSheet(); onConfirm(); }),
  });
}

// ---------- Vague 4 : les mots du chantier expliqués là où ils apparaissent (une ligne grise), pas seulement dans l'Aide ----------
export const MOTS = {
  tranche: "Tranche : la part du prix des travaux liée à une étape, payée par le client à l'entreprise, hors TEEQA.",
  reserves: "Réserves : des points à corriger avant que l'étape soit close. L'étape n'est pas refusée.",
  levee: "Levée des réserves : le contrôleur signe que les corrections sont faites.",
  contreVisite: `Contre-visite : le contrôleur revient sur place voir le travail repris. À la charge de l'entreprise : ${tarif('contreVisiteMineure', { eur: false })} pour 1 ou 2 points à reprendre, ${tarif('contreVisite', { eur: false })} au-delà ou après un Refusé ; jamais plus qu'une visite (${tarif('visite', { eur: false })}).`,
  avenant: "Avenant : un changement au contrat (étape ajoutée, délai), accepté par le client et l'entreprise.",
  reception: "Réception provisoire : le client prend possession de la maison, reçoit les clés et note par écrit ce qui reste à reprendre.",
  coulage: "Point d'arrêt : le contrôleur voit les aciers avant que le béton les cache ; l'entreprise coule ensuite et le déclare.",
  // Vague 6 : les mots du chantier en mots simples, là où ils apparaissent.
  ferraillage: "Ferraillage : les barres d'acier posées avant le béton. C'est le squelette de la maison : une fois le béton coulé, on ne le voit plus.",
  empreinte: "Empreinte : un code calculé sur le document. Si un seul mot change, le code change : on voit ainsi qu'il n'a pas été retouché.",
  horodate: "Horodaté : la date et l'heure sont inscrites automatiquement au moment du geste.",
  paiementE: "Paiement de la tranche : le client paie l'entreprise directement, hors TEEQA. Vous voyez ici ce que TEEQA lui recommande et ce qu'il indique.",
};
// Vague 9 : un mot du chantier ne s'explique plus en entier sur chaque écran : une ligne repliée « Que veut dire… ? »,
// dont le texte vient du glossaire unique (MOTS), le même que dans l'Aide.
// Vague 11 : plus de repli « Que veut dire… ? » : une ligne grise et courte, une seule fois par écran (voir explainWords).
export const MOTS_COURT = {
  tranche: [/(?<!ne )\btranches?\b(?! pas)/i, "Tranche : la part du prix d'une étape, payée à l'entreprise."],
  ferraillage: [/\bferraillage\b/i, "Ferraillage : les barres d'acier, avant le béton."],
  coulage: [/point d.arrêt/i, "Point d'arrêt : pas de béton avant l'avis du contrôleur."],
  reserves: [/\bréserves?\b/i, "Réserves : des points à corriger ; l'étape n'est pas refusée."],
  avenant: [/\bavenants?\b/i, "Avenant : un changement du contrat, accepté par les deux."],
  close: [/\bclose(s)?\b/i, "Close : travaux finis (et avis favorable, s'il y a une visite). Le paiement se suit à part."],
  contreVisite: [/contre-visite/i, "Contre-visite : le contrôleur revient voir le travail repris."],
  levee: [/levée des réserves/i, "Levée des réserves : le contrôleur signe que les corrections sont faites."],
  reception: [/réception provisoire/i, "Réception provisoire : le client prend les clés et note ce qui reste à reprendre."],
  empreinte: [/\bempreinte\b/i, "Empreinte : un code qui change si un seul mot du document change."],
  horodate: [/\bhorodaté/i, "Horodaté : date et heure inscrites automatiquement au moment du geste."],
  paiementE: [/(?!)/, "Paiement de la tranche : le client paie l'entreprise directement, hors TEEQA."],
};
const motLine = (k, tag = 'p') => { const [t, ...r] = MOTS_COURT[k][1].split(' : '); return `<${tag} class="meta mot-def" data-mot="${k}" data-testid="def"><b>${t}</b> : ${r.join(' : ')}</${tag}>`; };
export const def = (...keys) => keys.filter(k => MOTS_COURT[k]).map(k => motLine(k)).join('');
// Le premier endroit où un mot du chantier apparaît sur l'écran reçoit sa ligne d'explication ; les suivantes sont retirées.
export function explainWords(root) {
  const sc = root && (root.querySelector('.scroll') || root); if (!sc) return;
  const seen = new Set(); sc.querySelectorAll('.mot-def[data-mot]').forEach(e => { if (seen.has(e.dataset.mot)) e.remove(); else seen.add(e.dataset.mot); });
  if (langOf() !== 'fr' || (get() || {}).role === 'controleur') return;
  for (const k of ['close', 'tranche', 'ferraillage', 'coulage', 'reserves', 'avenant']) {
    if (seen.has(k)) continue; const rx = MOTS_COURT[k][0];
    const w = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT, { acceptNode: (n) => rx.test(n.nodeValue) && !n.parentElement.closest('button, summary, a, label, h1, h2, .over, .chip, .msg, .mot-def, [data-notr], details:not([open]), .appbar, .tabbar, .path-now, .pc-tranche') && n.parentElement.offsetParent !== null ? 1 : 3 });
    const n = w.nextNode(); if (!n) continue;
    const hero = n.parentElement.closest('.hero-step');
    // Vague 14 : sur l'étape, la définition va dans « En savoir plus » (le haut de l'écran reste en une phrase par bloc).
    const esp = hero && sc.querySelector('[data-testid="en-savoir-plus"] > .more-in');
    if (esp) esp.insertAdjacentHTML('afterbegin', motLine(k));
    else if (hero) hero.insertAdjacentHTML('afterend', motLine(k));
    else { const b = n.parentElement.closest('.grow, p, dd, li, .notice > span, .meta, div'); if (!b) continue; b.insertAdjacentHTML('beforeend', motLine(k, 'span').replace('class="meta mot-def"', 'class="meta mot-def" style="display:block;margin-top:2px"')); }
    seen.add(k);
  }
}

// Vague 11 : « Qui est TEEQA » et la phrase honnête sur le pilote, ensemble, visibles sans toucher, au même endroit.
export const piloteCard = (cta = true, clos = true) => `<div class="pilote stack" style="gap:6px" data-testid="pilote"><span class="over" data-testid="qui-teeqa">Qui est TEEQA</span><p class="meta" style="margin:0">${ENGAGEMENTS.identite}.</p>
  <p class="meta" style="margin:0"><b>${PILOTE.titre}.</b> ${PILOTE.texte}</p>
  <details class="def" data-testid="pilote-details"><summary class="meta">${icon('info', 'xs')}Comment marche le programme pilote ?</summary><dl class="kv" style="margin:6px 0 0">${PILOTE.details.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></details>
  ${clos && (get().projects || []).some((p) => p.id === CLOS_ID) ? `<button class="btn sm ghost" style="justify-self:start" data-go="#/c/${CLOS_ID}/report" data-testid="voir-clos">${icon('file', 'sm')}Voir un chantier mené jusqu'à la réception</button>` : ''}
  ${cta ? `<button class="btn sm ghost" style="justify-self:start" data-act="pilote">Proposer mon chantier au programme pilote</button>` : ''}</div>`;
// Vague 9 : tout ce qui n'est pas « où on en est, qui agit, quoi faire » se replie sous un titre court.
export const fold = (title, sub, inner, testid = '') => (inner || '').replace(/\s+/g, '') ? `<details class="more"${testid ? ` data-testid="${testid}"` : ''}><summary>${icon('chevronDown', 'sm')}<span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></summary><div class="more-in stack" style="gap:10px">${inner}</div></details>` : '';

// ---------- Jours : « Aujourd'hui », « Hier », sinon la date ----------
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export function dayLabel(d) {
  const a = new Date(d), n = new Date(nowMs());
  const days = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  // Vague 10 (jury) : « Aujourd'hui » et « Hier » gardent leur date, pour qu'un même jour se lise pareil partout.
  if (days === 0) return `Aujourd'hui · ${dayFmt.format(a)}`;
  if (days === 1) return `Hier · ${dayFmt.format(a)}`;
  const t = dayFmt.format(a);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
// Regroupe une liste (déjà triée) par jour : [[libellé, éléments], …]
export function dayGroups(list, key = 'at') {
  const out = [];
  for (const x of list) { const l = dayLabel(x[key]); if (!out.length || out[out.length - 1][0] !== l) out.push([l, []]); out[out.length - 1][1].push(x); }
  return out;
}

// ---------- Sons (décision D6, refaits le 11 nov.) : fichiers « matière » de js/sons.js ; coupés dans Paramètres ----------
// Les anciens noms restent valables : pop, send, success, warn. Un léger écart de hauteur d'un toucher à l'autre évite l'effet
// « mitraillette » des petits sons répétés. Sans fichier (hors ligne, navigateur ancien) : rien, sans gravité.
const OLD = { pop: 'tap', send: 'envoi', success: 'valide', warn: 'reserve' };
const SOFT = { tap: .85, ouvre: .6 };
let lastSfx = 0;
export function sfx(name, opts = {}) {
  try {
    if (get().prefs.sound === false) return;
    const n = OLD[name] || name, now = performance.now();
    if ((n === 'tap' || n === 'choix' || n === 'ouvre') && now - lastSfx < 70) return;   // jamais deux petits sons collés
    lastSfx = now;
    const jitter = n === 'tap' || n === 'choix' ? 1 + (Math.random() - .5) * .08 : 1;
    playSon(n, { vol: SOFT[n] || 1, rate: jitter, ...opts });
  } catch { /* pas de son : sans gravité */ }
}
// ---------- Sons d'ouverture (demande du 11 nov.) : deux sons différents ----------
//  « lancement » : quand l'appli démarre et joue son animation (js/screens/entry.js envoie l'événement teeqa-lancement) ;
//  « retour »    : quand on revient dans l'appli restée ouverte en arrière-plan (autre appli, écran d'accueil du téléphone).
// Limite des navigateurs, iPhone compris : aucun son ne peut partir avant le premier toucher. Au tout premier démarrage,
// l'animation est donc muette, et le son de lancement se joue au premier toucher s'il arrive dans les 8 secondes
// (il remplace alors le petit son du bouton). Au retour, le son part tout de suite si le téléphone laisse reprendre l'audio.
let launchPending = 0, hiddenAt = 0;
const soundOn = () => { try { return get().prefs.sound !== false; } catch { return false; } };
if (typeof document !== 'undefined') {
  addEventListener('teeqa-lancement', () => { if (!soundOn()) return; if (sonsReady()) { launchPending = 0; sfx('lancement'); } else launchPending = performance.now(); });
  for (const ev of ['touchend', 'click']) document.addEventListener(ev, () => {
    if (!launchPending) return; const late = performance.now() - launchPending > 8000 + 1800; launchPending = 0;
    if (!late && soundOn()) { sfx('lancement'); lastSfx = performance.now() + 80; }   // le son du bouton ne s'ajoute pas par-dessus
  }, { capture: true, passive: true });
  const back = async () => { const away = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0; if (away < 2000 || !soundOn() || launchPending) return; if (await wakeSons()) sfx('retour'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else back(); });
  addEventListener('pageshow', (e) => { if (e.persisted) { hiddenAt = hiddenAt || Date.now() - 5000; back(); } });
}
// Son par défaut d'un toucher (posé par js/vie.js sur les boutons et les cartes) : il ne part que si l'action elle-même
// n'a pas joué son propre son juste après (carreau posé, envoi, validation…), pour ne jamais en entendre deux.
export function sfxTap() { const t0 = performance.now(); setTimeout(() => { if (lastSfx < t0) sfx('tap'); }, 0); }
if (typeof document !== 'undefined') for (const ev of ['touchend', 'click']) document.addEventListener(ev, () => { try { if (get().prefs.sound !== false) unlockSons(); } catch { /* sans gravité */ } }, { capture: true, passive: true });
if (typeof document !== 'undefined') document.addEventListener('pointerdown', () => { try { if (get().prefs.sound !== false) warmSons(); } catch { /* sans gravité */ } }, { once: true, passive: true });

// ---------- Essais à trancher (11 nov.) : l'utilisateur demande souvent « trois propositions ». Une petite rangée 1-2-3, provisoire,
// change la variante sur place ; le choix est gardé dans le navigateur (clé teeqa-essai-<nom>). Quand il a choisi : garder la
// variante, retirer la rangée et les deux autres. Le clic est géré une fois pour toutes dans js/app.js.
export const trial = (key, def = 1) => { try { return +(localStorage.getItem('teeqa-essai-' + key) || def); } catch { return def; } };
export const trialPick = (key, label, cls = '') => `<div class="trial-pick ${cls}" role="group" aria-label="${label} (essai)"><span>${label}</span>${[1, 2, 3].map(i => `<button type="button" data-trial="${key}" data-n="${i}" aria-pressed="${i === trial(key)}" aria-label="${label} ${i}">${i}</button>`).join('')}</div>`;
