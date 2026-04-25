"use client";

import { useState, useRef, useEffect } from "react";
import {
  Star, Share2, Recycle, Globe, Check, CheckCircle2,
  ChevronRight, ArrowLeft, Loader2, Sparkles, Upload,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Search, Music2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { saveBrand, makeBrandUrl } from "@/utils/localDb";
import { useRouter } from "next/navigation";
import NotificationModal from "@/app/(components)/NotificationModal";

// ── constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = ["Technology", "Healthcare", "Retail", "Finance", "Education", "Hospitality", "Other"];
const FONTS = ["Inter", "Roboto", "Poppins", "Open Sans", "Lato", "Montserrat"];
const WEBSITE_TYPES = [
  { id: "Business-Website", label: "Business Website" },
  { id: "blog", label: "Blog / News Site" },
  { id: "Restaurant", label: "Restaurant Website" },
  { id: "Non-Profit", label: "Non-Profit Website" },
  { id: "E-commerce", label: "E-commerce Store" },
  { id: "Landing", label: "Landing Page" },
  { id: "Estate", label: "Real Estate Site" },
  { id: "Membership", label: "Membership Site" },
  { id: "Portfolio", label: "Portfolio Website" },
  { id: "Corporate", label: "Corporate Website" },
  { id: "Educational", label: "Educational Platform" },
  { id: "Event", label: "Event Website" },
];
const SOCIAL_PLATFORMS = [
  { id: "facebook", name: "Facebook", type: "Pages", Icon: FaFacebook, color: "#1877F2" },
  { id: "instagram", name: "Instagram", type: "Business", Icon: FaInstagram, color: "#E4405F" },
];
const AD_PLATFORMS = [
  { id: "google", name: "Google Ads", type: "Search & Display", Icon: Search, color: "#EA4335" },
  { id: "facebook", name: "Facebook Ads", type: "Social Ads", Icon: FaFacebook, color: "#1877F2" },
  { id: "linkedin", name: "LinkedIn Ads", type: "Professional Ads", Icon: FaLinkedin, color: "#0A66C2" },
  { id: "twitter", name: "X (Twitter) Ads", type: "Social Ads", Icon: Globe, color: "#000000" },
];

const STEPS = [
  { id: 1, label: "Brand Details", Icon: Star },
  { id: 2, label: "Social Accounts", Icon: Share2 },
  { id: 3, label: "Ad Accounts", Icon: Recycle },
  { id: 4, label: "Website Type", Icon: Globe },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "focus:border-transparent focus:bg-white transition-all";

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5 flex-1">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <div className="flex items-center gap-2">
      <label
        className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer overflow-hidden shadow-sm flex-shrink-0"
        style={{ background: value }}
      >
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
      </label>
      <input
        type="text" value={value} maxLength={7}
        onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
        className={`${inputCls} font-mono text-xs w-28 flex-shrink-0`}
      />
    </div>
  </div>
);

// ── live preview ──────────────────────────────────────────────────────────────
const BrandPreview = ({ data }) => {
  const primary = data.primary || "#2563eb";
  const secondary = data.secondary || "#0ea5e9";
  const name = data.name || "Your Brand";
  const tagline = data.tagline || "";
  const desc = data.description || "Your brand description will appear here once you fill in the details.";
  const font = data.fonts || "Inter";
  const industry = data.industry || "";
  const logo = data.logoDataUrl || null;

  return (
    <div className="sticky top-6 flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Live Preview</p>

      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md">
        <div className="relative h-28 flex items-end p-4"
          style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-3 right-3 flex gap-1.5">
            {[primary, secondary].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm" style={{ background: c }} />
            ))}
          </div>
          <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
            {logo
              ? <img src={logo} alt="logo" className="w-full h-full object-contain" />
              : <span className="text-2xl font-black" style={{ color: primary }}>{name[0]?.toUpperCase()}</span>
            }
          </div>
        </div>

        <div className="bg-white p-4 flex flex-col gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight" style={{ fontFamily: font }}>{name}</h3>
            {tagline && <p className="text-xs text-gray-400 mt-0.5 italic">{tagline}</p>}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{desc}</p>
          <div className="flex flex-wrap gap-1.5">
            {industry && <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50">{industry}</span>}
            {font && <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50" style={{ fontFamily: font }}>{font}</span>}
          </div>
        </div>

        <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Palette</span>
        {[primary, secondary].map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md border border-gray-200 shadow-sm" style={{ background: c }} />
            <span className="text-xs font-mono text-gray-400">{c}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Typography</p>
        <p className="text-sm font-medium text-gray-800" style={{ fontFamily: font }}>Aa Bb Cc — {font}</p>
      </div>
    </div>
  );
};

const generateMockCredentials = () => ({
  token: `tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
  id: `id_${Math.random().toString(36).substr(2, 9)}`,
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function ManualCreate({ refreshBrands, setBrandView, setActiveTab }) {
  const { setActiveBrand } = useBrand();
  const { createManualBrand } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", tagline: "", fonts: "Inter",
    logo: null, logoDataUrl: null,
    primary: "#2563eb", secondary: "#0ea5e9",
    socialAccounts: [], adAccounts: [],
    industry: "", websiteType: "",
  });

  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "info", duration: 3000 });
  const logoRef = useRef();

  const notify = (title, message, type = "info", duration = 3000) =>
    setNotification({ isOpen: true, title, message, type, duration });
  const closeNotify = () => setNotification(p => ({ ...p, isOpen: false }));

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  // cleanup blob URLs
  useEffect(() => {
    return () => { if (formData.logo) URL.revokeObjectURL(formData.logo); };
  }, [formData.logo]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { notify("Logo too large", "Please choose a logo under 500 KB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = ev => setFormData(p => ({ ...p, logo: file, logoDataUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return notify("Brand name required", "Please enter a brand name.", "error");
    if (!formData.industry) return notify("Industry required", "Please select an industry.", "error");

    notify("Creating your brand…", "Please wait.", "info", 0);
    setCreating(true);
    try {
      const brandData = await createManualBrand({
        name: formData.name,
        description: formData.description,
        tagline: formData.tagline,
        fonts: formData.fonts,
        logo: formData.logo,
        colors: { primary: formData.primary, secondary: formData.secondary },
        socialAccounts: formData.socialAccounts,
        adAccounts: formData.adAccounts,
        industry: formData.industry || "Technology",
        websiteType: formData.websiteType,
        createLandingPage: !!formData.websiteType,
      });
      const saved = { id: brandData?.id || Date.now().toString(), ...formData };
      saveBrand(saved);
      setActiveBrand(saved);
      localStorage.setItem("activeBrand", JSON.stringify(saved));
      refreshBrands?.();
      closeNotify();
      notify("Brand created!", "Redirecting…", "success", 2000);
      setTimeout(() => router.push("/brand/reuse"), 1500);
    } catch (err) {
      closeNotify();
      notify("Creation failed", err.message || "Something went wrong.", "error");
    } finally {
      setCreating(false);
    }
  };

  const addSocial = (id, name) => setFormData(p => ({ ...p, socialAccounts: [...p.socialAccounts, { platform: id, name, ...generateMockCredentials() }] }));
  const addAd = (id, name) => setFormData(p => ({ ...p, adAccounts: [...p.adAccounts, { platform: id, name, ...generateMockCredentials() }] }));

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60 py-4">
      <NotificationModal
        isOpen={notification.isOpen} onClose={closeNotify}
        title={notification.title} message={notification.message}
        type={notification.type} duration={notification.duration}
      />

      {/* Page title */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mt-1">Fill in your brand details manually to get started.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Left: steps + form ── */}
        <div className="flex flex-col gap-5">

          {/* Step indicator */}
          <div className="justify-center py-2 ">
            <div className="flex items-center gap-0">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-0 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${step > s.id ? "border-blue-600 bg-blue-600 text-white"
                        : step === s.id ? "border-blue-600 text-blue-600 bg-white"
                          : "border-gray-200 text-gray-300 bg-white"
                      }`}>
                      {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}>{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 rounded-full ${step > s.id ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col gap-5">

            {/* ── Step 1: Brand Details ── */}
            {step === 1 && (
              <>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" /> Brand Details
                </h3>

                <Field label="Brand Name" required>
                  <input type="text" value={formData.name} onChange={e => set("name", e.target.value)}
                    placeholder="e.g. Acme Corp" className={inputCls} />
                </Field>

                <Field label="Tagline / Slogan">
                  <input type="text" value={formData.tagline} onChange={e => set("tagline", e.target.value)}
                    placeholder="e.g. Just do it" className={inputCls} />
                </Field>

                <Field label="Description">
                  <textarea value={formData.description} onChange={e => set("description", e.target.value)}
                    rows={3} placeholder="Brief brand description…" className={`${inputCls} resize-none`} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Industry" required>
                    <select value={formData.industry} onChange={e => set("industry", e.target.value)} className={inputCls}>
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Font">
                    <select value={formData.fonts} onChange={e => set("fonts", e.target.value)} className={inputCls}>
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Logo">
                  <div className="flex items-center gap-3">
                    <button onClick={() => logoRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition cursor-pointer bg-gray-50">
                      <Upload className="w-4 h-4" /> Upload Logo
                    </button>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" ref={logoRef} onChange={handleLogoChange} />
                    {formData.logoDataUrl && (
                      <div className="w-10 h-10 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <img src={formData.logoDataUrl} alt="logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </Field>

                <div className="flex gap-4">
                  <ColorPicker label="Primary Color" value={formData.primary} onChange={v => set("primary", v)} />
                  <ColorPicker label="Secondary Color" value={formData.secondary} onChange={v => set("secondary", v)} />
                </div>
              </>
            )}

            {/* ── Step 2: Social Accounts ── */}
            {step === 2 && (
              <>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" /> Social Accounts
                </h3>
                <p className="text-sm text-gray-500 -mt-2">Connect social media accounts to manage posts for this brand.</p>
                <div className="flex flex-col gap-3">
                  {SOCIAL_PLATFORMS.map(({ id, name, type, Icon, color }) => {
                    const connected = formData.socialAccounts.filter(a => a.platform === id);
                    return (
                      <div key={id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/60">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
                            <Icon style={{ color, fontSize: 18 }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{name}</p>
                            <p className="text-xs text-gray-400">{type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {connected.length > 0
                            ? <span className="text-xs text-green-600 font-medium">{connected.length} connected</span>
                            : <span className="text-xs text-gray-400">Not connected</span>}
                          <button
                            onClick={() => addSocial(id, `${name} Account ${connected.length + 1}`)}
                            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 cursor-pointer transition"
                          >
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
                <p className="text-sm text-gray-500 -mt-2">Connect ad platforms to run campaigns for this brand.</p>
                <div className="flex flex-col gap-3">
                  {AD_PLATFORMS.map(({ id, name, type, Icon, color }) => {
                    const connected = formData.adAccounts.filter(a => a.platform === id);
                    return (
                      <div key={id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/60">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
                            <Icon style={{ color, fontSize: 18 }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{name}</p>
                            <p className="text-xs text-gray-400">{type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {connected.length > 0
                            ? <span className="text-xs text-green-600 font-medium">{connected.length} connected</span>
                            : <span className="text-xs text-gray-400">Not connected</span>}
                          <button
                            onClick={() => addAd(id, `${name} Account ${connected.length + 1}`)}
                            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 cursor-pointer transition"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Step 4: Website Type ── */}
            {step === 4 && (
              <>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" /> Website Type
                  <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                </h3>
                <p className="text-sm text-gray-500 -mt-2">Choose the type of website to build for this brand.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WEBSITE_TYPES.map(({ id, label }) => {
                    const active = formData.websiteType === id;
                    return (
                      <button
                        key={id}
                        onClick={() => set("websiteType", active ? "" : id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition cursor-pointer text-left ${active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                          }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-blue-600 bg-blue-600" : "border-gray-300"
                          }`}>
                          {active && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => step === 1 ? router.back() : setStep(p => p - 1)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Cancel" : "Back"}
              </button>

              {step < 4 ? (
                <button
                  onClick={() => setStep(p => p + 1)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Create Brand</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: preview ── */}
        <BrandPreview data={{ ...formData }} />
      </div>
    </div>
  );
}