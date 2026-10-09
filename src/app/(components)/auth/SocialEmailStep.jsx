"use client";

/**
 * SocialEmailStep
 * ---------------------------------------------------------------------------
 * The extra step a first-time TikTok sign-in needs: TikTok never shares an
 * email, and an account can't exist without one. Asks for the address, then
 * hands it to `onSubmit` (useSocialAuth's submitEmail), which completes the
 * signup against the parked pending token.
 *
 * `onSubmit` throws only for an error on the email itself (e.g. already
 * registered) — that is shown under the field so the user can correct it.
 *
 * @param {boolean}  isOpen
 * @param {string}   [suggestedName]  The TikTok display name, for the greeting.
 * @param {(email: string) => Promise<void>} onSubmit
 * @param {() => void} onClose
 */

import { useState } from "react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import Input from "@/app/(components)/ui/Input";

export default function SocialEmailStep({
  isOpen,
  suggestedName,
  onSubmit,
  onClose,
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(email.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="One last step"
      size="sm"
      dismissible={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[13px] leading-relaxed text-gray-500">
          {suggestedName ? `Welcome, ${suggestedName}! ` : ""}
          TikTok doesn&apos;t share your email address, so add the one you want
          on your Creative Klux account.
        </p>

        <Input
          id="social-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className={`w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 border-none transition-all duration-200
            ${
              submitting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#1447e6] text-white cursor-pointer hover:bg-[#0f3bbf] active:scale-[0.98]"
            }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
              Creating your account…
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </ResponsiveModal>
  );
}
