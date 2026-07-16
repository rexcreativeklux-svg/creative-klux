/**
 * TabsNav.jsx
 * Horizontal, scroll-on-overflow tab bar for the management page.
 * Renders straight from TAB_CONFIG; the active tab gets a blue underline.
 */

"use client";

export default function TabsNav({ tabs, activeId, onChange }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface px-2 sm:px-3">
      {/* Scroll container — tabs never wrap; they scroll-x on small screens. */}
      <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden hide-scrollbar">
        {tabs.map(({ id, label, Icon, badge }) => {
          const isActive = id === activeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-4 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "text-[#155dfc]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive
                    ? "text-[#155dfc]"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {label}
              {badge && (
                <span className="ml-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                  {badge}
                </span>
              )}
              {/* Active underline */}
              <span
                className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#155dfc] transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
