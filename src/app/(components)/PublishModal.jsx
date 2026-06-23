"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    X, Send, Loader2, Check, AlertCircle, Link2, ArrowLeft, CalendarClock, Megaphone,
    Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Globe, MoreHorizontal,
} from "lucide-react";
import {
    FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaYoutube,
    FaPinterest, FaTwitter, FaSnapchatGhost, FaGoogle,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { publishToFacebook, publishToInstagram, publishToMetaAds, publishToGoogleAds, publishToTikTokAds, publishToPinterestAds, publishToLinkedInAds, publishToSnapchatAds, publishToYouTube, publishToTwitter, publishToLinkedIn, publishToPinterest, publishToTikTok, fetchPinterestBoards } from "@/(lib)/integration";
import { LINKEDIN_POSTING_ENABLED } from "@/(lib)/linkedinConfig";

// ── Platform catalog ─────────────────────────────────────────────────────────
// `kind` decides which list shows for a creative's category.
// `real` = we have a working publisher; everything else is a stub for now.
const PLATFORMS = {
    facebook:      { label: "Facebook Page",        kind: "social", color: "#1877F2", Icon: FaFacebook,      real: true  },
    instagram:     { label: "Instagram Business",   kind: "social", color: "#E1306C", Icon: FaInstagram,     real: true  },
    tiktok:        { label: "TikTok",               kind: "social", color: "#010101", Icon: FaTiktok,        real: true  },
    twitter:       { label: "X / Twitter",          kind: "social", color: "#14171A", Icon: FaTwitter,       real: true  },
    linkedin:      { label: "LinkedIn",             kind: "social", color: "#0A66C2", Icon: FaLinkedin,      real: LINKEDIN_POSTING_ENABLED },
    youtube:       { label: "YouTube",              kind: "social", color: "#FF0000", Icon: FaYoutube,       real: true  },
    pinterest:     { label: "Pinterest",            kind: "social", color: "#E60023", Icon: FaPinterest,     real: true  },
    meta_ads:      { label: "Meta Ads Manager",     kind: "ads",    color: "#0668E1", Icon: FaFacebook,      real: true  },
    google_ads:    { label: "Google Ads",           kind: "ads",    color: "#4285F4", Icon: FaGoogle,        real: true  },
    tiktok_ads:    { label: "TikTok Ads",           kind: "ads",    color: "#010101", Icon: FaTiktok,        real: true  },
    linkedin_ads:  { label: "LinkedIn Ads",         kind: "ads",    color: "#0A66C2", Icon: FaLinkedin,      real: true  },
    snapchat_ads:  { label: "Snapchat Ads",         kind: "ads",    color: "#FFC400", Icon: FaSnapchatGhost, real: true  },
    pinterest_ads: { label: "Pinterest Ads",        kind: "ads",    color: "#E60023", Icon: FaPinterest,     real: true  },
};

// Order tiles appear in, per kind.
const SOCIAL_ORDER = ["facebook", "instagram", "tiktok", "twitter", "linkedin", "youtube", "pinterest"];
const ADS_ORDER    = ["meta_ads", "google_ads", "tiktok_ads", "linkedin_ads", "snapchat_ads", "pinterest_ads"];

// Minimal Meta-ad form options.
const AD_GOALS = [
    { value: "awareness",  label: "Awareness — more people see it" },
    { value: "traffic",    label: "Traffic — visit your website" },
    { value: "engagement", label: "Engagement — likes / comments / messages" },
];
const MIN_AD_BUDGET = 2000; // minimum daily budget the form allows
// TikTok ad groups need a numeric location id (NOT an ISO code). These are TikTok's
// GeoNames-style region ids — ⚠️ verify against TikTok's /tools/region/get/ per advertiser;
// a wrong id makes the ad group fail. Countries missing here block tiktok_ads publish.
const TIKTOK_LOCATION_IDS = {
    NG: "2328926", US: "6252001", GB: "2635167", CA: "6251999", GH: "2300660",
    KE: "192950", ZA: "953987", IN: "1269750", AU: "2077456", DE: "2921044",
    FR: "3017382", AE: "290557",
};
const AD_COUNTRIES = [
    { code: "NG", name: "Nigeria" }, { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" }, { code: "CA", name: "Canada" },
    { code: "GH", name: "Ghana" }, { code: "KE", name: "Kenya" },
    { code: "ZA", name: "South Africa" }, { code: "IN", name: "India" },
    { code: "AU", name: "Australia" }, { code: "DE", name: "Germany" },
    { code: "FR", name: "France" }, { code: "AE", name: "United Arab Emirates" },
];

// A creative's category → which platform list to show.
const platformsForCategory = (category) =>
    String(category).toLowerCase() === "ads" ? ADS_ORDER : SOCIAL_ORDER;

// Build a default caption from the creative's copy object.
const captionFromCopy = (copy = {}) =>
    copy.headline
        ? `${copy.headline}${copy.tagline ? ` — ${copy.tagline}` : ""}${copy.body ? `\n\n${copy.body}` : ""}${copy.cta ? `\n\n${copy.cta}` : ""}`
        : copy.body || copy.tagline || "";

// What actually gets published: UPPERCASE the headline (first paragraph) for real,
// so Facebook receives capitalized text (CSS `uppercase` only affects the preview).
const captionForPublish = (text = "") => {
    const idx = text.indexOf("\n\n");
    return idx === -1 ? text.toUpperCase() : text.slice(0, idx).toUpperCase() + text.slice(idx);
};

// Route external http(s) images through our proxy so they load CORS-safe (same-origin)
// when drawn onto a canvas — otherwise canvas export taints/drops them. Leaves data:/blob: alone.
const proxiedSrc = (src) =>
    typeof src === "string" && /^https?:\/\//i.test(src)
        ? `/api/proxy-image?url=${encodeURIComponent(src)}`
        : src;

// ── Design visual ─────────────────────────────────────────────────────────────
// Renders the actual creative: a rendered image_url if present, otherwise the
// canvas+elements (same as the My Creations cards) so the post shows the real design.
function DesignCanvas({ canvas, elements }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const c = canvasRef.current;
        if (!c || !canvas) return;
        const ctx = c.getContext("2d");
        const { width, height, background } = canvas;
        c.width = width; c.height = height;
        ctx.fillStyle = background || "#ffffff";
        ctx.fillRect(0, 0, width, height);
        (elements || []).forEach((el) => {
            ctx.save();
            ctx.globalAlpha = el.opacity ?? 1;
            if (el.rotation) {
                const cx = el.x + (el.width || 0) / 2, cy = el.y + (el.height || 0) / 2;
                ctx.translate(cx, cy); ctx.rotate((el.rotation * Math.PI) / 180); ctx.translate(-cx, -cy);
            }
            if (el.type === "shape") {
                ctx.fillStyle = el.fill || "transparent";
                ctx.strokeStyle = el.stroke || "transparent";
                ctx.lineWidth = el.strokeWidth || 0;
                if (el.shape === "circle") {
                    const r = (el.width || 0) / 2;
                    ctx.beginPath(); ctx.arc(el.x + r, el.y + r, r, 0, Math.PI * 2); ctx.fill();
                    if (el.strokeWidth) ctx.stroke();
                } else if (el.shape === "triangle") {
                    const w = el.width || 0, h = el.height || 0;
                    ctx.beginPath(); ctx.moveTo(el.x + w / 2, el.y); ctx.lineTo(el.x + w, el.y + h); ctx.lineTo(el.x, el.y + h); ctx.closePath(); ctx.fill();
                    if (el.strokeWidth) ctx.stroke();
                } else {
                    const r = el.borderRadius || 0;
                    if (r) { ctx.beginPath(); ctx.roundRect(el.x, el.y, el.width, el.height, r); ctx.fill(); if (el.strokeWidth) ctx.stroke(); }
                    else { ctx.fillRect(el.x, el.y, el.width, el.height); if (el.strokeWidth) ctx.strokeRect(el.x, el.y, el.width, el.height); }
                }
            }
            if (el.type === "text") {
                const size = el.fontSize || 16;
                ctx.font = `${el.fontWeight || "normal"} ${size}px 'DM Sans', sans-serif`;
                ctx.fillStyle = el.fill || el.color || "#000000";
                const align = el.textAlign || "left";
                ctx.textAlign = align;
                const x = align === "center" ? el.x + (el.width || 0) / 2 : align === "right" ? el.x + (el.width || 0) : el.x;
                const textContent = typeof el.content === "string" ? el.content : typeof el.text === "string" ? el.text : "";
                const words = textContent.trim().split(/\s+/);
                const lineMaxW = el.width || 9999;
                let line = "", lineY = el.y + size;
                words.forEach((word) => {
                    const test = line ? line + " " + word : word;
                    if (ctx.measureText(test).width > lineMaxW && line) { ctx.fillText(line, x, lineY); line = word; lineY += size * 1.35; }
                    else line = test;
                });
                if (line) ctx.fillText(line, x, lineY);
            }
            if (el.type === "image" && el.src) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => c.getContext("2d").drawImage(img, el.x, el.y, el.width, el.height);
                img.src = proxiedSrc(el.src);
            }
            ctx.restore();
        });
    }, [canvas, elements]);
    if (!canvas) return null;
    return <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />;
}

