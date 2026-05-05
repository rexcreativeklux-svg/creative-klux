"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical, Edit2, Trash2, ExternalLink,
  Globe, Palette, Type, Tag, Building2, Calendar,
  Plus, Search, Loader2, AlertCircle, X, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const isColorLight = (hex) => {
  const c = (hex || "").replace(/`/g, "").replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
};

// ── 3-dot dropdown ────────────────────────────────────────────────────────────
const BrandMenu = ({ brand, onEdit, onDelete, light }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition cursor-pointer ${light ? "text-black/40 hover:text-black/70 hover:bg-black/10" : "text-white/70 hover:text-white hover:bg-white/20"
          }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1">
          <button
            onClick={() => { setOpen(false); onEdit(brand); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Brand
          </button>
          {brand.url && (
            <a
              href={brand.url} target="_blank" rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit Site
            </a>
          )}
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { setOpen(false); onDelete(brand); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── brand card (compact, no expansion) ───────────────────────────────────────
const BrandCard = ({ brand, onEdit, onDelete, isSelected, onSelect }) => {
  const primary = cleanColor(brand.primary_color);
  const secondary = cleanColor(brand.secondary_color);
  const logo = getLogoSrc(brand.logo);
  const [logoErr, setLogoErr] = useState(false);
  const light = isColorLight(brand.primary_color);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl hover:scale-105 overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer ${isSelected
        ? "border-blue-500 ring-2 ring-blue-100 shadow-blue-50"
        : "border-gray-100 hover:border-gray-200"
        }`}
    >
      {/* Banner */}
      <div
        className="relative px-4 pt-3 pb-9 select-none"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />

        {/* Status + menu */}
        <div className="relative flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${light ? "border-black/20 bg-black/10 text-black/60" : "border-white/25 bg-white/15 text-white"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${brand.status === 1 ? "bg-emerald-400" : "bg-amber-300"}`} />
            {brand.status === 1 ? "Active" : "Draft"}
          </span>
          <BrandMenu brand={brand} onEdit={onEdit} onDelete={onDelete} light={light} />
        </div>

        {/* Logo */}
        <div className="w-12 h-12 rounded-xl border-2 border-white/80 shadow-lg bg-white flex items-center justify-center overflow-hidden">
          {logo && !logoErr
            ? <img src={logo} alt={brand.name} className="w-full h-full object-contain" onError={() => setLogoErr(true)} />
            : <span className="text-xl font-black" style={{ color: primary }}>{brand.name?.[0]?.toUpperCase()}</span>
          }
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-3 pb-3">
        {/* Name card */}
        <div className="bg-white py-2 mb-2.5 select-none">
          <h3 className="font-bold text-gray-900 text-sm truncate">{brand.name}</h3>
          {brand.tagline
            ? <p className="text-xs text-gray-400 truncate italic mt-0.5">{brand.tagline}</p>
            : <p className="text-xs text-gray-300 mt-0.5">No tagline</p>
          }
        </div>

        {/* Tags */}
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

        {/* Color swatches */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: primary }} />
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: secondary }} />
          </div>
          <span className="text-[10px] font-mono text-gray-400">{primary}</span>
        </div>
      </div>

      {/* Selected indicator strip */}
      {isSelected && (
        <div className="h-0.5 w-full bg-blue-500" />
      )}
    </div>
  );
};

