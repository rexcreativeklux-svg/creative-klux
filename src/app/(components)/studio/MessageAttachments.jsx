"use client";

// app/(components)/studio/MessageAttachments.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The files carried by a chat message, rendered directly ABOVE the message text.
//
// Two layouts, picked by count so a single file never looks like a stray thumb:
//   1 file   → one wide 16:10 preview, the full width of the bubble
//   2+ files → square tiles sized so EXACTLY FOUR fit the bubble width; a fifth
//              and beyond overflow into a horizontal scroll, with a fade on the
//              right edge as the affordance that there's more.
//
// The four-up sizing is done in CSS rather than JS — `grid-auto-flow: column`
// with `grid-auto-columns: calc((100% - 3*gap) / 4)` makes every tile a quarter
// of the available width regardless of how many there are, so the strip adapts
// to the bubble instead of assuming a pixel width.
//
// Images and videos open in the app's shared <Lightbox> (arrow-key navigation,
// counter, download, ESC to close). Audio and documents aren't viewable there,
// so those tiles open the file in a new tab instead.

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Music, Play, Expand } from "lucide-react";
import Lightbox from "@/app/(components)/Lightbox";
import { classifyMediaType } from "@/app/(components)/gallery/mediaTypes";
import { downloadImageUrl } from "@/app/(components)/product-studio/saveToGallery";

/** Thumbnail edge length, and the gap between them. Four fit before scrolling. */
const TILE = 56;
const GAP = 6;

/** Icon + tint for the tiles that have no visual preview of their own. */
const NON_VISUAL = {
  audio: { Icon: Music, label: "Audio" },
  document: { Icon: FileText, label: "Document" },
};

/** Derive a readable file name from a URL when the message didn't carry one. */
function nameFromUrl(url) {
  try {
    const path = String(url).split("?")[0].split("#")[0];
    return decodeURIComponent(path.substring(path.lastIndexOf("/") + 1)) || "File";
  } catch {
    return "File";
  }
}

/**
 * Normalise whatever the message carries into one tile shape. Attachments may
 * arrive as bare URL strings (the AI Select hand-off puts only URLs on the query
 * string) or as objects with a name/type already known (composed in the chat).
 *
 * @param {(string|{url?: string, name?: string, type?: string})[]} attachments
 * @returns {{url: string, name: string, type: string}[]}
 */
function normalise(attachments) {
  return (attachments || [])
    .map((entry) => {
      const url = typeof entry === "string" ? entry : entry?.url;
      if (!url) return null;
      const name = (typeof entry === "object" && entry?.name) || nameFromUrl(url);
      // Trust an explicit type; otherwise sniff the extension off the URL.
      const type =
        (typeof entry === "object" && entry?.type) || classifyMediaType({ src: url });
      return { url, name, type };
    })
    .filter(Boolean);
}

/**
 * @param {object} props
 * @param {(string|object)[]} props.urls Attachment URLs lifted out of the
 *   message string by splitMessageAttachments().
 * @param {boolean} [props.isUser] Tints the tile chrome to match the bubble.
 */
export default function MessageAttachments({ urls, isUser = false }) {
  const files = useMemo(() => normalise(urls), [urls]);
  // Index into `viewable`, or null when the lightbox is closed.
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Only images and videos can open in the lightbox; the rest open in a tab.
  const viewable = useMemo(
    () => files.filter((file) => file.type === "image" || file.type === "video"),
    [files],
  );

  if (!files.length) return null;

  const openFile = (file) => {
    const position = viewable.findIndex((item) => item.url === file.url);
    if (position >= 0) {
      setLightboxIndex(position);
      return;
    }
    console.log(`📎 [attachments] opening ${file.type} in a new tab:`, file.name);
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  const scrollable = files.length > 4;

  const lightbox = lightboxIndex !== null && (
    <Lightbox
      items={viewable.map((file) => ({
        url: file.url,
        type: file.type,
        alt: file.name,
      }))}
      index={lightboxIndex}
      onIndexChange={setLightboxIndex}
      onClose={() => setLightboxIndex(null)}
      onDownload={(item) => {
        const ext = nameFromUrl(item.url).split(".").pop() || "png";
        console.log("💾 [attachments] downloading", item.alt);
        downloadImageUrl(item.url, { filePrefix: "klux-attachment", ext });
      }}
    />
  );

  return (
    <>
      <div className="relative mb-2" style={{ maxWidth: TILE * 4 + GAP * 3 }}>
        <div
          className="hide-scrollbar"
          style={{
            display: "flex",
            gap: GAP,
            overflowX: "auto",
            overscrollBehaviorX: "contain",
          }}
        >
          {files.map((file) => (
            <AttachmentTile
              key={file.url}
              file={file}
              isUser={isUser}
              onOpen={() => openFile(file)}
            />
          ))}
        </div>

        {/* Right-edge fade — the cue that the strip keeps going. */}
        {scrollable && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-black/10 to-transparent"
          />
        )}
      </div>

      {/* Portalled to <body> ON PURPOSE. The message wrapper animates with a
          transform (ck-msg-in), and a transformed ancestor becomes the
          containing block for position:fixed descendants — which pinned the
          lightbox inside the chat column instead of over the viewport.
          Escaping to body is the only reliable fix. */}
      {lightbox && typeof document !== "undefined"
        ? createPortal(lightbox, document.body)
        : null}
    </>
  );
}

/** One small square tile — a real <img> for images/videos, an icon otherwise. */
function AttachmentTile({ file, isUser, onOpen }) {
  const meta = NON_VISUAL[file.type];
  const chrome = isUser ? "border-black/10" : "border-gray-200";

  return (
    <button
      type="button"
      onClick={onOpen}
      title={file.name}
      aria-label={`Open ${file.name}`}
      style={{ width: TILE, height: TILE, flexShrink: 0 }}
      className={`group relative block overflow-hidden rounded-lg border bg-gray-100 transition-all hover:brightness-95 cursor-pointer ${chrome}`}
    >
      {meta ? (
        // Audio / document — no thumbnail exists, so an icon stands in. The
        // name lives in the tooltip rather than on the tile, which is far too
        // small to hold readable text.
        <span className="flex h-full w-full items-center justify-center">
          <meta.Icon className="h-5 w-5 text-gray-500" />
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.url}
            alt={file.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {/* Videos get a play badge so they're distinguishable at a glance. */}
          {file.type === "video" && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90">
                <Play className="ml-px h-2.5 w-2.5 fill-gray-900 text-gray-900" />
              </span>
            </span>
          )}
          {/* Hover affordance — appears only on pointer devices. */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5 text-white drop-shadow" />
          </span>
        </>
      )}
    </button>
  );
}
