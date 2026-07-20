"use client";

// Full-screen overlay loader — a conic-gradient brand ring sweeping around a
// glass logo tile, over a soft drifting aurora, with a sheened heading and a
// slim indeterminate progress bar.
//   {busy && <FullOverlayLoader title="Generating your ad creative" subtitle="Crafting copy, layout & visuals" />}
//
// Pass `embedded` to render it inline in a bordered box instead of full-screen.
// Keyframes (ck-*) live in globals.css next to the other loader animations, which
// is also where the prefers-reduced-motion fallback is defined.

/** Brand ramp — violet → mid → coral, matching the studio's primary gradient. */
const VIOLET = "#7c3aed";
const VIOLET_MID = "#a855f7";
const CORAL = "#f97316";

export default function FullOverlayLoader({
    title = "Generating your ad creative",
    subtitle = "Crafting copy, layout & visuals",
    embedded = false,
}) {
    const wrapClass = embedded
        ? "relative isolate overflow-hidden w-full max-w-[480px] min-h-[240px] rounded-2xl border border-black/10 dark:border-white/10 bg-page dark:bg-canvas flex flex-col items-center justify-center p-10"
        : "fixed right-0 bottom-0 z-[120] isolate overflow-hidden flex flex-col items-center justify-center bg-page/95 dark:bg-canvas/95 backdrop-blur-xl";

    // Non-embedded: start after the sidebar (left) and below the header (top).
    // Both vars are published by the dashboard layout and fall back to 0 so it's
    // full-screen anywhere else, e.g. the test page.
    const wrapStyle = embedded
        ? undefined
        : { left: "var(--ck-content-left, 0px)", top: "var(--ck-content-top, 0px)" };

    return (
        <div className={wrapClass} style={wrapStyle} data-ck-loader role="status" aria-live="polite">
            {/* ── Backdrop: two slow-drifting aurora blobs, heavily blurred ── */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div
                    data-ck-decor
                    className="absolute left-1/2 top-1/2 h-80 w-[320px] -translate-x-[65%] -translate-y-[60%] rounded-full blur-[90px] opacity-[.22] dark:opacity-30"
                    style={{ background: VIOLET, animation: "ck-aurora 9s ease-in-out infinite" }}
                />
                <div
                    data-ck-decor
                    className="absolute left-1/2 top-1/2 h-65 w-65 -translate-x-[35%] -translate-y-[40%] rounded-full blur-[90px] opacity-[.16] dark:opacity-25"
                    style={{ background: CORAL, animation: "ck-aurora 11s ease-in-out infinite reverse" }}
                />
            </div>

            {/* ── Content ── */}
            <div
                className="relative z-10 flex flex-col items-center"
                style={{ animation: "ck-fade-up .45s ease-out both" }}
            >
                {/* Sweeping conic ring + counter-rotating arc + glass logo tile */}
                <div className="relative h-23 w-23">
                    {/* Outer ring: a conic gradient masked down to a 3px band, so the
                        brand ramp sweeps around instead of a hard-edged border. */}
                    <div
                        data-ck-ring
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(from 0deg, transparent 0deg, ${VIOLET} 110deg, ${VIOLET_MID} 200deg, ${CORAL} 290deg, transparent 360deg)`,
                            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                            animation: "ck-spin 1.5s linear infinite",
                        }}
                    />

                    {/* Inner arc, counter-rotating for depth */}
                    {/* <div
                        data-ck-ring
                        className="absolute rounded-full"
                        style={{
                            inset: 12,
                            background: `conic-gradient(from 90deg, transparent 0deg, ${VIOLET_MID} 90deg, transparent 200deg)`,
                            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                            animation: "ck-spin 1.1s linear infinite reverse",
                            opacity: 0.75,
                        }}
                    /> */}

                    {/* Satellite riding the outer ring */}
                    <div
                        data-ck-decor
                        className="absolute inset-0"
                        style={{ animation: "ck-spin 1.5s linear infinite" }}
                    >
                        <span
                            className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{ background: CORAL, boxShadow: `0 0 10px 2px ${CORAL}80` }}
                        />
                    </div>

                    {/* Glass logo tile */}
                    <div
                        data-ck-decor
                        className="absolute left-1/2 top-1/2 flex h-13 w-13 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-black/5 bg-surface/80 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                        style={{ animation: "ck-breathe 2.4s ease-in-out infinite" }}
                    >
                        <img src="/logoblue.svg" alt="" aria-hidden="true" className="h-7 w-7" />
                    </div>
                </div>

                {/* Heading — brand-gradient text with a sheen sweeping across it.
                    Styled by .ck-loader-title in globals.css so the light/dark ramps
                    live next to the other loader CSS. */}
                <p data-ck-decor className="ck-loader-title mt-7 text-center text-[16px] font-semibold tracking-[-0.01em]">
                    {title}
                </p>

                {/* Cycling subtitle */}
                {subtitle && (
                    <p
                        data-ck-decor
                        className="mt-2 text-center text-[13px] text-gray-500 dark:text-gray-500"
                        style={{ animation: "ck-text-cycle 3s ease-in-out infinite" }}
                    >
                        {subtitle}
                    </p>
                )}

                {/* Slim indeterminate progress bar */}
                <div className="mt-6 h-0.75 w-45 max-w-full overflow-hidden rounded-full bg-black/[.07] dark:bg-white/10">
                    <div
                        data-ck-decor
                        className="h-full w-2/5 rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${VIOLET}, ${CORAL})`,
                            animation: "ck-bar-slide 1.8s ease-in-out infinite",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
