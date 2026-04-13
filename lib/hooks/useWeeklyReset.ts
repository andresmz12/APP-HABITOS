'use client';

import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { getCurrentWeekKey } from '../utils/dates';
import { ensureWeeklyStat, finalizeWeeklyStat } from '../firebase/weeklyStats';
import { updateAppConfigWeekKey } from '../firebase/appConfig';

export function useWeeklyReset() {
  const { currentWeekKey, setCurrentWeekKey } = useAppStore();

  useEffect(() => {
    async function checkReset() {
      const nowWeekKey = getCurrentWeekKey();
      if (nowWeekKey !== currentWeekKey) {
        try {
          await finalizeWeeklyStat(currentWeekKey);
          await ensureWeeklyStat(nowWeekKey);
          await updateAppConfigWeekKey(nowWeekKey);
          setCurrentWeekKey(nowWeekKey);
        } catch {
          // Silently fail if Firebase not configured yet
        }
      }
    }
    checkReset();
  }, [currentWeekKey, setCurrentWeekKey]);
}
