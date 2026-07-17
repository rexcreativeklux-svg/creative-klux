"use client";

import React from "react";
import { Loader2 } from "lucide-react";

/**
 * MediaGrid — two-up tile grid with the loading and empty states every uploads
 * list needs. Tiles are supplied by the caller so the gallery and stock lists
 * share one layout.
 *
 * Props: { loading, isEmpty, empty: ReactNode, children }
 */
export default function MediaGrid({ loading, isEmpty, empty, children }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (isEmpty) return empty;

  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
