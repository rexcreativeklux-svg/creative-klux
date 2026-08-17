"use client";

/**
 * Security — what this copilot may do on its own, and the secrets its backend
 * functions can read.
 *
 * "Security" here is about the COPILOT's authority, not the user's password —
 * that is account-wide and lives on /sessions-and-password, which this panel
 * deliberately does not duplicate.
 *
 * Both destructive permissions default OFF and secret detection defaults ON. A
 * settings sheet nobody has opened yet must not be the reason a copilot deleted
 * a design, and the safe default for a pasted key is to hide it.
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { notifyPending } from "../../../_data/copilots";
import { Section, Row, Toggle, GhostButton } from "./settingsUi";

export default function SecurityPanel({ copilot }) {
  const [updateData, setUpdateData] = useState(false);
  const [deleteData, setDeleteData] = useState(false);
  const [detectSecrets, setDetectSecrets] = useState(true);

  // ⚠️ Held locally. These are enforced server-side once the Copilot backend
  // exists; a switch that flips and does nothing is worse than one that says so.
  const pending = () => toast("Permissions save with the Copilot backend.");

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Copilot permissions"
        description={`Control what ${copilot.name} can do on its own, without asking for your approval first.`}
      >
        <Row
          title="Update data"
          description="Edit your designs, kits and scheduled posts without asking first"
        >
          <Toggle
            checked={updateData}
            onChange={(next) => {
              setUpdateData(next);
              pending();
            }}
            label="Update data"
          />
        </Row>
        <Row
          title="Delete data"
          description="Remove designs, assets and posts without asking first"
        >
          <Toggle
            checked={deleteData}
            onChange={(next) => {
              setDeleteData(next);
              pending();
            }}
            label="Delete data"
          />
        </Row>
        <Row
          title="Auto-detect secrets in messages"
          description="Automatically detect API keys and tokens you paste, save them securely, and hide the raw value from the copilot."
        >
          <Toggle
            checked={detectSecrets}
            onChange={(next) => {
              setDetectSecrets(next);
              pending();
            }}
            label="Auto-detect secrets in messages"
          />
        </Row>
      </Section>

      <Section
        title="Secrets"
        description="Environment variables available to this copilot's backend functions."
        action={
          <GhostButton onClick={() => notifyPending("Secrets")}>
            <Plus className="h-4 w-4" />
            Add
          </GhostButton>
        }
      >
        {/* Nothing seeded: a fake secret name implies an integration the user
            never set up, and this is the one list where that would send them
            looking for a credential that does not exist. */}
        <p className="rounded-xl border border-gray-200 px-4 py-6 text-center text-[12px] leading-relaxed text-gray-400">
          No secrets yet.
          <br />
          Values are write-only — you can replace one, never read it back.
        </p>
      </Section>
    </div>
  );
}
