"use client";

import React, { useState } from "react";
import {
  Crop,
  Droplet,
  Eraser,
  FlipHorizontal,
  FlipVertical,
  Grid2x2,
  Hand,
  ImagePlus,
  ImageUp,
  Maximize,
  MousePointer,
  PenLine,
  Rotate3d,
  RotateCcw,
  RotateCw,
  Scan,
  ScanFace,
  Sparkles,
  SquareDashed,
  Squircle,
  Type,
  Undo2,
  Wand2,
} from "lucide-react";
import { SectionHeader } from "./imageEditControls";
import {
  borderPatch,
  canRestore,
  cycleRoundingPatch,
  fitMode,
  fitModePatch,
  hasBorder,
  hasLook,
  isRounded,
  replaceSrcPatch,
  resetLookPatch,
  restorePatch,
  rotatePatch,
} from "./imageQuickActions";

/**
 * ImageQuickTools — the one-tap tools at the top of the "Edit image" panel.
 *
 * Three kinds of tile live in one grid, which is the point: the user does not
 * care which machinery a tool needs, only what it does to their picture.
 *
 *   • a property the renderers already read → patched here and done
 *     (flip, rotate, round, fit, border, reset, restore, replace)
 *   • a canvas overlay → handed to DesignEditor through `imageActions`
 *     (crop, eraser), which owns the overlay state
 *   • a model or a panel → also `imageActions` (background removal, blur,
 *     perspective)
 *
 * The property patches live in imageQuickActions.js beside this file, so this
 * stays a list of labels and handlers.
 *
 * Tiles collapse to two rows with a "See more", the same shape as every other
 * section in this panel — six covers the tools reached for most often without
 * the panel becoming a wall of thumbnails.
 *
 * A fourth kind needs a whole column of its own rather than one tap — a model
 * that shows a preview, a status strip or a result to act on (Enhance, Magic
 * Grab, Auto-select, Grab Text, Bg Scene). Those tiles call `onOpenTool` with
 * the tool's id; EditImagePanel is what turns that into a drilled-in view.
 *
 * Props:
 *   element      — the selected image element
 *   patch        — (patch) => void, writes to that element (records undo)
 *   imageActions — { onRemoveBg, onStartErase, onStartCrop, onBlur,
 *                    onPerspective }, each taking the element id
 *   onOpenTool   — (toolId) => void, opens a full-column tool view
 */

// Tile artwork, shared with the photo editor so the same tool looks the same in
// both. `img` is the file's basename under this folder — which is not always
// the tool's own key, so it's spelled out per tool rather than derived.
//
// The three tools with no artwork (Enhance, Replace, Restore — none of them
// have a tile upstream either) fall back to a gradient square carrying their
// lucide icon, rather than a bare icon on grey: sat next to real artwork, a
// flat grey tile reads as a picture that failed to load.
const QUICK_TOOL_IMG = "/images/quick-tools";

const COLLAPSED_COUNT = 6;

