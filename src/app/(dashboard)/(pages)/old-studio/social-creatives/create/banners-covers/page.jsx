"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, MoreVertical, FileUp, Send, Calendar, Loader2, Film } from 'lucide-react';
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
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import SocialIntegrationModal from '@/app/(components)/SocialIntegrationModal';
import ResultsGrid from '@/app/(components)/ResultsGrid';
import Toast from '@/app/(components)/Toast';
import BrandImagesSection from '@/app/(components)/BrandImagesSection';
import RecommendedImagesSection from '@/app/(components)/RecommendedImagesSection';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import MagicMediaModal from '@/app/(components)/MagicMediaModal';
import { useAuth } from '@/context/AuthContext';

const BannersCreativeWizard = () => {
  const { activeBrand, sendUrl, myImages = [], myImagesLoading, fetchMyImages, deleteImage } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [brandUrl, setBrandUrl] = useState('');
  const [importedBrand, setImportedBrand] = useState(null);
  const [error, setError] = useState(null);
  const [postData, setPostData] = useState({
    format: 'banners',
    assets: [],
    brandName: '',
    projectName: "",
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
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
    const [importingBrand, setImportingBrand] = useState(false);

  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const cropperRef = useRef(null);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [croppedImages, setCroppedImages] = useState([]);

  // Recommended images
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (msg) => setToast({ isOpen: true, message: msg });
  const closeToast = () => setToast({ isOpen: false, message: "" });

  const [imageSrc, setImageSrc] = useState([]);

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
    { key: "1200x627", value: "1200x627", label: "LinkedIn horizontal", description: "1200x627" },
    { key: "627", value: "627", label: "LinkedIn square", description: "1200x627" },
    { key: "1200x628", value: "1200x628", label: "Google Landscape", description: "1200x628" },
    { key: "1200x1200", value: "1200x1200", label: "Google Square", description: "1200x1200" },
    { key: "9:16", value: "9:16", label: "Tiktok Vertical", description: "9:16" },
    { key: "1:1", value: "1:1", label: "Meta(Facebook & Instagram) square", description: "1:1" },
    { key: "4:5", value: "4:5", label: "Meta(Facebook & Instagram) vertical", description: "4:5" },
    { key: "9:16 ", value: "9:16 ", label: "Meta(Facebook & Instagram) for Stories/Reels", description: "9:16 " },
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
    { value: 'Sales', label: 'Direct / Sales-oriented', description: 'Hot leads, ad audiences' },
  ], []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

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

  const finalizeCroppedImages = () => {
    const final = croppedImages
      .filter(Boolean)
      .map((file, i) => ({
        id: `final-${i}`,
        src: file.previewUrl,
        alt: 'Cropped banner image',
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
        id: `banner-${i + 1}`,
        src: base[i % base.length]?.previewUrl || base[i % base.length]?.src || '/placeholder.png',
        alt: `Banner variation ${i + 1}`,
        rating: Math.floor(Math.random() * 40) + 60,
      }));

      setResult({ assets: variations });
      setLoading(prev => ({ ...prev, generate: false }));
    }, 2000);
  };

  useEffect(() => {
    if (importedBrand) {
      setPostData((prev) => ({
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

  const handleInspireMe = useCallback(() => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setPostData((prev) => ({ ...prev, description: randomPrompt }));
  }, [inspirePrompts]);

  const handleInspire = useCallback(() => {
    if (!postData.description) {
      alert('Please provide a description.');
      return;
    }
    setLoading((prev) => ({ ...prev, 1: true }));
    setTimeout(() => {
      const keywords = postData.description.toLowerCase().split(' ').slice(0, 3);
      const mockSuggestions = {
        caption: `Stunning banner for ${postData.brandName}! ${postData.description.slice(0, 50)}... #${keywords[0] || 'Banner'}`,
        hashtags: [
          `#${postData.brandName.replace(' ', '')}`,
          ...keywords.map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`),
        ].slice(0, 5),
      };
      setPostData((prev) => ({
        ...prev,
        caption: mockSuggestions.caption,
        hashtags: mockSuggestions.hashtags,
      }));
      setLoading((prev) => ({ ...prev, 1: false }));
    }, 1000);
  }, [postData.description, postData.brandName]);

  const handleSizeSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, size: value }));
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: value === '1500x600' ? 20 : value === '1200x628' ? 22.92 : value === '1600x400' ? 15 : 26.34 });
  }, []);

  const handleCampaignGoalSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, campaignGoal: value }));
  }, []);

  const handleAudienceSelect = useCallback((value) => {
    setPostData((prev) => ({ ...prev, audience: value }));
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
      setPostData((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      alert('Please upload a valid image file (e.g., .jpg, .png)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newId = searchResults.length + 1;
      const newAsset = {
        id: newId,
        src: reader.result,
        alt: `Uploaded image ${newId}`,
        type: 'image',
      };
      setSearchResults([newAsset, ...searchResults]);
      setCropQueue([newAsset]);
      setCurrentCropAsset(newAsset);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, [searchResults]);



 const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
  };

  const onImageLoaded = useCallback((img) => {
    imgRef.current = img;
  }, []);

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

  const handleCancelCrop = useCallback(() => {
    setShowCropper(false);
    setCurrentCropAsset(null);
    setCropQueue([]);
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: postData.size === '1500x600' ? 20 : postData.size === '1200x628' ? 22.92 : postData.size === '1600x400' ? 15 : 26.34 });
    setCompletedCrop(null);
  }, [postData.size]);

  const handleMenuToggle = useCallback((assetId) => {
    setMenuOpen(menuOpen === assetId ? null : assetId);
  }, [menuOpen]);

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

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const openSocialModal = (type, assets) => {
    setActionType(type);
    setCurrentAssets(assets);
    setIsSocialModalOpen(true);
  };

  const handleSocialContinue = (selectedPlatform) => {
    setIsSocialModalOpen(false);
    localStorage.setItem('selectedPlatform', JSON.stringify(selectedPlatform));
    localStorage.setItem('actionType', actionType);
    window.open('/PostNow', '_blank');
    currentAssets.forEach(asset => {
      const postId = `POST_${asset.id}_${Date.now()}`;
      setProcessedAssets((prev) => ({ ...prev, [asset.id]: { type: actionType === 'post' ? 'post' : 'schedule', data: postId } }));
    });
  };

  // Function to generate unique unique random ratings between 1 and 100
  const generateUniqueRatings = (count) => {
    const ratings = new Set();
    while (ratings.size < count) {
      const rating = Math.floor(Math.random() * 100) + 1; // Random integer between 1 and 100
      ratings.add(rating);
    }
    return Array.from(ratings);
  };


  const handleContinue = useCallback(() => {
    if (step < steps.length) {
      if (step === 1) {
        if (!postData.description || !postData.brandName || !postData.caption || !postData.primaryColor || !postData.secondaryColor || !postData.font) {
          alert('Please provide brand name, description, caption, colors, and font.');
          console.log('Validation failed: Missing required fields in Step 1');
          return;
        }
        setLoading(prev => ({ ...prev, [step]: true }));
        setTimeout(() => {
          setStep(2);
          setLoading(prev => ({ ...prev, [step]: false }));
          console.log('Advanced to step 2');
        }, 500);
      } else if (step === 2) {
        if (!postData.campaignGoal || !postData.size || !postData.audience) {
          alert('Please select a campaign goal, size, and audience.');
          console.log('Validation failed: Missing campaignGoal, size, or audience');
          return;
        }
        setLoading(prev => ({ ...prev, [step]: true }));
        setTimeout(() => {
          setStep(3);
          setLoading(prev => ({ ...prev, [step]: false }));
          console.log('Advanced to step 3');
        }, 500);
      }
    } else if (step === 3) {
      console.log('Processing step 3: Generating results');
      setLoading(prev => ({ ...prev, 3: true, generate: true }));
      try {
        console.log('Banner Generation Payload:', {
          ...postData,
        });
        const generatedPosts = generateBannerVariations();
        if (generatedPosts && generatedPosts.length > 0) {
          setTimeout(() => {
            setResult({ type: 'generated', assets: generatedPosts });
            setLoading(prev => ({ ...prev, 3: false, generate: false }));
            console.log('Result set successfully with', generatedPosts.length, 'posts');
          }, 1000);
        } else {
          console.error('No posts generated');
          setLoading(prev => ({ ...prev, 3: false, generate: false }));
          alert('Failed to generate posts. Please try again.');
        }
      } catch (error) {
        console.error('Error generating posts:', error);
        setLoading(prev => ({ ...prev, 3: false, generate: false }));
        alert('Failed to generate posts. Please try again.');
      }
    }
  }, [step, postData, postData.assets, mockAssets]);


  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    console.log('Selection cancelled');
  };


  // Prefill from activeBrand
  useEffect(() => {
    if (activeBrand) {
      setPostData(prev => ({
        ...prev,
        brandName: activeBrand.name || '',
        projectName: activeBrand.name || '',
        description: activeBrand.description || '',
        primaryColor: activeBrand.primary_color || activeBrand.primaryColor || '#000000',
        secondaryColor: activeBrand.secondary_color || activeBrand.secondaryColor || '#0066cc',
        font: activeBrand.font || 'Arial',
        logo: activeBrand.logo || null,
        caption: prev.caption || `Check out ${activeBrand.name} banners!`,
        hashtags: prev.hashtags.length > 0 ? prev.hashtags : ['#Banner', '#Design', '#Creative'],
      }));
      if (activeBrand.url) setBrandUrl(activeBrand.url);
    }
  }, [activeBrand]);

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
          alt: p.alt || 'Recommended banner image',
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

  return (
    <div className="px-14">
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={() => setToast({ isOpen: false })} duration={2500} />

      <div className="font-medium text-xl">Create Banner</div>

      {result ? (
        <ResultsGrid
          title="Generated Banners"
          assets={result.assets}
          selectedAssets={selectedAssets}
          onToggleSelection={toggleAssetSelection}
          onBulkPost={() => openSocialModal('post', selectedAssets.map(id => result.assets.find(a => a.id === id)).filter(Boolean))}
          onBulkSchedule={() => openSocialModal('schedule', selectedAssets.map(id => result.assets.find(a => a.id === id)).filter(Boolean))}
          onBulkDownload={() => setSelectedAssets([])}
          onBack={() => { setResult(null); setSelectedAssets([]); }}
          caption={postData.caption}
          hashtags={postData.hashtags}
          size={postData.size}
        />
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
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-surface cursor-pointer
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

          <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-surface rounded-2xl p-4 max-w-5xl  ">
            <div className="">
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
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                        <p className="text-gray-600 text-xs"> Enter details for your banner.</p>
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
                          className="w-full p-3 border bg-surface border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
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
                          className="w-full p-3 border bg-surface border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Project Name"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        placeholder="Enter a description for your banner (e.g., 'A vibrant banner for a product launch')"
                        value={postData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                        aria-label="Banner Description"
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
                    <div className='flex flex-row justify-between gap-4'>
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
                      <div className='flex flex-col justify-center flex-1'>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="px-2 py-1 border text-gray-500 hover:text-blue-700 transition duration-300 ease-in-out font-medium border-gray-200 hover:border-blue-700 rounded flex items-center gap-2 cursor-pointer"
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
                            placeholder="Hashtags (e.g., #Banner #Brand)"
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
                        className="px-5 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2">
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
                            <div key={i} className="relative group rounded-lg overflow-hidden border-2 border-blue-700">
                              {isVideo ? (
                                <video
                                  src={item.previewUrl}
                                  poster={item.thumbnail}
                                  className="w-full h-full object-cover"
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
                                  className="w-full h-full object-cover"
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

                  {/* Upload Buttons */}
                  <div className='flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center'>
                    <div><FileUp className="w-10 h-10 text-gray-500" /></div>
                    <h3 className='text-md font-semibold text-gray-700'>Upload Media</h3>
                    <p className='text-gray-500 text-xs'>Choose images from your brand, library, or generate with Magic Media.</p>
                    <div className='flex gap-4'>
                      <button onClick={() => setSearchModalOpen(true)} className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3'>
                        <div className='text-sm font-medium'>Search Media</div>
                        <div className='mt-0.5'><FileSearch className='w-4 h-4' /></div>
                      </button>
                      <button onClick={() => setLibraryModalOpen(true)} className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3'>
                        <div className='text-sm font-medium'>Your Library</div>
                        <div className='mt-0.5'><FolderOpen className='w-4 h-4' /></div>
                      </button>
                      <button onClick={() => setMagicMediaModalOpen(true)} className='flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3'>
                        <div className='text-sm font-medium'>Magic Media</div>
                        <div className='mt-0.5'><Film className='w-4 h-4' /></div>
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

              <SearchMediaModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)}
                selectedImages={selectedImages} onSelectImage={(src) => {
                  setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
                }} onApply={handleApplySelected} />

              <LibraryMediaModal isOpen={libraryModalOpen} onClose={() => setLibraryModalOpen(false)}
                selectedImages={selectedImages} onSelectImage={(src) => {
                  setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
                }} onApply={handleApplySelected} />

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
                <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50">
                  <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                    <FloatingAnimation showProgressBar={true}>
                      <FloatingElements.ImageFile />
                    </FloatingAnimation>
                  </div>
                </div>
              )}

            </div>


            {/* Buttons */}
            <div className="flex justify-between items-center pt-6 ">
              <button
                onClick={() => step === 1 ? window.history.back() : setStep(step - 1)}
                className="px-6 py-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={() => step === 3 ? handleGenerate() : setStep(step + 1)}
                className="px-8 py-2 cursor-pointer bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2">
                {loading.generate ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 3 ? 'Generate' : 'Continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      <SocialIntegrationModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        onContinue={handleSocialContinue}
        actionType={actionType}
      />
    </div>
  );
};

export default BannersCreativeWizard;