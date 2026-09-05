"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScanFace } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cutoutFace, disposeFaceCutoutWorker } from "@/(lib)/ai-engine/tasks/faceCutout";
import { insertImageCutout } from "./imageCutoutInsert";
import { SectionHeader } from "./imageEditControls";
import { ToolButton, ToolStatus } from "./toolControls";

/**
 * FaceCutoutSection — the Quick tools "Face Cutout" tile's full view: a
 * head-only sticker — face, hair and any headwear, cut tightly at the jaw —
 * added as its own layer over the source photo.
 *
 * Different from Magic Grab (whole subject) and BG Remover (replaces the
 * image): this keeps only the HEAD, dropping the neck and clothes, which is
 * what a sticker or an avatar wants and neither of those tools gives you.
 * Runs on-device via MediaPipe (face detection + multiclass portrait
 * segmentation) — no upload of the source image itself.
 *
 * Props: { element, editor }
 */
export default function FaceCutoutSection({ element, editor }) {
  const { uploadMedia } = useAuth();
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const runningRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      disposeFaceCutoutWorker();
    };
  }, []);

  const src = element?.src;

  const cut = useCallback(async () => {
    if (!src || runningRef.current) return;
    runningRef.current = true;
    setStatus("running");
    setProgress(0);
    setErrMsg("");

    try {
      const { blob } = await cutoutFace(src, {
        onProgress: ({ pct, downloading }) => {
          if (!aliveRef.current) return;
          setProgress(Math.round(pct || 0));
          setStatus(downloading ? "loading" : "running");
        },
      });
      if (!aliveRef.current) return;

      insertImageCutout(editor, element, blob, uploadMedia, "Face cutout");
      setStatus("done");
      toast.success("Face cutout added to your design.");
    } catch (err) {
      if (!aliveRef.current) return;
      setErrMsg(err?.message || "Could not cut the face out of that photo.");
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [src, element, editor, uploadMedia]);

  const busy = status === "running" || status === "loading";

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="Face cutout" />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Cuts out just the head — face, hair and any headwear, at the jaw —
        as its own layer over the photo. Runs on your device.
      </p>

      <ToolStatus
        status={status}
        progress={progress}
        error={errMsg}
        runningLabel="Finding the face…"
        loadingLabel="Downloading the model…"
      />

      <ToolButton
        icon={ScanFace}
        label={status === "done" ? "Cut out again" : "Cut out face"}
        onClick={cut}
        disabled={!src}
        busy={busy}
      />
    </div>
  );
}
