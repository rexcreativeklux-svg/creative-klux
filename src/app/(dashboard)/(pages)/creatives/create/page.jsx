"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assetsData } from "@/data/assetsData";
import {
    ArrowLeft,
    ClipboardList,
    Image as Images,
    Video,
    Type,
    Users,
    Music2,
    Star,
} from "lucide-react";


const categories = [
    { key: "Popular", label: "Most Popular", Icon: Star },
    { key: "All", label: "All", Icon: ClipboardList },
    { key: "Static", label: "Static", Icon: Images },
    { key: "Video", label: "Video", Icon: Video },
    { key: "Text", label: "Text", Icon: Type },
    { key: "Audience", label: "Audience", Icon: Users },
    { key: "Sound", label: "Sound", Icon: Music2 },
];

export default function CreateCreatives({ onBack }) {
    const [activeCategory, setActiveCategory] = useState("All");
    const router = useRouter();

    // ✅ Include logic for "Popular"
    const filteredAssets =
        activeCategory === "All"
            ? assetsData
            : activeCategory === "Popular"
                ? assetsData.filter((a) => a.popular)
                : assetsData.filter((a) => a.category === activeCategory);

    return (
        <div className="p-4">
            {/* Back */}
            {/* <div className="flex px-9 py-5 gap-3 flex-row">
                <button
                    onClick={onBack}
                    className="flex items-center hover:cursor-pointer mt-1 gap-2 px-3 text-sm"
                >
                    <ArrowLeft size={18} />
                    <span className="font-medium">Back</span>
                </button>
            </div> */}

            {/* Filters */}
            <div className="flex flex-wrap px-10 gap-2 sm:gap-3 mb-6">
                {categories.map(({ key, label, Icon }) => {
                    const isActive = activeCategory === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition border ${isActive
                                    ? "bg-[#155dfc] border-[#155dfc] text-white"
                                    : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                                }`}
                            aria-pressed={isActive}
                        >
                            {label}
                            <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-700"}`} />
                        </button>

                    );
                })}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 px-10 lg:grid-cols-4 gap-6">
                {filteredAssets.map((asset) => (
                    <div
                        key={asset.id}
                        onClick={() => router.push(asset.route)}
                        className="cursor-pointer rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">{asset.title}</h3>
                                {asset.pro && (
                                    <span className="text-xs bg-blue-100 text-[#155dfc] px-2 py-1 rounded-full font-medium">
                                        PRO
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{asset.description}</p>
                        </div>

                        {/* Preview */}
                        <div className="flex gap-2 mt-4">
                            {asset.preview.map((src, i) => (
                                <img
                                    key={i}
                                    src={src}
                                    alt={`preview ${i + 1}`}
                                    className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
