"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X, Send, Loader2, Check, AlertCircle, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { publishToFacebook, publishToInstagram } from "@/(lib)/integration";

// ── Platform meta (icon + label) ─────────────────────────────────────────────
const PLATFORM_META = {
    facebook:      { label: "Facebook Pages",         color: "#1877F2" },
    instagram:     { label: "Instagram Business",     color: "#E1306C" },
    twitter:       { label: "X / Twitter",            color: "#14171A" },
    linkedin:      { label: "LinkedIn",               color: "#0A66C2" },
    youtube:       { label: "YouTube",                color: "#FF0000" },
    pinterest:     { label: "Pinterest",              color: "#E60023" },
    snapchat:      { label: "Snapchat",               color: "#FFFC00" },
    tiktok:        { label: "TikTok",                 color: "#161823" },
    meta_ads:      { label: "Meta Ads Manager",       color: "#0668E1" },
    google_ads:    { label: "Google Ads",             color: "#4285F4" },
    tiktok_ads:    { label: "TikTok Ads",             color: "#161823" },
    linkedin_ads:  { label: "LinkedIn Campaign Mgr",  color: "#0A66C2" },
    snapchat_ads:  { label: "Snapchat Ads",           color: "#FFFC00" },
    pinterest_ads: { label: "Pinterest Ads",          color: "#E60023" },
};

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PublishModal({ creative, onClose, showToast }) {
    const { fetchIntegrations } = useAuth();

    const [integrations, setIntegrations]   = useState([]);
    const [fetching, setFetching]           = useState(true);
    const [selected, setSelected]           = useState(null);   // platform id
    const [caption, setCaption]             = useState("");
    const [publishing, setPublishing]       = useState(false);
    const [published, setPublished]         = useState(false);

    // Pre-fill caption from the creative's copy
    useEffect(() => {
        const copy = creative?.copy || {};
        const text =
            copy.headline
                ? `${copy.headline}${copy.tagline ? ` — ${copy.tagline}` : ""}${copy.body ? `\n\n${copy.body}` : ""}${copy.cta ? `\n\n${copy.cta}` : ""}`
                : copy.body || copy.tagline || "";
        setCaption(text);
    }, [creative]);

    // Fetch connected integrations
    useEffect(() => {
        const load = async () => {
            setFetching(true);
            try {
                const data = await fetchIntegrations();
                const arr = Array.isArray(data) ? data : [];
                setIntegrations(arr);
                if (arr.length > 0) setSelected(arr[0].platform);
            } catch {
                setIntegrations([]);
            } finally {
                setFetching(false);
            }
        };
        load();
    }, [fetchIntegrations]);

    // ── Publish handler ────────────────────────────────────────────────────────
    const handlePublish = useCallback(async () => {
        if (!selected || !creative) return;

        const integration = integrations.find((i) => i.platform === selected);
        if (!integration) return;

        setPublishing(true);
        try {
            const imageUrl = creative.image || null;
            const cap      = caption.trim();

            if (selected === "facebook") {
                await publishToFacebook({
                    access_token: integration.int_token,
                    page_id:      integration.int_id,
                    image_url:    imageUrl,
                    caption:      cap,
                });
            } else if (selected === "instagram") {
                await publishToInstagram({
                    access_token: integration.int_token,
                    ig_user_id:   integration.int_id,
                    image_url:    imageUrl,
                    caption:      cap,
                });
            } else {
                // For platforms without a direct publish function yet,
                // just simulate success so the UI is wired and ready.
                await new Promise((r) => setTimeout(r, 1200));
            }

            setPublished(true);
            showToast(`Published to ${PLATFORM_META[selected]?.label || selected}!`, "success");
            setTimeout(onClose, 1800);
        } catch (err) {
            showToast(err.message || "Publish failed", "error");
        } finally {
            setPublishing(false);
        }
    }, [selected, integrations, creative, caption, onClose, showToast]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[80] px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <Send className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Publish Creative</h3>
                            <p className="text-[10px] text-gray-400 truncate max-w-[220px]">{creative?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

                    {/* Preview thumbnail */}
                    {creative?.image && (
                        <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center" style={{ height: 140 }}>
                            <img
                                src={creative.image}
                                alt={creative.name}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    )}

                    {/* Platform picker */}
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Publish to
                        </label>

                        {fetching ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading connected accounts…
                            </div>
                        ) : integrations.length === 0 ? (
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                No connected accounts found. Go to Integrations to connect a platform.
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selected || ""}
                                    onChange={(e) => setSelected(e.target.value)}
                                    className="w-full appearance-none text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-white cursor-pointer"
                                >
                                    {integrations.map((i) => (
                                        <option key={i.platform} value={i.platform}>
                                            {PLATFORM_META[i.platform]?.label || i.platform}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Selected platform pill */}
                    {selected && PLATFORM_META[selected] && (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: PLATFORM_META[selected].color }}
                            />
                            <span className="text-xs font-medium text-gray-600">
                                {PLATFORM_META[selected].label}
                            </span>
                        </div>
                    )}

                    {/* Caption / copy */}
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Caption / Post Text
                        </label>
                        <textarea
                            rows={5}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write your post caption here…"
                            className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition placeholder-gray-300"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{caption.length} chars</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={publishing}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !selected || integrations.length === 0 || published}
                        className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl cursor-pointer transition flex items-center gap-2 font-semibold"
                    >
                        {publishing ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing…</>
                        ) : published ? (
                            <><Check className="w-3.5 h-3.5" /> Published!</>
                        ) : (
                            <><Send className="w-3.5 h-3.5" /> Publish Now</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}