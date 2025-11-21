
"use client";

import { CheckCircle2, Film, Scan, Video, ChevronRight, FileUp, FileSearch, FolderOpen, Play, MoreVertical, Loader2, Send, Calendar, Download } from 'lucide-react';
import React, { useState, useRef, useCallback } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import AdsIntegrationModal from '@/app/(protected)/AdsIntegrationModal';

const VideoAdsCreatives = () => {
  const { activeBrand } = useAuth();
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);
  const libraryFileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [crop, setCrop] = useState({
    unit: "%", width: 50, x: 25, y: 25, height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const imgRef = useRef(null);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [brandUrl, setBrandUrl] = useState("");
  const [postData, setPostData] = useState({
    brandName: activeBrand?.name || "",
    projectName: "",
    primaryColor: activeBrand?.primary_color || "#000000",
    secondaryColor: "#0066cc",
    font: "Arial",
    logo: "",
    description: "",
    selectedType: "",
    caption: "",
    hashtags: [],
    size: "",
    campaignGoal: "",
    audience: "",
    fileFormat: "",
  });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Text to Image");
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchResults, setSearchResults] = useState([
    { id: 1, src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg", alt: "Two yellow Labrador retriever puppies" },
    { id: 2, src: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg", alt: "Brown and white short-coated puppy" },
    { id: 3, src: "https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg", alt: "Cute puppy wearing a party hat" },
    { id: 4, src: "https://images.pexels.com/photos/3662374/pexels-photo-3662374.jpeg", alt: "Photo of a Siberian Husky beside his master" },
    { id: 5, src: "https://images.pexels.com/photos/3671300/pexels-photo-3671300.jpeg", alt: "Person holding black and white Siberian Husky" },
    { id: 6, src: "https://images.pexels.com/photos/3663082/pexels-photo-3663082.jpeg", alt: "White and black Siberian Husky puppy" },
    { id: 7, src: "https://images.pexels.com/photos/316680/pexels-photo-316680.jpeg", alt: "Billboard advertising" },
    { id: 8, src: "https://images.pexels.com/photos/6476592/pexels-photo-6476592.jpeg", alt: "Digital ad" },
    { id: 9, src: "https://images.pexels.com/photos/6476591/pexels-photo-6476591.jpeg", alt: "Marketing image" },
    { id: 10, src: "https://images.pexels.com/photos/6476584/pexels-photo-6476584.jpeg", alt: "Ad campaign" },
    { id: 11, src: "https://images.pexels.com/photos/279739/pexels-photo-279739.jpeg", alt: "Shopping ad" },
    { id: 12, src: "https://images.pexels.com/photos/316680/pexels-photo-316680.jpeg", alt: "Billboard advertising" },
    { id: 13, src: "https://images.pexels.com/photos/6476592/pexels-photo-6476592.jpeg", alt: "Digital ad" },
    { id: 14, src: "https://images.pexels.com/photos/6476591/pexels-photo-6476591.jpeg", alt: "Marketing image" },
    { id: 15, src: "https://images.pexels.com/photos/6476584/pexels-photo-6476584.jpeg", alt: "Ad campaign" },
    { id: 16, src: "https://images.pexels.com/photos/279739/pexels-photo-279739.jpeg", alt: "Shopping ad" },
  ]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [processedAssets, setProcessedAssets] = useState({});
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);

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
    { value: "mp4", label: "MP4" },
    { value: "mov", label: "MOV" },
  ];
  const videoTypeOptions = [
    { value: "Reels", label: "Reels", description: "15-60s" },
    { value: "Shorts", label: "Shorts", description: "15-60s" },
    { value: "Pre-roll", label: "Pre-roll", description: "5-15s" },
  ];

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;
      setPostData((prev) => ({ ...prev, [field]: sanitizedValue }));
    } else if (field === 'hashtags') {
      setPostData((prev) => ({ ...prev, [field]: value }));
    } else {
      setPostData((prev) => ({ ...prev, [field]: value }));
    }
    setError("");
  }, []);

  const handlePostDataDescription = useCallback((field, value) => {
    setPostData((prev) => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  const handleVideoTypeSelect = (value) => {
    handlePostDataDescription('selectedType', value);
  };

  const handleImportBrand = () => {
    if (!brandUrl) {
      setError("Please enter a valid brand URL.");
      return;
    }
    setLoading({ ...loading, 1: true });
    setTimeout(() => {
      setPostData((prev) => ({
        ...prev,
        brandName: "Imported Brand",
        primaryColor: "#1e3a8a",
        secondaryColor: "#3b82f6",
        logo: "https://via.placeholder.com/100?text=Logo",
        font: "Roboto",
        caption: "Discover our new collection!",
        hashtags: ["#Brand", "#NewCollection"],
      }));
      setPostData((prev) => ({
        ...prev,
        description: "Showcase new collection with dynamic video.",
        selectedType: "Reels",
      }));
      setLoading({ ...loading, 1: false });
      setError("");
      alert("Brand details imported successfully!");
    }, 1000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPostData((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInspireMe = () => {
    setPostData((prev) => ({
      ...prev,
      description: "Show a trendy product, pan across features, add caption: Shop Now!",
      selectedType: "Reels",
    }));
    setPostData((prev) => ({
      ...prev,
      caption: "Shop Now! | Limited Offer",
      hashtags: ["#ShopNow", "#LimitedOffer"],
    }));
    setError("");
  };

  const handleSizeSelect = (value) => {
    setPostData((prev) => ({ ...prev, size: value }));
    setError("");
  };

  const handleCampaignGoalSelect = (value) => {
    setPostData((prev) => ({ ...prev, campaignGoal: value }));
    setError("");
  };

  const handleAudienceSelect = (value) => {
    setPostData((prev) => ({ ...prev, audience: value }));
    setError("");
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map(file => URL.createObjectURL(file));
    setImageSrc(newImages);
    setCroppedImages(new Array(newImages.length).fill(null));
    setShowCropper(true);
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

  const onImageLoaded = (img) => {
    imgRef.current = img;
  };

  const saveCroppedImage = () => {
    if (!completedCrop || !imgRef.current) return;

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
      const file = new File([blob], `cropped-image-${currentCropIndex}.png`, { type: 'image/png' });
      setCroppedImages((prev) => {
        const newCropped = [...prev];
        newCropped[currentCropIndex] = file;
        return newCropped;
      });

      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex(currentCropIndex + 1);
        setCrop({ unit: "%", width: 50, x: 25, y: 25, height: 50 });
      } else {
        setShowCropper(false);
        setCurrentCropIndex(0);
        setPostData((prev) => ({ ...prev, backgroundImage: croppedImages[0] || file }));
      }
    }, 'image/png');
  };

  const handleSkipCrop = async () => {
    const src = imageSrc[currentCropIndex];
    const response = await fetch(src);
    const blob = await response.blob();
    const file = new File([blob], `image-${currentCropIndex}.png`, { type: blob.type });

    setCroppedImages((prev) => {
      const newCropped = [...prev];
      newCropped[currentCropIndex] = file;
      return newCropped;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex(currentCropIndex + 1);
      setCrop({ unit: "%", width: 50, x: 25, y: 25, height: 50 });
    } else {
      setShowCropper(false);
      setCurrentCropIndex(0);
      setPostData((prev) => ({ ...prev, backgroundImage: croppedImages[0] || file }));
    }
  };

  const handleSearchMedia = () => {
    setSearchModalOpen(true);
  };

  const handleUploadMedia = () => {
    setLibraryModalOpen(true);
  };

  const handleMagicMedia = () => {
    setMagicMediaModalOpen(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
  };

  const handleApplySelected = () => {
    if (magicMediaModalOpen && selectedMedia.length === 0) return;
    if (!magicMediaModalOpen && selectedImages.length === 0) return;

    if (magicMediaModalOpen) {
      setImageSrc(selectedMedia);
      setCroppedImages(new Array(selectedMedia.length).fill(null));
    } else {
      setImageSrc(selectedImages);
      setCroppedImages(new Array(selectedMedia.length).fill(null));
    }
    setShowCropper(true);

    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
  };

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
  };

  const handleAddImageUrl = async () => {
    const url = document.getElementById('imageUrlInput').value.trim();
    if (!url) return;

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(url)) {
      alert("Please enter a valid image URL (e.g., .jpg, .png, .webp)");
      return;
    }

    if (searchResults.some(result => result.src === url) || selectedImages.includes(url)) {
      alert("This image URL is already added.");
      return;
    }

    try {
      const img = new Image();
      img.onload = () => {
        const newId = searchResults.length + 1;
        setSearchResults(prev => [
          { id: newId, src: url, alt: `User-added image ${newId}` },
          ...prev
        ]);
        document.getElementById('imageUrlInput').value = '';
      };
      img.onerror = () => {
        alert("Invalid image URL or image could not be loaded.");
      };
      img.src = url;
    } catch (error) {
      alert("An error occurred while adding the image URL.");
    }
  };

  const handleSelectImage = async (src, source = 'brand') => {
    if (source === 'brand') {
      if (croppedImages.length < 5) {
        const response = await fetch(src);
        const blob = await response.blob();
        const file = new File([blob], `image-${croppedImages.length}-${Date.now()}.png`, { type: blob.type });
        setCroppedImages((prev) => [...prev, file]);
      }
    } else {
      if (!selectedImages.includes(src) && selectedImages.length < 5) {
        setSelectedImages((prev) => [...prev, src]);
      } else {
        setSelectedImages((prev) => prev.filter((img) => img !== src));
      }
    }
  };

  const handleMenuToggle = (assetId) => {
    setMenuOpen(menuOpen === assetId ? null : assetId);
  };

  const openAdsModal = (type, assets) => {
    setActionType(type);
    setCurrentAssets(assets);
    setIsAdsModalOpen(true);
  };

  const handlePostNow = (asset) => {
    openAdsModal('post', [asset]);
  };

  const handleSchedule = (asset) => {
    openAdsModal('schedule', [asset]);
  };

  const handleDownload = (asset) => {
    setProcessedAssets((prev) => ({ ...prev, [asset.id]: { type: 'download', data: asset.src } }));
    setMenuOpen(null);
  };

  const handleSinglePostNow = () => {
    if (!selectedAsset) return;
    const asset = result.assets.find((a) => a.id === selectedAsset);
    if (asset) handlePostNow(asset);
  };

  const handleSingleSchedule = () => {
    if (!selectedAsset) return;
    const asset = result.assets.find((a) => a.id === selectedAsset);
    if (asset) handleSchedule(asset);
  };

  const handleSingleDownload = () => {
    if (!selectedAsset) return;
    const asset = result.assets.find((a) => a.id === selectedAsset);
    if (asset) handleDownload(asset);
  };

  const handleAdsContinue = (selectedPlatform) => {
    setIsAdsModalOpen(false);
    localStorage.setItem('selectedPlatform', JSON.stringify(selectedPlatform));
    localStorage.setItem('actionType', actionType);
    window.open('/AdsPostPage', '_blank');
    currentAssets.forEach(asset => {
      const postId = `POST_${asset.id}_${Date.now()}`;
      setProcessedAssets((prev) => ({ ...prev, [asset.id]: { type: actionType === 'post' ? 'post' : 'schedule', data: postId } }));
    });
  };

  const handleBack = () => {
    setResult(null);
    setMenuOpen(null);
    setSelectedAsset(null);
  };

  const toggleAssetSelection = (assetId) => {
    setSelectedAsset(selectedAsset === assetId ? null : assetId);
  };

  const steps = [
    { id: 1, title: "Brand Details", icon: <Video className="h-5 w-5" /> },
    { id: 2, title: "Size, Goals & Audience", icon: <Scan className="h-5 w-5" /> },
    { id: 3, title: "Background Media", icon: <Film className="h-5 w-5" /> },
  ];

  const handleContinue = () => {
    if (step === 1 && !postData.brandName) {
      setError("Please enter a brand name.");
      return;
    }
    if (step === 2) {
      if (!postData.size || !postData.campaignGoal || !postData.audience || !postData.fileFormat) {
        setError("Please select a size, campaign goal, audience, and file format.");
        return;
      }
    }
    if (step === 3 && croppedImages.length === 0) {
      setError("Please select or upload at least one background media.");
      return;
    }
    if (step < steps.length) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step + 1);
        setLoading({ ...loading, [step]: false });
      }, 1000);
    }
  };

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

  return (
    <div className='px-14'>
      <div className='font-medium text-xl mb-6'>Video Ads Creatives</div>

      {result ? (
        // Results Section
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Video Ad Creatives</div>

          {selectedAsset !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2 mb-4"
            >
              <button
                onClick={handleSinglePostNow}
                className="px-5 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition duration-300 flex items-center gap-2"
                aria-label="Create Ad"
              >
                <Send className="w-4 h-4" />
                Create Ad
              </button>
              <button
                onClick={handleSingleSchedule}
                className="px-4 py-2 bg-white text-black hover:text-blue-700 rounded-md cursor-pointer border hover:bg-gray-50 hover:border-blue-700 transition duration-300 flex items-center gap-2"
                aria-label="Schedule Ad"
              >
                <Calendar className="w-4 h-4" />
                Schedule Ad
              </button>
              <button
                onClick={handleSingleDownload}
                className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-white hover:border hover:border-blue-700 hover:text-blue-700 transition duration-300 flex items-center gap-2"
                aria-label="Download Ad"
              >
                <Download className="w-4 h-4" />
                Download Ad
              </button>
            </motion.div>
          )}

          <div className="border border-gray-200 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {result.assets?.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => toggleAssetSelection(asset.id)}
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition duration-300 ${selectedAsset === asset.id ? 'border-blue-700' : 'border-gray-200'}`}
                >
                  <div className="py-3 px-2 bg-white">
                    <p className="text-sm text-gray-800">Rating</p>
                  </div>
                  <div
                    className="absolute top-16 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="radio"
                      name="assetSelection"
                      checked={selectedAsset === asset.id}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="w-5 h-5 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition duration-300"
                      aria-label={`Select asset ${asset.alt}`}
                    />
                  </div>
                  <div className="relative w-full h-54" style={{ aspectRatio: postData.size.replace('x', '/') }}>
                    <img
                      src={asset.preview}
                      alt={asset.alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-2">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="py-4 px-2 bg-white">
                    <p className="text-sm text-gray-800">Caption: {postData.caption}</p>
                    <p className="text-sm text-gray-800">Brand Name: {postData.projectName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuToggle(asset.id);
                    }}
                    className="absolute top-16 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer transition duration-300"
                    aria-label="Video Options"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                  {menuOpen === asset.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-23 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                    >
                      <button
                        onClick={() => handlePostNow(asset)}
                        className="block w-full text-left px-4 py-1 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                        aria-label={`Post Now ${asset.alt}`}
                      >
                        Post Now
                      </button>
                      <button
                        onClick={() => handleSchedule(asset)}
                        className="block w-full text-left px-4 py-1 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                        aria-label={`Schedule ${asset.alt}`}
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => handleDownload(asset)}
                        className="block w-full text-left px-4 py-1 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                        aria-label={`Download ${asset.alt}`}
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {processedAssets[asset.id] && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      {processedAssets[asset.id].type === 'post' && (
                        <p className="text-green-600 text-sm">Video Posted! Post ID: {processedAssets[asset.id].data}</p>
                      )}
                      {processedAssets[asset.id].type === 'schedule' && (
                        <p className="text-green-600 text-sm">Video Scheduled! Post ID: {processedAssets[asset.id].data}</p>
                      )}
                      {processedAssets[asset.id].type === 'download' && (
                        <p className="text-green-600 text-sm">
                          Video Exported!{' '}
                          <a
                            href={processedAssets[asset.id].data}
                            download={`creative_${asset.id}.${asset.fileFormat}`}
                            className="text-blue-700 underline cursor-pointer"
                          >
                            Download
                          </a>
                        </p>
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
        // Wizard Section
        <div className="flex flex-row gap-10 w-full">
          <div className="hidden lg:flex overflow-hidden sticky top-20 flex-col mt-15 w-[30%] h-[500px]">
            <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute top-0 left-4.5 w-1 bg-[#155dfc] rounded-full"
            />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex items-center h-full last:mb-0 mb-10">
                <div className="relative z-20">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
                      ${step === s.id ? "border-[#155dfc] bg-blue-100 text-[#155dfc]" : step > s.id ? "bg-[#155dfc] border-[#155dfc] text-white" : "border-gray-300 text-gray-300"}`}
                  >
                    {step > s.id ? <CheckCircle2 size={20} className="text-blue-700" /> : s.icon}
                  </div>
                </div>
                <span className={`ml-3 text-sm font-medium ${step === s.id ? "text-[#155dfc]" : "text-black"}`}>
                  <div className="text-gray-500 text-xs">Step {s.id}</div>
                  <div className="font-medium">{s.title}</div>
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4">
            <div className='overflow-auto'>
              {step === 1 && (
                <div className='flex flex-col gap-3'>
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Video className="text-blue-700 w-6 h-6" />
                      </div>
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
                          placeholder="https://app.weviy.com/"
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
                        <Video className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                        <p className="text-gray-600 text-xs">Enter details for your video ad.</p>
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
                        placeholder="Enter a description for your video (e.g., 'Show product, zoom in, add caption')"
                        value={postData.description}
                        onChange={(e) => handlePostDataDescription('description', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                        aria-label="Video Description"
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
                            className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
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
                            className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                            aria-label="Hashtags"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Video Type</label>
                      <div className="grid grid-cols-3 gap-4">
                        {videoTypeOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleVideoTypeSelect(option.value)}
                            className={`cursor-pointer border rounded-lg p-2 text-center text-xs ${postData.selectedType === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <input
                                type="checkbox"
                                checked={postData.selectedType === option.value}
                                onChange={() => handleVideoTypeSelect(option.value)}
                                className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={`Select ${option.label}`}
                              />
                            </div>
                            <div className="flex justify-center items-center gap-1">
                              <span>{option.label}</span>
                            </div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        ))}
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
                        <Scan className="text-blue-700 w-6 h-6" />
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
                      <div className="grid grid-cols-2 gap-4">
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
                  <div className='flex border-b border-b-gray-200 pb-2 flex-row gap-2 mb-7 py-2'>
                    <div className='flex bg-gray-100 px-3 rounded-full justify-center items-center'>
                      <Film className='text-blue-700 w-6 h-6' />
                    </div>
                    <div className='flex flex-col justify-center'>
                      <h1 className='font-medium text-lg text-blue-700'>Choose Image</h1>
                      <p className='text-gray-600 text-xs'>Upload or select an image for your video.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 pb-3 gap-4">
                    {searchResults.slice(0, 5).map((img) => (
                      <div
                        key={img.id}
                        onClick={() => handleSelectImage(img.src, 'brand')}
                        className="cursor-pointer hover:opacity-80 relative"
                      >
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        {croppedImages.some(file => file && URL.createObjectURL(file) === img.src) && (
                          <div className="absolute inset-0 border-2 border-blue-700 rounded"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {croppedImages.length > 0 && (
                    <div className="grid grid-cols-5 gap-4 mb-10">
                      {croppedImages.filter(img => img instanceof File).map((img, index) => (
                        <div key={index} className="flex flex-col relative items-center">
                          <img src={URL.createObjectURL(img)} alt={`Selected ${index}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                          <button
                            onClick={() => {
                              const newCropped = [...croppedImages];
                              newCropped.splice(index, 1);
                              setCroppedImages(newCropped);
                              if (index === currentCropIndex && currentCropIndex > 0) setCurrentCropIndex(currentCropIndex - 1);
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

                  <div className='flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center'>
                    <div><FileUp /></div>
                    <h3 className='text-md font-semibold text-gray-700'>Upload Media</h3>
                    <p className='text-gray-500 text-xs'>Choose images from your brand, library, or generate with Magic Media.</p>
                    <div className='flex gap-4'>
                      <button
                        onClick={handleSearchMedia}
                        className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'
                      >
                        <div className='text-sm font-medium'>Search Media</div>
                        <div className='mt-0.5'><FileSearch className='w-4 h-4' /></div>
                      </button>
                      <button
                        onClick={handleUploadMedia}
                        className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-white flex-row gap-3'
                      >
                        <div className='text-sm font-medium'>Your Library</div>
                        <div className='mt-0.5'><FolderOpen className='w-4 h-4' /></div>
                      </button>
                      <button
                        onClick={handleMagicMedia}
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
                    </div>
                  </div>

                  {showCropper && (
                    <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                      <div className="relative w-[700px] h-[600px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={postData.size ? postData.size.split('x').map(Number)[0] / postData.size.split('x').map(Number)[1] : 1}
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
                              setCrop({ unit: "%", width: 50, x: 25, y: 25, height: 50 });
                            }}
                            className="px-4 py-2 bg-gray-300 text-black rounded-lg"
                          >
                            Previous
                          </button>
                        )}
                        <button
                          onClick={handleSkipCrop}
                          className="px-4 py-2 cursor-pointer bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          Skip Crop
                        </button>
                        <button
                          onClick={() => setShowCropper(false)}
                          className="px-4 py-2 cursor-pointer bg-gray-500 text-white rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveCroppedImage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                          {currentCropIndex === imageSrc.length - 1 ? "Finish" : "Next"}
                        </button>
                      </div>
                    </div>
                  )}

                  {searchModalOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                      <div className="bg-white flex flex-col justify-between rounded-lg p-6 w-[80%] h-[85%]">
                        <div className='flex flex-col gap-8'>
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
                              onClick={() => { /* Add search logic here if using API */ }}
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
                                onClick={() => handleSelectImage(result.src, 'search')}
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
                              className="px-4 cursor-pointer py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400"
                            >
                              Apply
                            </button>
                            <button
                              onClick={handleCancelSelection}
                              className="px-4 cursor-pointer py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
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
                        <div className='flex flex-col gap-8'>
                          <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Your Library</h2>
                            <button
                              onClick={() => setLibraryModalOpen(false)}
                              className="text-gray-500 cursor-pointer hover:text-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center border-b border-b-gray-200 py-5">
                            <button
                              onClick={() => libraryFileInputRef.current.click()}
                              className="px-4 hover:bg-blue-800 cursor-pointer py-2 bg-blue-700 text-white rounded flex items-center gap-2"
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
                                onClick={() => handleSelectImage(result.src, 'library')}
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
                            className="px-4 py-2 cursor-pointer hover:bg-blue-800 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
                          >
                            Apply
                          </button>
                          <button
                            onClick={handleCancelSelection}
                            className="px-4 cursor-pointer py-2 hover:bg-gray-600 bg-gray-600 text-white rounded-lg"
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
                            <div className="flex gap-4 border-b border-gray-200 pb-2">
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
                </div>
              )}

              {loading.generate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                    <FloatingAnimation showProgressBar={true}>
                      <FloatingElements.VideoFile />
                    </FloatingAnimation>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="border cursor-pointer border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
                >
                  Back
                </button>
              )}
              {step < steps.length && (
                <button
                  onClick={handleContinue}
                  className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                  disabled={loading[step]}
                >
                  {loading[step] ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                </button>
              )}
              {step === steps.length && (
                <button
                  onClick={() => {
                    setLoading((prev) => ({ ...prev, generate: true }));
                    const validImages = croppedImages.filter((img) => img instanceof File || img instanceof Blob);
                    const payload = {
                      postData,
                      videos: croppedImages.map((img, index) => ({
                        index,
                        url: URL.createObjectURL(img),
                        name: img.name,
                        type: img.type,
                      })),
                    };
                    console.log('Payload:', payload);
                    setTimeout(() => {
                      localStorage.setItem(
                        "videopostData",
                        JSON.stringify({
                          ...postData,
                          backgroundImage: croppedImages[0] instanceof File ? URL.createObjectURL(validImages[0]) : null,
                        })
                      );
                      setLoading((prev) => ({ ...prev, generate: false }));
                      setResult({
                        assets: Array.from({ length: 8 }, (_, index) => ({
                          id: `video_${index}_${Date.now()}`,
                          src: `generated-video-${index}.${postData.fileFormat || 'mp4'}`,
                          preview: imageSrc[index] || searchResults[index % searchResults.length].src || 'https://via.placeholder.com/150',
                          alt: `Generated Video ${index + 1}`,
                          mediaType: 'video',
                          fileFormat: postData.fileFormat || 'mp4',
                        })),
                        type: null,
                        assetId: null,
                      });
                    }, 1000);
                  }}
                  className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  {loading.generate ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AdsIntegrationModal
        isOpen={isAdsModalOpen}
        onClose={() => setIsAdsModalOpen(false)}
        onContinue={handleAdsContinue}
        actionType={actionType}
      />
    </div>
  );
};

export default VideoAdsCreatives;
