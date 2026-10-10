/**
 * Static config shared by the brand-create flow (Smart Import + Manual).
 * Kept in one place so both modes render the exact same options and steps.
 */

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

// The wizard's steps. Smart Import prepends a URL-entry screen (handled as
// "step 0" in the page). Social and ad accounts are no longer steps here:
// connecting needs a brand to attach to, so it happens on the Integrations
// page once the brand exists.
export const STEPS = [{ id: 1, label: "Brand Details" }];
