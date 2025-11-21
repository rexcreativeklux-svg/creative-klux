"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const ScriptToVoiceoverToVideoTab = ({ selectedMedia, handleSelectMedia }) => {
  const [inputData, setInputData] = useState({ script: '', voiceStyle: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [voiceStyleDropdownOpen, setVoiceStyleDropdownOpen] = useState(false);
  const voiceStyleDropdownRef = useRef(null);

  const voiceStyleOptions = [
    { value: 'Male', label: 'Male Voice', image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Female', label: 'Female Voice', image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Neutral', label: 'Neutral Voice', image: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Deep', label: 'Deep Voice', image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Youthful', label: 'Youthful Voice', image: 'https://images.pexels.com/photos/1234567/pexels-photo-1234567.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Energetic', label: 'Energetic Voice', image: 'https://images.pexels.com/photos/2345678/pexels-photo-2345678.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Calm', label: 'Calm Voice', image: 'https://images.pexels.com/photos/3456789/pexels-photo-3456789.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Authoritative', label: 'Authoritative Voice', image: 'https://images.pexels.com/photos/4567890/pexels-photo-4567890.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const scriptPrompts = [
    'Welcome to our brand story, where innovation meets creativity...',
    'Once upon a time in a futuristic city...',
    'Join us on a journey through the stars...',
    'Discover the secrets of a hidden world...',
    'Experience the thrill of adventure in a vibrant landscape...',
  ];

  const selectedVoiceStyle = voiceStyleOptions.find((option) => option.value === inputData.voiceStyle);

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, script: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomScript = scriptPrompts[Math.floor(Math.random() * scriptPrompts.length)];
    setInputData((prev) => ({ ...prev, script: randomScript }));
    console.log('Inspire Me script:', randomScript);
  };

  const handleVoiceStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, voiceStyle: value }));
    setVoiceStyleDropdownOpen(false);
    console.log('Voice style changed:', value);
  };

  const toggleVoiceStyleDropdown = () => {
    setVoiceStyleDropdownOpen((prev) => !prev);
  };

  const handleGenerateVideo = () => {
    if (!inputData.script) {
      alert('Please enter a script.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs([
        { id: 0, type: 'video', thumbnail: 'https://via.placeholder.com/512?text=Video+1', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Generated Video 1' },
        { id: 1, type: 'video', thumbnail: 'https://via.placeholder.com/512?text=Video+2', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Generated Video 2' },
        { id: 2, type: 'video', thumbnail: 'https://via.placeholder.com/512?text=Video+3', src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Generated Video 3' },
      ]);
      setLoading({ ...loading, generate: false });
      console.log('Video with voiceover generated');
    }, 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (voiceStyleDropdownRef.current && !voiceStyleDropdownRef.current.contains(event.target)) {
        setVoiceStyleDropdownOpen(false);
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
              <h1 className="font-medium text-lg text-blue-700">Input Script</h1>
              <p className="text-gray-600 text-xs">Enter a script to generate a video with voiceover.</p>
            </div>
            <div className="space-y-8">
              <div className="relative">
                <textarea
                  placeholder="Enter your script (e.g., 'Welcome to our brand story...')"
                  value={inputData.script}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                  aria-label="Script Input"
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Voice Style</label>
                <div className="relative" ref={voiceStyleDropdownRef}>
                  <button
                    onClick={toggleVoiceStyleDropdown}
                    className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
                    aria-label="Select Voice Style"
                  >
                    {selectedVoiceStyle && (
                      <img
                        src={selectedVoiceStyle.image}
                        alt={selectedVoiceStyle.label}
                        className="w-6 h-6 object-cover rounded"
                        onError={() => console.error(`Failed to load selected voice style image: ${selectedVoiceStyle.image}`)}
                      />
                    )}
                    {inputData.voiceStyle || 'Select a voice style'}
                  </button>
                  {voiceStyleDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-5 p-3">
                      {voiceStyleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleVoiceStyleChange(option.value)}
                          className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${
                            inputData.voiceStyle === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
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
                    value={inputData.voiceStyle}
                    onChange={(e) => handleVoiceStyleChange(e.target.value)}
                    className="hidden"
                    aria-label="Voice Style Select"
                  >
                    <option value="" disabled>
                      Select a voice style
                    </option>
                    {voiceStyleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateVideo}
                className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading.generate || !inputData.script}
                aria-label="Generate Video"
              >
                {loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Generate Video'
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
                />
                <div className="p-2">
                  <p className="text-xs text-gray-500">Voice Style: {inputData.voiceStyle || 'Default'}</p>
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

export default ScriptToVoiceoverToVideoTab;