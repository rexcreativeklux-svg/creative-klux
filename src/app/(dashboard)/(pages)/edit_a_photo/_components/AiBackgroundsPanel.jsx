import { useEffect, useRef, useState } from "react";
import { Search, Pencil, X, Loader2 } from "lucide-react";

// AI Backgrounds panel (opens from "Add an AI background"). Search + curated
// category grids are all sourced from Pexels via /api/pexels. Applying a
// background sets the canvas' first (bottom) layer; the subject stays on top.

// Module-level cache so category thumbnails aren't re-fetched every open.
const thumbCache = new Map(); // query -> { src, large, alt }

async function fetchPexels(query, perPage) {
  try {
    const res = await fetch(
      `/api/pexels?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    );
    const data = await res.json();
    return (data.photos || []).map((p) => ({
      id: p.id,
      src: p.src.medium,
      large: p.src.large2x || p.src.large,
      alt: p.alt || query,
    }));
  } catch {
    return [];
  }
}

const TRENDING = [
  "Studio backdrop",
  "Gradient",
  "Marble",
  "Beach",
  "Sunset",
  "Flowers",
  "Bokeh",
  "Wood",
  "Minimalist",
];

const CATEGORIES = [
  {
    title: "Mood",
    items: [
      "Spring",
      "Sunset",
      "Wood",
      "Mountain",
      "Clouds",
      "Minimalist",
      "Beach",
      "Tropical",
      "Bokeh",
      "Monstera",
      "Flowers",
      "Snow",
      "Autumn",
      "Golden light",
      "Love",
      "Street",
      "Tree stump",
      "Countryside sunset",
    ],
  },
  {
    title: "Countertop",
    items: [
      "Light wood countertop",
      "Marble countertop",
      "Concrete countertop",
      "Black marble",
      "Brown marble",
      "Cream marble",
      "Green marble",
      "Dark wood countertop",
    ],
  },
  {
    title: "Plant",
    items: [
      "Succulents",
      "Monstera plant",
      "Cactus",
      "Air plants",
      "Hoya plant",
      "Pilea plant",
    ],
  },
  { title: "Texture", items: ["Water", "Soil", "Fabric", "Marble texture"] },
  {
    title: "Mountain",
    items: [
      "Mountains",
      "Volcano",
      "Snowy mountains",
      "Tropical mountains",
      "Sand dunes",
      "Grand canyon",
      "Mountain sunset",
      "Waterfall",
      "Canyon river",
    ],
  },
  {
    title: "Event",
    items: [
      "Lunar new year",
      "Valentine roses",
      "Valentine hearts",
      "Carnival",
      "Super bowl",
      "St patrick",
      "Easter",
      "Birthday",
      "Wedding",
      "Baby shower",
      "Christmas",
      "Fireworks",
    ],
  },
  {
    title: "Surface",
    items: [
      { label: "Surface lime green", query: "lime green surface" },
      { label: "Surface emerald green", query: "emerald green surface" },
      { label: "Surface army green", query: "army green surface" },
    ],
  },
  { title: "Flower", items: ["Roses", "Tulips", "Lavender", "Cherry blossom"] },
  {
    title: "A window on",
    items: [
      { label: "Window on New York", query: "New York city window view" },
      { label: "Window on Paris", query: "Paris window view" },
      { label: "Window on Marrakech", query: "Marrakech" },
      { label: "Window on Mykonos", query: "Mykonos" },
      { label: "Window on Venice", query: "Venice canal" },
      { label: "Window on Okinawa", query: "Okinawa beach" },
      { label: "Window on Bali", query: "Bali beach" },
      { label: "Window on Berlin", query: "Berlin city" },
      { label: "Window on the ocean", query: "ocean view window" },
      { label: "Window on the sea", query: "sea view" },
      { label: "Window on a pine forest", query: "pine forest" },
    ],
  },
  {
    title: "Creative",
    items: ["Supernova", "Fireworks", "Graffiti", "Color splash"],
  },
  {
    title: "Gundam",
    items: [
      { label: "On the moon", query: "moon surface" },
      "Deep space",
      "Jungle",
      { label: "Alien planet", query: "alien planet landscape" },
    ],
  },
  {
    title: "Backdrop",
    items: [
      { label: "Light", query: "light studio backdrop" },
      { label: "Dark", query: "dark studio backdrop" },
      { label: "Blue", query: "blue gradient backdrop" },
      { label: "Red", query: "red gradient backdrop" },
      { label: "Pink", query: "pink gradient backdrop" },
      { label: "Orange", query: "orange gradient backdrop" },
      { label: "Golden", query: "golden gradient backdrop" },
      { label: "Gradient", query: "colorful gradient" },
    ],
  },
  {
    title: "Fabric",
    items: [
      "White fabric",
      "Black fabric",
      "Yellow fabric",
      "Orange fabric",
      "Red fabric",
      "Maroon fabric",
      "Light coral fabric",
      "Rose pink fabric",
      "Taffy pink fabric",
      "Hot pink fabric",
      "Violet fabric",
      "Plum fabric",
    ],
  },
  {
    title: "Water",
    items: [
      "White water",
      "Black water",
      "Yellow water",
      "Orange water",
      "Red water",
      "Maroon water",
      "Light coral water",
      "Rose pink water",
      "Taffy pink water",
      "Hot pink water",
      "Violet water",
      "Plum water",
    ],
  },
];

// One thumbnail for a curated label — lazily fetches its Pexels image when it
// scrolls near the viewport (keeps the panel from firing dozens of calls at once).
function CategoryThumb({ label, query = label, onApply }) {
  const ref = useRef(null);
  const [img, setImg] = useState(() => thumbCache.get(query) || null);

  useEffect(() => {
    if (img) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        fetchPexels(query, 1).then((r) => {
          const first = r[0];
          if (first && !cancelled) {
            thumbCache.set(query, first);
            setImg(first);
          }
        });
      },
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [query, img]);

  return (
    <button
      ref={ref}
      onClick={() => img && onApply(img.large)}
      disabled={!img}
      className="group text-left cursor-pointer disabled:cursor-default"
    >
      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
        {img ? (
          <img
            src={img.src}
            alt={label}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-100" />
        )}
      </div>
      <p className="mt-1 text-xs text-gray-600 truncate">{label}</p>
    </button>
  );
}

function CategorySection({ title, items, onApply }) {
  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-900 mb-2">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => {
          const label = typeof it === "string" ? it : it.label;
          const query = typeof it === "string" ? it : it.query;
          return (
            <CategoryThumb
              key={label}
              label={label}
              query={query}
              onApply={onApply}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function AiBackgroundsPanel({ onApply, onClose, onCreate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced Pexels search. All state updates happen inside the timer/promise
  // (never synchronously in the effect body).
  useEffect(() => {
    const term = query.trim();
    if (!term) return undefined;
    const t = setTimeout(() => {
      setLoading(true);
      fetchPexels(term, 30).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const q = query.trim();

  return (
    <div className="flex flex-col max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-semibold text-lg text-gray-900">AI Backgrounds</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-3">
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Pencil className="w-4 h-4" /> Create a background
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for backgrounds"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
        {q ? (
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-2">
              Results
            </h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No backgrounds found.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {results.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => onApply(img.large)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CategorySection
            title="Trending"
            items={TRENDING}
            onApply={onApply}
          />
        )}

        {CATEGORIES.map((cat) => (
          <CategorySection
            key={cat.title}
            title={cat.title}
            items={cat.items}
            onApply={onApply}
          />
        ))}
      </div>
    </div>
  );
}
