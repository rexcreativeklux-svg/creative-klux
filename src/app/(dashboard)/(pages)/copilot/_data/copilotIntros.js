// app/(dashboard)/(pages)/copilot/_data/copilotIntros.js
//
// The message a brand-new copilot opens its thread with — written here, not by
// a model, so the very first thing a user sees is an introduction rather than
// an empty box asking them to already know what a copilot is for.
//
// Same idea as Weviy's autopilot greetings: hello, who I am, what I can take
// on, how to reach me, then an ask for a TASK — "what should I take on first"
// is a question anyone can answer without knowing the product.
//
// ⚠️ EVERY CAPABILITY NAMED HERE IS A SURFACE THIS PRODUCT HAS — Brand Kits,
// Social Content, Ads, Ad Intelligence, Product Studio, Magic Studio, plus the
// channels in the copilot's sidebar. Same rule as ./ideas.js: an introduction
// that promises work the app can't do teaches the user to distrust everything
// after it.
//
// Several variants, picked at random: creating three copilots back to back is
// normal, and three identical hellos make them feel like one bot in different
// names. They share a shape so the pick changes the wording, never the offer.
//
// Markdown — the thread renders assistant messages with react-markdown.

const hello = (name) =>
  name ? `Hey ${name} — great to meet you!` : "Hey there — great to meet you!";

const INTROS = [
  ({ name, copilotName }) => `${hello(name)} I'm **${copilotName}**, your new copilot.

Here's what I can take off your plate:

- **Brand** — keep every design on your brand kit's colors, fonts and logo
- **Social** — draft posts in your voice, resize them per platform and fill your calendar
- **Ads** — build ad sets and variants, and check them for policy issues before launch
- **Performance** — score creatives, break down competitors' ads and tell you what to scale
- **Product** — clean up product photos, stage lifestyle shots and cut short videos
- **Studio** — turn scripts into voiceovers and videos, and generate image variations

I can run any of these on a schedule as a workflow, and you can reach me on WhatsApp, Telegram or Slack once you connect them.

So — what should I take on first?`,

  ({ name, copilotName }) => `${hello(name)} **${copilotName}** here.

Think of me as a teammate for your creative work rather than another tool to open. A few things I'm good at:

- Checking new designs against your **brand kit** and flagging anything that drifts
- Planning a week of **social posts**, sized for every platform
- Building and refreshing **ad creative**, then telling you which version is winning
- Turning **product photos** into launch-ready shots and short videos
- Writing **scripts, voiceovers and captions** from the content you already have

Not sure where to start? Tell me about your brand and your week, and I'll suggest where I'd help most.

What's first?`,

  ({ name, copilotName }) => `${hello(name)} I'm **${copilotName}**.

I work across Creative Klux, so you can hand me whole jobs, not just questions:

1. **Make** — designs, posts, ads, product shots and videos in your brand's style
2. **Check** — brand consistency, ad policy and creative scores before anything goes live
3. **Watch** — your competitors, your trends and how your creative is performing

Give me something once, or set it up as a workflow and I'll keep doing it — and we can pick this up on WhatsApp, Telegram or Slack whenever you're away from your desk.

What would you like handled?`,

  ({ name, copilotName }) => `${hello(name)} I'm **${copilotName}** — glad you're here.

I'm built for the creative side of running a brand. The busywork between *having an idea* and *having it live* is where I'm most useful:

- Turning one design into every size each platform needs
- Drafting captions, headlines and ad copy in your brand voice
- Scoring creatives before you spend on them
- Keeping an eye on what your competitors are running

Tell me what's on your list this week and I'll pick something up.

Where should we start?`,

  ({ name, copilotName }) => `${hello(name)} **${copilotName}**, reporting for duty.

Quick rundown of how I can help:

**Before you post** — I'll check it against your brand kit and your brand voice.

**Before you launch** — I'll run your ads through a policy check and give each creative a score.

**After it's live** — I'll tell you what's working, what's fading and what to make next.

You can ask me for something once, or turn it into a workflow that runs on a schedule.

What should I look at first?`,

  ({ name, copilotName }) => `${hello(name)} I'm **${copilotName}**.

Here are a few things people usually hand me first:

- *"Plan next week's posts for Instagram and TikTok."*
- *"Clean up these product photos and give me lifestyle shots."*
- *"Tell me which of my running ads to scale and which to cut."*
- *"Turn this script into a voiceover video."*

Any of those sound useful? Or tell me what you're working on and we'll go from there.`,

  ({ name, copilotName }) => `${hello(name)} **${copilotName}** here, ready to get to work.

The more I know about your brand, the better I get — so feel free to start by telling me who you're selling to and what you're launching next.

In the meantime, I can already:

1. **Create** posts, ads, banners and product shots in your brand's style
2. **Resize and repurpose** what you've made for every platform
3. **Analyse** your creative and your competitors', and tell you what to change

And once you connect WhatsApp, Telegram or Slack, you can message me from there too.

What's the first job?`,

  ({ name, copilotName }) => `${hello(name)} Meet **${copilotName}**, your creative copilot.

I can keep things moving even when you're busy — drafting the week's content, refreshing tired ads, restaging best-sellers for the season, or pulling a quick performance recap every Monday.

Set something up once as a workflow and I'll keep it running, or just ask whenever you need a hand.

So — what can I take care of for you?`,
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * The opening message for a copilot that was just created.
 *
 * @param {Object} options
 * @param {string} [options.copilotName]  This copilot's name.
 * @param {string} [options.userName]     The signed-in user's first name.
 * @returns {string} Markdown
 */
export function copilotIntro({ copilotName, userName } = {}) {
  return pick(INTROS)({
    name: userName || "",
    copilotName: copilotName || "your copilot",
  });
}
