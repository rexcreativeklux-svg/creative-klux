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

const SocialIntegrationModal = ({ isOpen, onClose, onContinue, actionType }) => {
    const { fetchSocialAccounts, token, brandId, user, handleDelete, connectSocialAccount } = useAuth();
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
            const res = await fetchSocialAccounts(token);
            if (res?.success) {
                setConnectedAccounts(res.data);
            }
        };

        loadAccounts();

        // reset only once when modal opens
        setSelectedPlatform();
    }, [isOpen]);


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
            setSelectedPlatforms((prev) => prev.filter((p) => p !== platformKey));
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
        onContinue(selectedPlatform); // Pass single platform key
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white relative rounded-lg p-6 w-[90%] max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-xl font-semibold pb-1">Social Media Integrations</h1>
                        <p className="text-sm text-gray-500">Connect your social media accounts, then select the ones you want to share assets to.</p>
                    </div>

                    <button onClick={onClose} className="text-gray-500 absolute top-6 right-6 cursor-pointer hover:text-gray-700">
                        ✕
                    </button>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {socialPlatforms.map((platform, idx) => {
                        const connected = isPlatformConnected(platform.key);
                        const selected = selectedPlatform === platform.key

                        return (
                            <div
                                key={idx}
                                onClick={() => connected && toggleSelectPlatform(platform.key)}
                                className={`bg-white relative rounded-lg border p-4 flex flex-col gap-2 justify-between hover:border-[#155dfc] transition duration-300 cursor-pointer ${selected ? "border-blue-700" : "border-gray-200"
                                    }`}
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
                                <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                                    <Info className="w-7 h-7 text-gray-400 cursor-pointer" />
                                    <button
                                        onClick={() =>
                                            connected
                                                ? handleDisconnect(platform.key)
                                                : handleConnect(platform.key)
                                        }
                                        className={`${connected ? "bg-red-500 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-700"
                                            } text-white cursor-pointer transition duration-300 px-2 py-1.5 rounded-md text-sm uppercase`}
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

export default SocialIntegrationModal;