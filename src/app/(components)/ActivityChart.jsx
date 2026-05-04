"use client";

import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

/* Build last-N-days buckets from a list of designs */
function buildChartData(designs = [], days = 14) {
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets[key] = { date: key, ads: 0, social: 0, other: 0, total: 0 };
  }

  designs.forEach((design) => {
    const created = design.created_at
      ? new Date(design.created_at)
      : null;
    if (!created) return;

    const key = created.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!buckets[key]) return;

    const type = (design.type || "").toLowerCase();
    if (type === "ads") buckets[key].ads += 1;
    else if (type === "social") buckets[key].social += 1;
    else buckets[key].other += 1;

    buckets[key].total += 1;
  });

  return Object.values(buckets);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.dataKey}</span>
          <span className="font-semibold text-gray-800 ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ActivityChart({ designs = [] }) {
  const data = useMemo(() => buildChartData(designs, 14), [designs]);
  const totalThisWeek = useMemo(
    () => data.slice(-7).reduce((acc, d) => acc + d.total, 0),
    [data]
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Activity</p>
          <h3 className="text-sm font-bold text-gray-900">Design Output — Last 14 Days</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
          <TrendingUp className="w-3 h-3 text-blue-500" />
          <span className="text-xs font-semibold text-blue-600">{totalThisWeek} this week</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        {[
          { key: "ads",    color: "#2563eb", label: "Ads"    },
          { key: "social", color: "#7c3aed", label: "Social" },
          { key: "other",  color: "#0891b2", label: "Other"  },
        ].map(({ key, color, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0" style={{ minHeight: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradSocial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0891b2" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="ads"    stroke="#2563eb" strokeWidth={2} fill="url(#gradAds)"    dot={false} />
            <Area type="monotone" dataKey="social" stroke="#7c3aed" strokeWidth={2} fill="url(#gradSocial)" dot={false} />
            <Area type="monotone" dataKey="other"  stroke="#0891b2" strokeWidth={2} fill="url(#gradOther)"  dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}