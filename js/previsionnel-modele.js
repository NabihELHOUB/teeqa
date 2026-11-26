// Prévisionnel TEEQA 2027-2029 (26 nov. 2026) : les hypothèses et tous les calculs, sans rien d'affichage.
// La page (js/previsionnel.js) et la vérification en Node (refs/oral-1-dec/verifier-previsionnel.mjs) importent ce même fichier :
// un chiffre change ici, il change partout. Montants en dirhams (DH), hors taxes sauf mention « TTC ».
// Les prix de l'appli viennent de js/store.js (TARIFS, MARGE_DETAIL, SUIVI_DETAIL) : recopiés ici, jamais modifiés là-bas.

export const ANNEES = [2027, 2028, 2029];
export const TVA = 0.2;

// Deux grilles, une seule règle pour le client : forfait = suivi + n × visite, payé une fois par chantier.
export const GRILLES = {
  appli: { nom: "Grille de l'appli", suivi: 1500, visite: 1100 },          // js/store.js, TARIFS
  cible: { nom: 'Grille cible', suivi: 3000, visite: 2000 },               // hypothèse à valider au pilote (voir NOTES.grille)
};

export const H = {
  // Volumes : hypothèses de l'équipe (diapo 12), inchangées.
  chantiers: [10, 40, 100],
  // Grille appliquée chaque année (scénario central : pilote au prix de l'appli, grille cible ensuite).
  grilleParAn: ['appli', 'cible', 'cible'],
  // Panier : part des chantiers en Suivi contrôlé, et visites moyennes par chantier contrôlé.
  partControle: [0.8, 0.7, 0.7],
  visitesMoy: 5,
  // Ce que TEEQA paie à l'agence par visite (appli : 700 DH ; seule donnée réelle : 1 500 MAD la demi-journée).
  agenceVisite: 700,
  // Coûts directs (annexe de l'appli, MARGE_DETAIL et SUIVI_DETAIL), hors temps humain, compté dans les salaires.
  coutParVisite: 30 + 25 + 30 + 27,     // horodatage + assurance + visites non facturées + appli = 112
  coutParChantier: 120 + 100,           // hébergement des pièces + assurance = 220
  fraisPaiement: 0.01,                  // 1 % du forfait TTC (60 DH sur 5 900 DH dans l'appli)
  // Contre-visites payées par l'entreprise (appli : 950 ou 600 DH TTC ; 600 ou 380 DH à l'agence).
  contreVisitesParChantier: 0.4,
  contreVisitePrixTTC: (950 + 600) / 2,
  contreVisiteAgence: (600 + 380) / 2,
  // Commission de la banque du séquestre, par compte ouvert, payée par la banque.
  sequestreTaux: [0, 0.2, 0.3],          // part des chantiers contrôlés qui ouvrent un séquestre
  sequestreCommission: 1000,
  // Option « Visibilité » de l'entreprise référencée, payée par l'entreprise, à son choix.
  entreprisesParChantier: 0.6,
  visibiliteTaux: [0, 0.15, 0.25],
  visibilitePrixAn: 3000,
  // Assurance (décennale, tous risques chantier) par un courtier partenaire.
  assuranceTaux: [0, 0, 0.1],
  assuranceCommission: 500,
  // Équipe, coût employeur annuel (salaire + charges).
  equipe: [
    [{ poste: 'Coordinateur terrain à Nador, à mi-temps', cout: 60000 }],
    [{ poste: "Coordinateur terrain de l'Oriental, à temps plein", cout: 120000 }, { poste: 'Un fondateur salarié (produit et opérations)', cout: 144000 }],
    [{ poste: "Coordinateur terrain de l'Oriental, à temps plein", cout: 120000 }, { poste: 'Un fondateur salarié (produit et opérations)', cout: 144000 },
     { poste: 'Un 2e fondateur salarié (entreprises, banque, assurance)', cout: 144000 }, { poste: 'Conseiller client bilingue, 7 j/7', cout: 96000 }],
  ],
  // Frais généraux : hébergement et outils, comptable, avocat, déplacements (hors assurance, comptée par chantier).
  fraisGeneraux: [70000, 90000, 110000],
  // Mise en production de l'appli (2027), amortie sur 3 ans.
  investissement: 100000,
  // Acquisition : coût par chantier payant selon le canal, et part de chaque canal.
  cac: { pub: 1800, entreprise: 400, parrainage: 700 + 112 },
  mixCanaux: [{ pub: 0.6, entreprise: 0.3, parrainage: 0.1 }, { pub: 0.5, entreprise: 0.35, parrainage: 0.15 }, { pub: 0.4, entreprise: 0.4, parrainage: 0.2 }],
  marketingFixe: [15000, 30000, 50000],
  // Entonnoir : contact qualifié → chantier ouvert dans l'appli → forfait payé.
  tauxOuverture: 0.4,
  tauxAchat: 0.4,
};

// Marché : ordre de grandeur calculé à partir des sources de la diapo 4 (pas une mesure).
export const MARCHE = { transferts: 122e9, partInvestissement: 0.10, partConstruction: 0.166, coutChantier: 1000000 };
export const marcheChantiers = (m = MARCHE) => (m.transferts * m.partInvestissement * m.partConstruction) / m.coutChantier;

