"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { toUserMessage } from "@/utils/authErrors";
import AuthShell from "@/app/(components)/auth/AuthShell";

export default function VerifyEmailPage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 60-second cooldown
  const inputRefs = useRef([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, sendVerificationCode, user } = useAuth();
  // Prefer the ?email= query (register flow); fall back to the logged-in user
  // so an already-signed-in-but-unverified user (redirected here on refresh)
  // still sees their address and can resend/verify.
  const email = searchParams.get("email") || user?.email || "";

  const code = digits.join("");

  // Input handlers
  const handleChange = (index, value) => {
    // Allow empty string or single alphanumeric character
    if (value === "" || /^[a-zA-Z0-9]$/.test(value)) {
      const newDigits = [...digits];
      newDigits[index] = value.toUpperCase(); // optional: force uppercase
      setDigits(newDigits);

      // Auto-focus next field
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pastedText = e.clipboardData.getData("text");

    // Keep only letters and numbers (remove spaces, symbols, etc.)
    const onlyAlphanumeric = pastedText.replace(/[^a-zA-Z0-9]/g, "");

    // Take first 6 characters
    const chars = onlyAlphanumeric.slice(0, 6).split("");

    // If we have at least one valid char → fill the inputs
    if (chars.length > 0) {
      // Pad with empty strings to always have 6 elements
      const padded = [...chars, "", "", "", "", "", ""].slice(0, 6);
      setDigits(padded);

      // Focus the last filled input (or the 6th one if full)
      const nextFocusIndex = Math.min(chars.length - 1, 5);
      setTimeout(() => inputRefs.current[nextFocusIndex]?.focus(), 0);
    }
  };

  // Verify Code
  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(code);
      // Already-logged-in users go straight to the app; fresh registrations
      // (no session yet) go to login to sign in.
      const destination = user ? "/" : "/login";
      toast.success("Email verified!", {
        description: user
          ? "Welcome! Redirecting…"
          : "Welcome! Redirecting to sign in…",
      });
      setTimeout(() => router.push(destination), 2000);
    } catch (err) {
      console.error("❌ verifyEmail failed:", err);
      toast.error(toUserMessage(err, "The code is incorrect or expired."));
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResend = async () => {
    if (!email || countdown > 0) return;

    setResendLoading(true);
    try {
      await sendVerificationCode(email); // This calls /verify-email with { email }

      toast.success("Code sent!", {
        description:
          "A new code has been sent to your email. Check spam/promotions if it’s not in your inbox.",
      });

      // Start 60-second cooldown
      setCountdown(60);
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
        toUserMessage(err, "Couldn’t send a new code. Please try again later."),
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Focus first input + warn if no email
  useEffect(() => {
    inputRefs.current[0]?.focus();
    if (!email) {
      toast.warning("No email address found. Please register again.");
    }
  }, [email]);

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to{" "}
          <span className="text-gray-600 font-medium break-all">
            {email || "your email"}
          </span>
          .
        </>
      }
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {/* 6 digit inputs */}
        <div
          className="flex justify-between gap-2 sm:gap-2.5"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              ref={(el) => (inputRefs.current[index] = el)}
              disabled={loading || resendLoading}
              className="w-full aspect-square min-w-0 text-center text-2xl font-bold uppercase rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition-all duration-150 focus:bg-surface focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10 disabled:opacity-60"
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className={`w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 border-none transition-all duration-200
            ${
              loading || code.length !== 6
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#1447e6] text-white cursor-pointer hover:bg-[#0f3bbf] active:scale-[0.98] shadow-[0_4px_14px_rgba(20,71,230,0.28)]"
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify email"
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
        <strong className="font-semibold">Junk</strong> folder — emails may take
        up to 2 minutes.
      </p>
    </AuthShell>
  );
}
