"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, RefreshCw, Type } from "lucide-react";
import { toast } from "sonner";
import { loadHtmlImage } from "./loadHtmlImage";
import { insertGrabbedText } from "./imageCutoutInsert";
import { SectionHeader } from "./imageEditControls";
import { ToolStatus } from "./toolControls";

/**
 * GrabTextSection — the Quick tools "Grab Text" tile's full view: read the
 * text out of the image and drop it in as a real, editable text element.
 *
 * Runs entirely in the browser via tesseract.js; there is no backend call.
 * Tesseract is loaded with pinned CDN paths rather than through its own
 * `recognize` shortcut: an explicit worker is created and fed an
 * already-decoded canvas, so it never has to fetch or decode a remote URL
 * (including a proxied one) itself.
 *
 * Props: { element, editor }
 */
const V = "7.0.0";
const WORKER_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js@${V}/dist/worker.min.js`;
const CORE_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js-core@${V}/`;
const LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0";

// Downscale very large images before OCR — accuracy plateaus well below this
// and run time does not.
const MAX_DIM = 2500;

export default function GrabTextSection({ element, editor }) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
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

  const scan = useCallback(async () => {
    if (!src || runningRef.current) return;
    runningRef.current = true;
    setStatus("running");
    setProgress(0);
    setErrMsg("");

    let worker;
    try {
      const img = await loadHtmlImage(src);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const scale = Math.min(1, MAX_DIM / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng", 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        logger: (m) => {
          if (m.status === "recognizing text" && aliveRef.current) {
            setProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });

      const { data } = await worker.recognize(canvas);
      if (!aliveRef.current) return;

      const found = (data?.text || "").trim();
      setText(found);
      setStatus("done");
      if (!found) toast.info("No readable text found in this image.");
    } catch (err) {
      if (!aliveRef.current) return;
      setErrMsg(err?.message || "Could not read text from this image.");
      setStatus("error");
    } finally {
      // Terminating matters: each worker holds a downloaded language model.
      try {
        await worker?.terminate();
      } catch {
        /* already gone */
      }
      runningRef.current = false;
    }
  }, [src]);

  // Scan on open — the tool has exactly one job, so making the user press
  // Start first would just be an extra click.
  useEffect(() => {
    scan();
    // Deliberately once per element: `scan` changes identity with `src` too,
    // and re-running on every identity change would rescan mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element?.id]);

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Grab text"
        action={
          status !== "running" && (
            <button
              type="button"
              onClick={scan}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Rescan
            </button>
          )
        }
      />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Reads any text in the image and adds it as an editable text layer. Runs
        on your device — nothing is uploaded.
      </p>

      <ToolStatus status={status} progress={progress} error={errMsg} runningLabel="Reading text…" />

      {status === "done" && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="No text found."
            className="w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-700 resize-y focus:outline-none focus:border-blue-400"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(text);
                toast.success("Copied.");
              }}
              disabled={!text.trim()}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => {
                if (insertGrabbedText(editor, element, text)) {
                  toast.success("Text added to the canvas.");
                }
              }}
              disabled={!text.trim()}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <Type className="w-3.5 h-3.5" />
              Add as text
            </button>
          </div>
        </>
      )}

      {status === "running" && (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          The language model downloads once, then stays cached.
        </p>
      )}
    </div>
  );
}