const DesignVisual = ({ image, canvas, elements, className = "" }) => {
    if (image) return <img src={image} alt="" className={`w-full object-cover ${className}`} />;
    if (canvas) return <div className="w-full bg-gray-50"><DesignCanvas canvas={canvas} elements={elements} /></div>;
    return null;
};

// Render a canvas-based design (canvas + elements) to a PNG File so it can be uploaded
// and published. Preloads all image elements first so they're baked into the export.
async function renderDesignToFile(canvas, elements, filename = "creative.png") {
    if (!canvas) return null;
    const { width, height, background } = canvas;
    const off = document.createElement("canvas");
    off.width = width; off.height = height;
    const ctx = off.getContext("2d");
    ctx.fillStyle = background || "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Preload image elements up front (async) so they're drawn before we export.
    const imgEls = (elements || []).filter((el) => el.type === "image" && el.src);
    const loaded = await Promise.all(imgEls.map((el) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve([el, img]);
        img.onerror = () => resolve(null);
        img.src = proxiedSrc(el.src);
    })));
    const imgMap = new Map(loaded.filter(Boolean));

    (elements || []).forEach((el) => {
        ctx.save();
        ctx.globalAlpha = el.opacity ?? 1;
        if (el.rotation) {
            const cx = el.x + (el.width || 0) / 2, cy = el.y + (el.height || 0) / 2;
            ctx.translate(cx, cy); ctx.rotate((el.rotation * Math.PI) / 180); ctx.translate(-cx, -cy);
        }
        if (el.type === "shape") {
            ctx.fillStyle = el.fill || "transparent";
            ctx.strokeStyle = el.stroke || "transparent";
            ctx.lineWidth = el.strokeWidth || 0;
            if (el.shape === "circle") {
                const r = (el.width || 0) / 2;
                ctx.beginPath(); ctx.arc(el.x + r, el.y + r, r, 0, Math.PI * 2); ctx.fill();
                if (el.strokeWidth) ctx.stroke();
            } else if (el.shape === "triangle") {
                const w = el.width || 0, h = el.height || 0;
                ctx.beginPath(); ctx.moveTo(el.x + w / 2, el.y); ctx.lineTo(el.x + w, el.y + h); ctx.lineTo(el.x, el.y + h); ctx.closePath(); ctx.fill();
                if (el.strokeWidth) ctx.stroke();
            } else {
                const r = el.borderRadius || 0;
                if (r) { ctx.beginPath(); ctx.roundRect(el.x, el.y, el.width, el.height, r); ctx.fill(); if (el.strokeWidth) ctx.stroke(); }
                else { ctx.fillRect(el.x, el.y, el.width, el.height); if (el.strokeWidth) ctx.strokeRect(el.x, el.y, el.width, el.height); }
            }
        }
        if (el.type === "text") {
            const size = el.fontSize || 16;
            ctx.font = `${el.fontWeight || "normal"} ${size}px 'DM Sans', sans-serif`;
            ctx.fillStyle = el.fill || el.color || "#000000";
            const align = el.textAlign || "left";
            ctx.textAlign = align;
            const x = align === "center" ? el.x + (el.width || 0) / 2 : align === "right" ? el.x + (el.width || 0) : el.x;
            const textContent = typeof el.content === "string" ? el.content : typeof el.text === "string" ? el.text : "";
            const words = textContent.trim().split(/\s+/);
            const lineMaxW = el.width || 9999;
            let line = "", lineY = el.y + size;
            words.forEach((word) => {
                const test = line ? line + " " + word : word;
                if (ctx.measureText(test).width > lineMaxW && line) { ctx.fillText(line, x, lineY); line = word; lineY += size * 1.35; }
                else line = test;
            });
            if (line) ctx.fillText(line, x, lineY);
        }
        if (el.type === "image" && imgMap.has(el)) {
            ctx.drawImage(imgMap.get(el), el.x, el.y, el.width, el.height);
        }
        ctx.restore();
    });

    return await new Promise((resolve, reject) => {
        try {
            off.toBlob((blob) => {
                resolve(blob ? new File([blob], filename, { type: "image/png" }) : null);
            }, "image/png");
        } catch (err) {
            // Cross-origin images without CORS headers "taint" the canvas and block export.
            reject(err);
        }
    });
}

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
const Avatar = ({ name, color, logo }) => {
    // Fall back to the brand initial if there's no logo OR the logo fails to load.
    const [broken, setBroken] = useState(false);
    const showImg = logo && !broken;
    return (
        <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-white text-sm font-bold"
            style={{ background: color }}
        >
            {showImg
                ? <img src={logo} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
                : (name?.[0]?.toUpperCase() || "B")}
        </div>
    );
};

