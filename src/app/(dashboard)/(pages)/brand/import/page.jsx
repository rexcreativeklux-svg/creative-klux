
"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Share2, Recycle, CheckCircle2, Link, Music2, Search, Globe, Youtube, Check, Loader2, X, Zap, Settings, Upload } from "lucide-react";
import { FaPinterest, FaWhatsapp, FaSnapchat, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import {
  getBrands,
  saveBrand,
  getBrandById,
  makeBrandUrl,
  parseBrandIdFromUrl,
} from "@/utils/localDb";
import { useBrand } from "@/context/BrandContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/app/(components)/NotificationModal";

export default function ImportBrand({ brands = [], refreshBrands, setBrandView, setActiveTab }) {
  const { setActiveBrand } = useBrand();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [justCreatedUrl, setJustCreatedUrl] = useState("");
  const [compiledData, setCompiledData] = useState({
    name: "",
    description: "",
    tagline: "",
    fonts: "",
    logo: null,
    logoFileName: null,
    logoDataUrl: null,
    colors: { primary: "", secondary: "" },
    socialAccounts: [],
    adAccounts: [],
    sourceUrl: null,
    industry: "", // Added industry field
  });
  const [brandCreating, setBrandCreating] = useState(false);
  const [brandCreated, setBrandCreated] = useState(false);
  const { sendUrl, createBrand } = useAuth();
  const router = useRouter();
  const [importedBrand, setImportedBrand] = useState(null);
  const [importing, setImporting] = useState(false);
  // Add state for modal
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showNotification = (title, message, type = 'error') => {
    setNotification({ isOpen: true, title, message, type });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    resetForm();
  }, []);

  const resetForm = () => {
    setCompiledData({
      name: "",
      description: "",
      tagline: "",
      fonts: "",
      logoDataUrl: null,
      colors: { primary: "#1e3a8a", secondary: "#10b981" },
      socialAccounts: [],
      adAccounts: [],
      sourceUrl: null,
      industry: "", // Reset industry
    });
    setUrl("");
    setJustCreatedUrl("");
    setBrandCreating(false);
    setBrandCreated(false);
    setStep(0);
  };

  // 2. Fixed onLogoFileChange - stores both File and preview URL
  const onLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompiledData((prev) => ({
        ...prev,
        logo: file, // ✅ Store the actual File object
        logoDataUrl: ev.target.result, // Store preview URL
        logoFileName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    if (!url.trim()) return;

    setImporting(true);
    try {
      const brandData = await sendUrl(url);

      if (!brandData || !brandData.data) {
        console.error("Failed to import brand");
        setImporting(false);
        return;
      }

      setImportedBrand(brandData.data);
      setStep(1);
    } catch (err) {
      console.error("Import failed:", err);
    } finally {
      setTimeout(() => setImporting(false), 400); // Smooth fade out
    }
  };

  useEffect(() => {
    if (step !== 1 || !importedBrand) return;

    // Set all text fields immediately
    setCompiledData(prev => ({
      ...prev,
      name: importedBrand.name || "",
      description: importedBrand.description || "",
      tagline: importedBrand.tagline || "",
      fonts: importedBrand.font || "Inter",
      colors: {
        primary: importedBrand.primary_color || "#1e3a8a",
        secondary: importedBrand.secondary_color || "#10b981",
      },
      socialAccounts: importedBrand.socialAccounts || [],
      adAccounts: importedBrand.adAccounts || [],
      sourceUrl: url,
      industry: importedBrand.industry || "",
      logoDataUrl: importedBrand.logo || null, // Show preview immediately
      logo: null, // Will be set after download
    }));

    // Download logo in background if available
    if (importedBrand.logo) {
      const downloadLogo = async () => {
        try {
          console.log('Downloading logo from:', importedBrand.logo);

          // Try direct fetch first (works if CORS allows)
          let response = await fetch(importedBrand.logo).catch(() => null);

          // If direct fetch fails, try with proxy
          if (!response || !response.ok) {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(importedBrand.logo)}`;
            response = await fetch(proxyUrl);
          }

          if (response && response.ok) {
            const blob = await response.blob();
            const fileName = importedBrand.logo.split('/').pop().split('?')[0] || `logo-${Date.now()}.png`;
            const file = new File([blob], fileName, { type: blob.type || 'image/png' });

            console.log('Logo downloaded successfully:', file.name, file.size, file.type);

            setCompiledData(prev => ({
              ...prev,
              logo: file, // ✅ Store the File object
              logoFileName: fileName,
            }));
          } else {
            throw new Error('Failed to fetch logo');
          }
        } catch (err) {
          console.warn('Logo download failed, will try converting URL during brand creation:', err);
          // Don't set logo to null - keep the URL for later conversion attempt
        }
      };

      downloadLogo();
    }

    setImportedBrand(null); // Clear imported data after processing
  }, [step, importedBrand, url]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    window.fbAsyncInit = function () {
      FB.init({
        appId: "415385890784940",
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleConnect = () => {
    FB.login(
      function (response) {
        if (response.authResponse) {
          console.log("User token:", response.authResponse.accessToken);
        } else {
          console.log("Login cancelled");
        }
      },
      { scope: "public_profile,pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  const updateCompiledData = (updates) => {
    setCompiledData((prev) => ({ ...prev, ...updates }));
  };

  const handleContinue = () => {
    if (step < steps.length) setStep(step + 1);
  };

  const completeBrandCreation = async () => {
    // Validation
    if (!compiledData.name.trim()) {
      showNotification('Brand name required', 'Please enter a brand name.', 'error');
      return;
    }
    if (!compiledData.industry) {
      showNotification('Industry required', 'Please select an industry.', 'error');
      return;
    }

    // SHOW "CREATING" NOTIFICATION IMMEDIATELY
    showNotification('Creating your brand...', 'This may take a few seconds.', 'info');
    setBrandCreating(true);

    try {
      let logoFile = compiledData.logo; // This is already a File from manual upload or background download

      // If we don't have a File yet but have a logoDataUrl, convert it now
      if (!logoFile && compiledData.logoDataUrl) {
        console.log('Converting logoDataUrl to File...');

        try {
          // Check if it's a data URL (base64)
          if (compiledData.logoDataUrl.startsWith('data:')) {
            const matches = compiledData.logoDataUrl.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];

              // Convert base64 to blob
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });

              const extension = mimeType.split('/')[1] || 'png';
              const fileName = compiledData.logoFileName || `logo.${extension}`;
              logoFile = new File([blob], fileName, { type: mimeType });

              console.log('✅ Logo converted from data URL:', logoFile.name, logoFile.size, logoFile.type);
            }
          } else {
            // It's a regular URL - try to fetch it
            console.log('Fetching logo from URL:', compiledData.logoDataUrl);

            let response = await fetch(compiledData.logoDataUrl).catch(() => null);

            // Try with proxy if direct fetch fails
            if (!response || !response.ok) {
              const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(compiledData.logoDataUrl)}`;
              response = await fetch(proxyUrl);
            }

            if (response && response.ok) {
              const blob = await response.blob();
              const fileName = compiledData.logoFileName ||
                compiledData.logoDataUrl.split('/').pop().split('?')[0] ||
                `logo-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
              logoFile = new File([blob], fileName, { type: blob.type });

              console.log('✅ Logo fetched from URL:', logoFile.name, logoFile.size, logoFile.type);
            }
          }
        } catch (err) {
          console.warn('❌ Logo conversion failed:', err);
          showNotification(
            'Logo upload warning',
            'Could not process logo. Brand will be created without a logo.',
            'warning'
          );
          logoFile = null;
        }
      }

      const payload = {
        name: compiledData.name.trim(),
        description: compiledData.description || "",
        tagline: compiledData.tagline || "",
        fonts: compiledData.fonts || "Inter",
        logo: logoFile, // ✅ Now properly a File or null
        colors: {
          primary: compiledData.colors.primary || "#1e3a8a",
          secondary: compiledData.colors.secondary || "#10b981"
        },
        socialAccounts: compiledData.socialAccounts || [],
        adAccounts: compiledData.adAccounts || [],
        sourceUrl: compiledData.sourceUrl || url,
        url: url.trim(),
        industry: compiledData.industry,
        createLandingPage: false,
      };

      console.log('📤 Sending payload:', {
        ...payload,
        logo: payload.logo ? `${payload.logo.name} (${payload.logo.size} bytes, ${payload.logo.type})` : null
      });

      const brandData = await createBrand(payload);

      if (!brandData) {
        throw new Error("No response from server");
      }

      // Success!
      console.log('✅ Brand created successfully:', brandData);
      setJustCreatedUrl(makeBrandUrl(brandData.id));
      setActiveBrand(brandData);
      localStorage.setItem("activeBrand", JSON.stringify(brandData));
      refreshBrands();
      setBrandCreated(true);

      showNotification(
        'Brand created successfully!',
        `Your brand is ready to use!`,
        'success'
      );

      // Redirect to /brand/create after a short delay so user sees the success message
      setTimeout(() => {
        router.push('/brand/reuse');
      }, 500);

    } catch (error) {
      console.error("❌ Brand creation failed:", error);
      showNotification(
        'Creation failed',
        error.message || 'Something went wrong. Please try again.',
        'error'
      );
    } finally {
      setBrandCreating(false);
    }
  }; 

  const steps = [
    { id: 1, title: "Brand Details", icon: <Star className="h-5 w-5" /> },
    { id: 2, title: "Social Media Accounts", icon: <Share2 className="h-5 w-5" /> },
    { id: 3, title: "Ad Accounts", icon: <Recycle className="h-5 w-5" /> },
  ];

  return (
    <div className="flex w-full py-4 lg:mt-3 lg:px-6 z-50 gap-10">
      <div className="sticky bg-white overflow-hidden hidden lg:flex flex-col items-start w-[30%] h-[350px]">
        <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute top-0 left-4.5 w-1 bg-[#155dfc] rounded-full"
        />
        {steps.map((s) => (
          <div
            key={s.id}
            className="relative z-10 flex items-center h-full last:mb-0"
          >
            <div className="relative z-20">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
                  ${step === s.id
                    ? "border-[#155dfc] bg-blue-100 text-[#155dfc]"
                    : step > s.id
                      ? "bg-[#155dfc] border-[#155dfc] text-white"
                      : "border-gray-300 text-gray-300"
                  }`}
              >
                {step > s.id ? (
                  <CheckCircle2 size={20} className="text-[#155dfc]" />
                ) : (
                  s.icon
                )}
              </div>
            </div>
            <span
              className={`ml-3 text-sm font-medium ${step === s.id ? "text-[#155dfc]" : "text-black"}`}
            >
              <div className="text-gray-500 text-xs">Step {s.id}</div>
              <div className="font-medium">{s.title}</div>
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full gap-8 bg-transparent border-gray-200 rounded-lg">

        <div className="px-2">
          <AnimatePresence>
            {(step === 0 || step === 1) && (
              <motion.div initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} className="space-y-2 z-50 bg-white border px-3 py-2 rounded-md border-gray-200">
                <h2 className="text-lg font-semibold">Import Brand</h2>

                <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                  <Link className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-sm">URL</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="paste your landing page or website url here"
                    className="flex-1 text-sm placeholder:text-gray-300 outline-none"
                  />
                  <button
                    onClick={handleImport}
                    className="bg-[#155dfc] text-white px-4 py-1 rounded-md cursor-pointer font-medium transition hover:bg-blue-700"
                  >
                    Import
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Import Animation */}
        <AnimatePresence>
          {importing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4"
              >
                {/* Spinning border */}
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-4 border-gray-200 border-t-blue-700"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Upload className="w-10 h-10 text-blue-700" />
                    </motion.div>
                  </div>
                </div>

                {/* Text */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Importing Your Brand
                  </h3>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-sm text-gray-600 animate-pulse"
                  >
                    Please wait while we process your files...
                  </motion.p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 bg-blue-700 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-0 overflow-auto">
          {step > 0 && (
            <div className=" flex justify-between gap-10 flex-col p-2">
              <div className="space-y-6 border border-gray-100 p-2">
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Brand Details</h2>
                    <input
                      type="text"
                      placeholder="Brand Name"
                      value={compiledData.name}
                      onChange={(e) => updateCompiledData({ name: e.target.value })}
                      className="w-full border border-gray-200 p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Tagline / Slogan"
                      value={compiledData.tagline}
                      onChange={(e) => updateCompiledData({ tagline: e.target.value })}
                      className="w-full border border-gray-200 p-2 rounded"
                    />
                    <textarea
                      placeholder="Brand Description"
                      value={compiledData.description}
                      onChange={(e) => updateCompiledData({ description: e.target.value })}
                      className="w-full border border-gray-200 p-2 rounded"
                      rows="3"
                    />
                    <div className="flex flex-row gap-4">
                      <label className="px-2 py-1 border border-gray-200 rounded-md cursor-pointer bg-white inline-block">
                        Upload Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onLogoFileChange}
                          className="hidden"
                        />
                      </label>
                      {compiledData.logoDataUrl && (
                        <img
                          src={compiledData.logoDataUrl}
                          alt="Preview"
                          className="h-9 w-10 object-cover border border-gray-200 rounded-md"
                        />
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-row gap-2">
                        <label className="flex font-medium text-gray-600">Primary</label>
                        <input
                          type="color"
                          value={compiledData.colors.primary}
                          onChange={(e) =>
                            updateCompiledData({
                              colors: { ...compiledData.colors, primary: e.target.value },
                            })
                          }
                          className="w-8 h-6"
                        />
                      </div>
                      <div className="flex flex-row gap-2">
                        <label className="flex font-medium text-gray-600">Secondary</label>
                        <input
                          type="color"
                          value={compiledData.colors.secondary}
                          onChange={(e) =>
                            updateCompiledData({
                              colors: { ...compiledData.colors, secondary: e.target.value },
                            })
                          }
                          className="w-8 h-6"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Fonts & Typography</label>
                      <select
                        value={compiledData.fonts}
                        onChange={(e) => updateCompiledData({ font: e.target.value })}
                        className="w-full border border-gray-200 p-2 rounded"
                      >
                        <option value="">Select a font</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Industry</label>
                      <select
                        value={compiledData.industry}
                        onChange={(e) => updateCompiledData({ industry: e.target.value })}
                        className="w-full border border-gray-200 p-2 rounded"
                        required
                      >
                        <option value="">Select an industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Retail">Retail</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Social Media Accounts</h2>
                    <div className="space-y-3">
                      {[
                        {
                          id: "facebook",
                          name: "Facebook",
                          type: "Pages",
                          bg: "bg-blue-600",
                          icon: <FaFacebook className="w-5 h-5 text-white" />,
                        },
                        {
                          id: "instagram",
                          name: "Instagram",
                          type: "Business",
                          bg: "bg-pink-500",
                          icon: <FaInstagram className="w-5 h-5 text-white" />,
                        },
                      ].map((platform) => {
                        const connectedAccounts = compiledData.socialAccounts.filter(
                          (acc) => acc.platform === platform.id
                        ) || [];
                        return (
                          <div
                            key={platform.id}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 flex items-center justify-center rounded-full ${platform.bg}`}
                              >
                                {platform.icon}
                              </div>
                              <div>
                                <p className="font-medium">{platform.name}</p>
                                <p className="text-xs text-gray-500">{platform.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {connectedAccounts.length > 0 ? (
                                <select className="border border-gray-200 rounded px-2 py-1 text-sm">
                                  <option>
                                    {connectedAccounts.length} Account
                                    {connectedAccounts.length > 1 ? "s" : ""} Connected
                                  </option>
                                  {connectedAccounts.map((acc, i) => (
                                    <option key={i}>{acc.name || `Account ${i + 1}`}</option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-gray-400 text-sm">No Accounts Connected</p>
                              )}
                            </div>
                            <button
                              onClick={handleConnect}
                              className="ml-4 px-4 py-2 border cursor-pointer border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium"
                            >
                              Connect
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Ad Accounts</h2>
                    <div className="space-y-3">
                      {[
                        {
                          id: "google",
                          name: "Google Ads",
                          type: "Search & Display",
                          color: "bg-red-400",
                          icon: <Search className="w-6 h-6 text-white" />,
                        },
                        {
                          id: "metaAds",
                          name: "Meta Ads",
                          type: "Social Ads",
                          color: "bg-blue-600",
                          icon: <FaFacebook className="w-6 h-6 text-white" />,
                        },
                        {
                          id: "tiktokAds",
                          name: "TikTok Ads",
                          type: "Video Ads",
                          color: "bg-black",
                          icon: <Music2 className="w-6 h-6 text-white" />,
                        },
                        {
                          id: "linkedinAds",
                          name: "LinkedIn Ads",
                          type: "Professional Ads",
                          color: "bg-blue-700",
                          icon: <FaLinkedin className="w-6 h-6 text-white" />,
                        },
                        {
                          id: "bingAds",
                          name: "Bing Ads",
                          type: "Search Ads",
                          color: "bg-green-600",
                          icon: <Globe className="w-6 h-6 text-white" />,
                        },
                      ].map((platform) => {
                        const connectedAccounts = compiledData.adAccounts.filter(
                          (acc) => acc.platform === platform.id
                        ) || [];
                        return (
                          <div
                            key={platform.id}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${platform.color}`}>
                                {platform.icon}
                              </div>
                              <div>
                                <p className="font-medium">{platform.name}</p>
                                <p className="text-xs text-gray-500">{platform.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {connectedAccounts.length > 0 ? (
                                <select className="border border-gray-200 rounded px-2 py-1 text-sm">
                                  <option>
                                    {connectedAccounts.length} Account
                                    {connectedAccounts.length > 1 ? "s" : ""} Connected
                                  </option>
                                  {connectedAccounts.map((acc, i) => (
                                    <option key={i}>{acc.name || `Account ${i + 1}`}</option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-gray-400 text-sm">No Accounts Connected</p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                updateCompiledData({
                                  adAccounts: [
                                    ...compiledData.adAccounts,
                                    {
                                      platform: platform.id,
                                      name: `${platform.name} Account ${compiledData.adAccounts.filter((acc) => acc.platform === platform.id).length + 1
                                        }`,
                                    },
                                  ],
                                })
                              }
                              className="ml-4 px-4 cursor-pointer py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium"
                            >
                              Connect
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="py-2">
                {step > 0 && (
                  <div className="flex gap-4 justify-between">
                    {step === 1 && (
                      <button
                        onClick={resetForm}
                        className="bg-gray-200 cursor-pointer text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                      >
                        Cancel
                      </button>
                    )}
                    {step > 1 && (
                      <button
                        onClick={() => setStep(step - 1)}
                        className="bg-gray-200 cursor-pointer text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                      >
                        Back
                      </button>
                    )}
                    {step < steps.length ? (
                      <button
                        onClick={handleContinue}
                        className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={completeBrandCreation}
                        className="bg-[#155dfc] cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Create Brand
                      </button>
                    )}
                  </div>
                )}
              </div>

              <style jsx>{`
                @keyframes orbit {
                  0% {
                    transform: rotate(0deg) translateX(12px) rotate(0deg);
                  }
                  100% {
                    transform: rotate(360deg) translateX(12px) rotate(-360deg);
                  }
                }
                @keyframes progress {
                  0% {
                    transform: translateX(-100%);
                  }
                  50% {
                    transform: translateX(0%);
                  }
                  100% {
                    transform: translateX(100%);
                  }
                }
                .animate-progress {
                  animation: progress 2s ease-in-out infinite;
                }
              `}</style>
            </div>
          )}
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={3000}
      />
    </div>
  );
}