/**
 * The starter-idea catalog — the tasks a Copilot could actually be given, by
 * product surface.
 *
 * Two surfaces read it: the /copilot home page's idea grid, and the suggestion
 * chips above a copilot's own composer (which show its category's ideas). It
 * lives in _data rather than beside either one because a second hand-written
 * list would drift, and the rules below are exactly the kind that only survive
 * in one place.
 */

// ⚠️ ONE CATEGORY PER PRODUCT SURFACE, in sidebar order — Brand Kits, Social
// Content, Ads Content, Ad Intelligence, Product Studio, Magic Studio. These
// were Business / Productivity / Finance / Creative / Education / Home /
// Travel, a generic assistant's taxonomy: Home and Travel had no honest
// Creative Klux task to hold, and Finance offered to file the user's taxes.
// A tab that promises work this product cannot do is worse than no tab.
//
// Renaming one means renaming its IDEAS key too — the lookup at `activeCategory`
// is a bare string match with no id in between — and the default tab below.
export const CATEGORIES = [
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
// Cadence is the point of a Copilot card — each DESCRIPTION opens with when it
// runs ("Every Monday…", "When I upload…"), because a task with no trigger is a
// prompt, and the user already has a box for those.
//
// ⚠️ TITLES ARE NOUN PHRASES — the workflow's NAME, not a sentence about it.
// "Weekly brand check", not "Keep everything on brand". These were instructions
// to the copilot, which meant the card said the same thing twice in two voices:
// a title telling it what to do, then a description telling it again with the
// trigger attached. A title is what you'd call the thing in a list of running
// workflows, and it has to still make sense once it IS one — a saved job named
// "Never let creative go stale" reads as a slogan, "Fortnightly creative
// refresh" reads as a job. Keep them to about two to four words, and let the
// cadence word carry over from the description where there is one.
export const IDEAS = {
  Brand: [
    {
      title: "Weekly brand check",
      platforms: [],
      description:
        "Every Friday, check the week's new designs against my brand kit and flag the ones that drift from my colors, fonts or logo.",
    },
    {
      title: "Monthly kit refresh",
      platforms: [],
      description:
        "Every month, re-import my website and show me what changed — new colors, a new logo, updated copy — before I approve it.",
    },
    {
      title: "New product launch set",
      platforms: ["instagram", "meta_ads"],
      description:
        "When I add a product, build its launch set — post, story, ad and banner — in my brand's colors and fonts.",
    },
    {
      title: "Old logo rebuild",
      platforms: [],
      description:
        "When I upload a new logo, find every design still carrying the old one and rebuild them for my review.",
    },
    {
      title: "Brand voice gate",
      platforms: ["meta_ads", "linkedin"],
      description:
        "Before anything publishes, flag the copy that drifts from my brand voice and show me a rewrite beside it.",
    },
    {
      title: "New brand setup",
      platforms: [],
      description:
        "When I create a brand, import its site, build the kit, and generate a starter set of designs to work from.",
    },
  ],
  Social: [
    {
      title: "Weekly content calendar",
      platforms: ["instagram", "tiktok"],
      description:
        "Every Thursday, draft seven posts in my brand voice, size them per platform, and load them into next week's calendar.",
    },
    {
      title: "Every-platform resize",
      platforms: ["instagram", "pinterest", "linkedin"],
      description:
        "Whenever I save a design, produce it in every platform's size and queue the whole set for my review.",
    },
    {
      title: "Weekly performance recap",
      platforms: ["instagram", "facebook"],
      description:
        "Every Monday, pull last week's reach and engagement per post and tell me which creative earned it.",
    },
    {
      title: "Daily comment replies",
      platforms: ["instagram", "facebook"],
      description:
        "Every morning, draft replies to the comments on my posts and queue them for me to approve or edit.",
    },
    {
      title: "Monthly top-post rerun",
      platforms: ["instagram", "linkedin"],
      description:
        "Each month, find my top performer, refresh the creative so it doesn't repeat, and schedule it to run again.",
    },
    {
      title: "Daily trend roundup",
      platforms: ["tiktok"],
      description:
        "Every morning, scan the trends in my niche and turn the top five into post ideas with ready-made hooks.",
    },
  ],
  Ads: [
    {
      title: "Fortnightly creative refresh",
      platforms: ["meta_ads", "google_ads"],
      description:
        "Every two weeks, build fresh variants for each running campaign and stage them ready to swap in.",
    },
    {
      title: "Pre-launch policy check",
      platforms: ["meta_ads", "tiktok_ads"],
      description:
        "Run every new ad through Ad Guard for policy issues and hold anything that would get knocked back.",
    },
    {
      title: "Seasonal campaign prep",
      platforms: ["meta_ads", "pinterest_ads"],
      description:
        "A month before each sale, build the full ad set — every size, copy variant and headline — and schedule it.",
    },
    {
      title: "Headline split test",
      platforms: ["meta_ads", "google_ads"],
      description:
        "For each new ad, write five headline variants against the same creative and set them up as a test.",
    },
    {
      title: "Daily fatigue alerts",
      platforms: ["meta_ads"],
      description:
        "Watch my running ads daily and alert me as soon as a creative's performance starts falling off.",
    },
    {
      title: "Per-market campaign builds",
      platforms: ["meta_ads", "snapchat_ads"],
      description:
        "Rebuild every campaign for each market I sell in, with the copy and imagery adapted rather than translated.",
    },
  ],
  Performance: [
    {
      title: "Pre-flight creative score",
      platforms: ["meta_ads"],
      description:
        "Score each new creative out of 100 and send me the priority fixes while there's still time to make them.",
    },
    {
      title: "Weekly competitor briefing",
      platforms: ["tiktok", "meta_ads"],
      description:
        "Every Monday, break down the ads my competitors are running and brief me on the angles they're testing.",
    },
    {
      title: "Weekly A/B verdict",
      platforms: ["meta_ads", "google_ads"],
      description:
        "Compare my two running creatives head to head each week and say which to scale and which to cut.",
    },
    {
      title: "Quarterly library audit",
      platforms: [],
      description:
        "Every quarter, score everything I've made and show me the pattern behind the creatives that won.",
    },
    {
      title: "Underperformance diagnosis",
      platforms: ["meta_ads"],
      description:
        "When a creative drops below my benchmark, break down what's likely causing it and what to change first.",
    },
    {
      title: "Monthly share of voice",
      platforms: ["instagram", "tiktok"],
      description:
        "Every month, compare how much my brand is showing up against my three closest competitors.",
    },
  ],
  Product: [
    {
      title: "Product photo cleanup",
      platforms: [],
      description:
        "When I upload product photos, strip the backgrounds, straighten and beautify them, and file the set ready to use.",
    },
    {
      title: "Weekly batch staging",
      platforms: ["instagram", "pinterest"],
      description:
        "Run each week's new arrivals through batch staging so every product gets a lifestyle shot and a flat lay.",
    },
    {
      title: "Apparel model shots",
      platforms: ["instagram", "tiktok"],
      description:
        "For every new apparel item, generate ghost-mannequin and virtual-model versions sized for my shop and socials.",
    },
    {
      title: "Product video cuts",
      platforms: ["tiktok", "youtube"],
      description:
        "For every new product, build a short video from its photos and cut it to length for TikTok and YouTube.",
    },
    {
      title: "Catalog consistency check",
      platforms: [],
      description:
        "Check new product images against the ones already live and flag any whose framing or lighting breaks the set.",
    },
    {
      title: "Seasonal best-seller restage",
      platforms: ["pinterest", "instagram"],
      description:
        "Ahead of each season, restage my top products in settings that match the time of year.",
    },
  ],
  Studio: [
    {
      title: "Script to video",
      platforms: ["youtube", "tiktok"],
      description:
        "Give me a finished voiceover video from each script I write, cut to length for YouTube and TikTok.",
    },
    {
      title: "Weekly top-image variations",
      platforms: ["instagram"],
      description:
        "Take my top performing image each week and generate a set of variations to test against it.",
    },
    {
      title: "Per-persona campaign versions",
      platforms: ["linkedin", "twitter"],
      description:
        "Regenerate my current campaign once per audience persona, with the copy and imagery rewritten for who they are.",
    },
    {
      title: "Script voiceovers",
      platforms: [],
      description:
        "Turn each script I write into a voiceover in the voice I've chosen, ready to drop onto a video.",
    },
    {
      title: "Video repurposing",
      platforms: ["linkedin", "twitter"],
      description:
        "After each video, pull the transcript and turn it into posts, captions and quote cards.",
    },
    {
      title: "Weekly visual batch",
      platforms: ["instagram"],
      description:
        "Every Monday, generate a week's worth of images from my running prompts and file them for review.",
    },
  ],
};
