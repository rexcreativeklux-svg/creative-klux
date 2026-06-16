"use client";

import { useState, useEffect } from "react";

// Shared full-screen generating animation — the Creative Klux logo spins while a
// rotating description types itself out (typewriter), over a masking blurred backdrop.
// Used by Custom Creation (Image/Video Ads forms) and Create-from-URL.
// Render conditionally: {generating && <GeneratingOverlay />}
//   - title : optional small context heading (e.g. "Generating your videos").

const MESSAGES = [
    "Analyzing your brand…",
    "Composing the layout…",
    "Applying your colors…",
    "Adding the finishing touches…",
    "Rendering your designs…",
];

export default function GeneratingOverlay({ title }) {
    const [msgIdx, setMsgIdx] = useState(0);
    const [n, setN] = useState(0);

    // Type the current message out char-by-char, hold, then advance to the next.
    useEffect(() => {
        const full = MESSAGES[msgIdx];
        if (n < full.length) {
            const t = setTimeout(() => setN((v) => v + 1), 55);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => {
            setN(0);
            setMsgIdx((i) => (i + 1) % MESSAGES.length);
        }, 1500);
        return () => clearTimeout(t);
    }, [n, msgIdx]);

    const current = MESSAGES[msgIdx];

    return (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            {/* Spinning logo (brand blue + bold glow so it reads on the dark backdrop) */}
            <img
                src="/logoblue.svg"
                alt="Creative Klux"
                className="w-28 h-28 animate-[spin_1.6s_linear_infinite]"
                style={{ filter: "brightness(1.25) contrast(1.12) saturate(1.35) drop-shadow(0 0 20px rgba(56,189,248,0.85))" }}
            />

            {/* Optional context heading */}
            {title && <h3 className="mt-8 text-xl font-extrabold text-white">{title}</h3>}

            {/* Rotating typewriter description */}
            <div className="mt-3 flex items-center justify-center" style={{ minHeight: "2rem" }}>
                <span className="text-lg font-bold text-blue-200 tracking-wide whitespace-pre">
                    {current.slice(0, n)}
                </span>
                <span
                    className="inline-block w-[3px] h-6 bg-blue-300 ml-1"
                    style={{ animation: "caret-blink 1s step-end infinite" }}
                />
            </div>
        </div>
    );
}
