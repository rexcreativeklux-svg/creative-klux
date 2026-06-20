"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Info, AlertCircle, Check, X } from "lucide-react";
import { openOAuthPopup, startOAuthRedirect } from "@/(lib)/oauth/page";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/app/(components)/Toast";
import { setStoredXRefresh, setStoredTikTokRefresh } from "@/(lib)/integration";

// ── SVG brand icons ─────────────────────────────────────────────────────────────
const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);
const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);
const TwitterXIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);
const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);
const YouTubeIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);
const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
);
const SnapchatIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.023.358-.032.535.45.24 1.597.772 2.745.772.272 0 .538-.033.792-.099.146-.04.286-.06.42-.06.134 0 .263.02.383.06.26.087.381.28.381.472 0 .558-.722.977-2.44 1.378-.202.047-.43.1-.641.163.08.224.217.567.36.875.497 1.088 1.263 1.744 2.362 1.744h.2c.127 0 .249.022.362.072.31.139.47.44.47.748 0 .668-.653 1.155-1.59 1.396-.467.12-.95.213-1.44.277-.23.03-.452.056-.67.09-.133.022-.271.048-.409.104-.138.056-.304.142-.5.254-.394.227-.93.537-1.716.537-.286 0-.576-.047-.862-.14-.564-.185-1.095-.367-1.594-.367-.49 0-.978.178-1.45.365-.277.104-.56.18-.848.18-.706 0-1.235-.307-1.626-.532-.195-.112-.362-.198-.5-.254-.138-.056-.276-.082-.409-.104-.218-.034-.44-.06-.67-.09-.49-.064-.973-.157-1.44-.277-.937-.241-1.59-.728-1.59-1.396 0-.308.16-.609.47-.748.113-.05.235-.072.362-.072h.2c1.1 0 1.865-.656 2.362-1.744.143-.308.28-.651.36-.875-.211-.063-.439-.116-.641-.163-1.718-.401-2.44-.82-2.44-1.378 0-.192.12-.385.382-.472.12-.04.248-.06.383-.06.134 0 .273.02.42.06.254.066.52.099.792.099 1.135 0 2.273-.522 2.737-.768l-.033-.535c-.104-1.628-.23-3.654.299-4.847C7.854 1.07 11.21.793 12.206.793z" />
    </svg>
);
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);
const MetaIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.357-2.602zm-10.201.553c1.265 0 2.058.791 3.11 2.416.28.436.758 1.28 1.155 1.985l.378.659c-1.388 2.388-2.18 3.665-2.834 4.414-.926 1.06-1.524 1.308-2.309 1.308-1.228 0-2.063-.926-2.394-2.234a9.967 9.967 0 0 1-.17-1.903c0-2.333.6-4.887 1.832-6.522.709-.951 1.436-1.123 2.232-1.123z" />
    </svg>
);
const GoogleAdsIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M2.678 11.338L8.648.816a2.717 2.717 0 0 1 3.762-.966 2.717 2.717 0 0 1 .966 3.762l-5.97 10.522a2.717 2.717 0 0 1-3.762.966 2.717 2.717 0 0 1-.966-3.762zm14.889 7.669a2.717 2.717 0 1 1-2.717-2.717 2.717 2.717 0 0 1 2.717 2.717zm3.267-7.687l-5.97-10.51A2.717 2.717 0 0 1 18.626.844l5.97 10.51a2.717 2.717 0 0 1-3.762 1.966z" />
    </svg>
);
const TikTokAdsIcon = TikTokIcon;
const LinkedInAdsIcon = LinkedInIcon;
const SnapchatAdsIcon = SnapchatIcon;
const PinterestAdsIcon = PinterestIcon;

