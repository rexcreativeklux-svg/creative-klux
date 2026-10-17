"use client";

import React from "react";
import PanelView from "../../elements/PanelView";
import TextLookCard from "./TextLookCard";

/**
 * TextLookView — the "See all" drill-in: every look in one category, two-up,
 * with a back arrow to the rows.
 *
 * Props: { group: {id, label, items}, activeLook?: look|null, onPick, onBack }
 */
export default function TextLookView({ group, activeLook = null, onPick, onBack }) {
  if (!group) return null;

  return (
    <PanelView title={group.label} onBack={onBack}>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {group.items.map((template) => (
            <TextLookCard
              key={template.id}
              template={template}
              active={template.id === activeLook?.id}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </PanelView>
  );
}
