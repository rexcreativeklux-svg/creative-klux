"use client";

import React from "react";
import TextComboCard from "./TextComboCard";

/**
 * TextComboGrid — text templates two-up: the one grid both the Templates tab
 * and the panel's search results draw, so the two can't drift apart.
 *
 * Props: { combos, onPick: (combo) => void }
 */
export default function TextComboGrid({ combos, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {combos.map((combo) => (
        <TextComboCard key={combo.id} combo={combo} onPick={onPick} />
      ))}
    </div>
  );
}
