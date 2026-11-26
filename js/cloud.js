// TEEQA en ligne (21 nov. 2026) : vrais comptes, chantiers partagés, vraies photos, vraies notifications, avec Supabase.
// Ce module n'est importé par rien tant que la phase 2 n'est pas faite (voir deploiement/LISEZ-MOI.md).
//
// Sans configuration, il ne fait RIEN : l'appli reste exactement comme avant (stockage du navigateur, sans serveur), pour la
// visite, les tests automatiques, la vitrine (?vitrine) et la salle de démo (?salle). La configuration n'existe que dans la
// copie publiée : deploiement/publier.sh écrit js/cloud-config.js (window.TEEQA_CLOUD = { url, cle, vapid }) et l'ajoute
// à index.html. « ?local » dans l'adresse force aussi l'ancien mode.
//
// Même logique que la salle (store.js, bloc « Salle de démo ») : un chantier = un document JSON + un numéro de version.
// Un geste envoie le document fait à partir de la version N ; si quelqu'un a écrit entre-temps, le serveur renvoie la dernière
// version, on la prend, on rejoue le geste dessus et on renvoie. Aucun geste n'est perdu. Les règles métier restent dans store.js.
//
// Ce que store.js doit fournir (brancher) :
//   etat()          l'objet state du store
//   executer(mut)   applique un geste au state tel quel (mut(state), puis applyAccount), SANS commit (pas de renvoi)
//   apres(nouv)     après un changement venu d'ailleurs : enregistrer en local, redessiner, montrer les notifications `nouv`
//   photoEnvoyee(photoId, info)   une photo est arrivée sur le serveur : { chemin, recueLe } (ou { erreur })

const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';   // version exacte, épinglée
const BUCKET = 'photos';
const DOC_FORMAT = 1;

// ---------- Configuration : présente seulement dans la copie publiée ----------
const PARAMS = (() => { try { return location.search; } catch { return ''; } })();
export const CONFIG = (() => { try { const c = window.TEEQA_CLOUD; return c && c.url && c.cle ? c : null; } catch { return null; } })();
export const ACTIF = !!CONFIG && !/[?&](local|salle|vitrine)\b/.test(PARAMS);

let sb = null, sbPromesse = null, A = null;   // client supabase, adaptateur du store
export async function client() {
  if (!ACTIF) throw new Error('hors ligne : pas de configuration');
  if (sb) return sb;
  if (!sbPromesse) sbPromesse = import(SUPABASE_JS).then(({ createClient }) => {
    sb = createClient(CONFIG.url, CONFIG.cle, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'teeqa-auth' } });
    sb.auth.onAuthStateChange((ev, session) => {
      if (ev === 'PASSWORD_RECOVERY') signaler('mot-de-passe');
      if (ev === 'SIGNED_OUT') { arreterDirect(); signaler('deconnecte'); }
      if (ev === 'SIGNED_IN' && session && !direct) demarrerDirect();
    });
    return sb;
  });
  return sbPromesse;
}

// ---------- État de la connexion, pour la pastille « En direct / Hors connexion » ----------
let etatCo = 'connexion';
const ecoutes = new Set();
export const etat = () => etatCo;
export function onEtat(fn) { ecoutes.add(fn); return () => ecoutes.delete(fn); }
function signaler(e) { etatCo = e; ecoutes.forEach((f) => { try { f(e); } catch { /* écran */ } }); }

// Messages d'erreur en français simple.
export function messageErreur(e) {
  const m = String((e && (e.message || e.error_description || e.msg)) || e || '');
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(m)) return "Votre e-mail n'est pas encore confirmé : ouvrez le lien reçu par e-mail.";
  if (/already registered|already been registered|User already/i.test(m)) return 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
  if (/Password should be|weak.?password/i.test(m)) return 'Mot de passe trop court : 8 caractères au moins.';
  if (/rate limit|too many/i.test(m)) return 'Trop d\'essais d\'un coup. Réessayez dans quelques minutes.';
  if (/Anonymous sign-ins are disabled/i.test(m)) return 'Entrée par lien momentanément fermée. Prévenez le client du chantier.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Pas de réseau. Réessayez dès que la connexion revient.';
  if (/accès refusé|42501/.test(m)) return "Vous n'avez pas accès à ce chantier.";
  return 'Une erreur est survenue. Réessayez.';
}
const ok = (r) => { if (r && r.error) throw r.error; return r ? r.data : null; };

