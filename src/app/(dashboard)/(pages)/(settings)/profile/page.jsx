"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Trash, LogOutIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccountSettings() {
  const { user, logout } = useAuth();

  // ── PROFILE STATE ─────────────────────────────────────
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user?.profilePic || null);

  // ── PASSWORD STATE ────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── SESSIONS STATE ────────────────────────────────────
  const [sessions, setSessions] = useState([]);

  // ── UI STATE ──────────────────────────────────────────
  const [toast, setToast] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── FETCH SESSIONS ────────────────────────────────────
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          "https://backend.creativeklux.com/creativeklux-frontend/user/sessions",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSessions();
  }, []);

  // ── TOAST HELPER ──────────────────────────────────────
  const triggerToast = (msg) => {
    setToast(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  // ── PROFILE UPDATE ────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    if (profilePic) formData.append("profile_picture", profilePic);

    try {
      const res = await fetch(
        `https://backend.creativeklux.com/creativeklux-frontend/${user.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        }
      );
      if (!res.ok) throw new Error();
      triggerToast("Profile saved");
    } catch {
      triggerToast("Failed to update profile.");
    }
  };

  // ── PASSWORD UPDATE ───────────────────────────────────
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      triggerToast("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch(
        `https://backend.creativeklux.com/creativeklux-frontend/user/${user.id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );
      if (!res.ok) throw new Error();
      triggerToast("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      triggerToast("Error updating password.");
    }
  };

  // ── DELETE ACCOUNT ────────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      await fetch(
        `https://backend.creativeklux.com/creativeklux-frontend/user/delete/${user.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      triggerToast("Account deleted.");
      setTimeout(() => logout(), 2200);
    } catch {
      triggerToast("Error deleting account.");
    } finally {
      setShowConfirmModal(false);
    }
  };

  // ── TERMINATE SESSION ─────────────────────────────────
  const handleTerminate = async (id) => {
    try {
      await fetch(
        `https://backend.creativeklux.com/creativeklux-frontend/user/sessions/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSessions((prev) => prev.filter((s) => s.id !== id));
      triggerToast("Session ended.");
    } catch {
      triggerToast("Failed to terminate session.");
    }
  };

  // ── IMAGE PREVIEW ─────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
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

  return (
    <div className=" py-3 space-y-4">

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
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
      >
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Profile
        </p>

        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 text-gray-500 font-medium text-lg">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <span>{initials || "?"}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name || "Your name"}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          <label className="cursor-pointer text-xs text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors flex-shrink-0">
            Change photo
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </label>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
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
            className="text-sm bg-gray-800 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-black transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>

      {/* ── PASSWORD ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
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

        <div className="grid grid-cols-2 gap-3">
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
            className="text-sm bg-gray-900 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Update password
          </button>
        </div>
      </div>

      {/* ── SESSIONS ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
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
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
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
                  className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  End
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIONS ─────────────────────────────────── */}
      <div className="flex gap-2 pt-1">
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

      {/* ── TOAST ────────────────────────────────────── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 pointer-events-none whitespace-nowrap z-50 ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {toast}
      </div>

      {/* ── CONFIRM DELETE MODAL ──────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-80 shadow-xl space-y-3">
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
                className="text-sm text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="text-sm text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}