"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { toUserMessage } from "@/utils/authErrors";
import AuthShell from "@/app/(components)/auth/AuthShell";
import AuthProviders from "@/app/(components)/auth/AuthProviders";
import Input from "@/app/(components)/ui/Input";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseCode, setLicenseCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Client-side validation.
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Pass licenseCode as 4th parameter (empty string if not provided).
      const result = await register(name, email, password, licenseCode);

      toast.success(
        result.message || "Check your email for the verification code!",
      );

      // Redirect to the verify-email page (email in URL). The sonner Toaster
      // lives in the root layout, so the toast survives this navigation.
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 900);
    } catch (err) {
      console.error("❌ register failed:", err);
      toast.error(toUserMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start creating with Creative Klux — free for 7 days."
    >
      {/* Social sign-up */}
      <AuthProviders
        label="or sign up with email"
        onGoogle={() => {}}
        onFacebook={() => {}}
      />

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-3.5">
        <Input
          id="name"
          label="Full name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          id="license"
          label="License code"
          optional
          type="text"
          placeholder="Enter your license code"
          value={licenseCode}
          onChange={(e) => setLicenseCode(e.target.value)}
          hint="Leave empty for a free trial account (7 days)."
        />

        <Input
          id="password"
          label="Password"
          password
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          id="confirmPassword"
          label="Confirm password"
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
              Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Login */}
      <p className="mt-5 text-center text-[13px] text-gray-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#1447e6] font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>

      {/* Footer */}
      <p className="mt-8 text-center text-[11px] text-gray-300">
        By creating an account you agree to our{" "}
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
