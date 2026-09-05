"use client";

import React from "react";
import { X } from "lucide-react";
import ArrangeTab from "./ArrangeTab";
import LayersTab from "./LayersTab";
import { Tabs } from "./positionControls";

const TABS = [
  { id: "arrange", label: "Arrange" },
  { id: "layers", label: "Layers" },
];

/**
 * PositionPanel — Canva-style "Position", opened from the context toolbar.
 *
 * Two tabs over one idea, where it used to be one flat list of controls:
 * Arrange moves the selection through the stack and around the page, Layers
 * shows the stack itself so you can see what "forward" is moving past.
 *
 * The open tab is driven from OUTSIDE (`section` / `onSectionChange`) rather
 * than held here, because the element pill's "Show layers" has to be able to
 * reach the Layers tab of a panel that is already open on Arrange. Local state
 * would be seeded once, on mount, and that click would change nothing.
 *
 * Everything applies to `editor.selectedElement`, read live, so the panel can
 * never hold a reference to an element that has since been deselected — and a
 * selected group MEMBER arrives here as an ordinary element (see groups.js), so
 * the Arrange controls work on it without knowing it lives in a group.
 *
 * Props: { editor, section, onSectionChange, onClose }
 */
export default function PositionPanel({ editor, section, onSectionChange, onClose }) {
  const el = editor?.selectedElement;
  const tab = section === "layers" ? "layers" : "arrange";

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Position</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <Tabs tabs={TABS} value={tab} onChange={onSectionChange} />

      <div className="flex-1 overflow-y-auto">
        {tab === "layers" ? (
          <LayersTab editor={editor} element={el} />
        ) : el ? (
          <ArrangeTab editor={editor} element={el} />
        ) : (
          <p className="px-4 py-6 text-xs text-gray-400">
            Select an element to position it, or open Layers to see the whole
            stack.
          </p>
        )}
      </div>
    </section>
  );
}
