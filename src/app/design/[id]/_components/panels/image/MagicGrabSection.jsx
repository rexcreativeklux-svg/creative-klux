"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Hand, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { removeBackground } from "@/(lib)/ai-engine/tasks/removeBackground";
import { insertImageCutout } from "./imageCutoutInsert";
import { SectionHeader } from "./imageEditControls";
import { ToolButton, ToolStatus } from "./toolControls";

/**
 * MagicGrabSection — the Quick tools "Magic Grab" tile's full view: cuts the
 * main subject out and adds it as a NEW element sitting exactly over the
 * original, which stays where it is.
 *
 * That's the difference from BG Remover: BG Remover replaces the image with
 * its cut-out, Magic Grab leaves the photo intact and hands you the subject as
 * a separate thing you can drag away from it.
 *
 * Uses the same on-device segmentation task as BG removal — no upload of the
 * source image itself.
 *
 * Props: { element, editor }
 */
export default function MagicGrabSection({ element, editor }) {
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
    };
  }, []);

  const src = element?.src;

  const grab = useCallback(async () => {
    if (!src || runningRef.current) return;
    runningRef.current = true;
    setStatus("running");
    setProgress(0);
    setErrMsg("");

    try {
      const { blob } = await removeBackground(src, {
        onProgress: ({ pct, downloading }) => {
          if (!aliveRef.current) return;
          setProgress(Math.round(pct || 0));
          // The first run downloads the model, which is much slower than the
          // segmentation itself — worth saying so rather than looking hung.
          setStatus(downloading ? "loading" : "running");
        },
      });
      if (!aliveRef.current) return;

      insertImageCutout(editor, element, blob, uploadMedia, "Subject cut-out");
      setStatus("done");
      toast.success("Subject lifted onto its own layer.");
    } catch (err) {
      if (!aliveRef.current) return;
      setErrMsg(err?.message || "Could not isolate the subject.");
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [src, element, editor, uploadMedia]);

  const busy = status === "running" || status === "loading";

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Magic grab"
        action={
          status === "done" && (
            <button
              type="button"
              onClick={grab}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Again
            </button>
          )
        }
      />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Lifts the subject out as its own layer, leaving the photo underneath
        untouched. It lands directly on top — drag it to separate the two.
      </p>

      <ToolStatus
        status={status}
        progress={progress}
        error={errMsg}
        runningLabel="Isolating the subject…"
        loadingLabel="Downloading the model…"
      />

      <ToolButton
        icon={Hand}
        label={status === "done" ? "Grab again" : "Grab subject"}
        onClick={grab}
        disabled={!src}
        busy={busy}
      />
    </div>
  );
}
