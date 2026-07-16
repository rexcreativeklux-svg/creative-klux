/**
 * AllocationTab.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Renders the allocation sub-tabs straight from ALLOCATION_CONFIG:
 *   • a scroll-x sub-tab selector
 *   • a "{Type} Remaining" summary card (remaining · used / total)
 *   • an allocation input + Save
 *
 * Live totals/used are read from the brand object (`{field}_allocation` /
 * `{field}_used`), falling back to the config default and 0. Only sub-tabs
 * flagged `wired` in the config actually PATCH the backend; the rest are
 * design-complete and show a "not yet connected" note until their endpoint ships.
 */

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useManageApi } from "../lib/useManageApi";
import { ALLOCATION_CONFIG } from "../config/manageConfig";

const fmt = (n) => Number(n || 0).toLocaleString();

// ── One sub-tab's panel ──────────────────────────────────────────────────────
function AllocationPanel({ brandId, item, brand }) {
  const { updateAllocation } = useManageApi();
  const { Icon, label, field, slug, wired, defaultTotal } = item;

  const liveTotal = brand?.[`${field}_allocation`]; 
  const liveUsed = brand?.[`${field}_used`];

  const initialTotal = liveTotal != null ? Number(liveTotal) : defaultTotal;
  const [used] = useState(liveUsed != null ? Number(liveUsed) : 0);
  const [total, setTotal] = useState(initialTotal);
  const [value, setValue] = useState("0");
  const [saving, setSaving] = useState(false);

  const remaining = Math.max(total - used, 0);
  const lower = label.toLowerCase();

  const handleSave = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0)
      return toast.error("Enter a valid allocation amount.");
    if (num < used)
      return toast.error(
        `Allocation can't be lower than what's already used (${fmt(used)}).`,
      );

    if (!wired) {
      toast.info(`${label} allocation isn't available to edit yet.`);
      return;
    }

    setSaving(true);
    console.log(`💾 Updating ${slug} allocation →`, num);
    const res = await updateAllocation(brandId, slug, num);
    setSaving(false);

    if (res.ok) {
      setTotal(num);
      toast.success(`${label} allocation updated.`);
    } else {
      toast.error(res.message || `Couldn't update ${lower} allocation.`);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Assign {lower} allocation to your brand.
      </p>

      {/* Remaining summary */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-gray-500">{label} Remaining</p>
          <Icon className="h-4 w-4 text-gray-300" />
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{fmt(remaining)}</p>
        <p className="mt-1 text-xs text-gray-400">
          {fmt(used)} used of {fmt(total)}
        </p>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-5">
        <label className="text-sm font-semibold text-gray-800">
          {label} Allocation
        </label>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-200 bg-surface px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
          {!wired && (
            <span className="text-xs text-gray-400">Not yet connected</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllocationTab({ brandId, brand }) {
  const [activeId, setActiveId] = useState(ALLOCATION_CONFIG[0].id);
  const active = useMemo(
    () => ALLOCATION_CONFIG.find((a) => a.id === activeId),
    [activeId],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
      {/* Sub-tab selector — wraps on desktop, scroll-x safety on small screens */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex flex-wrap gap-2">
          {ALLOCATION_CONFIG.map(({ id, label, Icon }) => {
            const isActive = id === activeId;
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? "border-blue-200 bg-blue-50 text-[#155dfc]"
                    : "border-gray-200 bg-surface text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel — keyed so state resets cleanly when switching sub-tabs */}
      {active && (
        <AllocationPanel
          key={active.id}
          brandId={brandId}
          brand={brand}
          item={active}
        />
      )}
    </div>
  );
}
