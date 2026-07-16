/**
 * InviteModals.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * The three member-invite dialogs, kept together since they share styling and
 * are always used as a set by MembersTab:
 *
 *   • InviteByEmailModal   — send an email invitation (POST invite-email)
 *   • CreateInviteLinkModal — mint a shareable link  (POST invite-link)
 *   • InviteLinksModal      — list / copy / delete links (GET + DELETE invites)
 *
 * All network calls are passed in from MembersTab (via useManageApi) so these
 * stay presentational and reusable.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Link as LinkIcon, Copy, Trash2, Loader2, Check } from "lucide-react";
import { INVITE_ROLES, INVITE_MAX_USES } from "../config/manageConfig";

// Team photo shown on the invite-by-email modal.
const INVITE_HERO_IMG =
  "https://images.pexels.com/photos/29267512/pexels-photo-29267512.jpeg?auto=compress&cs=tinysrgb&w=800";

const selectCls =
  "w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-lg text-sm text-gray-800 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer";

// Shared backdrop + centered panel wrapper.
function ModalShell({ children, maxWidth = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-2xl bg-surface shadow-xl`}>
        {children}
      </div>
    </div>
  );
}

// ── Invite by email ─────────────────────────────────────────────────────────
export function InviteByEmailModal({ onClose, onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = async () => {
    if (!isValidEmail) return toast.error("Enter a valid email address.");
    setSending(true);
    const res = await onInvite({ email: email.trim(), role });
    setSending(false);
    if (res.ok) {
      toast.success(`Invitation sent to ${email.trim()}.`);
      onClose();
    } else {
      toast.error(res.message || "Couldn't send the invitation.");
    }
  };

  return (
    <ModalShell maxWidth="max-w-3xl">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl sm:grid-cols-2 relative">
        {/* Left visual (hidden on mobile to keep the form front-and-center) */}
        <div className="relative hidden min-h-105 sm:block">
          <img
            src={INVITE_HERO_IMG}
            alt="A team collaborating together"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
          <div className="relative flex h-full flex-col justify-end gap-2 p-6 text-white">
            <span className="text-xl font-bold leading-tight">
              Bring your team together
            </span>
            <span className="text-sm text-white/85">
              Invite teammates to collaborate in this brand.
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col justify-center p-7 sm:p-8">
          {/* <div className="flex items-start justify-between gap-3"> */}
            <h3 className="text-2xl font-bold leading-tight text-gray-900">
              Invite people to your brand
            </h3>
          {/* </div> */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-800">
                Email address
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-md border border-gray-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-gray-600 focus:outline-none cursor-pointer"
              >
                {INVITE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="teammate@company.com"
              className={selectCls.replace("cursor-pointer", "")}
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSend}
                disabled={sending || !isValidEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-[#155dfc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send invitation
              </button>
              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Create invite link ──────────────────────────────────────────────────────
export function CreateInviteLinkModal({ onClose, onCreate }) {
  const [role, setRole] = useState("member");
  const [maxUses, setMaxUses] = useState(10);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    const res = await onCreate({ role, max_uses: maxUses });
    setCreating(false);
    if (res.ok) {
      toast.success("Invite link created.");
      onClose(true); // signal success so the caller can open the links list
    } else {
      toast.error(res.message || "Couldn't create the invite link.");
    }
  };

  return (
    <ModalShell>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900">Create invite link</h3>
          <button
            onClick={() => onClose(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectCls}
            >
              {INVITE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Maximum uses
            </label>
            <select
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className={selectCls}
            >
              {INVITE_MAX_USES.map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "use" : "uses"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
            <span className="mt-0.5 text-amber-500">⚠️</span>
            <p className="text-sm text-amber-800">
              Anyone with this link can join your brand and access its data.
              Only share it with people you trust.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onClose(false)}
            disabled={creating}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Invite links list ───────────────────────────────────────────────────────
export function InviteLinksModal({
  onClose,
  links,
  loading,
  onDelete,
  onCreateNew,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleCopy = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const handleDelete = async (link) => {
    setDeletingId(link.id);
    const res = await onDelete(link.id);
    setDeletingId(null);
    if (res.ok) toast.success("Invite link revoked.");
    else toast.error(res.message || "Couldn't revoke the link.");
  };

  return (
    <ModalShell>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invite links</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Create and manage invite links for this brand.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading links…
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
              No invite links yet.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <LinkIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {link.url}
                  </p>
                  <p className="text-xs text-gray-400">
                    {link.roleLabel} · {link.usesLabel}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(link)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  title="Copy link"
                >
                  {copiedId === link.id ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(link)}
                  disabled={deletingId === link.id}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                  title="Revoke link"
                >
                  {deletingId === link.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))
          )}

          <button
            onClick={onCreateNew}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#155dfc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
          >
            <LinkIcon className="h-4 w-4" />
            Create Invite Link
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
