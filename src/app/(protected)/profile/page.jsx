"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Circle, Dot } from "lucide-react";

export default function ProfilePanel({ setActivePanel }) {
  const router = useRouter();
  const pathname = usePathname();
  const [billingOpen, setBillingOpen] = useState(false);

  const navigateTo = (view) => {
    setActivePanel("profile");
    router.push(`/profile/${view}`);
  };

  // Match exact path
  const isActive = (view) => pathname === `/profile/${view}`;

  // Match nested (for billing subpages)
  const isBillingActive = () => pathname.startsWith("/profile/billing");

  // Auto-open billing if already inside it
  useEffect(() => {
    if (isBillingActive()) {
      setBillingOpen(true);
    }
  }, [pathname]);

  return (
    <div>
      <h1 className="py-2 px-4">Settings</h1>
      <div className="py-10 px-4">
        <ul className="space-y-4">
          {/* Profile */}
          <li
            onClick={() => navigateTo("general")}
            className={`${
              isActive("general")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Profile
          </li>

          {/* Sessions */}
          <li
            onClick={() => navigateTo("sessions-and-password")}
            className={`${
              isActive("sessions-and-password")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Sessions & Password
          </li>

          {/* Billing Dropdown */}
          <li>
            <div
              onClick={() => setBillingOpen(!billingOpen)}
              className={`flex justify-between items-center cursor-pointer ${
                isBillingActive()
                  ? "text-[#155dfc] font-medium"
                  : "text-black"
              }`}
            >
              <span>Billing</span>
              {billingOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {billingOpen && (
              <ul className="ml-4 mt-2 space-y-2 text-sm">
                <li
                  onClick={() => navigateTo("billing/billing-one")}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isActive("billing/billing-one")
                      ? "text-[#155dfc] font-medium"
                      : "text-black"
                  }`}
                >
                  {isActive("billing/billing-one") && <Dot  />}
                  Billing 1
                </li>
                <li
                  onClick={() => navigateTo("billing/billing-two")}
                  className={`flex items-center cursor-pointer ${
                    isActive("billing/billing-two")
                      ? "text-[#155dfc] font-medium"
                      : "text-black"
                  }`}
                >
                  {isActive("billing/billing-two") && <Dot  />}
                  Billing 2
                </li>
              </ul>
            )}
          </li>

          {/* Socials */}
          <li
            onClick={() => navigateTo("socials")}
            className={`${
              isActive("socials")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Socials
          </li>

          {/* Ads */}
          <li
            onClick={() => navigateTo("ads")}
            className={`${
              isActive("ads")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Ads Integration
          </li>

          {/* Team */}
          <li
            onClick={() => navigateTo("team")}
            className={`${
              isActive("team")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Team
          </li>

          {/* Resell */}
          <li
            onClick={() => navigateTo("resell")}
            className={`${
              isActive("resell")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Resell
          </li>

          {/* Custom Domain */}
          <li
            onClick={() => navigateTo("custom-domain")}
            className={`${
              isActive("custom-domain")
                ? "text-[#155dfc] font-medium cursor-pointer"
                : "text-black cursor-pointer"
            }`}
          >
            Custom Domain
          </li>
        </ul>
      </div>
    </div>
  );
}
