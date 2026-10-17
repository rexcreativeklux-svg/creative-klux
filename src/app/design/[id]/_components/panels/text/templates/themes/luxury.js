// ============================================
// FILE: panels/text/templates/themes/luxury.js
// PURPOSE: Text templates — Luxury
// ============================================

import { circle, gradient, line, rect, ringText, shape, text } from '../comboParts';

// Black, ivory and champagne gold, with emerald / burgundy / navy plates.
// The bright champagne gradient only ever sits on a dark plate; on the light
// page, gold type uses the deeper gradient and small gold lines the dark ink.
const BLACK = '#0b0b0b';
const IVORY = '#faf7f0';
const GOLD = gradient(180, '#f3e3b0', '#c9a24c', '#8a6a1f');
const GOLD_DEEP = gradient(180, '#c9a24c', '#8a6a1f');
const GOLD_PLATE = gradient(135, '#f3e3b0', '#d4b062', '#b8913f');
const GOLD_LINE = '#c9a24c';
const GOLD_INK = '#8a6a1f';
const CHAMPAGNE = '#e6cf8f';
const EMERALD = '#064e3b';
const BURGUNDY = '#6b1d2a';
const NAVY = '#0f1b3d';

const combos = [
  {
    id: 'combo-luxury-limited-edition',
    label: 'Limited edition',
    tags: 'limited edition luxury black gold numbered exclusive',
    parts: [
      rect([0, 0], 560, 300, BLACK, { cornerRadius: 4 }),
      rect([0, 0], 524, 264, 'transparent', { stroke: GOLD_LINE, strokeWidth: 1.5 }),
      text('Limited', 'Great Vibes', 124, [0, -24], { fill: GOLD }),
      text('EDITION', 'Cormorant Garamond', 32, [8, 50], { fontWeight: 600, letterSpacing: 16, fill: CHAMPAGNE }),
      text('Nº 001 / 250', 'Cormorant Garamond', 18, [4, 96], { fontWeight: 600, letterSpacing: 8, fill: '#b59a62' }),
    ],
  },
  {
    id: 'combo-luxury-exclusive',
    label: 'Exclusive',
    tags: 'exclusive members only luxury gold sparkle vip',
    parts: [
      shape('sparkle', [-280, -15], 32, 32, GOLD_DEEP),
      text('EXCLUSIVE', 'Bodoni Moda', 64, [7, -10], { fontWeight: 500, letterSpacing: 14, fill: BLACK }),
      shape('sparkle', [280, -15], 32, 32, GOLD_DEEP),
      text('members only', 'Pinyon Script', 62, [0, 72], { fill: GOLD_DEEP }),
    ],
  },
  {
    id: 'combo-luxury-vip-access',
    label: 'VIP access',
    tags: 'vip access pass ticket black gold crown luxury',
    parts: [
      rect([0, 0], 560, 320, BLACK, { cornerRadius: 24 }),
      shape('crown', [4, -102], 64, 46, GOLD),
      text('VIP', 'Bodoni Moda', 150, [8, 20], { fontWeight: 700, letterSpacing: 16, fill: GOLD }),
      line([-150, 104], 80, GOLD_LINE, { weight: 1 }),
      text('ACCESS', 'Montserrat', 20, [10, 104], { fontWeight: 500, letterSpacing: 20, fill: IVORY }),
      line([150, 104], 80, GOLD_LINE, { weight: 1 }),
    ],
  },
  {
    id: 'combo-luxury-private-collection',
    label: 'Private collection',
    tags: 'private collection burgundy gold autumn winter luxury fashion',
    parts: [
      rect([0, 0], 540, 340, BURGUNDY),
      rect([0, 0], 508, 308, 'transparent', { stroke: GOLD_LINE, strokeWidth: 1.25 }),
      rect([0, 0], 496, 296, 'transparent', { stroke: GOLD_LINE, strokeWidth: 0.6 }),
      text('Nº 07', 'Cormorant Garamond', 20, [4, -108], { fontWeight: 600, letterSpacing: 8, fill: CHAMPAGNE }),
      text('Private', 'Bodoni Moda', 104, [0, -22], { fontStyle: 'italic', fontWeight: 400, fill: IVORY }),
      text('COLLECTION', 'Cormorant Garamond', 30, [8, 56], { fontWeight: 600, letterSpacing: 16, fill: GOLD }),
      text('AUTUMN — WINTER 2027', 'Cormorant Garamond', 15, [4, 102], { fontWeight: 600, letterSpacing: 8, fill: CHAMPAGNE }),
    ],
  },
  {
    id: 'combo-luxury-grand-opening',
    label: 'Grand opening',
    tags: 'grand opening launch invitation gold script luxury event',
    parts: [
      text('GRAND', 'Marcellus', 36, [11, -124], { letterSpacing: 22, fill: BLACK }),
      text('Opening', 'Pinyon Script', 124, [0, -24], { fill: GOLD_DEEP }),
      line([-130, 78], 180, GOLD_INK, { weight: 1 }),
      shape('diamond', [0, 78], 14, 14, GOLD_INK),
      line([130, 78], 180, GOLD_INK, { weight: 1 }),
      text('SATURDAY 12 OCTOBER · 7 PM', 'Marcellus', 17, [3, 112], { letterSpacing: 6, fill: BLACK }),
    ],
  },
  {
    id: 'combo-luxury-fine-jewellery',
    label: 'Fine jewellery',
    tags: 'fine jewellery jewelry wordmark diamond brand luxury paris',
    parts: [
      shape('diamond', [0, -102], 26, 36, GOLD_DEEP),
      text('AURELIA', 'Italiana', 104, [10, -10], { letterSpacing: 20, fill: BLACK }),
      text('FINE JEWELLERY · PARIS', 'Montserrat', 16, [6, 62], { fontWeight: 500, letterSpacing: 12, fill: GOLD_INK }),
    ],
  },
  {
    id: 'combo-luxury-perfume',
    label: 'Perfume',
    tags: 'perfume fragrance eau de parfum noir arch black gold luxury',
    parts: [
      shape('arch', [0, 0], 320, 420, BLACK),
      shape('arch', [0, 0], 290, 390, 'transparent', { stroke: GOLD_LINE, strokeWidth: 1.25 }),
      shape('sparkle', [0, -100], 28, 28, GOLD),
      text('Noir', 'Bodoni Moda', 100, [0, -6], { fontStyle: 'italic', fontWeight: 400, fill: GOLD }),
      text('EAU DE PARFUM', 'Montserrat', 15, [4, 56], { fontWeight: 500, letterSpacing: 7, fill: IVORY }),
      text('50 ml', 'Cormorant Garamond', 22, [0, 146], { fontStyle: 'italic', fontWeight: 500, fill: CHAMPAGNE }),
    ],
  },
  {
    id: 'combo-luxury-boutique-hotel',
    label: 'Boutique hotel',
    tags: 'boutique hotel london frame elegant luxury travel',
    parts: [
      rect([0, 0], 560, 300, 'transparent', { stroke: BLACK, strokeWidth: 1.5 }),
      rect([0, 0], 544, 284, 'transparent', { stroke: BLACK, strokeWidth: 0.6 }),
      text('THE', 'Cormorant Garamond', 22, [7, -94], { fontWeight: 600, letterSpacing: 14, fill: GOLD_INK }),
      text('Hartley', 'Playfair Display', 112, [0, -10], { fontWeight: 400, fill: BLACK }),
      text('BOUTIQUE HOTEL · LONDON', 'Cormorant Garamond', 17, [5, 82], { fontWeight: 600, letterSpacing: 10, fill: BLACK }),
    ],
  },
  {
    id: 'combo-luxury-champagne-brunch',
    label: 'Champagne brunch',
    tags: 'champagne brunch sunday celebration gold sparkle luxury',
    parts: [
      rect([0, 0], 540, 320, IVORY, { cornerRadius: 10, stroke: '#d9c48f', strokeWidth: 1.5 }),
      text('Champagne', 'Great Vibes', 110, [0, -42], { fill: GOLD_DEEP }),
      shape('sparkle', [226, -112], 30, 30, GOLD_DEEP),
      shape('sparkle', [250, -82], 16, 16, GOLD_DEEP),
      text('BRUNCH', 'Marcellus', 40, [12, 60], { letterSpacing: 24, fill: BLACK }),
      text('SUNDAYS · 11 AM — 3 PM', 'Montserrat', 15, [4, 108], { fontWeight: 500, letterSpacing: 8, fill: GOLD_INK }),
    ],
  },
  {
    id: 'combo-luxury-monogram-seal',
    label: 'Monogram seal',
    tags: 'monogram seal initials logo maison est gold luxury',
    parts: [
      circle([0, 0], 320, 'transparent', { stroke: GOLD_INK, strokeWidth: 1.5 }),
      circle([0, 0], 300, 'transparent', { stroke: GOLD_INK, strokeWidth: 0.75 }),
      ringText('MAISON AURELLE', 'Cormorant Garamond', 20, [0, 0], 130, 'top', { fontWeight: 600, letterSpacing: 8, fill: BLACK }),
      ringText('EST. 1998', 'Cormorant Garamond', 20, [0, 0], 130, 'bottom', { fontWeight: 600, letterSpacing: 8, fill: BLACK }),
      shape('diamond', [-130, 0], 9, 9, GOLD_INK),
      shape('diamond', [130, 0], 9, 9, GOLD_INK),
      text('A', 'Bodoni Moda', 96, [-46, 14], { fontWeight: 400, fill: BLACK }),
      rect([0, 0], 1.25, 90, GOLD_INK),
      text('M', 'Bodoni Moda', 96, [55, 14], { fontWeight: 400, fill: BLACK }),
    ],
  },
  {
    id: 'combo-luxury-members-club',
    label: 'Members club',
    tags: 'members club private emerald gold key mayfair luxury',
    parts: [
      rect([0, 0], 560, 320, EMERALD, { cornerRadius: 6 }),
      shape('key', [0, -104], 64, 32, GOLD),
      text('The Members', 'Playfair Display', 72, [0, -24], { fontStyle: 'italic', fontWeight: 400, fill: IVORY }),
      text('CLUB', 'Cormorant Garamond', 34, [13, 50], { fontWeight: 600, letterSpacing: 26, fill: GOLD }),
      text('EST. 1926 · MAYFAIR', 'Montserrat', 15, [4, 104], { fontWeight: 500, letterSpacing: 8, fill: CHAMPAGNE }),
    ],
  },
  {
    id: 'combo-luxury-black-tie',
    label: 'Black tie gala',
    tags: 'black tie gala dinner evening navy gold invitation luxury',
    parts: [
      rect([0, 0], 560, 320, NAVY),
      text('An evening of', 'Cormorant Garamond', 30, [0, -92], { fontStyle: 'italic', fontWeight: 400, fill: CHAMPAGNE }),
      text('BLACK TIE', 'Italiana', 72, [6, -14], { letterSpacing: 12, fill: GOLD }),
      line([-112, 50], 120, GOLD_LINE, { weight: 1 }),
      shape('diamond', [0, 50], 10, 10, GOLD_LINE),
      line([112, 50], 120, GOLD_LINE, { weight: 1 }),
      text('GALA DINNER · 14.12.2027', 'Montserrat', 15, [4, 92], { fontWeight: 500, letterSpacing: 8, fill: IVORY }),
    ],
  },
  {
    id: 'combo-luxury-haute-couture',
    label: 'Haute couture',
    tags: 'haute couture fashion paris milan new york luxury',
    parts: [
      text('Haute', 'Bodoni Moda', 150, [0, -40], { fontStyle: 'italic', fontWeight: 400, fill: BLACK }),
      text('COUTURE', 'Bodoni Moda', 44, [14, 48], { fontWeight: 500, letterSpacing: 28, fill: GOLD_INK }),
      text('Paris — Milan — New York', 'Cormorant Garamond', 24, [0, 102], { fontStyle: 'italic', fontWeight: 500, fill: BLACK }),
    ],
  },
  {
    id: 'combo-luxury-gift-card',
    label: 'Gift card',
    tags: 'gift card voucher gold 250 present luxury',
    parts: [
      rect([0, 0], 560, 330, GOLD_PLATE, { cornerRadius: 22 }),
      rect([0, 0], 528, 298, 'transparent', { stroke: '#7a5c1c', strokeWidth: 1, cornerRadius: 14 }),
      text('MAISON AURELLE', 'Cormorant Garamond', 16, [4, -112], { fontWeight: 700, letterSpacing: 8, fill: BLACK }),
      text('Gift Card', 'Great Vibes', 104, [0, -16], { fill: BLACK }),
      text('$250', 'Bodoni Moda', 44, [-128, 104], { fontWeight: 600, textAlign: 'left', width: 220, fill: BLACK }),
      text('VALID UNTIL 12 / 2027', 'Montserrat', 13, [88, 112], { fontWeight: 600, letterSpacing: 4, textAlign: 'right', width: 300, fill: BLACK }),
    ],
  },
  {
    id: 'combo-luxury-numbered-edition',
    label: 'Numbered edition',
    tags: 'numbered edition 001 of 100 pieces limited gold luxury',
    parts: [
      text('Nº', 'Bodoni Moda', 50, [-188, -80], { fontWeight: 400, fill: GOLD_INK }),
      text('001', 'Bodoni Moda', 190, [30, 0], { fontWeight: 400, fill: GOLD_DEEP }),
      line([0, 84], 60, GOLD_INK, { weight: 1 }),
      text('ONE OF ONE HUNDRED', 'Montserrat', 16, [6, 112], { fontWeight: 500, letterSpacing: 12, fill: BLACK }),
    ],
  },
];

export default combos;
