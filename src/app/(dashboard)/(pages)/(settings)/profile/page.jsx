"use client";

/**
 * Account settings (/profile)
 * ──────────────────────────────────────────────────────────────────────────────
 * Profile info + avatar are wired to AuthContext:
 *   • display data comes from `user`
 *   • saving name/avatar goes through `updateProfile` → POST /profile
 *   • the avatar file is uploaded to the gallery first, then its URL is saved
 *     as `profile_pic` (same URL-only pattern the brand logo uses)
 * All feedback uses sonner toasts.
 *
 * ⚠️ Password change, active sessions, and delete-account are still pointed at
 * the OLD backend and need the real `…/creativeklux-userend` endpoints. They are
 * marked TODO(endpoint) below — swap the fetch calls once the specs are known.
 */

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Trash, LogOutIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Pull a hosted URL out of the gallery upload response (field name varies).
const pickUploadedUrl = (res) => {
  const pick = (o) =>
    o?.image || o?.image_url || o?.url || o?.file_url || o?.path || o?.src || null;
  return pick(res) || pick(res?.data) || null;
};

export default function AccountSettings() {
  const { user, logout, updateProfile, uploadMedia, token } = useAuth();

  // ── PROFILE STATE ─────────────────────────────────────
  const [name, setName] = useState(user?.name || "");
  const email = user?.email || "";
  // The hosted profile-pic URL we'll save (null = unchanged).
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  // What's shown in the avatar (existing pic, or a fresh preview/upload).
  const [preview, setPreview] = useState(user?.profile_pic || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── PASSWORD STATE ────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // ── SESSIONS STATE ────────────────────────────────────
  const [sessions, setSessions] = useState([]);

  // ── UI STATE ──────────────────────────────────────────
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Seed the editable fields when a (different) user loads — e.g. on a hard
  // refresh where `user` arrives after mount. Done during render (React's
  // recommended pattern) rather than in an effect so we don't trigger a
  // cascading re-render, and keyed on the user id so it won't clobber edits
  // when the user object merely refreshes (e.g. right after a save).
  const [syncedUserId, setSyncedUserId] = useState(user?.id);
  if (user?.id !== syncedUserId) {
    setSyncedUserId(user?.id);
    setName(user?.name || "");
    setPreview(user?.profile_pic || null);
  }

  // ── FETCH SESSIONS ────────────────────────────────────
  // TODO(endpoint): replace with the real userend sessions endpoint.
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          "https://api.creativeklux.com/api/creativeklux-userend/profile/sessions",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("❌ Failed to load sessions:", err);
      }
    };
    if (token) fetchSessions();
  }, [token]);

  // ── AVATAR: upload to gallery → keep URL ──────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please choose an image under 2 MB.");
      return;
    }

    // Instant local preview while the upload runs.
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      console.log("🖼️ Uploading profile picture to gallery…");
      const res = await uploadMedia(file);
      const url = pickUploadedUrl(res);
      if (!url) {
        console.error("❌ Avatar upload returned no URL:", res);
        toast.error("We couldn't get a URL for your photo. Please try again.");
        setPreview(user?.profile_pic || null);
        return;
      }
      console.log("✅ Profile picture uploaded:", url);
      setProfilePicUrl(url);
      setPreview(url);
      toast.success("Photo uploaded — remember to save.");
    } catch (err) {
      console.error("❌ Avatar upload failed:", err);
      toast.error(err?.message || "Couldn't upload your photo. Please try again.");
      setPreview(user?.profile_pic || null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── PROFILE UPDATE ────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    if (avatarUploading) {
      toast.info("Please wait for the photo upload to finish.");
      return;
    }

    setSavingProfile(true);
    console.log("💾 Saving profile…");
    const payload = { name: name.trim() };
    // Only send the picture if it changed (a fresh gallery URL).
    if (profilePicUrl) payload.profile_pic = profilePicUrl;

    const res = await updateProfile(payload);
    setSavingProfile(false);

    if (res.ok) {
      setProfilePicUrl(null); // consumed
      toast.success("Profile saved.");
    } else {
      toast.error(res.message || "Couldn't update your profile.");
    }
  };

  // ── PASSWORD UPDATE ───────────────────────────────────
  // TODO(endpoint): wire to the real userend change-password endpoint.
  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch(
        `https://api.creativeklux.com/api/creativeklux-userend/profile/${user?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to update password");
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("❌ Password update failed:", err);
      toast.error("Couldn't update your password. Please try again.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ── DELETE ACCOUNT ────────────────────────────────────
  // TODO(endpoint): wire to the real userend delete-account endpoint.
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `https://api.creativeklux.com/api/creativeklux-userend/profile/delete/${user?.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Failed to delete account");
      toast.success("Account deleted.");
      setTimeout(() => logout(), 1500);
    } catch (err) {
      console.error("❌ Delete account failed:", err);
      toast.error("Couldn't delete your account. Please try again.");
    } finally {
      setDeleting(false);
      setShowConfirmModal(false);
    }
  };

  // ── TERMINATE SESSION ─────────────────────────────────
  // TODO(endpoint): wire to the real userend terminate-session endpoint.
  const handleTerminate = async (id) => {
    try {
      const res = await fetch(
        `https://api.creativeklux.com/api/creativeklux-userend/profile/sessions/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Failed to terminate session");
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session ended.");
    } catch (err) {
      console.error("❌ Terminate session failed:", err);
      toast.error("Failed to terminate session.");
    }
  };

  // ── AVATAR INITIALS ───────────────────────────────────
  const initials = name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const profileDirty =
    name.trim() !== (user?.name || "") || !!profilePicUrl;

  return (
    <div className="py-3 space-y-4">
      {/* ── HEADER ───────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Account settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your profile, security, and sessions
        </p>
      </div>

      {/* ── PROFILE ─────────────────────────────────── */}
      <form
        onSubmit={handleProfileSave}
        className="bg-surface border border-gray-200 rounded-xl p-6 space-y-5"
      >
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Profile
        </p>

        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 text-gray-500 font-medium text-lg">
            {preview ? (
              <img
                src={preview}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            ) : (
              <span>{initials || "?"}</span>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {name || "Your name"}
            </p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          <label
            className={`text-xs text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors shrink-0 ${
              avatarUploading
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer hover:bg-gray-50"
            }`}
          >
            {avatarUploading ? "Uploading…" : "Change photo"}
            <input
              type="file"
              hidden
              accept="image/*"
              disabled={avatarUploading}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Email address</label>
            <input
              value={email}
              disabled
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={savingProfile || avatarUploading || !profileDirty}
            className="inline-flex items-center gap-2 text-sm bg-gray-800 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>

      {/* ── PASSWORD ────────────────────────────────── */}
      <div className="bg-surface border border-gray-200 rounded-xl p-6 space-y-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Password
        </p>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">New password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Confirm password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        <div>
          <button
            onClick={handlePasswordUpdate}
            disabled={updatingPassword}
            className="inline-flex items-center gap-2 text-sm bg-gray-900 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
            Update password
          </button>
        </div>
      </div>

      {/* ── SESSIONS ────────────────────────────────── */}
      <div className="bg-surface border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Active sessions
        </p>

        {sessions.length === 0 && (
          <p className="text-sm text-gray-400">No active sessions found.</p>
        )}

        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-surface border border-gray-200 flex items-center justify-center shrink-0">
                {s.device?.includes("iPhone") ? (
                  <Smartphone size={13} className="text-gray-500" />
                ) : (
                  <Monitor size={13} className="text-gray-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {s.device}
                  {s.current && (
                    <span className="ml-2 text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {s.browser} · {s.location}
                </p>
              </div>

              {!s.current && (
                <button
                  onClick={() => handleTerminate(s.id)}
                  className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors shrink-0"
                >
                  End
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIONS ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <LogOutIcon size={13} />
          Log out
        </button>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
        >
          <Trash size={13} />
          Delete account
        </button>
      </div>

      {/* ── CONFIRM DELETE MODAL ──────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl space-y-3">
            <h3 className="text-base font-medium text-gray-900">
              Delete your account?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              This will permanently remove your account and all associated data.
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={deleting}
                className="text-sm text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 text-sm text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
