'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { useAppConfig } from '@/lib/hooks/useAppConfig';
import { useWeeklyReset } from '@/lib/hooks/useWeeklyReset';

function AppConfigLoader({ children }: { children: React.ReactNode }) {
  useAppConfig();
  useWeeklyReset();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const setHasHydrated = useAppStore((s) => s.setHasHydrated);

  useEffect(() => {
    setMounted(true);
    setHasHydrated(true);
  }, [setHasHydrated]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppConfigLoader>{children}</AppConfigLoader>;
}
