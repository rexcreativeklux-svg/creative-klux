"use client";

/**
 * Interactive 2.5D "3D Preview" for the Ghost Mannequin tool. Mounts the WebGL
 * depth-displacement renderer (mannequin3D.js) on a canvas and drives its parallax
 * from pointer movement (and device tilt on mobile), so the user can tilt-look the
 * garment in 3D. Falls back to the flat framed result if depth wasn't produced or
 * WebGL is unavailable.
 */

import { useEffect, useRef, useState } from "react";
import { mountMannequin3D } from "@/(lib)/ai-engine/compose/mannequin3D";

export default function Mannequin3DView({ cutoutUrl, depthUrl, fallbackSrc }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const ctrlRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !cutoutUrl || !depthUrl) return;

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
        ctrl = mountMannequin3D(canvas, img, depth, { amount: 0.05 });
        ctrlRef.current = ctrl;
      } catch (err) {
        console.warn("⚠️ Mannequin3DView: WebGL preview failed, showing flat image:", err?.message);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      ctrl?.dispose();
      ctrlRef.current = null;
    };
  }, [cutoutUrl, depthUrl]);

  // Pointer → parallax look (normalized to [-1,1] around the canvas center).
  const handlePointer = (e) => {
    const ctrl = ctrlRef.current;
    const canvas = canvasRef.current;
    if (!ctrl || !canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    ctrl.setLook(x, -y);
  };
  const resetLook = () => ctrlRef.current?.setLook(0, 0);

  // Device tilt on mobile (gyroscope) for a hands-free parallax.
  useEffect(() => {
    const onTilt = (e) => {
      const ctrl = ctrlRef.current;
      if (!ctrl || e.gamma == null || e.beta == null) return;
      ctrl.setLook(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, []);

  if (failed || !cutoutUrl || !depthUrl) {
    return (
      <img
        src={fallbackSrc}
        alt="Ghost mannequin"
        className="max-h-full max-w-full object-contain rounded-2xl"
      />
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointer}
        onPointerLeave={resetLook}
        className="max-h-full max-w-full rounded-2xl cursor-move touch-none"
        style={{ background: "repeating-conic-gradient(#e4e4e7 0% 25%, #fff 0% 50%) 50% / 20px 20px" }}
      />
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 bg-surface/80 rounded-full px-3 py-1 pointer-events-none">
        Move your cursor to look around · 3D Preview
      </span>
    </div>
  );
}
