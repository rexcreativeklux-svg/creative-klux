"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Image,
    Video,
    Type,
    Users,
    Music,
    Layers,
} from "lucide-react";

const categories = [
    { name: "All", icon: Layers },
    { name: "Static", icon: Image },
    { name: "Video", icon: Video },
    { name: "Text", icon: Type },
    { name: "Audience", icon: Users },
    { name: "Sound", icon: Music },
];


export const assetsData = [
    {
        id: "ad-creatives",
        title: "Ad Creatives",
        description: "Generate high-converting ads by simply uploading an image of your product or service.",
        category: "Static",
        preview: [
            "https://images.unsplash.com/photo-1503602642458-232111445657?w=400",
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400"
        ],
        pro: false,
        route: "/projects/ad-creatives",
        popular: true,
    },
    {
        id: "stock-images",
        title: "Stock Images",
        description: "Generate unique, commercially-safe and ultra-realistic stock images in any style with a simple prompt.",
        category: "Static",
        preview: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400"],
        pro: false,
        route: "/projects/stock-images",
        popular: true,
    },
    {
        id: "stock-videos",
        title: "Stock Videos",
        description: "Generate unique, commercially safe stock videos from a simple prompt or image.",
        category: "Video",
        preview: [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400",
            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400"
        ],
        pro: true,
        route: "/projects/stock-videos",
        popular: true,
    },
    {
        id: "social-posts",
        title: "Social Media Posts",
        description: "Instantly design engaging posts tailored for Instagram, Facebook, and more.",
        category: "Static",
        preview: [
            "https://images.unsplash.com/photo-1551817958-20204d6ab1db?w=400",
        ],
        pro: false,
        route: "/projects/social-posts",
        popular: false,
    },
    {
        id: "video-ads",
        title: "Video Ads",
        description: "Create short promotional videos optimized for different platforms.",
        category: "Video",
        preview: [
            "https://images.unsplash.com/photo-1589578527966-74f2b63b9d38?w=400",
        ],
        pro: true,
        route: "/projects/video-ads",
        popular: false,
    },
//     {
//         id: "blog-writer",
//         title: "AI Blog Writer",
//         description: "Generate SEO-friendly articles and blog posts instantly.",
//         category: "Text",
//         preview: [
//             "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=400",
//         ],
//         pro: false,
//         route: "/projects/blog-writer",
//         popular: false,
//     },
//     {
//         id: "product-descriptions",
//         title: "Product Descriptions",
//         description: "Craft compelling product descriptions for your e-commerce store.",
//         category: "Text",
//         preview: [
//             "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
//         ],
//         pro: false,
//         route: "/projects/product-descriptions",
//         popular: false,
//     },
//     {
//         id: "audience-insights",
//         title: "Audience Insights",
//         description: "Discover and analyze your target audience preferences.",
//         category: "Audience",
//         preview: [
//             "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
//         ],
//         pro: true,
//         route: "/projects/audience-insights",
//         popular: false,
//     },
//     {
//         id: "music-generator",
//         title: "AI Music Generator",
//         description: "Create unique background tracks and jingles using AI.",
//         category: "Sound",
//         preview: [
//             "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?w=400",
//         ],
//         pro: true,
//         route: "/projects/music-generator",
//         popular: false,
//     },
//     {
//         id: "voiceover",
//         title: "AI Voiceover",
//         description: "Generate realistic voiceovers for ads, videos, and tutorials.",
//         category: "Sound",
//         preview: [
//             "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
//         ],
//         pro: false,
//         route: "/projects/voiceover",
//         popular: false,
//     },
 ];
