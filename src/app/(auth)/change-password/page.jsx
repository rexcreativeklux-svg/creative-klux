"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { toUserMessage } from "@/utils/authErrors";
import AuthShell from "@/app/(components)/auth/AuthShell";
import Input from "@/app/(components)/ui/Input";

export default function ChangePasswordPage() {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Usually reset tokens come from query params (?token=...&email=...)
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ email, token, password });
      toast.success(
        result.message || "Your password has been changed successfully.",
      );
      setPassword("");
      setConfirmPassword("");

      // redirect after a short beat so the toast is visible
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error("❌ resetPassword failed:", err);
      toast.error(
        toUserMessage(
          err,
          "Couldn’t reset your password. The link may have expired.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle={
        email ? (
          <>
            Choose a new password for{" "}
            <span className="text-gray-600 font-medium break-all">{email}</span>
            .
          </>
        ) : (
          "Choose a new password for your account."
        )
      }
    >
      <form onSubmit={handleChangePassword} className="space-y-3.5">
        <Input
          id="password"
          label="New password"
          password
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
              Updating…
            </>
          ) : (
            <>
              Update password <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

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
