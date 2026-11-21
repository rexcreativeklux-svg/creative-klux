"use client";

// app/(components)/composer/CreateAdComposer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// "Create campaign" — Metricool's ad flow (checked against Metricool with Meta
// and Google ad accounts connected, 2026-11-20): a centred window, the steps
// along the top, Previous / Continue at the bottom, and Continue holding you
// on a step until it's complete.
//
//   CONFIGURATION   campaign name · target URL · one switch per connected ad
//                   network, each with its own objective · ad location
//   LOCATION        countries, searched
//   SEGMENTATION    gender · age range (Metricool's age bands) · language
//   AUDIENCE        audiences and interests (optional)
//   KEYWORDS        Google only
//   DESIGN          one tab per ad: ad name · business name · website URL ·
//                   Google title · description · multimedia · logo (Google) —
//                   with the preview
//   BUDGET          daily / lifetime · amount · bid cap · duration · payer
//   SUMMARY         every block with an edit button → Create campaign
//
// One campaign can go to several networks at once, as in Metricool: it's
// created on each switched-on network, one POST creatives/ads each.
//
// Everything the form collects is sent (see buildPayload) — the API uses what
// it knows. The first ad's fields also go at the top level, the way the API
// has always taken a single ad; every ad goes in `ads`.
//
// Campaigns are created PAUSED unless "Start right away" is picked; going live
// spends money, so that asks for confirmation first. A refusal is shown with
// everything the API said (message + each detail).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  ImageIcon,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ThumbsUp,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsHydrated } from "@/utils/useIsHydrated";
import { uploadForPublish } from "@/(lib)/creativesApi";
import {
  AD_CALLS_TO_ACTION,
  AD_OBJECTIVE_OPTIONS,
  adDate,
  defaultAdObjective,
  invalidateCampaigns,
  publishAd,
} from "@/(lib)/integration";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import { AD_NETWORKS } from "@/app/(components)/content/socialPlatformScope";
import MediaMenu from "./MediaMenu";
import { ItemMenu, MediaViewer, Thumb } from "./MediaAttachments";

const BRAND = "#003dda";

// ── Countries: every region the browser can name, so none is hard-coded. ──
const NOT_COUNTRIES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"]);
const COUNTRIES = (() => {
  try {
    const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
    const out = [];
    for (let a = 65; a <= 90; a++)
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        if (NOT_COUNTRIES.has(code)) continue;
        const name = names.of(code);
        if (name && name !== code) out.push([code, name]);
      }
    return out.sort((x, y) => x[1].localeCompare(y[1]));
  } catch {
    return [["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"], ["ZA", "South Africa"], ["US", "United States"], ["GB", "United Kingdom"]];
  }
})();
const countryName = (code) => COUNTRIES.find(([c]) => c === code)?.[1] || code;

// ── Languages: Metricool's five as cards, the rest under "Others". ISO 639-1.
const MAIN_LANGS = ["en", "fr", "es", "de", "it"];
const OTHER_LANGS = ["ar", "pt", "ha", "yo", "ig", "sw", "zu", "am", "nl", "pl", "ru", "tr", "zh", "ja", "ko", "hi", "id", "ms", "vi", "th", "sv", "da", "no", "fi", "el", "he", "uk", "ro", "cs", "hu"];
const langName = (() => {
  try {
    const n = new Intl.DisplayNames(["en"], { type: "language" });
    return (c) => n.of(c) || c;
  } catch {
    return (c) => c;
  }
})();

// Metricool's (and Google's) age bands. The range runs from one band's start
// to another's end.
const AGE_BANDS = [
  { label: "18 to 24", min: 18, max: 24 },
  { label: "25 to 34", min: 25, max: 34 },
  { label: "35 to 44", min: 35, max: 44 },
  { label: "45 to 54", min: 45, max: 54 },
  { label: "55 to 64", min: 55, max: 64 },
  { label: "65+", min: 65, max: 65 },
];
const ageText = (lo, hi) =>
  `${AGE_BANDS[lo].min} to ${hi === AGE_BANDS.length - 1 ? "65+" : AGE_BANDS[hi].max} years`;

// Text limits each network takes (publishAd trims to the same).
const LIMITS = {
  google_ads: { title: 30, description: 90 },
  default: { title: 255, description: 500 },
};
const BUSINESS_MAX = 25;

// Where each network can place the ad — Metricool's "Ad location".
const LOCATIONS = [
  { id: "facebook", label: "Facebook", net: "meta_ads", color: "#1877F2", spots: [["feed", "Feed"], ["story", "Stories"]] },
  { id: "instagram", label: "Instagram", net: "meta_ads", color: "#E1306C", spots: [["stream", "Feed"], ["story", "Stories"]] },
  { id: "google", label: "Google", net: "google_ads", color: "#4285F4", spots: [["content", "Network"], ["partners", "Partners"]] },
];

