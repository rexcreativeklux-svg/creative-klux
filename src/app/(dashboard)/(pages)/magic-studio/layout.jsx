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
import { MAGIC_TOOLS, hrefForTool, toolById } from "./magicTools";

// Sidebar grouping only — MAGIC_TOOLS order still drives the redirect, filter
// pills and the composer picker. The headline image tools lead ungrouped; the
// rest sit under what they make.
const NAV_GROUPS = [
  {
    group: null,
    ids: ["image-design", "social-design", "ad-design"],
  },
  { group: "Image", ids: ["image_to_variations", "persona_generator"] },
  {
    group: "Video",
    ids: [
      "text_to_video",
      "image_to_video",
      "digital_human",
      "video_enhancer",
      "video_effects",
      "video_background_remover",
    ],
  },
  {
    group: "Audio",
    ids: ["script_to_voiceover", "text_to_audio", "audio_to_text"],
  },
];

const toNavItem = (tool, group) => ({
  label: tool.label,
  href: hrefForTool(tool),
  icon: tool.icon,
  group,
});

const grouped = new Set(NAV_GROUPS.flatMap((g) => g.ids));

const NAV_ITEMS = [
  ...NAV_GROUPS.flatMap(({ group, ids }) =>
    ids
      .map(toolById)
      .filter(Boolean)
      .map((tool) => toNavItem(tool, group)),
  ),
  // A tool added to MAGIC_TOOLS but not placed above still gets a nav item —
  // unless it opts out with `nav: false`.
  ...MAGIC_TOOLS.filter(
    (tool) => !grouped.has(tool.id) && tool.nav !== false,
  ).map((tool) =>
    toNavItem(tool, "More"),
  ),
];

export default function MagicStudioLayout({ children }) {
  return (
    <SectionLayout title="Magic Studio" items={NAV_ITEMS} bleed>
      {children}
    </SectionLayout>
  );
}
