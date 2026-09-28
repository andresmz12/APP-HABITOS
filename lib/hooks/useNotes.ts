'use client';

import { useEffect, useState } from 'react';
import { CoupleNote } from '../types/models';
import { subscribeToNotes } from '../firebase/notes';

export function useNotes() {
  const [notes, setNotes] = useState<CoupleNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToNotes((data) => {
      setNotes(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { notes, loading };
}
