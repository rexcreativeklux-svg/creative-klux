"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { classifyResult } from "@/utils/errorHelper";
import { throwClassifiedAuthError } from "@/utils/authErrors";
import { clearImpersonating } from "@/utils/impersonation";
import api from "@/app/api/axios";
import { CREATIVE_ENGINE } from "@/(lib)/design/creativeEngine";
import { renderDesignToDataUrl } from "@/(lib)/design/renderDesign";

const AuthContext = createContext();

// Default page size for the paginated gallery. Kept here so every gallery
// surface (page, picker, editor uploads) requests the same amount per page.
const GALLERY_PER_PAGE = 10;

// Normalize a raw `GET /gallery` file record into the shape every gallery
// surface consumes ({ id, type, src, alt, filename }). Single source of truth
// so the paginated fetch and the legacy full fetch can't drift apart.
const normalizeGalleryItem = (m) => ({
  id: m.id,
  type: m.type,
  src: m.image_url, // ← the hosted URL field the backend returns
  alt: m.image_name,
  filename: m.image_name,
});

// Pull the items array + pagination meta out of a `GET /gallery` response,
// whatever shape it arrives in. The paginated backend nests a raw Laravel
// paginator under `files` ({ data: [...], current_page, last_page, per_page,
// total, next_page_url }); older/non-paginated responses put a plain array
// under `files`. Handling both keeps every caller robust to the shape.
const extractGalleryPayload = (data) => {
  const payload = data?.files;

  // Paginator object: items under `.data`, page info alongside.
  if (payload && !Array.isArray(payload) && Array.isArray(payload.data)) {
    return {
      raw: payload.data,
      meta: {
        current_page: payload.current_page ?? 1,
        last_page: payload.last_page ?? 1,
        per_page: payload.per_page ?? null,
        total: payload.total ?? payload.data.length,
      },
    };
  }

  // Legacy flat array (either under `files` or `data`).
  const flat = Array.isArray(payload)
    ? payload
    : Array.isArray(data?.data)
      ? data.data
      : [];
  return { raw: flat, meta: null };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState([]);
  // const [brandId, setBrandId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [activeBrand, setActiveBrandState] = useState(null);
  // Id of the brand whose switch request is currently in flight — drives the
  // loading state in the brand switcher while POST /brands/{id}/switch resolves.
  const [switchingBrandId, setSwitchingBrandId] = useState(null);

  // Gallery
  const [myGallery, setMyGallery] = useState([]);
  const [myGalleryLoading, setMyGalleryLoading] = useState(false);

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [myImages, setMyImages] = useState([]);
  const [myImagesLoading, setMyImagesLoading] = useState(false);

  const [tutorialVideos, setTutorialVideos] = useState([]);
  const [tutorialVideosLoading, setTutorialVideosLoading] = useState(false);
  const [tutorialVideosError, setTutorialVideosError] = useState(null);
  const activeBrandId = activeBrand?.id || null;
  const [brandsInitialized, setBrandsInitialized] = useState(false);

  // console.log(user, brands)

  const authFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(token)

      if (res.status === 401) {
        console.warn("401 detected globally → logging out");

        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        throw new Error("Unauthorized");
      }

      return res;
    },
    [token],
  );

  const BASE_URL = "https://api.creativeklux.com/api/creativeklux-userend";

  // Static endpoints (no id needed)
  const API_LOGIN_URL = `${BASE_URL}/login`;
  const API_REGISTER_URL = `${BASE_URL}/register`;
  const API_PROFILE_URL = `${BASE_URL}/profile`;
  const API_LOGOUT_URL = `${BASE_URL}/logout`;
  const API_CREATE_TEAM_URL = `${BASE_URL}/teams`;
  const API_FETCH_TEAM_URL = `${BASE_URL}/teams`;
  const API_FETCH_RESELLS_URL = `${BASE_URL}/resells`;
  const API_CREATE_RESELL_URL = `${BASE_URL}/resells`;
  const API_SEND_URL = `${BASE_URL}/brands/import`;
  const API_CREATE_BRAND_URL = `${BASE_URL}/brands`;
  const API_FETCH_BRAND_URL = `${BASE_URL}/brands`;
  const API_CONNECT_SOCIAL_ACCOUNT_URL = `${BASE_URL}/social-accounts/connect`;
  const API_FETCH_SOCIAL_ACCOUNTS_URL = `${BASE_URL}/social-accounts`;
  const API_FETCH_AD_ACCOUNTS_URL = `${BASE_URL}/ad-accounts`;
  const API_CONNECT_AD_ACCOUNTS_URL = `${BASE_URL}/ad-accounts/connect`;
  const API_DELETE_SOCIAL_ACCOUNT_URL = `${BASE_URL}/social-accounts/disconnect`;
  const API_GALLERY_URL = `${BASE_URL}/gallery`;
  const API_FETCH_TUTORIAL_VIDEOS = `${BASE_URL}/tutorial-videos`;
  const API_AI_CHAT_URL = `${BASE_URL}/creatives/ai-creative`;
  const API_AI_REDESIGN_URL = `${BASE_URL}/creatives/ai-redesign`;
  // Read side of the chat persistence `creativeAiChat` writes with save_chat.
  // Singular "session" for the detail route, plural for the list — that's the
  // backend's own spelling, not a typo.
  const API_CHAT_SESSIONS_URL = `${BASE_URL}/creative/sessions`;
  const API_CHAT_SESSION_URL = `${BASE_URL}/creative/session`;
  const SAVE_DESIGN_URL = `${BASE_URL}/creative-designs`;
  const FETCH_DESIGN_URL = `${BASE_URL}/creative-designs`;
  const API_INTEGRATIONS_URL = `${BASE_URL}/integrations`;

  // Load token on mount and fetch profile and brands
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } else {
      setLoading(false);
      setBrandsLoading(false);
    }
  }, []);

  const saveAuth = (token) => {
    console.log("Saving token:", token);
    if (!token) {
      console.error("saveAuth called without a token!");
      return;
    }
    localStorage.setItem("token", token);
    setToken(token);
    // A real sign-in replaces whatever session was here, so any impersonation flag
    // left behind by /impersonate must go with it — otherwise the next user on this
    // browser would inherit the relaxed verification gate.
    clearImpersonating();
    // fetchProfile(token);
    // fetchBrands(token);
  };

  const fetchProfile = async (authToken) => {
    try {
      const res = await authFetch(API_PROFILE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      // 🚨 Handle 401 ONLY
      if (res.status === 401) {
        console.warn("Token invalid → logging out");

        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        return;
      }

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid profile response");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (err) {
      console.error("Profile fetch failed:", err.message);

      // ❌ DO NOT LOG OUT HERE
      // Just keep existing session
    } finally {
      setLoading(false);
    }
  };

  // Update the current user's profile via the shared POST /profile endpoint
  // (there is no dedicated per-field endpoint). Accepts any subset of profile
  // fields — e.g. { name }, { profile_pic }, { active_brand_id } — refreshes
  // the cached user on success, and returns a normalized { ok, data?, message? }
  // so callers can toast reliably.
  const updateProfile = async (payload = {}) => {
    if (!token)
      return {
        ok: false,
        message: "You must be logged in to update your profile.",
      };

    try {
      const res = await authFetch(API_PROFILE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("❌ updateProfile: non-JSON response:", text);
        return { ok: false, message: "Unexpected server response." };
      }

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        const message =
          firstError ||
          data?.message ||
          `Failed to update profile (${res.status})`;
        console.error("❌ updateProfile failed:", message);
        return { ok: false, message };
      }

      console.log("✅ Profile updated");
      // Refresh the cached user so the UI reflects the change everywhere.
      const fresh = await fetchProfile(token);
      return {
        ok: true,
        data: fresh || data,
        message: data?.message || "Profile updated.",
      };
    } catch (err) {
      if (err.message === "Unauthorized")
        return {
          ok: false,
          message: "Your session expired. Please log in again.",
        };
      console.error("❌ updateProfile error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  const login = async (email, password) => {
    console.log("📡 login → requesting session");

    // Route every outcome through classifyResult so a CORS/network failure is
    // categorized as a transport error (no HTTP status) rather than being
    // mistaken for wrong credentials. A thrown fetch is caught and classified
    // the same way.
    let result;
    try {
      const res = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      result = await classifyResult({ response: res });
    } catch (error) {
      result = await classifyResult({ error });
    }

    if (!result.ok) {
      // Logs the real cause + throws a user-safe, correctly-categorized Error.
      throwClassifiedAuthError("login", result, "Invalid email or password.");
    }

    const data = result.raw ?? result.data ?? {};
    if (!data.token) {
      console.error("❌ login — 2xx response but no session token:", data);
      const err = new Error(
        "Signed in, but no session token was returned. Please try again.",
      );
      err.source = "backend";
      err.status = result.status;
      throw err;
    }

    console.log("✅ login success");
    saveAuth(data.token);
    return data.message || "Login successful";
  };

  const register = async (name, email, password, licenseCode = "") => {
    const payload = {
      name,
      email,
      password,
      license_code: licenseCode || null, // Send null if empty, or the actual code
    };

    console.log("📡 register → sending:", { ...payload, password: "•••" });

    let result;
    try {
      const res = await fetch(API_REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = await classifyResult({ response: res });
    } catch (error) {
      result = await classifyResult({ error });
    }

    if (!result.ok) {
      // Validation errors (e.g. "The email has already been taken.") are joined
      // and surfaced by the shared helper; transport/server faults are masked.
      throwClassifiedAuthError(
        "register",
        result,
        "Registration failed. Please try again.",
      );
    }

    const data = result.raw ?? result.data ?? {};

    // FIXED: Correctly extract user ID from nested response
    const userId = data.user?.id || data.user?.user_id || data.id;
    if (userId) {
      sessionStorage.setItem("pendingUserId", userId.toString()); // Save as string
      console.log("Saved pendingUserId:", userId);
    } else {
      console.warn("No user ID found in registration response");
    }

    // Frontend-only: Store registration data in memory (not persistent)
    // This gets cleared on page refresh, which is fine
    sessionStorage.setItem("pendingEmail", email);
    sessionStorage.setItem("pendingName", name);
    if (licenseCode) {
      sessionStorage.setItem("pendingLicenseCode", licenseCode);
    }
    // Don't store password in storage - it's not needed

    return {
      success: true,
      message: data.message || "Check your email for the verification code!",
      email: email,
    };
  };

  const verifyEmail = async (code) => {
    if (!code || code.length !== 6) {
      throw new Error("Please enter a valid 6-digit code");
    }

    // Prefer the just-registered session values; fall back to the logged-in
    // user so an already-signed-in-but-unverified user can verify on refresh.
    const userId = sessionStorage.getItem("pendingUserId") || user?.id;
    // const email = sessionStorage.getItem("pendingEmail") || user?.email;

    if (!userId) {
      throw new Error("Session expired. Please register again.");
    }

    const payload = {
      user_id: userId, // This is what the backend requires
      code: code,
    };

    console.log("📡 verifyEmail → sending:", payload);

    let result;
    try {
      const res = await fetch(`${BASE_URL}/password/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = await classifyResult({ response: res });
    } catch (error) {
      result = await classifyResult({ error });
    }

    if (!result.ok) {
      throwClassifiedAuthError(
        "verifyEmail",
        result,
        "The code is incorrect or has expired.",
      );
    }

    const data = result.raw ?? result.data ?? {};

    // Success → clear everything
    sessionStorage.clear();

    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }

    console.log("✅ verifyEmail success");
    return {
      success: true,
      message: data.message || "Email verified successfully!",
    };
  };

  const sendVerificationCode = async (email) => {
    console.log("📡 sendVerificationCode → email:", email);

    let result;
    try {
      const res = await fetch(`${BASE_URL}/password/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      result = await classifyResult({ response: res });
    } catch (error) {
      result = await classifyResult({ error });
    }

    if (!result.ok) {
      throwClassifiedAuthError(
        "sendVerificationCode",
        result,
        "Couldn't resend the code. Please try again.",
      );
    }

    const data = result.raw ?? result.data ?? {};
    console.log("✅ sendVerificationCode success");
    return {
      success: true,
      message: data.message || "Code resent to your email",
    };
  };

  // ── Password reset · step 2 of 3 ─────────────────────────────────────────
  // Verify the 6-digit code the user received by email (sent in step 1 via
  // POST /password/forgot-password → sendVerificationCode). The backend
  // validates { email, code } and, on success, remembers that this email's
  // reset request is verified — so the final reset call (step 3) needs only the
  // new password, no code. Throws a user-safe, classified error on failure.
  const verifyResetCode = async ({ email, code }) => {
    console.log("📡 verifyResetCode → email:", email);

    let result;
    try {
      const res = await fetch(`${BASE_URL}/password/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      result = await classifyResult({ response: res });
    } catch (error) {
      result = await classifyResult({ error });
    }

    if (!result.ok) {
      throwClassifiedAuthError(
        "verifyResetCode",
        result,
        "The code is incorrect or has expired.",
      );
    }

    const data = result.raw ?? result.data ?? {};
    console.log("✅ verifyResetCode success");
    return {
      success: true,
      message: data.message || "Code verified.",
    };
  };

  // ── Password reset · step 3 of 3 ─────────────────────────────────────────
  // Set the new password after the code was verified (see verifyResetCode). We
  // forward the same 6-digit `code` alongside the new password so the backend
  // can re-tie this reset to the verified request. The user never re-types it —
  // the change-password page carries it over from the verify step. `email` is
  // required; `passwordConfirmation` maps to Laravel's `password_confirmation`.
  const resetPassword = async ({
    email,
    code,
    password,
    passwordConfirmation,
  }) => {
    console.log("📡 resetPassword → email:", email);

    let result;
    try {
      const res = await fetch(`${BASE_URL}/password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      result = await classifyResult({ response: res });
    } catch (error) {
      result = await classifyResult({ error });
    }

    if (!result.ok) {
      throwClassifiedAuthError(
        "resetPassword",
        result,
        "Couldn't reset your password. Please try again.",
      );
    }

    const data = result.raw ?? result.data ?? {};
    console.log("✅ resetPassword success");
    return {
      success: true,
      message: data.message || "Your password has been changed successfully.",
    };
  };

  const logout = async () => {
    try {
      if (token) {
        // Best-effort: we always clear the local session in `finally`, so a
        // failed server call is logged (with its real cause) but never blocks
        // sign-out.
        let result;
        try {
          const res = await authFetch(API_LOGOUT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          result = await classifyResult({ response: res });
        } catch (error) {
          result = await classifyResult({ error });
        }

        if (result.ok) {
          console.log("✅ logout — server session ended");
        } else {
          console.warn(
            `⚠️ logout — server call failed [${result.source}]` +
              `${result.status ? ` (HTTP ${result.status})` : ""}: ` +
              `${result.messageForDevs}`,
          );
        }
      }
    } catch (err) {
      console.warn("⚠️ logout — unexpected error:", err?.message || err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      clearImpersonating();
      setUser(null);
      setToken(null);
      setBrands([]);
      setActiveBrandState(null);
      setBrandsLoading(false);
    }
  };

  const inviteTeamMember = async (email) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return;
    }

    try {
      const res = await authFetch(API_CREATE_TEAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      console.log("Invite Team Member Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
        console.log("Invite success (parsed):", data);
      } catch (err) {
        console.error("Server returned non-JSON:", text);
        throw new Error("Unexpected server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Invite failed");
      }

      await fetchTeams();

      return data;
    } catch (err) {
      console.error("Invite failed:", err.message);
      throw err;
    }
  };

  const fetchTeams = useCallback(async () => {
    // console.log("fetchTeams called");

    if (!token) {
      console.error("No auth token found.");
      setTeams([]);
      setTeamsLoading(false);
      return null;
    }

    try {
      setTeamsLoading(true);
      const res = await authFetch(API_FETCH_TEAM_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON:", text);
        setTeams([]);
        return null;
      }

      if (!res.ok) {
        console.error("Failed to fetch teams:", data.message);
        setTeams([]);
        return null;
      }

      setTeams(data.teams || []);
      return data;
    } catch (err) {
      console.error("Fetching teams failed:", err.message);
      setTeams([]);
      return null;
    } finally {
      setTeamsLoading(false);
    }
  }, [token]);

  const fetchResells = async () => {
    console.log("fetchResells called");

    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await authFetch(API_FETCH_RESELLS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      console.log("Resells Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from resells endpoint");
        return null;
      }

      if (!res.ok) {
        console.error(
          "Failed to fetch resells:",
          data.message || "Unknown error",
        );
        return null;
      }

      return data.resells || data;
    } catch (err) {
      console.error("Fetching resells failed:", err.message);
      return null;
    }
  };

  const handleDeleteTeam = useCallback(
    async (id) => {
      if (!token || !id) {
        console.error("No auth token or team ID provided.");
        throw new Error("Authentication or team ID missing.");
      }

      const url = `${BASE_URL}/teams/${id}`;

      try {
        const res = await authFetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        console.log("Delete Team Raw Response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response from delete team endpoint");
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to delete team");
        }

        // Optimistic UI update: remove from state immediately
        setTeams((prev) => prev.filter((team) => team.id !== id));

        // Optional: refresh from server to ensure sync
        // await fetchTeams();

        return {
          success: true,
          message: data.message || "Team member removed successfully",
        };
      } catch (err) {
        console.error("Error deleting team:", err.message);
        throw err;
      }
    },
    [token],
  );

  const createResell = async (email) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await authFetch(API_CREATE_RESELL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      console.log("Create Resell Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from create resell endpoint");
        throw new Error("Unexpected server response");
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create resell");
      }

      return data;
    } catch (err) {
      console.error("Error creating resell:", err.message);
      throw err;
    }
  };

  const deleteResell = async (id) => {
    if (!token) throw new Error("No auth token available");

    const url = `${BASE_URL}/resells/${id}`;

    try {
      const response = await authFetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete resell");
      }

      return { success: true, message: "Resell deleted successfully" };
    } catch (err) {
      console.error("Delete resell error:", err);
      throw err;
    }
  };

  const sendUrl = async (url) => {
    if (!url || !token) return;

    let response;
    try {
      response = await authFetch(API_SEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
    } catch (error) {
      const result = await classifyResult({ error });
      console.warn(`[${result.source}] sendUrl:`, result.messageForDevs);
      return result;
    }

    const result = await classifyResult({ response });
    if (!result.ok)
      console.warn(`[${result.source}] sendUrl:`, result.messageForDevs);
    return result;
  };

  // Create a brand from an already backend-shaped payload. The caller builds the
  // request body (snake_case fields, `logo` as a hosted URL string,
  // `social_accounts` / `ad_accounts` as JSON strings); this just POSTs it via
  // the shared axios instance — the interceptor attaches the Bearer token and
  // JSON headers — then refreshes the brand list on success.
  const createBrand = async (payload) => {
    console.log("📡 [brands/create] request →", payload);
    try {
      const { data } = await api.post(API_CREATE_BRAND_URL, payload);
      console.log("✅ [brands/create] response ←", data);
      // Refresh brands so the new one shows up immediately.
      await fetchBrands();
      return data;
    } catch (err) {
      const status = err?.response?.status;
      const resData = err?.response?.data;
      // Surface Laravel-style validation messages first, then generic errors.
      const firstError = resData?.errors
        ? Object.values(resData.errors)[0]?.[0]
        : null;
      const serverMsg =
        firstError || resData?.message || resData?.error || err?.message;
      console.error("❌ [brands/create] failed:", {
        status,
        data: resData,
        message: err?.message,
      });
      throw new Error(serverMsg || "Failed to create brand");
    }
  };

  const fetchBrands = async (authToken = token) => {
    if (!authToken) {
      console.error("No auth token found. User may not be logged in.");
      setBrands([]);
      setActiveBrandState(null);
      setBrandsLoading(false);
      return [];
    }

    try {
      setBrandsLoading(true);

      const res = await authFetch(API_FETCH_BRAND_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from brands endpoint");
        toast.error("Couldn't load brands. Please try again later.");
        setBrands([]);
        setActiveBrandState(null);
        return [];
      }

      if (!res.ok) {
        console.error(
          "Failed to fetch brands:",
          data.message || `HTTP ${res.status}`,
        );
        toast.error("Couldn't load brands. Please try again later.");
        setBrands([]);
        setActiveBrandState(null);
        return [];
      }

      const brandsList = Array.isArray(data.data) ? data.data : [];
      setBrands(brandsList);

      // 🔑 ACTIVE BRAND RESOLUTION
      // Single source of truth is the user's saved `active_brand_id`, persisted
      // to the backend via POST /brands/{id}/switch on selection. We read it
      // from the freshly-stored `user` (fetchProfile runs and caches it just
      // before this in init(), so the value reflects the database). If the
      // resolved brand no longer exists (e.g. it was deleted), we clear it.
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        storedUser = null;
      }

      const preferredId =
        storedUser?.active_brand_id != null
          ? Number(storedUser.active_brand_id)
          : null;

      if (preferredId != null && !Number.isNaN(preferredId)) {
        const match = brandsList.find((brand) => brand.id === preferredId);
        if (match) {
          console.log("✅ Active brand restored:", match.id);
          setActiveBrandState(match);
        } else {
          console.warn(
            "⚠️ Saved active brand no longer exists — clearing:",
            preferredId,
          );
          setActiveBrandState(null);
        }
      } else {
        setActiveBrandState(null);
      }

      return brandsList;
    } catch (err) {
      console.error("Fetching brands failed:", err.message);
      if (err.message !== "Unauthorized") {
        toast.error("Couldn't load brands. Please try again later.");
      }
      setBrands([]);
      setActiveBrandState(null);
      return [];
    } finally {
      setBrandsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const init = async () => {
      await fetchProfile(token);
      const brands = await fetchBrands(token);
      setBrandsInitialized(true);
      
      await Promise.all([fetchTeams(), fetchMyImages(), fetchTutorialVideos()]);
    };

    init();
  }, [token]);

  // Persist the chosen active brand to the backend via POST /brands/{id}/switch.
  // The brand id lives in the URL — no request body. Returns a normalized
  // { ok, data?, message? } so setActiveBrand can confirm success before it
  // flips the UI. The database is the single source of truth; on reload the
  // active brand is restored from the user's `active_brand_id` (see fetchBrands).
  const switchActiveBrand = async (brandId) => {
    if (!token)
      return { ok: false, message: "You must be logged in to switch brands." };

    try {
      const res = await authFetch(`${BASE_URL}/brands/${brandId}/switch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("❌ switchActiveBrand: non-JSON response:", text);
        return { ok: false, message: "Unexpected server response." };
      }

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        const message =
          firstError ||
          data?.message ||
          `Failed to switch brand (${res.status})`;
        console.error("❌ switchActiveBrand failed:", message);
        return { ok: false, message };
      }

      console.log("✅ Active brand switched:", brandId);
      return { ok: true, data };
    } catch (err) {
      if (err.message === "Unauthorized")
        return {
          ok: false,
          message: "Your session expired. Please log in again.",
        };
      console.error("❌ switchActiveBrand error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  // Switch the active brand. Awaits the backend confirmation before flipping the
  // UI: while the request is in flight `switchingBrandId` is set (drives the
  // loading state in the brand switcher). On success the UI switches; on failure
  // we stay on the current brand and surface the error. Passing `null` clears
  // the local selection (e.g. after leaving a brand) without a network call.
  // Returns the normalized { ok, message? } so callers can react (e.g. navigate
  // only after a confirmed switch).
  const setActiveBrand = async (brandOrId) => {
    if (brandOrId === null) {
      setActiveBrandState(null);
      return { ok: true };
    }

    let selectedBrand;
    if (typeof brandOrId === "object") {
      selectedBrand = brandOrId;
    } else {
      const id = Number(brandOrId);
      selectedBrand = brands.find((b) => b.id === id);
    }

    if (!selectedBrand) {
      console.warn("setActiveBrand: no matching brand for", brandOrId);
      return { ok: false, message: "Brand not found." };
    }

    // Already active — nothing to do (avoids a redundant switch request).
    if (activeBrand?.id === selectedBrand.id) return { ok: true };

    setSwitchingBrandId(selectedBrand.id);
    try {
      const res = await switchActiveBrand(selectedBrand.id);
      if (!res.ok) {
        toast.error(res.message || "Couldn't switch brand. Please try again.");
        return res;
      }
      // Confirmed by the backend — now flip the UI.
      setActiveBrandState(selectedBrand);
      toast.success(`Switched to ${selectedBrand.name || "your brand"}.`);
      return res;
    } finally {
      setSwitchingBrandId(null);
    }
  };

  const fetchBrandById = async (id) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }
    if (!id) {
      console.error("No brand ID provided.");
      return null;
    }

    const url = `${BASE_URL}/brands/${id}`;

    try {
      const res = await authFetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from brand endpoint:", text);
        return null;
      }

      if (!res.ok) {
        console.error(
          "Failed to fetch brand:",
          data?.message || "Unknown error",
        );
        return null;
      }

      // Return the raw brand so callers get every field as-is — including the
      // hosted `logo` URL and the `primary_color` / `secondary_color` /
      // `fonts` values the edit form needs. (Consumers use the logo URL
      // straight; no reshaping.)
      const brand = data?.data || data;
      return brand;
    } catch (err) {
      console.error("Fetching brand by ID failed:", err.message);
      return null;
    }
  };

  // Returns a normalized { ok, data?, message? } so callers can reliably tell
  // success from failure and surface a readable message.
  const updateBrandById = async (id, brandData) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return { ok: false, message: "You must be logged in to update a brand." };
    }

    try {
      const formData = new FormData();
      formData.append("name", brandData.name || "");
      formData.append("description", brandData.description || "");
      formData.append("tagline", brandData.tagline || "");
      formData.append("fonts", brandData.fonts || "");

      // Logo is a hosted URL string (uploaded to the gallery beforehand),
      // never a raw File — the backend accepts a URL only. An empty/undefined
      // logo is simply omitted so the existing one is preserved.
      if (brandData.logo && typeof brandData.logo === "string") {
        formData.append("logo", brandData.logo);
      }

      formData.append("primary_color", brandData.primary_color || "#1e3a8a");
      formData.append(
        "secondary_color",
        brandData.secondary_color || "#10b981",
      );
      formData.append("_method", "PUT"); // This tells Laravel to treat it as PUT

      const url = `${BASE_URL}/brands/${id}`;

      const res = await authFetch(url, {
        method: "POST", // ← Laravel spoofed PUT (multipart can't be a real PUT)
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type — browser sets it automatically with boundary for FormData
        },
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("❌ updateBrandById: non-JSON response:", text);
        return { ok: false, message: "Unexpected server response." };
      }

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        const message =
          firstError ||
          data?.message ||
          `Failed to update brand (${res.status})`;
        console.error("❌ updateBrandById failed:", message);
        return { ok: false, message };
      }

      console.log("✅ Brand updated:", id);
      // Refresh the cached brand list so the edit is reflected immediately.
      await fetchBrands();
      return { ok: true, data };
    } catch (err) {
      if (err.message === "Unauthorized")
        return {
          ok: false,
          message: "Your session expired. Please log in again.",
        };
      console.error("❌ Error updating brand:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  // Returns a normalized { ok, data?, message? }.
  const deleteBrandById = async (id) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return { ok: false, message: "You must be logged in to delete a brand." };
    }

    const url = `${BASE_URL}/brands/${id}`;

    try {
      const res = await authFetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const message =
          data?.message || `Failed to delete brand (${res.status})`;
        console.error("❌ deleteBrandById failed:", message);
        return { ok: false, message };
      }

      // If the deleted brand was active, clear the local selection so the UI
      // doesn't point at a brand that no longer exists.
      if (activeBrand?.id === id) {
        setActiveBrandState(null);
      }

      console.log("✅ Brand deleted:", id);
      // Refresh brands after deletion.
      await fetchBrands();
      return { ok: true, data, message: data?.message || "Brand deleted." };
    } catch (err) {
      if (err.message === "Unauthorized")
        return {
          ok: false,
          message: "Your session expired. Please log in again.",
        };
      console.error("❌ Error deleting brand:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  // ── Brand invites ───────────────────────────────────────────────────────────
  // PUBLIC: fetch the details of a brand invite by its token so the dedicated
  // invite page (/invites/{token}) can show who invited them, to which brand,
  // and in what role — works whether or not the visitor is signed in. We attach
  // the Bearer token when present (harmless on a public route) so the backend
  // can tailor the response to a logged-in user if it chooses. Returns a
  // normalized { ok, data?, status?, message? }.
  const getBrandInvite = async (inviteToken) => {
    if (!inviteToken) return { ok: false, message: "Missing invite token." };

    const url = `${BASE_URL}/brand-invite/${inviteToken}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("❌ getBrandInvite: non-JSON response:", text);
        return { ok: false, message: "Unexpected server response." };
      }

      if (!res.ok) {
        const message =
          data?.message || `This invite couldn't be loaded (${res.status}).`;
        console.warn("⚠️ getBrandInvite failed:", message);
        return { ok: false, status: res.status, data, message };
      }

      console.log("✅ Brand invite loaded:", inviteToken);
      return { ok: true, data: data?.data || data };
    } catch (err) {
      console.error("❌ getBrandInvite error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  // Accept a brand invite (requires a signed-in user). On success we refresh the
  // brand list and switch the user into the freshly-joined brand so they land
  // ready to work (see the "auto-switch to joined brand" product decision).
  // Returns a normalized { ok, data?, status?, message? }.
  const acceptBrandInvite = async (inviteToken) => {
    if (!inviteToken) return { ok: false, message: "Missing invite token." };
    if (!token)
      return {
        ok: false,
        status: 401,
        message: "You must be logged in to accept an invite.",
      };

    const url = `${BASE_URL}/brand-invite/${inviteToken}/accept`;
    try {
      const res = await authFetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("❌ acceptBrandInvite: non-JSON response:", text);
        return { ok: false, message: "Unexpected server response." };
      }

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        const message =
          firstError ||
          data?.message ||
          `Couldn't accept the invite (${res.status}).`;
        console.warn("⚠️ acceptBrandInvite failed:", message);
        return { ok: false, status: res.status, data, message };
      }

      console.log("✅ Brand invite accepted:", inviteToken);

      // Refresh brands, then switch into the joined brand if we can identify it.
      const joinedId =
        data?.brand?.id ??
        data?.brand_id ??
        data?.data?.brand?.id ??
        data?.data?.brand_id ??
        null;

      const list = await fetchBrands();
      if (joinedId != null) {
        const joined = Array.isArray(list)
          ? list.find((b) => b.id === Number(joinedId))
          : null;
        if (joined) {
          await setActiveBrand(joined);
        } else {
          console.warn(
            "⚠️ acceptBrandInvite: joined brand not found in refreshed list:",
            joinedId,
          );
        }
      }

      return {
        ok: true,
        data,
        joinedId,
        message: data?.message || "Invite accepted.",
      };
    } catch (err) {
      if (err.message === "Unauthorized")
        return {
          ok: false,
          status: 401,
          message: "Your session expired. Please log in again.",
        };
      console.error("❌ acceptBrandInvite error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  const connectSocialAccount = async (socialData) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("brand_id", socialData.brand_id);
      formData.append("name", socialData.name);
      formData.append("platform", socialData.platform);
      formData.append("token", socialData.token);
      formData.append("platform_id", socialData.platform_id);

      const res = await authFetch(API_CONNECT_SOCIAL_ACCOUNT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Failed to update brand: ${res.status}`);

      const data = await res.json();
      console.log("Social Connect Response:", data);

      return data;
    } catch (err) {
      console.error("Error connecting social account:", err.message);
      return null;
    }
  };

  const handleDelete = async (socialId) => {
    if (!token) {
      console.error("No auth token found.");
      return null;
    }

    try {
      const res = await authFetch(API_DELETE_SOCIAL_ACCOUNT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: socialId }),
      });

      if (!res.ok) throw new Error(`Failed to disconnect: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error disconnecting social account:", err.message);
      return null;
    }
  };

  const fetchSocialAccounts = async () => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await authFetch(API_FETCH_SOCIAL_ACCOUNTS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch social accounts: ${res.status}`);
      }

      const data = await res.json();
      console.log("Social accounts response:", data);
      setSocialAccounts(data);
      return data;
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      return null;
    }
  };

  const fetchAdsAccounts = async () => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await authFetch(API_FETCH_AD_ACCOUNTS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ads accounts: ${res.status}`);
      }

      const data = await res.json();
      console.log("Social ads response:", data);
      return data;
    } catch (error) {
      console.error("Error fetching ads accounts:", error);
      return null;
    }
  };

  const connectAdsAccount = async (adsData) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("brand_id", adsData.brand_id);
      formData.append("name", adsData.name);
      formData.append("platform", adsData.platform);
      formData.append("token", adsData.token);
      formData.append("platform_id", adsData.platform_id);

      const res = await authFetch(API_CONNECT_AD_ACCOUNTS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Failed to update brand: ${res.status}`);

      const data = await res.json();
      console.log("ads Connect Response:", data);

      return data;
    } catch (err) {
      console.error("Error connecting ads account:", err.message);
      return null;
    }
  };

  const disconnectSocialAccount = async (platform) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    const url = `${BASE_URL}/social-accounts/${platform.toLowerCase()}`;

    try {
      const res = await authFetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to disconnect account");

      setSocialAccounts((prev) =>
        prev.filter((acc) => acc.platform !== platform.toLowerCase()),
      );

      return true;
    } catch (err) {
      console.error("Error disconnecting account:", err);
      throw err;
    }
  };

  const disconnectAdsAccount = async (platform) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    const url = `${BASE_URL}/ad-accounts/${platform.toLowerCase()}`;

    try {
      const res = await authFetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to disconnect account");

      setSocialAccounts((prev) =>
        prev.filter((acc) => acc.platform !== platform.toLowerCase()),
      );

      return true;
    } catch (err) {
      console.error("Error disconnecting account:", err);
      throw err;
    }
  };

  // Fetch ONE page of the gallery, optionally filtered to a single media type.
  // Returns the normalized items plus pagination `meta`
  // ({ current_page, last_page, per_page, total }) so callers can drive infinite
  // scroll and per-tab counts. Never throws — a failure is logged and returns an
  // empty page so the UI can degrade gracefully instead of crashing.
  const fetchGalleryPage = useCallback(
    async ({ type = null, page = 1, perPage = GALLERY_PER_PAGE } = {}) => {
      if (!token) return { items: [], meta: null };

      try {
        const params = new URLSearchParams();
        params.set("per_page", String(perPage));
        params.set("page", String(page));
        if (type) params.set("type", type); // backend paginates per type

        // Shared axios instance — the interceptor attaches the Bearer token and
        // axios throws on non-2xx, so no manual status/JSON handling needed.
        const { data } = await api.get(
          `${API_GALLERY_URL}?${params.toString()}`,
        );

        const { raw, meta } = extractGalleryPayload(data);
        return { items: raw.map(normalizeGalleryItem), meta };
      } catch (err) {
        console.error(
          "❌ [gallery] page fetch failed:",
          err?.response?.data?.message || err.message,
        );
        return { items: [], meta: null };
      }
    },
    [token],
  );

  const fetchGallery = useCallback(async () => {
    if (!token) {
      setMyGallery([]);
      setMyGalleryLoading(false);
      return;
    }

    setMyGalleryLoading(true);

    try {
      // Shared axios instance — the interceptor attaches the Bearer token and
      // axios throws on non-2xx, so no manual status/JSON handling needed.
      const { data } = await api.get(API_GALLERY_URL);

      // `files` may be a plain array (legacy) or a paginator object ({ data }) —
      // extractGalleryPayload handles both so this never crashes on the shape.
      const { raw } = extractGalleryPayload(data);

      // Transform to format gallery expects
      setMyGallery(raw.map(normalizeGalleryItem));
    } catch (err) {
      console.error(
        "❌ Failed to fetch media:",
        err?.response?.data?.message || err.message,
      );
      setMyGallery([]);
    } finally {
      setMyGalleryLoading(false);
    }
  }, [token]);

  const fetchMyImages = useCallback(async () => {
    if (!token) {
      setMyImages([]);
      setMyImagesLoading(false);
      return;
    }

    setMyImagesLoading(true);

    try {
      // Shared axios instance — the interceptor attaches the Bearer token and
      // axios throws on non-2xx, so no manual status/JSON handling needed.
      const { data } = await api.get(API_GALLERY_URL);

      // `files` may be a plain array (legacy) or a paginator object ({ data }) —
      // extractGalleryPayload handles both so this never crashes on the shape.
      const { raw } = extractGalleryPayload(data);
      const images = raw.filter(
        (file) => file.type === "image" || file.type === "",
      );

      // Transform to format your gallery expects
      setMyImages(images.map(normalizeGalleryItem));
    } catch (err) {
      console.error(
        "❌ Failed to fetch images:",
        err?.response?.data?.message || err.message,
      );
      setMyImages([]);
    } finally {
      setMyImagesLoading(false);
    }
  }, [token]);

  const uploadMedia = useCallback(
    async (file) => {
      if (!token) throw new Error("Not authenticated");
      if (!file) throw new Error("No file provided");

      const formData = new FormData();
      formData.append("file", file);

      let data;
      try {
        // Shared axios instance — the interceptor attaches the Bearer token.
        // The multipart override is REQUIRED: the instance defaults to
        // application/json, and axios serializes a FormData body to JSON when
        // the content type says JSON — which would destroy the file. Axios
        // swaps in the real multipart boundary at send time.
        ({ data } = await api.post(API_GALLERY_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }));
      } catch (error) {
        // Route the axios failure through classifyResult so callers keep the
        // same classified error shape (message / source / messageForDevs).
        // An axios HTTP error carries the already-parsed body in
        // error.response.data; re-feed it as rawText since classifyResult
        // expects an unread fetch Response. No response at all = network/CORS.
        const res = error?.response;
        const result = await classifyResult(
          res
            ? {
                response: { ok: false, status: res.status },
                rawText:
                  typeof res.data === "string"
                    ? res.data
                    : res.data != null
                      ? JSON.stringify(res.data)
                      : "",
              }
            : { error },
        );
        console.warn(
          `[${result.source}] uploadMedia:`,
          result.messageForDevs,
          "| field errors:",
          result.errors, // 🔎 backend's exact validation reasons (field → messages)
        );
        const e = new Error(result.message);
        e.source = result.source;
        e.messageForDevs = result.messageForDevs;
        throw e;
      }

      await fetchMyImages();
      // Caller expects the raw response shape (image_url/url/data.image_url)
      return data;
    },
    [token, fetchMyImages],
  );

  const deleteImage = useCallback(
    async (imageId) => {
      if (!token) throw new Error("Not authenticated");
      if (!imageId) throw new Error("Image ID is required");

      try {
        // Shared axios instance — the interceptor attaches the Bearer token.
        await api.delete(`${BASE_URL}/gallery/${imageId}`);

        // Success — remove from UI immediately
        setMyImages((prev) => prev.filter((img) => img.id !== imageId));

        return { success: true, message: "Image deleted successfully" };
      } catch (err) {
        // Prefer the backend's own message; fall back to the axios error
        // (e.g. "Network Error", "Request failed with status code 404").
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to delete image";
        console.error("❌ Delete failed:", message);
        throw new Error(message); // Let UI handle showing error
      }
    },
    [token],
  );

  const fetchTutorialVideos = useCallback(async () => {
    if (!token) {
      setTutorialVideos([]);
      setTutorialVideosLoading(false);
      return [];
    }

    setTutorialVideosLoading(true);
    setTutorialVideosError(null);

    try {
      const res = await authFetch(API_FETCH_TUTORIAL_VIDEOS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch tutorial videos");
      }

      // Normalize response (supports both { videos: [...] } and direct array)
      const videos = Array.isArray(data)
        ? data
        : Array.isArray(data.videos)
          ? data.videos
          : data.data && Array.isArray(data.data)
            ? data.data
            : [];

      setTutorialVideos(videos);
      return videos;
    } catch (err) {
      console.error("Error fetching tutorial videos:", err.message);
      setTutorialVideosError(err.message);
      setTutorialVideos([]);
      return [];
    } finally {
      setTutorialVideosLoading(false);
    }
  }, [token]);

  // const generateCustomCreative = async ({ creativeType, categoryType, ...formPayload }) => {
  //   if (!token) {
  //     console.error("No auth token found. User may not be logged in.");
  //     return { ok: false, message: "Not authenticated" };
  //   }

  //   const url = `${BASE_URL}/creatives/redesign`;

  //   // Strip "_creative" suffix: "ads_creative" → "ads", "magic_studio" → "magic_studio"
  //   const creativeTypeShort = creativeType?.replace("_creative", "") || creativeType;

  //   const generation_data = {
  //     creative_type: creativeTypeShort,  // "ads", "social", "designer", "magic_studio"
  //     create_sub_type: categoryType,
  //     ...formPayload,
  //   };

  //   console.log("🚀 Generate Payload:", generation_data);

  //   try {
  //     const res = await authFetch(url, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         generation_data,
  //       }),
  //     });

  //     const text = await res.text();

  //     let data;

  //     try {
  //       data = JSON.parse(text);
  //     } catch {
  //       console.log("RAW RESPONSE:");
  //       console.log(text);
  //       return { ok: false, message: "Invalid server response" };
  //     }

  //     if (!res.ok) {
  //       const firstError = data?.errors
  //         ? Object.values(data.errors)[0]?.[0]
  //         : null;
  //       return { ok: false, message: firstError || data?.message || "Generation failed" };
  //     }

  //     return { ok: true, data };
  //   } catch (err) {
  //     console.error("Generation request failed:", err);
  //     return { ok: false, message: err.message || "Network error" };
  //   }
  // };

  const generateCustomCreative = async (
    { creativeType, categoryType, ...formPayload },
    onBatchResult,
    opts = {},
  ) => {
    if (!token) {
      console.error("No auth token found.");
      return {
        ok: false,
        message: "Not authenticated",
      };
    }

    // ── Engine switch ────────────────────────────────────────────────────────
    // Route to Involk's single-shot LLM endpoint when selected, adapting its
    // response into the same streamed-batch contract the forms already consume
    // (one batch: { ok, variations, assets, data }). `opts.forceEngine` lets a
    // caller pin a backend regardless of the flag — create-from-url's explicit
    // Scraive path passes "redesign" so it never gets redirected. Flip
    // CREATIVE_ENGINE back to "redesign" to send every form down the code below.
    const engine = opts.forceEngine || CREATIVE_ENGINE;
    if (engine === "involk") {
      const result = await createDesign({
        creativeType,
        categoryType,
        ...formPayload,
      });

      if (!result?.ok) {
        onBatchResult?.({ ...result, batchIndex: 0, totalBatches: 1 });
        return { ...result, data: { variations: [], assets: [], raw: [] } };
      }

      // involk_llm returns `canvas` and `copy` as JSON STRINGS per variation;
      // `canvas` decodes to { canvas, elements }. Normalize to the object shape
      // AdPreview + saveDesign expect (parsed copy, guaranteed id/name/category).
      const parseMaybe = (val) => {
        if (typeof val !== "string") return val;
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      };
      const data = result.raw || result.data || {};
      const shortType = creativeType?.replace("_creative", "") || creativeType;
      const brandName = formPayload?.brandName;
      const normalize = (v, i) => {
        const design = parseMaybe(v?.canvas) || {};
        const copy = parseMaybe(v?.copy) || {};
        return {
          id: v?.id || `cd-${Date.now()}-${i}`,
          name: copy?.headline || v?.name || brandName || "Generated Design",
          category: v?.category || v?.sub_type || categoryType || shortType,
          canvas: design.canvas || design || null,
          elements: Array.isArray(design.elements)
            ? design.elements
            : Array.isArray(v?.elements)
              ? v.elements
              : [],
          copy,
        };
      };

      let variations = Array.isArray(data.variations)
        ? data.variations.map(normalize)
        : [];
      if (!variations.length && data.design) {
        variations = [normalize({ canvas: data.design, copy: data.copy }, 0)];
      }
      const assets = Array.isArray(data.assets) ? data.assets : [];

      onBatchResult?.({
        ok: true,
        source: "success",
        batchIndex: 0,
        totalBatches: 1,
        variations,
        assets,
        data,
      });
      return {
        ok: true,
        source: "success",
        data: { variations, assets, raw: [data] },
      };
    }

    const url = `${BASE_URL}/creatives/redesign`;

    // "ads_creative" -> "ads"
    const creativeTypeShort =
      creativeType?.replace("_creative", "") || creativeType;

    // Pull templates + generatedAt out; everything else goes inside brand_details
    const { templates, generatedAt, ...rest } = formPayload || {};

    // Chunk templates into batches of 9 (last batch may have fewer)
    const templateList = Array.isArray(templates) ? templates : [];
    const batches = [];
    for (let i = 0; i < templateList.length; i += 9) {
      batches.push(templateList.slice(i, i + 9));
    }
    if (!batches.length) batches.push([]); // single empty batch fallback

    const aggregated = { variations: [], assets: [], raw: [] };

    for (let i = 0; i < batches.length; i++) {
      const batchTemplates = batches[i];

      const generation_data = {
        brand_details: {
          creative_type: creativeTypeShort,
          create_sub_type: categoryType,
          ...rest,
        },
        templates: batchTemplates,
        generatedAt,
      };

      console.log(`🚀 BATCH ${i + 1}/${batches.length} PAYLOAD`);
      console.log(generation_data);

      let response;
      let batchResult;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ generation_data }),
        });
        batchResult = await classifyResult({ response });
      } catch (error) {
        batchResult = await classifyResult({ error });
      }

      if (!batchResult.ok) {
        console.warn(
          `[${batchResult.source}] redesign batch ${i + 1}:`,
          batchResult.messageForDevs,
        );
        onBatchResult?.({
          ...batchResult,
          batchIndex: i,
          totalBatches: batches.length,
        });
        return { ...batchResult, data: aggregated };
      }

      // Success — data is the parsed JSON body
      const data = batchResult.raw || batchResult.data;
      const batchVariations = Array.isArray(data?.variations)
        ? data.variations
        : [];
      const batchAssets = Array.isArray(data?.assets) ? data.assets : [];
      aggregated.variations.push(...batchVariations);
      aggregated.assets.push(...batchAssets);
      aggregated.raw.push(data);

      onBatchResult?.({
        ok: true,
        source: "success",
        batchIndex: i,
        totalBatches: batches.length,
        variations: batchVariations,
        assets: batchAssets,
        data,
      });
    }

    return { ok: true, source: "success", data: aggregated };
  };

  // ── Generate a design via /design/generate-design/involk_llm (no Scraive templates) ──
  // Backend generates from scratch — we send brand_details only, no templates.
  // Used by create-from-url to bypass Scraive + /creatives/redesign.
  const createDesign = useCallback(
    async ({ creativeType, categoryType, ...formPayload }) => {
      if (!token) {
        console.error("createDesign: no auth token.");
        return { ok: false, message: "Not authenticated" };
      }

      const url = `${BASE_URL}/design/generate-design/involk_llm`;

      // "ads_creative" -> "ads"
      const creativeTypeShort =
        creativeType?.replace("_creative", "") || creativeType;

      // Drop `templates` (createdesign generates the design itself);
      const { templates, generatedAt, ...rest } = formPayload || {};

      const generation_data = {
        brand_details: {
          creative_type: creativeTypeShort,
          create_sub_type: categoryType,
          ...rest,
        },
        generatedAt,
      };

      console.log("createDesign PAYLOAD:", generation_data);

      let response;
      let result;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ generation_data }),
        });
        result = await classifyResult({ response });
      } catch (error) {
        result = await classifyResult({ error });
      }

      // 🔎 Log the raw createdesign output for testing
      console.log(" createDesign RESULT:", result);
      console.log("createDesign RAW DATA:", result?.raw || result?.data);

      return result;
    },
    [token],
  );

  /**
   * Creative AI chat → POST /creatives/ai-chat.
   *
   * The request body is EXACTLY the fields the endpoint validates — nothing
   * else is sent:
   *
   *   'brand_id'  => 'required|integer',
   *   'message'   => 'required|string|max:2000',
   *   'save_chat' => 'nullable|string|max:32',
   *   'details'   => 'nullable|array',
   *   'images'    => 'nullable|array|max:10',
   *   'images.*'  => 'nullable|string|url|max:2048',
   *   'logo'      => 'nullable|string|url|max:2048',
   *   'model'     => 'nullable|string',
   *
   * Deliberately GONE (do not re-add without a backend change):
   *   history        the server keeps the conversation now — `save_chat` is
   *                  what ties messages together, so nothing is replayed
   *   creative_type  no longer part of the contract; the assistant infers intent
   *   mode           Build/Plan has no field here; it stays UI/URL state only
   *
   * `details` is sent as null until the backend defines a shape for it.
   *
   * @param {object} params
   * @param {string} params.message  What the user typed. Required, ≤2000 chars.
   * @param {number|string} params.brandId  Active brand — required by the API.
   * @param {string[]} [params.images] Hosted image URLs, ≤10 (see toImagePayload).
   * @param {string} [params.logo]   The brand's hosted logo URL.
   * @param {string} [params.model]  The composer's model id, passed straight on.
   * @returns {Promise<{ok: boolean, reply?: string, data?: unknown, message?: string}>}
   */
  const creativeAiChat = async ({
    message,
    brandId,
    images = [],
    logo,
    model,
  }) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return { ok: false, message: "Not authenticated" };
    }

    // Guard the two required fields here so a predictable 422 becomes a clear
    // message instead of a round trip that fails for a reason the UI must then
    // decode out of the validation envelope.
    if (!brandId) {
      console.error("❌ creativeAiChat: no active brand — brand_id is required.");
      return { ok: false, message: "Select a brand before starting a chat." };
    }
    // NB: named `trimmedMessage`, not `text` — the response body below is read
    // into a `text` const inside the try block, and reusing the name here would
    // put this one in that block's temporal dead zone.
    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage) {
      console.error("❌ creativeAiChat: empty message — message is required.");
      return { ok: false, message: "Type a message to send." };
    }

    try {
      const res = await authFetch(API_AI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand_id: brandId,
          message: trimmedMessage,
          save_chat: "true", // always persist the conversation server-side
          details: null, // no agreed shape yet
          images: images.length ? images : null,
          logo: logo || null,
          model: model || null,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
        console.log(data);
      } catch {
        console.error("Invalid JSON from ai-creative-chat:", text);
        return { ok: false, message: "Invalid server response" };
      }

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        return {
          ok: false,
          message: firstError || data?.message || "Chat request failed",
        };
      }

      // Expected response shape: { ok: true, reply: "...", data?: any }
      return { ok: true, reply: data.reply || data.message || "", data };
    } catch (err) {
      console.error("creativeAiChat failed:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  /**
   * List the brand's saved AI-chat sessions → GET /creative/sessions/{brandId}.
   *
   * This is the read side of `creativeAiChat`'s `save_chat` — every message it
   * sends is persisted server-side, and this is how that history comes back.
   *
   * Answers `{ status: true, sessions: [...] }`, newest first, with rows shaped
   * `{ session_id (uuid), title, status: 'open'|'complete', messages, started }`
   * — `title` being the first user message verbatim, newlines and all (see
   * formatSessionTitle). `raw` is returned untouched alongside the normalised
   * `items`, which also tolerates a bare array or `{data: []}`.
   *
   * @param {number|string} [brandId] Defaults to the active brand.
   * @returns {Promise<{ok: boolean, items: object[], raw?: unknown, message?: string}>}
   */
  const fetchChatSessions = useCallback(
    async (brandId = activeBrandId) => {
      if (!token) return { ok: false, items: [], message: "Not authenticated" };
      if (!brandId) return { ok: false, items: [], message: "No brand selected" };

      try {
        const res = await authFetch(`${API_CHAT_SESSIONS_URL}/${brandId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("fetchChatSessions: invalid JSON response", text);
          return { ok: false, items: [], message: "Invalid server response" };
        }

        if (!res.ok) {
          console.error("fetchChatSessions failed:", data);
          return {
            ok: false,
            items: [],
            raw: data,
            message: data?.message || `HTTP ${res.status}`,
          };
        }

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.sessions)
              ? data.sessions
              : [];

        // The raw body, plus the exact field names on a row — the card is built
        // from those five keys, so this is what to check when one goes blank.
        console.log("📡 [chat sessions] raw:", data);
        console.log(
          `📡 [chat sessions] ${items.length} row(s), fields:`,
          items[0] ? Object.keys(items[0]) : "(none)",
          items[0] || "",
        );
        return { ok: true, items, raw: data };
      } catch (err) {
        console.error("fetchChatSessions error:", err);
        return { ok: false, items: [], message: err.message || "Network error" };
      }
    },
    [token, activeBrandId],
  );

  /**
   * Fetch one saved chat thread → GET /creative/session/{sessionId}.
   *
   * Same caveat as above: `raw` is the untouched body, `messages` is a
   * best-effort pick of the message array so a caller can rehydrate the chat
   * without waiting on the contract being frozen.
   *
   * @param {number|string} sessionId Id from fetchChatSessions.
   * @returns {Promise<{ok: boolean, messages: object[], raw?: unknown, message?: string}>}
   */
  const fetchChatSession = useCallback(
    async (sessionId) => {
      if (!token)
        return { ok: false, messages: [], message: "Not authenticated" };
      if (!sessionId)
        return { ok: false, messages: [], message: "No session id" };

      try {
        const res = await authFetch(`${API_CHAT_SESSION_URL}/${sessionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("fetchChatSession: invalid JSON response", text);
          return { ok: false, messages: [], message: "Invalid server response" };
        }

        if (!res.ok) {
          console.error("fetchChatSession failed:", data);
          return {
            ok: false,
            messages: [],
            raw: data,
            message: data?.message || `HTTP ${res.status}`,
          };
        }

        const messages = Array.isArray(data?.messages)
          ? data.messages
          : Array.isArray(data?.data?.messages)
            ? data.data.messages
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

        // Still the unpinned half of the contract — this is the log that says
        // whether normalizeSessionMessages is reading the right keys.
        console.log("📡 [chat session] raw:", data);
        console.log(
          `📡 [chat session] ${messages.length} message(s), fields:`,
          messages[0] ? Object.keys(messages[0]) : "(none)",
          messages[0] || "",
        );
        return { ok: true, messages, raw: data };
      } catch (err) {
        console.error("fetchChatSession error:", err);
        return {
          ok: false,
          messages: [],
          message: err.message || "Network error",
        };
      }
    },
    [token],
  );

  // Klux AI design assistant → POST /creatives/ai-redesign.
  // Sends the live design (canvas the same way we save it — a JSON-stringified
  // { canvas, elements }) plus the user's prompt. Returns the raw response so
  // the panel can render whatever the assistant sends back.
  const aiRedesign = async ({ prompt, design, signal } = {}) => {
    if (!token) {
      return { ok: false, message: "Not authenticated" };
    }
    try {
      const res = await authFetch(API_AI_REDESIGN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          canvas: JSON.stringify(design || {}),
        }),
        signal,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from ai-redesign:", text);
        return { ok: false, message: "Invalid server response" };
      }

      console.log("🎨 ai-redesign response:", data);

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        return {
          ok: false,
          message: firstError || data?.message || "AI redesign failed",
        };
      }

      return { ok: true, data, reply: data.reply || data.message || "" };
    } catch (err) {
      if (err?.name === "AbortError" || signal?.aborted) {
        return { ok: false, aborted: true, message: "Aborted" };
      }
      console.error("aiRedesign failed:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  const saveDesign = useCallback(
    async (brandId, variations, creativeType = "ads") => {
      if (!token) {
        console.error("saveDesign: no auth token.");
        return { ok: false, message: "Not authenticated" };
      }
      if (!brandId) {
        console.error("saveDesign: no brand ID provided.");
        return { ok: false, message: "No active brand selected" };
      }
      if (!Array.isArray(variations) || variations.length === 0) {
        return { ok: false, message: "No designs selected to save" };
      }

      // Derive a short type string — strip "_creative" suffix if present
      const typeShort = creativeType?.replace("_creative", "") || "ads";

      // Build each design entry with a base64 preview, painted at the design's
      // true canvas size — the same thing the editor sends on every save, so a
      // design looks identical in the lists whether it was created here or
      // saved from the editor afterwards. The backend decodes the data URL,
      // stores the image itself, and returns `thumbnail` as a CDN URL.
      // Normalize the canvas shape (string / nested) like the on-screen
      // DesignCanvas so involk + redesign variations both render.
      const creativedesigns = await Promise.all(
        variations.map(async (v) => {
          let design = v.canvas;
          if (typeof design === "string") {
            try {
              design = JSON.parse(design);
            } catch {
              design = null;
            }
          }
          const canvasSpec = design?.canvas || design;
          const els = Array.isArray(v.elements)
            ? v.elements
            : Array.isArray(design?.elements)
              ? design.elements
              : [];
          const thumbnail = canvasSpec
            ? await renderDesignToDataUrl({ canvas: canvasSpec, elements: els })
            : null;

          return {
            name: v.name || "Untitled Design",
            score:
              parseInt(
                String(v.copy?.performance_score ?? "").split("/")[0],
                10,
              ) || 0,
            copy: JSON.stringify(v.copy || {}),
            canvas: { canvas: v.canvas, elements: v.elements },
            // base64 data URL: "data:image/jpeg;base64,…"
            thumbnail,
            type: typeShort,
            sub_type: v.category?.toLowerCase() || "image",
          };
        }),
      );

      const payload = { brand_id: brandId, creativedesigns };

      console.log("saveDesign payload:", payload);

      try {
        const res = await authFetch(SAVE_DESIGN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
          console.log(data);
        } catch {
          console.error("saveDesign: invalid JSON response", text);
          return { ok: false, message: "Invalid server response" };
        }

        if (!res.ok) {
          const firstError = data?.errors
            ? Object.values(data.errors)[0]?.[0]
            : data?.error
              ? Object.values(data.error)[0]?.[0]
              : null;

          return {
            ok: false,
            message: firstError || data?.message || "Failed to save designs",
          };
        }

        console.log("saveDesign success:", data);
        return { ok: true, data };
      } catch (err) {
        console.error("saveDesign error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  /**
   * Fetch one PAGE of the brand's designs → GET /creative-designs.
   *
   * The endpoint answers with a standard Laravel paginator
   * ({ current_page, data, total, last_page, per_page, … }). This returns that
   * envelope — normalised, but with Laravel's own `data` key preserved — so
   * callers can drive real pagination off `total`/`last_page` instead of
   * guessing from the length of the page they happen to hold.
   *
   * `?page=` needs no backend support: Laravel's paginate() reads it natively.
   *
   * ⚠️ The endpoint takes brand_id, per_page and page — and NOTHING else.
   * `type`, `fav` and `search` were tried and are ignored (every filter came
   * back with the brand's full count), so filtering and searching are done on
   * the client. Don't re-add them here without confirming the controller reads
   * them, or the UI will silently filter nothing.
   *
   * @param {number} [perPage] Rows per page.
   * @param {number} [page]    1-based page number.
   * @returns {Promise<{data: object[], total: number, current_page: number,
   *   last_page: number, per_page: number}|null>} null on failure.
   */
  const fetchDesigns = useCallback(
    async (perPage = 12, page = 1) => {
      if (!token) {
        console.error("fetchDesigns: no auth token.");
        return null;
      }

      if (!activeBrandId) {
        console.error("fetchDesigns: no activeBrandId.");
        return null;
      }

      const url = `${FETCH_DESIGN_URL}?brand_id=${activeBrandId}&per_page=${perPage}&page=${page}`;

      try {
        const res = await authFetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("fetchDesigns: invalid JSON response", text);
          return null;
        }

        if (!res.ok) {
          console.error(
            "fetchDesigns failed:",
            data?.message || `HTTP ${res.status}`,
          );
          return null;
        }

        // Normalise to one shape whatever the endpoint returns. A bare array
        // (no paginator) is treated as a single complete page, so callers never
        // have to branch on which form came back.
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        const result = {
          data: items, // Laravel's own key — existing callers already read this
          total: Number.isFinite(data?.total) ? data.total : items.length,
          current_page: Number.isFinite(data?.current_page) ? data.current_page : page,
          last_page: Number.isFinite(data?.last_page) ? data.last_page : 1,
          per_page: Number.isFinite(data?.per_page) ? data.per_page : perPage,
        };

        console.log(
          `📡 [designs] page ${result.current_page}/${result.last_page} — ${items.length} of ${result.total} total`,
        );
        return result;
      } catch (err) {
        console.error("fetchDesigns error:", err);
        return null;
      }
    },
    [token, activeBrandId],
  );

  // Fetch a single design by id. Tries GET /creative-designs/:id first,
  // then falls back to scanning the brand's design list so the editor can
  // open even if the single-resource route isn't available.
  const fetchDesignById = useCallback(
    async (id) => {
      if (!token) return null;
      if (!id) return null;

      try {
        const res = await authFetch(`${BASE_URL}/creative-designs/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        if (res.ok && data) {
          // Unwrap { data: {...} } / { data: [...] } / raw object
          const payload = data?.data ?? data;
          if (Array.isArray(payload)) {
            return payload.find((d) => String(d.id) === String(id)) || null;
          }
          if (payload && payload.id != null) return payload;
        }
      } catch (err) {
        console.error("fetchDesignById error:", err);
      }

      // Fallback: pull the brand's designs and find it locally.
      try {
        const list = await fetchDesigns(50);
        if (Array.isArray(list)) {
          return list.find((d) => String(d.id) === String(id)) || null;
        }
      } catch (err) {
        console.error("fetchDesignById fallback error:", err);
      }

      return null;
    },
    [token, fetchDesigns],
  );

  const deleteDesignById = useCallback(
    async (id) => {
      if (!token) return { ok: false, message: "Not authenticated" };
      if (!id) return { ok: false, message: "No design ID provided" };

      try {
        const res = await authFetch(`${BASE_URL}/creative-designs/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || `Delete failed (${res.status})`,
          };
        }

        return { ok: true, message: data?.message || "Design deleted" };
      } catch (err) {
        console.error("deleteDesignById error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const bulkDeleteDesigns = useCallback(
    async (ids) => {
      if (!token) return { ok: false, message: "Not authenticated" };
      if (!Array.isArray(ids) || ids.length === 0)
        return { ok: false, message: "No IDs provided" };

      try {
        const res = await authFetch(
          `${BASE_URL}/creative-designs/bulk-delete`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids }),
          },
        );

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || `Bulk delete failed (${res.status})`,
          };
        }

        return {
          ok: true,
          message: data?.message || `${ids.length} design(s) deleted`,
        };
      } catch (err) {
        console.error("bulkDeleteDesigns error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const updateDesignById = useCallback(
    async (id, updates) => {
      if (!token) return { ok: false, message: "Not authenticated" };
      if (!id) return { ok: false, message: "No design ID provided" };

      // `updates` can include any subset of:
      //   { name, score, copy, canvas, type, sub_type, thumbnail }
      // `thumbnail` is a base64 data URL ("data:image/jpeg;base64,…"), the same
      // shape saveDesign sends on create — the column must hold it (LONGTEXT),
      // and the update validator must accept the field or the editor's preview
      // silently never refreshes.
      try {
        const res = await authFetch(`${BASE_URL}/creative-designs/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || `Update failed (${res.status})`,
          };
        }

        console.log("updateDesignById success:", data);
        return { ok: true, data };
      } catch (err) {
        console.error("updateDesignById error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  // Mark/unmark a design as favorite. Send 1 to favorite, 0 to remove.
  const toggleDesignFavorite = useCallback(
    async (id, favorite) => {
      if (!token) return { ok: false, message: "Not authenticated" };
      if (!id) return { ok: false, message: "No design ID provided" };

      try {
        const res = await authFetch(
          `${BASE_URL}/creative-designs/${id}/favorite`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fav: favorite ? 1 : 0 }),
          },
        );

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || `Favorite failed (${res.status})`,
          };
        }

        return { ok: true, data };
      } catch (err) {
        console.error("toggleDesignFavorite error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const analyzeRival = useCallback(
    async ({ url, period = "last_30_days" }) => {
      if (!token) {
        console.error("analyzeRival: no auth token.");
        return null;
      }

      if (!url) {
        console.error("analyzeRival: url is required.");
        return null;
      }

      try {
        const res = await authFetch(`${BASE_URL}/rival-lens/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url,
            period,
          }),
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("analyzeRival: invalid JSON response", text);
          return null;
        }

        if (!res.ok) {
          console.error(
            "analyzeRival failed:",
            data?.message || `HTTP ${res.status}`,
          );
          return null;
        }

        console.log("analyzeRival success:", data);

        return data;
      } catch (err) {
        console.error("analyzeRival error:", err);
        return null;
      }
    },
    [token],
  );

  const getCompetitorInsights = useCallback(
    async ({ url }) => {
      if (!token) {
        console.error("getCompetitorInsights: no auth token.");
        return { ok: false, message: "Not authenticated" };
      }

      if (!url) {
        console.error("getCompetitorInsights: url is required.");
        return { ok: false, message: "URL is required" };
      }

      try {
        const normalizedUrl = url.replace(/^https?:\/\//, "").split("/")[0];

        const res = await authFetch(`${BASE_URL}/competitor-insights`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: normalizedUrl,
          }),
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Invalid JSON:", text);
          return { ok: false, message: "Invalid server response" };
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || "Failed to fetch competitor insights",
          };
        }

        return { ok: true, data };
      } catch (err) {
        console.error("getCompetitorInsights error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const checkCompliance = useCallback(
    async ({ image, canvas, platforms }) => {
      if (!token) return { ok: false, message: "Not authenticated" };

      if (!image && !canvas) {
        return {
          ok: false,
          message: "An image file or canvas data is required",
        };
      }

      try {
        let res;

        if (image) {
          // ── Image mode: multipart/form-data ──────────────────────────────────
          const formData = new FormData();
          formData.append("image", image);

          if (Array.isArray(platforms)) {
            platforms.forEach((p) => formData.append("platforms[]", p));
          }

          res = await authFetch(`${BASE_URL}/compliance-checker`, {
            method: "POST",
            headers: {
              // No Content-Type — browser sets multipart boundary automatically
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        } else {
          // ── Canvas mode: JSON body ────────────────────────────────────────────
          const canvasString =
            typeof canvas === "string" ? canvas : JSON.stringify(canvas);

          res = await authFetch(`${BASE_URL}/compliance-checker`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              canvas: canvasString,
              platforms: platforms || [],
            }),
          });
        }

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return { ok: false, message: "Invalid server response" };
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || "Compliance check failed",
          };
        }

        return { ok: true, data };
      } catch (err) {
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const creativeScoring = useCallback(
    async ({ image, canvas }) => {
      if (!token) return { ok: false, message: "Not authenticated" };

      // Must provide one or the other
      if (!image && !canvas) {
        return {
          ok: false,
          message: "An image file or canvas data is required",
        };
      }

      try {
        let res;

        if (image) {
          // ── Image mode: multipart/form-data ──────────────────────────────────
          const formData = new FormData();
          formData.append("image", image);

          res = await authFetch(`${BASE_URL}/creative-scoring`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              // Do NOT set Content-Type — browser sets multipart boundary automatically
            },
            body: formData,
          });
        } else {
          // ── Canvas mode: JSON body ────────────────────────────────────────────
          // canvas may already be a string or an object — normalise to string
          const canvasString =
            typeof canvas === "string" ? canvas : JSON.stringify(canvas);

          res = await authFetch(`${BASE_URL}/creative-scoring`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ canvas: canvasString }),
          });
        }

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return { ok: false, message: "Invalid server response" };
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || "Creative scoring failed",
          };
        }

        return { ok: true, data };
      } catch (err) {
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const creativeInsights = useCallback(
    async ({ brand }) => {
      if (!token) return { ok: false, message: "Not authenticated" };
      if (!brand?.trim())
        return { ok: false, message: "Brand name is required" };

      try {
        const res = await authFetch(`${BASE_URL}/creative-insights`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ brand }),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return { ok: false, message: "Invalid server response" };
        }

        if (!res.ok)
          return {
            ok: false,
            message: data?.message || "Creative insights failed",
          };
        return { ok: true, data };
      } catch (err) {
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const saveIntegration = useCallback(
    async ({
      platform,
      access_token,
      refresh_token,
      code,
      brand_id,
      int_id,
      int_name,
    }) => {
      if (!token) return { ok: false, message: "Not authenticated" };

      // Explicit brand_id from caller wins over the closure value (avoids stale null)
      const resolvedBrandId = brand_id || activeBrandId;
      if (!resolvedBrandId)
        return {
          ok: false,
          message: "No active brand selected. Please select a brand first.",
        };

      try {
        const res = await authFetch(API_INTEGRATIONS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            brand_id: resolvedBrandId,
            platform,
            // The backend persists ONE token field: `int_token` (it's also the only token
            // returned on GET). X/TikTok rotate their refresh token and the *access* token is
            // ephemeral (re-derived on every publish), so for those we store the REFRESH token
            // in int_token — that's the value that must survive + sync cross-device. Every
            // other platform stores its (long-lived) access token as before.
            int_token:
              platform === "twitter" || platform === "tiktok"
                ? refresh_token || access_token || null
                : access_token || null,
            // Kept for forward-compat if the backend ever adds a dedicated column; the
            // authoritative field today is int_token (above).
            int_refresh_token: refresh_token || null,
            // code: code || null,
            int_id: int_id || null, // ← platform account ID e.g. Facebook User ID
            int_name: int_name,
          }),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
        console.log("saveIntegration response:", data);

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || "Failed to save integration",
          };
        }

        return { ok: true, data };
      } catch (err) {
        console.error("saveIntegration error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token, activeBrandId],
  );

  const disconnectIntegration = useCallback(
    async (id) => {
      if (!token) return { ok: false, message: "Not authenticated" };

      try {
        const res = await authFetch(`${API_INTEGRATIONS_URL}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || "Failed to disconnect integration",
          };
        }

        return { ok: true, data };
      } catch (err) {
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  // Update an existing integration (PUT `/integrations/{id}`). Used to persist the ROTATED
  // refresh token for X/TikTok after each publish/live-fetch — those rotate on every use, and
  // without writing the new one back the backend copy goes stale and a second device fails.
  // The backend stores ONE token field (`int_token`, also the only one returned on GET), so
  // the rotated refresh token is written there. Best-effort: a failed update must NOT break
  // the publish/fetch that triggered it (localStorage stays the device-local source of truth).
  const updateIntegration = useCallback(
    async (id, { access_token, refresh_token } = {}) => {
      if (!token) return { ok: false, message: "Not authenticated" };
      if (!id) return { ok: false, message: "Missing integration id" };

      const body = {};
      // The rotated refresh token (X/TikTok) is the authoritative value → write it to int_token.
      const tokenForIntToken = refresh_token ?? access_token;
      if (tokenForIntToken !== undefined) body.int_token = tokenForIntToken;
      if (refresh_token !== undefined) body.int_refresh_token = refresh_token; // forward-compat
      if (Object.keys(body).length === 0)
        return { ok: false, message: "Nothing to update" };

      try {
        const res = await authFetch(`${API_INTEGRATIONS_URL}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          return {
            ok: false,
            message: data?.message || "Failed to update integration",
          };
        }
        return { ok: true, data };
      } catch (err) {
        console.error("updateIntegration error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  const fetchIntegrations = useCallback(async () => {
    if (!token) return null;

    try {
      const res = await authFetch(API_INTEGRATIONS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return null;
      }
      // console.log("fetch: ", data);
      if (!res.ok) return null;

      // Normalize: expects array or { data: [...] }
      return Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : data;
    } catch (err) {
      console.error("fetchIntegrations error:", err);
      return null;
    }
  }, [token]);

  const runComparison = useCallback(
    async ({ mode, creativeA, creativeB, urlA, urlB }) => {
      if (!token) return { ok: false, message: "Not authenticated" };

      try {
        let body;
        let headers = {
          Authorization: `Bearer ${token}`,
        };

        if (mode === "creatives") {
          // Multipart: send both image files + labels
          const formData = new FormData();
          formData.append("mode", "creatives");
          formData.append("label_a", creativeA.label || "Creative A");
          formData.append("label_b", creativeB.label || "Creative B");

          // creativeA.file is a File object; creativeA.url is a remote URL string
          if (creativeA.file) {
            formData.append("image_a", creativeA.file);
          } else if (creativeA.url) {
            formData.append("image_url_a", creativeA.url);
          }

          if (creativeB.file) {
            formData.append("image_b", creativeB.file);
          } else if (creativeB.url) {
            formData.append("image_url_b", creativeB.url);
          }

          body = formData;
          // No Content-Type header — browser sets multipart boundary automatically
        } else {
          // JSON: send both URLs
          body = JSON.stringify({
            mode: "websites",
            url_a: urlA,
            url_b: urlB,
          });
          headers["Content-Type"] = "application/json";
        }

        const res = await authFetch(`${BASE_URL}/creative-comparison`, {
          method: "POST",
          headers,
          body,
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return { ok: false, message: "Invalid server response" };
        }

        if (!res.ok) {
          return { ok: false, message: data?.message || "Comparison failed" };
        }

        return { ok: true, data };
      } catch (err) {
        console.error("runComparison error:", err);
        return { ok: false, message: err.message || "Network error" };
      }
    },
    [token],
  );

  //   const fetchDesignTemplates = async ({
  //   type,
  //   category,
  //   type_size,
  // }) => {
  //   if (!token) {
  //     console.error("No auth token found. User may not be logged in.");
  //     return { ok: false, message: "Not authenticated" };
  //   }

  //   const url = `https://api.scraive.com/api/scraive-userend/canvas-templates/public-fetch`;

  //   const payload = {
  //     type, // e.g "image", "video"
  //     category, // e.g "meta square"
  //     type_size, // e.g "1080x1080"
  //   };

  //   console.log("🎨 Fetch Design Templates Payload:", payload);

  //   try {
  //     const res = await authFetch(url, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     const text = await res.text();

  //     let data;
  //     try {
  //       data = JSON.parse(text);
  //       console.log("🎨 Design Templates Response:", data);
  //     } catch {
  //       console.error("Invalid JSON from template endpoint:", text);
  //       return { ok: false, message: "Invalid server response" };
  //     }

  //     if (!res.ok) {
  //       const firstError = data?.errors
  //         ? Object.values(data.errors)[0]?.[0]
  //         : null;

  //       return {
  //         ok: false,
  //         message:
  //           firstError ||
  //           data?.message ||
  //           "Failed to fetch design templates",
  //       };
  //     }

  //     return {
  //       ok: true,
  //       data,
  //       templates:
  //         data?.templates ||
  //         data?.data ||
  //         [],
  //     };
  //   } catch (err) {
  //     console.error("fetchDesignTemplates failed:", err);

  //     return {
  //       ok: false,
  //       message: err.message || "Network error",
  //     };
  //   }
  // };

  const fetchDesignTemplates = useCallback(
    async ({ type, category, type_size, num_template = 3, design_type }) => {
      if (!token) {
        return { ok: false, message: "Not authenticated" };
      }

      const formattedCategory = category
        ? category.toLowerCase().replace(/\s+/g, "_")
        : "";

      const payload = {
        type,
        sub_category: formattedCategory,
        type_size,
        num_template,
        // Scraive design axis: "ads" | "social" | "designer". Passed only by the
        // scraive+redesign generation flows; omitted when the caller doesn't set it.
        ...(design_type ? { design_type } : {}),
      };

      console.log("🎨 fetchDesignTemplates payload:", payload);

      let response;
      try {
        response = await authFetch(
          `https://api.scraive.com/api/design-templates/public-fetch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      } catch (error) {
        const result = await classifyResult({ error });
        console.warn(
          `[${result.source}] fetchDesignTemplates:`,
          result.messageForDevs,
        );
        return result;
      }

      const result = await classifyResult({ response });
      if (!result.ok) {
        console.warn(
          `[${result.source}] fetchDesignTemplates:`,
          result.messageForDevs,
        );
        return result;
      }

      // Caller expects `data` to be the templates array directly
      const templates = Array.isArray(result.data?.designs)
        ? result.data.designs
        : Array.isArray(result.raw?.designs)
          ? result.raw.designs
          : [];
      console.log("🎨 PARSED TEMPLATES:", templates);
      return { ...result, data: templates };
    },
    [token],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBrand,
        brands,
        teams,
        teamsLoading,
        // brandId,
        setActiveBrand,
        switchingBrandId,
        fetchDesignTemplates,
        runComparison,
        checkCompliance,
        saveIntegration,
        creativeInsights,
        deleteDesignById,
        disconnectIntegration,
        updateIntegration,
        creativeScoring,
        getCompetitorInsights,
        fetchIntegrations,
        bulkDeleteDesigns,
        updateDesignById,
        toggleDesignFavorite,
        fetchDesigns,
        fetchDesignById,
        saveDesign,
        analyzeRival,
        activeBrandId,
        brandsLoading,
        generateCustomCreative,
        createDesign,
        creativeAiChat,
        fetchChatSessions,
        fetchChatSession,
        aiRedesign,
        updateBrandById,
        handleDelete,
        fetchAdsAccounts,
        connectAdsAccount,
        disconnectAdsAccount,
        deleteBrandById,
        getBrandInvite,
        acceptBrandInvite,
        sendUrl,
        fetchBrandById,
        createBrand,
        fetchSocialAccounts,
        disconnectSocialAccount,
        connectSocialAccount,
        token,
        createResell,
        deleteResell,
        fetchResells,
        login,
        register,
        updateProfile,
        handleDeleteTeam,
        fetchTeams,
        logout,
        inviteTeamMember,
        loading,
        fetchBrands,
        myImages,
        myImagesLoading,
        fetchMyImages,
        myGallery,
        myGalleryLoading,
        fetchGallery,
        fetchGalleryPage,
        uploadMedia,
        deleteImage,
        verifyEmail,
        sendVerificationCode,
        verifyResetCode,
        resetPassword,
        tutorialVideos,
        tutorialVideosLoading,
        tutorialVideosError,
        fetchTutorialVideos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
