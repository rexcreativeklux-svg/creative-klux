"use client";

import React, { useRef } from "react";
import EditorElementMenu from "./EditorElementMenu";
import { PILL_GAP, usePillSide } from "./pillPlacement";

/**
 * SelectionOverlay — the chrome for a selection of MORE THAN ONE element.
 *
 * Rendered in the editor's chrome layer in canvas coordinates: a dashed box
 * hugging the union of the selected elements, and one action pill for the
 * selection as a whole. The pill is counter-scaled by 1/zoom so it stays a
 * constant size on screen, the same way EditorElementMenu does for a single
 * element.
 *
 * That layer does not clip at the artboard edge, so nothing here is clamped to
 * the artboard: a selection sitting half off the page keeps its box and its
 * controls where the selection actually is, which is the only way to drag it
 * back. It is also inert by default, so the pill has to claim pointer events
 * for itself — the box deliberately does not, since clicks in the middle of a
 * selection belong to the elements under it.
 *
 * The per-element pills are suppressed while this is up (see EditorElement's
 * `multiSelected`), so the selection has exactly one set of controls. A single
 * selected GROUP is not this: it is one element, and it keeps its own pill —
 * with an Ungroup button added.
 */
export default function SelectionOverlay({
  bounds,
  elements = [],
  stack = [],
  zoom = 1,
  canPaste,
  onCopy,
  onPaste,
  onGroup,
  onDuplicate,
  onRemove,
  onMoveLayer,
  onToggleLock,
  onAlign,
  onShowLayers,
}) {
  // Before the early return — hooks cannot be skipped. A multi-selection has no
  // rotate handle, so nothing is reserved above it.
  const boxRef = useRef(null);
  const below = usePillSide(boxRef, 0);

  if (!bounds || !elements.length) return null;

  // ── Placement ────────────────────────────────────────────────────────
  // Canvas units, because that is the space this is rendered in: the pill's
  // pixel sizes are divided by the zoom to get there. Above the selection,
  // centred on it, flipping below only when there isn't room up there — the
  // same rule the single-element chrome follows (see pillPlacement).
  //
  // No clamping to the artboard: nothing clips this layer any more, and a pill
  // pulled back onto the page would point at the wrong selection.
  const scale = 1 / (zoom || 1);
  const gap = PILL_GAP * scale;
  const top = below ? bounds.y + bounds.height + gap : bounds.y - gap;
  const left = bounds.x + bounds.width / 2;

  const outline = 2 / zoom;

  return (
    <>
      {/* Union box — the envelope the whole selection moves as, and what the
          pill hangs off. Dashed and thin so it reads as a boundary rather than
          as the selection itself; the members below are the selection.
          Pointer-transparent: clicks belong to the elements under it, so
          dragging any member still moves the whole group of them. */}
      <div
        ref={boxRef}
        style={{
          position: "absolute",
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          border: `${outline / 2}px dashed #a5b4fc`,
          borderRadius: 2 / zoom,
          pointerEvents: "none",
          zIndex: 39,
        }}
      />

      {/* One outline per MEMBER. Without these the union box is the only thing
          on screen, and a box drawn around a region says nothing about which
          things inside it are selected — with three elements picked out of a
          crowded page it is indistinguishable from having selected the lot.
          Turned with each element, so the outline hugs what it describes.
          No handles: a multi-selection resizes as one thing or not at all, and
          eight grips per member would promise a gesture that doesn't exist. */}
      {elements.map((el) => (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            // Locked members are dashed and grey: they are IN the selection but
            // the actions will skip them, which is worth seeing before you press
            // Delete and watch one of the three survive.
            outline: el.locked
              ? `${outline}px dashed #94a3b8`
              : `${outline}px solid #6366f1`,
            pointerEvents: "none",
            zIndex: 40,
          }}
        />
      ))}

      {/* The same pill a single element gets — see EditorElementMenu for why
          one component serves both. It reads the selection off `elements`, so
          the member count, Group vs Ungroup and every disabled state follow
          from that alone. */}
      <div
        style={{
          position: "absolute",
          left,
          top,
          // Below: the pill's TOP edge sits at `top`. Above: its BOTTOM edge
          // does, which is what translateY(-100%) buys — so neither case needs
          // the pill's height measured.
          transform: below
            ? `translateX(-50%) scale(${scale})`
            : `translate(-50%, -100%) scale(${scale})`,
          transformOrigin: below ? "top center" : "bottom center",
          pointerEvents: "auto",
          zIndex: 41,
        }}
      >
        <EditorElementMenu
          zoom={zoom}
          elements={elements}
          stack={stack}
          canPaste={canPaste}
          onCopy={onCopy}
          onPaste={onPaste}
          onGroup={onGroup}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onMoveLayer={onMoveLayer}
          onToggleLock={onToggleLock}
          onAlign={onAlign}
          onShowLayers={onShowLayers}
        />
      </div>
    </>
  );
}
