"use client";

// app/(components)/composer/PostPreview.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Read-only approximations of how a composed post will look on each network —
// the right-hand side of the Create Post composer. Approximations on purpose:
// the composer says so under them, the way Metricool does, because no network
// publishes a pixel-exact spec of its feed.

import { useLayoutEffect, useRef, useState } from "react";
import {
  Bookmark,
  Globe,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
  ImageIcon,
} from "lucide-react";
import { COMPOSER_PLATFORMS, firstLine } from "./composerPlatforms";

/** Brand avatar — the logo, or the initial on the network's colour. */
function Avatar({ name, logo, color, size = 36 }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
      style={{ background: color, width: size, height: size }}
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

/** The post's image or video, or a quiet placeholder when there is none yet. */
function Media({ media, className = "", placeholder = false }) {
  if (!media) {
    if (!placeholder) return null;
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}>
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  if (media.type === "video")
    return (
      <video
        src={media.previewUrl || media.url}
        className={`w-full bg-black object-contain ${className}`}
        controls
        playsInline
        preload="metadata"
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media.previewUrl || media.url} alt="" className={`w-full object-cover ${className}`} />
  );
}

/**
 * Text cut to a few lines with the network's own "See more" after it, the way
 * a feed shows a long post. The link only appears when the text really runs
 * past the cut, and opens it in place.
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

  // A link, sat at the end of the last visible line like the network's own:
  // with `moreHref` it opens the post on the network, without one it opens the
  // text in place.
  // Blue, with an underline that draws in from the left on hover / focus.
  const linkCls =
    "cursor-pointer font-semibold text-[#003dda] bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-bottom-left bg-size-[0%_1px] transition-[background-size,opacity] duration-300 ease-out hover:bg-size-[100%_1px] hover:opacity-85 focus-visible:bg-size-[100%_1px] focus-visible:outline-none";

  return (
    <div className={`relative ${className}`}>
      <p
        ref={ref}
        className="whitespace-pre-line wrap-break-word text-sm text-gray-800"
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
  return <p className={`whitespace-pre-line wrap-break-word text-sm text-gray-800 ${className}`}>{text}</p>;
}

const Card = ({ children }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-sm">{children}</div>
);

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

function FacebookPreview({ name, logo, text, media, timeLabel = "Just now", clamp, counts, moreHref }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color="#1877F2" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="flex items-center gap-1 text-[11px] text-gray-400">
            {timeLabel} · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="ml-auto h-4 w-4 text-gray-400" />
      </div>
      <Text text={text} className="px-3 pb-3" clamp={clamp} moreHref={moreHref} />
      <Media media={media} className="max-h-96" />
      {counts ? (
        <CountsRow counts={counts} />
      ) : (
        <div className="flex items-center justify-around border-t border-gray-100 px-3 py-2 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> Like</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Comment</span>
          <span className="flex items-center gap-1.5"><Share2 className="h-4 w-4" /> Share</span>
        </div>
      )}
    </Card>
  );
}

function InstagramPreview({ name, logo, text, media, clamp, moreHref }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color="#E1306C" size={32} />
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <MoreHorizontal className="ml-auto h-4 w-4 text-gray-400" />
      </div>
      <Media media={media} className="aspect-square" placeholder />
      <div className="flex items-center gap-4 px-3 pt-2.5 text-gray-800">
        <Heart className="h-5 w-5" />
        <MessageCircle className="h-5 w-5" />
        <Send className="h-5 w-5" />
        <Bookmark className="ml-auto h-5 w-5" />
      </div>
      <div className="px-3 py-2.5">
        {text.trim() && clamp ? (
          <ClampedText lines={clamp} moreLabel="more" moreHref={moreHref}>
            <span className="mr-1 font-semibold">{name}</span>
            {text}
          </ClampedText>
        ) : text.trim() ? (
          <p className="whitespace-pre-line wrap-break-word text-sm text-gray-800">
            <span className="mr-1 font-semibold">{name}</span>
            {text}
          </p>
        ) : (
          <Text text={text} />
        )}
      </div>
    </Card>
  );
}

function TwitterPreview({ name, logo, text, media, timeLabel = "now", clamp, moreHref }) {
  const handle = `@${(name || "brand").toLowerCase().replace(/[^a-z0-9_]/g, "")}`;
  return (
    <Card>
      <div className="flex gap-3 p-3">
        <Avatar name={name} logo={logo} color="#14171A" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            <span className="font-semibold text-gray-900">{name}</span>{" "}
            <span className="text-gray-400">{handle} · {timeLabel}</span>
          </p>
          <Text text={text} className="mt-0.5" clamp={clamp} moreLabel="Show more" moreHref={moreHref} />
          {media && (
            <div className="mt-2.5 overflow-hidden rounded-2xl border border-gray-200">
              <Media media={media} className="max-h-80" />
            </div>
          )}
          <div className="mt-2.5 flex items-center justify-between pr-6 text-gray-400">
            <MessageCircle className="h-4 w-4" />
            <Repeat2 className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <Share2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PinterestPreview({ name, logo, text, media, options, clamp, moreHref }) {
  const title = options?.title?.trim() || firstLine(text);
  return (
    <div className="mx-auto max-w-72">
      <div className="overflow-hidden rounded-2xl">
        <Media media={media} className="max-h-112 rounded-2xl" placeholder />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-800">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Share2 className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-[#E60023] px-4 py-2 text-sm font-semibold text-white">Save</span>
      </div>
      {title && <p className="mt-2 text-base font-semibold text-gray-900">{title}</p>}
      <Text text={text} className="mt-1 text-gray-600" clamp={clamp} moreLabel="more" moreHref={moreHref} />
      <div className="mt-2 flex items-center gap-2">
        <Avatar name={name} logo={logo} color="#E60023" size={28} />
        <p className="text-sm font-semibold text-gray-900">{name}</p>
      </div>
    </div>
  );
}

function YouTubePreview({ name, logo, text, media, options, timeLabel = "just now" }) {
  const title = options?.title?.trim() || firstLine(text) || "Untitled";
  return (
    <Card>
      <Media media={media} className="aspect-video" placeholder />
      <div className="flex gap-3 p-3">
        <Avatar name={name} logo={logo} color="#FF0000" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400">{name} · {timeLabel}</p>
        </div>
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
        src={media.previewUrl || media.url}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media.previewUrl || media.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
        <div className="absolute inset-x-0 top-0 flex justify-center gap-4 bg-linear-to-b from-black/50 to-transparent pb-6 pt-8 text-[13px] font-semibold">
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
      <div className="flex shrink-0 items-center justify-around bg-black px-2 pb-3 pt-2 text-[9px] font-medium text-white/80">
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

/** LinkedIn — the feed card: name, a follower line, text, media, the four actions. */
function LinkedInPreview({ name, logo, text, media, timeLabel = "Now", clamp, moreHref }) {
  return (
    <Card>
      <div className="flex items-start gap-2.5 p-3">
        <Avatar name={name} logo={logo} color="#0A66C2" size={44} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <p className="truncate text-[11px] text-gray-500">Followers</p>
          <p className="flex items-center gap-1 text-[11px] text-gray-400">
            {timeLabel} · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
      </div>
      <Text text={text} className="px-3 pb-3" clamp={clamp} moreHref={moreHref} />
      <Media media={media} className="max-h-96" />
      <div className="flex items-center justify-around border-t border-gray-100 px-2 py-2 text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> Like</span>
        <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Comment</span>
        <span className="flex items-center gap-1.5"><Repeat2 className="h-4 w-4" /> Repost</span>
        <span className="flex items-center gap-1.5"><Send className="h-4 w-4" /> Send</span>
      </div>
    </Card>
  );
}

