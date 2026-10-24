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
  Blend,
  Megaphone,
  Stamp,
} from "lucide-react";
import { motion } from "framer-motion";
import VirtualModelModal from "@/app/(components)/product-studio/VirtualModelModal";
import ProductStagingModal from "@/app/(components)/product-studio/ProductStagingModal";
import ProductVideoModal from "@/app/(components)/product-studio/ProductVideoModal";
import BackgroundRemoverModal from "@/app/(components)/product-studio/BackgroundRemoverModal";
import GhostMannequinModal from "@/app/(components)/product-studio/GhostMannequinModal";
import OnDeviceToolModal from "@/app/(components)/product-studio/OnDeviceToolModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import {
  ON_DEVICE_TOOLS,
  ON_DEVICE_TOOL_IDS,
} from "@/app/(components)/product-studio/onDeviceToolConfigs";
import PromptToolModal from "@/app/(components)/product-studio/PromptToolModal";
import {
  PROMPT_TOOLS,
  PROMPT_TOOL_IDS,
} from "@/app/(components)/product-studio/promptToolConfigs";
import { stockQueryForTool } from "@/app/(components)/product-studio/constants";
import { TOOL_PRESET_SHELVES } from "@/app/(components)/product-studio/toolPresets";
import ToolPresetRow from "@/app/(components)/product-studio/ToolPresetRow";
import TemplateBrowserModal from "@/app/(components)/product-studio/TemplateBrowserModal";
import { PresetStrip } from "./PresetStrip";
import { getStarted } from "./presetSections";
import { STUDIO_SECTIONS, presetHref } from "./studioPresets";
import StudioPresetTile, { useStudioPresetFonts } from "./StudioPresetTile";
import CustomSizeDialog from "./CustomSizeDialog";
import StylePickerModal from "./StylePickerModal";

