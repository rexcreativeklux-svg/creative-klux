"use client";

// app/(dashboard)/page.jsx — the "/" home page (first screen after login).
// The analytics dashboard from the creativeklux-app.html prototype. The AI
// prompt composer that used to live here is now /studio/instant, reached from
// the "Instant Creation" button on My Creations.

import HomeDashboard from "@/app/(components)/home/HomeDashboard";

export default function Home() {
  return <HomeDashboard />;
}
