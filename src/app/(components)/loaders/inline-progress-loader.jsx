"use client";

// Inline progress-bar loader — a small in-page "working…" strip with a glowing
// brand icon and an indeterminate violet→coral bar. Drop it inline where content
// is loading: <InlineProgressLoader label="Generating your creative…" />

const VIOLET = "#7c3aed";
const CORAL = "#f97316";

const SparkIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
);

export default function InlineProgressLoader({ label = "Generating your creative…" }) {
    return (
        <div className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-[10px] border border-violet-500/30 bg-gray-50 w-[280px] max-w-full">
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: VIOLET, animation: "ck-icon-glow 1.8s ease-in-out infinite" }}
            >
                <SparkIcon className="w-[17px] h-[17px] text-white" />
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
