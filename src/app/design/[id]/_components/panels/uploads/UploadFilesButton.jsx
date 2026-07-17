"use client";

import React, { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { MEDIA_ACCEPT } from "@/app/(components)/gallery/mediaTypes";

/**
 * UploadFilesButton — picks files for the gallery. Accepts every type the
 * gallery can classify (MEDIA_ACCEPT), not just images.
 *
 * Props: { onFiles: (File[]) => void, uploading }
 */
export default function UploadFilesButton({ onFiles, uploading }) {
  const inputRef = useRef(null);

  const handle = async (e) => {
    // Grab the element up front: we clear it after the await, by which point
    // React may have moved on from this event.
    const input = e.target;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    await onFiles(files);

    // Reset only once the uploads have finished. Clearing the input detaches
    // the selected files, and fetch streams the multipart body asynchronously —
    // reset it too early and the `file` part serializes empty, which the API
    // rejects with "The file field is required". Resetting lets the same file
    // be picked again.
    input.value = "";
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-default text-white text-sm font-semibold cursor-pointer transition"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {uploading ? "Uploading…" : "Upload files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        onChange={handle}
        className="hidden"
      />
    </>
  );
}
