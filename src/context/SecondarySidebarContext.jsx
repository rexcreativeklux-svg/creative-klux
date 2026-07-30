// context/SecondarySidebarContext.jsx
"use client";

/**
 * SecondarySidebarContext — desktop open/collapsed state for the section-level
 * secondary sidebars (Ad Intelligence, Social Content, Ads Content).
 *
 * The state lives in (dashboard)/layout.js (persisted to localStorage) and is
 * provided here; SectionLayout consumes it to render its panel expanded or
 * icon-only, and calls `toggle` from the collapse button in its panel footer.
 * (The header's collapse button stays dedicated to the PRIMARY sidebar.)
 *
 * Defaults keep SectionLayout working if rendered without the provider
 * (e.g. in isolation).
 */

import { createContext, useContext } from "react";

const SecondarySidebarContext = createContext({
  isOpen: true,
  toggle: () => {},
});

export const SecondarySidebarProvider = SecondarySidebarContext.Provider;
export const useSecondarySidebar = () => useContext(SecondarySidebarContext);
