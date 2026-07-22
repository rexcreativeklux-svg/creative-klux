"use client";

import React, { useState } from "react";
import {
  LayoutTemplate,
  Shapes,
  Type,
  Palette,
  UploadCloud,
  PenTool,
  FolderOpen,
  LayoutGrid,
  Sparkles,
  Layers,
  ChevronLeft,
} from "lucide-react";
import TemplatesPanel from "./panels/TemplatesPanel";
import ElementsPanel from "./panels/ElementsPanel";
import TextPanel from "./panels/TextPanel";
import BrandPanel from "./panels/BrandPanel";
import UploadsPanel from "./panels/UploadsPanel";
import ToolsPanel from "./panels/ToolsPanel";
import MagicMediaPanel from "./panels/magic/MagicMediaPanel";
import LayersPanel from "./panels/LayersPanel";
import KluxAiPanel from "./panels/klux/KluxAiPanel";
import KluxLogoIcon from "./panels/klux/KluxLogoIcon";
import FontPanel from "./panels/font/FontPanel";
import ColorPanel from "./panels/color/ColorPanel";
import EffectsPanel from "./panels/effects/EffectsPanel";
import AnimatePanel from "./panels/animate/AnimatePanel";
import PositionPanel from "./panels/position/PositionPanel";
import EditImagePanel from "./panels/image/EditImagePanel";

/**
 * EditorSidebar — Canva-style navigation: a slim icon rail on the far left and
 * an expandable panel that slides open for the active tab. Clicking the active
 * tab (or the collapse chevron) closes the panel.
 *
 * Props: { insert, setBackground, background, editor }
 * Panels pull brand/gallery data from AuthContext themselves.
 */
// Order mirrors Canva's rail: Creatives → Elements → Text → Brand → Uploads →
// Tools → Projects → Apps → Magic Media. Layers is our own extra at the end.
// `label` is the rail caption; `panelTitle` overrides the panel header when the
// two differ. `variant` lets a panel opt out of the standard 300px column:
// "rail" is a thin strip (Tools), "dual" renders its own columns (Brand).
const TABS = [
  {
    key: "templates",
    label: "Creatives",
    panelTitle: "My Creatives",
    icon: LayoutTemplate,
    Panel: TemplatesPanel,
  },
  { key: "elements", label: "Elements", icon: Shapes, Panel: ElementsPanel },
  { key: "text", label: "Text", icon: Type, Panel: TextPanel },
  {
    key: "brand",
    label: "Brand",
    icon: Palette,
    Panel: BrandPanel,
    variant: "dual",
  },
  { key: "uploads", label: "Uploads", icon: UploadCloud, Panel: UploadsPanel },
  {
    key: "tools",
    label: "Tools",
    icon: PenTool,
    Panel: ToolsPanel,
    variant: "rail",
  },

  { key: "klux", label: "Klux AI", icon: KluxLogoIcon, Panel: KluxAiPanel },
  {
    key: "magic",
    label: "Magic Studio",
    icon: Sparkles,
    Panel: MagicMediaPanel,
  },
  { key: "layers", label: "Layers", icon: Layers, Panel: LayersPanel },
];

export default function EditorSidebar({ active: activeProp, onActiveChange, ...props }) {
  // Controllable: DesignEditor drives `active` so the canvas (e.g. "Ask Klux")
  // can open a panel; falls back to internal state when used uncontrolled.
  const [activeInternal, setActiveInternal] = useState("templates");
  const active = activeProp !== undefined ? activeProp : activeInternal;
  const setActive = onActiveChange || setActiveInternal;

  const activeTab = TABS.find((t) => t.key === active);
  const ActivePanel = activeTab?.Panel;

  return (
    <div className="flex h-full shrink-0 z-20">
      {/* Icon rail */}
      <nav className="w-[72px] shrink-0 bg-surface border-r border-gray-200 flex flex-col items-center py-2 gap-1 overflow-y-auto">
        {TABS.map(({ key, label, icon: Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              onClick={() => setActive(on ? null : key)}
              className={`w-14 py-2 flex flex-col items-center gap-1 rounded-lg transition cursor-pointer ${
                on
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Font browser — a contextual panel (no rail tab) opened from the text
          toolbar's font control; renders its own header + close. */}
      {active === "font" && (
        <FontPanel editor={props.editor} onClose={() => setActive(null)} />
      )}

      {/* Color picker — a contextual panel (no rail tab) opened from the context
          toolbar's colour swatch; renders its own header + close. */}
      {active === "color" && (
        <ColorPanel
          editor={props.editor}
          target={props.colorTarget}
          onClose={() => setActive(null)}
        />
      )}

      {/* Text effects — contextual panel opened from the toolbar's Effects button. */}
      {active === "effects" && (
        <EffectsPanel editor={props.editor} onClose={() => setActive(null)} />
      )}

      {/* Animate — contextual panel; `onPlay` triggers an in-editor preview. */}
      {active === "animate" && (
        <AnimatePanel
          editor={props.editor}
          onPlay={props.onPlayAnimation}
          onClose={() => setActive(null)}
        />
      )}

      {/* Position — layer order, align-to-page, exact geometry. */}
      {active === "position" && (
        <PositionPanel editor={props.editor} onClose={() => setActive(null)} />
      )}

      {/* Edit image — Adjust / Filters / Shadows panel. */}
      {active === "img-edit" && (
        <EditImagePanel
          editor={props.editor}
          imageActions={props.imageActions}
          onClose={() => setActive(null)}
        />
      )}

      {/* Expandable panel. The 'rail' variant (Tools) is a thin, header-less,
          non-clipping strip so its per-tool option flyouts can escape rightward.
          The 'dual' variant (Brand) renders its own columns as siblings in this
          flex row, so it can open a second panel beside its nav list. */}
      {activeTab &&
        (activeTab.variant === "rail" ? (
          <section className="relative w-[76px] shrink-0 flex items-center justify-center">
            {ActivePanel && (
              <ActivePanel {...props} onClose={() => setActive(null)} />
            )}
          </section>
        ) : activeTab.variant === "dual" ? (
          ActivePanel && (
            <ActivePanel {...props} onClose={() => setActive(null)} />
          )
        ) : (
          <section className="w-[300px] shrink-0 bg-surface border-r border-gray-200 flex flex-col">
            <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">
                {activeTab.panelTitle || activeTab.label}
              </h2>
              <button
                onClick={() => setActive(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
                title="Collapse"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">
              {ActivePanel && <ActivePanel {...props} />}
            </div>
          </section>
        ))}
    </div>
  );
}
