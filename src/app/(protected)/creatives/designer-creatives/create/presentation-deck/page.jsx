"use client";

import React, { useState, useRef } from 'react';
import { Image, Download, CheckCircle2, FileUp, FileSearch, FolderOpen, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from 'next/navigation';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const PresentationDeckCreationPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [creativeData, setCreativeData] = useState({
    brandUrl: '',
    brandName: '',
    description: '',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    logo: null,
    size: '',
    presentationGoal: '',
    audience: '',
    fileFormat: '',
    assets: [],
  });
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [brandAssets, setBrandAssets] = useState([
    { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'Slide 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'Slide 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'Slide 3', type: 'image' },
  ]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Text to Image');
  const [searchResults, setSearchResults] = useState(brandAssets);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });
  const [result, setResult] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppingIndex, setCroppingIndex] = useState(0);
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const imgRef = useRef(null);

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
  ];

  const sizeOptions = [
    { key: 'standard', value: '1280x720', label: 'Standard (1280x720)', description: 'Best for digital presentations' },
    { key: 'widescreen', value: '1920x1080', label: 'Widescreen (1920x1080)', description: 'Ideal for large screens' },
    { key: 'print', value: '3600x2025', label: 'Print (3600x2025)', description: 'Optimized for printing' },
  ];

  const presentationGoalOptions = [
    { value: 'Brand Awareness', label: 'Brand Awareness' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Website Traffic', label: 'Website Traffic' },
    { value: 'Lead Generation', label: 'Lead Generation' },
  ];

  const audienceOptions = [
    { value: 'B2B', label: 'B2B (Professional)', description: 'Business owners, startups, agencies' },
    { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers, everyday users' },
    { value: 'Casual', label: 'Casual / Social-first', description: 'Broad social media audience' },
    { value: 'Inspirational', label: 'Inspirational / Motivational', description: 'Entrepreneurs, creators, startups' },
    { value: 'Sales', label: 'Direct / Sales-oriented', description: 'Hot leads, ad audiences' },
  ];

  const fileFormatOptions = [
    { value: 'PDF', label: 'PDF (Recommended)' },
    { value: 'PNG', label: 'PNG' },
    { value: 'PPTX', label: 'PPTX' },
  ];

  const inspirePrompts = [
    'A professional pitch deck for a tech startup',
    'An educational presentation on renewable energy',
    'A corporate overview deck with financial metrics',
  ];

  const handleFieldChange = (field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;
    
      setError('');
      setCreativeData((prev) => ({ ...prev, [field]: sanitizedValue }));
    } else {
      setCreativeData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleDescriptionChange = (e) => {
    setCreativeData((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setCreativeData((prev) => ({ ...prev, description: randomPrompt }));
  };

  const handleImportBrand = () => {
    if (!creativeData.brandUrl) {
      setError('Please enter a valid URL.');
      return;
    }
    setLoading({ ...loading, 1: true });
    setTimeout(() => {
      setCreativeData((prev) => ({
        ...prev,
        brandName: 'Imported Brand',
        description: 'Imported presentation deck',
        primaryColor: '#000000',
        secondaryColor: '#0066cc',
        font: 'Arial',
        logo: null,
      }));
      setError('');
      setLoading({ ...loading, 1: false });
    }, 1000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      setError('Please upload a valid image file (e.g., .jpg, .png)');
      return;
    }
    setLoading({ ...loading, 1: true });
    const reader = new FileReader();
    reader.onload = () => {
      setCreativeData((prev) => ({ ...prev, logo: reader.result }));
      setLoading({ ...loading, 1: false });
    };
    reader.readAsDataURL(file);
  };

  const handleSizeSelect = (value) => {
    setCreativeData((prev) => ({ ...prev, size: value }));
  };

  const handlePresentationGoalSelect = (value) => {
    setCreativeData((prev) => ({ ...prev, presentationGoal: value }));
  };

  const handleAudienceSelect = (value) => {
    setCreativeData((prev) => ({ ...prev, audience: value }));
  };

  const handleSearchImages = () => {
    setSearchModalOpen(true);
  };

  const handleUploadImages = () => {
    setLibraryModalOpen(true);
  };

  const handleMagicMedia = () => {
    setMagicMediaModalOpen(true);
  };

  const handleAssetSelect = (asset) => {
    setCreativeData((prev) => {
      const isSelected = prev.assets.some((a) => a.id === asset.id);
      if (isSelected) {
        return { ...prev, assets: prev.assets.filter((a) => a.id !== asset.id) };
      } else if (prev.assets.length < 5) {
        return { ...prev, assets: [...prev.assets, asset] };
      } else {
        setError('You can select up to 5 images only.');
        return prev;
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      setError('Please upload a valid image file (e.g., .jpg, .png)');
      return;
    }
    if (creativeData.assets.length >= 5) {
      setError('You can select up to 5 images only.');
      return;
    }
    setLoading({ ...loading, 3: true });
    const reader = new FileReader();
    reader.onload = () => {
      const newAsset = { id: `uploaded-${Date.now()}`, src: reader.result, alt: 'Uploaded slide', type: 'image' };
      setBrandAssets([...brandAssets, newAsset]);
      setSearchResults([...searchResults, newAsset]);
      setCreativeData((prev) => ({ ...prev, assets: [...prev.assets, newAsset] }));
      setShowCropper(true);
      setCroppingIndex(prev.assets.length);
      setLoading({ ...loading, 3: false });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectMedia = (media) => {
    if (selectedAssets.some((item) => item.id === media.id)) {
      setSelectedAssets(selectedAssets.filter((item) => item.id !== media.id));
    } else if (selectedAssets.length < 5) {
      setSelectedAssets([...selectedAssets, media]);
    } else {
      setError('You can select up to 5 images only.');
    }
  };

  const handleApplySelected = () => {
    if (selectedAssets.length === 0) return;
    if (creativeData.assets.length + selectedAssets.length > 5) {
      setError('You can select up to 5 images total.');
      return;
    }
    setCreativeData((prev) => ({ ...prev, assets: [...prev.assets, ...selectedAssets] }));
    setShowCropper(true);
    setCroppingIndex(creativeData.assets.length);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedAssets([]);
  };

  const handleCancelSelection = () => {
    setSelectedAssets([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
  };

  const handleAddImageUrl = () => {
    const imageUrlInput = document.getElementById('imageUrlInput').value;
    if (!imageUrlInput.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      setError('Please enter a valid image URL.');
      return;
    }
    if (searchResults.some((result) => result.src === imageUrlInput)) {
      setError('This image URL is already added.');
      return;
    }
    setLoading({ ...loading, 3: true });
    try {
      const img = new Image();
      img.onload = () => {
        const newAsset = { id: `url-${Date.now()}`, src: imageUrlInput, alt: 'URL-imported slide', type: 'image' };
        setSearchResults([...searchResults, newAsset]);
        setCreativeData((prev) => {
          if (prev.assets.length < 5) {
            return { ...prev, assets: [...prev.assets, newAsset] };
          } else {
            setError('You can select up to 5 images only.');
            return prev;
          }
        });
        setShowCropper(true);
        setCroppingIndex(creativeData.assets.length);
        setLoading({ ...loading, 3: false });
      };
      img.onerror = () => {
        setError('Invalid image URL or image could not be loaded.');
        setLoading({ ...loading, 3: false });
      };
      img.src = imageUrlInput;
    } catch (error) {
      setError('An error occurred while adding the image URL.');
      setLoading({ ...loading, 3: false });
    }
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
      const file = new File([blob], `cropped-slide-${Date.now()}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      const newAsset = { id: `cropped-${Date.now()}`, src: url, alt: 'Cropped slide', type: 'image' };
      setCreativeData((prev) => {
        const updatedAssets = [...prev.assets];
        updatedAssets[croppingIndex] = newAsset;
        const nextIndex = croppingIndex + 1;
        if (nextIndex < prev.assets.length) {
          setCroppingIndex(nextIndex);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCroppingIndex(0);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        }
        return { ...prev, assets: updatedAssets };
      });
      setLoading({ ...loading, 3: false });
    }, 'image/png');
  };

  const handleSkipCrop = async () => {
    setLoading({ ...loading, 3: true });
    try {
      const currentAsset = creativeData.assets[croppingIndex];
      const response = await fetch(currentAsset.src);
      const blob = await response.blob();
      const file = new File([blob], `original-slide-${Date.now()}.png`, { type: blob.type });
      const url = URL.createObjectURL(file);
      const newAsset = { id: `original-${Date.now()}`, src: url, alt: 'Original slide', type: 'image' };
      setCreativeData((prev) => {
        const updatedAssets = [...prev.assets];
        updatedAssets[croppingIndex] = newAsset;
        const nextIndex = croppingIndex + 1;
        if (nextIndex < prev.assets.length) {
          setCroppingIndex(nextIndex);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCroppingIndex(0);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        }
        return { ...prev, assets: updatedAssets };
      });
      setLoading({ ...loading, 3: false });
    } catch (error) {
      setError('Failed to load the image. Please try again.');
      setLoading({ ...loading, 3: false });
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCroppingIndex(0);
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
    setCompletedCrop(null);
    setCreativeData((prev) => ({ ...prev, assets: [] }));
    fileInputRef.current.value = '';
  };

  const handleGenerateSlides = () => {
    if (creativeData.assets.length === 0) {
      setError('Please select at least one image.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setTimeout(() => {
      setResult({ type: 'generated', assets: creativeData.assets });
      setLoading({ ...loading, generate: false });
    }, 3000);
  };

  const handleMenuToggle = (slideId) => {
    setMenuOpen(menuOpen === slideId ? null : slideId);
  };

  const handleDownload = (slide) => {
    const canvas = document.createElement('canvas');
    const [width, height] = creativeData.size.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.src = slide.src;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      ctx.fillStyle = creativeData.primaryColor || '#000000';
      ctx.font = `24px ${creativeData.font || 'Arial'}`;
      ctx.fillText(creativeData.brandName || 'Brand Name', 20, 30);
      ctx.fillText(creativeData.description || 'Slide Text', 20, 60);
      if (creativeData.logo) {
        const logoImg = new window.Image();
        logoImg.src = creativeData.logo;
        logoImg.onload = () => {
          ctx.drawImage(logoImg, width - 100, height - 100, 80, 80);
          const url = canvas.toDataURL(`image/${creativeData.fileFormat.toLowerCase()}`);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${slide.alt}.${creativeData.fileFormat.toLowerCase()}`;
          link.click();
        };
        logoImg.onerror = () => {
          setError('Failed to load logo for download.');
        };
      } else {
        const url = canvas.toDataURL(`image/${creativeData.fileFormat.toLowerCase()}`);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${slide.alt}.${creativeData.fileFormat.toLowerCase()}`;
        link.click();
      }
    };
    img.onerror = () => {
      setError('Failed to download slide.');
    };
    setMenuOpen(null);
  };

  const handleUse = (slide) => {
    setCreativeData((prev) => ({ ...prev, assets: [slide] }));
    setResult(null);
    setStep(3);
    setMenuOpen(null);
  };

  const handleExport = (slide) => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const [width, height] = creativeData.size.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.src = slide.src;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        ctx.fillStyle = creativeData.primaryColor || '#000000';
        ctx.font = `24px ${creativeData.font || 'Arial'}`;
        ctx.fillText(creativeData.brandName || 'Brand Name', 20, 30);
        ctx.fillText(creativeData.description || 'Slide Text', 20, 60);
        if (creativeData.logo) {
          const logoImg = new window.Image();
          logoImg.src = creativeData.logo;
          logoImg.onload = () => {
            ctx.drawImage(logoImg, width - 100, height - 100, 80, 80);
            const url = canvas.toDataURL(`image/${creativeData.fileFormat.toLowerCase()}`);
            setResult({ type: 'export', url, assetId: slide.id });
            setLoading({ ...loading, 3: false });
          };
          logoImg.onerror = () => {
            setError('Failed to load logo for export.');
            setLoading({ ...loading, 3: false });
          };
        } else {
          const url = canvas.toDataURL(`image/${creativeData.fileFormat.toLowerCase()}`);
          setResult({ type: 'export', url, assetId: slide.id });
          setLoading({ ...loading, 3: false });
        }
      };
      img.onerror = () => {
        setError('Failed to export slide.');
        setLoading({ ...loading, 3: false });
      };
    }, 1000);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!creativeData.brandName || !creativeData.description || !creativeData.primaryColor || !creativeData.secondaryColor || !creativeData.font) {
        setError('Please fill in all required fields.');
        return;
      }
      setLoading({ ...loading, 1: true });
      setTimeout(() => {
        setStep(2);
        setError('');
        setLoading({ ...loading, 1: false });
      }, 500);
    } else if (step === 2) {
      if (!creativeData.size || !creativeData.presentationGoal || !creativeData.audience || !creativeData.fileFormat) {
        setError('Please select size, presentation goal, audience, and file format.');
        return;
      }
      setLoading({ ...loading, 2: true });
      setTimeout(() => {
        setStep(3);
        setError('');
        setLoading({ ...loading, 2: false });
      }, 500);
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
      setStep(3);
      setMenuOpen(null);
    } else if (step > 1) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step - 1);
        setError('');
        setLoading({ ...loading, [step]: false });
      }, 500);
    } else {
      router.push('/creatives/designer-creatives');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Text to Image':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Prompt</label>
            <textarea
              placeholder="Enter a prompt to generate an image (e.g., 'Professional presentation slide for a tech startup')"
              className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
              aria-label="Text to Image Prompt"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Generate Image"
            >
              Generate
            </button>
          </div>
        );
      case 'Text to Audio':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Text Input</label>
            <textarea
              placeholder="Enter text to convert to audio"
              className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
              aria-label="Text to Audio Input"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Generate Audio"
            >
              Generate
            </button>
          </div>
        );
      case 'Text to Video':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Text Input</label>
            <textarea
              placeholder="Enter text to convert to video"
              className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
              aria-label="Text to Video Input"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Generate Video"
            >
              Generate
            </button>
          </div>
        );
      case 'Image to Variations':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              className="p-2 border border-gray-200 rounded-md"
              aria-label="Upload Image for Variations"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Generate Variations"
            >
              Generate Variations
            </button>
          </div>
        );
      case 'Script to Voiceover to Video':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Script Input</label>
            <textarea
              placeholder="Enter script for voiceover and video"
              className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
              aria-label="Script Input"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Generate Video"
            >
              Generate
            </button>
          </div>
        );
      case 'Audio to Text':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Upload Audio</label>
            <input
              type="file"
              accept="audio/*"
              className="p-2 border border-gray-200 rounded-md"
              aria-label="Upload Audio for Transcription"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Transcribe Audio"
            >
              Transcribe
            </button>
          </div>
        );
      case 'Persona-based Generator':
        return (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Persona Description</label>
            <textarea
              placeholder="Describe the persona for content generation"
              className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
              aria-label="Persona Description"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
              aria-label="Generate Content"
            >
              Generate
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const steps = [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Size, Goals & Audience', icon: <Image className="h-5 w-5" /> },
    { id: 3, title: 'Image', icon: <Download className="h-5 w-5" /> },
  ];

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Create Presentation Deck</div>

      {result ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Slides</div>
          <div className="border border-gray-200 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {result.assets.map((asset) => (
                <div key={asset.id} className="relative border rounded-lg border-gray-200">
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    className="w-full h-auto rounded-lg"
                    style={{ aspectRatio: creativeData.size.split('x')[0] / creativeData.size.split('x')[1] }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
                    <p className="text-white text-sm">{creativeData.description.slice(0, 50)}</p>
                  </div>
                  <button
                    onClick={() => handleMenuToggle(asset.id)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    aria-label="Slide Options"
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
                  {result.type === 'export' && result.assetId === asset.id && (
                    <div className="mt-2 text-center">
                      <p className="text-green-600 text-sm">
                        Slide Exported! <a href={result.url} download className="text-blue-700 underline cursor-pointer">Download</a>
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

          <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4 max-w-5xl max-h-[90vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="overflow-auto">
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">URL Import</h1>
                        <p className="text-gray-600 text-xs">Import your brand URL to auto-fill deck details.</p>
                      </div>
                    </div>
                    <div className="py-3 border border-gray-200 rounded-md px-2 w-full flex-row gap-2">
                      <div className="flex flex-row gap-2">
                        <input
                          type="url"
                          value={creativeData.brandUrl}
                          onChange={(e) => handleFieldChange('brandUrl', e.target.value)}
                          placeholder="Enter brand URL"
                          className="flex-1 p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                          aria-label="Brand URL"
                        />
                        <button
                          onClick={handleImportBrand}
                          className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm"
                          disabled={loading[1] || !creativeData.brandUrl}
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
                        <p className="text-gray-600 text-xs">Enter details for your presentation deck.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Brand Name</label>
                      <input
                        type="text"
                        value={creativeData.brandName}
                        onChange={(e) => handleFieldChange('brandName', e.target.value)}
                        placeholder="Your Brand Name"
                        className="w-full p-3 border bg-white border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        aria-label="Brand Name"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        placeholder="Enter a description for your deck (e.g., 'A professional pitch deck for a tech startup')"
                        value={creativeData.description}
                        onChange={handleDescriptionChange}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                        aria-label="Deck Description"
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
                            value={creativeData.primaryColor}
                            onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                            className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer"
                            aria-label="Primary Color"
                          />
                          <input
                            type="text"
                            value={creativeData.primaryColor}
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
                            value={creativeData.secondaryColor}
                            onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                            className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer"
                            aria-label="Secondary Color"
                          />
                          <input
                            type="text"
                            value={creativeData.secondaryColor}
                            onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                            placeholder="#0066cc"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                            aria-label="Secondary Color Hex Code"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row justify-between gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Font</label>
                        <select
                          value={creativeData.font}
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
                      <div className="flex flex-col justify-center flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="px-2 py-1 bg-blue-700 text-white rounded flex items-center gap-2 cursor-pointer"
                            aria-label="Upload Logo"
                          >
                            <FileUp className="w-5 h-5" />
                            Upload Logo
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                          />
                          {creativeData.logo && (
                            <img
                              src={creativeData.logo}
                              alt="Brand Logo"
                              className="w-10 h-10 object-contain"
                            />
                          )}
                        </div>
                      </div>
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
                        <h1 className="font-medium text-lg text-blue-700">Size, Goals & Audience</h1>
                        <p className="text-gray-600 text-xs">Select size, presentation goals, and audience.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Size</label>
                      <div className="grid grid-cols-4 gap-4">
                        {sizeOptions.map((option) => (
                          <div
                            key={option.key}
                            onClick={() => handleSizeSelect(option.value)}
                            className={`cursor-pointer border rounded-lg p-2 text-center text-xs ${creativeData.size === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <input
                                type="checkbox"
                                checked={creativeData.size === option.value}
                                onChange={() => handleSizeSelect(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div>{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Presentation Goal</label>
                      <div className="grid grid-cols-5 items-start gap-4">
                        {presentationGoalOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handlePresentationGoalSelect(option.value)}
                            className={`cursor-pointer flex flex-row justify-center border rounded-lg gap-2 p-2 text-xs font-normal ${creativeData.presentationGoal === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={creativeData.presentationGoal === option.value}
                                onChange={() => handlePresentationGoalSelect(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div className="flex w-full">{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Audience</label>
                      <div className="grid grid-cols-4 gap-4">
                        {audienceOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleAudienceSelect(option.value)}
                            className={`cursor-pointer border rounded-lg p-2 text-center text-sm font-medium ${creativeData.audience === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <input
                                type="checkbox"
                                checked={creativeData.audience === option.value}
                                onChange={() => handleAudienceSelect(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div className="text-xs">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">File Format</label>
                      <div className="grid grid-cols-4 gap-4">
                        {fileFormatOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleFieldChange('fileFormat', option.value)}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${creativeData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={creativeData.fileFormat === option.value}
                                onChange={() => handleFieldChange('fileFormat', option.value)}
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
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Image</h1>
                        <p className="text-gray-600 text-xs">Select up to 5 images for your presentation deck.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateSlides}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[3] || creativeData.assets.length === 0}
                      aria-label="Generate Slides"
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Generate Slides'
                      )}
                    </button>
                  </div>
                  <div className="space-y-6">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="border border-gray-200 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Brand Images</h3>
                      {brandAssets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                          {brandAssets.map((asset) => (
                            <div
                              key={asset.id}
                              onClick={() => handleAssetSelect(asset)}
                              className={`cursor-pointer relative border rounded-lg ${creativeData.assets.some((a) => a.id === asset.id) ? 'border-blue-700' : 'border-gray-200'}`}
                              aria-label={`Select ${asset.alt}`}
                            >
                              <img
                                src={asset.src}
                                alt={asset.alt}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              {creativeData.assets.some((a) => a.id === asset.id) && (
                                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No brand assets available.</p>
                      )}
                      {creativeData.assets.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {creativeData.assets.map((asset) => (
                              <div
                                key={asset.id}
                                className="relative border rounded-lg border-blue-700"
                              >
                                <img
                                  src={asset.src}
                                  alt={asset.alt}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => handleAssetSelect(asset)}
                                  className="absolute top-1 right-1 bg-red-500 cursor-pointer text-white rounded-full p-1 hover:bg-red-600 transition duration-300"
                                  aria-label={`Remove ${asset.alt}`}
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
                        </div>
                      )}
                    </div>
                    <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center">
                      <div><FolderOpen /></div>
                      <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                      <p className="text-gray-500 text-xs">Choose an image from your brand or your library.</p>
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
                  <div className="bg-white relative flex flex-col rounded-lg p-6 w-[80%] h-[85%]">
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
                          placeholder="Search for images (e.g., presentation slide designs)..."
                          className="p-2 border border-gray-300 rounded-l w-1/3"
                          aria-label="Search Images"
                        />
                        <button
                          onClick={() => { /* Add search logic here if using API */ }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-r cursor-pointer"
                          aria-label="Search"
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto pt-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSelectMedia(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedAssets.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedAssets.some((item) => item.id === result.id) && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    
                    </div>
                    <div className="flex absolute bottom-4 left-0 right-0 px-5 border-t pt-5 border-t-gray-200 flex-row justify-between items-center">
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
                          disabled={selectedAssets.length === 0}
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
                <div className="fixed inset-0 bg-black/70 flex justify-center z-50">
                  <div className="bg-white relative flex flex-col rounded-lg p-6 w-[80%] h-[85%]">
                    <div className="flex flex-col gap-8">
                      <div className="flex justify-between">
                        <h2 className="text-xl font-semibold">Your Library</h2>
                        <button
                          onClick={() => setLibraryModalOpen(false)}
                          className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          aria-label="Close Library Modal"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex border-b border-b-gray-200 py-5">
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
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto pt-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSelectMedia(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedAssets.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedAssets.some((item) => item.id === result.id) && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    
                    </div>
                    <div className="absolute right-0 left-0 flex bottom-4 border-t pt-5 border-t-gray-200 flex-row justify-between px-5 items-center">
                      <button
                        onClick={handleApplySelected}
                        disabled={selectedAssets.length === 0}
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
                            'Persona-based Generator',
                          ].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => handleTabChange(tab)}
                              className={`px-4 py-2 text-sm font-medium transition duration-300 cursor-pointer ${
                                activeTab === tab
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
                        disabled={selectedAssets.length === 0}
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
                    <h3 className="absolute top-4 left-4 text-sm font-medium text-gray-700">
                      Cropping Image {croppingIndex + 1} of {creativeData.assets.length}
                    </h3>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={creativeData.size.split('x').map(Number)[0] / creativeData.size.split('x').map(Number)[1]}
                    >
                      <img
                        ref={imgRef}
                        alt={`Crop ${creativeData.assets[croppingIndex].alt}`}
                        src={creativeData.assets[croppingIndex].src}
                        onLoad={(e) => onImageLoaded(e.currentTarget)}
                      />
                    </ReactCrop>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={handleCancelCrop}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-pointer"
                      aria-label="Cancel Crop"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSkipCrop}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-pointer"
                      disabled={loading[3]}
                      aria-label="Skip Crop"
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
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="border cursor-pointer border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
                disabled={loading[step]}
                aria-label="Back"
              >
                Back
              </button>
              {step < steps.length && (
                <button
                  onClick={handleContinue}
                  className="bg-blue-700 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition duration-300"
                  disabled={loading[step]}
                  aria-label="Continue"
                >
                  {loading[step] ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Continue'
                  )}
                </button>
              )}
              {step === steps.length && !result && (
                <button
                  onClick={handleGenerateSlides}
                  className="bg-blue-700 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition duration-300"
                  disabled={loading[3] || creativeData.assets.length === 0}
                  aria-label="Finish"
                >
                  {loading[3] ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Finish'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationDeckCreationPage;