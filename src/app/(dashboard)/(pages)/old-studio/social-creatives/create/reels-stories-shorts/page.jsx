"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, MoreVertical, Image, Play, Send, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';
import SearchMediaModal from '@/app/(components)/SearchMediaModal';
import LibraryMediaModal from '@/app/(components)/LibraryMediaModal';
import MagicMediaModal from '@/app/(components)/MagicMediaModal';
import ImageCropperModal from '@/app/(components)/ImageCropperModal';
import ResultsGrid from '@/app/(components)/ResultsGrid';
import BrandImagesSection from '@/app/(components)/BrandImagesSection';
import RecommendedImagesSection from '@/app/(components)/RecommendedImagesSection';
import SocialIntegrationModal from '@/app/(components)/SocialIntegrationModal';
import TextToImageTab from '../../../designer-creatives/create/tabs/text-to-image/page';
import TextToAudioTab from '../../../designer-creatives/create/tabs/text-to-audio/page';
import TextToVideoTab from '../../../designer-creatives/create/tabs/text-to-video/page';
import ImageToVariationsTab from '../../../designer-creatives/create/tabs/image-to-variations/page';
import ScriptToVoiceoverToVideoTab from '../../../designer-creatives/create/tabs/script-to-voiceover/page';
import AudioToTextTab from '../../../ai-studio/create/audio-to-text/page';
import PersonaBasedGeneratorTab from '../../../designer-creatives/create/tabs/persona-based-generator/page';

