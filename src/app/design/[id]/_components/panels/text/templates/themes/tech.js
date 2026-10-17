// ============================================
// FILE: panels/text/templates/themes/tech.js
// PURPOSE: Text templates — Tech & startup
// ============================================

import { circle, gradient, outline, rect, shape, text } from '../comboParts';

// Ink and slate for type, one violet → indigo → cyan "aurora" for heroes and
// buttons, mint only where something is live or shipped.
const INK = '#0f172a';
const SLATE = '#64748b';
const VIOLET = '#7c3aed';
const INDIGO = '#4f46e5';
const CYAN = '#06b6d4';
const MINT = '#10b981';
const MINT_DEEP = '#059669';
const AURORA = gradient(90, '#7c3aed', '#4f46e5', '#06b6d4');
const AURORA_DIAG = gradient(135, '#8b5cf6', '#4f46e5', '#06b6d4');

const combos = [
  {
    id: 'combo-tech-launching-soon',
    label: 'Launching soon',
    tags: 'launching soon launch startup app product coming soon rocket',
    parts: [
      text('LAUNCHING', 'Space Mono', 24, [-33, -104], { fontWeight: 700, letterSpacing: 14, fill: INDIGO }),
      text('soon', 'Sora', 180, [-40, -6], { fontWeight: 700, letterSpacing: -6, fill: AURORA }),
      shape('rocket', [244, -96], 54, 90, AURORA_DIAG, { rotation: 40 }),
      text('Q4 2027  ·  yourapp.io', 'JetBrains Mono', 20, [-40, 108], { fontWeight: 500, fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-version-2',
    label: 'Version 2.0',
    tags: 'version 2.0 release update new app product',
    parts: [
      text('VERSION', 'Space Mono', 20, [-70, -136], { fontWeight: 700, letterSpacing: 12, fill: VIOLET }),
      text('2.0', 'Outfit', 230, [-76, 4], { fontWeight: 800, letterSpacing: -8, fill: INK }),
      rect([186, -66], 140, 52, AURORA, { cornerRadius: 26, rotation: -10 }),
      text('NEW', 'Space Grotesk', 22, [189, -66], { fontWeight: 700, letterSpacing: 6, fill: '#ffffff', rotation: -10 }),
      text('Faster. Smarter. Yours.', 'Space Grotesk', 26, [-20, 124], { fontWeight: 500, fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-ai-powered',
    label: 'AI powered',
    tags: 'ai powered artificial intelligence smart sparkle tech',
    parts: [
      text('AI', 'Sora', 220, [-150, 4], { fontWeight: 800, letterSpacing: -6, fill: AURORA_DIAG }),
      shape('sparkle', [-4, -110], 46, 46, VIOLET),
      shape('sparkle', [34, -78], 22, 22, CYAN),
      text('POWERED', 'Space Grotesk', 58, [150, -14], { fontWeight: 700, letterSpacing: 2, width: 300, textAlign: 'left', fill: INK }),
      text('SMARTER EVERY DAY', 'Space Mono', 15, [150, 40], { fontWeight: 700, letterSpacing: 5, width: 300, textAlign: 'left', fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-join-waitlist',
    label: 'Join the waitlist',
    tags: 'join waitlist sign up early access email startup beta',
    parts: [
      text('Join the waitlist', 'Space Grotesk', 70, [0, -78], { fontWeight: 700, letterSpacing: -1, fill: INK }),
      rect([0, 30], 520, 76, '#ffffff', { cornerRadius: 38, stroke: '#e2e8f0', strokeWidth: 2 }),
      text('you@company.com', 'Inter', 22, [-143, 30], { fill: '#94a3b8' }),
      rect([150, 30], 190, 56, gradient(90, VIOLET, INDIGO), { cornerRadius: 28 }),
      text('Join now  →', 'Inter', 22, [150, 30], { fontWeight: 700, fill: '#ffffff' }),
      text('2,400+ BUILDERS ALREADY IN', 'JetBrains Mono', 15, [2, 112], { fontWeight: 600, letterSpacing: 4, fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-beta',
    label: 'Public beta',
    tags: 'beta public beta early access invite only pill label',
    parts: [
      text('Public', 'Space Grotesk', 106, [-126, -4], { fontWeight: 300, fill: INK }),
      rect([180, 0], 230, 108, AURORA, { cornerRadius: 54 }),
      text('BETA', 'Space Grotesk', 54, [182, 6], { fontWeight: 700, letterSpacing: 4, fill: '#ffffff' }),
      text('EARLY ACCESS  ·  INVITE ONLY', 'JetBrains Mono', 16, [2, 104], { fontWeight: 600, letterSpacing: 5, fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-now-live',
    label: 'Now live',
    tags: 'now live launch available app store web ios android live',
    parts: [
      rect([0, -110], 150, 46, INK, { cornerRadius: 23 }),
      circle([-40, -110], 28, 'transparent', { stroke: MINT, strokeWidth: 2, opacity: 0.5 }),
      circle([-40, -110], 12, MINT),
      text('LIVE', 'Space Mono', 19, [22, -110], { fontWeight: 700, letterSpacing: 6, fill: '#ffffff' }),
      text('Now', 'Sora', 128, [-138, 8], { fontWeight: 700, letterSpacing: -3, fill: INK }),
      text('live', 'Sora', 128, [162, 8], { fontWeight: 700, letterSpacing: -3, fill: AURORA }),
      text('on web, iOS & Android', 'Inter', 26, [0, 110], { fontWeight: 500, fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-product-update',
    label: 'Product update',
    tags: 'product update feature release dark mode announcement card',
    parts: [
      rect([0, 0], 580, 320, gradient(135, '#4338ca', '#7c3aed'), { cornerRadius: 28 }),
      shape('sparkle', [214, -90], 44, 44, '#ffffff', { opacity: 0.9 }),
      shape('sparkle', [178, -56], 20, 20, '#c4b5fd'),
      text('PRODUCT UPDATE', 'JetBrains Mono', 15, [0, -106], { fontWeight: 700, letterSpacing: 5, width: 500, textAlign: 'left', fill: '#c7d2fe' }),
      text('Dark mode\nis here.', 'Sora', 66, [0, -10], {
        fontWeight: 700,
        lineHeight: 1.02,
        letterSpacing: -2,
        width: 500,
        textAlign: 'left',
        fill: '#ffffff',
      }),
      text('Read the changelog  →', 'Inter', 20, [0, 110], { fontWeight: 600, width: 500, textAlign: 'left', fill: '#e0e7ff' }),
    ],
  },
  {
    id: 'combo-tech-changelog',
    label: 'Changelog',
    tags: 'changelog release notes code editor developer version markdown',
    parts: [
      rect([0, 0], 580, 300, '#0d1117', { cornerRadius: 18 }),
      circle([-256, -122], 13, '#3d444d'),
      circle([-234, -122], 13, '#3d444d'),
      circle([-212, -122], 13, '#3d444d'),
      text('CHANGELOG.md', 'JetBrains Mono', 14, [0, -122], { fontWeight: 500, fill: '#7d8590' }),
      text('## v2.4.0', 'JetBrains Mono', 34, [0, -62], { fontWeight: 800, width: 520, textAlign: 'left', fill: '#67e8f9' }),
      text('+ Dark mode everywhere\n+ Sync is 2× faster\n− Legacy API retired', 'JetBrains Mono', 22, [0, 44], {
        fontWeight: 500,
        lineHeight: 1.65,
        width: 520,
        textAlign: 'left',
        fill: '#e6edf3',
      }),
    ],
  },
  {
    id: 'combo-tech-hackathon',
    label: 'Hackathon',
    tags: 'hackathon code 48 hours prizes developers event',
    parts: [
      text('{ 48 HOURS }', 'JetBrains Mono', 22, [2, -104], { fontWeight: 700, letterSpacing: 4, fill: VIOLET }),
      text('HACKATHON', 'Big Shoulders Display', 116, [1, -10], { fontWeight: 900, letterSpacing: 2, fill: AURORA }),
      rect([0, 88], 440, 52, INK, { cornerRadius: 26 }),
      text('OCT 18–20  ·  $10K IN PRIZES', 'JetBrains Mono', 16, [2, 88], { fontWeight: 700, letterSpacing: 3, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-tech-ship-it',
    label: 'Ship it',
    tags: 'ship it deploy release git push developer terminal',
    parts: [
      text('$ git push origin main', 'JetBrains Mono', 22, [0, -116], { fontWeight: 500, fill: SLATE }),
      text('Ship it', 'Sora', 160, [-16, 0], { fontWeight: 800, letterSpacing: -5, fill: INK }),
      circle([244, 32], 32, CYAN),
      text('v3.1 DEPLOYED TO PRODUCTION', 'Space Mono', 15, [2, 104], { fontWeight: 700, letterSpacing: 4, fill: MINT_DEEP }),
    ],
  },
  {
    id: 'combo-tech-dev-day',
    label: 'Dev day',
    tags: 'dev day developer conference event talks san francisco',
    parts: [
      text('THE BUILDERS’ CONFERENCE', 'Space Grotesk', 17, [4, -76], { fontWeight: 500, letterSpacing: 8, fill: SLATE }),
      text('DEV DAY', 'Syne', 76, [5, 5], { fontWeight: 800, fill: 'transparent', textStroke: outline(1.6, VIOLET) }),
      text('DEV DAY', 'Syne', 76, [0, 0], { fontWeight: 800, fill: INK }),
      rect([0, 70], 400, 46, 'transparent', { cornerRadius: 23, stroke: VIOLET, strokeWidth: 1.5 }),
      text('NOV 14  ·  SAN FRANCISCO', 'Space Mono', 16, [2, 70], { fontWeight: 700, letterSpacing: 4, fill: VIOLET }),
    ],
  },
  {
    id: 'combo-tech-new-feature',
    label: "What's new",
    tags: 'whats new new feature notification toast release app update',
    parts: [
      text("What's new", 'Sora', 72, [0, -92], { fontWeight: 700, letterSpacing: -2, fill: INK }),
      rect([0, 38], 540, 132, '#ffffff', { cornerRadius: 26, stroke: '#e2e8f0', strokeWidth: 1.5 }),
      rect([-196, 38], 80, 80, AURORA_DIAG, { cornerRadius: 22 }),
      shape('sparkle', [-196, 38], 40, 40, '#ffffff'),
      text('NEW FEATURE', 'JetBrains Mono', 14, [60, 4], { fontWeight: 700, letterSpacing: 4, width: 400, textAlign: 'left', fill: VIOLET }),
      text('Smart replies are live', 'Inter', 28, [60, 36], { fontWeight: 700, width: 400, textAlign: 'left', fill: INK }),
      text('Draft answers in one tap.', 'Inter', 19, [60, 70], { width: 400, textAlign: 'left', fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-countdown',
    label: 'Demo day countdown',
    tags: 'countdown timer demo day launch days hours minutes',
    parts: [
      text('DEMO DAY STARTS IN', 'Space Mono', 17, [4, -104], { fontWeight: 700, letterSpacing: 6, fill: VIOLET }),
      rect([-180, -6], 150, 124, INK, { cornerRadius: 20 }),
      rect([0, -6], 150, 124, INK, { cornerRadius: 20 }),
      rect([180, -6], 150, 124, INK, { cornerRadius: 20 }),
      text('02', 'JetBrains Mono', 72, [-180, 5], { fontWeight: 700, fill: '#ffffff' }),
      text('14', 'JetBrains Mono', 72, [0, 5], { fontWeight: 700, fill: '#ffffff' }),
      text('36', 'JetBrains Mono', 72, [180, 5], { fontWeight: 700, fill: '#ffffff' }),
      text('DAYS', 'IBM Plex Mono', 14, [-178, 82], { fontWeight: 700, letterSpacing: 5, fill: SLATE }),
      text('HOURS', 'IBM Plex Mono', 14, [2, 82], { fontWeight: 700, letterSpacing: 5, fill: SLATE }),
      text('MINUTES', 'IBM Plex Mono', 14, [182, 82], { fontWeight: 700, letterSpacing: 5, fill: SLATE }),
    ],
  },
  {
    id: 'combo-tech-free-trial',
    label: 'Free trial',
    tags: 'free trial 14 days saas sign up no credit card start',
    parts: [
      text('14', 'Sora', 220, [-154, 0], { fontWeight: 800, letterSpacing: -4, fill: AURORA_DIAG }),
      text('DAYS FREE', 'Space Grotesk', 48, [150, -56], { fontWeight: 700, letterSpacing: 1, width: 320, textAlign: 'left', fill: INK }),
      text('No credit card needed.', 'Inter', 21, [150, -8], { fontWeight: 500, width: 320, textAlign: 'left', fill: SLATE }),
      rect([66, 52], 152, 50, INK, { cornerRadius: 25 }),
      text('Start free  →', 'Inter', 18, [66, 52], { fontWeight: 700, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-tech-were-hiring',
    label: "We're hiring",
    tags: 'we are hiring jobs careers engineers designers remote startup chat',
    parts: [
      shape('speech-bubble-tail-right', [0, -30], 520, 230, INK),
      text('psst…', 'JetBrains Mono', 22, [0, -104], { fontWeight: 500, fill: '#a5b4fc' }),
      text("we're hiring", 'Sora', 76, [0, -34], { fontWeight: 700, letterSpacing: -2, fill: '#ffffff' }),
      text('ENGINEERS  ·  DESIGNERS  ·  REMOTE', 'Space Mono', 15, [2, 124], { fontWeight: 700, letterSpacing: 4, fill: SLATE }),
    ],
  },
];

export default combos;
