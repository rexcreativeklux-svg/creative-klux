// ============================================
// FILE: panels/text/templates/themes/kids.js
// PURPOSE: Text templates — Kids & birthdays
// ============================================

import { circle, line, outline, rect, ringText, shadow, shape, text } from '../comboParts';

/**
 * A balloon — an oval with a soft highlight, its knot and a string hanging from
 * it — centred on the oval's middle. Returns parts to spread into a combo.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} size  the oval's height (its width is a little less)
 * @param {string} fill
 */
const balloon = (cx, cy, size, fill) => [
  line([cx, cy + size / 2 + 40], 72, '#9aa5b1', { weight: 2, rotation: 90 }),
  shape('circle', [cx, cy], size * 0.84, size, fill),
  shape('circle', [cx - size * 0.18, cy - size * 0.2], size * 0.13, size * 0.24, '#ffffff', { rotation: 25, opacity: 0.45 }),
  shape('triangle', [cx, cy + size / 2 + 3], size * 0.16, size * 0.11, fill),
];

const combos = [
  {
    id: 'combo-kids-turning-five',
    label: "You're turning 5",
    tags: 'turning five 5 birthday kids party invite age',
    parts: [
      text("YOU'RE TURNING", 'Baloo 2', 30, [3, -160], { fontWeight: 800, letterSpacing: 6, fill: '#1d3557', curve: 24 }),
      shape('sparkle', [-124, -54], 46, 46, '#ffd166'),
      circle([116, -92], 14, '#2ec4b6'),
      shape('sparkle', [120, 44], 30, 30, '#4cc9f0'),
      circle([-108, 64], 12, '#ff8fab'),
      text('5', 'Lilita One', 250, [0, -4], { fill: '#ff6b6b', textShadow: shadow(10, 10, 0, '#ffd166') }),
      text('SAT, JUNE 14 · 3 PM', 'Fredoka', 22, [2, 136], { fontWeight: 600, letterSpacing: 4, fill: '#1d3557' }),
      text('RSVP TO MIA · 555-0142', 'Fredoka', 15, [2, 170], { fontWeight: 500, letterSpacing: 3, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-kids-party-time',
    label: 'Party time',
    tags: 'party time birthday balloons kids celebrate invite',
    parts: [
      ...balloon(-268, -64, 92, '#ff6b6b'),
      ...balloon(262, -34, 76, '#4cc9f0'),
      text('PARTY', 'Lilita One', 124, [0, -34], { letterSpacing: 2, fill: '#7b61ff' }),
      text('time!', 'Pacifico', 74, [46, 62], { fill: '#ff6b6b', rotation: -6 }),
      text('SAT, JUNE 14 · 3 PM · 12 ELM ST', 'Fredoka', 17, [2, 138], { fontWeight: 600, letterSpacing: 4, fill: '#1d3557' }),
    ],
  },
  {
    id: 'combo-kids-baby-shower',
    label: 'Baby shower',
    tags: 'baby shower cloud boy blue invite honoring',
    parts: [
      shape('cloud-fluffy', [0, 0], 460, 230, '#dbeafe'),
      shape('sparkle', [210, -128], 30, 30, '#fbbf24'),
      shape('sparkle', [-226, 74], 20, 20, '#fbbf24'),
      text('Baby', 'Pacifico', 92, [0, -48], { fill: '#1e3a8a' }),
      text('SHOWER', 'Fredoka', 30, [8, 30], { fontWeight: 700, letterSpacing: 16, fill: '#1e3a8a' }),
      text('HONORING EMMA · SUNDAY, MAY 4 · 2 PM', 'Fredoka', 15, [2, 138], { fontWeight: 600, letterSpacing: 3, fill: '#475569' }),
    ],
  },
  {
    id: 'combo-kids-oh-baby',
    label: 'Oh baby',
    tags: 'oh baby shower pink girl sweet announcement',
    parts: [
      text('BABY', 'Fredoka', 176, [0, 0], { fontWeight: 700, letterSpacing: 2, fill: '#f28482' }),
      text('oh', 'Pacifico', 84, [-174, -102], { fill: '#5e9c8f', rotation: -10, textStroke: outline(8, '#ffffff') }),
      shape('heart-sharp', [190, -92], 40, 36, '#f6bd60', { rotation: 14 }),
      text('A BABY SHOWER FOR JESS', 'Fredoka', 17, [4, 104], { fontWeight: 600, letterSpacing: 7, fill: '#264653' }),
    ],
  },
  {
    id: 'combo-kids-first-birthday',
    label: 'Happy 1st birthday',
    tags: 'happy first 1st birthday one baby banner party',
    parts: [
      shape('star5', [-164, -104], 30, 30, '#ffd166', { rotation: -10 }),
      shape('star5', [164, -104], 30, 30, '#ffd166', { rotation: 10 }),
      text('Happy', 'Pacifico', 84, [0, -102], { fill: '#ef476f' }),
      shape('banner-swallowtail', [0, 18], 580, 88, '#118ab2'),
      text('1ST BIRTHDAY', 'Lilita One', 46, [0, 22], { letterSpacing: 4, fill: '#ffffff' }),
      text('LEO IS ONE · SAT, JULY 12 · 2 PM', 'Fredoka', 17, [2, 106], { fontWeight: 600, letterSpacing: 4, fill: '#073b4c' }),
    ],
  },
  {
    id: 'combo-kids-lets-play',
    label: "Let's play",
    tags: 'lets play blocks toys playdate kids fun letters',
    parts: [
      text("let's", 'Pacifico', 66, [0, -118], { fill: '#073b4c' }),
      rect([-189, 14], 112, 112, '#ef476f', { cornerRadius: 20, rotation: -6 }),
      text('P', 'Lilita One', 84, [-189, 20], { fill: '#ffffff', rotation: -6 }),
      rect([-63, 14], 112, 112, '#ffd166', { cornerRadius: 20, rotation: 4 }),
      text('L', 'Lilita One', 84, [-63, 20], { fill: '#073b4c', rotation: 4 }),
      rect([63, 14], 112, 112, '#06d6a0', { cornerRadius: 20, rotation: -3 }),
      text('A', 'Lilita One', 84, [63, 20], { fill: '#073b4c', rotation: -3 }),
      rect([189, 14], 112, 112, '#118ab2', { cornerRadius: 20, rotation: 6 }),
      text('Y', 'Lilita One', 84, [189, 20], { fill: '#ffffff', rotation: 6 }),
      text('PLAYDATE · SAT 10 AM · THE PARK', 'Fredoka', 16, [2, 118], { fontWeight: 600, letterSpacing: 4, fill: '#073b4c' }),
    ],
  },
  {
    id: 'combo-kids-summer-camp',
    label: 'Summer camp',
    tags: 'summer camp kids holiday sun ages july outdoor',
    parts: [
      shape('semicircle', [0, -77], 360, 180, '#ffd166'),
      text('summer', 'Pacifico', 84, [0, -72], { fill: '#ef476f' }),
      text('CAMP', 'Lilita One', 150, [0, 62], { letterSpacing: 4, fill: '#118ab2' }),
      rect([0, 176], 300, 46, '#06d6a0', { cornerRadius: 23 }),
      text('JULY 7–25 · AGES 6–12', 'Fredoka', 18, [2, 178], { fontWeight: 700, letterSpacing: 3, fill: '#073b4c' }),
    ],
  },
  {
    id: 'combo-kids-little-one',
    label: 'Little one',
    tags: 'little one baby rainbow boho nursery newborn birth',
    parts: [
      shape('semicircle', [0, -90], 320, 160, '#e07a5f'),
      shape('semicircle', [0, -72.5], 250, 125, '#f2cc8f'),
      shape('semicircle', [0, -55], 180, 90, '#81b29a'),
      shape('semicircle', [0, -37.5], 110, 55, '#a8c5da'),
      text('little one', 'Fredoka', 78, [0, 50], { fontWeight: 600, fill: '#3d405b' }),
      text('BORN APRIL 2, 2027', 'Fredoka', 16, [4, 112], { fontWeight: 600, letterSpacing: 8, fill: '#e07a5f' }),
    ],
  },
  {
    id: 'combo-kids-welcome-baby',
    label: 'Welcome baby',
    tags: 'welcome baby birth announcement newborn name weight',
    parts: [
      text('welcome', 'Pacifico', 70, [0, -100], { fill: '#e07a5f' }),
      text('OLIVIA ROSE', 'Fredoka', 64, [4, -10], { fontWeight: 700, letterSpacing: 8, fill: '#3d405b' }),
      line([-118, 52], 200, '#d6c7b8', { weight: 1.5 }),
      shape('heart-sharp', [0, 52], 22, 20, '#e07a5f'),
      line([118, 52], 200, '#d6c7b8', { weight: 1.5 }),
      text('APRIL 14, 2027  ·  7 LB 2 OZ  ·  20 IN', 'Fredoka', 17, [2, 92], { fontWeight: 500, letterSpacing: 3, fill: '#3d405b' }),
    ],
  },
  {
    id: 'combo-kids-schools-out',
    label: "School's out",
    tags: 'schools out summer holiday chalkboard end of term kids',
    parts: [
      rect([0, 0], 580, 330, '#2f5d50', { cornerRadius: 12, stroke: '#c68b59', strokeWidth: 14 }),
      shape('sparkle', [-222, -106], 30, 30, '#ffd166'),
      shape('sparkle', [224, 100], 24, 24, '#fdfcdc'),
      text("SCHOOL'S", 'Chewy', 88, [0, -76], { letterSpacing: 4, fill: '#fdfcdc' }),
      text('OUT!', 'Chewy', 132, [0, 44], { letterSpacing: 4, fill: '#ffd166' }),
      text('for summer', 'Caveat', 40, [0, 132], { fill: '#fdfcdc' }),
    ],
  },
  {
    id: 'combo-kids-two-sweet',
    label: 'Two sweet',
    tags: 'two sweet second 2nd birthday badge girl pink party',
    parts: [
      circle([0, 0], 340, '#ffe3ec'),
      circle([0, 0], 304, 'transparent', { stroke: '#f25c8a', strokeWidth: 3 }),
      ringText('ELLA IS TURNING', 'Fredoka', 20, [0, 0], 128, 'top', { fontWeight: 700, letterSpacing: 5, fill: '#f25c8a' }),
      ringText('SAT · MAY 3 · 2 PM', 'Fredoka', 16, [0, 0], 130, 'bottom', { fontWeight: 700, letterSpacing: 4, fill: '#f25c8a' }),
      text('two', 'Pacifico', 80, [0, -26], { fill: '#7b61ff' }),
      text('SWEET', 'Lilita One', 56, [3, 42], { letterSpacing: 6, fill: '#f25c8a' }),
    ],
  },
  {
    id: 'combo-kids-sleepover',
    label: 'Sleepover',
    tags: 'sleepover pj pajama party night moon stars kids',
    parts: [
      rect([0, 0], 580, 320, '#1e1b4b', { cornerRadius: 26 }),
      circle([-236, -110], 66, '#fde68a'),
      circle([-220, -122], 56, '#1e1b4b'),
      shape('star5', [214, -104], 24, 24, '#fde68a'),
      shape('sparkle', [242, -68], 16, 16, '#fde68a'),
      text('sleepover', 'Pacifico', 84, [0, -20], { fill: '#fbcfe8' }),
      rect([0, 88], 290, 46, '#fbcfe8', { cornerRadius: 23 }),
      text('PJ PARTY · FRI 7 PM', 'Fredoka', 18, [3, 90], { fontWeight: 700, letterSpacing: 4, fill: '#1e1b4b' }),
    ],
  },
  {
    id: 'combo-kids-first-day',
    label: 'First day of school',
    tags: 'first day of school kindergarten back to school kids apple',
    parts: [
      text('my first day of', 'Pacifico', 50, [0, -120], { fill: '#ef476f' }),
      circle([236, -114], 50, '#ef476f'),
      shape('teardrop-leaf', [246, -146], 20, 20, '#06d6a0'),
      text('SCHOOL', 'Lilita One', 136, [0, -8], { letterSpacing: 4, fill: '#118ab2' }),
      rect([0, 96], 330, 48, '#ffd166', { cornerRadius: 24 }),
      text('KINDERGARTEN · 2027', 'Fredoka', 18, [3, 98], { fontWeight: 700, letterSpacing: 4, fill: '#073b4c' }),
    ],
  },
  {
    id: 'combo-kids-boy-or-girl',
    label: 'Boy or girl',
    tags: 'boy or girl gender reveal baby party pink blue',
    parts: [
      circle([-150, -6], 220, '#bde0fe'),
      text('BOY', 'Lilita One', 70, [-148, 0], { letterSpacing: 4, fill: '#1d4e89' }),
      circle([150, -6], 220, '#ffc8dd'),
      text('GIRL', 'Lilita One', 70, [152, 0], { letterSpacing: 4, fill: '#c9184a' }),
      text('or', 'Pacifico', 56, [0, -12], { fill: '#3d405b' }),
      text('GENDER REVEAL · JUNE 20 · 4 PM', 'Fredoka', 17, [3, 136], { fontWeight: 600, letterSpacing: 5, fill: '#3d405b' }),
    ],
  },
  {
    id: 'combo-kids-storytime',
    label: 'Storytime',
    tags: 'storytime story reading library books kids once upon a time',
    parts: [
      shape('speech-bubble-oval', [0, -40], 470, 236, '#ffd166'),
      text('Once upon a time…', 'Patrick Hand', 48, [0, -72], { fill: '#073b4c' }),
      text('STORYTIME', 'Baloo 2', 66, [68, 120], { fontWeight: 800, letterSpacing: 3, fill: '#ef476f' }),
      text('EVERY SAT · 10 AM · CITY LIBRARY', 'Fredoka', 15, [68, 172], { fontWeight: 600, letterSpacing: 4, fill: '#073b4c' }),
    ],
  },
];

export default combos;
