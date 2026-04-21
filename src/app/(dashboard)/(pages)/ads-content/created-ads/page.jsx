"use client";

import React, { useState } from 'react';
import { MoreVertical, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreatedAds() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(null);

  // Mock data for created ads with Pexels images and real videos
  const mockAds = [
    { id: 1, name: "Summer Sale Ad", type: "image", content: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg", date: "2025-09-22", time: "10:00" },
    { id: 2, name: "New Product Launch", type: "video", content: "/videos/sea-waves.mp4", date: "2025-09-23", time: "14:00" },
    { id: 3, name: "Holiday Discount", type: "image", content: "https://images.pexels.com/photos/443446/pexels-photo-443446.jpeg", date: "2025-09-25", time: "09:00" },
    { id: 4, name: "Back to School Promo", type: "video", content: "/videos/city-aerial.mp4", date: "2025-09-28", time: "16:00" },
  ];

  const handleSchedule = (ad) => {
    // Store ad data in localStorage with a timestamp to ensure freshness
    const adData = {
      ...ad,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem('selectedAdForScheduling', JSON.stringify(adData));
    router.push('/ads-content/ads-planner');
    setMenuOpen(null); // Close menu
  };

  const handleCreate = () => {
    router.push('/creatives/ads-creatives');
  };

  return (
    <div className="px-17 py-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-xl font-semibold text-gray-900">Created Ads</h1>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm cursor-pointer transition duration-300"
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </button>
      </div>
      {mockAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <img
            src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg"
            alt="No ads yet"
            className="w-64 h-48 object-cover opacity-50 rounded-lg mb-6"
          />
          <p className="text-gray-600 text-lg mb-4">No ads have been created yet. Start by creating your first ad to kickstart your campaign!</p>
          <button
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer transition duration-300"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Ad</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-700 overflow-hidden cursor-pointer">
              <div className="relative">
                {ad.type === "image" ? (
                  <img src={ad.content} alt={ad.name} className="w-full h-40 object-cover" />
                ) : (
                  <video className="w-full h-40 object-cover" controls>
                    <source src={ad.content} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                <button
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-gray-50 transition duration-300 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === ad.id ? null : ad.id);
                  }}
                >
                  <MoreVertical className="w-5 h-5 text-white hover:text-black transition duration-300" />
                </button>
                {menuOpen === ad.id && (
                  <div className="absolute top-10 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSchedule(ad)}
                    >
                      Schedule <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-md font-medium text-gray-900">{ad.name}</h3>
                <p className="text-sm text-gray-600">{ad.date} at {ad.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}