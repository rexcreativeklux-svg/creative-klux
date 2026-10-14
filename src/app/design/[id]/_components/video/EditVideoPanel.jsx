"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import {
  FEATURED_LOOKS,
  FILTER_LOOK_GROUPS,
  NO_LOOK,
} from "@/(lib)/design/filterLooks";
import { clipRange, captureVideoFrame } from "@/(lib)/design/video";
import { PresetStrip } from "../panels/image/imageEditControls";
import VideoAdjustView from "./VideoAdjustView";

/**
 * EditVideoPanel — Canva's "Video" side panel, opened from the video toolbar's
 * Edit button:
 *
 *   tools     — Adjust (drills in to the colour sliders)
 *   Filters   — a strip of looks, "See all" drills in to the full catalog
 *               grouped Natural / Warm / Cool / … (filterLooks.js)
 *   Video Speed — 0.25×–2× slider with the value beside it
 *   Playback  — Play on repeat, Play automatically
 *
 * Looks and adjustments are CSS filters (imageAdjust.js), so they show live on
 * the playing video and the export paints them onto its poster still.
 *
 * Props: { editor, onClose }
 */
const SPEED_MIN = 0.25;
const SPEED_MAX = 2;

export default function EditVideoPanel({ editor, onClose }) {
  const el = editor?.selectedElement;
  const isVideo = el?.type === "video";
  const [view, setView] = useState(null); // null | "filters" | "adjust"

  // A different video (or none) takes the panel back to its top level, during
  // render like EditImagePanel does — an effect would show one frame of the
  // drill-in pointed at the wrong element.
  const key = isVideo ? el.id : null;
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    if (view) setView(null);
  }

  // A video with no still frame (its capture failed on insert, or it predates
  // posters) gets one now: the filter tiles preview on it, and the export
  // paints it. Once per video per visit — a host that refuses twice won't
  // start answering on the third render.
  const triedRef = useRef(new Set());
  const needsPoster = isVideo && !el.poster && !!el.src;
  useEffect(() => {
    if (!needsPoster || triedRef.current.has(el.id)) return;
    triedRef.current.add(el.id);
    const id = el.id;
    captureVideoFrame(el.src, { time: clipRange(el).start || undefined }).then((still) => {
      if (still) editor.updateElement(id, { poster: still }, { record: false });
    });
  }, [needsPoster, el, editor]);

  const patch = (p) => editor.updateElement(el.id, p, { record: true });
  // What the tiles preview on: the still when there is one, otherwise the
  // video itself, paused on its opening frame — a live <video> needs no CORS
  // to be shown, only to be read.
  const thumb = el?.poster
    ? { kind: "image", src: proxiedSrc(el.poster) }
    : el?.src
      ? { kind: "video", src: `${el.src}#t=${clipRange(el).start || 0.1}` }
      : null;
  const activeLook = el?.filter || "none";
  const pickLook = (id) => patch({ filter: id === "none" ? null : id });

  const title = view === "filters" ? "Filters" : view === "adjust" ? "Adjust" : "Video";

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center gap-1 px-2 border-b border-gray-100">
        {view && (
          <button
            onClick={() => setView(null)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer transition"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="flex-1 px-2 text-sm font-bold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!isVideo ? (
        <p className="px-4 py-6 text-xs text-gray-400">Select a video to edit it.</p>
      ) : view === "adjust" ? (
        <VideoAdjustView editor={editor} />
      ) : view === "filters" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2.5">
            <LookTile
              look={NO_LOOK}
              thumb={thumb}
              active={activeLook === "none"}
              onClick={() => pickLook("none")}
            />
          </div>
          {FILTER_LOOK_GROUPS.map((g) => (
            <div key={g.id} className="flex flex-col gap-2.5">
              <p className="text-sm font-semibold text-gray-800">{g.label}</p>
              <div className="grid grid-cols-3 gap-x-2.5 gap-y-3">
                {g.looks.map((l) => (
                  <LookTile
                    key={l.id}
                    look={l}
                    thumb={thumb}
                    active={activeLook === l.id}
                    onClick={() => pickLook(l.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-7">
          {/* Tools */}
          <div className="flex gap-4">
            <ToolTile
              icon={SlidersHorizontal}
              label="Adjust"
              active={Object.values(el.adjust || {}).some(Boolean)}
              onClick={() => setView("adjust")}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2.5">
            <SeeAllHeader title="Filters" onSeeAll={() => setView("filters")} />
            <PresetStrip>
              {FEATURED_LOOKS.map((l) => (
                <div key={l.id} className="shrink-0 w-22">
                  <LookTile
                    look={l}
                    thumb={thumb}
                    active={activeLook === l.id}
                    onClick={() => pickLook(l.id)}
                  />
                </div>
              ))}
            </PresetStrip>
          </div>

          {/* Video speed */}
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-gray-800">Video Speed</p>
            <SpeedControl
              key={`${el.id}:${el.speed}`}
              value={Number(el.speed) || 1}
              onCommit={(speed) => patch({ speed })}
            />
          </div>

          {/* Playback */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-800">Playback</p>
            <SwitchRow
              label="Play on repeat"
              checked={!!el.loop}
              onChange={(v) => patch({ loop: v })}
            />
            {/* On by default, as in Canva: a video starts by itself when its
                page is shown in a preview or presentation. */}
            <SwitchRow
              label="Play automatically"
              checked={el.autoplay !== false}
              onChange={(v) => patch({ autoplay: v })}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/** A section title with a "See all" link on the right. */
function SeeAllHeader({ title, onSeeAll }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <button
        onClick={onSeeAll}
        className="text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
      >
        See all
      </button>
    </div>
  );
}

/** A round tool button with its label underneath — Canva's tools row. */
function ToolTile({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer group"
    >
      <span
        className={`w-16 h-16 rounded-full border flex items-center justify-center transition ${
          active
            ? "border-blue-500 bg-blue-50 text-blue-600"
            : "border-gray-200 text-gray-600 group-hover:border-gray-300 group-hover:bg-gray-50"
        }`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-xs text-gray-700">{label}</span>
    </button>
  );
}

/** One look, previewed on a frame of the video itself. */
function LookTile({ look, thumb, active, onClick }) {
  const style = { filter: look.css || "none" };
  return (
    <button
      onClick={onClick}
      title={look.label}
      className="w-full flex flex-col items-center gap-1.5 cursor-pointer"
    >
      <span
        className={`w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 transition ${
          active ? "border-blue-500" : "border-transparent hover:border-gray-300"
        }`}
      >
        {thumb?.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb.src}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
            style={style}
          />
        )}
        {thumb?.kind === "video" && (
          <video
            src={thumb.src}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover pointer-events-none"
            style={style}
          />
        )}
      </span>
      <span className={`text-xs ${active ? "text-blue-600 font-medium" : "text-gray-700"}`}>
        {look.label}
      </span>
    </button>
  );
}

/**
 * Speed slider plus the value in a box. Held locally while dragged and written
 * once on release, so a drag is one undo step; the box commits on Enter/blur.
 */
function SpeedControl({ value, onCommit }) {
  const [v, setV] = useState(value);
  const clamp = (n) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, n));
  const commit = (n = v) => {
    const next = Math.round(clamp(n) * 100) / 100;
    setV(next);
    if (next !== value) onCommit(next);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={0.05}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        onPointerUp={() => commit()}
        onKeyUp={() => commit()}
        aria-label="Video speed"
        className="flex-1 cursor-pointer accent-blue-600"
      />
      <input
        type="number"
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={0.05}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        onBlur={() => commit()}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="w-14 h-10 rounded-lg border border-gray-200 text-center text-sm text-gray-700 tabular-nums focus:outline-none focus:border-blue-400"
      />
    </div>
  );
}

/** A labelled on/off switch. */
function SwitchRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition cursor-pointer ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}
