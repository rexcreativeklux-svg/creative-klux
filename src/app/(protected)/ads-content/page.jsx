// app/(protected)/ads-content/page.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdsContent({ activePanel, setActivePanel }) {
  const pathname = usePathname();

  const isActive = (view) => pathname === `/ads-content/${view}`;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-2xl px-7 font-medium">Ads Content</h1>
      
      <div className="py-3 px-5 flex flex-col gap-4">
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/ads-content/created-ads"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("ads");
              });
            }}
            className={`block ${
              isActive("created-ads") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-black cursor-pointer hover:text-[#155dfc]"
            }`}
          >
            Created Ads
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/ads-content/ads-planner"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("ads");
              });
            }}
            className={`block ${
              isActive("ads-planner") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-black cursor-pointer hover:text-[#155dfc]"
            }`}
          >
            Planner
          </Link>
        </div>
      </div>
    </div>
  );
}