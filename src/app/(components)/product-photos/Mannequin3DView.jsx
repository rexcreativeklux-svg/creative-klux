"use client";

/**
 * Interactive 3D preview for the Ghost Mannequin tool, with a 2D/3D toggle:
 *
 *  • 3D — mounts the WebGL depth renderer (mannequin3D.js): a TRUE depth-
 *    displaced mesh you DRAG to rotate (clamped yaw/pitch, eased), with device
 *    tilt on mobile. While 3D is active the hook's Download/Save export the
 *    CURRENT ANGLE (the view registers an exporter via tool.setAngleExporter).
 *    The canvas carries the "mannequin-3d" class, which the modal excludes
 *    from its pan/zoom gestures — the pointer belongs to the rotation.
 *  • 2D — the flat framed result image; fully zoomable via the modal's
 *    pan/zoom surface, and Download/Save use the flat full-res result.
 *
 * Falls back to the flat image when depth wasn't produced or WebGL is
 * unavailable (the renderer itself also falls back mesh → parallax).
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { mountMannequin3D } from "@/(lib)/ai-engine/compose/mannequin3D";

const DRAG_SENSITIVITY = 140; // px of drag for a full-range rotation

export default function Mannequin3DView({ setAngleExporter, cutoutUrl, depthUrl, fallbackSrc }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const ctrlRef = useRef(null);
  // Accumulated normalized rotation [-1,1] + active drag bookkeeping.
  const rotRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null); // { pointerId, startX, startY, baseX, baseY }
  // WebGL failure is remembered PER cutout — a new image gets a fresh attempt
  // without any state reset inside the effect.
  const [failedFor, setFailedFor] = useState(null);
  const [is3D, setIs3D] = useState(true);
  const [rendererMode, setRendererMode] = useState(null); // "mesh" | "parallax"

  const failed = failedFor !== null && failedFor === cutoutUrl;
  const show3D = is3D && !failed && cutoutUrl && depthUrl;

  useEffect(() => {
    if (!show3D) return undefined;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    let cancelled = false;
    let ctrl = null;

    const loadImg = (src) =>
      new Promise((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      });

    (async () => {
      try {
        const [img, depth] = await Promise.all([loadImg(cutoutUrl), loadImg(depthUrl)]);
        if (cancelled) return;
        // Size the canvas to the cutout aspect, fitting the available box.
        const maxW = wrap.clientWidth || 480;
        const maxH = wrap.clientHeight || 480;
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        ctrl = mountMannequin3D(canvas, img, depth, { mode: "mesh", amount: 0.05 });
        ctrlRef.current = ctrl;
        setRendererMode(ctrl.mode);
        // Restore the previous angle so toggling 2D↔3D doesn't snap to front.
        ctrl.setLook(rotRef.current.x, rotRef.current.y);
      } catch (err) {
        console.warn("⚠️ Mannequin3DView: WebGL preview failed, showing flat image:", err?.message);
        if (!cancelled) setFailedFor(cutoutUrl);
      }
    })();

    return () => {
      cancelled = true;
      ctrl?.dispose();
      ctrlRef.current = null;
      setRendererMode(null);
    };
  }, [cutoutUrl, depthUrl, show3D]);

  // While 3D is live, Download/Save export the CURRENT angle: register an
  // exporter with the hook (useGhostMannequin checks it before falling back
  // to the flat framed result).
  useEffect(() => {
    if (!setAngleExporter) return undefined;
    setAngleExporter(show3D ? () => ctrlRef.current?.exportBlob() : null);
    return () => setAngleExporter(null);
  }, [setAngleExporter, show3D]);

  // ── Interaction ──
  // Mesh mode: DRAG to rotate (pointer capture, accumulated + clamped).
  // Parallax fallback: hover to look around (the original behavior).
  const handlePointerDown = (e) => {
    const ctrl = ctrlRef.current;
    if (!ctrl || ctrl.mode !== "mesh") return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: rotRef.current.x,
      baseY: rotRef.current.y,
    };
  };

  const handlePointerMove = (e) => {
    const ctrl = ctrlRef.current;
    const canvas = canvasRef.current;
    if (!ctrl || !canvas) return;
    if (ctrl.mode === "mesh") {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const x = Math.max(-1, Math.min(1, drag.baseX + (e.clientX - drag.startX) / DRAG_SENSITIVITY));
      const y = Math.max(-1, Math.min(1, drag.baseY + (e.clientY - drag.startY) / DRAG_SENSITIVITY));
      rotRef.current = { x, y };
      ctrl.setLook(x, y);
    } else {
      // Parallax: normalized hover position around the canvas center.
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      ctrl.setLook(x, -y);
    }
  };

  const handlePointerUp = (e) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const handlePointerLeave = () => {
    const ctrl = ctrlRef.current;
    dragRef.current = null;
    // Parallax drifts back to straight-on; a rotated mesh stays where you left it.
    if (ctrl && ctrl.mode !== "mesh") ctrl.setLook(0, 0);
  };

  // Device tilt on mobile (gyroscope) for a hands-free look, both modes.
  useEffect(() => {
    const onTilt = (e) => {
      const ctrl = ctrlRef.current;
      if (!ctrl || e.gamma == null || e.beta == null || dragRef.current) return;
      ctrl.setLook(
        Math.max(-1, Math.min(1, e.gamma / 30)),
        Math.max(-1, Math.min(1, (e.beta - 45) / 30)),
      );
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, []);

  const canToggle = !!(cutoutUrl && depthUrl && !failed);

  return (
    <div ref={wrapRef} className="relative w-full h-full flex items-center justify-center">
      {show3D ? (
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          // "mannequin-3d" is excluded from the modal's pan/zoom gestures —
          // in 3D the pointer rotates the garment instead.
          className={`mannequin-3d max-h-full max-w-full rounded-2xl touch-none ${
            rendererMode === "mesh" ? "cursor-grab active:cursor-grabbing" : "cursor-move"
          }`}
          style={{ background: "repeating-conic-gradient(#e4e4e7 0% 25%, #fff 0% 50%) 50% / 20px 20px" }}
        />
      ) : (
        <img
          src={fallbackSrc}
          alt="Ghost mannequin"
          className="max-h-full max-w-full object-contain rounded-2xl"
        />
      )}

      {show3D && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 bg-surface/80 rounded-full px-3 py-1 pointer-events-none">
          {rendererMode === "mesh"
            ? "Drag to rotate · Download saves this angle"
            : "Move your cursor to look around · 3D Preview"}
        </span>
      )}

      {/* 2D / 3D segmented toggle (only when a depth map exists) */}
      {canToggle && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-surface/90 backdrop-blur rounded-full border border-gray-200 shadow-md p-0.5">
          {["2D", "3D"].map((label) => {
            const active = (label === "3D") === is3D;
            return (
              <button
                key={label}
                onClick={() => setIs3D(label === "3D")}
                className={`relative px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  active ? "text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mannequin-mode-thumb"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute inset-0 rounded-full bg-violet-600"
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
