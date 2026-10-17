// ============================================
// FILE: panels/text/templates/themes/food.js
// PURPOSE: Text templates — Food & drink
// ============================================

import { circle, gradient, outline, rect, ringText, text } from '../comboParts';

const combos = [
  {
    id: 'combo-coffee-break',
    label: 'Coffee break',
    tags: 'coffee cafe break drink morning',
    parts: [
      text('Coffee', 'Pacifico', 120, [0, -34], { fill: '#7c2d12', curve: 28 }),
      text('BREAK', 'Bebas Neue', 92, [0, 88], { letterSpacing: 24, fill: '#c2410c' }),
      rect([0, 150], 110, 7, '#c2410c', { cornerRadius: 4 }),
    ],
  },
  {
    id: 'combo-fresh-daily',
    label: 'Fresh daily',
    tags: 'fresh daily market organic bakery',
    parts: [
      text('fresh', 'Pacifico', 110, [0, -46], { fill: '#16a34a' }),
      text('DAILY', 'Anton', 96, [0, 64], { lineHeight: 1, letterSpacing: 14, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-pizza-night',
    label: 'Pizza night',
    tags: 'pizza night dinner italian food',
    parts: [
      text('PIZZA', 'Chewy', 130, [0, -26], { look: 'tfx-juicy-crimson' }),
      text('night', 'Kaushan Script', 74, [140, 132], { fill: '#111827', rotation: -8 }),
    ],
  },
  {
    id: 'combo-menu',
    label: 'Menu',
    tags: 'menu restaurant cafe dinner',
    parts: [
      rect([0, -86], 360, 3, '#111827'),
      text('MENU', 'Playfair Display', 140, [0, 0], { fontWeight: 900, lineHeight: 1, letterSpacing: 24, fill: '#111827' }),
      rect([0, 86], 360, 3, '#111827'),
      text('EST. 1998', 'Montserrat', 22, [0, 124], { fontWeight: 600, letterSpacing: 14, fill: '#374151' }),
    ],
  },
  {
    id: 'combo-happy-hour',
    label: 'Happy hour',
    tags: 'happy hour drinks bar cocktails',
    parts: [
      text('HAPPY', 'Bebas Neue', 76, [0, -104], { letterSpacing: 16, fill: '#f59e0b' }),
      text('HOUR', 'Bebas Neue', 190, [0, 8], { lineHeight: 0.95, fill: '#111827' }),
      text('5 – 7 PM', 'Montserrat', 30, [0, 112], { fontWeight: 700, letterSpacing: 6, fill: '#b45309' }),
    ],
  },
  {
    id: 'combo-sunday-brunch',
    label: 'Sunday brunch',
    tags: 'brunch sunday breakfast cafe weekend',
    parts: [
      text('Sunday', 'Great Vibes', 92, [0, -60], { fill: '#db2777' }),
      text('BRUNCH', 'Abril Fatface', 118, [0, 40], { lineHeight: 1, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-sweet-treats',
    label: 'Sweet treats',
    tags: 'sweet treats dessert bakery candy cake',
    parts: [
      text('Sweet Treats', 'Bubblegum Sans', 110, [0, -20], { look: 'tfx-diecut-candy' }),
      text('homemade with love', 'Caveat', 46, [0, 90], { fill: '#be185d' }),
    ],
  },
  {
    id: 'combo-burger-time',
    label: 'Burger time',
    tags: 'burger fast food time lunch',
    parts: [
      text('BURGER', 'Luckiest Guy', 136, [0, -24], { fill: '#f59e0b', textStroke: outline(9, '#7c2d12') }),
      text('time!', 'Chewy', 70, [110, 82], { fill: '#7c2d12', rotation: -8 }),
    ],
  },
  {
    id: 'combo-chefs-special',
    label: "Chef's special",
    tags: 'chef special dish restaurant menu',
    parts: [
      text("chef's", 'Satisfy', 84, [0, -84], { fill: '#b91c1c' }),
      text('SPECIAL', 'Oswald', 108, [0, 30], { fontWeight: 700, lineHeight: 1, letterSpacing: 8, fill: '#111827' }),
      rect([0, 104], 90, 6, '#b91c1c', { cornerRadius: 3 }),
    ],
  },
  {
    id: 'combo-vegan',
    label: '100% vegan',
    tags: 'vegan plant based healthy green',
    parts: [
      text('100%', 'Anton', 92, [0, -92], { lineHeight: 1, fill: '#16a34a' }),
      text('VEGAN', 'Fredoka', 128, [0, 10], { fontWeight: 700, lineHeight: 1, fill: '#16a34a' }),
      text('plant powered', 'Caveat', 48, [0, 100], { fill: '#15803d' }),
    ],
  },
  {
    id: 'combo-bakery',
    label: 'Bakery',
    tags: 'bakery bread pastry fresh badge',
    parts: [
      circle([0, 10], 340, 'transparent', { stroke: '#92400e', strokeWidth: 4 }),
      ringText('ARTISAN BAKERY', 'Playfair Display', 26, [0, 10], 146, 'top', { fontWeight: 900, letterSpacing: 5, fill: '#92400e' }),
      text('fresh bread', 'Great Vibes', 66, [0, 14], { fill: '#78350f' }),
      ringText('SINCE 1987', 'Montserrat', 18, [0, 10], 148, 'bottom', { fontWeight: 700, letterSpacing: 8, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-taco-tuesday',
    label: 'Taco Tuesday',
    tags: 'taco tuesday mexican food',
    parts: [
      text('TACO', 'Bowlby One', 130, [0, -30], { lineHeight: 1, fill: '#ea580c' }),
      text('tuesday', 'Pacifico', 76, [60, 74], { fill: '#16a34a', rotation: -8 }),
    ],
  },
  {
    id: 'combo-order-now',
    label: 'Order now',
    tags: 'order now delivery food button',
    parts: [text('Order Now!', 'Racing Sans One', 110, [0, 0], { fill: gradient(90, '#06b6d4', '#f97316') })],
  },
  {
    id: 'combo-ice-cream',
    label: 'Ice cream',
    tags: 'ice cream summer dessert sweet',
    parts: [
      text('ice cream', 'Shrikhand', 110, [0, -20], { look: 'tfx-wavy-candy' }),
      text('SUMMER MENU', 'Montserrat', 24, [0, 90], { fontWeight: 800, letterSpacing: 14, fill: '#be185d' }),
    ],
  },
];

export default combos;
