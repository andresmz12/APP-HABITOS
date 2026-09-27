'use client';

import { useEffect, useState } from 'react';
import { User } from '../types/models';
import { subscribeToMe } from '../firebase/auth';

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMe(({ user, partner }) => {
      setUser(user);
      setPartner(partner);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, partner, loading };
}
