"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Globe, ChevronDown, ChevronLeft, AlignLeft, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Header = ({ isPanelOpen, togglePanel, setShowModal }) => {
  const { brands, brandId, setActiveBrand, brandsLoading, activeBrand } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoFailed, setLogoFailed] = useState({}); // Track failed logos by brand ID

  const filteredBrands = useMemo(
    () =>
      brands?.filter((b) =>
        b.name && typeof b.name === "string"
          ? b.name.toLowerCase().includes(searchQuery.toLowerCase())
          : false
      ) ?? [],
    [brands, searchQuery]
  );

  const handleRemoveActiveBrand = () => {
    setActiveBrand(null);
    setDropdownOpen(false);
    localStorage.removeItem("activeBrandId");
  };

  // Helper function to get display values
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
    <div className={`flex fixed top-0  w-full items-center justify-between border-custom bg-white px-4 sm:px-12 lg:px-16 py-4 z-50  ${isPanelOpen ? "left-[330px] w-[calc(100%-250px)]" : "left-20  right-0"}`}>
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePanel}
          className="flex items-center justify-center p-1 rounded-full cursor-pointer hover:bg-gray-100 transition duration-300"
        >
          {isPanelOpen ? <ChevronLeft className="h-8 w-8 text-[#155dfc]" /> : <AlignLeft className="h-8 w-8 text-[#155dfc]" />}
        </button>
      </div>

      <div className={`flex flex-row gap-4 ${isPanelOpen ? "mr-[330px]" : "mr-19"}`}>
        <div className="flex-1 flex justify-center relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex justify-between items-center gap-2 px-4 w-[250px] py-2 border rounded-lg border-gray-300 text-black font-medium"
          >
            {brandsLoading ? (
              <span className="py-1 text-gray-500">Loading...</span>
            ) : activeBrand ? (
              (() => {
                const { displayName, displayInitial, displayColor } = getDisplayValues(activeBrand);
                // Debug active brand
                console.log(`Active Brand ${activeBrand.id}:`, {
                  name: activeBrand.name,
                  logo: activeBrand.logo,
                  primary_color: activeBrand.primary_color,
                  displayName,
                  displayInitial,
                  displayColor,
                  logoFailed: logoFailed[activeBrand.id] || false,
                });
                return (
                  <div className="flex flex-row gap-2">
                    {activeBrand.logo && typeof activeBrand.logo === "string" && activeBrand.logo.trim() && !logoFailed[activeBrand.id] ? (
                      <img
                        src={
                          activeBrand.logo.startsWith("http")
                            ? activeBrand.logo
                            : `${process.env.NEXT_PUBLIC_API_URL}${activeBrand.logo}`
                        }
                        alt={displayName}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={() => {
                        //   console.error(`Failed to load logo for active brand ${activeBrand.id}: ${activeBrand.logo}`);
                          setLogoFailed((prev) => ({ ...prev, [activeBrand.id]: true }));
                        }}
                      />
                    ) : (
                      <div
                        className="w-6 h-6 flex items-center justify-center rounded-full text-white text-sm font-semibold"
                        style={{ backgroundColor: displayColor }}
                      >
                        {displayInitial}
                      </div>
                    )}
                    <span>{displayName}</span>
                  </div>
                );
              })()
            ) : (
              <span className="py-1 text-gray-500">Select Brand</span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {!brandsLoading && isDropdownOpen && (
            <div className="absolute z-[9999] mt-12 w-[250px] bg-white border border-gray-200 rounded-lg max-h-80 overflow-auto">
              <div className="flex items-center justify-between p-2 bg-gray-50">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 border border-gray-50 rounded focus:outline-none"
                />
                <button onClick={() => setDropdownOpen(false)} className="ml-2 text-gray-500 p-1 hover:text-gray-700">✕</button>
              </div>

              <div className="flex flex-col">
                {activeBrand && (
                  <button
                    onClick={handleRemoveActiveBrand}
                    className="flex items-center gap-2 border border-gray-200 px-3 py-2 text-red-600 hover:bg-gray-100 transition"
                  >
                    <X className="w-4 h-4" />
                    <span className="font-semibold">Remove Active Brand</span>
                  </button>
                )}

                {filteredBrands.length > 0 ? (
                  filteredBrands.map((b) => {
                    const { displayName, displayInitial, displayColor } = getDisplayValues(b);
                    // Debug dropdown brand
                    console.log(`Dropdown Brand ${b.id}:`, {
                      name: b.name,
                      logo: b.logo,
                      primary_color: b.primary_color,
                      displayName,
                      displayInitial,
                      displayColor,
                      logoFailed: logoFailed[b.id] || false,
                    });
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setActiveBrand(b);
                          localStorage.setItem("activeBrandId", b.id);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 border border-gray-200 px-3 py-2 hover:bg-gray-100 transition"
                      >
                        {b.logo && typeof b.logo === "string" && b.logo.trim() && !logoFailed[b.id] ? (
                          <img
                            src={b.logo.startsWith("http") ? b.logo : `${process.env.NEXT_PUBLIC_API_URL}${b.logo}`}
                            alt={displayName}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={() => {
                              console.error(`Failed to load logo for dropdown brand ${b.id}: ${b.logo}`);
                              setLogoFailed((prev) => ({ ...prev, [b.id]: true }));
                            }}
                          />
                        ) : (
                          <div
                            className="w-6 h-6 flex items-center justify-center rounded-full text-white text-sm font-semibold"
                            style={{ backgroundColor: displayColor }}
                          >
                            {displayInitial}
                          </div>
                        )}
                        <span className="font-semibold">{displayName}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-gray-500">No brands found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;