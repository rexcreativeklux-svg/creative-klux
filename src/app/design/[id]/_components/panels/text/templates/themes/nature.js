// ============================================
// FILE: panels/text/templates/themes/nature.js
// PURPOSE: Text templates — Nature & eco
// ============================================

import { circle, line, rect, ringText, shape, text } from '../comboParts';

const combos = [
  {
    id: 'combo-nature-go-green',
    label: 'Go green',
    tags: 'go green eco friendly sustainable environment leaf',
    parts: [
      text('green', 'DM Serif Display', 160, [0, -10], { fill: '#2f4a34' }),
      text('Go', 'Great Vibes', 96, [-170, -92], { fill: '#b85c38', rotation: -8 }),
      shape('teardrop-leaf', [196, -84], 50, 50, '#8a9a6b'),
      text('FOR A BETTER TOMORROW', 'Montserrat', 15, [4, 96], { fontWeight: 500, letterSpacing: 8, fill: '#4f6b3a' }),
    ],
  },
  {
    id: 'combo-nature-plant-based',
    label: 'Plant based',
    tags: 'plant based vegan label sticker food menu green',
    parts: [
      rect([0, 0], 480, 180, '#3f5b3a', { cornerRadius: 90 }),
      rect([0, 0], 456, 156, 'transparent', { stroke: '#e9e1c9', strokeWidth: 1.5, cornerRadius: 78 }),
      text('plant based', 'Great Vibes', 84, [0, -14], { fill: '#f3ecd9' }),
      text('100% VEGAN', 'Montserrat', 14, [5, 46], { fontWeight: 600, letterSpacing: 10, fill: '#cbd5b1' }),
    ],
  },
  {
    id: 'combo-nature-save-our-planet',
    label: 'Save our planet',
    tags: 'save our planet earth climate environment globe protect',
    parts: [
      circle([0, 4], 300, '#dfe7d3'),
      text('save our', 'Great Vibes', 80, [0, -70], { fill: '#4f6b3a' }),
      text('PLANET', 'Playfair Display', 110, [5, 20], { fontWeight: 800, letterSpacing: 6, fill: '#2f4a34' }),
      text('ACT NOW', 'Montserrat', 18, [6, 98], { fontWeight: 600, letterSpacing: 12, fill: '#4f6b3a' }),
    ],
  },
  {
    id: 'combo-nature-farmers-market',
    label: 'Farmers market',
    tags: 'farmers market local produce fresh saturday seasonal ribbon',
    parts: [
      text('Farmers', 'Allura', 104, [0, -86], { fill: '#b85c38' }),
      text('MARKET', 'Alfa Slab One', 92, [5, 4], { letterSpacing: 10, fill: '#2f4a34' }),
      shape('banner-ribbon', [0, 100], 440, 56, '#b85c38'),
      text('EVERY SATURDAY · 8AM–1PM', 'Montserrat', 15, [4, 100], { fontWeight: 600, letterSpacing: 6, fill: '#fbf5ea' }),
    ],
  },
  {
    id: 'combo-nature-organic-seal',
    label: '100% organic',
    tags: '100 percent organic certified natural pure seal badge stamp',
    parts: [
      circle([0, 0], 320, '#3f5b3a'),
      circle([0, 0], 244, 'transparent', { stroke: '#e9e1c9', strokeWidth: 1.5 }),
      ringText('PURE · NATURAL · FRESH', 'Montserrat', 16, [0, 0], 140, 'top', { fontWeight: 600, letterSpacing: 6, fill: '#f3ecd9' }),
      ringText('CERTIFIED', 'Montserrat', 16, [0, 0], 140, 'bottom', { fontWeight: 600, letterSpacing: 8, fill: '#f3ecd9' }),
      text('100%', 'DM Serif Display', 80, [0, -14], { fill: '#f3ecd9' }),
      text('ORGANIC', 'Montserrat', 16, [5, 42], { fontWeight: 600, letterSpacing: 10, fill: '#cbd5b1' }),
    ],
  },
  {
    id: 'combo-nature-earth-day',
    label: 'Earth day',
    tags: 'earth day april 22 planet environment climate date',
    parts: [
      circle([-150, 0], 170, '#2f4a34'),
      text('22', 'DM Serif Display', 76, [-150, -14], { fill: '#f3ecd9' }),
      text('APRIL', 'Montserrat', 15, [-146, 40], { fontWeight: 600, letterSpacing: 8, fill: '#cbd5b1' }),
      text('Earth\nDay', 'DM Serif Display', 100, [104, 0], { lineHeight: 0.95, textAlign: 'left', fill: '#2f4a34' }),
    ],
  },
  {
    id: 'combo-nature-wildflowers',
    label: 'Wildflowers',
    tags: 'wildflowers flowers floral spring garden meadow bloom',
    parts: [
      text('Wildflowers', 'Parisienne', 100, [0, -26], { fill: '#a8553a', curve: 18 }),
      shape('flower', [0, 58], 40, 40, '#c9a14a'),
      text('SPRING COLLECTION', 'Montserrat', 17, [5, 98], { fontWeight: 500, letterSpacing: 10, fill: '#4f6b3a' }),
    ],
  },
  {
    id: 'combo-nature-grow-your-own',
    label: 'Grow your own',
    tags: 'grow your own garden vegetables plant allotment sprout pot',
    parts: [
      shape('teardrop-leaf', [-15, -166], 32, 32, '#6b8a4a', { rotation: -75 }),
      shape('teardrop-leaf', [15, -166], 32, 32, '#8a9a6b', { rotation: -15 }),
      shape('trapezoid', [0, -128], 64, 44, '#b85c38', { rotation: 180 }),
      text('grow', 'DM Serif Display', 170, [0, -12], { fill: '#2f4a34' }),
      text('YOUR OWN', 'Montserrat', 24, [9, 108], { fontWeight: 600, letterSpacing: 18, fill: '#b85c38' }),
    ],
  },
  {
    id: 'combo-nature-zero-waste',
    label: 'Zero waste',
    tags: 'zero waste refill reuse recycle reduce plastic free eco',
    parts: [
      text('zero', 'Jost', 150, [0, -62], { fontWeight: 800, lineHeight: 1, fill: '#2f4a34' }),
      text('waste', 'Jost', 150, [0, 60], { fontWeight: 200, lineHeight: 1, fill: '#2f4a34' }),
      text('REFUSE · REUSE · RECYCLE', 'Jost', 15, [4, 150], { fontWeight: 500, letterSpacing: 8, fill: '#b85c38' }),
    ],
  },
  {
    id: 'combo-nature-fresh-from-the-farm',
    label: 'Fresh from the farm',
    tags: 'fresh from the farm farm fresh eggs honey produce local',
    parts: [
      text('FROM THE FARM', 'Montserrat', 18, [5, -92], { fontWeight: 600, letterSpacing: 10, fill: '#b85c38', curve: 24 }),
      text('Fresh', 'Yellowtail', 140, [0, 4], { fill: '#2f4a34' }),
      line([0, 86], 200, '#5b4636', { weight: 1.5 }),
      text('EGGS · HONEY · PRODUCE', 'Montserrat', 14, [3, 112], { fontWeight: 600, letterSpacing: 6, fill: '#5b4636' }),
    ],
  },
  {
    id: 'combo-nature-into-the-wild',
    label: 'Into the wild',
    tags: 'into the wild forest trees outdoors camping hiking national park',
    parts: [
      shape('tree', [-52, -124], 60, 80, '#4f6b3a'),
      shape('tree', [0, -136], 76, 104, '#2f4a34'),
      shape('tree', [52, -124], 60, 80, '#4f6b3a'),
      text('INTO THE WILD', 'Oswald', 78, [4, -12], { fontWeight: 600, letterSpacing: 8, fill: '#2f4a34' }),
      text('EXPLORE · BREATHE · WANDER', 'Montserrat', 19, [3, 64], { fontWeight: 500, letterSpacing: 6, fill: '#b85c38' }),
    ],
  },
  {
    id: 'combo-nature-protect-our-oceans',
    label: 'Protect our oceans',
    tags: 'protect our oceans sea marine save plastic free wave',
    parts: [
      text('protect our', 'Allura', 88, [0, -88], { fill: '#2a6f77' }),
      text('OCEANS', 'Playfair Display', 112, [6, 4], { fontWeight: 700, letterSpacing: 12, fill: '#1f4e5f' }),
      shape('line-wavy', [0, 90], 240, 22, 'transparent', { stroke: '#4f8f9a', strokeWidth: 4 }),
    ],
  },
  {
    id: 'combo-nature-sustainable-living',
    label: 'Sustainable living',
    tags: 'sustainable living eco lifestyle green slow living frame',
    parts: [
      rect([0, 0], 540, 220, 'transparent', { stroke: '#6b7a3a', strokeWidth: 1.5, cornerRadius: 110 }),
      text('Sustainable', 'Cormorant Garamond', 88, [0, -20], { fontStyle: 'italic', fontWeight: 500, fill: '#2f4a34' }),
      text('LIVING', 'Montserrat', 18, [9, 52], { fontWeight: 500, letterSpacing: 18, fill: '#6b7a3a' }),
    ],
  },
  {
    id: 'combo-nature-bloom',
    label: 'Bloom where planted',
    tags: 'bloom where you are planted quote flowers growth inspiration',
    parts: [
      text('Bloom', 'Great Vibes', 140, [0, -40], { fill: '#b85c38' }),
      text('WHERE YOU ARE PLANTED', 'Cormorant Garamond', 24, [4, 56], { fontWeight: 600, letterSpacing: 8, fill: '#2f4a34' }),
      shape('teardrop-leaf', [-14, 104], 28, 28, '#6b8a4a', { rotation: -75 }),
      shape('teardrop-leaf', [14, 104], 28, 28, '#8a9a6b', { rotation: -15 }),
    ],
  },
  {
    id: 'combo-nature-leave-no-trace',
    label: 'Leave no trace',
    tags: 'leave no trace outdoor ethics trail sign camping hiking wood',
    parts: [
      rect([0, 0], 580, 250, '#5b4636', { cornerRadius: 12 }),
      text('LEAVE NO TRACE', 'Oswald', 58, [5, -34], { fontWeight: 500, letterSpacing: 10, fill: '#f3ecd9' }),
      line([0, 22], 80, '#c9a14a', { weight: 2 }),
      text('take only pictures, leave only footprints', 'Cormorant Garamond', 30, [0, 64], { fontStyle: 'italic', fontWeight: 500, fill: '#e9e1c9' }),
    ],
  },
];

export default combos;
