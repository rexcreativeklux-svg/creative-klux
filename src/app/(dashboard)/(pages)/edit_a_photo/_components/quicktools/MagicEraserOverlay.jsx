"use client";

import { useEffect, useRef, useState } from "react";
import { X, Eraser, Paintbrush, Undo2, RotateCcw, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inpaintMasked, INPAINT_MAXD } from "./magicEraser";

/**
 * MagicEraserOverlay — self-contained full-screen modal. Brush a red mask over
 * an object, then Apply runs an in-browser content-aware fill (no AI/API) and
 * hands the result back via onApply(url). Ported from the Design-Editor
 * reference eraser, adapted to a standalone modal so it doesn't couple to the
 * host editor's canvas coordinate system.
 *
 * Props:
 *   src        — image URL to edit (the current base photo)
 *   onApply    — (objectUrl) => void, called with the erased PNG object URL
 *   onClose    — () => void
 */
export default function MagicEraserOverlay({ src, onApply, onClose }) {
  const viewRef = useRef(null); // visible canvas (image + red mask wash)
  const maskRef = useRef(null); // offscreen mask canvas (white = erase)
  const imgRef = useRef(null); // loaded HTMLImageElement
  const drawingRef = useRef(false);
  const undoRef = useRef([]); // ImageData snapshots of the mask

  const [mode, setMode] = useState("erase"); // 'erase' | 'restore'
  const [brush, setBrush] = useState(40);
  const [hasMask, setHasMask] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const modeRef = useRef(mode);
  const brushRef = useRef(brush);
  modeRef.current = mode;
  brushRef.current = brush;

  // Load the image into the view canvas + create a matching empty mask.
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      const view = viewRef.current;
      if (!view) return;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (Math.max(w, h) > INPAINT_MAXD) {
        const r = INPAINT_MAXD / Math.max(w, h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      imgRef.current = img;
      view.width = w;
      view.height = h;
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      maskRef.current = mask;
      undoRef.current = [];
      setHasMask(false);
      setReady(true);
      redraw();
    };
    img.onerror = () => alive && toast.error("Could not load image for editing");
    img.src = src;
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Composite base image + a translucent red wash wherever the mask is painted.
  const redraw = () => {
    const view = viewRef.current,
      img = imgRef.current,
      mask = maskRef.current;
    if (!view || !img || !mask) return;
    const w = view.width,
      h = view.height;
    const ctx = view.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const tint = document.createElement("canvas");
    tint.width = w;
    tint.height = h;
    const tctx = tint.getContext("2d");
    tctx.drawImage(mask, 0, 0);
    tctx.globalCompositeOperation = "source-in";
    tctx.fillStyle = "#ff3b30";
    tctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(tint, 0, 0);
    ctx.globalAlpha = 1;
  };

  const paint = (e) => {
    const view = viewRef.current,
      mask = maskRef.current;
    if (!view || !mask) return;
    const rect = view.getBoundingClientRect();
    const sx = view.width / rect.width,
      sy = view.height / rect.height;
    const x = (e.clientX - rect.left) * sx,
      y = (e.clientY - rect.top) * sy;
    const ctx = mask.getContext("2d");
    ctx.globalCompositeOperation = modeRef.current === "restore" ? "destination-out" : "source-over";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, (brushRef.current * sx) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    redraw();
  };

  const onDown = (e) => {
    const mask = maskRef.current;
    if (!mask) return;
    undoRef.current.push(mask.getContext("2d").getImageData(0, 0, mask.width, mask.height));
    if (undoRef.current.length > 12) undoRef.current.shift();
    drawingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    paint(e);
    setHasMask(true);
  };
  const onMove = (e) => {
    if (drawingRef.current) paint(e);
  };
  const onUp = (e) => {
    drawingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const hasMaskPixels = () => {
    const mask = maskRef.current;
    if (!mask) return false;
    const d = mask.getContext("2d").getImageData(0, 0, mask.width, mask.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return true;
    return false;
  };

  const undo = () => {
    const mask = maskRef.current,
      stack = undoRef.current;
    if (!mask || !stack.length) return;
    mask.getContext("2d").putImageData(stack.pop(), 0, 0);
    redraw();
    if (!stack.length) setHasMask(hasMaskPixels());
  };

  const reset = () => {
    const mask = maskRef.current;
    if (mask) mask.getContext("2d").clearRect(0, 0, mask.width, mask.height);
    undoRef.current = [];
    setHasMask(false);
    redraw();
  };

  const apply = async () => {
    const view = viewRef.current,
      img = imgRef.current,
      mask = maskRef.current;
    if (!view || !img || !mask) return;
    if (!hasMaskPixels()) {
      toast.error("Brush over something to erase first");
      return;
    }
    setBusy(true);
    try {
      const w = view.width,
        h = view.height;
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = w;
      srcCanvas.height = h;
      const sctx = srcCanvas.getContext("2d");
      sctx.drawImage(img, 0, 0, w, h);
      const id = sctx.getImageData(0, 0, w, h);
      const md = mask.getContext("2d").getImageData(0, 0, w, h).data;
      const m = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) m[i] = md[i * 4 + 3] > 8 ? 1 : 0;
      // Yield a frame so the busy state paints before the (sync) fill runs.
      await new Promise((r) => setTimeout(r, 20));
      inpaintMasked(id.data, w, h, m);
      sctx.putImageData(id, 0, 0);
      srcCanvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Could not erase");
          setBusy(false);
          return;
        }
        onApply(URL.createObjectURL(blob));
        setBusy(false);
        toast.success("Erased");
        onClose();
      }, "image/png");
    } catch {
      toast.error("Could not erase");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Eraser className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-800">Magic Eraser</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-100 dark:bg-canvas p-4 overflow-auto">
          {!ready && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
          <canvas
            ref={viewRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            className={`max-w-full max-h-[58vh] object-contain touch-none rounded-lg shadow ${
              ready ? "" : "hidden"
            } ${mode === "restore" ? "cursor-cell" : "cursor-crosshair"}`}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-t border-gray-200 space-y-3">
          <p className="text-xs text-gray-500">
            Brush over the object you want to remove, then Apply. Use Restore to unpaint.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setMode("erase")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium cursor-pointer ${
                  mode === "erase" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Paintbrush className="w-4 h-4" /> Erase
              </button>
              <button
                onClick={() => setMode("restore")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium cursor-pointer ${
                  mode === "restore" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Eraser className="w-4 h-4" /> Restore
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              Brush
              <input
                type="range"
                min="8"
                max="120"
                value={brush}
                onChange={(e) => setBrush(parseInt(e.target.value, 10))}
                className="w-28 accent-blue-600 cursor-pointer"
              />
            </label>

            <div className="flex-1" />

            <button
              onClick={undo}
              disabled={!hasMask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Undo2 className="w-4 h-4" /> Undo
            </button>
            <button
              onClick={reset}
              disabled={!hasMask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={apply}
              disabled={busy || !hasMask}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {busy ? "Erasing…" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
