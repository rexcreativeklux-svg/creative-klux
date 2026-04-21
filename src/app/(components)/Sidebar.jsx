"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FolderKanban,
  BarChart3,
  BrainCircuit,
  Wand2,
  Settings,
  UserRound,
  HelpCircle,
  Power,
} from "lucide-react";
import { useRouter } from "next/navigation";
import LogoutModal from "./LogoutModal";
import { FaTrello } from "react-icons/fa";


const Sidebar = ({ togglePanel, activePanel }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

 const handleLogout = async () => {
    try {
      await logout(); // Clear session, cookies, etc.
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setShowLogoutModal(false);
    }
  };

  const mainNavItems = [
    { id: "brand",     label: "BrandKit",     icon: FaTrello },
    { id: "projects",  label: "Creatives",    icon: FolderKanban },
    { id: "ads",       label: "Ads Content",  icon: BarChart3 },
    { id: "social",    label: "Social Content", icon: UserRound },
    { id: "analyze",   label: "Analyze",      icon: BarChart3 },
    { id: "predict",   label: "Predict",      icon: BrainCircuit },
    { id: "retouch",   label: "Retouch",      icon: Wand2 },
  ];

  const bottomNavItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help",     label: "Help",      icon: HelpCircle },
  ];

  const mobileNavItems = [...mainNavItems, ...bottomNavItems];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:flex-col justify-between h-screen w-20 bg-white border-r border-gray-100">
        <div className="flex flex-col justify-center items-center">
          <div onClick={() => router.push("/")} className="pt-5 cursor-pointer">
             <img
              src="/logoblue.svg"
              alt="Logo"
              className="w-[40px]"   // adjust: w-24, w-40, w-48, etc.
              loading="lazy"
            />
          </div>

          <div className="flex flex-col gap-1 mt-9">
            {mainNavItems.map(({ id, icon: Icon, label }) => (
              <div key={id} className="flex justify-center">
                <button
                  onClick={() => togglePanel(id)}
                  className={`flex flex-col items-center cursor-pointer px-1 py-2 w-full transition-all duration-200 hover:bg-[#e7eeffd8] ${
                    activePanel === id ? "bg-[#e7eeffe9] text-[#155dfc]" : "text-gray-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium mt-1">{label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-0">
          <div className="mx-4 border-t border-gray-200" />

          {bottomNavItems.map(({ id, icon: Icon, label }) => (
            <div key={id} className="flex justify-center">
              <button
                onClick={() => togglePanel(id)}
                className={`flex flex-col cursor-pointer items-center py-2 w-full transition-all duration-200 hover:bg-[#e7eeff] ${
                  activePanel === id ? "bg-[#e7eeff] text-[#155dfc]" : "text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium mt-1">{label}</span>
              </button>
            </div>
          ))}

          {/* Logout Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex flex-col cursor-pointer items-center py-2 w-full transition-all duration-200 hover:bg-red-50 text-red-600 hover:text-red-700 group"
            >
              <Power className="h-5 w-5 group-hover:animate-pulse" />
              <span className="text-xs font-medium mt-1">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around items-center py-3 md:hidden">
        {mobileNavItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            className={`flex flex-col cursor-pointer items-center text-xs font-semibold p-2 rounded-lg ${
              activePanel === id ? "text-[#155dfc]" : "text-gray-600"
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="mt-1">{label}</span>
          </button>
        ))}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex flex-col items-center text-xs font-semibold p-2 rounded-lg text-red-600"
        >
          <Power className="h-6 w-6" />
          <span className="mt-1">Logout</span>
        </button>
      </nav>

    {/* Reusable Modal handles both steps + success message */}
     <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}  // Only closes modal
        onConfirm={handleLogout}                   // Only runs on success
      />
    </>
  );
};

export default Sidebar;