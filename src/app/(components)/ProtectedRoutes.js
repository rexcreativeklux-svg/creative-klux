'use client';

// app/(components)/ProtectedRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// The auth gate around every dashboard route.
//
// While the auth check is in flight this returns a skeleton INSTEAD of the
// layout's children — which at that point includes the Sidebar and the Header —
// so it is the one place in the app that has to draw the whole window, chrome
// and all. Everything else (loading.js files, in-page loading states) renders
// with the real chrome already mounted and skeletons content only.
//
// This is also the loading state users see most: it covers the token check on
// every hard refresh, so it's worth it being the right shape. The content slot
// follows the route — the AI home has a very distinctive layout and is the most
// common landing spot, so it gets its own; everything else takes the neutral
// inner-page shape.

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppShellSkeleton from './skeletons/AppShellSkeleton';
import HomeSkeleton from './skeletons/HomeSkeleton';
import PageSkeleton from './skeletons/PageSkeleton';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if token exists in localStorage as fallback
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  useEffect(() => {
    if (!loading && !user && !hasToken) {
      router.push('/login');
    }
  }, [user, loading, hasToken, router]);

  if (loading) {
    // The home page is full-bleed and paints its own hero, so it takes no page
    // padding — matching the layout's own `noPadding` rule for "/".
    const isHome = pathname === '/';
    return (
      <AppShellSkeleton padded={!isHome}>
        {isHome ? <HomeSkeleton clearsHeader={false} /> : <PageSkeleton />}
      </AppShellSkeleton>
    );
  }

  if (!user && !hasToken) {
    return null;
  }

  return <>{children}</>;
}
