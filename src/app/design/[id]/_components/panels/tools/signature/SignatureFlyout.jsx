"use client";

import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import ToolFlyout from "../ToolFlyout";
import SignatureEmptyState from "./SignatureEmptyState";
import SignatureTile from "./SignatureTile";
import SignatureCreateView from "./SignatureCreateView";
import useSignatures from "./useSignatures";
import { insertSignature } from "./insertSignature";

/**
 * SignatureFlyout — Tools › Signature. Two views: the saved-signature list, and
 * the Create flow (Text · Draw · Upload). "Create new signature" opens Create;
 * its header back arrow returns to the list.
 *
 * There's no endpoint yet, so useSignatures returns an empty list and can't
 * persist — created signatures still drop on the canvas, they're just not
 * remembered. When the endpoint lands only useSignatures changes.
 *
 * Props: { insert, onClose }
 */
export default function SignatureFlyout({ insert, onClose }) {
  const { signatures, loading, canSave, save } = useSignatures();
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <ToolFlyout
        title="Create signature"
        width="w-72"
        onClose={onClose}
        onBack={() => setCreating(false)}
      >
        <SignatureCreateView
          insert={insert}
          canSave={canSave}
          onSave={save}
          onDone={() => setCreating(false)}
        />
      </ToolFlyout>
    );
  }

  return (
    <ToolFlyout title="Your signatures" width="w-60" onClose={onClose}>
      <div className="p-3 flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : signatures.length ? (
          <div className="flex flex-col gap-2">
            {signatures.map((sig) => (
              <SignatureTile
                key={sig.id}
                signature={sig}
                onPick={() => insertSignature(sig, insert)}
              />
            ))}
          </div>
        ) : (
          <SignatureEmptyState />
        )}

        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition"
        >
          <Plus className="w-4 h-4" /> Create new signature
        </button>
      </div>
    </ToolFlyout>
  );
}
