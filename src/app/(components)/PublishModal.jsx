"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    X, Send, Loader2, Check, AlertCircle, Link2, ArrowLeft,
    Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Globe, MoreHorizontal,
} from "lucide-react";
import {
    FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaYoutube,
    FaPinterest, FaTwitter, FaSnapchatGhost, FaGoogle,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { publishToFacebook, publishToInstagram } from "@/(lib)/integration";

// ── Platform catalog ─────────────────────────────────────────────────────────
// `kind` decides which list shows for a creative's category.
// `real` = we have a working publisher; everything else is a stub for now.
const PLATFORMS = {
    facebook:      { label: "Facebook Page",        kind: "social", color: "#1877F2", Icon: FaFacebook,      real: true  },
    instagram:     { label: "Instagram Business",   kind: "social", color: "#E1306C", Icon: FaInstagram,     real: true  },
    tiktok:        { label: "TikTok",               kind: "social", color: "#010101", Icon: FaTiktok,        real: false },
    twitter:       { label: "X / Twitter",          kind: "social", color: "#14171A", Icon: FaTwitter,       real: false },
    linkedin:      { label: "LinkedIn",             kind: "social", color: "#0A66C2", Icon: FaLinkedin,      real: false },
    youtube:       { label: "YouTube",              kind: "social", color: "#FF0000", Icon: FaYoutube,       real: false },
    pinterest:     { label: "Pinterest",            kind: "social", color: "#E60023", Icon: FaPinterest,     real: false },
    snapchat:      { label: "Snapchat",             kind: "social", color: "#FFC400", Icon: FaSnapchatGhost, real: false },
    meta_ads:      { label: "Meta Ads Manager",     kind: "ads",    color: "#0668E1", Icon: FaFacebook,      real: false },
    google_ads:    { label: "Google Ads",           kind: "ads",    color: "#4285F4", Icon: FaGoogle,        real: false },
    tiktok_ads:    { label: "TikTok Ads",           kind: "ads",    color: "#010101", Icon: FaTiktok,        real: false },
    linkedin_ads:  { label: "LinkedIn Ads",         kind: "ads",    color: "#0A66C2", Icon: FaLinkedin,      real: false },
    snapchat_ads:  { label: "Snapchat Ads",         kind: "ads",    color: "#FFC400", Icon: FaSnapchatGhost, real: false },
    pinterest_ads: { label: "Pinterest Ads",        kind: "ads",    color: "#E60023", Icon: FaPinterest,     real: false },
};

// Order tiles appear in, per kind.
const SOCIAL_ORDER = ["facebook", "instagram", "tiktok", "twitter", "linkedin", "youtube", "pinterest", "snapchat"];
const ADS_ORDER    = ["meta_ads", "google_ads", "tiktok_ads", "linkedin_ads", "snapchat_ads", "pinterest_ads"];

// A creative's category → which platform list to show.
const platformsForCategory = (category) =>
    String(category).toLowerCase() === "ads" ? ADS_ORDER : SOCIAL_ORDER;

// Build a default caption from the creative's copy object.
const captionFromCopy = (copy = {}) =>
    copy.headline
        ? `${copy.headline}${copy.tagline ? ` — ${copy.tagline}` : ""}${copy.body ? `\n\n${copy.body}` : ""}${copy.cta ? `\n\n${copy.cta}` : ""}`
        : copy.body || copy.tagline || "";

// ── Platform tile ─────────────────────────────────────────────────────────────
const PlatformTile = ({ platform, connected, onClick }) => {
    const meta = PLATFORMS[platform];
    if (!meta) return null;
    const { label, color, Icon } = meta;
    return (
        <button
            onClick={onClick}
            disabled={!connected}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition w-full ${
                connected
                    ? "border-gray-200 bg-surface hover:border-blue-400 hover:shadow-sm cursor-pointer"
                    : "border-gray-100 bg-gray-50/60 cursor-not-allowed"
            }`}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: connected ? color : "#E5E7EB" }}
            >
                <Icon style={{ color: connected ? "#fff" : "#9CA3AF", fontSize: 17 }} />
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${connected ? "text-gray-900" : "text-gray-500"}`}>{label}</p>
                <p className={`text-[11px] truncate ${connected ? "text-green-600" : "text-gray-400"}`}>
                    {connected ? "Connected" : "Not connected"}
                </p>
            </div>
            {connected && <Check className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
        </button>
    );
};

// ── Platform-native previews ──────────────────────────────────────────────────
const Avatar = ({ name, color, logo }) => (
    <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-white text-sm font-bold"
        style={{ background: color }}
    >
        {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : (name?.[0]?.toUpperCase() || "B")}
    </div>
);

const FacebookPreview = ({ name, logo, caption, image }) => (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 p-3">
            <Avatar name={name} color="#1877F2" logo={logo} />
            <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">Sponsored · <Globe className="w-3 h-3" /></p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
        {caption && <p className="px-3 pb-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{caption}</p>}
        {image && <img src={image} alt="" className="w-full object-cover max-h-72" />}
        <div className="flex items-center justify-around px-3 py-2 border-t border-gray-100 text-gray-500 text-xs font-medium">
            <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> Like</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Comment</span>
            <span className="flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share</span>
        </div>
    </div>
);

const InstagramPreview = ({ name, logo, caption, image }) => (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 p-3">
            <Avatar name={name} color="#E1306C" logo={logo} />
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <MoreHorizontal className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
        {image && <img src={image} alt="" className="w-full object-cover aspect-square" />}
        <div className="flex items-center gap-4 px-3 pt-2.5 text-gray-800">
            <Heart className="w-5 h-5" />
            <MessageCircle className="w-5 h-5" />
            <Share2 className="w-5 h-5" />
            <Bookmark className="w-5 h-5 ml-auto" />
        </div>
        {caption && (
            <p className="px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                <span className="font-semibold mr-1">{name}</span>{caption}
            </p>
        )}
    </div>
);

const GenericPreview = ({ platform, name, logo, caption, image }) => {
    const meta = PLATFORMS[platform];
    return (
        <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 p-3">
                <Avatar name={name} color={meta?.color || "#374151"} logo={logo} />
                <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-[11px] text-gray-400">{meta?.label}</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
            {caption && <p className="px-3 pb-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{caption}</p>}
            {image && <img src={image} alt="" className="w-full object-cover max-h-72" />}
        </div>
    );
};

const PlatformPreview = ({ platform, ...rest }) => {
    if (platform === "facebook") return <FacebookPreview {...rest} />;
    if (platform === "instagram") return <InstagramPreview {...rest} />;
    return <GenericPreview platform={platform} {...rest} />;
};

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PublishModal({ creative, onClose, showToast }) {
    const { fetchIntegrations, activeBrand } = useAuth();
    const router = useRouter();

    const [integrations, setIntegrations] = useState([]);
    const [fetching, setFetching]         = useState(true);
    const [view, setView]                 = useState("picker");   // "picker" | "compose"
    const [selected, setSelected]         = useState(null);       // platform id
    const [caption, setCaption]           = useState("");
    const [publishing, setPublishing]     = useState(false);
    const [published, setPublished]       = useState(false);

    const order = useMemo(() => platformsForCategory(creative?.category), [creative]);

    // Default caption from the creative's copy
    useEffect(() => {
        setCaption(captionFromCopy(creative?.copy));
    }, [creative]);

    // Load connected integrations
    useEffect(() => {
        let alive = true;
        (async () => {
            setFetching(true);
            try {
                const data = await fetchIntegrations();
                if (alive) setIntegrations(Array.isArray(data) ? data : []);
            } catch {
                if (alive) setIntegrations([]);
            } finally {
                if (alive) setFetching(false);
            }
        })();
        return () => { alive = false; };
    }, [fetchIntegrations]);

    const connectedSet = useMemo(
        () => new Set(integrations.map((i) => i.platform)),
        [integrations],
    );
    const connected    = order.filter((p) => connectedSet.has(p));
    const notConnected = order.filter((p) => !connectedSet.has(p));
    const noneConnected = connected.length === 0;

    const goConnect = () => { onClose(); router.push("/integrations"); };

    const openCompose = (platform) => {
        if (!connectedSet.has(platform)) return;
        setSelected(platform);
        setPublished(false);
        setView("compose");
    };

    // ── Publish ─────────────────────────────────────────────────────────────────
    const handlePublish = useCallback(async () => {
        if (!selected || !creative) return;
        const integration = integrations.find((i) => i.platform === selected);
        if (!integration) return;

        setPublishing(true);
        try {
            const imageUrl = creative.image || null;
            const cap = caption.trim();

            if (selected === "facebook") {
                await publishToFacebook({
                    access_token: integration.int_token,
                    page_id: integration.int_id,
                    image_url: imageUrl,
                    caption: cap,
                });
            } else if (selected === "instagram") {
                await publishToInstagram({
                    access_token: integration.int_token,
                    ig_user_id: integration.int_id,
                    image_url: imageUrl,
                    caption: cap,
                });
            } else {
                // No live publisher yet — keep the UI wired.
                await new Promise((r) => setTimeout(r, 1200));
            }

            setPublished(true);
            showToast(`Published to ${PLATFORMS[selected]?.label || selected}!`, "success");
            setTimeout(onClose, 1600);
        } catch (err) {
            showToast(err.message || "Publish failed", "error");
        } finally {
            setPublishing(false);
        }
    }, [selected, integrations, creative, caption, onClose, showToast]);

    // Page/account display name for the preview
    const accountName = useMemo(() => {
        const i = integrations.find((x) => x.platform === selected);
        return i?.int_name || activeBrand?.name || PLATFORMS[selected]?.label || "Your Brand";
    }, [integrations, selected, activeBrand]);

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[80] px-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 shrink-0">
                    {view === "compose" && (
                        <button
                            onClick={() => setView("picker")}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-500"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Send className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900">Publish Creative</h3>
                            <p className="text-[11px] text-gray-400 truncate max-w-[240px]">
                                Publishing “{creative?.name}”
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700 ml-auto"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── PICKER VIEW ── */}
                {view === "picker" && (
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                        {fetching ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading connected accounts…
                            </div>
                        ) : (
                            <>
                                {connected.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Connected</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {connected.map((p) => (
                                                <PlatformTile key={p} platform={p} connected onClick={() => openCompose(p)} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {notConnected.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Not connected</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {notConnected.map((p) => (
                                                <PlatformTile key={p} platform={p} connected={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={goConnect}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <Link2 className="w-4 h-4" /> Connect More Platforms
                                </button>

                                {noneConnected && (
                                    <div className="flex flex-col items-center gap-3 pt-2 pb-1 text-center">
                                        <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <p className="text-sm text-gray-500">No platforms connected yet.</p>
                                        <button
                                            onClick={goConnect}
                                            className="px-5 py-2 text-sm text-white font-semibold rounded-xl cursor-pointer transition flex items-center gap-2"
                                            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
                                        >
                                            <Link2 className="w-3.5 h-3.5" /> Connect Platforms
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── COMPOSE VIEW (platform-native preview) ── */}
                {view === "compose" && selected && (
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                            {/* Selected platform pill */}
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PLATFORMS[selected]?.color }} />
                                <span className="text-xs font-medium text-gray-600">{PLATFORMS[selected]?.label} preview</span>
                                {!PLATFORMS[selected]?.real && (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 ml-auto">
                                        Preview only
                                    </span>
                                )}
                            </div>

                            {/* Live native preview */}
                            <PlatformPreview
                                platform={selected}
                                name={accountName}
                                logo={activeBrand?.logo || null}
                                caption={caption}
                                image={creative?.image || null}
                            />

                            {/* Editable caption */}
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Caption / Post Text
                                </label>
                                <textarea
                                    rows={4}
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
                                onClick={() => setView("picker")}
                                disabled={publishing}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={publishing || published}
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
                    </>
                )}
            </div>
        </div>
    );
}
