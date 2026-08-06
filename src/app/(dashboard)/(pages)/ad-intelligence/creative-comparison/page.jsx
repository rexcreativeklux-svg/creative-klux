"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompareArrows,
  Upload,
  Globe,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  LayoutGrid,
  Check,
  Wand2,
  Star,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
// Shared, read-only renderer — same one the editor (/design/[id]) uses to paint
// and export, so previews and the exported PNG match what opens in the editor.
import {
  renderDesignToCanvas,
  renderDesignToBlob,
} from "@/(lib)/design/renderDesign";

/* ─── constants ───────────────────────────────────────────────── */
const MODES = [
  {
    id: "creatives",
    label: "Compare Creatives",
    icon: Upload,
    description: "Upload two ad creatives",
  },
  {
    id: "websites",
    label: "Compare Websites",
    icon: Globe,
    description: "Enter two competitor URLs",
  },
];

const CREATIVE_SCORES = [
  { key: "conversionScore", label: "Conversion" },
  { key: "engagementScore", label: "Engagement" },
  { key: "visualScore", label: "Visual" },
  { key: "brandScore", label: "Brand" },
];

const WEBSITE_SCORES = [
  { key: "seoScore", label: "SEO" },
  { key: "contentScore", label: "Content" },
  { key: "socialScore", label: "Social" },
];

/* ─── helpers ─────────────────────────────────────────────────── */
const scoreColor = (s) =>
  s >= 80 ? "#10b981" : s >= 60 ? "#2563eb" : s >= 40 ? "#f97316" : "#ef4444";

const scoreBg = (s) =>
  s >= 80
    ? "bg-emerald-50 text-emerald-700"
    : s >= 60
      ? "bg-blue-50 text-blue-700"
      : s >= 40
        ? "bg-orange-50 text-orange-700"
        : "bg-red-50 text-red-700";

const marginColor = {
  Narrow: "text-blue-600 bg-blue-50",
  Clear: "text-orange-600 bg-orange-50",
  Decisive: "text-red-600 bg-red-50",
};

// Type → badge colours, mirroring the Creatives library so the picker cards read
// identically to /creatives.
const TYPE_COLOR = {
  ads: { text: "text-blue-600", border: "border-blue-100", dot: "bg-blue-500" },
  social: {
    text: "text-indigo-600",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
  },
  card: {
    text: "text-violet-600",
    border: "border-violet-100",
    dot: "bg-violet-500",
  },
  banner: {
    text: "text-teal-600",
    border: "border-teal-100",
    dot: "bg-teal-500",
  },
  image: { text: "text-blue-600", border: "border-blue-100", dot: "bg-blue-400" },
  video: { text: "text-cyan-600", border: "border-cyan-100", dot: "bg-cyan-500" },
};
const DEFAULT_COLOR = {
  text: "text-gray-600",
  border: "border-gray-200",
  dot: "bg-gray-400",
};

/* ─── ScoreBar ────────────────────────────────────────────────── */
function ScoreBar({ label, scoreA, scoreB, labelA, labelB }) {
  const diff = scoreA - scoreB;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md ${scoreBg(scoreA)}`}
          >
            {scoreA}
          </span>
          <span className="text-xs text-gray-300">vs</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md ${scoreBg(scoreB)}`}
          >
            {scoreB}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scoreA}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: scoreColor(scoreA) }}
          />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scoreB}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: scoreColor(scoreB) }}
          />
        </div>
      </div>
      {diff !== 0 && (
        <p className="text-[10px] text-gray-400 mt-0.5 text-right">
          {diff > 0
            ? `${labelA} leads by ${diff.toFixed(1)}`
            : `${labelB} leads by ${Math.abs(diff).toFixed(1)}`}
        </p>
      )}
    </div>
  );
}

