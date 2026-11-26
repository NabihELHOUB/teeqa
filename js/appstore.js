// Projection de la fiche TEEQA dans une boutique d'applications (11 nov. 2026).
// Cahier : refs/CHANTIER-PAGE-APP-STORE-TEEQA.md ; référence filmée : refs/appstore-reference/.
// Tout est imaginé (notes, avis, récompense, nombres) et c'est écrit en bas de la fiche : TEEQA n'est pas publiée.
// Écarts voulus par rapport au cahier : pas de citations attribuées à de vrais journaux, pas d'applis de vraies marques dans
// « Vous aimerez aussi », pas de téléphone ni d'adresse inventés. Aucun prix (règle du projet).
import { bellarejRig } from './bellarej-rig.js';
import { stepIconFlat } from './art.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = $('#as');
const CHEV = `<svg class="chev" viewBox="0 0 9 15"><path d="M1.5 1.500 L7.500 7.500 L1.500 13.500"/></svg>`;
const BACK = `<svg viewBox="0 0 20 20"><path d="M12.500 3 L5.500 10 L12.500 17"/></svg>`;
const STAR5 = '★★★★★';
const ic = (s = 62) => `<span class="ic" style="width:${s}px;height:${s}px" role="img" aria-label="Icône de TEEQA"></span>`;
const fake = (txt, g, s = 62) => `<span class="ic g" style="width:${s}px;height:${s}px;--g:${g}" aria-hidden="true">${txt}</span>`;
const getBtn = (label = 'Obtenir', cls = '') => `<button class="get ${cls}" data-get>${label}</button>`;
const STEPS = ['Fondations', 'Gros œuvre et murs', 'Dalle et toiture', 'Menuiseries et réseaux', 'Enduits et zellige', 'Finitions et clés'];
const SIG = 'M12 42 C14 24 22 6 30 8 C38 10 30 34 18 42 C10 47 8 38 18 33 C26 29 36 30 38 36 C40 42 34 43 36 37 C38 31 46 30 48 36 C50 42 44 43 47 36 C52 24 58 8 62 6 C66 5 64 16 58 30 C55 37 56 42 61 40 C66 38 66 31 71 31 C76 31 72 41 77 40 C82 39 83 32 88 32 C92 32 89 40 94 40 C104 40 116 34 130 24';

// ---------- Les 8 planches d'aperçu ----------
const slab = (c, t) => `<div class="slab" style="background:${c}">${t}</div>`;
// 11 nov., 15 h : l'utilisateur a jugé les planches dessinées « moins bien que l'appli ». Elles montrent maintenant les vrais écrans
// (photographiés par shots.mjs, recadrés dans assets/fiche/apercu-N.webp), mis en valeur par le bandeau de couleur. Pour les refaire
// après un changement de l'appli : voir ETAT.md, section du 11 nov. 14 h à 15 h.
const PUB = [['#F08A1C', 'suivez votre chantier<br>d\'un coup d\'œil', 'Mes chantiers : avancement et dernières nouvelles'], ['#B45FD6', 'des photos prises<br>sur place', 'Une étape : photos, dates et état'],
  ['#12A37C', 'avancez sur votre<br>chemin en zellige', 'Le chemin du chantier, étape par étape'], ['#1C8FE8', 'décidez de payer<br>en confiance', 'En clair : paiement recommandé après un avis Validé'],
  ['#E5533F', 'échangez avec<br>le chantier', 'Les échanges entre client, entreprise et contrôleur'], ['#F5A300', 'célébrez chaque<br>étape validée', 'Étape validée : la célébration'],
  ['#2764E3', 'un rapport complet,<br>avis signés', 'Le rapport du chantier'], ['#8B5CF6', 'suivez tout sans<br>ouvrir l\'appli', 'Activité en direct sur l\'écran verrouillé']];
