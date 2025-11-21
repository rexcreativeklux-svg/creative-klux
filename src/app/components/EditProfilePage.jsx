"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    // add more fields if supported by API
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const message = await updateProfile(user.id, formData);
      setSuccess(message);
      // Delay redirect to allow success message to be seen
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (!user) return <p>Please log in first</p>;

  return (
    <div className="max-w-md  p-6 bg-white rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form onSubmit={handleSubmit} className="py-5 space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded p-2"
          placeholder="Name"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded p-2"
          placeholder="Email"
        />

        <div>
          <button
            type="submit"
            disabled={loading}
            className=" bg-blue-700 cursor-pointer text-white px-2 py-2 rounded hover:bg-blue-800"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
