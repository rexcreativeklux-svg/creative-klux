"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isImpersonating } from "@/utils/impersonation";
import { useBreakpoint } from "@/utils/useMediaQuery";
import Header from "../(components)/Header";
import { SecondarySidebarProvider } from "@/context/SecondarySidebarContext";
import Home from "./page";
import ModalPage from "../(components)/ModalPage";
import ProtectedRoute from "../(components)/ProtectedRoutes";
import Sidebar from "../(components)/Sidebar";
import Drawer from "../(components)/ui/Drawer";
import '../globals.css';

const NO_PADDING_ROUTES = [
    "/studio/ai-chat-page",
    "/studio/select",
    // Copilot pages are full-bleed (own tinted background + padding).
    "/copilot",
];

// Sections that render their own secondary sidebar (see
// (components)/SectionLayout.jsx). Their layout owns the whole content area —
// full height, flush against the main sidebar — so the default page padding
// must not wrap it; SectionLayout applies the equivalent padding around the
// page content itself.
//
// While one of these routes is open the PRIMARY sidebar stays collapsed in the
// layout flow (the saved preference is untouched and restored on the way out)
// and instead expands as a floating overlay ON TOP of the secondary sidebar —
// on hover, or held open when the header's collapse button pins it. The
// secondary sidebar has its own collapse button in its panel footer, wired
// through SecondarySidebarContext.
const SECONDARY_SIDEBAR_ROUTES = [
    "/ad-intelligence",
    "/social-content",
    "/ads-content",
    "/magic-studio",
];

// Routes that open with the sidebar collapsed. These are canvas-style screens
// where the horizontal space is the point (the chat page runs a conversation and
// a live preview side by side), so they start narrow and let the user expand.
//
// It's a per-visit OVERRIDE, not a preference change: the value the user had
// before is remembered, restored on the way out, and never written to
// localStorage while one of these routes is open. Toggling the sidebar open
// while here still works — it just doesn't stick to the next route.
const COLLAPSED_SIDEBAR_ROUTES = ["/studio/ai-chat-page"];

