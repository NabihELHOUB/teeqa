// M04 et M05 (11 nov.) : fiche professionnelle de l'entreprise, référencement, et annuaire « Trouver un professionnel ».
// Règles : aucun prix ; aucune note ni classement par TEEQA (problème 24 : seulement des faits et les avis de clients après clôture) ; TEEQA ne « vérifie » pas une entreprise. Le référencement dit seulement
// où en est le dossier de justificatifs (non demandé, en cours, complet), et l'écran rappelle que ce n'est pas une garantie.
// L'annuaire est un jeu d'exemples (comme Karim, Rachid et Amina) ; seule la fiche de l'entreprise du chantier se modifie.
import { actions, get, access, ROLES, proIdOf, ENGAGEMENTS, REGLES, PILOTE, CLOS_ID, project, prix, TARIFS } from '../store.js';
import { icon } from '../icons.js';
import { photoSrc, stepIcon3D } from '../art.js';
import { appbar, esc, fmtDate, toast, sfx, avatar, trial, trialPick, piloteCard } from '../ui.js';
import { go } from '../app.js';

const DOCS = ['Registre de commerce', "Attestation d'assurance décennale", 'Patente', 'Attestation CNSS'];
// Vague 3 : un artisan ou un tâcheron (auto-entrepreneur) n'a ni registre de commerce ni patente : ses justificatifs sont les siens.
const DOCS_ARTISAN = ["Carte d'auto-entrepreneur ou attestation de tâcheron", 'Identifiant fiscal (IF)', 'Assurance responsabilité civile et décennale', 'Affiliation CNSS / AMO'];
const docsOf = (p) => p.statut === 'artisan' ? DOCS_ARTISAN : DOCS;
const STATUT = { societe: 'Entreprise (société)', artisan: 'Artisan · auto-entrepreneur' };
const BASE = [
  { id: 'rachid', trade: 'Gros œuvre et maçonnerie', zone: 'Nador et Berkane, Oriental', region: 'Oriental', since: 2011, team: '12 personnes', email: 'contact@rachid-btp.ma',
    about: 'Construction de villas et de maisons individuelles, du terrassement aux finitions. Chantiers suivis étape par étape.',
    works: [['Villa Les Orangers, suivie avec TEEQA (rapport publié avec l’accord de la cliente)', 'Berkane', 2026, 3], ['Villa R+1', 'Nador', 2025, 1], ["Extension d'une maison", 'Berkane', 2024, 0], ['Dalle et toiture-terrasse', 'Nador', 2024, 2]], docs: [1, 1, 1, 1], listing: 'complet' },   // vague 13 : CNSS déposée (entreprise du chantier d'exemple)
  { id: 'atlas', name: 'Atlas Bâtiment', trade: 'Construction générale', zone: 'Oujda, Oriental', region: 'Oriental', since: 2006, team: '30 personnes', email: 'contact@atlas-batiment.ma',
    about: 'Entreprise générale : gros œuvre, second œuvre et finitions pour des maisons et de petits immeubles.',
    works: [['Maison R+2', 'Oujda', 2025, 2], ['Villa avec patio', 'Saïdia', 2024, 5]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'zellij', name: 'Maâlem Zellij Fès', trade: 'Zellige, enduits et finitions', zone: 'Fès, Fès-Meknès', region: 'Fès-Meknès', since: 2016, team: 'le maâlem et 2 compagnons', email: 'atelier@maalem-zellij.ma',
    about: 'Atelier de zellige traditionnel, tadelakt et plâtre sculpté. Pose sur chantier dans tout le nord du Maroc.',
    works: [['Patio en zellige', 'Fès', 2025, 4], ['Salon marocain', 'Meknès', 2024, 4]], docs: [1, 1, 1, 0], listing: 'non_demande', statut: 'artisan' },
  { id: 'rif', name: 'Rif Électricité et Plomberie', trade: 'Menuiseries et réseaux', zone: 'Al Hoceïma et Tanger, Tanger-Tétouan-Al Hoceïma', region: 'Tanger-Tétouan-Al Hoceïma', since: 2015, team: '8 personnes', email: 'contact@rif-reseaux.ma',
    about: 'Électricité, plomberie et menuiseries aluminium pour le logement neuf et la rénovation.',
    works: [['Réseaux d\'une villa', 'Al Hoceïma', 2025, 3]], docs: [1, 1, 0, 1], listing: 'en_cours' },
  // Vague 6 : des professionnels (inventés) dans toutes les régions, pas seulement au Nord et dans l'Oriental.
  { id: 'casabati', name: 'Casa Bâti Moderne', trade: 'Gros œuvre et construction de villas', zone: 'Casablanca, Casablanca-Settat', region: 'Casablanca-Settat', since: 2009, team: '40 personnes', email: 'contact@casabati.ma',
    about: 'Villas et maisons R+1 à R+2 à Casablanca, Bouskoura, Dar Bouazza et Settat, du terrassement au clos-couvert.',
    works: [['Villa R+1', 'Bouskoura', 2025, 1], ['Maison avec sous-sol', 'Settat', 2024, 0]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'saleoeuvre', name: 'Salé Gros Œuvre', trade: 'Gros œuvre et maçonnerie', zone: 'Salé, Rabat-Salé-Kénitra', region: 'Rabat-Salé-Kénitra', since: 2013, team: '15 personnes', email: 'contact@sale-grosoeuvre.ma',
    about: 'Fondations, murs, poteaux et dalles pour des maisons individuelles à Rabat, Salé, Témara et Kénitra.',
    works: [['Maison R+2', 'Témara', 2025, 2], ['Dalle et terrasse', 'Kénitra', 2024, 2]], docs: [1, 1, 1, 0], listing: 'en_cours' },
  { id: 'ocre', name: 'Ocre Bâtisseurs', trade: 'Construction générale', zone: 'Marrakech, Marrakech-Safi', region: 'Marrakech-Safi', since: 2008, team: '22 personnes', email: 'contact@ocre-batisseurs.ma',
    about: 'Villas et riads neufs à Marrakech, Essaouira et dans la palmeraie, gros œuvre et finitions traditionnelles.',
    works: [['Villa avec patio', 'Marrakech', 2025, 5], ['Riad neuf', 'Essaouira', 2024, 4]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'meknesbati', name: 'Meknès Bâti', trade: 'Gros œuvre et maçonnerie', zone: 'Meknès, Fès-Meknès', region: 'Fès-Meknès', since: 2005, team: '18 personnes', email: 'contact@meknes-bati.ma',
    about: 'Maisons individuelles et petits immeubles à Meknès, Fès, El Hajeb et Ifrane.',
    works: [['Maison R+1', 'Meknès', 2025, 1], ['Petit immeuble', 'Fès', 2023, 2]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'tingis', name: 'Tingis Construction', trade: 'Construction générale', zone: 'Tanger, Tanger-Tétouan-Al Hoceïma', region: 'Tanger-Tétouan-Al Hoceïma', since: 2007, team: '26 personnes', email: 'contact@tingis-construction.ma',
    about: 'Villas et maisons à Tanger, Tétouan, Asilah et M’diq, du gros œuvre à la remise des clés.',
    works: [['Villa vue mer', 'Asilah', 2025, 5], ['Maison R+1', 'Tétouan', 2024, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'souss', name: 'Souss Habitat', trade: 'Gros œuvre et construction de villas', zone: 'Agadir, Souss-Massa', region: 'Souss-Massa', since: 2012, team: '20 personnes', email: 'contact@souss-habitat.ma',
    about: 'Maisons et villas à Agadir, Aït Melloul, Taroudant et Tiznit, avec des fondations adaptées aux sols sableux.',
    works: [['Villa R+1', 'Agadir', 2025, 1], ['Maison familiale', 'Tiznit', 2024, 0]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'khenifra', name: 'Khénifra Bâtiment', trade: 'Maçonnerie, main-d’œuvre seule', zone: 'Khénifra et Béni Mellal, Béni Mellal-Khénifra', region: 'Béni Mellal-Khénifra', since: 2014, team: 'le patron et 4 ouvriers', email: 'contact@khenifra-batiment.ma',
    about: 'Tâcheron : main-d’œuvre de maçonnerie (murs de remplissage, enduits) à Béni Mellal, Khénifra et Khouribga ; le client achète les matériaux, le gros œuvre en béton armé reste à une entreprise.',
    works: [['Maçonnerie d’une maison R+1 (main-d’œuvre)', 'Béni Mellal', 2025, 1]], docs: [1, 1, 1, 0], listing: 'en_cours', statut: 'artisan' },
  { id: 'kasbah', name: 'Kasbah Construction', trade: 'Construction en terre et en béton', zone: 'Errachidia, Drâa-Tafilalet', region: 'Drâa-Tafilalet', since: 2010, team: '14 personnes', email: 'contact@kasbah-construction.ma',
    about: 'Maisons en béton armé et en pisé à Errachidia, Ouarzazate, Tinghir et Zagora, adaptées aux fortes chaleurs.',
    works: [['Maison en pisé', 'Tinghir', 2025, 4], ['Maison R+1', 'Ouarzazate', 2024, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'dakhla', name: 'Dakhla Bâtiment', trade: 'Gros œuvre et construction de villas', zone: 'Dakhla, Dakhla-Oued Ed-Dahab', region: 'Sud : Laâyoune-Sakia El Hamra, Dakhla-Oued Ed-Dahab, Guelmim-Oued Noun', since: 2016, team: '10 personnes', email: 'contact@dakhla-batiment.ma',
    about: 'Maisons et villas à Dakhla et Laâyoune, avec des bétons et des enduits protégés de l’air salin.',
    works: [['Villa R+1', 'Dakhla', 2025, 1], ['Maison familiale', 'Laâyoune', 2024, 0]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'noun', name: 'Oued Noun Travaux', trade: 'Gros œuvre et finitions', zone: 'Guelmim, Guelmim-Oued Noun', region: 'Sud : Laâyoune-Sakia El Hamra, Dakhla-Oued Ed-Dahab, Guelmim-Oued Noun', since: 2011, team: '9 personnes', email: 'contact@ouednoun-travaux.ma',
    about: 'Maisons individuelles à Guelmim, Tan-Tan et Sidi Ifni, du terrassement aux enduits.',
    works: [['Maison R+1', 'Guelmim', 2025, 2]], docs: [1, 1, 0, 1], listing: 'en_cours' },
  // Vague 10 : un annuaire plus fourni dans chaque région (professionnels inventés, plausibles ; aucune note, aucun classement).
  { id: 'berkane', name: 'Berkane Gros Œuvre', trade: 'Gros œuvre et maçonnerie', zone: 'Berkane, Oriental', region: 'Oriental', since: 2012, team: '11 personnes', email: 'contact@berkane-go.ma',
    about: 'Maisons R+1 à Berkane, Saïdia et Ahfir : fondations, poteaux, dalles.', works: [['Maison R+1', 'Saïdia', 2025, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'selouane', name: 'Selouane Construction', trade: 'Construction générale', zone: 'Selouane et Driouch, Oriental', region: 'Oriental', since: 2017, team: 'le patron et 3 ouvriers', email: 'contact@selouane-construction.ma',
    about: 'Tâcheron : main-d’œuvre de maçonnerie pour des extensions autour de Nador, matériaux achetés par le client.', works: [["Extension d'une maison", 'Driouch', 2025, 0]], docs: [1, 1, 0, 1], listing: 'en_cours', statut: 'artisan' },
  { id: 'bouskoura', name: 'Bouskoura Habitat', trade: 'Villas clés en main', zone: 'Bouskoura et Dar Bouazza, Casablanca-Settat', region: 'Casablanca-Settat', since: 2010, team: '35 personnes', email: 'contact@bouskoura-habitat.ma',
    about: 'Villas neuves du terrassement aux finitions, avec un conducteur de travaux par chantier.', works: [['Villa R+1 avec piscine', 'Dar Bouazza', 2025, 5]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'eljadida', name: 'Doukkala Bâtiment', trade: 'Gros œuvre et finitions', zone: 'El Jadida et Settat, Casablanca-Settat', region: 'Casablanca-Settat', since: 2014, team: '16 personnes', email: 'contact@doukkala-batiment.ma',
    about: 'Maisons individuelles et petits immeubles R+2 à El Jadida, Azemmour et Settat.', works: [['Immeuble R+2', 'El Jadida', 2024, 2]], docs: [1, 1, 1, 0], listing: 'en_cours' },
  { id: 'temara', name: 'Témara Travaux', trade: 'Rénovation et extension', zone: 'Témara et Skhirat, Rabat-Salé-Kénitra', region: 'Rabat-Salé-Kénitra', since: 2016, team: '8 personnes', email: 'contact@temara-travaux.ma',
    about: 'Rénovation de maisons anciennes, surélévations et extensions.', works: [['Surélévation R+1', 'Témara', 2025, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'kenitra', name: 'Sebou Construction', trade: 'Gros œuvre et maçonnerie', zone: 'Kénitra et Sidi Slimane, Rabat-Salé-Kénitra', region: 'Rabat-Salé-Kénitra', since: 2009, team: '20 personnes', email: 'contact@sebou-construction.ma',
    about: 'Fondations sur sols humides du Gharb, maisons et petits immeubles.', works: [['Maison R+1', 'Kénitra', 2025, 0]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'safi', name: 'Abda Bâtisseurs', trade: 'Gros œuvre et étanchéité', zone: 'Safi et Youssoufia, Marrakech-Safi', region: 'Marrakech-Safi', since: 2013, team: '13 personnes', email: 'contact@abda-batisseurs.ma',
    about: 'Maisons et toitures-terrasses étanchées à Safi, Youssoufia et Essaouira.', works: [['Toiture-terrasse', 'Safi', 2025, 2]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'tensift', name: 'Tensift Maçonnerie', trade: 'Maçonnerie, main-d’œuvre seule', zone: 'Marrakech et Chichaoua, Marrakech-Safi', region: 'Marrakech-Safi', since: 2018, team: 'le patron et 6 ouvriers', email: 'contact@tensift-maconnerie.ma',
    about: 'Tâcheron en gros œuvre pour des maisons R+1 autour de Marrakech.', works: [['Maison R+1', 'Tamansourt', 2025, 1]], docs: [1, 1, 0, 0], listing: 'non_demande', statut: 'artisan' },
  { id: 'sefrou', name: 'Saïss Bâti', trade: 'Construction générale', zone: 'Fès et Sefrou, Fès-Meknès', region: 'Fès-Meknès', since: 2011, team: '19 personnes', email: 'contact@saiss-bati.ma',
    about: 'Maisons familiales à Fès, Sefrou et Taza, du terrassement aux enduits.', works: [['Maison R+2', 'Sefrou', 2024, 2]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'hoceima', name: 'Nekor Bâtiment', trade: 'Gros œuvre parasismique', zone: 'Al Hoceïma et Imzouren, Tanger-Tétouan-Al Hoceïma', region: 'Tanger-Tétouan-Al Hoceïma', since: 2005, team: '17 personnes', email: 'contact@nekor-batiment.ma',
    about: 'Maisons en zone sismique : chaînages, poteaux et dalles selon les règles parasismiques.', works: [['Maison R+1', 'Imzouren', 2025, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'tiznit', name: 'Tiznit Construction', trade: 'Gros œuvre et finitions', zone: 'Tiznit et Sidi Ifni, Souss-Massa', region: 'Souss-Massa', since: 2015, team: '10 personnes', email: 'contact@tiznit-construction.ma',
    about: 'Maisons familiales pour des familles du Souss installées en France et en Belgique.', works: [['Maison familiale', 'Tiznit', 2025, 0]], docs: [1, 1, 1, 0], listing: 'en_cours' },
  { id: 'taroudant', name: 'Taroudant Bâtisseurs', trade: 'Construction en béton et en pisé', zone: 'Taroudant et Ouled Teïma, Souss-Massa', region: 'Souss-Massa', since: 2008, team: '14 personnes', email: 'contact@taroudant-batisseurs.ma',
    about: 'Maisons en béton armé et restauration de maisons en pisé.', works: [['Maison en pisé restaurée', 'Taroudant', 2024, 4]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'khouribga', name: 'Phosphate Bâtiment', trade: 'Gros œuvre et VRD', zone: 'Khouribga et Oued Zem, Béni Mellal-Khénifra', region: 'Béni Mellal-Khénifra', since: 2010, team: '24 personnes', email: 'contact@phosphate-batiment.ma',
    about: 'Maisons, voiries et réseaux divers pour des lotissements de la région.', works: [['Maison R+1', 'Khouribga', 2025, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
  { id: 'ouarzazate', name: 'Dadès Construction', trade: 'Construction générale', zone: 'Ouarzazate et Tinghir, Drâa-Tafilalet', region: 'Drâa-Tafilalet', since: 2013, team: '12 personnes', email: 'contact@dades-construction.ma',
    about: 'Maisons adaptées aux fortes chaleurs : murs épais, terrasses ventilées.', works: [['Maison R+1', 'Ouarzazate', 2025, 1]], docs: [1, 1, 0, 1], listing: 'en_cours' },
  { id: 'laayoune', name: 'Sakia Bâtiment', trade: 'Gros œuvre et construction de villas', zone: 'Laâyoune et Boujdour, Laâyoune-Sakia El Hamra', region: 'Sud : Laâyoune-Sakia El Hamra, Dakhla-Oued Ed-Dahab, Guelmim-Oued Noun', since: 2012, team: '15 personnes', email: 'contact@sakia-batiment.ma',
    about: 'Villas et maisons à Laâyoune, bétons protégés du vent de sable.', works: [['Villa R+1', 'Laâyoune', 2025, 1]], docs: [1, 1, 1, 1], listing: 'complet' },
];
// Problème 24 (19 nov.) : plus de note ni de classement. TEEQA ne note pas les entreprises ; chaque fiche montre des faits
// (années d'activité, équipe, justificatifs déposés) et le nombre d'avis publics laissés par des clients après la clôture de leur chantier.
const NO_RANK = "TEEQA ne classe pas les entreprises et ne publie aucune note : il dit quels justificatifs sont déposés et montre les avis publics des clients, écrits après la fin de leur chantier.";
const years = (p) => Math.max(1, new Date().getFullYear() - p.since);
const facts = (p) => { const nd = p.docs.filter(Boolean).length, na = avisOf(p.id).length;
  return [`${years(p)} an${years(p) > 1 ? 's' : ''} d'activité`, esc(p.team), `${nd} justificatif${nd > 1 ? 's' : ''} sur ${docsOf(p).length}`, na ? `${na} avis de client${na > 1 ? 's' : ''}` : "Aucun chantier clôturé dans TEEQA pour l'instant"]; };
// Vague 9 : dans la liste, les faits tiennent sur une ligne ; « aucun avis » n'est dit qu'une fois, en tête de liste.
const factLine = (p) => { const na = avisOf(p.id).length;   // vague 11 : l'état des justificatifs est déjà sur le badge
  return `<div class="s">${years(p)} an${years(p) > 1 ? 's' : ''} · ${esc(p.team)}${na ? ` · ${na} avis de client${na > 1 ? 's' : ''}` : ''}</div>`; };
const factChips = (p) => `<div class="chips" style="margin-top:6px">${facts(p).map((f) => `<span class="chip outline" style="white-space:normal;height:auto;min-height:28px;padding-block:4px">${f}</span>`).join('')}</div>`;
// La fiche de l'entreprise connectée (une seule constante, au lieu de « rachid » écrit partout).
const MY_PRO_ID = 'rachid';
const DAY = 86400000, ANSWER_DAYS = 5;
// Panel du 19 nov. : un seul état de référencement, cohérent avec les justificatifs (plus de « Dossier complet » à côté de
// « Référencement non demandé ») : incomplet → à demander → en cours d'examen → référencé. L'entreprise du chantier n'a
// « demandé » que si elle a envoyé la demande (askedAt) ; les fiches d'exemple gardent leur état.
const LISTING = { incomplet: ['Justificatifs à compléter', '', 'info'], a_demander: ['Référencement non demandé', '', 'info'], en_cours: ['Dossier en cours d\'examen', 'saffron', 'hourglass'], complet: ['Justificatifs déposés (non vérifiés par TEEQA)', '', 'file'] };
const listingKey = (p) => !p.docs.every(Boolean) ? 'incomplet' : p.listing === 'complet' ? 'complet' : p.listing === 'en_cours' && (p.askedAt || p.id !== MY_PRO_ID) ? 'en_cours' : 'a_demander';
// La fiche de l'entreprise du chantier : la base, plus ce qu'elle a modifié (gardé dans l'état, clé `pro`).
const own = () => get().pro || {};
export function pros() {
  return BASE.map((b) => b.id !== MY_PRO_ID ? b : { ...b, name: ROLES.entreprise.name, ...(({ zone, about, listing, askedAt, remindedAt }) => ({ ...(zone ? { zone } : {}), ...(about ? { about } : {}), ...(listing ? { listing } : {}), askedAt, remindedAt }))(own()),
    docs: b.docs.map((d, i) => (own().docs && own().docs[i]) ? 1 : d), files: own().docs || {} });
}
export const proOf = (id) => pros().find((p) => p.id === id);
// Logos de marque (12 nov., retour de l'utilisateur : « il faut que ce soit brandé, comme de vraies entreprises »). Quatre marques
// dessinées pour les entreprises d'exemple : un signe, deux couleurs, un nom composé. L'entreprise du chantier garde son logo si elle change de nom.
const MARQUES = {
  rachid: ['#B8603A', '#FBF3E6', (c, f) => `<path d="M14 46 V26 a18 18 0 0 1 36 0 V46 H40 V28 a8 8 0 0 0 -16 0 V46 Z" fill="${f}"/><path d="M12 50 H52" stroke="${f}" stroke-width="4" stroke-linecap="round"/>`, 'BTP'],
  atlas: ['#16324F', '#F4EFE4', (c, f) => `<path d="M8 46 L24 20 L32 32 L40 16 L56 46 Z" fill="${f}"/><path d="M40 16 L45 25 L40 28 L35 24 Z" fill="${c}" opacity=".35"/><circle cx="48" cy="14" r="4" fill="#E2A33B"/>`, 'BÂTIMENT'],
  zellij: ['#0E3B31', '#E2A33B', (c, f) => { let d = ''; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, q = i % 2 ? 11 : 21; d += `${i ? 'L' : 'M'}${(32 + Math.cos(a) * q).toFixed(1)} ${(32 + Math.sin(a) * q).toFixed(1)} `; } return `<path d="${d}Z" fill="${f}"/><circle cx="32" cy="32" r="6" fill="${c}"/><circle cx="32" cy="32" r="2.4" fill="#F4EFE4"/>`; }, 'FÈS · ZELLIGE'],
  casabati: ['#2F3A56', '#F4EFE4', (c, f) => `<path d="M10 48 V24 L32 10 L54 24 V48 Z" fill="${f}"/><path d="M26 48 V34 H38 V48" fill="${c}"/>`, 'CONSTRUCTION'],
  saleoeuvre: ['#6B4A2B', '#F7EBDA', (c, f) => `<path d="M10 20 H54 V28 H10 Z M10 32 H30 V40 H10 Z M34 32 H54 V40 H34 Z M10 44 H54 V50 H10 Z" fill="${f}"/>`, 'GROS ŒUVRE'],
  ocre: ['#B5562F', '#FBEFE2', (c, f) => `<path d="M12 50 V26 a20 20 0 0 1 40 0 V50 Z" fill="${f}"/><path d="M26 50 V36 a6 6 0 0 1 12 0 V50 Z" fill="${c}"/>`, 'BÂTISSEURS'],
  meknesbati: ['#3F5E2B', '#F2F0E3', (c, f) => `<path d="M12 50 V20 H22 V14 H42 V20 H52 V50 Z" fill="${f}"/><path d="M28 50 V38 a4 4 0 0 1 8 0 V50 Z" fill="${c}"/>`, 'BÂTI'],
  tingis: ['#145C7A', '#EAF6FA', (c, f) => `<path d="M8 44 Q20 34 32 44 T56 44 V50 H8 Z" fill="${f}"/><path d="M22 36 V16 H42 V36 Z" fill="${f}"/>`, 'CONSTRUCTION'],
  souss: ['#C7832C', '#FFF6E6', (c, f) => `<circle cx="44" cy="18" r="7" fill="${f}"/><path d="M8 50 L24 28 L36 42 L44 34 L56 50 Z" fill="${f}"/>`, 'HABITAT'],
  khenifra: ['#5B5F66', '#F1F1EE', (c, f) => `<path d="M12 50 V30 L32 16 L52 30 V50 Z" fill="${f}"/><path d="M18 50 V38 H46 V50" fill="none" stroke="${c}" stroke-width="3"/>`, 'BÂTIMENT'],
  kasbah: ['#9A4A2A', '#F6E6D3', (c, f) => `<path d="M10 50 V22 L16 18 L22 22 V16 H42 V22 L48 18 L54 22 V50 Z" fill="${f}"/><path d="M28 50 V40 H36 V50 Z" fill="${c}"/>`, 'CONSTRUCTION'],
  dakhla: ['#0F6E73', '#EFFAF8', (c, f) => `<path d="M8 46 Q20 38 32 46 T56 46 V52 H8 Z" fill="${f}"/><path d="M18 40 V22 H46 V40 Z" fill="${f}"/>`, 'BÂTIMENT'],
  noun: ['#7A5A1E', '#FBF2DE', (c, f) => `<path d="M10 50 L32 14 L54 50 Z" fill="${f}"/><path d="M26 50 V40 H38 V50 Z" fill="${c}"/>`, 'TRAVAUX'],
  rif: ['#1C6FB8', '#FFFFFF', (c, f) => `<path d="M36 8 L18 36 H30 L26 56 L46 26 H34 Z" fill="${f}"/><path d="M48 40 c5 7 7 10 7 13 a7 7 0 0 1 -14 0 c0 -3 2 -6 7 -13 Z" fill="#8FD0F5"/>`, 'RÉSEAUX'],
};
const logo = (p, size = 44) => { const [c, f, draw] = MARQUES[p.id] || MARQUES.rachid; return `<svg class="pz-logo" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Logo ${esc(p.name)}"><rect width="64" height="64" rx="15" fill="${c}"/>${draw(c, f)}</svg>`; };
const marque = (p) => { const [c, , , tag] = MARQUES[p.id] || MARQUES.rachid, n = (p.name || '').replace(/\s*(BTP|Bâtiment|Bâti|Zellij Fès|Électricité et Plomberie|Construction|Bâtisseurs|Habitat|Travaux|Gros Œuvre|Bâti Moderne)\s*$/i, '').trim() || p.name;
  return `<span class="pz-marque">${logo(p, 40)}<span><b style="color:${c}">${esc(n.toUpperCase())}</b><small>${tag}</small></span></span>`; };
const initial = (n) => esc((n || '?').trim()[0].toUpperCase());
const badge = (p) => { const [t, c, ic] = LISTING[listingKey(p)]; return `${p.statut === 'artisan' ? `<span class="chip outline">${icon('user', 'xs')}${STATUT.artisan}</span>` : ''}<span class="chip ${c}">${icon(ic, 'xs')}${t}</span>${listingKey(p) === 'incomplet' ? `<span class="meta" data-testid="manque" style="display:block">Manque : ${docsOf(p).filter((d, i) => !p.docs[i]).map(d => esc(d.split(' (')[0])).join(', ')}</span>` : ''}`; };
// 12 nov. : fiches refaites à la manière d'Airbnb (retour de l'utilisateur) : les photos des réalisations d'abord, à faire glisser,
// puis le nom, le métier, le lieu, la ligne « entreprise depuis… » et trois points forts. Aucune note, aucun prix.
const rail = (p, cls = '') => `<div class="pz-rail ${cls}">${p.works.map(([t, c, y, k]) => `<figure><img src="${photoSrc(k, 0) || ''}" alt="" loading="lazy" draggable="false"><figcaption>${esc(t)} · ${esc(c)} ${y}</figcaption></figure>`).join('')}</div>`;
const host = (p) => `<div class="pz-host">${logo(p, 56)}<div><b>Entreprise depuis ${p.since}</b><small>${esc(p.team)} · ${esc(p.zone)}</small></div></div>`;
const fiche = (p, { edit = false, hero = true } = {}) => `
  ${hero ? `<div class="pz-hero">${rail(p, 'hero')}<span class="pz-count">${icon('image', 'xs')}${p.works.length} réalisation${p.works.length > 1 ? 's' : ''}</span></div>
  <div class="stack" style="gap:6px"><h1 class="pz-name">${esc(p.name)}</h1><div class="pz-sub">${esc(p.trade)} · ${esc(p.zone)}</div><div class="chips" style="margin-top:4px">${badge(p)}</div>${factChips(p)}<p class="meta" style="margin:4px 0 0">${NO_RANK}</p></div>
  ${host(p)}` : ''}
  <div class="pz-high">
    <div><span class="pz-i3"><img src="assets/onglets/onglet-chantiers.webp" alt=""></span><span><b>Intervient à ${esc(p.zone.split(',')[0])}</b><small>${esc(p.zone)}</small></span></div>
    <div><span class="pz-i3">${stepIcon3D(5, 6, 40)}</span><span><b>${p.docs.filter(Boolean).length} justificatifs sur ${docsOf(p).length} déposés</b><small>Reçus par TEEQA ; ce n'est pas une garantie sur les travaux</small></span></div>
    <div><span class="pz-i3">${icon('bell')}</span><span><b>Contact</b><small>${esc(p.email)}</small></span></div>
  </div>
  <div class="card stack" style="gap:6px"><div class="over">Présentation</div><p style="margin:0">${esc(p.about)}</p></div>
  <div class="section-title"><span class="over">Réalisations (${p.works.length})</span></div>
  <div class="pro-works">${p.works.map(([t, c, y, k]) => `<figure><img src="${photoSrc(k, 0) || ''}" alt="" loading="lazy"><figcaption><b>${esc(t)}</b><span>${esc(c)} · ${y}</span></figcaption></figure>`).join('')}</div>
  <p class="meta">Photos envoyées par l'entreprise avec ses réalisations ; TEEQA ne les certifie pas. Un chantier suivi avec TEEQA s'ajoute ici avec ses photos datées, si le client l'accepte.</p>
  <div class="section-title"><span class="over">Justificatifs</span><span class="meta">${p.docs.filter(Boolean).length} sur ${docsOf(p).length}</span></div>
  ${p.statut === 'artisan' ? `<p class="meta" style="margin:0" data-testid="artisan">Artisan ou tâcheron (auto-entrepreneur) : pas de registre de commerce ni de patente. Son chiffre d'affaires est plafonné par la loi n° 114-13 (500 000 DH par an pour une activité artisanale comme la maçonnerie ; 200 000 DH pour les services) : il prend la main-d'œuvre d'un lot, le client achète les matériaux ; au-delà, il faut une société. TEEQA demande ses justificatifs à lui, adaptés à son statut ; un dossier en cours n'est pas un mauvais signe.</p>` : ''}
  <div class="list pro-docs">${docsOf(p).map((d, i) => `<div class="list-item"><span class="ico-tile ${p.docs[i] ? 'success' : ''}">${icon(p.docs[i] ? 'check' : 'file')}</span><span class="grow"><span class="t">${d}</span><div class="s">${p.docs[i] ? (p.files && p.files[i] ? `Déposé · ${esc(p.files[i])}` : 'Déposé') + (/décennale/i.test(d) ? ' · attestation de l’assureur, valable un an : la garantie est portée par l’entreprise et son assureur ; TEEQA a vu le document, sans vérifier auprès de l’assureur qu’il couvre ce chantier (demandez l’attestation au nom du chantier)' : '') : 'Non déposé · signalé au client ; TEEQA ne bloque pas la convention, c’est le client qui décide'}</div></span>
    ${edit && !p.docs[i] ? `<label class="btn sm" for="pro-doc-${i}" style="cursor:pointer">Déposer</label><input id="pro-doc-${i}" type="file" accept="application/pdf,image/*" data-input="doc" data-i="${i}" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" tabindex="-1" aria-label="Déposer : ${d}">` : ''}</div>`).join('')}</div>
  <div class="notice">${icon('info', 'sm')}<span>Le référencement indique que TEEQA a reçu les justificatifs de l'entreprise. Ce n'est ni une note, ni une garantie sur les travaux : sur un chantier, ce sont les visites du contrôleur qui comptent.</span></div>`;

// M10 : les avis publics d'un professionnel et leur provenance. Seule l'entreprise du chantier peut en recevoir ici
// (les autres fiches sont des exemples) : on n'invente aucun avis.
const avisOf = (id) => (get().avis || []).filter((a) => a.pro === id);
const avisBlock = (p, { reply = false } = {}) => { const list = avisOf(p.id), rec = list.filter((a) => a.recommend).length;
  return `<div class="section-title"><span class="over">Avis de clients (${list.length})</span>${list.length ? `<span class="meta">${rec} recommandation${rec > 1 ? 's' : ''}</span>` : ''}</div>
  ${list.length ? list.map((a) => `<div class="card stack" style="gap:8px">
      <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><b>${esc(a.author)} · ${esc(a.city)}</b>${a.recommend ? `<span class="chip success">${icon('check', 'xs')}Recommande</span>` : `<span class="chip">Ne recommande pas</span>`}</div>
      <p style="margin:0">« ${esc(a.text)} »</p>
      <div class="meta">${icon('shield', 'xs')} Provenance : chantier « ${esc(a.project)} », clôturé dans TEEQA le ${fmtDate((project(a.pid) || {}).closedAt || a.at)}, avis écrit le ${fmtDate(a.at)} · ${a.steps} étapes, ${a.visits} visite${a.visits > 1 ? 's' : ''} de contrôle.</div>
      ${a.reply ? `<div class="notice">${icon('message', 'sm')}<span><b>Réponse de l'entreprise</b> · ${fmtDate(a.reply.at)}<br>${esc(a.reply.text)}</span></div>`
        : reply ? `<div class="field" style="margin:0"><label for="rep-${a.id}">Votre réponse <span class="meta">(une seule, publique)</span></label><textarea id="rep-${a.id}" class="input" rows="2" data-input="rep" data-id="${a.id}" style="width:100%;min-width:0;box-sizing:border-box;height:auto;padding-top:10px;padding-bottom:10px"></textarea><button class="btn sm" data-act="reply" data-id="${a.id}" style="justify-self:start;margin-top:8px">Répondre</button></div>` : ''}
    </div>`).join('') : `<p class="muted" style="margin:0">Aucun avis pour l'instant. Un avis ne peut être déposé qu'après un chantier clôturé dans TEEQA.</p>`}
  <p class="meta">Seuls les clients d'un chantier clôturé dans TEEQA peuvent écrire ici ; chaque avis indique d'où il vient. Le mot laissé à l’entreprise à la clôture n'est jamais publié. TEEQA ne classe pas les professionnels.</p>`; };

// 20 nov. (réalisme) : l'ancien « dossier type » est remplacé par un vrai chantier clos de l'appli (Villa Les Orangers).
export const routes = [
  { // Vague 10 : ce que TEEQA garantit par écrit, ce qu'il ne garantit pas, plafond de responsabilité, assurances, identité.
    name: 'garanties', pattern: /^\/garanties$/,
    render() {
      const E = ENGAGEMENTS, li = (a) => `<ul class="losange">${a.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
      return {
        html: `${appbar({ title: 'Nos garanties écrites', back: '#/home', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div class="card stack" style="gap:6px" data-testid="garantit"><span class="over"><b>Ce que TEEQA garantit</b></span>${li(E.garantit)}</div>
          <div class="card stack" style="gap:6px" data-testid="garantit-pas"><span class="over"><b>Ce que TEEQA ne garantit pas</b></span>${li(E.garantitPas)}</div>
          <div class="notice" data-testid="plafond">${icon('shield', 'sm')}<span><b>Responsabilité et plafonds.</b> ${esc(E.plafond)}${get().role === 'client' && /≈/.test(prix(TARIFS.assurance.rcAgence)) ? ` <span data-testid="plafond-devise">Dans votre devise : ${esc(prix(TARIFS.assurance.rcAgence))} par sinistre, ${esc(prix(TARIFS.assurance.rcAgenceAn))} par an.</span>` : ''}</span></div>
          <div class="card stack" style="gap:6px" data-testid="prestataires"><span class="over"><b>Nos prestataires</b></span><dl class="kv" style="margin:0">${E.prestataires.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
          <details class="more" data-testid="assurances"><summary>${icon('chevronDown', 'sm')}<span><b>Assurances</b><small>TEEQA, l'agence de contrôle, l'entreprise</small></span></summary>
            <div class="more-in"><dl class="kv" style="margin:0">${E.assurances.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div></details>
          ${piloteCard(false)}
          <p class="meta" style="margin:0">${esc(E.droit)}</p>

        </div></div>`,
      };
    },
  },
  {
    name: 'exemple-rapport', pattern: /^\/exemple-rapport$/,
    render() { return { redirect: project(CLOS_ID) ? `#/c/${CLOS_ID}/report` : '#/garanties' }; },
  },
  { // M05 : l'annuaire. Le client choisit un professionnel, ou invite directement le sien.
    name: 'pros', pattern: /^\/pros$/,
    render() {
      // Vague 23 (jury n° 18 ; clients Maroc) : l'annuaire s'ouvre sur la région du chantier en cours (pas 29 cartes d'un coup) ; « Toutes » reste à un toucher.
      const all0 = pros(), cur = (get().projects || []).find((p) => p.status !== 'clos' && p.region && access(p, get().role) === 'ok');
      const z0 = get().drafts.proZone, f0 = z0 === undefined ? (cur && all0.some((x) => x.region === cur.region) ? cur.region : '') : z0;
      const all = all0, f = f0 || '', zones = [...new Set(all.map((p) => p.region))];
      const list = all.filter((p) => !f || p.region === f).sort((a, b) => a.name.localeCompare(b.name, 'fr'));   // ordre alphabétique : rien qui ressemble à un classement
      return {
        html: `${appbar({ title: 'Trouver un professionnel', back: '#/home', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div class="pz-search">${icon('pin')}<span><b>Où se trouve votre chantier ?</b><small>${f ? esc(f) : 'Toutes les régions'} · ${list.length} professionnel${list.length > 1 ? 's' : ''}</small></span></div>
          <div class="chips" role="group" aria-label="Filtrer par région"><button class="chip ${f ? 'outline' : 'success'}" data-act="zone" data-z="">Toutes</button>${zones.map((z) => `<button class="chip ${f === z ? 'success' : 'outline'}" data-act="zone" data-z="${esc(z)}">${esc(z)}</button>`).join('')}</div>
          ${f && list.length < 4 ? `<p class="meta" style="margin:0" data-testid="annuaire-peu">${list.length} professionnel${list.length > 1 ? 's' : ''} référencé${list.length > 1 ? 's' : ''} dans cette région pour l’instant (${all.length} au Maroc). Votre entreprise n’y est pas ? Invitez-la en bas de la liste : TEEQA suit aussi un chantier avec une entreprise qui n’est pas dans l’annuaire.</p>` : ''}
          ${list.length && !list.some((p) => avisOf(p.id).length) ? `<p class="meta" style="margin:0">Pas encore d'avis de client sur ces fiches : un avis ne s'écrit qu'après un chantier clôturé dans TEEQA.</p>` : ''}
          <div class="pz-list">${list.map((p) => `<div class="pz-card" role="link" tabindex="0" data-go="#/pros/${p.id}" aria-label="${esc(p.name)}, ${esc(p.trade)}">
            ${rail(p)}<span class="pz-badge">${badge(p)}</span><span class="pz-brand">${marque(p)}</span>
            <div class="pz-info"><div class="row" style="justify-content:space-between;gap:10px;align-items:baseline"><b>${esc(p.name)}</b></div>
              <div class="s">${esc(p.trade)}</div><div class="s">${esc(p.zone)} · ${p.works.length} réalisation${p.works.length > 1 ? 's' : ''}</div>
              ${factLine(p)}</div></div>`).join('') || '<p class="muted" style="padding:14px">Aucun professionnel dans cette région.</p>'}</div>
          ${project(CLOS_ID) ? `<button class="list-item card" data-go="#/c/${CLOS_ID}/report" data-testid="exemple-clos"><span class="ico-tile success">${icon('file')}</span><span class="grow"><span class="t">Voir un chantier mené jusqu'à la réception</span><div class="s">Villa Les Orangers, Berkane, avec Rachid BTP : rapport et avis de sa cliente</div></span>${icon('chevron', 'sm chev')}</button>` : ''}
          <div class="card stack" style="gap:8px"><b>Vous avez déjà votre entreprise ?</b><p class="meta" style="margin:0">Invitez-la par WhatsApp, SMS ou e-mail : elle crée son compte et remplit sa fiche.</p><button class="btn ghost block" data-act="mine">Inviter mon entreprise</button></div>
          <p class="meta">${NO_RANK} TEEQA ne recommande aucun professionnel et ne touche rien sur leur choix. L'ordre de la liste ne dit rien de la qualité.</p>
        </div></div>`,
        on: { zone(b) { actions.setDraft('proZone', b.dataset.z); go('#/pros', { replace: true }); },
          mine() { const pr = get().projects.find(x => x.status !== 'clos' && x.invites.entreprise && x.invites.entreprise.status === 'non_creee'); if (pr) { go(`#/c/${pr.id}/share`); return; }   // vague 22 : le chantier qui attend son entreprise s'ouvre sur l'invitation WhatsApp / SMS
            const d = get().drafts.newProject; if (d) { d.proName = ''; actions.setDraft('newProject', d); } go('#/new'); } },
      };
    },
  },
  { // M04 et M05 : la fiche d'un professionnel, vue par tous.
    name: 'pro-fiche', pattern: /^\/pros\/([a-z]+)$/,
    render(id) {
      const p = proOf(id); if (!p) return { redirect: '#/pros' };
      const r = get().role, mine = r === 'entreprise' && id === MY_PRO_ID;
      return {
        html: `${appbar({ title: 'Fiche professionnelle', back: r === 'client' ? '#/pros' : '#/profile', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">${fiche(p)}${avisBlock(p, { reply: mine })}</div></div>
        ${r === 'client' ? `<div class="footer-cta">${p.docs.filter(Boolean).length < docsOf(p).length ? `<p class="meta" style="text-align:center;color:var(--saffron-ink)" data-testid="docs-manquants">Justificatifs incomplets : ${docsOf(p).filter((_, i) => !p.docs[i]).map(esc).join(', ')} pas encore déposé${docsOf(p).length - p.docs.filter(Boolean).length > 1 ? 's' : ''}. ${get().projects.some(x => proIdOf(x) === p.id && x.invites.entreprise && x.invites.entreprise.status === 'acceptee') ? 'Elle travaille déjà sur un de vos chantiers : demandez-les-lui.' : "Demandez-les avant de l'inviter."}</p>` : ''}<button class="btn saffron block" data-act="invite">Inviter sur un chantier</button></div>` : mine ? `<div class="footer-cta"><button class="btn block" data-go="#/pro">Modifier ma fiche</button></div>` : ''}`,
        on: { rep() {}, reply(b) { const t = document.getElementById('rep-' + b.dataset.id); if (!t || !t.value.trim()) return; actions.replyAvis(b.dataset.id, t.value); sfx('envoi'); toast('Réponse publiée', 'send'); go(`#/pros/${id}`, { replace: true }); },
          invite() { const d = { stage: 1, name: '', city: '', email: '', ...(get().drafts.newProject || {}) }; d.email = p.email; d.proName = p.name;
          actions.setDraft('newProject', d); sfx('choix'); toast(`${p.name} sera invité`, 'check'); go('#/new'); } },
      };
    },
  },
  { // M04 : l'entreprise remplit sa fiche, dépose ses justificatifs et demande le référencement.
    name: 'pro-edit', pattern: /^\/pro$/,
    render() {
      if (get().role !== 'entreprise') return { redirect: `#/pros/${MY_PRO_ID}` };
      const p = proOf(MY_PRO_ID), full = p.docs.every(Boolean);
      const lk = listingKey(p), miss = docsOf(p).length - p.docs.filter(Boolean).length;
      const since = p.remindedAt || p.askedAt, late = lk === 'en_cours' && since && Date.now() - new Date(since).getTime() > ANSWER_DAYS * DAY;
      return {
        html: `${appbar({ title: 'Ma fiche professionnelle', back: '#/profile', sep: true })}
        <div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px">
          <div class="field"><label for="pro-zone">Zone d'intervention</label><input id="pro-zone" class="input" data-input="edit" data-k="zone" value="${esc(p.zone)}" autocomplete="off"></div>
          <div class="field"><label for="pro-about">Présentation</label><textarea id="pro-about" class="input" rows="4" data-input="edit" data-k="about" style="width:100%;min-width:0;box-sizing:border-box;height:auto;padding-top:12px;padding-bottom:12px;line-height:1.4">${esc(p.about)}</textarea></div>
          ${(() => { const TV = 3, nd = p.docs.filter(Boolean).length, pct = Math.round(nd / docsOf(p).length * 100);
            // Trois propositions : 1 l'aperçu tel que le client le voit (photos en tête) ; 2 une carte de visite verte avec l'avancement du dossier en anneau ;
            // 3 « Complétez votre fiche » : barre d'avancement et quatre tuiles à cocher.
            if (TV === 2) return `<div class="pz-carte"><span class="pz-ring" style="--p:${pct}"><span class="pz-av">${avatar('entreprise', 64)}</span></span><div><h2>${esc(p.name)}</h2><small>${esc(p.trade)}</small><div class="chips" style="margin-top:8px">${badge(p)}</div></div><b class="pz-pct">${nd}/${docsOf(p).length}<small>justificatifs</small></b></div>${rail(p, 'mini')}${fiche(p, { edit: true, hero: false })}`;
            if (TV === 3) { const T = [['Présentation', !!p.about, icon('pen')], ['Zone', !!p.zone, '<img class="i3d" src="assets/onglets/onglet-chantiers.webp" alt="">'], [`${p.works.length} réalisations`, p.works.length > 0, icon('camera')], [`${nd} justificatifs sur ${docsOf(p).length}`, nd === docsOf(p).length, stepIcon3D(5, 6, 40)]], done = T.filter((x) => x[1]).length;
              return `<div class="pz-own">${logo(p, 60)}<div><h2>${esc(p.name)}</h2><small>${esc(p.trade)}</small></div>${badge(p)}</div><div class="pz-todo"><div class="row" style="justify-content:space-between;align-items:baseline"><h2>Complétez votre fiche</h2><b>${done} sur ${T.length}</b></div><div class="pz-bar"><i style="width:${done / T.length * 100}%"></i></div>
                <div class="pz-tiles">${T.map(([t, ok, ic]) => `<div class="${ok ? 'ok' : ''}"><span class="pz-i3">${ic}</span><b>${t}</b><small>${ok ? 'Fait' : 'À compléter'}</small></div>`).join('')}</div></div>${rail(p, 'mini')}${fiche(p, { edit: true, hero: false })}`; }
            return fiche(p, { edit: true }); })()}
          <div class="card stack" style="gap:8px"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px 10px"><b>Référencement</b>${badge(p)}</div>
            <p class="meta" style="margin:0">${lk === 'complet' ? 'Vos quatre justificatifs sont déposés et votre fiche est référencée : TEEQA a reçu vos justificatifs, rien de plus.'
              : lk === 'en_cours' ? `Vos quatre justificatifs sont déposés. ${p.askedAt ? `Demande envoyée le ${fmtDate(p.askedAt)}` : 'Dossier transmis à TEEQA'}${p.remindedAt ? ` · relancée le ${fmtDate(p.remindedAt)}` : ''}. TEEQA examine vos justificatifs. Réponse sous ${ANSWER_DAYS} jours ouvrés.`
              : lk === 'a_demander' ? "Vos quatre justificatifs sont déposés, mais le référencement n'est pas encore demandé. Demandez-le ci-dessous. Le référencement ne coûte rien : TEEQA ne touche rien sur le choix du client."
              : `Il manque ${miss} justificatif${miss > 1 ? 's' : ''} sur ${docsOf(p).length}. Déposez-les, puis demandez le référencement. Le référencement ne coûte rien : TEEQA ne touche rien sur le choix du client.`}</p>
            ${(lk === 'incomplet' || lk === 'a_demander') && !p.askedAt ? `<button class="btn block" data-act="ask" ${full ? '' : 'disabled'}>Demander le référencement</button>` : ''}
            ${late ? `<div class="notice saffron">${icon('clock', 'sm')}<span>Réponse en retard : relancer TEEQA.</span></div><button class="btn ghost block" data-act="remind">${icon('refresh', 'sm')}Relancer TEEQA</button>` : ''}</div>
        </div></div>
        <div class="footer-cta"><button class="btn ghost block" data-go="#/pros/${MY_PRO_ID}">Voir ma fiche comme un client</button></div>`,
        on: {
          edit(t) { actions.setPro({ [t.dataset.k]: t.value }); },
          doc(t) { const f = t.files && t.files[0]; if (!f) return; actions.setPro({ docs: { ...(own().docs || {}), [t.dataset.i]: f.name } }); sfx('papier'); toast('Justificatif déposé', 'check'); go('#/pro', { replace: true }); },
          remind() { actions.setPro({ remindedAt: new Date().toISOString() }); sfx('envoi'); toast('Relance envoyée à TEEQA', 'send'); go('#/pro', { replace: true }); },
          ask() { actions.setPro({ listing: 'en_cours', askedAt: new Date().toISOString() }); sfx('envoi'); toast('Demande envoyée', 'send'); go('#/pro', { replace: true }); },
        },
      };
    },
  },
];
