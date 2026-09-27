"use client";

/**
 * The picture at the top of a channel's connect panel: a code to scan on the
 * left, and a glimpse of the destination on the right.
 *
 * Split out of ChannelConnectView because it is the half that varies per
 * channel (colours, surface). The view around it (steps, note, button) is
 * identical for every channel.
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
 * panel uses. It spins in its own tile rather than blocking the panel.
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

/** WhatsApp / Telegram: a two-bubble thread, in that app's colours. */
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
        <ChatPreview copilot={copilot} preview={preview} />
      </div>
    </div>
  );
}
