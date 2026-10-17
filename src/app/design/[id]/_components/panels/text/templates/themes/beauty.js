// ============================================
// FILE: panels/text/templates/themes/beauty.js
// PURPOSE: Text templates — Beauty & wellness
// ============================================

import { circle, gradient, line, rect, ringText, shape, text } from '../comboParts';

const combos = [
  {
    id: 'combo-beauty-glow',
    label: 'Glow',
    tags: 'glow skin skincare radiant beauty sparkle studio',
    parts: [
      text('glow', 'Bodoni Moda', 190, [0, -24], { fontStyle: 'italic', fontWeight: 500, fill: gradient(180, '#c98f86', '#7a4a3f') }),
      shape('sparkle', [178, -104], 44, 44, '#c9a063'),
      shape('sparkle', [214, -58], 22, 22, '#c9a063'),
      text('SKIN · BODY · SOUL', 'Montserrat', 18, [6, 100], { fontWeight: 500, letterSpacing: 12, fill: '#5a3e36' }),
    ],
  },
  {
    id: 'combo-beauty-self-care-sunday',
    label: 'Self care Sunday',
    tags: 'self care sunday wellness rest ritual slow morning sun',
    parts: [
      shape('semicircle', [0, -44], 320, 160, '#f0d6cc'),
      text('self care', 'Allura', 104, [0, -38], { fill: '#8e5f6b' }),
      line([0, 36], 420, '#8e5f6b', { weight: 1.5 }),
      text('SUNDAY', 'Montserrat', 24, [9, 78], { fontWeight: 500, letterSpacing: 18, fill: '#5a3e36' }),
    ],
  },
  {
    id: 'combo-beauty-new-arrivals',
    label: 'New arrivals',
    tags: 'new arrivals just landed new in shop collection launch product',
    parts: [
      text('Just landed', 'Playfair Display', 92, [0, -44], { fontStyle: 'italic', fill: '#5a3e36' }),
      rect([0, 74], 360, 70, '#5a3e36', { cornerRadius: 35 }),
      text('NEW ARRIVALS', 'Montserrat', 22, [6, 74], { fontWeight: 600, letterSpacing: 12, fill: '#f6ede6' }),
    ],
  },
  {
    id: 'combo-beauty-book-now',
    label: 'Book now',
    tags: 'book now appointment booking salon hair nails brows call',
    parts: [
      text('Book\nnow', 'Playfair Display', 104, [-150, 0], { fontStyle: 'italic', lineHeight: 0.95, textAlign: 'right', fill: '#5a3e36' }),
      line([0, 0], 190, '#b56f76', { weight: 1.5, rotation: 90 }),
      text('HAIR\nNAILS\nBROWS', 'Montserrat', 20, [118, -26], { fontWeight: 500, letterSpacing: 10, lineHeight: 1.6, textAlign: 'left', fill: '#5a3e36' }),
      text('@yourhandle', 'Montserrat', 17, [118, 72], { fontWeight: 600, letterSpacing: 2, textAlign: 'left', fill: '#b56f76' }),
    ],
  },
  {
    id: 'combo-beauty-clean-beauty',
    label: 'Clean beauty',
    tags: 'clean beauty vegan natural skincare cruelty free green leaf',
    parts: [
      text('clean', 'Jost', 150, [0, -30], { fontWeight: 300, fill: '#5f6e55' }),
      shape('teardrop-leaf', [176, -104], 46, 46, '#8f9d82'),
      text('BEAUTY', 'Jost', 26, [11, 64], { fontWeight: 500, letterSpacing: 22, fill: '#5f6e55' }),
      text('VEGAN · CRUELTY FREE', 'Jost', 14, [4, 104], { fontWeight: 400, letterSpacing: 8, fill: '#8f9d82' }),
    ],
  },
  {
    id: 'combo-beauty-nail-studio',
    label: 'Nail studio',
    tags: 'nail studio nails manicure pedicure gel salon',
    parts: [
      text('Nail', 'Great Vibes', 120, [0, -60], { fill: '#a5646b' }),
      text('STUDIO', 'Bodoni Moda', 76, [8, 32], { letterSpacing: 16, fill: '#5a3e36' }),
      line([0, 90], 60, '#c9a063', { weight: 1.5 }),
      text('MANICURE · PEDICURE · GEL', 'Montserrat', 14, [3, 118], { fontWeight: 500, letterSpacing: 6, fill: '#7a5a4d' }),
    ],
  },
  {
    id: 'combo-beauty-lash-brow',
    label: 'Lash & brow',
    tags: 'lash and brow bar lashes brows extensions lamination studio',
    parts: [
      text('LASH', 'Italiana', 92, [-176, -6], { letterSpacing: 8, fill: '#5a3e36' }),
      text('&', 'Great Vibes', 110, [-12, 0], { fill: '#b08d57' }),
      text('BROW', 'Italiana', 92, [200, -6], { letterSpacing: 8, fill: '#5a3e36' }),
      text('BAR BY MIA', 'Montserrat', 20, [7, 86], { fontWeight: 500, letterSpacing: 14, fill: '#7a5a4d' }),
    ],
  },
  {
    id: 'combo-beauty-spa-day',
    label: 'Spa day',
    tags: 'spa day relax unwind massage wellness retreat arch',
    parts: [
      shape('arch', [0, 0], 300, 390, '#ecd3cc'),
      text('Spa', 'Great Vibes', 130, [0, -34], { fill: '#6b4a3f' }),
      text('DAY', 'Montserrat', 30, [9, 58], { fontWeight: 500, letterSpacing: 18, fill: '#6b4a3f' }),
      text('RELAX & UNWIND', 'Montserrat', 16, [3, 136], { fontWeight: 500, letterSpacing: 6, fill: '#8e6a5c' }),
    ],
  },
  {
    id: 'combo-beauty-skin-first',
    label: 'Skin first',
    tags: 'skin first skincare dermatologist editorial routine',
    parts: [
      text('DERMATOLOGIST APPROVED', 'Montserrat', 18, [5, -108], { fontWeight: 500, letterSpacing: 10, fill: '#7a5a4d' }),
      text('Skin', 'Bodoni Moda', 124, [-142, 0], { fill: '#5a3e36' }),
      text('first.', 'Bodoni Moda', 124, [134, 0], { fontStyle: 'italic', fill: '#b56f76' }),
    ],
  },
  {
    id: 'combo-beauty-relax-renew-restore',
    label: 'Relax renew restore',
    tags: 'relax renew restore wellness spa retreat massage yoga',
    parts: [
      text('RELAX', 'Cormorant Garamond', 56, [9, -92], { fontWeight: 500, letterSpacing: 18, fill: '#5f6e55' }),
      text('renew', 'Great Vibes', 96, [0, -6], { fill: '#b08d57' }),
      text('RESTORE', 'Cormorant Garamond', 56, [9, 80], { fontWeight: 500, letterSpacing: 18, fill: '#5f6e55' }),
    ],
  },
  {
    id: 'combo-beauty-pure-seal',
    label: 'Pure seal',
    tags: 'pure natural organic vegan skincare seal badge stamp',
    parts: [
      circle([0, 0], 320, 'transparent', { stroke: '#8f9d82', strokeWidth: 2 }),
      ringText('NATURAL · ORGANIC', 'Montserrat', 16, [0, 0], 136, 'top', { fontWeight: 600, letterSpacing: 7, fill: '#5f6e55' }),
      ringText('VEGAN SKINCARE', 'Montserrat', 16, [0, 0], 136, 'bottom', { fontWeight: 600, letterSpacing: 7, fill: '#5f6e55' }),
      text('pure', 'Great Vibes', 104, [0, -14], { fill: '#5f6e55' }),
      shape('teardrop-leaf', [-11, 64], 22, 22, '#5f6e55', { rotation: -75 }),
      shape('teardrop-leaf', [11, 64], 22, 22, '#8f9d82', { rotation: -15 }),
    ],
  },
  {
    id: 'combo-beauty-hair-studio',
    label: 'Hair studio',
    tags: 'hair studio salon cut colour style blowout hairdresser',
    parts: [
      text('HAIR', 'Bodoni Moda', 160, [6, -18], { letterSpacing: 12, fill: '#5a3e36' }),
      text('studio', 'Allura', 96, [118, 54], { fill: '#b56f76', rotation: -4 }),
      text('CUT · COLOUR · STYLE', 'Montserrat', 17, [4, 128], { fontWeight: 500, letterSpacing: 8, fill: '#7a5a4d' }),
    ],
  },
  {
    id: 'combo-beauty-facial-price',
    label: 'Facial price',
    tags: 'signature facial price menu treatment spa skincare offer',
    parts: [
      text('Signature Facial', 'Playfair Display', 54, [0, -114], { fontStyle: 'italic', fill: '#5a3e36' }),
      text('$85', 'Bodoni Moda', 130, [0, 10], { fill: '#b56f76' }),
      line([0, 86], 60, '#c9a063', { weight: 1.5 }),
      text('60 MIN · ALL SKIN TYPES', 'Montserrat', 16, [4, 114], { fontWeight: 500, letterSpacing: 8, fill: '#7a5a4d' }),
    ],
  },
  {
    id: 'combo-beauty-first-visit-offer',
    label: 'First visit offer',
    tags: 'treat yourself discount offer coupon voucher percent off code',
    parts: [
      rect([0, 0], 500, 310, 'transparent', { stroke: '#b56f76', strokeWidth: 2, strokeStyle: 'dashed', dashLength: 10, cornerRadius: 18 }),
      text('treat yourself', 'Great Vibes', 64, [0, -96], { fill: '#8e5f6b' }),
      text('20% OFF', 'Bodoni Moda', 100, [4, 12], { fontWeight: 500, letterSpacing: 4, fill: '#5a3e36' }),
      text('CODE: GLOW20', 'Montserrat', 17, [5, 96], { fontWeight: 600, letterSpacing: 10, fill: '#b56f76' }),
    ],
  },
  {
    id: 'combo-beauty-makeup-artist',
    label: 'Makeup artist',
    tags: 'makeup artist mua logo signature brand name bridal',
    parts: [
      text('Mia Laurent', 'Allura', 110, [0, -30], { fill: '#2f2622' }),
      line([-212, 62], 70, '#c9a063', { weight: 1.5 }),
      text('MAKEUP ARTIST', 'Montserrat', 17, [6, 62], { fontWeight: 500, letterSpacing: 12, fill: '#7a5a4d' }),
      line([212, 62], 70, '#c9a063', { weight: 1.5 }),
    ],
  },
];

export default combos;
