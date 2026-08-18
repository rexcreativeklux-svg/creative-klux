"use client";

/**
 * InviteCreditsModal — "Earn bonus credits" from the workspace panel's footer.
 *
 * TWO VIEWS IN ONE DIALOG: the invite panel, and the terms behind its
 * "Terms & Conditions" link. They are one modal because the terms are a
 * DIGRESSION from the offer, not a destination — the user reads them and comes
 * back, which is what the "← Back" is for. Opening a second dialog on top would
 * give them two ✕ buttons and lose their place.
 *
 * ⚠️ THE REWARD NUMBERS LIVE IN ONE PLACE (`REWARDS` below) and are read into
 * both views. The offer says 100 credits, the terms say 100 credits, and the
 * "how it works" list says 100 credits — three places for the same promise is
 * how a referral programme ends up contradicting itself in writing.
 *
 * ⚠️ UI ONLY. The referral code is derived from the signed-in user so the link
 * is stable for them, but nothing here creates a referral: the backend owns the
 * programme, and "Your Referrals (0)" is a placeholder, not a fetched count.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */

import { useState } from "react";
import { Gift, Share2, Copy, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import ModalCloseButton from "@/app/(components)/ui/ModalCloseButton";
import { useAuth } from "@/context/AuthContext";

/** The programme's numbers. Change them here and every line below follows. */
const REWARDS = {
  friendSignup: 30,
  copilotCreated: 30,
  upgrade: 100,
};

/**
 * A referral code that is the same every time this user opens the dialog.
 *
 * ⚠️ Derived, not generated: a random code would change on every render and the
 * link the user copied a minute ago would stop matching the one on screen. The
 * backend will mint the real one.
 */
const referralCode = (user) =>
  (user?.id ?? user?.username ?? "guest")
    .toString()
    .replace(/\W/g, "")
    .slice(0, 6)
    .toUpperCase() || "GUEST";

export default function InviteCreditsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [view, setView] = useState("invite");
  const [copied, setCopied] = useState(false);

  const code = referralCode(user);
  // ⚠️ Read during render rather than in an effect or a state initialiser. The
  // body only renders once the dialog is OPEN, which only happens on a click —
  // so the server never renders this input and there is no hydration pair to
  // mismatch. `origin` keeps the link right on localhost, staging and prod
  // without a hardcoded domain to go stale.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${origin}/register?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied");
  };

  // Reset to the offer whenever the dialog is dismissed, so reopening it does
  // not drop the user back into the terms they finished reading last time.
  const close = () => {
    onClose();
    setView("invite");
    setCopied(false);
  };

  const STEPS = [
    { icon: Share2, text: "Share your unique invite link with friends" },
    {
      icon: Gift,
      text: `They get ${REWARDS.friendSignup} free credits when they sign up`,
    },
    {
      icon: Gift,
      text: `You earn ${REWARDS.copilotCreated} credits when they create a copilot`,
    },
    {
      icon: Gift,
      text: `You earn ${REWARDS.upgrade} credits when they upgrade to a paid plan`,
    },
  ];

  // ── Terms ─────────────────────────────────────────────────────
  if (view === "terms") {
    return (
      <ResponsiveModal
        isOpen={isOpen}
        onClose={close}
        title="Terms & Conditions"
        size="xl"
      >
        <div className="flex flex-col gap-6 text-[13px] leading-relaxed text-gray-500">
          <section>
            <h3 className="text-sm font-semibold text-gray-900">Eligibility</h3>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>
                Bonus credits apply only to brand-new users who sign up with your
                link.
              </li>
              <li>
                Share your link only with people you know. Spam or public posting
                may disqualify you.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900">Credits</h3>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>
                You earn {REWARDS.upgrade} credits when an invited friend upgrades
                to a paid plan.
              </li>
              <li>
                Your friend gets {REWARDS.friendSignup} bonus credits when they
                sign up with your link.
              </li>
              <li>
                You can earn rewards for every friend you invite — there&apos;s no
                limit.
              </li>
              <li>
                Credits have no cash value and cannot be transferred or redeemed
                for money.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900">Restrictions</h3>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>
                Rewards are void if obtained through fraud, fake accounts, or
                abuse.
              </li>
              <li>
                Credits are tied to your account and expire per the
                programme&apos;s credit-expiry policy.
              </li>
            </ul>
          </section>

          <p>
            By participating, you agree to these terms. Creative Klux may modify
            or end the programme at any time.
          </p>

          <button
            onClick={() => setView("invite")}
            className="flex items-center gap-2 self-start text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </ResponsiveModal>
    );
  }

  // ── Invite ────────────────────────────────────────────────────
  // hideHeader + p-0: the coloured panel runs the full height of the dialog,
  // including where a header would be, so the ✕ is drawn over the content
  // instead.
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={close}
      hideHeader
      size="3xl"
      bodyClassName="p-0! md:p-0!"
    >
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.4fr]">
        <ModalCloseButton onClick={close} className="absolute right-3 top-3 z-10" />

        {/* The panel is decoration, so it is hidden from assistive tech and
            dropped below `md`, where the dialog is a sheet and the height it
            would eat is the height the offer needs. */}
        <div
          aria-hidden="true"
          className="hidden items-center justify-center bg-blue-600 p-10 md:flex"
        >
          <Gift className="h-28 w-28 text-gray-900" strokeWidth={1.5} />
        </div>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Invite Friends &amp; Earn Credits
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Share your link and earn {REWARDS.upgrade} credits when a friend
            upgrades to a paid plan
          </p>

          <div className="mt-5 flex items-center gap-2">
            {/* readOnly, not disabled: the user can still select the text by
                hand, which is the fallback when a clipboard write is blocked. */}
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              aria-label="Your invite link"
              className="min-w-0 flex-1 truncate rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:outline-none"
            />
            <button
              onClick={copy}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            How it Works
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {STEPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span className="text-[13px] leading-snug text-gray-500">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* A count of zero, stated plainly. The backend owns the real number
              and this is where it lands. */}
          <p className="mt-6 text-sm text-gray-500">Your Referrals (0)</p>

          <button
            onClick={() => setView("terms")}
            className="mt-4 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
