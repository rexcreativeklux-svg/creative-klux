"use client";

// app/(dashboard)/page.jsx — the "/" home page (first screen after login)
// ─────────────────────────────────────────────────────────────────────────────
// A greeting, one prompt composer, and the template rail underneath.
//
// Formerly lived at /studio/ai-select (and /home) — both routes were retired in
// favour of this root page. The old overview content now sits at /statistics.
//
// THE LAYOUT IS DELIBERATELY MEASURED, not just centred. On desktop the hero is
// sized to `--ck-rail-top` (globals.css) so the template rail below it starts at
// exactly the height of the sidebar's THEME row — which makes the rail's two
// hairlines continue the sidebar's own two hairlines straight across the window.
// That single alignment is what makes the page read as drafted rather than
// stacked, so if you change the hero's height, change it via that variable.
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
import AmbientVideoBackdrop from "@/app/(components)/home/AmbientVideoBackdrop";
import { buildMessageWithAttachments } from "@/app/(components)/studio/attachmentUrls";

/** The chat page's own pipeline key — see CREATIVE_CONFIG in ai-chat-page. */
const DEFAULT_CREATIVE = "general";

export default function Home() {
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
      `🚀 [home] launching chat — model="${model}", mode="${mode}", ${attachments.length} attachment(s) inlined`,
    );
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  /** A template card opens the chat page seeded with that template's title. */
  const handleTemplateSelect = (item) => {
    console.log(`🖼️ [home] opening template "${item.title}"`);
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
      {/* ── Hero ──────────────────────────────────────────────────────────
          Height is the whole trick (see the note at the top of this file):
            · below md — a plain viewport-ish height, since there's no sidebar
              on screen to line anything up with.
            · md and up — exactly the space left once --ck-rail-top is reserved
              at the bottom, so the rail beneath starts on the sidebar's THEME
              hairline.
          `overflow-hidden` scopes the backdrop: it is absolutely positioned to
          THIS section, so the drifting clip can never bleed over the rail. */}
      <section
        className="relative flex min-h-[calc(100vh-4rem-7rem)] flex-col justify-center overflow-hidden pt-[clamp(1.5rem,7vh,5rem)] md:min-h-[calc(100vh-4rem-var(--ck-rail-top))]"
      >
        {/* A different clip every 24h per user, deeply dimmed under a scrim,
            with the old gradient wash still underneath as the fallback. */}
        <AmbientVideoBackdrop />

        {/* Plinth rules — two hairlines marking out the content column, fading
            away at both ends. Architecture rather than decoration: they give the
            hero an edge to sit inside without drawing a box around it, and they
            land on the same column the composer uses. Desktop only, where
            there's room for the margins to read as intentional. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-5xl -translate-x-1/2 lg:block"
        >
          <span className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-gray-200 to-transparent" />
          <span className="absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-gray-200 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">
          {/* Greeting */}
          <header
            className="animate-hero-in mb-7 text-center"
            style={{ animationDelay: "60ms" }}
          >
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

          {/* Composer — narrower and shorter than the studio's, so it reads as
              an invitation sitting in space rather than a form to fill in. The
              glass skin lets the backdrop through behind it. */}
          <div
            className="animate-hero-in mx-auto w-full max-w-2xl"
            style={{ animationDelay: "180ms" }}
          >
            <PromptComposer onSubmit={handleSubmit} rows={2} variant="glass" />
          </div>
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
