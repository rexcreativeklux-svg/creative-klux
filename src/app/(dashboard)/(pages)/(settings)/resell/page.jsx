"use client";

import React, { useState, useEffect } from 'react';
import {
    Send, ChevronDown, Search, MoreHorizontal, ChevronLeft, ChevronRight,
    MoreVertical, Mail, MapPin, Trash2, List, Grip
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/app/(components)/NotificationModal";

const Resell = () => {
    const { fetchResells, createResell, deleteResell } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [resellMembers, setResellMembers] = useState([]);
    const [isCardView, setIsCardView] = useState(false);

    const [notification, setNotification] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        duration: 1000,
    });

    const showNotification = (title, message, type = "info", duration = 1000) => {
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
        showNotification("Sending Invite...", "Please wait while we send the invitation.", "info", 0);

        try {
            await createResell(email.trim());
            closeNotification();
            showNotification("Success!", `${email.trim()} has been invited to resell.`, "success");

            const updated = await fetchResells();
            setResellMembers(Array.isArray(updated) ? updated : []);
            setEmail("");
        } catch (err) {
            closeNotification();
            showNotification("Failed", err.message || "Could not send invitation.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResell = async (id, email) => {
        if (!confirm(`Remove ${email} from resell accounts?`)) return;

        showNotification("Removing...", "Please wait...", "info", 0);

        try {
            await deleteResell(id);
            setResellMembers(prev => prev.filter(m => m.id !== id));
            closeNotification();
            showNotification("Success", "Resell account removed.", "success");
        } catch (err) {
            closeNotification();
            showNotification("Error", err.message || "Failed to remove resell account.", "error");
        }
    };

    useEffect(() => {
        const loadResells = async () => {
            setLoading(true);
            try {
                const result = await fetchResells();
                setResellMembers(Array.isArray(result) ? result : []);
            } catch (err) {
                showNotification("Error", "Failed to load resell accounts.", "error");
                setResellMembers([]);
            } finally {
                setLoading(false);
            }
        };
        loadResells();
    }, [fetchResells]);

    const filteredMembers = resellMembers.filter(member =>
        (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredMembers.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + entriesPerPage);

    const getStatusLabel = (status) => {
        if (status === 1 || status === "1") return "Active";
        if (status === 0 || status === "0") return "Inactive";
        return "Pending";
    };

    const getStatusColor = (status) => {
        if (status === 1 || status === "1") return "bg-green-100 text-green-800 border-green-200";
        if (status === 0 || status === "0") return "bg-red-100 text-red-800 border-red-200";
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    };

    const activeCount = resellMembers.filter(m => m.status === 1 || m.status === "1").length;

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

            <div className="w-full flex flex-col gap-4 p-4 rounded-lg bg-white">
                {/* Header */}
                <div className="space-y-2 pb-8">
                    <h1 className="font-semibold text-2xl">Resell accounts</h1>
                    <p className="text-gray-600 text-sm">Expand Your Business by Managing Resell Accounts Effectively</p>
                </div>

                {/* Invite Section */}
                <div className="border-b pb-2 border-b-gray-200">
                    <h1 className="text-md sm:text-lg font-medium text-gray-900 mb-2">
                        Invite Resell Members
                    </h1>
                    <p className="text-sm text-gray-600">
                        {activeCount}/5 members available in your plan.
                    </p>
                </div>

                {/* Invite Form */}
                <div className="w-full py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <div className="flex flex-col w-full max-w-2xl sm:flex-row gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none cursor-text"
                            disabled={loading}
                        />
                        <button
                            onClick={handleInvite}
                            disabled={loading || !email.trim()}
                            className="px-6 py-2 bg-[#155dfc] hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 justify-center transition-colors duration-300 min-w-[120px] cursor-pointer disabled:cursor-not-allowed"
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

                {/* Controls — Fixed Layout */}
                <div className="flex flex-col  sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center w-full sm:w-auto">
                        {/* Entries per page */}
                        <div className="flex justify-center items-center flex-col">
                            <div className="flex rounded-lg justify-between px-2 border border-gray-200">
                                <select
                                    value={entriesPerPage}
                                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                    className="appearance-none  bg-white border-gray-300 rounded-lg py-2 pr-8 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <ChevronDown size={16} className="mt-3 text-gray-400 pointer-events-none" />
                            </div>
                            {/* <span className="text-xs py-1 text-gray-600">entries per page</span> */}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full sm:w-48 cursor-text"
                            />
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-1 border border-gray-200 p-0.5 rounded-md">
                        <button
                            onClick={() => setIsCardView(false)}
                            className={`p-2 rounded transition duration-300 ${!isCardView ? 'bg-[#155dfc] text-white' : 'text-gray-700'} cursor-pointer hover:bg-gray-100`}
                        >
                            <List strokeWidth={1.5} size={20} />
                        </button>
                        <button
                            onClick={() => setIsCardView(true)}
                            className={`p-2 rounded transition duration-300 ${isCardView ? 'bg-[#155dfc] text-white' : 'text-gray-700'} cursor-pointer hover:bg-gray-100`}
                        >
                            <Grip strokeWidth={1.5} size={20} />
                        </button>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-40">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#155dfc] rounded-full animate-spin" />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center">
                        <div className="max-w-md mx-auto">
                            {/* Beautiful SVG Illustration */}
                            <svg
                                viewBox="0 0 240 240"
                                className="w-56 h-56 mx-auto mb-8 text-gray-200"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Background Circle */}
                                <circle cx="120" cy="120" r="110" className="fill-gray-100" />

                                {/* Main Dollar Bill Stack */}
                                <g transform="translate(70, 80)">
                                    {/* Back bills (shadow effect) */}
                                    <rect x="8" y="-4" width="84" height="48" rx="4" className="fill-gray-300" opacity="0.4" />
                                    <rect x="4" y="0" width="84" height="48" rx="4" className="fill-gray-300" opacity="0.6" />

                                    {/* Front bill */}
                                    <rect x="0" y="4" width="84" height="48" rx="4" className="fill-[#85bb65] stroke-[#5a8545]" strokeWidth="2" />

                                    {/* Dollar sign */}
                                    <text x="42" y="36" fontSize="28" fontWeight="bold" className="fill-white" textAnchor="middle">$</text>

                                    {/* Decorative corners */}
                                    <circle cx="8" cy="12" r="3" className="fill-[#5a8545]" opacity="0.6" />
                                    <circle cx="76" cy="12" r="3" className="fill-[#5a8545]" opacity="0.6" />
                                    <circle cx="8" cy="44" r="3" className="fill-[#5a8545]" opacity="0.6" />
                                    <circle cx="76" cy="44" r="3" className="fill-[#5a8545]" opacity="0.6" />
                                </g>

                                {/* Floating coins (background decoration) */}
                                <g opacity="0.5">
                                    {/* Coin 1 */}
                                    <circle cx="45" cy="165" r="12" className="fill-[#ffd700] stroke-[#daa520]" strokeWidth="2" />
                                    <text x="45" y="170" fontSize="12" fontWeight="bold" className="fill-[#daa520]" textAnchor="middle">$</text>

                                    {/* Coin 2 */}
                                    <circle cx="195" cy="55" r="10" className="fill-[#ffd700] stroke-[#daa520]" strokeWidth="2" />
                                    <text x="195" y="59" fontSize="10" fontWeight="bold" className="fill-[#daa520]" textAnchor="middle">$</text>
                                </g>

                                {/* Small sparkles */}
                                <circle cx="70" cy="60" r="3" className="fill-[#155dfc]" opacity="0.6" />
                                <circle cx="170" cy="180" r="2" className="fill-[#155dfc]" opacity="0.6" />
                            </svg>

                            {/* Text */}
                            <h3 className="text-xl font-bold text-gray-800 mb-3">
                                No resell accounts yet
                            </h3>
                            <p className="text-gray-600 mb- leading-relaxed">
                                Start growing your business! Invite your first resell partner using the form above.
                            </p>
                        </div>
                    </div>
                ) : isCardView ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {paginatedMembers.map((member) => (
                            <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-default">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-semibold text-gray-700">
                                            {member.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                                            {getStatusLabel(member.status)}
                                        </span>
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 rounded transition cursor-pointer">
                                        <MoreVertical size={18} className="text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700 text-sm break-all">{member.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-600 text-sm">
                                            Joined: {member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleDeleteResell(member.id, member.email)}
                                        className="p-3 hover:bg-red-50 rounded-lg text-red-600 transition cursor-pointer"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-sm font-semibold">
                                                    {member.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{member.name || "—"}</div>
                                                    <div className="text-sm text-gray-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                                                {getStatusLabel(member.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteResell(member.id, member.email)}
                                                className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4">
                    <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredMembers.length)} of {filteredMembers.length} entries
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg border transition cursor-pointer ${currentPage === i + 1
                                    ? 'bg-[#155dfc] text-white border-[#155dfc]'
                                    : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Resell;