// context/BrandContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const BrandContext = createContext();

export function BrandProvider({ children }) {
  const [activeBrand, setActiveBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [brandDraft, setBrandDraft] = useState(null);

  // Load brands and activeBrand on mount
  useEffect(() => {
    const loadBrandsAndActiveBrand = async () => {
      try {
        // Load brands from localDb
        const { getBrands } = await import("@/utils/localDb");
        const loadedBrands = await getBrands();
        setBrands(loadedBrands);

        // Load activeBrand from localStorage
        if (typeof window !== "undefined") {
          const savedBrand = localStorage.getItem("activeBrand");
          if (savedBrand) {
            const parsedBrand = JSON.parse(savedBrand);
            setActiveBrand(parsedBrand);
            setBrandDraft(parsedBrand); // Sync draft with active brand
          } else if (loadedBrands.length === 0) {
            // Only show modal if no brands exist and no active brand is stored
            setShowModal(true);
          }
        }
      } catch (e) {
        console.error("Failed to load brands or activeBrand:", e);
        setShowModal(true); // Fallback to modal if loading fails
      }
    };
    loadBrandsAndActiveBrand();
  }, []);

  // Persist activeBrand and manage modal state
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (activeBrand) {
        localStorage.setItem("activeBrand", JSON.stringify(activeBrand));
        setShowModal(false); // Hide modal when a brand is active
      } else {
        localStorage.removeItem("activeBrand");
        // Only show modal if there are no brands to select from
        setShowModal(brands.length === 0);
      }
    }
  }, [activeBrand, brands]);

  const refreshBrands = async () => {
    try {
      const { getBrands } = await import("@/utils/localDb");
      const loadedBrands = await getBrands();
      setBrands(loadedBrands);
      // If no active brand and brands exist, consider showing modal or setting a default
      if (!activeBrand && loadedBrands.length > 0) {
        setShowModal(true);
      }
    } catch (e) {
      console.error("Failed to refresh brands:", e);
    }
  };

  return (
    <BrandContext.Provider
      value={{
        activeBrand,
        setActiveBrand,
        brands,
        setBrands,
        showModal,
        setShowModal,
        refreshBrands,
        brandDraft,
        setBrandDraft,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);