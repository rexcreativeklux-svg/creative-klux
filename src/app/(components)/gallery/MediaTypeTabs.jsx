"use client";

// components/gallery/MediaTypeTabs.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Images · Videos · Audio · Docs tab bar. Rendered wherever a gallery
// surface needs to switch media types (the gallery page, the picker library).
// Renders nothing when there's a single type (e.g. an image-only picker) so
// callers get a clean single-list view with no redundant tab.

/**
 * @param {object} props
 * @param {{id: string, label: string, icon: React.ComponentType<{className?: string}>}[]} props.tabs
 * @param {string} props.active                Currently selected type id.
 * @param {(id: string) => void} props.onChange
 * @param {Record<string, number>} [props.counts]  Optional per-type item counts.
 * @param {"primary"|"pill"} [props.variant]   "primary" = underline tabs (page),
 *                                             "pill" = compact pills (modal).
 */
export default function MediaTypeTabs({
  tabs = [],
  active,
  onChange,
  counts,
  variant = "primary",
}) {
  if (!tabs || tabs.length <= 1) return null;

  if (variant === "pill") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {counts?.[id] > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // "primary" — underline tabs used as the page's top-level navigation.
  return (
    <div className="flex gap-6 overflow-x-auto overflow-y-hidden border-b border-gray-200">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 pb-3 px-1 -mb-px border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {counts?.[id] > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
