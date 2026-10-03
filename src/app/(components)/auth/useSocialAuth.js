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
 * Click handlers for the Google / Facebook buttons, shared by login and
 * register. `pending` is the provider currently in flight (or null) so the
 * buttons can disable themselves.
 */
export default function useSocialAuth() {
  const router = useRouter();
  const { socialLogin } = useAuth();
  const [pending, setPending] = useState(null);

  const start = async (provider) => {
    if (pending) return;
    setPending(provider);
    try {
      const { isNew } = await socialLogin(provider);
      toast.success(isNew ? "Account created. Welcome!" : "Signed in successfully.");
      router.push(getPostAuthDestination());
    } catch (err) {
      if (!err.cancelled) toast.error(err.message);
    } finally {
      setPending(null);
    }
  };

  return {
    pending,
    onGoogle: () => start("google"),
    onFacebook: () => start("facebook"),
  };
}
