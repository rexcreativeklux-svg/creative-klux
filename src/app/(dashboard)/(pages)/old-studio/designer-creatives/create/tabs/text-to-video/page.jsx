"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import { ArrowLeft } from 'lucide-react';

const TextToVideoTab = ({ selectedMedia, handleSelectMedia }) => {
  const [inputData, setInputData] = useState({ text: '', style: '', layout: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const styleDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);

  const styleOptions = [
    { value: 'Realistic', label: 'Realistic', image: 'https://images.pexels.com/photos/2486168/pexels-photo-2486168.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Cartoon', label: 'Cartoon', image: 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Anime', label: 'Anime', image: 'https://images.pexels.com/photos/669319/pexels-photo-669319.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Abstract', label: 'Abstract', image: 'https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Watercolor', label: 'Watercolor', image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Surreal', label: 'Surreal', image: 'https://images.pexels.com/photos/3640877/pexels-photo-3640877.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Minimalist', label: 'Minimalist', image: 'https://images.pexels.com/photos/2258539/pexels-photo-2258539.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Retro', label: 'Retro', image: 'https://images.pexels.com/photos/1234567/pexels-photo-1234567.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const layoutOptions = [
    { value: 'Landscape', label: 'Landscape', svg: <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" stroke="currentColor"><rect x="2" y="2" width="28" height="20" rx="2" strokeWidth="2" /></svg> },
    { value: 'Portrait', label: 'Portrait', svg: <svg className="w-6 h-8" viewBox="0 0 24 32" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="28" rx="2" strokeWidth="2" /></svg> },
    { value: 'Square', label: 'Square', svg: <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor"><rect x="2" y="2" width="28" height="28" rx="2" strokeWidth="2" /></svg> },
  ];

  // Smarter, more cinematic prompts (just like your VideoAdsCreatives inspire me)
  const smartPrompts = [
    "A golden retriever puppy playing in slow motion on a sunny beach",
    "Aerial drone shot of a futuristic cyberpunk city at night with flying cars",
    "Peaceful timelapse of stars moving over snowy mountains",
    "A chef cooking pasta in a cozy Italian kitchen, cinematic lighting",
    "A cat jumping in slow motion with dramatic backlighting",
    "People dancing at a vibrant music festival with colorful lights",
    "A luxury car driving on a coastal road at golden hour",
    "A magical forest with glowing mushrooms and fireflies",
    "A person doing yoga at sunrise on a mountain peak",
    "A bustling street food market in Tokyo at night",
    "Underwater footage of colorful tropical fish swimming",
    "A rocket launching into space with dramatic flames",
    "A cozy coffee shop interior with rain on the window",
    "A lion walking across the African savanna at sunset"
  ];

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomPrompt = smartPrompts[Math.floor(Math.random() * smartPrompts.length)];
    setInputData((prev) => ({ ...prev, text: randomPrompt }));
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
  };

  const handleLayoutChange = (value) => {
    setInputData((prev) => ({ ...prev, layout: value }));
    setLayoutDropdownOpen(false);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
  };

  const toggleLayoutDropdown = () => {
    setLayoutDropdownOpen((prev) => !prev);
  };

  // Real Pexels video search
  const searchPexelsVideos = async (query) => {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&type=videos&per_page=15`);
      const data = await res.json();
      if (data.error) return [];

      return (data.videos || []).map((video, i) => {
        const hd = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
        return {
          id: `pexels-video-${video.id}-${i}`,
          type: 'video',
          src: hd.link,
          thumbnail: video.image,
          alt: video.url.split('/').pop().replace(/-/g, ' '),
        };
      });
    } catch (err) {
      console.error("Pexels search failed:", err);
      return [];
    }
  };

  const handleGenerateVideo = async () => {
    if (!inputData.text.trim()) {
      alert('Please enter a text prompt.');
      return;
    }

    setLoading({ generate: true });
    setOutputs([]);

    // Enhance prompt with style if selected
    let finalPrompt = inputData.text;
    if (inputData.style) {
      const styleMap = {
        'Realistic': 'realistic, cinematic, high quality',
        'Cartoon': 'cartoon style, animated',
        'Anime': 'anime style, japanese animation',
        'Abstract': 'abstract art, surreal',
        'Watercolor': 'watercolor painting style',
        'Surreal': 'surreal, dreamlike',
        'Minimalist': 'minimalist, clean',
        'Retro': 'retro 80s, vintage'
      };
      finalPrompt += `, ${styleMap[inputData.style] || inputData.style.toLowerCase()}`;
    }

    const videos = await searchPexelsVideos(finalPrompt);

    setTimeout(() => {
      setOutputs(videos.length > 0 ? videos : [
        { id: 'fallback-1', type: 'video', thumbnail: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=512', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Sample Video' },
        { id: 'fallback-2', type: 'video', thumbnail: 'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=512', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Sample Video' },
        { id: 'fallback-3', type: 'video', thumbnail: 'https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=512', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Sample Video' },
      ]);
      setLoading({ generate: false });
    }, 2800);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setStyleDropdownOpen(false);
      }
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target)) {
        setLayoutDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-[100%] border border-gray-200 pb-50 overflow-y-auto rounded-lg">
      {outputs.length === 0 ? (
        <div className="flex flex-col gap-8 p-3">
          <div>
            <div className="flex flex-col pb-5 justify-center">
              <h1 className="font-medium text-lg text-blue-700">Input Text Prompt</h1>
              <p className="text-gray-600 text-xs">Enter a text prompt to generate your video.</p>
            </div>
            <div className="space-y-8">
              <div className="relative">
                <textarea
                  placeholder="Enter your text prompt (e.g., 'A futuristic cityscape animation')"
                  value={inputData.text}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                  aria-label="Text Prompt"
                />
                <button
                  onClick={handleInspireMe}
                  className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                  aria-label="Inspire Me"
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
                      aria-label="Select Style"
                    >
                      {selectedStyle && (
                        <img
                          src={selectedStyle.image}
                          alt={selectedStyle.label}
                          className="w-6 h-6 object-cover rounded"
                          onError={() => console.error(`Failed to load selected style image: ${selectedStyle.image}`)}
                        />
                      )}
                      {inputData.style || 'Select a style'}
                    </button>
                    {styleDropdownOpen && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-5 p-3">
                        {styleOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStyleChange(option.value)}
                            className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                              }`}
                            aria-label={`Select ${option.label}`}
                          >
                            <img
                              src={option.image}
                              alt={option.label}
                              className="w-full h-20 object-cover rounded-md mb-2"
                              onError={() => console.error(`Failed to load style image: ${option.image}`)}
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
                      aria-label="Select Layout"
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
                            aria-label={`Select ${option.label}`}
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
                aria-label="Generate Videos"
              >
                {loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Generate Videos'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 relative">
          <div className='flex sticky top-0 pt-3  z-50 bg-white flex-row border-b border-b-gray-200  justify-between'>
            <h2 className="font-medium px-2 flex justify-center items-center text-lg text-blue-700 mb-4">
              Generated Videos
            </h2>

            <div>
              {outputs.length > 0 && (
                <div className="px-3 pb-2">
                  <button
                    onClick={() => setOutputs([])}
                    className="px-4 text-blue-700 cursor-pointer py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    <ArrowLeft />
                  </button>
                </div>
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {outputs.map((output) => {
              const isSelected = selectedMedia.some(item => item.id === output.id);

              return (
                <div
                  key={output.id}
                  className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-blue-700 shadow-lg' : 'border-gray-200 hover:border-blue-500'
                    }`}
                  onClick={() => handleSelectMedia(output)}
                >
                  {/* CLEAN VIDEO PREVIEW - EXACTLY LIKE YOUR IMAGE GALLERY */}
                  <div className="aspect-video bg-black">
                    <video
                      src={output.src}
                      poster={output.thumbnail}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      // Auto-play on hover (same as your main gallery)
                      onMouseEnter={(e) => {
                        e.target.play().catch(() => { });
                      }}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                      // Optional: click to play/pause (feels premium)
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.target.paused) {
                          e.target.play();
                        } else {
                          e.target.pause();
                        }
                      }}
                    />
                  </div>

                  {/* Bottom label - same as your gallery */}
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-500 truncate">
                      {output.alt || 'Video clip'}
                    </p>
                    <p className="text-xs text-gray-400">Style: {inputData.style || 'Default'}</p>
                  </div>

                  {/* Optional: subtle play icon only when paused (very clean) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded-full p-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


        </div>
      )}

      {loading.generate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
            <FloatingAnimation animationDuration="3s" showProgressBar={true}>
              <FloatingElements.VideoFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToVideoTab;