'use client';

import { useEffect, useState } from 'react';
import { Badge } from '../types/models';
import { subscribeToAchievements } from '../firebase/achievements';

export function useAchievements() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAchievements((data) => {
      setBadges(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { badges, loading };
}
