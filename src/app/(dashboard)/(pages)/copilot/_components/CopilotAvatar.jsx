"use client";

/**
 * CopilotAvatar — the tinted initial tile that stands in for a copilot everywhere
 * it is named: the sidebar's Recents rows, the /copilot/all cards, and whatever
 * detail screen the backend brings.
 *
 * It exists so the three surfaces cannot drift: one place decides the tile's
 * radius, the icon's proportion inside it, and that the glyph is always white on
 * a saturated tint (the tints are `-500`/`-600`, so they carry a white icon in
 * both themes — only the grays are re-pointed for dark mode).
 *
 * @param {Object} props
 * @param {Object} props.copilot            A row from ../_data/copilots.
 * @param {"sm"|"md"|"lg"} [props.size="md"] sm → sidebar row, md → list row,
 *                                           lg → grid card.
 */

// The tile shows the copilot's initial (first letter of its name) rather than
// an icon. `text` sizes the letter to roughly half the tile.
const SIZES = {
  sm: { tile: "h-5 w-5 rounded-md", text: "text-[11px]" },
  md: { tile: "h-9 w-9 rounded-lg", text: "text-base" },
  lg: { tile: "h-12 w-12 rounded-xl", text: "text-xl" },
};

/** First letter of the name, uppercased; "?" when there is no name. */
const initialOf = (name) =>
  (String(name ?? "").trim().match(/\p{L}|\p{N}/u)?.[0] ?? "?").toUpperCase();

export default function CopilotAvatar({ copilot, size = "md" }) {
  const { tint, name } = copilot;
  const { tile, text } = SIZES[size] ?? SIZES.md;
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${tile} ${tint} flex items-center justify-center shrink-0 font-semibold leading-none text-white select-none ${text}`}
    >
      {initialOf(name)}
    </span>
  );
}
