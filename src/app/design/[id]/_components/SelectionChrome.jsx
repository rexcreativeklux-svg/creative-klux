"use client";

import React, { useRef } from "react";
import EditorElementMenu from "./EditorElementMenu";
import { PILL_GAP, usePillSide } from "./pillPlacement";
import {
  CORNERS,
  EDGES,
  cropByEdge,
  scaleByCorner,
  stretchByEdge,
} from "@/(lib)/design/resizeElement";

/**
 * SelectionChrome — the outline, the eight handles and the action pill for the
 * one selected element.
 *
 * ── Why this is not inside the element ────────────────────────────────────
 *
 * The stage clips at the artboard edge, which is what makes artwork crop there
 * the way it does in Canva. Chrome used to live inside each element's box and
 * so was clipped by the same rule — scale something up until it ran past the
 * edge and its outline and handles were simply gone, leaving no grip to scale
 * back down with. CSS cannot exempt one descendant from a clipping ancestor, so
 * chrome had to stop sharing a layer with the artwork it describes.
 *
 * It now lives in a sibling layer that carries the same zoom transform but
 * never clips, and it positions itself in canvas coordinates from the element's
 * own box. The element keeps being clipped; the handles no longer are.
 *
 * ── The two gestures ──────────────────────────────────────────────────────
 *
 * Corners scale (aspect locked, contents scale with the box), edges crop (the
 * box becomes a window, contents hold still). Shift on an edge stretches
 * instead, which is the only way left to deliberately distort something.
 *
 * All eight are ours rather than react-rnd's. Cropping has to own the box,
 * and re-resizable stops reading its `size` prop the moment a resize begins,
 * so anything it drives cannot be corrected mid-gesture. Owning the pointer for
 * all eight is both the only way to make cropping work and the reason the two
 * gestures can share one code path.
 *
 * Sizes divide by `zoom` because this lives inside the stage's `scale(zoom)` —
 * the same technique LineHandles uses, so a handle stays the same size on
 * screen at 25% as at 200%.
 */
// Rotate handle, in screen pixels: how far its centre sits above the top edge,
// and how big the grip is. Kept here rather than in pillPlacement because the
// pill has to CLEAR it, and only a single element has one — see `reserved`.
const ROTATE_DISTANCE = 24;
const ROTATE_SIZE = 14;
const ROTATE_SIZE_COARSE = 24;

/** Rotation snaps to this many degrees while Shift is held. */
const SNAP_STEP = 15;

