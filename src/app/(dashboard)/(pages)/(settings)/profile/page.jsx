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
  const [currentPassword, setCurrentPassword] = useState("********");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── SESSIONS STATE ────────────────────────────────────
  const [sessions, setSessions] = useState([]);

  // ── UI STATE ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
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

  // ── AUTO CLOSE MODAL ──────────────────────────────────
  useEffect(() => {
    if (showModal) {
      const t = setTimeout(() => setShowModal(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showModal]);

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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error();

      setModalMessage("Profile updated successfully!");
      setShowModal(true);
    } catch {
      setModalMessage("Failed to update profile.");
      setShowModal(true);
    }
  };

  // ── PASSWORD UPDATE ───────────────────────────────────
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setModalMessage("Passwords do not match!");
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch(
        `https://backend.creativeklux.com/creativeklux-frontend/user/${user.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            current_password:
              currentPassword === "********" ? "" : currentPassword,
            new_password: newPassword,
          }),
        }
      );

      if (!res.ok) throw new Error();

      setModalMessage("Password updated!");
      setShowModal(true);

      setCurrentPassword("********");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setModalMessage("Error updating password.");
      setShowModal(true);
    }
  };

  // ── DELETE ACCOUNT ────────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      await fetch(
        `https://backend.creativeklux.com/creativeklux-frontend/user/delete/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setModalMessage("Account deleted.");
      setShowModal(true);

      setTimeout(() => logout(), 2000);
    } catch {
      setModalMessage("Error deleting account.");
      setShowModal(true);
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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to terminate session");
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

  return (
    <div className="space-y-10 px-12 py-6">

      {/* ── HEADER ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-gray-500 text-sm">
          Manage your profile, security, and sessions
        </p>
      </div>

      {/* ── PROFILE ─────────────────────────────────── */}
      <form onSubmit={handleProfileSave} className="bg-white border rounded-lg p-6 space-y-6">
        <h2 className="font-semibold text-lg">Profile</h2>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Image
              </div>
            )}
          </div>

          <label className="mt-2 cursor-pointer text-sm border px-3 py-1 rounded">
            Upload
            <input type="file" hidden onChange={handleFileChange} />
          </label>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <input value={email} disabled className="w-full border px-3 py-2 rounded" />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Profile
        </button>
      </form>

      {/* ── PASSWORD ────────────────────────────────── */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Password</h2>

        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <button
          onClick={handlePasswordUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Password
        </button>
      </div>

      {/* ── SESSIONS ────────────────────────────────── */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-lg mb-4">Active Sessions</h2>

        {sessions.map((s) => (
          <div key={s.id} className="flex justify-between border p-3 rounded mb-2">
            <div className="flex gap-2 items-center">
              {s.device?.includes("iPhone") ? <Smartphone /> : <Monitor />}
              <div>
                <p>{s.device}</p>
                <p className="text-xs text-gray-500">
                  {s.browser} • {s.location}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTerminate(s.id)}
              className="text-red-500"
            >
              Terminate
            </button>
          </div>
        ))}
      </div>

      {/* ── ACTIONS ─────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={logout}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <LogOutIcon size={16} /> Logout
        </button>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Trash size={16} /> Delete Account
        </button>
      </div>

      {/* ── MODALS ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded shadow">
            <p>{modalMessage}</p>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded space-y-4">
            <p>Delete account permanently?</p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} className="bg-red-500 px-4 py-2 text-white rounded">
                Yes
              </button>
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
