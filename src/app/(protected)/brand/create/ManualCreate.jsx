"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Share2, Recycle, CheckCircle2, Facebook, Instagram, Twitter, Music2, Search, Linkedin, Globe, InstagramIcon, X, Youtube, TwitterIcon, Loader2, Check } from "lucide-react";
import { FaPinterest, FaSnapchat, FaWhatsapp } from "react-icons/fa";
import { saveBrand, makeBrandUrl } from "@/utils/localDb";
import { useRouter } from "next/navigation";
import { useBrand } from "@/context/BrandContext";
import { useAuth } from "@/context/AuthContext";

// Function to generate mock token and ID
const generateMockCredentials = () => {
  const token = `tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  const id = `id_${Math.random().toString(36).substr(2, 9)}`;
  return { token, id };
};

// Generate mock landing page details
const generateMockLandingPage = () => {
  const token = `lp_tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  const id = `lp_id_${Math.random().toString(36).substr(2, 9)}`;
  const name = `Landing Page ${Date.now()}`;
  const url = `https://landing.weviy.com/${id}`;
  return { id, token, name, url };
};

export default function ManualCreate({
  refreshBrands,
  setBrandView,
  setActiveTab,
  setActiveCreateTab,
  setBrandDraft,
  setShowModal,
  navigateProjectTo,
}) {
  const { setActiveBrand } = useBrand();
  const [step, setStep] = useState(1);
  const [compiledData, setCompiledData] = useState({
    name: "",
    description: "",
    logo: null,
    colors: { primary: "#1e3a8a", secondary: "#10b981" },
    tagline: "",
    fonts: "",
    socialAccounts: [],
    adAccounts: [],
    sourceUrl: "",
    industry: "",
  });
  const [createLandingPage, setCreateLandingPage] = useState(false); // Default to unchecked
  const [landingPageCreated, setLandingPageCreated] = useState(false);
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [brandCreating, setBrandCreating] = useState(false);
  const [brandCreated, setBrandCreated] = useState(false);
  const router = useRouter();
  const { createBrand } = useAuth();
  const [selectedWebsiteType, setSelectedWebsiteType] = useState("");


  useEffect(() => {
    if (step === 4 && createLandingPage && !landingPageCreated) {
      const timer = setTimeout(() => {
        const mockUrl = makeBrandUrl(Date.now().toString());
        setLandingPageUrl(mockUrl);
        setLandingPageCreated(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, createLandingPage, landingPageCreated]);

  useEffect(() => {
    return () => {
      if (compiledData.logo) {
        URL.revokeObjectURL(compiledData.logo);
      }
    };
  }, [compiledData.logo]);

  const resetForm = () => {
    setCompiledData({
      name: "",
      description: "",
      logoDataUrl: null,
      colors: { primary: "#1e3a8a", secondary: "#10b981" },
      tagline: "",
      fonts: "",
      socialAccounts: [],
      adAccounts: [],
      sourceUrl: null,
      industry: "",
    });
    setCreateLandingPage(false);
    setLandingPageCreated(false);
    setLandingPageUrl("");
    setBrandCreating(false);
    setBrandCreated(false);
    setStep(1); // Reset to Step 1 as initial state
  };

  const onLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompiledData((prev) => ({ ...prev, logo: file }));
  };

  const updateCompiledData = (updates) => {
    setCompiledData((prev) => ({ ...prev, ...updates }));
  };

  const handleContinue = () => {
    if (step < steps.length) setStep(step + 1);
  };

  const saveBrandData = () => {
    if (!compiledData.name.trim()) return null;

    const brandData = {
      id: Date.now().toString(),
      ...compiledData,
      sourceUrl: landingPageCreated ? landingPageUrl : null,
    };

    saveBrand(brandData);
    setActiveBrand(brandData);
    localStorage.setItem("activeBrand", JSON.stringify(brandData));
    refreshBrands();
    return brandData;
  };

  const completeBrandCreation = async () => {
    if (!compiledData.name.trim()) {
      console.error("Brand name is required");
      alert("Please provide a brand name.");
      return;
    }
    setBrandCreating(true);
    try {
      let landingPageDetails = null;

      if (createLandingPage) {
        landingPageDetails = generateMockLandingPage();
        setLandingPageUrl(landingPageDetails.url);
        setLandingPageCreated(true);
      }

      const payload = {
        name: compiledData.name,
        description: compiledData.description,
        tagline: compiledData.tagline,
        fonts: compiledData.fonts,
        logo: compiledData.logo,
        colors: compiledData.colors,
        socialAccounts: compiledData.socialAccounts,
        adAccounts: compiledData.adAccounts,
        sourceUrl: landingPageCreated ? landingPageUrl : compiledData.sourceUrl,
        createLandingPage: createLandingPage,
        landingPage: landingPageDetails,
        industry: compiledData.industry || "Technology",
      };
      const brandData = await createBrand(payload);
      console.log(brandData)
      setBrandCreated(true);
      setBrandCreating(false);
      // Save to local storage and update context
      const savedBrand = {
        id: Date.now().toString(),
        ...payload,
        sourceUrl: landingPageCreated ? landingPageUrl : null
      };
      saveBrand(savedBrand);
      setActiveBrand(savedBrand);
      localStorage.setItem("activeBrand", JSON.stringify(savedBrand));
      refreshBrands();
    } catch (err) {
      // console.error("Error creating brand:", err.message);
      setBrandCreating(false);
    }
  };

  const handlePreviewLandingPage = () => {
    if (landingPageUrl) {
      window.open(landingPageUrl, "_blank");
    }
  };

  const steps = [
    { id: 1, title: "Brand Details", icon: <Star className="h-5 w-5" /> },
    { id: 2, title: "Social Media Accounts", icon: <Share2 className="h-5 w-5" /> },
    { id: 3, title: "Ad Accounts", icon: <Recycle className="h-5 w-5" /> },
    { id: 4, title: "Create Landing Page", icon: <Globe className="h-5 w-5" /> },
  ];

  return (
    <div className="">
      <div className="flex w-full pb-14 lg:pb-0 lg:px-10 gap-10">
        <div className="hidden lg:flex overflow-hidden sticky z-20 mt-15 flex-col w-[30%] h-[500px]">
          <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute top-0 left-4.5 w-1 bg-[#155dfc] rounded-full"
          />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex items-center h-full last:mb-0">
              <div className="relative z-20">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
                  ${step === s.id ? "border-[#155dfc] bg-blue-100 text-[#155dfc]" : step > s.id ? "bg-[#155dfc] border-[#155dfc] text-white" : "border-gray-300 text-gray-300"}`}
                >
                  {step > s.id ? <CheckCircle2 size={20} className="text-[#155dfc]" /> : s.icon}
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
          <div className="pb-20 overflow-auto">
            {step === 1 && (
              <div className="space-y-6 border border-gray-200 p-2 rounded-lg">
                <div className="flex border-b p-2 border-b-gray-200 items-center gap-3">
                  <div className="p-2 rounded-full border border-[#155dfc]">
                    <Star className="h-5 w-5 text-[#155dfc]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-medium">Brand Details</h2>
                    <p className="text-gray-600 max-w-full sm:max-w-md mt-1 sm:mt-0">Enter your brand details</p>
                  </div>
                </div>

                <div className="flex space-y-5 p-2  flex-col">
                  <input
                    type="text"
                    placeholder="Brand Name"
                    value={compiledData.name}
                    onChange={(e) => updateCompiledData({ name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
                  />

                  <input
                    type="text"
                    placeholder="Tagline / Slogan"
                    value={compiledData.tagline}
                    onChange={(e) => updateCompiledData({ tagline: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
                  />

                  <textarea
                    placeholder="Brand Description"
                    value={compiledData.description}
                    onChange={(e) => updateCompiledData({ description: e.target.value })}
                    className="w-full bg-gray-50 border p-2 border-gray-300 rounded"
                    rows="3"
                  />

                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Industry</label>
                    <select
                      value={compiledData.industry}
                      onChange={(e) => updateCompiledData({ industry: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
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

                  <div className="flex flex-row gap-4">
                    <div>
                      <label className="px-2 py-1 border border-gray-300 rounded-md cursor-pointer bg-white inline-block">
                        Upload Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onLogoFileChange}
                          className="hidden "
                        />
                      </label>
                    </div>
                    <div className="flex justify-center">
                      {compiledData.logo && (
                        <img
                          src={URL.createObjectURL(compiledData.logo)}
                          alt="Preview"
                          className="h-9 w-10 object-cover border border-gray-200 rounded-md"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-row gap-2">
                      <div className="flex justify-center">
                        <label className="flex font-medium text-gray-600">Primary</label>
                      </div>
                      <div className="flex justify-center">
                        <input
                          type="color"
                          value={compiledData.colors.primary}
                          onChange={(e) =>
                            updateCompiledData({ colors: { ...compiledData.colors, primary: e.target.value } })
                          }
                          className="w-8 h-6"
                        />
                      </div>
                    </div>
                    <div className="flex flex-row gap-2">
                      <div className="flex justify-center">
                        <label className="flex font-medium text-gray-600">Secondary</label>
                      </div>
                      <div className="flex justify-center">
                        <input
                          type="color"
                          value={compiledData.colors.secondary}
                          onChange={(e) =>
                            updateCompiledData({ colors: { ...compiledData.colors, secondary: e.target.value } })
                          }
                          className="w-8 h-6"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Fonts & Typography</label>
                    <select
                      value={compiledData.fonts}
                      onChange={(e) => updateCompiledData({ fonts: e.target.value })}
                      className="w-full border bg-gray-50 border-gray-300 p-2 rounded"
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
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6 border border-gray-200 p-2 rounded-lg">
                <div className="flex border-b border-b-gray-200 rounded-lg p-2 items-center gap-3">
                  <div className="p-2 rounded-full border border-[#155dfc]">
                    <Share2 className="h-5 w-5 text-[#155dfc]" />
                  </div>

                  <div>
                    <h2 className="text-xl font-medium">Social Media</h2>
                    <p className="text-gray-400 max-w-full text-sm sm:max-w-md mt-1 sm:mt-0">
                      Connect a social media account for your brand.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                  {[
                    {
                      id: "facebook",
                      name: "Facebook",
                      type: "Pages",
                      bg: "bg-blue-600",
                      icon: "/logos/facebook.png",
                    },
                    {
                      id: "instagram",
                      name: "Instagram",
                      type: "Business",
                      bg: "bg-pink-500",
                      icon: "/logos/instagram.png",
                    }
                  ].map((platform) => {
                    const connectedAccounts = compiledData.socialAccounts.filter((acc) => acc.platform === platform.id) || [];
                    return (
                      <div
                        key={platform.id}
                        className="flex bg-gray-50 flex-col sm:flex-row sm:items-center justify-between border border-gray-200 rounded-lg p-3 transition"
                      >
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <img src={platform.icon} alt={platform.name} className="w-8 h-8 object-contain" />
                          <div>
                            <p className="font-medium">{platform.name}</p>
                            <p className="text-xs text-gray-500">{platform.type}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          {connectedAccounts.length > 0 ? (
                            <select className="border border-gray-200 rounded px-2 py-1 text-sm">
                              <option>
                                {connectedAccounts.length} Account{connectedAccounts.length > 1 ? "s" : ""} Connected
                              </option>
                              {connectedAccounts.map((acc, i) => (
                                <option key={i}>{acc.name || `Account ${i + 1}`}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-gray-400 text-sm">No Accounts Connected</p>
                          )}
                          <button
                            onClick={() => {
                              const creds = generateMockCredentials();
                              updateCompiledData({
                                socialAccounts: [
                                  ...compiledData.socialAccounts,
                                  {
                                    platform: platform.id,
                                    name: `${platform.name} Account ${compiledData.socialAccounts.filter(
                                      (acc) => acc.platform === platform.id
                                    ).length + 1
                                      }`,
                                    ...creds,
                                  },
                                ],
                              });
                            }}
                            className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium" >
                            Connect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6 border border-gray-200 rounded-lg p-2">
                <div className="flex items-center border-b border-b-gray-200 p-2  gap-3">
                  <div className="p-2 rounded-full border bg-[#155dfc] border-[#155dfc]">
                    <Recycle className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">Ads Account</h2>
                    <p className="text-gray-400 max-w-full text-sm sm:max-w-md mt-1 sm:mt-0">
                      Connect an ads account for your brand.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 ">
                  {[
                    {
                      id: "google",
                      name: "Google Ads",
                      type: "Search & Display",
                      bg: "bg-blue-600",
                      icon: "/logos/google.png",
                    },
                    {
                      id: "facebook",
                      name: "Facebook Ads",
                      type: "Social Ads",
                      bg: "bg-blue-600",
                      icon: "/logos/facebook.png",
                    },
                    {
                      id: "linkedin",
                      name: "LinkedIn Ads",
                      type: "Professional Ads",
                      bg: "bg-blue-700",
                      icon: "/logos/linkedin.png",
                    },
                    {
                      id: "twitter",
                      name: "X (Twitter) Ads",
                      type: "Social Ads",
                      bg: "bg-black",
                      icon: "/logos/x.png",
                    },
                  ].map((platform) => {
                    const connectedAccounts = compiledData.adAccounts.filter((acc) => acc.platform === platform.id) || [];
                    return (
                      <div
                        key={platform.id}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img src={platform.icon} alt={platform.name} className="w-8 h-8 object-contain" />
                          <div>
                            <p className="font-medium">{platform.name}</p>
                            <p className="text-sm text-gray-500">{platform.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {connectedAccounts.length > 0 ? (
                            <select className="border border-gray-200 rounded px-2 py-1 text-sm">
                              <option>
                                {connectedAccounts.length} Account{connectedAccounts.length > 1 ? "s" : ""} Connected
                              </option>
                              {connectedAccounts.map((acc, i) => (
                                <option key={i}>{acc.name || `Account ${i + 1}`}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-gray-400 text-sm">No Accounts Connected</p>
                          )}
                          <button
                            onClick={() => {
                              const creds = generateMockCredentials();
                              updateCompiledData({
                                adAccounts: [
                                  ...compiledData.adAccounts,
                                  {
                                    platform: platform.id,
                                    name: `${platform.name} Account ${compiledData.adAccounts.filter(
                                      (acc) => acc.platform === platform.id
                                    ).length + 1
                                      }`,
                                    ...creds,
                                  },
                                ],
                              });
                            }}
                            className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {step === 4 && (
              <div className=" flex flex-col p-3 justify-between rounded-xl">
                <div className="flex flex-col  rounded-lg p-2 w-full border border-gray-200 justify-between gap-4">
                  <div className="flex flex-col border border-gray-200 p-2 rounded-lg sm:flex-row gap-3 sm:items-center">
                    <div className="p-1.5 rounded-full border border-[#155dfc] bg-[#155dfc] flex justify-center">
                      <Globe className="h-6 w-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium">Select Website Type</h2>
                      <p className="text-gray-600 max-w-full sm:max-w-md mt-1 sm:mt-0">
                        Choose the type of website to build for your brand.
                      </p>
                    </div>
                  </div>
                  <div className=" flex py-2 mt-4 px-2">
                    <div className="grid grid-cols-1  w-full sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: "Business-Website", label: "Business Website", },
                        { id: "blog", label: "Blog/New Site", },
                        { id: "Resturant", label: "Resturant Website", },
                        { id: "Non-Profit ", label: "Non-Profit Website", },
                        { id: "E-commerce", label: "E-commerce Store", },
                        { id: "Landing", label: "Landing Page", },
                        { id: "Estate", label: "Real Estate Site", },
                        { id: "Membership", label: "Membership Site", },
                        { id: "Portfolio", label: "Portfolio Website", },
                        { id: "Corporate", label: "Corporate Website", },
                        { id: "Educational", label: "Educational Platform", },
                        { id: "Event", label: "Event Website", },
                      ].map((option) => (
                        <div
                          key={option.id}
                          onClick={() => {
                            setCreateLandingPage(true);
                            setLandingPageCreated(false);
                            setLandingPageUrl(option.id);
                          }}
                          className={`flex  items-center gap-3 p-2 w-full border rounded-md cursor-pointer transition-colors 
        ${landingPageUrl === option.id ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-700 border-gray-200"}
        ${brandCreating ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50"}`}
                        >
                          <div
                            className={`h-5 w-5 rounded-md border flex-shrink-0 flex items-center justify-center 
          ${landingPageUrl === option.id ? "bg-white" : "border-gray-300"}`}
                          >
                            {landingPageUrl === option.id && (
                              <Check className="h-5 w-5 text-blue-600 " />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="">{option.label}</span>
                            {/* <p className="text-xs text-gray-500">{option.description}</p> */}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
                {/* {!createLandingPage && (
                  <div className="flex justify-end mt-4 sm:mt-0">
                    <button
                      onClick={completeBrandCreation}
                      className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                      disabled={brandCreating}
                    >
                      {brandCreating ? "Creating..." : "Create Brand"}
                    </button>
                  </div>
                )} */}
                {createLandingPage && landingPageCreated && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-lg flex flex-col items-center space-y-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      </motion.div>
                      <p className="text-lg flex text-center font-semibold text-gray-700">
                        Landing page Created Successfully!
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={handlePreviewLandingPage}
                          className="bg-[#155dfc] cursor-pointer duration-300 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                          disabled={brandCreating}
                        >
                          Preview
                        </button>
                        <button
                          onClick={completeBrandCreation}
                          className="bg-[#155dfc] cursor-pointer duration-300 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                          disabled={brandCreating}
                        >
                          {brandCreating ? "Creating..." : "Create Brand"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {createLandingPage && !landingPageCreated && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-lg flex flex-col items-center space-y-6">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-[#155dfc] border-t-transparent animate-spin"></div>
                        <div className="absolute top-0 left-1/2 w-3 h-3 bg-[#155dfc] rounded-full animate-[orbit_1.2s_linear_infinite]"></div>
                      </div>
                      <p className="text-xl font-semibold text-gray-800 animate-pulse">
                        Crafting your Landing page...
                      </p>
                      <p className="text-sm text-gray-500 animate-fade-in">
                        This may take a few seconds.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {brandCreating && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
                <div className="bg-white rounded-2xl p-15 w-[90%] max-w-md shadow-lg flex flex-col items-center space-y-4">
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
                      router.push("/brand/reuse");
                    }}
                    className="bg-[#155dfc] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Finish
                  </button>
                </div>
              </div>
            )}
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
          {(step < steps.length || (step === 4 && !createLandingPage)) && (
            <div className="flex justify-between items-center">
              {step === 1 && (
                <button
                  onClick={resetForm}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-300 flex items-center gap-2"
                >
                  Cancel
                </button>
              )}
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
                >
                  Back
                </button>
              )}
              {step < 4 && (
                <button
                  onClick={handleContinue}
                  className="bg-[#155dfc] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Continue
                </button>
              )}
              {step === 4 && !createLandingPage && (
                <button
                  onClick={completeBrandCreation}
                  className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                  disabled={brandCreating}
                >
                  {brandCreating ? "Creating..." : "Create Brand"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}