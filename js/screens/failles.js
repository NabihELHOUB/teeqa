// Vague 25 (retour du groupe, 25 nov.) : les quatre failles devenues de vrais parcours.
// Décès du client, décès ou départ du gérant, accident sur le chantier, contournement (et parrainage), faillite et décennale.
// TEEQA date et garde ; il ne tranche pas, ne détient pas d'argent, ne certifie rien.
import { FAILLES, decesActif, decesLimite, DECES_MAX_JOURS, actions, get, project, access, who, currentStep, progress, REGLES, isControlled, TARIFS, dh } from '../store.js';
import { confirmSheet } from '../ui.js';
import { icon } from '../icons.js';
import { appbar, esc, fmtDate, toast, sfx } from '../ui.js';
import { go } from '../app.js';

const val = (a, sel) => { const el = a.closest('.screen').querySelector(sel); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; };
const ouvert = (pid) => { const p = project(pid); return p && (access(p, get().role) === 'ok' || p.status === 'clos') ? p : null; };
const parQui = (x) => x === 'client' ? 'le client' : x === 'entreprise' ? 'l’entreprise' : x === 'controleur' ? 'le contrôleur' : 'TEEQA';
const page = (title, back, body) => `${appbar({ title, back, sep: true })}<div class="scroll"><div class="content stack" style="gap:14px;padding-top:14px;padding-bottom:32px">${body}</div></div>`;
const regle = (txt, id) => `<div class="notice" data-testid="${id}">${icon('shield', 'sm')}<span>${esc(txt)}</span></div>`;
const champ = (id, label, ph = '', type = 'text') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" class="input" type="${type}" autocomplete="off" placeholder="${esc(ph)}"></div>`;
const coche = (id, label) => `<label class="list-item" style="gap:10px;align-items:flex-start;min-height:44px"><input type="checkbox" id="${id}" style="width:22px;height:22px;margin-top:2px;flex:none"><span>${label}</span></label>`;

