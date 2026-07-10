"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Link,
  Upload,
  Star,
  Share2,
  Recycle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Search,
  Music2,
  Check,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { makeBrandUrl } from "@/utils/localDb";
import { useRouter } from "next/navigation";
import NotificationModal from "@/app/(components)/NotificationModal";
import Toast from "@/app/(components)/Toast";

// ── constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Retail",
  "Finance",
  "Education",
  "Hospitality",
  "Other",
];
const FONTS = ["Inter", "Roboto", "Poppins", "Open Sans", "Lato", "Montserrat"];
const SOCIAL_PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook",
    type: "Pages",
    Icon: FaFacebook,
    color: "#1877F2",
  },
  {
    id: "instagram",
    name: "Instagram",
    type: "Business",
    Icon: FaInstagram,
    color: "#E4405F",
  },
];
const AD_PLATFORMS = [
  {
    id: "google",
    name: "Google Ads",
    type: "Search & Display",
    Icon: Search,
    color: "#EA4335",
  },
  {
    id: "meta",
    name: "Meta Ads",
    type: "Social Ads",
    Icon: FaFacebook,
    color: "#1877F2",
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    type: "Video Ads",
    Icon: Music2,
    color: "#010101",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    type: "Professional Ads",
    Icon: FaLinkedin,
    color: "#0A66C2",
  },
  {
    id: "bing",
    name: "Bing Ads",
    type: "Search Ads",
    Icon: Globe,
    color: "#00809D",
  },
];

const STEPS = [
  { id: 1, label: "Brand Details", Icon: Star },
  { id: 2, label: "Social Accounts", Icon: Share2 },
  { id: 3, label: "Ad Accounts", Icon: Recycle },
];

// ── tiny helpers ──────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "focus:border-transparent focus:bg-surface transition-all";

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
      {label}
    </label>

    <div className="flex items-center gap-2 w-full">
      {/* color box */}
      <label
        className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer overflow-hidden shadow-sm shrink-0"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0 w-full h-full cursor-pointer"
        />
      </label>

      {/* hex input */}
      <input
        type="text"
        value={value}
        maxLength={7}
        onChange={(e) =>
          /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)
        }
        className={`${inputCls} font-mono text-xs w-full min-w-0`}
      />
    </div>
  </div>
);

