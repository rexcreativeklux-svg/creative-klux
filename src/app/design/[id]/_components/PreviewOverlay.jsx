"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";

/**
 * PreviewOverlay — full-screen, chrome-free preview of the design (Canva's
 * "Preview"). Paints the design with the SAME renderer used for export, so what
 * you see here is exactly what downloads. Close via the button or Esc; Download
 * stays reachable so the export isn't lost when the button becomes "Preview".
 *
 * Props: { canvas, elements, onClose, onDownload }
 */
export default function PreviewOverlay({ canvas, elements, onClose, onDownload }) {
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const rootRef = useRef(null);

  // Esc to exit; lock body scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Real fullscreen — REQUESTED, never required.
  //
  // Browsers only grant it from a user gesture and can refuse outright (an
  // iframe without the permission, a policy, an already-fullscreen window). When
  // that happens the overlay still covers the viewport, which is the part that
  // matters, so the failure is swallowed rather than surfaced: there is nothing
  // the user could do about it and nothing visibly wrong.
  //
  // Leaving fullscreen by any route — Esc, F11, the OS — closes the preview too,
  // so the two can't disagree about whether it is open.
  useEffect(() => {
    const node = rootRef.current;
    if (!node?.requestFullscreen) return undefined;

    let opened = false;
    node.requestFullscreen().then(
      () => {
        opened = true;
      },
      () => {},
    );

    const onChange = () => {
      if (opened && !document.fullscreenElement) onClose?.();
    };
    document.addEventListener("fullscreenchange", onChange);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      // Only if we are still the fullscreen element: exiting someone else's
      // fullscreen on the way out would be a surprising thing to do.
      if (document.fullscreenElement === node) document.exitFullscreen?.();
    };
  }, [onClose]);

  // Paint the design into the visible canvas via the shared renderer.
  useEffect(() => {
    const node = canvasRef.current;
    if (!node || !canvas) return;
    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({ canvas, elements: elements || [] });
        if (cancelled || !canvasRef.current) return;
        const target = canvasRef.current;
        target.width = off.width;
        target.height = off.height;
        const ctx = target.getContext("2d");
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.drawImage(off, 0, 0);
      } catch {
        /* leave blank if rendering fails */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canvas, elements]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    await onDownload?.();
    setDownloading(false);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-60 flex flex-col bg-gray-950/95 backdrop-blur-sm"
    >
      {/* Top chrome */}
      <div className="h-14 shrink-0 flex items-center justify-between px-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          Close
        </button>

        <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70">
          Press Esc to exit
        </span>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {downloading ? "Downloading…" : "Download"}
          </span>
        </button>
      </div>

      {/* Stage — the design, fitted to the viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-2xl"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </div>
    </div>
  );
}
