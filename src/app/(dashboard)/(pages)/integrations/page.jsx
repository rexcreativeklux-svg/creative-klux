"use client";

import { useState } from "react";
import {
    Link2,
    ExternalLink,
    AlertCircle,
    Info,
    CheckCircle2,
    X,
} from "lucide-react";
import { openOAuthPopup } from "@/lib/oauth/page";


// ── Real SVG brand icons ───────────────────────────────────────────────────────
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

const TikTokAdsIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);

const LinkedInAdsIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const SnapchatAdsIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.023.358-.032.535.45.24 1.597.772 2.745.772.272 0 .538-.033.792-.099.146-.04.286-.06.42-.06.134 0 .263.02.383.06.26.087.381.28.381.472 0 .558-.722.977-2.44 1.378-.202.047-.43.1-.641.163.08.224.217.567.36.875.497 1.088 1.263 1.744 2.362 1.744h.2c.127 0 .249.022.362.072.31.139.47.44.47.748 0 .668-.653 1.155-1.59 1.396-.467.12-.95.213-1.44.277-.23.03-.452.056-.67.09-.133.022-.271.048-.409.104-.138.056-.304.142-.5.254-.394.227-.93.537-1.716.537-.286 0-.576-.047-.862-.14-.564-.185-1.095-.367-1.594-.367-.49 0-.978.178-1.45.365-.277.104-.56.18-.848.18-.706 0-1.235-.307-1.626-.532-.195-.112-.362-.198-.5-.254-.138-.056-.276-.082-.409-.104-.218-.034-.44-.06-.67-.09-.49-.064-.973-.157-1.44-.277-.937-.241-1.59-.728-1.59-1.396 0-.308.16-.609.47-.748.113-.05.235-.072.362-.072h.2c1.1 0 1.865-.656 2.362-1.744.143-.308.28-.651.36-.875-.211-.063-.439-.116-.641-.163-1.718-.401-2.44-.82-2.44-1.378 0-.192.12-.385.382-.472.12-.04.248-.06.383-.06.134 0 .273.02.42.06.254.066.52.099.792.099 1.135 0 2.273-.522 2.737-.768l-.033-.535c-.104-1.628-.23-3.654.299-4.847C7.854 1.07 11.21.793 12.206.793z" />
    </svg>
);

const PinterestAdsIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
);

// ── Platform config ────────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
    {
        id: "facebook",
        name: "Facebook Pages",
        description: "Publish posts & images to your Facebook Pages.",
        Icon: FacebookIcon,
        iconBg: "linear-gradient(135deg, #1877F2, #0C5FCA)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developers.facebook.com
                </a>{" "}
                → My Apps → Create App → Settings → Basic → copy App ID. Add your app
                domain under "App Domains" and set the OAuth redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Facebook App ID",
        appIdPlaceholder: "1234567890",
    },
    {
        id: "instagram",
        name: "Instagram Business",
        description: "Publish photos & reels to Instagram Business accounts.",
        Icon: InstagramIcon,
        iconBg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
        setupInstructions: (
            <>
                Uses the same Facebook App ID. After connecting Facebook, your linked
                Instagram accounts will appear automatically.
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Facebook App ID (same as Facebook)",
        appIdPlaceholder: "1234567890",
    },
    {
        id: "twitter",
        name: "X / Twitter",
        description: "Post tweets, images, and videos to X (Twitter).",
        Icon: TwitterXIcon,
        iconBg: "linear-gradient(135deg, #14171A, #333)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developer.twitter.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developer.twitter.com
                </a>{" "}
                → Projects & Apps → Create App → Keys and Tokens → copy Client ID. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "X / Twitter Client ID",
        appIdPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        description: "Share posts and articles on LinkedIn personal & company pages.",
        Icon: LinkedInIcon,
        iconBg: "linear-gradient(135deg, #0A66C2, #004182)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developer.linkedin.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developer.linkedin.com
                </a>{" "}
                → My Apps → Create App → Auth tab → copy Client ID. Add the OAuth
                redirect URI to your app's Authorized Redirect URLs:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "LinkedIn Client ID",
        appIdPlaceholder: "86xxxxxxxxxxxxxxxx",
    },
    {
        id: "youtube",
        name: "YouTube",
        description: "Upload videos and manage your YouTube channel.",
        Icon: YouTubeIcon,
        iconBg: "linear-gradient(135deg, #FF0000, #CC0000)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    console.cloud.google.com
                </a>{" "}
                → Enable YouTube Data API v3 → Credentials → OAuth 2.0 Client ID. Add the redirect URI:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Google Client ID",
        appIdPlaceholder: "xxxxxx.apps.googleusercontent.com",
    },
    {
        id: "pinterest",
        name: "Pinterest",
        description: "Create pins and manage Pinterest boards for your brand.",
        Icon: PinterestIcon,
        iconBg: "linear-gradient(135deg, #E60023, #ad081b)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developers.pinterest.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developers.pinterest.com
                </a>{" "}
                → My Apps → Create App → copy App ID. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Pinterest App ID",
        appIdPlaceholder: "1234567",
    },
    {
        id: "snapchat",
        name: "Snapchat",
        description: "Publish Stories and Spotlight content to Snapchat.",
        Icon: SnapchatIcon,
        iconBg: "linear-gradient(135deg, #FFFC00, #f0ed00)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://kit.snapchat.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    kit.snapchat.com
                </a>{" "}
                → Create App → OAuth2 → copy Client ID. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Snapchat Client ID",
        appIdPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    },
    {
        id: "tiktok",
        name: "TikTok",
        description: "Publish videos and create TikTok content.",
        Icon: TikTokIcon,
        iconBg: "linear-gradient(135deg, #161823, #010101)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developers.tiktok.com
                </a>{" "}
                → My Apps → Create App → copy the Client Key. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "TikTok Client Key",
        appIdPlaceholder: "awxxxxxxxxxxxxxxxxxx",
    },
];

