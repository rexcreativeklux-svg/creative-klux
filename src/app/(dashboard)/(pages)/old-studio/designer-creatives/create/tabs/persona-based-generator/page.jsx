"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import { MoreVertical, Download, PlusCircle, ArrowBigLeft, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PersonaBasedGeneratorTab = ({ selectedMedia, handleSelectMedia }) => {
  const { uploadImage } = useAuth();
  const [inputData, setInputData] = useState({ persona: '', style: '' });
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const styleDropdownRef = useRef(null);

  const styleOptions = [
    { value: 'Realistic', label: 'Realistic', image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Cartoon', label: 'Cartoon', image: 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Anime', label: 'Anime', image: 'https://images.pexels.com/photos/669319/pexels-photo-669319.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Abstract', label: 'Abstract', image: 'https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Watercolor', label: 'Watercolor', image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Surreal', label: 'Surreal', image: 'https://images.pexels.com/photos/3640877/pexels-photo-3640877.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Minimalist', label: 'Minimalist', image: 'https://images.pexels.com/photos/2258539/pexels-photo-2258539.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Retro', label: 'Retro', image: 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const personaPrompts = [
    'A confident young entrepreneur in a modern office',
    'A creative digital nomad working from a tropical beach',
    'A stylish fashion influencer posing in Paris',
    'A wise elderly professor in a library',
    'A futuristic cyberpunk character with neon lights',
    'A cheerful barista serving coffee with a smile',
    'A professional chef cooking in a high-end kitchen',
    'A calm yoga instructor meditating at sunrise',
    'A bold streetwear model in Tokyo at night',
    'A passionate musician performing on stage',
  ];

  const selectedStyle = styleOptions.find(o => o.value === inputData.style);

  const handleInspireMe = () => {
    const random = personaPrompts[Math.floor(Math.random() * personaPrompts.length)];
    setInputData(prev => ({ ...prev, persona: random }));
  };

  const handleStyleChange = (value) => {
    setInputData(prev => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
  };

  const toggleStyleDropdown = () => setStyleDropdownOpen(prev => !prev);

  const searchPexelsPersonas = async (query) => {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=50`);
      const data = await res.json();
      if (data.error || !data.photos) return [];

      return data.photos.map((photo, i) => ({
        id: `persona-${photo.id}-${i}`,
        type: 'image',
        src: photo.src.large2x || photo.src.large,
        thumbnail: photo.src.medium,
        alt: photo.alt || `Persona: ${query}`,
        photographer: photo.photographer,
        // skipCrop: false → cropper WILL open (desired for images!)
      }));
    } catch (err) {
      console.error("Pexels persona search failed:", err);
      return [];
    }
  };

  const handleGenerateImage = async () => {
    if (!inputData.persona.trim()) {
      alert('Please enter a persona description.');
      return;
    }

    setLoading({ generate: true });
    setOutputs([]);

    let finalPrompt = inputData.persona;
    if (inputData.style) {
      const styleMap = {
        'Realistic': 'photorealistic portrait, highly detailed face',
        'Cartoon': 'cartoon character, animated style',
        'Anime': 'anime character, japanese animation style',
        'Abstract': 'abstract surreal portrait',
        'Watercolor': 'soft watercolor painting, artistic portrait',
        'Surreal': 'dreamlike surreal person, dali style',
        'Minimalist': 'minimalist clean portrait, simple background',
        'Retro': 'vintage retro portrait, 80s aesthetic'
      };
      finalPrompt += `, ${styleMap[inputData.style] || inputData.style.toLowerCase()}, professional portrait, sharp focus`;
    } else {
      finalPrompt += ', photorealistic portrait, professional, sharp';
    }

    const results = await searchPexelsPersonas(finalPrompt);

    setTimeout(() => {
      setOutputs(results.length > 0 ? results : [
        { id: 'fallback-1', type: 'image', src: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg', thumbnail: '...', alt: 'Confident professional' },
        { id: 'fallback-2', type: 'image', src: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg', thumbnail: '...', alt: 'Creative artist' },
      ]);
      setLoading({ generate: false });
    }, 3800);
  };

  const handleDownload = async (url) => {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `persona-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Download failed");
    }
  };

  const handleAddToBrand = async (url) => {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], `persona-brand-${Date.now()}.jpg`, { type: blob.type });
      await uploadImage(file);
      alert("Added to your brand library!");
    } catch {
      alert("Failed to add to brand");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target)) {
        setStyleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-[100%] border border-gray-200 overflow-y-auto rounded-lg">
      {outputs.length === 0 ? (
        <div className="flex flex-col gap-8 p-3">
          <div>
            <div className="flex flex-col pb-5 justify-center">
              <h1 className="font-medium text-lg text-blue-700">Persona Generator</h1>
              <p className="text-gray-600 text-xs">Describe a person and generate realistic portraits.</p>
            </div>

            <div className="space-y-8">
              <div className="relative">
                <textarea
                  placeholder="e.g., 'A confident young entrepreneur in a modern office'"
                  value={inputData.persona}
                  onChange={(e) => setInputData(prev => ({ ...prev, persona: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm resize-none"
                />
                <button
                  onClick={handleInspireMe}
                  className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-surface cursor-pointer transition text-sm"
                >
                  Inspire Me
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Style (Optional)</label>
                <div className="relative " ref={styleDropdownRef}>
                  <button
                    onClick={toggleStyleDropdown}
                    className="w-full p-3 border cursor-pointer bg-surface border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 flex items-center gap-2"
                  >
                    {selectedStyle && (
                      <img src={selectedStyle.image} alt={selectedStyle.label} className="w-6 h-6 object-cover rounded" />
                    )}
                    <span>{inputData.style || 'Default (Realistic)'}</span>
                  </button>

                  {styleDropdownOpen && (
                    <div className="absolute  z-10 mt-2 w-full bg-surface border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-4 p-4 max-h-96 overflow-y-auto">
                      {styleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStyleChange(option.value)}
                          className={`flex flex-col cursor-pointer items-center p-3 rounded-lg border transition ${inputData.style === option.value
                            ? 'border-blue-700 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-500'
                            }`}
                        >
                          <img
                            src={option.image}
                            alt={option.label}
                            className="w-full h-24 object-cover rounded-md mb-2"
                          />
                          <span className="text-xs font-medium text-gray-700">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={handleGenerateImage}
                  disabled={loading.generate || !inputData.persona.trim()}
                  className="px-2 cursor-pointer bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-3"
                >
                  {loading.generate ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Generate '
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 relative">
          <div className='flex sticky top-0 pt-3  z-50 bg-surface flex-row border-b border-b-gray-200  justify-between'>
            <h2 className="font-medium px-2 flex justify-center items-center text-lg text-blue-700 mb-4">
              Generated Personas
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


          {/* MASONRY GRID */}
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 py-2 space-y-4">
            {outputs.map((img) => {
              const isSelected = selectedMedia.some(m => m.id === img.id);
              const menuId = `persona-menu-${img.id}`;

              return (
                <div
                  key={img.id}
                  className="relative group break-inside-avoid mb-4 cursor-pointer"
                  onClick={() => handleSelectMedia(img)}
                >
                  <div className="relative overflow-hidden rounded-lg shadow-sm border border-gray-300">
                    <img
                      src={img.thumbnail || img.src}
                      alt={img.alt}
                      className="w-full h-auto block rounded-lg"
                      loading="lazy"
                    />

                    {/* Selected border */}
                    {isSelected && (
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-lg pointer-events-none" />
                    )}

                    {/* 3-dot menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === menuId ? null : menuId);
                      }}
                      className="absolute cursor-pointer top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition z-10"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpen === menuId && (
                      <div className="absolute top-10 right-2 bg-surface rounded-lg shadow-2xl border border-gray-200 py-2 z-20 min-w-[180px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(img.src);
                            setMenuOpen(null);
                          }}
                          className="w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                        >
                          <Download size={16} /> Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToBrand(img.src);
                            setMenuOpen(null);
                          }}
                          className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 text-blue-700 text-sm font-medium"
                        >
                          <PlusCircle size={16} /> Add to Brand
                        </button>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition flex items-center justify-center pointer-events-none">
                      <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                        {isSelected ? "Selected" : "Click to crop & use"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


        </div>
      )}



      {loading.generate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative w-80 h-60 bg-gray-50 rounded-xl overflow-hidden flex flex-col items-center justify-center">
            <FloatingAnimation animationDuration="3.5s" showProgressBar={true}>
              <FloatingElements.ImageFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaBasedGeneratorTab;