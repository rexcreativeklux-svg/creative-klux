"use client";

/**
 * The picture at the top of a channel's connect panel: a code to scan on the
 * left, and a glimpse of the destination on the right.
 *
 * Split out of ChannelConnectView because it is the half that varies — a Slack
 * copilot is mentioned in a channel, the other three are messaged directly, so
 * one of these renders a channel and the rest render a thread. The view around
 * it (steps, note, button) is identical for all four.
 *
 * The conversation shown is THIS copilot's own description, which is already
 * written first-person as the standing job you would ask it for, so the preview
 * shows the copilot in front of the user working rather than a scripted demo.
 */

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import CopilotAvatar from "../../../_components/CopilotAvatar";

/** What the copilot says back, in every preview. Short enough to fit two lines. */
const REPLY = "On it — I'll report back right here.";

/**
 * The scannable code, on the white tile the designs float over the hero.
 *
 * `qrcode` is imported lazily — it is weight that only matters once someone
 * opens this panel, and the same dynamic import is what the editor's share
 * panel uses. It spins in its own tile rather than blocking the panel, which is
 * the state the iMessage design happens to have been captured in.
 */
function ChannelQr({ value }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    let alive = true;
    import("qrcode")
      // 2× the display size so it stays crisp, and margin: 1 because the white
      // tile around it already supplies the quiet zone a scanner needs.
      .then((QR) => QR.toDataURL(value, { width: 320, margin: 1 }))
      .then((url) => alive && setSrc(url))
      // Silent: the button below is the way through either way, and a toast for
      // a decoration the user may not have looked at is noise.
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);

  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-lg md:h-36 md:w-36">
      {src ? (
        // A data: URL made on the client — next/image has nothing to optimise
        // here and would only add a required width/height dance.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full" />
      ) : (
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
      )}
    </div>
  );
}

/** WhatsApp / Telegram / iMessage: a two-bubble thread, in that app's colours. */
function ChatPreview({ copilot, preview }) {
  return (
    <div className="w-56 overflow-hidden rounded-t-2xl bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <ChevronLeft className="h-3 w-3 shrink-0 text-gray-400" />
        <CopilotAvatar copilot={copilot} size="sm" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-gray-900">
          {copilot.name}
        </p>
      </div>
      <div className={`${preview.surface} px-3 pt-2 pb-4`}>
        <p className="text-center text-[8px] text-gray-500">Today</p>
        <p
          className={`mt-1.5 ml-auto w-[88%] rounded-lg rounded-tr-sm ${preview.bubble} px-2 py-1.5 text-[10px] leading-snug`}
        >
          {copilot.description}
        </p>
        <p className="mt-1.5 w-[88%] rounded-lg rounded-tl-sm bg-white px-2 py-1.5 text-[10px] leading-snug text-gray-700 shadow-sm">
          {REPLY}
        </p>
      </div>
    </div>
  );
}

/**
 * Slack: a channel, with someone mentioning the copilot and the copilot
 * answering — the gesture step 3 describes. The APP badge is the giveaway that
 * the second poster is a bot, and it is how Slack itself marks them.
 */
function SlackPreview({ copilot }) {
  const handle = `@${copilot.id}`;
  return (
    <div className="w-56 overflow-hidden rounded-t-2xl bg-white shadow-xl">
      <p className="border-b border-gray-100 px-3 py-2 text-[11px] font-bold text-gray-900">
        #brand-team
      </p>
      <div className="flex flex-col gap-2.5 px-3 py-2.5">
        <div className="flex gap-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-500 text-[8px] font-bold text-white">
            MC
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-900">
              Mike C. <span className="font-normal text-gray-400">9:01 AM</span>
            </p>
            <p className="text-[10px] leading-snug text-gray-700">
              <span className="rounded bg-blue-50 px-1 text-blue-600">
                {handle}
              </span>{" "}
              can you take this one?
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CopilotAvatar copilot={copilot} size="sm" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-900">
              {copilot.name}{" "}
              <span className="rounded bg-gray-100 px-1 text-[7px] font-semibold text-gray-500">
                APP
              </span>{" "}
              <span className="font-normal text-gray-400">9:01 AM</span>
            </p>
            <p className="text-[10px] leading-snug text-gray-700">{REPLY}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.channel  A row from ../../../_data/channels.
 * @param {Object} props.copilot  Named in the preview, and what the code points at.
 * @param {string} props.qrValue  Encoded in the code.
 */
export default function ChannelPreview({ channel, copilot, qrValue }) {
  const { hero, preview } = channel.connect;
  return (
    // The phone runs off the bottom and the right: it is a glimpse of the
    // destination, not a second thing to read. Below `sm` it is dropped rather
    // than shrunk — a 56px-wide chat mockup is a smudge — and the code centres.
    <div
      className={`relative flex items-center justify-center gap-4 overflow-hidden rounded-xl ${hero} p-5 sm:justify-between sm:pl-8`}
    >
      <ChannelQr value={qrValue} />
      <div className="hidden shrink-0 translate-y-5 -mr-5 sm:block">
        {preview.kind === "slack" ? (
          <SlackPreview copilot={copilot} />
        ) : (
          <ChatPreview copilot={copilot} preview={preview} />
        )}
      </div>
    </div>
  );
}
