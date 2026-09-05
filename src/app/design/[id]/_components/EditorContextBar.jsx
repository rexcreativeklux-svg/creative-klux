"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  CirclePlus,
  MoveVertical,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Square,
  ImageUp,
  ImageOff,
  BarChart3,
  LineChart,
  PieChart,
  CircleDashed,
  Table2,
  Trash2,
  Wand2,
  Play,
  Move,
  Blend,
  SlidersHorizontal,
  Eraser,
  Crop,
  Sparkles,
  PenLine,
  Droplet,
} from "lucide-react";
import { isLineShape } from "@/(lib)/design/shapes";
import { addRow, addCol, removeRow, removeCol } from "@/(lib)/design/tableUtils";
import { gridCellRects, resizeGridCells } from "@/(lib)/design/grids";
import { CHART_TYPES } from "@/(lib)/design/charts";
import { EDITOR_FONTS } from "@/(lib)/design/fonts";
import { radiusToNumber } from "@/(lib)/design/radius";
import {
  DEFAULT_TINT_STRENGTH,
  isColourValue,
} from "@/(lib)/design/imageTint";
import {
  groupHasType,
  groupRadiusLimit,
  readGroupStyle,
} from "@/(lib)/design/groupStyling";

const CHART_ICONS = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  donut: CircleDashed,
};

/**
 * Floating formatting toolbar for the selected element (top of the stage).
 * Renders type-specific formatting — rich text controls, shape fill, etc. The
 * per-element *actions* (lock / duplicate / delete / layer order) live in the
 * floating EditorElementMenu pinned to the element itself.
 */
