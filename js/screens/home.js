// Accueil chantiers, création, activité, envois, profil et pages d'aide.
import { enGarantie, archive, agendaEntreprise, METIERS, deviseVue, enDeviseTxt, telSupport, villeClient, phraseArgent, pourSortante, trancheDh, echeance, echeanceEstimee, retardJours, agenceFor, SEQUESTRE, sequestreFraisTxt, CLOS_ID, reseauTxt, tranchesTxt, forfaitCalc, REGLES, conventionOk, PAYS, pays, plageChezVous, tauxLigne, dh, simpleOn, SUPPORT, releve, prix, budgetOf, langOf, TARIFS, forfait, tarif, agenceLine, AGENCES, VILLES, nowMs, GARANTIE_TXT, HORS_ZONE, AGENCE, SALLE, salleRecommencer, forMe, invitationsFor, REPORT_STATES, REPORT_FLOW, actions, get, reset, progress, currentStep, access, who, controlledIndexes, allControlled, statusKey, ROLES, STATUS, TEMPLATE_STEPS, project, step, SITE_TYPES, typeSteps, FORMULES, MIN_VISITS } from '../store.js';
const vibOn = () => { try { return JSON.parse(localStorage.getItem('teeqa-vibrations') ?? 'true') !== false; } catch { return true; } };

// M06 : ce que couvre le forfait TEEQA, et ce qu'il ne couvre pas. 19 nov. : les prix s'affichent (règle levée), tous tirés
// de TARIFS (store.js) ; le paiement des travaux reste à part, hors TEEQA.
// Vague 8 : un humain joignable (équipe TEEQA), pour chaque rôle : WhatsApp, téléphone, rappel, horaires, langues.
export function humainSheet() {
  const r = get().role, t = encodeURIComponent(`Bonjour TEEQA, je suis ${r === 'controleur' ? 'contrôleur' : r === 'entreprise' ? "l'entreprise" : 'client'} sur TEEQA et j'ai une question.`);
  openSheet(`<h2>Parler à quelqu'un</h2>
    <p class="muted small" style="margin-bottom:12px">L'équipe TEEQA répond elle-même, ${esc(SUPPORT.horaires)}${plageChezVous(8, 20) ? ` (${esc(plageChezVous(8, 20))})` : ''}. Langues : ${esc(SUPPORT.langues)}. Si personne ne parle la vôtre à ce moment, un rappel vous est proposé sous 24 h par quelqu’un qui la parle. Elle explique l'appli et les règles ; elle ne tranche pas un désaccord et ne parle pas à la place du contrôleur.</p>
    <div class="list" data-testid="humain">
      <a class="list-item" href="https://wa.me/?text=${t}" target="_blank" rel="noopener"><span class="ico-tile success">${icon('message')}</span><span class="grow"><span class="t">Écrire sur WhatsApp</span><div class="s">Écrit, vocal ou appel vidéo, dans votre langue · ce que vous y envoyez passe par WhatsApp, hors du Maroc ; vos photos et avis restent dans TEEQA</div></span>${icon('chevron', 'sm chev')}</a>
      <button class="list-item" data-act="humain-call"><span class="ico-tile">${icon('phone')}</span><span class="grow"><span class="t">Appeler TEEQA</span><div class="s" data-testid="humain-tel"><span data-notr>${esc(telSupport())}</span> · ${pays() !== 'MA' && r === 'client' ? `numéro local ${esc(PAYS[pays()].de)}, au prix d’un appel local, répondu par l’équipe au Maroc` : 'numéro au Maroc'}</div></span>${icon('chevron', 'sm chev')}</button>
      <button class="list-item" data-act="humain-rappel" data-testid="humain-rappel"><span class="ico-tile saffron">${icon('clock')}</span><span class="grow"><span class="t">Être rappelé</span><div class="s">${esc(SUPPORT.rappel)}</div></span>${icon('chevron', 'sm chev')}</button></div>
    <button class="btn ghost block" data-act="sheet-close" style="margin-top:12px">Fermer</button>`, { label: "Parler à quelqu'un",
    onMount: (el) => { el.querySelector('[data-act="humain-call"]').addEventListener('click', (e) => { e.stopPropagation(); toast('Appel vers TEEQA', 'phone'); });
      el.querySelector('[data-act="humain-rappel"]').addEventListener('click', (e) => { e.stopPropagation(); closeSheet(); toast(`Rappel demandé · ${plageChezVous(8, 20) ? `entre ${plageChezVous(8, 20).replace(/^soit /, '').replace(/ à votre heure \(([^)]+)\) aujourd'hui$/, ' (heure de $1)').replace(/^la même heure à (.+) aujourd'hui$/, '8 h – 20 h (heure de $1)')}` : 'entre 8 h et 20 h (heure du Maroc)'}`, 'check'); }); } });
}
export const forfaitCards = (k) => `<div class="stack" style="gap:8px">
  <div class="card stack" style="gap:4px"><div class="row" style="gap:10px"><span class="ico-tile ${k ? 'success' : ''}">${icon(k ? 'shield' : 'eye')}</span><b>Le forfait TEEQA${k ? '' : ' · formule Suivi'}</b></div>
    <p class="meta" style="margin:0">${k ? `${k} visite${k > 1 ? 's' : ''} d'un contrôleur d'une agence de contrôle, ses photos sur place, ses avis horodatés, le suivi et le rapport final.` : "Le suivi des déclarations et des photos de l'entreprise, et le rapport final. Aucune visite de contrôle : rien n'est vérifié sur place. Aucun point d'arrêt non plus : l'entreprise coule le béton sans attendre de visite ; vous voyez ses photos, jamais « vérifié »."}</p>
    <div class="row" style="justify-content:space-between;gap:8px;margin-top:4px" data-testid="forfait-prix"><span class="meta">${k ? `Prix du forfait, ${k} visite${k > 1 ? 's' : ''} comprise${k > 1 ? 's' : ''}` : 'Prix du forfait'}</span><b class="price">${forfait(k)}</b></div>
    <p class="meta" style="margin:0">${k ? esc(REGLES.forfaitMission) : 'Le forfait se paie en une fois, ou en 3 fois sans frais par carte : rien n’est dû avant la convention acceptée des deux côtés.'} Les visites pas encore faites sont remboursées si le chantier s'arrête.${k ? ` Calcul : ${esc(forfaitCalc(k))}. Une visite ajoutée coûte ${tarif('visite', { eur: false })}. Contre-visite : ${tarif('contreVisiteMineure', { eur: false })} ou ${tarif('contreVisite', { eur: false })}, jamais plus qu'une visite.` : ''}</p></div>
  <div class="card stack" style="gap:4px"><div class="row" style="gap:10px"><span class="ico-tile">${icon('wallet')}</span><b>Le paiement des travaux</b></div>
    <p class="meta" style="margin:0">Il se fait directement entre vous et l'entreprise, hors de TEEQA. TEEQA ne reçoit ni ne garde cet argent : il vous dit seulement « Paiement recommandé » ou « Paiement différé ».</p></div></div>`;
// Nombre de visites proposées en « Suivi contrôlé » pour n étapes : jamais moins que les étapes clés (MIN_VISITS).
const keyVisits = (n) => Math.min(MIN_VISITS, n);
// Vague 2 (19 nov.) : les outils de présentation (changer de vue, hors ligne, échec d'envoi) ne sont plus visibles pour un
// utilisateur. Ils s'ouvrent une fois avec l'adresse « ?outils » (retenu ensuite sur cet appareil), ou dans la salle partagée.
const presenter = () => { try { if (/[?&]outils\b/.test(location.search)) localStorage.setItem('teeqa-outils', '1'); return SALLE || localStorage.getItem('teeqa-outils') === '1'; } catch { return SALLE; } };
const CONTROL_CHOICES = (n) => [[keyVisits(n), 'Étapes clés'], [Math.ceil((keyVisits(n) + n) / 2), (() => { const c = Math.ceil((keyVisits(n) + n) / 2), base = controlledIndexes(n, keyVisits(n)), add = [...controlledIndexes(n, c)].filter(i => !base.has(i)).map(i => i + 1).sort((a, b) => a - b); return add.length ? `+ étape${add.length > 1 ? 's' : ''} ${add.join(', ')}` : 'Étapes clés et plus'; })()], [n, 'Chaque étape']].filter(([c], i, a) => c >= keyVisits(n) && c <= n && a.findIndex(x => x[0] === c) === i);
// Visites retenues dans le brouillon : 0 en formule Suivi, sinon au moins les étapes clés.
const draftVisits = (d) => { const n = d.steps.length; return d.formule === 'suivi' ? 0 : Math.max(keyVisits(n), Math.min(d.controls || keyVisits(n), n)); };
import { icon } from '../icons.js';
import { langName } from '../langues.js';
import { houseSVG, photoSVG, bellarej, khatam, stepIcon3D } from '../art.js';
import { recompense, demobar, appbar, tabbar, esc, fmtDate, fmtFull, fmtRel, fmtTime, statusChip, toast, confirmSheet, openSheet, closeSheet, dayGroups, sfx, roleAvatar, piloteCard, fold } from '../ui.js';
import { go } from '../app.js';
import { spring } from '../motion.js';

// Vague 22 (doigt : Hassan ; Fatima) : la prochaine tranche (montant et date) dès Mes chantiers, sans ouvrir l'étape.
export function prochaineTranche(p, r, cls = 'pc-tranche') {
  if (!['client', 'entreprise'].includes(r) || p.status === 'clos' || access(p, r) !== 'ok') return '';
  // Vague 24 (jury n° 5) : l'entreprise reprenante ne voit pas comme « sa » tranche celle due à l'entreprise sortante.
  const s = p.steps.find(x => !x.decision && !x.sequestre && trancheDh(p, x) && !(r === 'entreprise' && pourSortante(p, x))); if (!s) return '';
  const ph = phraseArgent(p, s, r); if (!ph) return '';
  // Vague 24 (doigt : Abdelkader) : une seule phrase en gros (« Rien à payer maintenant » ou « Payez … avant le … »), la suite dessous, sur sa ligne.
  return `<div class="${cls} pa-bloc${ph.du ? ' pa-du' : ''}" data-testid="prochaine-tranche">${icon('wallet', 'xs')}<span class="pa-txt"><b class="pa-gros" data-testid="argent-gros">${esc(ph.gros)}</b>${ph.sous ? `<span class="pa-sous" data-testid="date-estimee">${esc(ph.sous)}</span>` : ''}${ph.dep ? `<span class="pa-sous" data-testid="date-depend">${esc(ph.dep)}</span>` : ''}${r === 'client' && deviseVue() ? `<span class="pa-sous" data-testid="pa-devise"><bdi data-notr dir="ltr">${esc(dh(ph.m))} ≈ ${esc(enDeviseTxt(ph.m, deviseVue()))}</bdi> <span>(taux indicatif du jour)</span></span>` : ''}<span class="pa-qui"><span>${r === 'client' ? (ph.a ? `Prochain paiement à ${esc(ph.a)} (entreprise sortante) :` : `À payer à ${esc(who('entreprise'))}, directement, hors de TEEQA`) : 'Prochaine tranche :'}</span> <span>tranche ${ph.i}</span> <span data-testid="tranche-etape">(étape ${ph.i} : ${esc(String(s.title).split(/\s*[:,(]\s*/)[0])})</span></span></span></div>`;   // vague 23 (jury n° 3) : la tranche dit à quelle étape elle répond
}
function projectCard(p) {
  const r = get().role;
  const pr = progress(p);
  const cur = currentStep(p);
  const acc = access(p, r);
  const accLabel = { envoyee: 'Invitation reçue', revoquee: 'Accès révoqué', expiree: 'Accès expiré', non_creee: 'Non invité', none: 'Non invité' }[acc];
  const target = acc === 'ok' || r === 'client' || p.status === 'clos' && r !== 'controleur' ? `#/c/${p.id}` : `#/invite/${p.id}/${r}`;
  // Photo de couverture : la plus récente de l'étape en cours, sinon celle de l'étape précédente.
  const ci = Math.max(0, p.steps.indexOf(cur));
  const withPhoto = [...p.steps.slice(0, ci + 1)].reverse().find(x => x.photos.length);
  const last = withPhoto && withPhoto.photos[withPhoto.photos.length - 1];
  const cover = last ? (last.dataUrl ? `<img src="${last.dataUrl}" alt="">` : photoSVG(last.sim.step, last.sim.variant)) : null;
  const label = enGarantie(p) ? 'En garantie · réception définitive à prononcer' : p.status === 'clos' ? 'Chantier clôturé · rapport archivé' : STATUS[statusKey(cur, p)].label;
  return `<button class="project-card" data-pid="${p.id}" data-go="${target}">
    <div class="pc-art ${cover ? 'has-photo' : ''}">${cover || `<div style="width:230px;margin-bottom:-14px">${houseSVG(pr.done, { crane: p.status !== 'clos', dark: true })}</div>`}
      <span class="pc-shade" aria-hidden="true"></span>
      <span class="pc-pct" aria-label="Étape ${p.status === 'clos' ? pr.total : p.steps.indexOf(currentStep(p)) + 1} sur ${pr.total}"><b>${p.status === 'clos' ? pr.total : p.steps.indexOf(currentStep(p)) + 1}</b><small>/${pr.total}</small></span>
      <span class="pc-place">${esc(p.city)}${p.region ? ' · ' + esc(p.region) : ''}</span>
      ${p.id === 'villa-demo' && get().session.exemple && get().account ? `<span class="chip saffron pc-chip" data-testid="chip-exemple">Exemple</span>` : enGarantie(p) ? `<span class="chip success pc-chip" data-testid="chip-garantie">${icon('shield', 'xs')}En garantie</span>` : p.status === 'clos' ? `<span class="chip pc-chip">${icon('archive', 'xs')}Clôturé</span>` : accLabel ? `<span class="chip saffron pc-chip">${accLabel}</span>` : ''}
    </div>
    <div class="pc-body">
      <div class="pc-name">${esc(p.name)}</div>
      <div class="pc-step">${p.status === 'clos' ? '' : `Étape ${ci + 1} sur ${p.steps.length} · ${esc(cur.title)}${p.finPrevue && conventionOk(p) ? `<span> · </span><span>fin prévue</span> <span data-notr>${fmtDate(p.finPrevue)}</span>` : ''}`}</div>
      <div class="row" style="gap:10px"><div class="progress grow" aria-hidden="true"><i style="width:${pr.pct}%"></i></div><span class="mono" style="font-size:12px" data-testid="avancement">${pr.done} étape${pr.done > 1 ? 's' : ''} close${pr.done > 1 ? 's' : ''} sur ${pr.total}${pr.declared ? ` · dont ${pr.declared} sans visite` : ''}${p.status === 'clos' || get().role === 'controleur' ? '' : tranchesTxt(p).map(x => `<span> · </span><span>${x}</span>`).join('')}</span></div>
      ${prochaineTranche(p, r)}
      <div class="pc-action"><span class="pc-state">${icon(enGarantie(p) ? 'shield' : p.status === 'clos' ? 'archive' : STATUS[statusKey(cur, p)].icon, 'sm')}${label}</span><span class="pc-go">Ouvrir${icon('chevron', 'xs')}</span></div>
    </div></button>`;
}

