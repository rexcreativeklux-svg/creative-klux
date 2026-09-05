"use client";

import React, { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { avatarColor, initialsOf } from "./EditorCollaborators";

/**
 * ManageCollaboratorsModal — invite someone to the team, or remove them.
 *
 * Reuses the auth context's own invite / remove functions, which are the same
 * ones the Team settings screen calls. Nothing here has its own idea of what
 * the team is, so the two screens cannot drift apart.
 *
 * Pending invites are listed but visibly separated from members: someone who
 * has not accepted yet cannot open anything, and a list that shows them
 * identically is a list that overstates who has access.
 *
 * Props: { me, members, loading, onInvite, onRemove, onClose }
 */
export default function ManageCollaboratorsModal({
  me,
  members = [],
  loading,
  onInvite,
  onRemove,
  onClose,
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const accepted = members.filter((m) => m?.status !== "pending");
  const pending = members.filter((m) => m?.status === "pending");

  const invite = async (e) => {
    e.preventDefault();
    const value = email.trim();
    // Deliberately shallow: the server is the authority on what a usable
    // address is, and a stricter regex here would reject valid ones for no gain.
    if (!value.includes("@")) {
      toast.error("Enter an email address.");
      return;
    }
    setSending(true);
    try {
      await onInvite(value);
      setEmail("");
      toast.success(`Invite sent to ${value}`);
    } catch (err) {
      toast.error(err?.message || "Could not send that invite");
    } finally {
      setSending(false);
    }
  };

  const remove = async (member) => {
    setRemovingId(member.id);
    try {
      await onRemove(member.id);
      toast.success("Removed");
    } catch (err) {
      toast.error(err?.message || "Could not remove them");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Collaborators</h2>
            {/* Said plainly, because the row of faces in the header invites the
                other reading. */}
            <p className="text-[11px] text-gray-400">
              Everyone on your team can open this design.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={invite} className="flex shrink-0 gap-2 border-b border-gray-100 p-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:border-blue-400 focus:bg-surface focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Invite
          </button>
        </form>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="px-3 py-6 text-center text-xs text-gray-400">Loading…</p>
          ) : (
            <>
              {me && <Row person={me} subtitle="You" />}
              {accepted.map((m) => (
                <Row
                  key={m.id}
                  person={m}
                  subtitle={m.role || "Member"}
                  onRemove={() => remove(m)}
                  removing={removingId === m.id}
                />
              ))}

              {pending.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold text-gray-400">
                    Pending invites
                  </p>
                  {pending.map((m) => (
                    <Row
                      key={m.id}
                      person={m}
                      subtitle="Hasn't accepted yet"
                      muted
                      onRemove={() => remove(m)}
                      removing={removingId === m.id}
                    />
                  ))}
                </>
              )}

              {!accepted.length && !pending.length && (
                <p className="px-3 py-6 text-center text-xs text-gray-400">
                  It&apos;s just you so far. Invite someone above.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ person, subtitle, muted, onRemove, removing }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(
          person,
        )} ${muted ? "opacity-50" : ""}`}
      >
        {initialsOf(person)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-gray-800">
          {person.name || person.email}
        </span>
        <span className="block truncate text-[11px] text-gray-400">
          {person.name ? person.email : subtitle}
        </span>
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          disabled={removing}
          title="Remove"
          // Revealed on hover, but always present for keyboard users — a
          // control that only exists on hover cannot be tabbed to.
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 lg:opacity-0 cursor-pointer disabled:opacity-40"
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
