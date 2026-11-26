// Détail d'étape, caméra, avis signé, correction, échanges.
import { finEtapeDepassee, attentesDe, aJour, CV_EQUITE, phraseArgent, pourSortante, echeanceEstimee, estimeSur, agenceEtape, pays, PAYS, agrementEtape, seqSurCompte, seqEtatTxt, seqActif, SEQUESTRE, cvRepartTxt, resteDuTxt, urgentLibre, urgentPour, enDeviseTaux, photosRequises, valideInterdit, estCle, cvPayeurTxt, dueApres, MOYENS, STRUCTURE_RX, slotLibres, autreAgence, autreAgenceTxt, secondAvisOuvert, VALIDE_CONTESTE, cvPayeur, pointsCles, motifOk, pointsRevus, contestBloque, contestFin, retenueTxt, retardJours, RESPONSABILITE, deviseVue, enDeviseTxt, slotTz, nowMs, REGLES, contreVisiteKey, budgetOf, enContreVisite, firstEndAt, echeance, decideursLine, coDecideurs, DESIST_H, trancheDh, dh, TARIFS, prix, tarif, langOf, canReopen, endWord, visitDelay, coulageDue, trancheName, recuseBlocked, empreinte, slotOptions, slotLabel, pendingFete, recipients, missionPending, actions, get, project, step, can, latestReview, access, freshValid, doneLike, who, avisLabel, isControlled, statusKey, ROLES, STATUS, VERDICTS, conventionOk, checkPoints, holdPoint, visitBy, POINT_STATES, overdue, solde, declarePhotos, pendingCorrection, missionOk, MIN_PHOTOS, MAX_CORRECTIONS, DELAI_LABEL, startPhotos, reserveSurPlace, reserveWhy, PERIMETRE, bookOptions, bookingActive, BOOK_MIN_H, progress } from '../store.js';
// M08 : les points de contrôle d'un avis, en liste courte (avis affiché, relecture avant signature, rapport).
// Vague 4 : les points à reprendre et non vus restent visibles ; les conformes et « sans objet » se replient (6 points par étape).
const ptLi = (x) => `<li class="pt-${x.state}"><i></i>${esc(x.label)}<span>${POINT_STATES[x.state][0]}</span></li>`;
export const pointsList = (rv) => { if (!rv.points || !rv.points.length) return '';
  // Vague 15 : une contre-visite ne revoit que les points refusés ; les autres restent ceux de l'avis précédent (jamais « 6 sur 6 »).
  if (rv.contreVisite && rv.portee && rv.portee.length) { const rev = rv.points.filter(x => rv.portee.includes(x.label) && POINT_STATES[x.state]), n = rv.points.length - rev.length;
    return `<ul class="pts">${rev.map(ptLi).join('')}</ul><p class="meta" style="margin-top:6px" data-testid="portee-avis">Contre-visite : ${rev.length > 1 ? `${rev.length} points revus` : '1 point revu'}${n ? ` ; les ${n} autres restent ceux de l’avis précédent` : ''}.</p>`; } const pts = rv.points.filter(x => POINT_STATES[x.state]); if (rv.tous) return `<ul class="pts" data-testid="relecture-tous">${pts.map(ptLi).join('')}</ul>`; const bad = pts.filter(x => ['ko', 'nv'].includes(x.state)), good = pts.filter(x => !['ko', 'nv'].includes(x.state));
  return `${bad.length ? `<ul class="pts">${bad.map(ptLi).join('')}</ul>` : ''}${good.length ? `<details class="pts-more"><summary class="meta" style="cursor:pointer;margin-top:8px">${good.length} point${good.length > 1 ? 's' : ''} sur ${pts.length} conforme${good.length > 1 ? 's' : ''} ou sans objet</summary><ul class="pts">${good.map(ptLi).join('')}</ul></details>` : ''}`; };
import { icon } from '../icons.js';
import { photoSVG, signatureSVG, stepIcon3D, bellarej, bellarejClip } from '../art.js';
import { recompense, appbar, demobar, esc, fmtDate, fmtFull, fmtTime, fmtRel, statusChip, toast, openSheet, closeSheet, confirmSheet, roleChip, dayLabel, sfx, roleAvatar, def, fold } from '../ui.js';
import { feteHero, playFeteHero } from '../fete-hero.js';
import { go } from '../app.js';
import { darAr, arabize, LANGS, langName, readMessage, tradLabel, indicNote, origTitle, AUTO_NOTE, canRecord, recordVoice, canTranscribe, QUICK } from '../langues.js';

// 19 nov. : un message lu dans la langue de celui qui lit. Le message d'origine reste toujours affiché dessous, avec la
// mention « traduction indicative, sans valeur légale ». Un vocal : lecture, durée, transcription, traduction.
const dur = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const wave = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return Array.from({ length: 22 }, (_, i) => 5 + ((h >> (i % 24)) ^ (i * 7)) % 15).map((v) => `<i style="height:${v}px"></i>`).join(''); };
const listenBtn = (t, L) => t ? `<button class="btn text msg-listen" style="min-height:44px;padding:0 6px;font-size:13.5px" data-lact="speak" data-text="${esc(t)}" data-lang="${L}" data-testid="msg-listen" aria-label="Écouter ce message">${icon('speaker', 'xs')}Écouter</button>` : '';
function msgBody(m, L, fixer = null) {   // vague 17 : fixer = le lecteur, qui peut corriger la traduction d'un message des autres
  const rm = { ...readMessage(m, L) }, from = rm.from, src = LANGS[from] || LANGS.fr;
  // Vague 23 (jury n° 15) : le contrôleur reste anonyme pour l'entreprise, même cité par son prénom dans un message du client.
  if (get().role === 'entreprise') { const pn = String(ROLES.controleur.name || '').split(' ')[0]; if (pn.length > 2) { const rx = new RegExp(`\\b${pn}\\b`, 'g'); for (const k of ['text', 'original']) if (rm[k]) rm[k] = String(rm[k]).replace(rx, 'le contrôleur'); } }
  const voice = m.voice ? `<div class="voice-row" data-testid="voice-msg"><button class="voice-play" data-lact="play" ${m.voice.audio ? `data-src="${m.voice.audio}"` : `data-text="${esc(rm.original || rm.text)}" data-lang="${from}"`} aria-label="Écouter le vocal (${esc(langName(from))}, ${dur(m.voice.dur || 1)})">${icon('play', 'sm')}</button><span class="voice-wave" aria-hidden="true">${wave(m.id)}</span><span class="voice-dur mono">${dur(m.voice.dur || 1)}</span></div>
    <div class="voice-lang meta" data-notr>${icon('mic', 'xs')} Vocal · ${esc(langName(from))}${m.voice.transcript === false ? '' : ' · transcription'}</div>` : '';
  if (rm.translated) return `${voice}<span class="msg-text" lang="${(LANGS[L] || LANGS.fr).html}">${esc(rm.text)}</span>${listenBtn(rm.text, L)}
    <div class="tr-note" data-testid="tr-note" data-notr>${icon('globe', 'xs')}<span>${rm.fixed ? `Traduction corrigée par ${esc(rm.fixed.byName || who(rm.fixed.by))} le ${esc(fmtFull(rm.fixed.at))} · indicative, sans valeur légale` : `${esc(tradLabel(from, L))} · ${esc(indicNote(L))}`}</span></div>
    ${m.id && fixer && fixer !== m.role ? `<button class="btn text" style="min-height:32px;padding:0 4px;font-size:12.5px" data-act="fix-tr" data-id="${m.id}" data-testid="fix-tr">${icon('pen', 'xs')}Corriger la traduction</button>` : ''}
    <div class="msg-orig" data-orig data-testid="msg-orig" data-notr><span class="over">${esc(origTitle(L))} · ${esc(src.amazigh ? `${src.label} (lettres latines)` : langName(from))}</span><span lang="${src.html}" dir="${src.dir}">${esc(rm.original)}</span></div>`;
  return `${voice}<span class="msg-text" ${from !== 'fr' ? `lang="${src.html}" dir="${src.dir}" data-notr` : ''}>${esc(rm.text)}</span>${m.kind !== 'system' ? listenBtn(rm.text, rm.missing ? from : L) : ''}${rm.missing ? `<div class="tr-note" data-testid="tr-missing" data-notr>${icon('globe', 'xs')}<span>${esc(langName(from))} · pas de traduction automatique pour ce message</span></div>` : ''}`;
}
// Feuille « vocal » : on choisit la langue parlée (darija, tachelhit…), on enregistre, puis on relit la transcription.
function voiceSheet(pid, sid, r, onSent) {
  const L0 = langOf(r); let rec = null, got = null, L = L0;
  const langs = ['fr', 'ar', 'dar', 'shi', 'rif', 'tzm'];
  openSheet(`<h2>Message vocal</h2>
    <p class="muted small" style="margin-bottom:10px">Parlez dans votre langue. Les autres l'écoutent, et lisent sa transcription traduite dans leur langue, à titre indicatif.</p>
    <div class="field"><label>Langue du vocal</label><div class="chips" role="radiogroup" data-v-langs>${langs.map(k => `<button class="chip ${k === L ? 'dark' : 'outline'}" role="radio" aria-checked="${k === L}" data-v-lang="${k}" lang="${LANGS[k].html}">${esc(LANGS[k].native)}</button>`).join('')}</div></div>
    <div class="voice-rec" data-v-zone><button class="btn saffron block" data-v-rec>${icon('mic', 'sm')}<span data-v-lbl>Appuyez pour parler</span></button><div class="meta" data-v-time style="text-align:center;margin-top:6px"></div></div>
    <div class="field" data-v-tr style="display:none"><label for="v-tr">Transcription</label><textarea id="v-tr" class="textarea" rows="3" placeholder="Ce que vous avez dit, en lettres latines ou arabes"></textarea><p class="meta" data-v-help></p></div>
    <div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-v-send disabled>${icon('send', 'sm')}Envoyer le vocal</button></div>`, { label: 'Message vocal',
    onMount(el) {
      const $ = (q) => el.querySelector(q), help = $('[data-v-help]');
      el.querySelectorAll('[data-v-lang]').forEach(b => b.addEventListener('click', () => { L = b.dataset.vLang; el.querySelectorAll('[data-v-lang]').forEach(x => { const on = x === b; x.classList.toggle('dark', on); x.classList.toggle('outline', !on); x.setAttribute('aria-checked', on); }); }));
      $('[data-v-rec]').addEventListener('click', async () => {
        if (rec) { $('[data-v-lbl]').textContent = 'Appuyez pour parler'; got = await rec.stop(); rec = null; $('[data-v-tr]').style.display = ''; $('#v-tr').value = got.transcript || ''; $('[data-v-send]').disabled = false;
          help.textContent = got.transcript ? 'Transcription faite par le téléphone : relisez-la, corrigez-la si besoin.' : canTranscribe(L) ? 'Rien n\'a été compris : écrivez ce que vous avez dit, ou envoyez le vocal seul.' : `Le téléphone ne transcrit pas encore le ${LANGS[L].label.toLowerCase()} : écrivez ce que vous avez dit (en lettres latines), ou envoyez le vocal seul.`; return; }
        if (!canRecord()) { toast('Micro indisponible sur ce téléphone : écrivez votre message', 'info'); return; }
        try { rec = await recordVoice(L, { onTick: (t) => { $('[data-v-time]').textContent = dur(t); } }); $('[data-v-lbl]').textContent = 'Arrêter et relire'; }
        catch { rec = null; toast('Micro refusé : autorisez-le dans les réglages du navigateur', 'info'); }
      });
      $('[data-v-send]').addEventListener('click', () => { if (!got) return; const t = $('#v-tr').value.trim();
        actions.sendMessage(pid, sid, { role: r, kind: 'reponse', text: t, lang: L, voice: { dur: got.dur, audio: got.audio || null, transcript: !!t } });
        closeSheet(); sfx('send'); toast('Vocal envoyé', 'send'); onSent && onSent(); });
    } });
}


// Vague 5 : position approximative (quartier ou adresse, ville) et heure sur chaque photo ; ce n'est pas une certification.
const PLACE = (p) => [p.quartier || (p.prep && p.prep.address) || '', p.city].filter(Boolean).join(', ');
const photoPlace = (ph) => { const p = get().projects.find(x => x.steps.some(s => s.photos.includes(ph))); return p ? p.city : ''; };

