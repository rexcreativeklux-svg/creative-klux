"use client";

/**
 * Magic Studio section layout (/magic-studio/*)
 * ─────────────────────────────────────────────────────────────────────────────
 * Puts Magic Studio behind the same secondary sidebar as Social Content and Ads
 * Content: the panel lists the seven tools under a "Magic Studio" heading, and
 * the primary sidebar collapses out of the flow for the whole visit — expanding
 * as a floating overlay on hover, or held open by the header's pin.
 *
 * That collapse is NOT arranged here. It is driven by "/magic-studio" being in
 * SECONDARY_SIDEBAR_ROUTES in (dashboard)/layout.js, which is also what stops
 * the dashboard applying its default page padding around this shell. Add a
 * section here without adding it there and you get a double sidebar and doubled
 * padding, so the two lists have to stay in step.
 *
 * `bleed` because the landing page is a full-width lattice that runs to the
 * edges of the content area — its own pages apply whatever padding they want.
 */

import SectionLayout from "@/app/(components)/SectionLayout";
import { MAGIC_TOOLS, hrefForTool } from "./magicTools";

const NAV_ITEMS = MAGIC_TOOLS.map((tool) => ({
  label: tool.label,
  href: hrefForTool(tool),
  icon: tool.icon,
}));

export default function MagicStudioLayout({ children }) {
  return (
    <SectionLayout title="Magic Studio" items={NAV_ITEMS} bleed>
      {children}
    </SectionLayout>
  );
}
