// src/data/mockBrands.js

// This will simulate our local database
export const mockBrandsDB = [
  {
    id: "1",
    name: "Nike",
    description: "Just Do It. Sportswear and lifestyle brand.",
    url: "https://www.nike.com",
  },
  {
    id: "2",
    name: "Apple",
    description: "Think Different. Technology and innovation.",
    url: "https://www.apple.com",
  },
];

// Function to simulate fetching all brands
export const fetchBrands = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("brandsDB");
    return stored ? JSON.parse(stored) : mockBrandsDB;
  }
  return mockBrandsDB;
};

// Function to add a new brand
export const addBrand = (brand) => {
  const current = fetchBrands();
  const updated = [...current, { id: Date.now().toString(), ...brand }];
  localStorage.setItem("brandsDB", JSON.stringify(updated));
  return updated;
};

// Function to update a brand
export const updateBrand = (id, updatedData) => {
  const current = fetchBrands();
  const updated = current.map((b) =>
    b.id === id ? { ...b, ...updatedData } : b
  );
  localStorage.setItem("brandsDB", JSON.stringify(updated));
  return updated;
};
