"use client";

import React, { useState, useEffect } from "react";
import { Plus, Settings, X, Zap } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const DesignerCreativesPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [format, setFormat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetPath, setTargetPath] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null); // Track which card is loading

  // Close modal when pathname matches targetPath
  useEffect(() => {
    if (targetPath && pathname === targetPath) {
      console.log("Navigation complete to:", targetPath);
      setIsLoading(false);
      setIsModalOpen(false);
      setTargetPath(null);
      setLoadingCard(null);
      setFormat(null);
    }
  }, [pathname, targetPath]);

  // Fallback timeout to close modal and loader if navigation takes too long
  useEffect(() => {
    if (!isLoading || !targetPath) return;

    const timeout = setTimeout(() => {
      if (isModalOpen) {
        console.log("Fallback: Closing modal and loader after timeout for path:", targetPath);
        setIsLoading(false);
        setIsModalOpen(false);
        setTargetPath(null);
        setLoadingCard(null);
        setFormat(null);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading, targetPath, isModalOpen]);

  const handleCardSelect = (path, type) => {
    setFormat(type);
    setIsLoading(true);
    setTargetPath(path);
    setLoadingCard(type);
    router.push(path);
  };

  const formatOptions = [
    {
      type: "logos",
      name: "Logos & Brand Identity",
      desc: "Create unique brand logos",
      path: "/creatives/designer-creatives/create/logos",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-blue-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-blue-600 relative z-10 group-hover:text-blue-700 transition-colors">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M6 12h12" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-blue-100 to-sky-100",
      hoverBg: "group-hover:from-blue-200 group-hover:to-sky-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-2 border-blue-300 rounded-full opacity-20 group-hover:animate-ping"></div>
            <div className="absolute w-16 h-16 border-2 border-sky-300 rounded-full opacity-30 group-hover:animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute w-12 h-12 border-2 border-blue-400 rounded-full opacity-40 group-hover:animate-ping" style={{ animationDelay: '0.6s' }}></div>
          </div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="20%" cy="30%" r="4" className="fill-blue-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <circle cx="70%" cy="50%" r="6" className="fill-sky-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="60%" y="20%" width="3" height="3" className="fill-blue-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "business_cards",
      name: "Business Cards",
      desc: "Professional contact cards",
      path: "/creatives/designer-creatives/create/business-cards",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-violet-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-violet-600 relative z-10 group-hover:text-violet-700 transition-colors">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h12M6 14h8" />
            <circle cx="18" cy="10" r="2" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-violet-100 to-purple-100",
      hoverBg: "group-hover:from-violet-200 group-hover:to-purple-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 right-6 h-1 bg-violet-300/60 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500/80 rounded-full group-hover:animate-pulse w-1/3 group-hover:w-2/3 transition-all duration-500"></div>
          </div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-violet-400 rounded-full opacity-60 group-hover:animate-ping"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="30%" cy="40%" r="5" className="fill-violet-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="50%" y="60%" width="4" height="4" className="fill-purple-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "banners",
      name: "Banners (Print & Digital)",
      desc: "Promotional banners",
      path: "/creatives/designer-creatives/create/banners",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-emerald-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-emerald-600 relative z-10 group-hover:text-emerald-700 transition-colors">
            <rect x="2" y="4" width="20" height="10" rx="1" />
            <path d="M4 9h16" />
            <circle cx="8" cy="9" r="2" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-emerald-100 to-green-100",
      hoverBg: "group-hover:from-emerald-200 group-hover:to-green-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-300 rounded-tr-lg opacity-60 group-hover:animate-pulse group-hover:w-10 group-hover:h-10 transition-all"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-green-300 rounded-bl-lg opacity-60 group-hover:animate-pulse group-hover:w-10 group-hover:h-10 transition-all"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="40%" cy="20%" r="3" className="fill-emerald-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="70%" y="50%" width="4" height="4" className="fill-green-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "flyers",
      name: "Flyers",
      desc: "Marketing flyers",
      path: "/creatives/designer-creatives/create/flyers",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-orange-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-orange-600 relative z-10 group-hover:text-orange-700 transition-colors">
            <path d="M4 4h16v16H6l-2-2V4z" />
            <path d="M6 8h12v8H8" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-orange-100 to-amber-100",
      hoverBg: "group-hover:from-orange-200 group-hover:to-amber-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full group-hover:bg-orange-500 group-hover:animate-bounce transition-colors" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full group-hover:bg-amber-500 group-hover:animate-bounce transition-colors" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full group-hover:bg-orange-500 group-hover:animate-bounce transition-colors" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-orange-400 rounded-full opacity-60 group-hover:animate-ping"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="50%" cy="30%" r="5" className="fill-orange-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="20%" y="70%" width="3" height="3" className="fill-amber-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "brochures",
      name: "Brochures",
      desc: "Multi-page informational",
      path: "/creatives/designer-creatives/create/brochures",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-pink-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-pink-600 relative z-10 group-hover:text-pink-700 transition-colors">
            <path d="M3 4h6v16H3zM9 4h6v16H9zM15 4h6v16h-6z" />
            <path d="M5 8h2M11 8h2M17 8h2" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-pink-100 to-rose-100",
      hoverBg: "group-hover:from-pink-200 group-hover:to-rose-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 bg-pink-300/30 transform rotate-45 group-hover:rotate-0 transition-transform group-hover:animate-pulse"></div>
          <div className="absolute bottom-4 right-4 w-2 h-2 bg-rose-400 rounded-full opacity-60 group-hover:animate-ping"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="60%" cy="40%" r="4" className="fill-pink-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="30%" y="50%" width="4" height="4" className="fill-rose-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "posters",
      name: "Posters",
      desc: "Large format posters",
      path: "/creatives/designer-creatives/create/posters",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-teal-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-teal-600 relative z-10 group-hover:text-teal-700 transition-colors">
            <rect x="3" y="2" width="18" height="20" rx="2" />
            <path d="M6 6h12M6 10h12" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-teal-100 to-cyan-100",
      hoverBg: "group-hover:from-teal-200 group-hover:to-cyan-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 right-3 w-8 h-8 border-2 border-teal-300 rounded opacity-60 group-hover:animate-pulse group-hover:w-10 group-hover:h-10 transition-all"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-2 border-cyan-300 rounded opacity-60 group-hover:animate-pulse group-hover:w-10 group-hover:h-10 transition-all"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="20%" cy="50%" r="5" className="fill-teal-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="60%" y="30%" width="3" height="3" className="fill-cyan-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "infographics",
      name: "Infographics",
      desc: "Data visualization",
      path: "/creatives/designer-creatives/create/infographics",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-lime-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-lime-600 relative z-10 group-hover:text-lime-700 transition-colors">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M6 12h3v6H6zM9 10h3v8H9zM12 8h3v10h-3z" />
            <circle cx="18" cy="8" r="2" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-lime-100 to-yellow-100",
      hoverBg: "group-hover:from-lime-200 group-hover:to-yellow-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 right-6 flex space-x-1">
            <div className="w-2 h-4 bg-lime-400 rounded group-hover:bg-lime-500 group-hover:animate-pulse transition-colors" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-6 bg-yellow-400 rounded group-hover:bg-yellow-500 group-hover:animate-pulse transition-colors" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-5 bg-lime-400 rounded group-hover:bg-lime-500 group-hover:animate-pulse transition-colors" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="40%" cy="60%" r="4" className="fill-lime-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="50%" y="20%" width="4" height="4" className="fill-yellow-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "presentations",
      name: "Presentation Decks",
      desc: "Pitch or report slides",
      path: "/creatives/designer-creatives/create/presentation-deck",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-indigo-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-indigo-600 relative z-10 group-hover:text-indigo-700 transition-colors">
            <rect x="2" y="4" width="20" height="14" rx="2" />
            <path d="M6 8h12v6H6z" />
            <path d="M8 10h8" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-indigo-100 to-blue-100",
      hoverBg: "group-hover:from-indigo-200 group-hover:to-blue-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 right-6 h-1 bg-indigo-300/60 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500/80 rounded-full group-hover:animate-pulse w-1/3 group-hover:w-2/3 transition-all duration-500"></div>
          </div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-indigo-400 rounded-full opacity-60 group-hover:animate-ping"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="50%" cy="30%" r="5" className="fill-indigo-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="20%" y="60%" width="3" height="3" className="fill-blue-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "packaging",
      name: "Packaging Mockups",
      desc: "Product packaging designs",
      path: "/creatives/designer-creatives/create/packaging-mockups",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-gray-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-gray-600 relative z-10 group-hover:text-gray-700 transition-colors">
            <path d="M4 6h16l2 8-2 8H4l-2-8z" />
            <path d="M6 6v12M18 6v12" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-gray-100 to-slate-100",
      hoverBg: "group-hover:from-gray-200 group-hover:to-slate-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-2 border-gray-300 rounded opacity-50 group-hover:animate-spin-slow"></div>
          </div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-gray-400 rounded-full opacity-60 group-hover:animate-ping"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="30%" cy="50%" r="4" className="fill-gray-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="60%" y="40%" width="4" height="4" className="fill-slate-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
    {
      type: "digital_cards",
      name: "Digital Business Cards",
      desc: "Shareable digital cards",
      path: "/creatives/designer-creatives/create/digital-business-cards",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-sky-300/20 rounded-full group-hover:animate-ping"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-sky-600 relative z-10 group-hover:text-sky-700 transition-colors">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h10M6 14h8" />
            <rect x="16" y="10" width="4" height="4" rx="1" />
          </svg>
        </div>
      ),
      bg: "bg-gradient-to-br from-sky-100 to-blue-100",
      hoverBg: "group-hover:from-sky-200 group-hover:to-blue-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center group-hover:bg-sky-600 group-hover:animate-ping transition-all">
            <Zap className="w-3 h-3 text-white fill-current" strokeWidth={0} />
          </div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <div className="w-3 h-3 bg-sky-400 rounded-full group-hover:bg-sky-500 group-hover:animate-bounce transition-colors" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full group-hover:bg-blue-500 group-hover:animate-bounce transition-colors" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-sky-400 rounded-full group-hover:bg-sky-500 group-hover:animate-bounce transition-colors" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="40%" cy="60%" r="5" className="fill-sky-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
            <rect x="50%" y="30%" width="3" height="3" className="fill-blue-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="px-14">
      <div className="flex flex-row mb-6 justify-between">
        <div className="font-medium text-xl">Designer Creatives</div>
        <div className="flex">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#155dfc] text-white rounded-lg hover:bg-blue-800 text-sm cursor-pointer transition duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center py-5">
        <img
          src="/bg.png"
          alt="No ads yet"
          className=" object-cover opacity-70 rounded-lg mb-6"
        />
        <p className="text-gray-500 text-md mb-4">No designer creative have been created yet. <br /> Click the create button to kickstart your campaign!</p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#155dfc] text-white rounded-lg hover:bg-blue-800 text-sm cursor-pointer transition duration-300"
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </button>

      </div>

      <div className="grid grid-cols-4 gap-4 pb-20 mt-8">


        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50 overflow-auto">
            <div
              className="relative flex flex-col w-11/12 max-w-5xl max-h-[90vh] bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-lg shadow-lg animate-in duration-300 ease-out data-[state=open]:fade-in-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 modal"
            >
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsLoading(false);
                  setTargetPath(null);
                  setLoadingCard(null);
                  setFormat(null);
                }}
                className="absolute top-4 right-4 text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" strokeWidth={2} />
              </button>
              <div className="text-center flex flex-col p-5 pb-5">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                  What kind of Designer creatives do you want
                </h1>
                <p className="text-gray-600 text-lg">
                  Choose an option below to get started
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 min-h-0 items-start">
                {formatOptions.map((opt) => (
                  <div
                    key={opt.type}
                    className="bg-white cursor-pointer rounded-xl hover:shadow-md border border-gray-200 p-6 transition-shadow group flex flex-col relative"
                  >
                    {loadingCard === opt.type && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl z-10">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="mb-0">
                      <div
                        className={`w-full h-36 ${opt.bg} ${opt.hoverBg} rounded-xl flex items-center justify-center mb-4 relative overflow-hidden transition-all duration-300 border border-gray-200/50`}
                      >
                        {opt.decorative}
                        {opt.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 ">{opt.name}</h3>
                    <p className="text-gray-600 leading-relaxed ">{opt.desc}</p>
                    <div className="absolute top-[43%] left-8 right-10 hidden group-hover:flex flex-row justify-between gap-2 py-4 rounded-b-xl">
                      <div className="w-20">
                        <button
                          onClick={() => { }}
                          className="bg-gray-500 cursor-pointer text-white px-2 py-1.5 rounded-md hover:bg-gray-600 transition duration-300 text-sm flex items-center gap-2"
                          disabled={isLoading}
                        >
                          <Zap size={16} /> Instant
                        </button>
                      </div>
                      <div className="w-20">
                        <button
                          onClick={() => handleCardSelect(opt.path, opt.type)}
                          className="bg-[#155dfc] cursor-pointer text-white px-2 py-1.5 rounded-md hover:bg-blue-700 transition duration-300 text-sm flex items-center gap-2"
                          disabled={isLoading}
                        >
                          <Settings size={16} /> Custom
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerCreativesPage;