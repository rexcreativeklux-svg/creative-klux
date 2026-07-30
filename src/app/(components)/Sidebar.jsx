"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

import {
  HelpCircle,
  Power,
  Megaphone,
  Share2,
  Workflow,
  ShoppingCart,
  CreditCard,
  ChevronRight,
  User,
  LayoutDashboard,
  LayoutGrid,
  Palette,
  Folder,
  Star,
  Bot,
  Brain,
  Home,
  BookImage,
  Sparkles,
  Image,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import LogoutModal from "./LogoutModal";
import ThemeSwitcher from "./ThemeSwitcher";

/**
 * @param {Object}  props
 * @param {boolean} props.isOpen      Expanded/collapsed state (normal mode)
 * @param {Function} props.setIsOpen  Setter for `isOpen` (kept for API compat)
 * @param {boolean} [props.overlayMode] Section routes (secondary sidebar pages):
 *   the sidebar stays collapsed in the layout flow and instead expands as a
 *   floating overlay ON TOP of the secondary sidebar — on hover (auto-closes
 *   on mouse-out) or held open while `pinned`. Item tooltips are disabled
 *   here since hovering reveals the full sidebar anyway.
 * @param {boolean} [props.pinned]    Overlay mode only: header toggle pinned
 *   the overlay open, so it survives mouse-out until unpinned.
 */
const Sidebar = ({
  isOpen: isOpenProp,
  setIsOpen,
  overlayMode = false,
  pinned = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // Overlay mode: hovering the collapsed strip expands the sidebar.
  const [hovered, setHovered] = useState(false);
  // What the render tree treats as "expanded". In overlay mode the layout keeps
  // the in-flow width collapsed and this only widens the floating panel.
  const isOpen = overlayMode ? pinned || hovered : isOpenProp;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBottomMenu, setShowBottomMenu] = useState(false);
  // ── Apps / Copilot tabs ─────────────────────────────────────────
  // Which nav list the sidebar shows. Derived from the route on load and kept
  // in sync on navigation (any /copilot route → Copilot tab, everything else →
  // Apps), while still letting the user flip tabs freely to browse.
  const [activeTab, setActiveTab] = useState(() =>
    pathname?.startsWith("/copilot") ? "copilot" : "apps",
  );
  // Favorites disclosure on the Copilot tab (empty state until favorites exist).
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const bottomMenuRef = useRef(null);
  const mobileBottomMenuRef = useRef(null);
  const userBtnRef = useRef(null);
  // Position for the collapsed user menu — rendered fixed so it isn't clipped
  // by the sidebar's overflow-hidden while collapsed.
  const [userMenuCoords, setUserMenuCoords] = useState({ left: 0, bottom: 0 });

  // ── Collapsed-sidebar label tooltip ─────────────────────────────
  // While collapsed the sidebar (and its scroll area) clip overflow, so an
  // absolutely-positioned tooltip would be cut off. We instead snapshot the
  // hovered item's rect and render ONE fixed-positioned tooltip at the sidebar
  // root: { label, active, top, left } — or null when nothing is hovered.
  const [hoverTip, setHoverTip] = useState(null);

  const showTip = (e, label, active = false) => {
    if (overlayMode) return; // hovering expands the whole sidebar instead
    if (isOpen) return; // labels are already visible when expanded
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTip({
      label,
      active,
      top: rect.top + rect.height / 2, // vertically centred on the icon
      left: rect.right + 14, // just outside the sidebar's right border
    });
  };

  const hideTip = () => setHoverTip(null);

  // Drop a stale tooltip when the sidebar expands (its coords no longer apply).
  useEffect(() => {
    if (isOpen) setHoverTip(null);
  }, [isOpen]);

  // Toggle the desktop user menu; when collapsed, snapshot the trigger's
  // position so the fixed-positioned popup anchors above the avatar.
  const toggleBottomMenu = () => {
    if (!showBottomMenu && !isOpen) {
      const rect = userBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setUserMenuCoords({
          left: rect.left,
          bottom: window.innerHeight - rect.top + 8,
        });
      }
    }
    setShowBottomMenu((p) => !p);
  };

  // Actual sign-out. Kept lean so LogoutModal owns the loading/close/toast UX:
  // the modal stays open (showing its "Logging out…" state) until this
  // resolves, then toasts success — or catches a thrown error and toasts the
  // failure. We intentionally do NOT close the modal here and let errors
  // propagate so the modal can surface them. `logout()` is best-effort and
  // always clears the local session, so resolving is the normal path.
  const handleLogout = async () => {
    setShowBottomMenu(false);
    await logout(); // auth action (best-effort server call + always-local clear)
    router.push("/login");
  };

  //   const handleLogout = async () => {
  //   await logout();
  //   router.push("/login");
  // };

  const isActive = (href) =>
    pathname === href || pathname?.startsWith(href + "/");

  // Follow navigation: landing on a /copilot route selects the Copilot tab,
  // navigating to any app page selects Apps. Manual tab flips (to just look)
  // stay until the next navigation. Done during render (React's adjust-state
  // pattern, same as the profile page) rather than in an effect so it doesn't
  // trigger a cascading re-render.
  const routeTab = pathname?.startsWith("/copilot") ? "copilot" : "apps";
  const [lastRouteTab, setLastRouteTab] = useState(routeTab);
  if (routeTab !== lastRouteTab) {
    setLastRouteTab(routeTab);
    setActiveTab(routeTab);
  }

  // ── Close bottom menu on outside click ──
  // useEffect(() => {
  //   const handleClickOutside = (e) => {
  //     if (showLogoutModal) return;
  //     const desktopEl = bottomMenuRef.current;
  //     const mobileEl = mobileBottomMenuRef.current;
  //     const clickedInsideDesktop = desktopEl?.contains(e.target);
  //     const clickedInsideMobile = mobileEl?.contains(e.target);
  //     if (!clickedInsideDesktop && !clickedInsideMobile) {
  //       setShowBottomMenu(false);
  //     }
  //   };

  //   if (showBottomMenu) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [showBottomMenu, showLogoutModal]);

  // ── Nav items ──────────────────────────────────────────────────
  // Apps tab — flat list, no category headers. Social Content, Ads Content and
  // Ad Intelligence are sections: each opens a page with its own secondary
  // sidebar (see (components)/SectionLayout.jsx) holding the old sub-pages.
  const appsItems = [
    { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
    { id: "brand", label: "Brand Kits", href: "/brand/reuse", icon: Palette },
    {
      id: "creatives",
      label: "Creative Studio",
      href: "/creatives",
      icon: Folder,
    },
    {
      id: "product-studio",
      label: "Product Studio",
      href: "/product-studio",
      icon: BookImage,
    },
    {
      id: "magic-studio",
      label: "Magic Studio",
      href: "/magic-studio",
      icon: Sparkles,
    },
    {
      id: "social-content",
      label: "Social Content",
      href: "/social-content",
      icon: Share2,
    },
    {
      id: "ads-content",
      label: "Ads Content",
      href: "/ads-content",
      icon: Megaphone,
    },
    {
      id: "ad-intelligence",
      label: "Ad Intelligence",
      href: "/ad-intelligence",
      icon: Brain,
    },
    // Parked ideas (pages exist but are not surfaced yet):
    // { id: "brandPulse", label: "Brand Pulse", href: "/brandPulse", icon: Activity },
    // { id: "creativeIQ", label: "Creative IQ", href: "/creativeIQ", icon: Brain },
    // { id: "adGuard", label: "AdGuard", href: "/adGuard", icon: ShieldCheck },
    // { id: "rivalLens", label: "Rival Lens", href: "/rivalLens", icon: Radar },
  ];

  // Copilot tab — UI-first pages until the Copilot backend lands.
  const copilotItems = [
    { id: "copilot-home", label: "Home", href: "/copilot", icon: Home },
    {
      id: "copilot-all",
      label: "All Copilots",
      href: "/copilot/all",
      icon: LayoutGrid,
    },
  ];

  const bottomMenuLinks = [
    { label: "Profile Settings", href: "/profile", icon: User },
    { label: "Gallery", href: "/gallery", icon: Image },
    { label: "Integrations", href: "/integrations", icon: Workflow },
    { label: "Resell", href: "/resell", icon: ShoppingCart },
    { label: "Plans And Billing", href: "/billing", icon: CreditCard },
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
          group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium
          transition-all duration-150
          ${active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
          ${!isOpen ? "justify-center px-0" : ""}
        `}
        onMouseEnter={(e) => showTip(e, label, active)}
        onMouseLeave={hideTip}
        onFocus={(e) => showTip(e, label, active)}
        onBlur={hideTip}
      >
        {/* h-4.5 matters as much as w-4.5: lucide renders height="24" on the
            <svg>, so a width-only class leaves an 18px glyph letterboxed inside
            a 24px box — which is what made these rows read as crowded. */}
        <Icon
          className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"} ${!isOpen ? "group-hover:scale-110" : ""}`}
        />
        {isOpen && <span className="flex-1 truncate">{label}</span>}
        {isOpen && badge && (
          <span className="text-[10px] font-semibold bg-rose-500 text-white px-1.5 py-0.5 rounded-full leading-none">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  // ── Apps/Copilot tab switcher ──────────────────────────────────
  // Expanded: a segmented pill control. Collapsed: two stacked icon buttons
  // (labels come from the shared hover tooltip).
  const tabDefs = [
    { id: "apps", label: "Designs", icon: LayoutGrid },
    { id: "copilot", label: "Copilot", icon: Bot },
  ];

  const renderTabs = () =>
    isOpen ? (
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-gray-200 bg-gray-100">
        {tabDefs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] cursor-pointer transition-all duration-150
                ${active ? "bg-surface text-gray-900 font-semibold shadow-sm" : "text-gray-500 font-medium hover:text-gray-900"}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-blue-600" : ""}`}
              />
              {label}
            </button>
          );
        })}
      </div>
    ) : (
      <div className="flex flex-col gap-1 p-1 rounded-xl border border-gray-200 bg-gray-100">
        {tabDefs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              onMouseEnter={(e) => showTip(e, label, active)}
              onMouseLeave={hideTip}
              onFocus={(e) => showTip(e, label, active)}
              onBlur={hideTip}
              className={`flex items-center justify-center rounded-lg py-1.5 cursor-pointer transition-all duration-150
                ${active ? "bg-surface shadow-sm" : "hover:bg-gray-200/60"}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-gray-500"}`}
              />
            </button>
          );
        })}
      </div>
    );

  // ── Copilot tab: Favorites disclosure ──────────────────────────
  // Mirrors the reference design — a muted "Favorites" row that expands to an
  // empty state until favoriting exists.
  const renderFavorites = () =>
    isOpen && (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => setFavoritesOpen((p) => !p)}
          className="group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
        >
          <Star className="h-4.5 w-4.5 shrink-0 text-gray-500 group-hover:text-gray-900" />
          <span className="flex-1 text-left truncate">Favorites</span>
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${favoritesOpen ? "rotate-90" : ""}`}
          />
        </button>
        {favoritesOpen && (
          <p className="px-3 py-2 ml-4 text-xs text-gray-400">
            No favorites yet
          </p>
        )}
      </div>
    );

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      {/* Overlay mode: this placeholder holds the collapsed width in the
          layout flow so the floating panel never pushes the content aside. */}
      {overlayMode && (
        <div className="hidden md:block w-15 shrink-0" aria-hidden="true" />
      )}
      <nav
        onMouseEnter={overlayMode ? () => setHovered(true) : undefined}
        onMouseLeave={overlayMode ? () => setHovered(false) : undefined}
        className={`
          hidden md:flex md:flex-col shrink-0
          h-screen bg-surface border-r border-gray-200
          transition-all duration-300 ease-in-out overflow-hidden
          ${overlayMode ? "fixed left-0 top-0 z-55" : ""}
          ${overlayMode && isOpen ? "shadow-2xl" : ""}
          ${isOpen ? "w-56" : "w-15"}
        `}
      >
        {/* Logo row */}
        <div
          className={`flex items-center h-16 shrink-0 border-b border-gray-200 cursor-pointer
            ${isOpen ? "px-4" : "justify-center px-0"}
          `}
          onClick={() => router.push("/")}
        >
          <img
            src="/logoblue.svg"
            alt="Logo"
            className="h-7 w-auto max-w-full object-contain"
            loading="lazy"
          />
          {/* An unclassed <strong> here rendered at the UA's bold + the
              inherited 16px body size, making it the heaviest thing in the
              sidebar. Explicit type keeps it a wordmark rather than a shout. */}
          {isOpen && (
            <span className="ml-2 truncate text-[15px] font-semibold tracking-tight text-gray-900">
              Creative Klux
            </span>
          )}
        </div>

        {/* Apps / Copilot tabs */}
        <div className={`shrink-0 pt-3 ${isOpen ? "px-3" : "px-2"}`}>
          {renderTabs()}
        </div>

        {/* Scrollable nav area — flat list for the active tab */}
        <div
          className={`hide-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-3 flex flex-col gap-1 ${isOpen ? "px-3" : "px-2"}`}
          onScroll={hideTip}
        >
          {activeTab === "apps" ? (
            appsItems.map(renderNavItem)
          ) : (
            <>
              {copilotItems.map(renderNavItem)}
              {renderFavorites()}
            </>
          )}
        </div>

        {/* Theme switcher (UI only) */}
        <div className="shrink-0 border-t border-gray-200">
          <ThemeSwitcher collapsed={!isOpen} />
        </div>

        {/* Bottom user area */}
        {/* Height is pinned to --ck-rail-foot (globals.css) rather than left to
            the content, because the home page's template rail lines its own
            hairlines up with this block's top border. Absolutely-positioned
            children (the popup, its backdrop) are out of flow and unaffected. */}
        <div
          ref={bottomMenuRef}
          className={`shrink-0 border-t border-gray-200 relative flex items-center h-(--ck-rail-foot) ${isOpen ? "px-3" : "px-2"}`}
        >
          {/* Backdrop — closes menu when clicking outside */}
          {showBottomMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowBottomMenu(false)}
            />
          )}

          {/* Bottom popup menu */}
          {showBottomMenu && (
            <div
              style={
                isOpen
                  ? undefined
                  : { left: userMenuCoords.left, bottom: userMenuCoords.bottom }
              }
              className={`mb-2 bg-surface border border-gray-200 rounded-2xl shadow-xl z-50 ${
                isOpen ? "absolute bottom-full left-3 right-3" : "fixed w-56"
              }`}
            >
              {/* remove overflow-hidden here ^ */}
              <div className="py-1.5">
                {bottomMenuLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowBottomMenu(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-gray-100
              ${isActive(href) ? "text-blue-600 font-semibold" : "text-gray-900 font-medium"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowBottomMenu(false);
                      setShowLogoutModal(true);
                    }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
                  >
                    <Power className="h-4 w-4 shrink-0" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User button */}
          <button
            ref={userBtnRef}
            onClick={toggleBottomMenu}
            className={`
      flex items-center w-full rounded-xl transition-all duration-150 cursor-pointer
      ${showBottomMenu ? "bg-gray-100" : "hover:bg-gray-100"}
      ${isOpen ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5"}
    `}
          >
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {isOpen && (
              /* leading-4 on both lines, not leading-tight: it pins this stack
                 to exactly 32px so it matches the avatar beside it. Left to
                 leading-tight the pair measured 32.5px and quietly made the
                 expanded sidebar half a pixel taller than the collapsed one —
                 enough to knock the rail's hairlines off the sidebar's. */
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-[13px] font-medium text-gray-900 truncate leading-4 capitalize">
                  {user.username}
                </p>
                <p className="text-[11px] text-blue-500 font-medium truncate leading-4">
                  Pro Plan
                </p>
              </div>
            )}
            {isOpen && (
              <ChevronRight
                className={`h-4 w-4 text-gray-500 shrink-0 transition-transform duration-200 ${showBottomMenu ? "rotate-90" : "-rotate-90"}`}
              />
            )}
          </button>
        </div>
      </nav>

      {/* ── Collapsed sidebar hover label ──────────────────────────
          Rendered outside <nav> and fixed-positioned so the sidebar's
          overflow-hidden can't clip it. Purely decorative → pointer-events
          are off so it never steals the hover from the item beneath it. */}
      {!isOpen && hoverTip && (
        <div
          className="hidden md:block fixed z-60 pointer-events-none"
          style={{
            top: hoverTip.top,
            left: hoverTip.left,
            transform: "translateY(-50%)",
          }}
          role="tooltip"
        >
          <div className="animate-tip-in relative">
            {/* Pointer/caret aimed back at the icon */}
            <span
              className={`absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[3px] ${
                hoverTip.active ? "bg-blue-600" : "bg-gray-900"
              }`}
            />
            <span
              className={`relative block whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-lg ${
                hoverTip.active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-surface"
              }`}
            >
              {hoverTip.label}
            </span>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ──────────────────────────────────────
          Flat app links (sections open their page; sub-navs live in the
          section's horizontal tab bar — see SectionLayout). Scrolls
          horizontally if the items outgrow the width. */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-gray-200 flex justify-around items-center gap-0.5 py-2 px-1 overflow-x-auto hide-scrollbar md:hidden">
        {appsItems.map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`flex flex-col items-center shrink-0 text-xs p-1.5 rounded-lg ${isActive(href) ? "text-blue-600" : "text-gray-500"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-0.5 font-medium whitespace-nowrap">
              {label}
            </span>
          </Link>
        ))}

        <div ref={mobileBottomMenuRef} className="relative shrink-0">
          {showBottomMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowBottomMenu(false)}
            />
          )}
          <button
            onClick={() => setShowBottomMenu((p) => !p)}
            className="flex flex-col items-center text-xs p-2 rounded-lg text-gray-500"
          >
            <div className="h-5 w-5 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[8px] font-bold">
              CK
            </div>
            <span className="mt-0.5 font-medium">Account</span>
          </button>

          {showBottomMenu && (
            /* fixed (not absolute): the nav scrolls horizontally, so an
               absolute popup would be clipped by its overflow */
            <div className="fixed bottom-16 right-2 w-48 bg-surface rounded-xl shadow-xl border border-gray-200 py-1.5 z-50">
              {/* same links, no onMouseDown needed */}
              {bottomMenuLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowBottomMenu(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-100 ${isActive(href) ? "text-blue-600 font-semibold" : "text-gray-900"}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-200 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowBottomMenu(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 w-full"
                >
                  <Power className="h-3.5 w-3.5 shrink-0" />
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
