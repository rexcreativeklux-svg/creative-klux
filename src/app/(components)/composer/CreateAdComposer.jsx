"use client";

// app/(components)/composer/CreateAdComposer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// "Create campaign" — Metricool's ad flow, in five steps, with a live preview:
//
//   1 Configuration   campaign name · target URL · provider · objective ·
//                     ad location
//   2 Audience        countries · gender · age · languages · interests
//   3 Design          image · business name · headline · text · description ·
//                     call to action
//   4 Budget          daily / lifetime · amount · bid cap · duration · start
//   5 Summary         every block, each with an edit link → Create campaign
//
// It sends what POST creatives/ads can take (see publishAd): name, objective,
// link, countries, age range, image / video, text, headline, description,
// call to action, business name, logo, daily or lifetime budget, dates and
// status. Metricool's fields the backend can't take yet — gender, languages,
// interests, placements, bid cap — are shown in their place, switched off,
// saying so, rather than collected and silently dropped.
//
// Campaigns are created PAUSED unless "Start right away" is picked; going live
// spends money, so that asks for confirmation first.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  ThumbsUp,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsHydrated } from "@/utils/useIsHydrated";
import { uploadForPublish } from "@/(lib)/creativesApi";
import {
  AD_CALLS_TO_ACTION,
  AD_OBJECTIVE_OPTIONS,
  defaultAdObjective,
  invalidateCampaigns,
  publishAd,
} from "@/(lib)/integration";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import { AD_NETWORKS } from "@/app/(components)/content/socialPlatformScope";
import MediaMenu from "./MediaMenu";

const BRAND = "#003dda";

const STEPS = [
  { id: "config", label: "Configuration" },
  { id: "audience", label: "Audience" },
  { id: "design", label: "Design" },
  { id: "budget", label: "Budget" },
  { id: "summary", label: "Summary" },
];

const COUNTRIES = [
  ["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"], ["ZA", "South Africa"], ["EG", "Egypt"],
  ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["IE", "Ireland"], ["AU", "Australia"],
  ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"], ["NL", "Netherlands"],
  ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["IN", "India"], ["BR", "Brazil"], ["MX", "Mexico"],
];
const AGES = [18, 21, 25, 30, 35, 40, 45, 50, 55, 60, 65];

// Text limits each network takes (publishAd trims to the same).
const LIMITS = {
  google_ads: { headline: 30, description: 90, business: 25 },
  default: { headline: 255, description: 500, business: 25 },
};

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const domainOf = (url) => {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} [props.onCreated]      After the campaign is created.
 * @param {string} [props.initialPlatform]    The ad network it starts on.
 * @param {{url, type}} [props.initialMedia]  An already-hosted image / video.
 * @param {string[]} [props.connected]        Connected ad networks (provider choice).
 */
export default function CreateAdComposer({ isOpen, ...props }) {
  const hydrated = useIsHydrated();
  if (!hydrated || !isOpen) return null;
  return createPortal(<AdScreen {...props} />, document.body);
}

/** A field the backend can't take yet — shown, switched off, saying so. */
function Unsupported({ label, children }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" /> {children}
      </p>
    </div>
  );
}

