"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Dot } from "lucide-react";

export default function ProfilePanel({ setActivePanel }) {
  const router = useRouter();
  const pathname = usePathname();

  const [billingOpen, setBillingOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  const navigateTo = (view) => {
    setActivePanel("settings");
    router.push(`/settings/${view}`);
  };

  const isActive = (view) => pathname === `/settings/${view}`;
  const isBillingActive = () => pathname.startsWith("/settings/billing");
  const isIntegrationsActive = () => 
    pathname.startsWith("/settings/socials") || 
    pathname.startsWith("/settings/ads");

  // Auto-open dropdowns when inside their section
  useEffect(() => {
    if (isBillingActive()) setBillingOpen(true);
    if (isIntegrationsActive()) setIntegrationsOpen(true);
  }, [pathname]);

  return (
    <div>
      <h1 className="py-2 text-xl font-bold px-4">Settings</h1>
      <div className="py-8 px-4">
        <ul className="space-y-4">

          {/* Profile */}
          <li
            onClick={() => navigateTo("general")}
            className={`cursor-pointer ${
              isActive("general")
                ? "text-[#155dfc] font-medium"
                : "text-black hover:underline"
            }`}
          >
            Profile
          </li>

          {/* Sessions & Password */}
          <li
            onClick={() => navigateTo("sessions-and-password")}
            className={`cursor-pointer ${
              isActive("sessions-and-password")
                ? "text-[#155dfc] font-medium"
                : "text-black hover:underline"
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
                  : "text-black hover:underline"
              }`}
            >
              <span>Billing</span>
              {billingOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {billingOpen && (
              <ul className="ml-6 mt-2 space-y-2 text-sm">
                <li
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo("billing/billing-one");
                  }}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isActive("billing/billing-one")
                      ? "text-[#155dfc] font-medium"
                      : "text-black hover:underline"
                  }`}
                >
                  {isActive("billing/billing-one") && <Dot size={20} />}
                  Billing 1
                </li>
                <li
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo("billing/billing-two");
                  }}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isActive("billing/billing-two")
                      ? "text-[#155dfc] font-medium"
                      : "text-black hover:underline"
                  }`}
                >
                  {isActive("billing/billing-two") && <Dot size={20} />}
                  Billing 2
                </li>
              </ul>
            )}
          </li>

          {/* Integrations Dropdown */}
          <li>
            <div
              onClick={() => setIntegrationsOpen(!integrationsOpen)}
              className={`flex justify-between items-center cursor-pointer ${
                isIntegrationsActive()
                  ? "text-[#155dfc] font-medium"
                  : "text-black hover:underline"
              }`}
            >
              <span>Integrations</span>
              {integrationsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {integrationsOpen && (
              <ul className="ml-6 mt-2 space-y-2 text-sm">
                <li
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo("socials");
                  }}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isActive("socials")
                      ? "text-[#155dfc] font-medium"
                      : "text-black hover:underline"
                  }`}
                >
                  {isActive("socials") && <Dot size={20} />}
                  Socials Integration
                </li>
                <li
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo("ads");
                  }}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isActive("ads")
                      ? "text-[#155dfc] font-medium"
                      : "text-black hover:underline"
                  }`}
                >
                  {isActive("ads") && <Dot size={20} />}
                  Ads Integration
                </li>
              </ul>
            )}
          </li>

          {/* Team */}
          <li
            onClick={() => navigateTo("team")}
            className={`cursor-pointer ${
              isActive("team")
                ? "text-[#155dfc] font-medium"
                : "text-black hover:underline"
            }`}
          >
            Team
          </li>

          {/* Resell */}
          <li
            onClick={() => navigateTo("resell")}
            className={`cursor-pointer ${
              isActive("resell")
                ? "text-[#155dfc] font-medium"
                : "text-black hover:underline"
            }`}
          >
            Resell
          </li>

        </ul>
      </div>
    </div>
  );
}