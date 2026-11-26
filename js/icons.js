// Jeu d'icônes vectorielles TEEQA — grille 24, trait 2 px, terminaisons et angles ronds, sans remplissage.
// Dessinées pour ce prototype ; seule source d'icônes de l'app (aucun emoji, aucune image).
// Règles : marge 2,5 px, rayons 1,5 (petits cadres) / 2–2,5 (cadres), points = trait de 0,01 à capuchon rond.
const P = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  cloudUp: '<path d="M7.5 18.5H7a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 9h-.5"/><path d="M12 13v7.5M9 16l3-3 3 3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.8"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8 8.5"/>',
  trowel: '<path d="M3.5 20.5L8 9l7 7z"/><path d="M11.5 12.5L15 9"/><path d="M15 9l5-5"/>',
  wall: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
  foundation: '<path d="M2.5 13h19"/><rect x="4" y="16" width="16" height="4.5" rx="1.5"/><path d="M8 4v12M16 4v12"/>',
  // Toiture-terrasse : dalle + acrotère crénelé sur poteaux (ne ressemble plus à « maison »)
  roof: '<path d="M3 10.5h18"/><path d="M4 10.5V7h3v2h3.5V7h3v2H17V7h3v3.5"/><rect x="3" y="10.5" width="18" height="4" rx="1.5"/><path d="M6.5 14.5v6M17.5 14.5v6"/>',
  window: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M12 3.5v17M4 12h16"/>',
  plug: '<path d="M9 3.5v4M15 3.5v4"/><path d="M6.5 7.5h11V11a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.5v4"/>',
  brush: '<path d="M20 4l-7.5 7.5"/><path d="M10.5 9.5l4 4"/><path d="M10.5 9.5L6 14c-1.5 1.5-1.5 3.5-2.5 6.5 3-1 5-1 6.5-2.5l4.5-4.5"/>',
  key: '<circle cx="7.5" cy="15.5" r="4"/><path d="M10.5 12.5L20 3"/><path d="M15.5 7.5l3 3M18 5l2 2"/>',
  hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M8 3.5v3a4 4 0 0 0 1.6 3.2L12 12l-2.4 1.8A4 4 0 0 0 8 17v3.5M16 3.5v3a4 4 0 0 1-1.6 3.2L12 12l2.4 1.8A4 4 0 0 1 16 17v3.5"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4.5h11.5l-2.5 4 2.5 4H5"/>',
  alert: '<path d="M10.3 4.3L2.6 17.6A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-2.9L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
  message: '<path d="M6.5 4.5h11A2.5 2.5 0 0 1 20 7v7a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4A2.5 2.5 0 0 1 4 14V7a2.5 2.5 0 0 1 2.5-2.5z"/><path d="M8.5 9h7M8.5 12h4.5"/>',
  link: '<path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1 1"/><path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1-1"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  share: '<path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M6 11H5a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 5 21h14a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 19 11h-1"/>',
  revoke: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  file: '<path d="M14 3.5H7.5A2 2 0 0 0 5.5 5.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
  pen: '<path d="M4 20l1.2-4.6L16 4.6a2 2 0 0 1 2.8 2.8L8 18.2z"/><path d="M14 6.5l3.5 3.5"/>',
  wifiOff: '<path d="M3 3l18 18"/><path d="M8.5 16.2a5 5 0 0 1 6 -.6M5 12.7a10 10 0 0 1 4.2-2.5M14.8 10.2a10 10 0 0 1 4.2 2.5M2 9.2a15 15 0 0 1 4.3-2.7M10.5 5.1A15 15 0 0 1 22 9.2"/><path d="M12 19.5h.01"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20.5V16h-4.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17h.01"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  send: '<path d="M20.5 3.5L3.5 10.5l7 3 3 7z"/><path d="M10.5 13.5l10-10"/>',
  more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="2"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16.5L5.5 12 10 7.5M5.5 12H15"/>',
  play: '<path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>',
  building: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01"/><path d="M10 20.5v-4h4v4"/>',
  grid: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M12 3.5v17M3.5 12h17"/><path d="M12 8l4 4-4 4-4-4z"/>',
  bolt: '<path d="M13.5 2.5L4.5 13.5H12l-1.5 8 9-11H12z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  doc2: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M16 13h.1M3 10h18M6 6V4.5h11V6"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.5"/><rect x="14" y="4.5" width="4" height="15" rx="1.5"/>',
  // 19 nov. : vocaux, lecture à voix haute, langue, livraison.
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5z"/>',
  truck: '<path d="M3 6.5h10.5v9H3zM13.5 9.5h4l3 3.2v2.8h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
};

// Icônes « réelles » en 3D (demande de l'utilisateur, 11 nov.) : dès qu'un fichier assets/icones-3d/<nom>.webp est rangé
// et que son nom est ajouté à ICON_3D_READY, il remplace le dessin au trait partout dans l'appli, sans autre changement.
// La liste à générer et les prompts : refs/journal/HIGGSFIELD-LOT-3-ICONES.md. Les flèches de navigation restent au trait.
// 11 nov. au soir : les 32 sont rangées (dessinées puis mises en volume par icones-matiere.mjs, faute de génération possible ici).
export const ICON_3D_READY = ['hourglass', 'bell', 'pen', 'wallet', 'camera'];   // 11 nov. soir : les 5 générées (Canva). Les 27 autres restent au trait tant qu'elles ne sont pas générées au même niveau.
export function icon(name, cls = '') {
  if (ICON_3D_READY.includes(name)) return `<img class="i i3d ${cls}" src="assets/icones-3d/${name}.webp" alt="" aria-hidden="true" decoding="async" draggable="false" data-icon="${name}">`;
  const d = P[name];
  if (!d) console.warn(`icône inconnue : ${name}`);
  // Le style de trait est porté par le composant : même rendu même hors de app.css.
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-icon="${name}">${d || P.info}</svg>`;
}
export const ICONS = Object.keys(P);
