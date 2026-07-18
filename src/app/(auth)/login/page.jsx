"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { toUserMessage } from "@/utils/authErrors";
import { getPendingInvite, buildInvitePath } from "@/utils/inviteUrl";
import AuthShell from "@/app/(components)/auth/AuthShell";
import AuthProviders from "@/app/(components)/auth/AuthProviders";
import Input from "@/app/(components)/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const msg = await login(email, password);
      toast.success(msg || "Signed in successfully.");
      // Optional ?returnTo= — used by flows that send guests here and bring
      // them back (e.g. the product-studio pending save, or a brand invite).
      // Relative paths only, so a crafted link can't redirect off-site.
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      const validReturn =
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : null;
      // A saved brand invite (from an /invites/{token} detour) wins over the
      // default home, so a guest who had to sign up first lands back on their
      // invite — even if `returnTo` was dropped along register → verify → login.
      const pendingInvite = getPendingInvite();
      const safeReturn =
        validReturn || (pendingInvite ? buildInvitePath(pendingInvite) : "/");
      setTimeout(() => router.push(safeReturn), 1500);
    } catch (err) {
      console.error("❌ login failed:", err);
      toast.error(
        toUserMessage(
          err,
          "Couldn’t sign you in. Please check your email and password.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Creative Klux account."
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="password"
          label="Password"
          password
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          rightLabel={
            <Link
              href="/forgot-password"
              className="text-[11.5px] text-[#1447e6] font-medium hover:underline no-underline"
            >
              Forgot password?
            </Link>
          }
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 border-none transition-all duration-200 mt-1
            ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#1447e6] text-white cursor-pointer hover:bg-[#0f3bbf] active:scale-[0.98] shadow-[0_4px_14px_rgba(20,71,230,0.28)]"
            }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Social sign-in */}
      <AuthProviders
        label="or continue with"
        onGoogle={() => {}}
        onFacebook={() => {}}
      />

      {/* Register */}
      <p className="mt-5 text-center text-[13px] text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[#1447e6] font-semibold hover:underline"
        >
          Create one free
        </Link>
      </p>

      {/* Footer */}
      <p className="mt-8 text-center text-[11px] text-gray-300">
        By signing in you agree to our{" "}
        <Link
          href="/terms"
          className="text-gray-400 underline hover:text-gray-600"
        >
          Terms
        </Link>
        {" & "}
        <Link
          href="/privacy"
          className="text-gray-400 underline hover:text-gray-600"
        >
          Privacy Policy
        </Link>
      </p>
    </AuthShell>
  );
}
