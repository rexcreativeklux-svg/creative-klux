"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Image, MoreVertical, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(protected)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const TextToImagePipelinePage = () => {
  const router = useRouter();
  const [inputData, setInputData] = useState({ text: '', style: '', layout: 'Square' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [menuOpen, setMenuOpen] = useState(null);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const styleDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);

  const inspirePrompts = [
    'A futuristic city at sunset',
    'A serene mountain landscape',
    'An abstract colorful pattern',
    'A steampunk airship in the clouds',
    'A cozy cabin in a snowy forest',
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

  const staticImages = [
    'https://images.pexels.com/photos/2471234/pexels-photo-2471234.jpeg?auto=compress&cs=tinysrgb&w=200', // Futuristic city
    'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=200', // Mountain landscape
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200', // Abstract digital art
    'https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=200', // Steampunk-inspired airship-like scene
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=200', // Cozy cabin in forest
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

  const handleGenerateImage = () => {
    if (!inputData.text) {
      alert('Please enter a text prompt first.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      const newOutputs = [
        { type: 'image', src: 'https://via.placeholder.com/512?text=Generated+Image+1', alt: 'Generated Image 1' },
        { type: 'image', src: 'https://via.placeholder.com/512?text=Generated+Image+2', alt: 'Generated Image 2' },
        { type: 'image', src: 'https://via.placeholder.com/512?text=Generated+Image+3', alt: 'Generated Image 3' },
      ];
      setOutputs(newOutputs);
      setLoading({ ...loading, generate: false });
      console.log('Images generated from text:', inputData.text);
    }, 3000); // Minimum 3-second delay
  };

  const handleDownload = (index) => {
    if (!outputs[index]) {
      alert('No image output available to download.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.src = outputs[index]?.src || 'https://via.placeholder.com/512';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 512, 512);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-image-${index + 1}.png`;
        link.click();
        setLoading({ ...loading, generate: false });
        console.log('Download triggered for image:', index);
      };
      img.onerror = () => {
        alert('Failed to load image for download.');
        setLoading({ ...loading, generate: false });
      };
    }, 1000);
  };

  const handleUse = (index, destination) => {
    if (!outputs[index]) {
      alert('No image output available to send.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setTimeout(() => {
      console.log(`Image ${index + 1} sent to ${destination}`);
      setLoading({ ...loading, generate: false });
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
      <div className="font-medium text-xl mb-6">Text to Image Pipeline</div>

      <Breadcrumbs
        items={[
          { name: 'Creatives', href: '/creatives' },
          { name: 'AI Studio', href: null },
          { name: 'Text to Image', href: '/creatives/ai-studio/text-to-image' },
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
                      <Image className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">Input Text Prompt</h1>
                      <p className="text-gray-600 text-xs">Enter a text prompt or get inspired to generate your image.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="relative">
                    <textarea
                      placeholder="Enter your text prompt (e.g., 'A futuristic city at sunset')"
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
                                className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${
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
                                className={`flex flex-col items-center justify-center p-2 border rounded-md transition duration-200 ${
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
                    onClick={handleGenerateImage}
                    className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading.generate || !inputData.text}
                  >
                    {loading.generate ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Generate Images'
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="">
                  <h2 className="font-medium text-lg text-blue-700 mb-4">Generated Images</h2>
                  <div className="grid grid-cols-5 gap-4">
                    {staticImages.map((image, index) => (
                      <div key={index} className="relative bg-white h-35 border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Sample Image ${index + 1}`}
                          className="w-full  cursor-pointer object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Results Section */
            <div className="border border-gray-200 p-3 h-[100%] rounded-lg">
              <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                <div className="flex justify-center gap-2">
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Generated Images</h1>
                    <p className="text-gray-600 text-xs">Review and select your generated images.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                            <Image className="w-4 h-4" /> Use
                          </button>
                        </div>
                      )}
                    </div>
                    <img
                      src={output.src}
                      alt={output.alt}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-xs text-gray-500">Style: {inputData.style || 'Default'}</p>
                    </div>
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
                        <FloatingAnimation animationDuration="3s" showProgressBar={true} >
                          <FloatingElements.ImageFile />
                        </FloatingAnimation>
                      </div>
                    </div>
                  )}
        </div>
      </div>
    </div>
  );
};

export default TextToImagePipelinePage;

