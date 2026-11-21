"use client";

// app/(components)/composer/PostPreview.jsx
// ─────────────────────────────────────────────────────────────────────────────
// How a composed post will look on each network — the right-hand side of the
// Create Post composer, and the Feed preview of a published post.
//
// Three layers, so each looks like the place it imitates rather than a card
// floating on grey:
//
//   PhoneFrame / DesktopFrame   the device: a phone (status bar, notch, home
//                               bar) or a browser window on the network's site
//   AppChrome                   inside the phone, the network's own app around
//                               the feed — its top bar and bottom tabs
//   <Network>Preview            the post itself, as that feed lays it out —
//                               edge to edge on a phone, a card on desktop;
//                               several images in that network's grid
//
// Approximations on purpose: the composer says so under them, the way
// Metricool does, because no network publishes a pixel-exact spec of its feed.

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import {
  BatteryFull,
  Bell,
  Bookmark,
  Briefcase,
  Cast,
  ChevronLeft,
  Clapperboard,
  Globe,
  Heart,
  Home,
  ImageIcon,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  PlusSquare,
  Repeat2,
  Search,
  Send,
  Share2,
  Store,
  ThumbsUp,
  Tv,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { FaFacebook, FaLinkedin, FaPinterest, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { COMPOSER_PLATFORMS, firstLine } from "./composerPlatforms";

/** "phone" | "desktop" — how the post sits: edge to edge, or as a card. */
const DeviceContext = createContext("desktop");

// ── Small pieces ─────────────────────────────────────────────────────────────

/** Brand avatar — the logo, or the initial on the network's colour. */
function Avatar({ name, logo, color, size = 36 }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {logo && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        name?.[0]?.toUpperCase() || "B"
      )}
    </span>
  );
}

const srcOf = (m) => m?.previewUrl || m?.url;

/** "ALT" on an image that has a description, as X and Bluesky show it. */
const AltBadge = ({ item }) =>
  item?.type === "image" && item.alt ? (
    <span
      title={item.alt}
      className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
    >
      ALT
    </span>
  ) : null;

/** One image or video filling its box. */
function MediaFill({ item, className = "", fit = "cover", controls = true }) {
  if (item.type === "video")
    return (
      <video
        src={srcOf(item)}
        className={`h-full w-full bg-black object-${fit} ${className}`}
        controls={controls}
        playsInline
        preload="metadata"
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={srcOf(item)} alt={item.alt || ""} className={`h-full w-full object-${fit} ${className}`} />
  );
}

/** The single-file form: natural height up to a cap, or a placeholder. */
function Media({ media, className = "", placeholder = false }) {
  if (!media) {
    if (!placeholder) return null;
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}>
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  return (
    <div className="relative">
      {media.type === "video" ? (
        <video
          src={srcOf(media)}
          className={`w-full bg-black object-contain ${className}`}
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={srcOf(media)} alt={media.alt || ""} className={`w-full object-cover ${className}`} />
      )}
      <AltBadge item={media} />
    </div>
  );
}

/**
 * Several files laid out the way the network lays them out:
 *   "facebook"  2 side by side · 3 = one wide over two · 4+ = 2×2, "+N" on the last
 *   "twitter"   2 columns · 3 = one tall beside two · 4 = 2×2, rounded as a block
 *   "carousel"  one at a time with "1/N" and dots (Instagram)
 */