const AD_PLATFORMS = [
    {
        id: "meta_ads",
        name: "Meta Ads Manager",
        description: "Create & manage Facebook and Instagram ad campaigns.",
        Icon: MetaIcon,
        iconBg: "linear-gradient(135deg, #0668E1, #1877F2)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developers.facebook.com
                </a>{" "}
                and create a Business App. Enable the Marketing API product and copy
                your App ID. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Meta App ID",
        appIdPlaceholder: "1234567890",
    },
    {
        id: "google_ads",
        name: "Google Ads",
        description: "Manage Google Search, Display & YouTube ad campaigns.",
        Icon: GoogleAdsIcon,
        iconBg: "linear-gradient(135deg, #4285F4, #34A853)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    console.cloud.google.com
                </a>{" "}
                → Create Project → APIs & Services → Credentials → OAuth 2.0 Client ID.
                Add the redirect URI:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Google Client ID",
        appIdPlaceholder: "xxxxxx.apps.googleusercontent.com",
    },
    {
        id: "tiktok_ads",
        name: "TikTok Ads",
        description: "Launch and manage TikTok ad campaigns.",
        Icon: TikTokAdsIcon,
        iconBg: "linear-gradient(135deg, #161823, #010101)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://ads.tiktok.com/marketing_api" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    ads.tiktok.com/marketing_api
                </a>{" "}
                → Apply for access → copy App ID. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "TikTok Ads App ID",
        appIdPlaceholder: "awxxxxxxxxxxxxxxxxxx",
    },
    {
        id: "linkedin_ads",
        name: "LinkedIn Campaign Manager",
        description: "Run B2B ad campaigns on LinkedIn.",
        Icon: LinkedInAdsIcon,
        iconBg: "linear-gradient(135deg, #0A66C2, #004182)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developer.linkedin.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developer.linkedin.com
                </a>{" "}
                → My Apps → Create App → enable Marketing Developer Platform. Copy Client ID and set redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "LinkedIn Client ID",
        appIdPlaceholder: "86xxxxxxxxxxxxxxxx",
    },
    {
        id: "snapchat_ads",
        name: "Snapchat Ads",
        description: "Create and manage Snapchat advertising campaigns.",
        Icon: SnapchatAdsIcon,
        iconBg: "linear-gradient(135deg, #FFFC00, #f0ed00)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://businesshelp.snapchat.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    businesshelp.snapchat.com
                </a>{" "}
                → Business Manager → Apps → Create App → copy Client ID. Set the redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Snapchat Client ID",
        appIdPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    },
    {
        id: "pinterest_ads",
        name: "Pinterest Ads",
        description: "Run Pinterest ad campaigns and promoted pins.",
        Icon: PinterestAdsIcon,
        iconBg: "linear-gradient(135deg, #E60023, #ad081b)",
        setupInstructions: (
            <>
                Go to{" "}
                <a href="https://developers.pinterest.com" target="_blank" rel="noreferrer" className="underline cursor-pointer">
                    developers.pinterest.com
                </a>{" "}
                → My Apps → Create App → enable Ads API access. Copy App ID and set redirect URI to:
            </>
        ),
        redirectUri: "https://app.creativeklux.com/oauth-callback",
        appIdLabel: "Pinterest App ID",
        appIdPlaceholder: "1234567",
    },
];

