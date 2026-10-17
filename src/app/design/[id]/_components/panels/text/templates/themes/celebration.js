// ============================================
// FILE: panels/text/templates/themes/celebration.js
// PURPOSE: Text templates — Celebration
// ============================================

import { circle, gradient, outline, rect, ringText, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-party-people',
    label: 'Party people',
    tags: 'party celebration fun night people',
    parts: [
      text('PARTY', 'Archivo Black', 150, [0, -34], { look: 'tfx-extrude3d-magenta' }),
      text('people', 'Pacifico', 78, [72, 92], { fill: '#7c3aed', rotation: -6 }),
    ],
  },
  {
    id: 'combo-happy-birthday',
    label: 'Happy birthday',
    tags: 'birthday happy party celebrate card',
    parts: [
      text('Happy', 'Pacifico', 86, [-70, -56], { fill: '#9ca3af', rotation: -8 }),
      text('birthday!', 'Kaushan Script', 128, [14, 52], { fill: '#e11d48', rotation: -8 }),
    ],
  },
  {
    id: 'combo-congrats',
    label: 'Congrats',
    tags: 'congrats congratulations well done achievement',
    parts: [
      text('Congrats!', 'Titan One', 120, [0, -24], { look: 'tfx-spark-gold' }),
      text('YOU DID IT', 'Montserrat', 26, [0, 90], { fontWeight: 800, letterSpacing: 12, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-its-a-party',
    label: "It's a party",
    tags: 'party invite celebrate fun',
    parts: [
      text("it's a", 'Pacifico', 64, [0, -96], { fill: '#db2777', curve: 22 }),
      text('PARTY', 'Bowlby One', 150, [0, 22], { lineHeight: 1, fill: gradient(90, '#f472b6', '#a855f7') }),
    ],
  },
  {
    id: 'combo-save-the-date',
    label: 'Save the date',
    tags: 'save the date wedding invite engagement',
    parts: [
      text('Save the', 'Great Vibes', 86, [0, -92], { fill: '#92400e' }),
      text('DATE', 'Playfair Display', 150, [0, 12], { fontWeight: 900, lineHeight: 1, letterSpacing: 8, fill: '#111827' }),
      text('06 · 14 · 2027', 'Montserrat', 26, [0, 110], { fontWeight: 500, letterSpacing: 10, fill: '#57534e' }),
    ],
  },
  {
    id: 'combo-baby-shower',
    label: 'Baby shower',
    tags: 'baby shower newborn welcome pastel',
    parts: [
      text('baby', 'Pacifico', 118, [0, -40], { fill: '#60a5fa' }),
      text('SHOWER', 'Fredoka', 72, [0, 72], { fontWeight: 700, letterSpacing: 10, fill: '#f9a8d4' }),
    ],
  },
  {
    id: 'combo-class-of',
    label: 'Class of 2027',
    tags: 'graduation class of grad school college',
    parts: [
      text('CLASS OF', 'Montserrat', 36, [0, -130], { fontWeight: 800, letterSpacing: 16, fill: '#1e3a8a' }),
      text('2027', 'Anton', 200, [0, 18], { lineHeight: 1, fill: gradient(180, '#fbbf24', '#d97706') }),
    ],
  },
  {
    id: 'combo-thank-you',
    label: 'Thank you',
    tags: 'thank you thanks gratitude card',
    parts: [
      text('Thank', 'Kaushan Script', 120, [-40, -52], { fill: '#2563eb', rotation: -8 }),
      text('you!', 'Kaushan Script', 120, [60, 56], { fill: '#2563eb', rotation: -8 }),
    ],
  },
  {
    id: 'combo-cheers',
    label: 'Cheers',
    tags: 'cheers toast anniversary drinks',
    parts: [
      text('Cheers', 'Great Vibes', 130, [0, -30], { look: 'tfx-script-gold' }),
      text('TO 30 YEARS', 'Montserrat', 24, [0, 90], { fontWeight: 700, letterSpacing: 14, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-welcome-home',
    label: 'Welcome home',
    tags: 'welcome home housewarming family',
    parts: [
      text('WELCOME', 'Playfair Display', 110, [0, -36], { fontWeight: 900, letterSpacing: 6, fill: '#111827' }),
      text('to our home', 'Sacramento', 84, [0, 80], { fill: '#b45309' }),
    ],
  },
  {
    id: 'combo-anniversary',
    label: 'Anniversary',
    tags: 'anniversary years celebrate milestone',
    parts: [
      circle([0, 10], 320, 'transparent', { stroke: '#d97706', strokeWidth: 5 }),
      ringText('happy anniversary', 'Great Vibes', 44, [0, 10], 128, 'top', { fill: '#92400e' }),
      text('10', 'DM Serif Display', 140, [0, 14], { lineHeight: 1, fill: '#d97706' }),
      ringText('YEARS', 'Montserrat', 24, [0, 10], 130, 'bottom', { fontWeight: 800, letterSpacing: 14, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-lets-celebrate',
    label: "Let's celebrate",
    tags: 'celebrate party retro fun',
    parts: [
      text("let's", 'Pacifico', 66, [-150, -80], { fill: '#f97316', rotation: -10 }),
      text('celebrate', 'Bevan', 104, [0, 10], { look: 'tfx-retro3d-sunset' }),
    ],
  },
  {
    id: 'combo-hooray',
    label: 'Hooray',
    tags: 'hooray yay woohoo celebrate',
    parts: [
      text('HOORAY!', 'Luckiest Guy', 130, [0, 0], {
        fill: '#facc15',
        textStroke: outline(9, '#111827'),
        textShadow: shadow(6, 8, 0, '#111827'),
        rotation: -4,
      }),
    ],
  },
  {
    id: 'combo-best-day-ever',
    label: 'Best day ever',
    tags: 'best day ever happy memory',
    parts: [
      text('best', 'Shrikhand', 134, [0, -40], { fill: '#f43f5e' }),
      rect([0, 70], 400, 64, '#111827', { cornerRadius: 8, rotation: -2 }),
      text('DAY EVER', 'Montserrat', 40, [0, 70], { fontWeight: 900, letterSpacing: 10, fill: '#ffffff', rotation: -2 }),
    ],
  },
];

export default combos;