// =====================================================================================================
// Comptes : création, connexion, mot de passe oublié, déconnexion
// =====================================================================================================
const adresseAppli = () => location.origin + location.pathname;

// role : 'client' ou 'entreprise'. Renvoie { compte, confirmer } (confirmer = true si Supabase attend le clic dans l'e-mail).
export async function creerCompte({ email, motDePasse, nom, role }) {
  const s = await client();
  const d = ok(await s.auth.signUp({ email: email.trim(), password: motDePasse,
    options: { data: { nom: (nom || '').trim().slice(0, 80), role }, emailRedirectTo: adresseAppli() } }));
  if (!d.session) return { compte: null, confirmer: true };
  await demarrerDirect();
  return { compte: await monCompte(), confirmer: false };
}
export async function connexion({ email, motDePasse }) {
  const s = await client();
  ok(await s.auth.signInWithPassword({ email: email.trim(), password: motDePasse }));
  await demarrerDirect();
  return monCompte();
}
// L'e-mail ramène sur l'appli avec #/mot-de-passe : l'événement PASSWORD_RECOVERY arrive (etat() === 'mot-de-passe').
export async function motDePasseOublie(email) {
  const s = await client();
  ok(await s.auth.resetPasswordForEmail(email.trim(), { redirectTo: adresseAppli() + '#/mot-de-passe' }));
}
export async function changerMotDePasse(motDePasse) { const s = await client(); ok(await s.auth.updateUser({ password: motDePasse })); }
export async function deconnexion() {
  const s = await client(); arreterDirect();
  await s.auth.signOut().catch(() => {});
  versions.clear(); connus.clear(); files.clear();
}
// Le compte connecté : { id, email, nom, role, anonyme } ou null.
export async function monCompte() {
  const s = await client();
  const { data: { session } } = await s.auth.getSession(); if (!session) return null;
  const u = session.user, anonyme = !!u.is_anonymous;
  if (anonyme) return { id: u.id, email: null, nom: '', role: 'controleur', anonyme };
  const p = ok(await s.from('profils').select('nom, role, email').eq('id', u.id).maybeSingle()) || {};
  return { id: u.id, email: p.email || u.email, nom: p.nom || (u.user_metadata && u.user_metadata.nom) || '', role: p.role || (u.user_metadata && u.user_metadata.role) || 'client', anonyme };
}
export async function modifierNom(nom) { const s = await client(); const c = await monCompte(); if (c && !c.anonyme) ok(await s.from('profils').update({ nom: nom.trim().slice(0, 80) }).eq('id', c.id)); }

