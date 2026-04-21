
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Help({ activePanel, setActivePanel }) {
  const pathname = usePathname();

  const isActive = (view) => pathname === `/help/${view}`;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl px-5 font-black">Help</h1>
      
      <div className="py-5 px-3 flex flex-col gap-2">
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/help/tutorial-videos"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("help");
              });
            }}
            className={`block ${
              isActive("tutorial-videos") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-black cursor-pointer transition-all duration-300 py-2 rounded hover:bg-gray-50 hover:text-[#155dfc]"
            }`}
          >
            Tutorial Videos
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/help/support"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("help");
              });
            }}
            className={`block ${
              isActive("support") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-black cursor-pointer transition-all duration-300 py-2 rounded hover:bg-gray-50 hover:text-[#155dfc]"
            }`}
          >
            Support
          </Link>
        </div>
      </div>
    </div>
  );
}