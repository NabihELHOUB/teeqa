// Bellarej en vecteur, articulée et animée en boucle (demande de l'utilisateur, 10 nov. : « personnages dessinés en vecteur
// et animés », référence : le personnage de la carte de Duolingo). Aucun fichier image : quelques kilo-octets, net à toute taille.
// Vue de profil, tournée vers la droite. Les pièces mobiles portent une classe .br-* ; l'animation est dans css/bellarej.css.
// Humeurs : posee (attend, regarde, se lisse l'aile, replie une patte), annonce (aile levée, bec qui parle),
//           inquiete (tête basse, regard vers le sol), felicite (sautille, bat de l'aile, yeux rieurs),
//           vol (elle vole sur place, pattes en arrière), attend (dans son nid, mêmes gestes que posee sans les pattes),
//           batit (11 nov.) : elle lève un marteau et plante un piquet devant elle en trois coups, puis recommence.
//           photo (11 nov.) : elle lève son téléphone devant elle, vise, ferme un œil et déclenche (éclair), puis baisse l'aile.
// Version 2 : formes plus rondes (grosse tête, grand œil, bec épais, pattes courtes), queue et étoile mobiles.
const C = { w: '#FAF6EC', w2: '#E6DCC8', k: '#2B2D31', k2: '#45474C', o: '#EE9140', o2: '#C96F2A', g: '#14503F', g2: '#0E3B31', s: '#E2A33B' };