// Vague 12 : deux heures sur chaque photo et chaque avis : prise (téléphone) et réception par le serveur de TEEQA.
const hm = (x) => fmtTime(x);
export const heuresTxt = (pris, recu, { court = false } = {}) => !recu ? `${court ? 'prise' : 'Prise'} à ${hm(pris)} · pas encore reçue (hors réseau)` : recu.slice(0, 16) === pris.slice(0, 16) ? `${court ? 'prise et reçue' : 'Prise et reçue'} à ${hm(pris)}` : `${court ? 'prise' : 'Prise'} à ${hm(pris)} · reçue à ${hm(recu)}`;
const recuDe = (ph) => ph.sentAt || (ph.sync === 'synchronisee' ? ph.at : null);
const posTxt = (ph) => ph.pos ? `à ${ph.pos.m} m près du point du chantier` : '';
function photoTile(ph, { selectable = false, selected = false, n = 0 } = {}) {
  const sync = { synchronisee: null, envoi: 'Envoi…', en_attente: 'En file', hors_ligne: 'Hors ligne', echec: 'Échec' }[ph.sync];
  return `<button class="photo" data-act="${selectable ? 'pick' : 'photo'}" data-id="${ph.id}" ${selectable ? `aria-pressed="${selected}"` : ''}
    aria-label="Photo${n ? ` ${n}` : ''} ${ROLES[ph.by].label.toLowerCase()} du ${fmtFull(ph.at)}${photoPlace(ph) ? `, ${photoPlace(ph)}` : ''}${ph.correction ? `, correction v${ph.version}` : ''}"
    style="${selected ? 'outline:3px solid var(--success-edge);outline-offset:2px' : ''}">
    ${ph.dataUrl ? `<img src="${ph.dataUrl}" alt="">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction })}
    ${ph.correction ? `<span class="ph-ver">v${ph.version}</span>` : ''}
    <span class="ph-badge ${ph.sync === 'echec' ? 'warn' : ''}" ${sync ? '' : 'style="flex-direction:column;align-items:flex-start;gap:0;line-height:1.2"'}>${sync ? icon(ph.sync === 'echec' ? 'alert' : 'cloudUp', 'xs') + sync + ` · ${fmtTime(ph.at)}` : `<span>${fmtDate(ph.at)} · ${heuresTxt(ph.at, recuDe(ph), { court: true })}</span><span>${esc(photoPlace(ph))}</span>`}</span>
    ${selected ? `<span style="position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;background:var(--success);color:var(--night);display:grid;place-items:center">${icon('check', 'xs')}</span>` : ''}
  </button>`;
}

function photoSheet(p, s, ph) {
  openSheet(`<div style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:1;margin-bottom:14px"><button class="btn sm" data-act="sheet-close" aria-label="Fermer la photo" style="position:absolute;right:8px;top:8px;z-index:2;min-width:44px;min-height:44px;border-radius:22px;padding:0">${icon('close', 'sm')}</button>${ph.dataUrl ? `<img src="${ph.dataUrl}" alt="Photo" style="width:100%;height:100%;object-fit:cover">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction })}</div>
    <dl class="kv" style="margin:0 0 14px">
      <dt>Auteur</dt><dd>${esc(who(ph.by))}${who(ph.by) === ROLES[ph.by].name ? ` · ${ROLES[ph.by].label}` : ''}</dd>
      <dt>Prise le</dt><dd class="mono">${fmtFull(ph.at)} (heure du téléphone)</dd>
      <dt>Reçue le</dt><dd class="mono" data-testid="photo-recue">${recuDe(ph) ? `${fmtFull(recuDe(ph))} (heure du serveur de TEEQA)` : 'Pas encore reçue : gardée sur le téléphone, hors réseau'}</dd>
      ${(() => { const rc = recuDe(ph), d = rc ? Math.round((new Date(rc) - new Date(ph.at)) / 60000) : 0; return d > 10 ? `<dt>Écart</dt><dd data-testid="photo-ecart">Prise sans réseau, envoyée ${d >= 120 ? `${Math.round(d / 60)} h` : `${d} min`} plus tard, au retour du réseau ; les deux heures restent au dossier.</dd>` : ''; })()}
      <dt>Position</dt><dd>${ph.pos ? `Approximative, ${posTxt(ph)} (${esc(PLACE(p))})` : `Non relevée · ${esc(PLACE(p))} d'après l'adresse`}</dd>
      <dt>Caméra</dt><dd>${ph.perm === 'navigateur' ? 'Accès à la caméra accordé à TEEQA (ne certifie pas la photo)' : 'Autorisée'}</dd>
      ${ph.sync === 'synchronisee' ? '' : `<dt>Envoi</dt><dd>${{ envoi: 'En cours', en_attente: 'En file', hors_ligne: 'Hors ligne · part au retour du réseau', echec: 'Échec' }[ph.sync]}</dd>`}
      ${ph.correction ? `<dt>Version</dt><dd>Correction v${ph.version}</dd>` : ''}
      ${ph.caption ? `<dt>Légende</dt><dd>${esc(ph.caption)}</dd>` : ''}
    </dl><p class="meta" style="margin:0 0 6px">${esc(REGLES.photos)}</p><button class="btn block" data-act="sheet-close" data-testid="photo-fermer" style="margin-top:8px">${icon('close', 'sm')}Fermer la photo</button>`, { label: 'Détail de la photo' });   // vague 26 (doigt : Ilyas) : une croix nette, qui ramène à la galerie
}

// Vague 12 : les points qui se mesurent reçoivent un petit champ (valeur + unité) ; l'avis les reprend en une ligne.
// Vague 18 NT (entreprises et contrôleurs) : la valeur attendue est écrite à côté du champ.
const MESURES = [[/enrobage/i, 'cm', (t) => /5 cm/.test(t) ? 'attendu : 5 cm au moins' : 'attendu : 3 cm au moins (hors sol)'], [/recouvrement/i, 'cm', () => 'attendu : 50 diamètres au moins (60 cm pour un acier de 12)'], [/épaisseur/i, 'cm', () => 'attendu : celle du plan, ± 1 cm'], [/planéité/i, 'mm', () => 'attendu : 5 mm au plus sous la règle'], [/dimensions des fouilles/i, 'cm d’écart', () => 'attendu : 2 cm au plus']];
const dictee = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
const mesureOf = (t) => (MESURES.find(([rx]) => rx.test(t)) || [])[1] || '';
const attenduOf = (t) => { const m = MESURES.find(([rx]) => rx.test(t)); return m ? m[2](t) : ''; };
const mesuresTxt = (s, d) => [...draftPoints(s, d).map((t, i) => (d.mes || {})[i] && mesureOf(t) ? `${t.split(/[:(]/)[0].trim()} : ${d.mes[i]} ${mesureOf(t)}` : '').filter(Boolean), d.mesures || ''].filter(Boolean).join(' · ');
function stepper(s, idx = 0, n = 6, p = null) {
  const rv = latestReview(s), hp = p && holdPoint(p, s);
  // Vague 5 : à un point d'arrêt, « Ferraillage prêt » puis « Coulage déclaré » (une seule fin : le coulage).
  const items = [
    ['Début déclaré', !!s.startedAt, s.startedAt, stepIcon3D(idx, n, 40)],
    [endWord(p, s), !!s.endDeclaredAt, firstEndAt(s), icon('camera')],
    isControlled(s) ? [s.status === 'corrigee' ? 'Réserves levées' : rv ? `Avis ${avisLabel(rv.verdict)}${hp ? ' (ferraillage)' : ''}${enContreVisite(s) ? ' · contre-visite à faire' : ''}` : 'Avis signé', !!rv, s.status === 'corrigee' && levee(s) ? levee(s).at : rv && rv.signedAt, icon('pen')] : ['Vue par le client', s.status === 'vue', s.status === 'vue' && (s.history.filter(h => h.type === 'seen').pop() || {}).at, icon('pen')],
    ...(hp ? [['Coulage déclaré', !!s.coulage, s.coulage && s.coulage.at, icon('flag')]] : []),
    ['Paiement (hors appli)', !!s.decision, s.decision && s.decision.at, icon('wallet')],
  ];
  // Jalons (06-composants.md) : barre 3 px — grise à venir, safran en cours, vert validé, rouge réserve
  const firstOpen = items.findIndex(([, ok]) => !ok);
  const active = s.status !== 'verrouillee';
  return `<ol class="jalons" aria-label="Avancement de l'étape" ${items.length > 4 ? 'style="grid-template-columns:repeat(5,1fr);gap:6px"' : ''}>${items.map(([t, ok, at, ic], i) => {
    const cls = ok ? (i === 2 && rv && rv.verdict !== 'validee' ? (rv.verdict === 'refusee' ? 'red' : 'pise') : 'ok') : (active && i === firstOpen ? 'saffron' : '');
    // Une icône par jalon (12 nov.) : l'icône de l'étape pour le début, l'appareil photo pour la fin déclarée, le stylo pour l'avis, la carte pour la décision.
    return `<li class="${ok ? 'done' : ''}"><span class="j-ic">${ic}</span><span class="bar3 ${cls}"></span><span class="jt" style="color:${ok ? 'var(--ink)' : 'var(--ink-3)'}">${t}</span><span class="meta" style="font-size:10.5px">${at ? fmtDate(at) : '—'}</span></li>`; }).join('')}</ol>`;
}

function reviewCard(rv, s, current = true) {
  // Vague 7 (jury, incohérence 2) : après la levée des réserves, l'avis le dit et ses points « à reprendre » sont dits repris.
  const lv = current && s.status === 'corrigee' ? levee(s) : null, ent = get().role === 'entreprise', sg = rv.signataire;
  return `<div class="review-card v-${rv.verdict}">
    <div class="row" style="justify-content:space-between"><span class="chip ${rv.verdict === 'validee' ? 'success' : rv.verdict === 'retardee' ? 'pise' : 'danger'}">${icon(VERDICTS[rv.verdict].icon, 'xs')}Avis ${avisLabel(rv.verdict)}</span><span class="meta">${lv ? 'Réserves levées' : current ? 'Avis en vigueur' : 'Avis antérieur'}</span></div>
    ${lv ? `<div class="notice success" style="margin-top:8px" data-testid="avis-leve">${icon('checkCircle', 'sm')}<span><b>Réserves levées le ${fmtFull(lv.at)}</b> : la correction v${lv.version} a été contrôlée et jugée conforme. Les points marqués « À reprendre » ci-dessous ont été repris.</span></div>` : ''}
    ${rv.contreVisite ? `<div class="meta" style="margin-top:8px" data-testid="portee-avis"><b>Contre-visite</b> · cet avis couvre ${(rv.portee || []).length > 1 ? 'les points revus' : 'le point revu'} : ${esc((rv.portee || []).join(' ; ') || 'la correction')}.</div>` : ''}
    ${!(rv.motif || '').trim() ? `<p class="meta" style="margin-top:10px" data-testid="sans-motif">Sans motif écrit (facultatif pour un avis Validé).</p>` : `<p style="margin-top:10px" ${langOf(get().role) !== 'fr' ? 'data-notr lang="fr" dir="ltr"' : ''}>«&nbsp;${esc(rv.motif)}&nbsp;»</p>${(() => { const L = langOf(get().role); if (L === 'fr') return listenBtn(`Avis ${avisLabel(rv.verdict)}. ${rv.motif}`, 'fr');
      const t = readMessage({ text: rv.motif, lang: 'fr' }, L);   // vague 8 : l'avis du contrôleur, traduit dans la langue du lecteur (indicatif)
      return t.translated ? `<p class="msg-text" data-notr lang="${LANGS[L].html}" dir="${LANGS[L].dir}" data-testid="avis-traduit">${esc(t.text)}</p><div class="tr-note" data-notr>${icon('globe', 'xs')}<span>${esc(tradLabel('fr', L))} · ${esc(indicNote(L))}</span></div>${listenBtn(t.text, L)}` : listenBtn(rv.motif, 'fr'); })()}`}
    ${lv ? pointsList({ ...rv, points: (rv.points || []).map(x => x.state === 'ko' ? { ...x, label: x.label + ' · repris, réserve levée' } : x) }) : pointsList(rv)}
    ${rv.mesures ? `<div class="meta" style="margin-top:6px"><b>Mesures relevées :</b> ${esc(rv.mesures)}</div>` : ''}
    ${rv.pieces.length ? `<div class="meta" style="margin-top:8px">${rv.pieces.length} pièce${rv.pieces.length > 1 ? 's' : ''} jointe${rv.pieces.length > 1 ? 's' : ''}</div>
      <div class="photo-grid" style="grid-template-columns:repeat(4,1fr);margin-top:6px">${rv.pieces.map(id => s.photos.find(p => p.id === id)).filter(Boolean).map(ph => photoTile(ph)).join('')}</div>` : ''}
    <div class="sig-mini">${signatureSVG(rv.signature)}</div>
    ${rv.verdict === 'retardee' ? `<div class="meta" style="margin-top:6px" data-testid="recheck"><b>${rv.recheck === 'visite' ? 'Réserve de structure ou d’ouvrage caché' : 'Réserve de finition'}</b> · ${rv.recheck === 'visite' ? 'correction contrôlée par une contre-visite sur place' : 'correction contrôlée sur photo, sans nouvelle visite'}</div>` : ''}
    <div class="meta" data-testid="avis-heures">Signé par ${esc(who('controleur'))} · ${fmtDate(rv.signedAt)} · ${rv.recuAt ? heuresTxt(rv.signedAt, rv.recuAt).replace('Prise et reçue', 'Signé et reçu').replace('Prise', 'Signé').replace('reçue', 'reçu') + ' (heure du serveur de TEEQA)' : `signé à ${fmtTime(rv.signedAt)} (téléphone) · pas encore reçu : l’heure du serveur de TEEQA s’ajoute à la réception`}${rv.sentAt ? ` (sans réseau : visible ${(() => { const mn = Math.max(0, Math.round((new Date(rv.sentAt) - new Date(rv.signedAt)) / 60000)); return mn >= 60 ? `${Math.floor(mn / 60)} h ${String(mn % 60).padStart(2, '0')}` : `${mn} min`; })()} après la signature ; le coulage attend l'avis reçu)` : ''} · empreinte ${empreinte({ v: rv.verdict, m: rv.motif, p: rv.points, at: rv.signedAt })}</div>
    ${sg ? `<div class="meta" data-testid="signataire-avis">Signataire identifié : code à usage unique${sg.carte && !ent ? ` · carte professionnelle ${esc(sg.carte)}` : ' · carte professionnelle vérifiée par l’agence'}${sg.agence ? ` · cosigné par ${esc(sg.agence)}, qui répond de son contrôleur` : ''}.</div>` : ''}
    <div class="meta" data-testid="preuve">${PREUVE}</div>
    ${rv.observation ? `<div class="sys-msg" style="text-align:left;margin-top:8px" data-testid="observation"><b>Observation de ${esc(who('entreprise'))}</b> · ${fmtFull(rv.observation.at)}<br>« ${esc(rv.observation.text)} »${rv.observation.photo ? `<br>${icon('camera', 'xs')} Photo jointe` : ''}<br><span class="meta">Jointe au dossier ; elle ne change pas l'avis.</span></div>` : ''}
    ${rv.reponse ? `<div class="sys-msg" style="text-align:left;margin-top:8px" data-testid="droit-reponse"><b>Réponse du contrôleur</b> · ${fmtFull(rv.reponse.at)}<br>« ${esc(rv.reponse.text)} »</div>` : ''}
  </div>`;
}

// Vague 5 : les points de la liste, plus ceux que le contrôleur a ajoutés.
const draftPoints = (s, d) => [...checkPoints(s), ...((d && d.extra) || [])];
// Vague 4 : ce que vaut la preuve, en deux lignes (avis, levée, rapport).
export const PREUVE = `${REGLES.preuve} Chaque partie signe, le contrôleur avec un code à usage unique ; tout s'exporte en PDF.`;
// Résumé pour néophyte : « payer ou attendre » (fonction primaire demandée par le prof, mots imposés : recommandé / différé).
// Vague 4 : c'est une recommandation au client, qui décide ; TEEQA ne retient jamais l'argent. À un point d'arrêt, l'avis
// porte sur le ferraillage : le paiement n'est recommandé qu'après le coulage déclaré par l'entreprise (étape réellement finie).
// Vague 5 : un désaccord clos est dit sur la carte de paiement (sinon le client croit qu'on recommande de payer malgré lui).
const ISSUE_TXT = { retrait: 'retiré par son auteur', accord: 'clos par un accord des deux parties', second_avis: 'clos par un second avis', export: 'exporté vers un médiateur' };
function advice(p, s, rv) { const a = advice0(p, s, rv), c = s.contest;
  if (a.ok && c && !c.open && c.closedAt) a.text += c.issue === 'retrait' && c.by === 'client' && get().role === 'client' ? ` Vous avez retiré votre désaccord du ${fmtFull(c.at)} le ${fmtFull(c.closedAt)}${c.motifRetrait ? ` (« ${esc(c.motifRetrait)} »)` : ''} : il n'est plus ouvert.` : ` Le désaccord du ${fmtFull(c.at)} a été ${ISSUE_TXT[c.issue] || 'clos'} le ${fmtFull(c.closedAt)} : il n'est plus ouvert.`;
  return a; }
function advice0(p, s, rv) {
  if (s.contest && s.contest.open) return { ok: false, title: 'Paiement différé', text: "Un désaccord est ouvert sur cette étape. Pour le client : attendre qu'il soit clos (accord, retrait, ou second avis quand il est ouvert sur cet avis) est possible ; l'échéance de la tranche reste celle de la règle, 7 jours après l'avis favorable (ou le coulage déclaré), et le désaccord est dit à côté." };
  const lv = levee(s);
  if (coulageDue(p, s)) return { ok: false, title: 'Paiement différé', text: `${s.status === 'corrigee' ? 'Les réserves sont levées' : 'Le contrôleur a validé le ferraillage'}. L'entreprise coule maintenant le béton et le déclare avec 2 photos : le paiement sera recommandé à ce moment-là.` };
  if (s.status === 'corrigee') return { ok: true, title: 'Paiement recommandé', text: `Le contrôleur a signé la levée des réserves${lv ? ` le ${fmtFull(lv.at)}` : ''}, d'après la photo de correction.${s.coulage ? ' Coulage déclaré.' : ''}` };
  if (s.status === 'correction_soumise') return { ok: false, title: 'Paiement différé', text: rv.recheck === 'visite' ? "Une correction est envoyée ; une contre-visite sur place est prévue. Attendez son avis." : "Une correction est envoyée ; le contrôleur la regarde sur photo. Attendez son retour." };
  if (rv.verdict === 'validee') return { ok: true, title: 'Paiement recommandé', text: s.coulage ? `<span>Ferraillage validé sur place, puis coulage déclaré avec 2 photos.</span> <span data-notr>${fmtFull(s.coulage.at)}</span>` : "Le contrôleur est passé sur place et a validé cette étape." };
  // Vague 5 : une réserve visible et mineure ne diffère pas toute la tranche. Étape finie : paiement recommandé, sauf la part
  // liée à la réserve, gardée jusqu'à sa levée. À un point d'arrêt, le béton n'est pas coulé : l'étape n'est pas finie.
  if (rv.verdict === 'retardee' && rv.recheck !== 'visite') {
    if (holdPoint(p, s)) return { ok: false, title: 'Paiement différé', text: "L'étape n'est pas close : le béton n'est pas encore coulé. L'entreprise corrige, un contrôleur repasse, puis elle coule. Une fois le coulage déclaré, le paiement sera recommandé." };
    return { ok: true, partial: true, title: 'Paiement recommandé, sauf la part liée à la réserve', text: "La réserve porte sur une finition, mineure : vous pouvez payer la tranche en gardant la part du point à corriger, jusqu'à la levée des réserves. Cette part, c'est la ligne du devis qui correspond au point ; si le devis ne la détaille pas, la convention la fixe au prorata des points à reprendre." };
  }
  if (rv.verdict === 'retardee') return { ok: false, title: 'Paiement différé', text: "Le contrôleur a émis une réserve sur la structure ou un ouvrage caché. Attendez la correction et la contre-visite." };
  return { ok: false, title: 'Paiement différé', text: "Le contrôleur a refusé cette étape : le travail est à reprendre, puis contrôlé de nouveau sur place." };
}
const DECIDE_LINE = "Recommandation au client, qui décide. Le paiement se fait hors TEEQA, qui ne retient jamais l'argent.";
// Vague 3 : la dernière levée de réserves signée (correction jugée conforme par le contrôleur).
const rv0 = (s) => s.reviews[s.reviews.length - 1] || {};
const levee = (s) => { const c = [...s.corrections].reverse().find(x => x.levee); return c ? { ...c.levee, version: c.version } : null; };
function leveeCard(s) {
  const lv = levee(s); if (!lv) return '';
  return `<div class="review-card v-validee" data-testid="levee"><div class="row" style="justify-content:space-between"><span class="chip success">${icon('checkCircle', 'xs')}Levée des réserves</span><span class="meta">Correction v${lv.version}</span></div>
    <p style="margin-top:10px">Les réserves de l'avis sont levées : la correction v${lv.version} a été contrôlée sur photo et jugée conforme${lv.note ? ` (« ${esc(lv.note)} »)` : ''}.</p>
    ${lv.signature ? `<div class="sig-mini">${signatureSVG(lv.signature)}</div>` : ''}
    <div class="meta">Signée par ${esc(who('controleur'))} · ${fmtFull(lv.at)}</div>
    <div class="meta">Contrôle sur photo, sans nouvelle visite · empreinte ${empreinte({ s: s.id, lv })}</div>${def('levee')}</div>`;
}
// Panel du 19 nov. (n° 7) : une réponse claire au client, en haut de l'étape, avec un seul bouton principal.
// 20 nov. : tranche sur le compte de séquestre (REGLES.sequestre) : le client fait verser, ou s'oppose ; rien d'autre.
function seqBanner(p, s) {
  const ok = doneLike(s, p), q = s.sequestre;
  return `<div class="advice keep ${ok && !q.opposition ? 'ok' : 'wait'}" data-testid="seq-banner">
    <div class="row" style="gap:12px"><span class="ico-tile ${ok && !q.opposition ? 'success' : 'saffron'}">${icon('shield')}</span>
      <div class="grow"><div class="advice-title"><span>${q.opposition ? 'Opposition au versement' : ok ? 'Paiement recommandé' : 'Tranche sur le compte de séquestre'}</span> · <span>Tranche ${p.steps.indexOf(s) + 1}</span></div><div class="meta">${esc(seqEtatTxt(p, s))}</div></div></div>
    ${ok ? `<div class="stack" style="gap:6px;margin-top:10px"><button class="btn success block" data-act="seq-verser" data-testid="seq-verser">${icon('wallet', 'sm')}${q.opposition ? 'Lever mon opposition et faire verser' : 'Faire verser à l’entreprise'}</button>${q.opposition ? '' : `<button class="btn text" style="font-size:13.5px;justify-self:center" data-act="seq-opposer" data-testid="seq-opposer">Je m'oppose au versement</button>`}</div>` : `<p class="meta" style="margin:8px 0 0" data-testid="seq-opposer-plus-tard">La banque ne verse rien avant l’avis favorable. Le bouton « Je m’oppose au versement » apparaît ici à ce moment-là, jusqu’à la date de versement d’office.</p>`}
    <details class="def"><summary class="meta">${icon('info', 'xs')}Règle du séquestre</summary><p class="meta">${esc(REGLES.sequestre)}</p></details></div>`;
}
function payBanner(p, s, rv, r) {
  if (r === 'client' && seqSurCompte(s) && p.status !== 'clos' && access(p, r) === 'ok') return seqBanner(p, s);
  if (r !== 'client' || !rv || s.status === 'fin_declaree' || s.decision || p.status === 'clos' || access(p, r) !== 'ok') return '';
  const a = advice(p, s, rv);
  const main = a.ok
    ? (can(r, p, s, 'decide') ? `<button class="btn success block" data-act="paid">${icon('wallet', 'sm')}J'ai payé cette tranche</button>` : '')
    : can(r, p, s, 'askVisit') ? `<button class="btn block" data-act="ask-visit">${icon('pin', 'sm')}Demander une visite sur place</button>`
    : `<button class="btn block" data-go="#/c/${p.id}/step/${s.id}/thread?k=question">${icon('message', 'sm')}Poser une question</button>`;
  // Vague 9 : la carte dit en deux lignes quoi faire (titre imposé, montant, échéance) ; le pourquoi et les règles se replient.
  return `<div class="advice keep ${a.ok ? 'ok' : 'wait'}" data-testid="advice">
    <div class="row" style="gap:12px"><span class="ico-tile ${a.ok ? 'success' : 'saffron'}">${icon(a.ok ? 'checkCircle' : 'pause')}</span>
      <div class="grow"><div class="advice-title"><span>${a.partial ? 'Paiement recommandé, sauf une part' : a.title}</span> · <span>Tranche ${p.steps.indexOf(s) + 1}</span></div>${trancheDh(p, s) ? `<div class="price-line" data-testid="tranche-dh"><b>${dh(trancheDh(p, s))}</b>${deviseVue() ? `<span class="meta" style="display:block">≈ ${enDeviseTaux(trancheDh(p, s), deviseVue())}</span>` : ''} <span class="meta">selon votre devis${echeance(p, s) && a.ok ? ` · échéance le ${fmtDate(echeance(p, s))}` : ''}</span>${(s.partiels || []).length ? `<div class="meta" data-testid="tranche-reste">${esc(resteDuTxt(p, s)).replace(/^r/, 'R')}</div>` : ''}</div>` : ''}${a.ok && echeance(p, s) && deviseVue() && pays() !== 'MA' && !retardJours(p, s) ? `<div class="meta" data-testid="virement-avant">Virement depuis l’étranger : 2 à 4 jours ouvrés. Envoyez-le avant le ${fmtDate(new Date(+new Date(echeance(p, s)) - 4 * 864e5))}.</div>` : ''}</div></div>${a.ok ? retardLine(p, s) : ''}
    <div class="stack" style="gap:6px;margin-top:10px">${main}${can(r, p, s, 'decide') && a.ok ? `<button class="btn text" style="font-size:13.5px;justify-self:center" data-act="wait">Je préfère attendre</button>` : ''}</div>
    <details class="def" data-testid="advice-why"><summary class="meta">${icon('info', 'xs')}Pourquoi ?</summary><p class="meta"><span>${a.text}</span> ${DECIDE_LINE}</p>${!a.ok && can(r, p, s, 'decide') ? `<button class="btn ghost block" style="margin-top:6px" data-act="paid" data-testid="deja-paye">Déjà payé avant cet avis : le noter</button>` : ''}</details></div>`;
}
// Vague 8 : le montant de la tranche (devis), l'échéance et qui décide, vus par l'entreprise.
const retardLine = (p, s) => { const n = retardJours(p, s); return n ? `<div class="notice danger keep" data-testid="retard-tranche">${icon('clock', 'sm')}<span><b>Échéance de la tranche dépassée de ${n} jour${n > 1 ? 's' : ''}</b> (échéance du ${fmtDate(echeance(p, s))})${(s.partiels || []).length && trancheDh(p, s) ? ` : ${resteDuTxt(p, s)}` : ''}.${s.payLateAt ? ` Relance de l'entreprise le ${fmtFull(s.payLateAt)}.` : ''} Le retard reste écrit au dossier, jour par jour ; d'éventuelles pénalités sont celles de votre devis : TEEQA ne les calcule ni ne les encaisse.</span></div>` : ''; };
function payFacts(p, s) {
  const e = echeance(p, s), m = trancheDh(p, s);
  return `<dl class="kv" style="margin:6px 0 0" data-testid="pay-facts">${m ? `<dt>Montant</dt><dd><b>${dh(m)}</b> · selon le devis</dd>` : ''}${e ? `<dt>Échéance</dt><dd>${fmtFull(e)} (7 jours après ${dueApres(p, s)}, convention)</dd>` : ''}<dt>Qui décide</dt><dd data-testid="qui-decide">${esc(decideursLine(p))}</dd></dl>`;
}
// État de la tranche : le client voit sa décision et la confirmation de l'entreprise ; l'entreprise voit seulement l'état ; le contrôleur rien.
// Vague 20 (doigt : Leila, Hamid) : « Prochain paiement » en haut de l'étape, avant tout avis : montant, quand, et pourquoi
// pas maintenant. Le client voit le bouton « J'ai payé cette tranche » grisé, avec la raison ; l'entreprise lit quand l'argent arrive.
function payNext(p, s, r) {
  if (!['client', 'entreprise'].includes(r) || p.status === 'clos' || s.decision || s.sequestre || access(p, r) !== 'ok' || (r === 'entreprise' && pourSortante(p, s))) return '';
  const m = trancheDh(p, s); if (!m) return '';
  const e = echeance(p, s), n = p.steps.indexOf(s) + 1;
  const est = e ? null : echeanceEstimee(p, s);
  const quand = e ? `au plus tard le ${fmtDate(e)}` : est ? `vers le ${fmtDate(est)} (7 jours après ${holdPoint(p, s) ? 'le coulage' : 'l’avis'})` : `7 jours après ${dueApres(p, s)}`;
  const pourquoi = s.status === 'verrouillee' || s.status === 'a_venir' ? 'l’étape n’a pas commencé' : coulageDue(p, s) ? 'coulage pas encore déclaré' : isControlled(s) ? 'avis du contrôleur attendu' : 'déclaration pas encore consultée';
  const montant = `<b>${dh(phraseArgent(p, s, r) ? phraseArgent(p, s, r).m : m)}</b>`;
  // Vague 23 (doigt : Mustapha) : une phrase courte, sans jargon : qui paie, combien, vers quand, ce qui manque.
  const manque = s.status === 'verrouillee' || s.status === 'a_venir' ? 'l’étape doit commencer' : coulageDue(p, s) ? 'le coulage à déclarer' : isControlled(s) ? `la visite du contrôleur${holdPoint(p, s) && !s.coulage ? ', puis le coulage' : ''}` : 'le client doit consulter votre déclaration';
  // Vague 24 (doigt : Abdelkader, Driss) : la phrase d'argent en gros, la même que sur Mes chantiers ; plus de « différé » à côté d'une date.
  const ph = phraseArgent(p, s, r); if (!ph) return '';
  if (r === 'entreprise') return `<div class="pay-next keep pa-bloc${ph.du ? ' pa-du' : ''}" data-testid="pay-next" data-listen>${icon('wallet', 'sm')}<span class="grow"><span class="over">Tranche ${n} · quand l’argent arrive</span><b class="pa-gros" data-testid="argent-gros">${esc(ph.gros)}</b><span class="meta" data-testid="next-date">${ph.sous ? `${esc(ph.sous)}` : ''}</span><span data-notr hidden data-testid="next-dh">${dh(m)}</span></span></div>`;
  // Vague 21 (doigt : Samira ; 4 groupes) : le montant en dirhams, l'équivalent dessous ; plus de bouton « J'ai payé cette tranche » tant que rien n'est dû.
  const dv = deviseVue(), loin = dv && pays() !== 'MA';
  // Vague 22 (jury n° 7) : 4 jours OUVRÉS avant la date limite (samedi et dimanche sautés), plus 4 jours de calendrier.
  const envoi = e && loin ? (() => { const d = new Date(e); let k = 0; while (k < 4) { d.setDate(d.getDate() - 1); if (![0, 6].includes(d.getDay())) k++; } return d; })() : null;
  // Vague 25 (5 personas) : « Rien à payer maintenant » sur l'étape 4 alors que les tranches 2 et 3 sont dues : on le dit, ici même.
  // Vague 26 (3 groupes) : plus de « Rien à payer » à côté de « À payer d’abord : tranche 2 » : une seule phrase dit la tranche à régler.
  const autres = autresDues(p, s);
  const avant = autres.length && !ph.du, dues = autres.map(o => `tranche ${o.q.i}, ${o.q.gros.replace(/^Payez /, '').replace(' : ', ', ')}`).join(' ; ');
  const gros = avant ? `Réglez d’abord la ${dues}` : ph.gros;
  return `<div class="pay-next keep pa-bloc${ph.du || avant ? ' pa-du' : ''}" data-testid="pay-next" data-listen>${icon('wallet', 'sm')}<span class="grow"><span class="over">${avant ? `Paiement dû · tranche ${autres.map(o => o.q.i).join(', ')}` : `${autres.length ? 'Paiement de cette étape' : 'Prochain paiement'} · tranche ${n}`}</span><b class="pa-gros" data-testid="argent-gros">${esc(gros)}</b>${avant ? `<a class="meta" href="#/c/${p.id}/budget" data-testid="autres-dues" style="color:var(--danger-ink)">Celle de cette étape (tranche ${n}) viendra après. Voir le Budget.</a>` : autres.length ? `<a class="meta" href="#/c/${p.id}/budget" data-testid="autres-dues" style="color:var(--danger-ink)"><b>À payer d’abord :</b> ${autres.map(o => `tranche ${o.q.i} (${esc(o.q.gros.replace(/^Payez /, ''))})`).join(' ; ')}. Voir le Budget.</a>` : ''}<span class="meta" data-testid="a-qui-payer">${esc(`À ${ph.a || who('entreprise')}, hors de TEEQA`)}</span>
    ${ph.sous ? `<span class="pa-sous" data-testid="next-date">${esc(ph.sous.replace(/ \(estimation d’après [^)]*\)$/, ' (estimation)'))}</span>` : `<span class="meta" data-testid="next-date">${ph.du ? `7 jours après ${dueApres(p, s)}${loin ? ', rappel 2 jours avant' : ''}.` : ''}</span>`}<span class="meta" data-testid="next-dh">${montant}${dv ? ` <span data-testid="next-devise">≈ ${enDeviseTaux(ph.m, dv)}</span>` : ''}</span>
    ${loin && envoi ? `<span class="meta" data-testid="next-virement">Virement depuis l’étranger : 2 à 4 jours ouvrés. Envoyez-le avant le ${fmtDate(envoi)}.</span>` : ''}</span></div>`;
}
// Vague 21 (jury n° 2) : un désaccord clos se lit sur l'étape, avec sa date et son issue (avant : seulement dans les échanges).
function contestClos(s, r) { const c = s.contest; if (!c || c.open || !c.closedAt || r === 'controleur') return '';
  return `<div class="notice success keep" data-testid="contest-clos">${icon('checkCircle', 'sm')}<span><b>Désaccord du ${fmtDate(c.at)} ${ISSUE_TXT[c.issue] || 'clos'}</b> le ${fmtDate(c.closedAt)}. Il ne retient plus le chantier.</span></div>`; }
// Vague 24 (doigt : Rkia, zoom 150 %) : sur un petit écran (ou un texte agrandi), la zone de réponse des échanges est repliée
// derrière « Répondre » : la place va aux messages, et le dernier se lit en entier, avec son bouton « Écouter ».
const petitEcran = () => { try { return window.innerHeight < 640; } catch { return false; } };
// Vague 20 (doigt : Fatima) : le dernier message reçu, lisible sur l'étape, sans chercher dans Activité.
function lastMsgRow(p, s, r, base) {
  if (r === 'controleur' && missionPending(s)) return '';   // vague 23 (contrôleurs, 3 fiches) : pas de message d'ouvrier sur une mission proposée
  const m = [...(s.messages || [])].reverse().find(x => x.kind !== 'system' && x.role !== r && x.kind !== 'prive'); if (!m) return '';
  const t = readMessage(m, langOf(r)).text || (m.voice ? 'Message vocal' : m.pic ? 'Photo' : ''); if (!t) return '';
  return `<button class="last-msg keep" data-go="${base}/thread" data-testid="last-msg">${roleAvatar(m.role, 30)}<span class="grow"><span class="over" data-notr>${esc(m.by && m.role !== 'controleur' ? m.by : who(m.role))} · ${fmtDate(m.at)}</span><span class="lm-t" data-listen>« ${esc(t.length > 46 ? t.slice(0, 44).replace(/\s+\S*$/, '') + '…' : t)} »</span></span>${icon('chevron', 'sm')}</button>`;
}
function trancheCard(p, s, r, base) {
  const dc = s.decision; if (r === 'controleur') return '';
  // 20 nov. : séquestre. L'entreprise voit que la tranche est sur le compte de la banque (argent sur le compte de la banque), puis son versement.
  if (s.sequestre) { const q = s.sequestre; if (r === 'client' && !q.verseAt && p.status !== 'clos') return '';
    return `<div class="card row" style="gap:12px" data-testid="seq-tranche"><span class="ico-tile ${q.verseAt ? 'success' : 'saffron'}">${icon('shield')}</span><div class="grow">${q.verseAt ? `<div style="margin-bottom:6px"><span class="chip success" data-testid="solde">${icon('lock', 'xs')}Tranche soldée</span></div>` : ''}<div class="over">${esc(trancheName(p, s))}</div>
      <b>${q.verseAt ? `Versée par ${esc(SEQUESTRE.banque)}` : r === 'entreprise' ? `Sur le compte de ${esc(SEQUESTRE.banque)} : versée à la confirmation du client, ou d’office 5 jours après l’échéance sans opposition` : `Sur le compte de ${esc(SEQUESTRE.banque)}`}</b><div class="meta">${esc(seqEtatTxt(p, s))}</div>${r === 'entreprise' && !q.verseAt ? payFacts(p, s) : ''}</div></div>`; }
  // Vague 6 : l'entreprise voit l'état du paiement de chaque tranche, même avant que le client ait indiqué quoi que ce soit.
  if (!dc && r === 'entreprise') { const rv0 = latestReview(s); if (!rv0 || s.status === 'fin_declaree') return '';
    const a = advice(p, s, rv0);
    return `<div class="card row" style="gap:12px" data-testid="paiement-entreprise"><span class="ico-tile ${a.ok ? 'success' : 'saffron'}">${icon('wallet')}</span><div class="grow"><div class="over">${esc(trancheName(p, s))}</div>
      <b>Le client lit : « ${esc(a.title)} »</b><div class="meta">${esc(a.text.replace(/<[^>]+>/g, ''))}</div>
      <div class="meta">${a.ok ? "Le client n'a encore rien indiqué. Vous serez prévenu dès qu'il indique « J'ai payé cette tranche » ou qu'il préfère attendre (avec un motif)." : (coulageDue(p, s) ? "La tranche sera due 7 jours après votre coulage déclaré. Vous serez prévenu dès que le client indique « J'ai payé cette tranche »." : (holdPoint(p, s) && !s.coulage ? "Rien n'est encore dû : la tranche le sera 7 jours après votre coulage déclaré, qui suit l'avis favorable. Vous serez prévenu si le client verse une partie avant." : "Rien n'est encore dû : la tranche le sera 7 jours après l'avis favorable. Vous serez prévenu si le client verse une partie avant."))}</div>
      ${payFacts(p, s)}${retardLine(p, s)}${s.payLateAt && !retardJours(p, s) ? `<div class="meta" style="color:var(--danger-ink)" data-testid="pay-late-done">Relance envoyée au client le ${fmtFull(s.payLateAt)}.</div>` : s.payLateAt ? '<span data-testid="pay-late-done" hidden></span>' : ''}${can(r, p, s, 'payLate') ? `<button class="btn sm ghost" style="margin-top:6px" data-act="pay-late" data-testid="pay-late">${icon('clock', 'sm')}Relancer le client : paiement non reçu</button>` : ''}${def('paiementE')}</div></div>`; }
  if (!dc) return '';
  // Vague 3 : le justificatif se voit (vignette et date) chez le client et chez l'entreprise ; l'entreprise confirme la réception.
  const proof = dc.proof ? `<div class="meta">${icon('image', 'xs')} <span>Justificatif photo joint</span> <span data-notr>${fmtFull(dc.proofAt || dc.at)}</span></div><button class="btn sm ghost" style="margin-top:6px" data-act="proof" data-testid="proof">${icon('image', 'sm')}Voir le justificatif</button>` : '';
  const debat = solde(s) ? `<div class="meta">Pour un désaccord sur cette tranche, passez par les <button class="linklike" data-go="${base}/thread">échanges</button>.</div>` : '';
  // Vague 3 : la puce « Tranche soldée » passe au-dessus du texte (à droite, elle écrasait la colonne à 360 px).
  const soldeChip = solde(s) ? `<div style="margin-bottom:6px"><span class="chip success" data-testid="solde">${icon('lock', 'xs')}Tranche soldée</span></div>` : '';
  const right = !solde(s) && can(r, p, s, 'undoDecision') ? `<button class="btn sm ghost" data-act="undo-decision">Modifier</button>` : '';
  const tn = `<div class="over">${esc(trancheName(p, s))}</div>`;
  const wait = dc.status === 'attend' ? `<div class="meta"><b>Motif du client :</b> « ${esc(dc.motif || '')} » · ${dc.until ? `relance possible à partir du ${fmtFull(dc.until)}` : ''}</div>` : '';
  if (r === 'entreprise') return `<div class="card row" style="gap:12px"><span class="ico-tile ${dc.receivedAt ? 'success' : ''}">${icon('wallet')}</span><div class="grow">${soldeChip}${tn}
    <b>${dc.status === 'indique' ? "Le client indique : « J'ai payé cette tranche »" : 'Le client préfère attendre avant de payer'}</b>
    <div class="meta">${dc.status === 'indique' ? `Indiqué le ${fmtFull(dc.at)} · hors TEEQA, non vérifié` : `Depuis le ${fmtFull(dc.at)} · paiement hors TEEQA`}</div>${payLine(dc)}${dc.status === 'indique' ? proof : wait}
    ${dc.receivedAt ? `<div class="meta" style="color:var(--success-ink)">Vous avez confirmé la réception le ${fmtFull(dc.receivedAt)}</div>` : ''}${debat}</div>${right}</div>`;
  return `<div class="card row" style="gap:12px"><span class="ico-tile ${dc.receivedAt ? 'success' : ''}">${icon('wallet')}</span><div class="grow">${soldeChip}${tn}
    <b>${dc.status === 'indique' ? "J'ai payé cette tranche" : 'Je préfère attendre'}</b>
    <div class="meta"><span>${dc.status === 'indique' ? 'Hors TEEQA · non vérifié' : 'Vous attendez · votre choix'}</span> · <span data-notr>${fmtFull(dc.at)}</span></div>${payLine(dc)}${dc.status === 'indique' ? proof : wait}
    ${/* Vague 25 (Île-de-France) : l'état du paiement en une ligne forte, des deux côtés ; TEEQA ne détient jamais l'argent. */''}${dc.receivedAt ? `<div class="meta" style="color:var(--success-ink)" data-testid="paye-confirme"><b>Payé · confirmé par <span data-notr>${esc(who('entreprise'))}</span> le <span data-notr>${fmtFull(dc.receivedAt)}</span></b> · tranche soldée. L’argent est allé directement à l’entreprise, pas à TEEQA.</div>` : dc.status === 'indique' ? `<div class="meta" data-testid="paye-attente"><b>Déclaré, en attente de confirmation</b> par <span data-notr>${esc(who('entreprise'))}</span> (elle indique « Paiement reçu » dès que l’argent arrive).</div>` : ''}${debat}</div>${right}</div>`;
}
const payLine = (dc) => [dc.transit ? `<span data-testid="transit">Virement en transit, ordre du ${fmtDate(dc.at)} : il compte à cette date</span>` : '', dc.dh ? `<span data-notr>${dh(dc.dh)}</span> <span>selon le devis</span>` : '', dc.moyen === 'sequestre' ? `<span>Par le compte de séquestre de ${SEQUESTRE.banque}</span>` : '', dc.moyen && MOYENS[dc.moyen] ? `<span>${MOYENS[dc.moyen]}</span>` : '', dc.payer ? `<span>Payée par</span> <span data-notr>${esc(dc.payer)}</span>` : '', dc.ref ? `<span>Référence du virement</span> <span data-notr>${esc(dc.ref)}</span>` : '', dc.by ? `<span>Indiqué par</span> <span data-notr>${esc(dc.by)}</span>` : ''].filter(Boolean).map(t => `<div class="meta" data-testid="pay-line">${t}</div>`).join('');
// Feuille « J'ai payé cette tranche » : justificatif, référence de virement et payeur facultatifs.
export function paidSheet(pid, sid, { transit: tr = false } = {}) {
  const p0 = project(pid), s0 = step(p0, sid);
  openSheet(`<h2>J'ai payé cette tranche</h2><div class="over" style="margin-bottom:6px">${esc(trancheName(p0, s0))}</div>
    <p class="muted small" style="margin-bottom:14px">Le paiement se fait hors TEEQA, qui ne détient pas l'argent et ne vérifie pas les virements. L'entreprise est prévenue et confirme la réception.${trancheDh(p0, s0) ? ` Montant de cette tranche selon votre devis : <b>${dh(trancheDh(p0, s0))}</b>.` : ''}${seqActif(p0) ? ` Vous avez choisi le séquestre : pour que ${esc(SEQUESTRE.banque)} garde cette tranche, versez-la plutôt sur le compte de séquestre (Budget).` : ''}</p>
    ${pays() !== 'MA' ? `<details class="def" data-testid="pay-etranger" open><summary class="meta">${icon('globe', 'xs')}Payer ${esc((PAYS[pays()] || {}).de || 'depuis l’étranger')} : comment faire</summary><ol class="meta" style="margin:6px 0 10px;padding-left:18px;display:grid;gap:4px"><li>Virement international vers le RIB de l’entreprise (24 chiffres, sur son devis), ou transfert d’argent à son nom.</li><li>Motif : « ${esc(p0.name)} · tranche ${p0.steps.indexOf(s0) + 1} ».</li><li>Délai : 2 à 5 jours ouvrés ; les frais et le taux sont ceux de votre banque.</li><li>Gardez l’avis de virement et joignez-le ci-dessous.</li></ol></details>` : ''}
    <label class="card row" style="gap:12px;cursor:pointer"><input type="checkbox" id="paid-proof" style="width:22px;height:22px;accent-color:var(--success)"><span class="grow"><b>Joindre un justificatif</b><div class="meta">Photo du reçu ou du virement · facultatif</div></span>${icon('image', 'sm')}</label>
    <div class="field" style="margin-top:10px"><label for="paid-moyen">Comment ?</label><select id="paid-moyen" class="input" data-testid="paid-moyen">${Object.entries(MOYENS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
    <div class="field" style="margin-top:10px"><label for="paid-ref">Référence du virement ou n° du chèque <span class="meta">(facultatif)</span></label><input id="paid-ref" class="input" maxlength="40" autocomplete="off" placeholder="Ex. VIR 2611-48213, n° de transfert ou n° du chèque" data-testid="paid-ref"></div>
    <div class="field" style="margin-top:10px"><label for="paid-payer">Payée par <span class="meta">(si ce n'est pas vous : un proche, une banque…)</span></label><input id="paid-payer" class="input" maxlength="60" autocomplete="off" placeholder="Ex. Mohamed, mon père" data-testid="paid-payer"></div>
    <label class="card row" style="gap:12px;cursor:pointer;margin-top:10px" data-testid="paid-transit"><input type="checkbox" id="paid-transit" ${tr ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--success)"><span class="grow"><b>Virement envoyé, encore en transit</b><div class="meta">Le paiement compte à la date de l’ordre (aujourd’hui) : aucun retard ne court pendant les jours de transit. L’entreprise confirme à l’arrivée.</div></span></label>
    <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn success" data-paid-ok>J'ai payé cette tranche</button></div>`, {
    label: "J'ai payé cette tranche",
    onMount: (el) => el.querySelector('[data-paid-ok]').addEventListener('click', () => {
      const proof = el.querySelector('#paid-proof').checked, ref = el.querySelector('#paid-ref').value, payer = el.querySelector('#paid-payer').value, moyen = el.querySelector('#paid-moyen').value, transit = el.querySelector('#paid-transit').checked;
      actions.decide(pid, sid, 'indique', { ...(proof ? { proof: 'photo' } : {}), ref, payer, moyen, transit }); closeSheet(); sfx('send');
      recompense(proof ? 'Paiement indiqué · justificatif joint' : 'Paiement indiqué (hors de l’appli)');
    }) });
}
// Vague 4 : « Je préfère attendre » demande un motif ; l'entreprise le lit et peut relancer après 7 jours.
function waitSheet(pid, sid) {
  const p0 = project(pid), s0 = step(p0, sid);
  openSheet(`<h2>Je préfère attendre</h2><div class="over" style="margin-bottom:6px">${esc(trancheName(p0, s0))}</div>
    <p class="muted small" style="margin-bottom:12px">L'entreprise lit votre motif. Sans nouvelle de votre part sous 7 jours, elle peut vous relancer.</p>
    <div class="field"><label for="wait-motif">Pourquoi attendre ? <span class="meta">(obligatoire)</span></label>
      <input id="wait-motif" class="input" maxlength="120" placeholder="Ex. J'attends la photo de l'angle nord" autocomplete="off"></div>
    <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-wait-ok disabled>Attendre</button></div>`, {
    label: 'Je préfère attendre',
    onMount: (el) => { const inp = el.querySelector('#wait-motif'), ok = el.querySelector('[data-wait-ok]');
      inp.addEventListener('input', () => { ok.disabled = inp.value.trim().length < 5; });
      ok.addEventListener('click', () => { actions.decide(pid, sid, 'attend', { motif: inp.value.trim() }); closeSheet(); toast('Décision enregistrée · entreprise prévenue', 'check'); }); } });
}
// Vague 4 : observation de l'entreprise sur un avis, et droit de réponse du contrôleur : texte (et photo), joints au dossier.
export function noteSheet({ title, intro, photo, onOk }) {
  openSheet(`<h2>${title}</h2><p class="muted small" style="margin-bottom:12px">${intro}</p>
    <div class="field"><label for="note-t">Votre texte <span class="meta">(10 à 400 caractères)</span></label><textarea id="note-t" class="textarea" maxlength="400"></textarea></div>
    ${photo ? `<label class="card row" style="gap:12px;cursor:pointer;margin-top:10px"><input type="checkbox" id="note-ph" style="width:22px;height:22px;accent-color:var(--success)"><span class="grow"><b>Joindre une photo</b><div class="meta">Prise dans l'appli · facultatif</div></span>${icon('camera', 'sm')}</label>` : ''}
    <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-note-ok disabled>Joindre au dossier</button></div>`, {
    label: title,
    onMount: (el) => { const t = el.querySelector('#note-t'), ok = el.querySelector('[data-note-ok]');
      t.addEventListener('input', () => { ok.disabled = t.value.trim().length < 10; });
      ok.addEventListener('click', () => { onOk(t.value.trim(), !!(el.querySelector('#note-ph') || {}).checked); closeSheet(); toast('Joint au dossier', 'file'); }); } });
}
// Panel n° 10 : un seul bouton « Un problème ? ». Trois choix ; le signalement garde data-act="report-issue" (feuille globale de app.js).
function problemBox(base) {
  return `<details class="more" data-testid="problem" style="margin-top:14px"><summary>${icon('chevronDown', 'sm')}<span><b>Un problème ?</b><small>Question, désaccord ou signalement à TEEQA</small></span></summary>
    <div class="more-in list" style="margin-top:8px">
      <button class="list-item" data-go="${base}/thread?k=question"><span class="ico-tile">${icon('message')}</span><span class="grow"><span class="t">Poser une question</span><div class="s">Une précision à l'entreprise ou au contrôleur, dans les échanges</div></span>${icon('chevron', 'sm chev')}</button>
      <button class="list-item" data-go="${base}/thread?k=contestation"><span class="ico-tile">${icon('flag')}</span><span class="grow"><span class="t">Exprimer un désaccord</span><div class="s">Motif et une pièce (photo, vocal, capture, témoignage)</div></span>${icon('chevron', 'sm chev')}</button>
      <button class="list-item" data-act="humain"><span class="ico-tile success">${icon('phone')}</span><span class="grow"><span class="t">Parler à quelqu'un de TEEQA</span><div class="s">WhatsApp, appel ou rappel, dans votre langue</div></span>${icon('chevron', 'sm chev')}</button>
      <button class="list-item" data-act="report-issue"><span class="ico-tile">${icon('alert')}</span><span class="grow"><span class="t">Signaler à TEEQA</span><div class="s">Fraude, fausse preuve, comportement grave : seul TEEQA le lit</div></span>${icon('chevron', 'sm chev')}</button>
    </div></details>`;
}
function adviceCard(p, s, rv) {
  if (!isControlled(s) && ['fin_declaree', 'vue'].includes(s.status)) return `<div class="advice wait" data-testid="advice">
    <span class="over"><b>En clair</b><span class="rule"></span>Payer ou attendre</span>
    <div class="row" style="gap:12px;margin-top:8px"><span class="ico-tile">${icon('eye')}</span>
      <div class="grow"><div class="advice-title" style="color:var(--ink)">Pas de recommandation</div><p class="small">Étape sans visite : vous décidez d'après les photos de l'entreprise.</p></div></div>
    <p class="meta" style="margin-top:8px">${DECIDE_LINE}</p></div>`;
  if (!rv || s.status === 'fin_declaree') return '';
  const a = advice(p, s, rv);
  return `<div class="advice ${a.ok ? 'ok' : 'wait'}" data-testid="advice">
    <span class="over"><b>En clair</b><span class="rule"></span>Payer ou attendre</span>
    <div class="row" style="gap:12px;margin-top:8px"><span class="ico-tile ${a.ok ? 'success' : 'saffron'}">${icon(a.ok ? 'checkCircle' : 'pause')}</span>
      <div class="grow"><div class="advice-title">${a.title}</div><p class="small">${a.text}</p></div></div>
    <p class="meta" style="margin-top:8px">${DECIDE_LINE}</p></div>`;
}

// Fil : tout ce qui s'est passé sur l'étape, dans l'ordre — événements (lignes centrées), photos et messages (bulles).
function threadItems(s) {
  const skip = ['photo', 'correction', 'question', 'contest', 'contest-end'];
  return [
    ...s.history.filter(h => !skip.includes(h.type)).map(h => ({ t: 'sys', at: h.at, role: h.role, by: h.by, text: h.text, quote: h.quote })),
    ...s.photos.map(ph => ({ t: 'photo', at: ph.at, role: ph.by, ph })),
    ...s.messages.filter(m => m.kind !== 'prive' || get().role === 'client').map(m => m.kind === 'system' ? { t: 'sys', at: m.at, text: m.text } : { t: 'msg', at: m.at, role: m.role, m }),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}
// Coches d'état : deux coches = synchronisé ; colorées = une réponse est arrivée depuis.
const ticks = (seen) => `<span class="ticks ${seen ? 'seen' : ''}" role="img" aria-label="${seen ? 'Vu' : 'Synchronisé'}"><svg viewBox="0 0 18 10" width="18" height="10" aria-hidden="true"><path d="M1 5.5 4 8.5 10 1.5M7 6.5 9 8.5 16 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

// Vague 17 (jury, n° 1 et 7) : « visible » garde un seul sens (REGLES.visible) ; les réserves se classent en « finition » ou « structure ».
const VERDICT_HELP = { validee: "Conforme sur tous les points vus (un point clé « Non vu » l'empêche). Avis technique seulement : vous ne décidez d'aucun paiement.", retardee: "L'ouvrage reste en place ; seuls les points notés se corrigent. Finition (joints mal garnis, porte mal réglée) : contrôlée sur photo. Structure et ce qui sera caché (aciers, gaines) : contre-visite sur place.", refusee: "L'ouvrage est à refaire : après la reprise, tous les points de l'étape sont revus sur place." };
const tlIcon = { start: ['play', 'dark'], end: ['flag', 'saffron'], photo: ['camera', ''], review: ['pen', 'success'], receipt: ['wallet', 'success'], correction: ['image', 'saffron'], seen: ['eye', 'success'], contest: ['flag', 'danger'], 'contest-end': ['flag', ''], question: ['message', ''], decision: ['wallet', ''], ask: ['refresh', ''] };

// Problème 9 : une contestation ouverte propose ses issues (retrait, accord, second avis, export). TEEQA ne tranche pas.

function contestBox(p, s, r) {
  const c = s.contest; if (!c || !c.open || p.status === 'clos' || access(p, r) !== 'ok') return '';
  const party = ['client', 'entreprise'].includes(r), btns = [];
  if (c.by === r) btns.push(`<button class="btn ghost sm" data-act="withdraw">Retirer ma contestation</button>`);
  if (party) {
    if (!c.accordBy) btns.push(`<button class="btn ghost sm" data-act="contest-end" data-issue="accord">Accord trouvé</button>`);
    else if (c.accordBy !== r) btns.push(`<button class="btn success sm" data-act="contest-end" data-issue="accord">Confirmer l'accord</button>`);
    if (can(r, p, s, 'secondAvis')) btns.push(`<button class="btn ghost sm" data-act="contest-end" data-issue="second_avis">Demander un second avis</button>`);
    btns.push(`<button class="btn ghost sm" data-act="contest-end" data-issue="export">Exporter le dossier</button>`);
  }
  const wait = c.accordBy === r ? `<p class="meta" style="text-align:center">Accord proposé : en attente de confirmation de l'autre partie.</p>` : c.accordBy ? `<p class="meta" style="text-align:center">${esc(who(c.accordBy))} propose de clore : accord trouvé.</p>` : '';
  if (can(r, p, s, 'droitReponse')) btns.push(`<button class="btn ghost sm" data-act="droit" data-testid="droit-btn">Répondre (droit de réponse)</button>`);
  // Vague 5 : le nombre d'issues annoncées = le nombre de boutons (le second avis seulement s'il existe un premier avis).
  const sa = secondAvisOuvert(p, s, r === 'entreprise' ? 'entreprise' : 'client'), issues = ['un retrait par son auteur', 'un accord des deux parties', ...(sa ? ['un second avis par un contrôleur d’une autre agence'] : []), 'un dossier exporté vers un médiateur de votre choix (avocat, centre de médiation)'];
  const nb = ['', 'une', 'deux', 'trois', 'quatre'][issues.length];
  return `<div class="sys-msg stack" style="gap:8px" data-testid="contest-issues"><span><b>Contestation ouverte.</b> Elle se clôt de ${nb} façons : ${issues.join(', ')}.${sa ? '' : s.pendingReview ? " Second avis possible une fois l'avis signé reçu (il part au retour du réseau du contrôleur)." : !s.reviews.length ? " Pas de second avis ici : aucun avis n'a encore été signé sur cette étape." : latestReview(s).verdict === 'validee' ? (r === 'entreprise' ? " Contre un avis Validé, seul le client peut demander un second avis, avant le coulage." : ` Pas de second avis ici : ${holdPoint(p, s) && s.coulage ? 'le béton coulé cache ce que l’avis Validé a vu' : 'la suite du chantier a commencé'}.`) : " Pas de second avis pendant une contre-visite en cours."} TEEQA ne tranche pas.${r === 'controleur' ? ` Votre réponse est jointe à votre avis et au dossier.${s.reviews.length && latestReview(s).verdict === 'validee' ? ` <span data-testid="valide-conteste">${VALIDE_CONTESTE}</span>` : ''}` : ''}</span>
    ${wait}${btns.length ? `<div class="chips" style="justify-content:center">${btns.join('')}</div>` : ''}</div>`;
}

// Vague 7 : une ligne « Qui agit maintenant », en haut de l'étape (clients : savoir qui doit bouger, sans lire tout l'écran).
// Vague 9 : qui agit, en une ligne ; le rôle attendu sert aussi à la ligne « Pour vous ».
function actor(p, s) {
  const E = `<span data-notr>${esc(who('entreprise'))}</span>`, C = `<span data-notr>${esc(who('client'))}</span>`, m = s.mission, dc = s.decision;
  if (p.status === 'clos') return null;
  if (s.status === 'verrouillee') { const cv = p.convention || {}, manq = ['client', 'entreprise'].filter(x => p.convention && !cv[x]);   // vague 26 (jury n° 23) : la convention à accepter est dite ici aussi
    return manq.length ? [manq.join(' '), manq.length > 1 ? 'Le client et l’entreprise' : manq[0] === 'client' ? C : E, 'Accepter la convention ; ensuite, l’étape d’avant doit être close.'] : ['', 'Personne pour l’instant', "L'étape d'avant doit d'abord être close."]; }
  if (s.status === 'a_venir') return conventionOk(p) ? ['entreprise', E, 'Photo de départ, puis début déclaré.'] : ['client entreprise', 'Le client et l’entreprise', 'Accepter la convention.'];
  if (s.status === 'debutee') return ['entreprise', E, holdPoint(p, s) ? `${MIN_PHOTOS} photos, puis « ferraillage prêt ».` : `${MIN_PHOTOS} photos, puis « fin déclarée ».`];
  if (s.status === 'fin_declaree' && !isControlled(s)) return ['client', C, 'Consulter la déclaration.'];
  if (s.status === 'fin_declaree' && s.pendingReview) return ['', 'Personne', 'Avis signé, il part seul au retour du réseau.'];
  // Vague 16 : un seul état par écran. Après un retard, un désistement ou un empêchement, la ligne dit ce qui se passe
  // vraiment (autre agence, autre contrôleur, date promise inchangée), au lieu de « Accepter la visite (24 h) ».
  if (s.status === 'fin_declaree' && m && m.status === 'suspendue') return ['entreprise', E, 'Accepter la convention : la visite reprend alors, avec un délai neuf de 4 jours.'];
  if (s.status === 'fin_declaree' && m && m.status === 'proposee') {
    if (m.lateFrom) return ['controleur', `<span data-notr>${esc(autreAgence(p).nom)}</span>`, 'Accepter la visite (24 h), puis passer ; visite non facturée.'];
    if (overdue(p, s).includes('visite')) return ['controleur', "L'agence de contrôle", `<span>${(m.withdrawn || []).length || (m.empeche || []).length ? `Retard côté contrôle (${[(m.withdrawn || []).length ? 'désistement' : '', (m.empeche || []).length ? 'empêchement du contrôleur' : ''].filter(Boolean).join(' puis ')}), pas de l’entreprise` : 'Retard de l’agence, pas de l’entreprise'} : passer sur place, date promise dépassée</span> <span data-notr>(${fmtFull(visitBy(m))})</span>.`];
    if ((m.tries || 1) > 1) return ['controleur', "L'agence de contrôle", `<span>Confier la visite à un autre contrôleur ; date promise inchangée :</span> <span data-notr>${fmtFull(visitBy(m))}</span>.`];
    return ['controleur', "L'agence de contrôle", enContreVisite(s) ? 'doit accepter la contre-visite sous 24 h.' : 'doit accepter la visite sous 24 h.'];   // vague 26 (Mbarek, Ilyas, clients du Maroc) : qui accepte, dit sans parenthèse
  }
  if (s.status === 'fin_declaree') return ['controleur', 'Le contrôleur', `<span>${enContreVisite(s) ? 'Revenir sur place (contre-visite)' : 'Passer sur place'}</span>${m && m.slot ? ` <span data-notr>${esc(slotLabel(m.slot, langOf(get().role)))}</span>` : m ? ` <span>au plus tard le</span> <span data-notr>${fmtFull(visitBy(m))}</span>` : ''}`];
  if (coulageDue(p, s)) return [contestBloque(s) ? '' : 'entreprise', E, contestBloque(s) ? `Attendre l’issue du désaccord (au plus tard le ${fmtFull(contestFin(s))}), puis couler.` : 'Couler le béton, puis le déclarer avec 2 photos.'];
  if (s.status === 'retardee') return ['entreprise', E, 'Corriger les réserves.'];
  if (s.status === 'correction_soumise') return ['controleur', 'Le contrôleur', 'Contrôler la correction.'];
  if (s.status === 'refusee') return ['entreprise', E, 'Reprendre le travail, puis déclarer de nouveau.'];
  if (!dc) return ['client', C, 'Décider du paiement de la tranche.'];
  if (dc.status === 'indique' && !dc.receivedAt) return ['entreprise', E, 'Confirmer la réception du paiement.'];
  return ['', 'Personne', 'Étape close, tranche payée.'];
}
const GLOSE = [
  [/accepter la contre-visite/i, 'l’ingénieur revient voir le travail repris'],
  [/accepter la visite/i, 'un ingénieur indépendant confirme'],
  [/ferraillage prêt/, '« ferraillage prêt » : les barres d’acier sont posées, le béton attend le contrôleur'],
  [/Passer sur place|Revenir sur place/, 'l’ingénieur vient voir le travail avant qu’il soit caché'],
  [/Couler le béton/, 'verser le béton sur les aciers contrôlés'],
  [/Corriger les réserves/, 'réserves : petits défauts notés par le contrôleur, à corriger'],
  [/Décider du paiement de la tranche/, 'tranche : la part du prix de cette étape, que vous payez vous-même à l’entreprise'],
  [/Confirmer la réception du paiement/, 'l’entreprise dit si votre argent est bien arrivé'],
  [/Accepter la convention/, 'convention : les règles du suivi, acceptées par vous et l’entreprise'],
];
function nextActor(p, s) {
  // Vague 8 : le nom (non traduit) et l'action (traduite) sont dans deux morceaux séparés, pour que la ligne se lise dans chaque langue.
  const a = actor(p, s); if (!a) return '';
  // Vague 18 NT (clients, 33 fiches) : le client lit le mot du chantier ET son sens dans la même ligne, en mots de tous les jours.
  const lr = latestReview(s), g0 = get().role === 'client' && langOf('client') === 'fr' ? (GLOSE.find(([rx]) => rx.test(a[2])) || [])[1] : '';
  // Vague 20 (jury v19, n° 2) : une réserve de structure n'est pas un « petit défaut ».
  const g = g0 && /^réserves/.test(g0) && lr && lr.recheck === 'visite' ? 'réserve de structure : l’entreprise corrige, puis le contrôleur revient sur place' : g0;
  return `<span class="meta keep" data-testid="qui-agit"><b>Maintenant :</b> <span class="qa-who">${get().role === 'controleur' && a[0] === 'controleur' && a[1] === "L'agence de contrôle" ? 'Vous, pour votre agence' : a[1]}</span> · <span class="qa-act">${g ? a[2].replace(/\.(<\/span>)?\s*$/, '$1') : a[2]}</span>${g ? ` <span class="qa-glose" data-testid="qa-glose">(${g})</span>.` : ''}</span>`;   // vague 21 (doigt : Anas) : plus de « (24 h). (… ) », le point vient après la glose
}
// Vague 9 : la troisième ligne du haut de l'étape : ce que la personne qui lit doit faire, ou rien.
// Vague 23 (jury n° 14) : les étapes où l'eau se cache ont une photo imposée à la déclaration de fin, visite ou pas.
export const PHOTO_IMPOSEE = {
  'Menuiseries et réseaux': 'l’essai à l’eau de la toiture-terrasse (mise en eau 48 h, plafond sec dessous)',
  'Enduits et zellige': 'l’essai d’eau des pièces d’eau (douche et sols, avant la pose du zellige)',
};
// Tranches dues ailleurs sur le chantier (vue du client), sans décision ni séquestre.
function autresDues(p, s) { return p.steps.filter(x => x !== s && !x.decision && !x.sequestre).map(x => ({ x, q: phraseArgent(p, x, 'client') })).filter(o => o.q && o.q.du); }
function pourVous(p, s, r) {
  const a = actor(p, s); if (!a) return '';
  const moi = a[0].split(' ').includes(r);
  // Pendant une visite ou une contre-visite, le client lit aussi que le paiement attend l'avis (mots imposés).
  const pay = r === 'client' && s.status === 'fin_declaree' && isControlled(s) && !s.decision ? ` <b>Paiement différé</b> <span>jusqu’à ${holdPoint(p, s) ? 'l’avis favorable ; la tranche est due 7 jours après le coulage déclaré' : 'l’avis favorable'}.</span>` : '';
  // Vague 15 : « Pour vous » suit les boutons vraiment proposés (désaccord ouvert, visite en retard, avis en attente de réseau).
  const c = s.contest && s.contest.open ? s.contest : null, late = can(r, p, s, 'lateSwitch');
  const txt = late ? 'date de visite dépassée : relancer, ou demander une autre agence sans frais (boutons en bas).'
    : c && c.by === r ? `votre désaccord est ouvert : vous seul pouvez le retirer. ${contestBloque(s) ? 'Il retient le coulage (48 h au plus).' : c.ferr ? 'Ses 48 h sont passées : il ne retient plus le chantier.' : 'Ouvert avant « ferraillage prêt », il ne retient pas le chantier.'}`
    : c && ['client', 'entreprise'].includes(r) ? (moi ? 'à vous d’agir ; le désaccord ouvert se traite dans les échanges (réponse attendue sous 48 h ; ' + (c.ferr ? 'ses 48 h de retenue sont passées' : 'ouvert avant « ferraillage prêt », il ne retient pas le coulage') + ').' : 'répondre au désaccord dans les échanges (réponse attendue sous 48 h), ou proposer « accord trouvé ».')
    : s.pendingReview && r === 'controleur' ? 'rien à faire : l’avis part seul au retour du réseau.'
    : moi ? 'à vous d’agir.' : (s.mission && s.mission.lateFrom && s.status === 'fin_declaree' && r !== 'controleur') ? 'rien à faire : la visite est en retard, TEEQA relance l’agence et vous préviendra.' : r === 'entreprise' && s.status !== 'verrouillee' && p.status !== 'clos' ? 'rien d’obligatoire, vous serez prévenu (une photo au client reste possible).' : r === 'client' && p.status !== 'clos' && autresDues(p, s).length ? `réglez d’abord la tranche ${autresDues(p, s).map(o => o.q.i).join(', ')} (voir le paiement ci-dessus) ; pour cette étape, vous serez prévenu.` : 'rien à faire, vous serez prévenu.';   // vague 23 (doigt : Mustapha) : plus de contradiction avec « Envoyer une photo au client »
  // Vague 20 (doigt) : le paiement quitte cette ligne ; il a sa carte « Prochain paiement », juste dessous.
  // Vague 21 (10 entreprises, jury n° 3) : « À jour » seulement quand rien n'attend personne de ce côté (ni désaccord, ni retard, ni échéance dépassée).
  // Vague 22 (clients Maroc, Suisse : « À jour » à côté de « Visite en retard ») : une visite en retard n'est jamais « à jour ».
  const visiteTard = !!(s.mission && s.mission.lateFrom && s.status === 'fin_declaree');
  // Vague 24 (4 groupes) : jamais « À jour » au-dessus d'une action attendue : tranche à payer, coulage à déclarer, photo demandée.
  const attendu = (r === 'client' && !s.decision && !!echeance(p, s)) || (r === 'entreprise' && coulageDue(p, s)) || (s.messages || []).some(m => m.kind === 'demande_photo' && m.req && m.req.status === 'ouverte' && m.role !== r && r === 'entreprise');
  // Vague 25 : la pastille dérive de la même source que les actions attendues (store.js, attentes()) : un seul calcul pour tous les écrans et tous les rôles.
  const miens = attentesDe(r, p, s);
  const calme = aJour(p, s) && !moi && !late && !c && !visiteTard && !retardJours(p, s) && !attendu && !miens.length && !(r === 'client' && autresDues(p, s).length);
  const txt2 = miens.length && /^rien/.test(txt) ? `à vous d’agir : ${miens[0].label}.` : txt;
  void pay; return `<span class="etat-phrase keep" data-testid="pour-vous"><b>Pour vous :</b> <span>${txt2}</span>${calme ? ` <span class="a-jour" data-testid="a-jour">${icon('checkCircle', 'xs')}<span>À jour</span></span>` : ''}</span>`;
}
// Vague 15 : le coulage retenu par un désaccord du client décale d'autant les délais de l'entreprise ; écrit des deux côtés.
const retenueNote = (s) => s.contest && s.contest.decale && !s.coulage ? ` <span data-testid="retenue-decale">Coulage retenu ${retenueTxt(s.contest.decale)} par le désaccord du client : délais de l’entreprise décalés d’autant.</span>` : '';
// Vague 7 : visite réservée d'avance par l'entreprise (au moins 48 h avant), visible des trois rôles.
function bookingCard(p, s, r) {
  if (!s.booking || s.booking.cancelledAt || (s.booking.usedAt && !s.booking.missedAt && s.status !== 'fin_declaree')) return '';
  const b = s.booking, w = holdPoint(p, s) ? 'Ferraillage prêt prévu' : 'Fin prévue';
  if (b.missedAt) return `<div class="notice" data-testid="booking">${icon('calendar', 'sm')}<span><b>Créneau réservé dépassé.</b> Le ferraillage n'était pas prêt ${esc(slotLabel(b))} : la visite suit le délai ordinaire.</span></div>`;
  return `<div class="notice success" data-testid="booking">${icon('calendar', 'sm')}<span class="grow"><b>Visite réservée d'avance · ${esc(slotLabel(b))}.</b> ${w} ce jour-là, annoncé par ${esc(who('entreprise'))} le ${fmtFull(b.bookedAt)}${b.agence ? ` ; créneau confirmé par ${esc(b.agence)}` : ''}. Le contrôleur passe ce jour-là : le béton n'attend que quelques heures.${r === 'client' && slotTz(b) ? ` ${esc(slotTz(b))}.` : ''}${r === 'entreprise' && !b.usedAt ? ' Indiquez « ferraillage prêt » au plus tard ce matin-là.' : ''}</span>${can(r, p, s, 'cancelBooking') ? `<button class="btn sm ghost" data-act="cancel-book">Annuler</button>` : ''}</div>`;
}
function bookSheet(p, s) {
  const opts = bookOptions(), w = holdPoint(p, s) ? 'ferraillage prêt' : 'fin des travaux';
  openSheet(`<h2>Réserver la visite d'avance</h2><div class="over" style="margin-bottom:6px">${esc(s.title)}</div>
    <p class="muted small" style="margin-bottom:10px">Annoncez le jour où le ${w === 'ferraillage prêt' ? 'ferraillage sera prêt' : 'travail sera fini'}, au moins 48 h à l'avance. L'agence confirme le créneau et le contrôleur passe ce jour-là : sans réservation, le délai va jusqu'à 4 jours après la demande.</p>
    <div class="list" role="radiogroup" aria-label="Jour de passage">${opts.map((o, k) => `<button class="list-item" role="radio" aria-checked="${k === 0}" data-bk="${k}"><span class="ico-tile">${icon('calendar')}</span><span class="grow"><span class="t">${esc(slotLabel(o).replace(/^le /, ''))}</span></span></button>`).join('')}</div>
    <p class="meta" style="margin-top:8px">Si le ferraillage n'est pas prêt ce jour-là, le créneau est perdu et la visite suit le délai ordinaire. Le béton ne se coule jamais avant l'avis.</p>
    <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-bk-ok>Réserver</button></div>`, { label: "Réserver la visite d'avance",
    onMount(el) { let k = 0; el.querySelectorAll('[data-bk]').forEach(b => b.addEventListener('click', () => { k = +b.dataset.bk; el.querySelectorAll('[data-bk]').forEach(x => x.setAttribute('aria-checked', String(x === b))); }));
      el.querySelector('[data-bk-ok]').addEventListener('click', () => { actions.bookVisit(p.id, s.id, opts[k]); closeSheet(); sfx('choix'); toast('Visite réservée · client et contrôleur prévenus', 'calendar'); }); } });
}
// Vague 7 : recours contre un avis (entreprise), sans passer d'abord par un désaccord.
function appealSheet(p, s, r) {
  const rv = latestReview(s);
  openSheet(`<h2>Contester l'avis</h2><div class="over" style="margin-bottom:6px">Avis ${esc(avisLabel(rv.verdict))} · ${esc(s.title)}</div>
    <div class="card stack" style="gap:6px;margin-bottom:10px" data-testid="recours"><b>Votre recours : un second avis par une autre agence</b>
      <dl class="kv" style="margin:0"><dt>Qui</dt><dd>Un contrôleur d'une autre agence partenaire, qui ne connaît pas le premier.</dd><dt>Délai</dt><dd>Comme une visite : au plus tard 4 jours après la demande (6 hors des villes desservies).</dd><dt>Coût</dt><dd>${tarif('secondAvis', { eur: false })}, facturé seulement si le second avis confirme le premier. S'il l'annule, ni le second avis ni la contre-visite ne vous sont facturés.</dd><dt>Ce qui reste</dt><dd>Le premier avis reste au dossier, avec votre motif et la réponse du contrôleur. TEEQA ne tranche pas : c'est le second avis qui compte pour la suite.</dd><dt>Effet</dt><dd data-testid="recours-effet">Pendant le second avis, l'étape attend : paiement différé, rien à corriger. S'il confirme le premier, la suite prévue reprend (correction, contre-visite). S'il l'annule, son avis remplace le premier pour le paiement et la suite ; vous êtes prévenu dès qu'il est signé.</dd></dl></div>
    <div class="field"><label for="ap-motif">Votre motif <span class="meta">(10 caractères min.)</span></label><textarea id="ap-motif" class="textarea" maxlength="300" placeholder="Ex. Les cales sont en place sur les quatre poteaux d'angle, photo à l'appui."></textarea></div>
    <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-ap-ok disabled>Demander le second avis</button></div>`, { label: "Contester l'avis",
    onMount(el) { const ta = el.querySelector('#ap-motif'), ok = el.querySelector('[data-ap-ok]'); ta.addEventListener('input', () => { ok.disabled = ta.value.trim().length < 10; });
      ok.addEventListener('click', () => { actions.appealReview(p.id, s.id, r, ta.value); closeSheet(); toast('Second avis demandé à une autre agence', 'send'); }); } });
}
// Vague 5 : ce que le contrôleur signe et comment il est payé, affiché sur la mission proposée (pas derrière un lien).
const engagement = (ag) => { const R = TARIFS.remuneration, d = (n) => prix(n, { eur: false });
  return `<dl class="kv" style="margin:6px 0 0" data-testid="grille"><dt>Rémunération</dt><dd>Votre part, versée par votre agence, par acte : <b>visite</b> ${d(R.visite)} ; <b>contre-visite</b> ${d(R.contreVisite)} (courte, quand 1 ou 2 points seulement sont à revoir : ${d(R.contreVisiteMineure)}) ; <b>second avis</b> ${d(R.secondAvis)} ; <b>contrôle d'une correction sur photo</b> ${d(R.correctionPhoto)} ; <b>visite impossible du fait du chantier</b> ${d(R.visiteImpossible)} (portail fermé, béton déjà coulé, personne sur place, chantier dangereux : étais manquants, tranchée non blindée, chaleur au-delà de 45 °C ; dites le motif et photographiez-le). Ni le client ni l'entreprise ne vous paient.</dd>
  <dt>Déplacement</dt><dd>${d(R.deplacement)} par déplacement, dans un rayon de 40 km autour de l'agence ou de son antenne ; au-delà, une agence plus proche est missionnée s'il en existe une, sinon la vôtre passe avec le délai hors zone (6 jours) et votre déplacement est payé ${d(R.deplacement)} plus ${d(R.km)} par kilomètre au-delà des 40 km (aller).</dd>
  <dt>Assurance</dt><dd>${esc(ag.assurance || '')}. Plafond : ${d(TARIFS.assurance.rcAgence)} par sinistre et ${d(TARIFS.assurance.rcAgenceAn)} par an, franchise ${d(TARIFS.assurance.franchiseAgence)} (à la charge de l'agence, jamais du contrôleur). TEEQA a sa propre assurance pour son service (${d(TARIFS.assurance.rcTeeqa)} par sinistre).</dd>
  <dt>Contrat type</dt><dd data-testid="contrat-type">Contrat de mission type agence-contrôleur, joint à chaque mission : objet (points de contrôle de l'étape), délai, rémunération ci-dessus, assurance de l'agence, confidentialité, droit de se désister jusqu'à 24 h avant le créneau. <button class="linklike" data-act="contrat-type" data-testid="contrat-ouvrir">Lire le contrat type</button></dd></dl>`; };
// Carte « Visite de contrôle » : l'horloge et l'agence pour le client, une fiche de mission courte pour le contrôleur.
function missionCard(p, s, r) {
  const m = s.mission; if (s.status !== 'fin_declaree' || !m) return '';
  if (m.status === 'suspendue') return `<div class="card stack mission-line" style="gap:6px" data-testid="visite-suspendue"><div class="row" style="gap:12px"><span class="ico-tile saffron">${icon('hourglass')}</span><div class="grow"><b>Visite suspendue le ${esc(fmtFull(m.suspendueAt))}</b><div class="meta" data-testid="suspendue-agence">Agence : ${esc(agenceEtape(p, s))}${m.slot ? ` · créneau du ${esc(slotLabel(m.slot))} annulé` : ''}.</div><div class="meta">Changement d’entreprise. Elle reprend avec la même agence, avec un délai neuf de 4 jours, dès que l’entreprise reprenante a accepté la convention. Rien n’est facturé pour l’attente.</div></div></div></div>`;
  const okM = m.status === 'acceptee', ag = (p.invites && p.invites.controleur) || {};
  const head = (sub) => `<div class="card stack mission-line" style="gap:6px"><div class="row" style="gap:12px"><span class="ico-tile ${okM ? 'success' : 'saffron'}">${icon(okM ? 'checkCircle' : 'hourglass')}</span><div class="grow"><b>${['contre-visite', 'correction'].includes(m.reason) ? (okM ? 'Contre-visite acceptée' : 'Contre-visite demandée') : m.reason === 'second_avis' ? (okM ? 'Second avis accepté' : 'Second avis demandé') : okM ? 'Visite de contrôle acceptée' : 'Visite de contrôle demandée'}</b>${sub}</div></div>`;
  const lines = (arr) => arr.filter(Boolean).map(t => `<div class="meta">${t}</div>`).join('');
  const agN = m.agence || ag.agence, agA = m.agence ? agrementEtape(p, s) : ag.agrement, agLine = agN ? `Agence : <b>${esc(agN)}</b>${agA ? ` · ${esc(agA)}` : ''}` : '';
  const slotLine = m.slot ? `<span style="color:var(--success-ink)"><b>Passage prévu ${esc(slotLabel(m.slot))}</b></span>` : okM ? 'Créneau de passage : choisi par le contrôleur, vous serez prévenu' : '';
  if (r === 'client') {
    return `${head(`<div class="meta">${okM ? `Acceptée le ${fmtFull(m.acceptedAt)}` : `Demandée le ${fmtFull(m.at)}`}${m.dueAt ? ` · passage au plus tard le ${fmtFull(visitBy(m))}${p.horsZone ? ' (délai allongé : chantier hors des villes desservies)' : ''}` : ''}</div>`)}
      ${lines([
        agLine, slotLine, `<span data-testid="protection">Pendant l’attente, protéger les ouvrages exposés (aciers à la pluie, bâche) reste à l’entreprise ; TEEQA ne le surveille pas.</span>`,
        !okM && (m.tries || 1) > 1 ? `<span style="color:var(--saffron-ink)">${m.urgent ? esc(REGLES.empechement) : m.withdrawn ? esc(REGLES.desist) : 'Proposée à une autre agence de la zone'}</span>` : '',
        m.escalated ? `<span style="color:var(--danger-ink)"><b>Aucune agence n'a accepté à temps : TEEQA choisit lui-même une autre agence et vous appelle sous 24 h. Rien à demander de votre part.</b></span>` : '',
        m.reason === 'contre-visite' ? (cvPayeurTxt(m.billedTo) ? cvPayeurTxt(m.billedTo) : `Contre-visite à la charge de l'entreprise (${tarif(contreVisiteKey(latestReview(s)), { eur: false })}, convention)`) : '',
        m.reason === 'correction' ? 'Contre-visite pour vérifier une correction de structure' : '',
        ['contre-visite', 'correction'].includes(m.reason) ? def('contreVisite') : '',
        m.replans ? `Visite reportée ${m.replans > 1 ? `${m.replans} fois` : 'une fois'} par le contrôleur` : '',
      ])}</div>`;
  }
  if (r === 'controleur') {
    // Vague 3 : la fiche de mission dit où, à quelle distance, quand (créneau choisi), jusqu'où va la responsabilité et comment c'est payé.
    const addr = p.adresse || (p.prep && p.prep.address) || p.quartier, km = p.distanceKm || 15, gps = p.gps;
    const mapUrl = gps ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}` : `https://www.google.com/maps?q=${encodeURIComponent([addr, p.city, 'Maroc'].filter(Boolean).join(', '))}`;
    const slots = okM && s.status === 'fin_declaree' && !m.booked ? `<div class="list" role="radiogroup" aria-label="Choisir un créneau de passage" style="margin-top:6px">${slotOptions(m).map(o => { const on = m.slot && m.slot.at === o.at;
      return `<button class="list-item" role="radio" aria-checked="${!!on}" data-act="slot" data-at="${o.at}" data-h="${o.h}" data-day="${o.day}"><span class="ico-tile ${on ? 'success' : ''}">${icon(on ? 'check' : 'clock')}</span><span class="grow"><span class="t">${esc(slotLabel(o).replace(/^le /, ''))}</span></span></button>`; }).join('')}${m.slot && m.slot.h === 'libre' ? `<div class="list-item" role="radio" aria-checked="true"><span class="ico-tile success">${icon('check')}</span><span class="grow"><span class="t">${esc(slotLabel(m.slot).replace(/^le /, ''))}</span></span></div>` : ''}${slotLibres(m).length ? `<button class="list-item" data-act="slot-libre" data-testid="slot-libre"><span class="ico-tile">${icon('calendar')}</span><span class="grow"><span class="t">Proposer un autre moment</span><div class="s">Avant le ${fmtFull(visitBy(m))} ; client et entreprise prévenus</div></span></button>` : ''}</div>` : '';
    // Vague 18 NT (contrôleurs, 3 fiches) : une fois le créneau choisi, la liste se replie sous « Changer de créneau ».
    const slotsV = slots && m.slot ? `<details class="more" data-testid="changer-creneau"><summary>${icon('chevronDown', 'sm')}<span><b>Changer de créneau</b><small>${esc(slotLabel(m.slot).replace(/^le /, ''))} choisi</small></span></summary>${slots}</details>` : slots;
    const asks = s.messages.filter(x => x.req && x.req.pour === 'controleur' && x.req.status === 'ouverte');
    return `${head('')}
      ${asks.map(x => `<div class="notice saffron" data-testid="photo-pour-controleur">${icon('camera', 'sm')}<span><b>Photo précise demandée par ${esc(who('client', r))} :</b> ${esc(x.req.what)}. À prendre pendant votre visite et à joindre à l’avis ; elle ne change pas les points de contrôle.</span></div>`).join('')}
      <dl class="kv" style="margin:4px 0 0" data-testid="mission-fiche"><dt>Pour vous</dt><dd data-testid="mission-paie"><b>${prix(['contre-visite', 'correction'].includes(m.reason) ? TARIFS.remuneration[contreVisiteKey(latestReview(s))] : TARIFS.remuneration.visite, { eur: false })}</b> + ${prix(TARIFS.remuneration.deplacement, { eur: false })} de déplacement, versés par votre agence le 10 du mois suivant l'avis au plus tard, même si TEEQA ne l'a pas encore payée : l'agence s'y engage dans son contrat avec vous (TEEQA paie l'agence sous 15 jours après chaque avis ; un avis signé le 28 est payé à l'agence au plus tard le 13 du mois suivant, et vous le 10). Un désistement n'est pas payé. <span data-testid="duree-visite">Visite estimée : ${enContreVisite(s) ? '30 min à 1 h sur place (seulement le ou les points à revoir)' : '1 h 30 à 2 h sur place'}.</span></dd><dt>Adresse</dt><dd>${missionPending(s) ? `<span data-testid="adresse-apres">${p.quartier ? `${esc(p.quartier)}, ` : ''}${esc(p.city)} · à ${km} km de votre agence</span><br><span class="meta">Adresse exacte, repère et carte dès que vous acceptez la visite.</span>` : `${addr ? `${esc(addr)}, ` : ''}${esc(p.city)}${p.repere ? `<br><span class="meta">${esc(p.repere)}</span>` : ''}<br><a href="${mapUrl}" target="_blank" rel="noopener" data-testid="gps">${icon('pin', 'xs')}Ouvrir la carte</a>`}${!missionPending(s) && p.surPlace ? `<br><button class="btn text" style="min-height:32px;padding:0" data-act="call" data-testid="appel">${icon('phone', 'xs')}Appeler le chef de chantier (numéros masqués des deux côtés)</button><br><span class="meta" data-testid="appel-repli">Pas de réponse : SMS court relayé par TEEQA (« J’arrive dans 30 min », « Rappelez-moi »), traduit dans la langue du destinataire. Personne sur place : appeler le client, numéro masqué aussi.</span>` : ''}</dd><dt>Responsabilité</dt><dd data-testid="assurance-visible"><span class="resp3" data-testid="resp-3-lignes"><span>1. Un point visible noté « Conforme » à tort : c’est votre agence qui en répond, avec son assurance ; ni la franchise ni l’indemnité ne vous sont demandées.</span><span>2. « Non vu » sur un point caché ou inaccessible ce jour-là : il n’engage ni vous ni l’agence.</span><span data-testid="faute-grave">3. Faute grave, la seule qui vous engage personnellement : signer sans être venu sur place, ou écrire sciemment le faux (photo d’un autre chantier, mesure inventée). Une erreur d’appréciation n’est jamais une faute grave.</span></span><details class="def" data-testid="responsabilite-cas"><summary class="meta">${icon('info', 'xs')}Le texte complet et des exemples</summary><p class="meta" style="margin:4px 0 0"><span data-testid="responsabilite">${esc(REGLES.responsabiliteControleur)} ${esc(REGLES.visibleExemples)}</span> ${RESPONSABILITE.map(([t, x]) => `<b>${t}</b> : ${x}`).join(' ')}</p></details></dd><dt>Proche du client</dt><dd data-testid="proche-present">${esc(REGLES.procheVisite)}</dd><dt>Créneau</dt><dd>${m.booked && m.slot ? `Réservé d'avance par l'entreprise : ${esc(slotLabel(m.slot))}` : m.slot ? esc(slotLabel(m.slot)) : okM ? 'À choisir ci-dessous' : 'Vous le choisissez après avoir accepté'}</dd>${okM ? '' : `<dt>Réponse avant</dt><dd class="mono">${fmtFull(m.dueAt)}</dd>`}<dt>Passage au plus tard</dt><dd class="mono">${fmtFull(visitBy(m))}</dd></dl>
      <div data-testid="mission-plans">${(() => { const pl = (p.pieces || []).filter(x => !x.remplaceAt && x.kind !== 'devis' && !x.recolement);   /* vague 17 : plan de référence seulement */ /* vague 16 : le contrôleur voit les plans, jamais le devis */ return pl.length ? `<div class="over" style="margin:4px 0">Plans et pièces · ${pl.length}</div><p class="meta" data-testid="plans-hors-ligne">Gardés sur ce téléphone dès l’acceptation : ils s’ouvrent sans réseau. La carte, elle, demande du réseau : notez le repère avant de partir.</p><div class="list" data-testid="mission-pieces">${pl.map(x => `<button class="list-item" data-act="piece" data-id="${x.id}"><span class="ico-tile">${icon('file')}</span><span class="grow"><span class="t">${esc(x.title)}${(x.version || 1) > 1 ? ` · v${x.version}` : ''}</span><div class="s">${esc(x.note || '')}${x.at ? ` · déposé le ${fmtDate(x.at)}` : ''}</div></span>${icon('chevron', 'sm chev')}</button>`).join('')}</div>` : `<div class="meta">Plans : pas encore déposés par le client ou l'entreprise (Documents du chantier).</div>`; })()}</div>
      <details class="more" data-testid="mission-detail"><summary>${icon('chevronDown', 'sm')}<span><b>Détail de la mission</b><small>GPS, délais, rémunération, contrat, assurance</small></span></summary><dl class="kv" style="margin:6px 0 0"><dt>Repère GPS</dt><dd>${gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : '—'}</dd><dt>Sur place</dt><dd>${p.surPlace ? esc(p.surPlace.qui) : 'Le chef de chantier'} · appel relayé par TEEQA, votre numéro reste masqué</dd><dt>Distance</dt><dd>Environ ${km} km de votre agence</dd><dt>Délai</dt><dd>${p.horsZone ? '24 h pour accepter, puis 5 jours pour passer : chantier hors des villes desservies' : '24 h pour accepter, puis 72 h pour passer (ville desservie)'}. Sans réseau, le délai compte la prise des photos, pas leur envoi.</dd>${holdPoint(p, s) ? `<dt>Béton</dt><dd>Pas encore coulé : point d'arrêt, vous voyez les aciers avant le coulage.</dd>` : ''}${m.reason === 'contre-visite' ? '<dt>Motif</dt><dd>Contre-visite après un refus</dd>' : m.reason === 'correction' ? '<dt>Motif</dt><dd>Contrôle sur place d\'une correction de structure</dd>' : ''}
      </dl>
      <div class="meta" data-testid="hors-ligne">${icon('cloudUp', 'xs')} <b>Sans réseau ?</b> Photos et avis restent sur le téléphone avec leur heure, et partent au retour du réseau.</div>
      ${okM ? engagement(ag) : ''}</details>
      ${okM ? '' : `<details class="more" open data-testid="mission-engagement"><summary>${icon('chevronDown', 'sm')}<span><b>Ce que vous signez et comment vous êtes payé</b><small>Contrat type, rémunération, assurance</small></span></summary>${engagement(ag)}</details>`}
      ${slotsV}
      ${lines([m.replans ? `Visite déjà reportée ${m.replans > 1 ? `${m.replans} fois` : 'une fois'}` : ''])}</div>`;
  }
  // Entreprise : l'état de la visite, sans nommer le contrôleur.
  return `${head(`<div class="meta">${okM ? `Acceptée le ${fmtFull(m.acceptedAt)} · passage au plus tard le ${fmtFull(m.dueAt)}` : `Demandée le ${fmtFull(m.at)} · en attente d'un contrôleur, passage au plus tard le ${fmtFull(visitBy(m))}`}${p.horsZone ? ' (délai allongé : chantier hors des villes desservies)' : ''}</div>`)}
    ${lines([agLine, slotLine, esc(REGLES.anonyme), `<span data-testid="protection">Pendant l’attente, protéger les ouvrages exposés (aciers à la pluie, bâche) reste à votre charge : une photo datée le montre.</span>`, cvPayeurTxt(m.billedTo) ? `<b>${cvPayeurTxt(m.billedTo)}</b>` : ['contre-visite', 'correction'].includes(m.reason) ? `<b>Contre-visite à votre charge : ${tarif(contreVisiteKey(latestReview(s)))}</b>${contreVisiteKey(latestReview(s)) === 'contreVisiteMineure' ? ' (courte : 1 ou 2 points à reprendre)' : ''}, jamais plus que le prix d'une visite ordinaire (${tarif('visite', { eur: false })}), et non facturée si un second avis annule l'avis. <span data-testid="cv-repartition">${esc(cvRepartTxt(contreVisiteKey(latestReview(s))))}</span> <span data-testid="cv-equite">${esc(CV_EQUITE)}</span>` : ''])}
    ${['contre-visite', 'correction'].includes(m.reason) ? def('contreVisite') : ''}
    ${can('entreprise', p, null, 'recuse') ? `<button class="btn text" style="justify-self:start;font-size:13.5px" data-go="#/c/${p.id}/share" data-testid="recuse-link">${icon('refresh', 'sm')}Récuser l'agence (une fois, avec un motif)</button>` : recuseBlocked(p) ? `<div class="meta" data-testid="recuse-blocked">${esc(REGLES.recuse)}</div>` : ''}</div>`;
}

export const routes = [
  {
    name: 'step', pattern: /^\/c\/([^/]+)\/step\/([^/]+)$/,
    render(pid, sid) {
      const p = project(pid), s = step(p, sid);
      if (!s) return { redirect: '#/home' };
      const r = get().role;
      const i = p.steps.indexOf(s);
      const rv = latestReview(s);
      const base = `#/c/${pid}/step/${sid}`;
      const decl = s.photos.filter(ph => ph.by === 'entreprise' && !ph.correction);
      // Vague 20 (jury v19, n° 12) : les photos du contrôleur partent avec l'avis ; avant sa signature, seul le contrôleur les voit.
      const tsAvis = s.reviews.length ? Math.max(...s.reviews.map(v => +new Date(v.signedAt || v.at))) : 0, phs = s.photos.filter(ph => r === 'controleur' || ph.by !== 'controleur' || +new Date(ph.at) <= tsAvis);
      const ctrl = phs.filter(ph => ph.by === 'controleur');
      const corr = s.photos.filter(ph => ph.correction);
      const acc = access(p, r);
      const simple = r === 'client' && !get().prefs.detail;
      // Problème 10 : délais dépassés. Chacun voit ceux qu'il peut relancer, pas ceux qui le concernent lui-même.
      const late = p.status === 'clos' || access(p, r) !== 'ok' ? [] : overdue(p, s).filter(k => !(k === 'mission' && s.mission && s.mission.lateFrom)).filter(k => ({ mission: ['client', 'entreprise'], visite: ['client', 'entreprise'], correction: ['client'], paiement: ['entreprise'], attente: ['entreprise'], retard: ['client'] })[k]?.includes(r));
      const koCorr = s.corrections.filter(c => c.verdict === 'ko');
      const dock = [];
      if (p.status === 'clos') dock.push(`<div class="notice">${icon('archive', 'sm')}<span>Chantier clôturé : étape en lecture seule.</span></div>`);
      else if (acc !== 'ok') dock.push(`<button class="btn block ghost" data-go="#/invite/${pid}/${r}">Voir l'état de l'invitation</button>`);
      else {
        // Aide au néophyte (M09, 11 nov.) : pour le client, l'écran s'arrête par défaut au résumé « En clair » et à la décision ;
        // le détail (avis complet, photos, historique) se déplie. Réglage « Vue détaillée » dans Profil › Paramètres pour tout garder ouvert.
        if (r === 'entreprise' && s.status === 'a_venir' && conventionOk(p) && p.status !== 'clos') {
          // Panel du 19 nov. : une photo de départ avant de déclarer le début (contre les débuts déclarés à vide).
          const nStart = startPhotos(s).length, okStart = can(r, p, s, 'declareStart');
          if (can(r, p, s, 'photoDeclare')) dock.push(`<button class="btn ${nStart ? 'ghost' : 'saffron'} block" data-go="${base}/camera">${icon('camera', 'sm')}${nStart ? 'Ajouter une photo de départ' : 'Prendre la photo de départ'}</button>`);
          dock.push(`<button class="btn ${nStart ? 'saffron' : ''} block" data-act="start" ${okStart ? '' : `aria-disabled="true" data-why="Prenez d'abord une photo de départ dans l'appli"`}>${icon('play', 'sm')}Déclarer le début</button>
            ${okStart ? '' : `<p class="meta" style="text-align:center" data-testid="start-why">Une photo de départ d'abord (elle compte même sans réseau).</p>`}`);
        }
        else if (r === 'entreprise' && s.status === 'a_venir' && !conventionOk(p)) dock.push(`<button class="btn ghost block" data-go="#/c/${p.id}/convention">${icon('file', 'sm')}Convention à accepter avant de débuter</button>`);
        // Vague 7 : réserver la visite d'avance (48 h au moins), pour que le béton n'attende pas.
        if (can(r, p, s, 'book')) dock.push(`<button class="btn block" data-act="book" data-testid="book-btn">${icon('calendar', 'sm')}Réserver la visite d'avance</button><p class="meta" style="text-align:center;margin:0">48 h avant : le contrôleur passe le jour annoncé, le béton n’attend pas.</p>`);
        if (r === 'entreprise' && get().net.offline && (can(r, p, s, 'declareEnd') || s.status === 'debutee')) dock.push(`<p class="meta" style="text-align:center;margin:0" data-testid="fin-hors-reseau">${icon('clock', 'xs')} Sans réseau : votre déclaration et vos photos restent sur le téléphone avec leur heure, et partent seules au retour du réseau ; le client verra les deux heures.</p>`);
        // Parcours B (26 nov., workflow P2 et P5 « Retard ») : date de fin prévue, retard, nouvelle date proposée puis acceptée ou refusée.
        if (s.status === 'debutee' && s.finPrevue) { const nd = s.nouvelleDate, att = nd && !nd.reponse;
          dock.push(finEtapeDepassee(s) ? `<div class="notice danger" data-testid="etape-en-retard">${icon('clock', 'sm')}<span><b>En retard</b> : la fin était prévue le ${fmtDate(s.finPrevue)}.${att ? ` Nouvelle date proposée par ${esc(who('entreprise'))} : le ${fmtDate(nd.date)}${nd.motif ? ` (${esc(nd.motif)})` : ''}.` : nd && nd.reponse === 'refusee' ? ` Nouvelle date du ${fmtDate(nd.date)} refusée par ${esc(who('client'))}.` : ''}</span></div>`
            : `<p class="meta" style="text-align:center;margin:0" data-testid="fin-prevue">${icon('calendar', 'xs')} Fin prévue le ${fmtDate(s.finPrevue)}${nd && nd.reponse === 'acceptee' ? ' (nouvelle date acceptée)' : ''}</p>`);
          if (r === 'entreprise' && finEtapeDepassee(s) && !att && acc === 'ok') dock.push(`<button class="btn block" data-act="new-date" data-testid="new-date">${icon('calendar', 'sm')}Proposer une nouvelle date</button>`);
          if (r === 'client' && att && acc === 'ok') dock.push(`<button class="btn saffron block" data-act="date-ok" data-testid="date-ok">${icon('check', 'sm')}Accepter la nouvelle date</button><button class="btn text block" style="font-size:13.5px" data-act="date-no" data-testid="date-no">Refuser · ouvrir un désaccord</button>`); }
        if (can(r, p, s, 'declareEnd')) dock.push(`<button class="btn saffron block" data-act="end">${icon('flag', 'sm')}${holdPoint(p, s) ? 'Ferraillage prêt · demander la visite' : 'Déclarer la fin'}</button>`);
        else if (r === 'entreprise' && ['debutee', 'refusee'].includes(s.status)) {
          // Problème 4 : la fin ne se déclare qu'avec MIN_PHOTOS photos de l'entreprise, prises dans l'appli et envoyées.
          const nPh = Math.min(declarePhotos(s).length, MIN_PHOTOS);
          // Vague 6 : à un point d'arrêt (dalle comprise), le bouton dit « Ferraillage prêt », jamais « Déclarer la fin ».
          const hpE = holdPoint(p, s), endTxt = hpE ? 'Ferraillage prêt · demander la visite' : 'Déclarer la fin', nWait = s.photos.filter(ph => ph.by === 'entreprise' && ['hors_ligne', 'en_attente', 'envoi'].includes(ph.sync)).length;
          dock.push(`<button class="btn saffron block" aria-disabled="true" data-act="noop" data-why="Il faut ${MIN_PHOTOS} photos prises dans l'appli pour ${hpE ? 'indiquer le ferraillage prêt' : 'déclarer la fin'}">${icon('flag', 'sm')}${endTxt}</button>
            <p class="meta" style="text-align:center" data-testid="photo-count"><b>${nPh} / ${MIN_PHOTOS} photos prises</b> dans l'appli (elles comptent même sans réseau).${nWait ? ` <b>${nWait} photo${nWait > 1 ? 's' : ''} en attente d'envoi.</b>` : ''}</p>`);
        }
        if (can(r, p, s, 'coulage')) dock.push(`<button class="btn saffron block" data-act="coulage" data-testid="coulage-btn">${icon('camera', 'sm')}Coulage fait · 2 photos et le bon de livraison${/dalle/i.test(s.title) ? ' (et les éprouvettes, si le devis les prévoit)' : ''}</button>`);
        else if (r === 'entreprise' && s.status === 'a_venir' && coulageDue(p, p.steps[i - 1])) dock.push(`<p class="meta" style="text-align:center">Déclarez d'abord le coulage de l'étape ${i} : cette étape pourra débuter ensuite.</p>`);
        if (r === 'client' && can(r, p, s, 'appeal')) dock.push(`<button class="btn ghost block" data-act="appeal" data-testid="appeal-client">${icon('flag', 'sm')}Demander un second avis (${tarif('secondAvis', { eur: false })}, non facturé si l'avis est annulé)</button>`);   // parcours B (26 nov.) : bouton direct, sans passer par « Contester »
        if (r === 'entreprise' && can(r, p, s, 'appeal')) dock.push(`<button class="btn ghost block" data-act="appeal" data-testid="appeal-btn">${icon('flag', 'sm')}Contester l'avis · second avis (${tarif('secondAvis', { eur: false })}, non facturé si l'avis est annulé)</button>`);
        if (can(r, p, s, 'observe') && (['retardee', 'refusee', 'correction_soumise'].includes(s.status) || (s.status === 'fin_declaree' && s.mission && ['contre-visite', 'correction'].includes(s.mission.reason)))) dock.push(`<button class="btn ghost block" data-act="observe" data-testid="observe-btn">${icon('message', 'sm')}Ajouter une observation sur l'avis</button>`);
        if (s.status !== 'a_venir' && can(r, p, s, 'photoDeclare')) dock.push(`<button class="btn ghost block" data-go="${base}/camera">${icon('camera', 'sm')}Ajouter une photo</button>`);
        if (can(r, p, s, 'correction')) dock.push(`<button class="btn saffron block" data-go="${base}/correction">${icon('camera', 'sm')}${rv && rv.recheck === 'visite' ? `Correction faite · demander la contre-visite (${tarif(contreVisiteKey(rv), { eur: false })})` : 'Photo de correction (comprise)'}</button>`);
        // Vague 22 (entreprises, 9 fiches) : la règle de frais écrite une fois, en clair, et ce qui la rend équitable des deux côtés.
        if (can(r, p, s, 'correction') && rv && rv.recheck === 'visite') dock.push(`<p class="meta" style="margin:0" data-testid="cv-equite">Pourquoi vous : la contre-visite revoit seulement les points que l’avis a notés à reprendre. Vous ne payez rien si un second avis annule cet avis, ni si le point n’était pas écrit au premier avis. Le client, lui, paie le second avis qu’il demande quand il confirme l’avis (1 100 DH).</p>`);
        if (can(r, p, s, 'ack')) dock.push(`<button class="btn saffron block" data-act="ack">${icon('eye', 'sm')}J'ai consulté la déclaration</button>`);
        // Problème 1 : le contrôleur n'a l'appareil photo et l'avis qu'une fois la visite acceptée.
        if (can(r, p, s, 'acceptMission')) dock.push(`<p class="meta" style="margin:0 0 4px;text-align:center" data-testid="photos-a-prevoir">${icon('camera', 'xs')} Sur place : ${enContreVisite(s) ? `${Math.max(1, pointsRevus(s).length)} photo${pointsRevus(s).length > 1 ? 's' : ''} (une par point à revoir)` : `${pointsCles(checkPoints(s))} photo${pointsCles(checkPoints(s)) > 1 ? 's' : ''} (une par point clé), plus une par point à reprendre qui n’est pas un point clé`}.</p><button class="btn saffron block" data-act="mission-ok">${icon('checkCircle', 'sm')}Accepter cette visite</button>
          <button class="btn ghost block" data-act="mission-no">${icon('xCircle', 'sm')}Refuser la mission</button>`);
        else if (r === 'controleur' && s.status === 'fin_declaree' && isControlled(s) && missionOk(s) && s.pendingReview) dock.push(`<div class="notice saffron" data-testid="avis-en-file">${icon('cloudUp', 'sm')}<span><b>Avis signé le ${fmtFull(s.pendingReview.signedAt)}, sans réseau.</b> Il attend sur ce téléphone et part avec vos photos dès le retour du réseau ; l'heure de signature reste celle-ci.</span></div>`);
        else if (r === 'controleur' && s.status === 'fin_declaree' && isControlled(s) && missionOk(s)) {
          const okReview = can(r, p, s, 'review');
          dock.push(`<div class="btn-row"><button class="btn ${okReview ? 'ghost' : 'saffron'}" data-go="${base}/camera">${icon('camera', 'sm')}Photographier</button>
            <button class="btn ${okReview ? 'saffron' : ''}" ${okReview ? `data-go="${base}/review"` : 'aria-disabled="true" data-act="noop" data-why="Prenez d\'abord au moins une photo sur place (sans réseau, elle compte aussi)"'}>${icon('pen', 'sm')}Signer l'avis</button></div>`);
        }
        // Problème 5 : après des réserves, le contrôleur vérifie la correction à distance ; le client peut demander une visite.
        if (can(r, p, s, 'verifyCorrection')) dock.push(`<div class="btn-row"><button class="btn ghost" data-act="corr-ko">${icon('xCircle', 'sm')}Insuffisante</button>
          <button class="btn success" data-act="corr-ok">${icon('checkCircle', 'sm')}Conforme</button></div>`);
        if (can(r, p, s, 'askVisit')) dock.push(`<button class="btn ghost block" data-act="ask-visit">${icon('pin', 'sm')}Demander une visite sur place</button>`);
        if (can(r, p, s, 'decide') && !payBanner(p, s, rv, r)) dock.push(`<button class="btn block" data-act="paid">${icon('wallet', 'sm')}J'ai payé cette tranche</button><button class="btn text block" style="font-size:13.5px" data-act="wait">Je préfère attendre</button>`);
        // Vague 18 NT (contrôleurs, 4 fiches) : une seule entrée « Je ne peux pas », qui ouvre les motifs (sur place, désistement, empêchement).
        const cant = [];
        if (can(r, p, s, 'visitImpossible')) cant.push(`<button class="btn ghost block" data-act="visit-impossible">${icon('clock', 'sm')}Visite impossible</button>`);
        // Vague 8 : se désister d'une visite acceptée (au plus tard 24 h avant le créneau), distinct de « Visite impossible » (sur place).
        if (can(r, p, s, 'withdraw')) cant.push(`<button class="btn text block" style="font-size:13.5px" data-act="withdraw" data-testid="withdraw">${icon('refresh', 'sm')}Me désister de cette visite</button>`);
        else if (can(r, p, s, 'empechement')) cant.push(`<button class="btn text block" style="font-size:13.5px" data-act="empechement" data-testid="empechement">${icon('alert', 'sm')}Empêchement de dernière minute</button>`);
        else if (r === 'controleur' && s.status === 'fin_declaree' && missionOk(s) && s.mission.slot && !s.pendingReview) dock.push(`<p class="meta" style="text-align:center" data-testid="withdraw-late">Désistement possible jusqu'à ${DESIST_H} h avant le créneau.</p>`);
        if (cant.length) dock.push(cant.length === 1 ? cant[0] : `<details class="more" data-testid="je-ne-peux-pas"><summary>${icon('chevronDown', 'sm')}<span><b>Je ne peux pas faire cette visite</b><small>Visite impossible sur place, désistement ou empêchement</small></span></summary><div class="more-in stack" style="gap:8px">${cant.join('')}</div></details>`);
        // Vague 20 (doigt : Hamid) : envoyer une photo au client, d'un geste, depuis l'étape (sans texte obligatoire).
        if (r === 'entreprise' && acc === 'ok' && p.status !== 'clos' && s.status !== 'verrouillee') dock.push(`<button class="btn ${dock.length ? 'ghost' : 'saffron'} block" data-act="photo-client" data-testid="photo-client">${icon('camera', 'sm')}Envoyer une photo au client</button>`);
        if (r === 'client' && access(p, 'client') === 'ok' && p.status !== 'clos' && s.decision && s.decision.status === 'indique' && !s.decision.receivedAt && s.decision.moyen !== 'sequestre') dock.push(`<button class="btn text block" style="font-size:13.5px" data-act="pay-undo" data-testid="pay-undo">Corriger ma déclaration (pas encore confirmée)</button>`);
        if (can(r, p, s, 'confirmPayment')) dock.push(`<button class="btn success block" data-act="received" data-testid="paiement-recu">${icon('wallet', 'sm')}Paiement reçu</button>${can(r, p, s, 'notReceived') ? `<button class="btn text block" style="font-size:13.5px" data-act="not-received" data-testid="not-received">Je n'ai pas reçu ce paiement</button>` : ''}`);
      }
      return {
        html: `${demobar()}${appbar({ title: `Étape ${i + 1} sur ${p.steps.length}`, back: `#/c/${pid}`, right: `<button class="icon-btn" data-go="${base}/thread" aria-label="Échanges (${s.messages.length})">${icon('message')}${s.messages.length ? '<span class="badge-dot"></span>' : ''}</button>` })}
        <div class="scroll">${(() => {
          // En-tête : la photo la plus récente de l'étape, sous la barre ; elle glisse moins vite que le contenu (parallaxe).
          const cv = phs[phs.length - 1]; if (!cv) return '';
          return `<button class="step-cover" data-act="photo" data-id="${cv.id}"><span class="sr-only">Dernière photo de l'étape, du ${fmtFull(cv.at)} : voir le détail</span>
            <span class="sc-img">${cv.dataUrl ? `<img src="${cv.dataUrl}" alt="">` : photoSVG(cv.sim.step, cv.sim.variant, { correction: cv.correction, stamp: false })}</span>
            <span class="sc-shade" aria-hidden="true"></span>
            <span class="sc-cap"><span>${esc(who(cv.by))}${p.reprise && cv.by === 'entreprise' && cv.at < p.reprise.at ? ' (entreprise sortante)' : ''} · ${fmtDate(cv.at)}</span><span class="sc-n" data-testid="nb-photos">${icon('image', 'xs')}${phs.length} photo${phs.length > 1 ? 's' : ''}</span></span></button>`;
        })()}<div class="hero-step stack" style="gap:12px">
          <div class="row top" style="gap:10px"><div class="grow stack" style="gap:6px;padding-top:4px">${r === 'client' ? '' : `<div class="over">${esc(p.name)} · ${esc(p.city)}</div>`}
          <h2 class="h1" data-listen>${esc(s.title)}</h2></div>${stepIcon3D(i, p.steps.length, 96, 'floaty')}</div>
          <div class="chips"><span class="stamp-wrap" ${freshValid(s) ? `data-stamp="${p.id}:${s.id}"` : ''} ${s.status === 'validee' ? 'data-act="fete" role="button" tabindex="0"' : ''}>${statusChip(statusKey(s, p))}${s.status === 'validee' ? '<span class="sr-only"> · revoir la célébration de cette étape</span>' : ''}</span>${isControlled(s) ? '' : `<span class="chip outline">${icon('eye', 'xs')}Sans visite de contrôle</span>`}</div>
          ${/* Vague 23 (doigt : Mustapha, Aïcha) : l'argent juste sous le titre, avant « Pour vous ». */''}${r !== 'controleur' && p.status !== 'clos' && acc === 'ok' && (payBanner(p, s, rv, r) || trancheCard(p, s, r, base)) ? '' : payNext(p, s, r)}
          <div class="resume keep meta" data-testid="resume-etape">${pourVous(p, s, r).replace('data-testid="pour-vous"', 'data-testid="pour-vous" data-listen')}${nextActor(p, s).replace('data-testid="qui-agit"', 'data-testid="qui-agit" data-listen')}${r !== 'controleur' && !s.decision ? retenueNote(s) : ''}</div>
          ${contestClos(s, r)}
          ${/* Vague 23 (jury n° 9) : un refus de mission par une agence se lit aussi côté client et entreprise. */''}${r !== 'controleur' && s.mission && s.mission.reassignedAt && missionPending(s) && !s.mission.lateFrom ? `<div class="notice keep" data-testid="mission-refusee">${icon('refresh', 'sm')}<span>${(s.mission.withdrawn || s.mission.empeche) ? `<b>Visite confiée le ${fmtDate(s.mission.reassignedAt)} à un autre contrôleur</b> de la même agence (${esc(agenceEtape(p, s))}) : le premier s’est ${s.mission.empeche ? 'trouvé empêché' : 'désisté'}. La date promise ne change pas.` : `<b>Visite reproposée le ${fmtDate(s.mission.reassignedAt)}</b> à une autre agence de la zone (la première ne l’a pas prise). La date promise ne change pas.`}</span></div>` : ''}
          ${solde(s) && r !== 'controleur' && trancheDh(p, s) ? `<div class="pay-next keep" data-testid="tranche-soldee">${icon('checkCircle', 'sm')}<span class="grow"><span class="over">Tranche ${p.steps.indexOf(s) + 1}</span><span class="pn-l"><b>Soldée</b> · ${dh(trancheDh(p, s))}</span></span></div>` : ''}
          ${r !== 'controleur' && acc === 'ok' && !payBanner(p, s, rv, r) && !solde(s) ? (t => t ? `<div class="keep" data-testid="tranche-haut">${t}</div>` : '')(trancheCard(p, s, r, base)) : ''}
          ${lastMsgRow(p, s, r, base)}
          <div class="row keep" style="gap:8px;flex-wrap:wrap" data-testid="listen-row"><button class="btn sm ghost" data-lact="listen" data-scope="[data-listen]" data-testid="listen">${icon('speaker', 'sm')}Écouter</button><button class="btn sm ghost simple-only" data-act="show-all" data-testid="show-all" aria-expanded="false">${icon('chevronDown', 'sm')}<span>Détails</span></button></div>
          ${late.length ? `<div class="notice danger keep" data-testid="overdue">${icon('clock', 'sm')}<span class="grow">${late.map(k => `<b>${k === 'paiement' && retardJours(p, s) ? `Échéance de la tranche dépassée de ${retardJours(p, s)} jour${retardJours(p, s) > 1 ? 's' : ''}` : `En retard : ${esc(DELAI_LABEL[k])}`}.</b> `).join('')}${late.includes('visite') ? `<span data-testid="visite-retard">Visite promise au plus tard le ${fmtFull(visitBy(s.mission))} : date dépassée. Comme le dit la convention : une autre agence, d’un geste, sans frais pour personne ; délais du chantier suspendus jusqu’à l’avis. <span data-testid="autre-agence">Autre agence : ${autreAgenceTxt(p)}.</span></span>` : late.includes('mission') ? (s.mission.lateFrom ? 'Sans réponse de cette agence sous 24 h, TEEQA confie la visite à l’agence principale de la région voisine, sans geste de votre part et sans frais ; les délais du chantier restent suspendus.' : 'TEEQA propose la visite à une autre agence, sans geste de votre part ; le délai de visite ne change pas.') : 'Vous pouvez relancer la personne attendue.'}</span><span class="stack" style="gap:6px">${late.map(k => `<button class="btn sm ghost" data-act="remind" data-k="${k}">Relancer</button>`).join('')}${can(r, p, s, 'lateSwitch') ? `<button class="btn sm ghost" data-act="late-switch" data-testid="late-switch">Autre agence, sans frais</button><span class="meta" data-testid="late-switch-auto">TEEQA confie la visite à une autre agence de lui-même sous 24 h ; vous pouvez aussi le demander tout de suite.</span>` : ''}</span></div>` : ''}
          ${late.length && s.relances && late.some(k => s.relances[k]) ? `<div class="notice keep" data-testid="relance-suite">${icon('send', 'sm')}<span>${late.filter(k => s.relances[k]).map(k => `<b>Relancé le ${fmtFull(s.relances[k])}.</b> ${k === 'paiement' ? 'Toujours rien dans 7 jours ? Ouvrez un désaccord : le dossier daté (avis, photos, relances) se transmet à un médiateur. TEEQA ne tranche pas et ne détient pas l’argent.' : k === 'visite' || k === 'mission' ? 'Sans réponse, TEEQA confie la visite à une autre agence, sans frais.' : 'L’autre partie est prévenue. Sans réponse, écrivez-lui dans les échanges ; une nouvelle relance est possible demain.'}`).join(' ')}</span></div>` : ''}
          ${s.decision && s.decision.notReceivedAt && !s.decision.receivedAt && r !== 'controleur' ? `<div class="notice saffron keep" data-testid="pas-recu-suite">${icon('wallet', 'sm')}<span class="grow">${r === 'entreprise' ? `<b>Vous avez indiqué ne pas avoir reçu ce paiement</b> (le ${fmtFull(s.decision.notReceivedAt)}). Le client est prévenu et peut joindre son justificatif dans les échanges. Dès que l’argent arrive, touchez « J’ai reçu le paiement ».` : `<b>L’entreprise indique ne pas avoir reçu ce paiement</b> (le ${fmtFull(s.decision.notReceivedAt)}). Joignez votre justificatif de virement dans les échanges ; un virement depuis l’étranger peut prendre 2 à 5 jours ouvrés.`}</span><button class="btn sm ghost" data-go="${base}/thread" data-testid="pas-recu-fil">Échanges</button></div>` : ''}
          ${s.mission && s.mission.lateFrom && s.status === 'fin_declaree' && r !== 'controleur' ? `<div class="notice saffron keep" data-testid="retard-suite">${icon('clock', 'sm')}<span><b>Visite en retard depuis le ${fmtFull(s.mission.lateFrom)}.</b> Autre agence missionnée (${esc(autreAgence(p).nom)}) : visite non facturée, délais du chantier suspendus, fin prévue décalée d’autant.</span></div>` : ''}
          ${s.contest && s.contest.open ? `<button class="notice danger keep" style="border:0;text-align:left;width:100%" data-go="${base}/thread">${icon('flag', 'sm')}<span><b>${ROLES[s.contest.by].label} conteste cette étape.</b> Voir les échanges ${icon('chevron', 'xs')}</span></button>` : ''}
          ${payBanner(p, s, rv, r).replace('data-testid="advice"', 'data-testid="advice" data-listen')}
          ${r === 'controleur' ? missionCard(p, s, r) : ''}
        </div>
        <div class="content stack step-content" style="gap:10px;padding-top:0">
          ${rv ? fold(`Avis du contrôleur · ${avisLabel(rv.verdict)}${rv.motif ? ` · « ${esc(rv.motif.length > 70 ? rv.motif.slice(0, 68).replace(/\s+\S*$/, '') + '…' : rv.motif)} »` : ''}`, `Signé le ${fmtDate(rv.signedAt || rv.at)}${s.reviews.length > 1 ? ` · ${s.reviews.length} versions` : ''}`, `
          ${rv ? `<div class="section-title"><span class="over">Avis du contrôleur</span>${s.reviews.length > 1 ? `<span class="meta">${s.reviews.length} versions</span>` : ''}</div>${reviewCard(rv, s)}
            ${s.reviews.length > 1 ? `<details class="card" style="margin-top:8px"><summary style="font-weight:700;cursor:pointer">Avis antérieurs (${s.reviews.length - 1})</summary><div class="stack" style="margin-top:10px">${s.reviews.slice(0, -1).reverse().map(v => reviewCard(v, s, false)).join('')}</div></details>` : ''}` : ''}
          ${leveeCard(s)}
          ${corr.length ? `<div class="section-title"><span class="over">Corrections · versions</span><span class="meta">v1 = état avec réserves</span></div><div class="photo-grid">${corr.map(ph => photoTile(ph)).join('')}</div>
            ${s.corrections.map(c => c.note ? `<p class="small muted" style="margin-top:6px"><b>v${c.version}</b> · ${esc(c.note)}</p>` : '').join('')}` : ''}
          `, 'fold-avis') : ''}
          ${fold('En savoir plus', 'Règles de l’étape, visite, paiement', `
          ${bookingCard(p, s, r)}
          ${enContreVisite(s) ? `<div class="notice saffron" data-testid="contre-visite-attendue">${icon('hourglass', 'sm')}<span><b>Correction envoyée, contre-visite à faire.</b> L'avis avec réserves du ${fmtFull(rv.signedAt || rv.at)} reste en vigueur. ${esc(who('entreprise'))} a envoyé sa correction le ${fmtFull(s.endDeclaredAt)} (ferraillage prêt une première fois le ${fmtFull(firstEndAt(s))}). Le contrôleur revient sur place la voir${holdPoint(p, s) ? ' ; le béton ne se coule qu’après son avis' : ''}.${r === 'client' ? ' <b>Paiement différé</b> jusqu’à cet avis : il n’y a rien à payer pour cette tranche maintenant.' : ''}</span></div>` : s.status === 'fin_declaree' && holdPoint(p, s) ? `<div class="notice saffron" data-testid="ferraillage-pret">${icon('hourglass', 'sm')}<span><b>Ferraillage prêt, pas encore vérifié.</b> Indiqué par ${esc(who('entreprise'))} le ${fmtFull(s.endDeclaredAt)}. Le béton n'est pas coulé : le contrôleur voit d'abord les aciers, puis l'entreprise coule et le déclare. L'étape ne sera finie qu'à ce moment-là.</span></div>${def('ferraillage', 'coulage')}` : s.status === 'fin_declaree' ? `<div class="notice saffron">${icon('hourglass', 'sm')}<span><b>Fin déclarée, ${isControlled(s) ? 'pas encore vérifiée' : 'non vérifiée'}.</b> Déclarée par ${esc(who('entreprise'))} le ${fmtFull(s.endDeclaredAt)}. ${isControlled(s) ? 'Avis du contrôleur attendu.' : "Cette étape n'a pas de visite de contrôle : le client consulte les photos de l'entreprise."}</span></div>` : ''}
          ${coulageDue(p, s) ? `<div class="notice saffron" data-testid="coulage-attendu">${icon('hourglass', 'sm')}<span><b>Ferraillage contrôlé, coulage à déclarer.</b> ${contestBloque(s) ? `Désaccord ouvert avec un motif : pas de coulage avant son issue, au plus tard le ${fmtFull(contestFin(s))} ; passé ce délai, l’avis du contrôleur suffit et le désaccord reste au dossier.${s.contest.by === 'client' ? ' <span data-testid="retenue-decale">Cette attente décale d’autant les délais de l’entreprise.</span>' : ''}` : s.contest && s.contest.open ? 'Délai de 48 h du désaccord passé : le coulage est possible, le désaccord reste écrit au dossier. ' + (r === 'entreprise' ? 'Coulez, puis déclarez avec 2 photos.' : '') : r === 'entreprise' ? 'Coulez le béton, puis déclarez le coulage avec 2 photos (ensemble et détail).' : "L'entreprise coule le béton, puis le déclare avec 2 photos."}</span></div>${def('coulage')}` : s.coulage ? `<div class="notice success" data-testid="coulage-fait">${icon('checkCircle', 'sm')}<span><b>Coulage déclaré</b> <span data-notr>${fmtFull(s.coulage.at)} · ${esc(who('entreprise'))}</span> · <span>${(s.coulage.photoIds || [1]).length} photo${(s.coulage.photoIds || [1]).length > 1 ? 's' : ''}, après l'avis sur le ferraillage.</span></span></div>` : ''}
          ${r !== 'controleur' ? missionCard(p, s, r) : ''}
          ${isControlled(s) && PERIMETRE[s.title] && ['debutee', 'fin_declaree'].includes(s.status) ? `<div class="meta" data-testid="perimetre"><b>Ce que la visite contrôle :</b> ${esc(PERIMETRE[s.title])}</div>` : ''}
          ${PHOTO_IMPOSEE[s.title] && r !== 'controleur' ? `<div class="meta" data-testid="photo-imposee"><b>Photo imposée à la fin de l’étape :</b> ${PHOTO_IMPOSEE[s.title]}${isControlled(s) ? ' ; le contrôleur la refait sur place.' : ' ; sans visite, c’est la seule preuve : regardez-la.'}</div>` : ''}
          ${!isControlled(s) ? `<div class="notice" data-testid="sans-visite">${icon('eye', 'sm')}<span><b>Étape sans visite de contrôle</b> (${p.steps.some(isControlled) ? 'non retenue pour une visite' : 'formule Suivi'}). ${s.status === 'vue' ? `${esc(who('client'))} l'a close` : 'Le client la clôt'} en indiquant « J'ai consulté la déclaration ». <b>Clore veut dire seulement :</b> le client a lu la déclaration et vu les photos de l'entreprise. Personne ne l'a contrôlée sur place : elle compte comme « déclarée », et l'avancement la range à part, « sans visite ». Un doute ? Posez une question, ou demandez à un proche invité de passer.</span></div>` : ''}
          ${s.status === 'verrouillee' ? `<div class="notice">${icon('lock', 'sm')}<span>Étape verrouillée : elle s'ouvrira quand l'étape ${i} sera close, c'est-à-dire ${isControlled(p.steps[i - 1] || {}) ? `avec un avis Validé ou ses réserves levées${holdPoint(p, p.steps[i - 1]) ? ', puis le béton coulé et déclaré par l’entreprise' : ''}` : 'consultée par le client (étape sans visite de contrôle)'}.</span></div>` : ''}
          ${s.status === 'correction_soumise' ? `<div class="notice saffron">${icon('image', 'sm')}<span>${r === 'controleur' ? `<b>Contrôler la correction sur photo.</b> L'entreprise a envoyé une photo de correction des réserves. Jugez-la conforme ou insuffisante, sans vous déplacer. Après ${MAX_CORRECTIONS} corrections insuffisantes, l'étape passe en Refusé, avec une contre-visite à la charge de l'entreprise.` : r === 'client' ? "<b>Correction en cours de contrôle sur photo.</b> L'entreprise a corrigé les réserves par photo. Si vous préférez, demandez une visite sur place." : "<b>Correction envoyée.</b> Le contrôleur la contrôle sur photo, sans nouvelle visite."}</span></div>` : ''}
          ${s.status === 'retardee' ? `<div class="notice">${icon('alert', 'sm')}<span><b>Avis avec réserves.</b> ${r === 'entreprise' && pendingCorrection(s) ? "Correction en cours d'envoi : elle comptera une fois envoyée." : (rv && rv.recheck === 'visite' ? `Réserve sur la structure ou un ouvrage caché : l'entreprise corrige, puis une contre-visite sur place contrôle la correction (${tarif(contreVisiteKey(rv), { eur: false })}). ${r !== 'controleur' ? `<span data-testid="cv-repartition">${esc(cvRepartTxt(contreVisiteKey(rv)))}</span>` : ''}` : "L'entreprise corrige et envoie une photo prise dans l'appli ; le contrôleur la contrôle sur photo, sans nouvelle visite.")}${koCorr.length ? ` Correction v${koCorr[koCorr.length - 1].version} jugée insuffisante${koCorr[koCorr.length - 1].checkNote ? ` : « ${esc(koCorr[koCorr.length - 1].checkNote)} »` : ''}. Dernière correction possible.` : ''} Après ${MAX_CORRECTIONS} corrections insuffisantes, l'étape passe en Refusé (règle de la convention).</span></div>${def('reserves')}` : ''}
          ${s.status === 'refusee' ? `<div class="notice danger">${icon('xCircle', 'sm')}<span><b>${koCorr.length >= MAX_CORRECTIONS ? `${koCorr.length} corrections insuffisantes : étape Refusée.` : 'Avis Refusé.'}</b> Le travail est à reprendre ; l'entreprise déclarera de nouveau la fin et le contrôleur repassera. ${cvPayeurTxt(cvPayeur(s)) ? cvPayeurTxt(cvPayeur(s)) : 'Contre-visite à la charge de l’entreprise, jamais plus que le prix d’une visite ordinaire, non facturée si un second avis annule le Refusé.'}</span></div>${def('contreVisite')}` : ''}
          ${r === 'client' && !payBanner(p, s, rv, r) ? `<div class="keep" data-listen>${adviceCard(p, s, rv)}</div>` : ''}   <!-- vague 4 : pas deux fois la même recommandation -->
          ${acc !== 'ok' || payBanner(p, s, rv, r) || solde(s) ? (t => t ? `<div class="keep">${t}</div>` : '')(trancheCard(p, s, r, base)) : ''}
          <div class="card">${stepper(s, p.steps.indexOf(s), p.steps.length, p)}</div>
          `, 'en-savoir-plus')}
          ${fold('Photos et historique', `${phs.length} photo${phs.length > 1 ? 's' : ''} · ${s.history.length} événement${s.history.length > 1 ? 's' : ''}`, `
          ${isControlled(s) || ctrl.length ? `<div class="section-title"><span class="over">Photos sur place · contrôleur</span><span class="meta">${ctrl.length}</span></div>
          ${ctrl.length ? `<div class="photo-grid">${ctrl.map((ph, k) => photoTile(ph, { n: k + 1 })).join('')}</div>` : `<p class="muted small">Aucune photo du contrôleur pour l'instant.</p>`}` : ''}
          <div class="section-title"><span class="over">Déclarations · entreprise</span><span class="meta">${decl.length}</span></div>
          ${decl.length ? `<div class="photo-grid">${decl.map((ph, k) => photoTile(ph, { n: k + 1 })).join('')}</div>` : `<p class="muted small">Aucune photo de déclaration.</p>`}
          <div class="section-title"><span class="over">Derniers événements</span>${s.history.length > 3 ? `<button class="btn text" style="min-height:32px;font-size:13.5px" data-go="${base}/thread">Tout voir</button>` : ''}</div>
          ${s.history.length ? `<div class="timeline" data-stagger>${s.history.slice(-3).reverse().map(h => { const [ic, c] = tlIcon[h.type] || ['info', '']; return `
            <div class="tl-item"><span class="tl-dot ${c}">${icon(ic)}</span><div><div class="tl-text"><b>${esc(h.by || who(h.role))}</b> · ${esc(h.text)}</div><div class="meta">${fmtFull(h.at)}</div></div></div>`; }).join('')}</div>` : `<p class="muted small">Rien pour l'instant.</p>`}
          `, 'fold-photos')}
          ${s.status !== 'verrouillee' && p.status !== 'clos' && acc === 'ok' ? problemBox(base) : ''}
          ${r === 'client' && acc === 'ok' && doneLike(s, p) && isControlled(s) !== null ? `<details class="more" data-testid="constat"><summary>${icon('chevronDown', 'sm')}<span><b>Un désordre après coup ?</b><small>Fissure, infiltration : visite de constat</small></span></summary><div class="more-in stack" style="gap:8px"><p class="meta" style="margin:0">${esc(REGLES.constat)}</p>${(s.constats || []).map(c => `<div class="meta" data-testid="constat-demande">Constat demandé le ${fmtFull(c.at)} : « ${esc(c.note)} » · ${dh(c.dh)}, payé par vous</div>`).join('')}<button class="btn sm ghost" data-act="constat" data-testid="constat-btn">${icon('camera', 'sm')}Demander une visite de constat (${tarif('visite', { eur: false })})</button></div></details>` : ''}
        </div></div>
        ${dock.length ? `<div class="action-dock step-dock">${dock.join('')}</div>` : ''}`,
        on: {
          'photo-client'() { sfx('choix'); go(`${base}/client`); },
          'show-all'(b) { const sc = b.closest('.screen'); if (!sc) return; const on = sc.classList.toggle('show-all'); b.setAttribute('aria-expanded', String(on)); const t = b.querySelector('span:last-child'); if (t) t.textContent = on ? 'Moins de détails' : 'Détails'; toast(on ? 'Détails affichés plus bas : avis, frise, règles' : 'Vue simple', 'info'); },   // vague 26 (doigt : Ilyas) : le bouton dit ce qu'il fait, et le dit après
          photo(b) { photoSheet(p, s, s.photos.find(x => x.id === b.dataset.id)); },
          fete() { fete(p, s, rv); },
          start() {
            // Parcours B (26 nov., workflow P2 · E6) : la date de fin prévue se donne au début ; TEEQA rappelle 2 jours avant, puis signale le retard.
            const jour = (d) => new Date(d).toISOString().slice(0, 10), dflt = jour(nowMs() + 21 * 864e5);
            confirmSheet({ title: 'Déclarer le début ?', body: `${isControlled(s) ? 'Le client et le contrôleur seront notifiés' : 'Le client sera notifié'} que « ${esc(s.title)} » a débuté.</p>
              <div class="field" style="margin-bottom:18px"><label for="fin-prevue">Date de fin prévue de l’étape</label><input id="fin-prevue" class="input" type="date" min="${jour(nowMs() + 864e5)}" value="${dflt}" data-testid="fin-prevue-input">
              <p class="meta" style="margin:6px 0 0">Le client la voit. TEEQA vous rappelle 2 jours avant ; dépassée, l’étape passe « En retard » et vous proposez une nouvelle date.</p></div><p style="display:none">`, confirm: 'Déclarer le début',
              onConfirm: () => { const v = (document.querySelector('#fin-prevue') || {}).value || dflt; actions.declareStart(pid, sid, v); sfx('pose'); toast('Début déclaré', 'play'); } });
          },
          'new-date'() {
            const jour = (d) => new Date(d).toISOString().slice(0, 10);
            openSheet(`<h2>Proposer une nouvelle date</h2><p class="muted small" style="margin-bottom:12px">La fin prévue est dépassée. ${esc(who('client'))} accepte la nouvelle date (l’étape repasse « En cours ») ou la refuse (un désaccord peut alors être ouvert). TEEQA ne tranche pas.</p>
              <div class="field"><label for="nd-date">Nouvelle date de fin</label><input id="nd-date" class="input" type="date" min="${jour(nowMs() + 864e5)}" value="${jour(nowMs() + 7 * 864e5)}"></div>
              <div class="field" style="margin-top:10px"><label for="nd-motif">Pourquoi <span class="meta">(facultatif)</span></label><input id="nd-motif" class="input" maxlength="160" autocomplete="off" placeholder="Ex. Livraison des menuiseries décalée"></div>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-nd-ok>Envoyer au client</button></div>`, { label: 'Nouvelle date',
              onMount: (el) => el.querySelector('[data-nd-ok]').addEventListener('click', () => { const d = el.querySelector('#nd-date').value; if (!d) { toast('Choisissez une date', 'info'); return; }
                actions.proposerDate(pid, sid, d, el.querySelector('#nd-motif').value); closeSheet(); toast('Nouvelle date envoyée au client', 'send'); }) }); },
          'date-ok'() { confirmSheet({ title: 'Accepter la nouvelle date ?', body: `La fin de « ${esc(s.title)} » est reportée au ${s.nouvelleDate ? fmtDate(s.nouvelleDate.date) : ''}. L’étape repasse « En cours ».`, confirm: 'Accepter',
            onConfirm: () => { actions.repondreDate(pid, sid, true); toast('Nouvelle date acceptée', 'check'); } }); },
          'date-no'() { confirmSheet({ title: 'Refuser la nouvelle date ?', body: "L’étape reste en retard. Vous pourrez ouvrir un désaccord, avec votre motif ; TEEQA ne tranche pas.", confirm: 'Refuser', danger: true,
            onConfirm: () => { actions.repondreDate(pid, sid, false); toast('Nouvelle date refusée', 'close'); go(`#/c/${pid}/step/${sid}/thread?k=contestation`); } }); },
          end() {
            confirmSheet({ title: holdPoint(p, s) ? 'Ferraillage prêt ?' : 'Déclarer la fin ?', body: (PHOTO_IMPOSEE[s.title] ? `Photo imposée parmi les vôtres : ${PHOTO_IMPOSEE[s.title]}. ` : '') + (holdPoint(p, s) ? `Point d'arrêt avant coulage : ne coulez pas le béton avant l'avis du contrôleur. Une agence accepte la mission sous 24 h, puis passe sous ${visitDelay(p) > 72 ? '5 jours (chantier hors des villes desservies)' : '72 h'} voir les aciers. Vous déclarerez ensuite le coulage avec deux photos et le bon de livraison du béton : l'étape sera alors finie.` : isControlled(s) ? "Une fin déclarée n'est pas une étape vérifiée : le contrôleur passera sur place pour photographier et signer un avis." : "Cette étape n'a pas de visite de contrôle : le client consultera vos photos. Une fin déclarée n'est pas une étape vérifiée."), confirm: holdPoint(p, s) ? 'Ferraillage prêt · demander la visite' : 'Déclarer la fin',
              onConfirm: () => { actions.declareEnd(pid, sid); sfx('pose'); toast(holdPoint(p, s) ? 'Ferraillage prêt · visite demandée' : isControlled(s) ? 'Fin déclarée · avis attendu' : 'Fin déclarée · à consulter par le client', 'flag'); } });
          },
          book() { bookSheet(p, s); },
          call() { toast(`Appel relayé vers ${p.surPlace ? p.surPlace.qui : 'le chef de chantier'} · votre numéro reste masqué`, 'phone'); },
          'cancel-book'() { confirmSheet({ title: 'Annuler le créneau réservé ?', body: "La visite sera demandée dans le délai ordinaire quand vous indiquerez le ferraillage prêt.", confirm: 'Annuler le créneau', danger: true, onConfirm: () => { actions.cancelBooking(pid, sid); toast('Créneau annulé', 'calendar'); } }); },
          appeal() { appealSheet(p, s, r); },
          'late-switch'() { confirmSheet({ title: 'Demander une autre agence ?', body: `${REGLES.delaiVisite} La fin prévue se décale d'autant.`, confirm: 'Demander une autre agence',
            onConfirm: () => { actions.lateSwitch(pid, sid, r); toast('Autre agence demandée · délais suspendus', 'send'); } }); },
          'mission-ok'() { actions.acceptMission(p.id, s.id); sfx('success'); const n = pointsCles(checkPoints(s)); toast(`Visite acceptée. Sur place, prévoyez ${n} photo${n > 1 ? 's' : ''} (une par point clé), plus une par point à reprendre qui n’est pas un point clé.`); },   // vague 21 (doigt : Imane) : annoncé dès l'acceptation
          ack() {
            confirmSheet({ title: 'Déclaration consultée ?', body: "Cette étape n'a pas de visite de contrôle : rien n'est vérifié sur place. En confirmant, vous ouvrez l'étape suivante.", confirm: "J'ai consulté la déclaration",
              onConfirm: () => { actions.ackStep(pid, sid); toast('Déclaration consultée · étape suivante ouverte', 'eye'); } });
          },
          // Vague 24 (contrôleurs, 4 fiches) : le contrat type s'ouvre, en 7 articles courts.
          'contrat-type'() { const A = [['Objet', 'Contrôler sur place les points de l’étape listés dans la mission, et signer un avis daté.'], ['Délai', 'Accepter sous 24 h ; passer au créneau choisi, au plus tard à la date promise au client.'], ['Rémunération', `${prix(TARIFS.remuneration.visite, { eur: false })} par visite, déplacement en plus, versés par l’agence sous 15 jours après l’avis signé ; contre-visite et second avis selon la grille.`], ['Indépendance', 'Aucun lien avec le client ni l’entreprise ; un conflit d’intérêts se déclare et la mission se refuse.'], ['Responsabilité', 'Vous répondez d’un point mal noté qui était visible le jour de la visite ; l’assurance de l’agence vous couvre. « Non vu » ne vous engage pas.'], ['Confidentialité', 'Plans, adresse et photos servent à la mission seulement ; rien n’est publié.'], ['Désistement', 'Possible jusqu’à 24 h avant le créneau, avec un motif lu par TEEQA et l’agence ; l’agence confie la visite à un autre contrôleur.']];
            openSheet(`<h2>Contrat de mission type</h2><p class="muted small" style="margin-bottom:10px">Entre l’agence de contrôle et son contrôleur, joint à chaque mission. TEEQA n’en est pas partie.</p><ol class="stack" style="gap:8px;padding-left:18px;margin:0" data-testid="contrat-articles">${A.map(([t, x]) => `<li><b>${t}.</b> <span class="meta">${x}</span></li>`).join('')}</ol><button class="btn ghost block" style="margin-top:14px" data-act="sheet-close">Fermer</button>`, { label: 'Contrat type' }); },
          'mission-no'() {
            // Vague 24 (contrôleurs, 4 fiches) : une feuille de motif, lue seulement par TEEQA et l'agence ; aucune pénalité.
            const MOT = ['Pas disponible à ces dates', 'Trop loin de mon secteur', 'Je connais le client ou l’entreprise (conflit d’intérêts)', 'Hors de ma compétence (ouvrage particulier)', 'Autre raison'];
            openSheet(`<h2>Refuser la mission ?</h2><p class="muted small" style="margin-bottom:10px">TEEQA la propose aussitôt à une autre agence de la zone. Votre motif n’est lu que par TEEQA et votre agence ; ni le client ni l’entreprise ne le voient. Aucune pénalité.</p><div class="list" role="radiogroup" aria-label="Motif du refus" data-testid="refus-motifs">${MOT.map((m, i) => `<button class="list-item" role="radio" aria-checked="false" data-rm="${i}"><span class="grow"><span class="t">${m}</span></span></button>`).join('')}</div><textarea class="input" id="refus-txt" rows="2" style="width:100%;box-sizing:border-box;height:auto;margin-top:10px;padding:10px 14px" placeholder="Précision (facultatif)"></textarea><div class="stack" style="margin-top:12px"><button class="btn danger block" data-refus-ok disabled data-testid="refus-ok">Refuser la mission</button><button class="btn ghost block" data-act="sheet-close">Garder la mission</button></div>`,
              { label: 'Refuser la mission', onMount: (el) => { let pick = null; const ok = el.querySelector('[data-refus-ok]'); el.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { pick = MOT[+b.dataset.rm]; el.querySelectorAll('[data-rm]').forEach(x => x.setAttribute('aria-checked', String(x === b))); ok.disabled = false; sfx('choix'); }));
                ok.addEventListener('click', () => { if (!pick) return; const motif = [pick, el.querySelector('#refus-txt').value.trim()].filter(Boolean).join(' · '); closeSheet(true); (() => { actions.declineMission(pid, sid, false, motif); sfx('send');   // vague 21 (jury : 5 mentions) : la suite d'un refus, écrite
                setTimeout(() => openSheet(`<h2>Mission refusée</h2><div class="stack" style="gap:8px;margin-top:8px" data-testid="refus-suite"><p class="meta" style="margin:0">${icon('check', 'xs')} Refus enregistré le ${esc(fmtFull(new Date(nowMs()).toISOString()))}, motif transmis à TEEQA et à votre agence seulement, sans pénalité.</p><p class="meta" style="margin:0">${icon('send', 'xs')} TEEQA propose la visite à une autre agence de la zone ; la date promise au client ne change pas.</p><p class="meta" style="margin:0">${icon('eye', 'xs')} Le client et l’entreprise lisent seulement « proposée à une autre agence » : ni votre nom ni votre refus.</p><p class="meta" style="margin:0">${icon('archive', 'xs')} La mission sort de votre liste ; rien ne vous est payé pour elle.</p></div><button class="btn block" style="margin-top:14px" data-go="#/home">Retour à mes missions</button>`, { label: 'Mission refusée' }), 250); })(); }); } });
          },
          'corr-ok'() {
            confirmSheet({ title: 'Signer la levée des réserves ?', body: "Vous jugez, d'après la photo, que la correction est conforme. Vous signez une levée des réserves, horodatée, visible du client et de l'entreprise. L'étape passe en « Corrigée · contrôlée sur photo » et l'étape suivante s'ouvre.", confirm: 'Signer la levée',
              onConfirm: () => { actions.verifyCorrection(pid, sid, true); sfx('valide'); toast('Levée des réserves signée', 'checkCircle'); } });
          },
          'slot-libre'() { const m = s.mission; openSheet(`<h2>Proposer un autre moment</h2><p class="meta" style="margin:0 0 10px">Hors des trois plages, toujours avant le ${fmtFull(visitBy(m))}. Le client et l’entreprise sont prévenus.</p><div class="list">${slotLibres(m).map(o => `<button class="list-item" data-act="slot" data-at="${o.at}" data-h="libre" data-day="${o.day}"><span class="ico-tile">${icon('clock')}</span><span class="grow"><span class="t">${esc(slotLabel(o).replace(/^le /, '').replace(', proposé par le contrôleur', ''))}</span></span></button>`).join('')}</div>`); },
          slot(b) { closeSheet(); actions.pickSlot(pid, sid, { day: +b.dataset.day, h: b.dataset.h, at: b.dataset.at }); sfx('choix'); toast('Créneau choisi · client et entreprise prévenus', 'clock'); },
          proof() { const dc = s.decision; openSheet(`<h2>Justificatif du virement</h2><div class="card stack" style="align-items:center;justify-items:center;text-align:center;gap:6px;padding:26px 16px;margin:10px 0 14px">${icon('file', 'lg')}<b>Ordre de virement · photo</b><span class="meta">Montant masqué dans TEEQA</span></div>
            <dl class="kv" style="margin:0 0 14px"><dt>Joint par</dt><dd>${esc(who('client'))}</dd><dt>Date</dt><dd class="mono">${fmtFull(dc.proofAt || dc.at)}</dd><dt>Réception</dt><dd>${dc.receivedAt ? `Confirmée par ${esc(who('entreprise'))} le ${fmtFull(dc.receivedAt)}` : "Pas encore confirmée par l'entreprise"}</dd></dl>
            <p class="meta">Photo du reçu ou de l'ordre de virement. TEEQA ne vérifie pas les virements et n'affiche aucun montant.</p>
            <button class="btn ghost block" data-act="sheet-close" style="margin-top:12px">Fermer</button>`, { label: 'Justificatif du virement' }); },
          'corr-ko'() {
            const last = s.corrections.filter(c => c.verdict === 'ko').length + 1 >= MAX_CORRECTIONS;
            openSheet(`<h2>Correction insuffisante</h2>
              <p class="muted small" style="margin-bottom:12px">${last ? `C'est la ${MAX_CORRECTIONS}e correction insuffisante : l'étape passera en Refusé, avec une contre-visite à la charge de l'entreprise.` : "L'entreprise pourra envoyer une dernière correction. Après " + MAX_CORRECTIONS + " corrections insuffisantes, l'étape passe en Refusé, avec une contre-visite à la charge de l'entreprise."}</p>
              <div class="field"><label for="ko-note">Ce qui reste à corriger <span class="meta">(obligatoire, 10 caractères min.)</span></label>
                <textarea id="ko-note" class="textarea" maxlength="200" placeholder="Ex. Les joints du mur du salon restent creux par endroits."></textarea></div>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-ko-ok>Confirmer</button></div>`, {
              label: 'Correction insuffisante',
              onMount: (el) => el.querySelector('[data-ko-ok]').addEventListener('click', () => { if (el.querySelector('#ko-note').value.trim().length < 10) { toast('Dites ce qui reste à corriger (10 caractères au moins)', 'alert'); return; } actions.verifyCorrection(pid, sid, false, el.querySelector('#ko-note').value.trim()); closeSheet(); sfx('reserve'); toast(last ? 'Étape passée en Refusé' : 'Correction jugée insuffisante', 'alert'); }) });
          },
          'ask-visit'() {
            confirmSheet({ title: 'Demander une visite sur place ?', body: "Plutôt qu'un contrôle sur photo, un contrôleur viendra sur le chantier. TEEQA propose la mission à une agence de la zone. Cette visite est à votre charge, sauf si elle montre que la correction n'est pas faite : elle est alors à la charge de l'entreprise.", confirm: 'Demander la visite',
              onConfirm: () => { actions.askVisit(pid, sid); toast('Visite sur place demandée', 'send'); } });
          },
          remind(b) { actions.remind(pid, sid, b.dataset.k); toast('Relance envoyée', 'send'); },
          'undo-decision'() { actions.undoDecision(pid, sid); },
          'seq-verser'() { confirmSheet({ title: 'Faire verser à l’entreprise ?', body: `${esc(SEQUESTRE.banque)} verse ${esc(trancheName(p, s))} (${dh(s.sequestre.dh)}) à ${esc(who('entreprise'))}. C'est votre « J'ai payé cette tranche » : la banque exécute le virement, TEEQA ne touche pas l'argent.`, confirm: 'Faire verser', onConfirm: () => { actions.verserSequestre(pid, sid); sfx('send'); toast('Versement demandé à la banque · tranche soldée', 'wallet'); } }); },
          'seq-opposer'() { openSheet(`<h2>Je m'oppose au versement</h2><p class="muted small" style="margin-bottom:12px">L'argent reste sur le compte de ${esc(SEQUESTRE.banque)} ; ${esc(who('entreprise'))} lit votre motif. Il y reste jusqu'à un accord écrit de vous deux, ou la décision d'un médiateur ou d'un juge. TEEQA ne tranche pas.</p>
              <div class="field"><label for="seq-motif">Pourquoi ? <span class="meta">(10 caractères au moins)</span></label><input id="seq-motif" class="input" maxlength="160" autocomplete="off" placeholder="Ex. Les joints des angles ne sont pas refaits" data-testid="seq-motif"></div>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-seq-ok disabled>M'opposer</button></div>`, { label: "Je m'oppose au versement",
              onMount: (el) => { const inp = el.querySelector('#seq-motif'), ok = el.querySelector('[data-seq-ok]'); inp.addEventListener('input', () => { ok.disabled = inp.value.trim().length < 10; });
                ok.addEventListener('click', () => { actions.opposerSequestre(pid, sid, inp.value); closeSheet(); toast('Opposition envoyée · l’argent reste à la banque', 'check'); }); } }); },
          received() {
            confirmSheet({ title: 'Paiement reçu ?', body: "Vous indiquez avoir reçu le paiement de cette tranche. TEEQA ne vérifie pas les virements : c'est une déclaration, visible du client.", confirm: "J'ai reçu le paiement",
              onConfirm: () => { actions.confirmPayment(pid, sid); recompense('Paiement reçu · le client le voit'); } });
          },
          noop() {},
          'pay-late'() { confirmSheet({ title: 'Relancer le client ?', body: "Le client est prévenu, avec la date et le nombre de jours de retard, que la tranche n'est pas payée à l'échéance prévue par la convention. TEEQA ne tranche pas et ne détient pas l'argent des travaux.", confirm: 'Prévenir le client',
            onConfirm: () => { actions.payLate(pid, sid); toast('Relance envoyée au client', 'send'); } }); },
          'late-agence'() { actions.declineMission(pid, sid, true); toast('Visite proposée à une autre agence de la zone', 'send'); go(`#/c/${pid}/step/${sid}`, { replace: true }); },
          // Vague 10 : empêchement à moins de 24 h du créneau (maladie, accident, panne) : l'agence envoie un autre contrôleur.
          empechement() { openSheet(`<h2>Empêchement de dernière minute</h2><p class="muted small" style="margin-bottom:12px">${esc(REGLES.empechement)} Votre agence est prévenue tout de suite ; ce déplacement ne vous est pas payé.</p>
              <div class="field"><label for="em-motif">Motif</label><input id="em-motif" class="input" maxlength="80" autocomplete="off" placeholder="Ex. Malade, panne de voiture"></div>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-em-ok disabled>Prévenir l'agence</button></div>`, { label: 'Empêchement',
              onMount: (el) => { const i = el.querySelector('#em-motif'), ok = el.querySelector('[data-em-ok]'); i.addEventListener('input', () => { ok.disabled = i.value.trim().length < 3; });
                ok.addEventListener('click', () => { actions.empechement(pid, sid, i.value); closeSheet(); toast('Agence prévenue · un autre contrôleur passera', 'send'); go('#/home'); }); } }); },
          withdraw() { openSheet(`<h2>Me désister de cette visite</h2>
              <p class="muted small" style="margin-bottom:12px">${esc(REGLES.desist)}</p>
              <div class="field"><label for="wd-motif">Motif <span class="meta">(obligatoire, lu par TEEQA et votre agence)</span></label><input id="wd-motif" class="input" maxlength="120" autocomplete="off" placeholder="Ex. Malade, autre visite urgente de l'agence"></div>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-wd-ok disabled>Me désister</button></div>`, { label: 'Me désister',
              onMount: (el) => { const i = el.querySelector('#wd-motif'), ok = el.querySelector('[data-wd-ok]'); i.addEventListener('input', () => { ok.disabled = i.value.trim().length < 4; });
                ok.addEventListener('click', () => { actions.withdrawMission(pid, sid, i.value); closeSheet(); toast('Désistement enregistré · visite confiée à un autre contrôleur', 'send'); go('#/home'); }); } }); },
          'not-received'() { confirmSheet({ title: 'Paiement pas reçu ?', body: "Le client sera prévenu que vous n'avez pas reçu ce paiement. TEEQA ne vérifie pas les virements et ne tranche pas : vérifiez ensemble le justificatif ou la banque.", confirm: "Je n'ai pas reçu ce paiement",
            onConfirm: () => { actions.notReceived(pid, sid); toast('Client prévenu', 'send'); } }); },
          paid() { paidSheet(pid, sid); },
          wait() { waitSheet(pid, sid); },
          coulage() { confirmSheet({ title: 'Déclarer le coulage ?', body: "Vous indiquez que le béton est coulé, après l'avis du contrôleur sur le ferraillage. Deux photos du coulage sont jointes (vue d'ensemble et détail) : une seule ne suffit pas. La photo du bon de livraison de la centrale à béton (classe du béton, heure de départ) part avec : elle reste au dossier et le contrôleur de l'étape suivante la relit. Si la note de calcul prévoit des éprouvettes, joignez leur résultat à 28 jours dans les documents. Le client et le contrôleur sont prévenus.", confirm: 'Déclarer le coulage',
            onConfirm: () => { actions.declareCoulage(pid, sid); sfx('pose'); toast('Coulage déclaré · 2 photos et le bon de livraison', 'check'); } }); },
          constat() { noteSheet({ title: 'Visite de constat', intro: esc(REGLES.constat), onOk: (t) => actions.askConstat(pid, sid, t) }); },
          'pay-undo'() { noteSheet({ title: 'Corriger ma déclaration', intro: "Vous retirez « J'ai payé cette tranche », faite trop tôt ou par erreur. Rien ne s'efface : la déclaration et son retrait restent datés au fil, et l'entreprise est prévenue. La tranche redevient à payer.", onOk: (t) => actions.corrigerPaiement(pid, sid, { motif: t }) }); },
          observe() { noteSheet({ title: "Observation sur l'avis", intro: "Votre observation est jointe au dossier et visible du client. Elle ne change pas l'avis ; pour le contester, demandez un second avis.", photo: true, onOk: (t, ph) => actions.observeReview(pid, sid, { text: t, photo: ph }) }); },
          piece(b) { const x = (p.pieces || []).find(y => y.id === b.dataset.id); if (!x) return; openSheet(`<h2>${esc(x.title)}</h2><div class="card stack" style="align-items:center;justify-items:center;text-align:center;gap:6px;padding:26px 16px;margin:10px 0 14px">${icon('file', 'lg')}<b>${esc(x.note || '')}</b><span class="meta">Déposé par ${esc(who(x.by))} le ${fmtFull(x.at)}</span></div><p class="meta">Pièce de référence pour la visite. Gardée sur l'appareil une fois ouverte, lisible sans réseau.</p><button class="btn ghost block" data-act="sheet-close" style="margin-top:12px">Fermer</button>`, { label: x.title }); },
          'visit-impossible'() {
            openSheet(`<h2>Visite impossible</h2>
              <p class="muted small" style="margin-bottom:12px">La visite est reportée de 3 jours. Le client et l'entreprise sont prévenus avec votre motif. <b data-testid="vi-paie">Votre déplacement vous est payé ${prix(TARIFS.remuneration.visiteImpossible, { eur: false })}</b> quand la cause vient du chantier (accès, absence, travaux pas finis, danger).</p>
              <div class="field"><label for="vi-motif">Motif <span class="meta">(court)</span></label>
                <input id="vi-motif" class="input" maxlength="80" placeholder="Ex. Accès au chantier fermé, intempéries" autocomplete="off"></div>
              <div class="chips" style="margin-top:8px">${['Accès fermé', 'Personne sur place pour ouvrir', 'Travaux pas finis, contrairement à la déclaration', 'Intempéries', 'Chantier dangereux (étaiement, échafaudage, tranchée)'].map(t => `<button class="chip outline" data-vi="${t}">${t}</button>`).join('')}</div>
              <label class="card row" style="gap:12px;cursor:pointer;margin-top:10px" data-testid="vi-photo"><input type="checkbox" id="vi-photo" checked style="width:22px;height:22px;accent-color:var(--success)"><span class="grow"><b>Joindre une photo de ce que vous voyez</b><div class="meta">Portail fermé, chantier vide… avec l’heure et la position : elle justifie votre déplacement.</div></span>${icon('camera', 'sm')}</label>
              <p class="meta" style="margin-top:8px">Chantier dangereux : ne prenez aucun risque. Vous n'entrez pas, vous photographiez de l'extérieur si vous le pouvez ; la visite est faite quand l'entreprise a sécurisé l'accès, et votre déplacement vous est payé.</p>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-vi-ok disabled>Reporter la visite</button></div>`, {
              label: 'Visite impossible',
              onMount: (el) => { const inp = el.querySelector('#vi-motif'), ok = el.querySelector('[data-vi-ok]');
                el.querySelectorAll('[data-vi]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.vi; ok.disabled = false; }));
                inp.addEventListener('input', () => { ok.disabled = inp.value.trim().length < 3; });
                ok.addEventListener('click', () => { const ph = el.querySelector('#vi-photo').checked; actions.visitImpossible(pid, sid, inp.value.trim(), { photo: ph }); closeSheet(); toast(ph ? 'Visite reportée · photo jointe, parties prévenues' : 'Visite reportée · parties prévenues', 'clock'); }); } });
          },
          decide() {
            openSheet(`<h2>Payer ou attendre ?</h2>
              <p class="muted small" style="margin-bottom:14px">${rv ? `Recommandation : <b>${advice(p, s, rv).title.toLowerCase()}</b>. ` : "Pas de recommandation : étape sans visite de contrôle. "}${DECIDE_LINE}</p>
              <div class="stack">
                <button class="card row" style="text-align:left;width:100%" data-dec="indique"><span class="ico-tile success">${icon('wallet')}</span><span class="grow"><b>J'ai payé cette tranche</b><div class="meta">Paiement fait hors TEEQA · non vérifié</div></span></button>
                <button class="card row" style="text-align:left;width:100%" data-dec="attend"><span class="ico-tile saffron">${icon('pause')}</span><span class="grow"><b>Je préfère attendre</b><div class="meta">Avec un motif ; l'entreprise peut relancer après 7 jours</div></span></button>
                <button class="btn ghost block" data-act="sheet-close">Annuler</button>
              </div>`, { label: 'Décision hors app', onMount: (el) => el.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => { closeSheet(true); if (b.dataset.dec === 'indique') paidSheet(pid, sid); else waitSheet(pid, sid); })) });
          },
        },
        // Célébration (cahier 5.10) : une seule fois, quand le client ouvre une étape qui vient d'être validée.
        mount(el) {
          const sc = el.querySelector('.scroll'), img = el.querySelector('.sc-img');
          if (sc && img) { const f = () => { const y = sc.scrollTop; img.style.transform = y > 0 ? `translate3d(0,${(y * 0.38).toFixed(1)}px,0)` : `scale(${(1 - y / 260).toFixed(3)})`; }; sc.addEventListener('scroll', f, { passive: true }); f(); }
          // Célébration plein écran, une seule fois par avis, pour le client et l'entreprise (on peut la revoir en touchant la puce « Vérifiée »).
          if (pendingFete(p, r) !== s) return;
          actions.feteVue(pid, sid, r); setTimeout(() => fete(p, s, rv), 350);
        },
      };
    },
  },
  // ---------- Caméra : consentement → viseur → aperçu ----------
  {
    name: 'camera', pattern: /^\/c\/([^/]+)\/step\/([^/]+)\/(camera|correction|client)$/,
    render(pid, sid, mode) { return cameraView(pid, sid, mode); },
  },
  // ---------- Avis motivé + signature ----------
  {
    name: 'review', pattern: /^\/c\/([^/]+)\/step\/([^/]+)\/review$/,
    render(pid, sid) {
      const p = project(pid), s = step(p, sid);
      if (!s) return { redirect: '#/home' };
      const r = get().role;
      const back = `#/c/${pid}/step/${sid}`;
      if (!can(r, p, s, 'review')) return { html: `${appbar({ title: 'Avis', back })}<div class="content"><div class="notice saffron">${icon('lock', 'sm')}<span>L'avis est signé par le contrôleur, après la fin déclarée, la visite acceptée et au moins une photo prise sur place et envoyée.</span></div></div>` };
      const key = `review:${pid}:${sid}`;
      const d = get().drafts[key] || { verdict: null, motif: '', pieces: s.photos.filter(ph => ph.by === 'controleur' && ph.at >= s.endDeclaredAt).map(ph => ph.id) };
      // Vague 21 (doigt : Imane) : les photos prises après l'ouverture de l'avis s'y joignent seules (une photo retirée à la main reste retirée).
      { const surPlace = s.photos.filter(ph => ph.by === 'controleur' && ph.at >= s.endDeclaredAt).map(ph => ph.id), vus = d.vus || d.pieces.slice(); surPlace.filter(id => !vus.includes(id)).forEach(id => d.pieces.push(id)); d.vus = surPlace; }
      // M08 : points de contrôle. Tous doivent recevoir un état ; un point « à reprendre » interdit l'avis Validé.
      const pts = draftPoints(s, d); d.points = d.points || {};
      // Vague 15 : en contre-visite, seuls les points refusés se notent ; les autres gardent l'état de l'avis précédent, sans geste.
      const cv0 = enContreVisite(s), revus0 = cv0 ? pointsRevus(s) : [], prevPts = cv0 ? (s.reviews[s.reviews.length - 1].points || []) : [];
      const fige = (t) => cv0 && revus0.length && !revus0.includes(t);
      // Vague 25 (doigt : Kenza) : les photos des points clés prises, « Conforme » est proposé partout (« Tout conforme sauf… ») ; un toucher sur « À reprendre » change un point.
      if (!cv0 && !d.prefill && d.pieces.length >= Math.max(1, pointsCles(pts)) && !Object.keys(d.points).length) { d.propose = {}; pts.forEach((t, i) => { d.points[i] = 'ok'; d.propose[i] = true; }); d.prefill = true; }
      if (cv0) pts.forEach((t, i) => { if (fige(t) && !d.points[i]) { const x = prevPts.find(y => y.label === t); d.points[i] = x && ['ok', 'so'].includes(x.state) ? x.state : 'ok'; } });
      const allPts = pts.every((_, i) => d.points[i]), ko = valideInterdit(pts.map((label, i) => ({ label, state: d.points[i] }))), clash = ko && d.verdict === 'validee';
      // Vague 4 : une photo par point à reprendre (dans les pièces jointes).
      const nKo = pts.filter((_, i) => d.points[i] === 'ko').length, nReq = cv0 ? Math.max(1, revus0.length) : photosRequises(pts, d.points), photosOk = d.pieces.length >= nReq;   // vague 17 : REGLES.photosAvis
      // Vague 7 : classement automatique. Au point d'arrêt, ou si un point de structure est à reprendre, c'est « structure » (sur place), sans choix.
      const forced = reserveSurPlace(p, s, pts.map((label, i) => ({ label, state: d.points[i] })));
      if (d.verdict === 'retardee' && (forced || !d.recheck)) d.recheck = forced ? 'visite' : 'photo';
      const offline = !!get().net.offline;
      // Vague 19 (contrôleurs, NON TRAITÉ 51) : sur un point clé noté Conforme qui se mesure, la mesure relevée est obligatoire.
      const mesManque = pts.filter((t, i) => !fige(t) && d.points[i] === 'ok' && estCle(t) && mesureOf(t) && !String((d.mes || {})[i] || '').trim()), mesOk = !mesManque.length;
      const valid = d.verdict && motifOk(d.verdict, d.motif) && allPts && !clash && photosOk && mesOk;
      // Vague 20 (doigt : Salma) : « Relire et signer » dit ce qui manque, au lieu d'un bouton gris muet.
      const nLeft = pts.filter((_, i) => !d.points[i]).length;
      // Vague 22 (doigt : Salma) : dire pour quels points il manque une photo (dans l'ordre de la liste), au lieu de « Joignez encore 5 photos ».
      const ptsPhoto = (enContreVisite(s) ? pointsRevus(s) : pts.filter((t, i) => estCle(t) || (d.points[i] === 'ko' && !STRUCTURE_RX.test(t || '')))), ptsSansPhoto = ptsPhoto.slice(d.pieces.length);
      const manqueTxt = `Joignez encore ${nReq - d.pieces.length} photo${nReq - d.pieces.length > 1 ? 's' : ''}${ptsSansPhoto.length ? ` : ${ptsSansPhoto.map(t => `« ${t.split(/[,(:]/)[0].trim()} »`).join(', ')}` : ''}.`;
      const whyOf = (mesOk) => !allPts ? `Il reste ${nLeft} point${nLeft > 1 ? 's' : ''} à noter.` : !mesOk ? `Mesure à relever sur ${mesManque.length > 1 ? `${mesManque.length} points clés` : 'un point clé'} noté${mesManque.length > 1 ? 's' : ''} Conforme : ${mesManque.map(t => `« ${t.split(/[,(:]/)[0].trim()} »`).join(', ')}.` : !d.verdict ? 'Choisissez votre avis : Validé, Réserves ou Refusé.' : clash ? 'Un point est « à reprendre » : l’avis ne peut pas être Validé.' : !motifOk(d.verdict, d.motif) ? (/Précisez : lequel/.test(d.motif || '') ? 'Précisez le motif : remplacez « Précisez : lequel, de combien » par ce que vous avez vu.' : 'Écrivez le motif (une phrase, 10 lettres au moins).') : !photosOk ? manqueTxt : '';
      const whyNot = whyOf(mesOk);
      const nCles = pointsCles(pts), restOk = d.pieces.length >= nCles && pts.some((_, i) => d.points[i]), cv = enContreVisite(s), revus = pointsRevus(s);
      const ctrl = s.photos.filter(ph => ph.by === 'controleur' || ph.by === 'entreprise');
      return {
        html: `${appbar({ title: cv ? 'Contre-visite' : 'Rédiger l’avis', back, close: true, sep: true })}
        <div class="scroll"><div class="content stack" style="gap:18px;padding-top:14px">
          <div><div class="over">Étape ${p.steps.indexOf(s) + 1} · ${esc(p.name)}</div><h2 class="h2" style="margin-top:4px">${esc(s.title)}</h2></div>
          ${cv ? `<div class="notice saffron" data-testid="portee-cv">${icon('refresh', 'sm')}<span><b>Contre-visite.</b> Votre Validé couvre ${revus.length > 1 ? `les ${revus.length} points revus` : 'le point revu'} : ${esc(revus.join(' ; ') || 'la correction')}. Les autres points restent ceux de l’avis du ${fmtDate(rv0(s).signedAt || rv0(s).at).replace(/\.$/, '')}.</span></div>` : ''}
          ${d.prefill && !cv ? `<div class="notice success" data-testid="sauf-conforme">${icon('checkCircle', 'sm')}<span><b>Tout conforme sauf… :</b> vos photos sont prises, « Conforme » est proposé pour chaque point. Touchez « À reprendre » ou « Non vu » là où ce n’est pas le cas, puis relisez.</span></div>` : ''}
          <div class="field"><label id="lbl-p">Points de contrôle <span class="meta">(${cv ? `${revus.length} à revoir` : `${pts.filter((_, i) => d.points[i]).length} sur ${pts.length}`})</span></label>
            ${(() => { const rest = pts.map((t, i) => [t, i]).filter(([t, i]) => !d.points[i] && !fige(t)); return rest.length && rest.length < pts.length + 1 ? `<div class="pts-restants" data-testid="pts-restants"><span class="meta"><b>${rest.length > 1 ? `${rest.length} points restent` : '1 point reste'} à noter :</b></span><div class="chips">${rest.map(([t, i]) => `<button class="chip outline" data-act="to-point" data-i="${i}">${esc(t.split(/[,(:]/)[0].trim())}</button>`).join('')}</div></div>` : ''; })()}<div class="list checks" role="group" aria-labelledby="lbl-p">${pts.map((t, i) => `<div class="check-row" data-row="${i}"><span class="t">${can(r, p, s, 'photoControl') && !fige(t) ? `<button class="icon-btn pt-cam${ptsSansPhoto.includes(t) ? ' pt-manque' : ''}" data-go="#/c/${pid}/step/${sid}/camera" aria-label="Photographier : ${esc(t)}${ptsSansPhoto.includes(t) ? ' (photo manquante)' : ''}" data-testid="pt-cam">${icon('camera', 'sm')}</button>` : ''}${esc(t)}${!cv && STRUCTURE_RX.test(t) ? ` <span class="meta" data-testid="point-cle">· point clé</span>` : ''}${d.points[i] && !fige(t) ? ` <b class="pt-etat pt-${d.points[i]}" data-testid="pt-etat">${icon(d.points[i] === 'ko' ? 'alert' : 'check', 'xs')}${POINT_STATES[d.points[i]][0]}</b>` : ''}</span>
              ${mesureOf(t) ? `<label class="mes-in ${d.points[i] === 'ok' && estCle(t) && !String((d.mes || {})[i] || '').trim() ? 'need' : ''}"><input class="input" data-input="mes" data-i="${i}" inputmode="decimal" maxlength="6" autocomplete="off" value="${esc((d.mes || {})[i] || '')}" aria-label="Mesure relevée : ${esc(t)}" placeholder="Valeur"><span>${mesureOf(t)}${estCle(t) ? ' · obligatoire si Conforme' : ' · facultatif'}<br><b data-testid="attendu">${attenduOf(t)}</b></span></label>` : ''}${fige(t) ? `<span class="meta" data-testid="point-fige">${POINT_STATES[d.points[i]][0]} (avis du ${fmtDate(rv0(s).signedAt || rv0(s).at).replace(/\.$/, '')})</span>` : `<div class="check-seg" role="radiogroup" aria-label="${esc(t)}">${Object.entries(POINT_STATES).map(([k, [l]]) => `<button role="radio" class="ck-${k}" aria-checked="${d.points[i] === k}" data-act="point" data-i="${i}" data-k="${k}">${l}</button>`).join('')}</div>`}</div>`).join('')}</div>
            <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">${ko ? '' : `<button class="btn ghost sm" data-act="all-ok" data-testid="all-ok" ${allPts ? '' : `aria-disabled="true" data-why="${allPts ? 'Un point est « à reprendre » ou un point clé « non vu » : choisissez Réserves ou Refusé.' : `Notez d’abord chaque point (${pts.filter((_, i) => !d.points[i]).length} restant${pts.filter((_, i) => !d.points[i]).length > 1 ? 's' : ''}).`}"`}>${icon('checkCircle', 'sm')}Tout conforme : Validé</button>`}${(() => { const left = pts.filter((_, i) => !d.points[i]).length; return left && left < pts.length && !cv ? `<button class="btn ghost sm" data-act="rest-ok" data-testid="rest-ok" ${restOk ? '' : `aria-disabled="true" data-why="Joignez d’abord ${nCles} photo${nCles > 1 ? 's' : ''} des points clés (Pièces jointes, plus bas) : « Le reste conforme » s’ouvre ensuite."`}>${icon('check', 'sm')}Le reste conforme (${left})</button>` : ''; })()}<button class="btn ghost sm" data-act="add-point" data-testid="add-point">${icon('plus', 'sm')}Ajouter un point</button></div>
            <details class="more" data-testid="regles-avis"><summary>${icon('chevronDown', 'sm')}<span><b>Règles : photos, Validé, visible</b><small>${nReq} photo${nReq > 1 ? 's' : ''} demandée${nReq > 1 ? 's' : ''}, ${d.pieces.length} jointe${d.pieces.length > 1 ? 's' : ''}</small></span></summary><div class="more-in"><p class="meta" style="margin-top:6px" data-testid="regle-valide">${cv ? 'Contre-visite : notez seulement le(s) point(s) revu(s) ; les autres gardent l’état de l’avis précédent, sans « Le reste conforme ».' : `Un tap par point. Photos : ${esc(REGLES.photosAvis.charAt(0).toLowerCase() + REGLES.photosAvis.slice(1, -1))}, soit <b data-testid="photos-cles">${nReq} photo${nReq > 1 ? 's' : ''} demandée${nReq > 1 ? 's' : ''}, ${d.pieces.length} jointe${d.pieces.length > 1 ? 's' : ''}</b>. « Le reste conforme » note les autres d'un geste, une fois les photos des points clés jointes.`} « Validé » : aucun point « À reprendre », aucun point clé « Non vu ». ${esc(REGLES.nonVu.split('. ').slice(2).join('. '))}</p>
            <div data-testid="visible-exemples"><p class="meta" style="margin:0">${esc(REGLES.visible)} ${esc(REGLES.visibleExemples)}</p></div></div></details>
            ${clash ? `<div class="notice saffron" style="margin-top:8px">${icon('alert', 'sm')}<span>Un point est « à reprendre », ou un point clé est « non vu » : l'avis ne peut pas être Validé. Choisissez Réserves ou Refusé, ou revoyez le point.</span></div>` : ''}</div>
          <div class="field"><label id="lbl-v">Votre avis</label>
            <div class="verdicts" role="radiogroup" aria-labelledby="lbl-v">${Object.entries(VERDICTS).map(([k, v]) => `
              <button class="verdict v-${k}" role="radio" aria-checked="${d.verdict === k}" aria-pressed="${d.verdict === k}" data-act="verdict" data-v="${k}"${k === 'validee' && ko ? ' aria-disabled="true" style="opacity:.45"' : ''}>
                <span class="vd-ico">${icon(v.icon, 'lg')}</span><span class="grow"><b>${v.label}</b><span class="vd-sub">${VERDICT_HELP[k]}</span></span><span class="radio-mark" aria-hidden="true">${d.verdict === k ? icon('check', 'sm') : ''}</span></button>`).join('')}</div></div>
          ${d.verdict === 'retardee' ? `<div class="field"><label id="lbl-rc">Classement de la réserve <span class="meta">(${forced ? 'imposé au point d’arrêt' : 'obligatoire'})</span></label>
            ${forced ? `<div class="notice saffron" data-testid="classement-auto">${icon('shield', 'sm')}<span><b>Réserve de structure · contre-visite sur place.</b> ${esc(reserveWhy(p, s))}</span></div>` : `
            <div class="list" role="radiogroup" aria-labelledby="lbl-rc">${[['photo', 'Réserve de finition · contrôle sur photo', 'La correction est contrôlée sur photo'], ['visite', 'Réserve de structure · contre-visite', 'La correction est contrôlée sur place']].map(([k, l, sub]) => `
              <button class="list-item" role="radio" aria-checked="${d.recheck === k}" data-act="recheck" data-k="${k}"><span class="grow"><span class="t">${l}</span><div class="s">${sub}</div></span><span class="radio-mark" aria-hidden="true">${d.recheck === k ? icon('check', 'sm') : ''}</span></button>`).join('')}</div>`}
            <p class="meta" style="margin:6px 0 0" data-testid="classement-aide">${forced ? "Pas de choix ici : ce que le béton va cacher se contrôle sur place." : "En cas de doute, choisissez « structure »."} Votre agence relit le classement.</p></div>` : ''}
          <div class="field"><label for="motif">Motif <span class="meta" data-testid="motif-regle">(${d.verdict === 'validee' ? 'facultatif pour Validé' : 'obligatoire pour Réserves et Refusé : une phrase qui dit quoi reprendre, 10 lettres au moins'})</span></label>
            <textarea id="motif" class="textarea" data-input="motif" placeholder="${d.verdict === 'refusee' ? 'Ex. Ferraillage non conforme au plan : à reprendre.' : d.verdict === 'retardee' ? (holdPoint(p, s) ? 'Ex. Cales d’enrobage à poser sur les poteaux d’angle avant de couler.' : 'Ex. Joints mal garnis sur le mur du salon : à regarnir avant enduit.') : 'Ce que vous avez constaté sur place.'}">${esc(d.motif)}</textarea>${dictee() ? `<button class="btn ghost sm" style="margin-top:6px" data-act="dicter" data-testid="dicter">${icon('mic', 'sm')}Dicter le motif</button>` : ''}</div>
          ${/* Parcours A (26 nov.) · P6 du workflow : à la visite de réception (dernière étape), le contrôleur rédige le procès-verbal. */''}${s === p.steps[p.steps.length - 1] && !cv ? `<div class="field" data-testid="pv-redaction"><label for="pv-res">Procès-verbal de réception : réserves <span class="meta">(une par ligne, avec le délai ; laissez vide si aucune réserve)</span></label>
            <textarea id="pv-res" class="textarea" data-input="pv-res" data-testid="pv-res" placeholder="Ex. Joint de la fenêtre de la cuisine à reprendre, sous 30 jours.">${esc(d.pvRes || '')}</textarea>
            <p class="meta" style="margin:4px 0 0">Le client signe ensuite ce procès-verbal, puis l’entreprise le contresigne. TEEQA le conserve et ne certifie rien.</p></div>` : ''}
          <div class="field"><label>Pièces jointes <span class="meta">(${d.pieces.length} sur ${nReq} photo${nReq > 1 ? 's' : ''} demandée${nReq > 1 ? 's' : ''})</span></label>
            <p class="meta" style="color:var(--danger-ink)" data-testid="mesure-manque" ${mesOk ? 'hidden' : ''}>Mesure à relever : un point clé noté Conforme qui se mesure porte sa mesure (${esc(mesManque.map(x => x.split(/[:(]/)[0].trim()).join(', '))}).</p>
            ${!photosOk ? `<p class="meta" style="color:var(--danger-ink)" data-testid="photo-par-point">Il manque ${nReq - d.pieces.length} photo${nReq - d.pieces.length > 1 ? 's' : ''} : ${esc(REGLES.photosAvis.charAt(0).toLowerCase() + REGLES.photosAvis.slice(1))}</p>` : ''}
            <div class="pieces-strip">${d.pieces.map(id => s.photos.find(ph => ph.id === id)).filter(Boolean).map((ph, n) => `<button class="photo" data-act="pieces" aria-label="Pièce ${n + 1} : modifier le choix">${ph.dataUrl ? `<img src="${ph.dataUrl}" alt="">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction, stamp: false })}<span class="pk-n">${n + 1}</span></button>`).join('')}
              <button class="photo add" data-act="pieces" aria-label="Choisir les photos à joindre">${icon('plus')}<span>${d.pieces.length ? 'Modifier' : 'Choisir'}</span></button></div></div>
          <p class="meta">${d.verdict === 'retardee' ? (d.recheck === 'visite' ? "Réserves : l'entreprise corrigera, puis une contre-visite sur place contrôlera la correction. " : "Réserves : l'entreprise corrigera par photo dans l'appli ; la correction sera contrôlée sur photo. ") : d.verdict === 'refusee' ? 'Refusé : le travail est à reprendre, une nouvelle visite sera nécessaire. ' : ''}Brouillon enregistré automatiquement sur cet appareil.${offline ? " <b>Sans réseau :</b> vous pouvez signer maintenant ; l'avis garde l'heure de signature et part avec vos photos au retour du réseau." : ''}</p>
        </div></div>
        <div class="footer-cta"><button class="btn saffron block" data-act="to-sign" data-testid="to-sign" ${valid ? '' : `aria-disabled="true" data-vers='[data-act="to-manque"]' data-why="${esc(whyNot)}"`}>Relire et signer</button>${valid ? '' : `<button class="btn text block meta sign-why" data-act="to-manque" data-testid="sign-why">${esc(whyNot)}</button>`}${!photosOk && allPts && can(r, p, s, 'photoControl') ? `<button class="btn ghost block" style="margin-top:6px" data-go="#/c/${pid}/step/${sid}/camera" data-testid="photos-manquantes">${icon('camera', 'sm')}Photographier ${ptsSansPhoto.length > 1 ? `les ${ptsSansPhoto.length} points` : 'le point'} sans photo</button>` : ''}</div>`,
        on: {
          recheck(b) { d.recheck = b.dataset.k; actions.setDraft(key, d); sfx('choix'); go(`#/c/${pid}/step/${sid}/review`, { replace: true }); },
          verdict(b) { if (b.dataset.v === 'validee' && ko) { toast('Un point est « à reprendre » : choisissez Réserves ou Refusé', 'info'); return; }   // vague 26 (doigt : Samira ; jury n° 25)
            d.verdict = b.dataset.v; // vague 25 (Kenza) : motif prérempli à partir des points « À reprendre », modifiable
            const kos = pts.filter((x, i) => d.points[i] === 'ko').map((x) => x.replace(/\s*\(.*\)\s*$/, ''));
            let rempli = false; if (['retardee', 'refusee'].includes(d.verdict) && !String(d.motif || '').trim() && kos.length) { d.motif = `À reprendre : ${kos.join(' ; ')}. Précisez : lequel, de combien.`; rempli = true; }
            const y0 = b.getBoundingClientRect().top;   // vague 26 (doigt : Samira) : la page ne bouge pas sous le doigt quand le motif se remplit
            actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/review`, { replace: true });
            setTimeout(() => { const nb = [...document.querySelectorAll(`[data-act="verdict"][data-v="${d.verdict}"]`)].pop(), sc = nb && nb.closest('.scroll'); if (sc) sc.scrollTop += nb.getBoundingClientRect().top - y0; if (rempli) toast('Motif rempli depuis le point à reprendre : précisez-le', 'info'); }, 60); },
          'pv-res'(t) { d.pvRes = t.value; actions.setDraft(key, d); },
          motif(t) { d.motif = t.value; actions.setDraft(key, d); const b = t.closest('.screen').querySelector('[data-act="to-sign"]'), ok3 = !!(d.verdict && motifOk(d.verdict, d.motif) && allPts && !clash && photosOk && mesOk); setSign(b, ok3, !motifOk(d.verdict, d.motif) ? (/Précisez : lequel/.test(d.motif || '') ? 'Précisez le motif : remplacez « Précisez : lequel, de combien » par ce que vous avez vu.' : 'Écrivez le motif (une phrase, 10 lettres au moins).') : !photosOk ? manqueTxt : whyNot); },   // vague 21 (doigt : Imane) : le message suit ce qui manque vraiment
          mes(t) { d.mes = { ...(d.mes || {}), [t.dataset.i]: t.value.replace(/[^\d.,]/g, '').slice(0, 6) }; actions.setDraft(key, d);
            const ok2 = !pts.some((x, i) => !fige(x) && d.points[i] === 'ok' && estCle(x) && mesureOf(x) && !String((d.mes || {})[i] || '').trim()), b = t.closest('.screen').querySelector('[data-act="to-sign"]'), w = t.closest('.screen').querySelector('[data-testid="mesure-manque"]');
            if (b) setSign(b, !!(d.verdict && motifOk(d.verdict, d.motif) && allPts && !clash && photosOk && ok2), whyOf(ok2)); if (w) w.hidden = ok2;   // vague 21 (doigt : Imane) : la mesure tapée, le message dit la suite (l'avis), plus la mesure
            const lab = t.closest('.mes-in'); if (lab) lab.classList.toggle('need', d.points[t.dataset.i] === 'ok' && !String(d.mes[t.dataset.i] || '').trim()); },
          point(b) { d.points[b.dataset.i] = b.dataset.k; actions.setDraft(key, d); sfx('choix'); const y = b.closest('.scroll').scrollTop; go(`#/c/${pid}/step/${sid}/review`, { replace: true }); requestAnimationFrame(() => { const sc = document.querySelector('#app .screen:last-of-type .scroll'); if (sc) { sc.style.scrollBehavior = 'auto'; sc.scrollTop = y; sc.style.scrollBehavior = ''; } }); },
          pieces() { piecesSheet(s, d, (sel) => { d.pieces = sel; actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/review`, { replace: true }); }); },
          'to-sign'() { signSheet(p, s, d); },
          'to-point'(b) { const row = b.closest('.screen').querySelector(`.check-row[data-row="${b.dataset.i}"]`); if (row) { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.classList.add('pulse-manque'); setTimeout(() => row.classList.remove('pulse-manque'), 1600); } },
          // Vague 23 (contrôleurs, 4 fiches ; doigt : Nadia) : la phrase « ce qui manque » mène au premier point à noter, à la mesure ou au motif.
          'to-manque'(b) { const sc = b.closest('.screen'); const rows = [...sc.querySelectorAll('.check-row')];
            const t = rows.find(x => x.querySelector('.check-seg') && !x.querySelector('.check-seg [aria-checked="true"]')) || sc.querySelector('.mes-in.need') || (!d.verdict && sc.querySelector('.verdicts')) || (!motifOk(d.verdict, d.motif) && sc.querySelector('#motif')) || sc.querySelector('.pieces-strip');
            if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.classList.add('pulse-manque'); setTimeout(() => t.classList.remove('pulse-manque'), 1600); const inp = t.matches('textarea, input') ? t : t.querySelector && t.querySelector('input'); if (inp && t.classList.contains('mes-in')) inp.focus({ preventScroll: true }); } },
          // Vague 21 (contrôleurs) : le motif se dicte, d'une main, sur le chantier ; il reste à relire avant de signer.
          dicter(b) { const R = dictee(); if (!R) return; const rec = new R(); rec.lang = 'fr-FR'; rec.interimResults = false; b.setAttribute('aria-pressed', 'true'); b.lastChild.textContent = 'Parlez…';
            rec.onresult = (e) => { const t = [...e.results].map(x => x[0].transcript).join(' ').trim(); if (t) { d.motif = (d.motif ? d.motif.trim() + ' ' : '') + t.charAt(0).toUpperCase() + t.slice(1); actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/review`, { replace: true }); toast('Motif dicté : relisez-le avant de signer', 'mic'); } };
            rec.onend = () => { b.removeAttribute('aria-pressed'); b.lastChild.textContent = 'Dicter le motif'; }; rec.onerror = () => toast('Dictée indisponible : écrivez le motif', 'info'); try { rec.start(); } catch { toast('Dictée indisponible : écrivez le motif', 'info'); } },
          // Vague 12 : « Tout conforme » ne coche plus rien d'un geste : il s'ouvre quand chaque point est noté, et choisit Validé.
          // Vague 13 : un geste pour les points restants, après une photo sur place et au moins un point noté à la main.
          'rest-ok'() { if (!restOk || cv) return; pts.forEach((_, i) => { if (!d.points[i]) d.points[i] = 'ok'; }); actions.setDraft(key, d); sfx('choix'); go(`#/c/${pid}/step/${sid}/review`, { replace: true }); },
          'all-ok'() { if (!pts.every((_, i) => ['ok', 'so'].includes(d.points[i]))) return; d.verdict = 'validee'; actions.setDraft(key, d); sfx('choix'); go(`#/c/${pid}/step/${sid}/review`, { replace: true }); },
          // Vague 5 : le contrôleur ajoute un point libre à la liste (ex. recouvrement des aciers d'un poteau) ; il entre dans l'avis signé.
          'add-point'() {
            openSheet(`<h2>Ajouter un point de contrôle</h2><p class="muted small" style="margin-bottom:10px">Un point que la liste ne prévoit pas. Il entre dans l'avis signé, avec son état.</p>
              <div class="field"><label for="pt-new">Point à contrôler</label><input id="pt-new" class="input" maxlength="90" autocomplete="off" placeholder="Ex. Recouvrement des aciers en pied de poteau (50 cm)"></div>
              <div class="stack" style="margin-top:14px"><button class="btn saffron block" data-pt-ok>Ajouter à la liste</button><button class="btn ghost block" data-act="sheet-close">Annuler</button></div>`, { label: 'Ajouter un point de contrôle',
              onMount: (sh) => sh.querySelector('[data-pt-ok]').addEventListener('click', () => { const v = (sh.querySelector('#pt-new') || {}).value || ''; if (v.trim().length < 4) return; d.extra = [...(d.extra || []), v.trim()]; actions.setDraft(key, d); closeSheet(); go(`#/c/${pid}/step/${sid}/review`, { replace: true }); }) });
          },
        },
      };
    },
  },
  // ---------- Échanges / contestation ----------
  {
    name: 'thread', pattern: /^\/c\/([^/]+)\/step\/([^/]+)\/thread(?:\?k=(\w+))?$/,
    render(pid, sid, k) {
      if (k === 'undefined') k = undefined;   // le routeur transmet le groupe absent sous forme de texte
      const p = project(pid), s = step(p, sid);
      if (!s) return { redirect: '#/home' };
      const r = get().role;
      const key = `thread:${pid}:${sid}`;
      const d = get().drafts[key] || { kind: k || (s.messages.length ? 'reponse' : 'question'), text: '' };
      if (k && !get().drafts[key]) d.kind = k;
      const canWrite = p.status !== 'clos' && access(p, r) === 'ok' && s.status !== 'verrouillee';
      const L = langOf(r);
      const kinds = [['question', 'Précision', 'message'], ...(r === 'client' ? [['consigne', 'Consigne', 'pen']] : []), ['contestation', 'Contestation', 'flag'], ['reponse', 'Réponse', 'undo'], ...(r !== 'entreprise' ? [['demande_photo', 'Photo précise', 'camera']] : []), ...(r === 'client' && (p.proches || []).length ? [['prive', 'Entre nous (famille)', 'users']] : [])];   // vague 19 (R25) : note visible du client et de ses proches seulement   // vague 10 : demander une photo précise, avec une échéance
      return {
        html: `${appbar({ title: 'Échanges', back: `#/c/${pid}/step/${sid}`, right: `<button class="people-btn" data-act="people" aria-label="Voir qui participe à cet échange">${['client', 'entreprise', 'controleur'].map(k => roleAvatar(k, 26)).join('')}</button>` })}
        <div class="scroll thread-scroll" id="thread-scroll">
          <button class="thread-context" data-go="#/c/${pid}/step/${sid}"><span class="grow"><span class="over">${esc(p.name)} · Étape ${p.steps.indexOf(s) + 1}</span><b>${esc(s.title)}</b></span><span class="tc-link">Voir${icon('chevron', 'xs')}</span></button>
          ${['client', 'entreprise'].includes(r) && access(p, r === 'client' ? 'entreprise' : 'client') === 'ok' ? (() => { const autre = r === 'client' ? 'entreprise' : 'client', tel = (r === 'client' ? (p.invites.entreprise && p.invites.entreprise.phone) : p.clientPhone) || (r === 'client' ? '+212 6 61 48 27 30' : '+33 6 41 27 58 90'), n = tel.replace(/[^\d+]/g, '');
            // Vague 22 (scènes, entreprises) : appeler ou écrire sur WhatsApp à l'autre partie sans quitter le chantier ; ce qui compte reste écrit ici.
            return `<div class="thread-contact" data-testid="thread-contact"><span class="meta">Parler à ${esc(who(autre))} (un appel ne laisse pas de trace : écrivez ici ce qui est décidé)</span><a class="btn sm ghost" href="tel:${n}" data-testid="contact-tel">${icon('phone', 'sm')}Appeler</a><a class="btn sm ghost" href="https://wa.me/${n.replace('+', '')}" target="_blank" rel="noopener" data-testid="contact-wa">${icon('message', 'sm')}WhatsApp</a></div>`; })() : ''}
          <div class="thread" data-stagger="end">
          <div class="sys-msg">Les échanges et les preuves sont conservés. TEEQA signale les contestations mais ne tranche pas.</div>
          ${(rt => rt ? `<div class="notice" data-testid="retard-top">${icon('clock', 'sm')}<span><b>Retard déclaré jusqu’au ${fmtDate(rt.jusqu)}</b> (${({ livraison: 'retard de livraison', reseau: 'sans réseau', absence: 'absence, retour promis', meteo: 'intempéries' })[rt.cause] || 'retard'}). Il ne suspend ni les délais ni les échéances ; il reste écrit au dossier.</span></div>` : '')((s.retards || []).filter(x => new Date(x.jusqu).getTime() >= nowMs()).slice(-1)[0])}
          ${p.status !== 'clos' && canWrite ? `<details class="def" data-testid="retard-form"><summary class="meta">${icon('clock', 'xs')}Déclarer un retard daté (livraison, réseau, absence)</summary><div class="stack" style="gap:8px;margin-top:8px"><select id="rt-cause" class="input" aria-label="Cause du retard"><option value="livraison">Retard de livraison</option><option value="reseau">Sans réseau sur le chantier</option><option value="absence">Absence, retour promis</option><option value="meteo">Intempéries</option></select><label class="meta" for="rt-fin">Jusqu’au</label><input id="rt-fin" class="input" type="date"><button class="btn ghost block" data-act="retard" data-testid="retard-declarer">${icon('clock', 'sm')}Déclarer ce retard</button><p class="meta" style="margin:0">Daté par TEEQA et vu par tous. Il ne suspend ni les délais ni les échéances : seul un retard de l’agence de contrôle les suspend ; la fin prévue ne bouge que par avenant.</p></div></details>` : ''}
          ${(u => u ? `<div class="notice danger" data-testid="urgent-top">${icon('alert', 'sm')}<span><b>C’est urgent · ${esc(u.by || who(u.role))}${u.role === 'client' ? (u.by && u.by !== who('client') ? ' (proche co-décideur)' : ' (client titulaire)') : ''}</b>, ${esc(fmtFull(u.at))} : « ${esc(readMessage(u, L).text)} » <span class="meta" style="display:block">Il attend votre réponse. Ce n’est pas une contestation : rien n’est retenu, TEEQA ne tranche pas.</span></span></div>` : '')(urgentPour(s, r))}
          ${r === 'entreprise' && coDecideurs(p).length ? `<div class="sys-msg" data-testid="dernier-mot"><b>Qui a le dernier mot :</b> ${esc(ROLES.client.name)}, client titulaire. Si un proche co-décideur (${esc(coDecideurs(p).map(x => x.name).join(', '))}) donne une consigne qui contredit la sienne, suivez celle de ${esc(ROLES.client.name)}.</div>` : ''}
          <div class="thread-lang"><button class="chip outline" data-lact="lang-sheet" data-testid="thread-lang">${icon('globe', 'xs')}<span data-notr>${esc(langName(L))}</span></button><span class="meta" data-notr>${esc(L === 'dar' && darAr() ? arabize(AUTO_NOTE.dar) : AUTO_NOTE[L] || AUTO_NOTE.fr)}</span></div>
          ${threadItems(s).map((it, n, all) => {
            const prev = all[n - 1];
            const day = !prev || dayLabel(prev.at) !== dayLabel(it.at) ? `<div class="day-pill">${dayLabel(it.at)}</div>` : '';
            if (it.t === 'sys') return `${day}<div class="sys-line">${it.role ? `<b class="rc-${it.role}">${esc(it.by || who(it.role))}</b> · ` : ''}<span>${esc(it.text)}</span> · <span class="mono">${fmtTime(it.at)}</span>${it.quote ? `<div class="sys-quote" data-testid="sys-quote">« ${esc(it.quote)} »</div>` : ''}</div>`;
            const mine = it.role === r;
            const first = !prev || prev.t === 'sys' || prev.role !== it.role || day;
            const head = !mine && first ? `<span class="msg-av">${roleAvatar(it.role, 30)}</span><div class="who rc-${it.role}">${esc(who(it.role))}</div>` : '';
            if (it.t === 'photo') {
              const ph = it.ph;
              const st = { synchronisee: ticks(true), envoi: 'Envoi…', en_attente: 'En file', hors_ligne: 'Hors ligne', echec: 'Échec' }[ph.sync];
              return `${day}<div class="bubble-row ${mine ? 'mine' : 'theirs'} ${first ? 'first' : ''}">${head}
                <button class="msg photo-msg" data-act="photo" data-id="${ph.id}" aria-label="Photo du ${fmtFull(ph.at)}">${ph.dataUrl ? `<img src="${ph.dataUrl}" alt="">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction })}
                  ${ph.correction ? `<span class="ph-ver">${s.corrections.some(c => c.photoId === ph.id && c.visite) ? 'Pour information' : `Correction v${ph.version}`}</span>` : ''}<span class="photo-meta">${fmtTime(ph.at)} ${mine ? st : ''}</span></button></div>`;
            }
            const m = it.m;
            // M11 : accusés. En attente du réseau (horloge) → parti (deux coches) → lu par quelqu'un (coches safran, et « Vu par … »
            // sous le dernier message lu). Un message plus ancien, sans accusé, reste « lu » si une réponse l'a suivi.
            const readers = Object.keys(m.readBy || {}).filter(x => x !== m.role);
            const seen = mine && (readers.length > 0 || all.slice(n + 1).some(x => x.t === 'msg' && x.role !== r));
            const pending = m.sync === 'hors_ligne';
            const lastMine = mine && !pending && !all.slice(n + 1).some(x => x.t === 'msg' && x.role === r && x.m.sync !== 'hors_ligne');
            return `${day}<div class="bubble-row ${mine ? 'mine' : 'theirs'} ${first ? 'first' : ''}">${head}
              <div class="msg kind-${m.kind}">${m.pic ? `<button class="msg-pic" data-testid="msg-pic" aria-label="Photo jointe">${m.pic.dataUrl ? `<img src="${m.pic.dataUrl}" alt="">` : photoSVG(m.pic.sim.step, m.pic.sim.variant, { stamp: false })}<span class="meta">${icon('camera', 'xs')} Prise dans l’appli le ${fmtFull(m.pic.at)}</span></button>` : ''}${m.kind === 'contestation' ? `<div class="kind-tag">${icon('flag', 'xs')}Contestation</div>` : m.kind === 'question' ? `<div class="kind-tag">Précision demandée</div>` : m.kind === 'consigne' ? `<div class="kind-tag" data-testid="msg-consigne">${icon('pen', 'xs')}Consigne du client : une demande à suivre sur le chantier (pas un désaccord) ; l’entreprise répond dans les échanges</div>` : m.kind === 'prive' ? `<div class="kind-tag" data-testid="msg-prive">${icon('users', 'xs')}Entre nous : vous et vos proches seulement, l’entreprise ne le voit pas</div>` : m.kind === 'demande_photo' && m.req ? `<div class="kind-tag" data-testid="photo-demandee">${icon('camera', 'xs')}Photo demandée par ${esc(m.by || who(m.role))}${m.req.dueAt ? ` · avant le ${fmtFull(m.req.dueAt)}` : ''} · ${m.req.status === 'faite' ? 'envoyée' : m.req.status === 'caduque' ? 'close au changement d’entreprise' : m.req.dueAt && nowMs() > new Date(m.req.dueAt).getTime() ? 'en retard' : 'en attente'}</div>` : ''}
                ${m.by ? `<span class="msg-by meta" data-notr>${esc(m.by)}</span>` : ''}${m.role === 'client' && m.by && (p.proches || []).some(x => m.by.startsWith(x.name)) && ['question', 'reponse', 'contestation'].includes(m.kind) && r !== 'client' ? `<div class="kind-tag" data-testid="consigne-proche">${icon('users', 'xs')}Consigne d’un proche : en cas de désaccord avec le titulaire, c’est lui qui décide</div>` : ''}${m.urgent ? `<div class="kind-tag" data-testid="msg-urgent" style="color:var(--danger-ink)">${icon('alert', 'xs')}C’est urgent</div>` : ''}${msgBody(m, L, canWrite ? r : null)}${m.photo ? `<span class="meta" style="display:block">${icon('camera', 'xs')} Pièce du constat jointe · hors appli, sans les deux heures de TEEQA</span>` : ''}${m.kind === 'demande_photo' && m.req && m.req.status === 'ouverte' && r === 'entreprise' && canWrite ? `<button class="btn sm saffron" style="margin-top:6px" data-act="answer-photo" data-id="${m.id}">${icon('camera', 'xs')}Envoyer cette photo</button>` : ''}<span class="when">${fmtTime(m.at)}${mine ? (pending ? `<span class="ticks wait" aria-label="En attente du réseau">${icon('clock', 'xs')}</span>` : ticks(seen)) : ''}</span></div>
              ${m.attente ? `<div class="meta" data-testid="consigne-attente" style="margin-top:4px">${icon('hourglass', 'xs')} ${!m.attente.reponse ? `En attente de ${esc(m.attente.titulaire)}, titulaire : l’entreprise ne l’exécute pas avant sa réponse et suit sa dernière consigne.` : m.attente.reponse === 'confirmee' ? `Confirmée par ${esc(m.attente.titulaire)} le ${fmtDate(m.attente.repAt)} : l’entreprise peut la suivre.` : `Non retenue par ${esc(m.attente.titulaire)} le ${fmtDate(m.attente.repAt)}.`}</div>${!m.attente.reponse && r === 'client' ? `<div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn sm" style="min-height:44px" data-act="consigne-ok" data-id="${m.id}" data-testid="consigne-ok">Je confirme</button><button class="btn sm ghost" style="min-height:44px" data-act="consigne-non" data-id="${m.id}">Je ne la retiens pas</button></div>` : ''}` : ''}
              ${pending ? `<div class="msg-state wait">En attente du réseau · partira tout seul</div>` : lastMine && readers.length ? `<div class="msg-state" data-testid="seen-by">Vu par ${readers.map(x => esc(who(x))).join(', ')}</div>` : ''}</div>`;
          }).join('')}
          ${!s.messages.some(m => m.kind !== 'system') ? `<div class="sys-msg" data-testid="thread-empty">${canWrite ? 'Aucun message pour l\'instant. Posez une question ou demandez une précision : ' + (recipients(p, s, r).map(x => esc(who(x))).join(' et ') || 'personne d\'autre n\'a accès pour le moment') + (recipients(p, s, r).length > 1 ? ' la recevront.' : recipients(p, s, r).length ? ' la recevra.' : '.') + (r === 'client' && recipients(p, s, r).includes('controleur') ? " L'entreprise lit « Contrôleur TEEQA » : elle ne voit jamais le nom du contrôleur." : '') : 'Aucun message sur cette étape.'}</div>` : ''}
          ${contestBox(p, s, r)}
        </div></div>
        ${canWrite && petitEcran() && !d.compose && !d.text ? `<div class="action-dock" data-testid="repondre-ferme"><button class="btn block" data-act="reply-open" data-testid="reply-open">${icon('message', 'sm')}Répondre</button></div>` : canWrite ? `<div class="thread-tools">
          <details class="thread-opts" data-testid="thread-opts" ${d.opts || ['contestation', 'demande_photo'].includes(d.kind) || d.urgent ? 'open' : ''}><summary data-testid="thread-opts-sum">${icon('chevronDown', 'sm')}<span class="grow"><b>${esc((kinds.find(x => x[0] === d.kind) || kinds[0])[1])}${d.urgent ? ' · urgent' : ''}${d.photo ? ' · photo' : ''}</b><small>Type de message, urgence, réponses rapides</small></span></summary><div class="thread-opts-in">
          <div class="chips" role="radiogroup" aria-label="Type de message">${kinds.map(([kk, l, ic]) => `
          <button class="chip ${d.kind === kk ? (kk === 'contestation' ? 'danger' : 'dark') : ''}" role="radio" aria-checked="${d.kind === kk}" data-act="kind" data-k="${kk}">${icon(ic, 'xs')}${l}</button>`).join('')}</div>
          ${d.kind === 'contestation' ? `<button class="list-item" style="margin-top:6px" role="switch" aria-checked="${!!d.photo}" data-act="ct-photo" data-testid="contest-photo"><span class="ico-tile ${d.photo ? 'success' : 'saffron'}">${icon(d.photo ? 'check' : 'camera')}</span><span class="grow"><span class="t">${d.photo ? 'Pièce du constat jointe' : 'Joindre une photo ou une pièce'}</span><div class="s">Obligatoire, sans être sur place : photo d'un proche, vocal, capture, devis ou témoignage. Pièce venue d’ailleurs : le dossier la marque « hors appli », sans les deux heures d’une photo prise dans TEEQA. <span data-testid="preuve-symetrique">Ce n’est pas la pièce qui retient le coulage, c’est le motif écrit (48 h au plus) ; l’entreprise peut répondre de la même façon, avec une photo prise dans l’appli ou une pièce hors appli, marquée de même.</span></div></span></button>${holdPoint(p, s) && !s.coulage && !['a_venir', 'debutee'].includes(s.status) ? `<p class="meta" style="margin:6px 0 0" data-testid="contest-delai">Avant le coulage : avec un motif écrit, votre désaccord retient le béton 48 h au plus${r === 'client' ? ', et les délais de l’entreprise sont décalés d’autant' : ''} ; ensuite, l’avis du contrôleur suffit et le désaccord reste au dossier.</p>` : ''}
            <p class="meta" style="margin:6px 2px 0" data-testid="contest-hint">${esc(REGLES.desaccord)} ${s.reviews.length || s.decision ? 'Paiement différé pendant le désaccord ; vous décidez.' : `La tranche de cette étape reste due 7 jours après ${dueApres(p, s)} ; les autres tranches ne changent pas.`} ${esc(REGLES.tranche)} Fraude ou comportement grave : <button class="linklike" data-act="report-issue">signalez-le à TEEQA</button>.</p>` : ''}
          ${d.kind === 'demande_photo' && r === 'client' && s.mission && ['proposee', 'acceptee'].includes(s.mission.status) ? `<div class="chips" style="margin-top:6px" role="radiogroup" aria-label="À qui" data-testid="photo-pour">${[['entreprise', 'À l’entreprise'], ['controleur', 'Au contrôleur, pendant sa visite']].map(([k, l]) => `<button class="chip ${(d.pour || 'entreprise') === k ? 'dark' : 'outline'}" role="radio" aria-checked="${(d.pour || 'entreprise') === k}" data-act="pour" data-k="${k}">${l}</button>`).join('')}</div>` : ''}
          ${d.kind === 'demande_photo' ? `<div class="chips" style="margin-top:6px" role="radiogroup" aria-label="À envoyer avant">${[[24, 'Sous 24 h'], [48, 'Sous 48 h'], [72, 'Sous 3 jours']].map(([h, l]) => `<button class="chip ${(d.due || 24) === h ? 'dark' : 'outline'}" role="radio" aria-checked="${(d.due || 24) === h}" data-act="due" data-h="${h}">${l}</button>`).join('')}</div><p class="meta" style="margin:6px 2px 0">Écrivez ce qu'il faut photographier (ex. « l'angle nord, avec le mètre posé sur les aciers »). L'entreprise la reçoit avec l'échéance ; un retard s'affiche à tous.</p>` : ''}
          ${d.kind !== 'contestation' ? `<button class="list-item" style="margin-top:6px" role="switch" aria-checked="${!!d.urgent}" data-act="urgent" data-testid="urgent" ${urgentLibre(s, r) ? '' : 'disabled'}><span class="ico-tile ${d.urgent ? 'saffron' : ''}">${icon('alert')}</span><span class="grow"><span class="t">C'est urgent${d.urgent ? ' · activé pour ce message' : ''}</span><div class="s">${urgentLibre(s, r) ? 'Prévient tout de suite les autres (une fois par jour)' : 'Déjà utilisé sur cette étape aujourd’hui (une fois par jour).'}</div></span></button>` : ''}
          ${get().net.offline ? `<p class="meta" style="margin:6px 2px 0">${icon('clock', 'xs')} Hors ligne : vos messages sont gardés et partiront au retour du réseau.</p>` : ''}
          ${d.kind === 'reponse' && r === 'entreprise' ? `<button class="list-item" style="margin-top:6px" role="switch" aria-checked="${!!d.photo}" data-act="ct-photo" data-testid="reponse-photo"><span class="ico-tile ${d.photo ? 'success' : ''}">${icon(d.photo ? 'check' : 'camera')}</span><span class="grow"><span class="t">${d.photo ? 'Photo jointe à la réponse' : 'Joindre une photo prise maintenant'}</span><div class="s">Prise dans l’appli, avec ses deux heures ; une pièce hors appli (bon, facture, capture) reste possible, marquée comme telle, comme celle du client</div></span></button>` : ''}
          ${d.kind === 'reponse' && s.messages.length && !d.text ? `<div class="chips quick" aria-label="Réponses rapides">${['Bien reçu', 'Merci', 'Je regarde', ...(r === 'entreprise' ? ['Je serai sans réseau jusqu’à demain soir'] : []), ...(s.contest && !s.contest.open && s.contest.by === r && s.contest.issue !== 'retrait' ? ['Je retire ma contestation, merci pour votre réponse'] : [])].map(t => `<button class="chip outline" data-act="quick" data-t="${t}">${t}</button>`).join('')}</div>` : ''}
        </div></details></div>
        <div class="composer" style="border-top:0">
          <button class="icon-btn plus-btn" data-act="plus" aria-label="Ajouter une photo">${icon('plus')}</button>
          <textarea rows="1" data-input="text" aria-label="Message" placeholder="${d.kind === 'contestation' ? 'Expliquez ce que vous contestez…' : 'Message…'}">${esc(d.text)}</textarea>
          ${d.kind !== 'contestation' ? `<button class="icon-btn mic-btn" data-act="voice" aria-label="Enregistrer un vocal" data-testid="mic">${icon('mic')}</button>` : ''}
          <button class="send-btn" data-act="send" aria-label="Envoyer" ${ctOk(d) ? '' : 'disabled'}>${icon('send', 'sm')}</button>
        </div>` : `<div class="action-dock"><div class="notice">${icon('lock', 'sm')}<span>${p.status === 'clos' ? 'Chantier clôturé : échanges en lecture seule.' : 'Écriture indisponible pour ce rôle ou cette étape.'}</span></div></div>`}`,
        on: {
          'consigne-ok'(b) { actions.confirmerConsigne(pid, sid, b.dataset.id, true); toast('Consigne confirmée · l’entreprise est prévenue', 'check'); },
          'consigne-non'(b) { actions.confirmerConsigne(pid, sid, b.dataset.id, false); toast('Consigne non retenue · l’entreprise est prévenue', 'info'); },
          retard(b) { const sc = b.closest('.screen'), c = sc.querySelector('#rt-cause').value, f = sc.querySelector('#rt-fin').value; if (!f) { toast('Choisissez la date de fin', 'info'); return; } if (actions.declarerRetard(pid, sid, { cause: c, jusqu: f })) toast('Retard déclaré · daté, vu par tous', 'check'); },
          'reply-open'() { d.compose = true; actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); requestAnimationFrame(() => { const t = document.querySelector('#app .screen:last-of-type .composer textarea'); if (t) t.focus(); }); },
          // Qui est dans l'échange : les trois rôles du chantier, avec leur photo de profil (le contrôleur reste anonyme pour l'entreprise).
          people() { const inT = (k) => k === r || recipients(p, s, r).includes(k);
            const why = (k) => access(p, k) !== 'ok' ? (k === 'controleur' ? 'Lien non actif : ne reçoit pas les messages' : 'Invitation non acceptée : ne reçoit pas les messages') : 'Étape sans visite de contrôle : ne reçoit pas les messages';
            openSheet(`<h2>Dans cet échange</h2><p class="muted small" style="margin-bottom:12px">Vos messages sont lus par les personnes ci-dessous qui ont accès au chantier.</p>
            <div class="list">${['client', 'entreprise', 'controleur'].map(k => `<div class="list-item" data-in="${inT(k)}" style="${inT(k) ? '' : 'opacity:.6'}">${roleAvatar(k, 44)}<span class="grow"><span class="t">${esc(who(k))}${k === r ? ' (vous)' : ''}</span><div class="s">${inT(k) ? ROLES[k].label + (k === 'controleur' && r === 'entreprise' ? ' · identité non communiquée' : '') : why(k)}</div></span>${inT(k) ? '' : `<span class="chip">Hors échange</span>`}</div>`).join('')}</div>
            <button class="btn ghost block" data-act="sheet-close" style="margin-top:14px">Fermer</button>`, { label: 'Participants' }); },

          kind(b) { d.kind = b.dataset.k; actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); },
          text(t) { d.text = t.value; actions.setDraft(key, d); t.closest('.screen').querySelector('[data-act="send"]').disabled = !ctOk(d); },
          'ct-photo'() { d.photo = !d.photo; actions.setDraft(key, d); sfx('choix'); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); },
          send() {
            const t = document.querySelector('.composer textarea'); d.text = t.value;
            if (!ctOk(d)) { if (d.kind === 'contestation') toast('Un motif (10 caractères) et une photo du constat sont nécessaires', 'info'); return; }
            const kind = d.kind;
            actions.setDraft(key, { kind: 'reponse', text: '' });
            if (kind === 'demande_photo') actions.requestPhoto(pid, sid, { role: r, what: d.text.trim().replace(/^(une )?photo (de |du |des |d')?/i, ''), dueH: d.due || 24, pour: r === 'client' && d.pour === 'controleur' && s.mission && ['proposee', 'acceptee'].includes(s.mission.status) ? 'controleur' : 'entreprise' });
            else actions.sendMessage(pid, sid, { role: r, kind, text: d.text.trim() || (d.photo ? 'Photo du chantier, prise maintenant' : ''), photo: kind === 'contestation' && !!d.photo, pic: kind === 'reponse' && r === 'entreprise' && d.photo ? { sim: { step: Math.min(5, Math.max(0, p.steps.indexOf(s))), variant: 3 }, at: new Date(nowMs()).toISOString() } : null, urgent: kind !== 'contestation' && !!d.urgent });
            sfx(kind === 'contestation' ? 'warn' : 'send');
            toast(get().net.offline ? 'Message gardé · il partira au retour du réseau' : kind === 'contestation' ? 'Contestation signalée aux parties' : d.urgent ? 'Message urgent envoyé · les autres parties sont prévenues' : 'Message envoyé', get().net.offline ? 'clock' : kind === 'contestation' ? 'flag' : 'send');
            go(`#/c/${pid}/step/${sid}/thread`, { replace: true });
          },
          voice() { voiceSheet(pid, sid, r, () => go(`#/c/${pid}/step/${sid}/thread`, { replace: true })); },
          urgent() { if (!urgentLibre(s, r)) return; d.urgent = !d.urgent; actions.setDraft(key, d); sfx('choix'); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); },
          'fix-tr'(b) { const m = s.messages.find(x => x.id === b.dataset.id); if (!m) return; const rm = readMessage(m, L);
            openSheet(`<h2>Corriger la traduction</h2><p class="muted small" style="margin-bottom:10px">${esc(REGLES.traduction)}</p>
              <div class="msg-orig" data-notr style="margin-bottom:10px"><span class="over">Original · ${esc(langName(rm.from))}</span><span>${esc(rm.original || m.text)}</span></div>
              <div class="field"><label for="tr-fix">Votre traduction</label><textarea id="tr-fix" class="textarea" rows="3" maxlength="400">${esc(rm.text)}</textarea><p class="meta">Signée : « corrigée par ${esc(who(r))} », avec la date.</p></div>
              <div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-tr-ok data-testid="fix-tr-ok">Enregistrer la correction</button></div>`, { label: 'Corriger la traduction',
              onMount: (el) => el.querySelector('[data-tr-ok]').addEventListener('click', () => { if (actions.fixTranslation(pid, sid, m.id, { role: r, L, text: el.querySelector('#tr-fix').value })) { closeSheet(); toast('Traduction corrigée · l’original reste visible', 'check'); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); } }) }); },
          due(b) { d.due = +b.dataset.h; actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); },
          pour(b) { d.pour = b.dataset.k; actions.setDraft(key, d); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); },
          'answer-photo'(b) { actions.answerPhotoRequest(pid, sid, b.dataset.id, { role: 'entreprise' }); sfx('send'); toast('Photo envoyée', 'send'); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); },
          // Vague 8 : un retrait se motive aussi (convaincu, accord direct, autre) : la trace dit pourquoi, pas seulement quand.
          withdraw() { openSheet(`<h2>Retirer votre contestation ?</h2><p class="muted small" style="margin-bottom:10px">Dites pourquoi : c'est gardé au dossier. Personne ne peut vous y obliger ; TEEQA ne tranche pas.</p>
              <div class="list" role="radiogroup" aria-label="Motif du retrait">${["La réponse et les photos m'ont convaincu", "Accord trouvé directement avec l'entreprise", 'Je me suis trompé'].map((t, k) => `<button class="list-item" role="radio" aria-checked="false" data-wr="${k}"><span class="grow"><span class="t">${t}</span></span></button>`).join('')}</div>
              <div class="field" style="margin-top:10px"><label for="wr-txt">Ou votre motif</label><input id="wr-txt" class="input" maxlength="160" autocomplete="off"></div>
              <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn saffron" data-wr-ok disabled>Retirer</button></div>`, { label: 'Retirer la contestation',
              onMount: (el) => { let m = ''; const ok = el.querySelector('[data-wr-ok]'), t = el.querySelector('#wr-txt');
                el.querySelectorAll('[data-wr]').forEach(b => b.addEventListener('click', () => { el.querySelectorAll('[data-wr]').forEach(x => x.setAttribute('aria-checked', String(x === b))); m = b.innerText.trim(); t.value = ''; ok.disabled = false; }));
                t.addEventListener('input', () => { m = t.value.trim(); ok.disabled = m.length < 4; });
                ok.addEventListener('click', () => { actions.closeContest(pid, sid, r, 'retrait', m); closeSheet(); toast('Contestation retirée', 'flag'); }); } }); },
          droit() { noteSheet({ title: 'Droit de réponse', intro: "Votre réponse est jointe à votre avis et au dossier, visible du client et de l'entreprise. Votre avis signé reste tel quel.", photo: false, onOk: (t) => { actions.answerContest(pid, sid, t); go(`#/c/${pid}/step/${sid}/thread`, { replace: true }); } }); },
          // Problème 9 : les issues d'une contestation. TEEQA ne tranche pas.
          'contest-end'(b) {
            const issue = b.dataset.issue;
            if (issue === 'accord') { actions.closeContest(pid, sid, r, 'accord'); toast(step(project(pid), sid).contest.open ? "Accord proposé · en attente de confirmation" : 'Accord confirmé · contestation close', 'check'); return; }
            if (issue === 'second_avis') return confirmSheet({ title: 'Demander un second avis ?', body: "La contestation est close et un contrôleur d'une autre agence repasse sur place pour un nouvel avis. Ce second avis est facturé à la partie qui le demande seulement s'il confirme le premier ; s'il l'annule, rien ne lui est facturé (annexe tarifaire). Effet : le second avis remplace le premier pour la suite (paiement recommandé ou différé, correction) ; le premier reste au dossier, avec la réponse de son contrôleur. TEEQA ne tranche pas.", confirm: 'Demander un second avis',
              onConfirm: () => { actions.closeContest(pid, sid, r, 'second_avis'); toast('Second avis demandé', 'send'); } });
            if (issue === 'export') return confirmSheet({ title: 'Exporter le dossier ?', body: "Le dossier complet (photos, avis signés, échanges, historique) est prêt à transmettre à un médiateur ou à un tribunal. La contestation est close dans TEEQA, qui ne tranche pas.", confirm: 'Exporter le dossier',
              onConfirm: () => { actions.closeContest(pid, sid, r, 'export'); toast('Dossier prêt à transmettre', 'file'); go(`#/c/${pid}/report`); } });
          },
          photo(b) { photoSheet(p, s, s.photos.find(x => x.id === b.dataset.id)); },
          quick(b) {
            actions.setDraft(key, { kind: 'reponse', text: '' });
            const q = QUICK.find(x => x[1] === b.dataset.t);
            actions.sendMessage(pid, sid, { role: r, kind: 'reponse', text: b.dataset.t, ...(q ? { quick: q[0] } : { lang: 'fr' }) }); sfx('send');
            go(`#/c/${pid}/step/${sid}/thread`, { replace: true });
          },
          plus() {
            const base = `#/c/${pid}/step/${sid}`;
            if (can(r, p, s, 'correction')) go(`${base}/correction`);
            else if (can(r, p, s, 'photoControl') || can(r, p, s, 'photoDeclare')) go(`${base}/camera`);
            else if (r === 'entreprise' && access(p, r) === 'ok') go(`${base}/client`);   // vague 21 : photo pour le client plutôt qu'un refus
            else if (r === 'client') { d.kind = 'demande_photo'; actions.setDraft(key, d); toast('Demandez une photo à l’entreprise : écrivez ce qu’il faut photographier', 'camera'); go(`${base}/thread`, { replace: true }); }
            else toast('Les photos de cette étape sont prises par l’entreprise et le contrôleur', 'info');
          },
        },
        mount(el) { const sc = el.querySelector('#thread-scroll'); sc.style.scrollBehavior = 'auto'; sc.scrollTop = sc.scrollHeight;
          // Vague 23 (doigt : Zineb) : on arrive sur le début du dernier message (sa traduction), pas sur l'original tout en bas.
          { const msgs = sc.querySelectorAll('.msg'), last = msgs[msgs.length - 1]; if (last) { const dy = last.getBoundingClientRect().top - ((sc.querySelector('.thread-context') || sc).getBoundingClientRect()[sc.querySelector('.thread-context') ? 'bottom' : 'top']) - 10; if (last.offsetHeight > sc.clientHeight * .9) sc.scrollTop = Math.max(0, sc.scrollTop + dy); } }
          { let doigt = false; ['touchstart', 'wheel', 'pointerdown'].forEach((t) => sc.addEventListener(t, () => { doigt = true; }, { passive: true, once: true }));
            const caler = () => { if (doigt || !sc.isConnected) return; const msgs = sc.querySelectorAll('.msg'), last = msgs[msgs.length - 1]; if (!last || last.offsetHeight <= sc.clientHeight * .9) return; const dy = last.getBoundingClientRect().top - ((sc.querySelector('.thread-context') || sc).getBoundingClientRect()[sc.querySelector('.thread-context') ? 'bottom' : 'top']) - 10; if (Math.abs(dy) < 2) return; sc.style.scrollBehavior = 'auto'; sc.scrollTop = Math.max(0, sc.scrollTop + dy); sc.style.scrollBehavior = ''; };
            requestAnimationFrame(caler); setTimeout(caler, 450); setTimeout(caler, 1200); document.fonts && document.fonts.ready.then(caler); }   // vague 23 : recalé après le chargement des polices et la fin du glissement d'écran
          sc.style.scrollBehavior = '';
          const op = el.querySelector('.thread-opts'); if (op) op.addEventListener('toggle', () => { if (!!d.opts === op.open) return;   /* vague 23 : un bloc rendu déjà ouvert ne renvoie plus tout en bas */ d.opts = op.open; actions.setDraft(key, d); requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; }); });   // vague 21 (doigt : Khadija) : les réglages se replient, la place va aux messages
          if (access(p, r) === 'ok') actions.markThreadRead(pid, sid, r); },   // M11 : accusé de lecture
      };
    },
  },
];

// Vague 3 : une contestation part avec un motif (10 caractères) et une photo du constat ; un autre message, dès qu'il a du texte.
// Vague 20 (doigt : Hamid) : une réponse avec photo part sans texte.
const ctOk = (d) => d.kind === 'contestation' ? d.text.trim().length >= 10 && !!d.photo : !!d.text.trim() || (d.kind === 'reponse' && !!d.photo);
// ---------- Pièces jointes : sélecteur façon messagerie (grille, pastille numérotée dans l'ordre du choix) ----------
function piecesSheet(s, d, onDone) {
  let sel = d.pieces.filter(id => s.photos.some(ph => ph.id === id));
  const list = s.photos.filter(ph => ph.by === 'controleur' || ph.by === 'entreprise');
  const tile = (ph) => { const n = sel.indexOf(ph.id);
    return `<button class="photo pk ${n >= 0 ? 'on' : ''}" data-pk="${ph.id}" aria-pressed="${n >= 0}" aria-label="Photo ${ph.by === 'controleur' ? 'prise sur place' : "de l'entreprise"} du ${fmtFull(ph.at)}">
      ${ph.dataUrl ? `<img src="${ph.dataUrl}" alt="">` : photoSVG(ph.sim.step, ph.sim.variant, { correction: ph.correction, stamp: false })}
      <span class="pk-n">${n >= 0 ? n + 1 : ''}</span><span class="ph-badge">${ph.by === 'controleur' ? 'Sur place' : ph.correction ? `Correction v${ph.version}` : 'Entreprise'}</span></button>`; };
  openSheet(`<h2>Pièces jointes</h2>
    <p class="muted small" style="margin-bottom:12px">Touchez les photos à joindre à l'avis. Le numéro indique l'ordre.</p>
    <div class="photo-grid pk-grid"></div>
    <button class="btn saffron block" data-pk-ok style="margin-top:14px"></button>`, {
    label: 'Choisir les pièces jointes',
    onMount(el) {
      const grid = el.querySelector('.pk-grid'), ok = el.querySelector('[data-pk-ok]');
      const paint = () => { grid.innerHTML = list.map(tile).join(''); ok.textContent = sel.length ? `Joindre ${sel.length} photo${sel.length > 1 ? 's' : ''}` : 'Ne rien joindre'; };
      grid.addEventListener('click', (e) => { const b = e.target.closest('[data-pk]'); if (!b) return; const id = b.dataset.pk; sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]; navigator.vibrate && navigator.vibrate(6); paint(); });
      ok.addEventListener('click', () => { closeSheet(); onDone(sel); });
      paint();
    },
  });
}

// Vague 20 : le bouton de signature suit la saisie (motif, mesure) et dit toujours ce qui manque.
function setSign(b, ok, why) { if (!b) return; const p = b.parentElement.querySelector('.sign-why'); b.disabled = false;
  if (ok) { b.removeAttribute('aria-disabled'); delete b.dataset.why; if (p) p.remove(); }
  else { b.setAttribute('aria-disabled', 'true'); b.dataset.why = why; if (p) p.textContent = why; else b.insertAdjacentHTML('afterend', `<p class="meta sign-why" data-testid="sign-why">${esc(why)}</p>`); } }
// ---------- Feuille « Relire et signer » : le récapitulatif, puis la signature en plein écran ----------
function signSheet(p, s, d) {
  let strokes = [];
  // Vague 7 : signataire identifié. Un code à usage unique arrive sur le téléphone enregistré par l'agence (SMS) ; sans réseau,
  // l'appli d'authentification remise par l'agence affiche un code qui change toutes les 30 s. Carte professionnelle délivrée par l'agence.
  const ag = (p.invites && p.invites.controleur) || {}, off = !!get().net.offline, code = String(100000 + Math.floor(Math.random() * 900000));
  openSheet(`<h2>Relire et signer</h2>
    <div class="doc-sheet stack" style="gap:10px;margin:10px 0 14px">
      <h3>Avis sur « ${esc(s.title)} »</h3>
      <dl class="kv" style="margin:0"><dt>Chantier</dt><dd>${esc(p.name)} · ${esc(p.city)}</dd><dt>Avis</dt><dd>${VERDICTS[d.verdict].label}</dd>${d.verdict === 'retardee' ? `<dt>Correction</dt><dd>${d.recheck === 'visite' ? 'Contre-visite sur place' : 'Contrôlée sur photo'}</dd>` : ''}<dt>Pièces</dt><dd>${d.pieces.length} photo${d.pieces.length > 1 ? 's' : ''}</dd><dt>Date</dt><dd class="mono">${fmtFull(new Date())}</dd></dl>
      ${d.motif.trim() ? `<p>«&nbsp;${esc(d.motif)}&nbsp;»</p>` : `<p class="meta">Sans motif écrit (facultatif pour Validé).</p>`}
      ${pointsList({ tous: true, points: draftPoints(s, d).map((label, i) => ({ label, state: (d.points || {})[i] || 'nv' })) })}
    </div>
    <div class="notice" style="margin-bottom:14px">${icon('pen', 'sm')}<span><b>Ce que vous signez.</b> Vous attestez ce que vous avez vu le jour de la visite, sur les points listés. Vous ne garantissez pas l'ouvrage. L'avis est horodaté et transmis par TEEQA ; votre agence le cosigne.</span></div>
    <div class="field" data-testid="signataire"><label for="otp">Identifiez-vous</label>
      <dl class="kv" style="margin:0 0 6px"><dt>Carte professionnelle</dt><dd class="mono">${esc(ag.carte || 'délivrée par votre agence')}</dd><dt>Délivrée par</dt><dd>${esc((ag.agence || 'votre agence').split(' · ')[0])}</dd></dl>
      <div class="row" style="gap:8px;align-items:center"><input id="otp" class="input mono" type="tel" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" maxlength="6" placeholder="Code à 6 chiffres" style="flex:1"><button class="btn ghost sm" type="button" data-otp-clear data-testid="otp-effacer" style="min-height:44px;min-width:44px" aria-label="Effacer le code">${icon('close', 'sm')}Effacer</button></div>
      <button class="chip" type="button" data-otp data-testid="otp-messages" style="margin-top:6px;justify-self:start;min-height:44px">${icon(off ? 'shield' : 'message', 'xs')}${off ? 'Code de l’appli d’authentification' : 'Depuis Messages'} : ${code.slice(0, 3)} ${code.slice(3)}</button>
      <p class="meta" style="margin:4px 0 0">${off ? "Sans réseau : ouvrez l'appli d'authentification remise par votre agence ; son code change toutes les 30 s et sera vérifié à l'envoi." : `Code à usage unique envoyé par SMS au ${esc(ag.otpTel || '06 •• •• •• 31')}, le numéro que votre agence a enregistré. Il ne sert qu'une fois.`}</p>
</div>
    <div class="field"><label id="lbl-sig">Signature</label>
      <button class="sig-zone" data-sig="open" aria-labelledby="lbl-sig"><span class="sig-prev" aria-hidden="true"></span><span class="sig-cta">${icon('pen', 'sm')}<span>Toucher pour signer</span></span></button>
      ${/* Vague 23 (doigt : Nadia) : « Signer l'avis » juste sous la signature, plus en bas de la feuille. */''}<button class="btn saffron block" style="margin-top:10px" data-sig="sign" data-testid="sign-final" disabled>Signer l'avis</button><p class="meta" data-testid="sign-manque" style="margin:4px 0 0;text-align:center">Il manque : le code et la signature.</p></div>
    <p class="meta" style="margin:8px 0 14px;color:var(--saffron-ink)">Signature identifiée (code à usage unique, carte professionnelle, cosignature de l'agence) : elle n'a pas la valeur d'une signature électronique qualifiée.</p>
    <button class="btn ghost block" data-act="sheet-close">Annuler</button>`, {
    label: 'Relire et signer',
    onMount(el) {
      const zone = el.querySelector('.sig-zone'), prev = el.querySelector('.sig-prev'), cta = el.querySelector('.sig-cta span'), signBtn = el.querySelector('[data-sig="sign"]'), otp = el.querySelector('#otp');
      const manque = el.querySelector('[data-testid="sign-manque"]');
      const ready = () => { const okC = otp.value.replace(/\D/g, '') === code, okS = strokes.length > 0; signBtn.disabled = !(okS && okC);
        manque.textContent = okS && okC ? 'Prêt : touchez « Signer l’avis ».' : `Il manque : ${[!okC && 'le code', !okS && 'la signature'].filter(Boolean).join(' et ')}.`;
        if (okS && okC) signBtn.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
      otp.addEventListener('input', () => { const v = otp.value.replace(/\D/g, '').slice(0, 6); if (v !== otp.value) otp.value = v; ready(); });   // vague 26 (doigt : Samira) : chiffres seulement, et une croix pour effacer
      el.querySelector('[data-otp-clear]').addEventListener('click', () => { otp.value = ''; ready(); otp.focus(); });
      el.querySelector('[data-otp]').addEventListener('click', () => { otp.value = code; ready(); });
      zone.addEventListener('click', () => signaturePad(strokes, (st) => {
        strokes = st; const ok = strokes.length > 0;
        prev.innerHTML = ok ? signatureSVG(strokes, { color: '#08261F' }) : '';
        zone.classList.toggle('signed', ok); cta.textContent = ok ? 'Refaire' : 'Toucher pour signer'; ready();
      }));
      signBtn.addEventListener('click', () => {
        actions.signReview(p.id, s.id, { verdict: d.verdict, motif: d.motif.trim(), pieces: d.pieces, signature: strokes, points: draftPoints(s, d).map((label, i) => ({ label, state: (d.points || {})[i] || 'nv' })), ...(d.verdict === 'retardee' ? { recheck: d.recheck === 'visite' ? 'visite' : 'photo' } : {}), mesures: mesuresTxt(s, d), otp: true, ...(s === p.steps[p.steps.length - 1] && !enContreVisite(s) ? { pv: { reserves: String(d.pvRes || '').trim() } } : {}) });
        closeSheet(true); sfx('tampon'); sfx(d.verdict === 'validee' ? 'valide' : d.verdict === 'refusee' ? 'refus' : 'reserve', { delay: .32 }); navigator.vibrate && navigator.vibrate([10, 50, 14]);
        go(`#/c/${p.id}/step/${s.id}`, { replace: true });
        openSheet(`<div style="display:grid;justify-items:center;text-align:center;gap:10px;padding:6px 0 4px">
          ${bellarej(d.verdict === 'validee' ? 'felicite' : 'posee', 104, { cls: 'pop-in' })}${/* vague 23 (doigt : Nadia) : plus de mine triste sur un avis bien signé */''}
          <h2>Avis signé</h2><p class="muted">${off ? `Signé à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}, sans réseau. Il attend sur ce téléphone et part avec vos photos dès le retour du réseau ; l'heure de signature reste celle-ci.` : "Le client et l'entreprise sont notifiés. L'avis et sa signature sont conservés dans l'historique."}</p>
          <button class="btn block" data-act="sheet-close" style="margin-top:8px">Fermer</button></div>`, { label: 'Avis signé' });
      });
    },
  });
}

// Pavé de signature en plein écran. Sur un téléphone tenu debout, il est tourné d'un quart de tour :
// on signe dans la longueur de l'écran, comme sur un terminal de livraison. Les points restent dans le repère 300 × 120.
function signaturePad(initial, done) {
  const app = document.getElementById('app'), AW = app.offsetWidth, AH = app.offsetHeight, rot = false;   // 12 nov. : on signe téléphone tenu droit, le pavé n'est plus tourné d'un quart de tour (retour de l'utilisateur)
  const strokes = initial.map(st => st.map(pt => [...pt]));
  const o = document.createElement('div'); o.className = `sig-full ${rot ? 'rot' : ''}`;
  o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Signature');
  o.innerHTML = `<div class="sig-rot" ${rot ? `style="width:${AH}px;height:${AW}px"` : ''}>
    <div class="sig-bar"><button class="btn text" data-s="cancel">Annuler</button><b>Votre signature</b><button class="btn text" data-s="clear">Effacer</button></div>
    <div class="sig-area"><div class="sig-box"><span class="sig-line"></span><span class="sig-x" aria-hidden="true">×</span><span class="sig-hint">Signez ici, au doigt</span><canvas aria-label="Zone de signature"></canvas></div></div>
    <div class="sig-foot"><span class="meta">Signature identifiée, non qualifiée.</span><button class="btn saffron" data-s="ok" disabled>Valider</button></div></div>`;
  app.appendChild(o);
  const box = o.querySelector('.sig-box'), cv = box.querySelector('canvas'), ok = o.querySelector('[data-s="ok"]'), ctx = cv.getContext('2d');
  const W = 300, H = 120;
  const draw = () => {
    ctx.clearRect(0, 0, cv.width, cv.height); ctx.lineWidth = Math.max(4, cv.width / 150); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#08261F';
    const sx = cv.width / W, sy = cv.height / H;
    strokes.forEach(st => { ctx.beginPath(); st.forEach(([x, y], i) => i ? ctx.lineTo(x * sx, y * sy) : ctx.moveTo(x * sx, y * sy)); if (st.length === 1) ctx.lineTo(st[0][0] * sx + .1, st[0][1] * sy); ctx.stroke(); });
    const n = strokes.reduce((a, st) => a + st.length, 0);
    ok.disabled = n < 6; box.classList.toggle('has', n > 0);
  };
  const fit = () => { cv.width = box.clientWidth * 2; cv.height = box.clientHeight * 2; draw(); };
  // Repère du pavé : s'il est tourné, l'axe de la signature descend le long de l'écran.
  const pt = (e) => { const r = box.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
    const c = (z) => Math.max(0, Math.min(1, z)); return rot ? [c(v) * W, (1 - c(u)) * H] : [c(u) * W, c(v) * H]; };
  let on = false;
  box.addEventListener('pointerdown', (e) => { on = true; try { box.setPointerCapture(e.pointerId); } catch {} strokes.push([pt(e)]); draw(); e.preventDefault(); });
  box.addEventListener('pointermove', (e) => { if (!on) return; strokes[strokes.length - 1].push(pt(e)); draw(); });
  const up = () => { on = false; };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  const close = () => { removeEventListener('resize', close); o.remove(); };
  addEventListener('resize', close);
  o.querySelector('[data-s="cancel"]').addEventListener('click', close);
  o.querySelector('[data-s="clear"]').addEventListener('click', () => { strokes.length = 0; draw(); });
  ok.addEventListener('click', () => { close(); done(strokes.map(st => st.filter((_, i) => i % 2 === 0 || i === st.length - 1).map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)]))); });
  requestAnimationFrame(fit); setTimeout(fit, 60);
}

// ---------- Célébration d'une étape validée (cahier 5.10) ----------
// Mise en scène reprise de l'enregistrement de l'utilisateur (série de jours de Duolingo), dans la DA de TEEQA :
// 1) une petite flamme safran avec Bellarej sur fond clair ; 2) le vert de Fès envahit l'écran depuis la flamme ;
// 3) éclat : la flamme grandit, un anneau part, des carreaux de zellige jaillissent, Bellarej ouvre les ailes ;
// 4) le nombre d'étapes validées passe de n-1 à n ; 5) le libellé monte ; 6) la rangée des étapes arrive et la
// nouvelle coche tombe à sa place ; 7) les boutons. Tout est en minuteries et transitions CSS.
const FLAME = 'M100 4C116 40 150 42 151 72C168 60 178 86 172 102C192 114 190 164 160 188C138 210 62 210 40 188C10 162 8 114 28 98C26 76 44 62 57 74C52 44 86 38 100 4Z';
export function fete(p, s, rv) {
  import('../sons.js').then((m) => { m.unlock && m.unlock(); m.wake && m.wake(); }).catch(() => {});   // le son doit partir avec l'image (sur iPhone, il faut un toucher avant dans la même page)
  const app = document.getElementById('app');
  if (app.querySelector('.fete')) return;
  const idx = p.steps.indexOf(s), n = p.steps.filter(doneLike).length, total = p.steps.length;
  const calm = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const o = document.createElement('div');
  o.className = 'fete' + (calm ? ' calm flood burst n2 lab up row drop lock cta' : '');
  o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', `Étape validée : ${s.title}`);
  o.innerHTML = `<span class="fete-flood" aria-hidden="true"></span>
    <div class="fete-stage">
      ${feteHero(calm)}
      <div class="fete-num" aria-hidden="true"><b class="old">${Math.max(0, n - 1)}</b><b class="new">${n}</b></div>
      <p class="fete-label"><span class="sr-only">${n} </span>étape${n > 1 ? 's' : ''} ${p.steps.some(x => doneLike(x) && !isControlled(x)) ? 'close' : 'validée'}${n > 1 ? 's' : ''} sur ${total}</p>
      <p class="fete-title">${esc(s.title)}</p>
      <ol class="fete-row" aria-label="Étapes du chantier">${p.steps.map((x, k) => `<li class="${doneLike(x) ? 'ok' : ''} ${k === idx ? 'me' : ''}" style="--k:${k}"><span>${k + 1}</span><i>${doneLike(x) ? icon('check', 'xs') : ''}</i></li>`).join('')}</ol>
    </div>
    <div class="fete-cta">
      <button class="btn block fete-main" data-fete="close">Continuer</button>
      ${location.hash === `#/c/${p.id}` ? '' : '<button class="btn text" data-fete="path">Voir le chemin</button>'}
    </div>`;
  app.appendChild(o);
  const timers = [], at = (ms, f) => timers.push(setTimeout(f, ms)), add = (c) => () => o.classList.add(c);
  const close = (then) => { timers.forEach(clearTimeout); o.classList.add('bye'); setTimeout(() => { o.remove(); then && then(); }, calm ? 0 : 240); };
  o.addEventListener('click', (e) => { const b = e.target.closest('[data-fete]'); if (!b) return; e.stopPropagation(); close(b.dataset.fete === 'path' ? () => go(`#/c/${p.id}`) : null); });
  o.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  if (calm) { sfx('fete'); o.querySelector('.fete-main').focus({ preventScroll: true }); return; }
  navigator.vibrate && navigator.vibrate(10);
  // Temps de la référence (enregistrement du 10 nov., 15 h 23) : voir js/fete-hero.js pour le détail du héros.
  sfx('fete');   // 12 nov. : la musique part avec la toute première image, à l'arrivée de l'oiseau (elle partait à 2,56 s, au changement du chiffre)
  playFeteHero(o, at);
  at(1020, add('flood'));
  at(1155, () => { o.classList.add('burst'); sfx('pose'); navigator.vibrate && navigator.vibrate([14, 50, 22]); });
  at(1900, add('n1'));
  at(2560, add('n2'));
  at(2760, () => sfx('pop'));
  // Fin de la séquence, remesurée image par image sur la référence le 10 nov. au soir (refs/ANIMATIONS-REFERENCE.md, section 1) :
  at(3170, add('lab'));    // le libellé apparaît en fondu, avant que le bloc ne remonte
  at(3200, add('up'));     // le héros et le chiffre remontent : départ lent, milieu vif, longue fin amortie (jusqu'à 4,05 s)
  at(4100, add('row'));    // la rangée apparaît d'un bloc
  at(4470, add('drop'));   // le jeton sort du rond, se retourne en l'air (4,67 s), retombe (4,90 - 5,10 s)
  at(5130, () => { o.classList.add('lock'); sfx('pop'); });   // il se cale, couronne d'éclats jusqu'à 5,55 s
  at(5250, () => { o.classList.add('cta'); o.querySelector('.fete-main').focus({ preventScroll: true }); });
}

// ---------- Caméra ----------
let cam = { key: null, phase: 'viewfinder', variant: 0, shot: null, stream: null, note: '' };
function stopStream() { if (cam.stream) { cam.stream.getTracks().forEach(t => t.stop()); cam.stream = null; } }
window.addEventListener('hashchange', () => { if (!/\/(camera|correction)$/.test(location.hash)) stopStream(); });

function cameraView(pid, sid, mode) {
  const p = project(pid), s = step(p, sid);
  if (!s) return { redirect: '#/home' };
  const r = get().role;
  const back = `#/c/${pid}/step/${sid}`;
  const isCorr = mode === 'correction';
  // Vague 21 (doigt : Abdelali) : « Envoyer une photo au client » ouvre la caméra ; la photo part au client dans les échanges.
  const pourClient = mode === 'client';
  const allowed = pourClient ? r === 'entreprise' && access(p, r) === 'ok' && p.status !== 'clos' : isCorr ? can(r, p, s, 'correction') : (can(r, p, s, 'photoControl') || can(r, p, s, 'photoDeclare'));
  if (!allowed) return { html: `${appbar({ title: 'Caméra', back })}<div class="content"><div class="notice saffron">${icon('lock', 'sm')}<span>${isCorr ? "La photo de correction est apportée par l'entreprise après un avis avec réserves." : r === 'controleur' && missionPending(s) ? 'Acceptez d’abord la visite : l’appareil photo s’ouvre une fois la mission acceptée.' : 'Photographier est réservé au contrôleur (sur place, visite acceptée) et à l’entreprise (déclaration), selon l’état de l’étape.'}</span></div></div>` };
  const key = `${pid}/${sid}/${mode}`;
  if (cam.key !== key) { stopStream(); cam = { key, phase: 'viewfinder', variant: Math.floor(Math.random() * 3), shot: null, stream: null, note: '' }; }
  const perm = get().drafts.camPerm; // undefined | 'simulee' | 'navigateur' | 'refusee'
  const i = p.steps.indexOf(s);
  const net = get().net;

  // 1) Consentement
  if (!perm || perm === 'refusee') {
    return {
      cls: 'dark',
      html: `${appbar({ title: '', back, dark: true, close: true })}
      <div class="scroll"><div class="content stack" style="gap:18px;padding-top:10px">
        <div class="row" style="gap:10px"><span class="ico-tile dark" style="width:56px;height:56px;border-radius:18px;background:var(--surface)">${icon('camera', 'lg')}</span><span class="ico-tile dark" style="width:56px;height:56px;border-radius:18px;background:var(--surface)">${icon('pin', 'lg')}</span></div>
        <h2 class="display" style="font-size:26px">${perm === 'refusee' ? 'Caméra refusée' : 'Autoriser la caméra et la position'}</h2>
        <p style="color:var(--sage-ink)">${perm === 'refusee' ? "Sans caméra, aucune photo ne peut être prise dans l'app. Vous pouvez changer d'avis à tout moment." : "Pour dater et situer chaque photo prise sur le chantier. Demandé uniquement au moment de photographier."}</p>
        <div class="card dark stack" style="gap:10px">
          <div class="row small">${icon('clock', 'sm')}Date, heure et lieu inscrits sur chaque photo</div>
        </div>
      </div></div>
      <div class="footer-cta">
        ${/* Vague 23 (doigt : Mustapha) : un seul gros bouton ; il ouvre l'appareil photo du téléphone s'il répond, sinon la caméra de l'appli. */''}<button class="btn saffron block" data-act="perm-real" data-testid="perm-ok">Autoriser</button>
        ${perm !== 'refusee' ? `<button class="btn text" style="color:var(--sage-ink)" data-act="perm-deny">Ne pas autoriser</button>` : ''}
      </div>`,
      on: {
        'perm-sim'() { actions.setDraft('camPerm', 'simulee'); go(location.hash, { replace: true }); },
        async 'perm-real'(b) {
          try {
            if (!navigator.mediaDevices?.getUserMedia) throw new Error('indisponible');
            b.disabled = true;
            cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            actions.setDraft('camPerm', 'navigateur'); go(location.hash, { replace: true });
          } catch { actions.setDraft('camPerm', 'simulee'); go(location.hash, { replace: true }); }
        },
        'perm-deny'() { actions.setDraft('camPerm', 'refusee'); go(location.hash, { replace: true }); },
      },
    };
  }

  const nowD = new Date();
  const lastPh = s.photos[s.photos.length - 1];
  const mine = s.photos.filter(ph => ph.by === r).length;
  // Vague 21 (doigt : Imane) : le contrôleur voit combien de photos son avis demandera (une par point clé), et enchaîne les prises.
  const camCtl = r === 'controleur' && !isCorr && !pourClient;
  const nCle = camCtl ? (enContreVisite(s) ? Math.max(1, pointsRevus(s).length) : pointsCles(checkPoints(s))) : 0,   // vague 22 (contrôleurs) : en contre-visite, une photo par point revu
    faites = camCtl ? s.photos.filter(ph => ph.by === 'controleur' && ph.at >= (s.endDeclaredAt || '')).length : 0;
  // Vague 23 (doigt : Nadia, 47 gestes) : en rafale, une photo par point, dans l'ordre de la liste, sans écran d'aperçu ;
  // chaque photo porte le nom de son point ; à la dernière, retour à l'avis.
  const ptsCam = camCtl ? (enContreVisite(s) ? pointsRevus(s) : checkPoints(s).filter(estCle)) : [], cible = camCtl && faites < ptsCam.length ? ptsCam[faites] : null;
  const metaBadges = (when) => `
    <span class="mbadge">${icon('clock', 'xs')}${fmtFull(when)}</span>
    <span class="mbadge warn">${icon('pin', 'xs')}${esc(PLACE(p))}</span>
    ${net.offline ? `<span class="mbadge warn">${icon('wifiOff', 'xs')}Hors ligne · envoi différé</span>` : ''}`;
  const kindLabel = pourClient ? `Pour ${who('client')}` : isCorr ? 'Correction' : r === 'controleur' ? 'Sur place' : s.status === 'a_venir' ? 'Départ' : 'Déclaration';

  // 3) Aperçu : la photo dans un cadre, une légende, deux actions (reprendre / utiliser)
  if (cam.phase === 'preview') {
    return {
      cls: 'dark camera',
      html: `
      <div class="pv-top"><button class="icon-btn" data-act="back" data-fallback="${back}" aria-label="Fermer sans garder la photo">${icon('close')}</button>
        <span class="pv-title">${kindLabel} · Étape ${i + 1}</span><span class="spacer"></span></div>
      <div class="pv-frame">${cam.shot.dataUrl ? `<img src="${cam.shot.dataUrl}" alt="Aperçu de la photo">` : photoSVG(i, cam.variant, { correction: isCorr })}
        <div class="vf-meta">${metaBadges(cam.shot.at)}</div></div>
      <div class="pv-caption">
        <input type="text" data-input="note" maxlength="140" value="${esc(cam.note)}" aria-label="${isCorr ? 'Ce qui a été corrigé' : 'Légende'}" placeholder="${isCorr ? 'Ce qui a été corrigé…' : 'Ajouter une légende…'}" autocomplete="off">
        <p class="meta">${isCorr ? `Version v${s.corrections.length + 2} · la version avec réserves reste conservée. ` : ''}${pourClient ? `Elle part à ${esc(who('client'))} dans les échanges de l’étape, avec son heure. ` : ''}Photo prise dans l'appli.</p>
      </div>
      <div class="pv-actions">
        <button class="btn ghost-dark" data-act="retake" aria-label="Reprendre la photo">${icon('refresh', 'sm')}Reprendre</button>
        <button class="btn saffron" data-act="send" data-testid="cam-send">${icon(net.offline ? 'clock' : pourClient ? 'send' : 'check', 'sm')}${net.offline ? 'Garder en file' : pourClient ? `Envoyer à ${esc(who('client'))}` : 'Utiliser la photo'}</button>
      </div>${camCtl ? `<button class="btn ghost-dark block" style="margin:8px 16px 0;width:auto" data-act="send-more" data-testid="cam-encore">${icon('camera', 'sm')}Garder et prendre la suivante${nCle ? ` (${Math.min(faites + 1, nCle)} sur ${nCle})` : ''}</button>` : ''}`,
      on: {
        retake() { cam.phase = 'viewfinder'; cam.variant = (cam.variant + 1) % 4; cam.shot = null; go(location.hash, { replace: true }); },
        note(t) { cam.note = t.value; },
        'send-more'() { actions.addPhoto(pid, sid, { role: r, sim: { step: i, variant: cam.variant }, dataUrl: cam.shot.dataUrl, correction: false, note: cam.note.trim() }); sfx('send'); cam.phase = 'viewfinder'; cam.variant = (cam.variant + 1) % 4; cam.shot = null; cam.note = ''; toast(`Photo gardée · ${faites + 1}${nCle ? ` sur ${nCle} demandées` : ''}`, 'check'); go(location.hash, { replace: true }); },
        send() {
          if (pourClient) {
            actions.sendMessage(pid, sid, { role: r, kind: 'reponse', text: cam.note.trim() || 'Photo du chantier, prise maintenant', pic: { sim: { step: Math.min(5, Math.max(0, i)), variant: cam.variant }, at: cam.shot.at, dataUrl: cam.shot.dataUrl } });
            stopStream(); cam.key = null; sfx('send'); (net.offline ? (t, i) => toast(t, i) : (t) => recompense(t))(net.offline ? 'Photo gardée : elle partira au retour du réseau' : `Photo envoyée à ${who('client')}`, net.offline ? 'wifiOff' : 'send');
            go(`${back}/thread`, { replace: true }); return;
          }
          actions.addPhoto(pid, sid, { role: r, sim: { step: i, variant: cam.variant }, dataUrl: cam.shot.dataUrl, correction: isCorr, note: cam.note.trim() });
          stopStream(); cam.key = null; sfx('send');
          if (net.offline) toast('Photo gardée : envoi au retour du réseau', 'wifiOff');   // en ligne, la pastille « Envoi en cours » prend le relais
          go(back, { replace: true });
        },
      },
    };
  }

  // 2) Viseur
  return {
    cls: 'dark camera',
    html: `
    <div class="viewfinder" id="vf">
      ${perm === 'navigateur' && cam.stream ? `<video autoplay playsinline muted></video>` : photoSVG(i, cam.variant, { correction: isCorr, stamp: false })}
      <div class="vf-grid"></div>
      <div class="vf-focus"><i></i><i></i><i></i><i></i></div>
      <div class="vf-top">
        <button class="icon-btn vf-btn" data-act="back" data-fallback="${back}" aria-label="Fermer la caméra">${icon('close')}</button>
        <span class="mbadge vf-kind">${kindLabel} · Étape ${i + 1}</span>
        <button class="icon-btn vf-btn" data-act="unavailable" data-why="Flash non disponible ici" aria-label="Flash (non disponible)">${icon('bolt')}</button>
      </div>
      
      <div class="vf-meta" id="vf-meta">${metaBadges(nowD)}${nCle ? `<span class="mbadge" data-testid="cam-compte">${icon('camera', 'xs')}${faites} sur ${nCle} photos pour l’avis</span>` : ''}</div>
      ${cible ? `<div class="vf-point" data-testid="cam-point"><span class="over">Point ${faites + 1} sur ${ptsCam.length}</span><b>${esc(cible.split(/[,(:]/)[0].trim())}</b></div>` : ''}
    </div>
    <p class="cam-hint">${cible ? 'Un toucher par point : la photo est gardée et le point suivant s’affiche.' : isCorr ? 'Cadrez la zone corrigée, de près.' : r === 'controleur' ? "Cadrez l'ouvrage : une vue d'ensemble, puis les détails." : s.status === 'a_venir' ? "Cadrez l'état de départ, en vue d'ensemble, avant les travaux." : "Cadrez l'ouvrage terminé, en vue d'ensemble."}</p>
    <div class="zoom" role="group" aria-label="Zoom">
      <button data-act="unavailable" data-why="Zoom non disponible ici">.5</button><button aria-pressed="true" data-act="noop">1×</button><button data-act="unavailable" data-why="Zoom non disponible ici">2</button>
    </div>
    <div class="cam-controls">
      <button class="thumb" ${lastPh ? `data-act="last"` : 'disabled'} aria-label="Dernière photo${mine ? `, ${mine} déjà prise${mine > 1 ? 's' : ''}` : ''}">${lastPh ? (lastPh.dataUrl ? `<img src="${lastPh.dataUrl}" alt="">` : photoSVG(lastPh.sim.step, lastPh.sim.variant, { correction: lastPh.correction })) : ''}${mine ? `<span class="thumb-n">${mine}</span>` : ''}</button>
      <button class="shutter" data-act="shoot" aria-label="Prendre la photo"><span></span></button>
      <button class="icon-btn" style="justify-self:end;color:#fff" data-act="unavailable" data-why="Une seule caméra ici" aria-label="Retourner la caméra (non disponible)">${icon('refresh')}</button>
    </div>`,
    on: {
      noop() {},
      last() { photoSheet(p, s, lastPh); },
      shoot() {
        const vf = document.getElementById('vf');
        const f = document.createElement('div'); f.className = 'flash'; vf.appendChild(f);
        navigator.vibrate && navigator.vibrate(10); sfx('photo');
        let dataUrl = null;
        const v = vf.querySelector('video');
        if (v && v.videoWidth) {
          const c = document.createElement('canvas'); const w = 480; c.width = w; c.height = Math.round(w * v.videoHeight / v.videoWidth);
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); dataUrl = c.toDataURL('image/jpeg', .6);
        }
        cam.shot = { at: new Date().toISOString(), dataUrl };
        if (cible) {   // vague 23 : rafale, la photo est gardée tout de suite avec le nom de son point
          actions.addPhoto(pid, sid, { role: r, sim: { step: i, variant: cam.variant }, dataUrl, correction: false, note: 'Point clé : ' + cible });
          cam.variant = (cam.variant + 1) % 4; cam.shot = null;
          const fini = faites + 1 >= ptsCam.length;
          // vague 26 (doigt : Samira) : entre deux photos, plus de bandeau sur le libellé du point suivant ; le compteur de la caméra suffit.
          if (fini) toast(`${ptsCam.length} photo${ptsCam.length > 1 ? 's' : ''} prise${ptsCam.length > 1 ? 's' : ''} : notez les points`, 'check');
          setTimeout(() => { if (fini) { stopStream(); cam.key = null; go(`${back}/review`, { replace: true }); } else go(location.hash, { replace: true }); }, 260);
          return;
        }
        setTimeout(() => { cam.phase = 'preview'; go(location.hash, { replace: true }); }, 260);
      },
    },
    mount(el) {
      const v = el.querySelector('video'); if (v && cam.stream) v.srcObject = cam.stream;
      const meta = el.querySelector('#vf-meta');
      const t = setInterval(() => { if (!document.body.contains(meta)) return clearInterval(t); meta.innerHTML = metaBadges(new Date()); }, 1000);
    },
  };
}
