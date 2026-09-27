'use client';

import { useEffect, useState } from 'react';
import { CoupleSummary } from '../types/models';
import { subscribeToCoupleSummary } from '../firebase/coupleSummary';

export function useCoupleSummary(weekKey: string) {
  const [summary, setSummary] = useState<CoupleSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCoupleSummary(weekKey, (data) => {
      setSummary(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [weekKey]);

  return { summary, loading };
}
