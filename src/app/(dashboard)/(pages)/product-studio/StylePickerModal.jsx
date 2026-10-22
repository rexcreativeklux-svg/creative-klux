"use client";

// "Pick a style" — Photoroom's Start-from-a-photo screen. The photo picked in
// Edit a photo is cut out ONCE, here, and every rail is shown again with that
// product in place of the sample, so each tile is a preview of the user's own
// result. Picking one opens the editor on that preset with the photo
// (`?preset=…&image=…`), where it goes into the slot / gets the look.

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { PresetStrip } from "./PresetStrip";
import StudioPresetTile from "./StudioPresetTile";
import { STUDIO_SECTIONS } from "./studioPresets";
import { productBounds, cropToBounds } from "./trimCutout";

const LABELLED = new Set(["classic", "photo-classics", "marketplaces", "social", "blank"]);

/** Same-origin URL for a library image, so its pixels can be read. */
const proxied = (url) =>
  /^https?:/i.test(url) ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;

/**
 * @param {object} props
 * @param {string} props.imageUrl the picked photo
 * @param {(item: object) => void} props.onPick a style was chosen
 * @param {() => void} props.onPlainEditor open the photo with no style
 * @param {() => void} props.onClose
 */
export default function StylePickerModal({ imageUrl, onPick, onPlainEditor, onClose }) {
  // {status:"cutting", pct} → {status:"ready", photo} | {status:"error"}
  const [state, setState] = useState({ status: "cutting", pct: 0 });

  useEffect(() => {
    let alive = true;
    const urls = [];
    (async () => {
      try {
        // The worker is NOT disposed here: it is shared, a second run can still
        // be using it (React's dev double-mount does exactly that), and the
        // editor this leads to needs the same model straight away. The editor
        // frees it when it closes.
        const { removeBackground } = await import(
          "@/(lib)/ai-engine/tasks/removeBackground"
        );
        const { blob } = await removeBackground(proxied(imageUrl), {
          onProgress: ({ pct }) =>
            alive && setState({ status: "cutting", pct: Math.round(pct || 0) }),
        });
        const cut = await createImageBitmap(blob);
        const b = productBounds(cut);
        const cutout = b ? await cropToBounds(cut, b) : URL.createObjectURL(blob);
        urls.push(cutout);
        if (alive) setState({ status: "ready", photo: { original: imageUrl, cutout } });
      } catch (err) {
        console.error("❌ [style picker] cutout failed:", err);
        if (alive) setState({ status: "error" });
      }
    })();
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imageUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Pick a style</h3>
            <p className="text-xs text-gray-500">Every style, with your photo in it</p>
          </div>
          <button
            type="button"
            onClick={onPlainEditor}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700 cursor-pointer"
          >
            Open in editor
          </button>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {state.status === "cutting" && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Removing the background… {state.pct}%</p>
            </div>
          )}
          {state.status === "error" && (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-600">We couldn&apos;t cut out that photo.</p>
              <button
                type="button"
                onClick={onPlainEditor}
                className="mt-3 text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Open it in the editor instead
              </button>
            </div>
          )}
          {state.status === "ready" &&
            STUDIO_SECTIONS.map((section) => (
              <section key={section.id}>
                <h2 className="mb-3 text-sm font-semibold text-gray-900">{section.title}</h2>
                <PresetStrip className="mb-6">
                  {section.items
                    .filter((item) => !item.custom)
                    .map((item) => (
                      <StudioPresetTile
                        key={item.id}
                        preset={{ ...item, mode: section.mode }}
                        photo={state.photo}
                        showLabel={LABELLED.has(section.id)}
                        onClick={() => onPick(item)}
                      />
                    ))}
                </PresetStrip>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}
