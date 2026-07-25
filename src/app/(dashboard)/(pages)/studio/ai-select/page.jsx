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

/** The chat page's own pipeline key — see CREATIVE_CONFIG in ai-chat-page. */
const DEFAULT_CREATIVE = "general";

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
    const params = new URLSearchParams({ creative: DEFAULT_CREATIVE, model, mode });
    if (prompt) params.set("initialMessage", prompt);
    attachments.forEach((url) => params.append("attachment", url));

    console.log(
      `🚀 [ai-select] launching chat — model="${model}", mode="${mode}", ${attachments.length} attachment(s)`,
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
      {/* Ambient wash — a soft brand tint behind the composer. Sits under the
          content and adapts to the theme via low-alpha colour stops. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(55%_70%_at_50%_35%,rgba(0,61,218,0.07),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        {/* Hero — sized to the visible area minus a deliberate 7rem sliver, so
            the composer lands near the optical centre of the screen and the
            template rail below peeks just enough to invite a scroll without
            ever showing a whole card. */}
        <section className="flex min-h-[calc(100vh-4rem-7rem)] flex-col justify-center pb-10">
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

        {/* Template rails */}
        <TemplatesSection onSelect={handleTemplateSelect} />
      </div>
    </div>
  );
}
