"use client";

/**
 * DropdownMenu — a trigger that drops a list, for the three menus on the Plugins
 * screen: the connector browser's category and sort filters, and "Add Skill".
 *
 * One component covers both jobs because they differ only in what an item MEANS:
 * a filter item sets a value (and shows a ✓ on the current one), an action item
 * runs something (and shows an icon). Both are `{ label, onClick }` plus a flag,
 * so splitting them into two components would duplicate the popover, the
 * outside-click and the keyboard behaviour to no end.
 *
 * The transparent backdrop is the same outside-click trick ResultActionsMenu
 * uses — cheap, and it cannot miss a click the way a document listener can when
 * something else stops propagation.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger    Button contents (chevron is added).
 * @param {string} [props.heading]           Small label above the items.
 * @param {Array<{label: string, icon?: React.ElementType, selected?: boolean,
 *   onClick: () => void}>} props.items
 * @param {"left"|"right"} [props.align="right"]  Which edge the menu hangs from.
 * @param {string} [props.triggerClassName]  Override the default bordered look.
 */

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function DropdownMenu({
  trigger,
  heading,
  items,
  align = "right",
  triggerClassName = "flex items-center gap-2 rounded-lg border border-gray-300 bg-surface px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer",
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        {trigger}
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={`absolute z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-xl border border-gray-200 bg-surface py-1 shadow-2xl ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {heading && (
              <p className="px-3 py-1.5 text-[11px] font-medium text-gray-400">
                {heading}
              </p>
            )}
            {items.map(({ label, icon: Icon, selected, onClick }) => (
              <button
                key={label}
                role="menuitem"
                onClick={() => {
                  onClick();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-500" />}
                <span className="flex-1 text-left truncate">{label}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
