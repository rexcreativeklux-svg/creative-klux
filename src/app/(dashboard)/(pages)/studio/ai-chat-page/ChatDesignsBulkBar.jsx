"use client";

/**
 * ChatDesignsBulkBar — the bulk actions for the designs ticked in Creative
 * Studio's preview pane. The same bar as My Creations, plus Save designs,
 * because these results aren't in My Creations until they're saved.
 *
 * Its own bar rather than ResultsBulkBar because a chat design can be either a
 * hosted Magic file or a creative that only exists as a canvas to be painted
 * (see variationToFile).
 *
 * Delete here only takes designs OFF THE PANE — nothing generated in the chat
 * is on the server until it's saved, so there is nothing else to delete.
 */

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Download,
  HardDrive,
  Mail,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import BulkActionBar from "@/app/(components)/bulk/BulkActionBar";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import {
  downloadUrlsAsZip,
  withFileTimeout,
} from "@/app/(components)/product-studio/saveToGallery";
import { useAuth } from "@/context/AuthContext";
import { downloadBlob } from "@/utils/downloadName";
import { fileSlugOf, variationToFile } from "./designActions";

const plural = (n) => `${n} design${n === 1 ? "" : "s"}`;

/**
 * @param {object} props
 * @param {Array} props.selected The ticked designs.
 * @param {Array} props.all Every design on the pane, for Select all.
 * @param {(designs: Array) => void} props.setSelected
 * @param {() => Promise<void>} props.onSave Saves the selection to My Creations.
 * @param {boolean} props.saving
 * @param {(ids: Array) => void} props.onRemove Takes designs off the pane.
 * @param {boolean} [props.running] A run is still landing designs — removing
 *   cards then would have them come back with its next batch.
 */
export default function ChatDesignsBulkBar({
  selected,
  all,
  setSelected,
  onSave,
  saving,
  onRemove,
  running = false,
}) {
  const { uploadMedia } = useAuth();
  const count = selected.length;
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // ConfirmDialog answers Enter on the window AND its focused button clicks, so
  // one key press can arrive twice.
  const removeLock = useRef(false);

  const handleDownload = async () => {
    setBusy(true);
    const id = toast.loading(
      count === 1 ? "Downloading…" : `Zipping ${plural(count)}…`,
    );
    try {
      if (count === 1) {
        const { blob, ext } = await withFileTimeout(variationToFile(selected[0]));
        downloadBlob(blob, ext);
        toast.success("Downloaded", { id });
      } else {
        const date = new Date().toISOString().slice(0, 10);
        // ext is only known once the file is made, so `load` stashes it.
        const exts = new Map();
        const { failed } = await downloadUrlsAsZip(
          selected.map((v, index) => ({
            // Numbered as well as named: designs often share a name, and a zip
            // keeps only the last of two files called the same thing.
            name: () => `${index + 1}-${fileSlugOf(v)}.${exts.get(index) || "png"}`,
            load: async () => {
              const { blob, ext } = await variationToFile(v);
              exts.set(index, ext);
              return blob;
            },
          })),
          `creativeklux-designs-${date}.zip`,
        );
        if (failed > 0) {
          toast.warning(`Downloaded, but ${plural(failed)} couldn't be added`, { id });
        } else {
          toast.success(`Downloaded ${plural(count)}`, { id });
        }
      }
    } catch (err) {
      console.error("❌ [chat] bulk download failed:", err);
      toast.error(err?.message || "Couldn't download those designs", { id });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToGallery = async () => {
    setBusy(true);
    const id = toast.loading(`Saving ${plural(count)} to gallery…`);
    let failed = 0;
    let lastError = null;
    // One at a time: painting is heavy, and these are whole files going up.
    for (const v of selected) {
      try {
        const { blob, ext, mime } = await withFileTimeout(variationToFile(v));
        const file = new File([blob], `${fileSlugOf(v)}-${Date.now()}.${ext}`, {
          type: mime || blob.type || "image/png",
        });
        await withFileTimeout(uploadMedia(file));
      } catch (err) {
        console.error("❌ [chat] bulk save to gallery failed:", err);
        failed += 1;
        lastError = err;
      }
    }
    const reason = lastError?.message || "Couldn't save those to the gallery";
    if (failed === 0) {
      toast.success(`${plural(count)} saved to gallery`, { id });
    } else if (failed === count) {
      toast.error(reason, { id, duration: 10000 });
    } else {
      toast.warning(`Saved ${count - failed} of ${count} to the gallery. ${reason}`, {
        id,
        duration: 10000,
      });
    }
    setBusy(false);
  };

  const handleRemove = () => {
    if (removeLock.current) return;
    removeLock.current = true;
    onRemove(selected.map((v) => v.id));
    toast.success(`Removed ${plural(count)}`);
    setConfirming(false);
    // Released after the dialog's second (duplicate) confirm has come and gone.
    setTimeout(() => {
      removeLock.current = false;
    }, 0);
  };

  const allSelected = all.length > 0 && count === all.length;

  return (
    <>
      <BulkActionBar
        count={count}
        allSelected={allSelected}
        onSelectAll={() => setSelected(all)}
        onClear={() => setSelected([])}
        busy={busy || saving}
        actions={[
          {
            label: saving ? "Saving…" : `Save ${plural(count)}`,
            icon: Save,
            primary: true,
            onClick: onSave,
          },
          {
            label: "Email to client",
            icon: Mail,
            onClick: () => toast.info("Email to client is coming soon."),
          },
          {
            label: "Save to Drive",
            icon: HardDrive,
            onClick: () => toast.info("Save to Drive is coming soon."),
          },
          {
            label: "Download",
            icon: Download,
            onClick: handleDownload,
          },
          {
            label: "Save to gallery",
            icon: Bookmark,
            disabled: !uploadMedia,
            onClick: handleSaveToGallery,
          },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            disabled: running,
            onClick: () => setConfirming(true),
          },
        ]}
      />

      {/* Portalled: the preview pane keeps a transform from its slide-in, which
          would pin this fixed overlay to the pane instead of the screen. */}
      {typeof document !== "undefined" &&
        createPortal(
          <ConfirmDialog
            open={confirming}
            title={`Delete ${plural(count)}?`}
            message={`${plural(count)} will be removed from this chat. Any you haven't saved can't be brought back.`}
            confirmLabel="Delete"
            cancelLabel="Keep them"
            variant="danger"
            onConfirm={handleRemove}
            onCancel={() => setConfirming(false)}
          />,
          document.body,
        )}
    </>
  );
}
