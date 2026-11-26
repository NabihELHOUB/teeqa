// Langues de TEEQA (19 nov.) : français par défaut, arabe (de droite à gauche), darija en lettres latines (comme sur
// WhatsApp) et tamazight (tachelhit, tarifit, tamazight de l'Atlas : en lettres latines, le tifinagh en titre).
// Deux usages :
//   1. l'interface : les textes les plus vus (onglets, Mes chantiers, chemin, carte de paiement, boutons de l'étape,
//      échanges) sont traduits à l'affichage, sans toucher aux écrans : le français reste la source, inchangée ;
//   2. les échanges : chaque message garde sa langue d'origine ; chacun le lit traduit dans la sienne (« Traduit du … »).
// Traductions automatiques, à vérifier en cas de doute : c'est dit une seule fois, dans le choix de la langue et en tête du fil.
// Sans ressource externe : tout est ici, même hors réseau. Un texte libre absent du dictionnaire reste dans sa langue d'origine.
import { get, langOf, actions } from './store.js';

export const LANGS = {
  fr: { label: 'Français', native: 'Français', sub: 'Langue par défaut', tts: 'fr-FR', html: 'fr', dir: 'ltr' },
  ar: { label: 'Arabe', native: 'العربية', sub: 'Arabe standard, écrit de droite à gauche', tts: 'ar', html: 'ar', dir: 'rtl' },
  dar: { label: 'Darija (Maroc)', native: 'Darija', sub: 'Darija marocaine, en lettres latines comme sur WhatsApp ; traduction automatique, parfois fausse pour une autre darija', tts: 'ar-MA', html: 'ary-Latn', dir: 'ltr' },
  shi: { label: 'Tachelhit', native: 'ⵜⴰⵛⵍⵃⵉⵜ', sub: 'Tachelhit · Souss, Agadir · lettres latines (tifinagh pas encore proposé)', tts: null, html: 'shi-Latn', dir: 'ltr', amazigh: true },
  rif: { label: 'Tarifit', native: 'ⵜⴰⵔⵉⴼⵉⵜ', sub: 'Tarifit · Rif, Nador, Al Hoceïma · lettres latines (tifinagh pas encore proposé)', tts: null, html: 'rif-Latn', dir: 'ltr', amazigh: true },
  tzm: { label: "Tamazight de l'Atlas", native: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', sub: "Tamazight du Moyen-Atlas · lettres latines (tifinagh pas encore proposé)", tts: null, html: 'tzm-Latn', dir: 'ltr', amazigh: true },
};
export const LANG_CODES = Object.keys(LANGS);
const ORDER = ['fr', 'ar', 'dar', 'shi', 'rif', 'tzm'];

// « Traduit du … » dans la langue de celui qui lit.
const OF = {
  fr: { fr: 'du français', ar: "de l'arabe", dar: 'de la darija', shi: 'du tachelhit', rif: 'du tarifit', tzm: 'du tamazight' },
  ar: { fr: 'الفرنسية', ar: 'العربية', dar: 'الدارجة', shi: 'تشلحيت', rif: 'تاريفيت', tzm: 'تامازيغت' },
  dar: { fr: 'lfransawiya', ar: 'laarbiya', dar: 'darija', shi: 'tachelhit', rif: 'tarifit', tzm: 'tamazight' },
  shi: { fr: 'tfransist', ar: 'taarabt', dar: 'tdarijt', shi: 'tchelhit', rif: 'tarifit', tzm: 'tmazight' },
  rif: { fr: 'tfransist', ar: 'taarabt', dar: 'tdarijt', shi: 'tchelhit', rif: 'tarifit', tzm: 'tmazight' },
  tzm: { fr: 'tfransist', ar: 'taarabt', dar: 'tdarijt', shi: 'tchelhit', rif: 'tarifit', tzm: 'tmazight' },
};
const TRAD = {
  fr: (x) => `Traduit ${OF.fr[x]}`, ar: (x) => `مترجم من ${OF.ar[x]}`, dar: (x) => `Mtarjem mn ${OF.dar[x]}`,
  shi: (x) => `Iturjem zg ${OF.shi[x]}`, rif: (x) => `Yetturjem zi ${OF.rif[x]}`, tzm: (x) => `Iturjem zg ${OF.tzm[x]}`,
};
export const tradLabel = (from, to) => TRAD[to](from);
const ORIG_L = { fr: "Voir l'original", ar: 'عرض الأصل', dar: "Chouf l'asl", shi: 'Zr asli', rif: 'Zar asli', tzm: 'Zer asli' };
const HIDE_L = { fr: "Masquer l'original", ar: 'إخفاء الأصل', dar: "Khbbi l'asl", shi: 'Ffr asli', rif: 'Ffer asli', tzm: 'Ffer asli' };
export const origLabel = (L) => ORIG_L[L] || ORIG_L.fr;
export const hideLabel = (L) => HIDE_L[L] || HIDE_L.fr;
// La phrase discrète, une seule fois (choix de la langue, tête du fil).
export const AUTO_NOTE = {
  fr: 'Traductions automatiques, à vérifier en cas de doute', ar: 'ترجمات آلية، تحقق منها عند الشك', dar: 'Tarjama automatique, chouf mzyan ila chakiti',
  shi: 'Tisuqilin s lmakina, zr mzyan ig tchekkt', rif: 'Tisuqilin s lmakina, zar mlih ma tchekked', tzm: 'Tisuqilin s lmakina, zer mzyan mer tchekked',
};

// 19 nov. : sous chaque message traduit, dans la langue de celui qui lit (le message d'origine reste affiché juste en dessous).
const INDIC = {
  fr: 'traduction indicative, sans valeur légale', ar: 'ترجمة إرشادية، بلا قيمة قانونية', dar: 'tarjama taqribiya, bla qima qanouniya',
  shi: 'tasuqilt i tmssirt, ur tla azal n lqanun', rif: 'tasuqilt i tmessirt, war tesεi azal n lqanun', tzm: 'tasuqilt i tmssirt, ur tla azal n lqanun',
};
export const indicNote = (L) => INDIC[L] || INDIC.fr;
const ORIG_T = { fr: 'Original', ar: 'الأصل', dar: 'Lasl', shi: 'Asli', rif: 'Asli', tzm: 'Asli' };
export const origTitle = (L) => ORIG_T[L] || ORIG_T.fr;

// ---------- Interface : dictionnaire des textes les plus vus (français → ar, dar, shi, rif, tzm) ----------
const UI = [
  ['Client', 'الزبون', 'Client', '', '', ''],
  ['Entreprise', 'المقاولة', 'Charika', '', '', ''],
  ['Contrôleur', 'المراقب', 'Mouraqib', '', '', ''],
  ['Qui', 'من', 'Chkoun', '', '', ''],
  ['Ce qui change pour vous', 'ما يتغير بالنسبة لك', 'Achno kaytbeddel lik', '', '', ''],
  ['Ce qui sera publié', 'ما سيُنشر', 'Achno ghadi ytnchar', '', '', ''],
  ['Ce qui ne sera jamais publié', 'ما لن يُنشر أبداً', 'Achno 3mmro ma ytnchar', '', '', ''],
  ['Où en est le pilote', 'أين وصلت التجربة', 'Fin wslat tajriba', '', '', ''],
  ['· Ferraillage prêt · visite demandée avant coulage', '· التسليح جاهز · زيارة مطلوبة قبل صب الخرسانة', '· Lhdid wajed · ziyara matloba 9bel lbeton', '', '', ''],
  ['· 3 photos de fin ajoutées : ferraillage des poteaux prêt', '· أُضيفت 3 صور للنهاية: تسليح الأعمدة جاهز', '· Tzadou 3 tswer: lhdid dyal lpotoyat wajed', '', '', ''],
  ['· Début déclaré avec 1 photo', '· تم التصريح بالبداية مع صورة واحدة', '· Lbdaya mseftta b tswira', '', '', ''],
  ['France · montants aussi en euros, créneaux aussi à votre heure', 'فرنسا · المبالغ باليورو أيضاً، والمواعيد بتوقيتك أيضاً', 'Fransa · lmbalegh hta b l2euro, w lmawa3id b sa3tek', '', '', ''],
  ['Belgique · montants aussi en euros, créneaux aussi à votre heure', 'بلجيكا · المبالغ باليورو أيضاً، والمواعيد بتوقيتك أيضاً', 'Beljika · lmbalegh hta b l2euro, w lmawa3id b sa3tek', '', '', ''],
  // Vague 20 (doigt : Leila) : portes, activité, chemin, étape, rapport, profil : plus de français dans la vue arabe.
  ['Bienvenue', 'مرحباً', 'Merhba', '', '', ''],
  ['Votre rôle', 'دورك', 'Dorek', '', '', ''],
  ['Choisissez', 'اختر', 'Khtar', '', '', ''],
  ['votre porte', 'بابك', 'babek', '', '', ''],
  ['Client et entreprise ont un compte. Le contrôleur entre par un lien, sans compte.', 'للزبون وللمقاولة حساب. يدخل المراقب عبر رابط، بدون حساب.', 'Lclient w charika 3ndhom compte. Lmouraqib kaydkhol b lien, bla compte.', '', '', ''],
  ['Je suis mon chantier, sur place ou à distance', 'أتابع ورشي، في عين المكان أو عن بعد', 'Kantba3 chantier dyali, f blasto wla mn b3id', '', '', ''],
  ['Je déclare les étapes', 'أُعلن عن المراحل', 'Kanseftt lmarahil', '', '', ''],
  ['Je vérifie sur place, par lien', 'أتحقق في عين المكان، عبر رابط', 'Kanthqqeq f blasa, b lien', '', '', ''],
  ['Entrer · Client', 'الدخول · الزبون', 'Dkhol · Client', '', '', ''],
  ['Entrer · Entreprise', 'الدخول · المقاولة', 'Dkhol · Charika', '', '', ''],
  ["Ouvrir mon lien d'invitation", 'فتح رابط الدعوة', '7ell lien dyal da3wa', '', '', ''],
  ["Je n'ai pas encore de compte", 'ليس لدي حساب بعد', 'Ma3ndich compte mazal', '', '', ''],
  ['Votre chantier, suivi pas à pas.', 'ورشك، متابَع خطوة بخطوة.', 'Chantier dyalek, mtab3 khatwa b khatwa.', '', '', ''],
  ['Langue', 'اللغة', 'Logha', '', '', ''],
  ['Changer de langue', 'تغيير اللغة', 'Beddel logha', '', '', ''],
  ['Tout', 'الكل', 'Kolchi', '', '', ''],
  ['Avis', 'الآراء', 'Lara2', '', '', ''],
  ['Glissez une ligne vers la gauche pour la marquer comme lue.', 'اسحب سطراً نحو اليسار لتعليمه كمقروء.', 'Jerr ster l lisser bach ywelli mqri.', '', '', ''],
  ['Rien de nouveau', 'لا جديد', 'Walo jdid', '', '', ''],
  ['Les déclarations, avis et échanges apparaîtront ici.', 'ستظهر هنا التصريحات والآراء والمحادثات.', 'Ghadi ybanou hna tasrihat, lara2 w lmohadatat.', '', '', ''],
  ['Visite demandée', 'زيارة مطلوبة', 'Ziyara matloba', '', '', ''],
  ['VISITE DEMANDÉE', 'زيارة مطلوبة', 'ZIYARA MATLOBA', '', '', ''],
  ['VISITE ATTENDUE', 'زيارة منتظرة', 'ZIYARA MNTADRA', '', '', ''],
  ['Ce chantier', 'هذا الورش', 'Had chantier', '', '', ''],
  ['Tant que l’entreprise n’a pas accepté, vous pouvez le corriger ou l’annuler.', 'ما دامت المقاولة لم تقبل، يمكنكم تصحيحه أو إلغاؤه.', 'Ma dama l-entreprise ma qblatch, t9dr tsa77o wla tlghih.', '', '', ''],
  ['Modifier le nom, la ville, les étapes', 'تعديل الاسم والمدينة والمراحل', 'Bddel smiya, lmdina, lmarahil', '', '', ''],
  ['Annuler le chantier', 'إلغاء الورش', 'Lghi chantier', '', '', ''],
  ['Modifier le chantier', 'تعديل الورش', 'Bddel chantier', '', '', ''],
  ['Annuler ce chantier ?', 'إلغاء هذا الورش؟', 'Tlghi had chantier ?', '', '', ''],
  ['Enregistrer', 'حفظ', 'Sjjel', '', '', ''],
  ['Copier', 'نسخ', 'Nsekh', '', '', ''],
  ['Échanges', 'المراسلات', 'Lmrasalat', '', '', ''],
  ['L’entreprise demande à revoir les étapes', 'المقاولة تطلب مراجعة المراحل', 'L-entreprise kat9ol nraj3o lmarahil', '', '', ''],
  ['Mot privé du client', 'كلمة خاصة من الزبون', 'Kelma khassa mn lklyan', '', '', ''],
  ['Un mot privé', 'كلمة خاصة', 'Kelma khassa', '', '', ''],
  ['Mission proposée', 'مهمة مقترحة', 'Mission mqtar7a', '', '', ''],
  ["Ouvrir l'étape", 'فتح المرحلة', '7ell lmarhala', '', '', ''],
  ['Signaler un arrêt du chantier', 'الإبلاغ عن توقف الورش', 'Blegh b woqouf chantier', '', '', ''],
  ["Plus personne sur le chantier ? L'entreprise aura 8 jours pour reprendre", 'لا أحد في الورش؟ للمقاولة 8 أيام للاستئناف', 'Ta wahed ma kayn f chantier? Charika 3ndha 8 iyam bach terje3', '', '', ''],
  ['Avenants', 'الملاحق', 'Lmola7aqat', '', '', ''],
  ['Travaux en plus, proposés et acceptés à deux', 'أشغال إضافية، مقترحة ومقبولة من الطرفين', 'Khdma zayda, mqtar7a w mqboula mn jouj', '', '', ''],
  ['Réception des travaux', 'تسلم الأشغال', 'Tasallom lkhdma', '', '', ''],
  ['Inviter', 'دعوة', 'Ste3di', '', '', ''],
  ['Votre entreprise n’est pas encore invitée', 'لم تتم دعوة مقاولتك بعد', 'Charika dyalek mazal ma tste3dat', '', '', ''],
  ['À jour', 'محدَّث', 'Kolchi mzyan', '', '', ''],
  ['Il ne retient plus le chantier.', 'لم يعد يوقف الورش.', 'Ma bqach kayw9ef chantier.', 'Ur da yttḥbas axeddim.', 'Ur itteḥbas ca axeddim.', 'Ur da yttḥbas axeddim.'],
  ['dalle et toiture-terrasse', 'البلاطة والسطح', 'dalle w sth', '', '', ''],
  ['Dalle et toiture-terrasse', 'البلاطة والسطح', 'Dalle w sth', '', '', ''],
  ['Maintenant :', 'الآن:', 'Daba:', '', '', ''],
  ['Pour vous :', 'بالنسبة لك:', 'Bnisba lik:', '', '', ''],
  ['rien à faire, vous serez prévenu.', 'لا شيء عليك، سيتم إخبارك.', 'walo dir, ghadi ykhbrouk.', '', '', ''],
  ['rien à faire de votre côté pour l’instant, vous serez prévenu.', 'لا شيء عليك الآن، سيتم إخبارك.', 'walo 3lik daba, ghadi ykhbrouk.', '', '', ''],
  ['la visite du contrôleur, puis le coulage', 'زيارة المراقب، ثم صب الخرسانة', 'ziyarat lmouraqib, mn ba3d lcoulage', '', '', ''],
  ['la visite du contrôleur', 'زيارة المراقب', 'ziyarat lmouraqib', '', '', ''],
  ['le coulage à déclarer', 'التصريح بصب الخرسانة', 'tasrih b lcoulage', '', '', ''],
  ['l\'étape doit commencer', 'يجب أن تبدأ المرحلة', 'lmarhala khass tbda', '', '', ''],
  ['le client doit consulter votre déclaration', 'على الزبون أن يطلع على تصريحك', 'lclient khasso ychouf tasrih dyalek', '', '', ''],
  ['rien d’obligatoire, vous serez prévenu (une photo au client reste possible).', 'لا شيء إلزامي، سيتم إخبارك (يمكنك إرسال صورة للزبون).', 'Walo lazem, ghadi n3elmouk (t9der tsifet tswira l lclient).', '', '', ''],
  ['à vous d’agir.', 'دورك الآن.', 'nta li khassek tdir.', 'Tamatart nk.', 'Tamatart nnek.', 'Tamatart nk.'],
  ['rien à faire : la visite est en retard, TEEQA relance l’agence et vous préviendra.', 'لا شيء عليك: الزيارة متأخرة، TEEQA تذكّر الوكالة وستخبرك.', 'Walo 3lik: zyara m3attla, TEEQA kat3awed l lwakala w ghadi t3elmek.', 'Ur ak ikki mad tskrt : tirzi tɛttl, TEEQA ad tsmmekti i lwakala, ad ak tini.', 'War ak yeqqim mi ttegged : tirzi teɛṭṭel, TEEQA ad tesmekti i lwakala, ad ak tini.', 'Ur ak ikki mad tskrt : tirzi tɛttl, TEEQA ad tsmmekti i lwakala, ad ak tini.'],
  ['En savoir plus', 'معرفة المزيد', '3ref ktar', '', '', ''],
  ['Règles de l’étape, visite, paiement', 'قواعد المرحلة، الزيارة، الدفع', 'Qawa3id lmarhala, ziyara, lkhlas', '', '', ''],
  ['Photos et historique', 'الصور والسجل', 'Tswer w ttarikh', '', '', ''],
  ['Un problème ?', 'مشكلة؟', 'Kayn mochkil?', '', '', ''],
  ['Photos sur place · contrôleur', 'صور في عين المكان · المراقب', 'Tswer f blasa · lmouraqib', '', '', ''],
  ['Déclarations · entreprise', 'التصريحات · المقاولة', 'Tasrihat · charika', '', '', ''],
  ["Aucune photo du contrôleur pour l'instant.", 'لا توجد صور للمراقب حالياً.', 'Mazal ma kayna tswira dyal lmouraqib.', '', '', ''],
  ['Agence :', 'الوكالة:', 'Lwkala:', '', '', ''],
  ['Ce que la visite contrôle :', 'ما تراقبه الزيارة:', 'Achno katchouf ziyara:', '', '', ''],
  ['Ferraillage prêt, pas encore vérifié.', 'الحديد جاهز، لم يُتحقق منه بعد.', 'Lhdid wajed, mazal ma tchaf.', '', '', ''],
  ['Ferraillage', 'التسليح', 'Lhdid', '', '', ''],
  ["Point d'arrêt", 'نقطة توقف', 'No9tat wo9ouf', '', '', ''],
  [": les barres d'acier, avant le béton.", ': قضبان الحديد، قبل الخرسانة.', ': lqdban dyal lhdid, 9bel lbeton.', '', '', ''],
  [": pas de béton avant l'avis du contrôleur.", ': لا خرسانة قبل رأي المراقب.', ': ma kaynch beton 9bel ra2y lmouraqib.', '', '', ''],
  ["Une précision à l'entreprise ou au contrôleur, dans les échanges", 'توضيح للمقاولة أو للمراقب، في المحادثات', 'Tawdih l charika wla l lmouraqib, f lmohadatat', '', '', ''],
  ['Motif et une pièce (photo, vocal, capture, témoignage)', 'السبب ووثيقة (صورة، رسالة صوتية، لقطة، شهادة)', 'Sabab w wraqa (tswira, vocal, capture, chahada)', '', '', ''],
  ["Parler à quelqu'un de TEEQA", 'التحدث مع شخص من TEEQA', 'Hder m3a chi wahed mn TEEQA', '', '', ''],
  ['WhatsApp, appel ou rappel, dans votre langue', 'واتساب، مكالمة أو معاودة الاتصال، بلغتك', 'WhatsApp, appel wla n3iyto lik, b loghtek', '', '', ''],
  ['Signaler à TEEQA', 'الإبلاغ إلى TEEQA', 'Blegh TEEQA', '', '', ''],
  ['Fraude, fausse preuve, comportement grave : seul TEEQA le lit', 'احتيال، دليل مزيف، سلوك خطير: لا يقرؤه إلا TEEQA', 'Ghich, dalil mzwwer, slouk khatir: ghir TEEQA li kayqrah', '', '', ''],
  ['Envoyer une photo au client', 'إرسال صورة إلى الزبون', 'Sift tswira l client', '', '', ''],
  ['Arrêter', 'إيقاف', 'Wqqef', '', '', ''],
  ['Fiche du chantier', 'بطاقة الورش', 'Fiche dyal chantier', '', '', ''],
  ['Lieu, parties, agence, convention, fin prévue', 'المكان، الأطراف، الوكالة، الاتفاقية، النهاية المتوقعة', 'Blasa, atraf, wkala, ittifaqiya, nihaya', '', '', ''],
  ['Lieu', 'المكان', 'Blasa', '', '', ''],
  ['Agence', 'الوكالة', 'Lwkala', '', '', ''],
  ['Contrôles', 'المراقبات', 'Lmoraqabat', '', '', ''],
  ['Convention', 'الاتفاقية', 'Ittifaqiya', '', '', ''],
  ['Créé le', 'أُنشئ في', 'Tsawb nhar', '', '', ''],
  ['Fin prévue', 'النهاية المتوقعة', 'Nihaya mtwaq3a', '', '', ''],
  ['Heures', 'الساعات', 'Sswaye3', '', '', ''],
  ['Heure du Maroc', 'توقيت المغرب', 'Lwaqt dyal lmeghrib', '', '', ''],
  ['Réception', 'التسلم', 'Tasallom', '', '', ''],
  ['En cours', 'قيد الإنجاز', 'Khddam', '', '', ''],
  ['Conforme', 'مطابق', 'Mtaba9', '', '', ''],
  ['Valeur de ce rapport :', 'قيمة هذا التقرير:', 'Qima dyal had taqrir:', '', '', ''],
  ['Valeur de ce rapport : le détail', 'قيمة هذا التقرير: التفاصيل', 'Qima dyal had taqrir: tafasil', '', '', ''],
  ['Heures, signatures, empreinte', 'الساعات، التوقيعات، البصمة', 'Sswaye3, twqi3at, bsma', '', '', ''],
  ['Comment le vérifier :', 'كيف تتحقق منه:', 'Kifach tthqqeq mnno:', '', '', ''],
  ["Limites d'un avis :", 'حدود الرأي:', 'Hdoud ra2y:', '', '', ''],
  ['Activé', 'مفعّل', 'Mkhddem', '', '', ''],
  ["Aucun pour l'instant", 'لا شيء حالياً', 'Walo daba', '', '', ''],
  ['Questions et lexique', 'أسئلة ومعجم', 'As2ila w mo3jam', '', '', ''],
  ["Prévenir TEEQA d'un abus ou d'une fraude", 'إبلاغ TEEQA عن تجاوز أو احتيال', 'Khbber TEEQA b ta3assof wla ghich', '', '', ''],
  ['Ce qui est garanti, plafonds, assurances', 'ما هو مضمون، السقوف، التأمينات', 'Achno madmoun, sqouf, ta2minat', '', '', ''],
  ["WhatsApp ou téléphone : français, arabe, darija, tachelhit, tarifit, tamazight de l'Atlas", 'واتساب أو هاتف: الفرنسية، العربية، الدارجة، تشلحيت، تاريفيت، تامازيغت الأطلس', 'WhatsApp wla telephone: fransawiya, 3arbiya, darija, tachelhit, tarifit, tamazight', '', '', ''],
  ['Client · compte TEEQA', 'الزبون · حساب TEEQA', 'Client · compte TEEQA', '', '', ''],
  // Vague 11 : textes restés en français dans la vue arabe et darija.
  ['Relancer', 'تذكير', 'Fakker', 'Smktit', 'Smekti', 'Smktit'],
  // Vague 18 (jury, n° 13)
  ['Photo précise', 'صورة محددة', 'Tswira mdqqa', 'Tswira imqqurn', 'Tswira s ttfasil', 'Tswira imqqurn'],
  ['Demander une autre agence', 'طلب وكالة أخرى', 'Tleb wkala khra', 'Ssuter yat tagnsut yadni', 'Ssuter tagensut nniḍen', 'Ssuter yat tagnsut yadni'],
  ['Autre agence', 'وكالة أخرى', 'Wkala khra', 'Tagnsut yadni', 'Tagensut nniḍen', 'Tagnsut yadni'],
  ['Pour vous :', 'بالنسبة لك:', 'Lik nta:', 'I kiyi:', 'I chek:', 'I kiyi:'],
  ['rien à faire, vous serez prévenu.', 'لا شيء عليك، سيتم إخبارك.', 'Ma 3endek ma dir, ghadi n3elmouk.', 'Ur ak ikki mad tskrt, ad ak nini.', 'War ak yeqqim mi ttegged, ad ak nini.', 'Ur ak ikki mad tskrt, ad ak nini.'],
  ['à vous d’agir, avec le bouton en bas.', 'دورك الآن، بالزر في الأسفل.', 'Dorek daba, b lbouton lteht.', 'Tamatart nk, s lbouton n wadday.', 'Tamatart nnek, s lbouton n wadday.', 'Tamatart nk, s lbouton n wadday.'],
  ['Marquer lu', 'تعليم كمقروء', 'Dir maqri', 'Ar ittwaghr', 'Ad yettwaghr', 'Ar ittwaghr'],
  ['Pays où je vis', 'البلد الذي أعيش فيه', 'Lblad li sakn fiha', 'Tamazirt g zdghgh', 'Tamurt di zedγeγ', 'Tamazirt g zdghgh'],
  // Onglets
  ['Chantiers', 'الأوراش', 'Chantiyat', 'Ichantiyn', 'Ichantiyen', 'Ichantiyen'],
  ['Missions', 'المهام', 'Lmahamat', 'Tiwuriwin', 'Tiwuriwin', 'Tiwuriwin'],
  ['Activité', 'النشاط', 'Jdid', 'Imaynuten', 'Ijdiden', 'Imaynuten'],
  ['Envois', 'الإرسال', 'Siftat', 'Tuzzna', 'Tuzzna', 'Tuzzna'],
  ['Profil', 'الملف الشخصي', 'Profil dyali', 'Profil inu', 'Profil inu', 'Profil inu'],
  // Mes chantiers
  ['Mes chantiers', 'أوراشي', 'Chantiyat dyali', 'Ichantiyn inu', 'Ichantiyen inu', 'Ichantiyen inu'],
  ['Mes missions', 'مهامي', 'Lmahamat dyali', 'Tiwuriwin inu', 'Tiwuriwin inu', 'Tiwuriwin inu'],
  ['Dernières nouvelles', 'آخر الأخبار', 'Akhir lakhbar', 'Lakhbar imaynuten', 'Lakhbar ijdiden', 'Lakhbar imaynuten'],
  ['Tout voir', 'عرض الكل', 'Chouf kolchi', 'Zr kullu', 'Zar marra', 'Zer kullu'],
  ['Ouvrir', 'فتح', 'Hel', 'Rzm', 'Ref', 'Rzem'],
  ['Invitations', 'الدعوات', 'Laaradat', 'Laaradat', 'Laaradat', 'Laaradat'],
  ['Archivés', 'المؤرشفة', 'Mkhbbyin', 'Ttwahdan', 'Ttwahdan', 'Ttwahdan'],
  ['Créer un chantier', 'إنشاء ورش', 'Dir chantier jdid', 'Skr achanti amaynu', 'Gg achanti ajdid', 'Skr achanti amaynu'],
  ['Aucun chantier en cours', 'لا يوجد ورش قيد الإنجاز', 'Ma kayn hta chantier khddam', 'Ur illi achanti ar itteggan', 'Ur yelli achanti qa ittegg', 'Ur illi achanti ar itteggan'],
  ['Chantier clôturé · rapport archivé', 'ورش مغلق · التقرير مؤرشف', 'Chantier sala · rapport mhfoud', 'Achanti ikmmel · rapport ihda', 'Achanti yekmel · rapport yehda', 'Achanti ikmel · rapport ihda'],
  // Étapes du modèle
  ['Terrassement et fondations', 'الحفر والأساسات', 'Lhfir w lassasat', 'Lhfir d lassas', 'Lhfir d lassas', 'Lhfir d lassas'],
  ['Gros œuvre : murs et poteaux', 'الأشغال الكبرى: الجدران والأعمدة', 'Lbni: lhyout w lpotoyat', 'Lbni: lhyout d lpotoyat', 'Lbni: lhyout d lpotoyat', 'Lbni: lhyout d lpotoyat'],
  ['Dalle et toiture-terrasse', 'البلاطة والسطح', 'Ddala w ssteh', 'Ddala d ssteh', 'Ddala d ssteh', 'Ddala d ssteh'],
  ['Menuiseries et réseaux', 'النجارة والشبكات', 'Nnjara w lqwadis', 'Nnjara d lqwadis', 'Nnjara d lqwadis', 'Nnjara d lqwadis'],
  ['Enduits et zellige', 'التلبيس والزليج', 'Ttlbis w zzellij', 'Ttlbis d zzellij', 'Ttlbis d zzellij', 'Ttlbis d zzellij'],
  ['Finitions, contrôle avant réception', 'التشطيبات، مراقبة قبل الاستلام', 'Lfinisyon, mouraqaba qbel ttaslim', 'Lfinisyon d tmzrit n ttaslim', 'Lfinisyon d tmzrit n ttaslim', 'Lfinisyon d tmzrit n ttaslim'],
  // États
  ['Verrouillée', 'مقفلة', 'Msdoda', 'Tqqen', 'Teqqen', 'Tqqen'],
  ['Prête à débuter', 'جاهزة للبدء', 'Wajda bach tebda', 'Twjed ad tbdu', 'Tewjed ad tebdu', 'Twjed ad tebdu'],
  ['En cours · début déclaré', 'قيد الإنجاز · تم التصريح بالبداية', 'Khddamin · bdaw', 'Ar ttgen · bdan', 'Qa ttegen · bdan', 'Ar tteggen · bdan'],
  ['Fin déclarée · avis attendu', 'تم التصريح بالنهاية · في انتظار الرأي', 'Salaw · kantsennaw lavis', 'Kmmlen · ar ttqln lavis', 'Kemmlen · qa ttrajun lavis', 'Kemmlen · ar ttrajun lavis'],
  ['Fin déclarée · à consulter', 'تم التصريح بالنهاية · للاطلاع', 'Salaw · chouf', 'Kmmlen · zr', 'Kemmlen · zar', 'Kemmlen · zer'],
  ['Vérifiée · avis Validé', 'تم التحقق · رأي: مقبول', 'Tchafet · lavis: Mqboul', 'Tannay · lavis: Iqbl', 'Tuzra · lavis: Yeqbel', 'Tannay · lavis: Iqbel'],
  ['Avis : Réserves', 'الرأي: تحفظات', 'Lavis: tahaffodat', 'Lavis: tahaffudat', 'Lavis: tahaffudat', 'Lavis: tahaffudat'],
  ['Avis : Refusé', 'الرأي: مرفوض', 'Lavis: Mrfoud', 'Lavis: Irfed', 'Lavis: Yerfed', 'Lavis: Irfed'],
  ['Correction apportée', 'تم التصحيح', 'Tsslah', 'Tswab', 'Tswab', 'Tswab'],
  ['Ferraillage prêt · le contrôleur doit passer', 'الحديد جاهز · على المراقب أن يمر', 'Lhdid wajed · lcontrôleur khasso idouz', 'Uzzal iwjed · lcontrôleur ixssa ad iddu', 'Uzzal yewjed · lcontrôleur ixess ad d-yas', 'Uzzal iwjed · lcontrôleur ixessa ad d-yas'],
  ["Ouvre après le coulage de l'étape d'avant", 'تفتح بعد صب المرحلة السابقة', 'Kathl mn baad lbeton dyal lmarhala li qbel', 'Ad trzm dffir lbeton n lmarhala izwarn', 'Ad teref deffir lbeton n lmarhala tamezwarut', 'Ad trzem dffir lbeton n lmarhala izwarn'],
  ['Close · aciers validés, puis béton coulé', 'منتهية · الحديد مقبول، ثم صب الخرسانة', 'Salat · lhdid mqboul, w lbeton tsebb', 'Tkmml · uzzal iqbl, lbeton ig', 'Tekmel · uzzal yeqbel, lbeton yegg', 'Tkmel · uzzal iqbel, lbeton ig'],
  ['Déclarée · vue par le client, sans contrôle', 'مصرح بها · اطلع عليها الزبون، دون مراقبة', 'Mdeclariya · chafha lclient, bla controle', 'Tnna · izra-tt lclient, bla controle', 'Tenna · yezra-tt lclient, bla controle', 'Tenna · izra-tt lclient, bla controle'],
  ['En attente de la convention', 'في انتظار الاتفاقية', 'Kantsennaw lconvention', 'Ar nqql lconvention', 'Qa nettraju lconvention', 'Ar nttraju lconvention'],
  // Chemin du chantier
  ['Votre chantier', 'ورشك', 'Chantier dyalek', 'Achanti nnek', 'Achanti-nnek', 'Achanti nnek'],
  ['Rapport', 'التقرير', 'Rapport', 'Rapport', 'Rapport', 'Rapport'],
  ['Étape en cours', 'المرحلة الحالية', 'Lmarhala li daba', 'Lmarhala lli ghila', 'Lmarhala n drus-a', 'Lmarhala n dghi'],
  ['Inviter', 'دعوة', 'Aared', 'Aared', 'Aared', 'Aared'],
  ['Documents', 'الوثائق', 'Lwatayeq', 'Lwraq', 'Lwraq', 'Lwraq'],
  // Étape : boutons principaux
  ['Déclarer le début', 'التصريح بالبداية', 'Gol bdina', 'Ini nbda', 'Ini nebda', 'Ini nbda'],
  ['Déclarer la fin', 'التصريح بالنهاية', 'Gol salina', 'Ini nkmml', 'Ini nekmel', 'Ini nkmel'],
  ['Ferraillage prêt · demander la visite', 'الحديد جاهز · طلب الزيارة', 'Lhdid wajed · tleb lviziti', 'Uzzal iwjed · sutr tamzrit', 'Uzzal yewjed · ssuter tamzrit', 'Uzzal iwjed · sutr tamzrit'],
  ['Prendre la photo de départ', 'التقاط صورة البداية', 'Dir tswira dyal lbdya', 'Ssiwr tswira n tizwiri', 'Ssiwer tswira n tizwiri', 'Ssiwr tswira n tizwiri'],
  ['Ajouter une photo de départ', 'إضافة صورة البداية', 'Zid tswira dyal lbdya', 'Rnu tswira n tizwiri', 'Rnu tswira n tizwiri', 'Rnu tswira n tizwiri'],
  ['Ajouter une photo', 'إضافة صورة', 'Zid tswira', 'Rnu tswira', 'Rnu tswira', 'Rnu tswira'],
  ['Photo de correction', 'صورة التصحيح', 'Tswira dyal tsslah', 'Tswira n uswab', 'Tswira n uswab', 'Tswira n uswab'],
  ['Coulage fait · photo et déclaration', 'تم الصب · صورة وتصريح', 'Lbeton tsebb · tswira w declaration', 'Lbeton ig · tswira d declaration', 'Lbeton yegg · tswira d declaration', 'Lbeton ig · tswira d declaration'],
  ['Accepter cette visite', 'قبول هذه الزيارة', 'Qbel had lviziti', 'Qbl tamzrit ad', 'Qbel tamzrit-a', 'Qbel tamzrit ad'],
  ['Refuser la mission', 'رفض المهمة', 'Rfed lmouhimma', 'Ugi tawuri', 'Ugi tawuri', 'Ugi tawuri'],
  ['Photographier', 'تصوير', 'Sowwer', 'Ssiwr', 'Ssiwer', 'Ssiwr'],
  ["Signer l'avis", 'توقيع الرأي', 'Sini lavis', 'Sini lavis', 'Sini lavis', 'Sini lavis'],
  ['Poser une question', 'طرح سؤال', 'Sowwel', 'Ssqsa', 'Ssiqsi', 'Ssqsa'],
  ["J'ai consulté la déclaration", 'اطلعت على التصريح', 'Chft declaration', 'Zrigh declaration', 'Zrigh declaration', 'Zrigh declaration'],
  ['Demander une visite sur place', 'طلب زيارة في عين المكان', 'Tleb viziti f lblasa', 'Sutr tamzrit gh ugharas', 'Ssuter tamzrit dinni', 'Sutr tamzrit gh ugharas'],
  ['Voir le détail', 'عرض التفاصيل', 'Chouf tafasil', 'Zr kullu', 'Zar marra', 'Zer kullu'],
  ['Avis du contrôleur', 'رأي المراقب', 'Lavis dyal lcontrôleur', 'Lavis n lcontrôleur', 'Lavis n lcontrôleur', 'Lavis n lcontrôleur'],
  ['Derniers événements', 'آخر الأحداث', 'Akhir haja', 'Ayn izrin', 'Min yezrin', 'Ayn izrin'],
  ['Photos et historique', 'الصور والسجل', 'Tsawer w tarikh', 'Tsawer d tarikh', 'Tsawer d tarikh', 'Tsawer d tarikh'],
  ['Écouter cet écran', 'الاستماع إلى هذه الشاشة', 'Tsennet l had chacha', 'Sell i ugharas ad', 'Sel i ugharas-a', 'Sell i ugharas ad'],
  // Carte de paiement (mots imposés : « Paiement recommandé », « Paiement différé », « J'ai payé cette tranche »)
  ['Vous pouvez payer', 'يمكنك الدفع', 'Imken lik tkhelles', 'Tzdart ad tkhellst', 'Tzemred ad tkhellsed', 'Tzdart ad tkhellst'],
  ['Vous pouvez payer, sauf une part', 'يمكنك الدفع، باستثناء جزء', 'Imken lik tkhelles, ghir chi jouj', 'Tzdart ad tkhellst, ghas yan uhric', 'Tzemred ad tkhellsed, ghir yiwen uhric', 'Tzdart ad tkhellst, ghas yan uhric'],
  ['Attendez avant de payer', 'انتظر قبل الدفع', 'Tsenna qbel ma tkhelles', 'Qql dat ad tkhellst', 'Raju zzat ma tkhellsed', 'Rju dat ad tkhellst'],
  ['Paiement recommandé', 'الدفع موصى به', 'Lkhlas mnsouh bih', 'Lkhlas ifulki', 'Lkhlas yelha', 'Lkhlas ifulki'],
  ['Paiement différé', 'الدفع مؤجل', 'Lkhlas mwkhkhar', 'Lkhlas ittwakhkhar', 'Lkhlas yettwakhkher', 'Lkhlas ittwakhkhar'],
  ["J'ai payé cette tranche", 'دفعت هذا الشطر', 'Khllst had ttranche', 'Khellsgh ttranche ad', 'Khellsegh ttranche-a', 'Khellsegh ttranche ad'],
  ['Je préfère attendre', 'أفضل الانتظار', 'Kanfaddal ntsenna', 'Ri ad qqlgh', 'Khsegh ad rajugh', 'Righ ad rjugh'],
  ["J'ai reçu le paiement", 'توصلت بالدفع', 'Wsalni lkhlas', 'Ilkm-iyi-d lkhlas', 'Yewwed-ayi-d lkhlas', 'Ilkm-iyi-d lkhlas'],
  ["Recommandation au client, qui décide. Le paiement se fait hors TEEQA, qui ne retient jamais l'argent.", 'توصية للزبون، وهو من يقرر. يتم الدفع خارج TEEQA، التي لا تحتفظ بالمال أبدا.', "Nasiha l client, howa li kayqerrer. Lkhlas kaykoun barra TEEQA, w TEEQA ma katchedd hta flous.", "Tanasiht i lclient, nttan ad ifrn. Lkhlas ittili berra TEEQA, ur tttef TEEQA idrimen.", "Tanasiht i lclient, netta ad yefren. Lkhlas yetteg berra TEEQA, ur tettef TEEQA idrimen.", "Tanasiht i lclient, netta ad ifren. Lkhlas ittili berra TEEQA, ur tttef TEEQA idrimen."],
  ['Le contrôleur est passé sur place et a validé cette étape.', 'مر المراقب في عين المكان وقبل هذه المرحلة.', 'Lcontrôleur daz l lblasa w qbel had lmarhala.', 'Iddu lcontrôleur s ugharas, iqbl lmarhala ad.', 'Yusa-d lcontrôleur dinni, yeqbel lmarhala-a.', 'Yusa-d lcontrôleur s ugharas, iqbel lmarhala ad.'],
  ["Le contrôleur a refusé cette étape : le travail est à reprendre, puis contrôlé de nouveau sur place.", 'رفض المراقب هذه المرحلة: يجب إعادة العمل ثم مراقبته من جديد في عين المكان.', "Lcontrôleur rfed had lmarhala: lkhedma khassha tawed, w ytchaf mn jdid f lblasa.", 'Irfed lcontrôleur lmarhala ad: ixssa ad talst tawuri, ad tettwazr dagh gh ugharas.', 'Yerfed lcontrôleur lmarhala-a: ixess ad tales tawuri, ad tettwazar dagh dinni.', 'Irfed lcontrôleur lmarhala ad: ixessa ad talst tawuri, ad tettwazr dagh gh ugharas.'],
  ["Un désaccord est ouvert sur cette étape. Pour le client : attendre qu'il soit clos (accord, retrait, ou second avis quand il est ouvert sur cet avis) est possible ; l'échéance de la tranche reste celle de la règle, 7 jours après l'avis favorable (ou le coulage déclaré), et le désaccord est dit à côté.", 'يوجد خلاف مفتوح حول هذه المرحلة. يمكن للزبون انتظار إغلاقه (اتفاق، سحب أو رأي ثان)؛ يبقى أجل الشطر هو أجل القاعدة، 7 أيام بعد الرأي الإيجابي (أو صب الخرسانة المصرح به)، ويُذكر الخلاف بجانبه.', 'Kayn khilaf f had lmarhala. Lkliyan imken ytsenna hta ytsedd (ittifaq, tsehhib wla lavis tani); lajal dyal ttranch kayb9a 7 iyam men ba3d lavis lmzyan (wla lcoulage lmsarreh), w lkhilaf kaytktab hdah.', 'Illa umnnag gh lmarhala ad. Nnsh ak ad tqqlt ard ikmml (ittifaq, tsehhib nigh lavis wis sin).', 'Yella umennugh di lmarhala-a. Nennsah-ak ad traju ar ad yekmel (ittifaq, tsehhib negh lavis wis sin).', 'Illa umennugh gh lmarhala ad. Nnsh ak ad trjut ar ad ikmel (ittifaq, tsehhib nigh lavis wis sin).'],
  // Échanges
  ['Échanges', 'المراسلات', 'Lmsajat', 'Imeslayn', 'Imeslayen', 'Imeslayen'],
  ['Précision', 'توضيح', 'Tawdih', 'Tawdiht', 'Tawdiht', 'Tawdiht'],
  ['Contestation', 'اعتراض', 'Itiraad', 'Agui', 'Agui', 'Agui'],
  ['Réponse', 'رد', 'Jawab', 'Tiririt', 'Tiririt', 'Tiririt'],
  ['Précision demandée', 'توضيح مطلوب', 'Tawdih matloub', 'Tawdiht ittwasutern', 'Tawdiht yettwassutren', 'Tawdiht ittwasutern'],
  ['Votre message…', 'رسالتك…', 'Lmessage dyalek…', 'Tabrat nnek…', 'Tabrat-nnek…', 'Tabrat nnek…'],
  ['Les échanges et les preuves sont conservés. TEEQA signale les contestations mais ne tranche pas.', 'المراسلات والأدلة محفوظة. تنبه TEEQA إلى الاعتراضات لكنها لا تفصل فيها.', 'Lmsajat w ddalayel mhfoudin. TEEQA katnebbeh l itiraad walakin ma kathkemch.', 'Imeslayn d tinitin hdan. TEEQA tnna-d i ugui, mach ur tsfaw.', 'Imeslayen d tinitin hdan. TEEQA tenna-d i ugui, mala ur tsefaw.', 'Imeslayen d tinitin hdan. TEEQA tenna-d i ugui, mach ur tsfaw.'],
  ['Réponses rapides', 'ردود سريعة', 'Jawabat dghya', 'Tiririn s uzzrb', 'Tiririn s uzzerb', 'Tiririn s uzzrb'],
  ['Bien reçu', 'تم الاستلام', 'Wslni, mzyan', 'Ilkm-iyi-d, ifulki', 'Yewwed-ayi-d, ifulki', 'Ilkm-iyi-d, ifulki'],
  ['Envoyez une photo', 'أرسل صورة', 'Sift tswira', 'Azn-d tswira', 'Sifed-d tswira', 'Azn-d tswira'],
  ['Appelez-moi', 'اتصل بي', 'Aayet liya', 'Ghr-iyi s tilifun', 'Ghar-ayi s tilifun', 'Ghr-iyi s tilifun'],
  ['Retard de livraison', 'تأخر في التسليم', 'Livraison mtakhra', 'Livraison tettel', 'Livraison tettel', 'Livraison tettel'],
  ['Je passe demain', 'سأمر غدا', 'Ghadi ndouz ghedda', 'Ad d-zrigh azekka', 'Ad d-zregh azekka', 'Ad d-zrigh azekka'],
  ['Merci', 'شكرا', 'Choukran', 'Tanmirt', 'Thanmirt', 'Tanmirt'],
  ['Je regarde', 'سأنظر في الأمر', 'Ghadi nchouf', 'Ad t-zrigh', 'Ad t-zregh', 'Ad t-zrigh'],
  ['Écouter', 'استمع', 'Tsennet', 'Sell', 'Sel', 'Sell'],
  ['Écouter où en est mon chantier', 'استمع إلى حالة ورشي', 'Sme3 fin wsel chantier dyali', 'Sell s manig iwweḍ ucantiy inu', 'Sel mani yewweḍ ucantiy inu', 'Sell s manis yewweḍ ucantiy inu'],   // vague 21
  ['Vocal', 'رسالة صوتية', 'Vocal', 'Vocal', 'Vocal', 'Vocal'],
  ['Enregistrer un vocal', 'تسجيل رسالة صوتية', 'Sejjel vocal', 'Sjjl vocal', 'Sejjel vocal', 'Sjjl vocal'],
  ['Demander une photo', 'طلب صورة', 'Tleb tswira', 'Sutr tswira', 'Ssuter tswira', 'Sutr tswira'],
  ['Répondre par une photo', 'الرد بصورة', 'Jaweb b tswira', 'Rar s tswira', 'Rar s tswira', 'Rar s tswira'],
  ['Photo demandée', 'صورة مطلوبة', 'Tswira matlouba', 'Tswira ittwasutern', 'Tswira yettwassutren', 'Tswira ittwasutern'],
  ['Photo envoyée', 'تم إرسال الصورة', 'Tswira tsaftat', 'Tswira tuzn', 'Tswira tusifed', 'Tswira tuzn'],
  ['Transcription', 'النص المكتوب', 'Lktaba', 'Tira', 'Tira', 'Tira'],
  ['Transcription indisponible', 'النص المكتوب غير متوفر', 'Lktaba ma kaynach', 'Ur tlli tira', 'Ur telli tira', 'Ur tlli tira'],
  ['Pas de traduction automatique pour ce message', 'لا توجد ترجمة آلية لهذه الرسالة', 'Ma kaynach tarjama l had lmessage', 'Ur tlli tsuqilt i tbrat ad', 'Ur telli tsuqilt i tebrat-a', 'Ur tlli tsuqilt i tbrat ad'],
  ['Langue', 'اللغة', 'Lougha', 'Tutlayt', 'Tutlayt', 'Tutlayt'],
  ['Paramètres', 'الإعدادات', 'Lparamètres', 'Lparamètres', 'Lparamètres', 'Lparamètres'],
  ['Aide', 'مساعدة', 'Mousaada', 'Tiwisi', 'Tawsit', 'Tiwisi'],
  ['Confidentialité', 'الخصوصية', 'Sirriya', 'Tabaddut', 'Tabaddut', 'Tabaddut'],
  ['Se déconnecter', 'تسجيل الخروج', 'Khrej', 'Ffogh', 'Ffegh', 'Ffegh'],
  ['Voir', 'عرض', 'Chouf', 'Zr', 'Zar', 'Zer'],
  ['Avis attendu', 'في انتظار الرأي', 'Kantsennaw lavis', 'Ar nqql lavis', 'Qa nettraju lavis', 'Ar nttraju lavis'],
  ['Accès sur invitation', 'الدخول بدعوة', 'Dkhoul b daawa', 'Akchm s laarada', 'Akchem s laarada', 'Akchem s laarada'],
  ['Retour', 'رجوع', 'Rjou', 'Urri', 'Uuri', 'Urri'],
  ['Envoyer le vocal', 'إرسال الرسالة الصوتية', 'Sift lvocal', 'Azn vocal', 'Sifed vocal', 'Azn vocal'],
  ['Langue du vocal', 'لغة الرسالة الصوتية', 'Lougha dyal lvocal', 'Tutlayt n vocal', 'Tutlayt n vocal', 'Tutlayt n vocal'],
  ['Appuyez pour parler', 'اضغط للتحدث', 'Brek bach tehder', 'Ddz ad tsawlt', 'Dez ad tsiwled', 'Ddz ad tsawlt'],
  ['Arrêter', 'إيقاف', 'Wqef', 'Bdd', 'Bedd', 'Bdd'],
  ['Annuler', 'إلغاء', 'Lghi', 'Kks', 'Kkes', 'Kks'],
  ['Message vocal', 'رسالة صوتية', 'Vocal', 'Vocal', 'Vocal', 'Vocal'],
  ['Langue · اللغة · Tutlayt', 'اللغة · Langue · Tutlayt', 'Lougha · Langue', 'Tutlayt · Langue', 'Tutlayt · Langue', 'Tutlayt · Langue'],
  ['Prix du forfait', 'ثمن الباقة', 'Taman dyal lforfait', 'Atig n lforfait', 'Atig n lforfait', 'Atig n lforfait'],
  ['Le forfait TEEQA', 'باقة TEEQA', 'Lforfait dyal TEEQA', 'Lforfait n TEEQA', 'Lforfait n TEEQA', 'Lforfait n TEEQA'],
  ['Le paiement des travaux', 'أداء ثمن الأشغال', 'Lkhlas dyal lkhedma', 'Lkhlas n twuri', 'Lkhlas n twuri', 'Lkhlas n twuri'],
  ['Notifications et alertes', 'الإشعارات والتنبيهات', 'Tanbihat', 'Tinbihin', 'Tinbihin', 'Tinbihin'],
  ['Signaler un problème', 'الإبلاغ عن مشكلة', 'Blleg b mochkil', 'Ini-d yan wugur', 'Ini-d yiwen wugur', 'Ini-d yan wugur'],
  ['Mes signalements', 'بلاغاتي', 'Tablighat dyali', 'Tablighat inu', 'Tablighat inu', 'Tablighat inu'],
  ['Réduire les animations', 'تقليل الحركات', 'Nqes lharakat', 'Ssnqs tamussni', 'Ssenqes tamussni', 'Ssnqs tamussni'],
  ['Vibrations', 'الاهتزاز', 'Ttrjij', 'Ttrjij', 'Ttrjij', 'Ttrjij'],
  ['Fermer', 'إغلاق', 'Sedd', 'Mdl', 'Qqen', 'Mdel'],
  // ---------- Vague 8 : statuts, « Qui agit maintenant », avis, paiement, contestation, nouveaux écrans ----------
  ['Correction envoyée · contre-visite à faire', 'تم إرسال التصحيح · زيارة مضادة منتظرة', 'Tsslah tsaft · lcontre-visite mazal', 'Tswab yuzn · tamzrit tis snat ur tta', 'Tswab yettwazen · tamzrit tis snat ur ca', 'Tswab yuzn · tamzrit tis snat ur ta'],
  ['Corrigée · contrôlée sur photo', 'مصححة · تمت مراقبتها بالصورة', 'Tsslhat · tchafet b tswira', 'Tswab · tannay s tswira', 'Tswab · tannay s tswira', 'Tswab · tannay s tswira'],
  ['Aciers contrôlés · béton pas encore coulé', 'الحديد مراقَب · الخرسانة لم تُصب بعد', 'Lhdid tchaf · lbeton mazal ma tsebb', 'Uzzal tannay · lbeton ur ta ittwagga', 'Uzzal tannay · lbeton ur ca yettwagg', 'Uzzal tannay · lbeton ur ta ittwagga'],
  ['Close · réserves levées, puis béton coulé', 'منتهية · رُفعت التحفظات ثم صُبت الخرسانة', 'Salat · tahaffodat tlaqaw, mn baad tsebb lbeton', 'Tkmml · tahaffudat kkisn, lbeton ittwagga', 'Tekmel · tahaffudat ttwakksent, lbeton yettwagg', 'Tkmml · tahaffudat kkisn, lbeton ittwagga'],
  ['Sans visite de contrôle', 'بدون زيارة مراقبة', 'Bla viziti dyal lmouraqaba', 'Bla tamzrit n tannayt', 'Bla tamzrit n tannayt', 'Bla tamzrit n tannayt'],
  ['Contestation signalée', 'تم الإبلاغ عن اعتراض', 'Itiraad tblleg', 'Agui ittwanna', 'Agui yettwanna', 'Agui ittwanna'],
  ['Qui agit maintenant :', 'من يتصرف الآن:', 'Chkoun li khdam daba:', 'Ma ixddmn dγi:', 'Wi ixeddmen tura:', 'Ma ixddmn dγi:'],
  ['Personne pour l’instant', 'لا أحد حاليا', 'Hta wahed daba', 'Yan ur illi dγi', 'Hed war illi tura', 'Yan ur illi dγi'],
  ['Le client et l’entreprise', 'الزبون والمقاولة', 'Lclient w charika', 'Lclient d tcharikt', 'Lclient d tcharikt', 'Lclient d tcharikt'],
  ['Le contrôleur', 'المراقب', 'Lcontrôleur', 'Lcontrôleur', 'Lcontrôleur', 'Lcontrôleur'],
  ["L'agence de contrôle", 'وكالة المراقبة', 'Lwakala dyal lmouraqaba', 'Lwakala n tannayt', 'Lwakala n tannayt', 'Lwakala n tannayt'],
  ['Vous, pour votre agence', 'أنت، باسم وكالتك', 'Nta, b smiyt lwakala dyalk'],
  ['Personne', 'لا أحد', 'Hta wahed', 'Yan', 'Hed', 'Yan'],
  ["L'étape d'avant doit d'abord être close.", 'يجب أولا إغلاق المرحلة السابقة.', 'Lmarhala li qbel khass tsedd lowla.', 'Lmarhala izwarn ixssa ad tkmml.', 'Lmarhala tamezwarut kha tekmel.', 'Lmarhala izwarn ixssa ad tkmml.'],
  ['Photo de départ, puis début déclaré.', 'صورة البداية ثم التصريح بالبداية.', 'Tswira dyal lbdya, mn baad igol bdina.', 'Tswira n tizwuri, sin ad inn bdan.', 'Tswira n tizwuri, ghar dinni ad yini bdan.', 'Tswira n tizwuri, sin ad inn bdan.'],
  ['Accepter la convention.', 'قبول الاتفاقية.', 'Qbel lconvention.', 'Qbl lconvention.', 'Qbel lconvention.', 'Qbl lconvention.'],
  ['3 photos, puis « ferraillage prêt ».', '3 صور، ثم «الحديد جاهز».', '3 tsawer, mn baad « lhdid wajed ».', '3 tsawer, sin « uzzal iwjed ».', '3 tsawer, ghar dinni « uzzal yewjed ».', '3 tsawer, sin « uzzal iwjed ».'],
  ['3 photos, puis « fin déclarée ».', '3 صور، ثم «التصريح بالنهاية».', '3 tsawer, mn baad « salina ».', '3 tsawer, sin « nkmml ».', '3 tsawer, ghar dinni « nekmel ».', '3 tsawer, sin « nkmml ».'],
  ['Consulter la déclaration.', 'الاطلاع على التصريح.', 'Chouf ttasrih.', 'Zr ttasrih.', 'Zar ttasrih.', 'Zer ttasrih.'],
  ['Avis signé, il part au retour du réseau.', 'الرأي موقع، سيُرسل عند عودة الشبكة.', 'Lavis msini, ghadi imchi mlli trje3 rrizo.', 'Lavis isina, ad iddu ig d-yuri rrizo.', 'Lavis yesina, ad yeddu mi d-yuγal rrizo.', 'Lavis isina, ad iddu ig d-yuri rrizo.'],
  ['Accepter la visite (24 h), puis passer ; visite non facturée.', 'قبول الزيارة (24 ساعة)، ثم المرور؛ زيارة غير مؤدى عنها.', 'Qbel lviziti (24 sa3a), w dowez; lviziti blach.', 'Qbl tamzrit (24 tisaε), tzrit ; tamzrit bla lxlas.', 'Qbel tamzrit (24 tisaε), tzerd ; tamzrit bla lxlas.', 'Qbl tamzrit (24 tisaε), tzrit ; tamzrit bla lxlas.'],
  ['Accepter la visite (24 h).', 'قبول الزيارة (24 ساعة).', 'Qbel lviziti (24 sa3a).', 'Qbl tamzrit (24 tisaε).', 'Qbel tamzrit (24 tisaε).', 'Qbl tamzrit (24 tisaε).'],
  ['doit accepter la visite sous 24 h.', 'عليها قبول الزيارة خلال 24 ساعة.', 'khassha tqbel lviziti f 24 sa3a.', 'Qbl tamzrit (24 tisaε).', 'Qbel tamzrit (24 tisaε).', 'Qbl tamzrit (24 tisaε).'],
  ['Accepter la contre-visite (24 h).', 'قبول الزيارة المضادة (24 ساعة).', 'Qbel lcontre-visite (24 sa3a).', 'Qbl tamzrit tis snat (24 tisaε).', 'Qbel tamzrit tis snat (24 tisaε).', 'Qbl tamzrit tis snat (24 tisaε).'],
  ['doit accepter la contre-visite sous 24 h.', 'عليها قبول الزيارة المضادة خلال 24 ساعة.', 'Qbel lcontre-visite (24 sa3a).', 'Qbl tamzrit tis snat (24 tisaε).', 'Qbel tamzrit tis snat (24 tisaε).', 'Qbl tamzrit tis snat (24 tisaε).'],
  ['Couler le béton, puis le déclarer avec une photo.', 'صب الخرسانة ثم التصريح بها بصورة.', 'Sebb lbeton, w gol b tswira.', 'Gg lbeton, sin inn s tswira.', 'Egg lbeton, ghar dinni ini s tswira.', 'Gg lbeton, sin inn s tswira.'],
  ['Corriger les réserves.', 'تصحيح التحفظات.', 'Sslah tahaffodat.', 'Swab tahaffudat.', 'Swab tahaffudat.', 'Swab tahaffudat.'],
  ['Contrôler la correction.', 'مراقبة التصحيح.', 'Chouf tsslah.', 'Annay tswab.', 'Annay tswab.', 'Annay tswab.'],
  ['Reprendre le travail, puis déclarer de nouveau.', 'إعادة العمل ثم التصريح من جديد.', 'Aawed lkhedma, w gol mn jdid.', 'Ales tawuri, sin inn dagh.', 'Eεawed axeddim, ghar dinni ini daghen.', 'Ales tawuri, sin inn dagh.'],
  ['Décider du paiement de la tranche.', 'اتخاذ قرار دفع الشطر.', 'Qerrer f lkhlas dyal ttranche.', 'Gzm f lkhlas n ttranche.', 'Gzem f lkhlas n ttranche.', 'Gzm f lkhlas n ttranche.'],
  ['Confirmer la réception du paiement.', 'تأكيد التوصل بالدفع.', 'Akked belli wslek lkhlas.', 'Sbdd is ilkm-d lkhlas.', 'Sbedd is d-yewwed lkhlas.', 'Sbdd is ilkm-d lkhlas.'],
  ['Étape close.', 'المرحلة مغلقة.', 'Lmarhala msdoda.', 'Lmarhala tkmml.', 'Lmarhala tekmel.', 'Lmarhala tkmml.'],
  ['Écouter', 'استمع', 'Tsennet', 'Sell', 'Sel', 'Sell'],
  ['Mode simple', 'الوضع المبسط', 'Lmode sahl', 'Amuddu ishilen', 'Amuddu ishilen', 'Amuddu ishilen'],
  ["Parler à quelqu'un", 'التحدث مع شخص', 'Hder m3a chi wahed', 'Sawl d yan', 'Ssiwel akid hed', 'Sawl d yan'],
  ['Écrire sur WhatsApp', 'الكتابة على واتساب', 'Kteb f WhatsApp', 'Ara f WhatsApp', 'Ari di WhatsApp', 'Ara f WhatsApp'],
  ['Tous mes chantiers', 'كل أوراشي', 'Ga3 les chantiers dyali', 'Akk ichantiyen inu', 'Marra ichantiyen inu', 'Akk ichantiyen inu'],
  ['Indiqué payé, à confirmer', 'مصرّح بأدائه، في انتظار التأكيد', 'Galo khllsoh, khass ttakkid', 'Nnan ikhlls, ira asbdd', 'Nnan yekhelles, ikhes asbedd', 'Nnan ikhlls, ira asbdd'],
  ['Sur le compte de séquestre', 'في حساب الضمان', 'F l7ssab dyal ddaman', 'G l7ssab n ddaman', 'Di l7ssab n ddaman', 'G l7ssab n ddaman'],
  ['Reste à verser', 'الباقي للأداء', 'Lbaqi lkhlas', 'Ayd yqqimn i lkhlas', 'Ayen yeqqimen i lkhlas', 'Ayd yqqimn i lkhlas'],
  ['Clôturé', 'مغلق', 'Msdoud', 'Ikmml', 'Yekmel', 'Ikmml'],
  ["Je n'ai pas reçu ce paiement", 'لم أتوصل بهذا الأداء', 'Ma wsalnich had lkhlas', 'Ur dari ilkim lkhlas ad', 'Ur yewwed ghari lkhlas a', 'Ur dari ilkim lkhlas ad'],
  ["Le client indique : « J'ai payé cette tranche »", 'يصرّح الزبون: « دفعت هذا الشطر »', "Lclient kaygoul : « Khllst had ttranche »", 'Inna lclient : « Khllsgh ttranche ad »', 'Yenna lclient : « Khellsegh ttranche a »', 'Inna lclient : « Khllsgh ttranche ad »'],
  ['Créneau de passage : choisi par le contrôleur, vous serez prévenu', 'موعد المرور: يختاره المراقب، وستتوصلون بإشعار', 'Lw9t dyal lmrour : kaykhtaro lmouraqib, ghadi tws8lek risala', '', '', ''],
  ["Vous voyez le nom de l'agence, pas celui de la personne : dans les avis et les échanges, il s'affiche « Contrôleur TEEQA ».", 'ترون اسم الوكالة لا اسم الشخص: في الآراء والمراسلات يظهر « مراقب TEEQA ».', 'Katchouf smiyt lwakala, machi smiyt chkhs : f laraa w lmorasalat kaybane « mouraqib TEEQA ».', '', '', ''],
  ["Pendant l'attente, protéger les ouvrages exposés (aciers à la pluie, bâche) reste à votre charge : une photo datée le montre.", 'أثناء الانتظار، تبقى حماية المنشآت المكشوفة (الحديد من المطر، الغطاء) على عاتقكم: صورة مؤرخة تثبت ذلك.', 'F lwe9t dyal lintidar, 7imayat lkhdma lmkchoufa (l7did mn ch-chta, lbach) 3lik : tswira b tarikh katbiyyen.', '', '', ''],
  ["Récuser l'agence (une fois, avec un motif)", 'رفض الوكالة (مرة واحدة، مع ذكر السبب)', 'Rfed lwakala (mra wa7da, m3a sabab)', '', '', ''],
  ['Contrôleur TEEQA', 'مراقب TEEQA', 'Mouraqib TEEQA', '', '', ''],
  ['· Visite de contrôle acceptée', '· زيارة المراقبة مقبولة', '· Ziyarat lmoura9aba ma9boula', '', '', ''],
  ['Facturation et comptabilité', 'الفوترة والمحاسبة', 'Lfactura w lmo7asaba', '', '', ''],
  ['Exporter les tranches (tableur)', 'تصدير الأشطر (جدول)', 'Khrrej ttranchat (tableau)', '', '', ''],
  ['· payée, reçu confirmé', '· مدفوعة، تم تأكيد التوصل', '· mkhlssa, lwsoul mt2akked', '', '', ''],
  ['Indiqué par payeur :', 'حسب من دفع:', '3la hsab chkoun khlles :', '', '', ''],
  ['Comment ça marche', 'كيف يعمل', 'Kifach khddama', '', '', ''],
  ['Paiement hors TEEQA, acompte, versements partiels', 'أداء خارج TEEQA، تسبيق، دفعات جزئية', 'Lkhlas bra TEEQA, tasbi9, khlas b ljouz2', '', '', ''],
  ['Type de message, urgence, réponses rapides', 'نوع الرسالة، الاستعجال، ردود سريعة', 'Naw3 risala, l3ajal, jwabat sri3a', '', '', ''],
  ['Prévient tout de suite les autres (une fois par jour)', 'ينبه الآخرين فورًا (مرة في اليوم)', 'Kaynbbeh lakhrin daba (mra f nhar)', '', '', ''],
  ['Joindre une photo prise maintenant', 'إرفاق صورة ملتقطة الآن', 'Zid tswira mchdouda daba', '', '', ''],
  ["Prise dans l'appli, avec ses deux heures, comme les photos de l'étape", 'ملتقطة في التطبيق، بساعتيها، مثل صور المرحلة', 'Mchdouda f lappli, b jouj swaye3, bhal tswer dyal lmarhala', '', '', ''],
  ["Je serai sans réseau jusqu'à demain soir", 'سأكون بدون شبكة حتى مساء الغد', 'Ghadi nkoun bla rizo 7tta ghedda f l3chiya', '', '', ''],
  ['WhatsApp', 'واتساب', 'WhatsApp', '', '', ''],
  ['Gros œuvre', 'الأشغال الكبرى', 'Lkhdma lkbira', '', '', ''],
  ['Finitions', 'التشطيبات', 'Ttachtibat', '', '', ''],
  ['Terrassement et…', 'الحفر و…', 'L7fir w…', '', '', ''],
  ['Dalle et…', 'البلاطة و…', 'Ddala w…', '', '', ''],
  ['Reçu', 'تم التوصل', 'Wsel', '', '', ''],
  ['rien', 'لا شيء', 'walo', '', '', ''],
  ['Confirmer', 'تأكيد', 'Akked', '', '', ''],
  ['Appeler', 'اتصال', 'Aayet', 'Ghr', 'Ari s tilifun', 'Ghr'],
  ['Gardés sur ce téléphone dès l’acceptation : ils s’ouvrent sans réseau. La carte, elle, demande du réseau : notez le repère avant de partir.', 'محفوظة في هذا الهاتف منذ القبول: تُفتح دون شبكة. أما الخريطة فتحتاج إلى الشبكة: دوّن العلامة قبل الذهاب.', 'Mhfoudin f had ttilifoun mn nhar lqbul: kaytḥllu bla rizo. Lkharita katḥtaj rizo: kteb lalama qbel ma tmchi.', 'Hfdn g ttilifoun ad zg lqbul: rzmn bla rizo. Lkharita trra rizo: ara talamt qbl ad tddut.', 'Hfden di ttilifoun a zi lqbul: ttarzmen bla rizo. Lkharita tekhs rizo: ari talamt qbel ad truhed.', 'Hfdn g ttilifoun ad zg lqbul: rzmn bla rizo. Lkharita trra rizo: ara talamt qbl ad tddut.'],
  ['avec réserves', 'مع تحفظات', 'B tahaffodat', '', '', ''],
  ['Refusé', 'مرفوض', 'Marfoud', '', '', ''],
  ['Appeler TEEQA', 'الاتصال بـ TEEQA', 'Aayet l TEEQA', 'Ghr i TEEQA', 'Ari i TEEQA s tilifun', 'Ghr i TEEQA'],
  ['Être rappelé', 'طلب معاودة الاتصال', 'Iaawdo ychiyto lik', 'Ad ak d-ghrn', 'Ad ak d-γren', 'Ad ak d-ghrn'],
  ['Budget des travaux', 'ميزانية الأشغال', 'Lmizaniya dyal lkhedma', 'Lmizaniya n twuriwin', 'Lmizaniya n ixeddimen', 'Lmizaniya n twuriwin'],
  ['Total prévu', 'المجموع المتوقع', 'Lmajmou3 lmtwqqe3', 'Kullu lli ittwarzan', 'Merra i yettwarzan', 'Kullu lli ittwarzan'],
  ['Payé (indiqué)', 'المدفوع (مصرح به)', 'Mkhelles (mgoul)', 'Ittwakhlls (ittwanna)', 'Yettwakhelles (yettwanna)', 'Ittwakhlls (ittwanna)'],
  ['Reste', 'الباقي', 'Lbaqi', 'Lbaqi', 'Lbaqi', 'Lbaqi'],
  ['Montant', 'المبلغ', 'Lmablagh', 'Lmablagh', 'Lmablagh', 'Lmablagh'],
  ['Échéance', 'أجل الأداء', 'Lajal', 'Lajal', 'Lajal', 'Lajal'],
  ['Qui décide', 'من يقرر', 'Chkoun li kayqerrer', 'Ma igzzmn', 'Wi igezzmen', 'Ma igzzmn'],
  ['selon votre devis', 'حسب عرض الأثمان', 'kima f ddevis dyalek', 'zund g ddevis nnek', 'am di ddevis nnek', 'zund g ddevis nnek'],
  ['Référence du virement', 'مرجع التحويل', 'Rréférence dyal lvirement', 'Rréférence n lvirement', 'Rréférence n lvirement', 'Rréférence n lvirement'],
  ['Payée par', 'دفعها', 'Khllsha', 'Ikhlls tt', 'Yekhelles itt', 'Ikhlls tt'],
  ["Paiement non reçu à l'échéance", 'لم يتم التوصل بالدفع في الأجل', 'Lkhlas ma wslch f lwqt', 'Lkhlas ur d-ilkim g lajal', 'Lkhlas war d-yewwid di lajal', 'Lkhlas ur d-ilkim g lajal'],
  ['Me désister de cette visite', 'الانسحاب من هذه الزيارة', 'Nnsahb mn had lviziti', 'Ad ffghgh zg tamzrit ad', 'Ad effgheγ zi tamzrit-a', 'Ad ffghgh zg tamzrit ad'],
  ['Relevé de rémunération', 'كشف الأجر', 'Kachf dyal lkhlas', 'Tasmmalt n lkhlas', 'Tasmmalt n lkhlas', 'Tasmmalt n lkhlas'],
  ['Tout voir', 'عرض الكل', 'Chouf kolchi', 'Zr kullu', 'Zar marra', 'Zer kullu'],
  ['Commencer', 'ابدأ', 'Bda', 'Bdu', 'Bdu', 'Bdu'],
  ["J'ai déjà un compte", 'لدي حساب بالفعل', 'Andi deja compte', 'Ghuri yan lcompte', 'Ghari yiwen lcompte', 'Ghuri yan lcompte'],
  ['fin prévue', 'النهاية المتوقعة', 'lkhatima lmtwqqe3a', 'tagara ittwarzan', 'taggara yettwarzan', 'tagara ittwarzan'],
  ['Contre-visite pour vérifier une correction de structure', 'زيارة مضادة للتحقق من تصحيح في الهيكل', 'Contre-visite bach ychouf tsslah dyal lhaykal', 'Tamzrit tis snat i tswab n lhaykal', 'Tamzrit tis snat i tswab n lhaykal', 'Tamzrit tis snat i tswab n lhaykal'],
  ['Visite de contrôle demandée', 'زيارة مراقبة مطلوبة', 'Viziti dyal lmouraqaba matlouba', 'Tamzrit n tannayt tttwasutr', 'Tamzrit n tannayt tettwasutr', 'Tamzrit n tannayt tttwasutr'],
  ['Visite de contrôle acceptée', 'زيارة مراقبة مقبولة', 'Viziti dyal lmouraqaba mqboula', 'Tamzrit n tannayt tttwaqbl', 'Tamzrit n tannayt tettwaqbel', 'Tamzrit n tannayt tttwaqbl'],
  ['Avis en vigueur', 'الرأي الساري', 'Lavis li khddam', 'Lavis lli ixddmn', 'Lavis i yxeddmen', 'Lavis lli ixddmn'],
  ['Avis antérieur', 'رأي سابق', 'Lavis li qbel', 'Lavis izwarn', 'Lavis amezwaru', 'Lavis izwarn'],
  ['Avis Validé', 'رأي: مقبول', 'Lavis: Mqboul', 'Lavis: Iqbl', 'Lavis: Yeqbel', 'Lavis: Iqbl'],
  ['Avis avec réserves', 'رأي مع تحفظات', 'Lavis b tahaffodat', 'Lavis s tahaffudat', 'Lavis s tahaffudat', 'Lavis s tahaffudat'],
  ['Avis Refusé', 'رأي: مرفوض', 'Lavis: Mrfoud', 'Lavis: Iggi', 'Lavis: Yugi', 'Lavis: Iggi'],
  ['Réserves levées', 'رُفعت التحفظات', 'Tahaffodat tlaqaw', 'Tahaffudat kkisn', 'Tahaffudat ttwakksent', 'Tahaffudat kkisn'],
  ['Payer ou attendre', 'الدفع أو الانتظار', 'Tkhelles wla tsenna', 'Khlls nigh qql', 'Khelles negh ggan', 'Khlls nigh qql'],
  ['En clair', 'باختصار', 'Bwdouh', 'S tifawt', 'S tifawt', 'S tifawt'],
  ['Pas de recommandation', 'لا توصية', 'Hta nasiha', 'Ur tlli tnasiht', 'War tella tnasiht', 'Ur tlli tnasiht'],
  ["Une correction est envoyée ; une contre-visite sur place est prévue. Attendez son avis.", 'تم إرسال تصحيح، وزيارة مضادة في عين المكان مبرمجة. انتظر رأيها.', 'Tsslah tsaft, w kayna contre-visite f lblasa. Tsenna lavis dyalha.', 'Tswab yuzn, tamzrit tis snat g ublas ar d-tasi. Qql lavis nnes.', 'Tswab yettwazen, tamzrit tis snat di ublas ad d-tas. Ggan lavis nnes.', 'Tswab yuzn, tamzrit tis snat g ublas ar d-tasi. Qql lavis nnes.'],
  ["Une correction est envoyée ; le contrôleur la regarde sur photo. Attendez son retour.", 'تم إرسال تصحيح، والمراقب يفحصه بالصورة. انتظر رده.', 'Tsslah tsaft, lcontrôleur kaychoufo f tswira. Tsenna jawabo.', 'Tswab yuzn, lcontrôleur ar t-izzr s tswira. Qql tiririt nnes.', 'Tswab yettwazen, lcontrôleur qa t-yezzar s tswira. Ggan tiririt nnes.', 'Tswab yuzn, lcontrôleur ar t-izzr s tswira. Qql tiririt nnes.'],
  ["Le contrôleur a émis une réserve sur la structure ou un ouvrage caché. Attendez la correction et la contre-visite.", 'أبدى المراقب تحفظا على الهيكل أو على عمل مخفي. انتظر التصحيح والزيارة المضادة.', 'Lcontrôleur dar tahaffod f lhaykal wla f chi haja mkhbbya. Tsenna tsslah w lcontre-visite.', 'Lcontrôleur iga tahaffudt f lhaykal nigh f kra iffern. Qql tswab d tamzrit tis snat.', 'Lcontrôleur yegga tahaffudt f lhaykal negh f kra yeffren. Ggan tswab d tamzrit tis snat.', 'Lcontrôleur iga tahaffudt f lhaykal nigh f kra iffern. Qql tswab d tamzrit tis snat.'],
  ["L'étape n'est pas close : le béton n'est pas encore coulé. L'entreprise corrige, un contrôleur repasse, puis elle coule. Une fois le coulage déclaré, le paiement sera recommandé.", 'المرحلة لم تنته: الخرسانة لم تُصب بعد. المقاولة تصحح، ثم يعود مراقب، ثم تصب. بعد التصريح بالصب، سيوصى بالدفع.', 'Lmarhala ma salatch: lbeton mazal ma tsebb. Charika katsslah, lcontrôleur kayrje3, mn baad katsebb. Mlli tgol belli sebbat, lkhlas ghadi ykoun mnsouh bih.', 'Lmarhala ur tkmml: lbeton ur ta ittwagga. Tcharikt ar tswab, lcontrôleur ad d-yaghul, sin ad tgg lbeton. Ig tnna is tgga t, lkhlas ad ig ifulki.', 'Lmarhala war tekmil: lbeton war ca yettwagg. Tcharikt qa tswab, lcontrôleur ad d-yuγal, ghar dinni ad tegg lbeton. Mi tenna tegga t, lkhlas ad yili yelha.', 'Lmarhala ur tkmml: lbeton ur ta ittwagga. Tcharikt ar tswab, lcontrôleur ad d-yaghul, sin ad tgg lbeton. Ig tnna is tgga t, lkhlas ad ig ifulki.'],
  ['Paiement recommandé, sauf la part liée à la réserve', 'الدفع موصى به، باستثناء الجزء المرتبط بالتحفظ', 'Lkhlas mnsouh bih, ghir ljouz dyal tahaffod', 'Lkhlas ifulki, ghas tafult n tahaffudt', 'Lkhlas yelha, ghas tafult n tahaffudt', 'Lkhlas ifulki, ghas tafult n tahaffudt'],
  ['Étape sans visite : vous décidez d\'après les photos de l\'entreprise.', 'مرحلة بدون زيارة: تقرر بناء على صور المقاولة.', 'Marhala bla viziti: nta li katqerrer b tsawer dyal charika.', 'Lmarhala bla tamzrit: kiyi ad igzmn s tsawer n tcharikt.', 'Lmarhala bla tamzrit: cek ad igezzmen s tsawer n tcharikt.', 'Lmarhala bla tamzrit: kiyi ad igzmn s tsawer n tcharikt.'],
  // Contestation (échanges)
  ['Exprimer un désaccord', 'التعبير عن خلاف', 'Gol belli ma mtafeqch', 'Ini is ur tqblt', 'Ini is war tqebled', 'Ini is ur tqblt'],
  ['Désaccord ouvert', 'خلاف مفتوح', 'Khilaf mhloul', 'Amsgal irzm', 'Amsgal yerzem', 'Amsgal irzm'],
  ['Retirer ma contestation', 'سحب اعتراضي', 'Hiyed litiraad dyali', 'Kks agui inu', 'Kkes agui inu', 'Kks agui inu'],
  ['Accord trouvé', 'تم التوصل إلى اتفاق', 'Tfahmna', 'Nmsasa', 'Nemsasa', 'Nmsasa'],
  ['Demander un second avis', 'طلب رأي ثان', 'Tleb lavis tani', 'Sutr lavis wiss sin', 'Ssuter lavis wis sin', 'Sutr lavis wiss sin'],
  ['TEEQA ne tranche pas.', 'TEEQA لا يحسم.', 'TEEQA ma kayhkemch.', 'TEEQA ur ittgzam.', 'TEEQA war yettgezzam.', 'TEEQA ur ittgzam.'],
  ['Désaccord retiré par son auteur.', 'سحب صاحبه الخلاف.', 'Mol lkhilaf hiydo.', 'Bab n umsgal ikkis t.', 'Bab n umsgal yekkes it.', 'Bab n umsgal ikkis t.'],
  // Résumés de la convention et de l'annexe
  ['Passer sur place', 'المرور إلى الورش', 'Idouz l chantier', 'Ad izri s uchanti', 'Ad yezri ghar uchanti', 'Ad izri s uchanti'],
  ['Revenir sur place (contre-visite)', 'العودة إلى الورش (زيارة مضادة)', 'Yrje3 l chantier (contre-visite)', 'Ad d-yaghul s uchanti (tamzrit tis snat)', 'Ad d-yuγal ghar uchanti (tamzrit tis snat)', 'Ad d-yaghul s uchanti (tamzrit tis snat)'],
  ['au plus tard le', 'في أجل أقصاه', 'f akhir ajal', 'ur izri', 'war yezri', 'ur izri'],
  ['Début déclaré', 'تم التصريح بالبداية', 'Bdina', 'Bdan', 'Bdan', 'Bdan'],
  ['Ferraillage prêt', 'الحديد جاهز', 'Lhdid wajed', 'Uzzal iwjed', 'Uzzal yewjed', 'Uzzal iwjed'],
  ['Fin déclarée', 'تم التصريح بالنهاية', 'Salina', 'Nkmml', 'Nekmel', 'Nkmml'],
  ['Avis signé', 'الرأي موقع', 'Lavis msini', 'Lavis isina', 'Lavis yesina', 'Lavis isina'],
  ['Vue par le client', 'اطلع عليها الزبون', 'Chafha lclient', 'Izra tt lclient', 'Yezra tt lclient', 'Izra tt lclient'],
  ['Avis Validé (ferraillage)', 'رأي: مقبول (الحديد)', 'Lavis: Mqboul (lhdid)', 'Lavis: Iqbl (uzzal)', 'Lavis: Yeqbel (uzzal)', 'Lavis: Iqbl (uzzal)'],
  ['Avis avec réserves (ferraillage)', 'رأي مع تحفظات (الحديد)', 'Lavis b tahaffodat (lhdid)', 'Lavis s tahaffudat (uzzal)', 'Lavis s tahaffudat (uzzal)', 'Lavis s tahaffudat (uzzal)'],
  ['Avis avec réserves (ferraillage) · contre-visite à faire', 'رأي مع تحفظات (الحديد) · زيارة مضادة منتظرة', 'Lavis b tahaffodat (lhdid) · lcontre-visite mazal', 'Lavis s tahaffudat (uzzal) · tamzrit tis snat ur tta', 'Lavis s tahaffudat (uzzal) · tamzrit tis snat ur ca', 'Lavis s tahaffudat (uzzal) · tamzrit tis snat ur ta'],
  ['Coulage déclaré', 'تم التصريح بالصب', 'Sebbina lbeton', 'Ngga lbeton', 'Negga lbeton', 'Ngga lbeton'],
  ['Paiement (hors appli)', 'الدفع (خارج التطبيق)', 'Lkhlas (bra lapplication)', 'Lkhlas (bra n lapplication)', 'Lkhlas (beεd zi lapplication)', 'Lkhlas (bra n lapplication)'],
  ["Photo jointe, après l'avis sur le ferraillage.", 'الصورة مرفقة، بعد الرأي حول الحديد.', 'Tswira mlsoqa, mn baad lavis 3la lhdid.', 'Tswira tlla, dffir n lavis f uzzal.', 'Tswira tella, deffir n lavis f uzzal.', 'Tswira tlla, dffir n lavis f uzzal.'],
  ['Ferraillage validé sur place, puis coulage déclaré avec une photo.', 'تم قبول الحديد في عين المكان، ثم التصريح بالصب مع صورة.', 'Lhdid tqbel f lblasa, w mn baad galo sebbina b tswira.', 'Uzzal iqbl g ublas, sin nnan ngga lbeton s tswira.', 'Uzzal yeqbel di ublas, ghar dinni nnan negga lbeton s tswira.', 'Uzzal iqbl g ublas, sin nnan ngga lbeton s tswira.'],
  ['Hors TEEQA · non vérifié', 'خارج TEEQA · غير متحقق منه', 'Bra TEEQA · ma tchafch', 'Bra n TEEQA · ur ittwannay', 'Beεd zi TEEQA · war yettwannay', 'Bra n TEEQA · ur ittwannay'],
  ['Paiement différé · votre décision', 'الدفع مؤجل · قرارك', 'Lkhlas mwkhkhar · qrarek', 'Lkhlas ittwakhkhar · tagzzumt nnek', 'Lkhlas yettwakhkher · tagzzumt nnek', 'Lkhlas ittwakhkhar · tagzzumt nnek'],
  ['selon le devis', 'حسب عرض الأثمان', 'kima f ddevis', 'zund g ddevis', 'am di ddevis', 'zund g ddevis'],
  ['Indiqué par', 'صرّح به', 'Galha', 'Inna tt', 'Yenna tt', 'Inna tt'],
  ['Justificatif photo joint', 'تم إرفاق صورة الإثبات', 'Tswira dyal lwasl mlsoqa', 'Tswira n lwasl tlla', 'Tswira n lwasl tella', 'Tswira n lwasl tlla'],
  ['Voir le justificatif', 'عرض الإثبات', 'Chouf lwasl', 'Zr lwasl', 'Zar lwasl', 'Zer lwasl'],
  ["En attente de la confirmation de réception par l'entreprise", 'في انتظار تأكيد المقاولة للتوصل', 'Kantsennaw charika tgol wslni', 'Ar nqql tcharikt ad tsbdd is ilkm-d', 'Qa nettraju tcharikt ad tsebded is d-yewwed', 'Ar nqql tcharikt ad tsbdd is ilkm-d'],
  ['Modifier', 'تعديل', 'Beddel', 'Bddl', 'Beddel', 'Bddl'],
  ['Avis complet, photos, déclarations et historique', 'الرأي الكامل، الصور، التصريحات والسجل', 'Lavis kamel, tsawer, ttasrihat w tarikh', 'Lavis kullu, tsawer, ttasrihat d umzruy', 'Lavis merra, tsawer, ttasrihat d umezruy', 'Lavis kullu, tsawer, ttasrihat d umzruy'],
  ['Un problème ?', 'مشكلة؟', 'Kayn chi mochkil?', 'Illa kra n wugur?', 'Yella kra n wugur?', 'Illa kra n wugur?'],
  ['Question, désaccord ou signalement à TEEQA', 'سؤال أو خلاف أو بلاغ إلى TEEQA', 'Soual, khilaf wla tablig l TEEQA', 'Asqsi, amsgal nigh tablight i TEEQA', 'Asqsi, amsgal negh tablight i TEEQA', 'Asqsi, amsgal nigh tablight i TEEQA'],
  ['Écouter ce message', 'الاستماع إلى هذه الرسالة', 'Tsennet l had lmessage', 'Sell i tbratt ad', 'Sel i tebratt-a', 'Sell i tbratt ad'],
  ['Paiement recommandé.', 'الدفع موصى به.', 'Lkhlas mnsouh bih.', 'Lkhlas ifulki.', 'Lkhlas yelha.', 'Lkhlas ifulki.'],
  ['Paiement différé.', 'الدفع مؤجل.', 'Lkhlas mwkhkhar.', 'Lkhlas ittwakhkhar.', 'Lkhlas yettwakhkher.', 'Lkhlas ittwakhkhar.'],
  ['Payée par', 'دفعها', 'Khllsha', 'Ikhlls tt', 'Yekhelles itt', 'Ikhlls tt'],
  ['Résumé dans votre langue', 'ملخص بلغتك', 'Molakhas b loghtek', 'Asgzl s tutlayt nnek', 'Asegzel s tutlayt nnek', 'Asgzl s tutlayt nnek'],
  // Vague 12 : restes de français relevés par le jury sur les écrans les plus vus (Mes chantiers, étape, échanges).
  ['Envoyer', 'إرسال', 'Sift', 'Azn', 'Azen', 'Azn'],
  ['Avis du contrôleur', 'رأي المراقب', 'Lavis dyal lcontrôleur', 'Lavis n lcontrôleur', 'Lavis n lcontrôleur', 'Lavis n lcontrôleur'],
  ['Validé', 'مقبول', 'Mqboul', 'Iqbl', 'Yeqbel', 'Iqbl'],
  ['Avis en vigueur', 'الرأي المعمول به', 'Lavis li khddam', 'Lavis lli itteggan', 'Lavis i yettggen', 'Lavis lli itteggan'],
  ['Avis antérieur', 'رأي سابق', 'Lavis l9dim', 'Lavis aqdim', 'Lavis aqdim', 'Lavis aqdim'],
  ['Tout voir', 'عرض الكل', 'Chouf kolchi', 'Zr kullu', 'Zar marra', 'Zr kullu'],
  ['Écouter', 'استمع', 'Tsennet', 'Sell', 'Sel', 'Sell'],
  ['Pièces du dossier', 'وثائق الملف', 'Lwraq dyal dossier', 'Lwraq n dossier', 'Lwraq n dossier', 'Lwraq n dossier'],
  ['Actualités du chantier', 'مستجدات الورش', 'Jdid dyal chantier', 'Amaynu n achanti', 'Amaynu n achanti', 'Amaynu n achanti'],
  // Vague 21 (doigt : Samira) : l'étape du client lue entièrement en arabe (carte de paiement, visite, agence, périmètre, taux).
  ['· rien à payer aujourd’hui', '· لا شيء للدفع اليوم', '· walo tkhlles lyoum', '', '', ''],
  ['Pas encore de date', 'لا يوجد تاريخ بعد', 'Mazal ma kayn tarikh', '', '', ''],
  ['Depuis l’étranger : rappel 2 jours avant.', 'من الخارج: تذكير قبل الأجل بيومين.', 'Mn lkharij: tfakir 2 iyam 9bel.', '', '', ''],
  ['Virement depuis l’étranger : 2 à 4 jours ouvrés. Rappel 2 jours avant la date limite.', 'تحويل من الخارج: من يومين إلى 4 أيام عمل. تذكير قبل الأجل بيومين.', 'Tahwil mn lkharij: 2 ta 4 iyam dyal lkhdma. Tfakir 2 iyam 9bel l-ajal.', '', '', ''],
  ['Pendant l’attente, protéger les ouvrages exposés (aciers à la pluie, bâche) reste à l’entreprise ; TEEQA ne le surveille pas.', 'خلال الانتظار، تبقى حماية الأشغال المكشوفة (الحديد من المطر، الغطاء) على عاتق المقاولة؛ TEEQA لا تراقب ذلك.', 'F had lwe9t, l-entreprise hiya li katghetti lhdid mn chta; TEEQA ma kat-surveillich.', '', '', ''],
  ['bureau de contrôle technique', 'مكتب المراقبة التقنية', 'bureau dyal l-contrôle technique', '', '', ''],
  ["les aciers des poteaux et chaînages, avant le coulage, et le bon de livraison du béton des fondations. Les murs de remplissage (briques), montés ensuite, sont déclarés par l'entreprise avec photos, sans visite ; le contrôleur de la dalle les voit en place.", 'حديد الأعمدة والسلاسل قبل صب الخرسانة، ووصل تسليم خرسانة الأساسات. جدران الملء (الآجر)، التي تُبنى بعد ذلك، تصرّح بها المقاولة بالصور، بدون زيارة؛ ويراها مراقب البلاطة في مكانها.', 'lhdid dyal lpotoyat w chainage 9bel lbeton, w lbon dyal lbeton dyal lfondasyon. Lhyout dyal lyajour katsrrah bihom l-entreprise b tswer; lmouraqib dyal dalle kaychoufhom.', '', '', ''],
  ["fouilles, aciers des semelles et longrines, enrobage, avant le coulage. Le béton coulé est déclaré par l'entreprise avec deux photos et le bon de livraison de la centrale ; le contrôleur de l'étape suivante relit ce bon (et le résultat des éprouvettes à 28 jours, s'il y en a).", 'الحفر وحديد القواعد والروافد والتغطية، قبل صب الخرسانة. تصرّح المقاولة بالخرسانة المصبوبة مع صورتين ووصل تسليم المعمل؛ ويقرأ مراقب المرحلة التالية هذا الوصل (ونتيجة العينات بعد 28 يومًا، إن وجدت).', 'lhfir, lhdid dyal semelles w longrines, 9bel lbeton. L-entreprise katsrrah b lbeton b jouj tswer w lbon dyal lmsna3 ; lmouraqib dyal lmarhala jaya kay9ra had lbon (w natija dyal les éprouvettes mn b3d 28 yom, ila kanet).', '', '', ''],
  ['planéité des enduits, pose du zellige, étanchéité des pièces d\'eau.', 'استواء الطلاء، تركيب الزليج، عزل الغرف المائية.', 'ttsawi dyal lbyad, zellige, l3azl dyal bit lma.', '', '', ''],
  ["pose des menuiseries, étanchéité de la toiture-terrasse (essai à l'eau), réseaux passés dans les réservations de la dalle, essais d'eau et d'électricité.", 'تركيب النجارة، عزل السطح (تجربة بالماء)، الشبكات المارة في فتحات البلاطة، تجارب الماء والكهرباء.', 'lmenuiserie, l3azl dyal sstah (tajriba b lma), rrézo, tajarib dyal lma w ddo.', '', '', ''],
  ['finitions et équipements, avant la réception signée par le client.', 'التشطيبات والتجهيزات، قبل الاستلام الذي يوقّعه الزبون.', 'lfinitions w tajhizat, 9bel lestilam li kaysiniyih lclient.', '', '', ''],
  ["aciers, coffrage, épaisseur et réservations des réseaux (gaines, évacuations) avant le coulage : les réseaux se prévoient ici, pas après. L'étanchéité de la toiture se pose plus tard, à l'étape « Menuiseries et réseaux » : contrôlée sur place si cette étape a une visite, sinon à la visite avant réception, avec un essai à l’eau : elle est toujours vue par un contrôleur.", 'الحديد والقالب والسُّمك وفتحات الشبكات (الأنابيب، الصرف) قبل صب الخرسانة: الشبكات تُهيَّأ هنا لا بعد ذلك. عزل السطح يُركَّب لاحقاً في مرحلة « النجارة والشبكات »: يُراقَب في عين المكان إن كانت لهذه المرحلة زيارة، وإلا ففي الزيارة قبل الاستلام مع تجربة بالماء: يراه مراقب دائماً.', 'lhdid, lcoffrage, ttekhana w rrézo 9bel lbeton. L3azl dyal sstah kaytdar mn b3d; dima kaychoufo mouraqib, b tajriba b lma.', '', '', ''],
  ["10 chantiers de maison individuelle ou d'extension, dans les villes où une agence de contrôle partenaire passe (voir la liste des agences). Premier inscrit, premier servi.", '10 أوراش لمنازل فردية أو توسعات، في المدن التي تمر بها وكالة مراقبة شريكة (انظر لائحة الوكالات). الأسبقية لمن يسجل أولاً.', '10 chantiers dyal dyour wla tawsi3, f lmdoun fin kayna wkala chrika. Li sejjel lwel howa lwel.', '', '', ''],
  ["Le même forfait que tout le monde ; en plus, un conseiller qui vous appelle à chaque étape et un compte rendu mensuel. Rien n'est offert en échange d'un avis.", 'نفس الباقة للجميع؛ إضافة إلى مستشار يتصل بك في كل مرحلة وتقرير شهري. لا شيء يُمنح مقابل رأي.', 'Nefs forfait l kolchi; zid 3lih mustachar kay3iyet lik f kol marhala w taqrir kol chhar. Walo bach tkteb ra2y.', '', '', ''],
  ["À la clôture, le rapport du chantier, si le client l'accepte, sans nom ni adresse ; et son avis, tel qu'il l'écrit, même négatif. L'entreprise peut y répondre.", 'عند الإغلاق، تقرير الورش إن قبل الزبون، بدون اسم ولا عنوان؛ ورأيه كما كتبه، حتى لو كان سلبياً. يمكن للمقاولة الرد عليه.', 'F lkhr, taqrir dyal chantier ila bgha lclient, bla smiya wla 3onwan; w ra2yo kif ktbo. L-entreprise t9der tjaweb.', '', '', ''],
  ["Un avis écrit par TEEQA, acheté, ou recopié d'un autre site. Une note ou un classement des entreprises.", 'رأي تكتبه TEEQA أو يُشترى أو يُنسخ من موقع آخر. تنقيط أو ترتيب للمقاولات.', 'Ra2y ktbatou TEEQA, wla techra, wla tnsekh. Nu9ta wla tartib dyal charikat.', '', '', ''],
  ["Un chantier clôturé (Villa Les Orangers, Berkane : 7 étapes, 7 visites, réception sans réserve), son rapport et l'avis de sa cliente publiés avec son accord ; les autres en cours ou en signature.", 'ورش مُغلق (فيلا البرتقال، بركان: 7 مراحل، 7 زيارات، استلام بدون تحفظ)، تقريره ورأي صاحبته منشوران بموافقتها؛ والباقي قيد الإنجاز أو التوقيع.', 'Chantier salina (Villa Les Orangers, Berkane: 7 marahil, 7 ziyarat), taqrir dyalo w ra2y moulato b mwaf9tha; lbaqi mazal.', '', '', ''],
  ['Nador · Oriental', 'الناظور · الجهة الشرقية', 'Nador · Ccher9', '', '', ''],
  ['Désaccord', 'خلاف', 'Khilaf', '', '', ''],
];
// Morceaux à remplacer à l'intérieur d'un texte (« Étape 2 sur 6 · … », titres d'étape, états).
const PATTERNS = [
  // Vague 25 (jury n° 22 à 24) : lignes d'état restées en français en arabe, darija et tarifit.
  [/^Échéance de la tranche dépassée de (\d+) jours?$/, ['تجاوز أجل الشطر بـ $1 يوم', 'Fat l-ajal dyal tranche b $1 iyam', 'Izri l-ajal n tranche s $1 n wussan', 'Iεedda wakud n tranche s $1 n wussan', 'Izri l-ajal n tranche s $1 n wussan']],
  [/^Désaccord du (.+) retiré par son auteur$/, ['الخلاف بتاريخ $1 سحبه صاحبه', 'Lkhilaf dyal $1 hiydo moulah', 'Amennuɣ n $1 yekkes-t bab-ns', 'Amennuɣ n $1 yekkes-it bab-nnes', 'Amennuɣ n $1 yekkes-t bab-ns']],
  [/^Situation n° (\d+) · Versement partiel sur la tranche (\d+) · dalle et toiture-terrasse : (.+)$/, ['الوضعية رقم $1 · دفع جزئي على الشطر $2 · البلاطة والسطح: $3', 'Situation raqm $1 · khlas jouz2i 3la tranche $2 · dalle w sth: $3', '', '', '']],
  // Vague 23 : date estimée du prochain paiement, étape de la tranche, phrase courte de l'entreprise.
  [/^À payer vers le (.+)$/, ['للدفع حوالي $1', 'Khlas ta9riban nhar $1', '', '', '']],
  [/^\(estimation d'après la visite (?:du|prévue le) (.+)\)\.$/, ['(تقدير حسب زيارة $1).', '(Ta9dir 3la hsab ziyara dyal $1).', '', '', '']],
  [/^\(estimation d'après une visite au plus tard le (.+)\)\.$/, ['(تقدير حسب زيارة في أجل أقصاه $1).', '(Ta9dir 3la hsab ziyara 9bel $1).', '', '', '']],
  [/^\(estimation d'après (un coulage aujourd'hui|aujourd'hui)\)\.$/, ['(تقدير حسب اليوم).', '(Ta9dir mn lyoum).', '', '', '']],
  [/^(?:Date estimée|Estimation) d'après (.+)\. (?:Ce qui manque|Manque) : (.+)\.$/, ['تاريخ تقديري. ما ينقص: $2.', 'Tarikh ta9diri. Chno na9es : $2.', '', '', '']],
  [/^\(estimation\)\.$/, ['(تقدير).', '(ta9dir).', '', '', '']],
  [/^vers le (.+) \(estimation\)$/, ['حوالي $1 (تقدير)', 'ta9riban $1 (ta9dir)', '', '', '']],
  [/^\(étape (\d+) : (.+)\)$/, ['(المرحلة $1)', '(lmarhala $1)', '', '', '']],
  [/^(.+) paie$/, ['$1 يدفع', '$1 kaykhlless', '', '', '']],
  [/^vers le (.+)$/, ['حوالي $1', 'ta9riban $1', '', '', '']],
  [/^(Date estimée, fixée au moment voulu\. )?(?:Ce qui manque|Manque) : (la visite du contrôleur, puis le coulage|la visite du contrôleur|le coulage à déclarer|l'étape doit commencer|le client doit consulter votre déclaration)\.$/, ['تاريخ تقديري. ما ينقص: $2.', 'Tarikh ta9diri. Chno na9es : $2.', '', '', '']],
  [/^Lien d'invitation copié pour (.+) le (.+) : rien n'est parti, collez-le dans un message\.$/, ['نُسخ رابط الدعوة لـ $1 يوم $2: لم يُرسل شيء بعد، ألصقه في رسالة.', 'Tnsakh lien dyal la3rada l $1 nhar $2 : mazal ma tsifet walou, lsseqo f message.', '', '', '']],
  // Vague 23 (langues : français restant en arabe) : avis replié, contact direct dans les échanges.
  [/^Avis du contrôleur · (Validé|avec réserves|Refusé) · « (.+) »$/, ['رأي المراقب · $1 · « $2 »', 'Ra2y lmouraqib · $1 · « $2 »', '', '', '']],
  [/^Avis du contrôleur · (Validé|avec réserves|Refusé)$/, ['رأي المراقب · $1', 'Ra2y lmouraqib · $1', '', '', '']],
  [/^Parler à (.+) \(un appel ne laisse pas de trace : écrivez ici ce qui est décidé\)$/, ['تحدث مع $1 (المكالمة لا تترك أثرًا: اكتب هنا ما تم الاتفاق عليه)', 'Hder m3a $1 (l-appel ma kaykhllich atar : kteb hna chno ttafa9tou)', '', '', '']],
  [/^Invitation (envoyée|partagée par WhatsApp|partagée par SMS|partagée par lien) à (.+) le (.+) : elle doit l'accepter, puis accepter la convention\.$/, ['أُرسلت الدعوة إلى $2 يوم $3: عليها أن تقبلها، ثم تقبل الاتفاقية.', 'Tsiftat la3rada l $2 nhar $3 : khassha tqbelha, mn b3d tqbel l-convention.']],
  [/^Relancé le (.+)\.$/, ['تم التذكير يوم $1.', 'Tfakkarna nhar $1.']],
  [/^(\d+) photos? · (\d+) événements?$/, ['$1 صور · $2 أحداث', '$1 tswer · $2 ahdat', '', '', '']],
  [/^(.+) · prise et reçue à (.+)$/, ['$1 · التُقطت ووصلت على $2', '$1 · tchedat w wslat m3a $2', '', '', '']],

  // Vague 20 (doigt : Leila) : lignes composées (date ou nombre au milieu) traduites en entier, sans mélange des deux sens d'écriture.
  [/^Fin prévue : (.+)$/, ['النهاية المتوقعة: $1', 'Nihaya mtwaq3a: $1', '', '', '']],
  [/^(\d+)\/(\d+) closes?$/, ['$1/$2 مغلقة', '$1/$2 salin', '', '', '']],
  [/^Visite au plus tard le (.+?) : « (.+) »$/, ['الزيارة في أجل أقصاه $1: « $2 »', 'Ziyara f a9sa ajal $1: « $2 »', '', '', '']],
  [/^Généré le (.+)$/, ['أُنشئ في $1', 'Tsawb nhar $1', '', '', '']],
  [/^Non lus · (\d+)$/, ['غير مقروءة · $1', 'Ma tqrawch · $1', '', '', '']],
  [/^Avant la réception : (\d+) étapes? pas encore closes?$/, ['قبل التسلم: $1 مراحل لم تُغلق بعد', '9bel tasallom: $1 marahil mazal ma salaw', '', '', '']],
  [/^(.+) indique que le ferraillage de « (.+) » est prêt\. TEEQA a demandé une visite avant coulage\.$/, ['$1 يُعلن أن تسليح « $2 » جاهز. طلبت TEEQA زيارة قبل صب الخرسانة.', '$1 kaygoul belli lhdid dyal « $2 » wajed. TEEQA tlbat ziyara 9bel lbeton.', '', '', '']],
  [/^Le contrôleur a signé un avis Validé pour « (.+) »\.$/, ['وقّع المراقب رأياً «مصادق عليه» على « $1 ».', 'Lmouraqib sna ra2y « Mqboul » 3la « $1 ».', '', '', '']],
  // Vague 22 (doigt : Hassan) : ligne « Prochain paiement » de la carte du chantier, morceau par morceau.
  [/^Visite au plus tard le ([^«]+)$/, ['الزيارة في أجل أقصاه $1', 'Ziyara f a9sa ajal $1', '', '', '']],
  [/^\(7 jours après (.+)\)\.$/, ['(7 أيام بعد $1).', '(7 iyam mn b3d $1).', '', '', '']],
  [/^Prochain paiement :$/, ['الدفعة القادمة:', 'Lkhlas jay:', '', '', '']],
  [/^Prochain paiement à l'entreprise :$/, ['الدفعة القادمة للمقاولة:', 'Lkhlas jay l charika:', '', '', '']],
  [/^Prochaine tranche :$/, ['الشطر القادم:', 'Tranche jaya:', '', '', '']],
  [/^tranche (\d+)$/, ['الشطر $1', 'tranche $1', '', '', '']],
  [/^rien à payer aujourd['']hui$/, ['لا شيء للدفع اليوم', 'walo tkhlles lyoum', '', '', '']],
  [/^pas encore due$/, ['غير مستحقة بعد', 'mazal ma wjbatch', '', '', '']],
  [/^(à payer|attendue) au plus tard le (.+)$/, ['تُدفع في أجل أقصاه $2', 'tkhless f a9sa ajal $2', '', '', '']],
  [/^échéance dépassée de (\d+) jours?$/, ['تجاوز الأجل بـ $1 يوم', 'fat l-ajal b $1 ayyam', '', '', '']],
  // Vague 24 (doigt : Abdelkader) : la phrase d'argent en gros, en arabe et en darija aussi.
  [/^Payez (.+) à (.+) : en retard de (\d+) jours?$/, ['ادفع $1 لـ $2 : متأخر بـ $3 يوم', 'Khlles $1 l $2 : m3e3tel b $3 iyam', '', '', '']],
  [/^Payez (.+) : en retard de (\d+) jours?$/, ['ادفع $1 : متأخر بـ $2 يوم', 'Khlles $1 : m3e3tel b $2 iyam', '', '', '']],
  [/^Payez (.+) à (.+) avant le (.+)$/, ['ادفع $1 لـ $2 قبل $3', 'Khlles $1 l $2 9bel $3', '', '', '']],
  [/^Payez (.+) avant le (.+)$/, ['ادفع $1 قبل $2', 'Khlles $1 9bel $2', '', '', '']],
  [/^Rien à payer maintenant$/, ['لا شيء للدفع الآن', 'Walo ma tkhlles daba', '', '', '']],
  [/^Ensuite : (.+) à (.+), 7 jours après l'état des lieux signé$/, ['بعد ذلك: $1 لـ $2، 7 أيام بعد توقيع محضر المعاينة', 'Mn b3d: $1 l $2, 7 iyam mn b3d tw9i3 l-mo3ayana', '', '', '']],
  [/^Ensuite : (.+), vers le (.+) \(estimation\)$/, ['بعد ذلك: $1، حوالي $2 (تقدير)', 'Mn b3d: $1, ta9riban $2 (ta9dir)', '', '', '']],   // vague 24 : écran d'étape (la base est dite dans « Maintenant »)
  [/^Ensuite : (.+), vers le (.+) \(estimation (.+)\)$/, ['بعد ذلك: $1، حوالي $2 (تقدير)', 'Mn b3d: $1, ta9riban $2 (ta9dir)', '', '', '']],
  [/^Ensuite : (.+), 7 jours après (.+)$/, ['بعد ذلك: $1، 7 أيام بعد الموافقة', 'Mn b3d: $1, 7 iyam mn b3d lmouwafa9a', '', '', '']],
  [/^(\d[\d\u202f\u00a0  ]*DH) · vers le (.+)$/, ['$1 · حوالي $2', '$1 · ta9riban $2', '', '', '']],   // vague 25 (doigt : Lhoussaine) : la phrase courte de l'entreprise
  [/^Il manque : (.+)$/, ['ينقص: $1', 'Na9es: $1', '', '', '']],
  [/^À payer à (.+), directement, hors de TEEQA$/, ['يُدفع لـ $1 مباشرة، خارج TEEQA', 'Tkhlles l $1 nichan, barra TEEQA', '', '', '']],
  [/^À (.+), hors de TEEQA$/, ['لـ $1، خارج TEEQA', 'L $1, barra TEEQA', '', '', '']],
  [/^Vous recevrez (.+) vers le (.+)$/, ['ستتوصلون بـ $1 حوالي $2', 'Ghadi tw9el b $1 ta9riban $2', '', '', '']],
  [/^Vous recevrez (.+) 7 jours après (.+)$/, ['ستتوصلون بـ $1 بعد 7 أيام من الموافقة', 'Ghadi tw9el b $1 7 iyam mn b3d lmouwafa9a', '', '', '']],
  [/^(.+) doit vous payer (.+) avant le (.+)$/, ['على $1 أن يدفع لكم $2 قبل $3', '$1 khasso ykhllsek $2 9bel $3', '', '', '']],
  [/^(.+) paie (.+) : en retard de (\d+) jours?$/, ['$1 يدفع $2 : متأخر بـ $3 يوم', '$1 khasso ykhlles $2 : m3e3tel b $3 iyam', '', '', '']],
  [/^Prochain paiement à (.+) \(entreprise sortante\) :$/, ['الدفعة القادمة لـ $1 (المقاولة السابقة):', 'Lkhlas jay l $1 (charika l9dima):', '', '', '']],
  [/^Tout écouter, à voix haute$/, ['استمع إلى كل شيء بصوت عالٍ', 'Sme3 kolchi b sout 3ali', '', '', '']],
  [/^Répondre$/, ['الرد', 'Jaweb', '', '', '']],
  [/^Prochain paiement · tranche (\d+)$/, ['الدفعة القادمة · الشطر $1', 'Lkhlas jay · ttranche $1', '', '', '']],
  [/^Tranche (\d+) · quand l'argent arrive$/, ['الشطر $1 · متى يصل المال', 'Tranche $1 · fo9ach ywsel lflous', '', '', '']],
  [/^Rien à payer : (.+)\. À payer (.+)\.$/, ['لا شيء للدفع الآن: $1. يُدفع $2.', 'Walo tkhlles daba: $1. Tkhlles $2.', '', '', '']],
  [/^Pas encore : (.+)\. Vous confirmerez ici sa réception\.$/, ['ليس بعد: $1. ستؤكد هنا استلامه.', 'Mazal: $1. Ghadi tconfirmi hna wsoulo.', '', '', '']],
  [/^(\d[\d  ]*) DH \(≈ (.+)\) · Paiement différé$/, ['$1 درهم (≈ $2) · الدفع مؤجل', '$1 DH (≈ $2) · Lkhlas m2ajjal', '', '', '']],
  [/^À partir de (.+) DH par chantier · (.+) DH avec (\d+) visites d'un contrôleur$/, ['ابتداءً من $1 درهم للورش · $2 درهم مع $3 زيارات لمراقب', 'Mn $1 DH l chantier · $2 DH m3a $3 ziyarat dyal mouraqib', '', '', '']],
  [/^Lecture en cours · (\d+) s$/, ['القراءة جارية · $1 ث', 'Kanqra · $1 s', '', '', '']],
  [/^Étape (\d+) sur (\d+)/, ['المرحلة $1 من $2', 'Lmarhala $1 mn $2', 'Lmarhala $1 zg $2', 'Lmarhala $1 zi $2', 'Lmarhala $1 zg $2']],
  [/^(\d+) étapes? closes? sur (\d+)/, ['\u2067المراحل المغلقة: $1 من $2\u2069', '$1 mrahel salin mn $2', '$1 lmarhalat kmmlnt zg $2', '$1 lmarhalat kemlent zi $2', '$1 lmarhalat kemlent zg $2']],
  [/^(\d+) (?:chantiers?|missions?) en cours · (\d+) archivés?$/, ['$1 قيد الإنجاز · $2 مؤرشف', '$1 khddam · $2 mhfoud', '$1 ar itteggan · $2 ihda', '$1 qa ittegg · $2 yehda', '$1 ar itteggan · $2 ihda']],
  [/^(.+) · prix des travaux$/, ['$1 · ثمن الأشغال', '$1 · tamane lkhdma', '', '', '']],
  [/^(.+) · Étape (\d+)$/, ['$1 · المرحلة $2', '$1 · lmarhala $2', '', '', '']],
  [/^dont (.+) confirmé reçu par l'entreprise ; le reste est indiqué par le client, non vérifié$/, ['منها $1 أكدت المقاولة التوصل بها؛ والباقي صرّح به الزبون دون تحقق', 'mnha $1 kkdat charika wsoulha ; lbaqi galo lclient, ma mt7aqqaqch', '', '', '']],
  [/^Source : (?!Devis )(.+)$/, ['المصدر: $1', 'Lmasdar : $1', '', '', '']],
  [/^Montants confirmés par (.+) le (.+)$/, ['مبالغ أكدتها $1 يوم $2', 'Lmabaligh kkdatha $1 nhar $2', '', '', '']],
  [/^Pour chaque tranche reçue, une situation de travaux toute prête.*$/, ['لكل شطر تم التوصل به، وضعية أشغال جاهزة (TTC، HT، TVA 20 %) لنقلها إلى فاتورتكم؛ والتصدير يعطي كل الأشطر في جدول.', 'L kol tranche wslat, situation dyal lkhdma wajda (TTC, HT, TVA 20 %) tnqlha l lfactura dyalek ; lexport kay3tik ga3 ttranchat f tableau.', '', '', '']],
  [/^Compte n° (.+), ouvert le (.+) ·$/, ['الحساب رقم $1، فُتح يوم $2 ·', 'L7ssab raqm $1, t7ell nhar $2 ·', '', '', '']],
  [/^(.+) sur le compte$/, ['$1 في الحساب', '$1 f l7ssab', '', '', '']],
  [/^: argent sur le compte de la banque$/, [': المال في حساب البنك', ': lflous f l7ssab dyal lbanka', '', '', '']],
  [/^rien sur le compte pour l'instant$/, ['لا شيء في الحساب حاليًا', 'walo f l7ssab daba', '', '', '']],
  [/^· payée \(indiqué\), reçu à confirmer · réf\. (.+) · payée par$/, ['· مدفوعة (مصرّح بها)، التوصل في انتظار التأكيد · مرجع $1 · دفعها', '· mkhlssa (mgoul), lwsoul khass ytakked · réf. $1 · khllsha', '', '', '']],
  [/^· payée \(indiqué\), reçu à confirmer · réf\. (.+)$/, ['· مدفوعة (مصرّح بها)، التوصل في انتظار التأكيد · مرجع $1', '· mkhlssa (mgoul), lwsoul khass ytakked · réf. $1', '', '', '']],
  [/^· payée \(indiqué\), reçu à confirmer$/, ['· مدفوعة (مصرّح بها)، التوصل في انتظار التأكيد', '· mkhlssa (mgoul), lwsoul khass ytakked', '', '', '']],
  [/^\(échéance du (.+)\) · reste dû (.+) sur (.+), (.+) reçus ·$/, ['(الأجل: $1) · الباقي $2 من $3، وتم التوصل بـ $4 ·', '(lajal : $1) · lbaqi $2 mn $3, wslo $4 ·', '', '', '']],
  [/^au client de payer, ou de dire pourquoi dans les échanges$/, ['على الزبون أن يدفع أو أن يشرح السبب في المراسلات', '3la lclient ykhlles wla ygoul 3lach f lmorasalat', '', '', '']],
  [/^dont (.+) de versement partiel$/, ['منها $1 دفعة جزئية', 'mnha $1 khlas b ljouz2', '', '', '']],
  [/^versé par le client à (.+), pas encore à l'entreprise$/, ['دفعه الزبون إلى $1، ولم يصل بعد إلى المقاولة', 'khllso lclient l $1, ma wslch mazal l charika', '', '', '']],
  [/^Séquestre · (.+)$/, ['حساب الضمان · $1', 'L7ssab dyal ddaman · $1', '', '', '']],
  [/^Versé en partie : (.+) sur (.+) · reste (.+)$/, ['دُفع جزئيًا: $1 من $2 · الباقي $3', 'Tkhlles b ljouz2 : $1 mn $2 · lbaqi $3', '', '', '']],
  [/^Versement partiel : (.+) · (.+) · reçu confirmé$/, ['دفعة جزئية: $1 · $2 · تم تأكيد التوصل', 'Khlas b ljouz2 : $1 · $2 · lwsoul mt2akked', '', '', '']],
  [/^Sur le compte de (.+) depuis le (.+) · argent sur le compte de la banque$/, ['في حساب $1 منذ $2 · المال في حساب البنك', 'F l7ssab dyal $1 mn $2 · lflous f l7ssab dyal lbanka', '', '', '']],
  [/^Compte n° (.+), ouvert le (.+) · (.+) sur le compte : argent sur le compte de la banque$/, ['الحساب رقم $1، فُتح يوم $2 · $3 في الحساب: المال في حساب البنك', 'L7ssab raqm $1, t7ell nhar $2 · $3 f l7ssab : lflous f l7ssab dyal lbanka', '', '', '']],
  [/^Source : Devis (.+), signé le (.+)$/, ['المصدر: عرض أثمان $1، موقع يوم $2', 'Lmasdar : devis $1, msni nhar $2', '', '', '']],
  [/^Échéance dépassée de (\d+) jours? \(échéance du (.+)\) · reste dû (.+) sur (.+), (.+) reçus · au client de payer, ou de dire pourquoi dans les échanges$/, ['تجاوز الأجل بـ $1 يوم (الأجل: $2) · الباقي $3 من $4، وتم التوصل بـ $5 · على الزبون أن يدفع أو أن يشرح السبب في المراسلات', 'Fat lajal b $1 yom (lajal : $2) · lbaqi $3 mn $4, wslo $5 · 3la lclient ykhlles wla ygoul 3lach f lmorasalat', '', '', '']],
  [/^Échéance dépassée de (\d+) jours?$/, ['تجاوز الأجل بـ $1 يوم', 'Fat lajal b $1 yom', '', '', '']],
  [/^En retard · Visite pas encore acceptée$/, ['متأخر · الزيارة لم تُقبل بعد', 'M3ttal · ziyara mazal ma tqeblat', '', '', '']],
  [/^(\d+) avenants? · travaux en plus$/, ['$1 ملحق · أشغال إضافية', '$1 avenant · khdma zayda', '', '', '']],
  [/^Avant la réception : (\d+) étapes? pas encore closes? · (\d+) avenants? sans réponse$/, ['قبل التسلّم: $1 مراحل لم تُغلق بعد · $2 ملحق دون جواب', 'Qbel tteslim : $1 marahil mazal ma tsddo · $2 avenant bla jwab', '', '', '']],
  [/^Paiement indiqué : « (.+) »$/, ['أداء مصرّح به: « $1 »', 'Khlas mgoul : « $1 »', '', '', '']],
  [/^Situation n° (\d+) · Versement partiel sur la tranche (\d+) · (.+) : (.+) TTC, soit (.+) HT et (.+) de TVA · reçue le (.+)$/, ['الوضعية رقم $1 · دفعة جزئية من الشطر $2 · $3: $4 TTC، أي $5 HT و$6 ضريبة على القيمة المضافة · توصل بها يوم $7', 'Situation raqm $1 · khlas b ljouz2 mn ttranche $2 · $3 : $4 TTC, ya3ni $5 HT w $6 TVA · wslat nhar $7', '', '', '']],
  [/^Situation n° (\d+) · Tranche (\d+) · (.+) : (.+) TTC, soit (.+) HT et (.+) de TVA · reçue le (.+)$/, ['الوضعية رقم $1 · الشطر $2 · $3: $4 TTC، أي $5 HT و$6 ضريبة على القيمة المضافة · توصل بها يوم $7', 'Situation raqm $1 · Ttranche $2 · $3 : $4 TTC, ya3ni $5 HT w $6 TVA · wslat nhar $7', '', '', '']],
  [/^(.+) · Oriental$/, ['$1 · الجهة الشرقية', '$1 · ljiha charqiya', '', '', '']],
  [/^Un contrôleur a accepté la visite pour « (.+) »\. Passage avant le (.+) ; le créneau vous sera indiqué\.$/, ['قبل مراقب الزيارة الخاصة بـ « $1 ». المرور قبل $2؛ وسيُحدَّد لكم الموعد.', 'Mouraqib qbel ziyara dyal « $1 ». Ghadi ydouz qbel $2 ; lw9t ghadi ytgal lik.', '', '', '']],
  [/^Situation n° (\d+) · (.+) : (.+) TTC, soit (.+) HT et (.+) de TVA · reçue le (.+)$/, ['الوضعية رقم $1 · $2: $3 TTC، أي $4 HT و$5 ضريبة على القيمة المضافة · توصل بها يوم $6', 'Situation raqm $1 · $2 : $3 TTC, ya3ni $4 HT w $5 TVA · wslat nhar $6', '', '', '']],
  [/^Total des situations : (.+) TTC$/, ['مجموع الوضعيات: $1 TTC', 'Majmou3 situations : $1 TTC', '', '', '']],
  [/^, c'est le « confirmé reçu » ci-dessus\.$/, ['، وهو « المؤكد التوصل به » أعلاه.', ', howa « lmt2akked lwsoul » lfo9.', '', '', '']],
  [/^(.+) (\d[\d  ]* DH) \(déclaré, non vérifié par TEEQA\)\.$/, ['$1 $2 (مصرّح به، لم تتحقق منه TEEQA).', '$1 $2 (galha, ma t7aqqqatch mnha TEEQA).', '', '', '']],
  [/^Saisi par (.+) d'après le devis, confirmé par (.+)\.$/, ['أدخله $1 حسب عرض الأثمان، وأكدته $2.', 'Dkhlo $1 mn devis, w kkdato $2.', '', '', '']],
  [/^Ces montants viennent du devis.*$/, ['هذه المبالغ مأخوذة من عرض الأثمان: تساعد على تتبع ما يدفعه الزبون للمقاولة. لا تمسك TEEQA أبدًا أموال الأشغال: الزبون يدفع للمقاولة مباشرة.', 'Had lmabaligh jayin mn devis : kay3awnou tchouf chno kaykhlles lclient l charika. TEEQA 3omrha ma katchd flouss lkhdma : lclient kaykhlles charika nichan.', '', '', '']],
  [/^Acceptée le (.+) · passage au plus tard le (.+)$/, ['قُبلت يوم $1 · المرور في أجل أقصاه $2', 'Tqeblat nhar $1 · lmrour qbel $2', '', '', '']],
  [/^Vocal · (.+) · transcription$/, ['رسالة صوتية · $1 · نص مكتوب', 'Vocal · $1 · ktaba', '', '', '']],
  [/^(.+) · chef de chantier$/, ['$1 · رئيس الورش', '$1 · chef dyal chantier', '', '', '']],
  [/^(.+) · ouvrier$/, ['$1 · عامل', '$1 · khddam', '', '', '']],
  [/^Activité : (\d+) nouvelles? non lues?$/, ['النشاط: $1 خبر غير مقروء', 'Jdid : $1 khbar ma tqrach', 'Imaynuten : $1 n lkhbar ur ittyaghran', 'Ijdiden : $1 n lkhbar ur yettwaghren', 'Imaynuten : $1 n lkhbar ur ittyaghran']],
  [/^Indiqué le (.+) · hors TEEQA, non vérifié$/, ['صُرّح به يوم $1 · خارج TEEQA، غير متحقق منه', 'Galoh nhar $1 · bra TEEQA, ma mt7aqqaqch', 'Nnan t ass n $1 · bra TEEQA, ur ityuskar', 'Nnan t ass n $1 · bra TEEQA, ur yettwasekker', 'Nnan t ass n $1 · bra TEEQA, ur ityuskar']],
  [/^Depuis le (.+) · paiement hors TEEQA$/, ['منذ $1 · أداء خارج TEEQA', 'Mn $1 · lkhlas bra TEEQA', 'Zg $1 · lkhlas bra TEEQA', 'Zi $1 · lkhlas bra TEEQA', 'Zg $1 · lkhlas bra TEEQA']],
  [/^(.+) a accepté la convention du chantier « (.+) »\. Il reste votre acceptation\.$/, ['$1 قبل اتفاقية ورش « $2 ». بقي قبولكم.', '$1 qbel la convention dyal « $2 ». Bqat ghir lmwafaqa dyalkom.', '$1 iqbl la convention n « $2 ». Iqqim-d uqbal nnun.', '$1 yeqbel la convention n « $2 ». Yeqqim-d uqbal nwen.', '$1 iqbl la convention n « $2 ». Iqqim-d uqbal nnun.']],
  [/^(\d+) chantiers? en cours/, ['$1 ورش قيد الإنجاز', '$1 chantier khddam', '$1 achanti ar itteggan', '$1 achanti qa ittegg', '$1 achanti ar itteggan']],
  [/^(\d+) missions? en cours/, ['$1 مهمة قيد الإنجاز', '$1 mouhimma khddama', '$1 tawuri ar ttegg', '$1 tawuri qa ttegg', '$1 tawuri ar ttegg']],
  [/^Échanges \((\d+)\)$/, ['المحادثات ($1)', 'Lmohadatat ($1)', 'Imsawaln ($1)', 'Imsawalen ($1)', 'Imsawaln ($1)']],
  [/^(\d+) tranches? reçues?$/, ['\u2067الأشطر المستلمة: $1\u2069', '$1 tranche twslat', '$1 ttranche ilkmnt', '$1 ttranche d-yewwden', '$1 ttranche ilkmnt']],
  [/^(\d+) à confirmer$/, ['\u2067في انتظار التأكيد: $1\u2069', '$1 tsenna ttakkid', '$1 ar tsenna asentem', '$1 tettraju asentem', '$1 ar tsenna asentem']],
  [/^Tranche (\d+)/, ['الشطر $1', 'Tranche $1', 'Tranche $1', 'Tranche $1', 'Tranche $1']],
  [/^Photo demandée : (.+)$/, ['الصورة المطلوبة: $1', 'Tswira li tlebti: $1', 'Tswira lli tsutert: $1', 'Tswira i tessutred: $1', 'Tswira lli tsutert: $1']],
  // Vague 17 : notifications et étiquettes de photos (arabe et darija seulement).
  [/^TEEQA a missionné une agence de contrôle de la zone pour « (.+) »\.?$/, ['كلفت TEEQA وكالة مراقبة من المنطقة بورش « $1 ».', 'TEEQA 3ayyat 3la wkala dyal lmouraqaba mn lmantiqa l « $1 ».']],
  [/^Convention acceptée par le client et l'entreprise : les travaux de « (.+) » peuvent débuter\.?$/, ['قبل الزبون والمقاولة الاتفاقية: يمكن أن تبدأ أشغال « $1 ».', 'Lclient w charika qeblo l-ittifaqiya: lkhdma dyal « $1 » t9der tbda.']],
  // Vague 18 (jury, n° 13) : derniers restes de français en arabe et en darija (relance, « Vu par », version d'une correction, justificatif).
  [/^Relance de l'entreprise : paiement non reçu, (\d+) jours? après l'échéance \(hors TEEQA\)$/, ['تذكير من المقاولة: لم يصل الأداء، $1 يوم بعد الأجل (خارج TEEQA)', 'Tadkir mn charika: lkhlas ma wslch, $1 nhar mn ba3d l-ajal (bra TEEQA)']],
  [/^Vu par (.+)$/, ['شاهده: $1', 'Chafo: $1']],
  [/^Photo (contrôleur|entreprise|client) du (.+), correction v(\d+)$/, ['صورة ($1) بتاريخ $2، التصحيح رقم $3', 'Tswira ($1), $2, tasli7 raqm $3']],
  [/^« J'ai payé cette tranche » \(paiement hors TEEQA, non vérifié\), justificatif photo joint\.?$/, ['« دفعت هذه الدفعة » (أداء خارج TEEQA، غير متحقق منه)، مع صورة الإثبات', '« Khllst had trench » (lkhlas bra TEEQA, ma mt7aqqaqch), m3a tswira dyal l-ithbat']],
  [/^Photo contrôleur du (.+)$/, ['صورة المراقب بتاريخ $1', 'Tswira dyal lmouraqib, $1']],
  [/^Photo entreprise du (.+)$/, ['صورة المقاولة بتاريخ $1', 'Tswira dyal charika, $1']],
  [/^Désaccord retiré par son auteur : « (.+) »\.?$/, ['سحب صاحبه الاعتراض: « $1 ».', 'Mol l-i3tirad sahbo: « $1 ».']],
  [/^Créneau de visite choisi : (.+)$/, ['تم اختيار موعد الزيارة: $1', 'Lmaw3id dyal viziti tkhtar: $1']],
  [/^Visite réservée d'avance : (.+)$/, ['زيارة محجوزة مسبقا: $1', 'Viziti m7jouza mn qbel: $1']],
  [/^Coulage retenu (.+) par le désaccord du client : délais de l'entreprise décalés d'autant\.?$/, ['تأخر صب الخرسانة $1 بسبب اعتراض الزبون: تُؤجَّل آجال المقاولة بنفس المدة.', 'Lbeton t3attal $1 b sbab l-i3tirad dyal lclient: lmodda dyal charika tzadt b nfs lwaqt.']],
  [/^« J'ai payé cette tranche » \(paiement hors TEEQA, non vérifié\)(, justificatif photo joint)?\.?$/, ['« دفعت هذه الدفعة » (أداء خارج TEEQA، غير متحقق منه)$1', '« Khllst had trench » (lkhlas bra TEEQA, ma mt7aqqaqch)$1']],
  [/^C'est urgent · ([^«]+)$/, ['مستعجل · $1', 'Mosta3jel · $1']],
  [/^C'est urgent · (.+) sur « (.+) » : « (.+) »$/, ['مستعجل · $1 بخصوص « $2 »: « $3 »', 'Mosta3jel · $1 3la « $2 »: « $3 »']],
  [/^Traduction corrigée par (.+) le (.+) · indicative, sans valeur légale$/, ['ترجمة صححها $1 يوم $2 · إرشادية، بلا قيمة قانونية', 'Tarjama s777ha $1 nhar $2 · ghir bach tfhem, bla qima qanouniya']],
  [/^(\d+) reçues? en partie$/, ['\u2067مستلمة جزئيا: $1\u2069', '$1 twslat chwiya']],
  [/^(\d+) photos?$/, ['$1 صور', '$1 tswira', '$1 tswira', '$1 tswira', '$1 tswira']],
  [/^(.+), client titulaire\. Si un proche co-décideur \((.+)\) donne une consigne qui contredit la sienne, suivez celle de (.+)\.$/, ['$1، الزبون صاحب الورش. إذا أعطى قريب مشارك في القرار ($2) تعليمة تخالف تعليمته، اتبعوا تعليمة $3.', '$1, lclient moul chantier. Ila chi wahed mn l3a2ila ($2) 3ta consigne katkhalef dyalo, tab3o dyal $3.']],
  [/^Envoyez une photo de (.+)$/, ['أرسل صورة لـ$1', 'Sift tswira dyal $1', 'Azn-d tswira n $1', 'Sifed-d tswira n $1', 'Azn-d tswira n $1']],
  // Vague 22 (jury n° 15, clients Maroc) : restes de français dans l'étape en arabe et en darija.
  [/^Désaccord du (.+) retiré par son auteur le (.+?)\.? Il ne retient plus le chantier\.$/, ['خلاف يوم $1 سحبه صاحبه يوم $2. لم يعد يوقف الورش.', 'Lkhilaf dyal $1 hiydo mol dyalo nhar $2. Mab9ach kaywe99ef lchantier.', '', '', '']],
  [/^Désaccord du (.+) clos par un accord des deux parties le (.+?)\.? Il ne retient plus le chantier\.$/, ['خلاف يوم $1 أُغلق باتفاق الطرفين يوم $2. لم يعد يوقف الورش.', 'Lkhilaf dyal $1 tsedd b ittifa9 bjouj nhar $2. Mab9ach kaywe99ef lchantier.', '', '', '']],
  [/^à l'instant$/, ['الآن', 'Daba', 'Ɣilad', 'Ɣilad', 'Ɣilad']],
  [/^Par virement$/, ['بتحويل بنكي', 'B virement', '', '', '']],
  [/^Payée par$/, ['دفعها', 'Khllsha', '', '', '']],
  [/^Photo (\d+) (contrôleur|entreprise) du (.+)$/, ['الصورة $1 · $3', 'Tswira $1 · $3', '', '', '']],
  // Vague 22 (doigt : Hassan) : le rapport lu en arabe (étapes, dates, photos, avis, paiement), sans mélange des deux sens d'écriture.
  [/^(\d+)\. (Terrassement et fondations|Gros œuvre : murs et poteaux|Dalle et toiture-terrasse|Menuiseries et réseaux|Enduits et zellige|Finitions, contrôle avant réception)$/, ['$1. $2', '$1. $2', '', '', '']],
  [/^Début déclaré (.+) · Ferraillage prêt (.+) · coulage déclaré (.+) · (\d+) photos?(?: et (\d+) avis signés?)?$/, ['بداية مُصرَّح بها $1 · الحديد جاهز $2 · صب الخرسانة $3 · $4 صور', 'Bdaya $1 · lhdid wajd $2 · lbeton $3 · $4 tswer', '', '', '']],
  [/^Début déclaré (.+) · Fin déclarée (.+) · (\d+) photos?(?: et (\d+) avis signés?)?$/, ['بداية مُصرَّح بها $1 · نهاية مُصرَّح بها $2 · $3 صور', 'Bdaya $1 · nihaya $2 · $3 tswer', '', '', '']],
  [/^(\d+) points? sur (\d+) conformes? ou sans objet$/, ['$1 من $2 نقط مطابقة أو غير معنية', '$1 mn $2 noqat mtab9in', '', '', '']],
  [/^Photos du contrôleur : (\d+), une par point clé$/, ['صور المراقب: $1، صورة لكل نقطة أساسية', 'Tswer dyal lmouraqib: $1, wahda l kol no9ta asasiya', '', '', '']],
  [/^Point clé : (.+) · (.+)$/, ['نقطة أساسية · $2', 'No9ta asasiya · $2', '', '', '']],
  [/^« J'ai payé cette tranche » indiqué par le client \(non vérifié\) · (.+) · reçu indiqué par l'entreprise le (.+)$/, ['« دفعت هذا الشطر »، حسب الزبون (غير متحقق منه) · $1 · المقاولة أكدت التوصل يوم $2', '« Khllst had ttranche » 3la hsab lclient (ma mt7aqqa9ch) · $1 · charika akkdat l woussoul nhar $2', '', '', '']],
  [/^(\d+) visites prévues sur (\d+) étapes$/, ['$1 زيارات مبرمجة على $2 مراحل', '$1 zyarat mbarmja 3la $2 marahil', '', '', '']],
  [/^Acceptée par le client le (.+) et par l'entreprise le (.+)$/, ['قبلها الزبون يوم $1 والمقاولة يوم $2', 'Qbelha lclient nhar $1 w charika nhar $2', '', '', '']],
  [/^(.+) \(convention ; se décale d['']autant si une visite dépasse son délai, ou par avenant\)$/, ['$1 (حسب الاتفاقية؛ يتأخر بقدر تأخر زيارة، أو بملحق)', '$1 (3la hsab l-convention; kayt2akhar ila t2akhrat zyara, wla b mol7a9)', '', '', '']],
  [/^Partager le rapport$/, ['مشاركة التقرير', 'Partagi rapport', '', '', '']],
  [/^Exporter en PDF$/, ['تصدير PDF', 'Sauvegardi PDF', '', '', '']],
  [/^Imprimer ou enregistrer le rapport$/, ['طباعة التقرير أو حفظه', 'Tba3 wla sauvegardi rapport', '', '', '']],
  [/^Lien en lecture seule pour la famille, la banque, le notaire · vous le retirez quand vous voulez\.?$/, ['رابط للاطلاع فقط للعائلة أو البنك أو الموثق · تسحبه متى شئت.', 'Lien ghir l9raya l l3a2ila, lbanka, nnotaire · t9der t7ydo f ay w9t.', '', '', '']],
  // Vague 21 (doigt : Samira) : phrases de l'étape avec une date ou un nom au milieu.
  [/^· (l'étape n'a pas commencé|coulage pas encore déclaré|avis du contrôleur attendu|déclaration pas encore consultée)$/, ['· $1', '· $1', '', '', '']],
  [/^Pas encore : (l'étape n'a pas commencé|coulage pas encore déclaré|avis du contrôleur attendu|déclaration pas encore consultée)\.$/, ['ليس بعد: $1.', 'Mazal: $1.', '', '', '']],
  [/^Date :$/, ['التاريخ:', 'Tarikh:', '', '', '']],
  [/^7 jours après (.+), rappel 2 jours avant\.$/, ['7 أيام بعد $1، مع تذكير قبلها بيومين.', '7 iyam mn b3d $1, tfakir 2 iyam 9bel.', '', '', '']],   // vague 21 (doigt : Samira)
  [/^7 jours après (.+)\.$/, ['7 أيام بعد $1.', '7 iyam mn b3d $1.', '', '', '']],
  [/^: 7 jours après (.+), rappel 2 jours avant\.$/, [': 7 أيام بعد $1، مع تذكير قبلها بيومين.', ': 7 iyam mn b3d $1, tfakir 2 iyam 9bel.', '', '', '']],
  [/^: 7 jours après (.+)\.$/, [': 7 أيام بعد $1.', ': 7 iyam mn b3d $1.', '', '', '']],
  [/^: (.+)\. Elle sera fixée à 7 jours après (.+)\.$/, [': $1. سيُحدَّد بعد 7 أيام من $2.', ': $1. Ghadi yt7edded 7 iyam mn b3d $2.', '', '', '']],
  [/^Virement depuis l'étranger : 2 à 4 jours ouvrés\. Envoyez-le avant le (.+)\.$/, ['تحويل من الخارج: من يومين إلى 4 أيام عمل. أرسله قبل $1.', 'Tahwil mn lkharij: 2 ta 4 iyam. Sifto 9bel $1.', '', '', '']],
  [/^Date limite : (.+)$/, ['آخر أجل: $1', 'Akhir ajal: $1', '', '', '']],
  [/^Indiqué par (.+) le (.+)\. Le béton n'est pas coulé : le contrôleur voit d'abord les aciers, puis l'entreprise coule et le déclare\. L'étape ne sera finie qu'à ce moment-là\.$/, ['صرّحت به $1 يوم $2. الخرسانة لم تُصب بعد: يرى المراقب الحديد أولاً، ثم تصب المقاولة الخرسانة وتصرّح بذلك. لن تنتهي المرحلة إلا حينها.', 'Galha $1 nhar $2. Lbeton mazal ma tsabb: lmouraqib kaychouf lhdid lwel, mn b3d l-entreprise katsebb w katsrrah. Lmarhala ma katsala ghir tamma.', '', '', '']],
  [/^Demandée le (.+) · passage au plus tard le (.+)$/, ['طُلبت يوم $1 · الزيارة في أجل أقصاه $2', 'Ttelbat nhar $1 · ziyara f a9sa ajal $2', '', '', '']],
  [/^· Agrément du ministère de l'Équipement n° (.+)$/, ['· اعتماد وزارة التجهيز رقم $1', '· i3timad dyal wizarat tajhiz ra9m $1', '', '', '']],
  [/^Montants en (.+) indicatifs : (.+) pour (.+) DH \(cours indicatif de Bank Al-Maghrib du (.+)\)\. Votre banque appliquera son taux et ses frais\.$/, ['المبالغ بـ$1 تقريبية: $2 = $3 درهم (سعر استرشادي لبنك المغرب ليوم $4). سيطبّق بنكك سعره ومصاريفه.', 'Lmablagh b $1 ta9ribiya: $2 = $3 DH (Bank Al-Maghrib, $4). Lbanka dyalek ghadi tdir sse3r dyalha w lmasarif.', '', '', '']],
  // Vague 23 (5 groupes) : l'issue se traduit aussi (« retiré par son auteur » restait en français au milieu de l'arabe).
  [/^Désaccord du (.+) retiré par son auteur$/, ['خلاف $1: سحبه صاحبه', 'Khilaf $1: hiydo mol dyalo', '', '', '']],
  [/^Désaccord du (.+) clos par un accord des deux parties$/, ['خلاف $1: أُغلق باتفاق الطرفين', 'Khilaf $1: tsedd b ittifaq jouj', '', '', '']],
  [/^Désaccord du (.+) clos par un second avis$/, ['خلاف $1: أُغلق برأي ثانٍ', 'Khilaf $1: tsedd b ra2y tani', '', '', '']],
  [/^Désaccord du (.+) exporté vers un médiateur$/, ['خلاف $1: أُحيل على وسيط', 'Khilaf $1: tsifet l wasit', '', '', '']],
  [/^(.+) · bureau de contrôle technique$/, ['$1 · مكتب المراقبة التقنية', '$1 · bureau dyal l-contrôle technique', '', '', '']],
  [/^il y a (\d+) h$/, ['منذ $1 ساعة', 'hadi $1 sa3a', '', '', '']],
  [/^il y a (\d+) min$/, ['منذ $1 دقيقة', 'hadi $1 d9i9a', '', '', '']],
  [/^il y a (\d+) jours?$/, ['منذ $1 أيام', 'hadi $1 iyam', '', '', '']],
  [/^« (.+) »\.?$/, ['« $1 »', '« $1 »', '« $1 »', '« $1 »', '« $1 »']],   // vague 25 (jury GPT n° 9) : une note citée entre guillemets se traduit si la phrase est connue
];
// Vague 17 (jury, n° 20) : les lignes restées en français sur les écrans traduits (événements des échanges, Mes chantiers, Qui est TEEQA).
// Arabe et darija seulement : en tamazight, la phrase reste en français plutôt qu'une traduction douteuse.
const UI17 = [
  ['(taux indicatif du jour)', '(سعر استرشادي لليوم)', '(taux ta9ribi dyal lyoum)'],   // vague 25 (doigt : Fatna rejouée)
  ['Nouveau', 'جديد', 'Jdid'],
  // Vague 25 (jury GPT n° 9) : notes citées dans le fil, encore en français dans les vues arabe et darija.
  ['Cales posées le jour même sur le premier poteau d’angle ; le second demain matin.', 'وُضعت الفواصل في نفس اليوم على عمود الزاوية الأول؛ والثاني صباح الغد.', 'Lcalat thattou f nhar l2oul 3la lpoto dyal zzawiya l2oul; ttani ghedda f sbah.'],
  ["La réponse et les photos m'ont convaincu", 'أقنعني الرد والصور', 'Ljawab w tsawer qn3ouni'],
  ['Pièce du constat jointe · hors appli, sans les deux heures de TEEQA', 'وثيقة المعاينة مرفقة · من خارج التطبيق، بدون توقيت TEEQA', 'Lwatiqa dyal lmo3ayana m3a · mn barra lapp, bla saa dyal TEEQA'],
  ["La photo prise sur place montre les deux poteaux d'angle côté jardin dans le même cadre ; les cales sont en place sur chacun.", 'الصورة الملتقطة في عين المكان تُظهر عمودي الزاوية من جهة الحديقة في نفس الإطار؛ والفواصل في مكانها على كل منهما.', 'Tswira li ttakhdat f lblasa katbayen jouj lpotoyat dyal zzawiya mn jiht ljarda f nefs lkadr; lcalat f blasthom f kol wahed.'],
  ['Début déclaré avec 1 photo', 'تم التصريح بالبداية مع صورة واحدة', 'Bdina, m3a tswira wahda'],
  ['Ferraillage prêt · visite demandée avant coulage', 'الحديد جاهز · طُلبت زيارة قبل الصب', 'Lhdid wajed · tlebna viziti qbel lbeton'],
  ['Visite de contrôle acceptée', 'تم قبول زيارة المراقبة', 'Viziti dyal lmouraqaba tqeblat'],
  ['Contre-visite acceptée', 'تم قبول الزيارة المضادة', 'Contre-visite tqeblat'],
  ['Contre-visite demandée', 'طُلبت زيارة مضادة', 'Contre-visite matlouba'],
  ['Avis signé : avec réserves', 'رأي موقع: مع تحفظات', 'Raay msenni: b tahaffodat'],
  ['Réserve sur un ouvrage caché ou de structure : la correction sera contrôlée sur place', 'تحفظ على عمل مخفي أو إنشائي: سيُراقب الإصلاح في عين المكان', 'Tahaffod 3la chi haja mkhbiya wla dyal lbni: tasli7 ghadi ytchaf f lblasa'],
  ["Observation de l'entreprise jointe à l'avis", 'ملاحظة المقاولة مرفقة بالرأي', 'Molahada dyal charika m3a raay'],
  ['Pour information', 'للعلم', 'Bach t3ref'],
  ["Avis signé : Validé (ajouté à l'historique des avis)", 'رأي موقع: مقبول (أضيف إلى سجل الآراء)', 'Raay msenni: mqboul (tzad l tarikh dyal laraa)'],
  ["Droit de réponse du contrôleur joint à l'avis", 'حق رد المراقب مرفق بالرأي', 'Jawab lmouraqib m3a raay'],
  ['Coulage déclaré avec 2 photos', 'تم التصريح بصب الخرسانة مع صورتين', 'Lbeton tsebb, m3a jouj tsawer'],
  ['Photo du constat jointe', 'صورة المعاينة مرفقة', 'Tswira dyal lmo3ayana m3a'],
  ['Proposer mon chantier au programme pilote', 'اقتراح ورشتي على البرنامج التجريبي', 'Nqtareh lchantier dyali f lprogramme pilote'],
  ['Nos garanties écrites', 'ضماناتنا المكتوبة', 'Dmanat dyalna mktouba'],
  ["Ce que TEEQA garantit, ce qu'il ne garantit pas, plafonds et assurances", 'ما تضمنه TEEQA وما لا تضمنه، السقوف والتأمينات', 'Chno kaydmen TEEQA w chno la, lhdoud w ttaminat'],
  ['À quoi ressemble un chantier clos', 'كيف يبدو ورش منتهٍ', 'Kifach kayban chantier sali'],
  ['Exemple de rapport, présenté comme exemple : étapes, avis, réception', 'نموذج تقرير، معروض كمثال: المراحل، الآراء، التسلم', 'Mital dyal taqrir: lmarahil, laraa, tasallum'],
  ['Comment marche le programme pilote ?', 'كيف يعمل البرنامج التجريبي؟', 'Kifach khddam lbarnamaj ttajribi?'],
  ['Qui est TEEQA', 'من هي TEEQA', 'Chkoun hiya TEEQA'],
  ['Programme pilote : 10 premiers chantiers, inscriptions ouvertes', 'برنامج تجريبي: أول 10 أوراش، التسجيل مفتوح', 'Barnamaj ttajribi: 10 dyal lchantiyat lwlin, ttasjil mftouh'],
  ["Un conseiller TEEQA suit chaque chantier pilote de près, dans votre langue, et note vos retours. Un premier chantier pilote est clôturé : Villa Les Orangers, à Berkane, reçue le 26 septembre 2026 ; son rapport et l'avis de sa cliente sont publiés avec son accord.", 'يتابع مستشار من TEEQA كل ورش تجريبي عن قرب، بلغتك، ويسجل ملاحظاتك. أُغلق أول ورش تجريبي: فيلا البرتقال في بركان، تم تسلمها يوم 26 شتنبر 2026؛ تقريرها ورأي صاحبتها منشوران بموافقتها.', "Moustachar mn TEEQA kaytba3 kol chantier ttajribi mn qrib, b loghtek, w kaykteb molahadatek. Awwal chantier ttajribi tsedd: Villa Les Orangers f Berkane, tsellmat nhar 26 chtenber 2026; ttaqrir dyalha w raay dyal moulatha mnchourin b mwafaqtha."],
  // 20 nov. : chantier clos d'exemple et séquestre (titres seulement ; le détail des règles reste en français, original qui fait foi).
  ["Voir un chantier mené jusqu'à la réception", 'شاهد ورشا أُنجز حتى التسلم', 'Chouf chantier wsel hta ttasallum'],
  ['Séquestre bancaire, facultatif', 'حساب ضمان بنكي، اختياري', 'Compte dyal dman f lbanka, ikhtiyari'],
  ['Choisir le séquestre', 'اختيار حساب الضمان', 'Khtar compte dman'],
  ["J'accepte le séquestre", 'أقبل حساب الضمان', 'Kanqbel compte dman'],
  ['Verser sur le compte de séquestre', 'الدفع في حساب الضمان', 'Khlles f compte dman'],
  ["Je m'oppose au versement", 'أعترض على التحويل', 'Kan3ared 3la ttahwil'],
  ['TEEQA SARL · boulevard Al Massira, Maârif, 20330 Casablanca · RC Casablanca 612 447', 'TEEQA SARL · شارع المسيرة، المعاريف، 20330 الدار البيضاء · السجل التجاري الدار البيضاء 612 447', 'TEEQA SARL · boulevard Al Massira, Maârif, 20330 Casablanca · RC Casablanca 612 447'],
  ["C'est urgent", 'هذا مستعجل', 'Hadchi mosta3jel'],
  ['Corriger la traduction', 'تصحيح الترجمة', 'Sahhah tarjama'],
  ["« C'est urgent » met votre message en haut des échanges chez les autres parties, les prévient par notification et SMS, et prévient l'équipe TEEQA (urgence chantier : 7 j/7, 7 h – 22 h). Une fois par jour et par étape, pour tous les participants (le jour change à minuit, heure du Maroc). Ce n'est pas une contestation : il ne retient ni le chantier ni un paiement, et TEEQA ne tranche pas.", '« مستعجل » يضع رسالتك في أعلى المحادثة عند الأطراف الأخرى، وينبههم بإشعار ورسالة قصيرة، وينبه فريق TEEQA (استعجال الورش: 7 أيام على 7، من 7 إلى 22). مرة واحدة في اليوم لكل مرحلة، لجميع المشاركين (يتغير اليوم عند منتصف الليل بتوقيت المغرب). ليس اعتراضا: لا يوقف الورش ولا أي أداء، وTEEQA لا تفصل في الخلاف.', "« Mosta3jel » kayhet lmessage dyalk lfoq 3nd lakhrin, kayn3ethom b notification w SMS, w kayn3et l l'équipe TEEQA (mosta3jal dyal chantier: 7/7, mn 7 l 22). Mra f nhar l kol marhala, l ga3 li m3akom (nhar kaytbeddel f nos lil, b sa3a dyal lmaghrib). Machi i3tirad: ma kaywqef la chantier la khlas, w TEEQA ma kat7kemch."],
  ['Déjà utilisé sur cette étape aujourd’hui (une fois par jour).', 'استُعمل اليوم في هذه المرحلة (مرة في اليوم).', 'Tkhdem lyoum f had lmarhala (mra f nhar).'],
  ['Il attend votre réponse. Ce n’est pas une contestation : rien n’est retenu, TEEQA ne tranche pas.', 'ينتظر ردك. ليس اعتراضا: لا شيء موقوف، وTEEQA لا تفصل.', 'Kaytsenna jawab dyalk. Machi i3tirad: walou ma twqef, TEEQA ma kat7kemch.'],
  ['C’est urgent', 'مستعجل', 'Mosta3jel'],
  ['Enregistrer la correction', 'حفظ التصحيح', 'Sjjel tas7i7'],
  ['Votre traduction', 'ترجمتك', 'Tarjama dyalk'],
  // Vague 18 NT : libellés ajoutés (boutons et repères courts).
  ['Après les étapes', 'بعد المراحل', 'Mn b3d lmarahil', 'Dffir n lmarahil', 'Deffir n lmarahil', 'Dffir n lmarahil'],
  ["Parler à quelqu'un avant de commencer", 'التحدث مع شخص قبل البدء', 'Hder m3a chi wahed qbel ma tbda', 'Sawl d yan ad ur tbdit', 'Ssiwel akid hed qbel ad tebdid', 'Sawl d yan ad ur tbdit'],
  ["Une question ? Parler à quelqu'un", 'سؤال؟ تحدث مع شخص', 'Swal? Hder m3a chi wahed', 'Asqsi? Sawl d yan', 'Asteqsi? Ssiwel akid hed', 'Asqsi? Sawl d yan'],
  ['Tout lire', 'قراءة الكل', 'Qra kolchi', 'Ghr kullu', 'Ghar marra', 'Ghr kullu'],
  ['Tout replier', 'طي الكل', 'Sedd kolchi', 'Qqn kullu', 'Qqen marra', 'Qqn kullu'],
  ['Contre-proposer', 'اقتراح مضاد', 'Qtareh haja khra', 'Ssumr yat tayyaḍt', 'Ssumer tiḍeffart', 'Ssumr yat tayyaḍt'],
  ['Corriger ma déclaration (pas encore confirmée)', 'تصحيح تصريحي (لم يُؤكَّد بعد)', 'Sahhah tasrih dyali (mazal ma tekked)', 'Ssgd tasrih inu (ur ta ittwagdl)', 'Ssegd tasrih inu (war ja yettwagdel)', 'Ssgd tasrih inu (ur ta ittwagdl)'],
  ['Je ne peux pas faire cette visite', 'لا أستطيع القيام بهذه الزيارة', 'Ma nqderch ndir had lviziti', 'Ur zdarx ad skrx tamzrit ad', 'War zemmerx ad gex tamzrit a', 'Ur zdarx ad skrx tamzrit ad'],
  ['Changer de créneau', 'تغيير الموعد', 'Beddel lwaqt', 'Bddl akud', 'Beddel akud', 'Bddl akud'],
  // Vague 18 NT (contrôleuse arabophone) : les points de contrôle du gros œuvre les plus fréquents, en arabe et en darija.
  ['Poteaux et chaînages ferraillés selon le plan (nombre et diamètre des aciers)', 'تسليح الأعمدة والأحزمة حسب التصميم (عدد الحديد وقطره)', 'Lpotoyat w ssnasel mhaddedin b lhdid kif f lplan (3adad w qotr dyal lhdid)'],
  ['Enrobage des aciers : cales en place', 'تغطية الحديد: الفواصل في مكانها', 'Taghtiya dyal lhdid: lcalat f blasthom'],
  ['Recouvrement avec les attentes des fondations (longueur mesurée)', 'تراكب الحديد مع انتظارات الأساسات (الطول مقيس)', 'Trakob dyal lhdid m3a dyal lassas (ttoul m9is)'],
  ['Coffrage des poteaux d’aplomb et étanche', 'قوالب الأعمدة عمودية ومحكمة', 'Lcoffrage dyal lpotoyat qayem w msdoud mzyan'],
  ['Aciers en attente en tête de poteaux, pour la dalle', 'حديد الانتظار في رأس الأعمدة، من أجل البلاطة', 'Lhdid li kaytsenna f ras lpotoyat, l ddalla'],
  ['Fond des coffrages propre avant coulage', 'قاع القوالب نظيف قبل الصب', 'Qa3 lcoffrage nqi qbel lbeton'],
  ['Ferraillage des semelles et des longrines (diamètres et espacements de la note du bureau d’études)', 'تسليح القواعد والروافد (الأقطار والمسافات حسب مذكرة مكتب الدراسات)', 'Lhdid dyal lqawa3id w lrawafid (lqotr w lmasafat kif f lwaraqa dyal bureau d\'études)'],
  ['Enrobage des aciers : cales de 5 cm au moins (béton contre terre)', 'تغطية الحديد: فواصل 5 سم على الأقل (خرسانة ملامسة للتربة)', 'Taghtiya dyal lhdid: lcalat 5 cm 3la l2aqal (lbeton m9ass l trab)'],
  ['attendu : 5 cm au moins', 'المطلوب: 5 سم على الأقل', 'lmatlob: 5 cm 3la l2aqal'],
  ['attendu : 3 cm au moins (hors sol)', 'المطلوب: 3 سم على الأقل (فوق الأرض)', 'lmatlob: 3 cm 3la l2aqal (fo9 l2ard)'],
  ['attendu : 50 diamètres au moins (60 cm pour un acier de 12)', 'المطلوب: 50 قطرا على الأقل (60 سم لحديد 12)', 'lmatlob: 50 qotr 3la l2aqal (60 cm l hdid 12)'],
  ['attendu : celle du plan, ± 1 cm', 'المطلوب: حسب التصميم، ± 1 سم', 'lmatlob: kif f lplan, ± 1 cm'],
  ['attendu : 5 mm au plus sous la règle', 'المطلوب: 5 مم على الأكثر تحت المسطرة', 'lmatlob: 5 mm 3la ktar taht lmastara'],
  ['attendu : 2 cm au plus', 'المطلوب: 2 سم على الأكثر', 'lmatlob: 2 cm 3la ktar'],
  ['Demander une visite de constat', 'طلب زيارة معاينة', 'Tleb viziti dyal mo3ayana', 'Tlb tamzrit n twalit', 'Tleb tamzrit n twalit', 'Tlb tamzrit n twalit'],
  // Vague 19 (jury n° 16) : les derniers fragments français des écrans arabe et darija.
  ['Villa Les Orangers, Berkane : 7 étapes closes, réception, avis de sa cliente', 'فيلا البرتقال، بركان: 7 مراحل منتهية، التسلم، رأي صاحبتها', 'Villa Les Orangers, Berkane: 7 marahil salin, ttasallum, ray moulat chantier'],
  ['Un désordre après coup ?', 'عيب ظهر بعد ذلك؟', 'Chi 3ayb ban mn b3d?', 'Kra n lɛib dffir ?', 'Ca n lɛib zdeffir ?', 'Kra n lɛib dffir ?'],
  ['Fissure, infiltration : visite de constat', 'شق، تسرب: زيارة معاينة', 'Chaq, tasarrub: viziti dyal mo3ayana'],
  ['Qui a le dernier mot :', 'من له الكلمة الأخيرة:', 'Chkoun 3ndo lkelma lekhra:'],
];
const IDX = { ar: 1, dar: 2, shi: 3, rif: 4, tzm: 5 };
const norm = (t) => String(t).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
for (const r of UI17) if (!UI.some((x) => norm(x[0]) === norm(r[0]))) UI.push(r);
// Vague 26 (jury GPT n° 1, 8 personas ; jury n° 21) : compteurs, échéances, « Paiement reçu », états et parcours graves en arabe, darija et tamazight.
const UI26 = [
  ['Détails', 'التفاصيل', 'Tafasil', 'Tifirit', 'Tifirit', 'Tifirit'],
  ['Moins de détails', 'تفاصيل أقل', 'Tafasil 9al', 'Drus n tifirit', 'Drus n tifirit', 'Drus n tifirit'],
  ['Détails affichés plus bas : avis, frise, règles', 'التفاصيل أسفله: الرأي، التسلسل، القواعد', 'Tafasil lta7t : ra2y, tsalsol, l9awa3id', '', '', ''],
  ['Vue simple', 'عرض مبسّط', 'Chouf bsit', '', '', ''],
  ['Paiements', 'الدفعات', 'Lkhlas', 'Lkhlas', 'Lkhlas', 'Lkhlas'],
  ['il date et garde les avis et les photos. C’est un début de preuve, pas une certification : un médiateur, un notaire, un juge ou vos héritiers peuvent s’en servir, avec d’autres pièces. TEEQA ne tranche pas.', 'يؤرّخ الآراء والصور ويحفظها. إنه بداية حجة، وليس شهادة مصادقة: يمكن لوسيط أو موثق أو قاض أو لورثتكم الاستعانة به مع وثائق أخرى. لا تفصل TEEQA في الخلاف.', 'kay2arrekh w kaykhalli laraa w tsawer. Bidayat dlil, machi chahada : wasit, mouwatti9, 9adi wla lwarata y9dro ykhdmo bih m3a wraq khrin. TEEQA ma katfsselch.', '', 'ittarrikh d ittḥeḍḍu laraa d tiwlafin. D tazwara n dlil, machi d tachahadt. TEEQA war tegzem.', ''],
  ['Paiement reçu', 'تم التوصل بالأداء', 'Lkhlas wsel', 'Lkhlas ilkm-d', 'Lkhlas yewwed-d', 'Lkhlas ilkm-d'],
  ['· revoir la célébration de cette étape', '· إعادة مشاهدة الاحتفال بهذه المرحلة', '· 3awd chouf lfrha dyal had lmarhala', '· zr tiklt yaḍn lfrḥ n lmarhala ad', '· zar tikkelt nniḍen lfeṛḥ n lmarhala-ya', '· zr tiklt yaḍn lfrḥ n lmarhala ad'],
  ['Continuer avec TEEQA ?', 'هل تواصل مع TEEQA؟', 'Tkemmel m3a TEEQA?', 'Ad tkmmlt d TEEQA?', 'Ad tkemmled akid TEEQA?', 'Ad tkmmlt d TEEQA?'],
  ['Les étapes qui seront cachées arrivent ; parrainer un autre chantier', 'المراحل التي ستُغطّى قادمة؛ زكِّ ورشا آخر', 'Lmarahil li ghadi ytghttaw jayin ; 3reḍ chantier akhor', 'Lmarahil lli ra ttwaɣmrnin ar d-ttasin ; ssn achanti yaḍn', 'Lmarahil i ad ttwaffren qa d-ttasen ; ssen achanti nniḍen', 'Lmarahil lli ra ttwaɣmrnin ar d-ttasin ; ssn achanti yaḍn'],
  ['Attestation décennale', 'شهادة الضمان العشري', 'Chahada dyal dman 10 snin', 'Tachahadt n dman n 10 iseggusa', 'Tachahadt n dman n 10 iseggusen', 'Tachahadt n dman n 10 iseggusa'],
  ['Signaler un accident', 'التبليغ عن حادثة', 'Blleɣ 3la hadita', 'Mmel tadyant', 'Mmel tadyant', 'Mmel tadyant'],
  ['Secours d’abord (15 ou 150) ; daté, vu par tous', 'الإسعاف أولا (15 أو 150)؛ مؤرخ ويراه الجميع', 'Lis3af lowel (15 wla 150) ; m2arrekh, kolchi kaychoufo', 'Lis3af tizwiri (15 niɣ 150) ; s tarikh, kullu ad t-zrn', 'Lis3af d amezwaru (15 niɣ 150) ; s tarikh, akk ad t-zren', 'Lis3af tizwiri (15 niɣ 150) ; s tarikh, kullu ad t-zrn'],
  ['Aperçu de la facture (PDF)', 'معاينة الفاتورة (PDF)', 'Chouf lfatoura (PDF)', 'Zr lfatura (PDF)', 'Zar lfatura (PDF)', 'Zr lfatura (PDF)'],
  ['Avant travaux', 'قبل الأشغال', 'Qbel lkhdma', 'Zun axeddim', 'Qbel axeddim', 'Zun axeddim'],
  ['Acceptée', 'مقبولة', 'Mqboula', 'Tqbl', 'Teqbel', 'Tqbl'],
  ['Convention de suivi.', 'اتفاقية التتبع.', 'Convention dyal ttaba3.', 'Lmitaq n uḍfaṛ.', 'Lmitaq n uḍfaṛ.', 'Lmitaq n uḍfaṛ.'],
  ['En bref', 'باختصار', 'B ikhtisar', 'S wawal imẓẓin', 'S wawal amecṭuḥ', 'S wawal imẓẓin'],
  ['Les 11 articles', 'البنود الـ11', '11 band', '11 n lbnud', '11 n lbnud', '11 n lbnud'],
  ['Annexe tarifaire', 'ملحق الأثمان', 'Mol7aq dyal tamanat', 'Lmulḥaq n ttaman', 'Lmulḥaq n ttaman', 'Lmulḥaq n ttaman'],
  ['Prix de chaque visite, qui paie, quand, avec quel plafond', 'ثمن كل زيارة، من يدفع، متى، وبأي سقف', 'Taman kol ziyara, chkoun ykhelles, fo9ach, w b ach men s9ef', 'Ttaman n kraygat tirzi, ma ixelsn, mlmi', 'Ttaman n kul tirzi, min ixellsen, melmi', 'Ttaman n kraygat tirzi, ma ixelsn, mlmi'],
  ['Pour ses seuls articles : prix de TEEQA, responsabilité, données', 'لبنودها فقط: ثمن TEEQA، المسؤولية، المعطيات', 'Ghir l lbnod dyalha : taman TEEQA, lmas2oliya, lm3tayat', '', '', ''],
  ["TEEQA ne tranche pas un désaccord ; il garde l'historique.", 'لا تفصل TEEQA في الخلاف؛ تحتفظ بالسجل.', 'TEEQA ma katfsselch f lkhilaf ; katkhalli tarikh.', 'TEEQA ur tgzzm amennuɣ ; tḥḍa tarikh.', 'TEEQA war tegzem amennuɣ ; teḥḍa tarikh.', 'TEEQA ur tgzzm amennuɣ ; tḥḍa tarikh.'],
  ["L'entreprise déclare chaque étape avec ses photos ; un contrôleur indépendant, missionné par TEEQA, passe sur place aux étapes clés et signe un avis.", 'تصرّح المقاولة بكل مرحلة مع صورها؛ ويمر مراقب مستقل، تكلفه TEEQA، في المراحل الأساسية ويوقّع رأيا.', 'Charika katgoul kol marhala m3a tsawer ; mouraqib mosta9ill, msifto TEEQA, kaydouz f lmarahil lmohimma w kaysenni ra2y.', '', '', ''],
];
for (const r of UI26) { const k = UI.findIndex((x) => norm(x[0]) === norm(r[0])); if (k >= 0) UI[k] = r; else UI.push(r); }
PATTERNS.unshift(   // vague 26 (doigt : Khadija) : la partie « Paiements » du rapport, avant la règle générale « Tranche N »
  [/^Tranche (\d+) · (.+) · payée, reçu confirmé par (.+)$/, ['الشطر $1 · $2 · مؤدّى، وأكدت $3 التوصل به', 'Tranche $1 · $2 · tkhlsat, $3 kkdat lwsoul', 'Tranche $1 · $2 · tkhllas, $3 tsntm', 'Tranche $1 · $2 · tekhelles, $3 tesentem', 'Tranche $1 · $2 · tkhllas, $3 tsntm']],
  [/^Tranche (\d+) · (.+) · payée \(indiqué par le client\), à confirmer par (.+)$/, ['الشطر $1 · $2 · مؤدّى (حسب الزبون)، في انتظار تأكيد $3', 'Tranche $1 · $2 · tkhlsat (galha lclient), tsenna $3 tkked', 'Tranche $1 · $2 · tkhllas (inna t lclient), ar ttql $3', 'Tranche $1 · $2 · tekhelles (yenna-t lclient), qa tettraju $3', 'Tranche $1 · $2 · tkhllas (inna t lclient), ar ttql $3']],
  [/^Tranche (\d+) · (.+) · (.+) versés en partie, reste (.+) à (.+)$/, ['الشطر $1 · $2 · دُفع منه $3، والباقي $4 لـ $5', 'Tranche $1 · $2 · tkhlles mnha $3, lbaqi $4 l $5', '', 'Tranche $1 · $2 · $3 tkhellsen, yeqqim $4 i $5', '']],
  [/^Tranche (\d+) · (.+) · sur le compte de séquestre, pour (.+)$/, ['الشطر $1 · $2 · في حساب الضمان، لفائدة $3', 'Tranche $1 · $2 · f compte dman, l $3', '', '', '']],
  [/^Tranche (\d+) · (.+) · à payer à (.+) avant le (.+)$/, ['الشطر $1 · $2 · يُؤدّى لـ $3 قبل $4', 'Tranche $1 · $2 · khassha tkhlles l $3 qbel $4', 'Tranche $1 · $2 · ad tkhllst i $3 zun $4', 'Tranche $1 · $2 · ad tkhellsed i $3 qbel $4', 'Tranche $1 · $2 · ad tkhllst i $3 zun $4']],
  [/^Tranche (\d+) · (.+) · à venir, à (.+)$/, ['الشطر $1 · $2 · قادم، لـ $3', 'Tranche $1 · $2 · jaya, l $3', 'Tranche $1 · $2 · ar d-tasi, i $3', 'Tranche $1 · $2 · qa d-tusa, i $3', 'Tranche $1 · $2 · ar d-tasi, i $3']],
  [/^Total : (.+) · payé \(indiqué\) : (.+) · reste : (.+)$/, ['المجموع: $1 · المؤدّى (المصرّح به): $2 · الباقي: $3', 'Majmou3 : $1 · tkhlles (mgoul) : $2 · lbaqi : $3', 'Kullu : $1 · ikhllas : $2 · iqqimn : $3', 'Akk : $1 · yekhelles : $2 · yeqqimen : $3', 'Kullu : $1 · ikhllas : $2 · iqqimn : $3']],
  [/^TEEQA ne détient pas l'argent des travaux : chaque tranche se paie directement du client à l'entreprise(, ou par le compte de séquestre de .+)?\. Seuls les services de TEEQA sont facturés par TEEQA .+$/, ['لا تمسك TEEQA مال الأشغال: يُؤدّى كل شطر مباشرة من الزبون إلى المقاولة (أو عبر حساب الضمان البنكي إن وُجد). لا تفوتر TEEQA إلا خدماتها (التتبع، الزيارات المضافة، الزيارات المضادة، الرأي الثاني: الأثمان في ملحق الأثمان)، وهي التي تؤدي لوكالة المراقبة.', 'TEEQA ma katchedch flous lkhdma : kol tranche katkhlles nichan mn lclient l charika (wla b compte dman ila kayn). TEEQA katfaktori ghir lkhadamat dyalha (ttaba3, ziyarat zaydin, contre-visites, ra2y tani), w hiya li katkhlles lwkala.', '', 'TEEQA war teṭṭif idrimen n uxeddim : kul ttranche tettwakhelles srid zi lclient i charika. TEEQA tfaktori ghir lkhadamat-nnes.', '']],
);
PATTERNS.push(
  // vague 26 (jury n° 13) : la date de la tranche dépend de la visite
  [/^Cette date tient si la visite a lieu au plus tard le (.+?) et que vous coulez le lendemain ; si elle passe plus tard, la date recule d'autant \(un retard de l'agence ne vous est pas compté\)\.$/, ['يبقى هذا التاريخ صالحا إذا تمت الزيارة في أجل أقصاه $1 وصببتم الخرسانة في اليوم الموالي؛ وإذا تأخرت، يتأخر التاريخ بنفس المدة (لا يُحسب عليكم تأخر الوكالة).', 'Had tarikh kayb9a ila kant ziyara 9bel $1 w sebbitiw lbeton nhar men moraha ; ila t3e9at, tarikh kayt2e5er b nfs lmodda (t2e55ur dyal lwkala ma kaytḥsebch 3likom).', '', '', '']],
  [/^Cette date tient si la visite a lieu au plus tard le (.+?) ; si elle passe plus tard, la date recule d'autant \(un retard de l'agence ne vous est pas compté\)\.$/, ['يبقى هذا التاريخ صالحا إذا تمت الزيارة في أجل أقصاه $1؛ وإذا تأخرت، يتأخر التاريخ بنفس المدة (لا يُحسب عليكم تأخر الوكالة).', 'Had tarikh kayb9a ila kant ziyara 9bel $1 ; ila t3e9at, tarikh kayt2e5er b nfs lmodda (t2e55ur dyal lwkala ma kaytḥsebch 3likom).', '', '', '']],
  [/^Date estimée : elle recule si une étape d'avant prend du retard\.$/, ['تاريخ تقديري: يتأخر إذا تأخرت مرحلة سابقة.', 'Tarikh mqadder : kayt2e5er ila t2e55rat chi marhala 9bel.', '', '', '']],
  [/^Dernière photo de l'étape, du (.+) : voir le détail$/, ['آخر صورة للمرحلة، بتاريخ $1: عرض التفاصيل', 'Akhir tswira dyal lmarhala, nhar $1 : chouf tafasil', 'Tawlaft taneggarut n lmarhala, ass n $1 : zr', 'Tawlaft taneggarut n lmarhala, ass n $1 : zar', 'Tawlaft taneggarut n lmarhala, ass n $1 : zr']],
  [/^selon votre devis · échéance le (.+)$/, ['حسب عرض الأثمان · الأجل يوم $1', 'b7al devis dyalek · lajal nhar $1', 'zg devis-nnk · lajal ass n $1', 'zi devis-nnek · lajal ass n $1', 'zg devis-nnk · lajal ass n $1']],
  [/^Déclaré, en attente de confirmation par (.+) \(elle indique « Paiement reçu » dès que l'argent arrive\)\.$/, ['مصرّح به، في انتظار تأكيد $1 (تضغط « تم التوصل بالأداء » عند وصول المال).', 'Galoh, kantsennaw $1 tkked (katbrek « Lkhlas wsel » mli ywsel lflous).', 'Nnan t, ar ttqln $1 (ad tsrs « Lkhlas ilkm-d » mlmi d-ilkm lflus).', 'Nnan-t, qa ttrajun $1 (ad tessers « Lkhlas yewwed-d » melmi d-yewweḍ lflus).', 'Nnan t, ar ttqln $1 (ad tsrs « Lkhlas ilkm-d » mlmi d-ilkm lflus).']],
  [/^Visite de « (.+) » : TEEQA choisit lui-même une autre agence ; le délai de visite ne change pas\.$/, ['زيارة « $1 »: تختار TEEQA بنفسها وكالة أخرى؛ ولا يتغير أجل الزيارة.', 'Ziyara dyal « $1 » : TEEQA katkhtar wkala khra ; lajal dyal ziyara ma kaytbeddelch.', '', '', '']],
  [/^: (\d+) actions? vous attend(?:ent)?$/, [': $1 إجراء في انتظاركم', ': $1 dyal l7ajat kaytsennawk', ': $1 n tɣawsiwin ar k-ttqlnt', ': $1 n tɣawsiwin qa k-ttrajunt', ': $1 n tɣawsiwin ar k-ttqlnt']],
  [/^: (\d+) nouvelles? non lues?$/, [': $1 خبر غير مقروء', ': $1 khbar ma tqrawch', ': $1 n lkhbar ur ittyaghran', ': $1 n lkhbar ur yettwaghren', ': $1 n lkhbar ur ittyaghran']],
  [/^Étape (\d+) : (.+) — Close · aciers validés, puis béton coulé$/, ['المرحلة $1: $2 — منتهية · الحديد مقبول، ثم صب الخرسانة', 'Marhala $1 : $2 — Salat · lhdid mqboul, w lbeton tsebb', 'Lmarhala $1 : $2 — Tkmml', 'Lmarhala $1 : $2 — Tekmel', 'Lmarhala $1 : $2 — Tkmml']],
  [/^Étape (\d+) : (.+) — Fin déclarée · avis attendu$/, ['المرحلة $1: $2 — تم التصريح بالنهاية · في انتظار الرأي', 'Marhala $1 : $2 — Salaw · kantsennaw ra2y', 'Lmarhala $1 : $2 — Kmmlen · ar ttqln lavis', 'Lmarhala $1 : $2 — Kemmlen · qa ttrajun lavis', 'Lmarhala $1 : $2 — Kemmlen · ar ttrajun lavis']],
  [/^Étape (\d+) : (.+) — Verrouillée$/, ['المرحلة $1: $2 — مقفلة', 'Marhala $1 : $2 — Msdoda', 'Lmarhala $1 : $2 — Tqqen', 'Lmarhala $1 : $2 — Teqqen', 'Lmarhala $1 : $2 — Tqqen']],
  [/^Étape (\d+) : (.+) — (.+)$/, ['المرحلة $1: $2 — $3', 'Marhala $1 : $2 — $3', 'Lmarhala $1 : $2 — $3', 'Lmarhala $1 : $2 — $3', 'Lmarhala $1 : $2 — $3']],
  [/^Police (\S+) · (.+)$/, ['البوليصة $1 · $2', 'Police $1 · $2', 'Police $1 · $2', 'Police $1 · $2', 'Police $1 · $2']],
  [/^dont (.+) confirmé reçu par l'entreprise ; (.+) indiqués par le client, non vérifiés$/, ['منها $1 أكدت المقاولة التوصل بها؛ $2 صرّح بها الزبون، غير متحقق منها', 'mnha $1 charika kkdat lwsoul ; $2 galha lclient, ma mt7aqqaqach', '', '', '']],
  [/^Acceptée · (.+)$/, ['مقبولة · $1', 'Mqboula · $1', 'Tqbl · $1', 'Teqbel · $1', 'Tqbl · $1']],
  [/^Engagée · (.+)$/, ['ملتزمة · $1', 'Mltazma · $1', '', '', '']],
  [/^le (.+)\. Il ne retient plus le chantier\.$/, ['يوم $1. لم يعد يوقف الورش.', 'nhar $1. Ma b9ach kay7bes chantier.', 'ass n $1. Ur da yttḥbas axeddim.', 'ass n $1. Ur itteḥbas ca axeddim.', 'ass n $1. Ur da yttḥbas axeddim.']],
  [/^Pour ce chantier, si les tranches qui peuvent encore y passer \((.+)\) passent par le compte : (.+) de frais en tout, payés à (.+) \(pas à TEEQA\)\. (.+)$/, ['لهذا الورش، إذا مرّت الأشطر التي ما زال بإمكانها المرور ($1) عبر الحساب: $2 من المصاريف في المجموع، تُدفع لـ $3 (وليس لـ TEEQA).', 'L had chantier, ila daw ttranchat li ba9i y9dro ydouzo ($1) f lcompte : $2 dyal masarif f lmajmou3, kaytkhallso l $3 (machi l TEEQA).', '', '', '']],
);

const UIMAP = new Map(UI.map((row) => [norm(row[0]), row]));
const TERMS = UI.filter((row) => row[0].length > 8 && (/ · |:/.test(row[0]) || /^(Terrassement|Gros|Dalle|Menuiseries|Enduits|Finitions)/.test(row[0]))).sort((a, b) => b[0].length - a[0].length);
// Petits mots des demandes de photo (« l'angle nord »…), proposés comme suggestions.
const BITS = [
  ['l’étape n’a pas commencé', 'المرحلة لم تبدأ', 'lmarhala mazal ma bdat', '', '', ''],
  ['coulage pas encore déclaré', 'صب الخرسانة لم يُصرَّح به بعد', 'lbeton mazal ma tseftt', '', '', ''],
  ['avis du contrôleur attendu', 'في انتظار رأي المراقب', 'kantsennaw ra2y lmouraqib', '', '', ''],
  ['déclaration pas encore consultée', 'لم يُطَّلع على التصريح بعد', 'tasrih mazal ma tchaf', '', '', ''],
  ['le béton n’est pas encore coulé et déclaré', 'الخرسانة لم تُصب ولم يُصرَّح بها بعد', 'lbeton mazal ma tsabb', '', '', ''],
  ['le contrôleur n’a pas encore donné son avis', 'المراقب لم يُبدِ رأيه بعد', 'lmouraqib mazal ma 3ta ra2yo', '', '', ''],
  ['le client n’a pas encore consulté la déclaration', 'الزبون لم يطّلع على التصريح بعد', 'lclient mazal ma chaf tasrih', '', '', ''],
  ['7 jours après le coulage déclaré (qui suit l’avis favorable)', '7 أيام بعد التصريح بصب الخرسانة (الذي يلي الرأي الإيجابي)', '7 iyam ba3d tasrih b lbeton', '', '', ''],
  ['7 jours après l’avis favorable', '7 أيام بعد الرأي الإيجابي', '7 iyam ba3d ra2y lmzyan', '', '', ''],
    ['un euro', 'يورو واحد', 'wahed l-euro', '', '', ''],
  ['un franc suisse', 'فرنك سويسري واحد', 'wahed l-franc suisse', '', '', ''],
  ['le coulage déclaré (qui suit l’avis favorable)', 'التصريح بصب الخرسانة (الذي يلي الرأي الإيجابي)', 'tasrih b lbeton (mn b3d ra2y lmzyan)', '', '', ''],
  ['l’avis favorable', 'الرأي الإيجابي', 'ra2y lmzyan', '', '', ''],
  ['le coulage déclaré', 'التصريح بصب الخرسانة', 'tasrih b lbeton', '', '', ''],
["l'angle nord", 'الزاوية الشمالية', 'lqent chamali', 'tighmert n ugafa', 'tghmert n ugafa', 'tighmert n ugafa'],
  ['les aciers du poteau', 'حديد العمود', 'lhdid dyal lpoto', 'uzzal n lpoto', 'uzzal n lpoto', 'uzzal n lpoto'],
  ['la façade', 'الواجهة', 'lwajiha', 'lwajiha', 'lwajiha', 'lwajiha'],
  ['la livraison de ciment', 'شحنة الإسمنت', 'ssima li wslat', 'ssima lli d-ilkmn', 'ssima i d-yewwden', 'ssima lli d-ilkmn'],
];
export const PHOTO_ASKS = BITS.map((b) => b[0]);
const BITMAP = new Map([...UI.filter((r) => /^(Terrassement|Gros œuvre|Dalle|Menuiseries|Enduits|Finitions, contrôle)/.test(r[0])), ...BITS].map((b) => [norm(b[0]), b]));   // vague 22 : titres d'étape aussi

const JOURS = { lundi: ['الإثنين', 'Tnin'], mardi: ['الثلاثاء', 'Tlat'], mercredi: ['الأربعاء', 'Larb3'], jeudi: ['الخميس', 'Lkhmis'], vendredi: ['الجمعة', 'Jjem3a'], samedi: ['السبت', 'Ssebt'], dimanche: ['الأحد', 'Lhedd'] };
// Vague 19 (jury n° 16) : le nom marocain du mois seul, comme la date du téléphone (ar-MA), sans parenthèse.
const MOIS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'], MOIS_L = ['yanayr', 'fbrayr', 'mars', 'abril', 'ma', 'yonyo', 'yolyoz', 'ghocht', 'chtanbir', 'oktobr', 'nonbir', 'dojanbir'];
const MOIS_ABR = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const AUJ = { "aujourd'hui": ['اليوم', 'Lyoum', 'Ass ad', 'Ass-a', 'Ass ad'], hier: ['أمس', 'Lbareh', 'Idgam', 'Iḍennaḍ', 'Idgam'] };
// Vague 12 : les dates des fils (« Mardi 29 septembre », « Hier · lundi 7 décembre ») dans la langue du lecteur.
function dateTr(n, L) {
  const m = n.match(/^(?:(aujourd'hui|hier) · )?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\d{1,2}) (\S+)( \d{4})?$/i); if (!m) return null;
  const k = MOIS_FR.indexOf(m[4].toLowerCase()); if (k < 0) return null; const ar = L === 'ar', j = JOURS[m[2].toLowerCase()];
  const d = `${ar ? j[0] : j[1]} ${m[3]} ${ar ? MOIS[k] : MOIS_L[k]}${m[5] || ''}`;
  return m[1] ? `${AUJ[m[1].toLowerCase()][IDX[L] - 1]} · ${d}` : d;
}
// Vague 18 (jury, n° 13) : un créneau cité dans un événement (« le jeudi 22 octobre, 9 h – 11 h (heure du Maroc · 10 h – 12 h à Paris) »).
const ROLE_TR = { 'contrôleur': ['المراقب', 'lmouraqib'], entreprise: ['المقاولة', 'charika'], client: ['الزبون', 'lclient'] };
function slotTr(v, L) {
  if (!['ar', 'dar'].includes(L)) return null;
  const m = String(v || '').match(/^le (\S+) (\d{1,2}) (\S+), (\d{1,2}) h – (\d{1,2}) h \(heure du Maroc(?: · (\d{1,2}) h – (\d{1,2}) h à (.+)| · même heure à (.+))?\)$/i); if (!m) return null;   // vague 19 : « même heure à Paris » aussi
  const k = MOIS_FR.indexOf(m[3].toLowerCase()), j = JOURS[m[1].toLowerCase()]; if (k < 0 || !j) return null; const ar = L === 'ar';
  const d = ar ? `يوم ${j[0]} ${m[2]} ${MOIS[k]}، ${m[4]} – ${m[5]} (بتوقيت المغرب${m[6] ? ` · ${m[6]} – ${m[7]} بتوقيت ${m[8]}` : m[9] ? ` · نفس الساعة في ${m[9]}` : ''})` : `${j[1]} ${m[2]} ${MOIS_L[k]}, ${m[4]} – ${m[5]} (b lwaqt dyal lmeghrib${m[6] ? ` · ${m[6]} – ${m[7]} f ${m[8]}` : m[9] ? ` · nfs sa3a f ${m[9]}` : ''})`;
  return d;
}
// Vague 24 (diaspora Belgique) : l'accord du nombre en arabe (1 يوم واحد, 2 يومان, 3 à 10 أيام, 11 et plus يوما).
const arJours = (n) => n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوما`;
export function uiText(fr, L = lang()) {
  if (L === 'fr' || !IDX[L]) return fr;
  const n = norm(fr), row = UIMAP.get(n) || UIMAP.get(n.replace(/[.:]$/, ''));
  if (!row) { const dt = dateTr(n, L); if (dt) return dt; }
  if (row && row[IDX[L]]) return row[IDX[L]] + (row === UIMAP.get(n) ? '' : n.slice(-1));
  for (const [rx, outs] of PATTERNS) if (rx.test(n) && outs[IDX[L] - 1]) {
    let out = n.replace(rx, (...m) => outs[IDX[L] - 1].replace(/\$(\d)/g, (_, k) => { const v = m[+k]; const b = BITMAP.get(norm(v)); const u = !b && UIMAP.get(norm(v || '')); return b ? b[IDX[L]] : (slotTr(v, L) || ROLE_TR[v]?.[IDX[L] - 1] || (u && u[IDX[L]]) || v); }));   // vague 23 : un morceau connu du dictionnaire se traduit aussi
    if (L === 'ar') out = out.replace(new RegExp(`\\b(${MOIS_FR.join('|')})\\b`, 'g'), (mo) => MOIS[MOIS_FR.indexOf(mo)]);
    if (L === 'ar') out = out.replace(/(\d{1,2}) (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?(?=[\s،,)]|$)/g, (m0, j, mo) => `${j} ${MOIS[MOIS_ABR.indexOf(mo)]}`);   // vague 24 (doigt : Abdelkader) : « 6 déc. » → « 6 دجنبر »
    if (L === 'ar') out = out.replace(/(^|[^\d\s]\s*|\s)(\d+) يوم(?![\u0600-\u06FF])/g, (m0, a, n) => a + arJours(+n));   // vague 24 (Belgique) : « 3 أيام », pas « 3 يوم »   // vague 21 : mois en arabe au milieu d'une phrase traduite
    // Vague 25 (doigt : Fatna, « DH 000 260 ») : un montant reste d'un seul bloc, de gauche à droite, dans une phrase arabe (isolation bidi).
    if (/[\u0600-\u06FF]/.test(out)) out = out.replace(/(≈\s?)?(\d{1,3}(?:[ \u202f\u00a0]\d{3})+|\d+)(?:[,.]\d+)?\s?(DH|€|CHF|£|\$|AED|QAR|SAR)/g, (m0) => '\u2066' + m0.replace(/ /g, '\u00a0') + '\u2069');
    return terms(out, L);
  }
  // En arabe, un terme traduit au milieu d'une phrase restée en français mélangerait les deux sens d'écriture : on garde la phrase entière.
  if (L === 'ar') { let t2 = n; for (const [fr, ar] of PARENTE) t2 = t2.split(fr).join(ar); return t2 === n ? null : t2; }   // vague 23 : « Mohamed (père du client) »
  const t = terms(n, L);
  return t === n ? null : t;
}
// Vague 23 (5 groupes) : le lien de parenté saisi à côté d'un nom (« Mohamed (père du client) ») se lit dans la langue.
const PARENTE = [['(père du client)', '(والد الزبون)', '(bba dyal lclient)'], ['(mère du client)', '(والدة الزبون)', '(mmwi dyal lclient)'], ['(frère du client)', '(أخ الزبون)', '(khou lclient)'], ['(sœur du client)', '(أخت الزبون)', '(okht lclient)'], ['(chef de chantier)', '(رئيس الورش)', '(chef d lchantier)'], ['· ouvrier', '· عامل', '· khddam'], ['· chef de chantier', '· رئيس الورش', '· chef d lchantier']];
function terms(t, L) { for (const row of TERMS) if (row[IDX[L]] && t.includes(row[0])) t = t.split(row[0]).join(row[IDX[L]]); if (L === 'ar' || L === 'dar') for (const [fr, ar, dar] of PARENTE) t = t.split(fr).join(L === 'ar' ? ar : dar); return t; }

// ---------- Échanges : phrases connues, dans les six langues ----------
// [fr, ar, dar, shi, rif, tzm]. Les messages d'exemple, les réponses rapides et les vocaux d'exemple y sont tous.
const PH = [
  ["Bonsoir Rachid, les fondations avancent ? J'ai vu les photos du ferraillage.", 'مساء الخير رشيد، هل تتقدم الأساسات؟ رأيت صور الحديد.', 'Msa lkhir Rachid, lassasat ghadyin mzyan? Chft tsawer dyal lhdid.', 'Msa lkhir Rachid, is lassas ar ittkemmal? Zrigh tsawer n uzzal.', 'Msa lkhir Rachid, lassas mamec iteddu? Zrigh tsawer n uzzal.', 'Msa lkhir Rachid, is lassas ar ittkemmal? Zrigh tsawer n uzzal.'],
  ["Bonsoir Karim. Oui, le ferraillage des semelles et longrines est prêt. On ne coule qu'après le passage du contrôleur.", 'مساء الخير كريم. نعم، حديد القواعد والروافد جاهز. لن نصب الخرسانة إلا بعد مرور المراقب.', 'Msa lkhir Karim. Ah, lhdid dyal ssmlat w lpoutrat wajed. Ma ghadi nsebbo lbeton hta idouz lcontrôleur.', 'Msa lkhir Karim. Ih, uzzal n ssmlat iwjed. Ur ra nsker lbeton ghas dffir ad iddu lcontrôleur.', 'Msa lkhir Karim. Ih, uzzal n ssmlat yewjed. Ur da nsker lbeton ghir mi ghad d-yas lcontrôleur.', 'Msa lkhir Karim. Ih, uzzal n ssmlat iwjed. Ur da nsker lbeton ghas dffir ad d-yas lcontrôleur.'],
  ["Je suis sur place. Le ferraillage est conforme au plan, je signe l'avis : le coulage peut se faire.", 'أنا في عين المكان. الحديد مطابق للتصميم، أوقع الرأي: يمكن صب الخرسانة.', 'Ana f lblasa. Lhdid mtabeq l tasmim, ghadi nsini lavis: imken tsebbo lbeton.', 'Hati gh ugharas. Uzzal imsasa d tasmim, ad sinigh lavis: tzdarm ad tskrm lbeton.', 'Aqa-yi dinni. Uzzal yemsasa d tasmim, ad sinigh lavis: tzemrem ad tegm lbeton.', 'Hati da. Uzzal imsasa d tasmim, ad sinigh lavis: tzdarm ad tgm lbeton.'],
  ['Coulage terminé cet après-midi, photo jointe. On attaque les murs mardi 29.', 'انتهى صب الخرسانة بعد ظهر اليوم، الصورة مرفقة. نبدأ الجدران يوم الثلاثاء 29.', 'Salina lbeton had laachiya, tswira mlsoqa. Ghadi nbdaw lhyout nhar tlat 29.', 'Nkmml lbeton tadggwat ad, tswira tlla. Ad nbdu lhyout ass n tlata 29.', 'Nekmel lbeton tameddit-a, tswira tella. Ad nebdu lhyout ass n tlata 29.', 'Nkmel lbeton tadggwat-a, tswira tlla. Ad nbdu lhyout ass n tlata 29.'],
  ['Merci à tous les deux. Je règle la tranche 1 demain soir.', 'شكرا لكما. سأدفع الشطر 1 غدا مساء.', 'Choukran bjouj. Ghadi nkhelles ttranche 1 ghedda f llil.', 'Tanmirt i kunni sin. Ad khellsgh ttranche 1 azekka tadggwat.', 'Thanmirt i kenniw. Ad khellsegh ttranche 1 azekka tameddit.', 'Tanmirt i kunni sin. Ad khellsegh ttranche 1 azekka tameddit.'],
  ["Les aciers des poteaux d'angle sont-ils tous en place ? Je ne les distingue pas bien sur la photo.", 'هل حديد أعمدة الزوايا كله في مكانه؟ لا أراه جيدا في الصورة.', 'Lhdid dyal lpotoyat dyal lqent kollo f blasto? Ma kanbanch mzyan f tswira.', 'Is uzzal n lpotoyat n tghmert illa kullu gh ublas nnes? Ur t-zrigh mzyan gh tswira.', 'Ma uzzal n lpotoyat n tghmert yella marra di ublas-nnes? Ur t-zrigh mlih di tswira.', 'Is uzzal n lpotoyat n tghmert illa kullu gh ublas nnes? Ur t-zrigh mzyan gh tswira.'],
  ["Oui, le ferraillage est prêt. On attend la visite avant de couler ; je vous envoie une photo de l'angle nord.", 'نعم، الحديد جاهز. ننتظر الزيارة قبل الصب؛ سأرسل لك صورة للزاوية الشمالية.', 'Ah, lhdid wajed. Kantsennaw lviziti qbel ma nsebbo; ghadi nsiftlek tswira dyal lqent chamali.', 'Ih, uzzal iwjed. Ar nqql tamzrit dat lbeton; ad ak-d-azngh tswira n tghmert n ugafa.', 'Ih, uzzal yewjed. Qa nettraju tamzrit zzat lbeton; ad ak-d-sifdegh tswira n tghmert n ugafa.', 'Ih, uzzal iwjed. Ar nttraju tamzrit dat lbeton; ad ak-d-azngh tswira n tghmert n ugafa.'],
  ['Parfait, merci.', 'ممتاز، شكرا.', 'Mzyan bezzaf, choukran.', 'Ifulki, tanmirt.', 'Ifulki, thanmirt.', 'Ifulki, tanmirt.'],
  ["Bonjour, l'angle nord est prêt. Je vous envoie la photo tout de suite, et le béton sera coulé après le passage du contrôleur.", 'السلام، الزاوية الشمالية جاهزة. سأرسل لك الصورة الآن، والخرسانة ستصب بعد مرور المراقب.', "Salam, l'angle chamali wajed. Ghadi nsiftlek tswira daba, w lbeton ghadi ykoun mn baad ma idouz lcontrôleur.", 'Azul, tighmert n ugafa twjed. Ad ak-d-azngh tswira ghila, lbeton ad ig dffir ad iddu lcontrôleur.', 'Azul, tghmert n ugafa tewjed. Ad ak-d-sifdegh tswira drus-a, lbeton ad yili mi ghad d-yas lcontrôleur.', 'Azul, tighmert n ugafa twjed. Ad ak-d-azngh tswira dghi, lbeton ad yili dffir ad d-yas lcontrôleur.'],
  ["Le ciment n'est pas encore arrivé. Il arrivera demain.", 'الإسمنت لم يصل بعد. سيصل غدا.', 'Ssima mazal ma wslat. Ghadi tji ghedda.', 'Ssima ur ta d-tlkim. Ad d-tas azekka.', 'Ssima ur d-tewwid ca. Ad d-tas azekka.', 'Ssima ur ta d-tewwid. Ad d-tas azekka.'],
  ['Bonjour, je passe demain matin sur le chantier. Envoyez-moi une photo des aciers avant le coulage.', 'مرحبا، سأمر غدا صباحا إلى الورش. أرسل لي صورة للحديد قبل الصب.', 'Salam, ghadi ndouz ghedda sbah l chantier. Siftli tswira dyal lhdid qbel ma tsebbo lbeton.', 'Azul, ad zrigh s uchanti azekka f tifawt. Azn-iyi-d tswira n uzzal dat lbeton.', 'Azul, ad d-zregh ghar uchanti azekka zi tufat. Sifed-ayi-d tswira n uzzal zzat lbeton.', 'Azul, ad d-zrigh s uchanti azekka f tifawt. Azn-iyi-d tswira n uzzal dat lbeton.'],
  ['Bonjour. Demain matin, nous coulons le béton de la dalle.', 'مرحبا. غدا صباحا نصب خرسانة البلاطة.', 'Salam. Ghedda sbah ghadi nsebbo lbeton dyal ddala.', 'Azul. Azekka f tifawt ad nsker lbeton n ddala.', 'Azul. Azekka zi tufat ad negg lbeton n ddala.', 'Azul. Azekka f tifawt ad negg lbeton n ddala.'],
  // Vague 8 : contestation, réponse du contrôleur et avis signés de l'exemple, lus dans chaque langue (indicatif).
  ["Je voudrais voir les deux poteaux d'angle avant le coulage : la photo n'en montre qu'un.", 'أريد أن أرى عمودي الزاوية قبل الصب: الصورة لا تظهر إلا واحدا.', 'Bghit nchouf jouj lpotoyat dyal lqent qbel ma tsebbo: tswira kat-ban ghir wahed.', 'Riɣ ad zrɣ sin lpotoyat n tghmert dat lbeton: tswira ur d-tssbayan ghas yan.', 'Xseɣ ad zreɣ sin lpotoyat n tghmert zdat lbeton: tswira war d-tsekkan ghas iwen.', 'Riɣ ad zrɣ sin lpotoyat n tghmert dat lbeton: tswira ur d-tssbayan ghas yan.'],
  ["La photo prise sur place montre les deux poteaux d'angle côté jardin dans le même cadre ; les cales sont en place sur chacun.", 'الصورة الملتقطة في عين المكان تظهر عمودي الزاوية من جهة الحديقة في نفس الإطار؛ الفواصل موضوعة على كل منهما.', 'Tswira li tsawrat f lblasa kat-bayyen jouj lpotoyat dyal lqent jiht ljnan f nafs lcadre; lcalat f blasthom f jouj.', 'Tswira lli ittwassiwrn g ublas ar d-tssbayan sin lpotoyat n tghmert n urti g yan lcadre; lcalat llan g kraygat yan.', 'Tswira i yettwassiwren di ublas qa d-tsekkan sin lpotoyat n tghmert n urti di iwen lcadre; lcalat llant di kul iwen.', 'Tswira lli ittwassiwrn g ublas ar d-tssbayan sin lpotoyat n tghmert n urti g yan lcadre; lcalat llan g kraygat yan.'],
  ['Le début déclaré ne correspond pas : mon père est passé, rien ne bouge sur le terrain.', 'البداية المصرح بها غير صحيحة: مر والدي، ولا شيء يتحرك في الأرض.', 'Lbdya li galo ma kat-tsabqch: bba daz, walou ma kaytherrek f lard.', 'Tizwuri lli nnan ur tmsasa: baba izri, ur iḥrrk kra g wakal.', 'Tizwuri i nnan war tmsasa: baba yezri, war yeḥrrek wala di wakal.', 'Tizwuri lli nnan ur tmsasa: baba izri, ur iḥrrk kra g wakal.'],
  ["Cales d'enrobage absentes sur les deux poteaux d'angle côté jardin : à poser avant de couler.", 'فواصل التغطية غير موجودة على عمودي الزاوية من جهة الحديقة: يجب وضعها قبل الصب.', 'Lcalat dyal lenrobage ma kaynach f jouj lpotoyat dyal lqent jiht ljnan: khasshom ythatto qbel ma tsebbo.', 'Lcalat n lenrobage ur llin g sin lpotoyat n tghmert n urti: ixssa ad ttwagan dat lbeton.', 'Lcalat n lenrobage war llint di sin lpotoyat n tghmert n urti: kha ad ttwagent zdat lbeton.', 'Lcalat n lenrobage ur llin g sin lpotoyat n tghmert n urti: ixssa ad ttwagan dat lbeton.'],
  ["Contre-visite : cales d'enrobage de 3 cm (poteaux hors sol) posées sur les deux poteaux d'angle côté jardin. Le coulage peut se faire.", 'زيارة مضادة: فواصل تغطية بسمك 3 سم موضوعة على عمودي الزاوية من جهة الحديقة. يمكن صب الخرسانة.', 'Contre-visite: lcalat dyal 3 cm mhattin f jouj lpotoyat dyal lqent jiht ljnan. Imken tsebbo lbeton.', 'Tamzrit tis snat: lcalat n 3 cm ttwagan g sin lpotoyat n tghmert n urti. Tzdarm ad tgm lbeton.', 'Tamzrit tis snat: lcalat n 3 cm ttwagent di sin lpotoyat n tghmert n urti. Tzemrem ad tegm lbeton.', 'Tamzrit tis snat: lcalat n 3 cm ttwagan g sin lpotoyat n tghmert n urti. Tzdarm ad tgm lbeton.'],
  ["Ferraillage des semelles et longrines conforme au plan du bureau d'études : diamètres, espacements et cales d'enrobage de 5 cm au moins (béton en contact avec le sol, d’après la note de calcul du bureau d’études). Le coulage peut se faire.", 'حديد القواعد والروافد مطابق لتصميم مكتب الدراسات: الأقطار والمسافات وفواصل التغطية 5 سم على الأقل. يمكن صب الخرسانة.', 'Lhdid dyal ssmlat w lpoutrat mtabeq l tasmim dyal lbureau d\'études: lqotr, lmasafat w lcalat 5 cm 3la l2aqal. Imken tsebbo lbeton.', 'Uzzal n ssmlat d lpoutrat imsasa d tasmim n lbureau d\'études: lqotr, lmasafat d lcalat n 5 cm ugar. Tzdarm ad tgm lbeton.', 'Uzzal n ssmlat d lpoutrat yemsasa d tasmim n lbureau d\'études: lqotr, lmasafat d lcalat n 5 cm ugar. Tzemrem ad tegm lbeton.', 'Uzzal n ssmlat d lpoutrat imsasa d tasmim n lbureau d\'études: lqotr, lmasafat d lcalat n 5 cm ugar. Tzdarm ad tgm lbeton.'],
  ['Ferraillage de la dalle conforme à la note : nappes, espacements, cales et réservations en place.', 'حديد البلاطة مطابق للمذكرة: الشبكات والمسافات والفواصل والفتحات في مكانها.', 'Lhdid dyal ddala mtabeq l nota: chbakat, lmasafat, lcalat w lfat7at f blasthom.', 'Uzzal n ddala imsasa d nota: chbakat, lmasafat, lcalat d lfatḥat g ublas nsen.', 'Uzzal n ddala yemsasa d nota: chbakat, lmasafat, lcalat d lfatḥat di ublas nsen.', 'Uzzal n ddala imsasa d nota: chbakat, lmasafat, lcalat d lfatḥat g ublas nsen.'],
  ["Les cales sont posées sur les deux poteaux d'angle. On attend la contre-visite.", 'الفواصل موضوعة على عمودي الزاوية. ننتظر الزيارة المضادة.', 'Lcalat thattaw f jouj lpotoyat dyal lqent. Kantsennaw lcontre-visite.', 'Lcalat ttwagan g sin lpotoyat n tghmert. Ar nqql tamzrit tis snat.', 'Lcalat ttwagent di sin lpotoyat n tghmert. Qa nettraju tamzrit tis snat.', 'Lcalat ttwagan g sin lpotoyat n tghmert. Ar nqql tamzrit tis snat.'],
  ...UI.filter((r) => ['Bien reçu', 'Envoyez une photo', 'Appelez-moi', 'Retard de livraison', 'Je passe demain', 'Merci', 'Je regarde'].includes(r[0])),
];
const COL = { fr: 0, ar: 1, dar: 2, shi: 3, rif: 4, tzm: 5 };
const PHMAPS = Object.fromEntries(Object.keys(COL).map((k) => [k, new Map(PH.map((row) => [norm(row[COL[k]]).toLowerCase(), row]))]));
// Vocaux d'exemple (quand il n'y a pas de micro) : une phrase dans chaque langue.
export const VOICE_SAMPLES = {
  fr: PH[10][0], ar: PH[10][1], dar: PH[8][2], shi: PH[11][3], rif: PH[9][4], tzm: PH[9][5],
};
// Réponses rapides, avec leur pictogramme (pour ceux qui lisent peu).
export const QUICK = [
  ['recu', 'Bien reçu', 'check'], ['photo', 'Envoyez une photo', 'camera'], ['appel', 'Appelez-moi', 'phone'],
  ['retard', 'Retard de livraison', 'truck'], ['demain', 'Je passe demain', 'calendar'], ['merci', 'Merci', 'check'], ['regarde', 'Je regarde', 'eye'],
];
export const quickText = (k, L) => { const q = QUICK.find((x) => x[0] === k); return q ? (L === 'fr' ? q[1] : uiText(q[1], L)) : ''; };

// Traduit un texte d'une langue à une autre ; null si la phrase n'est pas connue.
export function translate(text, from, to) {
  if (!text) return null;
  if (from === to) return text;
  const row = (PHMAPS[from] || PHMAPS.fr).get(norm(text).toLowerCase());
  if (row) return row[COL[to]];
  // Phrases d'interface (« Envoyez une photo de l'angle nord », « Photo demandée : … »), seulement depuis le français.
  if (from === 'fr') { const u = uiText(text, to); if (u && (to === 'fr' || u !== text)) return u; }
  // Phrase par phrase.
  const parts = norm(text).split(/(?<=[.?!])\s+/);
  if (parts.length > 1) { const out = parts.map((x) => { const r = (PHMAPS[from] || PHMAPS.fr).get(x.toLowerCase()); return r ? r[COL[to]] : null; }); if (out.every(Boolean)) return out.join(' '); }
  return null;
}

// Lecture d'un message par un rôle : texte affiché, et s'il est traduit.
export function readMessage(m, L) {
  const from = m.lang || 'fr';
  const src = m.quick ? quickText(m.quick, from) || m.text : m.text;
  const da = L === 'dar' && darAr();
  if (from === L || !src) return { text: da && from === 'dar' ? arabize(src) : src, translated: false, from };
  if (m.trFix && m.trFix[L]) return { text: da ? arabize(m.trFix[L].text) : m.trFix[L].text, translated: true, from, original: src, fixed: m.trFix[L] };   // vague 17 : traduction corrigée, signée
  const t = m.quick ? quickText(m.quick, L) : (m.tr && m.tr[L]) || translate(src, from, L);
  // Vague 25 (jury n° 23) : une phrase française restée sans traduction n'est jamais « translittérée » en lettres arabes : elle reste en français, dite non traduite.
  if (da && t && from === 'fr' && norm(t) === norm(src)) return { text: src, translated: false, from, missing: true };
  return t ? { text: da ? arabize(t) : t, translated: true, from, original: src } : { text: src, translated: false, from, missing: true };
}

// ---------- Vague 10 : darija en lettres arabes (option) ----------
// La darija de l'appli est écrite en lettres latines, comme sur WhatsApp. Pour qui lit l'écriture arabe, une option la
// transcrit en lettres arabes, automatiquement (approximatif, dit à l'écran). La voix arabe du téléphone la lit alors mieux.
export const darAr = () => { try { return !!get().prefs.darijaArabe; } catch { return false; } };
const AR_NOMS = { rachid: 'رشيد', karim: 'كريم', amina: 'أمينة', nador: 'الناظور', mohamed: 'محمد', said: 'سعيد', 'saïd': 'سعيد', brahim: 'إبراهيم', nadia: 'نادية', choukran: 'شكرا', salam: 'السلام', lclient: 'الكليان', lcontrôleur: 'الكونترولور', charika: 'الشركة', lbeton: 'البيطون', teeqa: 'TEEQA' };
const AR_DI = [['kh', 'خ'], ['ch', 'ش'], ['sh', 'ش'], ['gh', 'غ'], ['ou', 'و'], ['th', 'ث'], ['dh', 'ذ']];
const AR_1 = { a: 'ا', b: 'ب', c: 'ك', d: 'د', e: '', 'é': 'ي', 'è': 'ي', 'ê': 'ي', f: 'ف', g: 'ڭ', h: 'ه', i: 'ي', 'î': 'ي', 'ï': 'ي', j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'و', 'ô': 'و', p: 'ب', q: 'ق', r: 'ر', s: 'س', t: 'ت', u: 'و', 'û': 'و', 'ü': 'و', v: 'ف', w: 'و', x: 'كس', y: 'ي', z: 'ز', 'â': 'ا', 'à': 'ا', 'ç': 'س', '3': 'ع', '7': 'ح', '9': 'ق', '2': 'ء', '5': 'خ', 'ε': 'ع', 'ḥ': 'ح', 'ṭ': 'ط', 'ḍ': 'ض', 'ṣ': 'ص' };
function arWord(w) {
  if (!/[a-zàâçéèêîïôûüεḥṭḍṣ]/i.test(w) || /[A-Z]{2,}/.test(w) || /^\d+$/.test(w)) return w;   // nombres, sigles (DH, TEEQA, PDF)
  const low = w.toLowerCase().replace(/['’]/g, ''); if (AR_NOMS[low]) return AR_NOMS[low];
  let out = '', i = 0;
  const start = /^[aeiouéèêô]/.test(low);
  if (start) { if (low.startsWith('ou') || /^[ouô]/.test(low)) { out = 'أو'; i = low.startsWith('ou') ? 2 : 1; } else { out = low[0] === 'i' ? 'إ' : 'أ'; i = 1; } }
  while (i < low.length) { const two = low.slice(i, i + 2), di = AR_DI.find(([k]) => k === two); if (di) { out += di[1]; i += 2; continue; } const c = low[i]; out += c in AR_1 ? AR_1[c] : c; i++; }
  return out.replace(/(.)\1+/g, '$1');   // une lettre doublée s'écrit une fois (la chadda n'est pas notée)
}
export function arabize(t) { if (!t) return t; return String(t).replace(/\{\w+\}|[A-Za-zÀ-ÿεḥṭḍṣ0-9'’]+/g, (w) => /^\d+$/.test(w) || w[0] === '{' ? w : arWord(w)).replace(/,/g, '،').replace(/\?/g, '؟').replace(/;/g, '؛'); }
// Une phrase d'interface entièrement traduite en darija (jamais une phrase française à moitié remplacée).
function darFull(fr) { const n = norm(fr), row = UIMAP.get(n) || UIMAP.get(n.replace(/[.:]$/, '')); if (row) return row[IDX.dar]; for (const [rx, outs] of PATTERNS) if (outs[IDX.dar - 1] && rx.test(n)) return n.replace(rx, (...m) => outs[IDX.dar - 1].replace(/\$(\d)/g, (_, k) => { const v = m[+k]; const b = BITMAP.get(norm(v)); return b ? b[IDX.dar] : (slotTr(v, 'dar') || ROLE_TR[v]?.[1] || v); })); return null; }   // vague 18 : mêmes motifs qu'en darija latine
export const uiOut = (fr, L) => L === 'dar' && darAr() ? (() => { const d = darFull(fr) || dateTr(norm(fr), 'dar'); return d ? arabize(d) : null; })() : uiText(fr, L);   // vague 25 (jury n° 23) : les titres de date aussi en lettres arabes

// ---------- Langue courante ----------
export const lang = () => { try { return langOf(get().role); } catch { return 'fr'; } };
export const isRtl = (L = lang()) => LANGS[L] && LANGS[L].dir === 'rtl';

// Traduit l'écran affiché (textes, aide aux lecteurs d'écran, champ de saisie) ; jamais les messages ni les saisies.
const ORIG = new WeakMap();
export function localize(root, L = lang()) {
  if (!root || L === 'fr') return;
  const skip = (n) => n.parentElement && n.parentElement.closest('[data-notr], textarea, script, style, .sheet-lang');
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const todo = [];
  for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.nodeValue.trim() && !skip(n)) todo.push(n);
  for (const n of todo) { const raw = n.nodeValue, tt = raw.trim(), o = ORIG.get(n) || tt, out = uiOut(o, L); if (out && out !== tt) { ORIG.set(n, o); n.nodeValue = raw.replace(tt, out); } }
  // Vague 23 (jury n° 2, 5 groupes) : dans un nom saisi (« Mohamed (père du client) »), seul le lien de parenté se traduit ; le nom reste tel quel.
  if (L === 'ar' || L === 'dar') { const tp = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); for (let n = tp.nextNode(); n; n = tp.nextNode()) { if (!n.parentElement || !n.parentElement.closest('[data-notr]') || n.parentElement.closest('.msg, textarea, .sheet-lang') || !/\((père|mère|frère|sœur|fils|fille|oncle|tante|cousin|cousine|épouse|époux|mari|femme)[^)]*\)/.test(n.nodeValue)) continue; let v = n.nodeValue; for (const [fr, ar, dar] of PARENTE) v = v.split(fr).join(L === 'ar' ? ar : dar); if (v !== n.nodeValue) n.nodeValue = v; } }
  const els = root.querySelectorAll ? root.querySelectorAll('[placeholder], [aria-label]') : [];
  for (const e of els) { if (e.closest('[data-notr], .sheet-lang')) continue;
    for (const a of ['placeholder', 'aria-label']) { const v = e.getAttribute(a); if (!v) continue; const out = uiOut(v, L); if (out && out !== v) e.setAttribute(a, out); } }
}
// Sens d'écriture et langue de l'appli (#app) : l'arabe s'affiche de droite à gauche.
export function applyDir(L = lang()) {
  const app = document.getElementById('app'); if (!app) return;
  const da = L === 'dar' && darAr();
  app.setAttribute('dir', da ? 'rtl' : LANGS[L] ? LANGS[L].dir : 'ltr');
  app.setAttribute('lang', da ? 'ary-Arab' : LANGS[L] ? LANGS[L].html : 'fr');
}
// Un seul observateur : chaque écran, feuille ou message ajouté est traduit à son arrivée (rien à faire dans les écrans).
let watching = false;
export function initLangues() {
  if (watching) return; watching = true;
  const app = document.getElementById('app'); if (!app) return;
  applyDir();
  new MutationObserver((list) => { const L = lang(); applyDir(L); if (L === 'fr') return;
    for (const m of list) for (const n of m.addedNodes) { if (n.nodeType === 1) localize(n, L); else if (n.nodeType === 3 && n.parentElement) localize(n.parentElement, L); } })
    .observe(app, { childList: true, subtree: true });
  document.addEventListener('click', onClick, true);
}

// ---------- Lecture à voix haute (synthèse du navigateur) ----------
function voiceFor(L) {
  const s = window.speechSynthesis; if (!s) return null;
  const vs = s.getVoices ? s.getVoices() : [], want = LANGS[L] && LANGS[L].tts;
  return (want && (vs.find((v) => v.lang === want) || vs.find((v) => v.lang && v.lang.toLowerCase().startsWith(want.slice(0, 2).toLowerCase())))) || null;
}
// 20 nov. : voix amazighes en fichiers audio (modèles libres MMS de Meta, CC-BY-NC) dans assets/voix/<langue>/,
// une par phrase connue ; index.json relie le texte affiché au fichier. Tachelhit et tarifit : leur propre voix ;
// tamazight de l'Atlas : voix kabyle, la plus proche disponible. Texte sans fichier : on le dit, rien n'est lu faux.
const VOIX_DIR = 'assets/voix/'; let VOIX = null, voixAudio = null;
const vkey = (t) => norm(t).toLowerCase().replace(/[.:;!?…\s]+$/, '').trim();
try { if (typeof fetch === 'function') fetch(VOIX_DIR + 'index.json').then((r) => (r.ok ? r.json() : {})).then((j) => { VOIX = j; }).catch(() => { VOIX = {}; }); } catch { /* rien */ }
function voixFiles(t, L) {
  const m = VOIX && VOIX[L]; if (!m) return { files: [], missing: 1 };
  const files = [], segs = String(t).split(/\n+|(?<=[.!?;])\s+/).map((s) => s.trim()).filter((s) => vkey(s).length > 1); let missing = 0;
  for (const s of segs) { const f = m[vkey(s)]; if (f) { files.push(f); continue; }
    const parts = s.split(/\s+·\s+/).filter((p) => vkey(p).length > 1); let hit = 0;
    for (const p of parts) { const g = m[vkey(p)]; if (g) { files.push(g); hit++; } } if (!hit) missing++; }
  return { files: files.filter((f, i) => f !== files[i - 1]), missing };
}
function stopVoix() { if (voixAudio) { voixAudio.onended = voixAudio.onerror = null; try { voixAudio.pause(); } catch { /* rien */ } } voixAudio = null; }
function playVoix(files) {
  stopVoix(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* rien */ }
  let i = 0; const next = () => { if (i >= files.length) { voixAudio = null; return; } const a = new Audio(VOIX_DIR + files[i++]); voixAudio = a; a.onended = next; a.onerror = next; const p = a.play(); if (p && p.catch) p.catch(() => {}); };
  next();
}
export function speak(text, L = lang()) {
  const t = String(text || '').replace(/[ \t]+/g, ' ').trim(); if (!t) return { ok: false };
  if (['shi', 'rif', 'tzm'].includes(L)) { const { files, missing } = voixFiles(t, L);
    if (files.length) { const note = `voix de synthèse en ${LANGS[L].label.toLowerCase()}${L === 'tzm' ? ' (voix kabyle, la plus proche)' : ''}${missing ? ` · ${missing} passage${missing > 1 ? 's' : ''} sans voix, non lu${missing > 1 ? 's' : ''} : ${missing > 1 ? 'ils restent écrits' : 'il reste écrit'} à l’écran, en lettres latines : un proche peut les lire, ou TEEQA vous rappelle dans votre langue (Parler à quelqu’un)` : ''}`;   // vague 23 (jury n° 20)
      window.__teeqaSpoken = { text: t, lang: L, voice: 'fichier', files, missing, note }; playVoix(files); return { ok: true, note, voice: true }; } }
  let v = voiceFor(L), used = L, note = '';
  // Vague 10 : jamais lire faux. Sans voix de la langue sur le téléphone (tachelhit, tarifit, tamazight ; darija sans voix
  // arabe marocaine), on ne lit pas avec une voix d'une autre langue : on le dit et on propose autre chose.
  if (!v && L === 'dar' && darAr()) { v = voiceFor('ar'); used = 'ar'; note = v ? 'darija en lettres arabes, lue par la voix arabe du téléphone' : ''; }
  // Vague 18 NT (scènes 2, 4, 10) : darija en lettres latines, sans voix marocaine : elle est transcrite en lettres arabes
  // puis lue par la voix arabe du téléphone (prononciation approchée, dite dans la note).
  let said = t;
  if (!v && L === 'dar' && !darAr() && voiceFor('ar')) { v = voiceFor('ar'); used = 'ar'; said = arabize(t); note = 'darija transcrite en lettres arabes et lue par la voix arabe du téléphone : prononciation approchée'; }
  if (!v && (LANGS[L].amazigh || L === 'dar') && !(L === 'dar' && darAr())) { window.__teeqaSpoken = { text: t, lang: L, voice: null, noVoice: true }; return { ok: false, noVoice: true, L }; }
  window.__teeqaSpoken = { text: t, lang: L, voice: v ? v.lang : (LANGS[used] && LANGS[used].tts) || 'fr-FR', note };
  const s = window.speechSynthesis;
  if (!s || typeof SpeechSynthesisUtterance === 'undefined') return { ok: false, why: 'Lecture à voix haute indisponible sur ce navigateur' };
  try { s.cancel(); const u = new SpeechSynthesisUtterance(said); u.lang = v ? v.lang : (LANGS[used].tts || 'fr-FR'); if (v) u.voice = v; u.rate = 0.92; s.speak(u); } catch { return { ok: false, why: 'Lecture à voix haute indisponible' }; }
  return { ok: true, note, voice: !!v };
}
export const stopSpeaking = () => { stopVoix(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* rien */ } };
// « Écouter cet écran » : lit les zones visibles indiquées (titre, état, qui agit, carte de paiement, boutons).
export function speakScope(sel) {
  const zones = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null || e.getClientRects().length);
  const txt = zones.map((z) => { const c = z.cloneNode(true); c.querySelectorAll('[data-lact="listen"], .sr-skip, svg, img').forEach((x) => x.remove()); return c.innerText || c.textContent || ''; })
    .join('. ').replace(/\s*\n+\s*/g, '. ').replace(/(\.\s*){2,}/g, '. ');
  return speak(txt);
}

// ---------- Vocaux : micro si possible, sinon vocal d'exemple ----------
const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
export const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
// Transcription par le navigateur : français et arabe (darija comprise, en lettres arabes) ; pas de tamazight.
export const canTranscribe = (L) => !!SR() && ['fr', 'ar', 'dar'].includes(L);
export async function recordVoice(L, { onTick } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream), chunks = []; let transcript = '', rcg = null; const t0 = Date.now();
  rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
  if (canTranscribe(L)) { try { rcg = new (SR())(); rcg.lang = L === 'fr' ? 'fr-FR' : 'ar-MA'; rcg.continuous = true; rcg.interimResults = false;
    rcg.onresult = (e) => { transcript = [...e.results].map((r) => r[0].transcript).join(' '); }; rcg.start(); } catch { rcg = null; } }
  rec.start(); const tick = setInterval(() => onTick && onTick(Math.round((Date.now() - t0) / 1000)), 250);
  return {
    stop: () => new Promise((res) => { clearInterval(tick); rec.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); try { rcg && rcg.stop(); } catch { /* rien */ }
      await new Promise((r) => setTimeout(r, 400));
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      const audio = blob.size < 400000 ? await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(null); f.readAsDataURL(blob); }) : null;
      res({ dur: Math.max(1, Math.round((Date.now() - t0) / 1000)), audio, transcript: transcript.trim() }); }; rec.stop(); }),
    cancel: () => { clearInterval(tick); try { rec.stop(); rcg && rcg.stop(); } catch { /* rien */ } stream.getTracks().forEach((t) => t.stop()); },
  };
}
// Vague 20 (doigt : Fatima) : « Écouter » se voit. Le bouton devient « Arrêter », une ligne dit ce qui est lu et combien de
// temps ; elle disparaît à la fin de la lecture. Sans voix sur le téléphone, la feuille l'explique (rien de muet).
const LST = { fr: ['Arrêter', 'Lecture en cours', 's'], ar: ['إيقاف', 'القراءة جارية', 'ث'], dar: ['Wqqef', 'Kanqra', 's'], shi: ['Bedd', 'Ar ttɣri', 's'], rif: ['Bedd', 'Qa nɣerr', 's'], tzm: ['Bedd', 'Ar ttɣri', 's'] };
let listenTimer = null;
function listenReset(b) { clearInterval(listenTimer); listenTimer = null; stopSpeaking(); document.querySelectorAll('.listen-now').forEach((n) => n.remove()); if (!b) return; b.classList.remove('playing'); if (b.dataset.html) b.innerHTML = b.dataset.html; b.setAttribute('aria-pressed', 'false'); }
function listenToggle(b) {
  if (b.classList.contains('playing')) { listenReset(b); return; }
  const r = speakScope(b.dataset.scope || '.screen .scroll'); if (r.noVoice) { noVoiceSheet(r.L); return; }
  if (!r.ok) { sheetApi && sheetApi.toast(r.why || 'Rien à lire', 'info'); return; }
  const L = lang(), w = LST[L] || LST.fr, said = (window.__teeqaSpoken && window.__teeqaSpoken.text) || '';
  const dur = Math.max(4, Math.round(said.split(/\s+/).length / 2.4)); let left = dur;
  b.dataset.html = b.innerHTML; b.classList.add('playing'); b.setAttribute('aria-pressed', 'true');
  b.innerHTML = `<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>${w[0]}`;
  const row = b.parentElement; let box = document.createElement('div'); box.className = 'listen-now'; box.setAttribute('role', 'status'); box.dataset.testid = 'listen-now';
  box.setAttribute('data-testid', 'listen-now'); box.setAttribute('data-notr', '');
  const upd = () => { box.innerHTML = `<b>${w[1]} · ${left} ${w[2]}</b><span>« ${said.slice(0, 70).replace(/[<>&]/g, '')}${said.length > 70 ? '…' : ''} »</span>${r.note ? `<span>${r.note}</span>` : ''}`; };
  upd(); row.insertAdjacentElement('afterend', box);
  // Vague 26 (jury GPT n° 8, 4 personas) : les passages sans voix sont dits à l'écran, pas seulement dans la ligne qui s'efface.
  const miss = window.__teeqaSpoken && window.__teeqaSpoken.missing; if (miss && sheetApi) { sheetApi.toast(`${miss} passage${miss > 1 ? 's' : ''} sans voix : ${miss > 1 ? 'ils restent écrits' : 'il reste écrit'} à l’écran`, 'info'); const z = row.closest('.scroll, .screen'); if (z && !z.querySelector('[data-testid="sans-voix"]')) { const n = document.createElement('p'); n.className = 'meta'; n.dataset.testid = 'sans-voix'; n.setAttribute('data-testid', 'sans-voix'); n.style.margin = '6px 0 0'; n.textContent = `${miss} passage${miss > 1 ? 's' : ''} sans voix dans cette lecture, laissé${miss > 1 ? 's' : ''} en écrit : un proche peut ${miss > 1 ? 'les' : 'le'} lire, ou TEEQA vous rappelle dans votre langue (Parler à quelqu’un).`; box.insertAdjacentElement('afterend', n); } }
  clearInterval(listenTimer); listenTimer = setInterval(() => { left--; const talking = (() => { try { return window.speechSynthesis && window.speechSynthesis.speaking; } catch { return false; } })();
    const cur = document.querySelector('[data-lact="listen"].playing') || b; const bx = document.querySelector('.listen-now'); if (bx && bx !== box) box = bx;
    if (talking) b.__spoke = true; if ((left <= 0 && !talking) || (b.__spoke && !talking)) listenReset(cur); else { left = Math.max(left, 1); upd(); } }, 1000);
}
function msgReset(b) { clearInterval(b.__t); b.__t = null; b.__spoke = false; stopSpeaking(); b.classList.remove('playing'); b.removeAttribute('aria-pressed'); if (b.dataset.html) b.innerHTML = b.dataset.html; if (b.dataset.al != null) { if (b.dataset.al) b.setAttribute('aria-label', b.dataset.al); else b.removeAttribute('aria-label'); delete b.dataset.al; } }
export function playAudio(src) { try { const a = new Audio(src); a.play(); return true; } catch { return false; } }

// ---------- Choix de la langue (Profil, Paramètres, premier lancement) ----------
let sheetApi = null;   // { openSheet, closeSheet, toast } fourni par ui.js (évite une importation circulaire)
export const bindUi = (api) => { sheetApi = api; };
export function langChoices(cur, { compact = false } = {}) {
  const item = (k) => { const v = LANGS[k], on = k === cur;
    return `<button class="list-item" role="radio" aria-checked="${on}" data-lact="set-lang" data-lang="${k}" data-testid="lang-${k}" lang="${v.html}" dir="${v.dir}">
      <span class="grow"><span class="t" style="font-weight:800">${v.native}</span>${compact ? '' : `<div class="s" lang="fr" dir="ltr">${v.sub}</div>`}</span>
      <span class="radio-mark" aria-hidden="true">${on ? '✓' : ''}</span></button>`; };
  return `<div class="list" role="radiogroup" aria-label="Langue">${['fr', 'ar', 'dar'].map(item).join('')}</div>
    <div class="over" style="margin:12px 2px 6px" lang="zgh">ⵜⴰⵎⴰⵣⵉⵖⵜ · Tamazight</div>
    <div class="list" role="radiogroup" aria-label="Tamazight">${['shi', 'rif', 'tzm'].map(item).join('')}</div>
    ${compact ? '' : '<p class="meta" style="margin:6px 2px 0" data-notr data-testid="voix-note">Voix de synthèse, à faire relire par une personne qui parle la langue</p>'}`;
}
export function langSheet() {
  if (!sheetApi) return;
  const cur = lang();
  sheetApi.openSheet(`<div class="sheet-lang"><h2>Langue · اللغة · Tutlayt</h2>
    <p class="muted small" style="margin-bottom:12px">Chacun choisit sa langue : les messages des autres arrivent traduits, avec leur original juste en dessous (traduction indicative, sans valeur légale).</p>
    <p class="meta" style="margin:-6px 0 12px" data-testid="langue-portee"><b>Ce qui est traduit :</b> les écrans de tous les jours (chantiers, étapes, paiements, échanges) et un résumé de la convention et de l’annexe. Le texte complet de la convention, de l’annexe et des garanties reste en français, la langue qui fait foi ; « Parler à quelqu’un » vous l’explique dans votre langue.</p>
    ${langChoices(cur)}
    <button class="list-item" style="margin-top:8px" role="switch" aria-checked="${darAr()}" data-lact="dar-ar" data-testid="dar-ar"><span class="grow"><span class="t">Darija en lettres arabes · الدارجة بالحروف العربية</span><div class="s">Transcription automatique de la darija, approximative ; lue par la voix arabe du téléphone</div></span><span class="radio-mark" aria-hidden="true">${darAr() ? '✓' : ''}</span></button>
    <p class="meta" style="margin-top:12px" data-testid="auto-note">${AUTO_NOTE.fr}.${cur !== 'fr' ? ` <span lang="${LANGS[cur].html}" dir="${LANGS[cur].dir}">${AUTO_NOTE[cur]}.</span>` : ''}</p>
    <button class="btn ghost block" data-act="sheet-close" style="margin-top:12px">Fermer</button></div>`, { label: 'Langue' });
}
// Vague 10 : pas de voix de lecture dans la langue : on le dit, sans lire faux, et on propose le vocal d'origine, un proche ou TEEQA.
function noVoiceSheet(L) {
  if (!sheetApi) return; const v = LANGS[L] || LANGS.fr;
  sheetApi.openSheet(`<div data-notr data-testid="no-voice"><h2>Pas encore de voix en ${v.label.toLowerCase()} pour ce texte</h2>
    <p class="muted small" style="margin-bottom:12px">${v.amazigh ? `TEEQA a des voix en ${v.label.toLowerCase()} pour les phrases courantes, pas encore pour celle-ci.` : `Les téléphones n'ont pas encore de voix de lecture en ${v.label.toLowerCase()}.`} TEEQA ne la lit pas avec une voix d'une autre langue sans vous le dire : si vous choisissez « Écouter en français », elle sera lue en français.</p>
    <ul class="losange" style="margin-bottom:12px"><li><b>Écouter le vocal d'origine :</b> dans les échanges, un vocal se réécoute tel qu'il a été dit, avec la voix de la personne.</li><li><b>Demander à un proche :</b> invitez-le sur le chantier (Invitations et accès) ; il vous lit ou vous résume les messages.</li><li><b>Être rappelé par TEEQA :</b> un conseiller vous explique l'écran de vive voix, en ${v.label.toLowerCase()}.</li></ul>
    <div class="stack" style="gap:8px"><button class="btn saffron block" data-act="humain">Être rappelé dans ma langue</button><button class="btn ghost block" data-lact="say-fr">Écouter en français quand même</button><button class="btn text block" data-act="sheet-close">Fermer</button></div></div>`, { label: 'Lecture à voix haute' });
}
export const langName = (k) => { const v = LANGS[k] || LANGS.fr; if (k === 'dar' && darAr()) return 'Darija · الدارجة'; return v.amazigh ? v.label : v.native; };   // vague 13 : l'amazigh s'écrit ici en lettres latines ; pas de tifinagh dans les échanges

function onClick(e) {
  const b = e.target.closest('[data-lact]'); if (!b) return;
  const act = b.dataset.lact;
  if (act === 'lang-sheet') { e.stopPropagation(); langSheet(); }
  // Vague 8 : la langue se choisit dès le premier écran ; elle vaut pour tous les rôles tant qu'on n'en choisit pas une autre.
  else if (act === 'first-lang') { e.stopPropagation(); const k = b.dataset.lang; actions.setLangDefault(k); applyDir(k);
    b.parentElement.querySelectorAll('[data-lact="first-lang"]').forEach(x => { const on = x === b; x.classList.toggle('success', on); x.classList.toggle('outline', !on); x.setAttribute('aria-checked', String(on)); });
    const app = document.getElementById('app'); if (app && k !== 'fr') localize(app, k);
    // Vague 20 : choix fait dans la feuille « Langue » du premier écran : on la ferme et la touche affiche la langue choisie.
    if (b.closest('.sheet') || b.closest('[role=dialog]')) { const lb = document.querySelector('[data-testid="first-lang"] [data-notr]'); if (lb) lb.textContent = b.textContent.trim(); const sl = document.querySelector('[data-testid="su-lang"]'); if (sl && sl.firstChild) sl.firstChild.textContent = b.textContent.trim(); setTimeout(() => sheetApi && sheetApi.closeSheet(), 120); } }
  else if (act === 'set-lang') { e.stopPropagation(); const k = b.dataset.lang; actions.setLang(get().role, k); applyDir(k);
    if (b.closest('.sheet-lang')) { sheetApi && sheetApi.closeSheet(); }
    sheetApi && sheetApi.toast(k === 'fr' ? 'Langue : français' : `${LANGS[k].amazigh ? LANGS[k].label : LANGS[k].native} · ${AUTO_NOTE[k]}`, 'check'); }
  else if (act === 'listen') { e.stopPropagation(); listenToggle(b); }
  else if (act === 'speak') { e.stopPropagation();
    // Vague 22 (doigt : Fatima) : « Écouter ce message » se voit aussi : le bouton devient « Arrêter » pendant la lecture.
    if (b.classList.contains('playing')) { msgReset(b); return; } document.querySelectorAll('[data-lact="speak"].playing').forEach(msgReset);
    const r = speak(b.dataset.text || '', b.dataset.lang || lang()); if (r.noVoice) { noVoiceSheet(r.L); return; } if (!r.ok && sheetApi) { sheetApi.toast(r.why || 'Lecture indisponible', 'info'); return; } else if (r.note && sheetApi) sheetApi.toast(r.note, 'bell');
    if (r.ok) { const w = LST[lang()] || LST.fr, said = String(b.dataset.text || ''); let left = Math.max(3, Math.round(said.split(/\s+/).length / 2.4));
      b.dataset.html = b.innerHTML; b.classList.add('playing'); b.setAttribute('aria-pressed', 'true'); b.innerHTML = `<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>${w[0]}`; b.dataset.al = b.getAttribute('aria-label') || ''; b.setAttribute('aria-label', `${w[0]} · ${w[1].toLowerCase()}`);   // vague 25 (doigt : Hadda) : libellé court, jamais coupé à 150 %
      b.__t = setInterval(() => { left--; let talking = false; try { talking = !!(window.speechSynthesis && window.speechSynthesis.speaking) || !!voixAudio; } catch { /* rien */ } if (talking) b.__spoke = true; if ((left <= 0 && !talking) || (b.__spoke && !talking)) msgReset(b); }, 1000); } }
  else if (act === 'dar-ar') { e.stopPropagation(); actions.pref({ darijaArabe: !darAr() }); if (lang() !== 'dar') actions.setLang(get().role, 'dar'); applyDir('dar'); sheetApi && sheetApi.closeSheet(); sheetApi && sheetApi.toast(darAr() ? 'Darija en lettres arabes · الدارجة بالحروف العربية' : 'Darija en lettres latines', 'check'); }
  else if (act === 'say-fr') { e.stopPropagation(); sheetApi && sheetApi.closeSheet(); const z = document.querySelector('.screen:last-of-type .scroll'); const t = z ? z.innerText : ''; window.__teeqaSpoken = { text: t, lang: 'fr', voice: 'fr-FR' }; try { const u = new SpeechSynthesisUtterance(t.slice(0, 600)); u.lang = 'fr-FR'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { /* rien */ } }
  else if (act === 'orig') { e.stopPropagation(); const box = b.closest('.msg'), o = box && box.querySelector('[data-orig]'); if (!o) return; o.hidden = !o.hidden; b.textContent = o.hidden ? origLabel(lang()) : hideLabel(lang()); }
  else if (act === 'play') { e.stopPropagation();
    // Vague 23 (doigt : Zineb) : le vocal se voit aussi pendant qu'il joue (bouton enfoncé, ondes qui bougent), et se coupe d'un second toucher.
    if (b.classList.contains('playing')) { stopSpeaking(); clearInterval(b.__t); b.classList.remove('playing'); b.removeAttribute('aria-pressed'); b.closest('.voice-row')?.classList.remove('playing'); return; }
    const src = b.dataset.src; let r = { ok: true }; if (src) playAudio(src); else r = speak(b.dataset.text || '', b.dataset.lang || 'fr') || { ok: false };
    if (r && r.noVoice) { noVoiceSheet(r.L); return; }
    b.classList.add('playing'); b.setAttribute('aria-pressed', 'true'); const row = b.closest('.voice-row'); row && row.classList.add('playing');
    let left = 4; b.__t = setInterval(() => { left--; let talking = false; try { talking = !!(window.speechSynthesis && window.speechSynthesis.speaking) || !!voixAudio; } catch { /* rien */ } if (talking) b.__spoke = true; if ((left <= 0 && !talking) || (b.__spoke && !talking)) { clearInterval(b.__t); b.classList.remove('playing'); b.removeAttribute('aria-pressed'); row && row.classList.remove('playing'); } }, 1000); }
}

// ---------- Vague 8 : résumés de la convention et de l'annexe tarifaire, dans chaque langue ----------
// Le texte qui engage reste le français ; ce résumé l'explique en quelques lignes (indicatif). {S} suivi, {V} visite, {F} forfait 4 visites, {C} contre-visite, {CM} contre-visite courte.
const RESUMES = {
  convention: {
    ar: ['الزبون والمقاولة يتابعان الورش مرحلة بمرحلة داخل TEEQA.', 'المقاولة تصرح ببداية ونهاية كل مرحلة مع صور مؤرخة.', 'مراقب مستقل يمر في المراحل الأساسية ويوقع رأيا: مقبول، تحفظات، أو مرفوض.', 'TEEQA يقول «الدفع موصى به» أو «الدفع مؤجل»؛ الزبون هو من يقرر، والدفع يتم خارج TEEQA.', 'زيارة المراقب في أجل أقصاه 4 أيام بعد الطلب (6 أيام خارج المدن المغطاة)؛ إذا فات هذا الأجل، يطلب الزبون أو المقاولة وكالة أخرى بنقرة واحدة، ولا تُفوتر هذه الزيارة لأحد.', 'كل صورة وكل رأي يحملان ساعة الالتقاط وساعة التوصل في خادم TEEQA.', 'TEEQA لا يحسم الخلافات، ولا يحتفظ بمال الأشغال، ولا يشهد على الصور.'],
    dar: ['Lclient w charika kaytab3o lchantier marhala b marhala f TEEQA.', 'Charika katgol bdina w salina f kol marhala, b tsawer m2arrkhin.', 'Contrôleur mostaqil kaydouz f lmarahil lmohimma w kaysini lavis: Mqboul, b tahaffodat, wla Mrfoud.', 'TEEQA kaygol « Lkhlas mnsouh bih » wla « Lkhlas mwkhkhar »; lclient howa li kayqerrer, w lkhlas kaydouz bra TEEQA.', 'Lcontrôleur kaydouz f 4 iyam mn ba3d ttalab (6 iyam bra lmoudon li m3tiya); ila fat had lwaqt, lclient wla charika y9der ytleb wkala khra b nqra wahda, w had viziti ma kaykhllesha 7ta wa7ed.', 'Kol tswira w kol lavis fihom sa3a dyal ttsawer w sa3a fach wslo l serveur dyal TEEQA.', 'TEEQA ma kayhkemch f lkhilaf, ma kaydirch flous lkhedma 3ndo, w ma kaychahedch 3la tsawer.'],
    shi: ['Lclient d tcharikt ar tfrn achanti lmarhala s lmarhala g TEEQA.', 'Tcharikt ar tnna tizwuri d tagara n kraygat lmarhala, s tsawer gant azmz.', 'Yan lcontrôleur ur ittafn yan ar izri g lmarahil ixatarn, ar isina lavis: Iqbl, s tahaffudat, nigh Iggi.', 'TEEQA ar inna « Lkhlas ifulki » nigh « Lkhlas ittwakhkhar »; lclient ad igzzmn, lkhlas ar ittili bra n TEEQA.', 'TEEQA ur ittgzam amsgal, ur ittamz idrimn n twuriwin, ur isbddad tsawer.'],
    rif: ['Lclient d tcharikt qa tfaren achanti lmarhala s lmarhala di TEEQA.', 'Tcharikt qa tini tizwuri d taggara n kul lmarhala, s tsawer ghant azmez.', 'Iwen lcontrôleur war yettafen hed qa yezzar di lmarahil ixatarn, qa yesina lavis: Yeqbel, s tahaffudat, negh Yugi.', 'TEEQA qa yeqqar « Lkhlas yelha » negh « Lkhlas yettwakhkher »; lclient ad igezzmen, lkhlas qa yettili beεd zi TEEQA.', 'TEEQA war yettgezzam amsgal, war yettaf idrimen n ixeddimen, war yessebdad tsawer.'],
    tzm: ['Lclient d tcharikt ar tfrn achanti lmarhala s lmarhala g TEEQA.', 'Tcharikt ar tnna tizwuri d tagara n kraygat lmarhala, s tsawer gant azmz.', 'Yan lcontrôleur ur ittafn yan ar izri g lmarahil ixatarn, ar isina lavis: Iqbl, s tahaffudat, nigh Iggi.', 'TEEQA ar inna « Lkhlas ifulki » nigh « Lkhlas ittwakhkhar »; lclient ad igzzmn, lkhlas ar ittili bra n TEEQA.', 'TEEQA ur ittgzam amsgal, ur ittamz idrimn n twuriwin, ur isbddad tsawer.'],
  },
  annexe: {
    ar: ['الزبون يدفع لـ TEEQA مرة واحدة: {S} للتتبع + {V} عن كل زيارة (4 زيارات = {F}).', 'كل زيارة بنفس الثمن، سواء كانت ضمن الباقة أو مضافة: {V}.', 'الزيارة المضادة على حساب المقاولة: {CM} لنقطة أو نقطتين، {C} لأكثر أو بعد الرفض، ولا تتجاوز أبدا ثمن زيارة.', 'ثمن الأشغال يُدفع مباشرة من الزبون إلى المقاولة، خارج TEEQA.'],
    dar: ['Lclient kaykhelles TEEQA mra wahda: {S} dyal ttatabo3 + {V} 3la kol viziti (4 viziti = {F}).', 'Kol viziti b nafs taman, wakha tkoun f lforfait wla zayda: {V}.', 'Lcontre-visite 3la charika: {CM} l noqta wla jouj, {C} ila kano ktar wla mn baad Mrfoud; 3omrha ma tfout taman viziti.', 'Taman lkhedma kaykhelso lclient l charika nichan, bra TEEQA.'],
    shi: ['Lclient ar ikhlls TEEQA yat twalt: {S} n tfrt + {V} i kraygat tamzrit (4 tmzrin = {F}).', 'Kraygat tamzrit s yan ttaman: {V}, g lforfait nigh tttwarnu.', 'Tamzrit tis snat f tcharikt: {CM} i yat tnqqidt nigh snat, {C} ig ugurn nigh dffir n Iggi; ur tzri ttaman n yat tamzrit.', 'Ttaman n twuriwin ar t-ikhlls lclient i tcharikt nichan, bra n TEEQA.'],
    rif: ['Lclient qa yekhelles TEEQA iwet n twalt: {S} n tfart + {V} i kul tamzrit (4 tmezrin = {F}).', 'Kul tamzrit s iwen n ttaman: {V}, di lforfait negh tettwarnu.', 'Tamzrit tis snat f tcharikt: {CM} i iwet n tneqqidt negh snat, {C} ma ggarent negh deffir n Yugi; war tezri ttaman n iwet n tamzrit.', 'Ttaman n ixeddimen qa t-yekhelles lclient i tcharikt nichan, beεd zi TEEQA.'],
    tzm: ['Lclient ar ikhlls TEEQA yat twalt: {S} n tfrt + {V} i kraygat tamzrit (4 tmzrin = {F}).', 'Kraygat tamzrit s yan ttaman: {V}, g lforfait nigh tttwarnu.', 'Tamzrit tis snat f tcharikt: {CM} i yat tnqqidt nigh snat, {C} ig ugurn nigh dffir n Iggi; ur tzri ttaman n yat tamzrit.', 'Ttaman n twuriwin ar t-ikhlls lclient i tcharikt nichan, bra n TEEQA.'],
  },
};
const ENGAGE = { ar: 'النص الذي يُلزم هو النص الفرنسي أسفله؛ هذا الملخص إرشادي.', dar: 'Nnass li kaylzem howa lfransawi li lte7t; had lmolakhas ghir bach tfhem.', shi: 'Aḍris lli ittgga lqanun ig tafransist ddaw; asgzl ad i tmssirt kad.', rif: 'Aḍris i yettgga lqanun d tafransist ddaw; asegzel-a i tmessirt kan.', tzm: 'Aḍris lli ittgga lqanun ig tafransist ddaw; asgzl ad i tmssirt kad.' };
export function resumeBlock(kind, L, vals = {}) {
  const da = L === 'dar' && darAr(), r0 = RESUMES[kind] && RESUMES[kind][L]; if (!r0) return '';
  const r = da ? r0.map(arabize) : r0, v = da ? { html: 'ary-Arab', dir: 'rtl' } : LANGS[L], fill = (t) => t.replace(/\{(\w+)\}/g, (_, k) => vals[k] || '');
  return `<div class="card stack" style="gap:6px" data-notr data-testid="resume-${kind}" lang="${v.html}" dir="${v.dir}"><span class="over">${da ? arabize(UIMAP.get('Résumé dans votre langue')[IDX[L]]) : UIMAP.get('Résumé dans votre langue')[IDX[L]]}</span>
    <ul style="margin:0;padding-inline-start:18px;display:grid;gap:4px">${r.map((t) => `<li>${fill(t)}</li>`).join('')}</ul>
    <p class="meta" style="margin:0">${da ? arabize(ENGAGE[L]) : ENGAGE[L]} · ${indicNote(L)}${da ? ' · transcription automatique en lettres arabes, approximative' : ''}</p></div>`;
}
