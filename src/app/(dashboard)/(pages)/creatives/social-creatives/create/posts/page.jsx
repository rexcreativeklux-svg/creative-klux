"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, MoreVertical, Send, Calendar, Loader2, ImagePlus, Images, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import MagicMediaModal from '@/app/(components)/MagicMediaModal';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';
import Toast from '@/app/(components)/Toast';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';
import SocialIntegrationModal from '@/app/(components)/SocialIntegrationModal';
import BrandImagesSection from '@/app/(components)/BrandImagesSection';
import RecommendedImagesSection from '@/app/(components)/RecommendedImagesSection';
import ResultsGrid from '@/app/(components)/ResultsGrid';

const PostsCreativeWizard = () => {
  const { activeBrand, sendUrl, myImages = [], myImagesLoading, fetchMyImages, deleteImage } = useAuth();

  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState('');
  const [importingBrand, setImportingBrand] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [processedAssets, setProcessedAssets] = useState({});
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);

  const [postData, setPostData] = useState({
    format: 'posts',
    assets: [],
    brandName: '',
    projectName: "",
    description: '',
    caption: '',
    hashtags: [],
    size: '',
    campaignGoal: '',
    fileFormat: 'PNG',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    logo: null,
    audience: '',
  });

  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });
  const [imageSrc, setImageSrc] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
    const [importedBrand, setImportedBrand] = useState(null);

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Text to Image');

  // Cropper
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropAsset, setCurrentCropAsset] = useState(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [completedCrop, setCompletedCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const cropperRef = useRef(null);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [croppedImages, setCroppedImages] = useState([]);

  // Recommended images from Pexels
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (msg) => setToast({ isOpen: true, message: msg });
  const closeToast = () => setToast({ isOpen: false, message: "" });

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

  const sizeOptions = [
    { key: "1200x627", value: "1200x627", label: "LinkedIn horizontal", description: "1200x627" },
    { key: "627", value: "627", label: "LinkedIn square", description: "1200x627" },
    { key: "1200x628", value: "1200x628", label: "Google Landscape", description: "1200x628" },
    { key: "1200x1200", value: "1200x1200", label: "Google Square", description: "1200x1200" },
    { key: "9:16", value: "9:16", label: "Tiktok Vertical", description: "9:16" },
    { key: "1:1", value: "1:1", label: "Meta(Facebook & Instagram) square", description: "1:1" },
    { key: "4:5", value: "4:5", label: "Meta(Facebook & Instagram) vertical", description: "4:5" },
    { key: "9:16 ", value: "9:16 ", label: "Meta(Facebook & Instagram) for Stories/Reels", description: "9:16 " },
  ];

  const audienceOptions = [
    { value: 'B2B', label: 'B2B (Professional)', description: 'Business owners, startups, agencies' },
    { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers, everyday users' },
    { value: 'Casual', label: 'Casual / Social-first', description: 'Broad social media audience' },
    { value: 'Inspirational', label: 'Inspirational / Motivational', description: 'Entrepreneurs, creators, startups' },
    { value: 'Sales', label: 'Direct / Sales-oriented', description: 'Hot leads, ad audiences' },
  ];

  const campaignGoalOptions = [
    { value: 'Brand Awareness', label: 'Brand Awareness' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Lead Generation', label: 'Lead Generation' },
    { value: 'Website Traffic', label: 'Website Traffic' },
  ];

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
  ];

  const fileFormatOptions = [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'AVIF', label: 'AVIF' },
    { value: 'WEBP', label: 'WEBP' },
  ];

  const handleDescriptionChange = (e) => {
    setPostData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setPostData(prev => ({ ...prev, description: randomPrompt }));
  };

  const handleSizeSelect = (value) => {
    setPostData(prev => ({ ...prev, size: value }));
  };

  const handleCampaignGoalSelect = (value) => {
    setPostData(prev => ({ ...prev, campaignGoal: value }));
  };

  const handleAudienceSelect = (value) => {
    setPostData(prev => ({ ...prev, audience: value }));
  };

 

  // Import brand from URL
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError('Please enter a valid URL.');
    setImportingBrand(true);
    setError('');
    try {
      const res = await sendUrl(brandUrl);
      const imported = res?.data;
      if (!imported) throw new Error('No data');

      setPostData(prev => ({
        ...prev,
        brandName: imported.name || prev.brandName,
        description: imported.description || prev.description,
        primaryColor: imported.primary_color || imported.primaryColor || '#000000',
        secondaryColor: imported.secondary_color || imported.secondaryColor || '#0066cc',
        font: imported.font || 'Arial',
        logo: imported.logo || prev.logo,
      }));
      showToast('Brand imported successfully!');
    } catch (err) {
      setError('Failed to import brand. Please try again.');
    } finally {
      setImportingBrand(false);
    }
  };

   // Prefill from activeBrand
  useEffect(() => {
    if (!activeBrand) return;

    setPostData(prev => ({
      ...prev,
      brandName: activeBrand.name || prev.brandName,
      projectName: activeBrand.name || prev.projectName,
      description: activeBrand.description || prev.description,
      primaryColor: activeBrand.primary_color || activeBrand.primaryColor || '#000000',
      secondaryColor: activeBrand.secondary_color || activeBrand.secondaryColor || '#0066cc',
      font: activeBrand.font || 'Arial',
      logo: activeBrand.logo || prev.logo,
      caption: prev.caption || `Discover ${activeBrand.name}!`,
      hashtags: prev.hashtags.length > 0 ? prev.hashtags : ['#SocialMedia', '#Brand'],
    }));

    if (activeBrand.url) setBrandUrl(activeBrand.url);
  }, [activeBrand]);

  // Fetch recommended images from Pexels
  useEffect(() => {
    if (!postData.brandName || !postData.campaignGoal) return;

    const timer = setTimeout(async () => {
      setIsLoadingRecommended(true);
      try {
        const query = `${postData.brandName} ${postData.campaignGoal} social media`;
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=20`);
        const data = await res.json();
        const images = (data.photos || []).map(p => ({
          id: p.id,
          src: p.src.medium,
          large: p.src.large2x,
          alt: p.alt || `Recommended image`,
        }));
        setRecommendedImages(images);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingRecommended(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [postData.brandName, postData.campaignGoal]);

  const handleFieldChange = (field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const sanitized = value.startsWith('#') ? value : `#${value}`;
      setPostData(prev => ({ ...prev, [field]: sanitized }));
    } else {
      setPostData(prev => ({ ...prev, [field]: value }));
    }
    setError('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPostData(prev => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
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

  const toggleAssetSelection = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openSocialModal = (type, assets) => {
    setActionType(type);
    setCurrentAssets(assets);
    setIsSocialModalOpen(true);
  };

  // After cropper finishes (in saveCroppedImage and handleSkipCrop), sync to postData.assets
  const finalizeCroppedImages = () => {
    const finalImages = croppedImages
      .filter(Boolean)
      .map((file, i) => ({
        id: `final-${i}`,
        src: file.previewUrl,
        alt: 'User selected image',
      }));

    // THIS IS THE KEY LINE — sync cropped images to postData.assets
    setPostData(prev => ({ ...prev, assets: finalImages }));
  };

  const handleGenerate = () => {
    setLoading(prev => ({ ...prev, generate: true }));
    setTimeout(() => {
      // Use croppedImages (real user selection) → fallback to recommended → never random
      const base = croppedImages.filter(Boolean);
      const fallback = recommendedImages.length > 0 ? recommendedImages : [{ src: '/placeholder.png' }];

      const baseImages = base.length > 0
        ? base.map(f => ({ src: f.previewUrl }))
        : fallback;

      const variations = Array.from({ length: 20 }, (_, i) => ({
        id: `gen-${i + 1}`,
        src: baseImages[i % baseImages.length].src,
        alt: `Generated post ${i + 1}`,
        rating: Math.floor(Math.random() * 60) + 40,
      }));

      setResult({ assets: variations });
      setLoading(prev => ({ ...prev, generate: false }));
    }, 2500);
  };

  // Pexels recommendations
  useEffect(() => {
    if (!postData.brandName || !postData.campaignGoal) return;
    const timer = setTimeout(async () => {
      setIsLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(`${postData.brandName} ${postData.campaignGoal} social media`)}&per_page=20`);
        const data = await res.json();
        setRecommendedImages((data.photos || []).map(p => ({
          id: p.id,
          src: p.src.medium,
          large: p.src.large2x,
          alt: p.alt || 'Recommended',
        })));
      } catch (e) { console.error(e); }
      finally { setIsLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [postData.brandName, postData.campaignGoal]);

  // File upload → trigger cropper
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const urls = files.map(f => URL.createObjectURL(f));
    setImageSrc(prev => [...prev, ...urls]);
    setCroppedImages(prev => [...prev, ...Array(urls.length).fill(null)]);
    setCurrentCropIndex(imageSrc.length);
    setShowCropper(true);
  };

  const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
  };

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
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
      finalizeCroppedImages(); // Sync when done
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
        finalizeCroppedImages(); // Sync when done
      }
    });
  };

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


  const steps = [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Size, Goals & Audience', icon: <Image className="h-5 w-5" /> },
    { id: 3, title: 'Image', icon: <Download className="h-5 w-5" /> },
  ];

  return (
    <div className="px-14">
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={() => setToast({ isOpen: false, message: "" })} duration={2000} />

      <div className="font-medium text-xl">Create Social Media Post</div>

      {result ? (
        <ResultsGrid
          title="Generated Posts"
          assets={result.assets}
          selectedAssets={selectedAssets}
          onToggleSelection={toggleAssetSelection}
          onBulkPost={() => openSocialModal('post', selectedAssets.map(id => result.assets.find(a => a.id === id)).filter(Boolean))}
          onBulkSchedule={() => openSocialModal('schedule', selectedAssets.map(id => result.assets.find(a => a.id === id)).filter(Boolean))}
          onBulkDownload={() => setSelectedAssets([])}
          onBack={() => {
            setResult(null);
            setSelectedAssets([]);
          }}
          caption={postData.caption}
          hashtags={postData.hashtags}
          size={postData.size}
        />
      ) : (
        <div className="flex flex-row gap-10 w-full">
          <div className="hidden lg:flex sticky top-18 flex-col mt-10 w-[30%] h-[300px]">
            <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
            <motion.div initial={{ height: 0 }} animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }} className="absolute top-0 left-4.5 w-1 bg-blue-700 rounded-full" />
            {steps.map(s => (
              <div key={s.id} className="relative z-10 flex items-center h-full mb-10">
                <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step >= s.id ? 'border-blue-700 bg-blue-100 text-blue-700' : 'border-gray-300 text-gray-300'}`}>
                  {step > s.id ? <CheckCircle2 size={20} /> : s.icon}
                </div>
                <span className={`ml-3 text-sm font-medium ${step === s.id ? 'text-blue-700' : 'text-black'}`}>
                  <div className="text-gray-500 text-xs">Step {s.id}</div>
                  <div className="font-medium">{s.title}</div>
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col w-full mt-3 justify-between gap-6 bg-white rounded-2xl p-4">
            {/* Step 1: Brand Details */}
            {step === 1 && (
              <div className='flex flex-col gap-3'>
                <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                  <div className="flex gap-2">
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">URL</h1>
                      <p className="text-gray-600 text-xs">Import your personal url and kickstart your creatives campaign.</p>
                    </div>
                  </div>
                  <div className="py-3 border border-gray-200 rounded-md px-2 w-full flex-row gap-2">
                    <div className="flex flex-row gap-2">
                      <input
                        type="url"
                        value={brandUrl}
                        onChange={(e) => setBrandUrl(e.target.value)}
                        placeholder="https://yourdomain.com/"
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
                      <ImagePlus className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                      <p className="text-gray-600 text-xs"> Enter details for your post.</p>
                    </div>
                  </div>
                  <div className='flex flex-row justify-between gap-4'>
                    <div className='w-full'>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Brand Name</label>
                      <input
                        type="text"
                        value={postData.brandName}
                        onChange={(e) => handleFieldChange('brandName', e.target.value)}
                        placeholder="Your Brand Name"
                        className="w-full p-3 border bg-white border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        aria-label="Brand Name"
                      />
                    </div>
                    <div className='w-full'>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Project Name</label>
                      <input
                        type="text"
                        value={postData.projectName}
                        onChange={(e) => handleFieldChange('projectName', e.target.value)}
                        placeholder="Your Project Name"
                        className="w-full p-3 border bg-white border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        aria-label="Project Name"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <textarea
                      placeholder="Enter a description for your post (e.g., 'A vibrant Instagram post for a new product launch')"
                      value={postData.description}
                      onChange={handleDescriptionChange}
                      className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                      aria-label="Post Description"
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
                  <div className='flex flex-row justify-between gap-4'>
                    <div className="flex-1">
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
                    <div className='flex flex-col justify-center flex-1'>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="px-2 py-1 border text-gray-500 hover:text-blue-700 transition duration-300 ease-in-out font-medium border-gray-200 hover:border-blue-700 rounded flex items-center gap-2 cursor-pointer"
                          aria-label="Upload Logo"
                        >
                          <FileUp className="w-5 h-5 text-blue-700" />
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
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Caption</label>
                      <div className="flex relative items-center gap-2">
                        <input
                          type="text"
                          placeholder="Your caption here!"
                          value={postData.caption}
                          onChange={(e) => handleFieldChange('caption', e.target.value)}
                          className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                          maxLength={280}
                          aria-label="Caption"
                        />
                      </div>
                      <span className="text-gray-500 absolute right-2 top-8 text-sm mt-1 block">{280 - (postData.caption?.length || 0)}</span>
                    </div>
                    <div className="flex-1 relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Hashtags</label>
                      <div className="flex relative items-center gap-2">
                        <input
                          type="text"
                          placeholder="Hashtags (e.g., #SocialMedia #Brand)"
                          value={postData.hashtags.join(' ')}
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
                      <p className="text-gray-600 text-xs">Select size, campaign goals, and audience.</p>
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
                          className={`cursor-pointer border rounded-lg p-2 text-center text-xs ${postData.size === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                          aria-label={`Select ${option.label}`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <input
                              type="checkbox"
                              checked={postData.size === option.value}
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
                          <div className='flex w-full'>
                            {option.label}
                          </div>
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
                    <div className="grid grid-cols-4 gap-4">
                      {fileFormatOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => handleFieldChange('fileFormat', option.value)}
                          className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                          aria-label={`Select ${option.label}`}
                        >
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={postData.fileFormat === option.value}
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

            {step === 3 && (
              <div className='border border-gray-200 p-2 rounded-lg'>
                <div className='flex border-b border-b-gray-200 pb-2 mb-6 items-center gap-3'>
                  <div className='bg-gray-100 p-3 rounded-full'><Images className='w-6 h-6 text-blue-700' /></div>
                  <div>
                    <h1 className='font-medium text-lg text-blue-700'>Choose Background Image</h1>
                    <p className='text-xs text-gray-600'>Select or generate images</p>
                  </div>
                  {(selectedImages.length > 0 || selectedMedia.length > 0) && (
                    <button onClick={handleApplySelected}
                      className="ml-auto px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded-md flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Apply ({magicMediaModalOpen ? selectedMedia.length : selectedImages.length})
                    </button>
                  )}
                </div>

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


                {/* Selected Media Preview — Images + Videos */}
               <div>
                    {croppedImages.length > 0 && (
                      <h1 className='py-2 text-sm font-semibold'>Selected media</h1>
                    )}

                    {croppedImages.length > 0 && (
                      <div className="grid grid-cols-5 gap-4 mb-10">
                        {croppedImages.map((item, index) => {
                          // Extract preview URL safely
                          const url = item?.previewUrl ||
                            (item instanceof File || item instanceof Blob)
                            ? URL.createObjectURL(item)
                            : null;

                          // Check if this item is a video (from Text-to-Video tab)
                          const isVideo = item?.videoSrc || (item?.type?.includes('video'));

                          return (
                            <div key={index} className="relative group">
                              {url ? (
                                isVideo ? (
                                  // Show video preview with thumbnail
                                  <video
                                    src={item.videoSrc || url}
                                    poster={item.thumbnail}
                                    className="w-full h-auto object-cover rounded-lg border border-gray-200 shadow"
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    onMouseEnter={(e) => e.target.play().catch(() => { })}
                                    onMouseLeave={(e) => {
                                      e.target.pause();
                                      e.target.currentTime = 0;
                                    }}
                                  />
                                ) : (
                                  // Regular image
                                  <img
                                    src={url}
                                    alt={`Selected ${index + 1}`}
                                    className="w-full h-auto object-cover rounded-lg border border-gray-200 shadow"
                                  />
                                )
                              ) : (
                                <div className="w-full h-32 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-gray-500">No media</span>
                                </div>
                              )}

                              {/* Remove button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCroppedImages(prev => prev.filter((_, i) => i !== index));
                                  if (index <= currentCropIndex && currentCropIndex > 0) {
                                    setCurrentCropIndex(prev => prev - 1);
                                  }
                                }}
                                className="absolute top-2 cursor-pointer right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                {/* YOUR EXACT UPLOAD SECTION — UNCHANGED */}
                <div className='flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center'>
                  <div><FileUp className="w-10 h-10 text-gray-500" /></div>
                  <h3 className='text-md font-semibold text-gray-700'>Upload Media</h3>
                  <p className='text-gray-500 text-xs'>Choose images from your brand, library, or generate with Magic Media.</p>
                  <div className='flex gap-4'>
                    <button onClick={() => setSearchModalOpen(true)} className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'>
                      <div className='text-sm font-medium'>Search Media</div>
                      <div className='mt-0.5'><FileSearch className='w-4 h-4' /></div>
                    </button>
                    <button onClick={() => setLibraryModalOpen(true)} className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'>
                      <div className='text-sm font-medium'>Your Library</div>
                      <div className='mt-0.5'><FolderOpen className='w-4 h-4' /></div>
                    </button>
                    <button onClick={() => setMagicMediaModalOpen(true)} className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'>
                      <div className='text-sm font-medium'>Magic Media</div>
                      <div className='mt-0.5'><Film className='w-4 h-4' /></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between p-3">
              <button onClick={() => step === 1 ? window.history.back() : setStep(step - 1)}
                className="border border-gray-200 text-gray-600 px-4 py-2 cursor-pointer rounded-md hover:bg-gray-100">
                Back
              </button>
              <button onClick={() => step === 3 ? handleGenerate() : setStep(step + 1)}
                className="bg-blue-700 text-white px-6 py-2 cursor-pointer rounded-md hover:bg-blue-800 flex items-center gap-2">
                {loading.generate || loading[step] ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 3 ? 'Generate' : 'Continue')}
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
        aspectRatio={postData.size ? parseInt(postData.size.split('x')[0]) / parseInt(postData.size.split('x')[1]) : 1}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => { setShowCropper(false); setImageSrc([]); setCroppedImages([]); }}
      />

      {/* Other modals */}
      <SearchMediaModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages} onSelectImage={(src) => {
          setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
        }} onApply={handleApplySelected} />

      <LibraryMediaModal isOpen={libraryModalOpen} onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages} onSelectImage={(src) => {
          setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
        }} onApply={handleApplySelected} />

      <MagicMediaModal isOpen={magicMediaModalOpen} onClose={() => {
        setMagicMediaModalOpen(false);
        setSelectedMedia([]); // optional: clear on close
      }}
        activeTab={activeTab} onTabChange={setActiveTab}
        selectedMedia={selectedMedia} onSelectMedia={handleSelectMedia} onApply={handleApplySelected} onCancel={handleCancelSelection}>
        {renderTabContent()}
      </MagicMediaModal>

      <SocialIntegrationModal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)}
        onContinue={(platform) => { setIsSocialModalOpen(false); }} actionType={actionType} />

      {loading.generate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-50 rounded-lg p-10">
            <FloatingAnimation showProgressBar={true}>
              <FloatingElements.ImageFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsCreativeWizard;