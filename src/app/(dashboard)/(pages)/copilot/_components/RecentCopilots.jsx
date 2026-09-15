"use client";

/**
 * RecentCopilots — the three newest copilots, under the sidebar's Designs tab.
 *
 * Reads the same store as the Copilot tab's Recents and /copilot/all
 * (../_data/copilots), so whichever mounts first fires `GET /copilots` and the
 * rest join it — switching tabs never refetches, and a copilot created or
 * deleted anywhere shows up here the same instant.
 *
 * ⚠️ NEWEST CREATED, NOT NEWEST EDITED. The Copilot tab's Recents is a slice of
 * the catalog in the server's order; this one sorts on `created_at` itself, so
 * renaming an old copilot does not push a new one out of the list. Sorted on a
 * COPY — the store's array is shared, and Array#sort mutates in place.
 *
 * @param {Object} props
 * @param {() => void} [props.onNavigate] Called when a link is followed, so the
 *   mobile drawer holding this can close itself (see Sidebar.jsx).
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavSection from "./NavSection";
import CopilotAvatar from "./CopilotAvatar";
import { useCopilotsState, RECENTS_LIMIT } from "../_data/copilots";

/** A row with no timestamp sorts last: an unknown date is not the newest. */
const createdAt = (copilot) => {
  const at = Date.parse(copilot?.created_at ?? "");
  return Number.isNaN(at) ? -Infinity : at;
};

const byNewest = (a, b) =>
  createdAt(b) - createdAt(a) || (Number(b.id) || 0) - (Number(a.id) || 0);

const emptyNote =
  "mt-1 rounded-xl border border-gray-200 px-3 py-4 text-center text-[11px] leading-relaxed text-gray-400";

/** Row-shaped placeholders, so the rail doesn't jump when the list lands. */
function RowsSkeleton() {
  return (
    <div className="mt-0.5 flex flex-col" aria-hidden="true">
      {Array.from({ length: RECENTS_LIMIT }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2">
          <span className="h-5 w-5 shrink-0 rounded-md bg-gray-200 animate-pulse" />
          <span className="h-3 flex-1 rounded bg-gray-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function RecentCopilots({ onNavigate }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const { items, loading, error } = useCopilotsState();

  const recents = [...items].sort(byNewest).slice(0, RECENTS_LIMIT);

  return (
    <NavSection label="Copilot" open={open} onToggle={() => setOpen((p) => !p)}>
      {loading ? (
        <RowsSkeleton />
      ) : error ? (
        <p className={emptyNote}>Couldn&apos;t load your copilots.</p>
      ) : recents.length ? (
        <div className="mt-0.5 flex flex-col">
          {recents.map((copilot) => {
            const active = pathname?.startsWith(`/copilot/${copilot.id}`);
            return (
              <Link
                key={copilot.id}
                href={`/copilot/${copilot.id}`}
                onClick={onNavigate}
                title={copilot.description || copilot.name}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <CopilotAvatar copilot={copilot} size="sm" />
                <span className="truncate">{copilot.name}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className={emptyNote}>No copilots yet.</p>
      )}

      {/* Shown in every state: it is also the way to the error's Try again and
          to Create copilot when the list is empty. */}
      <Link
        href="/copilot/all"
        onClick={onNavigate}
        className="block px-3 pt-1.5 text-[12px] text-gray-500 underline underline-offset-2 hover:text-gray-900 transition-colors"
      >
        View all
      </Link>
    </NavSection>
  );
}
