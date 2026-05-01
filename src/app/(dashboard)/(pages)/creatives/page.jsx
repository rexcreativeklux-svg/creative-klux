"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Search, LayoutGrid, List, Star, Trash2, Plus, Copy,
    Pencil, X, Check, Clock, ChevronLeft, ChevronRight,
    Send, CalendarClock, ScanSearch, TrendingUp, Wand2, RefreshCw, CheckSquare,
    Square, AlertTriangle, Loader2, Edit2, FileText,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/app/(components)/Toast";

// ── DesignCanvas ──────────────────────────────────────────────────────────────
function DesignCanvas({ variation, maxW = 320, maxH = 240 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !variation?.canvas) return;
        const ctx = canvas.getContext("2d");
        const { width, height, background } = variation.canvas;

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = background || "#ffffff";
        ctx.fillRect(0, 0, width, height);

        (variation.elements || []).forEach((el) => {
            ctx.save();
            ctx.globalAlpha = el.opacity ?? 1;

            if (el.rotation) {
                const cx = el.x + (el.width || 0) / 2;
                const cy = el.y + (el.height || 0) / 2;
                ctx.translate(cx, cy);
                ctx.rotate((el.rotation * Math.PI) / 180);
                ctx.translate(-cx, -cy);
            }

            if (el.type === "shape") {
                ctx.fillStyle = el.fill || "transparent";
                ctx.strokeStyle = el.stroke || "transparent";
                ctx.lineWidth = el.strokeWidth || 0;

                if (el.shape === "circle") {
                    const r = (el.width || 0) / 2;
                    ctx.beginPath();
                    ctx.arc(el.x + r, el.y + r, r, 0, Math.PI * 2);
                    ctx.fill();
                    if (el.strokeWidth) ctx.stroke();
                } else if (el.shape === "triangle") {
                    const w = el.width || 0, h = el.height || 0;
                    ctx.beginPath();
                    ctx.moveTo(el.x + w / 2, el.y);
                    ctx.lineTo(el.x + w, el.y + h);
                    ctx.lineTo(el.x, el.y + h);
                    ctx.closePath();
                    ctx.fill();
                    if (el.strokeWidth) ctx.stroke();
                } else {
                    const r = el.borderRadius || 0;
                    if (r) {
                        ctx.beginPath();
                        ctx.roundRect(el.x, el.y, el.width, el.height, r);
                        ctx.fill();
                        if (el.strokeWidth) ctx.stroke();
                    } else {
                        ctx.fillRect(el.x, el.y, el.width, el.height);
                        if (el.strokeWidth) ctx.strokeRect(el.x, el.y, el.width, el.height);
                    }
                }
            }

            if (el.type === "text") {
                const size = el.fontSize || 16;
                const weight = el.fontWeight || "normal";
                const align = el.textAlign || "left";
                ctx.font = `${weight} ${size}px 'DM Sans', sans-serif`;
                ctx.fillStyle = el.fill || el.color || "#000000";
                ctx.textAlign = align;

                const x = align === "center"
                    ? el.x + (el.width || 0) / 2
                    : align === "right"
                        ? el.x + (el.width || 0)
                        : el.x;

                const textContent = typeof el.content === "string" ? el.content : typeof el.text === "string" ? el.text : "";
                const words = textContent.trim().split(/\s+/);
                const lineMaxW = el.width || 9999;
                let line = "", lineY = el.y + size;

                words.forEach((word) => {
                    const test = line ? line + " " + word : word;
                    if (ctx.measureText(test).width > lineMaxW && line) {
                        ctx.fillText(line, x, lineY);
                        line = word;
                        lineY += size * 1.35;
                    } else {
                        line = test;
                    }
                });
                if (line) ctx.fillText(line, x, lineY);
            }

            if (el.type === "image" && el.src) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => canvas.getContext("2d").drawImage(img, el.x, el.y, el.width, el.height);
                img.src = el.src;
            }

            ctx.restore();
        });
    }, [variation]);

    if (!variation?.canvas) return null;

    const { width, height } = variation.canvas;
    const scale = Math.min(maxW / width, maxH / height, 1);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: width * scale, height: height * scale, borderRadius: 8, display: "block" }}
        />
    );
}

