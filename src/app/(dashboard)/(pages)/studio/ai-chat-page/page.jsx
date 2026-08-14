"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Sparkles, ArrowLeft, Tv2, Share2, Palette, Wand2,
  CheckCircle2, ImageIcon, History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AiChatMessage from "@/app/(components)/studio/AiChatMessage";
import AiChatInput from "@/app/(components)/studio/AiChatInput";
import AiChatTypingIndicator from "@/app/(components)/studio/AiChatTypingIndicator";
import AiPreviewIdle from "@/app/(components)/studio/AiPreviewIdle";
import PaneResizer, { useResizablePane } from "@/app/(components)/studio/PaneResizer";
import { useBreakpoint } from "@/utils/useMediaQuery";
import {
  buildTemplateQuery,
  buildRedesignPayload,
  normalizeDesignTemplate,
} from "@/app/(components)/studio/designTemplates";
import { CREATIVE_ENGINE } from "@/(lib)/design/creativeEngine";
import Toast from "@/app/(components)/Toast";
import ChatHistoryPanel from "./ChatHistoryPanel";
import { normalizeSessionMessages } from "@/app/(components)/studio/chatSessions";
// Shared, read-only renderer — same one the editor (/design/[id]) uses to paint,
// so these previews match exactly what opens in the editor.
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";

/* ─── config ───────────────────────────────────────────────── */

/** localStorage key for the chat pane's dragged width — see PaneResizer.jsx. */
const CHAT_PANE_WIDTH_KEY = "ck.studio.chatPaneWidth";

const CREATIVE_CONFIG = {
  ads_creative: {
    label: "Ads Creative",
    icon: Tv2,
    color: "#60a5fa",
    colorRgb: "96,165,250",
    colorLight: "#eff6ff",
    greeting:
      "Hi! I'm your **Ads Creative** assistant ✦\n\nTell me about the ad you want to create — platform, audience, product — and I'll craft something that converts.",
    placeholder: "e.g. Create a Meta ad for my skincare brand…",
  },
  social_creative: {
    label: "Social Creative",
    icon: Share2,
    color: "#34d399",
    colorRgb: "52,211,153",
    colorLight: "#ecfdf5",
    greeting:
      "Hey! I'm your **Social Creative** assistant ✦\n\nWhat kind of social content are we making today?",
    placeholder: "e.g. Design an Instagram carousel…",
  },
  designer_creative: {
    label: "Designer",
    icon: Palette,
    color: "#c084fc",
    colorRgb: "192,132,252",
    colorLight: "#f3e8ff",
    greeting:
      "Hello! I'm your **Designer** assistant ✦\n\nWhat are we designing today? Tell me the vibe, purpose, or brand.",
    placeholder: "e.g. Design a minimalist logo…",
  },
  magic_studio: {
    label: "Magic Studio",
    icon: Wand2,
    color: "#fb7185",
    colorRgb: "251,113,133",
    colorLight: "#fff1f2",
    greeting:
      "Welcome to **Magic Studio** ✦\n\nWhat would you like to generate? Images, video, audio — just describe your vision.",
    placeholder: "e.g. Generate a futuristic city at dusk…",
  },
  general: {
    label: "Creative Studio",
    icon: Sparkles,
    color: "#003dda",
    colorRgb: "0,61,218",
    colorLight: "#f3e8ff",
    greeting:
      "Hi! I'm **CreativeKlux AI** ✦\n\nWhat would you like to make today?",
    placeholder: "Describe what you'd like to create…",
  },
};

const TYPE_ORDER = [
  "general",
  "ads_creative",
  "social_creative",
  "designer_creative",
  "magic_studio",
];

/* ─── helpers ───────────────────────────────────────────────── */

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── DesignCanvas ─────────────────────────────────────────────
   Renders a single variation's elements array onto an HTML canvas
──────────────────────────────────────────────────────────────── */
function DesignCanvas({ variation }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !variation?.canvas) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas: variation.canvas,
          elements: variation.elements || [],
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
  }, [variation]);

  if (!variation) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        display: "block",
      }}
    />
  );
}

/** What the pane says it is doing, per stage of the create flow. */
const STAGE_LABEL = {
  templates: "Finding a matching template…",
  designs: "Building your designs…",
};

/**
 * The create flow's steps, in order, as a tile can show them. Same keys as
 * `createStage`, so the trail below and the banner above are driven by one
 * value and cannot disagree about which step is running.
 */
const CREATE_STEPS = [
  { key: "templates", label: "Template" },
  { key: "designs", label: "Design" },
];

/* ─── StepTrail ────────────────────────────────────────────────
   Template → Design, shown under each placeholder so a tile says where it is
   rather than only that it is busy. A step that's finished keeps its tick, so
   the trail reads as progress made, not just progress pending.
──────────────────────────────────────────────────────────────── */
function StepTrail({ stage, config }) {
  const current = CREATE_STEPS.findIndex((s) => s.key === stage);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {CREATE_STEPS.map((step, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background: done ? config.color : "var(--color-gray-200)",
                }}
              />
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                fontWeight: active ? 600 : 500,
                color: active
                  ? config.color
                  : done
                    ? "var(--color-gray-500)"
                    : "var(--color-gray-400)",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: done || active ? config.color : "var(--color-gray-300)",
                  animation: active ? "ck-stage-pulse 1.2s ease-in-out infinite" : "none",
                }}
              />
              {done ? `✓ ${step.label}` : step.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── DesignShimmer ────────────────────────────────────────────
   One placeholder in the shape of a finished design card, so the grid holds
   its layout from the first moment and each tile is REPLACED by real artwork
   rather than the whole pane swapping out from under the reader.

   Uses the shared `.shimmer-sweep` (globals.css), which paints its highlight on
   ::after — that composes with the tile's own background instead of owning it,
   and it self-disables under prefers-reduced-motion.
──────────────────────────────────────────────────────────────── */
function DesignShimmer({ index, stage, config }) {
  return (
    <div
      style={{
        borderRadius: 6,
        overflow: "hidden",
        background: "var(--color-surface)",
        border: "1px solid var(--color-gray-200)",
        // Staggered so four tiles pulse as a wave rather than one flat block.
        animationDelay: `${index * 120}ms`,
      }}
    >
      {/* The artwork block carries the stage in words. The tile is big and
          otherwise blank for the length of a redesign, so this is the most
          readable place to say what is happening — the trail underneath tells
          you WHERE in the flow you are, this tells you what is being done.

          `position: relative` + z-index on the text because .shimmer-sweep
          paints its highlight on ::after, which renders above ordinary
          children and would otherwise wash the label out on every pass. */}
      <div
        className="shimmer-sweep"
        style={{
          aspectRatio: "1 / 1",
          background: "var(--color-gray-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 14,
        }}
      >
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.45,
            textAlign: "center",
            color: "var(--color-gray-500)",
            textWrap: "balance",
          }}
        >
          {STAGE_LABEL[stage] || "Working…"}
        </span>
      </div>
      {/* The step trail replaces the usual two placeholder bars: the space
          under a tile is better spent saying what is happening to it than
          miming a title that hasn't been written yet. */}
      <div style={{ padding: "9px 10px" }}>
        <StepTrail stage={stage} config={config} />
      </div>
    </div>
  );
}

