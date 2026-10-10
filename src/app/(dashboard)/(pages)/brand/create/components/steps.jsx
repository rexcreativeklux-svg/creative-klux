"use client";

/**
 * The reusable step bodies for the brand-create flow:
 *  - `BrandDetailsStep` : name, tagline, description, industry, font, logo, colors
 *
 * All state lives in the parent page; these components are controlled via props.
 */

import { Star, Loader2, Upload } from "lucide-react";
import { Field, ColorPicker, inputCls } from "./ui";
import { INDUSTRIES, FONTS } from "./constants";

/**
 * Step 1 — brand identity. `set(key, value)` updates a single formData field.
 * Logo handling is owned by the parent (`onLogoChange` uploads to the gallery
 * and stores the hosted URL); `logoUploading` drives the button's busy state.
 */
export const BrandDetailsStep = ({
  formData,
  set,
  logoRef,
  logoUploading,
  onLogoChange,
}) => (
  <>
    <h3 className="font-bold text-gray-900 flex items-center gap-2">
      <Star className="w-4 h-4 text-blue-600" /> Brand Details
    </h3>

    <Field label="Brand Name" required>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="e.g. Acme Corp"
        className={inputCls}
      />
    </Field>

    <Field label="Tagline / Slogan">
      <input
        type="text"
        value={formData.tagline}
        onChange={(e) => set("tagline", e.target.value)}
        placeholder="e.g. Just do it"
        className={inputCls}
      />
    </Field>

    <Field label="Description">
      <textarea
        value={formData.description}
        onChange={(e) => set("description", e.target.value)}
        rows={3}
        placeholder="Brief brand description…"
        className={`${inputCls} resize-none`}
      />
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Industry" required>
        <select
          value={formData.industry}
          onChange={(e) => set("industry", e.target.value)}
          className={inputCls}
        >
          <option value="">Select industry…</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Font">
        <select
          value={formData.fonts}
          onChange={(e) => set("fonts", e.target.value)}
          className={inputCls}
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
    </div>

    <Field label="Logo">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => logoRef.current?.click()}
          disabled={logoUploading}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition cursor-pointer bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {logoUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />{" "}
              {formData.logo ? "Replace Logo" : "Upload Logo"}
            </>
          )}
        </button>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          ref={logoRef}
          onChange={onLogoChange}
        />
        {formData.logoDataUrl && (
          <div className="relative w-10 h-10 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <img
              src={formData.logoDataUrl}
              alt="logo"
              className="w-full h-full object-contain"
            />
            {logoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </Field>

    <div className="flex gap-4">
      <ColorPicker
        label="Primary Color"
        value={formData.primary}
        onChange={(v) => set("primary", v)}
      />
      <ColorPicker
        label="Secondary Color"
        value={formData.secondary}
        onChange={(v) => set("secondary", v)}
      />
    </div>
  </>
);

