"use client";

/**
 * TemplateAvatar — a small robot face standing in for the copilot a template
 * becomes, top-left on each template tile.
 *
 * Drawn as inline SVG rather than loaded: there are no avatar assets, and an
 * external avatar service would send names off-site for a decoration. The
 * look is picked from `seed` (the template's name), so each template keeps the
 * same face everywhere it appears and neighbours rarely match.
 *
 * Literal colours on purpose, like the tiles themselves — it must read the same
 * on every tile background and in both themes, which the white ring guarantees.
 *
 * @param {Object} props
 * @param {string} props.seed      Stable per template (its name).
 * @param {number} [props.size=40]
 */

const FACES = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#0ea5e9", "#22c55e", "#ef4444"];
const SCREENS = ["#e0e7ff", "#fce7f3", "#ccfbf1", "#ffedd5", "#ede9fe", "#e0f2fe", "#dcfce7", "#fee2e2"];

/** Small stable hash, so the same name always draws the same face. */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function TemplateAvatar({ seed, size = 40 }) {
  const h = hash(seed || "copilot");
  const face = FACES[h % FACES.length];
  const screen = SCREENS[h % SCREENS.length];
  const eyes = (h >> 3) % 3; // round · happy arcs · visor
  const antenna = (h >> 5) % 2; // ball · bolt

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={`${seed} avatar`}
      className="shrink-0 rounded-full shadow-sm"
    >
      {/* White ring + coloured disc: readable on every tile colour */}
      <circle cx="20" cy="20" r="20" fill="#ffffff" />
      <circle cx="20" cy="20" r="17.5" fill={face} />

      {/* Antenna */}
      <line x1="20" y1="9" x2="20" y2="12.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      {antenna === 0 ? (
        <circle cx="20" cy="8" r="1.9" fill="#facc15" />
      ) : (
        <path d="M20.8 5.6 18.6 8.6h2.2l-1.4 2.8" fill="none" stroke="#facc15" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Head */}
      <rect x="10" y="12.5" width="20" height="15.5" rx="5" fill="#ffffff" />
      {/* Ears */}
      <rect x="7.6" y="17.5" width="2.4" height="5.5" rx="1.2" fill="#ffffff" />
      <rect x="30" y="17.5" width="2.4" height="5.5" rx="1.2" fill="#ffffff" />
      {/* Face screen */}
      <rect x="12.5" y="15" width="15" height="10.5" rx="3.5" fill={screen} />

      {/* Eyes */}
      {eyes === 0 && (
        <>
          <circle cx="17" cy="19.4" r="1.7" fill={face} />
          <circle cx="23" cy="19.4" r="1.7" fill={face} />
        </>
      )}
      {eyes === 1 && (
        <>
          <path d="M15.4 20.2q1.6-2.2 3.2 0" fill="none" stroke={face} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M21.4 20.2q1.6-2.2 3.2 0" fill="none" stroke={face} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {eyes === 2 && <rect x="15" y="18.3" width="10" height="2.4" rx="1.2" fill={face} />}

      {/* Smile */}
      <path d="M17.6 22.6q2.4 1.8 4.8 0" fill="none" stroke={face} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
