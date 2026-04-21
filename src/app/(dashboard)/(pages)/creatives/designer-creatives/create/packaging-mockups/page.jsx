"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, Loader2, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';

// Reusable Components (make sure these exist in your project)
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

const PackagingMockupCreationPage = () => {
  const router = useRouter();
  const { activeBrand, sendUrl, fetchMyImages, myImages = [], deleteImage } = useAuth();

  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (msg) => setToast({ isOpen: true, message: msg });

  const [postData, setPostData] = useState({
    format: 'packaging-mockup',
    brandName: activeBrand?.name || '',
    projectName: '',
    tagline: '',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    campaignGoal: '',
    audience: '',
    fileFormat: 'PNG',
    resolution: '1000x1000',
    mockupType: '',
    description: '',
    caption: '',
    hashtags: '#PackagingDesign #Mockup #Branding',
  });

  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });

  // Cropper
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const cropperRef = useRef(null);
  const [crop, setCrop] = useState({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [activeTab, setActiveTab] = useState('Text to Image');

  // Recommended
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

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
    { value: 'Sales', label: 'Sales' },
    { value: 'Lead Generation', label: 'Lead Generation' },
    { value: 'Website Traffic', label: 'Website Traffic' },
  ];

  const audienceOptions = [
    { value: 'B2B', label: 'B2B (Professional)', description: 'Business owners, startups, agencies' },
    { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers, everyday users' },
    { value: 'Casual', label: 'Casual / Social-first', description: 'Broad social media audience' },
    { value: 'Educational', label: 'Educational / Informative', description: 'Students, researchers, learners' },
    { value: 'Professional', label: 'Professional / Industry-focused', description: 'Industry experts, professionals' },
  ];

  const handleAudienceSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, audience: value }));
  }, []);

  const handleCampaignGoalSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, campaignGoal: value }));
  }, []);

  const handleFileFormatChange = (e) => {
    setPostData((prev) => ({ ...prev, fileFormat: e.target.value }));
  };

  const handleResolutionChange = useCallback((e) => {
    setPostData(prev => ({ ...prev, resolution: e.target.value }));
  }, []);

  // Prefill from activeBrand
  useEffect(() => {
    if (activeBrand) {
      setPostData(prev => ({
        ...prev,
        brandName: activeBrand.name || '',
        projectName: activeBrand.name || '',
        tagline: activeBrand.tagline || prev.tagline,
        primaryColor: activeBrand.primary_color || '#000000',
        secondaryColor: activeBrand.secondary_color || '#0066cc',
        font: activeBrand.font || 'Arial',
      }));
      if (activeBrand.url) setBrandUrl(activeBrand.url);
    }
  }, [activeBrand]);

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError('Please enter a valid URL.');
    setLoading(prev => ({ ...prev, 1: true }));
    setError('');

    try {
      const res = await sendUrl(brandUrl);
      const data = res?.data;
      if (data) {
        const cleanName = (data.name || '').replace(/\s+/g, '');
        setPostData(prev => ({
          ...prev,
          brandName: data.name || prev.brandName,
          projectName: data.name || prev.projectName,
          tagline: data.tagline || prev.tagline,
          primaryColor: data.primary_color || prev.primaryColor,
          secondaryColor: data.secondary_color || prev.secondaryColor,
          font: data.font || prev.font,
          caption: prev.caption || `Beautiful packaging by ${data.name || 'your brand'} – ready to launch!`,
          hashtags: prev.hashtags > 0 ? prev.hashtags : ['#PackagingDesign', '#Mockup', '#Branding', `#${cleanName}`],
        }));
        showToast(`Brand "${data.name}" imported – caption & hashtags generated!`);
      }
    } catch (err) {
      setError('Failed to import brand. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, 1: false }));
    }
  };

  const handleFieldChange = (field, value) => {
    setPostData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setPostData(prev => ({ ...prev, description: randomPrompt }));
  };

    const finalizeCroppedImages = () => {
    const final = croppedImages
      .filter(Boolean)
      .map((file, i) => ({
        id: `final-${i}`,
        src: file.previewUrl,
        alt: 'Meme background',
      }));
    setPostData(prev => ({ ...prev, assets: final }));
  };

 const handleGenerate = () => {
    setLoading(prev => ({ ...prev, generate: true }));
    setTimeout(() => {
      const base = croppedImages.filter(Boolean).length > 0
        ? croppedImages.filter(Boolean)
        : recommendedImages.slice(0, 3);

      const variations = Array.from({ length: 20 }, (_, i) => ({
        id: `packages-${i + 1}`,
        src: base[i % base.length]?.previewUrl || base[i % base.length]?.src || '/placeholder.png',
        alt: `packages variation ${i + 1}`,
        rating: Math.floor(Math.random() * 40) + 60,
      }));

      setResult({ assets: variations });
      setLoading(prev => ({ ...prev, generate: false }));
    }, 2000);
  };

  const handleApplySelected = async () => {
    const sources = magicMediaModalOpen ? selectedMedia : selectedImages;
    if (sources.length === 0) return;

    // Separate images and videos
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

    // Handle IMAGES → must go through proxy + cropper
    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            let url = item.src || item.large || item;

            // Force ALL external images through your proxy (fixes CORS forever)
            const shouldProxy = typeof url === "string" && url.startsWith("http");
            const fetchUrl = shouldProxy
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;

            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`Failed to load image: ${url}`);

            const blob = await res.blob();

            // Create File with preview URL attached
            const file = new File([blob], `selected-image-${Date.now()}-${idx}`, {
              type: blob.type || "image/png",
            });
            file.previewUrl = URL.createObjectURL(blob); // Critical for preview & cropper

            return file;
          })
        );

        // Add preview URLs for cropper
        const previewUrls = processedFiles.map((f) => f.previewUrl);

        setImageSrc((prev) => [...prev, ...previewUrls]);
        setCroppedImages((prev) => [...prev, ...Array(previewUrls.length).fill(null)]);
        setCurrentCropIndex(imageSrc.length); // Start cropping from new batch

        setShowCropper(true);
        showToast(`Added ${images.length} image${images.length > 1 ? "s" : ""} — now crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded. Please try again.");
      }
    }

    // Handle VIDEOS → skip cropper entirely
    if (videos.length > 0) {
      const videoObjects = videos.map((video, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: video.videoSrc || video.src || video.large,
        thumbnail: video.thumbnail || video.image || video.src,
        type: "video",
        alt: video.alt || "Selected video",
        original: video,
      }));

      // Add videos directly to final list
      setCroppedImages((prev) => [...prev, ...videoObjects]);

      showToast(`Added ${videos.length} video${videos.length > 1 ? "s" : ""} — ready to generate!`);
    }

    // If only videos were selected → skip cropper and finalize immediately
    if (images.length === 0 && videos.length > 0) {
      finalizeCroppedImages();
      setShowCropper(false);
    }

    // Close all modals and reset selection
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
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
    }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then(r => r.blob()).then(blob => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      setCroppedImages(prev => {
        const u = [...prev];
        u[currentCropIndex] = file;
        return u;
      });

      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex(prev => prev + 1);
      } else {
        setShowCropper(false);
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

  // Fetch recommended images
  useEffect(() => {
    if (!postData.brandName || !postData.campaignGoal) return;
    const timer = setTimeout(async () => {
      setIsLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(`${postData.brandName} ${postData.campaignGoal} banner ad`)}&per_page=20}`);
        const data = await res.json();
        setRecommendedImages((data.photos || []).map(p => ({
          id: p.id,
          src: p.src.medium,
          large: p.src.large2x,
          alt: p.alt || 'Recommended flyer image',
        })));
      } catch (e) { console.error(e); }
      finally { setIsLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [postData.brandName, postData.campaignGoal]);

  const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
  };

  const steps = [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Goals & Formatting', icon: <Image className="h-5 w-5" /> },
    { id: 3, title: 'Image Upload', icon: <Download className="h-5 w-5" /> }
  ];

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

  return (
    <div className="px-14">
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={() => setToast({ isOpen: false })} duration={2500} />

      <div className="font-medium text-xl mb-6">Create Packaging Mockup</div>

      {result ? (
        <ResultsGrid
          title="Generated Packaging Mockups"
          assets={result.assets}
          selectedAssets={[]}
          onToggleSelection={() => { }}
          onBulkPost={() => { }}
          onBulkDownload={() => setResult(null)}
          onBack={() => setResult(null)}
          caption={postData.description}
          hashtags={['#PackagingDesign', '#Mockup', '#Branding']}
          size={postData.resolution}
        />
      ) : (
        <div className="flex flex-row gap-10 w-full">
          {/* Sidebar */}
          <div className="hidden lg:flex sticky top-20 flex-col mt-13 w-[30%] h-[300px]">
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
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
                    ${step === s.id ? 'border-blue-700 bg-blue-100 text-blue-700' : step > s.id ? 'bg-blue-700 border-blue-700 text-white' : 'border-gray-300 text-gray-300'}`}>
                    {loading[s.id] ? (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-700 border-t-transparent animate-spin"></div>
                    ) : step > s.id ? (
                      <CheckCircle2 size={20} className="text-white" />
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

          {/* Main Content */}
          <div className="flex flex-col w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4">

            {/* Step 1 - With Project Name */}
            {step === 1 && (
              <div className="flex flex-col gap-3">
                {/* URL Import - unchanged */}
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
                      />
                      <button
                        onClick={handleImportBrand}
                        disabled={loading[1] || !brandUrl}
                        className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm"
                      >
                        {loading[1] ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Import'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 border rounded-md border-gray-200 p-3">
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <div className="flex border border-gray-200 rounded-md py-2 px-2 gap-2">
                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                      <Image className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                      <p className="text-gray-600 text-xs">Enter details for your packaging mockup.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Brand Name</label>
                      <input
                        type="text"
                        value={postData.brandName}
                        onChange={(e) => handleFieldChange('brandName', e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Project Name</label>
                      <input
                        type="text"
                        value={postData.projectName}
                        onChange={(e) => handleFieldChange('projectName', e.target.value)}
                        placeholder="e.g. Summer Skincare Line"
                        className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Tagline</label>
                    <input
                      type="text"
                      value={postData.tagline}
                      onChange={(e) => handleFieldChange('tagline', e.target.value)}
                      placeholder="Enter tagline"
                      className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <textarea
                      placeholder="Enter a description for your packaging mockup..."
                      value={postData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                    />
                    <button
                      onClick={handleInspireMe}
                      className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                    >
                      Inspire Me
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Primary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={postData.primaryColor} onChange={(e) => handleFieldChange('primaryColor', e.target.value)} className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer" />
                        <input type="text" value={postData.primaryColor} onChange={(e) => handleFieldChange('primaryColor', e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-sm" placeholder="#000000" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Secondary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={postData.secondaryColor} onChange={(e) => handleFieldChange('secondaryColor', e.target.value)} className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer" />
                        <input type="text" value={postData.secondaryColor} onChange={(e) => handleFieldChange('secondaryColor', e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-sm" placeholder="#0066cc" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Font</label>
                    <select
                      value={postData.font}
                      onChange={(e) => handleFieldChange('font', e.target.value)}
                      className="w-full p-3 border bg-white border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer"
                    >
                      {fontOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Caption + Hashtags */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Caption</label>
                      <input
                        type="text"
                        placeholder="e.g. New packaging alert! Fresh, bold, and ready to stand out"
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
                        placeholder="#Packaging #Mockup #Design"
                        value={postData.hashtags}
                        onChange={(e) => handleFieldChange('hashtags', e.target.value)}
                        className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Step 2 - 100% UNCHANGED - paste your original Step 2 JSX here */}
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
                    <div className="grid grid-cols-5 gap-4">
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
                    <div className="grid grid-cols-4 gap-4">
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

            {/* Step 3 - Modernized */}
            {step === 3 && !loading.generate && (
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-3 rounded-full"><Download className="w-6 h-6 text-blue-700" /></div>
                    <div>
                      <h3 className="font-medium text-lg text-blue-700">Image Upload</h3>
                      <p className="text-xs text-gray-600">Select or upload images for your mockup.</p>
                    </div>
                  </div>
                  {(selectedImages.length > 0 || selectedMedia.length > 0) && (
                    <button onClick={handleApplySelected} className="px-5 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Apply ({magicMediaModalOpen ? selectedMedia.length : selectedImages.length})
                    </button>
                  )}
                </div>

                <BrandImagesSection
                  importedImages={activeBrand?.assets || []}
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

                            {/* Remove button */}
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

                            {/* Optional: Play icon overlay for videos */}
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

                <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center">
                  <div><FolderOpen className="w-10 h-10 text-gray-500" /></div>
                  <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                  <p className="text-gray-500 text-xs">Choose an image from your brand, library, or generate with Magic Media.</p>
                  <div className="flex gap-4">
                    <button onClick={() => setSearchModalOpen(true)} className="flex border hover:border-blue-700 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white gap-3">
                      <div className="text-sm font-medium">Search Images</div>
                      <FileSearch className="w-4 h-4 mt-0.5" />
                    </button>
                    <button onClick={() => setLibraryModalOpen(true)} className="flex border hover:border-blue-700 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white gap-3">
                      <div className="text-sm font-medium">Your Library</div>
                      <FolderOpen className="w-4 h-4 mt-0.5" />
                    </button>
                    <button onClick={() => setMagicMediaModalOpen(true)} className="flex border hover:border-blue-700 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white gap-3">
                      <div className="text-sm font-medium">Magic Media</div>
                      <Image className="w-4 h-4 mt-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between border-t pt-5 border-t-gray-200">
              <button
                onClick={() => step === 1 ? router.push('/creatives/designer-creatives') : setStep(step - 1)}
                className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={() => step === 3 ? handleGenerate() : setStep(step + 1)}
                className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 py-2 items-center text-sm font-medium disabled:bg-gray-400"
                disabled={loading[step] || loading.generate}
              >
                {loading[step] || loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  step === 3 ? 'Generate' : 'Continue'
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
        aspectRatio={1.91}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => { setShowCropper(false); setImageSrc([]); setCroppedImages([]); }}
      />

      <SearchMediaModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} selectedImages={selectedImages} onSelectImage={src => setSelectedImages(p => p.includes(src) ? p.filter(s => s !== src) : [...p, src])} onApply={handleApplySelected} />
      <LibraryMediaModal isOpen={libraryModalOpen} onClose={() => setLibraryModalOpen(false)} selectedImages={selectedImages} onSelectImage={src => setSelectedImages(p => p.includes(src) ? p.filter(s => s !== src) : [...p, src])} onApply={handleApplySelected} />
      <MagicMediaModal
        isOpen={magicMediaModalOpen}
        onClose={handleCancelSelection}
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

export default PackagingMockupCreationPage;