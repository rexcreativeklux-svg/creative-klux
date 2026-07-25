"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "../(components)/Header";
import Overview from "./(pages)/overview/page";
import ModalPage from "../(components)/ModalPage";
import ProtectedRoute from "../(components)/ProtectedRoutes";
import Sidebar from "../(components)/Sidebar";
import '../globals.css';

const NO_PADDING_ROUTES = [
    "/studio/ai-select",
    "/studio/ai-chat-page",
    "/studio/select",
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
    useEffect(() => {
        if (loading || !user) return;
        if (!verified) {
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


    const noPadding = NO_PADDING_ROUTES.some(route => pathname.startsWith(route));

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

    const effectiveSidebarOpen = forceCollapsedSidebar
        ? sidebarRouteOverride?.route === pathname
            ? sidebarRouteOverride.open
            : false // ← the default the moment the route is entered
        : sidebarOpen;

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

    const toggleSidebar = () => setSidebarOpenForRoute((prev) => !prev);

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
            <div className="h-screen flex overflow-hidden">

                <Sidebar isOpen={effectiveSidebarOpen} setIsOpen={setSidebarOpenForRoute} />

                <main
                    style={{ "--ck-content-left": effectiveSidebarOpen ? "14rem" : "3.75rem", "--ck-content-top": "4rem" }}
                    className={`flex flex-1 flex-col overflow-hidden h-full transition-opacity duration-200 ${isPending ? "opacity-70 pointer-events-none" : ""}`}
                >
                    <Header
                        sidebarOpen={effectiveSidebarOpen}
                        toggleSidebar={toggleSidebar}
                    // setShowModal={() => { }}

                    />
                    <div className="flex-1 bg-page h-full overflow-y-auto">
                        <div className={`h-full ${noPadding ? "" : "px-9 pt-24"}`}>
                            {children || <Overview />}
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