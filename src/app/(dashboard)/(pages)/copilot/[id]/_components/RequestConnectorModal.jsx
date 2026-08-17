"use client";

/**
 * RequestConnectorModal — "Can't find what you need? Request a connector".
 *
 * ⚠️ It REPLACES the Connectors modal rather than stacking on it: the page owns
 * one `dialog` value, so the two can never both be open. Stacking a form on a
 * browse dialog leaves the user two ✕ buttons and a scrim over a scrim, and the
 * form has nothing to do with the list behind it once it is open.
 *
 * ⚠️ UI ONLY — the backend decides where a request goes, so Submit reports the
 * click and closes. The form still validates, because that part is ours: a
 * request with no service name is not a request.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */

import { useState } from "react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import Input from "@/app/(components)/ui/Input";
import { notifyPending } from "../../_data/copilots";

export default function RequestConnectorModal({ isOpen, onClose }) {
  const [service, setService] = useState("");
  const [docs, setDocs] = useState("");
  const [usage, setUsage] = useState("");

  // The name is the only required field — the URL and the "what for" are how a
  // request gets prioritised, not what makes it one.
  const canSubmit = service.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    notifyPending("Connector requests");
    onClose();
    setService("");
    setDocs("");
    setUsage("");
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Request a connector"
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {/* Disabled rather than hidden, and it says why by staying put: the
              user can see the action exists and what is still missing above it. */}
          <button
            onClick={submit}
            disabled={!canSubmit}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              canSubmit
                ? "bg-gray-900 text-surface hover:bg-gray-800 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Submit request
          </button>
        </>
      }
    >
      <p className="-mt-1 text-sm text-gray-500">
        Tell us what you want to connect and how you plan to use it.
      </p>

      {/* The app's shared <Input> — label, optional badge and field styling in
          one place, so this form matches every other form in the product. */}
      <div className="mt-5 flex flex-col gap-4">
        <Input
          id="connector-service"
          label="Service name"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="For example, Canva"
        />
        <Input
          id="connector-docs"
          label="Website or API documentation"
          optional
          type="url"
          value={docs}
          onChange={(e) => setDocs(e.target.value)}
          placeholder="https://..."
        />
        <div>
          <label
            htmlFor="connector-usage"
            className="mb-1.5 block text-[12px] font-medium text-gray-500"
          >
            What should your copilot do with it?
          </label>
          <textarea
            id="connector-usage"
            rows={4}
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            placeholder="Describe the data or actions your copilot needs."
            className="w-full rounded-lg border border-gray-300 bg-surface px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      </div>
    </ResponsiveModal>
  );
}