// Mise en scène publicitaire (11 nov., 15 h 30), à la manière des planches de Duolingo : l'écran réel reste le fond, une loupe en
// montre un détail agrandi et lisible d'un coup d'œil, et Bellarej dépasse du cadre de l'écran. Tout est en unités de la planche (cqw) :
// la même planche s'agrandit sans rien recalculer. STAGE[i] = { z: [centre x, centre y dans l'image (0 à 1), agrandissement, haut de la loupe en cqw, côté],
//   b: [humeur de Bellarej, côté, options] } ; null = rien (l'écran porte déjà Bellarej).
const STAGE = [
  { z: [.16, .345, 2.3, 58, 'r'], b: ['posee', 'r'] },
  { z: [.31, .437, 1.7, 74, 'r'], b: ['photo', 'l', { gear: 'jaune' }] },
  { z: [.27, .30, 1.9, 104, 'l'], b: ['vol', 'r'] },
  { z: [.43, .567, 1.45, 34, 'r'], b: ['annonce', 'l'] },
  { z: [.36, .425, 1.9, 104, 'r'], b: ['posee', 'l', { gear: 'orange' }] },
  { z: null, b: null },
  { z: [.47, .905, 2.0, 62, 'r'], b: ['felicite', 'l'] },
  { z: [.36, .805, 1.5, 50, 'l'], b: null },
];
const IMG_RATIO = 1167 / 640, SHOT_W = 92, LW = 66, LH = 30;   // largeur de l'écran dans la planche, taille de la loupe (cqw)
// 12 nov. : les loupes sont retirées (retour de l'utilisateur : « languettes zoomées » jugées laides). Bellarej qui dépasse reste.
const loupe = (i) => { return ''; const z = STAGE[i].z; if (!z) return ''; const [cx, cy, k, top, side] = z, bw = SHOT_W * k, bh = bw * IMG_RATIO;
  return `<span class="p-zoom ${side}" aria-hidden="true" style="top:${top}cqw;background-image:url(assets/fiche/apercu-${i + 1}.webp);background-size:${bw.toFixed(1)}cqw auto;background-position:${(LW / 2 - cx * bw).toFixed(1)}cqw ${(LH / 2 - cy * bh).toFixed(1)}cqw"></span>`; };
const oiseau = (i) => { const b = STAGE[i].b; return b ? `<span class="p-bird ${b[1]} m-${b[0]}" aria-hidden="true">${bellarejRig(b[0], 120, b[2] || {})}</span>` : ''; };
const POSTERS = PUB.map(([c, t, alt], i) => () => `<div class="shot"><img src="assets/fiche/apercu-${i + 1}.webp" alt="${alt}" loading="lazy" draggable="false"></div>${loupe(i)}${oiseau(i)}${slab(c, t)}`);
const poster = (i, tag = 'button') => `<${tag} class="poster" ${tag === 'button' ? `data-zoom="${i}" aria-label="Aperçu ${i + 1} sur 8"` : ''}>${POSTERS[i]()}</${tag}>`;

// ---------- Cartes d'événement ----------
const EVENTS = [
  { tag: 'Maintenant disponible', img: 'p12', bird: bellarejRig('felicite', 120), say: '', over: 'Mise à jour majeure', t: 'Le chemin en zellige et l\'avis signé sont là', s: 'Suivez vos 6 étapes à distance, photo par photo.' },
  { tag: 'En cours', img: 'p8', bird: bellarejRig('photo', 120, { gear: 'jaune' }), say: '', over: 'Nouveau', t: 'Suivi en direct sur l\'écran verrouillé', s: 'Un œil sur le chantier sans ouvrir l\'application.', flip: true },
];
const eventCard = (e) => `<div><p class="over-b">${e.tag}</p><div class="ev" data-open role="button" tabindex="0"><div class="ev-art"><img src="assets/photos/${e.img}.webp" alt="">${e.say ? `<span class="say">${e.say}</span>` : ''}<span class="bird ${e.flip ? 'l' : ''}">${e.bird}</span>
  <div class="cap"><small>${e.over}</small><b>${e.t}</b><span>${e.s}</span></div></div>
  <div class="ev-foot">${ic(42)}<span class="grow"><b>TEEQA : Suivi de chantier</b><span>Construire à distance, sereinement</span></span>${getBtn('Obtenir', 'soft')}</div></div></div>`;

