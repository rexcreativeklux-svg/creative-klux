/**
 * Static config shared by the brand-create flow (Smart Import + Manual).
 * Kept in one place so both modes render the exact same options and steps.
 */

// Social + ad platforms come from the SHARED integrations config so the wizard
// offers the exact same platforms that actually connect (and syncs with the
// Integrations page). Re-exported here so the rest of the wizard keeps importing
// from one place.
export {
  SOCIAL_PLATFORMS,
  AD_PLATFORMS,
} from "@/(lib)/integrations/platforms";

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

// The three shared steps. Both modes walk the same sequence; Smart Import just
// prepends a URL-entry screen (handled as "step 0" in the page).
export const STEPS = [
  { id: 1, label: "Brand Details" },
  { id: 2, label: "Social Accounts" },
  { id: 3, label: "Ad Accounts" },
];