export const routes = [
  { // Décès du client : déclaration, suspension, mandataire des héritiers.
    name: 'deces', pattern: /^\/c\/([^/]+)\/deces$/,
    render(pid) {
      const p = ouvert(pid); if (!p) return { redirect: '#/home' };
      const d = p.deces, r = get().role, actif = decesActif(p);
      const etat = !d ? '' : `<div class="card stack" style="gap:6px" data-testid="deces-etat"><span class="over"><b>${actif ? 'Chantier suspendu' : 'Mandataire désigné'}</b></span>
        <p class="meta" style="margin:0">Décès déclaré le ${fmtDate(d.at)} (${esc(d.lien)}).${actif ? ` Délais du chantier et échéances des tranches suspendus ; séquestre gelé : la banque ne verse ni ne restitue rien. Pendant la suspension, les travaux s’arrêtent (seule la mise en sécurité de l’ouvrage continue, notée dans les échanges) et aucune visite n’est programmée.</p><p class="meta" style="margin:0" data-testid="deces-limite"><b>Suspension au plus tard jusqu’au ${fmtDate(decesLimite(p))}</b> (${DECES_MAX_JOURS / 30} mois). Sans mandataire à cette date : l’entreprise peut mettre fin au contrat ; un état des lieux arrête la part faite, qui lui est due, et la part du forfait des visites pas faites est remboursée aux héritiers. Signalé par ${parQui(d.par)}.` : ` ${esc(d.mandataire)}${d.pays ? ` (${esc(d.pays)})` : ''}, mandataire des héritiers, est titulaire depuis le ${fmtDate(d.mandataireAt)} ; les délais ont repris, sans compter les jours de suspension.`}</p></div>`;
      const declarer = d ? '' : `<div class="card stack" style="gap:10px"><span class="over"><b>Déclarer le décès du titulaire</b></span>
        ${champ('dc-lien', 'Qui déclare ? (votre lien avec le titulaire, ou votre rôle)', r === 'client' ? 'Ex. son fils, sa sœur' : r === 'entreprise' ? 'Ex. l’entreprise, informée par la famille' : 'Ex. le contrôleur, informé sur place')}
        <p class="meta" style="margin:0">${r === 'client' ? 'Un proche' : r === 'entreprise' ? 'L’entreprise' : 'Le contrôleur'} peut déclarer, comme les autres rôles. Aucun certificat n’est demandé pour suspendre : la suspension protège la famille. Le certificat de décès sera joint plus tard avec l’acte des ayants droit.</p>
        <button class="btn saffron block" data-act="dc-declarer" data-testid="deces-declarer">${icon('pause', 'sm')}Déclarer et suspendre</button></div>`;
      const mandat = actif ? `<div class="card stack" style="gap:10px" data-testid="deces-mandat"><span class="over"><b>Les héritiers désignent un mandataire</b></span>
        <p class="meta" style="margin:0">Héritiers en France, au Maroc ou ailleurs : un seul interlocuteur, désigné par écrit et signé par chacun. Ce mandataire devient titulaire ; les autres héritiers peuvent être invités comme proches.</p>
        ${champ('dc-nom', 'Nom du mandataire', 'Ex. Nadia El Amrani')}${champ('dc-pays', 'Pays où il vit', 'Ex. France')}
        ${coche('dc-acte', 'L’acte des ayants droit (acte de notoriété ou d’hérédité, adoul ou notaire), le certificat de décès et la désignation signée sont déposés dans Documents.')}
        <button class="btn block" data-act="dc-mandat" data-testid="deces-mandataire">${icon('check', 'sm')}Enregistrer le mandataire</button>
        <p class="meta" style="margin:0">TEEQA enregistre les pièces telles qu’elles sont déposées ; il ne tranche pas entre héritiers. En cas de désaccord, le chantier reste suspendu.</p></div>` : '';
      return {
        html: page('Décès du titulaire', `#/c/${pid}/share`, `${etat}${regle(FAILLES.deces, 'regle-deces')}${declarer}${mandat}
          <div class="notice">${icon('lock', 'sm')}<span>Accès au dossier : les proches déjà invités le lisent toujours (rapport, photos, avis, paiements indiqués). Rien n’est effacé.</span></div>`),
        on: {
          'dc-declarer'(a) { const l = val(a, '#dc-lien'); if (String(l).trim().length < 3) { toast('Dites qui déclare (3 lettres au moins)', 'info'); return; } actions.declarerDeces(pid, { lien: l }); sfx('tampon'); toast('Décès déclaré · délais et tranches suspendus', 'check'); },
          'dc-mandat'(a) { const n = val(a, '#dc-nom'); if (String(n).trim().length < 3) { toast('Indiquez le nom du mandataire', 'info'); return; } if (!val(a, '#dc-acte')) { toast('Il manque les pièces : cochez quand elles sont dans Documents', 'info'); return; } actions.mandataireHeritiers(pid, { nom: n, pays: val(a, '#dc-pays'), acte: true }); toast('Mandataire enregistré · les délais repartent', 'check'); },
        },
      };
    },
  },
  { // Décès ou départ du gérant de l'entreprise.
    name: 'gerant', pattern: /^\/c\/([^/]+)\/gerant$/,
    render(pid) {
      const p = ouvert(pid); if (!p) return { redirect: '#/home' };
      const g = p.gerant, r = get().role; if (r === 'controleur') return { redirect: `#/c/${pid}` };
      const etat = g ? `<div class="card stack" style="gap:6px" data-testid="gerant-etat"><span class="over"><b>${g.mode === 'societe' ? 'Le contrat continue avec la société' : 'Le contrat s’arrête'}</b></span><p class="meta" style="margin:0">Enregistré le ${fmtDate(g.at)}. ${g.mode === 'societe' ? `Nouveau représentant : ${esc(g.nom)}. Mêmes tranches, même devis, même décennale (police du chantier).` : 'Prochaine étape : l’état des lieux, puis une autre entreprise.'}</p>${g.mode === 'fin' && r === 'client' ? `<button class="btn saffron block" data-go="#/c/${pid}/share" data-testid="gerant-reprise">${icon('refresh', 'sm')}Faire l’état des lieux et changer d’entreprise</button>` : ''}</div>` : '';
      const choix = g ? '' : `<div class="card stack" style="gap:10px"><span class="over"><b>Que devient ${esc(who('entreprise'))} ?</b></span>
        ${champ('ge-nom', 'Si c’est une société : nom du nouveau représentant légal', 'Ex. Samira Rachidi, gérante')}
        <button class="btn block" data-act="ge-societe" data-testid="gerant-societe">${icon('check', 'sm')}La société continue</button>
        <button class="btn ghost block" data-act="ge-fin" data-testid="gerant-fin">${icon('close', 'sm')}L’entreprise s’arrête (entrepreneur seul)</button>
        <p class="meta" style="margin:0">Le registre de commerce dit si l’entreprise est une société ou une personne. ${r === 'client' ? 'Le choix vous revient ; TEEQA ne choisit pas pour vous.' : 'Le client est prévenu et garde la décision de changer d’entreprise.'}</p></div>`;
      return {
        html: page('Gérant de l’entreprise', `#/c/${pid}/share`, `${etat}${regle(FAILLES.gerant, 'regle-gerant')}${choix}${regle(FAILLES.decennale, 'regle-decennale-gerant')}`),
        on: {
          'ge-societe'(a) { const n = val(a, '#ge-nom'); if (String(n).trim().length < 3) { toast('Indiquez le nouveau représentant', 'info'); return; } actions.gerantChange(pid, { mode: 'societe', nom: n }); toast('Le contrat continue avec la société', 'check'); },
          'ge-fin'() { actions.gerantChange(pid, { mode: 'fin' }); toast('Contrat arrêté · état des lieux à faire', 'check'); },
        },
      };
    },
  },
  { // Accident sur le chantier (tous les rôles) ; observation de sécurité du contrôleur.
    name: 'accident', pattern: /^\/c\/([^/]+)\/accident$/,
    render(pid) {
      const p = ouvert(pid); if (!p) return { redirect: '#/home' };
      const r = get().role, L = (p.accidents || []).slice().reverse(), sec = (p.securite || []).slice(-1)[0];
      const SUITES = ['Déclaré à l’assureur de l’entreprise (accident du travail)', 'Photos des lieux ajoutées', 'Sorti de l’hôpital', 'Inspection du travail passée', 'Travail repris, zone sécurisée'];
      const liste = L.length ? `<div class="card stack" style="gap:8px" data-testid="accident-liste"><span class="over"><b>Signalés sur ce chantier</b> · suivi daté</span>${L.map(x => `<div class="stack" style="gap:4px" data-testid="accident-suivi"><p class="meta" style="margin:0"><b>${fmtDate(x.at)}</b> · ${esc(x.quoi)}${x.photos ? ` · ${x.photos} photo${x.photos > 1 ? 's' : ''}` : ' · sans photo'} <span>(signalé par ${parQui(x.par)})</span></p>${(x.suivi || []).map(y => `<p class="meta" style="margin:0;padding-left:12px">${fmtDate(y.at)} · ${esc(y.txt)} <span>(${parQui(y.par)})</span></p>`).join('')}${p.status !== 'clos' ? `<div class="row" style="gap:6px;flex-wrap:wrap">${SUITES.filter(t => !(x.suivi || []).some(y => y.txt === t)).map(t => `<button class="btn sm ghost" style="min-height:44px" data-act="ac-suivi" data-id="${x.id}" data-t="${esc(t)}">${icon('plus', 'sm')}${esc(t)}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>` : '';
      const ctrl = r === 'controleur' ? `<div class="card stack" style="gap:10px" data-testid="securite"><span class="over"><b>Sécurité visible aujourd’hui</b> · observation</span>
        ${coche('sc-casques', 'Casques portés')}${coche('sc-gc', 'Garde-corps en place en hauteur')}${coche('sc-echaf', 'Échafaudage stable et amarré')}
        <button class="btn block" data-act="sc-noter" data-testid="securite-noter">${icon('check', 'sm')}Noter l’observation</button>
        <p class="meta" style="margin:0">${esc(FAILLES.securite)}</p>${sec ? `<p class="meta" style="margin:0" data-testid="securite-derniere">Dernière observation : ${fmtDate(sec.at)}.</p>` : ''}</div>` : '';
      return {
        html: page('Signaler un accident', `#/c/${pid}`, `<div class="notice danger" data-testid="secours">${icon('phone', 'sm')}<span><b>D’abord les secours :</b> 15 (SAMU) ou 150 (Protection civile). Ensuite seulement, le signalement.</span></div>
          <div class="card stack" style="gap:10px"><span class="over"><b>Ce qui s’est passé</b></span>
            <div class="field"><label for="ac-quoi">En quelques mots (10 lettres au moins)</label><textarea id="ac-quoi" class="input" rows="3" style="width:100%;box-sizing:border-box;height:auto;padding-top:12px;padding-bottom:12px" placeholder="Ex. chute d’un ouvrier depuis l’échafaudage, côté jardin"></textarea></div>
            <div class="field"><label for="ac-grav">Gravité</label><select id="ac-grav" class="input"><option value="soins">Soins sur place</option><option value="hopital">Transport à l’hôpital</option><option value="grave">Grave</option></select></div>
            <div class="row" style="gap:6px;flex-wrap:wrap" data-testid="accident-vite">${['Chute d’un ouvrier', 'Blessure par un outil', 'Effondrement d’un mur ou d’un coffrage', 'Malaise sur le chantier'].map(t => `<button class="chip" style="min-height:44px" data-act="ac-vite" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
            ${coche('ac-photo', 'J’ai pris 2 photos des lieux (datées par TEEQA, sans visage). <b>Facultatif</b> : sans photo, le signalement part tout de suite ; les photos s’ajoutent après, dans le suivi.')}
            <button class="btn saffron block" data-act="ac-signaler" data-testid="accident-signaler">${icon('alert', 'sm')}Signaler à tous, avec ou sans photo</button>
            <p class="meta" style="margin:0">Le signalement va dans les échanges de l’étape en cours (${esc(currentStep(p).title)}), daté par le serveur, vu par ${esc(who('client', r))}, l’entreprise et le contrôleur. Le chef de chantier invité dans l’équipe de l’entreprise signale depuis son téléphone : c’est signé de son nom.</p></div>
          ${liste}${regle(FAILLES.accident, 'regle-accident')}${ctrl}`),
        on: {
          'ac-signaler'(a) { const q = val(a, '#ac-quoi'); if (String(q).trim().length < 10) { toast('Décrivez en 10 lettres au moins', 'info'); return; } actions.signalerAccident(pid, { quoi: q, gravite: val(a, '#ac-grav'), photos: val(a, '#ac-photo') ? 2 : 0 }); sfx('tampon'); toast('Accident signalé · daté, vu par tous', 'check'); },
          'ac-vite'(a) { const t = a.closest('.screen').querySelector('#ac-quoi'); if (t) { t.value = a.dataset.t + (t.value ? ' · ' + t.value : ''); } },
          'ac-suivi'(a) { actions.suiviAccident(pid, a.dataset.id, a.dataset.t); toast('Suivi ajouté · daté, vu par tous', 'check'); },
          'sc-noter'(a) { actions.observationSecurite(pid, { casques: !!val(a, '#sc-casques'), gardeCorps: !!val(a, '#sc-gc'), echafaudage: !!val(a, '#sc-echaf') }); toast('Observation de sécurité notée', 'check'); },
        },
      };
    },
  },
  { // Contournement après 2 étapes : pourquoi rester, comment arrêter, et parrainer.
    name: 'rester', pattern: /^\/c\/([^/]+)\/rester$/,
    render(pid) {
      const p = ouvert(pid); if (!p) return { redirect: '#/home' };
      const pr = progress(p), r = get().role, arret = p.suiviArrete, cachees = p.steps.filter(x => !['validee', 'corrigee', 'vue'].includes(x.status) && /dalle|réseaux|étanchéité|toiture|plancher|encastr/i.test(x.title)).map(x => x.title);   // vague 26 (jury n° 22) : jamais une étape close dans « à venir »
      const prevues = p.steps.filter(isControlled).length, restantes = p.steps.filter(x => isControlled(x) && !(x.reviews || []).length).length;
      return {
        html: page('Continuer avec TEEQA ?', `#/c/${pid}`, `<div class="card stack" style="gap:8px" data-testid="rester"><span class="over"><b>${pr.done} étape${pr.done > 1 ? 's' : ''} close${pr.done > 1 ? 's' : ''} sur ${p.steps.length}</b></span>
          <p class="meta" style="margin:0">${esc(FAILLES.rester)}</p>
          ${cachees.length ? `<p class="meta" style="margin:0" data-testid="rester-cachees"><b>Encore à venir, et bientôt caché :</b> ${cachees.map(esc).join(' · ')}.</p>` : ''}</div>
          <button class="btn saffron block" data-go="#/parrainer" data-testid="rester-parrainer">${icon('users', 'sm')}Parrainer un autre chantier</button>
          <button class="btn ghost block" data-go="#/c/${pid}/report" data-testid="rester-export">${icon('file', 'sm')}Voir ce que contient le rapport</button>
          ${arret ? `<div class="notice" data-testid="suivi-arrete">${icon('checkCircle', 'sm')}<span><b>Suivi arrêté le ${fmtDate(arret.at)}.</b> ${arret.faites} visite${arret.faites > 1 ? 's' : ''} faite${arret.faites > 1 ? 's' : ''} sur ${arret.prevues} ; ${arret.rembourse ? `${dh(arret.rembourse)} remboursés pour les visites pas faites, sous 14 jours` : p.forfait && p.forfait.moyen === 'carte3' ? 'les tiers suivants du forfait ne sont pas prélevés' : 'rien d’autre à payer'}. Le dossier reste lisible et exportable 10 ans.</span></div>`
          : r === 'client' ? `<div class="card stack" style="gap:8px" data-testid="arret"><span class="over"><b>Arrêter le suivi</b></span><p class="meta" style="margin:0">${restantes} visite${restantes > 1 ? 's' : ''} pas encore faite${restantes > 1 ? 's' : ''} sur ${prevues}. ${p.forfait && p.forfait.paidAt ? (p.forfait.moyen === 'carte3' ? 'Forfait en 3 fois : les tiers suivants ne seront pas prélevés.' : `Forfait payé en une fois : ${dh(restantes * TARIFS.visite.dh)} remboursés (${TARIFS.visite.dh.toLocaleString('fr-FR')} DH par visite pas faite), sous 14 jours.`) : 'Forfait pas encore payé : rien à payer.'} Le forfait des visites faites n’est pas remboursé. ${esc(REGLES.argent || 'TEEQA ne détient jamais l’argent des travaux.')}</p><button class="btn ghost block" data-act="arreter" data-testid="arreter-suivi">${icon('close', 'sm')}Arrêter le suivi TEEQA</button></div>`
          : `<p class="meta" style="margin:0" data-testid="arret-ent">Seul le client arrête le suivi ; vous en êtes prévenu. Après l’arrêt, plus aucune visite n’est programmée et le dossier reste lisible.</p>`}`),
        on: { arreter() { confirmSheet({ title: 'Arrêter le suivi ?', body: `Plus aucune visite ne sera programmée sur « ${esc(p.name)} ». L’entreprise et l’agence sont prévenues. Le dossier reste lisible et exportable 10 ans.`, confirm: 'Arrêter le suivi', onConfirm: () => { actions.arreterSuivi(pid); toast('Suivi arrêté · dossier gardé', 'check'); } }); } },
      };
    },
  },
  { // Parrainage (client ou entreprise).
    name: 'parrainer', pattern: /^\/parrainer$/,
    render() {
      const r = get().role; if (r === 'controleur') return { redirect: '#/home' };
      const L = (get().parrainages || []).filter(x => x.par === r).slice().reverse();
      return {
        html: page('Parrainer', '#/profile', `<div class="card stack" style="gap:8px" data-testid="parrainer"><span class="over"><b>${r === 'client' ? 'Une visite offerte par chantier parrainé' : 'Une contre-visite offerte par chantier parrainé'}</b></span>
          <p class="meta" style="margin:0">${esc(FAILLES.parrainage)}</p>
          ${champ('pa-nom', 'Prénom de la personne invitée', 'Ex. Youssef')}
          <button class="btn saffron block" data-act="pa-envoyer" data-testid="parrainer-envoyer">${icon('share', 'sm')}Créer le lien d’invitation</button></div>
          ${L.length ? `<div class="card stack" style="gap:6px" data-testid="parrainages"><span class="over"><b>Vos invitations</b></span>${L.map(x => `<p class="meta" style="margin:0">${esc(x.nom)} · code <b>${esc(x.code)}</b> · ${fmtDate(x.at)} · en attente d’un forfait</p>`).join('')}</div>` : ''}`),
        on: { 'pa-envoyer'(a) { const n = val(a, '#pa-nom'); const c = actions.parrainer(n); if (!c) { toast('Indiquez un prénom', 'info'); return; } sfx('choix'); toast(`Lien créé · code ${c}`, 'check'); } },
      };
    },
  },
  { // Décennale du chantier et faillite de l'entreprise.
    name: 'decennale', pattern: /^\/c\/([^/]+)\/decennale$/,
    render(pid) {
      const p = ouvert(pid); if (!p) return { redirect: '#/home' };
      const d = p.decennale, r = get().role, avant = p.steps.every(x => ['a_venir', 'verrouillee'].includes(x.status));
      return {
        html: page('Attestation décennale', `#/c/${pid}`, `${d ? `<div class="card stack" style="gap:6px" data-testid="decennale-ok"><span class="over"><b>Attestation nominative du chantier</b></span><dl class="kv" style="margin:0"><dt>Police</dt><dd data-notr>${esc(d.police)}</dd><dt>Assureur</dt><dd>${esc(d.assureur)}</dd><dt>Déposée le</dt><dd>${fmtDate(d.at)}</dd>${d.jusqu ? `<dt>Valable jusqu’au</dt><dd>${fmtDate(d.jusqu)}</dd>` : ''}${d.contact ? `<dt>Sinistres</dt><dd data-notr>${esc(d.contact)}</dd>` : ''}</dl><p class="meta" style="margin:0">Gardée dans le rapport et dans Documents. TEEQA ne vérifie pas la couverture : pour une confirmation, appelez l’assureur en lui donnant ce numéro de police.</p>${(p.pieces || []).some(x => x.kind === 'decennale') ? `<button class="btn ghost block" data-go="#/c/${pid}/documents" data-testid="decennale-doc">${icon('file', 'sm')}Ouvrir l’attestation dans Documents</button>` : ''}</div>`
          : `<div class="notice warn" data-testid="decennale-manque">${icon('alert', 'sm')}<span><b>Attestation à demander${avant ? ' avant le début' : ''} :</b> l’entreprise dépose l’attestation nominative du chantier (n° de police, assureur).</span></div>
          ${r === 'entreprise' ? `<div class="card stack" style="gap:10px">${champ('de-police', 'Numéro de police', 'Ex. DEC-2026-0418')}${champ('de-assureur', 'Assureur', 'Nom de la compagnie')}<button class="btn saffron block" data-act="de-deposer" data-testid="decennale-deposer">${icon('cloudUp', 'sm')}Déposer l’attestation</button></div>` : ''}`}
          ${regle(FAILLES.decennale, 'regle-decennale')}
          ${p.status === 'clos' && p.reception ? `<div class="card stack" style="gap:10px" data-testid="desordre"><span class="over"><b>Signaler un désordre après la réception</b></span>
            ${(p.desordres || []).length ? (p.desordres || []).slice().reverse().map(x => `<p class="meta" style="margin:0" data-testid="desordre-liste"><b>${fmtDate(x.at)}</b> · ${esc(x.quoi)}${x.photos ? ` · ${x.photos} photo${x.photos > 1 ? 's' : ''} datée${x.photos > 1 ? 's' : ''}` : ''} (${parQui(x.par)})</p>`).join('') : ''}
            <div class="field"><label for="ds-quoi">Ce que vous voyez (10 lettres au moins)</label><textarea id="ds-quoi" class="input" rows="3" style="width:100%;box-sizing:border-box;height:auto;padding-top:12px;padding-bottom:12px" placeholder="Ex. fissure en escalier sur le mur nord de la chambre"></textarea></div>
            ${coche('ds-photo', 'J’ajoute 2 photos datées (facultatif)')}
            <button class="btn saffron block" data-act="ds-signaler" data-testid="desordre-signaler">${icon('alert', 'sm')}Ajouter au dossier archivé</button>
            <p class="meta" style="margin:0">Daté et ajouté au rapport archivé, vu par l’entreprise. Ensuite, écrivez à l’assureur${d ? ` (police ${esc(d.police)}, ${esc(d.assureur)})` : ''} par lettre recommandée, avec le rapport TEEQA et vos photos : « Je déclare un désordre constaté le [date] sur l’ouvrage réceptionné le ${fmtDate(p.reception.provisoireAt)}… ». Délai de déclaration : celui de votre police, à faire vérifier par un juriste. Une visite de constat d’un contrôleur peut être demandée (${TARIFS.visite.dh.toLocaleString('fr-FR')} DH).</p></div>` : ''}
          ${p.liquidation ? `<div class="notice danger" data-testid="liquidation">${icon('alert', 'sm')}<span><b>${esc(who('entreprise'))} déclarée en ${esc(p.liquidation.quoi)}</b> le ${fmtDate(p.liquidation.at)} (par ${parQui(p.liquidation.par)}). ${p.status === 'clos' ? 'Pour un désordre : l’assureur décennal, avec le rapport et l’attestation.' : 'Le chantier s’arrête : état des lieux, puis une autre entreprise ; déclarez vos créances au liquidateur.'}</span></div>` : ['client', 'controleur', 'entreprise'].includes(r) ? `<button class="btn ghost block" data-act="liq" data-testid="liquidation-declarer">${icon('alert', 'sm')}${r === 'entreprise' ? 'Mon entreprise est en liquidation' : 'L’entreprise est en liquidation'}</button>` : ''}
          <div class="card stack" style="gap:6px" data-testid="faillite"><span class="over"><b>Si l’entreprise disparaît</b> (liquidation, faillite)</span>
            <ul class="meta" style="margin:0;padding-left:18px;display:grid;gap:4px"><li>Avant la réception : le chantier s’arrête ; état des lieux et autre entreprise (comme un abandon). Les tranches payées restent payées ; celles posées sur le séquestre restent à la banque.</li><li>Après la réception : pour un désordre grave, écrivez à l’assureur décennal (police ci-dessus), avec le rapport TEEQA et l’attestation.</li><li>À faire vérifier par un juriste : ce que couvre la police, et les délais pour déclarer.</li></ul></div>`),
        on: { liq() { confirmSheet({ title: 'Déclarer la liquidation ?', body: 'Joignez le jugement ou l’avis du tribunal dans Documents. Tous sont prévenus ; TEEQA ne vérifie pas le jugement.', confirm: 'Déclarer', onConfirm: () => { actions.declarerLiquidation(pid); toast('Liquidation déclarée · tous prévenus', 'check'); } }); },
          'ds-signaler'(a) { const q = val(a, '#ds-quoi'); if (String(q).trim().length < 10) { toast('Décrivez en 10 lettres au moins', 'info'); return; } actions.signalerDesordre(pid, { quoi: q, photos: val(a, '#ds-photo') ? 2 : 0 }); sfx('tampon'); toast('Désordre ajouté au dossier', 'check'); },
          'de-deposer'(a) { const po = val(a, '#de-police'), as = val(a, '#de-assureur'); if (String(po).trim().length < 4 || String(as).trim().length < 3) { toast('Numéro de police et assureur requis', 'info'); return; } actions.deposerDecennale(pid, { police: po, assureur: as }); toast('Attestation déposée · le client est prévenu', 'check'); } },
      };
    },
  },
];

// Entrées vers ces parcours (Invitations et accès, Profil) : une liste courte, un geste chacune.
export const faillesListe = (pid, r) => `<div class="list" data-testid="failles-liste">
  ${(project(pid) && project(pid).status === 'clos' ? [['decennale', 'shield', 'Attestation décennale, désordre, liquidation', 'Après la réception : signaler un désordre, écrire à l’assureur']] : [['deces', 'user', 'Décès du titulaire', r === 'client' ? 'Suspendre, puis désigner le mandataire des héritiers' : 'Vous pouvez le déclarer : délais et tranches suspendus'], r !== 'controleur' ? ['gerant', 'users', 'Décès ou départ du gérant de l’entreprise', 'La société continue, ou changer d’entreprise'] : null, ['accident', 'alert', 'Signaler un accident', 'Secours d’abord ; daté, vu par tous'], ['decennale', 'shield', 'Attestation décennale et faillite', 'Ce qui reste couvert ; déclarer une liquidation']]).filter(Boolean).map(([k, ic, t, s]) => `<button class="list-item" data-go="#/c/${pid}/${k}" data-testid="faille-${k}"><span class="ico-tile">${icon(ic)}</span><span class="grow"><span class="t">${t}</span><div class="s">${s}</div></span>${icon('chevron', 'sm chev')}</button>`).join('')}</div>`;
