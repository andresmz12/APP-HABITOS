import { setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { appConfigRef } from './firestore';
import { AppConfig, Partner } from '../types/models';
import { getCurrentWeekKey } from '../utils/dates';

export async function getAppConfig(): Promise<AppConfig | null> {
  const snap = await getDoc(appConfigRef());
  return snap.exists() ? (snap.data() as AppConfig) : null;
}

export function subscribeToAppConfig(
  callback: (config: AppConfig | null) => void
): () => void {
  return onSnapshot(appConfigRef(), (snap) => {
    callback(snap.exists() ? (snap.data() as AppConfig) : null);
  });
}

export async function createAppConfig(
  partner1: Partner,
  partner2: Partner
): Promise<void> {
  const coupleId = crypto.randomUUID();
  await setDoc(appConfigRef(), {
    coupleId,
    isOnboardingComplete: true,
    currentWeekKey: getCurrentWeekKey(),
    partner1,
    partner2,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: new Date() as any,
  });
}

export async function updateAppConfigWeekKey(weekKey: string): Promise<void> {
  await updateDoc(appConfigRef(), { currentWeekKey: weekKey });
}

export async function updatePartner(
  partnerId: 'partner1' | 'partner2',
  data: Partial<Partner>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updates[`${partnerId}.${key}`] = value;
  }
  await updateDoc(appConfigRef(), updates);
}
