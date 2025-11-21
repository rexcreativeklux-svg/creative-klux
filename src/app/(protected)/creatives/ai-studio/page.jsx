"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Image, Video, Mic, Users, Zap, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function AIStudioPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pipeline, setPipeline] = useState(null);
  const [targetPath, setTargetPath] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null); // Track which card is loading

  // Close modal when pathname matches targetPath
  useEffect(() => {
    if (targetPath && pathname === targetPath) {
      console.log("Navigation complete to:", targetPath);
      setIsLoading(false);
      setIsModalOpen(false);
      setTargetPath(null);
      setLoadingCard(null); // Reset loading card
      setPipeline(null);
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
        setPipeline(null);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading, targetPath, isModalOpen]);

  const handleCardSelect = (path, type) => {
    setPipeline(type);
    setTargetPath(path);
    setIsLoading(true); // Set loading state
    setLoadingCard(type); // Set the loading card
    router.push(path); // Trigger navigation
  };

  const pipelineOptions = [
    {
      type: "text_image",
      name: "Text to Image",
      desc: "Generate images from text prompts",
      path: "/creatives/ai-studio/create/text-to-image",
      icon: (
        <Image
          className="w-12 h-12 text-red-600 relative z-10 group-hover:text-red-700 transition-colors"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-red-100 to-orange-100",
      hoverBg: "group-hover:from-red-200 group-hover:to-orange-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-2 border-red-300 rounded-full opacity-20 group-hover:animate-ping"></div>
            <div
              className="absolute w-16 h-16 border-2 border-orange-300 rounded-full opacity-30 group-hover:animate-ping"
              style={{ animationDelay: "0.3s" }}
            ></div>
            <div
              className="absolute w-12 h-12 border-2 border-red-400 rounded-full opacity-40 group-hover:animate-ping"
              style={{ animationDelay: "0.6s" }}
            ></div>
          </div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="20%"
              cy="30%"
              r="4"
              className="fill-red-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <circle
              cx="70%"
              cy="50%"
              r="6"
              className="fill-orange-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="60%"
              y="20%"
              width="3"
              height="3"
              className="fill-red-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
    {
      type: "text_video",
      name: "Text to Video",
      desc: "Create videos from text prompts",
      path: "/creatives/ai-studio/create/text-to-video",
      icon: (
        <Video
          className="w-12 h-12 text-fuchsia-600 relative z-10 group-hover:text-fuchsia-700 transition-colors"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-fuchsia-100 to-pink-100",
      hoverBg: "group-hover:from-fuchsia-200 group-hover:to-pink-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 right-6 h-1 bg-fuchsia-300/60 rounded-full overflow-hidden">
            <div className="h-full bg-fuchsia-500/80 rounded-full group-hover:animate-pulse w-1/3 group-hover:w-2/3 transition-all duration-500"></div>
          </div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-fuchsia-400 rounded-full opacity-60 group-hover:animate-pulse"></div>
          <div className="absolute top-8 right-6 w-2 h-2 bg-pink-400 rounded-full opacity-50 group-hover:animate-pulse"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="30%"
              cy="40%"
              r="5"
              className="fill-fuchsia-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="50%"
              y="60%"
              width="4"
              height="4"
              className="fill-pink-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
    {
      type: "image_variations",
      name: "Image to Variations",
      desc: "Generate image variations",
      path: "/creatives/ai-studio/create/image-to-variations",
      icon: (
        <Image
          className="w-12 h-12 text-yellow-600 relative z-10 group-hover:text-yellow-700 transition-colors"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-yellow-100 to-amber-100",
      hoverBg: "group-hover:from-yellow-200 group-hover:to-amber-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-yellow-300 rounded-tr-lg opacity-60 group-hover:animate-pulse group-hover:w-10 group-hover:h-10 transition-all"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-300 rounded-bl-lg opacity-60 group-hover:animate-pulse group-hover:w-10 group-hover:h-10 transition-all"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="40%"
              cy="20%"
              r="3"
              className="fill-yellow-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="70%"
              y="50%"
              width="4"
              height="4"
              className="fill-amber-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
    {
      type: "script_video",
      name: "Script to Voiceover to Video",
      desc: "Script to narrated video",
      path: "/creatives/ai-studio/create/script-to-voiceover-to-video",
      icon: (
        <Video
          className="w-12 h-12 text-lime-600 relative z-10 group-hover:text-lime-700 transition-colors"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-lime-100 to-green-100",
      hoverBg: "group-hover:from-lime-200 group-hover:to-green-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 right-6 flex space-x-1">
            <div
              className="w-2 h-2 bg-lime-400 rounded-full group-hover:bg-lime-500 transition-colors group-hover:animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="w-2 h-2 bg-green-400 rounded-full group-hover:bg-green-500 transition-colors group-hover:animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-lime-400 rounded-full group-hover:bg-lime-500 transition-colors group-hover:animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="50%"
              cy="30%"
              r="5"
              className="fill-lime-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="20%"
              y="70%"
              width="3"
              height="3"
              className="fill-green-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
    {
      type: "audio_text",
      name: "Audio to Text",
      desc: "Transcribe audio to text",
      path: "/creatives/ai-studio/create/audio-to-text",
      icon: (
        <Mic
          className="w-12 h-12 text-cyan-600 relative z-10 group-hover:text-cyan-700 transition-colors"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-cyan-100 to-sky-100",
      hoverBg: "group-hover:from-cyan-200 group-hover:to-sky-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 w-2 h-6 bg-cyan-500 rounded group-hover:bg-cyan-600 transition-colors group-hover:animate-pulse"></div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-sky-500 rounded-full opacity-60 group-hover:animate-pulse"></div>
          <div className="absolute top-8 right-6 w-2 h-2 bg-cyan-500 rounded-full opacity-50 group-hover:animate-pulse"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="60%"
              cy="40%"
              r="4"
              className="fill-cyan-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="30%"
              y="50%"
              width="4"
              height="4"
              className="fill-sky-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
    {
      type: "persona_generator",
      name: "Persona-based Generator",
      desc: "Generate for specific personas",
      path: "/creatives/ai-studio/create/persona-based-generator",
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-rose-300/20 rounded-full group-hover:animate-ping"></div>
          <Users
            className="w-12 h-12 text-rose-600 relative z-10 group-hover:text-rose-700 transition-colors"
            strokeWidth={1.5}
          />
        </div>
      ),
      bg: "bg-gradient-to-br from-rose-100 to-red-100",
      hoverBg: "group-hover:from-rose-200 group-hover:to-red-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center group-hover:bg-rose-600 group-hover:animate-ping transition-all">
            <Zap className="w-3 h-3 text-white fill-current" strokeWidth={0} />
          </div>
          <div
            className="absolute top-5 left-5 w-2 h-2 bg-rose-400 rounded-full opacity-60 group-hover:animate-ping"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute bottom-5 right-5 w-2 h-2 bg-red-400 rounded-full opacity-50 group-hover:animate-ping"
            style={{ animationDelay: "0.7s" }}
          ></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="20%"
              cy="50%"
              r="6"
              className="fill-rose-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="60%"
              y="30%"
              width="4"
              height="4"
              className="fill-red-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <circle
              cx="40%"
              cy="70%"
              r="3"
              className="fill-rose-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
    {
      type: "text_audio",
      name: "Text to Audio",
      desc: "Generate audio from text",
      path: "/creatives/ai-studio/create/text-to-audio",
      icon: (
        <Mic
          className="w-12 h-12 text-blue-600 relative z-10 group-hover:text-blue-700 transition-colors"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-blue-100 to-indigo-100",
      hoverBg: "group-hover:from-blue-200 group-hover:to-indigo-200",
      decorative: (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-6 w-2 h-6 bg-blue-500 rounded group-hover:bg-blue-600 transition-colors group-hover:animate-pulse"></div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-indigo-500 rounded-full opacity-60 group-hover:animate-pulse"></div>
          <div className="absolute top-8 right-6 w-2 h-2 bg-blue-500 rounded-full opacity-50 group-hover:animate-pulse"></div>
          <svg className="absolute inset-0 w-full h-full">
            <circle
              cx="60%"
              cy="40%"
              r="4"
              className="fill-blue-300 opacity-25 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
            <rect
              x="30%"
              y="50%"
              width="4"
              height="4"
              className="fill-indigo-300 opacity-20 group-hover:animate-pulse group-hover:scale-110 transition-transform"
            />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="px-14">
      <div className="flex flex-row mb-6 justify-between">
        <div className="font-medium text-xl ">Magic Studio</div>

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
        <p className="text-gray-500 text-md mb-4"> Click the create button to kickstart your campaign!</p>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative flex flex-col w-11/12 max-w-5xl max-h-[90vh] bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-lg shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsLoading(false);
                  setTargetPath(null);
                  setLoadingCard(null);
                  setPipeline(null);
                }}
                className="absolute top-4 right-4 text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" strokeWidth={2} />
              </button>
              <div className="text-center flex flex-col p-5 pb-5">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                  What kind of AI pipeline do you want
                </h1>
                <p className="text-gray-600 text-lg">
                  Choose an option below to get started
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-start gap-4 min-h-0">
                {pipelineOptions.map((opt) => (
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">{opt.name}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{opt.desc}</p>
                    <div className="absolute top-[40%] left-8 right-10 hidden group-hover:flex flex-row justify-between gap-2 py-4 rounded-b-xl">
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
}