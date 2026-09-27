'use client';

import { useEffect, useState } from 'react';
import { HabitCompletion } from '../types/models';
import { subscribeToTodayCompletions } from '../firebase/completions';

export function useTodayCompletions() {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTodayCompletions((data) => {
      setCompletions(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { completions, loading };
}