function MediaGallery({ items, layout = "facebook", className = "" }) {
  const [index, setIndex] = useState(0);
  if (!items?.length) return null;
  if (items.length === 1) return <Media media={items[0]} className={className} />;

  if (layout === "carousel") {
    const at = Math.min(index, items.length - 1);
    return (
      <div>
        <div className="relative aspect-square bg-gray-100">
          <MediaFill item={items[at]} />
          <AltBadge item={items[at]} />
          <span className="absolute right-2.5 top-2.5 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
            {at + 1}/{items.length}
          </span>
        </div>
        <div className="flex justify-center gap-1 pt-2">
          {items.map((item, i) => (
            <button
              key={item.id ?? i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`File ${i + 1}`}
              className={`h-1.5 w-1.5 cursor-pointer rounded-full transition-colors ${i === at ? "bg-[#0095f6]" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  const cell = (item, i, cls = "") => (
    <div key={item.id ?? i} className={`relative overflow-hidden bg-gray-100 ${cls}`}>
      <MediaFill item={item} controls={false} />
      {item.type === "video" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </span>
      )}
      <AltBadge item={item} />
      {i === 3 && extra > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
          +{extra}
        </span>
      )}
    </div>
  );

  const gap = layout === "twitter" ? "gap-0.5" : "gap-1";
  const wrap = layout === "twitter" ? "overflow-hidden rounded-2xl border border-gray-200" : "";
  if (shown.length === 2)
    return <div className={`grid h-56 grid-cols-2 ${gap} ${wrap}`}>{shown.map((m, i) => cell(m, i))}</div>;
  if (shown.length === 3)
    return layout === "twitter" ? (
      <div className={`grid h-64 grid-cols-2 grid-rows-2 ${gap} ${wrap}`}>
        {cell(shown[0], 0, "row-span-2")}
        {cell(shown[1], 1)}
        {cell(shown[2], 2)}
      </div>
    ) : (
      <div className={`grid grid-cols-2 ${gap}`}>
        {cell(shown[0], 0, "col-span-2 aspect-[16/10]")}
        {cell(shown[1], 1, "aspect-square")}
        {cell(shown[2], 2, "aspect-square")}
      </div>
    );
  return (
    <div className={`grid grid-cols-2 ${gap} ${wrap}`}>
      {shown.map((m, i) => cell(m, i, "aspect-square"))}
    </div>
  );
}

/**
 * Text cut to a few lines with the network's own "See more" after it, the way
 * a feed shows a long post. The link only appears when the text really runs
 * past the cut: with `moreHref` it opens the post on the network, without one
 * it opens the text in place.
 */
function ClampedText({ children, lines = 3, moreLabel = "See more", moreHref, className = "" }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, lines, open]);

  // Blue, with an underline that draws in from the left on hover / focus.
  const linkCls =
    "cursor-pointer font-semibold text-[#003dda] bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-bottom-left bg-size-[0%_1px] transition-[background-size,opacity] duration-300 ease-out hover:bg-size-[100%_1px] hover:opacity-85 focus-visible:bg-size-[100%_1px] focus-visible:outline-none";

  return (
    <div className={`relative ${className}`}>
      <p
        ref={ref}
        className="whitespace-pre-line wrap-break-word text-sm leading-snug text-gray-900"
        style={
          open
            ? undefined
            : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }
        }
      >
        {children}
      </p>
      {overflows && !open && (
        <span className="absolute bottom-0 right-0 bg-surface pl-1 text-sm text-gray-800">
          …{" "}
          {moreHref ? (
            <a href={moreHref} target="_blank" rel="noopener noreferrer" className={linkCls}>
              {moreLabel}
            </a>
          ) : (
            <a
              href="#"
              role="button"
              onClick={(e) => {
                e.preventDefault();
                setOpen(true);
              }}
              className={linkCls}
            >
              {moreLabel}
            </a>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Post text with line breaks kept; a placeholder while it's still empty.
 * `clamp` (lines) cuts it with "See more" — for a published post's preview;
 * the composer leaves it off so the whole draft stays visible while typing.
 */
function Text({ text, className = "", clamp, moreLabel, moreHref }) {
  if (!text.trim())
    return <p className={`text-sm italic text-gray-300 ${className}`}>Your text will appear here</p>;
  if (clamp)
    return (
      <ClampedText lines={clamp} moreLabel={moreLabel} moreHref={moreHref} className={className}>
        {text}
      </ClampedText>
    );
  return <p className={`whitespace-pre-line wrap-break-word text-sm leading-snug text-gray-900 ${className}`}>{text}</p>;
}

/** The post's frame: edge to edge in a phone feed, a card on desktop. */
function Card({ children, className = "" }) {
  const device = useContext(DeviceContext);
  return (
    <article
      className={`overflow-hidden bg-surface ${
        device === "phone" ? "" : "rounded-xl border border-gray-200 shadow-sm"
      } ${className}`}
    >
      {children}
    </article>
  );
}

/**
 * A published post's counts under it — the icon, then the number when the
 * network sent one (no number reads as none sent, not zero).
 */
function CountsRow({ counts }) {
  const items = [
    { Icon: ThumbsUp, v: counts.likes, label: "Likes" },
    { Icon: MessageCircle, v: counts.comments, label: "Comments" },
    { Icon: Share2, v: counts.shares, label: "Shares" },
  ];
  return (
    <div className="flex items-center gap-4 border-t border-gray-100 px-3 py-2 text-xs text-gray-600">
      {items.map(({ Icon, v, label }) => (
        <span key={label} className="flex items-center gap-1" title={label}>
          <Icon className="h-4 w-4" />
          {v != null && v !== "0" && v}
        </span>
      ))}
    </div>
  );
}

/** An action row — icon + word, evenly spread, the way FB and LinkedIn show it. */
const ActionRow = ({ actions }) => (
  <div className="mx-3 flex items-center justify-around border-t border-gray-200 py-1 text-[13px] font-semibold text-gray-600">
    {actions.map(([Icon, label]) => (
      <span key={label} className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
        <Icon className="h-4.5 w-4.5" /> {label}
      </span>
    ))}
  </div>
);

// ── The posts ────────────────────────────────────────────────────────────────

function FacebookPreview({ name, logo, text, media, mediaList, timeLabel = "Just now", clamp, counts, moreHref }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        <Avatar name={name} logo={logo} color="#1877F2" size={40} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-semibold text-gray-900">{name}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            {timeLabel} · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="ml-auto h-5 w-5 text-gray-500" />
      </div>
      <Text text={text} className="px-3 pb-2.5" clamp={clamp} moreHref={moreHref} />
      <MediaGallery items={mediaList?.length ? mediaList : media ? [media] : []} layout="facebook" className="max-h-110" />
      {counts ? (
        <CountsRow counts={counts} />
      ) : (
        <ActionRow actions={[[ThumbsUp, "Like"], [MessageCircle, "Comment"], [Share2, "Share"]]} />
      )}
    </Card>
  );
}

function InstagramPreview({ name, logo, text, media, mediaList, clamp, moreHref }) {
  const items = mediaList?.length ? mediaList : media ? [media] : [];
  const handle = (name || "brand").toLowerCase().replace(/[^a-z0-9_.]/g, "");
  return (
    <Card>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* The story ring */}
        <span className="rounded-full bg-linear-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[2px]">
          <span className="block rounded-full bg-surface p-[2px]">
            <Avatar name={name} logo={logo} color="#E1306C" size={28} />
          </span>
        </span>
        <p className="text-[13px] font-semibold text-gray-900">{handle}</p>
        <MoreHorizontal className="ml-auto h-5 w-5 text-gray-800" />
      </div>
      {items.length ? <MediaGallery items={items} layout="carousel" /> : <Media media={null} className="aspect-square" placeholder />}
      <div className="flex items-center gap-4 px-3 pt-2.5 text-gray-900">
        <Heart className="h-6 w-6" />
        <MessageCircle className="h-6 w-6 -scale-x-100" />
        <Send className="h-6 w-6" />
        <Bookmark className="ml-auto h-6 w-6" />
      </div>
      <div className="px-3 pb-3 pt-2">
        {text.trim() ? (
          <ClampedText lines={clamp || 99} moreLabel="more" moreHref={moreHref}>
            <span className="mr-1 font-semibold">{handle}</span>
            {text}
          </ClampedText>
        ) : (
          <Text text={text} />
        )}
      </div>
    </Card>
  );
}

function TwitterPreview({ name, logo, text, media, mediaList, timeLabel = "now", clamp, moreHref }) {
  const handle = `@${(name || "brand").toLowerCase().replace(/[^a-z0-9_]/g, "")}`;
  const items = mediaList?.length ? mediaList : media ? [media] : [];
  return (
    <Card>
      <div className="flex gap-2.5 px-3 py-3">
        <Avatar name={name} logo={logo} color="#14171A" size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-[15px] leading-tight">
            <span className="truncate font-bold text-gray-900">{name}</span>
            <span className="shrink-0 text-gray-500">{handle} · {timeLabel}</span>
            <MoreHorizontal className="ml-auto h-4.5 w-4.5 shrink-0 text-gray-500" />
          </p>
          <Text text={text} className="mt-0.5 text-[15px]" clamp={clamp} moreLabel="Show more" moreHref={moreHref} />
          {items.length > 0 && (
            <div className={`mt-2.5 ${items.length === 1 ? "overflow-hidden rounded-2xl border border-gray-200" : ""}`}>
              <MediaGallery items={items} layout="twitter" className="max-h-90" />
            </div>
          )}
          <div className="mt-2.5 flex items-center justify-between pr-4 text-gray-500">
            <MessageCircle className="h-4.5 w-4.5" />
            <Repeat2 className="h-4.5 w-4.5" />
            <Heart className="h-4.5 w-4.5" />
            <Share2 className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PinterestPreview({ name, logo, text, media, options, clamp, moreHref }) {
  // The pin's title: the one set for Pinterest, else the text's first line
  // (what the publisher uses). The description is the text — left out when
  // it would only repeat the title.
  const title = options?.title?.trim() || firstLine(text);
  const description = text.trim() === title ? "" : text;
  return (
    <div className="bg-surface px-3 pb-4 pt-1">
      <div className="relative overflow-hidden rounded-3xl">
        <Media media={media} className="max-h-120 rounded-3xl" placeholder />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-900">
          <Heart className="h-5.5 w-5.5" />
          <MessageCircle className="h-5.5 w-5.5" />
          <Share2 className="h-5.5 w-5.5" />
          <MoreHorizontal className="h-5.5 w-5.5" />
        </div>
        <span className="rounded-full bg-[#E60023] px-4 py-2.5 text-sm font-semibold text-white">Save</span>
      </div>
      {title ? (
        <p className="mt-3 text-[17px] font-semibold leading-snug text-gray-900">{title}</p>
      ) : (
        <p className="mt-3 text-[17px] font-semibold italic text-gray-300">Pin title</p>
      )}
      {description && (
        <Text text={description} className="mt-1 text-gray-600" clamp={clamp || 3} moreLabel="more" moreHref={moreHref} />
      )}
      <div className="mt-3 flex items-center gap-2">
        <Avatar name={name} logo={logo} color="#E60023" size={32} />
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <span className="ml-auto rounded-full bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-900">Follow</span>
      </div>
    </div>
  );
}

function YouTubePreview({ name, logo, text, media, options, timeLabel = "just now" }) {
  const title = options?.title?.trim() || firstLine(text) || "Untitled";
  return (
    <Card>
      <div className="relative aspect-video bg-black">
        {media ? <MediaFill item={media} fit="contain" /> : <Media media={null} className="aspect-video" placeholder />}
      </div>
      <div className="flex gap-3 px-3 py-3">
        <Avatar name={name} logo={logo} color="#FF0000" size={36} />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{name} · No views · {timeLabel}</p>
        </div>
        <MoreHorizontal className="ml-auto h-4.5 w-4.5 shrink-0 rotate-90 text-gray-600" />
      </div>
    </Card>
  );
}

/** The clip — filling whatever box it's put in. */
function TikTokClip({ media }) {
  if (!media)
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/25">
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  if (media.type === "video")
    return (
      <video
        src={srcOf(media)}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={srcOf(media)} alt={media.alt || ""} className="absolute inset-0 h-full w-full object-cover" />
  );
}

const TIKTOK_ACTIONS = [
  { id: "like", Icon: Heart, label: "0" },
  { id: "comment", Icon: MessageCircle, label: "0" },
  { id: "save", Icon: Bookmark, label: "0" },
  { id: "share", Icon: Share2, label: "Share" },
];

/** The caption block — handle, optional title, text, sound line. */
function TikTokCaption({ handle, title, text, name, dark = true }) {
  const tone = dark ? "text-white drop-shadow" : "text-gray-900";
  return (
    <>
      <p className={`text-sm font-semibold ${tone}`}>{handle}</p>
      {title && <p className={`mt-0.5 text-[13px] font-semibold ${tone}`}>{title}</p>}
      {text.trim() ? (
        <p className={`mt-0.5 line-clamp-3 whitespace-pre-line wrap-break-word text-[13px] leading-snug ${tone}`}>
          {text}
        </p>
      ) : (
        <p className={`mt-0.5 text-[13px] italic ${dark ? "text-white/50" : "text-gray-300"}`}>
          Your caption will appear here
        </p>
      )}
      <p className={`mt-1.5 flex items-center gap-1.5 truncate text-[12px] ${dark ? "text-white/90" : "text-gray-500"}`}>
        <span aria-hidden="true">♫</span> original sound · {name}
      </p>
    </>
  );
}

/**
 * TikTok.
 *   phone    the app: the clip fills the screen, For You tabs on top, the
 *            action column down the right, caption over the bottom, and the
 *            app's own bottom bar.
 *   desktop  tiktok.com's feed: account row and caption above, the 9:16 clip
 *            on the left, the action buttons in a column beside it.
 */
function TikTokPreview({ name, logo, text, media, options, device = "phone" }) {
  const handle = `@${(name || "brand").toLowerCase().replace(/[^a-z0-9_.]/g, "")}`;
  const title = options?.title?.trim();

  if (device === "desktop")
    return (
      <Card>
        <div className="flex items-start gap-3 p-4">
          <Avatar name={name} logo={logo} color="#010101" size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-bold text-gray-900">{name}</span>{" "}
              <span className="text-gray-400">{handle}</span>
            </p>
            <div className="mt-1">
              <TikTokCaption handle="" title={title} text={text} name={name} dark={false} />
            </div>
          </div>
          <span className="shrink-0 rounded-md border border-[#FE2C55] px-4 py-1 text-sm font-semibold text-[#FE2C55]">
            Follow
          </span>
        </div>
        <div className="flex items-end gap-4 px-4 pb-4 pl-18">
          <div className="relative aspect-9/16 w-60 overflow-hidden rounded-xl bg-black">
            <TikTokClip media={media} />
          </div>
          <div className="flex flex-col gap-3">
            {TIKTOK_ACTIONS.map(({ id, Icon, label }) => (
              <span key={id} className="flex flex-col items-center gap-1">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-800">
                  <Icon className="h-5 w-5" fill={Icon === Heart ? "currentColor" : "none"} />
                </span>
                <span className="text-[11px] font-semibold text-gray-600">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </Card>
    );

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <TikTokClip media={media} />

        {/* Top tabs */}
        <div className="absolute inset-x-0 top-0 flex justify-center gap-4 bg-linear-to-b from-black/50 to-transparent pb-6 pt-9 text-[13px] font-semibold">
          <span className="text-white/60">Following</span>
          <span className="border-b-2 border-white pb-0.5 text-white">For You</span>
        </div>

        {/* Right-hand action column */}
        <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3.5 text-white">
          <span className="relative mb-1">
            <span className="block rounded-full ring-2 ring-white">
              <Avatar name={name} logo={logo} color="#010101" size={38} />
            </span>
            <span className="absolute -bottom-2 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-[#FE2C55] text-[11px] font-bold leading-none">
              +
            </span>
          </span>
          {TIKTOK_ACTIONS.map(({ id, Icon, label }) => (
            <span key={id} className="flex flex-col items-center gap-0.5">
              <Icon className="h-6 w-6 drop-shadow" fill={Icon === Heart ? "currentColor" : "none"} />
              <span className="text-[10px] font-semibold drop-shadow">{label}</span>
            </span>
          ))}
          {/* Spinning sound disc */}
          <span className="mt-1 flex h-8 w-8 animate-spin items-center justify-center rounded-full bg-linear-to-br from-gray-700 to-gray-900 [animation-duration:4s]">
            <span className="h-3 w-3 overflow-hidden rounded-full">
              <Avatar name={name} logo={logo} color="#010101" size={12} />
            </span>
          </span>
        </div>

        {/* Caption over the bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent px-3 pb-4 pr-14 pt-10">
          <TikTokCaption handle={handle} title={title} text={text} name={name} />
        </div>
      </div>

      {/* The app's bottom bar */}
      <div className="flex shrink-0 items-center justify-around bg-black px-2 pb-5 pt-2 text-[9px] font-medium text-white/80">
        <span className="text-white">Home</span>
        <span>Friends</span>
        <span className="flex h-6 w-10 items-center justify-center rounded-md bg-white text-base font-bold leading-none text-black shadow-[-2px_0_0_#25F4EE,2px_0_0_#FE2C55]">
          +
        </span>
        <span>Inbox</span>
        <span>Profile</span>
      </div>
    </div>
  );
}

/**
 * A Reel, Story or Short — the full-screen 9:16 player each app shows them in.
 *   story        progress bar and account on top, the media, "Send message"
 *                at the bottom. A story shows no caption.
 *   reel / short the media with the action column down the right, and the
 *                account, caption (a Short's title) and sound line at the bottom.
 * On a phone it fills the screen; on desktop it is the same player as a card.
 */
function VerticalPreview({ platform, postType, name, logo, text, media, options, timeLabel = "Just now" }) {
  const device = useContext(DeviceContext);
  const color = COMPOSER_PLATFORMS[platform]?.color || "#111";
  const kind = postType?.id;
  const story = kind === "story";
  const caption = kind === "short" ? options?.title?.trim() || firstLine(text) : text;
  const actions =
    kind === "short"
      ? [[ThumbsUp, "Like"], [MessageCircle, "0"], [Share2, "Share"], [Repeat2, "Remix"]]
      : [[platform === "instagram" ? Heart : ThumbsUp, "0"], [MessageCircle, "0"], [Send, "Send"]];

  const player = (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <TikTokClip media={media} />
      {!media && (
        <p className="absolute inset-x-0 top-[58%] text-center text-xs text-white/60">
          {postType?.media === "video" ? "Video not available" : "Video/image not available"}
        </p>
      )}

      {story ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-linear-to-b from-black/50 to-transparent px-3 pb-6 pt-9">
            <span className="block h-0.5 rounded-full bg-white/40">
              <span className="block h-full w-1/3 rounded-full bg-white" />
            </span>
            <span className="mt-2.5 flex items-center gap-2 text-white">
              <Avatar name={name} logo={logo} color={color} size={28} />
              <span className="text-[13px] font-semibold drop-shadow">{name}</span>
              <span className="text-[12px] text-white/70">{timeLabel}</span>
              <MoreHorizontal className="ml-auto h-4 w-4" />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-3 pb-5 pt-8 text-white">
            <span className="flex-1 rounded-full border border-white/60 px-3.5 py-1.5 text-[12px] text-white/90">
              Send message
            </span>
            <Heart className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pb-6 pt-9 text-[15px] font-bold text-white drop-shadow">
            {kind === "short" ? "Shorts" : "Reels"}
            <Search className="h-5 w-5" />
          </div>
          <div className="absolute bottom-5 right-2.5 flex flex-col items-center gap-4 text-white">
            {actions.map(([Icon, label], i) => (
              <span key={i} className="flex flex-col items-center gap-0.5">
                <Icon className="h-6 w-6 drop-shadow" />
                <span className="text-[10px] font-semibold drop-shadow">{label}</span>
              </span>
            ))}
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent px-3 pb-5 pr-14 pt-12 text-white">
            <span className="flex items-center gap-2">
              <Avatar name={name} logo={logo} color={color} size={28} />
              <span className="truncate text-[13px] font-semibold drop-shadow">{name}</span>
              <span className="rounded-md border border-white/80 px-2 py-0.5 text-[11px] font-semibold">
                {kind === "short" ? "Subscribe" : "Follow"}
              </span>
            </span>
            {caption?.trim() ? (
              <p className="mt-1.5 line-clamp-2 whitespace-pre-line wrap-break-word text-[12.5px] leading-snug drop-shadow">
                {caption}
              </p>
            ) : (
              <p className="mt-1.5 text-[12.5px] italic text-white/50">Your text will appear here</p>
            )}
            <p className="mt-1 truncate text-[11px] text-white/85">♫ {name} · Original audio</p>
          </div>
        </>
      )}
    </div>
  );

  if (device === "phone") return player;
  return <div className="mx-auto aspect-9/16 w-72 overflow-hidden rounded-xl shadow-lg">{player}</div>;
}

/** LinkedIn — the feed card: name, a follower line, text, media, the four actions. */
function LinkedInPreview({ name, logo, text, media, mediaList, timeLabel = "Now", clamp, moreHref }) {
  return (
    <Card>
      <div className="flex items-start gap-2.5 px-3 pb-2 pt-3">
        <Avatar name={name} logo={logo} color="#0A66C2" size={44} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <p className="truncate text-xs text-gray-500">Followers</p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            {timeLabel} · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="ml-auto h-5 w-5 shrink-0 text-gray-500" />
      </div>
      <Text text={text} className="px-3 pb-2.5" clamp={clamp || 3} moreLabel="…more" moreHref={moreHref} />
      <MediaGallery items={mediaList?.length ? mediaList : media ? [media] : []} layout="facebook" className="max-h-110" />
      <ActionRow actions={[[ThumbsUp, "Like"], [MessageCircle, "Comment"], [Repeat2, "Repost"], [Send, "Send"]]} />
    </Card>
  );
}

function GenericPreview({ platform, name, logo, text, media, mediaList, timeLabel = "now", clamp, moreHref }) {
  const meta = COMPOSER_PLATFORMS[platform];
  return (
    <Card>
      <div className="flex items-center gap-2.5 px-3 py-3">
        <Avatar name={name} logo={logo} color={meta?.color || "#374151"} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-[11px] text-gray-400">{meta?.label} · {timeLabel}</p>
        </div>
        <MoreHorizontal className="ml-auto h-4 w-4 text-gray-400" />
      </div>
      <Text text={text} className="px-3 pb-3" clamp={clamp} moreHref={moreHref} />
      <MediaGallery items={mediaList?.length ? mediaList : media ? [media] : []} layout="facebook" className="max-h-96" />
    </Card>
  );
}

const PREVIEWS = {
  facebook: FacebookPreview,
  instagram: InstagramPreview,
  twitter: TwitterPreview,
  pinterest: PinterestPreview,
  youtube: YouTubePreview,
  tiktok: TikTokPreview,
  linkedin: LinkedInPreview,
};

// ── The device and the app around the post ───────────────────────────────────

/** The status bar's right side: signal, wifi, battery. */
function StatusIcons({ light }) {
  return (
    <span className={`flex items-center gap-1 ${light ? "text-white" : "text-gray-900"}`}>
      <span className="flex items-end gap-[1.5px]" aria-hidden="true">
        {[4, 6, 8, 10].map((h) => (
          <span key={h} className="w-[3px] rounded-[1px] bg-current" style={{ height: h }} />
        ))}
      </span>
      <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
      <BatteryFull className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

const TabBar = ({ children, className = "" }) => (
  <nav className={`flex shrink-0 items-center justify-around border-t border-gray-200 bg-surface px-2 pb-5 pt-2 text-gray-700 ${className}`}>
    {children}
  </nav>
);

/**
 * Inside the phone: the network's app around its feed — top bar, feed, bottom
 * tabs — so the post reads as being IN that app.
 */
function AppChrome({ platform, name, logo, children }) {
  const icon = "h-5.5 w-5.5";
  switch (platform) {
    case "facebook":
      return (
        <div className="flex h-full flex-col bg-[#f0f2f5]">
          <header className="shrink-0 bg-surface">
            <div className="flex items-center justify-between px-3 pt-1">
              <span className="text-[26px] font-extrabold tracking-tighter text-[#1877F2]">facebook</span>
              <span className="flex gap-2">
                {[Plus, Search, MessageCircle].map((I, i) => (
                  <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-900">
                    <I className="h-4.5 w-4.5" />
                  </span>
                ))}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-around border-b border-gray-200 text-gray-500">
              {[Home, Tv, Users, Store, Bell, Menu].map((I, i) => (
                <span key={i} className={`flex flex-1 justify-center py-2 ${i === 0 ? "border-b-[3px] border-[#1877F2] text-[#1877F2]" : ""}`}>
                  <I className="h-5.5 w-5.5" />
                </span>
              ))}
            </div>
          </header>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pt-2">{children}</div>
        </div>
      );
    case "instagram":
      return (
        <div className="flex h-full flex-col bg-surface">
          <header className="flex shrink-0 items-center justify-between px-3 py-1.5">
            <span className="font-serif text-[24px] font-semibold italic tracking-tight text-gray-900">Instagram</span>
            <span className="flex gap-4 text-gray-900">
              <Heart className={icon} />
              <MessageCircle className={`${icon} -scale-x-100`} />
            </span>
          </header>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-gray-100">{children}</div>
          <TabBar className="text-gray-900">
            <Home className={icon} />
            <Search className={icon} />
            <PlusSquare className={icon} />
            <Clapperboard className={icon} />
            <Avatar name={name} logo={logo} color="#E1306C" size={24} />
          </TabBar>
        </div>
      );
    case "twitter":
      return (
        <div className="flex h-full flex-col bg-surface">
          <header className="shrink-0 border-b border-gray-200">
            <div className="flex items-center justify-between px-3 py-1.5">
              <Avatar name={name} logo={logo} color="#14171A" size={28} />
              <FaXTwitter className="h-5.5 w-5.5 text-gray-900" />
              <span className="w-7" />
            </div>
            <div className="flex text-[14px]">
              <span className="flex flex-1 justify-center">
                <span className="border-b-4 border-[#1d9bf0] pb-2.5 pt-1 font-bold text-gray-900">For you</span>
              </span>
              <span className="flex flex-1 justify-center pb-2.5 pt-1 font-medium text-gray-500">Following</span>
            </div>
          </header>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
          <TabBar className="text-gray-900">
            <Home className={icon} />
            <Search className={icon} />
            <Users className={icon} />
            <Bell className={icon} />
            <Mail className={icon} />
          </TabBar>
        </div>
      );
    case "linkedin":
      return (
        <div className="flex h-full flex-col bg-[#f4f2ee]">
          <header className="flex shrink-0 items-center gap-2.5 bg-surface px-3 py-2">
            <Avatar name={name} logo={logo} color="#0A66C2" size={30} />
            <span className="flex flex-1 items-center gap-1.5 rounded bg-[#edf3f8] px-2.5 py-1.5 text-xs text-gray-600">
              <Search className="h-3.5 w-3.5" /> Search
            </span>
            <MessageCircle className="h-5.5 w-5.5 text-gray-600" />
          </header>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pt-2">{children}</div>
          <TabBar className="text-gray-500">
            {[
              [Home, "Home"],
              [Users, "Network"],
              [PlusSquare, "Post"],
              [Bell, "Alerts"],
              [Briefcase, "Jobs"],
            ].map(([I, l], i) => (
              <span key={l} className={`flex flex-col items-center gap-0.5 text-[9px] ${i === 0 ? "text-gray-900" : ""}`}>
                <I className="h-5 w-5" />
                {l}
              </span>
            ))}
          </TabBar>
        </div>
      );
    case "pinterest":
      return (
        <div className="flex h-full flex-col bg-surface">
          <header className="flex shrink-0 items-center justify-between px-3 py-1.5 text-gray-900">
            <ChevronLeft className="h-6 w-6" />
            <FaPinterest className="h-5 w-5 text-[#E60023]" />
            <MoreHorizontal className="h-5.5 w-5.5" />
          </header>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
          <TabBar className="text-gray-900">
            <Home className={icon} />
            <Search className={icon} />
            <Plus className={icon} />
            <MessageCircle className={icon} />
            <Avatar name={name} logo={logo} color="#E60023" size={24} />
          </TabBar>
        </div>
      );
    case "youtube":
      return (
        <div className="flex h-full flex-col bg-surface">
          <header className="flex shrink-0 items-center justify-between px-3 py-1.5">
            <span className="flex items-center gap-1 text-[17px] font-bold tracking-tighter text-gray-900">
              <FaYoutube className="h-6 w-6 text-[#FF0000]" /> YouTube
            </span>
            <span className="flex gap-4 text-gray-900">
              <Cast className="h-5 w-5" />
              <Bell className="h-5 w-5" />
              <Search className="h-5 w-5" />
            </span>
          </header>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
          <TabBar className="text-gray-900">
            {[
              [Home, "Home"],
              [Zap, "Shorts"],
              [Plus, ""],
              [Tv, "Subscriptions"],
            ].map(([I, l], i) => (
              <span key={i} className="flex flex-col items-center gap-0.5 text-[9px]">
                <I className={l ? "h-5 w-5" : "h-8 w-8 rounded-full border border-gray-300 p-1.5"} />
                {l}
              </span>
            ))}
            <span className="flex flex-col items-center gap-0.5 text-[9px]">
              <Avatar name={name} logo={logo} color="#FF0000" size={20} />
              You
            </span>
          </TabBar>
        </div>
      );
    default:
      return <div className="hide-scrollbar h-full overflow-y-auto bg-gray-100 py-2">{children}</div>;
  }
}

/**
 * A phone: rounded body, status bar (time, notch, signal / wifi / battery),
 * the network's app, and the home bar. TikTok's app runs edge to edge under a
 * light status bar.
 *
 * @param {object} props
 * @param {string} props.platform
 * @param {string} [props.name]   Account name (the app's own avatar spots).
 * @param {string} [props.logo]
 */
export function PhoneFrame({ platform, name, logo, immersive: fullScreen = false, children }) {
  // TikTok is always full screen; a Reel / Story / Short is too.
  const immersive = fullScreen || platform === "tiktok";
  return (
    <div className="relative mx-auto aspect-[9/19] h-full max-h-[640px] min-h-[480px] max-w-full rounded-[2.75rem] bg-gray-900 p-[10px] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.45)] ring-1 ring-gray-700">
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-gray-700" aria-hidden="true" />
      <span className="absolute -left-[3px] top-40 h-12 w-[3px] rounded-l bg-gray-700" aria-hidden="true" />
      <span className="absolute -right-[3px] top-36 h-16 w-[3px] rounded-r bg-gray-700" aria-hidden="true" />

      <div className={`relative flex h-full flex-col overflow-hidden rounded-[2.2rem] ${immersive ? "bg-black" : "bg-surface"}`}>
        {/* Status bar */}
        <div
          className={`z-10 flex shrink-0 items-center justify-between px-6 pb-1 pt-3 text-[12px] font-semibold ${
            immersive ? "absolute inset-x-0 top-0 text-white" : "text-gray-900"
          }`}
        >
          <span>9:41</span>
          <StatusIcons light={immersive} />
        </div>
        {/* The notch */}
        <span className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />

        <div className="min-h-0 flex-1">
          {immersive ? children : (
            <AppChrome platform={platform} name={name} logo={logo}>
              {children}
            </AppChrome>
          )}
        </div>

        {/* Home bar */}
        <span
          className={`absolute bottom-1.5 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full ${immersive ? "bg-white/80" : "bg-gray-900"}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

const SITES = {
  facebook: { host: "facebook.com", bg: "bg-[#f0f2f5]", Icon: FaFacebook, color: "#1877F2" },
  instagram: { host: "instagram.com", bg: "bg-surface" },
  twitter: { host: "x.com", bg: "bg-surface", Icon: FaXTwitter, color: "#0f1419" },
  linkedin: { host: "linkedin.com/feed", bg: "bg-[#f4f2ee]", Icon: FaLinkedin, color: "#0A66C2" },
  tiktok: { host: "tiktok.com", bg: "bg-surface" },
  youtube: { host: "youtube.com", bg: "bg-surface", Icon: FaYoutube, color: "#FF0000" },
  pinterest: { host: "pinterest.com", bg: "bg-surface", Icon: FaPinterest, color: "#E60023" },
};

/** A browser window open on the network's site, the post in its feed column. */
export function DesktopFrame({ platform, children }) {
  const site = SITES[platform] || { host: "", bg: "bg-gray-100" };
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-300 bg-surface shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]">
      {/* Window bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-surface px-3 py-1 text-[11px] text-gray-500">
          {site.Icon && <site.Icon className="h-3 w-3" style={{ color: site.color }} />}
          {site.host}
        </span>
        <span className="w-10" />
      </div>
      <div className={`max-h-[560px] overflow-y-auto px-6 py-5 ${site.bg}`}>
        <div className="mx-auto max-w-[500px]">{children}</div>
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.platform
 * @param {string} props.name     Account / brand name shown on the post.
 * @param {string} [props.logo]
 * @param {string} props.text
 * @param {object|null} props.media  { type, url, previewUrl, alt? } — the first file
 * @param {object[]} [props.mediaList] Every attached file, in order — networks
 *   that show several lay them out in their own grid.
 * @param {object} [props.options]   That network's extra fields (title…).
 * @param {"phone"|"desktop"} [props.device] Edge to edge in a phone feed, or a card.
 * @param {string} [props.timeLabel] When it went out (defaults to "now" — the
 *                                   composer's case); a published post's date.
 * @param {number} [props.clamp]     Cut the text to this many lines with
 *                                   "See more" — a published post's preview.
 * @param {{likes?: string, comments?: string, shares?: string}} [props.counts]
 *                                   A published post's counts (Facebook shows
 *                                   them in place of the Like/Comment/Share row).
 */
export default function PostPreview(props) {
  const Preview = props.postType?.vertical
    ? VerticalPreview
    : PREVIEWS[props.platform] || GenericPreview;
  return (
    <DeviceContext.Provider value={props.device === "phone" ? "phone" : "desktop"}>
      <Preview {...props} />
    </DeviceContext.Provider>
  );
}
