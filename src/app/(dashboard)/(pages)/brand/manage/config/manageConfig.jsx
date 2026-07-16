/**
 * manageConfig.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the Brand management page.
 *
 *   • TAB_CONFIG        — the top-level tabs (Basic Information, Members, …).
 *   • ALLOCATION_CONFIG — the sub-tabs inside the "Allocation" tab.
 *
 * Update copy, icons, defaults and API wiring here — the components render
 * straight from these arrays, so adding / re-ordering a tab is a one-line edit.
 *
 * ⚠️  Allocation API note
 *   Only SIX allocation slugs are confirmed on the backend today:
 *     tokens · team · resells · creatives · integrations · storage
 *   Those entries carry `wired: true` and hit
 *     PATCH /brands/{id}/allocations/{slug}
 *   Every other entry is design-only (`wired: false`) until its endpoint ships —
 *   flip `wired` to true and set the correct `slug` once the backend supports it.
 */

import {
  FileText,
  Users,
  SlidersHorizontal,
  Lock,
  Puzzle,
  Sparkles,
  Settings,
  Coins,
  RotateCcw,
  Plug,
  Palette,
  HardDrive,
} from "lucide-react";

// ── Top-level tabs ────────────────────────────────────────────────────────────
// `type` tells the page which panel component to render.
//   basic | members | allocation | integrations → full panels
//   comingSoon                                   → shared placeholder card
export const TAB_CONFIG = [
  { id: "basic", label: "Basic Information", Icon: FileText, type: "basic" },
  { id: "members", label: "Members", Icon: Users, type: "members" },
  {
    id: "allocation",
    label: "Allocation",
    Icon: SlidersHorizontal,
    type: "allocation",
  },
  {
    id: "auth",
    label: "Auth and Security",
    Icon: Lock,
    type: "comingSoon",
    coming: {
      title: "Auth and security",
      description:
        "Manage sign-in methods, session policies, and security settings for this brand.",
    },
  },
  {
    id: "integrations",
    label: "Integrations",
    Icon: Puzzle,
    badge: "Builder+",
    type: "integrations",
  },
  {
    id: "skills",
    label: "Skills",
    Icon: Sparkles,
    badge: "Builder+",
    type: "comingSoon",
    coming: {
      title: "Skills",
      description:
        "Equip this brand with reusable AI skills and automations for your team.",
    },
  },
  {
    id: "config",
    label: "Configuration",
    Icon: Settings,
    badge: "Enterprise",
    type: "comingSoon",
    coming: {
      title: "Configuration",
      description:
        "Fine-tune advanced brand behaviour, defaults, and enterprise controls.",
    },
  },
];

// ── Allocation sub-tabs ───────────────────────────────────────────────────────
// field    → key used to read live `{field}_allocation` / `{field}_used`
//            from the brand object (falls back to `defaultTotal` / 0).
// slug     → allocation endpoint segment: PATCH /brands/{id}/allocations/{slug}
// wired    → whether the Save button actually calls the backend (see note above).
export const ALLOCATION_CONFIG = [
  {
    id: "token",
    label: "Token",
    Icon: Coins,
    field: "token", // brand.token_allocation / brand.token_used
    slug: "tokens",
    wired: true,
    defaultTotal: 10000,
  },
  {
    id: "team",
    label: "Team",
    Icon: Users,
    field: "team",
    slug: "team",
    wired: true,
    defaultTotal: 5,
  },
  {
    id: "resell",
    label: "Resell",
    Icon: RotateCcw,
    field: "resell", // brand.resell_allocation / brand.resell_used
    slug: "resells",
    wired: true,
    defaultTotal: 0,
  },
  {
    id: "creatives",
    label: "Creatives",
    Icon: Palette,
    field: "creative", // brand.creative_allocation / brand.creative_used
    slug: "creatives",
    wired: true,
    defaultTotal: 0,
  },
  {
    id: "integration",
    label: "Integration",
    Icon: Plug,
    field: "integration", // brand.integration_allocation / brand.integration_used
    slug: "integrations",
    wired: true,
    defaultTotal: 0,
  },
  {
    id: "storage",
    label: "Storage",
    Icon: HardDrive,
    field: "storage",
    slug: "storage",
    wired: true,
    defaultTotal: 0,
  },
];

// Roles shown in the member table (an existing member can be any of these).
export const MEMBER_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

// Roles offered when inviting someone — you can't invite a new Owner.
export const INVITE_ROLES = MEMBER_ROLES.filter((r) => r.value !== "owner");

// Invite-link "maximum uses" options.
export const INVITE_MAX_USES = [1, 5, 10, 25, 50, 100];
