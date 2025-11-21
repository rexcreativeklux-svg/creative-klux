"use client";

import React, { useState, useEffect } from 'react';
import {
    Send, ChevronDown, Search, MoreHorizontal, ChevronLeft, ChevronRight,
    User, MoreVertical, Mail, Phone, MapPin, MessageCircle, Facebook,
    List, Grip,
    Trash2
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext"; // ✅ use your auth

const Resell = () => {
    const { fetchResells, createResell, deleteResell } = useAuth(); // ✅ new
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [resellMembers, setResellMembers] = useState([]); // ✅ renamed

    const [isCardView, setIsCardView] = useState(false);

    const handleInvite = async () => {
        if (!email) return;

        setLoading(true);
        try {
            const response = await createResell(email.trim());

            console.log("Invite response:", response);

            // If successful, refresh members
            const updated = await fetchResells();
            setResellMembers(Array.isArray(updated) ? updated : []);
            setEmail("");
        } catch (err) {
            console.error("Error inviting member:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResell = async (id) => {
        if (!id) return;

        try {
            const result = await deleteResell(id); // API call
            // Remove deleted member from state
            setResellMembers(prev => prev.filter(member => member.id !== id));

            console.log(result.message || "Resell deleted successfully");
        } catch (err) {
            console.error("Failed to delete resell:", err.message);
        }
    };



    // Fetch resells on mount
    useEffect(() => {
        const loadResells = async () => {
            setLoading(true);
            try {
                const result = await fetchResells();
                console.log("Resells API result:", result);

                if (Array.isArray(result)) {
                    setResellMembers(result);
                } else {
                    setResellMembers([]);
                }
            } catch (err) {
                console.error("Error fetching resells:", err);
                setResellMembers([]);
            } finally {
                setLoading(false);
            }
        };

        loadResells();
    }, [fetchResells]);



    // Filtering
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
        return "Unknown";
    };

    const getStatusColor = (status) => {
        if (status === 1 || status === "1") {
            return "bg-green-100 text-green-800 border-green-200";
        }
        if (status === 0 || status === "0") {
            return "bg-red-100 text-red-800 border-red-200";
        }
        return "bg-gray-100 text-gray-800 border-gray-200";
    };



    return (
        <div className="w-full flex flex-col justify-between gap-5 p-4 sm:py-6 sm:px-10 bg-white">
            {/* Header */}
            <div className="space-y-2 pb-10">
                <h1 className="font-semibold text-2xl">Resell accounts</h1>
                <p className="text-gray-600">Expand Your Business by Managing Resell Accounts Effectively</p>
            </div>

            {/* Invite Section */}
            <div className=" border-b pb-4 border-b-gray-200">
                <h1 className="text-md sm:text-lg font-medium text-gray-900 mb-2">
                    Invite Resell Members
                </h1>
                <p className="text-sm  text-gray-600">
                    {resellMembers.filter(
                        m => String(m.status || "").toLowerCase() === "active"
                    ).length}/5 members available in your plan.

                </p>
            </div>

            {/* Invite Form */}
            <div className="w-full py-10">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <div className="flex flex-col w-[70%] sm:flex-row gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                        disabled={loading}
                    />
                    <button
                        onClick={handleInvite}
                        disabled={loading || !email}
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

            {/* View Toggle */}
            <div className="flex justify-between mb-4 ">
                <div className='flex flex-row gap-2'>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div className="flex flex-col ">
                            <div className="flex rounded-lg justify-between px-2 border border-gray-200">
                                <select
                                    value={entriesPerPage}
                                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                    className="appearance-none bg-white  border-gray-300 rounded-lg py-2  focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <ChevronDown size={16} className="mt-3 text-gray-400" />
                            </div>
                            <span className="text-sm py-1 text-gray-600">entries per page</span>
                        </div>

                    </div>
                    <div className="flex items-center mt-[-44px] gap-2">
                        {/* <span className="text-sm text-gray-600">Search:</span> */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full sm:w-38"
                                placeholder="Search..."
                            />
                        </div>
                    </div>
                </div>
                <div className=''>
                    <div className='border border-gray-200 p-0.5 rounded-md'>
                        <button
                            onClick={() => setIsCardView(false)}
                            className={`p-1 rounded-md transition duration-300 ${!isCardView ? 'bg-[#155dfc] text-white' : ' text-black'}`}
                        >
                            <List strokeWidth={1.5} size={20} />
                        </button>
                        <button
                            onClick={() => setIsCardView(true)}
                            className={`p-1 rounded-md transition duration-300 ${isCardView ? 'bg-[#155dfc] text-white' : ' text-black'}`}
                        >
                            <Grip strokeWidth={1.5} size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table or Card View */}
            {loading ? (
                <p>Loading resells...</p>
            ) : filteredMembers.length === 0 ? (
                <p className="text-gray-500 italic">No resells found.</p>
            ) : isCardView ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedMembers.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            {/* Card header */}
                            <div className="flex justify-between items-center pb-2 gap-3">
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        {member.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className=' flex justify-center items-center'>
                                        <span
                                            className={`inline-flex px-2 rounded-lg text-xs font-medium border ${getStatusColor(
                                                member.status
                                            )}`}
                                        >
                                            {getStatusLabel(member.status)}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <MoreVertical size={16} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Card details */}
                            <div className="mt-4 flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Mail className="w-5 h-5 mt-0.5 text-gray-400" />
                                    <div className="text-gray-600">{member.email}</div>
                                </div>
                                {/* <div className="flex gap-2">
                                    <Phone className="w-5 h-5 mt-0.5 text-gray-400" />
                                    <div className="text-gray-600">{member.phone || "N/A"}</div>
                                </div> */}
                                <div className="flex gap-2">
                                    <MapPin className="w-5 h-5 mt-0.5 text-gray-400" />
                                    <div className="text-gray-600">
                                        Joined:{" "}
                                        {member.created_at
                                            ? new Date(member.created_at).toLocaleDateString()
                                            : "N/A"}
                                    </div>
                                </div>

                            </div>

                            <div className="flex">
                                <button
                                    onClick={() => handleDeleteResell(member.id)}
                                    className="p-1 hover:bg-red-100 rounded text-red-500"
                                >
                                    <Trash2 size={16} />
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Member
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Joined
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                                                {member.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {member.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                member.status
                                            )}`}
                                        >
                                            {getStatusLabel(member.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {member.created_at
                                            ? new Date(member.created_at).toLocaleDateString()
                                            : "N/A"}
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



            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredMembers.length)} of {filteredMembers.length} {filteredMembers.length === 1 ? 'entry' : 'entries'}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 text-sm border rounded ${currentPage === pageNum
                                        ? 'bg-blue-700 text-white border-blue-800'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Resell;