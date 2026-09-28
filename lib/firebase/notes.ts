import { CoupleNote } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export function subscribeToNotes(callback: (notes: CoupleNote[]) => void): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { notes } = await apiFetch('/api/notes');
      if (active) callback(notes ?? []);
    } catch {
      if (active) callback([]);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function createNote(text: string): Promise<string> {
  const { note } = await apiFetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return note.id;
}

export async function deleteNote(noteId: string): Promise<void> {
  await apiFetch(`/api/notes/${noteId}`, { method: 'DELETE' });
}
