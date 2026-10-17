// ============================================
// FILE: panels/text/templates/themes/elegant.js
// PURPOSE: Text templates — Elegant
// ============================================

import { circle, gradient, rect, text } from '../comboParts';

const combos = [
  {
    id: 'combo-golden-hour',
    label: 'Golden hour',
    tags: 'golden hour sunset elegant luxury photo',
    parts: [
      text('GOLDEN', 'DM Serif Display', 116, [0, -66], { lineHeight: 1, fill: gradient(180, '#fbbf24', '#b45309') }),
      text('HOUR', 'DM Serif Display', 116, [0, 44], { lineHeight: 1, fill: gradient(180, '#fbbf24', '#b45309') }),
      text('sunset session', 'Italiana', 34, [0, 138], { letterSpacing: 10, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-luxury-collection',
    label: 'Luxury collection',
    tags: 'luxury collection premium fashion gold',
    parts: [
      text('LUXURY', 'Italiana', 110, [0, -30], { look: 'tfx-luxury-gold' }),
      text('collection', 'Great Vibes', 70, [0, 70], { fill: '#b45309' }),
    ],
  },
  {
    id: 'combo-hipster-brand',
    label: 'Hipster brand',
    tags: 'hipster brand logo signature',
    parts: [
      text('Hipster', 'Alex Brush', 140, [0, -24], { fill: '#111827' }),
      text('BRAND', 'Montserrat', 28, [40, 64], { fontWeight: 600, letterSpacing: 16, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-the-bride',
    label: 'The bride',
    tags: 'bride wedding bridal elegant',
    parts: [
      text('THE', 'Italiana', 32, [0, -110], { letterSpacing: 16, fill: '#9d174d' }),
      text('Bride', 'Pinyon Script', 140, [0, 4], { fill: '#9d174d' }),
      rect([0, 86], 120, 2, '#9d174d'),
    ],
  },
  {
    id: 'combo-maison',
    label: 'Maison',
    tags: 'maison paris fashion boutique',
    parts: [
      text('MAISON', 'Bodoni Moda', 110, [0, -20], { letterSpacing: 22, fill: '#111827' }),
      text('paris', 'Parisienne', 64, [0, 66], { fill: '#9ca3af' }),
    ],
  },
  {
    id: 'combo-beauty-salon',
    label: 'Beauty salon',
    tags: 'beauty salon spa hair makeup',
    parts: [
      text('beauty', 'Bodoni Moda', 120, [0, -24], { fontStyle: 'italic', fill: '#be185d' }),
      text('SALON & SPA', 'Montserrat', 24, [0, 66], { fontWeight: 500, letterSpacing: 16, fill: '#831843' }),
    ],
  },
  {
    id: 'combo-annual-gala',
    label: 'Annual gala',
    tags: 'gala annual evening event black tie',
    parts: [
      rect([0, 6], 460, 310, '#111111', { cornerRadius: 6 }),
      rect([0, 6], 424, 274, 'transparent', { stroke: '#d4af37', strokeWidth: 2 }),
      text('THE ANNUAL', 'Montserrat', 20, [0, -100], { fontWeight: 500, letterSpacing: 14, fill: '#d4af37' }),
      text('Gala', 'Great Vibes', 118, [0, 4], { fill: '#d4af37' }),
      text('EVENING', 'Marcellus', 28, [0, 104], { letterSpacing: 18, fill: '#d4af37' }),
    ],
  },
  {
    id: 'combo-signature',
    label: 'Signature',
    tags: 'signature jewellery fine luxury',
    parts: [
      text('Signature', 'Allura', 130, [0, -20], { fill: '#111827' }),
      text('FINE JEWELLERY', 'Italiana', 26, [0, 66], { letterSpacing: 14, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-the-edit',
    label: 'The edit',
    tags: 'edit editorial magazine fashion',
    parts: [
      text('THE', 'Playfair Display', 30, [0, -128], { letterSpacing: 18, fill: '#111827' }),
      text('Edit', 'Abril Fatface', 170, [0, -4], { lineHeight: 1, fill: '#111827' }),
      text('SPRING 2027', 'Italiana', 26, [0, 98], { letterSpacing: 14, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-wine-dine',
    label: 'Wine & dine',
    tags: 'wine dine dinner restaurant elegant',
    parts: [
      text('Wine', 'DM Serif Display', 132, [-40, -30], { lineHeight: 1, fill: '#7f1d1d' }),
      text('& dine', 'Great Vibes', 80, [80, 60], { fill: '#b45309' }),
    ],
  },
  {
    id: 'combo-less-is-more',
    label: 'Less is more',
    tags: 'minimal less is more simple',
    parts: [
      text('less', 'Cormorant Garamond', 150, [0, -26], { fontWeight: 300, lineHeight: 1, fill: '#111827' }),
      text('IS MORE', 'Montserrat', 26, [0, 66], { fontWeight: 500, letterSpacing: 20, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-eclat',
    label: 'Éclat',
    tags: 'perfume eclat fragrance luxury',
    parts: [
      text('Éclat', 'Playfair Display', 130, [0, -24], { look: 'tfx-elegant-gold' }),
      text('EAU DE PARFUM', 'Montserrat', 20, [0, 74], { fontWeight: 500, letterSpacing: 16, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-monogram',
    label: 'Monogram',
    tags: 'monogram initials wedding logo',
    parts: [
      circle([0, 0], 250, 'transparent', { stroke: '#b45309', strokeWidth: 3 }),
      text('E&H', 'Prata', 84, [0, -10], { fill: '#b45309' }),
      text('EST. 2019', 'Montserrat', 16, [0, 56], { fontWeight: 600, letterSpacing: 10, fill: '#b45309' }),
    ],
  },
];

export default combos;
