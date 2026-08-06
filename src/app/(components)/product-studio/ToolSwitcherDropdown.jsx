"use client";

/**
 * ToolSwitcherDropdown — the "Recently used" + "All tools" grid shown when the
 * user clicks a modal's title. Shared by every Product Studio modal so the
 * switcher looks and behaves identically everywhere.
 *
 * The CALLER still owns the open state, the outside-click backdrop, and (for the
 * animated variant) the surrounding <AnimatePresence> — this component only
 * renders the anchored panel + its tool grids, which is the part that was
 * duplicated. Pass `animated` to get the staggered framer-motion entrance used
 * by OnDeviceToolModal.
 *
 * Below `lg` DropdownBelow renders this as a bottom sheet — pass `onClose` so
 * its ✕ / backdrop / swipe can dismiss it.
 */

import { motion } from "framer-motion";
import { DropdownBelow, DROPDOWN_ITEM } from "./FloatingPanels";
import ToolCard from "./ToolCard";
import { TOOL_LIST, RECENT_TOOL_IDS } from "./constants";

/**
 * @param {object} props
 * @param {React.RefObject} props.anchorRef Header title button to anchor under.
 * @param {string} props.activeToolId The currently-open tool's id.
 * @param {(id: string) => void} props.onSelect Called with the chosen tool id.
 * @param {() => void} [props.onClose] Dismiss the mobile sheet (see above).
 * @param {boolean} [props.animated=false]
 * @param {number} [props.width=460]
 */
export default function ToolSwitcherDropdown({
  anchorRef,
  activeToolId,
  onSelect,
  onClose,
  animated = false,
  width = 460,
}) {
  const renderCard = (tool, keyPrefix = "") => {
    const card = (
      <ToolCard
        tool={tool}
        active={tool.id === activeToolId}
        onClick={onSelect}
      />
    );
    return animated ? (
      <motion.div key={`${keyPrefix}${tool.id}`} variants={DROPDOWN_ITEM}>
        {card}
      </motion.div>
    ) : (
      <div key={`${keyPrefix}${tool.id}`}>{card}</div>
    );
  };

  return (
    <DropdownBelow
      anchorRef={anchorRef}
      width={width}
      animated={animated}
      title="Switch tool"
      subtitle={TOOL_LIST.find((t) => t.id === activeToolId)?.label}
      onClose={onClose}
    >
      <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
        Recently used
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {RECENT_TOOL_IDS.map((id) => {
          const tool = TOOL_LIST.find((t) => t.id === id);
          if (!tool) return null;
          return renderCard(tool, "recent-");
        })}
      </div>
      <p className="text-xs font-semibold text-gray-500 px-1 mb-2">All tools</p>
      <div className="grid grid-cols-2 gap-2">
        {TOOL_LIST.map((tool) => renderCard(tool))}
      </div>
    </DropdownBelow>
  );
}
