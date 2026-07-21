"use client";

/**
 * EditPostModal — full-screen editor for an already-published (or scheduled) post.
 *
 * Reality check that drives this whole file: social networks barely let you edit a
 * post once it's live. So the UI shows every section from the compose flow, but a
 * per-platform capability map (EDIT_CAPS) decides what can actually change:
 *   • Facebook / Meta Ads → the text/caption can be pushed live.
 *   • Instagram + everyone else → nothing is editable on a published post.
 *   • A *scheduled* post hasn't gone live yet, so everything is freely editable locally.
 * Touching a locked field just toasts why it can't change — better UX than hiding it.
 */

import React, { useMemo, useState } from "react";
import {
  X,
  Lock,
  Globe,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Bookmark,
  ImagePlus,
  Pencil,
  Trash2,
  Sparkles,
  Users,
  Loader2,
  Info,
  Send,
  Repeat2,
  BarChart3,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  savePublishedPost,
  updatePostCaptionOnPlatform,
} from "../../../../../../(lib)/integration";

const BRAND = "#003dda";

/* What a platform lets you change on an ALREADY-PUBLISHED post. */
const EDIT_CAPS = {
  facebook: { text: true, media: false, platform: false, collaborators: false },
  meta_ads: { text: true, media: false, platform: false, collaborators: false },
  // YouTube (video description) and Pinterest (pin description) support live edits
  // via their APIs — wired through updatePostCaptionOnPlatform → /api/*/update.
  youtube: { text: true, media: false, platform: false, collaborators: false },
  pinterest: { text: true, media: false, platform: false, collaborators: false },
  instagram: {
    text: false,
    media: false,
    platform: false,
    collaborators: false,
  },
};
const LOCKED = { text: false, media: false, platform: false, collaborators: false };
const ALL = { text: true, media: true, platform: true, collaborators: true };

const PLATFORM_LABEL = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
};

/* Brand accent per platform — used for avatars / native chrome in previews. */
const PLATFORM_COLOR = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  twitter: "#000000",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  meta_ads: "#1877F2",
  google_ads: "#4285F4",
};

const AI_ACTIONS = ["Fix grammar", "Shorter", "Longer", "Funny", "Professional"];

