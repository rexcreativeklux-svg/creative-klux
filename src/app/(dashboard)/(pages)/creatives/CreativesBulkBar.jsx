"use client";

/**
 * CreativesBulkBar — the bulk actions for My Creations' ticked designs.
 *
 * Its own bar rather than the studios' ResultsBulkBar because a saved design
 * isn't a hosted file: it may only exist as a canvas that has to be painted
 * before there's anything to download or save (see {@link designToBlob}).
 */

import { useRef, useState } from "react";
import { Bookmark, Download, HardDrive, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import BulkActionBar from "@/app/(components)/bulk/BulkActionBar";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import {
  renderDesignToPngBlob,
  toProxiedSrc,
} from "@/app/(components)/creatives/DesignDetailsPanel";
import {
  downloadUrlsAsZip,
  withFileTimeout,
} from "@/app/(components)/product-studio/saveToGallery";
import { useAuth } from "@/context/AuthContext";
import { downloadBlob } from "@/utils/downloadName";

const plural = (n) => `${n} design${n === 1 ? "" : "s"}`;

/**
 * A design as an image file: its canvas painted, or its stored image fetched.
 *
 * @param {object} design A normalized design.
 * @returns {Promise<Blob>}
 */
export async function designToBlob(design) {
  if (design.canvas && design.elements?.length) {
    return renderDesignToPngBlob(design);
  }
  if (design.image) {
    const res = await fetch(toProxiedSrc(design.image));
    if (!res.ok) throw new Error("Could not fetch the image.");
    return res.blob();
  }
  throw new Error("This design has nothing to download.");
}

const extOf = (blob) => (blob.type?.includes("jpeg") ? "jpg" : "png");

/**
 * @param {object} props
 * @param {ReturnType<import("@/app/(components)/bulk/useBulkSelection").default>} props.selection
 * @param {(ids: Array<string|number>) => Promise<void>} props.removeMany Throws
 *   with the backend's own error when the delete doesn't go through.
 */
export default function CreativesBulkBar({ selection, removeMany }) {
  const { uploadMedia } = useAuth();
  const { selectedItems, count } = selection;
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // ConfirmDialog answers Enter on the window AND its focused button clicks, so
  // one key press arrives here twice. State wouldn't have updated by the second.
  const deleteLock = useRef(false);

  const handleDownload = async () => {
    setBusy(true);
    const id = toast.loading(
      count === 1 ? "Downloading…" : `Zipping ${plural(count)}…`,
    );
    try {
      if (count === 1) {
        const blob = await withFileTimeout(designToBlob(selectedItems[0]));
        // Reusable branded download — creativeklux-<word>-<time>.<ext>.
        downloadBlob(blob, extOf(blob));
        toast.success("Downloaded", { id });
      } else {
        const date = new Date().toISOString().slice(0, 10);
        const { failed } = await downloadUrlsAsZip(
          selectedItems.map((design, index) => ({
            // Numbered as well as named: designs often share a name, and a zip
            // silently keeps only the last of two files called the same thing.
            name: (blob) =>
              `${index + 1}-${String(design.name || "design").replace(/[\\/:*?"<>|]/g, "-")}.${extOf(blob)}`,
            load: () => designToBlob(design),
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
      console.error("❌ [creatives] bulk download failed:", err);
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
    // One at a time: painting a canvas is heavy, and these are whole files going
    // up to the endpoint the rest of the app is using at the same moment.
    for (const design of selectedItems) {
      try {
        const blob = await withFileTimeout(designToBlob(design));
        const file = new File(
          [blob],
          `${design.name || "design"}.${extOf(blob)}`,
          { type: blob.type || "image/png" },
        );
        await withFileTimeout(uploadMedia(file));
      } catch (err) {
        console.error("❌ [creatives] bulk save to gallery failed:", err);
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

  const handleDelete = async () => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    try {
      await removeMany(selectedItems.map((design) => design.id));
      toast.success(`Deleted ${plural(count)}`);
      setConfirming(false);
    } catch (err) {
      // The backend's actual error, with time to read it. The dialog stays up
      // with the selection intact so trying again is one click.
      toast.error(err.message, { duration: 10000 });
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  };

  return (
    <>
      <BulkActionBar
        count={count}
        allSelected={selection.allSelected}
        onSelectAll={selection.selectAll}
        onClear={selection.clear}
        busy={busy}
        actions={[
          {
            label: "Email to client",
            icon: Mail,
            primary: true,
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
            onClick: () => setConfirming(true),
          },
        ]}
      />

      <ConfirmDialog
        open={confirming}
        title={`Delete ${plural(count)}?`}
        message={`${plural(count)} will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Keep them"
        variant="danger"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