export default function SelectionChrome({
  el,
  stack = [],
  zoom,
  coarse,
  onChange,
  onGestureBegin,
  onDuplicate,
  onRemove,
  onMoveLayer,
  onToggleLock,
  onUngroup,
  // Pill actions that act on the selection as a whole rather than on this
  // element's geometry — passed straight through to EditorElementMenu.
  canPaste,
  onCopy,
  onPaste,
  onAlign,
  onSetAsBackground,
  onShowLayers,
}) {
  const drag = useRef(null);
  // The outline box, measured at the start of a rotate to find its centre.
  const boxRef = useRef(null);
  const locked = !!el.locked;

  const begin = (kind, name) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {
      kind,
      name,
      sx: e.clientX,
      sy: e.clientY,
      snap: { ...el },
      committed: false,
      // Read once, not per frame: a modifier picked up mid-drag would switch
      // geometry halfway through the gesture.
      stretch: e.shiftKey,
    };

    // Rotation is an ANGLE, not a delta, so it needs the centre it turns about
    // in the same space as the pointer. The box's own rect gives that directly
    // and needs no knowledge of where the stage sits or how far it is scrolled
    // — and because the box rotates about its own centre, that centre is the
    // one point its bounding rect reports correctly however far it is turned.
    if (kind === "rotate" && boxRef.current) {
      const r = boxRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      drag.current.cx = cx;
      drag.current.cy = cy;
      drag.current.a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    }
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;

    // Rotation takes the whole gesture, before any of the delta maths below:
    // it measures the angle SWEPT since the grab rather than a distance, so the
    // handle stays under the pointer wherever on the circle you grabbed it.
    if (d.kind === "rotate") {
      const a = Math.atan2(e.clientY - d.cy, e.clientX - d.cx);
      let deg = d.snap.rotation || 0;
      deg += ((a - d.a0) * 180) / Math.PI;
      // Shift snaps, and is read LIVE rather than at grab time — unlike the
      // stretch modifier above, deciding to snap part-way through a turn is a
      // normal thing to want.
      if (e.shiftKey) deg = Math.round(deg / SNAP_STEP) * SNAP_STEP;
      deg = ((deg % 360) + 360) % 360;

      if (!d.committed) {
        d.committed = true;
        onGestureBegin?.();
      }
      onChange({ rotation: deg }, { record: false });
      return;
    }

    // Measured from where the gesture STARTED against the snapshot taken then,
    // never accumulated per frame — accumulation drifts, and makes the result
    // depend on how many frames the browser happened to render.
    let dx = (e.clientX - d.sx) / zoom;
    let dy = (e.clientY - d.sy) / zoom;
    if (!dx && !dy) return;

    // The pointer moves in canvas space but the box is reasoned about in the
    // element's own space, so a turned element needs the travel turned with it
    // — otherwise dragging its "right" edge widens it along the page's x-axis
    // and the shape shears away from the cursor.
    const deg = d.snap.rotation || 0;
    if (deg) {
      const r = (-deg * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      [dx, dy] = [dx * cos - dy * sin, dx * sin + dy * cos];
    }

    if (!d.committed) {
      d.committed = true;
      onGestureBegin?.();
    }

    let patch;
    if (d.kind === "corner") patch = scaleByCorner(d.snap, d.name, dx, dy);
    else if (d.stretch) patch = stretchByEdge(d.snap, d.name, dx, dy);
    else patch = cropByEdge(d.snap, d.name, dx, dy);

    if (patch && Object.keys(patch).length) onChange(patch, { record: false });
  };

  const end = (e) => {
    if (!drag.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  const rotateSize = coarse ? ROTATE_SIZE_COARSE : ROTATE_SIZE;
  // What the rotate handle occupies above the top edge. Zero when the element is
  // locked, because a locked element gets no grips at all.
  const reservedAbove = locked ? 0 : ROTATE_DISTANCE + rotateSize / 2;

  // Pill placement — above the element unless it would slide under the context
  // bar, measured from the box's real screen position. It also has to clear the
  // rotate handle on the way up; without that the pill lands squarely on the
  // handle, and the one control you cannot reach is the one it is covering.
  const below = usePillSide(boxRef, reservedAbove);
  const scale = 1 / (zoom || 1);
  const gap = PILL_GAP * scale;
  const gapAbove = (PILL_GAP + reservedAbove) * scale;

  const dot = (coarse ? 20 : 10) / zoom;
  const long = (coarse ? 26 : 20) / zoom;
  const short = (coarse ? 12 : 8) / zoom;
  const border = 2 / zoom;

  const grip = {
    background: "#fff",
    border: `${border}px solid #6366f1`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
    touchAction: "none",
    pointerEvents: "auto",
    position: "absolute",
  };

  return (
    <div
      ref={boxRef}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        // Turned with the element so the box hugs what it describes.
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        // The frame itself is a picture, not a target — only the grips inside
        // it take the pointer, so clicking through the middle still reaches the
        // element underneath.
        pointerEvents: "none",
        zIndex: 44,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          outline: `${border}px solid #6366f1`,
        }}
      />

      {/* Rotate handle. Above the top edge on a short stem, which is the only
          place it can go that no resize grip already claims — and the reason
          the pill has to clear `reservedAbove`.
          Rotation was previously reachable only by typing a number into the
          Position panel, so this is the whole gesture, not a shortcut for it. */}
      {!locked && (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "100%",
              width: border,
              height: (ROTATE_DISTANCE - rotateSize / 2) / zoom,
              marginLeft: -border / 2,
              background: "#6366f1",
              pointerEvents: "none",
            }}
          />
          <div
            onPointerDown={begin("rotate")}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            title="Drag to rotate — hold Shift to snap to 15°"
            style={{
              ...grip,
              width: rotateSize / zoom,
              height: rotateSize / zoom,
              borderRadius: "50%",
              left: "50%",
              marginLeft: -rotateSize / zoom / 2,
              bottom: `calc(100% + ${(ROTATE_DISTANCE - rotateSize / 2) / zoom}px)`,
              cursor: "grab",
            }}
          />
        </>
      )}

      {/* Locked elements show the frame so you can see what is selected, but
          offer no grips — there is nothing to drag. */}
      {!locked &&
        CORNERS.map((corner) => {
          const top = corner.startsWith("top");
          const left = corner.endsWith("Left");
          return (
            <div
              key={corner}
              onPointerDown={begin("corner", corner)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              style={{
                ...grip,
                width: dot,
                height: dot,
                borderRadius: "50%",
                [top ? "top" : "bottom"]: -dot / 2,
                [left ? "left" : "right"]: -dot / 2,
                cursor: top === left ? "nwse-resize" : "nesw-resize",
              }}
            />
          );
        })}

      {/* Edge pills. Shaped differently from the corners on purpose: round
          means scale, pill means crop, and you can tell which you are about to
          get before you commit to the drag. */}
      {!locked &&
        EDGES.map((edge) => {
          const horizontal = edge === "top" || edge === "bottom";
          const w = horizontal ? long : short;
          const h = horizontal ? short : long;
          const place = {
            top: { top: -h / 2, left: "50%", marginLeft: -w / 2 },
            bottom: { bottom: -h / 2, left: "50%", marginLeft: -w / 2 },
            left: { left: -w / 2, top: "50%", marginTop: -h / 2 },
            right: { right: -w / 2, top: "50%", marginTop: -h / 2 },
          }[edge];

          return (
            <div
              key={edge}
              onPointerDown={begin("edge", edge)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              style={{
                ...grip,
                ...place,
                width: w,
                height: h,
                borderRadius: Math.min(w, h) / 2,
                cursor: horizontal ? "ns-resize" : "ew-resize",
              }}
            />
          );
        })}

      {/* Action pill. Kept upright rather than turned with the box — a menu
          rotated onto its side is a menu you cannot read — and counter-scaled
          by 1/zoom so it stays one size on screen at any zoom. The gap is
          divided by the zoom for the same reason: a constant 10 canvas units
          would close up to nothing when zoomed out.
          Above the element, flipping below only when there isn't room up there
          (see pillPlacement). Placement lives here rather than in the pill,
          because the multi-select overlay hangs the same pill off a different
          box — only the RULE is shared. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: el.rotation ? `rotate(${-el.rotation}deg)` : undefined,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            // Anchored by the edge it hangs from, so the pill's own height never
            // has to be known: `bottom: 100%` puts its underside on the box's top.
            ...(below
              ? {
                  top: "100%",
                  transform: `translate(-50%, ${gap}px) scale(${scale})`,
                  transformOrigin: "top center",
                }
              : {
                  bottom: "100%",
                  transform: `translate(-50%, ${-gapAbove}px) scale(${scale})`,
                  transformOrigin: "bottom center",
                }),
            pointerEvents: "auto",
            zIndex: 45,
          }}
        >
          <EditorElementMenu
            zoom={zoom}
            elements={[el]}
            stack={stack}
            canPaste={canPaste}
            onCopy={onCopy}
            onPaste={onPaste}
            onDuplicate={() => onDuplicate?.(el.id)}
            onRemove={() => onRemove?.(el.id)}
            onMoveLayer={(dir) => onMoveLayer?.(el.id, dir)}
            onToggleLock={() => onToggleLock?.(el.id)}
            onUngroup={() => onUngroup?.(el.id)}
            onAlign={onAlign}
            onSetAsBackground={onSetAsBackground}
            onShowLayers={onShowLayers}
            onFlip={(key) => onChange({ [key]: !el[key] }, { record: true })}
          />
        </div>
      </div>
    </div>
  );
}
