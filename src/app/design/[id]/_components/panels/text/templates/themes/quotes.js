// ============================================
// FILE: panels/text/templates/themes/quotes.js
// PURPOSE: Text templates — Quotes
// ============================================

import { outline, rect, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-you-are-the-best',
    label: 'You are the best',
    tags: 'best compliment thank you quote love',
    parts: [
      text('YOU ARE THE', 'Montserrat', 38, [0, -84], { fontWeight: 800, letterSpacing: 5, fill: '#15803d' }),
      text('best', 'Shrikhand', 160, [0, 30], {
        fill: '#4ade80',
        textStroke: outline(10, '#14532d'),
        textShadow: shadow(0, 10, 0, '#14532d'),
      }),
    ],
  },
  {
    id: 'combo-dream-big',
    label: 'Dream big',
    tags: 'dream big motivation inspire',
    parts: [
      text('dream', 'Pacifico', 96, [-40, -118], { fill: '#7c3aed', rotation: -6 }),
      text('BIG', 'Anton', 190, [30, 30], { lineHeight: 1, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-quote-wilde',
    label: 'Quote card',
    tags: 'quote wilde be yourself card inspire',
    parts: [
      text('“', 'Playfair Display', 220, [-190, -110], { fontWeight: 900, fill: '#fbbf24' }),
      text('Be yourself; everyone else is already taken.', 'Playfair Display', 46, [0, 0], {
        fontWeight: 700,
        fontStyle: 'italic',
        lineHeight: 1.2,
        width: 480,
        fill: '#111827',
      }),
      text('— OSCAR WILDE', 'Montserrat', 20, [0, 106], { fontWeight: 700, letterSpacing: 10, fill: '#b45309' }),
    ],
  },
  {
    id: 'combo-good-things',
    label: 'Good things take time',
    tags: 'good things take time patience quote',
    parts: [
      text('good things', 'Satisfy', 82, [0, -70], { fill: '#0f766e' }),
      text('TAKE TIME', 'Anton', 110, [0, 42], { lineHeight: 1, letterSpacing: 4, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-stay-humble',
    label: 'Stay humble',
    tags: 'stay humble hustle motivation',
    parts: [
      text('STAY', 'Montserrat', 40, [0, -96], { fontWeight: 900, letterSpacing: 16, fill: '#111827' }),
      text('humble', 'Great Vibes', 124, [0, -6], { fill: '#b45309' }),
      text('HUSTLE HARD', 'Montserrat', 26, [0, 90], { fontWeight: 800, letterSpacing: 14, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-monday-motivation',
    label: 'Monday motivation',
    tags: 'monday motivation week start',
    parts: [
      text('Monday', 'Kaushan Script', 100, [0, -54], { fill: '#ea580c' }),
      text('MOTIVATION', 'Bebas Neue', 96, [0, 46], { letterSpacing: 10, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-you-got-this',
    label: 'You got this',
    tags: 'you got this encourage support',
    parts: [
      text('you got this', 'Shadows Into Light', 110, [0, -10], { look: 'tfx-handwritten-magenta' }),
      rect([0, 70], 260, 8, '#db2777', { cornerRadius: 4, rotation: -2 }),
    ],
  },
  {
    id: 'combo-never-give-up',
    label: 'Never give up',
    tags: 'never give up persist motivation',
    parts: [
      text('NEVER', 'Anton', 150, [0, -30], { lineHeight: 1, fill: '#111827' }),
      text('give up', 'Rock Salt', 58, [60, 70], { fill: '#ef4444', rotation: -6 }),
    ],
  },
  {
    id: 'combo-choose-joy',
    label: 'Choose joy',
    tags: 'choose joy happy positive',
    parts: [
      text('choose', 'Sacramento', 100, [-60, -92], { fill: '#f59e0b' }),
      text('JOY', 'Shrikhand', 170, [20, 40], { fill: '#f59e0b', textShadow: shadow(6, 6, 0, '#fde68a') }),
    ],
  },
  {
    id: 'combo-one-day',
    label: 'One day or day one',
    tags: 'one day day one start now',
    parts: [
      text('ONE DAY', 'Bebas Neue', 120, [0, -94], { letterSpacing: 8, fill: '#9ca3af' }),
      text('or', 'Pacifico', 54, [0, 0], { fill: '#111827' }),
      text('DAY ONE', 'Bebas Neue', 120, [0, 100], { letterSpacing: 8, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-self-love',
    label: 'Self love',
    tags: 'self love care wellness',
    parts: [
      text('self', 'DM Serif Display', 100, [-40, -56], { fontStyle: 'italic', fill: '#be185d' }),
      text('LOVE', 'Bowlby One', 130, [20, 46], { lineHeight: 1, fill: '#f472b6' }),
    ],
  },
  {
    id: 'combo-keep-going',
    label: 'Keep going',
    tags: 'keep going motivation progress',
    parts: [
      text('keep', 'Caveat', 96, [-110, -92], { fill: '#0ea5e9' }),
      text('GOING', 'Anton', 150, [0, 30], { lineHeight: 1, fill: '#0f172a' }),
      rect([0, 118], 300, 10, '#0ea5e9', { cornerRadius: 5 }),
    ],
  },
  {
    id: 'combo-stay-positive',
    label: 'Stay positive',
    tags: 'stay positive cute mint happy',
    parts: [text('stay positive', 'Baloo 2', 104, [0, 0], { look: 'tfx-cute-mint' })],
  },
];

export default combos;
