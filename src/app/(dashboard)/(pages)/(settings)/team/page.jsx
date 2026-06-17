"use client";

import { useState } from "react";
import { Send, Search, ChevronDown, ChevronLeft, ChevronRight, List, Grip } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import TeamsList from "./TeamsList";
import NotificationModal from "@/app/(components)/NotificationModal";

const Team = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  const { inviteTeamMember, teamsLoading: authLoading, token } = useAuth();

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    duration: 3000,
  });

  const showNotification = (title, message, type = "info", duration = 3000) => {
    setNotification({ isOpen: true, title, message, type, duration });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      showNotification("Invalid Email", "Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    showNotification("Sending Invite...", "Please wait...", "info", 0);

    try {
      await inviteTeamMember(email.trim());
      closeNotification();
      showNotification("Success!", `${email.trim()} has been invited!`, "success");
      setEmail("");
    } catch (err) {
      closeNotification();
      showNotification("Failed", err.message || "Could not send invitation.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
      />

      <div className="w-full flex flex-col gap-8 p-4 sm:py-6 sm:px-10 bg-surface">
        {/* Header */}
        <div className="space-y-2 pb-10">
          <h1 className="font-semibold text-2xl">Team Members</h1>
          <p className="text-gray-600">Manage and Collaborate with Your Team Efficiently</p>
        </div>

        {/* Invite Section */}
        <div className="border-b pb-8 border-b-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Invite Team Members</h2>
          <p className="text-sm text-gray-600">
            {activeCount}/5 members available in your plan
          </p>
        </div>

        {/* Invite Form */}
        <div className="w-full py-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
              disabled={loading || authLoading}
            />
            <button
              onClick={handleInvite}
              disabled={loading || authLoading || !email.trim() || !token}
              className="px-3 py-2 bg-[#155dfc] hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 justify-center transition-colors cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Send Invite
            </button>
          </div>
        </div>

        {/* Pass real data + callback to TeamsList */}
        <TeamsList
          onActiveCountChange={setActiveCount}
          showNotification={showNotification}
        />
      </div>
    </>
  );
};

export default Team;