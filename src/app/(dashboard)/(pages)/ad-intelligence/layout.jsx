"use client";

/**
 * Ad Intelligence section layout (/ad-intelligence/*)
 * Wraps every Ad Intelligence tool in the shared SectionLayout shell so they
 * all share the same secondary sidebar. Add a tool here to surface it in the
 * section nav.
 */

import SectionLayout from "@/app/(components)/SectionLayout";
import {
  Lightbulb,
  Search,
  ShieldCheck,
  Star,
  GitCompareArrows,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Ad Performance",
    href: "/ad-intelligence/ad-performance",
    icon: Lightbulb,
  },
  { label: "Market Spy", href: "/ad-intelligence/market-spy", icon: Search },
  {
    label: "Ad Guard AI",
    href: "/ad-intelligence/ad-guard-ai",
    icon: ShieldCheck,
  },
  { label: "Ad Scorer AI", href: "/ad-intelligence/ad-scorer-ai", icon: Star },
  {
    label: "Creative Comparison",
    href: "/ad-intelligence/creative-comparison",
    icon: GitCompareArrows,
  },
];

export default function AdIntelligenceLayout({ children }) {
  return (
    <SectionLayout title="Ad Intelligence" items={NAV_ITEMS}>
      {children}
    </SectionLayout>
  );
}
