"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState([]);
  // const [brandId, setBrandId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [activeBrand, setActiveBrandState] = useState(null);

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [myImages, setMyImages] = useState([]);
  const [myImagesLoading, setMyImagesLoading] = useState(false);

  const [tutorialVideos, setTutorialVideos] = useState([]);
  const [tutorialVideosLoading, setTutorialVideosLoading] = useState(false);
  const [tutorialVideosError, setTutorialVideosError] = useState(null);
  const activeBrandId = activeBrand?.id || null;
  const [brandsInitialized, setBrandsInitialized] = useState(false);


  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      console.warn("401 detected globally → logging out");

      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("activeBrandId");

      throw new Error("Unauthorized");
    }

    return res;
  }, [token]);


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
  const API_IMAGE_GALLERY_URL = `${BASE_URL}/image-gallery`;
  const API_FETCH_TUTORIAL_VIDEOS = `${BASE_URL}/tutorial-videos`;
  const API_AI_CHAT_URL = `${BASE_URL}/creatives/ai-creative`;
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

    } catch (err) {
      console.error("Profile fetch failed:", err.message);

      // ❌ DO NOT LOG OUT HERE
      // Just keep existing session
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });



    const text = await res.text();
    console.log("Login Raw Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid Details");
    }

    if (!res.ok || !data.token) {
      throw new Error(data.message || "Login failed");
    }

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

    console.log("Sending to backend:", payload);

    const res = await fetch(API_REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Register Raw Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid response from server");
    }

    if (!res.ok) {
      // Handle validation errors from backend
      if (data.errors) {
        const errorMessages = Object.values(data.errors)
          .flat()
          .join(", ");
        throw new Error(errorMessages || data.message || "Registration failed");
      }
      throw new Error(data.message || "Registration failed");
    }

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

    const userId = sessionStorage.getItem("pendingUserId");
    const email = sessionStorage.getItem("pendingEmail");

    if (!userId) {
      throw new Error("Session expired. Please register again.");
    }

    try {
      const payload = {
        user_id: userId,  // This is what the backend requires
        code: code,
      };

      console.log("Verifying with payload:", payload);

      const res = await fetch(`${BASE_URL}/update-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Verify response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired code");
      }

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

      return {
        success: true,
        message: data.message || "Email verified successfully!",
      };
    } catch (err) {
      throw new Error(err.message || "Verification failed");
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      const res = await fetch(`${BASE_URL}/resend-verification-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), // Just send email to resend code
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend code");
      }

      return {
        success: true,
        message: data.message || "Code resent to your email",
      };
    } catch (err) {
      throw new Error(err.message || "Resend failed");
    }
  };

  const logout = async () => {
    try {
      if (token) {
        const res = await authFetch(API_LOGOUT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        console.log("Logout Raw Response:", text);

        if (!res.ok) {
          throw new Error("Logout API call failed");
        }
      }
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("activeBrandId");
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
        console.error("Failed to fetch resells:", data.message || "Unknown error");
        return null;
      }

      return data.resells || data;
    } catch (err) {
      console.error("Fetching resells failed:", err.message);
      return null;
    }
  };

  const handleDeleteTeam = useCallback(async (id) => {
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

      return { success: true, message: data.message || "Team member removed successfully" };
    } catch (err) {
      console.error("Error deleting team:", err.message);
      throw err;
    }
  }, [token]);

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

    try {
      const res = await authFetch(API_SEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON response:", text);
        return { ok: false, message: "Invalid server response" };
      }

      if (!res.ok) {
        // Extract first validation error if present, else fallback to message
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        return { ok: false, message: firstError || data?.message || "Import failed" };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || "Network error" };
    }
  };

  const createBrand = async (brandData) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("name", brandData.name || "");
      formData.append("description", brandData.description || "");
      formData.append("tagline", brandData.tagline || "");
      formData.append("fonts", brandData.fonts || "");
      if (brandData.logo) {
        formData.append("logo", brandData.logo);
      }
      formData.append("primary_color", brandData.colors?.primary || "#1e3a8a");
      formData.append("secondary_color", brandData.colors?.secondary || "#10b981");
      formData.append("social_accounts", JSON.stringify(brandData.socialAccounts || []));
      formData.append("ad_accounts", JSON.stringify(brandData.adAccounts || []));
      formData.append("url", brandData.url || "");
      formData.append("source_url", brandData.sourceUrl || "");
      formData.append("industry", brandData.industry || "");
      formData.append("landing_page_flag", brandData.createLandingPage ? "1" : "0");



      if (brandData.landingPage) {
        formData.append("landing_page_id", brandData.landingPage.id || "");
        formData.append("landing_page_token", brandData.landingPage.token || "");
        formData.append("landing_page_name", brandData.landingPage.name || "");
        formData.append("landing_page_url", brandData.landingPage.url || "");
      }

      console.log("brandData:", brandData)
      const res = await authFetch(API_CREATE_BRAND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await res.text();
      console.log("Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from create brand endpoint");
        throw new Error("Unexpected server response");
      }
      console.log("Response :", data);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create brand");
      }

      // Refresh brands after creation
      await fetchBrands();
      return data;
    } catch (err) {
      // console.error("Error message:", err.message);
      throw err;
    }
  };

  const createManualBrand = async (brandData) => {
    if (!token) {
      console.error("No auth token found.");
      throw new Error("You must be logged in to create a brand");
    }

    try {
      const formData = new FormData();

      // Required fields
      formData.append("name", (brandData.name || "").trim());
      formData.append("description", brandData.description || "");
      formData.append("tagline", brandData.tagline || "");
      formData.append("fonts", brandData.fonts || "");
      formData.append("industry", brandData.industry || "Other");

      // Colors – always sent as separate fields
      formData.append("primary_color", brandData.colors?.primary || "#1e3a8a");
      formData.append("secondary_color", brandData.colors?.secondary || "#10b981");

      // Arrays as JSON strings
      formData.append("social_accounts", JSON.stringify(brandData.socialAccounts || []));
      formData.append("ad_accounts", JSON.stringify(brandData.adAccounts || []));

      // Source URL
      formData.append("source_url", brandData.sourceUrl || "");

      // Always send landing_page_flag = 0 for manual creation
      formData.append("landing_page_flag", "0");

      // Logo – only if it's a real File
      if (brandData.logo && brandData.logo instanceof File) {
        formData.append("logo", brandData.logo);
      }

      // Debug log (remove later if you want)
      console.log("Manual Brand Payload:", {
        name: brandData.name,
        industry: brandData.industry,
        hasLogo: !!brandData.logo,
        landing_page_flag: "0"
      });

      const res = await authFetch(API_CREATE_BRAND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type – let browser set multipart boundary
        },
        body: formData,
      });

      const text = await res.text();
      console.log("Manual Create Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned invalid response");
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create brand");
      }

      // Success – refresh brands
      await fetchBrands();
      return data; // usually { data: { id, ... }, message, success }

    } catch (err) {
      console.error("Manual brand creation failed:", err);
      throw err;
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
        setBrands([]);
        setActiveBrandState(null);
        return [];
      }

      if (!res.ok) {
        console.error("Failed to fetch brands:", data.message || `HTTP ${res.status}`);
        setBrands([]);
        setActiveBrandState(null);
        return [];
      }

      const brandsList = Array.isArray(data.data) ? data.data : [];
      setBrands(brandsList);

      // 🔑 ACTIVE BRAND LOGIC (FIXED)
      const storedBrandId = localStorage.getItem("activeBrandId");

      let selectedBrand = null;

      if (storedBrandId) {
        const selectedBrand = brandsList.find(
          (brand) => brand.id === Number(storedBrandId)
        );
        if (selectedBrand) {
          setActiveBrandState(selectedBrand); // ✅ actually restore it
        } else {
          // Stored ID no longer exists (brand was deleted), clear it
          localStorage.removeItem("activeBrandId");
          setActiveBrandState(null);
        }
      } else {
        setActiveBrandState(null);
      }

      const hasStoredBrand = !!storedBrandId;

      if (!hasStoredBrand && brandsList.length > 0) {
        setActiveBrandState(null);
      }


      return brandsList;
    } catch (err) {
      console.error("Fetching brands failed:", err.message);
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

      // if (brands?.length > 0) {
      //   const storedBrandId = localStorage.getItem("activeBrandId");

      //   if (storedBrandId) {
      //     const selected = brands.find(b => b.id === Number(storedBrandId));
      //     if (selected) {
      //       setActiveBrandState(selected);
      //     }
      //   }
      // }

      await Promise.all([
        fetchTeams(),
        fetchMyImages(),
        fetchTutorialVideos(),
      ]);
    };

    init();
  }, [token]);


  const setActiveBrand = (brandOrId) => {
    if (brandOrId === null) {
      setActiveBrandState(null);
      localStorage.removeItem("activeBrandId");
      return;
    }

    let selectedBrand;

    if (typeof brandOrId === "object") {
      selectedBrand = brandOrId;
    } else {
      const id = Number(brandOrId);
      selectedBrand = brands.find((b) => b.id === id);
    }

    if (!selectedBrand) return;

    setActiveBrandState(selectedBrand);
    localStorage.setItem("activeBrandId", selectedBrand.id);
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
        console.error("Failed to fetch brand:", data?.message || "Unknown error");
        return null;
      }

      const brand = data?.data || data;
      return {
        name: brand.name || "",
        tagline: brand.tagline || "",
        description: brand.description || "",
        font: brand.font || "",
        logoDataUrl: brand.logoDataUrl || null,
        colors: [
          brand.colors?.[0] || "#1e3a8a",
          brand.colors?.[1] || "#10b981",
        ],
      };
    } catch (err) {
      console.error("Fetching brand by ID failed:", err.message);
      return null;
    }
  };

  const updateBrandById = async (id, brandData) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("name", brandData.name || "");
      formData.append("description", brandData.description || "");
      formData.append("tagline", brandData.tagline || "");
      formData.append("fonts", brandData.fonts || "");

      // Only append logo if it's a new file (not null and is a File object)
      if (brandData.logo && brandData.logo instanceof File) {
        formData.append("logo", brandData.logo);
      }

      formData.append("primary_color", brandData.primary_color);
      formData.append("secondary_color", brandData.secondary_color);
      formData.append("_method", "PUT"); // This tells Laravel to treat it as PUT

      const url = `${BASE_URL}/brands/${id}`;

      const res = await authFetch(url, {
        method: "POST", // ← CHANGED FROM "PUT" TO "POST"
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type — browser sets it automatically with boundary for FormData
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update brand: ${res.status} - ${errorText}`);
      }

      const updateResult = await res.json();
      console.log("Brand updated successfully:", updateResult);
      return updateResult;
    } catch (err) {
      console.error("Error updating brand:", err);
      return null;
    }
  };

  const deleteBrandById = async (id) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    const url = `${BASE_URL}/brands/${id}`;

    try {
      const res = await authFetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete brand: ${res.status}`);
      }

      const data = await res.json();
      // Refresh brands after deletion
      await fetchBrands();
      return data;
    } catch (err) {
      console.error("Error deleting brand:", err);
      return null;
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

      const res = await authFetch(
        API_CONNECT_SOCIAL_ACCOUNT_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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
      const res = await authFetch(
        API_DELETE_SOCIAL_ACCOUNT_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: socialId }),
        }
      );

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
      const res = await authFetch(
        API_FETCH_SOCIAL_ACCOUNTS_URL,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept": "application/json",
          },
        }
      );

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
      const res = await authFetch(
        API_FETCH_AD_ACCOUNTS_URL,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept": "application/json",
          },
        }
      );

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

      const res = await authFetch(
        API_CONNECT_AD_ACCOUNTS_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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
      const res = await authFetch(
        url,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to disconnect account");

      setSocialAccounts((prev) =>
        prev.filter((acc) => acc.platform !== platform.toLowerCase())
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
      const res = await authFetch(
        url,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to disconnect account");

      setSocialAccounts((prev) =>
        prev.filter((acc) => acc.platform !== platform.toLowerCase())
      );

      return true;
    } catch (err) {
      console.error("Error disconnecting account:", err);
      throw err;
    }
  };

  const fetchMyImages = useCallback(async () => {
    if (!token) {
      setMyImages([]);
      setMyImagesLoading(false);
      return;
    }

    setMyImagesLoading(true);

    try {
      const res = await authFetch(API_IMAGE_GALLERY_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json(); // ← Now parsing JSON

      // console.log("Fetched images:", data);

      // Extract the array from "images" key
      const images = data.images || [];

      // Transform to format your gallery expects
      setMyImages(
        images.map(img => ({
          id: img.id,
          src: img.image_url,        // ← This is the correct URL field
          alt: img.image_name,
          filename: img.image_name,
        }))
      );

    } catch (err) {
      console.error("Failed to fetch images:", err);
      setMyImages([]);
    } finally {
      setMyImagesLoading(false);
    }
  }, [token]);

  const uploadImage = useCallback(async (file) => {
    if (!token) throw new Error("Not authenticated");
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("image", file);

    // DEBUG: Log what we're actually sending
    console.log("Uploading file:", file.name, file.size, file.type);
    for (let pair of formData.entries()) {
      console.log("FormData contains:", pair[0], pair[1]);
    }

    try {
      const res = await authFetch(API_IMAGE_GALLERY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await res.text();
      console.log("Raw server response:", text);
      console.log("Response status:", res.status);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned non-JSON: " + text);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }

      await fetchMyImages();
      return data;

    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  }, [token, fetchMyImages]);

  const deleteImage = useCallback(async (imageId) => {
    if (!token) throw new Error("Not authenticated");
    if (!imageId) throw new Error("Image ID is required");

    try {
      const res = await authFetch(`${BASE_URL}/image-gallery/${imageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Try to parse JSON error even if failed
      let errorMessage = "Failed to delete image";
      if (!res.ok) {
        try {
          const errData = await res.json();
          errorMessage = errData.message || errorMessage;
        } catch { }
        throw new Error(errorMessage);
      }

      // Success — remove from UI immediately
      setMyImages((prev) => prev.filter((img) => img.id !== imageId));

      return { success: true, message: "Image deleted successfully" };

    } catch (err) {
      console.error("Delete failed:", err);
      throw err; // Let UI handle showing error
    }
  }, [token]);

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

  const generateCustomCreative = async ({ creativeType, categoryType, ...formPayload }) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return { ok: false, message: "Not authenticated" };
    }

    const url = `${BASE_URL}/creatives/custom-creative`;

    // Strip "_creative" suffix: "ads_creative" → "ads", "magic_studio" → "magic_studio"
    const creativeTypeShort = creativeType?.replace("_creative", "") || creativeType;

    const generation_data = {
      creative_type: creativeTypeShort,  // "ads", "social", "designer", "magic_studio"
      create_sub_type: categoryType,
      ...formPayload,
    };

    console.log("🚀 Generate Payload:", generation_data);

    try {
      const res = await authFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          generation_data: JSON.stringify(generation_data),
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
        console.log(data)
      } catch {
        console.error("Invalid JSON from generation endpoint:", text);
        return { ok: false, message: "Invalid server response" };
      }

      if (!res.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        return { ok: false, message: firstError || data?.message || "Generation failed" };
      }

      return { ok: true, data };
    } catch (err) {
      console.error("Generation request failed:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  };

  const creativeAiChat = async ({ message, creativeType, history = [] }) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return { ok: false, message: "Not authenticated" };
    }

    try {
      const res = await authFetch(API_AI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          creative_type: creativeType,
          history, // array of { role: "user"|"assistant", content: string }
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
        console.log(data)
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

  const saveDesign = useCallback(async (brandId, variations, creativeType = "ads") => {
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

    const payload = {
      brand_id: brandId,
      creativedesigns: variations.map((v) => ({
        name: v.name || "Untitled Design",
        score: v.copy?.performance_score
          ? parseInt(v.copy.performance_score.split("/")[0], 10) || 0
          : 0,
        copy: JSON.stringify(v.copy || {}),
        canvas: { canvas: v.canvas, elements: v.elements },
        type: typeShort,
        sub_type: v.category?.toLowerCase() || "image",
      })),
    };

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
        console.log(data)
      } catch {
        console.error("saveDesign: invalid JSON response", text);
        return { ok: false, message: "Invalid server response" };
      }

      if (!res.ok) {
        const firstError =
          data?.errors
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
  }, [token]);

  const fetchDesigns = useCallback(async (perPage = 9) => {
    if (!token) {
      console.error("fetchDesigns: no auth token.");
      return null;
    }

    if (!activeBrandId) {
      console.error("fetchDesigns: no activeBrandId.");
      return null;
    }

    const url = `${FETCH_DESIGN_URL}?brand_id=${activeBrandId}&per_page=${perPage}`;

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
        console.error("fetchDesigns failed:", data?.message || `HTTP ${res.status}`);
        return null;
      }

      // console.log("fetchDesigns success:", data);

      return Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : data;

    } catch (err) {
      console.error("fetchDesigns error:", err);
      return null;
    }
  }, [token, activeBrandId]);

  const deleteDesignById = useCallback(async (id) => {
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
      try { data = JSON.parse(text); } catch { data = {}; }

      if (!res.ok) {
        return { ok: false, message: data?.message || `Delete failed (${res.status})` };
      }

      return { ok: true, message: data?.message || "Design deleted" };
    } catch (err) {
      console.error("deleteDesignById error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

  const bulkDeleteDesigns = useCallback(async (ids) => {
    if (!token) return { ok: false, message: "Not authenticated" };
    if (!Array.isArray(ids) || ids.length === 0) return { ok: false, message: "No IDs provided" };

    try {
      const res = await authFetch(`${BASE_URL}/creative-designs/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (!res.ok) {
        return { ok: false, message: data?.message || `Bulk delete failed (${res.status})` };
      }

      return { ok: true, message: data?.message || `${ids.length} design(s) deleted` };
    } catch (err) {
      console.error("bulkDeleteDesigns error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

  const updateDesignById = useCallback(async (id, updates) => {
    if (!token) return { ok: false, message: "Not authenticated" };
    if (!id) return { ok: false, message: "No design ID provided" };

    // `updates` can include any subset of: { name, score, copy, canvas, type, sub_type }
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
      try { data = JSON.parse(text); } catch { data = {}; }

      if (!res.ok) {
        return { ok: false, message: data?.message || `Update failed (${res.status})` };
      }

      console.log("updateDesignById success:", data);
      return { ok: true, data };
    } catch (err) {
      console.error("updateDesignById error:", err);
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

  const analyzeRival = useCallback(async ({ url, period = "last_30_days" }) => {
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
        console.error("analyzeRival failed:", data?.message || `HTTP ${res.status}`);
        return null;
      }

      console.log("analyzeRival success:", data);

      return data;
    } catch (err) {
      console.error("analyzeRival error:", err);
      return null;
    }
  }, [token]);

  const getCompetitorInsights = useCallback(async ({ url }) => {
    if (!token) {
      console.error("getCompetitorInsights: no auth token.");
      return { ok: false, message: "Not authenticated" };
    }

    if (!url) {
      console.error("getCompetitorInsights: url is required.");
      return { ok: false, message: "URL is required" };
    }

    try {
      const normalizedUrl = url
        .replace(/^https?:\/\//, "")
        .split("/")[0];

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
  }, [token]);

  const checkCompliance = useCallback(async ({ image, canvas, platforms }) => {
    if (!token) return { ok: false, message: "Not authenticated" };

    if (!image && !canvas) {
      return { ok: false, message: "An image file or canvas data is required" };
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
      try { data = JSON.parse(text); } catch {
        return { ok: false, message: "Invalid server response" };
      }

      if (!res.ok) {
        return { ok: false, message: data?.message || "Compliance check failed" };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

  const creativeScoring = useCallback(async ({ image, canvas }) => {
    if (!token) return { ok: false, message: "Not authenticated" };

    // Must provide one or the other
    if (!image && !canvas) {
      return { ok: false, message: "An image file or canvas data is required" };
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
        return { ok: false, message: data?.message || "Creative scoring failed" };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

  const creativeInsights = useCallback(async ({ brand }) => {
    if (!token) return { ok: false, message: "Not authenticated" };
    if (!brand?.trim()) return { ok: false, message: "Brand name is required" };

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
      try { data = JSON.parse(text); } catch {
        return { ok: false, message: "Invalid server response" };
      }

      if (!res.ok) return { ok: false, message: data?.message || "Creative insights failed" };
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

  const saveIntegration = useCallback(async ({ platform, access_token, code }) => {
    if (!token) return { ok: false, message: "Not authenticated" };
    if (!activeBrandId) return { ok: false, message: "No active brand selected" };

    try {
      const res = await authFetch(API_INTEGRATIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand_id: activeBrandId,
          platform,
          access_token: access_token || null,
          code: code || null,
        }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }
console.log(data)
      if (!res.ok) {
        return { ok: false, message: data?.message || "Failed to save integration" };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token, activeBrandId]);

  const disconnectIntegration = useCallback(async (platform) => {
    if (!token) return { ok: false, message: "Not authenticated" };

    try {
      const res = await authFetch(`${API_INTEGRATIONS_URL}/${platform}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (!res.ok) {
        return { ok: false, message: data?.message || "Failed to disconnect integration" };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || "Network error" };
    }
  }, [token]);

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
      try { data = JSON.parse(text); } catch { return null; }
console.log(data)
      if (!res.ok) return null;

      // Normalize: expects array or { data: [...] }
      return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : data;
    } catch (err) {
      console.error("fetchIntegrations error:", err);
      return null;
    }
  }, [token]);

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
        checkCompliance,
        saveIntegration,
        creativeInsights,
        deleteDesignById,
        disconnectIntegration,
        creativeScoring,
        getCompetitorInsights,
        fetchIntegrations,
        bulkDeleteDesigns,
        updateDesignById,
        fetchDesigns,
        saveDesign,
        analyzeRival,
        activeBrandId,
        brandsLoading,
        generateCustomCreative,
        creativeAiChat,
        updateBrandById,
        handleDelete,
        fetchAdsAccounts,
        connectAdsAccount,
        disconnectAdsAccount,
        deleteBrandById,
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
        handleDeleteTeam,
        fetchTeams,
        logout,
        inviteTeamMember,
        loading,
        fetchBrands,
        myImages,
        myImagesLoading,
        fetchMyImages,
        uploadImage,
        deleteImage,
        verifyEmail,
        resendVerificationCode,
        createManualBrand,
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
