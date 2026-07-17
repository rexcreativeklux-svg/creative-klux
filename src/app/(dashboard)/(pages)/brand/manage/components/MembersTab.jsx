/**
 * MembersTab.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Members management: roster with role editing + removal, brand stats,
 * search, and the invite surfaces (email / link) wired to useManageApi.
 *
 * API response shapes for members/invites aren't fully documented yet, so both
 * are run through defensive normalizers (`normalizeMember` / `normalizeLink`) —
 * the single place to adjust once a real payload is confirmed.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Trophy,
  Search,
  Download,
  Filter,
  MoreVertical,
  ChevronDown,
  Mail,
  Link as LinkIcon,
  Loader2,
  UserMinus,
} from "lucide-react";
import { useManageApi } from "../lib/useManageApi";
import { MEMBER_ROLES } from "../config/manageConfig";
import {
  InviteByEmailModal,
  CreateInviteLinkModal,
  InviteLinksModal,
} from "./InviteModals";
import RemoveMemberModal from "./RemoveMemberModal";
import { normalizeInviteUrl } from "@/utils/inviteUrl";

// ── Normalizers (tolerate several backend field names) ───────────────────────
const normalizeMember = (m = {}) => ({
  id: m.id ?? m.member_id ?? m.user_id,
  name: m.name || m.user?.name || m.full_name || "Unknown",
  email: m.email || m.user?.email || "",
  role: (m.role || m.pivot?.role || "member").toLowerCase(),
  creditsUsed: m.credits_used ?? m.creditsUsed ?? 0,
  apps: m.apps_count ?? m.apps ?? null,
  agents: m.agents_count ?? m.agents ?? null,
  lastActive: m.last_active || m.lastActive || null,
  avatar: m.avatar || m.user?.avatar || null,
});

const normalizeLink = (l = {}) => {
  const role = (l.role || "member").toLowerCase();
  const roleLabel = MEMBER_ROLES.find((r) => r.value === role)?.label || "Member";
  const used = l.uses_count ?? l.used ?? 0;
  const max = l.max_uses ?? l.maxUses ?? "∞";
  // Always present a full, shareable invite link — build it from the token when
  // the backend only returns the raw token (see @/utils/inviteUrl).
  return {
    id: l.id ?? l.token,
    url: normalizeInviteUrl(l.url || l.invite_url || l.link || l.token),
    roleLabel,
    usesLabel: `${used}/${max} ${max === 1 ? "Use" : "Uses"}`,
  };
};

const initials = (name = "") =>
  name.trim().charAt(0).toUpperCase() || "?";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-300" />}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default function MembersTab({ brandId }) {
  const {
    getMembers,
    inviteByEmail,
    updateMemberRole,
    removeMember,
    getInviteLinks,
    createInviteLink,
    deleteInviteLink,
  } = useManageApi();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  // Member queued for removal — drives the confirmation modal.
  const [removeTarget, setRemoveTarget] = useState(null);

  // Invite surfaces
  const [menuOpen, setMenuOpen] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showLinksList, setShowLinksList] = useState(false);
  const menuRef = useRef(null);
  const kebabRef = useRef(null);

  // Invite links
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // ── Load members (inline async loader, mirroring the app's fetch-on-mount idiom) ──
  useEffect(() => {
    if (!brandId) return;
    const load = async () => {
      setLoading(true);
      const res = await getMembers(brandId);
      if (res.ok) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.members || [];
        setMembers(list.map(normalizeMember));
      } else {
        toast.error(res.message || "Couldn't load members.");
        setMembers([]);
      }
      setLoading(false);
    };
    load();
  }, [brandId, getMembers]);

  // ── Load invite links (lazy — only when a link surface opens) ──
  const loadLinks = useCallback(async () => {
    if (!brandId) return;
    setLinksLoading(true);
    const res = await getInviteLinks(brandId);
    if (res.ok) {
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.invites || [];
      setLinks(list.map(normalizeLink));
    } else {
      toast.error(res.message || "Couldn't load invite links.");
      setLinks([]);
    }
    setLinksLoading(false);
  }, [brandId, getInviteLinks]);

  // Close either dropdown on outside click.
  useEffect(() => {
    if (!menuOpen && !kebabOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
      if (kebabRef.current && !kebabRef.current.contains(e.target))
        setKebabOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, kebabOpen]);

  // ── Actions ──
  const handleRoleChange = async (member, role) => {
    setUpdatingId(member.id);
    const prev = member.role;
    setMembers((ms) =>
      ms.map((m) => (m.id === member.id ? { ...m, role } : m)),
    );
    const res = await updateMemberRole(brandId, member.id, role);
    setUpdatingId(null);
    if (res.ok) {
      toast.success(`${member.name}'s role updated.`);
    } else {
      setMembers((ms) =>
        ms.map((m) => (m.id === member.id ? { ...m, role: prev } : m)),
      );
      toast.error(res.message || "Couldn't update the role.");
    }
  };

  // Confirmed from the modal — perform the actual removal.
  const handleRemoveConfirmed = async () => {
    const member = removeTarget;
    if (!member) return;
    setRemovingId(member.id);
    const res = await removeMember(brandId, member.id);
    setRemovingId(null);
    if (res.ok) {
      setMembers((ms) => ms.filter((m) => m.id !== member.id));
      setRemoveTarget(null);
      toast.success(`${member.name} removed from the brand.`);
    } else {
      toast.error(res.message || "Couldn't remove the member.");
    }
  };

  const handleInviteEmail = (payload) => inviteByEmail(brandId, payload);

  const handleCreateLink = async (payload) => {
    const res = await createInviteLink(brandId, payload);
    if (res.ok) loadLinks(); // refresh the list behind the modal
    return res;
  };

  const handleDeleteLink = async (linkId) => {
    const res = await deleteInviteLink(brandId, linkId);
    if (res.ok) setLinks((ls) => ls.filter((l) => l.id !== linkId));
    return res;
  };

  const openLinksList = () => {
    setMenuOpen(false);
    setKebabOpen(false);
    setShowLinksList(true);
    loadLinks();
  };

  // ── Derived ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.includes(q),
    );
  }, [members, query]);

  const counts = useMemo(() => {
    const c = { owner: 0, admin: 0, member: 0 };
    members.forEach((m) => {
      if (c[m.role] != null) c[m.role] += 1;
    });
    return c;
  }, [members]);

  const totalCredits = useMemo(
    () => members.reduce((sum, m) => sum + (Number(m.creditsUsed) || 0), 0),
    [members],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          View and manage members and roles for this brand.
        </p>
        <div className="flex items-center gap-2">
          <div className="relative" ref={kebabRef}>
            <button
              onClick={() => setKebabOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 cursor-pointer"
              title="More"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {kebabOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-surface py-1 shadow-lg">
                <button
                  onClick={openLinksList}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                  Manage Invite Link
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0940b7] cursor-pointer"
            >
              Invite Members
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-surface py-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowEmailModal(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-gray-400" />
                  Invite by email
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowCreateLink(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                  Create Invite Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Brand members"
          value={members.length}
          sub={`${counts.owner} Owner · ${counts.admin} Admin · ${counts.member} Members`}
          Icon={Users}
        />
        <StatCard label="Credits Usage" value={totalCredits} sub="Unlimited" />
        <StatCard
          label="Top builders"
          value="—"
          sub="No activity in the last 30 days"
          Icon={Trophy}
        />
      </div>

      {/* Search + actions */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="w-full rounded-lg border border-gray-200 bg-surface py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 cursor-pointer"
            title="Export"
          >
            <Download className="h-4 w-4" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 cursor-pointer">
            <Filter className="h-4 w-4" />
            Filter by
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-720px border-collapse">
          <thead>
            <tr className="border-y border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <th className="py-3 pl-1 pr-3">People ({filtered.length})</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Credits Used</th>
              <th className="px-3 py-3">Apps</th>
              <th className="px-3 py-3">Agents</th>
              <th className="px-3 py-3">Last Active</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-gray-400"
                >
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading members…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-gray-400"
                >
                  {query ? "No members match your search." : "No members yet."}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-gray-50 text-sm text-gray-700"
                >
                  <td className="py-3 pl-1 pr-3">
                    <div className="flex items-center gap-3">
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                          {initials(m.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">
                          {m.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="relative inline-flex items-center">
                      <select
                        value={m.role}
                        disabled={updatingId === m.id}
                        onChange={(e) => handleRoleChange(m, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-surface py-1.5 pl-2.5 pr-7 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                      >
                        {MEMBER_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {updatingId === m.id && (
                        <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">{m.creditsUsed}</td>
                  <td className="px-3 py-3 text-gray-400">{m.apps ?? "—"}</td>
                  <td className="px-3 py-3 text-gray-400">{m.agents ?? "—"}</td>
                  <td className="px-3 py-3 text-gray-400">
                    {m.lastActive ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => setRemoveTarget(m)}
                      disabled={removingId === m.id}
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                      title="Remove member"
                    >
                      {removingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <RemoveMemberModal
        member={removeTarget}
        removing={removingId === removeTarget?.id}
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setRemoveTarget(null)}
      />
      {showEmailModal && (
        <InviteByEmailModal
          onClose={() => setShowEmailModal(false)}
          onInvite={handleInviteEmail}
        />
      )}
      {showCreateLink && (
        <CreateInviteLinkModal
          onClose={(created) => {
            setShowCreateLink(false);
            if (created) openLinksList(); // show the freshly-minted link
          }}
          onCreate={handleCreateLink}
        />
      )}
      {showLinksList && (
        <InviteLinksModal
          onClose={() => setShowLinksList(false)}
          links={links}
          loading={linksLoading}
          onDelete={handleDeleteLink}
          onCreateNew={() => {
            setShowLinksList(false);
            setShowCreateLink(true);
          }}
        />
      )}
    </div>
  );
}
