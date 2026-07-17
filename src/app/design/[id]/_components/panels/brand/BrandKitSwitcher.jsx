"use client";

import React, { useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";

/**
 * BrandKitSwitcher — picks the active brand. Selection is handed straight to
 * AuthContext's setActiveBrand, which owns the localStorage mirror and the
 * backend sync; this component must not persist anything itself.
 *
 * Props: { brands, activeBrand, loading, onSelect: (brand) => void }
 */
export default function BrandKitSwitcher({ brands, activeBrand, loading, onSelect }) {
  const [open, setOpen] = useState(false);
  const list = brands || [];

  const select = (brand) => {
    onSelect(brand);
    setOpen(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading || !list.length}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50 disabled:hover:bg-transparent disabled:cursor-default cursor-pointer transition"
      >
        <BrandAvatar brand={activeBrand} />
        <span className="flex-1 min-w-0 text-left text-xs font-semibold text-gray-800 truncate">
          {loading ? "Loading…" : activeBrand?.name || "No brand"}
        </span>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-gray-400 shrink-0 animate-spin" />
        ) : (
          list.length > 0 && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          )
        )}
      </button>

      {open && (
        <ul className="max-h-56 overflow-y-auto border-t border-gray-100 p-1">
          {list.map((brand) => (
            <li key={brand.id}>
              <button
                onClick={() => select(brand)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition ${
                  brand.id === activeBrand?.id ? "bg-blue-50/60" : "hover:bg-gray-50"
                }`}
              >
                <BrandAvatar brand={brand} />
                <span className="flex-1 min-w-0 text-left text-xs text-gray-800 truncate">
                  {brand.name}
                </span>
                {brand.id === activeBrand?.id && (
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The brand's primary colour as its mark, with the initial on top. */
function BrandAvatar({ brand }) {
  return (
    <span
      className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-black/5"
      style={{ background: brand?.primary_color || "#94a3b8" }}
    >
      {(brand?.name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
