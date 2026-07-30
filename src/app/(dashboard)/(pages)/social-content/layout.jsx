"use client";

/**
 * Social Content section layout (/social-content/*)
 * Wraps the social pages (Publishing / Calendar / Analytics) in the shared
 * SectionLayout shell so they all share the same secondary sidebar.
 */

import SectionLayout from "@/app/(components)/SectionLayout";
import { Share2, Calendar, Activity } from "lucide-react";

const NAV_ITEMS = [
  { label: "Publishing", href: "/social-content/publishing", icon: Share2 },
  { label: "Calendar", href: "/social-content/calendar", icon: Calendar },
  { label: "Analytics", href: "/social-content/analytics", icon: Activity },
];

export default function SocialContentLayout({ children }) {
  return (
    <SectionLayout title="Social Content" items={NAV_ITEMS}>
      {children}
    </SectionLayout>
  );
}
