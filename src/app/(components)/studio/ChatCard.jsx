"use client";

// app/(components)/studio/ChatCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The card for ONE saved chat session on the home rail's "Chat History" tab.
//
// Sibling to TemplateCard, not a variant of it. A chat has no layout to paint,
// so where that card renders artwork this one stamps a MONOGRAM on a coloured
// tile — the brand's initials, with its name along the bottom. Everything
// around the tile (the border/padding rhythm that divides the grid, the hover
// wash) is deliberately identical, so the two tabs read as one rail.
//
// The tile's colour is derived from the row itself, not stored: same chat, same
// gradient on every visit, and a wall of them stays legible because neighbours
// land on different hues.
//
// Unlike a template card, this one DOES open its item: there is no details
// modal for a conversation, so a click goes straight to the chat page.

import { ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import { GUTTER } from "./TemplateCard";
import { formatSessionAge, sessionInitials } from "./chatSessions";

/**
 * Tile gradients, in the order a hash picks them. Deep enough that white type
 * holds its contrast, and spread around the wheel so adjacent cards differ.
 *
 * @type {[string, string][]}
 */
const TILE_GRADIENTS = [
  ["#0f766e", "#14b8a6"], // teal
  ["#1d4ed8", "#60a5fa"], // blue
  ["#15803d", "#4ade80"], // green
  ["#0e7490", "#22d3ee"], // cyan
  ["#9f1239", "#f43f5e"], // crimson
  ["#c2410c", "#fb923c"], // orange
  ["#6b21a8", "#c084fc"], // purple
  ["#3730a3", "#818cf8"], // indigo
];

/**
 * Pick a gradient for a key. A plain character sum is enough — this only has to
 * be STABLE (so a card doesn't change colour between visits) and spread out, not
 * cryptographic.
 *
 * @param {string} key
 * @returns {string} A CSS linear-gradient.
 */
function tileGradient(key) {
  let sum = 0;
  const text = String(key || "");
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i);
  const [from, to] = TILE_GRADIENTS[sum % TILE_GRADIENTS.length];
  return `linear-gradient(155deg, ${from} 0%, ${to} 100%)`;
}

/**
 * @param {object} props
 * @param {object} props.item  A row from normalizeChatSession().
 * @param {(item: object) => void} [props.onOpen] Clicked (or Enter/Space).
 */
export default function ChatCard({ item, onOpen }) {
  const open = () => onOpen?.(item);

  // The brand names the chat when there is one; otherwise the message does, so
  // a "a social post" chat still gets a monogram and a name rather than a gap.
  const name = item.brand || item.title;
  // Keyed on the session, not the name: two chats about the same brand should
  // still be told apart at a glance.
  const gradient = tileGradient(item.sessionId || item.id);
  const age = formatSessionAge(item.updatedAt || item.meta);

  return (
    // A div rather than a button, matching TemplateCard — keyboard support is
    // wired up by hand so the card can hold other interactive chrome later.
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      aria-label={`Open chat: ${name}`}
      className={`group flex cursor-pointer flex-col border-b border-r border-gray-200 py-5 transition-colors hover:bg-gray-100/60 focus:outline-none focus-visible:bg-gray-100/60 ${GUTTER}`}
    >
      {/* The tile — same aspect ratio as a template's artwork, so a rail
          switching tabs never jumps in height. */}
      <div
        className="relative flex aspect-16/10 items-center justify-center overflow-hidden rounded-lg"
        style={{ background: gradient }}
      >
        {/* The monogram. `font-serif` and the wide tracking are what stop it
            reading as a UI label — it is the card's artwork. */}
        <span
          aria-hidden="true"
          className="select-none font-serif text-5xl tracking-wider text-white/95 transition-transform duration-300 group-hover:scale-105"
        >
          {sessionInitials(name)}
        </span>

        {/* The name, along the bottom of the tile. The scrim keeps it readable
            over the lighter end of every gradient. */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/35 to-transparent px-3.5 pb-3 pt-8">
          <p className="truncate text-[15px] font-semibold text-white drop-shadow-sm">
            {name}
          </p>
        </div>

        {item.complete && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            <CheckCircle2 className="h-3 w-3" />
            Designs
          </span>
        )}
      </div>

      {/* Name + meta on the left, the action pill on the right — both rows of
          text share the pill's vertical centre. */}
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-gray-900">
            {name}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <MessageSquare className="h-3 w-3 shrink-0" />
            {item.subtitle}
            {age && <span className="text-gray-400">· {age}</span>}
          </p>
        </div>

        {/* One pill, two states — the same affordance a template card carries,
            so the two tabs behave identically. At rest it's the 32px arrow
            chip; on hover (or keyboard focus) the label unrolls to its left and
            the chip grows into a button, saying what a click does before you
            click it.
            NOT a <button>: the whole card already opens the chat, and a real
            button here would nest an interactive element inside a role="button"
            div for no extra behaviour.
            Below `md` there is no hover to give, so the label is simply always
            out — a single-column card has room for it. */}
        <span
          aria-hidden="true"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 pl-3 text-surface transition-all duration-300 ease-out md:gap-0 md:pl-0 md:group-hover:gap-1.5 md:group-hover:pl-3 md:group-focus-visible:gap-1.5 md:group-focus-visible:pl-3"
        >
          <span className="max-w-28 overflow-hidden whitespace-nowrap text-[13px] font-medium opacity-100 transition-all duration-300 ease-out md:max-w-0 md:opacity-0 md:group-hover:max-w-28 md:group-hover:opacity-100 md:group-focus-visible:max-w-28 md:group-focus-visible:opacity-100">
            Open chat
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
      </div>
    </div>
  );
}
