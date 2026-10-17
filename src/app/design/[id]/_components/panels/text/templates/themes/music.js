// ============================================
// FILE: panels/text/templates/themes/music.js
// PURPOSE: Text templates — Music & nightlife
// ============================================

import { circle, glow, gradient, line, outline, rect, ringText, shape, text } from '../comboParts';

const combos = [
  {
    id: 'combo-music-live-tonight',
    label: 'Live tonight',
    tags: 'live tonight gig concert band show music venue',
    parts: [
      text('LIVE', 'Anton', 200, [0, -34], { lineHeight: 1, fill: '#1e1b4b' }),
      circle([168, -124], 24, '#ef4444'),
      text('tonight', 'Yellowtail', 104, [46, 58], { fill: '#ec4899', rotation: -8, textStroke: outline(10, '#ffffff') }),
      text('THE BLUE ROOM  ·  DOORS 8 PM', 'Montserrat', 17, [4, 150], { fontWeight: 700, letterSpacing: 8, fill: '#1e1b4b' }),
    ],
  },
  {
    id: 'combo-music-now-playing',
    label: 'Now playing',
    tags: 'now playing song track player spotify music stream',
    parts: [
      rect([0, 0], 560, 300, '#16161d', { cornerRadius: 28 }),
      text('NOW PLAYING', 'Montserrat', 15, [4, -100], { fontWeight: 700, letterSpacing: 8, fill: '#a3e635' }),
      text('Midnight Drive', 'Outfit', 52, [0, -40], { fontWeight: 700, fill: '#fafafa' }),
      text('The Velvet Hours', 'Inter', 24, [0, 16], { fill: '#a1a1aa' }),
      rect([0, 74], 440, 6, '#3f3f46', { cornerRadius: 3 }),
      rect([-130, 74], 180, 6, '#a3e635', { cornerRadius: 3 }),
      circle([-40, 74], 18, '#a3e635'),
      text('1:24', 'Inter', 15, [-202, 104], { fontWeight: 500, fill: '#71717a' }),
      text('3:52', 'Inter', 15, [202, 104], { fontWeight: 500, fill: '#71717a' }),
    ],
  },
  {
    id: 'combo-music-new-single',
    label: 'New single',
    tags: 'new single song release vinyl record out friday music',
    parts: [
      circle([-150, 0], 280, '#111111'),
      circle([-150, 0], 214, 'transparent', { stroke: '#2f2f2f', strokeWidth: 2 }),
      circle([-150, 0], 100, '#f97316'),
      circle([-150, 0], 12, '#111111'),
      text('NEW SINGLE', 'Montserrat', 16, [180, -122], { fontWeight: 800, letterSpacing: 8, fill: '#f97316', width: 300, textAlign: 'left' }),
      text('Golden\nHour', 'Anton', 92, [180, -2], { lineHeight: 0.95, fill: '#111111', width: 300, textAlign: 'left' }),
      text('OUT FRIDAY\nON ALL PLATFORMS', 'Montserrat', 12, [180, 116], { fontWeight: 700, letterSpacing: 4, lineHeight: 1.6, fill: '#6b7280', width: 300, textAlign: 'left' }),
    ],
  },
  {
    id: 'combo-music-album-out-now',
    label: 'Album out now',
    tags: 'album out now new record release music vinyl',
    parts: [
      text('THE NEW ALBUM', 'Montserrat', 18, [6, -172], { fontWeight: 700, letterSpacing: 12, fill: '#6d28d9' }),
      text('NEON\nDREAMS', 'Bebas Neue', 150, [0, -16], { lineHeight: 0.88, fill: gradient(180, '#8b5cf6', '#db2777') }),
      shape('starburst', [212, -82], 126, 126, '#d9f99d', { rotation: 12 }),
      text('OUT\nNOW', 'Anton', 32, [213, -76], { lineHeight: 0.95, fill: '#1f1147', rotation: 12 }),
      text('STREAMING EVERYWHERE', 'Montserrat', 15, [4, 146], { fontWeight: 700, letterSpacing: 8, fill: '#1f1147' }),
    ],
  },
  {
    id: 'combo-music-dj-set',
    label: 'DJ set',
    tags: 'dj set club night party dance music equaliser',
    parts: [
      rect([0, 0], 580, 320, '#0b0b12', { cornerRadius: 24 }),
      rect([-44, -96], 12, 34, '#22d3ee', { cornerRadius: 6 }),
      rect([-22, -106], 12, 54, '#22d3ee', { cornerRadius: 6 }),
      rect([0, -113], 12, 68, '#a3e635', { cornerRadius: 6 }),
      rect([22, -101], 12, 44, '#22d3ee', { cornerRadius: 6 }),
      rect([44, -91], 12, 24, '#22d3ee', { cornerRadius: 6 }),
      text('DJ NOVA', 'Big Shoulders Display', 116, [0, 4], { fontWeight: 900, letterSpacing: 4, fill: '#ffffff' }),
      text('LIVE SET  ·  SAT 11 PM — 4 AM', 'Montserrat', 15, [3, 104], { fontWeight: 700, letterSpacing: 6, fill: '#a3e635' }),
    ],
  },
  {
    id: 'combo-music-open-mic',
    label: 'Open mic night',
    tags: 'open mic night comedy poetry songs stage badge',
    parts: [
      circle([0, 0], 360, '#1c1917'),
      circle([0, 0], 330, 'transparent', { stroke: '#fbbf24', strokeWidth: 2 }),
      ringText('SONGS · POETRY · COMEDY', 'Montserrat', 17, [0, 0], 140, 'top', { fontWeight: 800, letterSpacing: 5, fill: '#fbbf24' }),
      ringText('EVERY THURSDAY · 8 PM', 'Montserrat', 15, [0, 0], 142, 'bottom', { fontWeight: 700, letterSpacing: 5, fill: '#fbbf24' }),
      text('OPEN\nMIC', 'Anton', 80, [0, -4], { lineHeight: 0.95, letterSpacing: 4, fill: '#fafaf9' }),
      shape('sparkle', [-104, -4], 22, 22, '#fbbf24'),
      shape('sparkle', [104, -4], 22, 22, '#fbbf24'),
    ],
  },
  {
    id: 'combo-music-tour-2027',
    label: 'Tour 2027',
    tags: 'tour 2027 world tour band concert dates cities',
    parts: [
      text('THE MIDNIGHT', 'Montserrat', 20, [7, -150], { fontWeight: 800, letterSpacing: 14, fill: '#111827' }),
      text('ON TOUR', 'Anton', 160, [0, -22], { lineHeight: 1, fill: '#111827' }),
      rect([0, 78], 190, 50, '#e11d48', { cornerRadius: 25 }),
      text('2027', 'Anton', 32, [5, 84], { letterSpacing: 10, fill: '#ffffff' }),
      text('LONDON · PARIS · BERLIN · NEW YORK', 'Montserrat', 14, [3, 140], { fontWeight: 700, letterSpacing: 5, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-music-playlist',
    label: 'Playlist',
    tags: 'playlist mix songs chill late night drive music cover',
    parts: [
      rect([-180, 0], 190, 190, gradient(135, '#6366f1', '#ec4899'), { cornerRadius: 22 }),
      circle([-180, 0], 64, '#ffffff'),
      shape('triangle', [-176, 0], 24, 22, '#6366f1', { rotation: 90 }),
      text('PLAYLIST', 'Montserrat', 14, [125, -82], { fontWeight: 700, letterSpacing: 8, fill: '#6366f1', width: 360, textAlign: 'left' }),
      text('Late Night\nDrive', 'Poppins', 46, [125, -10], { fontWeight: 800, lineHeight: 1.05, fill: '#111827', width: 360, textAlign: 'left' }),
      text('24 songs · 1 hr 32 min', 'Inter', 17, [125, 68], { fontWeight: 500, fill: '#6b7280', width: 360, textAlign: 'left' }),
    ],
  },
  {
    id: 'combo-music-friday-night',
    label: 'Friday night',
    tags: 'friday night neon club drinks dancing party weekend',
    parts: [
      rect([0, 0], 560, 320, '#120c1f', { cornerRadius: 24 }),
      text('Friday', 'Yellowtail', 118, [0, -46], { fill: '#ffe4f6', textShadow: glow(20, '#ff3dc8') }),
      text('NIGHT', 'Bebas Neue', 72, [13, 58], { letterSpacing: 26, fill: '#e0f7ff', textShadow: glow(14, '#22d3ee') }),
      text('DRINKS · MUSIC · DANCING', 'Montserrat', 13, [3, 118], { fontWeight: 600, letterSpacing: 6, fill: '#a78bfa' }),
    ],
  },
  {
    id: 'combo-music-sold-out',
    label: 'Sold out',
    tags: 'sold out ticket concert show gig stamp thank you',
    parts: [
      rect([0, 0], 580, 260, '#fef3c7', { cornerRadius: 18 }),
      line([160, 0], 220, '#d6b56d', { weight: 2, style: 'dashed', rotation: 90 }),
      text('ADMIT ONE', 'Montserrat', 14, [225, 0], { fontWeight: 800, letterSpacing: 8, fill: '#92400e', rotation: -90 }),
      text('THE MIDNIGHT · O2 ARENA', 'Montserrat', 13, [-62, -92], { fontWeight: 800, letterSpacing: 5, fill: '#92400e' }),
      rect([-62, -4], 320, 110, 'transparent', { cornerRadius: 12, stroke: '#dc2626', strokeWidth: 5, rotation: -7 }),
      text('SOLD OUT', 'Anton', 80, [-62, -4], { letterSpacing: 4, fill: '#dc2626', rotation: -7 }),
      text('JUNE 14 & 15 · THANK YOU!', 'Montserrat', 13, [-62, 92], { fontWeight: 700, letterSpacing: 5, fill: '#92400e' }),
    ],
  },
  {
    id: 'combo-music-summer-fest',
    label: 'Summer fest',
    tags: 'summer festival fest lineup music outdoor poster',
    parts: [
      text('AUG 8 — 10 · RIVERSIDE PARK', 'Montserrat', 15, [4, -198], { fontWeight: 700, letterSpacing: 8, fill: '#0f766e' }),
      text('SUMMER\nFEST', 'Anton', 128, [0, -42], { lineHeight: 0.92, letterSpacing: 2, fill: gradient(180, '#f97316', '#e11d48') }),
      text('NOVA · THE LUMEN · KAI ROSE', 'Oswald', 30, [0, 104], { fontWeight: 600, fill: '#1f2937' }),
      text('SOLENNE · MIRA · DUSK CLUB · +20 MORE', 'Oswald', 17, [1, 146], { letterSpacing: 3, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-music-jazz-night',
    label: 'Jazz night',
    tags: 'jazz night evening live music lounge elegant bar',
    parts: [
      shape('arch', [0, 0], 320, 420, '#1e2a44'),
      shape('arch', [0, 6], 290, 388, 'transparent', { stroke: '#d4af6a', strokeWidth: 1.5 }),
      text('an evening of', 'Cormorant Garamond', 28, [0, -86], { fontStyle: 'italic', fontWeight: 500, fill: '#e8cf9a' }),
      text('Jazz', 'Playfair Display', 120, [0, -8], { fontStyle: 'italic', fontWeight: 800, fill: '#e8cf9a' }),
      line([0, 70], 60, '#d4af6a', { weight: 1.5 }),
      text('FRIDAY · 9 PM', 'Montserrat', 14, [4, 104], { fontWeight: 600, letterSpacing: 8, fill: '#e8cf9a' }),
      text('THE BLUE LANTERN', 'Montserrat', 11, [3, 132], { fontWeight: 500, letterSpacing: 6, fill: '#a3a9b8' }),
    ],
  },
  {
    id: 'combo-music-karaoke',
    label: 'Karaoke night',
    tags: 'karaoke night sing songs bar party mic',
    parts: [
      shape('speech-bubble-oval', [196, -124], 184, 124, '#fde047'),
      text('sing it!', 'Chewy', 30, [196, -140], { fill: '#1e1b4b' }),
      text('KARAOKE', 'Monoton', 84, [0, 0], { fill: gradient(90, '#ec4899', '#8b5cf6') }),
      text('EVERY WEDNESDAY · 9 PM · FREE ENTRY', 'Montserrat', 13, [3, 74], { fontWeight: 700, letterSpacing: 5, fill: '#1e1b4b' }),
    ],
  },
  {
    id: 'combo-music-vip',
    label: 'VIP guest list',
    tags: 'vip guest list club access table luxury gold nightlife',
    parts: [
      rect([0, 0], 520, 280, '#0c0a09', { cornerRadius: 22 }),
      rect([0, 0], 490, 250, 'transparent', { cornerRadius: 14, stroke: '#c9a45c', strokeWidth: 1.5 }),
      text('GUEST LIST', 'Montserrat', 14, [6, -84], { fontWeight: 600, letterSpacing: 12, fill: '#c9a45c' }),
      text('VIP', 'Bodoni Moda', 124, [3, 22], { fontWeight: 700, letterSpacing: 6, fill: gradient(180, '#f5deb3', '#b8893b') }),
      text('ALL ACCESS · TABLE 07', 'Montserrat', 13, [4, 80], { fontWeight: 600, letterSpacing: 8, fill: '#c9a45c' }),
    ],
  },
  {
    id: 'combo-music-acoustic',
    label: 'Acoustic sessions',
    tags: 'acoustic sessions unplugged live music guitar cafe',
    parts: [
      text('acoustic', 'Sacramento', 124, [0, -40], { fill: '#b45309' }),
      text('SESSIONS', 'Josefin Sans', 30, [11, 48], { fontWeight: 600, letterSpacing: 22, fill: '#292524' }),
      line([-128, 110], 100, '#292524', { weight: 1.5 }),
      text('VOL. 04', 'Josefin Sans', 14, [4, 110], { fontWeight: 600, letterSpacing: 8, fill: '#292524' }),
      line([128, 110], 100, '#292524', { weight: 1.5 }),
    ],
  },
];

export default combos;
