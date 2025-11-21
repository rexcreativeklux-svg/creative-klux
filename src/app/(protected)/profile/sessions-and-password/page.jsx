"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, LogOut, Trash, LogOutIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // <-- make sure path matches your setup

export default function Sessions() {
    const [currentPassword, setCurrentPassword] = useState("********");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [sessions, setSessions] = useState([]);
    const { logout, user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Fetch sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch(
                    "https://creatives.weviy.com/creatives-app/user/sessions",
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                const data = await res.json();
                setSessions(data.sessions || []);
            } catch (err) {
                console.error("Failed to load sessions", err);
            }
        };
        fetchSessions();
    }, []);

    // Auto-close modal after 2 seconds
    useEffect(() => {
        if (showModal) {
            const timer = setTimeout(() => {
                setShowModal(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showModal]);

    const handlePasswordUpdate = async () => {
        if (newPassword !== confirmPassword) {
            setModalMessage("Passwords do not match!");
            setShowModal(true);
            return;
        }

        try {
            const res = await fetch(
                `https://creatives.weviy.com/creatives-app/user/edit/${user?.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        current_password:
                            currentPassword === "********" ? "" : currentPassword,
                        new_password: newPassword,
                    }),
                }
            );
            if (!res.ok) throw new Error("Failed to update password");

            setModalMessage("Password updated successfully!");
            setShowModal(true);

            setCurrentPassword("********");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error(err);
            setModalMessage("Error updating password.");
            setShowModal(true);
        }
    };

    // Delete account
    const handleDeleteAccount = async () => {
        if (!user?.id) return;

        try {
            const res = await fetch(
                `https://creatives.weviy.com/creatives-app/user/delete/${user.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to delete account");

            setModalMessage("Account deleted successfully.");
            setShowModal(true);

            // logout after 2 seconds
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (err) {
            console.error(err);
            setModalMessage("Error deleting account.");
            setShowModal(true);
        } finally {
            setShowConfirmModal(false);
        }
    };



    const handleTerminate = async (sessionId) => {
        try {
            const res = await fetch(
                `https://creatives.weviy.com/creatives-app/user/sessions/${sessionId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to terminate session");
            setSessions(sessions.filter((s) => s.id !== sessionId));
        } catch (err) {
            console.error(err);
            alert("Could not terminate session.");
        }
    };

    return (
        <div className="space-y-10 py-4 px-12 rounded-lg">
            {/* header + logout + delete */}
            <div className="border-b pb-3 border-b-gray-200">
                <div className="space-y-2">
                    <h1 className="font-semibold text-2xl">Active sessions & passwords</h1>
                    <p className="text-gray-600">Manage your active sessions, update password, or delete your account.</p>
                </div>

            </div>

            {/* Password Reset */}
            <div className="rounded-lg border border-gray-200 px-3 py-3 bg-white">
                <h2 className="text-lg font-semibold mb-6">Password Reset</h2>

                {/* form */}
                <div className="space-y-5">
                    {/* Current password */}
                    <div className="flex justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            Current Password :
                        </label>
                        <div className="w-[60%] ">
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:none"
                            />
                        </div>
                    </div>

                    {/* New password */}
                    <div className="flex justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            New Password :
                        </label>

                        <div className="w-[60%] ">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:none"
                            />
                        </div>
                    </div>

                    {/* Confirm */}
                    <div className="flex justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            Confirm Password :
                        </label>

                        <div className="w-[60%] ">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handlePasswordUpdate}
                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer duration-300 text-white px-4 py-2 rounded-lg"
                    >
                        Update password
                    </button>
                </div>

                {/* modal */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                        <div className="bg-white rounded-lg p-20 flex flex-col max-w-lg items-center shadow border border-gray-200 animate-fadeIn">
                            <div className="w-16 h-16 flex items-center border justify-center rounded-full bg-green-50 mb-4">
                                <svg
                                    className="w-10 h-10 text-green-600 animate-check"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <p className="text-center py-3 font-semibold">{modalMessage}</p>
                        </div>
                    </div>
                )}

                {/* delete confirm modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                        <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow border border-gray-200 animate-fadeIn">
                            <p className="text-center mb-6">
                                Are you sure you want to delete your account? <br />
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Yes, delete
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Sessions */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-lg font-semibold mb-6">Active Sessions</h2>

                {sessions.length === 0 ? (
                    <p className="text-gray-500">No active sessions found.</p>
                ) : (
                    <ul className="space-y-4">
                        {sessions.map((session) => (
                            <li
                                key={session.id}
                                className="flex justify-between items-center border rounded-md p-4"
                            >
                                <div className="flex items-center gap-3">
                                    {session.device?.toLowerCase().includes("iphone") ? (
                                        <Smartphone className="text-gray-600" />
                                    ) : (
                                        <Monitor className="text-gray-600" />
                                    )}
                                    <div>
                                        <p className="font-medium">{session.device}</p>
                                        <p className="text-sm text-gray-500">
                                            {session.browser} • {session.location} • {session.date}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTerminate(session.id)}
                                    className="text-red-500 hover:underline"
                                >
                                    Terminate
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={logout}
                    className="flex items-center cursor-pointer transition duration-300 gap-2 bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg"
                >
                    <LogOutIcon className="w-4 h-4" /> Logout
                </button>
                <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex items-center gap-2 bg-red-500 cursor-pointer transition duration-300 hover:bg-red-600  text-white px-3 py-2 rounded-lg"
                >
                    <Trash className="w-4 h-4" /> Delete Account
                </button>
            </div>
        </div>
    );
}
