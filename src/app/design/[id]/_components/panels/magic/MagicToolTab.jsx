"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Layers,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { getMagicConfig } from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";
import useMagicHistory from "@/app/(dashboard)/(pages)/magic-studio/useMagicHistory";
import useMagicGenerate from "@/app/(components)/magic-studio/useMagicGenerate";
import {
  OptionPanelBody,
  summarize,
} from "@/app/(components)/magic-studio/magicPanelUI";
import { resolveMediaUrl } from "@/(lib)/magic-studio-api";
import { useIsCompact } from "@/utils/useMediaQuery";
import useMediaInsert from "../uploads/useMediaInsert";
import MagicHistoryList from "./MagicHistoryList";
import MagicOptionDropdown from "./MagicOptionDropdown";

/**
 * MagicToolTab — one LIVE Magic Studio tool inside the editor's Magic Studio
 * panel (Images / Variations / Persona).
 *
 * It is the editor's own shell around the SAME machine the /magic-studio page
 * runs on: the per-tool config (MAGIC_STUDIO_CONFIGS → prompt copy, option cards,
 * validation, payload + POST /magic-studio/generate), the generate orchestrator
 * (useMagicGenerate) and the backend history (useMagicHistory → POST
 * /magic-studio/history). Nothing shared is modified, so the Magic Studio page
 * and the Add Media picker are untouched — a result generated here shows up in
 * their history too.
 *
 * What's editor-specific:
 *   • Two views — Generate (default) and History — instead of the picker's
 *     collapsible history section.
 *   • A finished generation goes straight onto the canvas, centred and on top,
 *     exactly like an imported image; a batch cascades so the images don't hide
 *     each other. It also lands in History immediately, but the view does NOT
 *     flip — the user chooses when to look.
 *   • Image-to-Variations can take its source from the image currently selected
 *     on the canvas, not just a device upload.
 *
 * Props: { toolId, insert, editor }
 */

// Persona can produce text / image / video. Only an image has anywhere to go on
// a design, so this tab locks the content type rather than offering a choice
// that would generate something the canvas can't hold.
const PERSONA_CONTENT_TYPE = "image";

const VIEWS = [
  { id: "generate", label: "Generate" },
  { id: "history", label: "History" },
];

/**
 * Pull a hosted URL out of an uploadMedia() response — the shape varies by
 * endpoint, and a bare S3 key has to be resolved against the CDN. Mirrors
 * pickHostedUrl in src/app/(components)/magic-studio/MagicTabPanel.jsx.
 */
const pickHostedUrl = (data) => {
  const d = data?.data || data || {};
  return (
    resolveMediaUrl(d.image_url) ||
    resolveMediaUrl(d.url) ||
    resolveMediaUrl(d.file_url) ||
    resolveMediaUrl(d.s3_key) ||
    resolveMediaUrl(data?.image_url) ||
    resolveMediaUrl(data?.url) ||
    null
  );
};

const isHosted = (src) => typeof src === "string" && /^https?:\/\//i.test(src);

