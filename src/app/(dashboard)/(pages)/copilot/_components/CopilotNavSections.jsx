"use client";

/**
 * CopilotNavSections — the Favorites and Recents blocks under the sidebar's
 * Copilot tab.
 *
 * It lives HERE, beside the Copilot pages, rather than inside Sidebar.jsx: it
 * reads the Copilot catalog, renders Copilot avatars and opens the Copilot ⋯
 * menu, so every reason it changes is a Copilot reason. Sidebar.jsx mounts one
 * component and stays a navigation shell. That also means the sidebar does not
 * have to learn what a copilot is when the backend replaces ../_data/copilots.
 *
 * Only rendered while the rail is EXPANDED — collapsed, the rail is a 60px strip
 * of icons with no room for a section label, a name or a disclosure. The
 * collapsed state keeps the two nav links and nothing else.
 *
 * Favorites is closed by default and Recents open: Recents has something to show
 * on first load, Favorites does not until the user stars something, and opening
 * a section onto an empty-state card is a worse first impression than a closed
 * row they can open.
 *
 * @param {Object} props
 * @param {() => void} [props.onNavigate] Called when a link is followed, so the
 *   mobile drawer holding this can close itself (see Sidebar.jsx).
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import ResultActionsMenu from "@/app/(components)/product-studio/ResultActionsMenu";
import CopilotAvatar from "./CopilotAvatar";
import { buildCopilotActions } from "./copilotActions";
import { useCopilots, RECENTS_LIMIT } from "../_data/copilots";

// Gap between a row's ⋯ and the menu it opens. The menu (w-52 = 208px) is wider
// than the rail has to spare, so it opens BESIDE the row, over the page — the
// same way the collapsed rail's account menu does — rather than being pinned
// inside 224px and covering the nav it belongs to.
const MENU_GAP = 8;

/** A collapsible block: muted header row, body underneath. */
function NavSection({ label, open, onToggle, children }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span className="flex-1 text-left truncate">{label}</span>
        {/* Rotated rather than swapped for a ChevronRight, so the arrow turns
            through the transition instead of popping to a different glyph. */}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && children}
    </div>
  );
}

/** One copilot in the rail: avatar, name, and a ⋯ that appears on hover. */
function NavRow({ copilot, onOpenMenu, menuOpen, onNavigate, active }) {
  return (
    <div
      className={`group relative flex items-center rounded-xl transition-colors ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Link
        href={`/copilot/${copilot.id}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-3 text-[13px] font-medium text-left"
      >
        <CopilotAvatar copilot={copilot} size="sm" />
        <span className="truncate">{copilot.name}</span>
      </Link>
      <button
        onClick={(e) => onOpenMenu(copilot, e)}
        aria-label={`${copilot.name} actions`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        // Held visible while its own menu is open, or clicking ⋯ would make the
        // trigger vanish the moment the pointer left the row for the menu.
        className={`mr-1.5 p-1 rounded-lg shrink-0 transition-opacity cursor-pointer hover:bg-gray-200 ${
          menuOpen
            ? "opacity-100"
            : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
        }`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CopilotNavSections({ onNavigate }) {
  const pathname = usePathname();
  const copilots = useCopilots();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [menu, setMenu] = useState(null); // { copilot, x, y }

  const favorites = copilots.filter((c) => c.favorite);
  // The catalog is already ordered newest-edited first, so Recents is a slice.
  const recents = copilots.slice(0, RECENTS_LIMIT);

  const openMenu = (copilot, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu((open) =>
      open?.copilot.id === copilot.id
        ? null
        : { copilot, x: rect.right + MENU_GAP, y: rect.bottom + MENU_GAP },
    );
  };

  const rows = (list) =>
    list.map((copilot) => (
      <NavRow
        key={copilot.id}
        copilot={copilot}
        onOpenMenu={openMenu}
        menuOpen={menu?.copilot.id === copilot.id}
        onNavigate={onNavigate}
        // Any screen inside a copilot's workspace lights its row — the panel
        // over there names which of them you are on.
        active={pathname?.startsWith(`/copilot/${copilot.id}`)}
      />
    ));

  return (
    <>
      <NavSection
        label="Favorites"
        open={favoritesOpen}
        onToggle={() => setFavoritesOpen((p) => !p)}
      >
        {favorites.length ? (
          <div className="mt-0.5 flex flex-col">{rows(favorites)}</div>
        ) : (
          <p className="mt-1 rounded-xl border border-gray-200 px-3 py-4 text-center text-[11px] leading-relaxed text-gray-400">
            No favorite copilots yet.
            <br />
            Add your copilots for quick access
          </p>
        )}
      </NavSection>

      <NavSection
        label="Recents"
        open={recentsOpen}
        onToggle={() => setRecentsOpen((p) => !p)}
      >
        {recents.length ? (
          <>
            <div className="mt-0.5 flex flex-col">{rows(recents)}</div>
            {/* Underlined, not a nav item: it is a way OUT of the rail's short
                list into the full catalog, not a seventh destination competing
                with Home and All Copilots above it. */}
            <Link
              href="/copilot/all"
              onClick={onNavigate}
              className="block px-3 pt-1.5 text-[12px] text-gray-500 underline underline-offset-2 hover:text-gray-900 transition-colors"
            >
              View all
            </Link>
          </>
        ) : (
          <p className="mt-1 rounded-xl border border-gray-200 px-3 py-4 text-center text-[11px] leading-relaxed text-gray-400">
            No copilots yet.
          </p>
        )}
      </NavSection>

      {menu && (
        <ResultActionsMenu
          x={menu.x}
          y={menu.y}
          actions={buildCopilotActions(menu.copilot)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