// Borderless, auto-growing textarea that blends into the post body.
const AutoTextarea = ({ value, onChange, placeholder, className = "" }) => {
    const ref = useRef(null);
    const grow = () => {
        const el = ref.current;
        if (el) { el.style.height = "auto"; el.style.height = `${Math.max(el.scrollHeight, 22)}px`; }
    };
    useEffect(grow, [value]);
    return (
        <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => { onChange?.(e.target.value); grow(); }}
            onFocus={grow}
            placeholder={placeholder}
            style={{ minHeight: 22 }}
            className={`block w-full resize-none bg-transparent outline-none leading-snug placeholder-gray-400 align-top ${className}`}
        />
    );
};

// Caption editor — the preview IS the composer. The first paragraph (the headline,
// up to the first blank line) renders BOLD; the rest is the body. Both editable;
// they recombine into the single caption string with "\n\n" between them.
const EditableCaption = ({ value, onChange, placeholder, prefix = null, className = "" }) => {
    const idx = value.indexOf("\n\n");
    const headline = idx === -1 ? value : value.slice(0, idx);
    const body = idx === -1 ? "" : value.slice(idx + 2);
    const setHeadline = (h) => onChange?.(body ? `${h}\n\n${body}` : h);
    const setBody = (b) => onChange?.(b ? `${headline}\n\n${b}` : headline);
    return (
        <div className={`px-3 text-sm text-gray-800 ${className}`}>
            {prefix}
            <AutoTextarea value={headline} onChange={setHeadline} placeholder={placeholder} className="uppercase" />
            <AutoTextarea value={body} onChange={setBody} placeholder="Write more…" className="mt-1" />
        </div>
    );
};

const FacebookPreview = ({ name, logo, caption, onCaptionChange, image, canvas, elements }) => (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 p-3">
            <Avatar name={name} color="#1877F2" logo={logo} />
            <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">Sponsored · <Globe className="w-3 h-3" /></p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
        <EditableCaption value={caption} onChange={onCaptionChange} placeholder="What's on your mind?" className="pb-2" />
        <DesignVisual image={image} canvas={canvas} elements={elements} className="max-h-72" />
        <div className="flex items-center justify-around px-3 py-2 border-t border-gray-100 text-gray-500 text-xs font-medium">
            <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> Like</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Comment</span>
            <span className="flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share</span>
        </div>
    </div>
);

