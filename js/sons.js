// Sons « matière » de TEEQA (11 nov.) : générés avec ElevenLabs (consignes dans assets/sons/raw/prompts.json), puis nettoyés
// (silence de début retiré, fin en fondu, niveau égalisé : les petits gestes restent plus bas que les récompenses).
// Famille unique, d'après la palette de Duolingo (marimba et petit synthétiseur) : marimba et kalimba pour les notes,
// céramique, tampon, papier et déclencheur pour les gestes. Trois versions par son ; le choix de l'utilisateur est gardé
// dans le navigateur (clé teeqa-son-<nom>, page sons.html). Rien n'est chargé avant le premier geste.
export const SONS = {
  lancement: 'Ouverture de l\'appli', retour: 'Retour dans l\'appli', tap: 'Toucher un bouton', pose: 'Étape déclarée (carreau posé)', ouvre: 'Feuille qui s\'ouvre',
  envoi: 'Envoi (message, photo)', photo: 'Prise de photo', tampon: 'Avis signé',
  notif: 'Liste actualisée', valide: 'Étape validée', fete: 'Célébration', reserve: 'Réserves', refus: 'Refusé',
};
const GAIN = .8, cache = new Map();
let actx = null;
// Version jouée quand rien n'est choisi dans ce navigateur : les choix de l'utilisateur du 11 nov. (page sons.html).
// Gardés : ouvre 2 ; pose, photo, valide, reserve, refus, fete 1. Refusés en 1-2-3, en attente d'un choix parmi 4-5-6
// (faits en code, assets/sons/raw/synthese.py) : tap, choix, envoi, notif, tampon, papier ; la 4 les remplace en attendant.
// Troisième tour : tap 9, envoi 8, tampon 8 (enregistrements d'Openverse). Onglets, interrupteurs et export du rapport : plus
// aucun son, une vibration seulement (les entrées « choix » et « papier » sont retirées). notif : en attente, voir sons.html.
const DEFAUT = { ouvre: 2, tap: 9, envoi: 8, tampon: 8, notif: 11 };   // notif 11 : choisi au quatrième tour
export const pick = (name) => { try { return +(localStorage.getItem('teeqa-son-' + name) || DEFAUT[name] || 1); } catch { return DEFAUT[name] || 1; } };
export function ctx() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  actx = actx || new AC(); if (actx.state === 'suspended') actx.resume();
  return actx;
}
function load(name, v = pick(name)) {
  const key = `${name}-${v}`;
  if (!cache.has(key)) cache.set(key, fetch(new URL(`../assets/sons/${key}.mp3`, import.meta.url)).then((r) => r.arrayBuffer())
    .then((b) => new Promise((ok, ko) => ctx().decodeAudioData(b, ok, ko))).catch(() => null));
  return cache.get(key);
}
// Joue un son. rate : hauteur (1 = normale) ; vol : 0 à 1 ; v : version imposée (page d'écoute). Renvoie faux si le son n'est pas prêt.
export function play(name, { rate = 1, vol = 1, v, delay = 0 } = {}) {
  const a = ctx(); if (!a || !SONS[name]) return false;
  const key = `${name}-${v || pick(name)}`, p = load(name, v || pick(name));
  const go = (buf) => { if (!buf) return; const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; s.playbackRate.value = rate; g.gain.value = GAIN * vol; s.connect(g).connect(a.destination); s.start(a.currentTime + delay); };
  if (p.buf !== undefined) { go(p.buf); return !!p.buf; }
  p.then((buf) => { p.buf = buf; go(buf); }); cache.set(key, p);
  return true;
}
// iPhone : Safari ne laisse partir le son que si le contexte audio est réveillé PENDANT le geste (fin de toucher ou clic),
// pas depuis une minuterie. Or le son par défaut d'un bouton part d'une minuterie (sfxTap) : sans ce réveil, les premiers
// écrans pouvaient rester muets jusqu'au premier onglet touché. On réveille donc le contexte, avec un échantillon muet,
// à chaque fin de toucher tant qu'il n'est pas en marche.
export function unlock() {
  const a = ctx(); if (!a || a.state === 'running') return;
  try { const s = a.createBufferSource(); s.buffer = a.createBuffer(1, 1, 22050); s.connect(a.destination); s.start(0); } catch { /* sans gravité */ }
}
// Le contexte audio est-il en marche ? (faux tant qu'aucun geste n'a eu lieu, ou quand iOS l'a mis en pause en arrière-plan)
export const ready = () => !!actx && actx.state === 'running';
// Tente de le remettre en marche (au retour dans l'appli) ; répond vrai s'il tourne.
export async function wake() { const a = ctx(); if (!a) return false; try { await Promise.race([a.resume(), new Promise((r) => setTimeout(r, 400))]); } catch { /* refusé */ } return a.state === 'running'; }
// Au premier geste : on prépare les sons les plus fréquents pour qu'ils partent sans retard.
export function warm() { ['tap', 'ouvre', 'pose', 'envoi'].forEach((n) => { const p = load(n); p.then((b) => { p.buf = b; }); }); }
