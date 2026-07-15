import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

// The big dashed "Upload images / or drop them here" zone at the top of the All
// tab. Handles both click-to-pick and drag-and-drop; only image files pass
// through. Reports picked files up via `onFiles(File[])`.
export default function UploadDropzone({ onFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pickFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pickFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-14 px-6 text-center ${
        dragging
          ? "border-gray-900 bg-gray-50"
          : "border-gray-200 bg-gray-50/60 hover:border-gray-300"
      }`}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors cursor-pointer"
      >
        <UploadCloud className="w-5 h-5" />
        Upload images
      </button>
      <p className="text-sm text-gray-400">or drop them here</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          pickFiles(e.target.files);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
    </div>
  );
}
