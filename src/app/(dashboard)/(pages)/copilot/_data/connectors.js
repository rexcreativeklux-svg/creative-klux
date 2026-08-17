"use client";

/**
 * The connector catalog behind the Connectors modal — what a copilot can be
 * connected to, with the category and ordering its filters need.
 *
 * ⚠️ BUILT FROM THE INTEGRATIONS REGISTRY, not written out again. Every entry is
 * a platform (lib)/integrations/platforms.jsx already knows how to connect and
 * already has a brand mark for, so the browse modal cannot offer something the
 * app has never heard of, and adding a platform there puts it in this modal for
 * free. Only the browsing metadata — the category, and the flags the cards
 * render — lives here.
 *
 * ⚠️ CATEGORIES ARE DERIVED FROM THE TWO REGISTRY LISTS. The reference's dozen
 * (Finance, Developer Tools, CRM…) belong to a general-purpose assistant; this
 * product connects to places you publish and places you advertise, so those are
 * the categories. The dropdown is built from whatever categories the catalog
 * actually contains, so it grows by itself when the backend brings more.
 */

import { SOCIAL_PLATFORMS, AD_PLATFORMS } from "@/(lib)/integrations/platforms";

/**
 * @typedef  {Object} Connector
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Function} Icon      White-fill brand mark, sits on `iconBg`.
 * @property {string} iconBg
 * @property {string} category
 * @property {boolean} [isNew]    Draws the "New" badge on the card.
 */

/**
 * ⚠️ ORDER IS MEANING HERE, twice over: it IS "Most popular" (the registry's own
 * order, most-used first), and reversing it is "Newest" — a platform is appended
 * to the registry when it is added, so the tail is the recent end. Reordering
 * platforms.jsx therefore reorders this modal. If either of those stops being
 * true, the honest fix is a real `addedAt` on the registry, not a second list.
 *
 * `isNew` is deliberately unset: nothing here has a date behind it, and a badge
 * that says New because a developer guessed is worse than no badge. The card
 * renders it the moment the data can say so truthfully.
 *
 * @type {Connector[]}
 */
export const CONNECTORS = [
  ...SOCIAL_PLATFORMS.map((p) => ({ ...p, category: "Social" })),
  ...AD_PLATFORMS.map((p) => ({ ...p, category: "Advertising" })),
];

/** Category filter options. "All" first, then whatever the catalog holds. */
export const CONNECTOR_CATEGORIES = [
  "All",
  ...Array.from(new Set(CONNECTORS.map((c) => c.category))).sort(),
];

/**
 * Sort options, in the order the menu lists them.
 *
 * Each carries its own comparator so the modal never grows a switch statement
 * over labels — `null` means "leave the catalog's own order", which is what
 * "Most popular" is.
 */
export const CONNECTOR_SORTS = [
  { label: "Most popular", compare: null },
  { label: "Newest", compare: null, reverse: true },
  { label: "A-Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { label: "Z-A", compare: (a, b) => b.name.localeCompare(a.name) },
];