// ── Platform config ─────────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
    { id: "facebook", name: "Facebook Pages", description: "Publish posts & images to your Facebook Pages.", Icon: FacebookIcon, iconBg: "linear-gradient(135deg, #1877F2, #0C5FCA)" },
    { id: "instagram", name: "Instagram Business", description: "Publish photos & reels to Instagram Business accounts.", Icon: InstagramIcon, iconBg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)" },
    { id: "twitter", name: "X / Twitter", description: "Post tweets, images, and videos to X (Twitter).", Icon: TwitterXIcon, iconBg: "linear-gradient(135deg, #14171A, #333)" },
    { id: "linkedin", name: "LinkedIn", description: "Share posts and articles on LinkedIn personal & company pages.", Icon: LinkedInIcon, iconBg: "linear-gradient(135deg, #0A66C2, #004182)" },
    { id: "youtube", name: "YouTube", description: "Upload videos and manage your YouTube channel.", Icon: YouTubeIcon, iconBg: "linear-gradient(135deg, #FF0000, #CC0000)" },
    { id: "pinterest", name: "Pinterest", description: "Create pins and manage Pinterest boards for your brand.", Icon: PinterestIcon, iconBg: "linear-gradient(135deg, #E60023, #ad081b)" },
    { id: "snapchat", name: "Snapchat", description: "Publish Stories and Spotlight content to Snapchat.", Icon: SnapchatIcon, iconBg: "linear-gradient(135deg, #FFFC00, #f0ed00)" },
    { id: "tiktok", name: "TikTok", description: "Publish videos and create TikTok content.", Icon: TikTokIcon, iconBg: "linear-gradient(135deg, #161823, #010101)" },
];

const AD_PLATFORMS = [
    { id: "meta_ads", name: "Meta Ads Manager", description: "Create & manage Facebook and Instagram ad campaigns.", Icon: MetaIcon, iconBg: "linear-gradient(135deg, #0668E1, #1877F2)" },
    { id: "google_ads", name: "Google Ads", description: "Manage Google Search, Display & YouTube ad campaigns.", Icon: GoogleAdsIcon, iconBg: "linear-gradient(135deg, #4285F4, #34A853)" },
    { id: "tiktok_ads", name: "TikTok Ads", description: "Launch and manage TikTok ad campaigns.", Icon: TikTokAdsIcon, iconBg: "linear-gradient(135deg, #161823, #010101)" },
    { id: "linkedin_ads", name: "LinkedIn Campaign Manager", description: "Run B2B ad campaigns on LinkedIn.", Icon: LinkedInAdsIcon, iconBg: "linear-gradient(135deg, #0A66C2, #004182)" },
    { id: "snapchat_ads", name: "Snapchat Ads", description: "Create and manage Snapchat advertising campaigns.", Icon: SnapchatAdsIcon, iconBg: "linear-gradient(135deg, #FFFC00, #f0ed00)" },
    { id: "pinterest_ads", name: "Pinterest Ads", description: "Run Pinterest ad campaigns and promoted pins.", Icon: PinterestAdsIcon, iconBg: "linear-gradient(135deg, #E60023, #ad081b)" },
];

