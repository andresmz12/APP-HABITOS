'use client';

import { useEffect, useState } from 'react';
import { WeeklyStat } from '../types/models';
import { subscribeToWeeklyStat } from '../firebase/weeklyStats';

export function useWeeklyStats(weekKey: string) {
  const [stat, setStat] = useState<WeeklyStat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToWeeklyStat(weekKey, (data) => {
      setStat(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [weekKey]);

  return { stat, loading };
}
