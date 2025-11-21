"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, MoreVertical, Video, Send, Calendar } from 'lucide-react';
import { motion } from "framer-motion";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useParams } from 'next/navigation';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';
import SocialIntegrationModal from '@/app/(protected)/SocialIntegrationModal';

const MemesCreativeWizard = () => {
  const { format } = useParams();
  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [postData, setPostData] = useState({
    format: 'memes',
    assets: [],
    brandName: '',
    projectName: "",
    description: '',
    caption: '',
    hashtags: [],
    size: '',
    campaignGoal: '',
    audience: '',
    fileFormat: '',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    logo: null,
  });
  const [brandUrl, setBrandUrl] = useState('');
  const [error, setError] = useState('');
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppingQueue, setCroppingQueue] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });
  const [result, setResult] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Text to Image');
  const [searchQuery, setSearchQuery] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [searchResults, setSearchResults] = useState([
    { id: 1, src: 'https://images.pexels.com/photos/4089658/pexels-photo-4089658.jpeg', alt: 'Meme 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg', alt: 'Meme 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg', alt: 'Meme 3', type: 'image' },
  ]);
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
      { id: 1, src: 'https://images.pexels.com/photos/4089658/pexels-photo-4089658.jpeg', alt: 'Meme 1', type: 'image' },
      { id: 2, src: 'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg', alt: 'Meme 2', type: 'image' },
      { id: 3, src: 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg', alt: 'Meme 3', type: 'image' },
      { id: 4, src: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg', alt: 'Meme 4', type: 'image' },
      { id: 5, src: 'https://images.pexels.com/photos/2558605/pexels-photo-2558605.jpeg', alt: 'Meme 5', type: 'image' },
      { id: 6, src: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg', alt: 'Meme 6', type: 'image' },
      { id: 7, src: 'https://images.pexels.com/photos/1769524/pexels-photo-1769524.jpeg', alt: 'Meme 7', type: 'image' },
      { id: 8, src: 'https://images.pexels.com/photos/3606950/pexels-photo-3606950.jpeg', alt: 'Meme 8', type: 'image' },
    ],
  }), []);

  const steps = useMemo(() => [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Size & Goals', icon: <Image className="h-5 w-5" /> },
    { id: 3, title: 'Images', icon: <Download className="h-5 w-5" /> },
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
    { value: 'Impact', label: 'Impact' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  ], []);

  const fileFormatOptions = useMemo(() => [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'GIF', label: 'GIF' },
    { value: 'WEBP', label: 'WEBP' },
  ], []);

  const inspirePrompts = useMemo(() => [
    'A hilarious meme for a viral campaign',
    'A trendy meme for Gen Z audience',
    'A bold meme with a humorous caption',
    'A relatable meme for social media engagement',
  ], []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleSelectMedia = useCallback((media) => {
    setSelectedMedia((prev) =>
      prev.some((item) => item.id === media.id)
        ? prev.filter((item) => item.id !== media.id)
        : [...prev, media]
    );
  }, []);

  const renderTabContent = useCallback(() => {
    const tabComponents = {
      'Text to Image': <TextToImageTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Text to Audio': <TextToAudioTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Text to Video': <TextToVideoTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Image to Variations': <ImageToVariationsTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Script to Voiceover to Video': <ScriptToVoiceoverToVideoTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Audio to Text': <AudioToTextTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
      'Persona-based Generator': <PersonaBasedGeneratorTab selectedMedia={selectedMedia} handleSelectMedia={handleSelectMedia} />,
    };
    return tabComponents[activeTab] || (
      <div className="h-[100%] overflow-y-auto rounded-lg p-3">Select a tab to view content</div>
    );
  }, [activeTab, selectedMedia, handleSelectMedia]);


  const handleSearchImages = useCallback(() => {
    setSearchModalOpen(true);
  }, []);

  const handleUploadImages = useCallback(() => {
    setLibraryModalOpen(true);
  }, []);

  const handleMagicMedia = useCallback(() => {
    setMagicMediaModalOpen(true);
  }, []);


  const handleGenerateMagicMedia = useCallback(() => {
    if (!magicPrompt) {
      alert('Please enter a prompt for Magic Media.');
      return;
    }
    setLoading((prev) => ({ ...prev, generate: true }));
    setTimeout(() => {
      const mockGeneratedImages = [
        { id: `magic-${Date.now()}-1`, src: 'https://images.pexels.com/photos/4089658/pexels-photo-4089658.jpeg', alt: `Magic Media 1`, type: 'image' },
        { id: `magic-${Date.now()}-2`, src: 'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg', alt: `Magic Media 2`, type: 'image' },
      ];
      setSearchResults((prev) => [...mockGeneratedImages, ...prev].slice(0, 8));
      setSelectedMedia((prev) => [...prev, ...mockGeneratedImages]);
      setMagicPrompt('');
      setLoading((prev) => ({ ...prev, generate: false }));
    }, 1500);
  }, [magicPrompt]);

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    setLoading((prev) => ({ ...prev, 3: true }));
    const newAssets = [];
    let processed = 0;

    files.forEach((file) => {
      if (!validExtensions.test(file.name)) {
        alert(`Invalid file: ${file.name}. Please upload a valid image file (e.g., .jpg, .png).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result;
        const newAsset = { id: Date.now() + processed, src: url, alt: `Uploaded meme ${processed + 1}`, type: 'image' };
        newAssets.push(newAsset);
        processed++;
        if (processed === files.length) {
          setSearchResults((prev) => [...newAssets, ...prev].slice(0, 8));
          setSelectedMedia((prev) => [...prev, ...newAssets]);
          setLoading((prev) => ({ ...prev, 3: false }));
          console.log('Images uploaded:', newAssets.length);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;

      setPostData((prev) => ({ ...prev, [field]: sanitizedValue }));
    } else if (field === 'hashtags') {
      // Value is already an array from input's onChange
      setPostData((prev) => ({
        ...prev,
        [field]: value.filter((tag) => tag.startsWith('#')).slice(0, 5),
      }));
    } else {
      setPostData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleDescriptionChange = useCallback((e) => {
    setPostData((prev) => ({ ...prev, description: e.target.value }));
  }, []);

  const handleInspireMe = useCallback(() => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setPostData((prev) => ({ ...prev, description: randomPrompt }));
  }, [inspirePrompts]);

  const handleImportBrand = useCallback(() => {
    if (!brandUrl) {
      setError('Please enter a valid URL.');
      return;
    }
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;
    if (!urlRegex.test(brandUrl)) {
      setError('Invalid URL format.');
      return;
    }
    setLoading((prev) => ({ ...prev, 1: true }));
    setError('');
    setTimeout(() => {
      // Mock brand data import
      setPostData((prev) => ({
        ...prev,
        brandName: prev.brandName || 'Imported Brand',
        description: prev.description || 'Imported meme description',
        caption: prev.caption || 'Imported caption',
        hashtags: prev.hashtags.length ? prev.hashtags : ['#Imported', '#Meme'],
      }));
      setBrandUrl('');
      setLoading((prev) => ({ ...prev, 1: false }));
    }, 1000);
  }, [brandUrl]);

  const handleInspire = useCallback(() => {
    if (!postData.description) {
      alert('Please provide a description.');
      return;
    }
    setLoading((prev) => ({ ...prev, 1: true }));
    setTimeout(() => {
      const keywords = postData.description.toLowerCase().split(' ').slice(0, 3);
      const mockSuggestions = {
        caption: `Funny meme for ${postData.brandName}! ${postData.description.slice(0, 50)}... #${keywords[0] || 'Meme'}`,
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
    setPostData((prev) => ({
      ...prev,
      size: prev.size === value ? '' : value,
    }));
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  }, []);

  const handleCampaignGoalSelect = useCallback((value) => {
    setPostData((prev) => ({
      ...prev,
      campaignGoal: prev.campaignGoal === value ? '' : value,
    }));
  }, []);

  const handleAudienceSelect = useCallback((value) => {
    setPostData((prev) => ({
      ...prev,
      audience: prev.audience === value ? '' : value,
    }));
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

  const onImageLoaded = useCallback((img) => {
    imgRef.current = img;
  }, []);

  const saveCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !croppingQueue[currentCropIndex]) return;
    setLoading((prev) => ({ ...prev, 3: true }));
    const canvas = document.createElement('canvas');
    const [width, height] = (postData.size || '1080x1080').split('x').map(Number);
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
      const file = new File([blob], `cropped-meme-${currentCropIndex + 1}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      const croppedAsset = { id: `cropped-${Date.now()}`, src: url, alt: `Cropped meme ${currentCropIndex + 1}`, type: 'image' };
      setSelectedAssets((prev) => [...prev, croppedAsset]);
      setPostData((prev) => ({ ...prev, assets: [...prev.assets, croppedAsset] }));
      setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
      setCompletedCrop(null);
      if (currentCropIndex < croppingQueue.length - 1) {
        setCurrentCropIndex((prev) => prev + 1);
      } else {
        setShowCropper(false);
        setCroppingQueue([]);
        setCurrentCropIndex(0);
        setSelectedMedia([]);
      }
      setLoading((prev) => ({ ...prev, 3: false }));
      console.log('Cropped image saved:', url);
    }, 'image/png');
  }, [completedCrop, croppingQueue, currentCropIndex, postData.size]);

  const handleSkipCrop = useCallback(async () => {
    if (!croppingQueue[currentCropIndex]) return;
    setLoading((prev) => ({ ...prev, 3: true }));
    try {
      const response = await fetch(croppingQueue[currentCropIndex].src);
      const blob = await response.blob();
      const file = new File([blob], `original-meme-${currentCropIndex + 1}.png`, { type: blob.type });
      const url = URL.createObjectURL(file);
      const originalAsset = { id: `original-${Date.now()}`, src: url, alt: `Original meme ${currentCropIndex + 1}`, type: 'image' };
      setSelectedAssets((prev) => ([...prev, originalAsset]));
      setPostData((prev) => ({ ...prev, assets: [...prev.assets, originalAsset] }));
      setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
      setCompletedCrop(null);
      if (currentCropIndex < croppingQueue.length - 1) {
        setCurrentCropIndex((prev) => prev + 1);
      } else {
        setShowCropper(false);
        setCroppingQueue([]);
        setCurrentCropIndex(0);
        setSelectedMedia([]);
      }
      setLoading((prev) => ({ ...prev, 3: false }));
    } catch (error) {
      alert('Failed to load the image. Please try again.');
      setLoading((prev) => ({ ...prev, 3: false }));
    }
  }, [croppingQueue, currentCropIndex]);

  const handleCancelCrop = useCallback(() => {
    setShowCropper(false);
    setCroppingQueue([]);
    setCurrentCropIndex(0);
    setSelectedMedia([]);
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
    setCompletedCrop(null);
  }, []);

  const generateMeme = useCallback(() => {
    const selected = selectedAssets.length > 0 ? selectedAssets : mockAssets.images;
    const assets = [...selected, ...mockAssets.images].slice(0, 8); // Ensure exactly 8 assets
    return assets.map((asset, index) => ({
      id: `generated-${Date.now()}-${index}`,
      src: asset.src,
      alt: `Generated meme ${index + 1}`,
      type: 'image',
      caption: postData.caption || 'Meme',
      hashtags: postData.hashtags.join(' '),
    }));
  }, [selectedAssets, postData.caption, postData.hashtags, mockAssets.images]);

  const handleExport = useCallback(() => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset.');
      return;
    }
    setLoading((prev) => ({ ...prev, 3: true, generate: true }));
    try {
      console.log('Meme Generation Payload:', {
        ...postData,
        assets: selectedAssets,
        timestamp: new Date().toISOString(),
      });
      const generatedMemes = generateMeme();
      if (generatedMemes && generatedMemes.length > 0) {
        setTimeout(() => {
          setResult({ type: 'generated', assets: generatedMemes });
          setLoading((prev) => ({ ...prev, 3: false, generate: false }));
        }, 1000);
      } else {
        setLoading((prev) => ({ ...prev, 3: false, generate: false }));
        alert('Failed to generate memes. Please try again.');
      }
    } catch (error) {
      setLoading((prev) => ({ ...prev, 3: false, generate: false }));
      alert('Failed to generate memes. Please try again.');
    }
  }, [selectedAssets, postData, generateMeme]);

  const handleDownload = useCallback((asset) => {
    const link = document.createElement('a');
    link.href = asset.src;
    link.download = `${asset.alt}.${postData.fileFormat.toLowerCase()}`;
    link.click();
    setResult({ type: 'export', url: asset.src, assetId: asset.id });
    setMenuOpen(null);
  }, [postData.fileFormat]);

  const handleSchedule = useCallback((asset) => {
    setLoading((prev) => ({ ...prev, 3: true }));
    setTimeout(() => {
      setResult({ type: 'schedule', status: 'scheduled', postId: `13579-${asset.id}`, assetId: asset.id });
      setLoading((prev) => ({ ...prev, 3: false }));
      setMenuOpen(null);
      console.log('Schedule triggered: Post ID', `13579-${asset.id}`);
    }, 1000);
  }, []);

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

  const generateThumbnail = () => {
    const variations = [];
    const baseAssets = postData.assets.length > 0 ? postData.assets : mockAssets.images.slice(0, 1);
    const ratings = generateUniqueRatings(8); // Generate 8 unique ratings
    for (let i = 0; i < 8; i++) {
      const baseAsset = baseAssets[i % baseAssets.length];
      variations.push({
        id: `generated-${Date.now()}-${i}`,
        src: baseAsset.src,
        alt: `Generated thumbnail ${i + 1}`,
        type: 'image',
        caption: postData.caption || `Thumbnail ${i + 1}`,
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
        console.log('Thumbnail Generation Payload:', {
          ...postData,
        });
        const generatedPosts = generateThumbnail();
        if (generatedPosts && generatedPosts.length > 0) {
          setTimeout(() => {
            setResult({ type: 'generated', assets: generatedPosts });
            setLoading(prev => ({ ...prev, 3: false, generate: false }));
            console.log('Result set successfully with', generatedPosts.length, 'posts');
          }, 1000);
        } else {
          console.error('No posts generated');
          setLoading(prev => ({ ...prev, 3: false, generate: false }));
          alert('Failed to generate thumbnails. Please try again.');
        }
      } catch (error) {
        console.error('Error generating thumbnails:', error);
        setLoading(prev => ({ ...prev, 3: false, generate: false }));
        alert('Failed to generate thumbnails. Please try again.');
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
      <div className="font-medium text-xl">Create Social Media Meme</div>

      {result ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Memes</div>

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

          <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-2xl p-4 ">
            <div className="overflow-auto">
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

                  <div className="space-y-5 flex flex-col border rounded-md border-gray-200 p-3">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="flex flex-col border rounded-md border-gray-200 p-3 justify-center">
                      <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                      <p className="text-gray-600 text-xs">Enter details for your meme.</p>
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
                        placeholder="Enter a description for your meme')"
                        value={postData.description}
                        onChange={handleDescriptionChange}
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
                    <div className="flex flex-row justify-between gap-4">
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
                      <div className="flex flex-col justify-center flex-1">
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
                            placeholder="Hashtags "
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
                        <h1 className="font-medium text-lg text-blue-700">Size & Goals</h1>
                        <p className="text-gray-600 text-xs">Select size, campaign goals, and audience for your memes.</p>
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
                        <h1 className="font-medium text-lg text-blue-700">Images</h1>
                        <p className="text-gray-600 text-xs">Select images for your memes.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="border border-gray-200 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Brand Images</h3>
                      {brandAssets.length > 0 ? (
                        <div className="grid grid-cols-5 gap-4">
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
                      <h3 className="text-md font-semibold text-gray-700">Select Image</h3>
                      <p className="text-gray-500 text-xs">Choose images from your brand, library, or generate with magic media.</p>
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

            </div>
            <div className="flex justify-between p-3 rounded-lg">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                  aria-label="Back"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleContinue}
                className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white py-2 px-3 items-center text-sm font-medium"
                disabled={step === 1 ? (!postData.description || !postData.brandName || !postData.caption || !postData.primaryColor || !postData.secondaryColor || !postData.font) : step === 2 ? (!postData.campaignGoal || !postData.size || !postData.audience) : loading[3] || postData.assets.length === 0}
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

      {showCropper && croppingQueue[currentCropIndex] && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
          <div className="relative w-[700px] h-[600px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
            <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
              Cropping {currentCropIndex + 1} of {croppingQueue.length}
            </div>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img
                ref={imgRef}
                alt={`Crop ${currentCropIndex + 1}`}
                src={croppingQueue[currentCropIndex].src}
                onLoad={(e) => onImageLoaded(e.currentTarget)}
                onError={() => console.error(`Failed to load crop image: ${croppingQueue[currentCropIndex].src}`)}
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


      <SocialIntegrationModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        onContinue={handleSocialContinue}
        actionType={actionType}
      />
    </div>
  );
};

export default MemesCreativeWizard;