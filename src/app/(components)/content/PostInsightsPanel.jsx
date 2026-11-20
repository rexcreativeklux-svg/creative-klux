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

import { format } from "date-fns";
import ContentDetailsModal from "./ContentDetailsModal";
import PostPreview from "@/app/(components)/composer/PostPreview";
import { buildPostInsights } from "./postInsights";
import { SOCIAL_NETWORKS } from "./socialPlatformScope";
import { unavailableReason } from "@/(lib)/postMetrics";
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
        // The post as it sits in the feed. TikTok's is the full-screen app
        // view, so it gets a phone-shaped box to fill.
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
      }
    />
  );
}