// ---------- Avis (imaginés) ----------
const REVIEWS = [
  ['Indispensable quand on construit de loin', 5, '14 juin', 'Karim_Lyon', 'Je fais construire près de Nador en habitant à Lyon. Avant, je recevais des photos floues sans savoir si je devais payer la tranche. Avec le chemin, les réserves en photos et l\'avis signé du contrôleur, je sais où j\'en suis. Ça m\'a évité deux mauvaises surprises, dont une sur le ferraillage que je n\'aurais jamais vue seul.'],
  ['Une vraie tranquillité, et c\'est beau', 5, 'il y a 2 sem.', 'Nadia.M', 'L\'appli est claire et chaleureuse. La petite cigogne quand une étape est validée donne le sourire, et le rapport est très carré pour toute la famille. On comprend en dix secondes ce qui est fait, ce qui attend, et ce qu\'on nous recommande.'],
  ['Côté entreprise, ça change tout', 5, 'il y a 1 mois', 'AtlasBati', 'Fini les malentendus avec les clients à l\'étranger. On déclare le début et la fin de chaque étape avec nos photos, même quand le réseau coupe sur le chantier. Quand c\'est validé, le paiement suit sans discussion.'],
  ['Pratique pour les visites de contrôle', 5, 'il y a 3 mois', 'Ing_Youssef', 'Je reçois un lien, pas de compte à créer. Je prends mes photos sur place et je signe mon avis au doigt. Simple et sérieux.'],
  ['Le suivi sur l\'écran verrouillé', 5, 'il y a 2 mois', 'Mehdi_Bxl', 'Voir l\'avancement de la dalle sans ouvrir l\'appli, c\'est très agréable. Bravo à l\'équipe.'],
  ['Très bien, juste un détail', 4, 'il y a 4 mois', 'Sarah_Bdx', 'L\'avis « Réserves » corrigé par photo nous a évité une erreur sur les menuiseries. J\'aimerais pouvoir ranger plus de documents annexes, sinon c\'est parfait.'],
  ['Mes parents suivent aussi', 5, 'il y a 5 mois', 'Yasmine.K', 'J\'ai partagé le chantier avec mes parents. Ils ouvrent l\'appli tous les matins. Le résumé « En clair » leur suffit : payer ou attendre.'],
  ['Enfin un tiers entre nous et l\'artisan', 5, 'il y a 5 mois', 'Hicham_Rtm', 'Ce n\'est pas l\'appli qui décide, et c\'est dit clairement. Mais avoir quelqu\'un qui passe sur place et qui signe ce qu\'il a vu, ça change la relation avec l\'entreprise.'],
  ['Hors ligne, ça tient', 4, 'il y a 6 mois', 'Chantier_Oujda', 'Sur notre terrain il n\'y a presque pas de réseau. Les photos partent toutes seules dès qu\'on retrouve du signal. Une fois, il a fallu relancer un envoi à la main.'],
  ['Simple pour quelqu\'un qui n\'y connaît rien', 5, 'il y a 7 mois', 'Amal.B', 'Je ne connais rien au bâtiment. Les six étapes et les explications m\'ont permis de suivre sans me sentir perdue.'],
];
const rev = (r, i) => `<button class="rev" data-rev="${i}"><b>${r[0]}</b><span class="m"><span class="stars">${'★'.repeat(r[1])}${'☆'.repeat(5 - r[1])}</span> · ${r[2]} · ${r[3]}</span><p>${r[4]}</p><span class="plus">plus</span></button>`;

