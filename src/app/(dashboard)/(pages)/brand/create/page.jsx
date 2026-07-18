"use client";

/**
 * Unified brand-create flow.
 *
 * A single page drives BOTH modes so there's no duplicated create logic:
 *   • Smart Import — paste a URL, we scrape + prefill the form (starts at step 0,
 *     the URL screen), then walk the shared steps.
 *   • Manual       — fill the form by hand (starts at step 1).
 *
 * Both modes share the same steps (Brand Details → Social → Ad Accounts), the
 * same live preview, and the same submit path: one `createBrand(payload)` call
 * in AuthContext. The only mode difference is the URL-import screen and the
 * source URL fields attached to the payload.
 */

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Share2,
  Recycle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Link,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { STEPS, SOCIAL_PLATFORMS, AD_PLATFORMS } from "./components/constants";
import { pickUploadedUrl } from "./components/helpers";
import { StepIndicator } from "./components/ui";
import BrandPreview from "./components/BrandPreview";
import { BrandDetailsStep, AccountsStep } from "./components/steps";
import { AD_PLATFORM_IDS } from "@/(lib)/integrations/platforms";
import PlatformPageModal from "@/app/(components)/integrations/PlatformPageModal";
import { useIntegrationConnect } from "@/app/(components)/integrations/useIntegrationConnect";

// Empty form — also used to reset state when switching modes.
const INITIAL_FORM = {
  name: "",
  description: "",
  tagline: "",
  fonts: "Inter",
  logo: null, // hosted URL string once uploaded to the gallery
  logoDataUrl: null, // preview (hosted URL, or a local data URL while uploading)
  primary: "#2563eb",
  secondary: "#0ea5e9",
  socialAccounts: [],
  adAccounts: [],
  industry: "",
  sourceUrl: null, // set by Smart Import only
};

