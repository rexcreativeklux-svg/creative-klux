"use client";

import NotificationModal from "@/app/(components)/NotificationModal";
import { useAuth } from "@/context/AuthContext";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";

const adPlatforms = [
  { key: "google", name: "Google Ads", description: "Manage and track your ad campaigns with Google", icon: "/logos/google.png" },
  { key: "meta", name: "Meta (Facebook Ads)", description: "Connect Meta Ads for targeted advertising", icon: "/logos/facebook.png" },
  { key: "linkedin", name: "LinkedIn Ads", description: "Run B2B ad campaigns with LinkedIn", icon: "/logos/linkedin.png" },
  { key: "tiktok", name: "TikTok Ads", description: "Reach new audiences on TikTok", icon: "/logos/tiktok.png" },
  { key: "bing", name: "Bing Ads", description: "Advertise with Microsoft Bing network", icon: "/logos/bing.png" },
];

export default function AdsIntegrations() {
  const { fetchAdsAccounts, token, brandId, user, handleDelete, connectAdsAccount } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  // Notification Modal State
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    duration: 3000,
  });

  const showNotification = (title, message, type = "info", duration = 3000) => {
    setNotification({ isOpen: true, title, message, type, duration });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const generateMockCredentials = () => {
    const token = `tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const id = `id_${Math.random().toString(36).substr(2, 9)}`;
    return { token, id };
  };

  useEffect(() => {
    const loadAccounts = async () => {
      if (!token) return;
      const res = await fetchAdsAccounts(token);
      if (res?.success) {
        setConnectedAccounts(res.data || []);
      }
    };
    loadAccounts();
  }, [token, fetchAdsAccounts]);

  const isPlatformConnected = (platformKey) => {
    return connectedAccounts.some(
      (acc) => acc.platform?.toLowerCase() === platformKey.toLowerCase()
    );
  };

  const handleConnect = async (platformKey) => {
    if (!token || !user) return;

    showNotification("Connecting...", `Connecting your ${platformKey} Ads account...`, "info", 0);

    const { token: mockToken, id: mockId } = generateMockCredentials();

    const payload = {
      brand_id: brandId,
      name: `${platformKey.charAt(0).toUpperCase() + platformKey.slice(1)} Ads Account`,
      platform: platformKey,
      token: mockToken,
      platform_id: mockId,
    };

    try {
      const response = await connectAdsAccount(payload);
      closeNotification();

      if (response?.success) {
        showNotification(
          "Connected!",
          `${platformKey.charAt(0).toUpperCase() + platformKey.slice(1)} Ads connected successfully!`,
          "success",
          500
        );
        setConnectedAccounts((prev) => [...prev, { ...payload, id: response.data?.id || Date.now() }]);
      } else {
        showNotification("Connection Failed", `Failed to connect ${platformKey} Ads. Please try again.`, "error");
      }
    } catch (err) {
      closeNotification();
      showNotification("Error", "Something went wrong. Please try again.", "error");
    }
  };

  const handleDisconnect = async (platformKey) => {
    if (!token) return;

    const accountToDisconnect = connectedAccounts.find(
      (acc) => acc.platform?.toLowerCase() === platformKey.toLowerCase()
    );

    if (!accountToDisconnect) return;

    showNotification("Disconnecting...", `Removing ${platformKey} Ads connection...`, "info", 0);

    try {
      const res = await handleDelete(accountToDisconnect.id);
      closeNotification();

      if (res?.success) {
        showNotification(
          "Disconnected!",
          `${platformKey.charAt(0).toUpperCase() + platformKey.slice(1)} Ads disconnected successfully.`,
          "success",
          200
        );
        setConnectedAccounts((prev) =>
          prev.filter((acc) => acc.id !== accountToDisconnect.id)
        );
      } else {
        showNotification("Disconnection Failed", `Could not disconnect ${platformKey} Ads.`, "error");
      }
    } catch (err) {
      closeNotification();
      showNotification("Error", "Something went wrong. Please try again.", "error");
    }
  };

  return (
    <>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
      />

      <div className="py-6 px-card sm:px-12 rounded-lg">
        <h1 className="text-xl font-semibold mb-6">Ads Integrations</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adPlatforms.map((platform, idx) => {
            const connected = isPlatformConnected(platform.key);

            return (
              <div
                key={idx}
                className="bg-surface rounded-lg border border-gray-200 p-4 flex flex-col justify-between gap-2 hover:border-[#155dfc] transition"
              >
                <div>
                  <div className="flex mb-3 gap-2 items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                      <img src={platform.icon} alt={platform.name} className="w-6 h-6 object-contain" />
                    </div>
                    <h2 className="text-lg mt-2">{platform.name}</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{platform.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <Info className="w-7 h-7 text-gray-400 cursor-pointer" />
                  <button
                    onClick={() =>
                      connected
                        ? handleDisconnect(platform.key)
                        : handleConnect(platform.key)
                    }
                    className={`${
                      connected
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white cursor-pointer transition duration-300 px-2 py-1.5 rounded-md text-sm uppercase`}
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}