/* ─── ProConList ──────────────────────────────────────────────── */
function ProConList({ pros = [], cons = [] }) {
  return (
    <div className="space-y-1.5">
      {pros.map((p, i) => (
        <div
          key={`pro-${i}`}
          className="flex gap-2 items-start p-2 rounded-lg bg-emerald-50 border border-emerald-100"
        >
          <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 leading-relaxed">{p}</p>
        </div>
      ))}
      {cons.map((c, i) => (
        <div
          key={`con-${i}`}
          className="flex gap-2 items-start p-2 rounded-lg bg-red-50 border border-red-100"
        >
          <TrendingDown className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 leading-relaxed">{c}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── WebsiteMetrics ──────────────────────────────────────────── */
function WebsiteMetrics({ item }) {
  const metrics = [
    { label: "Monthly Visits", value: item.monthlyVisits },
    { label: "Unique Visitors", value: item.uniqueVisitors },
    { label: "Pages/Visit", value: item.pagesPerVisit },
    { label: "Avg Duration", value: item.avgDuration },
    { label: "Bounce Rate", value: item.bounceRate },
    { label: "Top Age Group", value: item.topAgeGroup },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {metrics
        .filter((m) => m.value)
        .map((m, i) => (
          <div
            key={i}
            className="bg-gray-50 border border-gray-100 rounded-xl p-2.5"
          >
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
              {m.label}
            </p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{m.value}</p>
          </div>
        ))}
      {item.desktopShare != null && (
        <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1.5">
            Device Split
          </p>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Desktop</span>
                <span>{item.desktopShare}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${item.desktopShare}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Mobile</span>
                <span>{item.mobileShare}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${item.mobileShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PreviewCanvas ─────────────────────────────────────────────────────────────
// Full-width read-only preview painted with the SAME renderer the editor uses,
// so a picker card's thumbnail matches /creatives and /design/[id] exactly.
function PreviewCanvas({ canvas, elements }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const node = canvasRef.current;
    if (!node || !canvas) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas,
          elements: elements || [],
        });
        if (cancelled || !canvasRef.current) return;
        const target = canvasRef.current;
        target.width = off.width;
        target.height = off.height;
        const ctx = target.getContext("2d");
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.drawImage(off, 0, 0);
      } catch {
        /* leave blank if rendering fails */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canvas, elements]);

  if (!canvas) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", maxWidth: "100%", height: "auto", display: "block" }}
    />
  );
}

// ── normalizeDesign (same as your Creatives page) ─────────────────────────────
function normalizeDesign(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  let canvasData = null,
    elements = [];
  if (parsed && typeof parsed === "object") {
    if (parsed.canvas && Array.isArray(parsed.elements)) {
      canvasData = parsed.canvas;
      elements = parsed.elements;
    } else if (parsed.width && parsed.height) canvasData = parsed;
  }
  let copy = raw.copy || {};
  if (typeof copy === "string") {
    try {
      copy = JSON.parse(copy);
    } catch {
      copy = { body: copy };
    }
  }
  return {
    id: raw.id,
    name: raw.name || "Untitled Design",
    type: raw.sub_type || raw.type || "image",
    category: raw.type || "ads",
    date: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—",
    score: raw.score || 0,
    copy,
    canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
    elements,
    image: raw.image_url || null,
  };
}

// ── CreativePickerCard ────────────────────────────────────────────────────────
// A selectable card that mirrors the /creatives library card style (16/9 canvas
// preview, type badge, score, name, tagline, date). It's a picker, so it swaps
// the favourite/delete actions for a selected-state ring + check.
function CreativePickerCard({ design: c, selected, onSelect }) {
  const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
  const hasCanvas = c.canvas && c.elements?.length > 0;
  const tagline = c.copy?.tagline || "";

  return (
    <button
      onClick={() => onSelect(c)}
      className={`group text-left bg-surface rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col relative ${
        selected
          ? "border-indigo-500 shadow-lg shadow-indigo-100/60"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Preview */}
      <div
        className="relative overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ aspectRatio: "16/9", minHeight: 96 }}
      >
        {hasCanvas ? (
          <div className="w-full flex items-center justify-center p-2 bg-gray-50">
            <PreviewCanvas canvas={c.canvas} elements={c.elements} />
          </div>
        ) : c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image}
            alt={c.name}
            className="w-full h-auto block"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <Wand2 className="w-6 h-6" />
            <span className="text-[10px]">No preview</span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-sm bg-surface/90 ${tc.text} ${tc.border} capitalize`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
            {c.category}
          </span>
        </div>

        {/* Selected check */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Score */}
        {c.score > 0 && (
          <div className="absolute bottom-2 right-2 bg-surface/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
            ★ {c.score}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-2.5">
        <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
        {tagline ? (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate italic">
            {tagline}
          </p>
        ) : (
          <p className="text-[10px] text-gray-300 mt-0.5 truncate capitalize">
            {c.category}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
          <Clock className="w-3 h-3 text-gray-300" />
          <span className="text-[10px] text-gray-400">{c.date}</span>
        </div>
      </div>
    </button>
  );
}

// ── CreativeUpload (updated with tabs) ────────────────────────────────────────
function CreativeUpload({ label, value, onChange }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "projects"
  const [designs, setDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState(null);

  const { fetchDesigns } = useAuth();

  // Load designs when "From projects" tab is first opened
  const handleTabSwitch = async (tab) => {
    setActiveTab(tab);
    if (tab === "projects" && designs.length === 0) {
      setLoadingDesigns(true);
      const data = await fetchDesigns(20);
      if (data) {
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        setDesigns(arr.map(normalizeDesign));
      }
      setLoadingDesigns(false);
    }
  };

  const acceptFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) =>
      onChange({ ...value, url: e.target.result, file: f });
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      acceptFile(e.dataTransfer.files?.[0]);
    },
    [value],
  );

  const clear = () => {
    onChange({ url: "", file: null, label: value.label });
    setSelectedDesignId(null);
  };

  // const handleSelectDesign = (design) => {
  //     setSelectedDesignId(design.id);
  //     // Use the canvas background color as a data URL isn't available,
  //     // so we pass the design metadata and let the parent use it for labeling.
  //     // For actual image passing, you'd need to render to a canvas and export.
  //     onChange({ ...value, label: design.name, designId: design.id, url: "canvas://" + design.id, file: null, design });
  // };

  const handleSelectDesign = async (design) => {
    setSelectedDesignId(design.id);

    // Render the design to a PNG via the shared renderer so the exported/compared
    // image matches exactly what the editor shows.
    let blob = null;
    try {
      blob = await renderDesignToBlob({
        canvas: design.canvas,
        elements: design.elements || [],
      });
    } catch {
      blob = null;
    }

    if (!blob) {
      // Fallback: just pass label without a file (will show error on compare)
      onChange({
        ...value,
        label: design.name,
        designId: design.id,
        url: "",
        file: null,
        design,
      });
      return;
    }

    const file = new File([blob], `${design.name || "design"}.png`, {
      type: "image/png",
    });
    const previewUrl = URL.createObjectURL(blob);
    onChange({
      ...value,
      label: design.name,
      designId: design.id,
      url: previewUrl, // local blob URL for preview
      file, // actual File for FormData upload
      design,
    });
  };

  return (
    <div className="bg-surface border border-gray-200 rounded-2xl p-5 h-full flex flex-col min-w-0">
      {/* Label input */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
          {label} Name
        </label>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder={label}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-indigo-400 focus:bg-surface transition text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        <button
          onClick={() => handleTabSwitch("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "upload" ? "bg-surface text-gray-800 " : "text-gray-500 hover:text-gray-700"}`}
        >
          <Upload className="w-3 h-3" /> Upload image
        </button>
        <button
          onClick={() => handleTabSwitch("projects")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "projects" ? "bg-surface text-gray-800 " : "text-gray-500 hover:text-gray-700"}`}
        >
          <LayoutGrid className="w-3 h-3" /> From Creatives
        </button>
      </div>

      {/* ── Upload tab ── */}
      {activeTab === "upload" &&
        (!value.url || value.url.startsWith("canvas://") ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all group"
            style={{
              borderColor: dragging ? "#6366f1" : "#e5e7eb",
              background: dragging ? "#eef2ff" : "#f9fafb",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => acceptFile(e.target.files?.[0])}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors">
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Upload {label}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP · drag & drop
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden flex-1">
            <img
              src={value.url}
              alt={label}
              className="w-full object-contain max-h-52 bg-gray-100"
            />
            <button
              onClick={clear}
              className="absolute top-2 right-2 w-7 h-7 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition cursor-pointer "
            >
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}

      {/* ── Projects tab ── */}
      {activeTab === "projects" && (
        <div className="flex-1 flex flex-col min-h-0">
          {loadingDesigns ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : designs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <Wand2 className="w-8 h-8 text-gray-200" />
              <p className="text-xs text-gray-400">No designs found</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 340 }}>
              <div className="grid grid-cols-2 gap-3">
                {designs.map((d) => (
                  <CreativePickerCard
                    key={d.id}
                    design={d}
                    selected={selectedDesignId === d.id}
                    onSelect={handleSelectDesign}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selected design preview */}
          {selectedDesignId && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <p className="text-xs font-semibold text-indigo-700 flex-1 truncate">
                {designs.find((d) => d.id === selectedDesignId)?.name}
              </p>
              <button
                onClick={clear}
                className="text-indigo-400 hover:text-indigo-600 cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── WebsiteInput ────────────────────────────────────────────── */
function WebsiteInput({ label, value, onChange }) {
  return (
    <div className="bg-surface border border-gray-200 rounded-2xl p-5  h-full flex flex-col">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {label}
      </p>
      <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus-within:border-indigo-400 focus-within:bg-surface transition">
        <Globe className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-300 hover:text-gray-500 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="text-center">
          <Globe className="w-10 h-10 text-gray-100 mx-auto mb-2" />
          <p className="text-xs text-gray-300">Enter a URL to compare</p>
        </div>
      </div>
    </div>
  );
}

/* ─── ResultsPanel ────────────────────────────────────────────── */
function ResultsPanel({ result, onReset }) {
  if (!result) return null;
  const { itemA, itemB, verdict, winner, marginOfVictory, mode } = result;
  const scores = mode === "creatives" ? CREATIVE_SCORES : WEBSITE_SCORES;

  const WinnerBadge = ({ which }) => {
    const isWinner = winner === which;
    return isWinner ? (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" /> Winner
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
        <XCircle className="w-3 h-3" /> Runner-up
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Comparison Results</h2>
        <button
          onClick={onReset}
          className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-surface transition"
        >
          New Comparison
        </button>
      </div>

      {/* Verdict banner */}
      <div className="bg-linear-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <GitCompareArrows className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900 text-sm">AI Verdict</p>
            {marginOfVictory && (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${marginColor[marginOfVictory] ?? "text-gray-600 bg-gray-100"}`}
              >
                {marginOfVictory} victory
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{verdict}</p>
      </div>

      {/* Score comparison */}
      <div className="bg-surface border border-gray-200 rounded-2xl p-5 ">
        <p className="font-semibold text-sm text-gray-900 mb-5">
          Score Breakdown
        </p>

        {/* Overall */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { item: itemA, which: "A" },
            { item: itemB, which: "B" },
          ].map(({ item, which }) => (
            <div
              key={which}
              className={`rounded-xl p-4 border-2 text-center ${winner === which ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}
            >
              <p className="text-xs text-gray-500 mb-1 truncate font-medium">
                {item.label}
              </p>
              <p
                className="text-3xl font-black mb-2"
                style={{ color: scoreColor(item.overallScore) }}
              >
                {item.overallScore}
              </p>
              <WinnerBadge which={which} />
            </div>
          ))}
        </div>

        {/* Per-dimension bars */}
        {scores.map((s) => (
          <ScoreBar
            key={s.key}
            label={s.label}
            scoreA={itemA[s.key] ?? 0}
            scoreB={itemB[s.key] ?? 0}
            labelA={itemA.label}
            labelB={itemB.label}
          />
        ))}
      </div>

      {/* Website metrics (websites mode only) */}
      {mode === "websites" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { item: itemA, which: "A" },
            { item: itemB, which: "B" },
          ].map(({ item, which }) => (
            <motion.div
              key={which}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (which === "A" ? 0 : 1) }}
              className="bg-surface border border-gray-200 rounded-2xl p-5 "
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {item.label}
                </p>
                <WinnerBadge which={which} />
              </div>
              <WebsiteMetrics item={item} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { item: itemA, which: "A" },
          { item: itemB, which: "B" },
        ].map(({ item, which }) => (
          <motion.div
            key={which}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + 0.08 * (which === "A" ? 0 : 1) }}
            className="bg-surface border border-gray-200 rounded-2xl p-5 "
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {item.label}
              </p>
              <WinnerBadge which={which} />
            </div>
            <ProConList pros={item.pros} cons={item.cons} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function Comparison() {
  const { runComparison } = useAuth();

  const [mode, setMode] = useState("creatives");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Creatives
  const [creativeA, setCreativeA] = useState({
    url: "",
    file: null,
    label: "Creative A",
  });
  const [creativeB, setCreativeB] = useState({
    url: "",
    file: null,
    label: "Creative B",
  });

  // Websites
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");

  const canCompare =
    mode === "creatives"
      ? creativeA.url && creativeB.url
      : urlA.trim() && urlB.trim();

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    const response = await runComparison({
      mode,
      creativeA,
      creativeB,
      urlA,
      urlB,
    });

    if (!response.ok) {
      setError(response.message || "Comparison failed. Please try again.");
    } else {
      setResult({ mode, ...response.data });
    }
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setError("");
  };

  const switchMode = (id) => {
    setMode(id);
    setResult(null);
    setError("");
  };

  return (
    <div className="" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="pb-5">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-br from-indigo-500 to-violet-600 ">
              <GitCompareArrows className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Creative Comparison
              </h1>
              <p className="text-sm text-gray-400">
                Compare two creatives or competitor websites with AI-powered
                scoring.
              </p>
            </div>
          </div>
        </div>

        {/* ── Mode Selector ──
            Side by side these two cards leave ~150px each on a phone, which
            wraps their descriptions to four lines — so they stack until sm. */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-left transition-all duration-200 flex-1 max-w-none sm:max-w-xs cursor-pointer ${
                  active
                    ? "border-indigo-300 bg-indigo-50 "
                    : "border-gray-200 bg-surface hover:border-indigo-200 hover:bg-indigo-50/40"
                }`}
              >
                <m.icon
                  className={`w-5 h-5 shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${active ? "text-indigo-700" : "text-gray-700"}`}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5">
                    {m.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Input Grid ── */}
        {!result && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] gap-4 items-stretch mb-6">
            {mode === "creatives" ? (
              <>
                <CreativeUpload
                  label="Creative A"
                  value={creativeA}
                  onChange={setCreativeA}
                />
                <div className="flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-bold text-xs bg-surface ">
                    VS
                  </div>
                </div>
                <CreativeUpload
                  label="Creative B"
                  value={creativeB}
                  onChange={setCreativeB}
                />
              </>
            ) : (
              <>
                <WebsiteInput
                  label="Website A"
                  value={urlA}
                  onChange={setUrlA}
                />
                <div className="flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-bold text-xs bg-surface ">
                    VS
                  </div>
                </div>
                <WebsiteInput
                  label="Website B"
                  value={urlB}
                  onChange={setUrlB}
                />
              </>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ── CTA ── */}
        {!loading && !result && (
          <div className="flex justify-center mb-10">
            <button
              onClick={handleRun}
              disabled={!canCompare}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer  bg-linear-to-r from-indigo-500 to-violet-600"
            >
              <GitCompareArrows className="w-4 h-4" /> Run AI Comparison
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">
                AI is analyzing and comparing…
              </p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {result && !loading && (
            <ResultsPanel result={result} onReset={handleReset} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
