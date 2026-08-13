"use client";

// app/(components)/creatives/DesignDetailsDrawer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Creative Studio's design details panel, packaged as a drop-in drawer for any
// page that shows saved designs — today that's the home page's template rail
// ("Recent Saved Designs"), which used to open the centred TemplateDetailsModal
// for a design and now opens THIS, so a design looks and behaves the same
// wherever it's clicked.
//
// The panel itself is <DesignDetailsPanel> (see that file — it is shared with
// /creatives and stays purely presentational). What lives here is the wiring
// /creatives keeps inline in its own page: the drawer, the delete confirmation,
// the copy editor, the publish/schedule modal, and the AuthContext calls behind
// favourite / delete / rename / download.
//
// ⚠️ /creatives DOES NOT USE THIS. It keeps its own copy of the wiring because
// every action there also has to move a card in the grid it sits beside — a
// delete removes a tile, a favourite flips a star, and the tab counts follow.
// This component talks only to the API and reports back through `onUpdated` /
// `onDeleted`, which is the right shape for a host that holds a short list it
// can patch rather than a full library it filters. The PANEL is what the two
// share, and that is the part that would otherwise drift.
//
// CONTROLLED, deliberately: the host owns `design` and applies its own patches
// when this reports one. That keeps a single source of truth for the row —
// the same object the host's list holds — instead of the drawer and the list
// each carrying their own idea of whether the design is favourited.
//
// ── z-index ─────────────────────────────────────────────────────────────────
// The drawer sits at 50 (not Drawer's default 120) for the same reason
// /creatives pins it there: the copy editor (z-70) and the delete confirmation
// (z-60) open FROM the panel and have to cover it.

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Drawer from "@/app/(components)/ui/Drawer";
import PublishModal from "@/app/(components)/PublishModal";
import { downloadBlob } from "@/utils/downloadName";
import DesignDetailsPanel, {
  EditCopyModal,
  renderDesignToPngBlob,
  toProxiedSrc,
} from "./DesignDetailsPanel";

/**
 * @param {object} props
 * @param {object|null} props.design  The open design, as a normalizeDesign()
 *   result (see DesignDetailsPanel). Kept on screen through the drawer's exit
 *   animation, so the host may null it the instant it closes.
 * @param {boolean} [props.isOpen]    Defaults to "a design was passed".
 * @param {() => void} props.onClose
 * @param {(id: number|string, patch: object) => void} [props.onUpdated] The row
 *   changed — favourite flipped, name/copy edited. The host merges the patch
 *   into `design` AND into whatever list it came from.
 * @param {(id: number|string) => void} [props.onDeleted] The row is gone.
 */
export default function DesignDetailsDrawer({
  design,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const { deleteDesignById, updateDesignById, toggleDesignFavorite } = useAuth();

  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [publishStartSchedule, setPublishStartSchedule] = useState(false);

  const open = isOpen ?? Boolean(design);

  /* The drawer stays mounted for its 200ms exit animation, but the host clears
     `design` the instant it's dismissed — so the panel would slide away blank.
     Remembering the last one keeps its contents on screen until it is gone.
     Adjusted during render (React's adjust-state pattern, the same one
     /creatives and Drawer itself use) rather than in an effect. */
  const [lastDesign, setLastDesign] = useState(design);
  if (design && design !== lastDesign) setLastDesign(design);
  const panelDesign = design || lastDesign;

  /** Star in the header. Optimistic through the host, reverted on failure. */
  const handleToggleFavorite = async (id, e) => {
    e?.stopPropagation();
    if (!panelDesign) return;

    const next = !panelDesign.favorite;
    onUpdated?.(id, { favorite: next });

    const res = await toggleDesignFavorite(id, next);
    if (!res?.ok) {
      console.error("❌ [design-drawer] favourite failed:", res?.message);
      onUpdated?.(id, { favorite: !next });
      toast.error(res?.message || "Could not update favorite");
    }
  };

  /** Confirmed delete. Closes the drawer — the design it was showing is gone. */
  const handleDelete = async () => {
    if (!panelDesign) return;
    setDeleting(true);
    try {
      const res = await deleteDesignById(panelDesign.id);
      if (!res?.ok) throw new Error(res?.message);
      console.log(`🗑️ [design-drawer] deleted "${panelDesign.name}"`);
      onDeleted?.(panelDesign.id);
      toast.success("Design deleted");
      onClose?.();
    } catch (err) {
      console.error("❌ [design-drawer] delete failed:", err);
      toast.error("Failed to delete design");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  /** The copy editor's save — name + the generated-copy block. */
  const handleSaveCopy = async (id, fields) => {
    try {
      const res = await updateDesignById(id, {
        name: fields.name,
        copy: JSON.stringify(fields.copy),
      });
      if (!res?.ok) throw new Error(res?.message);
      onUpdated?.(id, { name: fields.name, title: fields.name, copy: fields.copy });
      toast.success("Design updated");
      setEditTarget(null);
    } catch (err) {
      console.error("❌ [design-drawer] update failed:", err);
      toast.error("Failed to update design");
    }
  };

  /** Copy the generated-copy block to the clipboard. */
  const handleCopyText = () => {
    if (!panelDesign) return;
    const copy = panelDesign.copy;
    const text = typeof copy === "string" ? copy : JSON.stringify(copy, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** Repaint the design at full resolution and save it as a PNG. */
  const handleDownload = async (c) => {
    try {
      let blob;
      if (c.canvas && c.elements?.length) {
        blob = await renderDesignToPngBlob(c);
      } else if (c.image) {
        const res = await fetch(toProxiedSrc(c.image));
        if (!res.ok) throw new Error("Could not fetch the image.");
        blob = await res.blob();
      } else {
        throw new Error("This design has nothing to download.");
      }

      const ext = blob.type?.includes("jpeg") ? "jpg" : "png";
      // Reusable branded download — creativeklux-<word>-<time>.<ext>.
      downloadBlob(blob, ext);
      toast.success("Design downloaded ✓");
    } catch (err) {
      console.error("❌ [design-drawer] download failed:", err);
      toast.error(err?.message || "Download failed. Please try again.");
    }
  };

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={onClose}
        side="right"
        label="Design details"
        zIndex={50}
        className="w-105"
      >
        {panelDesign && (
          <DesignDetailsPanel
            creative={panelDesign}
            onClose={onClose}
            onToggleFavorite={handleToggleFavorite}
            onCopy={handleCopyText}
            copied={copied}
            onDeleteRequest={() => setConfirmingDelete(true)}
            onEdit={setEditTarget}
            onPublish={() => {
              setPublishStartSchedule(false);
              setPublishTarget(panelDesign); // capture it before the drawer closes
              onClose?.();
            }}
            onSchedule={() => {
              setPublishStartSchedule(true); // straight into scheduling
              setPublishTarget(panelDesign);
              onClose?.();
            }}
            onDownload={handleDownload}
          />
        )}
      </Drawer>

      {/* ── Edit Copy Modal ── */}
      {editTarget && (
        <EditCopyModal
          creative={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveCopy}
        />
      )}

      {/* ── Publish Modal ── */}
      {publishTarget && (
        <PublishModal
          creative={publishTarget}
          startInSchedule={publishStartSchedule}
          onClose={() => setPublishTarget(null)}
          showToast={(message, type = "success") =>
            type === "error" ? toast.error(message) : toast.success(message)
          }
        />
      )}

      {/* ── Delete confirm modal ── */}
      {confirmingDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Delete design?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer transition flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
