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

const CATEGORIES = [
  "Business",
  "Productivity",
  "Finance",
  "Creative",
  "Education",
  "Home",
  "Travel",
];

// Starter ideas per category. Keep each list a multiple of 3 so the desktop
// grid's hairline dividers (gap-px over a gray backdrop) never show a bare
// backdrop cell in the last row.
const IDEAS = {
  Business: [
    {
      title: "Find new clients while I sleep",
      platforms: ["linkedin", "gmail"],
      description:
        "Every night, hunt for 10 new companies that fit my client profile, find the right contact, and draft an email I can send in the morning.",
    },
    {
      title: "Track my competitors",
      platforms: ["tiktok", "linkedin"],
      description:
        "Every Monday morning, check 3 competitors' websites, pricing, TikTok and LinkedIn for changes, and send me a brief.",
    },
    {
      title: "Capture leads automatically",
      platforms: ["gmail", "sheets"],
      description:
        "Every morning, scan Gmail for new leads, log them in Google Sheets, and send intro replies.",
    },
    {
      title: "Prepare me for tax season",
      platforms: ["stripe", "sheets"],
      description:
        "Every quarter, pull my income and expenses into a Google Sheet organized for my accountant.",
    },
    {
      title: "Track brand mentions daily",
      platforms: ["tiktok"],
      description:
        "Every day, scan TikTok and the web for mentions of my company and summarize the sentiment.",
    },
    {
      title: "Send me a weekly revenue summary",
      platforms: ["stripe"],
      description:
        "Every Monday morning, pull last week's Stripe numbers vs the prior week and surface what changed.",
    },
  ],
  Productivity: [
    {
      title: "Plan my day each morning",
      platforms: ["gmail"],
      description:
        "Every morning, read my inbox and calendar, then send me a prioritized plan for the day.",
    },
    {
      title: "Clean up my inbox weekly",
      platforms: ["gmail"],
      description:
        "Every Friday, archive newsletters, flag what needs a reply, and summarize what I missed.",
    },
    {
      title: "Summarize my meetings",
      platforms: ["sheets"],
      description:
        "After each day, collect meeting notes into one doc with clear action items and owners.",
    },
  ],
  Finance: [
    {
      title: "Watch my cash flow",
      platforms: ["stripe", "sheets"],
      description:
        "Every week, compare income against spending and alert me when something looks off.",
    },
    {
      title: "Chase unpaid invoices",
      platforms: ["gmail", "stripe"],
      description:
        "Every Monday, find overdue invoices and draft polite follow-up emails ready to send.",
    },
    {
      title: "Log expenses automatically",
      platforms: ["sheets"],
      description:
        "Every day, pull new receipts from my inbox into a categorized expense sheet.",
    },
  ],
  Creative: [
    {
      title: "Draft social posts weekly",
      platforms: ["tiktok"],
      description:
        "Every Sunday, draft a week of post ideas based on my brand voice and current trends.",
    },
    {
      title: "Find trending content ideas",
      platforms: ["tiktok"],
      description:
        "Every morning, scan TikTok trends in my niche and send me the top 5 with ready-made hooks.",
    },
    {
      title: "Repurpose my best content",
      platforms: ["linkedin"],
      description:
        "Each week, turn my top performing post into formats for every other platform.",
    },
  ],
  Education: [
    {
      title: "Teach me something daily",
      platforms: ["gmail"],
      description:
        "Every morning, send a 5-minute lesson on a topic I'm learning, with a quick quiz.",
    },
    {
      title: "Summarize industry news",
      platforms: ["gmail"],
      description:
        "Every day, digest the top stories in my field into a two-minute read.",
    },
    {
      title: "Build my study plan",
      platforms: ["sheets"],
      description:
        "Break my learning goal into a weekly plan and track my progress in a sheet.",
    },
  ],
  Home: [
    {
      title: "Plan my meals for the week",
      platforms: ["sheets"],
      description:
        "Every Saturday, plan 7 dinners with a grocery list sorted by aisle.",
    },
    {
      title: "Track household bills",
      platforms: ["sheets"],
      description:
        "Log recurring bills, warn me before due dates, and flag price increases.",
    },
    {
      title: "Organize family events",
      platforms: ["gmail"],
      description:
        "Watch my inbox for school and family events and add them to my calendar.",
    },
  ],
  Travel: [
    {
      title: "Watch flight prices",
      platforms: ["gmail"],
      description:
        "Track fares for trips I'm planning and email me when prices drop.",
    },
    {
      title: "Build my itinerary",
      platforms: ["sheets"],
      description:
        "Turn my booked trips into a day-by-day itinerary with maps and times.",
    },
    {
      title: "Pack like a pro",
      platforms: ["gmail"],
      description:
        "Before each trip, send a packing list based on the weather and trip length.",
    },
  ],
};

export default function CopilotHome() {
  const [task, setTask] = useState("");
  const [activeCategory, setActiveCategory] = useState("Business");
  const ideas = IDEAS[activeCategory] ?? [];

  return (
    <div className="min-h-full pt-header pb-nav lg:pb-0 flex flex-col bg-[#eef1f7] dark:bg-page">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-gutter pt-10 sm:pt-14 lg:pt-24 pb-12">
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
        {/* Category tabs */}
        <div className="flex md:justify-center gap-6 overflow-x-auto hide-scrollbar px-4 py-3">
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
