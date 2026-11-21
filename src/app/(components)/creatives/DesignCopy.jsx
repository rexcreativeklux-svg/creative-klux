"use client";

// app/(components)/creatives/DesignCopy.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Generated copy" section of Creative Studio's design sidebar: the text
// the backend wrote for a design, laid out to be read and copied piece by
// piece — the main text, the alternative headlines and descriptions, the
// hashtags / keywords / tags, and the text written for each network.
//
// Reads both copy shapes (see (lib)/designCopy). Every value has its own copy
// button; the footer's "Copy Text" still copies the lot.

import { useState } from "react";
import { Check, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { fieldLabel, hashtagLine, hasCopy, list, networkLabel, parseCopy, str } from "@/(lib)/designCopy";

/** Main fields first, in reading order; anything else follows. */
const MAIN_ORDER = ["title", "headline", "tagline", "primary_text", "body", "description", "cta", "alt_text"];
/** Arrays shown as numbered alternatives rather than chips. */
const LIST_KEYS = new Set(["headlines", "descriptions"]);

function CopyButton({ text, label }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        toast.success(`${label} copied`);
        setTimeout(() => setDone(false), 1500);
      }}
      aria-label={`Copy ${label.toLowerCase()}`}
      title="Copy"
      className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors ${
        done ? "text-green-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

const Label = ({ children }) => (
  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{children}</span>
);

/** One text value: label, the text, a copy button. */
function TextField({ name, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <Label>{fieldLabel(name)}</Label>
        <p className="mt-0.5 whitespace-pre-line break-words text-xs leading-relaxed text-gray-700">{value}</p>
      </div>
      <CopyButton text={value} label={fieldLabel(name)} />
    </div>
  );
}

/** Alternatives (headlines / descriptions), each copyable on its own. */
function ListField({ name, items }) {
  return (
    <div>
      <Label>
        {fieldLabel(name)} · {items.length}
      </Label>
      <ol className="mt-1 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg bg-surface px-2 py-1.5 ring-1 ring-gray-100">
            <span className="mt-px w-3 shrink-0 text-[10px] font-semibold text-gray-400">{i + 1}</span>
            <span className="min-w-0 flex-1 text-xs leading-snug text-gray-700">{item}</span>
            <CopyButton text={item} label={fieldLabel(name).replace(/s$/, "")} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Hashtags / keywords / tags as chips, with one button for the whole set. */
function ChipsField({ name, items }) {
  const hashtags = name === "hashtags";
  const shown = hashtags ? hashtagLine(items).split(" ") : items;
  return (
    <div>
      <div className="flex items-center gap-2">
        <Label>
          {fieldLabel(name)} · {items.length}
        </Label>
        <span className="ml-auto">
          <CopyButton text={hashtags ? hashtagLine(items) : items.join(", ")} label={fieldLabel(name)} />
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {shown.map((t, i) => (
          <span
            key={i}
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              hashtags ? "bg-blue-50 text-blue-700" : "bg-surface text-gray-600 ring-1 ring-gray-200"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Any field of a copy object, rendered for its kind. */
function Field({ name, value }) {
  if (Array.isArray(value)) {
    const items = list(value);
    if (!items.length) return null;
    return LIST_KEYS.has(name) ? <ListField name={name} items={items} /> : <ChipsField name={name} items={items} />;
  }
  const text = str(value);
  return text ? <TextField name={name} value={text} /> : null;
}

/**
 * @param {object} props
 * @param {object|string} props.copy  The design's `copy`, parsed or not.
 */
export default function DesignCopy({ copy }) {
  const c = parseCopy(copy);
  const networks = Object.entries(c.platforms || {}).filter(
    ([, fields]) => fields && typeof fields === "object" && Object.keys(fields).length > 0,
  );
  const [network, setNetwork] = useState(null);
  const activeNetwork = networks.find(([id]) => id === network) || networks[0];

  if (!hasCopy(c))
    return (
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-600">Generated copy</p>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-400">
          <FileText className="h-4 w-4 shrink-0" />
          No copy for this design yet.
        </div>
      </div>
    );

  const keys = Object.keys(c).filter((k) => k !== "platforms" && !(c[k] && typeof c[k] === "object" && !Array.isArray(c[k])));
  const ordered = [
    ...MAIN_ORDER.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !MAIN_ORDER.includes(k) && !Array.isArray(c[k])),
    ...keys.filter((k) => LIST_KEYS.has(k)),
    ...keys.filter((k) => Array.isArray(c[k]) && !LIST_KEYS.has(k)),
  ];

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Generated copy</p>

      {ordered.length > 0 && (
        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          {ordered.map((k) => (
            <Field key={k} name={k} value={c[k]} />
          ))}
        </div>
      )}

      {/* Text written for each network */}
      {activeNetwork && (
        <div className="rounded-xl border border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-1 border-b border-gray-100 p-1.5" role="tablist" aria-label="Copy by network">
            {networks.map(([id]) => {
              const on = id === activeNetwork[0];
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setNetwork(id)}
                  className={`shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    on ? "bg-surface text-gray-900 shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {networkLabel(id)}
                </button>
              );
            })}
          </div>
          <div className="space-y-3 p-3" role="tabpanel">
            {Object.entries(activeNetwork[1]).map(([k, v]) => (
              <Field key={k} name={k} value={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
