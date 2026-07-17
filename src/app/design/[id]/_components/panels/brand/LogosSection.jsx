"use client";

import React from "react";
import { ImageIcon } from "lucide-react";
import BrandLogoTile from "./BrandLogoTile";
import BrandEmptyState from "./BrandEmptyState";

/**
 * LogosSection — the brand's logo. The brand record holds a single nullable
 * `logo` URL, so this is a list of at most one; it stays a list because that's
 * the shape the panel promises, not because the API returns several.
 *
 * Props: { brand, insert }
 */
export default function LogosSection({ brand, insert }) {
  if (!brand?.logo) {
    return (
      <BrandEmptyState
        icon={ImageIcon}
        title="No logo yet"
        note="Add a logo to this brand from Brand settings and it'll show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <BrandLogoTile src={brand.logo} onPick={insert.imageUrl} />
      <p className="text-[10px] text-gray-400">Click to add it to the canvas.</p>
    </div>
  );
}