const DESC = `Faites construire au Maroc depuis la France, la Belgique, le Canada ou les Pays-Bas, sans avancer à l'aveugle. TEEQA suit votre chantier étape par étape et fait passer un contrôleur indépendant sur place.

• Un parcours en 6 étapes : des fondations à la remise des clés, chaque avancée se pose sur votre chemin en zellige.
• Trois rôles, zéro confusion : le client suit et décide à distance, l'entreprise déclare ses avancées en photos, le contrôleur vérifie sur place par un simple lien, sans compte.
• Des photos prises dans l'appli, sur le chantier : datées et rattachées à leur étape, même quand le réseau est faible (elles partent dès qu'il revient).
• Un avis signé avant chaque paiement : Validé, Réserves (corrigées par photo, sans nouvelle visite) ou Refusé (nouvelle visite).
• Votre chantier d'un coup d'œil : activité en direct sur l'écran verrouillé, et un rapport complet à exporter.

TEEQA trace et signale. TEEQA ne tranche pas un désaccord, ne détient pas votre argent et ne certifie pas les photos : la décision de payer reste la vôtre.`;
const NEWS = `Bellarej, notre cigogne, veille encore plus près sur votre chantier cette semaine. Au programme : le suivi en direct sur l'écran verrouillé, un nouveau chemin en zellige pour vos 6 étapes, et des sons et vibrations sur mesure à chaque étape validée.`;
const more = (t) => `<div class="more"><div class="txt">${t}</div><button class="plus" data-more>plus</button></div>`;

const INFO = [
  ['Taille', '48,2 Mo'], ['Catégorie', 'Productivité'],
  ['Compatibilité', 'Fonctionne sur cet iPhone', 'iPhone\nNécessite iOS 17.0 ou version ultérieure.\n\niPad\nNécessite iPadOS 17.0 ou version ultérieure.'],
  ['Langues', 'Français et 2 de plus', 'Français, arabe, anglais'],
  ['Âge', '4+', '4+\nAucun contenu soumis à restriction.'],
  ['Achats intégrés', 'Non', 'Aucun achat dans l\'application.'],
  ['Fournisseur', 'TEEQA', 'TEEQA est un projet d\'étudiants de master 2. Aucune société n\'est encore créée : cette ligne sera complétée à la publication.'],
  ['Copyright', '© 2026 TEEQA'],
];

