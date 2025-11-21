"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, MoreVertical, FileUp } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useParams } from 'next/navigation';
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const BannersCreativeWizard = () => {
  const { format } = useParams();
  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [brandUrl, setBrandUrl] = useState('');
  const [importedBrand, setImportedBrand] = useState(null);
  const [error, setError] = useState(null);
  const [creativeData, setCreativeData] = useState({
    format: 'banners',
    assets: [],
    brandName: '',
    description: '',
    caption: '',
    hashtags: [],
    size: '',
    campaignGoal: '',
    fileFormat: '',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    logo: null,
    audience: '',
  });
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 20 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropAsset, setCurrentCropAsset] = useState(null);
  const [cropQueue, setCropQueue] = useState([]);
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });
  const [result, setResult] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Text to Image');
  const [searchResults, setSearchResults] = useState([
    { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'Image 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'Image 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'Image 3', type: 'image' },
  ]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const imgRef = useRef(null);
  const logoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const mockAssets = useMemo(() => ({
    images: [
      { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'Banner 1', type: 'image' },
      { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'Banner 2', type: 'image' },
      { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'Banner 3', type: 'image' },
    ],
  }), []);

  const steps = useMemo(() => [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Size, Goals & Audience', icon: <Image className="h-5 w-5" /> },
    { id: 3, title: 'Image', icon: <Download className="h-5 w-5" /> },
  ], []);

  const sizeOptions = useMemo(() => [
    { key: '(2560 x 1440)-banner', value: '2560 x 1440', label: 'Youtube Banner', description: '(2560 x 1440px)' },
    { key: '(1920 x 1080)-fbad', value: '1920 x 1080', label: 'Facebook Banner', description: '(1920 x 1080px)' },
    { key: '1600x400-liprofile', value: '1600x400', label: 'LinkedIn Profile Banner', description: '(1600 x 400px)' },
    { key: '820x312-twprofile', value: '820x312', label: 'Twitter Profile Banner', description: '(820 x 312px)' },
  ], []);

  const campaignGoalOptions = useMemo(() => [
    { value: 'Brand Awareness', label: 'Brand Awareness' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Website Traffic', label: 'Website Traffic' },
    { value: 'Lead Generation', label: 'Lead Generation' },
  ], []);

  const audienceOptions = useMemo(() => [
    { value: 'B2B', label: 'B2B (Professional)', description: 'Business owners, startups, agencies' },
    { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers, everyday users' },
    { value: 'Casual', label: 'Casual / Social-first', description: 'Broad social media audience' },
    { value: 'Inspirational', label: 'Inspirational / Motivational', description: 'Entrepreneurs, creators, startups' },
    { value: 'Sales', label: 'Direct / Sales-oriented', description: 'Hot leads, ad audiences' },
  ], []);

  const fontOptions = useMemo(() => [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
  ], []);

  const fileFormatOptions = useMemo(() => [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'AVIF', label: 'AVIF' },
    { value: 'WEBP', label: 'WEBP' },
  ], []);

  const inspirePrompts = useMemo(() => [
    'A vibrant banner for a product launch',
    'A professional banner for a corporate event',
    'A trendy banner for a social media campaign',
    'A bold banner for a sales promotion',
  ], []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const renderTabContent = () => {
    const tabComponents = {
      'Text to Image': <TextToImageTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Text to Audio': <TextToAudioTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Text to Video': <TextToVideoTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Image to Variations': <ImageToVariationsTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Script to Voiceover to Video': <ScriptToVoiceoverToVideoTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Audio to Text': <AudioToTextTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Persona-based Generator': <PersonaBasedGeneratorTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
    };

    return tabComponents[activeTab] || (
      <div className="h-[100%] overflow-y-auto rounded-lg p-3">Select a tab to view content</div>
    );
  };

  useEffect(() => {
    if (importedBrand) {
      setCreativeData((prev) => ({
        ...prev,
        brandName: importedBrand.name || '',
        description: importedBrand.description || '',
        primaryColor: importedBrand.primaryColor || '#000000',
        secondaryColor: importedBrand.secondaryColor || '#0066cc',
        font: importedBrand.font || 'Arial',
        logo: importedBrand.logo || null,
      }));
      setImportedBrand(null);
    }
  }, [importedBrand]);

  const handleImportBrand = useCallback(async () => {
    if (!brandUrl.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    setLoading((prev) => ({ ...prev, 1: true }));
    setError(null);
    try {
      // Mock brand import
      const brandData = {
        data: {
          name: 'Mock Brand',
          description: 'Imported brand description',
          primaryColor: '#000000',
          secondaryColor: '#0066cc',
          font: 'Arial',
          logo: null,
        },
      };
      setImportedBrand(brandData.data);
    } catch (err) {
      setError('Failed to fetch brand details. Please check the URL or enter details manually.');
    } finally {
      setLoading((prev) => ({ ...prev, 1: false }));
    }
  }, [brandUrl]);

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;
   
      setError(null);
      setCreativeData((prev) => ({ ...prev, [field]: sanitizedValue }));
    } else {
      setCreativeData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleInspireMe = useCallback(() => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setCreativeData((prev) => ({ ...prev, description: randomPrompt }));
  }, [inspirePrompts]);

  const handleInspire = useCallback(() => {
    if (!creativeData.description) {
      alert('Please provide a description.');
      return;
    }
    setLoading((prev) => ({ ...prev, 1: true }));
    setTimeout(() => {
      const keywords = creativeData.description.toLowerCase().split(' ').slice(0, 3);
      const mockSuggestions = {
        caption: `Stunning banner for ${creativeData.brandName}! ${creativeData.description.slice(0, 50)}... #${keywords[0] || 'Banner'}`,
        hashtags: [
          `#${creativeData.brandName.replace(' ', '')}`,
          ...keywords.map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`),
        ].slice(0, 5),
      };
      setCreativeData((prev) => ({
        ...prev,
        caption: mockSuggestions.caption,
        hashtags: mockSuggestions.hashtags,
      }));
      setLoading((prev) => ({ ...prev, 1: false }));
    }, 1000);
  }, [creativeData.description, creativeData.brandName]);

  const handleSizeSelect = useCallback((value) => {
    setCreativeData((prev) => ({ ...prev, size: value }));
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: value === '1500x600' ? 20 : value === '1200x628' ? 22.92 : value === '1600x400' ? 15 : 26.34 });
  }, []);

  const handleCampaignGoalSelect = useCallback((value) => {
    setCreativeData((prev) => ({ ...prev, campaignGoal: value }));
  }, []);

  const handleAudienceSelect = useCallback((value) => {
    setCreativeData((prev) => ({ ...prev, audience: value }));
  }, []);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      alert('Please upload a valid image file (e.g., .jpg, .png)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCreativeData((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i;
    if (!validExtensions.test(file.name)) {
      alert('Please upload a valid image or video file (e.g., .jpg, .png, .mp4)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newId = searchResults.length + 1;
      const newAsset = {
        id: newId,
        src: reader.result,
        alt: `Uploaded asset ${newId}`,
        type: file.type.startsWith('image') ? 'image' : 'video',
      };
      setSearchResults([newAsset, ...searchResults]);
      setCropQueue([newAsset]);
      setCurrentCropAsset(newAsset);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, [searchResults]);

  const handleAssetSelect = useCallback((asset) => {
    if (selectedAssets.some((item) => item.id === asset.id)) {
      setSelectedAssets(selectedAssets.filter((item) => item.id !== asset.id));
      setCreativeData((prev) => ({ ...prev, assets: selectedAssets.filter((item) => item.id !== asset.id) }));
    } else if (selectedAssets.length < 3) {
      setCropQueue([asset]);
      setCurrentCropAsset(asset);
      setShowCropper(true);
    } else {
      alert('You can select up to 3 assets for banner generation.');
    }
  }, [selectedAssets]);

  const handleSearchImages = useCallback(() => {
    setSearchModalOpen(true);
  }, []);

  const handleUploadImages = useCallback(() => {
    setLibraryModalOpen(true);
  }, []);

  const handleMagicMedia = useCallback(() => {
    setMagicMediaModalOpen(true);
  }, []);

  const handleSelectMedia = useCallback((media) => {
    if (selectedMedia.some((item) => item.id === media.id)) {
      setSelectedMedia(selectedMedia.filter((item) => item.id !== media.id));
    } else if (selectedMedia.length + selectedAssets.length < 3) {
      setSelectedMedia([...selectedMedia, media]);
    } else {
      alert('You can select up to 3 assets for banner generation.');
    }
  }, [selectedMedia, selectedAssets]);

  const handleApplySelected = useCallback(() => {
    if (selectedMedia.length === 0) return;
    if (selectedAssets.length + selectedMedia.length > 3) {
      alert('You can select up to 3 assets for banner generation.');
      return;
    }
    setCropQueue([...selectedMedia]);
    setCurrentCropAsset(selectedMedia[0]);
    setShowCropper(true);
    setMagicMediaModalOpen(false);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setSelectedMedia([]);
  }, [selectedMedia, selectedAssets]);

  const handleCancelSelection = useCallback(() => {
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
  }, []);

  const handleAddImageUrl = useCallback(() => {
    const url = document.getElementById('imageUrlInput')?.value.trim();
    if (!url) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i;
    if (!validExtensions.test(url)) {
      alert('Please enter a valid image or video URL (e.g., .jpg, .png, .mp4)');
      return;
    }
    if (searchResults.some((result) => result.src === url)) {
      alert('This URL is already added.');
      return;
    }
    try {
      const type = url.match(/\.(mp4|webm)$/i) ? 'video' : 'image';
      const img = type === 'image' ? new Image() : document.createElement('video');
      img.onload = type === 'image' ? () => {
        const [width, height] = creativeData.size.split('x').map(Number);
        const aspectRatio = width / height;
        const imageAspectRatio = img.width / img.height;
        if (Math.abs(imageAspectRatio - aspectRatio) > 0.05) {
          alert(`Please upload an image with a ${width}:${height} aspect ratio.`);
          return;
        }
        const newId = searchResults.length + 1;
        const newAsset = { id: newId, src: url, alt: `User-added ${type} ${newId}`, type };
        setSearchResults([newAsset, ...searchResults]);
        setCropQueue([newAsset]);
        setCurrentCropAsset(newAsset);
        setShowCropper(true);
        document.getElementById('imageUrlInput').value = '';
      } : undefined;
      img.onerror = () => alert('Invalid URL or asset could not be loaded.');
      img.src = url;
      if (type === 'video') {
        const newId = searchResults.length + 1;
        const newAsset = { id: newId, src: url, alt: `User-added ${type} ${newId}`, type };
        setSearchResults([newAsset, ...searchResults]);
        setCropQueue([newAsset]);
        setCurrentCropAsset(newAsset);
        setShowCropper(true);
        document.getElementById('imageUrlInput').value = '';
      }
    } catch (error) {
      alert('An error occurred while adding the asset URL.');
    }
  }, [creativeData.size, searchResults]);

  const onImageLoaded = useCallback((img) => {
    imgRef.current = img;
  }, []);

  const saveCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !currentCropAsset) return;
    setLoading((prev) => ({ ...prev, 3: true }));
    const canvas = document.createElement('canvas');
    const [width, height] = creativeData.size.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      width,
      height
    );
    canvas.toBlob((blob) => {
      const file = new File([blob], `cropped-banner.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      const croppedAsset = { id: `cropped-${Date.now()}`, src: url, alt: 'Cropped image', type: 'image' };
      setSelectedAssets((prev) => [...prev, croppedAsset]);
      setCreativeData((prev) => ({ ...prev, assets: [...prev.assets, croppedAsset] }));
      setCropQueue((prev) => {
        const nextQueue = prev.slice(1);
        if (nextQueue.length > 0) {
          setCurrentCropAsset(nextQueue[0]);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: creativeData.size === '1500x600' ? 20 : creativeData.size === '1200x628' ? 22.92 : creativeData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCurrentCropAsset(null);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: creativeData.size === '1500x600' ? 20 : creativeData.size === '1200x628' ? 22.92 : creativeData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        }
        return nextQueue;
      });
      setLoading((prev) => ({ ...prev, 3: false }));
    }, 'image/png');
  }, [completedCrop, currentCropAsset, creativeData.size]);

  const handleSkipCrop = useCallback(async () => {
    if (!currentCropAsset) return;
    setLoading((prev) => ({ ...prev, 3: true }));
    try {
      const response = await fetch(currentCropAsset.src);
      const blob = await response.blob();
      const file = new File([blob], `original-image.png`, { type: blob.type });
      const url = URL.createObjectURL(file);
      const originalAsset = { id: `original-${Date.now()}`, src: url, alt: 'Original image', type: 'image' };
      setSelectedAssets((prev) => [...prev, originalAsset]);
      setCreativeData((prev) => ({ ...prev, assets: [...prev.assets, originalAsset] }));
      setCropQueue((prev) => {
        const nextQueue = prev.slice(1);
        if (nextQueue.length > 0) {
          setCurrentCropAsset(nextQueue[0]);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: creativeData.size === '1500x600' ? 20 : creativeData.size === '1200x628' ? 22.92 : creativeData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCurrentCropAsset(null);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: creativeData.size === '1500x600' ? 20 : creativeData.size === '1200x628' ? 22.92 : creativeData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        }
        return nextQueue;
      });
      setLoading((prev) => ({ ...prev, 3: false }));
    } catch (error) {
      alert('Failed to load the image. Please try again.');
      setLoading((prev) => ({ ...prev, 3: false }));
    }
  }, [currentCropAsset, creativeData.size]);

  const handleCancelCrop = useCallback(() => {
    setShowCropper(false);
    setCurrentCropAsset(null);
    setCropQueue([]);
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: creativeData.size === '1500x600' ? 20 : creativeData.size === '1200x628' ? 22.92 : creativeData.size === '1600x400' ? 15 : 26.34 });
    setCompletedCrop(null);
  }, [creativeData.size]);

  const generateBannerVariations = useCallback(() => {
    const variations = [];
    const baseAssets = selectedAssets.length > 0 ? selectedAssets : mockAssets.images.slice(0, 1);
    for (let i = 0; i < 8; i++) {
      const baseAsset = baseAssets[i % baseAssets.length];
      variations.push({
        id: `generated-${Date.now()}-${i}`,
        src: `https://example.com/generated-banner-${i}.png`,
        alt: `Generated banner ${i + 1}`,
        type: 'image',
        caption: creativeData.caption || `Banner ${i + 1}`,
        hashtags: creativeData.hashtags.join(' '),
      });
    }
    return variations;
  }, [selectedAssets, creativeData.caption, creativeData.hashtags, mockAssets.images]);

  const handleDownload = useCallback((asset) => {
    const link = document.createElement('a');
    link.href = asset.src;
    link.download = `${asset.alt}.${creativeData.fileFormat.toLowerCase()}`;
    link.click();
    setResult({ type: 'export', url: asset.src, assetId: asset.id });
    setMenuOpen(null);
  }, [creativeData.fileFormat]);

  const handleSchedule = useCallback((asset) => {
    setLoading((prev) => ({ ...prev, 3: true }));
    setTimeout(() => {
      setResult({ type: 'schedule', status: 'scheduled', postId: `24680-${asset.id}`, assetId: asset.id });
      setLoading((prev) => ({ ...prev, 3: false }));
      setMenuOpen(null);
    }, 1000);
  }, []);

  const handleMenuToggle = useCallback((assetId) => {
    setMenuOpen(menuOpen === assetId ? null : assetId);
  }, [menuOpen]);

  const handleContinue = useCallback(() => {
    if (step < steps.length) {
      if (step === 1) {
        if (!creativeData.description || !creativeData.brandName || !creativeData.caption || !creativeData.primaryColor || !creativeData.secondaryColor || !creativeData.font) {
          alert('Please provide brand name, description, caption, colors, and font.');
          return;
        }
        setLoading((prev) => ({ ...prev, [step]: true }));
        setTimeout(() => {
          setStep(2);
          setLoading((prev) => ({ ...prev, [step]: false }));
        }, 500);
      } else if (step === 2) {
        if (!creativeData.campaignGoal || !creativeData.size || !creativeData.audience) {
          alert('Please select a campaign goal, size, and audience.');
          return;
        }
        setLoading((prev) => ({ ...prev, [step]: true }));
        setTimeout(() => {
          setStep(3);
          setLoading((prev) => ({ ...prev, [step]: false }));
        }, 500);
      }
    } else if (step === 3) {
      if (selectedAssets.length === 0) {
        alert('Please select at least one asset.');
        return;
      }
      setLoading((prev) => ({ ...prev, 3: true, generate: true }));
      try {
        console.log('Banner Generation Payload:', {
          ...creativeData,
          assets: selectedAssets,
          timestamp: new Date().toISOString(),
        });
        const generatedBanners = generateBannerVariations();
        if (generatedBanners && generatedBanners.length > 0) {
          setTimeout(() => {
            setResult({ type: 'generated', assets: generatedBanners });
            setLoading((prev) => ({ ...prev, 3: false, generate: false }));
          }, 1000);
        } else {
          setLoading((prev) => ({ ...prev, 3: false, generate: false }));
          alert('Failed to generate banners. Please try again.');
        }
      } catch (error) {
        setLoading((prev) => ({ ...prev, 3: false, generate: false }));
        alert('Failed to generate banners. Please try again.');
      }
    }
  }, [step, creativeData, selectedAssets, generateBannerVariations, steps.length]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setLoading((prev) => ({ ...prev, [step]: true }));
      setTimeout(() => {
        setStep(step - 1);
        setResult(null);
        setLoading((prev) => ({ ...prev, [step]: false }));
      }, 1000);
    }
  }, [step]);

  const brandAssets = mockAssets.images;

  return (
    <div className="px-14">
      <div className="font-medium text-xl">Create Banner</div>

      {result ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Banners</div>
          <div className="border border-gray-200 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {result.assets?.map((asset) => (
                <div key={asset.id} className="relative border rounded-lg border-gray-200">
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    className="w-full h-auto rounded-lg"
                    style={{ aspectRatio: creativeData.size.replace('x', '/') }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
                    <p className="text-white text-sm">{creativeData.caption.slice(0, 50)}</p>
                    <p className="text-white text-sm">{creativeData.hashtags.join(' ').slice(0, 50)}</p>
                  </div>
                  <button
                    onClick={() => handleMenuToggle(asset.id)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    aria-label="Banner Options"
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
                        onClick={() => handleSchedule(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Schedule ${asset.alt}`}
                      >
                        Schedule
                      </button>
                    </div>
                  )}
                  {result && result.assetId === asset.id && (
                    <div className="mt-2 text-center">
                      {result.type === 'export' ? (
                        <p className="text-green-600 text-sm">Banner Exported! <a href={result.url} download className="text-blue-700 underline cursor-pointer">Download</a></p>
                      ) : (
                        <p className="text-green-600 text-sm">Banner Scheduled! Post ID: {result.postId}</p>
                      )}
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
          <div className="hidden lg:flex overflow-hidden sticky top-18 flex-col mt-10 w-[30%] h-[300px]">
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
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white cursor-pointer
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

          <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-2xl p-4 max-w-5xl max-h-[90vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="overflow-auto">
              {step === 1 && (
                <div className='flex flex-col gap-3'>
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">URL Import</h1>
                        <p className="text-gray-600 text-xs">Import your personal url details for your banner.</p>
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
                        <p className="text-gray-600 text-xs"> Enter details for your banner.</p>
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
                        placeholder="Enter a description for your banner (e.g., 'A vibrant banner for a product launch')"
                        value={creativeData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                        aria-label="Banner Description"
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
                    <div className='flex flex-row justify-between gap-4'>
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
                      <div className='flex flex-col justify-center flex-1'>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="px-2 py-1 bg-blue-700 text-white rounded flex items-center gap-2 cursor-pointer"
                            aria-label="Upload Logo"
                          >
                            <FolderOpen className="w-5 h-5" />
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
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Caption</label>
                        <div className="flex relative items-center gap-2">
                          <input
                            type="text"
                            placeholder="Your caption here!"
                            value={creativeData.caption}
                            onChange={(e) => handleFieldChange('caption', e.target.value)}
                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                            maxLength={280}
                            aria-label="Caption"
                          />
                        </div>
                        <span className="text-gray-500 absolute right-2 top-8 text-sm mt-1 block">{280 - (creativeData.caption?.length || 0)}</span>
                      </div>
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Hashtags</label>
                        <div className="flex relative items-center gap-2">
                          <input
                            type="text"
                            placeholder="Hashtags (e.g., #Banner #Brand)"
                            value={creativeData.hashtags.join(' ')}
                            onChange={(e) => handleFieldChange('hashtags', e.target.value.split(' ').filter(Boolean))}
                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                            aria-label="Hashtags"
                          />
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
                        <p className="text-gray-600 text-xs">Select size, campaign goals, and audience for your banner.</p>
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign Goal</label>
                      <div className="grid grid-cols-5 items-start gap-4">
                        {campaignGoalOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleCampaignGoalSelect(option.value)}
                            className={`cursor-pointer flex flex-row justify-center border rounded-lg gap-2 p-2 text-xs font-normal ${creativeData.campaignGoal === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={creativeData.campaignGoal === option.value}
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
                            <div className='text-xs'>{option.label}</div>
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
                        <p className="text-gray-600 text-xs">Select images to generate your banner.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="border border-gray-200 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Brand Assets</h3>
                      {brandAssets.length > 0 ? (
                        <div className="grid grid-cols-5 pb-3 gap-4">
                          {brandAssets.map((asset) => (
                            <div
                              key={asset.id}
                              onClick={() => handleAssetSelect(asset)}
                              className={`cursor-pointer relative border rounded-lg ${selectedAssets.some((item) => item.id === asset.id) ? 'border-blue-700' : 'border-gray-200'}`}
                              aria-label={`Select ${asset.alt}`}
                            >
                              <img
                                src={asset.src}
                                alt={asset.alt}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              {selectedAssets.some((item) => item.id === asset.id) && (
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
                      {selectedAssets.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h3>
                          <div className="grid grid-cols-4 gap-4">
                            {selectedAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="relative border rounded-lg border-blue-700"
                                aria-label={`Selected ${asset.alt}`}
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
                      <h3 className="text-md font-semibold text-gray-700">Select Images</h3>
                      <p className="text-gray-500 text-xs">Choose an image from your brand, library, or generate with magic media.</p>
                      <div className="flex gap-4">
                        <button
                          onClick={handleSearchImages}
                          className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3"
                          aria-label="Search Assets"
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
                        <h2 className="text-xl font-semibold">Search Assets</h2>
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
                          placeholder="Search for images (e.g., banner designs)..."
                          className="p-2 border border-gray-300 rounded-l w-1/3"
                          aria-label="Search Assets"
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
                    <div className="flex absolute bottom-4 left-0 right-0 px-5 border-t pt-5 border-t-gray-200 flex-row justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          id="imageUrlInput"
                          type="text"
                          placeholder="Paste image URL here..."
                          className="p-2 border border-gray-300 rounded"
                          aria-label="Asset URL"
                        />
                        <button
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
                          aria-label="Add Asset URL"
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
                          aria-label="Upload Asset"
                        >
                          <FileUp className="w-5 h-5" />
                          Upload Asset
                        </button>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleSelectMedia(result)}
                          className={`cursor-pointer pt-5 hover:opacity-80 relative ${selectedMedia.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                          aria-label={`Select ${result.alt}`}
                        >
                          {result.type === 'image' ? (
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                          ) : (
                            <video
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                              controls
                            />
                          )}
                          {selectedMedia.some((item) => item.id === result.id) && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="absolute right-0 left-0 flex bottom-4 border-t pt-5 border-t-gray-200 flex-row justify-between px-5 items-center">
                      <div className="flex items-center gap-2">
                        <input
                          id="imageUrlInput"
                          type="text"
                          placeholder="Paste image or video URL here..."
                          className="p-2 border border-gray-300 rounded"
                          aria-label="Asset URL"
                        />
                        <button
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
                          aria-label="Add Asset URL"
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
                      aspect={creativeData.size === '1500x600' ? 2.5 : creativeData.size === '1200x628' ? 1.91 : creativeData.size === '1600x400' ? 4 : 2.63}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop"
                        src={currentCropAsset?.src}
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
            <div className="flex justify-between p-3 rounded-lg">
              <button
                onClick={handleBack}
                className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                aria-label="Back"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white py-2 px-3 items-center text-sm font-medium"
                disabled={step === 1 ? (!creativeData.description || !creativeData.brandName || !creativeData.caption || !creativeData.primaryColor || !creativeData.secondaryColor || !creativeData.font) : step === 2 ? (!creativeData.campaignGoal || !creativeData.size || !creativeData.audience) : loading[3] || selectedAssets.length === 0}
                aria-label={step === 3 ? 'Generate Banner' : 'Continue'}
              >
                {loading[step] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  step === 3 ? 'Generate Banner' : 'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersCreativeWizard;
