"use client";

// app/(components)/studio/ComposerDropdown.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The small drop-up menu used twice in the prompt composer — once for the model
// picker, once for the Build/Plan mode picker — and once more by ActivityChart
// for its period picker. One component so they all stay visually and
// behaviourally identical.
//
// Two things make this more than a `position:absolute` panel:
//
//   1. It is PORTALLED to <body>. The composer's glass skin uses backdrop-blur
//      and the hero blocks animate with transforms — both create stacking
//      contexts, which trapped the menu's z-index inside the composer and let
//      the later quick-start cards paint straight over it. Escaping to body is
//      the only reliable fix (MessageAttachments does the same for its
//      lightbox). Position is therefore `fixed`, measured off the trigger.
//
//   2. Placement is MEASURED against the viewport. The menu is capped to the
//      room actually available on that side — never sliding under the app's
//      fixed header — and flips to the opposite side when the preferred one is
//      too cramped. A long list (the model picker runs to eighteen entries) then
//      scrolls inside that cap instead of running off the top of the screen with
//      its first options stranded behind the header.
//
// Pass `groups` and the flat list folds into COLLAPSIBLE SECTIONS instead —
// which is how eighteen models stay a menu rather than a scroll. Leave it off
// and nothing about the flat rendering changes.
//
// Closes on outside click, on Escape, and on selection. Colours come from the
// app's theme tokens (bg-surface / gray-*), so it follows light and dark without
// a single hard-coded hex — the `dark` class lives on <html>, so portalling to
// <body> keeps theming intact.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

/** Menu width in px. MUST match the `w-56` class on the panel below. */
const MENU_WIDTH = 224;
/** Gap between the trigger and the menu. */
const MENU_GAP = 8;
/** Breathing room kept between the menu and the edges of the viewport. */
const VIEWPORT_MARGIN = 12;
/** The app header is `fixed … h-16` and paints over page content, so the menu
 *  treats the space beneath it as the top of the world. Same 4rem the dashboard
 *  page reserves with `pt-16`. */
const APP_HEADER_HEIGHT = 64;
/** Tallest the menu ever gets, however much room there is. */
const MAX_MENU_HEIGHT = 320;
/** A side with less room than this is too cramped to be worth opening into. */
const MIN_MENU_HEIGHT = 176;

/**
 * @param {object} props
 * @param {{id: string, label: string, description?: string, group?: string, icon?: React.ComponentType<{className?: string}>}[]} props.options
 * @param {string} props.value            Currently selected option id.
 * @param {(id: string) => void} props.onChange
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{id: string, label: string, icon?: React.ComponentType<{className?: string}>}[]} [props.groups]
 *   Turns the flat list into COLLAPSIBLE SECTIONS — pass the sections in the
 *   order they should appear, and give each option a `group` matching one of
 *   these ids. Omit it (or pass an empty list) and the menu renders flat exactly
 *   as before; the Build/Plan picker and ActivityChart's period picker both rely
 *   on that. Options with no `group`, or one that matches no section, stay at the
 *   top of the menu above the sections.
 * @param {"up"|"down"} [props.drop]      PREFERRED menu direction — the menu
 *   flips to the other side when this one can't fit a usable list. Default "up".
 * @param {"left"|"right"} [props.align]  Which trigger edge the menu hugs — use
 *   "right" when the trigger sits near a container's right edge so the menu
 *   opens inward. It is nudged back inside the viewport either way. Default "left".
 * @param {string} [props.ariaLabel]      Accessible name for the trigger.
 * @param {string} [props.triggerLabel]   FIXED text for the trigger — it reads
 *   the same before and after a choice, so the control keeps naming the setting
 *   ("Model") instead of announcing the value. Leave it out and the trigger
 *   shows the selected option's own label, which is what a two-option menu like
 *   Build/Plan wants: there, the value IS the useful thing to show. Either way
 *   the open menu is where the current choice is marked, with a tick.
 * @param {React.ComponentType<{className?: string}>} [props.icon] Optional leading icon.
 */
