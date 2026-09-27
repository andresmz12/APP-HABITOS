'use client';

import { useEffect, useState } from 'react';
import { WeeklyTask } from '../types/models';
import { subscribeToWeekTasks } from '../firebase/weeklyTasks';

export function useWeeklyTasks(weekKey: string) {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToWeekTasks(weekKey, (data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [weekKey]);

  return { tasks, loading };
}
