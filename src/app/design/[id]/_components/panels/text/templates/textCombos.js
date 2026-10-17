// ============================================
// FILE: panels/text/templates/textCombos.js
// PURPOSE: The Text panel's TEMPLATES — ready-made text designs ("combos"):
// two or three text boxes in different fonts, sizes and effects, sometimes a
// shape behind them, designed to be used as they are (Canva's "Font
// combinations"). Built into page elements by buildCombo.js.
//
// ── Where they live ─────────────────────────────────────────────────────────
// One file per theme in ./themes/, each a list of combos written with the
// helpers in ./comboParts.js. This file gathers them, stamps each with its
// theme, and is what everything else imports.
//
// ── How a combo is written ──────────────────────────────────────────────────
// `parts` are drawn in order (later on top). Every part is placed by its
// CENTRE, `at: [cx, cy]`, in the combo's own frame (0,0 is its middle, about
// 600 units across), with the page's own element fields:
//   text   — content, fontFamily, fontWeight, fontStyle, fontSize, fill (a colour
//            or a CSS gradient), letterSpacing, lineHeight, textTransform,
//            textAlign, textShadow, textStroke, backgroundColor, cornerRadius,
//            padding, curve (−100…100), rotation, opacity — plus `look`: a Text-
//            panel look id (Effects), whose own styling goes on first. A text
//            box hugs its words unless the part gives a `width`.
//   ringText — a badge's top or bottom line: text placed by its CIRCLE's centre
//            and radius instead, curved by the builder to follow that circle.
//   rect / circle / heart — width, height, fill, cornerRadius, stroke,
//            strokeWidth, rotation, opacity.
//   shape  — any other shape the page draws, by type: ornaments ('sparkle',
//            'starburst', 'crown', 'diamond'…), banners and ribbons, arches.
//   line   — a straight, dashed or dotted rule between lines of type.
// Fonts must be declared in (lib)/design/textTemplateFonts.js; look ids must
// exist in ../looks/lookData.js. This data is Design-Editor's, copied as is —
// buildCombo.js translates it into this editor's elements.
//
// ── Ids ─────────────────────────────────────────────────────────────────────
// A combo's id keys its card in the grid and names it in logs and checks — keep
// each unique, and never reuse one for a different design.
// ============================================

import sale from './themes/sale';
import social from './themes/social';
import celebration from './themes/celebration';
import holiday from './themes/holiday';
import business from './themes/business';
import food from './themes/food';
import retro from './themes/retro';
import neon from './themes/neon';
import elegant from './themes/elegant';
import quotes from './themes/quotes';
import fun from './themes/fun';
import sports from './themes/sports';
import minimal from './themes/minimal';
import luxury from './themes/luxury';
import editorial from './themes/editorial';
import badges from './themes/badges';
import wedding from './themes/wedding';
import beauty from './themes/beauty';
import travel from './themes/travel';
import nature from './themes/nature';
import realestate from './themes/realestate';
import tech from './themes/tech';
import education from './themes/education';
import events from './themes/events';
import music from './themes/music';
import kids from './themes/kids';
import fitness from './themes/fitness';
import pets from './themes/pets';

/** The Templates tab's themes, in order, with their combos. */
const THEMES = [
  { id: 'sale', label: 'Sale & promo', combos: sale },
  { id: 'social', label: 'Social', combos: social },
  { id: 'minimal', label: 'Minimal & modern', combos: minimal },
  { id: 'luxury', label: 'Luxury', combos: luxury },
  { id: 'editorial', label: 'Editorial', combos: editorial },
  { id: 'badges', label: 'Badges & labels', combos: badges },
  { id: 'celebration', label: 'Celebration', combos: celebration },
  { id: 'wedding', label: 'Wedding & love', combos: wedding },
  { id: 'events', label: 'Events & invites', combos: events },
  { id: 'holiday', label: 'Holiday', combos: holiday },
  { id: 'business', label: 'Business', combos: business },
  { id: 'realestate', label: 'Real estate', combos: realestate },
  { id: 'tech', label: 'Tech & startup', combos: tech },
  { id: 'education', label: 'Education', combos: education },
  { id: 'food', label: 'Food & drink', combos: food },
  { id: 'beauty', label: 'Beauty & wellness', combos: beauty },
  { id: 'travel', label: 'Travel', combos: travel },
  { id: 'nature', label: 'Nature & eco', combos: nature },
  { id: 'fitness', label: 'Fitness & health', combos: fitness },
  { id: 'sports', label: 'Sports & gaming', combos: sports },
  { id: 'music', label: 'Music & nightlife', combos: music },
  { id: 'kids', label: 'Kids & birthdays', combos: kids },
  { id: 'pets', label: 'Pets', combos: pets },
  { id: 'retro', label: 'Retro', combos: retro },
  { id: 'neon', label: 'Neon & glow', combos: neon },
  { id: 'elegant', label: 'Elegant', combos: elegant },
  { id: 'quotes', label: 'Quotes', combos: quotes },
  { id: 'fun', label: 'Fun', combos: fun },
];

/** The themes, as the Templates tab's filter chips show them. */
export const COMBO_THEMES = THEMES.map(({ id, label }) => ({ id, label }));

/** Every combo, each stamped with its `theme`, in theme order. */
export const TEXT_COMBOS = THEMES.flatMap(({ id, combos }) => combos.map((combo) => ({ ...combo, theme: id })));

/** A combo by id, or null. */
export const comboById = (id) => TEXT_COMBOS.find((combo) => combo.id === id) ?? null;

/**
 * The combos matching a search — every word must appear in the combo's name,
 * its words, its tags or its theme.
 *
 * @param {string} query
 * @returns {object[]}
 */
export function searchCombos(query) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return TEXT_COMBOS;
  const themeLabel = Object.fromEntries(THEMES.map(({ id, label }) => [id, label.toLowerCase()]));
  return TEXT_COMBOS.filter((combo) => {
    const content = combo.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.content)
      .join(' ');
    const haystack = `${combo.label} ${content} ${combo.tags || ''} ${themeLabel[combo.theme]}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