/* ─── StageBanner ──────────────────────────────────────────────
   The running commentary above the grid. A create takes long enough that a
   pane which only shimmers reads as stuck — this names the step, so the wait
   is legible rather than merely animated.
──────────────────────────────────────────────────────────────── */
function StageBanner({ stage, config, done, total }) {
  const { color, colorRgb } = config;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 12px",
        borderBottom: "1px solid var(--color-gray-200)",
        background: `rgba(${colorRgb},0.04)`,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          animation: "ck-stage-pulse 1.2s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-gray-700)" }}>
        {STAGE_LABEL[stage] || "Working…"}
      </span>
      {/* Only once designs start landing — "0 of 4" before anything exists
          reads as a stall rather than progress. */}
      {total > 0 && done > 0 && (
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-gray-500)" }}>
          {done} of {total}
        </span>
      )}
      <style>{`@keyframes ck-stage-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
    </div>
  );
}

/* ─── TemplatesPreview ─────────────────────────────────────────
   The templates pulled from /design-templates/public-fetch once the assistant
   answers with type:"create". They arrive in the same {canvas, elements} shape
   as generated variations, so they paint through the very same DesignCanvas.
──────────────────────────────────────────────────────────────── */
function TemplatesPreview({ templates, time, config, onPick, selectedId }) {
  const { color, colorRgb } = config;

  return (
    <div
      style={{
        position: "absolute",
        inset: 16,
        background: "var(--color-surface)",
        borderRadius: 14,
        // A black-alpha hairline disappears on a dark panel, so the divider
        // takes the palette's border token instead — see the .dark block in
        // globals.css. Same swap throughout this file.
        border: "0.5px solid var(--color-gray-200)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "ck-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          alignItems: "start",
        }}
      >
        {templates.map((tpl) => {
          const isSelected = selectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onPick(tpl)}
              title={tpl.name}
              style={{
                position: "relative",
                display: "block",
                width: "100%",
                padding: 0,
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--color-surface)",
                cursor: "pointer",
                textAlign: "left",
                border: isSelected
                  ? `2px solid ${color}`
                  : "1px solid var(--color-gray-200)",
                boxShadow: isSelected
                  ? `0 4px 18px rgba(${colorRgb},0.25)`
                  : "0 1px 4px rgba(0,0,0,0.05)",
                transition: "all 0.18s",
              }}
            >
              <DesignCanvas variation={tpl} />
              <div
                style={{
                  padding: "8px 10px 9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-gray-900)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tpl.name}
                </p>
                <span
                  style={{
                    fontSize: 8.5,
                    color: "var(--color-gray-400)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {Math.round(tpl.canvas.width)}×{Math.round(tpl.canvas.height)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "8px 14px",
          borderTop: "0.5px solid var(--color-gray-200)",
          fontSize: 11,
          color: "var(--color-gray-500)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
          }}
        />
        {templates.length} template{templates.length > 1 ? "s" : ""} · {time}
      </div>
    </div>
  );
}

function PreviewPanel({ result,
  config,
  creativeType,
  selectedDesigns,
  setSelectedDesigns,
  onToggleSelect,
  saveDesign,
  activeBrandId, showToast,
  stage,
  expectedCount,
  onPickTemplate,
  selectedTemplateId, }) {
  const { colorRgb, colorLight } = config;
  // Owned here rather than by the page: the save belongs to this panel's
  // toolbar, and nothing outside it needs to know the button is busy.
  const [saving, setSaving] = useState(false);

  // Designs already returned by this run, if any. During "designs" they arrive
  // in batches, so this grows while the stage is still running.
  const landed = result?.type === "design" ? result.variations || [] : [];

  // Nothing to show yet → a full grid of placeholders. Once the first design
  // lands the branch below takes over and mixes real cards with the remaining
  // shimmers, so a tile is REPLACED in place rather than the pane re-rendering
  // from scratch.
  if (stage && !landed.length) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 16,
          background: "var(--color-surface)",
          borderRadius: 14,
          border: "0.5px solid var(--color-gray-200)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <StageBanner stage={stage} config={config} done={0} total={expectedCount} />
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 10,
            alignItems: "start",
          }}
        >
          {Array.from({ length: Math.max(1, expectedCount) }).map((_, i) => (
            <DesignShimmer key={i} index={i} stage={stage} config={config} />
          ))}
        </div>
      </div>
    );
  }

  if (result?.type === "templates") {
    return (
      <TemplatesPreview
        templates={result.templates}
        time={result.time}
        config={config}
        onPick={onPickTemplate}
        selectedId={selectedTemplateId}
      />
    );
  }

  if (!result || result.type !== "design") {
    return <AiPreviewIdle config={config} />;
  }

  const { variations, time } = result;



  return (
    <div
      style={{
        position: "absolute",
        inset: 16,
        background: "var(--color-surface)",
        borderRadius: 14,
        border: "0.5px solid var(--color-gray-200)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "ck-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* Still building — the banner keeps naming the step while the designs
          that have landed are already on screen beside the pending tiles. */}
      {stage && (
        <StageBanner
          stage={stage}
          config={config}
          done={variations.length}
          total={Math.max(expectedCount, variations.length)}
        />
      )}

      {selectedDesigns?.length > 0 && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "var(--color-surface)",
            padding: "10px 12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderBottom: "1px solid var(--color-gray-200)",
            transform: "translateY(-10px)",
            animation: "slideDown 0.25s ease forwards",
          }}
        >
          {/* Saving is NOT instant — saveDesign paints a full-canvas thumbnail
              for every selected design before it uploads anything, so a
              four-design save is seconds of work with nothing else on screen to
              show for it. The button owns that state: spinner while it runs,
              and disabled so a second click can't start a duplicate save of the
              same selection. */}
          <button
            className={saving ? "" : "hover:scale-95"}
            disabled={saving}
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                // Persist the real creative type so cards show the correct Ads/Social/Design/Magic badge.
                // saveDesign strips the "_creative" suffix; "general" has no category so default it to "ads".
                const saveType = !creativeType || creativeType === "general" ? "ads" : creativeType;
                const res = await saveDesign(activeBrandId, selectedDesigns, saveType);

                if (res?.ok) {
                  setSelectedDesigns([]);
                  showToast("Design(s) saved successfully", "success");
                } else {
                  showToast(res?.message || "Failed to save designs", "error");
                }
              } catch (err) {
                // saveDesign resolves rather than throws, but a thumbnail
                // render is browser work and can still blow up — without this
                // the button would stay stuck on "Saving…" forever.
                console.error("❌ [chat] save threw:", err);
                showToast("Couldn't save the design(s). Please try again.", "error");
              } finally {
                setSaving(false);
              }
            }}
            style={{
              background: "#22c55e",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.75 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {saving && (
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  animation: "ck-btn-spin 0.7s linear infinite",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
            )}
            {saving ? (
              "Saving…"
            ) : (
              <>
                Save {selectedDesigns.length} design
                {selectedDesigns.length > 1 ? "s" : ""}
              </>
            )}
            <style>{`@keyframes ck-btn-spin { to { transform: rotate(360deg); } }`}</style>
          </button>

          {/* Clear goes too: wiping the selection mid-save would leave the
              request writing designs the user can no longer see selected.
              `hover:scale-95` is dropped while saving — a button that still
              springs under the cursor reads as clickable however it is
              coloured, which is the one signal that matters here. */}
          <button
            className={saving ? "" : "hover:scale-95"}
            disabled={saving}
            onClick={() => setSelectedDesigns([])}
            style={{
              background: "var(--color-gray-100)",
              color: saving ? "var(--color-gray-400)" : "var(--color-gray-900)",
              border: "1px solid var(--color-gray-200)",
              padding: "8px 10px",
              borderRadius: 10,
              fontSize: 12,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.55 : 1,
              transition: "opacity 0.2s, color 0.2s",
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* ── responsive grid: 1 design = full width, 2–3 = boxes side by side ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 10,
          alignItems: "start",
          scrollbarWidth: "thin",
          // A black-alpha thumb is invisible on the dark panel; gray-300 tracks
          // the theme and stays subtle in light.
          scrollbarColor: "var(--color-gray-300) transparent",
        }}
      >
        {variations.map((v) => {
                const score = String(v.copy?.performance_score ?? "");
                const scoreNum = score.split("/")[0];
                const scoreLabel = score.split("—")[1]?.trim() || "";
                const isSelected = selectedDesigns?.some((s) => s.id === v.id);

                return (
                  <div
                    key={v.id}
                    onClick={() => onToggleSelect(v)}
                    className="border border-gray-200"
                    style={{
                      // Same 6 as DesignShimmer — the two sit side by side in
                      // this grid while a batch is still landing, and a tile
                      // that changed shape as it filled would read as a swap
                      // rather than the same card resolving.
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "var(--color-surface)",
                      // The selected green stays literal — it is a state colour,
                      // not a theme one, and reads on both backgrounds.
                      border: isSelected
                        ? "2px solid #22c55e"
                        : "1px solid var(--color-gray-200)",
                    }}
                  >

                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#22c55e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </div>
                    )}

                    {/* canvas */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DesignCanvas variation={v} />
                    </div>

                    {/* copy details */}
                    <div style={{ padding: "10px 11px 11px" }}>

                      {/* name + category row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-gray-900)", margin: 0, lineHeight: 1.3 }}>
                          {v.name}
                        </p>
                        <span style={{
                          fontSize: 8.5,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background: "var(--color-gray-100)",
                          color: "var(--color-gray-500)",
                          whiteSpace: "nowrap",
                          marginLeft: 6,
                          flexShrink: 0,
                        }}>
                          {v.category}
                        </span>
                      </div>

                      {/* headline */}
                      {v.copy?.headline && (
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-gray-900)", margin: "0 0 2px", lineHeight: 1.35 }}>
                          {v.copy.headline}
                        </p>
                      )}

                      {/* tagline */}
                      {v.copy?.tagline && (
                        <p style={{ fontSize: 9.5, color: "var(--color-gray-500)", margin: "0 0 6px", lineHeight: 1.4, fontStyle: "italic" }}>
                          {v.copy.tagline}
                        </p>
                      )}

                      {/* body */}
                      {v.copy?.body && (
                        <p style={{
                          fontSize: 9,
                          color: "var(--color-gray-400)",
                          margin: "0 0 8px",
                          lineHeight: 1.55,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {v.copy.body}
                        </p>
                      )}

                      {/* CTA + score row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        {v.copy?.cta && (
                          // The CTA chip is deliberately the INVERSE of the
                          // card it sits on, not a fixed near-black: gray-900
                          // over surface keeps it dark-on-white in light and
                          // flips to light-on-dark in dark, where a #0f172a
                          // pill would have disappeared into the card.
                          <span style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: "var(--color-gray-900)",
                            color: "var(--color-surface)",
                            whiteSpace: "nowrap",
                          }}>
                            {v.copy.cta}
                          </span>
                        )}
                        {scoreNum && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#22c55e",
                              whiteSpace: "nowrap",
                              marginLeft: "auto",
                            }}
                            title={scoreLabel}
                          >
                            ★ {scoreNum}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

        {/* The designs still in flight, holding their place in the same grid.
            Each one is replaced by real artwork the moment its batch lands, so
            the layout never jumps — the count is what's OUTSTANDING, not the
            total. */}
        {stage &&
          Array.from({
            length: Math.max(0, expectedCount - variations.length),
          }).map((_, i) => (
            <DesignShimmer key={`pending-${i}`} index={i} stage={stage} config={config} />
          ))}
      </div>

      {/* ── footer ── */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: "0.5px solid var(--color-gray-200)",
          fontSize: 11,
          color: "var(--color-gray-500)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        {variations.length} designs ready · {time}
      </div>

      <style>{`
        @keyframes ck-slide-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

      `}</style>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function AiCreativeChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    creativeAiChat,
    saveDesign,
    activeBrand,
    activeBrandId,
    brandsLoading,
    fetchDesignTemplates,
    generateCustomCreative,
    createChatSession,
    fetchChatSessions,
    fetchChatSession,
  } = useAuth();

  const creativeType = searchParams.get("creative") || "general";
  const config = CREATIVE_CONFIG[creativeType] || CREATIVE_CONFIG.general;
  const Icon = config.icon;
  // `config.colorLight` is deliberately NOT pulled in: its opaque pastels
  // (#eff6ff…) only work on a white chrome, so every hover in this file tints
  // with `rgba(colorRgb, …)` instead, which holds up in both themes.
  const { color, colorRgb } = config;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  // Which half of the create flow is running: "templates" while Scraive is
  // being queried, "designs" while redesign is building, null when idle. ONE
  // value rather than a boolean per step, so the preview pane and the chat's
  // typing indicator can never disagree about what is happening.
  const [createStage, setCreateStage] = useState(null);
  // How many designs are coming, so the pane can put down that many shimmer
  // tiles and swap each one for the real thing as it lands. Comes from the
  // conversation via buildTemplateQuery's num_template.
  const [expectedCount, setExpectedCount] = useState(0);
  // The template the user picked from the fetched set (null = none yet).
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);
  const [selectedDesigns, setSelectedDesigns] = useState([]);

  // Chat | preview split. The width the user drags to is kept in localStorage,
  // so the layout they set up is still there after a refresh.
  //
  // The two minimums are deliberately modest: together they are the narrowest
  // window the split still works in (≈600px of content area), and anything
  // larger keeps them apart is drag range. Setting them generously — say 320 +
  // 420 — would pin the handle solid on a laptop-sized window, because the
  // floor and the ceiling would meet.
  const {
    containerRef: splitRef,
    paneProps: chatPaneProps,
    resizerProps,
  } = useResizablePane({
    storageKey: CHAT_PANE_WIDTH_KEY,
    defaultWidth: 480,
    minWidth: 300,
    minSiblingWidth: 300,
  });

  // ── Split vs. tabs ────────────────────────────────────────────────────────
  // The two minimums above add up to 600px of content area before the split is
  // even viable, and that is before either pane has usable padding. Below `lg`
  // the panes become tabs instead, and the resizer is not rendered at all —
  // which is also what keeps the saved width single-writer: no handle to drag
  // means nothing writes to localStorage while the user is on a phone.
  const isDesktopSplit = useBreakpoint("lg");
  const [mobilePane, setMobilePane] = useState("chat");

  const initialMessage = searchParams.get("initialMessage") || "";
  // A saved chat to reopen — written by the home rail's Chat History cards
  // (templatesApi.chatSessionHref).
  const sessionParam = searchParams.get("session") || "";
  // The model the composer picked, passed straight through to the API.
  const model = searchParams.get("model") || "";

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success", // or "error"
  });

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  /* ── Saved chats ──────────────────────────────────────────────────────────
     Every message sent from here is persisted server-side (creativeAiChat's
     `save_chat`). These two pieces of state are the read side of that: the
     brand's session list, and whichever session is currently on screen.

     NB: the chat POST carries no session id, so continuing an opened thread
     still starts a fresh session on the backend. Until it accepts one, this is
     history you can read back, not a conversation you can resume. */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [openingSessionId, setOpeningSessionId] = useState(null);

  const loadSessions = useCallback(async () => {
    if (!activeBrandId) {
      setSessionsError("Select a brand to see its chats.");
      return;
    }
    setSessionsLoading(true);
    setSessionsError("");

    const res = await fetchChatSessions(activeBrandId);
    if (res?.ok) setSessions(res.items);
    else setSessionsError(res?.message || "Something went wrong.");

    setSessionsLoading(false);
  }, [activeBrandId, fetchChatSessions]);

  // Fetched on first open rather than on mount: most visits here are a new
  // chat, and the list is 38 rows and growing for an established brand.
  const toggleHistory = useCallback(() => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && !sessions.length) loadSessions();
  }, [historyOpen, sessions.length, loadSessions]);

  /**
   * Put the backend's session id in the URL the moment it names one.
   *
   * WITHOUT THIS A REFRESH LOSES THE THREAD. The conversation is saved
   * server-side from the first exchange (`save_chat: "true"`), and this page can
   * already reopen one through `?session=` — but nothing was writing that id
   * down, so a reload still saw only `?initialMessage=…`, re-seeded from it, and
   * re-sent the opening prompt into a brand new thread. Everything after the
   * first message was stranded in a session nobody could name.
   *
   * The opening prompt and its images are dropped from the URL at the same
   * time: they are in the thread now, and leaving them behind would re-send
   * them on top of the restored history on every refresh.
   *
   * `replace`, not `push`, so this doesn't put a back-button step between the
   * user and wherever they came from.
   *
   * @param {object} data The parsed chat response body.
   */
  const rememberSession = useCallback(
    (id) => {
      if (!id || activeSessionId === id) return;

      setActiveSessionId(id);

      const params = new URLSearchParams(searchParams.toString());
      params.set("session", id);
      params.delete("initialMessage");
      params.delete("image");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [activeSessionId, pathname, router, searchParams],
  );

  /** Same, but reading the id out of a chat reply. */
  const adoptSession = useCallback(
    (data) => rememberSession(data?.session_id),
    [rememberSession],
  );

  /**
   * Get the id for the thread this message belongs to, opening one first if
   * there isn't one yet.
   *
   * Every send goes through here, so `session_id` is a real id on the FIRST
   * request rather than null until the backend gets round to minting one. All
   * three entry points (Ai Chat, Import Site, Brand) route into this page's
   * send path, so they are all covered by this one call.
   *
   * A session held in a ref as well as state: two sends can be started before
   * React has re-rendered with the new id, and the ref is what stops the second
   * one opening a duplicate thread.
   *
   * Returns null if the session couldn't be created — the caller decides
   * whether to go ahead without one.
   */
  const sessionIdRef = useRef(null);
  useEffect(() => {
    sessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;

    const res = await createChatSession(activeBrandId);
    if (!res?.ok || !res.sessionId) {
      console.error("❌ [chat] couldn't open a session:", res?.message);
      return null;
    }

    // Written to the ref immediately: the state update and the re-render that
    // carries it are a tick away, and a fast second send must not race past it.
    sessionIdRef.current = res.sessionId;
    rememberSession(res.sessionId);
    return res.sessionId;
  }, [createChatSession, activeBrandId, rememberSession]);

  /** Replace the transcript with a stored one. */
  const handleOpenSession = useCallback(
    async (sessionId) => {
      setOpeningSessionId(sessionId);
      const res = await fetchChatSession(sessionId);
      setOpeningSessionId(null);

      if (!res?.ok) {
        showToast(res?.message || "Couldn't open that chat.", "error");
        return false;
      }

      const thread = normalizeSessionMessages(res.messages);
      if (!thread.length) {
        // Nothing recognisable came back — surface the body once so the shape
        // can be matched in chatSessions.js instead of failing silently.
        console.warn("[chat] session has no readable messages — raw:", res.raw);
        showToast("That chat has no messages to show.", "error");
        return false;
      }

      setMessages(thread);
      setActiveSessionId(sessionId);
      setHistoryOpen(false);

      // The stored thread carries no rendered designs, so the preview pane
      // returns to idle rather than keeping the previous chat's results.
      setPreviewResult(null);
      setSelectedTemplate(null);
      setSelectedDesigns([]);
      if (!isDesktopSplit) setMobilePane("chat");
      return true;
    },
    [fetchChatSession, isDesktopSplit],
  );

  useEffect(() => {
    if (hasInitialized.current) return;
    // WAIT for the active brand before firing the opening send. `activeBrand`
    // hydrates from localStorage, so on a fresh load (or a hard refresh onto
    // this URL) it is still null for the first render(s) — sending then would
    // be rejected for a missing brand_id even though the user has one selected.
    // Not marking the effect as initialised yet is the point: it re-runs when
    // brandsLoading flips and sends properly.
    if (brandsLoading) return;
    hasInitialized.current = true;

    setPreviewResult(null);

    // Opened from the home rail's Chat History tab (or any `?session=` link):
    // load that thread instead of greeting. A failure falls through to the
    // greeting rather than leaving an empty window — handleOpenSession has
    // already told the user why on the toast.
    if (sessionParam) {
      (async () => {
        const opened = await handleOpenSession(sessionParam);
        if (opened) return;
        setMessages([
          {
            role: "assistant",
            content: config.greeting,
            timestamp: new Date().toISOString(),
          },
        ]);
      })();
      return;
    }

    // The prompt and its images arrive as separate URL params (see the home
    // page) and stay separate from here to the request body. Read inside the
    // effect: getAll() builds a fresh array each call, so hoisting it would add
    // an unstable value to the render scope for no gain — this runs once.
    if (initialMessage.trim()) {
      const initialImages = searchParams.getAll("image");
      const userMsg = {
        role: "user",
        content: initialMessage,
        images: initialImages,
        timestamp: new Date().toISOString(),
      };

      setMessages([userMsg]);

      handleInitialSend(initialMessage, initialImages);
      return;
    }

    setMessages([
      {
        role: "assistant",
        content: config.greeting,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [creativeType, initialMessage, sessionParam, brandsLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /**
   * Say something in the thread as the assistant.
   *
   * A FAILED CREATE HAS TO LAND HERE, not only on a toast. By the time one of
   * these fires the assistant has already said "Creating 4 Instagram posts…",
   * so a toast that fades after a few seconds leaves a transcript promising
   * work that never happened, a preview pane back on "Ready to generate", and
   * nothing on screen explaining the gap. The message is the only account of it
   * the user still has a minute later — and the only one that survives a
   * refresh, since the thread is saved server-side.
   *
   * @param {string} content What went wrong, in the assistant's voice.
   */
  const postAssistantNote = useCallback((content) => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content, timestamp: new Date().toISOString() },
    ]);
  }, []);

  /**
   * Inspect a chat reply and, when the assistant signals it has everything it
   * needs (`type: "create"`), build the design end to end and show it.
   *
   * THE WHOLE FLOW, with no clicks in the middle:
   *   1. Scraive  → /design-templates/public-fetch for layouts matching the
   *      platform + size the assistant settled on.
   *   2. Redesign → /creatives/redesign turns those layouts into real designs
   *      carrying the brand's copy, colours and images.
   *   3. The finished variations land in the preview pane on the right.
   *
   * HOW MANY comes from the conversation: buildTemplateQuery reads the reply's
   * `num_variations` into `num_template`, Scraive returns that many layouts, and
   * redesign produces one design per layout — so "make me 3 versions" yields 3
   * without the count being threaded separately.
   *
   * Declared ahead of the send handlers because both call it. Every failure
   * surfaces on the toast and leaves the pane on its previous state: a design
   * that couldn't be built must never break the conversation that asked for it.
   *
   * @param {object} data The parsed chat response body.
   * @param {string[]} [images] Hosted image URLs attached to the user's message.
   */
  const maybeCreateDesign = useCallback(
    async (data, images = []) => {
      if (data?.type !== "create") return;

      const query = buildTemplateQuery(data);
      if (!query) {
        // buildTemplateQuery has logged the whole reply. Say something here
        // too: this used to return in silence, so a create reply that couldn't
        // be read looked exactly like one that was never sent — no request, no
        // spinner, no error, just a preview pane that never changed.
        showToast(
          "The assistant didn't say which platform and size to use. Ask it to confirm those and try again.",
          "error",
        );
        postAssistantNote(
          "I'm missing the platform and size for this one. Tell me those (for example \"Instagram square 1080x1080\") and I'll build it.",
        );
        return;
      }

      if (!activeBrandId) {
        console.error("❌ [chat] create blocked — no active brand");
        showToast("Select a brand before generating a design.", "error");
        postAssistantNote(
          "I need an active brand before I can build a design. Pick one from the brand switcher and ask me again.",
        );
        return;
      }

      // Raw Scraive rows. The redesign endpoint wants the layout in the shape
      // Scraive published it, so these are NOT run through
      // normalizeDesignTemplate — that shape is only for painting a preview.
      //
      // Templates are fetched ONLY for the redesign engine, exactly as the
      // studio forms do it: involk generates from scratch, and handing it an
      // empty template list would block it with a "no templates" error for a
      // step it never needed. Which engine runs is CREATIVE_ENGINE's call, not
      // this page's — that one flag is the whole point of creativeEngine.js.
      let rawTemplates = [];
      if (CREATIVE_ENGINE === "redesign") {
        console.log("🎨 [chat] create signal received, fetching templates:", query);
        setCreateStage("templates");
        // Put down one shimmer per design the conversation asked for.
        setExpectedCount(query.num_template || 1);
        try {
          const res = await fetchDesignTemplates(query);

          if (!res?.ok) {
            console.error(
              "❌ [chat] template fetch failed:",
              res?.messageForDevs || res?.message,
            );
            showToast(res?.message || "Couldn't load design templates.", "error");
            postAssistantNote(
              "I couldn't reach the template library just now, so I wasn't able to build this. Ask me to try again in a moment.",
            );
            setCreateStage(null); // take the shimmers away — nothing is coming
            return;
          }

          rawTemplates = Array.isArray(res.data) ? res.data : [];

          // Usable == has a layout we could paint. Checked with the normaliser
          // even though the raw rows are what gets sent, because a row Scraive
          // can't describe a layout for is one redesign can't build from either.
          const usable = rawTemplates.filter((row) => normalizeDesignTemplate(row));
          if (!usable.length) {
            console.warn("⚠️ [chat] no usable templates for", query);
            showToast(
              `No templates found for ${query.category} at ${query.type_size}.`,
              "error",
            );
            // Names the exact combination that came back empty, and suggests
            // the move that actually helps — the library is stocked per
            // format, so a different size or platform usually does have one.
            postAssistantNote(
              `I couldn't find any ${query.category.replace(/_/g, " ")} templates at ${query.type_size}, so I wasn't able to build this one. Try a different size or platform and I'll have another go.`,
            );
            setCreateStage(null);
            return;
          }
          rawTemplates = usable;
          console.log(`✅ [chat] ${rawTemplates.length} template(s) ready`);
        } catch (err) {
          console.error("❌ [chat] template fetch threw:", err);
          showToast("Couldn't load design templates. Please try again.", "error");
          postAssistantNote(
            "Something went wrong reaching the template library, so I wasn't able to build this. Ask me to try again.",
          );
          setCreateStage(null);
          return;
        }
      }

      // ── 2. Straight into redesign, no template-picking step ────────────────
      const payload = buildRedesignPayload({
        data,
        query,
        templates: rawTemplates,
        brand: activeBrand,
        brandId: activeBrandId,
        creativeType,
        images,
      });

      console.log("🚀 [chat] redesigning", rawTemplates.length, "template(s)");
      setCreateStage("designs");
      try {
        // Batches stream back (redesign chunks templates by 9). Each one is
        // appended so a long set fills the pane as it arrives rather than
        // sitting on the spinner until the last design lands.
        const collected = [];
        let painted = false;

        // No `forceEngine` override: generateCustomCreative reads
        // CREATIVE_ENGINE itself, so flipping that one line reroutes this page
        // along with every form. Pinning it here would have quietly exempted
        // the chat from the switch.
        const result = await generateCustomCreative(payload, (batch) => {
          if (!batch.ok || !batch.variations?.length) return;
          collected.push(...batch.variations);
          if (!painted) {
            painted = true;
            // First designs are in. The stage stays "designs" so the tiles
            // still waiting keep shimmering beside the ones that landed.
          }
          setPreviewResult({
            type: "design",
            variations: [...collected],
            time: nowTime(),
          });
        });

        if (!result?.ok) {
          console.error("❌ [chat] redesign failed:", result?.message);
          showToast(result?.message || "Couldn't build the design.", "error");
          postAssistantNote(
            `I ran into a problem building the design${result?.message ? `: ${result.message}` : ""}. Ask me to try again and I'll rerun it.`,
          );
          return;
        }

        if (!collected.length) {
          console.warn("⚠️ [chat] redesign returned no variations");
          showToast("The design came back empty. Please try again.", "error");
          postAssistantNote(
            "The design came back empty — nothing was generated. Ask me to try again and I'll rerun it.",
          );
          return;
        }

        console.log(`✅ [chat] ${collected.length} design(s) ready`);
      } catch (err) {
        console.error("❌ [chat] redesign threw:", err);
        showToast("Couldn't build the design. Please try again.", "error");
        postAssistantNote(
          "Something went wrong while building the design. Ask me to try again and I'll rerun it.",
        );
      } finally {
        setCreateStage(null);
      }
    },
    [
      fetchDesignTemplates,
      generateCustomCreative,
      activeBrand,
      activeBrandId,
      creativeType,
      postAssistantNote,
    ],
  );

  const handleSend = useCallback(
    async (content, images = []) => {
      const userMsg = {
        role: "user",
        content,
        // Kept on the message so the bubble can render the tiles; the API gets
        // this same array as its `images` field.
        images,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Open the thread before saying anything into it, so this message
        // carries a real session_id rather than null.
        const sessionId = await ensureSession();

        const result = await creativeAiChat({
          message: content,
          brandId: activeBrandId,
          images,
          logo: activeBrand?.logo,
          model,
          sessionId,
        });

        const reply = result.ok
          ? result.reply
          : result.message || "Something went wrong.";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply,
            image_url: result.data?.image_url || null,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Name the thread in the URL before anything slow runs, so a refresh
        // mid-generation still comes back to this conversation.
        adoptSession(result.data);

        const designType = result.data?.type;
        const designVars = result.data?.variations;

        if (designType === "design" && Array.isArray(designVars) && designVars.length) {
          setPreviewResult({ type: "design", variations: designVars, time: nowTime() });
        }

        // The assistant has everything it needs → build the design.
        await maybeCreateDesign(result.data, images);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Oops! Something went wrong.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [creativeAiChat, activeBrandId, activeBrand?.logo, model, maybeCreateDesign, adoptSession, ensureSession]
  );

  const handleInitialSend = useCallback(async (content, images = []) => {
    setIsLoading(true);

    try {
      // The opening message of a brand-new thread — this is the call that
      // actually creates the session the whole conversation then lives in.
      const sessionId = await ensureSession();

      const result = await creativeAiChat({
        message: content,
        brandId: activeBrandId,
        images,
        logo: activeBrand?.logo,
        model,
        sessionId,
      });

      const reply = result.ok
        ? result.reply
        : result.message || "Something went wrong.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          image_url: result.data?.image_url || null,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Name the thread in the URL before anything slow runs, so a refresh
      // mid-generation still comes back to this conversation. Doing it here is
      // what stops the opening prompt re-sending on every reload.
      adoptSession(result.data);

      const designType = result.data?.type;
      const designVars = result.data?.variations;

      if (designType === "design" && Array.isArray(designVars) && designVars.length) {
        setPreviewResult({ type: "design", variations: designVars, time: nowTime() });
      }

      // The assistant has everything it needs → build the design.
      await maybeCreateDesign(result.data, images);

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! Something went wrong.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [creativeAiChat, activeBrandId, activeBrand?.logo, model, maybeCreateDesign, adoptSession, ensureSession]);

  // Which template the user has picked from the fetched set.
  const handlePickTemplate = useCallback((template) => {
    setSelectedTemplate((current) =>
      current?.id === template.id ? null : template,
    );
    console.log(`🖼️ [chat] template selected: ${template.name} (${template.id})`);
  }, []);

  const toggleDesignSelection = useCallback((design) => {
    setSelectedDesigns((prev) => {
      const exists = prev.find((d) => d.id === design.id);

      if (exists) {
        return prev.filter((d) => d.id !== design.id);
      }

      return [...prev, design];
    });
  }, []);



  /* ── render ── */
  return (
    // No pb-nav here: `main` in (dashboard)/layout.js ends the scroll viewport
    // at the mobile bottom bar, so the composer already clears it. Adding it
    // again would leave a bar-height gap under the send button.
    <div className="pt-header h-full"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Mobile pane switcher ─────────────────────────────────────────────
          Two panes side by side needs roughly 800px before either is usable;
          below `lg` they become tabs and one owns the screen at a time.

          The panes are NOT unmounted when hidden — `display:none` keeps both
          in the tree, so switching tabs cannot lose the chat's scroll position,
          an in-flight response, or anything typed into the composer. */}
      <div className="flex shrink-0 border-b border-gray-200 bg-surface lg:hidden">
        {[
          { id: "chat", label: "Chat" },
          { id: "preview", label: "Preview" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobilePane(tab.id)}
            className={`flex-1 basis-0 py-3 text-sm font-semibold transition-colors ${
              mobilePane === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
            aria-pressed={mobilePane === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      {/* splitRef measures the space the two panes share, so the drag can't push
          the chat panel past what the preview needs. */}
      <div ref={splitRef} style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── Chat panel ── */}
        {/* chatPaneProps.style carries the dragged width (plus the min-width and
            the flex rules that stop the flexbox resizing it on its own). Drag it
            with the <PaneResizer /> further down.
            Below `lg` that dragged width is deliberately NOT applied: the pane
            goes full-width instead. The saved value is still read on mount and
            never written while here (no resizer is rendered to drag), so the
            desktop setting survives a visit on a phone untouched. */}
        <div
          style={{
            ...(isDesktopSplit ? chatPaneProps.style : { width: "100%", flex: 1, minWidth: 0 }),
            display: isDesktopSplit || mobilePane === "chat" ? "flex" : "none",
            flexDirection: "column",
            background: "var(--color-surface)",
            // Anchors the history overlay, which insets itself below the header.
            position: "relative",
          }}
        >
          {/* ── Header ── */}
          <header className="px-5"
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "0.5px solid var(--color-gray-200)",
              background: "var(--color-surface)",
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            {/* back */}
            <button
              onClick={() => router.back()}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "0.5px solid var(--color-gray-200)",
                background: "var(--color-gray-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-gray-500)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              // Hover paints a TRANSLUCENT accent tint rather than the config's
              // `colorLight` hex (#eff6ff and friends). Those are opaque pastels
              // — a near-white block on the dark header. A 12% wash of the same
              // accent reads on either surface, and matches the type icon tile
              // immediately to the right, which already tints this way.
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${colorRgb},0.12)`;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-gray-100)";
                e.currentTarget.style.color = "var(--color-gray-500)";
              }}
            >
              <ArrowLeft style={{ width: 13, height: 13 }} />
            </button>

            {/* type icon */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `rgba(${colorRgb},0.12)`,
                border: `0.5px solid rgba(${colorRgb},0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 14, height: 14, color }} strokeWidth={1.8} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-gray-900)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {config.label}
              </p>
              <p style={{ fontSize: 10, color: "var(--color-gray-400)", margin: 0 }}>
                Powered by CreativeKlux AI
              </p>
            </div>

            {/* saved chats */}
            <button
              onClick={toggleHistory}
              aria-label="Recent chats"
              aria-pressed={historyOpen}
              title="Recent chats"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: historyOpen
                  ? `0.5px solid rgba(${colorRgb},0.35)`
                  : "0.5px solid var(--color-gray-200)",
                background: historyOpen
                  ? `rgba(${colorRgb},0.12)`
                  : "var(--color-gray-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: historyOpen ? color : "var(--color-gray-500)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${colorRgb},0.12)`;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={(e) => {
                if (historyOpen) return;
                e.currentTarget.style.background = "var(--color-gray-100)";
                e.currentTarget.style.color = "var(--color-gray-500)";
              }}
            >
              <History style={{ width: 13, height: 13 }} />
            </button>

            {/* status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                marginLeft: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 10, color: "var(--color-gray-400)" }}>Online</span>
            </div>
          </header>

          {/* messages */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "18px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              scrollbarWidth: "thin",
              // A black-alpha thumb is invisible on the dark panel; gray-300 tracks
          // the theme and stays subtle in light.
          scrollbarColor: "var(--color-gray-300) transparent",
            }}
          >
            {messages.map((msg, i) => (
              <AiChatMessage key={i} message={msg} config={config} />
            ))}
            {/* One indicator for the whole wait. `isLoading` is cleared in the
                send handler's `finally`, which runs AFTER maybeCreateDesign
                resolves, so the dots stay up through the template fetch and the
                redesign rather than stopping when the reply text lands. The
                label names whichever phase is running — see the component. */}
            {isLoading && (
              <AiChatTypingIndicator
                config={config}
                // The SAME source the preview banner reads, so the chat and the
                // pane always name the same step.
                label={STAGE_LABEL[createStage] || null}
              />
            )}
            <div ref={messagesEndRef} />
          </main>

          {/* input */}
          <div
            style={{
              padding: "10px 12px 14px",
              background: "var(--color-surface)",
              borderTop: "0.5px solid var(--color-gray-200)",
              flexShrink: 0,
            }}
          >
            <AiChatInput
              onSend={handleSend}
              isLoading={isLoading}
              placeholder={config.placeholder}
              config={config}
            />
          </div>

          {/* ── Saved chats (overlays the messages, keeps the header) ── */}
          <ChatHistoryPanel
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            sessions={sessions}
            loading={sessionsLoading}
            error={sessionsError}
            activeSessionId={activeSessionId}
            openingId={openingSessionId}
            onSelect={handleOpenSession}
            onRefresh={loadSessions}
            accent={config}
          />
        </div>

        {/* ── Drag handle ── (also the divider between the two panes)
            Only exists when there IS a split to resize. Its absence below `lg`
            is what guarantees the saved pane width is never rewritten there. */}
        {isDesktopSplit && (
          <PaneResizer
            {...resizerProps}
            label="Resize the chat panel"
            accentRgb={colorRgb}
          />
        )}

        {/* ── Preview panel ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: isDesktopSplit || mobilePane === "preview" ? "flex" : "none",
            flexDirection: "column",
            // The recessed layer BEHIND the floating preview card, so it takes
            // --color-page (the app's page background) rather than a flat grey.
            // That keeps it a step darker than the card in both themes.
            background: "var(--color-page)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* preview header */}
          {/* <div
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#b0b0b0",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Preview
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                background: previewResult
                  ? `rgba(${colorRgb},0.1)`
                  : "rgba(0,0,0,0.05)",
                color: previewResult ? color : "#b0b0b0",
                border: `0.5px solid ${previewResult ? `rgba(${colorRgb},0.25)` : "transparent"}`,
                fontWeight: 500,
                transition: "all 0.3s",
              }}
            >
              {createStage
                ? STAGE_LABEL[createStage]
                : previewResult?.type === "templates"
                  ? `${previewResult.templates.length} templates`
                  : previewResult
                    ? "Generated"
                    : "Waiting for input"}
            </span>
          </div> */}

          {/* preview body */}
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >


            <PreviewPanel
              result={previewResult}
              config={config}
              creativeType={creativeType}
              selectedDesigns={selectedDesigns}
              setSelectedDesigns={setSelectedDesigns}
              onToggleSelect={toggleDesignSelection}
              saveDesign={saveDesign}
              activeBrandId={activeBrandId}
              showToast={showToast}
              stage={createStage}
              expectedCount={expectedCount}
              onPickTemplate={handlePickTemplate}
              selectedTemplateId={selectedTemplate?.id || null}
            />

          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        isOpen={toast.open}
        onClose={closeToast}
         type={toast.type}
      />

    </div>


  );
}