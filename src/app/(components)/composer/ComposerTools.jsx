"use client";

// app/(components)/composer/ComposerTools.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The composer toolbar's text tools, after Metricool's:
//
//   😊  EmojiTool      the full emoji picker (emoji-mart: categories, search,
//                      frequently used, skin tones)
//   #   HashtagTool    hashtags from the brand's OWN posts, most used first;
//                      ones already in the text are greyed out. Free — it reads
//                      the post lists the Social pages already load (cached).
//   🔗  LinkTool       "URL generator for campaigns" — adds UTM parameters
//   ✨  AiTextTool     "Text generator with AI" — topic, tone, language,
//                      network → a draft, through the app's copilot/chat AI
//   🔖  SavedTextsTool texts you reuse, one click to insert. Kept in this
//                      browser, per brand (there is no backend store for them).
//
// Every tool hands its result to `onInsert(text)`; the composer puts it at the
// cursor in whichever editor tab is open.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Hash,
  Link2,
  Loader2,
  Plus,
  Search,
  Smile,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import { fetchLivePostsFromConnectedAccounts } from "@/(lib)/integration";
import { sendChat } from "@/app/(dashboard)/(pages)/copilot/_data/copilotApi";
import { COMPOSER_PLATFORMS } from "./composerPlatforms";
import FloatingPanel from "./FloatingPanel";

const BRAND = "#003dda";

// ── Shared popover plumbing ──────────────────────────────────────────────────

/**
 * Open state for one toolbar popover: outside click and Escape close it — and
 * Escape stops there, so it doesn't also close the composer behind it.
 */
function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null); // the button's wrapper — the panel's anchor
  const panelRef = useRef(null); // the floating panel (portalled)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target) && !panelRef.current?.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  return { open, setOpen, rootRef, panelRef };
}

/** A toolbar icon button. */
function ToolButton({ icon: Icon, title, active, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-expanded={active}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );
}

/**
 * A toolbar button's panel — floating above the whole composer (see
 * FloatingPanel), so the scrolling edit column can't clip it.
 */
const Panel = ({ popover, children, className = "w-80" }) => (
  <FloatingPanel
    anchorRef={popover.rootRef}
    panelRef={popover.panelRef}
    className={`overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-xl ${className}`}
  >
    {children}
  </FloatingPanel>
);

// ── 😊 Emoji ─────────────────────────────────────────────────────────────────

export function EmojiTool({ disabled, onInsert }) {
  const popover = usePopover();
  const { open, setOpen, rootRef } = popover;
  const hostRef = useRef(null);
  // The latest onInsert, without remounting the picker on every keystroke.
  const insertRef = useRef(onInsert);
  useEffect(() => {
    insertRef.current = onInsert;
  });

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const host = hostRef.current;
    // Loaded on first open — the emoji data is large and most posts need none.
    Promise.all([import("emoji-mart"), import("@emoji-mart/data")]).then(
      ([{ Picker }, { default: data }]) => {
        if (!alive || !host) return;
        host.replaceChildren(
          new Picker({
            data,
            theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            previewPosition: "none",
            skinTonePosition: "search",
            maxFrequentRows: 2,
            onEmojiSelect: (emoji) => insertRef.current(emoji.native),
          }),
        );
      },
    );
    return () => {
      alive = false;
      host?.replaceChildren();
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <ToolButton icon={Smile} title="Add emojis" active={open} disabled={disabled} onClick={() => setOpen(!open)} />
      {open && (
        <FloatingPanel anchorRef={rootRef} panelRef={popover.panelRef} className="rounded-xl shadow-xl">
          <div ref={hostRef} className="min-h-108.75 min-w-88 rounded-xl bg-surface" />
        </FloatingPanel>
      )}
    </div>
  );
}

// ── # Hashtags ───────────────────────────────────────────────────────────────

const HASHTAG = /#[\p{L}\p{N}_]+/gu;

/**
 * @param {object} props
 * @param {string} props.text           The open editor's text (to grey out tags
 *                                      it already has).
 * @param {string[]} props.platforms    Connected networks whose posts to read.
 */
