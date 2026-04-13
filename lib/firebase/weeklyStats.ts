import {
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { weeklyStatRef } from './firestore';
import { PartnerId, WeeklyStat } from '../types/models';
import { getISOWeekKey, getWeekStart, getWeekEnd } from '../utils/dates';

export function subscribeToWeeklyStat(
  weekKey: string,
  callback: (stat: WeeklyStat | null) => void
): () => void {
  return onSnapshot(weeklyStatRef(weekKey), (snap) => {
    if (snap.exists()) {
      callback({ ...snap.data(), weekKey: snap.id } as WeeklyStat);
    } else {
      callback(null);
    }
  });
}

export async function ensureWeeklyStat(weekKey: string): Promise<void> {
  const ref = weeklyStatRef(weekKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await setDoc(ref, {
      weekKey,
      weekStart: getWeekStart(now),
      partner1: { totalPoints: 0, totalCompletions: 0 },
      partner2: { totalPoints: 0, totalCompletions: 0 },
    } as any);
  }
}

export async function updateWeeklyStatPoints(
  partnerId: PartnerId,
  delta: number,
  _habitId: string
): Promise<void> {
  const weekKey = getISOWeekKey(new Date());
  const ref = weeklyStatRef(weekKey);

  // Ensure document exists first
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await ensureWeeklyStat(weekKey);
  }

  await updateDoc(ref, {
    [`${partnerId}.totalPoints`]: increment(delta),
    [`${partnerId}.totalCompletions`]: increment(delta > 0 ? 1 : -1),
  });
}

export async function finalizeWeeklyStat(weekKey: string): Promise<void> {
  const ref = weeklyStatRef(weekKey);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalizedAt: serverTimestamp() as any,
    });
  }
}

export async function getWeeklyStat(weekKey: string): Promise<WeeklyStat | null> {
  const snap = await getDoc(weeklyStatRef(weekKey));
  if (snap.exists()) {
    return { ...snap.data(), weekKey: snap.id } as WeeklyStat;
  }
  return null;
}
