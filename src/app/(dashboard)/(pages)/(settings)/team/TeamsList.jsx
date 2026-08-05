"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  User,
  MoreVertical,
  MoreHorizontal,
  List,
  Grip,
  ChevronDown,
  Search,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FaFacebook } from "react-icons/fa";
import { useBreakpoint } from "@/utils/useMediaQuery";

export default function TeamsList({ onActiveCountChange, showNotification }) {
  // Use shared teams state from AuthContext — no more local fetch loop
  const { teams, teamsLoading, handleDeleteTeam } = useAuth();

  // The table branch only exists from `md` up; below that cards are forced.
  const isDesktopTable = useBreakpoint("md");
  const [isCardView, setIsCardView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Update active count for parent
  useEffect(() => {
    if (onActiveCountChange) {
      const activeCount = teams.filter((t) => {
        if (typeof t.status !== "string") return t.status === 1;
        return t.status.toLowerCase() === "active";
      }).length;
      onActiveCountChange(activeCount);
    }
  }, [teams, onActiveCountChange]);

  const filteredTeams = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return teams.filter((team) => {
      const name = team.name ? team.name.toLowerCase() : "";
      const email = team.email ? team.email.toLowerCase() : "";
      const phone = team.phone || "";
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(searchTerm)
      );
    });
  }, [teams, searchTerm]);

  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredTeams.slice(start, start + entriesPerPage);
  }, [filteredTeams, currentPage, entriesPerPage]);

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#155dfc] rounded-full animate-spin" />
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "bg-blue-700 text-white border-blue-200";
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    if (typeof status !== "string") {
      status = status === 1 ? "active" : status === 0 ? "inactive" : "unknown";
    }
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status) => {
    if (typeof status !== "string") {
      return status === 1 ? "Active" : status === 0 ? "Inactive" : "Unknown";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleDeleteTeamClick = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    showNotification("Removing...", "Please wait...", "info", 0);

    try {
      const result = await handleDeleteTeam(id);
      showNotification(
        "Success",
        result.message || `${name} removed successfully.`,
        "success",
        1000,
      );
      // No need to update local state — context already updated via fetchTeams()
    } catch (err) {
      showNotification(
        "Error",
        err.message || "Failed to remove member.",
        "error",
      );
    }
  };

  return (
    <div className=" ">
      {/* View Toggle & Controls */}
      <div className="flex justify-between mb-4">
        <div className="flex flex-row gap-2 items-center">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <div className="flex rounded-lg justify-between px-2 border border-gray-200">
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="appearance-none bg-surface border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown
                  size={16}
                  className="mt-3 text-gray-400 pointer-events-none"
                />
              </div>
              <span className="text-sm py-1 text-gray-600">
                entries per page
              </span>
            </div>
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-5 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full sm:w-48 cursor-text"
              />
            </div>
          </div>
        </div>
        {/* Hidden below `md`: the list view is a four-column table that is not
            readable on a phone, and leaving the toggle visible lets a user
            switch into it with no obvious way back. Cards are the only sensible
            form at that width, so the choice simply is not offered — see the
            matching `md:` gate on the table branch below. */}
        <div className="hidden md:flex gap-1 border-gray-200 p-0.5 rounded-md">
          <div>
            <button
              onClick={() => setIsCardView(false)}
              className={`p-1 rounded-md transition duration-300 ${!isCardView ? "bg-[#155dfc] text-white" : "text-gray-900"} cursor-pointer`}
            >
              <List strokeWidth={1.5} size={20} />
            </button>
            <button
              onClick={() => setIsCardView(true)}
              className={`p-1 rounded-md transition duration-300 ${isCardView ? "bg-[#155dfc] text-white" : "text-gray-900"} cursor-pointer`}
            >
              <Grip strokeWidth={1.5} size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {teamsLoading ? (
        <div className="flex justify-center py-40">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#155dfc] rounded-full animate-spin" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-0">
          <div className="max-w-md mx-auto">
            {/* Modern Network Illustration */}
            <svg
              viewBox="0 0 300 300"
              className="w-64 h-64 mx-auto mb-8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Gradient Definitions */}
              <defs>
                <linearGradient
                  id="nodeGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#155dfc" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0d3d9f" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id="bgGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background */}
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="url(#bgGradient)"
                opacity="0.5"
              />

              {/* Connection Lines - Animated */}
              <g opacity="0.2" stroke="#155dfc" strokeWidth="2">
                <line x1="150" y1="80" x2="90" y2="150">
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.6;0.2"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </line>
                <line x1="150" y1="80" x2="210" y2="150">
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.6;0.2"
                    dur="3s"
                    begin="0.5s"
                    repeatCount="indefinite"
                  />
                </line>
                <line x1="150" y1="80" x2="150" y2="220">
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.6;0.2"
                    dur="3s"
                    begin="1s"
                    repeatCount="indefinite"
                  />
                </line>
                <line x1="90" y1="150" x2="210" y2="150">
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.6;0.2"
                    dur="3s"
                    begin="1.5s"
                    repeatCount="indefinite"
                  />
                </line>
                <line x1="90" y1="150" x2="150" y2="220">
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.6;0.2"
                    dur="3s"
                    begin="2s"
                    repeatCount="indefinite"
                  />
                </line>
                <line x1="210" y1="150" x2="150" y2="220">
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.6;0.2"
                    dur="3s"
                    begin="2.5s"
                    repeatCount="indefinite"
                  />
                </line>
              </g>

              {/* Network Nodes - Main Person */}
              <g filter="url(#glow)">
                <circle cx="150" cy="80" r="32" fill="url(#nodeGradient)" />
                <circle cx="150" cy="80" r="28" fill="white" />
                <circle cx="143" cy="75" r="5" fill="#155dfc" />
                <circle cx="157" cy="75" r="5" fill="#155dfc" />
                <path
                  d="M143 85 Q150 90 157 85"
                  stroke="#155dfc"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle
                  cx="150"
                  cy="80"
                  r="32"
                  fill="none"
                  stroke="#155dfc"
                  strokeWidth="2"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values="32;38;32"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              {/* Secondary Nodes */}
              <g>
                {/* Left Node */}
                <circle
                  cx="90"
                  cy="150"
                  r="24"
                  fill="url(#nodeGradient)"
                  opacity="0.9"
                />
                <circle cx="90" cy="150" r="21" fill="white" />
                <circle cx="85" cy="147" r="4" fill="#155dfc" />
                <circle cx="95" cy="147" r="4" fill="#155dfc" />
                <path
                  d="M85 154 Q90 157 95 154"
                  stroke="#155dfc"
                  strokeWidth="2"
                  fill="none"
                />

                {/* Right Node */}
                <circle
                  cx="210"
                  cy="150"
                  r="24"
                  fill="url(#nodeGradient)"
                  opacity="0.9"
                />
                <circle cx="210" cy="150" r="21" fill="white" />
                <circle cx="205" cy="147" r="4" fill="#155dfc" />
                <circle cx="215" cy="147" r="4" fill="#155dfc" />
                <path
                  d="M205 154 Q210 157 215 154"
                  stroke="#155dfc"
                  strokeWidth="2"
                  fill="none"
                />

                {/* Bottom Node */}
                <circle
                  cx="150"
                  cy="220"
                  r="24"
                  fill="url(#nodeGradient)"
                  opacity="0.9"
                />
                <circle cx="150" cy="220" r="21" fill="white" />
                <circle cx="145" cy="217" r="4" fill="#155dfc" />
                <circle cx="155" cy="217" r="4" fill="#155dfc" />
                <path
                  d="M145 224 Q150 227 155 224"
                  stroke="#155dfc"
                  strokeWidth="2"
                  fill="none"
                />
              </g>

              {/* Floating Particles */}
              <g opacity="0.6">
                <circle cx="60" cy="100" r="4" fill="#155dfc">
                  <animate
                    attributeName="cy"
                    values="100;95;100"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="240" cy="120" r="5" fill="#155dfc">
                  <animate
                    attributeName="cy"
                    values="120;115;120"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="180" cy="60" r="3" fill="#155dfc">
                  <animate
                    attributeName="cy"
                    values="60;55;60"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="70" cy="200" r="4" fill="#155dfc">
                  <animate
                    attributeName="cy"
                    values="200;195;200"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </svg>

            {/* Text */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              No team members yet
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed max-w-sm mx-auto">
              Build your dream team! Invite your first member using the form
              above to start collaborating.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* `|| !isDesktopTable` forces cards below `md` regardless of the
              saved toggle — a user who picked list view on a laptop must not
              land in an unreadable four-column table on their phone. The
              preference itself is untouched and returns on a wider screen. */}
          {isCardView || !isDesktopTable ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {paginatedTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-surface border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center pb-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {team.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="gap-2">
                        <div className="font-medium text-gray-900">
                          {team.name}
                        </div>
                        <span
                          className={`inline-flex px-2 rounded-lg text-xs font-medium border ${getRoleColor(team.role)}`}
                        >
                          {team.role || "No Role"}
                        </span>
                        <span
                          className={`ml-2 inline-flex px-2 rounded-lg text-xs font-medium border ${getStatusColor(team.status)}`}
                        >
                          {getStatusLabel(team.status)}
                        </span>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded cursor-pointer">
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{team.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">
                        {team.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">
                        {team.custom_domain || "Unknown"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <div className="flex gap-2 border-t border-t-gray-200 pt-2">
                        <a
                          href={`mailto:${team.email}`}
                          className="text-gray-400 hover:text-blue-500 cursor-pointer"
                        >
                          <Mail size={16} />
                        </a>
                        <a
                          href={`tel:${team.phone || ""}`}
                          className="text-gray-400 hover:text-blue-500 cursor-pointer"
                        >
                          <Phone size={16} />
                        </a>
                        <a
                          href={`https://wa.me/${team.phone || ""}`}
                          className="text-gray-400 hover:text-blue-500 cursor-pointer"
                        >
                          <MessageCircle size={16} />
                        </a>
                        <a
                          href="https://facebook.com/default"
                          className="text-gray-400 hover:text-blue-500 cursor-pointer"
                        >
                          <FaFacebook size={16} />
                        </a>
                      </div>

                      <div className="flex">
                        <button
                          onClick={() =>
                            handleDeleteTeamClick(team.id, team.name)
                          }
                          className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Table View — Actions Added
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-gray-200">
                  {paginatedTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                            {team.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {team.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {team.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleColor(team.role)}`}
                        >
                          {team.role || "No Role"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(team.status)}`}
                        >
                          {getStatusLabel(team.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            title="edit"
                            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <Edit size={16} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteTeamClick(team.id, team.name)
                            }
                            className="p-1 hover:bg-red-100 rounded cursor-pointer"
                            title="delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-13">
        <span className="text-sm text-gray-600">
          Showing {(currentPage - 1) * entriesPerPage + 1}–
          {Math.min(currentPage * entriesPerPage, filteredTeams.length)} of{" "}
          {filteredTeams.length}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-md border border-gray-200 bg-surface text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from(
            { length: Math.ceil(filteredTeams.length / entriesPerPage) },
            (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md border border-gray-200 ${currentPage === i + 1 ? "bg-blue-700 text-white" : "bg-surface text-gray-700 hover:bg-gray-50"} cursor-pointer`}
              >
                {i + 1}
              </button>
            ),
          )}

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  prev + 1,
                  Math.ceil(filteredTeams.length / entriesPerPage),
                ),
              )
            }
            disabled={
              currentPage === Math.ceil(filteredTeams.length / entriesPerPage)
            }
            className="px-3 py-2 rounded-md border border-gray-200 bg-surface text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
