"use client";
// studio/forms/social/KindFields.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The fields that belong to ONE kind of social image, pulled out of the four
// forms SocialImageForm replaced. Everything the four had in common — brand,
// description, colour, logo, size, goal, audience, format, images — lives in the
// form itself; only what actually differed is here.
//
// ⚠️ THIS IS A SHORT FILE ON PURPOSE, and it is shorter than the old forms'
// labels suggest. Banner Type, Headline, Tagline, Video Title, Content Category,
// Emotion / Hook, Preferred Font and Additional Notes all LOOK like fields those
// forms had, and every one of them was commented out in the source before this
// merge. They were not carried over — reviving a field somebody switched off is
// a product decision, not a refactor. The commented blocks are still in git if
// any of them is wanted back.
//
// Each block takes the form's own `Field` / `inputCls` helpers rather than
// redefining them, so a kind's fields cannot drift out of step with the rest of
// the form they sit in.

import { CTA_OPTIONS, TONES } from "./socialSizes";

// Selected/unselected chip, in the emerald the Social Creative forms use.
const chipCls = (active) =>
  `px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
    active
      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
  }`;

/**
 * Post Tone — posts and memes. How the copy should sound.
 */
export const ToneField = ({ formData, field, Field }) => (
  <Field label="Post Tone">
    <div className="flex flex-wrap gap-2 py-1">
      {TONES.map((t) => (
        <button
          key={t.value}
          onClick={() => field("tone", t.value)}
          className={chipCls(formData.tone === t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  </Field>
);

/**
 * Call to Action — banners. Presets plus a free-text box, because the presets
 * are the common seven and a banner's CTA is frequently none of them.
 *
 * The input shows a value only when it ISN'T one of the presets: clicking
 * "Shop Now" should leave the box empty rather than mirroring the chip, so the
 * two controls read as one choice instead of two that happen to agree.
 */
export const CtaField = ({ formData, field, Field, inputCls }) => (
  <Field label="Call to Action (CTA)">
    <div className="flex gap-2 flex-wrap items-center">
      {CTA_OPTIONS.map((cta) => (
        <button
          key={cta}
          onClick={() => field("cta", cta)}
          className={chipCls(formData.cta === cta)}
        >
          {cta}
        </button>
      ))}
      <input
        type="text"
        value={!CTA_OPTIONS.includes(formData.cta) ? formData.cta || "" : ""}
        onChange={(e) => field("cta", e.target.value)}
        placeholder="Custom CTA…"
        className={`${inputCls} flex-1 min-w-32`}
      />
    </div>
  </Field>
);

/**
 * Visual Style — banners and thumbnails, with DIFFERENT option lists (a
 * thumbnail's "Bold & High Contrast" is not a banner's "Bold"). The list comes
 * from the kind, so this renders whichever set applies and nothing here needs to
 * know which kind it is drawing for.
 */
export const StyleField = ({ formData, field, Field, styles }) => (
  <Field label="Visual Style">
    <div className="flex flex-wrap gap-2 py-1">
      {styles.map((s) => (
        <button
          key={s.value}
          onClick={() => field("visualStyle", s.value)}
          className={chipCls(formData.visualStyle === s.value)}
        >
          {s.label}
        </button>
      ))}
    </div>
  </Field>
);
