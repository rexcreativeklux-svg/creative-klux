"use client";

/**
 * SkillPreview — the little mock inside a featured skill card.
 *
 * ⚠️ AN ILLUSTRATION OF THE OUTPUT, NOT A SCREENSHOT. Each one shows the SHAPE
 * of what the skill hands back — a check with two flags, a set of four sized
 * pieces, a before/after pair — drawn in plain markup. A cropped screenshot
 * would be out of date the first time the real screen moved, and would have to
 * be an image asset besides; this is a dozen divs that inherit the app's tokens
 * and stay right in both themes.
 *
 * Deliberately not interactive and not labelled for assistive tech: it repeats
 * what the card's title and description already say, so it is aria-hidden and
 * the card reads cleanly without it.
 *
 * @param {Object} props
 * @param {"brand"|"campaign"|"product"} props.preview  Which mock to draw.
 */

/** The kit's colors in the brand mock — the app's own palette, not inventions. */
const SWATCHES = ["bg-blue-600", "bg-gray-900", "bg-orange-500", "bg-emerald-600"];

/** The set a campaign comes back as, with the aspect each piece is built at. */
const PIECES = [
  { label: "Post", ratio: "aspect-square" },
  { label: "Story", ratio: "aspect-[9/16]" },
  { label: "Ad", ratio: "aspect-[4/5]" },
  { label: "Banner", ratio: "aspect-[16/9]" },
];

export default function SkillPreview({ preview }) {
  if (preview === "brand") {
    return (
      <div aria-hidden="true" className="w-full rounded-lg bg-surface p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-gray-900">Brand check</p>
        <div className="mt-2 flex items-center gap-1.5">
          {SWATCHES.map((swatch) => (
            <span key={swatch} className={`h-4 w-4 rounded ${swatch}`} />
          ))}
          {/* The odd one out — the whole point of the skill, so the mock shows
              it failing rather than a tidy row that passes. */}
          <span className="h-4 w-4 rounded bg-rose-400 ring-2 ring-rose-200" />
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
            <span className="text-[10px] text-gray-900">Off-brand red</span>
            <span className="ml-auto text-[10px] text-gray-400">2 designs</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span className="text-[10px] text-gray-900">Wrong heading font</span>
            <span className="ml-auto text-[10px] text-gray-400">1 design</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-900">9 on brand</span>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "campaign") {
    return (
      <div aria-hidden="true" className="w-full rounded-lg bg-surface p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-gray-900">Spring launch</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {PIECES.map(({ label, ratio }) => (
            <div key={label} className="flex flex-col gap-1">
              {/* Each tile is drawn at the real aspect it would be produced
                  at, so the row reads as "four sizes" at a glance. */}
              <div
                className={`${ratio} w-full rounded bg-linear-to-br from-orange-400 to-orange-600`}
              />
              <span className="text-[8px] leading-none text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <span className="h-1.5 w-full rounded-full bg-gray-200" />
          <span className="h-1.5 w-3/5 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="w-full rounded-lg bg-surface p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <div className="aspect-square rounded bg-gray-200 p-2">
            {/* "Before": the product sitting on whatever it was shot against. */}
            <div className="h-full w-full rounded-sm bg-gray-400/60" />
          </div>
          <span className="text-[8px] leading-none text-gray-400">Before</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="aspect-square rounded bg-linear-to-br from-violet-100 to-violet-200 p-2">
            <div className="h-full w-full rounded-sm bg-violet-500" />
          </div>
          <span className="text-[8px] leading-none text-gray-400">Staged</span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded bg-gray-100" />
        ))}
      </div>
      <p className="mt-2 text-[9px] text-gray-400">12 products · 24 shots</p>
    </div>
  );
}
