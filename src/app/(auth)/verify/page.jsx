"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthCarousel from "../../components/AuthCarousel";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); // pre-fill email from register
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-laravel-backend/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      router.push("/login"); // redirect after success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen justify-center">
      {/* Left content (form card) */}
      <div className="flex-1 flex flex-col pt-35 items-center">
        <div className="flex flex-col space-y-8 justify-center items-center">
          <h1 className="text-5xl flex justify-center font-bold">Verify Your Email</h1>

          <p className="w-[370px] text-gray-600 flex justify-center items-center text-center">
            Enter the verification code we sent to <strong>{email}</strong>
          </p>
        </div>

        <div className="mt-40 lg:w-[500px]">
          <form onSubmit={handleVerify} className="space-y-10 relative w-full">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification Code"
              className="w-full py-3 px-5 rounded-4xl outline-0 border border-gray-400 text-gray-900"
              required
            />

            {error && <p className="text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full hover:cursor-pointer hover:bg-gray-200 hover:border hover:text-black py-3 bg-black rounded-4xl transition-all duration-300 text-white font-semibold"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Verify Email"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right content (carousel) */}
      <div className="flex-1 flex p-10 h-full">
        <AuthCarousel />
      </div>
    </div>
  );
}