// ---------- Vues ----------
const TABS = [['Aujourd\'hui', 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 3v5h10V6zm0 8v2h10v-2z'], ['Jeux', 'M14.5 2 20 3.500l-2 6L22 14l-6 1.500L13 22l-3-6-7-1 5-4.500L7 4z'], ['Apps', 'M12 2 2 7l10 5 10-5zm-10 10 10 5 10-5-2.500-1.250L12 14.500 4.500 10.750zm0 5 10 5 10-5-2.500-1.250L12 19.500l-7.500-3.750z'], ['Arcade', 'M12 3a3 3 0 0 1 1 5.800V12l7 3.500v2L12 21l-8-3.500v-2L11 12V8.800A3 3 0 0 1 12 3z'], ['Rechercher', 'M10.500 3a7.500 7.500 0 0 1 5.900 12.100l4.300 4.300-1.400 1.400-4.300-4.300A7.500 7.500 0 1 1 10.500 3zm0 2a5.500 5.500 0 1 0 0 11 5.500 5.500 0 0 0 0-11z']];
const laurel = (t) => `<span class="laurel"><svg viewBox="0 0 10 26"><path d="M8 1C3 5 1 10 2 16c.5 4 3 7 6 9-2-3-3.500-6-3.500-10S6 5 8 1z"/></svg><span>${t}</span><svg viewBox="0 0 10 26" style="transform:scaleX(-1)"><path d="M8 1C3 5 1 10 2 16c.5 4 3 7 6 9-2-3-3.500-6-3.500-10S6 5 8 1z"/></svg></span>`;

root.innerHTML = `
<section class="view" id="v-search">
  <div class="sbar"><div class="sfield"><svg viewBox="0 0 20 20"><circle cx="8.500" cy="8.500" r="6"/><path d="M13 13l5 5" stroke-linecap="round"/></svg><span class="q" id="q"></span><button data-retype aria-label="Rejouer la saisie" style="opacity:.6">⊗</button></div>
    <a class="round" href="vitrine.html" aria-label="Fermer et revenir au site"><svg viewBox="0 0 20 20"><path d="M4 4l12 12M16 4L4 16"/></svg></a></div>
  <div id="results" hidden>
    <div class="res" role="group"><div class="res-head" data-open role="button" tabindex="0">${ic(62)}<span class="grow"><b>TEEQA : Suivi de chantier</b><span>Construire à distance, sereinement</span></span>${getBtn()}</div>
      <div class="res-meta"><span>${STAR5} 1,4 M</span><span>TEEQA</span><span><span class="no">N° 1</span>Productivité</span></div>
      ${eventCard(EVENTS[0])}</div>
    <div class="res other"><div class="res-head">${fake('▦', '#3A6EA5')}<span class="grow"><b>Plans et métrés</b><span>Dessinez vos pièces en 2D</span></span><button class="get soft">Obtenir</button></div></div>
    <div class="res other"><div class="res-head">${fake('✎', '#8A5A34')}<span class="grow"><b>Carnet de travaux</b><span>Notes et dépenses de rénovation</span></span><button class="get soft">Obtenir</button></div></div>
  </div>
</section>

<section class="view" id="v-app">
  <div class="hero"><div class="wm">TEEQA<small>votre chantier, vérifié</small></div></div>
  <div class="ident">${ic(116)}<div class="grow"><h1>TEEQA : Suivi de chantier et contrôle</h1><p>Construire au Maroc à distance</p>${getBtn()}</div></div>
  <div class="ribbon">
    <div><small>1,4 M d'avis</small><b>4,9</b><span class="stars">${STAR5}</span></div>
    <div><small>Téléchargements</small><b>+100 M</b><span>Dans le monde</span></div>
    <div><small>Récompenses</small><b>${laurel('Choix de la<br>rédaction')}</b><span>Apps</span></div>
    <div><small>Classement</small><b>N° 1</b><span>Productivité</span></div>
    <div><small>Âge</small><b>4+</b><span>Ans</span></div>
    <div><small>Développeur</small><b>☻</b><span>TEEQA</span></div>
    <div><small>Langue</small><b>FR</b><span>+ 2 autres</span></div>
    <div><small>Taille</small><b>48,2</b><span>Mo</span></div>
  </div>
  <h2 class="sec">Événements</h2><div class="hs evs">${EVENTS.map(eventCard).join('')}</div>
  <h2 class="sec">Nouveautés ${CHEV}</h2><div class="row2"><span>Version 2.6.0</span><span>il y a 1 j</span></div>${more(NEWS)}
  <h2 class="sec">Aperçu</h2><div class="hs posters">${POSTERS.map((_, i) => poster(i)).join('')}</div>
  <div class="devices">▯ ▭ &nbsp;iPhone, iPad</div>
  <div class="hr"></div><div style="height:16px"></div>${more(DESC)}
  <button class="devrow" data-sub="v-dev"><span><b>TEEQA</b><span>Développeur</span></span>${CHEV}</button>
  <div style="height:22px"></div>
  <div class="cardk"><h3>${laurel('Choix de la rédaction')}</h3><p>Suivre un chantier à distance devient limpide et rassurant : six étapes, des photos prises sur place et un avis signé avant chaque paiement.</p></div>
  <button data-sub="v-revs" style="display:block;width:100%;text-align:left"><h2 class="sec">Notes et avis ${CHEV}</h2></button>
  <div class="rate"><span class="big">4,9</span><span class="r"><span class="stars">${STAR5}</span>1,4 M d'avis</span></div>
  <p class="h3">Avis les plus utiles</p><div class="hs">${REVIEWS.slice(0, 6).map(rev).join('')}</div>
  <p class="tap">Toucher pour noter</p><div class="tapstars" id="tapstars">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" aria-label="${n} étoile${n > 1 ? 's' : ''}">☆</button>`).join('')}</div>
  <div class="two"><button data-sheet="write">✎ Rédiger un avis</button><button data-sheet="help">ⓘ Assistance</button></div>
  <button data-sheet="privacy" style="display:block;width:100%;text-align:left"><h2 class="sec">Confidentialité de l'app ${CHEV}</h2></button>
  <p class="pad muted" style="margin:0;font-size:15px">Le développeur, <b style="color:#fff">TEEQA</b>, a indiqué que le traitement des données peut se faire comme décrit ci-dessous. <button class="blue" data-sheet="privacy">En savoir plus</button></p>
  <div class="priv"><svg class="pi" viewBox="0 0 38 38"><path d="M19 4l12 5v9c0 8-5 13-12 16C12 31 7 26 7 18V9z"/><path d="M13 19l4 4 8-9"/></svg><b>Données non utilisées pour vous suivre</b><p>Aucune donnée de cette app ne sert à vous pister sur d'autres apps ou sites.</p></div>
  <div class="priv"><svg class="pi" viewBox="0 0 38 38"><circle cx="19" cy="19" r="15"/><circle cx="19" cy="15" r="5"/><path d="M9 30c2-5 6-7 10-7s8 2 10 7"/></svg><b>Données liées à votre identité</b><p>Les données suivantes peuvent être liées à votre identité :</p><ul><li>Coordonnées</li><li>Photos de chantier</li><li>Avis signés</li><li>Identifiants</li></ul></div>
  <h2 class="sec">Accessibilité</h2><p class="pad muted" style="margin:0;font-size:15px">VoiceOver, texte plus grand, contraste, réduction des animations. <button class="blue" data-sheet="access">En savoir plus</button></p>
  <h2 class="sec">Informations</h2><div class="info">${INFO.map(([k, v, d]) => d ? `<button data-info><span class="l"><span>${k}</span><span>${v}<svg class="chev" viewBox="0 0 9 15"><path d="M1.500 1.500 L7.500 7.500 L1.500 13.500"/></svg></span></span><span class="d">${d}</span></button>` : `<div><span class="l"><span>${k}</span><span>${v}</span></span></div>`).join('')}
    <a href="vitrine.html"><span>Site web du développeur</span><span>↗</span></a><a href="./#/privacy"><span>Engagement de confidentialité</span><span>✋</span></a></div>
  <h2 class="sec">À la une</h2><div class="feat"><div class="mos">${['p12', 'p6', 'p8', 'p3'].map(p => `<img src="assets/photos/${p}.webp" alt="">`).join('')}</div><small>Dans les coulisses</small><b>Comment TEEQA veut rendre la confiance à ceux qui construisent de loin</b></div>
  <h2 class="sec">Du même développeur ${CHEV}</h2>
  <div class="app">${fake('✓', '#17604B')}<span class="grow"><b>TEEQA Contrôleur</b><span>Visites et avis sur place</span></span><button class="get soft">Obtenir</button></div>
  <div class="app">${fake('6', '#C26A42')}<span class="grow"><b>TEEQA Guide</b><span>Les 6 étapes expliquées</span></span><button class="get soft">Obtenir</button></div>
  <h2 class="sec">Vous aimerez peut-être aussi ${CHEV}</h2>
  <div class="app">${fake('▦', '#3A6EA5')}<span class="grow"><b>Plans et métrés</b><span>Dessinez vos pièces en 2D</span></span><button class="get soft">Obtenir</button></div>
  <div class="app">${fake('✎', '#8A5A34')}<span class="grow"><b>Carnet de travaux</b><span>Notes et dépenses de rénovation</span></span><button class="get soft">Obtenir</button></div>
  <div class="app">${fake('▤', '#6B4FA0')}<span class="grow"><b>Numériseur de documents</b><span>Devis et factures en PDF</span></span><button class="get soft">Obtenir</button></div>
  <p class="proj"><b>Projection.</b> Cette fiche est une maquette : TEEQA n'est pas encore publiée. La note, les avis, la récompense, le classement et le nombre de téléchargements sont imaginés pour montrer à quoi la fiche pourrait ressembler. Les autres applications citées n'existent pas.</p>
