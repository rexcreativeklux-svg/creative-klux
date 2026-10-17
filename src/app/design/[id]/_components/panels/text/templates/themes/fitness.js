// ============================================
// FILE: panels/text/templates/themes/fitness.js
// PURPOSE: Text templates — Fitness & health
// ============================================

import { circle, gradient, line, rect, ringText, shape, text } from '../comboParts';

const combos = [
  {
    id: 'combo-fitness-train-hard',
    label: 'Train hard',
    tags: 'train hard gym workout motivation strength',
    parts: [
      text('TRAIN', 'Anton', 170, [-24, -62], { lineHeight: 1, fill: '#111827' }),
      text('HARD', 'Anton', 170, [-24, 100], { lineHeight: 1, fill: '#ff4d1f' }),
      text('EST. 2027 · IRON HOUSE', 'Montserrat', 12, [196, 18], { fontWeight: 700, letterSpacing: 5, fill: '#6b7280', rotation: -90 }),
    ],
  },
  {
    id: 'combo-fitness-yoga-class',
    label: 'Yoga class',
    tags: 'yoga class morning flow calm wellness studio stretch',
    parts: [
      shape('semicircle', [0, -40], 360, 180, '#e9dcc9'),
      line([0, 50], 440, '#3f5e4a', { weight: 1.5 }),
      text('Yoga', 'DM Serif Display', 130, [0, -6], { fill: '#3f5e4a' }),
      text('BEGINNER CLASS', 'Montserrat', 18, [8, 92], { fontWeight: 600, letterSpacing: 16, fill: '#3f5e4a' }),
      text('MON · WED · FRI — 7 AM', 'Montserrat', 13, [3, 126], { fontWeight: 500, letterSpacing: 6, fill: '#7c8b7e' }),
    ],
  },
  {
    id: 'combo-fitness-30-day',
    label: '30 day challenge',
    tags: '30 day challenge fitness program transformation habit',
    parts: [
      text('30', 'Anton', 240, [-140, 10], { lineHeight: 1, fill: '#111827' }),
      text('DAY', 'Anton', 104, [150, -64], { lineHeight: 1, fill: '#ff4d1f', width: 280, textAlign: 'left' }),
      text('CHALLENGE', 'Anton', 52, [150, 20], { lineHeight: 1, letterSpacing: 3, fill: '#111827', width: 280, textAlign: 'left' }),
      text('STARTS MONDAY, JAN 5', 'Montserrat', 12, [150, 66], { fontWeight: 700, letterSpacing: 3, fill: '#6b7280', width: 280, textAlign: 'left' }),
    ],
  },
  {
    id: 'combo-fitness-new-pr',
    label: 'New PR',
    tags: 'new pr personal record best deadlift lift gym achievement',
    parts: [
      rect([0, -118], 150, 42, '#ff4d1f', { cornerRadius: 21 }),
      text('NEW PR', 'Montserrat', 17, [3, -116], { fontWeight: 800, letterSpacing: 6, fill: '#ffffff' }),
      shape('sparkle', [238, -70], 36, 36, '#ff4d1f'),
      shape('sparkle', [264, -34], 18, 18, '#ff4d1f'),
      text('225 LB', 'Big Shoulders Display', 170, [0, 10], { fontWeight: 900, fill: '#111827' }),
      text('DEADLIFT · 12 WEEKS IN', 'Montserrat', 15, [4, 100], { fontWeight: 700, letterSpacing: 8, fill: '#374151' }),
    ],
  },
  {
    id: 'combo-fitness-rest-day',
    label: 'Rest day',
    tags: 'rest day recover recharge relax self care',
    parts: [
      shape('blob-3', [0, 0], 440, 330, '#ece8f8'),
      text('rest', 'Satisfy', 120, [0, -34], { fill: '#6d5bd0' }),
      text('DAY', 'Montserrat', 26, [10, 44], { fontWeight: 700, letterSpacing: 20, fill: '#2e2a4a' }),
      text('RECOVER · RECHARGE · REPEAT', 'Montserrat', 12, [3, 92], { fontWeight: 600, letterSpacing: 5, fill: '#6b6891' }),
    ],
  },
  {
    id: 'combo-fitness-open-24-7',
    label: 'Gym open 24/7',
    tags: 'gym open 24/7 24 hours always open membership',
    parts: [
      rect([0, 0], 560, 300, '#111827', { cornerRadius: 22 }),
      circle([-72, -106], 12, '#c6f432'),
      text('OPEN', 'Montserrat', 18, [14, -104], { fontWeight: 800, letterSpacing: 16, fill: '#c6f432' }),
      text('24/7', 'Big Shoulders Display', 170, [0, 6], { fontWeight: 900, fill: '#ffffff' }),
      text('IRON HOUSE GYM · MEMBERS ONLY', 'Montserrat', 13, [3, 116], { fontWeight: 600, letterSpacing: 5, fill: '#9ca3af' }),
    ],
  },
  {
    id: 'combo-fitness-hiit',
    label: 'HIIT',
    tags: 'hiit high intensity interval training class cardio',
    parts: [
      text('HIIT', 'Anton', 210, [0, -24], { lineHeight: 1, fill: gradient(90, '#ff4d1f', '#e11d48') }),
      text('HIGH INTENSITY INTERVAL TRAINING', 'Montserrat', 14, [3, 64], { fontWeight: 700, letterSpacing: 6, fill: '#111827' }),
      line([0, 98], 440, '#e5e7eb', { weight: 1.5 }),
      text('45 MIN  ·  600 KCAL  ·  ALL LEVELS', 'Oswald', 24, [2, 132], { fontWeight: 500, letterSpacing: 3, fill: '#ff4d1f' }),
    ],
  },
  {
    id: 'combo-fitness-personal-trainer',
    label: 'Personal trainer',
    tags: 'personal trainer coach pt book session fitness',
    parts: [
      rect([-262, 4], 10, 268, '#ff4d1f', { cornerRadius: 5 }),
      text('PERSONAL', 'Montserrat', 20, [30, -108], { fontWeight: 800, letterSpacing: 14, fill: '#111827', width: 520, textAlign: 'left' }),
      text('TRAINER', 'Anton', 124, [30, -8], { lineHeight: 1, fill: '#111827', width: 520, textAlign: 'left' }),
      text('with Coach Maya', 'Kaushan Script', 44, [30, 74], { fill: '#ff4d1f', width: 520, textAlign: 'left' }),
      text('BOOK A FREE SESSION · @COACHMAYA', 'Montserrat', 13, [30, 126], { fontWeight: 700, letterSpacing: 5, fill: '#6b7280', width: 520, textAlign: 'left' }),
    ],
  },
  {
    id: 'combo-fitness-healthy-habits',
    label: 'Healthy habits',
    tags: 'healthy habits checklist water sleep move wellness routine',
    parts: [
      text('HEALTHY HABITS', 'Oswald', 54, [2, -118], { fontWeight: 700, letterSpacing: 3, fill: '#1f3b2d' }),
      line([0, -72], 56, '#22a06b', { weight: 3 }),
      circle([-170, -24], 34, '#22a06b'),
      text('1', 'Montserrat', 15, [-170, -23], { fontWeight: 800, fill: '#ffffff' }),
      text('Drink 2 litres of water', 'Inter', 24, [52, -24], { fontWeight: 500, fill: '#1f2937', width: 380, textAlign: 'left' }),
      circle([-170, 30], 34, '#22a06b'),
      text('2', 'Montserrat', 15, [-170, 31], { fontWeight: 800, fill: '#ffffff' }),
      text('Move for 30 minutes', 'Inter', 24, [52, 30], { fontWeight: 500, fill: '#1f2937', width: 380, textAlign: 'left' }),
      circle([-170, 84], 34, '#22a06b'),
      text('3', 'Montserrat', 15, [-170, 85], { fontWeight: 800, fill: '#ffffff' }),
      text('Sleep 8 hours a night', 'Inter', 24, [52, 84], { fontWeight: 500, fill: '#1f2937', width: 380, textAlign: 'left' }),
    ],
  },
  {
    id: 'combo-fitness-mind-body-soul',
    label: 'Mind · body · soul',
    tags: 'mind body soul wellness retreat balance yoga meditation',
    parts: [
      circle([0, 0], 330, 'transparent', { stroke: '#8a9a7b', strokeWidth: 2 }),
      shape('sparkle', [0, -165], 26, 26, '#8a9a7b'),
      text('MIND\nBODY\nSOUL', 'Marcellus', 40, [10, -4], { letterSpacing: 20, lineHeight: 1.5, fill: '#3f4f3a' }),
      ringText('WELLNESS RETREAT · 2027', 'Montserrat', 11, [0, 0], 148, 'bottom', { fontWeight: 600, letterSpacing: 5, fill: '#8a9a7b' }),
    ],
  },
  {
    id: 'combo-fitness-run-club',
    label: 'Run club',
    tags: 'run club running 5k jog group saturday',
    parts: [
      line([-270, -32], 40, '#2563eb', { weight: 5 }),
      line([-285, -8], 70, '#2563eb', { weight: 5 }),
      line([-270, 16], 40, '#2563eb', { weight: 5 }),
      text('ALL PACES WELCOME', 'Montserrat', 13, [24, -96], { fontWeight: 700, letterSpacing: 8, fill: '#6b7280' }),
      text('RUN CLUB', 'Big Shoulders Display', 140, [20, 8], { fontWeight: 900, fill: '#2563eb' }),
      rect([20, 96], 300, 48, '#2563eb', { cornerRadius: 24 }),
      text('SAT · 7 AM · 5K', 'Montserrat', 17, [23, 98], { fontWeight: 800, letterSpacing: 6, fill: '#ffffff' }),
    ],
  },
  {
    id: 'combo-fitness-no-excuses',
    label: 'No excuses',
    tags: 'no excuses results motivation gym start today',
    parts: [
      text('EXCUSES', 'Anton', 96, [0, -80], { lineHeight: 1, letterSpacing: 2, fill: '#9ca3af' }),
      line([0, -96], 360, '#e11d48', { weight: 8, rotation: -4 }),
      text('RESULTS', 'Anton', 150, [0, 60], { lineHeight: 1, fill: '#111827' }),
      text('NO EXCUSES · START TODAY', 'Montserrat', 14, [4, 140], { fontWeight: 700, letterSpacing: 8, fill: '#e11d48' }),
    ],
  },
  {
    id: 'combo-fitness-stronger',
    label: 'Stronger every day',
    tags: 'stronger every day motivation strength progress',
    parts: [
      text('stronger', 'Kaushan Script', 118, [0, -66], { fill: '#ff4d1f', rotation: -6 }),
      text('EVERY DAY', 'Anton', 96, [0, 56], { lineHeight: 1, letterSpacing: 6, fill: '#111827' }),
      text('5 AM CLUB · @IRONHOUSE', 'Montserrat', 13, [4, 124], { fontWeight: 700, letterSpacing: 7, fill: '#6b7280' }),
    ],
  },
  {
    id: 'combo-fitness-spin-class',
    label: 'Spin class',
    tags: 'spin class cycling bike ride cardio badge',
    parts: [
      circle([0, 0], 340, '#111827'),
      circle([0, 0], 306, 'transparent', { stroke: '#c6f432', strokeWidth: 2 }),
      ringText('RIDE · SWEAT · REPEAT', 'Montserrat', 17, [0, 0], 132, 'top', { fontWeight: 800, letterSpacing: 6, fill: '#c6f432' }),
      ringText('TUE & THU · 6 AM', 'Montserrat', 14, [0, 0], 134, 'bottom', { fontWeight: 700, letterSpacing: 6, fill: '#e5e7eb' }),
      text('SPIN', 'Big Shoulders Display', 110, [2, -2], { fontWeight: 900, letterSpacing: 4, fill: '#ffffff' }),
      text('CLASS', 'Montserrat', 16, [8, 50], { fontWeight: 700, letterSpacing: 14, fill: '#c6f432' }),
    ],
  },
  {
    id: 'combo-fitness-free-trial',
    label: 'Free trial',
    tags: 'free trial first week gym membership offer coupon',
    parts: [
      rect([0, 0], 560, 260, '#ff4d1f', { cornerRadius: 20 }),
      rect([0, 0], 526, 226, 'transparent', { cornerRadius: 12, stroke: '#ffd2c2', strokeWidth: 2, strokeStyle: 'dashed' }),
      text('YOUR FIRST WEEK', 'Montserrat', 16, [5, -92], { fontWeight: 800, letterSpacing: 10, fill: '#ffffff' }),
      text('FREE', 'Anton', 150, [3, 26], { lineHeight: 1, letterSpacing: 6, fill: '#ffffff' }),
      text('NO CONTRACT · CANCEL ANYTIME', 'Montserrat', 12, [3, 96], { fontWeight: 700, letterSpacing: 6, fill: '#ffe4d6' }),
    ],
  },
];

export default combos;
