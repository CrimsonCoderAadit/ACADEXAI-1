'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';

export default function NavigationWrapper() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // While auth is resolving, don't flash navigation
  if (loading) {
    return null;
  }

  // Hide navigation on welcome and quiz pages
  if (pathname === '/welcome' || pathname === '/quiz') {
    return null;
  }

  // Hide nav when not logged in
  if (!user) {
    return null;
  }

  // Show navigation on all other authenticated pages
  return <Navigation />;
}
