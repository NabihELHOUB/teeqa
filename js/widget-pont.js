// Pont vers les widgets de l'iPhone (11 nov.). Quand l'appli est servie par le petit serveur Wi-Fi (port 5180), elle dépose
// l'état du premier chantier à chaque changement : le widget Scriptable de l'écran d'accueil et de l'écran verrouillé le relit.
// Ailleurs (ordinateur, vitrine), ce fichier ne fait rien. Aucune donnée ne quitte le réseau local.
import { get, subscribe, progress, currentStep, doneLike, statusKey, STATUS } from './store.js';
if (location.port === '5180' && !location.search.includes('vitrine')) {
  let last = '', timer = 0;
  const push = () => {
    const p = get().projects.find(x => x.status !== 'clos') || get().projects[0]; if (!p) return;
    const pr = progress(p), cur = currentStep(p), k = statusKey(cur);
    const ton = p.status === 'clos' ? 'ok' : cur.status === 'refusee' ? 'refus' : cur.status === 'retardee' ? 'reserve' : ['fin_declaree', 'correction_soumise'].includes(cur.status) ? 'attente' : 'cours';
    const body = JSON.stringify({ nom: p.name, ville: p.city, fait: pr.done, total: pr.total, numero: p.steps.indexOf(cur) + 1, etape: cur.title,
      statut: p.status === 'clos' ? 'Chantier clôturé' : STATUS[k].label, ton,
      etapes: p.steps.map(s => doneLike(s) ? 1 : s === cur && p.status !== 'clos' ? (cur.status === 'retardee' ? 3 : cur.status === 'refusee' ? 4 : 2) : 0) });
    if (body === last) return; last = body;
    fetch('/widget-etat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body.replace(/}$/, `,"maj":"${new Date().toISOString()}"}`) }).catch(() => {});
  };
  const later = () => { clearTimeout(timer); timer = setTimeout(push, 600); };
  subscribe(later); later();
}
