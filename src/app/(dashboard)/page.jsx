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
import QuickStartCards from "@/app/(components)/home/QuickStartCards";

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
   * Open one of the user's own designs from the rail's Recent tab — fired by the
   * details modal's "Open in editor" button, not by a card click.
   *
   * The editor ALWAYS opens in a new tab, the same way /creatives' hover "Edit"
   * buttons do, so the home rail stays put behind it. `noopener,noreferrer`
   * matches the `rel` those links carry — the new tab gets no `window.opener`
   * handle back into this one. This runs synchronously inside the modal's click
   * handler, so the popup blocker treats it as user-initiated; the router
   * fallback below covers the case where a blocker still refuses.
   *
   * Klux templates do NOT come through here: the modal's button saves them into
   * the user's designs (TemplatesSection.saveTemplate) and reports back through
   * `onSaved` → handleTemplateSaved below.
   * The chat-page fallback at the end only runs for a row that somehow arrived
   * with no `href`, so the button can never be a no-op.
   *
   * @param {{title: string, href?: string|null, kind?: string}} item
   */
  const handleOpenDesign = (item) => {
    if (item.href) {
      console.log(
        `🖼️ [home] opening ${item.kind || "item"} "${item.title}" → ${item.href} (new tab)`,
      );
      const tab = window.open(item.href, "_blank", "noopener,noreferrer");
      if (!tab) {
        console.warn(
          `⚠️ [home] new tab blocked for "${item.title}" — navigating in place instead`,
        );
        router.push(item.href);
      }
      return;
    }
    console.warn(`⚠️ [home] "${item.title}" has no href — falling back to the studio`);
    const params = new URLSearchParams({
      creative: DEFAULT_CREATIVE,
      initialMessage: `Create something based on the "${item.title}" template`,
    });
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  /**
   * A Klux template was just copied into the brand's designs — send the user to
   * their library so the fresh copy is on screen instead of only being promised
   * by a toast.
   *
   * Same tab, not a new one: this is the user's own library rather than an
   * editor session, so the home page is left behind (and the browser's Back
   * button returns to it) instead of piling up a second tab.
   *
   * The "saved" toast fires in TemplatesSection just before this and outlives
   * the navigation — sonner's <Toaster> is mounted once in the root layout — so
   * it is still on screen when /creatives paints.
   *
   * @param {{title: string}} item The template that was saved.
   */
  const handleTemplateSaved = (item) => {
    console.log(`🗂️ [home] "${item.title}" saved → /creatives`);
    router.push("/creatives");
  };

  /**
   * "Browse all" — the rail says which tab is open, because the user's own
   * designs and the public template pool live on different routes.
   *
   * The rail's third tab (Chat History) never reaches this: it has no route to
   * browse to yet, so TemplatesSection hides the button on it entirely. Add the
   * destination here at the same time as that tab gets its endpoint.
   *
   * @param {string} tabId One of TEMPLATE_TABS' ids.
   */
  const handleBrowseAll = (tabId) => {
    const target = tabId === "recent" ? "/creatives" : "/designs";
    console.log(`🗂️ [home] browse all ("${tabId}") → ${target}`);
    router.push(target);
  };

  return (
    // pt-header clears the app's fixed header, which overlays this scroll
    // area. Derived from --spacing-header rather than the hardcoded `pt-16` it
    // replaces, so the clearance follows the header's own fluid height (52px on
    // a phone → 64px on desktop) instead of drifting from it.
    // No pb-nav here: the mobile bottom bar is reserved once, by `main` in
    // (dashboard)/layout.js, which ends the scroll viewport at the bar's top
    // edge. Adding it again would push the template rail up by the bar's
    // height a second time.
    <div className="relative min-h-full bg-page pt-header">
      {/* ── Hero ──────────────────────────────────────────────────────────
          Height is the whole trick (see the note at the top of this file):
            · below lg — a plain viewport-ish height, since there's no sidebar
              on screen to line anything up with. The reserve at the bottom is
              the mobile nav rather than the rail.
            · lg and up — exactly the space left once --ck-rail-top is reserved
              at the bottom, so the rail beneath starts on the sidebar's THEME
              hairline.
          ⚠️ `lg`, not `md` — one of the five places that must agree on where
          the sidebar appears. See the --ck-rail-* note in globals.css.

          100dvh, not 100vh: on a phone `100vh` resolves against the LARGE
          viewport, so the hero measured taller than the screen actually was
          and pushed the rail below the fold.
          Deliberately NOT overflow-hidden: the composer's Model and Build menus
          drop UPWARD, and clipping here would cut them off on short viewports.
          RotatingHeroBackdrop clips itself instead, so its band and patterns
          still can't bleed past the hero.

          pt-[clamp(...)] is what lowers the composer toward the optical centre:
          top padding moves the centred block down by half the padding, and
          min-height is border-box so the section's total height (and therefore
          the rail alignment) is unaffected.

          Two children, in order: the greeting + composer block, which GROWS to
          take whatever height is going and centres itself inside it, and the
          quick-start cards, which keep their own height at the foot. That split
          is what puts the cards just above the rail without pinning them there —
          see the ⚠️ note in QuickStartCards.jsx. */}
      <section className="relative flex min-h-[calc(100dvh-var(--spacing-header)-var(--spacing-nav)-4rem)] flex-col pt-[clamp(1.5rem,7vh,5rem)] lg:min-h-[calc(100dvh-var(--spacing-header)-var(--ck-rail-top))]">
        {/* Eighteen still band-and-pattern treatments — grids, graph paper,
            contours, soft glows — all on the app's blue ramp, differing by form
            rather than hue, cross-faded one into the next every five hours. It
            paints its own band and clips itself, so the section needs neither a
            background nor a z-index of its own. Speed, fade, intensity and the
            on/off switch all live in HERO_BACKDROP_SETTINGS at the top of
            heroBackdrops.js. To pin it to one look instead, swap in
            `<HeroBackdrop backdrop="blueprint" />`. */}
        <RotatingHeroBackdrop />

        <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 pb-10 sm:px-8">
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
              What will you{" "}
              <span className="bg-linear-to-r from-[#003dda] via-blue-300 to-blue-600 bg-clip-text text-transparent">
                Create
              </span>{" "}
              next?
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

        {/* Quick starts — the last thing in the hero, so the padding below them
            is the only gap between the pair and the rail's tab row. That gap is
            deliberately about one card tall, so they read as the foot of the
            hero rather than as a header for the rail.
            Last in the entrance stagger too (60ms greeting → 180ms composer). */}
        <QuickStartCards
          className="animate-hero-in relative pb-6 sm:pb-8"
          style={{ animationDelay: "300ms" }}
        />
      </section>

      {/* Template rails — full-bleed, deliberately outside the wrapper above */}
      <TemplatesSection
        onSelect={handleOpenDesign}
        onSaved={handleTemplateSaved}
        onBrowseAll={handleBrowseAll}
      />
    </div>
  );
}