</section>

<div class="navb" id="navb" hidden><button class="round" data-back aria-label="Retour à la recherche">${BACK}</button><span class="mini">${ic(34)}</span><button class="round share" data-share aria-label="Partager"><svg viewBox="0 0 20 20"><path d="M10 13V2.500M6 6l4-4 4 4M5 9H4v9h12V9h-1"/></svg></button>${getBtn()}</div>

<section class="view sub" id="v-dev"><div class="sbar" style="align-items:center"><button class="round" data-close>${BACK}</button><b style="font-size:17px">TEEQA</b></div>
  <h2 class="sec">Dernière sortie</h2><div class="app">${ic(62)}<span class="grow"><b>TEEQA : Suivi de chantier</b><span>Construire à distance, sereinement</span></span>${getBtn()}</div>
  <h2 class="sec">Apps</h2><div class="app">${fake('✓', '#17604B')}<span class="grow"><b>TEEQA Contrôleur</b><span>Visites et avis sur place</span></span><button class="get soft">Obtenir</button></div>
  <div class="app">${fake('6', '#C26A42')}<span class="grow"><b>TEEQA Guide</b><span>Les 6 étapes expliquées</span></span><button class="get soft">Obtenir</button></div></section>

<section class="view sub" id="v-revs"><div class="sbar" style="align-items:center"><button class="round" data-close>${BACK}</button><b style="font-size:17px;flex:1;text-align:center;margin-right:46px">Notes et avis</b></div>
  <div class="rate"><span class="big">4,9</span><span class="r"><span class="stars">${STAR5}</span>1,4 M d'avis</span></div><p class="h3">Les plus utiles ⌄</p><div class="list">${REVIEWS.map(rev).join('')}</div></section>