/** Rails whose tiles carry a name under them, as on Photoroom. */
const LABELLED_SECTIONS = new Set([
  "classic",
  "photo-classics",
  "marketplaces",
  "social",
  "blank",
]);

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
    // Routing id stays `bgremove` (openTool, the batch page and the in-modal
    // switcher all key off it); only the label is user-facing.
    id: "bgremove",
    label: "Instant Backdrop",
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
  // Prompt-driven tools — all three share PromptToolModal (promptToolConfigs).
  {
    id: "reshaping",
    label: "Reshaping",
    Icon: Blend,
    color: "bg-teal-100 text-teal-600",
  },
  {
    id: "poster",
    label: "Product Poster",
    Icon: Megaphone,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "pod",
    label: "AI POD",
    Icon: Stamp,
    color: "bg-fuchsia-100 text-fuchsia-600",
  },
  // Product Video sits LAST on purpose — it is the only tool here that outputs
  // motion, so it closes the grid instead of interrupting the photo tools. Keep
  // it last in TOOL_LIST (the in-modal switcher) too, or the two disagree.
  {
    id: "product_video",
    label: "Product Video",
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

export default function ProductPhotos() {
  const [search, setSearch] = useState("");
  const [addImagesOpen, setAddImagesOpen] = useState(false); // Photoroom-style picker (the "Edit a photo" flow)
  const router = useRouter();
  const [virtualModelOpen, setVirtualModelOpen] = useState(false);
  const [stagingOpen, setStagingOpen] = useState(false);
  const [productVideoOpen, setProductVideoOpen] = useState(false);
  const [productVideoInitialImage, setProductVideoInitialImage] = useState(null); // preselect (from a result's "Generate video")
  const [bgRemoverOpen, setBgRemoverOpen] = useState(false);
  const [mannequinOpen, setMannequinOpen] = useState(false); // API-only Ghost Mannequin modal
  const [onDeviceToolId, setOnDeviceToolId] = useState(null); // on-device modal (beautifier/flatlay)
  const [promptToolId, setPromptToolId] = useState(null); // shared prompt-tool modal (reshaping/poster/pod)
  const [showMorePresets, setShowMorePresets] = useState(false); // "Show more" — appends the rest of the preset rows
  useStudioPresetFonts(); // the Trending / fashion designs' typefaces, for their tiles

  // ── Preset shelves: one per tool, at the foot of the page ──────────────────
  /** Which tool's "See all" catalog is open — an entry of TOOL_PRESET_SHELVES. */
  const [presetBrowserShelf, setPresetBrowserShelf] = useState(null);
  /**
   * The preset the open tool was launched on, and whether to auto-run it —
   * `{ presetId, autoStart }`, or null for a tool opened any other way. Read by
   * every tool modal as `initialPresetId` / `autoStart`.
   */
  const [presetLaunch, setPresetLaunch] = useState(null);
  const launchProps = {
    initialPresetId: presetLaunch?.presetId ?? null,
    autoStart: !!presetLaunch?.autoStart,
  };

  // The "Edit a photo" flow opens the Photoroom-style Add images picker first;
  // picking an image there navigates to /edit_a_photo with it preloaded.
  const openAddImages = () => setAddImagesOpen(true);

  // The preset rows below (Get started / Classics / Studio) skip the picker and
  // drop straight into the editor. Landing on /edit_a_photo with no ?image makes
  // PhotoEditor pop the file chooser on mount, so the click costs one step
  // instead of two — and the library is still reachable from inside the editor.
  const openPhotoEditor = () => router.push("/edit_a_photo?mode=start");

  // A preset tile (studioPresets.js) opens the editor on that preset — a photo
  // tile asks for the photo there, a template opens with its sample product, a
  // size opens an empty canvas. "Custom size" asks for W×H here first.
  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  // The photo picked in Edit a photo, while "Pick a style" is showing it.
  const [stylePickerUrl, setStylePickerUrl] = useState(null);
  const openPreset = (item) => {
    if (item.custom) {
      setCustomSizeOpen(true);
      return;
    }
    router.push(presetHref(item.id));
  };

  // Central tool router — used by the tool grid AND the in-modal tool switcher.
  // `opts.initialImageUrl` lets a result's "Generate video" preselect that image
  // in Product Video (see VirtualModel/Staging result menus). `opts.presetId`
  // (from a preset shelf) opens the tool on that preset, picker up, auto-run on.
  const openTool = (id, opts = {}) => {
    // Every open sets this, so a tool reached any other way — the grid, the
    // in-modal switcher — never inherits the last shelf's preset.
    setPresetLaunch(
      opts.presetId ? { presetId: opts.presetId, autoStart: true } : null,
    );
    if (id === "virtual") {
      setVirtualModelOpen(true);
      return;
    }
    if (id === "staging") {
      setStagingOpen(true);
      return;
    }
    if (id === "product_video") {
      setProductVideoInitialImage(opts.initialImageUrl || null);
      setProductVideoOpen(true);
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
    if (PROMPT_TOOL_IDS.includes(id)) {
      setPromptToolId(id);
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
  //  • ?tool=product_video&image=<url> — opens Product Video with that image
  //    preselected, used by Magic Studio's cross-page "Generate video" action.
  //    The tool's id was `video` before it was renamed, and that spelling is
  //    still accepted: the param can arrive from a bookmark, a shared link or a
  //    chat message written before the rename, and none of those get rewritten.
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

    if (tool === "product_video" || tool === "video") {
      const id = requestAnimationFrame(() => {
        console.log(
          `🎬 [product-studio] opening Product Video${image ? " with a preselected image" : ""}${tool === "video" ? " (legacy ?tool=video link)" : ""}`,
        );
        setProductVideoInitialImage(image || null);
        setProductVideoOpen(true);
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
  // The preset rows are browsing surfaces, not search results — a query hides
  // them outright rather than leaving swatches on screen that ignore it.
  const showPresets = !q;

  return (
    <div>
      {virtualModelOpen && (
        <VirtualModelModal
          {...launchProps}
          onClose={() => setVirtualModelOpen(false)}
          onSwitchTool={(id, opts) => {
            setVirtualModelOpen(false);
            openTool(id, opts);
          }}
        />
      )}
      {stagingOpen && (
        <ProductStagingModal
          {...launchProps}
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
      {promptToolId && PROMPT_TOOLS[promptToolId] && (
        <PromptToolModal
          // Key by tool id so switching between the prompt tools remounts the
          // modal fresh — otherwise the previous tool's uploaded images, prompt
          // and preset selection would survive into the next one.
          key={promptToolId}
          config={PROMPT_TOOLS[promptToolId]}
          {...launchProps}
          onClose={() => setPromptToolId(null)}
          onSwitchTool={(id, opts) => {
            setPromptToolId(null);
            openTool(id, opts);
          }}
        />
      )}
      {productVideoOpen && (
        <ProductVideoModal
          {...launchProps}
          initialImageUrl={productVideoInitialImage}
          onClose={() => {
            setProductVideoOpen(false);
            setProductVideoInitialImage(null);
          }}
          onSwitchTool={(id, opts) => {
            setProductVideoOpen(false);
            setProductVideoInitialImage(null);
            openTool(id, opts);
          }}
        />
      )}
      {bgRemoverOpen && (
        <BackgroundRemoverModal
          {...launchProps}
          onClose={() => setBgRemoverOpen(false)}
        />
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
      {stylePickerUrl && (
        <StylePickerModal
          imageUrl={stylePickerUrl}
          onClose={() => setStylePickerUrl(null)}
          onPlainEditor={() =>
            router.push(`/edit_a_photo?mode=start&image=${encodeURIComponent(stylePickerUrl)}`)
          }
          onPick={(item) =>
            router.push(`${presetHref(item.id)}&image=${encodeURIComponent(stylePickerUrl)}`)
          }
        />
      )}
      {customSizeOpen && (
        <CustomSizeDialog
          onCancel={() => setCustomSizeOpen(false)}
          onCreate={(w, h) => {
            setCustomSizeOpen(false);
            router.push(presetHref(`size-custom-${w}x${h}`));
          }}
        />
      )}

      <MediaPickerModal
        isOpen={addImagesOpen}
        onClose={() => setAddImagesOpen(false)}
        onCancel={() => setAddImagesOpen(false)}
        maxSelectable={1}
        initialTab="library"
        // Opens on My Library, but seed Search too so switching tabs shows
        // product photography rather than the generic brand fallback.
        defaultSearchQuery={stockQueryForTool("start")}
        onApply={(images) => {
          setAddImagesOpen(false);
          const first = images?.[0];
          const url = first?.large || first?.src;
          if (!url) return;
          // Photoroom's Start from a photo: every style, with this photo in it.
          setStylePickerUrl(url);
        }}
        comingSoonTabs={[
          { id: "shopify", label: "Shopify products", icon: ShoppingBag },
          // { id: "designs", label: "Designs", icon: LayoutTemplate },
        ]}
      />


      {/* {editorOpen && (
        <PhotoEditor mode={editorMode} onClose={() => setEditorOpen(false)} />
      )} */}

      {/* ── Header ──
          Stacks below `sm`: a 256px search field beside a heading does not fit
          a 360px screen, and shrinking both to fit makes each unusable. Full
          width on its own row is the better trade. */}
      <div className="flex flex-col gap-stack sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Studio</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a template"
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-400 w-full sm:w-64 bg-gray-50 cursor-text"
          />
        </div>
      </div>

      <div className="py-6">
        {/* ── Tool Grid ── */}
        {/* Container-driven rather than `grid-cols-5`: these tool buttons carry
            a label, so what matters is whether ~190px of text fits, not what the
            window measures. The same grid then works in the narrowed pane
            beside an open sidebar. */}
        {filteredTools.length > 0 && (
          <div className="grid grid-fluid-[230px] gap-2 mb-8">
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
            {/* Image cards with a caption baked into the artwork. The floor is
                ~330px: these are the page's hero entry points and the artwork
                has to read as a preview of the RESULT — much below that the
                shoe/bag/batch grid shrinks into an unreadable thumbnail. */}
            <div className="grid grid-fluid-[330px] gap-4 mb-10">
              {filteredGetStarted.map((item, i) => (
                <motion.button
                  key={i}
                  onClick={openPhotoEditor}
                  whileHover={{ scale: 1.02 }}
                  className="relative rounded-2xl overflow-hidden aspect-5/3 group cursor-pointer"
                >
                  <img
                    src={item.img}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 flex items-end justify-between gap-2 w-full">
                    <p className="text-white text-base font-semibold leading-tight text-left">
                      {item.label}
                    </p>
                    <ChevronRight className="w-5 h-5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* ── Preset rails ──
            Photoroom's home rails, from the catalogue in studioPresets.js — the
            tile is drawn from the same preset the editor applies. Rails marked
            `fold` wait behind "Show more": browsing rows, not tools, so the
            page stays one screen of decisions with the rest a click away. */}
        {showPresets &&
          STUDIO_SECTIONS.filter((section) => showMorePresets || !section.fold).map(
            (section) => (
              <section key={section.id}>
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <PresetStrip className="mb-8">
                  {section.items.map((item) => (
                    <StudioPresetTile
                      key={item.id}
                      preset={{ ...item, mode: section.mode }}
                      showLabel={LABELLED_SECTIONS.has(section.id)}
                      onClick={() => openPreset(item)}
                    />
                  ))}
                </PresetStrip>
              </section>
            ),
          )}

        {/* One-way reveal: the button is spent once the rows are out. Offering
            "Show less" would scroll the page out from under someone who is
            already reading the rows it collapses. */}
        {showPresets && !showMorePresets && (
          <div className="flex justify-center mt-2 mb-4">
            <button
              onClick={() => setShowMorePresets(true)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-surface text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
            >
              Show more
            </button>
          </div>
        )}

        {/* ── Start from a preset ──
            One shelf per tool with a preset catalog — its models, scenes,
            styles or clips (toolPresets.js). A tile opens the tool on that
            preset with the image picker up, and the first photo picked
            generates straight away. Past results live in each tool's own
            History panel, not here.

            ⚠️ HIDDEN WHILE SEARCHING, like the preset rows above: the search
            box filters tools and Get started, and these shelves would sit
            there unfiltered, looking like results that ignored the query. */}
        {showPresets && (
          <div className="mt-4 border-t border-gray-100 pt-8">
            {TOOL_PRESET_SHELVES.map((shelf) => (
              <ToolPresetRow
                key={shelf.id}
                shelf={shelf}
                onPick={(tile) => openTool(shelf.id, { presetId: tile.id })}
                onSeeAll={() => setPresetBrowserShelf(shelf)}
                onOpenTool={() => openTool(shelf.id)}
              />
            ))}
          </div>
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

      {/* A shelf's "See all" — the tool's whole catalog, by category. Picking
          closes the browser (TemplateBrowserModal does that) and launches the
          tool on the preset, exactly like a shelf tile. */}
      {presetBrowserShelf && (
        <TemplateBrowserModal
          title={presetBrowserShelf.name}
          categories={presetBrowserShelf.categories}
          staticItems={presetBrowserShelf.tiles}
          objectPosition={presetBrowserShelf.objectPosition}
          applyLabel="Use with my photo"
          onSelect={(tile) =>
            openTool(presetBrowserShelf.id, { presetId: tile.id })
          }
          onClose={() => setPresetBrowserShelf(null)}
        />
      )}
    </div>
  );
}
