"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FolderKanban,
  BrainCircuit,
  Wand2,
  Settings,
  HelpCircle,
  Power,
  ChevronDown,
  Palette,
  Layers,
  Megaphone,
  Share2,
  TrendingUp,
  Sparkles,
  Workflow,
  PackagePlus,
  ShoppingCart,
  CreditCard,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Activity,
  Brain,
  ShieldCheck,
  Radar,
  TrendingUpDownIcon,
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
  // const [openDropdowns, setOpenDropdowns] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);


  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setShowLogoutModal(false);
    }
  };

  const toggleDropdown = (id, e) => {
    e.preventDefault();

    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => {
        setOpenDropdown(id);
      }, 250);
      return;
    }

    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const allDropdowns = [...mainNavItems, ...bottomNavItems]
      .filter((item) => item.type === "dropdown");

    for (const item of allDropdowns) {
      if (item.children?.some((c) => isActive(c.href))) {
        setOpenDropdown(item.id);
        break;
      }
    }
  }, [pathname]);


  const isActive = (href) =>
    pathname === href || pathname?.startsWith(href + "/");

  const isDropdownActive = (children) =>
    children?.some((c) => isActive(c.href));

  // ── Nav config ─────────────────────────────────────────────────
  const mainNavItems = [
    {
      id: "brand",
      label: "BrandKit",
      href: "/brand/reuse",
      icon: FaTrello,
      type: "link",
    },
    {
      id: "creatives",
      label: "Creatives",
      href: "/creatives",
      icon: PackagePlus,
      type: "link",
    },
    {
      id: "ads",
      label: "Ads Content",
      icon: Megaphone,
      type: "dropdown",
      children: [
        { label: "Created Ads", href: "/created-ads", icon: Megaphone },
        { label: "Ads Planner", href: "/ads-planner", icon: Calendar },
      ],
    },
    {
      id: "social",
      label: "Social Content",
      icon: Share2,
      type: "dropdown",
      children: [
        { label: "Created Socials", href: "/social-socials", icon: Share2 },
        { label: "Social Planner", href: "/social-planner", icon: Calendar },
      ],
    },
    {
      id: "analyze",
      label: "Analyze",
      icon: BarChart3,
      type: "dropdown",
      children: [
        { label: "Brand Pulse", href: "/brandPulse", icon: Activity },
        { label: "Creative IQ", href: "/creativeIQ", icon: Brain },
      ],
    },
      {
      id: "predict",
      label: "Predict",
      icon: TrendingUp,
      type: "dropdown",
      children: [
        { label: "AdGuard", href: "/adGuard", icon: ShieldCheck },
        { label: "Rival Lens", href: "/rivalLens", icon: Radar },
      ],
    },
    {
      id: "integrations",
      label: "Integrations",
      href: "/integrations",
      icon: Workflow,
      type: "link",
    },
    // {
    //   id: "analyze",
    //   label: "Analyze",
    //   href: "/analyze",
    //   icon: TrendingUp,
    //   type: "link",
    // },
    // {
    //   id: "predict",
    //   label: "Predict",
    //   href: "/predict",
    //   icon: BrainCircuit,
    //   type: "link",
    // },
    // {
    //   id: "retouch",
    //   label: "Retouch",
    //   href: "/retouch",
    //   icon: Wand2,
    //   type: "link",
    // },
  ];

  const bottomNavItems = [
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      type: "dropdown",
      children: [
        { label: "Profile", href: "/profile", icon: Layers },
        { label: "Custom Domain", href: "/custom-domain", icon: Share2 },
        { label: "Resell", href: "/resell", icon: ShoppingCart },
        { label: "Billing", href: "/billing", icon: CreditCard },
      ],
    },

    { id: "help", label: "Help", href: "/help", icon: HelpCircle, type: "link" },
  ];

  // ── Shared classes ─────────────────────────────────────────────
  const itemBase =
    "flex items-center gap-3 w-full rounded-lg transition-all duration-150 text-sm font-medium";
  const itemPadding = isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center";
  const activeClass = "bg-gray-100 text-blue-600";
  const defaultClass = "text-gray-600 hover:bg-gray-50 cursor-pointer hover:text-gray-900";

  // ── Link item ──────────────────────────────────────────────────
  const renderLink = ({ id, href, icon: Icon, label }) => {
    const active = isActive(href);
    return (
      <Link
        key={id}
        href={href}
        title={!isOpen ? label : undefined}
        className={`${itemBase} ${itemPadding} ${active ? activeClass : defaultClass}`}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        {isOpen && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  // ── Dropdown item ──────────────────────────────────────────────
  const renderDropdown = ({ id, icon: Icon, label, children }) => {
    const dropOpen = openDropdown === id;

    const dropActive = isDropdownActive(children);

    return (
      <div key={id} className="relative">
        <button
          onClick={(e) => toggleDropdown(id, e)}
          title={!isOpen ? label : undefined}
          className={`${itemBase} ${itemPadding} ${dropActive ? activeClass : defaultClass} cursor-pointer`}
        >
          <Icon className="h-[18px] w-[18px] flex-shrink-0" />
          {isOpen && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${dropOpen ? "rotate-[-90deg]" : ""
                  }`}
              />
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
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all duration-150 ${childActive
                    ? "text-[#155dfc] font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Flyout tooltip — sidebar collapsed */}
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
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${isActive(child.href) ? "text-[#155dfc] font-semibold" : "text-gray-700"
                    }`}
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

  const renderItem = (item) =>
    item.type === "link" ? renderLink(item) : renderDropdown(item);

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
        <div className={`flex-1 overflow-y-auto cursor-pointer overflow-x-hidden py-3 flex flex-col gap-0.5 ${isOpen ? "px-3" : "px-2"}`}>
          {mainNavItems.map(renderItem)}

          <div className="my-2 border-t border-gray-100" />


        </div>

        {/* Logout */}
        <div className={`flex-shrink-0 border-t border-gray-100 py-3 ${isOpen ? "px-3" : "px-2"}`}>
          {bottomNavItems.map(renderItem)}

          <button
            onClick={() => setShowLogoutModal(true)}
            title={!isOpen ? "Logout" : undefined}
            className={`${itemBase} ${itemPadding} text-red-500 cursor-pointer hover:bg-red-50 hover:text-red-600 group`}
          >
            <Power className="h-[18px] w-[18px] flex-shrink-0 group-hover:animate-pulse" />
            {isOpen && <span className="truncate">Logout</span>}
          </button>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around items-center py-2 md:hidden">
        {[...mainNavItems, ...bottomNavItems].map((item) => {
          const { id, label, icon: Icon, href, type, children } = item;
          const isDropOpen = openDropdown === id;

          if (type === "link") {
            return (
              <Link
                key={id}
                href={href}
                className={`flex flex-col items-center text-xs p-2 rounded-lg ${isActive(href) ? "text-[#155dfc]" : "text-gray-500"
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5 font-medium">{label}</span>
              </Link>
            );
          }

          return (
            <div key={id} className="relative">
              <button
                onClick={(e) => toggleDropdown(id, e)}
                className={`flex flex-col items-center text-xs p-2 rounded-lg ${isDropOpen || isDropdownActive(children) ? "text-[#155dfc]" : "text-gray-500"
                  }`}
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
                        className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${isActive(child.href) ? "text-[#155dfc] font-semibold" : "text-gray-700"
                          }`}
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
        })}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex flex-col items-center text-xs p-2 rounded-lg text-red-500"
        >
          <Power className="h-5 w-5" />
          <span className="mt-0.5 font-medium">Logout</span>
        </button>
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