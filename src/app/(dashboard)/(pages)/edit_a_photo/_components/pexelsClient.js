// Shared Pexels fetch helper for the editor's background panels. Returns a
// normalized photo shape + whether another page exists (for infinite scroll).
export async function fetchPexels({ query, page = 1, perPage = 24 }) {
  try {
    const res = await fetch(
      `/api/pexels?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    );
    const data = await res.json();
    const photos = (data.photos || []).map((p) => ({
      id: p.id,
      src: p.src.medium,
      large: p.src.large2x || p.src.large,
      alt: p.alt || query,
    }));
    return { photos, hasMore: Boolean(data.next_page) };
  } catch {
    return { photos: [], hasMore: false };
  }
}
