"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { renderStrokes } from "./signatureDraw";

/**
 * SignatureDrawCanvas — the surface you sign on. Committed strokes live in the
 * parent draft (so Undo/Clear and tab-switching work); the in-progress stroke is
 * drawn imperatively for smoothness and committed on pointer up.
 *
 * Props: { strokes, onCommit: (stroke) => void, color, width }
 */
export default function SignatureDrawCanvas({ strokes, onCommit, color, width }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(null); // the active stroke, or null
  const [drawing, setDrawing] = useState(false); // just for hiding the hint

  // Latest strokes for the stable repaint below, so it isn't recreated (and the
  // resize observer isn't re-bound) on every stroke. Updated in the effect, not
  // during render.
  const strokesRef = useRef(strokes);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    renderStrokes(ctx, strokesRef.current);
  }, []);

  // Size the backing store to the box (× dpr for crisp lines) and repaint on
  // resize. Points are captured in CSS pixels, so the context is dpr-scaled.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      repaint();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [repaint]);

  // Repaint committed strokes whenever they change (Undo, Clear, external).
  useEffect(() => {
    strokesRef.current = strokes;
    repaint();
  }, [strokes, repaint]);

  const pointFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    canvasRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = { points: [pointFromEvent(e)], color, width };
    setDrawing(true);
  };

  const onPointerMove = (e) => {
    const stroke = drawingRef.current;
    if (!stroke) return;
    stroke.points.push(pointFromEvent(e));
    // Draw just this stroke on top of the already-painted committed ones.
    renderStrokes(canvasRef.current.getContext("2d"), [stroke]);
  };

  const endStroke = () => {
    const stroke = drawingRef.current;
    drawingRef.current = null;
    setDrawing(false);
    if (stroke && stroke.points.length) onCommit(stroke);
  };

  const empty = strokes.length === 0 && !drawing;

  return (
    <div className="relative h-40 rounded-xl border border-gray-200 bg-surface overflow-hidden">
      {empty && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          Draw your signature here
        </span>
      )}
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        className="w-full h-full touch-none cursor-crosshair"
      />
    </div>
  );
}
