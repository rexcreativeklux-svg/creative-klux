
"use client";

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Plus,
    MoreHorizontal,
    Users,
    Target,
    FileText,
    Video,
    Zap,
    TrendingUp,
    Trash2,
    MoreVertical,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const SocialMediaPlanner = () => {
    const router = useRouter();
    const [currentView, setCurrentView] = useState('week'); // 'week' or 'month'
    const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 23, 7, 21, 0)); // September 23, 2025, 07:21 AM WAT
    const [selectedDay, setSelectedDay] = useState(null); // For highlighting clicked day
    const [showScheduleModal, setShowScheduleModal] = useState(false); // Modal for scheduling
    const [scheduleType, setScheduleType] = useState(null); // Track selected schedule type
    const [selectedSocial, setSelectedSocial] = useState(null); // Track selected ad for modal
    const [scheduledItems, setScheduledItems] = useState([]); // Dynamic storage for scheduled items
    const [menuOpen, setMenuOpen] = useState(null); // Track open menu for scheduled items

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullWeekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getWeekDates = (date) => {
        const week = [];
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day);

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            week.push(currentDate);
        }
        return week;
    };

    const getMonthDates = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const dates = [];
        const currentDate = new Date(startDate);

        while (dates.length < 42) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const navigatePrevious = () => {
        const newDate = new Date(currentDate);
        if (currentView === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
        setSelectedDay(null);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (currentView === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
        setSelectedDay(null);
    };

    const goToToday = () => {
        setCurrentDate(new Date(2025, 8, 23, 7, 21, 0));
        setSelectedDay(null);
    };

    const getMonthYear = () => {
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const PlatformIcon = ({ platform }) => {
        const icons = {
            facebook: <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">f</div>,
            tiktok: <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-white text-xs">t</div>,
            instagram: <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">i</div>,
            linkedin: <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs">in</div>,
            youtube: <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">yt</div>,
        };
        return icons[platform] || null;
    };

    const handleScheduleClick = (type) => {
        setScheduleType(type);
        setShowScheduleModal(true);
    };

    const handleDeleteItem = (itemId) => {
        const updatedItems = scheduledItems.filter(item => item.id !== itemId);
        setScheduledItems(updatedItems);
        localStorage.setItem('scheduledItems', JSON.stringify(updatedItems)); // Update localStorage
        setMenuOpen(null); // Close menu after deletion
    };

    const handleCreateAd = () => {
        router.push('/creatives/social-creatives/create');
    };

    const handleCreatePost = () => {
        router.push('/create-social-creatives'); // Assuming same page for posts
    };

    useEffect(() => {
        // Check localStorage for selected social on mount
        const storedsocial = localStorage.getItem('selectedsocialForScheduling');
        if (storedsocial) {
            const socialData = JSON.parse(storedsocial);
            // Check if the timestamp is recent (e.g., within 5 seconds to ensure fresh navigation)
            const now = new Date().getTime();
            if (now - socialData.timestamp < 5000) {
                setSelectedSocial(socialData);
                setShowScheduleModal(true);
                setScheduleType('social');
            }
            // Clear immediately to prevent relosocial issues
            localStorage.removeItem('selectedsocialForScheduling');
        }
        // Losocial previously scheduled items from localStorage
        const savedItems = localStorage.getItem('scheduledItems');
        if (savedItems) setScheduledItems(JSON.parse(savedItems));
    }, []);

    const handleSchedule = () => {
        if (selectedSocial && showScheduleModal) {
            const newItems = [];
            const platforms = ['facebook', 'tiktok', 'instagram', 'linkedin', 'youtube'];
            platforms.forEach(platform => {
                const dateInput = document.querySelector(`input[type="date"][data-platform="${platform}"]`).value;
                const timeInput = document.querySelector(`input[type="time"][data-platform="${platform}"]`).value;
                if (dateInput && timeInput) {
                    console.log(`Scheduling for ${platform}:`, { date: dateInput, time: timeInput }); // Debug log
                    const newItem = {
                        ...selectedSocial,
                        id: Date.now() + Math.random() + platform, // Unique ID with platform suffix
                        scheduledDate: dateInput,
                        scheduledTime: timeInput,
                        platform: platform,
                    };
                    newItems.push(newItem);
                }
            });
            if (newItems.length > 0) {
                const updatedItems = [...scheduledItems, ...newItems];
                setScheduledItems(updatedItems);
                localStorage.setItem('scheduledItems', JSON.stringify(updatedItems)); // Persist to localStorage
            }
        }
    };

    const WeekView = () => {
        const weekDates = getWeekDates(currentDate);

        return (
            <div className="flex-1">
                <div className="grid grid-cols-7 border h-screen border-gray-200 gap-px bg-gray-200">
                    {weekDates.map((date, index) => {
                        const dateStr = formatDate(date);
                        const items = scheduledItems.filter(item => item.scheduledDate === dateStr) || [];
                        const isToday = dateStr === '2025-09-23';
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                        const isSelected = selectedDay === dateStr;

                        return (
                            <div
                                key={index}
                                className={`bg-white h-full ${isSelected ? 'border-2 border-blue-500' : ''}`}
                                onClick={() => setSelectedDay(dateStr)}
                            >
                                <div className={`p-3 border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'bg-blue-100' : ''}`}>
                                    <div className="text-xs text-gray-500 mb-1">{fullWeekDays[index]}</div>
                                    <div className={`text-lg font-medium ${!isCurrentMonth ? 'text-gray-400' : isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                                <div className="px-2 py-3 space-y-2">
                                    {items.map((item, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            className="relative bg-gray-100 p-2 rounded cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-200 hover:scale-105 hover:z-10"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.querySelector('.details').classList.remove('hidden');
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.querySelector('.details').classList.add('hidden');
                                            }}
                                        >
                                            <div className="flex items-center space-x-2 text-xs">
                                                {item.type === "image" ? (
                                                    <img src={item.content} alt={item.name} className="w-6 h-6 object-cover rounded" />
                                                ) : (
                                                    <video className="w-6 h-6 object-cover rounded">
                                                        <source src={item.content} type="video/mp4" />
                                                    </video>
                                                )}
                                                <span className="font-medium">{item.scheduledTime}</span>
                                                <PlatformIcon platform={item.platform} />
                                            </div>
                                            <button
                                                className="absolute top-0 -right-0.5 p-1 rounded-full cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpen(menuOpen === item.id ? null : item.id);
                                                }}
                                            >
                                                <MoreVertical className="w-3 h-3 text-gray-600" />
                                            </button>
                                            {menuOpen === item.id && (
                                                <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-md z-20">
                                                    <button
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteItem(item.id);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                            <div className="details hidden absolute bg-white p-2 rounded shadow mt-2 w-40 z-10 border border-gray-200">
                                                <h4 className="font-medium">{item.name}</h4>
                                                <p className="text-xs text-gray-600">Platform: {item.platform}</p>
                                                <p className="text-xs text-gray-600">Scheduled: {item.scheduledTime}, {item.scheduledDate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const MonthView = () => {
        const monthDates = getMonthDates(currentDate);
        const weeks = [];
        for (let i = 0; i < monthDates.length; i += 7) {
            weeks.push(monthDates.slice(i, i + 7));
        }

        return (
            <div className="flex-1">
                <div className="grid grid-cols-7 gap-px border border-gray-100">
                    {fullWeekDays.map(day => (
                        <div key={day} className=" p-3 text-center text-sm font-medium text-gray-700">
                            {day.slice(0, 3)}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {monthDates.map((date, index) => {
                        const dateStr = formatDate(date);
                        const items = scheduledItems.filter(item => item.scheduledDate === dateStr) || [];
                        const isToday = dateStr === '2025-09-23';
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                        const isSelected = selectedDay === dateStr;

                        return (
                            <div
                                key={index}
                                className={`bg-white min-h-[120px] border-gray-100 p-2 ${isSelected ? 'border-2 border-blue-500' : ''}`}
                                onClick={() => setSelectedDay(dateStr)}
                            >
                                <div className={`text-sm mb-2 ${!isCurrentMonth ? 'text-gray-400' : isToday ? 'text-blue-600 font-semibold' : 'text-gray-900'} ${isSelected ? 'bg-blue-100' : ''}`}>
                                    {date.getDate()}
                                </div>
                                <div className="space-y-3">
                                    {items.map((item, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            className="relative bg-gray-100 p-2 rounded transition-all duration-300 ease-in-out hover:bg-gray-200 hover:shadow-md hover:scale-105 hover:z-10"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.querySelector('.details').classList.remove('hidden');
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.querySelector('.details').classList.add('hidden');
                                            }}
                                        >
                                            <div className="flex items-center space-x-1 text-xs">
                                                {item.type === "image" ? (
                                                    <img src={item.content} alt={item.name} className="w-5 h-5 object-cover rounded" />
                                                ) : (
                                                    <video className="w-5 h-5 object-cover rounded">
                                                        <source src={item.content} type="video/mp4" />
                                                    </video>
                                                )}
                                                <span className="text-gray-600">{item.scheduledTime}</span>
                                                <PlatformIcon platform={item.platform} />
                                            </div>
                                            <button
                                                className="absolute top-0 right-0 p-1 rounded-full  cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpen(menuOpen === item.id ? null : item.id);
                                                }}
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-600" />
                                            </button>
                                            {menuOpen === item.id && (
                                                <div className="absolute top-5 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                                    <button
                                                        className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteItem(item.id);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                            <div className="details hidden absolute bg-white p-2 rounded shadow-md mt-2 w-48 z-10 border border-gray-200">
                                                <h4 className="font-medium">{item.name}</h4>
                                                <p className="text-xs text-gray-600">Platform: {item.platform}</p>
                                                <p className="text-xs text-gray-600">Scheduled: {item.scheduledTime}, {item.scheduledDate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className=" lg:px-16">
            {/* Header */}
            <div className="bg-white py-4 ">
                <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Planner</h1>
                        <p className="text-sm text-gray-600">Plan your marketing calendar by creating, scheduling and managing your content.</p>
                    </div>
                    <div className="flex items-center space-x-3 flex-wrap">
                        <button
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm cursor-pointer"
                            onClick={handleCreateAd}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create ad</span>
                        </button>
                        <button
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer"
                            onClick={handleCreatePost}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create post</span>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>


            </div>

            <div className="flex flex-col border h-screen rounded border-gray-200 lg:flex-col">
                <div className="flex flex-col px-2 py-3 lg:flex-row bg-gray-50 items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 flex-wrap">
                        <div className="flex bg-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentView('week')}
                                className={`px-3 py-1 text-sm rounded ${currentView === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'} cursor-pointer`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setCurrentView('month')}
                                className={`px-3 py-1 text-sm rounded ${currentView === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'} cursor-pointer`}
                            >
                                Month
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={navigatePrevious}
                                className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                            >
                                Today
                            </button>
                            <button
                                onClick={navigateNext}
                                className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900">
                            {getMonthYear()}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4 flex-wrap">
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 text-sm border-b-2 border-transparent text-gray-500 cursor-pointer">Content type: All</button>
                            <button className="px-3 py-1 text-sm border-b-2 border-transparent text-gray-500 cursor-pointer">Shared to: All</button>
                        </div>
                    </div>
                </div>

                <div className='flex  flex-row'>
                    {/* Calendar Content */}
                    <div className="w-[75%]">
                        {currentView === 'week' ? <WeekView /> : <MonthView />}
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-[25%] bg-white border border-gray-200 ">
                        <div className="flex justify-between items-center border-b border-gray-200 px-2 lg:py-6.5">
                            <button className=" text-sm font-medium text-blue-600cursor-pointer">Goals</button>
                            <button className=" text-sm font-medium text-gray-500 cursor-pointer">Moments</button>
                            <button className=" text-sm font-medium text-gray-500 cursor-pointer">Drafts</button>
                        </div>

                        <div className="space-y-6 py-2 px-3">
                            <div>
                                <div className="flex items-center space-x-2 mb-3">
                                    <Target className="w-5 h-5 text-gray-700" />
                                    <h3 className="font-semibold text-gray-900">Goals</h3>
                                </div>

                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                        <Target className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">Set a goal, track progress and learn helpful tips for your professional success.</p>
                                    </div>
                                </div>

                                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer">
                                    Start new goal
                                </button>
                            </div>

                            <div className="border-t pt-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-gray-700" />
                                    <p className="text-sm text-gray-600">Consider boosting a recent post, so audiences that don't follow you may see it.</p>
                                </div>

                                <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition cursor-pointer">
                                    Boost
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg shadow-xl">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule {selectedSocial?.name || 'Ad'}</h2>
                        <p className="text-sm text-gray-500 mb-6">Set the date and time for each platform.</p>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <PlatformIcon platform="facebook" /> Facebook
                                    </label>
                                    <div className="flex space-x-4">
                                        <div className="relative w-1/2">
                                            <input
                                                type="date"
                                                data-platform="facebook"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.date || formatDate(new Date())}
                                            />
                                        </div>
                                        <div className="relative w-1/2">
                                            <input
                                                type="time"
                                                data-platform="facebook"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.time || "09:00"}
                                            />
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <PlatformIcon platform="tiktok" /> TikTok
                                    </label>
                                    <div className="flex space-x-4">
                                        <div className="relative w-1/2">
                                            <input
                                                type="date"
                                                data-platform="tiktok"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.date || formatDate(new Date())}
                                            />
                                        </div>
                                        <div className="relative w-1/2">
                                            <input
                                                type="time"
                                                data-platform="tiktok"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.time || "09:00"}
                                            />
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <PlatformIcon platform="instagram" /> Instagram
                                    </label>
                                    <div className="flex space-x-4">
                                        <div className="relative w-1/2">
                                            <input
                                                type="date"
                                                data-platform="instagram"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.date || formatDate(new Date())}
                                            />
                                        </div>
                                        <div className="relative w-1/2">
                                            <input
                                                type="time"
                                                data-platform="instagram"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.time || "09:00"}
                                            />
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <PlatformIcon platform="linkedin" /> LinkedIn
                                    </label>
                                    <div className="flex space-x-4">
                                        <div className="relative w-1/2">
                                            <input
                                                type="date"
                                                data-platform="linkedin"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.date || formatDate(new Date())}
                                            />
                                        </div>
                                        <div className="relative w-1/2">
                                            <input
                                                type="time"
                                                data-platform="linkedin"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.time || "09:00"}
                                            />
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <PlatformIcon platform="youtube" /> YouTube
                                    </label>
                                    <div className="flex space-x-4">
                                        <div className="relative w-1/2">
                                            <input
                                                type="date"
                                                data-platform="youtube"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.date || formatDate(new Date())}
                                            />
                                        </div>
                                        <div className="relative w-1/2">
                                            <input
                                                type="time"
                                                data-platform="youtube"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                defaultValue={selectedSocial?.time || "09:00"}
                                            />
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 mt-6">
                                <button
                                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 cursor-pointer"
                                    onClick={() => {
                                        handleSchedule();
                                        setShowScheduleModal(false);
                                    }}
                                >
                                    Schedule All
                                </button>
                                <button
                                    className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition duration-300 cursor-pointer"
                                    onClick={() => setShowScheduleModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialMediaPlanner;