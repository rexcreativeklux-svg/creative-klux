"use client";

/**
 * PostInsightsPanel — one social post in the network-insights layout
 * (ContentDetailsModal): its Overview / Views / Interactions from the backend's
 * numbers on the left, and the post as it sits in the network's feed on the
 * right. Shared by Social Publishing and Social Calendar, so a post opens the
 * same way from either.
 *
 * Pass the LIVE row (look it up in the page's list by id on every render) so
 * stats that land while the panel is open fill it in.
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen
 * @param {() => void} props.onClose
 * @param {object}   props.post          A normalized live row.
 * @param {object[]} props.allPosts      The page's rows — the "recent posts"
 *                                       comparison is drawn from them.
 * @param {boolean}  [props.statsLoading] This post's stats are on their way.
 * @param {string}   [props.accountName] The connected account's name.
 * @param {React.ReactNode} [props.badge]
 */

import { useState } from "react";
import { format } from "date-fns";
import { Play } from "lucide-react";
import ContentDetailsModal from "./ContentDetailsModal";
import PostPreview from "@/app/(components)/composer/PostPreview";
import { buildPostInsights } from "./postInsights";
import { SOCIAL_NETWORKS } from "./socialPlatformScope";
import { postMetrics, unavailableReason } from "@/(lib)/postMetrics";

const LABEL = Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.id, n.label]));
import { useAuth } from "@/context/AuthContext";

// The emoji the pages' platform pills already use, beside the label.
const ICON = {
  facebook: "🔵",
  instagram: "📸",
  twitter: "🐦",
  linkedin: "💼",
  tiktok: "🎵",
  youtube: "▶️",
  pinterest: "📌",
};

const when = (iso) => (iso ? format(new Date(iso), "MMM d, HH:mm") : undefined);

/**
 * The network's own embed player for a video post, or null. The post lists
 * don't carry a playable file (TikTok sends a cover image, share_url and id),
 * so the video plays through each network's official player, by id:
 *   TikTok     every post is a video — tiktok.com/player/v1/<id>
 *   YouTube    every post is a video — youtube.com/embed/<id>
 *   Pinterest  only pins whose media_type is "video"
 *   Facebook   its list doesn't say which posts are videos, but post-metrics
 *              sends `video_views` for one — those play in Facebook's own
 *              embedded-post player (plugins/post.php, from the permalink).
 *   Instagram  posts whose media_type is VIDEO / REELS — <permalink>embed.
 * A network can still refuse to play one (embedding off, not public); that
 * happens inside its player, so the panel always offers the link out too.
 */
function videoEmbed(post) {
  const id = post.post_id && encodeURIComponent(post.post_id);
  if (!id) return null;
  const metrics = postMetrics(post) || {};
  if (post.platform === "facebook" && "video_views" in metrics && post.permalink_url)
    return {
      src: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
        post.permalink_url,
      )}&show_text=false&width=500`,
      ratio: "aspect-square",
      bg: "bg-surface",
    };
  if (
    post.platform === "instagram" &&
    /video|reel/i.test(post.media_type || "") &&
    post.permalink_url
  )
    return {
      src: `${post.permalink_url.replace(/\/?$/, "/")}embed`,
      ratio: "aspect-[4/5]",
      bg: "bg-surface",
    };
  if (post.platform === "tiktok")
    return { src: `https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0`, ratio: "aspect-9/16" };
  if (post.platform === "youtube")
    return { src: `https://www.youtube.com/embed/${id}?autoplay=1`, ratio: "aspect-video" };
  if (post.platform === "pinterest" && /video/i.test(post.media_type || ""))
    return { src: `https://assets.pinterest.com/ext/embed.html?id=${id}`, ratio: "aspect-[9/16]" };
  return null;
}

/**
 * The feed preview, with a play button over it when the post is a video;
 * pressing it swaps the preview for the network's player, in the same frame.
 */
function PlayablePreview({ post, children }) {
  const [playing, setPlaying] = useState(false);
  const embed = videoEmbed(post);
  if (!embed) return children;
  if (playing)
    return (
      <div>
        <div
          className={`mx-auto w-full max-w-72 overflow-hidden rounded-xl ${embed.bg || "bg-black"} ${embed.ratio}`}
        >
          <iframe
            src={embed.src}
            title={`${post.project_title || "Video"} — player`}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
            allowFullScreen
          />
        </div>
        {/* The network may refuse to play it here (embedding turned off, not
            public) — that happens inside its player, out of our reach. */}
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-500">
          {post.permalink_url && (
            <a
              href={post.permalink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#003dda] hover:underline"
            >
              Not playing? Watch it on {LABEL[post.platform] || "the network"}
            </a>
          )}
          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="cursor-pointer hover:text-gray-800 hover:underline"
          >
            Back to preview
          </button>
        </div>
      </div>
    );
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label="Play video"
        className="group absolute inset-0 flex cursor-pointer items-center justify-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 group-hover:bg-black/70">
          <Play className="ml-1 h-7 w-7 fill-current" />
        </span>
      </button>
    </div>
  );
}

export default function PostInsightsPanel({
  isOpen,
  onClose,
  post,
  allPosts = [],
  statsLoading = false,
  accountName,
  badge,
}) {
  const { activeBrand } = useAuth();
  if (!post) return null;

  const label = SOCIAL_NETWORKS.find((n) => n.id === post.platform)?.label || post.platform;
  const date = post.status === "scheduled" ? post.scheduled_at : post.published_at;
  // Overview / Views / Interactions, from the backend's numbers.
  const insights = buildPostInsights(post, allPosts);

  return (
    <ContentDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      item={post}
      platformLabel={label}
      platformIcon={ICON[post.platform] || "🌐"}
      // Published posts read like the network's page; a scheduled one says so.
      badge={post.status === "scheduled" ? badge : null}
      dateLabel={
        date
          ? `${post.status === "scheduled" ? "Scheduled for" : "Published on"}: ${when(date)}`
          : undefined
      }
      statsLoading={statsLoading}
      insights={insights}
      metricsNote={unavailableReason(post)}
      preview={
        // The post as it sits in the feed — playable when it's a video. Keyed
        // by post so another post opens paused. TikTok's preview is the
        // full-screen app view, so it gets a phone-shaped box to fill.
        <PlayablePreview key={post.id} post={post}>
        <div
          className={
            post.platform === "tiktok"
              ? "mx-auto aspect-9/16 w-full max-w-64 overflow-hidden rounded-xl"
              : ""
          }
        >
          <PostPreview
            platform={post.platform}
            name={accountName || activeBrand?.name || "Your brand"}
            logo={activeBrand?.logo}
            text={post.caption || post.project_title || ""}
            media={post.image_url ? { type: "image", url: post.image_url } : null}
            options={{ title: post.project_title }}
            timeLabel={when(date)}
            clamp={2}
            // "See more" opens the post on the network, like a feed link.
            moreHref={post.permalink_url || undefined}
            counts={post.status === "published" ? insights.counts : undefined}
          />
        </div>
        </PlayablePreview>
      }
    />
  );
}
