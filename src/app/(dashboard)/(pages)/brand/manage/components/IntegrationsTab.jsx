/**
 * IntegrationsTab.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Social / advertising connections surface for the brand. This mirrors the
 * card design of the standalone Integrations page (app/(dashboard)/(pages)/
 * integrations/page.jsx) but is presentational here — connect/disconnect toggle
 * local state only. The full OAuth flow lives on that dedicated page; this tab
 * links across to it so we don't duplicate the (large) OAuth machinery.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Check, ArrowUpRight } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
  FaTiktok,
  FaMeta,
  FaGoogle,
  FaSnapchat,
} from "react-icons/fa6";

const SOCIAL_PLATFORMS = [
  { id: "facebook", name: "Facebook Pages", description: "Publish posts & images to your Facebook Pages.", Icon: FaFacebook, iconBg: "linear-gradient(135deg, #1877F2, #0C5FCA)" },
  { id: "instagram", name: "Instagram Business", description: "Publish photos & reels to Instagram Business accounts.", Icon: FaInstagram, iconBg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)" },
  { id: "twitter", name: "X / Twitter", description: "Post tweets, images, and videos to X (Twitter).", Icon: FaXTwitter, iconBg: "linear-gradient(135deg, #14171A, #333)" },
  { id: "linkedin", name: "LinkedIn", description: "Share posts and articles on LinkedIn pages.", Icon: FaLinkedin, iconBg: "linear-gradient(135deg, #0A66C2, #004182)" },
  { id: "youtube", name: "YouTube", description: "Upload videos and manage your YouTube channel.", Icon: FaYoutube, iconBg: "linear-gradient(135deg, #FF0000, #CC0000)" },
  { id: "pinterest", name: "Pinterest", description: "Create pins and manage Pinterest boards.", Icon: FaPinterest, iconBg: "linear-gradient(135deg, #E60023, #ad081b)" },
  { id: "tiktok", name: "TikTok", description: "Publish videos and create TikTok content.", Icon: FaTiktok, iconBg: "linear-gradient(135deg, #161823, #010101)" },
];

const AD_PLATFORMS = [
  { id: "meta_ads", name: "Meta Ads Manager", description: "Create & manage Facebook and Instagram ad campaigns.", Icon: FaMeta, iconBg: "linear-gradient(135deg, #0668E1, #1877F2)" },
  { id: "google_ads", name: "Google Ads", description: "Manage Google Search, Display & YouTube campaigns.", Icon: FaGoogle, iconBg: "linear-gradient(135deg, #4285F4, #34A853)" },
  { id: "tiktok_ads", name: "TikTok Ads", description: "Launch and manage TikTok ad campaigns.", Icon: FaTiktok, iconBg: "linear-gradient(135deg, #161823, #010101)" },
  { id: "snapchat_ads", name: "Snapchat Ads", description: "Create and manage Snapchat advertising campaigns.", Icon: FaSnapchat, iconBg: "linear-gradient(135deg, #FFFC00, #f0ed00)" },
  { id: "pinterest_ads", name: "Pinterest Ads", description: "Run Pinterest ad campaigns and promoted pins.", Icon: FaPinterest, iconBg: "linear-gradient(135deg, #E60023, #ad081b)" },
];

function PlatformCard({ platform, connected, onToggle }) {
  const { Icon } = platform;
  return (
    <div className="rounded-xl border border-gray-200 bg-surface transition-all hover:shadow-sm">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: platform.iconBg }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">
              {platform.name}
            </span>
            {connected ? (
              <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                <Check className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                Not connected
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {platform.description}
          </p>
        </div>

        <button
          onClick={onToggle}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            connected
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : "text-white hover:scale-105"
          }`}
          style={connected ? undefined : { background: "linear-gradient(135deg, #155dfc, #3b82f6)" }}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 className="mb-3 text-sm font-bold tracking-tight text-gray-900">
      {title}
    </h2>
  );
}

export default function IntegrationsTab() {
  // Local-only connection state (design surface). Real connections are managed
  // on the dedicated Integrations page linked below.
  const [connected, setConnected] = useState({});
  const toggle = (id) =>
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#c7d9fd] bg-[#eff4ff] px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#155dfc]" />
        <p className="text-sm leading-relaxed text-[#1e40af]">
          <span className="font-semibold">Connect your accounts: </span>
          Link social and advertising platforms to publish and run campaigns for
          this brand. For the full one-click connect flow, open the{" "}
          <Link
            href="/integrations"
            className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:text-blue-700"
          >
            Integrations page
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          .
        </p>
      </div>

      <div className="mb-8">
        <SectionHeader title="Social Media" />
        <div className="flex flex-col gap-3">
          {SOCIAL_PLATFORMS.map((p) => (
            <PlatformCard
              key={p.id}
              platform={p}
              connected={!!connected[p.id]}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Advertising Platforms" />
        <div className="flex flex-col gap-3">
          {AD_PLATFORMS.map((p) => (
            <PlatformCard
              key={p.id}
              platform={p}
              connected={!!connected[p.id]}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