export default function ImageQuickTools({ element, patch, imageActions, onOpenTool }) {
  const [expanded, setExpanded] = useState(false);

  if (!element || !imageActions) return null;

  const id = element.id;

  const replaceImage = (e) => {
    const file = e.target.files?.[0];
    // Cleared before the async read so picking the same file twice still fires.
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => patch(replaceSrcPatch(event.target.result));
    reader.readAsDataURL(file);
  };

  const fit = fitMode(element);

  const tools = [
    {
      key: "bg",
      label: "BG Remover",
      icon: Sparkles,
      img: "backgroundRemover",
      onClick: () => imageActions.onRemoveBg?.(id),
    },
    {
      key: "eraser",
      label: "Eraser",
      icon: Eraser,
      img: "magicEraser",
      onClick: () => imageActions.onStartErase?.(id),
    },
    {
      key: "crop",
      label: "Crop",
      icon: Crop,
      img: "crop",
      onClick: () => imageActions.onStartCrop?.(id),
    },
    // Model-backed tools, each opening its own full-column view because each
    // needs a preview, a status strip or a result to act on. High enough to
    // make the collapsed six: Enhance is the tool people come looking for when
    // an image is too small for the space they've put it in.
    {
      key: "enhance",
      label: "Enhance",
      icon: Wand2,
      tone: "from-violet-400 to-fuchsia-600",
      active: Boolean(element.enhanced),
      onClick: () => onOpenTool?.("enhance"),
    },
    {
      key: "magicGrab",
      label: "Magic Grab",
      icon: Hand,
      img: "magicGrab",
      onClick: () => onOpenTool?.("magicGrab"),
    },
    {
      key: "autoSelect",
      label: "Auto-select",
      icon: MousePointer,
      img: "autoSelect",
      onClick: () => onOpenTool?.("autoSelect"),
    },
    {
      key: "blur",
      label: "Blur",
      icon: Droplet,
      img: "blur",
      active: (element.adjust?.blur || 0) > 0,
      onClick: () => imageActions.onBlur?.(id),
    },
    {
      key: "perspective",
      label: "Perspective",
      icon: Rotate3d,
      img: "perspective",
      active: Boolean(element.perspective?.h || element.perspective?.v),
      onClick: () => imageActions.onPerspective?.(id),
    },
    {
      key: "grabText",
      label: "Grab Text",
      icon: Type,
      // "grapText", not "grabText" — the artwork ships misspelled upstream and
      // the file is copied across as-is. Correcting the string here would just
      // 404 the tile.
      img: "grapText",
      onClick: () => onOpenTool?.("grabText"),
    },
    {
      key: "bgScene",
      label: "Bg Scene",
      icon: ImagePlus,
      img: "backgroundGenerator",
      active: Boolean(element.backgroundScene),
      onClick: () => onOpenTool?.("bgScene"),
    },
    {
      key: "sketchify",
      label: "Sketchify",
      icon: PenLine,
      img: "sketchify",
      onClick: () => onOpenTool?.("sketchify"),
    },
    {
      key: "faceCutout",
      label: "Face Cutout",
      icon: ScanFace,
      img: "faceCutout",
      onClick: () => onOpenTool?.("faceCutout"),
    },
    {
      key: "texture",
      label: "Texture",
      icon: Grid2x2,
      img: "texture",
      active: Boolean(element.texture),
      onClick: () => onOpenTool?.("texture"),
    },
    {
      key: "crop-round",
      label: "Round",
      icon: Squircle,
      img: "round",
      active: isRounded(element),
      onClick: () => {
        const p = cycleRoundingPatch(element);
        if (p) patch(p);
      },
    },
    {
      key: "flip-h",
      label: "Flip H",
      icon: FlipHorizontal,
      img: "flipH",
      active: Boolean(element.flipH),
      onClick: () => patch({ flipH: !element.flipH }),
    },
    {
      key: "flip-v",
      label: "Flip V",
      icon: FlipVertical,
      img: "flipV",
      active: Boolean(element.flipV),
      onClick: () => patch({ flipV: !element.flipV }),
    },
    {
      key: "rotate",
      label: "Rotate",
      icon: RotateCw,
      img: "rotate",
      onClick: () => patch(rotatePatch(element)),
    },
    {
      // Labelled by what the tap DOES, not by the current state — "Fit" while
      // the image is filling its box is the tap that makes it fit.
      key: "fit",
      label: fit === "cover" ? "Fit" : "Fill",
      icon: fit === "cover" ? Scan : Maximize,
      img: "fit",
      onClick: () => patch(fitModePatch(element)),
    },
    {
      key: "border",
      label: "Border",
      icon: SquareDashed,
      img: "border",
      active: hasBorder(element),
      onClick: () => patch(borderPatch(element)),
    },
    {
      // The only tile that isn't a button: a file picker is a <label> wrapping
      // its own <input>, which is both better HTML and one less ref.
      key: "replace",
      label: "Replace",
      icon: ImageUp,
      tone: "from-violet-400 to-purple-500",
      pick: true,
    },
    {
      key: "reset",
      label: "Reset",
      icon: Undo2,
      img: "reset",
      disabled: !hasLook(element),
      onClick: () => patch(resetLookPatch()),
    },
    // Only worth a tile once there is something to go back to.
    ...(canRestore(element)
      ? [
          {
            key: "restore",
            label: "Restore",
            icon: RotateCcw,
            tone: "from-slate-400 to-slate-600",
            onClick: () => patch(restorePatch(element)),
          },
        ]
      : []),
  ];

  const shown = expanded ? tools : tools.slice(0, COLLAPSED_COUNT);

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader
        title="Quick tools"
        expanded={expanded}
        onToggle={
          tools.length > COLLAPSED_COUNT ? () => setExpanded((v) => !v) : undefined
        }
      />

      <div className="grid grid-cols-3 gap-2">
        {shown.map(({ key, label, icon: Icon, img, tone, onClick, disabled, active, pick }) => {
          const face = (
            <>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${QUICK_TOOL_IMG}/${img}.webp`}
                  alt=""
                  draggable={false}
                  className="w-full aspect-square object-cover rounded-md"
                />
              ) : (
                <span
                  className={`w-full aspect-square rounded-md flex items-center justify-center bg-linear-to-br ${tone} text-white`}
                >
                  <Icon className="w-5 h-5" />
                </span>
              )}
              <span className="truncate w-full text-center">{label}</span>
            </>
          );

          const tile = `flex flex-col items-center gap-1 p-1 rounded-lg border text-[10px] leading-tight font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            active
              ? "border-blue-500 ring-1 ring-blue-400 text-blue-600"
              : "border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50/40"
          }`;

          return pick ? (
            <label key={key} title={label} className={tile}>
              {face}
              <input
                type="file"
                accept="image/*"
                onChange={replaceImage}
                className="hidden"
              />
            </label>
          ) : (
            <button
              key={key}
              type="button"
              onClick={onClick}
              disabled={disabled}
              title={label}
              aria-pressed={Boolean(active)}
              className={tile}
            >
              {face}
            </button>
          );
        })}
      </div>
    </div>
  );
}
