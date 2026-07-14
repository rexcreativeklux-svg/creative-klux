import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchPexels } from "./pexelsClient";

// Endless Pexels grid: loads a page at a time and fetches the next one as the
// bottom sentinel scrolls into view. Reused by the background search results and
// by each dedicated category panel.
//
// Remount (via a `key={query}` from the parent) to start a fresh query — the
// component intentionally has no query-reset effect, which keeps every setState
// off the synchronous effect path (React Compiler friendly).
//
//   query      — Pexels search term
//   onApply    — (largeUrl) => void
//   selectedSrc— currently-applied src (ring highlight), optional
export default function InfinitePexelsGrid({
  query,
  onApply,
  selectedSrc = null,
}) {
  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    const page = pageRef.current;
    const { photos: fresh, hasMore: more } = await fetchPexels({
      query,
      page,
      perPage: 24,
    });
    setPhotos((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...fresh.filter((p) => !seen.has(p.id))];
    });
    pageRef.current = page + 1;
    hasMoreRef.current = more && fresh.length > 0;
    setHasMore(hasMoreRef.current);
    setLoaded(true);
    loadingRef.current = false;
  }, [query]);

  // Observe the bottom sentinel — its callback fires asynchronously (even on the
  // initial intersection), so the first page loads without a synchronous
  // setState inside the effect.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div>
      {loaded && photos.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No backgrounds found.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((img) => {
            const active = selectedSrc && selectedSrc === img.large;
            return (
              <button
                key={img.id}
                onClick={() => onApply?.(img.large)}
                className={`group aspect-[3/4] rounded-lg overflow-hidden border cursor-pointer bg-gray-100 ${
                  active
                    ? "ring-2 ring-blue-500 border-transparent"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Sentinel + loading spinner */}
      <div ref={sentinelRef} className="h-8" />
      {hasMore && (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
