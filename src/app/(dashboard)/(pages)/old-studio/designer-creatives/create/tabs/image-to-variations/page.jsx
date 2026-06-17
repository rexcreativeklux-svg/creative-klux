"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Image, MoreVertical, Download, PlusCircle, ArrowLeft, FileSearch, FileUp, FolderOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';

const ImageToVariationsTab = ({
  recommendedImages = [],
  isLoadingRecommended = false,
  handleSelectMedia,
  onClose,
  postData,
}) => {
  const { uploadImage } = useAuth();
  const [inputData, setInputData] = useState({ file: null, style: '', exportFormat: 'PNG' });
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [loading, setLoading] = useState({ generate: false, export: {} });
  const [menuOpen, setMenuOpen] = useState(null);
  
  // Crop states
  const [crop, setCrop] = useState({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const cropperRef = useRef(null);
  
  // Modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const libraryFileInputRef = useRef(null);
  const styleDropdownRef = useRef(null);
  const menuRefs = useRef({});

  const [searchResults, setSearchResults] = useState([
    { id: 1, src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg", alt: "Two yellow Labrador retriever puppies" },
    { id: 2, src: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg", alt: "Brown and white short-coated puppy" },
    { id: 3, src: "https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg", alt: "Cute puppy wearing a party hat" },
    { id: 4, src: "https://images.pexels.com/photos/2007/pexels-photo-2007.jpeg", alt: "Animal dog pet cute" },
    { id: 5, src: "https://images.pexels.com/photos/97082/pexels-photo-97082.jpeg", alt: "Dog snout puppy royalty-free" },
  ]);

  const styleOptions = [
    { value: 'Vintage Sepia', label: 'Vintage Sepia', image: 'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Futuristic Cyberpunk', label: 'Futuristic Cyberpunk', image: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Watercolor Painting', label: 'Watercolor Painting', image: 'https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Pixel Art', label: 'Pixel Art', image: 'https://images.pexels.com/photos/1293261/pexels-photo-1293261.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Oil Painting', label: 'Oil Painting', image: 'https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Sketch Drawing', label: 'Sketch Drawing', image: 'https://images.pexels.com/photos/4740260/pexels-photo-4740260.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: '3D Render', label: '3D Render', image: 'https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Cartoon Style', label: 'Cartoon Style', image: 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Black & White', label: 'Black & White', image: 'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=200' },
    { value: 'Abstract Art', label: 'Abstract Art', image: 'https://images.pexels.com/photos/1812960/pexels-photo-1812960.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  const selectedStyle = styleOptions.find(option => option.value === inputData.style);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) return alert('Invalid image format');
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc([reader.result]);
      setCroppedImages([file]);
      setCurrentCropIndex(0);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleLibraryUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newId = Date.now();
      setSearchResults(prev => [{
        id: newId,
        src: reader.result,
        alt: file.name || 'Uploaded image'
      }, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  const handleStyleChange = (value) => {
    setInputData(prev => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
  };

  const toggleStyleDropdown = () => setStyleDropdownOpen(prev => !prev);

  const handleGenerateVariations = async () => {
    if (croppedImages.length === 0) return alert('Please crop at least one image first.');

    setLoading({ generate: true });
    setOutputs([]);
    setSelectedVariations([]);

    // Use the first cropped image as base prompt
    const baseImage = croppedImages[0];
    const prompt = `variation of creative image, different angle, style, lighting, composition, high quality professional ${inputData.style || ''}`.trim();

    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(prompt)}&per_page=20`);
      if (!res.ok) throw new Error('Failed to fetch variations');

      const data = await res.json();
      
      // Map Pexels photos to match the output format
      const variations = (data.photos || []).map((photo, i) => ({
        id: `pexels-var-${photo.id}-${Date.now()}-${i}`,
        type: 'image',
        src: photo.src.medium,
        large: photo.src.large2x,
        alt: photo.alt || `Variation ${i + 1}`,
      }));

      setOutputs(variations);
      
      if (variations.length === 0) {
        alert('No variations found. Try selecting a different image.');
      }
    } catch (err) {
      console.error("Pexels variation failed:", err);
      alert('Failed to generate variations. Please try again.');
      setOutputs([]);
    } finally {
      setLoading({ generate: false });
    }
  };

  const handleApply = () => {
    selectedVariations.forEach(v => {
      handleSelectMedia?.(v.src);
    });
  };

  const handleDownload = async (url) => {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `variation-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('Download failed');
    }
  };

  const handleAddToBrand = async (url) => {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], `variation-brand-${Date.now()}.jpg`, { type: blob.type });
      await uploadImage(file);
      alert('Added to your brand library!');
    } catch {
      alert('Failed to add to brand');
    }
  };

  const handleBack = () => {
    setOutputs([]);
    setSelectedVariations([]);
    setImageSrc([]);
    setCroppedImages([]);
    setInputData({ file: null, style: '', exportFormat: 'PNG' });
  };

  const handleSelectImage = (src) => {
    setSelectedImages(prev =>
      prev.includes(src)
        ? prev.filter(s => s !== src)
        : prev.length < 5 ? [...prev, src] : prev
    );
  };

  const handleApplySelected = () => {
    if (selectedImages.length === 0) return;
    setImageSrc(selectedImages);
    setCroppedImages(new Array(selectedImages.length).fill(null));
    setCurrentCropIndex(0);
    setShowCropper(true);
    setLibraryModalOpen(false);
    setSearchModalOpen(false);
    setSelectedImages([]);
  };

  // Save cropped image using cropperRef
  const saveCroppedImage = async () => {
    if (!completedCrop || !cropperRef.current?.cropper?.getImage()) return;

    const image = cropperRef.current.cropper.getImage();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      completedCrop.width,
      completedCrop.height
    );

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `cropped-${currentCropIndex}.png`, { type: 'image/png' });
    const url = URL.createObjectURL(file);

    setCroppedImages(prev => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    setImageSrc(prev => {
      const updated = [...prev];
      updated[currentCropIndex] = url;
      return updated;
    });

    if (currentCropIndex >= imageSrc.length - 1) {
      setShowCropper(false);
    } else {
      setCurrentCropIndex(prev => prev + 1);
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    }
  };

  const handleSkipCrop = () => {
    if (currentCropIndex >= imageSrc.length - 1) {
      setShowCropper(false);
    } else {
      setCurrentCropIndex(prev => prev + 1);
    }
  };

  const toggleMenu = (id) => setMenuOpen(prev => prev === id ? null : id);

  const toggleVariationSelect = (variation) => {
    // Directly apply the variation when clicked
    handleSelectMedia?.(variation.src);
    
    // Also update selectedVariations for visual feedback
    setSelectedVariations(prev =>
      prev.some(v => v.id === variation.id)
        ? prev.filter(v => v.id !== variation.id)
        : [...prev, variation]
    );
  };

  useEffect(() => {
    const handler = (e) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target)) setStyleDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="">
      <div className="flex flex-col  overflow-hidden w-full mt-5 gap-6 bg-surface rounded-xl py-4">
        <div className="overflow-auto space-y-6">

          {/* INPUT SECTION */}
          {!outputs.length ? (
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                <div className="flex justify-center gap-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Image className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Upload Image</h1>
                    <p className="text-gray-600 text-xs">Upload an image to generate variations.</p>
                  </div>
                </div>
              </div>

              {/* Recommended Images Section */}
              {/* {isLoadingRecommended ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-5 pb-3 gap-4">
                  {recommendedImages.slice(0, 5).map((img) => (
                    <img 
                      key={img.id} 
                      src={img.src} 
                      alt={img.alt} 
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition" 
                    />
                  ))}
                </div>
              )} */}

                <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center">
                    <div><FileUp className="w-10 h-10 text-gray-400" /></div>
                    <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                    <p className="text-gray-500 text-xs">Choose an image from your brand or your library.</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setSearchModalOpen(true)} 
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3"
                      >
                        <div className="text-sm font-medium">Search Images</div>
                        <div className="mt-0.5"><FileSearch className="w-4 h-4" /></div>
                      </button>
                      <button 
                        onClick={() => setLibraryModalOpen(true)} 
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3"
                      >
                        <div className="text-sm font-medium">Your Library</div>
                        <div className="mt-0.5"><FolderOpen className="w-4 h-4" /></div>
                      </button>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    </div>
                  </div>

              <div className="space-y-6">
                {croppedImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-4">
                    {croppedImages.map((img, i) => (
                      <div key={i} className="flex flex-col relative items-center">
                        <img 
                          src={imageSrc[i] || URL.createObjectURL(img)} 
                          alt="thumb" 
                          className="w-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition" 
                        />
                        <button
                          onClick={() => {
                            setCroppedImages(prev => prev.filter((_, idx) => idx !== i));
                            setImageSrc(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute top-1 right-1 bg-red-500 cursor-pointer text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col w-full">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Style</label>
                  <div className="relative " ref={styleDropdownRef}>
                    <button
                      onClick={toggleStyleDropdown}
                      className="w-full p-3 border bg-surface border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2 cursor-pointer"
                    >
                      {selectedStyle && <img src={selectedStyle.image} alt="" className="w-6 h-6 object-cover rounded" />}
                      {inputData.style || 'Select a style'}
                    </button>
                    {styleDropdownOpen && (
                      <div className="absolute bottom-15 z-10 mt-2 w-full bg-surface border border-gray-200 rounded-md shadow-lg grid grid-cols-6 gap-5 p-3">
                        {styleOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleStyleChange(option.value)}
                            className={`flex flex-col items-center p-2 border rounded-md transition cursor-pointer ${
                              inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-700'
                            }`}
                          >
                            <img src={option.image} alt="" className="w-full h-24 object-cover rounded-md mb-2" />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleGenerateVariations}
                  disabled={loading.generate || croppedImages.length === 0}
                  className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading.generate ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Generate Variations'
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* OUTPUT SECTION — STICKY HEADER + MASONRY */
            <div className="border border-gray-200 p-3 rounded-lg">
              {/* Sticky Header */}
              <div className="sticky top-0 z-50 bg-surface border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
                <div>
                  <h1 className="font-medium text-lg text-blue-700">Generated Variations</h1>
                  <p className="text-xs text-gray-600">
                    Click on any variation to apply it
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <ArrowLeft className="w-6 h-6 text-blue-700" />
                  </button>
                </div>
              </div>

              {/* MASONRY GRID */}
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                {outputs.map((variation) => {
                  const isSelected = selectedVariations.some(v => v.id === variation.id);
                  const menuId = `menu-${variation.id}`;

                  return (
                    <div
                      key={variation.id}
                      className="relative group break-inside-avoid mb-4 cursor-pointer"
                      onClick={() => toggleVariationSelect(variation)}
                    >
                      <div className={`relative bg-surface border rounded-lg overflow-hidden transition-all duration-300 ${
                        isSelected ? 'border-blue-700 ring-4 ring-blue-100' : 'border-gray-200 hover:border-blue-700'
                      }`}>
                        <img
                          src={variation.src}
                          alt={variation.alt}
                          className="w-full h-auto block rounded-lg"
                          loading="lazy"
                        />

                        {isSelected && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-2 shadow-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        {/* 3-dot menu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === menuId ? null : menuId);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpen === menuId && (
                          <div className="absolute top-10 right-2 bg-surface rounded-lg shadow-2xl border border-gray-200 py-2 z-20 min-w-[180px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(variation.src);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm cursor-pointer"
                            >
                              <Download size={16} /> Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToBrand(variation.src);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 text-blue-700 text-sm font-medium cursor-pointer"
                            >
                              <PlusCircle size={16} /> Add to Brand
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Media Modal */}
          <SearchMediaModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            searchResults={searchResults}
            selectedImages={selectedImages}
            onSelectImage={handleSelectImage}
            onApply={handleApplySelected}
            onCancel={() => { setSearchModalOpen(false); setSelectedImages([]); }}
          />

          {/* Library Media Modal */}
          <LibraryMediaModal
            isOpen={libraryModalOpen}
            onClose={() => setLibraryModalOpen(false)}
            searchResults={searchResults}
            selectedImages={selectedImages}
            onSelectImage={handleSelectImage}
            onApply={handleApplySelected}
            onCancel={() => { setLibraryModalOpen(false); setSelectedImages([]); }}
            onUploadClick={() => libraryFileInputRef.current?.click()}
          />

          <input type="file" accept="image/*" ref={libraryFileInputRef} onChange={handleLibraryUpload} className="hidden" />

          {/* REUSABLE CROP MODAL */}
          {showCropper && (
            <ImageCropperModal
              ref={cropperRef}
              isOpen={showCropper}
              imageSrc={imageSrc[currentCropIndex]}
              currentIndex={currentCropIndex}
              totalImages={imageSrc.length}
              crop={crop}
              completedCrop={completedCrop}
              onCropChange={setCrop}
              onCropComplete={setCompletedCrop}
              aspectRatio={1}
              onSave={saveCroppedImage}
              onSkip={handleSkipCrop}
              onCancel={() => {
                setShowCropper(false);
                setCurrentCropIndex(0);
              }}
              onPrevious={() => {
                setCurrentCropIndex(prev => Math.max(0, prev - 1));
                setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
                setCompletedCrop(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToVariationsTab;