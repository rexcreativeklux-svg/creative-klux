"use client";

// app/(components)/content/socialPlatformScope.js
// ─────────────────────────────────────────────────────────────────────────────
// Which social network the Social Content section is showing — picked in the
// section's sidebar, carried in the URL as `?platform=<id>` so it survives a
// move between Publishing, Calendar and Analytics (and a reload, and a shared
// link). "all" (no param) is every network, as before.
//
// The layout owns it (social-content/layout.jsx) and provides it; each page
// reads it with useSocialPlatform() and narrows what it fetches and shows.

import { createContext, useContext } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";

/** Every social network the app supports, in sidebar order. */
export const SOCIAL_NETWORKS = [
  { id: "facebook", label: "Facebook", Icon: FaFacebook, color: "#1877F2" },
  { id: "instagram", label: "Instagram", Icon: FaInstagram, color: "#E1306C" },
  { id: "twitter", label: "X / Twitter", Icon: FaTwitter, color: "#14171A" },
  { id: "linkedin", label: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2" },
  { id: "tiktok", label: "TikTok", Icon: FaTiktok, color: "#010101" },
  { id: "youtube", label: "YouTube", Icon: FaYoutube, color: "#FF0000" },
  { id: "pinterest", label: "Pinterest", Icon: FaPinterest, color: "#E60023" },
];

const NETWORK_IDS = new Set(SOCIAL_NETWORKS.map((n) => n.id));

/** A `?platform=` value → a known network id, or "all" for anything else. */
export const toScope = (value) => (NETWORK_IDS.has(value) ? value : "all");

export const SocialPlatformContext = createContext("all");

/**
 * The network the section is scoped to.
 *
 * @returns {{
 *   platform: string,               "all" or a network id
 *   network: object|null,           its SOCIAL_NETWORKS entry
 *   scoped: boolean,                true when one network is picked
 *   inScope: (platform: string) => boolean,
 * }}
 */
export function useSocialPlatform() {
  const platform = useContext(SocialPlatformContext);
  const network = SOCIAL_NETWORKS.find((n) => n.id === platform) || null;
  return {
    platform,
    network,
    scoped: !!network,
    inScope: (p) => !network || p === platform,
  };
}
