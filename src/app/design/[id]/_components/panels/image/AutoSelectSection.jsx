"use client";

import React, { useEffect, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { loadHtmlImage } from "./loadHtmlImage";
import { insertImageCutout } from "./imageCutoutInsert";
import { SectionHeader } from "./imageEditControls";
import { ToolButton, ToolStatus } from "./toolControls";

/**
 * AutoSelectSection — the Quick tools "Auto-select" tile's full view: tap a
 * point on the image and an in-browser Segment Anything model isolates just
 * that object, which is then lifted onto the canvas as its own cut-out.
 *
 * Where Magic Grab takes the whole subject, this takes the ONE thing tapped,
 * which is what you want when a photo has several.
 *
 * The image embeddings are computed once on open; each tap after that only
 * runs the (cheap) mask decoder, so picking is near-instant. Runs entirely
 * client-side via @huggingface/transformers, already a dependency here for the
 * segmentation and enhance tasks.
 *
 * Props: { element, editor }
 */
const MODEL_ID = "Xenova/slimsam-77-uniform";

export default function AutoSelectSection({ element, editor }) {
  const { uploadMedia } = useAuth();
  const [status, setStatus] = useState("loading");
  const [loadPct, setLoadPct] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const modelRef = useRef(null);
  const processorRef = useRef(null);
  const rawRef = useRef(null); // RawImage for the processor
  const embRef = useRef(null); // image embeddings, computed once
  const srcImgRef = useRef(null); // decoded <img>, for the final composite
  const natRef = useRef({ w: 0, h: 0 });
  const maskRef = useRef(null); // { data, H, W } of the current selection
  const previewRef = useRef(null); // the <img> shown in the panel
  const overlayRef = useRef(null); // canvas drawing the mask highlight
  const startedRef = useRef(false);
  const aliveRef = useRef(true);

  const src = element?.src;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Load the model and compute embeddings once, when the tool opens.
  useEffect(() => {
    if (startedRef.current || !src) return;
    startedRef.current = true;

    (async () => {
      try {
        const { SamModel, AutoProcessor, RawImage } = await import(
          "@huggingface/transformers"
        );

        const model = await SamModel.from_pretrained(MODEL_ID, {
          progress_callback: (p) => {
            if (p.status === "progress" && p.progress != null && aliveRef.current) {
              setLoadPct(Math.round(p.progress));
            }
          },
        });
        const processor = await AutoProcessor.from_pretrained(MODEL_ID);
        if (!aliveRef.current) return;

        modelRef.current = model;
        processorRef.current = processor;

        const imgEl = await loadHtmlImage(src);
        srcImgRef.current = imgEl;
        natRef.current = {
          w: imgEl.naturalWidth || imgEl.width,
          h: imgEl.naturalHeight || imgEl.height,
        };

        // RawImage reads from a URL, so the decoded image is re-encoded through
        // a blob — that also strips any cross-origin taint.
        const c = document.createElement("canvas");
        c.width = natRef.current.w;
        c.height = natRef.current.h;
        c.getContext("2d").drawImage(imgEl, 0, 0);
        const blob = await new Promise((res) => c.toBlob(res, "image/png"));
        const objUrl = URL.createObjectURL(blob);
        const raw = await RawImage.read(objUrl);
        URL.revokeObjectURL(objUrl);
        if (!aliveRef.current) return;
        rawRef.current = raw;

        const imageInputs = await processor(raw);
        embRef.current = await model.get_image_embeddings(imageInputs);
        if (!aliveRef.current) return;
        setStatus("ready");
      } catch (err) {
        if (!aliveRef.current) return;
        setErrMsg(err?.message || String(err));
        setStatus("error");
      }
    })();
  }, [src]);

  // Run the mask decoder for a tapped point, in image-pixel coordinates.
  const segmentAt = async (x, y) => {
    const model = modelRef.current;
    const processor = processorRef.current;
    const raw = rawRef.current;
    const emb = embRef.current;
    if (!model || !processor || !raw || !emb) return;

    setStatus("running");
    try {
      const inputs = await processor(raw, { input_points: [[[x, y]]] });
      const outputs = await model({
        ...emb,
        input_points: inputs.input_points,
        input_labels: inputs.input_labels,
      });
      const masks = await processor.post_process_masks(
        outputs.pred_masks,
        inputs.original_sizes,
        inputs.reshaped_input_sizes,
      );

      const m = masks[0];
      const [, , H, W] = m.dims;

      // The model proposes several masks; take the one it scores highest.
      const scores = Array.from(outputs.iou_scores.data);
      let best = 0;
      for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;

      const plane = new Uint8Array(H * W);
      const off = best * H * W;
      for (let i = 0; i < H * W; i++) plane[i] = m.data[off + i] ? 1 : 0;

      if (!aliveRef.current) return;
      maskRef.current = { data: plane, H, W };
      drawOverlay();
      setStatus("preview");
    } catch {
      if (!aliveRef.current) return;
      toast.error("Could not select there — try another spot.");
      setStatus("ready");
    }
  };

  // Paint the mask as a translucent blue highlight over the preview.
  const drawOverlay = () => {
    const mask = maskRef.current;
    const oc = overlayRef.current;
    if (!mask || !oc) return;

    const { data, H, W } = mask;
    oc.width = W;
    oc.height = H;
    const ctx = oc.getContext("2d");
    const id = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      if (!data[i]) continue;
      id.data[i * 4] = 37;
      id.data[i * 4 + 1] = 99;
      id.data[i * 4 + 2] = 235;
      id.data[i * 4 + 3] = 120;
    }
    ctx.putImageData(id, 0, 0);
  };

  const onPick = (e) => {
    if (status !== "ready" && status !== "preview") return;
    const el = previewRef.current;
    if (!el) return;

    // Map the tap from displayed pixels back to image pixels — the preview is
    // scaled to the panel width, so these are not the same.
    const rect = el.getBoundingClientRect();
    const { w, h } = natRef.current;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * w);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * h);
    if (x < 0 || y < 0 || x >= w || y >= h) return;

    segmentAt(x, y);
  };

  // Composite the selection into a transparent cut-out and place it.
  const lift = async () => {
    const mask = maskRef.current;
    const imgEl = srcImgRef.current;
    if (!mask || !imgEl) return;

    const { w, h } = natRef.current;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, w, h);

    const id = ctx.getImageData(0, 0, w, h);
    const { data } = mask;
    // Clear alpha everywhere outside the mask.
    for (let i = 0; i < w * h; i++) if (!data[i]) id.data[i * 4 + 3] = 0;
    ctx.putImageData(id, 0, 0);

    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    if (!blob) return;
    insertImageCutout(editor, element, blob, uploadMedia, "Selection");
    toast.success("Selection lifted onto its own layer.");
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="Auto-select" />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Tap anything in the image to select just that object, then lift it out
        as its own layer. Runs on your device.
      </p>

      <ToolStatus
        status={status}
        progress={status === "loading" ? loadPct : 0}
        error={errMsg}
        runningLabel="Selecting…"
        loadingLabel="Loading the model…"
      />

      {status !== "error" && src && (
        <div
          className={`relative w-full rounded-lg overflow-hidden border border-gray-200 ${
            status === "ready" || status === "preview" ? "cursor-crosshair" : ""
          }`}
          onClick={onPick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={previewRef}
            src={proxiedSrc(src)}
            alt=""
            draggable={false}
            className="w-full h-auto block select-none"
          />
          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
      )}

      {status === "preview" && (
        <ToolButton icon={Scissors} label="Lift selection" onClick={lift} />
      )}
    </div>
  );
}
