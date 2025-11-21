"use client";

import { CheckCircle2, Image, Video, Layout, TrendingUp, Download } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { motion } from "framer-motion";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const CreateSocialCreatives = () => {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [creativeData, setCreativeData] = useState({
    format: null,
    asset: null,
    caption: "",
    hashtags: [],
    style: "",
  });
  const [crop, setCrop] = useState({ unit: "%", width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false });
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  // Mock assets
  const mockAssets = {
    images: [
      { id: 1, src: "https://via.placeholder.com/150?text=Image+1", alt: "Image 1" },
      { id: 2, src: "https://via.placeholder.com/150?text=Image+2", alt: "Image 2" },
      { id: 3, src: "https://via.placeholder.com/150?text=Image+3", alt: "Image 3" },
    ],
    videos: [
      { id: 1, src: "https://via.placeholder.com/150.mp4?text=Video+1", alt: "Video 1" },
      { id: 2, src: "https://via.placeholder.com/150.mp4?text=Video+2", alt: "Video 2" },
    ],
  };

  const handleSelectFormat = (formatType) => {
    setFormat(formatType);
    setCreativeData((prev) => ({ ...prev, format: formatType }));
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setCreativeData((prev) => ({ ...prev, asset }));
    if (asset.type === "image") {
      setShowCropper(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|mov)$/i;
    if (!validExtensions.test(file.name)) {
      alert("Please upload a valid image or video file (e.g., .jpg, .png, .mp4)");
      return;
    }
    setLoading({ ...loading, 2: true });
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("image") ? "image" : "video";
      setSelectedAsset({ id: Date.now(), src: url, alt: `Uploaded ${type}`, type });
      setCreativeData((prev) => ({ ...prev, asset: { src: url, type } }));
      if (type === "image") {
        setShowCropper(true);
      }
      setLoading({ ...loading, 2: false });
    }, 1000);
  };

  const handleGenerateSuggestions = () => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      const mockSuggestions = {
        caption: "Boost your brand with this amazing post!",
        hashtags: ["#SocialMedia", "#Brand", "#Engage"],
        style: format === "memes" ? "Trendy Meme" : "Modern",
      };
      setCreativeData((prev) => ({
        ...prev,
        caption: mockSuggestions.caption,
        hashtags: mockSuggestions.hashtags,
        style: mockSuggestions.style,
      }));
      setPreview({
        src: selectedAsset?.src || "https://via.placeholder.com/1080",
        caption: mockSuggestions.caption,
        hashtags: mockSuggestions.hashtags.join(" "),
        style: mockSuggestions.style,
      });
      setLoading({ ...loading, 3: false });
    }, 1000);
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
      const file = new File([blob], `cropped-image.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      setSelectedAsset((prev) => ({ ...prev, src: url, type: "image" }));
      setCreativeData((prev) => ({ ...prev, asset: { src: url, type: "image" } }));
      setShowCropper(false);
    }, 'image/png');
  };

  const handleExport = () => {
    setLoading({ ...loading, 5: true });
    setTimeout(() => {
      setResult({ type: "export", url: "https://via.placeholder.com/1080" });
      setLoading({ ...loading, 5: false });
    }, 1000);
  };

  const handleSchedule = () => {
    setLoading({ ...loading, 5: true });
    setTimeout(() => {
      setResult({ type: "schedule", status: "scheduled", postId: "12345" });
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
    { id: 1, title: "Social Format", icon: <Layout className="h-5 w-5" /> },
    { id: 2, title: "Brand Assets", icon: <Image className="h-5 w-5" /> },
    { id: 3, title: "AI Suggestions", icon: <TrendingUp className="h-5 w-5" /> },
    { id: 4, title: "Edit & Preview", icon: <Image className="h-5 w-5" /> },
    { id: 5, title: "Export / Schedule", icon: <Download className="h-5 w-5" /> },
  ];

  const formatOptions = [
    { type: "posts", name: "Posts", desc: "Square images, captions, hashtags",  icon: <Image /> },
    { type: "stories", name: "Stories/Reels/Shorts", desc: "Vertical short videos", icon: <Video /> },
    { type: "banners", name: "Banners + Covers", desc: "LinkedIn, YouTube, FB covers",  icon: <Layout /> },
    { type: "thumbnails", name: "Thumbnails", desc: "YouTube, TikTok, Reels preview", icon: <Image /> },
    { type: "memes", name: "Memes/Trends", desc: "Auto-generate trending formats",  icon: <TrendingUp /> },
  ];

  return (
    <div className='px-14'>
            <div className='font-medium text-xl mb-6'>Create Social Creative</div>

      <div className="flex flex-row gap-10 w-full">
        <div className="hidden lg:flex overflow-hidden sticky top-20 flex-col mt-13 w-[30%] h-[500px]">
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
                    <h1 className="font-medium text-lg text-blue-700">What type of social post would you like to create?</h1>
                    <p className="text-gray-600 text-xs">Select a format for your social creative.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formatOptions.map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => handleSelectFormat(opt.type)}
                      className={`border p-4 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${format === opt.type ? "bg-blue-100 border-blue-500" : "bg-white hover:bg-gray-100 hover:border hover:border-gray-200 border-gray-200"}`}
                    >
                      <div className="text-center flex flex-col gap-2">
                        <div className="mx-auto text-blue-700 mb-2">{opt.icon}</div>
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
                  <input
                    type="file"
                    accept="image/*,video/*"
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
                  {mockAssets.videos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => handleAssetSelect({ ...vid, type: "video" })}
                      className={`cursor-pointer relative border rounded-lg ${selectedAsset?.id === vid.id ? "border-blue-500" : "border-gray-200"}`}
                    >
                      <video src={vid.src} className="w-full h-40 object-cover rounded-lg" />
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
                      <TrendingUp className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">AI Suggestions</h1>
                      <p className="text-gray-600 text-xs">Generate captions, hashtags, and trending styles.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateSuggestions}
                    className="flex self-start rounded-lg cursor-pointer hover:bg-blue-800 justify-center bg-blue-700 text-white p-2 items-center"
                    disabled={loading[3]}
                  >
                    {loading[3] ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Generate Suggestions"
                    )}
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex relative items-center gap-2">
                    <input
                      type="text"
                      placeholder="Your caption here!"
                      value={creativeData.caption || ""}
                      onChange={(e) => setCreativeData((prev) => ({ ...prev, caption: e.target.value }))}
                      className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155dfc]"
                    />
                    <span className="text-gray-500 absolute right-2 text-sm">280</span>
                  </div>
                  <div className="flex relative items-center gap-2">
                    <input
                      type="text"
                      placeholder="Hashtags (e.g., #SocialMedia #Brand)"
                      value={creativeData.hashtags.join(" ") || ""}
                      onChange={(e) =>
                        setCreativeData((prev) => ({ ...prev, hashtags: e.target.value.split(" ").filter(Boolean) }))
                      }
                      className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155dfc]"
                    />
                  </div>
                  <div className="flex relative items-center gap-2">
                    <input
                      type="text"
                      placeholder="Style (e.g., Modern, Bold)"
                      value={creativeData.style || ""}
                      onChange={(e) => setCreativeData((prev) => ({ ...prev, style: e.target.value }))}
                      className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155dfc]"
                    />
                    <span className="text-gray-500 absolute right-2 text-sm">Optional</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-2 flex-row gap-2 mb-7 py-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Image className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Edit & Preview</h1>
                    <p className="text-gray-600 text-xs">Preview your creative for each platform.</p>
                  </div>
                </div>
                {preview && (
                  <div className="flex flex-col items-center">
                    {selectedAsset?.type === "video" ? (
                      <video src={selectedAsset.src} controls className="w-full max-w-md h-auto rounded-lg border border-gray-200" />
                    ) : (
                      <img src={preview.src} alt="Preview" className="w-full max-w-md h-auto rounded-lg border border-gray-200" />
                    )}
                    <p className="mt-2 text-sm">{preview.caption}</p>
                    <p className="text-sm text-blue-600">{preview.hashtags}</p>
                    <p className="text-xs text-gray-500">Style: {preview.style}</p>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-2 flex-row gap-2 mb-7 py-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Download className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Export or Schedule</h1>
                    <p className="text-gray-600 text-xs">Download your creative or schedule it to a social platform.</p>
                  </div>
                </div>
                {result && (
                  <div className="flex flex-col items-center">
                    {result.type === "export" ? (
                      <>
                        <h3 className="text-lg font-semibold text-green-600">Creative Exported!</h3>
                        <a href={result.url} download className="mt-4 text-blue-600 underline">
                          Download Creative
                        </a>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-green-600">Post Scheduled!</h3>
                        <p className="mt-2 text-sm">Post ID: {result.postId}</p>
                      </>
                    )}
                  </div>
                )}
                {!result && (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleExport}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[5]}
                    >
                      {loading[5] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Export"
                      )}
                    </button>
                    <button
                      onClick={handleSchedule}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[5]}
                    >
                      {loading[5] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Schedule"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {showCropper && (
              <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                <div className="relative w-[700px] h-[600px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={formatOptions.find((opt) => opt.type === format)?.size.split("x").map(Number)[0] /
                      formatOptions.find((opt) => opt.type === format)?.size.split("x").map(Number)[1]}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop"
                      src={selectedAsset.src}
                      onLoad={(e) => onImageLoaded(e.currentTarget)}
                      onError={() => console.error(`Failed to load crop image: ${selectedAsset.src}`)}
                    />
                  </ReactCrop>
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => setShowCropper(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCroppedImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
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
                onClick={handleExport}
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

export default CreateSocialCreatives;