<div class="dim" id="dim"></div>
<section class="sheet" id="sheet" role="dialog" aria-modal="true"></section>
<div class="zoom" id="zoom"><button class="x" data-zoomx>OK</button><div class="hs">${POSTERS.map((_, i) => poster(i, 'div')).join('')}</div></div>
<nav class="tabs" aria-label="Boutique">${TABS.map(([t, d], i) => `<button class="${i === 4 ? 'on' : ''}" ${i === 4 ? 'data-back' : ''}><svg viewBox="0 0 24 24"><path d="${d}"/></svg>${t}</button>`).join('')}</nav>
<div class="splash" id="splash">${ic(124)}<b>TEEQA</b></div>`;

// ---------- Comportements ----------
const vApp = $('#v-app'), navb = $('#navb'), sheet = $('#sheet'), dim = $('#dim');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let installed = false; try { installed = localStorage.getItem('teeqa-projection-obtenu') === '1'; } catch { /* stockage indisponible */ }
const syncGet = () => $$('[data-get]').forEach(b => { if (!b.classList.contains('load')) b.textContent = installed ? 'Ouvrir' : 'Obtenir'; });

function type() { const q = $('#q'), w = 'teeqa'; $('#results').hidden = true; q.innerHTML = '<i></i>'; let n = 0;
  const step = () => { n++; q.innerHTML = w.slice(0, n) + '<i></i>'; if (n < w.length) setTimeout(step, reduce ? 0 : 110); else setTimeout(() => { q.textContent = w; $('#results').hidden = false; }, reduce ? 0 : 260); };
  setTimeout(step, reduce ? 0 : 350); }
function openApp() { vApp.classList.add('on'); navb.hidden = false; vApp.scrollTop = 0; onScroll(); history.replaceState(null, '', '#fiche'); }
function closeApp() { vApp.classList.remove('on'); navb.hidden = true; history.replaceState(null, '', location.pathname); }
function onScroll() { navb.classList.toggle('stuck', vApp.scrollTop > 190); }
vApp.addEventListener('scroll', onScroll, { passive: true });

function launch(from) { const a = root.getBoundingClientRect(), r = from.getBoundingClientRect(), s = $('#splash');
  s.style.setProperty('--x', `${r.left + r.width / 2 - a.left}px`); s.style.setProperty('--y', `${r.top + r.height / 2 - a.top}px`); s.classList.add('on');
  setTimeout(() => { location.href = './'; }, reduce ? 300 : 1700); }
function get(b) { if (installed) return launch(b); b.classList.add('load'); b.textContent = '';
  setTimeout(() => { installed = true; try { localStorage.setItem('teeqa-projection-obtenu', '1'); } catch { /* stockage indisponible */ } b.classList.remove('load'); syncGet(); }, reduce ? 200 : 1300); }

const SHEETS = {
  privacy: `<div class="art"><svg viewBox="0 0 110 110"><path d="M55 12l34 14v26c0 22-14 37-34 46C35 89 21 74 21 52V26z"/><path d="M40 55l11 11 20-23"/></svg></div><div class="in"><small>EN DÉTAIL</small><h3>La confidentialité de l'app, en clair</h3><p>Chaque fiche résume, avec les mots du développeur, quelles données l'application utilise et pourquoi.</p><p>Pour TEEQA : vos coordonnées, vos photos de chantier et vos avis signés servent à faire fonctionner le suivi entre le client, l'entreprise et le contrôleur. Rien ne sert à vous pister ailleurs.</p><p>Le chantier n'est jamais public : on y entre seulement par invitation.</p></div>`,
  access: `<div class="art" style="background:linear-gradient(160deg,#30B0C7,#0A84FF)"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="42"/><circle cx="55" cy="34" r="6"/><path d="M32 46h46M55 46v22M55 68l-12 20M55 68l12 20"/></svg></div><div class="in"><small>EN DÉTAIL</small><h3>À propos des étiquettes d'accessibilité</h3><p>Elles indiquent quelles aides de l'iPhone l'application prend en charge.</p><p>TEEQA : lecture d'écran, texte plus grand, contraste suffisant en clair comme en sombre, et un réglage « Réduire les animations » qui fige tous les mouvements sans rien retirer.</p></div>`,
  write: `<div class="in" style="padding-top:60px"><h3>Rédiger un avis</h3><p>Cette fiche est une maquette : votre avis n'est envoyé nulle part.</p><textarea placeholder="Votre avis (facultatif)"></textarea><button class="send" data-sheetx>Fermer</button></div>`,
  help: `<div class="in" style="padding-top:60px"><h3>Assistance</h3><p>Une question sur TEEQA ? L'aide est dans l'application : Profil, puis Aide.</p><button class="send" data-sheetx>Fermer</button></div>`,
};
function openSheet(k) { sheet.innerHTML = `<button class="x" data-sheetx aria-label="Fermer">✕</button>${SHEETS[k]}`; sheet.scrollTop = 0; sheet.classList.add('on'); dim.classList.add('on'); }
function closeSheet() { sheet.classList.remove('on'); dim.classList.remove('on'); }
dim.addEventListener('click', closeSheet);

