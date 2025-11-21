"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Video, MoreVertical, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(protected)/Breadcrumbs';
import KiteAnimation, { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const TextToVideoPipelinePage = () => {
  const router = useRouter();
  const [inputData, setInputData] = useState({ text: '', style: '', layout: 'Square' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false, export: false });
  const [menuOpen, setMenuOpen] = useState(null);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const styleDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);

  const inspirePrompts = [
    'A futuristic cityscape animation',
    'A serene ocean wave simulation',
    'An abstract particle explosion',
    'A steampunk machine in motion',
    'A cozy forest twilight scene',
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

const staticVideos = [
  // Cinematic futuristic city
  'https://images.pexels.com/photos/313782/pexels-photo-313782.jpeg?auto=compress&cs=tinysrgb&w=200',
  // Abstract glowing particles
  'https://images.pexels.com/photos/7130555/pexels-photo-7130555.jpeg?auto=compress&cs=tinysrgb&w=200',
  // Neon cyberpunk street
  'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=200',
  // Water simulation / motion background
  'https://images.pexels.com/photos/1080884/pexels-photo-1080884.jpeg?auto=compress&cs=tinysrgb&w=200',
  // Film editing / cinematic theme
  'https://images.pexels.com/photos/7991370/pexels-photo-7991370.jpeg?auto=compress&cs=tinysrgb&w=200',
];


  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setInputData((prev) => ({ ...prev, text: randomPrompt }));
    console.log('Inspire Me prompt:', randomPrompt);
  };

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleStyleChange = (style) => {
    setInputData((prev) => ({ ...prev, style }));
    setStyleDropdownOpen(false);
  };

  const handleLayoutChange = (layout) => {
    setInputData((prev) => ({ ...prev, layout }));
    setLayoutDropdownOpen(false);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
    setLayoutDropdownOpen(false);
  };

  const toggleLayoutDropdown = () => {
    setLayoutDropdownOpen((prev) => !prev);
    setStyleDropdownOpen(false);
  };

  const handleGenerateVideo = () => {
    if (!inputData.text) {
      alert('Please enter a text prompt first.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      const newOutputs = [
        {
          type: 'video',
          src: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          alt: 'Generated Video 1',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+1',
        },
        {
          type: 'video',
          src: 'https://via.placeholder.com/1280x720.mp4?text=Generated+Video+2',
          alt: 'Generated Video 2',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+2',
        },
        {
          type: 'video',
          src: 'https://via.placeholder.com/1280x720.mp4?text=Generated+Video+3',
          alt: 'Generated Video 3',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+3',
        },
        {
          type: 'video',
          src: 'https://via.placeholder.com/1280x720.mp4?text=Generated+Video+4',
          alt: 'Generated Video 4',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+4',
        },
      ];
      setOutputs(newOutputs);
      setLoading({ ...loading, generate: false });
      console.log('Videos generated from text:', inputData.text);
    }, 3000); // Minimum 3-second delay
  };

  const handleDownload = (index) => {
    if (!outputs[index]) {
      alert('No video output available to download.');
      return;
    }
    setLoading({ ...loading, export: true });
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = outputs[index]?.src || 'https://via.placeholder.com/1280x720.mp4';
      link.download = `generated-video-${index + 1}.mp4`;
      link.click();
      setLoading({ ...loading, export: false });
      console.log('Download triggered for video:', index);
    }, 1000);
  };

  const handleUse = (index, destination) => {
    if (!outputs[index]) {
      alert('No video output available to send.');
      return;
    }
    setLoading({ ...loading, export: true });
    setTimeout(() => {
      console.log(`Video ${index + 1} sent to ${destination}`);
      setLoading({ ...loading, export: false });
    }, 1000);
  };

  const toggleMenu = (index) => {
    setMenuOpen(menuOpen === index ? null : index);
  };

  const handleBack = () => {
    setOutputs([]);
    setInputData((prev) => ({ ...prev, text: '', style: '', layout: 'Square' }));
    setStyleDropdownOpen(false);
    setLayoutDropdownOpen(false);
    console.log('Back to input prompt');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        styleDropdownRef.current &&
        !styleDropdownRef.current.contains(event.target) &&
        layoutDropdownRef.current &&
        !layoutDropdownRef.current.contains(event.target)
      ) {
        setStyleDropdownOpen(false);
        setLayoutDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find the selected style's image
  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

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
            /* Input Section */
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
                          className="w-full p-3 border cursor-pointer bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
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
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-4 p-3">
                            {styleOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStyleChange(option.value)}
                                className={`flex flex-col cursor-pointer items-center p-2 border rounded-md transition duration-200 ${
                                  inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                                }`}
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
                        <select
                          value={inputData.style}
                          onChange={(e) => handleStyleChange(e.target.value)}
                          className="hidden"
                        >
                          <option value="" disabled>Select a style</option>
                          {styleOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Layout</label>
                      <div className="relative" ref={layoutDropdownRef}>
                        <button
                          onClick={toggleLayoutDropdown}
                          className="w-full p-3 border cursor-pointer bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                        >
                          {inputData.layout || 'Select a layout'}
                        </button>
                        {layoutDropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-3 gap-2 p-2">
                            {layoutOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleLayoutChange(option.value)}
                                className={`flex flex-col cursor-pointer items-center justify-center p-2 border rounded-md transition duration-200 ${
                                  inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                                }`}
                              >
                                <div className="mb-2">{option.svg}</div>
                                <span className="text-sm text-gray-700">{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <select
                          value={inputData.layout}
                          onChange={(e) => handleLayoutChange(e.target.value)}
                          className="hidden"
                        >
                          <option value="" disabled>Select a layout</option>
                          {layoutOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
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

              <div>
                <div className="">
                  <h2 className="font-medium text-lg text-blue-700 mb-4">Created Videos</h2>
                  <div className="grid grid-cols-5 gap-4">
                    {staticVideos.map((video, index) => (
                      <div key={index} className="relative bg-white border h-35 border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={video}
                          alt={`Created Video ${index + 1}`}
                          className="w-full cursor-pointer object-contain"
                          onError={() => console.error(`Failed to load static image: ${video}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Results Section */
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                <div className="flex justify-center gap-2">
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Generated Videos</h1>
                    <p className="text-gray-600 text-xs">Review and select your generated videos.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {outputs.map((output, index) => (
                  <div
                    key={index}
                    className="relative bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-700 transition duration-300 overflow-hidden"
                  >
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => toggleMenu(index)}
                        className="p-1 bg-gray-100 cursor-pointer rounded-full hover:bg-gray-200 transition duration-200"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {menuOpen === index && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleDownload(index)}
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                          <button
                            onClick={() => handleUse(index, 'Creatives')}
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" /> Use
                          </button>
                        </div>
                      )}
                    </div>
                    <video
                      src={output.src}
                      controls
                      className="w-full h-64 object-cover"
                    />
               
                  </div>
                ))}
              </div>
              <div className="mt-10 flex">
                <button
                  onClick={handleBack}
                  className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                >
                  Back
                </button>
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
      </div>
    </div>
  );
};

export default TextToVideoPipelinePage;
