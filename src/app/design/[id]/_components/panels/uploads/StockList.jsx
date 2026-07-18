"use client";

import React from "react";
import { SearchX } from "lucide-react";
import MediaGrid from "./MediaGrid";
import MediaTile from "./MediaTile";

/**
 * StockList — Pexels results for the search term on the active tab.
 *
 * Audio and Docs have no stock source, so they report nothing found rather than
 * an error: there's nothing to search, it isn't broken.
 *
 * Props: { results, loading, error, supported, typeId, query, onPick }
 */
export default function StockList({
  results,
  loading,
  error,
  supported,
  typeId,
  query,
  onPick,
}) {
  if (!supported) {
    return <Nothing note={`No results for “${query}”.`} />;
  }

  if (error) {
    return (
      <p className="text-xs text-red-500 text-center py-8">
        Couldn’t search stock — {error}.
      </p>
    );
  }

  return (
    <MediaGrid
      loading={loading}
      isEmpty={!results.length}
      skeletonType={typeId}
      empty={<Nothing note={`No results for “${query}”.`} />}
    >
      {results.map((r) => (
        <MediaTile
          key={r.id}
          type={typeId}
          src={r.full}
          thumb={r.thumb}
          label={r.alt}
          onPick={() => onPick(typeId, r.full)}
        />
      ))}
    </MediaGrid>
  );
}

function Nothing({ note }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
      <SearchX className="w-8 h-8" />
      <p className="text-xs text-gray-400 text-center px-4">{note}</p>
    </div>
  );
}
