"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Video, Download, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(components)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';

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
      value: 'Male',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Male'
    },
    {
      value: 'Female',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
      label: 'Female'
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
    'https://images.pexels.com/photos/7157003/pexels-photo-7157003.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/5699475/pexels-photo-5699475.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/6954162/pexels-photo-6954162.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/7551685/pexels-photo-7551685.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/7091931/pexels-photo-7091931.jpeg?auto=compress&cs=tinysrgb&w=200',
  ];

  // Extract keywords from script using simple NLP approach
  const extractKeywords = (text) => {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'our', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'this', 'that', 'these', 'those', 'have', 'has', 'had', 'into', 'through', 'welcome'];
    
    // Extract words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const filtered = words.filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Count word frequency
    const frequency = {};
    filtered.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);
    
    // If we don't have enough keywords, extract noun-like words
    if (sorted.length === 0) {
      const nounLikeWords = filtered.slice(0, 3);
      return nounLikeWords.length > 0 ? nounLikeWords : ['business', 'people', 'work'];
    }
    
    return sorted;
  };

  // Fetch videos from your API route
  const fetchVideos = async (query) => {
    try {
      const response = await fetch(
        `/api/pexels?query=${encodeURIComponent(query)}&type=videos&per_page=20`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      console.log('Fetched videos for query:', query, 'Count:', data.videos?.length || 0);
      return data.videos || [];
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
  };

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

  const handleGenerateVideo = async () => {
    if (!inputData.script) {
      alert('Please enter a script first.');
      return;
    }

    setLoading({ ...loading, generate: true });
    setOutputs([]);

    try {
      // Extract keywords from the script
      const keywords = extractKeywords(inputData.script);
      console.log('Extracted keywords:', keywords);

      // Collect all videos
      const allVideos = [];
      
      // Try searching with individual keywords first
      for (const keyword of keywords) {
        const videos = await fetchVideos(keyword);
        if (videos.length > 0) {
          allVideos.push(...videos);
        }
      }

      // If we don't have enough videos, try broader searches
      if (allVideos.length < 5) {
        console.log('Not enough videos, trying broader search...');
        const broadSearches = ['business', 'people working', 'office', 'technology', 'creative'];
        
        for (const search of broadSearches) {
          const videos = await fetchVideos(search);
          allVideos.push(...videos);
          if (allVideos.length >= 15) break;
        }
      }

      // Remove duplicates based on video ID
      const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());

      if (uniqueVideos.length === 0) {
        alert('No videos found. Please check:\n1. Your Pexels API key is configured\n2. Your internet connection\n3. Try a different script');
        setLoading({ ...loading, generate: false });
        return;
      }

      console.log(`Found ${uniqueVideos.length} unique videos`);

      // Filter videos based on layout preference
      let filteredVideos = uniqueVideos;
      
      if (inputData.layout === 'Portrait') {
        // Prefer vertical videos
        const verticalVideos = uniqueVideos.filter(v => v.height > v.width);
        if (verticalVideos.length > 0) {
          filteredVideos = verticalVideos;
        }
      } else if (inputData.layout === 'Square') {
        // Prefer square-ish videos
        const squareVideos = uniqueVideos.filter(v => {
          const ratio = v.width / v.height;
          return ratio >= 0.9 && ratio <= 1.1;
        });
        if (squareVideos.length > 0) {
          filteredVideos = squareVideos;
        }
      } else {
        // Landscape - prefer horizontal videos
        const horizontalVideos = uniqueVideos.filter(v => v.width > v.height);
        if (horizontalVideos.length > 0) {
          filteredVideos = horizontalVideos;
        }
      }

      // Shuffle and take top 9
      const selectedVideos = filteredVideos
        .sort(() => Math.random() - 0.5)
        .slice(0, 9);

      // Format videos for display
      const formattedVideos = selectedVideos.map((video, index) => {
        // Get the best quality video file
        let videoFile = video.video_files.find(file => 
          file.quality === 'hd' && file.width <= 1920
        );
        
        if (!videoFile) {
          videoFile = video.video_files.find(file => file.quality === 'sd');
        }
        
        if (!videoFile) {
          videoFile = video.video_files[0];
        }

        return {
          type: 'video',
          src: videoFile.link,
          alt: `Generated Video ${index + 1}`,
          thumbnail: video.image,
          duration: video.duration,
          width: video.width,
          height: video.height,
          pexelsUrl: video.url,
          user: video.user?.name || 'Pexels',
        };
      });

      setOutputs(formattedVideos);
      console.log(`Successfully generated ${formattedVideos.length} videos from script`);
    } catch (error) {
      console.error('Error generating videos:', error);
      alert('An error occurred while generating videos. Please check the console for details and try again.');
    } finally {
      setLoading({ ...loading, generate: false });
    }
  };

  const handleSendOutput = (index, destination) => {
    if (!outputs[index]) {
      alert('No video output available to send.');
      return;
    }
    setLoading({ ...loading, export: true });
    setTimeout(() => {
      console.log(`Video ${index + 1} sent to ${destination}`);
      alert(`Video sent to ${destination}!`);
      setLoading({ ...loading, export: false });
    }, 1000);
  };

  const handleDownload = async (index) => {
    if (!outputs[index]) {
      alert('No video output available to download.');
      return;
    }
    
    try {
      setLoading({ ...loading, export: true });
      
      // Fetch the video blob
      const response = await fetch(outputs[index].src);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-output-${index + 1}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download triggered for video:', index + 1);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download video. You can try viewing it on Pexels instead.');
    } finally {
      setLoading({ ...loading, export: false });
    }
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

  const selectedVoiceoverStyle = voiceoverStyleOptions.find((option) => option.value === inputData.voiceoverStyle);

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Script to Voiceover to Video</div>

      <Breadcrumbs
        items={[
          { name: 'Creatives', href: '/creatives' },
          { name: 'AI Studio', href: null },
          { name: 'Script to Voiceover to Video', href: '/creatives/ai-studio/script-to-voiceover-to-video' },
        ]}
      />

      <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-surface rounded-xl py-4">
        <div className="overflow-auto space-y-6">
          {outputs.length === 0 ? (
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
                      className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-surface cursor-pointer transition duration-300 text-sm"
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
                          className="w-full p-3 cursor-pointer border bg-surface border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
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
                          <div className="absolute z-10 mt-2 w-full bg-surface border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-4 p-3">
                            {voiceoverStyleOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleVoiceoverStyleChange(option.value)}
                                className={`flex cursor-pointer flex-col items-center p-2 border rounded-md transition duration-200 ${
                                  inputData.voiceoverStyle === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-surface hover:border-blue-700'
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
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Layout</label>
                      <div className="relative" ref={layoutDropdownRef}>
                        <button
                          onClick={toggleLayoutDropdown}
                          className="w-full p-3 border cursor-pointer bg-surface border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                        >
                          {inputData.layout || 'Select a layout'}
                        </button>
                        {layoutDropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-surface border border-gray-200 rounded-md shadow-lg grid grid-cols-3 gap-2 p-2">
                            {layoutOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleLayoutChange(option.value)}
                                className={`flex cursor-pointer justify-center flex-col items-center p-2 border rounded-md transition duration-200 ${
                                  inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-surface hover:border-blue-700'
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
                      <div key={index} className="relative h-34 bg-surface border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={`Sample Thumbnail ${index + 1}`}
                          className="w-full cursor-pointer object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                <div className="flex justify-center gap-2">
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Generated Videos ({outputs.length})</h1>
                    <p className="text-gray-600 text-xs">Review and select your generated videos from Pexels.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {outputs.map((output, index) => (
                  <div
                    key={index}
                    className="relative bg-surface border border-gray-200 rounded-lg cursor-pointer hover:border-blue-700 transition duration-300 overflow-hidden"
                  >
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => toggleMenu(index)}
                        className="p-1 bg-gray-100 cursor-pointer rounded-full hover:bg-gray-200 transition duration-200"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {menuOpen === index && (
                        <div className="absolute right-0 mt-2 w-40 bg-surface border border-gray-200 rounded-md shadow-lg">
                          <button
                            onClick={() => handleDownload(index)}
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            disabled={loading.export}
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                          <button
                            onClick={() => handleSendOutput(index, 'Creatives')}
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            disabled={loading.export}
                          >
                            <Video className="w-4 h-4" /> Use
                          </button>
                          <a
                            href={output.pexelsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            View on Pexels
                          </a>
                        </div>
                      )}
                    </div>
                    <video
                      src={output.src}
                      poster={output.thumbnail}
                      controls
                      preload="metadata"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(output.duration)}s
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {output.user}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex gap-4">
                <button
                  onClick={handleBack}
                  className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateVideo}
                  className="border cursor-pointer border-blue-700 bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition duration-300 text-sm font-medium"
                >
                  Generate More
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

export default ScriptToVoiceoverToVideoPipelinePage;