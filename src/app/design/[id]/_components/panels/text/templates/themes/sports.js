// ============================================
// FILE: panels/text/templates/themes/sports.js
// PURPOSE: Text templates — Sports & gaming
// ============================================

import { circle, gradient, outline, rect, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-team-effort',
    label: 'Team effort',
    tags: 'team effort sport work together',
    parts: [
      text('TEAM', 'Montserrat', 42, [0, -104], { fontWeight: 600, letterSpacing: 18, fill: '#15803d' }),
      text('EFFORT', 'Anton', 160, [0, 18], { lineHeight: 1, fill: '#22c55e' }),
    ],
  },
  {
    id: 'combo-game-over',
    label: 'Game over',
    tags: 'game over retro arcade pixel gaming',
    parts: [
      text('GAME OVER', 'Press Start 2P', 64, [0, -20], { look: 'tfx-pixel-magenta' }),
      text('INSERT COIN', 'Press Start 2P', 18, [0, 72], { fill: '#111827' }),
    ],
  },
  {
    id: 'combo-player-one',
    label: 'Player one',
    tags: 'player one gaming gamer esports',
    parts: [
      text('player', 'Bungee', 100, [0, -46], { fill: '#db2777' }),
      text('one', 'Bungee', 100, [40, 50], { fill: '#db2777', textShadow: shadow(6, 6, 0, '#1e1b4b') }),
    ],
  },
  {
    id: 'combo-champions',
    label: 'Champions',
    tags: 'champions winners trophy league',
    parts: [
      text('CHAMPIONS', 'Bebas Neue', 150, [0, -12], { fill: gradient(180, '#fde68a', '#b45309'), textShadow: shadow(0, 6, 0, '#78350f') }),
      text('2027', 'Montserrat', 30, [0, 88], { fontWeight: 800, letterSpacing: 18, fill: '#78350f' }),
    ],
  },
  {
    id: 'combo-game-day',
    label: 'Game day',
    tags: 'game day match sport fans',
    parts: [
      text('GAME', 'Anton', 150, [-30, -24], { lineHeight: 1, fill: '#1d4ed8' }),
      text('day', 'Kaushan Script', 100, [120, 64], { fill: '#ef4444', rotation: -8 }),
    ],
  },
  {
    id: 'combo-level-up',
    label: 'Level up',
    tags: 'level up gaming glitch upgrade',
    parts: [text('LEVEL UP', 'Archivo Black', 120, [0, 0], { look: 'tfx-glitch-magenta' })],
  },
  {
    id: 'combo-no-pain',
    label: 'No pain no gain',
    tags: 'fitness gym workout no pain no gain',
    parts: [
      text('NO PAIN', 'Anton', 120, [0, -30], { lineHeight: 1, letterSpacing: 2, fill: '#111827' }),
      text('no gain', 'Rock Salt', 54, [80, 66], { fill: '#ef4444', rotation: -6 }),
    ],
  },
  {
    id: 'combo-run-the-city',
    label: 'Run the city',
    tags: 'run marathon race city running',
    parts: [
      text('RUN', 'Anton', 190, [0, -24], { lineHeight: 1, fill: 'transparent', textStroke: outline(4, '#0ea5e9') }),
      text('the city', 'Permanent Marker', 64, [0, 74], { fill: '#0ea5e9' }),
      rect([196, -118], 110, 46, '#0ea5e9', { cornerRadius: 23 }),
      text('10K', 'Montserrat', 22, [196, -118], { fontWeight: 900, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-mvp',
    label: 'MVP',
    tags: 'mvp most valuable player award',
    parts: [
      circle([0, 0], 260, '#facc15'),
      circle([0, 0], 226, 'transparent', { stroke: '#111827', strokeWidth: 3 }),
      text('MOST VALUABLE', 'Montserrat', 12, [0, -54], { fontWeight: 800, letterSpacing: 3, fill: '#111827' }),
      text('MVP', 'Black Ops One', 84, [0, 2], { fill: '#111827' }),
      text('PLAYER', 'Montserrat', 12, [0, 56], { fontWeight: 800, letterSpacing: 6, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-esports',
    label: 'Esports',
    tags: 'esports tournament gaming chrome',
    parts: [
      text('ESPORTS', 'Archivo Black', 110, [0, -20], { look: 'tfx-chromeFace-cyan' }),
      text('TOURNAMENT', 'Syne', 30, [0, 80], { fontWeight: 700, letterSpacing: 16, fill: '#0e7490' }),
    ],
  },
  {
    id: 'combo-goal',
    label: 'Goal',
    tags: 'goal football soccer score',
    parts: [
      text('GOAL!', 'Luckiest Guy', 170, [0, 0], {
        fill: '#22c55e',
        textStroke: outline(9, '#14532d'),
        textShadow: shadow(6, 8, 0, '#14532d'),
        rotation: -6,
      }),
    ],
  },
  {
    id: 'combo-kick-off',
    label: 'Kick off',
    tags: 'kick off match football start',
    parts: [
      rect([0, -20], 460, 110, '#111827', { cornerRadius: 8 }),
      text('KICK OFF', 'Teko', 100, [0, -16], { fontWeight: 600, letterSpacing: 10, fill: '#ffffff' }),
      text('Saturday · 3 PM', 'Montserrat', 26, [0, 72], { fontWeight: 600, fill: '#374151' }),
    ],
  },
  {
    id: 'combo-new-record',
    label: 'New record',
    tags: 'new record personal best achievement',
    parts: [
      text('NEW', 'Montserrat', 42, [0, -118], { fontWeight: 900, letterSpacing: 16, fill: '#ef4444' }),
      text('RECORD', 'Anton', 140, [0, 4], { lineHeight: 1, fill: '#111827' }),
      text('personal best', 'Caveat', 50, [0, 98], { fill: '#ef4444' }),
    ],
  },
];

export default combos;
