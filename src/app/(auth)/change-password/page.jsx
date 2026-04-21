"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Usually reset tokens come from query params (?token=...&email=...)
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-laravel-backend/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setSuccess("Your password has been changed successfully.");
      setPassword("");
      setConfirmPassword("");

      // redirect after 2s
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-10 bg-white border space-y-14 border-gray-200 rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-4">Change Password</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password for <strong>{email}</strong>
        </p>

        <form onSubmit={handleChangePassword} className="space-y-8">
          <input
            type="password"
            placeholder="New Password"
            className="w-full py-3 px-5 rounded-4xl outline-0 border border-gray-400 text-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full py-3 px-5 rounded-4xl outline-0 border border-gray-400 text-gray-900"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Update Password"
            )}
          </button>
        </form>

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
  );
}
