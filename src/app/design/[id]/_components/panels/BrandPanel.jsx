"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { brandFontList } from "./shared/brandFonts";
import BrandKitSwitcher from "./brand/BrandKitSwitcher";
import BrandNavList from "./brand/BrandNavList";
import BrandSectionView from "./brand/BrandSectionView";

/**
 * Brand panel — the Brand Kit: pick a brand, then open Logos, Colors or Fonts.
 *
 * Rendered as EditorSidebar's "dual" variant, so the two columns below are
 * siblings in the sidebar's flex row: the nav stays put and the section opens
 * beside it, rather than replacing it.
 *
 * Props: { insert, editor, setBackground, onClose }
 */
export default function BrandPanel({ onClose, ...props }) {
  const { activeBrand, brands, brandsLoading, setActiveBrand } = useAuth();
  const [section, setSection] = useState(null);

  // Counts come off the same fields the sections render, so a row can't promise
  // content that its panel then reports as empty.
  const counts = useMemo(
    () => ({
      logos: activeBrand?.logo ? 1 : 0,
      colors: [activeBrand?.primary_color, activeBrand?.secondary_color].filter(
        Boolean,
      ).length,
      fonts: brandFontList(activeBrand).length,
    }),
    [activeBrand],
  );

  // Toggle: clicking the open row closes its panel.
  const select = (next) =>
    setSection((cur) => (cur?.id === next.id ? null : next));

  return (
    <>
      <section className="w-[232px] shrink-0 bg-surface border-r border-gray-200 flex flex-col">
        <header className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Brand</h2>
          <button
            onClick={onClose}
            title="Collapse"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <BrandKitSwitcher
            brands={brands}
            activeBrand={activeBrand}
            loading={brandsLoading}
            onSelect={setActiveBrand}
          />
          <BrandNavList
            activeId={section?.id}
            counts={counts}
            onSelect={select}
          />
        </div>
      </section>

      {section && (
        <section className="w-[300px] shrink-0 bg-surface border-r border-gray-200 flex flex-col">
          <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">{section.label}</h2>
            <button
              onClick={() => setSection(null)}
              title="Close"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-3">
            <BrandSectionView section={section} brand={activeBrand} {...props} />
          </div>
        </section>
      )}
    </>
  );
}
