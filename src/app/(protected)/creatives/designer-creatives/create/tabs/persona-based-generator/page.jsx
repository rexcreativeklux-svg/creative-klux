"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const PersonaBasedGeneratorTab = ({ selectedMedia, handleSelectMedia }) => {
  const [inputData, setInputData] = useState({ persona: '', style: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const styleDropdownRef = useRef(null);

  const styleOptions = [
    { value: 'Realistic', label: 'Realistic', image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Cartoon', label: 'Cartoon', image: 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Anime', label: 'Anime', image: 'https://images.pexels.com/photos/669319/pexels-photo-669319.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Abstract', label: 'Abstract', image: 'https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Watercolor', label: 'Watercolor', image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Surreal', label: 'Surreal', image: 'https://images.pexels.com/photos/3640877/pexels-photo-3640877.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Minimalist', label: 'Minimalist', image: 'https://images.pexels.com/photos/2258539/pexels-photo-2258539.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Retro', label: 'Retro', image: 'https://images.pexels.com/photos/1234567/pexels-photo-1234567.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const personaPrompts = [
    'A confident young entrepreneur in a modern office',
    'A medieval knight in shining armor',
    'A futuristic AI researcher in a high-tech lab',
    'A creative artist painting in a vibrant studio',
    'A cheerful barista in a cozy coffee shop',
  ];

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, persona: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomPersona = personaPrompts[Math.floor(Math.random() * personaPrompts.length)];
    setInputData((prev) => ({ ...prev, persona: randomPersona }));
    console.log('Inspire Me persona:', randomPersona);
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
    console.log('Style changed:', value);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
  };

  const handleGenerateImage = () => {
    if (!inputData.persona) {
      alert('Please enter a persona description.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs([
        { id: 0, type: 'image', src: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=512', alt: 'Generated Persona 1' },
        { id: 1, type: 'image', src: 'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=512', alt: 'Generated Persona 2' },
        { id: 2, type: 'image', src: 'https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=512', alt: 'Generated Persona 3' },
      ]);
      setLoading({ ...loading, generate: false });
      console.log('Persona image generated');
    }, 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setStyleDropdownOpen(false);
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
              <h1 className="font-medium text-lg text-blue-700">Input Persona Description</h1>
              <p className="text-gray-600 text-xs">Enter a persona description to generate an image.</p>
            </div>
            <div className="space-y-8">
              <div className="relative">
                <textarea
                  placeholder="Enter your persona description (e.g., 'A confident young entrepreneur...')"
                  value={inputData.persona}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                  aria-label="Persona Description"
                />
                <button
                  onClick={handleInspireMe}
                  className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                  aria-label="Inspire Me"
                >
                  Inspire Me
                </button>
              </div>
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
                            className="w-full h-25 object-cover rounded-md mb-2"
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
              <button
                onClick={handleGenerateImage}
                className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading.generate || !inputData.persona}
                aria-label="Generate Image"
              >
                {loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Generate Image'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <h2 className="font-medium text-lg text-blue-700 mb-4">Generated Images</h2>
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
                  src={output.src}
                  alt={output.alt}
                  className="w-full h-64 object-cover"
                  onError={() => console.error(`Failed to load image: ${output.src}`)}
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
              <FloatingElements.ImageFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaBasedGeneratorTab;