"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { disposeSketchWorker, sketchImage } from "@/(lib)/ai-engine/tasks/sketchImage";
import { SKETCH_STYLES } from "@/(lib)/ai-engine/sketchStyles";
import useStylePreviews from "./useStylePreviews";
import { insertImageCutout } from "./imageCutoutInsert";
import { PresetTile, SectionHeader } from "./imageEditControls";
import { ToolButton, ToolStatus } from "./toolControls";

/**
 * SketchifySection — the Quick tools "Sketchify" tile's full view: turn the
 * selected image into a drawing.
 *
 * Every tile is THIS image rendered in that style, on-device (see
 * useStylePreviews) — the same reason Adjust's preset tiles preview on the
 * real photo rather than a swatch.
 *
 * Two engines behind the twelve styles: "dodge" is pure canvas maths and
 * instant; "lineart" is the informative-drawings ONNX model (MIT, 17MB,
 * cached after first use). Tapping any tile applies it — sketchifying lands
 * as a NEW layer over the source photo (like Magic Grab), not a replacement,
 * so the original stays put underneath and the sketch can be dragged off it.
 *
 * Props: { element, editor }
 */
const DEFAULT_STYLE = "pencil-sketch";
// How much of the photo's own colour survives into the strokes when "Colored
// pencil" is on. Matches the registry's colored-pencil-sketch style, which is
// what the value was tuned for.
const COLOURED_CHROMA = 0.85;

// Every registry label ends in "Sketch", which is noise in a grid of sketches.
const tileLabel = (label) => label.replace(/\s*Sketch$/i, "");

export default function SketchifySection({ element, editor }) {
  const { uploadMedia } = useAuth();
  const [styleId, setStyleId] = useState(DEFAULT_STYLE);
  const [coloured, setColoured] = useState(false);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);

  const runningRef = useRef(false);
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      disposeSketchWorker();
    };
  }, []);

  const src = element?.src;
  const busy = status === "running" || status === "loading";

  // Previews stand down while a real run is going: both go through the same
  // worker, which keeps ONE cached working image.
  const { previews } = useStylePreviews(src, SKETCH_STYLES, { enabled: !busy });

  const run = useCallback(
    async (id = styleId) => {
      if (!src || runningRef.current) return;
      runningRef.current = true;
      setStyleId(id);
      setStatus("running");
      setProgress(0);

      try {
        const { blob } = await sketchImage(src, {
          style: id,
          // Both engines read keepChroma: dodge tints the strokes with it, the
          // line-art engine lays a faded colour copy under the lines.
          params: coloured ? { keepChroma: COLOURED_CHROMA } : undefined,
          onProgress: ({ pct, downloading }) => {
            if (!aliveRef.current) return;
            setProgress(Math.round(pct || 0));
            setStatus(downloading ? "loading" : "running");
          },
        });
        if (!aliveRef.current) return;

        insertImageCutout(editor, element, blob, uploadMedia, "Sketch");
        setStatus("done");
        toast.success("Sketch added to your design.");
      } catch (err) {
        if (!aliveRef.current) return;
        toast.error(err?.message || "Could not sketchify that image.");
        setStatus("idle");
      } finally {
        runningRef.current = false;
      }
    },
    [src, element, editor, styleId, coloured, uploadMedia],
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="Sketchify" />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Every tile is this image in that style, rendered on your device. Tap
        one to add it as a new layer over the photo.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {SKETCH_STYLES.map((style) => (
          <PresetTile
            key={style.id}
            label={tileLabel(style.label)}
            src={previews[style.id] || null}
            active={styleId === style.id}
            onClick={() => run(style.id)}
          />
        ))}
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer pt-1">
        <span className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-700">Colored pencil</span>
          <span className="text-[10px] text-gray-400 leading-relaxed">
            Keeps the photo&apos;s own colour in the strokes.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={coloured}
          onClick={() => setColoured((v) => !v)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
            coloured ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] ${
              coloured ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <ToolStatus
        status={status}
        progress={progress}
        runningLabel="Sketchifying…"
        loadingLabel="Downloading the model…"
      />

      <ToolButton
        icon={PenLine}
        label={status === "done" ? "Sketchify again" : "Sketchify"}
        onClick={() => run()}
        disabled={!src}
        busy={busy}
      />
      <p className="text-[10px] text-gray-400">
        Line-art styles use a 17MB model, downloaded once. Runs on your device
        — nothing is uploaded.
      </p>
    </div>
  );
}
