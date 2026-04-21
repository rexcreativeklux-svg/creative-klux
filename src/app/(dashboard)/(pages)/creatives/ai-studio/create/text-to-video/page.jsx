"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Video, MoreVertical, Download, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/app/(components)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';

const TextToVideoPipelinePage = () => {
  const router = useRouter();
  const { activeBrand, uploadImage } = useAuth();

  const [inputData, setInputData] = useState({ text: '', style: '', layout: 'Square' });
  const [outputs, setOutputs] = useState([]);
  const [createdVideos, setCreatedVideos] = useState([]);
  const [loading, setLoading] = useState({ generate: false, created: true });
  const [menuOpen, setMenuOpen] = useState(null);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);

  const styleDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);

  const currentBrandName = activeBrand?.name?.trim() || "your brand";

  const inspirePrompts = [
    `${currentBrandName} luxury product reveal with cinematic camera movement`,
    `${currentBrandName} team celebrating success in modern office`,
    `${currentBrandName} premium packaging unboxing with golden hour light`,
    `${currentBrandName} happy customers enjoying our product`,
    `${currentBrandName} brand story with emotional cinematic transitions`,
    `${currentBrandName} futuristic concept with neon and smooth motion`,
    `A luxury car driving on coastal road at sunset`,
    `A chef cooking in cozy kitchen with warm cinematic lighting`,
    `Peaceful timelapse of stars over snowy mountains`,
    `A rocket launching into space with dramatic flames`,
    `Cozy coffee shop with rain on window and warm ambiance`,
    `Lion walking across savanna at golden hour in slow motion`
  ];

  const styleOptions = [
    { value: 'Photorealistic', image: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Photorealistic' },
    { value: 'Cartoon', image: 'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Cartoon' },
    { value: 'Abstract', image: 'https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Abstract' },
    { value: 'Anime', image: 'https://images.pexels.com/photos/3601441/pexels-photo-3601441.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Anime' },
    { value: 'Watercolor', image: 'https://images.pexels.com/photos/208139/pexels-photo-208139.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Watercolor' },
    { value: 'Oil Painting', image: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Oil Painting' },
    { value: 'Cyberpunk', image: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Cyberpunk' },
    { value: 'Minimalist', image: 'https://images.pexels.com/photos/583842/pexels-photo-583842.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Minimalist' },
  ];

  const layoutOptions = [
    {
      value: 'Square',
      svg: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="60" height="60" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Square',
    },
    {
      value: 'Landscape',
      svg: (
        <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="5" width="80" height="40" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Landscape',
    },
    {
      value: 'Portrait',
      svg: (
        <svg width="50" height="100" viewBox="0 0 50 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="10" width="40" height="80" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Portrait',
    },
  ];

  const proxy = (url) => `/api/proxy-media?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    const fetchCreatedVideos = async () => {
      if (!currentBrandName || currentBrandName === "your brand") {
        setLoading(prev => ({ ...prev, created: false }));
        return;
      }

      try {
        const res = await fetch(
          `/api/pexels?query=${encodeURIComponent(currentBrandName + " luxury product cinematic")}&type=videos&per_page=5`
        );
        const data = await res.json();

        const videos = (data.videos || []).slice(0, 5).map((video, i) => {
          const hd = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
          return {
            id: `created-${video.id}-${i}`,
            src: proxy(hd?.link),
            thumbnail: proxy(video.image),
            alt: currentBrandName,
          };
        });

        setCreatedVideos(videos);
      } catch (err) {
        console.error("Failed to load created videos:", err);
      } finally {
        setLoading(prev => ({ ...prev, created: false }));
      }
    };

    fetchCreatedVideos();
  }, [currentBrandName]);

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setInputData(prev => ({ ...prev, text: randomPrompt }));
  };

  const handleInputChange = (e) => {
    setInputData(prev => ({ ...prev, text: e.target.value }));
  };

  const handleStyleChange = (style) => {
    setInputData(prev => ({ ...prev, style }));
    setStyleDropdownOpen(false);
  };

  const handleLayoutChange = (layout) => {
    setInputData(prev => ({ ...prev, layout }));
    setLayoutDropdownOpen(false);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen(prev => !prev);
    setLayoutDropdownOpen(false);
  };

  const toggleLayoutDropdown = () => {
    setLayoutDropdownOpen(prev => !prev);
    setStyleDropdownOpen(false);
  };

  const handleGenerateVideo = async () => {
    if (!inputData.text.trim()) {
      alert('Please enter a text prompt first.');
      return;
    }

    setLoading(prev => ({ ...prev, generate: true }));
    setOutputs([]);

    let finalPrompt = inputData.text;
    if (inputData.style) {
      const styleMap = {
        'Photorealistic': 'realistic cinematic high quality',
        'Cartoon': 'cartoon animated',
        'Anime': 'anime japanese animation',
        'Abstract': 'abstract surreal',
        'Watercolor': 'watercolor painting style',
        'Oil Painting': 'oil painting style',
        'Cyberpunk': 'cyberpunk neon futuristic',
        'Minimalist': 'minimalist clean aesthetic',
      };
      finalPrompt += `, ${styleMap[inputData.style] || inputData.style.toLowerCase()}`;
    }

    try {
      const res = await fetch(
        `/api/pexels?query=${encodeURIComponent(finalPrompt)}&type=videos&per_page=20`
      );
      const data = await res.json();

      const videos = (data.videos || []).map((video, i) => {
        const hd = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
        return {
          id: `generated-${video.id}-${i}`,
          src: proxy(hd?.link),
          thumbnail: proxy(video.image),
          alt: video.url.split('/').pop().replace(/-/g, ' '),
        };
      });

      setOutputs(videos.length > 0 ? videos : []);
    } catch (err) {
      console.error("Video generation failed:", err);
      alert("Failed to generate videos.");
    } finally {
      setLoading(prev => ({ ...prev, generate: false }));
    }
  };

  const handleDownload = async (index) => {
    const video = outputs[index];
    if (!video) return;
    const a = document.createElement('a');
    a.href = video.src;
    a.download = `generated-video-${Date.now()}.mp4`;
    a.click();
  };

  const handleAddToBrand = async (index) => {
    const video = outputs[index];
    if (!video) return;

    try {
      const res = await fetch(video.src);
      const blob = await res.blob();
      const file = new File([blob], `video-${Date.now()}.mp4`, { type: blob.type || 'video/mp4' });
      await uploadImage(file);
      alert("Video added to brand library!");
    } catch (err) {
      alert("Failed to add video");
    }
  };

  const toggleMenu = (index) => {
    setMenuOpen(menuOpen === index ? null : index);
  };

  const handleBack = () => {
    setOutputs([]);
    setInputData({ text: '', style: '', layout: 'Square' });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) setStyleDropdownOpen(false);
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target)) setLayoutDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedStyle = styleOptions.find(option => option.value === inputData.style);

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Text to Video Pipeline</div>

      <Breadcrumbs
        items={[
          { name: 'Creatives', href: '/creatives' },
          { name: 'AI Studio', href: null },
          { name: 'Text to Video', href: '/creatives/ai-studio/text-to-video' },
        ]}
      />

      <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-white rounded-xl py-4">
        <div className="overflow-auto space-y-6">
          {outputs.length === 0 ? (
            <div className="border border-gray-200 flex flex-col justify-between gap-30 h-full p-3 rounded-lg">
              <div>
                <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                  <div className="flex justify-center gap-2">
                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                      <Video className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">Input Text Prompt</h1>
                      <p className="text-gray-600 text-xs">Enter a text prompt or get inspired to generate your video.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="relative">
                    <textarea
                      placeholder="Enter your text prompt (e.g., 'A futuristic cityscape animation')"
                      value={inputData.text}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                    />
                    <button
                      onClick={handleInspireMe}
                      className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                    >
                      Inspire Me
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Style</label>
                      <div className="relative" ref={styleDropdownRef}>
                        <button
                          onClick={toggleStyleDropdown}
                          className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
                        >
                          {selectedStyle && (
                            <img src={selectedStyle.image} alt={selectedStyle.label} className="w-6 h-6 object-cover rounded" />
                          )}
                          {inputData.style || 'Select a style'}
                        </button>
                        {styleDropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-4 p-3">
                            {styleOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStyleChange(option.value)}
                                className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                                  }`}
                              >
                                <img
                                  src={option.image}
                                  alt={option.label}
                                  className="w-full h-20 object-cover rounded-md mb-2"
                                />
                                <span className="text-sm text-gray-700">{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Layout</label>
                      <div className="relative" ref={layoutDropdownRef}>
                        <button
                          onClick={toggleLayoutDropdown}
                          className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                        >
                          {inputData.layout || 'Select a layout'}
                        </button>
                        {layoutDropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-3 gap-2 p-2">
                            {layoutOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleLayoutChange(option.value)}
                                className={`flex flex-col items-center justify-center p-2 border rounded-md transition duration-200 ${inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                                  }`}
                              >
                                <div className="mb-2">{option.svg}</div>
                                <span className="text-sm text-gray-700">{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateVideo}
                    className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading.generate || !inputData.text}
                  >
                    {loading.generate ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Generate Videos'
                    )}
                  </button>
                </div>
              </div>

              {/* Created Videos — BIG, 5-column grid, auto-playing, perfect size */}
              <div>
                <h2 className="font-medium text-lg text-blue-700 mb-4">
                  Created Videos for {currentBrandName}
                </h2>
                {loading.created ? (
                  <p className="text-gray-500 text-sm">Loading brand videos...</p>
                ) : createdVideos.length === 0 ? (
                  <p className="text-gray-500 text-sm">No videos found for this brand yet.</p>
                ) : (
                  <div className="grid grid-cols-5 gap-4">
                    {createdVideos.map((video) => (
                      <div
                        key={video.id}
                        className="relative cursor-pointer group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-700 transition duration-300 shadow-sm hover:shadow-lg"
                      >
                        {/* Fixed height + full-width video = BIG & clean */}
                        <div className="relative w-full h-48 bg-black">
                          <video
                            src={video.src}
                            poster={video.thumbnail}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                          />
                          {/* Optional: subtle play icon overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                            <div className="bg-white/90 p-3 rounded-full">
                              <Video className="w-8 h-8 text-blue-700" />
                            </div>
                          </div>
                        </div>

                        {/* Clean text below */}
                        <div className="p-3 text-center">
                          <p className="text-sm font-medium text-gray-800 truncate">{currentBrandName}</p>
                          <p className="text-xs text-gray-500">Featured Video</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Generated Videos Section */
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="text-sm flex justify-between items-center border-b p-2 border-b-gray-200 mb-6">
                <div className="flex items-center gap-3">

                  <div>
                    <h1 className="font-medium text-lg text-blue-700">Generated Videos</h1>
                    <p className="text-gray-600 text-xs">Review and select your generated videos.</p>
                  </div>
                </div>

                <button
                  onClick={handleBack}
                  className="py-2 px-4  border cursor-pointer border-gray-200 rounded-md hover:bg-gray-50 transition"
                >
                  back
                </button>
              </div>

              <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
                {outputs.map((output, index) => (
                  <div
                    key={output.id}
                    className="relative group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden break-inside-avoid mb-6 hover:border-blue-700 transition duration-300"
                  >
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => toggleMenu(index)}
                        className="p-1 bg-gray-100 cursor-pointer rounded-full hover:bg-gray-200 transition duration-200"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {menuOpen === index && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                          <button
                            onClick={() => handleDownload(index)}
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                          <button
                            onClick={() => handleAddToBrand(index)}
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" /> Add to Brand
                          </button>
                        </div>
                      )}
                    </div>

                    <video
                      src={output.src}
                      poster={output.thumbnail}
                      controls
                      className="w-full"
                      preload="metadata"
                      onMouseEnter={(e) => e.target.play().catch(() => { })}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 truncate">{output.alt}</p>
                      <p className="text-xs text-gray-500 mt-1">Style: {inputData.style || 'Default'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading.generate && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50">
              <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                <FloatingAnimation animationDuration="3s" showProgressBar={true}>
                  <FloatingElements.VideoFile />
                </FloatingAnimation>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToVideoPipelinePage;