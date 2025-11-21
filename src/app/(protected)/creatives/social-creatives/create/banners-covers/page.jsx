"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, MoreVertical, FileUp, Send, Calendar } from 'lucide-react';
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
import SocialIntegrationModal from '@/app/(protected)/SocialIntegrationModal';

const BannersCreativeWizard = () => {
  const { format } = useParams();
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
  const [selectedModalImages, setSelectedModalImages] = useState([]);
  const [processedAssets, setProcessedAssets] = useState({});
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);

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

  const renderTabContent = () => {
    const tabComponents = {
      'Text to Image': <TextToImageTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
      'Text to Audio': <TextToAudioTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
      'Text to Video': <TextToVideoTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
      'Image to Variations': <ImageToVariationsTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
      'Script to Voiceover to Video': <ScriptToVoiceoverToVideoTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
      'Audio to Text': <AudioToTextTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
      'Persona-based Generator': <PersonaBasedGeneratorTab selectedMedia={selectedModalImages || []} handleSelectMedia={toggleModalImage} />,
    };
    return tabComponents[activeTab] || (
      <div className="h-[100%] overflow-y-auto rounded-lg p-3">Select a tab to view content</div>
    );
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
    } else if (selectedMedia.length + postData.assets.length < 3) {
      setSelectedMedia([...selectedMedia, media]);
    } else {
      alert('You can select up to 3 assets for banner generation.');
    }
  }, [selectedMedia, postData.assets]);

  const onImageLoaded = useCallback((img) => {
    imgRef.current = img;
  }, []);

  const saveCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !currentCropAsset) return;
    setLoading((prev) => ({ ...prev, 3: true }));
    const canvas = document.createElement('canvas');
    const [width, height] = postData.size.split('x').map(Number);
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
      setPostData((prev) => ({ ...prev, assets: [...prev.assets, croppedAsset] }));
      setCropQueue((prev) => {
        const nextQueue = prev.slice(1);
        if (nextQueue.length > 0) {
          setCurrentCropAsset(nextQueue[0]);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: postData.size === '1500x600' ? 20 : postData.size === '1200x628' ? 22.92 : postData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCurrentCropAsset(null);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: postData.size === '1500x600' ? 20 : postData.size === '1200x628' ? 22.92 : postData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        }
        return nextQueue;
      });
      setLoading((prev) => ({ ...prev, 3: false }));
    }, 'image/png');
  }, [completedCrop, currentCropAsset, postData.size]);

  const handleSkipCrop = useCallback(async () => {
    if (!currentCropAsset) return;
    setLoading((prev) => ({ ...prev, 3: true }));
    try {
      const response = await fetch(currentCropAsset.src);
      const blob = await response.blob();
      const file = new File([blob], `original-image.png`, { type: blob.type });
      const url = URL.createObjectURL(file);
      const originalAsset = { id: `original-${Date.now()}`, src: url, alt: 'Original image', type: 'image' };
      setPostData((prev) => ({ ...prev, assets: [...prev.assets, originalAsset] }));
      setCropQueue((prev) => {
        const nextQueue = prev.slice(1);
        if (nextQueue.length > 0) {
          setCurrentCropAsset(nextQueue[0]);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: postData.size === '1500x600' ? 20 : postData.size === '1200x628' ? 22.92 : postData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCurrentCropAsset(null);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: postData.size === '1500x600' ? 20 : postData.size === '1200x628' ? 22.92 : postData.size === '1600x400' ? 15 : 26.34 });
          setCompletedCrop(null);
        }
        return nextQueue;
      });
      setLoading((prev) => ({ ...prev, 3: false }));
    } catch (error) {
      alert('Failed to load the image. Please try again.');
      setLoading((prev) => ({ ...prev, 3: false }));
    }
  }, [currentCropAsset, postData.size]);

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

  const handlePostNow = (asset) => {
    openSocialModal('post', [asset]);
  };

  const handleSchedule = (asset) => {
    openSocialModal('schedule', [asset]);
  };

  const handleDownload = (asset) => {
    setProcessedAssets((prev) => ({ ...prev, [asset.id]: { type: 'download', data: asset.src } }));
    setMenuOpen(null);
  };

  const handleBulkPostNow = () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to post.');
      return;
    }
    const assets = selectedAssets.map(id => result.assets.find(a => a.id === id)).filter(Boolean);
    localStorage.setItem('selectedAssetsForPost', JSON.stringify(assets));
    openSocialModal('post', assets);
    setSelectedAssets([]);
  };

  const handleBulkSchedule = () => {
    const assets = selectedAssets.map(id => result.assets.find(a => a.id === id)).filter(Boolean);
    openSocialModal('schedule', assets);
    setSelectedAssets([]);
  };

  const handleBulkDownload = () => {
    selectedAssets.forEach((assetId) => {
      const asset = result.assets.find((a) => a.id === assetId);
      if (asset) {
        setProcessedAssets((prev) => ({ ...prev, [assetId]: { type: 'download', data: asset.src } }));
      }
    });
    setSelectedAssets([]);
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

  const handleImageSelect = async (asset, source = 'brand') => {
    if (postData.assets.some((item) => item.id === asset.id)) {
      setPostData((prev) => ({ ...prev, assets: prev.assets.filter((item) => item.id !== asset.id) }));
      console.log('Deselected asset:', asset.alt);
    } else if (postData.assets.length < 5) {
      try {
        const response = await fetch(asset.src);
        const blob = await response.blob();
        const file = new File([blob], `image-${asset.id}.png`, { type: blob.type });
        const url = URL.createObjectURL(file);
        const newAsset = { id: `${source}-${asset.id}-${Date.now()}`, src: url, alt: asset.alt, type: 'image' };
        setPostData((prev) => ({ ...prev, assets: [...prev.assets, newAsset] }));
        console.log('Selected asset:', asset.alt);
      } catch (error) {
        console.error('Error selecting asset:', error);
        alert('Failed to load the image. Please try again.');
      }
    } else {
      alert('You can select up to 5 images.');
      console.log('Selection limit reached: 5 images');
    }
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

  const generateBannerVariations = () => {
    const variations = [];
    const baseAssets = postData.assets.length > 0 ? postData.assets : mockAssets.images.slice(0, 1);
    const ratings = generateUniqueRatings(8); // Generate 8 unique ratings
    for (let i = 0; i < 8; i++) {
      const baseAsset = baseAssets[i % baseAssets.length];
      variations.push({
        id: `generated-${Date.now()}-${i}`,
        src: baseAsset.src,
        alt: `Generated banner ${i + 1}`,
        type: 'image',
        caption: postData.caption || `Banner ${i + 1}`,
        hashtags: postData.hashtags.join(' '),
        rating: ratings[i],
      });
    }
    return variations;
  };

  const toggleModalImage = (asset) => {
    if (selectedModalImages.some((item) => item.id === asset.id)) {
      setSelectedModalImages(selectedModalImages.filter((item) => item.id !== asset.id));
    } else if (postData.assets.length + selectedModalImages.length < 5) {
      setSelectedModalImages([...selectedModalImages, asset]);
    } else {
      alert('You can select up to 5 images.');
    }
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

  const handleApplySelected = async () => {
    if (magicMediaModalOpen && selectedModalImages.length === 0) return;
    if (!magicMediaModalOpen && selectedModalImages.length === 0) return;
    if (postData.assets.length + selectedModalImages.length > 5) {
      alert('You can select up to 5 images in total.');
      return;
    }
    const newAssets = await Promise.all(selectedModalImages.map(async (asset) => {
      try {
        const response = await fetch(asset.src);
        const blob = await response.blob();
        const file = new File([blob], `image-${asset.id}.png`, { type: blob.type });
        const url = URL.createObjectURL(file);
        return { id: `modal-${asset.id}-${Date.now()}`, src: url, alt: asset.alt, type: 'image' };
      } catch (error) {
        console.error('Error applying selected asset:', error);
        return null;
      }
    }));
    const validNewAssets = newAssets.filter(Boolean);
    setPostData((prev) => ({ ...prev, assets: [...prev.assets, ...validNewAssets] }));
    setSelectedModalImages([]);
    setMagicMediaModalOpen(false);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    console.log('Applied selected media:', validNewAssets.map(a => a.alt));
  };

  const handleCancelSelection = () => {
    setSelectedModalImages([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    console.log('Selection cancelled');
  };

  const handleAddImageUrl = () => {
    const url = document.getElementById('imageUrlInput')?.value.trim();
    if (!url) return;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(url)) {
      alert('Please enter a valid image URL (e.g., .jpg, .png, .webp)');
      return;
    }
    if (searchResults.some((result) => result.src === url)) {
      alert('This image URL is already added.');
      return;
    }
    try {
      const img = new Image();
      img.onload = () => {
        const [width, height] = postData.size.split('x').map(Number);
        const aspectRatio = width / height;
        const imageAspectRatio = img.width / img.height;
        if (Math.abs(imageAspectRatio - aspectRatio) > 0.05) {
          alert(`Please upload an image with a ${width}:${height} aspect ratio.`);
          return;
        }
        const newId = searchResults.length + 1;
        setSearchResults([{ id: newId, src: url, alt: `User-added image ${newId}`, type: 'image' }, ...searchResults]);
        document.getElementById('imageUrlInput').value = '';
        console.log('Image URL added:', url);
      };
      img.onerror = () => alert('Invalid image URL or image could not be loaded.');
      img.src = url;
    } catch (error) {
      alert('An error occurred while adding the image URL.');
      console.error('Error adding image URL:', error);
    }
  };

  return (
    <div className="px-14">
      <div className="font-medium text-xl">Create Banner</div>

      {result ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Banners</div>

          {selectedAssets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2 mb-4"
            >
              <button
                onClick={handleBulkPostNow}
                className="px-5 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition duration-300 flex items-center gap-2"
                aria-label="Post Now Selected"
              >
                <Send className="w-4 h-4" />
                Post Now
              </button>
              <button
                onClick={handleBulkSchedule}
                className="px-4 py-2 bg-white text-black hover:text-blue-700 rounded-md cursor-pointer border hover:bg-gray-50 hover:border-blue-700 transition duration-300 flex items-center gap-2"
                aria-label="Schedule Selected"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
              <button
                onClick={handleBulkDownload}
                className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-white hover:border hover:border-blue-700 hover:text-blue-700 transition duration-300 flex items-center gap-2"
                aria-label="Download Selected"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </motion.div>
          )}

          <div className="border border-gray-200 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {result.assets?.map((asset) => (
                <div key={asset.id} onClick={() => toggleAssetSelection(asset.id)} className={`relative border rounded-lg overflow-hidden cursor-pointer transition duration-300 ${selectedAssets.includes(asset.id) ? 'border-blue-700' : 'border-gray-200'}`}>
                  <div className="py-3 px-2 bg-white">
                    <p className="text-sm text-gray-800">Rating: {asset.rating}/100</p>
                  </div>
                  <div
                    className="absolute top-16 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition duration-300"
                      aria-label={`Select asset ${asset.alt}`}
                    />
                  </div>
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    className="w-full h-54"
                    style={{ aspectRatio: postData.size.replace('x', '/') }}
                  />
                  <div className="py-4 px-2 bg-white">
                    <p className="text-sm text-gray-800">Caption: {postData.caption}</p>
                    <p className="text-sm text-gray-500">Hashtag: {postData.hashtags}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuToggle(asset.id);
                    }}
                    className="absolute top-16 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer transition duration-300"
                    aria-label="Post Options"
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
                        placeholder="Enter a description for your banner (e.g., 'A vibrant banner for a product launch')"
                        value={postData.description}
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
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Brand Images</h3>
                      {brandAssets.length > 0 ? (
                        <div className="grid grid-cols-5 pb-3 gap-4">
                          {brandAssets.map((asset) => (
                            <div
                              key={asset.id}
                              onClick={() => handleImageSelect(asset, 'brand')}
                              className="cursor-pointer hover:opacity-80 relative"
                              aria-label={`Select ${asset.alt}`}
                            >
                              <img
                                src={asset.src}
                                alt={asset.alt}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              {postData.assets.some((item) => item.id === `brand-${asset.id}-${item.id.split('-')[2]}`) && (
                                <div className="absolute inset-0 border-2 border-blue-700 rounded"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No brand assets available.</p>
                      )}
                      {postData.assets.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h3>
                          <div className="grid grid-cols-5 gap-4">
                            {postData.assets.map((asset) => (
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
                                  onClick={() => handleImageSelect(asset)}
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
                      <p className="text-gray-500 text-xs">Choose an image from your brand, library, or generate one with magic media.</p>
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
                          placeholder="Search for images (e.g., social media post designs)..."
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
                            onClick={() => toggleModalImage(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedModalImages.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedModalImages.some((item) => item.id === result.id) && (
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
                          disabled={selectedModalImages.length === 0}
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
                      <div className="flex justify-between ">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => toggleModalImage(result)}
                          className={`cursor-pointer hover:opacity-80 relative ${selectedModalImages.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                          aria-label={`Select ${result.alt}`}
                        >
                          <img
                            src={result.src}
                            alt={result.alt}
                            className="w-full h-40 object-cover border border-gray-200 rounded"
                          />
                          {selectedModalImages.some((item) => item.id === result.id) && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="absolute right-0 left-0 flex bottom-4 border-t pt-5 border-t-gray-200 flex-row justify-between px-5 items-center">
                      <button
                        onClick={handleApplySelected}
                        disabled={selectedModalImages.length === 0}
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
                        disabled={selectedModalImages.length === 0}
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
                      aspect={postData.size.split('x').map(Number)[0] / postData.size.split('x').map(Number)[1]}
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
                disabled={step === 1 ? (!postData.description || !postData.brandName || !postData.caption || !postData.primaryColor || !postData.secondaryColor || !postData.font) : step === 2 ? (!postData.campaignGoal || !postData.size || !postData.audience) : loading[3]}
                aria-label={step === 3 ? 'Generate' : 'Continue'}
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