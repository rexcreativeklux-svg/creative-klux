"use client";

/**
 * magicPanelUI.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Presentational pieces for rendering a Magic Studio tool's `options` — the rich
 * choosers a config declares, in whatever layout the surface around them wants.
 *
 * Originally ported out of MagicStudioModal, which has since been deleted; this
 * is now THE implementation rather than a copy of one, and there is nothing left
 * to keep it in sync with. Two surfaces render these today: the Magic Studio tab
 * inside the media picker (inline, under an expandable row) and the Magic Studio
 * composer's toolbar chips (in a portalled drop-up panel).
 *
 *   • OptionPanelBody — the rich option chooser (cards / ratios / flags / voices
 *     / pills / list), rendered INLINE under an expandable option row instead of
 *     the modal's floating panel.
 *   • summarize       — human label for an option's current value.
 *   • ProcessingState — on-device real-progress panel (STT/TTS) shown while an
 *     on-device tool runs.
 *   • TRANSCRIPT_DOWNLOADS — the TXT / SRT / VTT export menu items.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Play,
  Pause,
  Loader2,
  AudioLines,
  Star,
  FileText,
  Captions,
} from "lucide-react";
import {
  AUTO_COLOR,
  languageDisplayLabel,
} from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";

/**
 * One template card: poster, hover-to-play clip, and the button that applies it.
 *
 * Split out of OptionPanelBody because it owns per-card state (which card is
 * being hovered) and a ref to the <video> it has to start and rewind — neither
 * of which belongs in a function that renders six other panel kinds.
 *
 * @param {object} props
 * @param {object} props.template The catalog entry.
 * @param {boolean} props.active Whether this is the applied template.
 * @param {() => void} props.onApply
 */
