// Prévisionnel TEEQA 2027-2029 (26 nov. 2026) : affichage seulement. Hypothèses et calculs : js/previsionnel-modele.js.
import { H, ANNEES, GRILLES, calcule, sensibilite, margeChantier, margeVisite, pointMort, marcheChantiers } from './previsionnel-modele.js';

const $ = (s) => document.querySelector(s);
const EUR = 10.74;                                   // Bank Al-Maghrib, 27 oct. 2026 (celui de la diapo)
const nb = (n) => (n < 0 ? '− ' : '') + Math.abs(Math.round(n)).toLocaleString('fr-FR');
const k = (n) => (n < 0 ? '− ' : '') + Math.abs(Math.round(n / 1000)).toLocaleString('fr-FR') + ' k';
const pm = (n) => (Number.isFinite(n) ? nb(n) : 'jamais');
const cls = (n) => (n < 0 ? ' class="neg"' : '');

const R = { grille: 'central', agence: 700, volume: 1 };

// Textes fixes de la page, écrits depuis le modèle (scénario central).
function remplir() {
  const c = calcule(H), r29 = c.rows[2], m = marcheChantiers();
  const v = {
    mcA4: nb(margeChantier(GRILLES.appli, 4).marge), mcC4: nb(margeChantier(GRILLES.cible, 4).marge),
    mvA: nb(margeVisite(GRILLES.appli)), pmA: nb(pointMort(2, H, 'appli')), pm29: nb(r29.pointMort),
    autres29: nb(r29.ca.banque + r29.ca.visibilite + r29.ca.assurance), marche: nb(Math.round(m / 100) * 100),
    part29: nb((r29.n / m) * 100), partPm: nb((r29.pointMort / m) * 100),
    besoin: nb(Math.round(c.besoin / 10000) * 10000), besoinEur: nb(Math.round(c.besoin / EUR / 1000) * 1000),
  };
  document.querySelectorAll('[data-v]').forEach((el) => { el.textContent = v[el.dataset.v] ?? '?'; });

  $('#funnel').innerHTML = `<thead><tr><th>Année</th><th>Contacts qualifiés</th><th>Chantiers ouverts</th><th>Forfaits payés</th></tr></thead><tbody>${
    c.funnel.map((f) => `<tr><td>${f.an}</td><td>${nb(f.contacts)}</td><td>${nb(f.ouverts)}</td><td>${nb(f.payants)}</td></tr>`).join('')}</tbody>`;
  const canaux = { pub: 'Publicité vers les MRE', entreprise: "L'entreprise invite son client", parrainage: 'Parrainage' };
  $('#cac').innerHTML = `<thead><tr><th>Canal</th><th>Coût par chantier</th>${ANNEES.map((a) => `<th>Part ${a}</th>`).join('')}</tr></thead><tbody>${
    Object.keys(canaux).map((key) => `<tr><td>${canaux[key]}</td><td>${nb(H.cac[key])} DH</td>${H.mixCanaux.map((x) => `<td>${Math.round(x[key] * 100)} %</td>`).join('')}</tr>`).join('')
  }<tr class="tot"><td>Coût moyen d'un chantier payant</td><td></td>${c.rows.map((r) => `<td>${nb(r.cacMoyen)} DH</td>`).join('')}</tr></tbody>`;
  const postes = [...new Set(H.equipe.flat().map((p) => p.poste))];
  $('#equipe').innerHTML = `<thead><tr><th>Poste</th>${ANNEES.map((a) => `<th>${a}</th>`).join('')}</tr></thead><tbody>${
    postes.map((p) => `<tr><td>${p}</td>${H.equipe.map((e) => { const x = e.find((q) => q.poste === p); return `<td>${x ? nb(x.cout) : '—'}</td>`; }).join('')}</tr>`).join('')
  }<tr><td>Fondateurs non salariés</td><td>4</td><td>3</td><td>2</td></tr><tr class="tot"><td>Salaires et charges</td>${H.equipe.map((e) => `<td>${nb(e.reduce((a, q) => a + q.cout, 0))}</td>`).join('')}</tr></tbody>`;

  $('#sensi').innerHTML = `<thead><tr><th>Grille · payé à l'agence</th><th>Marge par visite</th><th>Marge d'un chantier, 4 visites</th><th>Résultat 2029</th><th>Point mort 2029</th><th>Besoin de financement</th></tr></thead><tbody>${
    sensibilite(H).map((s) => `<tr><td>${s.grille} · ${nb(s.agence)} DH</td><td${cls(s.margeVisite)}>${nb(s.margeVisite)}</td><td${cls(s.margeChantier4)}>${nb(s.margeChantier4)}</td><td${cls(s.resultat2029)}>${nb(s.resultat2029)}</td><td>${pm(s.pointMort2029)}</td><td>${nb(s.besoin)}</td></tr>`).join('')}</tbody>`;
}