export default function EditorContextBar({
  element,
  onChange,
  addNodeMode,
  onToggleAddNode,
  activeCell,
  onClearActiveCell,
  onOpenFontPanel,
  onOpenColorPanel,
  onOpenEffectsPanel,
  onOpenShapeEffectsPanel,
  onOpenAnimatePanel,
  onOpenPositionPanel,
  onOpenImageTool,
  onRemoveBg,
  onStartCrop,
  onStartErase,
  onFrameFill,
}) {
  const [menu, setMenu] = useState(null); // 'spacing' | null

  if (!element) return null;

  const patch = (p) => onChange(element.id, p, { record: true });
  // Table row/col helpers return {} when they'd drop below 1×1 — skip those so
  // hitting the limit doesn't push an empty (no-op) undo entry.
  const tableEdit = (p) => {
    if (p && Object.keys(p).length) patch(p);
  };
  // Delete the row/column of the clicked cell (falls back to the last track when
  // nothing is selected), then drop the now-stale active cell.
  const deleteTrack = (fn, index) => {
    const p = fn(element, index);
    if (p && Object.keys(p).length) {
      patch(p);
      onClearActiveCell?.();
    }
  };

  const isLine = element.type === "shape" && isLineShape(element.shape);
  const isCurve = element.type === "curve";

  const isBold =
    element.fontWeight === "bold" || Number(element.fontWeight) >= 600;

  // A group's controls are decided by what is INSIDE it, not by the group.
  const isGroupEl = element.type === "group";
  const groupHasText = isGroupEl && groupHasType(element, "text");
  const groupWeight = isGroupEl ? readGroupStyle(element, "fontWeight") : null;
  const groupBold = groupWeight === "bold" || Number(groupWeight) >= 600;

  // Centred pill at `lg`, full-width strip below.
  // `max-w-[calc(100vw-340px)]` was reserving room for the editor's rail +
  // panel (340px) — chrome that no longer sits beside the canvas below `lg`,
  // where that sum goes NEGATIVE on a 360px screen and collapses the bar.
  // Below `lg` it spans the viewport with its own inset instead, and scrolls
  // horizontally: a text element's toolbar is a dozen controls and no phone
  // width will ever hold them all at once.
  return (
    <div className="absolute top-3 inset-x-2 z-[9999] lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2">
      <div className="flex items-center gap-1.5 bg-surface border border-gray-200 shadow-lg rounded-xl px-2 py-1.5 overflow-x-auto hide-scrollbar lg:max-w-[calc(100vw-340px)]">
        {element.type === "text" && (
        <>
          <FontButton value={element.fontFamily} onClick={onOpenFontPanel} />
          {/* Sticky notes auto-fit their font, so no manual size control. */}
          {!element.sticky && (
            <SizeStepper
              value={element.fontSize || 40}
              onChange={(v) => patch({ fontSize: v })}
            />
          )}
          <ColorInput
            value={element.fill || element.color || "#111111"}
            keys={["fill", "color"]}
            title="Text color"
            onOpen={onOpenColorPanel}
          />
          {element.sticky && (
            <ColorInput
              value={element.background || "#FEF08A"}
              keys={["background"]}
              title="Note color"
              onOpen={onOpenColorPanel}
            />
          )}
          <Toggle
            active={isBold}
            onClick={() => patch({ fontWeight: isBold ? "normal" : "bold" })}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={element.fontStyle === "italic"}
            onClick={() =>
              patch({
                fontStyle: element.fontStyle === "italic" ? "normal" : "italic",
              })
            }
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={!!element.underline}
            onClick={() => patch({ underline: !element.underline })}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Toggle>
          <div className="flex items-center">
            {[
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ].map(([al, Icon]) => (
              <Toggle
                key={al}
                active={(element.textAlign || "left") === al}
                onClick={() => patch({ textAlign: al })}
                title={`Align ${al}`}
              >
                <Icon className="w-4 h-4" />
              </Toggle>
            ))}
          </div>
          <Toggle
            active={menu === "spacing"}
            onClick={() => setMenu((m) => (m === "spacing" ? null : "spacing"))}
            title="Spacing"
          >
            <MoveVertical className="w-4 h-4" />
          </Toggle>
          <Divider />
          <PanelButton
            icon={Wand2}
            label="Effects"
            active={!!element.textEffect && element.textEffect.type !== "none"}
            onClick={onOpenEffectsPanel}
          />
          <Divider />
        </>
      )}

      {isLine && (
        <>
          <ColorInput
            value={element.fill || "#111111"}
            keys={["fill"]}
            title="Line color"
            onOpen={onOpenColorPanel}
          />
          {/* Thickness. A straight line had no weight control at all — only
              curves did — so the one shape whose entire appearance is its
              stroke was the one you couldn't set the stroke on. */}
          <Toggle
            active={menu === "lineWeight"}
            onClick={() =>
              setMenu((m) => (m === "lineWeight" ? null : "lineWeight"))
            }
            title="Thickness"
          >
            <PenLine className="w-4 h-4" />
          </Toggle>
          <DirectionControl
            rotation={element.rotation || 0}
            onSet={(deg) => patch({ rotation: deg })}
          />
          <AddNodeToggle active={addNodeMode} onClick={onToggleAddNode} />
          <Divider />
        </>
      )}

      {isCurve && (
        <>
          <ColorInput
            value={element.stroke || "#111111"}
            keys={["stroke"]}
            title="Line color"
            onOpen={onOpenColorPanel}
          />
          <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
            Weight
            <input
              type="range"
              min={1}
              max={40}
              value={element.strokeWidth || 4}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
          </label>
          <AddNodeToggle active={addNodeMode} onClick={onToggleAddNode} />
          <Divider />
        </>
      )}

      {element.type === "table" && (
        <>
          <ColorInput
            value={element.headerFill || "#f3f4f6"}
            keys={["headerFill"]}
            title="Header color"
            onOpen={onOpenColorPanel}
          />
          <ColorInput
            value={element.cellFill || "#ffffff"}
            keys={["cellFill"]}
            title="Cell color"
            onOpen={onOpenColorPanel}
          />
          <ColorInput
            value={element.textColor || "#111827"}
            keys={["textColor"]}
            title="Text color"
            onOpen={onOpenColorPanel}
          />
          <ColorInput
            value={element.borderColor || "#d1d5db"}
            keys={["borderColor"]}
            title="Border color"
            onOpen={onOpenColorPanel}
          />
          <Toggle
            active={element.headerRow !== false}
            onClick={() => patch({ headerRow: element.headerRow === false })}
            title="Header row"
          >
            <span className="text-[11px] font-semibold">H</span>
          </Toggle>
          <div className="flex items-center">
            {[
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ].map(([al, Icon]) => (
              <Toggle
                key={al}
                active={(element.align || "left") === al}
                onClick={() => patch({ align: al })}
                title={`Align ${al}`}
              >
                <Icon className="w-4 h-4" />
              </Toggle>
            ))}
          </div>
          <Divider />
          <IconBtn onClick={() => tableEdit(addRow(element))} title="Add row">
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Plus className="w-3.5 h-3.5" />R
            </span>
          </IconBtn>
          <IconBtn onClick={() => tableEdit(addCol(element))} title="Add column">
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Plus className="w-3.5 h-3.5" />C
            </span>
          </IconBtn>
          <IconBtn
            onClick={() => deleteTrack(removeRow, activeCell?.r)}
            title={
              activeCell ? "Delete selected row" : "Delete last row"
            }
          >
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Minus className="w-3.5 h-3.5" />R
            </span>
          </IconBtn>
          <IconBtn
            onClick={() => deleteTrack(removeCol, activeCell?.c)}
            title={
              activeCell ? "Delete selected column" : "Delete last column"
            }
          >
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Minus className="w-3.5 h-3.5" />C
            </span>
          </IconBtn>
          <Divider />
        </>
      )}

      {element.type === "shape" && !isLine && (
        <>
          <ColorInput
            value={element.fill || "#6366f1"}
            keys={["fill"]}
            title="Fill"
            onOpen={onOpenColorPanel}
          />
          {/* Outline. Shapes have always STORED stroke/strokeWidth — the
              renderer and the exporter both draw them — but nothing in the UI
              could set them, so every shape was permanently borderless. */}
          <ColorInput
            value={element.stroke || "#111111"}
            keys={["stroke"]}
            title="Outline color"
            onOpen={onOpenColorPanel}
          />
          <Toggle
            active={menu === "outline"}
            onClick={() => setMenu((m) => (m === "outline" ? null : "outline"))}
            title="Outline weight & style"
          >
            <PenLine className="w-4 h-4" />
          </Toggle>
          <PanelButton
            icon={Wand2}
            label="Effects"
            active={Boolean(element.shapeEffect && element.shapeEffect.type !== "none")}
            onClick={onOpenShapeEffectsPanel}
          />
          {element.shape !== "circle" && element.shape !== "triangle" && (
            <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
              Radius
              <input
                type="range"
                min={0}
                max={Math.round(Math.min(element.width, element.height) / 2)}
                value={element.borderRadius || 0}
                onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
                className="w-16 cursor-pointer"
              />
            </label>
          )}
          <Divider />
        </>
      )}

      {element.type === "frame" && (
        <>
          <ReplaceImageButton
            onFile={(file) => onFrameFill?.(element.id, file)}
          />
          {element.src && (
            <Toggle
              active={false}
              onClick={() => patch({ src: null })}
              title="Detach image"
            >
              <ImageOff className="w-4 h-4" />
            </Toggle>
          )}
          <Toggle
            active={!!element.flipH}
            onClick={() => patch({ flipH: !element.flipH })}
            title="Flip horizontal"
          >
            <FlipHorizontal className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={!!element.flipV}
            onClick={() => patch({ flipV: !element.flipV })}
            title="Flip vertical"
          >
            <FlipVertical className="w-4 h-4" />
          </Toggle>
          <Divider />
        </>
      )}

      {element.type === "grid" && (
        <>
          <Stepper
            label="Rows"
            value={element.rows || 1}
            onChange={(v) =>
              patch({
                rows: v,
                cells: resizeGridCells(element.cells, v, element.cols || 1),
                rowFr: undefined, // reset to equal tracks on count change
              })
            }
          />
          <Stepper
            label="Cols"
            value={element.cols || 1}
            onChange={(v) =>
              patch({
                cols: v,
                cells: resizeGridCells(element.cells, element.rows || 1, v),
                colFr: undefined,
              })
            }
          />
          <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
            Gap
            <input
              type="range"
              min={0}
              max={40}
              value={element.gap ?? 8}
              onChange={(e) => patch({ gap: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
          </label>
          <Toggle
            active={menu === "gridRounding"}
            onClick={() =>
              setMenu((m) => (m === "gridRounding" ? null : "gridRounding"))
            }
            title="Corner rounding"
          >
            <Square className="w-4 h-4" />
          </Toggle>
          <Divider />
        </>
      )}

      {element.type === "chart" && (
        <>
          <div className="flex items-center">
            {CHART_TYPES.map((t) => {
              const Icon = CHART_ICONS[t.id] || BarChart3;
              return (
                <Toggle
                  key={t.id}
                  active={(element.chart || "bar") === t.id}
                  onClick={() => patch({ chart: t.id })}
                  title={`${t.label} chart`}
                >
                  <Icon className="w-4 h-4" />
                </Toggle>
              );
            })}
          </div>
          <Divider />
          <Toggle
            active={menu === "chartData"}
            onClick={() =>
              setMenu((m) => (m === "chartData" ? null : "chartData"))
            }
            title="Edit data"
          >
            <Table2 className="w-4 h-4" />
          </Toggle>
          <Divider />
        </>
      )}

      {element.type === "image" && (
        <>
          {/* Canva-style image toolbar. Edit / BG Remover / Eraser / Crop /
              Effects open contextual panels (some are placeholders for now —
              paste the real designs and we'll fill them in). */}
          <PanelButton
            icon={SlidersHorizontal}
            label="Edit"
            onClick={() => onOpenImageTool?.("img-edit")}
          />
          <PanelButton
            icon={Sparkles}
            label="BG Remover"
            onClick={() => onRemoveBg?.(element.id)}
          />
          <PanelButton
            icon={Eraser}
            label="Eraser"
            onClick={() => onStartErase?.(element.id)}
          />
          <Divider />
          {/* Colour. Fills the box behind the photo AND tints the photo —
              see imageTint.js for why it is deliberately both. */}
          <ColorInput
            value={element.backgroundColor || "#6366f1"}
            keys={["backgroundColor"]}
            title="Color"
            onOpen={onOpenColorPanel}
          />
          {/* The strength dial only means anything once a colour is on it. */}
          {isColourValue(element.backgroundColor) && (
            <Toggle
              active={menu === "tint"}
              onClick={() => setMenu((m) => (m === "tint" ? null : "tint"))}
              title="Color strength"
            >
              <Droplet className="w-4 h-4" />
            </Toggle>
          )}
          <Toggle
            active={(element.objectFit || "cover") === "contain"}
            onClick={() =>
              patch({
                objectFit:
                  element.objectFit === "contain" ? "cover" : "contain",
              })
            }
            title={
              element.objectFit === "contain"
                ? "Fit — whole image shown"
                : "Fill — crop to box"
            }
          >
            <Maximize2 className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={menu === "rounding"}
            onClick={() =>
              setMenu((m) => (m === "rounding" ? null : "rounding"))
            }
            title="Corner rounding"
          >
            <Square className="w-4 h-4" />
          </Toggle>
          <PanelButton
            icon={Crop}
            label="Crop"
            onClick={() => onStartCrop?.(element.id)}
          />
          <Toggle
            active={!!element.flipH}
            onClick={() => patch({ flipH: !element.flipH })}
            title="Flip horizontal"
          >
            <FlipHorizontal className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={!!element.flipV}
            onClick={() => patch({ flipV: !element.flipV })}
            title="Flip vertical"
          >
            <FlipVertical className="w-4 h-4" />
          </Toggle>
          <Divider />
        </>
      )}

        {/* ── A selected GROUP ────────────────────────────────────────────
            The UNION of what its contents can be styled with, all on screen at
            once — which is why it is the longest bar in the editor. One swatch
            paints every photo, shape and word in there; the font controls appear
            because there IS text in there, and act on the text.

            Deliberately not a switcher between the per-type bars: grouping
            things is how you say "treat these as one", so asking which of them
            you meant before every change is asking the question the group
            already answered. Reaching one member on its own is a different
            gesture and already works — click again inside a selected group and
            that member gets its own ordinary bar.

            Nothing here knows how a type stores what it is given (a colour is
            `fill` on a shape, `color` on text, `stroke` on a curve). The bar
            writes one group-level patch and groupStyling deals it out. */}
        {isGroupEl && (
          <>
            <ColorInput
              value={readGroupStyle(element, "fill") || "#111111"}
              keys={["fill"]}
              title="Color"
              onOpen={onOpenColorPanel}
            />

            {groupRadiusLimit(element) > 0 && (
              <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
                Radius
                <input
                  type="range"
                  min={0}
                  // The group's own box would be far too generous a maximum —
                  // half of a big group swallows a small swatch inside it whole.
                  max={groupRadiusLimit(element)}
                  value={readGroupStyle(element, "borderRadius") || 0}
                  onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
                  className="w-16 cursor-pointer"
                />
              </label>
            )}

            {groupHasText && (
              <>
                <Divider />
                <FontButton
                  value={readGroupStyle(element, "fontFamily")}
                  onClick={onOpenFontPanel}
                />
                {/* Every text box in the group is set to this size, rather than
                    scaled by the ratio — the group's corner handles are the
                    control that preserves relative sizes, and this is the one
                    that makes them agree. */}
                <SizeStepper
                  value={readGroupStyle(element, "fontSize") || 40}
                  onChange={(v) => patch({ fontSize: v })}
                />
                <Toggle
                  active={groupBold}
                  onClick={() => patch({ fontWeight: groupBold ? "normal" : "bold" })}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Toggle>
                <Toggle
                  active={readGroupStyle(element, "fontStyle") === "italic"}
                  onClick={() =>
                    patch({
                      fontStyle:
                        readGroupStyle(element, "fontStyle") === "italic"
                          ? "normal"
                          : "italic",
                    })
                  }
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Toggle>
                <Toggle
                  active={!!readGroupStyle(element, "underline")}
                  onClick={() =>
                    patch({ underline: !readGroupStyle(element, "underline") })
                  }
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </Toggle>
                <div className="flex items-center">
                  {[
                    ["left", AlignLeft],
                    ["center", AlignCenter],
                    ["right", AlignRight],
                  ].map(([al, Icon]) => (
                    <Toggle
                      key={al}
                      active={(readGroupStyle(element, "textAlign") || "left") === al}
                      onClick={() => patch({ textAlign: al })}
                      title={`Align ${al}`}
                    >
                      <Icon className="w-4 h-4" />
                    </Toggle>
                  ))}
                </div>
                <Toggle
                  active={menu === "spacing"}
                  onClick={() => setMenu((m) => (m === "spacing" ? null : "spacing"))}
                  title="Spacing"
                >
                  <MoveVertical className="w-4 h-4" />
                </Toggle>
                <Divider />
                <PanelButton
                  icon={Wand2}
                  label="Effects"
                  onClick={onOpenEffectsPanel}
                />
              </>
            )}
            <Divider />
          </>
        )}

        {/* Animate + Position — shared across element types */}
        <PanelButton
          icon={Play}
          label="Animate"
          active={!!element.animation && element.animation.type !== "none"}
          onClick={onOpenAnimatePanel}
        />
        <PanelButton icon={Move} label="Position" onClick={onOpenPositionPanel} />
        <Divider />

        {/* Transparency — shared (Canva-style popover) */}
        <Toggle
          active={menu === "transparency"}
          onClick={() =>
            setMenu((m) => (m === "transparency" ? null : "transparency"))
          }
          title="Transparency"
        >
          <Blend className="w-4 h-4" />
        </Toggle>
      </div>

      {/* Spacing popover — sibling of the scroll row so it isn't clipped by
          overflow-x-auto. Text, or a group with text in it: the group reads its
          members' current values and writes back through them. */}
      {menu === "spacing" && (element.type === "text" || groupHasText) && (
        <SpacingPopover
          letterSpacing={
            Number(isGroupEl ? readGroupStyle(element, "letterSpacing") : element.letterSpacing) || 0
          }
          lineHeight={
            (isGroupEl ? readGroupStyle(element, "lineHeight") : element.lineHeight) || 1.3
          }
          onLetter={(v) => patch({ letterSpacing: v })}
          onLine={(v) => patch({ lineHeight: v })}
        />
      )}

      {/* Straight-line thickness. `strokeWidth` is what the line renderers and
          the exporter already read for a curve, so it needs no new property. */}
      {menu === "lineWeight" && isLine && (
        <SliderPopover
          label="Thickness"
          min={1}
          max={40}
          value={Number(element.strokeWidth) || 3}
          onChange={(v) => patch({ strokeWidth: v })}
        />
      )}

      {/* Colour strength. Images only, and only once a colour is set. */}
      {menu === "tint" && element.type === "image" && (
        <SliderPopover
          label="Color strength"
          min={0}
          max={100}
          value={Math.round(
            (element.tintStrength ?? DEFAULT_TINT_STRENGTH) * 100,
          )}
          onChange={(v) => patch({ tintStrength: v / 100 })}
        />
      )}

      {/* Outline weight & style. Shapes only. */}
      {menu === "outline" && element.type === "shape" && (
        <OutlinePopover
          width={Number(element.strokeWidth) || 0}
          dash={element.strokeDash || "solid"}
          onWidth={(v) =>
            patch({
              strokeWidth: v,
              // A width with no colour draws nothing, so the first nudge of the
              // slider seeds one rather than silently doing nothing.
              ...(v > 0 && !element.stroke ? { stroke: "#111111" } : {}),
            })
          }
          onDash={(v) => patch({ strokeDash: v })}
        />
      )}

      {/* Corner-rounding popover — sibling of the scroll row (not clipped by
          overflow-x-auto). Image only. */}
      {menu === "rounding" && element.type === "image" && (
        <RoundingPopover
          value={radiusToNumber(element.borderRadius)}
          max={Math.round(Math.min(element.width, element.height) / 2)}
          onChange={(v) => patch({ borderRadius: v })}
        />
      )}

      {/* Grid cell-rounding popover. Max = half the smallest cell edge. */}
      {menu === "gridRounding" && element.type === "grid" && (
        <RoundingPopover
          value={element.cellRadius || 0}
          max={gridCellMaxRadius(element)}
          onChange={(v) => patch({ cellRadius: v })}
        />
      )}

      {/* Chart data editor. */}
      {menu === "chartData" && element.type === "chart" && (
        <ChartDataPopover
          data={element.data || []}
          onChange={(data) => patch({ data })}
        />
      )}

      {/* Transparency — shared across element types. */}
      {menu === "transparency" && (
        <TransparencyPopover
          value={Math.round((element.opacity ?? 1) * 100)}
          onChange={(v) => patch({ opacity: v / 100 })}
        />
      )}
    </div>
  );
}

/** Element transparency (opacity) slider, dropped below the toolbar. Canva
 *  labels this "Transparency"; 100 = fully opaque, 0 = invisible. */
function TransparencyPopover({ value, onChange }) {
  return (
    <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-surface p-4 shadow-2xl z-[9999]">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">Transparency</p>
        <span className="w-12 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

/** Editable label/value rows for a chart, dropped below the toolbar. */
function ChartDataPopover({ data, onChange }) {
  const rows = data.length ? data : [{ label: "", value: 0 }];
  const setRow = (i, key, val) =>
    onChange(rows.map((r, k) => (k === i ? { ...r, [key]: val } : r)));
  const addRowItem = () => onChange([...rows, { label: "New", value: 0 }]);
  const removeRowItem = (i) =>
    onChange(rows.filter((_, k) => k !== i).length ? rows.filter((_, k) => k !== i) : rows);

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl border border-gray-100 bg-surface p-3 shadow-2xl">
      <p className="text-sm font-semibold text-gray-700 mb-2">Chart data</p>
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={r.label ?? ""}
              onChange={(e) => setRow(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
            />
            <input
              type="number"
              value={r.value ?? 0}
              onChange={(e) => setRow(i, "value", Number(e.target.value))}
              placeholder="0"
              className="w-16 h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 text-center tabular-nums focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={() => removeRowItem(i)}
              title="Remove row"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer transition shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addRowItem}
        className="mt-2 w-full h-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition"
      >
        + Add row
      </button>
    </div>
  );
}

// Half the shortest cell edge — the largest sensible corner radius for a grid.
function gridCellMaxRadius(el) {
  const rects = gridCellRects(el);
  const cell = rects[0] || { w: el.width, h: el.height };
  return Math.round(Math.min(cell.w, cell.h) / 2);
}

/** Image swatch that opens a file picker and hands the chosen file back — used
 *  by the frame toolbar to fill/replace the frame's image. */
function ReplaceImageButton({ onFile }) {
  const ref = useRef(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        title="Replace image"
        className="h-8 flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer shrink-0"
      >
        <ImageUp className="w-4 h-4" />
        Replace
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
        className="hidden"
      />
    </>
  );
}

/** Compact − label + labelled numeric stepper (grid rows/cols), clamped 1–12. */
function Stepper({ label, value, onChange, min = 1, max = 12 }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, Math.round(v))));
  return (
    <div className="flex items-center rounded-lg border border-gray-200 h-8">
      <button
        onClick={() => set(value - 1)}
        title={`Fewer ${label.toLowerCase()}`}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="px-1 text-[11px] text-gray-600 tabular-nums select-none">
        {label} {value}
      </span>
      <button
        onClick={() => set(value + 1)}
        title={`More ${label.toLowerCase()}`}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Single "Corner rounding" slider dropped below the toolbar (image only). */
/**
 * Outline weight and style for a shape.
 *
 * The three styles write `strokeDash`, a name rather than a dash array, so the
 * three renderers that have to draw it — a div's border, an SVG stroke and the
 * export canvas — can each express it in their own terms instead of agreeing on
 * one number. See DASH_PATTERNS in shapes.js.
 */
/** One labelled slider in a popover — the shape every single-knob control takes. */
function SliderPopover({ label, min, max, value, onChange }) {
  return (
    <div className="absolute right-0 top-full z-[9999] mt-1 w-56 rounded-xl border border-gray-100 bg-surface p-3 shadow-2xl">
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-xs font-medium text-gray-600">
          {label}
          <span className="tabular-nums text-gray-400">{value}</span>
        </span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </label>
    </div>
  );
}

function OutlinePopover({ width, dash, onWidth, onDash }) {
  return (
    <div className="absolute right-0 top-full z-[9999] mt-1 w-56 rounded-xl border border-gray-100 bg-surface p-3 shadow-2xl flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-xs font-medium text-gray-600">
          Weight
          <span className="tabular-nums text-gray-400">{width}</span>
        </span>
        <input
          type="range"
          min={0}
          max={40}
          value={width}
          onChange={(e) => onWidth(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">Style</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["solid", "Solid"],
            ["dashed", "Dashed"],
            ["dotted", "Dotted"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => onDash(id)}
              title={label}
              className={`h-9 rounded-lg border flex items-center justify-center px-2 transition cursor-pointer ${
                dash === id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span
                className="block w-full border-t-2 border-gray-700"
                style={{ borderTopStyle: id }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoundingPopover({ value, max, onChange }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl border border-gray-100 bg-surface p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">Corner rounding</p>
        <span className="w-12 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(1, max)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function AddNodeToggle({ active, onClick }) {
  return (
    <Toggle
      active={active}
      onClick={onClick}
      title={active ? "Click the line to add a node (Esc to stop)" : "Add node"}
    >
      <CirclePlus className="w-4 h-4" />
    </Toggle>
  );
}

function DirectionControl({ rotation, onSet }) {
  // Lines look identical at r and r+180, so normalize into [0,180) for matching.
  const norm = Math.round((((rotation % 180) + 180) % 180));
  const dirs = [
    { deg: 0, label: "Horizontal" },
    { deg: 45, label: "Diagonal down" },
    { deg: 90, label: "Vertical" },
    { deg: 135, label: "Diagonal up" },
  ];
  return (
    <div className="flex items-center">
      {dirs.map((d) => (
        <Toggle
          key={d.deg}
          active={norm === d.deg}
          onClick={() => onSet(d.deg)}
          title={d.label}
        >
          <Minus className="w-4 h-4" style={{ transform: `rotate(${d.deg}deg)` }} />
        </Toggle>
      ))}
    </div>
  );
}

/** Colour swatch. Clicking it opens the Color side panel (Canva-style) rather
 *  than the native OS colour picker. `keys` names the element properties the
 *  picked colour is written to; `fallback` is the colour to seed the panel with
 *  when the element has none of those keys set. */
function ColorInput({ value, title, keys, fallback, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.({ title, keys, fallback: fallback ?? value })}
      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden relative shrink-0"
      title={title}
      style={{ background: value }}
    />
  );
}

function Toggle({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
        active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

/** Font-family control. Clicking it opens the Font side panel (Canva-style)
 *  rather than a dropdown. Shows the current font's name in its own face. */
function FontButton({ value, onClick }) {
  const match = EDITOR_FONTS.find((f) => f.family === value);
  return (
    <button
      onClick={onClick}
      title="Font"
      className="h-8 max-w-[130px] flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
    >
      <span className="truncate" style={{ fontFamily: match?.family }}>
        {match?.name || "Font"}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    </button>
  );
}

/** Labelled icon button opening a side panel (Effects / Animate / Position). */
function PanelButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-8 flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition cursor-pointer shrink-0 ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** Font-size stepper: − [value] + (Canva-style). */
function SizeStepper({ value, onChange }) {
  const set = (v) => onChange(Math.max(1, Math.min(800, Math.round(v))));
  return (
    <div className="flex items-center rounded-lg border border-gray-200 h-8">
      <button
        onClick={() => set(value - 2)}
        title="Smaller"
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => set(Number(e.target.value) || 1)}
        className="w-10 h-full text-center text-xs text-gray-700 tabular-nums focus:outline-none bg-transparent"
      />
      <button
        onClick={() => set(value + 2)}
        title="Larger"
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Letter-spacing + line-height sliders, dropped below the toolbar. */
function SpacingPopover({ letterSpacing, lineHeight, onLetter, onLine }) {
  return (
    <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-surface p-4 shadow-2xl flex flex-col gap-4">
      <SpacingSlider
        label="Letter spacing"
        min={-5}
        max={30}
        step={0.5}
        value={letterSpacing}
        onChange={onLetter}
      />
      <SpacingSlider
        label="Line spacing"
        min={0.8}
        max={3}
        step={0.1}
        value={lineHeight}
        onChange={onLine}
      />
    </div>
  );
}

function SpacingSlider({ label, min, max, step, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="w-12 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer text-gray-500 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-6 bg-gray-200 mx-0.5 shrink-0" />;
}
