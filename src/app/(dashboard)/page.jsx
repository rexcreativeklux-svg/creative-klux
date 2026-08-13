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
// Everything routes into /studio/ai-chat-page. The Import Site tab takes one
// detour first — it POSTs the pasted link to /brands/import and makes the brand
// that comes back the opening message, so the assistant starts the conversation
// already knowing the site (see importSiteThenLaunch). Every other tab hands the
// typed prompt straight over.
//
// The chat page reads:
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

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import ComposerShell from "@/app/(components)/studio/ComposerShell";
import PromptComposer from "@/app/(components)/studio/PromptComposer";
import TemplatesSection from "@/app/(components)/studio/TemplatesSection";
import RotatingHeroBackdrop from "@/app/(components)/home/RotatingHeroBackdrop";
import QuickStartCards from "@/app/(components)/home/QuickStartCards";
import HomePromptSuggestions from "@/app/(components)/home/HomePromptSuggestions";
import {
  HOME_COMPOSER_TABS,
  TAB_BRAND,
  TAB_IMPORT,
  TAB_WEB,
  buildBrandPrompt,
  buildImportedSitePrompt,
  normalizeImportedBrand,
  placeholderForTab,
  splitPromptUrl,
} from "@/app/(components)/home/homeComposerTabs";
import { toImagePayload } from "@/app/(components)/studio/attachmentUrls";

/** The chat page's own pipeline key — see CREATIVE_CONFIG in ai-chat-page. */
const DEFAULT_CREATIVE = "general";

