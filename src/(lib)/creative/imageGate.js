// imageGate.js
// ─────────────────────────────────────────────────────────────────────────────
// Image-selection rule for involk-powered creative generation — "Create from
// URL" and everything under Custom Creation (ImageAdsForm, SocialImageForm,
// VideoAdsForm). The user must pick between MIN_IMAGES and MAX_IMAGES images
// (from gallery uploads or their own designs) before Generate unlocks.
//
// Centralised so every entry point enforces the same bounds and messaging —
// change the rule here once and all four flows follow.

export const MIN_IMAGES = 3;
export const MAX_IMAGES = 5;

/** True when `count` is enough to allow generation. */
export const meetsImageMinimum = (count) => count >= MIN_IMAGES;

/** True when `count` sits within the allowed [MIN_IMAGES, MAX_IMAGES] range. */
export const withinImageBounds = (count) =>
  count >= MIN_IMAGES && count <= MAX_IMAGES;

/** Toast/inline feedback shown while the selection is below the minimum. */
export const imageGateMessage = (count) =>
  `Select at least ${MIN_IMAGES} images to generate — you have ${count}.`;

/**
 * Bounds feedback covering both ends of the range — too few or too many.
 * Returns `null` when `count` is within bounds.
 */
export const imageBoundsMessage = (count) => {
  if (count > MAX_IMAGES)
    return `Select no more than ${MAX_IMAGES} images to generate — you have ${count}.`;
  if (count < MIN_IMAGES)
    return `Select at least ${MIN_IMAGES} images to generate — you have ${count}.`;
  return null;
};
