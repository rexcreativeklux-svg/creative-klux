// ============================================
// FILE: panels/text/templates/themes/fun.js
// PURPOSE: Text templates — Fun
// ============================================

import { gradient, outline, rect, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-pool-party',
    label: 'Pool party',
    tags: 'pool party summer splash swim',
    parts: [
      text('POOL', 'Fredoka', 140, [0, -62], { fontWeight: 700, lineHeight: 0.95, fill: '#2dd4bf' }),
      text('PARTY', 'Fredoka', 140, [0, 64], { fontWeight: 700, lineHeight: 0.95, fill: 'transparent', textStroke: outline(5, '#0d9488') }),
      text('splash into summer', 'Pacifico', 40, [0, 168], { fill: '#f472b6', curve: -22 }),
    ],
  },
  {
    id: 'combo-cute-as-a-button',
    label: 'Cute as a button',
    tags: 'cute button pastel sweet',
    parts: [
      text('CUTE', 'Fredoka', 120, [-60, -54], { fontWeight: 700, fill: '#c084fc' }),
      text('as a', 'Fredoka', 44, [140, -40], { fontWeight: 600, fill: '#d8b4fe' }),
      text('BUTTON', 'Fredoka', 110, [0, 52], { fontWeight: 700, fill: '#f9a8d4' }),
    ],
  },
  {
    id: 'combo-oops',
    label: 'Oops',
    tags: 'oops mistake funny comic',
    parts: [
      text('OOPS!', 'Luckiest Guy', 160, [0, 0], {
        fill: '#facc15',
        textStroke: outline(10, '#111827'),
        textShadow: shadow(8, 8, 0, '#111827'),
        rotation: -6,
      }),
    ],
  },
  {
    id: 'combo-weekend-mode',
    label: 'Weekend mode',
    tags: 'weekend mode on relax fun',
    parts: [
      text('weekend', 'Pacifico', 104, [0, -46], { fill: '#0ea5e9' }),
      rect([0, 64], 300, 64, '#fde047', { cornerRadius: 32 }),
      text('MODE: ON', 'Space Grotesk', 36, [0, 64], { fontWeight: 700, letterSpacing: 6, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-yay',
    label: 'Yay',
    tags: 'yay comic celebrate hooray',
    parts: [text('YAY!', 'Sigmar One', 150, [0, 0], { look: 'tfx-comic-candy', rotation: -5 })],
  },
  {
    id: 'combo-lol',
    label: 'LOL',
    tags: 'lol laugh funny meme',
    parts: [
      text('LOL', 'Bungee', 190, [0, -10], { fill: gradient(90, '#f97316', '#ec4899'), textShadow: shadow(0, 10, 0, '#1e1b4b') }),
      text('laughing out loud', 'Caveat', 44, [0, 104], { fill: '#1e1b4b' }),
    ],
  },
  {
    id: 'combo-make-it-pop',
    label: 'Make it pop',
    tags: 'make it pop bold fun colour',
    parts: [
      text('MAKE IT', 'Montserrat', 40, [0, -84], { fontWeight: 900, letterSpacing: 4, fill: '#111827', curve: 36 }),
      text('POP', 'Bowlby One', 170, [0, 22], {
        lineHeight: 1,
        fill: '#f97316',
        textStroke: outline(6, '#ffffff'),
        textShadow: shadow(8, 8, 0, '#c084fc'),
      }),
    ],
  },
  {
    id: 'combo-wild-one',
    label: 'Wild one',
    tags: 'wild one birthday kids jungle',
    parts: [
      text('wild', 'Permanent Marker', 110, [-80, -82], { fill: '#16a34a', rotation: -6 }),
      text('ONE', 'Anton', 150, [60, 44], { lineHeight: 1, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-spring-mood',
    label: 'Spring mood',
    tags: 'spring mood flowers pastel',
    parts: [
      text('Spring', 'Pacifico', 96, [0, -56], { fill: '#65a30d' }),
      text('MOOD', 'Fredoka', 150, [0, 50], { fontWeight: 700, lineHeight: 1, fill: '#f472b6' }),
    ],
  },
  {
    id: 'combo-bff',
    label: 'BFF',
    tags: 'bff best friends forever friendship',
    parts: [
      text('BFF', 'Bungee', 190, [0, -10], { fill: '#ec4899', textShadow: shadow(10, 10, 0, '#fde047') }),
      text('best friends forever', 'Pacifico', 40, [0, 110], { fill: '#7c3aed' }),
    ],
  },
  {
    id: 'combo-cut-paste',
    label: 'Cut & paste',
    tags: 'cut paste collage zine craft',
    parts: [
      rect([-30, -52], 320, 110, '#c084fc', { rotation: -3 }),
      text('CUT &', 'Anton', 110, [-30, -52], { lineHeight: 1, fill: '#111827', rotation: -3 }),
      rect([20, 60], 390, 110, '#bef264', { rotation: 2 }),
      text('PASTE', 'Anton', 110, [20, 60], { lineHeight: 1, fill: '#111827', rotation: 2 }),
    ],
  },
  {
    id: 'combo-good-boy',
    label: 'Good boy',
    tags: 'good boy dog pet puppy',
    parts: [
      text('good', 'Pacifico', 80, [-60, -60], { fill: '#f59e0b', rotation: -6 }),
      text('BOY', 'Fredoka', 170, [20, 40], { fontWeight: 700, lineHeight: 1, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-hello',
    label: 'Hello',
    tags: 'hello hi greeting speech bubble',
    parts: [text('hello!', 'Fredoka', 120, [0, 0], { look: 'tfx-speech-candy' })],
  },
];

export default combos;