// Grand titre iOS : il défile avec le contenu ; le petit titre de la barre n'apparaît qu'une fois le grand passé dessous.
const bigBar = (title, right = '') => appbar({ title, right: right || '<span class="spacer"></span>' }).replace('<header class="appbar', '<header class="appbar collapsing');
const bigTitle = (title, extra = '') => `<div class="large-head"><h2 class="large-title" aria-hidden="true">${title}</h2>${extra}</div>`;
function collapseTitle(el) {
  const sc = el.querySelector('.scroll'), bar = el.querySelector('.appbar.collapsing'), big = el.querySelector('.large-title');
  if (!sc || !bar || !big) return;
  const f = () => { const y = sc.scrollTop, t = Math.max(0, Math.min(1, (y - (big.offsetHeight - 16)) / 14)); bar.style.setProperty('--t', t.toFixed(3)); bar.classList.toggle('scrolled', y > 6); };
  sc.addEventListener('scroll', f, { passive: true }); f();
}

// Tirer pour actualiser : le contenu descend avec le doigt (moitié de la course), l'étoile tourne, puis tout se repose au ressort.
function pullToRefresh(el, onRefresh) {
  const sc = el.querySelector('.scroll'), ct = sc && sc.querySelector('.content'), ind = el.querySelector('.ptr');
  if (!ct || !ind) return;
  let y0 = null, d = 0, busy = false, stop = () => {};
  const set = (v) => { d = v; ct.style.transform = v ? `translate3d(0,${v}px,0)` : ''; ind.style.opacity = String(Math.min(1, v / 46)); ind.style.transform = `translate3d(-50%,${Math.min(v, 60) - 34}px,0) rotate(${Math.round(v * 4)}deg)`; };
  const begin = (y) => { if (!busy && sc.scrollTop <= 0) y0 = y; };
  const move = (y, e) => {
    if (y0 === null) return;
    const dy = y - y0;
    if (dy <= 6 || sc.scrollTop > 0) { if (d) set(0); return; }
    if (e.cancelable) e.preventDefault();
    stop(); set(Math.min(108, (dy - 6) * 0.5));
  };
  const end = () => {
    if (y0 === null) return; y0 = null;
    if (!d) return;
    // le clic qui suit un tirage ne doit rien ouvrir
    const kill = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    sc.addEventListener('click', kill, { capture: true, once: true }); setTimeout(() => sc.removeEventListener('click', kill, { capture: true }), 0);
    if (d < 60) { stop = spring({ from: d, to: 0, onUpdate: set }); return; }
    busy = true; navigator.vibrate && navigator.vibrate(8); ind.classList.add('spin');
    stop = spring({ from: d, to: 54, onUpdate: set });
    setTimeout(() => { ind.classList.remove('spin'); onRefresh(); stop(); stop = spring({ from: d, to: 0, onUpdate: set, onDone: () => { busy = false; } }); setTimeout(() => { busy = false; }, 700); }, 850);
  };
  sc.addEventListener('touchstart', (e) => begin(e.touches[0].clientY), { passive: true });
  sc.addEventListener('touchmove', (e) => move(e.touches[0].clientY, e), { passive: false });
  sc.addEventListener('touchend', end); sc.addEventListener('touchcancel', end);
  sc.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button === 0) begin(e.clientY); });
  sc.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') move(e.clientY, e); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => sc.addEventListener(t, (e) => { if (e.pointerType === 'mouse') end(); }));
}

// Appui long (ou clic droit) sur une carte de chantier : menu d'actions posé près de la carte.
function closeMenu() { const m = document.querySelector('#app > .ctx-wrap'); if (m) m.remove(); }
function projectMenu(p, card) {
  closeMenu();
  const r = get().role, acc = access(p, r), inside = acc === 'ok' || r === 'client' || (p.status === 'clos' && r !== 'controleur');
  const cur = currentStep(p);
  const items = inside ? [
    ['Ouvrir le chantier', 'chevron', `#/c/${p.id}`],
    p.status !== 'clos' ? [`Étape en cours`, 'flag', `#/c/${p.id}/step/${cur.id}`] : null,
    ['Invitations et accès', 'users', `#/c/${p.id}/share`],
    ['Rapport', 'file', `#/c/${p.id}/report`],
    r === 'client' && p.status !== 'clos' && p.steps.every(x => ['validee', 'corrigee', 'vue'].includes(x.status)) ? ['Clôturer', 'archive', `#/c/${p.id}/close`] : null,
  ].filter(Boolean) : [["Voir l'invitation", 'link', `#/invite/${p.id}/${r}`]];
  const app = document.getElementById('app'), a = app.getBoundingClientRect(), c = card.getBoundingClientRect(), k = a.width / app.offsetWidth || 1;
  const wrap = document.createElement('div'); wrap.className = 'ctx-wrap';
  wrap.innerHTML = `<div class="ctx-scrim"></div><div class="ctx-menu" role="menu" aria-label="${esc(p.name)}"><div class="ctx-head">${esc(p.name)}</div>${items.map(([l, ic, to]) => `<button role="menuitem" data-to="${to}"><span>${l}</span>${icon(ic, 'sm')}</button>`).join('')}</div>`;
  app.appendChild(wrap);
  const menu = wrap.querySelector('.ctx-menu'), H = app.offsetHeight, mh = menu.offsetHeight;
  const below = (c.bottom - a.top) / k + 8, above = (c.top - a.top) / k - mh - 8;
  const top = below + mh < H - 96 ? below : above > 70 ? above : Math.max(70, H - mh - 110);
  menu.style.top = top + 'px'; menu.style.left = Math.max(12, (c.left - a.left) / k) + 'px';
  menu.style.transformOrigin = top === below ? 'top left' : 'bottom left';
  wrap.querySelector('.ctx-scrim').addEventListener('click', closeMenu);
  menu.querySelectorAll('[data-to]').forEach(b => b.addEventListener('click', () => { closeMenu(); go(b.dataset.to); }));
  const first = menu.querySelector('button'); first && first.focus({ preventScroll: true });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}
function cardMenus(el) {
  el.querySelectorAll('.project-card[data-pid]').forEach(card => {
    let timer = 0, fired = false, p0 = null;
    const open = () => { const p = project(card.dataset.pid); if (!p) return; fired = true; navigator.vibrate && navigator.vibrate(8); sfx('pop'); projectMenu(p, card); };
    card.addEventListener('pointerdown', (e) => { fired = false; p0 = [e.clientX, e.clientY]; clearTimeout(timer); timer = setTimeout(open, 480); });
    card.addEventListener('pointermove', (e) => { if (p0 && Math.hypot(e.clientX - p0[0], e.clientY - p0[1]) > 8) clearTimeout(timer); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => card.addEventListener(t, () => clearTimeout(timer)));
    card.addEventListener('click', (e) => { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); clearTimeout(timer); open(); });
  });
}

