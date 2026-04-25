"use client";

import { useState, useRef, useEffect } from "react";
import {
  Star, Loader2, ArrowLeft, Upload, Check, Sparkles,
  Building2, Type, Palette
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NotificationModal from "@/app/(components)/NotificationModal";

// ── constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = ["Technology", "Healthcare", "Retail", "Finance", "Education", "Hospitality", "Other"];
const FONTS = ["Inter", "Roboto", "Poppins", "Open Sans", "Lato", "Montserrat"];

// ── helpers ───────────────────────────────────────────────────────────────────
const cleanColor = (c) => {
  if (!c) return "";
  return c.replace(/`/g, "").trim();
};

const getLogoSrc = (logo) => {
  if (!logo || typeof logo !== "string" || !logo.trim()) return null;
  if (logo.startsWith("http")) return logo;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = logo.startsWith("/") ? logo : "/" + logo;
  return cleanBase + cleanPath;
};

const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 " +
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

const ColorPicker = ({ label, value, onChange }) => {
  const safe = value || "#000000";
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <label
          className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer overflow-hidden shadow-sm flex-shrink-0"
          style={{ background: safe }}
        >
          <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
        </label>
        <input
          type="text" value={safe} maxLength={7}
          onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className={`${inputCls} font-mono text-xs w-28 flex-shrink-0`}
        />
      </div>
    </div>
  );
};

// ── live preview ──────────────────────────────────────────────────────────────
const BrandPreview = ({ data }) => {
  const primary   = data.primary   || "#2563eb";
  const secondary = data.secondary || "#0ea5e9";
  const name      = data.name      || "Your Brand";
  const tagline   = data.tagline   || "";
  const desc      = data.description || "Your brand description will appear here.";
  const font      = data.font      || "Inter";
  const industry  = data.industry  || "";
  const logo      = data.logoDataUrl || null;

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
            {font     && <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-gray-50" style={{ fontFamily: font }}>{font}</span>}
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

// ═══════════════════════════════════════════════════════════════════════════════
export default function EditBrand({ setActiveTab, brandId }) {
  const { fetchBrandById, updateBrandById, token } = useAuth();
  const router = useRouter();
  const logoRef = useRef();

  const [isLoading, setSsLoading] = useState(true);
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", tagline: "",
    font: "", industry: "",
    primary: "#1e3a8a", secondary: "#10b981",
    logoFile: null, logoDataUrl: null,
  });

  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "info", duration: 3000 });

  const notify     = (title, message, type = "info", duration = 3000) => setNotification({ isOpen: true, title, message, type, duration });
  const closeNotify = () => setNotification((p) => ({ ...p, isOpen: false }));
  const set         = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // ── load ──
  useEffect(() => {
    const load = async () => {
      if (!brandId || !token) return;
      setSsLoading(true);
      try {
        const brand = await fetchBrandById(brandId);
        if (brand) {
          const logoUrl = getLogoSrc(brand.logo);
          setForm({
            name:        brand.name        || "",
            description: brand.description || "",
            tagline:     brand.tagline     || "",
            font:        brand.fonts || brand.font || "Inter",
            industry:    brand.industry    || "",
            primary:     cleanColor(brand.primary_color)   || "#1e3a8a",
            secondary:   cleanColor(brand.secondary_color) || "#10b981",
            logoFile:    null,
            logoDataUrl: logoUrl || null,
          });
        } else {
          notify("Error", "Failed to load brand details.", "error");
        }
      } catch {
        notify("Error", "Failed to load brand.", "error");
      } finally {
        setSsLoading(false);
      }
    };
    load();
  }, [brandId, token]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { notify("Logo too large", "Please choose a logo under 500 KB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, logoFile: file, logoDataUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return notify("Missing Name", "Please enter a brand name.", "error");

    notify("Saving…", "Updating your brand, please wait.", "info", 0);
    setSaving(true);
    try {
      const result = await updateBrandById(brandId, {
        name:            form.name.trim(),
        description:     form.description,
        tagline:         form.tagline,
        fonts:           form.font,
        industry:        form.industry,
        logo:            form.logoFile || null,
        primary_color:   form.primary,
        secondary_color: form.secondary,
      });

      if (result) {
        closeNotify();
        notify("Saved!", "Brand updated successfully.", "success", 2500);
        setTimeout(() => router.push("/brand/reuse"), 800);
      } else {
        closeNotify();
        notify("Failed", "Could not update brand.", "error");
      }
    } catch (err) {
      closeNotify();
      notify("Error", "Something went wrong. Try again.", "error");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── loading state ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Loading brand…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-8 md:px-10">
      <NotificationModal
        isOpen={notification.isOpen} onClose={closeNotify}
        title={notification.title}  message={notification.message}
        type={notification.type}    duration={notification.duration}
      />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Brand</h1>
        <p className="text-sm text-gray-500 mt-1">Update your brand details below.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Left: form card ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-6">

          {/* Section header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Brand Details</h2>
              <p className="text-xs text-gray-400">Update your brand identity</p>
            </div>
          </div>

          {/* Fields */}
          <Field label="Brand Name" required>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Acme Corp" className={inputCls} />
          </Field>

          <Field label="Tagline / Slogan">
            <input type="text" value={form.tagline} onChange={(e) => set("tagline", e.target.value)}
              placeholder="e.g. Just do it" className={inputCls} />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} placeholder="Brief brand description…" className={`${inputCls} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Industry" required>
              <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Font">
              <select value={form.font} onChange={(e) => set("font", e.target.value)} className={inputCls}>
                <option value="">Select font…</option>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Logo">
            <div className="flex items-center gap-3">
              <button onClick={() => logoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition cursor-pointer bg-gray-50">
                <Upload className="w-4 h-4" />
                {form.logoDataUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                className="hidden" ref={logoRef} onChange={handleLogoChange} />
              {form.logoDataUrl && (
                <div className="relative w-12 h-12 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <img src={form.logoDataUrl} alt="logo preview" className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = "none"; }} />
                </div>
              )}
            </div>
          </Field>

          <div className="flex gap-4">
            <ColorPicker label="Primary Color"   value={form.primary}   onChange={(v) => set("primary",   v)} />
            <ColorPicker label="Secondary Color" value={form.secondary} onChange={(v) => set("secondary", v)} />
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => router.push("/brand/reuse")}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Sparkles className="w-4 h-4" /> Save Changes</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: preview ── */}
        <BrandPreview data={form} />
      </div>
    </div>
  );
}