export default function CreateBrand() {
  const { sendUrl, createBrand, uploadMedia } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState("import"); // "import" | "manual"
  // Import uses step 0 as the URL-entry screen; manual starts at the first form
  // step (1). Steps 1–3 are identical across both modes.
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const logoRef = useRef();
  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  // Switching mode resets the flow so each mode starts clean (mirrors the old
  // one-component-per-tab behavior). Import opens on the URL screen (step 0),
  // manual on the first form step (step 1).
  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setFormData(INITIAL_FORM);
    setUrl("");
    setUrlError("");
    setStep(next === "import" ? 0 : 1);
  };

  const isValidUrl = (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlBlur = () => {
    setUrlError(
      url.trim() && !isValidUrl(url.trim())
        ? "Please enter a valid URL (e.g. https://yourdomain.com)"
        : "",
    );
  };

  // ── Smart Import: scrape the URL and prefill the form ──
  const handleImport = async () => {
    if (!url.trim()) return;
    if (!isValidUrl(url.trim())) {
      setUrlError("Please enter a valid URL (e.g. https://yourdomain.com)");
      return;
    }
    setUrlError("");
    setImporting(true);
    try {
      console.log("📡 Importing brand from URL…");
      const res = await sendUrl(url);
      if (!res?.ok) {
        toast.error(
          res?.message || "Import failed. Check the URL and try again.",
        );
        return;
      }
      // Tolerate both shapes: double-wrapped ({ data: {...} }) or already-unwrapped.
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
          // The scraped logo is already a hosted URL — use it straight.
          logo: d.logo || null,
          logoDataUrl: d.logo || null,
          sourceUrl: url,
          industry: d.industry || "",
        }));
        console.log("✅ Brand imported — prefilled the form");
        setStep(1);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // ── Logo: upload to the gallery, keep the returned hosted URL ──
  // A local data-URL is shown as an instant preview while the upload is in flight.
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Logo too large. Please choose a logo under 500 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) =>
      setFormData((p) => ({ ...p, logoDataUrl: ev.target.result }));
    reader.readAsDataURL(file);

    setLogoUploading(true);
    try {
      console.log("🖼️ Uploading brand logo to gallery…");
      const res = await uploadMedia(file);
      const uploadedUrl = pickUploadedUrl(res);
      if (!uploadedUrl) {
        console.error("❌ Logo upload returned no URL:", res);
        toast.error("Couldn't get a URL for your logo. Please try again.");
        setFormData((p) => ({ ...p, logo: null, logoDataUrl: null }));
        return;
      }
      console.log("✅ Logo uploaded:", uploadedUrl);
      // Use the hosted URL for both the value we send and the preview.
      setFormData((p) => ({ ...p, logo: uploadedUrl, logoDataUrl: uploadedUrl }));
    } catch (err) {
      console.error("❌ Logo upload failed:", err);
      toast.error(
        err?.message || "Couldn't upload your logo. Please try again.",
      );
      setFormData((p) => ({ ...p, logo: null, logoDataUrl: null }));
    } finally {
      setLogoUploading(false);
    }
  };

  // ── Connect social / ad accounts (REAL OAuth, same engine as Integrations) ──
  // The brand doesn't exist yet, so instead of saving each connection to a
  // brand_id we HOLD the resolved credentials in the form and send them with
  // social_accounts / ad_accounts when the brand is created (see handleCreate).
  const handleResolved = (payload) => {
    if (!payload) return;
    const bucket = AD_PLATFORM_IDS.includes(payload.platform)
      ? "adAccounts"
      : "socialAccounts";

    // X (twitter) and TikTok rotate their refresh token and derive a fresh access
    // token on every use, so — exactly like saveIntegration — the value worth
    // persisting is the REFRESH token. Everyone else stores their access token.
    const isRotating =
      payload.platform === "twitter" || payload.platform === "tiktok";
    const primaryToken = isRotating
      ? payload.refresh_token || payload.access_token || null
      : payload.access_token || null;

    const held = {
      platform: payload.platform,
      name: payload.int_name || payload.int_id || payload.platform,
      // Legacy keys the create-brand endpoint reads off each account — it indexes
      // `id` / `token` directly and 500s ("Undefined array key id") without them.
      id: payload.int_id || null,
      token: primaryToken,
      // Real credential fields, kept so the backend can build a working integration
      // (int_token is the single token column saveIntegration writes).
      int_token: primaryToken,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      int_id: payload.int_id,
      int_name: payload.int_name,
      ...(payload.page_id ? { page_id: payload.page_id } : {}),
    };
    setFormData((p) => ({
      ...p,
      // Replace any existing connection for this platform (one per platform).
      [bucket]: [
        ...p[bucket].filter((a) => a.platform !== payload.platform),
        held,
      ],
    }));
    toast.success(`${held.name} connected`);
  };

  const removeAccount = (bucket) => (platformId) =>
    setFormData((p) => ({
      ...p,
      [bucket]: p[bucket].filter((a) => a.platform !== platformId),
    }));

  // forcePopup keeps the wizard on-screen (no full-page redirect that would
  // discard the in-progress form). brandId is null — we hold, we don't save.
  const { connect, loadingPlatformId, pageModal } = useIntegrationConnect({
    brandId: null,
    forcePopup: true,
    onResolved: handleResolved,
    showToast: (msg, type) =>
      type === "error" ? toast.error(msg) : toast.success(msg),
  });

  // ── Create the brand — ONE path for both modes via the shared createBrand ──
  const handleCreate = async () => {
    if (!formData.name.trim()) return toast.error("Please enter a brand name.");
    if (!formData.industry) return toast.error("Please select an industry.");
    if (logoUploading)
      return toast.info("Please wait for the logo upload to finish.");

    setCreating(true);
    try {
      console.log(`📡 Creating brand (${mode})…`);
      // Build the backend-shaped payload here so createBrand can just POST it.
      const payload = {
        name: formData.name.trim(),
        description: formData.description || "",
        tagline: formData.tagline || "",
        fonts: formData.fonts || "",
        primary_color: formData.primary || "#1e3a8a",
        secondary_color: formData.secondary || "#10b981",
        // Backend reads these as JSON strings (parity with the previous request).
        social_accounts: JSON.stringify(formData.socialAccounts || []),
        ad_accounts: JSON.stringify(formData.adAccounts || []),
        industry: formData.industry || "",
        // Source URL fields only apply to Smart Import; manual leaves them blank.
        url: mode === "import" ? url.trim() : "",
        source_url: mode === "import" ? formData.sourceUrl || url : "",
        landing_page_flag: "0",
      };
      // Logo is a hosted URL string (uploaded to the gallery beforehand); include
      // it only when present so we never overwrite an existing value with blank.
      if (formData.logo && typeof formData.logo === "string") {
        payload.logo = formData.logo;
      }

      const brand = await createBrand(payload);
      if (!brand) throw new Error("No response from the server.");
      console.log("✅ Brand created — redirecting");
      toast.success("Brand created! Redirecting…");
      setTimeout(() => router.push("/brand/reuse"), 1500);
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  // Gate "Continue" on step 1 — both modes need a name + industry before moving on.
  const canContinue =
    step === 1 ? !!(formData.name.trim() && formData.industry) : true;

  // Manual shows the form immediately; Import shows it only after a successful import.
  const showForm = mode === "manual" || step > 0;

  return (
    <div className="flex flex-col">
      <h1 className="font-semibold overflow-hidden pb-2 text-xl">
        Create your brand
      </h1>

      {/* Mode tabs */}
      <div className="flex overflow-hidden py-3 gap-6">
        <div className="flex flex-row gap-4">
          <div className="gap-1 flex flex-row">
            <button
              onClick={() => switchMode("import")}
              className={`font-medium transition cursor-pointer text-sm duration-300 ${
                mode === "import"
                  ? "border-b text-[#155dfc] border-[#155dfc]"
                  : "text-gray-900"
              }`}
            >
              <span className="pr-1">Smart Import</span>
            </button>
            <div>🌐</div>
          </div>
          <div className="gap-1 flex flex-row">
            <button
              onClick={() => switchMode("manual")}
              className={`font-medium cursor-pointer text-sm transition duration-300 ${
                mode === "manual"
                  ? "border-b text-[#155dfc] border-[#155dfc]"
                  : "text-gray-900"
              }`}
            >
              <span className="pr-1">Manual Creation</span>
            </button>
            <div>✏️</div>
          </div>
        </div>
      </div>

      <div className="py-4">
        {/* Sub-heading */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mt-1">
            {mode === "import"
              ? "Paste your website URL — we'll auto-extract your brand identity."
              : "Fill in your brand details manually to get started."}
          </p>
        </div>

        {/* ── Smart Import: URL bar + empty/loading states ── */}
        {mode === "import" && (
          <>
            {urlError && (
              <p className="text-xs text-red-500 pb-2 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                {urlError}
              </p>
            )}

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

            {/* Empty state (before an import) */}
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
          </>
        )}

        {/* ── Shared step form + live preview ── */}
        {showForm && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
            {/* Left: steps + form */}
            <div className="flex flex-col gap-5">
              <StepIndicator steps={STEPS} current={step} />

              <div className="bg-surface border border-gray-100 rounded-xl p-6 flex flex-col gap-5">
                {step === 1 && (
                  <BrandDetailsStep
                    formData={formData}
                    set={set}
                    logoRef={logoRef}
                    logoUploading={logoUploading}
                    onLogoChange={handleLogoChange}
                  />
                )}

                {step === 2 && (
                  <AccountsStep
                    title="Social Accounts"
                    Icon={Share2}
                    description="Connect social media accounts to manage posts for this brand."
                    platforms={SOCIAL_PLATFORMS}
                    accounts={formData.socialAccounts}
                    onConnect={connect}
                    onRemove={removeAccount("socialAccounts")}
                    loadingPlatformId={loadingPlatformId}
                  />
                )}

                {step === 3 && (
                  <AccountsStep
                    title="Ad Accounts"
                    Icon={Recycle}
                    description="Connect ad platforms to run campaigns for this brand."
                    platforms={AD_PLATFORMS}
                    accounts={formData.adAccounts}
                    onConnect={connect}
                    onRemove={removeAccount("adAccounts")}
                    loadingPlatformId={loadingPlatformId}
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (step > 1) {
                        setStep((p) => p - 1);
                      } else if (mode === "import") {
                        // Back from the first form step → the URL screen.
                        setStep(0);
                        setUrl("");
                      } else {
                        // Manual has no earlier screen → leave the create page.
                        router.back();
                      }
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />{" "}
                    {step === 1 ? "Cancel" : "Back"}
                  </button>

                  {step < 3 ? (
                    <button
                      onClick={() => setStep((p) => p + 1)}
                      disabled={!canContinue}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={creating || logoUploading}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
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

            {/* Right: live preview */}
            <BrandPreview data={{ ...formData }} />
          </div>
        )}
      </div>

      {/* Account / page picker (Facebook Pages, ad accounts…) from the connect flow */}
      {pageModal.open && (
        <PlatformPageModal
          pages={pageModal.pages}
          onSelect={pageModal.onSelect}
          onClose={pageModal.onClose}
          loading={pageModal.loadingPageId}
          selectedPageId={null}
        />
      )}
    </div>
  );
}
