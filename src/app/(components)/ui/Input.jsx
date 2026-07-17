"use client";

/**
 * Input — shared, styled text input for forms across the app.
 * ---------------------------------------------------------------------------
 * A single, consistent field used by the auth screens (and reusable anywhere).
 * Handles the common concerns so pages don't repeat markup:
 *   • label (+ optional "(optional)" badge, + optional right-aligned action)
 *   • password mode: renders a show/hide eye toggle and manages its own state
 *   • inline error message and/or a muted hint line
 *
 * All native <input> attributes (value, onChange, placeholder, required, type,
 * name, autoComplete, inputMode, …) are forwarded via `...rest`.
 *
 * @example
 *   <Input label="Email address" type="email" value={email}
 *          onChange={(e) => setEmail(e.target.value)} required />
 *
 *   <Input label="Password" password value={password} error={pwError}
 *          onChange={(e) => setPassword(e.target.value)} required
 *          rightLabel={<Link href="/forgot-password">Forgot password?</Link>} />
 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  label,
  password = false,
  optional = false,
  hint,
  error,
  rightLabel,
  id,
  className = "",
  ...rest
}) {
  const [show, setShow] = useState(false);

  // `password` mode drives the type and overrides any caller-supplied `type`.
  const { type: callerType, ...inputProps } = rest;
  const inputType = password ? (show ? "text" : "password") : callerType || "text";

  return (
    <div>
      {(label || rightLabel) && (
        <div
          className={`flex items-center mb-1.5 ${
            rightLabel ? "justify-between" : ""
          }`}
        >
          {label && (
            <label
              htmlFor={id}
              className="text-[12px] font-medium text-gray-500"
            >
              {label}
              {optional && (
                <span className="ml-1 text-gray-300 font-normal">(optional)</span>
              )}
            </label>
          )}
          {rightLabel}
        </div>
      )}

      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`w-full h-11 px-4 ${
            password ? "pr-11" : ""
          } rounded-xl border border-gray-200 bg-gray-50 text-[13.5px] text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:bg-surface focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10 ${className}`}
          {...inputProps}
        />

        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 bg-transparent border-none cursor-pointer p-0 transition-colors"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error && <p className="text-[11.5px] text-red-500 mt-1.5">{error}</p>}
      {hint && !error && (
        <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">{hint}</p>
      )}
    </div>
  );
}
