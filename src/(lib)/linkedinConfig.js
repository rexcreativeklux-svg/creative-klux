// LinkedIn posting config — the single switch for the whole LinkedIn publish feature.
//
// Posting to LinkedIn requires the "Share on LinkedIn" product (the `w_member_social`
// scope) to be APPROVED on your LinkedIn developer app. Requesting that scope BEFORE
// approval makes the connect flow fail — so every part of LinkedIn posting (the OAuth
// scope, the Publish-modal "real" flag, the publish call) is gated behind this one flag.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  TO GO LIVE — flip LINKEDIN_POSTING_ENABLED to `true` ONLY AFTER all of:
//   1. LinkedIn approves "Share on LinkedIn" (w_member_social) on the app, AND
//   2. this is deployed to prod, AND
//   3. users RECONNECT LinkedIn (so the connect grants the now-available posting scope).
// Nothing else needs to change — flipping this one const turns the feature on.
// ─────────────────────────────────────────────────────────────────────────────
export const LINKEDIN_POSTING_ENABLED = true;

// The scope LinkedIn must approve before we can request it (added to connect only when
// the flag above is on).
export const LINKEDIN_POST_SCOPE = "w_member_social";

// LinkedIn versions its REST API by month (YYYYMM). Bump if LinkedIn deprecates this one.
export const LINKEDIN_API_VERSION = "202401";
