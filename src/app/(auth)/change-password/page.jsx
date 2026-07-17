"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { toUserMessage } from "@/utils/authErrors";
import AuthShell from "@/app/(components)/auth/AuthShell";
import Input from "@/app/(components)/ui/Input";
import CodeInput from "@/app/(components)/auth/CodeInput";

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;
const RESEND_COOLDOWN = 60; // seconds

/**
 * ChangePasswordPage — password reset, code-based (2 steps on one screen).
 * ---------------------------------------------------------------------------
 * Reached from /forgot-password after a reset code is emailed (the email rides
 * in `?email=`). Replaces the old emailed-link flow.
 *
 *   Step "code":     enter the 6-digit code → POST /password/verify-reset-code
 *   Step "password": set a new password     → POST /password/reset-password
 *
 * The verified email is the only thing the backend needs to tie the two calls
 * together, so it's held in component state across both steps — no token in the
 * URL. On success we send the user to /login to sign in with the new password.
 */
export default function ChangePasswordPage() {
  const { verifyResetCode, resetPassword, sendVerificationCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState("password"); // "code" | "password"

  // Step 1 — code entry
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [codeKey, setCodeKey] = useState(0); // bump to remount + refocus on error
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const code = digits.join("");

  // Step 2 — new password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Without an email we can't verify a code or reset — nudge the user back.
  useEffect(() => {
    if (!email) {
      toast.warning("No email found. Please start the reset again.");
    }
  }, [email]);

  // ── Step 1: verify the emailed code ──────────────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    try {
      await verifyResetCode({ email, code });
      toast.success("Code verified.", {
        description: "Now choose a new password.",
      });
      setStep("password");
    } catch (err) {
      console.error("❌ verifyResetCode failed:", err);
      toast.error(toUserMessage(err, "The code is incorrect or expired."));
      // Clear the boxes and refocus the first one for a quick retry.
      setDigits(Array(CODE_LENGTH).fill(""));
      setCodeKey((k) => k + 1);
    } finally {
      setVerifying(false);
    }
  };

  // Resend a fresh code (same endpoint as /forgot-password), with a cooldown.
  const handleResend = async () => {
    if (!email || countdown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      await sendVerificationCode(email);
      toast.success("Code sent!", {
        description:
          "A new code is on its way. Check spam/promotions if it’s not in your inbox.",
      });

      setCountdown(RESEND_COOLDOWN);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("❌ sendVerificationCode failed:", err);
      toast.error(
        toUserMessage(err, "Couldn’t send a new code. Please try again."),
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ── Step 2: set the new password ─────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setResetting(true);
    try {
      const result = await resetPassword({
        email,
        password,
        passwordConfirmation: confirmPassword,
      });
      toast.success(
        result.message || "Your password has been changed successfully.",
      );
      setPassword("");
      setConfirmPassword("");
      // Short beat so the toast is visible before we leave.
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error("❌ resetPassword failed:", err);
      toast.error(
        toUserMessage(err, "Couldn’t reset your password. Please try again."),
      );
      setResetting(false);
    }
  };

  const emailLabel = email ? (
    <span className="text-gray-600 font-medium break-all">{email}</span>
  ) : (
    "your email"
  );

  return (
    <AuthShell
      title={step === "code" ? "Enter your reset code" : "Set a new password"}
      subtitle={
        step === "code" ? (
          <>Enter the 6-digit code we sent to {emailLabel}.</>
        ) : (
          <>Choose a new password for {emailLabel}.</>
        )
      }
    >
      {step === "code" ? (
        <>
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <CodeInput
              key={codeKey}
              value={digits}
              onChange={setDigits}
              length={CODE_LENGTH}
              disabled={verifying || !email}
            />

            <button
              type="submit"
              disabled={verifying || code.length !== CODE_LENGTH || !email}
              className={`w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 border-none transition-all duration-200
                ${
                  verifying || code.length !== CODE_LENGTH || !email
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#1447e6] text-white cursor-pointer hover:bg-[#0f3bbf] active:scale-[0.98] shadow-[0_4px_14px_rgba(20,71,230,0.28)]"
                }`}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Verify code <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[13px]">
            <span className="text-gray-400">Didn’t receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || countdown > 0 || !email}
              className={`font-semibold transition-colors bg-transparent border-none p-0 ${
                resendLoading || countdown > 0 || !email
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#1447e6] hover:underline cursor-pointer"
              }`}
            >
              {resendLoading
                ? "Sending…"
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend code"}
            </button>
          </div>

          {/* Spam hint */}
          <p className="mt-6 text-center text-[11px] text-gray-300 leading-relaxed">
            Check your <strong className="font-semibold">Spam</strong>,{" "}
            <strong className="font-semibold">Promotions</strong>, or{" "}
            <strong className="font-semibold">Junk</strong> folder — emails may
            take up to 2 minutes.
          </p>
        </>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <Input
            id="password"
            label="New password"
            password
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            required
          />

          <Input
            id="confirmPassword"
            label="Confirm new password"
            password
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={resetting}
            className={`w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 border-none transition-all duration-200 mt-1
              ${
                resetting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#1447e6] text-white cursor-pointer hover:bg-[#0f3bbf] active:scale-[0.98] shadow-[0_4px_14px_rgba(20,71,230,0.28)]"
              }`}
          >
            {resetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                Update password <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Back to login */}
      <p className="mt-5 text-center text-[13px] text-gray-400">
        <Link
          href="/login"
          className="text-[#1447e6] font-semibold hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
