'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardSkeleton from './DashboardSkeleton';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if token exists in localStorage as fallback
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  useEffect(() => {
    if (!loading && !user && !hasToken) {
      router.push('/login');
    }
  }, [user, loading, hasToken, router]);

  if (loading) {
    return (
     <DashboardSkeleton />
    );
  }

  if (!user && !hasToken) {
    return null;
  }

  return <>{children}</>;
}