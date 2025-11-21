"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCarousel from "../../components/AuthCarousel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-laravel-backend/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setSuccess("We’ve sent a password reset link to your email.");
      setEmail(""); // clear input
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen justify-center">
      {/* Left content (form card) */}
      <div className="flex-1 flex flex-col pt-30 items-center">
        <div className="flex flex-col space-y-8 justify-center items-center">
          <h1 className="text-5xl flex justify-center font-bold">Forgot Password?</h1>

          <p className="w-[370px] text-gray-600 flex justify-center items-center text-center">
            Enter your email and we’ll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-35 lg:w-[500px]">
          <form onSubmit={handleForgotPassword} className="space-y-10 relative w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full py-3 px-5 rounded-4xl outline-0 border border-gray-400 text-gray-900"
              required
            />

            {error && <p className="text-red-500 text-center">{error}</p>}
            {success && <p className="text-green-600 text-center">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full hover:cursor-pointer hover:bg-gray-200 hover:border hover:text-black py-3 bg-black rounded-4xl transition-all duration-300 text-white font-semibold"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-[#748b6f] font-semibold hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Right content (carousel) */}
      <div className="flex-1 flex p-10 h-full">
        <AuthCarousel />
      </div>
    </div>
  );
}
