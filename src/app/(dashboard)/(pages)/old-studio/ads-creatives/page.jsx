"use client";

import { Boxes, Film, Play, Plus, Settings, Video, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AdsCreativesPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdAds, setCreatedAds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [targetPath, setTargetPath] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null); // Track which card is loading

  // Fetch created ads from localStorage on mount
  useEffect(() => {
    const storedAds = localStorage.getItem("creativeData");
    if (storedAds) {
      // Parse as array if it's a single object or array
      const parsedAds = Array.isArray(JSON.parse(storedAds))
        ? JSON.parse(storedAds)
        : [JSON.parse(storedAds)];

      // Convert backgroundImage File to URL for each ad
      const adsWithImages = parsedAds.map((ad) => {
        if (ad.backgroundImage && ad.backgroundImage.name) {
          const file = ad.backgroundImage;
          const url = URL.createObjectURL(file);
          return { ...ad, backgroundImageUrl: url };
        }
        return ad;
      });

      setCreatedAds(adsWithImages);
    }
  }, []);

  // Close modal when pathname matches targetPath
  useEffect(() => {
    if (targetPath && pathname === targetPath) {
      console.log("Navigation complete to:", targetPath);
      setIsLoading(false);
      setIsModalOpen(false);
      setTargetPath(null);
      setLoadingCard(null); // Reset loading card
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
        setLoadingCard(null); // Reset loading card
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading, targetPath, isModalOpen]);

  const handleCardSelect = (path, type) => {
    setIsLoading(true); // Set loading state
    setTargetPath(path);
    setLoadingCard(type); // Set the loading card
    router.push(path); // Trigger navigation
  };

  const creativeOptions = [
    {
      type: "image_ads",
      name: "Image Ads Creatives",
      desc: "Image ads creative description",
      path: "/creatives/ads-creatives/create/image-ads-creatives",
      bg: "bg-gray-200 group-hover:bg-gray-200",
      content: (
        <svg
          className="w-full h-full text-gray-400 relative z-10"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" ry="2" className="fill-gray-200" />
          <circle cx="8" cy="10" r="2" className="fill-gray-400" />
          <path d="M3 20l6-6 4 4 8-8 2 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ),
    },
    {
      type: "video_ads",
      name: "Video Ads Creative",
      desc: "Video ads creative description",
      path: "/creatives/ads-creatives/create/video-ads-creatives",
      bg: "bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 group-hover:from-gray-600 group-hover:via-gray-600 group-hover:to-gray-600",
      content: (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-60 group-hover:animate-none"></div>
          <div className="absolute top-4 left-4 w-8 h-6 bg-white/20 rounded opacity-70 group-hover:animate-pulse" style={{ animationDelay: "0s" }}></div>
          <div className="absolute top-8 right-8 w-6 h-4 bg-white/15 rounded opacity-50 group-hover:animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-6 left-8 w-10 h-3 bg-white/25 rounded opacity-60 group-hover:animate-pulse" style={{ animationDelay: "2s" }}></div>
          <div className="relative z-10 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 w-20 h-20 bg-white/20 rounded-full group-hover:animate-ping"></div>
              <div className="absolute inset-0 w-20 h-20 bg-white/10 rounded-full group-hover:animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              <div className="relative w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-300 shadow-lg">
                <Play className="w-8 h-8 text-gray-600 fill-current ml-1" strokeWidth={0} />
              </div>
            </div>
          </div>
          <div className="absolute top-3 left-3 flex space-x-1">
            <div className="w-2 h-2 bg-slate-500/60 rounded-full group-hover:animate-bounce" style={{ animationDelay: "0s" }}></div>
            <div className="w-2 h-2 bg-slate-500/60 rounded-full group-hover:animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-slate-500/60 rounded-full group-hover:animate-bounce" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <div className="absolute bottom-4 left-6 right-6 h-1 bg-slate-300/60 rounded-full overflow-hidden">
            <div className="h-full bg-slate-500/80 rounded-full group-hover:animate-pulse w-2/3"></div>
          </div>
          <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-70 transition-opacity">
            <Film className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
            <Video className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-slate-400/60 rounded-full group-hover:animate-ping" style={{ animationDelay: "1s" }}></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-slate-500/40 rounded-full group-hover:animate-ping" style={{ animationDelay: "2s" }}></div>
            <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-slate-400/50 rounded-full group-hover:animate-ping" style={{ animationDelay: "3s" }}></div>
          </div>
        </>
      ),
    },
    {
      type: "interactive_ads",
      name: "Interactive Ads Creatives",
      desc: "Interactive ads  description",
      path: "/creatives/ads-creatives/create/interactive-ads-creatives",
      bg: "bg-gradient-to-br from-emerald-50 to-teal-100 group-hover:from-emerald-100 group-hover:to-teal-200",
      content: (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-emerald-200 rounded-full opacity-30 group-hover:animate-ping"></div>
            <div className="absolute w-24 h-24 border-2 border-teal-300 rounded-full opacity-50 group-hover:animate-ping" style={{ animationDelay: "0.3s" }}></div>
            <div className="absolute w-16 h-16 border-2 border-emerald-400 rounded-full opacity-70 group-hover:animate-ping" style={{ animationDelay: "0.6s" }}></div>
          </div>
          <div className="relative z-10 flex items-center justify-center">
            <div className="relative">
              <Boxes className="w-14 h-14 text-emerald-600 group-hover:text-emerald-700 transition-colors" strokeWidth={1.5} />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                <Zap className="w-2 h-2 text-white fill-current" strokeWidth={0} />
              </div>
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:bg-emerald-500 transition-colors group-hover:animate-pulse"></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full group-hover:bg-teal-500 transition-colors group-hover:animate-pulse"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:bg-emerald-500 transition-colors group-hover:animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="absolute top-4 left-4 w-3 h-3 bg-emerald-400 rounded-full opacity-60 group-hover:opacity-80 transition-opacity group-hover:animate-pulse"></div>
          <div className="absolute top-8 right-6 w-2 h-2 bg-teal-500 rounded-full opacity-50 group-hover:opacity-70 transition-opacity group-hover:animate-pulse"></div>
          <div className="absolute bottom-6 left-8 w-2 h-2 bg-emerald-500 rounded-full opacity-70 group-hover:opacity-90 transition-opacity group-hover:animate-pulse"></div>
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-teal-400 rounded-full opacity-40 group-hover:opacity-60 transition-opacity group-hover:animate-pulse"></div>
          <div className="absolute top-12 left-12 w-8 h-1 bg-gradient-to-r from-emerald-300 to-transparent rounded opacity-30 group-hover:opacity-50 group-hover:animate-pulse transition-opacity transform rotate-45"></div>
          <div className="absolute bottom-12 right-12 w-6 h-1 bg-gradient-to-r from-teal-300 to-transparent rounded opacity-40 group-hover:opacity-60 group-hover:animate-pulse transition-opacity transform -rotate-45"></div>
        </>
      ),
    },
    {
      type: "playable_ads",
      name: "Playable Ads Creatives",
      desc: "Playable ads creative description",
      path: "/creatives/ads-creatives/create/playable-ads-creatives",
      bg: "bg-gradient-to-br from-gray-200 to-slate-200 group-hover:from-slate-100 group-hover:to-gray-200",
      content: (
        <>
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="border-r border-b border-gray-500 last:border-r-0 animate-pulse"
                  style={{ animationDelay: `${i * 1}s` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-center space-x-4">
            <div className="relative">
              <Film className="w-16 h-16 text-slate-600 group-hover:text-slate-700 transition-colors" strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Play className="w-3 h-3 text-white fill-current" strokeWidth={0} />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full group-hover:bg-slate-500 transition-colors animate-ping" style={{ animationDelay: "2s" }}></div>
              <div className="w-3 h-3 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors animate-ping" style={{ animationDelay: "2.5s" }}></div>
              <div className="w-3 h-3 bg-slate-400 rounded-full group-hover:bg-slate-500 transition-colors animate-ping" style={{ animationDelay: "2.7s" }}></div>
            </div>
          </div>
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-slate-300 rounded-tr-lg opacity-60 animate-pulse"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-slate-300 rounded-bl-lg opacity-60 animate-pulse"></div>
        </>
      ),
    },
  ];

  return (
    <div className="px-0 lg:px-14 h-full">
      <div className="flex flex-row justify-between">
        <h1 className="text-xl font-medium">Ads Creative</h1>
        <div className="">
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm cursor-pointer transition duration-300"
            onClick={() => setIsModalOpen(true)}
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
        <p className="text-gray-500 text-lg mb-4">No ads creative have been created yet. <br /> Click the create button to kickstart your campaign!</p>

        <button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm cursor-pointer transition duration-300"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 pb-20 mt-8">
        {/* <div className="px-5 hover:border-[#155dfc] flex flex-row gap-6 border rounded-md border-gray-200 py-5 cursor-pointer">
          <div className="flex justify-center items-center mt-2">
            <Plus
              strokeWidth={2}
              className="w-10 border-2 rounded-full border-gray-600 h-10 text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2 justify-between">
            <h1 className="font-medium text-gray-700 py-1">New Ads Creatives</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#155dfc] cursor-pointer text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Get Started
            </button>
          </div>
        </div> */}

        {/* Render Created Ads */}
        {/* {createdAds.map((ad, index) => (
          <div
            key={index}
            className="px-5 flex flex-col gap-2 border rounded-md border-gray-200 py-5 cursor-pointer hover:shadow-md"
          >
            {ad.backgroundImageUrl && (
              <img
                src={ad.backgroundImageUrl}
                alt={`Ad Creative ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
              />
            )}
            <h3 className="font-semibold text-gray-800">{ad.headline}</h3>
            <p className="text-gray-600 text-sm">{ad.punchline}</p>
            <p className="text-gray-500 text-xs">CTA: {ad.cta_text}</p>
            <p className="text-gray-400 text-xs">Size: {ad.display_size}</p>
          </div>
        ))} */}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50 overflow-auto">
          <div className="relative flex flex-col w-11/12 max-w-5xl max-h-[90vh] bg-gray-50 p-6 rounded-lg shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Close button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setIsLoading(false);
                setTargetPath(null);
                setLoadingCard(null);
              }}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" strokeWidth={2} />
            </button>

            <div className="text-center flex flex-col p-5 pb-5">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                What kind of Ads creatives do you want
              </h1>
              <p className="text-gray-600 text-lg">
                Choose an option below to get started
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {creativeOptions.map((opt) => (
                <div
                  key={opt.type}
                  className="bg-white rounded-xl cursor-pointer hover:shadow-md border border-gray-200 px-6 py-5 transition-shadow group flex flex-col relative"
                >
                  {loadingCard === opt.type && (
                    <div className="absolute z-20 inset-0 flex items-center justify-center bg-black/10 rounded-xl ">
                      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="mb-0">
                    <div className={`w-full h-40 ${opt.bg} rounded-xl flex items-center justify-center mb-6 transition-all duration-300 relative overflow-hidden border border-gray-200/50`}>
                      {opt.content}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{opt.name}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{opt.desc}</p>
                  <div className="absolute top-[40%] z-20 left-8 right-10 hidden group-hover:flex flex-row justify-between gap-2 py-4 rounded-b-xl">
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
  );
};

export default AdsCreativesPage;