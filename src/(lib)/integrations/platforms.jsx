// platforms.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the connectable social + ad platforms and their
// brand icons. Shared by the Integrations page and the brand-create wizard so
// both surfaces offer the exact same platforms and connect the exact same way.

// ── SVG brand icons (white fill, meant to sit on a coloured iconBg) ───────────
export const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
export const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
export const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
export const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
export const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
export const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);
export const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.023.358-.032.535.45.24 1.597.772 2.745.772.272 0 .538-.033.792-.099.146-.04.286-.06.42-.06.134 0 .263.02.383.06.26.087.381.28.381.472 0 .558-.722.977-2.44 1.378-.202.047-.43.1-.641.163.08.224.217.567.36.875.497 1.088 1.263 1.744 2.362 1.744h.2c.127 0 .249.022.362.072.31.139.47.44.47.748 0 .668-.653 1.155-1.59 1.396-.467.12-.95.213-1.44.277-.23.03-.452.056-.67.09-.133.022-.271.048-.409.104-.138.056-.304.142-.5.254-.394.227-.93.537-1.716.537-.286 0-.576-.047-.862-.14-.564-.185-1.095-.367-1.594-.367-.49 0-.978.178-1.45.365-.277.104-.56.18-.848.18-.706 0-1.235-.307-1.626-.532-.195-.112-.362-.198-.5-.254-.138-.056-.276-.082-.409-.104-.218-.034-.44-.06-.67-.09-.49-.064-.973-.157-1.44-.277-.937-.241-1.59-.728-1.59-1.396 0-.308.16-.609.47-.748.113-.05.235-.072.362-.072h.2c1.1 0 1.865-.656 2.362-1.744.143-.308.28-.651.36-.875-.211-.063-.439-.116-.641-.163-1.718-.401-2.44-.82-2.44-1.378 0-.192.12-.385.382-.472.12-.04.248-.06.383-.06.134 0 .273.02.42.06.254.066.52.099.792.099 1.135 0 2.273-.522 2.737-.768l-.033-.535c-.104-1.628-.23-3.654.299-4.847C7.854 1.07 11.21.793 12.206.793z" />
  </svg>
);
export const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);
export const MetaIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.357-2.602zm-10.201.553c1.265 0 2.058.791 3.11 2.416.28.436.758 1.28 1.155 1.985l.378.659c-1.388 2.388-2.18 3.665-2.834 4.414-.926 1.06-1.524 1.308-2.309 1.308-1.228 0-2.063-.926-2.394-2.234a9.967 9.967 0 0 1-.17-1.903c0-2.333.6-4.887 1.832-6.522.709-.951 1.436-1.123 2.232-1.123z" />
  </svg>
);
export const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M2.678 11.338L8.648.816a2.717 2.717 0 0 1 3.762-.966 2.717 2.717 0 0 1 .966 3.762l-5.97 10.522a2.717 2.717 0 0 1-3.762.966 2.717 2.717 0 0 1-.966-3.762zm14.889 7.669a2.717 2.717 0 1 1-2.717-2.717 2.717 2.717 0 0 1 2.717 2.717zm3.267-7.687l-5.97-10.51A2.717 2.717 0 0 1 18.626.844l5.97 10.51a2.717 2.717 0 0 1-3.762 1.966z" />
  </svg>
);

export const GmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  </svg>
);
export const GoogleSheetsIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M11.318 12.545H7.91v-1.909h3.41v1.91zM14.728 0v6h6l-6-6zm1.363 10.636h-3.41v1.91h3.41v-1.91zm0 3.273h-3.41v1.91h3.41v-1.91zM20.727 6.5v15.864c0 .904-.732 1.636-1.636 1.636H4.909a1.636 1.636 0 0 1-1.636-1.636V1.636C3.273.732 4.005 0 4.909 0h9.318v6.5h6.5zm-3.273 2.773H6.545v7.909h10.91v-7.91zm-6.136 4.636H7.91v1.91h3.41v-1.91z" />
  </svg>
);
export const GoogleDocsIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6zm-.545 10.455H7.09v-1.364h7.09v1.364zm2.727-3.273H7.091v-1.364h9.818v1.364zm0-3.273H7.091V9.273h9.818v1.363zM14.727 6h6l-6-6v6z" />
  </svg>
);
export const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M7.71 3.5 1.15 15l3.43 6 6.56-11.5L7.71 3.5zm1.73 0 6.57 11.5h6.84L16.28 3.5H9.44zM9.42 16.5 6 22.5h13.12l3.43-6H9.42z" />
  </svg>
);
export const GoogleSlidesIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M14.727 0H4.909C4.005 0 3.273.732 3.273 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.545L14.727 0zM17.455 17.455H6.545V10.91h10.91v6.545zM14.727 6.545V0l6 6.545h-6z" />
  </svg>
);
export const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10zM7 11h5v5H7v-5z" />
  </svg>
);
export const GoogleAnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M19.5 2A2.5 2.5 0 0 0 17 4.5v15a2.5 2.5 0 0 0 5 0v-15A2.5 2.5 0 0 0 19.5 2zM12 9a2.5 2.5 0 0 0-2.5 2.5v8a2.5 2.5 0 0 0 5 0v-8A2.5 2.5 0 0 0 12 9zm-7.5 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
  </svg>
);
// The four-colour Microsoft mark (keeps its own colours on a dark iconBg).
export const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
);

