"use client";

// app/(components)/composer/CreatePostComposer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Create new post" screen — a full-screen composer modelled on Metricool's:
//
//   ┌ Create new post  [brand]                                     ✕ Close ┐
//   │ ┌ (fb)(ig)(+) ───────────────────────┐ ┌ Preview ─────────────────┐ │
//   │ │ text editor          [img] 23/280 │ │ (fb)(ig)  network tabs    │ │
//   │ │ media thumbnail                    │ │ ┌ post as it will look ┐ │ │
//   │ │ ▸ Facebook settings                │ │ └──────────────────────┘ │ │
//   │ │ ▲ 2 errors                         │ │ ⓘ previews approximate   │ │
//   │ │ Cancel              [Publish now ▾]│ │                          │ │
//   │ └────────────────────────────────────┘ └──────────────────────────┘ │
//
// REUSABLE BY DESIGN — it fetches the brand's connections itself and posts
// through the shared integration helpers (see composerPlatforms.js), so a host
// only renders it and listens for the result:
//
//   <CreatePostComposer
//     isOpen={open}
//     onClose={() => setOpen(false)}
//     onPublished={() => reloadPosts()}
//     initialText="…"                       // optional
//     initialMedia={{ url, type: "image" }} // optional, already hosted
//     initialPlatforms={["facebook"]}       // optional
//   />
//
// State lives in an inner component that only mounts while open, so every
// opening starts from a clean draft without any reset effects.
//
// What it does NOT do yet, deliberately: scheduling (the publishing API only
// posts now — PublishModal and the integration helpers refuse a time rather
// than silently posting immediately), drafts, and more than one media file
// (each publish helper takes a single image_url / video_url).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Info,
  Loader2,
  Monitor,
  Pencil,
  Smartphone,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { uploadForPublish } from "@/(lib)/creativesApi";
import { parseCopy, postFromCopy, str } from "@/(lib)/designCopy";
import { fetchPinterestBoards } from "@/(lib)/integration";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import PlatformPageModal from "@/app/(components)/integrations/PlatformPageModal";
import { useIntegrationCatalogue } from "@/app/(components)/integrations/useIntegrationCatalogue";
import { useIsHydrated } from "@/utils/useIsHydrated";
import PostPreview, { DesktopFrame, PhoneFrame } from "./PostPreview";
import MediaMenu from "./MediaMenu";
import FormatToolbar, { applyFormat } from "./FormatToolbar";
import { AltTextDialog, ManageFiles, MediaStrip, MediaViewer } from "./MediaAttachments";
import { AiTextTool, EmojiTool, HashtagTool, LinkTool, SavedTextsTool } from "./ComposerTools";
import {
  COMPOSER_ORDER,
  COMPOSER_PLATFORMS,
  isComposable,
  postTypeOf,
  publishComposedPost,
  validatePost,
} from "./composerPlatforms";

const BRAND = "#003dda";

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(result: {published: string[], failed: string[]}) => void} [props.onPublished]
 *   Called once at least one network accepted the post.
 * @param {string} [props.initialText]
 * @param {{url: string, type: "image"|"video"}} [props.initialMedia]
 * @param {string[]} [props.initialPlatforms]
 * @param {Object<string, string>} [props.initialNetworkText] Text written for
 *   particular networks (a design's copy) — those start on their own text.
 * @param {Object<string, object>} [props.initialOptions] Per-network fields to
 *   start with, e.g. { youtube: { title } }.
 * @param {string} [props.aiTopic] Pre-fills the AI text generator's topic —
 *   e.g. the prompt the attached media was generated from.
 */
export default function CreatePostComposer({ isOpen, ...props }) {
  const hydrated = useIsHydrated();
  if (!hydrated || !isOpen) return null;
  return createPortal(<ComposerScreen {...props} />, document.body);
}

/** A network's round icon — filled when selected, grey when not. */
function NetworkIcon({ platform, active = true, size = 36 }) {
  const meta = COMPOSER_PLATFORMS[platform];
  if (!meta) return null;
  const { Icon, color } = meta;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full transition-colors"
      style={{
        width: size,
        height: size,
        background: active ? color : "var(--color-gray-200)",
      }}
    >
      <Icon style={{ color: active ? "#fff" : "var(--color-gray-400)", fontSize: size * 0.48 }} />
    </span>
  );
}

/**
 * Metricool's type pill next to a network's icon — "POST ⌄" — and its menu:
 * each type with its icon, a one-line description and a check on the current
 * one. Only for networks with `types` (Facebook, Instagram, YouTube).
 */
function PostTypePill({ platform, value, onChange, disabled, mediaType }) {
  const types = COMPOSER_PLATFORMS[platform]?.types;
  const [open, setOpen] = useState(false);
  if (!types?.length) return null;
  const current = types.find((t) => t.id === value) || types[0];
  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${COMPOSER_PLATFORMS[platform].label} post type: ${current.label}`}
        className={`flex h-6 cursor-pointer items-center gap-0.5 rounded-full px-2 text-[10px] font-bold uppercase tracking-wide text-gray-800 transition-colors disabled:cursor-not-allowed ${
          open ? "bg-gray-300" : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        {current.label}
        <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-0 top-full z-40 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-surface py-1 shadow-xl"
          >
            {types.map((t) => {
              const on = t.id === current.id;
              // A video-only type (Reel, Short) can't carry the image attached
              const blocked = t.media === "video" && mediaType === "image";
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  disabled={blocked}
                  title={blocked ? `${t.label}s need a video` : undefined}
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    blocked
                      ? "cursor-not-allowed opacity-40"
                      : `cursor-pointer ${on ? "bg-gray-100" : "hover:bg-gray-50"}`
                  }`}
                >
                  <t.Icon className="h-5 w-5 shrink-0 text-gray-800" />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm text-gray-900 ${on ? "font-semibold" : ""}`}>{t.label}</span>
                    <span className="block text-xs text-gray-500">
                      {blocked ? "Needs a video — remove the image to use this" : t.description}
                    </span>
                  </span>
                  {on && <Check className="h-4 w-4 shrink-0 text-gray-800" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </span>
  );
}

/**
 * Pinterest's board: the boards the brand's pins are on, as one-click
 * choices, plus the ID box itself (a board with no pins yet is pasted in).
 */
function BoardField({ value, onChange, disabled, placeholder }) {
  const [boards, setBoards] = useState(null); // null = loading
  useEffect(() => {
    let alive = true;
    fetchPinterestBoards()
      .then((b) => alive && setBoards(b))
      .catch(() => alive && setBoards([]));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <span className="block space-y-2">
      {boards === null ? (
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Finding your boards…
        </span>
      ) : boards.length > 0 ? (
        <span className="flex flex-wrap gap-1.5">
          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(b.id)}
              title={`Board ${b.id}`}
              className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed ${
                value === b.id ? "border-[#003dda] bg-blue-50 text-[#003dda]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="block font-medium">{b.latest ? `“${b.latest}”` : `Board …${b.id.slice(-6)}`}</span>
              <span className="block text-[10px] text-gray-500">
                {b.pins} pin{b.pins === 1 ? "" : "s"} · …{b.id.slice(-6)}
              </span>
            </button>
          ))}
        </span>
      ) : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="numeric"
        className="h-9 w-full rounded-lg border border-gray-200 bg-surface px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-400"
      />
    </span>
  );
}

function ComposerScreen({
  onClose,
  onPublished,
  initialText = "",
  initialMedia = null,
  initialPlatforms = [],
  initialNetworkText = null,
  initialOptions = null,
  aiTopic = "",
}) {
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;

  // ── Connections ──────────────────────────────────────────────────────────
  // The same hook the Connections page uses: it reads the catalogue, runs the
  // server-side OAuth for a new connection, and drives the account chooser
  // (Facebook Page, Instagram account…). Connecting from the composer is
  // therefore exactly connecting from Connections — there is one way to do it.
  const notify = useCallback(
    (message, type) => (type === "error" ? toast.error(message) : toast.success(message)),
    [],
  );
  const catalogue = useIntegrationCatalogue({ notify });
  const loadingConnections = catalogue.loading;

  const connected = useMemo(
    () =>
      COMPOSER_ORDER.filter((p) => isComposable(p) && catalogue.byPlatform.get(p)?.connected),
    [catalogue.byPlatform],
  );
  // Networks the "+" panel offers: not connected yet, or waiting on an account
  // choice ("Finish connecting").
  const connectable = COMPOSER_ORDER.filter(
    (p) => isComposable(p) && !catalogue.byPlatform.get(p)?.connected,
  );
  const accountName = (platform) =>
    catalogue.byPlatform.get(platform)?.accountLabel || activeBrand?.name || "Your brand";

  // Which connected accounts the post goes to. Null until the user changes
  // it, and until then derived: what the host asked for, else EVERY connected
  // account (Metricool's default — switch off the ones you don't want).
  const [picked, setPicked] = useState(null);
  const platforms = picked
    ? connected.filter((p) => picked.includes(p))
    : initialPlatforms.some((p) => connected.includes(p))
      ? connected.filter((p) => initialPlatforms.includes(p))
      : connected;
  const setPlatforms = (next) =>
    setPicked((prev) => {
      const current = prev ? connected.filter((p) => prev.includes(p)) : platforms;
      return typeof next === "function" ? next(prev ?? current) : next;
    });

  // The "+" panel — connect more accounts without leaving the draft.
  const [connectOpen, setConnectOpen] = useState(false);
  const connectNetwork = async (platform) => {
    const row = catalogue.byPlatform.get(platform);
    if (row?.awaitingSelection) {
      await catalogue.openChooser(platform);
    } else {
      await catalogue.connect(platform);
    }
    // A new connection joins the post straight away.
    setPlatforms((prev) => (prev.includes(platform) ? prev : [...prev, platform]));
  };

  // ── Draft ────────────────────────────────────────────────────────────────
  // The shared ("template") text every network uses…
  const [text, setText] = useState(initialText);
  // …unless that network was edited on its own: { [platform]: string }. A
  // network with no entry follows the template; one with an entry has left it.
  // A design's copy can bring text written for particular networks — those
  // start on their own text, with the network tabs open so it shows.
  const [customText, setCustomText] = useState(() => ({ ...(initialNetworkText || {}) }));
  const textFor = (platform) => customText[platform] ?? text;
  // "Edit by network" mode and which tab of it is open ("template" | platform).
  const [editByNetwork, setEditByNetwork] = useState(
    () => Object.keys(initialNetworkText || {}).length > 0,
  );
  const [editTab, setEditTab] = useState("template");
  const followTemplate = (platform) =>
    setCustomText(({ [platform]: _dropped, ...rest }) => rest);
  const customiseFor = (platform) =>
    setCustomText((prev) => ({ ...prev, [platform]: prev[platform] ?? text }));
  // The attached files, in posting order:
  // { id, type, url (once hosted), previewUrl?, name?, alt?, uploading? }.
  // The first is what publishing sends (the API takes one — see MAX_MEDIA).
  const [mediaList, setMediaList] = useState(() =>
    initialMedia ? [{ ...initialMedia, id: "initial" }] : [],
  );
  const media = mediaList[0] || null;
  const uploading = mediaList.some((m) => m.uploading);
  const [options, setOptions] = useState(() => ({ ...(initialOptions || {}) })); // { [platform]: { title, link, … } }
  // Attachment screens: the Manage files view, the viewer, the alt-text dialog.
  const [manageOpen, setManageOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [altFor, setAltFor] = useState(null);

  // Object URLs of local files — released when their file goes and on close.
  const objectUrls = useRef(new Set());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const patchMedia = (id, patch) =>
    setMediaList((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  // A picked creative that carries copy: its description replaces the text —
  // every network's, so the new copy is what actually goes out.
  const applyCopy = (copy) => {
    const c = parseCopy(copy);
    const description = str(c.description) || postFromCopy(c).text;
    if (!description) return;
    setText(description);
    setCustomText({});
  };

  const handleFile = async (file, { copy } = {}) => {
    if (!file) return;
    const type = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("image/")
        ? "image"
        : null;
    if (!type) {
      toast.error("Pick an image or a video file.");
      return;
    }
    if (copy) applyCopy(copy);
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);
    const id = newId();
    // Shown straight away from the local file; publishable once hosted.
    setMediaList((list) => [...list, { id, type, previewUrl, name: file.name, url: null, uploading: true }]);
    try {
      console.log(`⬆️ [composer] uploading ${type} "${file.name}"`);
      const url = await uploadForPublish(file);
      if (!url) throw new Error("The upload didn't return a link.");
      patchMedia(id, { url, uploading: false });
    } catch (err) {
      console.error("❌ [composer] upload failed:", err);
      toast.error(err.message || "Upload failed. Please try again.");
      setMediaList((list) => list.filter((m) => m.id !== id));
    }
  };

  // Media that's already online (library, stock): nothing to upload.
  const pickHostedMedia = ({ copy, ...picked }) => {
    if (copy) applyCopy(copy);
    setMediaList((list) => [...list, { ...picked, id: newId() }]);
  };

  const removeMedia = (ids) => {
    const drop = new Set([].concat(ids));
    setMediaList((list) => {
      list
        .filter((m) => drop.has(m.id) && objectUrls.current.has(m.previewUrl))
        .forEach((m) => {
          URL.revokeObjectURL(m.previewUrl);
          objectUrls.current.delete(m.previewUrl);
        });
      return list.filter((m) => !drop.has(m.id));
    });
  };

  const moveMedia = (from, to) =>
    setMediaList((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const setOption = (platform, key, value) =>
    setOptions((prev) => ({ ...prev, [platform]: { ...prev[platform], [key]: value } }));

  // An image attached while a Reel / Short is chosen: fall back to the
  // network's default type, since the video-only types are greyed out.
  useEffect(() => {
    if (media?.type !== "image") return;
    setOptions((prev) => {
      let next = prev;
      for (const [platform, opts] of Object.entries(prev)) {
        if (postTypeOf(platform, opts)?.media !== "video") continue;
        next = { ...next, [platform]: { ...opts, post_type: COMPOSER_PLATFORMS[platform].types[0].id } };
      }
      return next;
    });
  }, [media?.type]);

  const togglePlatform = (platform) =>
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );

  // ── Validation ───────────────────────────────────────────────────────────
  // Networks that already took this post are done — they drop out of the
  // checks and the next publish, so a retry only goes where it failed.
  const [results, setResults] = useState({}); // { [platform]: {status, message} }
  const pending = platforms.filter((p) => results[p]?.status !== "done");
  const problems = validatePost({ text, textFor, media, mediaCount: mediaList.length, platforms: pending, options });
  const hasProblem = (platform) => problems.some((pr) => pr.platform === platform);
  const [errorsOpen, setErrorsOpen] = useState(true);

  // ── Preview ──────────────────────────────────────────────────────────────
  const [previewPick, setPreviewPick] = useState(null);
  const previewPlatform = platforms.includes(previewPick) ? previewPick : platforms[0];
  const [mobileTab, setMobileTab] = useState("edit"); // below lg: edit | preview
  // How the preview is framed: inside a phone, or as the desktop feed shows it.
  const [device, setDevice] = useState("phone"); // phone | desktop

  // ── Sections / menus ─────────────────────────────────────────────────────
  const [openSections, setOpenSections] = useState({});
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);

  // ── Close (with a discard check) ─────────────────────────────────────────
  const dirty = !!text.trim() || mediaList.length > 0 || Object.keys(customText).length > 0;
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const requestClose = () => {
    if (publishing) return;
    if (dirty) setConfirmDiscard(true);
    else onClose?.();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (publishMenuOpen) setPublishMenuOpen(false);
      else if (connectOpen) setConnectOpen(false);
      // The account chooser and the discard dialog handle their own Escape.
      else if (!confirmDiscard && !catalogue.chooser.open) requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // The page underneath must not scroll while the composer covers it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Publish ──────────────────────────────────────────────────────────────
  const canPublish =
    !publishing && !uploading && pending.length > 0 && problems.length === 0 && (!media || media.url);

  const handlePublish = async () => {
    setPublishMenuOpen(false);
    if (!canPublish) return;
    setPublishing(true);
    const hosted = media?.url ? { url: media.url, type: media.type } : null;
    const published = [];
    const failed = [];

    // One network at a time, so each row's status reads in order and one
    // network's refusal never hides another's success.
    for (const platform of pending) {
      setResults((prev) => ({ ...prev, [platform]: { status: "publishing" } }));
      try {
        const res = await publishComposedPost(platform, {
          text: textFor(platform),
          media: hosted,
          options: options[platform],
          brandId,
        });
        published.push(platform);
        setResults((prev) => ({ ...prev, [platform]: { status: "done", message: res.message } }));
        console.log(`✅ [composer] published to ${platform}`);
      } catch (err) {
        failed.push(platform);
        console.error(`❌ [composer] ${platform} refused:`, err);
        setResults((prev) => ({
          ...prev,
          [platform]: { status: "failed", message: err.message || "Publish failed" },
        }));
      }
    }
    setPublishing(false);

    const names = (list) => list.map((p) => COMPOSER_PLATFORMS[p].label).join(", ");
    if (published.length) onPublished?.({ published, failed });
    if (!failed.length) {
      toast.success(`Published to ${names(published)}`);
      onClose?.();
    } else if (published.length) {
      toast.error(`Posted to ${names(published)} — ${names(failed)} refused it. See below.`);
    } else {
      toast.error(`Couldn't publish to ${names(failed)}. See below.`);
    }
  };

  // ── Character counters ───────────────────────────────────────────────────
  // The open editor's text decides what is counted: the template counts
  // against every network still following it; a network's own tab counts
  // only against that network.
  const editingNetwork = editByNetwork && platforms.includes(editTab) ? editTab : null;
  const editorText = editingNetwork ? textFor(editingNetwork) : text;
  const counters = (editingNetwork ? [editingNetwork] : platforms.filter((p) => customText[p] == null)).map(
    (p) => ({
      platform: p,
      length: textFor(p).length,
      max: COMPOSER_PLATFORMS[p].maxChars,
      over: textFor(p).length > COMPOSER_PLATFORMS[p].maxChars,
    }),
  );
  // A network tab that still follows the template shows it locked.
  const editorLocked = !!editingNetwork && customText[editingNetwork] == null;
  // Nothing can be written into a locked tab or while publishing.
  const textToolsOff = publishing || editorLocked;
  const setEditorText = (value) =>
    editingNetwork
      ? setCustomText((prev) => ({ ...prev, [editingNetwork]: value }))
      : setText(value);

  // The toolbar's tools (emoji, hashtags, links, AI text, saved texts) put
  // their text where the cursor is in the open editor — or at the end when it
  // hasn't been focused — and leave the cursor after what they added.
  const editorRef = useRef(null);

  // ── Formatting a selection ───────────────────────────────────────────────
  // Selecting text in the editor pops the format bar up over it; its buttons
  // restyle just the selection (see FormatToolbar — Unicode look-alikes, since
  // posts are plain text) and keep it selected, so styles can be stacked.
  const [formatAt, setFormatAt] = useState(null); // { x, y } | null
  const [selectedText, setSelectedText] = useState("");
  const showFormatBar = (at) => {
    const el = editorRef.current;
    if (!at || !el || textToolsOff || el.selectionStart === el.selectionEnd) {
      setFormatAt(null);
      return;
    }
    setSelectedText(editorText.slice(el.selectionStart, el.selectionEnd));
    // Kept on screen: never above the window or past its sides.
    setFormatAt({
      x: Math.min(Math.max(at.x, 130), window.innerWidth - 130),
      y: Math.max(at.y, 56),
    });
  };
  const formatSelection = (format) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return;
    const styled = applyFormat(editorText.slice(start, end), format);
    setEditorText(editorText.slice(0, start) + styled + editorText.slice(end));
    setSelectedText(styled);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + styled.length);
    });
  };

  const insertText = (snippet) => {
    const el = editorRef.current;
    const current = editorText;
    const start = el ? el.selectionStart ?? current.length : current.length;
    const end = el ? el.selectionEnd ?? current.length : current.length;
    // A space between the insert and a word right before it.
    const before = current.slice(0, start);
    const pad = before && !/\s$/.test(before) && /^[#\w]/.test(snippet) ? " " : "";
    const next = `${before}${pad}${snippet}${current.slice(end)}`;
    setEditorText(next);
    const caret = start + pad.length + snippet.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="fixed inset-0 z-90 flex flex-col ck-opaque-screen" role="dialog" aria-modal="true" aria-label="Create new post">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-bold text-gray-900 sm:text-2xl">Create new post</h1>
          {activeBrand && (
            <span className="hidden items-center gap-2 rounded-full border border-gray-200 bg-surface py-1 pl-1 pr-3 text-sm font-semibold text-gray-800 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs text-gray-600">
                {activeBrand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeBrand.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  activeBrand.name?.[0]?.toUpperCase()
                )}
              </span>
              <span className="max-w-48 truncate">{activeBrand.name}</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={requestClose}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </div>

      {/* Below lg the two halves share the screen as tabs. */}
      <div className="flex shrink-0 gap-1 px-4 pb-3 lg:hidden">
        {[
          { id: "edit", label: "Edit", Icon: Pencil },
          { id: "preview", label: "Preview", Icon: Eye },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileTab(id)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
              mobileTab === id ? "bg-surface text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="mx-4 mb-4 flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm sm:mx-8 sm:mb-6">
        {/* ───────── Left: editor ───────── */}
        <div
          className={`relative min-w-0 flex-1 flex-col lg:flex lg:border-r lg:border-gray-200 ${
            mobileTab === "edit" ? "flex" : "hidden"
          }`}
        >
          {/* Manage files — takes over the edit column, as Metricool's does. */}
          {manageOpen && (
            <div className="absolute inset-0 z-20 bg-surface">
              <ManageFiles
                items={mediaList}
                disabled={publishing}
                onBack={() => setManageOpen(false)}
                onMove={moveMedia}
                onRemoveMany={(ids) => {
                  removeMedia(ids);
                  if (mediaList.length - ids.length < 2) setManageOpen(false);
                }}
                onView={setViewing}
                onAlt={setAltFor}
                addMenu={
                  <MediaMenu
                    label="Add files"
                    disabled={publishing}
                    onFile={handleFile}
                    onPick={pickHostedMedia}
                    activeBrand={activeBrand}
                  />
                }
              />
            </div>
          )}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {/* Accounts — Metricool's row: every connected account as its
                network icon, coloured when the post goes there and grey when
                switched off. "+" opens the panel to connect more. */}
            <div className="flex flex-wrap items-center gap-2">
              {loadingConnections ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <>
                  {connected.map((p) => {
                    const on = platforms.includes(p);
                    const r = results[p];
                    const type = on ? postTypeOf(p, options[p]) : null;
                    return (
                      <span key={p} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePlatform(p)}
                        disabled={publishing}
                        aria-pressed={on}
                        aria-label={`${COMPOSER_PLATFORMS[p].label} · ${accountName(p)}`}
                        title={`${COMPOSER_PLATFORMS[p].label} · ${accountName(p)}${on ? "" : " (off)"}`}
                        className="relative cursor-pointer rounded-full transition-transform hover:scale-105 disabled:cursor-not-allowed"
                      >
                        <NetworkIcon platform={p} active={on} size={36} />
                        {/* Publish status on the icon itself */}
                        {r?.status === "done" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        {r?.status === "failed" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-white">
                            <X className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        {r?.status === "publishing" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface ring-2 ring-white">
                            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                          </span>
                        )}
                        {/* The post type on the icon's corner, as Metricool shows it */}
                        {type && !r?.status && (
                          <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-md bg-surface text-gray-800 shadow ring-1 ring-gray-200">
                            <type.Icon className="h-3 w-3" strokeWidth={2.25} />
                          </span>
                        )}
                      </button>
                      {type && (
                        <PostTypePill
                          platform={p}
                          value={type.id}
                          disabled={publishing}
                          mediaType={media?.type}
                          onChange={(id) => setOption(p, "post_type", id)}
                        />
                      )}
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setConnectOpen(true)}
                    disabled={publishing}
                    aria-label="Connect more accounts"
                    title="Connect more accounts"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-2 border-gray-800 text-gray-800 transition-colors hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  {connected.length === 0 && (
                    <span className="text-sm text-gray-500">Connect an account to start posting.</span>
                  )}
                </>
              )}
            </div>

            {/* Edit by network — one text for all, or each network its own */}
            {platforms.length > 1 && !editByNetwork && (
              <button
                type="button"
                onClick={() => {
                  setEditByNetwork(true);
                  setEditTab("template");
                }}
                disabled={publishing}
                className="flex cursor-pointer items-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              >
                <Pencil className="h-3 w-3" /> Edit by network
              </button>
            )}
            {editByNetwork && (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex items-end gap-1">
                  {/* Template tab — closing it leaves edit-by-network mode;
                      networks edited on their own keep their text. */}
                  <span
                    className={`flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium ${
                      editTab === "template" || !editingNetwork
                        ? "border-gray-200 bg-surface text-gray-900"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <button type="button" onClick={() => setEditTab("template")} className="cursor-pointer">
                      Template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditByNetwork(false);
                        setEditTab("template");
                      }}
                      aria-label="Stop editing by network"
                      className="cursor-pointer text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                  {platforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setEditTab(p);
                        setPreviewPick(p); // the preview follows the tab being edited
                      }}
                      title={`${COMPOSER_PLATFORMS[p].label}${customText[p] != null ? " · own text" : " · uses the template"}`}
                      className={`relative cursor-pointer rounded-t-lg border border-b-0 px-2 py-1 ${
                        editTab === p ? "border-gray-200 bg-surface" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <NetworkIcon platform={p} size={22} />
                      {/* Red dot: this network has something to fix */}
                      {hasProblem(p) && (
                        <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                      )}
                    </button>
                  ))}
                </div>
                {editingNetwork && (
                  <label className="flex cursor-pointer items-center gap-1.5 pb-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={customText[editingNetwork] == null}
                      onChange={(e) =>
                        e.target.checked ? followTemplate(editingNetwork) : customiseFor(editingNetwork)
                      }
                      className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                    />
                    Use template
                  </label>
                )}
              </div>
            )}

            {/* Editor */}
            <div
              className={`relative border border-gray-200 transition-colors focus-within:border-blue-400 ${
                editByNetwork ? "-mt-3 rounded-b-xl rounded-tr-xl" : "rounded-xl"
              }`}
            >
              <textarea
                ref={editorRef}
                value={editorText}
                onChange={(e) => {
                  setEditorText(e.target.value);
                  setFormatAt(null);
                }}
                disabled={publishing || editorLocked}
                placeholder={
                  editByNetwork && !editingNetwork
                    ? "Write the content you'll use as a template on the rest of the networks"
                    : "What do you want to share?"
                }
                onMouseUp={(e) => showFormatBar({ x: e.clientX, y: e.clientY - 14 })}
                onKeyUp={(e) => {
                  // Keyboard selections (Shift+arrows, Ctrl+A) put the bar
                  // over the top of the box — there's no pointer to follow.
                  if (e.shiftKey || e.key === "a" || e.key === "A") {
                    const r = e.currentTarget.getBoundingClientRect();
                    showFormatBar({ x: r.left + r.width / 2, y: r.top + 6 });
                  } else showFormatBar(null);
                }}
                onBlur={() => setFormatAt(null)}
                onScroll={() => setFormatAt(null)}
                // Metricool's editor: tall enough to write in, filling the
                // column down to the settings, never shorter than ~10 lines.
                className={`block h-[max(240px,calc(100dvh-470px))] w-full resize-y rounded-t-xl bg-transparent px-4 py-3 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 ${
                  editorLocked ? "opacity-30" : ""
                }`}
              />
              {formatAt && selectedText && (
                <FormatToolbar at={formatAt} selected={selectedText} onFormat={formatSelection} />
              )}

              {/* A network tab following the template is locked until you
                  choose to give it its own text. */}
              {editorLocked && (
                <div className="absolute inset-x-0 top-0 flex h-52 items-center justify-center p-4">
                  <div className="flex max-w-sm flex-col items-center gap-2.5 rounded-xl border border-dashed border-gray-300 bg-surface/95 px-5 py-4 text-center">
                    <span className="text-xs text-gray-600">
                      {COMPOSER_PLATFORMS[editingNetwork].label} uses the template. Edit it here to give this network its own text.
                    </span>
                    <button
                      type="button"
                      onClick={() => customiseFor(editingNetwork)}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                    >
                      Edit content
                    </button>
                  </div>
                </div>
              )}

              {/* Attached media — thumbnails with their ⋯ menu and ALT badge,
                  and "Manage ›" once there are two or more. */}
              <MediaStrip
                items={mediaList}
                disabled={publishing}
                onView={setViewing}
                onAlt={setAltFor}
                onRemove={removeMedia}
                onManage={() => setManageOpen(true)}
              />

              {/* Toolbar + counters */}
              <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
                {/* Add multimedia — computer, library, AI, stock (Metricool's menu). */}
                <MediaMenu
                  disabled={publishing}
                  onFile={handleFile}
                  onPick={pickHostedMedia}
                  activeBrand={activeBrand}
                />
                {/* Text tools — each inserts at the cursor (Metricool's row). */}
                <EmojiTool disabled={textToolsOff} onInsert={insertText} />
                <HashtagTool disabled={textToolsOff} onInsert={insertText} text={editorText} platforms={connected} />
                <LinkTool disabled={textToolsOff} onInsert={insertText} />
                <AiTextTool
                  disabled={textToolsOff}
                  onInsert={insertText}
                  platforms={platforms}
                  initialTopic={aiTopic}
                />
                <SavedTextsTool
                  disabled={textToolsOff}
                  onInsert={insertText}
                  currentText={editorText}
                  brandId={brandId}
                />
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
                  {counters.map(({ platform, length, max, over }) => {
                    const { Icon, color } = COMPOSER_PLATFORMS[platform];
                    return (
                      <span
                        key={platform}
                        className={`flex items-center gap-1 text-xs tabular-nums ${over ? "font-semibold text-red-600" : "text-gray-400"}`}
                      >
                        {length.toLocaleString()} / {max.toLocaleString()}
                        <Icon style={{ color, fontSize: 13 }} />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Per-network settings */}
            {platforms
              .filter((p) => COMPOSER_PLATFORMS[p].fields.length)
              .map((p) => {
                const { label, fields, Icon, color } = COMPOSER_PLATFORMS[p];
                const open = !!openSections[p];
                return (
                  <div key={p} className="rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setOpenSections((s) => ({ ...s, [p]: !s[p] }))}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-gray-800"
                    >
                      <Icon style={{ color, fontSize: 16 }} />
                      {label} settings
                      {open ? (
                        <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {open && (
                      <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
                        {fields.map((f) => (
                          <label key={f.key} className="block">
                            <span className="mb-1 block text-xs font-medium text-gray-600">{f.label}</span>
                            {f.type === "board" ? (
                              <BoardField
                                value={options[p]?.[f.key] ?? ""}
                                onChange={(v) => setOption(p, f.key, v)}
                                disabled={publishing}
                                placeholder={f.placeholder}
                              />
                            ) : f.type === "select" ? (
                              <select
                                value={options[p]?.[f.key] ?? f.options[0].value}
                                onChange={(e) => setOption(p, f.key, e.target.value)}
                                disabled={publishing}
                                className="h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-surface px-2.5 text-sm text-gray-800 outline-none focus:border-blue-400"
                              >
                                {f.options.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={options[p]?.[f.key] ?? ""}
                                onChange={(e) => setOption(p, f.key, e.target.value)}
                                maxLength={f.max}
                                disabled={publishing}
                                placeholder={f.placeholder}
                                className="h-9 w-full rounded-lg border border-gray-200 bg-surface px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-400"
                              />
                            )}
                            {f.help && <span className="mt-1 block text-[11px] text-gray-400">{f.help}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Publish results — what each network said */}
            {Object.keys(results).some((p) => results[p].status !== "publishing") && (
              <div className="space-y-1.5 rounded-xl border border-gray-200 p-3">
                {platforms
                  .filter((p) => results[p] && results[p].status !== "publishing")
                  .map((p) => {
                    const r = results[p];
                    const { Icon, color, label } = COMPOSER_PLATFORMS[p];
                    return (
                      <div key={p} className="flex items-start gap-2 text-xs">
                        <Icon style={{ color, fontSize: 14 }} className="mt-0.5 shrink-0" />
                        {r.status === "done" ? (
                          <span className="text-green-700">
                            <Check className="mr-1 inline h-3.5 w-3.5" />
                            {r.message || `Posted to ${label}`}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            <XCircle className="mr-1 inline h-3.5 w-3.5" />
                            {label}: {r.message}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Errors */}
          {!loadingConnections && connected.length > 0 && problems.length > 0 && (
            <div className="mx-4 mb-3 shrink-0 overflow-hidden rounded-xl border border-red-200 sm:mx-5">
              <button
                type="button"
                onClick={() => setErrorsOpen((o) => !o)}
                className="flex w-full cursor-pointer items-center gap-2 bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700"
              >
                <AlertTriangle className="h-4 w-4" />
                {problems.length} {problems.length === 1 ? "error" : "errors"}
                {errorsOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronUp className="ml-auto h-4 w-4" />}
              </button>
              {errorsOpen && (
                <ul className="max-h-32 space-y-1.5 overflow-y-auto px-3 py-2.5">
                  {problems.map((pr, i) => {
                    const meta = pr.platform && COMPOSER_PLATFORMS[pr.platform];
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        {meta ? (
                          <meta.Icon style={{ color: meta.color, fontSize: 14 }} className="mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}
                        {pr.message}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={requestClose}
              disabled={publishing}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <div className="relative flex">
              <button
                type="button"
                onClick={handlePublish}
                disabled={!canPublish}
                className="flex cursor-pointer items-center gap-2 rounded-l-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: BRAND }}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {publishing
                  ? "Publishing…"
                  : uploading
                    ? "Uploading…"
                    : Object.values(results).some((r) => r.status === "failed")
                      ? "Retry"
                      : "Publish now"}
                {/* How many accounts this goes to */}
                {!publishing && pending.length > 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 text-[11px] tabular-nums">
                    {pending.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPublishMenuOpen((o) => !o)}
                disabled={publishing}
                aria-label="More publish options"
                className="flex cursor-pointer items-center rounded-r-lg border-l border-white/25 px-2 text-white disabled:opacity-40"
                style={{ background: BRAND }}
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              {publishMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setPublishMenuOpen(false)}
                  />
                  <div className="absolute bottom-11 right-0 z-20 w-72 overflow-hidden rounded-xl border border-gray-200 bg-surface py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={!canPublish}
                      className="flex w-full cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="mt-0.5 h-4 w-4 text-gray-500" />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">Publish now</span>
                        <span className="block text-[11px] text-gray-500">Post straight away to every selected account</span>
                      </span>
                      <Check className="ml-auto mt-0.5 h-4 w-4 text-gray-700" />
                    </button>
                    <div className="flex w-full items-start gap-2.5 px-3.5 py-2.5 opacity-50">
                      <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">Schedule</span>
                        <span className="block text-[11px] text-gray-500">Coming soon — posts go out immediately for now</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ───────── Right: preview ───────── */}
        <div
          className={`min-w-0 flex-1 flex-col bg-gray-50/60 lg:flex lg:max-w-[46%] ${
            mobileTab === "preview" ? "flex" : "hidden"
          }`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3 sm:px-5">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Preview</span>
            <div className="ml-auto flex items-center gap-1.5">
              {platforms.map((p) => (
                <span key={p} className="group relative">
                  <button
                    type="button"
                    onClick={() => setPreviewPick(p)}
                    title={`Preview on ${COMPOSER_PLATFORMS[p].label}`}
                    className={`cursor-pointer rounded-full p-0.5 transition-all ${
                      p === previewPlatform ? "ring-2 ring-blue-500 ring-offset-1" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <NetworkIcon platform={p} size={26} />
                  </button>
                  {/* Take this network off the post */}
                  {!publishing && (
                    <button
                      type="button"
                      onClick={() => togglePlatform(p)}
                      aria-label={`Don't post to ${COMPOSER_PLATFORMS[p].label}`}
                      title={`Don't post to ${COMPOSER_PLATFORMS[p].label}`}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-white opacity-0 shadow transition-opacity hover:bg-red-600 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" strokeWidth={3} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {/* Phone / desktop framing */}
            <div className="ml-2 flex overflow-hidden rounded-lg border border-gray-200">
              {[
                { id: "phone", Icon: Smartphone, label: "Phone preview" },
                { id: "desktop", Icon: Monitor, label: "Desktop preview" },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDevice(id)}
                  aria-label={label}
                  aria-pressed={device === id}
                  title={label}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center transition-colors ${
                    device === id ? "bg-gray-900 text-white" : "bg-surface text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {previewPlatform ? (
              device === "phone" ? (
                /* A phone running the network's app — status bar, its top
                   bar and tabs, the post in its feed (see PhoneFrame). */
                <PhoneFrame
                  platform={previewPlatform}
                  immersive={!!postTypeOf(previewPlatform, options[previewPlatform])?.vertical}
                  name={accountName(previewPlatform)}
                  logo={activeBrand?.logo}
                >
                  <PostPreview
                    platform={previewPlatform}
                    device="phone"
                    name={accountName(previewPlatform)}
                    logo={activeBrand?.logo}
                    text={textFor(previewPlatform)}
                    media={media}
                    mediaList={mediaList}
                    options={options[previewPlatform]}
                    postType={postTypeOf(previewPlatform, options[previewPlatform])}
                  />
                </PhoneFrame>
              ) : (
                /* A browser window on the network's site. */
                <DesktopFrame
                  platform={previewPlatform}
                  immersive={
                    previewPlatform === "tiktok" ||
                    !!postTypeOf(previewPlatform, options[previewPlatform])?.vertical
                  }
                >
                  <PostPreview
                    platform={previewPlatform}
                    device="desktop"
                    name={accountName(previewPlatform)}
                    logo={activeBrand?.logo}
                    text={textFor(previewPlatform)}
                    media={media}
                    mediaList={mediaList}
                    options={options[previewPlatform]}
                    postType={postTypeOf(previewPlatform, options[previewPlatform])}
                  />
                </DesktopFrame>
              )
            ) : (
              <p className="py-16 text-center text-sm text-gray-400">
                Pick an account to see how the post will look.
              </p>
            )}
          </div>

          <div className="m-4 mt-0 flex shrink-0 items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs leading-relaxed text-blue-900 sm:m-5 sm:mt-0">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            Previews are an approximation of how your post will look when published. The final post may look slightly different.
          </div>
        </div>
      </div>

      {/* ── "+" panel: connect more accounts ──
          Inside the composer's own layer, so it (and the account chooser
          below) sits above the editor without a z-index race. */}
      {connectOpen && (
        <div
          className="absolute inset-0 z-20 flex items-start justify-center bg-black/30 p-4 pt-24 sm:justify-start sm:pl-14"
          onClick={() => setConnectOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Connect more accounts"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[70dvh] w-full max-w-sm overflow-y-auto rounded-xl border border-gray-200 bg-surface p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-gray-900">Connect more accounts</p>
              <button
                type="button"
                onClick={() => setConnectOpen(false)}
                aria-label="Close"
                className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {connectable.length === 0 ? (
              <p className="px-1 py-3 text-xs text-gray-500">
                Every network you can post to is connected.
              </p>
            ) : (
              <div className="space-y-2">
                {connectable.map((p) => {
                  const { Icon, color, connectLabel, label } = COMPOSER_PLATFORMS[p];
                  const awaiting = catalogue.byPlatform.get(p)?.awaitingSelection;
                  const busy = catalogue.connectingId === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => connectNetwork(p)}
                      disabled={!!catalogue.connectingId}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                      style={{ background: color }}
                    >
                      <span className="truncate">
                        {busy ? "Waiting for the login tab…" : awaiting ? `Finish connecting ${label}` : connectLabel}
                      </span>
                      {busy ? (
                        <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin" />
                      ) : (
                        <Icon className="shrink-0" style={{ fontSize: 20 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <Link
              href="/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block px-1 text-center text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline"
            >
              Manage all connections
            </Link>
          </div>
        </div>
      )}

      {/* Account chooser — the Page / account picker a connect may need */}
      {catalogue.chooser.open && (
        <PlatformPageModal
          pages={catalogue.chooser.pages}
          message={catalogue.chooser.message}
          onSelect={catalogue.chooser.onSelect}
          onClose={catalogue.chooser.onClose}
          loading={catalogue.chooser.loadingPageId}
          selectedPageId={null}
          onDisconnect={catalogue.chooser.onDisconnect}
          disconnecting={catalogue.chooser.disconnecting}
        />
      )}

      {/* A file full size, and an image's alt text. */}
      <MediaViewer item={viewing} onClose={() => setViewing(null)} />
      {altFor && (
        <AltTextDialog
          key={altFor.id}
          item={altFor}
          onClose={() => setAltFor(null)}
          onSave={(alt) => {
            patchMedia(altFor.id, { alt });
            setAltFor(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this post?"
        message="Your changes will be lost."
        confirmLabel="Discard"
        variant="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose?.();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
