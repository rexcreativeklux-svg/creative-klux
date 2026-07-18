/**
 * Public brand-invite page — /invites/{token}
 * ──────────────────────────────────────────────────────────────────────────────
 * A full, standalone page (NOT a dashboard modal) where anyone holding an invite
 * link can review its details before accepting:
 *
 *   • Loads the invite via the PUBLIC GET /brand-invite/{token}, so both
 *     signed-in and signed-out visitors see who invited them, to which brand,
 *     in what role, and when it expires.
 *   • Signed in  → "Accept invitation" calls POST /brand-invite/{token}/accept,
 *     then drops them on the dashboard already switched into the joined brand.
 *   • Signed out → "Sign in to accept" stashes the token (so it survives the
 *     login / register → verify → login detour) and sends them to sign in; once
 *     authenticated they're returned here to review and accept — no pop-up.
 *   • "Not you?" (signed in) signs out and routes to login, keeping the invite.
 *
 * This route lives OUTSIDE the (dashboard) group on purpose, so the active-brand
 * selection gate (ModalPage) never covers the invite review.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Mail,
  Calendar,
  LogOut,
  UserPlus,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  buildInvitePath,
  setPendingInvite,
  clearPendingInvite,
} from "@/utils/inviteUrl";

// ── helpers (defensive — invite payload shape isn't fully documented) ──
const titleCase = (s) =>
  typeof s === "string" && s.trim()
    ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1)
    : "";

const formatExpiry = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return typeof v === "string" ? v : "";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Pull the fields we render out of the invite payload. Shape (confirmed):
//   { brand: { id, name, logo }, invited_by: { id, name, email },
//     role, type, expires_at }
// Light fallbacks stay in case the backend key names ever shift.
const normalizeInvite = (raw = {}) => {
  const brand = raw.brand || raw.brand_details || {};
  const inviter = raw.invited_by || raw.inviter || {};
  return {
    brandName: brand.name || raw.brand_name || "a brand",
    brandLogo: brand.logo || null,
    role: (raw.role || "member").toLowerCase(),
    invitedBy: inviter.name || inviter.email || "A teammate",
    inviterEmail: inviter.email || "",
    expiresAt: raw.expires_at ?? raw.expiresAt ?? null,
  };
};

// ── One detail row (icon · label/value(+sub) · optional trailing slot) ──
function DetailRow({ Icon, label, value, sub, trailing }) {
  return (
    <div className="flex items-center gap-3.5">
      <Icon className="h-5 w-5 shrink-0 text-white/35" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/40">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
        {sub && <p className="truncate text-xs text-white/40">{sub}</p>}
      </div>
      {trailing}
    </div>
  );
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token || "";

  const {
    user,
    token: authToken,
    loading,
    logout,
    getBrandInvite,
    acceptBrandInvite,
  } = useAuth();

  const [invite, setInvite] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const isAuthed = !!user || !!authToken;

  // ── Load invite details (public) ──
  useEffect(() => {
    if (!token) {
      setError("This invite link is invalid.");
      setInviteLoading(false);
      return;
    }
    let alive = true;
    const load = async () => {
      setInviteLoading(true);
      setError(null);
      const res = await getBrandInvite(token);
      if (!alive) return;
      if (res.ok) {
        console.log(res.date)
        setInvite(normalizeInvite(res.data));
      } else {
        setError(
          res.message ||
            "This invite couldn't be loaded. It may have expired or been revoked.",
        );
      }
      setInviteLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [token, getBrandInvite]);

  // Once the visitor is here AND authenticated, the pending-invite fallback has
  // done its job — clear it so a later, unrelated login isn't redirected here.
  useEffect(() => {
    if (!loading && isAuthed) clearPendingInvite();
  }, [loading, isAuthed]);

  // ── Actions ──
  const goSignIn = useCallback(() => {
    setPendingInvite(token);
    router.push(`/login?returnTo=${encodeURIComponent(buildInvitePath(token))}`);
  }, [token, router]);

  const goRegister = useCallback(() => {
    setPendingInvite(token);
    router.push(
      `/register?returnTo=${encodeURIComponent(buildInvitePath(token))}`,
    );
  }, [token, router]);

  const handleAccept = useCallback(async () => {
    // Not signed in → send them through auth first, keeping the invite.
    if (!isAuthed) {
      goSignIn();
      return;
    }

    setAccepting(true);
    const res = await acceptBrandInvite(token);
    setAccepting(false);

    if (res.ok) {
      clearPendingInvite();
      toast.success(res.message || "You've joined the brand!");
      router.push("/");
      return;
    }

    // Session expired mid-review → treat as signed-out and route to login.
    if (res.status === 401) {
      toast.error(res.message || "Please sign in to accept this invite.");
      goSignIn();
      return;
    }

    toast.error(res.message || "Couldn't accept the invite. Please try again.");
  }, [isAuthed, token, acceptBrandInvite, goSignIn, router]);

  // "Not you?" — sign out but keep the invite, then go sign in as someone else.
  const handleNotYou = useCallback(async () => {
    setPendingInvite(token);
    await logout();
    router.push(`/login?returnTo=${encodeURIComponent(buildInvitePath(token))}`);
  }, [token, logout, router]);

  const expiryLabel = invite ? formatExpiry(invite.expiresAt) : "";

  // ── Shell ──
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0b] px-4 py-10">
      <div className="w-full max-w-md">
        {inviteLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#161618] py-20">
            <Loader2 className="h-7 w-7 animate-spin text-[#3b82f6]" />
            <p className="text-sm text-white/40">Loading your invite…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#161618] px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Invite unavailable
              </h1>
              <p className="mt-1.5 text-sm text-white/50">{error}</p>
            </div>
            <Link
              href={isAuthed ? "/" : "/login"}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              {isAuthed ? "Go to dashboard" : "Go to sign in"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#161618] p-7 sm:p-8">
            {/* Brand mark (ours) */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <img src="/logoblue.svg" alt="Creative Klux" className="h-8 w-8" />
              <span className="text-xl font-semibold text-white">
                Creative Klux
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-[#3b82f6]">
              You&apos;re invited!
            </h1>
            <p className="mt-2 text-center text-sm text-white/50">
              Join {invite.brandName} and start collaborating
            </p>

            {/* Details */}
            <div className="mt-7 flex flex-col gap-5">
              <DetailRow
                Icon={Building2}
                label="Brand"
                value={invite.brandName}
              />
              <DetailRow
                Icon={Mail}
                label="Invited by"
                value={invite.invitedBy}
                sub={
                  invite.inviterEmail && invite.inviterEmail !== invite.invitedBy
                    ? invite.inviterEmail
                    : null
                }
                trailing={
                  <span className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
                    {titleCase(invite.role)}
                  </span>
                }
              />
              {expiryLabel && (
                <DetailRow
                  Icon={Calendar}
                  label="Expires"
                  value={expiryLabel}
                />
              )}
            </div>

            {/* CTA */}
            <div className="mt-7 flex flex-col gap-2.5">
              {loading ? (
                <button
                  disabled
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/5 text-sm font-semibold text-white/40"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking your session…
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining…
                      </>
                    ) : isAuthed ? (
                      "Accept invitation"
                    ) : (
                      "Sign in to accept"
                    )}
                  </button>

                  {!isAuthed && (
                    <button
                      onClick={goRegister}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent text-sm font-semibold text-white/80 transition hover:bg-white/5"
                    >
                      <UserPlus className="h-4 w-4 text-white/50" />
                      Create an account
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Signed-in-as / footer */}
            {!loading && isAuthed && user?.email && (
              <p className="mt-4 text-center text-xs text-white/45">
                Signed in as{" "}
                <span className="font-medium text-white/70">{user.email}</span>.{" "}
                <button
                  onClick={handleNotYou}
                  disabled={accepting}
                  className="inline-flex items-center gap-1 font-semibold text-[#3b82f6] transition hover:underline disabled:opacity-60"
                >
                  <LogOut className="h-3 w-3" />
                  Not you?
                </button>
              </p>
            )}

            {!loading && !isAuthed && (
              <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
                You&apos;ll come right back here to accept after signing in —
                your invite is saved.
              </p>
            )}

            <p className="mt-5 border-t border-white/5 pt-4 text-center text-xs text-white/35">
              If you didn&apos;t expect this invitation, you can safely ignore it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
