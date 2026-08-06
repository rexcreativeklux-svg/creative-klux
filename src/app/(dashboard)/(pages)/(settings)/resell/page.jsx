"use client";

import React, { useState, useEffect } from 'react';
import {
    Send, ChevronDown, Search, MoreHorizontal, ChevronLeft, ChevronRight,
    MoreVertical, Mail, MapPin, Trash2, List, Grip
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/app/(components)/NotificationModal";
import ResponsiveTable from "@/app/(components)/ui/ResponsiveTable";

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

    // The current page is CLAMPED for rendering rather than reset in an effect,
    // because three ordinary actions shrink totalPages out from under a user who
    // is already past it: typing in the search, lowering the page size, and
    // deleting the last row on the final page. Unclamped, each one strands them
    // on a page that no longer exists — an empty list, and (now that the
    // controls hide at a single page) nothing left on screen to click to get
    // back. Deriving the value makes that unreachable by construction, with no
    // extra render pass. `currentPage` itself is left alone, so widening the
    // filter again returns the user to where they were.
    const safePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (safePage - 1) * entriesPerPage;
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + entriesPerPage);


    // One definition drives both the desktop table and the mobile card.
    // Built here rather than at module scope because the Remove action closes
    // over handleDeleteResell. Deliberately NOT memoised: that handler is
    // redefined on every render, so a useMemo keyed on it would recompute
    // every time anyway while implying it did not. Four object literals are
    // free to rebuild.
    const memberColumns = [
        {
            key: "member",
            header: "Member",
            primary: true,
            cell: (member) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 bg-gray-300 rounded-lg flex items-center justify-center text-sm font-semibold">
                        {member.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{member.name || "—"}</div>
                        <div className="truncate text-sm text-gray-500">{member.email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (member) => (
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                    {getStatusLabel(member.status)}
                </span>
            ),
        },
        {
            key: "joined",
            header: "Joined",
            cell: (member) => (member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A"),
        },
        {
            key: "action",
            header: "Action",
            cardSlot: "footer",
            cell: (member) => (
                <button
                    onClick={() => handleDeleteResell(member.id, member.email)}
                    aria-label={`Remove ${member.email}`}
                    className="ck-tap p-2 hover:bg-red-100 rounded-lg text-red-600 transition cursor-pointer"
                >
                    <Trash2 size={18} />
                </button>
            ),
        },
    ];
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

            <div className="w-full flex flex-col gap-4 p-3 sm:p-4 rounded-lg bg-surface">
                {/* Header */}
                <div className="space-y-2 pb-4 sm:pb-8">
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
                <div className="w-full py-4 sm:py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    {/* Stacked on a phone (the button stretches to full width via
                        the column's default `stretch`), side by side from `sm`.
                        The extra `py` below `sm` is what lifts both controls to a
                        44px touch target; desktop keeps its original `py-2`. */}
                    <div className="flex flex-col w-full max-w-2xl sm:flex-row gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none cursor-text"
                            disabled={loading}
                        />
                        <button
                            onClick={handleInvite}
                            disabled={loading || !email.trim()}
                            className="ck-tap-pad px-6 py-2.5 sm:py-2 bg-[#155dfc] hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 justify-center transition-colors duration-300 min-w-[120px] cursor-pointer disabled:cursor-not-allowed"
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

                {/* Controls — ONE wrapping row, rearranged by `order-*` on a phone.
                    Below `sm` the search takes a full-width line of its own and the
                    entries select pairs with the view toggle underneath it, spread
                    apart — two balanced rows instead of the three left-aligned
                    stragglers a plain `flex-col` produced. (The search also never
                    actually filled the width there: the old `items-start` parent
                    shrank it to the input's intrinsic size, so `w-full` had nothing
                    to resolve against.)
                    Every `order-*` resets at `sm`, where source order takes over and
                    `ml-auto` on the toggle reproduces the previous `justify-between`
                    — so the desktop bar is unchanged: [entries] [search] … [toggle]. */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6">
                    {/* Entries per page */}
                    <div className="order-2 sm:order-0 flex justify-center items-center flex-col">
                        <div className="flex rounded-lg justify-between px-2 border border-gray-200">
                            <select
                                value={entriesPerPage}
                                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                className="appearance-none  bg-surface border-gray-300 rounded-lg py-2 pr-8 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none cursor-pointer"
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
                    <div className="relative order-1 w-full sm:order-0 sm:w-auto">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full sm:w-48 cursor-text"
                        />
                    </div>

                    {/* View Toggle — `ml-auto` pins it to the right of whichever
                        line it lands on, so it works the same wrapped or not.
                        `ck-tap` grows each 36px button to a 44px touch region on a
                        touchscreen without moving or resizing anything on screen. */}
                    <div className="order-3 sm:order-0 ml-auto flex gap-1 border border-gray-200 p-0.5 rounded-md">
                        <button
                            onClick={() => setIsCardView(false)}
                            aria-label="List view"
                            aria-pressed={!isCardView}
                            className={`ck-tap p-2 rounded transition duration-300 ${!isCardView ? 'bg-[#155dfc] text-white' : 'text-gray-700'} cursor-pointer hover:bg-gray-100`}
                        >
                            <List strokeWidth={1.5} size={20} />
                        </button>
                        <button
                            onClick={() => setIsCardView(true)}
                            aria-label="Card view"
                            aria-pressed={isCardView}
                            className={`ck-tap p-2 rounded transition duration-300 ${isCardView ? 'bg-[#155dfc] text-white' : 'text-gray-700'} cursor-pointer hover:bg-gray-100`}
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
                            {/* 224px of illustration is over half the height of a
                                360px phone's first screen — it pushed the heading
                                that explains the empty state below the fold. Scaled
                                back below `sm`; unchanged from `sm` up. */}
                            <svg
                                viewBox="0 0 240 240"
                                className="w-36 h-36 xs:w-44 xs:h-44 sm:w-56 sm:h-56 mx-auto mb-5 sm:mb-8 text-gray-200"
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
                            <h3 className="text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                                No resell accounts yet
                            </h3>
                            {/* (`mb-` here was a typo — an incomplete class name
                                that produced no CSS at any width.) */}
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Start growing your business! Invite your first resell partner using the form above.
                            </p>
                        </div>
                    </div>
                ) : isCardView ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {paginatedMembers.map((member) => (
                            <div key={member.id} className="bg-surface border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-default">
                                <div className="flex justify-between items-start mb-4">
                                    {/* min-w-0 + wrap: the avatar and the status pill
                                        sit side by side, and at 360px the pill was
                                        squeezing the row rather than dropping below. */}
                                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 shrink-0 bg-gray-300 rounded-full flex items-center justify-center text-lg font-semibold text-gray-700">
                                            {member.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                                            {getStatusLabel(member.status)}
                                        </span>
                                    </div>
                                    <button className="shrink-0 p-2 hover:bg-gray-100 rounded transition cursor-pointer">
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
                    // The Action column is a delete button; behind overflow-x-auto
                    // it sat off the right edge of a phone. <ResponsiveTable> stacks
                    // each row into a card below `md`, action in the card footer.
                    <ResponsiveTable
                        rows={paginatedMembers}
                        rowKey={(m) => m.id}
                        columns={memberColumns}
                    />
                )}

                {/* Pagination — rendered ONLY when there is more than one page to
                    move between. At a single page every part of this bar is
                    noise: the arrows and the lone "1" do nothing, and the count
                    restates what is already on screen ("Showing 1 to 1 of 1
                    entries" above a single card). It also means the empty state
                    is no longer followed by "Showing 1 to 0 of 0 entries".

                    Mobile: the button row is `flex-wrap` + centred below `sm`
                    because it genuinely does not fit otherwise — two arrows and
                    five page numbers need ~330px, where a 360px phone leaves
                    ~310px inside the page gutter and this card's padding.
                    Un-wrapped and right-aligned from `sm`, as before. */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-10 gap-3 sm:gap-4">
                        <div className="text-sm text-gray-700 text-center sm:text-left">
                            Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredMembers.length)} of {filteredMembers.length} entries
                        </div>

                        {/* Every control below reads `safePage`, never `currentPage`
                            — so "previous" always steps back from the page actually
                            on screen, and the highlight cannot land on a button
                            that is no longer rendered. */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                                disabled={safePage === 1}
                                aria-label="Previous page"
                                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    aria-current={safePage === i + 1 ? "page" : undefined}
                                    className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg border transition cursor-pointer ${safePage === i + 1
                                        ? 'bg-[#155dfc] text-white border-[#155dfc]'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                                disabled={safePage >= totalPages}
                                aria-label="Next page"
                                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Resell;