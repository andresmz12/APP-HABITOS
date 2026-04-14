'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAppConfig } from '@/lib/firebase/appConfig';
import { ensureWeeklyStat } from '@/lib/firebase/weeklyStats';
import { getCurrentWeekKey } from '@/lib/utils/dates';
import { Partner, PartnerId } from '@/lib/types/models';
import { AVATAR_COLORS } from '@/lib/utils/constants';

const COLORS = AVATAR_COLORS;

function ColorPicker({ value, onChange, exclude }: { value: string; onChange: (c: string) => void; exclude?: string }) {
  return (
    <div className="flex gap-2.5 flex-wrap">
      {COLORS.filter(c => c !== exclude).map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full transition-all duration-150"
          style={{
            backgroundColor: c,
            transform: value === c ? 'scale(1.25)' : 'scale(1)',
            outline: value === c ? '2px solid white' : 'none',
            outlineOffset: '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [p1Color, setP1Color] = useState(COLORS[0]);
  const [p2Color, setP2Color] = useState(COLORS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = p1Name.trim().length > 0 && p2Name.trim().length > 0 && !loading;

  async function handleStart() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const make = (name: string, color: string, id: PartnerId): Partner => ({
        id,
        name: name.trim(),
        avatarEmoji: id === 'partner1' ? '🧑' : '👩',
        avatarColor: color,
        notificationTime: '20:00',
        notificationsEnabled: false,
      });
      await createAppConfig(make(p1Name, p1Color, 'partner1'), make(p2Name, p2Color, 'partner2'));
      await ensureWeeklyStat(getCurrentWeekKey());
      router.push('/home');
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-5 py-10 gap-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-6xl">💑</div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-3">Hábitos en Pareja</h1>
        <p className="text-gray-500 text-sm">Construyan rutinas juntos, compitan con amor</p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-sm space-y-3">

        {/* Persona 1 */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: p1Color + '12', border: `1px solid ${p1Color}30` }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: p1Color }}>
            Persona 1
          </p>
          <input
            type="text"
            value={p1Name}
            onChange={e => setP1Name(e.target.value)}
            placeholder="¿Cómo te llamas?"
            maxLength={20}
            autoFocus
            className="w-full bg-black/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
          <ColorPicker value={p1Color} onChange={setP1Color} />
        </div>

        {/* Persona 2 */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: p2Color + '12', border: `1px solid ${p2Color}30` }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: p2Color }}>
            Persona 2
          </p>
          <input
            type="text"
            value={p2Name}
            onChange={e => setP2Name(e.target.value)}
            placeholder="¿Cómo se llama tu pareja?"
            maxLength={20}
            className="w-full bg-black/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
          <ColorPicker value={p2Color} onChange={setP2Color} exclude={p1Color} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm text-center px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={!canSubmit}
        className="w-full max-w-sm py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 disabled:opacity-30"
        style={{ background: `linear-gradient(135deg, ${p1Color}, ${p2Color})` }}
      >
        {loading ? (
          <span className="inline-block animate-spin">⟳</span>
        ) : (
          '¡Comenzar!'
        )}
      </button>

    </div>
  );
}
