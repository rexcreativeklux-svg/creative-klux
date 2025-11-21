// app/(protected)/creatives/page.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Creatives({ activePanel, setActivePanel }) {
  const pathname = usePathname();

  const isActive = (view) => {
    return pathname.startsWith(`/creatives/${view}`);
  };

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-2xl px-7 font-medium">Creatives</h1>
      
      <div className="py-3 px-5 flex flex-col gap-4">
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/creatives/ads-creatives"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("projects");
              });
            }}
            className={`block ${
              isActive("ads-creatives")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            } px-3 py-2 rounded hover:bg-gray-100 transition-colors`}
          >
            Ads Creative
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/creatives/social-creatives"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("projects");
              });
            }}
            className={`block ${
              isActive("social-creatives")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            } px-3 py-2 rounded hover:bg-gray-100 transition-colors`}
          >
            Social Creative
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/creatives/designer-creatives"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("projects");
              });
            }}
            className={`block ${
              isActive("designer-creatives")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            } px-3 py-2 rounded hover:bg-gray-100 transition-colors`}
          >
            Designer Creative
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/creatives/ai-studio"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("projects");
              });
            }}
            className={`block ${
              isActive("ai-studio")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            } px-3 py-2 rounded hover:bg-gray-100 transition-colors`}
          >
            Magic Studio
          </Link>
        </div>
      </div>
    </div>
  );
}