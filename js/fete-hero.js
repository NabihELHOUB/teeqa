// Héros de la célébration « Étape validée ». Chorégraphie lue image par image sur l'enregistrement de l'utilisateur
// (10 nov., 15 h 23, 30 i/s ; fiche : refs/ANIMATIONS-REFERENCE.md), transposée dans la DA de TEEQA.
// Comme dans la référence, le personnage est REDESSINÉ à chaque phase (trois dessins : dos, trois quarts, face) :
//   0,00 s        dos    de dos dans une goutte de flamme penchée
//   0,10 s  turn  3/4    elle tourne la tête vers nous, yeux ouverts ; la goutte se redresse (p1 à 0,13 s)
//   0,25 s  face  face   de face, yeux grands ouverts, pattes qui pendent
//   0,45 s  p2    face   yeux serrés, ramassée, elle tremble ; des traits tournent autour
//   0,93 s  rays         de longs traits partent de la goutte
//   1,02 s  hot          bord blanc, la goutte gonfle ; le fond passe au vert en deux images ; un œil s'ouvre (peek, 1,06 s)
//   1,155 s p3    face   éclat : tête levée, bec ouvert, yeux lumineux, ailes en V, pattes pendantes, croissant blanc
//   2,07 s  pre   face   élan : ailes dressées, corps tassé
//   2,13 s  p4    3/4    dans la grande flamme, penchée, bec vers la droite, yeux en fentes lumineuses
//   2,62 s  p5    3/4    yeux rieurs, étincelle à gauche
//   2,73 s  p6    3/4    la médaille en zellige glisse depuis la gauche et se cale, avec un éclat
// Les classes s'ajoutent sans jamais s'enlever ; tout le mouvement est dans css/fete.css.

const C = { w: '#FAF6EC', w2: '#E6DCC8', k: '#2B2D31', k2: '#45474C', o: '#EE9140', o2: '#C96F2A', g: '#14503F', g2: '#0E3B31', s: '#E2A33B', s2: '#A56E1C' };
const FLAME = 'M100 4C116 40 150 42 151 72C168 60 178 86 172 102C192 114 190 164 160 188C138 210 62 210 40 188C10 162 8 114 28 98C26 76 44 62 57 74C52 44 86 38 100 4Z';
const STAR4 = (x, y, r) => `M${x} ${y - r} L${x + r * 0.26} ${y - r * 0.26} L${x + r} ${y} L${x + r * 0.26} ${y + r * 0.26} L${x} ${y + r} L${x - r * 0.26} ${y + r * 0.26} L${x - r} ${y} L${x - r * 0.26} ${y - r * 0.26} Z`;
const STAR8 = (x, y, r) => Array.from({ length: 16 }, (_, k) => { const a = (k * Math.PI) / 8, q = k % 2 ? r * 0.5 : r; return `${k ? 'L' : 'M'}${(x + Math.sin(a) * q).toFixed(1)} ${(y - Math.cos(a) * q).toFixed(1)}`; }).join(' ') + ' Z';
const medal = (x) => `<g class="fh-medal">
      <path d="M${x - 17} 164 L${x} 204 L${x + 17} 164" fill="none" stroke="${C.g2}" stroke-width="7" stroke-linejoin="round"/>
      <circle cx="${x}" cy="212" r="19" fill="${C.s}" stroke="${C.s2}" stroke-width="3"/>
      <circle cx="${x}" cy="212" r="13.5" fill="${C.g}"/>
      <path d="${STAR8(x, 212, 11)}" fill="${C.s}"/><circle cx="${x}" cy="212" r="3" fill="${C.w}"/>
    </g>`;
const collar = (x) => `<path d="M${x - 25} 150 C${x - 10} 158 ${x + 10} 158 ${x + 25} 150 L${x + 26} 166 C${x + 10} 174 ${x - 10} 174 ${x - 26} 166 Z" fill="${C.g}"/>
    <path d="M${x - 25} 161 C${x - 10} 169 ${x + 10} 169 ${x + 26} 161 L${x + 26} 166 C${x + 10} 174 ${x - 10} 174 ${x - 26} 166 Z" fill="${C.g2}" opacity=".5"/>`;