// =====================================================================================================
// Le document d'un chantier : ce qui part au serveur, ce qui en revient
// =====================================================================================================
// Les notifications et les signalements de l'appli sont communs à tout le state ; on les range par chantier d'après leur route.
export const pidDeRoute = (r) => { const m = /^#\/(?:c|invite)\/([^/]+)/.exec(r || ''); return m ? m[1] : null; };

export function extraireDoc(st, pid) {
  const project = (st.projects || []).find((p) => p.id === pid); if (!project) return null;
  return {
    format: DOC_FORMAT, project,
    notifications: (st.notifications || []).filter((n) => pidDeRoute(n.route) === pid),
    reports: (st.reports || []).filter((g) => g.pid === pid),
    noms: { ...(st.noms || {}) },
  };
}
export function injecterDoc(st, pid, doc) {
  const local = donneesLocales(st, pid);
  st.projects = (st.projects || []).filter((p) => p.id !== pid);
  st.notifications = (st.notifications || []).filter((n) => pidDeRoute(n.route) !== pid);
  st.reports = (st.reports || []).filter((g) => g.pid !== pid);
  if (doc && doc.project) {
    st.projects.unshift(doc.project);
    st.notifications.push(...(doc.notifications || []));
    st.notifications.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    st.reports.push(...(doc.reports || []));
    // Noms communs (client, entreprise) : jamais celui du contrôleur, qui reste anonyme.
    if (doc.noms) { const { controleur, ...noms } = doc.noms; st.noms = { ...(st.noms || {}), ...noms }; }
    remettreLocales(doc.project, local);
  }
}
// Empreinte de chaque chantier : sert à savoir quels chantiers un geste a changés.
export function empreintes(st) { const m = new Map(); for (const p of (st.projects || [])) m.set(p.id, JSON.stringify(extraireDoc(st, p.id))); return m; }

// Les images en « data: » (photo pas encore envoyée, aperçu) ne partent jamais dans le document : elles sont lourdes et ont
// leur place dans le Storage. Le téléphone qui les a prises les garde ; les autres voient la photo une fois envoyée.
const GROS = 4000;
function pourEnvoi(doc) {
  return JSON.parse(JSON.stringify(doc, (k, v) => (typeof v === 'string' && v.length > GROS && v.startsWith('data:') ? null : v)));
}
function donneesLocales(st, pid) {
  const out = new Map(), p = (st.projects || []).find((x) => x.id === pid); if (!p) return out;
  (function marcher(o) { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(marcher);
    for (const [k, v] of Object.entries(o)) { if (typeof v === 'string' && v.length > GROS && v.startsWith('data:') && o.id) out.set(o.id + '\u0000' + k, v); else marcher(v); } })(p);
  return out;
}
function remettreLocales(project, local) {
  if (!local.size) return;
  (function marcher(o) { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(marcher);
    for (const [k, v] of Object.entries(o)) { const cle = o.id + '\u0000' + k; if (v == null && local.has(cle)) o[k] = local.get(cle); else marcher(v); } })(project);
}

// =====================================================================================================
// Synchronisation : chargement, envoi avec version, conflit et rejeu, direct
// =====================================================================================================
const versions = new Map();   // pid -> dernière version connue du serveur
const connus = new Map();     // pid -> Set des notifications déjà sur le serveur (pour ne pousser que les nouvelles)
const files = new Map();      // pid -> { gestes: [mut], envoi: bool, distant: {v, doc} | null, creer: bool }

export function brancher(adaptateur) { A = adaptateur; }

// Tous mes chantiers (ceux dont je suis membre ; la RLS fait le tri). Remplace les chantiers du state.
export async function chargerTout() {
  const s = await client();
  const lignes = ok(await s.from('chantiers').select('id, version, doc'));
  const st = A.etat(), avant = new Set((st.projects || []).map((p) => p.id)), recus = new Set();
  for (const l of lignes) { recus.add(l.id); versions.set(l.id, l.version); connus.set(l.id, idsNotifs(l.doc)); if (!enCours(l.id)) injecterDoc(st, l.id, l.doc); }
  // Un chantier qui n'est plus à moi (accès retiré) disparaît ; un chantier créé ici et pas encore envoyé reste.
  for (const id of avant) if (!recus.has(id) && !enCours(id) && versions.has(id)) { injecterDoc(st, id, null); versions.delete(id); }
  signaler('ok'); A.apres([]);
  return lignes.length;
}
const idsNotifs = (doc) => new Set(((doc && doc.notifications) || []).map((n) => n.id));
const enCours = (pid) => { const f = files.get(pid); return !!(f && (f.envoi || f.gestes.length)); };

// À appeler par commit() dans store.js : `avant` = empreintes(state) prises avant le geste.
export function apresGeste(avant, mut) {
  if (!ACTIF || !A) return;
  const st = A.etat(), apres = empreintes(st);
  for (const [pid, e] of apres) {
    if (avant.get(pid) === e) continue;
    const f = files.get(pid) || { gestes: [], envoi: false, distant: null, creer: false };
    if (!avant.has(pid) && !versions.has(pid)) f.creer = true;   // chantier tout neuf
    f.gestes.push(mut); files.set(pid, f);
    if (!f.envoi) envoyer(pid);
  }
}

async function envoyer(pid) {
  const f = files.get(pid); if (!f || f.envoi) return;
  const lot = f.gestes.splice(0); if (!lot.length && !f.creer) return;
  f.envoi = true;
  try {
    const s = await client(), doc = extraireDoc(A.etat(), pid);
    if (!doc) { f.envoi = false; return; }
    const corps = pourEnvoi(doc);
    if (f.creer) {
      ok(await s.rpc('creer_chantier', { p_id: pid, p_doc: corps }));
      f.creer = false; versions.set(pid, 1); signaler('ok'); await apresEnvoi(pid, corps);
    } else {
      const r = ok(await s.rpc('enregistrer_chantier', { p_id: pid, p_base: versions.get(pid) || 0, p_doc: corps, p_texte: null }));
      if (r && r.conflit) {
        // Quelqu'un a agi juste avant : on prend sa version, on rejoue nos gestes dessus, et on renvoie.
        versions.set(pid, r.v); connus.set(pid, idsNotifs(r.doc));
        rejouer(pid, r.doc, lot);
        f.gestes.unshift(...lot); A.apres([]);
      } else { versions.set(pid, r.v); signaler('ok'); await apresEnvoi(pid, corps); }
    }
  } catch (e) {
    f.gestes.unshift(...lot);
    if (/42501|accès refusé/.test(String(e && (e.code || e.message)))) { f.gestes.length = 0; signaler('refuse'); }
    else { signaler('hors'); await new Promise((z) => setTimeout(z, 2000)); }
  }
  f.envoi = false;
  if (f.gestes.length || f.creer) { if (navigator.onLine !== false) return envoyer(pid); return; }
  if (f.distant && f.distant.v > (versions.get(pid) || 0)) { const d = f.distant; f.distant = null; recevoir(pid, d.v, d.doc); } else f.distant = null;
}

// Rejouer des gestes sur la version du serveur, sans toucher au reste : les gestes de store.js lisent le state global,
// on les rejoue donc sur le vrai state, puis on remet tel quel tout ce qui n'est pas ce chantier (autres chantiers, envois,
// brouillons, session…), pour qu'un geste ne compte jamais deux fois ailleurs.
function rejouer(pid, docServeur, gestes) {
  const st = A.etat();
  const garde = JSON.parse(JSON.stringify({ ...st, projects: null, notifications: null, reports: null }));
  const autres = (st.projects || []).filter((p) => p.id !== pid).map((p) => extraireDoc(st, p.id));
  injecterDoc(st, pid, docServeur);
  for (const g of gestes) { try { A.executer(g); } catch { /* geste devenu impossible sur la nouvelle version */ } }
  const mien = extraireDoc(st, pid);
  for (const k of Object.keys(garde)) if (!['projects', 'notifications', 'reports'].includes(k)) st[k] = garde[k];
  st.projects = []; st.notifications = []; st.reports = [];
  for (const d of autres) injecterDoc(st, d.project.id, d);
  if (mien) injecterDoc(st, pid, mien);
}

async function apresEnvoi(pid, corps) {
  const deja = connus.get(pid) || new Set(), nouvelles = (corps.notifications || []).filter((n) => !deja.has(n.id)).map((n) => n.id);
  connus.set(pid, idsNotifs(corps));
  if (nouvelles.length) notifier(pid, nouvelles).catch(() => { /* la notification dans l'appli reste ; seul le push manque */ });
}

// Un changement venu d'un autre téléphone.
async function recevoir(pid, v, doc) {
  if (v <= (versions.get(pid) || 0)) return;
  const f = files.get(pid);
  if (f && (f.envoi || f.gestes.length)) { if (!f.distant || v > f.distant.v) f.distant = { v, doc }; return; }   // mon geste part : on verra après
  if (!doc) { const s = await client(); const l = ok(await s.from('chantiers').select('version, doc').eq('id', pid).maybeSingle()); if (!l) return; v = l.version; doc = l.doc; }
  const st = A.etat(), role = st.role, mes = new Set((st.notifications || []).map((n) => n.id));
  versions.set(pid, v); connus.set(pid, idsNotifs(doc));
  injecterDoc(st, pid, doc);
  A.apres((doc.notifications || []).filter((n) => !mes.has(n.id) && (n.roles || []).includes(role)));
}

// Direct : Realtime (immédiat) + vérification légère toutes les 20 s, au retour sur l'appli et au retour du réseau.
let direct = null, minuterie = 0;
async function demarrerDirect() {
  if (direct || !A) return;
  const s = await client();
  direct = s.channel('teeqa-chantiers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, (m) => {
      const r = m.new; if (!r || !r.id) return;
      // Le document peut être coupé s'il est gros : on le relit alors en entier.
      recevoir(r.id, r.version, r.doc && r.doc.project ? r.doc : null).catch(() => {});
    })
    .subscribe((st) => { if (st === 'SUBSCRIBED') signaler('ok'); else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') signaler('hors'); });
  await chargerTout().catch(() => signaler('hors'));
  minuterie = setInterval(verifier, 20000);
  document.addEventListener('visibilitychange', verifier);
  window.addEventListener('online', relancer);
  viderFilePhotos().catch(() => {});
}
function arreterDirect() {
  if (direct && sb) sb.removeChannel(direct); direct = null; clearInterval(minuterie);
  document.removeEventListener('visibilitychange', verifier); window.removeEventListener('online', relancer);
}
function relancer() { verifier(); for (const [pid, f] of files) if (f.gestes.length || f.creer) envoyer(pid); viderFilePhotos().catch(() => {}); }
let verifEnCours = false;
async function verifier() {
  if (verifEnCours || document.hidden || !A) return; verifEnCours = true;
  try {
    const s = await client();
    const lignes = ok(await s.from('chantiers').select('id, version'));
    if (etatCo !== 'ok') signaler('ok');
    const ids = new Set(lignes.map((l) => l.id));
    if (lignes.some((l) => !versions.has(l.id)) || [...versions.keys()].some((id) => !ids.has(id) && !enCours(id))) await chargerTout();
    else for (const l of lignes) if (l.version > (versions.get(l.id) || 0)) await recevoir(l.id, l.version, null);
  } catch { signaler('hors'); }
  verifEnCours = false;
}

// Au démarrage de l'appli : si une session existe déjà (téléphone déjà connecté), on charge et on passe en direct.
// Renvoie le compte ou null (il faut alors l'écran de connexion).
export async function demarrer(adaptateur) {
  if (!ACTIF) return null;
  if (adaptateur) brancher(adaptateur);
  try {
    const s = await client();
    const { data: { session } } = await s.auth.getSession();
    enregistrerServiceWorker().catch(() => {});
    if (!session) { signaler('deconnecte'); return null; }
    await demarrerDirect();
    return await monCompte();
  } catch { signaler('hors'); return null; }
}

// =====================================================================================================
// Invitations : entreprise (lien), contrôleur (lien + code, session anonyme), proche (lien + code, lecture seule)
// =====================================================================================================
export const lienInvitation = (jeton, code = '') => `${adresseAppli()}#/rejoindre/${jeton}${code ? '/' + code : ''}`;

// Le client crée le lien. Renvoie { jeton, code, role, expire_le, lien }. Recréer annule l'ancien lien non utilisé.
export async function creerInvitation(pid, role, email = null) {
  const s = await client();
  const r = ok(await s.rpc('creer_invitation', { p_chantier: pid, p_role: role, p_email: email }));
  return { ...r, lien: lienInvitation(r.jeton, role === 'entreprise' ? '' : r.code) };
}
// Les liens en cours d'un chantier (client seulement), pour remontrer le QR.
export async function invitations(pid) {
  const s = await client();
  const l = ok(await s.from('invitations').select('role, jeton, code, expire_le, utilisee_le, annulee').eq('chantier_id', pid).eq('annulee', false));
  return l.map((i) => ({ ...i, lien: lienInvitation(i.jeton, i.role === 'entreprise' ? '' : i.code) }));
}
// Avant d'accepter : { role, chantier, ville, valide, code_requis } ou null.
export async function voirInvitation(jeton) { const s = await client(); return ok(await s.rpc('voir_invitation', { p_jeton: jeton })); }
// Accepter. L'entreprise doit être connectée avec son compte ; le contrôleur et le proche entrent sans compte :
// on ouvre pour eux une session anonyme (gardée sur ce téléphone), liée à l'invitation par le serveur.
// Renvoie { ok, chantier, role } ou { ok: false, raison } (lien_invalide, compte_requis, code_faux, deja_utilise…).
export async function rejoindre(jeton, code = null) {
  const s = await client();
  let { data: { session } } = await s.auth.getSession();
  if (!session) {
    const v = await voirInvitation(jeton);
    if (!v || !v.valide) return { ok: false, raison: 'lien_invalide' };
    if (v.role === 'entreprise') return { ok: false, raison: 'compte_requis' };
    ok(await s.auth.signInAnonymously());
  }
  const r = ok(await s.rpc('accepter_invitation', { p_jeton: jeton, p_code: code }));
  if (r && r.ok) { await demarrerDirect(); await chargerTout(); }
  return r;
}

// =====================================================================================================
// Photos réelles : compression, envoi au Storage (bucket privé), file d'attente hors ligne, adresses signées
// =====================================================================================================
// Compression avant envoi : 1600 px au plus sur le grand côté, JPEG qualité 0,8 (une photo de téléphone de 4 Mo → ~300 Ko).
export async function compresser(source, { max = 1600, qualite = 0.8 } = {}) {
  const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
  let img;
  try { img = await createImageBitmap(blob, { imageOrientation: 'from-image' }); }
  catch { img = await new Promise((ok2, ko) => { const i = new Image(); i.onload = () => ok2(i); i.onerror = ko; i.src = URL.createObjectURL(blob); }); }
  const w0 = img.width, h0 = img.height, k = Math.min(1, max / Math.max(w0, h0)), w = Math.round(w0 * k), h = Math.round(h0 * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h); if (img.close) img.close();
  const sortie = await new Promise((ok2) => c.toBlob(ok2, 'image/jpeg', qualite));
  return { blob: sortie, largeur: w, hauteur: h };
}

// File d'attente dans IndexedDB : une photo prise hors ligne part dès que le réseau revient, même après fermeture de l'appli.
const IDB = 'teeqa-cloud', MAGASIN = 'photos';
function idb() {
  return new Promise((ok2, ko) => { const r = indexedDB.open(IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN, { keyPath: 'photoId' });
    r.onsuccess = () => ok2(r.result); r.onerror = () => ko(r.error); });
}
async function idbFaire(mode, fn) {
  const db = await idb();
  return new Promise((ok2, ko) => { const t = db.transaction(MAGASIN, mode), o = t.objectStore(MAGASIN); const r = fn(o);
    t.oncomplete = () => { db.close(); ok2(r && 'result' in r ? r.result : undefined); }; t.onerror = () => { db.close(); ko(t.error); }; });
}
const ecoutesPhotos = new Set();
export function onPhoto(fn) { ecoutesPhotos.add(fn); return () => ecoutesPhotos.delete(fn); }
const direPhoto = (x) => ecoutesPhotos.forEach((f) => { try { f(x); } catch { /* écran */ } });

// À appeler juste après actions.addPhoto : { pid, sid, photoId, source (dataUrl ou Blob), role, priseLe }.
export async function envoyerPhoto({ pid, sid, photoId, source, role, priseLe = new Date().toISOString() }) {
  const { blob, largeur, hauteur } = await compresser(source);
  await idbFaire('readwrite', (o) => o.put({ photoId, pid, sid, role, priseLe, blob, largeur, hauteur, essais: 0 }));
  direPhoto({ photoId, etat: 'attente' });
  viderFilePhotos().catch(() => {});
}
let vidage = null;
export function viderFilePhotos() {
  if (vidage) return vidage;
  vidage = (async () => {
    const s = await client();
    const { data: { session } } = await s.auth.getSession(); if (!session) return;
    const toutes = await idbFaire('readonly', (o) => o.getAll());
    for (const x of toutes || []) {
      const chemin = `${x.pid}/${x.sid}/${x.photoId}.jpg`;
      direPhoto({ photoId: x.photoId, etat: 'envoi' });
      try {
        const up = await s.storage.from(BUCKET).upload(chemin, x.blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' });
        if (up.error && !/exists|Duplicate/i.test(up.error.message || '')) throw up.error;
        const ins = await s.from('photos').insert({ id: x.photoId, chantier_id: x.pid, etape_id: x.sid, chemin, role: x.role, prise_le: x.priseLe, octets: x.blob.size, largeur: x.largeur, hauteur: x.hauteur });
        if (ins.error && ins.error.code !== '23505') throw ins.error;
        const fiche = ok(await s.from('photos').select('recue_le').eq('id', x.photoId).maybeSingle());
        await idbFaire('readwrite', (o) => o.delete(x.photoId));
        const info = { chemin, recueLe: fiche && fiche.recue_le };
        direPhoto({ photoId: x.photoId, etat: 'ok', ...info }); A && A.photoEnvoyee && A.photoEnvoyee(x.photoId, info);
      } catch (e) {
        const refus = /42501|row-level security|not authorized|Unauthorized/i.test(String(e && (e.message || e.code)));
        if (refus || ++x.essais >= 6) { await idbFaire('readwrite', (o) => o.delete(x.photoId)); direPhoto({ photoId: x.photoId, etat: 'echec' }); A && A.photoEnvoyee && A.photoEnvoyee(x.photoId, { erreur: messageErreur(e) }); }
        else { await idbFaire('readwrite', (o) => o.put(x)); direPhoto({ photoId: x.photoId, etat: 'attente' }); signaler('hors'); break; }
      }
    }
  })().finally(() => { vidage = null; });
  return vidage;
}

// Adresse d'affichage d'une photo envoyée (bucket privé : adresse signée, valable 1 h, gardée 50 min).
const adresses = new Map(), demandes = new Set();
export async function urlPhoto(chemin) {
  const c = adresses.get(chemin); if (c && c.fin > Date.now()) return c.url;
  const s = await client();
  const d = ok(await s.storage.from(BUCKET).createSignedUrl(chemin, 3600));
  adresses.set(chemin, { url: d.signedUrl, fin: Date.now() + 50 * 60000 });
  return d.signedUrl;
}
// Pour les écrans (qui dessinent en texte, sans attendre) : la photo prise ici, sinon l'adresse signée si elle est prête,
// sinon null (l'écran montre « en cours d'envoi ») et on la demande : l'écran est redessiné quand elle arrive.
export function srcPhoto(ph) {
  if (!ph) return null;
  if (ph.dataUrl) return ph.dataUrl;
  if (!ACTIF || !ph.stockage) return null;
  const c = adresses.get(ph.stockage); if (c && c.fin > Date.now()) return c.url;
  if (!demandes.has(ph.stockage)) { demandes.add(ph.stockage); urlPhoto(ph.stockage).then(() => A && A.apres([])).catch(() => {}).finally(() => demandes.delete(ph.stockage)); }
  return null;
}

// =====================================================================================================
// Notifications réelles (Web Push) : iPhone = appli ajoutée à l'écran d'accueil, iOS 16.4 ou plus
// =====================================================================================================
export const estIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const ecranAccueil = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
// 'oui' | 'non' | 'a-demander' | 'ecran-accueil' (iPhone : ajouter d'abord à l'écran d'accueil) | 'impossible'
export function notificationsPossibles() {
  if (!ACTIF || !CONFIG.vapid) return 'impossible';
  if (estIOS() && !ecranAccueil()) return 'ecran-accueil';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'impossible';
  return Notification.permission === 'granted' ? 'oui' : Notification.permission === 'denied' ? 'non' : 'a-demander';
}
async function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('sw.js', { scope: './' });
}
const vapidOctets = (b64) => { const p = '='.repeat((4 - (b64.length % 4)) % 4), s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
// À appeler depuis un toucher (bouton « Recevoir les notifications ») : iPhone refuse sinon.
export async function activerNotifications() {
  const p = notificationsPossibles(); if (p === 'ecran-accueil' || p === 'impossible' || p === 'non') return p;
  const perm = await Notification.requestPermission(); if (perm !== 'granted') return 'non';
  await enregistrerServiceWorker();
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidOctets(CONFIG.vapid) });
  const j = sub.toJSON(), s = await client();
  ok(await s.rpc('enregistrer_abonnement', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_appareil: navigator.userAgent.slice(0, 160) }));
  return 'oui';
}
export async function couperNotifications() {
  const reg = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return; const s = await client();
  await s.from('abonnements_push').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe();
}
// Demande à la fonction Edge « notifier » de pousser ces notifications (déjà écrites dans le document) aux bons membres.
// Elle relit le document côté serveur : elle n'envoie que ce qui y est vraiment, et une seule fois.
export async function notifier(pid, ids) {
  const s = await client();
  ok(await s.functions.invoke('notifier', { body: { chantier: pid, ids: ids.slice(0, 20) } }));
}
