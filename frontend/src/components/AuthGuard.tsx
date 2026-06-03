'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated, fetchMe, logout } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (hasInitialized.current) return; 
    hasInitialized.current = true;  
    const initialize = async () => {
      if (!token) {
        logout();
        router.replace('/auth/login');
        setIsReady(true);
        return;
      }

      try {
        await fetchMe();
      } catch {
        logout();
        router.replace('/auth/login');
        return;
      } finally {
        setIsReady(true);
      }
    };

    initialize();
  }, [token]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810] text-white">
        <div className="space-y-2 text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-violet-600 animate-pulse" />
          <div className="text-sm text-[var(--text-secondary)]">Verifying access…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
