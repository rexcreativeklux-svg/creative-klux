"use client";

import { useState } from "react";
import InlineProgressLoader from "@/app/(components)/loaders/inline-progress-loader";
import FullOverlayLoader from "@/app/(components)/loaders/full-overlay-loader";

// Dev helper page to preview the loader components. Navigate to /logo-test
// (public — not behind ProtectedRoute).

export default function LogoTestPage() {
    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Loaders</h1>
                <p className="text-gray-500 mb-8">Preview the inline progress loader and the full overlay loader.</p>

                {/* Inline progress loader */}
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Inline progress loader</h2>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 flex justify-center mb-10">
                    <InlineProgressLoader label="Generating your creative…" />
                </div>

                {/* Full overlay loader */}
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Full overlay loader</h2>
                <div className="flex justify-center mb-4">
                    <FullOverlayLoader embedded title="Generating your ad creative" subtitle="Crafting copy, layout & visuals" />
                </div>
                <div className="flex justify-center">
                    <button onClick={() => setShowOverlay(true)}
                        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 cursor-pointer">
                        Preview full-screen
                    </button>
                </div>
            </div>

            {showOverlay && (
                <>
                    <FullOverlayLoader title="Generating your ad creative" subtitle="Crafting copy, layout & visuals" />
                    <button onClick={() => setShowOverlay(false)}
                        className="fixed top-4 right-4 z-[130] px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold shadow cursor-pointer">
                        Close preview
                    </button>
                </>
            )}
        </div>
    );
}
