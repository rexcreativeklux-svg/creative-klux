"use client";

/**
 * Sharing & access — who can reach this copilot, and the link to hand them.
 *
 * The link is REAL (it is this copilot's page, copyable) because a share panel
 * whose one concrete affordance does nothing is worse than no panel. The
 * visibility choice is local: it is a server-side permission, so it is stored
 * nowhere until there is a server to store it, and the panel says so under the
 * choices rather than quietly forgetting.
 */

import { useState } from "react";
import { Lock, Users, Globe, UserPlus } from "lucide-react";
import { notifyPending } from "../../../_data/copilots";
import {
  Section,
  ChoiceList,
  CopyField,
  PanelActions,
  GhostButton,
} from "./settingsUi";

const VISIBILITY = [
  {
    value: "private",
    label: "Private",
    description: "Only you can open this copilot or see its conversations.",
    Icon: Lock,
  },
  {
    value: "workspace",
    label: "Everyone in your workspace",
    description: "Teammates can chat with it and run its workflows.",
    Icon: Users,
  },
  {
    value: "link",
    label: "Anyone with the link",
    description: "Anyone holding the link can chat with it. It still runs on your credits.",
    Icon: Globe,
  },
];

export default function SharingPanel({ copilot }) {
  const [visibility, setVisibility] = useState("private");

  const link =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/copilot/${copilot.id}`;

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Who can access this copilot"
        description="Access is enforced by the Copilot backend, so this choice takes effect once it lands."
      >
        <ChoiceList
          name="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={VISIBILITY}
        />
      </Section>

      <Section
        title="Link"
        description="Where this copilot lives. Sharing the link does not grant access on its own."
      >
        <CopyField label="Copilot link" value={link} />
      </Section>

      <Section
        title="People with access"
        description="Everyone who has been given this copilot directly."
      >
        {/* No seeded members: the team list is real account data, and inventing
            two colleagues here would be putting names on the user's screen that
            do not exist. */}
        <p className="rounded-xl border border-gray-200 px-4 py-6 text-center text-[12px] leading-relaxed text-gray-400">
          Only you, for now.
          <br />
          Invited teammates appear here.
        </p>
        <PanelActions>
          <GhostButton onClick={() => notifyPending("Inviting teammates")}>
            <UserPlus className="h-4 w-4" />
            Invite people
          </GhostButton>
        </PanelActions>
      </Section>
    </div>
  );
}
