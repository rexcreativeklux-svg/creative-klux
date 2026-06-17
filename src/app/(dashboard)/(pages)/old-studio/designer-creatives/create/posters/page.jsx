"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, Film, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import MagicMediaModal from '@/app/(components)/MagicMediaModal';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';
import Toast from '@/app/(components)/Toast';
import ResultsGrid from '@/app/(components)/ResultsGrid';
import BrandImagesSection from '@/app/(components)/BrandImagesSection';
import RecommendedImagesSection from '@/app/(components)/RecommendedImagesSection';
import TextToImageTab from '../tabs/text-to-image/page';
import TextToAudioTab from '../tabs/text-to-audio/page';
import TextToVideoTab from '../tabs/text-to-video/page';
import ImageToVariationsTab from '../tabs/image-to-variations/page';
import ScriptToVoiceoverToVideoTab from '../tabs/script-to-voiceover/page';
import AudioToTextTab from '../tabs/audio-to-text/page';
import PersonaBasedGeneratorTab from '../tabs/persona-based-generator/page';

const PosterCreationPage = () => {
  const router = useRouter();
  const { activeBrand, sendUrl, fetchMyImages, myImages = [], deleteImage } = useAuth();

  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [importingBrand, setImportingBrand] = useState(false);
  const [importedBrand, setImportedBrand] = useState(null);

  const [postData, setPostData] = useState({
    format: 'posters',
    assets: [],
    brandName: '',
    projectName: '',
    logo: null,
    description: '',
    posterType: '',
    dimensions: { width: 816, height: 1056 },
    orientation: 'Portrait',
    fileFormat: 'PNG',
    size: '816x1056',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    campaignGoal: '',
    audience: '',
    caption: '',
    hashtags: [],
  });

  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });

  // Cropper
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const cropperRef = useRef(null);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [activeTab, setActiveTab] = useState('Text to Image');

  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (msg) => setToast({ isOpen: true, message: msg });

  const logoInputRef = useRef(null);

  // Recommended
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  // Prefill from activeBrand
  useEffect(() => {
    if (activeBrand) {
      setPostData(prev => ({
        ...prev,
        brandName: activeBrand.name || prev.brandName,
        projectName: activeBrand.name || prev.projectName,
        description: activeBrand.description || prev.description,
        primaryColor: activeBrand.primary_color || activeBrand.primaryColor || '#000000',
        secondaryColor: activeBrand.secondary_color || activeBrand.secondaryColor || '#0066cc',
        font: activeBrand.font || 'Arial',
        logo: activeBrand.logo || prev.logo,
        caption: prev.caption || `Check out ${activeBrand.name}!`,
        hashtags: prev.hashtags.length > 0 ? prev.hashtags : ['#Poster', '#Design', '#Brand'],
      }));
      if (activeBrand.url) setBrandUrl(activeBrand.url);
    }
  }, [activeBrand]);

  // Import brand from URL
  useEffect(() => {
    if (importedBrand) {
      setPostData(prev => ({
        ...prev,
        brandName: importedBrand.name || prev.brandName,
        description: importedBrand.description || prev.description,
        primaryColor: importedBrand.primary_color || importedBrand.primaryColor || prev.primaryColor,
        secondaryColor: importedBrand.secondary_color || importedBrand.secondaryColor || prev.secondaryColor,
        font: importedBrand.font || prev.font,
        logo: importedBrand.logo || prev.logo,
      }));
      setImportedBrand(null);
    }
  }, [importedBrand]);

  const inspirePrompts = [
    'A vibrant poster for a music festival',
    'A minimalist poster for a tech conference',
    'An elegant poster for an art exhibition',
    'A bold poster for a sports event',
    'A professional poster for a corporate seminar',
  ];

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Poppins', label: 'Poppins' },
  ];

  const orientationOptions = [
    {
      value: 'Portrait',
      svg: (
        <svg width="25" height="50" viewBox="0 0 25 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="5" width="20" height="40" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Portrait',
    },
    {
      value: 'Landscape',
      svg: (
        <svg width="50" height="25" viewBox="0 0 50 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="2.5" width="40" height="20" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Landscape',
    },
  ];

  const sizeOptions = [
    { value: '816x1056', label: 'Digital Letter (8.5 x 11 in, 96 DPI)', type: 'digital' },
    { value: '794x1123', label: 'Digital A3 (297 x 420 mm, 72 DPI)', type: 'digital' },
    { value: '5400x7200', label: 'Print Poster (18 x 24 in, 300 DPI)', type: 'print' },
    { value: '3508x4961', label: 'Print A3 (297 x 420 mm, 300 DPI)', type: 'print' },
    { value: '576x864', label: 'Digital Tabloid (6 x 9 in, 96 DPI)', type: 'digital' },
  ];

  const fileFormatOptions = [
    { value: 'PNG', label: 'PNG' },
    { value: 'PDF', label: 'PDF (Print-ready)' },
    { value: 'JPEG', label: 'JPEG' },
  ];

  const campaignGoalOptions = [
    { value: 'Brand Awareness', label: 'Brand Awareness' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Lead Generation', label: 'Lead Generation' },
    { value: 'Website Traffic', label: 'Website Traffic' },
  ];

  const audienceOptions = [
    { value: 'B2B', label: 'B2B (Professional)', description: 'Business owners, startups, agencies' },
    { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers, everyday users' },
    { value: 'Casual', label: 'Casual / Social-first', description: 'Broad social media audience' },
    { value: 'Inspirational', label: 'Inspirational / Motivational', description: 'Entrepreneurs, creators, startups' },
    { value: 'Sales', label: 'Direct / Sales-oriented', description: 'Hot leads, ad audiences' },
  ];

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    setLoading({ ...loading, 1: true });
    setError('');
    try {
      const res = await sendUrl(brandUrl);
      const imported = res?.data;
      if (!imported) throw new Error('No data');
      setImportedBrand(imported);
    } catch (err) {
      setError('Failed to import brand. Please try again.');
    } finally {
      setLoading({ ...loading, 1: false });
    }
  };

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;
      setError(null);
      setPostData((prev) => ({ ...prev, [field]: sanitizedValue }));
    } else {
      setPostData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      setError('Please upload a valid logo image (e.g., .jpg, .png, .webp)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPostData((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDescriptionChange = (e) => {
    setPostData((prev) => ({ ...prev, description: e.target.value }));
    setError('');
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setPostData((prev) => ({ ...prev, description: randomPrompt }));
  };

  const handleOrientationChange = (value) => {
    setPostData((prev) => ({ ...prev, orientation: value }));
  };

  const handleSizeChange = (value) => {
    const selectedSize = sizeOptions.find((option) => option.value === value);
    setPostData((prev) => ({
      ...prev,
      size: value,
      posterType: selectedSize.type,
      dimensions: {
        width: parseInt(value.split('x')[0]),
        height: parseInt(value.split('x')[1]),
      },
    }));
  };

  const handleFileFormatChange = (value) => {
    setPostData((prev) => ({ ...prev, fileFormat: value }));
  };

  const handleCampaignGoalSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, campaignGoal: value }));
    setError('');
  }, []);

  const handleAudienceSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, audience: value }));
    setError('');
  }, []);

  const finalizeCroppedImages = () => {
    const final = croppedImages.filter(Boolean).map((file, i) => ({
      id: `ref-${i}`,
      src: file.previewUrl,
      alt: 'Reference image',
    }));
  };

  const handleApplySelected = async () => {
    const sources = magicMediaModalOpen ? selectedMedia : selectedImages;
    if (sources.length === 0) return;

    const images = sources.filter(
      (item) =>
        !item.type ||
        item.type === "image" ||
        (typeof item.src === "string" && !item.src.includes(".mp4") && !item.videoSrc)
    );

    const videos = sources.filter(
      (item) =>
        item.type === "video" ||
        item.videoSrc ||
        (typeof item.src === "string" && item.src.includes(".mp4"))
    );

    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            let url = item.src || item.large || item;
            const shouldProxy = typeof url === "string" && url.startsWith("http");
            const fetchUrl = shouldProxy
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;

            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`Failed to load image: ${url}`);

            const blob = await res.blob();
            const file = new File([blob], `selected-image-${Date.now()}-${idx}`, {
              type: blob.type || "image/png",
            });
            file.previewUrl = URL.createObjectURL(blob);
            return file;
          })
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);
        setImageSrc((prev) => [...prev, ...previewUrls]);
        setCroppedImages((prev) => [...prev, ...Array(previewUrls.length).fill(null)]);
        setCurrentCropIndex(imageSrc.length);
        setShowCropper(true);
        showToast(`Added ${images.length} image${images.length > 1 ? "s" : ""} — now crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded. Please try again.");
      }
    }

    if (videos.length > 0) {
      const videoObjects = videos.map((video, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: video.videoSrc || video.src || video.large,
        thumbnail: video.thumbnail || video.image || video.src,
        type: "video",
        alt: video.alt || "Selected video",
        original: video,
      }));

      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${videos.length} video${videos.length > 1 ? "s" : ""} — ready to generate!`);
    }

    if (images.length === 0 && videos.length > 0) {
      finalizeCroppedImages();
      setShowCropper(false);
    }

    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
  };

  const handleGenerate = () => {
    if (!postData.description || !postData.brandName || croppedImages.filter(Boolean).length === 0) {
      setError('Please provide a brand name, description, and select at least one image.');
      return;
    }
    setLoading(prev => ({ ...prev, generate: true }));
    setTimeout(() => {
      const base = croppedImages.filter(Boolean).length > 0
        ? croppedImages.filter(Boolean)
        : recommendedImages.slice(0, 3);

      const variations = Array.from({ length: 20 }, (_, i) => ({
        id: `Poster-${i + 1}`,
        src: base[i % base.length]?.previewUrl || base[i % base.length]?.src || '/placeholder.png',
        alt: `Poster variation ${i + 1}`,
        rating: Math.floor(Math.random() * 40) + 60,
      }));

      setResult({ assets: variations });
      setLoading(prev => ({ ...prev, generate: false }));
    }, 2000);
  };

  const toggleAssetSelection = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0,
      completedCrop.width, completedCrop.height);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `cropped-${currentCropIndex}.png`, { type: 'image/png' });
    file.previewUrl = URL.createObjectURL(blob);

    setCroppedImages(prev => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex(prev => prev + 1);
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
      finalizeCroppedImages();
    }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then(r => r.blob()).then(blob => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      setCroppedImages(prev => { const u = [...prev]; u[currentCropIndex] = file; return u; });

      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex(prev => prev + 1);
        setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      } else {
        setShowCropper(false);
        finalizeCroppedImages();
      }
    });
  };

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
  };

  const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
  };

  // Fetch recommended images
  useEffect(() => {
    if (!postData.brandName || !postData.campaignGoal) return;
    const timer = setTimeout(async () => {
      setIsLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(`${postData.brandName} ${postData.campaignGoal} poster`)}&per_page=20`);
        const data = await res.json();
        setRecommendedImages((data.photos || []).map(p => ({
          id: p.id,
          src: p.src.medium,
          large: p.src.large2x,
          alt: p.alt || 'Recommended poster image',
        })));
      } catch (e) { console.error(e); }
      finally { setIsLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [postData.brandName, postData.campaignGoal]);

  const renderTabContent = () => {
    const tabs = {
      'Text to Image': <TextToImageTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Text to Audio': <TextToAudioTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Text to Video': <TextToVideoTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Image to Variations': <ImageToVariationsTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Script to Voiceover to Video': <ScriptToVoiceoverToVideoTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Audio to Text': <AudioToTextTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Persona-based Generator': <PersonaBasedGeneratorTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
    };
    return tabs[activeTab] || <div>Select a tab</div>;
  };

  const handleContinue = () => {
    if (step === 1 && (!postData.description || !postData.brandName || !postData.primaryColor || !postData.font)) {
      setError('Please provide a brand name, description, primary color, and font.');
      return;
    }
    if (step === 2 && (!postData.campaignGoal || !postData.audience || !postData.fileFormat || !postData.size || !postData.orientation)) {
      setError('Please select a campaign goal, audience, file format, size, and orientation.');
      return;
    }
    if (step === 3 && croppedImages.filter(Boolean).length === 0) {
      setError('Please select or upload at least one image.');
      return;
    }
    if (step < steps.length) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step + 1);
        setLoading({ ...loading, [step]: false });
      }, 1000);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else if (step > 1) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step - 1);
        setLoading({ ...loading, [step]: false });
      }, 1000);
    } else {
      router.push('/creatives/designer-creatives');
    }
  };

  const steps = [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Goals & Formatting', icon: <Download className="h-5 w-5" /> },
    { id: 3, title: 'Image Upload', icon: <FileUp className="h-5 w-5" /> },
  ];

  return (
    <div className="px-14">
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={() => setToast({ isOpen: false })} duration={2500} />

      <div className="font-medium text-xl mb-6">Create Poster</div>

      {result ? (
        <ResultsGrid
          title="Generated Posters"
          assets={result.assets}
          selectedAssets={selectedAssets}
          onToggleSelection={toggleAssetSelection}
          onBulkPost={() => { }}
          onBulkDownload={() => setSelectedAssets([])}
          onBack={() => setResult(null)}
          caption={postData.caption}
          hashtags={postData.hashtags}
          size={postData.size}
        />
      ) : (
        <div className="flex flex-row gap-10 w-full">
          {/* Sidebar */}
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
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-surface
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
                <span className={`ml-3 text-sm font-medium ${step === s.id ? 'text-blue-700' : 'text-gray-900'}`}>
                  <div className="text-gray-500 text-xs">Step {s.id}</div>
                  <div className="font-medium">{s.title}</div>
                </span>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-surface rounded-2xl p-4">
            <div className="overflow-auto">


              {/* Step 1: Brand Details */}
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">URL Import</h1>
                        <p className="text-gray-600 text-xs">Import your brand details for poster creation.</p>
                      </div>
                    </div>
                    <div className="py-3 border border-gray-200 rounded-md px-2 w-full flex-row gap-2">
                      <div className="flex flex-row gap-2">
                        <input
                          type="url"
                          value={brandUrl}
                          onChange={(e) => setBrandUrl(e.target.value)}
                          placeholder="https://yourdomain.com/"
                          className="flex-1 p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        />
                        <button
                          onClick={handleImportBrand}
                          disabled={loading[1] || !brandUrl}
                          className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm disabled:opacity-50"
                        >
                          {loading[1] ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Import'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm space-y-4 rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Poster Details</h1>
                        <p className="text-gray-600 text-xs">Enter details for your poster.</p>
                      </div>
                    </div>

                    {/* Brand Name + Project Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Project Name</label>
                        <input
                          type="text"
                          value={postData.projectName}
                          onChange={(e) => handleFieldChange('projectName', e.target.value)}
                          placeholder="e.g. Summer Event 2025"
                          className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Project Name"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        placeholder="Enter a description for your poster (e.g., 'A vibrant poster for a music festival')"
                        value={postData.description}
                        onChange={handleDescriptionChange}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                        aria-label="Poster Description"
                      />
                      <button
                        onClick={handleInspireMe}
                        className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-surface cursor-pointer transition duration-300 text-sm"
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
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Font</label>
                        <select
                          value={postData.font}
                          onChange={(e) => handleFieldChange('font', e.target.value)}
                          className="w-full p-3 border bg-surface border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer"
                          aria-label="Font"
                        >
                          {fontOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="px-2 py-1 border text-gray-500 hover:text-blue-700 border-gray-200 hover:border-blue-700 rounded flex items-center gap-2 cursor-pointer"
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
                          {postData.logo && (
                            <img
                              src={postData.logo}
                              alt="Brand Logo"
                              className="w-10 h-10 object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Caption + Hashtags — ADD THIS BLOCK */}
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Caption</label>
                        <input
                          type="text"
                          placeholder="Your caption here!"
                          value={postData.caption}
                          onChange={(e) => handleFieldChange('caption', e.target.value)}
                          className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                          maxLength={280}
                        />
                        <span className="text-gray-500 absolute right-2 top-10 text-sm">
                          {280 - (postData.caption?.length || 0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Hashtags</label>
                        <input
                          type="text"
                          placeholder="#Poster #Event #Design"
                          value={postData.hashtags.join(' ')}
                          onChange={(e) => handleFieldChange('hashtags', e.target.value.split(' ').filter(Boolean))}
                          className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Goals & Formatting */}
              {step === 2 && (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                    <div className="flex justify-center gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Download className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Goals & Formatting</h1>
                        <p className="text-gray-600 text-xs">Select campaign goals, audience, file format, size, and orientation.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign Goal</label>
                      <div className="grid grid-cols-5 items-start gap-4">
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
                            <div className="text-xs">{option.label}</div>
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
                            onClick={() => handleFileFormatChange(option.value)}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={postData.fileFormat === option.value}
                                onChange={() => handleFileFormatChange(option.value)}
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Size</label>
                      <div className="grid grid-cols-3 gap-4">
                        {sizeOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleSizeChange(option.value)}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.size === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={postData.size === option.value}
                                onChange={() => handleSizeChange(option.value)}
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Orientation</label>
                      <div className="grid grid-cols-2 gap-4">
                        {orientationOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleOrientationChange(option.value)}
                            className={`cursor-pointer flex flex-col items-center border rounded-lg p-2 text-center text-xs ${postData.orientation === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <input
                                type="checkbox"
                                checked={postData.orientation === option.value}
                                onChange={() => handleOrientationChange(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            {option.svg}
                            <div className="text-xs text-gray-700 mt-1">{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Image Upload */}
              {step === 3 && !loading.generate && (
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-3 rounded-full"><Image className="w-6 h-6 text-blue-700" /></div>
                      <div>
                        <h3 className="font-medium text-lg text-blue-700">Choose Background Image</h3>
                        <p className="text-xs text-gray-600">Select or generate a background image</p>
                      </div>
                    </div>
                    {(selectedImages.length > 0 || selectedMedia.length > 0) && (
                      <button onClick={handleApplySelected}
                        className="px-5 cursor-pointer py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Apply ({magicMediaModalOpen ? selectedMedia.length : selectedImages.length})
                      </button>
                    )}
                  </div>

                  {/* Brand & Recommended Images */}
                  <BrandImagesSection
                    importedImages={postData.importedImages}
                    myImages={myImages}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    showToast={showToast}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    deleteImage={deleteImage}
                    fetchMyImages={fetchMyImages}
                  />

                  <RecommendedImagesSection
                    brandName={postData.brandName}
                    recommendedImages={recommendedImages}
                    isLoadingRecommended={isLoadingRecommended}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    showToast={showToast}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                  />

                  {/* Selected Preview */}
                  {croppedImages.filter(Boolean).length > 0 && (
                    <div className="my-6">
                      <h3 className="text-sm font-medium mb-3">
                        Selected Media ({croppedImages.filter(Boolean).length}/5)
                      </h3>
                      <div className="columns-3 sm:columns-4 md:columns-5 gap-4 space-y-4">
                        {croppedImages.filter(Boolean).map((item, i) => {
                          const isVideo = item.type === 'video' || item.videoSrc || (item.previewUrl && item.previewUrl.includes('.mp4'));

                          return (
                            <div key={i} className="relative group h-auto rounded-lg border-2 border-blue-700">
                              {isVideo ? (
                                <video
                                  src={item.previewUrl}
                                  poster={item.thumbnail}
                                  className="w-full h-auto object-cover"
                                  muted
                                  loop
                                  playsInline
                                  preload="metadata"
                                  onMouseEnter={(e) => e.currentTarget.play().catch(() => { })}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                  }}
                                />
                              ) : (
                                <img
                                  src={item.previewUrl}
                                  alt="selected"
                                  className="w-full h-auto object-cover"
                                />
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCroppedImages(prev => prev.filter((_, idx) => idx !== i));
                                  if (i <= currentCropIndex && currentCropIndex > 0) {
                                    setCurrentCropIndex(prev => prev - 1);
                                  }
                                }}
                                className="absolute top-2 cursor-pointer right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg z-10"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>

                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black/60 rounded-full p-3">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload Buttons */}
                  <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center">
                    <div><FolderOpen className="w-10 h-10 text-gray-500" /></div>
                    <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                    <p className="text-gray-500 text-xs">Choose an image from your brand, your library, or generate with magic media</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSearchModalOpen(true)}
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3"
                        aria-label="Search Images"
                      >
                        <div className="text-sm font-medium">Search Images</div>
                        <div className="mt-0.5"><FileSearch className="w-4 h-4" /></div>
                      </button>
                      <button
                        onClick={() => setLibraryModalOpen(true)}
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3"
                        aria-label="Your Library"
                      >
                        <div className="text-sm font-medium">Your Library</div>
                        <div className="mt-0.5"><FolderOpen className="w-4 h-4" /></div>
                      </button>
                      <button
                        onClick={() => setMagicMediaModalOpen(true)}
                        className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3"
                        aria-label="Magic Media"
                      >
                        <div className="text-sm font-medium">Magic Media</div>
                        <div className="mt-0.5"><Film className="w-4 h-4" /></div>
                      </button>
                    </div>
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
                className="bg-blue-700 cursor-pointer text-white px-4 py-2 rounded-md hover:bg-blue-800 transition duration-300 text-sm font-medium flex items-center gap-2"
                disabled={loading[step] || loading.generate}
                aria-label={step === steps.length ? 'Generate Posters' : 'Continue'}
              >
                {loading[step] || loading.generate ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === steps.length ? (
                  'Generate Posters'
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Modals */}
      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={postData.dimensions.width / postData.dimensions.height}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => { setShowCropper(false); setImageSrc([]); setCroppedImages([]); }}
      />

      <SearchMediaModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) => setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])}
        onApply={handleApplySelected}
      />

      <LibraryMediaModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) => setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])}
        onApply={handleApplySelected}
      />

      <MagicMediaModal
        isOpen={magicMediaModalOpen}
        onClose={() => { setMagicMediaModalOpen(false); setSelectedMedia([]); }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedMedia={selectedMedia}
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      >
        {renderTabContent()}
      </MagicMediaModal>

      {loading.generate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
            <FloatingAnimation showProgressBar={true}>
              <FloatingElements.ImageFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterCreationPage;