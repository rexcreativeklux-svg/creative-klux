"use client";

/**
 * "Connect to WhatsApp" — the sub-view the Channels panel pushes when a channel
 * is picked, and what a "Continue on …" row in the workspace rail opens
 * directly.
 *
 * ONE view for all four channels: the colour, the preview, the button label and
 * the numbered steps are fields on the channel's `connect` block in
 * ../../../_data/channels, so the fifth channel is a row of data rather than a
 * fifth copy of this file.
 *
 * ⚠️ NOTHING IS CONNECTED YET. The channel bridge is a backend job, so the
 * button says the click was heard (notifyPending) instead of opening a chat with
 * a number that does not exist — the same rule the Plugins screen follows. The
 * QR is real, but it encodes THIS COPILOT'S OWN URL: scanning it carries the
 * conversation to your phone, which is the honest version of the promise until
 * the backend mints a handoff link. Point `qrValue` at that link when it exists
 * and nothing else here changes.
 */

import { ExternalLink, ShieldCheck } from "lucide-react";
import { notifyPending } from "../../../_data/copilots";
import { CHANNEL_PRIVACY_NOTE } from "../../../_data/channels";
import ChannelPreview from "./ChannelPreview";
import { PanelActions, PrimaryButton } from "./settingsUi";

export default function ChannelConnectView({ channel, copilot }) {
  const { short, connect } = channel;

  // A real link, to the copilot this panel was opened from. Read at render on
  // the client only — the sheet portals into the body, so there is no server
  // pass of this subtree to mismatch.
  const qrValue =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/copilot/${copilot.id}`;

  return (
    <div className="flex flex-col gap-5">
      <ChannelPreview channel={channel} copilot={copilot} qrValue={qrValue} />

      {/* A real <ol>: these are ordered instructions and the numbers are the
          content, not decoration. Rendered from the list so the markers cannot
          disagree with the order — Slack has three of them. */}
      <ol className="flex flex-col gap-4">
        {connect.steps.map(({ title, body }, i) => (
          <li key={title} className="flex gap-3">
            <span className="text-sm font-medium text-gray-500 tabular-nums">
              {i + 1}.
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-gray-500" />
        <p className="text-[13px] leading-relaxed text-gray-500">
          {CHANNEL_PRIVACY_NOTE}
        </p>
      </div>

      <PanelActions>
        <PrimaryButton onClick={() => notifyPending(`${short} as a channel`)}>
          {connect.cta}
          <ExternalLink className="h-4 w-4" />
        </PrimaryButton>
      </PanelActions>
    </div>
  );
}
