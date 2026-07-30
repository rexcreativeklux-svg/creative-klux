"use client";

/**
 * PlatformChip — tiny brand badge shown on Copilot idea cards (LinkedIn,
 * Gmail, TikTok, Sheets, Stripe). Lucide dropped its brand glyphs, so chips
 * fall back to a letter mark where no close icon exists.
 *
 * @param {Object} props
 * @param {"linkedin"|"gmail"|"tiktok"|"sheets"|"stripe"} props.platform
 */

import { Mail, Music2, Table } from "lucide-react";

const CHIPS = {
  linkedin: { className: "bg-[#0a66c2] text-white", label: "in" },
  gmail: { className: "bg-surface border border-gray-200", icon: Mail, iconClassName: "text-[#ea4335]" },
  tiktok: { className: "bg-black text-white", icon: Music2, iconClassName: "text-white" },
  sheets: { className: "bg-surface border border-gray-200", icon: Table, iconClassName: "text-[#188038]" },
  stripe: { className: "bg-[#635bff] text-white", label: "S" },
};

const PlatformChip = ({ platform }) => {
  const chip = CHIPS[platform];
  if (!chip) return null;
  const Icon = chip.icon;
  return (
    <span
      className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${chip.className}`}
      title={platform}
    >
      {Icon ? <Icon className={`h-3.5 w-3.5 ${chip.iconClassName}`} /> : chip.label}
    </span>
  );
};

export default PlatformChip;
