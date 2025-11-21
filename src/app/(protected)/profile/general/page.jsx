"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfileContent() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);
  const [preview, setPreview] = useState(null);

  // Handle file upload preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit handler
  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    if (profilePic) {
      formData.append("profile_picture", profilePic);
    }

    try {
      const res = await fetch("https://creatives.weviy.com/creatives-app/user/edit/" + user.id, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Update failed");
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 px-12">
      <div>
        <h1 className="font-semibold pb-7 text-xl">Profile</h1>
      </div>

      <div className="flex flex-col items-center py-6 space-x-4">
        <div className="w-24 h-24 ml-4 flex justify-center items-center rounded-full overflow-hidden border border-gray-400">
          {preview || user?.profilePic ? (
            <img
              src={preview || user.profilePic}
              alt="Profile"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex flex-row items-center justify-center w-full h-full bg-gray-50 text-gray-500">
              No Image
            </div>
          )}
        </div>
        <div className="flex items-center mt-2 justify-center">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-white hover:bg-gray-100 text-black text-sm border border-gray-300 px-3 py-1 rounded transition"
          >
            Upload Image
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>


      </div>

      <div>
        <label className="block font-semibold py-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded px-3 py-2"
        />
      </div>

      <div className="py-3">
        <label className="block py-2 font-semibold">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full border border-gray-200 rounded px-3 py-2 "
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-[#155dfc] hover:bg-blue-800 cursor-pointer transition duration-300 text-white rounded"
      >
        Save Changes
      </button>
    </form>
  );
}
