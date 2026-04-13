'use client';

import { useEffect, useState } from 'react';
import { HabitCompletion, PartnerId } from '../types/models';
import {
  subscribeToTodayCompletions,
  subscribeToWeekCompletions,
} from '../firebase/completions';

export function useTodayCompletions(partnerId: PartnerId) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTodayCompletions(partnerId, (data) => {
      setCompletions(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [partnerId]);

  return { completions, loading };
}

export function useWeekCompletions(partnerId: PartnerId, weekKey: string) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToWeekCompletions(partnerId, weekKey, (data) => {
      setCompletions(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [partnerId, weekKey]);

  return { completions, loading };
}
