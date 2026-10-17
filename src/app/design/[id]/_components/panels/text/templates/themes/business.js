// ============================================
// FILE: panels/text/templates/themes/business.js
// PURPOSE: Text templates — Business
// ============================================

import { circle, outline, rect, ringText, text } from '../comboParts';

const combos = [
  {
    id: 'combo-tattoo-studio',
    label: 'Tattoo studio',
    tags: 'tattoo studio logo brand shop',
    parts: [
      text('TATTOO', 'Playfair Display', 124, [0, -28], { fontWeight: 900, fill: '#111111', curve: 38 }),
      text('studio', 'Great Vibes', 78, [34, 74], { fill: '#111111' }),
    ],
  },
  {
    id: 'combo-tax-tips',
    label: 'Tax tips',
    tags: 'tax tips finance money business advice',
    parts: [
      text('TAX', 'Archivo Black', 210, [-30, 0], { lineHeight: 1, fill: '#1e3a8a' }),
      rect([140, 116], 176, 66, '#22c55e', { cornerRadius: 6, rotation: -4 }),
      text('TIPS', 'Montserrat', 38, [140, 116], { fontWeight: 800, letterSpacing: 10, fill: '#ffffff', rotation: -4 }),
    ],
  },
  {
    id: 'combo-were-hiring',
    label: "We're hiring",
    tags: 'hiring jobs careers recruit vacancy',
    parts: [
      text("WE'RE", 'Montserrat', 38, [0, -132], { fontWeight: 800, letterSpacing: 14, fill: '#1e3a8a' }),
      text('HIRING', 'Anton', 150, [0, -8], { lineHeight: 1, fill: '#2563eb' }),
      rect([0, 104], 250, 60, '#2563eb', { cornerRadius: 30 }),
      text('Apply now', 'Poppins', 28, [0, 104], { fontWeight: 600, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-big-strategy',
    label: 'Big strategy',
    tags: 'strategy business plan marketing',
    parts: [
      text('BIG', 'Archivo Black', 170, [0, -40], { lineHeight: 1, fill: 'transparent', textStroke: outline(4, '#1e3a8a') }),
      text('strategy', 'DM Serif Display', 110, [0, 50], { fontStyle: 'italic', fill: '#1e3a8a' }),
    ],
  },
  {
    id: 'combo-grow-your-business',
    label: 'Grow your business',
    tags: 'grow business growth marketing',
    parts: [
      text('GROW', 'Anton', 170, [0, -30], { lineHeight: 1, fill: '#16a34a' }),
      text('your business', 'Playfair Display', 56, [0, 82], { fontWeight: 700, fontStyle: 'italic', fill: '#111827' }),
    ],
  },
  {
    id: 'combo-case-study',
    label: 'Case study',
    tags: 'case study results report success',
    parts: [
      rect([0, -82], 380, 72, '#0f172a', { cornerRadius: 10 }),
      text('CASE STUDY', 'Montserrat', 34, [0, -82], { fontWeight: 800, letterSpacing: 10, fill: '#ffffff' }),
      text('How we doubled our sales', 'Poppins', 52, [0, 44], { fontWeight: 700, lineHeight: 1.05, width: 480, fill: '#0f172a' }),
    ],
  },
  {
    id: 'combo-free-webinar',
    label: 'Free webinar',
    tags: 'webinar event online seminar free',
    parts: [
      rect([0, -122], 130, 46, '#f59e0b', { cornerRadius: 23 }),
      text('FREE', 'Montserrat', 24, [0, -122], { fontWeight: 900, letterSpacing: 6, fill: '#111827' }),
      text('WEBINAR', 'Bebas Neue', 170, [0, 6], { lineHeight: 0.95, fill: '#111827' }),
      text('Thursday · 7 PM', 'Montserrat', 30, [0, 104], { fontWeight: 600, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-q3-report',
    label: 'Quarterly report',
    tags: 'report quarterly q3 results finance',
    parts: [
      text('Q3', 'Anton', 220, [-140, 0], { lineHeight: 1, fill: '#7c3aed' }),
      text('REPORT', 'Montserrat', 46, [130, -24], { fontWeight: 900, letterSpacing: 8, fill: '#111827' }),
      text('2027 results', 'Montserrat', 28, [130, 30], { fontWeight: 500, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-brand-story',
    label: 'Our brand story',
    tags: 'brand story about us heritage',
    parts: [
      text('OUR BRAND', 'Montserrat', 30, [0, -88], { fontWeight: 500, letterSpacing: 12, fill: '#111827', curve: 30 }),
      text('story', 'Great Vibes', 160, [0, 20], { fill: '#111827' }),
    ],
  },
  {
    id: 'combo-just-sold',
    label: 'Just sold',
    tags: 'real estate sold house property',
    parts: [
      text('JUST', 'Montserrat', 36, [0, -120], { fontWeight: 800, letterSpacing: 16, fill: '#b91c1c' }),
      text('SOLD', 'Alfa Slab One', 160, [0, 0], { lineHeight: 1, fill: '#111827' }),
      rect([0, 98], 340, 14, '#b91c1c', { cornerRadius: 7 }),
    ],
  },
  {
    id: 'combo-grand-opening',
    label: 'Grand opening',
    tags: 'grand opening launch store new',
    parts: [
      text('GRAND OPENING', 'Staatliches', 96, [0, -24], { look: 'tfx-ribbon-gold' }),
      text('join us', 'Great Vibes', 66, [0, 118], { fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-talk-to-us',
    label: 'Talk to us',
    tags: 'contact talk to us phone email',
    parts: [
      text('TALK TO US', 'Montserrat', 50, [0, -86], { fontWeight: 900, textAlign: 'left', width: 420, fill: '#111827' }),
      text('(04) 298 3985 2092\n+76 209 1092 4095\nhello@yourbrand.com', 'Montserrat', 26, [0, 22], {
        fontWeight: 500,
        lineHeight: 1.4,
        textAlign: 'left',
        width: 420,
        fill: '#374151',
      }),
    ],
  },
  {
    id: 'combo-launch-day',
    label: 'Launch day',
    tags: 'launch startup product release',
    parts: [
      text('LAUNCH', 'Space Grotesk', 118, [0, -18], { fontWeight: 700, letterSpacing: 2, fill: '#111827' }),
      text('day', 'Pacifico', 74, [150, 62], { fill: '#7c3aed', rotation: -10 }),
      rect([0, -112], 120, 44, '#111827', { cornerRadius: 22 }),
      text('v1.0', 'Space Mono', 22, [0, -112], { fontWeight: 700, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-next-gen',
    label: 'Next gen',
    tags: 'next gen future tech innovation',
    parts: [
      text('NEXT', 'Space Mono', 50, [0, -96], { fontWeight: 700, letterSpacing: 20, fill: '#2563eb' }),
      text('gen', 'Abril Fatface', 190, [0, 20], { lineHeight: 1, fill: '#1e3a8a' }),
    ],
  },
  {
    id: 'combo-trust-badge',
    label: 'Trusted brand',
    tags: 'trusted quality certified badge seal',
    parts: [
      circle([0, 0], 300, '#1e3a8a'),
      circle([0, 0], 262, 'transparent', { stroke: '#fbbf24', strokeWidth: 3 }),
      ringText('TRUSTED BY', 'Montserrat', 22, [0, 0], 112, 'top', { fontWeight: 800, letterSpacing: 8, fill: '#fbbf24' }),
      text('10K+', 'Anton', 84, [0, 4], { lineHeight: 1, fill: '#ffffff' }),
      ringText('CUSTOMERS', 'Montserrat', 20, [0, 0], 112, 'bottom', { fontWeight: 800, letterSpacing: 8, fill: '#fbbf24' }),
    ],
  },
];

export default combos;
