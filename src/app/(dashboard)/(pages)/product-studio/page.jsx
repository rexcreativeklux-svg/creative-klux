"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Image,
  Scissors,
  User,
  Package,
  Shirt,
  Sparkles,
  LayoutGrid,
  Video,
  Zap,
  Grid2x2,
  ChevronRight,
  Layers,
  ShoppingBag,
  LayoutTemplate,
} from "lucide-react";
import { motion } from "framer-motion";
import VirtualModelModal from "@/app/(components)/product-studio/VirtualModelModal";
import ProductStagingModal from "@/app/(components)/product-studio/ProductStagingModal";
import VideoGeneratorModal from "@/app/(components)/product-studio/VideoGeneratorModal";
import BackgroundRemoverModal from "@/app/(components)/product-studio/BackgroundRemoverModal";
import GhostMannequinModal from "@/app/(components)/product-studio/GhostMannequinModal";
import OnDeviceToolModal from "@/app/(components)/product-studio/OnDeviceToolModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import {
  ON_DEVICE_TOOLS,
  ON_DEVICE_TOOL_IDS,
} from "@/app/(components)/product-studio/onDeviceToolConfigs";

// Product Staging now has its own dedicated modal (ProductStagingModal) with the
// gallery picker + structured Generate payload, matching Virtual Model. Beautifier
// / Ghost Mannequin / Flat Lay run on-device via OnDeviceToolModal (ON_DEVICE_TOOL_IDS).

// const tools = [
//     { id: 'start',      label: 'Start from a photo',    Icon: Image,      primary: true },
//     { id: 'bgremove',   label: 'Background Remover',     Icon: Scissors },
//        { id: 'batch',      label: 'Batch',                  Icon: Layers },
//     { id: 'virtual',    label: 'Virtual Model',          Icon: User },
//     { id: 'staging',    label: 'Product Staging',        Icon: Package },
//     { id: 'mannequin',  label: 'Ghost Mannequin',        Icon: Shirt },
//     { id: 'beautifier', label: 'Product Beautifier',     Icon: Sparkles },
//     { id: 'flatlay',    label: 'Flat lay',               Icon: LayoutGrid },
//     { id: 'video',      label: 'Video Generator',        Icon: Video,      },

//     // { id: 'all',        label: 'See all tools...',       Icon: Grid2x2 },
// ];

const tools = [
  {
    id: "start",
    label: "Edit a photo",
    Icon: Image,
    primary: true,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "bgremove",
    label: "Background Remover",
    Icon: Scissors,
    color: "bg-red-100 text-red-600",
  },
  {
    id: "batch",
    label: "Batch",
    Icon: Layers,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "virtual",
    label: "Virtual Model",
    Icon: User,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "staging",
    label: "Product Staging",
    Icon: Package,
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "mannequin",
    label: "Ghost Mannequin",
    Icon: Shirt,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "beautifier",
    label: "Product Beautifier",
    Icon: Sparkles,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: "flatlay",
    label: "Flat lay",
    Icon: LayoutGrid,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    id: "video",
    label: "Video Generator",
    Icon: Video,
    color: "bg-indigo-100 text-indigo-600",
  },
  // {
  //     id: 'all',
  //     label: 'See all tools...',
  //     Icon: Grid2x2,
  //     color: 'bg-gray-100 text-gray-600'
  // },
];

const getStarted = [
  {
    label: "Remove a background",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  },
  {
    label: "Generate AI backgrounds",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
  },
  {
    label: "Edit hundreds of images at once",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  },
  {
    label: "Retouch an image",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
  },
];

const classics = [
  { label: "White", bg: "bg-surface border border-gray-200" },
  { label: "Black", bg: "bg-black", active: true },
  {
    label: "Transparent",
    bg: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%3E%3Crect%20width%3D%225%22%20height%3D%225%22%20fill%3D%22%23ccc%22/%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%225%22%20height%3D%225%22%20fill%3D%22%23ccc%22/%3E%3C/svg%3E")]',
  },
  { label: "Original Image", bg: "bg-[#f5f0e8]" },
];

const studioColors = [
  "#f5f0e0",
  "#ede8d8",
  "#e0dbd0",
  "#f0ede0",
  "#f5e8e0",
  "#e8f0e0",
  "#e0eef5",
  "#f5e0ed",
];

// SVG product placeholder used inside classic & studio swatches
function ProductIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 30 Q10 22 20 20 Q30 18 32 30"
        stroke="#9ca3af"
        strokeWidth="1.5"
        fill="none"
      />
      <ellipse cx="20" cy="30" rx="12" ry="3" fill="#e5e7eb" />
      <rect x="15" y="14" width="10" height="14" rx="5" fill="#d1d5db" />
      <rect x="13" y="18" width="14" height="8" rx="2" fill="#e5e7eb" />
    </svg>
  );
}

