"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { UploadCloud, X } from "lucide-react";

/**
 * SignatureUploadTab — drop-zone for a signature image (ideally a transparent
 * PNG). Preview is a local object URL; the actual upload happens on Add, once
 * the endpoint exists.
 *
 * Props: { draft } — the useSignatureDraft bag.
 */
export default function SignatureUploadTab({ draft }) {
  const { file, setFile } = draft;
  const inputRef = useRef(null);

  // One object URL per file (memoized on file identity, not recreated per
  // render), revoked when the file changes or the tab unmounts.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onChange = (e) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
    e.target.value = "";
  };

  if (file) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative h-32 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
          <button
            onClick={() => setFile(null)}
            title="Remove"
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 truncate">{file.name}</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full h-32 rounded-xl border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition flex flex-col items-center justify-center gap-2 text-gray-400"
      >
        <UploadCloud className="w-7 h-7" />
        <span className="text-sm text-gray-500">Upload a signature image</span>
        <span className="text-[10px] text-gray-400">PNG with transparency works best</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
    </>
  );
}
