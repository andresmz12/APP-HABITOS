'use client';

import { useEffect, useState } from 'react';
import { Habit } from '../types/models';
import { subscribeToHabits } from '../firebase/habits';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [weeklyLimitReached, setWeeklyLimitReached] = useState(false);
  const [streak, setStreak] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToHabits(
      (data) => {
        setHabits(data.habits);
        setWeeklyLimitReached(data.weeklyLimitReached);
        setStreak(data.streak);
        setWeeklyPoints(data.weeklyPoints);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { habits, loading, error, weeklyLimitReached, streak, weeklyPoints };
}