root.addEventListener('click', (e) => {
  const t = e.target, on = (s) => t.closest(s);
  let b;
  if ((b = on('[data-get]'))) { e.stopPropagation(); return get(b); }
  if (on('[data-retype]')) return type();
  if (on('[data-more]')) return on('.more').classList.add('open');
  if ((b = on('[data-info]'))) return b.classList.toggle('open');
  if ((b = on('[data-star]'))) { const n = +b.dataset.star; $$('#tapstars button').forEach((x, i) => { x.textContent = i < n ? '★' : '☆'; x.classList.toggle('on', i < n); }); if (navigator.vibrate) navigator.vibrate(8); return; }
  if ((b = on('[data-sheet]'))) return openSheet(b.dataset.sheet);
  if (on('[data-sheetx]')) return closeSheet();
  if ((b = on('[data-zoom]'))) { const z = $('#zoom'); z.classList.add('on'); const p = $$('.poster', z)[+b.dataset.zoom]; p.scrollIntoView({ inline: 'center', block: 'nearest' }); return; }
  if (on('[data-zoomx]')) return $('#zoom').classList.remove('on');
  if ((b = on('.list [data-rev]'))) return b.classList.add('open');
  if (on('[data-rev]')) return $('#v-revs').classList.add('on');
  if ((b = on('[data-sub]'))) return $('#' + b.dataset.sub).classList.add('on');
  if ((b = on('[data-close]'))) return b.closest('.view').classList.remove('on');
  if (on('[data-share]')) { if (navigator.share) navigator.share({ title: 'TEEQA', url: location.href }).catch(() => {}); return; }
  if (on('[data-back]')) { $$('.view.sub').forEach(v => v.classList.remove('on')); return closeApp(); }
  if (on('[data-open]')) return openApp();
});

syncGet();
if (location.hash === '#fiche') { $('#q').textContent = 'teeqa'; $('#results').hidden = false; openApp(); } else type();
