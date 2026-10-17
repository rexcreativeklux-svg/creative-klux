// ============================================
// FILE: panels/text/templates/themes/minimal.js
// PURPOSE: Text templates — Minimal & modern
// ============================================

import { circle, line, outline, rect, shape, text } from '../comboParts';

// Near-black type, one quiet accent per design. Letter-spaced lines sit
// letterSpacing / 2 right of centre: the canvas adds the spacing after the
// last letter too, so a centred spaced line would otherwise lean left.
const INK = '#111827';
const GREY = '#6b7280';
const VERMILION = '#e0482b';
const COBALT = '#2946c7';
const SAGE = '#5f7a61';
const CLAY = '#b4643f';

const combos = [
  {
    id: 'combo-minimal-less-but-better',
    label: 'Less, but better',
    tags: 'minimal less but better simple quote clean modern',
    parts: [
      text('Less', 'Jost', 220, [-18, -20], { fontWeight: 300, letterSpacing: -6, fill: INK }),
      circle([200, 24], 30, VERMILION),
      text('BUT BETTER', 'Jost', 24, [9, 102], { fontWeight: 500, letterSpacing: 18, fill: INK }),
    ],
  },
  {
    id: 'combo-minimal-new-collection',
    label: 'New collection',
    tags: 'new collection 2027 fashion launch minimal modern',
    parts: [
      text('NEW IN', 'Inter', 18, [8, -92], { fontWeight: 600, letterSpacing: 16, fill: CLAY }),
      text('Collection', 'Inter', 104, [0, -8], { fontWeight: 300, letterSpacing: -4, fill: INK }),
      line([-150, 69], 150, INK, { weight: 1.5 }),
      text('2027', 'Inter', 20, [5, 70], { fontWeight: 500, letterSpacing: 10, fill: INK }),
      line([150, 69], 150, INK, { weight: 1.5 }),
    ],
  },
  {
    id: 'combo-minimal-studio-wordmark',
    label: 'Studio wordmark',
    tags: 'studio wordmark logo brand design minimal modern',
    parts: [
      text('nord', 'Outfit', 180, [-22, -18], { fontWeight: 600, letterSpacing: -8, fill: INK }),
      rect([182, 18], 28, 28, COBALT),
      text('DESIGN STUDIO', 'Outfit', 18, [7, 86], { fontWeight: 500, letterSpacing: 14, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-coming-soon',
    label: 'Coming soon',
    tags: 'coming soon launch stay tuned date minimal frame',
    parts: [
      rect([0, 0], 580, 210, 'transparent', { stroke: INK, strokeWidth: 2 }),
      rect([0, -105], 184, 38, VERMILION, { cornerRadius: 19 }),
      text('STAY TUNED', 'Inter', 14, [3, -105], { fontWeight: 700, letterSpacing: 5, fill: '#ffffff' }),
      text('COMING SOON', 'Inter', 46, [7, -8], { fontWeight: 300, letterSpacing: 14, fill: INK }),
      text('01 · 10 · 2027', 'Inter', 19, [5, 50], { fontWeight: 500, letterSpacing: 10, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-thank-you',
    label: 'Thank you',
    tags: 'thank you order shopping customer minimal modern',
    parts: [
      rect([-232, 6], 5, 266, SAGE),
      text('Thank\nyou.', 'Jost', 116, [-13, -24], {
        fontWeight: 500,
        lineHeight: 0.92,
        letterSpacing: -3,
        textAlign: 'left',
        width: 390,
        fill: INK,
      }),
      text('FOR SHOPPING WITH US', 'Jost', 17, [-13, 134], { fontWeight: 500, letterSpacing: 8, textAlign: 'left', width: 390, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-24-hours',
    label: '24 hours',
    tags: '24 hours flash sale midnight number minimal modern',
    parts: [
      text('24', 'Outfit', 240, [-169, 16], { fontWeight: 200, letterSpacing: -10, fill: INK }),
      rect([-9, 0], 2, 170, INK),
      text('HOURS', 'Outfit', 70, [189, -38], { fontWeight: 600, letterSpacing: 2, textAlign: 'left', width: 340, fill: INK }),
      text('FLASH SALE', 'Outfit', 24, [189, 22], { fontWeight: 600, letterSpacing: 8, textAlign: 'left', width: 340, fill: VERMILION }),
      text('ENDS AT MIDNIGHT', 'Outfit', 20, [189, 58], { fontWeight: 400, letterSpacing: 6, textAlign: 'left', width: 340, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-open-daily',
    label: 'Open daily',
    tags: 'open daily hours 9 5 shop store opening times minimal',
    parts: [
      text('OPEN DAILY', 'Outfit', 22, [8, -130], { fontWeight: 500, letterSpacing: 16, fill: SAGE }),
      text('9–5', 'Outfit', 190, [0, -14], { fontWeight: 200, fill: INK }),
      shape('pill', [0, 96], 270, 56, 'transparent', { stroke: INK, strokeWidth: 1.5 }),
      text('MON — SAT', 'Outfit', 18, [6, 96], { fontWeight: 500, letterSpacing: 12, fill: INK }),
    ],
  },
  {
    id: 'combo-minimal-welcome-arch',
    label: 'Welcome',
    tags: 'welcome studio arch sign minimal modern boho',
    parts: [
      shape('arch', [0, 0], 340, 420, 'transparent', { stroke: INK, strokeWidth: 2 }),
      circle([0, -92], 16, CLAY),
      text('welcome', 'Jost', 70, [0, 20], { fontWeight: 300, letterSpacing: 1, fill: INK }),
      text('TO OUR STUDIO', 'Jost', 16, [5, 80], { fontWeight: 500, letterSpacing: 10, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-thirty-off',
    label: '30% off',
    tags: 'sale 30 percent off discount end of season minimal',
    parts: [
      text('END OF SEASON', 'Inter', 18, [-1, -142], { fontWeight: 600, letterSpacing: 14, fill: VERMILION }),
      text('30%', 'Inter', 210, [-44, -4], { fontWeight: 200, letterSpacing: -8, fill: INK }),
      text('OFF', 'Inter', 48, [207, 0], { fontWeight: 700, letterSpacing: 6, rotation: -90, fill: INK }),
      text('ONLINE & IN STORE', 'Inter', 16, [-3, 98], { fontWeight: 500, letterSpacing: 10, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-portfolio',
    label: 'Portfolio',
    tags: 'portfolio selected works designer cover minimal swiss',
    parts: [
      text('JANE COOPER', 'Inter', 16, [4, -120], { fontWeight: 600, letterSpacing: 6, textAlign: 'left', width: 528, fill: INK }),
      text('©2027', 'Inter', 16, [2, -120], { fontWeight: 500, letterSpacing: 2, textAlign: 'right', width: 528, fill: GREY }),
      text('Portfolio', 'Inter', 100, [4, -34], { fontWeight: 600, letterSpacing: -4, textAlign: 'left', width: 528, fill: INK }),
      line([0, 30], 512, INK, { weight: 1.5 }),
      text('SELECTED WORKS', 'Inter', 16, [4, 62], { fontWeight: 600, letterSpacing: 6, textAlign: 'left', width: 528, fill: INK }),
      text('2019 — 2027', 'Inter', 16, [-4, 62], { fontWeight: 500, letterSpacing: 6, textAlign: 'right', width: 528, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-quote',
    label: 'Minimal quote',
    tags: 'quote simplicity sophistication leonardo minimal modern',
    parts: [
      text('“', 'Inter', 170, [0, -40], { fontWeight: 800, fill: COBALT }),
      text('Simplicity is the\nultimate sophistication.', 'Inter', 42, [0, 20], { fontWeight: 300, lineHeight: 1.25, letterSpacing: -1, fill: INK }),
      line([0, 92], 40, COBALT, { weight: 2 }),
      text('LEONARDO DA VINCI', 'Inter', 16, [6, 120], { fontWeight: 600, letterSpacing: 12, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-link-in-bio',
    label: 'Link in bio',
    tags: 'link in bio shop the look instagram social arrow minimal',
    parts: [
      text('SHOP THE LOOK', 'Jost', 18, [7, -96], { fontWeight: 500, letterSpacing: 14, fill: CLAY }),
      text('Link in bio', 'Jost', 96, [0, -8], { fontWeight: 400, letterSpacing: -2, fill: INK }),
      circle([0, 98], 66, 'transparent', { stroke: INK, strokeWidth: 1.5 }),
      line([0, 98], 30, INK, { weight: 2, style: 'arrow', rotation: 90 }),
    ],
  },
  {
    id: 'combo-minimal-save-the-date',
    label: 'Save the date numerals',
    tags: 'save the date wedding event numbers minimal modern',
    parts: [
      text('SAVE THE DATE', 'Space Grotesk', 17, [7, -110], { fontWeight: 500, letterSpacing: 14, fill: VERMILION }),
      line([0, -76], 560, INK, { weight: 1.5 }),
      text('12.10.27', 'Space Grotesk', 130, [-1, 4], { fontWeight: 300, letterSpacing: -2, fill: INK }),
      line([0, 66], 560, INK, { weight: 1.5 }),
      text('LISBON · PORTUGAL', 'Space Grotesk', 16, [6, 100], { fontWeight: 500, letterSpacing: 12, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-chapter',
    label: 'Chapter 01',
    tags: 'chapter section 01 introduction presentation minimal',
    parts: [
      text('01', 'Inter', 30, [-230, -84], { fontWeight: 600, textAlign: 'left', width: 60, fill: COBALT }),
      line([30, -86], 460, INK, { weight: 1.5 }),
      text('Introduction', 'Inter', 86, [4, -4], { fontWeight: 300, letterSpacing: -3, textAlign: 'left', width: 528, fill: INK }),
      text('A SHORT GUIDE TO HOW WE WORK', 'Inter', 16, [4, 60], { fontWeight: 500, letterSpacing: 6, textAlign: 'left', width: 528, fill: GREY }),
    ],
  },
  {
    id: 'combo-minimal-hiring',
    label: "We're hiring",
    tags: 'we are hiring join our team careers job minimal outline',
    parts: [
      text('We’re', 'Jost', 48, [0, -92], { fontWeight: 400, fill: INK }),
      // A static face: a variable one's overlapping glyph contours show through an outline.
      text('HIRING', 'Archivo Black', 116, [2, 0], { letterSpacing: 4, fill: 'transparent', textStroke: outline(2.5, INK) }),
      rect([0, 88], 260, 46, INK, { cornerRadius: 23 }),
      text('JOIN OUR TEAM', 'Inter', 15, [3, 88], { fontWeight: 600, letterSpacing: 6, fill: '#ffffff' }),
      text('careers@yourbrand.com', 'Jost', 18, [0, 138], { fontWeight: 400, fill: GREY }),
    ],
  },
];

export default combos;