function Field({ label, hint, count, max, children }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-gray-800">
        {label}
        {max && (
          <span className={`text-[11px] font-normal tabular-nums ${count > max ? "text-red-600" : "text-gray-400"}`}>
            {count}/{max}
          </span>
        )}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

const input =
  "h-10 w-full rounded-lg border border-gray-200 bg-surface px-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#003dda]";

function AdScreen({ onClose, onCreated, initialPlatform, initialMedia = null, connected = [] }) {
  const { activeBrand } = useAuth();
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState(initialPlatform || connected[0] || "meta_ads");
  const limits = LIMITS[platform] || LIMITS.default;

  // ── The campaign ─────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [objective, setObjective] = useState(defaultAdObjective(platform));
  const [countries, setCountries] = useState(["NG"]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [businessName, setBusinessName] = useState(activeBrand?.name || "");
  const [headline, setHeadline] = useState("");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [cta, setCta] = useState("LEARN_MORE");
  const [budgetType, setBudgetType] = useState("daily");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("week"); // week | month | custom
  const [start, setStart] = useState(addDays(0));
  const [end, setEnd] = useState(addDays(7));
  const [status, setStatus] = useState("PAUSED");
  const [placement, setPlacement] = useState("facebook"); // preview tab

  const [creating, setCreating] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // A new provider starts on its own default objective.
  const switchPlatform = (p) => {
    setPlatform(p);
    setObjective(defaultAdObjective(p));
    setPlacement(p === "meta_ads" ? "facebook" : "display");
  };

  // Duration presets set the dates.
  const pickDuration = (d) => {
    setDuration(d);
    if (d === "week") {
      setStart(addDays(0));
      setEnd(addDays(7));
    } else if (d === "month") {
      setStart(addDays(0));
      setEnd(addDays(30));
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!type) return toast.error("Pick an image or a video file.");
    const previewUrl = URL.createObjectURL(file);
    setMedia({ type, previewUrl, url: null });
    setUploading(true);
    try {
      const url = await uploadForPublish(file);
      if (!url) throw new Error("The upload didn't return a link.");
      setMedia({ type, previewUrl, url });
    } catch (err) {
      toast.error(err.message || "Upload failed");
      setMedia(null);
    } finally {
      setUploading(false);
    }
  };

  // ── Validation, per step ─────────────────────────────────────────────────
  const problems = useMemo(() => {
    const p = { config: [], audience: [], design: [], budget: [] };
    if (!name.trim()) p.config.push("Give the campaign a name.");
    if (!domainOf(link)) p.config.push("Add the target URL people land on.");
    if (!countries.length) p.audience.push("Pick at least one country.");
    if (Number(ageMin) > Number(ageMax)) p.audience.push("The minimum age is above the maximum.");
    if (!media?.url) p.design.push(uploading ? "Wait for the upload to finish." : "Add an image or a video.");
    if (!headline.trim()) p.design.push("Add a headline.");
    if (headline.length > limits.headline) p.design.push(`The headline is over ${limits.headline} characters.`);
    if (description.length > limits.description) p.design.push(`The description is over ${limits.description} characters.`);
    if (businessName.length > limits.business) p.design.push(`The business name is over ${limits.business} characters.`);
    if (!(Number(amount) >= 1)) p.budget.push("Set a budget of at least 1.");
    if (!start || !end || end <= start) p.budget.push("The end date has to be after the start.");
    return p;
  }, [name, link, countries, ageMin, ageMax, media, uploading, headline, description, businessName, limits, amount, start, end]);
  const stepProblems = (i) => problems[STEPS[i].id] || [];
  const allProblems = Object.values(problems).flat();

  const create = async () => {
    setConfirmLive(false);
    setCreating(true);
    try {
      await publishAd({
        platform,
        name: name.trim(),
        objective,
        link: /^https?:\/\//.test(link) ? link.trim() : `https://${link.trim()}`,
        countries,
        age_min: ageMin,
        age_max: ageMax,
        ...(media.type === "video" ? { video_url: media.url } : { image_url: media.url }),
        text: text.trim(),
        headline: headline.trim(),
        description: description.trim(),
        call_to_action: cta,
        business_name: businessName.trim(),
        logo_url: activeBrand?.logo || undefined,
        ...(budgetType === "daily" ? { daily_budget: Number(amount) } : { lifetime_budget: Number(amount) }),
        start_date: start,
        end_date: end,
        status,
      });
      invalidateCampaigns();
      toast.success(status === "ACTIVE" ? "Campaign created and live" : "Campaign created — paused until you start it");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Couldn't create the campaign");
    } finally {
      setCreating(false);
    }
  };

  const requestClose = () => {
    if (creating) return;
    if (name || link || media || headline || text) setConfirmClose(true);
    else onClose();
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const network = AD_NETWORKS.find((n) => n.id === platform);
  const ctaLabel = AD_CALLS_TO_ACTION.find((c) => c.value === cta)?.label || "Learn more";
  const providers = connected.length ? connected : [platform];

  // ── Steps ────────────────────────────────────────────────────────────────
  const stepBody = [
    // 1 Configuration
    <div key="config" className="space-y-5">
      <Field label="Campaign name">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Black Friday — 20% off" autoFocus />
      </Field>
      <Field label="Target URL" hint="Where people land when they click the ad.">
        <input className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://yourwebsite.com/offer" />
      </Field>
      <div>
        <p className="text-sm font-medium text-gray-800">Provider and objective</p>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {providers.map((p) => {
            const n = AD_NETWORKS.find((x) => x.id === p);
            if (!n) return null;
            const on = p === platform;
            return (
              <button
                key={p}
                type="button"
                onClick={() => switchPlatform(p)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  on ? "border-[#003dda] bg-blue-50/60" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <n.Icon className="h-5 w-5" style={{ color: n.color }} />
                <span className="flex-1 text-sm font-semibold text-gray-900">{n.label}</span>
                <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border ${on ? "border-[#003dda] bg-[#003dda] text-white" : "border-gray-300"}`}>
                  {on && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-2">
          {(AD_OBJECTIVE_OPTIONS[platform] || []).map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                objective === o.value ? "border-[#003dda] bg-blue-50/60 text-gray-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input type="radio" name="objective" checked={objective === o.value} onChange={() => setObjective(o.value)} className="accent-[#003dda]" />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      {platform === "meta_ads" ? (
        <Unsupported label="Ad location — Feed / Stories on Facebook and Instagram">
          Meta places the ad automatically for now; choosing placements needs the backend to send them.
        </Unsupported>
      ) : null}
    </div>,

    // 2 Audience
    <div key="audience" className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-800">Location</p>
        <p className="mt-0.5 text-xs text-gray-500">Countries where the ad is shown.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COUNTRIES.map(([code, label]) => {
            const on = countries.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => setCountries((c) => (on ? c.filter((x) => x !== code) : [...c, code]))}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  on ? "border-[#003dda] bg-[#003dda] text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minimum age">
          <select className={input} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))}>
            {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Maximum age">
          <select className={input} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))}>
            {AGES.map((a) => <option key={a} value={a}>{a === 65 ? "65+" : a}</option>)}
          </select>
        </Field>
      </div>
      <Unsupported label="Gender">Shown to everyone for now — the backend doesn&apos;t take a gender setting yet.</Unsupported>
      <Unsupported label="Languages">All languages for now — the backend doesn&apos;t take languages yet.</Unsupported>
      <Unsupported label="Audiences and interests">Needs the backend to send saved audiences and interests to {network?.label}.</Unsupported>
    </div>,

    // 3 Design
    <div key="design" className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-800">Multimedia</p>
        <p className="mt-0.5 text-xs text-gray-500">One image or video per ad — from your computer, your library, AI or stock.</p>
        <div className="mt-2 flex items-center gap-3">
          {media ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {media.type === "video" ? (
                <video src={media.previewUrl || media.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.previewUrl || media.url} alt="" className="h-full w-full object-cover" />
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </span>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  aria-label="Remove"
                  className="absolute right-1 top-1 flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-300">
              <ImageIcon className="h-7 w-7" />
            </span>
          )}
          <MediaMenu
            label={media ? "Replace" : "Add image or video"}
            onFile={handleFile}
            onPick={(m) => setMedia(m)}
            activeBrand={activeBrand}
          />
        </div>
      </div>
      <Field label="Business name" count={businessName.length} max={limits.business}>
        <input className={input} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      </Field>
      <Field label="Headline" count={headline.length} max={limits.headline}>
        <input className={input} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="20% off every plan — this week only" />
      </Field>
      <Field label="Primary text" hint="The text above the image." count={text.length} max={2000}>
        <textarea
          className={`${input} h-24 resize-none py-2`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you want people to know?"
        />
      </Field>
      <Field label="Description" count={description.length} max={limits.description}>
        <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A line under the headline" />
      </Field>
      <Field label="Call to action">
        <select className={input} value={cta} onChange={(e) => setCta(e.target.value)}>
          {AD_CALLS_TO_ACTION.map((c) => (
            <option key={c.value || "default"} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
    </div>,

    // 4 Budget
    <div key="budget" className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-800">Budget</p>
        <div className="mt-1.5 flex gap-2">
          {[
            ["daily", "Daily"],
            ["lifetime", "Lifetime"],
          ].map(([id, l]) => (
            <button
              key={id}
              type="button"
              onClick={() => setBudgetType(id)}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${
                budgetType === id ? "border-[#003dda] bg-blue-50/60 text-[#003dda]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          className={`${input} mt-2`}
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={budgetType === "daily" ? "Amount per day" : "Total amount"}
        />
        <p className="mt-1 text-xs text-gray-500">Whole units of the ad account&apos;s own currency.</p>
      </div>
      <Unsupported label="Bid cap">Automatic — {network?.label} bids for you. Manual bids need the backend to send them.</Unsupported>
      <div>
        <p className="text-sm font-medium text-gray-800">Campaign duration</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {[
            ["week", "1 week"],
            ["month", "1 month"],
            ["custom", "Custom"],
          ].map(([id, l]) => (
            <button
              key={id}
              type="button"
              onClick={() => pickDuration(id)}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${
                duration === id ? "border-[#003dda] bg-blue-50/60 text-[#003dda]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Starts">
            <input className={input} type="date" value={start} onChange={(e) => (setStart(e.target.value), setDuration("custom"))} />
          </Field>
          <Field label="Ends">
            <input className={input} type="date" value={end} onChange={(e) => (setEnd(e.target.value), setDuration("custom"))} />
          </Field>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">When it&apos;s created</p>
        <div className="mt-1.5 grid gap-2">
          {[
            ["PAUSED", "Create it paused", "Check it in the network first, then start it from the Campaigns table."],
            ["ACTIVE", "Start right away", "It goes to review and starts spending once approved."],
          ].map(([id, l, sub]) => (
            <label
              key={id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 ${
                status === id ? "border-[#003dda] bg-blue-50/60" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input type="radio" name="status" checked={status === id} onChange={() => setStatus(id)} className="mt-1 accent-[#003dda]" />
              <span>
                <span className="block text-sm font-medium text-gray-900">{l}</span>
                <span className="block text-xs text-gray-500">{sub}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>,

    // 5 Summary
    <div key="summary" className="space-y-3">
      {[
        { at: 0, title: "Configuration", rows: [["Campaign", name || "—"], ["Target URL", link || "—"], ["Provider", network?.label], ["Objective", (AD_OBJECTIVE_OPTIONS[platform] || []).find((o) => o.value === objective)?.label || objective]] },
        { at: 1, title: "Audience", rows: [["Location", countries.map((c) => COUNTRIES.find(([k]) => k === c)?.[1] || c).join(", ") || "—"], ["Age", `${ageMin}–${ageMax === 65 ? "65+" : ageMax}`]] },
        { at: 2, title: "Design", rows: [["Media", media ? (media.type === "video" ? "Video" : "Image") : "—"], ["Business name", businessName || "—"], ["Headline", headline || "—"], ["Call to action", ctaLabel]] },
        { at: 3, title: "Budget", rows: [["Budget", amount ? `${Number(amount).toLocaleString()} ${budgetType === "daily" ? "per day" : "in total"}` : "—"], ["Runs", `${start} → ${end}`], ["On create", status === "ACTIVE" ? "Starts right away" : "Paused"]] },
      ].map((b) => (
        <div key={b.title} className="rounded-xl border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{b.title}</p>
            <button type="button" onClick={() => setStep(b.at)} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#003dda] hover:underline">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
            {b.rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-gray-500">{k}</dt>
                <dd className="truncate text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>
          {stepProblems(b.at).length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-red-600">
              {stepProblems(b.at).map((p) => <li key={p}>• {p}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>,
  ];

  const last = step === STEPS.length - 1;
  const here = stepProblems(step);

  return (
    <div className="fixed inset-0 z-90 flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="Create campaign">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 px-4 py-4 sm:px-8">
        <h2 className="text-xl font-bold text-gray-900">Create campaign</h2>
        {activeBrand?.name && (
          <span className="rounded-full border border-gray-200 bg-surface px-2.5 py-1 text-xs font-medium text-gray-700">{activeBrand.name}</span>
        )}
        <button type="button" onClick={requestClose} className="ml-auto flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <X className="h-4 w-4" /> Close
        </button>
      </div>

      <div className="mx-4 mb-4 flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm sm:mx-8 sm:mb-6">
        {/* Left: the steps */}
        <div className="flex min-w-0 flex-1 flex-col lg:border-r lg:border-gray-200">
          <ol className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-200 px-4 py-3 hide-scrollbar sm:px-5">
            {STEPS.map((s, i) => {
              const done = i < step && !stepProblems(i).length;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      i === step ? "bg-blue-50 text-[#003dda]" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        done ? "bg-emerald-600 text-white" : i === step ? "bg-[#003dda] text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-xl">{stepBody[step]}</div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 px-4 py-3 sm:px-6">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <button type="button" onClick={requestClose} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancel
              </button>
            )}
            {here.length > 0 && !last && <p className="truncate text-xs text-red-600">{here[0]}</p>}
            {last ? (
              <button
                type="button"
                onClick={() => (status === "ACTIVE" ? setConfirmLive(true) : create())}
                disabled={creating || allProblems.length > 0}
                className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? "Creating…" : "Create campaign"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="ml-auto flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                style={{ background: BRAND }}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: preview */}
        <div className="hidden min-w-0 flex-1 flex-col bg-gray-50/60 lg:flex lg:max-w-[46%]">
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-5 py-3">
            <span className="text-sm font-semibold text-gray-800">Preview</span>
            <div className="ml-auto flex gap-1 rounded-lg bg-gray-100 p-0.5">
              {(platform === "meta_ads"
                ? [
                    ["facebook", "Facebook feed"],
                    ["instagram", "Instagram feed"],
                    ["stories", "Stories"],
                  ]
                : [["display", "Display"]]
              ).map(([id, l]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlacement(id)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium ${placement === id ? "bg-surface text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <AdPreview
              placement={platform === "meta_ads" ? placement : "display"}
              brand={businessName || activeBrand?.name || "Your brand"}
              logo={activeBrand?.logo}
              media={media}
              text={text}
              headline={headline}
              description={description}
              domain={domainOf(link)}
              cta={ctaLabel}
            />
          </div>
          <p className="m-5 mt-0 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-900">
            Previews approximate how the ad will look. {network?.label} reviews every ad before it runs.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLive}
        title="Start this campaign right away?"
        message={`It goes to ${network?.label} for review and starts spending up to ${Number(amount || 0).toLocaleString()} ${budgetType === "daily" ? "a day" : "in total"} once approved.`}
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
  const visual = (cls) =>
    media ? (
      media.type === "video" ? (
        <video src={media.previewUrl || media.url} className={`w-full bg-black object-cover ${cls}`} muted playsInline controls />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.previewUrl || media.url} alt="" className={`w-full object-cover ${cls}`} />
      )
    ) : (
      <div className={`flex w-full items-center justify-center bg-gray-100 text-gray-300 ${cls}`}>
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  const ph = (v, fallback) => v?.trim() || <span className="italic text-gray-300">{fallback}</span>;

  if (placement === "stories")
    return (
      <div className="relative mx-auto aspect-9/16 w-72 overflow-hidden rounded-3xl bg-black shadow-xl">
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
          <p className="text-base font-semibold leading-snug text-gray-900">{ph(headline, "Your headline")}</p>
          <p className="mt-1 text-sm text-gray-600">{ph(description || text, "Your description")}</p>
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
      <p className="whitespace-pre-line px-3 pb-2.5 text-sm text-gray-900">{ph(text, "Your primary text")}</p>
      {visual("aspect-square")}
      <div className="flex items-center gap-3 bg-gray-100 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] uppercase text-gray-500">{domain || "yourwebsite.com"}</p>
          <p className="truncate text-sm font-semibold text-gray-900">{ph(headline, "Your headline")}</p>
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
