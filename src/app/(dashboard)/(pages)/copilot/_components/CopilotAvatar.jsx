"use client";

/**
 * CopilotAvatar — the tinted glyph tile that stands in for a copilot everywhere
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

const SIZES = {
  sm: { tile: "h-5 w-5 rounded-md", glyph: "h-3 w-3" },
  md: { tile: "h-9 w-9 rounded-lg", glyph: "h-4.5 w-4.5" },
  lg: { tile: "h-12 w-12 rounded-xl", glyph: "h-6 w-6" },
};

export default function CopilotAvatar({ copilot, size = "md" }) {
  const { Icon, tint, name } = copilot;
  const { tile, glyph } = SIZES[size] ?? SIZES.md;
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${tile} ${tint} flex items-center justify-center shrink-0`}
    >
      <Icon className={`${glyph} text-white`} />
    </span>
  );
}
