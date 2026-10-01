/**
 * TemplateDesign — a Social or Ads template drawn as the design it stands for.
 * ─────────────────────────────────────────────────────────────────────────────
 *   ┌─────────────────┐
 *   │ EYEBROW    (-30%)│   the template's photo, cropped to its format, with
 *   │ Headline        │   the copy from its `design` block laid over it on a
 *   │ [ CTA ]         │   scrim — see designTemplates.js for the fields
 *   │                 │
 *   │ @handle         │
 *   └─────────────────┘
 *
 * ⚠️ TYPE IS SIZED IN `cqw`, NOT px. The same design is a ~200px card on a
 * phone, a ~400px card on a desktop grid and a full-height panel in the viewer,
 * and it has to look like the same design in all three. Making the root an
 * inline-size container and sizing every bit of copy as a share of its width
 * keeps the proportions fixed however big it is drawn.
 */

const SCRIM = {
  dark: {
    top: "bg-linear-to-b from-black/70 via-black/30 to-transparent",
    bottom: "bg-linear-to-t from-black/75 via-black/35 to-transparent",
    center: "bg-black/35",
  },
  light: {
    top: "bg-linear-to-b from-white/85 via-white/40 to-transparent",
    bottom: "bg-linear-to-t from-white/90 via-white/45 to-transparent",
    center: "bg-white/25",
  },
};

const PLACEMENT = {
  top: "justify-start",
  bottom: "justify-end",
  center: "justify-center items-center text-center",
};

/**
 * @param {object} props
 * @param {object} props.template  A shaped design template (has `design`).
 * @param {string} [props.src]     Which size of the photo to draw.
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export default function TemplateDesign({ template, src, className = "", style }) {
  const { design } = template;
  const dark = design.theme !== "light";
  const portrait = design.format === "portrait";
  const ink = dark ? "#ffffff" : "#111827";
  const serif = design.font === "serif";

  // A center layout gets a panel behind the copy on light photos — a pale scrim
  // alone over a busy pattern (the lipstick rows) doesn't hold dark type.
  const panel = design.layout === "center" && !dark;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ containerType: "inline-size", aspectRatio: template.aspect, ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || template.thumb}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={`absolute inset-0 ${SCRIM[dark ? "dark" : "light"][design.layout]}`}
      />

      {design.badge && (
        <div
          className="absolute flex aspect-square items-center justify-center rounded-full font-black text-white shadow-lg"
          style={{
            background: design.accent,
            right: "6cqw",
            top: "6cqw",
            width: "19cqw",
            fontSize: "5.4cqw",
          }}
        >
          {design.badge}
        </div>
      )}

      <div
        className={`absolute inset-0 flex flex-col ${PLACEMENT[design.layout]}`}
        style={{
          padding: portrait ? "9cqw 8cqw" : "7cqw",
          // Room for the handle under copy that sits at the bottom, so the two
          // don't land on each other.
          paddingBottom: design.handle ? "13cqw" : undefined,
          color: ink,
        }}
      >
        <div
          className={`flex flex-col ${panel ? "items-center rounded-[3cqw] bg-white/85 shadow-xl backdrop-blur-sm" : ""}`}
          style={{
            gap: "2.4cqw",
            padding: panel ? "7cqw 6cqw" : 0,
            maxWidth: design.badge ? "70cqw" : "100%",
            alignItems: design.layout === "center" ? "center" : "flex-start",
          }}
        >
          {design.eyebrow && (
            <p
              className="font-bold uppercase"
              style={{
                color: design.accent,
                fontSize: "3.3cqw",
                letterSpacing: "0.14em",
              }}
            >
              {design.eyebrow}
            </p>
          )}
          <p
            className={serif ? "font-serif font-semibold" : "font-extrabold"}
            style={{
              fontSize: portrait ? "10.5cqw" : "8.6cqw",
              lineHeight: 1.04,
              letterSpacing: serif ? "-0.01em" : "-0.03em",
              textWrap: "balance",
            }}
          >
            {design.headline}
          </p>
          {design.body && (
            <p style={{ fontSize: "3.9cqw", lineHeight: 1.35, opacity: 0.88 }}>
              {design.body}
            </p>
          )}
          {design.cta && (
            <span
              className="mt-[1.5cqw] inline-block rounded-full font-semibold shadow-md"
              style={{
                background: design.accent,
                // The accent is chosen to read on the photo, so the button's own
                // text takes whichever of black or white the theme isn't using
                // for the copy — a light accent on a dark design gets dark text.
                color: dark ? "#111827" : "#ffffff",
                fontSize: "3.5cqw",
                padding: "2.2cqw 5cqw",
              }}
            >
              {design.cta}
            </span>
          )}
        </div>

        {design.handle && (
          <p
            className="absolute font-medium"
            style={{
              bottom: portrait ? "6cqw" : "5cqw",
              left: design.layout === "center" ? 0 : portrait ? "8cqw" : "7cqw",
              right: design.layout === "center" ? 0 : undefined,
              fontSize: "3.1cqw",
              opacity: 0.85,
            }}
          >
            {design.handle}
          </p>
        )}
      </div>
    </div>
  );
}
