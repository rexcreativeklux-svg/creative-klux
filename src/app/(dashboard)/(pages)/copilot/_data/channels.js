"use client";

/**
 * Where a copilot can be carried on outside the app — the "Continue on …" list
 * in the workspace panel, and the Channels panel of the copilot settings sheet.
 *
 * ⚠️ These are MESSAGING channels, deliberately separate from
 * (lib)/integrations/platforms.jsx. That registry answers "where can this brand
 * publish?" and every entry there is something the publish flow can post to;
 * these answer "where can I keep talking to this copilot?". Folding them into
 * one list would put WhatsApp in front of a user picking somewhere to publish an
 * ad.
 *
 * ⚠️ The glyphs are lucide stand-ins on each service's brand colour, NOT the
 * real marks — the platforms registry earns its brand SVGs by being a connect
 * surface, and hand-copying four more wordmarks for a channel list nothing can
 * connect to yet is how you end up shipping a subtly wrong logo. Swap them for
 * proper marks when the channels are actually wired.
 *
 * ── The `connect` block ─────────────────────────────────────────────────────
 * Everything ChannelConnectView renders comes from here, so another channel is a
 * row in this file rather than a branch in the view:
 *
 *   blurb    the one-line pitch on the Channels list — what talking to a
 *            copilot there is actually like, and how connecting works.
 *   hero     the flat colour behind the code and the preview. Straight from
 *            each channel's design — they are NOT the service's brand colour
 *            (WhatsApp's card is orange), so they cannot be derived from `tint`.
 *   preview  what the phone beside the code shows: a two-bubble thread, with
 *            its own surface and outgoing-bubble colours per channel.
 *   cta      the primary button's label.
 *   joinPhrase  optional; prepends a "join the test number" step (WhatsApp
 *            sandbox only).
 *   steps    the numbered instructions, in order.
 *
 * The links themselves (QR, button) are NOT here — they carry the copilot's
 * secret code and come from `GET copilots/{id}`, keyed by these same ids.
 */

import { MessageCircle, Send } from "lucide-react";

/**
 * The reassurance line under every channel's steps. One string, not one per
 * channel: it is a promise about how the product handles messages, so it must
 * not drift into slightly different promises.
 */
export const CHANNEL_PRIVACY_NOTE =
  "We only see messages you send to your copilot. You can disconnect anytime.";

export const CHANNELS = [
  {
    id: "whatsapp",
    label: "Continue on WhatsApp",
    short: "WhatsApp",
    Icon: MessageCircle,
    tint: "bg-[#25D366]",
    blurb:
      "Chat with your copilot on WhatsApp. Scan the QR code and send the message it fills in.",
    connect: {
      hero: "bg-[#F97316]",
      cta: "Open WhatsApp",
      // Twilio's sandbox number ignores anyone who has not sent its join phrase
      // first, and the wa.me link cannot pre-fill it. Set while on the sandbox;
      // unset it once there is a production sender and the step disappears.
      joinPhrase: process.env.NEXT_PUBLIC_WHATSAPP_SANDBOX_JOIN || null,
      preview: {
        kind: "chat",
        surface: "bg-[#EFE7DE]",
        bubble: "bg-[#DCF8C6] text-gray-900",
      },
      steps: [
        {
          title: "Scan the QR code or click the button",
          body: "WhatsApp opens with your link message already typed in.",
        },
        {
          title: "Send the link message",
          body: "Send it as it is. Your copilot says hello, and from then on it answers every message from this number.",
        },
      ],
    },
  },
  {
    id: "telegram",
    label: "Continue on Telegram",
    short: "Telegram",
    Icon: Send,
    tint: "bg-[#229ED9]",
    blurb:
      "Chat with your copilot on Telegram. Scan the QR code, tap Start, and you're connected.",
    connect: {
      hero: "bg-[#DCEB6E]",
      cta: "Open Telegram",
      preview: {
        kind: "chat",
        surface: "bg-[#CFE3F2]",
        bubble: "bg-[#E1FFC7] text-gray-900",
      },
      steps: [
        {
          title: "Scan the QR code or click the button",
          body: "Telegram opens the Creative Klux bot.",
        },
        {
          title: "Tap Start",
          body: "That links this chat to your copilot, with no code to type. If Start doesn't appear, send the link message instead.",
        },
      ],
    },
  },
];

/** Look one up by the id the settings sheet carries around. */
export const channelById = (id) => CHANNELS.find((c) => c.id === id) ?? null;
