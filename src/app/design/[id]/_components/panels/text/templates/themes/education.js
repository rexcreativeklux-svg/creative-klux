// ============================================
// FILE: panels/text/templates/themes/education.js
// PURPOSE: Text templates — Education
// ============================================

import { circle, gradient, line, outline, rect, ringText, shape, text } from '../comboParts';

// Collegiate navy and teal, warm mustard and brick for accents, and the
// chalkboard pair (board green, chalk white) for the classroom looks.
const NAVY = '#1e3a5f';
const TEAL = '#0f766e';
const MUSTARD = '#d99a1e';
const MUSTARD_DEEP = '#b7791f';
const GOLD_LIGHT = '#f2c14e';
const BRICK = '#b4532a';
const INK = '#1f2937';
const STONE = '#6b7280';
const CHALKBOARD = '#2f4a3a';
const CHALK = '#f4f1e8';
const WOOD = '#8a5a33';
const CREAM = '#fdf6e3';

const combos = [
  {
    id: 'combo-education-now-enrolling',
    label: 'Now enrolling',
    tags: 'now enrolling enrollment admissions school fall apply ribbon',
    parts: [
      text('Fall 2027', 'Playfair Display', 46, [0, -100], { fontStyle: 'italic', fill: BRICK }),
      shape('banner-swallowtail', [0, -10], 600, 104, NAVY),
      text('NOW ENROLLING', 'Bebas Neue', 64, [3, -1], { letterSpacing: 6, fill: '#ffffff' }),
      text('LIMITED SEATS  ·  APPLY BY AUG 15', 'Montserrat', 15, [3, 84], { fontWeight: 700, letterSpacing: 5, fill: NAVY }),
    ],
  },
  {
    id: 'combo-education-back-to-school',
    label: 'Back to school',
    tags: 'back to school chalkboard classroom first day september',
    parts: [
      rect([0, 0], 560, 330, WOOD, { cornerRadius: 14 }),
      rect([0, 0], 526, 296, CHALKBOARD, { cornerRadius: 6 }),
      text('Back to', 'Caveat', 64, [0, -100], { fontWeight: 600, fill: CHALK }),
      text('SCHOOL', 'Amatic SC', 128, [4, 8], { fontWeight: 700, letterSpacing: 8, fill: CHALK }),
      shape('line-wavy', [0, 78], 190, 14, 'transparent', { stroke: GOLD_LIGHT, strokeWidth: 3 }),
      text('Sept 2  ·  see you there!', 'Caveat', 34, [0, 114], { fill: GOLD_LIGHT }),
    ],
  },
  {
    id: 'combo-education-online-course',
    label: 'Online course',
    tags: 'online course e-learning lessons video self paced class',
    parts: [
      circle([0, -108], 72, TEAL),
      shape('banner-pennant', [4, -108], 24, 28, '#ffffff'),
      text('Online Course', 'Poppins', 66, [0, -18], { fontWeight: 700, letterSpacing: -1, fill: INK }),
      rect([0, 50], 340, 10, '#cde5e1', { cornerRadius: 5 }),
      rect([-51, 50], 238, 10, TEAL, { cornerRadius: 5 }),
      text('12 LESSONS  ·  SELF-PACED', 'Poppins', 15, [3, 90], { fontWeight: 600, letterSpacing: 5, fill: TEAL }),
    ],
  },
  {
    id: 'combo-education-free-masterclass',
    label: 'Free masterclass',
    tags: 'free masterclass webinar class lecture expert session',
    parts: [
      rect([0, -104], 110, 38, BRICK, { cornerRadius: 19 }),
      text('FREE', 'Montserrat', 17, [3, -104], { fontWeight: 800, letterSpacing: 6, fill: '#ffffff' }),
      text('Masterclass', 'Playfair Display', 98, [0, -18], { fontStyle: 'italic', fontWeight: 600, fill: NAVY }),
      text('WITH DR. MAYA LIN  ·  THU 6 PM', 'Montserrat', 15, [3, 66], { fontWeight: 600, letterSpacing: 5, fill: STONE }),
    ],
  },
  {
    id: 'combo-education-workshop',
    label: 'Workshop',
    tags: 'workshop creative writing class hands on saturday session',
    parts: [
      text('Creative Writing', 'Lora', 42, [0, -98], { fontStyle: 'italic', fontWeight: 500, fill: BRICK }),
      text('WORKSHOP', 'Oswald', 108, [3, -4], { fontWeight: 700, letterSpacing: 6, fill: NAVY }),
      line([-220, 80], 80, BRICK, { weight: 1.5 }),
      text('SAT  ·  10 AM – 1 PM', 'Montserrat', 16, [3, 80], { fontWeight: 700, letterSpacing: 5, fill: NAVY }),
      line([220, 80], 80, BRICK, { weight: 1.5 }),
    ],
  },
  {
    id: 'combo-education-class-of-2027',
    label: 'Class of 2027',
    tags: 'class of 2027 graduation graduate congratulations senior',
    parts: [
      text('2027', 'Bodoni Moda', 196, [0, 24], { fontWeight: 800, fill: gradient(180, '#e3b75a', '#a8741a') }),
      text('Class of', 'Great Vibes', 92, [0, -104], { fill: NAVY }),
      shape('sparkle', [-190, -118], 28, 28, MUSTARD),
      shape('sparkle', [190, -118], 28, 28, MUSTARD),
      text('CONGRATULATIONS, GRADUATES', 'Montserrat', 15, [3, 138], { fontWeight: 700, letterSpacing: 6, fill: NAVY }),
    ],
  },
  {
    id: 'combo-education-study-tips',
    label: 'Study tips',
    tags: 'study tips sticky note list exam revision students',
    parts: [
      rect([0, 0], 440, 300, '#fde68a', { cornerRadius: 6, rotation: -3 }),
      rect([0, -148], 130, 36, '#ffffff', { opacity: 0.7, rotation: 4 }),
      text('Study tips', 'Caveat', 80, [-4, -78], { fontWeight: 700, fill: INK, rotation: -3 }),
      text('1. Pomodoro: 25 on, 5 off\n2. Teach it to a friend\n3. Sleep on it', 'Patrick Hand', 30, [2, 40], {
        lineHeight: 1.35,
        textAlign: 'left',
        width: 360,
        fill: '#374151',
        rotation: -3,
      }),
    ],
  },
  {
    id: 'combo-education-lesson-01',
    label: 'Lesson 01',
    tags: 'lesson 01 chapter module intro course number',
    parts: [
      text('01', 'Archivo Black', 170, [-160, 6], { fill: 'transparent', textStroke: outline(3, TEAL) }),
      text('LESSON', 'Montserrat', 17, [150, -78], { fontWeight: 700, letterSpacing: 10, width: 300, textAlign: 'left', fill: TEAL }),
      text('Intro to\nAlgebra', 'Lora', 58, [150, 2], { fontWeight: 700, lineHeight: 1.0, width: 300, textAlign: 'left', fill: INK }),
      text('25 MIN  ·  BEGINNER', 'Montserrat', 15, [150, 86], { fontWeight: 600, letterSpacing: 5, width: 300, textAlign: 'left', fill: STONE }),
    ],
  },
  {
    id: 'combo-education-certificate',
    label: 'Certificate',
    tags: 'certificate of completion award diploma presented course',
    parts: [
      rect([0, 0], 580, 380, 'transparent', { stroke: NAVY, strokeWidth: 3 }),
      rect([0, 0], 556, 356, 'transparent', { stroke: MUSTARD_DEEP, strokeWidth: 1 }),
      text('CERTIFICATE', 'Marcellus', 48, [5, -124], { letterSpacing: 10, fill: NAVY }),
      text('of Completion', 'Pinyon Script', 50, [0, -64], { fill: MUSTARD_DEEP }),
      text('PROUDLY PRESENTED TO', 'Montserrat', 14, [3, -8], { fontWeight: 600, letterSpacing: 6, fill: STONE }),
      text('Alex Morgan', 'Playfair Display', 60, [0, 40], { fontStyle: 'italic', fill: NAVY }),
      line([0, 82], 300, MUSTARD_DEEP, { weight: 1.5 }),
      text('UX FUNDAMENTALS  ·  JUNE 2027', 'Montserrat', 14, [3, 118], { fontWeight: 600, letterSpacing: 5, fill: STONE }),
    ],
  },
  {
    id: 'combo-education-exam-week',
    label: 'Exam week',
    tags: 'exam week finals test good luck students library',
    parts: [
      text('EXAM\nWEEK', 'Anton', 132, [-80, -8], { lineHeight: 0.95, letterSpacing: 4, fill: NAVY }),
      shape('starburst', [160, -80], 150, 150, MUSTARD, { rotation: 10 }),
      text('good\nluck!', 'Caveat', 34, [160, -80], { fontWeight: 700, lineHeight: 0.9, fill: NAVY, rotation: 10 }),
      text('MAY 12–16  ·  LIBRARY OPEN 24/7', 'Montserrat', 15, [3, 150], { fontWeight: 700, letterSpacing: 5, fill: NAVY }),
    ],
  },
  {
    id: 'combo-education-open-day',
    label: 'Open day',
    tags: 'open day campus tours open house university college visit arch',
    parts: [
      shape('arch', [0, 0], 420, 420, TEAL),
      text('CAMPUS', 'Montserrat', 17, [6, -128], { fontWeight: 700, letterSpacing: 12, fill: '#99f6e4' }),
      text('Open\nDay', 'DM Serif Display', 110, [0, -10], { lineHeight: 0.95, fill: CREAM }),
      line([0, 104], 40, GOLD_LIGHT, { weight: 2 }),
      text('SAT, OCT 12  ·  10 AM – 3 PM', 'Montserrat', 14, [3, 140], { fontWeight: 700, letterSpacing: 4, fill: CREAM }),
    ],
  },
  {
    id: 'combo-education-scholarships',
    label: 'Scholarships',
    tags: 'scholarships apply now deadline admissions funding university',
    parts: [
      text('Scholarships', 'Playfair Display', 84, [0, -76], { fontWeight: 700, fill: NAVY }),
      text('AVAILABLE FOR 2027 / 28', 'Montserrat', 17, [4, -4], { fontWeight: 600, letterSpacing: 8, fill: TEAL }),
      rect([0, 70], 250, 62, BRICK, { cornerRadius: 31 }),
      text('APPLY NOW  →', 'Montserrat', 19, [2, 70], { fontWeight: 800, letterSpacing: 4, fill: '#ffffff' }),
      text('Deadline: March 31', 'Lora', 22, [0, 134], { fontStyle: 'italic', fill: STONE }),
    ],
  },
  {
    id: 'combo-education-book-club',
    label: 'Book club',
    tags: 'book club reading library literature discussion meeting',
    parts: [
      text('READ  ·  DISCUSS  ·  REPEAT', 'Montserrat', 14, [3, -110], { fontWeight: 700, letterSpacing: 6, fill: BRICK }),
      text('BOOK', 'Libre Baskerville', 120, [-20, -10], { fontWeight: 700, letterSpacing: 6, fill: NAVY }),
      text('club', 'Caveat', 110, [160, 66], { fontWeight: 700, fill: BRICK, rotation: -6 }),
      text('CHAPTERS 1–5  ·  THURSDAY 7 PM', 'Montserrat', 15, [3, 138], { fontWeight: 700, letterSpacing: 5, fill: NAVY }),
    ],
  },
  {
    id: 'combo-education-science-fair',
    label: 'Science fair',
    tags: 'science fair stem school projects experiment lab',
    parts: [
      shape('hexagon', [192, -132], 56, 56, 'transparent', { stroke: TEAL, strokeWidth: 3 }),
      shape('hexagon', [241, -132], 56, 56, 'transparent', { stroke: TEAL, strokeWidth: 3 }),
      shape('hexagon', [216, -90], 56, 56, 'transparent', { stroke: MUSTARD, strokeWidth: 3 }),
      text('Science', 'Lexend', 96, [-90, 0], { fontWeight: 800, letterSpacing: -2, fill: NAVY }),
      text('fair', 'Lexend', 96, [194, 0], { fontWeight: 300, letterSpacing: -2, fill: TEAL }),
      text('APRIL 9  ·  MAIN GYM  ·  ALL GRADES', 'Montserrat', 15, [3, 92], { fontWeight: 700, letterSpacing: 5, fill: NAVY }),
    ],
  },
  {
    id: 'combo-education-honor-roll',
    label: 'Honor roll',
    tags: 'honor roll seal badge award student achievement star',
    parts: [
      circle([0, 0], 340, NAVY),
      circle([0, 0], 300, 'transparent', { stroke: MUSTARD, strokeWidth: 2 }),
      ringText('HONOR ROLL', 'Montserrat', 20, [0, 0], 124, 'top', { fontWeight: 800, letterSpacing: 10, fill: GOLD_LIGHT }),
      ringText('SPRING SEMESTER', 'Montserrat', 14, [0, 0], 124, 'bottom', { fontWeight: 700, letterSpacing: 6, fill: GOLD_LIGHT }),
      shape('star5', [0, -14], 76, 76, GOLD_LIGHT),
      text('2027', 'Bodoni Moda', 40, [2, 50], { fontWeight: 700, letterSpacing: 4, fill: '#ffffff' }),
    ],
  },
];

export default combos;
