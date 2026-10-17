// ============================================
// FILE: panels/text/templates/themes/retro.js
// PURPOSE: Text templates — Retro
// ============================================

import { gradient, outline, rect, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-color-shadow',
    label: 'Colour shadow',
    tags: 'retro shadow bold colour poster',
    parts: [
      text('COLOR', 'Anton', 140, [0, -62], { lineHeight: 0.95, fill: '#064e3b', textShadow: shadow(8, 8, 0, '#34d399') }),
      text('SHADOW', 'Anton', 140, [0, 70], { lineHeight: 0.95, fill: '#064e3b', textShadow: shadow(8, 8, 0, '#34d399') }),
    ],
  },
  {
    id: 'combo-radical',
    label: 'Radical',
    tags: 'retro 80s radical vintage',
    parts: [
      text('RADICAL', 'Bevan', 110, [0, -22], { look: 'tfx-retro3d-sunset' }),
      text("since '85", 'Yellowtail', 60, [120, 78], { fill: '#db2777', rotation: -6 }),
    ],
  },
  {
    id: 'combo-groovy',
    label: 'Groovy',
    tags: 'groovy 70s retro hippie',
    parts: [
      text('groovy', 'Shrikhand', 136, [0, 0], {
        fill: '#f97316',
        textStroke: outline(6, '#7c2d12'),
        textShadow: shadow(8, 8, 0, '#fbbf24'),
        curve: 22,
      }),
    ],
  },
  {
    id: 'combo-vinyl-night',
    label: 'Vinyl night',
    tags: 'vinyl records music night dj',
    parts: [
      text('VINYL', 'Monoton', 110, [0, -26], { fill: '#111827' }),
      text('night', 'Pacifico', 64, [110, 70], { fill: '#e11d48', rotation: -8 }),
    ],
  },
  {
    id: 'combo-disco-fever',
    label: 'Disco fever',
    tags: 'disco fever dance 70s party',
    parts: [
      text('DISCO', 'Bungee Shade', 128, [0, -34], { fill: '#db2777' }),
      text('fever', 'Lobster', 84, [0, 72], { fill: '#7c3aed' }),
    ],
  },
  {
    id: 'combo-not-old-vintage',
    label: 'Not old, vintage',
    tags: 'vintage classic old antique',
    parts: [
      text('Not old,', 'Cormorant Garamond', 60, [0, -58], { fontStyle: 'italic', fill: '#9ca3af' }),
      text('VINTAGE.', 'Prata', 110, [0, 34], { lineHeight: 1, fill: '#4338ca' }),
    ],
  },
  {
    id: 'combo-diner',
    label: 'Diner',
    tags: 'diner 50s burger retro restaurant',
    parts: [
      rect([0, 0], 500, 190, '#dc2626', { cornerRadius: 95 }),
      text('Diner', 'Lobster', 118, [0, -12], { fill: '#ffffff', textShadow: shadow(4, 4, 0, '#7f1d1d') }),
      text('OPEN 24 HRS', 'Montserrat', 20, [0, 62], { fontWeight: 800, letterSpacing: 10, fill: '#fee2e2' }),
    ],
  },
  {
    id: 'combo-old-school',
    label: 'Old school',
    tags: 'old school classic retro',
    parts: [
      text('OLD', 'Alfa Slab One', 140, [-40, -30], { lineHeight: 1, fill: '#92400e' }),
      text('school', 'Kaushan Script', 96, [60, 66], { fill: '#0f766e', rotation: -8 }),
    ],
  },
  {
    id: 'combo-sunset-drive',
    label: 'Sunset drive',
    tags: 'sunset drive synthwave road retro',
    parts: [
      text('sunset', 'Yellowtail', 112, [0, -40], { fill: gradient(90, '#f472b6', '#f59e0b') }),
      text('DRIVE', 'Russo One', 80, [0, 62], { letterSpacing: 18, fill: '#1e1b4b' }),
    ],
  },
  {
    id: 'combo-mixtape',
    label: 'Mixtape',
    tags: 'mixtape cassette music 90s',
    parts: [
      rect([0, 0], 470, 210, '#fef3c7', { cornerRadius: 14, stroke: '#111827', strokeWidth: 3, rotation: -3 }),
      text('MIXTAPE', 'Permanent Marker', 88, [0, -18], { fill: '#111827', rotation: -3 }),
      text('vol. 2', 'Caveat', 50, [120, 58], { fill: '#dc2626', rotation: -3 }),
    ],
  },
  {
    id: 'combo-approved-stamp',
    label: 'Approved stamp',
    tags: 'stamp approved certified official',
    parts: [
      rect([0, 0], 520, 150, 'transparent', { cornerRadius: 10, stroke: '#dc2626', strokeWidth: 6, rotation: -6 }),
      text('APPROVED', 'Black Ops One', 74, [0, 2], { fill: '#dc2626', rotation: -6 }),
    ],
  },
  {
    id: 'combo-rock-n-roll',
    label: "Rock 'n' roll",
    tags: 'rock and roll music band concert',
    parts: [
      text('ROCK', 'Bungee', 110, [0, -76], { fill: '#111827' }),
      text("'n'", 'Pacifico', 64, [0, 4], { fill: '#ef4444' }),
      text('ROLL', 'Bungee', 110, [0, 84], { fill: '#111827' }),
    ],
  },
  {
    id: 'combo-arcade-80s',
    label: 'Totally 80s',
    tags: '80s totally retro neon grid',
    parts: [
      text('TOTALLY', 'Russo One', 40, [0, -110], { letterSpacing: 16, fill: '#06b6d4' }),
      text("80's", 'Monoton', 150, [0, 20], { fill: gradient(180, '#f472b6', '#7c3aed') }),
    ],
  },
];

export default combos;
