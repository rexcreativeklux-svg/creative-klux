"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Image, Download, CheckCircle2, FileSearch, FolderOpen, FileUp, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';
import TextToImageTab from '../tabs/text-to-image/page';
import TextToAudioTab from '../tabs/text-to-audio/page';
import TextToVideoTab from '../tabs/text-to-video/page';
import ImageToVariationsTab from '../tabs/image-to-variations/page';
import ScriptToVoiceoverToVideoTab from '../tabs/script-to-voiceover/page';
import AudioToTextTab from '../tabs/audio-to-text/page';
import PersonaBasedGeneratorTab from '../tabs/persona-based-generator/page';

const DigitalBusinessCardCreationPage = () => {
  const router = useRouter();
  const { activeBrand, sendUrl } = useAuth();
  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cardData, setCardData] = useState({
    format: 'digital-business-card',
    assets: [],
    brandName: activeBrand?.name || '',
    description: '',
    name: '',
    title: '',
    email: '',
    phone: '',
    company: '',
    dimensions: { width: 1050, height: 600 },
    orientation: '',
    fileFormat: '',
    colors: [activeBrand?.primary_color || '#000000', activeBrand?.secondary_color || '#0066cc'],
    font: activeBrand?.font || 'Arial',
  });
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppingIndex, setCroppingIndex] = useState(0);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicMediaModalOpen, setMagicMediaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Text to Image');
  const [searchResults, setSearchResults] = useState([
    { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'Card 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'Card 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'Card 3', type: 'image' },
  ]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, generate: false });

  const inspirePrompts = [
    'A minimalist digital business card for a tech consultant',
    'A vibrant business card for a creative agency director',
    'A professional card for a corporate lawyer',
    'A modern business card for a startup founder',
    'An elegant card for a luxury brand manager',
  ];

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
  ];

  const orientationOptions = [
    {
      value: 'Horizontal',
      svg: (
        <svg width="50" height="25" viewBox="0 0 50 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="2.5" width="40" height="20" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Horizontal',
    },
    {
      value: 'Vertical',
      svg: (
        <svg width="25" height="50" viewBox="0 0 25 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="5" width="20" height="40" stroke="#4B5563" strokeWidth="1" />
        </svg>
      ),
      label: 'Vertical',
    },
  ];

  const sizeOptions = [
    { value: '252x144', label: 'Digital Horizontal (3.5 x 2 in, 72 DPI)', type: 'digital' },
    { value: '144x252', label: 'Digital Vertical (2 x 3.5 in, 72 DPI)', type: 'digital' },
    { value: '1050x600', label: 'Print Horizontal (3.5 x 2 in, 300 DPI)', type: 'print' },
    { value: '600x1050', label: 'Print Vertical (2 x 3.5 in, 300 DPI)', type: 'print' },
  ];

  const fileFormatOptions = [
    { value: 'PNG', label: 'PNG (Recommended)' },
    { value: 'JPEG', label: 'JPEG' },
    { value: 'PDF', label: 'PDF (Print-ready)' },
  ];

  const mockGeneratedCards = [
    { id: 1, src: 'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg', alt: 'Card 1', type: 'image' },
    { id: 2, src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', alt: 'Card 2', type: 'image' },
    { id: 3, src: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', alt: 'Card 3', type: 'image' },
  ];

  useEffect(() => {
    if (activeBrand?.url) {
      setBrandUrl(activeBrand.url);
    }
  }, [activeBrand]);

  const handleImportBrand = async () => {
    if (!brandUrl.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    setLoading({ ...loading, 1: true });
    setError('');
    try {
      const brandData = await sendUrl(brandUrl);
      if (!brandData || !brandData.data) {
        throw new Error('Failed to import brand from URL or invalid data structure');
      }
      setCardData((prev) => ({
        ...prev,
        brandName: brandData.data.name || '',
        company: brandData.data.name || '',
        colors: [brandData.data.primary_color || '#000000', brandData.data.secondary_color || '#0066cc'],
        font: brandData.data.font || 'Arial',
        description: `Business card for ${brandData.data.name || 'brand'}`,
      }));
      setError('');
      console.log('Imported brand:', brandData.data.name, 'from URL:', brandUrl);
    } catch (err) {
      setError('Failed to fetch brand details. Please check the URL or enter details manually.');
      console.error('Import error:', err.message);
    } finally {
      setLoading({ ...loading, 1: false });
    }
  };

  const handleFieldChange = (field, value, index = null) => {
    if (field === 'colors') {
      const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
      const sanitizedValue = value.startsWith('#') ? value : `#${value}`;
   
      setCardData((prev) => ({
        ...prev,
        colors: prev.colors.map((c, i) => (i === index ? sanitizedValue : c)),
      }));
    } else {
      setCardData((prev) => ({ ...prev, [field]: value }));
    }
    setError('');
    console.log(`Updated ${field}:`, value);
  };

  const handleInspireMe = () => {
    const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
    setCardData((prev) => ({ ...prev, description: randomPrompt }));
    console.log('Inspire Me prompt:', randomPrompt);
  };

  const handleAssetSelect = (asset) => {
    setCardData((prev) => {
      const isSelected = prev.assets.some((a) => a.id === asset.id);
      if (isSelected) {
        return { ...prev, assets: prev.assets.filter((a) => a.id !== asset.id) };
      } else if (prev.assets.length < 5) {
        return { ...prev, assets: [...prev.assets, asset] };
      } else {
        setError('You can select up to 5 images.');
        return prev;
      }
    });
    console.log('Asset toggled:', asset.alt, cardData.assets.map((a) => a.alt));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      setError('Please upload a valid image file (e.g., .jpg, .png, .webp).');
      return;
    }
    if (cardData.assets.length >= 5) {
      setError('You can select up to 5 images.');
      return;
    }
    setLoading({ ...loading, 3: true });
    const reader = new FileReader();
    reader.onload = () => {
      const newAsset = { id: `uploaded-${Date.now()}`, src: reader.result, alt: `User-uploaded image`, type: 'image' };
      setSearchResults([newAsset, ...searchResults]);
      setCardData((prev) => ({ ...prev, assets: [...prev.assets, newAsset] }));
      setShowCropper(true);
      setCroppingIndex(prev.assets.length);
      setLoading({ ...loading, 3: false });
      console.log('Image uploaded:', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSearchImages = () => {
    setSearchModalOpen(true);
    console.log('Search Images modal opened');
  };

  const handleUploadImages = () => {
    setLibraryModalOpen(true);
    console.log('Your Library modal opened');
  };

  const handleMagicMedia = () => {
    setMagicMediaModalOpen(true);
    console.log('Magic Media modal opened');
  };

  const handleSelectMedia = (media) => {
    if (selectedMedia.some((item) => item.id === media.id)) {
      setSelectedMedia(selectedMedia.filter((item) => item.id !== media.id));
      console.log('Media deselected:', media.alt);
    } else if (selectedMedia.length < 5) {
      setSelectedMedia([...selectedMedia, media]);
      console.log('Media selected:', media.alt, 'type:', media.type);
    } else {
      setError('You can select up to 5 images for the business card.');
      console.log('Selection limit reached: 5 items');
    }
  };

  const handleApplySelected = () => {
    if (selectedMedia.length === 0) return;
    if (cardData.assets.length + selectedMedia.length > 5) {
      setError('You can select up to 5 images total.');
      return;
    }
    setCardData((prev) => ({ ...prev, assets: [...prev.assets, ...selectedMedia] }));
    setShowCropper(true);
    setCroppingIndex(cardData.assets.length);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    setSelectedMedia([]);
    console.log('Applied selected media:', selectedMedia.map((m) => m.alt));
  };

  const handleCancelSelection = () => {
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicMediaModalOpen(false);
    console.log('Selection cancelled');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    console.log('Tab changed to:', tab);
  };

  const handleAddImageUrl = () => {
    const url = document.getElementById('imageUrlInput')?.value.trim();
    if (!url) return;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(url)) {
      setError('Please enter a valid image URL (e.g., .jpg, .png, .webp).');
      return;
    }
    if (searchResults.some((result) => result.src === url)) {
      setError('This image URL is already added.');
      return;
    }
    try {
      const img = new Image();
      img.onload = () => {
        const newId = searchResults.length + 1;
        setSearchResults([{ id: newId, src: url, alt: `User-added image ${newId}`, type: 'image' }, ...searchResults]);
        document.getElementById('imageUrlInput').value = '';
        console.log('Image URL added:', url);
      };
      img.onerror = () => {
        setError('Invalid image URL or image could not be loaded.');
        console.error('Image URL load failed:', url);
      };
      img.src = url;
    } catch (error) {
      setError('An error occurred while adding the image URL.');
      console.error('Error adding image URL:', error);
    }
  };

  const handleOrientationChange = (value) => {
    setCardData((prev) => ({
      ...prev,
      orientation: value,
      dimensions: value === 'Vertical' ? { width: prev.mockupType === 'print' ? 600 : 144, height: prev.mockupType === 'print' ? 1050 : 252 } : { width: prev.mockupType === 'print' ? 1050 : 252, height: prev.mockupType === 'print' ? 600 : 144 },
    }));
    console.log('Orientation changed to:', value);
  };

  const handleSizeChange = (e) => {
    const selectedSize = sizeOptions.find((option) => option.value === e.target.value);
    setCardData((prev) => ({
      ...prev,
      dimensions: {
        width: parseInt(e.target.value.split('x')[0]),
        height: parseInt(e.target.value.split('x')[1]),
      },
      mockupType: selectedSize.type,
    }));
    console.log('Size changed to:', e.target.value);
  };

  const handleFileFormatChange = (e) => {
    setCardData((prev) => ({ ...prev, fileFormat: e.target.value }));
    console.log('File format changed to:', e.target.value);
  };

  const handleGenerateCards = () => {
    if (!cardData.description || cardData.assets.length === 0 || !cardData.name || !cardData.email) {
      setError('Please provide a description, at least one image, name, and email.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs(cardData.assets.map((asset, index) => ({
        ...asset,
        id: `generated-${index}-${Date.now()}`,
      })));
      setLoading({ ...loading, generate: false });
      console.log('Cards generated for description:', cardData.description);
    }, 3000);
  };

  const handleMenuToggle = (cardId) => {
    setMenuOpen(menuOpen === cardId ? null : cardId);
    console.log('Menu toggled for card:', cardId);
  };

  const handleDownload = (card) => {
    const canvas = document.createElement('canvas');
    const { width, height } = cardData.dimensions;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.src = card.src;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      ctx.fillStyle = cardData.colors[0] || 'black';
      ctx.font = `bold 20px ${cardData.font || 'Arial'}`;
      ctx.fillText(cardData.name || 'Name', 20, 40);
      ctx.font = `16px ${cardData.font || 'Arial'}`;
      ctx.fillText(cardData.title || 'Title', 20, 70);
      ctx.fillText(cardData.email || 'Email', 20, 100);
      ctx.fillText(cardData.phone || 'Phone', 20, 130);
      ctx.fillText(cardData.company || 'Company', 20, 160);
      const url = canvas.toDataURL(`image/${cardData.fileFormat.toLowerCase()}`);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${card.alt}.${cardData.fileFormat.toLowerCase()}`;
      link.click();
      console.log('Downloaded card:', card.alt);
    };
    img.onerror = () => {
      console.error('Failed to load image for download:', card.src);
      setError('Failed to download card.');
    };
    setMenuOpen(null);
  };

  const handleUse = (card) => {
    setCardData((prev) => ({ ...prev, assets: [card] }));
    setOutputs([]);
    setStep(3);
    console.log('Using card:', card.alt);
    setMenuOpen(null);
  };

  const handleExport = (card) => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const { width, height } = cardData.dimensions;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.src = card.src;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        ctx.fillStyle = cardData.colors[0] || 'black';
        ctx.font = `bold 20px ${cardData.font || 'Arial'}`;
        ctx.fillText(cardData.name || 'Name', 20, 40);
        ctx.font = `16px ${cardData.font || 'Arial'}`;
        ctx.fillText(cardData.title || 'Title', 20, 70);
        ctx.fillText(cardData.email || 'Email', 20, 100);
        ctx.fillText(cardData.phone || 'Phone', 20, 130);
        ctx.fillText(cardData.company || 'Company', 20, 160);
        const url = canvas.toDataURL(`image/${cardData.fileFormat.toLowerCase()}`);
        setResult({ type: 'export', url, assetId: card.id });
        setLoading({ ...loading, 3: false });
        console.log('Exported card:', card.alt);
      };
      img.onerror = () => {
        console.error('Failed to load image for export:', card.src);
        setError('Failed to export card.');
        setLoading({ ...loading, 3: false });
      };
    }, 1000);
  };

  const onImageLoaded = (img) => {
    imgRef.current = img;
  };

  const saveCroppedImage = () => {
    if (!completedCrop || !imgRef.current) return;
    setLoading({ ...loading, 3: true });
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
      const file = new File([blob], `cropped-card-${Date.now()}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      const newAsset = { id: `cropped-${Date.now()}`, src: url, alt: 'Cropped image', type: 'image' };
      setCardData((prev) => {
        const updatedAssets = [...prev.assets];
        updatedAssets[croppingIndex] = newAsset;
        const nextIndex = croppingIndex + 1;
        if (nextIndex < prev.assets.length) {
          setCroppingIndex(nextIndex);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCroppingIndex(0);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        }
        return { ...prev, assets: updatedAssets };
      });
      setLoading({ ...loading, 3: false });
      console.log('Cropped image saved:', url);
    }, 'image/png');
  };

  const handleSkipCrop = async () => {
    setLoading({ ...loading, 3: true });
    try {
      const currentAsset = cardData.assets[croppingIndex];
      const response = await fetch(currentAsset.src);
      const blob = await response.blob();
      const file = new File([blob], `original-card-${Date.now()}.png`, { type: blob.type });
      const url = URL.createObjectURL(file);
      const newAsset = { id: `original-${Date.now()}`, src: url, alt: 'Original image', type: 'image' };
      setCardData((prev) => {
        const updatedAssets = [...prev.assets];
        updatedAssets[croppingIndex] = newAsset;
        const nextIndex = croppingIndex + 1;
        if (nextIndex < prev.assets.length) {
          setCroppingIndex(nextIndex);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        } else {
          setShowCropper(false);
          setCroppingIndex(0);
          setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
          setCompletedCrop(null);
        }
        return { ...prev, assets: updatedAssets };
      });
      setLoading({ ...loading, 3: false });
      console.log('Skipped crop:', url);
    } catch (error) {
      console.error('Error skipping crop:', error);
      setError('Failed to load the image. Please try again.');
      setLoading({ ...loading, 3: false });
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCroppingIndex(0);
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
    setCompletedCrop(null);
    setCardData((prev) => ({ ...prev, assets: [] }));
    fileInputRef.current.value = '';
    console.log('Crop cancelled');
  };

  const handleContinue = () => {
    if (step === 1 && (!cardData.brandName || !cardData.description || !cardData.name || !cardData.email || !cardData.colors[0] || !cardData.font)) {
      setError('Please provide a brand name, description, name, email, primary color, and font.');
      return;
    }
    if (step === 2 && (!cardData.fileFormat || !cardData.dimensions.width || !cardData.orientation)) {
      setError('Please select a file format, size, and orientation.');
      return;
    }
    if (step === 3 && cardData.assets.length === 0) {
      setError('Please select or upload at least one image.');
      return;
    }
    if (step < steps.length) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step + 1);
        setLoading({ ...loading, [step]: false });
        console.log('Wizard step:', step + 1, 'Format: digital-business-card');
      }, 1000);
    }
  };

  const handleBack = () => {
    if (outputs.length > 0) {
      setOutputs([]);
      setResult(null);
      console.log('Cleared generated cards, returning to Image Upload');
    } else if (step > 1) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step - 1);
        setLoading({ ...loading, [step]: false });
        console.log('Wizard step:', step - 1, 'Format: digital-business-card');
      }, 1000);
    } else {
      router.push('/creatives/designer-creatives');
    }
  };

  const renderTabContent = () => {
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
  };

  const steps = [
    { id: 1, title: 'Brand Details', icon: <Image className="h-5 w-5" /> },
    { id: 2, title: 'Formatting & Generation', icon: <Download className="h-5 w-5" /> },
    { id: 3, title: 'Image Upload', icon: <FileUp className="h-5 w-5" /> },
  ];

  const brandAssets = activeBrand?.assets?.slice(0, 5) || mockGeneratedCards;

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Create Digital Business Card</div>

      {outputs.length > 0 ? (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-white rounded-lg py-4">
          <div className="font-medium pb-4">Generated Cards</div>
          <div className="border border-gray-200 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {outputs.map((card) => (
                <div key={card.id} className="relative border rounded-lg border-gray-200">
                  <img
                    src={card.src}
                    alt={card.alt}
                    className="w-full h-auto rounded-lg"
                    style={{ aspectRatio: `${cardData.dimensions.width}/${cardData.dimensions.height}` }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
                    <p className="text-white text-sm">{cardData.name.slice(0, 50)}</p>
                    <p className="text-white text-sm">{cardData.title.slice(0, 50)}</p>
                  </div>
                  <button
                    onClick={() => handleMenuToggle(card.id)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    aria-label="Card Options"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                  {menuOpen === card.id && (
                    <div className="absolute top-10 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleDownload(card)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Download ${card.alt}`}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleUse(card)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Use ${card.alt}`}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleExport(card)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        aria-label={`Export ${card.alt}`}
                      >
                        Export
                      </button>
                    </div>
                  )}
                  {result && result.assetId === card.id && (
                    <div className="mt-2 text-center">
                      <p className="text-green-600 text-sm">
                        Card Exported! <a href={result.url} download className="text-blue-700 underline cursor-pointer">Download</a>
                      </p>
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
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
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

          <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4">
            <div className="overflow-auto">
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="text-sm rounded-lg border border-gray-200 p-3 flex flex-col justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <Image className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">URL Import</h1>
                        <p className="text-gray-600 text-xs">Import your brand details for business card creation.</p>
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
                        <p className="text-gray-600 text-xs">Enter details for your digital business card.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Brand Name</label>
                      <input
                        type="text"
                        value={cardData.brandName}
                        onChange={(e) => handleFieldChange('brandName', e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                        aria-label="Brand Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <div className="relative">
                        <textarea
                          placeholder="Enter a description for your business card (e.g., 'A minimalist digital business card for a tech consultant')"
                          value={cardData.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 h-32 text-gray-700 text-sm"
                          aria-label="Card Description"
                        />
                        <button
                          onClick={handleInspireMe}
                          className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                          aria-label="Inspire Me"
                        >
                          Inspire Me
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                        <input
                          type="text"
                          value={cardData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          placeholder="Enter name"
                          className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                        <input
                          type="text"
                          value={cardData.title}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="Enter title"
                          className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                        <input
                          type="email"
                          value={cardData.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="Enter email"
                          className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Email"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                        <input
                          type="tel"
                          value={cardData.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Phone"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Company</label>
                        <input
                          type="text"
                          value={cardData.company}
                          onChange={(e) => handleFieldChange('company', e.target.value)}
                          placeholder="Enter company name"
                          className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          aria-label="Company"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Font</label>
                        <select
                          value={cardData.font}
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
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Primary Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={cardData.colors[0]}
                              onChange={(e) => handleFieldChange('colors', e.target.value, 0)}
                              className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer"
                              aria-label="Primary Color"
                            />
                            <input
                              type="text"
                              value={cardData.colors[0]}
                              onChange={(e) => handleFieldChange('colors', e.target.value, 0)}
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
                              value={cardData.colors[1]}
                              onChange={(e) => handleFieldChange('colors', e.target.value, 1)}
                              className="w-15 h-10 border border-gray-200 rounded-md cursor-pointer"
                              aria-label="Secondary Color"
                            />
                            <input
                              type="text"
                              value={cardData.colors[1]}
                              onChange={(e) => handleFieldChange('colors', e.target.value, 1)}
                              placeholder="#0066cc"
                              className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                              aria-label="Secondary Color Hex Code"
                            />
                          </div>
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
                        <Download className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Formatting & Generation</h1>
                        <p className="text-gray-600 text-xs">Select file format, size, and orientation for your business card.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">File Format</label>
                      <div className="grid grid-cols-3 gap-4">
                        {fileFormatOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleFileFormatChange({ target: { value: option.value } })}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${cardData.fileFormat === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={cardData.fileFormat === option.value}
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Size</label>
                      <div className="grid grid-cols-2 gap-4">
                        {sizeOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => handleSizeChange({ target: { value: option.value } })}
                            className={`cursor-pointer flex flex-row gap-2 border rounded-lg p-2 text-center text-xs ${cardData.dimensions.width + 'x' + cardData.dimensions.height === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={cardData.dimensions.width + 'x' + cardData.dimensions.height === option.value}
                                onChange={() => handleSizeChange({ target: { value: option.value } })}
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
                            className={`cursor-pointer flex flex-col items-center border rounded-lg p-2 text-center text-xs ${cardData.orientation === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
                            aria-label={`Select ${option.label}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <input
                                type="checkbox"
                                checked={cardData.orientation === option.value}
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

              {step === 3 && !loading.generate && (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                    <div className="flex justify-center gap-2">
                      <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                        <FileUp className="text-blue-700 w-6 h-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="font-medium text-lg text-blue-700">Image Upload</h1>
                        <p className="text-gray-600 text-xs">Select up to 5 images for your business card.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="border border-gray-200 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Brand Images</h3>
                      {brandAssets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                          {brandAssets.map((asset) => (
                            <div
                              key={asset.id}
                              onClick={() => handleAssetSelect(asset)}
                              className={`cursor-pointer relative border rounded-lg ${cardData.assets.some((a) => a.id === asset.id) ? 'border-blue-700' : 'border-gray-200'}`}
                              aria-label={`Select ${asset.alt}`}
                            >
                              <img
                                src={asset.src}
                                alt={asset.alt}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              {cardData.assets.some((a) => a.id === asset.id) && (
                                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No brand assets available.</p>
                      )}
                      {cardData.assets.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {cardData.assets.map((asset) => (
                              <div
                                key={asset.id}
                                className="relative border rounded-lg border-blue-700"
                              >
                                <img
                                  src={asset.src}
                                  alt={asset.alt}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => handleAssetSelect(asset)}
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
                      <p className="text-gray-500 text-xs">Choose images from your brand, library, or generate with Magic Media (up to 5).</p>
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
                          value={cardData.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          placeholder="Search for images (e.g., business card backgrounds)..."
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
                            onClick={() => handleSelectMedia(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedMedia.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedMedia.some((item) => item.id === result.id) && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* {selectedMedia.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedMedia.map((media) => (
                              <div
                                key={media.id}
                                className="relative border rounded-lg border-blue-700"
                              >
                                <img
                                  src={media.src}
                                  alt={media.alt}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => handleSelectMedia(media)}
                                  className="absolute top-1 right-1 bg-red-500 cursor-pointer text-white rounded-full p-1 hover:bg-red-600 transition duration-300"
                                  aria-label={`Remove ${media.alt}`}
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
                      )} */}
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
                </div>
              )}

              {libraryModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex justify-center z-50">
                  <div className="bg-white relative flex flex-col rounded-lg p-6 w-[80%] h-[85%]">
                    <div className="flex flex-col gap-8">
                      <div className="flex justify-between">
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
                    <div className="overflow-y-auto pt-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSelectMedia(result)}
                            className={`cursor-pointer hover:opacity-80 relative ${selectedMedia.some((item) => item.id === result.id) ? 'border-2 border-blue-700 rounded' : ''}`}
                            aria-label={`Select ${result.alt}`}
                          >
                            <img
                              src={result.src}
                              alt={result.alt}
                              className="w-full h-40 object-cover border border-gray-200 rounded"
                            />
                            {selectedMedia.some((item) => item.id === result.id) && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    
                    </div>
                    <div className="absolute right-0 left-0 flex bottom-4 border-t pt-5 border-t-gray-200 flex-row justify-between px-5 items-center">
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

              {showCropper && (
                <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                  <div className="relative w-[700px] h-[600px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    <h3 className="absolute top-4 left-4 text-sm font-medium text-gray-700">
                      Cropping Image {croppingIndex + 1} of {cardData.assets.length}
                    </h3>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={cardData.dimensions.width / cardData.dimensions.height}
                    >
                      <img
                        ref={imgRef}
                        alt={`Crop ${cardData.assets[croppingIndex].alt}`}
                        src={cardData.assets[croppingIndex].src}
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
            <div className="flex justify-between border-t pt-5 border-t-gray-200">
              <button
                onClick={handleBack}
                className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                aria-label="Back"
              >
                Back
              </button>
              <button
                onClick={step === 3 ? handleGenerateCards : handleContinue}
                className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-600 text-white px-4 py-2 items-center text-sm font-medium disabled:bg-gray-400"
                disabled={loading[step] || (step === 1 && (!cardData.brandName || !cardData.description || !cardData.name || !cardData.email || !cardData.colors[0] || !cardData.font)) || (step === 2 && (!cardData.fileFormat || !cardData.dimensions.width || !cardData.orientation)) || (step === 3 && cardData.assets.length === 0)}
                aria-label={step === 3 ? 'Generate Cards' : 'Continue'}
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
    </div>
  );
};

export default DigitalBusinessCardCreationPage;