export default function ComposerDropdown({
  options,
  value,
  onChange,
  open,
  onOpenChange,
  groups,
  drop = "up",
  align = "left",
  ariaLabel,
  triggerLabel,
  icon: Icon,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((option) => option.id === value) || options[0];

  const grouped = Array.isArray(groups) && groups.length > 0;

  // Which sections are open. `null` means "nobody has clicked yet", which is NOT
  // the same as "none are open": the default is the section holding the current
  // selection, so opening the menu always shows the user what they picked last
  // without them hunting for it. The first toggle materialises that default into
  // a real set and edits it from there.
  const [expanded, setExpanded] = useState(null);

  // Back to the default every time the menu closes, so re-opening lands on the
  // selection again instead of on whatever was left unfolded last time.
  //
  // Done DURING RENDER off a remembered `open`, not in an effect: resetting in
  // an effect would paint one frame of the stale sections first and then throw
  // it away, and React lints that pattern for exactly that reason. Setting state
  // here restarts this component's render before anything reaches the DOM.
  const [openLastRender, setOpenLastRender] = useState(open);
  if (openLastRender !== open) {
    setOpenLastRender(open);
    if (!open) setExpanded(null);
  }

  const defaultExpanded = () =>
    new Set(selected?.group ? [selected.group] : []);
  const isExpanded = (groupId) =>
    expanded ? expanded.has(groupId) : selected?.group === groupId;
  const toggleGroup = (groupId) => {
    setExpanded((current) => {
      const next = new Set(current ?? defaultExpanded());
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Resolved placement: the fixed-position coords plus the height cap. `position`
  // stays null until the first measurement, so the menu never paints at the
  // wrong spot or a height the viewport can't hold (same trick as
  // ResultActionsMenu). It survives close/re-open — a re-open starts from the
  // last known good placement and corrects itself on the next frame.
  const [placement, setPlacement] = useState({
    maxHeight: MAX_MENU_HEIGHT,
    position: null,
  });

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceAbove = rect.top - MENU_GAP - APP_HEADER_HEIGHT - VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN;

    const preferred = drop === "up" ? spaceAbove : spaceBelow;
    const opposite = drop === "up" ? spaceBelow : spaceAbove;
    // Only flip when the preferred side genuinely can't show a usable list AND
    // the other side is roomier — otherwise the menu would jump about for a few
    // pixels' gain.
    const flip = preferred < MIN_MENU_HEIGHT && opposite > preferred;
    const opensUp = flip ? drop === "down" : drop === "up";

    // Hug the requested trigger edge, then nudge back inside the viewport so a
    // narrow screen can't push the menu off the side.
    const hugged = align === "right" ? rect.right - MENU_WIDTH : rect.left;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(hugged, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
    );

    setPlacement({
      maxHeight: Math.min(MAX_MENU_HEIGHT, Math.max(flip ? opposite : preferred, 0)),
      // Anchoring upward by `bottom` means the height never has to be known.
      position: opensUp
        ? { left, bottom: window.innerHeight - rect.top + MENU_GAP }
        : { left, top: rect.bottom + MENU_GAP },
    });
  }, [drop, align]);

  // Measure on open, and keep it honest while it stays open — the menu is
  // `fixed`, so any scroll or resize moves the trigger out from under it.
  useEffect(() => {
    if (!open) return;

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Close on outside click / Escape while open. The menu lives in a portal, so
  // "outside" has to test the trigger AND the menu — testing a shared wrapper
  // would count every click on an option as an outside click, closing the menu
  // on mousedown before the option's click ever landed.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      const inside =
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target);
      if (!inside) onOpenChange(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  /**
   * One selectable row. `inset` indents it under a section header, so a row's
   * depth says which section it belongs to even once the header has scrolled
   * out of view.
   */
  const renderOption = (option, inset = false) => {
    const active = option.id === selected?.id;
    const OptionIcon = option.icon;
    return (
      <button
        key={option.id}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => {
          onChange(option.id);
          onOpenChange(false);
        }}
        className={`flex w-full items-start gap-2 py-2 pr-3 text-left transition-colors cursor-pointer hover:bg-gray-100 ${
          inset ? "pl-8" : "pl-3"
        }`}
      >
        {OptionIcon && (
          <OptionIcon
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
              active ? "text-blue-600" : "text-gray-400"
            }`}
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs ${
              active ? "font-semibold text-blue-600" : "font-medium text-gray-900"
            }`}
          >
            {option.label}
          </p>
          {/* {option.description && (
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              {option.description}
            </p>
          )} */}
        </div>
        {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />}
      </button>
    );
  };

  // Anything the sections don't claim rides at the top rather than vanishing —
  // a typo in an option's `group` costs it its section, not its place in the menu.
  const loose = grouped
    ? options.filter(
        (option) => !groups.some((group) => group.id === option.group),
      )
    : [];

  // ⚠️ Each SECTION is its own listbox, and the wrapper below carries no role at
  // all. `role="option"` is only valid inside a listbox, and the section headers
  // are buttons — putting them inside one listbox alongside the options would
  // describe a control that doesn't exist to a screen reader.
  const body = grouped ? (
    <>
      {loose.length > 0 && (
        <div role="listbox" aria-label={ariaLabel}>
          {loose.map((option) => renderOption(option))}
        </div>
      )}

      {groups.map((group) => {
        const items = options.filter((option) => option.group === group.id);
        if (items.length === 0) return null;

        const sectionOpen = isExpanded(group.id);
        const GroupIcon = group.icon;
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={sectionOpen}
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-gray-100"
            >
              {/* One glyph rotated rather than two swapped, so the fold reads as
                  the same control turning instead of a different icon arriving. */}
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
                  sectionOpen ? "rotate-90" : ""
                }`}
              />
              {GroupIcon && (
                <GroupIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              )}
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-900">
                {group.label}
              </span>
              {/* The count is what makes a folded section worth opening — it
                  says how much is behind it instead of leaving a blank row. */}
              <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                {items.length}
              </span>
            </button>

            {sectionOpen && (
              <div role="listbox" aria-label={group.label}>
                {items.map((option) => renderOption(option, true))}
              </div>
            )}
          </div>
        );
      })}
    </>
  ) : (
    options.map((option) => renderOption(option))
  );

  // `thin-scrollbar` (globals.css) swaps the chunky OS scrollbar with its
  // stepper arrows for a slim one, so a long list can still advertise that
  // there's more below without shouting about it.
  const menu = (
    <div
      ref={menuRef}
      // Flat menus ARE the listbox; grouped ones delegate that role to each
      // section (see the note above), so this element must stay role-less there.
      role={grouped ? undefined : "listbox"}
      className="thin-scrollbar fixed z-9999 w-56 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-surface py-1 shadow-xl"
      style={{
        ...placement.position,
        maxHeight: placement.maxHeight,
        visibility: placement.position ? "visible" : "hidden",
      }}
    >
      {body}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          open
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="whitespace-nowrap">
          {triggerLabel ?? selected?.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
