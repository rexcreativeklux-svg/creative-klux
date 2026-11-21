"use client";

// app/(components)/composer/FormatToolbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The bar that pops up over a text selection in the composer: bold, italic,
// underline, strikethrough, monospace and clear.
//
// ⚠️ SOCIAL NETWORKS HAVE NO RICH TEXT. A post is plain text everywhere we
// publish, so "bold" can't be markup. It is what Metricool does instead: the
// selected letters are swapped for their Unicode look-alikes (𝗯𝗼𝗹𝗱, 𝘪𝘵𝘢𝘭𝘪𝘤,
// 𝚖𝚘𝚗𝚘) and underline / strikethrough are combining marks after each
// character (u̲, s̶). The result is still plain text, so it shows in the preview
// and survives publishing exactly as written.
//
// Only A–Z, a–z (and 0–9 for bold and monospace) have look-alikes; anything
// else — accents, emoji, punctuation — is left as it is.

import { Bold, Code, Italic, RemoveFormatting, Strikethrough, Underline } from "lucide-react";

const UNDERLINE = "̲";
const STRIKE = "̶";

// First code point of each style's A, a and 0 (Mathematical Sans-Serif block).
const STYLES = {
  bold: { A: 0x1d5d4, a: 0x1d5ee, d: 0x1d7ec },
  italic: { A: 0x1d608, a: 0x1d622, d: null },
  boldItalic: { A: 0x1d63c, a: 0x1d656, d: 0x1d7ec },
  mono: { A: 0x1d670, a: 0x1d68a, d: 0x1d7f6 },
};

// Styled code point → [plain character, style]. Bold and bold italic share
// their digits, which read back as bold.
const DECODE = new Map();
for (const [style, { A, a, d }] of Object.entries(STYLES)) {
  for (let i = 0; i < 26; i++) {
    DECODE.set(A + i, [String.fromCharCode(65 + i), style]);
    DECODE.set(a + i, [String.fromCharCode(97 + i), style]);
  }
  if (d && style !== "boldItalic")
    for (let i = 0; i < 10; i++) DECODE.set(d + i, [String.fromCharCode(48 + i), style]);
}

/** Text → one entry per character: its plain form, style and overlay marks. */
function parse(text) {
  const chars = [];
  for (const ch of text) {
    if ((ch === UNDERLINE || ch === STRIKE) && chars.length) {
      chars[chars.length - 1][ch === UNDERLINE ? "under" : "strike"] = true;
      continue;
    }
    const decoded = DECODE.get(ch.codePointAt(0));
    chars.push({ base: decoded ? decoded[0] : ch, style: decoded ? decoded[1] : null, under: false, strike: false });
  }
  return chars;
}

/** Whether a character has a look-alike in `style`. */
const styleable = (base, style) =>
  /[A-Za-z]/.test(base) || (/[0-9]/.test(base) && !!STYLES[style]?.d);

function encode({ base, style, under, strike }) {
  let out = base;
  const s = style && STYLES[style];
  if (s && styleable(base, style)) {
    const c = base.charCodeAt(0);
    out = String.fromCodePoint(
      c >= 97 ? s.a + c - 97 : c >= 65 ? s.A + c - 65 : s.d + c - 48,
    );
  }
  // Marks only on visible characters — a line break with a mark under it
  // would print the mark on its own.
  if (!/\s/.test(base)) {
    if (under) out += UNDERLINE;
    if (strike) out += STRIKE;
  }
  return out;
}

const hasBold = (s) => s === "bold" || s === "boldItalic";
const hasItalic = (s) => s === "italic" || s === "boldItalic";
const combine = (bold, italic) => (bold && italic ? "boldItalic" : bold ? "bold" : italic ? "italic" : null);

/**
 * Apply one format to a piece of text. Each format TOGGLES: when every letter
 * already has it, it comes off; otherwise it goes on everywhere.
 *
 * @param {string} text
 * @param {"bold"|"italic"|"underline"|"strike"|"mono"|"clear"} format
 * @returns {string}
 */
