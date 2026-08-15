"use client";

/**
 * /copilot — Copilot home.
 * Replicates the reference "give it its first task" screen: full-bleed hero
 * (route is in the dashboard layout's NO_PADDING_ROUTES, so this page owns the
 * area below the fixed header) with the task input, then starter-idea cards
 * grouped by category. UI only for now — the input and idea cards are
 * placeholders until the Copilot backend lands.
 *
 * The reference's warm cream background is swapped for a neutral with a subtle
 * hint of the app's blue (not a blue background) — dark mode falls back to the
 * standard page token.
 */

import { useState } from "react";
import { Bot, Plus, Mic, ArrowUp } from "lucide-react";
import PlatformChip from "./_components/PlatformChip";

// ⚠️ ONE CATEGORY PER PRODUCT SURFACE, in sidebar order — Brand Kits, Social
// Content, Ads Content, Ad Intelligence, Product Studio, Magic Studio. These
// were Business / Productivity / Finance / Creative / Education / Home /
// Travel, a generic assistant's taxonomy: Home and Travel had no honest
// Creative Klux task to hold, and Finance offered to file the user's taxes.
// A tab that promises work this product cannot do is worse than no tab.
//
// Renaming one means renaming its IDEAS key too — the lookup at `activeCategory`
// is a bare string match with no id in between — and the default tab below.
const CATEGORIES = [
  "Brand",
  "Social",
  "Ads",
  "Performance",
  "Product",
  "Studio",
];

