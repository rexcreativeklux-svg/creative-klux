"use client";

/**
 * The pieces every settings panel is built from.
 *
 * Seven panels sit behind one nav, so they have to look like seven views of the
 * same screen rather than seven screens. Each one gets its rows, its toggles and
 * its copy-fields from here, which is what stops panel four from inventing a
 * slightly different row height, label size or switch.
 *
 * ⚠️ Deliberately NOT in (components)/ui — nothing outside the copilot settings
 * sheet uses these, and the app's shared primitives (Input, Drawer,
 * ResponsiveModal) are the ones with callers all over the tree. Text inputs are
 * the exception: those ARE the shared `Input`, imported by the panels directly.
 */

import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

/**
 * A titled block of settings. `description` is the small print under the title.
 *
 * `action` puts a control on the RIGHT of the heading instead of under it —
 * the shape a section takes when it is one setting rather than several (Voice,
 * Clone, Delete). Below `sm` it drops beneath the text: a heading, a sentence
 * and a button do not share 320px.
 */
export function Section({ title, description, action, badge, children }) {
  return (
    <section className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            {title}
            {badge}
          </h3>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 sm:pl-4">{action}</div>}
      </div>
      {children && <div className="mt-4 flex flex-col gap-4">{children}</div>}
    </section>
  );
}

/**
 * A setting with its control on the right — the shape almost everything that
 * is not a text field takes. Wrapping in a <label> only when the control is not
 * itself labelled would be a trap, so the control owns its own aria-label.
 */
export function Row({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-gray-900">{title}</p>
        {description && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** An on/off switch. role="switch" so it reads as one to assistive tech. */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      // Ink, not the app's blue: these switches sit next to permission copy
      // where blue reads as "recommended". A permission being ON is a fact, not
      // an endorsement.
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/**
 * A radio group drawn as stacked cards — used where the choice carries a
 * sentence of explanation (who can see this copilot, how long transcripts are
 * kept), which a <select> has nowhere to put.
 *
 * @param {{value: string, label: string, description?: string, Icon?: React.ElementType}[]} options
 */
export function ChoiceList({ name, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors cursor-pointer ${
              active
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {option.Icon && (
              <option.Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-gray-500"}`}
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-gray-900">
                {option.label}
              </span>
              {option.description && (
                <span className="mt-0.5 block text-[12px] leading-relaxed text-gray-500">
                  {option.description}
                </span>
              )}
            </span>
            {/* The tick, not a ring: the card is already the hit target, and a
                custom radio dot here would be a second thing to keep in step. */}
            {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A read-only value with a copy button — IDs, endpoints, share links.
 * Monospace, because every value that lands in one of these is something the
 * user is going to paste somewhere it has to be exact.
 */
export function CopyField({ label, value, hint }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-[12px] font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-[12.5px] text-gray-700">
          {value}
        </p>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 rounded-xl border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      {hint && (
        <p className="mt-1.5 text-[11px] leading-snug text-gray-400">{hint}</p>
      )}
    </div>
  );
}

/** The right-aligned action row a panel ends on. */
export function PanelActions({ children }) {
  return <div className="flex justify-end gap-2 pt-1">{children}</div>;
}

/** The house primary button, at the size these panels use. */
export function PrimaryButton({ className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-900 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Its quiet counterpart — secondary actions, and anything destructive-adjacent.
 * `className` is appended rather than spread through `rest`, which would let a
 * caller's one utility silently replace the whole button.
 */
export function GhostButton({ danger = false, className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-700 hover:bg-gray-100"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
