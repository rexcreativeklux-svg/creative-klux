"use client";

/**
 * SurfaceChip — the badge for the part of the app a workflow runs in.
 *
 * The sibling of {@link PlatformChip}: same 24px tile, same rounding, same
 * optical weight, so a row mixing "runs in Product Studio" with "publishes to
 * Instagram" reads as one set of badges rather than two systems. The difference
 * is only where the icon comes from — lucide here, brand SVGs there.
 *
 * @param {Object} props
 * @param {string} props.category  A key of CATEGORY_SURFACES ("Brand", "Ads", …).
 *                                 An unknown one renders nothing rather than
 *                                 throwing, matching PlatformChip.
 */

import { CATEGORY_SURFACES } from "../_data/surfaces";

export default function SurfaceChip({ category }) {
  const surface = CATEGORY_SURFACES[category];
  if (!surface) return null;
  const { name, Icon, iconBg } = surface;
  return (
    <span
      title={name}
      style={{ background: iconBg }}
      className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
    >
      <Icon className="h-3.5 w-3.5 text-white" />
    </span>
  );
}
