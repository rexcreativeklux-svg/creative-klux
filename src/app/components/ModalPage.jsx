"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, MoreVertical, Play, Copy, FolderInput } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ModalPage({ onClose }) {
  const { brands, setActiveBrand, activeBrand, brandsLoading, fetchBrands } = useAuth();
  const [activeTab, setActiveTab] = useState("Recent");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [logoFailed, setLogoFailed] = useState({}); // Track failed logos by brand ID
  const dropdownRef = useRef(null);
  const router = useRouter();

  const filteredBrands = useMemo(
    () =>
      brands?.filter((b) =>
        b.name && typeof b.name === "string"
          ? b.name.toLowerCase().includes(searchQuery.toLowerCase())
          : false
      ) ?? [],
    [brands, searchQuery]
  );

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setError(null);
        await fetchBrands();
      } catch (err) {
        console.error("Error fetching brands in ModalPage:", err);
        setError("Failed to load brands. Please try again.");
      }
    };

    if (brandsLoading && !brands.length) {
      loadBrands();
    }
  }, [fetchBrands, brandsLoading, brands]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyUrl = (brand) => {
    const url = brand.source_url || `${window.location.origin}/brand/${brand.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Brand URL copied!"))
      .catch(() => alert("Failed to copy URL."));
  };

  const handleSelectBrand = (brand) => {
    console.log("Selecting brand:", brand);
    try {
      setActiveBrand(brand);
      localStorage.setItem("activeBrandId", brand.id);
      if (onClose) {
        console.log("Closing modal");
        onClose();
      } else {
        console.warn("onClose prop is undefined");
      }
    } catch (err) {
      console.error("Error selecting brand:", err.message);
      setError("Failed to select brand. Please try again.");
      if (onClose) onClose();
    }
  };

  const handleCreateNewBrand = () => {
    router.push("/brand/create");
    if (onClose) onClose();
  };

  const handleRetry = async () => {
    try {
      setError(null);
      await fetchBrands();
    } catch (err) {
      console.error("Error retrying fetch brands:", err);
      setError("Failed to load brands. Please try again.");
    }
  };

  // Helper function for display values
  const getDisplayValues = (brand) => {
    const displayName = brand?.name && typeof brand.name === "string" && brand.name.trim()
      ? brand.name
      : "Unknown";
    const displayInitial = displayName[0].toUpperCase();
    const displayColor = brand?.primary_color && /^#[0-9A-F]{6}$/i.test(brand.primary_color)
      ? brand.primary_color
      : "#1e3a8a";
    return { displayName, displayInitial, displayColor };
  };

  return (
    <div
      className="fixed inset-0 flex px-5 items-center justify-center bg-black/80 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative bg-white rounded-lg shadow-lg w-full lg:max-w-3xl overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center p-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              Select a Brand
            </h2>
            <div className="flex gap-2">
              <div className="flex flex-row gap-2">
                <FolderInput className="text-[#155dfc]" />
                <button
                  onClick={handleCreateNewBrand}
                  className="text-sm cursor-pointer font-medium text-[#155dfc] hover:underline"
                >
                  Create New Brand
                </button>
              </div>
              {onClose && (
                <button
                  onClick={activeBrand ? onClose : undefined}
                  className={`text-gray-500 px-1 cursor-pointer hover:text-gray-700 ${!activeBrand ? "text-transparent cursor-not-allowed" : ""}`}
                  disabled={!activeBrand}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center border border-gray-200 rounded-md px-3 py-2">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-500 p-1 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex px-4 border-b border-b-gray-200">
            {["Recent", "Starred", "All"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="py-2 pb-10 px-4 overflow-y-auto">
            <h1 className="text-lg px-4 pt-4 font-semibold">Created Brands</h1>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center mt-6 p-20 rounded-md bg-white"
              >
                <p className="text-lg font-medium text-center text-red-600 mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Retry
                </button>
              </motion.div>
            ) : brandsLoading ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center mt-6 p-20 rounded-md bg-white"
              >
                <p className="text-lg font-medium text-center text-gray-600 mb-4">
                  Loading brands...
                </p>
              </motion.div>
            ) : filteredBrands.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center mt-6 p-20 rounded-md bg-white"
              >
                <p className="text-lg font-medium text-center text-gray-600 mb-4">
                  No brands found
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-2 gap-4 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, staggerChildren: 0.1 }}
              >
                {filteredBrands.map((brand) => {
                  const { displayName, displayInitial, displayColor } = getDisplayValues(brand);
                  // Debug brand data
                  console.log(`Modal Brand ${brand.id}:`, {
                    name: brand.name,
                    logo: brand.logo,
                    primary_color: brand.primary_color,
                    displayName,
                    displayInitial,
                    displayColor,
                    logoFailed: logoFailed[brand.id] || false,
                  });

                  return (
                    <motion.div
                      key={brand.id}
                      className="relative flex hover:border-[#155dfc] cursor-pointer flex-col border rounded-md border-gray-200 py-5 px-4 bg-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectBrand(brand)}
                    >
                      <div className="absolute top-2 right-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === brand.id ? null : brand.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                        {openMenuId === brand.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10 border-gray-200"
                          >
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBrand(brand);
                                setOpenMenuId(null);
                              }}
                            >
                              <Play className="w-4 h-4" /> Use Brand
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUrl(brand);
                                setOpenMenuId(null);
                              }}
                            >
                              <Copy className="w-4 h-4" /> Copy URL
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row gap-3">
                        <div className="flex items-start">
                          {brand.logo && typeof brand.logo === "string" && brand.logo.trim() && !logoFailed[brand.id] ? (
                            <img
                              src={
                                brand.logo.startsWith("http")
                                  ? brand.logo
                                  : `${process.env.NEXT_PUBLIC_API_URL}${brand.logo}`
                              }
                              alt={displayName}
                              className="w-[28px] h-[28px] rounded-full object-cover"
                              onError={() => {
                                // console.error(`Failed to load logo for modal brand ${brand.id}: ${brand.logo}`);
                                setLogoFailed((prev) => ({ ...prev, [brand.id]: true }));
                              }}
                            />
                          ) : (
                            <div
                              className="flex justify-center items-center rounded-full w-[28px] h-[28px] text-lg font-semibold text-white"
                              style={{ backgroundColor: displayColor }}
                            >
                              {displayInitial}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <h2 className="px-1 font-medium">{displayName}</h2>
                          <p className="px-1 text-xs flex w-full text-gray-600">
                            {brand.description && typeof brand.description === "string"
                              ? brand.description.split(" ").slice(0, 10).join(" ") +
                                (brand.description.split(" ").length > 10 ? " ..." : "")
                              : "No description"}
                          </p>
                          <p className="px-1 text-xs font-medium flex w-full text-gray-600">
                            0 projects created
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}