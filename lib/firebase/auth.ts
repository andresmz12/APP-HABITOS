import { User } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export interface MeResponse {
  user: User | null;
  partner: User | null;
}

export async function getMe(): Promise<MeResponse> {
  try {
    return await apiFetch('/api/me');
  } catch {
    return { user: null, partner: null };
  }
}

export function subscribeToMe(callback: (data: MeResponse) => void): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    const data = await getMe();
    if (active) callback(data);
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function createProfile(
  name: string,
  avatarColor: string,
  username: string,
  password: string
): Promise<User> {
  const { user } = await apiFetch('/api/auth/create-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, avatarColor, username, password }),
  });
  return user;
}

export async function joinWithCode(
  name: string,
  avatarColor: string,
  username: string,
  password: string,
  pairCode: string
): Promise<User> {
  const { user } = await apiFetch('/api/auth/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, avatarColor, username, password, pairCode }),
  });
  return user;
}

export async function login(username: string, password: string): Promise<User> {
  const { user } = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return user;
}

export async function updateProfile(
  data: Partial<Pick<User, 'name' | 'avatarColor' | 'notificationEmail' | 'reminderTime' | 'notificationsEnabled'>>
): Promise<User> {
  const { user } = await apiFetch('/api/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch('/api/auth/change-password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function logoutAll(): Promise<void> {
  await apiFetch('/api/auth/logout-all', { method: 'POST' });
}
