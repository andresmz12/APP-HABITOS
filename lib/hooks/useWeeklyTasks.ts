'use client';

import { useEffect, useState } from 'react';
import { WeeklyTask } from '../types/models';
import { subscribeToMonthTasks } from '../firebase/weeklyTasks';

export function useMonthTasks(monthKey: string) {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMonthTasks(monthKey, (data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [monthKey]);

  return { tasks, loading };
}
