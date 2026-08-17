"use client";

/**
 * The settings sheet's left rail, in order.
 *
 * ONE ordered list that is both the nav and the router: the shell maps over it
 * to draw the rail and looks the active entry up here to render its panel, so a
 * new panel is an entry in this array and a file beside it — never a nav item
 * in one place and a switch statement in another that can disagree about which
 * is which.
 *
 * `id` is the value the workspace rail passes in (and what a `?panel=` would
 * carry if these ever become URLs), so it must stay stable even if a label is
 * reworded.
 *
 * ⚠️ Every panel component takes the SAME props — { copilot, onClose } — which
 * is what lets the shell render whichever one is active without knowing
 * anything about it. Channels takes two more; see CopilotSettingsModal.
 */

import {
  SlidersHorizontal,
  Share2,
  Coins,
  Sparkles,
  MessageCircleMore,
  ShieldCheck,
  Code2,
} from "lucide-react";
import GeneralPanel from "./GeneralPanel";
import SharingPanel from "./SharingPanel";
import CreditUsagePanel from "./CreditUsagePanel";
import PersonalizationPanel from "./PersonalizationPanel";
import ChannelsPanel from "./ChannelsPanel";
import SecurityPanel from "./SecurityPanel";
import DeveloperPanel from "./DeveloperPanel";

export const SETTINGS_NAV = [
  { id: "general", label: "General", Icon: SlidersHorizontal, Panel: GeneralPanel },
  { id: "sharing", label: "Sharing & access", Icon: Share2, Panel: SharingPanel },
  { id: "credits", label: "Credit usage", Icon: Coins, Panel: CreditUsagePanel },
  {
    id: "personalization",
    label: "Personalization",
    Icon: Sparkles,
    Panel: PersonalizationPanel,
  },
  {
    id: "channels",
    label: "Channels",
    Icon: MessageCircleMore,
    Panel: ChannelsPanel,
  },
  { id: "security", label: "Security", Icon: ShieldCheck, Panel: SecurityPanel },
  { id: "developer", label: "Developer", Icon: Code2, Panel: DeveloperPanel },
];

/** The entry for an id, falling back to the first so the sheet always opens. */
export const navItem = (id) =>
  SETTINGS_NAV.find((item) => item.id === id) ?? SETTINGS_NAV[0];
