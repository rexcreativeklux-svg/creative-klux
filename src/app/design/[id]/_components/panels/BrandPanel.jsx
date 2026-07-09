"use client";

import React from "react";
import { ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NEUTRALS = ["#ffffff", "#f5f5f5", "#111111", "#1e293b", "#f8fafc", "#fef3c7"];

/**
 * Brand panel — surfaces the active brand's logo + colors. Clicking the logo
 * drops it as an image; clicking a color applies it to the selected element
 * (its fill/text color) or, with nothing selected, sets the page background.
 */
export default function BrandPanel({ insert, setBackground, editor }) {
  const { activeBrand } = useAuth();

  const brandColors = [
    activeBrand?.primary_color,
    activeBrand?.secondary_color,
  ].filter(Boolean);

  const applyColor = (color) => {
    const sel = editor?.selectedElement;
    if (sel && sel.type === "shape") {
      editor.updateElement(sel.id, { fill: color }, { record: true });
    } else if (sel && sel.type === "text") {
      editor.updateElement(sel.id, { fill: color, color }, { record: true });
    } else {
      setBackground(color);
    }
  };

  return (
    <div className="p-3 flex flex-col gap-5">
      {/* Logo */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Logo
        </p>
        {activeBrand?.logo ? (
          <button
            onClick={() => insert.imageUrl(activeBrand.logo)}
            className="w-full h-24 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition bg-gray-50 flex items-center justify-center p-3"
            title="Add logo to canvas"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeBrand.logo}
              alt="Brand logo"
              className="max-h-full max-w-full object-contain"
            />
          </button>
        ) : (
          <div className="w-full h-20 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300">
            <ImageIcon className="w-6 h-6" />
            <span className="text-[11px] text-gray-400">No brand logo</span>
          </div>
        )}
      </div>

      {/* Brand colors */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Brand colors
        </p>
        {brandColors.length ? (
          <div className="flex flex-wrap gap-2">
            {brandColors.map((c) => (
              <Swatch key={c} color={c} onClick={() => applyColor(c)} labelled />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No brand colors set</p>
        )}
        <p className="text-[10px] text-gray-400 mt-2">
          {editor?.selectedElement
            ? "Applies to the selected element"
            : "Applies to the page background"}
        </p>
      </div>

      {/* Backgrounds */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Page background
        </p>
        <div className="flex flex-wrap gap-2">
          {NEUTRALS.map((c) => (
            <Swatch key={c} color={c} onClick={() => setBackground(c)} />
          ))}
          <label
            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex items-center justify-center text-[10px] text-gray-500 hover:border-blue-400 transition relative overflow-hidden"
            title="Custom color"
          >
            +
            <input
              type="color"
              onChange={(e) => setBackground(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function Swatch({ color, onClick, labelled }) {
  return (
    <button
      onClick={onClick}
      title={labelled ? color : "Set background"}
      className="w-9 h-9 rounded-lg border border-gray-200 hover:scale-105 hover:border-blue-400 transition cursor-pointer shadow-sm"
      style={{ background: color }}
    />
  );
}