// ── detail panel (renders below the grid) ────────────────────────────────────
const BrandDetailPanel = ({ brand, onEdit, onClose }) => {
  const primary = cleanColor(brand.primary_color);
  const secondary = cleanColor(brand.secondary_color);
  const logo = getLogoSrc(brand.logo);
  const [logoErr, setLogoErr] = useState(false);
  const router = useRouter();

  return (
    <div className="bg-white border border-gray-100 mt-10 rounded-2xl shadow-sm overflow-hidden">
      {/* Panel header */}
      <div
        className="relative px-6 pt-3 pb-6"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        {/* Top controls */}
        <div className="relative flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Brand Details</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logo + name */}
        <div className="relative flex items-end gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-white/80 shadow-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            {logo && !logoErr
              ? <img src={logo} alt={brand.name} className="w-full h-full object-contain" onError={() => setLogoErr(true)} />
              : <span className="text-2xl font-black" style={{ color: primary }}>{brand.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="pb-1">
            <h2 className="text-xl font-black text-white leading-tight">{brand.name}</h2>
            {brand.tagline && <p className="text-sm text-white/70 italic mt-0.5">{brand.tagline}</p>}
          </div>
        </div>
      </div>

      {/* Panel body */}
      <div className="px-6 py-2 pb-6">


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Left: about + meta */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex flex-row justify-between py-2">
              {brand.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">About</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{brand.description}</p>
                </div>
              )}

              {/* Status */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium self-start ${brand.status === 1
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                <span className={`w-2 h-2 rounded-full ${brand.status === 1 ? "bg-emerald-500" : "bg-amber-400"}`} />
                {brand.status === 1 ? "Active" : "Draft"}
              </div>
            </div>



            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: Building2, label: "Industry", value: brand.industry },
                { icon: Type, label: "Font", value: brand.fonts },
                { icon: Calendar, label: "Created", value: formatDate(brand.created_at) },
                { icon: Calendar, label: "Updated", value: formatDate(brand.updated_at) },
              ].filter(({ value }) => value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>


            {/* Quick action bar */}
            <div className="flex gap-2 mb-4">

              {brand.url && (
                <a
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-1 
      text-sm font-semibold rounded-md
      bg-white border border-gray-200 text-gray-700
      hover:bg-gray-50 hover:border-gray-200 
      active:scale-[0.98]
      transition-all duration-200"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Visit Site
                </a>
              )}

              <button
                onClick={() => onEdit(brand)}
                className="flex items-center justify-center gap-2 px-3 py-1 
    text-sm font-medium rounded-md
    bg-black text-white shadow-sm cursor-pointer
    hover:bg-gray-700 
    active:scale-[0.98]
    transition-all duration-200"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Brand
              </button>
            </div>

          </div>

          {/* Right: palette + URL + status */}
          <div className="flex flex-col gap-3">
            {/* Colors */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Palette className="w-3 h-3" /> Brand Colors
              </p>
              <div className="flex flex-col gap-2.5">
                {[{ label: "Primary", color: primary }, { label: "Secondary", color: secondary }].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg border border-white shadow-sm flex-shrink-0" style={{ background: color }} />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                      <p className="text-xs font-mono text-gray-700">{color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Website */}
            {brand.url && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Website
                </p>
                <a href={brand.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-medium hover:underline break-all flex items-start gap-1">
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
        <p className="text-sm text-gray-500 mt-1"><strong>{brand.name}</strong> will be permanently removed. This cannot be undone.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition">Cancel</button>
        <button onClick={() => onConfirm(brand.id)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 cursor-pointer transition">Delete</button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function ReusePage({ setActiveTab }) {
  const router = useRouter();
  // const { fetchBrands, deleteBrandById } = useAuth();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Replace with real: const res = await fetchBrands(); setBrands(res.data);
        const mock = { "data": [{ "id": 45, "name": "index", "description": "vcx", "tagline": "cvx", "logo": "https://images.weviy.com/uploads/images/weviy-photo-1776421088-69e208e00c289.", "primary_color": "#1e3a8a", "secondary_color": "#333", "fonts": "Inter", "url": "https://clarity-academy12.woxelosites.com", "industry": "Healthcare", "status": 0, "created_at": "2026-04-17T10:18:08.000000Z", "updated_at": "2026-04-17T10:18:08.000000Z" }, { "id": 44, "name": "Envato", "description": "Access unlimited downloads across the broadest range of categories.", "tagline": "Creative assets for everyone", "logo": "https://images.weviy.com/uploads/images/weviy-photo-1765453471-693aae9fc4772.ico", "primary_color": "#00a651", "secondary_color": "#969695", "fonts": "Inter", "url": "https://elements.envato.com", "industry": "Finance", "status": 1, "created_at": "2025-12-11T11:44:31.000000Z", "updated_at": "2025-12-11T11:44:31.000000Z" }, { "id": 43, "name": "Creative Klux", "description": "Creative Klux is the all-in-one platform for creators, managers & brands.", "tagline": "All-in-one creator platform", "logo": "https://images.weviy.com/uploads/images/weviy-photo-1765452821-693aac1589c09.ico", "primary_color": "#1447e6", "secondary_color": "#10b981", "fonts": "Poppins", "url": "https://www.creativeklux.com/", "industry": "Technology", "status": 0, "created_at": "2025-12-11T11:33:41.000000Z", "updated_at": "2025-12-11T11:33:41.000000Z" }, { "id": 42, "name": "Weviyyyy", "description": "Weviy helps you build websites, mobile apps — all from one dashboard.", "tagline": "weviyyy", "logo": "https://images.weviy.com/uploads/images/weviy-photo-1765442649-693a84590d58e.png", "primary_color": "#7c3aed", "secondary_color": "#10b981", "fonts": "Montserrat", "url": "https://weviy.com/", "industry": "Education", "status": 1, "created_at": "2025-12-11T08:44:09.000000Z", "updated_at": "2025-12-11T11:31:31.000000Z" }] };
        setBrands(mock.data || []);
      } catch {
        setError("Failed to load brands. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedBrand = brands.find((b) => b.id === selectedId) || null;

  const handleSelect = (brand) => {
    if (selectedId === brand.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(brand.id);
    // Scroll to detail panel after state update
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleEdit = (brand) => router.push(`/brand/edit/${brand.id}`);

  const handleDeleteConfirm = async (id) => {
    // await deleteBrandById(id);
    setBrands((p) => p.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDeleteTarget(null);
  };

  return (
    <div className="">
      {deleteTarget && (
        <DeleteModal brand={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Kits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Save your brand assets — colors, fonts, logos — and apply them instantly to any design
          </p>
        </div>
        <button
          onClick={() => router.push("/brand/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Brand
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or industry…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading brands…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Tag className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">{search ? "No brands match your search" : "No brands yet"}</p>
          <p className="text-sm text-gray-400">{search ? "Try a different keyword" : "Create your first brand to get started"}</p>
          {!search && (
            <button onClick={() => router.push("/brand/create")}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition">
              Create Brand
            </button>
          )}
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {filtered.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isSelected={selectedId === brand.id}
                onSelect={() => handleSelect(brand)}
                onEdit={handleEdit}
                onDelete={(b) => setDeleteTarget(b)}
              />
            ))}
          </div>

          {/* Detail panel — below the grid */}
          {selectedBrand && (
            <div ref={detailRef}>
              <BrandDetailPanel
                brand={selectedBrand}
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