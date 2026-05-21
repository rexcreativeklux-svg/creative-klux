"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Globe,
  Palette,
  Type,
  Tag,
  Building2,
  Calendar,
  Plus,
  Search,
  Loader2,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ── helpers ───────────────────────────────────────────────────────────────────
const cleanColor = (c) => {
  if (!c) return "#888";
  return c.replace(/`/g, "").trim() || "#888";
};

const getLogoSrc = (logo) => {
  if (!logo || typeof logo !== "string" || !logo.trim()) return null;
  if (logo.startsWith("http")) return logo;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = logo.startsWith("/") ? logo : "/" + logo;
  return cleanBase + cleanPath;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isColorLight = (hex) => {
  const c = (hex || "").replace(/`/g, "").replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16),
    g = parseInt(c.slice(2, 4), 16),
    b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
};

// ── 3-dot dropdown ────────────────────────────────────────────────────────────
const BrandMenu = ({ brand, onEdit, onDelete, light }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition cursor-pointer ${light ? "text-black/40 hover:text-black/70 hover:bg-black/10" : "text-white/70 hover:text-white hover:bg-white/20"}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1">
          <button
            onClick={() => {
              setOpen(false);
              onEdit(brand);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Brand
          </button>
          {brand.url && (
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit Site
            </a>
          )}
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              setOpen(false);
              onDelete(brand);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── brand card (grid view) ────────────────────────────────────────────────────
const BrandCard = ({ brand, onEdit, onDelete, isSelected, onSelect, isActive }) => {
  const primary = cleanColor(brand.primary_color);
  const secondary = cleanColor(brand.secondary_color);
  const logo = getLogoSrc(brand.logo);
  const [logoErr, setLogoErr] = useState(false);
  const light = isColorLight(brand.primary_color);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl hover:scale-105 overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-100 shadow-blue-50"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Banner */}
      <div
        className="relative px-4 pt-3 pb-9 select-none"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${light ? "border-black/20 bg-black/10 text-black/60" : "border-white/25 bg-white/15 text-white"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-amber-300"}`}
            />
            {isActive ? "Active" : "Draft"}
          </span>
          <BrandMenu
            brand={brand}
            onEdit={onEdit}
            onDelete={onDelete}
            light={light}
          />
        </div>
        <div className="w-12 h-12 rounded-xl border-2 border-white/80 shadow-lg bg-white flex items-center justify-center overflow-hidden">
          {logo && !logoErr ? (
            <img
              src={logo}
              alt={brand.name}
              className="w-full h-full object-contain"
              onError={() => setLogoErr(true)}
            />
          ) : (
            <span className="text-xl font-black" style={{ color: primary }}>
              {brand.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-3 pb-3">
        <div className="bg-white py-2 mb-2.5 select-none">
          <h3 className="font-bold text-gray-900 text-sm truncate">
            {brand.name}
          </h3>
          {brand.tagline ? (
            <p className="text-xs text-gray-400 truncate italic mt-0.5">
              {brand.tagline}
            </p>
          ) : (
            <p className="text-xs text-gray-300 mt-0.5">No tagline</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mb-2.5">
          {brand.industry && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-500">
              <Building2 className="w-2.5 h-2.5" /> {brand.industry}
            </span>
          )}
          {brand.fonts && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-500">
              <Type className="w-2.5 h-2.5" /> {brand.fonts}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ background: primary }}
            />
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ background: secondary }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-400">{primary}</span>
        </div>
      </div>

      {isSelected && <div className="h-0.5 w-full bg-blue-500" />}
    </div>
  );
};

// ── brand row (list view) ─────────────────────────────────────────────────────
const BrandRow = ({ brand, onEdit, onDelete, isSelected, onSelect, isActive }) => {
  const primary = cleanColor(brand.primary_color);
  const secondary = cleanColor(brand.secondary_color);
  const logo = getLogoSrc(brand.logo);
  const [logoErr, setLogoErr] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-4 px-4 py-3 hover:shadow-md ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Color strip + logo */}
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border-2 border-white shadow-md overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        {logo && !logoErr ? (
          <img
            src={logo}
            alt={brand.name}
            className="w-full h-full object-contain"
            onError={() => setLogoErr(true)}
          />
        ) : (
          <span className="text-base font-black text-white">
            {brand.name?.[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + tagline */}
      <div className="flex-1  ">
        <p className="font-bold text-gray-900 text-sm truncate">{brand.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {brand.tagline || (
            <span className="italic text-gray-300">No tagline</span>
          )}
        </p>
      </div>

      {/* Industry */}
      <div className="hidden sm:block w-28 flex-shrink-0">
        {brand.industry ? (
          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-500 w-fit">
            <Building2 className="w-2.5 h-2.5" /> {brand.industry}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </div>

      {/* Colors */}
      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 w-40 pr-12">
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ background: primary }}
        />
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ background: secondary }}
        />
        <span className="text-[10px] font-mono text-gray-400 ml-1">
          {primary}
        </span>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 w-20">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            isActive
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-amber-300"}`}
          />
          {isActive ? "Active" : "Draft"}
        </span>
      </div>

      {/* Date */}
      <div className="hidden lg:block flex-shrink-0 text-xs text-gray-400 w-24 text-right">
        {formatDate(brand.created_at)}
      </div>

      {/* Menu */}
      <div className="w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <BrandMenu
          brand={brand}
          onEdit={onEdit}
          onDelete={onDelete}
          light={false}
        />
      </div>

      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-l-xl" />
      )}
    </div>
  );
};

// ── detail panel ──────────────────────────────────────────────────────────────
const BrandDetailPanel = ({ brand, onEdit, onClose, isActive }) => {
  const primary = cleanColor(brand.primary_color);
  const secondary = cleanColor(brand.secondary_color);
  const logo = getLogoSrc(brand.logo);
  const [logoErr, setLogoErr] = useState(false);
  const router = useRouter();

  return (
    <div className="bg-white border border-gray-100 mt-10 rounded-2xl shadow-sm overflow-hidden">
      <div
        className="relative px-6 pt-3 pb-6"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            Brand Details
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex items-end gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-white/80 shadow-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            {logo && !logoErr ? (
              <img
                src={logo}
                alt={brand.name}
                className="w-full h-full object-contain"
                onError={() => setLogoErr(true)}
              />
            ) : (
              <span className="text-2xl font-black" style={{ color: primary }}>
                {brand.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="pb-1">
            <h2 className="text-xl font-black text-white leading-tight">
              {brand.name}
            </h2>
            {brand.tagline && (
              <p className="text-sm text-white/70 italic mt-0.5">
                {brand.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-2 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex flex-row justify-between py-2">
              {brand.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    About
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {brand.description}
                  </p>
                </div>
              )}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium self-start ${isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-400"}`}
                />
                {isActive ? "Active" : "Draft"}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: Building2, label: "Industry", value: brand.industry },
                { icon: Type, label: "Font", value: brand.fonts },
                {
                  icon: Calendar,
                  label: "Created",
                  value: formatDate(brand.created_at),
                },
                {
                  icon: Calendar,
                  label: "Updated",
                  value: formatDate(brand.updated_at),
                },
              ]
                .filter(({ value }) => value)
                .map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        {label}
                      </p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex gap-2 mb-4">
              {brand.url && (
                <a
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
                >
                  <Globe className="w-3.5 h-3.5" /> Visit Site
                </a>
              )}
              <button
                onClick={() => onEdit(brand)}
                className="flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium rounded-md bg-black text-white shadow-sm cursor-pointer hover:bg-gray-700 active:scale-[0.98] transition-all duration-200"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Brand
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Palette className="w-3 h-3" /> Brand Colors
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Primary", color: primary },
                  { label: "Secondary", color: secondary },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg border border-white shadow-sm flex-shrink-0"
                      style={{ background: color }}
                    />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        {label}
                      </p>
                      <p className="text-xs font-mono text-gray-700">{color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {brand.url && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Website
                </p>
                <a
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-medium hover:underline break-all flex items-start gap-1"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {brand.url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── delete confirm modal ──────────────────────────────────────────────────────
const DeleteModal = ({ brand, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <Trash2 className="w-5 h-5 text-red-500" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900">Delete brand?</h3>
        <p className="text-sm text-gray-500 mt-1">
          <strong>{brand.name}</strong> will be permanently removed. This cannot
          be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(brand.id)}
          className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 cursor-pointer transition"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function ReusePage({ setActiveTab }) {
  const router = useRouter();
  const { brands, brandsLoading, deleteBrandById, activeBrandId } = useAuth();

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const detailRef = useRef(null);

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.industry || "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedBrand = brands.find((b) => b.id === selectedId) || null;

  const handleSelect = (brand) => {
    if (selectedId === brand.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(brand.id);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleEdit = (brand) => router.push(`/brand/edit/${brand.id}`);

  const handleDeleteConfirm = async (id) => {
    if (selectedId === id) setSelectedId(null);
    setDeleteTarget(null);
    await deleteBrandById(id);
  };

  return (
    <div className="">
      {deleteTarget && (
        <DeleteModal
          brand={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Kits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Save your brand assets — colors, fonts, logos — and apply them
            instantly to any design
          </p>
        </div>
        <button
          onClick={() => router.push("/brand/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Brand
        </button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center justify-between gap-2 mb-6">
        {/* Search — shorter, max-w constrained */}
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands…"
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            title="Grid view"
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List view"
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {brandsLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading brands…</p>
        </div>
      )}

      {/* Empty */}
      {!brandsLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Tag className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">
            {search ? "No brands match your search" : "No brands yet"}
          </p>
          <p className="text-sm text-gray-400">
            {search
              ? "Try a different keyword"
              : "Create your first brand to get started"}
          </p>
          {!search && (
            <button
              onClick={() => router.push("/brand/create")}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition"
            >
              Create Brand
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {!brandsLoading && filtered.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {filtered.map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  isSelected={selectedId === brand.id}
                  isActive={brand.id === activeBrandId}
                  onSelect={() => handleSelect(brand)}
                  onEdit={handleEdit}
                  onDelete={(b) => setDeleteTarget(b)}
                />
              ))}
            </div>
          ) : (
            /* List view — header row + rows */
            <div className="flex flex-col gap-1.5 mb-6">
              {/* Column headers — mirrors BrandRow flex layout */}
              <div className="hidden sm:flex items-center gap-4 px-4 pb-1">
                {/* Logo placeholder */}
                <div className="w-10 flex-shrink-0" />
                {/* Brand */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Brand
                  </span>
                </div>
                {/* Industry */}
                <div className="w-28 flex-shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Industry
                  </span>
                </div>
                {/* Colors — hidden below md */}
                <div className="hidden md:flex items-center pr-12 flex-shrink-0 w-40">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Colors
                  </span>
                </div>
                {/* Status */}
                <div className="flex-shrink-0 w-20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Status
                  </span>
                </div>
                {/* Date — hidden below lg */}
                <div className="hidden lg:block flex-shrink-0 w-24 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Created
                  </span>
                </div>
                {/* Menu placeholder */}
                <div className="w-7 flex-shrink-0" />
              </div>
              {filtered.map((brand) => (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  isSelected={selectedId === brand.id}
                  isActive={brand.id === activeBrandId}
                  onSelect={() => handleSelect(brand)}
                  onEdit={handleEdit}
                  onDelete={(b) => setDeleteTarget(b)}
                />
              ))}
            </div>
          )}

          {/* Detail panel */}
          {selectedBrand && (
            <div ref={detailRef}>
              <BrandDetailPanel
                brand={selectedBrand}
                isActive={selectedBrand.id === activeBrandId}
                onEdit={handleEdit}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
