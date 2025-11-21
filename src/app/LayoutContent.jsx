"use client";

import { useEffect, useState, lazy, Suspense, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Overview from "./(protected)/overview/page";
import ModalPage from "./components/ModalPage";

// Lazy load heavy panel components
const Brand = lazy(() => import("./(protected)/brand/page"));
const Projects = lazy(() => import("./(protected)/creatives/page"));
const ProfilePanel = lazy(() => import("./(protected)/profile/page"));
const AdsContent = lazy(() => import("./(protected)/ads-content/page"));
const SocialContent = lazy(() => import("./(protected)/social-content/page"));

// Loading component for panels
const PanelLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

export default function LayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { brands, activeBrand, setActiveBrand, brandsLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Use lazy initialization for localStorage
  const [activePanel, setActivePanel] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("activePanel");
    } catch {
      return null;
    }
  });

  // Debounced localStorage update
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timeoutId = setTimeout(() => {
      try {
        if (activePanel) {
          localStorage.setItem("activePanel", activePanel);
        } else {
          localStorage.removeItem("activePanel");
        }
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activePanel]);

  const togglePanel = (id) => {
    startTransition(() => {
      setActivePanel((prev) => (prev === id ? null : id));
    });
  };

  // Memoize modal check to prevent unnecessary recalculations
  const shouldShowModal = useMemo(() => {
    if (brandsLoading) return false;
    const excludedPaths = ["/brand/create"];
    return !activeBrand && !excludedPaths.includes(pathname);
  }, [activeBrand, pathname, brandsLoading]);

  useEffect(() => {
    setShowModal(shouldShowModal);
  }, [shouldShowModal]);

  // ✅ CRITICAL FIX: Navigate immediately, state updates don't block
  const handleSelectBrand = (brand) => {
    // Navigate FIRST - URL updates instantly
    router.push("/projects/create");

    // State updates in microtask (faster than setTimeout)
    queueMicrotask(() => {
      startTransition(() => {
        setActiveBrand(brand);
        try {
          localStorage.setItem("activeBrandId", brand.id);
        } catch (error) {
          console.error("Error saving brand:", error);
        }
        setShowModal(false);
      });
    });
  };

  // Memoize panel content renderer to prevent recreation on every render
  const renderPanelContent = useMemo(() => {
    switch (activePanel) {
      case "brand":
        return (
          <Suspense fallback={<PanelLoader />}>
            <Brand activePanel={activePanel} setActivePanel={setActivePanel} />
          </Suspense>
        );
      case "projects":
        return (
          <Suspense fallback={<PanelLoader />}>
            <Projects activePanel={activePanel} setActivePanel={setActivePanel} />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={<PanelLoader />}>
            <ProfilePanel activePanel={activePanel} setActivePanel={setActivePanel} />
          </Suspense>
        );
      case "ads":
        return (
          <Suspense fallback={<PanelLoader />}>
            <AdsContent activePanel={activePanel} setActivePanel={setActivePanel} />
          </Suspense>
        );
      case "social":
        return (
          <Suspense fallback={<PanelLoader />}>
            <SocialContent activePanel={activePanel} setActivePanel={setActivePanel} />
          </Suspense>
        );
      default:
        return null;
    }
  }, [activePanel]); // Only recreate when activePanel changes

  return (
    <>
      <Navbar
        togglePanel={togglePanel}
        activePanel={activePanel}
        pathname={pathname}
      />
      <main className="flex w-full h-screen overflow-hidden">
        {/* Side Panel */}
        {activePanel && (
          <div
            className={`
              h-full bg-white border-r border-gray-200 py-6 overflow-y-auto transition-transform duration-300
              w-[250px]
              ${activePanel ? "translate-x-0" : "-translate-x-full"}
              fixed top-0 left-0 md:relative md:translate-x-0 md:top-auto md:left-auto md:z-auto z-30
            `}
          >
            <div className="flex justify-end p-2 md:hidden">
              <button
                onClick={() => setActivePanel(null)}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Close side panel"
              >
                ✕
              </button>
            </div>
            {renderPanelContent}
          </div>
        )}

        {/* Main Content - This is where route changes happen */}
        <aside
          className={`flex-1 bg-white overflow-y-auto h-full transition-all duration-300 ${
            isPending ? "opacity-70 pointer-events-none" : ""
          }`}
        >
          <Header
            isPanelOpen={!!activePanel}
            togglePanel={() => togglePanel("brand")}
            setShowModal={setShowModal}
          />
          <div className="p-4 pt-22">
            {/* ✅ CRITICAL: Wrap children in Suspense for better route transitions */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-96">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#155dfc]"></div>
                    <p className="text-sm text-gray-600">Loading...</p>
                  </div>
                </div>
              }
            >
              {children || <Overview />}
            </Suspense>
          </div>
        </aside>
      </main>

      {showModal && (
        <ModalPage
          onClose={() => setShowModal(false)}
          onSelectBrand={handleSelectBrand}
        />
      )}
    </>
  );
}