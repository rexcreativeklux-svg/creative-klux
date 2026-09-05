"use client";

import React, { useState } from "react";
import { Check, ImageOff, Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { removeBackground } from "@/(lib)/ai-engine/tasks/removeBackground";
import { drawCover } from "@/(lib)/design/renderDesign";
import { loadHtmlImage } from "./loadHtmlImage";
import { uploadDurableUrl } from "./persistBlob";
import PanelSearchInput from "../shared/PanelSearchInput";
import usePexelsSearch from "../uploads/usePexelsSearch";
import { SectionHeader } from "./imageEditControls";
import { ToolButton, ToolStatus } from "./toolControls";

/**
 * BgSceneSection — the Quick tools "Bg Scene" tile's full view: cut the
 * subject out, then place it on a real background photo.
 *
 * Composited into `src` rather than kept as two layers: this editor's image
 * element holds one picture, not a background + foreground pair, so "put a
 * scene behind it" means baking scene + subject into one PNG — the same way
 * Enhance bakes its result — rather than teaching both renderers a new
 * layering primitive. The transparent cut-out itself is kept in `cutoutSrc`
 * so picking a different scene recomposites the SAME subject instead of
 * re-running segmentation, and `backgroundScene` remembers which stock photo
 * is behind it (for the tile highlight and the Remove action).
 *
 * Props: { element, editor }
 */
export default function BgSceneSection({ element, editor }) {
  const { uploadMedia } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [placing, setPlacing] = useState(null); // url of the scene mid-composite

  const stock = usePexelsSearch({ query: query.trim(), type: "image" });
  const cutOut = Boolean(element.cutoutSrc);
  const busy = status === "running" || status === "loading";

  const cutSubjectOut = async () => {
    if (!element.src) return;
    setStatus("running");
    setProgress(0);
    setErrMsg("");
    try {
      const { blob } = await removeBackground(element.src, {
        onProgress: ({ pct, downloading }) => {
          setProgress(Math.round(pct || 0));
          setStatus(downloading ? "loading" : "running");
        },
      });

      // `cutoutSrc` tracks `src` at every step (local, then durable) — it has
      // to stay the exact transparent cut-out for a scene pick to composite
      // onto, not just "whatever src happened to be recently".
      const localUrl = URL.createObjectURL(blob);
      editor.updateElement(
        element.id,
        {
          src: localUrl,
          cutoutSrc: localUrl,
          backgroundRemoved: true,
          originalSrc: element.originalSrc || element.src,
        },
        { record: true },
      );
      setStatus("done");

      const url = await uploadDurableUrl(uploadMedia, blob, "cutout.png");
      if (url) {
        editor.updateElement(element.id, { src: url, cutoutSrc: url }, { record: false });
      }
    } catch (err) {
      setErrMsg(err?.message || "Could not isolate the subject.");
      setStatus("error");
    }
  };

  const pickScene = async (result) => {
    const subjectSrc = element.cutoutSrc;
    if (!subjectSrc || placing) return;
    setPlacing(result.full);
    try {
      const [subject, scene] = await Promise.all([
        loadHtmlImage(subjectSrc),
        loadHtmlImage(result.full),
      ]);
      const w = subject.naturalWidth || subject.width;
      const h = subject.naturalHeight || subject.height;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      // Scene fills the frame (cropping to it, same as the image's own default
      // fit); the subject draws over it at its full, uncropped size.
      drawCover(ctx, scene, 0, 0, w, h);
      ctx.drawImage(subject, 0, 0, w, h);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;

      const localUrl = URL.createObjectURL(blob);
      editor.updateElement(
        element.id,
        { src: localUrl, backgroundScene: result.full },
        { record: true },
      );
      const url = await uploadDurableUrl(uploadMedia, blob, "scene.png");
      if (url) {
        editor.updateElement(
          element.id,
          { src: url, backgroundScene: result.full },
          { record: false },
        );
      }
      toast.success("Background applied.");
    } catch {
      toast.error("Could not place the subject on that scene.");
    } finally {
      setPlacing(null);
    }
  };

  const removeScene = () => {
    if (!element.cutoutSrc) return;
    editor.updateElement(
      element.id,
      { src: element.cutoutSrc, backgroundScene: null },
      { record: true },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Bg scene"
        action={
          element.backgroundScene && (
            <button
              type="button"
              onClick={removeScene}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Remove
            </button>
          )
        }
      />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Cut your subject out, then place it on a real background photo. Search a
        scene and tap one to apply it.
      </p>

      {/* Step 1 — the cut-out. A scene behind an un-cut photo would be hidden. */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          1. Subject
        </p>

        <ToolStatus
          status={status}
          progress={progress}
          error={errMsg}
          runningLabel="Isolating the subject…"
          loadingLabel="Downloading the model…"
        />

        {cutOut ? (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            Subject isolated.
          </p>
        ) : (
          <ToolButton
            icon={Scissors}
            label="Cut subject out"
            onClick={cutSubjectOut}
            disabled={!element.src}
            busy={busy}
          />
        )}
      </div>

      {/* Step 2 — the scene. */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          2. Scene
        </p>

        <PanelSearchInput value={query} onChange={setQuery} placeholder="beach, studio, forest…" />

        {!cutOut ? (
          <p className="text-[11px] text-amber-600 leading-relaxed">
            Cut the subject out above first — a scene needs something to put it
            behind.
          </p>
        ) : !query.trim() ? (
          <p className="text-[11px] text-gray-400 py-3 text-center">
            Search for a scene to place your subject on.
          </p>
        ) : stock.loading ? (
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 py-6">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Searching…
          </p>
        ) : stock.error ? (
          <p className="text-[11px] text-red-500 py-3 text-center">
            Couldn’t search scenes — {stock.error}.
          </p>
        ) : !stock.results.length ? (
          <p className="flex flex-col items-center gap-1.5 text-[11px] text-gray-400 py-6">
            <ImageOff className="w-5 h-5" />
            No scenes for “{query.trim()}”.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {stock.results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => pickScene(result)}
                disabled={Boolean(placing)}
                title={result.alt || "Use this scene"}
                className={`relative rounded-md overflow-hidden border cursor-pointer transition disabled:cursor-wait ${
                  element.backgroundScene === result.full
                    ? "border-blue-500 ring-1 ring-blue-400"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.thumb}
                  alt=""
                  draggable={false}
                  className="w-full aspect-square object-cover"
                />
                {placing === result.full && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
