"use client";

import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

const adPlatforms = [
  {
    key: "google",
    name: "Google Ads",
    description: "Manage and track your ad campaigns with Google",
    logo: "/logos/google.png",
  },
  {
    key: "meta",
    name: "Meta (Facebook Ads)",
    description: "Connect Meta Ads for targeted advertising",
    logo: "/logos/facebook.png",
  },
  {
    key: "linkedin",
    name: "LinkedIn Ads",
    description: "Run B2B ad campaigns with LinkedIn",
    logo: "/logos/linkedin.png",
  },
  {
    key: "tiktok",
    name: "TikTok Ads",
    description: "Reach new audiences on TikTok",
    logo: "/logos/tiktok.png",
  },
  {
    key: "bing",
    name: "Bing Ads",
    description: "Advertise with Microsoft Bing network",
    logo: "/logos/bing.png",
  },
];

const AdsIntegrationModal = ({ isOpen, onClose, actionType }) => {
  const { fetchAdsAccounts, token, brandId, user, handleDelete, connectAdsAccount } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const generateMockCredentials = () => {
    const token = `tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const id = `id_${Math.random().toString(36).substr(2, 9)}`;
    return { token, id };
  };

  useEffect(() => {
    if (!isOpen) return;

    const loadAccounts = async () => {
      if (!token) return;
      const res = await fetchAdsAccounts(token);
      if (res?.success) {
        setConnectedAccounts(res.data);
      }
    };

    loadAccounts();

    // reset only once when modal opens
    setSelectedPlatform(null);
  }, [isOpen, token, fetchAdsAccounts]);

  const isPlatformConnected = (platformKey) => {
    return connectedAccounts.some(
      (acc) => acc.platform?.toLowerCase() === platformKey.toLowerCase()
    );
  };

  const handleConnect = async (platformKey) => {
    if (!token || !user) return;

    const { token: mockToken, id: mockId } = generateMockCredentials();

    const payload = {
      brand_id: brandId,
      name: `${platformKey} Account`,
      platform: platformKey,
      token: mockToken,
      platform_id: mockId,
    };

    const response = await connectAdsAccount(payload);
    console.log(response);

    if (response?.success) {
      alert(`${platformKey} connected successfully!`);
      // Update state to immediately reflect connection
      setConnectedAccounts((prev) => [...prev, { ...payload }]);
    } else {
      alert(`Failed to connect ${platformKey}.`);
    }
  };

  const handleDisconnect = async (platformKey) => {
    if (!token) return;

    // Find the connected account for this platform
    const accountToDisconnect = connectedAccounts.find(
      (acc) => acc.platform.toLowerCase() === platformKey.toLowerCase()
    );

    if (!accountToDisconnect) return;

    const res = await handleDelete(accountToDisconnect.id); // call AuthContext handleDelete

    if (res?.success) {
      alert(`${platformKey} disconnected successfully!`);
      setConnectedAccounts((prev) =>
        prev.filter((acc) => acc.id !== accountToDisconnect.id)
      );
      setSelectedPlatform(null);
    } else {
      alert(`Failed to disconnect ${platformKey}.`);
    }
  };

  const toggleSelectPlatform = (platformKey) => {
    setSelectedPlatform(platformKey); // Set single platform
  };

  const handleModalContinue = () => {
    if (!selectedPlatform) {
      alert("Please select a platform.");
      return;
    }
    // Store details in localStorage similar to social modal handling
    localStorage.setItem('selectedPlatform', JSON.stringify(selectedPlatform));
    localStorage.setItem('actionType', actionType);
    // Assume assets or other details are already in localStorage from the wizard
    window.open('/AdsNow', '_blank');
    onClose(); // Close the modal after opening the new tab
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white relative rounded-lg p-6 w-[90%] max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-xl font-semibold pb-1">Ads Integrations</h1>
            <p className="text-sm text-gray-500">Connect your ad platforms, then select the one you want to run campaigns on.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 absolute top-6 right-6 cursor-pointer hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adPlatforms.map((platform, idx) => {
            const connected = isPlatformConnected(platform.key);
            const selected = selectedPlatform === platform.key;

            return (
              <div
                key={idx}
                onClick={() => connected && toggleSelectPlatform(platform.key)}
                className={`bg-white relative rounded-lg border p-4 flex flex-col gap-2 justify-between hover:border-[#155dfc] transition duration-300 cursor-pointer ${selected ? "border-blue-700" : "border-gray-200"}`}
              >
                <div>
                  <div className="flex flex-row gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <Image
                        src={platform.logo}
                        alt={platform.name}
                        width={32}
                        height={32}
                        className="object-contain rounded-full"
                      />
                    </div>
                    <h2 className="text-lg mt-0.5">{platform.name}</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {platform.description}
                  </p>
                </div>
                <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                  <Info className="w-7 h-7 text-gray-400 cursor-pointer" />
                  <button
                    onClick={() =>
                      connected
                        ? handleDisconnect(platform.key)
                        : handleConnect(platform.key)
                    }
                    className={`${connected ? "bg-red-500 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-700"} text-white cursor-pointer transition duration-300 px-2 py-1.5 rounded-md text-sm uppercase`}
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
                {connected && (
                  <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      name="platform"
                      checked={selected}
                      value={platform.key}
                      onChange={() => toggleSelectPlatform(platform.key)}
                      aria-label={`Select ${platform.name}`}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleModalContinue}
            disabled={!selectedPlatform}
            aria-label="Continue"
            className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdsIntegrationModal;