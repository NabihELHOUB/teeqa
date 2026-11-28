// Store de démonstration : un SEUL processus partagé, les rôles filtrent les actions.
// Persistance localStorage (aucun serveur, aucune authentification réelle).
// Les téléphones de la page vitrine (index.html?vitrine) gardent leur état à part : ils ne touchent pas à l'essai en cours.
// Salle de démo (14 nov.) : avec « ?salle » dans l'adresse, le chantier est partagé en direct entre plusieurs téléphones
// par le serveur salle.mjs. Chaque téléphone garde pour lui son rôle, sa session et ses brouillons ; le chantier, les
// notifications, les signalements et les noms des comptes sont communs. Voir SALLE-DEMO.md à la racine.
export const SALLE = (() => { try { return /[?&]salle\b/.test(location.search); } catch { return false; } })();
// Soutenance du 1er déc. (demo-oral.html) : avec « ?oral&role=… », trois téléphones posés dans la même page partagent le
// chantier par le stockage du navigateur, sans serveur (événement « storage »). Chacun garde son rôle et sa session sous sa clé.
export const ORAL = (() => { try { return !SALLE && /[?&]oral\b/.test(location.search); } catch { return false; } })();
const ORAL_ROLE = ORAL ? (new URLSearchParams(location.search).get('role') || 'client') : null;
// 28 nov. (Nabih) : l'entreprise aussi arrive sans compte (elle installe l'appli en touchant le lien d'invitation, puis crée son compte).
export const ORAL_INSCRIPTION = ORAL && ['client', 'entreprise'].includes(ORAL_ROLE) && /[?&]inscription\b/.test(location.search);
// 28 nov. (Nabih) : pendant la soutenance, l'agence de contrôle reçoit son lien une fois le forfait payé par le client
// (dans l'appli ordinaire, dès la convention acceptée des deux côtés). Les textes qui annoncent la mission suivent.
export const MISSION_QUAND = ORAL ? 'dès que le client aura payé le forfait' : "dès que l'entreprise et la convention seront acceptées";
const KEY = SALLE ? 'teeqa-salle-v1' : ORAL ? 'teeqa-oral-' + ORAL_ROLE : /[?&]vitrine\b/.test(location.search) ? 'teeqa-vitrine-v2' : 'teeqa-demo-v2';
// Dans la salle, chaque onglet est un téléphone à part (on peut répéter la démo à trois onglets sur un seul ordinateur).
const STOCK = (() => { try { return SALLE ? sessionStorage : localStorage; } catch { return null; } })();
const listeners = new Set();
let state;

export const ROLES = {
  client: { label: 'Client', name: 'Karim', initial: 'C', _where: null, set where(v) { this._where = v; }, get where() { if (this._where && /^compte/.test(this._where)) return this._where; try { return pays() === 'MA' ? 'au Maroc · ' + villeClient() : 'à distance · ' + villeClient(); } catch { return 'à distance'; } } },
  entreprise: { label: 'Entreprise', name: 'Rachid BTP', initial: 'E', where: 'compte entreprise · Nador' },
  controleur: { label: 'Contrôleur', name: 'Amina', initial: 'T', where: 'sur place · par lien, sans compte' },
};
// Le contrôleur est missionné par TEEQA et reste anonyme pour l'entreprise (Drive, point Gandia).
export const ANON_CONTROLEUR = 'Contrôleur TEEQA';
// Vague 9 : programme pilote, présenté honnêtement : pas d'avis inventé, pas de chiffre d'usage.
export const PILOTE = { titre: 'Programme pilote : 10 premiers chantiers, inscriptions ouvertes', texte: "Un conseiller TEEQA suit chaque chantier pilote de près, dans votre langue, et note vos retours. Un premier chantier pilote est clôturé : Villa Les Orangers, à Berkane, reçue le 26 septembre 2026 ; son rapport et l'avis de sa cliente sont publiés avec son accord.",
  // Vague 10 : le programme pilote expliqué (qui, quoi, comment les résultats seront publiés) ; jamais d'avis inventé ni acheté.
  details: [
    ['Qui', "10 chantiers de maison individuelle ou d'extension, dans les villes où une agence de contrôle partenaire passe (voir la liste des agences). Premier inscrit, premier servi."],
    ['Ce qui change pour vous', "Le même forfait que tout le monde ; en plus, un conseiller qui vous appelle à chaque étape et un compte rendu mensuel. Rien n'est offert en échange d'un avis."],
    ['Ce qui sera publié', "À la clôture, le rapport du chantier, si le client l'accepte, sans nom ni adresse ; et son avis, tel qu'il l'écrit, même négatif. L'entreprise peut y répondre."],
    ['Ce qui ne sera jamais publié', "Un avis écrit par TEEQA, acheté, ou recopié d'un autre site. Une note ou un classement des entreprises."],
    ['Où en est le pilote', "Un chantier clôturé (Villa Les Orangers, Berkane : 7 étapes, 7 visites, réception sans réserve), son rapport et l'avis de sa cliente publiés avec son accord ; les autres en cours ou en signature."],
  ] };
// Vague 9 : une seule formulation pour chaque règle, réutilisée partout (écrans, notifications, aide).
// Vague 18 (jury, n° 17) : un seul horaire d'assistance, cité tel quel partout (Parler à quelqu'un, Garanties, « C'est urgent »).
const HORAIRES = "du lundi au samedi, 8 h – 20 h (heure du Maroc), réponse sous 2 h ; urgence chantier (béton qui attend, chantier arrêté) : 7 j/7, 7 h – 22 h, réponse sous 30 min";
export const FAUX_RX = /se présente comme contrôleur|demande d.argent/i;
// Vague 25 (retour du groupe, 4 failles) : décès, gérant, accident, contournement, faillite. TEEQA ne tranche pas, ne détient pas d'argent, ne certifie pas.
export const FAILLES = {
  deces: "Décès du client : un proche, l'entreprise ou le contrôleur le déclare d'un geste. Dès la déclaration, les délais du chantier et les échéances des tranches sont suspendus (aucun jour de retard compté), et le compte de séquestre est gelé : la banque ne verse ni ne restitue rien. Les proches déjà invités gardent l'accès au dossier en lecture. Les héritiers, même dans plusieurs pays, désignent par écrit un seul mandataire, et déposent l'acte des ayants droit (acte de notoriété ou acte d'hérédité, adoul ou notaire) dans Documents : ce mandataire devient le titulaire, et les délais repartent. TEEQA enregistre les pièces sans trancher entre héritiers.",
  gerant: "Décès ou départ du gérant de l'entreprise : si l'entreprise est une société (SARL, SA), le contrat continue avec elle ; son nouveau représentant légal reprend le compte, et l'assurance décennale souscrite pour le chantier reste attachée à la police. Si l'entreprise était une personne (entrepreneur individuel, auto-entrepreneur, tâcheron), le contrat s'arrête : le client fait un état des lieux et change d'entreprise (même parcours qu'un abandon). TEEQA ne choisit pas pour le client.",
  accident: "Accident sur le chantier : appelez d'abord les secours (15 pour le SAMU, 150 pour la Protection civile). Chacun peut signaler l'accident dans TEEQA : il est daté par le serveur, avec les photos, et vu par le client, l'entreprise et le contrôleur, sans parti pris. L'employeur déclare l'accident du travail à son assureur sous 48 h (loi 18-12). TEEQA ne remplace ni la CNSS, ni l'assureur, ni l'inspection du travail, et ne dit pas qui est responsable. Ouvriers non déclarés : la règle est rappelée (tout salarié est déclaré à la CNSS) ; TEEQA ne demande aucun nom.",
  securite: "Le contrôleur peut noter la sécurité visible le jour de sa visite (casques, garde-corps, échafaudage) : c'est une observation datée, pas un avis sur l'étape ; elle ne retient ni l'étape ni la tranche.",
  rester: "Dès 2 étapes closes, rien n'oblige à rester. Ce que le suivi apporte encore : les étapes qui seront cachées (aciers, réseaux encastrés, étanchéité) sont les plus risquées ; le rapport final complet sert pour la décennale, la revente ou la banque ; le séquestre, s'il est choisi, protège jusqu'au bout. Arrêter se fait d'un geste, avec le bouton en bas de cet écran : le dossier reste exportable 10 ans.",
  parrainage: "Parrainer : un client ou une entreprise invite un autre chantier. Quand ce chantier choisit un forfait, le parrain reçoit une visite de contrôle offerte (client) ou une contre-visite à sa charge offerte (entreprise). Rien n'est versé en argent ; TEEQA ne touche aucune commission sur les travaux.",
  decennale: "Décennale : l'assurance est attachée à la police souscrite pour ce chantier, pas à la survie de l'entreprise. Avant le début, TEEQA demande à l'entreprise l'attestation nominative du chantier (numéro de police, assureur, dates) ; le rapport la garde. Si l'entreprise disparaît (liquidation), le client s'adresse directement à l'assureur, avec le rapport et l'attestation. À faire vérifier par un juriste : TEEQA ne garantit pas la couverture.",
};
export const decesActif = (p) => !!(p && p.deces && !p.deces.mandataireAt);
// Vague 26 (scènes 11) : la suspension pour décès a une durée maximale et une issue écrite.
export const DECES_MAX_JOURS = 180;
export const decesLimite = (p) => p && p.deces ? new Date(new Date(p.deces.at).getTime() + DECES_MAX_JOURS * 864e5).toISOString() : null;
export const REGLES = {
  argent: "TEEQA ne détient jamais l'argent des travaux : le client paie l'entreprise directement, ou par le compte de séquestre d'une banque s'il le choisit.",
  // 20 nov. (réalisme) : séquestre FACULTATIF tenu par une banque partenaire (nom inventé). La règle n'est écrite qu'ici.
  sequestre: "Séquestre bancaire, facultatif : le client verse chaque tranche sur un compte de séquestre ouvert à son nom chez Banque Saphir, banque partenaire ; l'entreprise voit que la tranche y est. La banque la verse à l'entreprise quand le client le confirme, ou d'office 5 jours après l'échéance de la tranche (7 jours après l'avis favorable, ou après le coulage déclaré aux points d'arrêt) si le client ne s'y est pas opposé par écrit, avec un motif. En cas d'opposition, l'argent reste sur le compte jusqu'à un accord écrit des deux parties, ou la décision d'un médiateur ou d'un juge. Restitution : si le chantier s'arrête ou si le client change d'entreprise, ce qui reste sur le compte revient au client, sur son ordre écrit à la banque, sauf une tranche d'étape terminée que l'entreprise réclame par écrit dans les 8 jours (elle reste alors bloquée jusqu'à l'accord ou la décision). C'est la banque qui ouvre, garde, verse et restitue. TEEQA ne touche jamais l'argent et ne tranche pas : il transmet seulement à la banque les dates des avis et des coulages, et la confirmation, l'opposition ou l'ordre de restitution du client.",
  tranche: 'TEEQA ne tranche pas un désaccord : il date et garde les échanges.',
  photos: 'TEEQA ne certifie pas les photos.',
  recuse: "Récusation : demander une autre agence de contrôle, une fois chacun, avec un motif. Jamais pour défaire un avis signé : pour cela, le second avis.",
  // Vague 12 : un seul délai de visite, écrit pareil partout (garanties, agence, retard, désistement, aide).
  delaiVisite: "Visite au plus tard 4 jours après la demande (6 jours hors des villes desservies). TEEQA relance l'agence 24 h avant ce délai, sans que vous ayez à le faire. Si ce délai passe, TEEQA confie lui-même la visite à une autre agence partenaire de la région (sinon à celle de la région voisine), sans geste de votre part : cette visite n'est facturée à personne et les délais du chantier sont suspendus jusqu'à l'avis (la fin prévue recule d'autant). Chaque agence a 24 h pour accepter ; sinon TEEQA passe à la suivante. Règle : aucune visite ne reste plus de 4 jours sans une agence qui l'a acceptée, hors suspension écrite sur l'étape (changement d'entreprise : la visite et son créneau s'arrêtent, puis le délai de 4 jours repart de la convention de l'entreprise reprenante).",
  desist: "Retrait possible jusqu'à 24 h avant le créneau (ensuite : empêchement). L'agence confie la visite à un autre contrôleur (24 h pour l'accepter), sans frais pour personne ; la date de visite promise ne bouge pas.",
  // Vague 12 : preuve. Deux heures sur chaque photo et chaque avis, et la position approximative quand elle existe.
  preuve: "Chaque photo et chaque avis portent l'heure de prise (téléphone) et l'heure de réception par le serveur de TEEQA, qui ne dépend pas du téléphone ; et la position approximative quand le téléphone la donne. Un début de preuve, pas une certification.",
  // Vague 12 : « close » n'a qu'un sens : travaux finis (et avis favorable s'il y a une visite). Le paiement se suit à part.
  close: "Étape close : travaux finis (et avis favorable, s'il y a une visite). Le paiement de la tranche se suit à part.",
  // Vague 11 : une seule règle pour le désistement et l'empêchement de dernière minute.
  get empechement() { return this.desist; },
  // Vague 10 : deux décideurs qui ne sont pas d'accord : le client titulaire du chantier tranche (il a délégué, il garde le dernier mot).
  decideurs: "Si deux décideurs ne sont pas d'accord, c'est le client titulaire du chantier qui a le dernier mot ; le désaccord reste écrit dans les échanges.",
  // Vague 10 : changement d'entreprise : ce qui est payé reste payé ; le travail fait et non payé est écrit dans l'état des lieux.
  reprise: "Changement d'entreprise, la règle de l'argent (la même sur chaque écran) : 1. une étape finie par l'entreprise sortante avant le changement lui revient : sa tranche lui est due en entier ; ce qui en reste à payer a une nouvelle échéance, 7 jours après l'état des lieux signé (aucun retard ne compte pendant l'état des lieux) ; 2. une étape finie mais pas encore contrôlée garde sa visite, sur ce travail-là : avis favorable, sa tranche va à l'entreprise sortante (par la banque si elle est sur le compte de séquestre : une tranche encore sur le compte de séquestre y reste bloquée jusqu'à l'état des lieux signé) ; réserves, l'entreprise reprenante les lève et leur prix se retient sur cette tranche par un avenant, proposé seulement s'il y a des réserves (aucun tant que l'avis n'est pas signé) ; la sortante répond de ce qu'elle a fait (garantie de parfait achèvement et décennale de son ouvrage), la reprenante de ce qu'elle fait et des réserves qu'elle lève ; 3. une étape commencée et pas finie : la part décrite dans l'état des lieux se règle avec l'entreprise sortante, le reste revient à l'entreprise reprenante ; une étape pas commencée revient à l'entreprise reprenante, au prix de son devis. L'entreprise sortante a 8 jours pour répondre à l'état des lieux (elle y confirme ou conteste les paiements indiqués) ; sans réponse, il est clos « sans réponse de l'entreprise » et les paiements indiqués sont tenus pour reçus. TEEQA ne tranche pas : il date et garde.",
  secondAvis: 'Second avis : après un avis Réserves ou Refusé, le client ou l’entreprise le demande dans les échanges (désaccord ouvert) ; TEEQA missionne une autre agence de la zone, jamais celle du premier avis, qui passe au plus tard 4 jours après la demande (prix : 1 100 DH). Facturé à qui le demande seulement s’il confirme le premier avis. S’il l’annule, ni le second avis ni la contre-visite ne lui sont facturés : l’agence du premier avis les prend en charge (c’est le second avis qui le dit, pas TEEQA). Contre un avis Validé, le client peut aussi le demander tant que rien n’est caché (avant le coulage) : le contrôleur n’a rien à refaire et ne répond que de ce qui était visible le jour de sa visite. Si le second avis contredit le premier, c’est lui qui compte pour la suite (paiement recommandé ou correction) ; le premier avis reste au dossier avec la réponse écrite de son contrôleur, dont la visite reste payée, sans note ni sanction automatique.',
  // Vague 14 : un seul paragraphe de responsabilité, le même partout (garanties, convention, mission, rapport).
  // Vague 16 : plus court, et « caché » défini une seule fois (le jury lisait deux règles pour un acier vu puis noyé).
  responsabilite: "Qui répond de quoi : l'entreprise répond de l'ouvrage (garantie d'un an, puis décennale). L'agence de contrôle répond d'un point mal noté qui était visible le jour de la visite (ce qu'on pouvait voir ce jour-là), même s'il est caché ensuite (jusqu'à 2 000 000 DH par sinistre et 6 000 000 DH par an ; franchise à sa charge, jamais au contrôleur ni au client). Ce qui était déjà caché ou inaccessible ce jour-là (noté « Non vu ») n'engage pas l'agence. TEEQA répond de ses propres fautes (visite oubliée, pièce perdue) : forfait remboursé, dommage jusqu'à 1 000 000 DH. TEEQA ne tranche pas un désaccord et ne certifie rien.",
  // Vague 17 : version courte = abrégé exact de la même règle (mêmes plafonds, même définition de « visible »).
  responsabiliteControleur: "Votre agence répond en premier de vos actes de mission, avec son assurance : d'un point noté « Conforme » qui était visible le jour de la visite et faux, même s'il est noyé dans le béton ensuite (jusqu'à 2 000 000 DH par sinistre et 6 000 000 DH par an ; franchise de 10 000 DH à sa charge, jamais à la vôtre). Vous n'êtes personnellement visé que d'une faute grave : signer sans être venu sur place, ou écrire sciemment le faux (photo d'un autre chantier, mesure inventée) ; une erreur d'appréciation n'en est jamais une. Un point « Non vu » (déjà caché ou inaccessible ce jour-là) n'engage pas l'agence.",
  // Vague 17 (jury, n° 1) : « visible » n'a qu'un sens ; les réserves se classent avec d'autres mots (finition / structure).
  visible: "« Visible » : ce qu'on pouvait voir le jour de la visite, même si c'est caché ensuite.",
  // Vague 18 (contrôleurs, 8 mentions) : exemples concrets, sur les étapes du chemin.
  visibleExemples: "Visible (vous en répondez) : les cales sous les aciers d'une semelle avant le coulage ; les aciers d'un poteau dont le coffrage est encore ouvert ; l'épaisseur d'une dalle coffrée, mesurée au bord. Inaccessible (notez « Non vu », vous n'en répondez pas) : une gaine déjà noyée dans le béton ; une tranchée déjà remblayée ; le dessus d'une dalle sans échelle ni garde-corps sûrs ; une pièce fermée à clé le jour de la visite.",
  // Vague 18 (scènes 10 et 2) : titulaire empêché, et consigne d'un proche qui contredit le titulaire.
  suppleant: "Titulaire empêché (hospitalisation, absence longue) : un proche co-décideur devient suppléant et décide à sa place le temps de l'empêchement. Le titulaire ou son suppléant le déclare d'un geste ; sans suppléant, un proche envoie un justificatif à TEEQA, qui l'enregistre sans trancher. Pendant l'empêchement déclaré, le retard des tranches est suspendu : aucun jour de retard compté. Un transfert de titularité (héritier, acheteur) se fait sur justificatif, avec l'accord écrit du titulaire ou de ses ayants droit. Procuration : une procuration légalisée (commune, consulat ou notaire), déposée dans Documents, fait de ce proche le suppléant dès son dépôt. Terrain en indivision : les indivisaires désignent par écrit l'un d'eux comme titulaire (accord déposé dans Documents) ; les autres sont invités comme proches, en lecture ou co-décideurs.",
  consigneProche: "Consigne d'un proche qui contredit le titulaire : elle est signalée à l'entreprise « en attente du titulaire », qui décide ; tant qu'il n'a pas répondu, l'entreprise suit la dernière consigne du titulaire.",
  // Vague 18 NT (scène 2) : une consigne retirée ou qui coûte.
  consigneSuite: "Ce qui a déjà été commandé avant le retrait d'une consigne se règle entre vous et l'entreprise ; TEEQA date les messages et ne tranche pas. Une consigne qui change le prix passe par un avenant, accepté par les deux.",
  // Vague 18 (scène 8) : un désordre après coup sur une étape close.
  constat: "Visite de constat : sur une étape close, si un désordre apparaît (fissure, infiltration), le client peut demander qu'un contrôleur vienne le décrire, le mesurer et le photographier. Elle est payée par le client (prix d'une visite) et ne demande pas l'accord de l'entreprise. Le constat ne tranche pas qui est responsable : il date et décrit, pour l'entreprise (garantie d'un an, décennale), un expert ou un médiateur.",
  // Vague 17 (jury, n° 7) : Réserves et Refusé ne diffèrent pas que par le prix.
  avisTypes: "Réserves : l'ouvrage reste en place, seuls les points notés se corrigent (sur photo pour une finition, sur place pour la structure). Refusé : l'ouvrage est à refaire ; tous les points de l'étape sont revus.",
  // Vague 17 (jury, n° 8) : « Non vu » n'est la faute de personne.
  nonVu: "« Non vu » : point caché ou inaccessible ce jour-là ; photographiez ce qui empêche de voir (coffrage fermé, béton coulé), la photo reste au dossier. Sur un point clé (structure), il empêche « Validé » ; ailleurs, l'avis peut être Validé sur les points vus. Si le contrôleur revient seulement pour voir ces points « Non vu » (et aucun point à reprendre), ce retour n'est facturé à personne.",
  // Vague 17 (jury, n° 2) : une seule règle de photos dans l'avis.
  photosAvis: "Une photo par point clé (structure), et une par point à reprendre qui n'est pas un point clé.",
  // Vague 17 (jury, n° 3) : un seul moment où une tranche est due.
  trancheDue: "Une tranche est due 7 jours après l'avis favorable. Aux points d'arrêt (fondations, murs et poteaux, dalle, et tout ouvrage en béton armé ajouté par avenant), le béton n'est pas encore coulé à l'avis : elle est due 7 jours après le coulage déclaré.",
  // Vague 17 (jury, n° 10) : la mission part à la convention, la première visite attend le forfait.
  // Vague 18 (jury, n° 3) : un seul déclencheur du forfait, dit avec les mêmes mots partout.
  forfaitMission: "Le forfait se paie en une fois, ou en 3 fois sans frais par carte : rien n'est dû avant la convention acceptée des deux côtés ; en une fois, il est dû avant la première visite de contrôle ; en 3 fois, un tiers avant chacune des 3 premières visites (le premier dès la convention). " + (ORAL ? "L'agence est missionnée dès le forfait payé ; l'entreprise peut débuter avant." : "L'agence est missionnée dès la convention, pour préparer les visites ; l'entreprise peut débuter avant le paiement."),
  // Vague 17 (jury, n° 18) : trois routes vers une autre agence, une seule compte dans le « une fois ».
  autresAgences: "Changer d'agence (une fois chacun, avec un motif) est le seul geste limité. Une autre agence pour une visite en retard (sans frais) et le second avis ne le consomment pas.",
  // Vague 17 (jury, n° 21) : données au Maroc, sauf ce que vous choisissez d'envoyer par WhatsApp ou SMS.
  donnees: "Photos, avis, échanges et vocaux sont gardés et traités au Maroc (Médina Cloud, Rabat). Si vous choisissez d'être prévenu par WhatsApp ou SMS, ou d'écrire à TEEQA sur WhatsApp, ces messages passent par ces services, hors du Maroc : ils ne contiennent ni photo ni avis, seulement une alerte et un lien.",
  // Vague 17 (scènes) : « c'est urgent » prévient la bonne personne.
  urgent: "« C'est urgent » met votre message en haut des échanges chez les autres parties, les prévient par notification et SMS, et prévient l'équipe TEEQA (urgence chantier : 7 j/7, 7 h – 22 h). Une fois par jour et par étape, pour tous les participants (le jour change à minuit, heure du Maroc). Ce n'est pas une contestation : il ne retient ni le chantier ni un paiement, et TEEQA ne tranche pas.",
  // Vague 17 (scènes) : une traduction automatique se corrige ; l'original reste la référence.
  traduction: "Traduction indicative, sans valeur légale : l'original fait foi. Une correction est signée par celui qui la propose et montrée à tous les lecteurs de cette langue, avec l'original à côté.",
  // Vague 18 (jury, n° 12) : ce que veut dire le délai de 48 h d'un désaccord.
  desaccord: "Réponse attendue sous 48 h. Passé ce délai, TEEQA relance l'autre partie et le désaccord reste écrit au dossier. Une seule règle : un désaccord ouvert entre le ferraillage prêt et le coulage retient le coulage, 48 h au plus ; ouvert à un autre moment, il ne retient rien.",
  // Vague 18 NT (scènes 2 et 6) : un proche présent à la visite n'a aucun pouvoir sur l'avis.
  procheVisite: "Un proche du client présent peut ouvrir le chantier et montrer les lieux ; il ne signe pas l'avis et n'oriente pas le contrôle. Le contrôleur note ce qu'il voit, pas ce qu'on lui dit.",
  // Vague 18 NT (scènes 4, 5, 7) : la protection d'un ouvrage en attente reste à l'entreprise.
  protection: "Pendant l'attente d'une visite, d'une réponse ou d'une reprise, la protection des ouvrages exposés (aciers à la pluie, bâche, mise hors d'eau) reste à la charge de l'entreprise qui tient le chantier. TEEQA ne la surveille pas et ne la certifie pas ; une photo datée la montre.",
  // Vague 18 NT (scène 9) : un faux contrôleur.
  arnaque: "Un contrôleur ne vous demande jamais d'argent : le forfait se paie à TEEQA seulement, dans l'appli (en une fois ou en 3 fois). Seul le contrôleur de l'agence annoncée ici se présente, au créneau annoncé ici.",
  anonyme: "Vous voyez le nom de l'agence, pas celui de la personne : dans les avis et les échanges, il s'affiche « Contrôleur TEEQA ».",
};
// 19 nov. : chaque rôle lit l'appli dans sa langue (français par défaut). Codes : fr, ar, dar (darija), shi, rif, tzm (tamazight).
// Vague 18 (jury, n° 20) : après un changement d'entreprise, ce que fait le rôle « entreprise » est signé par l'entreprise reprenante, jamais par la sortante.
export const nomPartie = (p, role) => role === 'entreprise' && p && (p.formerPros || []).length && p.invites.entreprise && p.invites.entreprise.status === 'acceptee' ? (p.invites.entreprise.name || 'Entreprise reprenante') : who(role);
export const langOf = (role = state && state.role) => (state && state.langs && state.langs[role]) || (state && state.langDefault) || 'fr';
export const who = (role, viewer = state && state.role) => !ROLES[role] ? 'TEEQA' : role === 'controleur' && viewer === 'entreprise' ? ANON_CONTROLEUR : ROLES[role].name;

export const STATUS = {
  verrouillee: { label: 'Verrouillée', chip: '', icon: 'lock' },
  a_venir: { label: 'Prête à débuter', chip: '', icon: 'play' },
  debutee: { label: 'En cours · début déclaré', chip: 'saffron', icon: 'trowel' },
  en_retard: { label: 'En retard · date de fin prévue dépassée', chip: 'danger', icon: 'clock' },   // parcours B (26 nov.) : libellé seulement, pas un état
  fin_declaree: { label: 'Fin déclarée · avis attendu', chip: 'saffron', icon: 'hourglass' },
  fin_declaree_sans: { label: 'Fin déclarée · à consulter', chip: 'saffron', icon: 'eye' },   // étape sans visite : libellé seulement, pas un état
  validee: { label: 'Vérifiée · avis Validé', chip: 'success', icon: 'check' },
  retardee: { label: 'Avis : Réserves', chip: 'pise', icon: 'alert' },   // clé historique conservée ; libellé du Drive : « réservé »
  refusee: { label: 'Avis : Refusé', chip: 'danger', icon: 'close' },
  correction_soumise: { label: 'Correction apportée', chip: 'pise', icon: 'image' },
  corrigee: { label: 'Corrigée · contrôlée sur photo', chip: 'success', icon: 'check' },
  coulage_attendu: { label: 'Aciers contrôlés · béton pas encore coulé', chip: 'saffron', icon: 'hourglass' },   // vague 4 : libellé seulement, pas un état
  // Vague 5 : une seule « fin » par étape à point d'arrêt : ferraillage prêt → ferraillage contrôlé → étape finie (coulage déclaré).
  contre_visite: { label: 'Correction envoyée · contre-visite à faire', chip: 'pise', icon: 'hourglass' },   // vague 8 : l'avis avec réserves reste en vigueur
  avis_en_attente: { label: 'Avis signé · envoi au retour du réseau', chip: 'saffron', icon: 'clock' },
  ferraillage_pret: { label: 'Ferraillage prêt · le contrôleur doit passer', chip: 'saffron', icon: 'hourglass' },
  etape_finie: { label: 'Close · aciers validés, puis béton coulé'   /* vague 18 (jury, n° 2) : l'étanchéité n'est citée que sur l'étape où elle a lieu */, chip: 'success', icon: 'check' },
  etape_finie_corr: { label: 'Close · réserves levées, puis béton coulé', chip: 'success', icon: 'check' },   // vague 6 : ne plus dire la même chose pour un Validé et des réserves levées
  attente_coulage: { label: "Ouvre après le coulage de l'étape d'avant", chip: '', icon: 'lock' },
  vue: { label: 'Déclarée · vue par le client, sans contrôle', chip: '', icon: 'eye' },
  attente_convention: { label: 'En attente de la convention', chip: '', icon: 'file' },   // vague 3 : plus de « Prête à débuter » avant la convention
};
export const VERDICTS = {
  validee: { label: 'Validé', icon: 'checkCircle' },
  retardee: { label: 'Réserves', icon: 'alert' },
  refusee: { label: 'Refusé', icon: 'xCircle' },
};
// « Avis Validé », « Avis avec réserves », « Avis Refusé »
export const avisLabel = (v) => v === 'retardee' ? 'avec réserves' : VERDICTS[v].label;
export const STEP_ICONS = ['foundation', 'wall', 'roof', 'window', 'brush', 'key', 'building', 'grid'];
// Types de chantier (M02) : chacun propose ses étapes. « neuf » reprend les six étapes de référence.
// Vague 9 : les types demandés par la diaspora (immeuble locatif, terrain d'abord, terrain familial, rénovation), compatibles
// avec les règles : TEEQA suit des étapes de travaux. Ce qui précède (titre, permis, accord de la famille) est une liste à
// cocher par le client, sans visite ni certification : TEEQA ne vérifie ni le titre foncier ni le permis.
export const SITE_TYPES = {
  // Vague 18 NT (clients 14 fiches, scène 7) : le titre se fait vérifier par un notaire ; les murs du voisin se photographient avant.
  neuf: { label: 'Construction neuve', short: 'Maison neuve', steps: null,
    avant: ['Titre foncier à votre nom, vérifié par un notaire avant tout paiement', 'Permis de construire délivré par la commune', 'Photos datées des murs mitoyens (voisins), avant les travaux'] },
  immeuble: { label: 'Immeuble locatif R+2 / R+3', short: 'Immeuble R+2/R+3',
    steps: ['Terrassement et fondations', 'Poteaux et chaînages du rez-de-chaussée', 'Dalle du 1er étage', 'Poteaux et dalle du 2e étage', 'Dalle du 3e étage et toiture-terrasse', 'Menuiseries et réseaux', 'Enduits, carrelage et zellige', 'Finitions, contrôle avant réception'] },
  terrain: { label: "Terrain acheté d'abord", short: "Terrain d'abord", steps: null,
    avant: ['Titre foncier ou acte de propriété à votre nom, vérifié par un notaire avant de payer le vendeur', 'Bornage par un géomètre', 'Plans de l’architecte', 'Permis de construire délivré par la commune'] },
  famille: { label: 'Terrain familial ou en indivision', short: 'Terrain familial', steps: null,
    avant: ['Accord écrit des co-héritiers ou co-propriétaires (indivisaires), avec la part de chacun', 'Procuration chez un notaire ou au consulat pour un indivisaire qui vit à l’étranger', 'Qui décide des paiements (co-décideurs invités, chacun signe de son nom)', 'Titre ou acte de partage', 'Permis de construire délivré par la commune'] },   // vague 21 (jury : indivision, procuration)
  extension: { label: 'Extension', short: 'Extension', steps: ["Fondations de l'extension", "Murs et raccord à l'existant", 'Dalle et toiture', 'Menuiseries et réseaux', 'Enduits et finitions'] },
  renovation: { label: 'Rénovation', short: 'Rénovation',
    steps: ['Dépose et démolition', 'Reprises de structure et maçonnerie', 'Électricité et plomberie', 'Enduits, carrelage et zellige', 'Peinture, finitions et réception'],
    avant: ['État des lieux de départ en photos', 'Murs porteurs repérés avant toute démolition', 'Photos datées des murs mitoyens (voisins), avant les travaux'] },
  // Vague 24 (entreprises, 4 sceptiques : « tout est pensé pour le béton ») : des étapes pour les petits métiers, sans point d'arrêt béton,
  // avec un délai de visite adapté (pas de coulage qui attend : 6 jours) ; une visite seulement sur ce qui sera caché (réseaux encastrés, étanchéité).
  metier: { label: 'Petits travaux d’un artisan (plomberie, électricité, menuiserie, peinture, carrelage et zellige)', short: 'Petits travaux',
    steps: ['Préparation et protection des lieux', 'Réseaux encastrés : plomberie et électricité, avant de refermer', 'Étanchéité des pièces d’eau, avec essai à l’eau', 'Carrelage, zellige et faïence', 'Peinture, finitions et réception'],
    avant: ['Devis de l’artisan, poste par poste', 'Photos datées de l’existant avant les travaux'], delais: 'Pas de béton qui attend : la visite a lieu dans le délai de votre ville, écrit juste au-dessus (4 jours dans une ville desservie, 6 jours hors zone), et l’artisan peut continuer ailleurs sur le chantier pendant ce temps.' },
  // Vague 18 NT (clients, 6 fiches) : la reprise d'un chantier abandonné se voit dès « Nouveau chantier ».
  reprise: { label: 'Reprendre un chantier abandonné', short: 'Reprise', steps: null,
    avant: ['Photos datées de ce qui est déjà construit', 'Ce qui a été payé à l’ancienne entreprise, avec les reçus', 'Devis de la nouvelle entreprise pour le reste', 'Visite de constat d’un contrôleur avant de reprendre (conseillée)'] },
};
// Vague 25 (entreprises) : un parcours par métier, sans point d'arrêt béton : chaque métier a ses étapes, et la visite porte sur ce qui sera caché.
export const METIERS = {
  plomberie: { label: 'Plomberie', steps: ['Repérage et protection des lieux', 'Réseaux d’eau et d’évacuation posés, avant de refermer', 'Essai de mise en pression (photo du manomètre)', 'Pose des appareils (lavabo, WC, douche)', 'Essai final et réception'] },
  electricite: { label: 'Électricité', steps: ['Repérage et protection des lieux', 'Gaines et boîtiers encastrés, avant de refermer', 'Tableau, disjoncteur différentiel et prise de terre', 'Appareillage : prises, interrupteurs, éclairage', 'Essais et réception'] },
  menuiserie: { label: 'Menuiserie', steps: ['Prise des cotes et choix validés', 'Dépose des anciennes menuiseries', 'Pose des cadres et calfeutrement', 'Pose des ouvrants, quincaillerie et réglages', 'Finitions et réception'] },
  peinture: { label: 'Peinture', steps: ['Protection des sols et des meubles', 'Rebouchage, enduit et ponçage', 'Sous-couche', 'Deux couches de finition', 'Retouches et réception'] },
  carrelage: { label: 'Carrelage et zellige', steps: ['Préparation et planéité du support (mesurée)', 'Étanchéité des pièces d’eau, avec essai à l’eau', 'Pose du carrelage ou du zellige', 'Joints et plinthes', 'Nettoyage et réception'] },
};
// Vague 25 (entreprises) : tous les chantiers de l'entreprise sur un calendrier simple : visites, échéances de tranches, coulages, délais.
// Vague 25 (contrôleurs, 4 personas : « pas d'agenda ») : le même calendrier pour le contrôleur, ses visites seulement, sans argent.
export function agendaEntreprise(role = 'entreprise') {
  const out = [], ctl = role === 'controleur';
  for (const p of (state && state.projects) || []) { if (p.status === 'clos' || access(p, role) !== 'ok') continue;
    for (const s of p.steps) { const i = p.steps.indexOf(s) + 1, m = s.mission;
      if (ctl) { if (m && s.status === 'fin_declaree' && m.status !== 'suspendue' && missionOk(s)) out.push({ at: (m.slot && m.slot.at) || visitBy(m), quoi: m.slot ? `Visite · ${p.city} (créneau choisi)` : `Visite · ${p.city}, au plus tard`, p, s, i, k: 'visite' }); continue; }
      if (m && s.status === 'fin_declaree' && m.status !== 'suspendue') out.push({ at: (m.slot && m.slot.at) || visitBy(m), quoi: m.slot ? 'Visite du contrôleur (créneau choisi)' : 'Visite du contrôleur, au plus tard', p, s, i, k: 'visite' });
      if (pourSortante(p, s)) continue;   // vague 25-26 (jury n° 18) : une tranche due à l'entreprise sortante n'est jamais dans le calendrier de la reprenante (la visite, oui)
      if (['verrouillee', 'a_venir'].includes(s.status)) continue;   // vague 26 (jury n° 18, GPT 15) : pas d'estimation de tranche pour une étape pas commencée
      const e = echeance(p, s); if (e && trancheDh(p, s)) out.push({ at: e, quoi: `Tranche ${i} due par le client (${dh(resteDu(p, s))})`, p, s, i, k: 'argent' });
      else { const est = echeanceEstimee(p, s); if (est && trancheDh(p, s)) out.push({ at: est, quoi: `Tranche ${i}, vers ce jour (estimation, ${dh(resteDu(p, s))})`, p, s, i, k: 'argent' }); }
      if (coulageDue(p, s)) out.push({ at: new Date(nowMs()).toISOString(), quoi: `Coulage à déclarer (2 photos et le bon)`, p, s, i, k: 'coulage' });
      if (s.booking && s.booking.at) out.push({ at: s.booking.at, quoi: 'Visite réservée d’avance', p, s, i, k: 'visite' }); } }
  const auj = new Date(nowMs()); auj.setHours(0, 0, 0, 0);   // vague 25 : le calendrier commence aujourd'hui
  return out.filter(x => x.at && new Date(x.at).getTime() >= auj.getTime()).sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
export const typeSteps = (t) => [...((SITE_TYPES[t] || SITE_TYPES.neuf).steps || TEMPLATE_STEPS)];
// Points de contrôle (M08) : ce que le contrôleur regarde sur place, étape par étape. Un chantier aux étapes personnalisées
// reçoit trois points généraux. Chaque point reçoit un état : 'ok' conforme, 'ko' à reprendre, 'nv' non vu.
// Vague 4 (contrôleurs) : 5 à 8 points de métier par étape, avec la mesure attendue quand il y en a une. « Sans objet » pour
// un point qui ne s'applique pas au chantier. Les références (plans, note du bureau d'études) sont dans la fiche de mission.
const CHECKS = [
  ['Implantation et dimensions des fouilles (cotes du plan, ± 2 cm)', 'Ferraillage des semelles et des longrines (diamètres et espacements de la note du bureau d’études)', 'Enrobage des aciers : cales de 5 cm au moins (béton contre terre)', 'Fond de fouille propre, sans eau, sur le bon sol', 'Attentes des poteaux en place et à la bonne longueur', 'Béton de propreté sous les semelles'],
  ['Poteaux et chaînages ferraillés selon le plan (nombre et diamètre des aciers)', 'Enrobage des aciers : cales en place', 'Recouvrement avec les attentes des fondations (longueur mesurée)', 'Coffrage des poteaux d’aplomb et étanche', 'Aciers en attente en tête de poteaux, pour la dalle', 'Fond des coffrages propre avant coulage'],   // vague 6 : seulement ce qu'on voit AVANT le coulage (plus de murs montés)
  ['Ferraillage de la dalle (nappes, diamètres, espacements de la note)', 'Béton commandé à la classe de la note : bon de livraison à photographier au coulage (et éprouvettes, si le devis les prévoit)', 'Coffrage, étais et épaisseur prévue (mesurée)', 'Enrobage des aciers : cales en place', 'Réservations des réseaux en place', 'Chapeaux et renforts au droit des appuis', 'Pente de la dalle vers les évacuations (l’étanchéité se pose après, à l’étape « Menuiseries et réseaux », avec un essai à l’eau)'],
  ['Réseaux passés dans les réservations prévues à la dalle (aucun percement du béton)', 'Portes et fenêtres posées, d’aplomb et réglées', 'Gaines électriques et tableau', 'Prises de terre et différentiel', 'Plomberie sous pression, sans fuite (essai)', 'Évacuations avec leur pente', 'Étanchéité de la toiture-terrasse : relevés, pente vers les évacuations, essai d’eau'],   // vague 10 : l'étanchéité a son point
  ['Enduits lisses, sans fissure', 'Planéité des enduits (règle de 2 m)', 'Pose du zellige et des carrelages', 'Joints et finitions des angles', 'Étanchéité des pièces d’eau'],
  ['Peintures terminées', 'Équipements posés et en service', 'Menuiseries qui ferment sans forcer', 'Réseaux essayés devant le client', 'Étanchéité de la toiture-terrasse : essai à l’eau, si elle n’a pas eu sa visite à l’étape des réseaux', 'Nettoyage du chantier, prêt pour la réception'],   // vague 21 (jury n° 17)
];
export const POINT_STATES = { ok: ['Conforme', 'success'], ko: ['À reprendre', 'danger'], nv: ['Non vu', ''], so: ['Sans objet', ''] };
// Vague 7 (jury) : ce que la visite d'une étape type contrôle, et ce qu'elle ne contrôle pas.
export const PERIMETRE = {
  'Terrassement et fondations': "fouilles, aciers des semelles et longrines, enrobage, avant le coulage. Le béton coulé est déclaré par l'entreprise avec deux photos et le bon de livraison de la centrale ; le contrôleur de l'étape suivante relit ce bon (et le résultat des éprouvettes à 28 jours, s'il y en a).",
  'Gros œuvre : murs et poteaux': "les aciers des poteaux et chaînages, avant le coulage, et le bon de livraison du béton des fondations. Les murs de remplissage (briques), montés ensuite, sont déclarés par l'entreprise avec photos, sans visite ; le contrôleur de la dalle les voit en place.",
  'Dalle et toiture-terrasse': "aciers, coffrage, épaisseur et réservations des réseaux (gaines, évacuations) avant le coulage : les réseaux se prévoient ici, pas après. L'étanchéité de la toiture se pose plus tard, à l'étape « Menuiseries et réseaux » : contrôlée sur place si cette étape a une visite, sinon à la visite avant réception ; dans les deux cas, l’entreprise photographie un essai à l’eau (photo imposée, visite ou pas), et un contrôleur la revoit au plus tard avant la réception.",
  'Menuiseries et réseaux': "pose des menuiseries, étanchéité de la toiture-terrasse (essai à l'eau), réseaux passés dans les réservations de la dalle, essais d'eau et d'électricité.",
  'Enduits et zellige': "planéité des enduits, pose du zellige, étanchéité des pièces d'eau.",
  'Finitions, contrôle avant réception': "finitions et équipements, avant la réception signée par le client.",
};
// Vague 9 : points de contrôle des étapes d'immeuble et de rénovation.
const CHECKS_PLUS = {
  'Poteaux et chaînages du rez-de-chaussée': 1, 'Poteaux et dalle du 2e étage': 1, 'Dalle du 1er étage': 2, 'Dalle du 3e étage et toiture-terrasse': 2, 'Enduits, carrelage et zellige': 4,
  'Reprises de structure et maçonnerie': ['Murs porteurs repérés et étayés avant ouverture', 'Linteaux ou poutres posés sur les ouvertures créées', 'Aciers et enrobage des reprises (avant coulage)', 'Fissures existantes traitées ou signalées', 'Évacuation des gravats'],
  // 20 nov. : chantier clos d'exemple (villa R+1) : poteaux de l'étage et dalle de la toiture-terrasse, au même point d'arrêt.
  'Poteaux de l’étage et toiture-terrasse': ['Poteaux de l’étage ferraillés selon le plan, recouvrement avec les attentes (longueur mesurée)', 'Enrobage des aciers : cales en place', 'Ferraillage de la dalle de toiture (nappes, diamètres, espacements de la note)', 'Coffrage, étais et épaisseur prévue (mesurée)', 'Réservations des évacuations en place', 'Pente de la dalle vers les évacuations (l’étanchéité se pose plus tard, à l’étape des réseaux)'],
  'Électricité et plomberie': ['Gaines et tableau électrique neufs', 'Prise de terre mesurée', 'Réseaux d’eau en charge, sans fuite', 'Évacuations avec pente', 'Saignées rebouchées'],
};
export const checkPoints = (s) => { const x = CHECKS_PLUS[s.title]; if (x !== undefined) return typeof x === 'number' ? CHECKS[x] : x; const i = TEMPLATE_STEPS.indexOf(s.title); return i >= 0 ? CHECKS[i] : ['Conformité au plan transmis (cotes mesurées)', "Qualité de l'exécution", 'Matériaux conformes au devis', 'Raccord avec l’existant', 'Sécurité et propreté du chantier']; };
export const TEMPLATE_STEPS = [
  'Terrassement et fondations',
  'Gros œuvre : murs et poteaux',
  'Dalle et toiture-terrasse',
  'Menuiseries et réseaux',
  'Enduits et zellige',
  'Finitions, contrôle avant réception',
];

const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 8);
const iso = (s) => new Date(s).toISOString();
// Vague 4 : une horloge qu'on peut avancer (visite guidée du panel : chaque geste à son heure, pas tous à la même minute).
let SHIFT = 0;
export const nowMs = () => Date.now() + SHIFT;
export function setClock(at) { SHIFT = at ? new Date(at).getTime() - Date.now() : 0; }
const now = () => new Date(nowMs()).toISOString();
const H = 3600000;
// Vague 15 : les délais se comptent en heures d'horloge (24 h + 72 h donnent la même heure, même au changement d'heure d'octobre).
const plus = (at, h) => { const d = new Date(at); if (Number.isInteger(h)) d.setHours(d.getHours() + h); else d.setTime(d.getTime() + h * H); return d.toISOString(); };

// ---------- Règles du workflow V1 (19 nov.) ----------
// Au moins 3 photos prises dans l'appli et envoyées pour déclarer une fin ; 2 corrections refusées au plus, puis Refusé.
export const MIN_PHOTOS = 3;
export const MAX_CORRECTIONS = 2;
export const COULAGE_PHOTOS = 2;   // vague 12 : un coulage ne se déclare pas sur une seule photo
// Délais (en heures) de chaque attente, avec une relance : invitation, mission, visite, correction, paiement, avenant.
// Vague 4 : « Je préfère attendre » a un délai de 7 jours (attente), puis l'entreprise peut relancer le client.
export const AVENANT_EXPIRE_J = 5;   // parcours B (26 nov.) : workflow P5, l'avenant sans réponse expire au bout de 5 jours
export const DELAIS = { invitation: 72, mission: 24, visite: 72, correction: 168, paiement: 168, attente: 168, avenant: 72, desaccord: 48, abandon: 192 };
export const DELAI_LABEL = { invitation: 'Invitation sans réponse', mission: 'Visite pas encore acceptée', visite: 'Visite pas encore faite', correction: 'Correction attendue', paiement: 'Paiement en attente', attente: 'Attente du client dépassée', avenant: 'Avenant sans réponse', desaccord: 'Désaccord sans réponse', abandon: 'Arrêt du chantier sans réponse', retard: 'Date de fin prévue dépassée' };
// Garanties après la réception : un an de garantie prévu par la convention, décennale de 10 ans (art. 769 du DOC).
export const GARANTIES = { parfait: 12, decennale: 120 };   // en mois
// Vague 4 : une seule règle pour les garanties, la même partout (convention, réception, aide).
export const GARANTIE_TXT = "À la réception provisoire, le client prend possession de la maison et reçoit les clés. Commencent alors la garantie d'un an prévue par la convention (l'entreprise reprend ce qui est noté au procès-verbal ou apparaît dans l'année) et la garantie décennale (art. 769 du DOC) pour la solidité de l'ouvrage. La réception définitive se signe quand les réserves du procès-verbal sont levées, au plus tard à la fin de cette année de garantie.";
const DEMO_PRO_EMAIL = 'contact@rachid-btp.ma';
const SEED_OWNER = 'karim';

// Panel du 19 nov. : les visites vont d'abord aux étapes qu'on ne peut plus voir ensuite. Ordre de priorité : fondations
// (1re étape), structure / dalle (milieu), réception (dernière), puis les autres dans l'ordre. Au moins 3 visites (« Suivi contrôlé »).
// Vague 2 (19 nov.) : la structure verticale (murs et poteaux) entre dans les étapes clés. Étapes clés : fondations, murs et
// poteaux, dalle, réception (les 3 premières et la dernière ; toutes quand il y en a 4 ou moins). Au moins 4 visites.
export const MIN_VISITS = 4;
const keyIdx = (n) => n <= MIN_VISITS ? Array.from({ length: n }, (_, i) => i) : [0, 1, 2, n - 1];
export function visitPriority(n) { return [...new Set([...keyIdx(n), ...Array.from({ length: n }, (_, i) => i)])]; }
export const keyStep = (n, i) => keyIdx(n).includes(i);
// Point d'arrêt avant coulage : pour une étape de béton armé contrôlée (fondations, murs et poteaux, dalle), l'entreprise
// déclare la fin quand le ferraillage est prêt, avant de couler : le contrôleur voit les aciers avant qu'ils soient cachés.
// Vague 9 : dans un immeuble, chaque dalle et chaque niveau de poteaux est aussi un point d'arrêt (s'il a sa visite).
const STRUCT_TITLE = /^(Poteaux|Dalle)\b/;
export const avenantStructure = (title = '', note = '') => /béton armé|radier|ferraill|fondation|poteau|dalle|piscine|mur porteur|soutènement/i.test(`${title} ${note}`);
export const holdPoint = (p, s) => !!(p && p.steps && s) && isControlled(s) && (keyStep(p.steps.length, p.steps.indexOf(s)) || STRUCT_TITLE.test(s.title) || !!s.structure) && p.steps.indexOf(s) < p.steps.length - 1 && !(p.prep && p.prep.type === 'metier');   // vague 24 : pas de point d'arrêt béton pour les petits métiers
// Date limite de la visite : 24 h pour qu'une agence accepte, puis 72 h pour passer.
// Vague 5 : l'échéance ne bouge plus à l'acceptation (elle est fixée à la demande) ; hors zone, 5 jours au lieu de 3.
// Vague 9 : après un désistement, l'échéance de passage d'origine est gardée telle quelle (finalDue), à la minute près.
export const visitBy = (m) => m.finalDue || (m.status === 'acceptee' ? m.dueAt : plus(m.dueAt, m.visitH || DELAIS.visite));
// Deux formules (décision du 19 nov.) : « Suivi contrôlé » (au moins 3 visites aux étapes clés, présélectionné) ou « Suivi »
// (k = 0 : aucune visite ; l'appli n'emploie alors jamais le mot « vérifié »).
export const FORMULES = { controle: { label: 'Suivi contrôlé', text: 'Un contrôleur passe sur place aux étapes clés : fondations, murs et poteaux, dalle, finitions. Vous pouvez ajouter des visites.' }, suivi: { label: 'Suivi', text: "L'entreprise déclare chaque étape avec ses photos ; aucune visite de contrôle, rien n'est vérifié sur place." } };
export const formuleOf = (p) => p.steps.some(isControlled) ? 'controle' : 'suivi';
// 19 nov. : les prix s'affichent (règle levée par l'utilisateur). Une seule source : TARIFS, en dirhams ; l'euro est
// calculé (1 € ≈ 10,8 DH, arrondi à 5 €). TEEQA encaisse seulement ses propres services ; le paiement des travaux reste
// entre le client et l'entreprise, hors TEEQA, et n'a rien à voir avec ces prix.
export const EURO_DH = 10.8;
export const TARIFS = {
  // Vague 8 : une seule logique de prix, sans remise cachée. Forfait = suivi (1 500 DH) + 1 100 DH par visite, que la visite
  // soit comprise ou ajoutée. Suivi contrôlé, 4 visites : 1 500 + 4 × 1 100 = 5 900 DH. Chaque visite coûte partout 1 100 DH.
  suivi: { dh: 1500, label: 'Formule Suivi, sans visite, par chantier' },
  controle: { dh: 5900, label: 'Suivi contrôlé, avec 4 visites clés', visites: 4 },
  // 1 100 DH : honoraires courants d'un bureau de contrôle au Maroc pour la visite d'une villa (800 à 1 500 DH en 2026).
  visite: { dh: 1100, label: 'Visite (comprise ou ajoutée)' },
  // Contre-visite graduée (vague 8) : 950 DH pour un Refusé ou 3 points à reprendre ou plus ; 600 DH pour 1 ou 2 points
  // (la visite est plus courte). Jamais plus que le prix d'une visite.
  contreVisite: { dh: 950, label: 'Contre-visite (Refusé, ou 3 points à reprendre ou plus)', plafond: 'visite' },
  contreVisiteMineure: { dh: 600, label: 'Contre-visite courte (1 ou 2 points à reprendre)', plafond: 'visite' },
  // Un second avis est une visite complète par une autre agence ; remboursé à qui le demande s'il a raison.
  secondAvis: { dh: 1100, label: 'Second avis par une autre agence', plafond: 'visite' },
  // Une visite demandée par le client à la place d'un contrôle sur photo (à la charge de l'entreprise si la correction n'est pas faite).
  visiteClient: { dh: 1100, label: 'Visite demandée par le client', plafond: 'visite' },
  // Correction contrôlée sur photo : comprise dans le forfait (pas de déplacement).
  correctionPhoto: { dh: 0, label: 'Correction contrôlée sur photo' },
  // Part du contrôleur, versée par son agence (TEEQA paie l'agence, l'agence paie le contrôleur).
  // Vague 18 (jury, n° 16) : au-delà de 40 km, chaque kilomètre de plus (aller) est payé au contrôleur par son agence.
  remuneration: { visite: 350, contreVisite: 250, contreVisiteMineure: 180, secondAvis: 350, correctionPhoto: 80, visiteImpossible: 150, deplacement: 100, km: 2 },
  // Ce que TEEQA verse à l'agence (le reste couvre l'appli, l'horodatage, l'assurance et le support).
  // Vague 12 : 700 DH à l'agence sur une visite à 1 100 DH TTC (917 DH HT) : 217 DH restent à TEEQA (voir marge()).
  agence: { visite: 700, contreVisite: 600, contreVisiteMineure: 380, secondAvis: 700 },
  tva: 0.2,
  // Vague 8 : plafonds d'assurance écrits (contrat type de mission) : RC professionnelle de l'agence et RC de TEEQA.
  assurance: { rcAgenceAn: 6000000, rcAgence: 2000000, franchiseAgence: 10000, rcTeeqa: 1000000 },
};
const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const euros = (dh) => Math.round(dh / EURO_DH);   // vague 9 : un seul taux, sans arrondi à 5 € (les proportions restent justes)
export const dh = (n) => `${grp(n)} DH`;
// « 1 200 DH (≈ 110 €) » : le prix et son équivalent en euros, pour la diaspora.
// Vague 11 : l'équivalent n'est montré qu'au client qui vit hors du Maroc, dans la devise de son pays (voir PAYS).
export const prix = (n, { eur = true } = {}) => { if (n === 0) return 'compris'; const d = eur && deviseVue(); return d ? `${dh(n)} (≈ ${enDeviseTaux(n, d)})` : dh(n); };
export const tarif = (k, o) => prix(TARIFS[k].dh, o);
// Forfait TEEQA pour k visites : le suivi + 1 100 DH par visite (0 = formule Suivi ; 4 = Suivi contrôlé, 5 900 DH).
export const forfaitDh = (k) => TARIFS.suivi.dh + (k || 0) * TARIFS.visite.dh;
// Contre-visite graduée : courte (600 DH) pour 1 ou 2 points à reprendre, sinon 950 DH (Refusé, ou 3 points et plus).
export const contreVisiteKey = (rv) => rv && rv.verdict === 'retardee' && (rv.points || []).filter(x => x && x.state === 'ko').length <= 2 && (rv.points || []).some(x => x && x.state === 'ko') ? 'contreVisiteMineure' : 'contreVisite';
// Vague 24 (jury n° 3 et 13, 8 personas) : un vrai paiement du forfait ; en 3 fois, un tiers avant chacune des 3 premières visites.
export const FORFAIT_AGENCES = 'Wafacash, Cash Plus ou Barid Cash (Al Barid Bank)';
// Vague 25 (jury GPT n° 6) : trois tiers arrondis au dirham (5 900 DH = 1 967 + 1 967 + 1 966), pas à la dizaine.
export const forfaitTiers = (total) => { const t = Math.floor(total / 3), r = total - 3 * t; return [t + (r > 0 ? 1 : 0), t + (r > 1 ? 1 : 0), t]; };
export const forfait = (k, o) => prix(forfaitDh(k), o);
// Vague 13 : un seul prix par formule, dit pareil partout : Suivi 1 500 DH ; Suivi contrôlé 5 900 DH (4 visites clés) ;
// chaque visite en plus ajoute 1 100 DH. Ex. Villa Nador, 6 visites : 5 900 DH + 2 × 1 100 DH = 8 100 DH.
export const forfaitCalc = (k) => { const c = TARIFS.controle.visites, v = dh(TARIFS.visite.dh);
  if (!k) return `formule Suivi, ${dh(TARIFS.suivi.dh)}`;
  if (k === c) return `Suivi contrôlé, ${dh(TARIFS.controle.dh)} (${c} visites clés)`;
  if (k > c) return `Suivi contrôlé ${dh(TARIFS.controle.dh)} (${c} visites clés) + ${k - c} visite${k - c > 1 ? 's' : ''} ajoutée${k - c > 1 ? 's' : ''} × ${v} = ${dh(forfaitDh(k))}`;
  return `${dh(TARIFS.suivi.dh)} + ${k} visite${k > 1 ? 's' : ''} × ${v} = ${dh(forfaitDh(k))}`; };
// Vague 12 : ce que TEEQA garde sur une visite : prix TTC, TVA, part de l'agence (dont le contrôleur), reste.
// Vague 18 NT (clients) : la part de TEEQA sur une visite, détaillée (somme = marge().teeqa, vérifiée par un test).
// Vague 19 (jury, 6 personas) : la part de TEEQA paie ses coûts par visite ET laisse une marge positive, écrite (estimation de coûts,
// pas un chiffre de pilote). Somme des coûts + marge = marge().teeqa (test e2e).
export const MARGE_DETAIL = { horodatage: 30, assurance: 25, support: 45, nonFacturees: 30, appli: 27 };
// Le suivi (1 500 DH TTC, 1 250 DH HT par chantier) : conseiller et support, hébergement des pièces, frais de paiement, assurance.
export const SUIVI_DETAIL = { conseiller: 600, hebergement: 120, paiement: 60, assurance: 100 };
export const marge = () => { const ttc = TARIFS.visite.dh, ht = Math.round(ttc / (1 + TARIFS.tva)), ag = TARIFS.agence.visite, ctl = TARIFS.remuneration.visite + TARIFS.remuneration.deplacement;
  const couts = Object.values(MARGE_DETAIL).reduce((a, b) => a + b, 0), sht = Math.round(TARIFS.suivi.dh / (1 + TARIFS.tva)), scouts = Object.values(SUIVI_DETAIL).reduce((a, b) => a + b, 0), k = TARIFS.controle.visites;
  return { ttc, ht, tva: ttc - ht, agence: ag, controleur: ctl, resteAgence: ag - ctl, teeqa: ht - ag, couts, margeVisite: ht - ag - couts, suiviHt: sht, suiviCouts: scouts, margeSuivi: sht - scouts, visitesChantier: k, margeChantier: sht - scouts + k * (ht - ag - couts) }; };
// Vague 18 (jury, n° 21) : pourquoi la contre-visite est à la charge de l'entreprise, et où va l'argent (comme pour la visite).
export const cvRepartTxt = (k) => { const t = TARIFS[k].dh, ag = TARIFS.agence[k], c = TARIFS.remuneration[k], d = TARIFS.remuneration.deplacement;
  return `À la charge de l'entreprise, après un avis Réserves ou Refusé : on revient voir la reprise d'un point noté à reprendre. Sur ${dh(t)} TTC : ${dh(ag)} à l'agence (dont ${dh(c)} au contrôleur et ${dh(d)} de déplacement), ${dh(t - ag)} à TEEQA, TVA comprise.`; };
// Tous les montants que l'appli peut afficher (le test « prix » vérifie que chaque montant lu vient d'ici).
export function prixValides() {
  const v = new Set();
  const add = (n) => { if (n) { v.add(Math.round(n)); v.add(euros(n)); for (const d of Object.keys(DEVISES)) v.add(enDevise(n, d)); } };
  for (const k of Object.keys(TARIFS)) if (TARIFS[k].dh != null) add(TARIFS[k].dh);
  for (let k = 0; k <= 12; k++) add(forfaitDh(k));
  for (const x of Object.values(TARIFS.remuneration)) add(x);
  for (const x of Object.values(TARIFS.agence)) add(x);
  for (const x of Object.values(TARIFS.assurance)) add(x);
  for (const x of Object.values(marge())) add(x);
  for (const x of Object.values(MARGE_DETAIL)) add(x);
  { const m = marge(); add(m.visitesChantier * m.couts); add(m.visitesChantier * m.margeVisite); add(m.visitesChantier * m.teeqa); for (let k = 0; k <= 12; k++) forfaitTiers(forfaitDh(k)).forEach(add); }   // vague 25 : calcul de la part de TEEQA par chantier ; tiers du forfait au dirham   // vague 18 NT : où vont les 217 DH de TEEQA par visite
  for (const x of Object.values(SUIVI_DETAIL)) add(x);   // vague 19 : coûts du suivi par chantier
  for (const k of ['contreVisite', 'contreVisiteMineure']) add(TARIFS[k].dh - TARIFS.agence[k]);   // vague 18 : répartition d'une contre-visite
  add(SEQUESTRE.ouverture); add(SEQUESTRE.min);   // 20 nov. : frais de la banque du séquestre
  try { for (const p of (state && state.projects) || []) { add(seqSolde(p)); for (const s of p.steps) if (s.sequestre) add(s.sequestre.dh); } } catch { /* rien */ }
  // Vague 22 : situations de travaux de l'entreprise : HT et TVA (20 %) de chaque tranche du devis.
  try { for (const p of (state && state.projects) || []) { const b = budgetOf(p); if (b) for (const l of b.lignes) if (l.dh) { const ht = Math.round(l.dh / 1.2); v.add(ht); v.add(l.dh - ht); } } } catch { /* rien */ }
  // Vague 24 : frais du séquestre pour tout le chantier (et par tranche), argent de la reprise (versé, dû à la sortante, à la reprenante).
  try { for (const p of (state && state.projects) || []) { add(seqFraisTotal(p)); const b = budgetOf(p); if (b) for (const l of b.lignes) if (l.dh) add(Math.max(SEQUESTRE.min, Math.round(l.dh * 0.004))); const ra = p.reprise && repriseArgent(p); if (ra) for (const x of Object.values(ra)) if (typeof x === 'number') add(x); } } catch { /* rien */ }
  add(6000000);   // vague 10 : plafond annuel de l'assurance de l'agence
  // Vague 8 : budget des travaux saisi d'après le devis (montants du client, pas des prix TEEQA).
  try { for (const p of (state && state.projects) || []) { for (const a of p.avenants || []) add(a.dh); if (p.forfait) add(forfaitDh(p.steps.filter(isControlled).length)); const b = budgetOf(p); if (!b) continue; add(b.total); add(b.paye); add(b.reste); add(b.seq); add(b.partiel); add(b.recu); for (const t of b.lignes) { add(t.dh); add(t.partiel); add(t.dh - t.partiel); for (const x of t.partiels) add(x.dh); } for (const a of b.avenants) add(a.dh); } } catch { /* rien */ }
  return v;
}
export function controlledIndexes(n, k) {
  if (k === 0) return new Set();
  k = Math.max(Math.min(MIN_VISITS, n), Math.min(k || n, n));
  return new Set(visitPriority(n).slice(0, k));
}
export const isControlled = (s) => s.controlled !== false;
export const allControlled = (p) => p.steps.every(isControlled);
// Clé de libellé à afficher (STATUS[statusKey(s)]) : une fin déclarée sans visite n'attend pas d'avis.
// Vague 3 : avec le chantier (p), une étape « à débuter » d'un chantier dont la convention n'est pas acceptée dit « En attente de la convention ».
// Vague 4 : une étape de béton armé dont le ferraillage est contrôlé attend la déclaration du coulage (« Ferraillage contrôlé · coulage à déclarer »).
// Vague 5 : à un point d'arrêt, « Ferraillage prêt » (jamais « Fin déclarée »), puis « Étape finie » une fois le coulage déclaré ;
// l'étape suivante dit qu'elle attend ce coulage (elle ne peut pas débuter avant).
// Parcours B (26 nov., workflow P2) : l'entreprise donne une date de fin prévue au début ; dépassée, l'étape est « En retard ».
export const finEtapeDepassee = (s, t = nowMs()) => !!(s && s.status === 'debutee' && s.finPrevue && t > new Date(s.finPrevue).getTime());
export const statusKey = (s, p = projOf(s)) => {
  if (finEtapeDepassee(s)) return 'en_retard';
  if (s.status === 'fin_declaree' && !isControlled(s)) return 'fin_declaree_sans';
  if (s.status === 'a_venir' && p && !conventionOk(p)) return 'attente_convention';
  if (p && coulageDue(p, s)) return 'coulage_attendu';
  if (s.status === 'fin_declaree' && s.pendingReview) return 'avis_en_attente';   // vague 15 : avis signé sans réseau
  if (enContreVisite(s)) return 'contre_visite';
  if (p && s.status === 'fin_declaree' && holdPoint(p, s)) return 'ferraillage_pret';
  if (p && ['validee', 'corrigee'].includes(s.status) && holdPoint(p, s) && s.coulage) return s.status === 'corrigee' ? 'etape_finie_corr' : 'etape_finie';
  if (p && s.status === 'a_venir' && coulageDue(p, p.steps[p.steps.indexOf(s) - 1])) return 'attente_coulage';
  return s.status; };
// Vague 8 : une correction envoyée attend sa contre-visite (ou un second avis) : l'avis avec réserves reste en vigueur.
export const enContreVisite = (s) => !!s && s.status === 'fin_declaree' && s.controlled !== false && s.reviews.length > 0 && !!s.mission && ['contre-visite', 'correction', 'second_avis'].includes(s.mission.reason);
// Vague 8 : la première déclaration de fin (« Ferraillage prêt ») garde sa date ; une correction a sa propre date.
export const firstEndAt = (s) => (s && (s.firstEndAt || ((s.history || []).find(h => h.type === 'end') || {}).at || s.endDeclaredAt)) || null;
// Le mot de la déclaration de fin : « Ferraillage prêt » à un point d'arrêt, « Fin déclarée » ailleurs.
export const endWord = (p, s) => p && s && holdPoint(p, s) ? 'Ferraillage prêt' : 'Fin déclarée';
const projOf = (s) => state && state.projects && state.projects.find(p => p.steps.includes(s));
// Vague 4 (point d'arrêt) : l'avis porte sur le ferraillage ; le coulage vient APRÈS, déclaré par l'entreprise avec une photo.
// Le paiement n'est recommandé qu'une fois le coulage déclaré : l'étape est alors vraiment finie.
export const coulageDue = (p, s) => !!p && !!s && ['validee', 'corrigee'].includes(s.status) && holdPoint(p, s) && !s.coulage;
// Une tranche se nomme toujours « Tranche n · nom de l'étape ».
export const trancheName = (p, s) => `Tranche ${p.steps.indexOf(s) + 1} · ${s.title}`;
// Vague 7 : réserve de structure. Au point d'arrêt (aciers vus avant coulage), tout ce qui est repris sera caché par le béton :
// la correction se contrôle sur place, jamais sur photo. Ailleurs, un point « à reprendre » qui touche la structure ou un
// ouvrage caché (aciers, enrobage, recouvrement, coffrage, poteau…) aussi. Le contrôleur ne peut pas choisir « photo » dans ces cas.
export const STRUCTURE_RX = /ferraill|acier|enrobage|\bcales?\b|recouvrement|attentes?\b|chapeaux|coffrage|étais|poteau|semelle|longrine|chaînage|fondation|fissure|réservation/i;
// Vague 14 : points clés = ceux de la structure ou d'un ouvrage caché (au moins 1). « Le reste conforme » exige une photo par point clé.
export const pointsCles = (labels = []) => Math.max(1, labels.filter(l => STRUCTURE_RX.test(l || '')).length);
// Vague 17 (jury, n° 2) : une seule règle de photos, celle de REGLES.photosAvis : une par point clé, et une par point à reprendre hors point clé.
export const photosRequises = (labels = [], states = {}) => pointsCles(labels) + labels.filter((l, i) => states[i] === 'ko' && !STRUCTURE_RX.test(l || '')).length;
// Vague 18 (jury, n° 1) : nombre de photos qu'un avis demande, le même pour l'écran, la signature et le contrôle des données d'exemple.
// Contre-visite : une photo par point revu (au moins une), jamais « 0 demandée ».
export const photosAvisRequises = (rv) => rv.contreVisite ? Math.max(1, (rv.portee || []).length) : photosRequises((rv.points || []).map(x => x.label), Object.fromEntries((rv.points || []).map((x, i) => [i, x.state])));
export const estCle = (l) => STRUCTURE_RX.test(l || '');
// Vague 17 (jury, n° 8) : Validé interdit par un point « à reprendre », ou par un point clé « Non vu ».
export const valideInterdit = (points = []) => points.some(x => x && (x.state === 'ko' || (x.state === 'nv' && estCle(x.label))));
// Vague 14 : motif obligatoire pour Réserves et Refusé (10 caractères), facultatif pour Validé.
export const motifOk = (verdict, motif = '') => verdict === 'validee' || (String(motif || '').trim().length >= 10 && !/Précisez : lequel, de combien\./.test(motif));   // vague 26 (rejeu au doigt : Samira) : le motif prérempli doit être précisé avant la signature
// Vague 14 : en contre-visite, le Validé couvre les points revus (ceux à reprendre ou non vus au premier avis).
export const pointsRevus = (s) => { const rv = s && enContreVisite(s) ? s.reviews[s.reviews.length - 1] : null; return rv ? (rv.points || []).filter(x => ['ko', 'nv'].includes(x.state)).map(x => x.label) : []; };
// Vague 14 : qui paie la contre-visite : l'entreprise, sauf si le dernier avis refuse un point qui n'était pas écrit au premier avis.
export const cvPayeur = (s) => { const rv = s && s.reviews[s.reviews.length - 1]; if (rv && rv.nouveaux && rv.nouveaux.length) return 'agence'; return rv && (rv.points || []).length && !(rv.points || []).some(x => x.state === 'ko') && (rv.points || []).some(x => x.state === 'nv') ? 'personne' : 'entreprise'; };
// Vague 17 : la phrase de qui paie la contre-visite, écrite une fois.
// Vague 24 (entreprises, 4 sceptiques) : une règle équitable, écrite une fois : la contre-visite est plafonnée et partagée quand elle sert aussi le client.
export const CV_EQUITE = "Règle équitable de la contre-visite : l'entreprise en paie 2 au plus par étape (jamais plus que le prix d'une visite chacune) ; au-delà, l'agence revient sans frais pour personne. Si la même contre-visite revoit aussi un point ajouté ou demandé par le client, son prix est partagé à moitié. Non facturée si le point refusé n'était pas écrit au premier avis, ou si un second avis annule l'avis.";
export const cvPayeurTxt = (k) => k === 'agence' ? 'Contre-visite non facturée à l’entreprise : le point refusé n’était pas écrit au premier avis.' : k === 'personne' ? 'Contre-visite facturée à personne : elle ne revoit que des points « Non vu » (caché ou inaccessible ce jour-là).' : '';
export const reserveSurPlace = (p, s, points = []) => holdPoint(p, s) || points.some(x => x && x.state === 'ko' && STRUCTURE_RX.test(x.label || ''));
export const reserveWhy = (p, s) => holdPoint(p, s) ? "Point d'arrêt avant coulage : ce qui est repris sera caché par le béton. La correction se contrôle sur place, jamais sur photo (règle de la convention)." : "Un point à reprendre touche la structure ou un ouvrage caché : la correction se contrôle sur place, jamais sur photo (règle de la convention).";
// Vague 7 : créneau réservé d'avance. L'entreprise annonce « ferraillage prêt prévu le … » au moins 48 h avant ; l'agence
// confirme le créneau et le contrôleur passe ce jour-là. Le béton n'attend alors que quelques heures, pas 4 jours.
export const BOOK_MIN_H = 48;
export function bookOptions(from = nowMs()) {
  const out = []; for (let d = 2; d <= 8 && out.length < 4; d++) for (const h of ['matin', 'apres-midi']) { const x = new Date(from); x.setDate(x.getDate() + d); x.setHours(h === 'matin' ? 9 : 14, 0, 0, 0);
    if (x.getDay() !== 0 && x.getTime() >= from + BOOK_MIN_H * H && out.length < 4) out.push({ at: x.toISOString(), h, day: d }); }
  return out;
}
export const bookingActive = (s) => !!(s && s.booking && !s.booking.cancelledAt && !s.booking.usedAt);

function makeStep(title, i) {
  return {
    id: 's' + (i + 1), title, controlled: true, status: i === 0 ? 'a_venir' : 'verrouillee',
    startedAt: null, endDeclaredAt: null, photos: [], reviews: [], corrections: [],
    messages: [], contest: null, decision: null, history: [],
  };
}

// L'étape 2 d'exemple vient d'être déclarée (il y a 4 h) : plus de visite demandée 13 jours après la fin.
// Heures de journée (vague 2 : des photos datées de 3 h du matin trahissaient la maquette) : on part d'aujourd'hui 11 h,
// ou d'hier 16 h avant midi.
const ago = (h) => { const b = new Date(nowMs()); if (b.getHours() < 12) { b.setDate(b.getDate() - 1); b.setHours(16, 0, 0, 0); } else b.setHours(11, 0, 0, 0); return new Date(b.getTime() - h * H).toISOString(); };
function seedProject() {
  const steps = TEMPLATE_STEPS.map(makeStep);
  const [s1, s2] = steps;
  // Vague 4 : les pièces de la mission (plans de l'architecte, note du bureau d'études), lues par le contrôleur avant la visite.
  const pieces = [
    { id: 'pc-devis', kind: 'devis', title: 'Devis Rachid BTP n° 2026-118', by: 'entreprise', at: iso('2026-08-18T17:30:00'), note: 'Signé le 18 août 2026 · montant de chaque tranche' },
    { id: 'pc-plans', title: "Plans d'exécution · architecte", by: 'client', at: iso('2026-08-20T10:00:00'), note: 'Plans, coupes et façades · indice B' },
    { id: 'pc-bet', title: "Note de calcul et plans de ferraillage · bureau d'études", by: 'client', at: iso('2026-08-20T10:02:00'), note: 'Fondations, poteaux, dalle' },
    { id: 'pc-sol', title: 'Rapport de sol', by: 'client', at: iso('2026-08-20T10:03:00'), note: 'Nature du sol et profondeur des fondations' },
    // Vague 18 (jury, n° 9) : le plan des réseaux est joint avant le chantier (les réservations de la dalle le suivent).
    { id: 'pc-reseaux', title: 'Plan des réseaux (électricité, plomberie)', by: 'client', at: iso('2026-08-20T10:04:00'), note: 'Plan avant travaux, dessiné par le bureau d’études', version: 1 },
  ];
  // Vague 4 : un exemple cohérent de bout en bout. Une photo de départ, 3 photos de fin (ferraillage prêt), la visite le
  // 22 sept. pendant le créneau, l'avis sur le ferraillage, PUIS le coulage déclaré le 23 avec sa photo, puis le paiement.
  const ph = (id, by, at, step, variant, caption = '') => ({ id, by, at: iso(at), sim: { step, variant }, sync: 'synchronisee', version: 1, ...(caption ? { caption } : {}) });
  const p0 = ph('ph-a0', 'entreprise', '2026-09-01T07:55:00', 0, 0, 'Terrain implanté, début des fouilles');
  const p1 = ph('ph-a1', 'entreprise', '2026-09-18T09:10:00', 0, 0, 'Vue d’ensemble des fouilles ferraillées'), p1b = ph('ph-a1b', 'entreprise', '2026-09-18T09:14:00', 0, 1, 'Semelle S3 et ses cales d’enrobage'), p1c = ph('ph-a1c', 'entreprise', '2026-09-18T09:20:00', 0, 2, 'Longrine côté rue, attentes des poteaux');
  const p2 = ph('ph-a2', 'controleur', '2026-09-22T10:42:00', 0, 1, 'Point clé : enrobage mesuré, semelle S3'), p3 = ph('ph-a3', 'controleur', '2026-09-22T10:47:00', 0, 2, 'Point clé : ferraillage des longrines, espacements');
  // Vague 18 (jury, n° 1) : une photo du contrôleur par point clé de l'étape (4 ici), chacune légendée par son point.
  const p3b = ph('ph-a3b', 'controleur', '2026-09-22T10:52:00', 0, 1, 'Point clé : attentes des poteaux, longueur mesurée'), p3c = ph('ph-a3c', 'controleur', '2026-09-22T10:56:00', 0, 0, 'Point clé : béton de propreté sous la semelle S3');
  const pc = ph('ph-a4', 'entreprise', '2026-09-23T16:05:00', 0, 0, 'Coulage des semelles et longrines terminé'), pcb = ph('ph-a4b', 'entreprise', '2026-09-23T16:07:00', 0, 1, 'Coulage : longrine côté rue, béton vibré'), pcl = ph('ph-a4c', 'entreprise', '2026-09-23T16:09:00', 0, 2, 'Bon de livraison du béton (classe de la note)');   // vague 25 (jury n° 1) : 2 photos et le bon, comme le dit le fil
  Object.assign(s1, {
    status: 'validee', startedAt: iso('2026-09-01T08:00:00'), endDeclaredAt: iso('2026-09-18T09:30:00'),
    photos: [p0, p1, p1b, p1c, p2, p3, p3b, p3c, pc, pcb, pcl],
    mission: { status: 'faite', at: iso('2026-09-18T09:30:00'), acceptedAt: iso('2026-09-19T09:20:00'), dueAt: iso('2026-09-22T09:20:00'), slot: { day: 3, h: 'matin', at: iso('2026-09-22T09:00:00') }, doneAt: iso('2026-09-22T11:06:00'), by: 'teeqa', tries: 1 },
    reviews: [{ id: 'rv-1', verdict: 'validee', motif: "Ferraillage des semelles et longrines conforme au plan du bureau d'études : diamètres, espacements et cales d'enrobage de 5 cm au moins (béton en contact avec le sol, d’après la note de calcul du bureau d’études). Le coulage peut se faire.", pieces: ['ph-a2', 'ph-a3', 'ph-a3b', 'ph-a3c'], by: 'controleur', at: iso('2026-09-22T11:05:00'), signature: demoSig(), signedAt: iso('2026-09-22T11:06:00'),
      points: CHECKS[0].map((label) => ({ label, state: 'ok' })), mesures: 'Enrobage mesuré : 5 à 6 cm (5 cm au moins contre terre). Semelle S3 : 80 × 80 cm.' }],
    coulage: { at: iso('2026-09-23T16:10:00'), photoId: 'ph-a4' },
    decision: { status: 'indique', at: iso('2026-09-24T19:12:00'), proof: 'photo', proofAt: iso('2026-09-24T19:12:00'), receivedAt: iso('2026-09-25T10:04:00') },
    history: [
      ev('entreprise', 'start', 'Début déclaré avec 1 photo', '2026-09-01T08:00:00'),
      ev('entreprise', 'photo', '3 photos de fin ajoutées : ferraillage prêt', '2026-09-18T09:20:00'),
      ev('entreprise', 'end', 'Ferraillage prêt · visite demandée avant coulage', '2026-09-18T09:30:00'),
      ev('controleur', 'mission', 'Visite acceptée · créneau du mardi 22 septembre, 9 h – 11 h (heure du Maroc)', '2026-09-19T09:20:00'),
      ev('controleur', 'photo', '4 photos prises sur place, une par point clé', '2026-09-22T10:56:00'),
      ev('controleur', 'review', 'Avis signé : Validé (ferraillage)', '2026-09-22T11:06:00'),
      ev('entreprise', 'coulage', 'Coulage déclaré avec 2 photos et le bon de livraison du béton', '2026-09-23T16:10:00'),   // vague 24 (jury n° 9) : la règle des 2 photos, dès l'étape 1
      ev('client', 'decision', "« J'ai payé cette tranche » (hors TEEQA), justificatif photo joint", '2026-09-24T19:12:00'),
      ev('entreprise', 'receipt', "Paiement reçu indiqué par l'entreprise : tranche soldée", '2026-09-25T10:04:00'),
    ],
  });
  // Échanges d'exemple entre les trois rôles (11 nov.) : on voit qui parle à qui, comme dans une vraie conversation.
  const msg = (id, role, kind, text, at) => ({ id, role, kind, text, at: iso(at) });
  s1.messages = [
    msg('m-a1', 'client', 'question', "Bonsoir Rachid, les fondations avancent ? J'ai vu les photos du ferraillage.", '2026-09-18T18:05:00'),
    msg('m-a2', 'entreprise', 'reponse', "Bonsoir Karim. Oui, le ferraillage des semelles et longrines est prêt. On ne coule qu'après le passage du contrôleur.", '2026-09-18T18:20:00'),
    msg('m-a3', 'controleur', 'reponse', "Je suis sur place. Le ferraillage est conforme au plan, je signe l'avis : le coulage peut se faire.", '2026-09-22T10:50:00'),
    msg('m-a5', 'entreprise', 'reponse', 'Coulage terminé cet après-midi, photo jointe. On attaque les murs mardi 29.', '2026-09-23T16:15:00'),
    msg('m-a4', 'client', 'reponse', 'Merci à tous les deux. Je règle la tranche 1 demain soir.', '2026-09-23T19:40:00'),
  ];
  s2.messages = [
    msg('m-b1', 'client', 'question', "Les aciers des poteaux d'angle sont-ils tous en place ? Je ne les distingue pas bien sur la photo.", ago(3.5)),
    msg('m-b2', 'entreprise', 'reponse', "Oui, le ferraillage est prêt. On attend la visite avant de couler ; je vous envoie une photo de l'angle nord.", ago(3.3)),
    msg('m-b3', 'client', 'reponse', 'Parfait, merci.', ago(3.25)),
    // 19 nov. : le chef de chantier répond en vocal, en darija ; un ouvrier écrit en tarifit. Chacun lit dans sa langue.
    { ...msg('m-b4', 'entreprise', 'reponse', "Salam, l'angle chamali wajed. Ghadi nsiftlek tswira daba, w lbeton ghadi ykoun mn baad ma idouz lcontrôleur.", ago(3.2)), lang: 'dar', by: 'Saïd · chef de chantier', voice: { dur: 9, sample: true } },
    { ...msg('m-b5', 'entreprise', 'reponse', 'Ssima ur d-tewwid ca. Ad d-tas azekka.', ago(3.1)), lang: 'rif', by: 'Brahim · ouvrier' },
  ];
  const p4s = { id: 'ph-b0', by: 'entreprise', at: iso('2026-09-29T07:50:00'), sim: { step: 1, variant: 0 }, sync: 'synchronisee', version: 1, caption: 'Arases des fondations, départ des murs' };
  const p4 = { id: 'ph-b1', by: 'entreprise', at: iso(ago(4.2)), sim: { step: 1, variant: 1 }, sync: 'synchronisee', version: 1, caption: 'Vue d’ensemble des poteaux ferraillés' };
  const p5 = { id: 'ph-b2', by: 'entreprise', at: iso(ago(4.15)), sim: { step: 1, variant: 2 }, sync: 'synchronisee', version: 1, caption: 'Poteau d’angle nord, aciers' };
  const p6 = { id: 'ph-b3', by: 'entreprise', at: iso(ago(4.1)), sim: { step: 1, variant: 3 }, sync: 'synchronisee', version: 1, caption: 'Chaînage et attentes côté jardin' };
  Object.assign(s2, {
    status: 'fin_declaree', startedAt: iso('2026-09-29T08:00:00'), endDeclaredAt: iso(ago(4)),
    photos: [p4s, p4, p5, p6],
    // Mission proposée par TEEQA à l'agence de la zone : le contrôleur l'accepte avant de passer (délai de 24 h).
    mission: { status: 'proposee', at: ago(4), dueAt: plus(ago(4), DELAIS.mission), visitH: DELAIS.visite, tries: 1, by: 'teeqa' },
    history: [
      ev('entreprise', 'start', 'Début déclaré avec 1 photo', '2026-09-29T08:00:00'),
      ev('entreprise', 'photo', '3 photos de fin ajoutées : ferraillage des poteaux prêt', ago(4.1)),
      ev('entreprise', 'end', 'Ferraillage prêt · visite demandée avant coulage', ago(4)),
    ],
  });
  return {
    id: 'villa-demo', owner: SEED_OWNER, avenants: [], pieces, name: 'Villa Nador', city: 'Nador', region: 'Oriental', quartier: 'Quartier Al Matar', distanceKm: 12, horsZone: false,
    // Vague 7 : fiche de mission précise : adresse, repère, point GPS, personne sur place (appel relayé, numéro masqué).
    adresse: 'Lot 214, rue 12, Quartier Al Matar', repere: 'Portail vert, face à la mosquée du quartier', gps: { lat: 35.1594, lng: -2.9437 }, surPlace: { qui: 'Saïd, chef de chantier de Rachid BTP' },
    // Vague 8 : budget des travaux saisi par le client d'après le devis signé (montant de chaque tranche) ; hors TEEQA.
    budget: { source: 'Devis Rachid BTP n° 2026-118, signé le 18 août 2026', at: iso('2026-08-20T10:10:00'), tranches: Object.fromEntries(steps.map((x, i) => [x.id, [180000, 260000, 210000, 150000, 120000, 80000][i] || 0])), entrepriseAt: iso('2026-08-22T18:30:00') },   // vague 10 : montants confirmés par l'entreprise
    decennale: { police: 'DEC-2026-0418', assureur: 'Assurances Mutuelles du Bâtiment', jusqu: null, at: iso('2026-08-22T18:40:00') },   // vague 25 (faille : faillite) : attestation nominative déposée avant le début
    // Vague 10 : forfait TEEQA payé par le client après la convention acceptée des deux côtés.
    forfait: { paidAt: iso('2026-08-24T11:05:00'), moyen: 'carte' },
    // Vague 8 : l'équipe de l'entreprise dans le fil (chef de chantier) : elle écrit et envoie des photos, elle ne déclare pas les étapes.
    equipe: [{ id: 'eq-1', name: 'Saïd', role: 'Chef de chantier', contact: '+212 6 70 •• •• 18', lang: 'dar', at: iso('2026-08-23T09:00:00') }, { id: 'eq-2', name: 'Brahim', role: 'Ouvrier', contact: '+212 6 12 •• •• 07', lang: 'shi', at: iso('2026-08-23T09:05:00') }, { id: 'eq-3', name: 'Nadia', role: 'Comptable', contact: '+212 5 36 •• •• 90', lang: 'fr', at: iso('2026-08-23T09:10:00') }],
    // Vague 5 : date de fin prévue du chantier (convention), visible du client.
    finPrevue: iso('2027-06-30T18:00:00'),
    // Vague 3 : un proche en lecture seule (le père de Karim, sur place à Nador).
    proches: [{ id: 'pr-1', name: 'Mohamed', lien: 'Père du client', contact: '+212 6 61 •• •• 42', lang: 'rif', at: iso('2026-08-25T19:00:00'), role: 'lecture', droits: {} }],
    status: 'actif', createdAt: iso('2026-08-20T10:00:00'), closedAt: null, controls: TEMPLATE_STEPS.length, rating: null,
    invites: {
      entreprise: { status: 'acceptee', email: DEMO_PRO_EMAIL, proId: 'rachid', at: iso('2026-08-20T10:05:00'), acceptedAt: iso('2026-08-20T18:00:00') },
      // Vague 4 : TEEQA missionne l'agence APRÈS les deux acceptations de la convention (22 août, 9 h 15).
      controleur: { status: 'acceptee', by: 'teeqa', ...agence({ city: 'Nador' }), token: 'k7Q2-9dXe', at: iso('2026-08-22T11:00:00'), acceptedAt: iso('2026-08-22T16:40:00') },
    },
    // Convention avant travaux (M03) : lue et acceptée par le client et par l'entreprise avant le début du chantier.
    convention: { v: 1, client: iso('2026-08-21T18:40:00'), entreprise: iso('2026-08-22T09:15:00') },
    steps,
  };
}
// 20 nov. (réalisme) : un chantier d'exemple CLOS de bout en bout, à côté de Villa Nador : la villa de Souad, cliente qui vit
// à Bruxelles, construite à Berkane par Rachid BTP, contrôlée par l'agence Moulouya Contrôle (antenne de Berkane). 7 étapes
// closes, un avis signé par étape avec une photo du contrôleur par point clé, une réserve levée sur photo, la réception
// contresignée, les 7 tranches payées (« J'ai payé cette tranche », confirmées par l'entreprise), et l'avis de la cliente.
// Il n'appartient pas au client de la démo : celui-ci n'en lit que le rapport, publié avec l'accord de la cliente.
export const CLOS_ID = 'villa-orangers';
export const CLOS_STEPS = ['Terrassement et fondations', 'Gros œuvre : murs et poteaux', 'Dalle du 1er étage', 'Poteaux de l’étage et toiture-terrasse', 'Menuiseries et réseaux', 'Enduits et zellige', 'Finitions, contrôle avant réception'];
function seedOrangers() {
  const steps = CLOS_STEPS.map(makeStep), SIM = [0, 1, 2, 2, 3, 4, 5];
  // [début, fin déclarée, visite acceptée, créneau, avis signé, coulage (points d'arrêt), « J'ai payé », reçu confirmé]
  const D = [
    ['2025-10-20T08:00', '2025-11-12T09:30', '2025-11-12T14:10', '2025-11-14T09:00', '2025-11-14T10:55', '2025-11-15T16:10', '2025-11-19T20:05', '2025-11-20T09:40'],
    ['2025-11-24T08:00', '2025-12-17T09:00', '2025-12-17T15:00', '2025-12-19T09:00', '2025-12-19T10:40', '2025-12-20T15:30', '2025-12-24T19:00', '2025-12-26T10:00'],
    ['2026-01-05T08:00', '2026-01-28T09:00', '2026-01-28T14:00', '2026-01-30T09:00', '2026-01-30T10:45', '2026-01-31T16:00', '2026-02-04T20:00', '2026-02-05T10:00'],
    ['2026-02-23T08:00', '2026-03-18T09:00', '2026-03-18T15:00', '2026-03-20T14:00', '2026-03-20T15:20', '2026-03-21T16:00', '2026-03-25T19:30', '2026-03-26T09:30'],
    ['2026-04-13T08:00', '2026-05-27T09:00', '2026-05-27T14:00', '2026-05-29T09:00', '2026-05-29T10:50', null, '2026-06-02T19:00', '2026-06-03T10:15'],
    ['2026-06-08T08:00', '2026-07-22T09:00', '2026-07-22T14:00', '2026-07-24T09:00', '2026-07-24T10:40', null, '2026-08-03T19:00', '2026-08-04T09:20'],
    ['2026-08-10T08:00', '2026-09-16T09:00', '2026-09-16T14:00', '2026-09-18T09:00', '2026-09-18T10:30', null, '2026-09-23T19:00', '2026-09-24T09:45'],
  ];
  const MOTIFS = [
    "Fouilles, semelles et longrines conformes au plan du bureau d'études ; cales d'enrobage de 5 cm en place. Le coulage peut se faire.",
    'Poteaux et chaînages du rez-de-chaussée ferraillés selon le plan ; recouvrements mesurés avec les attentes des fondations. Le coulage peut se faire.',
    "Ferraillage de la dalle, chapeaux et réservations des réseaux conformes ; épaisseur de 16 cm mesurée au bord. Le coulage peut se faire.",
    "Poteaux de l'étage et dalle de la toiture-terrasse conformes au plan ; pente prévue vers les deux évacuations. Le coulage peut se faire.",
    "Menuiseries posées d'aplomb, réseaux passés dans les réservations, essai d'eau sans fuite et étanchéité de la terrasse essayée à l'eau.",
    "Enduits et zellige conformes, sauf les joints des angles du salon, ouverts sur 3 angles : à reprendre (finition, contrôle sur photo).",
    'Finitions terminées, équipements en service, menuiseries qui ferment sans forcer ; chantier propre, prêt pour la réception.',
  ];
  const ph = (id, by, at, i, v, caption) => ({ id, by, at: iso(at), sim: { step: SIM[i], variant: v }, sync: 'synchronisee', version: 1, caption });
  const H2 = (t, mn) => new Date(new Date(t).getTime() + mn * 60000).toISOString();
  steps.forEach((s, i) => {
    const [d0, d1, acc, slot, sig, coul, paid, recu] = D[i], labels = checkPoints(s), cle = labels.filter(estCle);
    const ko = i === 5 ? labels.indexOf('Joints et finitions des angles') : -1;
    const points = labels.map((label, k) => ({ label, state: k === ko ? 'ko' : 'ok' }));
    // Une photo du contrôleur par point clé (au moins une), et une par point à reprendre qui n'est pas un point clé (REGLES.photosAvis).
    const vus = [...(cle.length ? cle : [labels[0]]), ...(ko >= 0 && !estCle(labels[ko]) ? [labels[ko]] : [])];
    const ctl = vus.map((l, k) => ph(`ph-o${i}c${k}`, 'controleur', H2(sig, -40 + k * 5), i, k, `${estCle(l) ? 'Point clé' : ko >= 0 && l === labels[ko] ? 'Point à reprendre' : 'Vue d’ensemble'} : ${l}`));
    const ent = [ph(`ph-o${i}d`, 'entreprise', H2(d0, -5), i, 0, 'Photo de départ de l’étape'), ...[0, 1, 2].map(k => ph(`ph-o${i}f${k}`, 'entreprise', H2(d1, -20 + k * 5), i, k, ['Vue d’ensemble', 'Détail', 'Autre angle'][k]))];
    const hold = !!coul, cphs = hold ? [ph(`ph-o${i}k0`, 'entreprise', H2(coul, -6), i, 0, 'Coulage terminé · vue d’ensemble'), ph(`ph-o${i}k1`, 'entreprise', H2(coul, -4), i, 1, 'Coulage terminé · détail')] : [];
    const rv = { id: `rv-o${i}`, verdict: ko >= 0 ? 'retardee' : 'validee', motif: MOTIFS[i], pieces: ctl.map(x => x.id), points, recheck: ko >= 0 ? 'photo' : null, by: 'controleur', at: H2(sig, -1), signature: demoSig(), signedAt: iso(sig), slotAt: iso(slot),
      signataire: { otp: true, otpAt: iso(sig), carte: 'CP-ORI-0417-12', agence: 'Moulouya Contrôle' } };
    const corr = ko >= 0 ? [{ id: 'co-o5', version: 1, photoId: 'ph-o5r', note: 'Joints des trois angles refaits', at: iso('2026-07-28T11:00'), pending: false, verdict: 'ok', checkedAt: iso('2026-07-29T09:30'), levee: { at: iso('2026-07-29T09:30'), by: 'controleur', signature: demoSig(), version: 1, note: 'Joints refaits, angles nets' } }] : [];
    const cph = ko >= 0 ? [{ ...ph('ph-o5r', 'entreprise', '2026-07-28T10:55', i, 0, 'Correction : joints des angles refaits'), correction: true }] : [];
    const h = [ev('entreprise', 'start', 'Début déclaré avec 1 photo', d0), ev('entreprise', 'photo', '3 photos de fin ajoutées', H2(d1, -10)),
      ev('entreprise', 'end', hold ? 'Ferraillage prêt · visite demandée avant coulage' : 'Fin déclarée · visite demandée', d1),
      ev('controleur', 'mission', `Visite acceptée · créneau du ${new Date(slot).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${new Date(slot).getHours() < 12 ? '9 h – 11 h' : '14 h – 16 h'} (heure du Maroc)`, acc),
      ev('controleur', 'photo', `${ctl.length} photo${ctl.length > 1 ? 's' : ''} prise${ctl.length > 1 ? 's' : ''} sur place, une par point ${ko >= 0 ? 'clé et une par point à reprendre' : 'clé'}`, H2(sig, -20)),
      ev('controleur', 'review', `Avis signé : ${ko >= 0 ? 'Réserves (finition, contrôle sur photo)' : 'Validé'}${hold ? ' (ferraillage)' : ''}`, sig)];
    if (hold) h.push(ev('entreprise', 'coulage', 'Coulage déclaré avec 2 photos et le bon de livraison du béton', coul));
    if (ko >= 0) h.push(ev('entreprise', 'correction', 'Photo de correction v1 envoyée', '2026-07-28T11:00'), ev('controleur', 'levee', 'Levée des réserves signée : correction v1 contrôlée sur photo, conforme', '2026-07-29T09:30'));
    h.push(ev('client', 'decision', "« J'ai payé cette tranche » (hors TEEQA), justificatif photo joint", paid), ev('entreprise', 'receipt', "Paiement reçu indiqué par l'entreprise : tranche soldée", recu));
    Object.assign(s, { status: ko >= 0 ? 'corrigee' : 'validee', startedAt: iso(d0), endDeclaredAt: iso(d1), photos: [...ent, ...ctl, ...cph, ...cphs], reviews: [rv], corrections: corr, history: h,
      mission: { status: 'faite', at: iso(d1), acceptedAt: iso(acc), dueAt: plus(iso(acc), DELAIS.visite), slot: { h: new Date(slot).getHours() < 12 ? 'matin' : 'apres-midi', at: iso(slot) }, doneAt: iso(sig), by: 'teeqa', tries: 1 },
      ...(hold ? { coulage: { at: iso(coul), photoId: cphs[0].id, photoIds: cphs.map(x => x.id) } } : {}),
      decision: { status: 'indique', at: iso(paid), proof: 'photo', proofAt: iso(paid), moyen: 'virement', ref: `VIR ${String(i + 1).padStart(2, '0')}-${new Date(paid).getFullYear()}-BXL`, dh: [170000, 230000, 190000, 210000, 140000, 120000, 90000][i], receivedAt: iso(recu) } });
  });
  const msg = (id, role, text, at) => ({ id, role, kind: 'reponse', text, at: iso(at) });
  steps[0].messages = [msg('m-o1', 'client', 'Bonjour Rachid, je ne pourrai pas descendre avant l’été : je suivrai tout ici.', '2025-10-20T19:10'), msg('m-o2', 'entreprise', 'Bonjour Madame. Pas de souci, vous aurez les photos à chaque étape. Le béton attendra toujours le contrôleur.', '2025-10-20T20:05')];
  steps[5].messages = [msg('m-o3', 'client', 'Merci au contrôleur pour la photo des angles. Rachid, vous pouvez les reprendre avant mon arrivée le 8 août ?', '2026-07-24T19:30'), msg('m-o4', 'entreprise', 'Oui, les joints des trois angles seront refaits mardi, photo jointe.', '2026-07-24T20:10')];
  steps[6].messages = [msg('m-o5', 'client', 'Je serai sur place samedi 26 pour la réception, avec mon frère.', '2026-09-18T18:00')];
  const closedAt = iso('2026-09-26T11:00');
  return {
    id: CLOS_ID, owner: 'souad', client: { name: 'Souad', where: 'à distance · Bruxelles' }, avenants: [], name: 'Villa Les Orangers', city: 'Berkane', region: 'Oriental', quartier: 'Hay Al Massira', distanceKm: 4, horsZone: false,
    adresse: 'Lot 57, Hay Al Massira', repere: 'Derrière la coopérative agricole', gps: { lat: 34.9218, lng: -2.3197 }, surPlace: { qui: 'Saïd, chef de chantier de Rachid BTP' },
    pieces: [
      { id: 'pc-o-devis', kind: 'devis', title: 'Devis Rachid BTP n° 2025-074', by: 'entreprise', at: iso('2025-10-03T17:00'), note: 'Signé le 3 octobre 2025 · montant de chaque tranche' },
      { id: 'pc-o-plans', title: "Plans d'exécution · architecte", by: 'client', at: iso('2025-10-06T10:00'), note: 'Villa R+1 · indice C' },
      { id: 'pc-o-bet', title: "Note de calcul et plans de ferraillage · bureau d'études", by: 'client', at: iso('2025-10-06T10:02'), note: 'Fondations, poteaux, deux dalles' },
      { id: 'pc-o-reseaux', title: 'Plan des réseaux (électricité, plomberie)', by: 'client', at: iso('2025-10-06T10:04'), note: 'Plan avant travaux', version: 1 },
      { id: 'pc-o-decennale', kind: 'decennale', title: 'Attestation décennale nominative · police DEC-2025-7731', by: 'entreprise', at: iso('2025-10-08T16:20'), note: 'Assurances Atlas Construction · chantier Villa Les Orangers, Berkane · valable 10 ans après la réception' },   // vague 26 (scènes 14, jury n° 19)
    ],
    decennale: { police: 'DEC-2025-7731', assureur: 'Assurances Atlas Construction', contact: '+212 5 36 68 •• 40 (service sinistres, Oujda)', jusqu: iso('2036-09-26T11:00'), at: iso('2025-10-08T16:20') },
    budget: { source: 'Devis Rachid BTP n° 2025-074, signé le 3 octobre 2025', at: iso('2025-10-06T10:20'), tranches: Object.fromEntries(steps.map((x, i) => [x.id, [170000, 230000, 190000, 210000, 140000, 120000, 90000][i]])), entrepriseAt: iso('2025-10-07T18:30') },
    forfait: { paidAt: iso('2025-10-10T11:00'), moyen: 'carte' },
    equipe: [{ id: 'eq-o1', name: 'Saïd', role: 'Chef de chantier', contact: '+212 6 70 •• •• 18', lang: 'dar', at: iso('2025-10-07T18:40') }],
    finPrevue: iso('2026-10-31T18:00:00'), proches: [], status: 'clos', createdAt: iso('2025-10-06T10:00'), closedAt, controls: steps.length,
    rating: { comment: 'Chantier tenu dans les temps, à un mois près sur la fin prévue.' },
    reception: { provisoireAt: closedAt, reserves: '', signature: demoSig(), entrepriseAt: iso('2026-09-28T09:30'), definitiveAt: null, parfaitJusqu: iso('2027-09-26T11:00'), decennaleJusqu: iso('2036-09-26T11:00') },
    // La cliente a accepté que son rapport soit publié, sans son nom de famille ni son adresse (PILOTE, « Ce qui sera publié »).
    publie: { at: iso('2026-09-30T20:10'), accord: 'Souad, cliente' },
    invites: {
      entreprise: { status: 'acceptee', email: DEMO_PRO_EMAIL, proId: 'rachid', at: iso('2025-10-06T10:05'), acceptedAt: iso('2025-10-07T18:00') },
      controleur: { status: 'expiree', by: 'teeqa', ...agence({ city: 'Berkane' }), token: 'b3R8-2mQa', at: iso('2025-10-09T11:00'), acceptedAt: iso('2025-10-09T16:00'), expiredAt: closedAt },
    },
    convention: { v: 1, client: iso('2025-10-08T19:30'), entreprise: iso('2025-10-09T09:10') },
    steps,
  };
}
// L'avis de la cliente sur son chantier, écrit dans l'appli après la clôture, et la réponse de l'entreprise.
function seedAvis() {
  return [{ id: 'av-orangers', pid: CLOS_ID, pro: 'rachid', author: 'Souad', city: 'Berkane', project: 'Villa Les Orangers', steps: CLOS_STEPS.length, visits: CLOS_STEPS.length,
    text: "J'ai suivi toute la construction depuis Bruxelles, sans descendre avant l'été. Les photos de chaque étape et les avis du contrôleur m'ont permis de payer chaque tranche sans hésiter. Un bémol : les joints du zellige ont dû être repris ; c'était écrit, corrigé et contrôlé en cinq jours.",
    recommend: true, at: iso('2026-09-30T20:15'), reply: { text: "Merci Madame. La garantie d'un an court jusqu'en septembre 2027 : écrivez-nous dans l'appli au moindre souci.", at: iso('2026-10-01T09:05') } }];
}
function ev(role, type, text, at) { return { id: uid('ev'), role, type, text, at: iso(at) }; }
function demoSig() {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([20 + t * 220, 70 - Math.sin(t * 9) * 18 * (1 - t * .4) + t * 10]); }
  return [pts, [[150, 40], [170, 95]]];
}

function seedNotifications() {
  return [
    { id: 'n1', at: iso(ago(4)), roles: ['client', 'controleur'], text: 'Rachid indique que le ferraillage de « Gros œuvre : murs et poteaux » est prêt. TEEQA a demandé une visite avant coulage.', route: '#/c/villa-demo/step/s2', read: {} },
    { id: 'n2', at: iso('2026-09-22T11:06:00'), roles: ['client', 'entreprise'], text: 'Le contrôleur a signé un avis Validé pour « Terrassement et fondations ».', route: '#/c/villa-demo/step/s1', read: { client: true, entreprise: true } },
  ];
}

export function freshState({ empty = false } = {}) {
  return {
    v: 10, role: 'client', session: { splashSeen: false, onboarded: false, loggedIn: false },
    projects: empty ? [] : [seedProject(), seedOrangers()], notifications: empty ? [] : seedNotifications(), avis: empty ? [] : seedAvis(),   // 20 nov. : chantier clos d'exemple et l'avis de sa cliente
    uploads: [], outbox: [], net: { offline: false, failNext: false }, prefs: { reduceMotion: false, sound: true, ville: 'Lyon', villePays: 'FR' },
    drafts: {}, lastRoute: null, reports: [],
  };
}

export function load() {
  try { const raw = STOCK && STOCK.getItem(KEY); state = raw ? JSON.parse(raw) : freshState(); if (state.v !== 10) state = freshState(); }   // 20 nov. : v10 (chantier clos d'exemple, séquestre) ; vague 18 : v9 (photos par point clé, plan des réseaux d’exemple) ; vague 7 : v7 (agences avec carte, fiche de mission précise) ; vague 5 : v6 (réseau d'agences, fin prévue, statuts du point d'arrêt)
  catch { state = freshState(); }
  state.session.splashSeen = false;   // le lancement se joue à chaque ouverture de l'appli, comme une vraie appli
  // Page d'essai (essai.html, 12 nov.) : l'adresse « ?direct » ouvre l'écran demandé sans rejouer le lancement.
  try { if (/[?&]direct\b/.test(location.search)) state.session.splashSeen = true; } catch { /* hors navigateur */ }
  if (SALLE) salleCharger();
  if (ORAL) oralCharger();
  // Vague 3 : un état gardé d'avant garde « Bureau de contrôle agréé » sans nom ; on lui donne l'agence nommée.
  for (const p of state.projects || []) { const c = p.invites && p.invites.controleur; if (c && (/^Bureau de contrôle agréé/.test(c.agence || '') || /31 déc/.test(c.assurance || ''))) Object.assign(c, agence(p)); }
  applyAccount(); appliquerSequestre(state);
  return state;
}
export function save() { try { STOCK.setItem(KEY, JSON.stringify(state)); } catch { /* quota démo */ } }
export function get() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function commit(mut, { silent = false } = {}) {
  const avant = SALLE || ORAL ? signature() : null;
  applyAccount();   // 20 nov. : les gestes signent avec les noms du compte, jamais ceux du chantier affiché juste avant
  mut(state); appliquerSequestre(state); save();
  if (SALLE && signature() !== avant) sallePousser(mut);
  if (ORAL && signature() !== avant) oralPousser();
  if (!silent) listeners.forEach(f => f());
}

// ---------- Salle de démo : partage en direct ----------
const PARTAGE = ['projects', 'notifications', 'reports', 'avis', 'noms'];
const MOI = 'tel-' + Math.random().toString(36).slice(2, 9);
let salleBaseUrl = null;
// Adresse que les autres téléphones peuvent ouvrir (l'adresse Internet de la salle si elle existe) : sert au QR du contrôleur.
export const salleBase = () => salleBaseUrl || location.origin;
let salleV = 0, salleEnvoi = false, salleAttente = [], salleDistant = null, salleEtat = 'connexion';
const salleEcoutes = new Set();
export const salleInfo = () => ({ on: SALLE, etat: salleEtat, v: salleV });
export function onSalle(fn) { salleEcoutes.add(fn); return () => salleEcoutes.delete(fn); }
const salleSignaler = (e) => { if (e) salleEtat = e; salleEcoutes.forEach(f => { try { f(salleEtat); } catch { /* écran */ } }); };
function partage() { const o = {}; for (const k of PARTAGE) o[k] = state[k]; return o; }
function signature() { return JSON.stringify(partage()); }
// Les noms choisis à la création des comptes (client, entreprise) sont communs : chaque téléphone affiche les bons noms.
function nomsCommuns() { const a = state.account; state.noms = { ...(state.noms || {}) }; if (a && a.role && a.name) state.noms[a.role] = a.name; }
function salleAppliquer(doc, v) {
  const mes = new Set((state.notifications || []).map(n => n.id));
  for (const k of PARTAGE) if (k in doc) state[k] = doc[k];
  if (!state.projects) state.projects = []; if (!state.notifications) state.notifications = []; if (!state.reports) state.reports = [];
  salleV = v; applyAccount(); save();
  const nouvelles = state.notifications.filter(n => !mes.has(n.id) && n.roles.includes(state.role));
  salleRedessiner(nouvelles);
}
// Ne jamais casser un geste en cours chez celui qui reçoit : saisie, feuille ouverte, signature, appareil photo.
let salleRetard = 0, salleNotifs = [];
function occupe() {
  const ae = document.activeElement, app = document.getElementById('app');
  return !!((ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) || document.querySelector('.sheet-wrap:not(.closing), .sig-full') || (app && app.querySelector('video')));
}
function salleRedessiner(nouvelles = []) {
  salleNotifs.push(...nouvelles); clearTimeout(salleRetard);
  if (occupe()) { salleRetard = setTimeout(() => salleRedessiner(), 600); return; }
  const n = salleNotifs.splice(0); listeners.forEach(f => f());
  if (n.length) window.dispatchEvent(new CustomEvent('teeqa-salle-notif', { detail: n }));
}
function salleCharger() {
  try {
    const x = new XMLHttpRequest(); x.open('GET', '/salle/etat', false); x.send();
    const r = JSON.parse(x.responseText);
    const role = new URLSearchParams(location.search).get('role');
    if (role && ROLES[role] && state.salleRole !== role) { state.role = role; state.salleRole = role;
      // Le contrôleur n'a pas de compte : il entre par le lien temporaire, directement.
      if (role === 'controleur') Object.assign(state.session, { onboarded: true, loggedIn: true }); }
    if (/^#\/(invite|c)\//.test(location.hash)) state.lastRoute = location.hash;
    if (r.doc) { for (const k of PARTAGE) if (k in r.doc) state[k] = r.doc[k]; salleV = r.v; }
    else { const f = freshState(); state.projects = f.projects; state.notifications = f.notifications; state.reports = []; salleV = r.v; sallePousser(() => {}, true); }
    nomsCommuns(); save(); salleSignaler('ok');
    try { const a = new XMLHttpRequest(); a.open('GET', '/salle/adresse', false); a.send(); const j = JSON.parse(a.responseText); if (j.publique) salleBaseUrl = j.publique; } catch { /* adresse locale */ }
  } catch { salleSignaler('hors'); }
  salleFlux();
}
function salleFlux() {
  // Deux chemins : le flux en direct (immédiat, sur le Wi-Fi local) et une vérification légère toutes les secondes, qui
  // marche partout (les adresses Internet gratuites de Cloudflare ne transmettent pas le flux). Le premier arrivé gagne.
  let es = null, rate = 0;
  const recevoir = (doc, v, from) => {
    if (!doc || v <= salleV) return;
    if (from === MOI) { salleV = Math.max(salleV, v); return; }
    if (salleEnvoi || salleAttente.length) { if (!salleDistant || v > salleDistant.v) salleDistant = { doc, v }; return; }   // mon geste part : le serveur me renverra la bonne version
    salleAppliquer(doc, v);
  };
  // Flux en direct seulement sur le réseau local : à travers l'adresse Internet, il ne passe pas et ferait des erreurs.
  const local = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1)/.test(location.hostname);
  if (local) try { es = new EventSource('/salle/flux'); es.onmessage = (e) => { try { const m = JSON.parse(e.data); recevoir(m.doc, m.v, m.from); } catch { /* illisible */ } }; } catch { /* pas de flux */ }
  let enCours = false;
  const verifier = async () => {
    if (enCours || document.hidden) return; enCours = true;
    try {
      const r = await fetch('/salle/version', { cache: 'no-store' }).then(x => x.json()); rate = 0;
      if (salleEtat !== 'ok') salleSignaler('ok');
      if (r.v > salleV && !salleEnvoi && !salleAttente.length) { const d = await fetch('/salle/etat', { cache: 'no-store' }).then(x => x.json()); recevoir(d.doc, d.v, null); }
    } catch { if (++rate >= 2) salleSignaler('hors'); }
    enCours = false;
  };
  setInterval(verifier, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) verifier(); });
  window.addEventListener('online', verifier);
}
function sallePousser(mut, force = false) { salleAttente.push({ mut, force }); if (!salleEnvoi) salleEnvoyer(); }
async function salleEnvoyer() {
  const lot = salleAttente.splice(0); if (!lot.length) return;
  salleEnvoi = true; nomsCommuns();
  try {
    const r = await fetch('/salle/etat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base: salleV, doc: partage(), from: MOI, force: lot.some(l => l.force) }) });
    const d = r.ok || r.status === 409 ? await r.json() : null;
    if (r.status === 409 || (d && d.conflit)) {
      // Quelqu'un d'autre a agi juste avant : on prend sa version et on rejoue nos gestes dessus, puis on renvoie.
      for (const k of PARTAGE) if (d.doc && k in d.doc) state[k] = d.doc[k]; salleV = d.v;
      lot.forEach(l => { try { l.mut(state); } catch { /* geste devenu impossible */ } }); applyAccount(); save();
      salleAttente.unshift(...lot.map(l => ({ ...l, force: false }))); salleRedessiner();
    } else if (r.ok) { salleV = d.v; salleSignaler('ok'); }
    else throw new Error(r.status);
  } catch { salleAttente.unshift(...lot); salleSignaler('hors'); await new Promise(z => setTimeout(z, 1500)); }
  salleEnvoi = false;
  if (salleAttente.length) return salleEnvoyer();
  if (salleDistant && salleDistant.v > salleV) { const m = salleDistant; salleDistant = null; salleAppliquer(m.doc, m.v); } else salleDistant = null;
}
// Soutenance (demo-oral.html) : même partage que la salle, mais par le stockage commun des trois téléphones de la page.
const ORAL_KEY = 'teeqa-oral-chantier';
const oralLire = () => { try { return JSON.parse(localStorage.getItem(ORAL_KEY) || 'null'); } catch { return null; } };
function oralPousser() { const r = oralLire(); salleV = Math.max(salleV, (r && r.v) || 0) + 1;
  try { localStorage.setItem(ORAL_KEY, JSON.stringify({ v: salleV, doc: partage() })); } catch { /* stockage plein */ } }
function oralCharger() {
  if (ROLES[ORAL_ROLE]) state.role = ORAL_ROLE;
  // 27 nov. (Nabih) : avec « &inscription », le client n'a pas encore de compte : il découvre l'appli (accueil, présentation)
  // et crée son compte devant le jury. Tant qu'aucun compte n'est enregistré, il repart de l'accueil.
  if (ORAL_INSCRIPTION && !state.account) { Object.assign(state.session, { splashSeen: true, onboarded: false, loggedIn: false }); state.prefs = { ...state.prefs, voixDemandee: true }; }
  else Object.assign(state.session, { splashSeen: true, onboarded: true, loggedIn: true });
  const r = oralLire();
  if (r && r.doc) { for (const k of PARTAGE) if (k in r.doc) state[k] = r.doc[k]; salleV = r.v || 0; } else oralPousser();
  save();
  addEventListener('storage', (e) => { if (e.key !== ORAL_KEY || !e.newValue) return;
    try { const m = JSON.parse(e.newValue); if (m && m.doc && m.v > salleV) salleAppliquer(m.doc, m.v); } catch { /* illisible */ } });
}
// Recommencer la démo pour toute la salle (bouton de la page salle.html ou du profil).
export async function salleRecommencer({ empty = false } = {}) {
  const f = freshState({ empty }); for (const k of PARTAGE) state[k] = f[k] || (k === 'noms' ? {} : []);
  state.noms = {}; save(); sallePousser(() => {}, true); listeners.forEach(fn => fn());
}
// Compte créé par le parcours « Créer mon compte » (11 nov.) : le nom saisi remplace le nom d'exemple du rôle choisi.
const ROLE_NAMES = { client: [ROLES.client.name, ROLES.client.where], entreprise: [ROLES.entreprise.name, ROLES.entreprise.where] };
export function applyAccount() { for (const k in ROLE_NAMES) [ROLES[k].name, ROLES[k].where] = ROLE_NAMES[k]; if (SALLE && state && state.noms) for (const k in ROLE_NAMES) if (state.noms[k]) { ROLES[k].name = state.noms[k]; ROLES[k].where = k === 'client' ? 'compte client' : 'compte entreprise'; } const a = state && state.account; if (a && ROLE_NAMES[a.role] && a.name) { ROLES[a.role].name = a.name; ROLES[a.role].where = a.role === 'client' ? 'votre compte' : 'votre compte entreprise'; } }
// 20 nov. : le nom du client suit le chantier affiché (le chantier clos d'exemple est celui de Souad, pas du client de la démo).
export function vueChantier(path = '') { applyAccount(); const m = /^\/c\/([^/]+)/.exec(path), p = m && state && state.projects.find(x => x.id === m[1]); if (p && p.client) { ROLES.client.name = p.client.name; ROLES.client.where = p.client.where; } }
export function reset(opts) { if (SALLE) { const keep = { ...state.session }; state.session = { ...keep, loggedIn: true }; save(); listeners.forEach(f => f()); return; } const keep = { ...state.session }, role = state.role, account = state.account; state = freshState(opts); state.role = role; if (account && opts && opts.empty) state.account = account; applyAccount(); state.session = { ...keep, loggedIn: true }; save(); listeners.forEach(f => f()); }

// ---------- Vague 3 : créneaux, empreinte, actions qui vous attendent ----------
// Trois créneaux proposés au contrôleur, avant la date limite de passage : { day: 1|2, h: 'matin'|'apres-midi' }.
const SLOT_H = { matin: '9 h – 11 h', 'apres-midi': '14 h – 16 h' };
// Vague 8 : jamais un dimanche (le jour est décalé au lundi).
export const slotOptions = (m) => { const base = new Date(m.acceptedAt || m.at || nowMs()); const days = []; for (let k = 1; days.length < 2; k++) { const d = new Date(base); d.setDate(d.getDate() + k); if (d.getDay() !== 0) days.push(k); }
  return [{ day: days[0], h: 'matin' }, { day: days[0], h: 'apres-midi' }, { day: days[1], h: 'matin' }].map(o => ({ ...o, at: (() => { const d = new Date(base); d.setDate(d.getDate() + o.day); d.setHours(o.h === 'matin' ? 9 : 14, 0, 0, 0); return d.toISOString(); })() }))
    .filter((o, k) => k === 0 || !m.dueAt || new Date(o.at).getTime() <= new Date(visitBy(m)).getTime()); };   // vague 9 : jamais un créneau après l'échéance de passage
export const slotLabel = (sl, L = 'fr') => { if (!sl) return ''; const d = new Date(sl.at); if (L === 'ar') return `يوم ${d.toLocaleDateString('ar-MA-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' })}، ${sl.h === 'libre' ? `${d.getHours()}:00` : sl.h === 'matin' ? '9 – 11 صباحا' : '14 – 16 بعد الزوال'}`; return `le ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${sl.h === 'libre' ? `à ${d.getHours()} h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}, proposé par le contrôleur` : SLOT_H[sl.h] || ''} (heure du Maroc)`; };
// Vague 15 : le contrôleur peut proposer un autre moment que les trois plages, toujours avant l'échéance de passage (jamais un dimanche).
export const slotLibres = (m) => { const base = new Date(m.acceptedAt || m.at || nowMs()), lim = m.dueAt ? new Date(visitBy(m)).getTime() : Infinity, out = [];
  for (let k = 0; k <= 4; k++) for (const h of [8, 11, 16, 17]) { const d = new Date(base); d.setDate(d.getDate() + k); d.setHours(h, 0, 0, 0); if (d.getDay() !== 0 && d.getTime() > base.getTime() + 2 * H && d.getTime() <= lim) out.push({ day: k, h: 'libre', at: d.toISOString() }); }
  return out.slice(0, 8); };
// Vague 10 : le même créneau dans le fuseau du client à l'étranger (réglable dans Profil).
export const slotTz = (sl, tz = fuseau()) => { if (!sl || !tz || tz === 'Africa/Casablanca') return ''; const dd = decalage(sl.at, tz), h0 = sl.h === 'matin' ? 9 : 14, f = (h) => `${((h % 24) + 24) % 24} h`; return `Heure ${paysDe(tz)} : ${dd ? `${f(h0 + dd)} – ${f(h0 + 2 + dd)}` : 'la même'}`; };
// Empreinte courte d'un document (avis, rapport) : elle change dès qu'une ligne change. Ce n'est pas une certification.
// Vague 5 : empreinte plus longue (32 signes, quatre calculs mêlés) : deux documents différents ne la partagent pas.
export function empreinte(obj) { const t = typeof obj === 'string' ? obj : JSON.stringify(obj); let h1 = 0x811c9dc5, h2 = 0x01000193, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ (c + i), 2246822519) >>> 0; h3 = Math.imul(h3 ^ (c * 31 + i), 3266489917) >>> 0; h4 = Math.imul((h4 ^ c) + (h1 >>> 7), 668265263) >>> 0; }
  return [h1, h2, h3, h4].map(h => h.toString(16).toUpperCase().padStart(8, '0')).join('').replace(/(.{4})(?=.)/g, '$1-'); }
// Ce que ce rôle doit faire, chantier par chantier (badge de l'onglet Chantiers). Rien d'autre n'est compté.
export function waitingActions(role) {
  let n = 0;
  for (const p of state.projects) {
    if (role === 'entreprise' && invitationsFor('entreprise').includes(p)) { n++; continue; }
    if (!forMe(p, role) || p.status === 'clos') continue;
    if (can(role, p, null, 'acceptConvention') && !(role === 'entreprise' && access(p, 'entreprise') !== 'ok')) n++;
    for (const s of p.steps) {
      if (role === 'client' && (can(role, p, s, 'decide') || can(role, p, s, 'ack'))) n++;
      if (role === 'entreprise' && (can(role, p, s, 'correction') || can(role, p, s, 'coulage') || can(role, p, s, 'confirmPayment') || can(role, p, s, 'declareEnd') || (s.status === 'a_venir' && conventionOk(p) && can(role, p, s, 'photoDeclare')))) n++;
      if (role === 'controleur' && (can(role, p, s, 'acceptMission') || can(role, p, s, 'review') || can(role, p, s, 'verifyCorrection'))) n++;
    }
  }
  return n;
}

// ---------- Sélecteurs ----------
export const project = (id) => state.projects.find(p => p.id === id);
export const step = (p, sid) => p && p.steps.find(s => s.id === sid);
export const stepIndex = (p, s) => p.steps.indexOf(s);
// Vague 5 : une étape à point d'arrêt n'est close qu'une fois le coulage déclaré (compteurs, accueil, chemin, rapport).
// p peut arriver sous forme de numéro (`.filter(doneLike)` passe l'index) : on retrouve alors le chantier de l'étape.
export const doneLike = (s, p) => { p = p && p.steps ? p : projOf(s); return (s.status === 'validee' || s.status === 'corrigee' || s.status === 'vue') && !coulageDue(p, s); };
// Validation récente (moins de 2 min) : le nœud se tamponne une fois, c'est le seul moment de réussite.
// Célébration en attente (12 nov.) : une étape validée par un avis que ce rôle n'a pas encore fêté. Les avis du chantier d'exemple
// (sans champ feteVue) ne comptent pas. On la joue à l'ouverture du chantier ou de l'étape, une seule fois par rôle.
export function pendingFete(p, role) {
  if (!p || !['client', 'entreprise'].includes(role)) return null;
  return p.steps.find((s) => { const rv = s.reviews && s.reviews[s.reviews.length - 1]; return s.status === 'validee' && rv && rv.verdict === 'validee' && rv.feteVue && !rv.feteVue[role]; }) || null;
}
export function freshValid(s) {
  const rv = s.reviews && s.reviews[s.reviews.length - 1];
  return s.status === 'validee' && rv && rv.verdict === 'validee' && nowMs() - new Date(rv.at).getTime() < 120000;
}

// ---------- M12 : coffre des documents d'un chantier ----------
// Tout ce que le chantier a produit, rangé par étape : devis, convention, photos, corrections, avis signés, rapport.
// Chaque pièce porte son auteur (un rôle), sa date et sa version. Rien n'est retiré à la révocation d'un lien ni à la
// clôture : les pièces du contrôleur restent, c'est son accès qui prend fin. `sid` nul = pièce du chantier entier.
export function documents(p) {
  const out = [];
  if (p.prep && p.prep.quote) out.push({ id: 'devis', kind: 'devis', group: 'doc', title: p.prep.quote.name || 'Devis', by: 'client', at: p.prep.quote.at || p.createdAt, version: 1, sid: null, note: 'Joint par le client à la création' });
  if (p.convention) out.push({ id: 'convention', kind: 'convention', group: 'doc', title: 'Convention avant travaux', by: null, at: p.convention.entreprise && p.convention.client ? (p.convention.client > p.convention.entreprise ? p.convention.client : p.convention.entreprise) : p.createdAt, version: p.convention.v || 1, sid: null,
    note: conventionOk(p) ? "Acceptée par le client et l'entreprise" : 'En attente d\'acceptation', go: `#/c/${p.id}/convention` });
  for (const x of p.pieces || []) out.push({ id: x.id, kind: x.kind === 'plan' || x.kind === 'pdf' ? x.kind : 'devis', group: 'doc', title: x.title, by: x.by, at: x.at, version: x.version || 1, sid: null, note: [x.note || '', x.remplaceAt ? 'Version remplacée par une plus récente, gardée au dossier' : ''].filter(Boolean).join(' · ') });   // vague 4 : plans et note du bureau d'études ; vague 10 : versions
  p.steps.forEach((s, i) => {
    for (const ph of s.photos) out.push({ id: ph.id, kind: ph.correction ? 'correction' : 'photo', group: 'photo', title: ph.correction ? (s.corrections.some(c => c.photoId === ph.id && c.visite) ? 'Photo de la correction, pour information (contrôle sur place)' : 'Photo de correction') : ph.by === 'controleur' ? 'Photo prise sur place' : 'Photo de déclaration', by: ph.by, at: ph.at, recu: ph.sentAt || (ph.sync === 'synchronisee' ? ph.at : null), version: ph.version || 1, sid: s.id, i,
      note: ph.sync === 'synchronisee' ? (ph.caption || '') : ph.sync === 'echec' ? 'Envoi échoué : pas encore conservée' : 'En attente d\'envoi : pas encore conservée', kept: ph.sync === 'synchronisee', go: `#/c/${p.id}/step/${s.id}` });
    s.reviews.forEach((v, n) => out.push({ id: v.id, kind: 'avis', group: 'avis', title: `Avis ${avisLabel(v.verdict)}`, by: 'controleur', at: v.signedAt || v.at, recu: v.recuAt || v.sentAt || v.signedAt || v.at, version: n + 1, sid: s.id, i, note: n < s.reviews.length - 1 ? (s.reviews[n + 1].contreVisite ? `Complété par la contre-visite du ${new Date(s.reviews[n + 1].signedAt || s.reviews[n + 1].at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} (points revus seulement ; les autres restent ceux-ci)` : 'Suivi d’un avis plus récent ; les deux restent au dossier') : 'Signé sur place',   /* vague 18 (jury, n° 11) */ go: `#/c/${p.id}/step/${s.id}` }));
    s.corrections.filter(c => c.levee).forEach(c => out.push({ id: 'lv-' + s.id + '-' + c.version, kind: 'levee', group: 'avis', title: 'Levée des réserves', by: 'controleur', at: c.levee.at, version: 1, sid: s.id, i, note: `Signée par le contrôleur · correction v${c.version} contrôlée sur photo`, go: `#/c/${p.id}/step/${s.id}` }));
  });
  // Vague 17 (jury, n° 9) : le reçu du forfait payé est une pièce du dossier (client seulement : c'est lui qui paie TEEQA).
  if (p.forfait && p.forfait.paidAt) out.push({ id: 'recu-forfait', kind: 'recu', group: 'doc', seul: 'client', title: 'Reçu du forfait TEEQA', by: null, at: p.forfait.paidAt, version: 1, sid: null, note: `${dh(p.forfait.dh || forfaitDh(p.steps.filter(isControlled).length))} payés à TEEQA SARL (${p.forfait.moyen === 'sepa' ? 'virement bancaire' : p.forfait.moyen === 'agence' ? 'en agence' : 'carte bancaire'}) · services de TEEQA seulement, jamais le prix des travaux` });
  out.push({ id: 'rapport', kind: 'rapport', group: 'doc', title: archive(p) ? 'Rapport du chantier, archivé' : enGarantie(p) ? 'Rapport du chantier, en garantie' : 'Rapport du chantier', by: null, at: p.closedAt || now(), version: 1, sid: null, note: p.status === 'clos' ? 'Archivé à la clôture' : 'Provisoire : se met à jour jusqu\'à la clôture', go: `#/c/${p.id}/report` });
  return out;
}
// Qui peut ouvrir le coffre : le client toujours ; l'entreprise et le contrôleur tant que leur accès est actif ;
// après la clôture, le client et l'entreprise gardent la lecture, le lien du contrôleur a expiré.
// Vague 4 : après la réception, le contrôleur garde l'accès en lecture à ses avis (archive) ; il n'agit plus.
export const canSeeDocuments = (p, role) => role === 'client' || access(p, role) === 'ok' || (role === 'controleur' && p.status === 'clos' && access(p, role) === 'expiree');

// Vague 7 : l'avancement distingue les étapes vérifiées sur place (avis du contrôleur) des étapes seulement déclarées et consultées.
export function progress(p) { const ds = p.steps.filter(doneLike), d = ds.length, v = ds.filter(s => isControlled(s) && s.status !== 'vue').length; return { done: d, total: p.steps.length, pct: Math.round((d / p.steps.length) * 100), verified: v, declared: d - v }; }
export function currentStep(p) { return p.steps.find(s => !doneLike(s) && s.status !== 'verrouillee') || p.steps.find(s => !doneLike(s)) || p.steps[p.steps.length - 1]; }
export const latestReview = (s) => s.reviews[s.reviews.length - 1] || null;
export const photo = (s, id) => s.photos.find(ph => ph.id === id);
// Vague 20 (doigt : Omar) : le point rouge d'Activité ne compte que ce que l'onglet montre (chantiers de la personne, invitations).
export function unread(role) { const inv = new Set(invitationsFor(role).map(p => p.id));
  return state.notifications.filter(n => { if (!n.roles.includes(role) || n.read[role]) return false; const m = /^#\/(?:c|invite)\/([^/]+)/.exec(n.route || ''); if (!m) return true; const p = project(m[1]); return !p || forMe(p, role) || inv.has(m[1]); }).length; }
export function access(p, role) {
  if (role === 'client') return 'ok';
  const inv = p.invites[role];
  if (!inv) return 'none';
  if (inv.status === 'acceptee') return p.status === 'clos' && role === 'controleur' ? 'expiree' : 'ok';
  return inv.status; // envoyee | refusee | revoquee | expiree | non_creee
}
// Ce que chacun voit dans « Mes chantiers » (problème 12) : le client ses propres chantiers ; l'entreprise ceux dont elle a
// accepté l'invitation (et, à part, les invitations à son adresse) ; le contrôleur ceux où sa mission est active.
const myEmail = () => { const a = state.account; return a && a.role === 'entreprise' && a.email ? a.email.toLowerCase() : null; };
// Identité de l'entreprise connectée : son e-mail, sinon son nom. Sans compte créé, c'est l'entreprise d'exemple.
const myKey = () => { const a = state.account; return a && a.role === 'entreprise' ? String(a.email || a.name || '').toLowerCase() : null; };
// Parcours A (26 nov.) · P6 du workflow : à la réception provisoire, le chantier passe « en garantie » (figé, plus aucun geste
// de travaux) ; il n'est clos et archivé qu'à la réception définitive.
export const enGarantie = (p) => !!(p && p.status === 'clos' && p.reception && !p.reception.definitiveAt);
export const archive = (p) => !!(p && p.status === 'clos' && !enGarantie(p));
export function forMe(p, role) {
  // Vague 20 (doigt : Omar) : un nouveau client peut ouvrir le chantier d'exemple (Villa Nador), marqué « Exemple », puis le retirer.
  if (role === 'client') { const a = state.account; return a && a.role === 'client' ? p.owner === (a.email || a.name) || (p.id === 'villa-demo' && !!state.session.exemple) : !p.owner || p.owner === SEED_OWNER; }
  if (role === 'entreprise') { const inv = p.invites.entreprise; if (!inv || inv.status !== 'acceptee') return false; const k = myKey(); return k ? inv.by === k : !inv.by; }
  if (role === 'controleur') return ['ok', 'expiree'].includes(access(p, 'controleur'));
  return false;
}
export function invitationsFor(role) {
  // Parcours A (26 nov.) : la mission envoyée par TEEQA (SMS avec lien) se voit aussi du contrôleur avant qu'il l'ouvre.
  if (role === 'controleur') return state.projects.filter(p => p.status !== 'clos' && p.invites.controleur && p.invites.controleur.status === 'envoyee');
  if (role !== 'entreprise') return [];
  const m = myEmail();
  return state.projects.filter(p => p.invites.entreprise && p.invites.entreprise.status === 'envoyee' && (!m || !p.invites.entreprise.email || (p.invites.entreprise.email || '').toLowerCase() === m));   // vague 20 : une invitation par lien ou WhatsApp n'a pas d'e-mail
}
// Fiche publique de l'entreprise d'un chantier (avis publics) : plus de « rachid » écrit en dur.
export const proIdOf = (p) => (p && p.invites.entreprise && p.invites.entreprise.proId) || 'rachid';

// ---------- Règles du processus ----------
// Une visite a été demandée (fin déclarée) et aucun contrôleur ne l'a encore acceptée.
export const missionPending = (s) => !!s && isControlled(s) && s.status === 'fin_declaree' && !!s.mission && s.mission.status === 'proposee';
// Le contrôleur ne photographie et ne signe qu'une fois la mission acceptée (problème 1).
export const missionOk = (s) => !!s && !!s.mission && s.mission.status === 'acceptee';
// Convention (M03) : absente sur un chantier ancien ou créé sans préparation → rien ne bloque.
export const conventionOk = (p) => !p.convention || !!(p.convention.client && p.convention.entreprise);
const lastReview = (s) => s.reviews[s.reviews.length - 1] || null;
// Photos de déclaration qui comptent : de l'entreprise, envoyées, prises depuis le début (ou depuis le dernier refus).
export function declarePhotos(s) {
  const rv = s.status === 'refusee' ? lastReview(s) : null, since = (rv && rv.at) || s.startedAt || '';
  return s.photos.filter(ph => ph.by === 'entreprise' && !ph.correction && ph.sync !== 'echec' && ph.at >= since);   // comptée à la prise ; tout part au retour du réseau
}
export const startPhotos = (s) => s.photos.filter(ph => ph.by === 'entreprise' && !ph.correction && ph.sync !== 'echec' && !s.startedAt);
export const pendingCorrection = (s) => s.corrections.some(c => c.pending);
export const solde = (s) => !!(s.decision && s.decision.status === 'indique' && s.decision.receivedAt);
// Vague 15 : second avis après Réserves ou Refusé (client ou entreprise) ; après un Validé, le client aussi, tant que rien n'est caché (avant le coulage).
export const secondAvisOuvert = (p, s, role) => { const v = (lastReview(s) || {}).verdict; return !!v && canReopen(p, s) && (['retardee', 'refusee'].includes(v) || (v === 'validee' && role === 'client' && !(holdPoint(p, s) && s.coulage))); };
export const VALIDE_CONTESTE = "Avis Validé contesté : si le client demande un second avis, une autre agence repasse. Vous n'avez rien à refaire ; vous ne répondez que de ce qui était visible le jour de votre visite.";
// Rouvrir une étape (second avis, nouvelle visite) : seulement si sa tranche n'est pas soldée et que la suite n'a pas commencé.
export function canReopen(p, s) {
  if (!s || !isControlled(s) || solde(s)) return false;
  const n = p.steps[p.steps.indexOf(s) + 1];
  return !n || ['verrouillee', 'a_venir'].includes(n.status);
}
// Ce qui empêche la clôture (problème 8) : étapes ouvertes, désaccord ouvert, tranche non soldée, avenant en attente.
export function closeBlockers(p) {
  const out = [];
  const open = p.steps.filter(s => !doneLike(s)); if (open.length && !abandonDue(p)) out.push(`${open.length} étape${open.length > 1 ? 's' : ''} pas encore close${open.length > 1 ? 's' : ''}`);
  const dis = p.steps.filter(s => s.contest && s.contest.open); if (dis.length) out.push(`${dis.length} désaccord${dis.length > 1 ? 's' : ''} ouvert${dis.length > 1 ? 's' : ''}`);
  const av = (p.avenants || []).filter(a => a.status === 'propose'); if (av.length) out.push(`${av.length} avenant${av.length > 1 ? 's' : ''} sans réponse`);
  return out;
}
// Ce qui n'empêche pas la réception mais doit être dit (la réception n'est pas liée au paiement).
export function closeWarnings(p) {
  const out = [], pay = p.steps.filter(s => doneLike(s) && !solde(s));
  if (pay.length) out.push(`${pay.length} tranche${pay.length > 1 ? 's' : ''} pas encore soldée${pay.length > 1 ? 's' : ''} : la réception ne règle pas les paiements, ils restent entre vous.`);
  if (abandonDue(p)) out.push("Chantier arrêté par l'entreprise : la réception se fait en l'état, avec un constat des étapes non terminées.");
  return out;
}
// Arrêt du chantier signalé par le client et resté sans reprise : 21 jours sans activité de l'entreprise.
// Parcours B (26 nov., workflow P5) : comme le workflow, 21 jours sans aucune activité de l'entreprise (photo, déclaration, message)
// avant de pouvoir changer d'entreprise ; l'arrêt signalé par le client ouvre ce choix à cette date-là.
export const ABANDON_J = 21;
const activiteEntreprise = (p) => Math.max(0, ...p.steps.flatMap(s => [...s.history.filter(h => h.role === 'entreprise').map(h => +new Date(h.at)), ...s.photos.filter(ph => ph.by === 'entreprise').map(ph => +new Date(ph.at))]));
export const abandonLimite = (p) => p && p.abandon ? new Date((activiteEntreprise(p) || +new Date(p.abandon.at)) + ABANDON_J * 864e5).toISOString() : null;
export const abandonDue = (p, t = nowMs()) => !!(p.abandon && !p.abandon.resumedAt && t > new Date(abandonLimite(p)).getTime());
// Vague 13 : l'entreprise sortante a 8 jours pour répondre à l'état des lieux de reprise ; ensuite il est clos « sans réponse ».
export const EDL_REPONSE_J = 8;
export const edlLimite = (p) => p && p.reprise && p.reprise.entrepriseAt ? new Date(new Date(p.reprise.entrepriseAt).getTime() + EDL_REPONSE_J * 864e5).toISOString() : null;
export const edlClos = (p, t = nowMs()) => !!(p && p.reprise && p.reprise.entrepriseAt && !p.reprise.sortante && t > new Date(edlLimite(p)).getTime());
// Délais dépassés (problème 10) : chaque attente a son délai ; l'écran affiche « En retard » et propose de relancer.
export function overdue(p, s, t = nowMs()) {
  const out = [], past = (at, h) => at && t > new Date(at).getTime() + h * H;
  if (s) {
    if (s.mission && s.mission.status === 'proposee' && (s.mission.dueAt ? t > new Date(s.mission.dueAt).getTime() : past(s.mission.at, DELAIS.mission))) out.push('mission');   // vague 13 : délai de la proposition en cours (après un empêchement, l'autre contrôleur a son propre délai)
    // Vague 6 : sans réseau, la visite compte à l'heure de prise des photos sur place, pas à leur envoi.
    if (s.mission && s.mission.status === 'acceptee' && s.status === 'fin_declaree' && t > new Date(s.mission.dueAt).getTime() && !s.photos.some(ph => ph.by === 'controleur' && ph.at >= (s.mission.acceptedAt || '') && ph.at <= s.mission.dueAt)) out.push('visite');
    // Vague 14 : visite toujours pas faite après la date promise (même si une proposition à un autre contrôleur est en cours).
    if (s.mission && s.mission.status === 'proposee' && s.status === 'fin_declaree' && !s.pendingReview && !s.mission.lateFrom && t > new Date(visitBy(s.mission)).getTime()) { const k = out.indexOf('mission'); if (k >= 0) out.splice(k, 1); out.push('visite'); }
    const rv = lastReview(s);
    if (s.status === 'retardee' && rv && past(rv.at, DELAIS.correction)) out.push('correction');
    if (doneLike(s) && !s.decision && !s.sequestre && rv && past(rv.at, DELAIS.paiement)) out.push('paiement');
    if (s.decision && s.decision.status === 'attend' && past(s.decision.at, DELAIS.attente)) out.push('attente');
    if (s.contest && s.contest.open && past(s.contest.at, DELAIS.desaccord)) out.push('desaccord');
    if (finEtapeDepassee(s, t)) out.push('retard');
  } else if (p) {
    const inv = p.invites.entreprise; if (inv && inv.status === 'envoyee' && past(inv.lastRemindAt || inv.at, DELAIS.invitation)) out.push('invitation');
    for (const a of p.avenants || []) if (a.status === 'propose' && past(a.at, DELAIS.avenant)) { out.push('avenant'); break; }
    if (abandonDue(p, t)) out.push('abandon');
  }
  return out;
}
// Vague 9 : chronologie. Jamais d'avis avant l'heure de la visite ; jamais de début avant le coulage (ou l'avis) de l'étape
// d'avant ; jamais de coulage ni de paiement avant l'avis.
const T = (x) => x ? new Date(x).getTime() : 0;
export const slotStarted = (s) => { if (!s || !s.mission || !s.mission.slot) return true; const d = new Date(s.mission.slot.at); d.setHours(0, 0, 0, 0); return nowMs() >= d.getTime(); };   // le jour du créneau, pas avant
export const reviewTime = (rv) => rv ? T(rv.sentAt || rv.signedAt || rv.at) : 0;
export function prevDoneAt(p, s) { const prev = p.steps[p.steps.indexOf(s) - 1]; if (!prev) return 0;
  return Math.max(prev.coulage ? T(prev.coulage.at) : 0, reviewTime(lastReview(prev)), prev.status === 'vue' ? T(((prev.history || []).filter(h => h.type === 'seen').pop() || {}).at) : 0); }
// Vague 9 : contrôle de chronologie d'un chantier (tests, visite) : renvoie la liste des incohérences de dates, vide si tout va.
// Vague 18 : les DONNÉES d'exemple respectent les règles écrites (le jury relevait des règles justes contredites par l'exemple).
// Renvoie la liste des écarts, vide si tout va. Joué par le test « données d'exemple » et à la fin de la visite.
export function coherence(projects = state.projects) {
  const err = [], T = (x) => x ? new Date(x).getTime() : 0;
  if (tauxDate().getTime() > nowMs()) err.push(`Taux daté du futur (${tauxDate().toISOString().slice(0, 10)})`);
  for (const k in STATUS) if (/étanchéité/i.test(STATUS[k].label || '')) err.push(`État « ${STATUS[k].label} » : l'étanchéité n'est citée que sur l'étape où elle a lieu`);
  for (const p of projects) {
    const debut = p.steps.map(x => T(x.startedAt)).filter(Boolean).sort((a, b) => a - b)[0];
    for (const pc of p.pieces || []) if (pc.by === 'client' && pc.kind !== 'devis' && !pc.recolement && (pc.version || 1) === 1 && debut && T(pc.at) > debut) err.push(`${p.name} : pièce de référence « ${pc.title} » datée après le début du chantier`);
    const enCours = p.steps.filter(x => x.mission && x.status === 'fin_declaree' && ['proposee', 'acceptee'].includes(x.mission.status));
    if (enCours.length > 1) err.push(`${p.name} : ${enCours.length} visites en cours à la fois`);
    p.steps.forEach((s, i) => { const L = `${p.name} · étape ${i + 1}`;
      if (s.mission && s.mission.status === 'proposee' && (s.mission.slot || s.mission.acceptedAt)) err.push(`${L} : mission proposée qui a déjà un créneau ou un contrôleur`);
      for (const rv of s.reviews) { if (!(rv.points || []).length) continue;
        const n = (rv.pieces || []).filter(id => (s.photos.find(ph => ph.id === id) || {}).by === 'controleur').length, req = photosAvisRequises(rv);
        if (n < req) err.push(`${L} : avis ${avisLabel(rv.verdict)} avec ${n} photo${n > 1 ? 's' : ''} du contrôleur pour ${req} demandée${req > 1 ? 's' : ''}`); }
      for (const h of s.history) if (['reponse', 'observation'].includes(h.type) && !h.quote) err.push(`${L} : « ${h.text} » sans son texte`);
      if (s.mission && s.mission.slot && (state.notifications || []).some(n => n.route === `#/c/${p.id}/step/${s.id}` && /le créneau vous sera indiqué/.test(n.text))) err.push(`${L} : ancien message « le créneau vous sera indiqué » après le créneau choisi`);
      const b = budgetOf(p), l = b && b.lignes.find(x => x.sid === s.id);
      if (l && !l.recu && l.partielRecu !== (s.partiels || []).filter(x => x.receivedAt).reduce((a, x) => a + x.dh, 0)) err.push(`${L} : versement non confirmé compté comme reçu`);
      // 20 nov. : séquestre. La banque ne verse jamais avant l'avis favorable (et le coulage), ni d'office avant la limite.
      const q = s.sequestre; if (q && q.verseAt) { if (!doneLike(s, p) || T(q.verseAt) < reviewTime(lastReview(s))) err.push(`${L} : tranche versée par la banque avant l'avis favorable`);
        const lim = seqLimite(p, s); if (q.via === 'delai' && lim && T(q.verseAt) < T(lim)) err.push(`${L} : tranche versée d'office avant la fin du délai d'opposition`);
        if (q.opposition && !q.opposition.leveeAt) err.push(`${L} : tranche versée malgré l'opposition du client`); }
      if (q && !seqActif(p)) err.push(`${L} : tranche sur un compte de séquestre que l'entreprise n'a pas accepté`);
      // Chantier clos publié en exemple : tout doit y être fini, signé, payé et reçu.
      if (p.publie) { if (!doneLike(s, p)) err.push(`${L} : étape pas close sur un chantier publié comme clos`);
        if (isControlled(s) && !(s.reviews.length && lastReview(s).signature)) err.push(`${L} : avis signé absent`);
        if (!solde(s)) err.push(`${L} : tranche pas soldée (« J'ai payé cette tranche » confirmé par l'entreprise)`);
        if (holdPoint(p, s) && !s.coulage) err.push(`${L} : coulage non déclaré`); } });
    if (p.publie) { if (p.status !== 'clos' || !p.reception || !p.reception.entrepriseAt) err.push(`${p.name} : réception non contresignée`);
      if (!(state.avis || []).some(a => a.pid === p.id)) err.push(`${p.name} : avis de la cliente absent`);
      if (p.invites.controleur && p.invites.controleur.status === 'acceptee') err.push(`${p.name} : accès du contrôleur encore actif après la clôture`); }
  }
  return err;
}
export function chronologie(projects = state.projects) {
  const err = [], t = (x) => x ? new Date(x).getTime() : 0, day0 = (x) => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  for (const p of projects) p.steps.forEach((s, i) => {
    const L = `${p.name} · étape ${i + 1}`, prev = p.steps[i - 1];
    // 1. Pas de début avant le coulage (ou l'avis, ou la consultation) de l'étape d'avant.
    if (s.startedAt && prev && !(p.reprise && p.reprise.at && t(s.startedAt) < t(p.reprise.at))) {
      if (holdPoint(p, prev) && !prev.coulage) err.push(`${L} : début déclaré alors que le béton de l'étape ${i} n'est pas coulé`);
      else if (t(s.startedAt) < prevDoneAt(p, s)) err.push(`${L} : début déclaré le ${s.startedAt} avant la clôture de l'étape ${i}`);
    }
    // 2. Pas d'avis avant la visite : ni avant la fin déclarée, ni avant le jour du créneau ; avis dans l'ordre.
    s.reviews.forEach((v, k) => { const at = t(v.signedAt || v.at);
      if (s.firstEndAt || s.endDeclaredAt) { const e = t(firstEndAt(s)); if (at < e) err.push(`${L} : avis signé avant la fin déclarée`); }
      if (v.slotAt && at < day0(v.slotAt)) err.push(`${L} : avis signé le ${v.signedAt}, avant le jour de la visite (${v.slotAt})`);
      if (k && at < t(s.reviews[k - 1].signedAt)) err.push(`${L} : avis ${k + 1} signé avant l'avis ${k}`); });
    // 3. Pas de coulage ni de paiement avant l'avis.
    if (s.coulage && s.reviews.length && t(s.coulage.at) < Math.min(...s.reviews.map(v => t(v.signedAt)))) err.push(`${L} : coulage déclaré avant l'avis sur le ferraillage`);
    // Vague 15 : pas de coulage pendant les 48 h d'un désaccord ouvert sur le ferraillage (sauf s'il a été clos avant).
    { const c = s.contest; if (s.coulage && c && c.ferr && t(c.at) < t(s.coulage.at) && t(s.coulage.at) < t(plus(c.at, DELAIS.desaccord)) && !(c.closedAt && t(c.closedAt) <= t(s.coulage.at))) err.push(`${L} : coulage déclaré pendant la retenue de 48 h d'un désaccord`); }
    if (s.mission && s.mission.lateFrom && s.mission.status === 'proposee' && t(s.mission.lateFrom) > t(s.mission.at)) err.push(`${L} : retard de visite daté après le changement d'agence`);
    // Vague 19 (jury n° 13) : aucune visite ne reste plus de 4 jours sans agence qui l'a acceptée (REGLES.delaiVisite).
    if (s.mission && s.mission.status === 'proposee' && s.status === 'fin_declaree' && nowMs() - t(s.mission.at) > 96 * 3600e3) err.push(`${L} : visite proposée le ${s.mission.at}, toujours pas acceptée par une agence plus de 4 jours après`);
    if (s.decision && s.decision.status === 'indique' && isControlled(s) && !s.reviews.some(v => t(v.signedAt) <= t(s.decision.at))) err.push(`${L} : paiement indiqué avant tout avis`);
    if (s.decision && s.decision.receivedAt && t(s.decision.receivedAt) < t(s.decision.at)) err.push(`${L} : paiement reçu avant d'être indiqué`);
    // 4. Des échéances après leur point de départ.
    const m = s.mission; if (m) { if (m.dueAt && t(m.dueAt) < t(m.at)) err.push(`${L} : échéance de la visite avant sa demande`);
      if (m.acceptedAt && !m.booked && t(m.acceptedAt) < t(m.at)) err.push(`${L} : visite acceptée avant d'être demandée`);
      if (m.slot && m.acceptedAt && !m.booked && t(m.slot.at) < t(m.acceptedAt)) err.push(`${L} : créneau avant l'acceptation de la visite`);
      if (m.slot && m.slot.at && new Date(m.slot.at).getDay() === 0) err.push(`${L} : créneau un dimanche`); }
    if (s.booking && t(s.booking.at) < t(s.booking.bookedAt)) err.push(`${L} : visite réservée avant la réservation`);
    if (s.decision && s.decision.until && t(s.decision.until) < t(s.decision.at)) err.push(`${L} : relance avant la décision`);
    const e = echeance(p, s); if (e && s.coulage && t(e) < t(s.coulage.at)) err.push(`${L} : échéance de paiement avant le coulage`);
    // 5. Un historique toujours dans l'ordre.
    (s.history || []).forEach((h, k) => { if (k && t(h.at) < t(s.history[k - 1].at)) err.push(`${L} : historique dans le désordre (« ${h.text} » daté avant « ${s.history[k - 1].text} »)`); });
  });
  return err;
}
// Vague 25 (4e vague de suite : « À jour » au-dessus de « Accepter la visite ») : UNE seule source pour « qui doit encore agir ».
// attentes(p, s) liste tout ce que quelqu'un doit encore faire sur l'étape (tous rôles) ; « À jour » n'existe que si la liste est vide.
// Toutes les lignes « Pour vous » et la pastille « À jour » en dérivent (step.js), et le test e2e « À jour » parcourt tous les états.
export const ACTIONS_ATTENDUES = { acceptConvention: 'accepter la convention', declareStart: 'débuter l’étape', declareEnd: 'déclarer la fin', acceptMission: 'accepter la visite', photoControl: 'photographier sur place', review: 'signer l’avis', correction: 'corriger les réserves', verifyCorrection: 'contrôler la correction', ack: 'consulter la déclaration', decide: 'décider du paiement', coulage: 'déclarer le coulage', confirmPayment: 'confirmer le paiement reçu', etatDesLieux: 'faire l’état des lieux', etatDesLieuxClient: 'signer l’état des lieux', resume: 'répondre à l’arrêt du chantier', lateSwitch: 'relancer ou changer d’agence', droitReponse: 'répondre au désaccord' };
export function attentes(p, s) {
  if (!p || !s || p.status === 'clos') return [];
  const out = [];
  for (const role of ['client', 'entreprise', 'controleur']) for (const a of Object.keys(ACTIONS_ATTENDUES)) {
    if (role === 'controleur' && s.pendingReview) continue;   // vague 26 (jury n° 7, GPT 11) : avis signé hors réseau, il part seul : rien à faire pour le contrôleur
    if (a === 'decide' && !['validee', 'corrigee', 'vue'].includes(s.status)) continue;   // vague 26 (jury n° 5) : « Paiement différé » n'attend aucun geste du client
    let ok = false; try { ok = can(role, p, ['acceptConvention', 'etatDesLieux', 'etatDesLieuxClient', 'resume'].includes(a) ? null : s, a); } catch { ok = false; }
    if (ok && !(a === 'decide' && !trancheDh(p, s) && s.status !== 'vue')) out.push({ role, action: a, label: ACTIONS_ATTENDUES[a] });
  }
  // L'étape n'est pas finie : quelqu'un doit agir, même si son accès n'est pas encore ouvert (agence pas encore missionnée…).
  if (!['validee', 'corrigee', 'vue'].includes(s.status) && !out.length) out.push({ role: s.status === 'fin_declaree' || s.status === 'correction_soumise' ? 'controleur' : 'entreprise', action: 'etape', label: 'faire avancer l’étape' });
  if (coulageDue(p, s) && !out.some(x => x.action === 'coulage')) out.push({ role: 'entreprise', action: 'coulage', label: ACTIONS_ATTENDUES.coulage });
  if (trancheDh(p, s) && (!s.decision || (s.decision.status === 'indique' && !s.decision.receivedAt)) && ['validee', 'corrigee', 'vue'].includes(s.status) && !out.some(x => ['decide', 'confirmPayment'].includes(x.action))) out.push({ role: s.decision ? 'entreprise' : 'client', action: s.decision ? 'confirmPayment' : 'decide', label: s.decision ? ACTIONS_ATTENDUES.confirmPayment : ACTIONS_ATTENDUES.decide });
  if (s.contest && s.contest.open) out.push({ role: s.contest.by === 'client' ? 'entreprise' : 'client', action: 'desaccord', label: 'traiter le désaccord ouvert' });
  for (const m of s.messages || []) if (m.kind === 'demande_photo' && m.req && m.req.status === 'ouverte') out.push({ role: 'entreprise', action: 'demande_photo', label: 'envoyer la photo demandée' });
  if (retardJours(p, s) > 0) out.push({ role: 'client', action: 'retard', label: 'payer la tranche en retard' });
  return out;
}
export const attentesDe = (role, p, s) => attentes(p, s).filter(x => x.role === role);
export const aJour = (p, s) => attentes(p, s).length === 0;
export function can(role, p, s, action) {
  if (!p || p.status === 'clos') return action === 'read' || (action === 'reception' && p && p.reception && !p.reception.entrepriseAt && role === 'entreprise') || (action === 'definitive' && p && role === 'client' && p.reception && !p.reception.definitiveAt && !!p.reception.entrepriseAt && (!p.reception.reserves || !!p.reception.leveeAt)) || (action === 'leverReserves' && p && role === 'entreprise' && p.reception && !!p.reception.reserves && !!p.reception.entrepriseAt && !p.reception.leveeAt && !p.reception.definitiveAt);
  if (access(p, role) !== 'ok') return false;
  if (p.suiviArrete && action !== 'read') return false;   // vague 26 (scènes 13) : suivi arrêté par le client : le dossier se lit, plus rien ne s'y fait
  const st = s && s.status;
  switch (action) {
    case 'declareStart': return role === 'entreprise' && st === 'a_venir' && conventionOk(p) && !(p.reprise && !p.reprise.entrepriseAt) && startPhotos(s).length > 0 && !coulageDue(p, p.steps[p.steps.indexOf(s) - 1]) && nowMs() >= prevDoneAt(p, s);   // vague 4 : pas de nouvelle étape avant le coulage de la précédente   // une photo au début, contre les débuts déclarés à vide   // pas de travaux avant la convention acceptée des deux côtés
    case 'declareEnd': return role === 'entreprise' && (st === 'debutee' || st === 'refusee') && declarePhotos(s).length >= MIN_PHOTOS;   // problème 4
    case 'photoDeclare': return role === 'entreprise' && (['debutee', 'refusee'].includes(st) || (st === 'a_venir' && conventionOk(p)));
    case 'acceptMission': return role === 'controleur' && missionPending(s);
    case 'photoControl': return role === 'controleur' && isControlled(s) && st === 'fin_declaree' && missionOk(s) && slotStarted(s);
    // Vague 7 : sans réseau, l'avis se signe quand même (photos prises sur place, gardées sur le téléphone) ; il part au retour du réseau.
    case 'review': return role === 'controleur' && isControlled(s) && st === 'fin_declaree' && missionOk(s) && slotStarted(s) && !s.pendingReview && s.photos.some(ph => ph.by === 'controleur' && ph.at >= (s.mission.acceptedAt || s.endDeclaredAt || '') && ph.sync !== 'echec');   // vague 22 (doigt : Salma) : une photo en cours d'envoi compte déjà
    case 'book': return role === 'entreprise' && isControlled(s) && ['a_venir', 'debutee'].includes(st) && conventionOk(p) && !bookingActive(s);
    case 'cancelBooking': return role === 'entreprise' && bookingActive(s) && st !== 'fin_declaree';
    // Vague 7 : recours contre un avis Réserves ou Refusé : second avis par une autre agence, sans passer par un désaccord.
    case 'appeal': { const rv = lastReview(s); return ['entreprise', 'client'].includes(role) && !!rv && !rv.appeal && canReopen(p, s) && ((['retardee', 'refusee'].includes(rv.verdict) && ['retardee', 'refusee', 'correction_soumise'].includes(st))
      || (role === 'client' && rv.verdict === 'validee' && st === 'validee' && holdPoint(p, s) && !s.coulage)); }   // parcours B (26 nov.) : le client conteste aussi un Validé avant le coulage, d'un bouton direct
    // Vague 7 : contrôleur en retard : nouvelle agence, contre-visite non facturée, délais du chantier suspendus.
    case 'lateSwitch': return ['client', 'entreprise'].includes(role) && overdue(p, s).includes('visite') && !(s.mission && s.mission.lateFrom);
    case 'correction': return role === 'entreprise' && st === 'retardee' && !pendingCorrection(s);
    case 'verifyCorrection': return role === 'controleur' && st === 'correction_soumise';   // problème 5 : le contrôleur, à distance
    case 'askVisit': return role === 'client' && st === 'correction_soumise';            // le client peut encore demander une visite
    case 'ack': return role === 'client' && !isControlled(s) && st === 'fin_declaree';
    case 'decide': return isDecideur(p, role) && (s.reviews.length > 0 || st === 'vue') && !s.decision && !s.sequestre && !enContreVisite(s) && nowMs() >= reviewTime(lastReview(s));   // vague 8 : pas de « J'ai payé » pendant une contre-visite (paiement différé)
    case 'undoDecision': return isDecideur(p, role) && !!s.decision && !s.decision.receivedAt;   // problème 3 : une tranche reçue ne se défait plus
    case 'coulage': return role === 'entreprise' && coulageDue(p, s) && !contestBloque(s) && nowMs() >= reviewTime(lastReview(s));   // vague 14 : un désaccord ne bloque le coulage que 48 h   // vague 12 : pas de coulage pendant un désaccord ouvert
    // Vague 4 : l'entreprise peut joindre une observation (texte, photo) à un avis signé, une fois par avis ; le client la voit.
    case 'observe': { const rv = lastReview(s); return role === 'entreprise' && !!rv && !rv.observation; }
    // Vague 4 : droit de réponse du contrôleur quand son avis est contesté ou qu'un second avis est demandé.
    case 'droitReponse': { const rv = lastReview(s); return role === 'controleur' && !!rv && !rv.reponse && !!((s.contest && s.contest.open) || (s.contest && s.contest.issue === 'second_avis')); }
    case 'confirmPayment': return role === 'entreprise' && !!s.decision && s.decision.status === 'indique' && !s.decision.receivedAt;
    case 'notReceived': return role === 'entreprise' && !!s.decision && s.decision.status === 'indique' && !s.decision.receivedAt && !s.decision.notReceivedAt;
    case 'message': return st !== 'verrouillee';
    case 'secondAvis': return ['client', 'entreprise'].includes(role) && !!s.contest && s.contest.open && secondAvisOuvert(p, s, role);   // vague 9 : jamais contre un avis Validé   // vague 4 : pas de second avis sans premier avis
    case 'close': return role === 'client' && closeBlockers(p).length === 0;
    case 'invite': return role === 'client';
    case 'acceptConvention': return ['client', 'entreprise'].includes(role) && !!p.convention && !p.convention[role];
    case 'avenant': return ['client', 'entreprise'].includes(role);
    case 'recuse': return ['client', 'entreprise'].includes(role) && ['envoyee', 'acceptee'].includes((p.invites.controleur || {}).status) && !(p.recusations || {})[role] && !recuseBlocked(p);
    case 'visitImpossible': return role === 'controleur' && st === 'fin_declaree' && missionOk(s) && !s.pendingReview;   // vague 18 (jury, n° 19) : plus de « visite impossible » après un avis signé hors réseau
    // Vague 8 : le contrôleur se désiste d'une visite acceptée, au plus tard 24 h avant le créneau ; TEEQA la confie à un autre.
    case 'withdraw': return role === 'controleur' && st === 'fin_declaree' && missionOk(s) && !s.pendingReview && !s.photos.some(ph => ph.by === 'controleur' && ph.at >= (s.mission.acceptedAt || '')) && (!s.mission.slot || new Date(s.mission.slot.at).getTime() - nowMs() >= DESIST_H * H);
    // Vague 10 : moins de 24 h avant le créneau, le contrôleur signale un empêchement (l'agence le remplace) au lieu de se désister.
    case 'empechement': return role === 'controleur' && st === 'fin_declaree' && missionOk(s) && !s.pendingReview && !!s.mission.slot && new Date(s.mission.slot.at).getTime() - nowMs() < DESIST_H * H && nowMs() < new Date(s.mission.slot.at).getTime() + 2 * H && !s.photos.some(ph => ph.by === 'controleur' && ph.at >= (s.mission.acceptedAt || ''));
    // Vague 10 : acompte de démarrage (étape 1, avant ou pendant) et versement partiel d'une tranche (étape commencée, pas encore payée en entier).
    case 'acompte': return isDecideur(p, role) && p.steps.indexOf(s) === 0 && !s.decision && !s.sequestre && conventionOk(p) && !!trancheDh(p, s);
    case 'partiel': return isDecideur(p, role) && !s.decision && !s.sequestre && !['verrouillee', 'a_venir'].includes(st) && !!trancheDh(p, s);
    // Vague 8 : l'entreprise signale une tranche non payée à l'échéance (le client n'a rien indiqué).
    case 'payLate': return role === 'entreprise' && !s.decision && retardJours(p, s) > 0 && !s.payLateAt;   // vague 12 : relance datée, au moins un jour après l'échéance
    // Vague 8 : état des lieux à la reprise par une nouvelle entreprise, avant tout nouveau début d'étape.
    case 'etatDesLieux': return role === 'entreprise' && !!p.reprise && !p.reprise.entrepriseAt;
    case 'etatDesLieuxClient': return role === 'client' && !!p.reprise && !!p.reprise.entrepriseAt && !p.reprise.clientAt;
    case 'abandon': return role === 'client' && access(p, 'entreprise') === 'ok' && !p.abandon && p.steps.some(x => !doneLike(x));
    case 'resume': return role === 'entreprise' && !!p.abandon && !p.abandon.resumedAt;
    default: return false;
  }
}

// ---------- Vague 8 : famille, budget, désistement, humain joignable ----------
// Délai de désistement du contrôleur : au plus tard 24 h avant le créneau choisi.
export const DESIST_H = 24;
// Qui décide des paiements : le client, et un proche s'il est co-décideur avec le droit « paiements » (délégation du client).
// Dans l'appli, le proche co-décideur agit depuis la vue client (son compte) ; ses gestes sont signés de son nom.
export const DROITS = { payer: 'Décider des paiements', ecrire: 'Écrire dans les échanges', photos: 'Envoyer des photos', ordres: 'Donner des consignes de travaux', avenant: 'Accepter un avenant' };   // vague 10 : consignes et avenants
export const coDecideurs = (p) => ((p && p.proches) || []).filter(x => x.role === 'codecideur');
// Vague 9 : mode simple par défaut pour le client (gros texte, l'essentiel, une action) ; chacun peut l'arrêter dans Profil.
export const simpleOn = (st = state) => !!st && (st.prefs.simple ?? st.role === 'client');
export const isDecideur = (p, role) => role === 'client';
export function decideursLine(p) { const c = coDecideurs(p).filter(x => x.droits && x.droits.payer); const base = [ROLES.client.name + ' (client)', ...c.map(x => `${x.name} (${x.lien ? x.lien.toLowerCase() + ', ' : ''}co-décideur pour les paiements)`)].join(' et ');
  return empecheActif(p) ? `${base} ; titulaire empêché depuis le ${new Date(p.empeche.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${p.empeche.suppleant || 'TEEQA attend le justificatif d’un proche'} décide à sa place` : base; }
// Budget des travaux (saisi par le client d'après le devis ; TEEQA ne le détient pas) : total prévu, payé, reste.
export function budgetOf(p) {
  if (!p || !p.budget || !p.budget.tranches) return null;
  // Vague 10 : versements partiels (acompte avant l'étape 1, partie d'une tranche) : comptés tant que la tranche n'est pas payée en entier.
  const lignes = p.steps.map((s, i) => { const pa = (s.partiels || []).reduce((a, x) => a + x.dh, 0); return { sid: s.id, n: i + 1, title: s.title, dh: +(p.budget.tranches[s.id] || 0), paye: !!(s.decision && s.decision.status === 'indique'), recu: !!(s.decision && s.decision.receivedAt), partiel: pa, partielRecu: (s.partiels || []).filter(x => x.receivedAt).reduce((a, x) => a + x.dh, 0), partiels: s.partiels || [] }; });
  const avs = (p.avenants || []).filter(a => a.status === 'accepte' && a.dh).map(a => ({ id: a.id, title: a.title, dh: a.dh, sid: a.sid }));   // déjà comptés dans la ligne de leur étape
  const total = lignes.reduce((a, x) => a + x.dh, 0), paye = lignes.reduce((a, x) => a + (x.paye ? x.dh : x.partiel), 0);
  const seq = p.steps.reduce((a, s) => a + (s.sequestre && !s.sequestre.verseAt && !(s.decision && s.decision.status === 'indique') ? s.sequestre.dh || 0 : 0), 0);   // vague 21 (jury n° 5) : l'argent posé chez la banque se compte à part
  // Vague 25 (jury n° 3) : une tranche de l'entreprise sortante « tenue pour reçue » (état des lieux clos sans réponse) se compte à part, jamais avec « confirmé reçu ».
  const tenu = p.reprise && edlClos(p) ? lignes.filter(x => x.paye && !x.recu && pourSortante(p, p.steps[x.n - 1])).reduce((a, x) => a + x.dh, 0) : 0;
  return { tenu, resteAPayer: total - paye, total, paye, seq, partiel: lignes.reduce((a, x) => a + (x.paye ? 0 : x.partiel), 0), reste: total - paye - seq, recu: lignes.reduce((a, x) => a + (x.recu ? x.dh : x.paye ? 0 : x.partielRecu), 0), lignes, avenants: avs, source: p.budget.source || 'devis', at: p.budget.at };
}
// Vague 17 (jury, n° 5) : compteur de tranches calculé une fois, cohérent avec le budget (un versement partiel confirmé compte, en partie).
// Vague 25 (jury GPT n° 3) : une tranche de la sortante « tenue pour reçue » (état des lieux clos sans réponse) n'est plus « à confirmer ».
export function tranchesCompte(p) { const ls = p.steps.map(s => ({ pay: !!(s.decision && s.decision.status === 'indique'), recu: !!(s.decision && s.decision.receivedAt), tenu: !!(s.decision && s.decision.status === 'indique' && !s.decision.receivedAt && pourSortante(p, s) && edlClos(p)), partRecu: (s.partiels || []).some(x => x.receivedAt) }));
  return { recues: ls.filter(x => x.recu).length, tenues: ls.filter(x => x.tenu).length, enPartie: ls.filter(x => !x.recu && !x.pay && x.partRecu).length, aConfirmer: ls.filter(x => x.pay && !x.recu && !x.tenu).length }; }
export const tranchesTxt = (p) => { const c = tranchesCompte(p); return [`${c.recues} tranche${c.recues > 1 ? 's' : ''} reçue${c.recues > 1 ? 's' : ''}`, c.tenues ? `${c.tenues} tenue${c.tenues > 1 ? 's' : ''} pour reçue${c.tenues > 1 ? 's' : ''}` : '', c.enPartie ? `${c.enPartie} reçue${c.enPartie > 1 ? 's' : ''} en partie` : '', c.aConfirmer ? `${c.aConfirmer} à confirmer` : ''].filter(Boolean); };
// Vague 18 (jury, n° 8) : un versement indiqué mais pas encore confirmé par l'entreprise n'est pas déduit du reste dû.
export const resteDuTxt = (p, s) => { const t = trancheDh(p, s); if (!t) return ''; const ps = (s.partiels || []), ok = ps.filter(x => x.receivedAt).reduce((a, x) => a + x.dh, 0), att = ps.filter(x => !x.receivedAt).reduce((a, x) => a + x.dh, 0);
  return `reste dû ${dh(t - ok)} sur ${dh(t)}${ok ? `, ${dh(ok)} reçus` : ''}${att ? ` (${dh(att)} indiqués versés, pas encore confirmés par l'entreprise)` : ''}`; };
export const trancheDh = (p, s) => { const b = budgetOf(p); const l = b && b.lignes.find(x => x.sid === s.id); return l && l.dh ? l.dh : 0; };
// Échéance de paiement d'une tranche : 7 jours après l'avis qui recommande le paiement (ou la consultation d'une étape sans visite).
export function echeance(p, s) { return !s || s.decision ? null : echeanceBase(p, s); }
// 20 nov. : échéance de la tranche, payée ou non (le séquestre compte ses 5 jours à partir d'elle).
export function echeanceBase(p, s) {
  if (!s) return null;
  const rv = lastReview(s); let base = null;
  if (s.status === 'vue') base = ((s.history || []).filter(h => h.type === 'seen').pop() || {}).at;
  else if (rv && ['validee', 'corrigee'].includes(s.status)) base = holdPoint(p, s) ? (s.coulage && s.coulage.at) : (s.status === 'corrigee' ? ((s.corrections.filter(c => c.levee).pop() || {}).levee || {}).at || rv.signedAt : rv.signedAt);
  const e = base ? plus(base, DELAIS.paiement) : null;
  // Vague 24 (jury n° 1, 9 personas) : reprise : le reste dû à l'entreprise sortante est arrêté par l'état des lieux ; nouvelle
  // échéance 7 jours après sa signature ; pendant l'état des lieux, aucun retard ne compte (REGLES.reprise, point 1).
  if (e && !s.decision && pourSortante(p, s)) { const rp = p.reprise; if (!rp.clientAt) return null; const n2 = plus(rp.clientAt, DELAIS.paiement); return e < n2 ? n2 : e; }
  return e;
}
// Vague 24 (jury n° 1, 4, 5, 6, 7) : après un changement d'entreprise, à qui revient chaque tranche, calculé une seule fois.
// Vague 26 (jury n° 16) : après une reprise, l'entreprise d'aujourd'hui (la reprenante) partout, jamais le nom de la sortante.
export const entNow = (p) => p && (p.formerPros || []).length && p.invites.entreprise && p.invites.entreprise.status !== 'revoquee' ? (p.invites.entreprise.name || 'l’entreprise reprenante') : who('entreprise');
export const sortanteNom = (p) => { const f = (p && p.formerPros) || []; return f.length ? (f[f.length - 1].name || 'l’entreprise sortante') : ''; };
export const pourSortante = (p, s) => { if (!p || !s || !p.reprise || !(p.formerPros || []).length) return false; const f = firstEndAt(s); return !!f && f < (p.reprise.at || ''); };
export const repriseSuspendue = (p, s) => !!(p && s && !s.decision && pourSortante(p, s) && !p.reprise.clientAt && (() => { const rv = lastReview(s); return !!rv && ['validee', 'corrigee'].includes(s.status); })());
export const resteDu = (p, s) => { const t = trancheDh(p, s); if (!t || (s.decision && s.decision.status === 'indique')) return 0; return Math.max(0, t - (s.partiels || []).reduce((a, x) => a + x.dh, 0)); };
export function repriseArgent(p) {
  if (!p || !p.reprise || !(p.formerPros || []).length || !budgetOf(p)) return null;
  const b = budgetOf(p), so = p.steps.filter(x => pourSortante(p, x)), re = p.steps.filter(x => !pourSortante(p, x));
  const n = (xs) => xs.map(x => p.steps.indexOf(x) + 1);
  const duSortante = so.reduce((a, x) => a + resteDu(p, x), 0), seqSortante = so.filter(seqSurCompte).reduce((a, x) => a + resteDu(p, x), 0), aReprenante = re.reduce((a, x) => a + resteDu(p, x), 0);
  return { sortante: sortanteNom(p), verse: b.paye, duSortante, seqSortante, aReprenante, total: b.total, tranchesSortante: n(so), tranchesReprenante: n(re), juste: b.paye + duSortante + aReprenante === b.total };
}
// Vague 22 (doigt : Brahim, Hassan) : tant que la date n'est pas fixée, une date estimée (« vers le … ») à côté de la règle :
// visite au plus tard (ou créneau), + 1 jour pour couler au point d'arrêt, + 7 jours. Jamais présentée comme une échéance.
export function echeanceEstimee(p, s) {
  if (!s || s.decision || echeance(p, s)) return null;
  let base = null;
  if (coulageDue(p, s)) base = new Date(nowMs()).toISOString();
  else if (s.status === 'fin_declaree' && s.mission) base = (s.mission.slot && s.mission.slot.at) || visitBy(s.mission);
  if (!base || new Date(base).getTime() < nowMs() - 864e5) base = new Date(nowMs()).toISOString();
  return plus(base, (holdPoint(p, s) && !s.coulage ? 24 : 0) + DELAIS.paiement);
}
// Vague 23 (jury n° 19 : « ≈ 6 nov. » ici, « vers le 3 nov. » là) : l'estimation dit sur quoi elle repose ; elle bouge quand ce repère bouge.
export function estimeSur(p, s) {
  if (!s || s.decision || echeance(p, s)) return '';
  if (coulageDue(p, s)) return 'd’après un coulage aujourd’hui';
  if (s.status === 'fin_declaree' && s.mission) { const sl = s.mission.slot && s.mission.slot.at, vb = visitBy(s.mission), d = (x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace(/\.$/, '') + '.';
    if (sl && new Date(sl).getTime() >= nowMs() - 864e5) return `d’après la visite prévue le ${d(sl)}`; if (vb && new Date(vb).getTime() >= nowMs() - 864e5) return `d’après une visite au plus tard le ${d(vb)}`; }
  return 'd’après aujourd’hui';
}
// Vague 24 (doigt : Abdelkader, Driss ; jury n° 6 et 8) : une seule phrase d'argent, en gros, la même sur Mes chantiers et sur
// l'étape, en français comme en arabe : « Payez 260 000 DH avant le 6 déc. » ou « Rien à payer maintenant ». Jamais « différé »
// à côté d'une date ; le montant est ce qui reste dû (versements partiels déduits) ; après une reprise, il dit à qui payer.
const jm2 = (x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
export const manqueArgent = (p, s) => ['verrouillee', 'a_venir'].includes(s.status) ? 'le début de l’étape' : coulageDue(p, s) ? 'le coulage' : ['debutee', 'refusee'].includes(s.status) ? 'la fin des travaux de l’étape' : s.status === 'retardee' ? 'la correction des réserves' : isControlled(s) && !['validee', 'corrigee'].includes(s.status) ? `la visite du contrôleur${holdPoint(p, s) ? ', puis le coulage' : ''}` : 'l’accord du client';
export function phraseArgent(p, s, r) {
  const m = resteDu(p, s); if (!m) return null;
  if (decesActif(p)) return { gros: 'Tranches suspendues : décès déclaré', sous: 'Rien n’est dû tant que les héritiers n’ont pas désigné leur mandataire.', i: p.steps.indexOf(s) + 1, m, e: null, n: 0, est: null, a: '', du: false };   // vague 25 (faille : décès du client)
  const e = echeance(p, s), n = retardJours(p, s), est = e ? null : echeanceEstimee(p, s), i = p.steps.indexOf(s) + 1, a = pourSortante(p, s) ? sortanteNom(p) : '';
  const j = (k) => `${k} jour${k > 1 ? 's' : ''}`;
  if (r === 'client') {
    const gros = n ? `Payez ${dh(m)}${a ? ` à ${a}` : ''} : en retard de ${j(n)}` : e ? `Payez ${dh(m)}${a ? ` à ${a}` : ''} avant le ${jm2(e)}` : 'Rien à payer maintenant';
    const sous = n || e ? '' : repriseSuspendue(p, s) ? `Ensuite : ${dh(m)} à ${a}, 7 jours après l’état des lieux signé` : est ? `Ensuite : ${dh(m)}, vers le ${jm2(est)} (estimation ${estimeSur(p, s)})` : `Ensuite : ${dh(m)}, 7 jours après ${dueApres(p, s)}`;
    return { gros, sous, i, m, e, n, est, a, du: !!(n || e) };
  }
  const c = who('client', 'entreprise');
  // Vague 25 (doigt : Lhoussaine) : une phrase courte, sans « estimation » ni « tranche » : « 260 000 DH · vers le 6 déc. », puis « Il manque : … ».
  const gros = n ? `${c} paie ${dh(m)} : en retard de ${j(n)}` : e ? `${c} doit vous payer ${dh(m)} avant le ${jm2(e)}` : est ? `${dh(m)} · vers le ${jm2(est)}` : `Vous recevrez ${dh(m)} 7 jours après ${dueApres(p, s)}`;
  // Vague 25 (jury v24 n° 8) : la même base que le client, sans le mot « estimation » : « Il manque : la visite du contrôleur (prévue le 27 oct.), puis le coulage ».
  const base = est ? estimeSur(p, s).replace(/^d’après (la |une )?visite /, '') : '', manque = manqueArgent(p, s).replace(/^la visite du contrôleur/, (x) => base && /le \d/.test(base) ? `${x} (${base})` : x);
  // Vague 26 (doigt : Mbarek) : de quoi dépend la date : « 7 déc. si la visite a lieu au plus tard le 29 nov. ; plus tard sinon ».
  const dep = est && s.status === 'fin_declaree' && s.mission ? (() => { const vb = (s.mission.slot && s.mission.slot.at) || visitBy(s.mission); return vb ? ` Cette date tient si la visite a lieu au plus tard le ${jm2(vb)}${holdPoint(p, s) ? ' et que vous coulez le lendemain' : ''} ; si elle passe plus tard, la date recule d’autant (un retard de l’agence ne vous est pas compté).` : ''; })() : est ? ' Date estimée : elle recule si une étape d’avant prend du retard.' : '';
  return { gros, sous: n || e ? '' : `Il manque : ${manque}`, dep: n || e ? '' : dep.trim(), i, m, e, n, est, a, du: !!(n || e) };
}
// Vague 17 (jury, n° 3) : le moment où la tranche est due, dit avec les mêmes mots partout (REGLES.trancheDue).
export const dueApres = (p, s) => holdPoint(p, s) ? 'le coulage déclaré (qui suit l’avis favorable)' : 'l’avis favorable';   // vague 18 (jury, n° 12) : un seul déclencheur dit
// Vague 12 : tranche recommandée non payée après l'échéance : nombre de jours de retard, vu des deux côtés.
// Vague 14 : jours de calendrier (9 nov. - 2 nov. = 7 jours), quelle que soit l'heure, pour le même décompte sur tous les écrans.
const jourDe = (ms) => { const d = new Date(ms); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
// Vague 14 : une contestation (avec motif) ouverte avant le coulage le bloque 48 h ; ensuite, sans issue, le point d'arrêt reste levé
// (l'avis du contrôleur suffit) et le désaccord reste écrit au dossier.
export const contestFin = (s) => s.contest && s.contest.open ? plus(s.contest.at, DELAIS.desaccord) : null;
// Vague 15 : seul un désaccord ouvert une fois le ferraillage prêt (il porte sur ce que le béton va cacher) retient le coulage.
export const contestBloque = (s) => !!(s.contest && s.contest.open && s.contest.ferr && nowMs() < new Date(contestFin(s)).getTime());
// Vague 15 : un désaccord du client qui a retenu le coulage décale d'autant les délais de l'entreprise (équité).
export const retenueMs = (s, c = s && s.contest) => { if (!c || !c.ferr || c.by !== 'client') return 0; const fin = new Date(plus(c.at, DELAIS.desaccord)).getTime(); const end = Math.min(c.closedAt ? new Date(c.closedAt).getTime() : (s.coulage ? new Date(s.coulage.at).getTime() : nowMs()), fin); return Math.max(0, mur(end) - mur(new Date(c.at).getTime())); };
// Vague 17 (jury, n° 4) : la durée se compte comme on lit les heures affichées (24 oct. 18:40 → 26 oct. 11:00 = 40 h 20), même si un changement d'heure tombe entre les deux.
function mur(ms) { return ms - new Date(ms).getTimezoneOffset() * 60000; }
// Vague 16 : durée exacte, à la minute (40 h 20, pas « 41 h »).
export const retenueTxt = (ms) => { const m = Math.min(48 * 60, Math.max(1, Math.round(ms / 60000))), h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ' ' + String(r).padStart(2, '0') : ''}` : `${r} min`; };
function appliquerRetenue(p, s) { const c = s.contest; if (!c || c.decale) return; const ms = retenueMs(s); if (ms <= 0) return; c.decale = ms;
  (p.suspensions = p.suspensions || []).push({ sid: s.id, from: c.at, to: new Date(new Date(c.at).getTime() + ms).toISOString(), motif: 'désaccord du client avant coulage' });
  if (p.finPrevue) p.finPrevue = new Date(new Date(p.finPrevue).getTime() + ms).toISOString();
  log(s, 'teeqa', 'mission', `Coulage retenu ${retenueTxt(ms)} par le désaccord du client : délais de l'entreprise décalés d'autant`); }
// Vague 16 : espèces et chèque, courants au Maroc, se déclarent comme un virement ; l'entreprise confirme la réception dans tous les cas.
// ---------- 20 nov. (réalisme) : séquestre bancaire facultatif (REGLES.sequestre, écrite une seule fois) ----------
// Banque partenaire au nom inventé. Ses frais sont ceux de la banque, payés à la banque, distincts du forfait TEEQA.
export const SEQUESTRE = { banque: 'Banque Saphir', ouverture: 400, pct: '0,4 %', min: 150, jours: 5 };
export const sequestreFraisTxt = () => `Frais de ${SEQUESTRE.banque}, payés par le client à la banque et distincts du forfait TEEQA : ${dh(SEQUESTRE.ouverture)} à l'ouverture du compte, puis ${SEQUESTRE.pct} de chaque tranche versée à l'entreprise (${dh(SEQUESTRE.min)} au moins).`;
// Vague 24 (séquestre, 4 groupes) : les frais totaux pour ce chantier, et où s'opposer, dits une fois en clair.
// Vague 26 (jury n° 10) : seules les tranches qui peuvent encore passer par le compte (ni payées ni déjà dues) comptent dans les frais.
const seqEligibles = (p) => { const b = budgetOf(p); if (!b) return []; return b.lignes.filter((l, i) => l.dh && (seqSurCompte(p.steps[i]) || (!l.paye && !echeance(p, p.steps[i])))); };
export const seqFraisTotal = (p) => { const L = seqEligibles(p); if (!L.length) return 0; return SEQUESTRE.ouverture + L.reduce((a, l) => a + Math.max(SEQUESTRE.min, Math.round(l.dh * 0.004)), 0); };
// Vague 26 (jury n° 27, GPT 2, 7 personas) : l'opposition est au client ; l'entreprise lit qu'elle en est prévenue.
export const seqFraisChantierTxt = (p, r = state && state.role) => { const t = seqFraisTotal(p); if (!t) return ''; const L = seqEligibles(p), n = L.map(l => l.n), tr = n.length > 1 ? `tranches ${n.slice(0, -1).join(', ')} et ${n[n.length - 1]}` : `tranche ${n[0]}`;
  return `Pour ce chantier, si les tranches qui peuvent encore y passer (${tr} ; une tranche payée ou déjà due ne peut plus y être déposée) passent par le compte : ${dh(t)} de frais en tout, payés à ${SEQUESTRE.banque} (pas à TEEQA). ${r === 'client' ? 'Pour vous opposer à un versement : sur l’étape de la tranche, bouton « Je m’oppose au versement », dès l’avis favorable et avant la date de versement d’office ; l’argent reste alors à la banque.' : 'Seul le client peut s’opposer à un versement (sur l’étape de la tranche, avant la date de versement d’office) ; l’argent reste alors à la banque et vous en êtes prévenu par TEEQA.'}`; };
export const seqActif = (p) => !!(p && p.sequestre && p.sequestre.entrepriseAt);
export const seqSurCompte = (s) => !!(s && s.sequestre && !s.sequestre.verseAt);
export const seqSolde = (p) => (p ? p.steps.filter(seqSurCompte).reduce((a, s) => a + (s.sequestre.dh || 0), 0) : 0);
// Versement d'office : SEQUESTRE.jours jours après l'échéance de la tranche, sans opposition du client.
export const seqLimite = (p, s) => { const e = echeanceBase(p, s); return e ? new Date(new Date(e).getTime() + SEQUESTRE.jours * 864e5).toISOString() : null; };
const jourMois = (x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
export function seqEtatTxt(p, s) {
  const q = s && s.sequestre; if (!q) return '';
  if (q.verseAt) return `Versée à l'entreprise par ${SEQUESTRE.banque} le ${jourMois(q.verseAt)}${q.via === 'delai' ? ", d'office (5 jours après l'échéance, sans opposition du client)" : ', à la confirmation du client'}.`;
  const base = `Sur le compte de séquestre de ${SEQUESTRE.banque} depuis le ${jourMois(q.at)} (${dh(q.dh)}) : la banque la garde ; TEEQA ne garantit pas le paiement.`;
  if (q.opposition) return `${base} Opposition du client le ${jourMois(q.opposition.at)} : « ${q.opposition.motif} ». L'argent reste sur le compte jusqu'à un accord écrit des deux parties, ou la décision d'un médiateur ou d'un juge.`;
  const lim = seqLimite(p, s), qui = pourSortante(p, s) ? `${sortanteNom(p)} (entreprise sortante, qui a fait ce travail)` : "l'entreprise";   // vague 24 (jury n° 7)
  return lim ? `${base} La banque la verse à ${qui} quand le client confirme, ou d'office le ${jourMois(lim)} s'il ne s'y oppose pas.` : `${base} La banque la verse à ${qui} après ${dueApres(p, s)}, quand le client confirme (ou d'office 5 jours après l'échéance, sans opposition).`;
}
// Versement d'office, joué à chaque changement d'état (l'heure de l'appli suit celle de la visite guidée).
function appliquerSequestre(st) {
  for (const p of (st && st.projects) || []) { if (!seqActif(p)) continue;
    for (const s of p.steps) { const q = s.sequestre; if (!q || q.verseAt || q.opposition) continue; const lim = seqLimite(p, s); if (lim && nowMs() >= new Date(lim).getTime()) verserSeq(p, s, 'delai'); } }
}
function verserSeq(p, s, via) {
  const q = s.sequestre; q.verseAt = now(); q.via = via; if (q.opposition) q.opposition.leveeAt = now();
  s.decision = { status: 'indique', at: now(), moyen: 'sequestre', dh: q.dh, receivedAt: now(), banque: SEQUESTRE.banque };
  if (via === 'client') log(s, 'client', 'decision', `« J'ai payé cette tranche » par le compte de séquestre : ${SEQUESTRE.banque} l'a versée à l'entreprise`);
  else { log(s, 'client', 'receipt', `${SEQUESTRE.banque} a versé la tranche à l'entreprise d'office : 5 jours après l'échéance, sans opposition du client`); s.history[s.history.length - 1].by = SEQUESTRE.banque; }
  notify(['client', 'entreprise'], `${SEQUESTRE.banque} a versé la ${trancheName(p, s).toLowerCase()} (${dh(q.dh)}) à ${R('entreprise')}${via === 'delai' ? ", d'office, sans opposition du client" : ', à la confirmation du client'}. Tranche soldée.`, `#/c/${p.id}/step/${s.id}`);
}
export const MOYENS = { virement: 'Par virement', especes: 'En espèces, contre un reçu signé par l\'entreprise', cheque: 'Par chèque' };
// Vague 18 (scène 10) : pendant l'empêchement déclaré du titulaire, le retard est suspendu ; ensuite, ses jours ne comptent pas.
export const empecheActif = (p) => !!(p && p.empeche && !p.empeche.finAt);
const joursEmpeche = (p) => p && p.empeche ? Math.max(0, Math.round((jourDe(p.empeche.finAt ? new Date(p.empeche.finAt).getTime() : nowMs()) - jourDe(new Date(p.empeche.at).getTime())) / 864e5)) : 0;
export const retardJours = (p, s) => { const e = echeance(p, s); if (!e || empecheActif(p) || decesActif(p) || (s && s.sequestre)) return 0;   /* 20 nov. : tranche sur le compte de séquestre : pas de retard */ const d = Math.round((jourDe(nowMs()) - jourDe(new Date(e).getTime())) / 864e5) - (p.empeche && new Date(p.empeche.finAt).getTime() > new Date(e).getTime() ? joursEmpeche(p) : 0); return d > 0 ? d : 0; };
// Vague 12 : la responsabilité du contrôleur en 3 cas concrets (fiche de mission).
export const RESPONSABILITE = [
  ['Exemple', "des cales absentes sur le poteau photographié, notées « Conforme », engagent votre agence, pas vous, même une fois le béton coulé."],
];
// Humain joignable : l'équipe TEEQA (pas l'agence ni l'entreprise), par WhatsApp ou téléphone, en français, arabe, darija et tamazight.
export const SUPPORT = { horaires: HORAIRES, langues: "français, arabe, darija, tachelhit, tarifit, tamazight de l'Atlas", rappel: 'Rappel gratuit aux heures ouvertes (heure du Maroc), où que vous viviez : Europe, Canada, États-Unis, pays du Golfe ; on vous dit l’heure du rappel chez vous' };   // vague 18 (scènes) : pas seulement l’Europe
// ---------- Vague 10 : confiance. Ce que TEEQA garantit par écrit, ce qu'il ne garantit pas, qui est TEEQA ----------
export const ENGAGEMENTS = {
  identite: "TEEQA SARL · boulevard Al Massira, Maârif, 20330 Casablanca · RC Casablanca 612 447",
  garantit: [
    REGLES.delaiVisite,
    "Chaque photo, avis, paiement indiqué et message est daté et gardé tel quel : toute modification laisse une trace. Photos et avis portent aussi l'heure de réception par le serveur de TEEQA, qui ne dépend pas du téléphone. C'est un début de preuve, pas une certification ni une signature qualifiée.",
    "Le contrôleur est envoyé par une agence de contrôle agréée, assurée, sans lien avec votre entreprise ; vous pouvez demander une autre agence une fois.",
    "Le dossier du chantier (rapport, photos, avis) reste à vous : exportable à tout moment, gardé 10 ans (la durée de la garantie décennale), même si vous quittez TEEQA. Ce qui vous identifie (nom, numéro, e-mail) peut en être retiré à votre demande : voir la ligne suivante.",
    "Vos données personnelles (nom, numéro, e-mail) s'effacent à votre demande (loi 09-08, CNDP) ; ce qui sert de preuve à l'autre partie (avis, photos datées) reste au dossier du chantier, sans votre nom. La position GPS n'est relevée qu'à la prise d'une photo, jamais en continu, et suit la photo.",
    "Vous vivez dans l'Union européenne ou en Suisse ? Le RGPD ou la loi suisse sur la protection des données (nLPD) s'appliquent aussi à vos données : TEEQA répond sous 30 jours à toute demande d'accès, de correction ou d'effacement, écrite depuis Profil.",
    `Un humain de TEEQA répond dans votre langue, ${HORAIRES}.`,
  ],
  garantitPas: [
    "La qualité de l'ouvrage : c'est l'entreprise qui en répond (garantie d'un an, garantie décennale).",
    "L'argent des travaux : TEEQA ne le détient jamais ; vous payez l'entreprise directement.",
    "L'issue d'un désaccord : TEEQA ne tranche pas ; il date et garde les pièces pour un médiateur ou un juge.",
    "Ce que la visite ne pouvait pas voir (béton coulé ensuite, point noté « Non vu »).",
  ],
  get plafond() { return REGLES.responsabilite; },
  // Vague 14 : noms des prestataires (inventés), dits une seule fois, ici (écran « Nos garanties écrites »).
  prestataires: [
    ['Assureur de TEEQA', 'Mutuelle Kasbah Assurances (Casablanca) · police RC pro TQ-2026-0417'],
    ['Hébergeur des données', 'Médina Cloud SARL, centre de données de Rabat (au Maroc)'],
    ['Médiateur proposé', 'Centre de médiation Bab Al Wifaq (Casablanca), indépendant de TEEQA'],
    // Vague 16 : les flux qui sortent de l'appli, nommés (le jury lisait « hébergé au Maroc » à côté de vocaux transcrits et de paiements par carte).
    ['Transcription et traduction des vocaux', 'faites sur les serveurs de Médina Cloud à Rabat, au Maroc'],
    ['WhatsApp et SMS (si vous les choisissez)', 'alertes et liens seulement, sans photo ni avis ; ces messages passent par ces services, hors du Maroc'],
    ['Paiement par carte du forfait', 'Atlas Paiement SA (Casablanca), qui garde les données de carte ; TEEQA ne les voit pas'],
    // 20 nov. : la banque du séquestre facultatif (nom inventé).
    ['Séquestre des tranches (si vous le choisissez)', 'Banque Saphir SA (Casablanca), banque agréée par Bank Al-Maghrib : elle garde l’argent des tranches ; TEEQA ne le touche jamais'],
  ],
  assurances: [
    ['TEEQA', 'Responsabilité civile professionnelle · 1 000 000 DH par sinistre · attestation sur demande'],
    ["Agence de contrôle", 'Responsabilité civile professionnelle · 2 000 000 DH par sinistre · 6 000 000 DH par an · franchise de 10 000 DH à sa charge · attestation jointe à chaque mission'],
    ["Entreprise", "Assurance décennale et responsabilité civile : attestation déposée sur sa fiche (vérifiez la date de validité)"],
  ],
  droit: "Convention soumise au droit marocain (DOC). Signature électronique simple au sens de la loi 53-05 : elle prouve qui a accepté et quand ; elle n'est pas une signature qualifiée.",
};
// Vague 11 : le client dit dans quel pays il vit. S'il vit au Maroc : dirhams et heure du Maroc seulement.
// S'il vit ailleurs : l'équivalent dans la devise de son pays et son heure, à côté. L'entreprise et le contrôleur ne lisent que des dirhams.
export const TAUX = { eur: 10.8, chf: 11.5, gbp: 12.6, cad: 7.2, usd: 9.9, aed: 2.7, qar: 2.7, sar: 2.6, date: '2026-11-02', source: 'cours indicatif de Bank Al-Maghrib' };
export const DEVISES = { eur: '€', chf: 'CHF', gbp: '£', cad: '$ CA', usd: '$ US', aed: 'AED', qar: 'QAR', sar: 'SAR' };
const DEV_NOM = { eur: 'un euro', chf: 'un franc suisse', gbp: 'une livre', cad: 'un dollar canadien', usd: 'un dollar américain', aed: 'un dirham des Émirats', qar: 'un riyal qatari', sar: 'un riyal saoudien' };
export const PAYS = {
  MA: { ville: 'Rabat', nom: 'Maroc', de: 'du Maroc', devise: null, tz: 'Africa/Casablanca', tel: '+212 5 22 64 18 40' },
  FR: { ville: 'Paris', nom: 'France', de: 'de France', devise: 'eur', tz: 'Europe/Paris', tel: '+33 1 84 80 12 40' },
  BE: { ville: 'Bruxelles', nom: 'Belgique', de: 'de Belgique', devise: 'eur', tz: 'Europe/Brussels', tel: '+32 2 808 41 20' },
  CH: { ville: 'Genève', nom: 'Suisse', de: 'de Suisse', devise: 'chf', tz: 'Europe/Zurich', tel: '+41 22 518 40 20' },
  LU: { ville: 'Luxembourg', nom: 'Luxembourg', de: 'du Luxembourg', devise: 'eur', tz: 'Europe/Luxembourg', tel: '+352 20 30 41 20' },
  MC: { ville: 'Monaco', nom: 'Monaco', de: 'de Monaco', devise: 'eur', tz: 'Europe/Monaco', tel: '+377 97 70 41 20' },
  ES: { ville: 'Madrid', nom: 'Espagne', de: "d'Espagne", devise: 'eur', tz: 'Europe/Madrid', tel: '+34 911 23 41 20' },
  IT: { ville: 'Rome', nom: 'Italie', de: "d'Italie", devise: 'eur', tz: 'Europe/Rome', tel: '+39 06 9480 4120' },
  NL: { ville: 'Amsterdam', nom: 'Pays-Bas', de: 'des Pays-Bas', devise: 'eur', tz: 'Europe/Amsterdam', tel: '+31 20 808 4120' },
  DE: { ville: 'Berlin', nom: 'Allemagne', de: "d'Allemagne", devise: 'eur', tz: 'Europe/Berlin', tel: '+49 30 2555 4120' },
  GB: { ville: 'Londres', nom: 'Royaume-Uni', de: 'du Royaume-Uni', devise: 'gbp', tz: 'Europe/London', tel: '+44 20 3808 4120' },
  CA: { ville: 'Montréal', nom: 'Canada (Québec, Ontario)', de: 'du Québec', devise: 'cad', tz: 'America/Toronto', tel: '+1 514 900 4120' },
  US: { ville: 'New York', nom: 'États-Unis (côte est)', de: 'de New York', devise: 'usd', tz: 'America/New_York', tel: '+1 646 980 4120' },
  AE: { ville: 'Dubaï', nom: 'Émirats arabes unis', de: 'des Émirats', devise: 'aed', tz: 'Asia/Dubai', tel: '+971 4 576 4120' },
  QA: { ville: 'Doha', nom: 'Qatar', de: 'du Qatar', devise: 'qar', tz: 'Asia/Qatar', tel: '+974 4020 4120' },
  SA: { ville: 'Riyad', nom: 'Arabie saoudite', de: "d'Arabie saoudite", devise: 'sar', tz: 'Asia/Riyadh', tel: '+966 11 520 4120' },
};
// Karim vit à Lyon : France par défaut.
export const pays = () => (state && state.prefs && PAYS[state.prefs.pays] && state.prefs.pays) || 'FR';
// Vague 25 (3 groupes : « ≈ 139 € » avant le choix du pays) : pas d'équivalent en devise tant qu'on n'est pas entré ni n'a dit où l'on vit.
const lecteurClient = () => !!state && state.role === 'client' && !!((state.session && state.session.loggedIn) || (state.prefs && state.prefs.pays));
// Devise étrangère montrée au lecteur : seulement au client qui vit hors du Maroc ; sinon null (dirhams seuls).
export const deviseVue = () => lecteurClient() ? PAYS[pays()].devise : null;
export const devise = () => deviseVue() || 'eur';
// Vague 25 (jury n° 12) : un taux par jour ouvré (le même toute la journée, celui du vendredi le week-end), qui bouge d'un jour à l'autre.
export const tauxJour = (d = devise(), at = nowMs()) => { const b = TAUX[d] || TAUX.eur, j = Math.floor(tauxDate(at).getTime() / 864e5); return Math.round(b * (1 + 0.006 * Math.sin(j * 1.7)) * 100) / 100; };
export const enDevise = (dhv, d = devise()) => Math.round(dhv / tauxJour(d));
export const enDeviseTxt = (dhv, d = devise()) => `${grp(enDevise(dhv, d))} ${DEVISES[d]}`;
// Vague 17 (jury, n° 12) : chaque montant converti dit son taux et sa date, ceux de TAUX (une seule source).
// Vague 18 (jury, n° 6) : le taux est celui du dernier jour ouvré AVANT l'écran (cours de la veille), jamais une date à venir.
// Vague 21 (jury n° 22) : le cours du jour de l'écran (jour ouvré) ; le samedi et le dimanche, celui du vendredi.
export const tauxDate = (at = nowMs()) => { const d = new Date(at); d.setHours(0, 0, 0, 0); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return d; };
export const tauxCourt = (d = devise()) => `taux ${String(tauxJour(d)).replace('.', ',')} DH par ${DEVISES[d]} au ${tauxDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${TAUX.source}`;
// Vague 19 : un seul taux daté par écran. Le montant converti dit seulement « ≈ 102 € » ; la ligne du taux (tauxLigne, avec sa
// date et sa source) est posée une fois en bas de l'écran ou de la feuille qui montre un montant converti (tauxEcran).
export const enDeviseTaux = (dhv, d = devise()) => enDeviseTxt(dhv, d);
export const CONVERTI_RX = new RegExp(`≈[\\s\\u00a0\\u202f]*\\d[\\d\\s\\u00a0\\u202f]*(${Object.values(DEVISES).map(x => x.replace(/[$]/g, '\\$')).join('|')})`);
// vague 21 (doigt v21) : sur l'accueil, la ligne du taux suit les boutons au lieu de passer dessus.
export function tauxEcran(root) { try { if (!root || root.querySelector('[data-testid="taux"]')) return; const t = tauxLigne(); if (!t || !CONVERTI_RX.test(root.textContent)) return;
  const foot = root.querySelector('.land-foot'), host = foot || root.querySelector('.scroll > .content') || root.querySelector('.scroll') || root; const el = document.createElement('p'); el.className = 'meta'; el.style.margin = '4px 0 0'; if (foot) { el.style.textAlign = 'center'; el.style.fontSize = '12.5px'; } el.dataset.testid = 'taux'; el.textContent = t; host.appendChild(el); } catch { /* rien */ } }
export const tauxLigne = () => { const d = deviseVue(); if (!d) return ''; return `Montants en ${DEVISES[d]} indicatifs : ${DEV_NOM[d]} pour ${String(tauxJour(d)).replace('.', ',')} DH (${TAUX.source} du ${tauxDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}). Votre banque appliquera son taux et ses frais.`; };
// Vague 10 : équipe de l'entreprise, chacun avec des droits limités (le patron garde la convention et les avenants).
export const EQUIPE_ROLES = {
  'Chef de chantier': { droits: ['Déclarer le début et la fin', 'Photos', 'Messages et vocaux'], txt: 'Déclare les étapes pour l’entreprise, prend les photos, écrit et envoie des vocaux.' },
  'Conducteur de travaux': { droits: ['Déclarer le début et la fin', 'Réserver une visite', 'Photos', 'Messages et vocaux', 'Proposer un avenant si le patron le lui délègue'], txt: 'Suit plusieurs chantiers : déclare, réserve les visites, répond au client ; peut proposer un avenant si le patron le lui délègue.' },
  'Ouvrier': { droits: ['Photos', 'Vocaux'], txt: 'Sans compte, par son numéro : envoie des photos et des vocaux ; ne déclare rien et ne voit pas les paiements.' },
  'Comptable': { droits: ['Voir le budget', 'Confirmer un paiement reçu'], txt: 'Voit le budget et confirme les paiements reçus ; ne déclare aucune étape.' },
};
// Fuseau horaire : celui du pays du client (heure du Maroc s'il y vit, et toujours pour l'entreprise et le contrôleur).
export const fuseau = () => lecteurClient() ? PAYS[pays()].tz : 'Africa/Casablanca';
// Vague 22 (Suisse, Belgique : « à Paris » pour un client de Fribourg) : la ville du client quand il l'a donnée (Karim : Lyon), sinon la capitale de son pays.
// Vague 25 (Belgique, Suisse) : numéro local du support et heure du pays du client, pour « Parler à quelqu'un ».
export const telSupport = () => (lecteurClient() ? PAYS[pays()].tel : PAYS.MA.tel);
export const villeClient = () => { const pr = (state && state.prefs) || {}; return pr.ville && pr.villePays === pays() ? pr.ville : (PAYS[pays()].ville || PAYS[pays()].nom); };
export const paysDe = (tz) => { const k = Object.keys(PAYS).find(c => PAYS[c].tz === tz); return k ? PAYS[k].de : tz; };
// Pour le client à l'étranger : une plage horaire du Maroc donnée aussi à son heure.
export const plageChezVous = (h1, h2) => { const tz = fuseau(); if (tz === 'Africa/Casablanca') return ''; const dd = decalage(new Date(nowMs()).toISOString(), tz), f = (h) => `${((h + dd) % 24 + 24) % 24} h`; return dd ? `soit ${f(h1)} – ${f(h2)} à votre heure (${villeClient()}) aujourd'hui` : `la même heure à ${villeClient()} aujourd'hui`; };
// Vague 17 (jury, n° 11) : pour le client qui vit hors du Maroc, chaque créneau « (heure du Maroc) » affiché porte aussi son heure à lui :
// « 9 h – 11 h (heure du Maroc · 10 h – 12 h à Paris) ». Appliqué une fois, à l'affichage de chaque écran (app.js), messages compris.
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const CRENEAU_RX = new RegExp(`(\\d{1,2}) (${MOIS_FR.join('|')})(?: (\\d{4}))?, (?:à )?(\\d{1,2}) h(\\d{2})?(?: – (\\d{1,2}) h)?([^()<]{0,40})\\(heure du Maroc\\)`, 'g');
export function heureClient(txt) { const tz = fuseau(); if (!txt || tz === 'Africa/Casablanca' || !String(txt).includes('(heure du Maroc)')) return txt;
  const ville = villeClient(), now = new Date(nowMs());
  return String(txt).replace(CRENEAU_RX, (all, j, mo, an, h1, mn, h2, rest) => { let y = an ? +an : now.getFullYear(); const m = MOIS_FR.indexOf(mo);
    if (!an && new Date(y, m, +j).getTime() - now.getTime() > 200 * 86400000) y -= 1;
    const at = new Date(Date.UTC(y, m, +j, +h1 - offsetMaroc(Date.UTC(y, m, +j, 12)), +(mn || 0))).toISOString(), dd = decalage(at, tz), f = (h) => `${((+h + dd) % 24 + 24) % 24} h${mn ? mn : ''}`;
    const la = dd ? `${f(h1)}${h2 ? ` – ${((+h2 + dd) % 24 + 24) % 24} h` : ''} à ${ville}` : `même heure à ${ville}`;
    return all.replace('(heure du Maroc)', `(heure du Maroc · ${la})`); }); }
export function heureLa(atIso, tz = fuseau()) { try { return new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(atIso)).replace(':00', ' h').replace(':', ' h '); } catch { return ''; } }
// Décalage (en heures) entre le Maroc et un fuseau, à une date donnée.
// Vague 16 : le Maroc vit à UTC+1, sauf pendant le ramadan (UTC+0). Les navigateurs ne s'accordent pas sur ce fuseau :
// les périodes sont écrites ici (dates de la base officielle des fuseaux, à 3 h et 2 h, heure du Maroc).
const RAMADAN_UTC0 = [['2026-02-15T02:00:00Z', '2026-03-22T02:00:00Z'], ['2027-02-07T02:00:00Z', '2027-03-14T02:00:00Z'], ['2028-01-23T02:00:00Z', '2028-03-05T02:00:00Z']];
export const offsetMaroc = (atIso) => { const t = new Date(atIso).getTime(); return RAMADAN_UTC0.some(([a, b]) => t >= Date.parse(a) && t < Date.parse(b)) ? 0 : 1; };
export function decalage(atIso, tz = fuseau()) { try { if (tz === 'Africa/Casablanca') return 0; const o = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hour12: false, day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(new Date(atIso)); const g = (k) => +o.find(x => x.type === k).value; const loc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24) / 36e5, utc = Math.floor(new Date(atIso).getTime() / 36e5); return loc - utc - offsetMaroc(atIso); } catch { return 0; } }
// Relevé du contrôleur : ses actes signés, et sa part (versée par son agence).
export function releve() {
  const R = TARIFS.remuneration, out = [];
  for (const p of state.projects) { const ag = agenceFor(p.city), ant = ag && (ag.antennes || []).find(v => norm(v) === norm(p.city)), base = ag ? (ant ? `départ de l'antenne de ${ant}, dans le rayon de 40 km` : `départ du siège (${ag.siege.split(',')[0]})`) : '';
  for (const s of p.steps) {
    s.reviews.forEach((rv, i) => { if (rv.by !== 'controleur') return; const cv = i > 0 && !rv.secondAvis; out.push({ pid: p.id, sid: s.id, chantier: p.name, etape: s.title, at: rv.recuAt || rv.sentAt || rv.signedAt || rv.at, signeHorsReseau: rv.sentAt ? rv.signedAt : null, acte: cv ? 'Contre-visite' : 'Visite', dh: cv ? R[contreVisiteKey(s.reviews[i - 1])] : R.visite, depl: R.deplacement, base }); });
    for (const c of s.corrections || []) if (c.levee) out.push({ pid: p.id, sid: s.id, chantier: p.name, etape: s.title, at: c.levee.at, acte: 'Correction contrôlée sur photo', dh: R.correctionPhoto, depl: 0 });
    for (const h of s.history || []) if (h.role === 'controleur' && /^Visite impossible/.test(h.text)) out.push({ pid: p.id, sid: s.id, chantier: p.name, etape: s.title, at: h.at, acte: 'Visite impossible du fait du chantier', dh: R.visiteImpossible, depl: R.deplacement, base });
  } }
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

// Vague 4 : pas de récusation de rétorsion. Une récusation ne vise jamais un avis déjà signé : tant qu'un avis Refusé ou
// avec réserves attend sa correction ou sa contre-visite, elle est bloquée ; la voie est alors le second avis.
export const recuseBlocked = (p) => p.steps.some(x => ['refusee', 'retardee', 'correction_soumise'].includes(x.status) || (x.status === 'fin_declaree' && x.mission && ['contre-visite', 'correction', 'second_avis'].includes(x.mission.reason)));

// ---------- M11 : destinataires, messages en attente, signalements ----------
// Qui reçoit un message d'une étape : les autres rôles qui ont encore accès au chantier ; le contrôleur seulement si
// l'étape a une visite (sinon il n'intervient pas dessus). Sert aux notifications et à la feuille « Dans cet échange ».
export function recipients(p, s, from) {
  return Object.keys(ROLES).filter(r => r !== from && access(p, r) === 'ok' && (r !== 'controleur' || isControlled(s)));
}
// États d'un signalement à TEEQA. « en_attente » : écrit hors ligne, pas encore parti. Le traitement lui-même n'existe pas
// dans la maquette (pas de service derrière) : il s'avance à la main depuis l'écran « Mes signalements », pour le montrer.
export const REPORT_STATES = {
  en_attente: { label: 'En attente du réseau', chip: 'saffron', icon: 'clock' },
  recu: { label: 'Reçu par TEEQA', chip: '', icon: 'shield' },
  examen: { label: "En cours d'examen", chip: 'saffron', icon: 'hourglass' },
  clos: { label: 'Clos', chip: 'success', icon: 'check' },
};
export const REPORT_FLOW = ['recu', 'examen', 'clos'];
// Vague 17 : « C'est urgent », une fois par jour et par étape pour chaque partie (REGLES.urgent).
export const urgentLibre = (s, role) => !(s && s.messages || []).some(m => m.urgent && m.role === role && nowMs() - new Date(m.at).getTime() < 24 * H);
// Le message urgent d'une autre partie, encore sans réponse du lecteur : il s'affiche en haut des échanges.
export const urgentPour = (s, role) => { const ms = (s && s.messages) || []; for (let k = ms.length - 1; k >= 0; k--) { const m = ms[k]; if (m.role === role && m.kind !== 'system') return null; if (m.urgent && m.role !== role && !m.sync) return m; } return null; };
function deliver(st, p, s, m) {   // un message part vraiment : trace, contestation, notifications
  delete m.sync;
  if (m.kind === 'prive') return;   // vague 19 (scènes, R25) : note entre le client et ses proches : ni trace publique ni notification à l'entreprise
  if (m.kind === 'contestation') { s.contest = { open: true, by: m.role, at: now(), ferr: holdPoint(p, s) && !s.coulage && !['a_venir', 'debutee', 'verrouillee'].includes(s.status) }; log(s, m.role, 'contest', 'Contestation signalée'); }
  else if (m.kind === 'question') log(s, m.role, 'question', 'Demande de précision');
  const to = recipients(p, s, m.role);
  if (m.urgent) { log(s, m.role, 'urgent', 'Message signalé « C’est urgent »'); if (to.length) notify(to, `C’est urgent · ${R(m.role)} sur « ${s.title} » : « ${String(m.text || '').slice(0, 80)} »`, `#/c/${p.id}/step/${s.id}/thread`); return; }
  if (to.length) notify(to, `${R(m.role)} ${m.kind === 'contestation' ? 'conteste' : m.kind === 'question' ? 'demande une précision sur' : m.kind === 'demande_photo' ? 'demande une photo sur' : m.voice ? 'a envoyé un vocal sur' : 'a répondu sur'} « ${s.title} ».`, `#/c/${p.id}/step/${s.id}/thread`);
}
function receiveReport(st, g) { g.status = 'recu'; g.hist.push({ status: 'recu', at: now() }); notify([g.role], `Signalement ${g.ref} reçu par TEEQA.`, '#/reports'); }
function flushPending(st) {      // au retour du réseau : ce qui attendait part, dans l'ordre
  for (const n of (st.outbox || []).splice(0)) st.notifications.unshift({ ...n, at: now() });
  for (const p of st.projects) for (const s of p.steps) for (const m of s.messages) if (m.sync === 'hors_ligne') deliver(st, p, s, m);
  for (const g of st.reports || []) if (g.status === 'en_attente') receiveReport(st, g);
  flushReviews(st);
}
// Vague 7 : un avis signé sans réseau part quand le réseau revient ET que ses photos prises sur place sont envoyées.
// L'heure de signature reste celle du chantier ; l'heure d'envoi s'ajoute.
function flushReviews(st) {
  if (st.net.offline) return;
  for (const p of st.projects) for (const s of p.steps) { const rv = s.pendingReview; if (!rv || s.status !== 'fin_declaree') continue;
    const mine = s.photos.filter(ph => ph.by === 'controleur' && ph.at >= (s.mission && s.mission.acceptedAt || ''));
    if (mine.some(ph => ph.sync !== 'synchronisee' && ph.sync !== 'echec') || !mine.some(ph => ph.sync === 'synchronisee')) continue;
    delete s.pendingReview; applyReview(st, p, s, { ...rv, sentAt: now(), offline: true }); }
}

// Vague 25 (jury n° 13) : la fin prévue affichée suit les suspensions en cours (visite en retard, changement d'entreprise), au jour près.
export const joursSuspendus = (p, t = nowMs()) => p.steps.reduce((a, s) => { const m = s.mission; if (!m || s.status !== 'fin_declaree') return a; const from = m.status === 'suspendue' ? m.suspendueAt : m.lateFrom; return from ? a + Math.max(0, Math.floor((t - new Date(from).getTime()) / 864e5)) : a; }, 0);
export const finAffichee = (p) => p && p.finPrevue ? new Date(new Date(p.finPrevue).getTime() + joursSuspendus(p) * 864e5).toISOString() : null;
// ---------- Mutations ----------
// L'avis signé entre au dossier (tout de suite, ou au retour du réseau s'il a été signé sans réseau).
function applyReview(st, p, s, rv) {
  const { verdict, recheck } = rv;
  rv.recuAt = now();   // vague 12 : heure de réception par le serveur (en ligne : celle de la signature)
  s.reviews.push(rv);   // feteVue : qui a déjà vu la célébration de cet avis
  s.status = verdict; s.mission = { ...s.mission, status: 'faite', doneAt: rv.signedAt };
  // Vague 7 : contrôleur en retard : la fin prévue se décale du retard ; les délais du chantier étaient suspendus.
  if (s.mission.lateFrom && p.finPrevue) { const gap = new Date(rv.signedAt).getTime() - new Date(s.mission.lateFrom).getTime(); if (gap > 0) p.finPrevue = new Date(new Date(p.finPrevue).getTime() + gap).toISOString(); (p.suspensions || []).forEach(x => { if (x.sid === s.id && !x.to) x.to = rv.signedAt; }); }
  // Problème 2 : un nouvel avis n'efface plus un paiement. Seul un « J'attends » est remis à zéro ; une tranche indiquée reste.
  if (s.decision && s.decision.status === 'attend') s.decision = null;
  log(s, 'controleur', 'review', `Avis signé : ${avisLabel(verdict)}${s.reviews.length > 1 ? ' (ajouté à l\'historique des avis)' : ''}${rv.sentAt ? ` · signé sans réseau, envoyé au retour du réseau` : ''}`);
  if (verdict === 'validee') unlockNext(p, s);
  // Vague 9 : un avis signé ne ferme pas un désaccord ouvert : on le dit dans le fil, sans trancher.
  if (s.contest && s.contest.open) s.messages.push({ id: uid('m'), role: 'controleur', kind: 'system', text: `Avis ${avisLabel(verdict)} signé sur place. Le désaccord ouvert le reste jusqu'à son retrait ou un accord. ${REGLES.tranche}`, at: now() });
  // Vague 14 : en contre-visite, un point refusé qui n'était pas écrit au premier avis : la contre-visite suivante n'est pas facturée à l'entreprise.
  if (rv.contreVisite && verdict !== 'validee') { const nv = (rv.points || []).filter(x => ['ko', 'nv'].includes(x.state) && !(rv.portee || []).includes(x.label)).map(x => x.label); if (nv.length) { rv.nouveaux = nv; log(s, 'teeqa', 'review', `Point non écrit au premier avis (${nv.join(' ; ')}) : la prochaine contre-visite n'est pas facturée à l'entreprise ; l'agence la prend en charge`); } }
  if (verdict === 'refusee' && !rv.nouveaux) log(s, 'teeqa', 'review', "Contre-visite à la charge de l'entreprise, comme le prévoit la convention qu'elle a acceptée (art. 4) ; jamais plus que le prix d'une visite ordinaire");
  if (verdict === 'retardee' && recheck === 'visite') log(s, 'controleur', 'review', 'Réserve sur un ouvrage caché ou de structure : la correction sera contrôlée sur place');
  notify(['client', 'entreprise'], `${R('controleur')} a signé un avis ${avisLabel(verdict)} pour « ${s.title} »${verdict === 'validee' && holdPoint(p, s) ? ' (ferraillage) : avis favorable au coulage, que l’entreprise décide et déclare' : ''}.`, `#/c/${p.id}/step/${s.id}`);
}
function log(s, role, type, text, quote) { const e = { id: uid('ev'), role, type, text, at: now(), ...(quote ? { quote } : {}) }; s.history.push(e); return e; }   // vague 18 (jury, n° 10) : le texte joint se lit dans les échanges
// Problème 18 : on prévient les personnes qui ont encore accès, pas un rôle. Problème 17 : hors ligne, rien ne part ;
// l'action est gardée dans « Envois » et ses notifications partent au retour du réseau.
function audience(roles, route) {
  const m = /^#\/c\/([^/]+)/.exec(route || ''), p = m && project(m[1]);
  return p ? roles.filter(r => r === 'client' || ['ok', 'expiree'].includes(access(p, r))) : roles;
}
function notify(roles, text, route) {
  const to = audience(roles, route); if (!to.length) return;
  const n = { id: uid('n'), at: now(), roles: to, text, route, read: {} };
  if (state.net && state.net.offline) { (state.outbox = state.outbox || []).push(n); return; }
  state.notifications.unshift(n);
}
function unlockNext(p, s) { const i = p.steps.indexOf(s); const n = p.steps[i + 1]; if (n && n.status === 'verrouillee') n.status = 'a_venir'; }
const R = (role) => role === 'controleur' ? 'Le contrôleur' : role === 'teeqa' ? 'TEEQA' : ROLES[role].name.split(' ')[0];
const slug = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entreprise';
// TEEQA missionne une agence de contrôle de la zone dès que le chantier peut démarrer (entreprise acceptée, convention
// acceptée) et qu'au moins une étape a une visite. Le lien temporaire part au contrôleur ; le client ne le crée pas.
// Ce que le client voit de son contrôleur (panel du 19 nov. : « un contrôleur sans visage ») ; l'entreprise n'en voit que l'agence.
// Vague 3 : une agence nommée (nom, agrément et assurance inventés), visible du client et de l'entreprise ; la personne reste anonyme pour l'entreprise.
// Vague 5 : un réseau national d'agences partenaires (noms, agréments et polices inventés), une par grande région. L'agence
// d'un chantier dépend de sa ville ; hors des villes desservies, TEEQA missionne l'agence la plus proche, avec un délai de
// passage allongé (dit au client avant la convention). « Moulouya Contrôle » reste celle de l'Oriental (chantier d'exemple à Nador).
const AG = (id, region, nom, siege, num, police, villes, extra = [], antennes = []) => ({ id, region, agence: `${nom} · bureau de contrôle technique`, siege, antennes, carte: `CP-${num.slice(4)}-12`, otpTel: '06 •• •• •• 31', agrement: `Agrément du ministère de l’Équipement n° ${num}`, qualite: 'Ingénieur en génie civil', assurance: `RC professionnelle · police n° ${police}, renouvelée chaque année, avec garantie subséquente : une visite faite pendant la police reste couverte 10 ans après l’avis · attestation de l’année en cours`, independance: true, zone: villes, proches: extra });
export const AGENCES = [
  AG('ori', 'Oriental', 'Moulouya Contrôle', 'Selouane, province de Nador', 'BCT-ORI-0417', 'RCP 2026-08815', ['Nador', 'Selouane', 'Driouch', 'Berkane', 'Oujda', 'Zaïo', 'Taourirt', 'Guercif'], ['Figuig', 'Bouarfa', 'Jerada'], ['Oujda', 'Berkane']),
  AG('cas', 'Casablanca-Settat', 'Anfa Expertise Bâtiment', 'Casablanca, Maârif', 'BCT-CAS-0231', 'RCP 2026-03342', ['Casablanca', 'Mohammédia', 'Settat', 'El Jadida', 'Berrechid', 'Bouskoura', 'Dar Bouazza', 'Benslimane'], ['Sidi Bennour']),
  AG('rab', 'Rabat-Salé-Kénitra', 'Bouregreg Contrôle Construction', 'Rabat, Hay Riad', 'BCT-RSK-0158', 'RCP 2026-05127', ['Rabat', 'Salé', 'Témara', 'Kénitra', 'Skhirat', 'Khémisset', 'Sidi Kacem', 'Sidi Slimane'], ['Souk El Arbaa']),
  AG('mar', 'Marrakech-Safi', 'Tensift Contrôle Technique', 'Marrakech, Guéliz', 'BCT-MSA-0274', 'RCP 2026-06630', ['Marrakech', 'Safi', 'Essaouira', 'Benguerir', 'El Kelâa des Sraghna', 'Chichaoua'], ['Youssoufia']),
  AG('fes', 'Fès-Meknès', 'Saïss Bureau de Contrôle', 'Fès, route d’Imouzzer', 'BCT-FMK-0196', 'RCP 2026-04471', ['Fès', 'Meknès', 'Ifrane', 'Sefrou', 'Taza', 'El Hajeb', 'Azrou'], ['Boulemane', 'Missour']),
  AG('tan', 'Tanger-Tétouan-Al Hoceïma', 'Détroit Contrôle Bâtiment', 'Tanger, Malabata', 'BCT-TTA-0309', 'RCP 2026-07208', ['Tanger', 'Tétouan', 'Al Hoceïma', 'Larache', 'Asilah', 'Chefchaouen', 'M’diq', 'Fnideq', 'Ksar El Kébir'], ['Ouazzane']),
  AG('sou', 'Souss-Massa', 'Argana Contrôle Construction', 'Agadir, Hay Mohammadi', 'BCT-SMA-0122', 'RCP 2026-02986', ['Agadir', 'Inezgane', 'Aït Melloul', 'Taroudant', 'Tiznit', 'Biougra'], ['Guelmim', 'Sidi Ifni', 'Tata'], ['Tiznit']),
  // Vague 9 : une agence pour le Sud, avec une antenne à Dakhla : plus de visite depuis Agadir, à plus de mille kilomètres.
  AG('sud', 'Sud (Laâyoune, Dakhla, Guelmim)', 'Sakia Contrôle Bâtiment', 'Laâyoune, Hay Al Wahda', 'BCT-SUD-0051', 'RCP 2026-10477', ['Laâyoune', 'Dakhla', 'Boujdour', 'Es-Semara', 'Tan-Tan', 'Tarfaya'], ['Guelmim', 'Aousserd'], ['Dakhla']),
  AG('bmk', 'Béni Mellal-Khénifra', 'Tadla Contrôle Technique', 'Béni Mellal', 'BCT-BMK-0087', 'RCP 2026-01954', ['Béni Mellal', 'Khouribga', 'Khénifra', 'Fquih Ben Salah', 'Kasba Tadla', 'Azilal'], ['Oued Zem']),
  AG('dra', 'Drâa-Tafilalet', 'Ziz Contrôle Bâtiment', 'Errachidia', 'BCT-DTA-0064', 'RCP 2026-09310', ['Errachidia', 'Ouarzazate', 'Midelt', 'Tinghir', 'Zagora', 'Rissani', 'Erfoud'], ['Merzouga', 'Mhamid']),
];
export const VILLES = AGENCES.flatMap(a => a.zone);
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`-]/g, ' ').replace(/\s+/g, ' ').trim();
export const DELAI_HORS_ZONE = 120;   // heures : passage sous 5 jours hors des villes desservies (72 h dans la zone)
// L'agence d'une ville : celle qui la dessert, sinon la plus proche (villes rattachées), sinon celle que TEEQA désigne avant la convention.
export function agenceFor(city) {
  const c = norm(city); if (!c) return null;
  const inZone = AGENCES.find(a => a.zone.some(v => norm(v) === c));
  if (inZone) return { ...inZone, horsZone: false };
  const near = AGENCES.find(a => a.proches.some(v => norm(v) === c));
  if (near) return { ...near, horsZone: true };
  return { ...AGENCES[1], horsZone: true, aDesigner: true };
}
// Une phrase, la même partout (création, Contrôles et forfait, Invitations, Aide).
export function agenceLine(city) {
  const a = agenceFor(city);
  if (!a) return `Réseau national : ${reseauTxt()} ; chacune agréée et assurée (${AGENCES.map(x => x.region).join(', ')}). Indiquez la ville : l'agence et le délai de visite s'affichent ici.`;
  // Vague 7 : l'agence dit d'où part le contrôleur (siège ou antenne de la ville), et la visite réservée d'avance.
  const ant = (a.antennes || []).find(v => norm(v) === norm(city)), from = ant ? `son antenne de ${ant}` : `son siège (${a.siege})`;
  if (!a.horsZone) return `<b>${a.agence.split(' · ')[0]}</b> (${a.region}) contrôle les chantiers de ${city.trim()} depuis ${from} : <b>visite au plus tard 4 jours après la demande</b> (24 h pour qu'une agence accepte, puis 72 h pour passer), ou <b>le jour réservé</b> si l'entreprise annonce son ferraillage 48 h à l'avance.`;
  if (a.aDesigner) return `${city.trim()} n'est pas encore desservie : TEEQA désigne l'agence partenaire la plus proche avant la convention. <b>Visite au plus tard 6 jours après la demande</b> au lieu de 4 (24 h pour accepter, puis 5 jours pour passer), écrit dans la convention.`;
  return `${city.trim()} est hors des villes desservies : TEEQA missionne l'agence la plus proche, <b>${a.agence.split(' · ')[0]}</b> (${a.region}, siège : ${a.siege}). <b>Visite au plus tard 6 jours après la demande</b> au lieu de 4 (24 h pour accepter, puis 5 jours pour passer), écrit dans la convention.`;
}
// Vague 18 (jury, n° 15) : chaque région a un repli, dit en une phrase (relais dans la zone, sinon l'agence de la région voisine).
export const reseauTxt = () => { const sans = Object.entries(VOISINES).filter(([, v]) => !Array.isArray(v)).map(([k, v]) => [AGENCES.find(a => a.id === k), AGENCES.find(a => a.id === v)]).filter(([a, b]) => a && b);
  return `${AGENCES.length} agences partenaires principales, dont ${Object.values(VOISINES).filter(Array.isArray).length} avec une agence de relais ; ${sans.length} régions n'ont pas d'agence à elles : l'agence principale de la région voisine s'y rend, avec le délai hors zone de 6 jours (${sans.map(([a, b]) => `${a.region} : ${b.agence.split(' · ')[0]}`).join(' ; ')})`; };
export const AGENCE = AGENCES[0];
// Vague 15 : « Autre agence, sans frais » dit vers qui. Une seconde agence partenaire (nom inventé) dans le rayon de 40 km,
// sinon l'agence de la région voisine, avec le délai hors zone (6 jours).
// Vague 19 (jury n° 7) : chaque agence de relais a son propre agrément (jamais celui de l'agence principale).
const VOISINES = { ori: ['Kert Contrôle Technique', 'Nador', 'BCT-ORI-0533'], cas: ['Chaouia Contrôle Technique', 'Casablanca', 'BCT-CAS-0389'], rab: ['Mamora Bureau de Contrôle', 'Kénitra', 'BCT-RSK-0246'], mar: ['Menara Contrôle Bâtiment', 'Marrakech', 'BCT-MSA-0311'], fes: ['Zalagh Contrôle Technique', 'Meknès', 'BCT-FMK-0228'], tan: ['Spartel Expertise Construction', 'Tétouan', 'BCT-TTA-0352'], sou: ['Chtouka Contrôle Bâtiment', 'Inezgane', 'BCT-SMA-0174'], sud: 'sou', bmk: 'mar', dra: 'mar' };
export function autreAgence(p) {
  const a = agenceFor(p && p.city) || { ...AGENCE, horsZone: false }, v = VOISINES[a.id];
  if (Array.isArray(v) && !a.horsZone) return { nom: v[0], ville: v[1], rayon: true, jours: 4 };
  const b = AGENCES.find(x => x.id === (typeof v === 'string' ? v : 'cas')) || AGENCE;
  return { nom: b.agence.split(' · ')[0], ville: b.siege.split(',')[0], rayon: false, jours: 6 };
}
// Vague 18 (jury, n° 4 et 5) : un seul état de mission par chantier, et l'agence de la visite en cours (pas celle du départ si elle a changé).
export const missionEnCours = (p) => p && p.steps.find(x => x.mission && x.status === 'fin_declaree' && ['proposee', 'acceptee'].includes(x.mission.status)) || null;
// L'agrément de l'agence qui fait la visite en cours (agence de relais comprise), sinon celui de l'agence du chantier.
// Vague 24 (jury n° 2 et 19) : pendant une reprise, la visite suspendue garde son agence : un seul nom d'agence sur chaque écran.
export const missionVue = (p) => missionEnCours(p) || (p && p.steps.find(x => x.mission && x.status === 'fin_declaree' && x.mission.status === 'suspendue')) || null;
export const agrementEtape = (p, s = missionVue(p)) => { const n = s && s.mission && s.mission.agence; if (!n) return (p && p.invites.controleur && p.invites.controleur.agrement) || '';
  const v = Object.values(VOISINES).find(x => Array.isArray(x) && x[0] === n); if (v) return `Agrément du ministère de l’Équipement n° ${v[2]}`;
  const a = AGENCES.find(x => x.agence.split(' · ')[0] === n); return a ? a.agrement : ''; };
export const agenceEtape = (p, s = missionVue(p)) => ((s && s.mission && s.mission.agence) || ((p && p.invites.controleur && p.invites.controleur.agence) || 'Agence de contrôle de la zone').split(' · ')[0]);
export const autreAgenceTxt = (p) => { const x = autreAgence(p); return x.rayon ? `vers ${x.nom} (${x.ville}), autre agence partenaire de la zone : visite au plus tard ${x.jours} jours après la demande` : `aucune autre agence dans le rayon de 40 km : ${x.nom} (${x.ville}) est missionnée, visite au plus tard ${x.jours} jours après la demande (délai hors zone)`; };
export const HORS_ZONE = "Hors des villes desservies, TEEQA missionne l'agence partenaire la plus proche : la visite a lieu au plus tard 6 jours après la demande au lieu de 4, et c'est écrit dans la convention.";
export const visitDelay = (p) => p && p.horsZone ? DELAI_HORS_ZONE : DELAIS.visite;   // vague 24 : petits métiers, visite sous 6 jours (rien n'attend un coulage)
const agence = (p) => { const a = agenceFor(p && p.city) || AGENCE; const { proches, zone, id, ...rest } = a; return { ...rest, agenceId: id }; };
const plusMois = (iso, m) => { const d = new Date(iso); d.setMonth(d.getMonth() + m); return d.toISOString(); };
function assignController(p, force = false) {
  const c = p.invites.controleur;
  if (!force && (!c || c.status !== 'non_creee' || access(p, 'entreprise') !== 'ok' || !conventionOk(p) || !p.steps.some(isControlled) || (ORAL && !(p.forfait && p.forfait.paidAt)))) return;
  p.invites.controleur = { status: 'envoyee', by: 'teeqa', ...agence(p), token: Math.random().toString(36).slice(2, 6) + '-' + Math.random().toString(36).slice(2, 6), at: now(), dueAt: plus(now(), DELAIS.mission) };
  notify(['controleur'], `Mission de contrôle TEEQA : chantier « ${p.name} » (${p.city}). Ouvrez le lien pour l'accepter.`, `#/invite/${p.id}/controleur`);
  notify(['client'], `TEEQA a missionné une agence de contrôle de la zone pour « ${p.name} ».`, `#/c/${p.id}/share`);
}

export const actions = {
  setRole(role) { commit(st => { st.role = role; }); },
  // Vague 3 : un proche invité par le client, en lecture seule (avancement et avis). Il ne décide de rien et ne paie rien.
  inviteProche(pid, { name, lien = '', contact = '', lang = 'fr' }) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || !(name || '').trim()) return;
    (p.proches = p.proches || []).push({ id: uid('pr'), name: name.trim(), lien: lien.trim(), contact: contact.trim(), lang, at: now() }); }); },
  removeProche(pid, id) { commit(st => { const p = project(pid); if (p) p.proches = (p.proches || []).filter(x => x.id !== id); }); },
  // Vague 8 : le client délègue explicitement à un proche (co-décideur : paiements, écrire, photos) ou le laisse en lecture seule.
  // Vague 18 (scène 10) : empêchement du titulaire, déclaré par lui ou par un proche co-décideur (suppléant) ; levé de même.
  empecheTitulaire(pid, { motif = '', suppleantId = null } = {}) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || empecheActif(p) || String(motif).trim().length < 3) return;
    const x = (p.proches || []).find(y => y.id === suppleantId && y.role === 'codecideur') || coDecideurs(p)[0] || null;
    p.empeche = { at: now(), motif: String(motif).trim(), suppleant: x ? x.name : null, suppleantId: x ? x.id : null };
    notify(['entreprise', 'controleur'], `« ${p.name} » : titulaire empêché (le motif reste connu de TEEQA seul). ${x ? `${x.name} décide à sa place` : 'TEEQA attend le justificatif d’un proche'} ; le retard des tranches est suspendu.`, `#/c/${pid}/share`); }); },
  // Vague 25 (failles du retour du groupe) : décès du client, gérant de l'entreprise, accident, sécurité, parrainage, décennale.
  declarerDeces(pid, { lien = '' } = {}) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || p.deces || String(lien).trim().length < 3) return;
    p.deces = { at: now(), par: st.role, lien: String(lien).trim(), mandataire: null, mandataireAt: null };
    notify(['client', 'entreprise', 'controleur'], `« ${p.name} » : décès du titulaire déclaré. Délais et tranches suspendus, séquestre gelé, jusqu'à la désignation d'un mandataire par les héritiers.`, `#/c/${pid}/deces`); }); },
  mandataireHeritiers(pid, { nom = '', pays: py = '', acte = false } = {}) { commit(st => { const p = project(pid); if (!decesActif(p) || !acte || String(nom).trim().length < 3) return;
    p.deces.mandataire = String(nom).trim(); p.deces.pays = String(py).trim(); p.deces.mandataireAt = now();
    notify(['entreprise', 'controleur'], `« ${p.name} » : ${p.deces.mandataire}, mandataire des héritiers, devient titulaire. Les délais repartent, sans compter les jours de suspension.`, `#/c/${pid}/deces`); }); },
  gerantChange(pid, { mode = 'societe', nom = '' } = {}) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || !['societe', 'fin'].includes(mode) || (mode === 'societe' && String(nom).trim().length < 3)) return;
    p.gerant = { at: now(), par: st.role, mode, nom: String(nom).trim() };
    notify(['client', 'entreprise'], mode === 'societe' ? `« ${p.name} » : nouveau représentant de l'entreprise, ${p.gerant.nom}. Le contrat continue avec la société.` : `« ${p.name} » : l'entreprise s'arrête. Le client fait l'état des lieux et choisit une autre entreprise.`, `#/c/${pid}/gerant`); }); },
  signalerAccident(pid, { quoi = '', gravite = 'soins', photos = 0 } = {}) { let id = null; commit(st => { const p = project(pid); if (!p || String(quoi).trim().length < 10) return;
    const s = currentStep(p); id = uid('acc'); (p.accidents = p.accidents || []).push({ id, at: now(), par: st.role, quoi: String(quoi).trim(), gravite, photos: +photos || 0, sid: s.id });
    s.messages.push({ id: uid('m'), role: st.role, kind: 'system', text: `Accident signalé (${gravite === 'grave' ? 'grave' : gravite === 'hopital' ? 'transport à l’hôpital' : 'soins sur place'}) : ${String(quoi).trim()}${+photos ? ` · ${+photos} photo${+photos > 1 ? 's' : ''} datée${+photos > 1 ? 's' : ''}` : ''}. TEEQA date et garde ; il ne dit pas qui est responsable.`, at: now() });
    notify(['client', 'entreprise', 'controleur'], `« ${p.name} » : accident signalé sur le chantier. Daté par TEEQA, vu par tous.`, `#/c/${pid}/accident`); }); return id; },
  observationSecurite(pid, { casques = null, gardeCorps = null, echafaudage = null } = {}) { commit(st => { const p = project(pid); if (!p || st.role !== 'controleur') return;
    const s = currentStep(p), v = (x) => x === true ? 'vus' : x === false ? 'absents' : 'non vus'; (p.securite = p.securite || []).push({ at: now(), casques, gardeCorps, echafaudage, sid: s.id });
    s.messages.push({ id: uid('m'), role: 'controleur', kind: 'system', text: `Observation de sécurité (pas un avis sur l’étape) : casques ${v(casques)}, garde-corps ${v(gardeCorps)}, échafaudage ${v(echafaudage)}.`, at: now() }); }); },
  parrainer(nom = '') { let code = null; commit(st => { if (String(nom).trim().length < 2) return; code = 'TQ-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    (st.parrainages = st.parrainages || []).push({ at: now(), par: st.role, nom: String(nom).trim(), code, statut: 'envoye' }); }); return code; },
  deposerDecennale(pid, { police = '', assureur = '', jusqu = '' } = {}) { commit(st => { const p = project(pid); if (!p || st.role !== 'entreprise' || String(police).trim().length < 4 || String(assureur).trim().length < 3) return;
    p.decennale = { police: String(police).trim(), assureur: String(assureur).trim(), jusqu: jusqu || null, at: now() };
    notify(['client'], `« ${p.name} » : attestation décennale du chantier déposée (police ${p.decennale.police}, ${p.decennale.assureur}). Elle sera dans le rapport.`, `#/c/${pid}/decennale`); }); },
  // Vague 26 (scènes 11-14) : suites datées des événements graves, ouvertes aux rôles que l'écran annonce.
  suiviAccident(pid, aid, txt = '') { commit(st => { const p = project(pid), a = p && (p.accidents || []).find(x => x.id === aid); if (!a || String(txt).trim().length < 3) return;
    (a.suivi = a.suivi || []).push({ at: now(), par: st.role, txt: String(txt).trim() });
    const s = step(p, a.sid) || currentStep(p); s.messages.push({ id: uid('m'), role: st.role, kind: 'system', text: `Suivi de l’accident du ${new Date(a.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${String(txt).trim()}.`, at: now() });
    notify(['client', 'entreprise', 'controleur'].filter(x => x !== st.role), `« ${p.name} » : suivi de l’accident ajouté (${String(txt).trim()}).`, `#/c/${pid}/accident`); }); },
  arreterSuivi(pid) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || p.suiviArrete || st.role !== 'client' || access(p, 'client') !== 'ok') return;
    const faites = p.steps.filter(x => isControlled(x) && (x.reviews || []).length).length, prevues = p.steps.filter(isControlled).length;
    p.suiviArrete = { at: now(), faites, prevues, rembourse: p.forfait && p.forfait.paidAt && p.forfait.moyen !== 'carte3' ? (prevues - faites) * TARIFS.visite.dh : 0 };
    notify(['entreprise', 'controleur'], `« ${p.name} » : le client arrête le suivi TEEQA. Le dossier reste lisible et exportable ; plus aucune visite n’est programmée.`, `#/c/${pid}/rester`); }); },
  declarerLiquidation(pid, { quoi = 'liquidation judiciaire' } = {}) { commit(st => { const p = project(pid); if (!p || p.liquidation || !['client', 'controleur', 'entreprise'].includes(st.role)) return;
    p.liquidation = { at: now(), par: st.role, quoi: String(quoi).trim() || 'liquidation judiciaire' };
    notify(['client', 'entreprise', 'controleur'].filter(x => x !== st.role), `« ${p.name} » : ${ROLES.entreprise.name} déclarée en ${p.liquidation.quoi}. ${p.status === 'clos' ? 'Pour un désordre : l’assureur décennal, avec le rapport.' : 'Le chantier s’arrête : état des lieux, puis une autre entreprise.'}`, `#/c/${pid}/decennale`); }); },
  signalerDesordre(pid, { quoi = '', photos = 0 } = {}) { let id = null; commit(st => { const p = project(pid); if (!p || p.status !== 'clos' || !p.reception || String(quoi).trim().length < 10 || !['client', 'entreprise', 'controleur'].includes(st.role)) return;
    id = uid('ds'); (p.desordres = p.desordres || []).push({ id, at: now(), par: st.role, quoi: String(quoi).trim(), photos: +photos || 0 });
    notify(['client', 'entreprise'].filter(x => x !== st.role), `« ${p.name} » : désordre signalé après la réception (${String(quoi).trim().slice(0, 60)}). Daté et ajouté au dossier archivé.`, `#/c/${pid}/decennale`); }); return id; },
  finEmpeche(pid) { commit(st => { const p = project(pid); if (!empecheActif(p)) return; p.empeche.finAt = now();
    notify(['entreprise'], `« ${p.name} » : le titulaire reprend la main ; les échéances repartent, sans compter les jours d'empêchement.`, `#/c/${pid}/share`); }); },
  // Vague 18 NT (scène 5, BLOQUANT) : à l'arrêt du chantier, le client peut demander un constat neutre de tout le chantier
  // (même règle de prix : une visite, payée par lui) ; il est joint à l'état des lieux de reprise, à côté de la description de la nouvelle entreprise.
  askConstatArret(pid, note = '') { commit(st => { const p = project(pid); if (!p || !p.abandon || p.abandon.resumedAt || p.constatArret || access(p, 'client') !== 'ok' || String(note).trim().length < 10) return;
    p.constatArret = { id: uid('ct'), at: now(), note: String(note).trim(), dh: TARIFS.visite.dh, status: 'demande' };
    notify(['entreprise', 'controleur'], `« ${p.name} » : le client demande une visite de constat de l'état du chantier à l'arrêt (« ${p.constatArret.note} »). Elle décrit et date ; elle ne tranche pas.`, `#/c/${pid}/share`); }); },
  // Vague 18 (scène 8) : visite de constat demandée par le client sur une étape close (payée par lui, sans trancher).
  askConstat(pid, sid, note = '') { commit(st => { const p = project(pid), s = step(p, sid); if (!s || access(p, 'client') !== 'ok' || !doneLike(s, p) || String(note).trim().length < 10) return;
    const c = { id: uid('ct'), at: now(), note: String(note).trim(), dh: TARIFS.visite.dh, status: 'demande' }; (s.constats = s.constats || []).push(c);
    log(s, 'client', 'constat', `Visite de constat demandée par le client (payée par lui, ${dh(c.dh)}) : le contrôleur décrira sans trancher`, c.note);
    notify(['entreprise', 'controleur'], `« ${s.title} » : le client demande une visite de constat (« ${c.note} »). Elle décrit et date le désordre ; elle ne tranche pas.`, `#/c/${pid}/step/${sid}`); }); },
  setProcheDroits(pid, id, droits) { commit(st => { const p = project(pid), x = p && (p.proches || []).find(y => y.id === id); if (!x || p.status === 'clos') return;
    x.droits = Object.fromEntries(Object.keys(DROITS).map(k => [k, !!droits[k]])); x.role = Object.values(x.droits).some(Boolean) ? 'codecideur' : 'lecture'; x.delegueAt = now();
    const what = Object.keys(DROITS).filter(k => x.droits[k]).map(k => DROITS[k].toLowerCase());
    notify(['entreprise'], what.length ? `${R('client')} a délégué à ${x.name} (${x.lien || 'proche'}) : ${what.join(', ')}. Ses gestes sont signés de son nom.` : `${x.name} (${x.lien || 'proche'}) suit désormais le chantier en lecture seule.`, `#/c/${pid}/share`); }); },
  // Vague 8 : budget des travaux saisi d'après le devis (hors TEEQA).
  setBudget(pid, tranches, source = '') { commit(st => { const p = project(pid); if (!p) return; p.budget = { source: source || (p.budget && p.budget.source) || 'devis', at: now(), tranches: { ...((p.budget && p.budget.tranches) || {}), ...tranches } }; if (access(p, 'entreprise') === 'ok') notify(['entreprise'], `${R('client')} a saisi les montants des tranches de « ${p.name} » : vérifiez qu'ils sont ceux de votre devis.`, `#/c/${pid}/budget`); }); },
  // Vague 10 (jury) : l'entreprise confirme que les montants saisis par le client sont ceux de son devis.
  confirmBudget(pid) { commit(st => { const p = project(pid); if (!p || !p.budget || p.budget.entrepriseAt || access(p, 'entreprise') !== 'ok') return; p.budget.entrepriseAt = now(); notify(['client'], `${entNow(p)} confirme les montants des tranches de « ${p.name} ».`, `#/c/${pid}/budget`); }); },
  // Vague 8 : l'équipe de l'entreprise dans le fil (chef de chantier, conducteur de travaux) : elle écrit, envoie des photos, ne déclare pas.
  inviteEquipe(pid, { name, role = 'Chef de chantier', contact = '', lang = 'fr' }) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || !(name || '').trim()) return;
    (p.equipe = p.equipe || []).push({ id: uid('eq'), name: name.trim(), role, contact: contact.trim(), lang, at: now() });
    notify(['client'], `${R('entreprise')} a ajouté ${name.trim()} (${role.toLowerCase()}) aux échanges du chantier « ${p.name} ». Il écrit au nom de l'entreprise, il ne déclare pas les étapes.`, `#/c/${pid}/share`); }); },
  // ---------- Vague 10 ----------
  // Versement partiel : acompte avant l'étape 1, ou partie d'une tranche (même pendant une contre-visite). Le client paie
  // l'entreprise directement, hors TEEQA ; il indique le montant, l'entreprise confirme la réception.
  payPartial(pid, sid, { dh: montant, ref = '', by = '', acompte = false } = {}) { let id = null; commit(st => { const p = project(pid), s = step(p, sid); if (!can('client', p, s, acompte ? 'acompte' : 'partiel')) return;
    const v = Math.round(+montant || 0), deja = (s.partiels || []).reduce((a, x) => a + x.dh, 0), max = trancheDh(p, s); if (!(v > 0) || (max && deja + v >= max)) return;
    id = uid('vp'); (s.partiels = s.partiels || []).push({ id, dh: v, at: now(), ref: ref.trim(), by: by.trim(), acompte: !!acompte });
    log(s, 'client', 'decision', `${acompte ? 'Acompte de démarrage' : 'Versement partiel'} indiqué : ${dh(v)}${by.trim() ? ' (' + by.trim() + ')' : ''} · hors TEEQA`); if (by.trim()) s.history[s.history.length - 1].by = by.trim();
    notify(['entreprise'], `${by.trim() || R('client')} indique un ${acompte ? 'acompte de démarrage' : 'versement partiel'} de ${dh(v)} sur la ${trancheName(p, s).toLowerCase()}. Confirmez-le quand vous l'avez reçu.`, `#/c/${pid}/budget`); }); return id; },
  confirmPartial(pid, sid, id) { commit(st => { const p = project(pid), s = step(p, sid), x = s && (s.partiels || []).find(y => y.id === id); if (!x || x.receivedAt || access(p, 'entreprise') !== 'ok' || st.role === 'client') return;
    x.receivedAt = now(); log(s, 'entreprise', 'receipt', `${x.acompte ? 'Acompte' : 'Versement partiel'} de ${dh(x.dh)} reçu`);
    notify(['client'], `${R('entreprise')} confirme avoir reçu ${dh(x.dh)} (${x.acompte ? 'acompte' : 'versement partiel'}).`, `#/c/${pid}/budget`); }); },
  // Forfait TEEQA : payé une fois par le client, après la convention acceptée des deux côtés (carte, virement bancaire ou en agence).
  payForfait(pid, moyen = 'carte') { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || (p.forfait && p.forfait.paidAt) || !conventionOk(p)) return;
    p.forfait = { dh: forfaitDh(p.steps.filter(isControlled).length), paidAt: now(), moyen, recu: 'TQ-' + new Date(nowMs()).getFullYear() + '-' + String(Math.abs([...pid].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 100000).padStart(5, '0'), ...(['national', 'sepa', 'agence'].includes(moyen) ? { aReception: true } : {}) }; notify(['client'], `Forfait TEEQA payé pour « ${p.name} » (${dh(p.forfait.dh)}). Reçu dans Documents.`, `#/c/${pid}/controles`); if (ORAL) assignController(p); }); },
  // Rapport partagé par un lien en lecture seule (famille, banque, notaire), avec une durée ; retirable à tout moment.
  shareReport(pid, { to = 'Famille', days = 30, by = 'client', sansPaiements = false } = {}) { commit(st => { const p = project(pid); if (!p || !['client', 'entreprise'].includes(by)) return;
    (p.partages = p.partages || []).push({ id: uid('sh'), to: String(to).slice(0, 60), by, at: now(), expiresAt: plus(now(), days * 24), vues: 0, ...(sansPaiements ? { sansPaiements: true } : {}) }); }); },
  unshareReport(pid, id) { commit(st => { const p = project(pid), x = p && (p.partages || []).find(y => y.id === id); if (x && !x.revokedAt) x.revokedAt = now(); }); },
  // Plan ou PDF ajouté en cours de chantier : même nom = nouvelle version, la précédente reste au dossier.
  addPiece(pid, { title, kind = 'plan', role = 'client', note = '', file = null } = {}) { let v = 0; commit(st => { const p = project(pid); if (!p || p.status === 'clos' || !(title || '').trim() || !['client', 'entreprise'].includes(role) || access(p, role) !== 'ok') return;
    const t = title.trim(), prev = (p.pieces || []).filter(x => x.title.toLowerCase() === t.toLowerCase()); v = prev.length ? Math.max(...prev.map(x => x.version || 1)) + 1 : 1;
    // Vague 17 (jury, n° 15) : l'entreprise ne remplace pas le plan de référence d'un autre : sa version « tel que réalisé » s'ajoute à côté,
    // pour information ; le contrôleur contrôle toujours sur le plan de référence.
    const recol = role === 'entreprise' && prev.some(x => x.by !== 'entreprise');
    if (!recol) prev.forEach(x => { x.remplaceAt = x.remplaceAt || now(); });
    (p.pieces = p.pieces || []).push({ id: uid('pc'), title: t, kind, by: role, at: now(), version: v, note: [note.trim(), recol ? 'Version tel que réalisé, pour information : le contrôle se fait sur le plan de référence' : ''].filter(Boolean).join(' · '), ...(recol ? { recolement: true } : {}), file: file ? { name: file.name, size: file.size } : null });
    notify(['client', 'entreprise', 'controleur'].filter(r => r !== role && access(p, r) === 'ok'), `${R(role)} a ajouté ${v > 1 ? `la version ${v} de` : ''} « ${t} » aux documents de « ${p.name} ».${recol ? ' Le plan de référence reste celui du contrôle.' : v > 1 ? ' Le contrôleur s’appuie sur la dernière version.' : ''}`, `#/c/${pid}/documents`); }); return v; },
  // Droit de réponse de l'entreprise sortante sur l'état des lieux de reprise (7 jours).
  replyEtatDesLieux(pid, text) { commit(st => { const p = project(pid); if (!p || !p.reprise || !p.reprise.entrepriseAt || p.reprise.sortante || edlClos(p) || !(text || '').trim()) return;
    p.reprise.sortante = { text: text.trim(), at: now() }; notify(['client', 'entreprise'], `L'entreprise sortante a répondu à l'état des lieux de reprise de « ${p.name} ». Sa réponse est jointe, sans rien effacer.`, `#/c/${pid}/share`); }); },
  // Empêchement de dernière minute du contrôleur (moins de 24 h avant le créneau) : l'agence le remplace.
  empechement(pid, sid, motif = '') { commit(st => { const p = project(pid), s = step(p, sid); if (!can('controleur', p, s, 'empechement') || !motif.trim()) return;
    const fin = visitBy(s.mission), d12 = plus(now(), 12);
    s.mission = { ...s.mission, status: 'proposee', reassignedAt: now(), dueAt: d12 < fin ? d12 : fin, finalDue: fin, slot: null, acceptedAt: null, tries: (s.mission.tries || 1) + 1, urgent: true, empeche: [...(s.mission.empeche || []), { at: now(), motif: motif.trim() }] };
    log(s, 'controleur', 'mission', 'Empêchement de dernière minute du contrôleur (motif transmis à TEEQA et à son agence)');
    notify(['client', 'entreprise'], `Visite de « ${s.title} » : empêchement de dernière minute du contrôleur. ${REGLES.desist}`, `#/c/${pid}/step/${sid}`); }); },
  // Vague 8 : le contrôleur se désiste (au plus tard 24 h avant le créneau) : TEEQA confie la visite à un autre contrôleur, même échéance.
  withdrawMission(pid, sid, motif = '') { commit(st => { const p = project(pid), s = step(p, sid); if (!can('controleur', p, s, 'withdraw')) return;
    const fin = visitBy(s.mission), d12 = plus(now(), 12);
    s.mission = { ...s.mission, status: 'proposee', reassignedAt: now(), dueAt: d12 < fin ? d12 : fin, finalDue: fin, slot: null, acceptedAt: null, tries: (s.mission.tries || 1) + 1, withdrawn: [...(s.mission.withdrawn || []), { at: now(), motif: motif.trim() }] };
    log(s, 'controleur', 'mission', 'Désistement du contrôleur (motif transmis à TEEQA et à son agence)');
    notify(['client', 'entreprise'], `Visite de « ${s.title} » : le contrôleur s'est désisté. ${REGLES.desist}`, `#/c/${pid}/step/${sid}`); }); },
  // Vague 8 : tranche non payée à l'échéance : l'entreprise le signale, le client est prévenu (rien n'est tranché).
  payLate(pid, sid) { commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'payLate')) return; s.payLateAt = now();
    log(s, 'entreprise', 'receipt', `Relance de l'entreprise : paiement non reçu, ${retardJours(p, s)} jour${retardJours(p, s) > 1 ? 's' : ''} après l'échéance (hors TEEQA)`);
    notify(['client'], `${R('entreprise')} vous relance : paiement de la ${trancheName(p, s).toLowerCase()} non reçu : échéance dépassée de ${retardJours(p, s)} jour${retardJours(p, s) > 1 ? 's' : ''}. Indiquez « J'ai payé cette tranche » ou « Je préfère attendre », avec un motif.`, `#/c/${pid}/step/${sid}`); }); },
  // Vague 8 : état des lieux contradictoire à la reprise (nouvelle entreprise), avant toute nouvelle étape.
  etatDesLieux(pid, { note = '', photos = 0, role = 'entreprise' } = {}) { commit(st => { const p = project(pid); if (!p || !p.reprise) return;
    if (role === 'entreprise' && can('entreprise', p, null, 'etatDesLieux')) { p.reprise.entrepriseAt = now(); p.reprise.note = note.trim(); p.reprise.photos = photos;
      notify(['client'], `État des lieux de reprise sur « ${p.name} » : la nouvelle entreprise a décrit ce qu'elle trouve. Relisez-le et signez-le.`, `#/c/${pid}/share`); }
    else if (role === 'client' && can('client', p, null, 'etatDesLieuxClient')) { p.reprise.clientAt = now(); p.reprise.clientNote = note.trim();
      notify(['entreprise'], `${R('client')} a signé l'état des lieux de reprise de « ${p.name} ».`, `#/c/${pid}/share`); } }); },
  setLangDefault(code) { commit(st => { st.langDefault = code; st.langs = { ...(st.langs || {}), [st.role]: code }; }); },
  // Vague 3 : le contrôleur choisit son créneau de passage (avant la date limite) ; le client et l'entreprise le voient.
  pickSlot(pid, sid, slot) { commit(st => { const p = project(pid), s = step(p, sid); if (!s || !missionOk(s) || s.status !== 'fin_declaree') return; s.mission = { ...s.mission, slot };
    log(s, 'controleur', 'mission', `Créneau de visite choisi : ${slotLabel(slot)}`);
    // Vague 18 (jury, n° 25) : l'annonce « le créneau vous sera indiqué » est remplacée par celle du créneau (un seul message à jour).
    st.notifications = st.notifications.filter(n => !(n.route === `#/c/${pid}/step/${sid}` && /le créneau vous sera indiqué/.test(n.text)));
    notify(['client', 'entreprise'], `Visite de « ${s.title} » : passage prévu ${slotLabel(slot)}.`, `#/c/${pid}/step/${sid}`); }); },
  // Vague 7 : l'entreprise réserve la visite d'avance (au moins 48 h avant) ; l'agence confirme le créneau, le contrôleur passe ce jour-là.
  bookVisit(pid, sid, opt) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'book') || !opt || new Date(opt.at).getTime() < nowMs() + BOOK_MIN_H * H - 60000) return;
      const ag = (p.invites.controleur || {}).agence; s.booking = { at: opt.at, h: opt.h, bookedAt: now(), confirmedAt: now(), agence: ag ? ag.split(' · ')[0] : null };
      const w = holdPoint(p, s) ? 'ferraillage prêt prévu' : 'fin prévue';
      log(s, 'entreprise', 'booking', `Visite réservée d'avance : ${w} ${slotLabel({ at: opt.at, h: opt.h })}`);
      notify(['client', 'controleur'], `${R('entreprise')} annonce pour « ${s.title} » : ${w} ${slotLabel({ at: opt.at, h: opt.h })}. Le créneau de visite est réservé ce jour-là.`, `#/c/${pid}/step/${sid}`); });
  },
  cancelBooking(pid, sid) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'cancelBooking')) return; s.booking.cancelledAt = now(); log(s, 'entreprise', 'booking', 'Créneau de visite réservé annulé');
      notify(['client', 'controleur'], `${R('entreprise')} annule le créneau de visite réservé pour « ${s.title} ».`, `#/c/${pid}/step/${sid}`); });
  },
  // Vague 7 : recours contre un avis : second avis par une autre agence. À la charge de celui qui le demande (jamais plus
  // qu'une visite ordinaire), non facturé si le second avis annule le premier. Le premier avis reste au dossier.
  appealReview(pid, sid, role, motif = '') {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can(role, p, s, 'appeal') || (motif || '').trim().length < 10) return; const rv = lastReview(s);
      rv.appeal = { by: role, motif: motif.trim(), at: now() };
      s.contest = { open: false, by: role, at: now(), closedAt: now(), closedBy: role, issue: 'second_avis', appeal: true };
      const prev = s.mission; s.status = 'fin_declaree'; s.endDeclaredAt = now();
      s.mission = { status: 'proposee', at: now(), dueAt: plus(now(), DELAIS.mission), visitH: visitDelay(p), tries: 1, by: 'teeqa', reason: 'second_avis', autreAgence: true, billedTo: role, previous: prev ? prev.status : null };
      log(s, role, 'appeal', `Recours contre l'avis ${avisLabel(rv.verdict)} : second avis demandé à une autre agence`);
      notify(['controleur'], `Un second avis est demandé sur « ${s.title} » par une autre agence. Votre avis reste au dossier ; vous pouvez y joindre votre réponse.`, `#/c/${pid}/step/${sid}`);
      notify(['client', 'entreprise'].filter(r => r !== role), `${R(role)} demande un second avis sur « ${s.title} » : une autre agence repasse sur place. TEEQA ne tranche pas.`, `#/c/${pid}/step/${sid}`); });
  },
  // Vague 7 : le contrôleur a dépassé la date limite : nouvelle agence, contre-visite non facturée, délais du chantier suspendus.
  lateSwitch(pid, sid, role) {
    commit(st => { const p = project(pid), s = step(p, sid); if (role === 'teeqa' ? !(s && s.mission && !s.mission.lateFrom && overdue(p, s).includes('visite')) : !can(role, p, s, 'lateSwitch')) return; const from = visitBy(s.mission) || s.mission.dueAt;   // vague 15 : la date promise, la même que sur l'écran
      s.mission = { status: 'proposee', at: now(), dueAt: plus(now(), DELAIS.mission), visitH: visitDelay(p), tries: (s.mission.tries || 1) + 1, by: 'teeqa', reason: s.mission.reason || null, lateFrom: from, free: true, agence: autreAgence(p).nom };   // vague 18 (jury, n° 5) : l'agence de cette visite, affichée partout
      (p.suspensions = p.suspensions || []).push({ sid: s.id, from, motif: 'retard du contrôleur' });
      log(s, 'teeqa', 'mission', `Contrôleur en retard : autre agence missionnée, visite non facturée, délais du chantier suspendus depuis le ${new Date(from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`);
      notify(['client', 'entreprise'].filter(r => r !== role), `Visite de « ${s.title} » en retard : TEEQA missionne une autre agence. Cette visite n'est facturée à personne et les délais du chantier sont suspendus.`, `#/c/${pid}/step/${sid}`);
      notify(['controleur'], `Nouvelle mission de contrôle proposée : « ${s.title} » (${p.city}). Réponse attendue sous 24 h.`, `#/c/${pid}/step/${sid}`); });
  },
  declareStart(pid, sid, finPrevue = '') {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'declareStart')) return; const n0 = startPhotos(s).length; s.status = 'debutee'; s.startedAt = now();
      // Parcours B (26 nov., workflow P2) : date de fin prévue donnée au début (jour choisi, 18 h).
      s.finPrevue = finPrevue ? new Date(finPrevue + 'T18:00:00').toISOString() : null; s.nouvelleDate = null; s.rappelFinJ2 = null; s.retardSignale = null;
      const fp = s.finPrevue ? `, fin prévue le ${new Date(s.finPrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '';
      log(s, 'entreprise', 'start', `Début déclaré avec ${n0} photo${n0 > 1 ? 's' : ''}${fp}`);
      notify(isControlled(s) ? ['client', 'controleur'] : ['client'], `${R('entreprise')} a déclaré le début de « ${s.title} »${fp}.`, `#/c/${pid}/step/${sid}`); });
  },
  // Parcours B (26 nov., workflow P5 « Retard ») : l'entreprise propose une nouvelle date ; le client l'accepte (retour « En cours »)
  // ou la refuse (il peut alors ouvrir un désaccord). TEEQA ne tranche pas.
  proposerDate(pid, sid, date, motif = '') {
    commit(st => { const p = project(pid), s = step(p, sid); if (!p || !s || s.status !== 'debutee' || access(p, 'entreprise') !== 'ok' || !date) return;
      const d = new Date(date + 'T18:00:00').toISOString(); if (new Date(d).getTime() <= nowMs()) return;
      s.nouvelleDate = { date: d, at: now(), motif: String(motif).trim().slice(0, 160) };
      const txt = new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      log(s, 'entreprise', 'retard', `Nouvelle date de fin proposée : le ${txt}${s.nouvelleDate.motif ? ` (${s.nouvelleDate.motif})` : ''}`);
      notify(['client'], `${R('entreprise')} propose une nouvelle date de fin pour « ${s.title} » : le ${txt}. À accepter ou refuser.`, `#/c/${pid}/step/${sid}`); });
  },
  repondreDate(pid, sid, oui) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!p || !s || !s.nouvelleDate || s.nouvelleDate.reponse || access(p, 'client') !== 'ok') return;
      const txt = new Date(s.nouvelleDate.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      s.nouvelleDate.reponse = oui ? 'acceptee' : 'refusee'; s.nouvelleDate.reponduAt = now();
      if (oui) { s.finPrevue = s.nouvelleDate.date; s.rappelFinJ2 = null; s.retardSignale = null; }
      log(s, 'client', 'retard', oui ? `Nouvelle date de fin acceptée : le ${txt}` : `Nouvelle date de fin refusée (le ${txt})`);
      notify(['entreprise'], oui ? `${R('client')} accepte la nouvelle date de fin de « ${s.title} » : le ${txt}.` : `${R('client')} refuse la nouvelle date de fin de « ${s.title} ». L'étape reste en retard ; un désaccord peut être ouvert.`, `#/c/${pid}/step/${sid}`); });
  },
  declareEnd(pid, sid) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'declareEnd')) return;
      const hp = holdPoint(p, s); s.status = 'fin_declaree'; s.endDeclaredAt = now(); if (!s.firstEndAt) s.firstEndAt = s.endDeclaredAt; log(s, 'entreprise', 'end', hp ? `Ferraillage prêt · visite demandée avant coulage (${declarePhotos(s).length} photos)` : `Fin déclarée avec ${declarePhotos(s).length} photos (non vérifiée)`);
      // Mission de contrôle : TEEQA la propose à l'agence de la zone, qui a 24 h pour l'accepter (sinon une autre agence).
      if (isControlled(s)) { const again = s.reviews.length && s.reviews[s.reviews.length - 1].verdict === 'refusee';
        const bk = bookingActive(s) && nowMs() <= new Date(s.booking.at).getTime() + 2 * H ? s.booking : null;
        if (bk) { bk.usedAt = now(); s.mission = { status: 'acceptee', booked: true, at: now(), acceptedAt: bk.confirmedAt || bk.bookedAt, dueAt: plus(bk.at, 9), slot: { day: 0, h: bk.h, at: bk.at }, visitH: visitDelay(p), tries: 1, by: 'teeqa', ...(again ? { reason: 'contre-visite', billedTo: cvPayeur(s) } : {}) };
          log(s, 'teeqa', 'mission', `Visite réservée d'avance : passage ${slotLabel(s.mission.slot)}`); }
        else { if (bookingActive(s)) { s.booking.missedAt = now(); s.booking.usedAt = now(); log(s, 'teeqa', 'mission', 'Créneau réservé dépassé : visite demandée dans le délai ordinaire'); }
        s.mission = { status: 'proposee', at: now(), dueAt: plus(now(), DELAIS.mission), visitH: visitDelay(p), tries: 1, by: 'teeqa', ...(again ? { reason: 'contre-visite', billedTo: cvPayeur(s) } : {}) }; }
        notify(['client', 'controleur'], hp ? `${R('entreprise')} indique que le ferraillage de « ${s.title} » est prêt. TEEQA a demandé une visite avant coulage.` : `${R('entreprise')} a déclaré la fin de « ${s.title} ». TEEQA a demandé une visite de contrôle.`, `#/c/${pid}/step/${sid}`); }
      else notify(['client'], `${R('entreprise')} a déclaré la fin de « ${s.title} ». Étape sans visite de contrôle : à consulter.`, `#/c/${pid}/step/${sid}`); });
  },
  acceptMission(pid, sid) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!missionPending(s) || access(p, 'controleur') !== 'ok') return; s.mission = { ...s.mission, status: 'acceptee', acceptedAt: now(), dueAt: visitBy(s.mission) };   // vague 5 : même échéance qu'à la demande
      log(s, 'controleur', 'mission', 'Visite de contrôle acceptée');
      notify(['client', 'entreprise'], `Un contrôleur a accepté la visite pour « ${s.title} ». Passage avant le ${new Date(s.mission.dueAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} ; le créneau vous sera indiqué.`, `#/c/${pid}/step/${sid}`); });
  },
  // Refus de mission : TEEQA la propose aussitôt à une autre agence de la zone (même chose après 24 h sans réponse).
  declineMission(pid, sid, auto = false, motif = '') {
    commit(st => { const p = project(pid), s = step(p, sid); if (!missionPending(s)) return; s.mission = { ...s.mission, reassignedAt: now(), dueAt: plus(now(), DELAIS.mission), tries: (s.mission.tries || 1) + 1, ...(motif ? { refus: [...(s.mission.refus || []), { at: now(), motif: String(motif).slice(0, 200) }] } : {}) };
      if (s.mission.tries > 3 && !s.mission.escalated) { s.mission.escalated = now(); log(s, 'teeqa', 'mission', `Trois agences sans accord (la dernière : ${auto ? 'aucune réponse sous 24 h' : 'mission refusée'}) : TEEQA choisit lui-même une autre agence et appelle le client`);
        notify(['client'], `Visite de « ${s.title} » : aucune agence n'a encore accepté. TEEQA choisit lui-même une autre agence et vous appelle sous 24 h ; le délai de visite ne change pas.`, `#/c/${pid}/step/${sid}`); notify(['entreprise'], `Visite de « ${s.title} » : TEEQA choisit lui-même une autre agence ; le délai de visite ne change pas.`, `#/c/${pid}/step/${sid}`); }
      // Vague 25 (jury n° 25) : une seule ligne par événement : refus OU silence de 24 h, jamais les deux à la même minute.
      if (!s.mission.escalated || s.mission.escalated !== s.mission.reassignedAt) log(s, auto ? 'teeqa' : 'controleur', 'mission', auto ? 'Aucune réponse sous 24 h : mission proposée à une autre agence' : `Mission refusée par l’agence${motif ? ' (motif lu par TEEQA)' : ''} : proposée à une autre agence`);
      if (!s.mission.escalated) notify(['client', 'entreprise'], `Visite de « ${s.title} » : TEEQA la propose à une autre agence de contrôle de la zone.`, `#/c/${pid}/step/${sid}`);
      notify(['controleur'], `Nouvelle mission de contrôle proposée : « ${s.title} » (${p.city}). Réponse attendue sous 24 h.`, `#/c/${pid}/step/${sid}`); });
  },
  // Le contrôleur ne peut pas passer (accès refusé, chantier fermé, intempérie) : la visite est reportée de 3 jours, tous sont prévenus.
  visitImpossible(pid, sid, motif = '', { photo = false } = {}) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('controleur', p, s, 'visitImpossible')) return;
      // Vague 22 (contrôleurs, 7 fiches) : la photo prise sur place justifie le déplacement ; elle reste au dossier, hors des photos de l'avis.
      s.mission = { ...s.mission, dueAt: plus(now(), visitDelay(p)), replans: (s.mission.replans || 0) + 1, ...(photo ? { viPhotos: [...(s.mission.viPhotos || []), { at: now(), ...(p.gps ? { pos: { ...p.gps, m: 50 } } : {}) }] } : {}) };
      log(s, 'controleur', 'mission', `Visite impossible${motif ? ' : ' + motif : ''} — reportée${photo ? ' (photo de l’accès jointe, avec son heure et sa position)' : ''}`);
      notify(['client', 'entreprise'], `Visite de « ${s.title} » reportée${motif ? ' : ' + motif : ''}. Nouveau passage sous ${p.horsZone ? '5' : '3'} jours.`, `#/c/${pid}/step/${sid}`); });
  },
  // Récusation motivée (une fois pour le client, une fois pour l'entreprise) : TEEQA missionne une autre agence.
  recuseController(pid, role, motif) {
    commit(st => { const p = project(pid); if (!can(role, p, null, 'recuse') || !(motif || '').trim()) return;
      p.recusations = { ...(p.recusations || {}), [role]: { at: now(), motif: motif.trim() } };
      p.invites.controleur.status = 'revoquee'; p.invites.controleur.revokedAt = now();
      notify(['client', 'entreprise'].filter(r => r !== role), `${R(role)} a demandé une autre agence de contrôle pour « ${p.name} » (récusation, motif transmis à TEEQA). TEEQA missionne une autre agence.`, `#/c/${pid}/share`);
      assignController(p, true); });
  },
  // Arrêt du chantier (P5) : le client le signale ; sans reprise après 21 jours sans activité, le client peut changer
  // d'entreprise ou faire la réception en l'état. TEEQA ne tranche pas : il date et garde la trace.
  declareAbandon(pid, motif = '') {
    commit(st => { const p = project(pid); if (!can('client', p, null, 'abandon')) return; p.abandon = { at: now(), motif: motif.trim() };
      notify(['entreprise'], `${R('client')} signale un arrêt du chantier « ${p.name} »${motif ? ' : ' + motif : ''}. Reprenez les travaux avant le ${new Date(abandonLimite(p)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} (21 jours sans activité) : sinon, le client pourra changer d'entreprise.`, `#/c/${pid}`); });
  },
  resumeWork(pid) {
    commit(st => { const p = project(pid); if (!can('entreprise', p, null, 'resume')) return; p.abandon = { ...p.abandon, resumedAt: now() };
      notify(['client'], `${R('entreprise')} indique reprendre les travaux de « ${p.name} ».`, `#/c/${pid}`); });
  },
  // Relance (problème 10) : la personne attendue est prévenue ; la relance est notée dans l'historique.
  remind(pid, sid, what) {
    commit(st => { const p = project(pid), s = sid ? step(p, sid) : null;
      const to = { invitation: ['entreprise'], mission: ['controleur'], visite: ['controleur'], correction: ['entreprise'], paiement: ['client'], attente: ['client'], avenant: ['client', 'entreprise'], desaccord: ['client', 'entreprise', 'controleur'].filter(r => r !== st.role), abandon: ['entreprise'], retard: ['entreprise'] }[what] || [];
      const where = s ? `« ${s.title} »` : `le chantier « ${p.name} »`;
      if (what === 'invitation' && p.invites.entreprise) { p.invites.entreprise.lastRemindAt = now(); p.invites.entreprise.reminders = (p.invites.entreprise.reminders || 0) + 1; }
      if (s) { (s.relances = s.relances || {})[what] = now(); log(s, st.role, 'remind', `Relance : ${DELAI_LABEL[what] || what}`); }
      notify(to, `Relance : ${(DELAI_LABEL[what] || 'action attendue').toLowerCase()} sur ${where}.`, what === 'invitation' ? `#/invite/${pid}/entreprise` : s ? `#/c/${pid}/step/${sid}` : `#/c/${pid}`); });
  },
  // Délais tenus par l'appli : une mission sans réponse sous 24 h passe à une autre agence.
  checkDelays() {
    const late = []; for (const p of state.projects) if (p.status !== 'clos') for (const s of p.steps) if (missionPending(s) && overdue(p, s).includes('mission')) late.push([p.id, s.id]);
    late.forEach(([pid, sid]) => actions.declineMission(pid, sid, true));
    // Parcours B (26 nov., workflow P5 « Avenant ») : sans réponse, rappel à 72 h, puis l'avenant expire au bout de 5 jours ; rien ne change.
    const avs = []; for (const p of state.projects) if (p.status !== 'clos') for (const a of p.avenants || []) if (a.status === 'propose') { const age = nowMs() - new Date(a.at).getTime();
      if (age > AVENANT_EXPIRE_J * 864e5) avs.push([p, a, 'expire']); else if (age > DELAIS.avenant * H && !a.rappelAt) avs.push([p, a, 'rappel']); }
    if (avs.length) commit(() => avs.forEach(([p, a, k]) => { const to = [a.by === 'client' ? 'entreprise' : 'client'];
      if (k === 'rappel') { a.rappelAt = now(); notify(to, `Rappel : l’avenant « ${a.title} » attend votre réponse. Sans réponse, il expire le ${new Date(new Date(a.at).getTime() + AVENANT_EXPIRE_J * 864e5).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`, `#/c/${p.id}/avenants`); }
      else { a.status = 'expire'; a.expireAt = now(); notify(['client', 'entreprise'], `L’avenant « ${a.title} » a expiré sans réponse au bout de ${AVENANT_EXPIRE_J} jours. Rien ne change sur le chantier ; il peut être proposé à nouveau.`, `#/c/${p.id}/avenants`); } }));
    // Parcours B (26 nov., vague 26 n° 3) : visite pas faite 24 h après la date promise : TEEQA confie lui-même la visite à une autre agence.
    const tard = []; for (const p of state.projects) if (p.status !== 'clos') for (const s of p.steps) if (s.mission && !s.mission.lateFrom && overdue(p, s).includes('visite') && nowMs() > new Date(visitBy(s.mission)).getTime() + 24 * H) tard.push([p.id, s.id]);
    tard.forEach(([pid, sid]) => actions.lateSwitch(pid, sid, 'teeqa'));
    // Parcours B (26 nov., workflow P3) : mission sans réponse depuis 12 h : relance à l'agence (24 h : une autre agence, plus haut).
    const r12 = []; for (const p of state.projects) if (p.status !== 'clos') for (const s of p.steps) if (missionPending(s) && !s.mission.relance12 && nowMs() - new Date(s.mission.reassignedAt || s.mission.at).getTime() > 12 * H) r12.push([p, s]);
    if (r12.length) commit(() => r12.forEach(([p, s]) => { s.mission.relance12 = now(); notify(['controleur'], `Relance : la visite de « ${s.title} » (${p.city}) attend votre réponse. Sans réponse sous 12 h, elle sera proposée à une autre agence.`, `#/c/${p.id}/step/${s.id}`); }));
    // Parcours B (26 nov., workflow P5 « Client injoignable ») : étape close sans décision du client : rappel à J+3 puis J+7 ; à J+7, l'entreprise lit « En attente du client ».
    const inj = []; for (const p of state.projects) if (p.status !== 'clos' && !empecheActif(p) && !decesActif(p)) for (const s of p.steps) { const rv = lastReview(s), base = rv ? new Date(rv.signedAt || rv.at).getTime() : 0;
      if (!base || s.decision || s.sequestre || !doneLike(s, p)) continue; const j = (nowMs() - base) / 864e5, n = (s.rappelsClient || []).length; if ((j >= 3 && n === 0) || (j >= 7 && n === 1)) inj.push([p, s, n ? 7 : 3]); }
    if (inj.length) commit(() => inj.forEach(([p, s, j]) => { (s.rappelsClient = s.rappelsClient || []).push(now()); notify(['client'], `Rappel (J+${j}) : « ${s.title} » attend votre décision (J'ai payé cette tranche, ou J'attends).`, `#/c/${p.id}/step/${s.id}`);
      if (j === 7) notify(['entreprise'], `« ${s.title} » : en attente du client depuis 7 jours, malgré deux rappels de TEEQA. Vous pouvez le relancer ; s'il est empêché, un proche peut suivre à sa place.`, `#/c/${p.id}/step/${s.id}`); }));
    // Parcours B (26 nov., workflow P2) : 2 jours avant la date de fin prévue, rappel à l'entreprise ; date dépassée : « En retard », vu par les deux.
    const fins = []; for (const p of state.projects) if (p.status !== 'clos') for (const s of p.steps) if (s.status === 'debutee' && s.finPrevue) { const f = +new Date(s.finPrevue);
      if (!s.rappelFinJ2 && nowMs() >= f - 2 * 864e5 && nowMs() < f) fins.push([p, s, 'j2']); else if (!s.retardSignale && nowMs() > f) fins.push([p, s, 'retard']); }
    // Parcours B (26 nov., workflow P5 « Chantier à l'arrêt ») : 10 jours sans aucune activité sur une étape en cours : alerte au client et à l'entreprise.
    const calmes = state.projects.filter(p => p.status !== 'clos' && !p.abandon && p.steps.some(s => s.status === 'debutee')).filter(p => { const last = Math.max(0, ...p.steps.flatMap(s => [...s.history.map(h => +new Date(h.at)), ...s.photos.map(ph => +new Date(ph.at))]));
      return last && nowMs() - last > 10 * 864e5 && (!p.alerteInactif || +new Date(p.alerteInactif) < last); });
    if (calmes.length) commit(() => calmes.forEach(p => { p.alerteInactif = now(); notify(['client', 'entreprise'], `« ${p.name} » : aucune activité depuis 10 jours (ni photo, ni déclaration). Entreprise : reprenez ou dites pourquoi. Client : sans reprise, vous pourrez signaler un arrêt du chantier.`, `#/c/${p.id}/share`); }));
    if (fins.length) commit(() => fins.forEach(([p, s, k]) => { const txt = new Date(s.finPrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      if (k === 'j2') { s.rappelFinJ2 = now(); notify(['entreprise'], `Rappel : fin prévue de « ${s.title} » le ${txt}. Si elle ne tient pas, proposez une nouvelle date au client.`, `#/c/${p.id}/step/${s.id}`); }
      else { s.retardSignale = now(); log(s, 'teeqa', 'retard', `Date de fin prévue dépassée (le ${txt}) : étape en retard`); notify(['client', 'entreprise'], `« ${s.title} » est en retard : la fin était prévue le ${txt}. L'entreprise peut proposer une nouvelle date.`, `#/c/${p.id}/step/${s.id}`); } }));
    // Vague 21 (diaspora) : rappel au client 2 jours avant la date limite d'une tranche (un virement international met 2 à 4 jours ouvrés).
    const j2 = []; for (const p of state.projects) if (p.status !== 'clos') for (const s of p.steps) { const e = echeance(p, s); if (e && !s.rappelJ2 && nowMs() >= +new Date(e) - 2 * 864e5 && nowMs() < +new Date(e)) j2.push([p, s, e]); }
    if (j2.length) commit(() => j2.forEach(([p, s, e]) => { s.rappelJ2 = now(); notify(['client'], `Rappel : la ${trancheName(p, s).toLowerCase()} de « ${p.name} » est à payer au plus tard le ${new Date(e).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}. Depuis l’étranger, un virement met 2 à 4 jours ouvrés.`, `#/c/${p.id}/step/${s.id}`); }));
  },
  // Étape sans visite : le client prend connaissance de la déclaration, ce qui ouvre l'étape suivante. Rien n'est vérifié.
  ackStep(pid, sid) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('client', p, s, 'ack')) return; s.status = 'vue'; log(s, 'client', 'seen', 'Déclaration consultée par le client — étape sans visite de contrôle, non vérifiée'); unlockNext(p, s);
      notify(['entreprise'], `${R('client')} a consulté la déclaration de « ${s.title} ».`, `#/c/${pid}/step/${sid}`); });
  },
  addPhoto(pid, sid, { role, sim, dataUrl = null, correction = false, note = '' }) {
    const id = uid('ph');
    commit(st => {
      const p = project(pid), s = step(p, sid);
      const version = correction ? (s.corrections.length + 2) : 1;
      s.photos.push({ id, by: role, at: now(), sim, dataUrl, sync: 'en_attente', version, correction, perm: dataUrl ? 'navigateur' : 'appareil', caption: correction ? '' : note, ...(p.gps ? { pos: { ...p.gps, m: 50 } } : {}) });
      st.uploads.unshift({ id: uid('up'), pid, sid, photoId: id, status: st.net.offline ? 'hors_ligne' : 'en_attente', progress: 0, at: now() });
      // Problème 16 : une correction ne compte qu'une fois envoyée (voir uploadTick).
      if (correction) { s.corrections.push({ id: uid('co'), version, photoId: id, note, at: now(), pending: true }); log(s, 'entreprise', 'correction', `Photo de correction v${version} prise, en cours d'envoi`); }
      else log(s, role, 'photo', role === 'controleur' ? 'Photo prise sur place' : 'Photo de déclaration ajoutée');
    });
    return id;
  },
  uploadTick() {
    let changed = false;
    // Rien à envoyer : ne rien réécrire (sinon deux onglets ouverts s'écrasent l'un l'autre toutes les 450 ms).
    if (!state.uploads.some(u => u.status !== 'synchronisee' && u.status !== 'echec')) return false;
    commit(st => {
      for (const u of st.uploads) {
        if (u.status === 'hors_ligne' && !st.net.offline) { u.status = 'en_attente'; changed = true; }
        if (u.status === 'en_attente' && !st.net.offline) { u.status = 'envoi'; u.progress = 8; changed = true; }
        else if (u.status === 'envoi') {
          if (st.net.offline) { u.status = 'hors_ligne'; changed = true; continue; }
          u.progress = Math.min(100, u.progress + 23); changed = true;
          if (u.progress >= 60 && st.net.failNext) { u.status = 'echec'; st.net.failNext = false; }
          if (u.progress >= 100) { u.status = 'synchronisee'; }
        }
        const p = project(u.pid), s = p && step(p, u.sid), ph = s && photo(s, u.photoId);
        if (ph) { ph.sync = u.status === 'envoi' ? 'envoi' : u.status; if (u.status === 'synchronisee' && !ph.sentAt) ph.sentAt = now(); }   // vague 6 : l'heure de prise reste, l'heure d'envoi s'ajoute
        const co = s && s.corrections.find(c => c.photoId === u.photoId && c.pending);
        const rv = s && s.reviews[s.reviews.length - 1];
        if (co && u.status === 'synchronisee' && s.status === 'retardee' && rv && rv.recheck === 'visite') {
          co.pending = false; co.sentAt = now(); s.status = 'fin_declaree'; s.endDeclaredAt = now();
          s.mission = { status: 'proposee', at: now(), dueAt: plus(now(), DELAIS.mission), tries: 1, by: 'teeqa', reason: 'correction' };
          co.visite = true; log(s, 'entreprise', 'correction', `Correction déclarée, photo pour information : la photo ne suffit pas, contre-visite sur place demandée (réserve de structure)`);
          notify(['controleur'], `Contre-visite à faire sur place : « ${s.title} » (${p.city}). Réponse attendue sous 24 h.`, `#/c/${u.pid}/step/${u.sid}`);
          notify(['client'], `${R('entreprise')} a corrigé « ${s.title} ». Un contrôleur repasse sur place pour le vérifier.`, `#/c/${u.pid}/step/${u.sid}`);
        } else if (co && u.status === 'synchronisee' && s.status === 'retardee') {
          co.pending = false; co.sentAt = now(); s.status = 'correction_soumise';
          log(s, 'entreprise', 'correction', `Correction v${co.version} envoyée, à contrôler sur photo par le contrôleur`);
          notify(['client', 'controleur'], `${R('entreprise')} a envoyé une correction (v${co.version}) sur « ${s.title} ». Le contrôleur la contrôle sur photo.`, `#/c/${u.pid}/step/${u.sid}`);
        }
      }
      flushReviews(st);
    }, { silent: true });
    return changed;
  },
  retryUpload(id) { commit(st => { const u = st.uploads.find(x => x.id === id); if (u) { u.status = 'en_attente'; u.progress = 0; } }); },
  setNet(patch) { commit(st => { Object.assign(st.net, patch); if (!st.net.offline) flushPending(st); }); },
  clearSynced() { commit(st => { st.uploads = st.uploads.filter(u => u.status !== 'synchronisee'); }); },
  signReview(pid, sid, { verdict, motif, pieces, signature, points = [], recheck = 'photo', mesures = '', otp = null, pv = null }) {
    commit(st => {
      const p = project(pid), s = step(p, sid); if (!can('controleur', p, s, 'review')) return;
      if (verdict === 'validee' && valideInterdit(points)) return;   // vague 17 : REGLES.nonVu
      if (!motifOk(verdict, motif)) return;
      // Parcours A (26 nov.) · P6 : à la visite de réception, le contrôleur rédige le procès-verbal (réserves) ; le client le signera.
      if (pv && s === p.steps[p.steps.length - 1]) p.pvControleur = { reserves: String(pv.reserves || '').trim().slice(0, 600), at: now(), sid };   // vague 14 : motif facultatif seulement sur Validé   // « Sans objet » n'empêche pas Validé   // Validé exige tous les points vus et conformes
      for (const q of s.messages) if (q.req && q.req.pour === 'controleur' && q.req.status === 'ouverte') { q.req.status = 'faite'; q.req.doneAt = now(); }   // vague 19 : photo demandée au contrôleur, jointe à l'avis
      // Vague 7 : une réserve de structure ou d'ouvrage caché se contrôle toujours sur place (règle du store, pas un choix).
      const rc = verdict === 'retardee' ? (reserveSurPlace(p, s, points) ? 'visite' : recheck) : null;
      const ag = p.invites.controleur || {};
      const rv = { id: uid('rv'), verdict, motif, pieces, points, recheck: rc, ...(mesures.trim() ? { mesures: mesures.trim() } : {}), by: 'controleur', at: now(), signature, signedAt: now(), feteVue: {}, ...(s.mission && s.mission.slot ? { slotAt: s.mission.slot.at } : {}),   // vague 9 : le créneau de la visite, pour la chronologie
       
        // Vague 7 : signataire identifié : code à usage unique reçu sur le téléphone enregistré par l'agence, carte professionnelle délivrée par l'agence, cosignature de l'agence.
        signataire: { otp: !!otp, otpAt: now(), carte: ag.carte || null, agence: (ag.agence || '').split(' · ')[0] || null },
        ...(enContreVisite(s) ? { contreVisite: true, portee: pointsRevus(s) } : {}) };
      delete st.drafts[`review:${pid}:${sid}`];
      // Vague 7 : sans réseau, l'avis signé attend sur le téléphone, avec son heure de signature ; il part au retour du réseau.
      if (st.net.offline) { s.pendingReview = rv; return; }
      applyReview(st, p, s, rv);
    });
  },
  // Problème 5 : le contrôleur vérifie la correction sur la photo, à distance. Deux corrections refusées : l'étape passe en Refusé.
  verifyCorrection(pid, sid, okay, note = '') {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('controleur', p, s, 'verifyCorrection')) return;
      const co = s.corrections[s.corrections.length - 1]; co.verdict = okay ? 'ok' : 'ko'; co.checkedAt = now(); co.checkNote = note;
      // Vague 3 : une correction acceptée devient une « levée de réserves » horodatée et signée par le contrôleur.
      if (okay) { const rv = lastReview(s); co.levee = { at: now(), by: 'controleur', signature: (rv && rv.signature) || null, version: co.version, note };
        s.status = 'corrigee'; log(s, 'controleur', 'levee', `Levée des réserves signée : correction v${co.version} contrôlée sur photo, conforme`); unlockNext(p, s);
        notify(['client', 'entreprise'], `${R('controleur')} a signé la levée des réserves de « ${s.title} » (correction contrôlée sur photo). L'étape suivante est ouverte.`, `#/c/${pid}/step/${sid}`); return; }
      const ko = s.corrections.filter(c => c.verdict === 'ko').length;
      if (ko >= MAX_CORRECTIONS) { s.status = 'refusee'; log(s, 'controleur', 'correction', `${ko} corrections insuffisantes : l'étape passe en Refusé, contre-visite à la charge de l'entreprise`);
        notify(['client', 'entreprise'], `« ${s.title} » : ${ko} corrections insuffisantes. L'étape passe en Refusé ; l'entreprise reprend les travaux et une contre-visite aura lieu.`, `#/c/${pid}/step/${sid}`); }
      else { s.status = 'retardee'; log(s, 'controleur', 'correction', `Correction v${co.version} insuffisante${note ? ' : ' + note : ''}`);
        notify(['client', 'entreprise'], `${R('controleur')} juge la correction de « ${s.title} » insuffisante. Une dernière correction est possible.`, `#/c/${pid}/step/${sid}`); }
    });
  },
  // Le client demande une visite sur place plutôt qu'une vérification sur photo (problème 15 : vraie nouvelle mission).
  askVisit(pid, sid, why = 'client') {
    commit(st => { const p = project(pid), s = step(p, sid); if (why === 'client' ? !can('client', p, s, 'askVisit') : !canReopen(p, s)) return;
      const prev = s.mission; s.status = 'fin_declaree'; s.endDeclaredAt = now();
      s.mission = { status: 'proposee', at: now(), dueAt: plus(now(), DELAIS.mission), tries: 1, by: 'teeqa', reason: why, previous: prev ? prev.status : null };
      log(s, why === 'client' ? 'client' : st.role, 'ask', why === 'second_avis' ? 'Second avis demandé : nouvelle visite de contrôle' : 'Nouvelle visite de contrôle demandée par le client');
      notify(['controleur'], `Nouvelle mission de contrôle : « ${s.title} » (${p.city}). Réponse attendue sous 24 h.`, `#/c/${pid}/step/${sid}`);
      notify(['client', 'entreprise'].filter(r => r !== st.role), `Une nouvelle visite de contrôle est demandée pour « ${s.title} ».`, `#/c/${pid}/step/${sid}`); });
  },
  // 19 nov. : chaque message garde sa langue d'origine (celle de son auteur), et peut être un vocal (transcription dans
  // text), une réponse rapide (quick), une photo demandée (req) ou la photo qui y répond (pic, replyTo). by : qui, dans l'équipe.
  sendMessage(pid, sid, { role, kind, text, photo = false, lang = null, by = null, voice = null, quick = null, req = null, pic = null, replyTo = null, urgent = false }) {
    let id = null;
    if (kind === 'contestation' && String(text || '').trim().length < 10) return null;   // vague 14 : pas de contestation sans motif
    commit(st => {
      const p = project(pid), s = step(p, sid);
      // M11 : hors ligne, le message est gardé sur l'appareil ; rien n'est tracé ni notifié tant qu'il n'est pas parti.
      const m = { id: id = uid('m'), role, kind, text, at: now(), readBy: {}, lang: lang || langOf(role), ...(photo ? { photo: true } : {}), ...(by ? { by } : {}), ...(voice ? { voice } : {}), ...(quick ? { quick } : {}), ...(req ? { req } : {}), ...(urgent && urgentLibre(s, role) ? { urgent: true } : {}), ...(pic ? { pic } : {}), ...(replyTo ? { replyTo } : {}) };
      // Vague 26 (scène 7) : la consigne d'un proche attend l'accord du titulaire avant d'être suivie.
      if (kind === 'consigne' && role === 'client' && by && !String(by).startsWith(ROLES.client.name)) m.attente = { titulaire: ROLES.client.name, at: now() };
      s.messages.push(m);
      if (st.net.offline) m.sync = 'hors_ligne'; else deliver(st, p, s, m);
    });
    return id;
  },
  confirmerConsigne(pid, sid, mid, ok = true) { commit(st => { const p = project(pid), s = step(p, sid), m = s && s.messages.find(x => x.id === mid); if (!m || !m.attente || m.attente.reponse || st.role !== 'client') return;
    m.attente.reponse = ok ? 'confirmee' : 'refusee'; m.attente.repAt = now();
    log(s, 'client', 'consigne', ok ? `Consigne de ${m.by} confirmée par ${ROLES.client.name}, titulaire` : `Consigne de ${m.by} non retenue par ${ROLES.client.name}, titulaire : l’entreprise suit sa dernière consigne`);
    notify(['entreprise'], ok ? `« ${p.name} » : ${ROLES.client.name} confirme la consigne de ${m.by}. Vous pouvez la suivre.` : `« ${p.name} » : ${ROLES.client.name} ne retient pas la consigne de ${m.by}. Suivez sa dernière consigne.`, `#/c/${pid}/step/${sid}/thread`); }); },
  // Vague 26 (scènes 6, 8, 9, 10) : retard « sans faute » déclaré et daté (réseau, livraison, absence) ; il dit ce qu'il suspend ou non.
  declarerRetard(pid, sid, { cause = 'livraison', jusqu = '' } = {}) { let ok = false; commit(st => { const p = project(pid), s = step(p, sid); if (!p || !s || p.status === 'clos' || !['client', 'entreprise', 'controleur'].includes(st.role) || !jusqu) return;
    const lib = { livraison: 'retard de livraison', reseau: 'sans réseau sur le chantier', absence: 'absence, retour promis', meteo: 'intempéries' }[cause] || 'retard', fin = new Date(jusqu + 'T18:00:00').toISOString();
    (s.retards = s.retards || []).push({ at: now(), par: st.role, cause, jusqu: fin }); ok = true;
    s.messages.push({ id: uid('m'), role: st.role, kind: 'system', retard: true, text: `Retard déclaré par ${st.role === 'client' ? 'le client' : st.role === 'entreprise' ? 'l’entreprise' : 'le contrôleur'} : ${lib}, jusqu’au ${new Date(fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}. Daté par TEEQA. Il ne suspend ni les délais ni les échéances (seul un retard de l’agence de contrôle les suspend) ; il reste écrit au dossier, et la fin prévue ne bouge que par avenant.`, at: now() });
    notify(['client', 'entreprise', 'controleur'].filter(x => x !== st.role), `« ${p.name} » : retard déclaré (${lib}) jusqu’au ${new Date(fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`, `#/c/${pid}/step/${sid}/thread`); }); return ok; },
  // Vague 17 : corriger la traduction d'un message (l'original ne change pas ; la correction est signée et datée).
  fixTranslation(pid, sid, mid, { role, L, text }) { const t = String(text || '').trim(); if (t.length < 2) return false;
    commit(st => { const p = project(pid), s = step(p, sid), m = s && s.messages.find(x => x.id === mid); if (!m || m.role === role) return;
      (m.trFix = m.trFix || {})[L] = { text: t, by: role, at: now(), ...(nomPartie(p, role) !== who(role) ? { byName: nomPartie(p, role) } : {}) }; /* vague 18 (jury, n° 20) */ const ev = log(s, role, 'traduction', 'Traduction d’un message corrigée (l’original reste visible)'); if (nomPartie(p, role) !== who(role)) ev.by = nomPartie(p, role); /* vague 21 (jury n° 14) : signée du nom de l'entreprise reprenante */ }); return true; },
  // Photo demandée : le client ou le contrôleur demande une photo précise (« l'angle nord ») ; l'entreprise y répond directement.
  // Vague 10 : une photo précise, avec une échéance (en heures) : « à envoyer avant le … ».
  // Vague 19 (scènes, NON TRAITÉ R30) : le client peut adresser la photo précise au contrôleur, à prendre pendant sa visite ;
  // elle s'affiche alors sur sa fiche de mission (pas d'échéance : c'est le jour de la visite).
  requestPhoto(pid, sid, { role, what, lang = null, dueH = 0, pour = 'entreprise' }) {
    const w = String(what || '').trim(); if (!w) return null;
    if (pour === 'controleur') return actions.sendMessage(pid, sid, { role, kind: 'demande_photo', text: `Photo demandée au contrôleur, à prendre pendant sa visite : ${w}`, lang: lang || 'fr', req: { what: w, status: 'ouverte', pour: 'controleur' } });
    return actions.sendMessage(pid, sid, { role, kind: 'demande_photo', text: `Envoyez une photo de ${w}`, lang: lang || 'fr', req: { what: w, status: 'ouverte', ...(dueH ? { dueAt: plus(now(), dueH) } : {}) } });
  },
  answerPhotoRequest(pid, sid, mid, { role = 'entreprise', sim = null, dataUrl = null, by = null } = {}) {
    const s0 = step(project(pid), sid), q = s0 && s0.messages.find(m => m.id === mid);
    if (!q || !q.req || q.req.status !== 'ouverte' || role !== 'entreprise' || q.req.pour === 'controleur') return null;
    const i = project(pid).steps.indexOf(s0);
    const id = actions.sendMessage(pid, sid, { role, kind: 'reponse', text: `Photo demandée : ${q.req.what}`, lang: 'fr', by, replyTo: mid, pic: { sim: sim || { step: i, variant: 2 }, dataUrl, at: now() } });
    commit(() => { const m = step(project(pid), sid).messages.find(x => x.id === mid); m.req = { ...m.req, status: 'faite', answeredAt: now(), answer: id }; });
    return id;
  },
  setLang(role, code) { commit(st => { st.langs = { ...(st.langs || {}), [role]: code }; }); },
  setProcheLang(pid, id, code) { commit(() => { const p = project(pid), x = p && (p.proches || []).find(y => y.id === id); if (x) x.lang = code; }); },
  // M11 : accusé de lecture. Ouvrir le fil marque comme lus les messages des autres (jamais ceux qui ne sont pas partis).
  markThreadRead(pid, sid, role) {
    const s = step(project(pid), sid); if (!s || !s.messages.some(m => m.role !== role && m.kind !== 'system' && m.kind !== 'prive' && !m.sync && !(m.readBy || {})[role])) return;
    commit(st => { for (const m of step(project(pid), sid).messages) if (m.role !== role && m.kind !== 'system' && !m.sync && (m.kind !== 'prive' || role === 'client')) (m.readBy = m.readBy || {})[role] = now(); }, { silent: true });
  },
  // Problème 9 : un désaccord a quatre issues. TEEQA ne tranche jamais : il garde la trace et ouvre les portes de sortie.
  //   retrait : par son auteur · accord : proposé par l'un, confirmé par l'autre · second_avis : nouvelle visite d'un contrôleur
  //   export : le dossier complet (photos, avis, échanges, historique) part vers un médiateur ou un tribunal.
  closeContest(pid, sid, role, issue = 'retrait', motif = '') {
    let reopen = false;
    commit(st => { const p = project(pid), s = step(p, sid), c = s.contest; if (!c || !c.open) return;
      const sys = (text) => s.messages.push({ id: uid('m'), role, kind: 'system', text, at: now() });
      const end = (text) => { s.contest = { ...c, open: false, closedAt: now(), closedBy: role, issue }; appliquerRetenue(p, s); sys(text); log(s, role, 'contest-end', text); notify(['client', 'entreprise', 'controleur'].filter(r => r !== role), `« ${s.title} » : ${text.toLowerCase()}`, `#/c/${pid}/step/${sid}/thread`); };
      if (issue === 'retrait') { if (c.by !== role) return; end(`Désaccord retiré par son auteur${motif.trim() ? ` : « ${motif.trim().slice(0, 160)} »` : ''}.`); if (motif.trim()) s.contest.motifRetrait = motif.trim().slice(0, 160); }
      else if (issue === 'accord') {
        if (!c.accordBy) { s.contest = { ...c, accordBy: role, accordAt: now() }; sys(`${R(role)} propose de clore : accord trouvé. En attente de confirmation.`); notify([c.by === role ? (role === 'client' ? 'entreprise' : 'client') : c.by], `${R(role)} propose de clore le désaccord sur « ${s.title} » : accord trouvé.`, `#/c/${pid}/step/${sid}/thread`); }
        else if (c.accordBy !== role) end('Accord trouvé entre les parties : désaccord clos.');
      }
      else if (issue === 'second_avis') { if (!can(role, p, s, 'secondAvis')) return; end("Second avis demandé : un contrôleur repasse sur place. TEEQA ne tranche pas."); reopen = true;
        if (lastReview(s)) notify(['controleur'], `Un second avis est demandé sur « ${s.title} ». Votre avis reste au dossier ; vous pouvez y joindre votre réponse.`, `#/c/${pid}/step/${sid}`); }
      else if (issue === 'export') end('Dossier exporté (photos, avis signés, échanges, historique) pour un médiateur ou un tribunal. TEEQA ne tranche pas.');
    });
    if (reopen) actions.askVisit(pid, sid, 'second_avis');
  },
  decide(pid, sid, status, { proof = null, motif = '', ref = '', payer = '', by = '', moyen = '', transit = false } = {}) {
    // Vague 11 : différer un paiement exige un motif (5 caractères au moins), lu par l'entreprise.
    if (status === 'attend' && String(motif || '').trim().length < 5) return false;
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('client', p, s, 'decide')) return; s.decision = { status, at: now(), ...(proof ? { proof, proofAt: now() } : {}), ...(status === 'attend' ? { motif: motif.trim(), until: plus(now(), DELAIS.attente) } : {}), ...(ref.trim() ? { ref: ref.trim().slice(0, 40) } : {}), ...(payer.trim() ? { payer: payer.trim().slice(0, 60) } : {}), ...(transit && status === 'indique' ? { transit: true } : {}), ...(by ? { by } : {}), ...(MOYENS[moyen] ? { moyen } : {}), ...(trancheDh(p, s) ? { dh: trancheDh(p, s) } : {}) };
      log(s, 'client', 'decision', status === 'indique' ? `« J'ai payé cette tranche » (paiement hors TEEQA, non vérifié)${proof ? ', justificatif photo joint' : ''}` : `Le client préfère attendre avant de payer${motif.trim() ? ' : ' + motif.trim() : ''} (7 jours, puis relance possible)`);
      // Vague 22 (jury n° 5) : une relance de paiement devenue sans objet (« J'ai payé cette tranche » indiqué) ne reste pas dans les nouvelles du client.
      if (status === 'indique') st.notifications.forEach(n => { if (n.route === `#/c/${pid}/step/${sid}` && /vous relance/.test(n.text)) n.roles = (n.roles || []).filter(x => x !== 'client'); });
      if (by.trim()) s.history[s.history.length - 1].by = by.trim();   // vague 9 : le fil dit qui l'a indiqué (proche co-décideur)
      if (status === 'indique') notify(['entreprise'], `${by.trim() ? `${by.trim()}, pour ${R('client')},` : R('client')} indique : « J'ai payé cette tranche » pour la ${trancheName(p, s).toLowerCase()}${trancheDh(p, s) ? ` (${dh(trancheDh(p, s))} selon le devis)` : ''}${s.decision.payer ? `, payée par ${s.decision.payer}` : ''}${s.decision.moyen ? `, ${MOYENS[s.decision.moyen].toLowerCase()}` : ''}${s.decision.ref ? `, référence ${s.decision.ref}` : ''}${proof ? ', avec un justificatif photo' : ''}. Confirmez la réception.`, `#/c/${pid}/step/${sid}`);
      else notify(['entreprise'], `${R('client')} préfère attendre avant de payer la ${trancheName(p, s).toLowerCase()}${motif.trim() ? ' : « ' + motif.trim() + ' »' : ''}. Sans nouvelle sous 7 jours, vous pourrez le relancer.`, `#/c/${pid}/step/${sid}`); });
  },
  // Vague 18 NT (scène 6) : une déclaration de paiement faite trop tôt ou par erreur se retire tant que l'entreprise ne l'a pas
  // confirmée. Rien ne s'efface : la ligne reste au fil, datée, avec le retrait. Aucun mouvement d'argent.
  corrigerPaiement(pid, sid, { motif = '' } = {}) {
    if (String(motif || '').trim().length < 5) return false; let ok = false;
    commit(st => { const p = project(pid), s = step(p, sid); if (!p || !s || access(p, 'client') !== 'ok' || p.status === 'clos' || !s.decision || s.decision.status !== 'indique' || s.decision.receivedAt || s.decision.moyen === 'sequestre') return;
      (s.decisionsRetirees = s.decisionsRetirees || []).push({ ...s.decision, retireeAt: now(), motif: motif.trim() }); s.decision = null; ok = true;
      log(s, 'client', 'decision', `Déclaration « J'ai payé cette tranche » retirée par le client avant confirmation : ${motif.trim()}`);
      notify(['entreprise'], `${R('client')} retire sa déclaration de paiement pour la ${trancheName(p, s).toLowerCase()} (« ${motif.trim()} ») ; la tranche reste à payer.`, `#/c/${pid}/step/${sid}`); });
    return ok;
  },
  // Vague 4 : l'entreprise déclare le coulage (photo jointe) après l'avis sur le ferraillage ; le paiement peut alors être recommandé.
  // Vague 12 : un coulage se déclare avec 2 photos au moins (vue d'ensemble et détail), jamais pendant un désaccord ouvert.
  declareCoulage(pid, sid, { photos = COULAGE_PHOTOS } = {}) {
    if (photos < COULAGE_PHOTOS) return false;
    commit(st => { const p = project(pid), s = step(p, sid); if (!coulageDue(p, s) || contestBloque(s) || nowMs() < reviewTime(lastReview(s))) return;
      const ids = Array.from({ length: photos }, (_, k) => { const id = uid('ph'); s.photos.push({ id, by: 'entreprise', at: now(), sentAt: now(), sim: { step: p.steps.indexOf(s) % 6, variant: k % 2 }, sync: 'synchronisee', version: 1, caption: k ? 'Coulage terminé · détail' : 'Coulage terminé · vue d’ensemble', ...(p.gps ? { pos: { ...p.gps, m: 50 } } : {}) }); return id; });
      // Vague 23 (jury n° 13) : le bon de livraison de la centrale est photographié au coulage ; il reste au dossier et le contrôleur de l'étape suivante le relit.
      const bonId = uid('ph'); s.photos.push({ id: bonId, by: 'entreprise', at: now(), sentAt: now(), sim: { step: p.steps.indexOf(s) % 6, variant: 2 }, sync: 'synchronisee', version: 1, caption: 'Bon de livraison du béton (classe, heure de départ)', doc: 'bon', ...(p.gps ? { pos: { ...p.gps, m: 50 } } : {}) });
      s.coulage = { at: now(), photoId: ids[0], photoIds: ids, bonId }; if (s.contest && s.contest.open) appliquerRetenue(p, s);
      // Vague 16 : un désaccord ouvert avant le ferraillage prêt (sur le début déclaré) se clôt au coulage, sans décision :
      // l'avis signé depuis a remplacé la déclaration contestée. Il reste dans l'historique et l'export.
      if (s.contest && s.contest.open && !s.contest.ferr && lastReview(s) && T(lastReview(s).signedAt || lastReview(s).at) > T(s.contest.at)) { const txt = `Désaccord du ${new Date(s.contest.at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} clos au coulage, sans décision : il portait sur une déclaration remplacée depuis par l'avis du contrôleur.`; s.contest = { ...s.contest, open: false, closedAt: now(), closedBy: 'teeqa', issue: 'perime' }; s.messages.push({ id: uid('m'), role: 'teeqa', kind: 'system', text: txt, at: now() }); log(s, 'teeqa', 'contest-end', txt); } log(s, 'entreprise', 'coulage', `Coulage déclaré avec ${photos} photos`);
      notify(['client', 'controleur'], `${R('entreprise')} a déclaré le coulage de « ${s.title} », ${photos} photos et le bon de livraison du béton joints. Étape close : le paiement de la tranche est recommandé.`, `#/c/${pid}/step/${sid}`); });
    return true;
  },
  // Vague 4 : observation de l'entreprise sur un avis (texte, photo facultative), jointe au dossier et visible du client.
  observeReview(pid, sid, { text, photo = false }) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'observe') || (text || '').trim().length < 10) return;
      lastReview(s).observation = { text: text.trim(), photo: !!photo, at: now() }; log(s, 'entreprise', 'observation', "Observation de l'entreprise jointe à l'avis", text.trim());
      notify(['client', 'controleur'], `${R('entreprise')} a joint une observation à l'avis sur « ${s.title} ».`, `#/c/${pid}/step/${sid}`); });
  },
  // Vague 4 : droit de réponse du contrôleur, joint à son avis et au dossier.
  answerContest(pid, sid, text) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('controleur', p, s, 'droitReponse') || (text || '').trim().length < 10) return;
      lastReview(s).reponse = { text: text.trim(), at: now() }; log(s, 'controleur', 'reponse', "Droit de réponse du contrôleur joint à l'avis", text.trim());
      notify(['client', 'entreprise'], `Le contrôleur a répondu à la contestation de son avis sur « ${s.title} ».`, `#/c/${pid}/step/${sid}`); });
  },
  // 20 nov. : séquestre facultatif. Le client le choisit (à la création ou dans Budget) ; l'entreprise l'accepte (avec la convention,
  // ou d'un geste s'il est choisi après). Chaque tranche versée sur le compte reste à la banque jusqu'à la règle de REGLES.sequestre.
  choisirSequestre(pid) { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || p.sequestre || st.role !== 'client') return;
    p.sequestre = { banque: SEQUESTRE.banque, compte: 'SQ-' + Math.random().toString(36).slice(2, 8).toUpperCase(), choisiAt: now(), entrepriseAt: null };
    if (access(p, 'entreprise') === 'ok') notify(['entreprise'], `${R('client')} propose un séquestre chez ${SEQUESTRE.banque} pour « ${p.name} » : chaque tranche sera sur un compte de la banque avant de vous être versée. À accepter dans Budget.`, `#/c/${pid}/budget`); }); },
  accepterSequestre(pid) { commit(st => { const p = project(pid); if (!p || !p.sequestre || p.sequestre.entrepriseAt || access(p, 'entreprise') !== 'ok' || p.status === 'clos') return; p.sequestre.entrepriseAt = now();
    /* vague 19 (jury n° 10) : la proposition « à accepter » ne reste pas affichée sous le séquestre accepté */
    for (const n of st.notifications) if (n.route === `#/c/${pid}/budget` && /propose un séquestre/.test(n.text) && /À accepter dans Budget/.test(n.text)) n.text = n.text.replace('À accepter dans Budget.', `Accepté le ${jourMois(now())}.`);
    notify(['client'], `${R('entreprise')} a accepté le séquestre chez ${SEQUESTRE.banque} pour « ${p.name} ». Vous pouvez y verser vos tranches.`, `#/c/${pid}/budget`); }); },
  deposerSequestre(pid, sid) { commit(st => { const p = project(pid), s = step(p, sid); if (!seqActif(p) || !s || s.decision || s.sequestre || (s.partiels || []).length || !trancheDh(p, s) || p.status === 'clos' || echeance(p, s) || doneLike(s, p)) return;
    s.sequestre = { at: now(), dh: trancheDh(p, s) }; log(s, 'client', 'decision', `Tranche versée sur le compte de séquestre de ${SEQUESTRE.banque} (${dh(s.sequestre.dh)}), reçue par la banque`);
    notify(['entreprise'], `La ${trancheName(p, s).toLowerCase()} (${dh(s.sequestre.dh)}) est sur le compte de séquestre de ${SEQUESTRE.banque} : après l’avis favorable, la banque vous la verse quand le client confirme, ou d’office 5 jours après l’échéance s’il ne s’y oppose pas (TEEQA ne garantit pas le paiement).`, `#/c/${pid}/step/${sid}`); }); },
  verserSequestre(pid, sid) { commit(st => { const p = project(pid), s = step(p, sid); if (decesActif(p) || !seqSurCompte(s) || st.role !== 'client' || !doneLike(s, p) || p.status === 'clos') return; verserSeq(p, s, 'client'); }); },
  opposerSequestre(pid, sid, motif = '') { if (String(motif).trim().length < 10) return false;
    commit(st => { const p = project(pid), s = step(p, sid); if (!seqSurCompte(s) || s.sequestre.opposition || st.role !== 'client') return; s.sequestre.opposition = { at: now(), motif: motif.trim() };
      log(s, 'client', 'decision', `Opposition au versement par la banque : l'argent reste sur le compte de séquestre`, motif.trim());
      notify(['entreprise'], `${R('client')} s'oppose au versement de la ${trancheName(p, s).toLowerCase()} par ${SEQUESTRE.banque} : « ${motif.trim()} ». L'argent reste sur le compte ; TEEQA ne tranche pas.`, `#/c/${pid}/step/${sid}`); }); return true; },
  // Vague 23 (jury n° 7 et 8) : restitution du séquestre, déclenchée par le client (ordre écrit à la banque), quand le chantier
  // s'arrête ou change d'entreprise. La banque rend l'argent au client ; TEEQA transmet seulement l'ordre.
  restituerSequestre(pid) { commit(st => { const p = project(pid); if (decesActif(p) || !p || !p.sequestre || p.sequestre.restitution || st.role !== 'client' || !seqSolde(p) || !(p.reprise || (p.abandon && !p.abandon.resumedAt))) return;
    p.sequestre.restitution = { at: now(), dh: seqSolde(p), finReclamation: plus(now(), 8 * 24) };
    notify(['client', 'entreprise'], `${R('client')} demande à ${SEQUESTRE.banque} la restitution du compte de séquestre (${dh(p.sequestre.restitution.dh)}). Une tranche d'étape terminée peut être réclamée par écrit jusqu'au ${jourMois(p.sequestre.restitution.finReclamation)} ; le reste revient au client. TEEQA ne touche pas l'argent.`, `#/c/${pid}/budget`); }); },
  confirmPayment(pid, sid) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'confirmPayment')) return; s.decision.receivedAt = now();
      log(s, 'entreprise', 'receipt', "Paiement reçu indiqué par l'entreprise (hors TEEQA, non vérifié) : tranche soldée");
      notify(['client'], `${R('entreprise')} indique avoir reçu le paiement de la ${trancheName(p, s).toLowerCase()}. Elle est soldée.`, `#/c/${pid}/step/${sid}`); });
  },
  // Vague 7 : l'entreprise indique qu'un paiement annoncé n'est pas arrivé ; le client est prévenu. TEEQA ne tranche pas.
  notReceived(pid, sid) {
    commit(st => { const p = project(pid), s = step(p, sid); if (!can('entreprise', p, s, 'notReceived')) return; s.decision.notReceivedAt = now();
      log(s, 'entreprise', 'receipt', "L'entreprise indique ne pas avoir reçu ce paiement (hors TEEQA, non vérifié)");
      notify(['client'], `${R('entreprise')} indique ne pas avoir reçu le paiement de la ${trancheName(p, s).toLowerCase()}. Vérifiez ensemble le justificatif.`, `#/c/${pid}/step/${sid}`); });
  },
  // M11 : un signalement a une référence, un état et un historique ; son auteur reçoit un accusé. Il n'est visible que de lui.
  addReport({ role, reason, text, route }) {
    const id = uid('sg');
    commit(st => {
      const ref = 'SG-' + Math.random().toString(36).slice(2, 6).toUpperCase(), m = /^#\/c\/([^/]+)(?:\/step\/([^/]+))?/.exec(route || '');
      const g = { id, ref, role, reason, text, route, pid: m ? m[1] : null, sid: m ? m[2] || null : null, at: now(), status: 'en_attente', hist: [{ status: 'en_attente', at: now() }] };
      (st.reports = st.reports || []).unshift(g);
      if (!st.net.offline) { g.hist = []; receiveReport(st, g); }
      // Vague 18 NT (scène 9) : un faux contrôleur ou une demande d'argent prévient tout le chantier, avec un message fixe.
      if (FAUX_RX.test(reason || '')) { const p = (st.projects || []).find(x => x.id === g.pid) || (st.projects || []).find(x => x.status !== 'clos');
        if (p) notify(['client', 'entreprise', 'controleur'].filter(r => r !== role), `Alerte sur « ${p.name} » : ${REGLES.arnaque}`, `#/c/${p.id}/share`); }
    });
    return id;
  },
  // Fait avancer le traitement d'un cran (reçu → en cours d'examen → clos). L'auteur est prévenu à chaque fois.
  advanceReport(id) { commit(st => { const g = (st.reports || []).find(x => x.id === id); if (!g) return; const i = REPORT_FLOW.indexOf(g.status); if (i < 0 || i >= REPORT_FLOW.length - 1) return;
    g.status = REPORT_FLOW[i + 1]; g.hist.push({ status: g.status, at: now() });
    notify([g.role], g.status === 'examen' ? `Signalement ${g.ref} : en cours d'examen par TEEQA.` : `Signalement ${g.ref} clos par TEEQA.`, '#/reports'); }); },
  undoDecision(pid, sid) { commit(st => { const p = project(pid), s = step(p, sid); if (!can('client', p, s, 'undoDecision')) return; s.decision = null; log(s, 'client', 'decision', 'Indication de paiement retirée (avant sa réception par l\'entreprise)'); }); },
  // ---------- Invitations ----------
  // Problème 6 : c'est TEEQA qui missionne une agence de contrôle de la zone et crée son lien ; le client ne le crée pas.
  createControllerLink(pid) { commit(st => { const p = project(pid); assignController(p, true); }); },
  // Le client peut demander un autre contrôleur : l'accès actuel est retiré, TEEQA en missionne un autre.
  requestOtherController(pid) { commit(st => { const p = project(pid); if (!p || p.status === 'clos') return; if (p.invites.controleur && p.invites.controleur.status !== 'non_creee') { p.invites.controleur.status = 'revoquee'; p.invites.controleur.revokedAt = now(); }
    notify(['client'], `TEEQA missionne une autre agence de contrôle pour « ${p.name} ».`, `#/c/${pid}/share`); assignController(p, true); }); },
  revokeController(pid) { commit(st => { const p = project(pid); p.invites.controleur.status = 'revoquee'; p.invites.controleur.revokedAt = now();
    notify(['controleur'], `L'accès temporaire au chantier « ${p.name} » a été retiré.`, `#/invite/${pid}/controleur`); }); },
  // M06 : le client peut encore changer le nombre de visites tant qu'aucune étape n'a commencé.
  setControls(pid, n) { commit(st => { const p = project(pid); if (!p || p.steps.some(x => x.status !== 'a_venir' && x.status !== 'verrouillee')) return;
    const k = n === 0 ? 0 : Math.max(Math.min(MIN_VISITS, p.steps.length), Math.min(p.steps.length, n)), idx = controlledIndexes(p.steps.length, k); p.controls = k; p.steps.forEach((x, i) => { x.controlled = idx.has(i); });
    notify(['entreprise'], k ? `Le client a choisi ${k} visite${k > 1 ? 's' : ''} de contrôle pour « ${p.name} ».` : `Le client a choisi la formule Suivi, sans visite de contrôle, pour « ${p.name} ».`, `#/c/${pid}/controles`); }); },
  // Problème 13 : l'entreprise n'accepte la convention qu'après avoir accepté l'invitation (ordre E1 → E2 → E3).
  acceptConvention(pid, role) { commit(st => { const p = project(pid); if (!can(role, p, null, 'acceptConvention')) return;
    p.convention[role] = now(); if (role === 'entreprise' && p.sequestre && !p.sequestre.entrepriseAt) p.sequestre.entrepriseAt = now(); const other = role === 'client' ? 'entreprise' : 'client';
    if (p.convention[other]) { notify(['client', 'entreprise'], `Convention acceptée par le client et l'entreprise : les travaux de « ${p.name} » peuvent débuter.`, `#/c/${pid}/convention`); assignController(p);
      for (const s of p.steps) if (s.mission && s.mission.status === 'suspendue') {
        // Vague 24 (jury n° 1 et 2, 8 personas) : l'agence qui avait accepté la visite la garde ; un seul état : « acceptée, créneau à choisir ».
        if (s.mission.avant === 'acceptee') { s.mission = { status: 'acceptee', at: s.mission.at || now(), acceptedAt: now(), dueAt: plus(now(), visitDelay(p)), visitH: visitDelay(p), tries: 1, by: 'teeqa', reason: s.mission.reason || null, agence: s.mission.agence, agrement: s.mission.agrement, reprise: true };
          log(s, 'teeqa', 'mission', `Visite reprise après le changement d’entreprise : ${s.mission.agence || 'l’agence'} l’avait acceptée et la garde ; nouveau créneau à choisir, délai neuf de 4 jours`); continue; }
        s.mission = { status: 'proposee', at: now(), dueAt: plus(now(), DELAIS.mission), visitH: visitDelay(p), tries: 1, by: 'teeqa', reason: s.mission.reason || null, agence: s.mission.agence };
        log(s, 'teeqa', 'mission', 'Visite reprise après le changement d’entreprise : proposée à l’agence, délai neuf de 4 jours'); } }
    else notify([other], `${R(role)} a accepté la convention du chantier « ${p.name} ». Il reste votre acceptation.`, `#/c/${pid}/convention`); }); },
  acceptInvite(pid, role) { commit(st => { const p = project(pid), inv = p.invites[role]; if (!inv || inv.status !== 'envoyee') return; inv.status = 'acceptee'; inv.acceptedAt = now();
    if (role === 'entreprise') { const a = st.account; inv.proId = inv.proId || (a && a.role === 'entreprise' && a.name ? slug(a.name) : 'rachid'); if (a && a.role === 'entreprise') inv.by = myKey(); }
    const conf = role === 'entreprise' && p.prep && !p.prep.confirmedAt; if (conf) p.prep.confirmedAt = now();
    notify(['client'], role === 'controleur' ? `Le contrôleur missionné par TEEQA a ouvert son accès au chantier « ${p.name} ».` : `${R(role)} a accepté l'invitation au chantier « ${p.name} »${conf ? ' et confirmé les étapes' : ''}.`, `#/c/${pid}/share`);
    if (role === 'entreprise') assignController(p); }); },
  // Vague 6 : l'entreprise invitée peut demander au client de revoir le découpage des étapes avant d'accepter (lui seul les modifie).
  requestStepChange(pid) { commit(st => { const p = project(pid); if (!p || !p.invites.entreprise || p.invites.entreprise.status !== 'envoyee') return; p.invites.entreprise.stepsAsk = now();
    notify(['client'], `L'entreprise invitée sur « ${p.name} » demande à revoir le découpage des étapes avant d'accepter. Vous seul pouvez les modifier.`, `#/c/${pid}/share`); }); },
  // Problème 14 : l'entreprise peut refuser ; le client peut relancer (remind 'invitation') ou inviter une autre entreprise.
  declineInvite(pid, why = '') { commit(st => { const p = project(pid), inv = p.invites.entreprise; if (!inv || inv.status !== 'envoyee') return; inv.status = 'refusee'; inv.refusedAt = now(); inv.why = why;
    notify(['client'], `L'entreprise invitée a refusé le chantier « ${p.name} »${why ? ' : ' + why : ''}. Vous pouvez inviter une autre entreprise.`, `#/c/${pid}/share`); }); },
  // Changement d'entreprise (P5) : l'ancienne perd l'accès, la nouvelle reçoit l'invitation et doit accepter la convention.
  // Vague 20 : inviter son entreprise après coup, par WhatsApp, SMS, e-mail ou lien copié ; le nom et le contact sont facultatifs.
  inviteEntreprise(pid, { name = '', contact = '', canal = 'lien' } = {}) { commit(st => { const p = project(pid); if (!p || p.status === 'clos') return; const old = p.invites.entreprise || {};
    if (old.status === 'acceptee') return; const c = String(contact || '').trim();
    p.invites.entreprise = { ...old, status: 'envoyee', name: String(name || '').trim() || old.name || '', ...(c ? (/@/.test(c) ? { email: c } : { phone: c }) : {}), canal, at: old.status === 'envoyee' ? old.at : now(), ...(old.status === 'envoyee' ? { lastRemindAt: now() } : {}) };
    notify(['entreprise'], `Invitation reçue : chantier « ${p.name} » (${p.city}).`, `#/invite/${pid}/entreprise`); }); },
  changeEntreprise(pid, email, nom = '') { commit(st => { const p = project(pid); if (!p || p.status === 'clos' || !email) return; const old = p.invites.entreprise;
    const aTravaille = !!(old && old.status === 'acceptee');
    if (aTravaille) { old.status = 'revoquee'; old.revokedAt = now(); }
    // Parcours A (26 nov.) : une entreprise qui a refusé (ou jamais répondu) n'a rien fait sur le chantier : elle n'est pas
    // une « entreprise sortante » (pas de reprise, pas d'état des lieux, pas de nom repris) ; on garde seulement la trace de l'invitation.
    if (aTravaille) p.formerPros = [...(p.formerPros || []), old]; else if (old && old.status !== 'non_creee') p.formerInvites = [...(p.formerInvites || []), old];
    p.invites.entreprise = { status: 'envoyee', ...(/@/.test(email) ? { email } : { phone: email }), ...(String(nom || '').trim() ? { name: String(nom).trim() } : {}), at: now() };
    if (aTravaille && !old.name) old.name = ROLES.entreprise.name;   // vague 23 (jury n° 1) : l'entreprise sortante garde son nom au dossier
    // Vague 8 : si des travaux ont commencé, la nouvelle entreprise fait un état des lieux de reprise avant tout nouveau début.
    if (p.steps.some(x => x.startedAt)) p.reprise = { from: old ? (old.email || old.proId || '') : '', at: now() };
    // Vague 11 : les montants restants viennent de l'ancien devis tant que l'entreprise reprenante n'a pas confirmé les siens.
    if (p.budget) { p.budget.source = `${p.budget.source} · reste à faire à confirmer par ${String(nom || '').trim() || 'l\'entreprise reprenante'} (son devis)`; p.budget.entrepriseAt = null; }
    if (p.equipe && p.equipe.length) { p.formerEquipe = [...(p.formerEquipe || []), ...p.equipe]; p.equipe = []; }   // l'équipe de l'entreprise sortante quitte les échanges
    if (p.convention) p.convention = { ...p.convention, entreprise: null, v: (p.convention.v || 1) + 1 };
    // Vague 21 (jury n° 16) : un avenant proposé par l'entreprise sortante et pas encore accepté tombe ; la reprenante le repropose si elle le veut.
    for (const av of p.avenants || []) if (av.status === 'propose' && av.by === 'entreprise') { av.status = 'caduc'; av.caducAt = now(); }
    // Vague 19 (jury n° 13 et 15) : une visite en attente est suspendue pendant la reprise (plus de promesse de 4 jours qui court
    // sans entreprise sur le chantier) ; elle repart avec un délai neuf quand l'entreprise reprenante a accepté la convention.
    for (const s of p.steps) if (s.status === 'fin_declaree' && s.mission && ['proposee', 'acceptee'].includes(s.mission.status)) { s.mission = { ...s.mission, status: 'suspendue', suspendueAt: now(), avant: s.mission.status };
      // Vague 25 (jury n° 6, 26) : le créneau déjà choisi est dit annulé, et les photos demandées à l'entreprise sortante tombent avec elle.
      const cr = s.mission.slot ? ` Le créneau du ${new Date(s.mission.slot.at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} est annulé.` : '';
      if (s.mission.slot) { s.mission.slotAnnule = s.mission.slot; delete s.mission.slot; }
      log(s, 'client', 'mission', `Visite suspendue : changement d'entreprise.${cr} Elle reprend, avec un délai neuf de 4 jours, dès que l'entreprise reprenante a accepté la convention ; rien n'est facturé pour l'attente, et la promesse des 4 jours repart de ce jour-là`); }
    for (const s of p.steps) for (const m of s.messages || []) if (m.kind === 'demande_photo' && m.req && m.req.status === 'ouverte') { m.req.status = 'caduque'; m.req.caduqueAt = now(); log(s, 'client', 'message', `Photo demandée à l'entreprise sortante : demande close au changement d'entreprise (la reprenante n'a pas à l'envoyer)`); }
    for (const s of p.steps) if (s.status === 'debutee') log(s, 'client', 'pro', "Changement d'entreprise : l'étape reprendra avec la nouvelle entreprise");
    // Vague 7 : l'entreprise sortante garde ses preuves : TEEQA lui remet le dossier de ce qu'elle a fait (photos, déclarations, avis, échanges).
    if (old && old.status === 'revoquee') old.dossierRemisAt = now();
    notify(['entreprise'], `Invitation reçue : chantier « ${p.name} » (${p.city})${p.reprise ? ', reprise en cours de travaux' : ''}.`, `#/invite/${pid}/entreprise`); }); },
  // ---------- Avenants (problème 20) : travaux en plus, proposés par l'un, acceptés par l'autre ----------
  // Vague 10 : un avenant porte son montant (ajouté au budget à l'acceptation) et peut demander une visite de contrôle.
  proposeAvenant(pid, role, { title, note = '', controlled = false, dh: montant = 0 }) { commit(st => { const p = project(pid); if (!can(role, p, null, 'avenant') || !title.trim()) return;
    // Vague 17 (jury, n° 14) : un avenant de structure (béton armé, radier, fondations…) garde toujours sa visite, au point d'arrêt avant coulage.
    const structure = avenantStructure(title, note); if (structure) controlled = true;
    (p.avenants = p.avenants || []).push({ id: uid('av'), title: title.trim(), note, controlled, structure, dh: Math.max(0, Math.round(+montant || 0)), by: role, at: now(), status: 'propose' });
    notify([role === 'client' ? 'entreprise' : 'client'], `${R(role)} propose un avenant sur « ${p.name} » : ${title.trim()}.`, `#/c/${pid}/avenants`); }); },
  answerAvenant(pid, id, role, yes) { commit(st => { const p = project(pid), a = (p.avenants || []).find(x => x.id === id); if (!a || a.status !== 'propose' || a.by === role || !can(role, p, null, 'avenant')) return;
    a.status = yes ? 'accepte' : 'refuse'; a.answeredAt = now();
    // Vague 7 : l'étape ajoutée se place AVANT la dernière étape (visite de réception), qui reste la dernière ; sinon à la fin.
    if (yes) { const n = p.steps.length, last = p.steps[n - 1], s = { ...makeStep(a.title, n), id: 's' + (n + 1) + '-' + id.slice(-3), controlled: !!a.controlled || !!a.structure, avenant: a.id, ...(a.structure ? { structure: true } : {}) };
      const before = n > 1 && ['verrouillee', 'a_venir'].includes(last.status), prev = before ? p.steps[n - 2] : last;
      s.status = doneLike(prev) ? 'a_venir' : 'verrouillee';
      if (before) { p.steps.splice(n - 1, 0, s); if (last.status === 'a_venir') last.status = 'verrouillee'; } else p.steps.push(s); a.sid = s.id;
      if (a.dh && p.budget) p.budget.tranches = { ...(p.budget.tranches || {}), [s.id]: a.dh }; }
    notify([a.by], `${R(role)} a ${yes ? 'accepté' : 'refusé'} l'avenant « ${a.title} »${yes ? ' : une étape est ajoutée au chemin' : ''}.`, `#/c/${pid}/avenants`); }); },
  // prep (M02, 11 nov.) : préparation du chantier depuis le devis. { type, address, quote: { name, size } | null }.
  // Le devis est seulement joint (nom et taille gardés) : rien n'est lu dans le fichier. Les étapes sont proposées d'après
  // le type de chantier, ajustées par le client, puis confirmées par l'entreprise quand elle accepte l'invitation.
  createProject({ name, city, steps, email, controls, prep = null }) {
    const id = 'ch-' + Math.random().toString(36).slice(2, 7);
    commit(st => {
      const a = st.account, owner = a && a.role === 'client' ? (a.email || a.name) : SEED_OWNER;
      const ag = agenceFor(city); st.projects.unshift({ id, owner, avenants: [], name, city, region: ag && !ag.horsZone ? ag.region : '', horsZone: !!(ag && ag.horsZone), finPrevue: plus(now(), 24 * 30 * Math.max(6, steps.length * 2)), status: 'actif', createdAt: now(), closedAt: null, controls: controls === 0 ? 0 : controls || steps.length, rating: null,
        convention: prep ? { v: 1, client: null, entreprise: null } : null,
        prep: prep ? { type: prep.type || 'neuf', address: prep.address || '', proprietaire: prep.proprietaire || '', quote: prep.quote ? { ...prep.quote, at: now() } : null, confirmedAt: null } : null,
        // Vague 20 (doigt : Youssef, Omar) : sans contact d'entreprise, rien n'est « envoyé » : l'invitation se fait ensuite (WhatsApp, lien, SMS).
        invites: { entreprise: email ? { status: 'envoyee', ...(/@/.test(email) ? { email } : { phone: email }), at: now() } : { status: 'non_creee' }, controleur: { status: 'non_creee' } },
        steps: (() => { const idx = controlledIndexes(steps.length, controls); return steps.map(makeStep).map((s, i) => ({ ...s, controlled: idx.has(i) })); })() });
      if (email) notify(['entreprise'], `Invitation reçue : chantier « ${name} » (${city}).`, `#/invite/${id}/entreprise`);
      delete st.drafts.newProject;
    });
    return id;
  },
  // M10 : avis public sur l'entreprise, distinct de la note privée de clôture. Il n'existe qu'après un chantier clôturé,
  // garde sa provenance (chantier, étapes, visites), et l'entreprise peut y répondre une fois. Gardé dans `st.avis`.
  publishAvis(pid, { text, recommend }) { commit(st => { const p = project(pid); if (!p || p.status !== 'clos' || !text.trim()) return; st.avis = (st.avis || []).filter(a => a.pid !== pid);
    const pro = proIdOf(p);
    st.avis.unshift({ id: uid('av'), pid, pro, author: ROLES.client.name.split(' ')[0], city: p.city, project: p.name, steps: p.steps.length, visits: p.steps.filter(isControlled).length, text: text.trim(), recommend: !!recommend, at: now(), reply: null });
    notify(['entreprise'], `${R('client')} a publié un avis sur votre fiche après la clôture de « ${p.name} ».`, '#/pros/' + pro); }); },
  removeAvis(pid) { commit(st => { st.avis = (st.avis || []).filter(a => a.pid !== pid); }); },
  replyAvis(id, text) { commit(st => { const a = (st.avis || []).find(x => x.id === id); if (!a || a.reply || !text.trim()) return; a.reply = { text: text.trim(), at: now() };
    notify(['client'], `${R('entreprise')} a répondu à votre avis.`, '#/pros/' + a.pro); }); },
  // P6 (problèmes 8 et 19) : la clôture est la réception provisoire. Le client signe le procès-verbal, avec ou sans réserves ;
  // l'entreprise le contresigne ; la réception définitive vient à la levée des réserves (au plus tard après un an).
  // Vague 20 (audit A-Z) : tant que l'entreprise n'a pas accepté, le client corrige son chantier (nom, ville, étapes) ou l'annule.
  editProject(pid, { name, city, steps } = {}) { commit(st => { const p = project(pid); if (!p || ['acceptee'].includes((p.invites.entreprise || {}).status) || p.status !== 'actif') return;
      if (name && name.trim()) p.name = name.trim().slice(0, 40); if (city && city.trim()) p.city = city.trim().slice(0, 40);
      if (Array.isArray(steps) && steps.length >= 3) { const keep = steps.map(x => { const o = p.steps.find(y => y.id === x.id); if (o && x.title && x.title.trim()) o.title = x.title.trim().slice(0, 50); return o; }).filter(Boolean); if (keep.length >= 3) p.steps = keep; }
      if (p.invites.entreprise && p.invites.entreprise.stepsAsk) { p.invites.entreprise.stepsDone = now(); if (p.invites.entreprise.status === 'envoyee') notify(['entreprise'], `Le client a revu les étapes de « ${p.name} » : ${p.steps.length} étapes. Vous pouvez accepter l'invitation.`, `#/invite/${pid}/entreprise`); } }); },
  cancelProject(pid) { commit(st => { const p = project(pid); if (!p || (p.invites.entreprise || {}).status === 'acceptee' || p.id === 'villa-demo') return; st.projects = st.projects.filter(x => x.id !== pid); st.notifications = (st.notifications || []).filter(n => !String(n.route || '').includes(`/${pid}`)); }); },
  closeProject(pid, rating = null, pv = {}) {
    commit(st => { const p = project(pid); if (!can('client', p, null, 'close')) return; p.status = 'clos'; p.closedAt = now(); p.rating = rating;
      const pc = p.pvControleur || null;
      p.reception = { provisoireAt: now(), reserves: (pc ? pc.reserves : (pv.reserves || '')).trim(), redigeAt: pc ? pc.at : null, signature: pv.signature || null, entrepriseAt: null, definitiveAt: null, clesAt: pv.cles ? now() : null,
        parfaitJusqu: plusMois(now(), GARANTIES.parfait), decennaleJusqu: plusMois(now(), GARANTIES.decennale) };   // parcours A : mois du calendrier (avant : 730 h par mois, 3 jours de moins sur 10 ans)
      if (p.invites.controleur && p.invites.controleur.status === 'acceptee') { p.invites.controleur.status = 'expiree'; p.invites.controleur.expiredAt = now(); }
      notify(['entreprise'], `Réception provisoire de « ${p.name} » signée par le client${p.reception.reserves ? ', avec réserves' : ', sans réserve'}. Procès-verbal à contresigner.`, `#/c/${pid}/report`);
      notify(['controleur'], `Réception provisoire de « ${p.name} » signée : le chantier passe en garantie. Votre accès temporaire a pris fin ; vous gardez la lecture de vos avis.`, `#/c/${pid}/report`); });
  },
  acceptReception(pid) { commit(st => { const p = project(pid); if (!can('entreprise', p, null, 'reception')) return; p.reception.entrepriseAt = now();
    notify(['client'], `${R('entreprise')} a contresigné le procès-verbal de réception de « ${p.name} ».`, `#/c/${pid}/report`); }); },
  // Parcours A (26 nov.) · P6 : l'entreprise indique, réserve par réserve, qu'elle a levé les réserves de la réception ; le client
  // vérifie sur place (ou fait passer un contrôleur) avant de prononcer la réception définitive. TEEQA ne certifie pas la levée.
  leverReservesReception(pid, note = '') { commit(st => { const p = project(pid); if (!can('entreprise', p, null, 'leverReserves')) return; p.reception.leveeAt = now(); p.reception.leveeNote = String(note || '').trim().slice(0, 200);
    notify(['client'], `${R('entreprise')} indique avoir levé les réserves de la réception de « ${p.name} ». Vérifiez-les, puis prononcez la réception définitive.`, `#/c/${pid}/report`); }); },
  receptionDefinitive(pid) { commit(st => { const p = project(pid); if (!can('client', p, null, 'definitive')) return; p.reception.definitiveAt = now();
    notify(['client', 'entreprise'], `Réception définitive de « ${p.name} » : ${p.reception.reserves ? 'réserves levées' : 'aucune réserve'}. Chantier clos et archivé ; la garantie décennale court jusqu'au ${new Date(p.reception.decennaleJusqu).toLocaleDateString('fr-FR')}.`, `#/c/${pid}/report`); }); },
  markAllRead(role) { commit(st => { st.notifications.forEach(n => { if (n.roles.includes(role)) n.read[role] = true; }); }); },
  readNotif(id, role) { commit(st => { const n = st.notifications.find(x => x.id === id); if (n) n.read[role] = true; }); },
  setDraft(key, val) { commit(st => { st.drafts[key] = val; }, { silent: true }); },
  session(patch) { commit(st => { Object.assign(st.session, patch); }); },
  feteVue(pid, sid, role) { commit(st => { const s = step(project(pid), sid), rv = s && s.reviews[s.reviews.length - 1]; if (rv && rv.feteVue) rv.feteVue[role] = now(); }, { silent: true }); },
  setAccount(acc) { commit(st => { st.account = acc; st.role = acc.role; applyAccount(); }); },
  pref(patch) { commit(st => { Object.assign(st.prefs, patch); }); },
  // M04 : ce que l'entreprise a modifié sur sa fiche professionnelle (zone, présentation, justificatifs déposés, demande de référencement).
  setPro(patch) { commit(st => { st.pro = { ...(st.pro || {}), ...patch }; }, { silent: true }); },
  rememberRoute(r) { commit(st => { st.lastRoute = r; }, { silent: true }); },
};
