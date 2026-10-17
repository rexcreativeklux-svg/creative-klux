// ============================================
// FILE: panels/text/templates/themes/editorial.js
// PURPOSE: Text templates — Editorial
// ============================================

import { circle, line, rect, text } from '../comboParts';

// Magazine type: a bold display serif for the headline, a clean sans for the
// kicker and byline, one editorial red. Left-aligned parts use a fixed
// `width` so their left edges line up exactly (a hugging box would not) —
// kept only as wide as the words need, since a box's width is part of the
// template's bounds.
const INK = '#141414';
const RED = '#b4232a';
const WARM = '#57534e';

const combos = [
  {
    id: 'combo-editorial-cover-story',
    label: 'Cover story',
    tags: 'cover story magazine headline deck byline editorial',
    parts: [
      text('COVER STORY', 'Inter', 15, [3, -140], { fontWeight: 700, letterSpacing: 6, fill: RED }),
      text('The Art of\nSlow Living', 'DM Serif Display', 84, [0, -34], { lineHeight: 0.98, fill: INK }),
      text('How five designers rebuilt\ntheir days around less.', 'Lora', 20, [0, 100], { fontStyle: 'italic', lineHeight: 1.35, fill: WARM }),
      text('BY ANNA REED', 'Inter', 14, [3, 158], { fontWeight: 600, letterSpacing: 5, fill: INK }),
    ],
  },
  {
    id: 'combo-editorial-top-ten',
    label: 'Top 10',
    tags: 'top 10 list travel issue destinations number magazine editorial',
    parts: [
      text('10', 'Abril Fatface', 250, [-165, 10], { fill: RED }),
      text('TOP', 'Inter', 24, [151, -95], { fontWeight: 800, letterSpacing: 8, textAlign: 'left', width: 310, fill: INK }),
      text('Places to\nsee in 2027', 'DM Serif Display', 58, [151, -15], { lineHeight: 1, textAlign: 'left', width: 310, fill: INK }),
      text('THE TRAVEL ISSUE', 'Inter', 14, [151, 71], { fontWeight: 600, letterSpacing: 5, textAlign: 'left', width: 310, fill: WARM }),
    ],
  },
  {
    id: 'combo-editorial-interview',
    label: 'The interview',
    tags: 'interview pull quote founder magazine editorial',
    parts: [
      text('THE INTERVIEW', 'Inter', 15, [4, -112], { fontWeight: 700, letterSpacing: 8, fill: RED }),
      text('“I never planned\nany of it.”', 'Playfair Display', 64, [0, -18], { fontStyle: 'italic', lineHeight: 1.08, fill: INK }),
      line([0, 84], 40, RED, { weight: 2 }),
      text('MAYA CHEN, FOUNDER OF OAK STUDIO', 'Inter', 14, [2, 114], { fontWeight: 600, letterSpacing: 4, fill: INK }),
    ],
  },
  {
    id: 'combo-editorial-masthead',
    label: 'Masthead',
    tags: 'masthead magazine title vol issue autumn price editorial',
    parts: [
      line([0, -108], 560, INK, { weight: 3 }),
      line([0, -100], 560, INK, { weight: 1 }),
      text('FOLIO', 'Bodoni Moda', 150, [5, 14], { fontWeight: 500, letterSpacing: 10, fill: INK }),
      line([0, 80], 560, INK, { weight: 1 }),
      text('VOL. 07', 'Inter', 14, [0, 102], { fontWeight: 600, letterSpacing: 4, textAlign: 'left', width: 568, fill: INK }),
      text('THE AUTUMN ISSUE', 'Inter', 14, [2, 102], { fontWeight: 600, letterSpacing: 4, fill: RED }),
      text('$12.00', 'Inter', 14, [4, 102], { fontWeight: 600, letterSpacing: 4, textAlign: 'right', width: 568, fill: INK }),
      line([0, 124], 560, INK, { weight: 1 }),
    ],
  },
  {
    id: 'combo-editorial-weekend-edition',
    label: 'Weekend edition',
    tags: 'weekend edition newspaper saturday magazine editorial',
    parts: [
      text('The', 'Playfair Display', 40, [0, -104], { fontStyle: 'italic', fill: INK }),
      text('Weekend', 'Playfair Display', 110, [0, -14], { fontWeight: 900, fill: INK }),
      line([-171, 60], 150, INK, { weight: 1 }),
      text('EDITION', 'Inter', 16, [6, 60], { fontWeight: 700, letterSpacing: 12, fill: RED }),
      line([171, 60], 150, INK, { weight: 1 }),
      text('SATURDAY 3 OCTOBER 2027', 'Inter', 14, [2, 96], { fontWeight: 500, letterSpacing: 5, fill: WARM }),
    ],
  },
  {
    id: 'combo-editorial-in-focus',
    label: 'In focus',
    tags: 'in focus feature headline fashion sustainable magazine editorial',
    parts: [
      rect([-185, -102], 150, 32, RED),
      text('IN FOCUS', 'Inter', 14, [-182, -102], { fontWeight: 700, letterSpacing: 5, fill: '#ffffff' }),
      text('The Future of\nSustainable Fashion', 'Playfair Display', 56, [20, -6], { fontWeight: 700, lineHeight: 1.05, textAlign: 'left', width: 568, fill: INK }),
      text('Inside the labels rewriting how we dress.', 'Lora', 20, [20, 80], { fontStyle: 'italic', textAlign: 'left', width: 568, fill: WARM }),
      text('WORDS BY JAMES HART', 'Inter', 14, [20, 118], { fontWeight: 600, letterSpacing: 4, textAlign: 'left', width: 568, fill: INK }),
    ],
  },
  {
    id: 'combo-editorial-chapter-one',
    label: 'Chapter one',
    tags: 'chapter one book novel title author editorial',
    parts: [
      text('CHAPTER ONE', 'Cormorant Garamond', 18, [7, -108], { fontWeight: 600, letterSpacing: 14, fill: RED }),
      text('The Quiet', 'Cormorant Garamond', 96, [0, -34], { fontWeight: 500, fill: INK }),
      text('Years', 'Cormorant Garamond', 96, [0, 64], { fontWeight: 500, fontStyle: 'italic', fill: INK }),
      text('A NOVEL BY ELENA MARSH', 'Cormorant Garamond', 17, [4, 136], { fontWeight: 600, letterSpacing: 8, fill: WARM }),
    ],
  },
  {
    id: 'combo-editorial-drop-cap',
    label: 'Drop cap',
    tags: 'drop cap essay paragraph article body text magazine editorial',
    parts: [
      text('ESSAY · 6 MIN READ', 'Inter', 14, [-38, -108], { fontWeight: 700, letterSpacing: 6, textAlign: 'left', width: 460, fill: RED }),
      text('T', 'Abril Fatface', 148, [-214, -7], { fill: RED }),
      text('he city wakes slowly on Sundays.\nCafés lift their shutters, the first\ntrams hum along the river, and\nthe light lands softly on the stone.', 'Lora', 20, [38, -13], {
        lineHeight: 1.5,
        textAlign: 'left',
        width: 380,
        fill: INK,
      }),
      text('Nobody hurries here. Nobody needs to.', 'Lora', 20, [-38, 62], { lineHeight: 1.5, textAlign: 'left', width: 460, fill: INK }),
    ],
  },
  {
    id: 'combo-editorial-contents',
    label: 'Contents',
    tags: 'contents table index pages list magazine editorial',
    parts: [
      text('Contents', 'Playfair Display', 84, [0, -120], { fontStyle: 'italic', textAlign: 'left', width: 540, fill: INK }),
      line([0, -64], 540, INK, { weight: 1.5 }),
      text('04\n12\n28\n42', 'Inter', 20, [-240, 30], { fontWeight: 700, lineHeight: 1.8, textAlign: 'left', width: 60, fill: RED }),
      text('The Edit\nCover Story: Slow Living\n48 Hours in Lisbon\nThe Interview', 'Lora', 20, [20, 30], { lineHeight: 1.8, textAlign: 'left', width: 440, fill: INK }),
    ],
  },
  {
    id: 'combo-editorial-opinion',
    label: 'Opinion',
    tags: 'opinion column author byline headline magazine editorial',
    parts: [
      text('OPINION', 'Inter', 15, [0, -112], { fontWeight: 700, letterSpacing: 6, textAlign: 'left', width: 540, fill: RED }),
      text('Why we should all\nwalk more slowly', 'DM Serif Display', 60, [0, -26], { lineHeight: 1, textAlign: 'left', width: 540, fill: INK }),
      circle([-242, 86], 50, '#e7e5e4'),
      text('JH', 'Inter', 16, [-242, 86], { fontWeight: 700, fill: WARM }),
      text('James Hart', 'Inter', 18, [-19, 74], { fontWeight: 600, textAlign: 'left', width: 360, fill: INK }),
      text('Contributing editor', 'Inter', 15, [-19, 98], { fontWeight: 400, textAlign: 'left', width: 360, fill: WARM }),
    ],
  },
  {
    id: 'combo-editorial-spring-issue',
    label: 'Spring issue',
    tags: 'spring issue season magazine cover number editorial',
    parts: [
      text('THE NEW SEASON', 'Inter', 14, [5, -134], { fontWeight: 600, letterSpacing: 10, fill: INK }),
      text('Spring', 'Playfair Display', 170, [0, -20], { fontWeight: 900, fontStyle: 'italic', fill: INK }),
      rect([0, 124], 270, 40, RED),
      text('THE ISSUE Nº 12', 'Inter', 15, [4, 124], { fontWeight: 700, letterSpacing: 8, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-editorial-credits',
    label: 'Credits',
    tags: 'credits photography styling words team magazine editorial',
    parts: [
      text('CREDITS', 'Inter', 14, [4, -94], { fontWeight: 700, letterSpacing: 8, fill: RED }),
      text('Photography\nStyling\nHair & Make-up\nWords', 'Inter', 18, [-101, 10], { fontWeight: 500, lineHeight: 1.9, textAlign: 'right', width: 170, fill: WARM }),
      rect([0, 10], 1, 140, INK),
      text('Tom Ellis\nAna Ruiz\nMei Tanaka\nJo Park', 'Playfair Display', 19, [91, 10], { fontStyle: 'italic', lineHeight: 1.8, textAlign: 'left', width: 150, fill: INK }),
    ],
  },
  {
    id: 'combo-editorial-city-guide',
    label: 'City guide',
    tags: '48 hours in lisbon city guide travel magazine editorial',
    parts: [
      text('48 HOURS IN', 'Inter', 18, [5, -104], { fontWeight: 700, letterSpacing: 10, fill: INK }),
      text('Lisbon', 'Abril Fatface', 160, [0, -4], { fill: RED }),
      line([0, 78], 60, INK, { weight: 2 }),
      text('THE CITY GUIDE · PAGE 64', 'Inter', 14, [3, 106], { fontWeight: 600, letterSpacing: 6, fill: WARM }),
    ],
  },
  {
    id: 'combo-editorial-long-read',
    label: 'The long read',
    tags: 'long read feature headline ocean magazine editorial',
    parts: [
      line([0, -118], 560, INK, { weight: 1 }),
      text('THE LONG READ  ·  18 MIN', 'Inter', 14, [3, -96], { fontWeight: 700, letterSpacing: 6, fill: RED }),
      text('What the ocean', 'Bodoni Moda', 60, [0, -34], { fontStyle: 'italic', fontWeight: 400, fill: INK }),
      text('REMEMBERS', 'Bodoni Moda', 70, [3, 46], { fontWeight: 900, letterSpacing: 6, fill: INK }),
      line([0, 96], 560, INK, { weight: 1 }),
      text('A reporter spends a year at sea', 'Lora', 19, [0, 124], { fontStyle: 'italic', fill: WARM }),
    ],
  },
  {
    id: 'combo-editorial-fashion-week',
    label: 'Fashion week',
    tags: 'paris fashion week runway spring summer magazine editorial',
    parts: [
      text('SPRING / SUMMER 2027', 'Inter', 14, [5, -122], { fontWeight: 700, letterSpacing: 10, fill: RED }),
      text('PARIS', 'Bodoni Moda', 150, [4, -4], { fontWeight: 900, letterSpacing: 8, fill: INK }),
      text('Fashion Week', 'DM Serif Display', 56, [0, 84], { fontStyle: 'italic', fill: RED }),
    ],
  },
];

export default combos;
