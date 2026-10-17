// ============================================
// FILE: panels/text/templates/themes/wedding.js
// PURPOSE: Text templates — Wedding & love
// ============================================

import { circle, gradient, heart, line, rect, ringText, shape, text } from '../comboParts';

const combos = [
  {
    id: 'combo-wedding-save-the-date',
    label: 'Save the date',
    tags: 'save the date wedding invite engagement announcement gold script',
    parts: [
      text('Save the Date', 'Great Vibes', 104, [0, -46], { fill: gradient(180, '#c9a063', '#8c6a32') }),
      line([-222, 52], 70, '#b08d57', { weight: 1.5 }),
      text('06 · 14 · 2027', 'Cormorant Garamond', 34, [4, 52], { fontWeight: 500, letterSpacing: 8, fill: '#5c4a36' }),
      line([222, 52], 70, '#b08d57', { weight: 1.5 }),
      text('EMMA & JAMES', 'Montserrat', 17, [5, 108], { fontWeight: 500, letterSpacing: 10, fill: '#8a7560' }),
    ],
  },
  {
    id: 'combo-wedding-mr-and-mrs',
    label: 'Mr & Mrs',
    tags: 'mr and mrs wedding married couple names signage',
    parts: [
      text('Mr', 'Bodoni Moda', 130, [-196, -14], { fill: '#2f2a26' }),
      text('&', 'Great Vibes', 130, [-38, 0], { fill: gradient(180, '#c9a063', '#8c6a32') }),
      text('Mrs', 'Bodoni Moda', 130, [164, -14], { fill: '#2f2a26' }),
      text('THE HARRINGTONS · EST. 2027', 'Montserrat', 17, [4, 104], { fontWeight: 500, letterSpacing: 8, fill: '#8a7560' }),
    ],
  },
  {
    id: 'combo-wedding-invitation-arch',
    label: 'Invitation arch',
    tags: 'wedding invitation invite names date venue arch sage ivory',
    parts: [
      shape('arch', [0, 10], 340, 440, '#faf6ee', { stroke: '#a3b18a', strokeWidth: 2 }),
      text('Emma', 'Great Vibes', 88, [0, -84], { fill: '#56664b' }),
      text('&', 'Cormorant Garamond', 64, [0, -10], { fontStyle: 'italic', fill: '#b08d57' }),
      text('James', 'Great Vibes', 88, [0, 80], { fill: '#56664b' }),
      text('06.14.2027 · NAPA', 'Montserrat', 16, [3, 166], { fontWeight: 500, letterSpacing: 6, fill: '#6f7d63' }),
    ],
  },
  {
    id: 'combo-wedding-monogram-seal',
    label: 'Monogram seal',
    tags: 'monogram initials wedding seal crest logo stamp gold',
    parts: [
      circle([0, 0], 320, 'transparent', { stroke: '#b08d57', strokeWidth: 1.5 }),
      ringText('EMMA & JAMES', 'Montserrat', 15, [0, 0], 140, 'top', { fontWeight: 500, letterSpacing: 8, fill: '#8c6a32' }),
      ringText('JUNE 14 · 2027', 'Montserrat', 15, [0, 0], 140, 'bottom', { fontWeight: 500, letterSpacing: 8, fill: '#8c6a32' }),
      shape('diamond', [-134, 0], 10, 10, '#b08d57'),
      shape('diamond', [134, 0], 10, 10, '#b08d57'),
      text('E', 'Cormorant Garamond', 116, [-40, 0], { fontWeight: 300, fill: '#2f2a26' }),
      line([0, 0], 96, '#b08d57', { weight: 1.5, rotation: 90 }),
      text('J', 'Cormorant Garamond', 116, [38, 0], { fontWeight: 300, fill: '#2f2a26' }),
    ],
  },
  {
    id: 'combo-wedding-just-married',
    label: 'Just married',
    tags: 'just married wedding newlyweds car sign celebration',
    parts: [
      text('MARRIED', 'Playfair Display', 96, [5, 24], { letterSpacing: 10, fill: '#2f2a26' }),
      text('Just', 'Great Vibes', 116, [-178, -54], { fill: gradient(180, '#c9a063', '#8c6a32'), rotation: -6 }),
      text('06.14.2027', 'Montserrat', 18, [6, 110], { fontWeight: 500, letterSpacing: 12, fill: '#8a7560' }),
    ],
  },
  {
    id: 'combo-wedding-thank-you',
    label: 'Thank you',
    tags: 'thank you wedding celebrating with us card favour rose heart',
    parts: [
      text('Thank you', 'Allura', 128, [0, -40], { fill: '#a0616a' }),
      line([-118, 52], 150, '#d4aeb0', { weight: 1 }),
      heart([0, 52], 20, '#c48b8b'),
      line([118, 52], 150, '#d4aeb0', { weight: 1 }),
      text('FOR CELEBRATING WITH US', 'Cormorant Garamond', 22, [4, 100], { fontWeight: 600, letterSpacing: 7, fill: '#7a4f55' }),
    ],
  },
  {
    id: 'combo-wedding-bride-to-be',
    label: 'Bride to be',
    tags: 'bride to be bridal shower hen party bachelorette ribbon',
    parts: [
      text('Bride', 'Pinyon Script', 150, [0, -44], { fill: '#8e4f5a' }),
      shape('sparkle', [178, -96], 30, 30, '#c9a063'),
      shape('banner-swallowtail', [0, 52], 340, 62, '#b7727d'),
      text('TO BE', 'Montserrat', 24, [8, 52], { fontWeight: 600, letterSpacing: 16, fill: '#fff8f3' }),
    ],
  },
  {
    id: 'combo-wedding-forever-and-always',
    label: 'Forever & always',
    tags: 'forever and always love wedding anniversary romance vow',
    parts: [
      text('forever', 'Cormorant Garamond', 140, [-24, -30], { fontStyle: 'italic', fontWeight: 300, fill: '#56664b' }),
      text('& always', 'Great Vibes', 84, [112, 66], { fill: gradient(180, '#c9a063', '#8c6a32') }),
    ],
  },
  {
    id: 'combo-wedding-our-story',
    label: 'Our story',
    tags: 'our story love story wedding couple chapter frame',
    parts: [
      rect([0, 0], 520, 300, 'transparent', { stroke: '#b08d57', strokeWidth: 1.5 }),
      rect([0, 0], 500, 280, 'transparent', { stroke: '#b08d57', strokeWidth: 0.75 }),
      text('CHAPTER ONE', 'Montserrat', 15, [5, -84], { fontWeight: 500, letterSpacing: 10, fill: '#8a7560' }),
      text('Our Story', 'Playfair Display', 92, [0, -4], { fontStyle: 'italic', fill: '#2f2a26' }),
      text('EST. 2019 · NEW YORK', 'Montserrat', 15, [5, 82], { fontWeight: 500, letterSpacing: 10, fill: '#8a7560' }),
    ],
  },
  {
    id: 'combo-wedding-bridesmaid',
    label: 'Be my bridesmaid',
    tags: 'will you be my bridesmaid proposal maid of honor wedding party',
    parts: [
      text('WILL YOU BE MY', 'Montserrat', 20, [5, -106], { fontWeight: 500, letterSpacing: 10, fill: '#8a7560', curve: 24 }),
      text('Bridesmaid?', 'Great Vibes', 120, [0, 6], { fill: '#a0616a' }),
      text('love, Emma', 'Great Vibes', 50, [0, 104], { fill: '#b08d57' }),
    ],
  },
  {
    id: 'combo-wedding-rsvp',
    label: 'RSVP',
    tags: 'rsvp kindly reply wedding response card invitation',
    parts: [
      text('RSVP', 'Italiana', 150, [15, -24], { letterSpacing: 30, fill: '#2f2a26' }),
      line([0, 60], 240, '#b08d57', { weight: 2, style: 'dotted' }),
      text('kindly reply by', 'Great Vibes', 54, [0, 104], { fill: '#8c6a32' }),
      text('MAY 1 · 2027', 'Montserrat', 16, [5, 156], { fontWeight: 500, letterSpacing: 10, fill: '#8a7560' }),
    ],
  },
  {
    id: 'combo-wedding-happily-ever-after',
    label: 'Happily ever after',
    tags: 'happily ever after wedding love fairytale sage label',
    parts: [
      rect([0, 0], 470, 270, '#66775a', { cornerRadius: 22 }),
      rect([0, 0], 446, 246, 'transparent', { stroke: '#e9e2d0', strokeWidth: 1.25, cornerRadius: 14 }),
      text('Happily', 'Great Vibes', 104, [0, -30], { fill: '#fbf7ef' }),
      text('EVER AFTER', 'Cormorant Garamond', 28, [7, 62], { fontWeight: 600, letterSpacing: 14, fill: '#e9e2d0' }),
    ],
  },
  {
    id: 'combo-wedding-she-said-yes',
    label: 'She said yes',
    tags: 'she said yes engagement engaged ring proposal announcement',
    parts: [
      circle([0, -128], 40, 'transparent', { stroke: '#b08d57', strokeWidth: 3 }),
      shape('diamond', [0, -158], 24, 20, '#b08d57'),
      text('She said', 'Great Vibes', 84, [0, -52], { fill: '#a0616a' }),
      text('YES!', 'Bodoni Moda', 130, [5, 60], { fontWeight: 500, letterSpacing: 10, fill: '#2f2a26' }),
    ],
  },
  {
    id: 'combo-wedding-welcome-sign',
    label: 'Welcome sign',
    tags: 'welcome to the wedding of sign signage entrance names',
    parts: [
      text('Welcome', 'Great Vibes', 130, [0, -54], { fill: '#56664b' }),
      line([0, 36], 280, '#b08d57', { weight: 1 }),
      text('TO THE WEDDING OF', 'Montserrat', 15, [4, 66], { fontWeight: 500, letterSpacing: 8, fill: '#8a7560' }),
      text('Emma & James', 'Cormorant Garamond', 46, [0, 114], { fontStyle: 'italic', fontWeight: 500, fill: '#2f2a26' }),
    ],
  },
  {
    id: 'combo-wedding-date-block',
    label: 'Wedding date',
    tags: 'wedding date saturday june invitation save the date split',
    parts: [
      text('Saturday', 'Great Vibes', 76, [0, -106], { fill: gradient(180, '#c9a063', '#8c6a32') }),
      line([-162, -12], 130, '#2f2a26', { weight: 1 }),
      text('JUNE', 'Montserrat', 24, [-157, 20], { fontWeight: 500, letterSpacing: 10, fill: '#2f2a26' }),
      line([-162, 52], 130, '#2f2a26', { weight: 1 }),
      text('14', 'Bodoni Moda', 140, [0, 18], { fill: '#2f2a26' }),
      line([162, -12], 130, '#2f2a26', { weight: 1 }),
      text('2027', 'Montserrat', 24, [167, 20], { fontWeight: 500, letterSpacing: 10, fill: '#2f2a26' }),
      line([162, 52], 130, '#2f2a26', { weight: 1 }),
    ],
  },
];

export default combos;