function rendre() {
  const opt = { agence: R.agence, volume: R.volume };
  if (R.grille !== 'central') opt.grille = R.grille;
  const c = calcule(H, opt), rows = c.rows, r29 = rows[2];

  $('#kpis').innerHTML = [
    ["Chiffre d'affaires 2029", nb(r29.caTotal) + ' DH', ''],
    ['Résultat 2029', nb(r29.resultat) + ' DH', r29.resultat < 0 ? 'neg' : 'pos'],
    ['Point mort (équipe 2029)', Number.isFinite(r29.pointMort) ? nb(r29.pointMort) + ' chantiers / an' : 'jamais atteint', Number.isFinite(r29.pointMort) ? '' : 'neg'],
    ['Besoin de financement', nb(c.besoin) + ' DH', ''],
  ].map(([l, v, s]) => `<div class="pv-kpi"><p>${l}</p><strong class="${s}">${v}</strong></div>`).join('');

  const L = [
    ['Chantiers payants', (r) => nb(r.n), 'hd'],
    ['Grille appliquée', (r) => r.grille, 'hd'],
    ["Chiffre d'affaires", null, 'sec'],
    ['Forfaits Suivi (client)', (r) => nb(r.ca.suivi)],
    ['Forfaits Suivi contrôlé (client)', (r) => nb(r.ca.controle)],
    ["Contre-visites (entreprise)", (r) => nb(r.ca.contreVisites)],
    ['Commission séquestre (banque)', (r) => nb(r.ca.banque)],
    ['Option Visibilité (entreprise)', (r) => nb(r.ca.visibilite)],
    ['Partenariat assurance (courtier)', (r) => nb(r.ca.assurance)],
    ["Total chiffre d'affaires", (r) => nb(r.caTotal), 'tot'],
    ['Coût des visites (agences)', (r) => nb(-r.coutVisites)],
    ['Autres coûts directs (preuves, hébergement, assurance, paiement)', (r) => nb(-r.autresDirects)],
    ['Marge brute', (r) => nb(r.margeBrute), 'tot'],
    ['Marge brute par chantier', (r) => nb(r.margeBrute / (r.n || 1))],
    ['Salaires et charges', (r) => nb(-r.salaires)],
    ['Marketing (acquisition + marque)', (r) => nb(-r.marketing)],
    ['Frais généraux', (r) => nb(-r.fraisGeneraux)],
    ["Amortissement de l'appli", (r) => nb(-r.amortissement)],
    ['Résultat', (r) => nb(r.resultat), 'tot res'],
    ['Trésorerie cumulée', (r) => nb(r.treso), 'res'],
    ['Point mort (chantiers par an, coûts de l\'année)', (r) => pm(r.pointMort), 'tot'],
  ];
  $('#table').innerHTML = `<thead><tr><th></th>${ANNEES.map((a) => `<th>${a}</th>`).join('')}</tr></thead><tbody>${L.map(([lab, f, t = '']) =>
    f ? `<tr class="${t}"><td>${lab}</td>${rows.map((r) => { const s = f(r); return `<td${/^−/.test(s) && t.includes('res') ? ' class="neg"' : ''}>${s}</td>`; }).join('')}</tr>`
      : `<tr class="sec"><td colspan="${ANNEES.length + 1}">${lab}</td></tr>`).join('')}</tbody>`;

  // Graphique : barres = résultat, points = trésorerie cumulée.
  const W = 640, Hh = 260, P = 48, vals = rows.flatMap((r) => [r.resultat, r.treso]).concat([0, -c.besoin * 0.05]);
  const max = Math.max(...vals, 100000), min = Math.min(...vals), y = (v) => 20 + ((max - v) / (max - min)) * (Hh - 50);
  const bw = 64, x = (i) => P + 40 + i * ((W - P - 80) / (rows.length - 1));
  const grid = [min, (min + max) / 2, 0, max].map((v) => `<line class="axis" x1="${P}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}"/><text x="${P - 6}" y="${y(v) + 4}" text-anchor="end">${k(v)}</text>`).join('');
  const bars = rows.map((r, i) => `<rect class="${r.resultat < 0 ? 'bar-neg' : 'bar-pos'}" x="${x(i) - bw / 2}" y="${Math.min(y(0), y(r.resultat))}" width="${bw}" height="${Math.abs(y(r.resultat) - y(0))}" rx="8"/>
    <text x="${x(i)}" y="${Hh - 6}" text-anchor="middle">${r.an}</text>`).join('');
  const line = `<polyline class="line" points="${rows.map((r, i) => `${x(i)},${y(r.treso)}`).join(' ')}"/>` + rows.map((r, i) => `<circle class="dot" cx="${x(i)}" cy="${y(r.treso)}" r="6"/>`).join('');
  $('#chart').innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Résultat et trésorerie cumulée de 2027 à 2029">${grid}${bars}${line}</svg>`;
}

document.querySelectorAll('.pv-seg').forEach((g) => g.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const key = g.dataset.k; R[key] = key === 'grille' ? b.dataset.val : Number(b.dataset.val);
  rendre();
}));

remplir();
rendre();
window.__previsionnel = { H, calcule, sensibilite };
