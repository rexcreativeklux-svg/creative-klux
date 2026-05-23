// src/utils/errorHelper.js
//
// One place to turn any fetch outcome into a standardized result.
// Used by AuthContext so callers (forms/pages) get a consistent shape.
//
// Result shape:
// {
//   ok: boolean,
//   source: 'success' | 'network' | 'validation' | 'backend' | 'infra' | 'unknown',
//   message: string,            // safe to show to the user
//   messageForDevs?: string,    // raw backend message (for console only)
//   errors?: object,            // Laravel-style validation errors keyed by field
//   data?: any,                 // backend response data on success
//   raw?: string,               // raw body when JSON parse failed
//   status?: number,            // HTTP status if a response came back
// }

const GENERIC_USER_MESSAGES = {
  network: "Connection problem. Please try again.",
  validation: "Please check the form fields.",
  backend: "Something went wrong on our end. Please try again.",
  infra: "Service temporarily unavailable. Please try again shortly.",
  auth: "You need to sign in again.",
  unknown: "An unexpected error occurred.",
};

/**
 * Classify a fetch outcome and return a standardized result.
 *
 * Inputs (pick the form that matches your call site):
 *   { response, rawText? }  — fetch resolved; pass the Response (and optionally pre-read text)
 *   { error }               — fetch threw (network/CORS/timeout)
 */
export async function classifyResult({ response, error, rawText } = {}) {
  // 1) fetch threw — pre-response failure (network / CORS / DNS / mixed-content)
  if (error) {
    return {
      ok: false,
      source: "network",
      message: GENERIC_USER_MESSAGES.network,
      messageForDevs: error?.message || "Network error",
    };
  }

  if (!response) {
    return {
      ok: false,
      source: "unknown",
      message: GENERIC_USER_MESSAGES.unknown,
      messageForDevs: "No response or error supplied to classifyResult",
    };
  }

  // 2) We have a response — read body if caller didn't already
  let text = rawText;
  if (text === undefined) {
    try {
      text = await response.text();
    } catch {
      text = "";
    }
  }

  const status = response.status;

  // 3) Try to parse JSON
  let data = null;
  let parsed = false;
  try {
    data = text ? JSON.parse(text) : null;
    parsed = true;
  } catch {
    parsed = false;
  }

  // 4) Non-JSON response (likely HTML proxy error page or plain text)
  if (!parsed) {
    if (response.ok) {
      // 2xx with text body — treat as success (e.g., upload routes that return URL strings)
      return {
        ok: true,
        source: "success",
        message: "OK",
        data: text,
        status,
      };
    }
    // Cloudflare/proxy/gateway ranges
    if ((status >= 502 && status <= 504) || (status >= 520 && status <= 530)) {
      return {
        ok: false,
        source: "infra",
        message: GENERIC_USER_MESSAGES.infra,
        messageForDevs: `HTTP ${status} non-JSON response from gateway`,
        raw: text,
        status,
      };
    }
    return {
      ok: false,
      source: "unknown",
      message: GENERIC_USER_MESSAGES.unknown,
      messageForDevs: `HTTP ${status} non-JSON response`,
      raw: text,
      status,
    };
  }

  // 5) JSON success
  if (response.ok) {
    return {
      ok: true,
      source: "success",
      message: data?.message || "OK",
      data: data?.data ?? data,
      raw: data,
      status,
    };
  }

  // 6) JSON error responses — classify by Laravel conventions + status code

  // 401 — auth lapse
  if (status === 401) {
    return {
      ok: false,
      source: "network",
      message: GENERIC_USER_MESSAGES.auth,
      messageForDevs: data?.message || "Unauthorized",
      status,
    };
  }

  // 422 OR a JSON body with an `errors` object — Laravel validation
  if (status === 422 || (data && typeof data.errors === "object" && data.errors !== null)) {
    const firstField = data?.errors ? Object.keys(data.errors)[0] : null;
    const firstMsg = firstField ? data.errors[firstField]?.[0] : null;
    return {
      ok: false,
      source: "validation",
      message: firstMsg || data?.message || GENERIC_USER_MESSAGES.validation,
      messageForDevs: data?.message || "Validation failed",
      errors: data?.errors || {},
      status,
    };
  }

  // 5xx — server / backend exception
  if (status >= 500) {
    return {
      ok: false,
      source: "backend",
      message: GENERIC_USER_MESSAGES.backend,
      messageForDevs: data?.message || data?.error || `HTTP ${status}`,
      status,
    };
  }

  // 4xx — generic client error from backend (e.g., 403, 404, 400 not validation)
  return {
    ok: false,
    source: "backend",
    message: data?.message || "Request failed.",
    messageForDevs: data?.message || data?.error || `HTTP ${status}`,
    status,
  };
}
