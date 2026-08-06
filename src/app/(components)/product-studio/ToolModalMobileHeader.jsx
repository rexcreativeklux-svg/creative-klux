"use client";

/**
 * ToolModalMobileHeader — the pinned top bar every Product Studio tool modal
 * shows BELOW `lg`, and the mobile-only Setup | Result switch under it.
 * ─────────────────────────────────────────────────────────────────────────────
 * These modals are a two-column desktop layout: an options sidebar beside a
 * result canvas. Stacked on a phone that became two ~45dvh scroll areas, with
 * the ✕ floating in the middle of the screen on top of the canvas — cramped,
 * and the close button read as belonging to the results.
 *
 * So on small screens the modal shows ONE side at a time and this bar drives it:
 *
 *   ┌───────────────────────────────┐
 *   │ Virtual Model ▾            ✕ │  ← title opens the tool switcher
 *   │ [ Setup ][ Result ]           │  ← segmented, full height each
 *   └───────────────────────────────┘
 *
 * The owning modal keeps a `mobileView` state, renders this bar as the panel's
 * FIRST child, and toggles its two columns with
 * `${mobileView === "setup" ? "flex" : "hidden"} lg:flex` (and the mirror for
 * the canvas). Its desktop header + canvas ✕ stay as they are, hidden below
 * `lg`. Starting a generation should flip the view to "result" so progress is
 * what the user is looking at.
 *
 * Mirrors the Magic Studio modal's mobile header so the two studios behave
 * identically — the labels differ only because Magic Studio's left side is a
 * prompt ("Create") while these are option panels ("Setup").
 *
 * @example
 * const [mobileView, setMobileView] = useState("setup");
 * <ToolModalMobileHeader
 *   title={cfg.title}
 *   subtitle={cfg.subtitle}
 *   onTitleClick={() => setToolMenuOpen((o) => !o)}
 *   switcherOpen={toolMenuOpen}
 *   view={mobileView}
 *   onViewChange={setMobileView}
 *   onClose={onClose}
 * />
 */

import { ChevronDown, X, SlidersHorizontal, Images } from "lucide-react";

/** The two halves, in the order they appear in the segmented control. */
const VIEWS = [
  { id: "setup", label: "Setup", Icon: SlidersHorizontal },
  { id: "result", label: "Result", Icon: Images },
];

/**
 * @param {object} props
 * @param {string} props.title          Tool name.
 * @param {string} [props.subtitle]     Optional one-liner under the title.
 * @param {() => void} [props.onTitleClick] Opens the tool switcher. Omit for a
 *   modal without one — the title then renders as plain text, no chevron.
 * @param {boolean} [props.switcherOpen=false] Rotates the chevron.
 * @param {"setup"|"result"} props.view The half currently on screen.
 * @param {(view: string) => void} props.onViewChange
 * @param {() => void} props.onClose
 * @param {string} [props.resultLabel="Result"] Override for tools whose right
 *   side isn't a result grid (e.g. "Preview").
 */
export default function ToolModalMobileHeader({
  title,
  subtitle,
  onTitleClick,
  switcherOpen = false,
  view,
  onViewChange,
  onClose,
  resultLabel = "Result",
}) {
  return (
    <div className="lg:hidden shrink-0 border-b border-gray-200 bg-surface">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          {onTitleClick ? (
            <button
              onClick={onTitleClick}
              className="flex items-center gap-1.5 max-w-full font-bold text-lg text-gray-900 hover:opacity-70 transition-opacity cursor-pointer"
            >
              <span className="truncate">{title}</span>
              <ChevronDown
                className={`w-4.5 h-4.5 shrink-0 text-gray-500 transition-transform ${switcherOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <h2 className="truncate font-bold text-lg text-gray-900">{title}</h2>
          )}
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="ck-tap shrink-0 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          {VIEWS.map((v) => {
            const active = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                aria-pressed={active}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${active ? "bg-surface text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <v.Icon className="w-3.5 h-3.5" />
                {v.id === "result" ? resultLabel : v.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
