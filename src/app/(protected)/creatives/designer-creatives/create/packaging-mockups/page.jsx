"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const PackagingMockupCreationPage = () => {
  const router = useRouter();
  const { activeBrand, sendUrl } = useAuth();
  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [postData, setPostData] = useState({
    brandName: '',
    tagline: '',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    campaignGoal: '',
    audience: '',
    fileFormat: '',
    resolution: '',
    mockupType: ''
  });
  const [creativeData, setCreativeData] = useState({
    description: '',
    asset: null
  });
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Text to Image');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([
    { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'mockup 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'mockup 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'mockup 3', type: 'image' },
  ]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [croppedImages, setCroppedImages] = useState([]);
  const [imageSrc, setImageSrc] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });

  const inspirePrompts = [
    'A sleek box packaging for a luxury skincare product',
    'A vibrant bottle label for an energy drink',
    'A minimalist bag design for organic coffee',
    'A modern can design for a craft beer',
    'An eco-friendly pouch for sustainable snacks'
  ];

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' }
  ];

  const mockupTypeOptions = [
    { value: 'box', label: 'Box' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'bag', label: 'Bag' },
    { value: 'can', label: 'Can' },
    { value: 'pouch', label: 'Pouch' }
  ];

  const resolutionOptions = [
    { value: '1000x1000', label: 'Digital Square (1000 x 1000 px)' },
    { value: '1200x800', label: 'Digital Rectangular (1200 x 800 px)' },
    { value: '3000x3000', label: 'Print Square (10 x 10 in, 300 DPI)' },
    { value: '3600x2400', label: 'Print Rectangular (12 x 8 in, 300 DPI)' }
  ];

  const fileFormatOptions = [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'PDF', label: 'PDF (Print-ready)' }
  ];

  const campaignGoalOptions = [
    { value: 'Brand Awareness', label: 'Brand Awareness' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Sales', label: 'Sales' }
  ];

  const audienceOptions = [
    { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers' },
    { value: 'B2B', label: 'B2B (Professional)', description: 'Businesses' },
    { value: 'Casual', label: 'Casual / Social-first', description: 'Social media audience' }
  ];

  const mockGeneratedMockups = [
    { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'mockup 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'mockup 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'mockup 3', type: 'image' },
  ];

  useEffect(() => {
    if (activeBrand?.url) {
      setBrandUrl(activeBrand.url);
    }
  }, [activeBrand]);

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    setLoading({ ...loading, 1: true });
    setError('');
    try {
      const brandData = await sendUrl(brandUrl);
      if (!brandData || !brandData.data) {
        throw new Error('Failed to import brand from URL or invalid data structure');
      }
      setPostData((prev) => ({
        ...prev,
        brandName: brandData.data.name || '',
        tagline: brandData.data.tagline || '',
        primaryColor: brandData.data.primary_color || '#000000',
        secondaryColor: brandData.data.secondary_color || '#0066cc',
        font: brandData.data.font || 'Arial'
      }));
      setCreativeData((prev) => ({
        ...prev,
        description: `Imported packaging design for ${brandData.data.name || 'brand'}`
      }));
      console.log('Imported brand:', brandData.data.name, 'from URL:', brandUrl);
    } catch (err) {
      setError('Failed to fetch brand details. Please check the URL or enter details manually.');
      console.error('Import error:', err.message);
    } finally {
      setLoading({ ...loading, 1: false });
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;

      setPostData((prev) => ({ ...prev, [field]: sanitizedValue }));
    } else {
      setPostData((prev) => ({ ...prev, [field]: value }));
    }
    setError('');
  };

  const handleCreativeFieldChange = (field, value) => {
    setCreativeData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setCreativeData((prev) => ({ ...prev, description: randomPrompt }));
    console.log('Inspire Me prompt:', randomPrompt);
  };

  const handleAssetSelect = (asset) => {
    setCreativeData((prev) => ({ ...prev, asset }));
    setImageSrc([asset.src]);
    setCroppedImages([null]);
    setCurrentCropIndex(0);
    setShowCropper(true);
    console.log('Asset selected:', asset.alt, 'type:', asset.type);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!files.every(file => validExtensions.test(file.name))) {
      setError('Please upload valid image files (e.g., .jpg, .png, .webp)');
      return;
    }
    setLoading({ ...loading, 3: true });
    const newImages = files.map(file => URL.createObjectURL(file));
    setImageSrc(newImages);
    setCroppedImages(new Array(newImages.length).fill(null));
    setCurrentCropIndex(0);
    setShowCropper(true);
    setLoading({ ...loading, 3: false });
    console.log('Images uploaded:', files.map(f => f.name));
  };

  const handleSearchImages = () => {
    setSearchModalOpen(true);
    console.log('Search Images modal opened');
  };

  const handleUploadImages = () => {
    setLibraryModalOpen(true);
    console.log('Your Library modal opened');
  };

  const handleMagicMedia = () => {
    setMagicMediaModalOpen(true);
    console.log('Magic Media modal opened');
  };

  const handleSelectMedia = (media) => {
    if (selectedMedia.some((item) => item.id === media.id)) {
      setSelectedMedia(selectedMedia.filter((item) => item.id !== media.id));
      console.log('Media deselected:', media.alt);
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, media]);
      console.log('Media selected:', media.alt, 'type:', media.type);
    } else {
      setError('You cannot select more than 5 items.');
      console.log('Selection limit reached: 5 items');
    }
  };

  const handleApplySelected = () => {
    if (selectedMedia.length === 0) return;
    const images = selectedMedia.filter((item) => item.type === 'image');
    if (images.length > 0) {
      setImageSrc(images.map((item) => item.src));
      setCroppedImages(new Array(images.length).fill(null));
      setCurrentCropIndex(0);
      setShowCropper(true);
    }
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedMedia([]);
    console.log('Applied selected media:', selectedMedia.map((item) => item.alt));
  };

  const handleCancelSelection = () => {
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    console.log('Selection cancelled');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAddImageUrl = () => {
    const url = document.getElementById('imageUrlInput')?.value.trim();
    if (!url) return;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(url)) {
      setError('Please enter a valid image URL (e.g., .jpg, .png, .webp)');
      return;
    }
    if (searchResults.some((result) => result.src === url)) {
      setError('This image URL is already added.');
      return;
    }
    try {
      const img = new Image();
      img.onload = () => {
        const newId = searchResults.length + 1;
        setSearchResults([{ id: newId, src: url, alt: `User-added image ${newId}`, type: 'image' }, ...searchResults]);
        document.getElementById('imageUrlInput').value = '';
        console.log('Image URL added:', url);
      };
      img.onerror = () => setError('Invalid image URL or image could not be loaded.');
      img.src = url;
    } catch (error) {
      setError('An error occurred while adding the image URL.');
      console.error('Error adding image URL:', error);
    }
  };

  const handleResolutionChange = (e) => {
    setPostData((prev) => ({ ...prev, resolution: e.target.value }));
  };

  const handleFileFormatChange = (e) => {
    setPostData((prev) => ({ ...prev, fileFormat: e.target.value }));
  };

  const handleCampaignGoalSelect = (value) => {
    setPostData((prev) => ({ ...prev, campaignGoal: value }));
    setError('');
  };

  const handleAudienceSelect = (value) => {
    setPostData((prev) => ({ ...prev, audience: value }));
    setError('');
  };

  const handleGenerateMockups = () => {
    if (!creativeData.description || !creativeData.asset) {
      setError('Please provide a description and select an image before generating.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs(mockGeneratedMockups);
      setLoading({ ...loading, generate: false });
      console.log('Mockups generated for description:', creativeData.description);
    }, 3000);
  };

  const handleMenuToggle = (mockupId) => {
    setMenuOpen(menuOpen === mockupId ? null : mockupId);
  };

  const handleDownload = (mockup) => {
    const canvas = document.createElement('canvas');
    const [width, height] = postData.resolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.src = mockup.src;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      ctx.fillStyle = postData.primaryColor || 'black';
      ctx.font = `24px ${postData.font || 'Arial'}`;
      ctx.fillText(postData.brandName || 'Mockup Text', 20, 50);
      const url = canvas.toDataURL(`image/${postData.fileFormat.toLowerCase()}`);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${mockup.alt}.${postData.fileFormat.toLowerCase()}`;
      link.click();
      console.log('Downloaded mockup:', mockup.alt);
    };
    img.onerror = () => {
      console.error('Failed to load image for download:', mockup.src);
      setError('Failed to download mockup.');
    };
    setMenuOpen(null);
  };

  const handleUse = (mockup) => {
    setCreativeData((prev) => ({ ...prev, asset: mockup }));
    setOutputs([]);
    setStep(3);
    console.log('Using mockup:', mockup.alt);
    setMenuOpen(null);
  };

  const handleExport = (mockup) => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const [width, height] = postData.resolution.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.src = mockup.src;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        ctx.fillStyle = postData.primaryColor || 'black';
        ctx.font = `24px ${postData.font || 'Arial'}`;
        ctx.fillText(postData.brandName || 'Mockup Text', 20, 50);
        const url = canvas.toDataURL(`image/${postData.fileFormat.toLowerCase()}`);
        setResult({ type: 'export', url, assetId: mockup.id });
        setLoading({ ...loading, 3: false });
        console.log('Exported mockup:', mockup.alt);
      };
      img.onerror = () => {
        console.error('Failed to load image for export:', mockup.src);
        setError('Failed to export mockup.');
        setLoading({ ...loading, 3: false });
      };
    }, 1000);
  };

  const onImageLoaded = (img) => {
    imgRef.current = img;
  };

  const saveCroppedImage = () => {
    if (!completedCrop || !imgRef.current) return;
    setLoading({ ...loading, 3: true });
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
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
    canvas.toBlob((blob) => {
      const file = new File([blob], `cropped-mockup-${Date.now()}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      setCroppedImages((prev) => {
        const newImages = [...prev];
        newImages[currentCropIndex] = file;
        return newImages;
      });
      setImageSrc((prev) => {
        const newSrc = [...prev];
        newSrc[currentCropIndex] = url;
        return newSrc;
      });
      if (currentCropIndex >= imageSrc.length - 1) {
        const newAsset = { id: `cropped-${Date.now()}`, src: url, alt: 'Cropped image', type: 'image' };
        setCreativeData((prev) => ({ ...prev, asset: newAsset }));
        setShowCropper(false);
        setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
        setCompletedCrop(null);
        setLoading({ ...loading, 3: false });
        console.log('Cropped all images, cropper closed:', url);
      } else {
        setCurrentCropIndex(currentCropIndex + 1);
        setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
        setCompletedCrop(null);
        setLoading({ ...loading, 3: false });
        console.log('Cropped image, moving to next:', url);
      }
    }, 'image/png');
  };

  const handleSkipCrop = async () => {
    setLoading({ ...loading, 3: true });
    const src = imageSrc[currentCropIndex];
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], `original-mockup-${Date.now()}.png`, { type: blob.type });
      const url = URL.createObjectURL(file);
      setCroppedImages((prev) => {
        const newImages = [...prev];
        newImages[currentCropIndex] = file;
        return newImages;
      });
      setImageSrc((prev) => {
        const newSrc = [...prev];
        newSrc[currentCropIndex] = url;
        return newSrc;
      });
      if (currentCropIndex >= imageSrc.length - 1) {
        const newAsset = { id: `original-${Date.now()}`, src: url, alt: 'Original image', type: 'image' };
        setCreativeData((prev) => ({ ...prev, asset: newAsset }));
        setShowCropper(false);
        setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
        setCompletedCrop(null);
        setLoading({ ...loading, 3: false });
        console.log('Skipped crop, cropper closed:', url);
      } else {
        setCurrentCropIndex(currentCropIndex + 1);
        setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
        setCompletedCrop(null);
        setLoading({ ...loading, 3: false });
        console.log('Skipped crop, moving to next:', url);
      }
    } catch (error) {
      console.error('Error skipping crop:', error);
      setError('Failed to load the image. Please try again.');
      setLoading({ ...loading, 3: false });
    }
  };

  const handleContinue = () => {
    if (step === 1 && !postData.brandName) {
      setError('Please enter a brand name.');
      return;
    }
    if (step === 2 && (!postData.campaignGoal || !postData.audience || !postData.fileFormat || !postData.resolution || !postData.mockupType)) {
      setError('Please select a campaign goal, audience, file format, resolution, and mockup type.');
      return;
    }
    if (step === 3 && !creativeData.asset) {
      setError('Please select or upload at least one image.');
      return;
    }
    if (step < steps.length) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step + 1);
        setLoading({ ...loading, [step]: false });
        console.log('Wizard step:', step + 1, 'Format: packaging-mockup');
      }, 1000);
    }
  };

  const handleBack = () => {
    if (outputs.length > 0) {
      setOutputs([]);
      setResult(null);
      console.log('Cleared generated mockups, returning to Image Upload');
    } else if (step > 1) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step - 1);
        setLoading({ ...loading, [step]: false });
        console.log('Wizard step:', step - 1, 'Format: packaging-mockup');
      }, 1000);
    } else {
      router.push('/creatives/designer-creatives');
    }
  };

  const renderTabContent = () => {
    return (
      <div className="h-[100%] overflow-y-auto rounded-lg p-3">
        Select a tab to view content
      </div>
    );
  };

  const steps = [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Goals & Formatting', icon: <Image className="h-5 w-5" /> },
    { id: 3, title: 'Image Upload', icon: <Download className="h-5 w-5" /> }
  ];

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Create Packaging Mockup</div>

      {outputs.length > 0 ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Mockups</div>
          <div className="border border-gray-200 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {outputs.map((asset) => (
                <div key={asset.id} className="relative border rounded-lg border-gray-200">
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    className="w-full h-auto rounded-lg"
                    style={{ aspectRatio: postData.resolution.replace('x', '/') }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
                    <p className="text-white text-sm">{postData.brandName.slice(0, 50)}</p>
                    <p className="text-white text-sm">{postData.tagline.slice(0, 50)}</p>
                  </div>
                  <button
                    onClick={() => handleMenuToggle(asset.id)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    aria-label="Mockup Options"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                  {menuOpen === asset.id && (
                    <div className="absolute top-10 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleDownload(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Download ${asset.alt}`}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleUse(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Use ${asset.alt}`}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleExport(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Export ${asset.alt}`}
                      >
                        Export
                      </button>
                    </div>
                  )}
                  {result && result.assetId === asset.id && (
                    <div className="mt-2 text-center">
                      <p className="text-green-600 text-sm">
                        Mockup Exported! <a href={result.url} download className="text-blue-700 underline cursor-pointer">Download</a>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between p-3 rounded-lg">
            <button
              onClick={handleBack}
              className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
              aria-label="Back"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-10 w-full">
          <div className="hidden lg:flex overflow-hidden sticky top-20 flex-col mt-13 w-[30%] h-[300px]">
            <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute top-0 left-4.5 w-1 bg-blue-700 rounded-full"
            />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex items-center h-full last:mb-0 mb-10">
                <div className="relative z-20">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
                      ${step === s.id ? 'border-blue-700 bg-blue-100 text-blue-700' : step > s.id ? 'bg-blue-700 border-blue-700 text-white' : 'border-gray-300 text-gray-300'}`}
                  >
                    {loading[s.id] ? (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-700 border-t-transparent animate-spin"></div>
                    ) : step > s.id ? (
                      <CheckCircle2 size={20} className="text-blue-700" />
                    ) : (
                      s.icon
                    )}
                  </div>
                </div>
                <span className={`ml-3 text-sm font-medium ${step === s.id ? 'text-blue-700' : 'text-black'}`}>
                  <div className="text-gray-500 text-xs">Step {s.id}</div>
                  <div className="font-medium">{s.title}</div>
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4 ">
            <div className="overflow-auto">
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">URL Import</h1>
                        <p className="text-gray-600 text-xs">Import your brand details for packaging mockup creation.</p>
                      </div>
                    </div>
                    <div className="py-3 border border-gray-200 rounded-md px-2 w-full flex-row gap-2">
                      <div className="flex flex-row gap-2">
                        <input
                          type="url"
                          value={brandUrl}
                          onChange={(e) => setBrandUrl(e.target.value)}
                          placeholder="Enter brand URL"
                          className="flex-1 p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                          aria-label="Brand URL"
                        />
                        <button
                          onClick={handleImportBrand}
                          className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm"
                          disabled={loading[1] || !brandUrl}
                          aria-label="Import Brand"
                        >
                          {loading[1] ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Import'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5 border rounded-md border-gray-200 p-3">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="flex border border-gray-200 rounded-md py-2 px-2 gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                        <p className="text-gray-600 text-xs">Enter details for your packaging mockup.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Brand Name</label>
                      <input
                        type="text"
                        value={postData.brandName}
                        onChange={(e) => handleFieldChange('brandName', e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        aria-label="Brand Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Tagline</label>
                      <input
                        type="text"
                        value={postData.tagline}
                        onChange={(e) => handleFieldChange('tagline', e.target.value)}
                        placeholder="Enter tagline"
                        className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        aria-label="Tagline"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        placeholder="Enter a description for your packaging mockup (e.g., 'A sleek box packaging for a luxury skincare product')"
                        value={creativeData.description}
                        onChange={(e) => handleCreativeFieldChange('description', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                        aria-label="Mockup Description"
                      />
                      <button
                        onClick={handleInspireMe}
                        className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                        aria-label="Inspire Me"
                      >
                        Inspire Me
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Primary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={postData.primaryColor}
                            onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                            className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer"
                            aria-label="Primary Color"
                          />
                          <input
                            type="text"
                            value={postData.primaryColor}
                            onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                            placeholder="#000000"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                            aria-label="Primary Color Hex Code"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Secondary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={postData.secondaryColor}
                            onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                            className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer"
                            aria-label="Secondary Color"
                          />
                          <input
                            type="text"
                            value={postData.secondaryColor}
                            onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                            placeholder="#0066cc"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                            aria-label="Secondary Color Hex Code"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Font</label>
                      <select
                        value={postData.font}
                        onChange={(e) => handleFieldChange('font', e.target.value)}
                        className="w-full p-3 border bg-white border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer"
                        aria-label="Font"
                      >
                        {fontOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                    <div className="flex justify-center gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Goals & Formatting</h1>
                        <p className="text-gray-600 text-xs">Select campaign goals, audience, file format, resolution, and mockup type.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign Goal</label>
                      <div className="grid grid-cols-3 gap-4">
                        {campaignGoalOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleCampaignGoalSelect(option.value)}
                            className={`cursor-pointer flex flex-row justify-center border rounded-lg gap-2 p-2 text-xs font-normal ${postData.campaignGoal === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={postData.campaignGoal === option.value}
                                onChange={() => handleCampaignGoalSelect(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div className='flex w-full'>{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Audience</label>
                      <div className="grid grid-cols-3 gap-4">
                        {audienceOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleAudienceSelect(option.value)}
                            className={`cursor-pointer border rounded-lg p-2 text-center text-sm font-medium ${postData.audience === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <input
                                type="checkbox"
                                checked={postData.audience === option.value}
                                onChange={() => handleAudienceSelect(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div className='text-xs'>{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">File Format</label>
                      <div className="grid grid-cols-3 gap-4">
                        {fileFormatOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleFileFormatChange({ target: { value: option.value } })}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={postData.fileFormat === option.value}
                                onChange={() => handleFileFormatChange({ target: { value: option.value } })}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div>{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Resolution</label>
                      <div className="grid grid-cols-3 gap-4">
                        {resolutionOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleResolutionChange({ target: { value: option.value } })}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.resolution === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={postData.resolution === option.value}
                                onChange={() => handleResolutionChange({ target: { value: option.value } })}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div>{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Mockup Type</label>
                      <div className="grid grid-cols-3 gap-4">
                        {mockupTypeOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleFieldChange('mockupType', option.value)}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.mockupType === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={postData.mockupType === option.value}
                                onChange={() => handleFieldChange('mockupType', option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div>{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && !loading.generate && (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                    <div className="flex justify-center gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Download className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Image Upload</h1>
                        <p className="text-gray-600 text-xs">Select or upload images for your mockup.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateMockups}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium"
                      disabled={loading[3] || !creativeData.asset || !creativeData.description}
                      aria-label="Generate Mockups"
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                  <div className="space-y-6">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="grid grid-cols-5 pb-3 gap-4">
                      {searchResults.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => handleAssetSelect({ ...asset, type: 'image' })}
                          className={`cursor-pointer relative border rounded-lg ${creativeData.asset?.id === asset.id ? 'border-blue-700' : 'border-gray-200'}`}
                          aria-label={`Select ${asset.alt}`}
                        >
                          <img
                            src={asset.src}
                            alt={asset.alt}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          {creativeData.asset?.id === asset.id && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {croppedImages.length > 0 && (
                      <div className="grid grid-cols-5 gap-4">
                        {croppedImages.map((img, index) => (
                          img && (
                            <div key={index} className="flex flex-col relative items-center">
                              <img
                                src={imageSrc[index] || URL.createObjectURL(img)}
                                alt={`Image ${index}`}
                                className={`w-full h-32 object-cover rounded-lg border ${creativeData.asset?.src === (imageSrc[index] || URL.createObjectURL(img)) ? 'border-blue-700' : 'border-gray-200'}`}
                                onClick={() => handleAssetSelect({ id: `image-${index}`, src: imageSrc[index], alt: `Image ${index}`, type: 'image' })}
                              />
                              <button
                                onClick={() => {
                                  const newCropped = [...croppedImages];
                                  newCropped.splice(index, 1);
                                  setCroppedImages(newCropped);
                                  const newSrc = [...imageSrc];
                                  newSrc.splice(index, 1);
                                  setImageSrc(newSrc);
                                  if (creativeData.asset?.src === imageSrc[index]) {
                                    setCreativeData((prev) => ({ ...prev, asset: null }));
                                  }
                                  console.log('Removed image:', index);
                                }}
                                className="absolute top-1 right-1 bg-red-500 cursor-pointer text-white rounded-full p-1 hover:bg-red-600 transition duration-300"
                                aria-label={`Remove image ${index}`}
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
                          )
                        ))}
                      </div>
                    )}
                    <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center">
                      <div><FolderOpen /></div>
                      <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                      <p className="text-gray-500 text-xs">Choose an image from your brand, library, or generate with Magic Media.</p>
                      <div className="flex gap-4">
                        <button
                          onClick={handleSearchImages}
                          className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3"
                          aria-label="Search Images"
                        >
                          <div className="text-sm font-medium">Search Images</div>
                          <div className="mt-0.5"><FileSearch className="w-4 h-4" /></div>
                        </button>
                        <button
                          onClick={handleUploadImages}
                          className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3"
                          disabled={loading[3]}
                          aria-label="Your Library"
                        >
                          <div className="text-sm font-medium">Your Library</div>
                          <div className="mt-0.5">
                            {loading[3] ? (
                              <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FolderOpen className="w-4 h-4" />
                            )}
                          </div>
                        </button>
                        <button
                          onClick={handleMagicMedia}
                          className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3"
                          aria-label="Magic Media"
                        >
                          <div className="text-sm font-medium">Magic Media</div>
                          <div className="mt-0.5"><Image className="w-4 h-4" /></div>
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {loading.generate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                    <FloatingAnimation showProgressBar={true}>
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
                          className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          aria-label="Close Search Modal"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center border-b border-b-gray-200 py-5">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for images (e.g., packaging designs, labels)..."
                          className="p-2 border border-gray-300 rounded-l w-1/3"
                          aria-label="Search Images"
                        />
                        <button
                          onClick={() => { }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-r cursor-pointer"
                          aria-label="Search"
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
                            onClick={() => handleSelectMedia(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedMedia.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedMedia.some((item) => item.id === result.id) && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
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
                          aria-label="Image URL"
                        />
                        <button
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
                          aria-label="Add Image URL"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={handleApplySelected}
                          disabled={selectedMedia.length === 0}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400 cursor-pointer"
                          aria-label="Apply Selected Media"
                        >
                          Apply
                        </button>
                        <button
                          onClick={handleCancelSelection}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-800 text-white rounded-lg cursor-pointer"
                          aria-label="Cancel Selection"
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
                          className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          aria-label="Close Library Modal"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center border-b border-b-gray-200 py-5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded flex items-center gap-2 cursor-pointer"
                          disabled={loading[3]}
                          aria-label="Upload Image"
                        >
                          <FileUp className="w-5 h-5" />
                          Upload Image
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSelectMedia(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedMedia.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedMedia.some((item) => item.id === result.id) && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex border-t pt-5 border-t-gray-200 flex-row justify-end items-center gap-4">
                      <button
                        onClick={handleApplySelected}
                        disabled={selectedMedia.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400 cursor-pointer"
                        aria-label="Apply Selected Media"
                      >
                        Apply
                      </button>
                      <button
                        onClick={handleCancelSelection}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-800 text-white rounded-lg cursor-pointer"
                        aria-label="Cancel Selection"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {magicMediaModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-white flex flex-col justify-between rounded-lg p-6 w-[80%] h-[95%]">
                    <div className="flex flex-col gap-8">
                      <div className="flex justify-between items-center px-14">
                        <h2 className="text-xl font-semibold">Magic Media</h2>
                        <button
                          onClick={() => setMagicMediaModalOpen(false)}
                          className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          aria-label="Close Magic Media Modal"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="px-14">
                        <div className="flex gap-4 border-b border-gray-200 pb-2 overflow-x-auto">
                          {[
                            'Text to Image',
                            'Text to Audio',
                            'Text to Video',
                            'Image to Variations',
                            'Script to Voiceover to Video',
                            'Audio to Text',
                            'Persona-based Generator'
                          ].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => handleTabChange(tab)}
                              className={`px-4 py-2 text-sm font-medium transition duration-300 cursor-pointer ${activeTab === tab
                                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              aria-label={`Select ${tab} tab`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex h-[100%] flex-col gap-4 px-14">
                        {renderTabContent()}
                      </div>
                    </div>
                    <div className="flex border-t pt-5 border-t-gray-200 flex-row justify-end items-center gap-4 px-14">
                      <button
                        onClick={handleApplySelected}
                        disabled={selectedMedia.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400 cursor-pointer"
                        aria-label="Apply Selected Media"
                      >
                        Apply
                      </button>
                      <button
                        onClick={handleCancelSelection}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-800 text-white rounded-lg cursor-pointer"
                        aria-label="Cancel Selection"
                      >
                        Cancel
                      </button>
                    </div>
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
                      aspect={postData.resolution.split('x').map(Number)[0] / postData.resolution.split('x').map(Number)[1]}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop"
                        src={imageSrc[currentCropIndex]}
                        onLoad={(e) => onImageLoaded(e.currentTarget)}
                      />
                    </ReactCrop>
                    <div className="absolute top-2 right-2 text-sm text-gray-600">
                      Image {currentCropIndex + 1} of {imageSrc.length}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    {currentCropIndex > 0 && (
                      <button
                        onClick={() => {
                          setCurrentCropIndex(currentCropIndex - 1);
                          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
                          setCompletedCrop(null);
                        }}
                        className="px-4 py-2 bg-gray-300 text-black rounded-lg cursor-pointer"
                        aria-label="Previous Image"
                      >
                        Previous
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowCropper(false);
                        setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
                        setCompletedCrop(null);
                        setImageSrc([]);
                        setCroppedImages([]);
                        fileInputRef.current.value = '';
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-pointer"
                      aria-label="Cancel Crop"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSkipCrop}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-pointer"
                      disabled={loading[3]}
                      aria-label={currentCropIndex >= imageSrc.length - 1 ? 'Skip Crop' : 'Skip Image'}
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Skip'
                      )}
                    </button>
                    <button
                      onClick={saveCroppedImage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
                      disabled={loading[3] || !completedCrop}
                      aria-label="Save Crop"
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        currentCropIndex === imageSrc.length - 1 ? 'Finish' : 'Next'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t pt-5 border-t-gray-200">
              <button
                onClick={handleBack}
                className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                aria-label="Back"
              >
                Back
              </button>
              <button
                onClick={step === 3 ? handleGenerateMockups : handleContinue}
                className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 py-2 items-center text-sm font-medium disabled:bg-gray-400"
                disabled={loading[step] || (step === 3 && (!creativeData.description || !creativeData.asset))}
                aria-label={step === 3 ? 'Generate Mockups' : 'Continue'}
              >
                {loading[step] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  step === 3 ? 'Generate' : 'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagingMockupCreationPage;