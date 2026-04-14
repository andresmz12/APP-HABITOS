import { AppConfig, Partner } from '../types/models';
import { getCurrentWeekKey } from '../utils/dates';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAppConfig(): Promise<AppConfig | null> {
  try {
    const { config } = await apiFetch('/api/config');
    return config ?? null;
  } catch {
    return null;
  }
}

export function subscribeToAppConfig(
  callback: (config: AppConfig | null) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { config } = await apiFetch('/api/config');
      if (active) callback(config ?? null);
    } catch {
      if (active) callback(null);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function createAppConfig(
  partner1: Partner,
  partner2: Partner
): Promise<void> {
  await apiFetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partner1, partner2 }),
  });
}

export async function updateAppConfigWeekKey(weekKey: string): Promise<void> {
  await apiFetch('/api/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentWeekKey: weekKey }),
  });
}

export async function updatePartner(
  partnerId: 'partner1' | 'partner2',
  data: Partial<Partner>
): Promise<void> {
  await apiFetch('/api/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [partnerId]: data }),
  });
}

export async function updatePartnerEmail(
  partnerId: 'partner1' | 'partner2',
  email: string
): Promise<void> {
  const key = partnerId === 'partner1' ? 'partner1NotificationEmail' : 'partner2NotificationEmail';
  await apiFetch('/api/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: email }),
  });
}

// Unused export kept for compatibility
export { getCurrentWeekKey };
