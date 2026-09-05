"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ManageCollaboratorsModal from "./ManageCollaboratorsModal";

/**
 * EditorCollaborators — the cluster of faces in the editor's top bar.
 *
 * ── These are MEMBERS, not presence ───────────────────────────────────────
 *
 * Nobody shown here is necessarily looking at this design right now. The row
 * answers "who could open this?", not "who is here?", and it deliberately
 * carries none of the signals that would imply otherwise — no green dots, no
 * "viewing now", no live cursors. Real presence needs a socket and a heartbeat;
 * borrowing its vocabulary without them would make the editor lie about
 * something people would reasonably act on.
 *
 * ── Where the list comes from ─────────────────────────────────────────────
 *
 * `teams` on the auth context — the same list the Team settings screen renders,
 * already fetched once for the session. Opening a design costs no extra request
 * for a decorative row of faces, and invite / remove reuse the same functions
 * the settings screen calls, so the two can never disagree about who is on the
 * team.
 */

/** Initials from a name, falling back to the email. Never more than two. */
export function initialsOf(person) {
  const source = (person?.name || person?.email || "?").trim();
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0] || "";
  const second = words.length > 1 ? words[1][0] || "" : "";
  return (first + second).toUpperCase();
}

// Deterministic per person, so someone's colour doesn't change between renders
// or between screens — the colour is part of how you recognise them.
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

export function avatarColor(person) {
  const key = String(person?.email || person?.name || person?.id || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** How many faces fit before the row starts counting instead. */
const MAX_FACES = 3;

export default function EditorCollaborators() {
  const { user, teams, teamsLoading, inviteTeamMember, handleDeleteTeam } =
    useAuth();
  const [open, setOpen] = useState(false);

  // The signed-in user leads, then accepted members. Pending invites are left
  // out of the ROW — someone who has not accepted yet is not a collaborator,
  // and showing them as one overstates who has access. They are listed in the
  // modal, where the distinction can be spelled out.
  const people = useMemo(() => {
    const accepted = (teams || []).filter((t) => t?.status !== "pending");
    const me = user ? [{ id: "me", name: user.name, email: user.email }] : [];
    const seen = new Set(me.map((p) => p.email));
    return [...me, ...accepted.filter((t) => !seen.has(t.email))];
  }, [teams, user]);

  const shown = people.slice(0, MAX_FACES);
  const extra = people.length - shown.length;

  return (
    <>
      <div className="flex items-center">
        {/* Overlapped, in the way every tool of this kind shows a group — the
            ring keeps them separable where they touch. */}
        {!teamsLoading &&
          shown.map((person, i) => (
            <span
              key={person.id ?? person.email ?? i}
              title={person.name || person.email}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${avatarColor(
                person,
              )} ${i > 0 ? "-ml-2" : ""}`}
            >
              {initialsOf(person)}
            </span>
          ))}

        {extra > 0 && (
          <span
            title={`${extra} more`}
            className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 ring-2 ring-white"
          >
            +{extra}
          </span>
        )}

        <button
          onClick={() => setOpen(true)}
          title="Manage collaborators"
          className={`flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition hover:border-blue-400 hover:text-blue-600 cursor-pointer ${
            shown.length || extra ? "-ml-1 ml-1" : ""
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <ManageCollaboratorsModal
          me={user}
          members={teams || []}
          loading={teamsLoading}
          onInvite={inviteTeamMember}
          onRemove={handleDeleteTeam}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
