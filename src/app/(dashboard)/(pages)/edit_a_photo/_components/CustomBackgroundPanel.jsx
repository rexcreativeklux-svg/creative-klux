import { useEffect, useRef, useState } from "react";
import { ArrowLeft, UploadCloud, Search, Loader2 } from "lucide-react";

// "Create a background" (Custom Background) — opened from the AI Backgrounds
// panel. Three modes: Image (inspiration upload / Pexels search), Assisted
// (subject-on + details chips), and Manual (free prompt). Generation itself is
// a placeholder (onGenerate) until an AI background service is wired.

const TABS = [
  { id: "image", label: "Image" },
  { id: "assisted", label: "Assisted" },
  { id: "manual", label: "Manual" },
];

const SURFACE_CHIPS = [
  "a rustic wooden table",
  "a marble countertop",
  "a concrete slab",
  "a glass surface",
  "a vintage suitcase",
  "a ceramic tile",
  "a fluffy rug",
  "a textured fabric",
  "a shiny metal sheet",
  "a fresh grass",
];

const DETAIL_CHIPS = [
  "colorful balloons",
  "a brick wall",
  "a garden scene",
  "an ocean view",
  "an abstract painting",
  "a graffiti wall",
  "a rustic barn",
  "a city skyline",
  "a forest landscape",
  "a mountain range",
];

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

const Chip = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm hover:bg-violet-100 transition-colors cursor-pointer"
  >
    {label}
  </button>
);

const GenerateButton = ({ disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-200 disabled:cursor-not-allowed transition-colors cursor-pointer"
  >
    Generate images
  </button>
);

export default function CustomBackgroundPanel({ onBack, onApply, onGenerate }) {
  const [tab, setTab] = useState("image");

  // Image tab
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Assisted tab
  const [surface, setSurface] = useState("");
  const [details, setDetails] = useState("");

  // Manual tab
  const [prompt, setPrompt] = useState("");

  // Debounced Pexels "inspiration" search (state updates only inside the timer).
  useEffect(() => {
    const term = query.trim();
    if (!term) return undefined;
    const t = setTimeout(() => {
      setLoading(true);
      fetchPexels(term, 21).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const pickFile = (fileList) => {
    const file = Array.from(fileList || []).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) onApply(URL.createObjectURL(file));
  };

  const assistedPrompt = () =>
    `Subject on ${surface || "a surface"}${
      details ? ` with ${details} in the background` : ""
    }`;

  const q = query.trim();

  return (
    <div className="flex flex-col max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            Custom Background
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                tab === t.id
                  ? "bg-surface text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* ── Image ── */}
        {tab === "image" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Pick an image that will be used as inspiration to generate
              backgrounds for your object.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed py-8 px-4 flex items-center justify-center gap-2 text-sm transition-colors ${
                dragging ? "border-blue-400 bg-blue-50" : "border-gray-200"
              }`}
            >
              <UploadCloud className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Drop a file or</span>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                select an image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex-1 h-px bg-gray-200" />
              OR
              <span className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inspiration"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {q &&
              (loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  No inspiration found.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {results.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => onApply(img.large)}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
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
              ))}
          </div>
        )}

        {/* ── Assisted ── */}
        {tab === "assisted" && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-900">
                Your subject on
              </label>
              <input
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="a surface"
                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {SURFACE_CHIPS.map((c) => (
                  <Chip key={c} label={c} onClick={() => setSurface(c)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900">
                with
              </label>
              <input
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="details"
                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {DETAIL_CHIPS.map((c) => (
                  <Chip key={c} label={c} onClick={() => setDetails(c)} />
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-3">
                in the background
              </p>
            </div>

            <GenerateButton
              disabled={!surface.trim() && !details.trim()}
              onClick={() => onGenerate(assistedPrompt())}
            />
          </div>
        )}

        {/* ── Manual ── */}
        {tab === "manual" && (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-900">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your background"
              className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400 resize-none"
            />
            <GenerateButton
              disabled={!prompt.trim()}
              onClick={() => onGenerate(prompt.trim())}
            />
          </div>
        )}
      </div>
    </div>
  );
}
