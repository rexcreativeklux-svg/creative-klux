"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  ChevronRight,
  FileImage,
  Layers,
  Mic,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Import only the magic studio creative definition
import { getCreativeById, getCategoryById } from "../studio/creatives";

// Magic Studio forms
import TextToImageForm from "../studio/forms/TextToImageForm";
import TextToVideoForm from "../studio/forms/TextToVideoForm";
import ImageToVariationsForm from "../studio/forms/ImageToVariationForm";
import ScriptToVoiceoverForm from "../studio/forms/ScriptToVoiceOverForm";
import AudioToTextForm from "../studio/forms/AudioToTextForm";
import PersonaBasedGeneratorForm from "../studio/forms/PersonaBasedGeneratorForm";
import TextToAudioForm from "../studio/forms/TextToAudioForm";

import AdPreview from "../studio/Adpreview";
import Toast from "@/app/(components)/Toast.jsx";
import AdsIntegrationModal from "@/app/(components)/AdsIntegrationModal.jsx";

// ── constants ─────────────────────────────────────────────────────────────────
const CREATIVE_ID = "magic_studio";

// ── ComingSoon fallback ───────────────────────────────────────────────────────
const ComingSoon = ({ category }) => (
  <div className="rounded-2xl border-2 border-dashed border-pink-100 p-12 flex flex-col items-center gap-3 text-center">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-pink-50">
      🚧
    </div>
    <p className="text-sm font-semibold text-gray-600">{category?.label}</p>
    <p className="text-xs text-gray-400">
      This form is coming soon. We're building it next!
    </p>
  </div>
);

const categoryIconMap = {
  text_to_image: FileImage,
  text_to_video: Video,
  image_to_variations: Layers,
  script_to_voiceover: Mic,
  audio_to_text: AudioLines,
  persona_generator: User,
  text_to_audio: Sparkles,
};

