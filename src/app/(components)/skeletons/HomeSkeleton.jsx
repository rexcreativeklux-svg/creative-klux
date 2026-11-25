"use client";

// app/(components)/skeletons/HomeSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Loading state for "/" — the analytics dashboard (home/HomeDashboard.jsx).
// A mirror of that page's layout, so the real cards drop into the same slots:
//
//   platform tabs ············ Inbox AI · date range
//   six number cards
//   engagement chart ········· campaigns snapshot
//   approvals · ad campaigns table · best time to post
//   top performing posts (a sideways row of post cards)
//   Smart Inbox · followers · Monday report (dark)
//
// Edit it alongside HomeDashboard.jsx. CONTENT ONLY — no sidebar or header; the
// real chrome is already mounted when this shows.

import Skeleton from "./Skeleton";

/** A white card, like the dashboard's .card. */
function Card({ className = "", style, children }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-surface ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Card heading: round icon, title and subtitle. */
function Head({ wide = 140, action = true }) {
  return (
    <div className="flex items-start gap-2.5">
      <Skeleton w={36} h={36} className="rounded-full" tone="soft" />
      <div className="flex flex-1 flex-col gap-1.5 pt-1">
        <Skeleton h={12} w={wide} />
        <Skeleton h={10} w={wide + 60} tone="soft" />
      </div>
      {action && <Skeleton h={12} w={44} tone="soft" />}
    </div>
  );
}

/** Chart line drawn faintly, so the loading frame already reads as "a chart". */
function ChartGhost() {
  return (
    <svg viewBox="0 0 700 220" preserveAspectRatio="none" className="h-[220px] w-full" aria-hidden="true">
      {[1, 55, 110, 165].map((y) => (
        <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="currentColor" className="text-gray-100" />
      ))}
      <path
        d="M0 170 C60 150 90 120 140 130 S230 175 290 150 S380 70 430 90 S520 160 580 120 S660 80 700 95 L700 220 L0 220 Z"
        className="animate-pulse fill-gray-100 motion-reduce:animate-none"
      />
      <path
        d="M0 170 C60 150 90 120 140 130 S230 175 290 150 S380 70 430 90 S520 160 580 120 S660 80 700 95"
        fill="none"
        strokeWidth="2"
        stroke="currentColor"
        className="animate-pulse text-gray-200 motion-reduce:animate-none"
      />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {boolean} [props.clearsHeader]  Reserve space for the app header.
 *   TRUE (default) when the real, FIXED header overlays this — every use inside
 *   the live layout. FALSE inside AppShellSkeleton, whose stand-in header sits
 *   in the flex flow and has already taken its own height.
 */
export default function HomeSkeleton({ clearsHeader = true }) {
  return (
    <div
      className={`flex min-h-full flex-col gap-3.5 bg-page px-3 pb-7 sm:px-5 ${clearsHeader ? "pt-[calc(var(--spacing-header)+18px)]" : "pt-[18px]"}`}
      role="status"
      aria-label="Loading your dashboard"
    >
      {/* Platform tabs · Inbox AI · date range */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton h={34} w={430} className="max-w-full rounded-[9px]" />
        <div className="ml-auto flex gap-2">
          <Skeleton h={34} w={120} className="rounded-[9px]" tone="soft" />
          <Skeleton h={34} w={170} className="rounded-[9px]" tone="soft" />
        </div>
      </div>

      {/* Six number cards */}
      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(170px,100%),1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <Skeleton w={30} h={30} className="rounded-full" tone="soft" />
              <Skeleton w={56} h={14} tone="soft" />
            </div>
            <Skeleton h={11} w={110} tone="soft" />
            <Skeleton h={24} w={80} />
          </Card>
        ))}
      </div>

      {/* Engagement chart · Campaigns snapshot */}
      <div className="flex flex-wrap gap-3.5">
        <Card className="flex min-w-0 flex-col gap-3 p-3.5" style={{ flex: "999 1 560px" }}>
          <Head wide={170} />
          <div className="flex items-center justify-between">
            <Skeleton h={32} w={260} className="rounded-[9px]" tone="soft" />
            <Skeleton h={10} w={130} tone="soft" />
          </div>
          <ChartGhost />
          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton h={10} w={80} tone="soft" />
                <Skeleton h={14} w={50} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-2.5 p-3.5" style={{ flex: "1 1 340px" }}>
          <Head wide={150} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-gray-100 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <Skeleton h={12} w={150} />
                <Skeleton h={18} w={58} className="rounded-full" tone="soft" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton h={10} tone="soft" />
                <Skeleton h={10} tone="soft" />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Approvals · Ad campaigns table · Best time to post */}
      <div className="flex flex-wrap gap-3.5">
        <Card className="flex flex-col gap-2.5 p-3.5" style={{ flex: "1 1 360px" }}>
          <Head wide={150} action={false} />
          <Skeleton h={150} className="rounded-[10px]" tone="soft" />
        </Card>
        <Card className="flex min-w-0 flex-col gap-2 py-3.5" style={{ flex: "2 1 540px" }}>
          <div className="px-3.5"><Head wide={120} /></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-gray-100 px-3.5 py-2 last:border-0">
              <Skeleton w={28} h={28} className="rounded-md" tone="soft" />
              <Skeleton h={11} className="flex-1" />
              <Skeleton h={11} w={50} tone="soft" />
              <Skeleton h={18} w={64} className="rounded-full" tone="soft" />
              <Skeleton h={11} w={40} tone="soft" />
            </div>
          ))}
        </Card>
        <Card className="flex flex-col gap-2.5 p-3.5" style={{ flex: "1 1 300px" }}>
          <Head wide={130} action={false} />
          <div className="grid grid-cols-[32px_repeat(6,minmax(0,1fr))] gap-[3px]">
            {Array.from({ length: 49 }).map((_, i) =>
              i % 7 === 0 ? <Skeleton key={i} h={10} w={24} tone="soft" /> : <Skeleton key={i} h={20} className="rounded" tone={i % 3 ? "soft" : undefined} />,
            )}
          </div>
        </Card>
      </div>

      {/* Top performing posts */}
      <Card className="flex flex-col gap-3 p-3.5">
        <Head wide={160} />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-[236px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200">
              <div className="flex flex-col gap-1.5 px-3 py-2.5">
                <Skeleton h={10} w={90} tone="soft" />
                <Skeleton h={12} w={180} />
              </div>
              <div className="grid grid-cols-4 gap-1 px-2 pb-2.5">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="flex flex-col items-center gap-1">
                    <Skeleton w={26} h={26} className="rounded-full" tone="soft" />
                    <Skeleton w={30} h={10} tone="soft" />
                  </div>
                ))}
              </div>
              <Skeleton h={176} rounded="0" tone="soft" />
            </div>
          ))}
        </div>
      </Card>

      {/* Smart Inbox · Followers · Monday report */}
      <div className="flex flex-wrap gap-3.5">
        <Card className="flex flex-col gap-2.5 p-3.5" style={{ flex: "1 1 340px" }}>
          <Head wide={100} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-[10px] border border-gray-100 p-2">
              <Skeleton w={32} h={32} className="rounded-full" tone="soft" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton h={11} w={150} />
                <Skeleton h={10} tone="soft" />
              </div>
              <Skeleton h={18} w={64} className="rounded-full" tone="soft" />
            </div>
          ))}
        </Card>
        <Card className="flex flex-col gap-3 p-3.5" style={{ flex: "1 1 300px" }}>
          <Head wide={150} action={false} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton w={18} h={18} className="rounded" tone="soft" />
              <Skeleton h={10} w={70} tone="soft" />
              <Skeleton h={6} className="flex-1 rounded-full" tone="soft" />
              <Skeleton h={10} w={40} tone="soft" />
            </div>
          ))}
        </Card>
        {/* Monday report is the page's one dark card, so its placeholder is dark too. */}
        <div className="flex flex-col gap-3 rounded-xl bg-[#0b1533] p-3.5" style={{ flex: "1 1 300px" }}>
          <div className="flex items-center justify-between">
            <span className="h-3.5 w-28 animate-pulse rounded bg-white/20 motion-reduce:animate-none" />
            <span className="h-5 w-32 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
          </div>
          {[100, 92, 96, 60].map((w, i) => (
            <span key={i} className="h-3 animate-pulse rounded bg-white/15 motion-reduce:animate-none" style={{ width: `${w}%` }} />
          ))}
          <span className="mt-auto h-8 w-32 animate-pulse rounded-[9px] bg-white/80 motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
