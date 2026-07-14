// API client for the Product Studio "Generate" (photoreal) endpoint.
//
// Backend contract (POST /product-studio/generate) — send any of:
//   tool, image, prompt, quality, size, apply_brand_style, workspace_id,
//   model_name, pose
// `tool` is one of: product_staging | product_beautifier | flat_lay |
//   virtual_model | ghost_mannequin
//
// Auth (Bearer token) is attached by the axios interceptor. Uses the app's
// shared axios instance so baseURL + auth are consistent with the rest of the app.

import api from "@/app/api/axios";
import { toast } from "sonner";

/** UI tool ids → backend `tool` enum values. */
export const TOOL_ENUM = {
  virtual_model: "virtual_model",
  staging: "product_staging",
  beautifier: "product_beautifier",
  flatlay: "flat_lay",
  mannequin: "ghost_mannequin",
};

// Get the active brand id from local storage (if any) and include it in the request payload. This is used to apply the brand style to the generated product photo.
// export function getBrandIdFromLocalStorage() {
//   try {
//     const activeBrand = localStorage.getItem("activeBrand");
//     console.log("Retrieved activeBrand from localStorage:", activeBrand);
//   } catch (err) {
//     console.error("Failed to read activeBrandId from localStorage:", err);
//     return null;
//   }
// }

// getBrandIdFromLocalStorage();

/** UI quality tiers → backend quality strings. */
export const QUALITY_ENUM = {
  Standard: "standard",
  High: "high",
  Ultra: "ultra",
};

const BASE_URL = "https://api.creativeklux.com/api/creativeklux-userend";

/**
 * Call the Product Studio generate endpoint.
 *
 * @param {object} payload The request body (already shaped for the backend).
 * @returns {Promise<object>} The response data (e.g. { url, id, credits_used }).
 */
export async function generateProductPhoto(payload) {
  console.log("📡 [product-studio/generate] request →", payload);
  try {
    const { data } = await api.post(
      `${BASE_URL}/product-studio/generate`,
      payload,
    );
    console.log("✅ [product-studio/generate] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ [product-studio/generate] failed:", {
      status,
      data,
      message: err?.message,
    });

    const serverMsg = data?.message || data?.error || err?.message || "";
    if (status === 402 || /limit|credits?/i.test(serverMsg)) {
      toast.error(
        "Monthly AI credits limit reached. Please upgrade your plan to continue.",
        { duration: 6000 },
      );
    } else {
      toast.error(serverMsg || "AI generation failed. Please try again.");
    }
    throw err;
  }
}
