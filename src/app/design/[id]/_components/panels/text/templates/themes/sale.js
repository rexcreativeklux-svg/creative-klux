// ============================================
// FILE: panels/text/templates/themes/sale.js
// PURPOSE: Text templates — Sale & promo
// ============================================

import { circle, gradient, outline, rect, shadow, text } from '../comboParts';

// Reviewed by eye in headless Edge (.mockup-review/text-harness/sheets) — a
// position that looks arbitrary was set against the real font's cap height.

const combos = [
  {
    id: 'combo-mega-sale',
    label: 'Mega sale',
    tags: 'sale discount offer percent off shop',
    parts: [
      text('MEGA', 'Montserrat', 54, [0, -150], { fontWeight: 800, letterSpacing: 22, fill: '#111827' }),
      text('SALE', 'Anton', 210, [0, 8], { lineHeight: 1, fill: gradient(90, '#f43f5e', '#f97316') }),
      rect([0, 150], 380, 64, '#111827', { cornerRadius: 32 }),
      text('UP TO 50% OFF', 'Montserrat', 30, [0, 150], { fontWeight: 800, letterSpacing: 4, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-flash-deal',
    label: 'Flash deal',
    tags: 'sale deal flash today offer',
    parts: [
      text('FLASH', 'Bebas Neue', 180, [0, -62], { lineHeight: 0.95, fill: '#7c3aed' }),
      text('DEAL', 'Bebas Neue', 180, [0, 78], { lineHeight: 0.95, fill: '#1e1b4b' }),
      text('today only!', 'Pacifico', 52, [150, 168], { fill: '#ec4899', rotation: -10 }),
    ],
  },
  {
    id: 'combo-sale-sale-sale',
    label: 'Sale sale sale',
    tags: 'sale repeat outline bold yellow',
    parts: [
      text('SALE', 'Anton', 130, [0, -134], { lineHeight: 0.95, fill: '#facc15' }),
      text('SALE', 'Anton', 130, [0, 0], { lineHeight: 0.95, fill: 'transparent', textStroke: outline(4, '#facc15') }),
      text('SALE', 'Anton', 130, [0, 134], { lineHeight: 0.95, fill: 'transparent', textStroke: outline(4, '#facc15'), opacity: 0.55 }),
    ],
  },
  {
    id: 'combo-fifty-off',
    label: '50% off',
    tags: 'percent off discount sale fifty',
    parts: [
      text('50%', 'Anton', 200, [-80, -12], { lineHeight: 1, fill: '#111827' }),
      text('OFF', 'Anton', 84, [218, 36], { lineHeight: 1, fill: '#ef4444' }),
      text('EVERYTHING', 'Montserrat', 28, [30, 128], { fontWeight: 800, letterSpacing: 14, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-black-friday',
    label: 'Black Friday',
    tags: 'black friday deals weekend november',
    parts: [
      rect([0, 16], 540, 330, '#0a0a0a', { cornerRadius: 18 }),
      text('BLACK', 'Anton', 118, [0, -72], { lineHeight: 1, letterSpacing: 4, fill: '#ffffff' }),
      text('FRIDAY', 'Anton', 118, [0, 44], { lineHeight: 1, letterSpacing: 4, fill: '#facc15' }),
      text('ALL WEEKEND', 'Montserrat', 22, [0, 138], { fontWeight: 700, letterSpacing: 12, fill: '#a3a3a3' }),
    ],
  },
  {
    id: 'combo-shop-now',
    label: 'Shop now',
    tags: 'shop now new collection button',
    parts: [
      text('New collection', 'Great Vibes', 88, [0, -58], { fill: '#111827' }),
      rect([0, 62], 330, 76, '#111827', { cornerRadius: 38 }),
      text('SHOP NOW  →', 'Montserrat', 30, [0, 62], { fontWeight: 800, letterSpacing: 6, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-limited-offer',
    label: 'Limited offer',
    tags: 'limited offer ends soon hurry',
    parts: [
      text('LIMITED', 'Bebas Neue', 62, [0, -104], { letterSpacing: 18, fill: '#dc2626' }),
      text('OFFER', 'Bebas Neue', 190, [0, 8], { lineHeight: 0.95, fill: '#111827' }),
      rect([128, 118], 230, 54, '#dc2626', { cornerRadius: 10, rotation: -4 }),
      text('ENDS SUNDAY', 'Montserrat', 22, [128, 118], { fontWeight: 800, letterSpacing: 4, fill: '#ffffff', rotation: -4 }),
    ],
  },
  {
    id: 'combo-bogo',
    label: 'Buy one get one',
    tags: 'bogo buy one get one free deal',
    parts: [
      text('BUY 1', 'Anton', 124, [-50, -62], { lineHeight: 1, fill: '#1d4ed8' }),
      text('GET 1', 'Anton', 124, [-50, 62], { lineHeight: 1, fill: '#f97316' }),
      circle([176, 40], 150, '#facc15'),
      text('FREE', 'Luckiest Guy', 50, [176, 44], { fill: '#111827', rotation: 12 }),
    ],
  },
  {
    id: 'combo-clearance',
    label: 'Clearance',
    tags: 'clearance sale stock everything must go',
    parts: [
      text('CLEARANCE', 'Bebas Neue', 136, [0, -30], {
        letterSpacing: 4,
        fill: gradient(90, '#f97316', '#dc2626'),
        textShadow: shadow(5, 5, 0, '#7f1d1d'),
      }),
      rect([0, 78], 300, 56, '#111827', { cornerRadius: 28 }),
      text('UP TO 70% OFF', 'Montserrat', 26, [0, 78], { fontWeight: 800, letterSpacing: 4, fill: '#fde047' }),
    ],
  },
  {
    id: 'combo-new-arrivals',
    label: 'New arrivals',
    tags: 'new arrivals fashion collection launch',
    parts: [
      text('ARRIVALS', 'Montserrat', 76, [0, 40], { fontWeight: 900, letterSpacing: 6, fill: '#111827' }),
      text('new', 'Pacifico', 116, [-120, -44], { fill: '#db2777', rotation: -8 }),
    ],
  },
  {
    id: 'combo-price-tag',
    label: 'Price tag',
    tags: 'price only deal cost tag',
    parts: [
      text('ONLY', 'Montserrat', 24, [0, -112], { fontWeight: 800, letterSpacing: 10, fill: '#15803d' }),
      rect([0, 0], 400, 160, '#16a34a', { cornerRadius: 24 }),
      text('$19.99', 'Archivo Black', 96, [0, 0], { lineHeight: 1, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-cyber-monday',
    label: 'Cyber Monday',
    tags: 'cyber monday tech deals online',
    parts: [
      text('CYBER', 'Archivo Black', 140, [0, -30], { look: 'tfx-glitch-cyan' }),
      text('MONDAY', 'Space Grotesk', 58, [0, 92], { fontWeight: 700, letterSpacing: 16, fill: '#0f172a' }),
    ],
  },
  {
    id: 'combo-free-shipping',
    label: 'Free shipping',
    tags: 'free shipping delivery orders',
    parts: [
      text('FREE', 'Bowlby One', 124, [0, -70], { lineHeight: 1, fill: '#0ea5e9' }),
      text('SHIPPING', 'Bowlby One', 66, [0, 36], { lineHeight: 1, fill: 'transparent', textStroke: outline(3, '#0ea5e9') }),
      text('on all orders', 'Caveat', 46, [0, 116], { fill: '#334155' }),
    ],
  },
  {
    id: 'combo-last-chance',
    label: 'Last chance',
    tags: 'last chance hurry final sale',
    parts: [
      text('CHANCE', 'Anton', 140, [0, 34], { lineHeight: 1, fill: '#111827' }),
      text('Last', 'Kaushan Script', 96, [-110, -62], { fill: '#e11d48', rotation: -6 }),
      rect([0, 124], 320, 12, '#e11d48', { cornerRadius: 6 }),
    ],
  },
  {
    id: 'combo-weekend-special',
    label: 'Weekend special',
    tags: 'weekend special offer deal',
    parts: [
      text('weekend', 'Yellowtail', 90, [0, -58], { fill: '#f97316' }),
      text('SPECIAL', 'Archivo Black', 108, [0, 42], { lineHeight: 1, fill: '#1e1b4b', textShadow: shadow(6, 6, 0, '#fdba74') }),
    ],
  },
];

export default combos;
