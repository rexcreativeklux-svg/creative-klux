"use client";

// app/(components)/content/socialPlatformScope.js
// ─────────────────────────────────────────────────────────────────────────────
// Which network a content section (Social or Ads) is showing — picked from the
// connected accounts in the section's sidebar, carried in the URL as
// `?platform=<id>` so it survives a move between Publishing, Calendar and
// Analytics (and a reload, and a shared link). "all" (no param) is every
// connected account.
//
// Each section's layout owns its value and provides it; the pages read it with
// useSocialPlatform() / useAdsPlatform() and narrow what they fetch and show.

import { createContext, useContext } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiGoogleads, SiMeta, SiSnapchat } from "react-icons/si";

/** Every social network the app supports, in sidebar order. */
export const SOCIAL_NETWORKS = [
  { id: "facebook", label: "Facebook", Icon: FaFacebook, color: "#1877F2" },
  { id: "instagram", label: "Instagram", Icon: FaInstagram, color: "#E1306C" },
  { id: "twitter", label: "X / Twitter", Icon: FaXTwitter, color: "#14171A" },
  { id: "linkedin", label: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2" },
  { id: "tiktok", label: "TikTok", Icon: FaTiktok, color: "#010101" },
  { id: "youtube", label: "YouTube", Icon: FaYoutube, color: "#FF0000" },
  { id: "pinterest", label: "Pinterest", Icon: FaPinterest, color: "#E60023" },
];

/** Every ad network the app supports, in sidebar order. */
export const AD_NETWORKS = [
  { id: "meta_ads", label: "Meta Ads", Icon: SiMeta, color: "#0668E1" },
  { id: "google_ads", label: "Google Ads", Icon: SiGoogleads, color: "#4285F4" },
  { id: "tiktok_ads", label: "TikTok Ads", Icon: FaTiktok, color: "#010101" },
  { id: "snapchat_ads", label: "Snapchat Ads", Icon: SiSnapchat, color: "#E5C700" },
  { id: "pinterest_ads", label: "Pinterest Ads", Icon: FaPinterest, color: "#E60023" },
];

/** A `?platform=` value → a network id from `networks`, or "all". */
export const scopeIn = (networks) => {
  const ids = new Set(networks.map((n) => n.id));
  return (value) => (ids.has(value) ? value : "all");
};

/** Social's parser — kept by name for the pages that import it. */
export const toScope = scopeIn(SOCIAL_NETWORKS);

export const SocialPlatformContext = createContext("all");
export const AdsPlatformContext = createContext("all");

function scopeFrom(platform, networks) {
  const network = networks.find((n) => n.id === platform) || null;
  return {
    platform,
    network,
    scoped: !!network,
    inScope: (p) => !network || p === platform,
  };
}

/**
 * The social network the section is scoped to.
 *
 * @returns {{
 *   platform: string,               "all" or a network id
 *   network: object|null,           its SOCIAL_NETWORKS entry
 *   scoped: boolean,                true when one network is picked
 *   inScope: (platform: string) => boolean,
 * }}
 */
export function useSocialPlatform() {
  return scopeFrom(useContext(SocialPlatformContext), SOCIAL_NETWORKS);
}

/** The ad network the Ads section is scoped to — same shape as above. */
export function useAdsPlatform() {
  return scopeFrom(useContext(AdsPlatformContext), AD_NETWORKS);
}
