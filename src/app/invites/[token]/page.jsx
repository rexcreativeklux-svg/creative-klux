/**
 * Public brand-invite page — /invites/{token}
 * ──────────────────────────────────────────────────────────────────────────────
 * A full, standalone page (NOT a dashboard modal) where anyone holding an invite
 * link can review its details before accepting:
 *
 *   • Loads the invite via the PUBLIC GET /brand-invite/{token}, so both
 *     signed-in and signed-out visitors see who invited them, to which brand,
 *     and in what role.
 *   • Signed in  → "Accept invite" calls POST /brand-invite/{token}/accept, then
 *     drops them on the dashboard already switched into the joined brand.
 *   • Signed out → "Accept invite" stashes the token (so it survives the whole
 *     login / register → verify → login detour) and sends them to sign in; once
 *     authenticated they're returned here to review and accept — no pop-up.
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
  ShieldCheck,
  UserPlus,
  LogIn,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  buildInvitePath,
  setPendingInvite,
  clearPendingInvite,
} from "@/utils/inviteUrl";

// ── helpers (kept local + defensive; invite payload shape isn't fully documented) ──
const cleanColor = (c) => {
  if (!c || typeof c !== "string") return "";
  return c.replace(/`/g, "").trim();
};

const getLogoSrc = (logo) => {
  if (!logo || typeof logo !== "string" || !logo.trim()) return null;
  if (logo.startsWith("http")) return logo;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = logo.startsWith("/") ? logo : "/" + logo;
  return cleanBase + cleanPath;
};

const titleCase = (s) =>
  typeof s === "string" && s.trim()
    ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1)
    : "";

// Pull the fields we render out of whatever the backend returns.
const normalizeInvite = (raw = {}) => {
  const brand = raw.brand || raw.brand_details || {};
  const inviter =
    raw.inviter || raw.invited_by || raw.sender || raw.created_by || {};
  return {
    brandName: brand.name || raw.brand_name || raw.name || "a brand",
    brandLogo: brand.logo || raw.brand_logo || raw.logo || null,
    brandDescription: brand.description || raw.brand_description || "",
    primary: cleanColor(brand.primary_color || raw.primary_color) || "#155dfc",
    secondary:
      cleanColor(brand.secondary_color || raw.secondary_color) || "#0ea5e9",
    role: (raw.role || raw.pivot?.role || "member").toLowerCase(),
    inviterName:
      inviter.name || raw.inviter_name || raw.invited_by_name || "A teammate",
    email: raw.email || raw.invitee_email || "",
  };
};

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token || "";

  const { user, token: authToken, loading, getBrandInvite, acceptBrandInvite } =
    useAuth();

  const [invite, setInvite] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [logoErr, setLogoErr] = useState(false);

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
  // done its job — clear it so a later, unrelated login doesn't get redirected.
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

  const handleMaybeLater = useCallback(() => {
    router.push(isAuthed ? "/" : "/login");
  }, [isAuthed, router]);

  // ── Shell ──
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center px-4 py-10 sm:py-16">
      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-8">
        <img src="/logoblue.svg" alt="Creative Klux" className="w-7 h-7" />
        <span className="text-lg font-bold text-gray-900">Creative Klux</span>
      </div>

      <div className="w-full max-w-md">
        {inviteLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-20 shadow-sm">
            <Loader2 className="h-7 w-7 animate-spin text-[#155dfc]" />
            <p className="text-sm text-gray-400">Loading your invite…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Invite unavailable
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">{error}</p>
            </div>
            <Link
              href={isAuthed ? "/" : "/login"}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#155dfc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {isAuthed ? "Go to dashboard" : "Go to sign in"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* Brand banner */}
            <div
              className="relative flex flex-col items-center px-6 pb-6 pt-8"
              style={{
                background: `linear-gradient(135deg, ${invite.primary} 0%, ${invite.secondary} 100%)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/80 bg-white shadow-lg">
                {getLogoSrc(invite.brandLogo) && !logoErr ? (
                  <img
                    src={getLogoSrc(invite.brandLogo)}
                    alt={invite.brandName}
                    className="h-full w-full object-contain"
                    onError={() => setLogoErr(true)}
                  />
                ) : (
                  <span
                    className="text-2xl font-black"
                    style={{ color: invite.primary }}
                  >
                    {invite.brandName?.[0]?.toUpperCase() || (
                      <Building2 className="h-6 w-6" />
                    )}
                  </span>
                )}
              </div>
              <span className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                <ShieldCheck className="h-3 w-3" />
                {titleCase(invite.role)} invite
              </span>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 px-6 py-7">
              <div className="text-center">
                <h1 className="text-xl font-bold leading-tight text-gray-900">
                  You've been invited to join{" "}
                  <span className="text-[#155dfc]">{invite.brandName}</span>
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">
                    {invite.inviterName}
                  </span>{" "}
                  invited you to collaborate as{" "}
                  <span className="font-semibold text-gray-700">
                    {titleCase(invite.role)}
                  </span>
                  .
                </p>
              </div>

              {invite.brandDescription && (
                <p className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-center text-sm leading-relaxed text-gray-500">
                  {invite.brandDescription}
                </p>
              )}

              {invite.email && (
                <p className="text-center text-xs text-gray-400">
                  Invitation sent to{" "}
                  <span className="font-medium text-gray-500">
                    {invite.email}
                  </span>
                </p>
              )}

              {/* CTA */}
              <div className="mt-1 flex flex-col gap-2.5">
                {loading ? (
                  <button
                    disabled
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-400"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking your session…
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#155dfc] text-sm font-semibold text-white shadow-[0_4px_14px_rgba(21,93,252,0.28)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Joining…
                        </>
                      ) : isAuthed ? (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Accept invite
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          Sign in to accept
                        </>
                      )}
                    </button>

                    {!isAuthed && (
                      <button
                        onClick={goRegister}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <UserPlus className="h-4 w-4 text-gray-400" />
                        Create an account
                      </button>
                    )}

                    <button
                      onClick={handleMaybeLater}
                      disabled={accepting}
                      className="mt-0.5 text-sm font-medium text-gray-400 transition hover:text-gray-600 disabled:opacity-60"
                    >
                      Maybe later
                    </button>
                  </>
                )}
              </div>

              {!isAuthed && !loading && (
                <p className="text-center text-[11px] leading-relaxed text-gray-400">
                  You'll come right back here to accept after signing in — your
                  invite is saved.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
