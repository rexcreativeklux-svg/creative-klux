"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import {
  CREATIVES,
  getCreativeById,
  getCategoryById,
} from "../../(pages)/studio/creatives";

import ImageAdsForm from "./forms/ImageAdsForm.jsx";
import VideoAdsForm from "./forms/VideoAdsForm";
import PostsForm from "./forms/PostForm";
import ReelsForm from "./forms/ReelsForm";
import BannersForm from "./forms/BannersForm";
import LogoForm from "./forms/LogoForm";
import BusinessCardForm from "./forms/BusinessCardForm";
import BannersPrintDigitalForm from "./forms/BannersPrintDigitalForm";
import ThumbnailsForm from "./forms/ThumbnailsForm";
import MemesTrendsForm from "./forms/MemesTrendForm";
import TextToImageForm from "./forms/TextToImageForm";
import TextToVideoForm from "./forms/TextToVideoForm";
import ImageToVariationsForm from "./forms/ImageToVariationForm";
import ScriptToVoiceoverForm from "./forms/ScriptToVoiceOverForm";
import AudioToTextForm from "./forms/AudioToTextForm";
import PersonaBasedGeneratorForm from "./forms/PersonaBasedGeneratorForm";
import TextToAudioForm from "./forms/TextToAudioForm";
import FlyerForm from "./forms/FlyerForm";
import BrochuresForm from "./forms/BrochureForm";
import PosterForm from "./forms/PosterForm";
import InfographicForm from "./forms/InfographicForm";
import PresentationDeckForm from "./forms/PresentationDeckForm";
import PackagingForm from "./forms/PackagingMockupForm";
import DigitalBusinessCardForm from "./forms/DigitalBusinessCardForm";
import AdPreview from "./Adpreview.jsx";
import Toast from "@/app/(components)/Toast.jsx";
import AdsIntegrationModal from "@/app/(components)/AdsIntegrationModal.jsx";

