"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { toUserMessage } from "@/utils/authErrors";
import AuthShell from "@/app/(components)/auth/AuthShell";
import Input from "@/app/(components)/ui/Input";

export default function ForgotPasswordPage() {
  const { sendVerificationCode } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await sendVerificationCode(email);
      toast.success(result.message || "Check your email for the reset link.");
      setEmail(""); // clear input
    } catch (err) {
      console.error("❌ sendVerificationCode failed:", err);
      toast.error(
        toUserMessage(err, "Couldn’t send the reset link. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we’ll send you a link to reset your password."
    >
      <form onSubmit={handleForgotPassword} className="space-y-3.5">
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
              Sending…
            </>
          ) : (
            <>
              Send reset link <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Back to login */}
      <p className="mt-5 text-center text-[13px] text-gray-400">
        Remembered your password?{" "}
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
