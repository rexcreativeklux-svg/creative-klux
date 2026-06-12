"use client";

import { useState, useEffect } from "react";

// Shared full-screen "we're designing your creatives" animation.
// Used by Custom Creation (Image/Video Ads forms) and Create-from-URL while
// waiting for the backend. Render it conditionally: {generating && <GeneratingOverlay />}
// Optional props:
//   - count / total : when known, shows a real "X of Y designs" + determinate bar
//   - title         : heading override
//   - tips          : whether to show the rotating tip line (default true)

const STEPS = [
    "Analyzing your brand…",
    "Composing the layout…",
    "Applying your colors…",
    "Adding the finishing touches…",
    "Rendering your designs…",
];

const TIPS = [
    "Tip: High-contrast colors grab more attention in busy feeds.",
    "Tip: Square (1:1) designs work across almost every platform.",
    "Tip: A single, clear call-to-action converts better than three.",
    "Did you know? You can favorite designs to find them faster later.",
    "Tip: Less text on a creative usually means more impact.",
];

export default function GeneratingOverlay({ count, total, title = "Designing your creatives", tips = true }) {
    const [stepIdx, setStepIdx] = useState(0);
    const [tipIdx, setTipIdx] = useState(0);

    useEffect(() => {
        const s = setInterval(() => setStepIdx((i) => (i + 1) % STEPS.length), 2200);
        const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 4200);
        return () => { clearInterval(s); clearInterval(t); };
    }, []);

    const determinate = Number.isFinite(total) && total > 0 && Number.isFinite(count);
    const pct = determinate ? Math.min(100, Math.round((count / total) * 100)) : null;

    const block = (delay) => ({ animationDelay: delay, animationName: "block-pop", animationDuration: "3s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" });

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[min(92vw,420px)] bg-white rounded-3xl shadow-2xl px-8 py-9 flex flex-col items-center">

                {/* ── Building-canvas centerpiece ── */}
                <div className="relative w-44 h-44 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 border border-gray-100 overflow-hidden mb-7 shadow-inner">
                    {/* color header fills in */}
                    <div className="absolute top-0 left-0 right-0 h-9 bg-gradient-to-r from-violet-500 to-blue-500" style={block("0s")} />
                    {/* text + image blocks slide in one by one */}
                    <div className="absolute left-4 right-4 top-12 space-y-2.5">
                        <div className="h-3 w-3/4 rounded bg-gray-200" style={block("0.3s")} />
                        <div className="h-3 w-1/2 rounded bg-gray-200" style={block("0.6s")} />
                        <div className="h-14 w-full rounded-lg bg-gray-100" style={block("0.9s")} />
                        <div className="h-5 w-20 rounded-full bg-violet-200" style={block("1.2s")} />
                    </div>
                    {/* logo stamps last */}
                    <div className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600" style={block("1.5s")} />
                    {/* shimmer sweep over the whole card */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.55)_50%,transparent_100%)] animate-[shimmer-slide_2.2s_ease-in-out_infinite]" />
                </div>

                {/* ── Title + rotating status ── */}
                <h3 className="text-lg font-bold text-gray-900 text-center">{title}</h3>
                <p key={stepIdx} className="text-sm text-violet-600 font-medium mt-1 animate-[pop-fade_0.4s_ease]">
                    {STEPS[stepIdx]}
                </p>

                {/* ── Progress bar ── */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden relative">
                    {determinate ? (
                        <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    ) : (
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full animate-[bar-indeterminate_1.4s_ease-in-out_infinite]" />
                    )}
                </div>
                {determinate && <p className="text-xs text-gray-400 mt-2">{count} of {total} designs ready</p>}

                {/* ── Rotating tip ── */}
                {tips && (
                    <p key={`tip-${tipIdx}`} className="text-xs text-gray-400 text-center mt-5 leading-relaxed min-h-[2.25rem] animate-[pop-fade_0.5s_ease]">
                        {TIPS[tipIdx]}
                    </p>
                )}
            </div>
        </div>
    );
}