// ── CategorySelector ──────────────────────────────────────────────────────────
const CategorySelector = ({ creative, selected, onChange }) => {
  return (
    <div className="shrink-0">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: creative.color }}
        />
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: creative.color }}
        >
          Select a category to get started
        </p>
      </div>

      {/* GRID */}
      <div className="flex flex-wrap gap-2">
        {creative.categories.map((cat) => {
          const active = selected === cat.id;
          const Icon = categoryIconMap[cat.id];

          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              style={{
                borderColor: active ? creative.color : `${creative.color}25`,
                background: active ? `${creative.color}12` : "white",
                boxShadow: active
                  ? `0 6px 18px ${creative.color}20`
                  : "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {/* ICON */}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: active ? creative.color : `${creative.color}10`,
                }}
              >
                {Icon && (
                  <Icon
                    size={14}
                    strokeWidth={2}
                    color={active ? "white" : creative.color}
                  />
                )}
              </div>

              {/* TEXT */}
              <span
                className="text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  color: active ? creative.color : "#0f172a",
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MagicStudioPage() {
  const {
    activeBrand,
    sendUrl,
    generateCustomCreative,
    saveDesign,
    activeBrandId,
  } = useAuth();
  const router = useRouter();

  // The creative object is always magic_studio
  const creative = getCreativeById(CREATIVE_ID);

  const [selectedCategory, setSelectedCategory] = useState(
    creative?.categories[0]?.id || "text_to_image",
  );
  const [step, setStep] = useState("form"); // "form" | "result"

  const [formData, setFormData] = useState({
    brandName: activeBrand?.name || "",
    brandColor: activeBrand?.primary_color || "#db2777",
    description: activeBrand?.description || "",
    primaryColor: activeBrand?.primary_color || "#db2777",
    secondaryColor: activeBrand?.secondary_color || "#ec4899",
    font: "Montserrat",
    logo: activeBrand?.logo || "",
    caption: "",
    hashtags: [],
    size: "1080x1080",
    campaignGoal: "Engagement",
    visualStyle: "modern",
    audience: "B2C",
    fileFormat: "PNG",
    videoType: "Reels",
    videoStyle: "cinematic",
    backgroundImage: null,
    duration: "",
    videoFormat: "MP4",
    postTone: "Casual",
    tone: "casual",
    platforms: "instagram",
    postSize: "1080x1080",
    cta: "Download Now",
  });

  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [currentAssets, setCurrentAssets] = useState([]);

  const showToast = (msg) => setToast({ isOpen: true, message: msg });
  const closeToast = () => setToast({ isOpen: false, message: "" });

  const handleResult = (res) => {
    setResult(res);
    setStep("result");
  };

  // Sync brand data
  useEffect(() => {
    if (!activeBrand) return;
    const color = activeBrand.primary_color || "#db2777";
    setFormData((prev) => ({
      ...prev,
      brandName: activeBrand.name || "",
      description: activeBrand.description || "",
      brandColor: color,
      primaryColor: color,
      secondaryColor: activeBrand.secondary_color || prev.secondaryColor,
      logo: activeBrand.logo || prev.logo,
      caption: `Discover ${activeBrand.name || "our brand"}!`,
    }));
  }, [activeBrand]);

  const category = getCategoryById(CREATIVE_ID, selectedCategory);

  const handleBack = () => {
    if (step === "result") {
      setStep("form");
      setResult(null);
    } else {
      router.back();
    }
  };

  // ── Render the correct form for the selected category ─────────────────────
  const renderForm = () => {
    const commonProps = {
      categoryId: selectedCategory,
      category,
      creative,
      formData,
      setFormData,
      activeBrand,
      sendUrl,
      showToast,
      onResult: handleResult,
      generateCustomCreative,
    };

    switch (selectedCategory) {
      case "text_to_image":
        return <TextToImageForm {...commonProps} />;
      case "text_to_video":
        return <TextToVideoForm {...commonProps} />;
      case "image_to_variations":
        return <ImageToVariationsForm {...commonProps} />;
      case "script_to_voiceover":
        return <ScriptToVoiceoverForm {...commonProps} />;
      case "audio_to_text":
        return <AudioToTextForm {...commonProps} />;
      case "persona_generator":
        return <PersonaBasedGeneratorForm {...commonProps} />;
      case "text_to_audio":
        return <TextToAudioForm {...commonProps} />;
      default:
        return <ComingSoon category={category} />;
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100%", fontFamily: "'DM Sans', sans-serif" }}
    >
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={closeToast}
        duration={2000}
      />

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5 shrink-0">
        {/* <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          {step === "result" ? "Back to form" : "Back"}
        </button> */}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          {/* <ChevronRight className="w-3.5 h-3.5" /> */}
          <span className="font-medium" style={{ color: creative?.color }}>
            {creative?.label}
          </span>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-500">{category.label}</span>
            </>
          )}
          {step === "result" && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-500">Results</span>
            </>
          )}
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Magic Studio
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            AI-powered generation — images, video, audio & more.
          </p>
        </div>
      </div>

      {/* ── Steps ── */}
      <AnimatePresence mode="wait">
        {/* FORM STEP */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col gap-4 overflow-y-auto hide-scrollbar pr-1 min-h-0"
          >
            <CategorySelector
              creative={creative}
              selected={selectedCategory}
              onChange={(cat) => {
                setSelectedCategory(cat);
                setResult(null);
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderForm()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* RESULT STEP */}
        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 overflow-y-auto hide-scrollbar min-h-0"
          >
            <AdPreview
              creative={creative}
              category={category}
              formData={formData}
              result={result}
              onBack={() => {
                setStep("form");
                setResult(null);
              }}
              onOpenModal={(type, assets) => {
                setActionType(type);
                setCurrentAssets(assets);
                setIsAdsModalOpen(true);
              }}
              saveDesign={saveDesign}
              activeBrandId={activeBrandId}
              showToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isAdsModalOpen && (
        <AdsIntegrationModal
          isOpen={isAdsModalOpen}
          onClose={() => setIsAdsModalOpen(false)}
          actionType={actionType}
          assets={currentAssets}
        />
      )}
    </div>
  );
}
