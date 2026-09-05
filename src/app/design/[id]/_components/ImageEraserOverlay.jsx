"use client";

import React, { useEffect, useRef } from "react";
import { coverCrop } from "@/(lib)/design/imageCrop";
import { proxiedSrc } from "@/(lib)/design/renderDesign";

/**
 * ImageEraserOverlay — a brush eraser over the image being edited (rendered
 * inside the scaled stage). It bakes the image's currently-visible region into a
 * working canvas, lets the user brush transparency (destination-out), and on
 * commit hands back a PNG blob. The parent swaps the image src for the cutout
 * (undoable) and uploads it — same flow as BG removal.
 *
 * `commitRef.current()` (wired to the toolbar Done button) resolves the blob and
 * calls `onApply(blob)`. `brushSize` is in element-box units.
 *
 * Props: { el, brushSize, commitRef, onApply }
 */
export default function ImageEraserOverlay({ el, brushSize, commitRef, onApply }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ ready: false, drawing: false, cw: 0, ch: 0 });

  // Bake the visible region into the working canvas at source resolution.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const nat = { w: img.naturalWidth, h: img.naturalHeight };
      const prior = el.crop || coverCrop(el.width, el.height, nat.w, nat.h);
      const cw = Math.max(1, Math.round(prior.w * nat.w));
      const ch = Math.max(1, Math.round(prior.h * nat.h));
      const cnv = canvasRef.current;
      if (!cnv) return;
      cnv.width = cw;
      cnv.height = ch;
      const ctx = cnv.getContext("2d");
      ctx.drawImage(
        img,
        prior.x * nat.w,
        prior.y * nat.h,
        prior.w * nat.w,
        prior.h * nat.h,
        0,
        0,
        cw,
        ch,
      );
      stateRef.current = { ready: true, drawing: false, cw, ch };
    };
    img.src = proxiedSrc(el.src);
  }, [el.src, el.crop, el.width, el.height]);

  // Wire the external Done button → PNG blob.
  useEffect(() => {
    commitRef.current = () =>
      new Promise((resolve) => {
        const cnv = canvasRef.current;
        if (!cnv || !stateRef.current.ready) {
          resolve(null);
          return;
        }
        cnv.toBlob((b) => {
          onApply(b);
          resolve(b);
        }, "image/png");
      });
    return () => {
      commitRef.current = null;
    };
  });

  const eraseAt = (e) => {
    const cnv = canvasRef.current;
    const s = stateRef.current;
    if (!cnv || !s.ready) return;
    const rect = cnv.getBoundingClientRect();
    let px = ((e.clientX - rect.left) / rect.width) * s.cw;
    let py = ((e.clientY - rect.top) / rect.height) * s.ch;
    // Undo the display flip so brushing lands where the cursor is.
    if (el.flipH) px = s.cw - px;
    if (el.flipV) py = s.ch - py;
    const r = Math.max(1, brushSize * (s.cw / el.width));
    const ctx = cnv.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  const onDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    stateRef.current.drawing = true;
    eraseAt(e);
  };
  const onMove = (e) => {
    if (stateRef.current.drawing) eraseAt(e);
  };
  const onUp = (e) => {
    stateRef.current.drawing = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        zIndex: 48,
        cursor: "crosshair",
        touchAction: "none",
        // Lives in the editor's chrome layer, which is inert by default so
        // clicks fall through to the artboard. The brush surface is the
        // exception: it has to take every pointer move while erasing.
        pointerEvents: "auto",
        transform: `scaleX(${el.flipH ? -1 : 1}) scaleY(${el.flipV ? -1 : 1})`,
        // Checkerboard shows through erased (transparent) pixels — so the user
        // sees exactly what they're removing, in real time.
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(45deg,#d0d0d0 25%,transparent 25%),linear-gradient(-45deg,#d0d0d0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d0d0d0 75%),linear-gradient(-45deg,transparent 75%,#d0d0d0 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
      }}
    />
  );
}
