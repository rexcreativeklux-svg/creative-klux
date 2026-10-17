// ============================================
// FILE: panels/text/templates/themes/pets.js
// PURPOSE: Text templates — Pets
// ============================================

import { circle, line, outline, rect, ringText, shape, text } from '../comboParts';

/**
 * A paw print — one pad and four toes, all circles — centred on (cx, cy) and
 * about `size` across. Returns parts to spread into a combo.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 * @param {string} fill
 */
const paw = (cx, cy, size, fill) => {
  const u = size / 100;
  return [
    shape('circle', [cx, cy + 18 * u], 58 * u, 50 * u, fill),
    shape('circle', [cx - 40 * u, cy - 12 * u], 22 * u, 28 * u, fill, { rotation: -25 }),
    shape('circle', [cx - 14 * u, cy - 34 * u], 22 * u, 28 * u, fill, { rotation: -8 }),
    shape('circle', [cx + 14 * u, cy - 34 * u], 22 * u, 28 * u, fill, { rotation: 8 }),
    shape('circle', [cx + 40 * u, cy - 12 * u], 22 * u, 28 * u, fill, { rotation: 25 }),
  ];
};

/**
 * A dog bone — a rounded bar with two round knobs at each end — centred on
 * (cx, cy). Returns parts to spread into a combo; put the words on after it.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} length  the bar's length, knob centre to knob centre
 * @param {number} thickness  the bar's height
 * @param {string} fill
 */
const bone = (cx, cy, length, thickness, fill) => {
  const knob = thickness * 0.8;
  const [dx, dy] = [length / 2, thickness * 0.35];
  return [
    rect([cx, cy], length, thickness, fill, { cornerRadius: thickness * 0.25 }),
    circle([cx - dx, cy - dy], knob, fill),
    circle([cx - dx, cy + dy], knob, fill),
    circle([cx + dx, cy - dy], knob, fill),
    circle([cx + dx, cy + dy], knob, fill),
  ];
};

