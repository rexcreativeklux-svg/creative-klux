"use client";

import React, { useRef } from "react";
import { clipRange } from "@/(lib)/design/video";
import { coverScale, sourceRect } from "@/(lib)/design/videoCrop";

/**
 * VideoCropOverlay — Canva's crop on a video, drawn in the editor's chrome
 * layer (canvas units, never clipped by the artboard).
 *
 * The WHOLE source frame is laid out behind the crop box, dimmed outside it,
 * so the frame can be dragged anywhere on the footage and grown back out past
 * an earlier crop. Corners resize; edges too when the ratio is freeform; the
 * body moves. A ratio locks the corners to it.
 *
 * It works in the element's local frame (videoCrop.js): the container sits on
 * the element's box with its rotation and flips, so pointer movement is turned
 * back through both before it moves anything.
 *
 * Props: { el, zoom, sel, onSel, ratio (number|null), rotate }
 */
const MIN = 24; // smallest frame, canvas units
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function VideoCropOverlay({ el, zoom, sel, onSel, ratio, rotate }) {
  const drag = useRef(null);
  const R = sourceRect(el);
  const fx = el.flipH ? -1 : 1;
  const fy = el.flipV ? -1 : 1;
  const a = ((Number(el.rotation) || 0) * Math.PI) / 180;

  // Screen movement → local-frame movement (zoom, then rotation, then flips).
  const toLocal = (sx, sy) => {
    const dx = sx / zoom;
    const dy = sy / zoom;
    return {
      x: (dx * Math.cos(a) + dy * Math.sin(a)) * fx,
      y: (-dx * Math.sin(a) + dy * Math.cos(a)) * fy,
    };
  };

  const down = (mode, e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: sel };
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const { x: dx, y: dy } = toLocal(e.clientX - d.sx, e.clientY - d.sy);
    const s = d.start;
    const right = R.x + R.w;
    const bottom = R.y + R.h;

    if (d.mode === "move") {
      onSel({
        ...s,
        x: clamp(s.x + dx, R.x, right - s.w),
        y: clamp(s.y + dy, R.y, bottom - s.h),
      });
      return;
    }

    let { x, y, w, h } = s;
    if (d.mode.includes("w")) {
      const nx = clamp(x + dx, R.x, x + w - MIN);
      w += x - nx;
      x = nx;
    }
    if (d.mode.includes("e")) w = clamp(w + dx, MIN, right - x);
    if (d.mode.includes("n")) {
      const ny = clamp(y + dy, R.y, y + h - MIN);
      h += y - ny;
      y = ny;
    }
    if (d.mode.includes("s")) h = clamp(h + dy, MIN, bottom - y);

    // A locked ratio follows the corner's width, anchored at the opposite
    // corner, and shrinks to fit if the height would leave the footage.
    if (ratio && d.mode.length === 2) {
      const ax = d.mode.includes("w") ? s.x + s.w : s.x;
      const ay = d.mode.includes("n") ? s.y + s.h : s.y;
      const roomW = d.mode.includes("w") ? ax - R.x : right - ax;
      const roomH = d.mode.includes("n") ? ay - R.y : bottom - ay;
      w = clamp(w, MIN, Math.min(roomW, roomH * ratio));
      h = w / ratio;
      x = d.mode.includes("w") ? ax - w : ax;
      y = d.mode.includes("n") ? ay - h : ay;
    }
    onSel({ x, y, w, h });
  };

  const up = (e) => {
    if (!drag.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  const hs = 14 / zoom;
  const bw = 2 / zoom;
  const corners = ["nw", "ne", "sw", "se"];
  const edges = ratio ? [] : ["n", "s", "e", "w"];
  const k = coverScale(sel.w, sel.h, rotate);
  const start = clipRange(el).start;

  const handlePos = (m) => ({
    left: m.includes("w") ? -hs / 2 : m.includes("e") ? sel.w - hs / 2 : sel.w / 2 - hs / 2,
    top: m.includes("n") ? -hs / 2 : m.includes("s") ? sel.h - hs / 2 : sel.h / 2 - hs / 2,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation || 0}deg) scale(${fx}, ${fy})`,
        zIndex: 48,
        pointerEvents: "auto",
      }}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {/* The whole footage, turned with the straighten angle about the
          frame's centre — the same turn the result will have. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${sel.x + sel.w / 2}px ${sel.y + sel.h / 2}px`,
          transform: rotate ? `rotate(${rotate}deg) scale(${k})` : undefined,
          pointerEvents: "none",
        }}
      >
        <video
          src={`${el.src}#t=${start || 0.01}`}
          muted
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            left: R.x,
            top: R.y,
            width: R.w,
            height: R.h,
            maxWidth: "none",
            objectFit: "fill",
          }}
        />
      </div>

      {/* Dim everything outside the frame. */}
      <div
        style={{
          position: "absolute",
          left: sel.x,
          top: sel.y,
          width: sel.w,
          height: sel.h,
          boxShadow: `0 0 0 ${Math.max(R.w, R.h) * 3}px rgba(15,15,20,0.55)`,
          pointerEvents: "none",
        }}
      />

      {/* The frame: drag to move, handles to resize. */}
      <div
        onPointerDown={(e) => down("move", e)}
        style={{
          position: "absolute",
          left: sel.x,
          top: sel.y,
          width: sel.w,
          height: sel.h,
          outline: `${bw}px solid #ffffff`,
          cursor: "move",
          touchAction: "none",
        }}
      >
        {[1 / 3, 2 / 3].map((p) => (
          <React.Fragment key={p}>
            <span style={{ position: "absolute", left: `${p * 100}%`, top: 0, bottom: 0, width: bw / 2, background: "rgba(255,255,255,0.5)" }} />
            <span style={{ position: "absolute", top: `${p * 100}%`, left: 0, right: 0, height: bw / 2, background: "rgba(255,255,255,0.5)" }} />
          </React.Fragment>
        ))}
        {[...corners, ...edges].map((m) => (
          <span
            key={m}
            onPointerDown={(e) => down(m, e)}
            style={{
              position: "absolute",
              ...handlePos(m),
              width: hs,
              height: hs,
              borderRadius: m.length === 2 ? hs : 3 / zoom,
              background: "#fff",
              border: `${bw}px solid #6366f1`,
              cursor: `${m}-resize`,
              touchAction: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
