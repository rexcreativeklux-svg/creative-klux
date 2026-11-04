"use client";

/**
 * ResultsBulkBar — the bulk actions for a studio's ticked generation results,
 * shared by Magic Studio and Product Studio.
 *
 * Only Delete confirms: it is the one action that can't be undone, and asking
 * twice for a save is friction with no safety value. Email and Drive say "coming
 * soon", the same as they do in the ⋯ menu, until the backend serves them.
 */

import { useRef, useState } from "react";
import { Bookmark, Download, HardDrive, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import {
  downloadImageUrl,
  downloadUrlsAsZip,
  galleryFileMeta,
  saveUrlToGallery,
} from "@/app/(components)/product-studio/saveToGallery";
import { useAuth } from "@/context/AuthContext";
import BulkActionBar from "./BulkActionBar";

const plural = (n, word = "result") => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * @param {object} props
 * @param {string} props.filePrefix Names downloaded and saved files.
 * @param {Array} props.items Every tile on the canvas.
 * @param {ReturnType<import("./useBulkSelection").default>} props.selection
 * @param {(ids: Array<string|number>) => Promise<{failed: number, deleted: number, message?: string}>} props.removeMany
 *   Throws when the request itself fails, having already told the user why.
 * @param {(id: string|number) => string|number} [props.groupOf] What a tile's id
 *   is deleted as, where several tiles can share one server record — so the
 *   dialog can say when more goes than was ticked.
 */
export default function ResultsBulkBar({
  filePrefix,
  items,
  selection,
  removeMany,
  groupOf = (id) => id,
}) {
  const { uploadMedia } = useAuth();
  const { selectedItems, selectedIds, count } = selection;
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // ConfirmDialog answers Enter on the window AND its focused button clicks, so
  // one key press arrives here twice. State wouldn't have updated by the second.
  const deleteLock = useRef(false);

  // A transcript has no file behind it to download or save.
  const files = selectedItems.filter((item) => item.url);

  // ⚠️ DELETE TAKES THE RECORD, not the tile, and one record can have made
  // several results. Ticking one of a set still removes the whole set, so the
  // dialog has to say so rather than quietly delete more than was ticked.
  const groups = new Set(selectedItems.map((item) => groupOf(item.id)));
  const alongside = items.filter(
    (item) => groups.has(groupOf(item.id)) && !selectedIds.has(item.id),
  ).length;
  const deleteTotal = count + alongside;

  const handleDownload = async () => {
    setBusy(true);
    const id = toast.loading(
      files.length === 1 ? "Downloading…" : `Zipping ${plural(files.length)}…`,
    );
    try {
      if (files.length === 1) {
        const [{ url, type }] = files;
        await downloadImageUrl(url, {
          filePrefix,
          ext: galleryFileMeta(url, type).ext,
        });
        toast.success("Downloaded", { id });
      } else {
        const date = new Date().toISOString().slice(0, 10);
        const { failed } = await downloadUrlsAsZip(
          files.map(({ url, type }, index) => ({
            url,
            name: `${filePrefix}-${index + 1}.${galleryFileMeta(url, type).ext}`,
          })),
          `creativeklux-${filePrefix}-${date}.zip`,
        );
        if (failed > 0) {
          toast.warning(`Downloaded, but ${plural(failed, "file")} couldn't be added`, { id });
        } else {
          toast.success(`Downloaded ${plural(files.length)}`, { id });
        }
      }
    } catch (err) {
      console.error(`❌ [${filePrefix}] bulk download failed:`, err);
      toast.error(err?.message || "Couldn't download those results", { id });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToGallery = async () => {
    setBusy(true);
    const id = toast.loading(`Saving ${plural(files.length)} to gallery…`);
    let failed = 0;
    let lastError = null;
    // One at a time: these are whole files going up, and the gallery is the same
    // endpoint the rest of the app is using at the same moment.
    for (const { url, type } of files) {
      try {
        const { ext, mime, category } = galleryFileMeta(url, type);
        await saveUrlToGallery(url, uploadMedia, {
          filePrefix,
          ext,
          mime,
          category,
        });
      } catch (err) {
        console.error(`❌ [${filePrefix}] bulk save to gallery failed:`, err);
        failed += 1;
        lastError = err;
      }
    }
    const reason = lastError?.message || "Couldn't save those to the gallery";
    if (failed === 0) {
      toast.success(`${plural(files.length)} saved to gallery`, { id });
    } else if (failed === files.length) {
      toast.error(reason, { id, duration: 10000 });
    } else {
      toast.warning(
        `Saved ${files.length - failed} of ${files.length} to the gallery. ${reason}`,
        { id, duration: 10000 },
      );
    }
    setBusy(false);
  };

  const handleDelete = async () => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    try {
      const { failed, deleted, message } = await removeMany(
        selectedItems.map((item) => item.id),
      );
      // A 200 can still be "1 of 2 deleted", so the server's own words are what
      // gets said unless it took everything that was asked for.
      if (failed > 0 || deleted < groups.size) {
        toast.warning(message || `${plural(failed, "item")} couldn't be deleted`);
      } else {
        toast.success(`Deleted ${plural(deleteTotal)}`);
      }
      setConfirming(false);
    } catch {
      // The api layer has already said what went wrong. The dialog stays open
      // with the selection intact, so trying again is one click.
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
            disabled: files.length === 0,
            onClick: () => toast.info("Email to client is coming soon."),
          },
          {
            label: "Save to Drive",
            icon: HardDrive,
            disabled: files.length === 0,
            onClick: () => toast.info("Save to Drive is coming soon."),
          },
          {
            label: "Download",
            icon: Download,
            disabled: files.length === 0,
            onClick: handleDownload,
          },
          {
            label: "Save to gallery",
            icon: Bookmark,
            disabled: files.length === 0 || !uploadMedia,
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
        title={`Delete ${plural(deleteTotal)}?`}
        message={`${plural(deleteTotal)} will be permanently deleted.${
          alongside > 0
            ? ` That includes ${alongside} you didn't tick, because ${
                alongside === 1 ? "it was" : "they were"
              } made in the same run and can only be deleted together.`
            : ""
        }`}
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