const ht = (ttc) => ttc / (1 + TVA);
const somme = (o) => Object.values(o).reduce((a, b) => a + b, 0);

// Marge d'un chantier pour une grille et un coût d'agence (v visites ; v = 0 : formule Suivi).
export function margeChantier(g, v, agence = H.agenceVisite, h = H) {
  const forfaitTTC = g.suivi + v * g.visite;
  const ca = ht(forfaitTTC);
  const agences = v * agence;
  const autres = h.coutParChantier + v * h.coutParVisite + h.fraisPaiement * forfaitTTC;
  return { forfaitTTC, ca, agences, autres, marge: ca - agences - autres };
}
export const margeVisite = (g, agence = H.agenceVisite, h = H) => ht(g.visite) - agence - h.coutParVisite - h.fraisPaiement * g.visite;

// Une année : tout ce qui dépend du nombre de chantiers n (pour le point mort, n varie à structure de coûts égale).
function annee(i, n, h, grille, agence) {
  const g = GRILLES[grille || h.grilleParAn[i]];
  const nc = n * h.partControle[i], ns = n - nc, v = h.visitesMoy;
  const fC = g.suivi + v * g.visite, fS = g.suivi;
  const cv = nc * h.contreVisitesParChantier;
  const ca = {
    suivi: ns * ht(fS),
    controle: nc * ht(fC),
    contreVisites: cv * ht(h.contreVisitePrixTTC),
    banque: nc * h.sequestreTaux[i] * h.sequestreCommission,
    visibilite: n * h.entreprisesParChantier * h.visibiliteTaux[i] * h.visibilitePrixAn,
    assurance: n * h.assuranceTaux[i] * h.assuranceCommission,
  };
  const coutVisites = nc * v * agence + cv * h.contreVisiteAgence;
  const autresDirects = n * h.coutParChantier + (nc * v + cv) * h.coutParVisite + h.fraisPaiement * (ns * fS + nc * fC + cv * h.contreVisitePrixTTC);
  const caTotal = somme(ca);
  const margeBrute = caTotal - coutVisites - autresDirects;
  const salaires = h.equipe[i].reduce((a, p) => a + p.cout, 0);
  const cacMoyen = Object.entries(h.mixCanaux[i]).reduce((a, [k, p]) => a + p * h.cac[k], 0);
  const marketing = n * cacMoyen + h.marketingFixe[i];
  const amortissement = h.investissement / 3;
  const resultat = margeBrute - salaires - marketing - h.fraisGeneraux[i] - amortissement;
  return { an: ANNEES[i], grille: g.nom, n, nc, ns, ca, caTotal, coutVisites, autresDirects, margeBrute, salaires, cacMoyen, marketing,
    fraisGeneraux: h.fraisGeneraux[i], amortissement, resultat, encaisseTTC: ns * fS + nc * fC };
}

// Point mort d'une année : nombre de chantiers par an qui annule le résultat, à équipe et frais de cette année.
export function pointMort(i, h = H, grille, agence = h.agenceVisite) {
  const a0 = annee(i, 0, h, grille, agence), a1 = annee(i, 1, h, grille, agence);
  const parChantier = a1.resultat - a0.resultat;            // marge brute − acquisition, par chantier
  return parChantier > 0 ? Math.ceil(-a0.resultat / parChantier) : Infinity;
}

export function calcule(h = H, { grille, agence = h.agenceVisite, volume = 1 } = {}) {
  let treso = -h.investissement, creux = treso;               // l'investissement est payé début 2027
  const rows = ANNEES.map((_, i) => {
    const r = annee(i, Math.round(h.chantiers[i] * volume), h, grille, agence);
    treso += r.resultat + r.amortissement;                  // l'amortissement ne sort pas de la caisse
    creux = Math.min(creux, treso);
    return { ...r, treso, pointMort: pointMort(i, h, grille, agence), parChantier: (r.margeBrute - r.marketing + h.marketingFixe[i]) / (r.n || 1) };
  });
  const funnel = rows.map((r) => ({ an: r.an, payants: r.n, ouverts: Math.ceil(r.n / h.tauxAchat), contacts: Math.ceil(r.n / h.tauxAchat / h.tauxOuverture) }));
  return { rows, besoin: Math.max(0, -creux), funnel, marche: marcheChantiers() };
}

// Sensibilité au prix payé à l'agence : 700 DH (appli) ou 1 500 DH (seule donnée réelle), pour chaque grille.
export function sensibilite(h = H) {
  const out = [];
  for (const gk of ['appli', 'cible']) for (const agence of [700, 1500]) {
    const g = GRILLES[gk], c = calcule(h, { grille: gk, agence });
    out.push({ grille: g.nom, agence, margeVisite: margeVisite(g, agence, h), margeChantier4: margeChantier(g, 4, agence, h).marge,
      margeChantier5: margeChantier(g, h.visitesMoy, agence, h).marge, resultat2029: c.rows[2].resultat, pointMort2029: c.rows[2].pointMort, besoin: c.besoin });
  }
  return out;
}
