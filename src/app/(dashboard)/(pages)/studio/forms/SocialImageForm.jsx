"use client";
// forms/SocialImageForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Social Creative "Image" tab — every social image, in one form.
//
// It replaces four near-identical forms (PostForm, BannersForm, ThumbnailsForm,
// MemesTrendForm — ~4,600 lines between them) that shared this entire skeleton:
// the same 3-step wizard, the same URL import, the same crop/pick/upload
// pipeline, the same streaming generate. What actually differed between them was
// a size list, a handful of fields, and the labels — so that is all that is
// per-kind now. See KINDS in social/socialSizes.js.
//
// ⚠️ THE KIND IS A TAG, NOT A ROUTE. Which of the four you are making is chosen
// INSIDE this form and changes nothing structural — the wizard, the images and
// the generate call are the same either way. That matters for one thing in
// particular: the backend must still be told it is making a channel cover rather
// than a feed post, and it is, via `kind.subType` → create_sub_type. The
// category the studio page hands down is now "image" for all four and is
// deliberately NOT what gets sent.
//
// ⚠️ THERE IS NO TARGET PLATFORM FIELD, and its absence is the point. The size
// presets are platform-named, so the form used to ask the same question twice
// and let the two answers disagree — "Facebook Feed" tagged Instagram. The
// platform now comes off the selected size (`size.platform`), and sizes that
// name no platform send none rather than guessing.

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe,
  Loader2,
  FileUp,
  X,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Images,
  Scan,
  Type,
} from "lucide-react";
import FullOverlayLoader from "@/app/(components)/loaders/full-overlay-loader";
import { useAuth } from "@/context/AuthContext";
import { CREATIVE_ENGINE } from "@/(lib)/design/creativeEngine";
import {
  MIN_IMAGES,
  MAX_IMAGES,
  meetsImageMinimum,
  imageGateMessage,
} from "@/(lib)/creative/imageGate";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";

import { KINDS, AUDIENCES, kindById, sizeByLabel } from "./social/socialSizes";
import { ToneField, CtaField, StyleField } from "./social/KindFields";