// Pattes qui pendent (le personnage flotte) : jambe courte, doigts vers le bas.
const hang = (x, c, cls) => `<g class="fh-leg ${cls}"><path d="M${x} 240 q-3 12 1 22 M${x + 1} 262 l-7 9 M${x + 1} 262 l1 11 M${x + 1} 262 l8 8" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const stand = (x, c) => `<path d="M${x} 242 L${x} 270 M${x} 270 l-11 6 M${x} 270 l0 8 M${x} 270 l11 6" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;

function wing() {
  return `<path d="M146 176 C176 150 204 110 214 60 Q206 62 204 74 Q196 60 190 76 Q182 66 178 84 Q168 78 166 96 C158 124 146 150 138 166 Z" fill="${C.k}"/>
    <path d="M144 180 C164 162 182 136 190 108 Q182 106 178 116 Q170 108 166 122 Q158 118 154 134 C148 150 142 162 136 172 Z" fill="${C.w}"/>
    <path d="M150 166 C160 152 168 138 174 124" fill="none" stroke="${C.w2}" stroke-width="3" stroke-linecap="round"/>`;
}

// --- Dessin 1 : de dos (0,00 - 0,10 s). On voit le dos, les deux ailes croisées à bout noir, l'arrière de la tête, le bout du bec qui dépasse.
function poseBack() {
  return `<g class="pz pz-back">
    ${hang(106, C.o2, 'l')}${hang(134, C.o2, 'r')}
    <ellipse cx="120" cy="198" rx="46" ry="52" fill="${C.w}"/>
    <path d="M84 170 C78 200 92 236 124 262 C112 232 110 200 114 168 Z" fill="${C.w2}"/>
    <path d="M156 170 C162 200 148 236 116 262 C128 232 130 200 126 168 Z" fill="${C.w}"/>
    <path d="M100 236 C108 250 116 258 126 264 L120 246 Z M140 236 C132 250 124 258 114 264 L120 246 Z" fill="${C.k}"/>
    <path d="M100 120 C99 140 98 152 96 172 L144 172 C142 152 141 140 140 120 Z" fill="${C.w}"/>
    ${collar(120)}
    <path d="M166 92 C180 96 192 104 198 114 C186 114 174 112 164 108 Z" fill="${C.o}"/>
    <ellipse cx="120" cy="84" rx="52" ry="48" fill="${C.w}"/>
    <path d="M74 96 C86 128 154 128 166 96 C150 116 90 116 74 96 Z" fill="${C.w2}"/>
  </g>`;
}

