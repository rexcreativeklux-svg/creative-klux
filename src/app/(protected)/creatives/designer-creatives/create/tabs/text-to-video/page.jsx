"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

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

  const textPrompts = [
    'A futuristic cityscape animation',
    'A serene beach sunset with waves',
    'A thrilling space adventure',
    'A magical forest with animated creatures',
    'A bustling urban street scene',
  ];

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomPrompt = textPrompts[Math.floor(Math.random() * textPrompts.length)];
    setInputData((prev) => ({ ...prev, text: randomPrompt }));
    console.log('Inspire Me prompt:', randomPrompt);
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
    console.log('Style changed:', value);
  };

  const handleLayoutChange = (value) => {
    setInputData((prev) => ({ ...prev, layout: value }));
    setLayoutDropdownOpen(false);
    console.log('Layout changed:', value);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
  };

  const toggleLayoutDropdown = () => {
    setLayoutDropdownOpen((prev) => !prev);
  };

  const handleGenerateVideo = () => {
    if (!inputData.text) {
      alert('Please enter a text prompt.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs([
        { id: 0, type: 'video', thumbnail: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=512', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Generated Video 1' },
        { id: 1, type: 'video', thumbnail: 'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=512', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Generated Video 2' },
        { id: 2, type: 'video', thumbnail: 'https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=512', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Generated Video 3' },
      ]);
      setLoading({ ...loading, generate: false });
      console.log('Video generated');
    }, 3000);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
                            className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${
                              inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
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
                    <select
                      value={inputData.style}
                      onChange={(e) => handleStyleChange(e.target.value)}
                      className="hidden"
                      aria-label="Style Select"
                    >
                      <option value="" disabled>
                        Select a style
                      </option>
                      {styleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
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
                            className={`flex flex-col items-center justify-center p-2 border rounded-md transition duration-200 ${
                              inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                            }`}
                            aria-label={`Select ${option.label}`}
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
                      aria-label="Layout Select"
                    >
                      <option value="" disabled>
                        Select a layout
                      </option>
                      {layoutOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
        <div className="p-3">
          <h2 className="font-medium text-lg text-blue-700 mb-4">Generated Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {outputs.map((output) => (
              <div
                key={output.id}
                className={`relative bg-white border rounded-lg cursor-pointer hover:border-blue-700 transition duration-300 overflow-hidden ${
                  selectedMedia.some((item) => item.id === output.id) ? 'border-blue-700' : 'border-gray-200'
                }`}
                onClick={() => handleSelectMedia(output)}
                aria-label={`Select ${output.alt}`}
              >
                <img
                  src={output.thumbnail}
                  alt={output.alt}
                  className="w-full h-64 object-cover"
                  onError={() => console.error(`Failed to load video thumbnail: ${output.thumbnail}`)}
                />
                <div className="p-2">
                  <p className="text-xs text-gray-500">Style: {inputData.style || 'Default'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex">
            <button
              onClick={() => setOutputs([])}
              className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
              aria-label="Back to Input"
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
  );
};

export default TextToVideoTab;