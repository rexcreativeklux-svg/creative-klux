const STORAGE_KEY = "mock_brands_v1";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getBrands() {
  return read();
}

export function getBrandById(id) {
  return read().find((b) => String(b.id) === String(id)) || null;
}

export function saveBrand(brand) {
  const list = read();
  const clean = { ...brand };
  if (!clean.id) clean.id = Date.now().toString();
  list.push(clean);
  write(list);
  return clean;
}

export function updateBrand(brand) {
  const list = read();
  const idx = list.findIndex((b) => String(b.id) === String(brand.id));
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...brand };
  } else {
    list.push(brand);
  }
  write(list);
  return brand;
}

export function deleteBrand(id) {
  const list = read();
  const filtered = list.filter((b) => String(b.id) !== String(id));
  write(filtered);
}

export function makeBrandUrl(id) {
  if (typeof window === "undefined") return `/brand/${id}`;
  return `${window.location.origin}/brand/${id}`;
}

export function parseBrandIdFromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    if (parts[1] === "brand" && parts[2]) return parts[2];
  } catch {
    const brandProto = url.match(/^brand:\/\/(.+)$/i);
    if (brandProto) return brandProto[1];
  }

  return null;
}