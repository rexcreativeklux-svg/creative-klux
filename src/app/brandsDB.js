// Simulating a local "database"
let brands = [
  {
    id: 1,
    url: "https://example.com/brand-1",
    name: "Default Brand 1",
    description: "This is the default brand 1 description"
  }
];

// Simulate fetch by URL
export function fetchBrandByUrl(url) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const brand = brands.find((b) => b.url === url);
      resolve(brand || null);
    }, 500); // simulate network delay
  });
}

// Simulate save/update
export function saveBrand(brand) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existingIndex = brands.findIndex((b) => b.id === brand.id);
      if (existingIndex >= 0) {
        brands[existingIndex] = brand;
      } else {
        brand.id = brands.length + 1;
        brands.push(brand);
      }
      resolve(brand);
    }, 500);
  });
}