// ── live brand preview ────────────────────────────────────────────────────────
const BrandPreview = ({ data }) => {
  const primary = data.primary || "#2563eb";
  const secondary = data.secondary || "#0ea5e9";
  const name = data.name || "Your Brand";
  const tagline = data.tagline || "";
  const desc =
    data.description ||
    "Your brand description will appear here once you fill in the details.";
  const font = data.fonts || "Inter";
  const industry = data.industry || "";
  const logo = data.logoDataUrl || null;

  return (
    <div className="sticky top-6 flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Live Preview
      </p>

      {/* Main card */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md">
        {/* Banner */}
        <div
          className="relative h-28 flex items-end p-4"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute top-3 right-3 flex gap-1.5">
            {[primary, secondary].map((c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm"
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg bg-surface flex items-center justify-center overflow-hidden">
            {logo ? (
              <img
                src={logo}
                alt="logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl font-black" style={{ color: primary }}>
                {name[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-surface p-4 flex flex-col gap-3">
          <div>
            <h3
              className="font-bold text-gray-900 text-base leading-tight"
              style={{ fontFamily: font }}
            >
              {name}
            </h3>
            {tagline && (
              <p className="text-xs text-gray-400 mt-0.5 italic">{tagline}</p>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
            {desc}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {industry && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50">
                {industry}
              </span>
            )}
            {font && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50"
                style={{ fontFamily: font }}
              >
                {font}
              </span>
            )}
          </div>
        </div>

        {/* Color bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${primary}, ${secondary})`,
          }}
        />
      </div>

      {/* Palette */}
      <div className="bg-surface border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Palette
        </span>
        {[primary, secondary].map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md border border-gray-200 shadow-sm"
              style={{ background: c }}
            />
            <span className="text-xs font-mono text-gray-400">{c}</span>
          </div>
        ))}
      </div>

      {/* Typography */}
      <div className="bg-surface border border-gray-100 rounded-xl p-3 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Typography
        </p>
        <p
          className="text-sm font-medium text-gray-800"
          style={{ fontFamily: font }}
        >
          Aa Bb Cc — {font}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function ImportBrand({
  brands = [],
  refreshBrands,
  setBrandView,
  setActiveTab,
}) {
  const { setActiveBrand } = useBrand();
  const { sendUrl, createBrand } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);

  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const showToast = (message) => setToast({ isOpen: true, message });
  const closeToast = () => setToast((p) => ({ ...p, isOpen: false }));

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tagline: "",
    fonts: "Inter",
    logo: null,
    logoDataUrl: null,
    logoFileName: null,
    primary: "#2563eb",
    secondary: "#0ea5e9",
    socialAccounts: [],
    adAccounts: [],
    sourceUrl: null,
    industry: "",
  });

  const [urlError, setUrlError] = useState("");

  const isValidUrl = (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    duration: 3000,
  });
  const logoRef = useRef();

  const notify = (title, message, type = "info", duration = 3000) =>
    setNotification({ isOpen: true, title, message, type, duration });
  const closeNotify = () => setNotification((p) => ({ ...p, isOpen: false }));

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const handleUrlBlur = () => {
    if (url.trim() && !isValidUrl(url.trim())) {
      setUrlError("Please enter a valid URL (e.g. https://yourdomain.com)");
    } else {
      setUrlError("");
    }
  };

  // ── import ──────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!url.trim()) return;
    if (!isValidUrl(url.trim())) {
      setUrlError("Please enter a valid URL (e.g. https://yourdomain.com)");
      return;
    }
    setUrlError("");
    setImporting(true);
    try {
      const res = await sendUrl(url);
      if (!res?.ok) {
        showToast(
          res?.message || "Import failed. Check the URL and try again.",
        );
        return;
      }
      // Tolerate both shapes: double-wrapped ({ data: {...} }) or already-unwrapped brand object.
      const d = res.data?.data || res.data;
      if (d) {
        setFormData((p) => ({
          ...p,
          name: d.name || "",
          description: d.description || "",
          tagline: d.tagline || "",
          fonts: d.font || "Inter",
          primary: d.primary_color || "#2563eb",
          secondary: d.secondary_color || "#0ea5e9",
          logoDataUrl: d.logo || null,
          sourceUrl: url,
          industry: d.industry || "",
        }));
        if (d.logo) {
          fetch(`/api/proxy-image?url=${encodeURIComponent(d.logo)}`)
            .then((r) => r.blob())
            .then((blob) => {
              const file = new File([blob], "logo.png", { type: blob.type });
              setFormData((p) => ({ ...p, logo: file }));
            })
            .catch(() => {});
        }
        setStep(1);
      }
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setFormData((p) => ({
        ...p,
        logo: file,
        logoDataUrl: ev.target.result,
        logoFileName: file.name,
      }));
    reader.readAsDataURL(file);
  };

  // ── create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.name.trim())
      return notify(
        "Brand name required",
        "Please enter a brand name.",
        "error",
      );
    if (!formData.industry)
      return notify("Industry required", "Please select an industry.", "error");

    notify("Creating…", "Please wait.", "info", 0);
    setCreating(true);
    try {
      const brandData = await createBrand({
        name: formData.name.trim(),
        description: formData.description,
        tagline: formData.tagline,
        fonts: formData.fonts,
        logo: formData.logo,
        colors: { primary: formData.primary, secondary: formData.secondary },
        socialAccounts: formData.socialAccounts,
        adAccounts: formData.adAccounts,
        sourceUrl: formData.sourceUrl || url,
        url: url.trim(),
        industry: formData.industry,
        createLandingPage: false,
      });
      if (!brandData) throw new Error("No response");
      setActiveBrand(brandData);
      localStorage.setItem("activeBrand", JSON.stringify(brandData));
      refreshBrands?.();
      closeNotify();
      notify("Brand created!", "Redirecting…", "success", 2000);
      setTimeout(() => router.push("/brand/reuse"), 1500);
    } catch (err) {
      closeNotify();
      notify(
        "Creation failed",
        err.message || "Something went wrong.",
        "error",
      );
    } finally {
      setCreating(false);
    }
  };

  const canContinue =
    step === 1 ? formData.name.trim() && formData.industry : true;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="py-4">
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={closeToast}
        duration={3000}
      />

      {/* Page title */}
      <div className="mb-4">
        {/* <h1 className="text-2xl font-bold text-gray-900">Import Brand</h1> */}
        <p className="text-sm text-gray-500 mt-1">
          Paste your website URL — we'll auto-extract your brand identity.
        </p>
      </div>

      {urlError && (
        <p className="text-xs text-red-500 pb-2 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {urlError}
        </p>
      )}

      {/* URL bar */}
      <div className="bg-surface border border-gray-200 rounded-xl p-4 flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Link className="w-4 h-4 text-blue-600" />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError("");
          }}
          onBlur={handleUrlBlur}
          onKeyDown={(e) => e.key === "Enter" && handleImport()}
          placeholder="https://yourdomain.com"
          className={`flex-1 text-sm outline-none placeholder:text-gray-400 text-gray-800 bg-transparent ${
            urlError ? "text-red-500" : ""
          }`}
        />

        <button
          onClick={handleImport}
          disabled={importing || !url.trim() || !!urlError}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer transition"
        >
          {importing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Upload className="w-4 h-4" /> Import
            </>
          )}
        </button>
      </div>

      {/* Loading overlay */}
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
              className="bg-surface rounded-2xl p-10 flex flex-col items-center gap-5 shadow-2xl"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-blue-600"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">
                  Importing your brand…
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Extracting colors, fonts, and assets
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {step === 0 && !importing && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Globe className="w-7 h-7 text-blue-400" />
          </div>
          <p className="font-semibold text-gray-700">
            Paste a URL above to get started
          </p>
          <p className="text-sm text-gray-400 max-w-xs">
            We'll extract your brand name, colors, logo, and description
            automatically.
          </p>
        </div>
      )}

      {/* Form + preview */}
      {step > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Left: steps + form ── */}
          <div className="flex flex-col gap-5">
            {/* Step indicator */}
            <div className="py-2">
              <div className="flex items-center gap-0">
                {STEPS.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          step > s.id
                            ? "border-blue-600 bg-blue-600 text-white"
                            : step === s.id
                              ? "border-blue-600 text-blue-600 bg-surface"
                              : "border-gray-200 text-gray-300 bg-surface"
                        }`}
                      >
                        {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <span
                        className={`text-xs font-medium hidden sm:block ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-3 rounded-full ${step > s.id ? "bg-blue-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="bg-surface border border-gray-100 rounded-lg p-6 shadow flex flex-col gap-5">
              {/* ── Step 1: Brand Details ── */}
              {step === 1 && (
                <>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" /> Brand Details
                  </h3>

                  <Field label="Brand Name" required>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Tagline / Slogan">
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => set("tagline", e.target.value)}
                      placeholder="e.g. Just do it"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      value={formData.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={3}
                      placeholder="Brief brand description…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Industry" required>
                      <select
                        value={formData.industry}
                        onChange={(e) => set("industry", e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select industry…</option>
                        {INDUSTRIES.map((i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Font">
                      <select
                        value={formData.fonts}
                        onChange={(e) => set("fonts", e.target.value)}
                        className={inputCls}
                      >
                        {FONTS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Logo */}
                  <Field label="Logo">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => logoRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition cursor-pointer bg-gray-50"
                      >
                        <Upload className="w-4 h-4" /> Upload Logo
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={logoRef}
                        onChange={handleLogoChange}
                      />
                      {formData.logoDataUrl && (
                        <div className="w-10 h-10 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <img
                            src={formData.logoDataUrl}
                            alt="logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </Field>

                  {/* Colors */}
                  <div className="flex gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={formData.primary}
                      onChange={(v) => set("primary", v)}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={formData.secondary}
                      onChange={(v) => set("secondary", v)}
                    />
                  </div>
                </>
              )}

              {/* ── Step 2: Social Accounts ── */}
              {step === 2 && (
                <>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" /> Social Accounts
                  </h3>
                  <p className="text-sm text-gray-500 -mt-2">
                    Connect social media accounts to manage posts for this
                    brand.
                  </p>
                  <div className="flex flex-col gap-3">
                    {SOCIAL_PLATFORMS.map(({ id, name, type, Icon, color }) => {
                      const connected = formData.socialAccounts.filter(
                        (a) => a.platform === id,
                      );
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/60"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: color + "18" }}
                            >
                              <Icon style={{ color, fontSize: 18 }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {name}
                              </p>
                              <p className="text-xs text-gray-400">{type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {connected.length > 0 ? (
                              <span className="text-xs text-green-600 font-medium">
                                {connected.length} connected
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Not connected
                              </span>
                            )}
                            <button className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-surface hover:bg-gray-50 cursor-pointer transition">
                              Connect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Step 3: Ad Accounts ── */}
              {step === 3 && (
                <>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-blue-600" /> Ad Accounts
                  </h3>
                  <p className="text-sm text-gray-500 -mt-2">
                    Connect ad platforms to run campaigns for this brand.
                  </p>
                  <div className="flex flex-col gap-3">
                    {AD_PLATFORMS.map(({ id, name, type, Icon, color }) => {
                      const connected = formData.adAccounts.filter(
                        (a) => a.platform === id,
                      );
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/60"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: color + "18" }}
                            >
                              <Icon style={{ color, fontSize: 18 }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {name}
                              </p>
                              <p className="text-xs text-gray-400">{type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {connected.length > 0 ? (
                              <span className="text-xs text-green-600 font-medium">
                                {connected.length} connected
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Not connected
                              </span>
                            )}
                            <button className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-surface hover:bg-gray-50 cursor-pointer transition">
                              Connect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Navigation */}
              <div
                className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-between"}`}
              >
                <button
                  onClick={() =>
                    step === 1
                      ? (setStep(0), setUrl(""))
                      : setStep((p) => p - 1)
                  }
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />{" "}
                  {step === 1 ? "Cancel" : "Back"}
                </button>

                {step < 3 ? (
                  <button
                    onClick={() => setStep((p) => p + 1)}
                    disabled={!canContinue}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Create Brand
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: preview ── */}
          <BrandPreview data={{ ...formData }} />
        </div>
      )}
    </div>
  );
}
