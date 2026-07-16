"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthCarousel from "../../(components)/AuthCarousel";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/app/(components)/NotificationModal";

export default function VerifyEmailPage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 60-second cooldown
  const inputRefs = useRef([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, resendVerificationCode, user } = useAuth();
  // Prefer the ?email= query (register flow); fall back to the logged-in user
  // so an already-signed-in-but-unverified user (redirected here on refresh)
  // still sees their address and can resend/verify.
  const email = searchParams.get("email") || user?.email || "";

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    duration: 4000,
  });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));
  const showNotification = (type, title, message, duration = 4000) => {
    setModal({ isOpen: true, type, title, message, duration });
  };

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
      showNotification("error", "Invalid Code", "Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(code);
      // Already-logged-in users go straight to the app; fresh registrations
      // (no session yet) go to login to sign in.
      const destination = user ? "/" : "/login";
      showNotification(
        "success",
        "Email Verified!",
        user ? "Welcome! Redirecting…" : "Welcome! Redirecting to login...",
        3000,
      );
      setTimeout(() => router.push(destination), 3000);
    } catch (err) {
      showNotification("error", "Invalid Code", err.message || "The code is incorrect or expired.", 5000);
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
      await resendVerificationCode(email); // This calls /verify-email with { email }

      showNotification(
        "success",
        "Code Sent!",
        "A new code has been sent to your email. Check spam/promotions if not in inbox.",
        1000
      );

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
      showNotification("error", "Resend Failed", err.message || "Could not send new code. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  // Focus first input + warn if no email
  useEffect(() => {
    inputRefs.current[0]?.focus();
    if (!email) {
      showNotification("warning", "Missing Email", "No email address found. Please register again.");
    }
  }, [email]);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen justify-center">
        {/* Left: Form */}
        <div className="flex-1 flex flex-col pt-35 items-center">
          <div className="flex flex-col space-y-8 justify-center items-center">
            <h1 className="text-5xl font-bold text-center">Verify Your Email</h1>

            <p className="w-92.5 text-gray-600 text-center leading-relaxed">
              Enter the verification code we sent to <br />
              <strong className="text-blue-600 break-all">{email || "..."}</strong>
            </p>
          </div>

          <div className="mt-40 lg:w-125 w-full px-6">
            <form onSubmit={handleVerify} className="space-y-10 relative w-full">
              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-3 md:gap-4" onPaste={handlePaste}>
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
                    className="w-12 uppercase h-14 md:w-14 md:h-16 text-center text-3xl font-bold tracking-widest rounded-2xl border-2 border-gray-400 focus:border-black outline-none transition-all duration-200 bg-gray-50 text-gray-900"
                    disabled={loading || resendLoading}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full cursor-pointer py-4 bg-black rounded-3xl text-white font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="text-center flex flex-row mt-4 justify-center items-center gap-2 pt-8">
              <p className="text-sm text-gray-600">
                Didn’t receive the code?
              </p>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || countdown > 0 || !email}
                className={`font-semibold cursor-pointer text-sm transition-all ${resendLoading || countdown > 0 || !email
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-800 underline"
                  }`}
              >
                {resendLoading
                  ? "Sending..."
                  : countdown > 0
                    ? `Resend in ${countdown}s`
                    : "Resend Code"}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 mt-6 max-w-xs mx-auto leading-relaxed">
                Check your <strong>Spam</strong>, <strong>Promotions</strong>, or <strong>Junk</strong> folder.<br />
                Emails may take up to 2 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Carousel */}
        <div className="hidden lg:flex flex-1 p-10 h-full">
          <AuthCarousel />
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        duration={modal.duration}
      />
    </>
  );
}