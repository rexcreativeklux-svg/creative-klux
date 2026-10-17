// ============================================
// FILE: panels/text/templates/themes/holiday.js
// PURPOSE: Text templates — Holiday
// ============================================

import { glow, gradient, heart, outline, rect, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-spooky',
    label: 'Spooky night',
    tags: 'halloween spooky scary party october',
    parts: [
      text('spooky', 'Luckiest Guy', 140, [0, -20], {
        fill: '#ef4444',
        textStroke: outline(12, '#a3e635'),
        textShadow: glow(22, '#a3e635'),
        curve: -18,
      }),
      text('HALLOWEEN PARTY', 'Montserrat', 30, [0, 112], { fontWeight: 800, letterSpacing: 10, fill: '#7c2d12' }),
    ],
  },
  {
    id: 'combo-merry-christmas',
    label: 'Merry Christmas',
    tags: 'christmas merry xmas holidays december',
    parts: [
      text('Merry', 'Great Vibes', 110, [0, -56], { fill: '#b91c1c' }),
      text('CHRISTMAS', 'Playfair Display', 84, [0, 46], { fontWeight: 900, letterSpacing: 6, fill: '#14532d' }),
    ],
  },
  {
    id: 'combo-happy-new-year',
    label: 'Happy new year',
    tags: 'new year eve countdown celebrate',
    parts: [
      text('HAPPY', 'Montserrat', 34, [0, -124], { fontWeight: 800, letterSpacing: 16, fill: '#b45309' }),
      text('NEW YEAR', 'Anton', 136, [0, -8], { lineHeight: 1, fill: gradient(180, '#fde68a', '#d97706') }),
      text('2027', 'Italiana', 52, [0, 90], { letterSpacing: 22, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-boo',
    label: 'Boo',
    tags: 'boo halloween ghost scary',
    parts: [text('BOO!', 'Luckiest Guy', 190, [0, 0], { fill: '#f97316', textShadow: glow(20, '#7c3aed') })],
  },
  {
    id: 'combo-be-mine',
    label: 'Be mine',
    tags: 'valentine love be mine heart february',
    parts: [
      heart([0, -86], 96, '#fb7185'),
      text('be mine', 'Pacifico', 110, [0, 40], { fill: '#e11d48' }),
    ],
  },
  {
    id: 'combo-happy-easter',
    label: 'Happy Easter',
    tags: 'easter spring bunny eggs pastel',
    parts: [
      text('Happy', 'Pacifico', 72, [0, -70], { fill: '#a855f7' }),
      text('EASTER', 'Fredoka', 118, [0, 36], { fontWeight: 700, lineHeight: 1, fill: gradient(90, '#f9a8d4', '#a5b4fc') }),
    ],
  },
  {
    id: 'combo-give-thanks',
    label: 'Give thanks',
    tags: 'thanksgiving thanks autumn fall grateful',
    parts: [
      text('give', 'Kaushan Script', 96, [-110, -76], { fill: '#b45309', rotation: -6 }),
      text('THANKS', 'Alfa Slab One', 110, [0, 42], { lineHeight: 1, fill: '#7c2d12' }),
    ],
  },
  {
    id: 'combo-happy-diwali',
    label: 'Happy Diwali',
    tags: 'diwali festival lights deepavali',
    parts: [
      text('Happy', 'Great Vibes', 76, [0, -86], { fill: '#b45309' }),
      text('DIWALI', 'Playfair Display', 118, [0, 8], {
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: 6,
        fill: gradient(180, '#fcd34d', '#d97706'),
        textShadow: glow(18, '#f59e0b'),
      }),
      text('FESTIVAL OF LIGHTS', 'Montserrat', 22, [0, 100], { fontWeight: 700, letterSpacing: 12, fill: '#9a3412' }),
    ],
  },
  {
    id: 'combo-ramadan-kareem',
    label: 'Ramadan Kareem',
    tags: 'ramadan kareem eid mubarak islamic',
    parts: [
      text('Ramadan', 'DM Serif Display', 118, [0, -30], { fill: '#065f46' }),
      text('Kareem', 'Great Vibes', 90, [80, 62], { fill: '#d97706' }),
    ],
  },
  {
    id: 'combo-summer-vibes',
    label: 'Summer vibes',
    tags: 'summer vibes beach holiday sun',
    parts: [
      text('summer', 'Pacifico', 110, [0, -44], { fill: '#f97316', curve: 22 }),
      text('VIBES', 'Bowlby One', 96, [0, 70], { lineHeight: 1, letterSpacing: 6, fill: '#0ea5e9' }),
    ],
  },
  {
    id: 'combo-winter-sale',
    label: 'Winter sale',
    tags: 'winter sale snow cold season',
    parts: [
      text('WINTER', 'Bebas Neue', 150, [0, -58], { lineHeight: 0.95, fill: '#0ea5e9' }),
      text('SALE', 'Bebas Neue', 150, [0, 66], { lineHeight: 0.95, fill: 'transparent', textStroke: outline(4, '#0ea5e9') }),
    ],
  },
  {
    id: 'combo-halloween-night',
    label: 'Halloween night',
    tags: 'halloween night graffiti party',
    parts: [
      text('HALLOWEEN', 'Permanent Marker', 104, [0, -24], { look: 'tfx-graffiti-toxic' }),
      text('night', 'Rock Salt', 50, [130, 92], { fill: '#7c3aed', rotation: -6 }),
    ],
  },
  {
    id: 'combo-back-to-school',
    label: 'Back to school',
    tags: 'back to school education kids class',
    parts: [
      text('BACK TO', 'Montserrat', 42, [0, -86], { fontWeight: 900, letterSpacing: 8, fill: '#111827' }),
      rect([0, 40], 360, 44, '#facc15', { cornerRadius: 6, rotation: -2 }),
      text('school', 'Permanent Marker', 128, [0, 10], { fill: '#ef4444' }),
    ],
  },
  {
    id: 'combo-eid-mubarak',
    label: 'Eid Mubarak',
    tags: 'eid mubarak celebration festival',
    parts: [
      text('EID', 'Playfair Display', 150, [0, -30], { fontWeight: 900, letterSpacing: 12, fill: gradient(180, '#fde68a', '#b45309'), textShadow: shadow(0, 4, 0, '#78350f') }),
      text('Mubarak', 'Great Vibes', 84, [0, 100], { fill: '#065f46' }),
    ],
  },
];

export default combos;
