"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [brandId, setBrandId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [activeBrand, setActiveBrandState] = useState(null);

  // Load token on mount and fetch profile and brands
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log("Stored token:", storedToken);
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
      fetchBrands(storedToken);
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
    fetchProfile(token);
    fetchBrands(token);
  };

  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch("https://creatives.weviy.com/creatives-app/user/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const text = await res.text();
      console.log("Profile Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid profile response");
      }

      if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (err) {
      console.error("Profile fetch failed:", err.message);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch("https://creatives.weviy.com/creatives-app/user/login", {
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

  const register = async (name, email, password) => {
    const res = await fetch("https://creatives.weviy.com/creatives-app/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const text = await res.text();
    console.log("Register Raw Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON from server");
    }

    if (!res.ok || !data.token) {
      throw new Error(data.message || "Registration failed");
    }

    saveAuth(data.token);
    return data.message || "Registration successful";
  };

  const logout = async () => {
    try {
      if (token) {
        const res = await fetch("https://creatives.weviy.com/creatives-app/user/logout", {
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
      setBrandId(null);
      setBrandsLoading(false);
    }
  };

  const inviteTeamMember = async (email) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return;
    }

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-app/teams/create", {
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

      return data;
    } catch (err) {
      console.error("Invite failed:", err.message);
      throw err;
    }
  };

  const fetchTeams = async () => {
    console.log("fetchTeams called");

    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-app/teams", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      console.log("Teams Raw Response:", text);

      return text;
    } catch (err) {
      console.error("Fetching teams failed:", err.message);
      return null;
    }
  };

  const fetchResells = async () => {
    console.log("fetchResells called");

    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-app/resells", {
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

  const handleDeleteTeam = async (id) => {
    if (!token || !id) {
      console.error("No auth token or team ID provided.");
      throw new Error("Authentication or team ID missing.");
    }

    try {
      const res = await fetch(
        `https://creatives.weviy.com/creatives-app/teams/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

      return { success: true, message: "Team deleted successfully" };
    } catch (err) {
      console.error("Error deleting team:", err.message);
      throw err;
    }
  };

  const createResell = async (email) => {
    if (!token) {
      console.error("No auth token found. User may not be logged in.");
      return null;
    }

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-app/resells/create", {
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

    try {
      const response = await fetch(`https://creatives.weviy.com/creatives-app/resells/delete/${id}`, {
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
      const res = await fetch("https://creatives.weviy.com/creatives-app/brands/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      const text = await res.text();
      console.log("import Raw Response:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON response:", text);
        return null;
      }

      if (!res.ok) {
        console.error("Import failed:", data?.message || "Unknown error");
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error sending URL:", err.message);
      return null;
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
      formData.append("source_url", brandData.sourceUrl || "");
      formData.append("industry", brandData.industry || "");
      formData.append("landing_page_flag", brandData.createLandingPage ? "1" : "0");

     

      if (brandData.landingPage) {
        formData.append("landing_page_id", brandData.landingPage.id || "");
        formData.append("landing_page_token", brandData.landingPage.token || "");
        formData.append("landing_page_name", brandData.landingPage.name || "");
        formData.append("landing_page_url", brandData.landingPage.url || "");
      }

       console.log(brandData)
      const res = await fetch("https://creatives.weviy.com/creatives-app/brands/create", {
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

  const fetchBrands = async (authToken = token) => {
    if (!authToken) {
      console.error("No auth token found. User may not be logged in.");
      setBrands([]);
      setBrandsLoading(false);
      return [];
    }

    try {
      setBrandsLoading(true);
      const res = await fetch("https://creatives.weviy.com/creatives-app/brands", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();
      console.log("Fetch Brands Raw Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from brands endpoint");
        setBrands([]);
        return [];
      }

      if (!res.ok) {
        console.error("Failed to fetch brands:", data.message || `HTTP ${res.status}`);
        setBrands([]);
        return [];
      }

      const brands = Array.isArray(data.data) ? data.data : [];
      console.log("Fetched brands:", brands);
      setBrands(brands);

      // Set activeBrand based on stored brandId, if valid
      const storedBrandId = localStorage.getItem("activeBrandId");
      if (storedBrandId) {
        const selectedBrand = brands.find((brand) => brand.id === Number(storedBrandId));
        if (selectedBrand) {
          console.log("Setting active brand from stored ID:", selectedBrand);
          setActiveBrandState(selectedBrand);
          setBrandId(storedBrandId);
        } else {
          console.log("Stored brand ID not found in brands, clearing:", storedBrandId);
          setActiveBrandState(null);
          setBrandId(null);
          localStorage.removeItem("activeBrandId");
        }
      }

      return brands;
    } catch (err) {
      console.error("Fetching brands failed:", err.message);
      setBrands([]);
      return [];
    } finally {
      setBrandsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBrands();
    } else {
      setBrands([]);
      setBrandsLoading(false);
    }
  }, [token]);

  const setActiveBrand = (brandOrId) => {
    console.log("setActiveBrand called with:", brandOrId);
    if (brandOrId === null) {
      setActiveBrandState(null);
      setBrandId(null);
      localStorage.removeItem("activeBrandId");
      return;
    }

    let id;
    let selectedBrand;

    if (typeof brandOrId === "object" && brandOrId !== null) {
      id = brandOrId.id;
      selectedBrand = brandOrId;
    } else {
      id = Number(brandOrId);
      selectedBrand = brands.find((brand) => brand.id === id);
    }

    if (selectedBrand) {
      console.log("Setting active brand:", selectedBrand);
      setActiveBrandState(selectedBrand);
      setBrandId(id);
      localStorage.setItem("activeBrandId", id);
    } else {
      console.error("Invalid brand ID, not found in brands:", id);
      setActiveBrandState(null);
      setBrandId(null);
      localStorage.removeItem("activeBrandId");
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

    try {
      const res = await fetch(`https://creatives.weviy.com/creatives-app/brands/${id}`, {
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
      formData.append("name", brandData.name);
      formData.append("description", brandData.description);
      formData.append("tagline", brandData.tagline);
      formData.append("fonts", brandData.fonts);
      formData.append("logo", brandData.logo);
      formData.append("primary_color", brandData.primary_color);
      formData.append("secondary_color", brandData.secondary_color);
      formData.append("_method", "PUT");

      const res = await fetch(
        `https://creatives.weviy.com/creatives-app/brands/edit/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error(`Failed to update brand: ${res.status}`);

      const updateResult = await res.json();
      console.log(updateResult);
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

    try {
      const res = await fetch(`https://creatives.weviy.com/creatives-app/brands/delete/${id}`, {
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

      const res = await fetch(
        "https://creatives.weviy.com/creatives-app/social-accounts/connect",
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
      const res = await fetch(
        `https://creatives.weviy.com/creatives-app/social-accounts/disconnect`,
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
      const res = await fetch(
        "https://creatives.weviy.com/creatives-app/social-accounts",
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
      const res = await fetch(
        "https://creatives.weviy.com/creatives-app/ad-accounts",
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

      const res = await fetch(
        "https://creatives.weviy.com/creatives-app/ad-accounts/connect",
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

    try {
      const res = await fetch(
        `https://creatives.weviy.com/creatives-app/social-accounts/${platform.toLowerCase()}`,
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

    try {
      const res = await fetch(
        `https://creatives.weviy.com/creatives-app/ad-accounts/${platform.toLowerCase()}`,
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

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBrand,
        brands,
        brandId,
        setActiveBrand,
        brandsLoading,
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
        fetchBrands
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
