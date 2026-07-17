"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  AlignLeft,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Header = ({ sidebarOpen, toggleSidebar }) => {
  const { brands, setActiveBrand, brandsLoading, activeBrand, switchingBrandId } =
    useAuth();
  const router = useRouter();
  // True while any brand switch request is in flight — locks the switcher so the
  // user can't fire a second switch until the first resolves.
  const switching = switchingBrandId != null;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoFailed, setLogoFailed] = useState({});
  const switcherRef = useRef(null);

  // Close the brand dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onClick = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isDropdownOpen]);

  const filteredBrands = useMemo(
    () =>
      brands?.filter((b) =>
        b.name && typeof b.name === "string"
          ? b.name.toLowerCase().includes(searchQuery.toLowerCase())
          : false,
      ) ?? [],
    [brands, searchQuery],
  );

  // const handleRemoveActiveBrand = () => {
  //   setActiveBrand(null);
  //   setDropdownOpen(false);
  //   localStorage.removeItem("activeBrandId");
  // };

  const getDisplayValues = (brand) => {
    const displayName =
      brand?.name && typeof brand.name === "string" && brand.name.trim()
        ? brand.name
        : "Unknown";
    const displayInitial = displayName[0].toUpperCase();
    const displayColor =
      brand?.primary_color && /^#[0-9A-F]{6}$/i.test(brand.primary_color)
        ? brand.primary_color
        : "#1e3a8a";
    return { displayName, displayInitial, displayColor };
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 border-custom flex items-center justify-between bg-surface  px-6 h-16
      ${sidebarOpen ? "left-56 right-0" : "left-15  right-"}`}
    >
      {/* Left — sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-7 w-7 text-[#155dfc]" />
          ) : (
            <AlignLeft className="h-7 w-7 text-[#155dfc]" />
          )}
        </button>
      </div>

      {/* Right — brand switcher */}
      <div className="relative" ref={switcherRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center cursor-pointer gap-2 px-3 py-2 w-220px border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:border-gray-300 transition-colors bg-surface truncate max-w-50"
        >
          {brandsLoading ? (
            <span className="flex-1 text-left text-gray-400">Loading...</span>
          ) : activeBrand ? (
            (() => {
              const { displayName, displayInitial, displayColor } =
                getDisplayValues(activeBrand);
              return (
                <>
                  {activeBrand.logo &&
                  typeof activeBrand.logo === "string" &&
                  activeBrand.logo.trim() &&
                  !logoFailed[activeBrand.id] ? (
                    <img
                      src={
                        activeBrand.logo.startsWith("http")
                          ? activeBrand.logo
                          : `${process.env.NEXT_PUBLIC_API_URL}${activeBrand.logo}`
                      }
                      alt={displayName}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                      onError={() =>
                        setLogoFailed((prev) => ({
                          ...prev,
                          [activeBrand.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <div
                      className="w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
                      style={{ backgroundColor: displayColor }}
                    >
                      {displayInitial}
                    </div>
                  )}
                  <span className="flex-1 text-left truncate">
                    {displayName}
                  </span>
                </>
              );
            })()
          ) : (
            <span className="flex-1 text-left text-gray-400">Select Brand</span>
          )}
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {!brandsLoading && isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 z-9999 w-220px bg-surface border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={() => setDropdownOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-1 max-h-72 overflow-y-auto hide-scrollbar">
              <Link
                href="/brand/create"
                onClick={() =>  setDropdownOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 transition-colors mb-2 font-bold"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">Create Brand</span>
              </Link>

              {/* Brand list */}
              {filteredBrands.length > 0 ? (
                filteredBrands.map((b) => {
                  const { displayName, displayInitial, displayColor } =
                    getDisplayValues(b);
                  const isSelected = activeBrand?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      className={`group flex items-center gap-1 w-full px-1.5 py-1 rounded-lg transition-colors ${
                        isSelected ? "bg-[#e7eeffe9]" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Select brand — awaits the backend switch, then closes.
                          Stays open and toasts (via context) if the switch fails. */}
                      <button
                        onClick={async () => {
                          const res = await setActiveBrand(b);
                          if (res?.ok) setDropdownOpen(false);
                        }}
                        disabled={switching}
                        className="flex items-center gap-2.5 flex-1 min-w-0 px-1.5 py-1.5 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {b.logo &&
                        typeof b.logo === "string" &&
                        b.logo.trim() &&
                        !logoFailed[b.id] ? (
                          <img
                            src={
                              b.logo.startsWith("http")
                                ? b.logo
                                : `${process.env.NEXT_PUBLIC_API_URL}${b.logo}`
                            }
                            alt={displayName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            onError={() =>
                              setLogoFailed((prev) => ({
                                ...prev,
                                [b.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <div
                            className="w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
                            style={{ backgroundColor: displayColor }}
                          >
                            {displayInitial}
                          </div>
                        )}
                        <span
                          className={`truncate flex-1 text-left ${isSelected ? "text-[#155dfc] font-semibold" : "text-gray-700 font-medium"}`}
                        >
                          {displayName}
                        </span>
                        {switchingBrandId === b.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#155dfc] shrink-0" />
                        ) : isSelected ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#155dfc] shrink-0" />
                        ) : null}
                      </button>

                      {/* Manage — switches to this brand, then opens its settings
                          only once the switch is confirmed by the backend. */}
                      <button
                        onClick={async () => {
                          const res = await setActiveBrand(b);
                          if (res?.ok) {
                            setDropdownOpen(false);
                            router.push("/brand/manage");
                          }
                        }}
                        disabled={switching}
                        title="Manage brand"
                        className="shrink-0 p-1.5 rounded-md text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-3 text-sm text-gray-400 text-center">
                  No brands found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
