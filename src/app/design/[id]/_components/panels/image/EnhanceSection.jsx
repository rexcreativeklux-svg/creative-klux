"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Gem, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { upscaleImage, disposeUpscaleWorker } from "@/(lib)/ai-engine/tasks/upscaleImage";
import { commitBlobToElement } from "./persistBlob";
import { SectionHeader } from "./imageEditControls";
import { ToolButton, ToolStatus } from "./toolControls";

/**
 * EnhanceSection — the Quick tools "Enhance" tile's full view: sharpen and 4×
 * upscale the selected image, fully on-device (Real-ESRGAN, tiled in a Web
 * Worker, WebGPU → WASM) via the same ai-engine task the standalone Photo
 * Enhancer tool uses.
 *
 * Unlike the cut-out tools this does NOT add a layer — enhancing is something
 * that happens TO the picture, so it writes back over `src` and the element
 * keeps its box, its crop and its place in the stack. Ctrl+Z puts the old
 * source back.
 *
 * Props: { element, editor, onDone? }
 */
const TIERS = [
  { id: "standard", label: "Standard", icon: Sparkles, tone: "from-sky-400 to-blue-600" },
  { id: "hd", label: "HD", icon: Gem, tone: "from-violet-400 to-fuchsia-600" },
];

export default function EnhanceSection({ element, editor }) {
  const { uploadMedia } = useAuth();
  const [tier, setTier] = useState("standard");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const runningRef = useRef(false);
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      // The worker holds a model in memory (67MB on the HD tier); leaving the
      // tool is the clearest "done with this" signal we get.
      disposeUpscaleWorker();
    };
  }, []);

  const src = element?.src;
  const busy = status === "running" || status === "loading";

  const enhance = useCallback(async () => {
    if (!src || runningRef.current) return;
    runningRef.current = true;
    setStatus("running");
    setProgress(0);

    try {
      const out = await upscaleImage(src, {
        tier,
        onProgress: ({ pct, downloading }) => {
          if (!aliveRef.current) return;
          setProgress(Math.round(pct || 0));
          setStatus(downloading ? "loading" : "running");
        },
      });
      if (!aliveRef.current) return;

      // Straight back onto `src`, undoable-then-durable like every other
      // in-place image edit in this editor.
      await commitBlobToElement(editor, element.id, out.blob, uploadMedia, "enhanced.png", {
        enhanced: true,
      });
      if (!aliveRef.current) return;

      setResult(out);
      setStatus("done");

      // The worker silently drops to the standard model when HD was asked for
      // on a machine without WebGPU — passing that on beats claiming an HD
      // result that wasn't produced.
      if (tier === "hd" && out.tier !== "hd") {
        setTier(out.tier || "standard");
        toast.success("Enhanced with the standard model — this device has no WebGPU for HD.");
      } else {
        toast.success("Image enhanced.");
      }
    } catch (err) {
      if (!aliveRef.current) return;
      toast.error(err?.message || "Could not enhance that image.");
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [src, tier, editor, element, uploadMedia]);

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="Enhance" />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Rebuilds the photo at 4× the detail — sharper edges, less of the mush
        that gives away a small image blown up. Replaces this image in place;
        its size and position on the page don&apos;t change.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {TIERS.map(({ id, label, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTier(id)}
            disabled={busy}
            aria-pressed={tier === id}
            className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              tier === id
                ? "border-blue-500 ring-1 ring-blue-400 bg-blue-50/40"
                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/20"
            }`}
          >
            <span
              className={`w-10 h-10 rounded-lg bg-linear-to-br ${tone} flex items-center justify-center text-white shadow-sm`}
            >
              <Icon className="w-5 h-5" />
            </span>
            <span
              className={`text-xs font-semibold ${tier === id ? "text-blue-600" : "text-gray-700"}`}
            >
              {label}
            </span>
            {tier === id && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>

      <ToolStatus
        status={status}
        progress={progress}
        runningLabel="Enhancing…"
        loadingLabel="Downloading the model…"
      />

      {status === "done" && result?.width && (
        <p className="text-[11px] text-gray-500">
          Now {result.width} × {result.height}px.
        </p>
      )}

      <ToolButton
        icon={Wand2}
        label={status === "done" ? "Enhance again" : "Enhance photo"}
        onClick={enhance}
        disabled={!src}
        busy={busy}
      />
    </div>
  );
}
