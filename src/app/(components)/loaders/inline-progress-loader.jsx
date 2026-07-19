"use client";

// Inline progress-bar loader — a small in-page "working…" strip with a glowing
// brand icon and an indeterminate violet→coral bar. Drop it inline where content
// is loading: <InlineProgressLoader label="Generating your creative…" />

const VIOLET = "#7c3aed";
const CORAL = "#f97316";

export default function InlineProgressLoader({ label = "Generating your creative…" }) {
    return (
        <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-[10px] border border-violet-500/30 bg-gray-50 w-70 max-w-full">
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-surface border border-violet-200"
                style={{ animation: "ck-icon-glow 1.8s ease-in-out infinite" }}
            >
                <img src="/logoblue.svg" alt="Creative Klux" className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 mb-1.5 truncate">{label}</p>
                <div className="h-1 rounded-full bg-black/10 overflow-hidden w-full">
                    <div
                        className="h-full rounded-full w-2/5"
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
