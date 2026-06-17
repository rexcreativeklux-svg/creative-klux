"use client";
// AdPreview.jsx

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Send, Calendar, Download, MoreVertical, CheckCircle2,
  ImageIcon, Save, Edit3, Check, ChevronLeft, Star,
} from "lucide-react";

/* ─── DesignCanvas ─────────────────────────────────────────── */
function DesignCanvas({ variation, maxWidth = 220, maxHeight = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !variation) return;
    const ctx = canvas.getContext("2d");
    const { width, height, background } = variation.canvas;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = background || "#ffffff";
    ctx.fillRect(0, 0, width, height);

    variation.elements.forEach((el) => {
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
        const family = el.fontFamily || "DM Sans";
        ctx.font = `${weight} ${size}px '${family}', sans-serif`;
        ctx.fillStyle = el.color || el.fill || "#000000";
        ctx.textAlign = align;
        const x =
          align === "center" ? el.x + (el.width || 0) / 2
          : align === "right" ? el.x + (el.width || 0)
          : el.x;
        const maxW = el.width || 9999;
        const text = typeof el.content === "string" ? el.content
          : typeof el.text === "string" ? el.text : "";
        const words = text.trim().split(/\s+/);
        let line = "", lineY = el.y + size;
        words.forEach((word) => {
          const test = line ? line + " " + word : word;
          if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, lineY);
            line = word;
            lineY += size * 1.35;
          } else { line = test; }
        });
        if (line) ctx.fillText(line, x, lineY);
      }

      if (el.type === "image" && el.src) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          canvasRef.current?.getContext("2d")?.drawImage(img, el.x, el.y, el.width, el.height);
        };
        img.src = el.src;
      }

      ctx.restore();
    });
  }, [variation]);

  if (!variation) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "auto", borderRadius: 6, display: "block" }}
    />
  );
}