/* ─── Live preview cards (self-contained; no dependency on PublishModal) ─── */
function Avatar({ name, logo, color = "#1877F2" }) {
  if (logo)
    return (
      <img
        src={logo}
        alt=""
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
      style={{ backgroundColor: color }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function FacebookCard({ name, logo, caption, image }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm max-w-md w-full">
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color="#1877F2" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            Just now · <Globe className="w-3 h-3" />
          </p>
        </div>
      </div>
      {caption && (
        <p className="px-3 pb-2 text-sm text-gray-800 whitespace-pre-wrap">
          {caption}
        </p>
      )}
      {image && (
        <img src={image} alt="" className="w-full object-cover max-h-72" />
      )}
      <div className="flex items-center justify-around px-3 py-2 border-t border-gray-100 text-gray-500 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="w-4 h-4" /> Like
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" /> Comment
        </span>
        <span className="flex items-center gap-1.5">
          <Share2 className="w-4 h-4" /> Share
        </span>
      </div>
    </div>
  );
}

function InstagramCard({ name, logo, caption, image }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm max-w-md w-full">
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color="#E1306C" />
        <p className="text-sm font-semibold text-gray-900">{name}</p>
      </div>
      {image && (
        <img src={image} alt="" className="w-full object-cover max-h-72" />
      )}
      <div className="flex items-center gap-4 px-3 pt-2 text-gray-700">
        <Heart className="w-5 h-5" />
        <MessageCircle className="w-5 h-5" />
        <Share2 className="w-5 h-5" />
        <Bookmark className="w-5 h-5 ml-auto" />
      </div>
      {caption && (
        <p className="px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
          <span className="font-semibold mr-1.5">{name}</span>
          {caption}
        </p>
      )}
    </div>
  );
}

function XCard({ name, handle, logo, caption, image, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm max-w-md w-full">
      <div className="flex items-start gap-2.5 p-3">
        <Avatar name={name} logo={logo} color={color} />
        <div className="min-w-0 flex-1">
          <p className="leading-tight truncate">
            <span className="text-sm font-semibold text-gray-900">{name}</span>
            <span className="text-[13px] text-gray-400"> @{handle} · now</span>
          </p>
          {caption && (
            <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">
              {caption}
            </p>
          )}
          {image && (
            <img
              src={image}
              alt=""
              className="mt-2 w-full rounded-2xl border border-gray-100 object-cover max-h-72"
            />
          )}
          <div className="flex items-center justify-between mt-2.5 pr-4 text-gray-400">
            <MessageCircle className="w-4 h-4" />
            <Repeat2 className="w-4 h-4" />
            <Heart className="w-4 h-4" />
            <BarChart3 className="w-4 h-4" />
            <Share2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInCard({ name, logo, caption, image, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm max-w-md w-full">
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color={color} />
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            Now · <Globe className="w-3 h-3" />
          </p>
        </div>
      </div>
      {caption && (
        <p className="px-3 pb-2 text-sm text-gray-800 whitespace-pre-wrap">
          {caption}
        </p>
      )}
      {image && (
        <img src={image} alt="" className="w-full object-cover max-h-72" />
      )}
      <div className="flex items-center justify-around px-3 py-2 border-t border-gray-100 text-gray-500 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="w-4 h-4" /> Like
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" /> Comment
        </span>
        <span className="flex items-center gap-1.5">
          <Repeat2 className="w-4 h-4" /> Repost
        </span>
        <span className="flex items-center gap-1.5">
          <Send className="w-4 h-4" /> Send
        </span>
      </div>
    </div>
  );
}

function GenericCard({ name, logo, caption, image, platformLabel, color }) {
  // Video-first platforms show the media on top with a play affordance.
  const videoFirst = platformLabel === "TikTok" || platformLabel === "YouTube";
  const Media = image ? (
    <div className="relative">
      <img src={image} alt="" className="w-full object-cover max-h-72" />
      {videoFirst && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-11 h-11 rounded-full bg-black/55 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </span>
        </span>
      )}
    </div>
  ) : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden shadow-sm max-w-md w-full">
      <div className="flex items-center gap-2.5 p-3">
        <Avatar name={name} logo={logo} color={color} />
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-[11px] font-medium" style={{ color }}>
            {platformLabel}
          </p>
        </div>
      </div>
      {videoFirst && Media}
      {caption && (
        <p className="px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
          {caption}
        </p>
      )}
      {!videoFirst && Media}
    </div>
  );
}

/* A section wrapper; renders a lock chip + note when the field can't sync live. */
function Section({ title, subtitle, locked, lockNote, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {locked && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 shrink-0"
            title={lockNote}
          >
            <Lock className="w-2.5 h-2.5" /> Locked
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function EditPostModal({
  post,
  integrations = [],
  integrationsMap = {},
  onClose,
  onSaved,
}) {
  const platform = post.platform;
  const platformLabel = PLATFORM_LABEL[platform] || platform;
  const isScheduled = post.status === "scheduled";

  // Scheduled posts aren't live yet → everything is editable locally.
  const caps = isScheduled ? ALL : EDIT_CAPS[platform] || LOCKED;

  const [caption, setCaption] = useState(post.caption || "");
  const [saving, setSaving] = useState(false);

  const account = integrationsMap[platform] || {};
  const displayName =
    account.name ||
    account.page_name ||
    account.username ||
    post.project_title ||
    "Your Page";
  const displayLogo =
    account.picture || account.avatar || account.logo || null;
  const displayHandle =
    account.username ||
    (displayName || "").replace(/\s+/g, "").toLowerCase() ||
    "handle";
  const platformColor = PLATFORM_COLOR[platform] || BRAND;

  const dirty = caption !== (post.caption || "");

  // Toast the reason a field is locked when the user tries to interact with it.
  const blocked = (field) => {
    toast.info(
      isScheduled
        ? `Can't change the ${field} here.`
        : `${platformLabel} doesn't allow changing the ${field} of a post after it's published.`,
    );
  };

  const Preview = useMemo(() => {
    if (platform === "instagram") return InstagramCard;
    if (platform === "facebook" || platform === "meta_ads") return FacebookCard;
    if (platform === "twitter") return XCard;
    if (platform === "linkedin") return LinkedInCard;
    return GenericCard;
  }, [platform]);

  const handleSave = async () => {
    if (!dirty) {
      toast.info("Nothing changed yet.");
      return;
    }
    if (!caps.text) {
      toast.error(
        `The text of a published ${platformLabel} post can't be edited via the API.`,
      );
      return;
    }
    setSaving(true);
    try {
      const updated = { ...post, caption };
      // Published + editable → push the new text live to the network.
      if (!isScheduled) {
        await updatePostCaptionOnPlatform(updated, caption, integrations);
      }
      savePublishedPost(updated);
      toast.success(
        isScheduled
          ? "Changes saved."
          : `Updated live on ${platformLabel}.`,
      );
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(`Couldn't update the post: ${err?.message || "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 bg-surface border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            {isScheduled ? "Edit scheduled post" : "Edit published post"}
          </h2>
          {!isScheduled && (
            <span className="hidden sm:inline text-[11px] text-gray-400">
              {caps.text
                ? `· changes go live on ${platformLabel}`
                : `· view only — ${platformLabel} can't edit published posts`}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: form (left) + live preview (right) */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/60">
        <div className="mx-auto max-w-6xl w-full flex flex-col lg:flex-row lg:justify-between gap-8 p-6">
          {/* ── Left: form ── */}
          <div className="w-full lg:w-[620px] space-y-4">
            {/* Post to */}
            <Section
              title="Post to"
              locked={!caps.platform}
              lockNote="A published post can't be moved to another account."
            >
              <button
                type="button"
                onClick={() => !caps.platform && blocked("destination")}
                className={`w-full flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 ${
                  caps.platform ? "" : "cursor-not-allowed bg-gray-50"
                }`}
              >
                <Avatar name={displayName} logo={displayLogo} color={BRAND} />
                <span className="font-medium">{displayName}</span>
                <span className="ml-auto text-[11px] text-gray-400">
                  {platformLabel}
                </span>
              </button>
            </Section>

            {/* Media */}
            <Section
              title="Media"
              subtitle="Share photos and videos."
              locked={!caps.media}
              lockNote="A published post's media can't be swapped out."
            >
              <div className="flex items-center gap-3">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200" />
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => !caps.media && blocked("media")}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                    title="Edit media"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => !caps.media && blocked("media")}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                    title="Remove media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => !caps.media && blocked("media")}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 ${
                  caps.media ? "hover:bg-gray-50" : "cursor-not-allowed opacity-60"
                }`}
              >
                <ImagePlus className="w-3.5 h-3.5" /> Add photo/video
              </button>
            </Section>

            {/* Post details / Text */}
            <Section
              title="Post details"
              locked={!caps.text}
              lockNote={`${platformLabel} doesn't allow editing post text after publishing.`}
            >
              <label className="text-[11px] font-medium text-gray-500">
                Text
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onFocus={() => !caps.text && blocked("text")}
                readOnly={!caps.text}
                rows={6}
                placeholder="What's on your mind?"
                className={`mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 outline-none resize-none focus:border-[#003dda] transition-colors ${
                  caps.text ? "bg-surface" : "bg-gray-50 cursor-not-allowed"
                }`}
              />

              {/* Write with AI */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 mr-1">
                  <Sparkles className="w-3 h-3" style={{ color: BRAND }} />
                  Write with AI
                </span>
                {AI_ACTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() =>
                      caps.text
                        ? toast.info("AI writing assistant is coming soon.")
                        : blocked("text")
                    }
                    className="text-[11px] font-medium px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Section>

            {/* Collaborator */}
            <Section
              title="Collaborator"
              subtitle="Invite people to share credit for this post."
              locked={!caps.collaborators}
              lockNote="Collaborators can't be changed after publishing."
            >
              <button
                onClick={() => !caps.collaborators && blocked("collaborators")}
                className={`w-full flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 ${
                  caps.collaborators
                    ? "hover:bg-gray-50"
                    : "cursor-not-allowed bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4" />
                Add collaborators
              </button>
            </Section>
          </div>

          {/* ── Right: live preview ── */}
          <div className="w-full lg:w-[440px] shrink-0 space-y-3">
            <p className="text-[11px] font-medium text-gray-500">
              {platformLabel} preview
            </p>
            <Preview
              name={displayName}
              handle={displayHandle}
              logo={displayLogo}
              caption={caption}
              image={post.image_url}
              platformLabel={platformLabel}
              color={platformColor}
            />
            {!caps.text && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {platformLabel} doesn&apos;t support editing this post through
                its API. You can view it here, but changes can&apos;t be pushed
                live.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 h-16 bg-surface border-t border-gray-200 shrink-0">
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !dirty || !caps.text}
          className="h-9 px-5 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: BRAND }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isScheduled ? "Save changes" : "Save & publish"}
        </button>
      </div>
    </div>
  );
}
