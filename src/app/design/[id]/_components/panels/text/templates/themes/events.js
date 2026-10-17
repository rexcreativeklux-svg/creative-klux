// ============================================
// FILE: panels/text/templates/themes/events.js
// PURPOSE: Text templates — Events & invites
// ============================================

import { circle, gradient, line, outline, rect, ringText, shape, text } from '../comboParts';

// Evening colours: near-black and champagne gold, with burgundy, midnight and
// emerald as the one deep accent a design picks.
const BLACK = '#161616';
const GOLD = '#b08a3e';
const GOLD_SOFT = '#dcc07e';
const GOLD_ON_DARK = gradient(180, '#ecd08c', '#b3862f');
const GOLD_ON_LIGHT = gradient(180, '#c9a24c', '#8a6420');
const BURGUNDY = '#6b1f2e';
const MIDNIGHT = '#1c2340';
const EMERALD = '#0f4c3a';
const STONE = '#6b7280';
const CREAM = '#f8f1e4';

const combos = [
  {
    id: 'combo-events-youre-invited',
    label: "You're invited",
    tags: 'you are invited invitation party evening date time venue',
    parts: [
      text('JOIN US FOR AN EVENING', 'Montserrat', 15, [4, -134], { fontWeight: 600, letterSpacing: 8, fill: GOLD }),
      text("You're invited", 'Great Vibes', 104, [0, -26], { fill: BLACK }),
      line([0, 44], 60, GOLD, { weight: 1.5 }),
      text('SATURDAY, OCT 12  ·  7 PM', 'Montserrat', 16, [3, 80], { fontWeight: 700, letterSpacing: 6, fill: BLACK }),
      text('The Glasshouse, 14 River St.', 'Cormorant Garamond', 26, [0, 116], { fontStyle: 'italic', fontWeight: 500, fill: STONE }),
    ],
  },
  {
    id: 'combo-events-gala-night',
    label: 'Gala night',
    tags: 'gala night black tie winter ball formal evening art deco',
    parts: [
      shape('flowchart-preparation', [0, 0], 580, 330, BLACK),
      shape('flowchart-preparation', [0, 0], 548, 298, 'transparent', { stroke: GOLD_SOFT, strokeWidth: 1.5 }),
      text('THE WINTER', 'Montserrat', 15, [6, -96], { fontWeight: 600, letterSpacing: 12, fill: GOLD_SOFT }),
      text('GALA', 'Italiana', 128, [12, -10], { letterSpacing: 24, fill: GOLD_ON_DARK }),
      text('NIGHT', 'Montserrat', 20, [9, 64], { fontWeight: 500, letterSpacing: 18, fill: GOLD_SOFT }),
      text('DEC 14  ·  8 PM  ·  BLACK TIE', 'Montserrat', 14, [3, 108], { fontWeight: 600, letterSpacing: 5, fill: '#a8a29e' }),
    ],
  },
  {
    id: 'combo-events-conference-2027',
    label: 'Conference 2027',
    tags: 'conference 2027 summit business event lisbon dates',
    parts: [
      text('2027', 'Outfit', 230, [0, 0], { fontWeight: 800, letterSpacing: -4, fill: 'transparent', textStroke: outline(2.5, '#8e9ac4') }),
      rect([0, 40], 600, 72, MIDNIGHT),
      text('CONFERENCE', 'Montserrat', 40, [5, 40], { fontWeight: 800, letterSpacing: 10, fill: '#ffffff' }),
      text('MAY 14–16  ·  LISBON, PORTUGAL', 'Montserrat', 16, [3, 116], { fontWeight: 700, letterSpacing: 6, fill: MIDNIGHT }),
    ],
  },
  {
    id: 'combo-events-save-your-seat',
    label: 'Save your seat',
    tags: 'save your seat reserve rsvp limited seating tickets button',
    parts: [
      text('LIMITED SEATING', 'Montserrat', 15, [4, -112], { fontWeight: 700, letterSpacing: 8, fill: BURGUNDY }),
      text('Save your seat', 'Playfair Display', 84, [0, -40], { fontStyle: 'italic', fontWeight: 500, fill: BLACK }),
      rect([0, 44], 270, 62, BURGUNDY, { cornerRadius: 31 }),
      text('RESERVE NOW', 'Montserrat', 18, [4, 44], { fontWeight: 700, letterSpacing: 6, fill: '#ffffff' }),
      text('Oct 12  ·  7 PM  ·  120 seats only', 'Montserrat', 17, [0, 112], { fontWeight: 500, fill: STONE }),
    ],
  },
  {
    id: 'combo-events-tickets-on-sale',
    label: 'Tickets on sale',
    tags: 'tickets on sale now admit one ticket concert show event',
    parts: [
      rect([0, 0], 580, 230, BURGUNDY, { cornerRadius: 16 }),
      line([150, 0], 196, '#e8c9a0', { weight: 2, style: 'dashed', rotation: 90 }),
      text('TICKETS', 'Bebas Neue', 112, [-70, -22], { letterSpacing: 6, fill: CREAM }),
      text('ON SALE NOW', 'Montserrat', 18, [-66, 58], { fontWeight: 700, letterSpacing: 10, fill: GOLD_SOFT }),
      text('ADMIT ONE', 'Montserrat', 16, [206, 0], { fontWeight: 800, letterSpacing: 6, fill: CREAM, rotation: -90 }),
      text('Nº 0427', 'Montserrat', 13, [240, 0], { fontWeight: 600, letterSpacing: 3, fill: GOLD_SOFT, rotation: -90 }),
    ],
  },
  {
    id: 'combo-events-rsvp',
    label: 'RSVP seal',
    tags: 'rsvp kindly reply seal stamp invitation respond',
    parts: [
      circle([0, 0], 330, 'transparent', { stroke: BURGUNDY, strokeWidth: 2.5 }),
      circle([0, 0], 226, 'transparent', { stroke: BURGUNDY, strokeWidth: 1 }),
      ringText('KINDLY REPLY', 'Montserrat', 16, [0, 0], 139, 'top', { fontWeight: 700, letterSpacing: 8, fill: BURGUNDY }),
      ringText('BY SEPTEMBER 1', 'Montserrat', 16, [0, 0], 139, 'bottom', { fontWeight: 700, letterSpacing: 8, fill: BURGUNDY }),
      shape('star4', [-139, 0], 14, 14, BURGUNDY),
      shape('star4', [139, 0], 14, 14, BURGUNDY),
      text('RSVP', 'Bodoni Moda', 54, [3, 4], { fontWeight: 700, letterSpacing: 6, fill: BURGUNDY }),
    ],
  },
  {
    id: 'combo-events-live-music',
    label: 'Live music',
    tags: 'live music band concert gig friday night bar',
    parts: [
      text('MUSIC', 'Bebas Neue', 190, [5, 24], { letterSpacing: 10, fill: BLACK }),
      text('Live', 'Yellowtail', 120, [-120, -90], { fill: GOLD, rotation: -8 }),
      text('FRIDAYS  ·  9 PM  ·  THE BLUE ROOM', 'Montserrat', 15, [3, 134], { fontWeight: 700, letterSpacing: 5, fill: BLACK }),
    ],
  },
  {
    id: 'combo-events-grand-opening',
    label: 'Grand opening',
    tags: 'grand opening launch store ribbon celebration new',
    parts: [
      shape('sparkle', [-175, -112], 30, 30, GOLD),
      shape('sparkle', [175, -112], 30, 30, GOLD),
      text('Grand', 'Great Vibes', 104, [0, -104], { fill: GOLD }),
      text('OPENING', 'Playfair Display', 92, [4, -8], { fontWeight: 800, letterSpacing: 8, fill: BLACK }),
      shape('banner-swallowtail', [0, 94], 500, 62, BURGUNDY),
      text('MARCH 8  ·  10 AM', 'Montserrat', 18, [4, 94], { fontWeight: 700, letterSpacing: 6, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-events-annual-summit',
    label: 'Annual summit',
    tags: 'annual summit conference date venue time corporate event',
    parts: [
      text('THE ANNUAL', 'Montserrat', 17, [7, -130], { fontWeight: 600, letterSpacing: 14, fill: GOLD }),
      text('SUMMIT', 'Montserrat', 108, [2, -54], { fontWeight: 900, letterSpacing: 4, fill: gradient(90, MIDNIGHT, '#34508f') }),
      text('DATE', 'Montserrat', 13, [-178, 36], { fontWeight: 700, letterSpacing: 5, fill: STONE }),
      text('VENUE', 'Montserrat', 13, [2, 36], { fontWeight: 700, letterSpacing: 5, fill: STONE }),
      text('TIME', 'Montserrat', 13, [182, 36], { fontWeight: 700, letterSpacing: 5, fill: STONE }),
      text('May 14', 'Playfair Display', 30, [-180, 72], { fontWeight: 600, fill: MIDNIGHT }),
      text('Pier 27', 'Playfair Display', 30, [0, 72], { fontWeight: 600, fill: MIDNIGHT }),
      text('9 AM', 'Playfair Display', 30, [180, 72], { fontWeight: 600, fill: MIDNIGHT }),
      line([-90, 54], 70, GOLD, { weight: 1.5, rotation: 90 }),
      line([90, 54], 70, GOLD, { weight: 1.5, rotation: 90 }),
    ],
  },
  {
    id: 'combo-events-date-lockup',
    label: 'Autumn soirée',
    tags: 'date lockup soiree evening party october saturday event',
    parts: [
      rect([-196, 0], 150, 196, BURGUNDY, { cornerRadius: 10 }),
      text('OCT', 'Montserrat', 20, [-192, -66], { fontWeight: 700, letterSpacing: 8, fill: '#f3d9c8' }),
      text('12', 'Bodoni Moda', 92, [-196, 8], { fontWeight: 700, fill: '#ffffff' }),
      text('SATURDAY', 'Montserrat', 13, [-194, 70], { fontWeight: 600, letterSpacing: 4, fill: '#f3d9c8' }),
      text('Autumn\nSoirée', 'Playfair Display', 66, [100, -28], { fontStyle: 'italic', lineHeight: 1.0, width: 330, textAlign: 'left', fill: BURGUNDY }),
      text('7 PM  ·  THE GRAND HALL', 'Montserrat', 14, [100, 74], { fontWeight: 700, letterSpacing: 4, width: 330, textAlign: 'left', fill: BLACK }),
    ],
  },
  {
    id: 'combo-events-keynote',
    label: 'Keynote speaker',
    tags: 'keynote speaker talk conference stage name title avatar',
    parts: [
      circle([-196, 0], 170, MIDNIGHT),
      circle([-196, 0], 190, 'transparent', { stroke: GOLD, strokeWidth: 1.5 }),
      text('AR', 'DM Serif Display', 64, [-194, 6], { letterSpacing: 2, fill: CREAM }),
      text('KEYNOTE SPEAKER', 'Montserrat', 14, [120, -62], { fontWeight: 700, letterSpacing: 7, width: 360, textAlign: 'left', fill: GOLD }),
      text('Dr. Ana Reyes', 'DM Serif Display', 52, [120, -14], { width: 360, textAlign: 'left', fill: MIDNIGHT }),
      text('Chief Scientist, Helix Labs', 'Cormorant Garamond', 24, [120, 32], {
        fontStyle: 'italic',
        fontWeight: 500,
        width: 360,
        textAlign: 'left',
        fill: STONE,
      }),
      text('MAIN STAGE  ·  10:30 AM', 'Montserrat', 13, [120, 72], { fontWeight: 700, letterSpacing: 5, width: 360, textAlign: 'left', fill: MIDNIGHT }),
    ],
  },
  {
    id: 'combo-events-opening-night',
    label: 'Opening night',
    tags: 'opening night art exhibition gallery vernissage artist show',
    parts: [
      rect([0, 0], 500, 360, 'transparent', { stroke: BLACK, strokeWidth: 1.5 }),
      text('Opening', 'Bodoni Moda', 96, [0, -66], { fontStyle: 'italic', fill: BLACK }),
      text('NIGHT', 'Bodoni Moda', 54, [13, 22], { fontWeight: 500, letterSpacing: 26, fill: BLACK }),
      line([0, 72], 40, BLACK, { weight: 1 }),
      text('NEW WORKS BY LENA ORTIZ\nNOV 3  ·  6–9 PM  ·  GALLERY NINE', 'Montserrat', 14, [2, 120], {
        fontWeight: 600,
        letterSpacing: 4,
        lineHeight: 1.9,
        fill: STONE,
      }),
    ],
  },
  {
    id: 'combo-events-cocktail-hour',
    label: 'Cocktail hour',
    tags: 'cocktail hour drinks rooftop happy hour evening party',
    parts: [
      text('SUMMER SOCIAL', 'Montserrat', 14, [5, -112], { fontWeight: 600, letterSpacing: 10, fill: GOLD }),
      text('Cocktail Hour', 'Playfair Display', 84, [0, -36], { fontStyle: 'italic', fontWeight: 500, fill: EMERALD }),
      line([-86, 36], 110, GOLD, { weight: 1.5 }),
      shape('diamond', [0, 36], 14, 14, GOLD),
      line([86, 36], 110, GOLD, { weight: 1.5 }),
      text('FRIDAY  ·  6–8 PM  ·  THE ROOFTOP', 'Montserrat', 15, [3, 90], { fontWeight: 700, letterSpacing: 5, fill: EMERALD }),
    ],
  },
  {
    id: 'combo-events-awards-night',
    label: 'Awards night',
    tags: 'awards night ceremony stars excellence honours celebration',
    parts: [
      shape('star5', [-44, -122], 22, 22, GOLD),
      shape('star5', [0, -128], 32, 32, GOLD),
      shape('star5', [44, -122], 22, 22, GOLD),
      text('AWARDS', 'Playfair Display', 104, [5, -30], { fontWeight: 800, letterSpacing: 10, fill: GOLD_ON_LIGHT }),
      text('NIGHT', 'Montserrat', 28, [12, 44], { fontWeight: 600, letterSpacing: 24, fill: BLACK }),
      text('CELEBRATING EXCELLENCE  ·  JUNE 20', 'Montserrat', 14, [3, 100], { fontWeight: 600, letterSpacing: 5, fill: STONE }),
    ],
  },
  {
    id: 'combo-events-networking-night',
    label: 'Networking night',
    tags: 'networking night meetup connect professionals speech bubble',
    parts: [
      shape('speech-bubble-oval', [0, -10], 540, 290, MIDNIGHT),
      text('Let’s connect', 'Playfair Display', 70, [0, -66], { fontStyle: 'italic', fill: CREAM }),
      text('NETWORKING NIGHT', 'Montserrat', 18, [5, -2], { fontWeight: 700, letterSpacing: 8, fill: GOLD_SOFT }),
      text('THU, NOV 6  ·  6 PM  ·  THE LOFT', 'Montserrat', 15, [3, 150], { fontWeight: 700, letterSpacing: 5, fill: MIDNIGHT }),
    ],
  },
];

export default combos;
