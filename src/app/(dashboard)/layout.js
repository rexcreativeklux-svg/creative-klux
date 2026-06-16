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

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { brands, activeBrand, setActiveBrand, brandsLoading } = useAuth();
    const showModal =
        !brandsLoading &&
        brands.length > 0 &&
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

    // Persist sidebar state
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
        } catch (error) {
            console.error("Error saving sidebar state:", error);
        }
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

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

                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

                <main
                    style={{ "--ck-content-left": sidebarOpen ? "14rem" : "3.75rem", "--ck-content-top": "4rem" }}
                    className={`flex flex-1 flex-col overflow-hidden h-full transition-opacity duration-200 ${isPending ? "opacity-70 pointer-events-none" : ""}`}
                >
                    <Header
                        sidebarOpen={sidebarOpen}
                        toggleSidebar={toggleSidebar}
                    // setShowModal={() => { }}

                    />
                    <div className="flex-1 bg-[#f7f8fc] h-full overflow-y-auto">
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