export default function MagicToolTab({ toolId, insert, editor }) {
  const { token, uploadMedia, activeBrand } = useAuth();
  const config = getMagicConfig(toolId);
  // Below `lg` the whole sidebar is a bottom sheet, so an option flying out over
  // the canvas has nowhere to go — those layouts expand the row in place.
  const isCompact = useIsCompact();
  // The editor's one rule for what a media result may do: images go on the
  // canvas, everything else says why it can't (shared with the uploads panel).
  const { pick } = useMediaInsert({ insert });

  const [view, setView] = useState("generate");
  const [openOption, setOpenOption] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [imageInput, setImageInput] = useState(null); // { url, preview, objectUrl? }
  const [preparingImage, setPreparingImage] = useState(false);
  const fileRef = useRef(null);
  // Option row → its button element, so the desktop dropdown knows what to
  // anchor itself to.
  const optionRefs = useRef({});

  // Option values seeded from each option's default (+ the persona sub-fields).
  const [values, setValues] = useState(() => {
    const seed = {};
    (config?.options || []).forEach((o) => (seed[o.key] = o.default));
    if (config?.input === "persona") {
      seed.contentType = PERSONA_CONTENT_TYPE;
      seed.personaName = "";
      seed.personaAge = "";
      seed.personaOccupation = "";
      seed.personaTone = "";
    }
    return seed;
  });
  const setValue = (key, val) => setValues((p) => ({ ...p, [key]: val }));

  // Release the source image's local preview when it's replaced or the tab is
  // switched away (MagicMediaPanel remounts this component per tool).
  useEffect(
    () => () => {
      if (imageInput?.objectUrl) URL.revokeObjectURL(imageInput.objectUrl);
    },
    [imageInput],
  );

  // History is a backend feature and needs auth; the editor is behind
  // ProtectedRoute, so this is really a belt-and-braces guard.
  const history = useMagicHistory(token ? config?.historyTool : null, {
    enabled: !!token,
  });

  /**
   * A finished generation: every image lands on the canvas (cascaded so a batch
   * stays readable), then history refreshes in the background. Anything that
   * isn't an image can't be placed — say so rather than dropping it silently.
   */
  const handleResult = (res) => {
    const images = (res?.assets || []).filter((a) => a?.type === "image" && a?.src);
    images.forEach((a, i) => insert?.imageUrl?.(a.src, { offsetIndex: i }));
    if (images.length) {
      console.log(
        `🖼️ [magic:${toolId}] placed ${images.length} result(s) on the canvas`,
      );
    } else if (res?.assets?.length || res?.text) {
      toast.info(
        "That result isn't an image, so it can't go on the design — open History to download it.",
      );
    }
    history.refresh();
  };

  const magic = useMagicGenerate({
    config,
    // `false` deliberately. With usesHistory the shared hook swallows the result
    // and only refreshes history — but here the result IS the point, it has to
    // reach the canvas. So we take it through onResult and refresh history
    // ourselves, which also keeps the view from jumping to History.
    usesHistory: false,
    history: null,
    tts: null,
    stt: null,
    onResult: handleResult,
  });

  const primaryInput = useMemo(() => {
    switch (config?.input) {
      case "prompt":
        return textInput;
      case "image":
        return imageInput?.url || null;
      default:
        return null; // persona reads values.*
    }
  }, [config, textInput, imageInput]);

  if (!config) {
    return <p className="p-4 text-sm text-gray-400">Unknown tool.</p>;
  }

  const ic = config.inputConfig || {};
  // Showing a wait for a run this panel started, OR one history says is still
  // going — a generation outlives the panel that asked for it, so closing the
  // sidebar or reloading the editor mid-run should find the wait still there.
  // See useMagicHistory's `pending`.
  const waiting = magic.generating || history.pending.length > 0;
  // The locked persona content type isn't a choice here, so it isn't a row.
  const optionRows = (config.options || []).filter(
    (o) => !(config.input === "persona" && o.key === "contentType"),
  );
  const busy = magic.generating || preparingImage;
  const openOptionConfig = optionRows.find((o) => o.key === openOption) || null;

  // The chooser itself is identical in both homes (inline row vs desktop
  // dropdown) — only where it's mounted differs.
  const renderOptionBody = (option) => (
    <OptionPanelBody
      option={option}
      value={values[option.key]}
      onSelect={(val, opts) => {
        setValue(option.key, val);
        // See OptionPanelBody — a colour drag or a hex being typed fires this
        // continuously and must not collapse the row it is being typed into.
        if (!opts?.keepOpen) setOpenOption(null);
      }}
    />
  );

  // ── Source image (Image to Variations) ─────────────────────────────────────
  // The backend needs a hosted `source_image` URL, so anything local (a device
  // file, or a canvas image still held as a data URL) is uploaded first.
  const hostFile = async (file, loadingLabel) => {
    const t = toast.loading(loadingLabel);
    try {
      const data = await uploadMedia(file);
      const hosted = pickHostedUrl(data);
      if (!hosted) throw new Error("Upload succeeded but no URL came back.");
      toast.success("Image ready", { id: t });
      return hosted;
    } catch (err) {
      console.error("❌ [magic] source image upload failed:", err);
      toast.error(err?.message || "Couldn't prepare that image.", { id: t });
      return null;
    }
  };

  const clearImage = () => {
    if (imageInput?.objectUrl) URL.revokeObjectURL(imageInput.objectUrl);
    setImageInput(null);
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreparingImage(true);
    const hosted = await hostFile(file, "Uploading image…");
    setPreparingImage(false);
    if (!hosted) {
      URL.revokeObjectURL(objectUrl);
      return;
    }
    clearImage();
    setImageInput({ url: hosted, preview: objectUrl, objectUrl });
  };

  const selectedEl = editor?.selectedElement;
  const selectedImageSrc =
    selectedEl?.type === "image" && selectedEl?.src ? selectedEl.src : null;

  const useSelectedAsSource = async () => {
    if (!selectedImageSrc) return;
    // Already hosted (a saved design's images are CDN URLs) → use it as-is.
    if (isHosted(selectedImageSrc)) {
      clearImage();
      setImageInput({ url: selectedImageSrc, preview: selectedImageSrc });
      return;
    }
    // A data:/blob: image the user just dropped in isn't reachable by the
    // backend yet — push it to the gallery to get a URL.
    setPreparingImage(true);
    try {
      const blob = await fetch(selectedImageSrc).then((r) => r.blob());
      const type = blob.type || "image/png";
      const ext = type.split("/")[1] || "png";
      const file = new File([blob], `canvas-image.${ext}`, { type });
      const hosted = await hostFile(file, "Preparing that image…");
      if (hosted) {
        clearImage();
        setImageInput({ url: hosted, preview: selectedImageSrc });
      }
    } catch (err) {
      console.error("❌ [magic] couldn't read the selected image:", err);
      toast.error("Couldn't read the selected image. Try uploading it instead.");
    } finally {
      setPreparingImage(false);
    }
  };

  // ── Inspire ────────────────────────────────────────────────────────────────
  const handleInspire = () => {
    const list = ic.inspire;
    if (!list?.length) return;
    const roll = list[Math.floor(Math.random() * list.length)];
    if (config.input === "persona") {
      setValue("personaName", roll.name);
      setValue("personaOccupation", roll.occupation);
      setValue("personaTone", roll.tone);
      return;
    }
    setTextInput(roll);
  };

  const handleGenerate = () => {
    if (busy) return;
    console.log(`✨ [magic:${toolId}] generating…`);
    magic.generate({ primaryInput, values, activeBrand });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Generate ↔ History. Generating never switches the view — a finished
          result is already on the canvas, and History is there when wanted. */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {VIEWS.map((v) => {
          const on = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                on
                  ? "bg-surface text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v.label}
              {v.id === "history" && waiting && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
              {v.id === "history" && !waiting && history.items.length > 0 && (
                <span className="text-[10px] font-medium text-gray-400">
                  ({history.items.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {view === "history" ? (
        <MagicHistoryList
          items={history.items}
          loading={history.loading}
          generating={waiting}
          removingId={history.removingId}
          onDelete={history.remove}
          onPick={(item) => pick(item.type, item.url)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Primary input ── */}
          {config.input === "prompt" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500">
                {ic.label}
              </label>
              <div className="relative">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={ic.placeholder}
                  rows={5}
                  maxLength={ic.maxLength}
                  className="hide-scrollbar w-full resize-none rounded-xl border border-gray-200 p-3 pb-9 text-sm text-gray-700 placeholder:text-xs placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {ic.inspire?.length > 0 && (
                  <button
                    onClick={handleInspire}
                    className="absolute bottom-2.5 left-2.5 rounded-lg border border-gray-200 bg-surface px-2.5 py-1 text-[11px] font-semibold text-gray-500 transition hover:border-blue-400 hover:text-blue-600 cursor-pointer"
                  >
                    ✨ Inspire me
                  </button>
                )}
                {ic.maxLength && (
                  <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                    {textInput.length}/{ic.maxLength}
                  </span>
                )}
              </div>
            </div>
          )}

          {config.input === "image" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500">
                {ic.label}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleImageFile(file);
                }}
              />

              {imageInput ? (
                <div className="relative overflow-hidden rounded-xl border-2 border-blue-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageInput.preview}
                    alt="Source"
                    className="h-32 w-full object-cover"
                  />
                  <button
                    onClick={clearImage}
                    title="Remove"
                    aria-label="Remove source image"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={preparingImage}
                  className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-6 text-sm text-gray-500 transition hover:border-blue-400 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {preparingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span className="font-semibold text-blue-600">
                    {preparingImage ? "Preparing…" : "Upload an image"}
                  </span>
                  <span className="px-4 text-center text-[11px] text-gray-400">
                    {ic.helper || "Choose an image from your device."}
                  </span>
                </button>
              )}

              {/* Straight from the design: whatever image is selected on the
                  canvas can be the source in one click. */}
              <button
                onClick={useSelectedAsSource}
                disabled={!selectedImageSrc || preparingImage}
                title={
                  selectedImageSrc
                    ? "Use the image selected on the canvas"
                    : "Select an image on the canvas first"
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                Use selected image
              </button>
            </div>
          )}

          {config.input === "persona" && (
            <PersonaFields
              ic={ic}
              values={values}
              setValue={setValue}
              onInspire={handleInspire}
            />
          )}

          {/* ── Option rows — the same cards/ratios the Magic Studio page uses.
              On desktop the chooser flies out beside the row (MagicOptionDropdown),
              which is the only way the 340px card grid fits next to a 300px
              column. Compact layouts expand it in place instead, two per row —
              three would leave the cards too narrow to read on a phone. ── */}
          {optionRows.map((option) => {
            const open = openOption === option.key;
            return (
              <div
                key={option.key}
                className="overflow-hidden rounded-xl bg-gray-100"
              >
                <button
                  ref={(el) => {
                    optionRefs.current[option.key] = el;
                  }}
                  onClick={() =>
                    setOpenOption((prev) => (prev === option.key ? null : option.key))
                  }
                  className="flex w-full items-center justify-between px-3 py-2.5 text-xs transition hover:bg-gray-200/70 cursor-pointer"
                >
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                    {summarize(option, values[option.key])}
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {open && isCompact && (
                  // `[&>div]:grid-cols-2` overrides the shared body's own column
                  // count (2/3 by viewport) without forking it — the child
                  // selector outranks its utility class, so cards, ratios and
                  // lists all land two-up here.
                  <div className="max-h-64 overflow-y-auto border-t border-gray-200 bg-surface [&>div]:grid-cols-2">
                    {renderOptionBody(option)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Desktop chooser — anchored to the open row, floating over the canvas. */}
          {!isCompact && openOptionConfig && (
            <MagicOptionDropdown
              anchorRefs={optionRefs}
              anchorKey={openOptionConfig.key}
              width={openOptionConfig.width || 340}
              onClose={() => setOpenOption(null)}
            >
              {renderOptionBody(openOptionConfig)}
            </MagicOptionDropdown>
          )}

          {magic.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {magic.error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {magic.generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {config.generateLabel}
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            Results drop straight onto your design and are saved to History.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * PersonaFields — name / age / occupation / tone, the four things the persona
 * payload needs. A compact take on the Magic Studio form for the sidebar's
 * width; the option data (age groups, occupations, tones) still comes from the
 * shared config so the choices stay identical across surfaces.
 */
function PersonaFields({ ic, values, setValue, onInspire }) {
  const input =
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const chip = (active) =>
    `rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
      active
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">
            Persona name
          </label>
          <input
            value={values.personaName}
            onChange={(e) => setValue("personaName", e.target.value)}
            placeholder="e.g. Jane Doe"
            className={input}
          />
        </div>
        <button
          onClick={onInspire}
          className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-2 text-[11px] font-semibold text-gray-500 transition hover:border-blue-400 hover:text-blue-600 cursor-pointer"
        >
          ✨ Inspire
        </button>
      </div>

      {ic.ageGroups && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">
            Age
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {ic.ageGroups.map((a) => (
              <button
                key={a.value}
                onClick={() => setValue("personaAge", a.value)}
                className={chip(values.personaAge === a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <input
            value={/^\d+$/.test(values.personaAge) ? values.personaAge : ""}
            onChange={(e) => setValue("personaAge", e.target.value)}
            placeholder="Or exact age (e.g. 32)"
            className={input}
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">
          Occupation
        </label>
        <input
          value={values.personaOccupation}
          onChange={(e) => setValue("personaOccupation", e.target.value)}
          placeholder="e.g. Marketing Manager"
          className={`${input} mb-2`}
        />
        {ic.occupations && (
          <div className="flex flex-wrap gap-1.5">
            {ic.occupations.slice(0, 6).map((o) => (
              <button
                key={o}
                onClick={() => setValue("personaOccupation", o)}
                className={chip(values.personaOccupation === o)}
              >
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {ic.tones && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">
            Communication tone
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ic.tones.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setValue("personaTone", t.value)}
                  className={`flex items-center gap-1.5 ${chip(values.personaTone === t.value)}`}
                >
                  {Icon && <Icon className="h-3 w-3 shrink-0" />}
                  {t.value}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
