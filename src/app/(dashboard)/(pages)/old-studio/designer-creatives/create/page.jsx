"use client";

import { CheckCircle2, Image, Layout, Palette, FileText, Download } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { motion } from "framer-motion";

const DesignerCreatives = () => {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [creativeData, setCreativeData] = useState({
    format: null,
    asset: null,
    variants: [],
  });
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false });
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // Mock assets
  const mockAssets = {
    images: [
      { id: 1, src: "https://via.placeholder.com/150?text=Logo+1", alt: "Logo 1" },
      { id: 2, src: "https://via.placeholder.com/150?text=Logo+2", alt: "Logo 2" },
      { id: 3, src: "https://via.placeholder.com/150?text=Image+1", alt: "Image 1" },
    ],
  };

  // Mock variants
  const mockVariants = [
    { id: 1, src: "https://via.placeholder.com/300?text=Variant+1", alt: "Variant 1" },
    { id: 2, src: "https://via.placeholder.com/300?text=Variant+2", alt: "Variant 2" },
    { id: 3, src: "https://via.placeholder.com/300?text=Variant+3", alt: "Variant 3" },
  ];

  const handleSelectFormat = (formatType) => {
    setFormat(formatType);
    setCreativeData((prev) => ({ ...prev, format: formatType }));
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setCreativeData((prev) => ({ ...prev, asset }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(file.name)) {
      alert("Please upload a valid image file (e.g., .jpg, .png)");
      return;
    }
    setLoading({ ...loading, 2: true });
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      setSelectedAsset({ id: Date.now(), src: url, alt: `Uploaded image`, type: "image" });
      setCreativeData((prev) => ({ ...prev, asset: { src: url, type: "image" } }));
      setLoading({ ...loading, 2: false });
    }, 1000);
  };

  const handleGenerateVariants = () => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      setCreativeData((prev) => ({ ...prev, variants: mockVariants }));
      setLoading({ ...loading, 3: false });
    }, 1000);
  };

  const handleExport = (format) => {
    setLoading({ ...loading, 5: true });
    setTimeout(() => {
      setResult({ type: format, url: `https://via.placeholder.com/1000?text=${format.toUpperCase()}` });
      setLoading({ ...loading, 5: false });
    }, 1000);
  };

  const handleContinue = () => {
    if (step < steps.length) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step + 1);
        setLoading({ ...loading, [step]: false });
      }, 1000);
    }
  };

  const steps = [
    { id: 1, title: "Designer Format", icon: <Layout className="h-5 w-5" /> },
    { id: 2, title: "Brand Assets", icon: <Image className="h-5 w-5" /> },
    { id: 3, title: "AI Generation", icon: <Palette className="h-5 w-5" /> },
    { id: 4, title: "Edit & Approve", icon: <FileText className="h-5 w-5" /> },
    { id: 5, title: "Export", icon: <Download className="h-5 w-5" /> },
  ];

  const formatOptions = [
    {
      type: "logos",
      name: "Logos & Brand Identity",
      desc: "Create unique brand logos",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "logos" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
    {
      type: "business_cards",
      name: "Business Cards",
      desc: "Professional contact cards",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "business_cards" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M6 14h6" />
        </svg>
      ),
    },
    {
      type: "banners",
      name: "Banners (Print & Digital)",
      desc: "Promotional banners",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "banners" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <rect x="2" y="4" width="20" height="8" rx="1" />
          <path d="M6 8h12" />
        </svg>
      ),
    },
    {
      type: "flyers",
      name: "Flyers",
      desc: "Marketing flyers",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "flyers" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8v4H8z" />
        </svg>
      ),
    },
    {
      type: "brochures",
      name: "Brochures",
      desc: "Multi-page informational",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "brochures" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <path d="M4 4h6v16H4zM10 4h6v16h-6zM16 4h4v16h-4z" />
        </svg>
      ),
    },
    {
      type: "posters",
      name: "Posters",
      desc: "Large format posters",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "posters" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8" />
        </svg>
      ),
    },
    {
      type: "infographics",
      name: "Infographics",
      desc: "Data visualization",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "infographics" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 12h4v4H8zM12 8h4" />
          <circle cx="12" cy="8" r="1" />
        </svg>
      ),
    },
    {
      type: "presentations",
      name: "Presentation Decks",
      desc: "Pitch or report slides",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "presentations" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <rect x="2" y="4" width="20" height="12" rx="2" />
          <path d="M6 8h12v4H6z" />
        </svg>
      ),
    },
    {
      type: "packaging",
      name: "Packaging Mockups",
      desc: "Product packaging designs",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "packaging" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <path d="M6 4h12l4 8-4 8H6l-4-8z" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
    {
      type: "digital_cards",
      name: "Digital Business Cards",
      desc: "Shareable digital cards",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={format === "digital_cards" ? "#155dfc" : "currentColor"} strokeWidth="1">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M6 10h6M6 14h4" />
          <circle cx="18" cy="12" r="2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-14">
      <div className="font-medium text-xl mb-6">Create Designer Creative</div>

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
                  {loading[s.id] ? (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                  ) : step > s.id ? (
                    <CheckCircle2 size={20} className="text-blue-700" />
                  ) : (
                    s.icon
                  )}
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
          <div className="overflow-auto">
            {step === 1 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-5 flex-row gap-2 mb-10">
                  <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-full px-2 items-center">
                    <Layout className="text-blue-700 w-7 h-7" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">What would you like to design?</h1>
                    <p className="text-gray-600 text-xs">Select a format for your designer creative.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formatOptions.map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => handleSelectFormat(opt.type)}
                      className={`border p-4 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${format === opt.type ? "bg-blue-100 border-blue-500" : "bg-white hover:bg-gray-100 hover:border hover:border-gray-200 border-gray-200"}`}
                    >
                      <div className="text-center flex flex-col">
                        <div className="mx-auto mb-2">{opt.icon}</div>
                        <span className="text-sm font-medium">{opt.name}</span>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </div>
                    </div>
                  ))}
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
                      <h1 className="font-medium text-lg text-blue-700">Select Brand Assets</h1>
                      <p className="text-gray-600 text-xs">Choose from your Brand Kit or upload new assets.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex self-start rounded-lg cursor-pointer hover:bg-blue-800 justify-center bg-blue-700 text-white p-2 items-center"
                      disabled={loading[2]}
                    >
                      {loading[2] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Upload Asset"
                      )}
                    </button>
                    <button
                      onClick={() => handleAssetSelect({ id: Date.now(), src: "https://via.placeholder.com/150?text=AI+Generated", alt: "AI Generated", type: "image" })}
                      className="flex self-start rounded-lg cursor-pointer hover:bg-blue-800 justify-center bg-blue-700 text-white p-2 items-center"
                      disabled={loading[2]}
                    >
                      {loading[2] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Auto-Generate"
                      )}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {mockAssets.images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => handleAssetSelect({ ...img, type: "image" })}
                      className={`cursor-pointer relative border rounded-lg ${selectedAsset?.id === img.id ? "border-blue-500" : "border-gray-200"}`}
                    >
                      <img src={img.src} alt={img.alt} className="w-full h-40 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                  <div className="flex justify-center gap-2">
                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                      <Palette className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">AI Generation</h1>
                      <p className="text-gray-600 text-xs">Generate branded variants for your design.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateVariants}
                    className="flex self-start rounded-lg cursor-pointer hover:bg-blue-800 justify-center bg-blue-700 text-white p-2 items-center"
                    disabled={loading[3]}
                  >
                    {loading[3] ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Generate Variants"
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {creativeData.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="border rounded-lg p-2"
                    >
                      <img src={variant.src} alt={variant.alt} className="w-full h-40 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-2 flex-row gap-2 mb-7 py-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <FileText className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Edit & Approve</h1>
                    <p className="text-gray-600 text-xs">Edit your design and preview mockups.</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">Drag & Drop Editor</h3>
                    <div className="h-64 bg-white border-dashed border-2 border-gray-300 flex items-center justify-center text-gray-500">
                      Drag-and-Drop Editor Placeholder
                    </div>
                  </div>
                  <div className="flex-1 border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Mockup Preview</h3>
                    {selectedAsset ? (
                      <img src={selectedAsset.src} alt="Preview" className="w-full h-64 object-contain rounded-lg" />
                    ) : (
                      <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-500">
                        No asset selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-2 flex-row gap-2 mb-7 py-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Download className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Export</h1>
                    <p className="text-gray-600 text-xs">Download your design in various formats.</p>
                  </div>
                </div>
                {result && (
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-green-600">Design Exported!</h3>
                    <a href={result.url} download className="mt-4 text-blue-600 underline">
                      Download {result.type.toUpperCase()}
                    </a>
                  </div>
                )}
                {!result && (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleExport("png")}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[5]}
                    >
                      {loading[5] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Export PNG"
                      )}
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[5]}
                    >
                      {loading[5] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Export PDF"
                      )}
                    </button>
                    <button
                      onClick={() => handleExport("svg")}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[5]}
                    >
                      {loading[5] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Export SVG"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="border cursor-pointer border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
                disabled={loading[step]}
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
                {loading[step] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Continue"
                )}
              </button>
            )}
            {step === steps.length && (
              <button
                onClick={() => handleExport("png")}
                className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                disabled={loading[5] || result}
              >
                {loading[5] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Finish"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerCreatives;