import { useEffect, useRef, useState } from "react";
import { fetchPexels } from "./pexelsClient";

// Module cache so a card's 4 preview thumbnails aren't re-fetched every time the
// library re-renders / re-opens. Keyed by the category query.
const previewCache = new Map(); // query -> photos[]

// One category "card": a label over a row of 4 preview thumbnails. Previews load
// lazily when the card nears the viewport. Clicking opens the dedicated panel.
export default function CategoryCard({ category, onOpen }) {
  const ref = useRef(null);
  const [photos, setPhotos] = useState(
    () => previewCache.get(category.query) || null,
  );

  useEffect(() => {
    if (photos) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        fetchPexels({ query: category.query, perPage: 4 }).then(({ photos: p }) => {
          if (cancelled) return;
          previewCache.set(category.query, p);
          setPhotos(p);
        });
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [category.query, photos]);

  return (
    <button
      ref={ref}
      onClick={() => onOpen(category)}
      className="text-left border border-gray-200 rounded-xl p-2 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
    >
      <p className="text-xs font-semibold text-gray-900 mb-1.5 px-0.5">
        {category.label}
      </p>
      <div className="grid grid-cols-4 gap-1">
        {(photos && photos.length
          ? photos.slice(0, 4)
          : Array.from({ length: 4 })
        ).map((img, i) => (
          <div
            key={img ? img.id : i}
            className="aspect-square rounded-md overflow-hidden bg-gray-100"
          >
            {img && (
              <img
                src={img.src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
    </button>
  );
}
