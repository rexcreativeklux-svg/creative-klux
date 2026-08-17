"use client";

/**
 * Channels — every place this copilot can be reached from outside the app, and
 * the connect instructions each one opens.
 *
 * The list and the sub-view are the SAME panel rather than two nav entries: the
 * pane's title bar owns the back arrow (see CopilotSettingsModal), so opening a
 * channel is a state change here, not a route. Which channel is open is held by
 * the modal, not by this component, because the workspace rail can open one
 * directly and the back arrow has to know there is somewhere to go back to.
 *
 * ⚠️ No "browser extension" row, which the reference list ends on — Creative
 * Klux does not ship one, and an Install button for software that does not
 * exist is the one row a user would actually try to click.
 *
 * @param {Object} props
 * @param {Object} props.copilot
 * @param {Object|null} props.channel  The open channel, or null for the list.
 * @param {(id: string) => void} props.onSelect
 */

import { CHANNELS } from "../../../_data/channels";
import ChannelConnectView from "./ChannelConnectView";
import { GhostButton } from "./settingsUi";

export default function ChannelsPanel({ copilot, channel, onSelect }) {
  if (channel) return <ChannelConnectView channel={channel} copilot={copilot} />;

  return (
    <div className="flex flex-col">
      {CHANNELS.map((ch) => (
        <div
          key={ch.id}
          className="flex items-start gap-3 border-b border-gray-100 py-4 first:pt-0 last:border-0 last:pb-0"
        >
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ch.tint}`}
          >
            <ch.Icon className="h-3.5 w-3.5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{ch.short}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">
              {ch.blurb}
            </p>
          </div>
          {/* The action is the button, not the whole row: every row here leads
              to instructions rather than to a place, and "Connect" says which
              of the four you are about to set up. */}
          <GhostButton
            onClick={() => onSelect(ch.id)}
            aria-label={`Connect ${ch.short}`}
            className="px-4 py-2"
          >
            Connect
          </GhostButton>
        </div>
      ))}
    </div>
  );
}
