'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAppConfig } from '@/lib/firebase/appConfig';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const config = await getAppConfig();
        if (config?.isOnboardingComplete) {
          router.replace('/home');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    }
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl">💑</div>
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
