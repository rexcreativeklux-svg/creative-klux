"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical, Edit2, Trash2, ExternalLink, ChevronDown,
  Globe, Palette, Type, Tag, Building2, Calendar,
  Plus, Search, Loader2, AlertCircle, X, Check
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── helpers ───────────────────────────────────────────────────────────────────
const cleanColor = (c) => {
  if (!c) return "#888";
  return c.replace(/`/g, "").trim();
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

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
    status === 1 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 1 ? "bg-emerald-500" : "bg-amber-400"}`} />
    {status === 1 ? "Active" : "Draft"}
  </span>
);

// ── 3-dot dropdown ────────────────────────────────────────────────────────────
const BrandMenu = ({ brand, onEdit, onDelete }) => {
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
        onClick={() => setOpen((p) => !p)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1">
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

// ── expanded brand detail panel ───────────────────────────────────────────────
const BrandDetail = ({ brand }) => {
  const primary   = cleanColor(brand.primary_color);
  const secondary = cleanColor(brand.secondary_color);
  const logo      = getLogoSrc(brand.logo);

  return (
    <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-white px-6 py-5 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left: identity */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Mini preview card */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-w-sm">
            <div className="h-20 relative flex items-end px-4 pb-3"
              style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
              <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
              <div className="w-12 h-12 rounded-xl border-2 border-white shadow bg-white flex items-center justify-center overflow-hidden">
                {logo
                  ? <img src={logo} alt={brand.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; }} />
                  : <span className="text-xl font-black" style={{ color: primary }}>{brand.name?.[0]?.toUpperCase()}</span>
                }
              </div>
            </div>
            <div className="bg-white px-4 py-3">
              <p className="font-bold text-gray-900 text-sm">{brand.name}</p>
              {brand.tagline && <p className="text-xs text-gray-400 italic mt-0.5">{brand.tagline}</p>}
            </div>
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
          </div>

          {/* Description */}
          {brand.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{brand.description}</p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Building2, label: "Industry", value: brand.industry },
              { icon: Type,      label: "Font",     value: brand.fonts },
              { icon: Calendar,  label: "Created",  value: formatDate(brand.created_at) },
              { icon: Calendar,  label: "Updated",  value: formatDate(brand.updated_at) },
            ].map(({ icon: Icon, label, value }) => value && (
              <div key={label} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: colors + links */}
        <div className="flex flex-col gap-4">
          {/* Color palette */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <Palette className="w-3 h-3" /> Brand Colors
            </p>
            <div className="flex flex-col gap-2">
              {[{ label: "Primary", color: primary }, { label: "Secondary", color: secondary }].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg border border-gray-100 shadow-sm flex-shrink-0" style={{ background: color }} />
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
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Website
              </p>
              <a
                href={brand.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 font-medium hover:underline break-all flex items-start gap-1"
              >
                <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {brand.url}
              </a>
            </div>
          )}

          <StatusBadge status={brand.status} />
        </div>
      </div>
    </div>
  );
};

// ── single brand row ──────────────────────────────────────────────────────────
const BrandRow = ({ brand, onEdit, onDelete, isExpanded, onToggle }) => {
  const primary = cleanColor(brand.primary_color);
  const logo    = getLogoSrc(brand.logo);

  return (
    <div className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${isExpanded ? "ring-2 ring-blue-100 ring-offset-0" : ""}`}>
      {/* Row header — clickable to expand */}
      <div
        onClick={onToggle}
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
      >
        {/* Color strip */}
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: primary }} />

        {/* Logo */}
        <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
          {logo
            ? <img src={logo} alt={brand.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
            : null}
          <span className={`text-base font-black ${logo ? "hidden" : "flex"}`} style={{ color: primary }}>{brand.name?.[0]?.toUpperCase()}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm truncate">{brand.name}</h3>
            <StatusBadge status={brand.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{brand.tagline || brand.description || "No description"}</p>
        </div>

        {/* Right: industry + font + chevron */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {brand.industry && (
            <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-500">{brand.industry}</span>
          )}
          {brand.fonts && (
            <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-500" style={{ fontFamily: brand.fonts }}>{brand.fonts}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          <BrandMenu brand={brand} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && <BrandDetail brand={brand} />}
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
          <strong>{brand.name}</strong> will be permanently removed. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition">
          Cancel
        </button>
        <button onClick={() => onConfirm(brand.id)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 cursor-pointer transition">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function ReusePage({ setActiveTab }) {
  const router = useRouter();

  // Replace these with your real hooks
  // const { fetchBrands, deleteBrandById } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── load brands ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Replace with: const data = await fetchBrands();
        // Simulating with mock data matching the API shape:
        const mock = {"success":true,"message":"Brands retrieved successfully","data":[{"id":45,"user_id":126,"name":"index","description":"vcx","tagline":"cvx","logo":"https://images.weviy.com/uploads/images/weviy-photo-1776421088-69e208e00c289.","primary_color":"#fff","secondary_color":"#333","fonts":"Inter","url":"https://clarity-academy12.woxelosites.com","industry":"Healthcare","status":0,"created_at":"2026-04-17T10:18:08.000000Z","updated_at":"2026-04-17T10:18:08.000000Z"},{"id":44,"user_id":126,"name":"Envato","description":"Access unlimited downloads across the broadest range of categories—videos, audio, photos, graphic templates, fonts, & more—all with one great-value subscription.","tagline":"fdfd","logo":"https://images.weviy.com/uploads/images/weviy-photo-1765453471-693aae9fc4772.ico","primary_color":"#fff","secondary_color":"#969695","fonts":"Inter","url":"https://elements.envato.com","industry":"Finance","status":0,"created_at":"2025-12-11T11:44:31.000000Z","updated_at":"2025-12-11T11:44:31.000000Z"},{"id":43,"user_id":126,"name":"Creative Klux","description":"Creative Klux is the all-in-one platform for creators, managers & brands.","tagline":"dfgdf","logo":"https://images.weviy.com/uploads/images/weviy-photo-1765452821-693aac1589c09.ico","primary_color":"#1447e6","secondary_color":"#10b981","fonts":"Inter","url":"https://www.creativeklux.com/","industry":"Technology","status":0,"created_at":"2025-12-11T11:33:41.000000Z","updated_at":"2025-12-11T11:33:41.000000Z"},{"id":42,"user_id":126,"name":"Weviyyyy","description":"Weviy helps you build websites, mobile apps, automate outreach, add live chat, generate legal pages, run audits, and create AI content — all from one powerful dashboard.","tagline":"weviyyy","logo":"https://images.weviy.com/uploads/images/weviy-photo-1765442649-693a84590d58e.png","primary_color":"#1e3a8a","secondary_color":"#10b981","fonts":"Inter","url":"https://weviy.com/","industry":"Education","status":0,"created_at":"2025-12-11T08:44:09.000000Z","updated_at":"2025-12-11T11:31:31.000000Z"}]};
        setBrands(mock.data || []);
      } catch (e) {
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

  const handleEdit   = (brand) => router.push(`/brand/edit/${brand.id}`);
  const handleToggle = (id)    => setExpandedId((p) => (p === id ? null : id));

  const handleDeleteConfirm = async (id) => {
    setDeleting(true);
    try {
      // await deleteBrandById(id);
      setBrands((p) => p.filter((b) => b.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      // handle error
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-8 md:px-10">
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
          <h1 className="text-2xl font-bold text-gray-900">Your Brands</h1>
          <p className="text-sm text-gray-500 mt-1">{brands.length} brand{brands.length !== 1 ? "s" : ""} in your workspace</p>
        </div>
        <button
          onClick={() => router.push("/brand/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Brand
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands by name or industry…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading brands…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

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

      {/* Brand list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((brand) => (
            <BrandRow
              key={brand.id}
              brand={brand}
              isExpanded={expandedId === brand.id}
              onToggle={() => handleToggle(brand.id)}
              onEdit={handleEdit}
              onDelete={(b) => setDeleteTarget(b)}
            />
          ))}
        </div>
      )}
    </div>
  );
}