"use client";

import React, { useEffect } from "react";
import { ensureEditorFontsLoaded } from "@/(lib)/design/fonts";
import FontDropdown from "../../shared/FontDropdown";
import SignaturePreview from "./SignaturePreview";
import SignatureColorPicker from "./SignatureColorPicker";
import { SIGNATURE_FONTS } from "./signatureFonts";

/** "'Great Vibes', cursive" → "Great Vibes". */
const familyName = (family) => family?.match(/'([^']+)'/)?.[1] || family;

/**
 * SignatureTextTab — type a name, choose a script font and ink colour. Draft
 * lives in the parent so switching tabs keeps it.
 *
 * Props: { draft } — the useSignatureDraft bag.
 */
export default function SignatureTextTab({ draft }) {
  const { name, setName, fontFamily, setFontFamily, color, setColor } = draft;

  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <SignaturePreview name={name} fontFamily={fontFamily} color={color} />

      <Field label="Full name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-blue-400"
        />
      </Field>

      <Field label="Font">
        <FontDropdown
          fonts={SIGNATURE_FONTS}
          onPick={setFontFamily}
          activeFamily={fontFamily}
          activeLabel={familyName(fontFamily)}
        />
      </Field>

      <Field label="Color">
        <SignatureColorPicker value={color} onChange={setColor} />
      </Field>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {children}
    </div>
  );
}
