"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import LayoutContent from "../LayoutContent";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "../components/Loader";

function ProtectedWrapper({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // redirect if not logged in
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <Loader color="border-black" />;
  }

  return <>{children}</>;
}

export default function RootLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AuthProvider>
        <BrandProvider>
          <ProtectedWrapper>
            <LayoutContent>{children}</LayoutContent>
          </ProtectedWrapper>
        </BrandProvider>
      </AuthProvider>
    </div>
  );
}