// A user counts as verified if either flag says so — the backend sends
// `is_email_verified` (1/0) and/or a truthy `email_verified_at` timestamp.
const isUserVerified = (user) =>
    !!user &&
    (user.is_email_verified === 1 ||
        user.is_email_verified === true ||
        !!user.email_verified_at);

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { brands, activeBrand, setActiveBrand, brandsLoading, user, loading } =
        useAuth();

    const verified = isUserVerified(user);

    // ── Email-verification gate ──────────────────────────────────────────────
    // A logged-in but unverified user is bounced to the verify page on any
    // dashboard route (including a plain refresh). `replace` avoids a back-loop.
    //
    // Admin impersonation is the one exception. The verify page asks for a code
    // emailed to the user's address, which the admin has no way of reading, so
    // the gate would make every unverified account impossible to inspect via
    // "Login as User". The flag is set by the /impersonate hand-off and lives
    // exactly as long as the token does (see @/utils/impersonation).
    //
    // It's read inside the effect, not during render: localStorage doesn't exist
    // on the server, so touching it in the render pass would break hydration.
    useEffect(() => {
        if (loading || !user) return;
        if (!verified) {
            if (isImpersonating()) {
                console.log(
                    "🕵️ Impersonated session → skipping the verify-email gate",
                );
                return;
            }
            console.log("📩 User not verified → redirecting to verify-email");
            router.replace(
                `/verify-email?email=${encodeURIComponent(user.email || "")}`,
            );
        }
    }, [loading, user, verified, router]);

    // ── Active-brand gate ────────────────────────────────────────────────────
    // Verified users must have an active brand to use the app. When they don't
    // (whether they have brands to pick from or none at all), the brand modal
    // takes over and blocks everything except the create-brand route. ModalPage
    // renders the empty state + "Create Brand" CTA when there are zero brands.
    const showModal =
        !brandsLoading &&
        !!user &&
        verified &&
        !activeBrand &&
        !pathname.startsWith("/brand/create");

    const [isPending, startTransition] = useTransition();


    const noPadding =
        pathname === "/" || // root renders the full-bleed home page
        [...NO_PADDING_ROUTES, ...SECONDARY_SIDEBAR_ROUTES].some(
            route => pathname.startsWith(route),
        );

    // On a section route the primary sidebar stays collapsed in the flow and
    // expands only as an overlay (hover, or pinned via the header toggle).
    const isSectionRoute = SECONDARY_SIDEBAR_ROUTES.some(route =>
        pathname.startsWith(route),
    );

    // Overlay pin: header toggle holds the primary sidebar's overlay open on
    // section routes. Per-visit only (not persisted); cleared on leaving.
    // Cleared during render (React's adjust-state pattern) rather than in an
    // effect so it doesn't trigger a cascading re-render.
    const [primaryPinned, setPrimaryPinned] = useState(false);
    const [wasSectionRoute, setWasSectionRoute] = useState(isSectionRoute);
    if (wasSectionRoute !== isSectionRoute) {
        setWasSectionRoute(isSectionRoute);
        if (!isSectionRoute) setPrimaryPinned(false);
    }

    // Sidebar open/collapsed state — persisted in localStorage
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window === "undefined") return true;
        try {
            const saved = localStorage.getItem("sidebarOpen");
            return saved !== null ? JSON.parse(saved) : true;
        } catch {
            return true;
        }
    });

    // While the user sits on a collapsed-by-default route, their manual expand
    // lives HERE rather than in `sidebarOpen` — tagged with the route it was made
    // on, so it expires by itself the moment they navigate somewhere else.
    // Deriving the displayed value this way (instead of writing `sidebarOpen` in
    // an effect) keeps the saved preference intact and avoids a render cascade.
    const [sidebarRouteOverride, setSidebarRouteOverride] = useState(null);

    const forceCollapsedSidebar = COLLAPSED_SIDEBAR_ROUTES.some((route) =>
        pathname.startsWith(route),
    );

    // Section routes lock the primary sidebar collapsed for the whole visit —
    // no override — since the secondary sidebar carries the navigation there.
    const effectiveSidebarOpen = isSectionRoute
        ? false
        : forceCollapsedSidebar
            ? sidebarRouteOverride?.route === pathname
                ? sidebarRouteOverride.open
                : false // ← the default the moment the route is entered
            : sidebarOpen;

    // ── Mobile nav drawer ────────────────────────────────────────────────────
    // Below `lg` the sidebar is not in the layout flow at all; it opens as a
    // drawer from the header's hamburger or the bottom bar's "More".
    //
    // Deliberately its OWN state and deliberately NOT persisted. `sidebarOpen`
    // above is a durable preference about the desktop rail; whether a drawer
    // happens to be open is a transient fact about right now. Reusing
    // `sidebarOpen` for both would mean opening the drawer on a phone silently
    // rewrites the user's desktop layout — and the localStorage key would gain
    // a second writer, which the per-route override logic below depends on not
    // happening.
    const [navDrawerOpen, setNavDrawerOpen] = useState(false);

    // Growing past `lg` puts the real sidebar back on screen, which would
    // otherwise leave the drawer stranded on top of it — rotate a tablet to
    // landscape with the drawer open and you get both at once. Adjusted during
    // render (the same pattern as `wasSectionRoute` below) rather than in an
    // effect, so it does not trigger a cascading re-render.
    const isDesktopWidth = useBreakpoint("lg");
    const [wasDesktopWidth, setWasDesktopWidth] = useState(isDesktopWidth);
    if (wasDesktopWidth !== isDesktopWidth) {
        setWasDesktopWidth(isDesktopWidth);
        if (isDesktopWidth && navDrawerOpen) setNavDrawerOpen(false);
    }

    // Secondary (section) sidebar open/collapsed state — persisted separately
    // from the primary so each remembers its own preference.
    const [secondaryOpen, setSecondaryOpen] = useState(() => {
        if (typeof window === "undefined") return true;
        try {
            const saved = localStorage.getItem("secondarySidebarOpen");
            return saved !== null ? JSON.parse(saved) : true;
        } catch {
            return true;
        }
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(
                "secondarySidebarOpen",
                JSON.stringify(secondaryOpen),
            );
        } catch (error) {
            console.error("Error saving secondary sidebar state:", error);
        }
    }, [secondaryOpen]);

    /**
     * The one way the sidebar changes. On a collapsed-by-default route it edits
     * the per-route override; everywhere else it edits the real preference.
     * @param {boolean | ((open: boolean) => boolean)} next
     */
    const setSidebarOpenForRoute = (next) => {
        const value = typeof next === "function" ? next(effectiveSidebarOpen) : next;
        if (forceCollapsedSidebar) {
            setSidebarRouteOverride({ route: pathname, open: value });
            return;
        }
        setSidebarOpen(value);
    };

    // Persist sidebar state. `sidebarOpen` only ever moves on normal routes, so
    // the route-scoped collapse can't leak into the saved preference.
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
        } catch (error) {
            console.error("Error saving sidebar state:", error);
        }
    }, [sidebarOpen]);

    // The header's collapse button always drives the PRIMARY sidebar. On
    // section routes that means pinning/unpinning its overlay (the in-flow
    // width stays collapsed); everywhere else it expands/collapses as before.
    const toggleSidebar = () => {
        if (isSectionRoute) {
            setPrimaryPinned((prev) => !prev);
            return;
        }
        setSidebarOpenForRoute((prev) => !prev);
    };

    // Secondary sidebar collapse — toggled from the button in SectionLayout's
    // panel footer, shared through SecondarySidebarContext.
    const toggleSecondary = () => setSecondaryOpen((prev) => !prev);

    // const shouldShowModal = useMemo(() => {
    //     if (brandsLoading || !brands) return false;
    //     const excludedPaths = ["/brand/create"];
    //     return brands.length > 0 && !activeBrand && !excludedPaths.includes(pathname);
    // }, [activeBrand, pathname, brandsLoading, brands]);

    // useEffect(() => {
    //     setShowModal(shouldShowModal);
    // }, [shouldShowModal]);

    // const handleSelectBrand = (brand) => {
    //     router.push("/projects/create");
    //     queueMicrotask(() => {
    //         startTransition(() => {
    //             setActiveBrand(brand);
    //             try {
    //                 localStorage.setItem("activeBrandId", brand.id);
    //             } catch (error) {
    //                 console.error("Error saving brand:", error);
    //             }
    //             // setShowModal(false);
    //         });
    //     });
    // };

    const handleSelectBrand = (brand) => {
        setActiveBrand(brand); // context already saves to localStorage
       
    };

    return (
        <ProtectedRoute>
            {/* 100dvh, not h-screen: on a phone `100vh` resolves against the
                LARGE viewport, so the bottom of the shell — the mobile nav —
                sits under the browser's own chrome until the user scrolls. */}
            <div className="h-[100dvh] flex overflow-hidden">

                <Sidebar
                    isOpen={effectiveSidebarOpen}
                    setIsOpen={setSidebarOpenForRoute}
                    overlayMode={isSectionRoute}
                    pinned={primaryPinned}
                    onOpenNav={() => setNavDrawerOpen(true)}
                />

                {/* ── Mobile nav drawer ──────────────────────────────────────
                    The SAME <Sidebar>, rendered in drawer form. Not a second
                    nav component to keep in step — one list of links, one
                    account block, one theme switcher, shown two ways.

                    `onNavigate` closes the drawer when a link is followed.
                    That lives here rather than inside <Drawer> on purpose: a
                    usePathname() effect in the drawer would fire on every
                    route change in the app, including ones it had nothing to
                    do with. */}
                <Drawer
                    isOpen={navDrawerOpen}
                    onClose={() => setNavDrawerOpen(false)}
                    label="Main navigation"
                >
                    <Sidebar
                        variant="drawer"
                        isOpen
                        setIsOpen={() => { }}
                        onNavigate={() => setNavDrawerOpen(false)}
                        onClose={() => setNavDrawerOpen(false)}
                    />
                </Drawer>

                <main
                    // --ck-content-* tell the full-screen loader where the
                    // content area starts (see loaders/full-overlay-loader.jsx).
                    // Written as Tailwind arbitrary properties rather than an
                    // inline style so they can be breakpoint-aware: below `lg`
                    // there is no sidebar in the flow, so the offset is 0.
                    //
                    // pb-nav: THE mobile bottom-bar clearance, reserved once,
                    // here. The bar is `fixed bottom-0` and opaque, so anything
                    // the scroll area paints in that strip is simply covered —
                    // and a page CANNOT fix that for itself with padding: the
                    // scroll frame below is `h-full`, so bottom padding on a
                    // page taller than the viewport lands at the 100%-height
                    // mark, above the overflowing content, not after it. That
                    // is why the last row of every long page (Magic Studio's
                    // gallery, Product Studio, the settings screens) sat under
                    // the bar despite the padding that was meant to clear it.
                    //
                    // Shortening `main` instead ends the SCROLL VIEWPORT at the
                    // bar's top edge, so content can never travel under it —
                    // including inside pages that scroll in their own nested
                    // panes, which page-level padding could never reach. It
                    // reserves exactly --spacing-nav (the bar's height, iOS
                    // home indicator folded in) and nothing more, so nothing
                    // gains dead space. Gone at lg, where the bar is not
                    // rendered. Pages must NOT add their own pb-nav on top.
                    className={`flex flex-1 flex-col overflow-hidden h-full transition-opacity duration-200
                        pb-nav lg:pb-0
                        [--ck-content-left:0px] [--ck-content-top:var(--spacing-header)]
                        ${effectiveSidebarOpen ? "lg:[--ck-content-left:14rem]" : "lg:[--ck-content-left:3.75rem]"}
                        ${isPending ? "opacity-70 pointer-events-none" : ""}`}
                >
                    {/* On section routes the header follows the PIN state: pinned
                        → shifts to left-56 so its toggle stays reachable beside
                        the overlay; hover-expands don't move it. */}
                    <Header
                        sidebarOpen={isSectionRoute ? primaryPinned : effectiveSidebarOpen}
                        toggleSidebar={toggleSidebar}
                        onOpenNav={() => setNavDrawerOpen(true)}
                    // setShowModal={() => { }}

                    />
                    <div className="flex-1 bg-page h-full overflow-y-auto">
                        {/* Was `px-9 pt-24` at every width — 36px gutters and
                            96px of top padding on a 360px phone.

                            Now: fluid gutters (12 → 36px) and top padding
                            derived from the header's own height so the two
                            cannot drift. Same shape as <PageContainer>, which
                            pages adopting their own frame should use instead.

                            `pb-page-y` is the page's own bottom rhythm ONLY —
                            it is deliberately not `pb-nav`. Clearing the mobile
                            bar from here cannot work (this box is `h-full`, so
                            its bottom padding sits above the overflow on any
                            page taller than the viewport); `main` reserves the
                            bar's height for every route instead. */}
                        <div
                            className={`h-full ${noPadding
                                ? ""
                                : "px-gutter pt-[calc(var(--spacing-header)+var(--spacing-page-y))] pb-page-y"
                                }`}
                        >
                            <SecondarySidebarProvider
                                value={{ isOpen: secondaryOpen, toggle: toggleSecondary }}
                            >
                                {children || <Home />}
                            </SecondarySidebarProvider>
                        </div>
                    </div>
                </main>

                {showModal && (
                    <ModalPage
                        onClose={() => { }}
                        onSelectBrand={handleSelectBrand}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}