"use client";

/**
 * Live brand preview shown alongside the create form. Purely presentational —
 * it renders whatever is in `data` (the flow's formData) so both Smart Import
 * and Manual modes get the same real-time preview.
 */
export default function BrandPreview({ data }) {
  const primary = data.primary || "#2563eb";
  const secondary = data.secondary || "#0ea5e9";
  const name = data.name || "Your Brand";
  const tagline = data.tagline || "";
  const desc =
    data.description ||
    "Your brand description will appear here once you fill in the details.";
  const font = data.fonts || "Inter";
  const industry = data.industry || "";
  const logo = data.logoDataUrl || null;

  return (
    <div className="sticky top-6 flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Live Preview
      </p>

      {/* Main card */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md">
        {/* Banner */}
        <div
          className="relative h-28 flex items-end p-4"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute top-3 right-3 flex gap-1.5">
            {[primary, secondary].map((c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm"
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg bg-surface flex items-center justify-center overflow-hidden">
            {logo ? (
              <img
                src={logo}
                alt="logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl font-black" style={{ color: primary }}>
                {name[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-surface p-4 flex flex-col gap-3">
          <div>
            <h3
              className="font-bold text-gray-900 text-base leading-tight"
              style={{ fontFamily: font }}
            >
              {name}
            </h3>
            {tagline && (
              <p className="text-xs text-gray-400 mt-0.5 italic">{tagline}</p>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
            {desc}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {industry && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50">
                {industry}
              </span>
            )}
            {font && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50"
                style={{ fontFamily: font }}
              >
                {font}
              </span>
            )}
          </div>
        </div>

        {/* Color bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${primary}, ${secondary})`,
          }}
        />
      </div>

      {/* Palette */}
      <div className="bg-surface border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Palette
        </span>
        {[primary, secondary].map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md border border-gray-200 shadow-sm"
              style={{ background: c }}
            />
            <span className="text-xs font-mono text-gray-400">{c}</span>
          </div>
        ))}
      </div>

      {/* Typography */}
      <div className="bg-surface border border-gray-100 rounded-xl p-3 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Typography
        </p>
        <p
          className="text-sm font-medium text-gray-800"
          style={{ fontFamily: font }}
        >
          Aa Bb Cc — {font}
        </p>
      </div>
    </div>
  );
}
