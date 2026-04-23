"use client";

import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import Toast from '@/app/(components)/Toast';
import { ArrowLeft } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';


const TextToImageTab = ({ selectedMedia, handleSelectMedia, postData, activeBrand }) => {
  const [inputData, setInputData] = useState({ text: '', style: '', layout: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  const styleDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);

  const showToast = (message) => {
    setToast({ isOpen: true, message });
  };

  const styleOptions = [
    { value: 'Realistic', label: 'Realistic', image: 'https://images.pexels.com/photos/2486168/pexels-photo-2486168.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Cartoon', label: 'Cartoon', image: 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Anime', label: 'Anime', image: 'https://images.pexels.com/photos/669319/pexels-photo-669319.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Abstract', label: 'Abstract', image: 'https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Watercolor', label: 'Watercolor', image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Surreal', label: 'Surreal', image: 'https://images.pexels.com/photos/3640877/pexels-photo-3640877.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Minimalist', label: 'Minimalist', image: 'https://images.pexels.com/photos/2258539/pexels-photo-2258539.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Retro', label: 'Retro', image: 'https://images.pexels.com/photos/358010/pexels-photo-358010.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const layoutOptions = [
    { value: 'Landscape', label: 'Landscape', svg: <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" stroke="currentColor"><rect x="2" y="2" width="28" height="20" rx="2" strokeWidth="2" /></svg> },
    { value: 'Portrait', label: 'Portrait', svg: <svg className="w-6 h-8" viewBox="0 0 24 32" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="28" rx="2" strokeWidth="2" /></svg> },
    { value: 'Square', label: 'Square', svg: <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor"><rect x="2" y="2" width="28" height="28" rx="2" strokeWidth="2" /></svg> },
  ];

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const currentBrandName = postData?.brandName?.trim() || activeBrand?.name?.trim() || "creative";

  const handleInspireMe = () => {
    const brand = currentBrandName;
    const inspirations = [
      `${brand} luxury office with modern design and natural light`,
      `${brand} team celebrating success in a bright workspace`,
      `${brand} product showcase with elegant lighting and premium feel`,
      `${brand} happy customers using our product in real life`,
      `${brand} futuristic branding concept with neon and minimalism`,
      `${brand} lifestyle scene with people enjoying our brand`,
    ];
    const random = inspirations[Math.floor(Math.random() * inspirations.length)];
    setInputData(prev => ({ ...prev, text: random }));
  };

  const handleStyleChange = (value) => {
    setInputData(prev => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
  };

  const handleLayoutChange = (value) => {
    setInputData(prev => ({ ...prev, layout: value }));
    setLayoutDropdownOpen(false);
  };

  const toggleStyleDropdown = () => setStyleDropdownOpen(prev => !prev);
  const toggleLayoutDropdown = () => setLayoutDropdownOpen(prev => !prev);

  const handleGenerateImage = async () => {
    if (!inputData.text.trim()) {
      showToast("Please enter a prompt");
      return;
    }

    setLoading({ generate: true });
    setOutputs([]);

    // Build query with style and layout
    const styleKeyword = inputData.style ? inputData.style.toLowerCase() : "";
    const layoutKeyword = inputData.layout === 'Portrait' ? 'vertical portrait' : inputData.layout === 'Landscape' ? 'horizontal landscape' : 'square';

    // Combine prompt with style and orientation
    const query = `${inputData.text} ${styleKeyword} style ${layoutKeyword} orientation high quality professional`.trim();

    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=20&orientation=${inputData.layout?.toLowerCase() || ''}`);
      if (!res.ok) throw new Error("Failed to fetch images");

      const data = await res.json();
      const images = (data.photos || []).map((photo, i) => ({
        id: `pexels-${photo.id}-${Date.now()}-${i}`,
        type: 'image',
        src: photo.src.medium,
        large: photo.src.large2x,
        alt: photo.alt || `Generated from "${inputData.text}"`,
      }));

      if (images.length === 0) {
        showToast("No images found. Try different keywords!");
      } else {
        setOutputs(images);
        showToast(`Found ${images.length} beautiful images!`);
      }
    } catch (err) {
      console.error("Pexels fetch failed:", err);
      showToast("Failed to generate images. Please try again.");
    } finally {
      setLoading({ generate: false });
    }
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
    <>
      <div className="h-[100%] border border-gray-200 pb-0 overflow-y-auto rounded-lg">
        {outputs.length === 0 ? (
          <div className="flex flex-col gap-8 p-3">
            <div>
              <div className="flex flex-col pb-10 justify-center">
                <h1 className="font-medium text-lg text-blue-700">Input Text Prompt</h1>
                <p className="text-gray-600 text-xs">Enter a text prompt to generate your image.</p>
              </div>
              <div className="space-y-8">
                <div className="relative">
                  <textarea
                    placeholder="Enter your text prompt (e.g., 'A futuristic city at sunset')"
                    value={inputData.text}
                    onChange={(e) => setInputData(prev => ({ ...prev, text: e.target.value }))}
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
                        className="w-full p-3 border cursor-pointer bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
                      >
                        {selectedStyle && (
                          <img src={selectedStyle.image} alt={selectedStyle.label} className="w-6 h-6 object-cover rounded" />
                        )}
                        {inputData.style || 'Select a style'}
                      </button>
                      {styleDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-5 p-3">
                          {styleOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStyleChange(option.value)}
                              className={`flex flex-col cursor-pointer items-center p-2 border rounded-md transition duration-200 ${inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                                }`}
                            >
                              <img src={option.image} alt={option.label} className="w-full h-20 object-cover rounded-md mb-2" />
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
                        className="w-full p-3 cursor-pointer border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                      >
                        {inputData.layout || 'Select a layout'}
                      </button>
                      {layoutDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-3 gap-2 p-2">
                          {layoutOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleLayoutChange(option.value)}
                              className={`flex flex-col cursor-pointer items-center justify-center p-2 border rounded-md transition duration-200 ${inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
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
                  onClick={handleGenerateImage}
                  disabled={loading.generate || !inputData.text}
                  className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading.generate ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Generate Images'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 relative">
            <div className='flex sticky top-0 pt-3  z-50 bg-white flex-row border-b border-b-gray-200  justify-between'>
              <h2 className="font-medium px-2 flex justify-center items-center text-lg text-blue-700 mb-4">
                Generated Images
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

            <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
              {outputs.map((output) => {
                const isSelected = selectedMedia.some(item => item.src === output.src || item === output.src);

                return (
                  <div
                    key={output.id}
                    onClick={() => handleSelectMedia(output.src)}
                    className={`relative bg-white border border-gray-200 rounded-lg cursor-pointer transition duration-300 overflow-hidden mb-4 break-inside-avoid ${isSelected ? ' ring-2 ring-blue-700' : 'border-gray-200 hover:border-blue-500'
                      }`}
                  >
                    <img
                      src={output.src}
                      alt={output.alt}
                      className="w-full h-auto object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-gray-500 truncate">Style: {inputData.style || 'Default'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Dynamic Loading with Perfect Sync */}
        {loading.generate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
              <FloatingAnimation
                showProgressBar={true}
              >
                <FloatingElements.ImageFile />
              </FloatingAnimation>
            </div>
          </div>
        )}
      </div>



      {/* Your Toast */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={() => setToast({ isOpen: false, message: '' })}
        duration={2000}
      />
    </>
  );
};

export default TextToImageTab;