// Balayer une ligne vers la gauche : une action (ici « Lu ») se découvre dessous ; au-delà de 72 px elle s'applique.
function swipeRows(el, onDone) {
  el.querySelectorAll('.swipe-row[data-swipe]').forEach(row => {
    const face = row.querySelector('.list-item'); let g = null, x = 0, stop = () => {};
    const set = (v) => { x = v; face.style.transform = v ? `translate3d(${v}px,0,0)` : ''; row.classList.toggle('armed', v <= -72); };
    face.addEventListener('pointerdown', (e) => { if (e.button === 0) g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false }; });
    face.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id) return;
      const d = e.clientX - g.x0;
      if (!g.on) { if (Math.abs(e.clientY - g.y0) > 10 && Math.abs(d) < 6) { g = null; return; } if (d > -6) return; g.on = true; stop(); try { face.setPointerCapture(e.pointerId); } catch {} }
      e.preventDefault(); set(Math.max(-132, Math.min(0, d)));
    });
    const end = (e) => {
      if (!g || e.pointerId !== g.id) return; const was = g; g = null; if (!was.on) return;
      const kill = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      face.addEventListener('click', kill, { capture: true, once: true }); setTimeout(() => face.removeEventListener('click', kill, { capture: true }), 0);
      const armed = x <= -72;
      stop = spring({ from: x, to: 0, onUpdate: set, onDone: () => { if (armed) onDone(row.dataset.swipe); } });
    };
    face.addEventListener('pointerup', end); face.addEventListener('pointercancel', end);
  });
}
let notifFilter = 'all';
// Problème 12 : une nouvelle ne s'affiche que si elle concerne un chantier visible par ce rôle (ou une invitation à son adresse).
const pidOf = (route) => { const m = /^#\/(?:c|invite)\/([^/]+)/.exec(route || ''); return m ? m[1] : null; };
function myNotifs(r) {
  const inv = new Set(invitationsFor(r).map(p => p.id));
  return get().notifications.filter(n => { if (!n.roles.includes(r)) return false; const id = pidOf(n.route); if (!id) return true; const p = project(id); return !p || forMe(p, r) || inv.has(id); });
}

// Problème 22 : réglage des notifications (dans l'appli, SMS, WhatsApp), gardé dans prefs.notif.
const NOTIF_CHANNELS = [['app', "Dans l'appli", 'bell'], ['sms', 'SMS', 'message'], ['whatsapp', 'WhatsApp', 'message']];
const notifPrefs = () => ({ app: true, sms: true, whatsapp: true, ...((get().prefs || {}).notif || {}) });
const notifSummary = () => { const n = notifPrefs(), on = NOTIF_CHANNELS.filter(([k]) => n[k]).map(([, l]) => l); return on.length ? on.join(', ') : 'Toutes coupées'; };
function notifSheet() {
  const n = notifPrefs();
  openSheet(`<h2>Notifications</h2>
    <p class="muted small" style="margin-bottom:12px">Les alertes WhatsApp et SMS partent pour les étapes clés : ferraillage prêt ou fin déclarée, visite réservée, avis signé, paiement. Elles marchent avec peu de réseau ; le détail reste dans l'appli.</p>
    <div class="list">${NOTIF_CHANNELS.map(([k, l, ic]) => `<div class="list-item"><span class="ico-tile">${icon(ic)}</span><span class="grow t">${l}</span>
      <button class="toggle" role="switch" aria-checked="${!!n[k]}" aria-label="${l}" data-notif="${k}"></button></div>`).join('')}</div>
    <button class="btn block" style="margin-top:14px" data-act="sheet-close">Terminé</button>`, { label: 'Notifications', onMount(w) {
    w.querySelectorAll('[data-notif]').forEach(b => b.addEventListener('click', () => {
      const cur = notifPrefs(), k = b.dataset.notif; cur[k] = !cur[k]; b.setAttribute('aria-checked', String(cur[k]));
      actions.pref({ notif: cur }); sfx('pop');
    }));
  } });
}

// Vague 20 (doigt : Omar) : une seule ligne sous la ville ; le détail du réseau reste dans « Invitations et accès ».
const agenceCourt = (city) => { const a = agenceFor(city); if (!a) return 'Indiquez la ville : l’agence de contrôle de la zone s’affiche ici.'; return a.horsZone ? `${esc(String(city).trim())} : agence la plus proche désignée par TEEQA ; visite sous 6 jours.` : `Agence de contrôle : <b>${esc(a.agence.split(' · ')[0])}</b> · visite sous 4 jours.`; };
const STEP_DRAFT = () => { const d = get().drafts.newProject || { name: '', city: '', email: '', stage: 1 }; if (!Array.isArray(d.steps)) d.steps = [...TEMPLATE_STEPS]; if (!d.stage) d.stage = 1; return d; };

export const routes = [
  {
    name: 'home', pattern: /^\/home$/,
    render() {
      const st = get();
      const r = st.role;
      // Problème 12 : chacun ne voit que ses chantiers ; l'entreprise voit à part les invitations en attente.
      const list = st.projects.filter(p => forMe(p, r));
      const invits = invitationsFor(r);
      const actifs = list.filter(p => p.status !== 'clos'), garantie = list.filter(enGarantie), clos = list.filter(archive);
      // Sous les cartes : les deux dernières nouvelles du rôle, pour que l'accueil dise aussi « ce qui vient de se passer »
      // (accueil de Revolut : le solde, puis les dernières opérations). L'onglet Activité garde la liste complète.
      const news = myNotifs(r).slice(0, 2);
      return {
        html: `${demobar()}
        ${bigBar(r === 'controleur' ? 'Mes missions' : 'Mes chantiers', (r === 'entreprise' || r === 'controleur') && list.length ? `<button class="btn sm ghost new-lbl" data-go="#/agenda" data-testid="agenda-btn" aria-label="Mon calendrier : tous mes chantiers">${icon('calendar', 'sm')}Calendrier</button>` : r === 'client' && list.length ? `<button class="btn sm ghost new-lbl" data-go="#/new" data-testid="nouveau-lbl" aria-label="Créer un nouveau chantier">${icon('plus', 'sm')}Nouveau</button>` : '')}
        <div class="ptr" aria-hidden="true">${khatam(30, { spin: false })}</div>
        <div class="scroll"><div class="content stack" style="gap:16px">
          ${bigTitle(r === 'controleur' ? 'Mes missions' : 'Mes chantiers', list.length || invits.length ? `<p class="large-sub" id="home-sync">${actifs.length ? `${actifs.length} ${r === 'controleur' ? 'mission' : 'chantier'}${actifs.length > 1 ? 's' : ''} en cours` : r === 'controleur' ? 'Aucune mission en cours' : 'Aucun chantier en cours'}${garantie.length ? ` · ${garantie.length} en garantie` : ''}${clos.length ? ` · ${clos.length} archivé${clos.length > 1 ? 's' : ''}` : ''}${invits.length ? ` · ${invits.length} invitation${invits.length > 1 ? 's' : ''}` : ''}</p>` : '')}
          ${invits.length ? `<div class="section-title" style="margin-bottom:0"><span class="over">Invitations</span></div>
            <div class="list">${invits.map(p => `<button class="list-item" data-go="#/invite/${p.id}/${r === 'controleur' ? 'controleur' : 'entreprise'}">
              <span class="ico-tile saffron">${icon('link')}</span>
              <span class="grow"><span class="t" style="font-weight:700">${esc(p.name)}</span><div class="s">${esc(p.city)} · ${r === 'controleur' ? 'mission confiée par TEEQA · à ouvrir' : 'invitation reçue · à accepter ou refuser'}</div></span>
              ${icon('chevron', 'sm')}</button>`).join('')}</div>` : ''}
          ${list.length === 0 && !invits.length ? `
            <div class="empty">
              ${bellarej('attend', 168, { cls: 'floaty' })}
              <h2 class="h1">Aucun chantier, <span class="kw">pour l'instant</span>.</h2>
              <p class="muted">${r === 'client' ? 'Créez votre premier chantier, décrivez ses étapes et invitez votre entreprise.' : r === 'entreprise' ? "Vous verrez ici les chantiers auxquels un client vous a invité." : "Ouvrez le lien temporaire envoyé par le client pour accéder à un chantier."}</p>
              ${r === 'client' ? `<div class="stack empty-cta" style="gap:10px;width:100%"><button class="btn block" data-act="exemple" data-testid="voir-exemple">${icon('eye', 'sm')}Voir un exemple</button><p class="meta" style="margin:-4px 0 4px">Un vrai chantier en cours, à parcourir sans rien casser.</p><button class="btn saffron block" data-go="#/new">${icon('plus', 'sm')}Créer un chantier</button></div>` : SALLE ? `<p class="meta">Le chantier apparaîtra ici tout seul dès que le client vous invitera.</p>` : `<button class="btn ghost" data-act="role-sheet">Changer de vue</button>`}
            </div>` : ''}
          ${/* Vague 23 (doigt : Zineb, zoom 150 %) : « Écouter » tout en haut, avant la carte, et il lit aussi le prochain paiement et la dernière nouvelle. */''}${get().role === 'client' && actifs.length ? `<button class="btn block listen-top" data-lact="listen" data-scope=".project-card .pc-name, .project-card .pc-step, .project-card .pc-state, .project-card .pc-tranche, .home-news .list-item:first-child .t" data-testid="listen-home">${icon('speaker', 'sm')}Écouter où en est mon chantier</button>` : ''}
          ${actifs.map(projectCard).join('')}
          ${r === 'client' && st.session.exemple && st.account && list.some(p => p.id === 'villa-demo') ? `<button class="btn text block" data-act="exemple-off" data-testid="exemple-off">Retirer le chantier d'exemple</button>` : ''}
          ${garantie.length ? `<div class="section-title" data-testid="section-garantie"><span class="over">En garantie</span></div>${garantie.map(projectCard).join('')}` : ''}
          ${clos.length ? `<div class="section-title"><span class="over">Archivés</span></div>${clos.map(projectCard).join('')}` : ''}
          ${list.length && news.length ? `<div class="section-title" style="margin-bottom:0"><span class="over">Dernières nouvelles</span><button class="btn text" data-go="#/notifications">Tout voir</button></div>
            <div class="list home-news">${news.map(n => `<button class="list-item ${n.read[r] ? '' : 'unread'}" data-go="${n.route}">
              <span class="ico-tile ${n.read[r] ? '' : 'saffron'}">${icon(/avis/.test(n.text) ? 'pen' : /photo/.test(n.text) ? 'camera' : 'bell')}</span>
              <span class="grow"><span class="t" style="font-weight:${n.read[r] ? 500 : 700}">${esc(n.text)}</span><div class="s mono">${nowMs() - new Date(n.at).getTime() < 86400000 ? fmtRel(n.at) : `${fmtDate(n.at)}, ${fmtTime(n.at)}`}</div></span>
              ${n.read[r] ? '' : '<span class="unread-dot" aria-label="Non lu"></span>'}</button>`).join('')}</div>` : ''}
          ${r === 'entreprise' && actifs.length ? (() => { let att = 0, rec = 0; for (const p of actifs) { const b = budgetOf(p); if (!b) continue; for (const l of b.lignes) { if (l.recu) rec += l.dh; else if (l.paye) att += l.dh; else { rec += l.partielRecu; att += l.partiel - l.partielRecu; } } } const tot = actifs.reduce((a, p) => a + ((budgetOf(p) || {}).total || 0), 0), seq = actifs.reduce((a, p) => a + ((budgetOf(p) || {}).seq || 0), 0);   // vague 22 (jury n° 6) : le même « Reste à verser » qu'au Budget
            return tot ? `<div class="card stack" style="gap:4px" data-testid="a-encaisser"><span class="over">Tous mes chantiers</span><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="meta">Reçu</span><b>${rec ? dh(rec) : 'rien'}</b></div><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="meta">Indiqué payé, à confirmer</span><b>${att ? dh(att) : 'rien'}</b></div>${seq ? `<div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="meta">Sur le compte de séquestre</span><b>${dh(seq)}</b></div>` : ''}<div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="meta">Reste à verser</span><b data-testid="reste-ent">${dh(tot - rec - att - seq)}</b></div></div>` : ''; })() : ''}
          ${r === 'client' ? piloteCard(true, false) : ''}
          ${r !== 'controleur' ? `<button class="list-item card" data-go="#/garanties" data-testid="home-garanties"><span class="ico-tile success">${icon('shield')}</span><span class="grow"><span class="t">Nos garanties écrites</span><div class="s">Ce que TEEQA garantit, ce qu'il ne garantit pas, plafonds et assurances</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
          ${r === 'client' && project(CLOS_ID) ? `<button class="list-item card" data-go="#/c/${CLOS_ID}/report" data-testid="home-exemple"><span class="ico-tile success">${icon('file')}</span><span class="grow"><span class="t">Voir un chantier mené jusqu'à la réception</span><div class="s">Villa Les Orangers, Berkane : 7 étapes closes, réception, avis de sa cliente</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
        </div></div>
        ${tabbar('home')}`,
        on: {
          exemple() { actions.session({ exemple: true }); sfx('pop'); go('#/c/villa-demo'); },
          'exemple-off'() { actions.session({ exemple: false }); toast('Exemple retiré', 'check'); go('#/home', { replace: true }); },
        },
        mount(el) {
          collapseTitle(el); cardMenus(el);
          pullToRefresh(el, () => { actions.checkDelays(); sfx('notif'); toast('À jour', 'check'); go('#/home', { replace: true }); });
        },
      };
    },
  },
  {
    name: 'new', pattern: /^\/new$/,
    render() {
      const r = get().role;
      if (r !== 'client') return { html: `${appbar({ title: 'Nouveau chantier', back: '#/home' })}<div class="content"><div class="notice saffron">${icon('lock', 'sm')}<span>Seul le client crée un chantier.${SALLE ? '' : ' Passez en vue Client par un appui long sur l\'onglet Profil.'}</span></div></div>` };
      const d = STEP_DRAFT();
      const type = d.type && SITE_TYPES[d.type] && !SITE_TYPES[d.type].v2 ? d.type : 'neuf';
      const formule = d.formule === 'suivi' ? 'suivi' : 'controle', kNow = draftVisits(d);
      const valid1 = d.name.trim().length > 1 && d.city.trim().length > 1;
      const valid2 = d.steps.filter(s => s.trim()).length >= 2;
      // Vague 20 (doigt : Omar) : le contact de l'entreprise est facultatif (e-mail ou téléphone) ; on peut l'inviter plus tard.
      const validMail = !d.email.trim() || /.+@.+\..+/.test(d.email) || d.email.replace(/\D/g, '').length >= 9;
      const kb = (n) => n > 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`;
      // Étape 1 (M02) : où et quel chantier.
      const stage1 = `
        <div class="content stack" style="gap:18px">
          <div><div class="over">Étape 1 sur 3</div><h2 class="h1" style="margin-top:4px">Décrire le chantier</h2></div>
          <div class="field"><label for="f-name">Nom du chantier</label><input id="f-name" class="input" data-input="field" data-k="name" value="${esc(d.name)}" placeholder="Ex. Maison familiale" autocomplete="off"></div>
          <div class="field"><label for="f-city">Ville</label><input id="f-city" class="input" data-input="field" data-k="city" value="${esc(d.city)}" placeholder="Ex. Nador" autocomplete="off" list="villes-teeqa"><datalist id="villes-teeqa">${VILLES.map(v => `<option value="${esc(v)}">`).join('')}</datalist>
            <p class="meta" data-testid="agence-ville" aria-live="polite">${agenceCourt(d.city)}</p></div>
          <div class="field"><label for="f-addr">Adresse ou quartier <span class="meta">(facultatif)</span></label><input id="f-addr" class="input" data-input="field" data-k="address" value="${esc(d.address || '')}" placeholder="Ex. Lotissement Al Matar, lot 14" autocomplete="off"></div>
          <div class="field"><label for="f-owner">Propriétaire du terrain <span class="meta">(si ce n’est pas vous)</span></label><input id="f-owner" class="input" data-input="field" data-k="proprietaire" value="${esc(d.proprietaire || '')}" placeholder="Ex. Mohamed, mon père" autocomplete="off" data-testid="proprietaire"></div>
          <div class="field"><label id="lbl-type">Type de chantier</label>
            <div class="list" role="radiogroup" aria-labelledby="lbl-type" data-testid="types">${Object.entries(SITE_TYPES).filter(([, t]) => !t.v2).map(([k, t]) => `
              <button class="list-item" role="radio" aria-checked="${type === k}" data-act="type" data-t="${k}" data-testid="type-${k}"><span class="ico-tile ${type === k ? 'success' : ''}">${icon(type === k ? 'check' : 'building')}</span><span class="grow"><span class="t">${t.label}</span></span></button>`).join('')}</div>
            ${d.type && SITE_TYPES[type].avant ? `<div class="card stack" style="gap:6px" data-testid="avant-chantier"><span class="over"><b>Avant le chantier</b> · à réunir</span><ul class="losange">${SITE_TYPES[type].avant.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${SITE_TYPES[type].delais ? `<p class="meta" style="margin:0" data-testid="delais-metier">${esc(d.city && agenceFor(d.city) ? SITE_TYPES[type].delais.replace(/ \(4 jours dans une ville desservie, 6 jours hors zone\)/, agenceFor(d.city).horsZone ? ' : 6 jours ici (hors zone)' : ' : 4 jours ici') : SITE_TYPES[type].delais)}</p>` : ''}${type === 'metier' ? `<div class="chips" role="radiogroup" aria-label="Votre métier" data-testid="metiers">${Object.entries(METIERS).map(([k, m]) => `<button class="chip ${d.metier === k ? 'dark' : 'outline'}" role="radio" aria-checked="${d.metier === k}" data-act="metier" data-m="${k}" data-testid="metier-${k}">${esc(m.label)}</button>`).join('')}</div><p class="meta" style="margin:0" data-testid="metier-note">${d.metier ? `${esc(METIERS[d.metier].label)} : ${METIERS[d.metier].steps.length} étapes propres à ce métier, sans point d’arrêt béton.` : 'Choisissez le métier : les étapes suivent (aucune attente de béton).'}</p>` : ''}<p class="meta" style="margin:0">À cocher par vous. TEEQA ne vérifie ni le titre ni le permis ; il suit les travaux.${type === 'reprise' ? ' Une fois le chantier créé, l’état des lieux de reprise date ce qui a été payé et constaté ; TEEQA ne tranche pas entre l’ancienne entreprise et vous.' : ''}</p></div>` : ''}
            <p class="meta">Le type propose les étapes à l'écran suivant ; vous pourrez les modifier.</p></div>
        </div>`;
      // Étape 2 (M02) : le devis est joint, les étapes sont proposées puis ajustées.
      const stageQ = `
        <div class="content stack" style="gap:18px">
          <div><div class="over">Étape 2 sur 3</div><h2 class="h1" style="margin-top:4px">Le devis et les étapes</h2></div>
          <div class="card stack" style="gap:10px">
            <div class="row"><span class="ico-tile ${d.quote ? 'success' : ''}">${icon('file')}</span><div class="grow"><b>${d.quote ? esc(d.quote.name) : 'Devis de l\'entreprise'}</b><div class="meta">${d.quote ? `Joint · ${kb(d.quote.size)}` : 'PDF ou photo, facultatif'}</div></div>
              ${d.quote ? `<button class="btn sm ghost" data-act="quote-off">Retirer</button>` : `<label class="btn sm" for="f-quote" style="cursor:pointer">Joindre</label>`}</div>
            <input id="f-quote" type="file" accept="application/pdf,image/*" data-input="quote" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" tabindex="-1" aria-label="Joindre le devis">
            <p class="meta">Le devis est gardé avec le chantier, visible par vous et par l'entreprise. TEEQA ne vérifie pas son contenu et ne le montre pas au contrôleur. Les étapes ci-dessous viennent du type de chantier choisi ; les montants des tranches (Budget) sont recopiés du devis, puis confirmés par l'entreprise.</p>
          </div>
          <div class="section-title" style="margin:6px 0 0"><span class="over">Étapes proposées (${d.steps.length})</span><button class="btn text" data-act="add-step">${icon('plus', 'sm')}Ajouter</button></div>
          <div class="stack" style="gap:8px">${d.steps.map((s, i) => `
            <div class="step-edit"><span class="num">${i + 1}</span>
              <input aria-label="Étape ${i + 1}" data-input="step" data-i="${i}" value="${esc(s)}">
              <button class="icon-btn" data-act="up" data-i="${i}" aria-label="Monter l'étape ${i + 1}" ${i === 0 ? 'disabled' : ''}>${icon('chevronDown', 'sm').replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
              <button class="icon-btn" data-act="del" data-i="${i}" aria-label="Supprimer l'étape ${i + 1}" ${d.steps.length <= 2 ? 'disabled' : ''}>${icon('close', 'sm')}</button>
            </div>`).join('')}</div>
          <button class="btn text" data-act="reset-steps" style="justify-self:start">${icon('refresh', 'sm')}Reprendre les étapes proposées : ${esc(SITE_TYPES[type].short || SITE_TYPES[type].label)}</button>
          <p class="meta">Calez ces étapes sur les tranches de paiement de votre devis. L'entreprise les confirmera en acceptant l'invitation. Elles s'ouvrent l'une après l'autre.</p>
        </div>`;
      const stage2 = `
        <div class="content stack" style="gap:18px">
          <div><div class="over">Étape 3 sur 3</div><h2 class="h1" style="margin-top:4px">Inviter l'entreprise</h2>
            <p class="muted" style="margin-top:6px">L'entreprise dispose d'un vrai compte TEEQA. Elle déclarera le début et la fin de chaque étape.</p></div>
          ${d.proName ? `<div class="notice">${icon('building', 'sm')}<span><b>${esc(d.proName)}</b> sera invité sur ce chantier. Pour inviter une autre entreprise, changez l'e-mail.</span></div>` : ''}
          <div class="field"><label for="f-mail">Téléphone ou e-mail de l'entreprise <span class="meta">(facultatif)</span></label><input id="f-mail" class="input" type="text" inputmode="email" data-input="field" data-k="email" value="${esc(d.email)}" placeholder="+212 6 … ou contact@entreprise.ma" autocomplete="off"><p class="meta" data-testid="inviter-plus-tard">Pas encore d'entreprise ? Laissez vide : vous l'inviterez plus tard par WhatsApp ou par un lien.</p></div>
          <div class="card stack" style="gap:10px">
            <div class="row"><span class="ico-tile">${icon('building')}</span><div class="grow"><b>${esc(d.name || 'Nouveau chantier')}</b><div class="meta">${esc([d.address, d.city].filter(Boolean).join(', '))} · ${SITE_TYPES[type].label} · ${d.steps.length} étapes</div><div class="meta">${d.quote ? `Devis joint : ${esc(d.quote.name)}` : 'Sans devis joint'}</div></div></div>
            <div class="chips">${(() => { const idx = controlledIndexes(d.steps.length, kNow); return d.steps.slice(0, 8).map((s, i) => `<span class="chip ${idx.has(i) ? 'success' : 'outline'}">${idx.has(i) ? icon('shield', 'xs') : ''}${i + 1}. ${esc(s.length > 22 ? s.slice(0, 21) + '…' : s)}</span>`).join(''); })()}</div>
            <p class="meta">${kNow ? `${icon('shield', 'xs')} = étape avec visite de contrôle. Les autres sont déclarées par l'entreprise avec ses photos et consultées par vous, sans vérification sur place.` : "Formule Suivi : aucune étape n'a de visite. L'entreprise déclare chaque étape avec ses photos ; rien n'est vérifié sur place."}</p>
          </div>
          <div class="field"><label id="lbl-formule">Formule</label>
            <div class="seg" role="radiogroup" aria-labelledby="lbl-formule">${Object.entries(FORMULES).map(([f, v]) => `
              <button class="seg-opt" role="radio" aria-checked="${formule === f}" aria-pressed="${formule === f}" data-act="formule" data-f="${f}">${icon(f === 'controle' ? 'shield' : 'eye')}<span style="font-size:14px;font-weight:800">${v.label}</span><span class="meta" style="font-size:12px">${f === 'controle' ? `dès ${forfait(TARIFS.controle.visites, { eur: false })}` : forfait(0, { eur: false })}</span></button>`).join('')}</div>
            <p class="meta">${FORMULES[formule].text}</p></div>
          ${formule === 'controle' ? `<div class="field"><label id="lbl-ctrl">Visites de contrôle</label>
            <div class="seg" role="radiogroup" aria-labelledby="lbl-ctrl">${CONTROL_CHOICES(d.steps.length).map(([c, l]) => `
              <button class="seg-opt" role="radio" aria-checked="${kNow === c}" aria-pressed="${kNow === c}" data-act="controls" data-c="${c}"><b class="mono" style="font-size:18px">${c}</b><span style="font-size:12px;font-weight:600">${l}</span></button>`).join('')}</div>
            <p class="meta">Les étapes clés (fondations, murs et poteaux, dalle, finitions) ont toujours une visite : on ne peut plus les voir une fois recouvertes. Vous pouvez en ajouter d'autres. Le forfait dépend de ce choix : <b data-testid="forfait-choix">${forfait(kNow)}</b> pour ${kNow} visites (au-delà de ${TARIFS.controle.visites}, ${tarif('visite')} par visite ajoutée).</p></div>`
          : `<div class="notice saffron">${icon('alert', 'sm')}<span><b>Aucune vérification sur place.</b> Personne ne passe sur le chantier : vous suivez les déclarations et les photos de l'entreprise, sans avis de contrôle. Vous pourrez passer en Suivi contrôlé avant le début des travaux.</span></div>`}
          <div class="field" data-testid="alertes-creation"><label id="lbl-al">Alertes sur votre téléphone</label>
            <div class="list" role="group" aria-labelledby="lbl-al">${NOTIF_CHANNELS.filter(([k]) => k !== 'app').map(([k, l, ic]) => `<div class="list-item"><span class="ico-tile">${icon(ic)}</span><span class="grow"><span class="t">${l}</span><div class="s">Ferraillage prêt, visite, avis signé, paiement</div></span><button class="toggle" role="switch" aria-checked="${!!notifPrefs()[k]}" aria-label="Alertes ${l}" data-act="alerte" data-k="${k}"></button></div>`).join('')}</div>
            <p class="meta">Utile si vous êtes loin du chantier ou avec peu de réseau. Modifiable ensuite dans Profil › Réglages.</p></div>
          ${fold('Séquestre bancaire, facultatif', `${SEQUESTRE.banque} garde chaque tranche jusqu’à son versement`, `<button class="list-item" role="switch" aria-checked="${!!d.sequestre}" data-act="seq-new" data-testid="seq-new" style="text-align:left"><span class="ico-tile ${d.sequestre ? 'success' : ''}">${icon('shield')}</span><span class="grow"><span class="t">${d.sequestre ? 'Séquestre choisi' : 'Choisir le séquestre'}</span><div class="s">L'entreprise l'accepte avec la convention. Sans séquestre : virement, espèces contre reçu ou chèque, comme d'habitude.</div></span></button><p class="meta" style="margin:0">${esc(REGLES.sequestre)}</p><p class="meta" style="margin:0">${esc(sequestreFraisTxt())}</p>`, 'seq-creation')}
          <div class="notice">${icon('info', 'sm')}<span>En acceptant l'invitation, l'entreprise confirme ces étapes. Le contrôleur est missionné par TEEQA${formule === 'controle' ? ` : ${agenceLine(d.city)}` : '.'} Il entre par un lien, sans compte, valable jusqu'à la réception des travaux, et reste anonyme pour l'entreprise.</span></div>
        </div>`;
      return {
        html: `${appbar({ title: 'Nouveau chantier', back: '#/home', close: true, sep: true })}
          <div class="scroll">${d.stage === 3 ? stage2 : d.stage === 2 ? stageQ : stage1}</div>
          <div class="footer-cta">
            ${d.stage === 3
              ? `<button class="btn saffron block" data-act="create" ${validMail ? '' : 'disabled'}>${d.email.trim() ? "Créer et envoyer l'invitation" : 'Créer le chantier'}</button><button class="btn ghost block" data-act="stage" data-s="2">Modifier les étapes</button>`
              : d.stage === 2 ? `<button class="btn block" data-act="stage" data-s="3" ${valid2 ? '' : 'disabled'}>Continuer</button><button class="btn ghost block" data-act="stage" data-s="1">Retour</button>`
              : `<button class="btn block" data-act="stage" data-s="2" ${valid1 ? '' : 'disabled'}>Continuer</button>`}
          </div>`,
        on: {
          field(t) { const d = STEP_DRAFT(); d[t.dataset.k] = t.value; actions.setDraft('newProject', d); syncBtn(t);
            if (t.dataset.k === 'city') { const el = t.closest('.screen').querySelector('[data-testid="agence-ville"]'); if (el) el.innerHTML = agenceCourt(t.value); } },
          step(t) { const d = STEP_DRAFT(); d.steps[+t.dataset.i] = t.value; actions.setDraft('newProject', d); syncBtn(t); },
          'add-step'() { const d = STEP_DRAFT(); d.steps.push(''); actions.setDraft('newProject', d); go('#/new', { replace: true }); setTimeout(() => { const ins = document.querySelectorAll('.step-edit input'); ins[ins.length - 1]?.focus(); }, 60); },
          del(b) { const d = STEP_DRAFT(); d.steps.splice(+b.dataset.i, 1); actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          up(b) { const d = STEP_DRAFT(); const i = +b.dataset.i; [d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]]; actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          metier(b) { const d = STEP_DRAFT(); d.metier = b.dataset.m; d.steps = [...METIERS[d.metier].steps]; actions.setDraft('newProject', d); sfx('choix'); go('#/new', { replace: true }); },
          type(b) { const d = STEP_DRAFT(); const was = d.type || 'neuf'; d.type = b.dataset.t;
            // les étapes suivent le type tant que le client ne les a pas retouchées
            if (JSON.stringify(d.steps) === JSON.stringify(typeSteps(was))) d.steps = typeSteps(d.type);
            actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          quote(t) { const f = t.files && t.files[0]; if (!f) return; const d = STEP_DRAFT(); d.quote = { name: f.name, size: f.size }; actions.setDraft('newProject', d); sfx('papier'); go('#/new', { replace: true }); },
          'quote-off'() { const d = STEP_DRAFT(); d.quote = null; actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          'reset-steps'() { const d = STEP_DRAFT(); d.steps = typeSteps(d.type || 'neuf'); actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          alerte(b) { const cur = notifPrefs(), k = b.dataset.k; cur[k] = !cur[k]; b.setAttribute('aria-checked', String(cur[k])); actions.pref({ notif: cur }); sfx('pop'); },
          controls(b) { const d = STEP_DRAFT(); d.controls = +b.dataset.c; actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          'seq-new'() { const d = STEP_DRAFT(); d.sequestre = !d.sequestre; actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          formule(b) { const d = STEP_DRAFT(); d.formule = b.dataset.f === 'suivi' ? 'suivi' : 'controle'; actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          stage(b) { const d = STEP_DRAFT(); d.stage = +b.dataset.s; d.steps = d.steps.map(s => s.trim()).filter(Boolean); actions.setDraft('newProject', d); go('#/new', { replace: true }); },
          create() {
            const d = STEP_DRAFT();
            // M06 : avant de créer, un récapitulatif dit ce qui sera contrôlé et sépare le forfait TEEQA du paiement des travaux.
            const k = draftVisits(d), idx = controlledIndexes(d.steps.length, k);
            openSheet(`<h2>Récapitulatif</h2>
              <p class="muted" style="margin-bottom:10px">${k ? `Suivi contrôlé : ${k} visite${k > 1 ? 's' : ''} de contrôle sur ${d.steps.length} étapes.` : `Suivi : ${d.steps.length} étapes, aucune visite de contrôle.`}</p>
              <div class="chips" style="margin-bottom:12px">${d.steps.map((x, i) => `<span class="chip ${idx.has(i) ? 'success' : 'outline'}">${idx.has(i) ? icon('shield', 'xs') : ''}${i + 1}. ${esc(x.length > 20 ? x.slice(0, 19) + '…' : x)}</span>`).join('')}</div>
              <div class="price-big" data-testid="recap-prix"><span class="meta">Le forfait TEEQA</span><b>${forfait(k, { eur: false })}</b><span class="meta">Le paiement des travaux se fait hors de TEEQA, tranche par tranche, à l’entreprise.</span></div>
              ${fold('Ce que comprend le forfait', 'Paiement, remboursement, convention', forfaitCards(k), 'recap-detail')}
              <div class="stack" style="margin-top:14px"><button class="btn saffron block" data-recap-ok>${d.email.trim() ? "Confirmer et envoyer l'invitation" : 'Confirmer et créer'}</button><button class="btn ghost block" data-act="sheet-close">Modifier</button></div>`,
              { label: 'Récapitulatif', onMount: (el) => el.querySelector('[data-recap-ok]').addEventListener('click', () => { closeSheet(true); finish(); }) });
            function finish() {
            const id = actions.createProject({ name: d.name.trim(), city: d.city.trim(), steps: d.steps, email: d.email.trim(), controls: k, prep: { type: d.type && SITE_TYPES[d.type] && !SITE_TYPES[d.type].v2 ? d.type : 'neuf', address: (d.address || '').trim(), proprietaire: (d.proprietaire || '').trim().slice(0, 80), quote: d.quote || null } });
            if (d.sequestre) actions.choisirSequestre(id);   // 20 nov. : séquestre choisi à la création, accepté par l'entreprise avec la convention
            go('#/home', { replace: true });
            openSheet(`<div style="display:grid;justify-items:center;text-align:center;gap:10px;padding:6px 0 4px">
                ${bellarej('vol', 104, { cls: 'pop-in' })}
                <h2>${d.email.trim() ? 'Invitation envoyée' : 'Chantier créé'}</h2><p class="muted">${d.email.trim() ? "L'entreprise verra l'invitation à son prochain passage." : 'Invitez votre entreprise depuis le chantier : WhatsApp, SMS ou lien.'}</p>
                <button class="btn block" data-go="#/c/${id}" style="margin-top:8px">Voir le chantier</button></div>`, { label: d.email.trim() ? 'Invitation envoyée' : 'Chantier créé' });
            }
          },
        },
      };
      function syncBtn(t) {
        const d = STEP_DRAFT();
        const ok = d.stage === 3 ? (!d.email.trim() || /.+@.+\..+/.test(d.email) || d.email.replace(/\D/g, '').length >= 9) : d.stage === 2 ? d.steps.filter(s => s.trim()).length >= 2 : d.name.trim().length > 1 && d.city.trim().length > 1;
        const b = t.closest('.screen').querySelector('.footer-cta .btn'); if (b) b.disabled = !ok;
      }
    },
  },
  {
    name: 'notifications', pattern: /^\/notifications$/,
    render() {
      const r = get().role;
      const all = myNotifs(r);
      const nUnread = all.filter(n => !n.read[r]).length;
      const kind = (n) => /contest|conteste/.test(n.text) ? 'flag' : /avis/.test(n.text) ? 'pen' : /Invitation|invitation|accès/.test(n.text) ? 'link' : /correction/.test(n.text) ? 'image' : /photo/.test(n.text) ? 'camera' : 'bell';
      const filters = [['all', 'Tout'], ['unread', `Non lus${nUnread ? ` · ${nUnread}` : ''}`], ['avis', 'Avis']];
      if (notifFilter === 'unread' && !nUnread) notifFilter = 'all';
      const list = all.filter(n => notifFilter === 'unread' ? !n.read[r] : notifFilter === 'avis' ? /avis/.test(n.text) : true);
      return {
        html: `${demobar()}${bigBar('Activité', nUnread ? `<button class="btn text" data-act="all" data-testid="tout-marquer">Tout marquer lu</button>` : '')}
        <div class="scroll"><div class="content">
          ${bigTitle('Activité', nUnread ? `<span class="lt-count" aria-label="${nUnread} non lus">${nUnread}</span>` : '')}
          ${all.length ? `<div class="chips filters" role="radiogroup" aria-label="Filtrer l'activité">${filters.map(([k, l]) => `<button class="chip" role="radio" aria-checked="${notifFilter === k}" data-act="filter" data-k="${k}">${l}</button>`).join('')}</div>` : ''}
          ${/* Vague 23 (doigt : Ilyas) : le geste se montre (la 1re ligne non lue glisse un peu), la phrase passe au-dessus de la liste. */''}${nUnread ? `<p class="meta swipe-hint" data-testid="swipe-hint">${icon('back', 'xs')}Glissez une ligne vers la gauche pour la marquer comme lue, ou touchez « Tout marquer lu ».</p>${r === 'client' ? `<button class="btn block" data-lact="listen" data-scope=".list-item.unread [data-nid]" data-testid="ecouter-tout" style="margin:6px 0 4px">${icon('speaker', 'sm')}Écouter tout (${nUnread} nouvelle${nUnread > 1 ? 's' : ''})</button>` : ''}` : ''}
          ${list.length ? `${dayGroups(list).map(([lab, it]) => `<div class="day-head">${lab}</div><div class="list" data-stagger>${it.map(n => `
            ${/* Vague 26 (doigt : Mimouna) : « Écouter » en haut de chaque nouvelle, gros, avant le texte */''}${r === 'client' ? `<button class="btn sm ghost notif-listen" style="min-height:44px;justify-self:start" data-lact="listen" data-scope="[data-nid='${n.id}']" data-nid-ecoute="${n.id}" data-testid="notif-ecouter">${icon('speaker', 'sm')}Écouter</button>` : ''}
            <div class="swipe-row" ${n.read[r] ? '' : `data-swipe="${n.id}"`}><span class="swipe-under" aria-hidden="true">${icon('check', 'sm')}Marquer lu</span>
            <button class="list-item ${n.read[r] ? '' : 'unread'}" data-act="open" data-id="${n.id}" data-route="${n.route}">
              <span class="ico-tile ${n.read[r] ? '' : 'saffron'}">${icon(kind(n))}</span>
              <span class="grow"><span class="t" data-nid="${n.id}" style="font-weight:${n.read[r] ? 500 : 700}">${esc(n.text)}</span><div class="s mono">${nowMs() - new Date(n.at).getTime() < 86400000 ? fmtRel(n.at) : `${fmtDate(n.at)}, ${fmtTime(n.at)}`}</div></span>
              ${n.read[r] ? '' : '<span class="unread-dot" role="img" aria-label="Non lu"></span>'}
            </button></div>`).join('')}</div>`).join('')}
`
          : all.length ? `<div class="empty" style="padding-top:28px"><p class="muted">Rien dans ce filtre.</p></div>`
          : `<div class="empty" style="padding-top:34px">${bellarej('posee', 150, { cls: 'floaty' })}<h2 class="h2">Rien de nouveau</h2><p class="muted">Les déclarations, avis et échanges apparaîtront ici.</p></div>`}
        </div></div>${tabbar('notifs')}`,
        on: {
          all() { actions.markAllRead(r); recompense('Tout est lu. Bravo !'); },
          open(b) { actions.readNotif(b.dataset.id, r); go(b.dataset.route); },
          filter(b) { notifFilter = b.dataset.k; go('#/notifications', { replace: true }); },
        },
        mount(el) { collapseTitle(el); swipeRows(el, (id) => { sfx('pop'); actions.readNotif(id, r); });
          // Vague 26 (doigt : Mimouna) : une nouvelle écoutée jusqu'au bout compte comme lue ; « Écouter tout » marque tout lu à la fin.
          // le bouton « Écouter » est pris par le lecteur (langues.js arrête la propagation du clic) : on écoute le clic avant lui, sur la fenêtre.
          const onTap = (b, f) => { const h = (e) => { if (!b.isConnected) { window.removeEventListener('click', h, true); return; } if (e.target.closest && e.target.closest('button') === b && !b.classList.contains('playing')) f(); }; window.addEventListener('click', h, true); };
          const duree = (t) => Math.max(4, Math.round(String(t || '').split(/\s+/).length / 2.4)) * 1000 + 600;
          el.querySelectorAll('[data-nid-ecoute]').forEach((b) => onTap(b, () => { const id = b.dataset.nidEcoute, t = (el.querySelector(`[data-nid='${id}']`) || {}).textContent; setTimeout(() => { if (location.hash.startsWith('#/notifications')) actions.readNotif(id, r); }, duree(t)); }));
          const tout = el.querySelector('[data-testid="ecouter-tout"]'); if (tout) onTap(tout, () => { const t = [...el.querySelectorAll('.list-item.unread [data-nid]')].map((x) => x.textContent).join(' '); setTimeout(() => { if (location.hash.startsWith('#/notifications')) actions.markAllRead(r); }, duree(t)); }); },
      };
    },
  },
  {
    name: 'uploads', pattern: /^\/uploads$/,
    render() {
      const st = get();
      const ups = st.uploads;
      // Problème 17 : les actions faites hors ligne (avis, déclarations…) attendent aussi dans state.outbox.
      const outbox = st.outbox || [];
      const pending = ups.filter(u => u.status !== 'synchronisee');
      const failed = ups.filter(u => u.status === 'echec').length;
      const label = { en_attente: 'En attente', envoi: 'Envoi…', synchronisee: 'Envoyée', echec: "L'envoi n'a pas abouti", hors_ligne: 'En attente du réseau' };
      const pct = ups.length ? Math.round(ups.reduce((n, u) => n + (u.status === 'synchronisee' ? 100 : u.progress || 0), 0) / ups.length) : 100;
      const head = !ups.length ? (outbox.length ? [`${outbox.length} action${outbox.length > 1 ? 's' : ''} en attente du réseau`, "Rien n'est perdu : elles partiront au retour de la connexion."] : ['Aucun envoi en cours', 'Vos photos partent dès que vous les prenez.'])
        : !pending.length ? ['Tout est envoyé', `${ups.length} photo${ups.length > 1 ? 's' : ''} synchronisée${ups.length > 1 ? 's' : ''}.`]
        : st.net.offline ? [`${pending.length} photo${pending.length > 1 ? 's' : ''} gardée${pending.length > 1 ? 's' : ''} sur l'appareil`, "Rien n'est perdu : l'envoi reprendra tout seul."]
        : [`${ups.length - pending.length} sur ${ups.length} envoyée${ups.length - pending.length > 1 ? 's' : ''}`, failed ? `${failed} envoi${failed > 1 ? 's' : ''} à relancer.` : "L'envoi continue, même si vous changez d'écran."];
      return {
        html: `${bigBar('Envois', ups.some(u => u.status === 'synchronisee') ? `<button class="btn text" data-act="clear">Nettoyer</button>` : '')}
        <div class="scroll"><div class="content stack">
          ${bigTitle('Envois')}
          ${st.net.offline ? `<div class="offline-banner" role="status">${icon('wifiOff', 'sm')}<span><b>Hors ligne.</b> Vos photos sont gardées et partiront dès le retour du réseau.</span></div>` : ''}
          <div class="card up-head">
            <span class="up-ring big ${!pending.length ? 'done' : ''}" style="--p:${pct}">${!pending.length ? icon('check') : st.net.offline ? icon('wifiOff') : `<b>${pct}</b>`}</span>
            <div class="grow"><b class="up-head-t">${head[0]}</b><div class="meta">${head[1]}</div></div>
          </div>
          ${(() => { const r = st.role, p = r === 'controleur' ? null : st.projects.find(x => x.status !== 'clos' && access(x, r) === 'ok'); const c = p && currentStep(p);   // vague 21 (doigt : Abdelali) : prendre une photo d'ici
            return r === 'entreprise' && c ? `<button class="btn saffron block" data-go="#/c/${p.id}/step/${c.id}/client" data-testid="envois-photo">${icon('camera', 'sm')}Prendre une photo pour ${esc(who('client'))}</button>` : ''; })()}
          ${outbox.length ? `<div class="section-title" style="margin-bottom:0"><span class="over">Actions en attente du réseau · partiront au retour de la connexion</span></div>
            <div class="list">${outbox.map(n => `<div class="list-item"><span class="ico-tile">${icon('wifiOff')}</span>
              <span class="grow"><span class="t">${esc(n.text)}</span><div class="s mono">${n.at ? (nowMs() - new Date(n.at).getTime() < 86400000 ? fmtRel(n.at) : `${fmtDate(n.at)}, ${fmtTime(n.at)}`) : ''}</div></span></div>`).join('')}</div>` : ''}
          ${ups.length ? `<div class="stack" data-stagger style="gap:8px">${ups.map(u => {
            const p = project(u.pid), s = p && step(p, u.sid), ph = s && s.photos.find(x => x.id === u.photoId);
            if (!ph) return '';
            return `<div class="upl" data-upload="${u.status}">
              <div class="uthumb">${ph.dataUrl ? `<img src="${ph.dataUrl}" alt="" style="width:100%;height:100%;object-fit:cover">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction })}</div>
              <div class="grow"><div style="font-weight:700;font-size:14.5px">${esc(s.title)}</div>
                <div class="meta">${ph.correction ? `Correction v${ph.version} · ` : ''}${label[u.status]}</div>
                ${u.status === 'synchronisee' ? '' : `<div class="bar ${u.status === 'echec' ? 'fail' : ''}"><i style="width:${u.progress}%"></i></div>`}
                ${u.status === 'echec' ? `<button class="btn sm ghost" style="margin-top:10px" data-act="retry" data-id="${u.id}">${icon('refresh', 'xs')}Réessayer</button>` : ''}</div>
              ${u.status === 'synchronisee' ? `<span style="color:var(--success-ink)">${icon('checkCircle')}</span>` : ''}
            </div>`;
          }).join('')}</div>` : `<div class="empty" style="padding-top:18px">${bellarej('posee', 132, { cls: 'floaty' })}<p class="muted">Les photos prises sur le chantier apparaîtront ici le temps de leur envoi.</p></div>`}
        </div></div>${tabbar('uploads')}`,
        on: {
          retry(b) { actions.retryUpload(b.dataset.id); toast('Nouvel essai lancé', 'refresh'); },
          clear() { actions.clearSynced(); },
        },
        mount(el) { collapseTitle(el); },
      };
    },
  },
  {
    name: 'profile', pattern: /^\/profile$/,
    render() {
      const r = get().role;
      const ctrl = r === 'controleur';
      const row = (attrs, ico, t, s, tile = '') => `<button class="list-item" ${attrs}><span class="ico-tile ${tile}">${icon(ico)}</span><span class="grow">${s ? `<span class="t">${t}</span><div class="s">${s}</div>` : `<span class="t">${t}</span>`}</span>${icon('chevron', 'sm chev')}</button>`;
      // Panel du 19 nov. : tout ce qui sert à présenter l'appli (changer de vue, hors ligne, échec d'envoi, chantier exemple,
      // installation) est rangé dans une seule section repliée, en bas. Les boutons gardent leurs data-act (tests).
      const tools = `<details class="more" data-testid="presentation-tools"><summary>${icon('chevronDown', 'sm')}<span><b>Outils de présentation</b><small>Changer de vue, hors ligne, chantier exemple</small></span></summary><div class="more-in stack" style="gap:10px">
            ${SALLE ? `<div class="notice">${icon('users', 'sm')}<span>Salle partagée : ce téléphone est le ${ROLES[r].label.toLowerCase()}. Les autres rôles sont sur les autres téléphones, et tout se met à jour en direct.</span></div>` : `
            <div class="over">Changer de vue</div>
            <div class="list" role="radiogroup" aria-label="Changer de vue">${Object.entries(ROLES).map(([k, v]) => `
              <button class="list-item" role="radio" aria-checked="${k === r}" data-act="set-role" data-role="${k}" data-testid="role-${k}">
                ${roleAvatar(k, 36, k)}
                <span class="grow"><span class="t">${v.label}</span><div class="s">${esc(v.name)} · ${v.where}</div></span>
                <span class="radio-mark" aria-hidden="true">${k === r ? icon('check', 'sm') : ''}</span>
              </button>`).join('')}</div>
            <p class="meta">Raccourci : appui long sur l'onglet Profil.</p>`}
            <div class="list"><div class="list-item"><span class="ico-tile">${icon('wifiOff')}</span><span class="grow"><span class="t">Mode hors ligne</span><div class="s">Les photos restent en file sur l'appareil</div></span>
              <button class="toggle" role="switch" aria-checked="${!!get().net.offline}" aria-label="Mode hors ligne" data-act="offline"></button></div>
              <div class="list-item"><span class="ico-tile">${icon('alert')}</span><span class="grow"><span class="t">Faire échouer le prochain envoi</span><div class="s">Pour montrer « Réessayer »</div></span>
              <button class="toggle" role="switch" aria-checked="${!!get().net.failNext}" aria-label="Faire échouer le prochain envoi" data-act="fail"></button></div></div>
            <div class="list">
              ${row('data-act="install"', 'plus', "Installer sur l'écran d'accueil", 'Ouvrir TEEQA en plein écran')}
              <button class="list-item" data-act="reset"><span class="ico-tile saffron">${icon('refresh')}</span><span class="grow"><span class="t">Réinitialiser</span><div class="s">Revenir au chantier exemple</div></span></button>
            </div>
          </div></details>`;
      return {
        html: `${demobar()}${bigBar('Profil')}
        <div class="scroll"><div class="content stack" style="gap:18px">
          ${bigTitle('Profil')}
          <div class="zellige-band" aria-hidden="true"></div>
          <div class="row profile-head">${roleAvatar(r, 72)}
            <div><div class="h2">${esc(ROLES[r].name)}</div><div class="meta">${ROLES[r].label} · ${ctrl ? 'accès par lien, jusqu’à la réception des travaux, puis lecture du rapport archivé : vos avis et les étapes, sans les paiements' : 'compte TEEQA'}</div></div></div>
          ${ctrl ? `<div class="notice">${icon('link', 'sm')}<span>Vous entrez par le lien de mission envoyé par TEEQA, sans compte ni mot de passe. <b data-testid="un-code">Un seul code :</b> 6 chiffres reçus par SMS au numéro enregistré par votre agence ; il ouvre le lien et confirme chaque avis que vous signez (sans réseau, le même code vient de l’appli d’authentification). Téléphone perdu : l’agence coupe le lien et vous en envoie un nouveau. L'entreprise ne voit ni votre nom ni votre numéro : elle lit « Contrôleur TEEQA » et le nom de votre agence.</span></div>` : ''}
          <div class="list">
            ${r === 'entreprise' ? row('data-go="#/pro"', 'building', 'Ma fiche professionnelle', 'Présentation, justificatifs, référencement', 'saffron') : ''}
            <button class="list-item" data-lact="lang-sheet" data-testid="lang-row"><span class="ico-tile">${icon('globe')}</span><span class="grow"><span class="t">Langue · اللغة · Tutlayt</span><div class="s" data-notr>${langName(langOf(r))}</div></span>${icon('chevron', 'sm chev')}</button>
            <div class="list-item"><span class="ico-tile">${icon('eye')}</span><span class="grow"><span class="t">Mode simple</span><div class="s" data-testid="simple-etat"><b>${simpleOn() ? 'Activé' : 'Arrêté'}</b> · l'essentiel et une seule action par étape.</div></span>
              <button class="toggle" role="switch" aria-checked="${simpleOn()}" aria-label="Mode simple" data-act="simple" data-testid="simple-toggle"></button></div>
            <div class="list-item" data-testid="tout-ecouter-row"><span class="ico-tile">${icon('speaker')}</span><span class="grow"><span class="t">Tout écouter</span><div class="s"><b>${get().prefs.toutEcouter ? 'Activé' : 'Arrêté'}</b> · chaque écran est lu à voix haute dès qu’il s’ouvre, pour qui lit peu.</div></span>
              <button class="toggle" role="switch" aria-checked="${!!get().prefs.toutEcouter}" aria-label="Tout écouter" data-act="tout-ecouter" data-testid="tout-ecouter"></button></div>
            ${ctrl ? `<button class="list-item" data-go="#/releve" data-testid="releve-row"><span class="ico-tile saffron">${icon('wallet')}</span><span class="grow"><span class="t">Relevé de rémunération</span><div class="s">Vos actes signés et votre part, versée par votre agence</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
            ${r !== 'controleur' ? `<button class="list-item" data-go="#/parrainer" data-testid="parrainer-row"><span class="ico-tile">${icon('users')}</span><span class="grow"><span class="t">Parrainer un autre chantier</span><div class="s">${r === 'client' ? 'Une visite offerte par chantier parrainé' : 'Une contre-visite offerte par chantier parrainé'}</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
            <button class="list-item" data-act="humain" data-testid="humain-row"><span class="ico-tile success">${icon('phone')}</span><span class="grow"><span class="t">Parler à quelqu'un</span><div class="s">WhatsApp ou téléphone : ${esc(SUPPORT.langues)}</div></span>${icon('chevron', 'sm chev')}</button>
            ${r === 'client' ? `<button class="list-item" data-act="pays" data-testid="pays-row"><span class="ico-tile">${icon('globe')}</span><span class="grow"><span class="t">Pays où je vis</span><div class="s">${pays() === 'MA' ? 'Au Maroc · dirhams et heure du Maroc' : `${esc(PAYS[pays()].nom)} · montants aussi en ${PAYS[pays()].devise === 'eur' ? 'euros' : esc(PAYS[pays()].devise.toUpperCase())}, créneaux aussi à l’heure ${esc(PAYS[pays()].de === 'de France' ? 'de France' : PAYS[pays()].de)} (${esc(villeClient())})`}</div></span>${icon('chevron', 'sm chev')}</button>${get().prefs.pourParents ? `<div class="list-item" data-testid="pour-parents"><span class="ico-tile">${icon('users')}</span><span class="grow"><span class="t">Je gère pour mes parents</span><div class="s">Invitez-les dans Invitations et accès : en lecture seule, ou co-décideurs ; « Écouter » leur lit l’essentiel.</div></span></div>` : ''}` : ''}
            ${ctrl ? '' : row('data-go="#/garanties" data-testid="profile-garanties"', 'shield', 'Nos garanties écrites', 'Ce qui est garanti, plafonds, assurances')}
            ${row('data-go="#/settings"', 'settings', 'Paramètres')}
            ${row('data-go="#/help"', 'help', 'Aide', ctrl ? '' : 'Questions et lexique')}
            ${row('data-act="report-issue"', 'alert', 'Signaler un problème', "Prévenir TEEQA d'un abus ou d'une fraude")}
            ${ctrl ? '' : `<button class="list-item" data-go="#/reports" data-testid="my-reports"><span class="ico-tile">${icon('flag')}</span><span class="grow"><span class="t">Mes signalements</span><div class="s">${(() => { const n = (get().reports || []).filter(g => g.role === get().role), o = n.filter(g => (g.status || 'recu') !== 'clos').length; return n.length ? `${n.length} envoyé${n.length > 1 ? 's' : ''}${o ? ` · ${o} en cours` : ''}` : 'Aucun pour l\'instant'; })()}</div></span>${icon('chevron', 'sm chev')}</button>`}
            ${row('data-go="#/privacy"', 'shield', 'Confidentialité')}
          </div>
          ${ctrl ? '' : `<div class="list">
            <button class="list-item danger" data-act="logout"><span class="ico-tile danger">${icon('logout')}</span><span class="grow t">Se déconnecter</span></button>
          </div>`}
          ${presenter() ? tools : ''}
          <p class="meta">TEEQA · version 2</p>
        </div></div>${tabbar('profile')}`,
        on: {
          reset() { confirmSheet({ title: 'Tout réinitialiser ?', body: SALLE ? 'Le chantier d\'exemple repart de zéro sur tous les téléphones de la salle.' : 'Toutes les actions effectuées dans ce navigateur seront effacées.', confirm: 'Réinitialiser', danger: true, onConfirm: () => { if (SALLE) salleRecommencer(); else reset(); toast('Données réinitialisées', 'refresh'); go('#/home', { replace: true }); } }); },
          logout() { actions.session({ loggedIn: false }); go('#/login', { replace: true }); },
          offline() { const on = !get().net.offline; actions.setNet({ offline: on }); toast(on ? 'Mode hors ligne' : get().uploads.some(u => u.status !== 'synchronisee') ? 'Connexion rétablie · envoi en cours' : 'Connexion rétablie', on ? 'wifiOff' : 'check'); },
          fail() { actions.setNet({ failNext: !get().net.failNext }); },
          'tout-ecouter'() { const on = !get().prefs.toutEcouter; actions.pref({ toutEcouter: on }); toast(on ? 'Tout écouter : chaque écran sera lu à voix haute' : 'Tout écouter arrêté', 'speaker'); },
          simple() { const on = !simpleOn(); actions.pref({ simple: on }); toast(on ? 'Mode simple : gros texte, une action' : 'Mode simple arrêté', 'eye'); },
          humain() { humainSheet(); },
          // Vague 11 : un seul réglage, le pays où vit le client : il décide de la devise et de l'heure montrées à côté.
          pays() { const cur = pays(); openSheet(`<h2>Où vivez-vous ?</h2><p class="muted small" style="margin-bottom:10px">Au Maroc, tout est en dirhams et à l'heure du Maroc. Ailleurs, TEEQA ajoute la devise et l'heure de votre pays.</p><div class="list" role="radiogroup">${Object.entries(PAYS).map(([k, v]) => `<button class="list-item" role="radio" aria-checked="${k === cur}" data-k="${k}"><span class="grow t">${esc(v.nom)}</span><span class="radio-mark">${k === cur ? '✓' : ''}</span></button>`).join('')}</div>`, { label: 'Pays', onMount(sh) { sh.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { actions.pref({ pays: b.dataset.k }); closeSheet(); go('#/profile', { replace: true }); })); } }); },
        },
        mount(el) { collapseTitle(el); },
      };
    },
  },
  {
    name: 'settings', pattern: /^\/settings$/,
    render() {
      const st = get();
      // Panel du 19 nov. : pour le client et le contrôleur, la vue principale garde l'essentiel (notifications, animations,
      // vibrations) ; sons, widgets, projection et vue détaillée passent dans « Outils de présentation », replié.
      const fold = st.role !== 'entreprise';
      const extra = `
            <div class="list-item"><span class="ico-tile">${icon('eye')}</span><span class="grow"><span class="t">Vue détaillée</span><div class="s">Côté client : avis complet, photos et historique toujours ouverts. Sinon, l'écran s'arrête au résumé « En clair »</div></span>
              <button class="toggle" role="switch" aria-checked="${!!st.prefs.detail}" aria-label="Vue détaillée" data-act="detail"></button></div>
            <div class="list-item"><span class="ico-tile">${icon('bell')}</span><span class="grow"><span class="t">Sons</span><div class="s">Touchers, envois, avis signé, étape validée</div></span>
              <button class="toggle" role="switch" aria-checked="${st.prefs.sound !== false}" aria-label="Sons" data-act="sound"></button></div>
            <a class="list-item" href="sons.html" style="text-decoration:none;color:inherit"><span class="ico-tile">${icon('settings')}</span><span class="grow"><span class="t">Écouter et choisir les sons</span><div class="s">Trois versions de chaque son</div></span>${icon('chevron', 'sm chev')}</a>
            <a class="list-item" href="widget-iphone.html" style="text-decoration:none;color:inherit"><span class="ico-tile saffron">${icon('bell')}</span><span class="grow"><span class="t">Widgets sur cet iPhone</span><span class="s">Écran d'accueil et écran verrouillé, avec Scriptable</span></span>${icon('chevron', 'sm chev')}</a>
            <a class="list-item" href="appstore.html" style="text-decoration:none;color:inherit"><span class="ico-tile">${icon('share')}</span><span class="grow"><span class="t">Projection : la fiche de l'appli</span><span class="s">À quoi ressemblerait TEEQA une fois publiée</span></span>${icon('chevron', 'sm chev')}</a>
            <a class="list-item" href="widgets.html" style="text-decoration:none;color:inherit"><span class="ico-tile saffron">${icon('bell')}</span><span class="grow"><span class="t">Activité en direct et Dynamic Island</span><div class="s">Aperçu : îlot, écran verrouillé, widget</div></span>${icon('chevron', 'sm chev')}</a>`;
      return {
        html: `${appbar({ title: 'Paramètres', back: '#/profile' })}
        <div class="scroll"><div class="content stack">
          <div class="list">
            <button class="list-item" data-lact="lang-sheet" data-testid="lang-row-settings"><span class="ico-tile">${icon('globe')}</span><span class="grow"><span class="t">Langue</span><div class="s" data-notr>${langName(langOf(st.role))} · les messages des autres arrivent traduits</div></span>${icon('chevron', 'sm chev')}</button>
            <button class="list-item" data-act="notif"><span class="ico-tile">${icon('bell')}</span><span class="grow"><span class="t">Notifications et alertes</span><div class="s">${notifSummary()} · WhatsApp et SMS pour les étapes clés : alertes et liens seulement, sans photo ni avis ; ces messages passent hors du Maroc</div></span>${icon('chevron', 'sm chev')}</button>
            <div class="list-item"><span class="ico-tile">${icon('pause')}</span><span class="grow"><span class="t">Réduire les animations</span><div class="s">Suit aussi le réglage du système</div></span>
              <button class="toggle" role="switch" aria-checked="${!!st.prefs.reduceMotion}" aria-label="Réduire les animations" data-act="motion"></button></div>
            <div class="list-item"><span class="ico-tile">${icon('bell')}</span><span class="grow"><span class="t">Vibrations</span><div class="s">Légères, sur les gestes qui comptent</div></span>
              <button class="toggle" role="switch" aria-checked="${vibOn()}" aria-label="Vibrations" data-act="vib"></button></div>
            ${fold ? '' : extra}
          </div>
          ${fold && presenter() ? `<details class="more" data-testid="presentation-tools"><summary>${icon('chevronDown', 'sm')}<span><b>Outils de présentation</b><small>Sons, widgets, fiche de l'appli, vue détaillée</small></span></summary><div class="more-in"><div class="list">${extra}</div></div></details>` : ''}
        </div></div>`,
        on: { notif() { notifSheet(); }, motion() { actions.pref({ reduceMotion: !get().prefs.reduceMotion }); }, detail() { actions.pref({ detail: !get().prefs.detail }); }, sound() { const on = get().prefs.sound === false; actions.pref({ sound: on }); if (on) sfx('valide'); },
          vib(b) { const on = !vibOn(); try { localStorage.setItem('teeqa-vibrations', JSON.stringify(on)); } catch { /* stockage indisponible */ } b.setAttribute('aria-checked', on); import('../vie.js').then((m) => m.refreshHaptics()); if (on) navigator.vibrate && navigator.vibrate([10, 50, 14]); } },
      };
    },
  },
  {
    // M11 : suivi des signalements envoyés à TEEQA. Chaque rôle ne voit que les siens. Le traitement n'existe pas dans la
    // maquette : un bouton « Suivi du traitement » le fait avancer, pour montrer les états.
    name: 'reports', pattern: /^\/reports$/,
    render() {
      const r = get().role, list = (get().reports || []).filter(g => g.role === r);
      const stOf = (g) => g.status || 'recu', where = (g) => { const p = g.pid && project(g.pid), s = p && g.sid && step(p, g.sid); return p ? `${esc(p.name)}${s ? ' · ' + esc(s.title) : ''}` : 'Depuis le profil'; };
      const track = (g) => { const cur = stOf(g), i = REPORT_FLOW.indexOf(cur);
        return `<ol class="rp-track" aria-label="Avancement du traitement">${REPORT_FLOW.map((k, n) => { const h = (g.hist || []).find(x => x.status === k);
          return `<li class="${cur !== 'en_attente' && n <= i ? 'done' : ''} ${n === i ? 'cur' : ''}"><i></i><b>${REPORT_STATES[k].label}</b><span class="meta">${h ? fmtFull(h.at) : cur === 'en_attente' && n === 0 ? 'au retour du réseau' : 'à venir'}</span></li>`; }).join('')}</ol>`; };
      return {
        html: `${appbar({ title: 'Mes signalements', back: '#/profile' })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          ${list.length ? list.map(g => `<div class="card stack" style="gap:10px" data-report="${g.id}">
            <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="mono" style="font-weight:800">${esc(g.ref || 'SG')}</span><span class="chip ${REPORT_STATES[stOf(g)].chip}">${icon(REPORT_STATES[stOf(g)].icon, 'xs')}${REPORT_STATES[stOf(g)].label}</span></div>
            <div><b>${esc(g.reason)}</b><div class="meta">${where(g)} · envoyé le ${fmtFull(g.at)}</div></div>
            <p class="muted" style="margin:0">« ${esc(g.text)} »</p>
            ${track(g)}
            ${stOf(g) === 'en_attente' ? `<div class="notice saffron">${icon('clock', 'sm')}<span>Écrit hors ligne : il n'est pas encore parti. Il partira tout seul au retour du réseau.</span></div>` : ''}
            ${stOf(g) === 'clos' ? `<div class="notice">${icon('info', 'sm')}<span>TEEQA a clos ce signalement. Il ne tranche pas un désaccord sur les travaux : pour cela, les personnes du chantier décident entre elles.</span></div>` : ''}
            ${['recu', 'examen'].includes(stOf(g)) ? `<div class="demo-box"><span class="over">Suivi du traitement</span><p class="meta" style="margin:0">Faites avancer l'état du signalement.</p><button class="btn sm ghost" data-act="advance" data-id="${g.id}" style="justify-self:start">${stOf(g) === 'recu' ? "Passer à « En cours d'examen »" : 'Passer à « Clos »'}</button></div>` : ''}
          </div>`).join('') : `<div class="empty" style="padding-top:34px">${bellarej('posee', 150, { cls: 'floaty' })}<h2 class="h2">Aucun signalement</h2><p class="muted">Si vous constatez une fraude, une demande d'argent hors cadre ou un comportement grave, prévenez TEEQA.</p></div>`}
          <button class="btn ${list.length ? 'ghost' : ''} block" data-act="report-issue">${icon('flag', 'sm')}Signaler un problème</button>
          <p class="meta">Un signalement n'est lu que par TEEQA : les autres personnes du chantier ne le voient pas. Ce n'est pas une contestation : pour un désaccord sur les travaux, utilisez « Contestation » dans les échanges de l'étape.</p>
        </div></div>`,
        on: { advance(b) { actions.advanceReport(b.dataset.id); toast('État mis à jour', 'check'); go('#/reports', { replace: true }); } },
      };
    },
  },
  { // Vague 8 : relevé de rémunération du contrôleur (ses actes signés, sa part, versée par son agence).
    // Vague 25 (entreprises) : tous mes chantiers sur un calendrier simple, jour par jour.
    name: 'agenda', pattern: /^\/agenda$/,
    render() {
      const rA = get().role; if (!['entreprise', 'controleur'].includes(rA)) return { redirect: '#/home' };
      const L = agendaEntreprise(rA), J = {}; L.forEach(x => { const k = String(x.at).slice(0, 10); (J[k] = J[k] || []).push(x); });
      const jours = Object.keys(J).sort();
      return {
        html: `${appbar({ title: 'Mon calendrier', back: '#/home', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px" data-testid="agenda">
          <p class="meta" style="margin:0">${rA === 'controleur' ? 'Vos visites acceptées, jour par jour, avec la ville. Heure du Maroc.' : `Tous vos chantiers, jour par jour : visites du contrôleur, tranches attendues des étapes commencées, coulages. Heure du Maroc.${(get().projects || []).some(q => (q.formerPros || []).length && q.reprise) ? ' Chantier repris : les tranches dues à l’entreprise sortante n’y sont pas, elles lui reviennent.' : ''}`}</p>
          ${jours.length ? jours.map(k => `<div class="card stack" style="gap:6px" data-testid="agenda-jour"><span class="over"><b>${esc(new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</b></span>${J[k].map(x => `<button class="list-item" style="padding:6px 0" data-go="#/c/${x.p.id}/step/${x.s.id}"><span class="ico-tile ${x.k === 'argent' ? 'success' : x.k === 'coulage' ? 'saffron' : ''}">${icon(x.k === 'argent' ? 'wallet' : x.k === 'coulage' ? 'camera' : 'calendar')}</span><span class="grow"><span class="t">${esc(x.quoi)}</span><div class="s">${esc(x.p.name)} · étape ${x.i}${x.k === 'visite' && x.s.mission && x.s.mission.slot ? ` · ${esc(fmtTime(x.at))}` : ''}</div></span>${icon('chevron', 'sm chev')}</button>`).join('')}</div>`).join('') : `<div class="notice">${icon('calendar', 'sm')}<span>Rien de prévu pour l’instant sur vos chantiers.</span></div>`}
        </div></div>`,
      };
    },
  },
  {
    name: 'releve', pattern: /^\/releve$/,
    render() {
      if (get().role !== 'controleur') return { redirect: '#/profile' };
      const L = releve(), tot = L.reduce((a, x) => a + x.dh + x.depl, 0), R = TARIFS.remuneration;
      return {
        html: `${appbar({ title: 'Relevé de rémunération', back: '#/profile', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div class="card dark stack" style="gap:6px" data-testid="releve-total"><span class="over" style="color:var(--saffron)">Votre part · versée par votre agence</span>
            <div class="h1">${prix(tot, { eur: false })}<span class="kw">.</span></div><div class="meta" style="color:var(--sage-ink)">${L.length} acte${L.length > 1 ? 's' : ''} signé${L.length > 1 ? 's' : ''}, déplacements compris</div></div>
          ${(() => { const M = {}; L.forEach(x => { const d = new Date(x.at), k = d.getFullYear() * 100 + d.getMonth(); (M[k] = M[k] || { d, n: 0, t: 0 }); M[k].n++; M[k].t += x.dh + x.depl; });   // vague 21 (contrôleurs) : le relevé par mois, comme la paie
            const ks = Object.keys(M).sort().reverse(); return ks.length ? `<div class="card stack" style="gap:4px" data-testid="releve-mois"><span class="over"><b>Par mois</b> · versé avec la paie du mois suivant</span>${ks.map(k => `<div class="row" style="justify-content:space-between;gap:10px;min-height:32px"><span>${M[k].d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} · ${M[k].n} acte${M[k].n > 1 ? 's' : ''}</span><b>${prix(M[k].t, { eur: false })}</b></div>`).join('')}</div>` : ''; })()}
          <div class="list" data-testid="releve">${L.length ? L.map(x => `<div class="list-item" style="align-items:flex-start"><span class="ico-tile">${icon('wallet')}</span><span class="grow"><span class="t">${esc(x.acte)} · ${prix(x.dh, { eur: false })}${x.depl ? ` + ${prix(x.depl, { eur: false })} de déplacement` : ''}</span><div class="s">${esc(x.chantier)} · ${esc(x.etape)}</div><div class="meta">${fmtFull(x.at)} (heure du serveur de TEEQA)${x.depl && x.base ? ` · ${esc(x.base)}` : ''} · <span data-testid="releve-paie">versé par votre agence au plus tard le ${fmtDate(new Date(new Date(x.at).getFullYear(), new Date(x.at).getMonth() + 1, 10)).replace(/\.$/, '')}</span>${x.signeHorsReseau ? ` · signé sans réseau à ${fmtFull(x.signeHorsReseau).split(', ').pop()}, envoyé au retour du réseau` : ''}</div></span></div>`).join('') : `<div class="list-item"><span class="grow"><span class="t">Aucun acte signé pour l'instant</span></span></div>`}</div>
          <div class="notice">${icon('calendar', 'sm')}<span data-testid="agence-tarde"><b>Si votre agence tarde :</b> sans votre part le 10 du mois, signalez-le ici (Parler à quelqu’un) ; TEEQA relance l’agence, et après 30 jours vous verse votre part lui-même, retenue sur ce qu’il doit à l’agence. Vous n’êtes jamais payé par le client ni par l’entreprise.</span></div><div class="notice">${icon('calendar', 'sm')}<span><b>Quand vous êtes payé :</b> TEEQA règle votre agence sous 15 jours après chaque avis signé ; l'agence vous verse votre part avec la paie du mois suivant, au plus tard le 10. Barème : visite ${prix(R.visite, { eur: false })}, contre-visite ${prix(R.contreVisite, { eur: false })} (courte : ${prix(R.contreVisiteMineure, { eur: false })}), correction sur photo ${prix(R.correctionPhoto, { eur: false })}, visite impossible du fait du chantier ${prix(R.visiteImpossible, { eur: false })}, déplacement ${prix(R.deplacement, { eur: false })}. Un désistement n'est pas payé.</span></div>
          <p class="meta">Sans compte, mais pas lié à ce téléphone : le relevé est tenu par TEEQA et par votre agence, à partir de vos avis signés ; il réapparaît sur tout nouveau lien de mission, même sur un autre téléphone, et votre agence en reçoit une copie chaque mois. Chaque avis signé vous est aussi envoyé en PDF, à l'adresse donnée à votre agence. Un écart ? Écrivez à votre agence, ou utilisez « Parler à quelqu'un » dans Profil.</p>
        </div></div>`,
      };
    },
  },
  {
    name: 'help', pattern: /^\/help$/,
    render() {
      const qa = [
        ['« Fin déclarée » veut-elle dire « vérifiée » ?', "Non. L'entreprise déclare la fin ; l'étape n'est vérifiée sur place qu'après la visite et l'avis du contrôleur. Une correction envoyée en photo est dite « contrôlée sur photo », jamais « vérifiée »."],
        ['TEEQA peut-il trancher un désaccord ?', "Non. TEEQA conserve les échanges et signale la contestation. Les parties décident entre elles."],
        ['TEEQA détient-il mon argent ?', "Non. Le paiement se fait hors de l'app. « J'ai payé cette tranche » est une indication du client, pas un paiement vérifié par TEEQA."],
        ['Combien coûte TEEQA ?', `Formule Suivi, sans visite : ${forfait(0)} par chantier. Suivi contrôlé, ${TARIFS.controle.visites} visites clés comprises : ${forfait(TARIFS.controle.visites)}. Le calcul est toujours le même : ${prix(TARIFS.suivi.dh, { eur: false })} de suivi + ${tarif('visite')} par visite, comprise ou ajoutée. Contre-visite : ${tarif('contreVisiteMineure', { eur: false })} pour 1 ou 2 points à reprendre, ${tarif('contreVisite', { eur: false })} au-delà, jamais plus qu'une visite. Ces prix paient TEEQA et l'agence de contrôle ; le prix des travaux se règle à part, entre vous et l'entreprise, hors de TEEQA.`],
        ['Puis-je utiliser TEEQA en arabe ou en tamazight ?', "Oui : Profil › Langue. Français, arabe (de droite à gauche), darija, tachelhit, tarifit, tamazight de l'Atlas. Chacun lit les messages des autres dans sa langue, avec le message d'origine juste en dessous. Un vocal en darija ou en tamazight arrive avec sa transcription et une traduction indicative, sans valeur légale."],
        ['Une photo vaut-elle preuve ?', REGLES.preuve + ' ' + REGLES.photos],
        ['Mon compte est-il vérifié ?', "Votre compte est lié à votre numéro de téléphone et à votre e-mail. Chaque geste qui engage (convention, avis, paiement indiqué) se signe à l'écran et reste daté au dossier. TEEQA ne vérifie pas votre identité."],
        ['Un contrôleur peut-il me demander de l’argent ?', REGLES.arnaque + " Quelqu'un vous en demande ? Ne payez pas, et « Signaler à TEEQA » prévient tous les participants du chantier."],
        ['Que vaut le rapport ?', REGLES.preuve + " Le contrôleur signe avec un code à usage unique, son agence cosigne. Devant un juge ou un médiateur, c'est un début de preuve, à appuyer par d'autres pièces. TEEQA ne certifie pas les photos."],
        ['Et si une photo est prise sans réseau ?', "Elle garde l'heure de l'horloge du téléphone. Au retour du réseau, TEEQA la compare à l'heure de son serveur et signale tout écart de plus de 10 minutes. Le contrôleur peut aussi signer son avis sans réseau : il part avec ses photos au retour du réseau, avec son heure de signature."],
        ['Combien de temps attend le béton ?', "Si l'entreprise réserve la visite d'avance (au moins 48 h avant), le contrôleur passe le jour annoncé : le béton n'attend que quelques heures. Sans réservation, la visite a lieu au plus tard 4 jours après la demande (6 hors des villes desservies)."],
        ['Et si le contrôleur est en retard ?', `${REGLES.delaiVisite} La fin prévue se décale d'autant.`],
        ['Je ne suis pas d’accord avec un avis : que faire ?', "Le client comme l'entreprise peut demander un second avis par une autre agence. Il coûte le prix d'une visite, facturé à celui qui le demande seulement s'il confirme le premier avis ; s'il l'annule, ni lui ni la contre-visite ne sont facturés. Le premier avis reste au dossier."],
        ['Une réserve sur les aciers peut-elle se corriger sur photo ?', "Non. Tout ce qui sera caché (aciers, enrobage, recouvrement, et toute réserve avant coulage) se contrôle sur place, par une contre-visite. Seuls les défauts qui restent visibles (finitions) se contrôlent sur photo."],
        ['Que veut dire « clore » une étape sans visite ?', "Que vous avez lu la déclaration de l'entreprise et vu ses photos. Personne n'est venu contrôler : l'étape compte comme « déclarée », et l'avancement la range à part, « sans visite »."],
        ['Quelles villes sont couvertes ?', `Tout le Maroc. ${reseauTxt()}. Chacune est agréée et assurée : ${AGENCES.map(a => `${a.agence.split(' · ')[0]} (${a.region})`).join(', ')}. ${HORS_ZONE} Chaque agence s’engage par contrat avec TEEQA sur un nombre de visites par semaine dans sa région ; au-delà, la visite passe à une agence voisine, sans frais pour vous et dans le même délai.`],
        ['Le second œuvre peut-il avancer pendant qu’une visite est attendue ?', "Non : les étapes se suivent une à une, et l'étape suivante s'ouvre après l'avis (et le coulage pour le béton armé). Les travaux qui ne cachent rien de l'étape en cours peuvent se préparer sur place ; ils se déclarent à leur étape. Des étapes en parallèle viendront plus tard."],
      ];
      // Panel du 19 nov. : un lexique court, en mots simples, pour les mots du chantier que l'appli emploie.
      const lex = [
        ['Tranche', "La part du prix des travaux liée à une étape, nommée « Tranche n · nom de l'étape ». Elle se paie entre vous et l'entreprise, hors de TEEQA."],
        ['Réserves', "Des défauts à corriger, notés par le contrôleur. L'étape n'est pas refusée : l'entreprise corrige, puis la correction est contrôlée."],
        ['Contre-visite', "Une nouvelle visite du contrôleur pour revoir une correction ou une étape refusée. Après un refus, elle est à la charge de l'entreprise, jamais plus que le prix d'une visite ordinaire."],
        ['Point d’arrêt', "Pour le béton armé, le contrôleur voit les aciers avant le coulage. L'entreprise coule ensuite et le déclare avec une photo : le paiement est recommandé à ce moment-là."],
        ['Avenant', "Un changement ajouté après coup aux étapes prévues (une étape en plus, un travail modifié). Le client et l'entreprise l'acceptent tous les deux."],
        ['Réception provisoire', `La fin du chantier : le client signe le procès-verbal, avec ou sans réserves. ${GARANTIE_TXT}`],
        ['Réception définitive', "Elle a lieu quand les réserves du procès-verbal sont levées, au plus tard après un an."],
        ['Récusation', "Demander, avec un motif, un autre contrôleur. Une fois chacun, pour qu'on ne change pas d'agence jusqu'à obtenir l'avis voulu ; jamais pour défaire un avis déjà signé : pour cela, il y a le second avis."],
        ['Point clé', "Un point de structure (aciers, enrobage, recouvrement) qu'on ne verra plus une fois le béton coulé. Le contrôleur le photographie un par un."],
        ['Enrobage', "L'épaisseur de béton qui couvre les aciers et les protège de la rouille : des cales les tiennent écartés du coffrage ou de la terre (5 cm contre la terre, 3 cm hors sol)."],
        ['Étaiement', "Les poteaux provisoires (étais) qui tiennent une dalle ou un mur pendant que le béton durcit ou pendant une démolition."],
        ['Mur mitoyen', "Le mur partagé avec un voisin ou collé à sa maison. Photographiez-le daté avant les travaux : c'est un début de preuve s'il se fissure."],
        ['Séquestre', "Facultatif : vous versez chaque tranche sur un compte de séquestre à votre nom chez Banque Saphir, qui la verse à l'entreprise. TEEQA ne touche jamais cet argent."],
        ['Levée des réserves', "Le contrôleur juge la correction conforme et signe une levée, horodatée. Sur photo, elle dit « contrôlée sur photo », jamais « vérifiée »."],
        ['Proche en lecture seule', "Une personne invitée par le client (famille, conjoint) qui voit l'avancement et les avis, sans rien décider ni payer."],
        ['Désaccord', "Une partie conteste une déclaration ou un avis. TEEQA garde les échanges et prévient l'autre partie, mais ne tranche pas."],
        ['Contrôlée sur photo', "Une correction regardée à distance, sur les photos envoyées. Personne n'est venu sur place."],
        ['Vérifiée sur place', "Le contrôleur est venu sur le chantier, a pris ses photos et a donné un avis horodaté."],
      ];
      return {
        html: `${appbar({ title: 'Aide', back: '#/profile' })}
        <div class="scroll"><div class="content stack">${(() => { const one = ([q, a]) => `<details class="card"><summary style="font-weight:700;cursor:pointer;min-height:28px">${q}</summary><p class="muted" style="margin-top:8px">${a}</p></details>`;
          // Vague 22 (doigt : écran le plus chargé, 353 mots au premier écran) : les 5 questions les plus posées, le reste replié dessous.
          return `<p class="meta" style="margin:0" data-testid="aide-intro">Les 5 questions les plus posées. Les autres sont dessous.</p>${qa.slice(0, 5).map(one).join('')}<details class="more" data-testid="aide-autres"><summary>${icon('chevronDown', 'sm')}<span><b>Toutes les autres questions (${qa.length - 5})</b></span></summary><div class="stack" style="margin-top:10px">${qa.slice(5).map(one).join('')}</div></details>`; })()}
          <div class="list"><button class="list-item" data-go="#/annexe" data-testid="annexe-aide"><span class="ico-tile">${icon('wallet')}</span><span class="grow"><span class="t">Annexe tarifaire des visites</span><div class="s">Prix et payeur de chaque visite, contre-visite, second avis</div></span>${icon('chevron', 'sm chev')}</button></div>
          <div class="section-title" style="margin-bottom:0"><span class="over">Lexique</span></div>
          <div class="stack" style="gap:6px" data-testid="lexique">${lex.map(([m, d]) => `<details class="card"><summary style="font-weight:700;cursor:pointer;min-height:28px">${m}</summary><p class="meta" style="margin:6px 0 0">${d}</p></details>`).join('')}</div>
        </div></div>`,
      };
    },
  },
  {
    name: 'privacy', pattern: /^\/privacy$/,
    render() {
      return {
        html: `${appbar({ title: 'Confidentialité', back: '#/profile' })}
        <div class="scroll"><div class="content stack">
          <div class="notice success">${icon('shield', 'sm')}<span>Le chantier n'est jamais public : accès réservé aux personnes invitées ; un rapport ne sort que par un lien que vous créez, limité dans le temps.</span></div>
          <div class="list">
            <div class="list-item"><span class="ico-tile">${icon('camera')}</span><span class="grow"><span class="t">Caméra</span><div class="s">Demandée seulement au moment de photographier</div></span></div>
            <div class="list-item"><span class="ico-tile">${icon('pin')}</span><span class="grow"><span class="t">Position</span><div class="s">jamais présentée comme réelle</div></span></div>
            <div class="list-item"><span class="ico-tile">${icon('link')}</span><span class="grow"><span class="t">Accès contrôleur</span><div class="s">Temporaire, révocable, expire à la clôture</div></span></div>
            <div class="list-item"><span class="ico-tile">${icon('archive')}</span><span class="grow"><span class="t">Stockage</span><div class="s">Uniquement dans ce navigateur</div></span></div>
          </div>
        </div></div>`,
      };
    },
  },
];
