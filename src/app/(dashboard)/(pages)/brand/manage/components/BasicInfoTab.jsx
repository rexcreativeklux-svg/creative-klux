/**
 * BasicInfoTab.jsx
 * Brand name + description editor and the "Leave brand" action.
 * Saves via AuthContext.updateBrandById (preserving the brand's other fields)
 * and leaves via useManageApi.leaveBrand.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useManageApi } from "../lib/useManageApi";

const inputCls =
  "w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-lg text-sm text-gray-800 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

export default function BasicInfoTab({ brand }) {
  const { updateBrandById, setActiveBrand } = useAuth();
  const { leaveBrand } = useManageApi();
  const router = useRouter();

  const [name, setName] = useState(brand?.name || "");
  const [description, setDescription] = useState(brand?.description || "");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const dirty =
    name !== (brand?.name || "") || description !== (brand?.description || "");

  const handleSave = async () => {
    if (!brand?.id) return toast.error("No active brand selected.");
    if (!name.trim()) return toast.error("Brand name can't be empty.");

    setSaving(true);
    console.log("💾 Saving brand basic info:", { name, description });
    // Preserve the brand's other fields so a name/description edit never blanks them.
    // logo omitted (null) → the brand's existing logo URL is preserved.
    const res = await updateBrandById(brand.id, {
      name: name.trim(),
      description,
      tagline: brand.tagline || "",
      fonts: brand.fonts || brand.font || "",
      primary_color: brand.primary_color || "#1e3a8a",
      secondary_color: brand.secondary_color || "#10b981",
      logo: null,
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Brand updated.");
    } else {
      toast.error(res.message || "Couldn't update the brand. Please try again.");
    }
  };

  const handleLeave = async () => {
    if (!brand?.id) return;
    setLeaving(true);
    console.log("🚪 Leaving brand:", brand.id);
    const res = await leaveBrand(brand.id);
    setLeaving(false);
    setConfirmLeave(false);

    if (res.ok) {
      toast.success("You've left this brand.");
      setActiveBrand(null);
      router.push("/brand/reuse");
    } else {
      toast.error(res.message || "Couldn't leave the brand.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Name + description ── */}
      <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Brand name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Brand"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Brand description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What is this brand about?"
              className={`${inputCls} resize-y`}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ── Leave brand ── */}
      <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Leave brand
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              If you leave this brand, you will lose access to all associated
              apps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLeave(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Leave Brand
          </button>
        </div>
      </div>

      {/* ── Confirm leave modal ── */}
      {confirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Leave this brand?
              </h3>
              <button
                onClick={() => setConfirmLeave(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              You&rsquo;ll immediately lose access to{" "}
              <span className="font-semibold text-gray-700">
                {brand?.name || "this brand"}
              </span>{" "}
              and everything in it. This can&rsquo;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmLeave(false)}
                disabled={leaving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {leaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
