"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Mail,
    Phone,
    MapPin,
    MessageCircle,
    Facebook,
    User,
    MoreVertical,
    MoreHorizontal,
    List,
    Grip,
    ChevronDown,
    Search,
    ChevronRight,
    ChevronLeft,
    Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function TeamsList({ onActiveCountChange }) {
    const { fetchTeams, handleDeleteTeam } = useAuth();

    // --- State Hooks ---
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCardView, setIsCardView] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");


    // --- Fetch Teams ---
    useEffect(() => {
        const loadTeams = async () => {
            setLoading(true);
            try {
                const allTeamsRaw = await fetchTeams();
                const allTeamsObj =
                    typeof allTeamsRaw === "string" ? JSON.parse(allTeamsRaw) : allTeamsRaw;
                setTeams(allTeamsObj.teams || []);
            } catch (err) {
                console.error("Failed to load teams:", err);
            } finally {
                setLoading(false);
            }
        };
        loadTeams();
    }, [fetchTeams]);

    //  whenever teams update, compute active count & send up
    useEffect(() => {
        if (onActiveCountChange) {
            const activeCount = teams.filter((t) => {
                if (typeof t.status !== "string") {
                    return t.status === 1; // handle numeric status
                }
                return t.status.toLowerCase() === "active";
            }).length;

            onActiveCountChange(activeCount);
        }
    }, [teams, onActiveCountChange]);

    // --- Memo Hooks (must run unconditionally) ---
    const filteredTeams = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return teams.filter((team) => {
            const name = team.name ? team.name.toLowerCase() : "";
            const email = team.email ? team.email.toLowerCase() : "";
            const phone = team.phone || "";

            return name.includes(term) || email.includes(term) || phone.includes(searchTerm);
        });
    }, [teams, searchTerm]);


    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredTeams.slice(start, start + entriesPerPage);
    }, [filteredTeams, currentPage, entriesPerPage]);

    // --- Conditional Return ---
    if (loading) return <p>Loading teams...</p>;

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

    const handleDeleteTeamClick = async (id) => {
        try {
            const result = await handleDeleteTeam(id);
            setModalMessage(result.message);
            setShowModal(true);
            setTeams((prev) => prev.filter((team) => team.id !== id));
        } catch (err) {
            setModalMessage(err.message);
            setShowModal(true);
        }
    };




    return (
        <div>
            {/* View Toggle & Controls */}
            <div className="flex justify-between mb-4">
                <div className="flex flex-row gap-2 items-center">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-col">
                            <div className="flex rounded-lg justify-between px-2 border border-gray-200">
                                <select
                                    value={entriesPerPage}
                                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                    className="appearance-none bg-white border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <ChevronDown size={16} className="mt-3 text-gray-400" />
                            </div>
                            <span className="text-sm py-1 text-gray-600">entries per page</span>
                        </div>
                        <div className="relative">
                            <Search size={17} className="absolute left-3 top-5 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full sm:w-48"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-1  border-gray-200 p-0.5 rounded-md">
                    <div>
                        <button
                            onClick={() => setIsCardView(false)}
                            className={`p-1 rounded-md transition duration-300 ${!isCardView ? "bg-[#155dfc] text-white" : "text-black"}`}
                        >
                            <List strokeWidth={1.5} size={20} />
                        </button>
                        <button
                            onClick={() => setIsCardView(true)}
                            className={`p-1 rounded-md transition duration-300 ${isCardView ? "bg-[#155dfc] text-white" : "text-black"}`}
                        >
                            <Grip strokeWidth={1.5} size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Card View */}
            <div>
                {isCardView ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {paginatedTeams.map((team) => (
                            <div
                                key={team.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-center pb-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                            {team.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="gap-2">
                                            <div className="font-medium text-gray-900">{team.name}</div>
                                            <span
                                                className={`inline-flex px-2 rounded-lg text-xs font-medium border ${getRoleColor(team.role)}`}
                                            >
                                                {team.role || "No Role"}
                                            </span>
                                            <span className={`ml-2 inline-flex px-2 rounded-lg text-xs font-medium border ${getStatusColor(team.status)}`}>
                                                {getStatusLabel(team.status)}

                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-1 hover:bg-gray-100 rounded">
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
                                        <span className="text-gray-600">{team.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-600">{team.custom_domain || "Unknown"}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <div className="flex gap-2 border-t border-t-gray-200 pt-2 ">
                                            <a href={`mailto:${team.email}`} className="text-gray-400 hover:text-blue-500">
                                                <Mail size={16} />
                                            </a>
                                            <a href={`tel:${team.phone || ""}`} className="text-gray-400 hover:text-blue-500">
                                                <Phone size={16} />
                                            </a>
                                            <a href={`https://wa.me/${team.phone || ""}`} className="text-gray-400 hover:text-blue-500">
                                                <MessageCircle size={16} />
                                            </a>
                                            <a href="https://facebook.com/default" className="text-gray-400 hover:text-blue-500">
                                                <Facebook size={16} />
                                            </a>

                                        </div>

                                        <div className="flex">
                                            <button
                                                onClick={() => handleDeleteTeamClick(team.id)}
                                                className="p-1 hover:bg-red-100 rounded text-red-500"
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
                    // Table View
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedTeams.map((team) => (
                                    <tr key={team.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                                                    {team.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{team.name}</div>
                                                    <div className="text-sm text-gray-500">{team.email}</div>
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
                                            <button className="p-1 hover:bg-gray-100 rounded">
                                                <MoreHorizontal size={16} className="text-gray-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                        <div className="bg-white rounded-lg p-20 flex flex-col max-w-lg items-center shadow border border-gray-200 animate-fadeIn">

                            {/* Animated checkmark */}
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

                            {/* Success message */}
                            <p className="text-center py-3 font-semibold">{modalMessage}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * entriesPerPage + 1}–
                    {Math.min(currentPage * entriesPerPage, filteredTeams.length)} of {filteredTeams.length}
                </span>

                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md border ${currentPage === 1
                            ? "p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {Array.from(
                        { length: Math.ceil(filteredTeams.length / entriesPerPage) },
                        (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 rounded-md border ${currentPage === i + 1
                                    ? "bg-blue-700 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                {i + 1}
                            </button>
                        )
                    )}

                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(prev + 1, Math.ceil(filteredTeams.length / entriesPerPage))
                            )
                        }
                        disabled={currentPage === Math.ceil(filteredTeams.length / entriesPerPage)}
                        className={`px-3 py-1 rounded-md border ${currentPage === Math.ceil(filteredTeams.length / entriesPerPage)
                            ? "p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

        </div>
    );
}
