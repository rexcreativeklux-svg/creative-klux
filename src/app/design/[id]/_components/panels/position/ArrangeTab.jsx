"use client";

import React, { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  BringToFront,
  SendToBack,
  Link2,
  Link2Off,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from "lucide-react";
import { alignToPagePatch, PAGE_ALIGNMENTS } from "@/(lib)/design/alignToPage";
import { layerAbility, layerDepth } from "@/(lib)/design/stacking";
import { ActionTile, IconTile, NumberField } from "./positionControls";

// Keyed by alignment so the icons can't drift out of step with what the six
// buttons actually do — PAGE_ALIGNMENTS is the list, this is only its pictures.
const ALIGN_ICONS = {
  left: AlignHorizontalJustifyStart,
  center: AlignHorizontalJustifyCenter,
  right: AlignHorizontalJustifyEnd,
  top: AlignVerticalJustifyStart,
  middle: AlignVerticalJustifyCenter,
  bottom: AlignVerticalJustifyEnd,
};

/**
 * Position › Arrange — layer order, align to page, exact numbers.
 *
 * Props: { editor, element }
 */
export default function ArrangeTab({ editor, element }) {
  const { elements, canvas, updateElement, moveLayer } = editor;

  const [ratioLocked, setRatioLocked] = useState(false);
  // Held from the moment the lock is switched on, NOT recomputed per keystroke:
  // deriving it from the current box each time would let rounding drift the
  // shape a little further on every edit.
  const [ratio, setRatio] = useState(
    () => (element.width || 1) / (element.height || 1),
  );

  // Selecting something else drops the lock. The ratio was captured from the
  // element that was on screen when it was switched on, so carrying it across a
  // selection change would reshape the new element to the old one's proportions
  // on the first keystroke.
  const [seenId, setSeenId] = useState(element.id);
  if (seenId !== element.id) {
    setSeenId(element.id);
    if (ratioLocked) setRatioLocked(false);
  }

  const ability = layerAbility(elements, element);
  const depth = layerDepth(elements, element);
  // A group MEMBER, reached by clicking into its group. It stacks among its
  // siblings, not among the page's layers, so none of this section applies.
  const inGroup = Boolean(element.groupId);

  const set = (key, value) => {
    if (ratioLocked && key === "width")
      updateElement(element.id, { width: value, height: value / ratio }, { record: true });
    else if (ratioLocked && key === "height")
      updateElement(element.id, { height: value, width: value * ratio }, { record: true });
    else updateElement(element.id, { [key]: value }, { record: true });
  };

  const align = (kind) =>
    updateElement(
      element.id,
      alignToPagePatch(element, kind, canvas.width, canvas.height),
      { record: true },
    );

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Layer
          </h3>
          {/* The depth, counted from the back so Forward makes it go UP. Without
              a number on screen the four buttons give no feedback at all when
              the move happens behind another element — you press Forward and
              nothing appears to have happened. */}
          {!inGroup && (
            <span className="text-[11px] font-semibold tabular-nums text-gray-500">
              {depth.index}{" "}
              <span className="font-normal text-gray-400">of {depth.total}</span>
            </span>
          )}
        </div>

        {/* Disabled rather than hidden: the four moves are a fixed grid, and a
            grid that loses a cell when an element reaches the top of the stack
            reshuffles the other three under the pointer mid-click. */}
        <div className="grid grid-cols-2 gap-2">
          <ActionTile
            icon={ArrowUp}
            label="Forward"
            disabled={!ability.canMoveUp}
            onClick={() => moveLayer(element.id, "forward")}
          />
          <ActionTile
            icon={ArrowDown}
            label="Backward"
            disabled={!ability.canMoveDown}
            onClick={() => moveLayer(element.id, "backward")}
          />
          <ActionTile
            icon={BringToFront}
            label="To front"
            disabled={!ability.canMoveUp}
            onClick={() => moveLayer(element.id, "front")}
          />
          <ActionTile
            icon={SendToBack}
            label="To back"
            disabled={!ability.canMoveDown}
            onClick={() => moveLayer(element.id, "back")}
          />
        </div>

        {inGroup ? (
          <p className="text-[10px] leading-relaxed text-gray-400">
            This is inside a group. Its stacking is the group&apos;s — select the
            group itself to move it through the page.
          </p>
        ) : (
          !ability.hasOverlap && (
            <p className="text-[10px] leading-relaxed text-gray-400">
              Nothing overlaps this — moving it through the stack won&apos;t
              change how the page looks.
            </p>
          )
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
          Align to page
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PAGE_ALIGNMENTS.map((alignment) => (
            <IconTile
              key={alignment.key}
              icon={ALIGN_ICONS[alignment.key]}
              title={alignment.label}
              onClick={() => align(alignment.key)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
          Size
        </h3>
        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <NumberField
            label="Width"
            value={element.width}
            onChange={(v) => set("width", v)}
          />
          <NumberField
            label="Height"
            value={element.height}
            onChange={(v) => set("height", v)}
          />
          <button
            type="button"
            onClick={() => {
              // Captured on the way IN, so the shape locked is the one on screen
              // when you pressed it.
              if (!ratioLocked) setRatio((element.width || 1) / (element.height || 1));
              setRatioLocked((locked) => !locked);
            }}
            title={ratioLocked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
            aria-pressed={ratioLocked}
            className={`h-9 w-9 flex items-center justify-center rounded-lg border transition cursor-pointer ${
              ratioLocked
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-gray-200 text-gray-400 hover:text-gray-600"
            }`}
          >
            {ratioLocked ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <NumberField label="X" value={element.x} onChange={(v) => set("x", v)} />
          <NumberField label="Y" value={element.y} onChange={(v) => set("y", v)} />
          <NumberField
            label="Rotate"
            suffix="°"
            value={element.rotation || 0}
            onChange={(v) => set("rotation", v)}
          />
        </div>
      </section>
    </div>
  );
}
