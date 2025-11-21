"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function EditBrand({ setActiveTab, brandId }) {
  const { fetchBrandById, updateBrandById, token } = useAuth();
  const router = useRouter();

  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftLogoFile, setDraftLogoFile] = useState(null);
  const [draftPrimaryColor, setDraftPrimaryColor] = useState("#1e3a8a");
  const [draftSecondaryColor, setDraftSecondaryColor] = useState("#10b981");
  const [draftTagline, setDraftTagline] = useState("");
  const [draftFont, setDraftFont] = useState("");
  const [previewBrand, setPreviewBrand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBrand = async () => {
      if (!brandId || !token) return;
      setIsLoading(true);

      const brand = await fetchBrandById(brandId);

      if (brand) {
        setDraftName(brand.name || "");
        setDraftDescription(brand.description || "");
        setDraftTagline(brand.tagline || "");
        setDraftFont(brand.font || "");
        setDraftLogoFile(
          brand.logoDataUrl ? { file: null, dataUrl: brand.logoDataUrl } : null
        );
        setDraftPrimaryColor(brand.primary_color || "#1e3a8a");
        setDraftSecondaryColor(brand.secondary_color || "#10b981");
        setPreviewBrand(brand);
      } else {
        alert("Failed to load brand details.");
      }

      setIsLoading(false);
    };

    loadBrand();
  }, [brandId, token]);

  const resetForm = () => {
    if (!brandId || !token) return;
    fetchBrandById(brandId).then((brand) => {
      if (brand) {
        setDraftName(brand.name || "");
        setDraftDescription(brand.description || "");
        setDraftTagline(brand.tagline || "");
        setDraftFont(brand.font || "");
        setDraftLogoFile(
          brand.logoDataUrl ? { file: null, dataUrl: brand.logoDataUrl } : null
        );
        setDraftPrimaryColor(brand.primary_color || "#1e3a8a");
        setDraftSecondaryColor(brand.secondary_color || "#10b981");
        setPreviewBrand(brand);
      }
    });
  };

  const onLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview image instantly
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraftLogoFile({ file, dataUrl: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

const handleFinish = async () => {
  try {
    if (!draftName.trim()) return;

    const response = await updateBrandById(brandId, {
      name: draftName,
      description: draftDescription,
      tagline: draftTagline,
      fonts: draftFont,
      logo: draftLogoFile?.file || null,
      primary_color: draftPrimaryColor,
      secondary_color: draftSecondaryColor,
    });

    alert(" Brand details sent!");
    resetForm();
    router.push("/brand/reuse")
  } catch (err) {
    console.error("Error in handleFinish:", err.message);
    alert("Failed to update brand. Please try again.");
  }
};


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#155dfc] border-t-transparent animate-spin"></div>
        </div> */}
        <p className="">
          Loading brand data...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-14 lg:pb-0 lg:px-10 gap-10">
      <div>
        <h1 className="font-semibold text-xl">Edit page</h1>
      </div>


      <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4">
        <div className="pb-20 overflow-auto">
          <div className="space-y-6 border border-gray-200 p-2 rounded-lg">
            <div className="flex border-b p-2 border-b-gray-200 items-center gap-3">
              <div className="p-2 rounded-full border border-[#155dfc]">
                <Star className="h-5 w-5 text-[#155dfc]" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-medium">Brand Details</h2>
                <p className="text-gray-600 mt-1">Enter your brand details</p>
              </div>
            </div>

            <div className="flex flex-col space-y-5 p-2">
              <input
                type="text"
                placeholder="Brand Name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Tagline / Slogan"
                value={draftTagline}
                onChange={(e) => setDraftTagline(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 p-2 rounded"
              />
              <textarea
                placeholder="Brand Description"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                className="w-full bg-gray-50 border p-2 border-gray-300 rounded"
                rows="3"
              />
              <div className="flex gap-4 items-center">
                <label className="px-2 py-1 border border-gray-300 rounded-md cursor-pointer bg-white inline-block">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onLogoFileChange}
                    className="hidden"
                  />
                </label>
                {draftLogoFile?.dataUrl && (
                  <img
                    src={draftLogoFile.dataUrl}
                    alt="Preview"
                    className="h-9 w-10 object-cover border border-gray-200 rounded-md"
                  />
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex flex-row gap-2 items-center">
                  <label className="font-medium text-gray-600">Primary</label>
                  <input
                    type="color"
                    value={draftPrimaryColor}
                    onChange={(e) => setDraftPrimaryColor(e.target.value)}
                    className="w-8 h-6"
                  />
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <label className="font-medium text-gray-600">Secondary</label>
                  <input
                    type="color"
                    value={draftSecondaryColor}
                    onChange={(e) => setDraftSecondaryColor(e.target.value)}
                    className="w-8 h-6"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-gray-600 font-medium">
                  Fonts & Typography
                </label>
                <select
                  value={draftFont}
                  onChange={(e) => setDraftFont(e.target.value)}
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
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/brand/reuse")}
            className="border border-gray-300 cursor-pointer text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