export function applyFormat(text, format) {
  const chars = parse(text);
  const letters = chars.filter((c) => /[A-Za-z0-9]/.test(c.base));
  const visible = chars.filter((c) => !/\s/.test(c.base));
  const every = (list, test) => list.length > 0 && list.every(test);

  let next;
  switch (format) {
    case "bold": {
      const on = !every(letters, (c) => hasBold(c.style));
      next = chars.map((c) => ({ ...c, style: combine(on, c.style !== "mono" && hasItalic(c.style)) }));
      break;
    }
    case "italic": {
      const on = !every(letters, (c) => hasItalic(c.style));
      next = chars.map((c) => ({ ...c, style: combine(c.style !== "mono" && hasBold(c.style), on) }));
      break;
    }
    case "mono": {
      const on = !every(letters, (c) => c.style === "mono");
      next = chars.map((c) => ({ ...c, style: on ? "mono" : null }));
      break;
    }
    case "underline": {
      const on = !every(visible, (c) => c.under);
      next = chars.map((c) => ({ ...c, under: on }));
      break;
    }
    case "strike": {
      const on = !every(visible, (c) => c.strike);
      next = chars.map((c) => ({ ...c, strike: on }));
      break;
    }
    case "clear":
      next = chars.map((c) => ({ base: c.base, style: null, under: false, strike: false }));
      break;
    default:
      return text;
  }
  return next.map(encode).join("");
}

/** Which formats every letter of the selection already has — lit buttons. */
export function activeFormats(text) {
  const chars = parse(text);
  const letters = chars.filter((c) => /[A-Za-z0-9]/.test(c.base));
  const visible = chars.filter((c) => !/\s/.test(c.base));
  const every = (list, test) => list.length > 0 && list.every(test);
  return {
    bold: every(letters, (c) => hasBold(c.style)),
    italic: every(letters, (c) => hasItalic(c.style)),
    mono: every(letters, (c) => c.style === "mono"),
    underline: every(visible, (c) => c.under),
    strike: every(visible, (c) => c.strike),
  };
}

const BUTTONS = [
  { id: "bold", label: "Bold", Icon: Bold },
  { id: "italic", label: "Italic", Icon: Italic },
  { id: "underline", label: "Underline", Icon: Underline },
  { id: "strike", label: "Strikethrough", Icon: Strikethrough },
  { id: "mono", label: "Monospace", Icon: Code },
  { id: "clear", label: "Clear formatting", Icon: RemoveFormatting },
];

/**
 * The floating bar. Positioned by the caller (fixed, viewport coordinates);
 * mousedown is prevented so clicking a button keeps the textarea's selection.
 *
 * @param {object} props
 * @param {{x: number, y: number}} props.at   Where the bar's bottom-centre sits.
 * @param {string} props.selected            The selected text, for lit buttons.
 * @param {(format: string) => void} props.onFormat
 */
export default function FormatToolbar({ at, selected, onFormat }) {
  const active = activeFormats(selected);
  return (
    <div
      role="toolbar"
      aria-label="Format text"
      onMouseDown={(e) => e.preventDefault()}
      // A fixed colour, not bg-gray-900: skins and dark mode flip the gray
      // ramp, and the bar has to stay dark with white icons everywhere.
      className="fixed z-120 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-lg bg-[#16181d] p-1 shadow-xl"
      style={{ left: at.x, top: at.y }}
    >
      {BUTTONS.map(({ id, label, Icon }) => (
        <span key={id} className="flex items-center">
          {id === "clear" && <span className="mx-0.5 h-5 w-px bg-white/20" aria-hidden="true" />}
          <button
            type="button"
            onClick={() => onFormat(id)}
            title={label}
            aria-label={label}
            aria-pressed={id === "clear" ? undefined : !!active[id]}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors ${
              active[id] ? "bg-white text-[#16181d]" : "text-white hover:bg-white/15"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </span>
      ))}
      {/* The little arrow pointing at the selection */}
      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#16181d]" aria-hidden="true" />
    </div>
  );
}
