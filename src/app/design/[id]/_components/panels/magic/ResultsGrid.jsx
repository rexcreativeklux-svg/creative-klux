"use client";

import React from "react";
import { GEN_COUNT } from "./constants";

/**
 * ResultsGrid — the "Created by Magic Studio" strip. Shows shimmering
 * placeholders while a batch is generating, the generated tiles once they land
 * (click a tile to drop it on the canvas), or a hint when there's nothing yet.
 */
export default function ResultsGrid({ results, onPick, generating }) {
  const hasResults = results.length > 0;
  if (!generating && !hasResults) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-800">
        Created by Magic Studio
      </p>
      <div className="grid grid-cols-2 gap-2">
        {generating &&
          Array.from({ length: GEN_COUNT }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square rounded-lg bg-gray-100 animate-pulse"
            />
          ))}

        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => onPick(r.url)}
            title={r.prompt || "Add to design"}
            className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition hover:border-blue-400 cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.url}
              alt={r.prompt || ""}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
