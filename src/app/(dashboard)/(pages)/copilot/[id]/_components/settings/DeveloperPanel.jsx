"use client";

/**
 * Developer — the API reference for driving this copilot from your own code:
 * key, base URL, and a request you can paste into a terminal.
 *
 * ⚠️ NO KEY IS FABRICATED. Everything else in this feature is a content mock,
 * and that is harmless; a string in a field labelled "Your API key" is not —
 * it looks exactly like a secret, so it gets pasted into a repo and treated as
 * one, and the first thing anyone learns is that their integration 401s. The
 * field shows a masked placeholder in the real key's shape and the buttons say
 * what they are waiting for. When the backend mints keys, `apiKey` becomes the
 * response and the same three controls light up.
 *
 * The base URL and the example ARE real — they name the endpoint this copilot
 * will answer on, which is the thing an integrator actually needs to read
 * before it ships, and neither can mislead anyone into thinking they hold a
 * credential.
 */

import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { notifyPending } from "../../../_data/copilots";
import { Section, GhostButton } from "./settingsUi";

/** Where the Copilot API will live, alongside the app's existing userend API. */
const API_BASE = "https://api.creativeklux.com/api/creativeklux-userend";

/** The shape a key will take, masked. Not a key — it has no entropy in it. */
const MASKED_KEY = "ck_live_••••••••••••••••••••••••";

export default function DeveloperPanel({ copilot }) {
  const baseUrl = `${API_BASE}/copilots/${copilot.id}`;

  const example = `curl ${baseUrl}/messages \\
  -H "Authorization: Bearer $CREATIVE_KLUX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "${copilot.description}"}'`;

  const copy = async (value, what) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="API reference"
        description="Connect this copilot to your own code or product."
      >
        {/* ── Key ──────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-gray-500">
            Your API key
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-[12.5px] text-gray-400">
              {MASKED_KEY}
            </p>
            <GhostButton
              onClick={() => notifyPending("API keys")}
              className="px-3 py-2.5"
            >
              <Copy className="h-4 w-4" />
              Copy
            </GhostButton>
            <GhostButton
              onClick={() => notifyPending("API keys")}
              className="px-3 py-2.5"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </GhostButton>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
            Keys are minted by the Copilot backend and shown once. Nothing is
            issued yet, so this one is a placeholder.
          </p>
        </div>

        {/* ── Base URL ─────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-gray-500">
            Base URL
          </p>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-[12.5px] text-gray-700">
              {baseUrl}
            </p>
            <GhostButton
              onClick={() => copy(baseUrl, "Base URL")}
              className="px-3 py-2.5"
            >
              <Copy className="h-4 w-4" />
              Copy
            </GhostButton>
          </div>
        </div>

        {/* ── Example ──────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-gray-500">
            Quick example
          </p>
          {/* Scrolls in both directions rather than wrapping: a wrapped curl
              line pasted into a terminal is a broken curl line. */}
          <div className="relative rounded-xl border border-gray-200 bg-gray-50">
            <pre className="max-h-32 overflow-auto overscroll-contain p-4 pr-12 font-mono text-[12px] leading-relaxed text-gray-700">
              {example}
            </pre>
            <button
              type="button"
              onClick={() => copy(example, "Example")}
              aria-label="Copy example"
              className="absolute top-2 right-2 rounded-lg border border-gray-200 bg-surface p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Docs have no home yet — this says so rather than linking somewhere
            that is not the reference it promises. */}
        <button
          type="button"
          onClick={() => notifyPending("The API documentation")}
          className="flex items-center gap-1.5 self-start text-[13px] font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-500 cursor-pointer"
        >
          View full API documentation
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </Section>
    </div>
  );
}
