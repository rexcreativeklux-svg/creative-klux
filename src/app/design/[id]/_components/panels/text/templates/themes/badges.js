// ============================================
// FILE: panels/text/templates/themes/badges.js
// PURPOSE: Text templates — Badges & labels
// ============================================

import { circle, gradient, heart, line, rect, ringText, shape, text } from '../comboParts';

// Seals, stamps, stickers and tags. Words round a ring use ringText, whose
// radius is where the middle of the letters runs — set midway between the two
// rings that frame them. A tilted sticker turns every part by the same angle,
// with each part's centre turned round the badge's centre to match.
const INK = '#111111';
const CREAM = '#fbf6ea';
const GREEN = '#2f5d3a';
const NAVY = '#1b2a4a';
const KRAFT = '#8a5a2b';
const RED = '#c0392b';
const CORAL = '#e0533d';
const GOLD_LIGHT = '#f0d68a';
const GOLD = gradient(180, '#e9c979', '#c99a3d', '#8a6420');
const BROWN = '#3d2a0a';

const combos = [
  {
    id: 'combo-badges-organic',
    label: '100% organic',
    tags: '100 organic natural product seal badge certified farm eco',
    parts: [
      circle([0, 0], 300, GREEN),
      circle([0, 0], 280, 'transparent', { stroke: CREAM, strokeWidth: 1.5 }),
      circle([0, 0], 190, 'transparent', { stroke: CREAM, strokeWidth: 1.5 }),
      ringText('CERTIFIED ORGANIC', 'Montserrat', 18, [0, 0], 117, 'top', { fontWeight: 700, letterSpacing: 4, fill: CREAM }),
      ringText('FARM TO TABLE', 'Montserrat', 18, [0, 0], 117, 'bottom', { fontWeight: 700, letterSpacing: 4, fill: CREAM }),
      shape('star5', [-117, 0], 16, 16, CREAM),
      shape('star5', [117, 0], 16, 16, CREAM),
      text('100%', 'Montserrat', 56, [0, -8], { fontWeight: 800, fill: CREAM }),
      text('ORGANIC', 'Montserrat', 15, [4, 40], { fontWeight: 700, letterSpacing: 8, fill: CREAM }),
    ],
  },
  {
    id: 'combo-badges-best-seller',
    label: 'Best seller',
    tags: 'best seller number one top gold starburst ribbon badge',
    parts: [
      shape('starburst', [0, -22], 260, 260, GOLD),
      circle([0, -22], 176, 'transparent', { stroke: BROWN, strokeWidth: 1.5 }),
      text('Nº1', 'Bodoni Moda', 64, [0, -18], { fontWeight: 700, fill: BROWN }),
      shape('banner-swallowtail', [0, 78], 460, 72, INK),
      text('BEST SELLER', 'Montserrat', 26, [3, 78], { fontWeight: 800, letterSpacing: 6, fill: GOLD_LIGHT }),
    ],
  },
  {
    id: 'combo-badges-handmade',
    label: 'Handmade',
    tags: 'handmade made with love small batch craft stamp badge',
    parts: [
      circle([0, 0], 300, 'transparent', { stroke: KRAFT, strokeWidth: 3 }),
      circle([0, 0], 214, 'transparent', { stroke: KRAFT, strokeWidth: 1.5, strokeStyle: 'dashed', dashLength: 6 }),
      ringText('MADE WITH LOVE', 'Montserrat', 18, [0, 0], 127, 'top', { fontWeight: 700, letterSpacing: 7, fill: KRAFT }),
      ringText('SMALL BATCH', 'Montserrat', 18, [0, 0], 127, 'bottom', { fontWeight: 700, letterSpacing: 7, fill: KRAFT }),
      circle([-127, 0], 7, KRAFT),
      circle([127, 0], 7, KRAFT),
      heart([0, -50], 24, KRAFT),
      text('Handmade', 'Kaushan Script', 44, [0, 4], { fill: KRAFT }),
    ],
  },
  {
    id: 'combo-badges-certified',
    label: 'Certified',
    tags: 'certified quality assured approved seal navy badge',
    parts: [
      shape('square-star-12', [0, 0], 270, 270, NAVY),
      circle([0, 0], 236, 'transparent', { stroke: GOLD_LIGHT, strokeWidth: 2 }),
      circle([0, 0], 222, 'transparent', { stroke: GOLD_LIGHT, strokeWidth: 0.75 }),
      shape('star5', [0, -52], 30, 30, GOLD_LIGHT),
      text('CERTIFIED', 'Montserrat', 30, [3, -2], { fontWeight: 800, letterSpacing: 3, fill: CREAM }),
      text('QUALITY ASSURED', 'Montserrat', 13, [2, 36], { fontWeight: 600, letterSpacing: 3, fill: GOLD_LIGHT }),
    ],
  },
  {
    id: 'combo-badges-new',
    label: 'New sticker',
    tags: 'new just in arrival sticker badge sparkle',
    parts: [
      circle([0, 0], 230, CORAL),
      circle([0, 0], 208, 'transparent', { stroke: CREAM, strokeWidth: 1.5 }),
      text('NEW', 'Archivo Black', 68, [-1, -6], { fill: CREAM, rotation: -12 }),
      text('JUST IN', 'Montserrat', 16, [11, 40], { fontWeight: 800, letterSpacing: 6, fill: CREAM, rotation: -12 }),
      shape('sparkle', [122, -104], 40, 40, CORAL),
      shape('sparkle', [150, -64], 18, 18, CORAL),
    ],
  },
  {
    id: 'combo-badges-free-shipping',
    label: 'Free shipping',
    tags: 'free shipping delivery orders label badge',
    parts: [
      rect([0, 0], 540, 190, 'transparent', { stroke: INK, strokeWidth: 3, cornerRadius: 16 }),
      rect([0, 0], 518, 168, 'transparent', { stroke: INK, strokeWidth: 1, cornerRadius: 10 }),
      text('FREE', 'Bebas Neue', 84, [-149, -10], { letterSpacing: 4, fill: RED }),
      text('SHIPPING', 'Bebas Neue', 84, [84, -10], { letterSpacing: 4, fill: INK }),
      text('ON ALL ORDERS OVER $50', 'Montserrat', 15, [3, 46], { fontWeight: 600, letterSpacing: 6, fill: INK }),
    ],
  },
  {
    id: 'combo-badges-premium-quality',
    label: 'Premium quality',
    tags: 'premium quality medal gold ribbon crown seal badge',
    parts: [
      shape('banner-swallowtail', [-45, 125], 140, 48, NAVY, { rotation: 111 }),
      shape('banner-swallowtail', [45, 125], 140, 48, NAVY, { rotation: 69 }),
      circle([0, 0], 260, GOLD),
      circle([0, 0], 232, 'transparent', { stroke: BROWN, strokeWidth: 1.5 }),
      shape('crown', [0, -50], 54, 38, BROWN),
      text('PREMIUM', 'Montserrat', 30, [2, 2], { fontWeight: 800, letterSpacing: 4, fill: BROWN }),
      text('QUALITY', 'Montserrat', 18, [5, 40], { fontWeight: 600, letterSpacing: 10, fill: BROWN }),
    ],
  },
  {
    id: 'combo-badges-established',
    label: 'Est. 2019 emblem',
    tags: 'est 2019 established since emblem logo coffee brand vintage badge',
    parts: [
      circle([0, 0], 310, 'transparent', { stroke: INK, strokeWidth: 3 }),
      circle([0, 0], 290, 'transparent', { stroke: INK, strokeWidth: 1 }),
      circle([0, 0], 196, 'transparent', { stroke: INK, strokeWidth: 1 }),
      ringText('YOUR BRAND NAME', 'Montserrat', 19, [0, 0], 121, 'top', { fontWeight: 700, letterSpacing: 6, fill: INK }),
      ringText('COFFEE ROASTERS', 'Montserrat', 19, [0, 0], 121, 'bottom', { fontWeight: 700, letterSpacing: 6, fill: INK }),
      shape('star5', [-121, 0], 14, 14, INK),
      shape('star5', [121, 0], 14, 14, INK),
      text('EST.', 'Montserrat', 14, [3, -34], { fontWeight: 700, letterSpacing: 6, fill: INK }),
      text('2019', 'Alfa Slab One', 56, [0, 10], { fill: INK }),
    ],
  },
  {
    id: 'combo-badges-price-tag',
    label: 'Price tag',
    tags: 'price tag only 49 dollar label black gold',
    parts: [
      line([-225, -40], 152, INK, { weight: 2, rotation: 31.6 }),
      shape('arrow-pentagon', [0, 0], 440, 180, INK, { rotation: 180 }),
      circle([-160, 0], 26, 'transparent', { stroke: CREAM, strokeWidth: 3 }),
      text('ONLY', 'Montserrat', 16, [54, -52], { fontWeight: 700, letterSpacing: 8, fill: GOLD_LIGHT }),
      text('$49', 'Archivo Black', 100, [50, 16], { fill: CREAM }),
    ],
  },
  {
    id: 'combo-badges-sale-thirty',
    label: 'Sale -30%',
    tags: 'sale 30 percent off discount sticker weekend badge',
    parts: [
      shape('star10', [0, 0], 280, 280, RED),
      text('SALE', 'Montserrat', 26, [-1, -46], { fontWeight: 800, letterSpacing: 10, fill: CREAM, rotation: -8 }),
      text('-30%', 'Archivo Black', 76, [2, 12], { fill: CREAM, rotation: -8 }),
      text('THIS WEEKEND ONLY', 'Montserrat', 12, [10, 63], { fontWeight: 700, letterSpacing: 3, fill: CREAM, rotation: -8 }),
    ],
  },
  {
    id: 'combo-badges-vegan',
    label: 'Vegan',
    tags: 'vegan plant based hexagon leaf label food badge',
    parts: [
      shape('hexagon', [0, 0], 280, 280, 'transparent', { stroke: GREEN, strokeWidth: 3 }),
      shape('hexagon', [0, 0], 256, 256, 'transparent', { stroke: GREEN, strokeWidth: 1 }),
      shape('teardrop-leaf', [0, -54], 40, 40, GREEN),
      text('VEGAN', 'Montserrat', 40, [3, 4], { fontWeight: 800, letterSpacing: 6, fill: GREEN }),
      text('100% PLANT BASED', 'Montserrat', 13, [2, 42], { fontWeight: 700, letterSpacing: 3, fill: GREEN }),
    ],
  },
  {
    id: 'combo-badges-money-back',
    label: 'Money-back guarantee',
    tags: 'money back guarantee 30 day satisfaction ribbon seal badge',
    parts: [
      circle([0, -22], 270, NAVY),
      circle([0, -22], 244, 'transparent', { stroke: GOLD_LIGHT, strokeWidth: 1.5 }),
      text('30', 'Bodoni Moda', 110, [0, -44], { fontWeight: 700, fill: GOLD_LIGHT }),
      text('DAY', 'Montserrat', 16, [5, 16], { fontWeight: 700, letterSpacing: 10, fill: CREAM }),
      shape('banner-swallowtail', [0, 90], 540, 66, GOLD),
      text('MONEY-BACK GUARANTEE', 'Montserrat', 18, [2, 90], { fontWeight: 800, letterSpacing: 3, fill: NAVY }),
    ],
  },
  {
    id: 'combo-badges-sold-out',
    label: 'Sold out stamp',
    tags: 'sold out stamp red rubber stamp label',
    parts: [
      rect([0, 0], 440, 150, 'transparent', { stroke: RED, strokeWidth: 5, cornerRadius: 10, rotation: -10 }),
      rect([0, 0], 416, 126, 'transparent', { stroke: RED, strokeWidth: 1.5, cornerRadius: 6, rotation: -10 }),
      text('SOLD OUT', 'Staatliches', 76, [3, 0], { letterSpacing: 6, fill: RED, rotation: -10 }),
    ],
  },
  {
    id: 'combo-badges-made-in-italy',
    label: 'Made in Italy',
    tags: 'made in italy quality goods since ribbon label badge',
    parts: [
      text('Made in', 'Kaushan Script', 48, [0, -78], { fill: INK }),
      shape('banner-swallowtail', [0, 4], 440, 90, NAVY),
      text('ITALY', 'Montserrat', 46, [7, 4], { fontWeight: 800, letterSpacing: 14, fill: CREAM }),
      text('QUALITY GOODS · SINCE 1987', 'Montserrat', 13, [3, 80], { fontWeight: 600, letterSpacing: 6, fill: INK }),
    ],
  },
  {
    id: 'combo-badges-eco-friendly',
    label: 'Eco friendly',
    tags: 'eco friendly recyclable packaging green leaf pill label badge',
    parts: [
      rect([0, 0], 480, 120, GREEN, { cornerRadius: 60 }),
      circle([-180, 0], 84, CREAM),
      shape('teardrop-leaf', [-180, 0], 40, 40, GREEN),
      text('ECO FRIENDLY', 'Montserrat', 32, [50, -14], { fontWeight: 800, letterSpacing: 3, textAlign: 'left', width: 340, fill: CREAM }),
      text('RECYCLABLE PACKAGING', 'Montserrat', 13, [50, 24], { fontWeight: 600, letterSpacing: 4, textAlign: 'left', width: 340, fill: CREAM }),
    ],
  },
];

export default combos;