export default function Home() {
  const router = useRouter();
  const { user, activeBrand, brandsLoading, sendUrl } = useAuth();

  // ── The composer's tab strip ───────────────────────────────────────────────
  // The tab is part of submit for ONE of the three: Import Site scrapes the
  // pasted link before anything is sent (handleSubmit below). Ai Chat and Brand
  // Kit still only change the placeholder and what's seeded into the box.
  const [composerTab, setComposerTab] = useState(HOME_COMPOSER_TABS[0].id);
  // The Import Site round trip. The user is still looking at the hero while it
  // runs — nothing has navigated yet — so the composer shows it on the send
  // button and refuses a second submit until it's done.
  const [importing, setImporting] = useState(false);
  // The composer owns its own text; this is the handle it exposes so the brand
  // tab can write into it and take that text back out again.
  const composerRef = useRef(null);
  // Focus lives up here because the SHELL is what reacts to it: the assembly
  // lifts as one object when the user starts typing, instead of the input
  // growing a shadow of its own inside the tray that already surrounds it.
  const [composerFocused, setComposerFocused] = useState(false);

  /**
   * Switch tabs, and do that tab's one job to the prompt box:
   *   Active Brand  → fill the box with the active brand's details
   *   anything else → if we're LEAVING Active Brand, take those details back out
   *
   * The clear is unconditional by design: the seeded block belongs to that tab,
   * so it leaves with it whether or not the user edited it. Switching between
   * Web App and Mobile App never touches the text — neither of them put any
   * there.
   *
   * @param {string} tabId One of HOME_COMPOSER_TABS' ids.
   */
  const handleTabChange = (tabId) => {
    const leaving = composerTab;
    setComposerTab(tabId);

    if (tabId === TAB_BRAND) {
      if (brandsLoading) {
        console.log("⏳ [home] brands still loading — nothing to seed yet");
        toast.info("Still loading your brands — try that again in a moment.");
        return;
      }
      const details = buildBrandPrompt(activeBrand);
      if (!details) {
        console.warn(
          "⚠️ [home] no active brand details to seed the prompt with",
        );
        toast.error(
          activeBrand
            ? "This brand has no details saved yet — add them under Brand."
            : "No active brand yet — pick one from the brand menu first.",
        );
        return;
      }
      console.log(`🎨 [home] seeding the prompt with "${activeBrand.name}"`);
      composerRef.current?.setPrompt(details);
      return;
    }

    if (leaving === TAB_BRAND) {
      console.log("🧹 [home] left Active Brand — clearing the seeded details");
      composerRef.current?.clear();
    }
  };

  /**
   * A starter prompt was clicked. What that does to the box depends on whether
   * the tab has already put something there:
   *
   *   Ai Chat      → REPLACE. The box is empty and the chip is the whole brief,
   *                  so picking a second one swaps the idea rather than stacking
   *                  two unrelated prompts on top of each other.
   *   Import Site  → APPEND, under the link the user pasted.
   *   Brand Kit    → APPEND, under the seeded brand details.
   *
   * The last two are not a nicety. Those tabs exist to get something INTO the
   * box — a URL, the brand's colours and fonts — and their chips are written as
   * instructions about that content ("Make ads from this homepage", "Design an
   * ad in this palette"). Replacing would delete the very thing the line refers
   * to and leave a dangling "this", which is what made the chips read as
   * unrelated to their tab. buildBrandPrompt's trailing blank line was written
   * to leave room for this.
   *
   * @param {string} suggestion The chip's text.
   */
  const handleSuggestionPick = (suggestion) => {
    if (composerTab === TAB_WEB) {
      composerRef.current?.setPrompt(suggestion);
      return;
    }
    composerRef.current?.appendPrompt(suggestion);
  };

  // First name only — "Hi Kingsley." reads better than the full account name.
  const firstName = useMemo(() => {
    const name = (user?.name || "").trim();
    return name ? name.split(/\s+/)[0] : "";
  }, [user?.name]);

  /**
   * Send a payload to the chat page. The prompt becomes the opening message and
   * the assistant answers it there — this page does no talking to the AI itself.
   *
   * @param {{prompt: string, model: string, mode: string, images: string[]}} payload
   */
  const launchChat = ({ prompt, model, mode, images }) => {
    // Images ride the URL as their own repeated `image` param — they are NOT
    // folded into the message, because the API takes a separate `images` array.
    const params = new URLSearchParams({
      creative: DEFAULT_CREATIVE,
      model,
      mode,
    });
    if (prompt) params.set("initialMessage", prompt);
    images.forEach((url) => params.append("image", url));

    console.log(
      `🚀 [home] launching chat — model="${model}", mode="${mode}", ${images.length} image(s) attached`,
    );
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  /**
   * Import Site's submit: read the brand off the pasted link, THEN open the chat
   * with what came back as the opening message.
   *
   *   1. the link out of whatever was typed (a chip may have added a line under it)
   *   2. POST it to /brands/import — AuthContext's `sendUrl`
   *   3. the brand it returns, written out as the message, with the site's own
   *      images attached so the assistant has real material to design against
   *
   * The composer has ALREADY cleared itself by the time this runs (it clears on
   * submit, synchronously), so every failure path puts the text back — otherwise
   * a bad link or a dead site costs the user what they typed and there is
   * nothing on screen to retry with.
   *
   * @param {{prompt: string, model: string, mode: string, images: string[]}} payload
   */
  const importSiteThenLaunch = async ({ prompt, model, mode, images }) => {
    const { url, rest } = splitPromptUrl(prompt);

    if (!url) {
      console.warn(`⚠️ [home] no link found in "${prompt}"`);
      toast.error("Paste a website link — e.g. yourbrand.com — to import from.");
      composerRef.current?.setPrompt(prompt);
      return;
    }

    setImporting(true);
    try {
      console.log(`🌐 [home] importing ${url}`);
      const result = await sendUrl(url);

      // sendUrl returns undefined when there's no session rather than a result.
      if (!result?.ok) {
        throw new Error(result?.message || "We couldn't read that site.");
      }

      const brand = normalizeImportedBrand(result.data, url);
      const message = buildImportedSitePrompt(brand, rest);
      if (!message) {
        throw new Error(
          "That site didn't give us any brand details to work from.",
        );
      }

      // The user's own attachments lead — toImagePayload keeps the first 10, so
      // if the site returned a wall of images the ones they picked still survive.
      const withSiteImages = toImagePayload([...images, ...brand.images]);
      console.log(
        `✅ [home] imported "${brand.name || url}" — ${brand.images.length} site image(s) found, sending ${withSiteImages.length}`,
      );

      launchChat({ prompt: message, model, mode, images: withSiteImages });
    } catch (err) {
      console.error("❌ [home] import failed:", err);
      toast.error(err.message || "Import failed. Please try again.");
      composerRef.current?.setPrompt(prompt);
    } finally {
      setImporting(false);
    }
  };

  /**
   * The composer submitted. Import Site takes the long way round; the other two
   * tabs go straight to the chat.
   *
   * @param {{prompt: string, model: string, mode: string, images: string[]}} payload
   */
  const handleSubmit = (payload) => {
    if (composerTab === TAB_IMPORT) {
      importSiteThenLaunch(payload);
      return;
    }
    launchChat(payload);
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
    console.warn(
      `⚠️ [home] "${item.title}" has no href — falling back to the studio`,
    );
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
            {/* Roughly half the greeting's size, so this reads as the line
                UNDER "Hi <name>." rather than as a second heading competing with
                it — at the greeting's own 40px it wrapped to two lines and took
                over the hero. One line at every width from `sm` up.
                `text-balance` is still here for the narrow end, where 54
                characters do wrap: it evens the lines out instead of leaving two
                words stranded on the second. */}
            <h2 className="mt-2 text-balance text-[clamp(15px,1.5vw,19px)] font-medium leading-snug tracking-tight text-gray-600">
              Create Scroll-stopping ads, social content, and designs.
            </h2>
          </header>

          {/* Composer — narrower and shorter than the studio's, so it reads as
              an invitation sitting in space rather than a form to fill in.

              The tabs, the milky tray and the input are ONE object: the shell
              draws the tray and the tab row that starts flush against its left
              edge, and the composer sits inside it on the `inset` skin, which
              drops its own border and shadow so the tray is the only frame. The
              translucent tray is what lets the hero's backdrop through as the
              rim you see around the white input. */}
          <div
            className="animate-hero-in mx-auto w-full max-w-3xl"
            style={{ animationDelay: "180ms" }}
          >
            <ComposerShell
              tabs={HOME_COMPOSER_TABS}
              value={composerTab}
              onChange={handleTabChange}
              elevated={composerFocused}
              ariaLabel="What you're creating"
            >
              {/* Four controls: pick a model, attach, dictate, send. The model
                  menu leads the toolbar, ahead of the + — it decides what the
                  request DOES, where the other three decide what it carries.
                  The Build/Plan menu and the "Enter to send" hint stay hidden;
                  `mode` still travels in the payload at its default, so
                  handleSubmit's URL and the chat page reading it are unaffected
                  either way. */}
              <PromptComposer
                ref={composerRef}
                onSubmit={handleSubmit}
                rows={4}
                variant="inset"
                placeholder={placeholderForTab(composerTab)}
                onFocusedChange={setComposerFocused}
                showModePicker={false}
                submitting={importing}
                showHint={false}
              />
            </ComposerShell>
          </div>

          {/* Starter prompts — WIDER than the composer (max-w-4xl against its
              max-w-3xl), and that difference is the point. Pinned to the
              composer's exact width the five chips could only break 1/2/2, which
              reads as a list that ran out of room. Given ~128px of overhang on
              each side they settle 3/2, centred, and the row reads as balanced
              under the input rather than as a column trying to match it.
              Still inside the hero's own max-w-5xl, so nothing reaches the page
              edge. Third in the entrance stagger: greeting 60ms → composer 180ms
              → these 300ms → quick starts 420ms. */}
          <HomePromptSuggestions
            tabId={composerTab}
            onPick={handleSuggestionPick}
            className="animate-hero-in mx-auto mt-6 max-w-4xl sm:mt-7"
            style={{ animationDelay: "300ms" }}
          />
        </div>

        {/* Quick starts — the last thing in the hero, so the padding below them
            is the only gap between the pair and the rail's tab row. That gap is
            deliberately about one card tall, so they read as the foot of the
            hero rather than as a header for the rail.
            Last in the entrance stagger too — 60ms greeting → 180ms composer →
            300ms starter prompts → 420ms here. */}
        {/* <QuickStartCards
          className="animate-hero-in relative pb-6 sm:pb-8"
          style={{ animationDelay: "420ms" }}
        /> */}
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