const domainOf = (url) => {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const withScheme = (url) => (/^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
const netOf = (id) => AD_NETWORKS.find((n) => n.id === id);
const objectiveLabel = (p, v) => (AD_OBJECTIVE_OPTIONS[p] || []).find((o) => o.value === v)?.label?.split(" — ")[0] || v;

let adSeq = 0;
const newAd = (base = {}) => ({
  key: `ad${++adSeq}`,
  name: "",
  businessName: "",
  link: "",
  title: "",
  description: "",
  text: "",
  cta: "LEARN_MORE",
  media: null,
  logo: null,
  ...base,
});

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} [props.onCreated]      After a campaign is created.
 * @param {string} [props.initialPlatform]    The ad network switched on first.
 * @param {{url, type}} [props.initialMedia]  An already-hosted image / video.
 * @param {string[]} [props.connected]        Connected ad networks.
 */
export default function CreateAdComposer({ isOpen, ...props }) {
  const hydrated = useIsHydrated();
  if (!hydrated || !isOpen) return null;
  return createPortal(<AdWindow {...props} />, document.body);
}

// ── Small pieces ──────────────────────────────────────────────────────────

/** Metricool's switch. */
function Switch({ on, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${on ? "bg-[#003dda]" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-4.5" : "left-0.5"}`} />
    </button>
  );
}

/** A switch row as a card — the provider, bid cap and duration cards. */
function SwitchCard({ label, on, onToggle, children }) {
  return (
    <div className={`overflow-hidden rounded-lg border transition-colors ${on ? "border-[#003dda]/40" : "border-gray-200"}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${on ? "bg-blue-50/70" : "bg-surface"}`}>
        <span className="flex flex-1 items-center gap-2 text-[15px] font-medium text-gray-900">{label}</span>
        <Switch on={on} onClick={onToggle} label={typeof label === "string" ? label : undefined} />
      </div>
      {children}
    </div>
  );
}

function Label({ children, required, count, max }) {
  return (
    <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-gray-800">
      <span>
        {children}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {max ? (
        <span className={`text-[11px] font-normal tabular-nums ${count > max ? "text-red-600" : "text-gray-400"}`}>
          {count}/{max}
        </span>
      ) : null}
    </span>
  );
}

function Err({ show, children }) {
  if (!show || !children) return null;
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}

function Section({ title, sub, children, aside }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
          {sub && <p className="mt-1 text-[13px] text-gray-600">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** A choice card — gender, language. */
function Choice({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm transition-colors ${
        on ? "border-[#003dda] bg-blue-50/70 font-semibold text-[#003dda]" : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

/** Free-text tags with Enter / comma, and optional suggestions to add. */
function TagInput({ values, onChange, placeholder, suggestions = [], onClear }) {
  const [draft, setDraft] = useState("");
  const add = (raw) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...values];
    for (const p of parts) if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft("");
  };
  const left = suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className={`${inputCls(false)} pl-9`}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={placeholder}
        />
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 rounded-md bg-[#003dda] py-1 pl-2.5 pr-1 text-xs font-medium text-white">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-white/25 hover:bg-white/40"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {onClear && (
            <button type="button" onClick={onClear} className="ml-1 cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-800">
              Clean
            </button>
          )}
        </div>
      )}
      {left.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500">
            <Sparkles className="h-3 w-3" /> Suggested from your campaign
          </p>
          <div className="flex flex-wrap gap-1.5">
            {left.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange([...values, s])}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-700 hover:border-[#003dda] hover:text-[#003dda]"
              >
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = (bad) =>
  `h-10 w-full rounded-lg border bg-surface px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#003dda] ${
    bad ? "border-red-400" : "border-gray-300"
  }`;

const STOP = new Set("the a an and or of for to in on with your our you we is are be at by from this that it as best new get now more".split(" "));
/** Keyword ideas from the campaign's own words — the domain, names, text. */
function keywordIdeas({ link, name, ads }) {
  const words = [domainOf(link).split(".")[0], name, ...ads.flatMap((a) => [a.name, a.title, a.description])]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const seen = [];
  for (const w of words) if (!seen.includes(w)) seen.push(w);
  const pairs = [];
  for (let i = 0; i < seen.length - 1 && pairs.length < 6; i++) pairs.push(`${seen[i]} ${seen[i + 1]}`);
  return [...seen.slice(0, 12), ...pairs];
}

// ── The window ────────────────────────────────────────────────────────────

function AdWindow({ onClose, onCreated, initialPlatform, initialMedia = null, connected = [] }) {
  const { activeBrand } = useAuth();

  // Networks to offer: the connected ones, else the one the page is on.
  const offered = useMemo(() => {
    const list = (connected.length ? connected : [initialPlatform || "meta_ads"]).filter((p) => netOf(p));
    const order = (p) => AD_NETWORKS.findIndex((n) => n.id === p);
    return [...new Set(list)].sort((a, b) => order(a) - order(b));
  }, [connected, initialPlatform]);

  // ── Campaign state ───────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const first = offered.includes(initialPlatform) ? initialPlatform : offered[0];
  const [providers, setProviders] = useState(() =>
    Object.fromEntries(offered.map((p) => [p, { on: p === first, objective: defaultAdObjective(p) }])),
  );
  const enabled = offered.filter((p) => providers[p]?.on);
  const hasMeta = enabled.includes("meta_ads");
  const hasGoogle = enabled.includes("google_ads");
  const [places, setPlaces] = useState({ facebook: ["feed", "story"], instagram: ["stream", "story"], google: ["content"] });
  const [political, setPolitical] = useState(false);

  const [countries, setCountries] = useState(["NG"]);
  const [gender, setGender] = useState("all");
  const [ageLo, setAgeLo] = useState(0);
  const [ageHi, setAgeHi] = useState(AGE_BANDS.length - 1);
  const [languages, setLanguages] = useState([]); // [] = all
  const [interests, setInterests] = useState([]);
  const [keywords, setKeywords] = useState([]);

  const [ads, setAds] = useState(() => [
    newAd({
      businessName: (activeBrand?.name || "").slice(0, BUSINESS_MAX),
      media: initialMedia ? { id: "m0", ...initialMedia } : null,
      logo: activeBrand?.logo ? { id: "logo", type: "image", url: activeBrand.logo } : null,
    }),
  ]);
  const [adKey, setAdKey] = useState(() => ads[0].key);
  const updateAd = (key, patch) => setAds((all) => all.map((a) => (a.key === key ? { ...a, ...(typeof patch === "function" ? patch(a) : patch) } : a)));
  const [viewing, setViewing] = useState(null);

  const [budgetType, setBudgetType] = useState("daily");
  const [amount, setAmount] = useState("");
  const [bidMode, setBidMode] = useState("auto");
  const [bidAmount, setBidAmount] = useState("");
  const [duration, setDuration] = useState("week"); // week | month | custom
  const [start, setStart] = useState(adDate(0));
  const [end, setEnd] = useState(adDate(7));
  const [payer, setPayer] = useState(activeBrand?.name || "");
  const [beneficiary, setBeneficiary] = useState(activeBrand?.name || "");
  const [status, setStatus] = useState("PAUSED");

  // ── Steps ────────────────────────────────────────────────────────────────
  const steps = [
    { id: "config", label: "Configuration" },
    { id: "location", label: "Location" },
    { id: "segmentation", label: "Segmentation" },
    { id: "audience", label: "Audience" },
    hasGoogle && { id: "keywords", label: "Keywords" },
    { id: "design", label: "Design" },
    { id: "budget", label: "Budget" },
    { id: "summary", label: "Summary" },
  ].filter(Boolean);
  const [stepId, setStepId] = useState("config");
  const [reached, setReached] = useState(0); // furthest step opened
  const [tried, setTried] = useState({}); // steps Continue was pressed on
  const index = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const goTo = (i) => {
    const s = steps[Math.max(0, Math.min(i, steps.length - 1))];
    setStepId(s.id);
    setReached((r) => Math.max(r, i));
  };

  const [creating, setCreating] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const toggleProvider = (p) => setProviders((all) => ({ ...all, [p]: { ...all[p], on: !all[p].on } }));
  const setObjective = (p, v) => setProviders((all) => ({ ...all, [p]: { ...all[p], objective: v } }));
  const togglePlace = (loc, spot) =>
    setPlaces((all) => ({ ...all, [loc]: all[loc].includes(spot) ? all[loc].filter((s) => s !== spot) : [...all[loc], spot] }));

  const pickDuration = (d) => {
    setDuration(d);
    if (d === "week") {
      setStart(adDate(0));
      setEnd(adDate(7));
    } else if (d === "month") {
      setStart(adDate(0));
      setEnd(adDate(30));
    }
  };

  const upload = async (file, set, imagesOnly) => {
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!type || (imagesOnly && type !== "image")) return toast.error(imagesOnly ? "Pick an image file." : "Pick an image or a video file.");
    const previewUrl = URL.createObjectURL(file);
    const id = `${Date.now()}`;
    set({ id, type, previewUrl, url: null, uploading: true });
    try {
      const url = await uploadForPublish(file);
      if (!url) throw new Error("The upload didn't return a link.");
      set({ id, type, previewUrl, url });
    } catch (err) {
      toast.error(err.message || "Upload failed");
      set(null);
    }
  };

  // ── What's missing, per step (and per ad) ────────────────────────────────
  const limits = hasGoogle ? LIMITS.google_ads : LIMITS.default;
  const adProblems = (a) => {
    const p = {};
    if (!a.name.trim()) p.name = "The ad name is required";
    if (!a.businessName.trim()) p.business = "The business name is required";
    else if (a.businessName.length > BUSINESS_MAX) p.business = `Up to ${BUSINESS_MAX} characters`;
    if (!domainOf(a.link || link)) p.link = "The website URL is required";
    if (hasGoogle && !a.title.trim()) p.title = "The title is required for Google Ads";
    else if (hasGoogle && a.title.length > LIMITS.google_ads.title) p.title = `Up to ${LIMITS.google_ads.title} characters on Google Ads`;
    if (!a.description.trim()) p.description = "The description is required";
    else if (a.description.length > limits.description) p.description = `Up to ${limits.description} characters`;
    if (!a.media) p.media = "You must add an image for your ad";
    else if (a.media.uploading) p.media = "Wait for the upload to finish";
    else if (hasGoogle && a.media.type === "video") p.media = "Google display ads need an image, not a video";
    if (hasGoogle && !a.logo) p.logo = "You must add a logo for Google Ads";
    else if (a.logo?.uploading) p.logo = "Wait for the upload to finish";
    return p;
  };
  const problems = (() => {
    const p = { config: {}, location: {}, design: {}, budget: {} };
    if (!name.trim()) p.config.name = "The campaign name is required";
    if (!domainOf(link)) p.config.link = "The target URL is required";
    if (!enabled.length) p.config.providers = "Switch on at least one network";
    for (const l of LOCATIONS)
      if (enabled.includes(l.net) && !LOCATIONS.filter((x) => x.net === l.net).some((x) => places[x.id].length))
        p.config.places = `Pick at least one place for ${netOf(l.net)?.label}`;
    if (!countries.length) p.location.countries = "Pick at least one country";
    ads.forEach((a, i) => {
      const ap = Object.values(adProblems(a));
      if (ap.length) p.design[`ad${i}`] = `${a.name.trim() || `Ad ${i + 1}`}: ${ap[0]}`;
    });
    if (!(Number(amount) >= 1)) p.budget.amount = "The amount is required — at least 1";
    if (bidMode === "manual" && !(Number(bidAmount) > 0)) p.budget.bid = "Set the maximum cost per click";
    if (!start || !end || end <= start) p.budget.dates = "The end date has to be after the start";
    else if (start < adDate(0)) p.budget.dates = "The start date can't be in the past";
    if (hasMeta && (!payer.trim() || !beneficiary.trim())) p.budget.payer = "The payer and beneficiary names are required for Meta";
    return p;
  })();
  const stepProblems = (id) => Object.values(problems[id] || {});
  const show = (id) => !!tried[id];
  const allProblems = steps.flatMap((s) => stepProblems(s.id));

  const next = () => {
    if (stepProblems(stepId).length) {
      setTried((t) => ({ ...t, [stepId]: true }));
      // On Design, open the first ad that still needs something.
      if (stepId === "design") {
        const bad = ads.find((a) => Object.keys(adProblems(a)).length);
        if (bad) setAdKey(bad.key);
      }
      return;
    }
    goTo(index + 1);
  };

  // ── What one network is sent ─────────────────────────────────────────────
  const buildPayload = (platform) => {
    const google = platform === "google_ads";
    const adBody = (a) => ({
      name: a.name.trim(),
      headline: (google ? a.title : a.name).trim(),
      description: a.description.trim(),
      text: google ? undefined : a.text.trim() || undefined,
      call_to_action: google ? undefined : a.cta || undefined,
      link: withScheme(a.link || link),
      business_name: a.businessName.trim(),
      logo_url: a.logo?.url || undefined,
      ...(a.media.type === "video" ? { video_url: a.media.url } : { image_url: a.media.url, image_alt: a.media.alt || undefined }),
    });
    const all = ads.map(adBody);
    // The first ad at the top level — under `ad_name`, so it can't replace
    // the campaign's own name.
    const { name: firstAdName, ...firstAd } = all[0];
    const placementsFor = LOCATIONS.filter((l) => l.net === platform);
    return {
      platform,
      name: name.trim(),
      objective: providers[platform].objective,
      countries,
      age_min: AGE_BANDS[ageLo].min,
      age_max: AGE_BANDS[ageHi].max,
      gender, // all | female | male
      ...(gender !== "all" ? { genders: [gender === "male" ? 1 : 2] } : {}), // Meta's codes
      languages, // ISO 639-1; empty = all
      interests,
      ...(google ? { keywords } : {}),
      // Placements, in each network's own words.
      ...(google
        ? {
            target_content_network: places.google.includes("content"),
            target_partner_search_network: places.google.includes("partners"),
            contains_eu_political_advertising: political,
          }
        : {
            publisher_platforms: placementsFor.filter((l) => places[l.id].length).map((l) => l.id),
            facebook_positions: places.facebook,
            instagram_positions: places.instagram,
            placements: placementsFor.flatMap((l) => places[l.id].map((s) => `${l.id}_${s}`)),
          }),
      bid_strategy: bidMode === "manual" ? "LOWEST_COST_WITH_BID_CAP" : "LOWEST_COST_WITHOUT_CAP",
      ...(bidMode === "manual" ? { bid_amount: Number(bidAmount), max_cpc: Number(bidAmount) } : {}),
      ...(google ? {} : { dsa_payor: payer.trim(), dsa_beneficiary: beneficiary.trim() }),
      ...(budgetType === "daily" ? { daily_budget: Number(amount) } : { lifetime_budget: Number(amount) }),
      start_date: start,
      end_date: end,
      status,
      // The first ad at the top level, every ad in `ads`.
      ...firstAd,
      ad_name: firstAdName,
      ads: all,
      // Last, so nothing above can overwrite them.
      platform,
      name: name.trim(),
    };
  };

  // ── Create, on each switched-on network ──────────────────────────────────
  const create = async () => {
    setConfirmLive(false);
    setCreating(true);
    const failed = [];
    const made = [];
    for (const platform of enabled) {
      try {
        await publishAd(buildPayload(platform));
        made.push(platform);
      } catch (err) {
        failed.push({ platform, err });
      }
    }
    setCreating(false);
    if (made.length) {
      invalidateCampaigns();
      onCreated?.();
      toast.success(`Campaign created on ${made.map((p) => netOf(p)?.label).join(" and ")}`, {
        description: status === "ACTIVE" ? "It goes live once the network approves it." : "Paused — start it from the Campaigns table when you're ready.",
      });
    }
    for (const { platform, err } of failed)
      toast.error(`${netOf(platform)?.label} didn't create the campaign`, {
        description: (
          <div className="space-y-1">
            <p className="font-medium">{err.message || "Couldn't create the campaign"}</p>
            {err.details?.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {err.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        ),
        duration: 15000,
        closeButton: true,
      });
    if (!failed.length) onClose();
    // What was created is switched off, so trying again only retries the rest.
    else if (made.length) setProviders((all) => Object.fromEntries(Object.entries(all).map(([p, v]) => [p, made.includes(p) ? { ...v, on: false } : v])));
  };

  const requestClose = () => {
    if (creating) return;
    if (name || link || ads.some((a) => a.media || a.name || a.description)) setConfirmClose(true);
    else onClose();
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const last = index === steps.length - 1;
  const langLabel = languages.length ? languages.map(langName).join(", ") : "All languages";
  const placeLabel = enabled
    .flatMap((p) => LOCATIONS.filter((l) => l.net === p).flatMap((l) => places[l.id].map((s) => `${l.label} ${l.spots.find(([id]) => id === s)?.[1]}`)))
    .join(", ");

  // ── Step bodies ──────────────────────────────────────────────────────────
  const body = {
    config: (
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label required>Campaign name</Label>
            <input className={inputCls(show("config") && problems.config.name)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" autoFocus />
            <Err show={show("config")}>{problems.config.name}</Err>
          </label>
          <label className="block">
            <Label required>Target URL</Label>
            <input className={inputCls(show("config") && problems.config.link)} value={link} onChange={(e) => setLink(e.target.value)} placeholder="Target URL" inputMode="url" />
            <Err show={show("config")}>{problems.config.link}</Err>
          </label>
        </div>

        <Section title="Provider and objectives" sub="Choose where you want to create your campaign and an objective for each of the networks">
          <div className="grid gap-3 sm:grid-cols-2">
            {offered.map((p) => {
              const n = netOf(p);
              const on = providers[p].on;
              return (
                <div key={p}>
                  <SwitchCard
                    label={
                      <span className="flex items-center gap-2">
                        <n.Icon className="h-4.5 w-4.5" style={{ color: n.color }} /> {n.label}
                      </span>
                    }
                    on={on}
                    onToggle={() => toggleProvider(p)}
                  >
                    {on && (
                      <select
                        className="h-10 w-full cursor-pointer border-t border-gray-200 bg-surface px-3 text-sm text-gray-900 outline-none"
                        value={providers[p].objective}
                        onChange={(e) => setObjective(p, e.target.value)}
                        aria-label={`${n.label} objective`}
                      >
                        {(AD_OBJECTIVE_OPTIONS[p] || []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </SwitchCard>
                  {on && p === "google_ads" && (
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] text-gray-700">
                      <input type="checkbox" checked={political} onChange={(e) => setPolitical(e.target.checked)} className="h-3.5 w-3.5 accent-[#003dda]" />
                      The campaign will include political content
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          <Err show={show("config")}>{problems.config.providers}</Err>
          {offered.length < 2 && (
            <p className="text-xs text-gray-500">Connect another ad account from the sidebar to create on more than one network at once.</p>
          )}
        </Section>

        <Section title="Ad location" sub="Choose where you want to show your campaign">
          <div className="grid gap-3 sm:grid-cols-3">
            {LOCATIONS.map((l) => {
              const live = enabled.includes(l.net);
              return (
                <div key={l.id} className={`overflow-hidden rounded-lg border border-gray-200 ${live ? "" : "opacity-45"}`}>
                  <p className="flex items-center justify-center gap-2 border-b border-gray-200 py-2.5 text-[13px] font-medium text-gray-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} /> {l.label}
                  </p>
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {l.spots.map(([id, label]) => (
                      <label key={id} className={`flex items-center gap-2 px-3 py-2 text-[13px] ${live ? "cursor-pointer text-gray-700" : "cursor-not-allowed text-gray-400"}`}>
                        <input
                          type="checkbox"
                          checked={live && places[l.id].includes(id)}
                          disabled={!live}
                          onChange={() => togglePlace(l.id, id)}
                          className="h-3.5 w-3.5 accent-[#003dda]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Err show={show("config")}>{problems.config.places}</Err>
        </Section>
      </div>
    ),

    location: <LocationStep countries={countries} setCountries={setCountries} error={show("location") && problems.location.countries} />,

    segmentation: (
      <div className="space-y-8">
        <Section title="Gender">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["all", "All"],
              ["female", "Female"],
              ["male", "Male"],
            ].map(([id, l]) => (
              <Choice key={id} on={gender === id} onClick={() => setGender(id)}>
                {id === "all" && <Users className="h-4 w-4" />} {l}
              </Choice>
            ))}
          </div>
        </Section>

        <Section title="Age" aside={<span className="text-[13px] font-medium text-[#003dda]">{ageText(ageLo, ageHi)}</span>}>
          <AgeRange lo={ageLo} hi={ageHi} onChange={(lo, hi) => (setAgeLo(lo), setAgeHi(hi))} />
        </Section>

        <Section title="Language" aside={<span className="text-[13px] font-medium text-[#003dda]">{langLabel}</span>}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Choice on={!languages.length} onClick={() => setLanguages([])}>
              All languages
            </Choice>
            {MAIN_LANGS.map((c) => (
              <Choice key={c} on={languages.includes(c)} onClick={() => setLanguages((ls) => (ls.includes(c) ? ls.filter((x) => x !== c) : [...ls, c]))}>
                {langName(c)}
              </Choice>
            ))}
          </div>
          <select
            className={`${inputCls(false)} cursor-pointer`}
            value=""
            onChange={(e) => e.target.value && setLanguages((ls) => (ls.includes(e.target.value) ? ls : [...ls, e.target.value]))}
            aria-label="Other languages"
          >
            <option value="">Others…</option>
            {OTHER_LANGS.map((c) => (
              <option key={c} value={c} disabled={languages.includes(c)}>
                {langName(c)}
              </option>
            ))}
          </select>
          {languages.some((c) => !MAIN_LANGS.includes(c)) && (
            <div className="flex flex-wrap gap-1.5">
              {languages
                .filter((c) => !MAIN_LANGS.includes(c))
                .map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-md bg-[#003dda] py-1 pl-2.5 pr-1 text-xs font-medium text-white">
                    {langName(c)}
                    <button
                      type="button"
                      onClick={() => setLanguages((ls) => ls.filter((x) => x !== c))}
                      aria-label={`Remove ${langName(c)}`}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-white/25 hover:bg-white/40"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </Section>
      </div>
    ),

    audience: (
      <Section title="Audience and interests" sub="This step is optional, but audiences and interests help show your ads to people more like your customers.">
        <TagInput values={interests} onChange={setInterests} placeholder="Type an interest and press Enter — e.g. Fitness, Online shopping" />
        {!interests.length && (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <Users className="h-9 w-9 text-[#003dda]" />
            </span>
            <div className="mt-3 flex gap-2">
              {enabled.map((p) => {
                const n = netOf(p);
                return (
                  <span key={p} className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-surface">
                    <n.Icon className="h-3.5 w-3.5" style={{ color: n.color }} />
                  </span>
                );
              })}
            </div>
            <p className="mt-3 max-w-md text-[13px] text-gray-500">Leave it empty to reach everyone in the locations and ages you picked.</p>
          </div>
        )}
      </Section>
    ),

    keywords: (
      <Section
        title={
          <span className="flex items-center gap-2">
            <GoogleMark /> Keywords
          </span>
        }
        sub="Words people search for or read about — Google shows the ad next to them."
      >
        <TagInput
          values={keywords}
          onChange={setKeywords}
          placeholder="Type a keyword and press Enter"
          suggestions={keywordIdeas({ link, name, ads })}
          onClear={() => setKeywords([])}
        />
      </Section>
    ),

    design: (
      <DesignStep
        ads={ads}
        setAds={setAds}
        adKey={adKey}
        setAdKey={setAdKey}
        updateAd={updateAd}
        adProblems={adProblems}
        showErrors={show("design")}
        campaignLink={link}
        hasMeta={hasMeta}
        hasGoogle={hasGoogle}
        limits={limits}
        activeBrand={activeBrand}
        upload={upload}
        onView={setViewing}
        enabled={enabled}
      />
    ),

    budget: (
      <div className="space-y-7">
        <Section title="Budget">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label required>Budget</Label>
              <select className={`${inputCls(false)} cursor-pointer`} value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </label>
            <label className="block">
              <Label required>Amount</Label>
              <input
                className={inputCls(show("budget") && problems.budget.amount)}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min 1 — in the ad account's currency"
              />
              <Err show={show("budget")}>{problems.budget.amount}</Err>
            </label>
          </div>
          {enabled.length > 1 && <p className="text-xs text-gray-500">Each network gets this budget, in its own ad account&apos;s currency.</p>}
        </Section>

        <Section title="Bid cap">
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchCard label="Automatic" on={bidMode === "auto"} onToggle={() => setBidMode("auto")} />
            <div>
              <SwitchCard label="Manual" on={bidMode === "manual"} onToggle={() => setBidMode(bidMode === "manual" ? "auto" : "manual")} />
              {bidMode === "manual" && (
                <>
                  <input
                    className={`${inputCls(show("budget") && problems.budget.bid)} mt-3`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Max CPC"
                  />
                  <Err show={show("budget")}>{problems.budget.bid}</Err>
                </>
              )}
            </div>
          </div>
        </Section>

        <Section title="Campaign duration">
          <div className="grid gap-3 sm:grid-cols-3">
            <SwitchCard label="Custom" on={duration === "custom"} onToggle={() => pickDuration("custom")}>
              {duration === "custom" && (
                <div className="grid grid-cols-2 divide-x divide-white/20 bg-[#003dda] text-white">
                  {[
                    ["Start", start, setStart],
                    ["End", end, setEnd],
                  ].map(([l, v, set]) => (
                    <label key={l} className="block px-3 py-2">
                      <span className="block text-[11px] font-medium text-white/75">{l}</span>
                      <input type="date" value={v} min={adDate(0)} onChange={(e) => set(e.target.value)} className="w-full cursor-pointer bg-transparent text-sm font-semibold text-white outline-none scheme-dark" />
                    </label>
                  ))}
                </div>
              )}
            </SwitchCard>
            <SwitchCard label="1 Week" on={duration === "week"} onToggle={() => pickDuration("week")} />
            <SwitchCard label="1 Month" on={duration === "month"} onToggle={() => pickDuration("month")} />
          </div>
          <Err show={show("budget")}>{problems.budget.dates}</Err>
          {duration !== "custom" && (
            <p className="text-xs text-gray-500">
              Runs {start} → {end}
            </p>
          )}
        </Section>

        {hasMeta && (
          <Section
            title={
              <span className="flex items-center gap-2">
                Payer and beneficiary information <MetaMark />
              </span>
            }
            sub="Who pays for the ad and who it benefits — Meta shows these on ads in the EU."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={inputCls(show("budget") && !payer.trim())} value={payer} onChange={(e) => setPayer(e.target.value)} placeholder="Name of payer" />
              <input className={inputCls(show("budget") && !beneficiary.trim())} value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder="Name of beneficiary" />
            </div>
            <Err show={show("budget")}>{problems.budget.payer}</Err>
          </Section>
        )}

        <Section title="When it's created">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["PAUSED", "Create it paused", "Check it first, then start it from the Campaigns table."],
              ["ACTIVE", "Start right away", "It goes to review and starts spending once approved."],
            ].map(([id, l, sub]) => (
              <label
                key={id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${status === id ? "border-[#003dda]/40 bg-blue-50/70" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input type="radio" name="status" checked={status === id} onChange={() => setStatus(id)} className="mt-1 accent-[#003dda]" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{l}</span>
                  <span className="block text-xs text-gray-500">{sub}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>
      </div>
    ),

    summary: (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SummaryCard title="Configuration" onEdit={() => setStepId("config")} problems={stepProblems("config")}>
            <Row k="Campaign name" v={name} />
            <Row k="Target URL" v={link && withScheme(link)} />
            <Row k="Providers" v={enabled.map((p) => netOf(p)?.label).join(", ")} />
            <Row k="Objectives" v={enabled.map((p) => objectiveLabel(p, providers[p].objective)).join(", ")} />
            <Row k="Platforms" v={placeLabel} />
            {hasGoogle && <Row k="Political content" v={political ? "Yes" : "No"} />}
          </SummaryCard>
          <SummaryCard title="Location" onEdit={() => setStepId("location")} problems={stepProblems("location")}>
            <Row k="Countries" v={countries.map(countryName).join(", ")} />
          </SummaryCard>
          <SummaryCard title="Segmentation" onEdit={() => setStepId("segmentation")}>
            <Row k="Gender" v={gender === "all" ? "All" : gender === "female" ? "Female" : "Male"} />
            <Row k="Age" v={`from ${ageText(ageLo, ageHi)}`} />
            <Row k="Language" v={langLabel} />
          </SummaryCard>
          <SummaryCard title="Audience" onEdit={() => setStepId("audience")}>
            <Row k="Interests" v={interests.join(", ") || "Everyone"} />
          </SummaryCard>
          {hasGoogle && (
            <SummaryCard title="Keywords" onEdit={() => setStepId("keywords")}>
              <Row k="Keywords" v={keywords.join(", ") || "None — Google targets on its own"} />
            </SummaryCard>
          )}
          <SummaryCard title="Budget" onEdit={() => setStepId("budget")} problems={stepProblems("budget")}>
            <Row k="Type" v={budgetType === "daily" ? "Daily" : "Lifetime"} />
            <Row k="Total" v={amount ? `${Number(amount).toLocaleString()} ${budgetType === "daily" ? "per day" : "in total"}${enabled.length > 1 ? ", on each network" : ""}` : ""} />
            <Row k="Bid cap" v={bidMode === "manual" ? `Manual — max CPC ${bidAmount || "—"}` : "Automatic"} />
            <Row k="Start" v={start} />
            <Row k="End" v={end} />
            {hasMeta && <Row k="Name of payer" v={payer} />}
            {hasMeta && <Row k="Name of beneficiary" v={beneficiary} />}
            <Row k="On create" v={status === "ACTIVE" ? "Starts right away" : "Paused"} />
          </SummaryCard>
        </div>
        <div>
          <SummaryCard title="Design" onEdit={() => setStepId("design")} problems={stepProblems("design")}>
            <div className="divide-y divide-gray-100">
              {ads.map((a) => (
                <div key={a.key} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {a.media ? <Thumb item={a.media} className="h-full w-full" /> : <ImageIcon className="m-3.5 h-5 w-5 text-gray-300" />}
                  </span>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="truncate font-semibold text-gray-900">{a.name || "—"}</p>
                    {hasGoogle && a.title && <p className="truncate text-gray-700">{a.title}</p>}
                    <p className="truncate text-gray-700">{a.description || "—"}</p>
                    <p className="truncate text-gray-500">{withScheme(a.link || link || "")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (setAdKey(a.key), setStepId("design"))}
                    aria-label={`Edit ${a.name || "ad"}`}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#003dda]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </SummaryCard>
        </div>
      </div>
    ),
  };

  const stepError = stepProblems(stepId).length > 0 && show(stepId);

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Create campaign"
      onKeyDown={(e) => e.key === "Escape" && requestClose()}
    >
      <div className="relative flex h-full w-full max-w-[min(1400px,96vw)] flex-col overflow-hidden bg-surface shadow-2xl sm:h-[min(960px,94vh)] sm:rounded-2xl">
        {/* Header — the title and Metricool's step trail */}
        <div className="relative shrink-0 border-b border-gray-200">
          <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-gray-900">Create campaign</h2>
            <ol className="ml-auto hidden flex-wrap items-center justify-end gap-x-1 gap-y-1 md:flex">
              {steps.map((s, i) => {
                const bad = show(s.id) && stepProblems(s.id).length > 0;
                const can = i <= reached;
                return (
                  <li key={s.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                    <button
                      type="button"
                      disabled={!can}
                      onClick={() => setStepId(s.id)}
                      className={`cursor-pointer text-[10.5px] font-semibold uppercase tracking-wider transition-colors disabled:cursor-default ${
                        bad ? "text-red-500" : i === index ? "text-gray-900" : can ? "text-gray-500 hover:text-gray-800" : "text-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="ml-auto text-xs font-medium text-gray-500 md:hidden">
              Step {index + 1} of {steps.length} · <span className={stepError ? "text-red-500" : "text-gray-900"}>{steps[index].label}</span>
            </p>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress */}
          <span
            className="absolute -bottom-px left-0 h-0.5 transition-all duration-300"
            style={{ width: `${((index + 1) / steps.length) * 100}%`, background: BRAND }}
          />
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {stepId === "design" ? body.design : <div className="px-5 py-6 sm:px-6">{body[stepId]}</div>}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 px-5 py-3.5 sm:px-6">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setStepId(steps[index - 1].id)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
            >
              Previous
            </button>
          ) : (
            <button type="button" onClick={requestClose} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          )}
          <p className="min-w-0 flex-1 truncate text-center text-xs text-red-600">
            {stepError ? (stepId === "design" ? stepProblems("design")[0] : "Complete the fields marked in red to continue") : ""}
          </p>
          {last ? (
            <button
              type="button"
              onClick={() => (status === "ACTIVE" ? setConfirmLive(true) : create())}
              disabled={creating || allProblems.length > 0}
              title={allProblems.length ? allProblems[0] : undefined}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: BRAND }}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? "Creating…" : "Create campaign"}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="cursor-pointer rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: BRAND }}
            >
              Continue
            </button>
          )}
        </div>
      </div>

      <MediaViewer item={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={confirmLive}
        title="Start this campaign right away?"
        message={`It goes to ${enabled.map((p) => netOf(p)?.label).join(" and ")} for review and starts spending up to ${Number(amount || 0).toLocaleString()} ${budgetType === "daily" ? "a day" : "in total"}${enabled.length > 1 ? " on each" : ""} once approved.`}
        confirmLabel="Create and start"
        onConfirm={create}
        onCancel={() => setConfirmLive(false)}
      />
      <ConfirmDialog
        open={confirmClose}
        title="Discard this campaign?"
        message="What you've filled in will be lost."
        confirmLabel="Discard"
        variant="danger"
        onConfirm={onClose}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}

// ── Steps with more to them ───────────────────────────────────────────────

function LocationStep({ countries, setCountries, error }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = q
    ? COUNTRIES.filter(([code, n]) => n.toLowerCase().includes(q) || code.toLowerCase() === q)
        .sort((x, y) => Number(!x[1].toLowerCase().startsWith(q)) - Number(!y[1].toLowerCase().startsWith(q)))
        .slice(0, 8)
    : [];
  const add = (code) => {
    if (!countries.includes(code)) setCountries([...countries, code]);
    setQuery("");
    setOpen(false);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Label required>Location</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputCls(error)} pl-9`}
            value={query}
            onChange={(e) => (setQuery(e.target.value), setOpen(true))}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches[0]) {
                e.preventDefault();
                add(matches[0][0]);
              }
            }}
            placeholder="Search a country"
            aria-label="Search a country"
          />
          {open && matches.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-surface py-1 shadow-lg" role="listbox">
              {matches.map(([code, n]) => (
                <li key={code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(code)}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                  >
                    {n}
                    {countries.includes(code) && <span className="text-xs text-[#003dda]">Added</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Err show>{error}</Err>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {countries.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-md bg-[#003dda] py-1 pl-2.5 pr-1 text-xs font-medium text-white">
              {countryName(c)}
              <button
                type="button"
                onClick={() => setCountries(countries.filter((x) => x !== c))}
                aria-label={`Remove ${countryName(c)}`}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-white/25 hover:bg-white/40"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
        <p className="text-[13px] font-semibold text-gray-800">Where it runs</p>
        {countries.length ? (
          <ul className="mt-3 space-y-2">
            {countries.map((c) => (
              <li key={c} className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2 text-sm text-gray-800 shadow-xs">
                <MapPin className="h-4 w-4 text-[#003dda]" /> {countryName(c)}
                <span className="ml-auto text-[11px] font-medium text-gray-400">{c}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center py-12 text-center text-gray-400">
            <Globe className="h-10 w-10" />
            <p className="mt-2 text-[13px]">Search a country to add it</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** The age range — two handles over Metricool's bands. */
function AgeRange({ lo, hi, onChange }) {
  const n = AGE_BANDS.length;
  // Handles sit on band edges 0…n; the range is bands lo…hi.
  const a = lo;
  const b = hi + 1;
  const thumb =
    "pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#003dda] [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#003dda]";
  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 gap-0.5">
          {AGE_BANDS.map((band, i) => (
            <button
              key={band.label}
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => (i < lo ? onChange(i, hi) : i > hi ? onChange(lo, i) : null)}
              className={`h-full flex-1 cursor-pointer rounded-full ${i >= lo && i <= hi ? "bg-[#003dda]" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={n}
          step={1}
          value={a}
          aria-label="Youngest age"
          onChange={(e) => onChange(Math.min(Number(e.target.value), b - 1), hi)}
          className={thumb}
        />
        <input
          type="range"
          min={0}
          max={n}
          step={1}
          value={b}
          aria-label="Oldest age"
          onChange={(e) => onChange(lo, Math.max(Number(e.target.value), a + 1) - 1)}
          className={thumb}
        />
      </div>
      <div className="mt-2 grid text-center text-[12px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {AGE_BANDS.map((band, i) => (
          <span key={band.label} className={i >= lo && i <= hi ? "font-medium text-gray-900" : "text-gray-400"}>
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DesignStep({ ads, setAds, adKey, setAdKey, updateAd, adProblems, showErrors, campaignLink, hasMeta, hasGoogle, limits, activeBrand, upload, onView, enabled }) {
  const ad = ads.find((a) => a.key === adKey) || ads[0];
  const errors = showErrors ? adProblems(ad) : {};
  const set = (patch) => updateAd(ad.key, patch);
  const [tabMenu, setTabMenu] = useState(null);

  const [net, setNet] = useState(enabled[0]);
  const shownNet = enabled.includes(net) ? net : enabled[0];
  const placements = shownNet === "meta_ads" ? [["facebook", "Feed"], ["instagram", "Instagram"], ["stories", "Stories"]] : [["display", "Display"]];
  const [placement, setPlacement] = useState(placements[0][0]);
  const shownPlacement = placements.some(([id]) => id === placement) ? placement : placements[0][0];

  const addAd = (copy) => {
    const n = newAd(copy ? { ...copy, key: undefined, name: `${copy.name || "Ad"} (copy)` } : { businessName: ad.businessName, logo: ad.logo });
    if (copy) n.key = `ad${++adSeq}`;
    setAds((all) => [...all, n]);
    setAdKey(n.key);
    setTabMenu(null);
  };
  const removeAd = (key) => {
    const rest = ads.filter((a) => a.key !== key);
    setAds(rest);
    if (key === ad.key) setAdKey(rest[0].key);
    setTabMenu(null);
  };
  const ctaLabel = AD_CALLS_TO_ACTION.find((c) => c.value === ad.cta)?.label || "Learn more";
  const link = ad.link || campaignLink;

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:min-h-0 lg:flex-row">
      <div className="min-w-0 flex-1 lg:overflow-y-auto lg:border-r lg:border-gray-200">
        {/* Ad tabs — Metricool's strip */}
        <div className="sticky top-0 z-10 flex items-end gap-1 overflow-x-auto bg-gray-900 px-5 pt-2 hide-scrollbar sm:px-6">
          {ads.map((a, i) => {
            const on = a.key === ad.key;
            const bad = showErrors && Object.keys(adProblems(a)).length > 0;
            return (
              <div key={a.key} className="relative">
                <span
                  className={`flex items-center gap-1 rounded-t-lg py-2 pl-3.5 pr-1.5 text-[13px] font-medium ${on ? "bg-surface text-gray-900" : "bg-white/10 text-white/80 hover:bg-white/20"} ${bad ? "ring-1 ring-inset ring-red-400" : ""}`}
                >
                  <button type="button" onClick={() => setAdKey(a.key)} className="max-w-36 cursor-pointer truncate">
                    {a.name.trim() || `Ad ${i + 1}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabMenu(tabMenu === a.key ? null : a.key)}
                    aria-label="Ad options"
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-black/10"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 rotate-90" />
                  </button>
                </span>
                {tabMenu === a.key && (
                  <div className="fixed z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-surface p-1 shadow-xl">
                    <button type="button" onClick={() => addAd(a)} className="flex w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100">
                      Duplicate
                    </button>
                    <button
                      type="button"
                      disabled={ads.length < 2}
                      onClick={() => removeAd(a.key)}
                      className="flex w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => addAd()}
            title="Add another ad to this campaign"
            aria-label="Add ad"
            className="mb-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6" onClick={() => tabMenu && setTabMenu(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label required>Ad name</Label>
              <input className={inputCls(errors.name)} value={ad.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ad name" />
              <Err show>{errors.name}</Err>
              {hasMeta && !errors.name && <p className="mt-1 text-[11px] text-gray-500">The headline on Facebook and Instagram.</p>}
            </label>
            <label className="block">
              <Label required count={ad.businessName.length} max={BUSINESS_MAX}>Business name</Label>
              <input className={inputCls(errors.business)} value={ad.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="Business name" />
              <Err show>{errors.business}</Err>
            </label>
          </div>
          <div className={`grid gap-4 ${hasGoogle ? "sm:grid-cols-2" : ""}`}>
            <label className="block">
              <Label required>Website URL</Label>
              <input className={inputCls(errors.link)} value={ad.link || campaignLink} onChange={(e) => set({ link: e.target.value })} placeholder="https://" inputMode="url" />
              <Err show>{errors.link}</Err>
            </label>
            {hasGoogle && (
              <label className="block">
                <Label required count={ad.title.length} max={LIMITS.google_ads.title}>Title (Google Ads)</Label>
                <input className={inputCls(errors.title)} value={ad.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" />
                <Err show>{errors.title}</Err>
              </label>
            )}
          </div>
          <label className="block">
            <Label required count={ad.description.length} max={limits.description}>Description</Label>
            <input className={inputCls(errors.description)} value={ad.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" />
            <Err show>{errors.description}</Err>
          </label>

          {hasMeta && (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <label className="block">
                <Label count={ad.text.length} max={2000}>Primary text (Facebook and Instagram)</Label>
                <textarea className={`${inputCls(false)} h-20 resize-none py-2`} value={ad.text} onChange={(e) => set({ text: e.target.value })} placeholder="The text above the image" />
              </label>
              <label className="block">
                <Label>Call to action</Label>
                <select className={`${inputCls(false)} cursor-pointer`} value={ad.cta} onChange={(e) => set({ cta: e.target.value })}>
                  {AD_CALLS_TO_ACTION.map((c) => (
                    <option key={c.value || "default"} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div>
            <Label required>Multimedia</Label>
            <p className="-mt-0.5 mb-2.5 text-[13px] text-gray-600">
              {hasGoogle
                ? "Google needs a landscape image (1.91:1, 1200×628 recommended) — the 1:1 copy it also needs is made for you."
                : "Add an image or a video to generate a preview."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <MediaMenu
                tile
                onFile={(f) => upload(f, (m) => updateAd(ad.key, { media: m }), hasGoogle)}
                onPick={(m) => set({ media: { id: `${Date.now()}`, ...m } })}
                activeBrand={activeBrand}
                imagesOnly={hasGoogle}
              />
              {ad.media && <MediaTile item={ad.media} onView={() => onView(ad.media)} onRemove={() => set({ media: null })} />}
            </div>
            <Err show>{errors.media}</Err>
          </div>

          {hasGoogle && (
            <div>
              <Label required>Logo</Label>
              <p className="-mt-0.5 mb-2.5 text-[13px] text-gray-600">Logo must have a square aspect ratio (1:1). We recommend 256×256 pixels.</p>
              <div className="flex flex-wrap items-center gap-3">
                <MediaMenu
                  tile
                  onFile={(f) => upload(f, (m) => updateAd(ad.key, { logo: m }), true)}
                  onPick={(m) => (m.type === "image" ? set({ logo: { id: "logo", ...m } }) : toast.error("The logo has to be an image."))}
                  activeBrand={activeBrand}
                  imagesOnly
                />
                {ad.logo && <MediaTile item={ad.logo} onView={() => onView(ad.logo)} onRemove={() => set({ logo: null })} />}
              </div>
              <Err show>{errors.logo}</Err>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-w-0 flex-col bg-gray-100/80 lg:w-[44%] lg:overflow-y-auto">
        <div className="flex flex-col items-center gap-2.5 px-5 pt-5">
          {enabled.length > 1 && (
            <div className="flex gap-1 rounded-lg bg-surface p-1 shadow-xs">
              {enabled.map((p) => {
                const n = netOf(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNet(p)}
                    title={n.label}
                    className={`flex h-8 w-11 cursor-pointer items-center justify-center rounded-md transition-colors ${shownNet === p ? "bg-blue-50 ring-1 ring-[#003dda]/30" : "hover:bg-gray-50"}`}
                  >
                    <n.Icon className="h-4.5 w-4.5" style={{ color: n.color }} />
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-1.5">
            {placements.map(([id, l]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlacement(id)}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  shownPlacement === id ? "bg-[#003dda] text-white" : "bg-surface text-gray-600 hover:text-gray-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 p-5">
          <AdPreview
            placement={shownPlacement}
            brand={ad.businessName || activeBrand?.name || "Your brand"}
            logo={(shownNet === "google_ads" ? ad.logo?.previewUrl || ad.logo?.url : null) || activeBrand?.logo}
            media={ad.media}
            text={ad.text}
            headline={shownNet === "google_ads" ? ad.title : ad.name}
            description={ad.description}
            domain={domainOf(link)}
            cta={shownNet === "google_ads" ? "Open" : ctaLabel}
          />
        </div>
        <p className="mx-5 mb-5 text-center text-[11px] text-gray-500">
          An approximation — {enabled.map((p) => netOf(p)?.label).join(" and ")} review{enabled.length > 1 ? "" : "s"} every ad before it runs.
        </p>
      </div>
    </div>
  );
}

/** A picked image / video with its ⋯ menu. */
function MediaTile({ item, onView, onRemove }) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <Thumb item={item} className="h-full w-full" />
        {item.uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
      </div>
      {!item.uploading && (
        <span className="absolute -right-1.5 -top-1.5">
          <ItemMenu item={item} onView={onView} onRemove={onRemove} />
        </span>
      )}
    </div>
  );
}

function SummaryCard({ title, onEdit, problems = [], children }) {
  return (
    <div className={`rounded-xl border ${problems.length ? "border-red-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <p className="text-sm font-semibold text-gray-900">{title}:</p>
        <button type="button" onClick={onEdit} aria-label={`Edit ${title}`} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-[#003dda]">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1 px-4 py-3 text-[13px]">
        {children}
        {problems.length > 0 && (
          <ul className="space-y-0.5 pt-1 text-xs text-red-600">
            {problems.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <p className="truncate text-gray-700">
      <span className="font-semibold text-gray-900">{k}:</span> {v || "—"}
    </p>
  );
}

const MetaMark = () => {
  const n = netOf("meta_ads");
  return n ? <n.Icon className="h-4 w-4" style={{ color: n.color }} /> : null;
};
const GoogleMark = () => {
  const n = netOf("google_ads");
  return n ? <n.Icon className="h-4 w-4" style={{ color: n.color }} /> : null;
};

/** The ad as it shows in each placement. */
function AdPreview({ placement, brand, logo, media, text, headline, description, domain, cta }) {
  const avatar = (size) => (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#003dda] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        brand[0]?.toUpperCase()
      )}
    </span>
  );
  const src = media?.previewUrl || media?.url;
  const visual = (cls) =>
    media ? (
      media.type === "video" ? (
        <video src={src} className={`w-full bg-black object-cover ${cls}`} muted playsInline controls />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={`w-full object-cover ${cls}`} />
      )
    ) : (
      <div className={`flex w-full items-center justify-center bg-gray-100 text-gray-300 ${cls}`}>
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  const ph = (v, fallback) => v?.trim() || <span className="italic text-gray-300">{fallback}</span>;

  if (placement === "stories")
    return (
      <div className="relative mx-auto aspect-9/16 w-64 overflow-hidden rounded-3xl bg-black shadow-xl">
        {visual("absolute inset-0 h-full")}
        <div className="absolute inset-x-0 top-0 bg-linear-to-b from-black/60 to-transparent p-3 text-white">
          <div className="mb-2 h-0.5 rounded-full bg-white/40">
            <div className="h-full w-1/3 rounded-full bg-white" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            {avatar(28)}
            <span className="font-semibold">{brand}</span>
            <span className="text-white/75">Sponsored</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center bg-linear-to-t from-black/70 to-transparent px-4 pb-6 pt-14 text-center text-white">
          <ChevronLeft className="h-5 w-5 rotate-90" />
          <span className="mt-1 rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900">{cta}</span>
        </div>
      </div>
    );

  if (placement === "instagram")
    return (
      <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-sm">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {avatar(32)}
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-gray-900">{brand.toLowerCase().replace(/\s+/g, "")}</p>
            <p className="text-[11px] text-gray-500">Sponsored</p>
          </div>
          <MoreHorizontal className="ml-auto h-5 w-5 text-gray-700" />
        </div>
        {visual("aspect-square")}
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#0095f6]/10 px-3 py-2.5 text-[13px] font-semibold text-[#0095f6]">
          {cta} <ChevronRight className="h-4 w-4" />
        </div>
        <p className="px-3 py-2.5 text-[13px] text-gray-900">
          <span className="mr-1 font-semibold">{brand.toLowerCase().replace(/\s+/g, "")}</span>
          {ph(text, "Your primary text")}
        </p>
      </div>
    );

  if (placement === "display")
    return (
      <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-sm">
        {visual("aspect-[1.91/1]")}
        <div className="p-4">
          <p className="text-base font-semibold leading-snug text-gray-900">{ph(headline, "Your title")}</p>
          <p className="mt-1 text-sm text-gray-600">{ph(description, "Your description")}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-gray-600">
              {avatar(22)} {brand}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-white">
              <ChevronRight className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 inline-block rounded border border-gray-300 px-1 text-[10px] font-semibold text-gray-500">Ad</p>
        </div>
      </div>
    );

  // Facebook feed
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-sm">
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        {avatar(40)}
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-gray-900">{brand}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            Sponsored · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="ml-auto h-5 w-5 text-gray-500" />
      </div>
      {text.trim() && <p className="whitespace-pre-line px-3 pb-2.5 text-sm text-gray-900">{text}</p>}
      {visual("aspect-square")}
      <div className="flex items-center gap-3 bg-gray-100 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] uppercase text-gray-500">{domain || "yourwebsite.com"}</p>
          <p className="truncate text-sm font-semibold text-gray-900">{ph(headline, "Your ad name")}</p>
          {description && <p className="truncate text-xs text-gray-500">{description}</p>}
        </div>
        <span className="shrink-0 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">{cta}</span>
      </div>
      <div className="mx-3 flex items-center justify-around border-t border-gray-200 py-1.5 text-[13px] font-semibold text-gray-600">
        {[
          [ThumbsUp, "Like"],
          [MessageCircle, "Comment"],
          [Share2, "Share"],
        ].map(([I, l]) => (
          <span key={l} className="flex items-center gap-1.5 py-1">
            <I className="h-4.5 w-4.5" /> {l}
          </span>
        ))}
      </div>
    </div>
  );
}
