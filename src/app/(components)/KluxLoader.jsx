// KluxLoader — the Creative Klux logo with a ring spinning around it, and an
// optional line underneath. Used wherever a section waits on the backend, in
// place of a bare "Loading…".
//
// The logo stays still and only the ring turns, so the mark stays readable.
// Under prefers-reduced-motion the ring stops (motion-reduce) and the label
// still says what's happening.

export default function KluxLoader({ label, size = 44, className = "" }) {
  const logo = Math.round(size * 0.45);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-6 ${className}`}
    >
      <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 44 44"
          className="absolute inset-0 h-full w-full animate-spin motion-reduce:animate-none"
          style={{ animationDuration: "1.1s" }}
          aria-hidden="true"
        >
          {/* faint full track */}
          <circle cx="22" cy="22" r="19" fill="none" stroke="#1447e6" strokeOpacity=".12" strokeWidth="3" />
          {/* the moving arc, about a quarter of the ring */}
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="#1447e6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="30 120"
          />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logoblue.svg" alt="" style={{ width: logo, height: logo }} className="object-contain" />
      </span>
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}
