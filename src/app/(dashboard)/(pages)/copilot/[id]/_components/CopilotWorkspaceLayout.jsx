"use client";

/**
 * CopilotWorkspaceLayout — the shell every /copilot/[id] screen sits in: a
 * secondary sidebar naming the copilot, and the screen itself on the right.
 *
 * ── Why this is not <SectionLayout> ──────────────────────────────────────────
 * It is the same IDEA (panel flush against a collapsed primary rail, own
 * collapse toggle, content scrolling beside it) and it deliberately reuses that
 * shell's measurements, tooltip trick and `SecondarySidebarContext` so the two
 * feel like one system. But SectionLayout renders ONE flat list of links, and
 * this panel is a copilot's home: an identity header, a primary action, grouped
 * nav, a channel list, a conversation history and a footer. Bending
 * SectionLayout into slots for all of that would put six new props on the shell
 * four shipped sections depend on, to serve one caller.
 *
 * Below `lg` the panel is a <Drawer> behind a "Copilot menu" button rather than
 * SectionLayout's horizontal pill bar — channels and a conversation list do not
 * survive being flattened into a scrolling strip of pills.
 *
 * ⚠️ The route must also be listed in SECONDARY_SIDEBAR_ROUTES in
 * (dashboard)/layout.js, or the primary rail stays expanded and two full-width
 * sidebars fight over the screen. It is there as a RegExp — /copilot/<id> cannot
 * be written as a prefix without swallowing /copilot and /copilot/all.
 *
 * @param {Object} props
 * @param {Object} props.copilot  The copilot this workspace belongs to.
 * @param {React.ReactNode} props.children  The active workspace screen.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Workflow,
  Blocks,
  SlidersHorizontal,
  ChevronDown,
  Gift,
  Sparkles,
  MessageCircleMore,
  PanelLeft,
} from "lucide-react";
import { useSecondarySidebar } from "@/context/SecondarySidebarContext";
import Drawer from "@/app/(components)/ui/Drawer";
import CopilotAvatar from "../../_components/CopilotAvatar";
import { newConversationId } from "../../_data/copilots";
import { CHANNELS } from "../../_data/channels";
import CopilotSettingsModal from "./settings/CopilotSettingsModal";
import InviteCreditsModal from "./InviteCreditsModal";
import WhatsNewPanel from "./WhatsNewPanel";
import FeedbackModal from "./FeedbackModal";

/**
 * The copilot's own pages. ⚠️ Files, Memory and Data are deliberately absent —
 * a copilot here works on the brand kit, the design library and the connected
 * platforms the app already owns, so a private file drawer and a separate data
 * store would be a second, competing source of truth for the same material.
 */
const NAV_ITEMS = [
  { label: "Workflows", segment: "workflows", icon: Workflow },
  { label: "Plugins", segment: "plugins", icon: Blocks },
  // ⚠️ Customize is NOT here — it is not a page. It opens the settings sheet on
  // General, which is where a copilot's models, app access, voice and identity
  // actually live. It sits directly below these two in the rail, drawn as a
  // button; see the Customize row in panelBody.
];

/**
 * Bottom-of-panel items. All three open something over the workspace rather
 * than navigating away — you are asking a question about the app, not leaving
 * the copilot you were talking to — so each is just the name of what it opens
 * and the row below renders them identically.
 */
const FOOTER_ITEMS = [
  { label: "Earn bonus credits", icon: Gift, dialog: "invite" },
  { label: "What's new", icon: Sparkles, dialog: "whatsnew" },
  { label: "Leave feedback", icon: MessageCircleMore, dialog: "feedback" },
];

