"use client";

// app/(components)/skeletons/Skeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The single grey block every skeleton in the app is built from.
//
// WHY ONE PRIMITIVE. Skeletons used to be hand-rolled per file, which is how the
// app ended up with three different greys, two different animations and a couple
// of hardcoded hexes that stayed light-coloured in dark mode. Everything now
// funnels through <Skeleton>, so the motion and the palette are decided here
// once and the per-page files only describe SHAPE.
//
// THEME. `gray-*` is deliberate, not incidental: globals.css re-points the whole
// gray ramp inside `.dark`, so `bg-gray-200` becomes a dark slate automatically.
// Never write a hex in a skeleton — it will be wrong in one of the two themes.
//
// MOTION. `animate-pulse`, matching what the app already used everywhere. It is
// applied on the block itself rather than a parent so a skeleton dropped inside
// a real grid still pulses in step with its neighbours.
//
// Usage — Tailwind classes for anything the design system already has a scale
// for, the `w`/`h` props only for the odd pixel-exact measurement:
//   <Skeleton className="h-4 w-32" />
//   <Skeleton className="aspect-video w-full rounded-xl" />
//   <Skeleton w={36} h={36} className="rounded-full" />

/**
 * Two greys, so a skeleton can show depth the same way the real UI does:
 *   base  the default — placeholder content sitting on a card/surface.
 *   soft  one step back — used for large artwork tiles and for placeholders that
 *         sit on an already-grey background, where `base` reads as too loud.
 */
const TONES = {
  base: "bg-gray-200",
  soft: "bg-gray-100",
};

/**
 * One placeholder block.
 *
 * @param {object} props
 * @param {"base"|"soft"} [props.tone]        Which grey — see TONES.
 * @param {string} [props.className]          Tailwind sizing/rounding. Preferred over w/h.
 * @param {number|string} [props.w]           Pixel-exact width, when no Tailwind step fits.
 * @param {number|string} [props.h]           Pixel-exact height, when no Tailwind step fits.
 * @param {string} [props.rounded]            Pixel-exact border-radius (e.g. "50%").
 * @param {React.CSSProperties} [props.style] Escape hatch, merged last.
 */
export default function Skeleton({
  tone = "base",
  className = "",
  w,
  h,
  rounded,
  style,
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded ${TONES[tone] ?? TONES.base} ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: rounded,
        // Skeletons are almost always laid out in flex rows, where the default
        // shrink would quietly squash a block below the size asked for.
        flexShrink: w !== undefined || h !== undefined ? 0 : undefined,
        ...style,
      }}
    />
  );
}

/**
 * A run of text lines. The last line is short, which is what makes a block of
 * bars read as a paragraph rather than a table.
 *
 * @param {object} props
 * @param {number} [props.lines]        How many lines.
 * @param {string} [props.className]    Wrapper classes (spacing, width).
 * @param {string} [props.lineClassName] Per-line classes — height lives here.
 * @param {"base"|"soft"} [props.tone]
 */
export function SkeletonText({
  lines = 3,
  className = "",
  lineClassName = "h-3",
  tone = "base",
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          tone={tone}
          className={`${lineClassName} ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/**
 * An avatar / icon-tile placeholder.
 *
 * @param {object} props
 * @param {number} [props.size]      Diameter in px.
 * @param {boolean} [props.square]   Rounded square (icon tile) instead of a circle.
 * @param {"base"|"soft"} [props.tone]
 */
export function SkeletonCircle({ size = 36, square = false, tone = "base" }) {
  return (
    <Skeleton
      tone={tone}
      w={size}
      h={size}
      className={square ? "rounded-xl" : "rounded-full"}
    />
  );
}

/**
 * The page-heading block nearly every inner page opens with: a title, a line of
 * supporting copy, and optionally a button or two pinned to the right.
 *
 * @param {object} props
 * @param {boolean} [props.withActions]  Render the trailing action buttons.
 * @param {string} [props.className]
 */
export function SkeletonPageHeader({ withActions = false, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 ${className}`}
    >
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-6 w-52 rounded-md" />
        <Skeleton className="h-3.5 w-72" tone="soft" />
      </div>
      {withActions && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" tone="soft" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}
