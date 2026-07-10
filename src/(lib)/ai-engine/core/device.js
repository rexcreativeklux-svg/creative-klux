// Device capability detection for the AI engine. Runs in both the main thread
// and workers (both expose `navigator`). The goal: WebGPU when it truly works,
// WASM everywhere else, and the small model on genuinely weak machines.

/**
 * Pick the ONNX Runtime execution providers for this device, best first.
 * WebGPU is only offered when an adapter actually initializes — `navigator.gpu`
 * existing alone isn't enough (it's present but broken on some driver-less
 * setups). The caller still try/catches session creation and falls back.
 *
 * @returns {Promise<("webgpu"|"wasm")[]>}
 */
export async function pickExecutionProviders() {
  try {
    if (typeof navigator !== "undefined" && navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        console.log("⚡ AI engine: WebGPU available");
        return ["webgpu", "wasm"];
      }
    }
  } catch {
    // Fall through — WASM always works.
  }
  console.log("🧮 AI engine: using WASM (no WebGPU on this device)");
  return ["wasm"];
}

/**
 * Approximate device RAM in GB. Chromium-only hint (capped at 8 by the spec);
 * returns null where unsupported (Firefox/Safari) so callers treat it as "unknown,
 * assume fine".
 *
 * @returns {number|null}
 */
export function deviceMemoryGB() {
  if (typeof navigator !== "undefined" && typeof navigator.deviceMemory === "number") {
    return navigator.deviceMemory;
  }
  return null;
}

/**
 * Which segmentation model tier this device should default to: the tiny model
 * on ≤2 GB machines (old phones, cheap laptops), the quality one otherwise.
 *
 * @returns {"u2netp"|"silueta"}
 */
export function defaultSegmentationModelKey() {
  const mem = deviceMemoryGB();
  if (mem !== null && mem <= 2) {
    console.log(`📉 AI engine: low-memory device (~${mem} GB) — using the small model`);
    return "u2netp";
  }
  return "silueta";
}