function TemplateCard({ template, active, onApply }) {
  const videoRef = useRef(null);
  const Icon = template.icon;

  // Play from the top on every hover, and stop on the way out — a clip left
  // mid-way through reads as a stalled download the next time you pass over it.
  const play = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    // Autoplay can be refused (a data-saver setting, reduced-motion); the poster
    // simply stays up, which is the same thing the card shows when idle.
    el.play?.().catch(() => {});
  };
  const stop = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause?.();
    el.currentTime = 0;
  };

  return (
    <div
      onMouseEnter={play}
      onMouseLeave={stop}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-surface text-left transition-colors ${
        active ? "border-blue-500" : "border-gray-200 hover:border-blue-300"
      }`}
    >
      <div className="relative aspect-video w-full bg-gray-100">
        {/* The icon ground sits under both, so a card with no media — the
            "write your own" one — and a file that fails to load land in the
            same designed state rather than on a broken-image glyph. */}
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
          {Icon && (
            <Icon
              className={`h-7 w-7 ${active ? "text-blue-500" : "text-gray-400"}`}
              strokeWidth={1.5}
            />
          )}
        </div>
        {template.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.image}
            alt={template.label}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {template.video && (
          <video
            ref={videoRef}
            src={template.video}
            poster={template.image || undefined}
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}

        {/* The apply button rides on the poster rather than under it: the card
            is already a hover surface for the clip, and a second row of chrome
            per card would halve how many fit in the panel. */}
        <button
          type="button"
          onClick={onApply}
          className="absolute inset-x-2 bottom-2 rounded-lg bg-blue-600/95 px-2 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow transition-opacity hover:bg-blue-700 group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
        >
          Use template
        </button>

        {active && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 shadow">
            <Check className="h-3 w-3 text-white" />
          </span>
        )}
      </div>

      <div className="px-2.5 py-2">
        <span
          className={`block text-xs font-bold ${active ? "text-blue-700" : "text-gray-900"}`}
        >
          {template.label}
        </span>
        {template.desc && (
          <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
            {template.desc}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The templates panel — the cards, grouped under their category headings.
 *
 * ⚠️ THE HEADINGS ARE THE REASON THIS ISN'T THE `cards` PANEL. The catalog has
 * carried a `category` on every entry since it was written, and the flat grid
 * threw it away: five groups' worth of structure rendered as one undifferentiated
 * wall. With sixteen entries and a wider panel, the grouping is what makes it
 * browsable instead of scrollable.
 */
function TemplatePanelBody({ option, value, onSelect }) {
  const items = option.items || [];
  const order = option.categoryOrder || [];
  // Anything with no category (the "write your own" card) leads, ungrouped.
  const loose = items.filter((item) => !item.category);
  const groups = order
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="p-3">
      {loose.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {loose.map((item) => (
            <TemplateCard
              key={item.value}
              template={item}
              active={value === item.value}
              onApply={() => onSelect(item.value)}
            />
          ))}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.category} className="mb-3 last:mb-0">
          <p className="mb-1.5 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {group.category}
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {group.items.map((item) => (
              <TemplateCard
                key={item.value}
                template={item}
                active={value === item.value}
                onApply={() => onSelect(item.value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ── Option chooser body (rich cards keyed by option.panel) ───────────────────
 *
 * @param {object} props
 * @param {object} props.option  The config's option declaration.
 * @param {*} props.value        Its current value.
 * @param {(value: *, opts?: {keepOpen?: boolean}) => void} props.onSelect
 *   Commit a value. `opts.keepOpen` asks a surface that closes on select to stay
 *   open — it comes from the controls that fire continuously (a colour drag, a
 *   hex being typed) rather than once. A surface that never closes can ignore it.
 * @param {object} [props.voicePreview]
 */
export function OptionPanelBody({ option, value, onSelect, voicePreview }) {
  const { panel, items } = option;

  // A number picked off a continuous range (Duration).
  //
  // ⚠️ A SLIDER, NOT A LIST, AND THE RANGE IS WHY — the same reasoning the
  // composer's variations control is built on. Thirty entries is a menu you
  // scroll to answer "how long", a question you already know the answer to
  // before you open it; dragging reaches any of them in one gesture.
  //
  // ⚠️ IT COMMITS WITH `keepOpen`, WHICH IS NOT OPTIONAL HERE. `onChange` fires
  // on every step of a drag, and the surfaces that close on select would vanish
  // mid-gesture on whatever number the thumb happened to pass through first.
  //
  // ⚠️ THE VALUE IS WRITTEN BACK AS A STRING. Every options value in these
  // configs is a string and rides into the payload untouched (`duration:
  // values.duration`), so a slider that started emitting numbers would silently
  // change what goes on the wire for one option and no other.
  if (panel === "slider") {
    const min = Number(option.min ?? 1);
    const max = Number(option.max ?? 10);
    const step = Number(option.step ?? 1);
    const unit = option.unit || "";
    const raw = Number(value ?? option.default);
    const current = Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : min;
    const hint = option.hint?.(current);

    return (
      <div className="flex flex-col gap-2.5 px-3 pb-3 pt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums text-gray-900">
            {current}
            {unit}
          </span>
          {hint && (
            <span className="min-w-0 truncate text-[11px] text-gray-400">
              {hint}
            </span>
          )}
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(event) =>
            onSelect(String(Number(event.target.value)), { keepOpen: true })
          }
          aria-label={option.label}
          className="w-full cursor-pointer accent-blue-600"
        />

        <div className="flex justify-between text-[10px] tabular-nums text-gray-400">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>
      </div>
    );
  }

  // Template cards: the source still, the clip it becomes, and the prompt that
  // did it — three to a row.
  //
  // ⚠️ THE POSTER IS THE INPUT, NOT AN ILLUSTRATION. Every other picker in this
  // app shows a picture OF a look; these show the exact frame the template was
  // run on, and applying one selects it as the tool's source image. That is what
  // makes the hover clip an honest promise rather than a mood board — press
  // Generate straight after applying and you are asking for the thing you just
  // watched.
  //
  // ⚠️ THE CLIP LOADS ON HOVER, NOT ON OPEN. Sixteen autoplaying <video>
  // elements in a dropdown is tens of megabytes fetched to look at a grid, so
  // `preload="none"` holds every one of them at zero bytes until a pointer
  // actually lands on a card.
  if (panel === "templates") {
    return (
      <TemplatePanelBody option={option} value={value} onSelect={onSelect} />
    );
  }

  // Image cards: thumbnail + label + description (Visual style).
  if (panel === "cards") {
    return (
      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((it) => {
          const active = value === it.value;
          const Icon = it.icon;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
            >
              {/* ⚠️ THE ICON PANEL IS THE GROUND, NOT A BRANCH. It is always
                  rendered and the photo sits on top of it, so an item with no
                  `img` AND an item whose `img` 404s land in the same designed
                  state rather than one of them showing a broken-image glyph.
                  These thumbnails are third-party URLs (Pexels) — the one thing
                  they can be relied on to do eventually is stop resolving.
                  `display:none` on error is what uncovers the panel; there is no
                  state to keep, because a failed image never un-fails. */}
              <div className="relative w-full h-20 bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
                  {Icon && (
                    <Icon
                      className={`h-7 w-7 ${active ? "text-blue-500" : "text-gray-400"}`}
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                {it.img && (
                  <img
                    src={it.img}
                    alt={it.label}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {active && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`}
                    />
                  )}
                  <span
                    className={`text-xs font-bold ${active ? "text-blue-700" : "text-gray-900"}`}
                  >
                    {it.label}
                  </span>
                </div>
                {it.desc && (
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                    {it.desc}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Ratio frames: a scaled rectangle preview per aspect ratio.
  if (panel === "ratios") {
    return (
      <div className="p-3 grid grid-cols-3 gap-2.5">
        {items.map((it) => {
          const active = value === it.value;
          const maxDim = 60;
          const bw = it.w >= it.h ? maxDim : Math.round((maxDim * it.w) / it.h);
          const bh = it.h >= it.w ? maxDim : Math.round((maxDim * it.h) / it.w);
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300"}`}
            >
              <div className="flex items-center justify-center h-16 relative w-full">
                <div
                  className={`rounded-md ${active ? "bg-blue-300" : "bg-gray-200"}`}
                  style={{ width: bw, height: bh }}
                />
                {active && (
                  <span className="absolute top-0 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-semibold ${active ? "text-blue-700" : "text-gray-700"}`}
              >
                {it.label}
              </span>
              <span className="text-[9px] text-gray-400">{it.ratio}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Language flags: flag + label grid.
  if (panel === "flags") {
    return (
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {items.map((it) => {
          const active = value === it.value;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300"}`}
            >
              <span className="text-lg leading-none">{it.flag}</span>
              <span
                className={`text-xs font-semibold flex-1 ${active ? "text-blue-700" : "text-gray-700"}`}
              >
                {it.label}
              </span>
              {active && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Voices: rows grouped by accent + gender (Text to Audio's on-device voices).
  if (panel === "voices") {
    const groups = [];
    for (const it of items) {
      const last = groups[groups.length - 1];
      if (last && last.name === it.group) last.items.push(it);
      else groups.push({ name: it.group, items: [it] });
    }
    return (
      <div className="p-2 pb-3">
        {/* Only where there is something to tap. Hosted voices can only be
            heard by billing a real generation, so they carry `preview: false`
            and show no ▶ — an instruction to tap one would be a dead end. */}
        {items.some((it) => it.preview !== false) && (
          <p className="px-2 pt-1 pb-2 text-[11px] leading-snug text-gray-400">
            Tap <Play className="inline w-3 h-3 -mt-0.5" /> to hear a sample of
            each voice before you pick.
          </p>
        )}
        {groups.map((group) => (
          <div key={group.name}>
            <p className="px-2 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {group.name}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {group.items.map((it) => {
                const active = value === it.value;
                const Icon = it.icon;
                const female = it.gender === "female";
                const isLoading = voicePreview?.loadingId === it.value;
                const isPlaying = voicePreview?.playingId === it.value;
                return (
                  <div
                    key={it.value}
                    className={`flex items-center rounded-xl border-2 transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
                  >
                    <button
                      onClick={() => onSelect(it.value)}
                      className="flex items-center gap-2 pl-2.5 pr-1 py-2 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${female ? "bg-pink-100 text-pink-600" : "bg-sky-100 text-sky-600"}`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                      </span>
                      <span className="flex-1 min-w-0 flex items-center gap-1">
                        <span
                          className={`text-xs font-semibold truncate ${active ? "text-blue-700" : "text-gray-900"}`}
                        >
                          {it.label}
                        </span>
                        {it.top && (
                          <Star className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" />
                        )}
                      </span>
                    </button>
                    {voicePreview && it.preview !== false && (
                      <button
                        onClick={() => voicePreview.toggle(it)}
                        aria-label={
                          isPlaying
                            ? `Stop ${it.label} sample`
                            : `Play ${it.label} sample`
                        }
                        className={`shrink-0 w-7 h-7 mr-1 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isPlaying ? "bg-blue-600 text-white" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Colours: swatches plus a free hex box.
  //
  // ⚠️ THE FIRST ITEM IS "NO COLOUR IN PARTICULAR" AND IT IS THE DEFAULT. This
  // panel steers what the model paints, so a preselected swatch would quietly
  // tint every generation on a tool that has never done that — the option has to
  // start as an opt-in. It renders as a slashed swatch rather than as a colour,
  // so "none" can't be mistaken for a shade of grey.
  //
  // ⚠️ THE HEX BOX IS THE POINT, not a nicety. The presets are a starting set;
  // the colour anyone actually wants here is their own brand's, which no fixed
  // palette can contain. It writes the same `value` the swatches do, so nothing
  // downstream has to know which of the two was used.
  if (panel === "colors") {
    const custom = value && value !== AUTO_COLOR && !items.some((i) => i.value === value);
    return (
      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {items.map((it) => {
            const active = value === it.value;
            const none = it.value === AUTO_COLOR;
            return (
              <button
                key={it.value}
                onClick={() => onSelect(it.value)}
                title={it.label}
                aria-label={it.label}
                aria-pressed={active}
                className={`relative h-8 w-8 rounded-lg border-2 transition-transform cursor-pointer hover:scale-110 ${active ? "border-gray-900 scale-110" : "border-gray-200"}`}
                style={none ? undefined : { background: it.value }}
              >
                {none && (
                  // A diagonal through an empty swatch — the standard "no fill".
                  <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-md bg-surface">
                    <span className="h-px w-9 -rotate-45 bg-gray-300" />
                  </span>
                )}
                {active && !none && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                )}
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500">Custom</span>
          {/* The native picker and the text box write the same value — one for
              choosing, one for pasting a hex you already have. */}
          {/* ⚠️ BOTH OF THESE PASS `keepOpen`, and without it the panel is
              unusable. A surface that closes on select (the composer's drop-up
              does) is right for a swatch — one click, one choice, done — but
              these two fire onChange CONTINUOUSLY: the native picker on every
              step of a drag, the text box on every keystroke. Closing on the
              first of those shuts the panel before a colour has been picked. */}
          <input
            type="color"
            value={custom ? value : "#2563eb"}
            onChange={(event) => onSelect(event.target.value, { keepOpen: true })}
            aria-label="Pick a custom colour"
            className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-surface p-0.5"
          />
          <input
            type="text"
            value={custom ? value : ""}
            onChange={(event) => {
              const next = event.target.value.trim();
              // Only commit a hex that is actually complete — onChange fires on
              // every keystroke, and half-typed "#2b" would be sent as a colour.
              if (/^#[0-9a-fA-F]{6}$/.test(next)) {
                onSelect(next, { keepOpen: true });
              } else if (next === "" || next === "#") {
                onSelect(AUTO_COLOR, { keepOpen: true });
              }
            }}
            placeholder="#2563EB"
            maxLength={7}
            className="w-24 rounded-lg border border-gray-200 px-2 py-1 font-mono text-xs text-gray-700 outline-none focus:border-blue-400"
          />
        </label>
      </div>
    );
  }

  // Pills: compact chips (export format).
  if (panel === "pills") {
    return (
      <div className="p-3 flex flex-wrap gap-2">
        {items.map((it) => {
          const active = value === it.value;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-blue-300"}`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Default — icon + label + desc cards, three across (list: quality, duration…).
  return (
    <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((it) => {
        const active = value === it.value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            onClick={() => onSelect(it.value)}
            className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
          >
            <span className="flex items-center justify-between">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-blue-100" : "bg-gray-100"}`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-500"}`}
                  />
                )}
              </span>
              {active && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </span>
            <span
              className={`block text-sm font-semibold ${active ? "text-blue-700" : "text-gray-900"}`}
            >
              {it.label}
            </span>
            {it.desc && (
              <span className="block text-[11px] text-gray-500 leading-snug">
                {it.desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Human-readable summary of the current value for an option row.
export function summarize(option, value) {
  const found = option.items?.find((i) => i.value === value);
  if (found) return found.label;
  // A slider has no items to look a label up in — its value IS the label, and
  // the unit is what makes "7" read as a length rather than a count.
  if (option.panel === "slider") {
    return `${value ?? option.default ?? ""}${option.unit || ""}`;
  }
  // A colour typed into the hex box is a legitimate value with no item behind
  // it — show it as the hex, uppercased, rather than falling through to a raw
  // lowercase string beside a row of proper labels.
  if (option.panel === "colors" && typeof value === "string") {
    return value.toUpperCase();
  }
  return value;
}

// Per-engine processing flows: each on-device engine reports these stages, shown
// as a growing checklist next to a REAL progress bar. Keyed by config `engine`.
const ENGINE_FLOWS = {
  tts: {
    ids: ["model", "voice", "speak", "finalize"],
    labels: (downloading) => [
      downloading
        ? "Downloading the voice engine (one-time)…"
        : "Loading the voice engine…",
      "Preparing the voice…",
      "Synthesizing speech…",
      "Polishing the audio…",
    ],
    title: "Generating your audio…",
  },
  stt: {
    ids: ["prepare", "model", "detect", "transcribe", "format"],
    labels: (downloading, engine) => [
      "Reading the audio…",
      downloading
        ? "Downloading the transcription engine (one-time)…"
        : "Loading the transcription engine…",
      engine?.detectedLanguage
        ? `Detected: ${languageDisplayLabel(engine.detectedLanguage)}`
        : "Detecting the language…",
      "Transcribing speech…",
      "Formatting the transcript…",
    ],
    title: "Transcribing your audio…",
  },
};

// Transcript download formats — TXT mirrors the displayed text; SRT/VTT are
// subtitle files built from Whisper's timed segments (transcriptExports).
export const TRANSCRIPT_DOWNLOADS = [
  {
    kind: "txt",
    label: "Text (.txt)",
    desc: "The transcript as shown",
    Icon: FileText,
    needsSegments: false,
  },
  {
    kind: "srt",
    label: "Subtitles (.srt)",
    desc: "For video editors & players",
    Icon: Captions,
    needsSegments: true,
  },
  {
    kind: "vtt",
    label: "Web subtitles (.vtt)",
    desc: "For web video players",
    Icon: Captions,
    needsSegments: true,
  },
];

/**
 * On-device processing state — a REAL progress bar + stage checklist (and a live
 * transcript preview for STT). Rendered while an on-device tool is generating.
 *
 * @param {object} props
 * @param {object} props.config Active category config (title for the copy).
 * @param {string} [props.engineType] Which on-device flow ("tts" | "stt").
 * @param {object|null} [props.engine] On-device engine state (progress, stage,
 *   downloading — STT also streams detectedLanguage/partialText/autoDetecting).
 */
export function ProcessingState({ config, engine, engineType }) {
  // Pin the live transcript preview to its newest line as pieces stream in.
  const liveRef = useRef(null);
  useEffect(() => {
    const el = liveRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [engine?.partialText]);

  const flow = ENGINE_FLOWS[engineType] || ENGINE_FLOWS.tts;
  const labels = flow.labels(engine?.downloading, engine);
  // Zip ids+labels, then drop the detect row when the user forced a language.
  const rows = flow.ids
    .map((id, i) => ({ id, label: labels[i] }))
    .filter((row) => row.id !== "detect" || engine?.autoDetecting);
  const stageIndex = Math.max(
    0,
    rows.findIndex((row) => row.id === engine?.stage),
  );
  const pct = Math.max(0, Math.min(100, Math.round(engine?.progress || 0)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center py-4"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-canvas dark:to-canvas shadow-inner p-8">
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex items-center justify-center mb-6">
          <motion.span
            className="absolute h-20 w-20 rounded-full border-2 border-blue-400/40"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur">
            <AudioLines className="h-6 w-6 text-blue-600 animate-pulse" />
          </span>
        </div>

        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{flow.title}</span>
          <span className="text-2xl font-bold text-blue-600 leading-none">
            {pct}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-blue-600 to-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-5 space-y-2">
          {rows.slice(0, stageIndex + 1).map((row, i) => (
            <div key={row.id} className="flex items-center gap-2 text-xs">
              {i < stageIndex ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
              )}
              <span
                className={
                  i < stageIndex ? "text-gray-400" : "text-gray-700 font-medium"
                }
              >
                {row.label}
              </span>
            </div>
          ))}
        </div>

        {engine?.partialText ? (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">
                Live transcript
              </span>
              <span className="text-[10px] text-gray-400">
                preview — refines when finished
              </span>
            </div>
            <div
              ref={liveRef}
              className="max-h-28 overflow-y-auto rounded-xl border border-gray-100 bg-white/70 p-3 text-xs leading-relaxed text-gray-600 whitespace-pre-wrap"
            >
              {engine.partialText}
            </div>
          </div>
        ) : null}

        <p className="mt-5 text-center text-[11px] text-gray-400">
          Runs on your device — private, free, and unlimited.
        </p>
      </div>
    </motion.div>
  );
}
