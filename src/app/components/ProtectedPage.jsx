// "use client";

// import { useAuth } from "@/context/AuthContext";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function ProtectedPage({ children }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !user) router.push("/login");
//   }, [user, loading, router]);

//   if (loading || !user) return <p>Loading...</p>;

//   return <>{children}</>;
// }
