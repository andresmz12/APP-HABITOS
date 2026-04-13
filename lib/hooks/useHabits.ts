'use client';

import { useEffect, useState } from 'react';
import { Habit, PartnerId } from '../types/models';
import { subscribeToHabits } from '../firebase/habits';

export function useHabits(partnerId: PartnerId) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToHabits(
      partnerId,
      (data) => {
        setHabits(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [partnerId]);

  return { habits, loading, error };
}
