// API client for the Magic Studio "Generate" endpoint.
//
// Backend contract (POST /magic-studio/generate) — a single endpoint with a
// `type` discriminator. Each Magic Studio tool sends its own payload shape (see
// buildMagicPayload in magicStudioConfigs.jsx for how the UI values are mapped):
//
//   text_to_image       → { type, style, ratio, prompt }
//   text_to_video       → { type, style, ratio, duration, prompt }
//   image_variation     → { type, style, source_image }
//   script_to_voiceover → { type, style, narration_tone, speaking_pace, ratio, export_format, prompt }
//   audio_to_text       → { type, audio_file, language, transcript_format, transcript_quality }
//   text_to_audio       → { type, style, speaking_tone, speaking_speed, export_format, audio_quality, prompt }
//   persona_generator   → { type, name, age, occupation, communication_tone, content_type, ratio }
//
// Auth (Bearer token) is attached by the axios interceptor. Uses the app's
// shared axios instance so baseURL + auth are consistent with the rest of the app.
// Mirrors src/(lib)/product-studio-api.js.

import api from "@/app/api/axios";
import { toast } from "sonner";

const BASE_URL = "https://api.creativeklux.com/api/creativeklux-userend";

/**
 * Call the Magic Studio generate endpoint.
 *
 * @param {object|FormData} payload Request body already shaped for the backend.
 *   Pass a FormData for tools that upload a file (audio_to_text).
 * @returns {Promise<object>} The response data from the backend.
 */
export async function generateMagicStudio(payload) {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  console.log(
    "📡 [magic-studio/generate] request →",
    isForm ? "[FormData]" : payload,
  );
  try {
    const { data } = await api.post(
      `${BASE_URL}/magic-studio/generate`,
      payload,
      {
        // Let the browser set the multipart boundary for FormData uploads.
        headers: isForm ? { "Content-Type": "multipart/form-data" } : undefined,
      },
    );
    console.log("✅ [magic-studio/generate] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ [magic-studio/generate] failed:", {
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

/**
 * Poll a Magic Studio video job's status. The job id comes from the initial
 * generate response — no request body is needed, the id is in the URL.
 *
 * @param {string|number} id The generation/job id returned by generateMagicStudio.
 * @returns {Promise<object>} The status payload (e.g. { status, video_url? }).
 */
export async function checkVideoGenerationStatus(id) {
  console.log("📡 [magic-studio/status] checking video job:", id);

  try {
    const { data } = await api.post(`${BASE_URL}/magic-studio/${id}/status`);
    console.log("✅ [magic-studio/status] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ [magic-studio/status] failed:", {
      status,
      data,
      message: err?.message,
    });

    const serverMsg = data?.message || data?.error || err?.message || "";
    toast.error(serverMsg || "Couldn't check video status. Please try again.");
    throw err;
  }
}