const combos = [
  {
    id: 'combo-pets-adopt-me',
    label: 'Adopt me',
    tags: 'adopt me rescue shelter dog cat forever home',
    parts: [
      text('ADOPT', 'Lilita One', 150, [0, -30], { letterSpacing: 2, fill: '#5b3a29' }),
      text('me', 'Pacifico', 100, [168, 56], { fill: '#e76f51', rotation: -8, textStroke: outline(10, '#ffffff') }),
      shape('heart-sharp', [254, 14], 34, 30, '#e76f51', { rotation: 14 }),
      text('MEET BISCUIT · 2 YRS · LOVES CUDDLES', 'Montserrat', 13, [3, 136], { fontWeight: 700, letterSpacing: 5, fill: '#5b3a29' }),
    ],
  },
  {
    id: 'combo-pets-good-boy',
    label: 'Good boy',
    tags: 'good boy dog bone puppy certified best dog',
    parts: [
      text('certified', 'Pacifico', 56, [0, -98], { fill: '#e76f51', rotation: -4 }),
      ...bone(0, 14, 400, 100, '#e9c46a'),
      text('GOOD BOY', 'Lilita One', 54, [0, 18], { letterSpacing: 5, fill: '#5b3a29' }),
      text('BEST DOG ON THE BLOCK', 'Montserrat', 13, [4, 130], { fontWeight: 700, letterSpacing: 8, fill: '#5b3a29' }),
    ],
  },
  {
    id: 'combo-pets-grooming',
    label: 'Pet grooming',
    tags: 'pet grooming salon bath trim nails spa dog price',
    parts: [
      text('THE PAMPERED PUP', 'Montserrat', 15, [-36, -98], { fontWeight: 700, letterSpacing: 8, fill: '#2a9d8f' }),
      text('Grooming', 'DM Serif Display', 100, [-40, -24], { fill: '#264653' }),
      text('BATH · TRIM · NAILS · SPA', 'Montserrat', 14, [-37, 50], { fontWeight: 600, letterSpacing: 6, fill: '#264653' }),
      text('BOOK: (555) 014-2277', 'Montserrat', 15, [-38, 90], { fontWeight: 800, letterSpacing: 3, fill: '#2a9d8f' }),
      circle([246, -104], 112, '#e76f51'),
      text('FROM', 'Montserrat', 12, [248, -119], { fontWeight: 700, letterSpacing: 4, fill: '#ffffff' }),
      text('$35', 'Montserrat', 36, [246, -94], { fontWeight: 800, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-pets-lost-dog',
    label: 'Lost dog',
    tags: 'lost dog missing pet reward poster found call',
    parts: [
      text('LOST DOG', 'Anton', 136, [0, -80], { lineHeight: 1, letterSpacing: 2, fill: '#d62828' }),
      text('MAX · GOLDEN RETRIEVER · 3 YRS', 'Montserrat', 15, [4, -10], { fontWeight: 800, letterSpacing: 5, fill: '#1f2937' }),
      text('Last seen near Elm Park on June 14', 'Inter', 20, [0, 24], { fill: '#4b5563' }),
      rect([0, 88], 320, 62, '#d62828', { cornerRadius: 31 }),
      text('REWARD $500', 'Anton', 36, [4, 98], { letterSpacing: 4, fill: '#ffffff' }),
      text('CALL (555) 014-2277', 'Montserrat', 16, [4, 150], { fontWeight: 800, letterSpacing: 4, fill: '#1f2937' }),
    ],
  },
  {
    id: 'combo-pets-pawsome',
    label: 'Pawsome',
    tags: 'pawsome awesome paw dog cat pet cute',
    parts: [
      ...paw(0, -118, 110, '#e76f51'),
      text('Pawsome!', 'Chewy', 116, [0, 0], { fill: '#264653' }),
      text("YOU'RE PAW-SITIVELY THE BEST", 'Montserrat', 13, [4, 72], { fontWeight: 700, letterSpacing: 6, fill: '#e76f51' }),
    ],
  },
  {
    id: 'combo-pets-cat-mom',
    label: 'Cat mom',
    tags: 'cat mom mum kitty cats owner lover',
    parts: [
      shape('triangle', [-26, -172], 40, 40, '#5b3a29', { rotation: -12 }),
      shape('triangle', [26, -172], 40, 40, '#5b3a29', { rotation: 12 }),
      circle([0, -140], 84, '#5b3a29'),
      text('cat mom', 'Pacifico', 110, [0, -6], { fill: '#e07a8f' }),
      text('EST. 2021 · 2 CATS · 0 REGRETS', 'Montserrat', 13, [4, 72], { fontWeight: 700, letterSpacing: 6, fill: '#5b3a29' }),
    ],
  },
  {
    id: 'combo-pets-vet-clinic',
    label: 'Vet clinic',
    tags: 'vet clinic veterinary animal hospital care hours',
    parts: [
      circle([-196, 0], 184, '#2a9d8f'),
      shape('cross', [-196, 0], 82, 82, '#ffffff'),
      text('RIVERSIDE', 'Montserrat', 16, [115, -82], { fontWeight: 700, letterSpacing: 10, fill: '#2a9d8f', width: 390, textAlign: 'left' }),
      text('Vet Clinic', 'DM Serif Display', 74, [115, -24], { fill: '#264653', width: 390, textAlign: 'left' }),
      text('Mon–Sat · 8 AM – 6 PM', 'Inter', 22, [115, 40], { fontWeight: 500, fill: '#4b5563', width: 390, textAlign: 'left' }),
      text('(555) 014-2277', 'Montserrat', 22, [115, 80], { fontWeight: 800, letterSpacing: 2, fill: '#2a9d8f', width: 390, textAlign: 'left' }),
    ],
  },
  {
    id: 'combo-pets-puppy-love',
    label: 'Puppy love',
    tags: 'puppy love heart dog valentine adopt',
    parts: [
      shape('heart-sharp', [0, 0], 460, 410, '#e5536d'),
      text('puppy', 'Pacifico', 64, [0, -70], { fill: '#fff4ec' }),
      text('LOVE', 'Lilita One', 84, [4, 18], { letterSpacing: 8, fill: '#fff4ec' }),
      text('#ADOPTDONTSHOP', 'Montserrat', 13, [4, 234], { fontWeight: 700, letterSpacing: 6, fill: '#e5536d' }),
    ],
  },
  {
    id: 'combo-pets-treats-inside',
    label: 'Treats inside',
    tags: 'treats inside homemade dog biscuits jar label bakery',
    parts: [
      rect([0, 0], 520, 270, '#fdf0dc', { cornerRadius: 18, stroke: '#5b3a29', strokeWidth: 3 }),
      rect([0, 0], 492, 242, 'transparent', { cornerRadius: 12, stroke: '#5b3a29', strokeWidth: 1.5 }),
      text('homemade', 'Pacifico', 46, [0, -72], { fill: '#e76f51' }),
      text('TREATS', 'Alfa Slab One', 88, [4, 6], { letterSpacing: 6, fill: '#5b3a29' }),
      line([-135, 82], 90, '#5b3a29', { weight: 1.5 }),
      text('INSIDE', 'Montserrat', 15, [7, 82], { fontWeight: 800, letterSpacing: 14, fill: '#5b3a29' }),
      line([135, 82], 90, '#5b3a29', { weight: 1.5 }),
    ],
  },
  {
    id: 'combo-pets-gotcha-day',
    label: 'Happy gotcha day',
    tags: 'happy gotcha day adoption anniversary rescue celebrate',
    parts: [
      shape('sparkle', [-150, -122], 30, 30, '#e9c46a'),
      shape('sparkle', [152, -102], 20, 20, '#e9c46a'),
      text('Happy', 'Pacifico', 80, [0, -112], { fill: '#2a9d8f' }),
      shape('banner-ribbon', [0, -4], 580, 96, '#e76f51'),
      text('GOTCHA DAY', 'Lilita One', 58, [0, 0], { letterSpacing: 4, fill: '#fff8f0' }),
      text('3 YEARS WITH LUNA', 'Montserrat', 15, [5, 84], { fontWeight: 700, letterSpacing: 10, fill: '#264653' }),
    ],
  },
  {
    id: 'combo-pets-woof',
    label: 'Woof',
    tags: 'woof dog bark speech bubble funny feed me',
    parts: [
      shape('speech-bubble-oval', [20, -20], 440, 250, '#264653'),
      text('WOOF!', 'Luckiest Guy', 110, [22, -46], { letterSpacing: 2, fill: '#e9c46a' }),
      text('(translation: feed me)', 'Caveat', 40, [80, 134], { fill: '#264653' }),
    ],
  },
  {
    id: 'combo-pets-dog-walker',
    label: 'Dog walker',
    tags: 'dog walker walking service price pet sitter',
    parts: [
      text('Happy Tails', 'Pacifico', 46, [-95, -86], { fill: '#e76f51', width: 410, textAlign: 'left' }),
      text('DOG WALKING', 'Anton', 68, [-95, -6], { lineHeight: 1, letterSpacing: 2, fill: '#264653', width: 410, textAlign: 'left' }),
      text('30-MIN WALKS · MON – FRI', 'Montserrat', 14, [-95, 50], { fontWeight: 700, letterSpacing: 5, fill: '#264653', width: 410, textAlign: 'left' }),
      text('CALL SAM · (555) 014-2277', 'Montserrat', 14, [-95, 80], { fontWeight: 700, letterSpacing: 5, fill: '#6b7280', width: 410, textAlign: 'left' }),
      rect([210, -6], 150, 190, '#e9c46a', { cornerRadius: 18, rotation: 8 }),
      circle([219, -71], 20, 'transparent', { stroke: '#5b3a29', strokeWidth: 3 }),
      text('$20', 'Anton', 66, [207, 17], { fill: '#5b3a29', rotation: 8 }),
      text('PER WALK', 'Montserrat', 12, [201, 55], { fontWeight: 800, letterSpacing: 4, fill: '#5b3a29', rotation: 8 }),
    ],
  },
  {
    id: 'combo-pets-cat-cafe',
    label: 'Cat café',
    tags: 'cat cafe coffee cake cuddles kitten shop',
    parts: [
      shape('triangle', [-92, -198], 70, 64, '#ecd9c6', { rotation: -14 }),
      shape('triangle', [92, -198], 70, 64, '#ecd9c6', { rotation: 14 }),
      shape('arch', [0, 0], 340, 400, '#ecd9c6'),
      text('Cat', 'Pacifico', 110, [0, -46], { fill: '#5b3a29' }),
      text('CAFÉ', 'Montserrat', 28, [10, 40], { fontWeight: 700, letterSpacing: 20, fill: '#5b3a29' }),
      line([0, 86], 50, '#b08968', { weight: 1.5 }),
      text('COFFEE · CAKE · CUDDLES', 'Montserrat', 12, [3, 118], { fontWeight: 600, letterSpacing: 5, fill: '#8d6e63' }),
      text('OPEN DAILY · 8 AM – 6 PM', 'Montserrat', 11, [3, 146], { fontWeight: 500, letterSpacing: 4, fill: '#8d6e63' }),
    ],
  },
  {
    id: 'combo-pets-barkday',
    label: 'Barkday party',
    tags: 'barkday birthday dog party crown celebrate',
    parts: [
      shape('crown', [0, -130], 84, 56, '#e9c46a'),
      text("IT'S MY", 'Montserrat', 16, [6, -76], { fontWeight: 800, letterSpacing: 12, fill: '#264653' }),
      text('BARKDAY', 'Lilita One', 116, [0, 0], { letterSpacing: 2, fill: '#e76f51' }),
      text('party', 'Pacifico', 64, [158, 80], { fill: '#2a9d8f', rotation: -8 }),
      text('SAT · 2 PM · RIVERSIDE DOG PARK', 'Montserrat', 13, [4, 164], { fontWeight: 700, letterSpacing: 5, fill: '#264653' }),
    ],
  },
  {
    id: 'combo-pets-pet-of-the-week',
    label: 'Pet of the week',
    tags: 'pet of the week shelter star adopt badge',
    parts: [
      circle([0, 0], 340, '#264653'),
      circle([0, 0], 308, 'transparent', { stroke: '#e9c46a', strokeWidth: 2 }),
      ringText('PET OF THE WEEK', 'Montserrat', 19, [0, 0], 132, 'top', { fontWeight: 800, letterSpacing: 8, fill: '#e9c46a' }),
      ringText('RIVERSIDE SHELTER', 'Montserrat', 14, [0, 0], 134, 'bottom', { fontWeight: 700, letterSpacing: 6, fill: '#e9c46a' }),
      shape('star5', [-28, -58], 16, 16, '#e9c46a'),
      shape('star5', [0, -64], 22, 22, '#e9c46a'),
      shape('star5', [28, -58], 16, 16, '#e9c46a'),
      text('Biscuit', 'Pacifico', 70, [0, 4], { fill: '#fdf0dc' }),
    ],
  },
];

export default combos;
