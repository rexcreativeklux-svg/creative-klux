/**
 * Static config shared by the brand-create flow (Smart Import + Manual).
 * Kept in one place so both modes render the exact same options and steps.
 */

import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Search, Globe, Music2 } from "lucide-react";

// Industry + font choices for the Brand Details step.
export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Retail",
  "Finance",
  "Education",
  "Hospitality",
  "Other",
];

export const FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Open Sans",
  "Lato",
  "Montserrat",
];

// Social platforms offered on the Social Accounts step.
export const SOCIAL_PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook",
    type: "Pages",
    Icon: FaFacebook,
    color: "#1877F2",
  },
  {
    id: "instagram",
    name: "Instagram",
    type: "Business",
    Icon: FaInstagram,
    color: "#E4405F",
  },
];

// Ad platforms offered on the Ad Accounts step. Superset of the platforms the
// old Import + Manual flows each listed, de-duplicated into one canonical set.
export const AD_PLATFORMS = [
  {
    id: "google",
    name: "Google Ads",
    type: "Search & Display",
    Icon: Search,
    color: "#EA4335",
  },
  {
    id: "meta",
    name: "Meta Ads",
    type: "Social Ads",
    Icon: FaFacebook,
    color: "#1877F2",
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    type: "Video Ads",
    Icon: Music2,
    color: "#010101",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    type: "Professional Ads",
    Icon: FaLinkedin,
    color: "#0A66C2",
  },
  {
    id: "twitter",
    name: "X (Twitter) Ads",
    type: "Social Ads",
    Icon: FaTwitter,
    color: "#000000",
  },
  {
    id: "bing",
    name: "Bing Ads",
    type: "Search Ads",
    Icon: Globe,
    color: "#00809D",
  },
];

// The three shared steps. Both modes walk the same sequence; Smart Import just
// prepends a URL-entry screen (handled as "step 0" in the page).
export const STEPS = [
  { id: 1, label: "Brand Details" },
  { id: 2, label: "Social Accounts" },
  { id: 3, label: "Ad Accounts" },
];
