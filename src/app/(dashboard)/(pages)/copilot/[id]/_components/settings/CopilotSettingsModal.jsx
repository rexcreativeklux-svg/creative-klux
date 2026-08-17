"use client";

/**
 * CopilotSettingsModal — one sheet for everything about a copilot that is not a
 * conversation: General, Sharing & access, Credit usage, Personalization,
 * Channels, Security and Developer.
 *
 * ── Why a sheet and not routes ──────────────────────────────────────────────
 * These are settings you dip into and come back from. The copilot's screens
 * (Workflows, Plugins, Customize) are places you WORK, and they are routes for
 * that reason; sending someone to /copilot/x/settings/channels to read two lines
 * of instructions would cost them their place in the conversation behind it.
 * It also means the workspace rail's "Continue on WhatsApp" can open straight
 * onto that channel's instructions without a navigation.
 *
 * ── How it is wired ─────────────────────────────────────────────────────────
 * The rail and the body both come from SETTINGS_NAV, so a panel cannot be
 * listed and unreachable, or reachable and unlisted. Panels all take the same
 * two props; Channels takes two more because it has a sub-view, and it is the
 * shell that owns which channel is open — the title bar's back arrow lives up
 * here and has to know there is somewhere to go back to.
 *
 * @param {Object} props
 * @param {{panel?: string, channel?: string}|null} props.initial  Non-null
 *   opens the sheet, on that panel (and that channel). A FRESH object per open
 *   — the shell re-seeds itself from a new identity, which is how the same
 *   sheet reopens on Channels one time and General the next.
 * @param {Object} props.copilot
 * @param {() => void} props.onClose
 */

import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import CopilotAvatar from "../../../_components/CopilotAvatar";
import { channelById } from "../../../_data/channels";
import { SETTINGS_NAV, navItem } from "./settingsNav";

export default function CopilotSettingsModal({ initial, copilot, onClose }) {
  const [panel, setPanel] = useState(initial?.panel ?? SETTINGS_NAV[0].id);
  const [channelId, setChannelId] = useState(initial?.channel ?? null);

  // Re-seed on each open, during render rather than in an effect so the sheet's
  // first committed frame is already the panel that was asked for — the
  // adjust-state pattern ResponsiveModal itself uses. `initial` going null on
  // close is ignored on purpose: the content has to survive the exit animation.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial && initial !== lastInitial) {
    setLastInitial(initial);
    setPanel(initial.panel ?? SETTINGS_NAV[0].id);
    setChannelId(initial.channel ?? null);
  }

  const item = navItem(panel);
  const { Panel } = item;
  const channel = item.id === "channels" ? channelById(channelId) : null;
  const inChannel = Boolean(channel);

  const openPanel = (id) => {
    setPanel(id);
    setChannelId(null); // never land on Channels with a stale channel pushed
  };

  return (
    <ResponsiveModal
      isOpen={Boolean(initial)}
      onClose={onClose}
      size="3xl"
      fullHeightSheet
      // A definite desktop height, which is also what makes the two columns
      // scroll independently: the pane's own scrollbar (and its title bar
      // staying put) needs a height to resolve against, and without it a long
      // panel would scroll the rail and the header away with it.
      className="md:h-160"
      bodyClassName="p-0"
      // The title bar belongs to the right-hand pane here, not to the dialog:
      // the rail runs the full height beside it, the way the reference does.
      // `title` stays for the dialog's accessible name.
      hideHeader
      title={`${copilot.name} settings`}
    >
      {/* h-full, not min-h: the body is a definite height (flex-1 + min-h-0 in
          ResponsiveModal), so the two columns can scroll independently instead
          of the whole sheet scrolling and taking the rail with it. */}
      <div className="flex h-full min-h-0 flex-col md:flex-row">
        {/* ── Rail ────────────────────────────────────────────────
            Below `md` it becomes a horizontal strip of pills: seven labels in a
            56px-wide column on a phone would be a wall of wrapped text, and the
            sheet's whole job there is the panel. */}
        {/* No fill: the rail is the same surface as the pane, separated by its
            divider alone. The active row's pill is the only tint in here. */}
        <aside className="shrink-0 border-b border-gray-100 bg-surface md:w-50 md:overflow-y-auto md:border-r md:border-b-0">
          {/* The identity row's text sits on the same left edge as the nav
              labels below it, so the rail reads as one column rather than a
              header indented away from its list. */}
          <div className="hidden items-center gap-2 px-3 py-3 md:flex">
            <CopilotAvatar copilot={copilot} size="sm" />
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-gray-900">
              {copilot.name}
            </p>
          </div>

          {/* Tight: the rows are the rail's content, so the only space around
              them is the 8px inset the active pill needs to not touch the
              divider. No bottom padding — the rail's colour runs to the foot of
              the sheet on its own. */}
          <nav className="flex gap-0.5 overflow-x-auto hide-scrollbar p-2 md:flex-col md:overflow-visible md:px-2 md:pt-0">
            {SETTINGS_NAV.map(({ id, label, Icon }) => {
              const active = id === item.id;
              return (
                <button
                  key={id}
                  onClick={() => openPanel(id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors cursor-pointer md:w-full ${
                    active
                      ? "bg-gray-200/70 font-semibold text-gray-900"
                      : "font-medium text-gray-500 hover:bg-gray-200/40 hover:text-gray-900"
                  }`}
                >
                  {/* The glyph is the mobile strip's only compact hint at what a
                      pill is; on desktop the label carries it. */}
                  <Icon className="h-4 w-4 shrink-0 md:hidden" />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Pane ────────────────────────────────────────────────
            Its own title bar, then the panel scrolling under it. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-card py-3 md:px-5 md:py-4">
            <div className="flex min-w-0 items-center gap-1.5">
              {inChannel && (
                <button
                  type="button"
                  onClick={() => setChannelId(null)}
                  aria-label="Back to channels"
                  className="-ml-1.5 shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="truncate text-lg font-semibold tracking-tight text-gray-900">
                {inChannel ? `Connect to ${channel.short}` : item.label}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ck-tap shrink-0 cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Keyed by panel and channel so switching resets scroll and any
              local draft state instead of carrying one panel's half-typed
              field into the next. */}
          <section
            key={`${item.id}:${channelId ?? ""}`}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-card md:p-5"
          >
            <Panel
              copilot={copilot}
              onClose={onClose}
              {...(item.id === "channels"
                ? { channel, onSelect: setChannelId }
                : {})}
            />
          </section>
        </div>
      </div>
    </ResponsiveModal>
  );
}
