'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PartnerId, Partner, AppConfig } from '../types/models';
import { getCurrentWeekKey } from '../utils/dates';

interface AppState {
  // Active partner (which profile is shown)
  activePartnerId: PartnerId;
  // Cached config from Firestore
  appConfig: AppConfig | null;
  // Current week key for reset detection
  currentWeekKey: string;
  // Hydrated flag for SSR
  _hasHydrated: boolean;

  setActivePartner: (id: PartnerId) => void;
  setAppConfig: (config: AppConfig | null) => void;
  setCurrentWeekKey: (key: string) => void;
  getActivePartner: () => Partner | null;
  setHasHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activePartnerId: 'partner1',
      appConfig: null,
      currentWeekKey: getCurrentWeekKey(),
      _hasHydrated: false,

      setActivePartner: (id) => set({ activePartnerId: id }),
      setAppConfig: (config) => set({ appConfig: config }),
      setCurrentWeekKey: (key) => set({ currentWeekKey: key }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      getActivePartner: () => {
        const { appConfig, activePartnerId } = get();
        return appConfig?.[activePartnerId] ?? null;
      },
    }),
    {
      name: 'app-habitos-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        activePartnerId: state.activePartnerId,
        currentWeekKey: state.currentWeekKey,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