// ── Normalize a raw design from the API ──────────────────────────────────────
function normalizeDesign(raw) {
    let parsed = raw.canvas;
    if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { parsed = null; }
    }

    let canvasData = null;
    let elements = [];

    if (parsed && typeof parsed === "object") {
        if (parsed.canvas && Array.isArray(parsed.elements)) {
            canvasData = parsed.canvas;
            elements = parsed.elements;
        } else if (parsed.width && parsed.height) {
            canvasData = parsed;
        }
    }

    let copy = raw.copy || {};
    if (typeof copy === "string") {
        try { copy = JSON.parse(copy); } catch { copy = { body: copy }; }
    }

    return {
        id: raw.id,
        name: raw.name || "Untitled Design",
        type: raw.sub_type || raw.type || "image",
        category: raw.type || "ads",
        date: raw.created_at
            ? new Date(raw.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—",
        favorite: raw.favorite || false,
        score: raw.score || 0,
        copy,
        canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
        elements,
        brand_id: raw.brand_id,
        image: raw.image_url || null,
    };
}

// ── Filter structure — flat, no nested subtypes ───────────────────────────────
// Maps filter key → the type/category values from the API that belong to it
const FILTER_TYPE_MAP = {
    ads:          ["ads"],
    social:       ["social"],
    design:       ["card", "banner", "designer", "design"],
    magic_studio: ["magic", "magic_studio", "text to image", "text to video", "image to variations", "audio to text"],
};

const FILTER_GROUPS = [
    { label: "All",           key: "all" },
    { label: "Ads",           key: "ads" },
    { label: "Social",        key: "social" },
    { label: "Design",        key: "design" },
    { label: "Magic Studio",  key: "magic_studio" },
    { label: "★ Favorites",   key: "favorites" },
];

