"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import useGalleryMedia from "@/app/(components)/gallery/useGalleryMedia";
import MediaTypeTabs from "@/app/(components)/gallery/MediaTypeTabs";
import PanelSearchInput from "./shared/PanelSearchInput";
import UploadFilesButton from "./uploads/UploadFilesButton";
import GalleryList from "./uploads/GalleryList";
import StockList from "./uploads/StockList";
import usePexelsSearch from "./uploads/usePexelsSearch";
import useMediaInsert from "./uploads/useMediaInsert";

/**
 * Uploads panel — your gallery across Images / Videos / Audio / Docs, and stock
 * photos & videos from Pexels once you search.
 *
 * The tabs and the /gallery data come from the same useGalleryMedia hook the
 * gallery page uses, so the taxonomy and classification can't drift between the
 * two surfaces.
 *
 * Props: { insert }
 */
export default function UploadsPanel({ insert }) {
  const { uploadMedia } = useAuth();
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const {
    tabs,
    activeType,
    setActiveType,
    items,
    counts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useGalleryMedia();

  const q = query.trim();
  const stock = usePexelsSearch({ query: q, type: activeType });
  const { pick } = useMediaInsert({ insert });

  // Upload once, to the gallery, then place images from the durable URL that
  // comes back. Going through insert.imageFile instead would upload behind our
  // back and leave the list below showing stale contents.
  const onFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const res = await uploadMedia(file);
        const url =
          res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
        if (url && file.type.startsWith("image/")) insert.imageUrl(url);
      }
      await refresh?.();
    } catch (err) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      <PanelSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search keyword for inspiration"
      />

      <UploadFilesButton onFiles={onFiles} uploading={uploading} />

      <MediaTypeTabs
        tabs={tabs}
        active={activeType}
        onChange={setActiveType}
        counts={q ? undefined : counts}
        variant="pill"
      />

      {q ? (
        <StockList
          results={stock.results}
          loading={stock.loading}
          error={stock.error}
          supported={stock.supported}
          typeId={activeType}
          query={q}
          onPick={pick}
        />
      ) : (
        <GalleryList
          items={items}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          typeId={activeType}
          onPick={pick}
        />
      )}
    </div>
  );
}
