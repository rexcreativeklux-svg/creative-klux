"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getPendingInvite, buildInvitePath } from "@/utils/inviteUrl";

/**
 * Where to send someone right after they sign in. An optional relative
 * ?returnTo= wins (relative paths only, so a crafted link can't redirect
 * off-site), then a saved brand invite, then the home page.
 */
export function getPostAuthDestination() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  const pendingInvite = getPendingInvite();
  return pendingInvite ? buildInvitePath(pendingInvite) : "/";
}

/**
 * Click handlers for the Google / Facebook / TikTok buttons, shared by login
 * and register. `pending` is the provider currently in flight (or null) so the
 * buttons can disable themselves.
 *
 * TikTok never shares an email, so a first-time TikTok user comes back with
 * `needsEmail` instead of a session. `emailStep` then holds the parked signup
 * ({ pendingToken, suggestedName }) until `submitEmail` finishes it.
 */
export default function useSocialAuth() {
  const router = useRouter();
  const { socialLogin, completeSocialRegistration } = useAuth();
  const [pending, setPending] = useState(null);
  const [emailStep, setEmailStep] = useState(null);

  const done = (isNew) => {
    toast.success(isNew ? "Account created. Welcome!" : "Signed in successfully.");
    router.push(getPostAuthDestination());
  };

  const start = async (provider) => {
    if (pending) return;
    setPending(provider);
    try {
      const result = await socialLogin(provider);
      if (result.needsEmail) {
        setEmailStep({
          pendingToken: result.pendingToken,
          suggestedName: result.suggestedName,
        });
        return;
      }
      done(result.isNew);
    } catch (err) {
      if (!err.cancelled) toast.error(err.message);
    } finally {
      setPending(null);
    }
  };

  /**
   * Finish the parked signup with the typed email. Throws on an email
   * validation error so the form can show it under the field; an expired
   * token closes the step, since only a fresh sign-in can mint a new one.
   */
  const submitEmail = async (email) => {
    if (!emailStep) return;
    try {
      const { isNew } = await completeSocialRegistration({
        pendingToken: emailStep.pendingToken,
        email,
        name: emailStep.suggestedName,
      });
      setEmailStep(null);
      done(isNew);
    } catch (err) {
      if (err.field === "email") throw err;
      setEmailStep(null);
      toast.error(
        err.expired
          ? `${err.message} Please sign in with TikTok again.`
          : err.message,
      );
    }
  };

  return {
    pending,
    onGoogle: () => start("google"),
    onFacebook: () => start("facebook"),
    onTiktok: () => start("tiktok"),
    emailStep,
    submitEmail,
    cancelEmailStep: () => setEmailStep(null),
  };
}
