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
 * Everything ChannelConnectView renders comes from here, so a fifth channel is a
 * row in this file rather than a branch in the view:
 *
 *   blurb    the one-line pitch on the Channels list — what talking to a
 *            copilot there is actually like, and how connecting works.
 *   hero     the flat colour behind the code and the preview. Straight from
 *            each channel's design — they are NOT the service's brand colour
 *            (WhatsApp's card is orange), so they cannot be derived from `tint`.
 *   preview  what the phone beside the code shows. `chat` is a two-bubble
 *            thread (its own surface and outgoing-bubble colours per channel);
 *            `slack` is a channel with two posts, because a Slack copilot is
 *            mentioned in a channel rather than DMed, and showing it as a DM
 *            would teach the wrong gesture.
 *   cta      the primary button's label.
 *   steps    the numbered instructions, in order. Slack has three.
 */

import { MessageCircle, Send, MessageSquare, Hash } from "lucide-react";

/**
 * The reassurance line under every channel's steps. One string, not four: it is
 * a promise about how the product handles messages, so it must not drift into
 * four slightly different promises.
 */
export const CHANNEL_PRIVACY_NOTE =
  "We only see messages you send to your copilot. You can disconnect anytime.";

/**
 * What the copilot is called inside a Slack workspace. It is ONE app installed
 * per workspace that every copilot answers through — which is exactly the thing
 * step 2 has to warn about, since users go looking for their copilot's own name
 * in the /invite list and do not find it.
 */
export const SLACK_APP_NAME = "Creative Klux Copilots";

export const CHANNELS = [
  {
    id: "whatsapp",
    label: "Continue on WhatsApp",
    short: "WhatsApp",
    Icon: MessageCircle,
    tint: "bg-[#25D366]",
    blurb:
      "Chat with your copilot on WhatsApp. Scan the QR code or send a quick activation code.",
    connect: {
      hero: "bg-[#F97316]",
      cta: "Open WhatsApp",
      preview: {
        kind: "chat",
        surface: "bg-[#EFE7DE]",
        bubble: "bg-[#DCF8C6] text-gray-900",
      },
      steps: [
        {
          title: "Scan the QR code or click the button",
          body: "Scan the QR code with your phone or click the button to open the conversation in WhatsApp.",
        },
        {
          title: "Send the activation code",
          body: "Send the activation code in the chat to start sending and receiving messages through your copilot.",
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
      "Chat with your copilot on Telegram. We'll create a private bot for you in one click.",
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
          body: "Scan the QR code with your phone or click the button to open the bot in Telegram.",
        },
        {
          title: "Send the activation code",
          body: "Confirm the bot in Telegram, then we'll set everything up automatically.",
        },
      ],
    },
  },
  {
    id: "imessage",
    label: "Continue on iMessage",
    short: "iMessage",
    Icon: MessageSquare,
    tint: "bg-[#34C759]",
    blurb:
      "Chat with your copilot from any Apple device. Verify by texting a short code from your iPhone or Mac.",
    connect: {
      hero: "bg-[#3A5BE0]",
      cta: "Open iMessage",
      preview: {
        kind: "chat",
        surface: "bg-white",
        bubble: "bg-[#3B82F6] text-white",
      },
      steps: [
        {
          title: "Scan the QR code or click the button",
          body: "Scan the QR code with your phone or click the button to open the conversation in iMessage.",
        },
        {
          title: "Send the activation code",
          body: "Send the activation code in the chat to start sending and receiving messages through your copilot.",
        },
      ],
    },
  },
  {
    id: "slack",
    label: "Continue on Slack",
    short: "Slack",
    Icon: Hash,
    tint: "bg-[#4A154B]",
    blurb:
      "Add your copilot to a Slack workspace. Mention its @handle in a channel and it replies in the thread.",
    connect: {
      hero: "bg-[#8E96F0]",
      cta: "Add to Slack",
      preview: { kind: "slack" },
      steps: [
        {
          title: "Scan the QR code or click the button",
          body: `Scan the QR code with your phone or click the button to add “${SLACK_APP_NAME}” to your workspace.`,
        },
        {
          title: `Invite ${SLACK_APP_NAME} to a channel`,
          body: `In Slack, type /invite and pick the app “${SLACK_APP_NAME}” (not your copilot's name) in each channel you want your copilot in.`,
        },
        {
          title: "Mention your copilot",
          body: "Use your copilot's @handle (you'll see it after connecting) — it replies in a thread.",
        },
      ],
    },
  },
];

/** Look one up by the id the settings sheet carries around. */
export const channelById = (id) => CHANNELS.find((c) => c.id === id) ?? null;
