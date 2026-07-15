"use client";

/**
 * Magic Studio — modal-driven redesign
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirrors the Product Studio layout: a grid of category "tool" buttons at the
 * top, and a mixed "Inspiration" showcase gallery below to keep the page alive.
 * Clicking a category button — or any inspiration card — opens that category's
 * form inside a modal (MagicStudioModal), where the user generates, previews,
 * downloads, and saves without leaving the modal.
 *
 * The category list is driven by studio/creatives.js (magic_studio), so adding a
 * category there flows through here automatically. Per-category presentation
 * (icon, accent color, blurb, sample media) lives in CATEGORY_META below —
 * swap the placeholder Unsplash/Pexels URLs for real samples when ready.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileImage,
  Video,
  Layers,
  Mic,
  AudioLines,
  User,
  Music,
  Sparkles,
  ChevronRight,
  Play,
} from "lucide-react";

import { getCreativeById } from "../studio/creatives";
import MagicStudioModal from "./MagicStudioModal";

const CREATIVE_ID = "magic_studio";

/**
 * Per-category presentation. Keyed by the category `id` in studio/creatives.js.
 * `samples` populate the Inspiration gallery — replace the placeholder CDN URLs
 * with your own media (drop files in /public and use "/your-file.jpg", or paste
 * a full external URL). Set `kind: "video"` on a sample to show the play badge.
 */
const CATEGORY_META = {
  text_to_image: {
    Icon: FileImage,
    color: "bg-pink-100 text-pink-600",
    accent: "#db2777",
    blurb: "Turn a prompt into on-brand images.",
    samples: [
      {
        img: "/magic-studio/text_to_image_1.gif",
      },
      {
        img: "/magic-studio/text_to_image_2.gif",
      },
      {
        img: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&q=80",
      },
    ],
  },
  text_to_video: {
    Icon: Video,
    color: "bg-purple-100 text-purple-600",
    accent: "#7c3aed",
    blurb: "Generate short-form video from text.",
    samples: [
      {
        img: "/magic-studio/text_to_video_1.gif",
      },
      {
        img: "/magic-studio/text_to_video_2.gif",
      },
      {
        img: "/magic-studio/text_to_video_3.gif",
      },
    ],
  },
  image_to_variations: {
    Icon: Layers,
    color: "bg-blue-100 text-blue-600",
    accent: "#2563eb",
    blurb: "Spin one image into many variations.",
    samples: [
      {
        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80",
      },
    ],
  },
  script_to_voiceover: {
    Icon: Mic,
    color: "bg-emerald-100 text-emerald-600",
    accent: "#059669",
    blurb: "Script → voiceover → finished video.",
    samples: [
      {
        img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=600&q=80",
      },
    ],
  },
  audio_to_text: {
    Icon: AudioLines,
    color: "bg-amber-100 text-amber-600",
    accent: "#d97706",
    blurb: "Transcribe audio into clean text.",
    samples: [
      {
        img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&q=80",
      },
    ],
  },
  persona_generator: {
    Icon: User,
    color: "bg-cyan-100 text-cyan-600",
    accent: "#0891b2",
    blurb: "Create content tuned to a persona.",
    samples: [
      {
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80",
      },
    ],
  },
  text_to_audio: {
    Icon: Music,
    color: "bg-indigo-100 text-indigo-600",
    accent: "#4f46e5",
    blurb: "Turn text into speech and audio.",
    samples: [
      {
        img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
      },
      {
        img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
      },
    ],
  },
};

// Fallback presentation for any category without an entry above.
const DEFAULT_META = {
  Icon: Sparkles,
  color: "bg-gray-100 text-gray-600",
  accent: "#6b7280",
  blurb: "AI-powered generation.",
  samples: [],
};

const metaFor = (id) => CATEGORY_META[id] || DEFAULT_META;

// ── Sample card in the Inspiration gallery ──────────────────────────────────
function SampleCard({ sample, category, onOpen }) {
  const meta = metaFor(category.id);
  const { Icon } = meta;
  return (
    <motion.button
      onClick={() => onOpen(category.id)}
      whileHover={{ scale: 1.02 }}
      className="relative rounded-2xl overflow-hidden aspect-4/3 group cursor-pointer bg-gray-100"
    >
      <img
        src={sample.img}
        alt={category.label}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

      {/* Category tag */}
      <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 shadow-sm">
        <span
          className={`w-4 h-4 rounded-md flex items-center justify-center ${meta.color}`}
        >
          <Icon className="w-2.5 h-2.5" />
        </span>
        <span className="text-[10px] font-semibold text-gray-800 leading-none">
          {category.label}
        </span>
      </span>

      {/* Hover CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
        <span className="text-white text-xs font-semibold leading-tight text-left drop-shadow">
          Try {category.label}
        </span>
        <ChevronRight className="w-4 h-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </motion.button>
  );
}

export default function MagicStudioPage() {
  const creative = getCreativeById(CREATIVE_ID);
  const categories = creative?.categories || [];

  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState(null); // category id → modal

  const q = search.toLowerCase().trim();

  // Category buttons filtered by search.
  const filteredCategories = useMemo(
    () =>
      q
        ? categories.filter((c) => c.label.toLowerCase().includes(q))
        : categories,
    [categories, q],
  );

  // Flatten every category's samples into one mixed gallery (each carries its
  // owning category so the tag + click target are correct). Filtered by search.
  const inspiration = useMemo(() => {
    const source = q ? filteredCategories : categories;
    return source.flatMap((cat) =>
      metaFor(cat.id).samples.map((sample, i) => ({
        key: `${cat.id}-${i}`,
        sample,
        category: cat,
      })),
    );
  }, [categories, filteredCategories, q]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Magic Studio</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            AI-powered generation — images, video, audio &amp; more.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a tool"
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-400 w-full sm:w-64 bg-gray-50 cursor-text"
          />
        </div>
      </div>

      <div className="py-6">
        {/* ── Category tool grid ── */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mb-10">
            {filteredCategories.map((cat, i) => {
              const meta = metaFor(cat.id);
              const { Icon } = meta;
              const primary = i === 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setOpenCategory(cat.id)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium border transition-all cursor-pointer hover:-translate-y-0.5 ${
                    primary
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-surface hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="text-left leading-tight min-w-0">
                    <span className="block text-gray-900 font-semibold truncate">
                      {cat.label}
                    </span>
                    <span className="block text-[11px] text-gray-400 font-normal truncate">
                      {meta.blurb}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Inspiration gallery ── */}
        {inspiration.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Inspiration
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sample creations across every tool — click one to start.
                </p>
              </div>
              {q && (
                <button
                  onClick={() => setSearch("")}
                  className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {inspiration.map(({ key, sample, category }) => (
                <SampleCard
                  key={key}
                  sample={sample}
                  category={category}
                  onOpen={setOpenCategory}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Empty search state ── */}
        {q && filteredCategories.length === 0 && inspiration.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Search className="w-8 h-8" />
            <p className="text-sm">No results for &quot;{search}&quot;</p>
            <button
              onClick={() => setSearch("")}
              className="text-sm text-blue-500 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* ── Category modal ── */}
      {openCategory && (
        <MagicStudioModal
          // Remount per category so the sidebar/options reset cleanly and the
          // in-modal switcher swaps categories by re-keying.
          key={openCategory}
          categoryId={openCategory}
          onSwitch={setOpenCategory}
          onClose={() => setOpenCategory(null)}
        />
      )}
    </div>
  );
}
