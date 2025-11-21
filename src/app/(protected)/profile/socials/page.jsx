"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

const socialPlatforms = [
  {
    key: "facebook",
    name: "Facebook",
    description: "Connect your Facebook account to share updates",
    logo: "/logos/facebook.png",
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Sync your Instagram for media sharing",
    logo: "/logos/instagram.png",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    description: "Post updates directly from the platform",
    logo: "/logos/linkedin.png",
  },
  {
    key: "tiktok",
    name: "TikTok",
    description: "Sync your TikTok for media sharing",
    logo: "/logos/tiktok.png",
  },
  {
    key: "youtube",
    name: "YouTube",
    description: "Post updates directly from the platform",
    logo: "/logos/youtube.png",
  },
  {
    key: "pinterest",
    name: "Pinterest",
    description: "Sync your Pinterest for media sharing",
    logo: "/logos/pinterest.png",
  },
  {
    key: "reddit",
    name: "Reddit",
    description: "Post updates directly from the platform",
    logo: "/logos/reddit.png",
  },
  {
    key: "x",
    name: "x",
    description: "Post updates directly from the platform",
    logo: "/logos/x.png",
  },
];

export default function SocialIntegrations({  }) {
  const { fetchSocialAccounts, token, brandId, user, handleDelete, connectSocialAccount } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  const generateMockCredentials = () => {
    const token = `tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const id = `id_${Math.random().toString(36).substr(2, 9)}`;
    return { token, id };
  };

  useEffect(() => {
    const loadAccounts = async () => {
      if (!token) return;
      const res = await fetchSocialAccounts(token);
      if (res?.success) {
        setConnectedAccounts(res.data);
      }
    };
    loadAccounts();
  }, [token, fetchSocialAccounts]);

  const isPlatformConnected = (platformKey) => {
    return connectedAccounts.some(
      (acc) => acc.platform?.toLowerCase() === platformKey.toLowerCase()
    );
  };

  const handleConnect = async (platformKey) => {
   if ( !token || !user) return;

    const { token: mockToken, id: mockId } = generateMockCredentials();

    const payload = {
      brand_id: brandId, 
      name: `${platformKey} Account`,
      platform: platformKey,
      token: mockToken,
      platform_id: mockId,
    };

    const response = await connectSocialAccount(payload);
    console.log(response)

    if (response?.success) {
      alert(`${platformKey} connected successfully!`);
      // Update state to immediately reflect connection
      setConnectedAccounts((prev) => [...prev, { ...payload }]);
    } else {
      alert(` Failed to connect ${platformKey}.`);
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
    } else {
      alert(`Failed to disconnect ${platformKey}.`);
    }
  };

  return (
    <div className="px-12 py-6 rounded-lg">
      <h1 className="text-xl font-semibold mb-6">Social Integrations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-5 gap-6">
        {socialPlatforms.map((platform, idx) => {
          const connected = isPlatformConnected(platform.key);

          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2 justify-between hover:border-[#155dfc] transition duration-300"
            >
              <div>
                <div className="flex flex-row gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center ">
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
              <div className="flex justify-between items-center">
                <Info className="w-7 h-7 text-gray-400 cursor-pointer" />
                <button
                  onClick={() =>
                    connected
                      ? handleDisconnect(platform.key)
                      : handleConnect(platform.key)
                  }
                  className={`${
                    connected ? "bg-red-500 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-700"
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
  );
}
