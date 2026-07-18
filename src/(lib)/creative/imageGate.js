// imageGate.js
// ─────────────────────────────────────────────────────────────────────────────
// Image-selection rule for involk-powered creative generation — "Create from
// URL" and everything under Custom Creation (ImageAdsForm, PostForm,
// VideoAdsForm). The user must pick between MIN_IMAGES and MAX_IMAGES images
// (from gallery uploads or their own designs) before Generate unlocks.
//
// Centralised so every entry point enforces the same bounds and messaging —
// change the rule here once and all four flows follow.

export const MIN_IMAGES = 2;
export const MAX_IMAGES = 5;

/** True when `count` is enough to allow generation. */
export const meetsImageMinimum = (count) => count >= MIN_IMAGES;

/** Toast/inline feedback shown while the selection is below the minimum. */
export const imageGateMessage = (count) =>
  `Select at least ${MIN_IMAGES} images to generate — you have ${count}.`;
