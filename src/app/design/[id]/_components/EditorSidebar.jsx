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
  Scaling,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import TemplatesPanel from "./panels/TemplatesPanel";
import ElementsPanel from "./panels/ElementsPanel";
import TextPanel from "./panels/TextPanel";
import BrandPanel from "./panels/BrandPanel";
import UploadsPanel from "./panels/UploadsPanel";
import ToolsPanel from "./panels/ToolsPanel";
import MagicMediaPanel from "./panels/magic/MagicMediaPanel";
import LayersPanel from "./panels/LayersPanel";
import ResizePanel from "./panels/resize/ResizePanel";
import KluxAiPanel from "./panels/klux/KluxAiPanel";
import KluxLogoIcon from "./panels/klux/KluxLogoIcon";
import FontPanel from "./panels/font/FontPanel";
import ColorPanel from "./panels/color/ColorPanel";
import EffectsPanel from "./panels/effects/EffectsPanel";
import ShapeEffectsPanel from "./panels/effects/ShapeEffectsPanel";
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
  { key: "resize", label: "Resize", icon: Scaling, Panel: ResizePanel },
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
    // ── TWO ARRANGEMENTS OF THE SAME TREE ────────────────────────────────────
    // From `lg` this is what it always was: a vertical icon rail with the
    // active panel as a column beside it, both in the layout flow.
    //
    // Below `lg` that shape is impossible — the rail (72px) plus a panel
    // (300px) is 372px of chrome, which is wider than the phone it has to fit
    // in, leaving nothing for the canvas. So the whole thing lifts out of the
    // flow and pins to the bottom edge: the rail becomes a horizontal bar of
    // icons, and the panel becomes a sheet sitting on top of it.
    //
    // `flex-col-reverse` is what puts the rail underneath: the nav is first in
    // the DOM (so it stays first for tab order and screen readers) but renders
    // at the bottom, with the panel above it.
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col-reverse
                 lg:static lg:z-20 lg:h-full lg:shrink-0 lg:flex-row"
    >
      {/* Icon rail — vertical column at `lg`, horizontal scrolling bar below.
          The bottom padding carries the iOS home indicator so the last row of
          icons is not sitting under it. */}
      <nav
        className="w-full shrink-0 bg-surface border-t border-gray-200 flex flex-row items-center gap-1
                   overflow-x-auto hide-scrollbar px-1 pt-1 pb-[calc(0.25rem+var(--ck-safe-b))]
                   lg:w-18 lg:flex-col lg:border-t-0 lg:border-r lg:overflow-x-visible
                   lg:overflow-y-auto lg:px-0 lg:py-2 lg:pb-2"
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              onClick={() => setActive(on ? null : key)}
              // shrink-0 below lg: these must keep their width and let the bar
              // scroll, rather than compressing ten tabs into 360px.
              className={`w-16 shrink-0 py-2 flex flex-col items-center gap-1 rounded-lg transition cursor-pointer lg:w-14 ${
                on
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
              aria-pressed={on}
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

      {/* Shape effects — the same button on a shape's toolbar. A separate route
          rather than a mode of the one above: the two vocabularies barely
          overlap, and a panel that swaps its whole contents by selection type is
          two panels sharing a name. */}
      {active === "shape-effects" && (
        <ShapeEffectsPanel editor={props.editor} onClose={() => setActive(null)} />
      )}

      {/* Animate — contextual panel; `onPlay` triggers an in-editor preview. */}
      {active === "animate" && (
        <AnimatePanel
          editor={props.editor}
          onPlay={props.onPlayAnimation}
          onClose={() => setActive(null)}
        />
      )}

      {/* Position — Arrange (layer order, align-to-page, exact geometry) and
          Layers (the whole stack). Which tab is open is driven from the editor
          so the element pill's "Show layers" can reach the Layers tab of a
          panel that is already open on Arrange. */}
      {active === "position" && (
        <PositionPanel
          editor={props.editor}
          section={props.positionSection}
          onSectionChange={props.onPositionSection}
          onClose={() => setActive(null)}
        />
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
          <section className="relative w-full shrink-0 flex items-center justify-center bg-surface border-t border-gray-200 lg:w-19 lg:border-t-0">
            {ActivePanel && (
              <ActivePanel {...props} onClose={() => setActive(null)} />
            )}
          </section>
        ) : activeTab.variant === "dual" ? (
          ActivePanel && (
            <ActivePanel {...props} onClose={() => setActive(null)} />
          )
        ) : (
          // Column at `lg`, bottom sheet below it. 55dvh is the compromise the
          // canvas can afford: enough panel to scan a list of templates or
          // elements, while the artboard above stays large enough to see what
          // the change actually did.
          <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
            <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">
                {activeTab.panelTitle || activeTab.label}
              </h2>
              {/* The chevron points left into a rail on desktop and down out of
                  a sheet on mobile — same action, correct direction for each. */}
              <button
                onClick={() => setActive(null)}
                className="ck-tap w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
                title="Collapse"
                aria-label="Close panel"
              >
                <ChevronDown className="w-4 h-4 lg:hidden" />
                <ChevronLeft className="hidden w-4 h-4 lg:block" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {ActivePanel && <ActivePanel {...props} />}
            </div>
          </section>
        ))}
    </div>
  );
}
