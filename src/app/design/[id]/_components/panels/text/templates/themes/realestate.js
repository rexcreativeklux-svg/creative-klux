// ============================================
// FILE: panels/text/templates/themes/realestate.js
// PURPOSE: Text templates — Real estate
// ============================================

import { circle, line, rect, ringText, shape, text } from '../comboParts';

// One palette for the theme: navy and brass on light pages, cream and soft
// brass on the dark plates, forest green and a muted brick for accents.
const NAVY = '#1b2a41';
const BRASS = '#a8834c';
const BRASS_SOFT = '#d8bf8a';
const CREAM = '#f7f1e5';
const FOREST = '#1f3b2d';
const CHARCOAL = '#2b2b2e';
const STONE = '#6b6f76';
const BRICK = '#a1432b';

const combos = [
  {
    id: 'combo-realestate-just-listed',
    label: 'Just listed',
    tags: 'just listed new listing house home property for sale realtor',
    parts: [
      text('LISTED', 'Playfair Display', 132, [0, 20], { fontWeight: 800, letterSpacing: 6, fill: NAVY }),
      text('Just', 'Great Vibes', 124, [-150, -66], { fill: BRASS }),
      line([0, 104], 56, BRASS, { weight: 2 }),
      text('24 MAPLE AVENUE  ·  $845,000', 'Montserrat', 17, [3, 138], { fontWeight: 600, letterSpacing: 6, fill: NAVY }),
    ],
  },
  {
    id: 'combo-realestate-open-house',
    label: 'Open house',
    tags: 'open house viewing sunday showing home realtor',
    parts: [
      rect([0, 0], 560, 330, NAVY, { cornerRadius: 4 }),
      rect([0, 0], 526, 296, 'transparent', { stroke: BRASS_SOFT, strokeWidth: 1.5 }),
      text('OPEN', 'Montserrat', 22, [10, -94], { fontWeight: 600, letterSpacing: 20, fill: BRASS_SOFT }),
      text('House', 'Playfair Display', 128, [0, -8], { fontStyle: 'italic', fill: CREAM }),
      line([0, 72], 44, BRASS_SOFT, { weight: 1.5 }),
      text('SUNDAY  ·  2–4 PM', 'Montserrat', 20, [4, 104], { fontWeight: 600, letterSpacing: 8, fill: BRASS_SOFT }),
    ],
  },
  {
    id: 'combo-realestate-sold',
    label: 'Sold seal',
    tags: 'sold just sold seal badge congratulations new homeowners realtor',
    parts: [
      circle([0, 0], 360, NAVY),
      circle([0, 0], 336, 'transparent', { stroke: BRASS_SOFT, strokeWidth: 1.5 }),
      circle([0, 0], 232, 'transparent', { stroke: BRASS_SOFT, strokeWidth: 1.5 }),
      ringText('CONGRATULATIONS', 'Montserrat', 17, [0, 0], 142, 'top', { fontWeight: 700, letterSpacing: 6, fill: BRASS_SOFT }),
      ringText('NEW HOMEOWNERS', 'Montserrat', 17, [0, 0], 142, 'bottom', { fontWeight: 700, letterSpacing: 6, fill: BRASS_SOFT }),
      shape('star4', [-142, 0], 16, 16, BRASS_SOFT),
      shape('star4', [142, 0], 16, 16, BRASS_SOFT),
      text('SOLD', 'Bodoni Moda', 72, [2, -2], { fontWeight: 800, letterSpacing: 4, fill: CREAM }),
      text('128 OAK STREET', 'Montserrat', 13, [2, 46], { fontWeight: 600, letterSpacing: 4, fill: BRASS_SOFT }),
    ],
  },
  {
    id: 'combo-realestate-for-sale',
    label: 'For sale sign',
    tags: 'for sale sign yard sign house property call realtor',
    parts: [
      line([0, -150], 540, CHARCOAL, { weight: 7 }),
      line([-170, -121], 58, CHARCOAL, { weight: 3, rotation: 90 }),
      line([170, -121], 58, CHARCOAL, { weight: 3, rotation: 90 }),
      rect([0, -12], 500, 170, FOREST, { cornerRadius: 6 }),
      text('FOR SALE', 'Montserrat', 66, [3, -4], { fontWeight: 800, letterSpacing: 6, fill: CREAM }),
      text('CALL JANE  ·  (555) 214-7788', 'Montserrat', 17, [3, 110], { fontWeight: 700, letterSpacing: 5, fill: FOREST }),
    ],
  },
  {
    id: 'combo-realestate-new-price',
    label: 'New price',
    tags: 'new price price drop reduced listing house home',
    parts: [
      text('New price', 'Bodoni Moda', 56, [0, -112], { fontStyle: 'italic', fill: BRASS }),
      text('$689,000', 'Bodoni Moda', 116, [0, -8], { fontWeight: 700, fill: NAVY }),
      text('WAS', 'Montserrat', 14, [-86, 92], { fontWeight: 700, letterSpacing: 6, fill: STONE }),
      text('$725,000', 'Montserrat', 24, [30, 92], { fontWeight: 500, letterSpacing: 2, fill: STONE, textDecoration: 'line-through' }),
    ],
  },
  {
    id: 'combo-realestate-dream-home',
    label: 'Dream home',
    tags: 'dream home house find your home realtor property',
    parts: [
      line([-140, -118], 150, BRASS, { weight: 1.5 }),
      shape('house', [0, -124], 58, 54, BRASS),
      line([140, -118], 150, BRASS, { weight: 1.5 }),
      text('Dream Home', 'DM Serif Display', 100, [0, -22], { fill: NAVY }),
      text("LET'S FIND YOURS", 'Montserrat', 18, [5, 64], { fontWeight: 600, letterSpacing: 10, fill: BRASS }),
    ],
  },
  {
    id: 'combo-realestate-luxury-living',
    label: 'Luxury living',
    tags: 'luxury living estate villa premium property arch',
    parts: [
      shape('arch', [0, 0], 430, 410, FOREST),
      shape('arch', [0, 0], 398, 378, 'transparent', { stroke: BRASS_SOFT, strokeWidth: 1.5 }),
      shape('sparkle', [0, -96], 26, 26, BRASS_SOFT),
      text('Luxury', 'Great Vibes', 110, [0, -22], { fill: BRASS_SOFT }),
      text('LIVING', 'Cormorant Garamond', 54, [6, 66], { fontWeight: 600, letterSpacing: 12, fill: CREAM }),
      text('THE PALMS ESTATES', 'Montserrat', 15, [3, 134], { fontWeight: 600, letterSpacing: 6, fill: BRASS_SOFT }),
    ],
  },
  {
    id: 'combo-realestate-price-reduced',
    label: 'Price reduced',
    tags: 'price reduced drop deal listing house home ribbon',
    parts: [
      text('PRICE', 'Montserrat', 22, [9, -118], { fontWeight: 700, letterSpacing: 18, fill: BRASS }),
      text('Reduced', 'DM Serif Display', 128, [0, -30], { fontStyle: 'italic', fill: NAVY }),
      shape('banner-swallowtail', [0, 86], 520, 74, BRASS),
      text('NOW $599,000', 'Montserrat', 26, [3, 88], { fontWeight: 700, letterSpacing: 6, fill: NAVY }),
    ],
  },
  {
    id: 'combo-realestate-under-contract',
    label: 'Under contract',
    tags: 'under contract pending sold stamp house listing',
    parts: [
      rect([0, -24], 440, 150, 'transparent', { stroke: BRICK, strokeWidth: 5, cornerRadius: 10, rotation: -5 }),
      rect([0, -24], 416, 126, 'transparent', { stroke: BRICK, strokeWidth: 1.5, cornerRadius: 6, rotation: -5 }),
      text('UNDER', 'Montserrat', 22, [6, -60], { fontWeight: 700, letterSpacing: 18, fill: BRICK, rotation: -5 }),
      text('CONTRACT', 'Montserrat', 52, [5, -6], { fontWeight: 800, letterSpacing: 5, fill: BRICK, rotation: -5 }),
      text('128 HARBOR LANE  ·  WEST HILLS', 'Montserrat', 16, [3, 104], { fontWeight: 600, letterSpacing: 5, fill: NAVY }),
    ],
  },
  {
    id: 'combo-realestate-welcome-home',
    label: 'Welcome home',
    tags: 'welcome home keys new home moving housewarming',
    parts: [
      text('Welcome', 'Allura', 150, [0, -34], { fill: FOREST }),
      line([-150, 66], 100, BRASS, { weight: 1.5 }),
      text('HOME', 'Montserrat', 22, [9, 66], { fontWeight: 600, letterSpacing: 18, fill: BRASS }),
      line([150, 66], 100, BRASS, { weight: 1.5 }),
      shape('key', [0, 124], 64, 32, BRASS),
    ],
  },
  {
    id: 'combo-realestate-agent-card',
    label: 'Agent card',
    tags: 'agent realtor broker contact name phone email card',
    parts: [
      rect([-238, 4], 5, 196, BRASS),
      text('Jane Cooper', 'Playfair Display', 74, [30, -52], { fontWeight: 700, width: 480, textAlign: 'left', fill: NAVY }),
      text('REALTOR®  ·  COOPER & CO.', 'Montserrat', 15, [30, 10], { fontWeight: 700, letterSpacing: 5, width: 480, textAlign: 'left', fill: BRASS }),
      text('(555) 214-7788\njane@cooperhomes.com', 'Montserrat', 19, [30, 70], {
        fontWeight: 500,
        lineHeight: 1.5,
        width: 480,
        textAlign: 'left',
        fill: CHARCOAL,
      }),
    ],
  },
  {
    id: 'combo-realestate-bed-bath',
    label: '3 bed · 2 bath',
    tags: 'bedrooms bathrooms square feet price listing details specs house',
    parts: [
      text('$749,000', 'Bodoni Moda', 92, [0, -70], { fontWeight: 700, fill: NAVY }),
      text('3', 'Bodoni Moda', 56, [-200, 20], { fontWeight: 600, fill: NAVY }),
      text('2', 'Bodoni Moda', 56, [0, 20], { fontWeight: 600, fill: NAVY }),
      text('1,850', 'Bodoni Moda', 56, [200, 20], { fontWeight: 600, fill: NAVY }),
      line([-100, 40], 80, BRASS, { weight: 1.5, rotation: 90 }),
      line([100, 40], 80, BRASS, { weight: 1.5, rotation: 90 }),
      text('BEDROOMS', 'Montserrat', 14, [-197, 70], { fontWeight: 700, letterSpacing: 5, fill: BRASS }),
      text('BATHROOMS', 'Montserrat', 14, [3, 70], { fontWeight: 700, letterSpacing: 5, fill: BRASS }),
      text('SQ FT', 'Montserrat', 14, [203, 70], { fontWeight: 700, letterSpacing: 5, fill: BRASS }),
    ],
  },
  {
    id: 'combo-realestate-coming-soon',
    label: 'Coming soon',
    tags: 'coming soon exclusive listing new property teaser frame',
    parts: [
      rect([0, 0], 540, 260, 'transparent', { stroke: NAVY, strokeWidth: 2.5 }),
      rect([0, 0], 522, 242, 'transparent', { stroke: NAVY, strokeWidth: 1 }),
      text('EXCLUSIVE LISTING', 'Montserrat', 15, [4, -76], { fontWeight: 700, letterSpacing: 8, fill: BRASS }),
      text('Coming Soon', 'Cormorant Garamond', 92, [0, -8], { fontStyle: 'italic', fontWeight: 600, fill: NAVY }),
      text('SPRING 2027  ·  WEST HILLS', 'Montserrat', 15, [3, 66], { fontWeight: 600, letterSpacing: 6, fill: NAVY }),
    ],
  },
  {
    id: 'combo-realestate-market-update',
    label: 'Market update',
    tags: 'market update report home values stats quarterly realtor',
    parts: [
      rect([-205, -106], 130, 36, NAVY, { cornerRadius: 18 }),
      text('Q3  ·  2027', 'Montserrat', 14, [-203, -106], { fontWeight: 700, letterSpacing: 3, fill: CREAM }),
      text('Market', 'Playfair Display', 84, [-120, -38], { fontWeight: 700, width: 300, textAlign: 'left', fill: NAVY }),
      text('update', 'Playfair Display', 84, [-120, 40], { fontStyle: 'italic', width: 300, textAlign: 'left', fill: BRASS }),
      line([70, 0], 160, BRASS, { weight: 1.5, rotation: 90 }),
      text('+6.2%', 'DM Serif Display', 76, [180, -16], { fill: NAVY }),
      text('HOME VALUES', 'Montserrat', 15, [183, 42], { fontWeight: 700, letterSpacing: 5, fill: BRASS }),
    ],
  },
  {
    id: 'combo-realestate-virtual-tour',
    label: 'Virtual tour',
    tags: 'virtual tour video walkthrough play 3d home listing',
    parts: [
      circle([-196, 0], 124, NAVY),
      shape('banner-pennant', [-190, 0], 38, 44, CREAM),
      text('Virtual', 'Playfair Display', 84, [95, -44], { fontStyle: 'italic', width: 330, textAlign: 'left', fill: NAVY }),
      text('TOUR', 'Montserrat', 48, [95, 26], { fontWeight: 800, letterSpacing: 16, width: 330, textAlign: 'left', fill: BRASS }),
      text('TAP TO STEP INSIDE', 'Montserrat', 15, [95, 78], { fontWeight: 600, letterSpacing: 5, width: 330, textAlign: 'left', fill: STONE }),
    ],
  },
];

export default combos;
