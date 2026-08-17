"use client";

/**
 * CopilotCard — one copilot, as a tile or as a row.
 *
 * Both views are the SAME component because they carry the same behaviour: the
 * body opens the copilot, the star favourites it, and ⋯ opens the shared action
 * menu. Two components would mean two places to fix a hover state, and the grid
 * / list toggle on /copilot/all makes the divergence visible immediately.
 *
 * ── The hover state ──────────────────────────────────────────────────────────
 * ⋯ is always visible (it is the card's only way into rename/delete, and on a
 * phone there is no hover to reveal it). The star only appears on hover — UNTIL
 * the copilot is favourited, when it stays lit as the badge that says so. Below
 * `lg` it is always visible for the same reason as ⋯; that is the same
 * `opacity-100 lg:opacity-0 lg:group-hover:opacity-100` ladder the Magic Studio
 * history tiles use. `group-focus-within` is what keeps it reachable by keyboard,
 * since focus is not hover.
 *
 * The ⋯ menu is anchored to the BUTTON's rect rather than the click point, so it
 * drops from the same place whether the user clicked the glyph's centre or its
 * edge; {@link ResultActionsMenu} clamps it into the viewport from there.
 *
 * @param {Object} props
 * @param {Object} props.copilot              A row from ../_data/copilots.
 * @param {"grid"|"list"} [props.variant="grid"]  Tile or row.
 * @param {(copilot: Object) => void} [props.onOpen]  Override what opening does.
 *   By default the card routes to the copilot's workspace, /copilot/[id].
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Star } from "lucide-react";
import { toast } from "sonner";
import ResultActionsMenu from "@/app/(components)/product-studio/ResultActionsMenu";
import CopilotAvatar from "./CopilotAvatar";
import { buildCopilotActions } from "./copilotActions";
import { toggleFavorite } from "../_data/copilots";

// Width of ResultActionsMenu (its w-52), so the menu can be right-aligned under
// the ⋯ trigger and open inside the card instead of past its right edge.
const MENU_WIDTH = 208;

export default function CopilotCard({ copilot, variant = "grid", onOpen }) {
  const router = useRouter();
  const [menu, setMenu] = useState(null); // { x, y } while open
  const { name, description, editedAgo, favorite } = copilot;
  const isGrid = variant === "grid";

  const openMenu = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu((open) =>
      open ? null : { x: rect.right - MENU_WIDTH, y: rect.bottom + 6 },
    );
  };

  const handleFavorite = () => {
    toggleFavorite(copilot.id);
    toast.success(
      favorite ? `${name} removed from favorites` : `${name} added to favorites`,
    );
  };

  const handleOpen = () =>
    onOpen ? onOpen(copilot) : router.push(`/copilot/${copilot.id}`);

  const starVisibility = favorite
    ? "opacity-100"
    : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100";

  return (
    <div
      className={`group relative flex items-center gap-4 transition-colors ${
        isGrid
          ? "rounded-xl border border-gray-200 bg-surface p-5 hover:bg-gray-100"
          : "px-4 py-3 hover:bg-gray-100"
      }`}
    >
      {/* Body — the whole name/meta block is the open target, so the hit area
          matches what the card looks like it does. The action buttons are
          SIBLINGS, not children: a button inside a button is invalid markup and
          browsers resolve it by dropping one of them. */}
      <button
        onClick={handleOpen}
        className="flex min-w-0 flex-1 items-center gap-4 text-left cursor-pointer"
      >
        <CopilotAvatar copilot={copilot} size={isGrid ? "lg" : "md"} />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-gray-900">
            {name}
          </span>
          {/* The list row has the width for the description; the tile does not,
              and the reference tile shows the edit time alone. */}
          {!isGrid && (
            <span className="block truncate text-[13px] text-gray-500">
              {description}
            </span>
          )}
          <span
            className={`block truncate text-gray-500 ${isGrid ? "text-[13px]" : "text-[11px] mt-0.5"}`}
          >
            Last edited {editedAgo}
          </span>
        </span>
      </button>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={handleFavorite}
          aria-label={favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
          aria-pressed={favorite}
          className={`p-1.5 rounded-lg transition-all cursor-pointer hover:bg-gray-200 ${starVisibility} ${
            favorite ? "text-amber-500" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={openMenu}
          aria-label={`${name} actions`}
          aria-haspopup="menu"
          aria-expanded={Boolean(menu)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {menu && (
        <ResultActionsMenu
          x={menu.x}
          y={menu.y}
          actions={buildCopilotActions(copilot)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