// ── Facebook Page Selector Modal ─────────────────────────────────────────────
const PlatformPageModal = ({ pages, onSelect, onClose, loading, selectedPageId }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
        <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Select a Page</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Choose which page to connect to this brand.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Page list */}
            <div className="p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
                {pages.map((page) => {
                    const isSelected = selectedPageId === page.id;
                    const isLoading = loading === page.id;
                    return (
                        <button
                            key={page.id}
                            onClick={() => onSelect(page)}
                            disabled={!!loading}
                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-surface hover:border-blue-300 hover:bg-blue-50/50"
                                }`}
                        >
                            {/* Page avatar */}
                            {page.picture?.data?.url ? (
                                <img
                                    src={page.picture.data.url}
                                    alt={page.name}
                                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                                />
                            ) : (
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                                    style={{ background: "linear-gradient(135deg, #1877F2, #0C5FCA)" }}
                                >
                                    {page.name?.charAt(0)?.toUpperCase() || "F"}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{page.name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">ID: {page.id}</p>
                            </div>

                            {isLoading ? (
                                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
                            ) : isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 pt-2">
                <button
                    onClick={onClose}
                    disabled={!!loading}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

// ── Platform Card ─────────────────────────────────────────────────────────────
const PlatformCard = ({
    platform,
    integrations,
    onConnect,
    onDisconnect,
    loadingPlatformId,
    loadingIntegrationId,
}) => {
    const { Icon } = platform;
    const isConnected = integrations.length > 0;
    const integration = integrations[0]; // first connected integration

    const isPending =
        loadingPlatformId === platform.id ||
        integrations.some(i => i.id === loadingIntegrationId);

    // Display name: use int_name if stored, else int_id, else nothing
    const connectedLabel = integration?.int_name || integration?.int_id || null;

    return (
        <div className="rounded-xl border bg-surface border-gray-200 hover:shadow transition-all">
            <div className="flex items-center gap-4 px-5 py-4">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ background: platform.iconBg }}
                >
                    <Icon />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{platform.name}</span>
                        {isConnected ? (
                            <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {connectedLabel ? connectedLabel : "Connected"}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                                Not connected
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{platform.description}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    {isConnected ? (
                        <button
                            onClick={() => onDisconnect(integration.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 cursor-pointer text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? "Disconnecting…" : "Disconnect"}
                        </button>
                    ) : (
                        <button
                            onClick={() => onConnect(platform.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 hover:scale-105 cursor-pointer text-xs text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #155dfc, #3b82f6)" }}
                        >
                            {isPending ? "Connecting…" : "Connect"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
    <h2 className="text-base font-bold text-gray-900 tracking-tight mb-3">{title}</h2>
);

// Platforms that must connect via a full-page redirect instead of a popup — their login
// can be a nested SSO (e.g. X / LinkedIn / Pinterest signed in via Google or Apple) that
// popups can't complete (partitioned cookies → blank page / login loop). Only plain social
// connects that resolve creds directly belong here — NOT the *_ads variants, which use the
// ad-account page-picker modal (popup-side state that the redirect path can't carry).
const REDIRECT_PLATFORMS = ["twitter", "linkedin", "pinterest", "tiktok"];

// ── Main Page ─────────────────────────────────────────────────────────────────
const IntegrationsPage = () => {
    const { saveIntegration, disconnectIntegration, fetchIntegrations, activeBrandId, token } = useAuth();

    // Facebook page selection state
    const [fbPages, setFbPages] = useState([]);
    const [showPageModal, setShowPageModal] = useState(false);
    const [fbLoadingPageId, setFbLoadingPageId] = useState(null); // which page button is loading
    // We stash the oauth result here so handleSelectPlatformPage can use it
    const [pendingFbOauth, setPendingFbOauth] = useState(null);

    const [loadingPlatformId, setLoadingPlatformId] = useState(null);
    const [loadingIntegrationId, setLoadingIntegrationId] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [integrations, setIntegrations] = useState([]);

    const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });
    const showToast = (message, type = "success") => setToast({ isOpen: true, message, type });
    const closeToast = () => setToast((prev) => ({ ...prev, isOpen: false }));

    // ── Fetch existing integrations on mount ──
    useEffect(() => {
        const load = async () => {
            setFetching(true);
            try {
                const data = await fetchIntegrations();
                if (Array.isArray(data)) setIntegrations(data);
            } catch (err) {
                console.error("Failed to load integrations:", err);
            } finally {
                setFetching(false);
            }
        };
        load();
    }, [fetchIntegrations]);

    async function resolveMetaIntegration(platformId, oauthResult) {
        const res = await fetch("/api/meta/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                access_token: oauthResult.access_token,
                code: oauthResult.code,
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Meta exchange failed");

        const userToken = data.access_token;

        const pagesRes = await fetch(
            `https://graph.facebook.com/v23.0/me/accounts?access_token=${userToken}&fields=id,name,access_token,picture,instagram_business_account{id,username}`
        );

        const pagesData = await pagesRes.json();
        if (pagesData.error) throw new Error(pagesData.error.message);

        const pages = pagesData.data || [];

        if (!pages.length) {
            throw new Error("No pages found");
        }

        return {
            type: "meta_pages",
            userToken,
            pages,
        };
    }

    async function resolveLinkedInIntegration(oauthResult) {
        const res = await fetch("/api/linkedin/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: oauthResult.code,
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "LinkedIn failed");

        return {
            type: "linkedin",
            int_token: data.access_token,
            int_id: data.int_id,
        };
    }

    async function resolveTwitterIntegration(oauthResult) {
        // Read the PKCE verifier that was stored before the popup opened
        const code_verifier = sessionStorage.getItem("creativeklux_pkce_verifier");
        if (!code_verifier) throw new Error("Missing PKCE verifier — please try connecting again.");

        const res = await fetch("/api/twitter/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: oauthResult.code,
                code_verifier,
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Twitter exchange failed");

        // Clean up the verifier
        sessionStorage.removeItem("creativeklux_pkce_verifier");

        return {
            type: "twitter",
            int_token: data.access_token,
            // X access tokens expire in 2h; the refresh_token mints new ones. We persist it
            // (localStorage now + sent to the backend) so posting keeps working past 2h.
            refresh_token: data.refresh_token,
            int_id: data.int_id,
            int_name: data.username ? `@${data.username}` : data.name,
        };
    }

    async function resolvePinterestIntegration(oauthResult) {
        const res = await fetch("/api/pinterest/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: oauthResult.code }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Pinterest exchange failed");

        return {
            type: "pinterest",
            int_token: data.access_token,
            int_id: data.int_id,
            int_name: data.name,
        };
    }

    // TikTok uses a code flow (popup/redirect returns a `code`). Exchange it server-side
    // (needs the client secret + no browser CORS) for tokens + the user's open_id.
    async function resolveTikTokIntegration(oauthResult) {
        const res = await fetch("/api/tiktok/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: oauthResult.code }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "TikTok exchange failed");

        return {
            type: "tiktok",
            int_token: data.access_token,
            // TikTok access tokens last ~24h; the refresh_token mints new ones. We persist
            // it (localStorage now + sent to the backend) so posting keeps working past 24h.
            refresh_token: data.refresh_token,
            int_id: data.int_id,
            int_name: data.name ? `@${data.name}` : "TikTok",
        };
    }

    async function resolveGoogleAdsIntegration(
        oauthResult
    ) {
        const res = await fetch(
            "/api/google/exchange",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    code: oauthResult.code,
                }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error ||
                "Google exchange failed"
            );
        }

        return {
            access_token: data.access_token,
            refresh_token:
                data.refresh_token,
            scope: data.scope, // scopes Google actually granted
        };
    }

    // YouTube uses Google's CODE flow (popup returns a `code`, not a token).
    // Exchange it for a token via /api/google/exchange (same route as google_ads),
    // then resolve the user's YouTube channel for int_id / int_name.
    async function resolveYouTubeIntegration(oauthResult) {
        // 1. code → token (reuses the Google exchange route)
        const tokenData = await resolveGoogleAdsIntegration(oauthResult);

        // Guard: Google only grants the YouTube scopes if YouTube Data API v3 is enabled
        // AND those scopes are added to the OAuth consent screen for THIS client. If they
        // were dropped, the token is useless for YouTube — fail with an actionable message
        // instead of the opaque "insufficient authentication scopes" from the API.
        if (tokenData.scope && !/auth\/youtube/.test(tokenData.scope)) {
            console.warn("YouTube connect — granted scopes:", tokenData.scope);
            throw new Error(
                "YouTube access wasn't granted. In Google Cloud (the project for this OAuth client): enable YouTube Data API v3 and add the youtube + youtube.upload scopes to the consent screen, then reconnect."
            );
        }

        // 2. fetch the connected YouTube channel
        const res = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );
        const data = await res.json();

        if (!res.ok) {
            const msg = data.error?.message || "Failed to fetch YouTube channel";
            // 403 insufficient scopes / API-not-enabled → point at the Google Cloud fix.
            if (/scope|insufficient|not been used|disabled/i.test(msg)) {
                throw new Error(
                    "YouTube rejected the connection (scope/API not enabled). In Google Cloud for this OAuth client: enable YouTube Data API v3 and add the youtube + youtube.upload scopes to the consent screen, then reconnect. (" + msg + ")"
                );
            }
            throw new Error(msg);
        }

        const channel = data.items?.[0];
        if (!channel) {
            throw new Error(
                "No YouTube channel found on this Google account. Create a YouTube channel, then try again."
            );
        }

        return {
            int_token: tokenData.access_token,
            int_id: channel.id,
            int_name: channel.snippet?.title || "YouTube Channel",
        };
    }

    async function fetchGoogleAdAccounts(
        access_token
    ) {
        const res = await fetch(
            "/api/google/ad-accounts",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    access_token,
                }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error ||
                "Failed to fetch Google ad accounts"
            );
        }

        return data.accounts || [];
    }

    async function resolveGenericIntegration(platformId, oauthResult) {
        let access_token = oauthResult.access_token;
        let int_id = null;

        switch (platformId) {
            case "google_ads": {
                const res = await fetch(
                    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
                );
                const data = await res.json();
                int_id = data.id;
                break;
            }

            case "pinterest":
            case "pinterest_ads": {
                const res = await fetch("https://api.pinterest.com/v5/user_account", {
                    headers: { Authorization: `Bearer ${access_token}` },
                });
                const data = await res.json();
                int_id = data.username || data.id;
                break;
            }

            case "snapchat":
            case "snapchat_ads": {
                const res = await fetch("https://adsapi.snapchat.com/v1/me", {
                    headers: { Authorization: `Bearer ${access_token}` },
                });
                const data = await res.json();
                int_id = data.me?.id;
                break;
            }
        }

        return {
            int_token: access_token,
            int_id,
        };
    }

    async function resolveIntegrationCredentials(platformId, oauthResult) {
        if (["facebook", "instagram", "meta_ads"].includes(platformId)) {
            // Fetch the user's Pages, then open the page-picker modal.
            // handleSelectPlatformPage saves the chosen page's token/id (and resolves
            // the IG business account / ad accounts for instagram / meta_ads).
            const { userToken, pages } = await resolveMetaIntegration(platformId, oauthResult);
            let pagePicks = pages.map((p) => ({
                id: p.id,
                name: p.name,
                access_token: p.access_token,
                _ig_user_id: p.instagram_business_account?.id || null,
                _ig_username: p.instagram_business_account?.username || null,
            }));
            // Instagram needs a linked IG Business/Creator account — only offer Pages that have one.
            if (platformId === "instagram") {
                pagePicks = pagePicks.filter((p) => p._ig_user_id);
                if (!pagePicks.length) {
                    throw new Error("No Instagram Business account found. Link an Instagram Business/Creator account to your Facebook Page, then try again.");
                }
            }
            setFbPages(pagePicks);
            setPendingFbOauth({ platformId, userToken });
            setShowPageModal(true);
            return null;
        }

        if (["linkedin", "linkedin_ads"].includes(platformId)) {
            return await resolveLinkedInIntegration(oauthResult);
        }

        if (platformId === "twitter") {
            return await resolveTwitterIntegration(oauthResult);
        }

        if (platformId === "google_ads") {

            const tokenData =
                await resolveGoogleAdsIntegration(
                    oauthResult
                );

            const adAccounts =
                await fetchGoogleAdAccounts(
                    tokenData.access_token
                );

            setFbPages(
                adAccounts.map(acc => ({
                    id: acc.id,
                    name: acc.name,
                }))
            );

            setPendingFbOauth({
                platformId: "google_ads",
                access_token:
                    tokenData.access_token,
            });

            setShowPageModal(true);

            return null;
        }

        // Pinterest organic — use backend exchange for long-lived token
        if (platformId === "pinterest") {
            return await resolvePinterestIntegration(oauthResult);
        }

        // Pinterest ads — exchange token first, then show ad account picker
        if (platformId === "pinterest_ads") {
            // First exchange the code for a real token via backend
            const tokenData = await resolvePinterestIntegration(oauthResult);

            const result = await resolvePinterestAdsIntegration({
                access_token: tokenData.int_token,
            });

            setFbPages(result.adAccounts.map(acc => ({
                id: acc.id,
                name: acc.name,
            })));
            setPendingFbOauth({
                platformId: "pinterest_ads",
                access_token: tokenData.int_token,
                userName: tokenData.int_name,
            });
            setShowPageModal(true);
            return null;
        }

        // YouTube — Google code flow: exchange code, then resolve the channel.
        if (platformId === "youtube") {
            return await resolveYouTubeIntegration(oauthResult);
        }

        // TikTok — code flow: exchange server-side for tokens + open_id.
        if (platformId === "tiktok") {
            return await resolveTikTokIntegration(oauthResult);
        }

        return await resolveGenericIntegration(platformId, oauthResult);
    }

    // Save resolved creds + post-save bookkeeping. Shared by the popup path and the
    // full-page redirect return path so the two can't drift.
    const finishConnect = useCallback(async (platformId, creds, brandId) => {
        const saved = await saveIntegration({
            platform: platformId,
            access_token: creds.int_token,
            refresh_token: creds.refresh_token, // X needs this to refresh its 2h token
            brand_id: brandId,
            int_id: creds.int_id,
            int_name: creds.int_name,
        });

        if (!saved.ok) {
            showToast(saved.message || "Failed to save integration", "error");
            return;
        }

        // X/Twitter: stash the refresh token in localStorage keyed by the saved integration
        // id (stopgap until the backend persists it). Posting reads it back to mint tokens.
        if (platformId === "twitter" && creds.refresh_token) {
            const savedId = saved.data?.id || saved.data?.data?.id || saved.id;
            if (savedId) setStoredXRefresh(savedId, creds.refresh_token);
        }

        // TikTok: same stopgap — its 24h token needs the refresh token to keep posting.
        if (platformId === "tiktok" && creds.refresh_token) {
            const savedId = saved.data?.id || saved.data?.data?.id || saved.id;
            if (savedId) setStoredTikTokRefresh(savedId, creds.refresh_token);
        }

        showToast(`${getPlatformName(platformId)} connected successfully!`, "success");
        setIntegrations((prev) => [
            ...prev,
            {
                id: saved.data?.id || saved.id,
                platform: platformId,
                int_id: creds.int_id,
                int_name: creds.int_name,
            },
        ]);
    }, [saveIntegration]);

    // ── Connect handler ──
    const handleConnect = useCallback(async (platformId) => {
        if (!activeBrandId) {
            showToast("Please select an active brand before connecting.", "error");
            return;
        }

        // Redirect platforms: log in via a full-page redirect instead of a popup, because
        // their login can be a nested SSO (e.g. X signed in via Google) which popups can't
        // complete. We persist what's needed and finish the connect on return (effect below).
        if (REDIRECT_PLATFORMS.includes(platformId)) {
            try {
                sessionStorage.setItem(
                    "creativeklux_oauth_pending",
                    JSON.stringify({ platform: platformId, brandId: activeBrandId }),
                );
                setLoadingPlatformId(platformId);
                await startOAuthRedirect(platformId); // navigates the whole tab away
            } catch (err) {
                setLoadingPlatformId(null);
                showToast(err.message || "Couldn't start the connection", "error");
            }
            return;
        }

        setLoadingPlatformId(platformId);
        try {
            const oauthResult = await openOAuthPopup(platformId);
            const creds = await resolveIntegrationCredentials(platformId, oauthResult);
            if (!creds) return;
            await finishConnect(platformId, creds, activeBrandId);
        } catch (err) {
            if (err.message === "cancelled") return;
            console.error("Connect error:", err);
            showToast(err.message || "Connection failed", "error");
        } finally {
            setLoadingPlatformId(null);
        }
    }, [activeBrandId, finishConnect]);

    // ── Finish a full-page redirect connect (X etc.) ──
    // On return, oauth-callback forwarded us to /integrations?oauth_code=…&oauth_state=…
    // Runs once auth is hydrated (needs `token` for saveIntegration).
    const redirectHandled = useRef(false);
    useEffect(() => {
        if (redirectHandled.current) return;
        const url = new URL(window.location.href);
        const code = url.searchParams.get("oauth_code");
        const oauthError = url.searchParams.get("oauth_error");
        const rawState = url.searchParams.get("oauth_state");
        if (!code && !oauthError) return;
        if (!token) return; // wait until the app session is restored

        redirectHandled.current = true;

        let pending = null;
        try { pending = JSON.parse(sessionStorage.getItem("creativeklux_oauth_pending") || "null"); } catch { /* ignore */ }
        const platform = pending?.platform || rawState?.replace(/_\d+$/, "") || null;

        // Clean the URL + pending state so a refresh can't replay it.
        window.history.replaceState({}, "", "/integrations");
        sessionStorage.removeItem("creativeklux_oauth_pending");

        if (!platform) return;

        (async () => {
            setLoadingPlatformId(platform);
            try {
                if (oauthError) throw new Error(oauthError);
                const creds = await resolveIntegrationCredentials(platform, { code, platform });
                if (creds) await finishConnect(platform, creds, pending?.brandId || activeBrandId);
            } catch (err) {
                console.error("Redirect connect error:", err);
                showToast(err.message || "Connection failed", "error");
            } finally {
                setLoadingPlatformId(null);
            }
        })();
    }, [token, activeBrandId, finishConnect]);

    // ── Disconnect handler ──
    const handleDisconnect = useCallback(async (integrationId) => {
        setLoadingIntegrationId(integrationId);
        try {
            const result = await disconnectIntegration(integrationId);
            if (!result.ok) {
                showToast(result.message || "Failed to disconnect", "error");
                return;
            }

            // Find the platform being disconnected before removing it
            const disconnectedPlatform = integrations.find(i => i.id === integrationId)?.platform;

            setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));

            // Purge live posts for this platform from localStorage
            if (disconnectedPlatform) {
                try {
                    const stored = JSON.parse(localStorage.getItem('creativeklux_published_posts') || '[]');
                    const cleaned = stored.filter(p => !(p.live && p.platform === disconnectedPlatform));
                    localStorage.setItem('creativeklux_published_posts', JSON.stringify(cleaned));
                } catch (e) {
                    console.warn('Failed to clean localStorage posts:', e);
                }
            }

            showToast("Integration disconnected.", "success");
        } catch (err) {
            console.error("Disconnect error:", err);
            showToast(err.message || "Disconnect failed", "error");
        } finally {
            setLoadingIntegrationId(null);
        }
    }, [disconnectIntegration, integrations]);

    const handleSelectPlatformPage = async (page) => {
        setFbLoadingPageId(page.id);

        const { platformId, userToken } = pendingFbOauth;

        try {
            let savePayload;

            // ───────────────── FACEBOOK ─────────────────
            if (platformId === "facebook") {
                savePayload = {
                    platform: "facebook",
                    access_token: page.access_token,
                    int_id: page.id,
                    int_name: page.name,
                    brand_id: activeBrandId,
                };
            }

            // ───────────────── PINTEREST ADS ─────────────────
            else if (platformId === "pinterest_ads") {
                savePayload = {
                    platform: "pinterest_ads",
                    access_token: pendingFbOauth.access_token,
                    int_id: page.id,           // ad account ID
                    int_name: `${pendingFbOauth.userName} • ${page.name}`,
                    brand_id: activeBrandId,
                };
            }

            else if (platformId === "google_ads") {

                savePayload = {
                    platform: "google_ads",

                    access_token:
                        pendingFbOauth.access_token,

                    int_id: page.id,

                    int_name: page.name,

                    brand_id: activeBrandId,
                };
            }

            // ───────────────── INSTAGRAM ─────────────────
            else if (platformId === "instagram") {
                savePayload = {
                    platform: "instagram",
                    access_token: page.access_token,
                    int_id: page._ig_user_id,
                    int_name: page._ig_username ? `@${page._ig_username}` : page.name,
                    brand_id: activeBrandId,
                };
            }

            // ───────────────── META ADS ─────────────────
            else if (platformId === "meta_ads") {
                // Fetch ad accounts
                const adRes = await fetch(
                    `https://graph.facebook.com/v23.0/me/adaccounts` +
                    `?fields=id,name,account_status` +
                    `&access_token=${userToken}`
                );

                const adData = await adRes.json();

                if (adData.error) {
                    throw new Error(adData.error.message);
                }

                const accounts = adData.data || [];

                if (!accounts.length) {
                    throw new Error("No Meta ad accounts found.");
                }

                const adAccount = accounts[0];

                savePayload = {
                    platform: "meta_ads",

                    // use USER TOKEN for ads api
                    access_token: userToken,

                    // save ad account id
                    int_id: adAccount.id,

                    // display page + ad account
                    int_name: `${page.name} • ${adAccount.name}`,

                    // OPTIONAL:
                    // save selected page id too
                    page_id: page.id,

                    brand_id: activeBrandId,
                };
            }

            const saved = await saveIntegration(savePayload);

            if (!saved.ok) {
                showToast(saved.message || "Failed to save", "error");
                return;
            }

            setIntegrations(prev => [
                ...prev,
                {
                    id: saved.data?.id || saved.id,
                    platform: platformId,
                    int_id: savePayload.int_id,
                    int_name: savePayload.int_name,
                },
            ]);

            setShowPageModal(false);
            setPendingFbOauth(null);

            showToast(`Connected successfully!`, "success");
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to connect", "error");
        } finally {
            setFbLoadingPageId(null);
            setLoadingPlatformId(null);
        }
    };

    const handleClosePageModal = () => {
        setShowPageModal(false);
        setPendingFbOauth(null);
        setLoadingPlatformId(null);
    };

    const getPlatformName = (platformId) => {
        const all = [...SOCIAL_PLATFORMS, ...AD_PLATFORMS];
        return all.find((p) => p.id === platformId)?.name || platformId;
    };

    return (
        <div className="flex flex-col min-h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={closeToast} />

            <div className="flex-1">
                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Integrations</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Connect your accounts with one click — CreativeKlux opens the platform
                        login, you approve, and it's done.
                    </p>
                </div>

                {/* How it works banner */}
                <div className="mb-6 flex gap-3 items-start bg-[#eff4ff] border border-[#c7d9fd] rounded-xl px-4 py-3.5">
                    <Info className="h-4 w-4 text-[#155dfc] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1e40af] leading-relaxed">
                        <span className="font-semibold">How it works: </span>
                        Click <span className="italic font-medium">Connect</span> on any platform.
                        A popup opens where you log in and approve permissions. Your credentials
                        are saved automatically to your active brand.
                    </p>
                </div>

                {fetching ? (
                    <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                        Loading integrations…
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <SectionHeader title="Social Media" />
                            <div className="flex flex-col gap-3">
                                {SOCIAL_PLATFORMS.map((platform) => (
                                    <PlatformCard
                                        key={platform.id}
                                        platform={platform}
                                        integrations={integrations.filter(i => i.platform === platform.id)}
                                        onConnect={handleConnect}
                                        onDisconnect={handleDisconnect}
                                        loadingPlatformId={loadingPlatformId}
                                        loadingIntegrationId={loadingIntegrationId}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <SectionHeader title="Advertising Platforms" />
                            <div className="flex flex-col gap-3">
                                {AD_PLATFORMS.map((platform) => (
                                    <PlatformCard
                                        key={platform.id}
                                        platform={platform}
                                        integrations={integrations.filter(i => i.platform === platform.id)}
                                        onConnect={handleConnect}
                                        onDisconnect={handleDisconnect}
                                        loadingPlatformId={loadingPlatformId}
                                        loadingIntegrationId={loadingIntegrationId}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom note */}
            <div className="mt-auto pt-2 pb-6">
                <div className="flex gap-2.5 items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">
                        <span className="font-semibold">Note: </span>
                        Connected integrations are linked to your active brand. Switch your
                        active brand to manage integrations for other brands.
                    </p>
                </div>
            </div>

            {/* Facebook page selector modal */}
            {showPageModal && (
                <PlatformPageModal
                    pages={fbPages}
                    onSelect={handleSelectPlatformPage}
                    onClose={handleClosePageModal}
                    loading={fbLoadingPageId}
                    selectedPageId={null}
                />
            )}
        </div>
    );
};

export default IntegrationsPage;