const InstagramPreview = ({ name, logo, caption, onCaptionChange, image, canvas, elements }) => (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 p-3">
            <Avatar name={name} color="#E1306C" logo={logo} />
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <MoreHorizontal className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
        <DesignVisual image={image} canvas={canvas} elements={elements} className="aspect-square" />
        <div className="flex items-center gap-4 px-3 pt-2.5 text-gray-800">
            <Heart className="w-5 h-5" />
            <MessageCircle className="w-5 h-5" />
            <Share2 className="w-5 h-5" />
            <Bookmark className="w-5 h-5 ml-auto" />
        </div>
        <EditableCaption
            value={caption}
            onChange={onCaptionChange}
            placeholder="Write a caption…"
            className="py-2"
            prefix={<span className="font-semibold mr-1 align-top leading-snug">{name}</span>}
        />
    </div>
);

const GenericPreview = ({ platform, name, logo, caption, onCaptionChange, image, canvas, elements }) => {
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
            <EditableCaption value={caption} onChange={onCaptionChange} placeholder="Write a caption…" className="pb-2" />
            <DesignVisual image={image} canvas={canvas} elements={elements} className="max-h-72" />
        </div>
    );
};

const PlatformPreview = ({ platform, ...rest }) => {
    if (platform === "facebook") return <FacebookPreview {...rest} />;
    if (platform === "instagram") return <InstagramPreview {...rest} />;
    return <GenericPreview platform={platform} {...rest} />;
};

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PublishModal({ creative, onClose, showToast, startInSchedule = false }) {
    const { fetchIntegrations, activeBrand, uploadImage } = useAuth();
    const router = useRouter();

    const [integrations, setIntegrations] = useState([]);
    const [fetching, setFetching]         = useState(true);
    const [view, setView]                 = useState("picker");   // "picker" | "compose"
    const [selected, setSelected]         = useState(null);       // platform id
    const [caption, setCaption]           = useState("");
    const [publishing, setPublishing]     = useState(false);
    const [busyAction, setBusyAction]     = useState(null);  // 'publish' | 'schedule' | null
    const [published, setPublished]       = useState(false);
    const [showSchedule, setShowSchedule] = useState(false); // schedule picker visible
    const [scheduleAt, setScheduleAt]     = useState("");    // datetime-local value
    // Meta-ad form (only used when selected === "meta_ads")
    const [adGoal, setAdGoal]       = useState("traffic");
    const [adBudget, setAdBudget]   = useState("");
    const [adDays, setAdDays]       = useState("7");
    const [adCountry, setAdCountry] = useState("NG");
    // Pinterest board picker (only used when selected === "pinterest")
    const [pinBoards, setPinBoards]         = useState([]);
    const [pinBoardId, setPinBoardId]       = useState("");
    const [pinBoardsLoading, setPinBoardsLoading] = useState(false);
    const [pinBoardsError, setPinBoardsError]     = useState("");

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
                const arr = Array.isArray(data) ? data : [];
                if (alive) {
                    setIntegrations(arr);
                    // Opened via the Schedule button → jump straight into Facebook's
                    // compose view with the schedule picker open (FB is the only schedulable platform).
                    if (startInSchedule && arr.some((i) => i.platform === "facebook")) {
                        setSelected("facebook");
                        setView("compose");
                        setShowSchedule(true);
                    }
                }
            } catch {
                if (alive) setIntegrations([]);
            } finally {
                if (alive) setFetching(false);
            }
        })();
        return () => { alive = false; };
    }, [fetchIntegrations]);

    // Load the user's Pinterest boards when Pinterest is the selected platform (a pin
    // must go on a board). Defaults to the first board.
    useEffect(() => {
        // Both organic Pinterest and Pinterest Ads need a board (the ad promotes a pin).
        if (selected !== "pinterest" && selected !== "pinterest_ads") return;
        const integration = integrations.find((i) => i.platform === selected);
        if (!integration?.int_token) return;
        let alive = true;
        setPinBoardsLoading(true);
        setPinBoardsError("");
        (async () => {
            try {
                const boards = await fetchPinterestBoards(integration.int_token);
                if (!alive) return;
                setPinBoards(boards);
                setPinBoardId((prev) => prev || boards[0]?.id || "");
                if (!boards.length) setPinBoardsError("No boards found — create a board on Pinterest first.");
            } catch (err) {
                if (alive) setPinBoardsError(err.message || "Couldn't load boards.");
            } finally {
                if (alive) setPinBoardsLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [selected, integrations]);

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
    // scheduledUnix (seconds) → schedule on Facebook; null/undefined → post now.
    const handlePublish = useCallback(async (scheduledUnix = null) => {
        if (!selected || !creative) return;
        const integration = integrations.find((i) => i.platform === selected);
        if (!integration) return;

        setPublishing(true);
        setBusyAction(scheduledUnix ? "schedule" : "publish");
        try {
            const cap = captionForPublish(caption.trim());

            // Resolve a real, publishable image URL.
            // Canvas-based designs have no image_url — render them to a PNG, upload it,
            // and publish the returned public URL (platforms can't fetch browser canvases).
            let imageUrl = creative.image || null;
            if (!imageUrl && creative.canvas) {
                try {
                    const file = await renderDesignToFile(
                        creative.canvas,
                        creative.elements,
                        `${creative.name || "creative"}.png`,
                    );
                    if (file) {
                        const up = await uploadImage(file);
                        // Upload returns { success, message, image: "https://files.creativeklux.com/…png" }.
                        // Cover sibling field names defensively.
                        const d = up?.data ?? up;
                        const pick = (o) => o?.image || o?.image_url || o?.url || o?.path || o?.src || null;
                        imageUrl = pick(up) || pick(d) || (Array.isArray(d) ? pick(d[0]) : null);
                    }
                } catch (err) {
                    console.warn("renderDesignToFile/upload failed:", err);
                    throw new Error("Couldn't prepare the design image for publishing. Try downloading it first.");
                }
                if (!imageUrl) throw new Error("Couldn't prepare the design image for publishing.");
            }

            if (selected === "facebook") {
                await publishToFacebook({
                    access_token: integration.int_token,
                    page_id: integration.int_id,
                    image_url: imageUrl,
                    caption: cap,
                    scheduled_publish_time: scheduledUnix || undefined,
                });
            } else if (selected === "instagram") {
                await publishToInstagram({
                    access_token: integration.int_token,
                    ig_user_id: integration.int_id,
                    image_url: imageUrl,
                    caption: cap,
                });
            } else if (selected === "meta_ads") {
                // Real Meta ad (campaign→ad set→creative→ad). Runs "as" a connected FB Page.
                const fb = integrations.find((i) => i.platform === "facebook");
                if (!fb) throw new Error("Connect a Facebook Page first — Meta ads run as a Page.");
                if (!adBudget || Number(adBudget) < MIN_AD_BUDGET) throw new Error(`Daily budget must be at least ${MIN_AD_BUDGET.toLocaleString()}.`);
                await publishToMetaAds({
                    access_token: integration.int_token,
                    ad_account_id: integration.int_id,
                    page_id: fb.int_id,
                    image_url: imageUrl,
                    message: cap,
                    link: activeBrand?.url || undefined,
                    goal: adGoal,
                    daily_budget: Number(adBudget),
                    days: Number(adDays) || 7,
                    country: adCountry,
                    ad_name: creative?.name,
                });
            } else if (selected === "google_ads") {
                // Real Google Ads Display campaign + Responsive Display Ad — runs server-side
                // (/api/google-ads/publish) and is created PAUSED (won't spend until reviewed).
                if (!integration.int_refresh_token) throw new Error("Reconnect Google Ads — no refresh token stored for this account.");
                if (!adBudget || Number(adBudget) < MIN_AD_BUDGET) throw new Error(`Daily budget must be at least ${MIN_AD_BUDGET.toLocaleString()}.`);
                const text = caption.trim();
                const firstLine = text.split("\n")[0]?.trim();
                await publishToGoogleAds({
                    refresh_token: integration.int_refresh_token,
                    customer_id: integration.int_id,
                    image_url: imageUrl,
                    final_url: activeBrand?.url || undefined,
                    headline: (firstLine || creative?.name || "").slice(0, 30),
                    long_headline: (firstLine || creative?.name || "").slice(0, 90),
                    description: text.slice(0, 90),
                    business_name: activeBrand?.name || creative?.name,
                    daily_budget: Number(adBudget),
                    campaign_name: creative?.name,
                });
            } else if (selected === "tiktok_ads") {
                // Real TikTok ad (campaign→ad group→ad), server-side. The image is bridged to
                // a short video. Created PAUSED. Country → TikTok location id.
                if (!adBudget || Number(adBudget) < MIN_AD_BUDGET) throw new Error(`Daily budget must be at least ${MIN_AD_BUDGET.toLocaleString()}.`);
                const locId = TIKTOK_LOCATION_IDS[adCountry];
                if (!locId) throw new Error("Pick a target country that's mapped to a TikTok region.");
                await publishToTikTokAds({
                    access_token: integration.int_token,
                    advertiser_id: integration.int_id,
                    image_url: imageUrl,
                    ad_text: cap,
                    landing_url: activeBrand?.url || undefined,
                    daily_budget: Number(adBudget),
                    campaign_name: creative?.name,
                    location_ids: [locId],
                });
            } else if (selected === "pinterest_ads") {
                // Real Pinterest promoted-pin ad (pin → campaign → ad group → ad), server-side,
                // created PAUSED. Reuses the connected Pinterest token + chosen board.
                if (!adBudget || Number(adBudget) < MIN_AD_BUDGET) throw new Error(`Daily budget must be at least ${MIN_AD_BUDGET.toLocaleString()}.`);
                if (!pinBoardId) throw new Error("Pick a Pinterest board first.");
                const text = caption.trim();
                const firstLine = text.split("\n")[0]?.trim();
                await publishToPinterestAds({
                    access_token: integration.int_token,
                    ad_account_id: integration.int_id,
                    board_id: pinBoardId,
                    image_url: imageUrl,
                    title: (firstLine || creative?.name || "").slice(0, 100),
                    description: text,
                    link: activeBrand?.url || undefined,
                    daily_budget: Number(adBudget),
                    campaign_name: creative?.name,
                });
            } else if (selected === "linkedin_ads") {
                // Real LinkedIn Sponsored Content ad (campaign group → campaign → post →
                // creative), server-side, created DRAFT/PAUSED. Runs as the Company Page that
                // owns the ad account (resolved server-side). Country → LinkedIn geo URN.
                if (!adBudget || Number(adBudget) < MIN_AD_BUDGET) throw new Error(`Daily budget must be at least ${MIN_AD_BUDGET.toLocaleString()}.`);
                await publishToLinkedInAds({
                    access_token: integration.int_token,
                    ad_account_id: integration.int_id,
                    image_url: imageUrl,
                    text: cap,
                    link: activeBrand?.url || undefined,
                    daily_budget: Number(adBudget),
                    campaign_name: creative?.name,
                    country: adCountry,
                });
            } else if (selected === "snapchat_ads") {
                // Real Snapchat single-image Snap ad (media → creative → campaign → ad squad →
                // ad), server-side, created PAUSED. Token refreshed server-side. Country → geo.
                if (!adBudget || Number(adBudget) < MIN_AD_BUDGET) throw new Error(`Daily budget must be at least ${MIN_AD_BUDGET.toLocaleString()}.`);
                const text = caption.trim();
                const firstLine = text.split("\n")[0]?.trim();
                await publishToSnapchatAds({
                    access_token: integration.int_token,
                    refresh_token: integration.int_refresh_token,
                    ad_account_id: integration.int_id,
                    image_url: imageUrl,
                    headline: (firstLine || creative?.name || "").slice(0, 34),
                    brand_name: activeBrand?.name || creative?.name,
                    link: activeBrand?.url || undefined,
                    daily_budget: Number(adBudget),
                    campaign_name: creative?.name,
                    country: adCountry,
                });
            } else if (selected === "pinterest") {
                // A pin is an image on a board. Pinterest fetches the public image URL itself.
                if (!pinBoardId) throw new Error("Pick a Pinterest board first.");
                const text = caption.trim();
                const firstLine = text.split("\n")[0]?.trim();
                await publishToPinterest({
                    access_token: integration.int_token,
                    board_id: pinBoardId,
                    title: (firstLine || creative?.name || "").slice(0, 100),
                    description: text,
                    image_url: imageUrl,
                    link: activeBrand?.url || undefined,
                });
            } else if (selected === "linkedin") {
                // LinkedIn posts server-side (no browser CORS). Author = the connected
                // member (int_id). Only reachable when LINKEDIN_POSTING_ENABLED is on
                // (gates the `real` flag), i.e. after LinkedIn approves w_member_social.
                await publishToLinkedIn({
                    access_token: integration.int_token,
                    author_id: integration.int_id,
                    text: cap,
                    image_url: imageUrl,
                });
            } else if (selected === "twitter") {
                // X posts server-side (no browser CORS). The route refreshes the 2h token,
                // optionally uploads the image, and posts. Refresh token comes from the
                // backend record (once it stores it) or localStorage; rotation handled inside.
                await publishToTwitter({
                    integration_id: integration.id,
                    refresh_token: integration.int_refresh_token,
                    text: cap,
                    image_url: imageUrl,
                });
            } else if (selected === "youtube") {
                // YouTube is video-only — the image (or rendered canvas) is converted to a
                // short video in-browser, then uploaded. Title = first line of the caption.
                const text = caption.trim();
                const firstLine = text.split("\n")[0]?.trim();
                await publishToYouTube({
                    access_token: integration.int_token,
                    title: (firstLine || creative?.name || "Creative Klux video").slice(0, 100),
                    description: text,
                    image_url: imageUrl,
                    // Scheduled → YouTube needs an ISO publishAt (it forces the video private
                    // until then); immediate → public.
                    privacyStatus: scheduledUnix ? "private" : "public",
                    publishAt: scheduledUnix ? new Date(scheduledUnix * 1000).toISOString() : undefined,
                });
            } else if (selected === "tiktok") {
                // TikTok posts server-side (no browser CORS) as an image-native PHOTO post —
                // TikTok fetches the public image URL itself. Refresh token comes from the
                // backend record or localStorage; rotation handled inside. Title = first line.
                const text = caption.trim();
                const firstLine = text.split("\n")[0]?.trim();
                await publishToTikTok({
                    integration_id: integration.id,
                    refresh_token: integration.int_refresh_token,
                    title: (firstLine || creative?.name || "").slice(0, 90),
                    description: cap,
                    image_url: imageUrl,
                });
            } else {
                // No live publisher yet — keep the UI wired.
                await new Promise((r) => setTimeout(r, 1200));
            }

            setPublished(true);
            showToast(
                scheduledUnix
                    ? `Scheduled for ${new Date(scheduledUnix * 1000).toLocaleString()}`
                    : selected === "meta_ads"
                        ? "Ad created and live on Meta!"
                        : `Published to ${PLATFORMS[selected]?.label || selected}!`,
                "success",
            );
            setTimeout(onClose, 1600);
        } catch (err) {
            showToast(err.message || "Publish failed", "error");
        } finally {
            setPublishing(false);
            setBusyAction(null);
        }
    }, [selected, integrations, creative, caption, onClose, showToast, uploadImage, activeBrand, adGoal, adBudget, adDays, adCountry, pinBoardId]);

    // Page/account display name for the preview
    const accountName = useMemo(() => {
        const i = integrations.find((x) => x.platform === selected);
        return i?.int_name || activeBrand?.name || PLATFORMS[selected]?.label || "Your Brand";
    }, [integrations, selected, activeBrand]);

    // Meta-ad form must be fully filled before the ad can be created.
    const metaAdIncomplete = selected === "meta_ads" && (
        !adGoal || !adCountry ||
        !adBudget || Number(adBudget) < MIN_AD_BUDGET ||
        !adDays || Number(adDays) < 1
    );

    // All ad platforms reuse the same form. Google Ads only needs the daily budget;
    // Meta + TikTok also use the country (TikTok maps it to a location id). Goal/run-days
    // are Meta-only.
    const isAdForm = selected === "meta_ads" || selected === "google_ads" || selected === "tiktok_ads" || selected === "pinterest_ads" || selected === "linkedin_ads" || selected === "snapchat_ads";
    const googleAdsIncomplete = selected === "google_ads" && (!adBudget || Number(adBudget) < MIN_AD_BUDGET);
    const tiktokAdsIncomplete = selected === "tiktok_ads" && (
        !adBudget || Number(adBudget) < MIN_AD_BUDGET || !TIKTOK_LOCATION_IDS[adCountry]
    );
    // Pinterest Ads needs both a budget AND a board (it promotes a pin).
    const pinterestAdsIncomplete = selected === "pinterest_ads" && (!adBudget || Number(adBudget) < MIN_AD_BUDGET || !pinBoardId);
    // LinkedIn Ads needs a budget (country defaults to US if unset).
    const linkedinAdsIncomplete = selected === "linkedin_ads" && (!adBudget || Number(adBudget) < MIN_AD_BUDGET);
    // Snapchat Ads needs a budget (country defaults to US if unset).
    const snapchatAdsIncomplete = selected === "snapchat_ads" && (!adBudget || Number(adBudget) < MIN_AD_BUDGET);

    // Organic Pinterest needs a board chosen before it can pin.
    const pinterestIncomplete = selected === "pinterest" && !pinBoardId;

    // ── Scheduling (Facebook + YouTube — both schedule natively) ──────────────────
    // FB holds an unpublished post; YouTube uploads private with a publishAt. IG/X have
    // no native API scheduling, so they're excluded.
    const SCHEDULABLE = ["facebook", "youtube"];
    const toLocalInput = (d) => {
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const scheduleMin = toLocalInput(new Date(Date.now() + 11 * 60 * 1000));         // 10-min floor (+1 buffer)
    const scheduleMax = toLocalInput(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)); // 6-month ceiling

    const toggleSchedule = () => {
        if (!SCHEDULABLE.includes(selected)) {
            showToast("Scheduling is only available for Facebook and YouTube right now", "error");
            return;
        }
        setShowSchedule((s) => !s);
    };

    const confirmSchedule = () => {
        if (!scheduleAt) { showToast("Pick a date & time", "error"); return; }
        const ts = new Date(scheduleAt).getTime();
        if (Number.isNaN(ts)) { showToast("Pick a valid date & time", "error"); return; }
        const now = Date.now();
        if (ts < now + 10 * 60 * 1000) { showToast("Schedule at least 10 minutes from now", "error"); return; }
        if (ts > now + 180 * 24 * 60 * 60 * 1000) { showToast("Schedule within 6 months", "error"); return; }
        handlePublish(Math.floor(ts / 1000));
    };

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[80] px-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

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

                            {/* For ads: form first (the main task), preview second (secondary). */}
                            {isAdForm && (
                                <div className="rounded-xl border border-gray-200 p-3 flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Megaphone className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Ad settings</span>
                                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 ml-auto">
                                            {selected === "meta_ads" ? "Spends real money" : "Created paused"}
                                        </span>
                                    </div>

                                    {/* Goal / Run-days / Country are Meta-only (the Google publisher ignores them). */}
                                    {selected === "meta_ads" && (
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Goal</span>
                                            <select value={adGoal} onChange={(e) => setAdGoal(e.target.value)}
                                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                                {AD_GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                                            </select>
                                        </label>
                                    )}

                                    <div className={selected === "meta_ads" ? "grid grid-cols-2 gap-2" : ""}>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Daily budget</span>
                                            <input type="number" min={MIN_AD_BUDGET} step="100" value={adBudget} onChange={(e) => setAdBudget(e.target.value)}
                                                placeholder={`Min ${MIN_AD_BUDGET.toLocaleString()}`}
                                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                            {adBudget !== "" && Number(adBudget) < MIN_AD_BUDGET && (
                                                <span className="text-[10px] text-red-500">Minimum daily budget is {MIN_AD_BUDGET.toLocaleString()}</span>
                                            )}
                                        </label>
                                        {selected === "meta_ads" && (
                                            <label className="flex flex-col gap-1">
                                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Run for (days)</span>
                                                <input type="number" min="1" value={adDays} onChange={(e) => setAdDays(e.target.value)}
                                                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                            </label>
                                        )}
                                    </div>

                                    {/* Country: Meta targets it directly; TikTok maps it to a location id; LinkedIn → geo URN; Snapchat → geo. */}
                                    {(selected === "meta_ads" || selected === "tiktok_ads" || selected === "linkedin_ads" || selected === "snapchat_ads") && (
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Show to people in</span>
                                            <select value={adCountry} onChange={(e) => setAdCountry(e.target.value)}
                                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                                {AD_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                                            </select>
                                            {selected === "tiktok_ads" && !TIKTOK_LOCATION_IDS[adCountry] && (
                                                <span className="text-[10px] text-red-500">This country isn’t mapped to a TikTok region yet — pick another.</span>
                                            )}
                                        </label>
                                    )}

                                    <p className="text-[10px] text-gray-400">
                                        {selected === "meta_ads"
                                            ? <>Ad goes <b>live immediately</b> and spends up to your daily budget. Sends clicks to {activeBrand?.url || "your brand website"}. Other settings (age 18-65, all genders, auto-bid) use smart defaults.</>
                                            : selected === "google_ads"
                                            ? <>Creates a <b>paused</b> Display campaign + Responsive Display Ad in Google Ads — review &amp; enable it in Ads Manager to start spending. Sends clicks to {activeBrand?.url || "your brand website"}.</>
                                            : selected === "tiktok_ads"
                                            ? <>Creates a <b>paused</b> TikTok campaign + video ad (your image becomes a short clip) — review &amp; enable it in TikTok Ads Manager to start spending. Sends clicks to {activeBrand?.url || "your brand website"}.</>
                                            : selected === "linkedin_ads"
                                            ? <>Creates a <b>draft/paused</b> LinkedIn Sponsored Content ad (runs as the Company Page that owns the ad account) — review &amp; activate it in LinkedIn Campaign Manager to start spending. Sends clicks to {activeBrand?.url || "your brand website"}.</>
                                            : selected === "snapchat_ads"
                                            ? <>Creates a <b>paused</b> Snapchat campaign + single-image Snap ad — review &amp; enable it in Snapchat Ads Manager to start spending. Snap ads are full-screen vertical (9:16). Sends clicks to {activeBrand?.url || "your brand website"}.</>
                                            : <>Creates a <b>paused</b> Pinterest campaign + promoted pin — review &amp; enable it in Pinterest Ads Manager to start spending. Sends clicks to {activeBrand?.url || "your brand website"}.</>}
                                    </p>
                                </div>
                            )}

                            {/* Pinterest (organic + ads): pick the board to pin to (required). */}
                            {(selected === "pinterest" || selected === "pinterest_ads") && (
                                <label className="rounded-xl border border-gray-200 p-3 flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pin to board</span>
                                    {pinBoardsLoading ? (
                                        <span className="text-sm text-gray-400 flex items-center gap-2 py-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading boards…</span>
                                    ) : pinBoardsError ? (
                                        <span className="text-[11px] text-red-500">{pinBoardsError}</span>
                                    ) : (
                                        <select
                                            value={pinBoardId}
                                            onChange={(e) => setPinBoardId(e.target.value)}
                                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                                        >
                                            {pinBoards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    )}
                                </label>
                            )}

                            {/* Live native preview — the post itself is editable (click the caption to type).
                                For ads it flows full-height (the whole modal body scrolls); for socials it
                                scrolls in its own box like the real platforms. */}
                            {isAdForm && (
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Preview</p>
                            )}
                            <div
                                className={isAdForm ? "-mx-1 px-1" : "overflow-y-auto -mx-1 px-1"}
                                style={isAdForm ? undefined : { maxHeight: "52vh" }}
                            >
                                <PlatformPreview
                                    platform={selected}
                                    name={accountName}
                                    logo={activeBrand?.logo || null}
                                    caption={caption}
                                    onCaptionChange={setCaption}
                                    image={creative?.image || null}
                                    canvas={creative?.canvas || null}
                                    elements={creative?.elements || []}
                                />
                            </div>
                            <p className="text-[11px] text-gray-400 text-right -mt-1">
                                Click the caption to edit · {caption.length} chars
                            </p>

                            {/* Schedule picker (Facebook + YouTube) */}
                            {showSchedule && (
                                <div className="rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Schedule for</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="datetime-local"
                                            value={scheduleAt}
                                            min={scheduleMin}
                                            max={scheduleMax}
                                            onChange={(e) => setScheduleAt(e.target.value)}
                                            className="flex-1 min-w-0 text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                        <button
                                            onClick={confirmSchedule}
                                            disabled={publishing || published}
                                            className="px-4 py-2 text-sm text-white rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0"
                                            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
                                        >
                                            {busyAction === "schedule"
                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scheduling…</>
                                                : <><CalendarClock className="w-3.5 h-3.5" /> Schedule</>}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400">{selected === "youtube" ? "YouTube" : "Facebook"} publishes it automatically · 10 min–6 months ahead.</p>
                                </div>
                            )}
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
                            {!isAdForm && (
                                <button
                                    onClick={toggleSchedule}
                                    disabled={publishing || published}
                                    className={`px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-2 font-medium ${
                                        showSchedule ? "border-blue-400 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700"
                                    }`}
                                >
                                    <CalendarClock className="w-3.5 h-3.5" /> Schedule
                                </button>
                            )}
                            <button
                                onClick={() => handlePublish()}
                                disabled={publishing || published || metaAdIncomplete || googleAdsIncomplete || tiktokAdsIncomplete || pinterestAdsIncomplete || linkedinAdsIncomplete || snapchatAdsIncomplete || pinterestIncomplete}
                                title={(metaAdIncomplete || googleAdsIncomplete || tiktokAdsIncomplete || linkedinAdsIncomplete || snapchatAdsIncomplete) ? "Fill in all ad settings first" : (pinterestAdsIncomplete) ? "Set a budget and pick a board" : pinterestIncomplete ? "Pick a board first" : undefined}
                                className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl cursor-pointer transition flex items-center gap-2 font-semibold"
                            >
                                {busyAction === "publish" ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {isAdForm ? "Creating ad…" : "Publishing…"}</>
                                ) : published ? (
                                    <><Check className="w-3.5 h-3.5" /> {isAdForm ? "Ad created!" : "Published!"}</>
                                ) : (
                                    <><Send className="w-3.5 h-3.5" /> {isAdForm ? "Create Ad" : "Publish Now"}</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