// ── constants ─────────────────────────────────────────────────────────────────
const BRAND_COLORS = ["#2563eb", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444"];

const STEPS = [
  { id: 1, label: "Details", icon: Type },
  { id: 2, label: "Size, Goals & Audience", icon: Scan },
  { id: 3, label: "Background Image", icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const SocialImageForm = ({
  formData,
  setFormData,
  activeBrand,
  sendUrl,
  showToast,
  onResult,
  generateCustomCreative,
  creative,
  fetchDesignTemplates,
}) => {
  const { uploadMedia, activeBrandId } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [brandUrl, setBrandUrl] = useState(
    activeBrand?.url || activeBrand?.source_url || "",
  );
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Which of the four this is. Lives on formData rather than in local state so
  // it survives the studio page remounting the form, and so the payload builder
  // reads it from the same place as everything else.
  const kind = kindById(formData.socialKind);

  // ── image state ──────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrcMeta, setImageSrcMeta] = useState([]);

  const cropperRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    setCompletedCrop(null);
  }, [currentCropIndex]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl)
      setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  // ── field helper ──────────────────────────────────────────────────────────
  // Colour keys are kept bidirectionally in sync so brandColor and primaryColor
  // always reflect the same value regardless of which key a consumer reads.
  const field = (key, value) => {
    if (
      key === "primaryColor" ||
      key === "secondaryColor" ||
      key === "brandColor"
    )
      value = value.startsWith("#") ? value : `#${value}`;

    setFormData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "primaryColor" && { brandColor: value }),
      ...(key === "brandColor" && { primaryColor: value }),
    }));

    setError("");
  };

  // Select a size preset by its unique LABEL. Values repeat — LinkedIn Square
  // and Instagram Square are both 1080x1080 — so tracking only the value would
  // highlight both tiles and resolve the wrong template category.
  const selectSize = (s) => {
    setFormData((prev) => ({ ...prev, size: s.value, sizeLabel: s.label }));
    setError("");
  };

  // The label of the currently selected size, resolved within the current kind.
  const activeSizeLabel =
    kind.sizes.find((s) => s.label === formData.sizeLabel)?.label ||
    kind.sizes.find((s) => s.value === formData.size)?.label ||
    "";

  // The full selected size — where the platform and template category come from.
  const activeSize = sizeByLabel(kind.id, activeSizeLabel);

  /**
   * Switch kind.
   *
   * ⚠️ EVERY KIND-SCOPED CHOICE HAS TO BE RE-RESOLVED HERE, not just the size.
   * The four kinds offer genuinely different campaign goals, file formats and
   * visual styles — a thumbnail chases "Subscriber Growth", a banner offers SVG,
   * neither of which exists on the other. Carrying a stale value across meant
   * the form showed nothing selected while formData still held the old answer,
   * and that answer was what got generated. So anything the new kind doesn't
   * offer falls back to its first option.
   */
  const selectKind = (next) => {
    const size = next.sizes[0];
    setFormData((prev) => ({
      ...prev,
      socialKind: next.id,
      size: size.value,
      sizeLabel: size.label,
      campaignGoal: next.goals.includes(prev.campaignGoal)
        ? prev.campaignGoal
        : next.goals[0],
      fileFormat: next.formats.includes(prev.fileFormat)
        ? prev.fileFormat
        : next.formats[0],
      visualStyle: next.styles?.some((s) => s.value === prev.visualStyle)
        ? prev.visualStyle
        : next.styles?.[0]?.value || prev.visualStyle,
    }));
    setError("");
  };

  // ── URL import ────────────────────────────────────────────────────────────
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const r = await sendUrl(brandUrl);
      if (!r?.ok) throw new Error(r?.message || "Import failed");
      const d = r.data?.data || r.data || {};
      setFormData((p) => ({
        ...p,
        brandName: d.name || "",
        description: d.description || "",
        primaryColor: d.primary_color || "#2563eb",
        brandColor: d.primary_color || "#2563eb",
        secondaryColor: d.secondary_color || "#0ea5e9",
        font: d.font || "Montserrat",
        caption: p.caption || `Discover ${d.name}!`,
        hashtags: p.hashtags?.length ? p.hashtags : ["#SocialMedia", "#Brand"],
        logo: d.logo || "",
        importedImages: d.images?.map((i) => i.url).filter(Boolean) || [],
      }));
      showToast("Brand imported!");
    } catch {
      setError("Failed to import brand. Check the URL.");
    } finally {
      setImportingBrand(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => field("logo", reader.result);
    reader.readAsDataURL(file);
  };

  // ── Apply from MediaPickerModal ───────────────────────────────────────────
  const handleApplyFromPicker = async (images, media) => {
    // Enforce the combined MAX_IMAGES cap across both sources.
    const remaining = Math.max(
      0,
      MAX_IMAGES - croppedImages.filter(Boolean).length,
    );
    const imagesToAdd = images.slice(0, remaining);
    const mediaToAdd = media.slice(
      0,
      Math.max(0, remaining - imagesToAdd.length),
    );
    const skippedSome =
      imagesToAdd.length < images.length || mediaToAdd.length < media.length;

    if (imagesToAdd.length > 0) {
      try {
        const processedFiles = await Promise.all(
          imagesToAdd.map(async (item, idx) => {
            if (item.file instanceof File) {
              item.file.previewUrl = item.src;
              item.file.sourceUrl = null;
              return item.file;
            }
            const url = item.large || item.src;
            const fetchUrl = url.startsWith("http")
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;
            const res = await fetch(fetchUrl);
            const blob = await res.blob();
            const file = new File([blob], `selected-${Date.now()}-${idx}`, {
              type: blob.type || "image/png",
            });
            file.previewUrl = URL.createObjectURL(blob);
            file.sourceUrl = item.large || item.src || null;
            return file;
          }),
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);
        const sourceUrls = processedFiles.map((f) => f.sourceUrl || null);

        if (!showCropper) {
          setImageSrc(previewUrls);
          setImageSrcMeta(sourceUrls);
          setCroppedImages(Array(previewUrls.length).fill(null));
          setCurrentCropIndex(0);
        } else {
          setImageSrc((prev) => [...prev, ...previewUrls]);
          setImageSrcMeta((prev) => [...prev, ...sourceUrls]);
          setCroppedImages((prev) => [
            ...prev,
            ...Array(previewUrls.length).fill(null),
          ]);
          setCurrentCropIndex(imageSrc.length);
        }

        setShowCropper(true);
        showToast(`Added ${imagesToAdd.length} image(s) — crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded.");
      }
    }

    if (mediaToAdd.length > 0) {
      const videoObjects = mediaToAdd.map((src, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: src,
        thumbnail: src,
        type: "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${mediaToAdd.length} media item(s)`);
    }

    if (skippedSome) {
      showToast(`Only added what fits — max ${MAX_IMAGES}.`);
    }

    setMediaPickerOpen(false);
  };

  // ── Brand image strip handlers ────────────────────────────────────────────
  const handleBrandImageUse = (imageObjs) => {
    const remaining = Math.max(
      0,
      MAX_IMAGES - croppedImages.filter(Boolean).length,
    );
    if (remaining <= 0) {
      showToast(`Max ${MAX_IMAGES} items reached.`);
      return;
    }
    const toAdd = imageObjs.slice(0, remaining);
    const pseudos = toAdd.map((imageObj) => ({
      previewUrl: imageObj.src,
      sourceUrl: imageObj.src,
      name: imageObj.alt || "brand-image",
      type: "image/jpeg",
    }));
    setCroppedImages((prev) => [...prev, ...pseudos]);
    if (toAdd.length < imageObjs.length) {
      showToast(`Only ${toAdd.length} added — max ${MAX_IMAGES} reached.`);
    } else {
      showToast(
        `${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`,
      );
    }
  };

  const handleBrandImageCrop = async (imageObjs) => {
    const remaining = Math.max(
      0,
      MAX_IMAGES - croppedImages.filter(Boolean).length,
    );
    if (remaining <= 0) {
      showToast(`Max ${MAX_IMAGES} items reached.`);
      return;
    }
    const toAdd = imageObjs.slice(0, remaining);
    for (const imageObj of toAdd) {
      const originalUrl = imageObj.src;
      let cropperUrl = originalUrl;
      try {
        const res = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`,
        );
        const blob = await res.blob();
        cropperUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Proxy failed, falling back to original URL", err);
      }
      setImageSrc((prev) => [...prev, cropperUrl]);
      setImageSrcMeta((prev) => [...prev, originalUrl]);
      setCroppedImages((prev) => [...prev, null]);
    }
    if (!showCropper) setCurrentCropIndex(0);
    setShowCropper(true);
    if (toAdd.length < imageObjs.length) {
      showToast(`Only ${toAdd.length} queued — max ${MAX_IMAGES} reached.`);
    }
  };

  // ── Save crop ─────────────────────────────────────────────────────────────
  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], `cropped-${currentCropIndex}.png`, {
      type: "image/png",
    });
    file.previewUrl = URL.createObjectURL(blob);
    file.sourceUrl = imageSrcMeta[currentCropIndex] || null;

    setCroppedImages((prev) => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
    }
    // ⚠️ THE SETTERS BELONG IN HERE even though they are stable. The React
    // Compiler infers them as dependencies and refuses to compile the whole
    // component when the hand-written list disagrees ("existing memoization
    // could not be preserved") — so leaving them out costs the file its
    // optimization to save four identifiers. They never change identity, so
    // listing them changes nothing about when this callback is rebuilt.
  }, [
    completedCrop,
    currentCropIndex,
    imageSrc.length,
    imageSrcMeta,
    setCroppedImages,
    setCurrentCropIndex,
    setCrop,
    setCompletedCrop,
    setShowCropper,
  ]);

  // ── Skip crop ─────────────────────────────────────────────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `original-${currentCropIndex}.png`, {
          type: blob.type,
        });
        file.previewUrl = url;
        file.sourceUrl = imageSrcMeta[currentCropIndex] || null;
        setCroppedImages((prev) => {
          const u = [...prev];
          u[currentCropIndex] = file;
          return u;
        });
        if (currentCropIndex < imageSrc.length - 1) {
          setCurrentCropIndex((prev) => prev + 1);
          setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
        } else {
          setShowCropper(false);
        }
      });
  };

  // ── Remove cropped image ──────────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    const next = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0)
      setCurrentCropIndex((prev) => prev - 1);
  };

  // ── Previous crop ─────────────────────────────────────────────────────────
  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !formData.brandName)
      return setError("Brand name is required.");
    // Audience is only required where the kind actually asks for one —
    // thumbnails never had that field.
    if (
      step === 2 &&
      (!formData.size ||
        !formData.campaignGoal ||
        (kind.audience && !formData.audience) ||
        !formData.fileFormat)
    )
      return setError("Please complete all fields before continuing.");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return setError("Select at least one background image.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  // 1) fetch Scraive templates  2) upload File images → real URLs
  // 3) send templates + brand_id  4) stream batches into onResult
  const handleGenerate = async () => {
    if (!formData.size) {
      const msg = `Please select a ${kind.sizeLabel.toLowerCase()}.`;
      setError(msg);
      showToast(msg);
      return;
    }

    const validImages = croppedImages.filter(Boolean);

    // Gate: involk generation needs at least MIN_IMAGES images selected.
    if (!meetsImageMinimum(validImages.length)) {
      const msg = imageGateMessage(validImages.length);
      setError(msg);
      showToast(msg);
      return;
    }

    setGenerating(true);
    setError("");

    try {
      // The Scraive template category for the selected size. Usually the size's
      // own label, but thumbnails carry their own (an Instagram thumbnail wants
      // "Instagram Square" templates) — hence reading it off the catalog rather
      // than deriving it from the label here.
      const templateCategory = activeSize?.category || formData.size;

      // 1. FETCH DESIGN TEMPLATES FIRST (redesign engine only)
      // Involk generates from scratch, so skip the fetch + gate entirely —
      // otherwise an empty template list wrongly blocks it with "No templates".
      let selectedTemplates = [];
      if (CREATIVE_ENGINE === "redesign") {
        const templateRes = await fetchDesignTemplates({
          type: "image",
          category: templateCategory,
          type_size: formData.size,
          design_type: "social",
        });

        if (!templateRes.ok) {
          setGenerating(false);
          const msg = templateRes.message || "Failed to fetch templates.";
          setError(msg);
          showToast(msg);
          return;
        }

        const templates = templateRes.data || [];
        if (!templates.length) {
          setGenerating(false);
          const msg = "No templates found for this size.";
          setError(msg);
          showToast(msg);
          return;
        }
        selectedTemplates = templates;
      }

      // 2. RESOLVE IMAGE URLs — upload File items to /gallery
      const resolvedUrls = await Promise.all(
        validImages.map(async (item) => {
          if (
            typeof item?.sourceUrl === "string" &&
            item.sourceUrl.startsWith("http")
          ) {
            return item.sourceUrl;
          }
          if (item instanceof File) {
            try {
              const result = await uploadMedia(item);
              const url =
                result?.image_url ||
                result?.url ||
                result?.data?.image_url ||
                null;
              return typeof url === "string" && url.startsWith("http")
                ? url
                : null;
            } catch (err) {
              console.error("uploadMedia failed:", err);
              return null;
            }
          }
          if (
            typeof item?.previewUrl === "string" &&
            item.previewUrl.startsWith("http")
          ) {
            return item.previewUrl;
          }
          return null;
        }),
      );

      const imageUrls = resolvedUrls.filter(Boolean);

      // 3. BUILD PAYLOAD
      const payload = {
        creativeType: creative?.id, // "social_creative" → creative_type "social"

        // ⚠️ THE KIND'S SUB-TYPE, NOT THE TAB. The studio page's category is
        // "image" for all four kinds now; sending that would tell the generator
        // nothing and lose the cover/post/thumbnail/meme distinction it uses.
        categoryType: kind.subType,

        brand_id: activeBrandId,

        brandName: formData.brandName || null,
        description: formData.description || null,
        brandColor: formData.brandColor ?? formData.primaryColor ?? null,
        logo: formData.logo || null,
        visualStyle: formData.visualStyle || null,
        font: formData.font || null,
        sourceUrl: brandUrl || null,

        size: formData.size,
        // Which preset that size came from — "Facebook Cover" reads very
        // differently from a bare "820x312". The banners form sent this; it now
        // goes for every kind.
        sizeLabel: activeSizeLabel || null,
        campaignGoal: formData.campaignGoal || null,
        audience: kind.audience ? formData.audience || null : null,
        fileFormat: formData.fileFormat || null,

        caption: formData.caption || null,
        hashtags: formData.hashtags || [],

        // ⚠️ DERIVED FROM THE SIZE — see the file header. An array of one (or of
        // none) rather than a scalar, because that is the shape this field has
        // always had and AdPreview / the publish flow read it as a list.
        platforms: activeSize?.platform ? [activeSize.platform] : [],

        // Only the fields the selected kind actually shows, so a thumbnail
        // request doesn't carry an empty `cta` and a banner doesn't carry a tone
        // nobody chose.
        ...(kind.tone ? { tone: formData.tone || null } : {}),
        ...(kind.cta ? { cta: formData.cta || null } : {}),

        // The thumbnails form sent its platform under this key as well as being
        // the thing that picked the size. Kept — `platforms` above is the new
        // home for it, but quietly dropping a field the generator may key on is
        // not what this merge is for.
        ...(kind.id === "thumbnail"
          ? { thumbnailPlatform: activeSize?.platform || null }
          : {}),

        category: templateCategory?.toLowerCase().replace(/\s+/g, "_"),
        type_size: formData.size,
        images: imageUrls,
        templates: selectedTemplates,
        generatedAt: new Date().toISOString(),
      };

      // 4. STREAM BATCHES
      const expectedCount = selectedTemplates.length;
      let isFirstBatch = true;
      const result = await generateCustomCreative(payload, (batch) => {
        if (!batch.ok) return;
        const variations = batch.variations || [];
        const assets = batch.assets || [];
        if (isFirstBatch) {
          isFirstBatch = false;
          setGenerating(false); // hide overlay so first batch shows
          onResult({
            type: "design",
            variations,
            assets,
            // Involk has no templates — fall back to the returned count.
            expectedCount: expectedCount || variations.length,
            done: false,
            reply: batch.data?.reply || "",
            meta: batch.data?.meta || {},
            payload,
            raw: batch.data,
          });
        } else {
          onResult({ type: "design", variations, assets, append: true });
        }
      });

      if (!result.ok) {
        setGenerating(false);
        onResult({ append: true, done: true });
        showToast(result.message || "Generation failed.");
        setError(result.message || "Generation failed.");
        return;
      }

      // All batches done — clear skeletons
      onResult({ append: true, done: true });
    } catch (err) {
      console.error(err);
      const msg = err.message || "Generation failed. Please try again.";
      setError(msg);
      showToast(msg);
    } finally {
      setGenerating(false);
    }
  };

  // ── Aspect ratio for cropper based on selected size ───────────────────────
  const cropAspectRatio = (() => {
    if (!formData.size) return undefined;
    const [w, h] = formData.size.split("x").map(Number);
    return w && h ? w / h : undefined;
  })();

  // Image gate — Generate stays locked until at least MIN_IMAGES are selected.
  const selectedCount = croppedImages.filter(Boolean).length;
  const canGenerate = meetsImageMinimum(selectedCount);

  // Step 2's heading follows the kind — "& Audience" is a lie on thumbnails.
  const stepTwoTitle = kind.audience
    ? "Size, Goals & Audience"
    : "Size, Goals & Format";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div className="rounded-2xl px-0 py-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const label = s.id === 1 ? `${kind.label} Details` : s.label;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  className={`flex flex-1 items-center gap-2 min-w-0 ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      step > s.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : step === s.id
                          ? "border-emerald-600 text-emerald-600 bg-surface"
                          : "border-gray-200 text-gray-300"
                    }`}
                  >
                    {step > s.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}
                  >
                    {label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? "bg-emerald-600" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div className="bg-surface px-2 rounded-lg py-2 flex flex-col gap-6">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Details ═════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            {/* ── Kind tag ──
                What used to be four tabs. It sits above the section title
                rather than among the fields because it decides what the rest of
                the form IS — the sizes below it, the extra fields, and the
                sub-type the backend is told. */}
            <div className="flex flex-col gap-2">
              <SectionTitle>{kind.label} Details</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {KINDS.map((k) => {
                  const active = k.id === kind.id;
                  return (
                    <button
                      key={k.id}
                      onClick={() => selectKind(k)}
                      aria-pressed={active}
                      className={`px-3 py-1.5 rounded-md border-2 cursor-pointer text-xs font-semibold transition-all hover:scale-105 ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-emerald-600/20 bg-surface text-emerald-700 hover:border-emerald-400"
                      }`}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL import */}
            <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">
                  Import from URL
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  Auto-fills brand info
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImportBrand()}
                  placeholder="https://yourdomain.com/"
                  className={inputCls}
                />
                <button
                  onClick={handleImportBrand}
                  disabled={importingBrand || !brandUrl.trim()}
                  className="px-5 py-1.5 bg-emerald-600 cursor-pointer text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {importingBrand ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Import"
                  )}
                </button>
              </div>
            </div>

            <Field label="Brand Name / Project Name" required>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => field("brandName", e.target.value)}
                placeholder="Your Brand"
                className={inputCls}
              />
            </Field>

            <Field label={kind.descLabel}>
              <textarea
                value={formData.description}
                onChange={(e) => field("description", e.target.value)}
                placeholder={kind.descPlaceholder}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* ── The selected kind's own fields ── */}
            {kind.tone && (
              <ToneField formData={formData} field={field} Field={Field} />
            )}
            {kind.cta && (
              <CtaField
                formData={formData}
                field={field}
                Field={Field}
                inputCls={inputCls}
              />
            )}
            {kind.styles && (
              <StyleField
                formData={formData}
                field={field}
                Field={Field}
                styles={kind.styles}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-44">
                    {BRAND_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => field("primaryColor", hex)}
                        className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                          formData.primaryColor === hex
                            ? "border-gray-800 scale-110"
                            : "border-transparent"
                        }`}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <label
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                      style={{ background: formData.primaryColor || "#2563eb" }}
                    >
                      <input
                        type="color"
                        value={formData.primaryColor || "#2563eb"}
                        onChange={(e) => field("primaryColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.primaryColor || "#2563eb"}
                      onChange={(e) =>
                        /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) &&
                        field("primaryColor", e.target.value)
                      }
                      className={`${inputCls} w-24! flex-none px-2 text-sm font-mono`}
                      maxLength={7}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Logo">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-2 transition"
                  >
                    <FileUp className="w-4 h-4" /> Upload
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                  />
                  {formData.logo && (
                    <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={formData.logo}
                        alt="logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — Size, Goals & Audience ═════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>{stepTwoTitle}</SectionTitle>

            <Field label={kind.sizeLabel}>
              <div className="flex flex-wrap gap-2">
                {kind.sizes.map((s) => {
                  const active = activeSizeLabel === s.label;
                  return (
                    <button
                      key={s.label}
                      onClick={() => selectSize(s)}
                      className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p
                        className={`text-[10px] mt-0.5 ${active ? "text-emerald-500" : "text-gray-400"}`}
                      >
                        {s.value}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {kind.goals.map((g) => (
                  <button
                    key={g}
                    onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
                      formData.campaignGoal === g
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            {kind.audience && (
              <Field label="Audience">
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => field("audience", a.value)}
                      className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                        formData.audience === a.value
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${formData.audience === a.value ? "text-emerald-700" : "text-gray-700"}`}
                      >
                        {a.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {a.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label="File Format">
              <div className="flex gap-2">
                {kind.formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
                      formData.fileFormat === f
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {f}
                    {f === "PNG" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 — Background Image ════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SectionTitle>Select Images</SectionTitle>

            {/* ── Brand images strip ── */}
            <BrandImagesStrip
              onSelect={handleBrandImageUse}
              onCrop={handleBrandImageCrop}
              selectedUrls={croppedImages
                .filter(Boolean)
                .map((f) => f?.sourceUrl || f?.previewUrl)
                .filter(Boolean)}
            />

            {/* ── Already-selected previews ── */}
            {croppedImages.filter(Boolean).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Selected ({croppedImages.filter(Boolean).length})
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {croppedImages.map((item, index) => {
                    if (!item) return null;
                    const url = item?.previewUrl;
                    const isVideo = item?.type?.includes?.("video");
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <video
                            src={url}
                            poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseEnter={(e) =>
                              e.target.play().catch(() => {})
                            }
                            onMouseLeave={(e) => {
                              e.target.pause();
                              e.target.currentTime = 0;
                            }}
                          />
                        ) : url ? (
                          <img
                            src={url}
                            alt={`Selected ${index + 1}`}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-400">
                              No media
                            </span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCroppedImage(index);
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Upload / picker zone ── */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-surface border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Upload or Search More Images
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Search web, magic studio, or upload from device
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaPickerOpen(true);
                }}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center gap-2"
              >
                <Images className="w-4 h-4" /> Choose Media
              </button>
            </div>
          </div>
        )}

        {/* Image-gate hint — only on the image step while below the minimum. */}
        {step === 3 && !canGenerate && (
          <p className="text-xs text-amber-600 text-right -mb-2">
            Select at least {MIN_IMAGES} images (max {MAX_IMAGES}) to generate.
          </p>
        )}

        {/* ── Navigation ── */}
        <div
          className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}
        >
          {step > 1 && (
            <button
              onClick={() => setStep((p) => p - 1)}
              className="px-3 py-2 border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleContinue}
              className="px-3 py-2 bg-emerald-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 hover:scale-105 flex items-center gap-2 transition"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              aria-disabled={!canGenerate}
              title={!canGenerate ? imageGateMessage(selectedCount) : undefined}
              className={`px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-60 ${
                canGenerate
                  ? "cursor-pointer hover:bg-emerald-700 hover:scale-105"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> {kind.generateLabel}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={cropAspectRatio}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => {
          setShowCropper(false);
          setImageSrc([]);
          setImageSrcMeta([]);
          setCroppedImages([]);
        }}
        onPrevious={handlePreviousCrop}
      />

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onCancel={() => setMediaPickerOpen(false)}
        onApply={handleApplyFromPicker}
        postData={formData}
        activeBrand={activeBrand}
        showToast={showToast}
        maxSelectable={Math.max(
          0,
          MAX_IMAGES - croppedImages.filter(Boolean).length,
        )}
      />

      {generating && (
        <FullOverlayLoader
          // "Generate Banners" → "Generating your banners". Taken off the
          // button's own verb rather than the tag label, which pluralises badly
          // ("banner / covers").
          title={`Generating your ${kind.generateLabel.replace(/^Generate /, "").toLowerCase()}`}
          subtitle="Crafting copy, layout & visuals"
        />
      )}
    </>
  );
};

// ── shared micro-components ───────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

const SectionTitle = ({ children }) => (
  <h3 className="font-semibold text-gray-900 text-base">{children}</h3>
);

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default SocialImageForm;
