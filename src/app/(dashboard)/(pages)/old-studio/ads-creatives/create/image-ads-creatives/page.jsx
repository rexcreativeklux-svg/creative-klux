"use client";
import { CheckCircle2, Send, Calendar, Download, Images, Scan, FileUp, FileSearch, FolderOpen, Image, MoreVertical, Loader2, Film } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import AdsIntegrationModal from '@/app/(components)/AdsIntegrationModal';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import MagicMediaModal from '@/app/(components)/MagicMediaModal';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';
import Toast from '@/app/(components)/Toast';
import BrandImagesSection from '@/app/(components)/BrandImagesSection';
import RecommendedImagesSection from '@/app/(components)/RecommendedImagesSection';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';
import ImportedBrandImagesSection from '@/app/(components)/ImportedBrandImagesSection';

const ImageAdsCreatives = () => {
  const { activeBrand, sendUrl, myImages = [], myImagesLoading, fetchMyImages, deleteImage } = useAuth();

  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const libraryFileInputRef = useRef(null);

  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const cropperRef = useRef(null);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);

  const [brandUrl, setBrandUrl] = useState("");
  const [importingBrand, setImportingBrand] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const [postData, setPostData] = useState({
    brandName: activeBrand?.name || "",
    projectName: "",
    description: "",
    primaryColor: activeBrand?.primary_color || "#000000",
    secondaryColor: "#0066cc",
    font: "Arial",
    logo: "",
    caption: "",
    hashtags: [],
    size: "",
    campaignGoal: "",
    audience: "",
    fileFormat: "PNG",
    importedImages: [],
  });

  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Text to Image");
  const [result, setResult] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [processedAssets, setProcessedAssets] = useState({});
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);

  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (message) => setToast({ isOpen: true, message });
  const closeToast = () => setToast({ isOpen: false, message: "" });

  const fontOptions = [
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Roboto", label: "Roboto" },
  ];

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

  const fileFormatOptions = [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'WEBP', label: 'WEBP' },
  ];

  const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
  };

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const sanitized = value.startsWith('#') ? value : `#${value}`;
      setPostData(prev => ({ ...prev, [field]: sanitized }));
    } else {
      setPostData(prev => ({ ...prev, [field]: value }));
    }
    setError("");
  }, []);

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const response = await sendUrl(brandUrl);
      if (!response?.data) throw new Error("No data");
      const imported = response.data;

      setPostData(prev => ({
        ...prev,
        brandName: imported.name || "",
        projectName: imported.name || "",
        description: imported.description || "",
        primaryColor: imported.primary_color || "#1e3a8a",
        secondaryColor: imported.secondary_color || "#10b981",
        font: imported.font || "Roboto",
        caption: `Discover ${imported.name}!`,
        hashtags: ["#ImageAd", "#Brand"],
        logo: imported.logo || "",
        importedImages: imported.images?.map(i => i.url).filter(Boolean) || [],
      }));

      if (imported.logo) {
        try {
          let res = await fetch(imported.logo);
          if (!res.ok) res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(imported.logo)}`);
          const blob = await res.blob();
          const file = new File([blob], "logo.png", { type: blob.type });
          setPostData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
        } catch (_) { }
      }
      showToast("Brand imported successfully!");
    } catch (err) {
      setError("Failed to import brand.");
    } finally {
      setImportingBrand(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPostData(prev => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const urls = files.map(f => URL.createObjectURL(f));
    setImageSrc(prev => [...prev, ...urls]);
    setCroppedImages(prev => [...prev, ...Array(urls.length).fill(null)]);
    setCurrentCropIndex(imageSrc.length);
    setShowCropper(true);
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
      setCroppedImages(prev => { const u = [...prev]; u[currentCropIndex] = file; return u; });
      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex(prev => prev + 1);
        setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      } else {
        setShowCropper(false);
      }
    });
  };

  const handleApplySelected = async () => {
    const sources = magicMediaModalOpen ? selectedMedia : selectedImages;
    if (sources.length === 0) return;

    const files = await Promise.all(sources.map(async (item) => {
      const url = item.src || item;
      const fetchUrl = url.includes('pexels.com') ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;
      const res = await fetch(fetchUrl);
      const blob = await res.blob();
      return new File([blob], `selected-${Date.now()}.png`, { type: blob.type });
    }));

    const urls = files.map(f => URL.createObjectURL(f));
    setImageSrc(prev => [...prev, ...urls]);
    setCroppedImages(prev => [...prev, ...Array(urls.length).fill(null)]);
    setCurrentCropIndex(imageSrc.length);
    setShowCropper(true);

    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
    showToast(`Added ${files.length} image(s)`);
  };

  const handleContinue = () => {
    if (step === 1 && !postData.brandName) return setError("Brand name required");
    if (step === 2 && (!postData.size || !postData.campaignGoal || !postData.audience || !postData.fileFormat))
      return setError("Please complete all fields");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return setError("Select at least one image");

    setStep(prev => prev + 1);
  };

  const renderTabContent = () => {
    const tabComponents = {
      'Text to Image': <TextToImageTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} postData={postData} activeBrand={activeBrand} />,
      'Text to Audio': <TextToAudioTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Text to Video': <TextToVideoTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Image to Variations': <ImageToVariationsTab brandName={postData.brandName} selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} postData={postData} activeBrand={activeBrand} onClose={() => setMagicMediaModalOpen(false)} openSearchModal={() => {
        setSearchModalOpen(true);
        setMagicMediaModalOpen(false); // optional: hide MagicMedia while searching
      }}
        openLibraryModal={() => {
          setLibraryModalOpen(true);
          setMagicMediaModalOpen(false);
        }} />,
      'Script to Voiceover to Video': <ScriptToVoiceoverToVideoTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Audio to Text': <AudioToTextTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
      'Persona-based Generator': <PersonaBasedGeneratorTab selectedMedia={selectedMedia || []} handleSelectMedia={handleSelectMedia} />,
    };

    return tabComponents[activeTab] || (
      <div className="h-[100%] overflow-y-auto rounded-lg p-3">Select a tab to view content</div>
    );
  };

  const handleLibraryFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(file.name)) {
      alert("Please upload a valid image file (e.g., .jpg, .png, .webp)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newId = searchResults.length + 1;
      setSearchResults(prev => [
        { id: newId, src: reader.result, alt: `User-uploaded image ${newId}` },
        ...prev
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
  };

  // Prefill from activeBrand
  useEffect(() => {
    if (!activeBrand) return;
    const url = activeBrand.url || activeBrand.source_url || "";
    if (brandUrl && brandUrl !== url) return;

    setBrandUrl(url);
    setPostData(prev => ({
      ...prev,
      brandName: activeBrand.name || "",
      projectName: activeBrand.name || "",
      description: activeBrand.description || "",
      primaryColor: activeBrand.primary_color || "#1e3a8a",
      secondaryColor: activeBrand.secondary_color || "#10b981",
      font: activeBrand.font || "Roboto",
      logo: activeBrand.logo || prev.logo,
      caption: `Discover ${activeBrand.name || "our brand"}!`,
      hashtags: prev.hashtags.length > 0 ? prev.hashtags : ["#ImageAd", "#Brand"],
      importedImages: activeBrand.images?.map(i => i.url || i).filter(Boolean) || [],
    }));
  }, [activeBrand]);

  // Recommended Images from Pexels
  useEffect(() => {
    if (!postData.brandName.trim()) return;
    const timer = setTimeout(async () => {
      setIsLoadingRecommended(true);
      try {
        const query = `${postData.industry}`;
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=20`);
        const data = await res.json();
        const images = (data.photos || []).map(p => ({
          id: p.id,
          src: p.src.medium,
          large: p.src.large2x,
          alt: p.alt || `Ad image for ${postData.industry}`,
        }));
        setRecommendedImages(images);
      } catch (e) {
        setRecommendedImages([]);
      } finally {
        setIsLoadingRecommended(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [postData.industry]);

  const steps = [
    { id: 1, title: "Brand Details", icon: <Image className="h-5 w-5" /> },
    { id: 2, title: "Size, Goals & Audience", icon: <Scan className="h-5 w-5" /> },
    { id: 3, title: "Background Image", icon: <Images className="h-5 w-5" /> },
  ];

  return (
    <div className='px-14'>
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={closeToast} duration={1000} />

      <div className='font-medium text-xl mb-6'>Image Ads Creatives</div>

      {result ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className='flex flex-row justify-between'>
            <div className='font-medium text-lg text-blue-700 flex justify-center items-center'>Generated Image Ads </div>
            <div className="flex justify-between p-3 rounded-lg">
              <button onClick={() => setResult(null)} className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium">
                back
              </button>
            </div>
          </div>

          {selectedAsset !== null && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex gap-2 mb-4">
              <button onClick={() => openAdsModal('post', [result.assets.find(a => a.id === selectedAsset)])}
                className="px-5 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition duration-300 flex items-center gap-2">
                <Send className="w-4 h-4" /> Create Ad
              </button>
              <button onClick={() => openAdsModal('schedule', [result.assets.find(a => a.id === selectedAsset)])}
                className="px-4 py-2 bg-white text-black hover:text-blue-700 rounded-md cursor-pointer border hover:bg-gray-50 hover:border-blue-700 transition duration-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule Ad
              </button>
              <button onClick={() => handleDownload(result.assets.find(a => a.id === selectedAsset))}
                className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-white hover:border hover:border-blue-700 hover:text-blue-700 transition duration-300 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download Ad
              </button>
            </motion.div>
          )}

          <div className="border border-gray-200 p-4 rounded-lg">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
              {result.assets?.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => toggleAssetSelection(asset.id)}
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition duration-300 mb-6 break-inside-avoid ${selectedAsset === asset.id ? 'border-blue-700 ring-2 ring-blue-700' : 'border-gray-200 hover:border-blue-500'}`}
                >
                  <div className="py-3 px-2 bg-white">
                    <p className="text-sm text-gray-800">Rating</p>
                  </div>

                  <div className="absolute top-16 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      name="assetSelection"
                      checked={selectedAsset === asset.id}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="w-5 h-5 rounded-full border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition duration-300"
                    />
                  </div>

                  <div className="relative w-full h-auto group" style={{ aspectRatio: postData.size.replace('x', '/') || '1/1' }}>
                    <img
                      src={asset.preview || asset.src}
                      alt={asset.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="py-4 px-2 bg-white">
                    <p className="text-sm text-gray-800 truncate">Caption: {postData.caption}</p>
                    <p className="text-sm text-gray-800 truncate">Brand Name: {postData.projectName}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === asset.id ? null : asset.id);
                    }}
                    className="absolute top-16 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer transition duration-300 shadow-md z-10"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {menuOpen === asset.id && (
                    <div onClick={(e) => e.stopPropagation()} className="absolute top-24 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[140px]">
                      <button onClick={() => handlePostNow(asset)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300">
                        Post Now
                      </button>
                      <button onClick={() => handleSchedule(asset)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300">
                        Schedule
                      </button>
                      <button onClick={() => handleDownload(asset)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300">
                        Download
                      </button>
                    </div>
                  )}

                  {processedAssets[asset.id] && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      {processedAssets[asset.id].type === 'download' && (
                        <p className="text-green-600 text-sm">
                          Image Exported! <a href={processedAssets[asset.id].data} download={`creative_${asset.id}.png`} className="text-blue-700 underline cursor-pointer">Download</a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>


        </div>
      ) : (
        <div className="flex flex-row gap-10 w-full">
          <div className="hidden lg:flex sticky top-20 flex-col w-[30%] h-[500px]">
            <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
            <motion.div animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              className="absolute top-0 left-4.5 w-1 bg-[#155dfc] rounded-full" />
            {steps.map(s => (
              <div key={s.id} className="relative z-10 flex items-center h-full mb-10">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
                  ${step >= s.id ? 'bg-[#155dfc] border-[#155dfc] text-white' : 'border-gray-300 text-gray-300'}`}>
                  {step > s.id ? <CheckCircle2 size={20} /> : s.icon}
                </div>
                <span className="ml-3 text-sm font-medium">Step {s.id}<br />{s.title}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4">
            <div className='overflow-auto'>
              {step === 1 && (
                <div className='flex flex-col gap-3'>
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex px-1 gap-2">
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">URL</h1>
                        <p className="text-gray-600 text-sm">Import your personal url and kickstart your creatives campaign.</p>
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
                        />
                        <button
                          onClick={handleImportBrand}
                          disabled={importingBrand || !brandUrl}
                          className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm disabled:opacity-50"
                        >
                          {importingBrand ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Import'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5 flex flex-col border rounded-md border-gray-200 p-3">
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <div className="flex border border-gray-200 rounded-md py-2 px-2 gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                        <p className="text-gray-600 text-xs">Enter details for your image ad.</p>
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
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        placeholder="Enter a description for your video (e.g., 'A dynamic short video for a product launch')"
                        value={postData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Primary Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={postData.primaryColor} onChange={(e) => handleFieldChange('primaryColor', e.target.value)} className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer" />
                          <input type="text" value={postData.primaryColor} onChange={(e) => handleFieldChange('primaryColor', e.target.value)} placeholder="#000000" className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Secondary Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={postData.secondaryColor} onChange={(e) => handleFieldChange('secondaryColor', e.target.value)} className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer" />
                          <input type="text" value={postData.secondaryColor} onChange={(e) => handleFieldChange('secondaryColor', e.target.value)} placeholder="#0066cc" className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700" />
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-row justify-between gap-4'>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Font</label>
                        <select value={postData.font} onChange={(e) => handleFieldChange('font', e.target.value)} className="w-full p-3 border bg-white border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer">
                          {fontOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className='flex flex-col justify-center flex-1'>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => logoInputRef.current?.click()} className="px-2 py-1 border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-md flex items-center gap-2 cursor-pointer">
                            <FileUp className="w-5 h-5" /> Upload Logo
                          </button>
                          <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                          {postData.logo && <img src={postData.logo} alt="Brand Logo" className="w-10 h-10 object-contain" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Caption</label>
                        <input type="text" placeholder="Your caption here!" value={postData.caption} onChange={(e) => handleFieldChange('caption', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm" maxLength={280} />
                        <span className="text-gray-500 absolute right-2 top-8 text-sm mt-1 block">{280 - (postData.caption?.length || 0)}</span>
                      </div>
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Hashtags</label>
                        <input type="text" placeholder="Hashtags (e.g., #ImageAd #Brand)" value={postData.hashtags.join(' ')} onChange={(e) => handleFieldChange('hashtags', e.target.value.split(' ').filter(Boolean))} className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm" />
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
                          <div key={option.key} onClick={() => handleFieldChange('size', option.value)}
                            className={`cursor-pointer border rounded-lg p-2 text-center text-xs transition duration-300 ${postData.size === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}>
                            <div className="flex items-center justify-center mb-2">
                              <input type="checkbox" checked={postData.size === option.value} readOnly className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-300" />
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
                          <div key={option.value} onClick={() => handleFieldChange('campaignGoal', option.value)}
                            className={`cursor-pointer flex flex-row justify-center border rounded-lg gap-2 p-2 text-xs font-normal transition duration-300 ${postData.campaignGoal === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}>
                            <div className="flex items-center">
                              <input type="checkbox" checked={postData.campaignGoal === option.value} readOnly className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-300" />
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
                          <div key={option.value} onClick={() => handleFieldChange('audience', option.value)}
                            className={`cursor-pointer border rounded-lg p-2 text-center text-sm font-medium transition duration-300 ${postData.audience === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}>
                            <div className="flex items-center justify-center mb-2">
                              <input type="checkbox" checked={postData.audience === option.value} readOnly className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-300" />
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
                          <div key={option.value} onClick={() => handleFieldChange('fileFormat', option.value)}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs transition duration-300 ${postData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}>
                            <div className="flex justify-center">
                              <input type="checkbox" checked={postData.fileFormat === option.value} readOnly className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-300" />
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
                    {selectedImages.length > 0 && (
                      <button onClick={handleApplySelected}
                        className="ml-auto px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded-md flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Apply ({selectedImages.length})
                      </button>
                    )}
                  </div>

              

                  {postData.importedImages.length > 0 && (
                    <ImportedBrandImagesSection
                      importedImages={postData.importedImages}
                      selectedImages={selectedImages}
                      setSelectedImages={setSelectedImages}
                      menuOpen={menuOpen}
                      setMenuOpen={setMenuOpen}
                      showToast={showToast}
                    />
                  )}

                  <RecommendedImagesSection
                    brand={activeBrand}
                    recommendedImages={recommendedImages}
                    isLoadingRecommended={isLoadingRecommended}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    showToast={showToast}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                  />

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

                  {/* Upload section */}
                  <div className='flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center'>
                    <div><FileUp /></div>
                    <h3 className='text-md font-semibold text-gray-700'>Upload Media</h3>
                    <p className='text-gray-500 text-xs'>Choose images from your brand, library, or generate with Magic Media.</p>
                    <div className='flex gap-4'>
                      <button
                        onClick={() => setSearchModalOpen(true)}
                        className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'
                      >
                        <div className='text-sm font-medium'>Search Media</div>
                        <div className='mt-0.5'><FileSearch className='w-4 h-4' /></div>
                      </button>
                      <button
                        onClick={() => setLibraryModalOpen(true)}
                        className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'
                      >
                        <div className='text-sm font-medium'>Your Library</div>
                        <div className='mt-0.5'><FolderOpen className='w-4 h-4' /></div>
                      </button>
                      <button
                        onClick={() => setMagicMediaModalOpen(true)}
                        className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'
                      >
                        <div className='text-sm font-medium'>Magic Media</div>
                        <div className='mt-0.5'><Film className='w-4 h-4' /></div>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={libraryFileInputRef}
                        onChange={handleLibraryFileChange} // Your existing upload handler
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-8">
              {step > 1 && <button onClick={() => setStep(step - 1)} className="border cursor-pointer border-gray-200 px-6 py-2 rounded-lg hover:bg-gray-100">Back</button>}
              {step < 3 && <button onClick={handleContinue} className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700">Continue</button>}
              {step === 3 && (
                <button onClick={() => {
                  setLoading(prev => ({ ...prev, generate: true }));
                  setTimeout(() => {
                    const assets = Array.from({ length: 20 }, (_, i) => ({
                      id: `img_${i}`,
                      preview: croppedImages[i % croppedImages.length] ? URL.createObjectURL(croppedImages[i % croppedImages.length]) : recommendedImages[i]?.large || "/placeholder.png",
                      alt: `Generated Image ${i + 1}`,
                    }));
                    setResult({ assets });
                    setLoading(prev => ({ ...prev, generate: false }));
                  }, 3000);
                }} className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  {loading.generate ? <Loader2 className="animate-spin" /> : "Generate "}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ImageCropperModal isOpen={showCropper} ref={cropperRef} imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex} totalImages={imageSrc.length} crop={crop}
        onCropChange={setCrop} onCropComplete={setCompletedCrop}
        aspectRatio={postData.size ? (postData.size.replace('x', '/')) : 1}
        onSave={saveCroppedImage} onSkip={handleSkipCrop}
        onCancel={() => { setShowCropper(false); setImageSrc([]); }} />

      <SearchMediaModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages} onSelectImage={(src) => {
          setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
        }} onApply={handleApplySelected} onCancel={handleCancelSelection} />

      <LibraryMediaModal isOpen={libraryModalOpen} onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages} onSelectImage={(src) => {
          setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
        }} onApply={handleApplySelected} onCancel={handleCancelSelection} />

      <MagicMediaModal
        isOpen={magicMediaModalOpen}
        onClose={() => setMagicMediaModalOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedMedia={selectedMedia}
        onSelectMedia={handleSelectMedia}
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      >
        {renderTabContent()}
      </MagicMediaModal>

      {loading.generate && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-50 rounded-lg p-10">
            <FloatingAnimation showProgressBar>
              <FloatingElements.ImageFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAdsCreatives;