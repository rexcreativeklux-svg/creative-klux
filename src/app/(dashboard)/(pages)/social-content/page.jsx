// app/(protected)/social-content/page.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SocialContent({ activePanel, setActivePanel }) {
  const pathname = usePathname();

  const isActive = (view) => pathname === `/social-content/${view}`;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl px-5 font-black">Social Content</h1>
      
      <div className="py-5 px-3 flex flex-col gap-2">
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/social-content/created-socials"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("social");
              });
            }}
            className={`block ${
              isActive("created-socials") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-black cursor-pointer  transition-all duration-300 px-2 py-2 rounded hover:bg-gray-50 hover:text-[#155dfc]"
            }`}
          >
            Created Socials
          </Link>
        </div>
        
        <div>
          {/* ✅ FIXED: Use Link instead of button + router.push */}
          <Link
            href="/social-content/social-planner"
            onClick={() => {
              // Keep panel open asynchronously (doesn't block navigation)
              requestAnimationFrame(() => {
                setActivePanel("social");
              });
            }}
            className={`block ${
              isActive("social-planner") 
                ? "text-[#155dfc] font-medium cursor-pointer" 
                : "text-black cursor-pointer transition-all duration-300 px-2 py-2 rounded hover:bg-gray-50 hover:text-[#155dfc]"
            }`}
          >
            Planner
          </Link>
        </div>
      </div>
    </div>
  );
}