"use client";

/**
 * Credit usage — what this copilot has spent, and where the balance lives.
 *
 * ⚠️ THE NUMBERS ARE NOT INVENTED. Everything else in the Copilot feature is a
 * content mock (seeded copilots, starter ideas) and that is harmless; a credit
 * balance is ACCOUNT FACT, and a made-up "412 of 2,000 used" would be read as
 * the user's real spend. Per-copilot metering does not exist yet, so the meter
 * and the breakdown render their empty state and the panel points at
 * /billing — which is genuinely live, reading the signed-in user's package.
 *
 * When metering lands, `USAGE` becomes the response and the em-dashes fill in;
 * the layout is already the one the real numbers want.
 */

import Link from "next/link";
import { ArrowUpRight, Coins } from "lucide-react";
import { Section, Row } from "./settingsUi";

/**
 * The things a copilot spends credits ON — the same surfaces its workflows run
 * in, so the breakdown lines up with what the user asked it to do rather than
 * with backend job names.
 */
const SPEND_LINES = [
  { label: "Conversations", hint: "Messages you exchange with it" },
  { label: "Workflow runs", hint: "Its standing jobs, on schedule" },
  { label: "Generations", hint: "Designs, copy and images it makes" },
];

export default function CreditUsagePanel({ copilot, onClose }) {
  return (
    <div className="flex flex-col gap-6">
      <Section
        title="This billing period"
        description={`Credits ${copilot.name} has used since your plan last renewed.`}
      >
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">
                —
              </p>
              <p className="mt-0.5 text-[12px] text-gray-500">
                credits used by this copilot
              </p>
            </div>
            <Coins className="h-5 w-5 shrink-0 text-gray-400" />
          </div>
          {/* The meter, empty. It is here so the panel does not re-lay-out when
              the first real number arrives. */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-0 rounded-full bg-blue-600" />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-gray-400">
            Per-copilot metering arrives with the Copilot backend. Your plan
            balance is live on Plans &amp; Billing.
          </p>
        </div>

        <Link
          href="/billing"
          onClick={onClose}
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          <span>
            <span className="block text-[13px] font-medium text-gray-900">
              Plans &amp; Billing
            </span>
            <span className="block text-[12px] text-gray-500">
              Your plan, quotas and license codes
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400" />
        </Link>
      </Section>

      <Section
        title="Where the credits go"
        description="Broken down by the kind of work this copilot does."
      >
        {SPEND_LINES.map(({ label, hint }) => (
          <Row key={label} title={label} description={hint}>
            <span className="text-[13px] font-medium text-gray-400 tabular-nums">
              —
            </span>
          </Row>
        ))}
      </Section>
    </div>
  );
}
