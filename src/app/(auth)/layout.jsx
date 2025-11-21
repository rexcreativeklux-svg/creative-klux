// app/(auth)/layout.js
"use client";

import "@/app/globals.css"; // Import global styles for Tailwind
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Optional: Component to handle auth loading state
function AuthContent({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return children;
}

export default function AuthLayout({ children }) {
  return (
  
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <AuthProvider>
          <AuthContent>{children}</AuthContent>
        </AuthProvider>
      </div>
  );
}