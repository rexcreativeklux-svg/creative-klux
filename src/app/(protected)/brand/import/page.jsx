
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Share2, Recycle, CheckCircle2, Link, Facebook, Instagram, Twitter, Music2, Search, Linkedin, Globe, Youtube, Check, Loader2, X, Zap, Settings } from "lucide-react";
import { FaPinterest, FaWhatsapp, FaSnapchat } from "react-icons/fa";
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

export default function ImportBrand({ brands = [], refreshBrands, setBrandView, setActiveTab }) {
  const { setActiveBrand } = useBrand();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [justCreatedUrl, setJustCreatedUrl] = useState("");
  const [compiledData, setCompiledData] = useState({
    name: "",
    description: "",
    tagline: "",
    font: "",
    logoDataUrl: null,
    logoFileName: null, // Added to store original file name
    colors: { primary: "#1e3a8a", secondary: "#10b981" },
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

  useEffect(() => {
    resetForm();
  }, []);

  const resetForm = () => {
    setCompiledData({
      name: "",
      description: "",
      tagline: "",
      font: "",
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

  const onLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompiledData((prev) => ({ ...prev, logoDataUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    if (!url.trim()) return;

    setStep(0);
    const brandData = await sendUrl(url);

    if (!brandData || !brandData.data) {
      console.error("Failed to import brand from URL or invalid data structure");
      return;
    }

    setImportedBrand(brandData.data);
    setStep(1);
  };

  useEffect(() => {
    if (step === 1 && importedBrand) {
      setCompiledData((prev) => ({
        ...prev,
        name: importedBrand.name || "",
        description: importedBrand.description || "",
        tagline: importedBrand.tagline || "",
        font: importedBrand.font || "",
        logoDataUrl: importedBrand.logo ? importedBrand.logo : prev.logoDataUrl,
        colors: {
          primary: importedBrand.primary_color || prev.colors.primary,
          secondary: importedBrand.secondary_color || prev.colors.secondary,
        },
        socialAccounts: importedBrand.socialAccounts || [],
        adAccounts: importedBrand.adAccounts || [],
        sourceUrl: url,
        industry: importedBrand.industry || "", // Handle imported industry
      }));
      setImportedBrand(null);
    }
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
    setBrandCreating(true);
    try {
      // Client-side validation
      if (!compiledData.name.trim()) {
        console.error("Brand name is required");
        setBrandCreating(false);
        return;
      }
      if (!compiledData.industry) {
        console.error("Industry is required");
        setBrandCreating(false);
        return;
      }

      const colors = compiledData.colors || { primary: "#1e3a8a", secondary: "#10b981" };
      let logo = null;
      if (compiledData.logoDataUrl) {
        try {
          console.log("Logo Data URL:", compiledData.logoDataUrl);
          const response = await fetch(compiledData.logoDataUrl);
          if (!response.ok) throw new Error("Failed to fetch logo Data URL");
          const blob = await response.blob();
          // Use original file name or fallback to dynamic extension
          const fileName = compiledData.logoFileName || `logo.${blob.type.split('/')[1] || 'png'}`;
          logo = new File([blob], fileName, { type: blob.type });
          console.log("Logo type:", logo instanceof File, logo, {
            name: logo.name,
            size: logo.size,
            type: logo.type,
          });
        } catch (error) {
          console.error("Error converting logo:", error);
          logo = null;
        }
      }

      // const completeBrandCreation = async () => {
      //   if (!compiledData.name.trim()) {
      //     console.error("Brand name is required");
      //     alert("Please provide a brand name.");
      //     return;
      //   }
      //   setBrandCreating(true);
      //   try {
      //     let landingPageDetails = null;

      //     if (createLandingPage) {
      //       landingPageDetails = generateMockLandingPage();
      //       setLandingPageUrl(landingPageDetails.url);
      //       setLandingPageCreated(true);
      //     }

      //     const payload = {
      //       name: compiledData.name,
      //       description: compiledData.description,
      //       tagline: compiledData.tagline,
      //       font: compiledData.font,
      //       logo: compiledData.logo,
      //       colors: compiledData.colors,
      //       socialAccounts: compiledData.socialAccounts,
      //       adAccounts: compiledData.adAccounts,
      //       sourceUrl: landingPageCreated ? landingPageUrl : compiledData.sourceUrl,
      //       createLandingPage: createLandingPage,
      //       landingPage: landingPageDetails,
      //     };
      //     const brandData = await createBrand(payload);
      //     setBrandCreated(true);
      //     setBrandCreating(false);
      //     // Save to local storage and update context
      //     const savedBrand = {
      //       id: Date.now().toString(),
      //       ...payload,
      //       sourceUrl: landingPageCreated ? landingPageUrl : null
      //     };
      //     saveBrand(savedBrand);
      //     setActiveBrand(savedBrand);
      //     localStorage.setItem("activeBrand", JSON.stringify(savedBrand));
      //     refreshBrands();
      //   } catch (err) {
      //     console.error("Error creating brand:", err.message);
      //     setBrandCreating(false);
      //     alert("Failed to create brand. Please try again.");
      //   }
      // };

      // <div>
      //   <label className="block mb-1 text-gray-600 font-medium">Industry</label>
      //   <select
      //     value={compiledData.industry}
      //     onChange={(e) => updateCompiledData({ industry: e.target.value })}
      //     className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
      //     required
      //   >
      //     <option value="">Select an industry</option>
      //     <option value="Technology">Technology</option>
      //     <option value="Healthcare">Healthcare</option>
      //     <option value="Retail">Retail</option>
      //     <option value="Finance">Finance</option>
      //     <option value="Education">Education</option>
      //     <option value="Hospitality">Hospitality</option>
      //     <option value="Other">Other</option>
      //   </select>
      // </div>
      //       <div>
      //         <label className="block mb-1 text-gray-600 font-medium">Source URL</label>
      //         <input
      //           type="url"
      //           placeholder="https://example.com"
      //           value={compiledData.sourceUrl}
      //           onChange={(e) => updateCompiledData({ sourceUrl: e.target.value })}
      //           className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
      //           required
      //         />
      //       </div>


      const payload = {
        name: compiledData.name || "Test Brand",
        description: compiledData.description || "Test description",
        tagline: compiledData.tagline || "Test slogan",
        font: compiledData.font || "Inter",
        logo: logo,
        primary_color: colors.primary,
        secondary_color: colors.secondary,
        social_accounts: compiledData.socialAccounts || [],
        ad_accounts: compiledData.adAccounts || [],
        source_url: compiledData.sourceUrl || "https://example.com",
        createLandingPage: false,
        industry: compiledData.industry || "Technology",
      };

      console.log("Payload being sent:", {
        ...payload,
        logo: logo ? `${logo.name} (${logo.size} bytes, ${logo.type})` : null,
        social_accounts: JSON.stringify(payload.social_accounts),
        ad_accounts: JSON.stringify(payload.ad_accounts),
      });
      console.log("Specific fields - Industry:", compiledData.industry, "Source URL:", compiledData.sourceUrl);

      const brandData = await createBrand(payload);

      if (!brandData) {
        console.error("Failed to create brand: No response from endpoint");
        setBrandCreating(false);
        return;
      }

      setJustCreatedUrl(makeBrandUrl(brandData.id));
      setActiveBrand(brandData);
      localStorage.setItem("activeBrand", JSON.stringify(brandData));
      refreshBrands();
      setBrandCreating(false);
      setBrandCreated(true);
    } catch (error) {
      console.error("Error creating brand:", error, error.stack);
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

      <div className="flex flex-col w-full gap-10 bg-transparent border-gray-200 rounded-lg">
        <div className="space-y-2 z-50 bg-white border px-3 py-2 rounded-md border-gray-200">
          <h2 className="text-lg font-semibold">Import Brand</h2>
          {justCreatedUrl && (
            <div className="text-sm">
              <div className="font-semibold">Mock Brand URL:</div>
              <div className="select-all break-all border border-gray-200 rounded-md p-2 bg-gray-50">
                {justCreatedUrl}
              </div>
              <div className="text-gray-500 mt-1">
                Copy and paste this into the URL field to import later.
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
            <Link className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-sm">URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="your landing page or website"
              className="flex-1 text-sm outline-none"
            />
            <button
              onClick={handleImport}
              className="bg-[#155dfc] text-white px-4 py-1 rounded-lg cursor-pointer font-medium transition hover:bg-blue-700"
            >
              Import
            </button>
          </div>
        </div>

        <div className="pt-0 overflow-auto">
          {step > 0 && (
            <div className="border border-gray-100 flex justify-between gap-10 flex-col p-2">
              <div className="space-y-6">
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
                        value={compiledData.font}
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
                          icon: <Facebook className="w-5 h-5 text-white" />,
                        },
                        {
                          id: "instagram",
                          name: "Instagram",
                          type: "Business",
                          bg: "bg-pink-500",
                          icon: <Instagram className="w-5 h-5 text-white" />,
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
                          icon: <Facebook className="w-6 h-6 text-white" />,
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
                          icon: <Linkedin className="w-6 h-6 text-white" />,
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
                {brandCreating && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-lg flex flex-col items-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-[#155dfc] border-t-transparent animate-spin"></div>
                        <div className="absolute top-0 left-1/2 w-3 h-3 bg-[#155dfc] rounded-full animate-[orbit_1.2s_linear_infinite]"></div>
                      </div>
                      <p className="text-lg font-semibold text-gray-700">
                        Creating your brand...
                      </p>
                    </div>
                  </div>
                )}
                {brandCreated && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-lg flex flex-col items-center space-y-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      </motion.div>
                      <p className="text-lg font-semibold text-gray-700">
                        Brand Created
                      </p>
                      <button
                        onClick={() => {
                          setBrandCreated(false);
                          router.push("/projects/create");
                        }}
                        className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Start Project
                      </button>
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
                        className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
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
    </div>
  );
}