// --- Dessin 2 : de trois quarts, tournée vers la droite (0,10 - 0,25 s, puis 2,13 s jusqu'à la fin).
function poseQuarter() {
  return `<g class="pz pz-q">
    <g class="fh-qlegs-hang">${hang(110, C.o2, 'l')}${hang(132, C.o, 'r')}</g>
    <g class="fh-qlegs-stand">${stand(110, C.o2)}${stand(134, C.o)}</g>
    <path d="M66 244 C70 224 82 210 98 204 L108 234 C94 236 78 240 66 248 Z" fill="${C.k}"/>
    <ellipse cx="120" cy="198" rx="46" ry="52" fill="${C.w}"/>
    <path d="M82 222 C96 258 152 256 164 214 C150 240 104 244 82 222 Z" fill="${C.w2}"/>
    <path d="M70 246 C73 230 80 219 92 212 L103 236 C91 238 79 242 70 250 Z" fill="${C.k2}"/>
    <path d="M94 160 C76 174 68 206 78 236 C98 232 116 210 118 180 C116 168 106 158 94 160 Z" fill="${C.w}"/>
    <path d="M84 222 C96 214 106 200 110 184 M80 208 C90 202 98 192 102 180" fill="none" stroke="${C.w2}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M104 120 C103 140 101 154 99 172 L147 172 C147 154 149 140 151 120 Z" fill="${C.w}"/>
    ${collar(124)}
    <path class="fh-star" d="${STAR4(130, 186, 11)}" fill="${C.s}"/>
    ${medal(130)}
    <g class="fh-qhead">
      <ellipse cx="128" cy="84" rx="52" ry="48" fill="${C.w}"/>
      <path d="M82 102 C96 132 160 132 174 102 C160 122 96 122 82 102 Z" fill="${C.w2}"/>
      <circle cx="102" cy="106" r="9" fill="${C.o}" opacity=".2"/>
      <g class="fe fq-open">
        <g transform="translate(160 78)"><ellipse rx="9.5" ry="14" fill="#F1E9DA"/><g class="fe-pupil"><ellipse rx="6" ry="9.6" fill="${C.k}"/><circle cx="-2" cy="-4" r="2.4" fill="#fff"/></g></g>
        <g transform="translate(120 82)"><ellipse rx="14.5" ry="16.5" fill="#F1E9DA"/><g class="fe-pupil"><ellipse rx="9.2" ry="11.6" fill="${C.k}"/><circle cx="-3.2" cy="-4.8" r="3.5" fill="#fff"/><circle cx="3.6" cy="5.2" r="1.6" fill="#fff" opacity=".8"/></g></g>
      </g>
      <g class="fe fq-slit"><g fill="#FFE08A" opacity=".55"><ellipse cx="120" cy="84" rx="21" ry="12" transform="rotate(12 120 84)"/><ellipse cx="160" cy="80" rx="14" ry="10" transform="rotate(-10 160 80)"/></g><g fill="#FFC93F" stroke="${C.s2}" stroke-width="3.2" stroke-linejoin="round"><path d="M104 81 Q120 72 136 87 Q120 93 104 81 Z"/><path d="M150 82 Q160 73 170 79 Q161 87 150 82 Z"/></g><path d="M110 82 Q120 79 130 85 M154 81 Q160 78 166 80" fill="none" stroke="#FFFBE6" stroke-width="2.4" stroke-linecap="round"/></g>
      <g class="fe fq-joy" fill="none" stroke="${C.k}" stroke-width="5.5" stroke-linecap="round"><path d="M108 87 Q120 72 132 87"/><path d="M152 83 Q160 73 168 83"/></g>
      <path d="M146 82 C174 84 204 98 218 120 C194 120 168 116 146 108 Z" fill="${C.o}"/>
      <path d="M146 99 C170 105 196 114 218 120 C194 123 168 118 146 109 Z" fill="${C.o2}"/>
      <path d="M152 88 C170 90 190 98 204 108" fill="none" stroke="#F8B26E" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
    </g>
    <path class="fh-twinkle" d="${STAR4(72, 96, 13)}" fill="#FFFDF2"/>
    <path class="fh-glint" d="${STAR4(158, 200, 15)}" fill="#FFFDF2"/>
  </g>`;
}

