"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { CalendarDays } from "lucide-react";
import ComposerDropdown from "@/app/(components)/studio/ComposerDropdown";

/**
 * The periods the header dropdown offers. Each entry doubles as a
 * ComposerDropdown option ({ id, label, description }) and carries the header
 * copy for when it's selected. "Today" buckets by hour; the rest by day.
 */
const RANGES = [
  {
    id: "today",
    label: "Today",
    description: "Last 24 hours, by hour",
    title: "Today's Activity",
    subtitle: "Designs created in the last 24 hours",
  },
  {
    id: "weekly",
    label: "Weekly",
    description: "Last 7 days, by day",
    title: "Weekly Activity",
    subtitle: "Designs created over the last 7 days",
  },
  {
    id: "monthly",
    label: "Monthly",
    description: "Last 30 days, by day",
    title: "Monthly Activity",
    subtitle: "Designs created over the last 30 days",
  },
];

/** Bucket key for a day, e.g. "Jul 17". */
const dayKey = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Bucket key for an hour, e.g. "3 PM". Unique within a 24-hour window. */
const hourKey = (d) =>
  d.toLocaleTimeString("en-US", { hour: "numeric" });

function buildChartData(designs = [], rangeId = "weekly") {
  const hourly = rangeId === "today";
  const steps = hourly ? 24 : rangeId === "monthly" ? 30 : 7;
  const keyOf = hourly ? hourKey : dayKey;

  // Oldest bucket's start — designs before it belong to no bucket. Guards the
  // hourly view especially: without it, a design from "3 PM" days ago would
  // land in this window's "3 PM" bucket.
  const windowStart = new Date();
  if (hourly) {
    windowStart.setMinutes(0, 0, 0);
    windowStart.setHours(windowStart.getHours() - (steps - 1));
  } else {
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - (steps - 1));
  }

  const buckets = {};
  for (let i = 0; i < steps; i++) {
    const d = new Date(windowStart);
    if (hourly) d.setHours(d.getHours() + i);
    else d.setDate(d.getDate() + i);
    const key = keyOf(d);
    buckets[key] = { date: key, all: 0, ads: 0, social: 0, designer: 0, magic: 0 };
  }

  designs.forEach((design) => {
    const created = design.created_at ? new Date(design.created_at) : null;
    if (!created || created < windowStart) return;
    const key = keyOf(created);
    if (!buckets[key]) return;

    const type = (design.type || "").toLowerCase();
    buckets[key].all += 1;
    if (type === "ads")          buckets[key].ads      += 1;
    else if (type === "social")  buckets[key].social   += 1;
    else if (type === "designer") buckets[key].designer += 1;
    else if (type === "magic")   buckets[key].magic    += 1;
  });

  return Object.values(buckets);
}

const LINES = [
  { key: "all",      color: "#8b5cf6", label: "All Designs" },
  { key: "ads",      color: "#f97316", label: "Ads"         },
  { key: "social",   color: "#06b6d4", label: "Social"      },
  { key: "designer", color: "#ec4899", label: "Designer"    },
  { key: "magic",    color: "#10b981", label: "Magic"       },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}</span>
          <span className="font-semibold text-gray-800 ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-5 mt-3 flex-wrap">
    {LINES.map(({ key, color, label }) => (
      <div key={key} className="flex items-center gap-1.5">
        <svg width="24" height="10">
          <line x1="0" y1="5" x2="16" y2="5" stroke={color} strokeWidth="2" strokeDasharray="none" />
          <circle cx="8" cy="5" r="2.5" fill={color} />
        </svg>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    ))}
  </div>
);

export default function ActivityChart({ designs = [] }) {
  const [rangeId, setRangeId] = useState("weekly");
  const [rangeOpen, setRangeOpen] = useState(false);
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[1];

  const data = useMemo(() => buildChartData(designs, rangeId), [designs, rangeId]);

  return (
    <div className="bg-surface border border-gray-100 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      {/* Header — title on the left, period picker opposite it */}
      <div className="mb-1 shrink-0 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">{range.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{range.subtitle}</p>
        </div>
        <ComposerDropdown
          options={RANGES}
          value={rangeId}
          onChange={setRangeId}
          open={rangeOpen}
          onOpenChange={setRangeOpen}
          drop="down"
          align="right"
          icon={CalendarDays}
          ariaLabel="Select the period to view"
        />
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 mt-4" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            {LINES.map(({ key, color, label }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <CustomLegend />
    </div>
  );
}
