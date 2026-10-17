// ============================================
// FILE: panels/text/templates/themes/travel.js
// PURPOSE: Text templates — Travel
// ============================================

import { circle, line, rect, ringText, shadow, shape, text } from '../comboParts';

const combos = [
  {
    id: 'combo-travel-wanderlust',
    label: 'Wanderlust',
    tags: 'wanderlust travel explore world journey plane flight',
    parts: [
      text('wanderlust', 'Allura', 130, [0, -30], { fill: '#1f5f66' }),
      line([-30, 66], 300, '#c2653a', { weight: 3, style: 'dotted' }),
      shape('airplane', [148, 66], 40, 40, '#c2653a', { rotation: 90 }),
      text('EXPLORE THE WORLD', 'Montserrat', 17, [5, 118], { fontWeight: 600, letterSpacing: 10, fill: '#1f5f66' }),
    ],
  },
  {
    id: 'combo-travel-adventure-awaits',
    label: 'Adventure awaits',
    tags: 'adventure awaits travel outdoor hike explore trip',
    parts: [
      text('ADVENTURE', 'Bebas Neue', 140, [3, -20], { letterSpacing: 6, fill: '#1f3a5f' }),
      text('awaits', 'Yellowtail', 92, [128, 60], { fill: '#c2653a', rotation: -6 }),
    ],
  },
  {
    id: 'combo-travel-explore-more',
    label: 'Explore more',
    tags: 'explore more travel sunset sun horizon adventure',
    parts: [
      shape('semicircle', [0, -40], 320, 160, '#f2b27a'),
      text('EXPLORE', 'Oswald', 104, [6, -34], { fontWeight: 600, letterSpacing: 12, fill: '#1f3a5f' }),
      line([0, 40], 480, '#1f3a5f', { weight: 2 }),
      text('more', 'Sacramento', 124, [0, 104], { fill: '#c2653a' }),
    ],
  },
  {
    id: 'combo-travel-bon-voyage',
    label: 'Bon voyage',
    tags: 'bon voyage cruise sailing boat trip farewell journey',
    parts: [
      shape('sailboat', [0, -154], 72, 64, '#1f3a5f'),
      text('Bon Voyage', 'Great Vibes', 116, [0, -14], { fill: '#1f3a5f' }),
      text('LET THE JOURNEY BEGIN', 'Montserrat', 16, [5, 86], { fontWeight: 600, letterSpacing: 10, fill: '#2a6f77' }),
    ],
  },
  {
    id: 'combo-travel-santorini',
    label: 'Santorini',
    tags: 'santorini greece island destination holiday summer coordinates',
    parts: [
      text('Santorini', 'Parisienne', 118, [0, -30], { fill: '#2d5b8c' }),
      text('GREECE', 'Marcellus', 30, [8, 66], { letterSpacing: 16, fill: '#1f3a5f' }),
      text('36.39° N · 25.46° E', 'DM Mono', 17, [2, 112], { letterSpacing: 4, fill: '#6b7c93' }),
    ],
  },
  {
    id: 'combo-travel-summer-in-bali',
    label: 'Summer in Bali',
    tags: 'summer in bali island holiday destination beach tropical',
    parts: [
      text('BALI', 'DM Serif Display', 190, [5, 34], { letterSpacing: 10, fill: '#1f5f66' }),
      text('Summer in', 'Parisienne', 84, [-44, -76], { fill: '#c2653a' }),
      text('7 NIGHTS · UBUD & ULUWATU', 'Montserrat', 17, [4, 148], { fontWeight: 500, letterSpacing: 8, fill: '#7a5a4d' }),
    ],
  },
  {
    id: 'combo-travel-kyoto',
    label: 'Kyoto',
    tags: 'kyoto japan destination spring cherry blossom sun travel',
    parts: [
      circle([-214, 0], 150, '#b5443b'),
      text('KYOTO', 'Marcellus', 92, [90, -24], { letterSpacing: 14, fill: '#1f2933' }),
      line([84, 36], 290, '#1f2933', { weight: 1.5 }),
      text('JAPAN · SPRING 2027', 'Montserrat', 17, [88, 68], { fontWeight: 600, letterSpacing: 8, fill: '#b5443b' }),
    ],
  },
  {
    id: 'combo-travel-boarding-pass',
    label: 'Boarding pass',
    tags: 'boarding pass ticket flight airport airline trip plane',
    parts: [
      rect([0, 0], 560, 270, '#1f3a5f', { cornerRadius: 20 }),
      text('BOARDING PASS', 'Montserrat', 16, [5, -94], { fontWeight: 600, letterSpacing: 10, fill: '#d8b27d' }),
      text('LAX', 'Bebas Neue', 110, [-170, -6], { letterSpacing: 4, fill: '#f4ecdf' }),
      line([0, -6], 150, '#d8b27d', { weight: 1.5, style: 'dashed' }),
      shape('airplane', [0, -6], 44, 44, '#d8b27d', { rotation: 90 }),
      text('CDG', 'Bebas Neue', 110, [172, -6], { letterSpacing: 4, fill: '#f4ecdf' }),
      text('FLIGHT SK204 · GATE 12 · SEAT 3A', 'DM Mono', 16, [2, 90], { letterSpacing: 3, fill: '#c9d3df' }),
    ],
  },
  {
    id: 'combo-travel-passport-stamp',
    label: 'Passport stamp',
    tags: 'passport stamp paris arrived visa travel badge seal',
    parts: [
      circle([0, 0], 300, 'transparent', { stroke: '#b5443b', strokeWidth: 4 }),
      circle([0, 0], 268, 'transparent', { stroke: '#b5443b', strokeWidth: 1.5 }),
      ringText('PASSPORT CONTROL', 'Montserrat', 16, [0, 0], 116, 'top', { fontWeight: 700, letterSpacing: 6, fill: '#b5443b' }),
      ringText('ARRIVED · 06.14.27', 'Montserrat', 16, [0, 0], 116, 'bottom', { fontWeight: 700, letterSpacing: 6, fill: '#b5443b' }),
      shape('star5', [-110, 0], 14, 14, '#b5443b'),
      text('PARIS', 'Oswald', 58, [3, 0], { fontWeight: 600, letterSpacing: 6, fill: '#b5443b' }),
      shape('star5', [110, 0], 14, 14, '#b5443b'),
    ],
  },
  {
    id: 'combo-travel-road-trip',
    label: 'Road trip',
    tags: 'road trip car drive summer route highway adventure retro',
    parts: [
      text('ROAD TRIP', 'Alfa Slab One', 96, [0, -34], { letterSpacing: 4, fill: '#1f5f66', textShadow: shadow(5, 5, 0, '#e2b25a') }),
      circle([-160, 62], 14, '#1f3a5f'),
      line([-10, 62], 270, '#1f3a5f', { weight: 3, style: 'dashed' }),
      shape('ui-pin', [148, 34], 46, 60, '#c2653a'),
      text('SUMMER 2027 · ROUTE 1', 'Montserrat', 18, [5, 108], { fontWeight: 600, letterSpacing: 10, fill: '#1f3a5f' }),
    ],
  },
  {
    id: 'combo-travel-weekend-getaway',
    label: 'Weekend getaway',
    tags: 'weekend getaway short break city trip staycation frame',
    parts: [
      rect([0, 0], 500, 280, 'transparent', { stroke: '#c2653a', strokeWidth: 1.5 }),
      text('weekend', 'Playfair Display', 100, [0, -36], { fontStyle: 'italic', fill: '#1f2933' }),
      text('GETAWAY', 'Montserrat', 26, [10, 48], { fontWeight: 600, letterSpacing: 20, fill: '#c2653a' }),
      text('3 DAYS · 2 NIGHTS', 'Montserrat', 14, [4, 96], { fontWeight: 500, letterSpacing: 8, fill: '#7a5a4d' }),
    ],
  },
  {
    id: 'combo-travel-mountains',
    label: 'Take me to the mountains',
    tags: 'mountains hiking outdoors adventure nature peak take me',
    parts: [
      circle([40, -196], 30, '#c2653a'),
      shape('mountain', [0, -168], 150, 100, '#1f3a5f'),
      text('take me to the', 'Sacramento', 80, [0, -54], { fill: '#c2653a' }),
      text('MOUNTAINS', 'Oswald', 96, [6, 40], { fontWeight: 500, letterSpacing: 12, fill: '#1f3a5f' }),
    ],
  },
  {
    id: 'combo-travel-greetings-from',
    label: 'Greetings from',
    tags: 'greetings from lisbon portugal postcard destination city',
    parts: [
      text('Greetings from', 'Yellowtail', 64, [0, -104], { fill: '#c2653a' }),
      text('LISBON', 'Abril Fatface', 124, [4, 12], { letterSpacing: 8, fill: '#1f4e79' }),
      text('PORTUGAL', 'Montserrat', 18, [9, 100], { fontWeight: 600, letterSpacing: 18, fill: '#c2653a' }),
    ],
  },
  {
    id: 'combo-travel-diaries',
    label: 'Travel diaries',
    tags: 'travel diaries vlog episode blog iceland youtube title',
    parts: [
      text('TRAVEL DIARIES', 'Montserrat', 16, [6, -92], { fontWeight: 600, letterSpacing: 12, fill: '#c2653a' }),
      text('Iceland', 'DM Serif Display', 130, [0, -4], { fill: '#1f3a5f' }),
      line([-176, 90], 80, '#1f3a5f', { weight: 1.5 }),
      text('EPISODE 07', 'Montserrat', 17, [5, 90], { fontWeight: 500, letterSpacing: 10, fill: '#1f3a5f' }),
      line([176, 90], 80, '#1f3a5f', { weight: 1.5 }),
    ],
  },
  {
    id: 'combo-travel-vacation-mode',
    label: 'Vacation mode',
    tags: 'vacation mode on out of office holiday auto reply away',
    parts: [
      text('vacation mode', 'Outfit', 64, [-72, -20], { fontWeight: 500, fill: '#1f2933' }),
      rect([224, -20], 104, 56, '#2a6f77', { cornerRadius: 28 }),
      circle([248, -20], 44, '#f4ecdf'),
      text('OUT OF OFFICE · BACK 06.21', 'Montserrat', 17, [4, 58], { fontWeight: 600, letterSpacing: 8, fill: '#2a6f77' }),
    ],
  },
];

export default combos;
