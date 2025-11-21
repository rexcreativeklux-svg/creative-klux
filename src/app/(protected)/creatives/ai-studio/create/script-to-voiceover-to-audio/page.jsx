"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Video, Download, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(protected)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const ScriptToVoiceoverToVideoPipelinePage = () => {
  const router = useRouter();
  const [inputData, setInputData] = useState({ script: '', voiceoverStyle: '', exportFormat: 'MP4', layout: 'Square' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false, export: false });
  const [menuOpen, setMenuOpen] = useState(null);
  const [voiceoverStyleDropdownOpen, setVoiceoverStyleDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const voiceoverStyleDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);

  const inspirePrompts = [
    'Welcome to our product launch event, showcasing innovation!',
    'A journey through a futuristic cityscape at dusk.',
    'An inspiring speech about overcoming challenges.',
    'A heartfelt story set in a cozy mountain village.',
  ];

  const voiceoverStyleOptions = [
    {
      value: 'Male ',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Male '
    },
    {
      value: 'Female ',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Female '
    },
    {
      value: 'Neutral AI',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Neutral AI'
    },
    {
      value: 'Energetic',
      image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Energetic'
    },
    {
      value: 'Calm',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Calm'
    },
    {
      value: 'Dramatic',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Dramatic'
    },
    {
      value: 'Childlike',
      image: 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=200',
      label: 'Childlike'
    },
    {
      value: 'Authoritative',
      image: 'https://images.pexels.com/photos/936564/pexels-photo-936564.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Authoritative'
    },
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

 const staticThumbnails = [
  'https://images.pexels.com/photos/7157003/pexels-photo-7157003.jpeg?auto=compress&cs=tinysrgb&w=200', // Studio mic with pop filter
  'https://images.pexels.com/photos/5699475/pexels-photo-5699475.jpeg?auto=compress&cs=tinysrgb&w=200', // Narrator recording in booth
  'https://images.pexels.com/photos/6954162/pexels-photo-6954162.jpeg?auto=compress&cs=tinysrgb&w=200', // Close-up of microphone with warm light
  'https://images.pexels.com/photos/7551685/pexels-photo-7551685.jpeg?auto=compress&cs=tinysrgb&w=200', // Headphones and mixing console
  'https://images.pexels.com/photos/7091931/pexels-photo-7091931.jpeg?auto=compress&cs=tinysrgb&w=200', // Voice actor performing
];



  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setInputData((prev) => ({ ...prev, script: randomPrompt }));
    console.log('Inspire Me prompt:', randomPrompt);
  };

  const handleScriptChange = (e) => {
    setInputData((prev) => ({ ...prev, script: e.target.value }));
  };

  const handleVoiceoverStyleChange = (voiceoverStyle) => {
    setInputData((prev) => ({ ...prev, voiceoverStyle }));
    setVoiceoverStyleDropdownOpen(false);
  };

  const handleLayoutChange = (layout) => {
    setInputData((prev) => ({ ...prev, layout }));
    setLayoutDropdownOpen(false);
  };

  const toggleVoiceoverStyleDropdown = () => {
    setVoiceoverStyleDropdownOpen((prev) => !prev);
    setLayoutDropdownOpen(false);
  };

  const toggleLayoutDropdown = () => {
    setLayoutDropdownOpen((prev) => !prev);
    setVoiceoverStyleDropdownOpen(false);
  };

  const handleGenerateVideo = () => {
    if (!inputData.script) {
      alert('Please enter a script first.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      const newOutputs = [
        {
          type: 'video',
          src: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          alt: 'Voiceover Video 1',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+1',
        },
        {
          type: 'video',
          src: 'https://via.placeholder.com/1280x720.mp4?text=Voiceover+Video+2',
          alt: 'Voiceover Video 2',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+2',
        },
        {
          type: 'video',
          src: 'https://via.placeholder.com/1280x720.mp4?text=Voiceover+Video+3',
          alt: 'Voiceover Video 3',
          thumbnail: 'https://via.placeholder.com/1280x720?text=Video+Thumbnail+3',
        },
      ];
      setOutputs(newOutputs);
      setLoading({ ...loading, generate: false });
      console.log('Videos generated from script:', inputData.script);
    }, 3000); // Minimum 3-second delay
  };

  const handleSendOutput = (index, destination) => {
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

  const handleDownload = (index) => {
    if (!outputs[index]) {
      alert('No video output available to download.');
      return;
    }
    setLoading({ ...loading, export: true });
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = outputs[index].src;
      link.download = `video-output-${index + 1}.${inputData.exportFormat.toLowerCase()}`;
      link.click();
      setLoading({ ...loading, export: false });
      console.log('Download triggered for video:', index + 1);
    }, 1000);
  };

  const toggleMenu = (index) => {
    setMenuOpen(menuOpen === index ? null : index);
  };

  const handleBack = () => {
    setOutputs([]);
    setInputData((prev) => ({ ...prev, script: '', voiceoverStyle: '', exportFormat: 'MP4', layout: 'Square' }));
    setVoiceoverStyleDropdownOpen(false);
    setLayoutDropdownOpen(false);
    console.log('Back to input prompt');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        voiceoverStyleDropdownRef.current &&
        !voiceoverStyleDropdownRef.current.contains(event.target) &&
        layoutDropdownRef.current &&
        !layoutDropdownRef.current.contains(event.target)
      ) {
        setVoiceoverStyleDropdownOpen(false);
        setLayoutDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find the selected voiceover style's image
  const selectedVoiceoverStyle = voiceoverStyleOptions.find((option) => option.value === inputData.voiceoverStyle);

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Script to Voiceover to Video </div>

      <Breadcrumbs
        items={[
          { name: 'Creatives', href: '/creatives' },
          { name: 'AI Studio', href: null },
          { name: 'Script to Voiceover to Video', href: '/creatives/ai-studio/script-to-voiceover-to-video' },
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
                      <h1 className="font-medium text-lg text-blue-700">Input Script</h1>
                      <p className="text-gray-600 text-xs">Enter a script or get inspired to generate a narrated video.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="relative">
                    <textarea
                      placeholder="Enter your script (e.g., 'Welcome to our product launch...')"
                      value={inputData.script}
                      onChange={handleScriptChange}
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Voiceover Style</label>
                      <div className="relative" ref={voiceoverStyleDropdownRef}>
                        <button
                          onClick={toggleVoiceoverStyleDropdown}
                          className="w-full p-3 cursor-pointer border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
                        >
                          {selectedVoiceoverStyle && (
                            <img
                              src={selectedVoiceoverStyle.image}
                              alt={selectedVoiceoverStyle.label}
                              className="w-6 h-6 object-cover rounded"
                            />
                          )}
                          {inputData.voiceoverStyle || 'Select a voiceover style'}
                        </button>
                        {voiceoverStyleDropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-4 p-3">
                            {voiceoverStyleOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleVoiceoverStyleChange(option.value)}
                                className={`flex cursor-pointer flex-col items-center p-2 border rounded-md transition duration-200 ${inputData.voiceoverStyle === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
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
                        <select
                          value={inputData.voiceoverStyle}
                          onChange={(e) => handleVoiceoverStyleChange(e.target.value)}
                          className="hidden"
                        >
                          <option value="" disabled>Select a voiceover style</option>
                          {voiceoverStyleOptions.map((option) => (
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
                                className={`flex cursor-pointer justify-center flex-col items-center p-2 border rounded-md transition duration-200 ${inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
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
                    disabled={loading.generate || !inputData.script}
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
                  <h2 className="font-medium text-lg text-blue-700 mb-4">Sample Thumbnails</h2>
                  <div className="grid grid-cols-5 gap-4">
                    {staticThumbnails.map((thumbnail, index) => (
                      <div key={index} className="relative h-34 bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={`Sample Thumbnail ${index + 1}`}
                          className="w-full cursor-pointer object-cover"
                          onError={() => console.error(`Failed to load static thumbnail: ${thumbnail}`)}
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
                            onClick={() => handleSendOutput(index, 'Creatives')}
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
                      className="w-full h-64 object-cover rounded-lg"
                      style={{ aspectRatio: '1280/720' }}
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
                <FloatingAnimation animationDuration="3s" showProgressBar={true} >
                  <FloatingElements.ScriptFile />
                </FloatingAnimation>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptToVoiceoverToVideoPipelinePage;
