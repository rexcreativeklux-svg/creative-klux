// src/app/(protected)/brand/reuse/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, MoreVertical, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

/* -------------------------------------------------
   Helper – builds a safe logo URL
   ------------------------------------------------- */
const getLogoSrc = (logo) => {
  if (!logo || typeof logo !== "string" || !logo.trim()) return null;

  // External full URL
  if (logo.startsWith("http")) return logo;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.warn("NEXT_PUBLIC_API_URL is not defined. Check .env.local");
    return null;
  }

  // Avoid double slashes
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = logo.startsWith("/") ? logo : "/" + logo;
  return cleanBase + cleanPath;
};

/* -------------------------------------------------
   Main component
   ------------------------------------------------- */
export default function ReuseBrand({ navigateProjectTo, setShowModal }) {
  const {
    fetchBrands,
    deleteBrandById,
    token,
    setActiveBrand,
    brands,
    brandsLoading,
  } = useAuth();

  const [openMenuId, setOpenMenuId] = useState(null);
  const [error, setError] = useState(null);
  const [logoFailed, setLogoFailed] = useState({}); // { brandId: true }
  const dropdownRef = useRef(null);
  const router = useRouter();

  /* ------------------- Copy URL ------------------- */
  const handleCopyUrl = (brand) => {
    const url =
      brand.source_url || `${window.location.origin}/brand/${brand.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Brand URL copied!"))
      .catch(() => alert("Failed to copy URL."));
  };

  /* ------------------- Delete brand ------------------- */
  const handleDelete = async (brandId) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const res = await deleteBrandById(brandId);
      if (res) {
        alert("Brand deleted successfully!");
        setLogoFailed((prev) => {
          const newState = { ...prev };
          delete newState[brandId];
          return newState;
        });
      } else {
        alert("Failed to delete brand.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong while deleting the brand.");
    }
  };

  /* ------------------- Load brands ------------------- */
  useEffect(() => {
    const loadBrands = async () => {
      if (!token) {
        console.log("No token found, skipping fetchBrands");
        setError(null);
        return;
      }

      try {
        console.log("Calling fetchBrands in ReuseBrand");
        await fetchBrands();
        setError(null);
      } catch (err) {
        console.error("Error fetching brands in ReuseBrand:", err);
        setError("Failed to load brands. Please try again.");
      }
    };

    if (!brands.length && !brandsLoading && token) {
      loadBrands();
    }
  }, [token, brands.length, brandsLoading, fetchBrands]);

  /* ------------------- Click-outside dropdown ------------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* -------------------------------------------------
     Render
     ------------------------------------------------- */
  return (
    <div className="sm:px-16 h-full">
      {/* Header */}
      <div className="flex flex-row sm:pt-10 justify-between items-center">
        <h1 className="text-2xl px-4 font-semibold">Created Brands</h1>

        <button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm cursor-pointer transition duration-300"
          onClick={() => router.push("/brand/create")}
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 mt-10">
        {/* Error */}
        {error && (
          <div className="text-red-600 py-10 col-span-full text-center">
            {error}
            <button
              onClick={async () => {
                setError(null);
                await fetchBrands();
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {brandsLoading && brands.length === 0 && (
          <div className="text-gray-500 py-10 col-span-full text-center">
            Loading brands...
          </div>
        )}

        {/* Empty */}
        {!brandsLoading && !error && brands.length === 0 && (
          <div className="text-black py-10 col-span-full text-center">
            No brands created yet.
          </div>
        )}

        {/* Brands */}
        {!brandsLoading &&
          !error &&
          brands.length > 0 &&
          brands.map((brand) => {
            const displayName = brand.name?.trim() || "Unknown Brand";
            const displayInitial = displayName[0].toUpperCase();
            const displayColor = /^#[0-9A-F]{6}$/i.test(brand.primary_color)
              ? brand.primary_color
              : "#1e3a8a";

            const logoSrc = getLogoSrc(brand.logo);

            return (
              <div
                key={brand.id}
                className="relative flex flex-col border rounded-md border-gray-200 py-5 px-4 bg-white hover:border-[#155dfc] cursor-pointer transition-colors"
              >
                {/* Dropdown */}
                <div className="absolute top-2 right-1 z-10">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === brand.id ? null : brand.id)
                    }
                    className="p-1 hover:bg-gray-100 rounded-full transition"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {openMenuId === brand.id && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-20 border-gray-200"
                    >
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          router.push(`/brand/edit/${brand.id}`);
                          setOpenMenuId(null);
                        }}
                      >
                        <Pencil className="w-4 h-4" /> Edit Brand
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          try {
                            setActiveBrand(brand);
                            localStorage.setItem(
                              "activeBrandId",
                              brand.id
                            );
                            navigateProjectTo?.("create");
                            setShowModal?.(false);
                            setOpenMenuId(null);
                          } catch (err) {
                            console.error("Error selecting brand:", err);
                            alert("Failed to select brand.");
                          }
                        }}
                      >
                        <Play className="w-4 h-4" /> Use Brand
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          handleCopyUrl(brand);
                          setOpenMenuId(null);
                        }}
                      >
                        <Copy className="w-4 h-4" /> Copy URL
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                        onClick={() => {
                          handleDelete(brand.id);
                          setOpenMenuId(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Delete Brand
                      </button>
                    </div>
                  )}
                </div>

                {/* Brand content */}
                <div className="flex flex-row gap-3">
                  <div className="flex items-start">
                    {logoSrc && !logoFailed[brand.id] ? (
                      <Image
                        src={logoSrc}
                        alt={displayName}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover"
                        onError={() => {
                          console.warn(
                            `Failed to load logo for brand ${brand.id}: ${logoSrc}`
                          );
                          setLogoFailed((prev) => ({
                            ...prev,
                            [brand.id]: true,
                          }));
                        }}
                        unoptimized // needed for external URLs
                      />
                    ) : (
                      <div
                        className="flex justify-center items-center rounded-full w-7 h-7 text-base font-semibold text-white"
                        style={{ backgroundColor: displayColor }}
                      >
                        {displayInitial}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 flex-1 min-w-0">
                    <h2 className="px-1 font-medium truncate">
                      {displayName}
                    </h2>
                    <p className="px-1 text-xs text-gray-600 line-clamp-2">
                      {brand.description?.trim()
                        ? brand.description
                            .split(" ")
                            .slice(0, 10)
                            .join(" ") +
                          (brand.description.split(" ").length > 10
                            ? " ..."
                            : "")
                        : "No description"}
                    </p>
                    <p className="px-1 text-xs font-medium text-gray-600">
                      0 projects created
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}