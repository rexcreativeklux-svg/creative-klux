"use client";

import React from "react";
import { BarChart3, LineChart, PieChart, CircleDashed } from "lucide-react";
import { CHART_TYPES } from "@/(lib)/design/charts";

/**
 * ChartsLibrary — the Elements › Charts library. Pick a chart type to drop it
 * (seeded with sample data) onto the canvas; edit the data from the chart's
 * context toolbar ("Edit data"). Inserts via the editor's `insert.chart` API.
 *
 * Props: { insert }
 */
const ICONS = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  donut: CircleDashed,
};

export default function ChartsLibrary({ insert }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Add a chart, then edit its data from the toolbar.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {CHART_TYPES.map((t) => {
          const Icon = ICONS[t.id] || BarChart3;
          return (
            <button
              key={t.id}
              onClick={() => insert.chart(t.id)}
              title={`${t.label} chart`}
              className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 transition cursor-pointer"
            >
              <Icon className="w-7 h-7" />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
