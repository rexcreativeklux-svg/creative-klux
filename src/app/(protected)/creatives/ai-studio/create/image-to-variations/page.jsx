"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Image, MoreVertical, Download, FileSearch, FileUp, FolderOpen } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(protected)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const ImageToVariationsPipelinePage = () => {
  const router = useRouter();
  const [inputData, setInputData] = useState({ file: null, style: '', exportFormat: 'PNG' });
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [cropTarget, setCropTarget] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const libraryFileInputRef = useRef(null);
  const styleDropdownRef = useRef(null);
  const menuRefs = useRef({});
  const [loading, setLoading] = useState({ generate: false, export: {} });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [searchResults, setSearchResults] = useState([
    { id: 1, src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg", alt: "Two yellow Labrador retriever puppies" },
    { id: 2, src: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg", alt: "Brown and white short-coated puppy" },
    { id: 3, src: "https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg", alt: "Cute puppy wearing a party hat" },
    { id: 4, src: "https://images.pexels.com/photos/2007/pexels-photo-2007.jpeg", alt: "Animal dog pet cute" },
    { id: 5, src: "https://images.pexels.com/photos/97082/pexels-photo-97082.jpeg", alt: "Dog snout puppy royalty-free" },
    { id: 6, src: "https://images.pexels.com/photos/3662374/pexels-photo-3662374.jpeg", alt: "Photo of a Siberian Husky beside his master" },
    { id: 7, src: "https://images.pexels.com/photos/3671300/pexels-photo-3671300.jpeg", alt: "Person holding black and white Siberian Husky" },
    { id: 8, src: "https://images.pexels.com/photos/3663082/pexels-photo-3663082.jpeg", alt: "White and black Siberian Husky puppy" },
    { id: 9, src: "https://images.pexels.com/photos/2691779/pexels-photo-2691779.jpeg", alt: "Smiling woman carrying brown Dachshund" },
    { id: 10, src: "https://images.pexels.com/photos/1389994/pexels-photo-1389994.jpeg", alt: "Adult black and white Dalmatian licking face of woman" },
  ]);
  const [selectedImages, setSelectedImages] = useState([]);

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

  const selectedStyle = styleOptions.find((option) => option.value === inputData.style);

  const staticImages = [
    'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/1812960/pexels-photo-1812960.jpeg?auto=compress&cs=tinysrgb&w=200',
  ];

  const handleInspireMe = () => {
    const randomStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)].value;
    setInputData((prev) => ({ ...prev, style: randomStyle }));
    console.log('Inspire Me style:', randomStyle);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      alert('Please upload a valid image file (e.g., .jpg, .png)');
      return;
    }
    setLoading({ ...loading, generate: true });
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc([reader.result]);
      setCroppedImages([file]);
      setCropTarget('input');
      setCurrentCropIndex(0);
      setShowCropper(true);
      setLoading({ ...loading, generate: false });
      console.log('File uploaded, crop modal opened', { cropTarget: 'input', imageSrc: [reader.result] });
    };
    reader.readAsDataURL(file);
  };

  const handleLibraryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      alert('Please upload a valid image file (e.g., .jpg, .png)');
      return;
    }
    setLoading({ ...loading, generate: true });
    const reader = new FileReader();
    reader.onload = () => {
      const newId = searchResults.length + 1;
      setSearchResults([{ id: newId, src: reader.result, alt: `User-uploaded image ${newId}` }, ...searchResults]);
      setLoading({ ...loading, generate: false });
    };
    reader.readAsDataURL(file);
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
    console.log('Style changed:', value);
  };

  const toggleStyleDropdown = () => {
    setStyleDropdownOpen((prev) => !prev);
  };

  const handleGenerateVariations = () => {
    if (imageSrc.length === 0) {
      alert('Please upload an image first.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs([
        { id: 0, type: 'image', src: 'https://via.placeholder.com/512?text=Variant+1', alt: 'Variant 1' },
        { id: 1, type: 'image', src: 'https://via.placeholder.com/512?text=Variant+2', alt: 'Variant 2' },
        { id: 2, type: 'image', src: 'https://via.placeholder.com/512?text=Variant+3', alt: 'Variant 3' },
        { id: 3, type: 'image', src: 'https://via.placeholder.com/512?text=Variant+4', alt: 'Variant 4' },
      ]);
      setLoading({ ...loading, generate: false });
      console.log('Image variations generated');
    }, 3000);
  };

  const handleVariationSelect = (variation) => {
    setSelectedVariation(variation);
    setCropTarget('variation');
    setImageSrc([variation.src]);
    setShowCropper(true);
    console.log('Variation selected:', variation.alt);
  };

  const handleCropImage = (target) => {
    setCropTarget(target);
    if (target === 'input') {
      setCurrentCropIndex(0);
      setShowCropper(true);
    } else if (target === 'variation' && selectedVariation) {
      setImageSrc([selectedVariation.src]);
      setShowCropper(true);
    }
    console.log(`Initiating crop for ${target}`);
  };

  const onImageLoaded = (img) => {
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      imgRef.current = img;
      console.log('Image loaded successfully:', img.src);
    } else {
      console.error('Invalid image loaded:', img.src);
    }
  };

  const saveCroppedImage = async () => {
    if (!completedCrop || !imgRef.current || !completedCrop.width || !completedCrop.height) {
      console.error('Cannot save cropped image: invalid crop or image reference', {
        completedCrop,
        imgRef: !!imgRef.current,
      });
      alert('Failed to save cropped image. Please try again.');
      return;
    }

    setCropLoading(true);
    console.log('Saving cropped image', { cropTarget, currentCropIndex, imageSrcLength: imageSrc.length });

    try {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      const file = new File([blob], `cropped-image-${Date.now()}.png`, { type: 'image/png' });
      const fileUrl = URL.createObjectURL(file);

      // Handle input images (including fallback for null cropTarget)
      if (cropTarget === 'input' || cropTarget === null) {
        console.log('Updating input image', { index: currentCropIndex, fileUrl });
        setCroppedImages((prev) => {
          const newImages = [...prev];
          newImages[currentCropIndex] = file;
          console.log('Updated croppedImages', newImages);
          return newImages;
        });
        setImageSrc((prev) => {
          const newSrc = [...prev];
          newSrc[currentCropIndex] = fileUrl;
          console.log('Updated imageSrc', newSrc);
          return newSrc;
        });

        if (currentCropIndex >= imageSrc.length - 1) {
          console.log('Closing crop modal for input');
          setShowCropper(false);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
          setCropTarget(null);
        } else {
          console.log('Moving to next image', { nextIndex: currentCropIndex + 1 });
          setCurrentCropIndex(currentCropIndex + 1);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        }
      } else if (cropTarget === 'variation' && selectedVariation) {
        console.log('Updating variation', { variationId: selectedVariation.id, fileUrl });
        setOutputs((prev) => {
          const newOutputs = prev.map((v) =>
            v.id === selectedVariation.id ? { ...v, src: fileUrl } : v
          );
          console.log('Updated outputs', newOutputs);
          return newOutputs;
        });
        setSelectedVariation((prev) => {
          const newVariation = { ...prev, src: fileUrl };
          console.log('Updated selectedVariation', newVariation);
          return newVariation;
        });
        console.log('Closing crop modal for variation');
        setShowCropper(false);
        setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
        setCompletedCrop(null);
        setCropTarget(null);
      }

      console.log('Cropped image saved:', fileUrl);
    } catch (error) {
      console.error('Error saving cropped image:', error);
      alert('An error occurred while saving the cropped image. Please try again.');
    } finally {
      setCropLoading(false);
    }
  };

  const handleDownload = (variation) => {
    if (!variation) {
      alert('No variation selected for download.');
      return;
    }
    setLoading((prev) => ({ ...prev, export: { ...prev.export, [variation.id]: true } }));
    setMenuOpen(null);
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = variation.src;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 512, 512);
        const format = inputData.exportFormat || 'PNG';
        const url = canvas.toDataURL(`image/${format.toLowerCase()}`);
        const link = document.createElement('a');
        link.href = url;
        link.download = `variation-${variation.id + 1}.${format.toLowerCase()}`;
        link.click();
        setLoading((prev) => ({ ...prev, export: { ...prev.export, [variation.id]: false } }));
        console.log('Download triggered:', url);
      };
      img.onerror = () => {
        console.error(`Failed to load image for download: ${variation.src}`);
        setLoading((prev) => ({ ...prev, export: { ...prev.export, [variation.id]: false } }));
      };
    }, 1000);
  };

  const handleBack = () => {
    setOutputs([]);
    setImageSrc([]);
    setCroppedImages([]);
    setInputData((prev) => ({ ...prev, file: null, style: '', exportFormat: 'PNG' }));
    setSelectedVariation(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (libraryFileInputRef.current) libraryFileInputRef.current.value = '';
    setMenuOpen(null);
    setStyleDropdownOpen(false);
    console.log('Back to input prompt');
  };

  const handleSearchImages = () => {
    setSearchModalOpen(true);
  };

  const handleSelectImage = (src) => {
    if (selectedImages.includes(src)) {
      setSelectedImages(selectedImages.filter((s) => s !== src));
    } else if (selectedImages.length < 5) {
      setSelectedImages([...selectedImages, src]);
    }
  };

  const handleApplySelected = () => {
    if (selectedImages.length === 0) return;
    setImageSrc(selectedImages);
    setCroppedImages(new Array(selectedImages.length).fill(null));
    setCropTarget('input');
    setCurrentCropIndex(0);
    setShowCropper(true);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setSelectedImages([]);
    console.log('Applied selected images', { imageSrc: selectedImages, cropTarget: 'input' });
  };

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
  };

  const handleAddImageUrl = () => {
    const url = document.getElementById('imageUrlInput')?.value.trim();
    if (!url) return;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(url)) {
      alert('Please enter a valid image URL (e.g., .jpg, .png, .webp)');
      return;
    }
    if (searchResults.some(result => result.src === url) || selectedImages.includes(url)) {
      alert('This image URL is already added.');
      return;
    }
    try {
      const img = new Image();
      img.onload = () => {
        const newId = searchResults.length + 1;
        setSearchResults([{ id: newId, src: url, alt: `User-added image ${newId}` }, ...searchResults]);
        document.getElementById('imageUrlInput').value = '';
      };
      img.onerror = () => alert('Invalid image URL or image could not be loaded.');
      img.src = url;
    } catch (error) {
      alert('An error occurred while adding the image URL.');
    }
  };

  const handleUploadImages = () => {
    setLibraryModalOpen(true);
  };

  const toggleMenu = (variationId) => {
    setMenuOpen((prev) => (prev === variationId ? null : variationId));
    setStyleDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setStyleDropdownOpen(false);
      }
      Object.keys(menuRefs.current).forEach((variationId) => {
        if (menuRefs.current[variationId] && !menuRefs.current[variationId].contains(event.target)) {
          setMenuOpen((prev) => (prev === variationId ? null : prev));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Image to Variations Pipeline</div>

      <Breadcrumbs
        items={[
          { name: 'Creatives', href: '/creatives' },
          { name: 'AI Studio', href: null },
          { name: 'Image to Variations', href: '/creatives/ai-studio/image-to-variations' },
        ]}
      />

      <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-white rounded-xl py-4">
        <div className="overflow-auto space-y-6">
          {!outputs.length ? (
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                <div className="flex justify-center gap-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Image className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Upload Image</h1>
                    <p className="text-gray-600 text-xs">Upload an image.</p>
                  </div>
                </div>
              </div>

                {/* first five images */}
                <div className="grid grid-cols-5 pb-3 gap-4">
                  {searchResults.slice(0, 5).map((img) => (
                    <img
                      key={img.id}
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>

              <div className="space-y-6">
                {!croppedImages.length ? (
                  <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center">
                    <div><FileUp /></div>
                    <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                    <p className="text-gray-500 text-xs">Choose an image from your brand or your library.</p>
                    <div className="flex gap-4">
                      <button
                        onClick={handleSearchImages}
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3"
                      >
                        <div className="text-sm font-medium">Search Images</div>
                        <div className="mt-0.5"><FileSearch className="w-4 h-4" /></div>
                      </button>
                      <button
                        onClick={handleUploadImages}
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3"
                      >
                        <div className="text-sm font-medium">Your Library</div>
                        <div className="mt-0.5"><FolderOpen className="w-4 h-4" /></div>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-4">
                    {croppedImages.map((img, index) => (
                      <div key={index} className="flex flex-col relative items-center">
                        {img instanceof File ? (
                          <img
                            src={imageSrc[index] || URL.createObjectURL(img)}
                            alt={`Cropped ${index}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={() => console.error(`Failed to load cropped image: ${imageSrc[index] || URL.createObjectURL(img)}`)}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                            No image
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const newCropped = [...croppedImages];
                            newCropped.splice(index, 1);
                            setCroppedImages(newCropped);
                            const newSrc = [...imageSrc];
                            newSrc.splice(index, 1);
                            setImageSrc(newSrc);
                            if (index <= currentCropIndex && currentCropIndex > 0) {
                              setCurrentCropIndex(currentCropIndex - 1);
                            }
                          }}
                          className="absolute top-1 right-1 bg-red-500 cursor-pointer text-white rounded-full p-1 hover:bg-red-600 transition duration-300"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col w-full">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Style</label>
                  <div className="relative" ref={styleDropdownRef}>
                    <button
                      onClick={toggleStyleDropdown}
                      className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
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
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-6 gap-5 p-3">
                        {styleOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStyleChange(option.value)}
                            className={`flex flex-col items-center p-2 border rounded-md transition duration-200 ${
                              inputData.style === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                            }`}
                          >
                            <img
                              src={option.image}
                              alt={option.label}
                              className="w-full h-24 object-cover rounded-md mb-2"
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
                    >
                      <option value="" disabled>Select a style</option>
                      {styleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateVariations}
                  className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading.generate || imageSrc.length === 0}
                >
                  {loading.generate ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Generate Variations'
                  )}
                </button>
                <div className="mt-12">
                  <h2 className="font-medium text-lg text-blue-700 mb-4">Created Images</h2>
                  <div className="grid grid-cols-5 gap-4">
                    {staticImages.map((image, index) => (
                      <div key={index} className="relative h-30 bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Sample Image ${index + 1}`}
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
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Image className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Generated Variations</h1>
                    <p className="text-gray-600 text-xs">Review and select your generated variations.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {outputs.map((variation) => (
                  <div key={variation.id} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="absolute top-2 right-2" ref={(el) => (menuRefs.current[variation.id] = el)}>
                      <button
                        onClick={() => toggleMenu(variation.id)}
                        className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {menuOpen === variation.id && (
                        <div className="absolute z-10 right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg flex flex-col gap-2 p-2">
                          <button
                            onClick={() => handleVariationSelect(variation)}
                            className="flex w-full text-left rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={loading.export[variation.id]}
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleDownload(variation)}
                            className="flex w-full text-left rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={loading.export[variation.id]}
                          >
                            {loading.export[variation.id] ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              'Download'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <img
                        src={variation.src}
                        alt={variation.alt}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex">
                <button
                  onClick={handleBack}
                  className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={Object.values(loading.export).some((v) => v)}
                >
                  Back
                </button>
              </div>
            </div>
          )}
          {showCropper && (
            <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
              <div className="relative w-[700px] h-[600px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1 / 1}
                >
                  <img
                    ref={imgRef}
                    alt="Crop"
                    src={cropTarget === 'variation' ? selectedVariation?.src : imageSrc[currentCropIndex]}
                    onLoad={(e) => onImageLoaded(e.currentTarget)}
                    onError={() => console.error(`Failed to load crop image: ${cropTarget === 'variation' ? selectedVariation?.src : imageSrc[currentCropIndex]}`)}
                  />
                </ReactCrop>
                <div className="absolute top-2 right-2 text-sm text-gray-600">
                  Image {currentCropIndex + 1} of {imageSrc.length}
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                {currentCropIndex > 0 && cropTarget === 'input' && (
                  <button
                    onClick={() => {
                      setCurrentCropIndex(currentCropIndex - 1);
                      setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
                      setCompletedCrop(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-black rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={cropLoading}
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowCropper(false);
                    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
                    setCompletedCrop(null);
                    setCropTarget(null);
                  }}
                  className="px-4 cursor-pointer py-2 bg-gray-500 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={cropLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCroppedImage}
                  className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={cropLoading || !completedCrop}
                >
                  {cropLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    (cropTarget === 'variation' || cropTarget === null || currentCropIndex >= imageSrc.length - 1) ? 'Finish' : 'Next'
                  )}
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
          {searchModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-white flex flex-col justify-between rounded-lg p-6 w-[80%] h-[85%]">
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Search Images</h2>
                    <button
                      onClick={() => setSearchModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center border-b border-b-gray-200 py-5">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for images (e.g., nature, city, food)..."
                      className="p-2 border border-gray-300 rounded-l w-1/3"
                    />
                    <button
                      onClick={() => {/* Add search logic here if using API */ }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r"
                    >
                      Search
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleSelectImage(result.src)}
                        className="cursor-pointer hover:opacity-80 relative"
                      >
                        <img
                          src={result.src}
                          alt={result.alt}
                          className="w-full h-40 object-cover border border-gray-200 rounded"
                        />
                        {selectedImages.includes(result.src) && (
                          <div className="absolute inset-0 border-2 border-blue-700 rounded"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex border-t pt-5 border-t-gray-200 flex-row justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      id="imageUrlInput"
                      type="text"
                      placeholder="Paste image URL here..."
                      className="p-2 border border-gray-300 rounded"
                    />
                    <button
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleApplySelected}
                      disabled={selectedImages.length === 0}
                      className="px-4 py-2 cursor-pointer bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleCancelSelection}
                      className="px-4 py-2 cursor-pointer bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {libraryModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-white flex flex-col justify-between rounded-lg p-6 w-[80%] h-[85%]">
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Your Library</h2>
                    <button
                      onClick={() => setLibraryModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center border-b border-b-gray-200 py-5">
                    <button
                      onClick={() => libraryFileInputRef.current?.click()}
                      className="px-4 py-2 cursor-pointer bg-blue-700 hover:bg-blue-800 text-white rounded flex items-center gap-2"
                    >
                      <FileUp className="w-5 h-5" />
                      Upload Image
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={libraryFileInputRef}
                      onChange={handleLibraryFileChange}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleSelectImage(result.src)}
                        className="cursor-pointer hover:opacity-80 relative"
                      >
                        <img
                          src={result.src}
                          alt={result.alt}
                          className="w-full h-40 object-cover border border-gray-200 rounded"
                        />
                        {selectedImages.includes(result.src) && (
                          <div className="absolute inset-0 border-2 border-blue-700 rounded"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex border-t pt-5 border-t-gray-200 flex-row justify-end items-center gap-4">
                  <button
                    onClick={handleApplySelected}
                    disabled={selectedImages.length === 0}
                    className="px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleCancelSelection}
                    className="px-4 py-2 cursor-pointer bg-gray-600 hover:bg-gray-800 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToVariationsPipelinePage;

// End of file