export function HashtagTool({ disabled, onInsert, text, platforms }) {
  const popover = usePopover();
  const { open, setOpen, rootRef } = popover;
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: false, tags: null, error: null });

  // The brand's own posts → every hashtag in them, by how many posts used it.
  // The post lists are the ones the Social pages load (shared cache), so this
  // usually costs no request at all. Read on the first open.
  const load = () => {
    if (state.tags || state.loading) return;
    setState({ loading: true, tags: null, error: null });
    fetchLivePostsFromConnectedAccounts(platforms.map((platform) => ({ platform })))
      .then((rows) => {
        const counts = new Map();
        for (const post of rows) {
          // A tag counts once per post, however often that post repeats it.
          const seen = new Set(
            (`${post.caption || ""} ${post.project_title || ""}`.match(HASHTAG) || []).map((t) =>
              t.toLowerCase(),
            ),
          );
          for (const tag of seen) counts.set(tag, (counts.get(tag) || 0) + 1);
        }
        const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        setState({ loading: false, tags, error: null });
      })
      .catch((err) => setState({ loading: false, tags: [], error: err.message }));
  };

  const inText = useMemo(
    () => new Set((text.match(HASHTAG) || []).map((t) => t.toLowerCase())),
    [text],
  );
  const q = query.trim().replace(/^#/, "").toLowerCase();
  const shown = (state.tags || []).filter(([tag]) => !q || tag.slice(1).includes(q));
  const typed = q && /^[\p{L}\p{N}_]+$/u.test(q) ? `#${q}` : null;
  const add = (tag) => onInsert(`${tag} `);

  return (
    <div ref={rootRef} className="relative">
      <ToolButton
        icon={Hash}
        title="Hashtags"
        active={open}
        disabled={disabled}
        onClick={() => {
          if (!open) load();
          setOpen(!open);
        }}
      />
      {open && (
        <Panel popover={popover}>
          <div className="border-b border-gray-100 p-3">
            <p className="text-sm font-semibold text-gray-900">Hashtags</p>
            <p className="mt-0.5 text-xs text-gray-500">
              From your own posts, most used first. Click one to add it — ones already in the text are greyed out.
            </p>
            <div className="relative mt-2.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && typed) {
                    e.preventDefault();
                    add(typed);
                    setQuery("");
                  }
                }}
                placeholder="Search or type a new hashtag"
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-xs text-gray-800 outline-none focus:border-[#003dda]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {state.loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              </div>
            ) : (
              <>
                {typed && !shown.some(([tag]) => tag === typed) && (
                  <button
                    type="button"
                    onClick={() => {
                      add(typed);
                      setQuery("");
                    }}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-[#003dda] hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add {typed}
                  </button>
                )}
                {shown.length === 0 && !typed ? (
                  <p className="px-2 py-5 text-center text-xs text-gray-500">
                    {state.error ||
                      (state.tags?.length
                        ? "No hashtag matches."
                        : "None of your posts use hashtags yet. Type one above to add it.")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {shown.map(([tag, count]) => {
                      const used = inText.has(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          disabled={used}
                          onClick={() => add(tag)}
                          title={`Used in ${count} of your post${count === 1 ? "" : "s"}`}
                          className="flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:border-[#003dda] hover:text-[#003dda] disabled:cursor-default disabled:border-gray-100 disabled:text-gray-300"
                        >
                          {tag}
                          <span className="text-[10px] text-gray-400">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

// ── 🔗 Campaign links (UTM) ──────────────────────────────────────────────────

const UTM_FIELDS = [
  { key: "url", label: "URL of the website", placeholder: "https://example.com", required: true },
  { key: "source", label: "Source", placeholder: "Instagram, Facebook…", required: true, param: "utm_source" },
  { key: "medium", label: "Medium", placeholder: "Post, email, cpc, banner…", required: true, param: "utm_medium" },
  { key: "campaign", label: "Name of the campaign", placeholder: "Black Friday, Christmas…", required: true, param: "utm_campaign" },
  { key: "term", label: "Search term", placeholder: "Keywords", param: "utm_term" },
  { key: "content", label: "Content", placeholder: "Campaign ID", param: "utm_content" },
];

/** The link with its UTM parameters, or null when the URL isn't a web link. */
function buildUtmUrl(values) {
  let url;
  try {
    const raw = values.url.trim();
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  for (const f of UTM_FIELDS) {
    if (f.param && values[f.key]?.trim()) url.searchParams.set(f.param, values[f.key].trim());
  }
  return url.toString();
}

export function LinkTool({ disabled, onInsert }) {
  const popover = usePopover();
  const { open, setOpen, rootRef } = popover;
  const empty = Object.fromEntries(UTM_FIELDS.map((f) => [f.key, ""]));
  const [values, setValues] = useState(empty);
  const id = useId();
  const ready = UTM_FIELDS.every((f) => !f.required || values[f.key].trim());
  const built = ready ? buildUtmUrl(values) : null;

  return (
    <div ref={rootRef} className="relative">
      <ToolButton icon={Link2} title="URL generator for campaigns" active={open} disabled={disabled} onClick={() => setOpen(!open)} />
      {open && (
        <Panel popover={popover} className="w-[min(30rem,calc(100vw-3rem))]">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">URL generator for campaigns</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Add your campaign&apos;s parameters to a link so its visits can be tracked.
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setValues(empty)}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Clean
              </button>
              <button
                type="button"
                disabled={!built}
                onClick={() => {
                  onInsert(`${built} `);
                  setValues(empty);
                  setOpen(false);
                }}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: BRAND }}
              >
                Add
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 p-4">
            {UTM_FIELDS.map((f) => (
              <label key={f.key} htmlFor={`${id}-${f.key}`} className="text-xs text-gray-600">
                {f.label}
                {f.required && " *"}
                <input
                  id={`${id}-${f.key}`}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-800 outline-none focus:border-[#003dda]"
                />
              </label>
            ))}
          </div>
          {ready && (
            <p className="break-all border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
              {built || "That URL isn't a valid web address."}
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

// ── ✨ AI text ───────────────────────────────────────────────────────────────

const TONES = ["Positive", "Neutral", "Friendly", "Professional", "Funny", "Inspirational", "Persuasive", "Formal"];
const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "German", "Italian", "Arabic", "Hindi", "Yoruba", "Igbo", "Hausa", "Swahili"];

/** The reply text out of copilot/chat's answer (its shape varies). */
const replyText = (data) =>
  [data?.reply, data?.response, data?.message, data?.text, data?.data?.reply].find(
    (v) => typeof v === "string" && v.trim(),
  ) || null;

/**
 * @param {string} [props.initialTopic] Starts the brief — e.g. the prompt the
 *   attached image was generated from, so a caption for it is one click away.
 */
export function AiTextTool({ disabled, onInsert, platforms, initialTopic = "" }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(initialTopic);
  const [tone, setTone] = useState("Positive");
  const [language, setLanguage] = useState("English");
  const [network, setNetwork] = useState("");
  const [busy, setBusy] = useState(false);
  // The conversation on the left: { role: "you" | "ai", text, error? }
  const [turns, setTurns] = useState([]);
  const id = useId();

  const generate = async () => {
    const subject = topic.trim();
    if (!subject || busy) return;
    const meta = network && COMPOSER_PLATFORMS[network];
    const prompt = [
      `Write a social media post about: ${subject}.`,
      `Tone: ${tone}. Language: ${language}.`,
      meta
        ? `It will be published on ${meta.label}; keep it within ${meta.maxChars} characters and follow that network's style.`
        : "Make it work on any social network.",
      "Reply with only the post text — no title, no quotes, no explanation.",
    ].join(" ");
    setBusy(true);
    setTurns((t) => [...t, { role: "you", text: subject }]);
    try {
      const data = await sendChat({ message: prompt });
      if (data?.status === false || data?.status === "error")
        throw new Error(data.message || "The AI couldn't write this.");
      const text = replyText(data);
      if (!text) throw new Error("The AI sent no text back.");
      setTurns((t) => [...t, { role: "ai", text: text.trim() }]);
    } catch (err) {
      setTurns((t) => [...t, { role: "ai", text: err.message || "The AI couldn't write this.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const select = "mt-1 h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm text-gray-800 outline-none focus:border-[#003dda]";

  return (
    <>
      <ToolButton icon={Wand2} title="Text generator with AI" disabled={disabled} onClick={() => setOpen(true)} />
      <ResponsiveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Text generator with AI"
        icon={Sparkles}
        size="4xl"
        zIndex={120}
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
          {/* The conversation */}
          <div className="flex min-h-72 flex-col gap-3 rounded-xl bg-gray-50 p-4">
            <div className="max-w-md rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white" style={{ background: BRAND }}>
              <p className="font-semibold">Hi! I&apos;m your AI assistant.</p>
              <p className="mt-1 text-white/90">Fill in the fields and I&apos;ll write a text you can make your own.</p>
            </div>
            {turns.map((turn, i) =>
              turn.role === "you" ? (
                <p key={i} className="ml-auto max-w-md rounded-2xl rounded-tr-sm bg-surface px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                  {turn.text}
                </p>
              ) : (
                <div
                  key={i}
                  className={`max-w-md rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm shadow-sm ${turn.error ? "text-red-600" : "text-gray-800"}`}
                >
                  <p className="whitespace-pre-line">{turn.text}</p>
                  {!turn.error && (
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(turn.text);
                        setOpen(false);
                      }}
                      className="mt-2.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      style={{ background: BRAND }}
                    >
                      Use this text
                    </button>
                  )}
                </div>
              ),
            )}
            {busy && (
              <span className="flex w-fit items-center gap-2 rounded-2xl bg-surface px-4 py-2.5 text-xs text-gray-500 shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing…
              </span>
            )}
          </div>

          {/* The brief */}
          <div className="space-y-3.5">
            <label htmlFor={`${id}-topic`} className="block text-sm font-medium text-gray-800">
              Write the topic of the text to generate
              <textarea
                id={`${id}-topic`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                placeholder="E.g. Five benefits of having a website for your business"
                className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#003dda]"
              />
            </label>
            <label htmlFor={`${id}-tone`} className="block text-sm font-medium text-gray-800">
              Choose a tone
              <select id={`${id}-tone`} value={tone} onChange={(e) => setTone(e.target.value)} className={select}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label htmlFor={`${id}-lang`} className="block text-sm font-medium text-gray-800">
              Language
              <select id={`${id}-lang`} value={language} onChange={(e) => setLanguage(e.target.value)} className={select}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label htmlFor={`${id}-net`} className="block text-sm font-medium text-gray-800">
              Optimize for social media
              <select id={`${id}-net`} value={network} onChange={(e) => setNetwork(e.target.value)} className={select}>
                <option value="">Any social media</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{COMPOSER_PLATFORMS[p]?.label || p}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={!topic.trim() || busy}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: BRAND }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate text
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}

// ── 🔖 Saved texts ───────────────────────────────────────────────────────────

const savedKey = (brandId) => `ck:saved-texts:${brandId || "default"}`;

function readSaved(brandId) {
  try {
    const list = JSON.parse(localStorage.getItem(savedKey(brandId)) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeSaved(brandId, list) {
  try {
    localStorage.setItem(savedKey(brandId), JSON.stringify(list));
  } catch {
    /* storage full or blocked — the list stays as it was on screen */
  }
}

/**
 * @param {string} props.currentText  Offered as the new text's starting point.
 * @param {string|number} props.brandId
 */
export function SavedTextsTool({ disabled, onInsert, currentText, brandId }) {
  const popover = usePopover();
  const { open, setOpen, rootRef } = popover;
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState(null); // { title, text } while adding
  const id = useId();

  const toggle = () => {
    if (!open) {
      setList(readSaved(brandId));
      setDraft(null);
    }
    setOpen(!open);
  };

  const save = () => {
    if (!draft?.text.trim()) return;
    const next = [
      { id: Date.now(), title: draft.title.trim() || draft.text.trim().slice(0, 40), text: draft.text },
      ...list,
    ];
    setList(next);
    writeSaved(brandId, next);
    setDraft(null);
  };

  const remove = (itemId) => {
    const next = list.filter((t) => t.id !== itemId);
    setList(next);
    writeSaved(brandId, next);
  };

  return (
    <div ref={rootRef} className="relative">
      <ToolButton icon={Bookmark} title="Saved texts" active={open} disabled={disabled} onClick={toggle} />
      {open && (
        <Panel popover={popover}>
          {draft ? (
            <div className="space-y-2.5 p-4">
              <p className="text-sm font-semibold text-gray-900">New text</p>
              <input
                id={`${id}-title`}
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Name (optional)"
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-800 outline-none focus:border-[#003dda]"
              />
              <textarea
                value={draft.text}
                onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
                rows={5}
                placeholder="The text to save"
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-[#003dda]"
              />
              <div className="flex justify-end gap-1.5">
                <button type="button" onClick={() => setDraft(null)} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!draft.text.trim()}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: BRAND }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <Bookmark className="h-6 w-6" style={{ color: BRAND }} />
              </span>
              <p className="text-sm text-gray-600">Save texts that you use regularly and access them quickly.</p>
              <button
                type="button"
                onClick={() => setDraft({ title: "", text: currentText })}
                className="cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                style={{ background: BRAND }}
              >
                New text
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-900">Saved texts</p>
                <button
                  type="button"
                  onClick={() => setDraft({ title: "", text: currentText })}
                  className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#003dda] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> New text
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto p-1.5">
                {list.map((t) => (
                  <li key={t.id} className="group flex items-start gap-1 rounded-lg hover:bg-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(t.text);
                        setOpen(false);
                      }}
                      className="min-w-0 flex-1 cursor-pointer px-2.5 py-2 text-left"
                    >
                      <p className="truncate text-xs font-semibold text-gray-900">{t.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{t.text}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      aria-label={`Delete ${t.title}`}
                      className="mt-2 mr-1.5 cursor-pointer rounded-md p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400">Saved in this browser, for this brand.</p>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
