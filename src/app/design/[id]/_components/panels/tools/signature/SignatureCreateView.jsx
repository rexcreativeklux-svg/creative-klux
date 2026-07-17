"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import SignatureTabs from "./SignatureTabs";
import SignatureTextTab from "./SignatureTextTab";
import SignatureDrawTab from "./SignatureDrawTab";
import SignatureUploadTab from "./SignatureUploadTab";
import SaveSignatureToggle from "./SaveSignatureToggle";
import useSignatureDraft from "./useSignatureDraft";
import { insertSignature } from "./insertSignature";
import { strokesToTrimmedDataURL } from "./signatureDraw";

/**
 * SignatureCreateView — the Text · Draw · Upload creator. Builds a signature
 * from the active tab, drops it on the canvas via the shared insertSignature
 * rule, and (once the endpoint exists) persists it.
 *
 * Props: { insert, canSave, onSave, onDone }
 */
export default function SignatureCreateView({ insert, canSave, onSave, onDone }) {
  const [tab, setTab] = useState("text");
  const draft = useSignatureDraft();

  // Draw isn't built, so its draft is never ready and Add stays disabled there.
  const ready = draft.ready(tab);

  // Turn the active tab's draft into the { kind, ... } insertSignature expects.
  const buildSignature = () => {
    if (tab === "upload") {
      return { kind: "image", src: URL.createObjectURL(draft.file), file: draft.file };
    }
    if (tab === "draw") {
      return { kind: "image", src: strokesToTrimmedDataURL(draft.strokes) };
    }
    return {
      kind: "text",
      name: draft.name.trim(),
      fontFamily: draft.fontFamily,
      color: draft.color,
    };
  };

  const handleAdd = async () => {
    if (!ready) return;
    const sig = buildSignature();

    insertSignature(sig, insert);

    if (draft.save && canSave) {
      try {
        await onSave(sig);
      } catch (err) {
        toast.error(err?.message || "Couldn’t save the signature.");
      }
    }
    onDone();
  };

  return (
    <div className="p-3 flex flex-col gap-4">
      <SignatureTabs active={tab} onChange={setTab} />

      {tab === "text" && <SignatureTextTab draft={draft} />}
      {tab === "draw" && <SignatureDrawTab draft={draft} />}
      {tab === "upload" && <SignatureUploadTab draft={draft} />}

      <SaveSignatureToggle
        checked={canSave ? draft.save : false}
        onChange={draft.setSave}
        disabled={!canSave}
        disabledNote="Saving isn’t available yet — it’ll still be added to your design."
      />

      <button
        onClick={handleAdd}
        disabled={!ready}
        className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-default text-white text-sm font-semibold cursor-pointer transition"
      >
        Add signature
      </button>
    </div>
  );
}
