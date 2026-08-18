"use client";

/**
 * FeedbackModal — "Leave feedback" from the workspace panel's footer.
 *
 * A rating and an optional note. ⚠️ THE RATING IS REQUIRED AND THE NOTE IS NOT:
 * a one-tap answer is the whole reason this is five faces rather than a form,
 * and gating Send on the textarea would turn the cheapest question in the app
 * into homework. Send stays disabled until a face is picked so the button says
 * what is missing before it is pressed.
 *
 * ⚠️ UI ONLY. Nothing is transmitted — see notifyPending. The rating values are
 * already stable slugs ("bad" … "love"), so wiring this up is one POST of
 * `{ rating, note }` and nothing here has to change shape.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */

import { useState } from "react";
import { ThumbsDown, Frown, Meh, SmilePlus, Heart, Send } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import ModalCloseButton from "@/app/(components)/ui/ModalCloseButton";
import { notifyPending } from "../../_data/copilots";

/**
 * Worst to best, left to right — the order is the scale, so the row reads as
 * one axis rather than five unrelated buttons. `value` is what the backend
 * will store; `label` is what the user reads.
 */
const RATINGS = [
  { value: "bad", label: "Bad", icon: ThumbsDown },
  { value: "poor", label: "Poor", icon: Frown },
  { value: "okay", label: "Okay", icon: Meh },
  { value: "good", label: "Good", icon: SmilePlus },
  { value: "love", label: "Love it", icon: Heart },
];

export default function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(null);
  const [note, setNote] = useState("");

  // Clear on the way out, so reopening asks the question fresh instead of
  // showing a half-written answer from a session the user abandoned.
  const close = () => {
    onClose();
    setRating(null);
    setNote("");
  };

  const send = () => {
    notifyPending("Your feedback");
    close();
  };

  // hideHeader: the heading here is a question, set larger than the standard
  // title bar and carrying a subtitle, so the dialog draws its own.
  return (
    <ResponsiveModal isOpen={isOpen} onClose={close} hideHeader size="sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            How&apos;s your experience?
          </h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Your feedback shapes what we build next.
          </p>
        </div>
        <ModalCloseButton onClick={close} className="-mr-1 -mt-1" />
      </div>

      {/* Five equal columns rather than a flex row: the labels are different
          lengths ("Bad" vs "Love it") and letting them size themselves puts the
          faces at uneven spacing along what is meant to read as one scale. */}
      <div className="mt-6 grid grid-cols-5 gap-1">
        {RATINGS.map(({ value, label, icon: Icon }) => {
          const on = rating === value;
          return (
            <button
              key={value}
              onClick={() => setRating(value)}
              aria-pressed={on}
              className="group flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                  on
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`text-[11px] ${
                  on ? "font-semibold text-gray-900" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <textarea
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Tell us what's on your mind..."
        aria-label="Your feedback"
        className="mt-5 w-full resize-none rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
      />

      {/* In the body, not the modal footer: it is the last step of a short form
          rather than an action row, and the sticky footer's right-aligned
          buttons would break the full-width block the layout is built on. */}
      <button
        onClick={send}
        disabled={!rating}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
          rating
            ? "bg-gray-900 text-surface hover:bg-gray-800 cursor-pointer"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Send className="h-4 w-4" />
        Send feedback
      </button>
    </ResponsiveModal>
  );
}