/* ─── DesignResultPanel ─────────────────────────────────────── */
function DesignResultPanel({ result, onBack, saveDesign, activeBrandId, showToast }) {
  const [selectedIds, setSelectedIds] = useState([]);
  // Read variations directly from result so progressive batches re-render
  const variations = result?.variations || [];
  const expectedCount = Number.isFinite(result?.expectedCount) ? result.expectedCount : 0;
  const done = Boolean(result?.done);
  const pendingCount = Math.max(0, expectedCount - variations.length);
  const isLoadingMore = !done && pendingCount > 0;
  const [saving, setSaving] = useState(false);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedIds(selectedIds.length === variations.length ? [] : variations.map((v) => v.id));

  const handleSave = async () => {
    if (!selectedIds.length) { showToast?.("Select at least one design to save"); return; }
    setSaving(true);
    const toSave = variations.filter((v) => selectedIds.includes(v.id));
    try {
      const res = await saveDesign?.(activeBrandId, toSave, "ads");
      if (res?.ok) { setSelectedIds([]); showToast?.("Design(s) saved successfully ✓"); }
      else showToast?.(res?.message || "Failed to save designs");
    } catch { showToast?.("Failed to save designs"); }
    setSaving(false);
  };

  const scoreNum = (v) => parseInt(String(v.copy?.performance_score ?? "").split("/")[0]) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>

      {/* ── toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid #f0f0f0",
        background: "#fff", flexShrink: 0, zIndex: 10,
      }}>
        {/* left */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="hover:scale-95 transition-all duration-200" onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", borderRadius: 8,
            border: "1px solid #e5e7eb", background: "#fafafa",
            fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer",
          }}>
            <ChevronLeft size={13} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isLoadingMore ? "#f59e0b" : "#22c55e",
              boxShadow: isLoadingMore
                ? "0 0 0 3px rgba(245,158,11,0.18)"
                : "0 0 0 3px rgba(34,197,94,0.18)",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>
              {isLoadingMore
                ? `Generating ${variations.length} of ${expectedCount} designs…`
                : `${variations.length} designs ready`}
            </span>
          </div>
        </div>

        {/* right */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="hover:scale-95 transition-all duration-200" onClick={selectAll} style={{
            padding: "5px 10px", borderRadius: 8,
            border: "1px solid #e5e7eb", background: "#fff",
            fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer",
          }}>
            {selectedIds.length === variations.length ? "Deselect All" : "Select All"}
          </button>

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {/* Edit — no action yet */}
                <button style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", borderRadius: 8,
                  border: "1px solid #e5e7eb", background: "#fff",
                  fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer",
                }}>
                  <Edit3 size={12} /> Edit
                </button>

                {/* Save */}
                <button onClick={handleSave} disabled={saving} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8,
                  background: "#22c55e", border: "none",
                  fontSize: 11, fontWeight: 600, color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}>
                  <Save size={12} />
                  {saving ? "Saving…" : `Save ${selectedIds.length}`}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── scrollable 3-col masonry ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 12,
        columnCount: 3, columnGap: 10,
        scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.08) transparent",
      }}>
        {variations.map((v) => {
          const isSelected = selectedIds.includes(v.id);
          const score = scoreNum(v);
          const scoreLabel = String(v.copy?.performance_score ?? "").split("—")[1]?.trim() || "";

          return (
            <div key={v.id} onClick={() => toggleSelect(v.id)} style={{
              breakInside: "avoid", marginBottom: 10, borderRadius: 12,
              overflow: "hidden",
              border: isSelected ? "2px solid #22c55e" : "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", position: "relative",
              boxShadow: isSelected ? "0 0 0 3px rgba(34,197,94,0.14)" : "0 1px 4px rgba(0,0,0,0.05)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}>
              {/* checkbox */}
              <div style={{
                position: "absolute", top: 8, left: 8, zIndex: 5,
                width: 18, height: 18, borderRadius: "50%",
                background: isSelected ? "#22c55e" : "rgba(255,255,255,0.92)",
                border: isSelected ? "none" : "1.5px solid #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)", transition: "all 0.15s",
              }}>
                {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>

              {/* canvas */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f5f8", padding: 8 }}>
                <DesignCanvas variation={v} maxWidth={220} maxHeight={180} />
              </div>

              {/* copy */}
              <div style={{ padding: "8px 10px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#111", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.name}
                  </p>
                  <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: "#f3f4f6", color: "#777", marginLeft: 4, flexShrink: 0 }}>
                    {v.category}
                  </span>
                </div>

                {v.copy?.headline && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                    {v.copy.headline}
                  </p>
                )}

                {(v.copy?.tagline || v.copy?.hook) && (
                  <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 5px", fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                    {v.copy.tagline || v.copy.hook}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: 4 }}>
                  {v.copy?.cta && (
                    <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#0f172a", color: "#fff", whiteSpace: "nowrap" }}>
                      {v.copy.cta}
                    </span>
                  )}
                  {score > 0 && (
                    <span title={scoreLabel} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 700, color: score >= 90 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#94a3b8", marginLeft: "auto", whiteSpace: "nowrap" }}>
                      <Star size={8} fill="currentColor" />{score}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── skeleton placeholders for designs still being generated ── */}
        {isLoadingMore && Array.from({ length: pendingCount }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="mb-2.5 overflow-hidden rounded-xl border border-gray-200 bg-surface"
            style={{ breakInside: "avoid" }}
          >
            <div className="bg-[#f4f5f8] p-2">
              {/* image placeholder — left-to-right shimmer sweep */}
              <div className="relative w-full aspect-square overflow-hidden rounded-md bg-gray-300">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.9)_50%,transparent_100%)] animate-[shimmer-slide_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
            <div className="px-2.5 pb-2.5 pt-2">
              {/* text line placeholders */}
              <div className="relative mb-1.5 h-2.5 w-3/5 overflow-hidden rounded bg-gray-300">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.9)_50%,transparent_100%)] animate-[shimmer-slide_1.5s_ease-in-out_infinite]" />
              </div>
              <div className="relative h-2 w-[90%] overflow-hidden rounded bg-gray-300">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.9)_50%,transparent_100%)] animate-[shimmer-slide_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main AdPreview ────────────────────────────────────────── */
const AdPreview = ({ creative, category, formData, result, onBack, onOpenModal, saveDesign, activeBrandId, showToast }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const videoRefs = useRef({});

  const getAspectRatio = () => {
    const [w, h] = (formData.size || "1200x628").split("x").map(Number);
    return h ? w / h : 1200 / 628;
  };

  const toggleAsset = (id) => setSelectedAsset((prev) => (prev === id ? null : id));

  const handleDownload = async (asset) => {
    try {
      const downloadUrl = asset.videoSrc || asset.src || asset.preview;
      if (!downloadUrl) return;
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = asset.type === "video" || asset.videoSrc || downloadUrl.toLowerCase().endsWith(".mp4") ? "mp4" : "png";
      a.href = url; a.download = `creative_${asset.id}.${ext}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { console.error("Download failed:", err); }
  };

  const handleVideoHover = (assetId, entering) => {
    const video = videoRefs.current[assetId];
    if (!video) return;
    if (entering) { video.muted = true; video.play().catch(() => {}); }
    else video.pause();
  };

  /* ── canvas design result (also shown during initial wait when expectedCount > 0) ── */
  const hasVariations = Array.isArray(result?.variations) && result.variations.length > 0;
  const hasPendingDesigns = (result?.expectedCount ?? 0) > 0 && !result?.done;
  if (hasVariations || hasPendingDesigns) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fafafa", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <DesignResultPanel
          result={result} onBack={onBack}
          saveDesign={saveDesign} activeBrandId={activeBrandId} showToast={showToast}
        />
      </div>
    );
  }

  /* ── image/video asset result ── */
  if (result?.assets?.length) {
    return (
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-3 overflow-y-auto">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-gray-900">Generated Ads</h2>
          <button onClick={onBack} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-gray-600">
            ← Back
          </button>
        </div>

        <AnimatePresence>
          {selectedAsset !== null && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2 shrink-0">
              {[
                { label: "Create Ad", icon: Send, fn: () => onOpenModal?.("post", [result.assets.find((a) => a.id === selectedAsset)]) },
                { label: "Schedule", icon: Calendar, fn: () => onOpenModal?.("schedule", [result.assets.find((a) => a.id === selectedAsset)]) },
                { label: "Download", icon: Download, fn: () => handleDownload(result.assets.find((a) => a.id === selectedAsset)), dark: true },
              ].map(({ label, icon: Icon, fn, dark }) => (
                <button key={label} onClick={fn} className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${dark ? "bg-gray-900 text-white hover:bg-gray-700" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="columns-3 gap-3 flex-1">
          {result.assets.map((asset) => {
            const isVideo = asset.type === "video" || asset.src?.toLowerCase().endsWith(".mp4") || asset.videoSrc || asset.preview?.toLowerCase().endsWith(".mp4");
            return (
              <div key={asset.id}
                onClick={() => toggleAsset(asset.id)}
                onMouseEnter={() => isVideo && handleVideoHover(asset.id, true)}
                onMouseLeave={() => isVideo && handleVideoHover(asset.id, false)}
                className={`relative border rounded-xl overflow-hidden cursor-pointer transition duration-200 mb-3 break-inside-avoid group ${selectedAsset === asset.id ? "border-blue-600 ring-2 ring-blue-600 ring-offset-1" : "border-gray-200 hover:border-blue-400"}`}
              >
                {isVideo ? (
                  <video ref={(el) => (videoRefs.current[asset.id] = el)} src={asset.videoSrc || asset.src || asset.preview} poster={asset.thumbnail || asset.preview} className="w-full h-auto rounded-xl" muted loop playsInline preload="metadata" />
                ) : (
                  <img src={asset.preview || asset.src} alt={asset.alt} className="w-full h-auto rounded-xl" />
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/70 text-white text-xs px-4 py-1.5 rounded-full flex items-center gap-2"><span className="text-lg">▶</span> Hover to Play</div>
                  </div>
                )}
                <div className="absolute top-3 left-3"><input type="radio" readOnly checked={selectedAsset === asset.id} className="w-4 h-4 text-blue-600 accent-blue-600" /></div>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === asset.id ? null : asset.id); }} className="absolute top-3 right-3 bg-surface/90 rounded-full border border-gray-200 p-1.5 shadow-sm hover:bg-surface z-10">
                  <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {menuOpen === asset.id && (
                  <div onClick={(e) => e.stopPropagation()} className="absolute top-12 right-3 bg-surface border border-gray-200 rounded-xl shadow-lg z-20 min-w-[140px] py-1 text-sm">
                    {[["Post Now", () => onOpenModal?.("post", [asset])], ["Schedule", () => onOpenModal?.("schedule", [asset])], ["Download", () => handleDownload(asset)]].map(([label, fn]) => (
                      <button key={label} onClick={fn} className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition">{label}</button>
                    ))}
                  </div>
                )}
                {isVideo && asset.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">{asset.duration}s</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── live preview (pre-generation) ── */
  const previewBg = formData.backgroundImage || null;
  return (
    <div className="bg-surface border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: creative.color }}>{category?.label || creative.label}</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-mono">{formData.size}</span>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f0f2f7] rounded-xl p-5 min-h-[280px]">
        <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ maxWidth: 400, aspectRatio: getAspectRatio() }}>
          {previewBg ? (
            <img src={previewBg} alt="preview bg" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${formData.primaryColor}33, ${formData.secondaryColor}44)` }}>
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3 bg-surface/90 text-[9px] font-mono text-gray-600 px-2 py-1 rounded-full">{formData.size}</div>
          <div className="absolute top-3 left-1/2 -translate-x-1/2"><span className="text-[9px] font-semibold tracking-widest text-white/70 uppercase">Sponsored</span></div>
          {formData.logo && (
            <div className="absolute top-3 right-3 w-10 h-10 bg-surface rounded-xl p-1.5 shadow">
              <img src={formData.logo} alt="logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {formData.brandName && <h2 className="text-xl font-bold leading-tight drop-shadow mb-1" style={{ color: formData.primaryColor, fontFamily: formData.font || "inherit" }}>{formData.brandName}</h2>}
            {formData.caption && <p className="text-white text-xs leading-snug drop-shadow opacity-90 line-clamp-2">{formData.caption}</p>}
            {formData.campaignGoal && <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: formData.primaryColor, color: "#fff" }}>{formData.campaignGoal}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 shrink-0">
        {[["Format", formData.fileFormat || "—"], ["Audience", formData.audience || "—"], ["Goal", formData.campaignGoal?.split(" ")[0] || "—"]].map(([label, value]) => (
          <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2" style={{ background: `${creative.color}10`, color: creative.color }}>
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        Ready for {getPlatformLabel(formData.size)} · {category?.label || "Image Ads"}
      </div>
    </div>
  );
};

const getPlatformLabel = (size) => {
  const map = { "1200x627": "LinkedIn", "627x627": "LinkedIn", "1200x628": "Google", "1200x1200": "Google", "1080x1920": "TikTok / Meta Stories", "1080x1080": "Meta", "1080x1350": "Meta" };
  return map[size] || "all platforms";
};

export default AdPreview;