// ── Platform Card ──────────────────────────────────────────────────────────────
const PlatformCard = ({ platform, connected, setConnected }) => {
    const { Icon } = platform;
    const isConnected = connected[platform.id];

    const handleConnect = async () => {
        try {
            const result = await openOAuthPopup(platform.id);

            console.log("OAuth success:", result);

            setConnected((prev) => ({
                ...prev,
                [platform.id]: true,
            }));
        } catch (err) {
            console.error(err);
            alert(err.message || "Connection failed");
        }
    };


    const handleDisconnect = () => {
        setConnected((prev) => ({
            ...prev,
            [platform.id]: false,
        }));
    };

    return (
        <div className="rounded-xl border bg-white border-gray-200 hover:shadow transition-all">
            <div className="flex items-center gap-4 px-5 py-4">

                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: platform.iconBg }}
                >
                    <Icon />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{platform.name}</span>

                        {isConnected ? (
                            <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                Connected
                            </span>
                        ) : (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                                Not connected
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                        {platform.description}
                    </p>
                </div>

                <div className="flex gap-2">
                    {isConnected ? (
                        <button
                            onClick={handleDisconnect}
                            className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            className="px-3 py-1.5 text-xs text-white rounded-lg"
                            style={{
                                background: "linear-gradient(135deg, #155dfc, #3b82f6)",
                            }}
                        >
                            Connect
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
    <h2 className="text-base font-bold text-gray-900 tracking-tight mb-3">
        {title}
    </h2>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
const IntegrationsPage = () => {
    const [expandedId, setExpandedId] = useState(null);
    const [appIds, setAppIds] = useState({});
    const [connected, setConnected] = useState({});

    const sharedProps = { expandedId, setExpandedId, appIds, setAppIds, connected, setConnected };

    return (
        <div
            className="flex flex-col min-h-full"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ── Content ── */}
            <div className="flex-1">
                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Integrations
                    </h1>
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
                        Click <span className="italic font-medium">Set Up &amp; Connect</span> on
                        any platform. You'll enter your platform App ID once (free to create),
                        then a popup opens where you log in and approve permissions. Your
                        credentials are captured automatically and saved locally. No manual
                        copy-pasting of tokens.
                    </p>
                </div>

                {/* ── Social Media Section ── */}
                <div className="mb-8">
                    <SectionHeader title="Social Media" />
                    <div className="flex flex-col gap-3">
                        {SOCIAL_PLATFORMS.map((platform) => (
                            <PlatformCard
                                key={platform.id}
                                platform={platform}
                                connected={connected}
                                setConnected={setConnected}
                            />
                        ))}

                    </div>
                </div>

                {/* ── Advertising Platforms Section ── */}
                <div className="mb-8">
                    <SectionHeader title="Advertising Platforms" />
                    <div className="flex flex-col gap-3">
                        {AD_PLATFORMS.map((platform) => (
                            <PlatformCard key={platform.id} platform={platform} {...sharedProps} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom note — always at the bottom ── */}
            <div className="mt-auto pt-2 pb-6">
                <div className="flex gap-2.5 items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">
                        <span className="font-semibold">Note: </span>
                        You need to create a free developer app on each platform (Facebook
                        Developers, Google Cloud Console, TikTok Developers) and enter its App
                        ID here. This is a one-time setup. All tokens are stored in your
                        browser — connect a backend later to store them securely.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;