function GenericPreview({ platform, name, logo, text, media, timeLabel = "now", clamp, moreHref }) {
  const meta = COMPOSER_PLATFORMS[platform];
  return (
    <Card>
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color={meta?.color || "#374151"} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-[11px] text-gray-400">{meta?.label} · {timeLabel}</p>
        </div>
        <MoreHorizontal className="ml-auto h-4 w-4 text-gray-400" />
      </div>
      <Text text={text} className="px-3 pb-3" clamp={clamp} moreHref={moreHref} />
      <Media media={media} className="max-h-96" />
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

/**
 * @param {object} props
 * @param {string} props.platform
 * @param {string} props.name     Account / brand name shown on the post.
 * @param {string} [props.logo]
 * @param {string} props.text
 * @param {object|null} props.media  { type, url, previewUrl }
 * @param {object} [props.options]   That network's extra fields (title…).
 * @param {string} [props.timeLabel] When it went out (defaults to "now" — the
 *                                   composer's case); a published post's date.
 * @param {number} [props.clamp]     Cut the text to this many lines with
 *                                   "See more" — a published post's preview.
 * @param {{likes?: string, comments?: string, shares?: string}} [props.counts]
 *                                   A published post's counts (Facebook shows
 *                                   them in place of the Like/Comment/Share row).
 */
export default function PostPreview(props) {
  const Preview = PREVIEWS[props.platform] || GenericPreview;
  return <Preview {...props} />;
}
