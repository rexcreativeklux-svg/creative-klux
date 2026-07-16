// app/brand/create/page.jsx
"use client";

import { useState } from "react";
import ManualCreate from "./ManualCreate";
import ImportBrand from "../import/page";
import { useAuth } from "@/context/AuthContext";

export default function CreateBrand({ isEditing }) {
  // Refresh the brand list after a create so the new brand shows up immediately.
  const { fetchBrands } = useAuth();
  const [activeCreateTab, setActiveCreateTab] = useState(isEditing ? "manual" : "import");

  return (
  
    <div className="flex flex-col ">
      <h1 className="font-semibold overflow-hidden pb-2 text-xl">
        Create your brand
      </h1>

      <div className="flex overflow-hidden py-3   gap-6">
        <div className="flex flex-row gap-4">
          <div className="gap-1 flex flex-row">
            <button
              onClick={() => setActiveCreateTab("import")}
              className={`font-medium transition cursor-pointer text-sm duration-300 ${
                activeCreateTab === "import" ? "border-b text-[#155dfc] border-[#155dfc]" : "text-gray-900"
              }`}
            >
              <span className="pr-1">Smart Import</span>
            </button>
            <div>🌐</div>
          </div>
          <div className="gap-1 flex flex-row">
            <button
              onClick={() => setActiveCreateTab("manual")}
              className={`font-medium cursor-pointer text-sm transition duration-300 ${
                activeCreateTab === "manual" ? "border-b text-[#155dfc] border-[#155dfc]" : "text-gray-900"
              }`}
            >
              <span className="pr-1">Manual Creation</span>
            </button>
            <div>✏️</div>
          </div>
        </div>
      </div>
      <div>
        {activeCreateTab === "import" ? (
          <ImportBrand refreshBrands={fetchBrands} />
        ) : (
          <ManualCreate refreshBrands={fetchBrands} />
        )}
      </div>
    </div>
  );
}