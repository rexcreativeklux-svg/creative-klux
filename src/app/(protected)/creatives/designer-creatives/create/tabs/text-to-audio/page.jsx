"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FileUp } from 'lucide-react';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const TextToAudioTab = () => {
  const [inputData, setInputData] = useState({ text: '', style: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const styleDropdownRef = useRef(null);

  const styleOptions = [
    { value: 'Classical', label: 'Classical', image: 'https://images.pexels.com/photos/164693/pexels-photo-164693.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Electronic', label: 'Electronic', image: 'https://images.pexels.com/photos/159376/pexels-photo-159376.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Jazz', label: 'Jazz', image: 'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Pop', label: 'Pop', image: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Ambient', label: 'Ambient', image: 'https://images.pexels.com/photos/161154/pexels-photo-161154.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const staticAudios = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  ];

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)].value;
    setInputData((prev) => ({ ...prev, style: randomStyle }));
    console.log('Inspire Me style:', randomStyle);
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
    console.log('Style changed:', value);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
  };

  const handleGenerateAudio = () => {
    if (!inputData.text) {
      alert('Please enter a text prompt.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs([
        { id: 0, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', alt: 'Generated Audio 1' },
        { id: 1, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', alt: 'Generated Audio 2' },
        { id: 2, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', alt: 'Generated Audio 3' },
      ]);
      setLoading({ ...loading, generate: false });
      console.log('Audio generated');
    }, 3000);
  };

  const handleSelectMedia = (media) => {
    console.log('Selected audio:', media.alt);
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
    <div className="h-[100%] border border-gray-200 overflow-y-auto rounded-lg">
      {outputs.length === 0 ? (
        <div className="flex flex-col gap-20 p-3">
          <div>
            <div className="flex flex-col pb-5 justify-center">
              <h1 className="font-medium text-lg text-blue-700">Input Text Prompt</h1>
              <p className="text-gray-600 text-xs">Enter a text prompt or get inspired to generate your audio.</p>
            </div>
            <div className="space-y-8">
              <div className="relative">
                <textarea
                  placeholder="Enter your text prompt (e.g., 'A soothing piano melody')"
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
              <button
                onClick={handleGenerateAudio}
                className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading.generate || !inputData.text}
                aria-label="Generate Audio"
              >
                {loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Generate Audio'
                )}
              </button>
            </div>
          </div>
          <div>
            <h2 className="font-medium text-lg text-blue-700 mb-4">Sample Audios</h2>
            <div className="grid grid-cols-5 gap-4">
              {staticAudios.map((audio, index) => (
                <div
                  key={index}
                  className="relative bg-white h-35 border rounded-lg overflow-hidden cursor-pointer border-gray-200"
                  onClick={() => handleSelectMedia({ id: `static-audio-${index}`, src: audio, alt: `Sample Audio ${index + 1}`, type: 'audio' })}
                  aria-label={`Select Sample Audio ${index + 1}`}
                >
                  <audio controls className="w-full h-35 object-cover">
                    <source src={audio} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <h2 className="font-medium text-lg text-blue-700 mb-4">Generated Audio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {outputs.map((output) => (
              <div
                key={output.id}
                className="relative bg-white border rounded-lg cursor-pointer hover:border-blue-700 transition duration-300 overflow-hidden border-gray-200"
                onClick={() => handleSelectMedia(output)}
                aria-label={`Select ${output.alt}`}
              >
                <audio controls className="w-full h-16">
                  <source src={output.src} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
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
              <FloatingElements.FileUp />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToAudioTab;