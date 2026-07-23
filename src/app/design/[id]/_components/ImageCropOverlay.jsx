"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * ImageCropOverlay — an interactive crop frame drawn over the image being
 * cropped (rendered inside the scaled stage, in canvas coordinates). The user
 * drags the frame / its corners to select an inward rectangle. On commit it
 * reports the box-normalized selection; the parent bakes exactly those pixels
 * into a new image (no scaling/stretch). Crop is inward-only — undo (Ctrl/⌘+Z)
 * restores the previous image.
 *
 * `commitRef.current` and `resetRef.current` are wired for the external toolbar's
 * Done / Reset buttons. `onApply(sel)` receives the selection { x, y, w, h }.
 *
 * Props: { el, zoom, commitRef, resetRef, onApply }
 */
const MIN = 0.06; // smallest crop as a fraction of the box
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function ImageCropOverlay({ el, zoom, commitRef, resetRef, onApply }) {
  const [sel, setSel] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const dragRef = useRef(null);

  // Keep the external Done/Reset handlers pointing at the latest selection.
  useEffect(() => {
    commitRef.current = () => onApply(sel);
    resetRef.current = () => setSel({ x: 0, y: 0, w: 1, h: 1 });
    return () => {
      commitRef.current = null;
      resetRef.current = null;
    };
  });

  const onDown = (mode, e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, start: { ...sel } };
  };
  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / zoom / el.width;
    const dy = (e.clientY - d.sy) / zoom / el.height;
    let { x, y, w, h } = d.start;
    if (d.mode === "move") {
      x = clamp(x + dx, 0, 1 - w);
      y = clamp(y + dy, 0, 1 - h);
    } else {
      if (d.mode.includes("w")) {
        const nx = clamp(x + dx, 0, x + w - MIN);
        w += x - nx;
        x = nx;
      }
      if (d.mode.includes("e")) w = clamp(w + dx, MIN, 1 - x);
      if (d.mode.includes("n")) {
        const ny = clamp(y + dy, 0, y + h - MIN);
        h += y - ny;
        y = ny;
      }
      if (d.mode.includes("s")) h = clamp(h + dy, MIN, 1 - y);
    }
    setSel({ x, y, w, h });
  };
  const onUp = (e) => {
    if (!dragRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  const hs = 12 / zoom;
  const bw = 2 / zoom;
  const corners = [
    ["nw", 0, 0],
    ["ne", 1, 0],
    ["sw", 0, 1],
    ["se", 1, 1],
  ];

  const selBox = {
    left: `${sel.x * 100}%`,
    top: `${sel.y * 100}%`,
    width: `${sel.w * 100}%`,
    height: `${sel.h * 100}%`,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        zIndex: 48,
      }}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {/* Dimmed scrim — clipped to the image box so only the area being cropped
          away darkens (not the whole stage). Non-interactive. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            ...selBox,
            boxShadow: `0 0 0 ${Math.max(el.width, el.height) * 2}px rgba(0,0,0,0.5)`,
          }}
        />
      </div>

      {/* Interactive selection frame + handles (outside the clip so handles at
          the edge aren't cut off). */}
      <div
        onPointerDown={(e) => onDown("move", e)}
        style={{
          position: "absolute",
          ...selBox,
          outline: `${bw}px solid #ffffff`,
          cursor: "move",
          touchAction: "none",
        }}
      >
        {/* rule-of-thirds guides */}
        {[33.33, 66.66].map((p) => (
          <React.Fragment key={p}>
            <div
              style={{
                position: "absolute",
                left: `${p}%`,
                top: 0,
                bottom: 0,
                width: bw / 2,
                background: "rgba(255,255,255,0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: `${p}%`,
                left: 0,
                right: 0,
                height: bw / 2,
                background: "rgba(255,255,255,0.5)",
              }}
            />
          </React.Fragment>
        ))}
        {corners.map(([m, cx, cy]) => (
          <div
            key={m}
            onPointerDown={(e) => onDown(m, e)}
            style={{
              position: "absolute",
              left: `calc(${cx * 100}% - ${hs / 2}px)`,
              top: `calc(${cy * 100}% - ${hs / 2}px)`,
              width: hs,
              height: hs,
              borderRadius: 2 / zoom,
              background: "#fff",
              border: `${bw}px solid #3b82f6`,
              cursor: `${m}-resize`,
              touchAction: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