// --- Dessin 3 : de face (0,25 - 2,13 s). Pattes pendantes ; ailes repliées puis ouvertes en V ; bec fermé puis ouvert (tête levée).
function poseFront() {
  const open = (x) => `<g transform="translate(${x} 82)"><ellipse rx="14.5" ry="16.5" fill="#F1E9DA"/><g class="fe-pupil"><ellipse rx="9.2" ry="11.6" fill="${C.k}"/><circle cx="-3.2" cy="-4.8" r="3.5" fill="#fff"/><circle cx="3.6" cy="5.2" r="1.6" fill="#fff" opacity=".8"/></g></g>`;
  return `<g class="pz pz-front">
    <g class="fhw fhw-l"><g transform="translate(240 0) scale(-1 1)">${wing()}</g></g>
    <g class="fhw fhw-r">${wing()}</g>
    ${hang(106, C.o2, 'l')}${hang(134, C.o, 'r')}
    <ellipse cx="120" cy="198" rx="46" ry="52" fill="${C.w}"/>
    <path d="M78 216 C88 258 152 258 162 216 C148 240 92 240 78 216 Z" fill="${C.w2}"/>
    <path class="fh-arms" d="M92 206 C104 220 118 222 126 214 M148 206 C136 220 122 222 114 214" fill="none" stroke="${C.w2}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M100 120 C99 140 98 152 96 172 L144 172 C142 152 141 140 140 120 Z" fill="${C.w}"/>
    ${collar(120)}
    <path class="fh-star" d="${STAR4(120, 186, 11)}" fill="${C.s}"/>
    <g class="fh-head">
      <ellipse cx="120" cy="84" rx="52" ry="48" fill="${C.w}"/>
      <path d="M74 102 C88 132 152 132 166 102 C152 122 88 122 74 102 Z" fill="${C.w2}"/>
      <circle cx="80" cy="104" r="9" fill="${C.o}" opacity=".2"/><circle cx="160" cy="104" r="9" fill="${C.o}" opacity=".2"/>
      <g class="fe fe-open">${open(96)}${open(144)}</g>
      <g class="fe fe-shut" fill="none" stroke="${C.k}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M86 73 L105 82 L86 91"/><path d="M154 73 L135 82 L154 91"/></g>
      <g class="fe fe-wink"><path d="M86 73 L105 82 L86 91" fill="none" stroke="${C.k}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(144 83)"><ellipse rx="13" ry="10" fill="#F1E9DA"/><ellipse rx="8.6" ry="8" fill="${C.k}"/><circle cx="-3" cy="-3" r="3" fill="#fff"/></g></g>
      <g class="fe fe-glow" fill="#FFFDF2" stroke="${C.s}" stroke-width="5"><circle cx="96" cy="80" r="14.5"/><circle cx="144" cy="80" r="14.5"/></g>
      <g class="fh-beak">
        <path d="M107 98 C110 88 130 88 133 98 C132 128 126 150 120 164 C114 150 108 128 107 98 Z" fill="${C.o}"/>
        <path d="M120 100 C123 126 122 146 120 164 C126 150 132 128 133 98 C129 92 124 94 120 100 Z" fill="${C.o2}" opacity=".55"/>
        <path d="M113 100 C112 118 114 132 116 142" fill="none" stroke="#F8B26E" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
      </g>
      <g class="fh-beak-open">
        <path d="M100 100 C104 86 136 86 140 100 C141 122 132 140 120 148 C108 140 99 122 100 100 Z" fill="${C.o}"/>
        <path d="M104 98 C110 90 130 90 136 98 C130 94 110 94 104 98 Z" fill="#F8B26E" opacity=".9"/>
        <ellipse cx="120" cy="114" rx="11.5" ry="15" fill="#6E3210"/>
        <ellipse cx="120" cy="122" rx="7" ry="6.5" fill="#E58F7C"/>
      </g>
    </g>
  </g>`;
}

// calm = « Réduire les animations » : on montre directement l'état final, sans mouvement.
export function feteHero(calm = false) {
  return `<div class="fete-hero fh${calm ? ' turn p1 face p2 rays hot peek p3 pre p4 p5 p6' : ''}" aria-hidden="true">
    <span class="fh-aura"></span>
    <svg class="fete-flame" viewBox="0 0 200 214"><path class="f1" d="${FLAME}"/><g transform="translate(100 128) scale(.66) translate(-100 -110)"><path class="f2" d="${FLAME}"/></g></svg>
    <span class="fh-blob"></span>
    <span class="fh-orbit">${[0, 62, 128, 190, 250, 312].map((a, k) => `<i class="${k % 2 ? 'dot' : ''}" style="--a:${a}deg;--d:${k * 70}ms"></i>`).join('')}</span>
    <span class="fh-rays"><i style="--a:-52deg"></i><i style="--a:48deg"></i><i style="--a:176deg"></i><i style="--a:104deg"></i></span>
    <span class="fh-swoosh"></span>
    <span class="fete-sparks">${Array.from({ length: 16 }, (_, k) => `<i class="c${k % 3}" style="--a:${Math.round(k * 22.5 + (k % 2) * 9)}deg;--r:${118 + (k % 4) * 24}px;--d:${(k % 5) * 30}ms"></i>`).join('')}</span>
    <svg class="fh-front" viewBox="0 0 240 300" aria-hidden="true">${poseBack()}${poseFront()}${poseQuarter()}</svg>
  </div>`;
}
// Pose les classes aux temps de la référence. `at(ms, fn)` est le planificateur de fete() (il sait tout annuler à la fermeture).
export function playFeteHero(root, at) {
  const fh = root.querySelector('.fh'); if (!fh) return;
  const add = (c) => () => fh.classList.add(c);
  at(100, add('turn')); at(130, add('p1')); at(250, add('face')); at(450, add('p2')); at(930, add('rays'));
  at(1020, add('hot')); at(1060, add('peek')); at(1155, add('p3')); at(2070, add('pre')); at(2130, add('p4'));
  at(2620, add('p5')); at(2730, add('p6'));
}
