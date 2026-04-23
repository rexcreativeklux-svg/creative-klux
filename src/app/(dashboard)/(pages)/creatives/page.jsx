"use client";

import React, { useState, useMemo } from "react";
import {
    Search, LayoutGrid, List, Star, Trash2, Plus, Copy,
    Pencil, X, Check, Clock, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from "lucide-react";

const MOCK_CREATIVES = [
    {
        id: "1", type: "Ad", title: "Increase Sales — kll",
        date: "Apr 21", favorite: false,
        image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?w=600",
        copy: "Join the thousands of satisfied customers in New Mexico! Why kll is the #1 Choice for Everyone in NM!\n\nFrom young families to seasoned pros, kll has something for everyone. With our trusted quality and unbeatable prices, you won't find a better deal anywhere else. Discover why NM residents love us and experience the difference today!\n\n---\n\nHook: \"Join the thousands of satisfied customers in New Mexico!\"\nHeadline: \"Why kll is the #1 Choice for Everyone in NM!\"\nBody: From young families to seasoned pros, kll has something for everyone.\nCTA: Shop Now\nFormat: Image — Facebook & Instagram\nAudience: B2C, All ages\nPlatform: Facebook, Instagram\nSize: 1200x628",
        goal: "Sales", audience: "B2C", size: "1200x628",
    },
    {
        id: "2", type: "Ad", title: "Increase Sales — fgh",
        date: "Apr 21", favorite: true,
        image: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?w=600",
        copy: "Seasonal Sale | Up to 50% OFF | Limited Time. Discover fgh premium tech products at unbeatable prices.\n\nOur best-in-class headphones deliver studio-quality sound for everyday life. Whether you're commuting, working, or working out — fgh has the gear for you.\n\n---\n\nHook: \"Don't miss out — limited time only!\"\nHeadline: \"fgh Premium Tech — Now 50% Off\"\nCTA: Buy Now\nFormat: Image — Instagram\nAudience: Tech enthusiasts, 18–35\nPlatform: Instagram\nSize: 1080x1080",
        goal: "Sales", audience: "B2C", size: "1080x1080",
    },
    {
        id: "3", type: "Ad", title: "Increase Sales — weviy",
        date: "Apr 21", favorite: false,
        image: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?w=600",
        copy: "WEVIY — All-in-One Platform to Launch & Scale Your Business. Start your journey today and see results in days, not months.\n\nWith Weviy, you get access to powerful tools built for modern teams: campaign management, AI creative generation, analytics dashboards, and one-click publishing across all major ad platforms.\n\n---\n\nHook: \"Scale your business without scaling your team.\"\nHeadline: \"All-in-One Platform for Growth\"\nCTA: Get Started Free\nFormat: Display — Google\nAudience: B2B startups, founders\nPlatform: Google Display Network\nSize: 1200x628",
        goal: "Brand Awareness", audience: "B2B", size: "1200x628",
    },
    {
        id: "4", type: "Design", title: "Logo — weviy",
        date: "Apr 21", favorite: true,
        image: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?w=600",
        copy: "Brand Identity Package for Weviy. Includes primary logo, icon mark, brand color palette, and typography guidelines.\n\nDesigned for digital and print use. The logo system includes horizontal, stacked, and icon-only lockups, each optimised for different contexts — from social media avatars to large-format print.\n\n---\n\nDeliverables: SVG, PNG (transparent), PDF brand guide\nFont pairing: Primary + Secondary\nColors: 3 brand colors + neutrals\nUsage: Digital, Print, Merchandise",
        goal: "Brand Identity", audience: "All", size: "SVG",
    },
    {
        id: "5", type: "Ad", title: "Unlock Your Potential — NJM",
        date: "Apr 21", favorite: false,
        image: "https://images.pexels.com/photos/3761504/pexels-photo-3761504.jpeg?w=600",
        copy: "UNLOCK YOUR POTENTIAL. Transform your performance with NJM's premium product line.\n\nWhether you're pushing through a plateau or just getting started, NJM gives you the edge. Our formula is clinically tested, athlete-approved, and designed to deliver real results — not just promises.\n\n---\n\nHook: \"Stop settling for average.\"\nHeadline: \"Unlock Your Potential with NJM\"\nCTA: Unlock Now\nFormat: Video — TikTok\nAudience: Fitness & lifestyle, 18–30\nPlatform: TikTok, Instagram Reels\nSize: 1080x1920",
        goal: "Engagement", audience: "B2C", size: "1080x1920",
    },
    {
        id: "6", type: "Ad", title: "A Boy Coding",
        date: "Apr 21", favorite: false,
        image: "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?w=600",
        copy: "Learn to code with the best platform. Join 10,000+ developers who accelerated their careers with our curriculum.\n\nFrom beginner to job-ready in 6 months. Our structured learning paths, live mentorship, and real-world projects make us the #1 choice for career changers and self-taught developers looking to level up.\n\n---\n\nHook: \"Your next career starts with one line of code.\"\nHeadline: \"Join 10,000+ Developers Who Changed Their Lives\"\nCTA: Start Learning\nFormat: Image — LinkedIn\nAudience: B2B developers, career changers\nPlatform: LinkedIn\nSize: 1200x627",
        goal: "Lead Generation", audience: "B2B", size: "1200x627",
    },
    {
        id: "7", type: "Social", title: "AI Creative Engine",
        date: "Apr 21", favorite: false,
        image: "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?w=600",
        copy: "YOUR ALL-IN-ONE AI CREATIVE ENGINE — Ads, Socials, Designs. Unleash your creativity without limits.\n\nGenerate on-brand content in seconds. From image ads to video reels, social posts to brand decks — our AI engine handles the heavy lifting so your team can focus on strategy.\n\n---\n\nFormat: Twitter Header\nPlatform: Twitter / X\nSize: 1500x500\nTone: Bold, forward-looking\nAudience: Marketing teams, agencies",
        goal: "Brand Awareness", audience: "Casual", size: "1500x500",
    },
    {
        id: "8", type: "Social", title: "Summer Campaign Reel",
        date: "Apr 20", favorite: true,
        image: "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?w=600",
        copy: "Summer is here and so are we! Show off your best look with our new summer collection.\n\nTag us @brand for a chance to be featured on our page. We're celebrating the season with drops every Friday through August — follow along so you never miss a release.\n\n---\n\nHook: \"Summer's calling. Are you ready?\"\nCaption: Drop your summer look 🌞 Tag us to be featured.\nHashtags: #SummerVibes #NewDrop #BrandStyle\nFormat: Reel — Instagram\nDuration: 30s\nSize: 1080x1920",
        goal: "Engagement", audience: "B2C", size: "1080x1920",
    },
    {
        id: "9", type: "Design", title: "Product Launch Flyer",
        date: "Apr 19", favorite: false,
        image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?w=600",
        copy: "New Product Launch — Be the first to experience it. Exclusive early access for our community.\n\nRegister now to secure your spot and receive a 20% launch discount. This is a limited-run release and once it's gone, it's gone. Don't wait — early access closes Friday.\n\n---\n\nHeadline: \"Be First. Get 20% Off.\"\nCTA: Register for Early Access\nFormat: Flyer — A4 Print & Digital\nDeliverables: PDF, PNG\nSize: 2480x3508\nAudience: Existing customers, VIP list",
        goal: "Lead Generation", audience: "B2C", size: "2480x3508",
    },
    {
        id: "10", type: "Ad", title: "Black Friday Countdown",
        date: "Apr 18", favorite: false,
        image: "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?w=600",
        copy: "BLACK FRIDAY STARTS NOW. Up to 70% off everything. Don't miss the biggest sale of the year — deals expire at midnight.\n\nThis is our biggest sale ever. Every category. Every product. Up to 70% off with no minimum spend. Add to cart before midnight or miss out until next year.\n\n---\n\nHook: \"70% off. Midnight deadline. No excuses.\"\nHeadline: \"Black Friday Starts Now\"\nCTA: Shop the Sale\nFormat: Stories — Meta\nAudience: All shoppers\nPlatform: Facebook, Instagram Stories\nSize: 1080x1920",
        goal: "Sales", audience: "B2C", size: "1080x1920",
    },
    {
        id: "11", type: "Social", title: "Behind the Scenes — Studio",
        date: "Apr 17", favorite: false,
        image: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?w=600",
        copy: "A peek behind the curtain. This is how we build the ads that build your brand.\n\nOur creative studio is a fast-moving blend of data, design, and storytelling. Every asset that comes out of here has been tested, iterated, and optimized before it ever reaches your audience.\n\n---\n\nCaption: \"This is where the magic happens ✨\"\nHashtags: #BehindTheScenes #CreativeProcess #StudioLife\nFormat: Carousel — Instagram\nSlides: 5\nSize: 1080x1080\nTone: Authentic, human",
        goal: "Engagement", audience: "Casual", size: "1080x1080",
    },
    {
        id: "12", type: "Design", title: "Event Poster — TechSummit",
        date: "Apr 15", favorite: true,
        image: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?w=600",
        copy: "TechSummit 2025 — Where Innovation Meets Ambition. Join 500+ founders, engineers, and investors for two days of talks, workshops, and networking.\n\nThis year's theme: Building the Next Decade. Speakers from top-tier companies will share what's actually working in product, growth, and AI. Early bird tickets close May 1st.\n\n---\n\nEvent: TechSummit 2025\nDate: June 14–15, 2025\nVenue: Lagos, Nigeria\nCTA: Get Your Ticket\nFormat: Poster — A3 Print & Digital\nSize: 2480x3508\nDeliverables: PDF, PNG, Social-ready crop",
        goal: "Brand Awareness", audience: "B2B", size: "2480x3508",
    },
];

const TYPE_FILTERS = ["All", "Ad", "Social", "Design"];

const TYPE_COLOR = {
    Ad: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", dot: "bg-blue-500" },
    Social: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500" },
    Design: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", dot: "bg-violet-500" },
};

const ITEMS_PER_PAGE = 6;

export default function CreativesPage() {
    const [creatives, setCreatives] = useState(MOCK_CREATIVES);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("grid");
    const [selectedId, setSelectedId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        return creatives.filter((c) => {
            const matchSearch =
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.type.toLowerCase().includes(search.toLowerCase()) ||
                c.goal.toLowerCase().includes(search.toLowerCase());
            const matchFilter =
                activeFilter === "All" ||
                (activeFilter === "Favorites" ? c.favorite : c.type === activeFilter);
            return matchSearch && matchFilter;
        });
    }, [creatives, search, activeFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const selected = creatives.find((c) => c.id === selectedId) || null;

    const handleFilterChange = (key) => { setActiveFilter(key); setPage(1); };
    const handleSearch = (v) => { setSearch(v); setPage(1); };

    const toggleFavorite = (id, e) => {
        e?.stopPropagation();
        setCreatives((prev) => prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)));
    };

    const deleteCreative = (id) => {
        setCreatives((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) setSelectedId(null);
        setDeleteConfirm(null);
    };

    const handleCopy = () => {
        if (!selected) return;
        navigator.clipboard.writeText(selected.copy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSelect = (id) => setSelectedId((prev) => (prev === id ? null : id));

    return (
        /* Full-height flex column — caller must ensure this sits inside a container with a defined height */
        <div className="flex flex-col justify-between pb-4 h-full">

            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Library</p>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Creations</h1>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-sm shadow-blue-200 cursor-pointer">
                    <Plus className="w-4 h-4" /> New Creation
                </button>
            </div>

            {/* ── Toolbar ────────────────────────────────────────────────────────── */}
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

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {[...TYPE_FILTERS, "★ Favorites"].map((f) => {
                        const key = f === "★ Favorites" ? "Favorites" : f;
                        const active = activeFilter === key;
                        return (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${active ? "bg-white text-blue-600 shadow-sm border border-blue-100" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {f}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl ml-auto">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        title="Grid view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        title="List view"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Scrollable content area ─────────────────────────────────────────── */}
            {/* flex-1 + overflow-y-auto so it fills space above the sticky pagination */}
            <div className="flex-1 overflow-y-auto pb-2">
                {filtered.length === 0 ? (
                    <EmptyState hasCreatives={creatives.length > 0} />
                ) : viewMode === "grid" ? (
                    <GridView
                        creatives={paginated}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onToggleFavorite={toggleFavorite}
                        onDeleteRequest={setDeleteConfirm}
                    />
                ) : (
                    <TableView
                        creatives={paginated}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onToggleFavorite={toggleFavorite}
                        onDeleteRequest={setDeleteConfirm}
                    />
                )}
            </div>

            {/* ── Pagination — sticky to bottom ───────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between px-3 py-3 border-t border-gray-100 rounded bg-white">
                    <p className="text-xs text-gray-400">
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer transition-all ${p === page ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Sidebar overlay (fixed, slides in from right) ───────────────────── */}
            {/* Backdrop */}
            {selected && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50"
                    onClick={() => setSelectedId(null)}
                />
            )}

            {/* Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-[340px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${selected ? "translate-x-0" : "translate-x-full"}`}
            >
                {selected && (
                    <Sidebar
                        creative={selected}
                        onClose={() => setSelectedId(null)}
                        onToggleFavorite={toggleFavorite}
                        onCopy={handleCopy}
                        copied={copied}
                    />
                )}
            </div>

            {/* ── Delete confirm modal ─────────────────────────────────────────────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl mx-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete creative?</h3>
                        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                Cancel
                            </button>
                            <button onClick={() => deleteCreative(deleteConfirm)} className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer transition">
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
const GridView = ({ creatives, selectedId, onSelect, onToggleFavorite, onDeleteRequest }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {creatives.map((c) => (
            <CreativeCard
                key={c.id}
                creative={c}
                selected={selectedId === c.id}
                onSelect={() => onSelect(c.id)}
                onToggleFavorite={onToggleFavorite}
                onDeleteRequest={onDeleteRequest}
            />
        ))}
    </div>
);

// ── Card ──────────────────────────────────────────────────────────────────────
const CreativeCard = ({ creative: c, selected, onSelect, onToggleFavorite, onDeleteRequest }) => {
    const tc = TYPE_COLOR[c.type] || TYPE_COLOR.Ad;
    return (
        <div
            onClick={onSelect}
            className={`group bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${selected ? "border-blue-500 shadow-lg shadow-blue-100/60" : "border-gray-100 hover:border-gray-200"}`}
        >
            <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "16/9" }}>
                <img
                    src={c.image}
                    alt={c.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-2.5 left-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm bg-white/90 ${tc.text} ${tc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                        {c.type}
                    </span>
                </div>

                {c.favorite && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-amber-100 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </div>
                )}
            </div>

            <div className="flex flex-col flex-1 px-4 pt-3 pb-3">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.goal} · {c.size}</p>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-[11px] text-gray-400">{c.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id, e); }}
                            title={c.favorite ? "Remove from favourites" : "Add to favourites"}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 transition cursor-pointer"
                        >
                            <Star className={`w-3.5 h-3.5 transition-colors ${c.favorite ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteRequest(c.id); }}
                            title="Delete"
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
const TableView = ({ creatives, selectedId, onSelect, onToggleFavorite, onDeleteRequest }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Creative</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Goal</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Size</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 w-20" />
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {creatives.map((c) => {
                    const tc = TYPE_COLOR[c.type] || TYPE_COLOR.Ad;
                    return (
                        <tr
                            key={c.id}
                            onClick={() => onSelect(c.id)}
                            className={`cursor-pointer transition-colors ${selectedId === c.id ? "bg-blue-50" : "hover:bg-gray-50/80"}`}
                        >
                            <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                        <img src={c.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                                    </div>
                                    <span className="font-medium text-gray-800 truncate max-w-[180px] text-sm">{c.title}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />{c.type}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{c.goal}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs font-mono">{c.size}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{c.date}</td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id, e); }} className="p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition" title="Favourite">
                                        <Star className={`w-3.5 h-3.5 ${c.favorite ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(c.id); }} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition" title="Delete">
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
const Sidebar = ({ creative: c, onClose, onToggleFavorite, onCopy, copied }) => {
    const [hovering, setHovering] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const tc = TYPE_COLOR[c.type] || TYPE_COLOR.Ad;

    const firstLine = c.copy.split("\n")[0];
    const hasMore = c.copy.length > firstLine.length;

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                    {c.type}
                </span>
                <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {/* Image */}
                <div
                    className="relative bg-gray-100 overflow-hidden shrink-0"
                    style={{ aspectRatio: "16/9" }}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                >
                    <img src={c.image} alt={c.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    {hovering && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <button className="flex items-center gap-2 bg-white text-gray-800 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-lg cursor-pointer">
                                <Pencil className="w-3.5 h-3.5" /> Edit Design
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-4 py-4 flex flex-col gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-snug">{c.title}</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-300" />
                            <span className="text-[11px] text-gray-400">{c.date}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                        {[["Goal", c.goal], ["Audience", c.audience], ["Size", c.size]].map(([label, value]) => (
                            <div key={label} className="bg-gray-50 rounded-xl px-2 py-2 text-center border border-gray-100">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
                                <p className="text-[10px] font-semibold text-gray-700 mt-0.5 truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">Generated Copy</p>
                        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed whitespace-pre-line border border-gray-100">
                            {expanded ? c.copy : firstLine}
                            {hasMore && (
                                <button
                                    onClick={() => setExpanded((v) => !v)}
                                    className="flex items-center gap-1 mt-2 text-blue-500 hover:text-blue-700 font-semibold text-xs cursor-pointer transition"
                                >
                                    {expanded
                                        ? <><ChevronUp className="w-3 h-3" /> Show less</>
                                        : <><ChevronDown className="w-3 h-3" /> See more</>
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                <button
                    onClick={onCopy}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${copied
                        ? "bg-green-50 border-green-200 text-green-600"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Text"}
                </button>
                <button
                    onClick={(e) => onToggleFavorite(c.id, e)}
                    title={c.favorite ? "Remove from favourites" : "Add to favourites"}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border cursor-pointer transition-all ${c.favorite
                        ? "bg-amber-50 border-amber-200 text-amber-500"
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-400"
                        }`}
                >
                    <Star className={`w-4 h-4 ${c.favorite ? "fill-amber-400" : ""}`} />
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
            <p className="text-sm text-gray-500">{hasCreatives ? "No creatives match your search." : "No ads creative have been created yet."}</p>
            {!hasCreatives && <p className="text-sm text-gray-400 mt-0.5">Click the create button to kickstart your campaign!</p>}
        </div>
        {!hasCreatives && (
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-sm shadow-blue-200 cursor-pointer">
                <Plus className="w-4 h-4" /> Create
            </button>
        )}
    </div>
);