// ─── inner component that reads search params ─────────────────────────────────
const StudioInner = () => {
  const { activeBrand, sendUrl, generateCustomCreative, saveDesign, activeBrandId, fetchDesignTemplates } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const creativeParam = searchParams.get("creative") || CREATIVES[0].id;

  // resolve the creative object first so we can read its categories
  const creative = getCreativeById(creativeParam);

  const [selectedCreative] = useState(creativeParam);
  const [selectedCategory, setSelectedCategory] = useState(
    creative?.categories[0]?.id || CREATIVES[0].categories[0].id
  );
  const [step, setStep] = useState("form"); // "form" | "result"

  const [formData, setFormData] = useState({
    brandName: activeBrand?.name || "",
    brandColor: activeBrand?.primary_color || "#2563eb",
    description: activeBrand?.description || "",
    primaryColor: activeBrand?.primary_color || "#2563eb",
    secondaryColor: activeBrand?.secondary_color || "#0ea5e9",
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
    if (res?.append) {
      setResult((prev) => {
        if (!prev) return { ...res, append: undefined };
        return {
          ...prev,
          variations: [
            ...(prev.variations || []),
            ...(res.variations || []),
          ],
          assets: [
            ...(prev.assets || []),
            ...(res.assets || []),
          ],
          // Update done / expectedCount only if explicitly provided in this update
          ...(res.done !== undefined ? { done: res.done } : {}),
          ...(res.expectedCount !== undefined ? { expectedCount: res.expectedCount } : {}),
        };
      });
      return;
    }
    setResult(res);
    setStep("result");
  };

  useEffect(() => {
    if (!activeBrand) return;

    const color = activeBrand.primary_color || "#2563eb";

    setFormData((prev) => ({
      ...prev,
      brandName: activeBrand.name || "",
      description: activeBrand.description || "",

      // ✅ canonical
      brandColor: color,

      // ⚠️ derived (temporary)
      primaryColor: color,
      secondaryColor: activeBrand.secondary_color || prev.secondaryColor,

      logo: activeBrand.logo || prev.logo,
      caption: `Discover ${activeBrand.name || "our brand"}!`,
    }));
  }, [activeBrand]);


  const category = getCategoryById(selectedCreative, selectedCategory);

  const handleBack = () => {
    if (step === "result") {
      setStep("form");
      setResult(null);
    } else {
      router.push("/studio/select");
    }
  };

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
      fetchDesignTemplates,
    };

    if (selectedCreative === "ads_creative") {
      if (selectedCategory === "video") return <VideoAdsForm {...commonProps} />;
      return <ImageAdsForm {...commonProps} />;
    }

    if (selectedCreative === "social_creative") {
      if (selectedCategory === "reels") return <ReelsForm {...commonProps} />;
      if (selectedCategory === "banners_covers") return <BannersForm {...commonProps} />;
      if (selectedCategory === "thumbnails") return <ThumbnailsForm {...commonProps} />;
      if (selectedCategory === "memes") return <MemesTrendsForm {...commonProps} />;
      return <PostsForm {...commonProps} />;
    }

    if (selectedCreative === "designer_creative") {
      if (selectedCategory === "logos") return <LogoForm {...commonProps} />;
      if (selectedCategory === "business_cards") return <BusinessCardForm {...commonProps} />;
      if (selectedCategory === "banners_print") return <BannersPrintDigitalForm {...commonProps} />;
      if (selectedCategory === "flyers") return <FlyerForm {...commonProps} />;
      if (selectedCategory === "brochures") return <BrochuresForm {...commonProps} />;
      if (selectedCategory === "posters") return <PosterForm {...commonProps} />;
      if (selectedCategory === "infographics") return <InfographicForm {...commonProps} />;
      if (selectedCategory === "presentation_decks") return <PresentationDeckForm {...commonProps} />;
      if (selectedCategory === "packaging") return <PackagingForm {...commonProps} />;
      if (selectedCategory === "digital_biz_cards") return <DigitalBusinessCardForm {...commonProps} />;
      return <ComingSoon creative={creative} category={category} />;
    }

    if (selectedCreative === "magic_studio") {
      if (selectedCategory === "text_to_image") return <TextToImageForm {...commonProps} />;
      if (selectedCategory === "text_to_video") return <TextToVideoForm {...commonProps} />;
      if (selectedCategory === "image_to_variations") return <ImageToVariationsForm {...commonProps} />;
      if (selectedCategory === "script_to_voiceover") return <ScriptToVoiceoverForm {...commonProps} />;
      if (selectedCategory === "audio_to_text") return <AudioToTextForm {...commonProps} />;
      if (selectedCategory === "persona_generator") return <PersonaBasedGeneratorForm {...commonProps} />;
      if (selectedCategory === "text_to_audio") return <TextToAudioForm {...commonProps} />;
      return <ComingSoon creative={creative} category={category} />;
    }

    return <ComingSoon creative={creative} category={category} />;
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100%", fontFamily: "'DM Sans', sans-serif" }}
    >
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={closeToast} duration={2000} />

      {/* ── header ── */}
      <div className="flex items-center gap-2 mb-5 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          {step === "result" ? "Back to form" : "Back"}
        </button>

        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <ChevronRight className="w-3.5 h-3.5" />
          <span
            className="font-medium transition-colors"
            style={{ color: creative?.color }}
          >
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

      {/* ── page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Creative Studio</h1>
          <p className="text-sm text-gray-400 mt-0.5">Select a category to get started.
          </p>
        </div>
      </div>

      {/* ── steps ── */}
      <AnimatePresence mode="wait">

        {/* ── FORM STEP ── */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col gap-4 overflow-y-auto hide-scrollbar pr-1 min-h-0"
          >
            {/* Category pills */}
            <CategorySelector
              creative={creative}
              selected={selectedCategory}
              onChange={(cat) => {
                setSelectedCategory(cat);
                setResult(null);
              }}
            />

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedCreative}-${selectedCategory}`}
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

        {/* ── RESULT STEP ── */}
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
              onBack={() => { setStep("form"); setResult(null); }}
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
};

// ─── CategorySelector ─────────────────────────────────────────────────────────
const CategorySelector = ({ creative, selected, onChange }) => (
  <div className="shrink-0">
    <p
      className="text-[10px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: creative.color }}
    >
      {creative.label}
    </p>
    <div className="flex flex-wrap gap-2">
      {creative.categories.map((cat) => {
        const active = selected === cat.id;
        const isDisabled = !!cat.disabled;
        return (
          <button
            key={cat.id}
            onClick={() => { if (!isDisabled) onChange(cat.id); }}
            disabled={isDisabled}
            title={isDisabled ? (cat.comingSoonLabel || "Coming soon…") : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
              isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105"
            }`}
            style={{
              borderColor: active ? creative.color : `${creative.color}30`,
              background: active ? creative.color : "white",
              color: active ? "white" : creative.color,
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── ComingSoon ───────────────────────────────────────────────────────────────
const ComingSoon = ({ creative, category }) => (
  <div
    className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-3 text-center"
    style={{ borderColor: `${creative.color}30` }}
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
      style={{ background: `${creative.color}15` }}
    >
      🚧
    </div>
    <p className="text-sm font-semibold text-gray-600">{category?.label}</p>
    <p className="text-xs text-gray-400">This form is coming soon. We're building it next!</p>
  </div>
);

// ─── page export (wrapped in Suspense for useSearchParams) ────────────────────
export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <StudioInner />
    </Suspense>
  );
}