export default function CopilotWorkspaceLayout({ copilot, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSecondarySidebar();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationsOpen, setConversationsOpen] = useState(true);
  // Which footer item is open, and the rect of the row that opened it — one
  // value rather than a flag each, so two of them can never be open at once as
  // the footer grows, and the anchor travels with the thing that needs it
  // (What's new is a popover; see WhatsNewPanel).
  const [footerDialog, setFooterDialog] = useState(null); // { kind, anchor } | null
  // Where the settings sheet should open, or null for closed — one piece of
  // state for both "is it open" and "on what", so the two cannot disagree. A
  // fresh object per open is what re-seeds the sheet; see CopilotSettingsModal.
  const [settings, setSettings] = useState(null);

  const base = `/copilot/${copilot.id}`;
  // Exact match: every screen here is a leaf, and the conversation lives at the
  // root, so a prefix test would light Workflows from inside a conversation.
  const isActive = (href) => pathname === href;

  // ── Collapsed-panel label tooltip ───────────────────────────────
  // Same construction as SectionLayout / Sidebar: the panel clips overflow while
  // collapsed, so ONE fixed-positioned tooltip is rendered from a snapshot of
  // the hovered item's rect rather than absolutely inside the panel.
  const [hoverTip, setHoverTip] = useState(null);
  const showTip = (e, label, active = false) => {
    if (isOpen) return; // labels are already visible when expanded
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTip({
      label,
      active,
      top: rect.top + rect.height / 2,
      left: rect.right + 14,
    });
  };
  const hideTip = () => setHoverTip(null);

  // Drop a stale tooltip when the panel expands, during render rather than in an
  // effect so it does not trigger a cascading re-render.
  const [lastOpen, setLastOpen] = useState(isOpen);
  if (isOpen !== lastOpen) {
    setLastOpen(isOpen);
    if (isOpen) setHoverTip(null);
  }

  /**
   * The panel's contents. Rendered twice — in the desktop aside and inside the
   * mobile drawer — from one definition, so the drawer can never fall behind.
   * @param {boolean} expanded  Drawer and expanded panel show labels; the 60px
   *                            rail shows icons only.
   */
  const panelBody = (expanded) => (
    <>
      {/* Identity — which copilot am I talking to, and a way to another one. */}
      <div className={`shrink-0 ${expanded ? "px-3 pt-3" : "px-2 pt-3"}`}>
        {expanded ? (
          <Link
            href="/copilot/all"
            onClick={() => setDrawerOpen(false)}
            className="group flex items-center gap-2.5 w-full rounded-xl px-2 py-2 hover:bg-gray-100 transition-colors"
            title="Switch copilot"
          >
            <CopilotAvatar copilot={copilot} size="md" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-gray-900">
              {copilot.name}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
          </Link>
        ) : (
          <Link
            href="/copilot/all"
            className="flex justify-center py-2"
            onMouseEnter={(e) => showTip(e, "Switch copilot")}
            onMouseLeave={hideTip}
          >
            <CopilotAvatar copilot={copilot} size="md" />
          </Link>
        )}
      </div>

      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar py-3 flex flex-col gap-1 ${expanded ? "px-3" : "px-2"}`}
        onScroll={hideTip}
      >
        {/* New conversation — the panel's one primary action, so it is the one
            item drawn as a button rather than a link in a list.
            ⚠️ It carries a fresh `?c=`, which is what makes it work from
            anywhere: from Workflows it navigates to the thread, and from a
            thread it changes the URL, so the conversation remounts empty
            instead of the router deciding you are already there and doing
            nothing. See newConversationId in ../../_data/copilots. */}
        <button
          onClick={() => {
            setDrawerOpen(false);
            router.push(`${base}?c=${newConversationId()}`);
          }}
          onMouseEnter={(e) => showTip(e, "New conversation")}
          onMouseLeave={hideTip}
          className={`group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-900 hover:bg-gray-100 transition-all duration-150 cursor-pointer ${expanded ? "" : "justify-center px-0"}`}
        >
          <Plus className="h-4.5 w-4.5 shrink-0" />
          {expanded && <span className="flex-1 truncate text-left">New conversation</span>}
        </button>

        {NAV_ITEMS.map(({ label, segment, icon: Icon }) => {
          const href = `${base}/${segment}`;
          const active = isActive(href);
          return (
            <Link
              key={segment}
              href={href}
              onClick={() => setDrawerOpen(false)}
              onMouseEnter={(e) => showTip(e, label, active)}
              onMouseLeave={hideTip}
              onFocus={(e) => showTip(e, label, active)}
              onBlur={hideTip}
              className={`group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150
                ${active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
                ${expanded ? "" : "justify-center px-0"}`}
            >
              {/* h-4.5 as well as w-4.5 — lucide sets height="24", so width
                  alone letterboxes the glyph. Same note as Sidebar.jsx. */}
              <Icon
                className={`h-4.5 w-4.5 shrink-0 ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
              />
              {expanded && <span className="flex-1 truncate">{label}</span>}
            </Link>
          );
        })}

        {/* Customize — a button, not a link: it opens the settings sheet on
            General over wherever you already are, rather than taking you off
            the conversation to a page. Same row treatment as the two links
            above it, so the rail still reads as one list. */}
        <button
          onClick={() => {
            setDrawerOpen(false);
            setSettings({ panel: "general" });
          }}
          onMouseEnter={(e) => showTip(e, "Customize")}
          onMouseLeave={hideTip}
          className={`group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 cursor-pointer ${expanded ? "" : "justify-center px-0"}`}
        >
          <SlidersHorizontal className="h-4.5 w-4.5 shrink-0" />
          {expanded && (
            <span className="flex-1 truncate text-left">Customize</span>
          )}
        </button>

        {/* ── Channels ──────────────────────────────────────────── */}
        <p
          className={`mt-4 mb-1 px-3 text-[12px] font-medium text-gray-500 ${expanded ? "" : "sr-only"}`}
        >
          Channels
        </p>
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            // Straight to that channel's instructions in the settings sheet —
            // the same place Channels lives, so the rail is a shortcut into it
            // rather than a second connect flow. Closes the drawer first: on a
            // phone the sheet would otherwise open behind the panel that
            // launched it.
            onClick={() => {
              setDrawerOpen(false);
              setSettings({ panel: "channels", channel: ch.id });
            }}
            onMouseEnter={(e) => showTip(e, ch.label)}
            onMouseLeave={hideTip}
            className={`group flex items-center gap-3 w-full rounded-xl px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 cursor-pointer ${expanded ? "" : "justify-center px-0"}`}
          >
            <span
              className={`h-5 w-5 rounded-full ${ch.tint} flex items-center justify-center shrink-0`}
            >
              <ch.Icon className="h-3 w-3 text-white" />
            </span>
            {expanded && (
              <span className="flex-1 truncate text-left">{ch.label}</span>
            )}
          </button>
        ))}

        {/* ── Conversations ─────────────────────────────────────── */}
        {expanded && (
          <>
            <button
              onClick={() => setConversationsOpen((p) => !p)}
              aria-expanded={conversationsOpen}
              className="mt-4 flex items-center gap-2 w-full px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <span className="flex-1 text-left truncate">Conversations</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${conversationsOpen ? "" : "-rotate-90"}`}
              />
            </button>
            {conversationsOpen && (
              // ⚠️ No mock threads here on purpose. A copilot's history is the
              // one thing that is genuinely empty until the backend records it,
              // and seeding fake conversations would put words in this
              // copilot's mouth that the user never said.
              <p className="mt-1 rounded-xl border border-gray-200 px-3 py-4 text-center text-[11px] leading-relaxed text-gray-400">
                No conversations yet.
                <br />
                Your chats with {copilot.name} land here.
              </p>
            )}
          </>
        )}
      </nav>

      {/* ── Panel footer ────────────────────────────────────────── */}
      <div className={`shrink-0 border-t border-gray-200 py-2 ${expanded ? "px-3" : "px-2"}`}>
        {FOOTER_ITEMS.map(({ label, icon: Icon, dialog }) => (
          <button
            key={label}
            onClick={(e) => {
              // Snapshot the row's rect BEFORE anything closes — What's new
              // hangs off it, and by the time state has settled the drawer this
              // button lives in may be on its way out.
              const rect = e.currentTarget.getBoundingClientRect();
              // Close the mobile drawer first: these open over the page, and
              // leaving the panel on top would put them behind the nav they
              // were opened from.
              setDrawerOpen(false);
              hideTip();
              setFooterDialog({
                kind: dialog,
                anchor: { right: rect.right, bottom: rect.bottom },
              });
            }}
            onMouseEnter={(e) => showTip(e, label)}
            onMouseLeave={hideTip}
            className={`group flex items-center gap-3 w-full rounded-xl px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 cursor-pointer ${expanded ? "" : "justify-center px-0"}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {expanded && (
              <span className="flex-1 truncate text-left">{label}</span>
            )}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="h-full pt-header flex flex-col lg:flex-row overflow-hidden">
      {/* ── Desktop panel ───────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex lg:flex-col shrink-0 h-full bg-surface border-r border-gray-200
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "w-64" : "w-15"}`}
      >
        {panelBody(isOpen)}
        {/* This panel's own collapse toggle, in the same place every secondary
            sidebar in the app puts it. */}
        <div
          className={`shrink-0 border-t border-gray-200 p-2 flex ${isOpen ? "justify-end" : "justify-center"}`}
        >
          <button
            onClick={toggle}
            onMouseEnter={(e) => showTip(e, "Expand")}
            onMouseLeave={hideTip}
            className="p-2 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label={isOpen ? "Collapse panel" : "Expand panel"}
          >
            {isOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Collapsed-panel hover label — fixed so the panel's overflow-hidden
          cannot clip it; pointer-events off so it never steals the hover. */}
      {!isOpen && hoverTip && (
        <div
          className="hidden lg:block fixed z-60 pointer-events-none"
          style={{
            top: hoverTip.top,
            left: hoverTip.left,
            transform: "translateY(-50%)",
          }}
          role="tooltip"
        >
          <div className="animate-tip-in relative">
            <span
              className={`absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[3px] ${
                hoverTip.active ? "bg-blue-600" : "bg-gray-900"
              }`}
            />
            <span
              className={`relative block whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-lg ${
                hoverTip.active ? "bg-blue-600 text-white" : "bg-gray-900 text-surface"
              }`}
            >
              {hoverTip.label}
            </span>
          </div>
        </div>
      )}

      {/* ── Mobile: the same panel, in a drawer ─────────────────── */}
      <div className="lg:hidden shrink-0 flex items-center gap-2 bg-surface border-b border-gray-200 px-4 py-2">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open copilot menu"
          className="p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <CopilotAvatar copilot={copilot} size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {copilot.name}
        </p>
      </div>
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        label={`${copilot.name} menu`}
      >
        <div className="flex h-full w-72 max-w-full flex-col bg-surface">
          {panelBody(true)}
        </div>
      </Drawer>

      {/* ── Screen ──────────────────────────────────────────────── */}
      {/* overflow-hidden, not overflow-y-auto: the conversation pins its
          composer to the foot of this box and scrolls its own thread, which it
          can only do if the box ends at the viewport instead of growing. */}
      <div className="flex-1 min-w-0 bg-page overflow-hidden">{children}</div>

      {/* Out here, not in panelBody: that body is rendered twice (desktop aside
          + mobile drawer), and a sheet inside it would mount twice. */}
      <CopilotSettingsModal
        initial={settings}
        copilot={copilot}
        onClose={() => setSettings(null)}
      />
      <InviteCreditsModal
        isOpen={footerDialog?.kind === "invite"}
        onClose={() => setFooterDialog(null)}
      />
      <WhatsNewPanel
        isOpen={footerDialog?.kind === "whatsnew"}
        anchor={footerDialog?.anchor}
        onClose={() => setFooterDialog(null)}
      />
      <FeedbackModal
        isOpen={footerDialog?.kind === "feedback"}
        onClose={() => setFooterDialog(null)}
      />
    </div>
  );
}
