"use client";

import React from "react";
import { X } from "lucide-react";
import PanelSection from "../../shared/PanelSection";
import HorizontalStrip from "./HorizontalStrip";
import TextLookCard from "./TextLookCard";
import { LOOK_ROW_COUNT, LOOK_ROW_GROUPS } from "./lookStyle";

/**
 * TextLookRows — Text › Effects as browse rows: the text effects and the
 * single-look text templates, a sideways row per category with "See all".
 *
 * With text selected, a pick restyles it; the look it wears is ringed and can
 * be taken off from the line above the rows.
 *
 * Props: { activeLook?: look|null, onPick, onSeeAll: (row) => void, onRemove? }
 */
export default function TextLookRows({ activeLook = null, onPick, onSeeAll, onRemove }) {
  return (
    <div className="flex flex-col gap-5">
      {activeLook && onRemove && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-blue-50/70 px-3 py-2 text-xs">
          <span className="truncate text-gray-700">{activeLook.label}</span>
          <button
            type="button"
            onClick={onRemove}
            title="Remove this look from the text"
            className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      )}

      {LOOK_ROW_GROUPS.map((row) => (
        <PanelSection
          key={row.id}
          title={row.label}
          action={row.items.length > LOOK_ROW_COUNT ? "See all" : undefined}
          onAction={() => onSeeAll(row)}
        >
          <HorizontalStrip
            items={row.items.slice(0, LOOK_ROW_COUNT)}
            itemWidth={112}
            keyFor={(template) => template.id}
            renderItem={(template) => (
              <TextLookCard template={template} active={template.id === activeLook?.id} onPick={onPick} />
            )}
          />
        </PanelSection>
      ))}
    </div>
  );
}
