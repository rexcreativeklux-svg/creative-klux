"use client";

// app/(dashboard)/(pages)/studio/ai-select/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Studio entry point: a personal greeting, one prompt composer, and the
// template rails underneath.
//
// The page itself stays deliberately thin — a greeting, <PromptComposer />,
// <TemplatesSection />, and the routing that ties them to the chat page. All the
// real behaviour (gallery upload, dictation, template fetching) lives in
// _components so each piece can be reused on another surface as-is.
//
// Everything routes into /studio/ai-chat-page, which reads:
//   creative        the pipeline — always "general" here; the assistant infers
//                   ads / social / design intent from the prompt itself
//   initialMessage  the typed or dictated prompt
//   model, mode     the composer's selections, already on the URL so the backend
//                   only has to start reading them (creativeAiChat is untouched)
//   attachment      repeated once per attached gallery URL
//
// Colours come from the app's theme tokens (bg-page / bg-surface / gray-*), so
// light and dark both follow the user's chosen theme with no per-mode overrides.

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PromptComposer from "@/app/(components)/studio/PromptComposer";
import TemplatesSection from "@/app/(components)/studio/TemplatesSection";
import AmbientOrbCanvas from "@/app/(components)/studio/AmbientOrbCanvas";
import { buildMessageWithAttachments } from "@/app/(components)/studio/attachmentUrls";

/** The chat page's own pipeline key — see CREATIVE_CONFIG in ai-chat-page. */
const DEFAULT_CREATIVE = "general";

/**
 * Orb layout for the hero backdrop. The shared component's default is tuned for
 * the chat page's preview PANEL; a full-width hero needs more of them, spread
 * wider, so the wash doesn't clump in the middle. `x`/`y` are fractions of the
 * backdrop, `r` is scaled by `orbScale` below.
 */
const HERO_ORBS = [
  { x: 0.18, y: 0.34, r: 120, phase: 0, speed: 0.003 },
  { x: 0.78, y: 0.58, r: 95, phase: 1.9, speed: 0.004 },
  { x: 0.5, y: 0.16, r: 70, phase: 3.1, speed: 0.006 },
  { x: 0.36, y: 0.78, r: 85, phase: 4.4, speed: 0.0035 },
  { x: 0.92, y: 0.2, r: 70, phase: 2.4, speed: 0.005 },
];

export default function StudioSelectPage() {
  const router = useRouter();
  const { user } = useAuth();

  // First name only — "Hi Kingsley." reads better than the full account name.
  const firstName = useMemo(() => {
    const name = (user?.name || "").trim();
    return name ? name.split(/\s+/)[0] : "";
  }, [user?.name]);

  /**
   * Send the composer's payload to the chat page.
   * @param {{prompt: string, model: string, mode: string, attachments: string[]}} payload
   */
  const handleSubmit = ({ prompt, model, mode, attachments }) => {
    // Attachment URLs are folded into the message string itself, so the chat
    // page receives one `initialMessage` and the API payload stays
    // { message, creative_type, mode, history } with message a plain string.
    const message = buildMessageWithAttachments(prompt, attachments);

    const params = new URLSearchParams({ creative: DEFAULT_CREATIVE, model, mode });
    if (message) params.set("initialMessage", message);

    console.log(
      `🚀 [ai-select] launching chat — model="${model}", mode="${mode}", ${attachments.length} attachment(s) inlined`,
    );
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  /** A template card opens the chat page seeded with that template's title. */
  const handleTemplateSelect = (item) => {
    console.log(`🖼️ [ai-select] opening template "${item.title}"`);
    if (item.href) {
      router.push(item.href);
      return;
    }
    const params = new URLSearchParams({
      creative: DEFAULT_CREATIVE,
      initialMessage: `Create something based on the "${item.title}" template`,
    });
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  return (
    // pt-16 clears the app's fixed 4rem header, which overlays this scroll area.
    <div className="relative min-h-full bg-page pt-16">
      {/* ── Ambient backdrop ──────────────────────────────────────────────
          The same drifting orbs and dots the chat page's preview pane wears
          (AmbientOrbCanvas), so the two Studio surfaces read as one space. It
          spans the hero only and is layered under everything:
            · radial wash  — a soft brand tint pooled behind the composer
            · orb canvas   — the animated field
            · fade-out     — melts the field into the page above the rail, so
                             the templates below sit on a clean background
          The scanline sweep the preview pane also carries is deliberately NOT
          used here — at full-page width it read as a stray line.
          All of it is decorative and pointer-events-none, so nothing here can
          intercept a click meant for the composer.

          Its height matches exactly where the hero ends (the wrapper's pt-16 +
          the hero's min-h below), so the field never runs on behind the rail. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100vh-11rem)] overflow-hidden sm:h-[calc(100vh-14rem)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_35%,rgba(0,61,218,0.07),transparent_70%)]" />
        <AmbientOrbCanvas orbs={HERO_ORBS} orbScale={2.2} particleCount={26} linkDistance={110} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-page" />
      </div>

      {/* Hero — capped and centred. Sized to the visible area minus a deliberate
          sliver, so the composer lands above the optical centre of the screen
          and the template rail below shows its tab row plus about half a card —
          enough to prove there's more without a scroll. */}
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem-11rem)] w-full max-w-5xl flex-col justify-center px-5 pb-10 sm:min-h-[calc(100vh-4rem-14rem)] sm:px-8">
        {/* Greeting */}
        <header className="mb-8 text-center">
          {firstName && (
            <h1 className="text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-tight text-gray-900">
              Hi {firstName}
              <span className="text-blue-600">.</span>
            </h1>
          )}
          <h2 className="text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-tight text-gray-900">
            What will you create next?
          </h2>
        </header>

        {/* Composer */}
        <div className="mx-auto w-full max-w-3xl">
          <PromptComposer onSubmit={handleSubmit} />
        </div>
      </section>

      {/* Template rails — full-bleed, deliberately outside the wrapper above */}
      <TemplatesSection
        onSelect={handleTemplateSelect}
        onBrowseAll={() => router.push("/designs")}
      />
    </div>
  );
}
