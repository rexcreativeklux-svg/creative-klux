"use client";

import { useState } from "react";
import { X, ChevronDown, Check, Crown, Info } from "lucide-react";
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";
import { downloadBlob } from "@/utils/downloadName";
import { getPopoverPosition, FILE_TYPES } from "./shareOptions";

/**
 * DownloadModal — cloned from the Design-Editor reference, rewired to
 * creative-klux's own renderer (renderDesignToCanvas) instead of the sibling's
 * Konva canvas + Zustand stores. Single-design (no multi-page picker).
 */
export default function DownloadModal({ isOpen, onClose, buttonRef, canvas, elements }) {
  const [fileType, setFileType] = useState("png");
  const [showFileTypeDropdown, setShowFileTypeDropdown] = useState(false);
  const [sizeMultiplier, setSizeMultiplier] = useState(1);
  const [limitFileSize, setLimitFileSize] = useState(false);
  const [compressFile, setCompressFile] = useState(false);
  const [transparentBg, setTransparentBg] = useState(false);
  const [saveSettings, setSaveSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const canvasWidth = canvas?.width || 0;
  const canvasHeight = canvas?.height || 0;
  const selectedFileType = FILE_TYPES.find((ft) => ft.value === fileType) || FILE_TYPES[1];

  const outputWidth = Math.round(canvasWidth * sizeMultiplier);
  const outputHeight = Math.round(canvasHeight * sizeMultiplier);

  const handleDownload = async () => {
    if (!elements || elements.length === 0) {
      alert("Cannot export empty canvas! Please add some elements first.");
      return;
    }

    setIsDownloading(true);
    try {
      // Render at native size, then scale into an output canvas.
      const transparent = transparentBg && fileType === "png";
      const source = await renderDesignToCanvas({
        canvas: transparent ? { ...canvas, background: "transparent" } : canvas,
        elements,
      });

      const out = document.createElement("canvas");
      out.width = Math.max(1, outputWidth);
      out.height = Math.max(1, outputHeight);
      const ctx = out.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, out.width, out.height);

      const isPDF = fileType === "pdf-standard" || fileType === "pdf-print";

      if (isPDF) {
        const { jsPDF } = await import("jspdf");
        const imgData = out.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: canvasWidth > canvasHeight ? "landscape" : "portrait",
          unit: "px",
          format: [out.width, out.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, out.width, out.height);
        downloadBlob(pdf.output("blob"), "pdf");
      } else {
        const isJpg = fileType === "jpg";
        const mime = isJpg ? "image/jpeg" : "image/png";
        const quality = compressFile ? 0.7 : 0.92;
        const blob = await new Promise((resolve) => out.toBlob(resolve, mime, quality));
        downloadBlob(blob, isJpg ? "jpg" : "png");
      }

      setTimeout(onClose, 800);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px] max-h-[85vh] overflow-y-auto z-[200]"
      style={getPopoverPosition(buttonRef)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold">Download</h2>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* File Type */}
        <div>
          <label className="block text-sm font-semibold mb-3">File type</label>
          <div className="relative">
            <button
              onClick={() => setShowFileTypeDropdown(!showFileTypeDropdown)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                <selectedFileType.icon className="w-6 h-6 text-gray-700" />
                <span className="font-medium">{selectedFileType.label}</span>
                {selectedFileType.suggested && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-md">
                    Suggested
                  </span>
                )}
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {showFileTypeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-500 rounded-xl shadow-xl z-[250] max-h-96 overflow-y-auto">
                {FILE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setFileType(type.value);
                      setShowFileTypeDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      type.value === fileType ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <type.icon className="w-6 h-6 text-gray-700" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{type.label}</span>
                          {type.suggested && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-md">
                              Suggested
                            </span>
                          )}
                          {type.premium && <Crown className="w-4 h-4 text-gray-400" />}
                        </div>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                    {type.value === fileType && <Check className="w-5 h-5 text-gray-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Size Multiplier */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">Size ×</label>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.01"
              value={sizeMultiplier}
              onChange={(e) => setSizeMultiplier(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(74, 119, 255) 0%, rgb(74, 119, 255) ${
                  ((sizeMultiplier - 0.25) / 2.75) * 100
                }%, #e5e7eb ${((sizeMultiplier - 0.25) / 2.75) * 100}%, #e5e7eb 100%)`,
              }}
            />

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sizeMultiplier.toFixed(2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.25 && val <= 3) setSizeMultiplier(val);
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
              />
              <Crown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-2">
            {outputWidth} × {outputHeight} px
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={limitFileSize}
                onChange={(e) => setLimitFileSize(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Limit file size</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <Crown className="w-4 h-4 text-gray-400" />
          </label>

          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={compressFile}
                onChange={(e) => setCompressFile(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Compress file (lower quality)</span>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
                disabled={fileType !== "png"}
              />
              <span className="text-sm font-medium">Transparent background</span>
            </div>
            {fileType !== "png" && <span className="text-xs text-gray-400">PNG only</span>}
          </label>
        </div>

        {/* Preferences */}
        <div>
          <label className="block text-sm font-semibold mb-3">Preferences</label>
          <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={saveSettings}
              onChange={(e) => setSaveSettings(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Save download settings</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 space-y-3 sticky bottom-0 bg-white">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Downloading...
            </>
          ) : (
            "Download"
          )}
        </button>
      </div>
    </div>
  );
}