const ShortVideoCreativeWizard = () => {
  const { format } = useParams();
  const router = useRouter();
  const { activeBrand, sendUrl, myImages = [], myImagesLoading, fetchMyImages, deleteImage } = useAuth();

  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState('');
  const [importedBrand, setImportedBrand] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [processedAssets, setProcessedAssets] = useState({});
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [currentAssets, setCurrentAssets] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const [postData, setPostData] = useState({
    format: 'short-videos',
    assets: [],
    brandName: '',
    projectName: "",
    description: '',
    caption: '',
    hashtags: [],
    size: '1080x1920',
    campaignGoal: '',
    fileFormat: 'MP4',
    primaryColor: '#000000',
    secondaryColor: '#0066cc',
    font: 'Arial',
    logo: null,
    audience: '',
  });

  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropAsset, setCurrentCropAsset] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 88.89 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const cropperRef = useRef(null);

  // Media modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Text to Video');
  const [selectedModalImages, setSelectedModalImages] = useState([]);

  // Recommended images
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const inspirePrompts = [
    'A dynamic short video for a product launch',
    'A trendy short video for a fashion campaign',
    'An engaging short video for a fitness challenge',
    'A storytelling short video for a brand announcement',
    'A vibrant short video for a travel vlog',
  ];

  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (msg) => setToast({ isOpen: true, message: msg });
  const closeToast = () => setToast({ isOpen: false, message: "" });

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
    { value: 'Website Traffic', label: 'Website Traffic' },
    { value: 'Lead Generation', label: 'Lead Generation' },
  ];

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
  ];

  const fileFormatOptions = [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'AVIF', label: 'AVIF' },
    { value: 'WEBP', label: 'WEBP' },
  ];

  const mockAssets = {
    images: [
      { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'Image 1', type: 'image' },
      { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'Image 2', type: 'image' },
      { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'Image 3', type: 'image' },
    ],
  };

  const steps = [
    { id: 1, title: 'Brand Details', icon: <Video className="h-5 w-5" /> },
    { id: 2, title: 'Size, Goals & Audience', icon: <Video className="h-5 w-5" /> },
    { id: 3, title: 'Image', icon: <Download className="h-5 w-5" /> },
  ];

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
        hashtags: prev.hashtags.length > 0 ? prev.hashtags : ['#ShortVideo', '#Reels', '#Viral'],
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

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError('Please enter a valid URL.');
    setLoading(prev => ({ ...prev, 1: true }));
    setError('');
    try {
      const res = await sendUrl(brandUrl);
      const imported = res?.data;
      if (!imported) throw new Error('No data');
      setImportedBrand(imported);
    } catch (err) {
      setError('Failed to import brand. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, 1: false }));
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'primaryColor' || field === 'secondaryColor') {
      const sanitized = value.startsWith('#') ? value : `#${value}`;
      setPostData(prev => ({ ...prev, [field]: sanitized }));
    } else {
      setPostData(prev => ({ ...prev, [field]: value }));
    }
    setError('');
  };

  const handleDescriptionChange = (e) => {
    setPostData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setPostData(prev => ({ ...prev, description: randomPrompt }));
  };

  const handleSizeSelect = (value) => {
    setPostData(prev => ({ ...prev, size: value }));
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: value === '1080x1920' ? 88.89 : 100 });
  };

  const handleCampaignGoalSelect = (value) => {
    setPostData(prev => ({ ...prev, campaignGoal: value }));
  };

  const handleAudienceSelect = (value) => {
    setPostData(prev => ({ ...prev, audience: value }));
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
    const images = sources.filter(item =>
      !item.type || item.type === 'image' ||
      (typeof item.src === 'string' && !item.src.includes('.mp4') && !item.videoSrc)
    );

    const videos = sources.filter(item =>
      item.type === 'video' ||
      item.videoSrc ||
      (typeof item.src === 'string' && item.src.includes('.mp4'))
    );

    let finalImageFiles = [];
    let finalVideoFiles = [];

    // Handle images → go to cropper (with 100% working proxy)
    if (images.length > 0) {
      try {
        const files = await Promise.all(
          images.map(async (item, index) => {
            let url = item.src || item.large || item;

            // Only proxy external HTTP/HTTPS URLs
            const shouldProxy = typeof url === 'string' && url.startsWith('http') && !url.startsWith('data:');

            const fetchUrl = shouldProxy
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;

            const res = await fetch(fetchUrl);

            if (!res.ok) {
              console.error(`Failed to fetch image ${index + 1}:`, res.status, url);
              throw new Error(`Failed to load image`);
            }

            const blob = await res.blob();

            // Preserve original filename if possible, fallback to generic
            const filename = item.filename || item.alt || `image-${Date.now()}-${index}.png`;

            const file = new File([blob], filename, { type: blob.type || 'image/png' });
            file.previewUrl = URL.createObjectURL(blob); // Important for preview

            return file;
          })
        );

        const previewUrls = files.map(f => f.previewUrl);
        setImageSrc(prev => [...prev, ...previewUrls]);
        setCroppedImages(prev => [...prev, ...Array(previewUrls.length).fill(null)]);
        setCurrentCropIndex(imageSrc.length); // Start from current total

        finalImageFiles = files;

        setShowCropper(true);
        showToast(`Added ${images.length} image(s) — now crop them`);
      } catch (err) {
        console.error('Error processing images:', err);
        showToast('Some images failed to load. Please try again.');
      };
    }


    // Handle videos → skip cropper
    if (videos.length > 0) {
      finalVideo = videos.map((video, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: video.videoSrc || video.src || video.large,
        thumbnail: video.thumbnail || video.image || video.src,
        type: 'video',
        alt: video.alt || 'Generated video',
        original: video,
      }));

      // Add videos directly to croppedImages (as plain objects)
      setCroppedImages(prev => [...prev, ...finalVideo]);
      showToast(`Added ${videos.length} video(s) — ready to generate!`);
    }

    // If only videos → skip cropper, go straight to finalize
    if (images.length === 0 && videos.length > 0) {
      finalizeCroppedImages();
      setShowCropper(false);
    }

    // Reset modals & selections
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
  };

  const handleCancelSelection = () => {
    setSelectedModalImages([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const generateUniqueRatings = (count) => {
    const ratings = new Set();
    while (ratings.size < count) ratings.add(Math.floor(Math.random() * 100) + 1);
    return Array.from(ratings);
  };

  const generateVideoVariations = () => {
    // Use croppedImages first (real user selections), then fallback
    const baseAssets = croppedImages.filter(Boolean).length > 0
      ? croppedImages.filter(Boolean)
      : (postData.assets.length > 0 ? postData.assets : mockAssets.images);

    const ratings = generateUniqueRatings(8);

    return Array.from({ length: 8 }, (_, i) => {
      const baseAsset = baseAssets[i % baseAssets.length];

      // Check if it's a video using multiple indicators
      const isVideo = baseAsset?.videoSrc ||
        baseAsset?.type === 'video' ||
        (typeof baseAsset?.previewUrl === 'string' && baseAsset.previewUrl.includes('.mp4'));

      // Get the correct URLs
      const videoSrc = isVideo ? (baseAsset.videoSrc || baseAsset.previewUrl) : null;
      const thumbnail = baseAsset.thumbnail || (isVideo ? baseAsset.src : null);
      const previewUrl = isVideo
        ? (baseAsset.videoSrc || baseAsset.previewUrl)
        : (baseAsset.src || baseAsset.previewUrl);

      return {
        id: `generated-${Date.now()}-${i}`,
        src: previewUrl,
        preview: previewUrl,
        thumbnail: thumbnail,
        isVideo: isVideo,           // ← KEY FLAG for ResultsGrid
        videoSrc: videoSrc,         // ← Actual video source
        alt: `Short video variation ${i + 1}`,
        type: 'video',
        caption: postData.caption || 'Check out this amazing short video!',
        hashtags: postData.hashtags.length > 0 ? postData.hashtags.join(' ') : '#Shorts #Reels #Viral',
        rating: ratings[i],
        duration: `${Math.floor(Math.random() * 30) + 10}s`,
        projectName: postData.projectName, // ← For display in ResultsGrid
      };
    });
  };

  const handleGenerate = () => {
    setLoading(prev => ({ ...prev, generate: true }));
    setTimeout(() => {
      const videos = generateVideoVariations();
      setResult({ type: 'generated', assets: videos });
      setLoading(prev => ({ ...prev, generate: false }));
    }, 2000);
  };

  const onImageLoaded = (img) => {
    imgRef.current = img;
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

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCurrentCropAsset(null);
  };

  const handleContinue = useCallback(() => {
    if (step < steps.length) {
      if (step === 1 && (!postData.brandName || !postData.description || !postData.caption)) {
        alert('Please fill in brand name, description, and caption.');
        return;
      }
      if (step === 2 && (!postData.size || !postData.campaignGoal || !postData.audience)) {
        alert('Please select size, campaign goal, and audience.');
        return;
      }
      setStep(step + 1);
    } else if (step === 3) {
      handleGenerate();
    }
  }, [step, postData]);

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push('/creatives/designer-creatives');
  };

  const toggleAssetSelection = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openSocialModal = (type, assets) => {
    setActionType(type);
    setCurrentAssets(assets);
    setIsSocialModalOpen(true);
  };

  const handleSocialContinue = (platform) => {
    setIsSocialModalOpen(false);
    currentAssets.forEach(asset => {
      setProcessedAssets(prev => ({ ...prev, [asset.id]: { type: actionType === 'post' ? 'post' : 'schedule', data: `POST_${asset.id}` } }));
    });
  };

  const handleSelectMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia(selectedMedia.filter((media) => media !== src));
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, src]);
    }
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

  const handleDownload = (asset) => {
    const link = document.createElement('a');
    link.href = asset.src;
    link.download = `video_${asset.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setProcessedAssets(prev => ({ ...prev, [asset.id]: { type: 'download', data: asset.src } }));
  };

  const handlePostNow = (asset) => {
    openSocialModal('post', [asset]);
  };

  const handleSchedule = (asset) => {
    openSocialModal('schedule', [asset]);
  };

  const brandAssets = activeBrand?.assets?.slice(0, 5) || mockAssets.images;

  return (
    <div className="px-14">
      <div className="font-medium text-xl">Create Short Video</div>

      {result ? (
        <ResultsGrid
          title="Generated Videos"
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
          processedAssets={processedAssets}
          onPostNow={handlePostNow}
          onSchedule={handleSchedule}
          onDownload={handleDownload}
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

          <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-surface rounded-2xl p-4 max-w-5xl">
            <div className="overflow-auto">
              {/* Step 1: Brand Details */}
              {step === 1 && (
                <div className='flex flex-col gap-3'>
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex px-1 gap-2">
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
                        />
                        <button
                          onClick={handleImportBrand}
                          className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white px-4 items-center text-sm"
                          disabled={loading[1] || !brandUrl}
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
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <div className="flex border border-gray-200 rounded-md py-2 px-2 gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Video className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Brand Details</h1>
                        <p className="text-gray-600 text-xs">Enter details for your short video.</p>
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
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        placeholder="Enter a description for your video"
                        value={postData.description}
                        onChange={handleDescriptionChange}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                      />
                      <button
                        onClick={handleInspireMe}
                        className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-surface cursor-pointer transition duration-300 text-sm"
                      >
                        Inspire Me
                      </button>
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
                        <select value={postData.font} onChange={(e) => handleFieldChange('font', e.target.value)} className="w-full p-3 border bg-surface border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer">
                          {fontOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className='flex flex-col justify-center flex-1'>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => logoInputRef.current?.click()} className="px-2 py-1 border text-gray-500 hover:text-blue-700 transition duration-300 ease-in-out font-medium border-gray-200 hover:border-blue-700 rounded flex items-center gap-2 cursor-pointer">
                            <FileUp className="w-5 h-5" /> Upload Logo
                          </button>
                          <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                          {postData.logo && <img src={postData.logo} alt="Logo" className="w-10 h-10 object-contain" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Caption</label>
                        <input type="text" placeholder="Your caption here!" value={postData.caption} onChange={(e) => handleFieldChange('caption', e.target.value)} className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm" maxLength={280} />
                        <span className="text-gray-500 absolute right-2 top-8 text-sm">{280 - (postData.caption?.length || 0)}</span>
                      </div>
                      <div className="flex-1 relative">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Hashtags</label>
                        <input type="text" placeholder="Hashtags (e.g., #ShortVideo #Brand)" value={postData.hashtags.join(' ')} onChange={(e) => handleFieldChange('hashtags', e.target.value.split(' ').filter(Boolean))} className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Size, Goals & Audience */}
              {step === 2 && (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                    <div className="flex justify-center gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Video className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Size, Goals & Audience</h1>
                        <p className="text-gray-600 text-xs">Select size, campaign goals, and audience for your video.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Size</label>
                      <div className="grid grid-cols-4 gap-4">
                        {sizeOptions.map((option) => (
                          <div key={option.key} onClick={() => handleSizeSelect(option.value)} className={`cursor-pointer border rounded-lg p-2 text-center text-xs ${postData.size === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-center mb-2">
                              <input type="checkbox" checked={postData.size === option.value} onChange={() => handleSizeSelect(option.value)} className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
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
                          <div key={option.value} onClick={() => handleCampaignGoalSelect(option.value)} className={`cursor-pointer flex flex-row justify-center border rounded-lg gap-2 p-2 text-xs font-normal ${postData.campaignGoal === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-center">
                              <input type="checkbox" checked={postData.campaignGoal === option.value} onChange={() => handleCampaignGoalSelect(option.value)} className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
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
                          <div key={option.value} onClick={() => handleAudienceSelect(option.value)} className={`cursor-pointer border rounded-lg p-2 text-center text-sm font-medium ${postData.audience === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-center mb-2">
                              <input type="checkbox" checked={postData.audience === option.value} onChange={() => handleAudienceSelect(option.value)} className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
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
                          <div key={option.value} onClick={() => handleFieldChange('fileFormat', option.value)} className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${postData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex justify-center">
                              <input type="checkbox" checked={postData.fileFormat === option.value} onChange={() => handleFieldChange('fileFormat', option.value)} className="w-4 h-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            </div>
                            <div>{option.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Image Selection */}
              {step === 3 && !loading.generate && (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                    <div className="flex justify-center gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Image</h1>
                        <p className="text-gray-600 text-xs">Select images to generate your short video.</p>
                      </div>
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
                  {croppedImages.filter(Boolean).length > 0 && (
                    <div className="my-6">
                      <h3 className="text-sm font-medium mb-3">
                        Selected Media ({croppedImages.filter(Boolean).length}/5)
                      </h3>
                      <div className="columns-3 sm:columns-4 md:columns-5 gap-4">
                        {croppedImages.filter(Boolean).map((item, i) => {
                          const isVideo = item.type === 'video' || item.videoSrc || (item.previewUrl && item.previewUrl.includes('.mp4'));

                          return (
                            <div key={i} className="relative group rounded-lg overflow-hidden border-2 border-blue-700">
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
                    <div><FolderOpen /></div>
                    <h3 className="text-md font-semibold text-gray-700">Upload Image</h3>
                    <p className="text-gray-500 text-xs">Choose an image from your brand, library, or generate one with magic media.</p>
                    <div className="flex gap-4">
                      <button onClick={() => setSearchModalOpen(true)} className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3">
                        <div className="text-sm font-medium">Search Images</div>
                        <div className="mt-0.5"><FileSearch className="w-4 h-4" /></div>
                      </button>
                      <button onClick={() => setLibraryModalOpen(true)} className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3">
                        <div className="text-sm font-medium">Your Library</div>
                        <div className="mt-0.5"><FolderOpen className="w-4 h-4" /></div>
                      </button>
                      <button onClick={() => setMagicMediaModalOpen(true)} className="flex border hover:border-blue-700 transition duration-300 cursor-pointer border-gray-200 py-2 px-2 rounded-md bg-surface flex-row gap-3">
                        <div className="text-sm font-medium">Magic Media</div>
                        <div className="mt-0.5"><Image className="w-4 h-4" /></div>
                      </button>
                    </div>
                  </div>


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

              {/* Reusable Modals */}
              <SearchMediaModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} selectedImages={selectedImages} onSelectImage={(src) => {
                setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
              }} onApply={handleApplySelected} />

              <LibraryMediaModal isOpen={libraryModalOpen} onClose={() => setLibraryModalOpen(false)}
                selectedImages={selectedImages} onSelectImage={(src) => {
                  setSelectedImages(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
                }} onApply={handleApplySelected} />

              <MagicMediaModal isOpen={magicMediaModalOpen} onClose={() => {
                setMagicMediaModalOpen(false);
              }} activeTab={activeTab} onTabChange={setActiveTab} selectedMedia={selectedMedia} onApply={handleApplySelected} onCancel={handleCancelSelection}>
                {renderTabContent()}
              </MagicMediaModal>


              <ImageCropperModal
                isOpen={showCropper}
                imageSrc={imageSrc[currentCropIndex]}
                crop={crop}
                currentIndex={currentCropIndex}
                totalImages={imageSrc.length}
                onCropChange={setCrop}
                onCropComplete={setCompletedCrop}
                aspectRatio={postData.size ? parseInt(postData.size.split('x')[0]) / parseInt(postData.size.split('x')[1]) : 1}
                onSave={saveCroppedImage}
                onSkip={handleSkipCrop}
                onCancel={handleCancelCrop}
                ref={cropperRef}
              />
            </div>

            <div className="flex justify-between p-3 rounded-lg">
              <button onClick={handleBack} className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium">
                Back
              </button>
              <button onClick={handleContinue} className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white py-2 px-3 items-center text-sm font-medium" disabled={loading[step]}>
                {loading[step] || loading.generate ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 3 ? 'Generate' : 'Continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      <SocialIntegrationModal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)} onContinue={handleSocialContinue} actionType={actionType} />
    </div>
  );
};

export default ShortVideoCreativeWizard;