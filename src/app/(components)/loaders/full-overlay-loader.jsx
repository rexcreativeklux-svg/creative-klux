"use client";

// Full-screen overlay loader — dual counter-spinning rings around a brand spark,
// with a heading, a softly cycling subtitle, and bouncing dots. Colours match the
// reference design (light #f5f5f5 surface, #111 heading, #666 subtitle).
//   {busy && <FullOverlayLoader title="Generating your ad creative" subtitle="Crafting copy, layout & visuals" />}
//
// Pass `embedded` to render it inline in a bordered box instead of full-screen.

const VIOLET = "#7c3aed";
const VIOLET_MID = "#a855f7";
const CORAL = "#f97316";

export default function FullOverlayLoader({
    title = "Generating your ad creative",
    subtitle = "Crafting copy, layout & visuals",
    embedded = false,
}) {
    const wrapClass = embedded
        ? "relative overflow-hidden w-full max-w-[480px] min-h-[200px] rounded-xl border border-black/10 dark:border-white/10 bg-[#f5f5f5] dark:bg-canvas flex flex-col items-center justify-center gap-4 p-10"
        : "fixed right-0 bottom-0 z-[120] overflow-hidden flex flex-col items-center justify-center gap-4 bg-[#f5f5f5] dark:bg-canvas";

    // Non-embedded: start after the sidebar (left) and below the header (top).
    // Both vars are published by the dashboard layout and fall back to 0 so it's
    // full-screen anywhere else, e.g. the test page.
    const wrapStyle = embedded
        ? undefined
        : { left: "var(--ck-content-left, 0px)", top: "var(--ck-content-top, 0px)" };

    return (
        <div className={wrapClass} style={wrapStyle}>
            {/* Mountain-shaped blurred glow at the foot */}
            {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5">
                <svg
                    viewBox="0 0 400 160"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                    style={{ filter: "blur(20px)" }}
                >
                    <defs>
                        <linearGradient id="ck-mtn" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%"   stopColor={VIOLET}     stopOpacity="0.9" />
                            <stop offset="50%"  stopColor={VIOLET_MID} stopOpacity="0.85" />
                            <stop offset="100%" stopColor={CORAL}      stopOpacity="0.85" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,160 L70,70 L130,128 L200,52 L270,122 L340,84 L400,138 L400,160 Z"
                        fill="url(#ck-mtn)"
                    />
                </svg>
            </div> */}

            {/* Content (above the glow) */}
            <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Dual spinning rings + centre spark */}
            <div className="relative w-[54px] h-[54px]">
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        border: "3px solid transparent",
                        borderTopColor: VIOLET,
                        borderRightColor: CORAL,
                        animation: "ck-spin 1.1s linear infinite",
                    }}
                />
                <div
                    className="absolute rounded-full"
                    style={{
                        top: 7, left: 7, width: 40, height: 40,
                        border: "2px solid transparent",
                        borderBottomColor: VIOLET_MID,
                        animation: "ck-spin 0.8s linear infinite reverse",
                    }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <img src="/logoblue.svg" alt="Creative Klux" className="w-6 h-6" />
                </div>
            </div>

            {/* Heading */}
            <p className="text-[15px] font-medium text-[#111111] dark:text-[#fafafa] text-center">{title}</p>

            {/* Cycling subtitle */}
            {subtitle && (
                <p
                    className="text-[13px] text-[#666666] dark:text-[#a1a1aa] text-center"
                    style={{ animation: "ck-text-cycle 3s ease-in-out infinite" }}
                >
                    {subtitle}
                </p>
            )}

            {/* Bouncing dots */}
            <div className="flex items-center">
                {[VIOLET, VIOLET_MID, CORAL].map((c, i) => (
                    <span
                        key={i}
                        className="inline-block w-[5px] h-[5px] rounded-full mx-[3px]"
                        style={{ background: c, animation: `ck-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                ))}
            </div>
            </div>
        </div>
    );
}
