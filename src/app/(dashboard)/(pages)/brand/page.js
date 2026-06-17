// app/brand/page.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/context/BrandContext";

export default function Brand({ activePanel, setActivePanel }) {
  const { setActiveBrand, brands, setShowModal, handleUseBrand } = useBrand();
  const pathname = usePathname();

  const isActive = (view) => pathname === `/brand/${view}`;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl px-3 font-black">Brand</h1>
      
      <div className="py-5 px-3 flex flex-col gap-2">
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/brand/create"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("brand");
              });
            }}
            className={`block ${
              isActive("create") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-gray-900 cursor-pointer transition-all duration-300 py-2 rounded hover:bg-gray-50 hover:text-[#155dfc]"
            }`}
          >
            Create BrandKit
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/brand/reuse"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("brand");
              });
            }}
            className={`block ${
              isActive("reuse") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-gray-900 cursor-pointer transition-all duration-300 py-2 rounded hover:bg-gray-50 hover:text-[#155dfc]"
            }`}
          >
            BrandKits
          </Link>
        </div>
      </div>
    </div>
  );
}