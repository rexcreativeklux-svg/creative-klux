"use client";

/**
 * SettingsSelect — the dropdown the settings panels pick values with.
 *
 * Not a native <select>: every picker in these designs shows a description under
 * each option (what a model is for, how a voice sounds, what an app area
 * covers), groups them under headings, and — for the model menu — ends in an
 * upgrade link. A <select> can hold none of that.
 *
 * Positioning is the same construction as the app's ResultActionsMenu: fixed to
 * the trigger's measured rect, clamped into the viewport, dismissed by a
 * transparent backdrop or Escape. It has to be fixed rather than absolute
 * because these live inside a scrolling pane inside a modal — an absolutely
 * positioned menu would be clipped by the pane it opens in. The same reason it
 * closes on scroll: the menu is anchored to a rect that scrolling invalidates.
 *
 * @param {Object} props
 * @param {string|string[]} props.value      Selected id, or ids when `multiple`.
 * @param {(next: string) => void} props.onChange  Receives the CLICKED id, even
 *   when multiple — the caller owns what "clicking that one" means to its list,
 *   which is what lets Cross-app data access treat "All" and "None" specially.
 * @param {Array} props.options  { id, label, description?, Icon?, group?, locked? }
 * @param {Array} [props.groups] { id, label, hint? } — headings, in order.
 *   Options with no `group` (or an unknown one) render loose above them.
 * @param {boolean} [props.multiple]   Keeps the menu open after a pick.
 * @param {boolean} [props.searchable] Adds a filter box over the list.
 * @param {string} [props.display]     Trigger text. Defaults to the selection's label.
 * @param {React.ReactNode} [props.footer]  Pinned under the list (the upgrade link).
 * @param {() => void} [props.onLockedPick]  A locked option was clicked.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Crown, Search } from "lucide-react";
import { useIsHydrated } from "@/utils/useIsHydrated";

const MIN_WIDTH = 240;
const MAX_HEIGHT = 320;
const GAP = 6; // between the trigger and its menu

export default function SettingsSelect({
  value,
  onChange,
  options,
  groups = [],
  multiple = false,
  searchable = false,
  display,
  label,
  footer,
  onLockedPick,
  className = "",
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState(null);
  const hydrated = useIsHydrated();

  const selected = multiple ? value : [value];
  const isSelected = (id) => selected?.includes(id);

  // Measure after the menu is in the DOM, so its real height decides whether it
  // opens downward or flips above the trigger.
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(rect.width, MIN_WIDTH);
    const height = Math.min(menu.offsetHeight, MAX_HEIGHT);

    const below = window.innerHeight - rect.bottom - GAP;
    const flip = below < height && rect.top > below;

    setPos({
      width,
      top: flip
        ? Math.max(margin, rect.top - GAP - height)
        : Math.min(rect.bottom + GAP, window.innerHeight - height - margin),
      // Right-aligned to the trigger: these sit at the right edge of a panel, so
      // growing leftward is what keeps a wide menu on screen.
      left: Math.max(
        margin,
        Math.min(rect.right - width, window.innerWidth - width - margin),
      ),
    });
  }, [open]);

  // Escape closes; so does any scroll, which would otherwise leave the menu
  // floating away from the row it belongs to. Capture phase catches the
  // settings pane's own scroll, which does not bubble to window.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e) => e.key === "Escape" && (e.stopPropagation(), close());
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const current = options.find((o) => isSelected(o.id));
  const triggerText = display ?? current?.label ?? "Select";
  const TriggerIcon = display ? null : current?.Icon;

  const matches = (option) =>
    !query.trim() ||
    option.label.toLowerCase().includes(query.trim().toLowerCase());

  const pick = (option) => {
    if (option.locked) {
      onLockedPick?.();
      return;
    }
    onChange(option.id);
    if (!multiple) setOpen(false);
  };

  const renderOption = (option) => {
    const active = isSelected(option.id);
    const { Icon } = option;
    return (
      <button
        key={option.id}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => pick(option)}
        className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
          option.locked ? "opacity-50" : "hover:bg-gray-100"
        }`}
      >
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-gray-900">
            {option.label}
          </span>
          {option.description && (
            <span className="block text-[11px] leading-snug text-gray-500">
              {option.description}
            </span>
          )}
        </span>
        {option.locked ? (
          <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        ) : (
          active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
        )}
      </button>
    );
  };

  const visible = options.filter(matches);
  const loose = visible.filter(
    (o) => !o.group || !groups.some((g) => g.id === o.group),
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setQuery("");
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3 py-2 text-[13px] font-medium text-gray-900 transition-colors hover:bg-gray-50 cursor-pointer ${className}`}
      >
        {TriggerIcon && (
          <TriggerIcon className="h-4 w-4 shrink-0 text-gray-500" />
        )}
        <span className="min-w-0 flex-1 truncate text-left">{triggerText}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {hydrated &&
        open &&
        createPortal(
          <>
            {/* Above the sheet (z-100) but below the studio tool modals, in the
                same band ResultActionsMenu uses. */}
            <div className="fixed inset-0 z-215" onClick={() => setOpen(false)} />
            <div
              ref={menuRef}
              role="listbox"
              aria-label={label}
              className="fixed z-216 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-2xl"
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                width: pos?.width ?? MIN_WIDTH,
                maxHeight: MAX_HEIGHT,
                visibility: pos ? "visible" : "hidden",
              }}
            >
              {searchable && (
                <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                {loose.map(renderOption)}
                {groups.map((group) => {
                  const rows = visible.filter((o) => o.group === group.id);
                  if (!rows.length) return null;
                  return (
                    <div key={group.id}>
                      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-900">
                        {group.label}
                        {group.hint && (
                          <span className="ml-1.5 font-normal text-gray-400">
                            {group.hint}
                          </span>
                        )}
                      </p>
                      {rows.map(renderOption)}
                    </div>
                  );
                })}
                {!visible.length && (
                  <p className="px-3 py-6 text-center text-[12px] text-gray-400">
                    Nothing matches “{query}”.
                  </p>
                )}
              </div>

              {footer && (
                <div className="shrink-0 border-t border-gray-100 p-2">
                  {footer}
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
