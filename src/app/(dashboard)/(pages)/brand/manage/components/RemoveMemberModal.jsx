/**
 * RemoveMemberModal.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Confirmation dialog shown before removing a member from the brand. Kept
 * presentational: MembersTab owns the actual DELETE call and passes the target
 * member, a `removing` flag, and the confirm/cancel handlers.
 */

"use client";

import { UserMinus, X, Loader2 } from "lucide-react";

const initials = (name = "") => name.trim().charAt(0).toUpperCase() || "?";

export default function RemoveMemberModal({
  member,
  removing,
  onConfirm,
  onCancel,
}) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <UserMinus className="h-5 w-5" />
            </div>
            <button
              onClick={onCancel}
              disabled={removing}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-4 text-lg font-bold text-gray-900">
            Remove member?
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            This person will immediately lose access to this brand. You can
            invite them again later.
          </p>

          {/* Member being removed */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-3">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                {initials(member.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">
                {member.name}
              </p>
              {member.email && (
                <p className="truncate text-xs text-gray-400">{member.email}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={removing}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={removing}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 cursor-pointer"
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
