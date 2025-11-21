"use client";

import React, { useState } from "react";
import { Send, ChevronDown, Search, MoreHorizontal, ChevronLeft, ChevronRight, User, MoreVertical, Mail, Phone, MapPin, MessageCircle, Facebook, Table, Grip, List } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import TeamsList from "./TeamsList";


const Team = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCount, setActiveCount] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Talent",
      email: "talentweb2022@gmail.com",
      phone: "+1-234-567-8900",
      location: "Lagos, Nigeria",
      role: "Owner",
      status: "Active",
      avatar: null,
      socialLinks: [
        { platform: "email", url: "mailto:talentweb2022@gmail.com" },
        { platform: "phone", url: "tel:+12345678900" },
        { platform: "whatsapp", url: "https://wa.me/+12345678900" },
        { platform: "facebook", url: "https://facebook.com/talent" },
      ],
    },
  ]);
  const [isCardView, setIsCardView] = useState(false);
  const { inviteTeamMember, loading: authLoading, token } = useAuth();

  const handleInvite = async () => {
    if (!email) return;

    setLoading(true);

    try {
      const data = await inviteTeamMember(email);
      setTeamMembers((prev) => [
        ...prev,
        {
          id: Date.now(),
          username: data.username,
          name: data.name,
          email: data.email,
          phone: "+1-000-000-0000",
          location: "Unknown",
          role: data.role,
          status: data.status,
          avatar: null,
          socialLinks: [
            { platform: "email", url: `mailto:${data.email}` },
            { platform: "phone", url: "+1-000-000-0000" },
            { platform: "whatsapp", url: "https://wa.me/+10000000000" },
            { platform: "facebook", url: "https://facebook.com/default" },
          ],
        },
      ]);
      setEmail("");
    } catch (error) {
      console.error("Failed to invite team member:", error.message);
      // Optionally show an error message to the user
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

const filteredMembers = teamMembers.filter((member) => {
  const name = member.name || "";
  const email = member.email || "";
  return (
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );
});


  const totalPages = Math.ceil(filteredMembers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + entriesPerPage);

//   const getRoleColor = (role) => {
//     switch (role.toLowerCase()) {
//       case "owner":
//         return "bg-blue-700 text-white border-blue-200";
//       case "admin":
//         return "bg-blue-100 text-blue-800 border-blue-200";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200";
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status.toLowerCase()) {
//       case "active":
//         return "bg-green-100 text-green-800 border-green-200";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 border-yellow-200";
//       case "inactive":
//         return "bg-red-100 text-red-800 border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200";
//     }
//   };

  return (
    <div className="w-full flex flex-col justify-between gap-5 p-4 sm:py-6 sm:px-10 bg-white">
      {/* Header */}
      <div className="space-y-2 pb-10">
        <h1 className="font-semibold text-2xl">Team Members</h1>
        <p className="text-gray-600">Manage and Collaborate with Your Team Efficiently</p>
      </div>

      <div className="border-b pb-4 border-b-gray-200">
        <h1 className="text-md sm:text-lg font-medium text-gray-900 mb-2">
          Invite Team Members
        </h1>
        <p className="text-sm text-gray-600">
         {activeCount}/5 members available in your plan.
        </p>
      </div>

      {/* Invite Form */}
      <div className="w-full py-10">
        <div className="">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
        </div>
        <div className="flex flex-col w-[70%] sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
            disabled={loading || authLoading}
          />
          <div>
            <button
              onClick={handleInvite}
              disabled={loading || authLoading || !email || !token}
              className="px-4 py-2 bg-[#155dfc] hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 justify-center transition-colors duration-300 min-w-[100px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Send
            </button>
          </div>
        </div>
      </div>


      <TeamsList  onActiveCountChange={setActiveCount} />
    </div>
  );
};

export default Team;