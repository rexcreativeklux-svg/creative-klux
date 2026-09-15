"use client";

/**
 * CreateCopilotModal — asks for a name, makes the copilot, hands it back.
 *
 * Shared by the two places a copilot is born: the catalog's "Create copilot"
 * button and the home screen's "first task" composer. What happens AFTER the
 * create differs between them (open it, or open it and ask the task), so that
 * is the caller's `onCreated`; the create itself lives here once.
 *
 * ⚠️ NOT DISMISSIBLE WHILE CREATING. Closing mid-request would leave a copilot
 * made on the server that nobody gets taken to — and a second try would make
 * a duplicate.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(copilot: Object) => void} props.onCreated  Called with the created
 *   copilot; the modal stays in its busy state, since the caller navigates away.
 */

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import Input from "@/app/(components)/ui/Input";
import { addCopilot, reportFailure } from "../_data/copilots";

export default function CreateCopilotModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !creating;

  // ResponsiveModal focuses the first focusable on open, which is its ✕. The
  // name is the only thing to do here, so take focus one frame after it does.
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const close = () => {
    if (creating) return;
    setName("");
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    try {
      const copilot = await addCopilot({ name: trimmed });
      onCreated(copilot);
    } catch (err) {
      reportFailure(err, "Couldn't create a copilot");
      setCreating(false); // give the form back; on success the caller navigates
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={close}
      title="Create copilot"
      size="md"
      dismissible={!creating}
      footer={
        <>
          <button
            type="button"
            onClick={close}
            disabled={creating}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {/* `form=` because the footer renders outside the <form> below. */}
          <button
            type="submit"
            form="create-copilot-form"
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              canSubmit
                ? "bg-gray-900 text-surface hover:bg-gray-800 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "Creating…" : "Create"}
          </button>
        </>
      }
    >
      <p className="-mt-1 text-sm text-gray-500">
        Give it a name you&apos;ll recognise. You can rename it at anytime.
      </p>

      <form id="create-copilot-form" onSubmit={submit} className="mt-5">
        <Input
          ref={inputRef}
          id="copilot-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="For example, Brand assistant"
          autoComplete="off"
          disabled={creating}
        />
      </form>
    </ResponsiveModal>
  );
}
