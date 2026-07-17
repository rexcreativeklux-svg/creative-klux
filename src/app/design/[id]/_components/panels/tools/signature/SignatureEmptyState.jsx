"use client";

import React from "react";
import { Signature } from "lucide-react";

/** Shown until the user has saved a signature — the only state today. */
export default function SignatureEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 px-3 text-center">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
        <Signature className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold text-gray-700">
        No signature added yet
      </p>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        Create one and it’ll be here whenever you need to sign a design.
      </p>
    </div>
  );
}
