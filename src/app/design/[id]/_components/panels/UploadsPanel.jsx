"use client";

import React, { useEffect, useRef } from "react";
import { UploadCloud, Loader2, ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Uploads panel — upload a new image (goes to the Image Gallery + canvas) and
 * pick from previously uploaded images. Clicking a thumbnail drops it on the
 * canvas via insert.imageUrl (durable https URL, safe to save).
 */
export default function UploadsPanel({ insert }) {
  const { myImages, myImagesLoading, fetchMyImages } = useAuth();
  const fileRef = useRef(null);

  useEffect(() => {
    if (!myImages?.length) fetchMyImages?.();
    // one-shot on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) insert.imageFile(file);
    e.target.value = "";
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition"
      >
        <UploadCloud className="w-4 h-4" /> Upload an image
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />

      {myImagesLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : myImages?.length ? (
        <div className="grid grid-cols-2 gap-2">
          {myImages.map((img) => (
            <button
              key={img.id}
              onClick={() => insert.imageUrl(img.src)}
              className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 cursor-pointer transition bg-gray-50"
              title={img.filename || "Add image"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
          <ImageIcon className="w-8 h-8" />
          <p className="text-xs text-gray-400">No uploads yet</p>
        </div>
      )}
    </div>
  );
}
