"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    MoreVertical,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Edit,
    Copy,
    Trash2,
    TrendingUp,
    TrendingDown,
    List,
    Grip
} from 'lucide-react';
import { mockData } from '../../data/mockProducts';

const ITEMS_PER_PAGE = 10;

export default function ProductsTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('All');
    const [platformFilter, setPlatformFilter] = useState('All');
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640; // Tailwind sm breakpoint
    const [isCardView, setIsCardView] = useState(isMobile);

    // Simulate API fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                await new Promise(resolve => setTimeout(resolve, 1000));
                setData(mockData);
                setIsLoading(false);
            } catch (err) {
                setError('Failed to fetch data');
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtering and searching
    const filteredData = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        return data.filter(item => {
            if (!item || !item.name || !item.campaign || !item.brand) {
                return false;
            }
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.brand.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            const matchesPlatform = platformFilter === 'All' || item.platform === platformFilter;
            return matchesSearch && matchesStatus && matchesPlatform;
        });
    }, [data, searchTerm, statusFilter, platformFilter]);

    // Sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        return [...filteredData].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedItems(new Set(paginatedData.map(item => item.id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (id, checked) => {
        const newSelected = new Set(selectedItems);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedItems(newSelected);
    };

    const toggleStatus = (id) => {
        console.log(`Toggling status for ${id}`);
    };

    const duplicateAd = (id) => {
        console.log(`Duplicating ad ${id}`);
    };

    const deleteAd = (id) => {
        console.log(`Deleting ad ${id}`);
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ChevronUp className="w-4 h-4 opacity-30" />;
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />;
    };

    const MetricChange = ({ value, isPercentage = false }) => {
        const isPositive = value >= 0;
        const Icon = isPositive ? TrendingUp : TrendingDown;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        return (
            <span className={`inline-flex items-center text-xs ${color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {isPercentage ? `${Math.abs(value)}%` : Math.abs(value)}
            </span>
        );
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            Active: 'bg-green-100 text-green-800',
            Paused: 'bg-yellow-100 text-yellow-800',
            Draft: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const ActionDropdown = ({ item }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <button
                            onClick={() => { toggleStatus(item.id); setIsOpen(false); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                            {item.status === 'Active' ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                            {item.status === 'Active' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                            onClick={() => { console.log('Edit', item.id); setIsOpen(false); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                        </button>
                        <button
                            onClick={() => { duplicateAd(item.id); setIsOpen(false); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                            <Copy className="w-3 h-3 mr-2" />
                            Duplicate
                        </button>
                        <button
                            onClick={() => { deleteAd(item.id); setIsOpen(false); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                        >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="text-center text-red-600">{error}</div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="text-center text-gray-600">No data available</div>
            </div>
        );
    }

    return (
        <div className="py-6 z-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="sm:text-xl flex px-5 font-semibold text-gray-900">Products Table</h1>
                <div className="flex items-center space-x-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Draft">Draft</option>
                    </select>
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="All">All Platforms</option>
                        <option value="FB">Facebook</option>
                        <option value="IG">Instagram</option>
                        <option value="TW">Twitter</option>
                        <option value="LI">LinkedIn</option>
                        <option value="YT">YouTube</option>
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-5 pr-4 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-64"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    <div className="flex gap-1 border-gray-200 p-0.5 rounded-md">
                        <button
                            onClick={() => {
                                setIsCardView(false);
                                console.log("View toggled: Table");
                            }}
                            className={`p-1 rounded-md transition duration-300 ${!isCardView ? "bg-blue-600 text-white" : "text-black"}`}
                        >
                            <List strokeWidth={1.5} size={20} />
                        </button>
                        <button
                            onClick={() => {
                                setIsCardView(true);
                                console.log("View toggled: Card");
                            }}
                            className={`p-1 rounded-md transition duration-300 ${isCardView ? "bg-blue-600 text-white" : "text-black"}`}
                        >
                            <Grip strokeWidth={1.5} size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                Bulk Edit
                            </button>
                            <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {isCardView ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedData.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-center pb-2 gap-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(item.id)}
                                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                                        {item.platform}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-sm text-gray-500">{item.id}</div>
                                    </div>
                                </div>
                                <ActionDropdown item={item} />
                            </div>
                            <div className="mt-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">Campaign:</span>
                                    <span className="text-sm text-gray-900">{item.campaign}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">Brand:</span>
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                        style={{ backgroundColor: item.brandColor }}
                                    >
                                        {item.brand[0]}
                                    </div>
                                    <span className="text-sm text-gray-900">{item.brand}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">CTR:</span>
                                    <div className="text-sm font-semibold text-gray-900">{item.ctr}%</div>
                                    <MetricChange value={item.ctrChange} isPercentage />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">Status:</span>
                                    <StatusBadge status={item.status} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">Impressions:</span>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {(item.impressions / 1000).toFixed(1)}k
                                    </div>
                                    <MetricChange value={item.impressionsChange} isPercentage />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-tl-lg rounded-tr-lg border border-gray-200 overflow-hidden max-h-[700px] overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            <SortIcon column="name" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('campaign')}
                                    >
                                        <div className="flex items-center">
                                            Campaign
                                            <SortIcon column="campaign" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('brand')}
                                    >
                                        <div className="flex items-center">
                                            Brand
                                            <SortIcon column="brand" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('ctr')}
                                    >
                                        <div className="flex items-center">
                                            CTR
                                            <SortIcon column="ctr" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            <SortIcon column="status" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('impressions')}
                                    >
                                        <div className="flex items-center">
                                            Impressions
                                            <SortIcon column="impressions" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.id)}
                                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                                                    {item.platform}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{item.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.campaign}</td>
                                        <td className="px-6 py-4">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                                style={{ backgroundColor: item.brandColor }}
                                            >
                                                {item.brand[0]}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{item.ctr}%</div>
                                            <MetricChange value={item.ctrChange} isPercentage />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {(item.impressions / 1000).toFixed(1)}k
                                            </div>
                                            <MetricChange value={item.impressionsChange} isPercentage />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionDropdown item={item} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="bg-white px-6 py-6.5 flex items-center justify-between border border-gray-200 rounded-br-lg rounded-bl-lg">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                            <span className="px-3 py-2 text-gray-500">...</span>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} entries
                </div>
            </div>
        </div>
    );
}