// ── Platform config ───────────────────────────────────────────────────────────
export const SOCIAL_PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook Pages",
    description: "Publish posts & images to your Facebook Pages.",
    Icon: FacebookIcon,
    iconBg: "linear-gradient(135deg, #1877F2, #0C5FCA)",
  },
  {
    id: "instagram",
    name: "Instagram Business",
    description: "Publish photos & reels to Instagram Business accounts.",
    Icon: InstagramIcon,
    iconBg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    description: "Post tweets, images, and videos to X (Twitter).",
    Icon: TwitterXIcon,
    iconBg: "linear-gradient(135deg, #14171A, #333)",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Share posts and articles on LinkedIn personal & company pages.",
    Icon: LinkedInIcon,
    iconBg: "linear-gradient(135deg, #0A66C2, #004182)",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Upload videos and manage your YouTube channel.",
    Icon: YouTubeIcon,
    iconBg: "linear-gradient(135deg, #FF0000, #CC0000)",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    description: "Create pins and manage Pinterest boards for your brand.",
    Icon: PinterestIcon,
    iconBg: "linear-gradient(135deg, #E60023, #ad081b)",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Publish videos and create TikTok content.",
    Icon: TikTokIcon,
    iconBg: "linear-gradient(135deg, #161823, #010101)",
  },
];

export const AD_PLATFORMS = [
  {
    id: "meta_ads",
    name: "Meta Ads Manager",
    description: "Create & manage Facebook and Instagram ad campaigns.",
    Icon: MetaIcon,
    iconBg: "linear-gradient(135deg, #0668E1, #1877F2)",
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Manage Google Search, Display & YouTube ad campaigns.",
    Icon: GoogleAdsIcon,
    iconBg: "linear-gradient(135deg, #4285F4, #34A853)",
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    description: "Launch and manage TikTok ad campaigns.",
    Icon: TikTokIcon,
    iconBg: "linear-gradient(135deg, #161823, #010101)",
  },
  {
    id: "snapchat_ads",
    name: "Snapchat Ads",
    description: "Create and manage Snapchat advertising campaigns.",
    Icon: SnapchatIcon,
    iconBg: "linear-gradient(135deg, #FFFC00, #f0ed00)",
  },
  {
    id: "pinterest_ads",
    name: "Pinterest Ads",
    description: "Run Pinterest ad campaigns and promoted pins.",
    Icon: PinterestIcon,
    iconBg: "linear-gradient(135deg, #E60023, #ad081b)",
  },
];

// Docs, sheets and mail — not publishing targets, so they're kept out of
// SOCIAL/AD (which the brand wizard and Copilot also iterate).
//
// Their OAuth is run by the BACKEND (see serverOAuth.js), keyed by `provider` —
// the exact platform string the API expects. Several rows can share one
// provider: `google` is a single consent covering Gmail, Drive and Sheets, so
// those rows connect and disconnect together.
export const PRODUCTIVITY_PLATFORMS = [
  {
    id: "gmail",
    provider: "google",
    name: "Gmail",
    description: "Read and send email from your Gmail account.",
    Icon: GmailIcon,
    iconBg: "linear-gradient(135deg, #EA4335, #C5221F)",
  },
  {
    id: "google_drive",
    provider: "google",
    name: "Google Drive",
    description: "List files in your Google Drive.",
    Icon: GoogleDriveIcon,
    iconBg: "linear-gradient(135deg, #1FA463, #4285F4)",
  },
  {
    id: "google_sheets",
    provider: "google",
    name: "Google Sheets",
    description: "Read and append to spreadsheets in your Google Drive.",
    Icon: GoogleSheetsIcon,
    iconBg: "linear-gradient(135deg, #0F9D58, #0B8043)",
  },
  {
    id: "google_docs",
    provider: "google_docs",
    name: "Google Docs",
    description: "Create documents in your Google Drive.",
    Icon: GoogleDocsIcon,
    iconBg: "linear-gradient(135deg, #4285F4, #1A73E8)",
  },
  {
    id: "google_slides",
    provider: "google_slides",
    name: "Google Slides",
    description: "Create presentations in your Google Drive.",
    Icon: GoogleSlidesIcon,
    iconBg: "linear-gradient(135deg, #F4B400, #E37400)",
  },
  {
    id: "google_calendar",
    provider: "google_calendar",
    name: "Google Calendar",
    description: "List and create events on your Google Calendar.",
    Icon: GoogleCalendarIcon,
    iconBg: "linear-gradient(135deg, #4285F4, #1967D2)",
  },
  {
    id: "google_analytics",
    provider: "google_analytics",
    name: "Google Analytics",
    description: "Pull reporting from your Google Analytics properties.",
    Icon: GoogleAnalyticsIcon,
    iconBg: "linear-gradient(135deg, #F9AB00, #E37400)",
  },
  {
    id: "microsoft",
    provider: "outlook",
    name: "Microsoft Outlook",
    description: "Use Outlook mail and calendar from your Microsoft account.",
    Icon: MicrosoftIcon,
    iconBg: "linear-gradient(135deg, #2F2F2F, #1B1B1B)",
  },
];

// Platforms whose login is a full-page redirect (nested SSO that popups can't
// finish). The Integrations page uses redirects for these; the brand-create
// wizard forces a popup instead so the in-progress form isn't navigated away.
export const REDIRECT_PLATFORMS = ["twitter", "linkedin", "pinterest", "tiktok"];

// Look up a platform's display name from its id.
export const getPlatformName = (platformId) => {
  const all = [...SOCIAL_PLATFORMS, ...AD_PLATFORMS, ...PRODUCTIVITY_PLATFORMS];
  return all.find((p) => p.id === platformId)?.name || platformId;
};

// Ids that belong to the advertising set (used to route a resolved connection
// into the right bucket — social vs ad accounts).
export const AD_PLATFORM_IDS = AD_PLATFORMS.map((p) => p.id);
