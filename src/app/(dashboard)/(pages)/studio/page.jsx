"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ── creative configs ──────────────────────────────────────────────────────────
import {
  CREATIVES,
  getCreativeById,
  getCategoryById,
} from "../../(pages)/studio/creatives";

// ── category forms (image ads for now) ───────────────────────────────────────
import ImageAdsForm from "./forms/ImageAdsForm.jsx";
// Stubs for future forms — replace with real imports as you build them
// import VideoAdsForm from "./forms/VideoAdsForm";

// ── preview ───────────────────────────────────────────────────────────────────
import AdPreview from "./Adpreview.jsx";

// ── shared components ─────────────────────────────────────────────────────────
import Toast from "@/app/(components)/Toast.jsx";
import AdsIntegrationModal from "@/app/(components)/AdsIntegrationModal.jsx";
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

// ─────────────────────────────────────────────────────────────────────────────

const StudioPage = () => {
  const { activeBrand, sendUrl } = useAuth();

  // ── selection state ──────────────────────────────────────────────────────
  const [selectedCreative, setSelectedCreative] = useState(CREATIVES[0].id);
  const [selectedCategory, setSelectedCategory] = useState(
    CREATIVES[0].categories[0].id
  );

  // ── global shared form data (lifted up so preview always has it) ─────────
  const [formData, setFormData] = useState({
    brandName: activeBrand?.name || "",
    description: activeBrand?.description || "",
    primaryColor: activeBrand?.primary_color || "#2563eb",
    secondaryColor: activeBrand?.secondary_color || "#0ea5e9",
    font: "Montserrat",
    logo: activeBrand?.logo || "",
    caption: "",
    hashtags: [],
    size: "1200x628",
    campaignGoal: "",
    audience: "",
    fileFormat: "PNG",
    backgroundImage: null,
    // video / other future fields
    duration: "",
    format: "",
  });

  // ── result / modal state ─────────────────────────────────────────────────
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [currentAssets, setCurrentAssets] = useState([]);

  const showToast = (msg) => setToast({ isOpen: true, message: msg });
  const closeToast = () => setToast({ isOpen: false, message: "" });

  // ── prefill from activeBrand ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeBrand) return;
    setFormData((prev) => ({
      ...prev,
      brandName: activeBrand.name || "",
      description: activeBrand.description || "",
      primaryColor: activeBrand.primary_color || "#2563eb",
      secondaryColor: activeBrand.secondary_color || "#0ea5e9",
      logo: activeBrand.logo || prev.logo,
      caption: `Discover ${activeBrand.name || "our brand"}!`,
    }));
  }, [activeBrand]);

  // ── when creative changes, reset to first category ───────────────────────
  const handleCreativeChange = (creativeId) => {
    setSelectedCreative(creativeId);
    const creative = getCreativeById(creativeId);
    setSelectedCategory(creative.categories[0].id);
    setResult(null);
  };

  // ── resolve current creative / category objects ───────────────────────────
  const creative = getCreativeById(selectedCreative);
  const category = getCategoryById(selectedCreative, selectedCategory);

  // ── render the correct form based on creative + category ─────────────────
  const renderForm = () => {
    if (selectedCreative === "ads_creative") {
      if (selectedCategory === "video") {
        return (
          <VideoAdsForm
            categoryId={selectedCategory}
            category={category}
            creative={creative}
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }
      return (
        <ImageAdsForm
          categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult}
        />
      );
    }

    if (selectedCreative === "social_creative") {
      if (selectedCategory === "reels") {
        return (
          <ReelsForm
            categoryId={selectedCategory}
            category={category}
            creative={creative}
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "banners_covers") {
        return (
          <BannersForm
            categoryId={selectedCategory}
            category={category}
            creative={creative}
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "thumbnails") {
        return (
          <ThumbnailsForm
            categoryId={selectedCategory}
            category={category}
            creative={creative}
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "memes") {
        return (
          <MemesTrendsForm
            categoryId={selectedCategory}
            category={category}
            creative={creative}
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }



      // posts (and future: banners_covers, thumbnails, memes)
      return (
        <PostsForm
          categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult}
        />
      );
    }

    if (selectedCreative === "designer_creative") {
      if (selectedCategory === "logos") {
        return (
          <LogoForm
            categoryId={selectedCategory}
            category={category}
            creative={creative}
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "business_cards") {
        return <BusinessCardForm
          categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "banners_print") {
        return <BannersPrintDigitalForm categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "flyers") {
        return <FlyerForm categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "brochures") {
        return <BrochuresForm categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "posters") {
        return <PosterForm categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "infographics") {
        return <InfographicForm categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "presentation_decks") {
        return <PresentationDeckForm categoryId={selectedCategory}
          category={category}
          creative={creative}
          formData={formData}
          setFormData={setFormData}
          activeBrand={activeBrand}
          sendUrl={sendUrl}
          showToast={showToast}
          onResult={setResult} />;
      }

      if (selectedCategory === "packaging") {
        return (
          <PackagingForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "digital_biz_cards") {
        return (
          <DigitalBusinessCardForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            sendUrl={sendUrl}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      return <ComingSoon creative={creative} category={category} />;
    }

    if (selectedCreative === "magic_studio") {
      if (selectedCategory === "text_to_image") {
        return (
          <TextToImageForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "text_to_video") {
        return (
          <TextToVideoForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "image_to_variations") {
        return (
          <ImageToVariationsForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "script_to_voiceover") {
        return (
          <ScriptToVoiceoverForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "audio_to_text") {
        return (
          <AudioToTextForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "persona_generator") {
        return (
          <PersonaBasedGeneratorForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      if (selectedCategory === "text_to_audio") {
        return (
          <TextToAudioForm
            formData={formData}
            setFormData={setFormData}
            activeBrand={activeBrand}
            showToast={showToast}
            onResult={setResult}
          />
        );
      }

      return <ComingSoon creative={creative} category={category} />;
    }

    return <ComingSoon creative={creative} category={category} />;
  };

  return (
    <div className="flex flex-col overflow-hidden"
      style={{ height: '100%', fontFamily: "'DM Sans', sans-serif" }}>

      <Toast isOpen={toast.isOpen} message={toast.message} onClose={closeToast} duration={2000} />

      {/* ── page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Creative Studio</h1>
          <p className="text-sm text-gray-400 mt-0.5">Choose a creative engine to get started.
          </p>
        </div>
      </div>

      {/* ── main layout ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-6 px-1 pb-6 min-h-0 overflow-hidden">

        {/* ══ LEFT PANEL (scrollable) ══════════════════════════════════════ */}
        <div
          className="flex flex-1 flex-col gap-4 overflow-y-auto hide-scrollbar pr-1 min-h-0  "
        >
          {/* Creative type radio cards */}
          <CreativeSelector
            creatives={CREATIVES}
            selected={selectedCreative}
            onChange={handleCreativeChange}
          />

          {/* Category pills */}
          <CategorySelector
            creative={creative}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />

          {/* Form area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCreative}-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {renderForm()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ══ RIGHT PANEL (sticky, non-scrollable) ═══════════════════════ */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <AdPreview
            creative={creative}
            category={category}
            formData={formData}
            result={result}
            onBack={() => setResult(null)}
            onOpenModal={(type, assets) => {
              setActionType(type);
              setCurrentAssets(assets);
              setIsAdsModalOpen(true);
            }}
          />
        </div>
      </div>

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

// ─── CreativeSelector ─────────────────────────────────────────────────────────
const CreativeSelector = ({ creatives, selected, onChange }) => (
  <div className="  backdrop-blur  py- px-0  shrink-0">
    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
      What do you want to create today?

    </p>

    <div className="grid grid-cols-4 gap-2">
      {creatives.map((c) => {
        const Icon = c.icon;
        const active = selected === c.id;

        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`relative group cursor-pointer flex items-start gap-2 px-2 py-3 rounded-xl border transition-all duration-300 text-left overflow-hidden
              ${active
                ? ""
                : "hover:scale-[1.02]"
              }
            `}
            style={{
              borderColor: active ? c.color : "#E5E7EB",
              background: active
                ? `linear-gradient(135deg, ${c.color}15, ${c.color}05)`
                : "#ffffff",
            }}
          >
            {/* subtle glow */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300`}
              style={{
                background: `radial-gradient(circle at top right, ${c.color}15, transparent 60%)`,
              }}
            />

            {/* icon */}
            <div
              className="relative shrink-0 w-5 h-5 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${c.color}, ${c.color}cc)`
                  : `${c.color}12`,
              }}
            >
              <Icon
                className="w-2 h-2"
                style={{ color: active ? "#fff" : c.color }}
              />
            </div>

            {/* text */}
            <div className="min-w-0 relative z-10">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: active ? c.color : "#111827" }}
              >
                {c.label}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                {c.desc}
               
              </p>
               <p className="text-[9px] text-gray-400">{c.inner}</p>
            </div>

            {/* check indicator */}
            {active && (
              <div className="absolute top-1 right-1  flex items-center justify-center"

              >
                <svg
                  className="w-3 h-3 text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}

            {/* bottom accent line */}
            <div
              className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300"
              style={{ background: c.color }}
            />
          </button>
        );
      })}
    </div>
  </div>
);

// ─── CategorySelector ─────────────────────────────────────────────────────────
const CategorySelector = ({ creative, selected, onChange }) => (
  <div
    className="rounded-lg px-0  shrink-0"
    style={{ borderColor: `${creative.color}20` }}
  >
    <p
      className="text-[10px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: creative.color }}
    >
      {creative.label}
    </p>
    <div className="flex flex-wrap gap-2">
      {creative.categories.map((cat) => {
        const active = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:scale-105 cursor-pointer rounded-md border text-xs font-medium transition-all duration-200"
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

// ─── ComingSoon stub ──────────────────────────────────────────────────────────
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


export default StudioPage;

