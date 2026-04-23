"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import { ArrowLeft } from 'lucide-react';

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
    { value: 'Youthful', label: 'Youthful Voice', image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Energetic', label: 'Energetic Voice', image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Calm', label: 'Calm Voice', image: 'https://images.pexels.com/photos/3822903/pexels-photo-3822903.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Authoritative', label: 'Authoritative Voice', image: 'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=200' },
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
  };

  const handleVoiceStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, voiceStyle: value }));
    setVoiceStyleDropdownOpen(false);
  };

  const toggleVoiceStyleDropdown = () => {
    setVoiceStyleDropdownOpen((prev) => !prev);
  };

  // Real Pexels video search — same endpoint as TextToVideoTab
  const searchPexelsVideos = async (query) => {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&type=videos&per_page=20`);
      const data = await res.json();
      if (data.error || !data.videos) return [];

      return data.videos.map((video, i) => {
        const hd = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
        const title = video.url.split('/').pop().replace(/-/g, ' ').replace('.jpeg', '');
        return {
          id: `pexels-voice-${video.id}-${i}`,
          type: 'video',
          src: hd.link,
          thumbnail: video.image,
          alt: title || 'Voiceover Video',
        };
      });
    } catch (err) {
      console.error("Pexels search failed:", err);
      return [];
    }
  };

  const handleGenerateVideo = async () => {
    if (!inputData.script.trim()) {
      alert('Please enter a script.');
      return;
    }

    setLoading({ generate: true });
    setOutputs([]);

    let searchQuery = inputData.script;
    if (inputData.voiceStyle) {
      const keywords = {
        'Male': 'male narrator, deep voice, cinematic',
        'Female': 'female voiceover, warm narration',
        'Neutral': 'calm professional voiceover',
        'Deep': 'deep dramatic voice, powerful',
        'Youthful': 'young energetic voice',
        'Energetic': 'excited upbeat narration',
        'Calm': 'soothing calm voice',
        'Authoritative': 'strong commanding voice'
      };
      searchQuery += `, ${keywords[inputData.voiceStyle] || inputData.voiceStyle}, voiceover style`;
    }

    const videos = await searchPexelsVideos(searchQuery);

    setTimeout(() => {
      setOutputs(videos.length > 0 ? videos.slice(0, 20) : [
        { id: 'fallback-1', type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Cinematic Video' },
        { id: 'fallback-2', type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Nature Scene' },
      ]);
      setLoading({ generate: false });
    }, 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (voiceStyleDropdownRef.current && !voiceStyleDropdownRef.current.contains(event.target)) {
        setVoiceStyleDropdownOpen(false);
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
                          className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${inputData.voiceStyle === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
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
              const isSelected = selectedMedia.some((item) => item.id === output.id);

              return (
                <div
                  key={output.id}
                  className={`relative bg-white border rounded-lg cursor-pointer hover:border-blue-700 transition duration-300 overflow-hidden ${isSelected ? 'border-2 border-blue-700' : 'border-gray-200'
                    }`}
                  onClick={() => handleSelectMedia(output)}
                  aria-label={`Select ${output.alt}`}
                >
                  {/* VIDEO PREVIEW — plays on click + hover */}
                  <div className="relative aspect-video bg-black">
                    <video
                      src={output.src}
                      poster={output.thumbnail}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      // Hover to preview
                      onMouseEnter={(e) => e.target.play().catch(() => { })}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                      // Click to play/pause
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.target.paused) {
                          e.target.play();
                        } else {
                          e.target.pause();
                        }
                      }}
                    />

                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/40 rounded-full p-3 opacity-70 group-hover:opacity-100 transition">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7L8 5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="text-xs text-gray-500">Voice Style: {inputData.voiceStyle || 'Default'}</p>
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

export default ScriptToVoiceoverToVideoTab;