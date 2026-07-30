"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles, ArrowLeft, Tv2, Share2, Palette, Wand2,
  CheckCircle2, ImageIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AiChatMessage from "@/app/(components)/studio/AiChatMessage";
import AiChatInput from "@/app/(components)/studio/AiChatInput";
import AiChatTypingIndicator from "@/app/(components)/studio/AiChatTypingIndicator";
import AiPreviewIdle from "@/app/(components)/studio/AiPreviewIdle";
import PaneResizer, { useResizablePane } from "@/app/(components)/studio/PaneResizer";
import {
  buildTemplateQuery,
  normalizeDesignTemplate,
} from "@/app/(components)/studio/designTemplates";
import Toast from "@/app/(components)/Toast";
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

/* ─── PreviewLoading ───────────────────────────────────────────
   Shown while templates are being fetched, so the pane never falls back to the
   idle state mid-request and look like nothing happened.
──────────────────────────────────────────────────────────────── */
function PreviewLoading({ config, label }) {
  const { color, colorRgb } = config;
  return (
    <div
      style={{
        position: "absolute",
        inset: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `2.5px solid rgba(${colorRgb},0.18)`,
          borderTopColor: color,
          animation: "ck-spin 0.8s linear infinite",
          display: "inline-block",
        }}
      />
      <p style={{ fontSize: 12, color: "#8b8b8b", margin: 0 }}>{label}</p>
      <style>{`@keyframes ck-spin { to { transform: rotate(360deg); } }`}</style>
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
        background: "#fff",
        borderRadius: 14,
        border: "0.5px solid rgba(0,0,0,0.08)",
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
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
                border: isSelected
                  ? `2px solid ${color}`
                  : "1px solid #e5e7eb",
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
                    color: "#111",
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
                    color: "#94a3b8",
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
          borderTop: "0.5px solid rgba(0,0,0,0.08)",
          fontSize: 11,
          color: "#6b6b6b",
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
  templatesLoading,
  onPickTemplate,
  selectedTemplateId, }) {
  const { colorRgb, colorLight } = config;

  if (templatesLoading) {
    return <PreviewLoading config={config} label="Finding matching templates…" />;
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
        background: "#fff",
        borderRadius: 14,
        border: "0.5px solid rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "ck-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >

      {selectedDesigns?.length > 0 && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "#fff",
            padding: "10px 12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderBottom: "1px solid #eee",
            transform: "translateY(-10px)",
            animation: "slideDown 0.25s ease forwards",
          }}
        >
          <button className="hover:scale-95"
            onClick={async () => {
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
            }}
            style={{
              background: "#22c55e",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save {selectedDesigns.length} design
            {selectedDesigns.length > 1 ? "s" : ""}
          </button>

          <button className="hover:scale-95"
            onClick={() => setSelectedDesigns([])}
            style={{
              background: "#f3f4f6",
              color: "#111",
              border: "1px solid #e5e7eb",
              padding: "8px 10px",
              borderRadius: 10,
              fontSize: 12,
              cursor: "pointer",
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
          scrollbarColor: "rgba(0,0,0,0.08) transparent",
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
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#fff",
                      border: isSelected ? "2px solid #22c55e" : "1px solid #e5e7eb",
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
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.3 }}>
                          {v.name}
                        </p>
                        <span style={{
                          fontSize: 8.5,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background: "rgba(0,0,0,0.05)",
                          color: "#666",
                          whiteSpace: "nowrap",
                          marginLeft: 6,
                          flexShrink: 0,
                        }}>
                          {v.category}
                        </span>
                      </div>

                      {/* headline */}
                      {v.copy?.headline && (
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", lineHeight: 1.35 }}>
                          {v.copy.headline}
                        </p>
                      )}

                      {/* tagline */}
                      {v.copy?.tagline && (
                        <p style={{ fontSize: 9.5, color: "#64748b", margin: "0 0 6px", lineHeight: 1.4, fontStyle: "italic" }}>
                          {v.copy.tagline}
                        </p>
                      )}

                      {/* body */}
                      {v.copy?.body && (
                        <p style={{
                          fontSize: 9,
                          color: "#94a3b8",
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
                          <span style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: "#0f172a",
                            color: "#fff",
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
      </div>

      {/* ── footer ── */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: "0.5px solid rgba(0,0,0,0.08)",
          fontSize: 11,
          color: "#6b6b6b",
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
  const { creativeAiChat, saveDesign, activeBrand, activeBrandId, fetchDesignTemplates } =
    useAuth();

  const creativeType = searchParams.get("creative") || "general";
  const config = CREATIVE_CONFIG[creativeType] || CREATIVE_CONFIG.general;
  const Icon = config.icon;
  const { color, colorRgb, colorLight } = config;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  // True while /design-templates/public-fetch is in flight, so the preview pane
  // can show a spinner instead of sitting on the idle state.
  const [templatesLoading, setTemplatesLoading] = useState(false);
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

  const initialMessage = searchParams.get("initialMessage") || "";
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

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setPreviewResult(null);

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
  }, [creativeType, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /**
   * Inspect a chat reply and, when the assistant signals it has everything it
   * needs (`type: "create"`), pull the matching design templates.
   *
   * Declared ahead of the send handlers because both call it. Failures surface
   * on the toast and leave the preview pane untouched — a template miss must
   * never break the conversation itself.
   *
   * @param {object} data The parsed chat response body.
   */
  const maybeFetchTemplates = useCallback(
    async (data) => {
      if (data?.type !== "create") return;

      const query = buildTemplateQuery(data);
      if (!query) return; // reply lacked a platform/size — already warned

      console.log("🎨 [chat] create signal received, fetching templates:", query);
      setTemplatesLoading(true);
      try {
        const res = await fetchDesignTemplates(query);

        if (!res?.ok) {
          console.error(
            "❌ [chat] template fetch failed:",
            res?.messageForDevs || res?.message,
          );
          showToast(res?.message || "Couldn't load design templates.", "error");
          return;
        }

        const templates = (Array.isArray(res.data) ? res.data : [])
          .map(normalizeDesignTemplate)
          .filter(Boolean);

        if (!templates.length) {
          console.warn("⚠️ [chat] no usable templates for", query);
          showToast(
            `No templates found for ${query.category} at ${query.type_size}.`,
            "error",
          );
          return;
        }

        console.log(`✅ [chat] ${templates.length} template(s) ready`);
        setPreviewResult({ type: "templates", templates, time: nowTime() });
      } catch (err) {
        console.error("❌ [chat] template fetch threw:", err);
        showToast("Couldn't load design templates. Please try again.", "error");
      } finally {
        setTemplatesLoading(false);
      }
    },
    [fetchDesignTemplates],
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
        const result = await creativeAiChat({
          message: content,
          brandId: activeBrandId,
          images,
          logo: activeBrand?.logo,
          model,
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

        const designType = result.data?.type;
        const designVars = result.data?.variations;

        if (designType === "design" && Array.isArray(designVars) && designVars.length) {
          setPreviewResult({ type: "design", variations: designVars, time: nowTime() });
        }

        // The assistant has everything it needs → pull matching templates.
        await maybeFetchTemplates(result.data);
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
    [creativeAiChat, activeBrandId, activeBrand?.logo, model, maybeFetchTemplates]
  );

  const handleInitialSend = useCallback(async (content, images = []) => {
    setIsLoading(true);

    try {
      const result = await creativeAiChat({
        message: content,
        brandId: activeBrandId,
        images,
        logo: activeBrand?.logo,
        model,
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

      const designType = result.data?.type;
      const designVars = result.data?.variations;

      if (designType === "design" && Array.isArray(designVars) && designVars.length) {
        setPreviewResult({ type: "design", variations: designVars, time: nowTime() });
      }

      // The assistant has everything it needs → pull matching templates.
      await maybeFetchTemplates(result.data);

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
  }, [creativeAiChat, activeBrandId, activeBrand?.logo, model, maybeFetchTemplates]);

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
    <div className="pt-16 h-full"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >


      {/* ── Body ── */}
      {/* splitRef measures the space the two panes share, so the drag can't push
          the chat panel past what the preview needs. */}
      <div ref={splitRef} style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Chat panel ── */}
        {/* chatPaneProps.style carries the dragged width (plus the min-width and
            the flex rules that stop the flexbox resizing it on its own). Drag it
            with the <PaneResizer /> further down. */}
        <div
          style={{
            ...chatPaneProps.style,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
          }}
        >
          {/* ── Header ── */}
          <header className="px-5"
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              background: "#fff",
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
                border: "0.5px solid rgba(0,0,0,0.1)",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colorLight;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.color = "#888";
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
                  color: "#0f0f0f",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {config.label}
              </p>
              <p style={{ fontSize: 10, color: "#b0b0b0", margin: 0 }}>
                Powered by CreativeKlux AI
              </p>
            </div>

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
              <span style={{ fontSize: 10, color: "#b0b0b0" }}>Online</span>
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
              scrollbarColor: "rgba(0,0,0,0.08) transparent",
            }}
          >
            {messages.map((msg, i) => (
              <AiChatMessage key={i} message={msg} config={config} />
            ))}
            {isLoading && <AiChatTypingIndicator config={config} />}
            <div ref={messagesEndRef} />
          </main>

          {/* input */}
          <div
            style={{
              padding: "10px 12px 14px",
              background: "#fff",
              borderTop: "0.5px solid rgba(0,0,0,0.07)",
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
        </div>

        {/* ── Drag handle ── (also the divider between the two panes) */}
        <PaneResizer
          {...resizerProps}
          label="Resize the chat panel"
          accentRgb={colorRgb}
        />

        {/* ── Preview panel ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            background: "#f5f5f5",
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
              {templatesLoading
                ? "Loading templates"
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
              templatesLoading={templatesLoading}
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