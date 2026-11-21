"use client";

// app/(components)/composer/PublishFlow.jsx
// ─────────────────────────────────────────────────────────────────────────────
// "Publish" everywhere in the app: a choice between a SOCIAL POST (the Create
// new post composer) and an AD CAMPAIGN (the Create campaign composer), the
// same two Magic Studio's result menu offers.
//
//   usePublishFlow()   the state + the two composers. Call openSocial(item) or
//                      openCampaign(item) and render `composers` once.
//   <PublishButton>    a Publish button with that choice as its dropdown, for
//                      places that have a button rather than a ⋯ menu.
//
// An item is anything publishable:
//   { url?, type?: "image"|"video", thumbnail?, canvas?, elements?, name?,
//     copy?, prompt? }
// A hosted file (url) goes straight in. A saved design uses its hosted
// thumbnail, or — when it has none yet — is painted to a PNG and uploaded,
// because a network can't fetch a browser canvas. A design's `copy` fills the
// composer: each network's own text and title, the ad's title / description /
// text (see postFromCopy / adFromCopy) — and stays blank where it has none.

import { useState } from "react";
import { ChevronDown, Loader2, Megaphone, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { uploadForPublish } from "@/(lib)/creativesApi";
import { renderDesignToBlob } from "@/(lib)/design/renderDesign";
import { adFromCopy, postFromCopy } from "@/(lib)/designCopy";
import { AD_NETWORKS } from "@/app/(components)/content/socialPlatformScope";
import CreatePostComposer from "./CreatePostComposer";
import CreateAdComposer from "./CreateAdComposer";

const isHosted = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

/** The item's media as `{ url, type }`, uploading a painted design if needed. */
async function resolveMedia(item) {
  if (isHosted(item.url)) return { url: item.url, type: item.type === "video" ? "video" : "image" };
  if (isHosted(item.thumbnail)) return { url: item.thumbnail, type: "image" };
  if (item.canvas) {
    const blob = await renderDesignToBlob({ canvas: item.canvas, elements: item.elements || [] });
    if (!blob) throw new Error("Couldn't prepare the design image.");
    const file = new File([blob], `${item.name || "design"}.png`, { type: "image/png" });
    const url = await uploadForPublish(file);
    if (!url) throw new Error("Couldn't upload the design image.");
    return { url, type: "image" };
  }
  return null;
}

/**
 * @returns {{
 *   openSocial: (item: object) => Promise<void>,
 *   openCampaign: (item: object) => Promise<void>,
 *   preparing: boolean,
 *   composers: JSX.Element,
 * }}
 */
export function usePublishFlow() {
  const { fetchIntegrations } = useAuth();
  const [social, setSocial] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [preparing, setPreparing] = useState(false);

  const prepare = async (item) => {
    const needsUpload = !isHosted(item.url) && !isHosted(item.thumbnail) && item.canvas;
    const id = needsUpload ? toast.loading("Preparing your design…") : null;
    setPreparing(true);
    try {
      const media = await resolveMedia(item);
      if (id) toast.dismiss(id);
      return media;
    } catch (err) {
      console.error("❌ [publish] couldn't prepare the media:", err);
      toast.error(err?.message || "Couldn't prepare this for publishing.", id ? { id } : undefined);
      throw err;
    } finally {
      setPreparing(false);
    }
  };

  const openSocial = async (item) => {
    if (!item || preparing) return;
    let media;
    try {
      media = await prepare(item);
    } catch {
      return;
    }
    setSocial({
      media,
      ...postFromCopy(item.copy),
      aiTopic: (item.prompt || "").trim(),
      // A fresh key per opening, so the composer starts from this item.
      key: Date.now(),
    });
  };

  const openCampaign = async (item) => {
    if (!item || preparing) return;
    let media;
    try {
      media = await prepare(item);
    } catch {
      return;
    }
    // Open on the brand's connected ad networks.
    let connected = [];
    try {
      const ints = (await fetchIntegrations?.()) || [];
      connected = ints.map((i) => i.platform).filter((p) => AD_NETWORKS.some((n) => n.id === p));
    } catch (err) {
      console.error("❌ [publish] couldn't load ad accounts:", err);
    }
    setCampaign({ media, connected, ad: adFromCopy(item.copy), key: Date.now() });
  };

  const composers = (
    <>
      <CreatePostComposer
        key={social?.key}
        isOpen={!!social}
        onClose={() => setSocial(null)}
        initialMedia={social?.media || null}
        initialText={social?.text || ""}
        initialNetworkText={social?.networkText}
        initialOptions={social?.options}
        // Tick the networks the copy was written for (the composer falls
        // back to every connected account when none of them is connected).
        initialPlatforms={social?.platforms || []}
        aiTopic={social?.aiTopic || ""}
      />
      <CreateAdComposer
        key={campaign?.key}
        isOpen={!!campaign}
        onClose={() => setCampaign(null)}
        connected={campaign?.connected || []}
        initialPlatform={campaign?.connected?.[0]}
        initialMedia={campaign?.media || null}
        initialAd={campaign?.ad}
      />
    </>
  );

  return { openSocial, openCampaign, preparing, composers };
}

/**
 * A Publish button whose dropdown asks where to: Social post or Ad campaign.
 *
 * @param {object} props
 * @param {() => void} props.onSocial
 * @param {() => void} props.onCampaign
 * @param {boolean} [props.busy]      Show a spinner (media being prepared).
 * @param {string} [props.className]  The button's classes.
 */
export function PublishButton({ onSocial, onCampaign, busy = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const pick = (fn) => {
    setOpen(false);
    fn?.();
  };
  return (
    <span className="relative flex min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className}
      >
        {busy ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <Send className="h-3 w-3 shrink-0" />}
        Publish
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-surface py-1 shadow-xl"
          >
            {[
              { label: "Social post", hint: "Post to your social accounts", Icon: Share2, fn: onSocial },
              { label: "Ad campaign", hint: "Run it as a paid ad", Icon: Megaphone, fn: onCampaign },
            ].map(({ label, hint, Icon, fn }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => pick(fn)}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-100"
              >
                <Icon className="h-4 w-4 shrink-0 text-gray-700" />
                <span className="min-w-0">
                  <span className="block text-sm text-gray-900">{label}</span>
                  <span className="block text-[11px] text-gray-500">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
