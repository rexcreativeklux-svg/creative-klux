"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import { Play, Pause, Download, Volume2, ArrowLeft } from 'lucide-react';

// Truncate long titles cleanly
const truncateTitle = (text) => {
  if (!text) return "Untitled Audio";
  return text.length > 50 ? text.substring(0, 20) + "..." : text;
};

// Style → subtle accent color
const getStyleColor = (style) => {
  const colors = {
    Classical: "border-amber-400",
    Electronic: "border-cyan-400",
    Jazz: "border-purple-400",
    Pop: "border-pink-400",
    Ambient: "border-teal-400",
  };
  return colors[style] || "border-blue-400";
};

const TextToAudioTab = () => {
  const [inputData, setInputData] = useState({ text: '', style: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const styleDropdownRef = useRef(null);
  const audioRefs = useRef({});

  const styleOptions = [
    { value: 'Classical', label: 'Classical', image: 'https://images.pexels.com/photos/1693095/pexels-photo-1693095.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { value: 'Electronic', label: 'Electronic', image: 'https://images.pexels.com/photos/4614165/pexels-photo-4614165.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { value: 'Jazz', label: 'Jazz', image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { value: 'Pop', label: 'Pop', image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { value: 'Ambient', label: 'Ambient', image: 'https://images.pexels.com/photos/374710/pexels-photo-374710.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  ];

  const staticAudios = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  ];

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleInspireMe = () => {
    const inspirations = [
      'Uplifting orchestral music with strings and piano',
      'Energetic electronic beat with synth melodies',
      'Smooth jazz with saxophone and soft drums',
      'Calm ambient soundscape ',
      'Upbeat pop music with catchy rhythm',
    ];
    const randomInspiration = inspirations[Math.floor(Math.random() * inspirations.length)];
    const randomStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)].value;
    setInputData({ text: randomInspiration, style: randomStyle });
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
  };

  const handleGenerateAudio = async () => {
    if (!inputData.text.trim()) {
      alert('Please enter a text prompt.');
      return;
    }

    setLoading({ generate: true });
    setOutputs([]);

    try {
      const styleKeyword = inputData.style ? inputData.style.toLowerCase() : '';
      const query = `${inputData.text} ${styleKeyword} music`.trim();

      const response = await fetch(`https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=YOUR_FREESOUND_API_TOKEN&fields=id,name,previews,duration&page_size=6`);

      if (!response.ok) throw new Error('API failed');

      const data = await response.json();
      const audioResults = data.results.map((sound, index) => ({
        id: sound.id || index,
        type: 'audio',
        src: sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'],
        alt: sound.name || `Generated Audio ${index + 1}`,
        duration: sound.duration || 0,
      }));

      setOutputs(audioResults);
    } catch (error) {
      console.log('Using fallback audio generation');
      const fallbackAudios = [
        { id: 1, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', alt: `${inputData.text} - Variation 1`, duration: 240 },
        { id: 2, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', alt: `${inputData.text} - Variation 2`, duration: 240 },
        { id: 3, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', alt: `${inputData.text} - Variation 3`, duration: 240 },
        { id: 4, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', alt: `${inputData.text} - Variation 4`, duration: 240 },
        { id: 5, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', alt: `${inputData.text} - Variation 5`, duration: 240 },
        { id: 6, type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', alt: `${inputData.text} - Variation 6`, duration: 240 },
      ];
      setOutputs(fallbackAudios);
    } finally {
      setLoading({ generate: false });
    }
  };

  const togglePlayPause = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (playingAudio === audioId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio !== null && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      audio.play();
      setPlayingAudio(audioId);
    }
  };

  const handleDownload = async (audioSrc, audioName) => {
    try {
      const response = await fetch(audioSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${audioName || 'audio'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Download failed. Please try again.');
    }
  };

  const handleTimeUpdate = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress(prev => ({ ...prev, [audioId]: progress }));
    }
  };

  const handleSeek = (audioId, e) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audio.currentTime = percentage * audio.duration;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setStyleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CustomAudioPlayer = ({ audio, index }) => {
    const audioId = audio.id || index;
    const isPlaying = playingAudio === audioId;
    const progress = audioProgress[audioId] || 0;
    const title = truncateTitle(audio.alt);
    const accentColor = getStyleColor(inputData.style);

    return (
      <div className={`relative bg-white hover:scale-95 border ${isPlaying ? accentColor : 'border-gray-200'} rounded-lg transition-all duration-300 overflow-hidden cursor-pointer hover:border-opacity-100 p-4 shadow`}>
        <audio
          ref={(el) => (audioRefs.current[audioId] = el)}
          src={audio.src}
          onTimeUpdate={() => handleTimeUpdate(audioId)}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />

        <div className="flex justify-between items-center gap-3 mb-3">
          <button
            onClick={() => togglePlayPause(audioId)}
            className={`w-12 h-12 cursor-pointer rounded-full flex items-center justify-center transition-all shadow-md ${isPlaying
                ? 'bg-gradient-to-br from-blue-700 to-purple-600 text-white scale-105'
                : 'bg-black/30 hover:bg-blue-600 text-white'
              }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatTime(audioRefs.current[audioId]?.currentTime || 0)} / {formatTime(audioRefs.current[audioId]?.duration || audio.duration)}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleDownload(audio.src, title)}
            className="w-10 h-10 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div
          onClick={(e) => handleSeek(audioId, e)}
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
        >
          <div
            className={`h-full transition-all duration-100 ${isPlaying ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-blue-600'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2">
          <p className="text-xs text-gray-500 font-medium">
            Style: <span className={inputData.style ? `text-${accentColor.split('-')[1]}-600` : ''}>
              {inputData.style || 'Default'}
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100%] border border-gray-200 overflow-y-auto rounded-lg">
      {outputs.length === 0 ? (
        <div className="flex flex-col gap-19 p-3">
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
                />
                <button
                  onClick={handleInspireMe}
                  className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                >
                  Inspire Me
                </button>
              </div>
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
                          className={`flex flex-col cursor-pointer items-center p-2 border rounded-md transition duration-200 ${inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                            }`}
                        >
                          <img
                            src={option.image}
                            alt={option.label}
                            className="w-full h-28 object-cover rounded-md mb-2"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleGenerateAudio}
                className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading.generate || !inputData.text}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {staticAudios.map((audio, index) => (
                <CustomAudioPlayer
                  key={index}
                  audio={{ id: `static-${index}`, src: audio, alt: `Sample Audio ${index + 1}`, duration: 240 }}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 relative">
          <div className='flex sticky top-0 pt-3  z-50 bg-white flex-row border-b border-b-gray-200  justify-between'>
            <h2 className="font-medium px-2 flex justify-center items-center text-lg text-blue-700 mb-4">
              Generated Audio
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
            {outputs.map((output, index) => (
              <CustomAudioPlayer key={output.id || index} audio={output} index={index} />
            ))}
          </div>
        </div>
      )}
      {loading.generate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
            <FloatingAnimation showProgressBar={true} >
              <FloatingElements.VideoFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToAudioTab;