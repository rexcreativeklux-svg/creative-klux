"use client";

/**
 * PlatformChip — tiny brand badge shown on Copilot idea cards.
 *
 * ⚠️ The platform set is READ FROM the integrations registry, not redeclared
 * here, so a chip can only ever name something the app can genuinely connect
 * to and publish to. The chips used to be Gmail / Sheets / Stripe / LinkedIn /
 * TikTok — three of those five are services Creative Klux has no integration
 * with, which made the cards read like a generic productivity assistant. Add a
 * platform to platforms.jsx and it becomes available here for free; there is
 * nothing to keep in sync.
 *
 * The registry's icons are sized for the Integrations page's larger tiles, so
 * the `[&_svg]` rules shrink them to fit this 24px chip. That selector compiles
 * to `.class svg` — element + class — which outranks the icon's own `w-5 h-5`
 * on specificity, so it wins whatever order the two land in the stylesheet.
 *
 * @param {Object} props
 * @param {string} props.platform  An id from SOCIAL_PLATFORMS or AD_PLATFORMS
 *                                 ("instagram", "meta_ads", …). An unknown id
 *                                 renders nothing rather than throwing.
 */

import { SOCIAL_PLATFORMS, AD_PLATFORMS } from "@/(lib)/integrations/platforms";

const CHIPS = Object.fromEntries(
  [...SOCIAL_PLATFORMS, ...AD_PLATFORMS].map((p) => [p.id, p]),
);

const PlatformChip = ({ platform }) => {
  const chip = CHIPS[platform];
  if (!chip) return null;
  const { name, Icon, iconBg } = chip;
  return (
    <span
      title={name}
      style={{ background: iconBg }}
      className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
    >
      <Icon />
    </span>
  );
};

export default PlatformChip;