export default function ProductPhotos() {
  const [search, setSearch] = useState("");
  const [addImagesOpen, setAddImagesOpen] = useState(false); // Photoroom-style picker (the "Edit a photo" flow)
  const router = useRouter();
  const [virtualModelOpen, setVirtualModelOpen] = useState(false);
  const [stagingOpen, setStagingOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoInitialImage, setVideoInitialImage] = useState(null); // preselect (from a result's "Generate video")
  const [bgRemoverOpen, setBgRemoverOpen] = useState(false);
  const [mannequinOpen, setMannequinOpen] = useState(false); // API-only Ghost Mannequin modal
  const [onDeviceToolId, setOnDeviceToolId] = useState(null); // on-device modal (beautifier/flatlay)

  // The "Edit a photo" flow opens the Photoroom-style Add images picker first;
  // picking an image there navigates to /edit_a_photo with it preloaded.
  const openAddImages = () => setAddImagesOpen(true);

  // Central tool router — used by the tool grid AND the in-modal tool switcher.
  // `opts.initialImageUrl` lets a result's "Generate video" preselect that image
  // in the Video Generator (see VirtualModel/Staging result menus).
  const openTool = (id, opts = {}) => {
    if (id === "virtual") {
      setVirtualModelOpen(true);
      return;
    }
    if (id === "staging") {
      setStagingOpen(true);
      return;
    }
    if (id === "video") {
      setVideoInitialImage(opts.initialImageUrl || null);
      setVideoOpen(true);
      return;
    }
    if (id === "bgremove") {
      setBgRemoverOpen(true);
      return;
    }
    if (id === "mannequin") {
      setMannequinOpen(true);
      return;
    }
    if (id === "batch") {
      router.push("/product-studio/batch");
      return;
    }
    if (id === "all") {
      toast("All available tools are shown above.");
      return;
    }
    if (ON_DEVICE_TOOL_IDS.includes(id)) {
      setOnDeviceToolId(id);
      return;
    }
    openAddImages();
  };

  // Mount-time URL handlers (both strip their params once handled):
  //  • ?resume=<toolId> — re-opens an on-device tool after a login redirect so
  //    its stashed pending save can complete (OnDeviceToolModal + pendingSave.js).
  //  • ?tool=video&image=<url> — opens the Video Generator with that image
  //    preselected, used by Magic Studio's cross-page "Generate video" action.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resume = params.get("resume");
    const tool = params.get("tool");
    const image = params.get("image");

    if (resume && ON_DEVICE_TOOL_IDS.includes(resume)) {
      const id = requestAnimationFrame(() => {
        console.log(`🔖 [product-studio] resuming ${resume} after login`);
        setOnDeviceToolId(resume);
        router.replace("/product-studio", { scroll: false });
      });
      return () => cancelAnimationFrame(id);
    }

    if (tool === "video") {
      const id = requestAnimationFrame(() => {
        console.log(
          `🎬 [product-studio] opening Video Generator${image ? " with a preselected image" : ""}`,
        );
        setVideoInitialImage(image || null);
        setVideoOpen(true);
        router.replace("/product-studio", { scroll: false });
      });
      return () => cancelAnimationFrame(id);
    }

    return undefined;
    // Mount-only: reads the URL the page landed with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search filtering — matches tools and getStarted items
  const q = search.toLowerCase().trim();
  const filteredTools = q
    ? tools.filter((t) => t.label.toLowerCase().includes(q))
    : tools;
  const filteredGetStarted = q
    ? getStarted.filter((g) => g.label.toLowerCase().includes(q))
    : getStarted;
  const filteredClassics = q
    ? classics.filter((c) => c.label.toLowerCase().includes(q))
    : classics;
  const filteredStudio = q ? [] : studioColors; // studio has no labels to match

  return (
    <div>
      {virtualModelOpen && (
        <VirtualModelModal
          onClose={() => setVirtualModelOpen(false)}
          onSwitchTool={(id, opts) => {
            setVirtualModelOpen(false);
            openTool(id, opts);
          }}
        />
      )}
      {stagingOpen && (
        <ProductStagingModal
          onClose={() => setStagingOpen(false)}
          onSwitchTool={(id, opts) => {
            setStagingOpen(false);
            openTool(id, opts);
          }}
        />
      )}
      {onDeviceToolId && ON_DEVICE_TOOLS[onDeviceToolId] && (
        <OnDeviceToolModal
          // Key by tool id so switching tools remounts the modal fresh. Each tool
          // uses a DIFFERENT engine hook (different internal hook count), so a plain
          // re-render would break the Rules of Hooks — remounting resets them.
          key={onDeviceToolId}
          config={ON_DEVICE_TOOLS[onDeviceToolId]}
          onClose={() => setOnDeviceToolId(null)}
          onSwitchTool={(id, opts) => {
            setOnDeviceToolId(null);
            openTool(id, opts);
          }}
        />
      )}
      {videoOpen && (
        <VideoGeneratorModal
          initialImageUrl={videoInitialImage}
          onClose={() => {
            setVideoOpen(false);
            setVideoInitialImage(null);
          }}
          onSwitchTool={(id, opts) => {
            setVideoOpen(false);
            setVideoInitialImage(null);
            openTool(id, opts);
          }}
        />
      )}
      {bgRemoverOpen && (
        <BackgroundRemoverModal onClose={() => setBgRemoverOpen(false)} />
      )}
      {mannequinOpen && (
        <GhostMannequinModal
          onClose={() => setMannequinOpen(false)}
          onSwitchTool={(id, opts) => {
            setMannequinOpen(false);
            openTool(id, opts);
          }}
        />
      )}
      <MediaPickerModal
        isOpen={addImagesOpen}
        onClose={() => setAddImagesOpen(false)}
        onCancel={() => setAddImagesOpen(false)}
        maxSelectable={1}
        initialTab="library"
        onApply={(images) => {
          setAddImagesOpen(false);
          const first = images?.[0];
          const url = first?.large || first?.src;
          if (!url) return;
          router.push(
            `/edit_a_photo?mode=start&image=${encodeURIComponent(url)}`,
          );
        }}
        comingSoonTabs={[
          { id: "shopify", label: "Shopify products", icon: ShoppingBag },
          // { id: "designs", label: "Designs", icon: LayoutTemplate },
        ]}
      />


      {/* {editorOpen && (
        <PhotoEditor mode={editorMode} onClose={() => setEditorOpen(false)} />
      )} */}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Studio</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a template"
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-400 w-64 bg-gray-50 cursor-text"
          />
        </div>
      </div>

      <div className="py-6">
        {/* ── Tool Grid ── */}
        {filteredTools.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mb-8">
            {filteredTools.map((tool) => {
              const { Icon } = tool;
              return (
                <button
                  key={tool.id}
                  onClick={() => openTool(tool.id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                    tool.primary
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-surface text-gray-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tool.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-left leading-tight flex-1">
                    {tool.label}
                  </span>
                  {tool.badge && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                      {tool.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Get Started ── */}
        {filteredGetStarted.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Get started
              </h2>
              <button
                onClick={() => setSearch("")}
                className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-10">
              {filteredGetStarted.map((item, i) => (
                <motion.button
                  key={i}
                  onClick={openAddImages}
                  whileHover={{ scale: 1.02 }}
                  className="relative rounded-2xl overflow-hidden aspect-4/3 group cursor-pointer"
                >
                  <img
                    src={item.img}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 flex items-end justify-between w-full">
                    <p className="text-white text-sm font-semibold leading-tight text-left">
                      {item.label}
                    </p>
                    <ChevronRight className="w-4 h-4 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* ── Classics ── */}
        {filteredClassics.length > 0 && !q && (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Classics
            </h2>
            <div className="flex gap-3 mb-8">
              {filteredClassics.map((c, i) => (
                <button
                  key={i}
                  onClick={openAddImages}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-20 h-20 rounded-xl border-2 transition-all hover:border-blue-400 flex items-center justify-center overflow-hidden ${
                      c.active ? "border-blue-500" : "border-gray-200"
                    } ${c.bg}`}
                  >
                    <ProductIcon className="w-10 h-10" />
                  </div>
                  <span className="text-xs text-gray-600">{c.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Studio ── */}
        {!q && filteredStudio.length > 0 && (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Studio
            </h2>
            <div className="flex gap-2">
              {filteredStudio.map((color, i) => (
                <button
                  key={i}
                  onClick={openAddImages}
                  className="w-20 h-20 rounded-xl border border-gray-200 flex items-center justify-center hover:border-blue-400 transition-all cursor-pointer"
                  style={{ backgroundColor: color }}
                >
                  <ProductIcon className="w-10 h-10" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Empty search state ── */}
        {q && filteredTools.length === 0 && filteredGetStarted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Search className="w-8 h-8" />
            <p className="text-sm">No results for &quot;{search}&quot;</p>
            <button
              onClick={() => setSearch("")}
              className="text-sm text-blue-500 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
