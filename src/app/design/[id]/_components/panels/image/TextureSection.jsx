"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { commitBlobToElement } from "./persistBlob";
import { loadHtmlImage } from "./loadHtmlImage";
import { TEXTURE_MAX_EDGE, TEXTURE_PRESETS, textureCanvas } from "./textureCanvas";
import usePreviewBakes from "./usePreviewBakes";
import { PresetTile, SectionHeader, Slider } from "./imageEditControls";
import { ToolStatus } from "./toolControls";

/**
 * TextureSection — the Quick tools "Texture" tile's full view: per-pixel look
 * effects (Posterize, Line, Comic, Ink, Riso…) a CSS filter can't express.
 *
 * One-shot bake into `src`, the same shape Enhance uses — not a live,
 * re-adjustable property resolved at render time (see textureCanvas.js for
 * why this editor doesn't keep Texture as a persistent field the way
 * design-editor does).
 *
 * `preTextureSrc` is its own checkpoint, separate from `originalSrc` — that
 * field already means "the photo before background removal" to BG Remover,
 * Magic Grab and Bg Scene, so texturizing a cut-out must not silently step on
 * it and revert the removal too. Switching presets or dragging Strength always
 * re-bakes from `preTextureSrc` (whatever was on screen right before Texture
 * was first applied), never compounding onto an already-textured result.
 *
 * Props: { element, editor }
 */
export default function TextureSection({ element, editor }) {
  const { uploadMedia } = useAuth();
  const [status, setStatus] = useState("idle");
  const [amount, setAmount] = useState(element.textureAmount ?? 100);
  const runningRef = useRef(false);
  const commitTimer = useRef(null);

  const baseSrc = element.preTextureSrc || element.src;
  const active = element.texture || null;

  const previews = usePreviewBakes(baseSrc, TEXTURE_PRESETS, (base, preset) =>
    textureCanvas(base, preset.id, 100),
  );

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const bake = async (presetId, pct) => {
    if (!baseSrc || runningRef.current) return;
    runningRef.current = true;
    setStatus("running");
    try {
      const img = await loadHtmlImage(baseSrc);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const scale = Math.min(1, TEXTURE_MAX_EDGE / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);

      const out = textureCanvas(canvas, presetId, pct);
      const blob = await new Promise((res) => out.toBlob(res, "image/png"));
      if (!blob) return;

      await commitBlobToElement(editor, element.id, blob, uploadMedia, "texture.png", {
        texture: presetId,
        textureAmount: pct,
        preTextureSrc: baseSrc,
      });
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  };

  const clearTexture = () => {
    editor.updateElement(
      element.id,
      { src: baseSrc, texture: null, textureAmount: null, preTextureSrc: null },
      { record: true },
    );
  };

  const select = (presetId) => {
    // Tapping the active preset again turns it off — the same on/off gesture
    // as every other toggleable quick tool.
    if (active === presetId) {
      clearTexture();
      return;
    }
    const pct = amount || 100;
    setAmount(pct);
    bake(presetId, pct);
  };

  const onAmount = (v) => {
    setAmount(v);
    if (!active) return;
    clearTimeout(commitTimer.current);
    // Debounced: the bake re-reads and re-processes the whole image, so
    // committing on every slider tick would re-upload a dozen times per drag.
    commitTimer.current = setTimeout(() => bake(active, v), 200);
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Texture"
        action={
          active && (
            <button
              type="button"
              onClick={clearTexture}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Reset
            </button>
          )
        }
      />

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Every tile is this image in that look, rendered on your device. Tap one
        to apply it — tap again to remove it.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {TEXTURE_PRESETS.map((preset) => (
          <PresetTile
            key={preset.id}
            label={preset.label}
            src={previews[preset.id] || null}
            active={active === preset.id}
            onClick={() => select(preset.id)}
          />
        ))}
      </div>

      {active && (
        <Slider label="Strength" min={0} max={100} unit="%" value={amount} onChange={onAmount} />
      )}

      <ToolStatus status={status} runningLabel="Applying texture…" />
    </div>
  );
}