// Starter ideas per category. Keep each list a multiple of 3 so the desktop
// grid's hairline dividers (gap-px over a gray backdrop) never show a bare
// backdrop cell in the last row.
//
// ⚠️ EVERY CARD IS A STANDING TASK THIS PRODUCT COULD ACTUALLY RUN — check a
// design against a brand kit, score an ad, batch a product shoot, publish to a
// connected platform. This is the same rule the home composer's chips already
// follow (see the note in (components)/home/homeSuggestions.js): a starter that
// asks for something the app doesn't do is worse than one fewer starter. The
// nouns come from the studios themselves — Product Studio's tools list, Magic
// Studio's magicTools.js, Ad Intelligence's five analysers — so no card invents
// a capability.
//
// ⚠️ `platforms` are ids from the integrations registry, so a chip only ever
// shows somewhere the user can genuinely connect. An empty array is fine and
// deliberate: a brand-kit audit or a background cleanup touches no platform,
// and inventing a chip to balance the row would misdescribe the task.
//
// Cadence is the point of a Copilot card — each one opens with when it runs
// ("Every Monday…", "When I upload…"), because a task with no trigger is a
// prompt, and the user already has a box for those.
const IDEAS = {
  Brand: [
    {
      title: "Keep everything on brand",
      platforms: [],
      description:
        "Every Friday, check the week's new designs against my brand kit and flag the ones that drift from my colors, fonts or logo.",
    },
    {
      title: "Refresh my kit from my site",
      platforms: [],
      description:
        "Every month, re-import my website and show me what changed — new colors, a new logo, updated copy — before I approve it.",
    },
    {
      title: "Kit out every new product",
      platforms: ["instagram", "meta_ads"],
      description:
        "When I add a product, build its launch set — post, story, ad and banner — in my brand's colors and fonts.",
    },
    {
      title: "Rebuild anything on the old logo",
      platforms: [],
      description:
        "When I upload a new logo, find every design still carrying the old one and rebuild them for my review.",
    },
    {
      title: "Hold copy that leaves my voice",
      platforms: ["meta_ads", "linkedin"],
      description:
        "Before anything publishes, flag the copy that drifts from my brand voice and show me a rewrite beside it.",
    },
    {
      title: "Set up each brand I add",
      platforms: [],
      description:
        "When I create a brand, import its site, build the kit, and generate a starter set of designs to work from.",
    },
  ],
  Social: [
    {
      title: "Fill next week's calendar",
      platforms: ["instagram", "tiktok"],
      description:
        "Every Thursday, draft seven posts in my brand voice, size them per platform, and load them into next week's calendar.",
    },
    {
      title: "Resize one design for everywhere",
      platforms: ["instagram", "pinterest", "linkedin"],
      description:
        "Whenever I save a design, produce it in every platform's size and queue the whole set for my review.",
    },
    {
      title: "Tell me what actually landed",
      platforms: ["instagram", "facebook"],
      description:
        "Every Monday, pull last week's reach and engagement per post and tell me which creative earned it.",
    },
    {
      title: "Draft my replies each morning",
      platforms: ["instagram", "facebook"],
      description:
        "Every morning, draft replies to the comments on my posts and queue them for me to approve or edit.",
    },
    {
      title: "Run my best post again",
      platforms: ["instagram", "linkedin"],
      description:
        "Each month, find my top performer, refresh the creative so it doesn't repeat, and schedule it to run again.",
    },
    {
      title: "Turn today's trends into posts",
      platforms: ["tiktok"],
      description:
        "Every morning, scan the trends in my niche and turn the top five into post ideas with ready-made hooks.",
    },
  ],
  Ads: [
    {
      title: "Never let creative go stale",
      platforms: ["meta_ads", "google_ads"],
      description:
        "Every two weeks, build fresh variants for each running campaign and stage them ready to swap in.",
    },
    {
      title: "Catch rejections before launch",
      platforms: ["meta_ads", "tiktok_ads"],
      description:
        "Run every new ad through Ad Guard for policy issues and hold anything that would get knocked back.",
    },
    {
      title: "Build my seasonal pushes early",
      platforms: ["meta_ads", "pinterest_ads"],
      description:
        "A month before each sale, build the full ad set — every size, copy variant and headline — and schedule it.",
    },
    {
      title: "Test five headlines every time",
      platforms: ["meta_ads", "google_ads"],
      description:
        "For each new ad, write five headline variants against the same creative and set them up as a test.",
    },
    {
      title: "Tell me the moment one dips",
      platforms: ["meta_ads"],
      description:
        "Watch my running ads daily and alert me as soon as a creative's performance starts falling off.",
    },
    {
      title: "Adapt each campaign per market",
      platforms: ["meta_ads", "snapchat_ads"],
      description:
        "Rebuild every campaign for each market I sell in, with the copy and imagery adapted rather than translated.",
    },
  ],
  Performance: [
    {
      title: "Score every ad before it runs",
      platforms: ["meta_ads"],
      description:
        "Score each new creative out of 100 and send me the priority fixes while there's still time to make them.",
    },
    {
      title: "Watch what rivals are running",
      platforms: ["tiktok", "meta_ads"],
      description:
        "Every Monday, break down the ads my competitors are running and brief me on the angles they're testing.",
    },
    {
      title: "Call my A/B tests for me",
      platforms: ["meta_ads", "google_ads"],
      description:
        "Compare my two running creatives head to head each week and say which to scale and which to cut.",
    },
    {
      title: "Audit my library each quarter",
      platforms: [],
      description:
        "Every quarter, score everything I've made and show me the pattern behind the creatives that won.",
    },
    {
      title: "Explain why an ad is failing",
      platforms: ["meta_ads"],
      description:
        "When a creative drops below my benchmark, break down what's likely causing it and what to change first.",
    },
    {
      title: "Track my share of voice",
      platforms: ["instagram", "tiktok"],
      description:
        "Every month, compare how much my brand is showing up against my three closest competitors.",
    },
  ],
  Product: [
    {
      title: "Clean up every product shot",
      platforms: [],
      description:
        "When I upload product photos, strip the backgrounds, straighten and beautify them, and file the set ready to use.",
    },
    {
      title: "Stage my new arrivals in bulk",
      platforms: ["instagram", "pinterest"],
      description:
        "Run each week's new arrivals through batch staging so every product gets a lifestyle shot and a flat lay.",
    },
    {
      title: "Put my clothing on a model",
      platforms: ["instagram", "tiktok"],
      description:
        "For every new apparel item, generate ghost-mannequin and virtual-model versions sized for my shop and socials.",
    },
    {
      title: "Turn each product into video",
      platforms: ["tiktok", "youtube"],
      description:
        "For every new product, build a short video from its photos and cut it to length for TikTok and YouTube.",
    },
    {
      title: "Keep my catalog consistent",
      platforms: [],
      description:
        "Check new product images against the ones already live and flag any whose framing or lighting breaks the set.",
    },
    {
      title: "Restage my best sellers seasonally",
      platforms: ["pinterest", "instagram"],
      description:
        "Ahead of each season, restage my top products in settings that match the time of year.",
    },
  ],
  Studio: [
    {
      title: "Turn my scripts into video",
      platforms: ["youtube", "tiktok"],
      description:
        "Give me a finished voiceover video from each script I write, cut to length for YouTube and TikTok.",
    },
    {
      title: "Spin variations off my best",
      platforms: ["instagram"],
      description:
        "Take my top performing image each week and generate a set of variations to test against it.",
    },
    {
      title: "Speak to each persona",
      platforms: ["linkedin", "twitter"],
      description:
        "Regenerate my current campaign once per audience persona, with the copy and imagery rewritten for who they are.",
    },
    {
      title: "Voice my scripts in my tone",
      platforms: [],
      description:
        "Turn each script I write into a voiceover in the voice I've chosen, ready to drop onto a video.",
    },
    {
      title: "Repurpose every video I make",
      platforms: ["linkedin", "twitter"],
      description:
        "After each video, pull the transcript and turn it into posts, captions and quote cards.",
    },
    {
      title: "Generate a week of visuals",
      platforms: ["instagram"],
      description:
        "Every Monday, generate a week's worth of images from my running prompts and file them for review.",
    },
  ],
};
export default function CopilotHome() {
  const [task, setTask] = useState("");
  const [activeCategory, setActiveCategory] = useState("Brand");
  const ideas = IDEAS[activeCategory] ?? [];

  return (
    // No pb-nav: `main` in (dashboard)/layout.js reserves the mobile bottom
    // bar for every route, so repeating it here would only add dead space.
    <div className="min-h-full pt-header flex flex-col bg-[#eef1f7] dark:bg-page">
      {/* ── Hero ──────────────────────────────────────────────────
          ⚠️ THE HEIGHT IS MEASURED, NOT CHOSEN — the same trick the home page
          uses. On desktop the hero is sized so that whatever follows it starts
          exactly --ck-rail-top above the bottom of the window, which is where
          the sidebar's THEME row begins. That makes the ideas section's top
          rule continue the sidebar's THEME hairline straight across the screen
          instead of cutting the window at an unrelated height.

          Sizing it from the BOTTOM is the point: the rule has to land on the
          sidebar's hairline, and only the viewport's bottom edge knows where
          that is. Any fixed hero height would drift the moment the window
          resized. See the --ck-rail-* block in globals.css.

          ⚠️ `lg`, not `md` — one of the places that must agree on where the
          sidebar appears. Below it there is no sidebar to line up with, so the
          hero just takes its natural height and the section flows.

          justify-center comes with the height: without it the content sits at
          the top of a much taller box. pt-24 then nudges the centred group
          down by half its value, the same way the home hero's pt-[clamp()]
          does. */}
      <section className="flex flex-col items-center px-gutter pt-10 sm:pt-14 lg:pt-24 pb-12 lg:min-h-[calc(100dvh-var(--spacing-header)-var(--ck-rail-top))] lg:justify-center">
        <h1 className="text-center text-3xl md:text-[44px] md:leading-[1.2] font-bold text-gray-900">
          Give your
          <br />
          <Bot className="inline h-8 w-8 md:h-10 md:w-10 text-blue-600 align-[-0.15em] mr-1.5" />
          <span className="text-blue-600">Copilot</span> its first task.
        </h1>

        {/* Task input (placeholder — not wired to a backend yet) */}
        <div className="mt-10 w-full max-w-xl bg-surface rounded-2xl border border-gray-200 shadow-sm p-4">
          <textarea
            rows={2}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Give your Copilot a task to do..."
            className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              aria-label="Add attachment"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Dictate task"
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                aria-label="Send task"
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-14 text-xs text-gray-500">
          Or start from one of these ideas:
        </p>
      </section>

      {/* ── Starter ideas ───────────────────────────────────────── */}
      <section className="bg-surface border-t border-gray-200 flex-1 pb-20 md:pb-0">
        {/* Category tabs — pinned to --ck-rail-row on desktop, the height of the
            sidebar's THEME row. With the hero above sized to --ck-rail-top, that
            puts this strip's two rules (the section's border-t above, the card
            grid's border-t below) on exactly the same screen lines as the two
            rules bracketing THEME, so both hairlines run unbroken across the
            window. Same construction as the home rail's tab row — change one and
            check the other. Below `lg` it just flows. */}
        <div className="flex items-center md:justify-center gap-6 overflow-x-auto hide-scrollbar px-4 py-3 lg:h-(--ck-rail-row) lg:py-0">
          {CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-1.5 shrink-0 text-[13px] cursor-pointer transition-colors
                  ${active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"}`}
              >
                {active && (
                  <span className="h-1.5 w-1.5 rounded-[2px] bg-blue-600" />
                )}
                {category}
              </button>
            );
          })}
        </div>

        {/* Idea cards — gap-px over a gray backdrop draws the hairline grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border-y border-gray-200">
          {ideas.map(({ title, platforms, description }) => (
            <div key={title} className="bg-surface p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-semibold text-gray-900">
                  {title}
                </p>
                <span className="flex items-center gap-1.5">
                  {platforms.map((platform) => (
                    <PlatformChip key={platform} platform={platform} />
                  ))}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 py-4">
          You can find these ideas anytime inside your Copilot.
        </p>
      </section>
    </div>
  );
}
