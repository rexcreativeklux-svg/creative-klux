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
//   model           the composer's model choice, sent on to the API
//   mode            Build/Plan. UI state only for now — the chat API has no
//                   field for it, so it travels no further than this URL
//   image           repeated once per attached image URL; the chat page collects
//                   them back into the API's `images` array
//
// Colours come from the app's theme tokens (bg-page / bg-surface / gray-*), so
// light and dark both follow the user's chosen theme with no per-mode overrides.

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PromptComposer from "@/app/(components)/studio/PromptComposer";
import TemplatesSection from "@/app/(components)/studio/TemplatesSection";
import RotatingHeroBackdrop from "@/app/(components)/home/RotatingHeroBackdrop";

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
   * @param {{prompt: string, model: string, mode: string, images: string[]}} payload
   */
  const handleSubmit = ({ prompt, model, mode, images }) => {
    // Images ride the URL as their own repeated `image` param — they are NOT
    // folded into the message, because the API takes a separate `images` array.
    const params = new URLSearchParams({ creative: DEFAULT_CREATIVE, model, mode });
    if (prompt) params.set("initialMessage", prompt);
    images.forEach((url) => params.append("image", url));

    console.log(
      `🚀 [home] launching chat — model="${model}", mode="${mode}", ${images.length} image(s) attached`,
    );
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  /**
   * Use a template — fired by the details modal's "Use this template" button,
   * not by the card click itself (a card opens TemplateDetailsModal first).
   * Opens the chat page seeded with that template's title.
   */
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
          Deliberately NOT overflow-hidden: the composer's Model and Build menus
          drop UPWARD, and clipping here would cut them off on short viewports.
          RotatingHeroBackdrop clips itself instead, so its band and patterns
          still can't bleed past the hero.

          pt-[clamp(...)] is what lowers the composer toward the optical centre:
          with justify-center, top padding moves the centred block down by half
          the padding, and min-height is border-box so the section's total height
          (and therefore the rail alignment) is unaffected. */}
      <section
        className="relative flex min-h-[calc(100vh-4rem-7rem)] flex-col justify-center pt-[clamp(1.5rem,7vh,5rem)] md:min-h-[calc(100vh-4rem-var(--ck-rail-top))]"
      >
        {/* Eighteen still band-and-pattern treatments — grids, graph paper,
            contours, soft glows — all on the app's blue ramp, differing by form
            rather than hue, cross-faded one into the next every five hours. It
            paints its own band and clips itself, so the section needs neither a
            background nor a z-index of its own. Speed, fade, intensity and the
            on/off switch all live in HERO_BACKDROP_SETTINGS at the top of
            heroBackdrops.js. To pin it to one look instead, swap in
            `<HeroBackdrop backdrop="blueprint" />`. */}
        <RotatingHeroBackdrop />

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
