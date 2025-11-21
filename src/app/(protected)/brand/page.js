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
      <h1 className="text-2xl px-7 font-medium">Brand</h1>
      
      <div className="py-3 px-5 flex flex-col gap-4">
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
                : "text-black cursor-pointer hover:text-[#155dfc]"
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
                : "text-black cursor-pointer hover:text-[#155dfc]"
            }`}
          >
            BrandKits
          </Link>
        </div>
      </div>
    </div>
  );
}