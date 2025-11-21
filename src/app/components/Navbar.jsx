
"use client";

import {
  Trello,
  FolderKanban,
  BarChart3,
  BrainCircuit,
  Wand2,
  Settings,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

const CustomLogo = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200.39 112.97"
    className={props.className}
    {...props}
  >
    <g data-name="Layer 2">
      <g data-name="Layer 1">
        <path
          d="M199.54,103.9l-60.27-101a6,6,0,0,0-8.87-1.64L2.3,102.26A6,6,0,0,0,6,113H28.33a6,6,0,0,0,3.72-1.29l91.24-71.9a6,6,0,0,1,8.86,1.64L154,78.06a6,6,0,0,1-5.16,9.08H121.13a6,6,0,0,0-3.69,1.26L99.68,102.24A6,6,0,0,0,103.37,113h91A6,6,0,0,0,199.54,103.9Z"
          fill="currentColor"
        />
      </g>
    </g>
  </svg>
);

const Navbar = ({ togglePanel, activePanel }) => {
  const router = useRouter();

  const topNavItems = [
    { id: "brand", label: "BrandKit", icon: Trello },
    { id: "projects", label: "Creatives", icon: FolderKanban },
     { id: "ads", label: "Ads Content", icon: BarChart3 },
    { id: "social", label: "Social Content", icon: UserRound },
    { id: "analyze", label: "Analyze", icon: BarChart3 },
    { id: "predict", label: "Predict", icon: BrainCircuit },
    { id: "retouch", label: "Retouch", icon: Wand2 },
    { id: "profile", label: "Settings", icon: Settings },
  ];

  return (
    <div>
      <nav className="md:flex-col justify-between h-screen w-20 bg-white hidden md:flex border-r border-gray-100">
        {/* Logo */}
        <div>
          <div onClick={() => router.push("/")} className="px-5 py-5 border-gray-100">
            <CustomLogo className="w-9 h-9 cursor-pointer text-[#155dfc]" />
          </div>

          {/* Top nav */}
          <div className="flex flex-col gap-7 mt-6">
            {topNavItems.map(({ id, icon: Icon, label }) => (
              <div key={id} className="flex px-5 justify-center">
                <button
                  onClick={() => togglePanel(id)}
                  className={`flex justify-center flex-col hover:cursor-pointer p-2 rounded-xl hover:bg-[#e7eeff] ${activePanel === id
                    ? "bg-[#e7eeff] text-[#155dfc] border-[#155dfc]"
                    : "text-gray-600"
                    }`}
                >
                  <div className="flex justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex pt-1 text-xs font-semibold">{label}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 z-40 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center py-2 md:hidden">
        {topNavItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            className={`flex flex-col items-center text-xs font-semibold p-2 rounded-lg ${activePanel === id ? "text-[#155dfc]" : "text-gray-600"
              }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Navbar;