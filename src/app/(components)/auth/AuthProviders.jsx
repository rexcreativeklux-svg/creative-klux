/**
 * AuthProviders
 * ---------------------------------------------------------------------------
 * The social sign-in options shared by the login and register screens:
 * an "or …" divider followed by side-by-side Google + Facebook + TikTok
 * buttons. Designed to sit BELOW the email form, so the divider comes first.
 *
 * Only rendered on pages that support social auth (login / register). Handlers
 * are injected so each page controls what the buttons do — pages spread
 * useSocialAuth() straight in.
 *
 * @param {string}   [label]     Divider text (e.g. "or continue with").
 * @param {Function} [onGoogle]  Click handler for the Google button.
 * @param {Function} [onFacebook] Click handler for the Facebook button.
 * @param {Function} [onTiktok]  Click handler for the TikTok button.
 * @param {string}   [pending]   Provider currently signing in ("google" |
 *                               "facebook" | "tiktok"); disables all buttons.
 * @param {Object}   [emailStep] A first-time TikTok signup waiting for an
 *                               email ({ suggestedName }); opens the email step.
 * @param {Function} [submitEmail]     Completes that signup with the email.
 * @param {Function} [cancelEmailStep] Abandons it.
 */

import SocialEmailStep from "./SocialEmailStep";

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin shrink-0" />
);

const GoogleIcon = () => (
  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4.5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#010101">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export default function AuthProviders({
  label = "or continue with",
  onGoogle,
  onFacebook,
  onTiktok,
  pending = null,
  emailStep = null,
  submitEmail,
  cancelEmailStep,
}) {
  return (
    <div className="mt-6">
      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11.5px] font-medium text-gray-400">{label}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={onGoogle}
          disabled={!!pending}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 sm:gap-2 sm:px-3 border border-gray-200 rounded-xl bg-surface hover:bg-gray-50 hover:border-gray-300 text-[13px] font-medium text-gray-700 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending === "google" ? <Spinner /> : <GoogleIcon />} Google
        </button>
        <button
          type="button"
          onClick={onFacebook}
          disabled={!!pending}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 sm:gap-2 sm:px-3 border border-gray-200 rounded-xl bg-surface hover:bg-gray-50 hover:border-gray-300 text-[13px] font-medium text-gray-700 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending === "facebook" ? <Spinner /> : <FacebookIcon />} Facebook
        </button>
        <button
          type="button"
          onClick={onTiktok}
          disabled={!!pending}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 sm:gap-2 sm:px-3 border border-gray-200 rounded-xl bg-surface hover:bg-gray-50 hover:border-gray-300 text-[13px] font-medium text-gray-700 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending === "tiktok" ? <Spinner /> : <TikTokIcon />} TikTok
        </button>
      </div>

      {/* First-time TikTok signup: TikTok shares no email, so ask for one.
          Keyed on the pending token so a fresh attempt starts with an empty
          form. */}
      <SocialEmailStep
        key={emailStep?.pendingToken || "idle"}
        isOpen={!!emailStep}
        suggestedName={emailStep?.suggestedName}
        onSubmit={submitEmail}
        onClose={cancelEmailStep}
      />
    </div>
  );
}
