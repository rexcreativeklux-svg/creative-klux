// ============================================
// FILE: panels/text/templates/themes/neon.js
// PURPOSE: Text templates — Neon & glow
// ============================================

import { glow, outline, text } from '../comboParts';

const combos = [
  {
    id: 'combo-open-late',
    label: 'Open late',
    tags: 'neon open late night bar glow sign',
    parts: [
      text('Open Late', 'Righteous', 120, [0, -30], { look: 'tfx-neonTube-magenta' }),
      text('24 / 7', 'Monoton', 56, [0, 102], { fill: '#22d3ee', textShadow: glow(18, '#22d3ee') }),
    ],
  },
  {
    id: 'combo-glow',
    label: 'Glow',
    tags: 'glow neon pink light',
    parts: [text('GLOW', 'Bebas Neue', 190, [0, 0], { fill: '#f472b6', textShadow: glow(34, '#ec4899') })],
  },
  {
    id: 'combo-night-club',
    label: 'Night club',
    tags: 'night club neon party dance',
    parts: [
      text('NIGHT', 'Monoton', 110, [0, -58], { look: 'tfx-neon-magenta' }),
      text('CLUB', 'Monoton', 110, [0, 72], { look: 'tfx-neon-cyan' }),
    ],
  },
  {
    id: 'combo-shine',
    label: 'Shine',
    tags: 'shine glow gold light repeat',
    parts: [
      text('SHINE', 'Anton', 110, [0, -110], { lineHeight: 0.95, fill: '#eab308', textShadow: glow(16, '#fde047') }),
      text('SHINE', 'Anton', 110, [0, 0], { lineHeight: 0.95, fill: '#eab308', textShadow: glow(16, '#fde047'), opacity: 0.6 }),
      text('SHINE', 'Anton', 110, [0, 110], { lineHeight: 0.95, fill: '#eab308', textShadow: glow(16, '#fde047'), opacity: 0.3 }),
    ],
  },
  {
    id: 'combo-creating-magic',
    label: 'Creating magic',
    tags: 'magic creating glow purple sparkle',
    parts: [
      text('creating', 'Pacifico', 56, [0, -66], { fill: '#d946ef', textShadow: glow(12, '#f5d0fe') }),
      text('MAGIC', 'Righteous', 120, [0, 26], { fill: '#c026d3', textShadow: glow(20, '#f0abfc') }),
    ],
  },
  {
    id: 'combo-open-24',
    label: 'Open 24 hours',
    tags: 'open 24 hours neon sign store',
    parts: [
      text('OPEN', 'Righteous', 130, [0, -26], { look: 'tfx-neonTube-toxic' }),
      text('24 HOURS', 'Montserrat', 26, [0, 86], { fontWeight: 800, letterSpacing: 14, fill: '#65a30d' }),
    ],
  },
  {
    id: 'combo-sparkle',
    label: 'Sparkle',
    tags: 'sparkle shine glow gold script',
    parts: [text('Sparkle', 'Great Vibes', 140, [0, 0], { fill: '#eab308', textShadow: glow(20, '#fde047') })],
  },
  {
    id: 'combo-now-open',
    label: 'Now open',
    tags: 'now open neon purple store',
    parts: [text('Now Open!', 'Poppins', 110, [0, 0], { look: 'tfx-softGlow-violet', rotation: -6 })],
  },
  {
    id: 'combo-laser-tag',
    label: 'Laser tag',
    tags: 'laser tag arena game neon',
    parts: [
      text('LASER', 'Russo One', 130, [0, -30], { fill: '#22d3ee', textStroke: outline(2, '#ecfeff'), textShadow: glow(24, '#06b6d4') }),
      text('TAG ARENA', 'Syne', 34, [0, 76], { fontWeight: 700, letterSpacing: 16, fill: '#0891b2' }),
    ],
  },
  {
    id: 'combo-cocktail-bar',
    label: 'Cocktail bar',
    tags: 'cocktail bar drinks neon night',
    parts: [
      text('cocktail', 'Sacramento', 96, [0, -58], { fill: '#ec4899', textShadow: glow(14, '#f9a8d4') }),
      text('BAR', 'Monoton', 120, [0, 44], { fill: '#0891b2', textShadow: glow(16, '#67e8f9') }),
    ],
  },
  {
    id: 'combo-electric',
    label: 'Electric',
    tags: 'electric live show music neon',
    parts: [
      text('ELECTRIC', 'Righteous', 110, [0, -24], { look: 'tfx-neon-violet' }),
      text('LIVE SHOW', 'Montserrat', 26, [0, 86], { fontWeight: 700, letterSpacing: 14, fill: '#7c3aed' }),
    ],
  },
  {
    id: 'combo-good-vibes',
    label: 'Good vibes',
    tags: 'good vibes positive neon glow',
    parts: [
      text('good', 'Yellowtail', 96, [-60, -64], { fill: '#f43f5e', textShadow: glow(12, '#fda4af'), rotation: -6 }),
      text('VIBES', 'Righteous', 120, [20, 42], { fill: '#f59e0b', textShadow: glow(16, '#fcd34d') }),
    ],
  },
  {
    id: 'combo-glow-up',
    label: 'Glow up',
    tags: 'glow up green outline neon',
    parts: [
      text('glow', 'Quicksand', 130, [0, -50], { fontWeight: 400, fill: 'transparent', textStroke: outline(3, '#4ade80'), textShadow: glow(16, '#22c55e') }),
      text('up', 'Quicksand', 130, [0, 60], { fontWeight: 400, fill: 'transparent', textStroke: outline(3, '#4ade80'), textShadow: glow(16, '#22c55e') }),
    ],
  },
];

export default combos;
