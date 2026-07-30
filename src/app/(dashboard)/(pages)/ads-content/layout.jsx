"use client";

/**
 * Ads Content section layout (/ads-content/*)
 * Wraps the ads pages (Publishing / Calendar / Analytics) in the shared
 * SectionLayout shell so they all share the same secondary sidebar.
 */

import SectionLayout from "@/app/(components)/SectionLayout";
import { Megaphone, Calendar, Activity } from "lucide-react";

const NAV_ITEMS = [
  { label: "Publishing", href: "/ads-content/publishing", icon: Megaphone },
  { label: "Calendar", href: "/ads-content/calendar", icon: Calendar },
  { label: "Analytics", href: "/ads-content/analytics", icon: Activity },
];

export default function AdsContentLayout({ children }) {
  return (
    <SectionLayout title="Ads Content" items={NAV_ITEMS}>
      {children}
    </SectionLayout>
  );
}
