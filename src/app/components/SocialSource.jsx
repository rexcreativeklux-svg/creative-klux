"use client";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaTwitter,
  FaPinterest,
  FaDiscord,
  FaYoutube,
} from "react-icons/fa";

const sources = [
  { name: "Instagram", icon: <FaInstagram className="text-pink-600" />, views: "34.36k", revenue: "$5.17k", viewsUp: true, revenueUp: false },
  { name: "Facebook", icon: <FaFacebook className="text-blue-600" />, views: "24.62k", revenue: "$4.32k", viewsUp: false, revenueUp: true },
  { name: "Tik Tok", icon: <FaTiktok className="text-black" />, views: "17.36k", revenue: "$3.47k", viewsUp: false, revenueUp: false },
  { name: "Twitter", icon: <FaTwitter className="text-sky-500" />, views: "49.32k", revenue: "$1.26k", viewsUp: true, revenueUp: true },
  { name: "Pinterest", icon: <FaPinterest className="text-red-600" />, views: "6.92k", revenue: "$926", viewsUp: true, revenueUp: true },
  { name: "Discord", icon: <FaDiscord className="text-indigo-500" />, views: "639", revenue: "$517", viewsUp: true, revenueUp: true },
  { name: "Youtube", icon: <FaYoutube className="text-red-600" />, views: "391", revenue: "$268", viewsUp: false, revenueUp: false },
];

export default function SocialSource() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-meduim text-gray-800">Social Source</h2>
          <p className="text-2xl font-meduim text-gray-900">
            135K{" "}
            <span className="text-sm text-green-500 font-medium">+3.1%</span>
          </p>
          <p className="text-sm text-gray-500">View in this month</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal />
        </button>
      </div>

      {/* Social List */}
      <ul className="space-y-4">
        {sources.map((src, idx) => (
          <li key={idx} className="flex items-center justify-between">
            {/* Left: Icon + Name */}
            <div className="flex items-center gap-3">
              <div className="text-xl">{src.icon}</div>
              <span className="text-gray-800 font-normal">{src.name}</span>
            </div>

            {/* Right: Views + Revenue */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="font-normal">{src.views}</span>
                <span className={src.viewsUp ? "text-green-500" : "text-red-500"}>
                  {src.viewsUp ? "↑" : "↓"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-normal">{src.revenue}</span>
                <span className={src.revenueUp ? "text-green-500" : "text-red-500"}>
                  {src.revenueUp ? "↑" : "↓"}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