// Tenues (11 nov.) : gear 'orange' = casque de chantier de l'entreprise ; 'jaune' = casque et gilet du contrôleur.
// seat 'transat' : avec l'humeur 'attend', le nid devient un transat et elle tient son téléphone (le client qui suit de loin).
// Casque, gilet et téléphone sont dans les groupes animés : ils suivent la tête, le corps et l'aile.
export function bellarejRig(mood = 'posee', h = 150, { cls = '', alt = '', gear = '', seat = '' } = {}) {
  const hc = gear === 'orange' ? ['#E0703A', '#B8542A', '#F08A54'] : ['#F2B632', '#D99A1C', '#F7CB5A'];
  const helmet = gear ? `<path d="M106 33 C106 3 154 3 154 33 Z" fill="${hc[0]}"/><path d="M125 9 h10 v24 h-10 z" fill="${hc[2]}"/><rect x="99" y="29" width="70" height="8.5" rx="4.2" fill="${hc[1]}"/><rect x="99" y="27.5" width="70" height="7" rx="3.5" fill="${hc[0]}"/>` : '';
  const vest = gear === 'jaune' ? `<path d="M104 101 C130 97 151 112 147 138 C142 158 122 172 100 178 C90 150 92 122 104 101 Z" fill="#F2B632"/><path d="M95 136 C114 141 134 137 147 128 l-1 10 C133 148 113 151 95 147 Z" fill="#F4EFE4"/>` : '';
  const chair = `<path d="M34 250 L150 186 M58 186 L166 250" fill="none" stroke="#B98A52" stroke-width="7" stroke-linecap="round"/><path d="M30 196 Q92 244 162 232 L164 246 Q90 258 24 208 Z" fill="${C.s}"/><path d="M50 213 Q92 240 140 238 M40 205 Q60 222 84 232" fill="none" stroke="#FAF6EC" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`;
  const phone = seat === 'transat' ? `<g class="br-phone"><rect x="150" y="118" width="16" height="27" rx="3.5" fill="${C.k}" transform="rotate(14 158 131)"/><rect x="152" y="120.5" width="12" height="22" rx="2" fill="#BFD9D2" transform="rotate(14 158 131)"/></g>` : '';
  const w = Math.round((h * 200) / 260);
  const build = mood === 'batit', shoot = mood === 'photo';
  // Marteau tenu au bout de l'aile levée (dans le repère de l'aile), piquet et éclat de frappe devant elle.
  const hammer = build ? `<path d="M92 56 L68 12" stroke="#9C7442" stroke-width="7" stroke-linecap="round"/><path d="M92 56 L68 12" stroke="#C9A16A" stroke-width="3" stroke-linecap="round"/><g transform="rotate(-28.6 68 12)"><rect x="50" y="1" width="36" height="17" rx="4" fill="#3E4248"/><rect x="50" y="1" width="36" height="7" rx="3.5" fill="#6B7078"/><rect x="50" y="1" width="6" height="17" rx="3" fill="#2B2D31"/></g>` : '';
  const stake = build ? `<g class="br-stake"><path d="M213 136 h14 v104 l-7 12 l-7 -12 Z" fill="#C9A16A"/><path d="M221 136 h6 v104 l-7 12 Z" fill="#9C7442"/><path d="M213 136 h14 v5 h-14 Z" fill="#E4C48E"/><path d="M213 160 h14 M213 186 h14" stroke="#9C7442" stroke-width="1.6"/></g>
      <ellipse cx="220" cy="246" rx="17" ry="4.5" fill="#B8915C" opacity=".75"/>
      <g class="br-hit" fill="#F5C766"><path d="M196 124 l-9 -7 l11 2 l-2 -11 l7 9 Z"/><path d="M244 124 l9 -7 l-11 2 l2 -11 l-7 9 Z"/><circle cx="220" cy="118" r="2.6"/></g>` : '';
  const foot = (x, c) => `<path d="M${x} 243 h19 M${x} 243 l15 -6 M${x} 243 l-8 2" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg class="bellarej br br-${mood} ${cls}" viewBox="0 0 200 260" width="${w}" height="${h}" ${alt ? `role="img" aria-label="${alt}"` : 'aria-hidden="true"'}>
    <g class="br-all">
      <g class="br-leg-back">
        <path d="M90 170 L90 208" stroke="${C.o2}" stroke-width="6.5" stroke-linecap="round"/>
        <g class="br-shin"><path d="M90 208 L90 243" stroke="${C.o2}" stroke-width="6.5" stroke-linecap="round"/>${foot(90, C.o2)}</g>
        <circle cx="90" cy="208" r="5" fill="${C.o2}"/>
      </g>
      <g class="br-leg-front">
        <path d="M108 172 L108 243" stroke="${C.o}" stroke-width="6.5" stroke-linecap="round"/>${foot(108, C.o)}
        <circle cx="108" cy="208" r="5" fill="${C.o}"/>
      </g>
      <g class="br-top"><g class="br-skin">
        <g class="br-wing-open"><g transform="${build ? 'translate(24.4 24.4) scale(.8)' : 'translate(-8 -6) scale(1.08)'}">
          <path d="M108 124 C88 100 68 68 60 34 Q62 22 70 30 Q72 14 82 24 Q86 8 95 22 Q102 10 108 26 C116 54 128 90 134 116 Z" fill="${C.k}"/>
          <path d="M108 128 C92 108 78 84 72 56 Q78 48 86 56 Q94 50 100 62 Q110 60 114 74 C122 90 130 104 134 118 C130 126 116 132 108 128 Z" fill="${C.w}"/>
          <path d="M92 78 C100 92 108 104 116 116 M104 76 C110 90 118 102 124 112" fill="none" stroke="${C.w2}" stroke-width="3" stroke-linecap="round"/>
          ${hammer}${shoot ? `<g transform="rotate(-66 70 8)"><rect x="55" y="-16" width="30" height="48" rx="6.5" fill="${C.k}"/><rect x="58" y="-13" width="24" height="42" rx="4" fill="#3D5A66"/><rect x="58" y="-13" width="24" height="42" rx="4" fill="#BFD9D2" opacity=".55"/><circle cx="70" cy="23" r="2.6" fill="none" stroke="${C.w}" stroke-width="1.3"/><g class="br-flash"><circle cx="88" cy="-16" r="34" fill="#fff" opacity=".4"/><path d="M88 -44 l6.5 21.5 l21.5 6.5 l-21.5 6.5 l-6.5 21.5 l-6.5 -21.5 l-21.5 -6.5 l21.5 -6.5 z" fill="#fff"/><circle cx="88" cy="-16" r="7" fill="#FFF3C4"/></g></g>` : ''}
        </g></g>
        <g class="br-tail"><path d="M24 194 C28 176 42 158 62 150 L82 176 C72 177 63 181 57 188 Q50 183 46 191 Q40 186 36 195 Q30 189 24 194 Z" fill="${C.k}"/></g>
        <g class="br-body">
          <path d="M52 150 C52 112 88 92 122 100 C146 106 152 136 138 160 C124 182 86 188 62 176 C52 170 50 160 52 150 Z" fill="${C.w}"/>
          <path d="M62 176 C86 188 124 182 138 160 C142 153 145 146 146 138 C138 160 106 174 56 164 C56 169 58 173 62 176 Z" fill="${C.w2}"/>
          ${vest}
        </g>
        <g class="br-neck">
          <path d="M122 124 C140 108 118 90 128 62" fill="none" stroke="${C.w}" stroke-width="26" stroke-linecap="round"/>
          <path d="M110 104 C120 112 134 113 144 107" fill="none" stroke="${C.g}" stroke-width="9" stroke-linecap="round"/>
          <path d="M112 107 C121 113 133 114 142 110" fill="none" stroke="${C.g2}" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>
          <g class="br-star"><path d="M134 108 l3.2 7 l7 3.2 l-7 3.2 l-3.2 7 l-3.2 -7 l-7 -3.2 l7 -3.2 z" fill="${C.s}"/></g>
          <g class="br-head">
            <g class="br-beak-low"><path d="M150 51 C165 55 180 57 194 58 C180 62 164 63 150 62 Z" fill="${C.o2}"/></g>
            <path d="M150 33 C171 37 189 46 200 57 C183 58 165 57 150 55 Z" fill="${C.o}"/>
            <path d="M154 38 C168 41 180 46 189 52" fill="none" stroke="#F8B26E" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
            <circle cx="130" cy="48" r="26" fill="${C.w}"/>
            <path d="M109 63 C119 75 141 77 153 64 C143 70 123 70 109 63 Z" fill="${C.w2}"/>
            <circle cx="127" cy="60" r="6.5" fill="${C.o}" opacity=".2"/>
            <path d="M134 45 C128 44 122 47 117 53" fill="none" stroke="${C.k}" stroke-width="2.6" stroke-linecap="round"/>
            <g class="br-eye"><ellipse cx="141" cy="42" rx="6.5" ry="8.6" fill="${C.k}"/><circle cx="143" cy="38.4" r="2.7" fill="#fff"/><circle cx="138.6" cy="46.2" r="1.2" fill="#fff" opacity=".8"/></g>
            <path class="br-eye-joy" d="M133 45 Q141 33 149 45" fill="none" stroke="${C.k}" stroke-width="4" stroke-linecap="round"/>
            <path class="br-brow" d="M132 30 Q140 24 150 28" fill="none" stroke="${C.k}" stroke-width="3" stroke-linecap="round"/>
            ${helmet}
          </g>
        </g>
        <g class="br-wing">
          <path d="M36 186 C42 170 54 158 70 152 L86 170 C70 172 52 178 36 186 Z" fill="${C.k2}"/>
          <path d="M122 114 C96 108 68 122 56 152 C54 162 60 168 68 168 C98 168 124 150 130 128 C131 121 128 115 122 114 Z" fill="${C.w}"/>
          <path d="M70 154 C86 154 104 146 114 132 M66 162 C84 162 102 156 116 143" fill="none" stroke="${C.w2}" stroke-width="3.2" stroke-linecap="round"/>
        </g>
        ${phone}
      </g></g>
      ${stake}
      <g class="br-nest">${seat === 'transat' ? chair : `
        <path d="M22 204 C22 236 56 252 100 252 C144 252 178 236 178 204 C150 214 50 214 22 204 Z" fill="#8A5A34"/>
        <path d="M18 202 C50 216 150 216 182 202 C186 208 182 214 176 216 C146 228 54 228 24 216 C18 214 14 208 18 202 Z" fill="#A9743F"/>
        <path d="M34 226 C60 238 96 240 128 236 M70 244 C100 248 136 244 164 230 M30 214 l-12 -6 M172 214 l12 -8 M56 236 l-10 10" fill="none" stroke="#6E4526" stroke-width="3" stroke-linecap="round"/>
      `}</g>
    </g>
  </svg>`;
}
