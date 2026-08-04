"use client";

// app/loading.js
// ─────────────────────────────────────────────────────────────────────────────
// The ROOT suspense boundary — it sits above app/layout.js's children, so it is
// the fallback for every route group at once: the dashboard, the auth screens,
// the legal pages, the standalone editor, the impersonation hand-off.
//
// That breadth is exactly why it stays neutral. It used to render the dashboard
// skeleton, which meant a sidebar and a stats grid flashed on the way to /login
// and into the full-screen editor. Anything shaped enough to be worth predicting
// is handled by a closer boundary instead:
//
//   (dashboard)/loading.js          →  the AI home ("/")
//   (dashboard)/(pages)/loading.jsx →  the generic inner-page shape
//   (dashboard)/(pages)/*/loading.jsx → per-page shapes
//   ProtectedRoutes.jsx             →  the whole-window shell, while auth resolves
//
// So by the time a user can see THIS, the app genuinely doesn't know yet which
// of those it's heading for. The spinner matches the one the auth layout uses.

export default function Loading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-page"
      role="status"
      aria-label="Loading"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-[#1447e6]" />
    </div>
  );
}
