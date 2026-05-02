"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  HelpCircle,
  Power,
  Megaphone,
  Share2,
  TrendingUp,
  Workflow,
  PackagePlus,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Activity,
  Brain,
  ShieldCheck,
  Radar,
  ChevronRight,
  ChevronDown,
  User,
  Globe,
  Calendar,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import LogoutModal from "./LogoutModal";
import { FaTrello } from "react-icons/fa";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBottomMenu, setShowBottomMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const bottomMenuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setShowLogoutModal(false);
    }
  };

  const isActive = (href) =>
    pathname === href || pathname?.startsWith(href + "/");

  const isDropdownActive = (children) => children?.some((c) => isActive(c.href));

  const toggleDropdown = (id, e) => {
    e.preventDefault();
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => setOpenDropdown(id), 250);
      return;
    }
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  // Auto-open dropdown if a child is active
  useEffect(() => {
    const dropdownItems = [
      { id: "social", children: [{ href: "/created-socials" }, { href: "/social-planner" }] },
      { id: "ads", children: [{ href: "/created-ads" }, { href: "/ads-planner" }] },
    ];

    for (const item of dropdownItems) {
      if (item.children.some((c) => isActive(c.href))) {
        setOpenDropdown(item.id);
        break;
      }
    }
  }, [pathname]);

  // Close bottom menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bottomMenuRef.current && !bottomMenuRef.current.contains(e.target)) {
        setShowBottomMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Nav sections ───────────────────────────────────────────────
  const createItems = [
    { id: "brand", label: "BrandKits", href: "/brand/reuse", icon: FaTrello },
    { id: "creatives", label: "Creatives", href: "/creatives", icon: PackagePlus },
  ];

  const insightsItems = [
    // { id: "brandPulse", label: "Brand Pulse", href: "/brandPulse", icon: Activity },
    // { id: "creativeIQ", label: "Creative IQ", href: "/creativeIQ", icon: Brain },
    { id: "creative-insights", label: "Creative Insights", href: "/creative-insights", icon: Activity },
    { id: "competitor", label: "Competitor Insights", href: "/competitor-insights", icon: Radar },
  ];

  const toolsItems = [
    // { id: "adGuard", label: "AdGuard", href: "/adGuard", icon: ShieldCheck },
    // { id: "rivalLens", label: "Rival Lens", href: "/rivalLens", icon: Radar },

    { id: "compliance", label: "Compliance Checker", href: "/compliance-checker", icon: ShieldCheck },
    { id: "creative-scoring", label: "Creative Scoring AI", href: "/creative-scoring-ai", icon: Brain },





  ];

  const manageItems = [
    {
      id: "social",
      label: "Social Content",
      icon: Share2,
      type: "dropdown",
      children: [
        { label: " Publishing", href: "/social-publishing", icon: Share2 },
        { label: " Calendar", href: "/social-calendar", icon: Calendar },
        { label: "Analytics", href: "/social-analytics", icon: Activity },
      ],
    },
    {
      id: "ads",
      label: "Ads Content",
      icon: Megaphone,
      type: "dropdown",
      children: [
        { label: "Publishing", href: "/ads-publishing", icon: Megaphone },
        { label: "Calendar", href: "/ads-calendar", icon: Calendar },
        { label: "Analytics", href: "/ads-analytics", icon: Activity },
      ],
    },
    {
      id: "integrations",
      label: "Integrations",
      href: "/integrations",
      icon: Workflow,
      type: "link",
    },
  ];

  const bottomMenuLinks = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Custom Domain", href: "/custom-domain", icon: Globe },
    { label: "Resell", href: "/resell", icon: ShoppingCart },
    { label: "Billing", href: "/billing", icon: CreditCard },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help", href: "/help", icon: HelpCircle },
  ];

  // ── Link item ──────────────────────────────────────────────────
  const renderNavItem = ({ id, href, icon: Icon, label, badge }) => {
    const active = isActive(href);
    return (
      <Link
        key={id}
        href={href}
        className={`
          group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium
          transition-all duration-150
          ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
          ${!isOpen ? "justify-center px-0" : ""}
        `}
        title={!isOpen ? label : undefined}
      >
        <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`} />
        {isOpen && <span className="flex-1 truncate">{label}</span>}
        {isOpen && badge && (
          <span className="text-[10px] font-semibold bg-rose-500 text-white px-1.5 py-0.5 rounded-full leading-none">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  // ── Dropdown item ──────────────────────────────────────────────
  const renderDropdownItem = ({ id, icon: Icon, label, children }) => {
    const dropOpen = openDropdown === id;
    const dropActive = isDropdownActive(children);

    return (
      <div key={id} className="relative">
        <button
          onClick={(e) => toggleDropdown(id, e)}
          title={!isOpen ? label : undefined}
          className={`
            group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer
            transition-all duration-150
            ${dropActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
            ${!isOpen ? "justify-center px-0" : ""}
          `}
        >
          <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${dropActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`} />
          {isOpen && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${dropOpen ? "-rotate-90" : ""}`} />
            </>
          )}
        </button>

        {/* Accordion — sidebar open */}
        {isOpen && dropOpen && (
          <div className="mt-0.5 ml-4 pl-3 border-l-2 border-gray-200 flex flex-col gap-0.5 pb-1">
            {children.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isActive(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all duration-150
                    ${childActive ? "text-blue-600 font-semibold" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                >
                  <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Flyout — sidebar collapsed */}
        {!isOpen && dropOpen && (
          <div className="absolute left-full top-0 z-50 ml-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 py-1.5 border-b border-gray-100 mb-1">
              {label}
            </p>
            {children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setOpenDropdown(null)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50
                    ${isActive(child.href) ? "text-blue-600 font-semibold" : "text-gray-700"}`}
                >
                  <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Route to correct renderer ──────────────────────────────────
  const renderItem = (item) =>
    item.type === "dropdown" ? renderDropdownItem(item) : renderNavItem(item);

  const renderSection = (title, items) => (
    <div className="flex flex-col gap-0.5">
      {isOpen && (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1 mt-1">
          {title}
        </p>
      )}
      {!isOpen && <div className="my-1 border-t border-gray-100 mx-2" />}
      {items.map(renderItem)}
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      <nav
        className={`
          hidden md:flex md:flex-col shrink-0
          h-screen bg-white border-r border-gray-100
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "w-56" : "w-15"}
        `}
      >
        {/* Logo row */}
        <div
          className={`flex items-center h-16 flex-shrink-0 border-b border-gray-100 cursor-pointer
            ${isOpen ? "px-4" : "justify-center px-0"}
          `}
          onClick={() => router.push("/")}
        >
          <img
            src="/logoblue.svg"
            alt="Logo"
            className="w-7 h-7 flex-shrink-0"
            loading="lazy"
          />
          {isOpen && (
            <span className="ml-3 font-semibold text-gray-900 text-sm truncate">
              Creative Klux
            </span>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden py-3 flex flex-col gap-3 ${isOpen ? "px-3" : "px-2"}`}>
          {renderSection("Create", createItems)}
          {renderSection("Manage", manageItems)}
          {renderSection("Insights", insightsItems)}
          {renderSection("Tools", toolsItems)}

        </div>

        {/* Bottom user area */}
        <div ref={bottomMenuRef} className={`flex-shrink-0 border-t border-gray-100 relative ${isOpen ? "px-3 py-3" : "px-2 py-3"}`}>
          {/* Bottom popup menu */}
          {showBottomMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="py-1.5">
                {bottomMenuLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowBottomMenu(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50
                      ${isActive(href) ? "text-blue-600 font-semibold" : "text-gray-700"}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { setShowBottomMenu(false); setShowLogoutModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                  >
                    <Power className="h-4 w-4 flex-shrink-0" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User button */}
          <button
            onClick={() => setShowBottomMenu((p) => !p)}
            className={`
              flex items-center w-full rounded-xl transition-all duration-150 cursor-pointer
              ${showBottomMenu ? "bg-gray-100" : "hover:bg-gray-50"}
              ${isOpen ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5"}
            `}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
              CK
            </div>
            {isOpen && (
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">Creative Klux</p>
                <p className="text-xs text-blue-500 font-medium truncate leading-tight">Pro Plan</p>
              </div>
            )}
            {isOpen && (
              <ChevronRight className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${showBottomMenu ? "-rotate-4" : "rotate-90"}`} />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around items-center py-2 md:hidden">
        {[...createItems, ...manageItems.slice(0, 2), ...insightsItems]
          .map((item) => {
            const { id, label, icon: Icon, href, type, children } = item;
            const isDropOpen = openDropdown === id;

            if (type === "dropdown") {
              return (
                <div key={id} className="relative">
                  <button
                    onClick={(e) => toggleDropdown(id, e)}
                    className={`flex flex-col items-center text-xs p-2 rounded-lg ${isDropOpen || isDropdownActive(children) ? "text-blue-600" : "text-gray-500"}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mt-0.5 font-medium">{label}</span>
                  </button>
                  {isDropOpen && (
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-3 py-1.5 border-b border-gray-100">
                        {label}
                      </p>
                      {children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${isActive(child.href) ? "text-blue-600 font-semibold" : "text-gray-700"}`}
                          >
                            <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={id}
                href={href}
                className={`flex flex-col items-center text-xs p-2 rounded-lg ${isActive(href) ? "text-blue-600" : "text-gray-500"}`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5 font-medium">{label}</span>
              </Link>
            );
          })}

        <div ref={bottomMenuRef} className="relative">
          <button
            onClick={() => setShowBottomMenu((p) => !p)}
            className="flex flex-col items-center text-xs p-2 rounded-lg text-gray-500"
          >
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[8px] font-bold">
              CK
            </div>
            <span className="mt-0.5 font-medium">Account</span>
          </button>

          {showBottomMenu && (
            <div className="absolute bottom-14 right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-3 py-1.5 border-b border-gray-100">
                Account
              </p>
              {bottomMenuLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowBottomMenu(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${isActive(href) ? "text-blue-600 font-semibold" : "text-gray-700"}`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { setShowBottomMenu(false); setShowLogoutModal(true); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 w-full"
                >
                  <Power className="h-3.5 w-3.5 flex-shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Sidebar;