const TYPE_COLOR = {
    ads:         { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100",    dot: "bg-blue-500" },
    social:      { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-100",  dot: "bg-indigo-500" },
    card:        { bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-100",  dot: "bg-violet-500" },
    banner:      { bg: "bg-teal-50",    text: "text-teal-600",    border: "border-teal-100",    dot: "bg-teal-500" },
    image:       { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100",    dot: "bg-blue-400" },
    video:       { bg: "bg-cyan-50",    text: "text-cyan-600",    border: "border-cyan-100",    dot: "bg-cyan-500" },
    poster:      { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-100", dot: "bg-fuchsia-600" },
    flyer:       { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-100",  dot: "bg-violet-600" },
};
const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };

const ITEMS_PER_PAGE = 9;

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreativesPage() {
    const { fetchDesigns, activeBrandId, deleteDesignById, bulkDeleteDesigns, updateDesignById } = useAuth();

    const [creatives, setCreatives]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [search, setSearch]           = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [viewMode, setViewMode]       = useState("grid");
    const [selectedId, setSelectedId]   = useState(null);
    const [copied, setCopied]           = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [page, setPage]               = useState(1);
    const [bulkSelected, setBulkSelected] = useState([]);
    const [isBulkMode, setIsBulkMode]   = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ open: false, message: "", type: "success" });
    const showToast = (message, type = "success") => setToast({ open: true, message, type });
    const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

    // ── Load designs ────────────────────────────────────────────────────────────
    const loadDesigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchDesigns(ITEMS_PER_PAGE);
            if (data) {
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data.data)
                        ? data.data
                        : [];
                setCreatives(arr.map(normalizeDesign));
            } else {
                setCreatives([]);
            }
        } catch {
            setError("Failed to load designs.");
            setCreatives([]);
        } finally {
            setLoading(false);
        }
    }, [fetchDesigns, activeBrandId]);

    useEffect(() => { loadDesigns(); }, [loadDesigns]);

    // ── CRUD wrappers using context ─────────────────────────────────────────────
    const deleteDesign = useCallback(async (id) => {
        setActionLoading(true);
        try {
            const res = await deleteDesignById(id);
            if (!res.ok) throw new Error(res.message);
            setCreatives((prev) => prev.filter((c) => c.id !== id));
            if (selectedId === id) setSelectedId(null);
            showToast("Design deleted", "success");
        } catch {
            showToast("Failed to delete design", "error");
        } finally {
            setActionLoading(false);
            setDeleteConfirm(null);
        }
    }, [deleteDesignById, selectedId]);

    const bulkDeleteDesignsLocal = useCallback(async (ids) => {
        setActionLoading(true);
        try {
            const res = await bulkDeleteDesigns(ids);
            if (!res.ok) throw new Error(res.message);
            setCreatives((prev) => prev.filter((c) => !ids.includes(c.id)));
            setBulkSelected([]);
            setIsBulkMode(false);
            if (ids.includes(selectedId)) setSelectedId(null);
            showToast(`${ids.length} design${ids.length > 1 ? "s" : ""} deleted`, "success");
        } catch {
            showToast("Failed to delete designs", "error");
        } finally {
            setActionLoading(false);
            setDeleteConfirm(null);
        }
    }, [bulkDeleteDesigns, selectedId]);

    // ── Edit copy modal state ────────────────────────────────────────────────────
    const [editTarget, setEditTarget] = useState(null);

    const updateDesignCopy = useCallback(async (id, fields) => {
        // fields: { name, copy: { headline, tagline, body, cta } }
        try {
            const res = await updateDesignById(id, {
                name: fields.name,
                copy: JSON.stringify(fields.copy),
            });
            if (!res.ok) throw new Error(res.message);
            setCreatives((prev) => prev.map((c) =>
                c.id === id ? { ...c, name: fields.name, copy: fields.copy } : c
            ));
            showToast("Design updated", "success");
            setEditTarget(null);
        } catch {
            showToast("Failed to update design", "error");
        }
    }, [updateDesignById]);

    const toggleFavorite = useCallback((id, e) => {
        e?.stopPropagation();
        setCreatives((prev) => prev.map((c) => c.id === id ? { ...c, favorite: !c.favorite } : c));
    }, []);

    // ── Filtering ────────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return creatives.filter((c) => {
            const matchSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.type.toLowerCase().includes(search.toLowerCase()) ||
                (c.copy?.tagline || "").toLowerCase().includes(search.toLowerCase());

            let matchFilter = true;
            if (activeFilter === "favorites") {
                matchFilter = c.favorite;
            } else if (activeFilter !== "all") {
                const allowed = FILTER_TYPE_MAP[activeFilter] || [];
                matchFilter =
                    allowed.includes(c.type.toLowerCase()) ||
                    allowed.includes(c.category.toLowerCase());
            }
            return matchSearch && matchFilter;
        });
    }, [creatives, search, activeFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const selected   = creatives.find((c) => c.id === selectedId) || null;

    const handleSearch = (v) => { setSearch(v); setPage(1); };

    const handleSelect = (id) => {
        if (isBulkMode) {
            setBulkSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
        } else {
            setSelectedId((prev) => prev === id ? null : id);
        }
    };

    const handleCopy = () => {
        if (!selected) return;
        const copy = selected.copy;
        const text = typeof copy === "string" ? copy : JSON.stringify(copy, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleBulkMode = () => { setIsBulkMode((v) => !v); setBulkSelected([]); };
    const selectAll      = () => setBulkSelected(paginated.map((c) => c.id));
    const deselectAll    = () => setBulkSelected([]);

    // ── Loading / Error states ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-400">Loading your designs…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-gray-500">{error}</p>
                <button onClick={loadDesigns} className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-between pb-4 h-full">

            {/* ── Toast ── */}
            <Toast message={toast.message} isOpen={toast.open} onClose={closeToast} type={toast.type} />

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Library</p>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Creations</h1>
                </div>
                <div className="flex flex-row gap-3 items-center">
                    <button
                        onClick={loadDesigns}
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleBulkMode}
                        className={`flex items-center gap-2 border text-sm font-medium px-4 py-2 rounded-lg transition-all cursor-pointer ${isBulkMode ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-300 hover:bg-gray-100 text-gray-600"}`}
                    >
                        {isBulkMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {isBulkMode ? "Exit Select" : "Select"}
                    </button>
                    <Link
                        href="/studio/ai-select"
                        className="flex items-center gap-2 border border-gray-400 hover:bg-gray-200 text-black text-sm font-medium px-4 py-2 rounded-lg transition-all hover:scale-105 duration-200"
                    >
                        <Plus className="w-4 h-4" /> Instant Creation
                    </Link>
                    <Link
                        href="/studio/select"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 duration-200"
                    >
                        <Plus className="w-4 h-4" /> Custom Creation
                    </Link>
                </div>
            </div>

            {/* ── Bulk action bar ── */}
            {isBulkMode && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl mb-3 shrink-0">
                    <span className="text-xs font-semibold text-blue-700">{bulkSelected.length} selected</span>
                    <button onClick={selectAll} className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition">Select all on page</button>
                    <button onClick={deselectAll} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition">Deselect all</button>
                    {bulkSelected.length > 0 && (
                        <button
                            onClick={() => setDeleteConfirm("bulk")}
                            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete {bulkSelected.length}
                        </button>
                    )}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="py-3 flex flex-wrap items-center gap-3 shrink-0">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search creations..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>

                {/* ── Flat filter tabs ── */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
                    {FILTER_GROUPS.map((group) => {
                        const isActive = activeFilter === group.key;
                        return (
                            <button
                                key={group.key}
                                onClick={() => { setActiveFilter(group.key); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isActive ? "bg-white text-blue-600 shadow-sm border border-blue-100" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {group.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl ml-auto">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`} title="Grid view">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`} title="List view">
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto pb-2">
                {filtered.length === 0 ? (
                    <EmptyState hasCreatives={creatives.length > 0} />
                ) : viewMode === "grid" ? (
                    <GridView
                        creatives={paginated}
                        selectedId={selectedId}
                        bulkSelected={bulkSelected}
                        isBulkMode={isBulkMode}
                        onSelect={handleSelect}
                        onToggleFavorite={toggleFavorite}
                        onDeleteRequest={setDeleteConfirm}
                    />
                ) : (
                    <TableView
                        creatives={paginated}
                        selectedId={selectedId}
                        bulkSelected={bulkSelected}
                        isBulkMode={isBulkMode}
                        onSelect={handleSelect}
                        onToggleFavorite={toggleFavorite}
                        onDeleteRequest={setDeleteConfirm}
                    />
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between px-3 py-3 border-t border-gray-100 rounded bg-white">
                    <p className="text-xs text-gray-400">
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer transition-all ${p === page ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                                {p}
                            </button>
                        ))}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition">
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Sidebar backdrop ── */}
            {selected && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50" onClick={() => setSelectedId(null)} />
            )}

            {/* ── Sidebar panel ── */}
            <div className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${selected ? "translate-x-0" : "translate-x-full"}`}>
                {selected && (
                    <Sidebar
                        creative={selected}
                        onClose={() => setSelectedId(null)}
                        onToggleFavorite={toggleFavorite}
                        onCopy={handleCopy}
                        copied={copied}
                        onDeleteRequest={setDeleteConfirm}
                        onEdit={setEditTarget}
                    />
                )}
            </div>

            {/* ── Edit Copy Modal ── */}
            {editTarget && (
                <EditCopyModal
                    creative={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={updateDesignCopy}
                />
            )}

            {/* ── Delete confirm modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl mx-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {deleteConfirm === "bulk"
                                ? `Delete ${bulkSelected.length} design${bulkSelected.length > 1 ? "s" : ""}?`
                                : "Delete design?"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteConfirm === "bulk" ? bulkDeleteDesignsLocal(bulkSelected) : deleteDesign(deleteConfirm)}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer transition flex items-center gap-2"
                            >
                                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Grid View ─────────────────────────────────────────────────────────────────
const GridView = ({ creatives, selectedId, bulkSelected, isBulkMode, onSelect, onToggleFavorite, onDeleteRequest }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {creatives.map((c) => (
            <CreativeCard
                key={c.id}
                creative={c}
                selected={selectedId === c.id}
                bulkChecked={bulkSelected.includes(c.id)}
                isBulkMode={isBulkMode}
                onSelect={() => onSelect(c.id)}
                onToggleFavorite={onToggleFavorite}
                onDeleteRequest={onDeleteRequest}
            />
        ))}
    </div>
);

// ── Card ──────────────────────────────────────────────────────────────────────
const CreativeCard = ({ creative: c, selected, bulkChecked, isBulkMode, onSelect, onToggleFavorite, onDeleteRequest }) => {
    const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
    const hasCanvas = c.canvas && c.elements?.length > 0;
    const tagline = c.copy?.tagline || "";

    return (
        <div
            onClick={onSelect}
            className={`group bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col relative ${isBulkMode && bulkChecked ? "border-blue-500 shadow-lg shadow-blue-100/60" : selected ? "border-blue-500 shadow-lg shadow-blue-100/60" : "border-gray-100 hover:border-gray-200"}`}
        >
            {/* Bulk checkbox */}
            {isBulkMode && (
                <div className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${bulkChecked ? "bg-blue-600 border-blue-600" : "bg-white/80 border-gray-300"}`}>
                    {bulkChecked && <Check className="w-3 h-3 text-white" />}
                </div>
            )}

            {/* Canvas / image preview area */}
            <div className="relative overflow-hidden bg-gray-100 flex items-center justify-center" style={{ aspectRatio: "16/9", minHeight: 120 }}>
                {hasCanvas ? (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50">
                        <DesignCanvas
                            variation={{ canvas: c.canvas, elements: c.elements }}
                            maxW={280}
                            maxH={160}
                        />
                    </div>
                ) : c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                        <Wand2 className="w-8 h-8" />
                        <span className="text-xs">No preview</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Type badge — top left */}
                <div className="absolute top-2.5 left-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm bg-white/90 ${tc.text} ${tc.border} capitalize`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                        {c.type}
                    </span>
                </div>

                {/* Favorite indicator — top right */}
                {c.favorite && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-amber-100 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </div>
                )}

                {/* Score badge — bottom right */}
                {c.score > 0 && (
                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
                        ★ {c.score}
                    </div>
                )}

                {/* Tagline overlay — bottom left, shown on hover */}
                {tagline && (
                    <div className="absolute bottom-2 left-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-[10px] text-white font-medium leading-tight line-clamp-1 drop-shadow-sm">
                            {tagline}
                        </p>
                    </div>
                )}
            </div>

            {/* Card body */}
            <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>

                {/* Tagline always visible below name */}
                {tagline ? (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate italic">{tagline}</p>
                ) : (
                    <p className="text-[11px] text-gray-300 mt-0.5 truncate capitalize">{c.category}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-[11px] text-gray-400">{c.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id, e); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 transition cursor-pointer"
                        >
                            <Star className={`w-3.5 h-3.5 transition-colors ${c.favorite ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteRequest(c.id); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Table View ────────────────────────────────────────────────────────────────
const TableView = ({ creatives, selectedId, bulkSelected, isBulkMode, onSelect, onToggleFavorite, onDeleteRequest }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                    {isBulkMode && <th className="w-10 px-4 py-3" />}
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Creative</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tagline</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 w-20" />
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {creatives.map((c) => {
                    const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
                    return (
                        <tr
                            key={c.id}
                            onClick={() => onSelect(c.id)}
                            className={`cursor-pointer transition-colors ${isBulkMode && bulkSelected.includes(c.id) ? "bg-blue-50" : selectedId === c.id ? "bg-blue-50" : "hover:bg-gray-50/80"}`}
                        >
                            {isBulkMode && (
                                <td className="px-4 py-3">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${bulkSelected.includes(c.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                                        {bulkSelected.includes(c.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                </td>
                            )}
                            <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100 flex items-center justify-center">
                                        {c.canvas && c.elements?.length > 0 ? (
                                            <DesignCanvas variation={{ canvas: c.canvas, elements: c.elements }} maxW={56} maxH={40} />
                                        ) : c.image ? (
                                            <img src={c.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                                        ) : (
                                            <Wand2 className="w-4 h-4 text-gray-300" />
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-800 truncate max-w-[160px] text-sm">{c.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs italic max-w-[180px]">
                                <span className="truncate block">{c.copy?.tagline || "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${tc.bg} ${tc.text} ${tc.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />{c.type}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-green-600">{c.score > 0 ? `★ ${c.score}` : "—"}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{c.date}</td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id, e); }} className="p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition">
                                        <Star className={`w-3.5 h-3.5 ${c.favorite ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(c.id); }} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition">
                                        <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400 transition-colors" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ creative: c, onClose, onToggleFavorite, onCopy, copied, onDeleteRequest, onEdit }) => {
    const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
    const [expandedCopy, setExpandedCopy] = useState(false);

    const copy = c.copy || {};
    const copyEntries = typeof copy === "string"
        ? [["content", copy]]
        : Object.entries(copy).filter(([, v]) => v && typeof v === "string");

    const hasCanvas = c.canvas && c.elements?.length > 0;

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${tc.bg} ${tc.text} ${tc.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                    {c.type}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id, e); }}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition-all ${c.favorite ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-400"}`}
                    >
                        <Star className={`w-3.5 h-3.5 ${c.favorite ? "fill-amber-400" : ""}`} />
                    </button>
                    <button
                        onClick={() => onDeleteRequest(c.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 cursor-pointer transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0">

                {/* Canvas Preview with hovering Edit button */}
                <div
                    className="relative bg-gray-50 border-b border-gray-100 flex items-center justify-center p-4 group/preview"
                    style={{ minHeight: 200 }}
                >
                    {hasCanvas ? (
                        <DesignCanvas variation={{ canvas: c.canvas, elements: c.elements }} maxW={360} maxH={240} />
                    ) : c.image ? (
                        <img src={c.image} alt={c.name} className="max-w-full max-h-56 rounded-lg object-contain shadow" />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-300 py-8">
                            <Wand2 className="w-10 h-10" />
                            <span className="text-xs">No preview available</span>
                        </div>
                    )}

                    {/* Hovering Edit button — opens copy editor */}
                    <button
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 cursor-pointer"
                        onClick={() => onEdit(c)}
                    >
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white transition">
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Copy
                        </div>
                    </button>
                </div>

                <div className="px-4 py-4 flex flex-col gap-4">

                    {/* Name + edit button */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-gray-900 leading-snug flex-1 truncate">{c.name}</h2>
                            <button
                                onClick={() => onEdit(c)}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition shrink-0"
                                title="Edit copy"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-300" />
                            <span className="text-[11px] text-gray-400">{c.date}</span>
                        </div>
                    </div>

                    {/* Tagline if available */}
                    {c.copy?.tagline && (
                        <p className="text-xs text-gray-500 italic -mt-2">{c.copy.tagline}</p>
                    )}

                    {/* Meta grid */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {[["Type", c.type], ["Category", c.category], ["Score", c.score > 0 ? `★ ${c.score}` : "—"]].map(([label, value]) => (
                            <div key={label} className="bg-gray-50 rounded-xl px-2 py-2 text-center border border-gray-100">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
                                <p className="text-[10px] font-semibold text-gray-700 mt-0.5 truncate capitalize">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Canvas dimensions */}
                    {c.canvas && (
                        <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Canvas</span>
                            <span className="text-[11px] font-mono font-semibold text-gray-600">{c.canvas.width} × {c.canvas.height}px</span>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Link href="/" className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-all shadow-sm">
                                <Send className="w-3 h-3" /> Post Now
                            </Link>
                            <Link href="/" className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2 rounded-lg transition-all">
                                <CalendarClock className="w-3 h-3" /> Schedule
                            </Link>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/analyze/${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition group">
                                <ScanSearch className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                                <span className="text-[11px] font-semibold text-blue-600">Analyze</span>
                            </Link>
                            <Link href={`/predict/${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-100 transition group">
                                <TrendingUp className="w-4 h-4 text-violet-500 group-hover:text-violet-600" />
                                <span className="text-[11px] font-semibold text-violet-600">Predict</span>
                            </Link>
                            <Link href={`/retouch/${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition group">
                                <Wand2 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                                <span className="text-[11px] font-semibold text-emerald-600">Retouch</span>
                            </Link>
                        </div>
                    </div>

                    {/* Generated Copy */}
                    {copyEntries.length > 0 && (
                        <div>
                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">Generated Copy</p>
                            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed border border-gray-100 space-y-2">
                                {(expandedCopy ? copyEntries : copyEntries.slice(0, 3)).map(([key, val]) => (
                                    <div key={key}>
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">{key.replace(/_/g, " ")}</span>
                                        <p className="mt-0.5 text-gray-700">{val}</p>
                                    </div>
                                ))}
                                {copyEntries.length > 3 && (
                                    <button
                                        onClick={() => setExpandedCopy((v) => !v)}
                                        className="text-blue-500 hover:text-blue-700 font-semibold text-xs cursor-pointer transition"
                                    >
                                        {expandedCopy ? "Show less" : "See more"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                <button
                    onClick={onCopy}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${copied ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"}`}
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Text"}
                </button>
            </div>
        </>
    );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ hasCreatives }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-44 h-44 select-none">
            <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M55 30 L55 90 L20 150 Q15 160 25 165 L75 165 Q85 160 80 150 L55 90" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" fill="#f3f4f6" />
                <ellipse cx="55" cy="30" rx="14" ry="5" fill="#e5e7eb" />
                <line x1="100" y1="10" x2="100" y2="55" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round" />
                <circle cx="100" cy="100" r="48" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="4" />
                <ellipse cx="100" cy="55" rx="12" ry="5" fill="#e5e7eb" />
                <circle cx="90" cy="105" r="5" fill="#e5e7eb" opacity="0.8" />
                <circle cx="105" cy="115" r="3.5" fill="#e5e7eb" opacity="0.6" />
                <circle cx="95" cy="90" r="3" fill="#e5e7eb" opacity="0.5" />
                <path d="M145 35 L145 155 Q145 165 155 165 L185 165 Q195 165 195 155 L195 35 Z" stroke="#d1d5db" strokeWidth="4" fill="#f3f4f6" />
                <line x1="145" y1="35" x2="195" y2="35" stroke="#d1d5db" strokeWidth="4" />
                <line x1="187" y1="80" x2="195" y2="80" stroke="#d1d5db" strokeWidth="2.5" />
                <line x1="187" y1="105" x2="195" y2="105" stroke="#d1d5db" strokeWidth="2.5" />
                <line x1="187" y1="130" x2="195" y2="130" stroke="#d1d5db" strokeWidth="2.5" />
                <ellipse cx="100" cy="172" rx="85" ry="6" fill="#e5e7eb" opacity="0.5" />
            </svg>
        </div>
        <div className="text-center">
            <p className="text-sm text-gray-500">{hasCreatives ? "No creatives match your search." : "No designs have been created yet."}</p>
            {!hasCreatives && <p className="text-sm text-gray-400 mt-0.5">Click the create button to kickstart your campaign!</p>}
        </div>
        {!hasCreatives && (
            <Link href="/studio" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:scale-105 shadow-sm shadow-blue-200">
                <Plus className="w-4 h-4" /> Create
            </Link>
        )}
    </div>
);

// ── Edit Copy Modal ───────────────────────────────────────────────────────────
const COPY_FIELDS = [
    { key: "name",      label: "Design Name",   type: "input",    placeholder: "e.g. Summer Campaign Card" },
    { key: "headline",  label: "Headline",       type: "input",    placeholder: "e.g. Adventure Awaits" },
    { key: "tagline",   label: "Tagline",        type: "input",    placeholder: "e.g. Discover your next thrill" },
    { key: "body",      label: "Body Copy",      type: "textarea", placeholder: "e.g. Join us for an unforgettable journey…" },
    { key: "cta",       label: "Call to Action", type: "input",    placeholder: "e.g. Get Started" },
];

function EditCopyModal({ creative, onClose, onSave }) {
    const [saving, setSaving] = useState(false);
    const [fields, setFields] = useState({
        name:     creative.name || "",
        headline: creative.copy?.headline || "",
        tagline:  creative.copy?.tagline  || "",
        body:     creative.copy?.body     || "",
        cta:      creative.copy?.cta      || "",
    });

    const handleChange = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        await onSave(creative.id, {
            name: fields.name,
            copy: {
                ...creative.copy,   // preserve any extra keys like performance_score
                headline: fields.headline,
                tagline:  fields.tagline,
                body:     fields.body,
                cta:      fields.cta,
            },
        });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Edit Copy</h3>
                            <p className="text-[10px] text-gray-400">Update text content for this design</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable fields */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                    {COPY_FIELDS.map(({ key, label, type, placeholder }) => (
                        <div key={key}>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                {label}
                            </label>
                            {type === "textarea" ? (
                                <textarea
                                    rows={4}
                                    value={fields[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition placeholder-gray-300"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={fields[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder-gray-300"
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition flex items-center gap-2 font-semibold"
                    >
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}