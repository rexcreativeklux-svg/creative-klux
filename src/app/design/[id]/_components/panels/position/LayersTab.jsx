"use client";

import React, { useMemo, useState } from "react";
import { Layers as LayersIcon } from "lucide-react";
import { overlappingWith } from "@/(lib)/design/stacking";
import LayerRow from "./LayerRow";
import useLayerReorder from "./useLayerReorder";
import { EmptyNote, Segmented } from "./positionControls";

/**
 * LayersTab — the whole stack, front at the top, draggable.
 *
 * Lives in the Position panel (that is where the layer order is reasoned about,
 * next to Arrange) and is rendered by the rail's Layers tab too, so there is one
 * layers list in the editor rather than two that drift apart.
 *
 * Props: { editor, element } — `element` is the selection the "Overlapping"
 * filter is measured against, and is null when the list is opened on its own.
 */
export default function LayersTab({ editor, element }) {
  const {
    elements,
    selectedIds,
    selectElement,
    toggleSelection,
    updateElement,
    reorderElements,
  } = editor;

  const [filter, setFilter] = useState("all");
  const { draggingId, dropTargetId, handlersFor } = useLayerReorder(
    elements,
    reorderElements,
  );

  // A selected group MEMBER is not a layer on this page — its group is. Asking
  // what overlaps the child would measure against something the list can't show,
  // and could filter the list down to rows that don't include the selection.
  const target = element?.groupId
    ? elements.find((el) => el.id === element.groupId)
    : element;

  const overlapping = useMemo(
    () => overlappingWith(elements, target),
    [elements, target],
  );

  // Offering "Overlapping" when nothing overlaps would filter the list down to
  // the selected element on its own, which reads as a broken filter rather than
  // as an answer.
  const canFilterOverlapping = overlapping.length > 1;
  const showing = canFilterOverlapping ? filter : "all";

  // Front of the stack at the TOP of the list, which is the opposite of the
  // array — later in the array means drawn later, i.e. on top. Reading a layer
  // list bottom-up is the one thing everybody gets wrong about them.
  const shown = useMemo(
    () => [...(showing === "overlapping" ? overlapping : elements)].reverse(),
    [showing, overlapping, elements],
  );

  if (!elements.length) {
    return (
      <div className="px-4 py-4">
        <EmptyNote icon={LayersIcon}>
          Nothing on this page yet. Add text, shapes or images to get started.
        </EmptyNote>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <Segmented
        value={showing}
        onChange={setFilter}
        options={[
          { id: "all", label: "All" },
          {
            id: "overlapping",
            label: "Overlapping",
            disabled: !canFilterOverlapping,
            title: canFilterOverlapping
              ? "Only what shares space with the selection"
              : "Nothing overlaps the selection",
          },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        {shown.map((el) => (
          <LayerRow
            key={el.id}
            el={el}
            // Depth in the real stack, not in this (possibly filtered, always
            // reversed) list — the number has to mean the same thing here as it
            // does in Arrange.
            depth={elements.findIndex((e) => e.id === el.id) + 1}
            // A group whose member is selected counts as selected here: the
            // member has no row of its own, so without this the list shows
            // nothing selected while the canvas plainly does.
            selected={selectedIds.includes(el.id) || el.id === element?.groupId}
            dragging={draggingId === el.id}
            dropTarget={dropTargetId === el.id}
            // Shift/Cmd-click builds a multi-selection here too, so a stack of
            // overlapping elements can be picked apart from the list — which is
            // most of the reason to be looking at it.
            onSelect={(id, e) =>
              e?.shiftKey || e?.metaKey || e?.ctrlKey
                ? toggleSelection(id)
                : selectElement(id)
            }
            onToggleHidden={(id) =>
              updateElement(id, { hidden: !el.hidden }, { record: true })
            }
            dragHandlers={handlersFor(el)}
          />
        ))}
      </div>

      <p className="text-center text-[10px] text-gray-400">
        {shown.length} {shown.length === 1 ? "layer" : "layers"}
        {showing === "overlapping" && " overlapping"}
        {" · drag to restack"}
      </p>
    </div>
  );
}
