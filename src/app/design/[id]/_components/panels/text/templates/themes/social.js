// ============================================
// FILE: panels/text/templates/themes/social.js
// PURPOSE: Text templates — Social
// ============================================

import { gradient, rect, shadow, text } from '../comboParts';

const combos = [
  {
    id: 'combo-subscribe',
    label: 'Subscribe buttons',
    tags: 'subscribe button youtube follow social cta',
    parts: [
      rect([0, -96], 350, 74, '#1e3a5f', { cornerRadius: 37 }),
      text('Subscribe', 'Poppins', 42, [0, -96], { fontWeight: 500, fill: '#ffffff' }),
      rect([0, 0], 350, 74, '#c4b5fd', { cornerRadius: 37 }),
      text('Subscribe', 'Poppins', 42, [0, 0], { fontWeight: 500, fill: '#1e1b4b' }),
      rect([0, 96], 350, 74, '#ffffff', { cornerRadius: 37, stroke: '#111827', strokeWidth: 3 }),
      text('Subscribe', 'Poppins', 42, [0, 96], { fontWeight: 700, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-now-streaming',
    label: 'Now streaming',
    tags: 'streaming video episode new podcast live',
    parts: [
      text('Now Streaming!', 'Yellowtail', 104, [0, -24], { fill: gradient(90, '#2563eb', '#06b6d4'), rotation: -6 }),
      rect([0, 92], 262, 56, '#0f172a', { cornerRadius: 28 }),
      text('NEW EPISODE', 'Russo One', 26, [0, 92], { letterSpacing: 5, fill: '#22d3ee' }),
    ],
  },
  {
    id: 'combo-follow-us',
    label: 'Follow us',
    tags: 'follow us instagram handle social',
    parts: [
      text('follow us', 'Pacifico', 104, [0, -46], { fill: '#7c3aed' }),
      rect([0, 72], 330, 64, '#ede9fe', { cornerRadius: 32 }),
      text('@yourhandle', 'Montserrat', 32, [0, 72], { fontWeight: 700, fill: '#4c1d95' }),
    ],
  },
  {
    id: 'combo-link-in-bio',
    label: 'Link in bio',
    tags: 'link in bio instagram tiktok tap',
    parts: [
      text('LINK IN BIO', 'Anton', 110, [0, -30], { lineHeight: 1, letterSpacing: 2, fill: '#111827' }),
      rect([0, 78], 250, 54, '#f43f5e', { cornerRadius: 27 }),
      text('tap the link', 'Montserrat', 26, [0, 78], { fontWeight: 700, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-new-post',
    label: 'New post alert',
    tags: 'new post alert notification social',
    parts: [
      text('NEW POST', 'Montserrat', 76, [0, 0], { fontWeight: 900, letterSpacing: 4, fill: '#111827' }),
      text('alert!', 'Yellowtail', 80, [150, 70], { fill: '#f97316', rotation: -8 }),
    ],
  },
  {
    id: 'combo-giveaway',
    label: 'Giveaway',
    tags: 'giveaway win contest prize enter',
    parts: [
      text('GIVEAWAY', 'Luckiest Guy', 120, [0, -28], { look: 'tfx-sticker-gold' }),
      text('enter to win', 'Pacifico', 52, [0, 96], { fill: '#111827' }),
    ],
  },
  {
    id: 'combo-live-now',
    label: 'Live now',
    tags: 'live now streaming broadcast',
    parts: [
      rect([-160, 0], 170, 76, '#ef4444', { cornerRadius: 14 }),
      text('● LIVE', 'Montserrat', 36, [-160, 0], { fontWeight: 900, fill: '#ffffff' }),
      text('streaming now', 'Montserrat', 40, [100, 0], { fontWeight: 300, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-swipe-for-more',
    label: 'Swipe for more',
    tags: 'swipe carousel more slide instagram',
    parts: [
      text('SWIPE', 'Bebas Neue', 170, [0, -10], { letterSpacing: 10, fill: '#0f172a' }),
      text('for more  →', 'Caveat', 58, [110, 92], { fill: '#6366f1', rotation: -6 }),
    ],
  },
  {
    id: 'combo-podcast',
    label: 'Podcast',
    tags: 'podcast episode audio show',
    parts: [
      text('THE', 'Montserrat', 28, [0, -96], { fontWeight: 800, letterSpacing: 16, fill: '#9333ea' }),
      text('PODCAST', 'Bungee', 96, [0, -12], { fill: '#111827' }),
      text('episode 24', 'Syne', 34, [0, 76], { fontWeight: 700, letterSpacing: 4, fill: '#9333ea' }),
    ],
  },
  {
    id: 'combo-like-share',
    label: 'Like & share',
    tags: 'like comment share engage cta',
    parts: [
      rect([0, 0], 560, 86, '#fde68a', { cornerRadius: 43 }),
      text('LIKE · COMMENT · SHARE', 'Montserrat', 30, [0, 0], { fontWeight: 800, letterSpacing: 3, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-this-or-that',
    label: 'This or that',
    tags: 'this or that poll vote choose',
    parts: [
      text('THIS', 'Anton', 118, [-140, 0], { lineHeight: 1, fill: '#2563eb' }),
      text('or', 'Pacifico', 64, [0, 10], { fill: '#111827' }),
      text('THAT', 'Anton', 118, [144, 0], { lineHeight: 1, fill: '#f43f5e' }),
    ],
  },
  {
    id: 'combo-how-to',
    label: 'How to',
    tags: 'how to tutorial tips guide',
    parts: [
      text('HOW TO', 'Montserrat', 34, [0, -104], { fontWeight: 900, letterSpacing: 12, fill: '#0891b2' }),
      text('edit like\na pro', 'Poppins', 80, [0, 16], { fontWeight: 800, lineHeight: 1, fill: '#111827' }),
    ],
  },
  {
    id: 'combo-coming-soon',
    label: 'Coming soon',
    tags: 'coming soon launch teaser stay tuned',
    parts: [
      text('coming soon', 'Righteous', 100, [0, -24], { look: 'tfx-neonTube-cyan' }),
      text('STAY TUNED', 'Montserrat', 24, [0, 84], { fontWeight: 700, letterSpacing: 14, fill: '#0891b2' }),
    ],
  },
  {
    id: 'combo-trending',
    label: 'Trending',
    tags: 'trending viral popular hot',
    parts: [
      text('TRENDING', 'Luckiest Guy', 118, [0, -26], { look: 'tfx-sticker-candy' }),
      text('#1 this week', 'Poppins', 34, [0, 90], { fontWeight: 700, fill: '#111827', textShadow: shadow(0, 3, 0, '#fbcfe8') }),
    ],
  },
];

export default combos;
