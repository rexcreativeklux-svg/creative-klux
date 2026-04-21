
"use client";

import { CheckCircle2, Film, Scan, Video, ChevronRight, FileUp, FileSearch, FolderOpen, Play, MoreVertical, Loader2, Send, Calendar, Download, Trash2, Pause } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import AdsIntegrationModal from '@/app/(components)/AdsIntegrationModal';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import MagicMediaModal from '@/app/(components)/MagicMediaModal';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';
import Toast from '@/app/(components)/Toast';
import BrandImagesSection from '@/app/(components)/BrandImagesSection';
import RecommendedImagesSection from '@/app/(components)/RecommendedImagesSection';

const VideoAdsCreatives = () => {
  const { activeBrand, sendUrl, myImages = [], myImagesLoading, fetchMyImages, deleteImage } = useAuth();
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
    importedImages: [],
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
  const [recommendedImages, setRecommendedImages] = useState([
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
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [processedAssets, setProcessedAssets] = useState({});
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);
  const [importingBrand, setImportingBrand] = useState(false);
  const [showInspireConfirm, setShowInspireConfirm] = useState(false);

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
  });

  const showToast = (message) => {
    setToast({ isOpen: true, message });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isOpen: false }));
  };

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

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) {
      setError("Please enter a valid brand URL.");
      return;
    }

    setImportingBrand(true);
    setError("");

    try {
      const response = await sendUrl(brandUrl); // ← This is the real API call

      if (!response?.data) {
        throw new Error("No data returned from server");
      }

      const imported = response.data;

      // Fill the form with real imported data
      setPostData(prev => ({
        ...prev,
        brandName: imported.name || "",
        projectName: imported.name || "",
        description: imported.description || "",
        primaryColor: imported.primary_color || "#1e3a8a",
        secondaryColor: imported.secondary_color || "#10b981",
        font: imported.font || imported.fonts || "Roboto",
        caption: `Discover ${imported.name || "our brand"}!`,
        hashtags: ["#Brand", "#NewArrival"],
        selectedType: prev.selectedType || "Reels",
        logo: "",
        importedImages: imported.images?.map(i => i.url).filter(Boolean) || [],
      }));

      // Handle logo (same logic as ImportBrand – download and convert to File if possible)
      if (imported.logo) {
        setPostData(prev => ({ ...prev, logo: imported.logo }));

        try {
          let logoResponse = await fetch(imported.logo);
          if (!logoResponse.ok) {
            const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(imported.logo)}`;
            logoResponse = await fetch(proxy);
          }
          if (logoResponse.ok) {
            const blob = await logoResponse.blob();
            const fileName = imported.logo.split('/').pop()?.split('?')[0] || 'logo.png';
            const logoFile = new File([blob], fileName, { type: blob.type });
            const logoUrl = URL.createObjectURL(logoFile);
            setPostData(prev => ({ ...prev, logo: logoUrl }));
          }
        } catch (err) {
          console.warn("Could not fetch logo:", err);
        }
      }

      showToast("Brand imported successfully!");
    } catch (err) {
      console.error("Import failed:", err);
      setError("Failed to import brand. Please check the URL and try again.");
    } finally {
      setImportingBrand(false);
    }
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
    const hasDescription = postData.description.trim() !== "";
    if (hasDescription) {
      setShowInspireConfirm(true);
    } else {
      applySmartInspiration();
    }
  };

  const applySmartInspiration = () => {
    const brand = postData.brandName || "your brand";
    const goal = postData.campaignGoal || "engagement";
    const audience = postData.audience || "general";
    const type = postData.selectedType || "Reels";

    // Smart templates based on real user input
    const inspirations = {
      // Sales-focused
      Sales: [
        `Flash sale alert: Show ${brand} product on clean background, bold red "50% OFF" text flashes, countdown timer, end with "Shop Now" CTA and website link`,
        `Limited time offer: Quick zoom on ${brand} product, price reveal animation, urgent text "Ends Tonight!", strong "Buy Now" button`,
        `Customer unboxing ${brand} product with excited reaction, overlay "Thousands Sold", end with discount code and CTA`,
      ],
      // Brand Awareness
      "Brand Awareness": [
        `Cinematic slow-motion shots of ${brand} product in premium settings, elegant text reveals tagline, soft music, logo fade-in at end`,
        `Lifestyle montage: Happy people using ${brand} in real life, warm colors, subtle brand logo, emotional storytelling`,
        `Behind-the-scenes of ${brand} team crafting the product with passion, text: "Made with Love", end with brand mission`,
      ],
      // Engagement
      Engagement: [
        `Fun challenge: People dancing/using ${brand} creatively to trending sound, text overlay "Join the Challenge!", end with hashtag`,
        `Ask a question: Show ${brand} product + text "Would you try this?", poll sticker prompt, encourage comments`,
        `User-generated content style: Real customers loving ${brand}, text "Tag us with #${brand.replace(/\s+/g, '')}Life"`,
      ],
      // Lead Generation
      "Lead Generation": [
        `Problem-solution format: Show pain point → reveal ${brand} as solution → text "Get Your Free Guide" with link in bio`,
        `Free webinar invite: Professional shot of ${brand} expert, text "Learn How to Grow Your Business", register button`,
        `Free trial offer: ${brand} product showcase + "Start Free for 14 Days" bold text, arrow pointing to link`,
      ],
      // Website Traffic
      "Website Traffic": [
        `Product tour: Smooth transitions showing ${brand} features, text overlays of benefits, final screen "Learn More" with arrow to link`,
        `New collection launch: Fast-paced reveal of ${brand} items, text "Shop the Drop Now", direct link swipe up`,
        `Blog post teaser: Stunning visuals + text "Read: How ${brand} Changed My Life", link in bio callout`,
      ],
    };

    // Audience-specific flavor
    const audienceFlavors = {
      B2B: "professional, clean, trust-building, statistics, results-driven",
      B2C: "emotional, lifestyle, fun, relatable, colorful",
      Casual: "playful, trendy, meme-style, fast cuts, Gen-Z vibe",
      Inspirational: "motivational, uplifting music, success stories, transformation",
      Sales: "urgent, bold offers, countdowns, scarcity triggers",
    };

    const flavor = audienceFlavors[audience] || "modern and engaging";

    // Pick from goal-specific pool
    const goalTemplates = inspirations[goal] || inspirations.Engagement;
    const baseIdea = goalTemplates[Math.floor(Math.random() * goalTemplates.length)];

    // Final personalized description
    const smartDescription = `${baseIdea} — ${type} style, ${flavor} tone, high energy, perfect for social media ads`;

    setPostData(prev => ({
      ...prev,
      description: smartDescription,
    }));

    setError("");
    showToast(`Inspired by ${brand} + ${goal} goal!`);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newUrls = files.map(file => URL.createObjectURL(file));

    if (croppedImages.length > 0) {
      // Add to existing
      setImageSrc(prev => [...prev, ...newUrls]);
      setCroppedImages(prev => [
        ...prev,
        ...Array(newUrls.length).fill(null)
      ]);
      setCurrentCropIndex(croppedImages.length);
    } else {
      // First upload
      setImageSrc(newUrls);
      setCroppedImages(Array(newUrls.length).fill(null));
    }

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

  const cropperRef = useRef(null); // ← ADD THIS

  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;

    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(completedCrop.width);
    canvas.height = Math.floor(completedCrop.height);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    try {
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return;

      const croppedFile = new File([blob], `cropped-${currentCropIndex + 1}.png`, {
        type: 'image/png',
      });

      // Save the cropped image
      setCroppedImages(prev => {
        const updated = [...prev];
        updated[currentCropIndex] = croppedFile;
        return updated;
      });

      // Move to next image or close cropper
      if (currentCropIndex < imageSrc.length - 1) {
        // Not the last image - move to next
        setCurrentCropIndex(prev => prev + 1);
        setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
        setCompletedCrop(null);
      } else {
        // Last image - close the cropper
        setShowCropper(false);
        setCurrentCropIndex(0);
      }
    } catch (error) {
      console.error('Error converting canvas to blob:', error);
    }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  // 1. SKIP CROP – Pure JavaScript, no TS
  const handleSkipCrop = () => {
    const originalUrl = imageSrc[currentCropIndex];
    fetch(originalUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `original-${currentCropIndex + 1}.png`, {
          type: blob.type || 'image/png',
        });
        file.previewUrl = originalUrl; // for preview

        updateCroppedImage(file);
      });
  };

  // 2. UPDATE CROPPED IMAGE – Pure JavaScript
  const updateCroppedImage = (file) => {
    setCroppedImages(prev => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    // Move to next image or finish
    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex(i => i + 1);
      setCrop({ unit: "%", width: 50, x: 25, y: 25, height: 50 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
      setCurrentCropIndex(0);
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

  const handleApplySelected = async () => {
    // Skip cropper for both Text-to-Video AND Script-to-Voiceover videos
    if (
      (activeTab === "Text to Video" || activeTab === "Script to Voiceover to Video") &&
      selectedMedia.length > 0
    ) {
      const videoFiles = selectedMedia.map((video, index) => {
        const file = new File([], `voiceover-video-${index}.mp4`, { type: 'video/mp4' });
        file.previewUrl = video.src;
        file.videoSrc = video.src;
        file.thumbnail = video.thumbnail || null;
        file.skipCrop = true; // extra safety
        return file;
      });

      setCroppedImages(videoFiles);
      setMagicMediaModalOpen(false);
      setSelectedMedia([]);
      showToast(`Applied ${videoFiles.length} voiceover video(s) as background!`);
      return;
    }

    // Existing image logic (unchanged for other tabs)
    if ((magicMediaModalOpen && selectedMedia.length === 0) ||
      (!magicMediaModalOpen && selectedImages.length === 0)) {
      return;
    }

    const newImageUrls = magicMediaModalOpen ? selectedMedia.map(m => m.src || m) : selectedImages;

    showToast(`Preparing ${newImageUrls.length} image${newImageUrls.length > 1 ? 's' : ''} for cropping...`);

    const filePromises = newImageUrls.map(async (url, index) => {
      try {
        const fetchUrl = url.includes('pexels.com') || url.includes('w3schools.com')
          ? `/api/proxy-image?url=${encodeURIComponent(url)}`
          : url;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Failed to fetch");
        const blob = await response.blob();
        const fileName = `selected-${Date.now()}-${index}.${blob.type.split('/')[1] || 'png'}`;
        return new File([blob], fileName, { type: blob.type });
      } catch (err) {
        console.error("Failed to load image:", url, err);
        showToast(`Failed to load image ${index + 1}`);
        return null;
      }
    });

    const newFiles = (await Promise.all(filePromises)).filter(Boolean);
    if (newFiles.length === 0) {
      showToast("No valid images could be loaded.");
      return;
    }

    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    setImageSrc(newUrls);
    setCroppedImages(Array(newUrls.length).fill(null));
    setCurrentCropIndex(0);
    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
    setCompletedCrop(null);

    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);

    setShowCropper(true); // Only show cropper for images
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
    if (source === 'brand' || source === 'recommended') {
      // For brand and recommended images, add to selectedImages for batch processing
      if (!selectedImages.includes(src)) {
        if (selectedImages.length >= 5) {
          showToast("You can only select up to 5 images");
          return;
        }
        setSelectedImages((prev) => [...prev, src]);
      } else {
        setSelectedImages((prev) => prev.filter((img) => img !== src));
      }
    } else {
      // For search/library images
      if (!selectedImages.includes(src)) {
        if (selectedImages.length >= 5) {
          showToast("You can only select up to 5 images");
          return;
        }
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

  useEffect(() => {
    if (!activeBrand) {
      // If no active brand, clear everything (optional)
      setBrandUrl("");
      return;
    }

    if (activeBrand?.images) {
      setPostData(prev => ({
        ...prev,
        importedImages: activeBrand.images.map(i => i.url || i).filter(Boolean),
      }));
    }

    const activeBrandUrl = activeBrand.url || activeBrand.source_url || "";
    const isDefaultState = !brandUrl.trim() || brandUrl === activeBrandUrl;

    // Only prefill if we're in the default/initial state
    if (isDefaultState) {
      setBrandUrl(activeBrandUrl);

      setPostData(prev => ({
        ...prev,
        brandName: activeBrand.name || "",
        projectName: activeBrand.name || "",
        description: activeBrand.description || "",
        primaryColor: activeBrand.primary_color || "#1e3a8a",
        secondaryColor: activeBrand.secondary_color || "#10b981",
        font: activeBrand.fonts || activeBrand.font || "Roboto",
        logo: activeBrand.logo || "",
        caption: prev.caption || `Discover ${activeBrand.name || "our brand"}!`,
        hashtags: prev.hashtags.length > 0 ? prev.hashtags : ["#Brand", "#VideoAd"],
        selectedType: prev.selectedType || "Reels",
      }));
    }
  }, [activeBrand]); // Only runs when activeBrand changes

  useEffect(() => {
    if (!postData.brandName.trim()) {
      setRecommendedImages([]);
      return;
    }

    const fetchRecommendedImages = async () => {
      setIsLoadingRecommended(true);

      try {
        // Build a smart, contextual search query
        const parts = [postData.brandName];

        // Add keywords from description
        const desc = postData.description.toLowerCase();
        if (desc.includes("product") || desc.includes("showcase")) parts.push("product");
        if (desc.includes("team") || desc.includes("office")) parts.push("team office");
        if (desc.includes("luxury") || desc.includes("premium")) parts.push("luxury elegant");
        if (desc.includes("fun") || desc.includes("playful")) parts.push("fun vibrant");
        if (desc.includes("tech") || desc.includes("innovation")) parts.push("technology innovation");
        if (desc.includes("lifestyle")) parts.push("lifestyle");
        if (desc.includes("sale") || desc.includes("discount")) parts.push("sale promotion");

        // Add campaign goal context
        if (postData.campaignGoal === "Sales") parts.push("shop now", "limited offer");
        if (postData.campaignGoal === "Brand Awareness") parts.push("premium", "lifestyle", "aspirational");
        if (postData.campaignGoal === "Engagement") parts.push("happy people", "smiling", "friends");
        if (postData.campaignGoal === "Lead Generation") parts.push("form", "signup", "contact");

        // Always good for ads
        parts.push("marketing", "advertising", "commercial");

        const query = parts.filter(Boolean).join(" ");

        const res = await fetch(
          `/api/pexels?query=${encodeURIComponent(query)}&per_page=20`
        );

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        const images = (data.photos || []).map((photo) => ({
          id: photo.id,
          src: photo.src.medium,
          large: photo.src.large2x || photo.src.large,
          alt: photo.alt || `Recommended for ${postData.brandName}`,
          photographer: photo.photographer,
        }));

        setRecommendedImages(images);
        if (images.length > 0) {
          showToast(`Found ${images.length} relevant images for your brand!`);
        }
      } catch (err) {
        console.warn("Could not load recommended images:", err);
        setRecommendedImages([]); // fallback to empty
        showToast("Using default recommendations");
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    // Debounce so typing brand name doesn't spam API
    const timer = setTimeout(fetchRecommendedImages, 800);
    return () => clearTimeout(timer);
  }, [postData.brandName, postData.description, postData.campaignGoal]);

  // Fetch user images when no imported images exist
  useEffect(() => {
    if (step === 3 && postData.importedImages?.length === 0 && myImages.length === 0 && !myImagesLoading) {
      fetchMyImages();
    }
  }, [step, postData.importedImages, myImages.length, myImagesLoading, fetchMyImages]);

  return (
    <div className='px-14'>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={closeToast}
        duration={1000}  // optional – default is 2000ms
      />

      <div className='font-medium text-xl mb-6'>Video Ads Creatives</div>

      {result ? (
        // Results Section
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">


          <div className="flex justify-between p-3 rounded-lg">
            <div className="font-medium pb-4">Generated Video Ad Creatives</div>

            <button
              onClick={handleBack}
              className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
              aria-label="Back"
            >
              Back
            </button>


          </div>


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
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
              {result.assets?.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => toggleAssetSelection(asset.id)}
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition duration-300 mb-6 break-inside-avoid ${selectedAsset === asset.id ? 'border-blue-700 ring-2 ring-blue-700' : 'border-gray-200 hover:border-blue-500'
                    }`}
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
                      className="w-5 h-5 rounded-full border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition duration-300"
                      aria-label={`Select asset ${asset.alt}`}
                    />
                  </div>

                  <div className="relative w-full h-auto group" style={{ aspectRatio: postData.size.replace('x', '/') }}>
                    {asset.preview && asset.isVideo ? (
                      // It's a video — show video preview
                      <video
                        src={asset.preview}
                        poster={asset.thumbnail}
                        className="w-full h-full object-cover"
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
                        src={asset.preview}
                        alt={asset.alt}
                        className="w-full h-auto object-cover"
                      />
                    )}

                    {/* Play/Pause icon overlay for videos */}
                    {asset.isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 rounded-full p-3 transition-opacity group-hover:opacity-100 opacity-100">
                          <Play className="w-8 h-8 text-white block group-hover:hidden" />
                          <Pause className="w-8 h-8 text-white hidden group-hover:block" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="py-4 px-2 bg-white">
                    <p className="text-sm text-gray-800 truncate">Caption: {postData.caption}</p>
                    <p className="text-sm text-gray-800 truncate">Brand Name: {postData.projectName}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuToggle(asset.id);
                    }}
                    className="absolute top-16 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer transition duration-300 shadow-md z-10"
                    aria-label="Video Options"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {menuOpen === asset.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-24 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[140px]"
                    >
                      <button
                        onClick={() => handlePostNow(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                        aria-label={`Post Now ${asset.alt}`}
                      >
                        Post Now
                      </button>
                      <button
                        onClick={() => handleSchedule(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                        aria-label={`Schedule ${asset.alt}`}
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => handleDownload(asset)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
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
                          placeholder="https://yourdomain.com/"
                          className="flex-1 p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                          aria-label="Brand URL"
                        />
                        <button
                          onClick={handleImportBrand}
                          disabled={importingBrand || !brandUrl}
                          className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm disabled:opacity-50"
                        >
                          {importingBrand ? (
                            <div className='flex gap-2'>
                              <p>Importing</p>
                              <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
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

                      {showInspireConfirm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Replace current description?
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                              This will overwrite your current description
                            </p>
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => setShowInspireConfirm(false)}
                                className="px-2 py-1 cursor-pointer text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 transition duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  setShowInspireConfirm(false);
                                  applySmartInspiration();
                                }}
                                className="px-4 py-1 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                              >
                                Yes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
                            className="px-2 py-2 hover:bg-gray-100 text-gray-900 text-sm border border-gray-200 rounded-md transition duration-200 flex items-center gap-2 cursor-pointer"
                            aria-label="Upload Logo"
                          >
                            <FileUp className="w-5 h-5 text-gray-500" />
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
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                // Fallback if logo URL is broken
                                e.target.style.display = 'none';
                              }}
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
                            className={`cursor-pointer border transition-all duration-200 rounded-lg p-2 text-center text-xs ${postData.selectedType === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
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
                  <div className='flex border-b border-b-gray-200 pb-2 flex-row justify-between items-center gap-2 mb-3 py-2'>
                    <div className='flex gap-2'>
                      <div className='flex bg-gray-100 px-3 rounded-full justify-center items-center'>
                        <Film className='text-blue-700 w-6 h-6' />
                      </div>
                      <div className='flex flex-col justify-center'>
                        <h1 className='font-medium text-lg text-blue-700'>Choose Image</h1>
                        <p className='text-gray-600 text-xs'>Upload or select an image for your video.</p>
                      </div>
                    </div>
                    {selectedImages.length > 0 && (
                      <button
                        onClick={handleApplySelected}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Apply ({selectedImages.length})
                      </button>
                    )}
                  </div>

                  <BrandImagesSection
                    importedImages={postData.importedImages}
                    myImages={myImages}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    showToast={showToast}
                    deleteImage={deleteImage}
                    fetchMyImages={fetchMyImages}
                  />

                  <RecommendedImagesSection
                    brandName={postData.brandName}
                    recommendedImages={recommendedImages}
                    isLoadingRecommended={isLoadingRecommended}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    showToast={showToast}
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

                  {showCropper && (
                    <ImageCropperModal
                      isOpen={showCropper}
                      ref={cropperRef}
                      imageSrc={imageSrc[currentCropIndex]}
                      currentIndex={currentCropIndex}
                      totalImages={imageSrc.length}
                      crop={crop}
                      onCropChange={setCrop}
                      onCropComplete={setCompletedCrop}
                      aspectRatio={
                        postData.size
                          ? eval(postData.size.replace('x', '/').replace(/:/g, '/'))
                          : 1
                      }
                      onSave={saveCroppedImage}
                      onSkip={handleSkipCrop}
                      onCancel={() => {
                        setShowCropper(false);
                        setCurrentCropIndex(0);
                      }}
                      onPrevious={() => {
                        setCurrentCropIndex(prev => prev - 1);
                        setCrop({ unit: "%", width: 50, x: 25, y: 25, height: 50 });
                        setCompletedCrop(null);
                      }}
                    />
                  )}

                  <SearchMediaModal
                    isOpen={searchModalOpen}
                    onClose={() => setSearchModalOpen(false)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    selectedImages={selectedImages}
                    onSelectImage={(src) => handleSelectImage(src, 'search')}
                    onApply={handleApplySelected}
                    onCancel={handleCancelSelection}
                    onAddImageUrl={handleAddImageUrl}
                    postData={postData}        // ← important
                    activeBrand={activeBrand}  // ← from useAuth()
                  />

                  <LibraryMediaModal
                    isOpen={libraryModalOpen}
                    onClose={() => setLibraryModalOpen(false)}
                    searchResults={searchResults}
                    selectedImages={selectedImages}
                    onSelectImage={(src) => handleSelectImage(src, 'library')}
                    onApply={handleApplySelected}
                    onCancel={handleCancelSelection}
                    onUploadClick={() => libraryFileInputRef.current?.click()}
                    importedImages={postData.importedImages} // ← THIS IS THE KEY
                  />

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
                </div>
              )}

              {loading.generate && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50">
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
                  onClick={async () => {
                    setLoading((prev) => ({ ...prev, generate: true }));

                    // Get all valid images (both cropped and selected)
                    const allImages = [...croppedImages];
                    const validImages = allImages.filter((img) => img instanceof File || img instanceof Blob);

                    if (validImages.length === 0) {
                      setError("Please select at least one image");
                      setLoading((prev) => ({ ...prev, generate: false }));
                      return;
                    }

                    // Create preview URLs for each image
                    const imagePreviews = validImages.map(img => URL.createObjectURL(img));

                    const payload = {
                      postData,
                      videos: validImages.map((img, index) => ({
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
                          backgroundImages: imagePreviews,
                        })
                      );
                      setLoading((prev) => ({ ...prev, generate: false }));

                      // Generate 10 results using actual selected images (cycle through if less than 10)
                      const totalResults = 12;
                      const assets = Array.from({ length: totalResults }, (_, index) => {
                        const imageIndex = index % validImages.length;
                        const img = validImages[imageIndex];

                        const isVideo = img?.videoSrc || img?.type?.includes('video');

                        return {
                          id: `video_${index}_${Date.now()}`,
                          src: `generated-video-${index}.${postData.fileFormat || 'mp4'}`,
                          preview: isVideo ? (img.videoSrc || URL.createObjectURL(img)) : URL.createObjectURL(img),
                          thumbnail: img.thumbnail || null,
                          isVideo: isVideo, // ← THIS IS KEY
                          alt: `Generated Video ${index + 1}`,
                          mediaType: 'video',
                          fileFormat: postData.fileFormat || 'mp4',
                        };
                      });

                      setResult({
                        assets,
                        type: null,
                        assetId: null,
                      });
                    }, 5000);
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
