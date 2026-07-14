"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  MoreVertical,
  Download,
  PlusCircle,
  ArrowLeft,
  FileSearch,
  FolderOpen,
  FileUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Breadcrumbs from "@/app/(components)/Breadcrumbs";
import SearchMediaModal from "@/app/(components)/SearchMediaModal";
import LibraryMediaModal from "@/app/(components)/LibraryMediaModal";
import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import {
  FloatingAnimation,
  FloatingElements,
} from "@/app/(components)/FloatingAnimation";
import BrandImagesSection from "@/app/(components)/BrandImagesSection";

const ImageToVariationsPipelinePage = () => {
  const router = useRouter();
  const {
    uploadMedia,
    sendUrl,
    myImages = [],
    myImagesLoading,
    fetchMyImages,
    deleteImage,
  } = useAuth();

  const [inputData, setInputData] = useState({
    file: null,
    style: "",
    exportFormat: "PNG",
  });
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [loading, setLoading] = useState({ generate: false, export: {} });
  const [selectedImages, setSelectedImages] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);

  // Cropper
  const [crop, setCrop] = useState({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const cropperRef = useRef();

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  const fileInputRef = useRef();
  const styleDropdownRef = useRef();

  const [searchResults, setSearchResults] = useState([
    {
      id: 1,
      src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg",
      alt: "Puppies",
    },
    {
      id: 2,
      src: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg",
      alt: "Puppy",
    },
    {
      id: 3,
      src: "https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg",
      alt: "Party Puppy",
    },
    {
      id: 4,
      src: "https://images.pexels.com/photos/2007/pexels-photo-2007.jpeg",
      alt: "Cute Dog",
    },
    {
      id: 5,
      src: "https://images.pexels.com/photos/97082/pexels-photo-97082.jpeg",
      alt: "Snout",
    },
  ]);

  const styleOptions = [
    {
      value: "Vintage Sepia",
      label: "Vintage Sepia",
      image:
        "https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Futuristic Cyberpunk",
      label: "Futuristic Cyberpunk",
      image:
        "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Watercolor Painting",
      label: "Watercolor Painting",
      image:
        "https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Pixel Art",
      label: "Pixel Art",
      image:
        "https://images.pexels.com/photos/1293261/pexels-photo-1293261.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Oil Painting",
      label: "Oil Painting",
      image:
        "https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Sketch Drawing",
      label: "Sketch Drawing",
      image:
        "https://images.pexels.com/photos/4740260/pexels-photo-4740260.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "3D Render",
      label: "3D Render",
      image:
        "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Cartoon Style",
      label: "Cartoon Style",
      image:
        "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Black & White",
      label: "Black & White",
      image:
        "https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=200",
    },
    {
      value: "Abstract Art",
      label: "Abstract Art",
      image:
        "https://images.pexels.com/photos/1812960/pexels-photo-1812960.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
  ];

  const selectedStyle = styleOptions.find((o) => o.value === inputData.style);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
      return alert("Invalid format");
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc([reader.result]);
      setCroppedImages([file]);
      setCurrentCropIndex(0);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleStyleChange = (value) => {
    setInputData((prev) => ({ ...prev, style: value }));
    setStyleDropdownOpen(false);
  };

  const handleGenerateVariations = async () => {
    if (croppedImages.length === 0) return alert("Please crop an image first.");
    setLoading((prev) => ({ ...prev, generate: true }));
    setOutputs([]);
    setSelectedVariations([]);

    const prompt =
      `professional creative variation, different angle, lighting, composition, ${inputData.style || "high quality"}`.trim();

    try {
      const res = await fetch(
        `/api/pexels?query=${encodeURIComponent(prompt)}&per_page=20`,
      );
      const data = await res.json();
      const variations = (data.photos || []).map((p, i) => ({
        id: `var-${p.id}-${Date.now()}-${i}`,
        src: p.src.medium,
        large: p.src.large2x,
        alt: p.alt || `Variation ${i + 1}`,
      }));
      setOutputs(variations);
    } catch (err) {
      alert("Failed to generate variations");
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  };

  const handleDownload = async (url) => {
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `variation-${Date.now()}.jpg`;
    a.click();
  };

  const handleAddToBrand = async (url) => {
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    const file = new File([blob], `brand-variation-${Date.now()}.jpg`, {
      type: blob.type,
    });
    await uploadMedia(file);
    alert("Added to brand library!");
  };

  const handleBack = () => {
    setOutputs([]);
    setSelectedVariations([]);
    setImageSrc([]);
    setCroppedImages([]);
    setInputData({ file: null, style: "", exportFormat: "PNG" });
  };

  const toggleVariationSelect = (variation) => {
    setSelectedVariations((prev) =>
      prev.some((v) => v.id === variation.id)
        ? prev.filter((v) => v.id !== variation.id)
        : [...prev, variation],
    );
  };

  const handleSelectImage = (src) => {
    setSelectedImages((prev) =>
      prev.includes(src)
        ? prev.filter((s) => s !== src)
        : prev.length < 5
          ? [...prev, src]
          : prev,
    );
  };

  const handleApplySelected = () => {
    if (selectedImages.length === 0) return;
    setImageSrc(selectedImages);
    setCroppedImages(new Array(selectedImages.length).fill(null));
    setCurrentCropIndex(0);
    setShowCropper(true);
    setLibraryModalOpen(false);
    setSearchModalOpen(false);
    setSelectedImages([]);
  };

  // Save cropped image using cropperRef
  const saveCroppedImage = async () => {
    if (!completedCrop || !cropperRef.current?.cropper?.getImage()) return;

    const image = cropperRef.current.cropper.getImage();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
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
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    const file = new File([blob], `cropped-${currentCropIndex}.png`, {
      type: "image/png",
    });
    const url = URL.createObjectURL(file);

    setCroppedImages((prev) => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    setImageSrc((prev) => {
      const updated = [...prev];
      updated[currentCropIndex] = url;
      return updated;
    });

    if (currentCropIndex >= imageSrc.length - 1) {
      setShowCropper(false);
    } else {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    }
  };

  const handleSkipCrop = () => {
    if (currentCropIndex >= imageSrc.length - 1) {
      setShowCropper(false);
    } else {
      setCurrentCropIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        styleDropdownRef.current &&
        !styleDropdownRef.current.contains(e.target)
      ) {
        setStyleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="px-14">
      <Breadcrumbs
        items={[
          { name: "Creatives", href: "/creatives" },
          { name: "AI Studio", href: null },
          {
            name: "Image to Variations",
            href: "/creatives/ai-studio/image-to-variations",
          },
        ]}
      />

      <div className="font-medium text-xl mb-6">Image to Variations</div>

      <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-surface rounded-xl py-4">
        <div className="overflow-auto space-y-6">
          {/* INPUT SECTION */}
          {!outputs.length ? (
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                <div className="flex justify-center gap-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Image className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">
                      Upload Image
                    </h1>
                    <p className="text-gray-600 text-xs">
                      Upload an image to generate creative variations.
                    </p>
                  </div>
                </div>
              </div>

              <BrandImagesSection
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                deleteImage={deleteImage}
                fetchMyImages={fetchMyImages}
                myImages={myImages}
                selectedImages={selectedImages}
                setSelectedImages={setSelectedImages}
              />

              {/* Upload Area */}
              <div className="flex mb-10 flex-col space-y-4 border border-gray-200 py-5 bg-gray-50 justify-center items-center rounded-lg">
                <div>
                  <FileUp className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-md font-semibold text-gray-700">
                  Upload Image
                </h3>
                <p className="text-gray-500 text-xs">
                  Choose from your library or search
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="flex border hover:border-blue-700 cursor-pointer border-gray-200 py-2 px-4 rounded-md bg-surface gap-3 items-center"
                  >
                    <div className="text-sm font-medium">Search Images</div>
                    <FileSearch className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLibraryModalOpen(true)}
                    className="flex border hover:border-blue-700 cursor-pointer border-gray-200 py-2 px-4 rounded-md bg-surface gap-3 items-center"
                  >
                    <div className="text-sm font-medium">Your Library</div>
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cropped Preview */}
              {croppedImages.length > 0 && (
                <div className="columns-2 sm:columns-3 md:columns-4 mb-6">
                  {croppedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={imageSrc[i] || URL.createObjectURL(img)}
                        alt="thumb"
                        className="w-full h-auto object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => {
                          setCroppedImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
                          setImageSrc((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
                        }}
                        className="absolute top-2 right-2 cursor-pointer bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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

              {/* Style Selector */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 block">
                  Style
                </label>
                <div className="relative" ref={styleDropdownRef}>
                  <button
                    onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
                    className="w-full p-3 border bg-surface border-gray-200 rounded-md text-left flex items-center gap-3"
                  >
                    {selectedStyle && (
                      <img
                        src={selectedStyle.image}
                        alt=""
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span className="text-gray-700">
                      {inputData.style || "Select a style"}
                    </span>
                  </button>
                  {styleDropdownOpen && (
                    <div className="absolute z-10 bottom-14 w-full bg-surface border border-gray-200 rounded-lg shadow-xl p-4 grid grid-cols-5 gap-4">
                      {styleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStyleChange(option.value)}
                          className={`p-3 rounded-lg border ${inputData.style === option.value ? "border-blue-700 bg-blue-50" : "border-gray-200"} hover:border-blue-700 transition`}
                        >
                          <img
                            src={option.image}
                            alt={option.label}
                            className="w-full cursor-pointer h-28 object-cover rounded mb-2"
                          />
                          <p className="text-xs text-center text-gray-700">
                            {option.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerateVariations}
                disabled={loading.generate || croppedImages.length === 0}
                className="px-3 cursor-pointer mt-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Generate Variations"
                )}
              </button>
            </div>
          ) : (
            /* OUTPUT SECTION - BEAUTIFUL MASONRY */
            <div className="border border-gray-200 p-3 rounded-lg">
              <div className="sticky top-0 z-50 bg-surface border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
                <div>
                  <h1 className="font-medium text-lg text-blue-700">
                    Generated Variations
                  </h1>
                  <p className="text-xs text-gray-600">
                    Click any variation to select • Use menu for actions
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-6 h-6 text-blue-700" />
                </button>
              </div>

              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                {outputs.map((variation) => {
                  const isSelected = selectedVariations.some(
                    (v) => v.id === variation.id,
                  );
                  const menuId = `menu-${variation.id}`;

                  return (
                    <div
                      key={variation.id}
                      className="relative group break-inside-avoid mb-4 cursor-pointer"
                      onClick={() => toggleVariationSelect(variation)}
                    >
                      <div
                        className={`relative bg-surface border-2 rounded-md overflow-visible transition-all `}
                      >
                        <img
                          src={variation.src}
                          alt={variation.alt}
                          className="w-full rounded-md h-auto"
                          loading="lazy"
                        />

                        {/* Selected Checkmark */}
                        {/* {isSelected && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-2 shadow-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )} */}

                        {/* 3-dot Menu Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === menuId ? null : menuId);
                          }}
                          className="absolute cursor-pointer top-2 right-2 p-2 bg-black/70 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition z-10"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen === menuId && (
                          <div className="absolute top-10 right-2 z-20 bg-surface rounded-lg shadow-2xl border border-gray-200 py-2 w-48">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(variation.src);
                                setMenuOpen(null);
                              }}
                              className="w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                            >
                              <Download size={16} /> Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToBrand(variation.src);
                                setMenuOpen(null);
                              }}
                              className="w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 text-blue-700 text-sm font-medium"
                            >
                              <PlusCircle size={16} /> Add to Brand
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={1}
        onSave={saveCroppedImage}
        onSkip={() =>
          currentCropIndex < imageSrc.length - 1
            ? setCurrentCropIndex((c) => c + 1)
            : setShowCropper(false)
        }
        onCancel={() => setShowCropper(false)}
      />

      {/* Search Media Modal */}
      <SearchMediaModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        searchResults={searchResults}
        selectedImages={selectedImages}
        onSelectImage={handleSelectImage}
        onApply={handleApplySelected}
        onCancel={() => {
          setSearchModalOpen(false);
          setSelectedImages([]);
        }}
      />

      {/* Library Media Modal */}
      <LibraryMediaModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        searchResults={searchResults}
        selectedImages={selectedImages}
        onSelectImage={handleSelectImage}
        onApply={handleApplySelected}
        onCancel={() => {
          setLibraryModalOpen(false);
          setSelectedImages([]);
        }}
        onUploadClick={() => libraryFileInputRef.current?.click()}
      />

      {/* Loading */}
      {loading.generate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
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

export default ImageToVariationsPipelinePage;
