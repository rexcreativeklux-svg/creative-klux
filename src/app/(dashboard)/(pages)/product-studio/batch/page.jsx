"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Folder,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import BackgroundRemoverModal from "@/app/(components)/product-studio/BackgroundRemoverModal";

// Horizontal row with hidden scrollbar + arrows that appear on hover and hide
// at the start/end of the scroll.
function ScrollRow({ children }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <div className="relative group/row">
      <div ref={ref} className="flex gap-3 overflow-x-auto hide-scrollbar">
        {children}
      </div>
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Pexels CDN helper (free license, stable URLs).
const px = (id, w = 400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${w}&fit=crop`;

const HERO_CAPS = [px(33611287), px(33611287), px(33611287)];
const TSHIRT = px(8532616);
const SNEAKER = px(35618110);

// Transparent checkerboard used for the first "Essentials" tile.
const CHECKER =
  'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e5e7eb%22/%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e5e7eb%22/%3E%3C/svg%3E")';

const ESSENTIALS = [
  { id: "transparent", bg: CHECKER },
  { id: "white", bg: "#ffffff" },
  { id: "soft-1", bg: "#f7f7f5" },
  { id: "soft-2", bg: "#eceae4" },
  { id: "soft-3", bg: "#f3efe8" },
  { id: "soft-4", bg: "#efeae1" },
  { id: "soft-5", bg: "#f5f1ea" },
];

const STUDIO = [
  "#f3efe6",
  "#ece8de",
  "#f2eee6",
  "#f6f0df",
  "#f0d8c4",
  "#d9e4d2",
  "#d7e6f0",
  "#f3dcd6",
];

export default function BatchPage() {
  const router = useRouter();
  const imagesInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]); // { name, url, file }
  const [editorOpen, setEditorOpen] = useState(false);

  // <input> doesn't accept webkitdirectory as a React prop — set it imperatively.
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
  }, []);

  const addFiles = (fileList) => {
    const imgs = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!imgs.length) {
      toast.error("No images found.");
      return;
    }
    const capped = imgs.slice(0, 250);
    setFiles(
      capped.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
        file: f,
      })),
    );
    setEditorOpen(true); // open straight in the Background Remover
    if (imgs.length > 250) toast("Only the first 250 images were added.");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/product-studio")}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Batch</h1>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-3xl border-2 border-dashed transition-colors ${dragOver ? "border-violet-400 bg-violet-50/40" : "border-gray-200 bg-gray-50/60"}`}
      >
        <div className="flex flex-col items-center justify-center py-16 px-6">
          {/* Decorative cap thumbnails */}
          <div className="flex items-end gap-3 mb-7">
            {HERO_CAPS.map((src, i) => (
              <div
                key={i}
                className={`rounded-xl overflow-hidden shadow-sm bg-[#cfe0d6] ${i === 1 ? "w-24 h-24" : "w-20 h-20"} ${i === 2 ? "relative" : ""}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 2 && (
                  <div className="absolute inset-y-0 right-0 w-1.5 bg-linear-to-l from-violet-400/70 to-transparent" />
                )}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">
            Edit up to 250 images at once
          </h2>
          <p className="text-gray-500 mb-7">
            Drag and drop images or a folder on this page.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => imagesInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white text-sm font-semibold transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              Import images
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Folder className="w-4 h-4" />
              Import folder
            </button>
          </div>

          <input
            ref={imagesInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Imported images */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Imported ({files.length})
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditorOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-linear-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white text-sm font-semibold transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4" /> Edit all
              </button>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
          {/* Bare square thumbnails with no caption, so they stay useful much
              smaller than the labelled grids elsewhere — 96px keeps six across
              on a desktop pane and three on a phone. */}
          <div className="grid grid-fluid-[96px] gap-3">
            {files.map((f, i) => (
              <button
                key={i}
                onClick={() => setEditorOpen(true)}
                className="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-violet-300 transition-all"
              >
                <img
                  src={f.url}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Essentials */}
      <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">
        Essentials
      </h2>
      <ScrollRow>
        {ESSENTIALS.map((e) => (
          <button
            key={e.id}
            onClick={() => toast("Template editing is coming soon.")}
            className="group/tile shrink-0 w-40 h-40 rounded-2xl overflow-hidden relative cursor-pointer"
          >
            <img
              src={TSHIRT}
              alt="t-shirt"
              className="w-full h-full object-cover"
            />
            {/* A scrim over a PHOTO, so it must darken in both themes —
                `bg-gray-900` flips to near-white in dark and washed the tile
                out on hover instead of shading it. */}
            <div className="absolute inset-0 bg-black/30 translate-y-full group-hover/tile:translate-y-0 transition-transform duration-300" />
          </button>
        ))}
      </ScrollRow>

      {/* Studio */}
      <h2 className="text-base font-semibold text-gray-900 mt-8 mb-4">
        Studio
      </h2>
      <ScrollRow>
        {STUDIO.map((_, i) => (
          <button
            key={i}
            onClick={() => toast("Studio backgrounds are coming soon.")}
            className="group/tile shrink-0 w-28 h-40 rounded-2xl overflow-hidden relative cursor-pointer"
          >
            <img
              src={SNEAKER}
              alt="sneaker"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2 right-2 w-6 h-6 bg-surface/90 rounded-md flex items-center justify-center shadow-sm z-10">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            </span>
            {/* A scrim over a PHOTO, so it must darken in both themes —
                `bg-gray-900` flips to near-white in dark and washed the tile
                out on hover instead of shading it. */}
            <div className="absolute inset-0 bg-black/30 translate-y-full group-hover/tile:translate-y-0 transition-transform duration-300" />
          </button>
        ))}
      </ScrollRow>

      {editorOpen && files.length > 0 && (
        <BackgroundRemoverModal
          files={files.map((f) => f.file)}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
