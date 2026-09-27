"use client";

/**
 * "Connect to WhatsApp" — the sub-view the Channels panel pushes when a channel
 * is picked, and what a "Continue on …" row in the workspace rail opens
 * directly.
 *
 * ONE view for every channel: the colour, the preview, the button label and the
 * numbered steps are fields on the channel's `connect` block in
 * ../../../_data/channels, so another channel is a row of data rather than
 * another copy of this file.
 *
 * How linking works (backend): one shared bot / number serves every copilot.
 * The user sends `LINK <code>` once and that chat is bound to this copilot from
 * then on. The deep links from `GET copilots/{id}` pre-fill that message
 * (WhatsApp) or send it on Start (Telegram), so the QR and the button both
 * point at them and nobody has to type the code.
 *
 * ⚠️ THE CODE IS A SECRET. Whoever holds it can talk to this copilot, which
 * runs with the brand's connected Gmail, Calendar and Drive. It is shown here
 * because this sheet is the owner's, and the hint under it says so.
 */

import { ExternalLink, ShieldCheck } from "lucide-react";
import { CHANNEL_PRIVACY_NOTE } from "../../../_data/channels";
import ChannelPreview from "./ChannelPreview";
import useChannelLinks from "./useChannelLinks";
import { CopyField, PanelActions, PrimaryButton } from "./settingsUi";

export default function ChannelConnectView({ channel, copilot }) {
  const { connect } = channel;
  const { links, loading, error, retry } = useChannelLinks(copilot.id);
  const href = links?.[channel.id] ?? "";

  // The sandbox join goes FIRST: until it is sent, the test number drops
  // everything else from this user without a word, LINK message included.
  const steps = connect.joinPhrase
    ? [
        {
          title: "Join the test number",
          body: `Before anything else, send “${connect.joinPhrase}” in the chat. Until you do, WhatsApp silently drops your messages.`,
        },
        ...connect.steps,
      ]
    : connect.steps;

  return (
    <div className="flex flex-col gap-5">
      {/* An empty value keeps the QR tile spinning while the link loads. */}
      <ChannelPreview channel={channel} copilot={copilot} qrValue={href} />

      {loading ? (
        <div className="flex flex-col gap-1.5">
          <span className="h-3.5 w-28 animate-pulse rounded bg-gray-100" />
          <span className="h-10.5 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-[13px] text-red-600">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="shrink-0 text-[13px] font-medium text-red-600 underline underline-offset-2 cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : (
        <CopyField
          label="Your link message"
          value={links.link_message}
          hint="Anyone with this code can chat with this copilot and use your brand's connected accounts. Keep it to yourself."
        />
      )}

      {/* A real <ol>: these are ordered instructions and the numbers are the
          content, not decoration. Rendered from the list so the markers cannot
          disagree with the order. */}
      <ol className="flex flex-col gap-4">
        {steps.map(({ title, body }, i) => (
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
        <PrimaryButton
          disabled={!href}
          onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
        >
          {connect.cta}
          <ExternalLink className="h-4 w-4" />
        </PrimaryButton>
      </PanelActions>
    </div>
  );
}
