'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // ROUTING RULE:
    // Not authenticated → /welcome
    if (!user && pathname !== '/welcome') {
      router.replace('/welcome');
      return;
    }

    // Authenticated → allow access to all pages
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
