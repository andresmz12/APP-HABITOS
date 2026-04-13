'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Heart } from 'lucide-react';
import { createAppConfig } from '@/lib/firebase/appConfig';
import { ensureWeeklyStat } from '@/lib/firebase/weeklyStats';
import { getCurrentWeekKey } from '@/lib/utils/dates';
import { Partner, PartnerId } from '@/lib/types/models';
import { AVATAR_COLORS, HABIT_EMOJIS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

const AVATAR_EMOJIS = ['🧑', '👩', '🧑‍🤝‍🧑', '🐱', '🐶', '🦊', '🐼', '🦁', '🐙', '🌟', '🤩', '😎', '🥰', '🦋', '🌈'];

const PARTNER_ACCENT = ['#6C63FF', '#FF6B9D'];

interface PartnerDraft {
  name: string;
  avatarEmoji: string;
  avatarColor: string;
}

const defaultPartners = (): [PartnerDraft, PartnerDraft] => [
  { name: '', avatarEmoji: '🧑', avatarColor: AVATAR_COLORS[0] },
  { name: '', avatarEmoji: '👩', avatarColor: AVATAR_COLORS[1] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [[p1, p2], setPartners] = useState(defaultPartners);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setP = (i: 0 | 1, val: PartnerDraft) =>
    setPartners((prev) => i === 0 ? [val, prev[1]] : [prev[0], val]);

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      const makePartner = (draft: PartnerDraft, id: PartnerId): Partner => ({
        id,
        name: draft.name.trim(),
        avatarEmoji: draft.avatarEmoji,
        avatarColor: draft.avatarColor,
        notificationTime: '20:00',
        notificationsEnabled: false,
      });
      await createAppConfig(makePartner(p1, 'partner1'), makePartner(p2, 'partner2'));
      await ensureWeeklyStat(getCurrentWeekKey());
      router.push('/home');
    } catch {
      setError('Hubo un error al guardar. Intenta de nuevo.');
      setLoading(false);
    }
  }

  const current = step === 1 ? p1 : p2;
  const accentColor = PARTNER_ACCENT[step - 1] ?? PARTNER_ACCENT[0];

  return (
    <div className="min-h-screen bg-[#0F0F14] flex flex-col">
      <AnimatePresence mode="wait">

        {/* ── Welcome ── */}
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-8"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30 scale-150" style={{ background: 'radial-gradient(circle, #6C63FF 0%, #FF6B9D 100%)' }} />
              <div className="relative text-8xl">💑</div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white tracking-tight">
                Hábitos en Pareja
              </h1>
              <p className="text-gray-400 text-base leading-relaxed max-w-[280px] mx-auto">
                Construyan rutinas juntos. Cada hábito cumplido suma un punto. Compitan con amor.
              </p>
            </div>

            <div className="flex gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="text-base">✅</span> Hábitos diarios</span>
              <span className="flex items-center gap-1.5"><span className="text-base">🏆</span> Puntos semanales</span>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)' }}
            >
              Empezar <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {/* ── Partner setup ── */}
        {(step === 1 || step === 2) && (
          <motion.div
            key={`partner-${step}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="relative px-6 pt-10 pb-8 flex flex-col items-center text-center"
              style={{ background: `radial-gradient(ellipse at top, ${accentColor}22 0%, transparent 70%)` }}
            >
              {/* Progress */}
              <div className="flex gap-2 mb-6">
                {[1, 2].map((s) => (
                  <div key={s} className={cn('h-1 rounded-full transition-all duration-300', s === step ? 'w-8' : 'w-3 opacity-30')}
                    style={{ backgroundColor: s <= step ? accentColor : '#fff' }} />
                ))}
              </div>

              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: accentColor }}>
                Persona {step}
              </p>

              {/* Avatar preview */}
              <motion.div
                key={current.avatarEmoji + current.avatarColor}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-3 border-4 shadow-lg"
                style={{ backgroundColor: current.avatarColor + '25', borderColor: current.avatarColor, boxShadow: `0 0 24px ${current.avatarColor}55` }}
              >
                {current.avatarEmoji}
              </motion.div>

              <p className="text-white font-bold text-xl">
                {current.name.trim() || <span className="text-gray-600">Tu nombre aquí</span>}
              </p>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Nombre</label>
                <input
                  type="text"
                  value={current.name}
                  onChange={(e) => setP(step === 1 ? 0 : 1, { ...current, name: e.target.value })}
                  placeholder="¿Cómo te llamas?"
                  maxLength={20}
                  autoFocus
                  className="w-full bg-[#1A1A28] border border-[#2a2a44] rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-base outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Emoji */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Avatar</label>
                <div className="grid grid-cols-5 gap-2">
                  {[...AVATAR_EMOJIS, ...HABIT_EMOJIS.slice(0, 5)].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setP(step === 1 ? 0 : 1, { ...current, avatarEmoji: e })}
                      className={cn(
                        'h-12 rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90',
                        current.avatarEmoji === e ? 'ring-2 scale-105' : 'bg-[#1A1A28]'
                      )}
                      style={current.avatarEmoji === e ? { backgroundColor: accentColor + '30', ringColor: accentColor } : {}}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {AVATAR_COLORS.filter((c) => step === 1 || c !== p1.avatarColor).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setP(step === 1 ? 0 : 1, { ...current, avatarColor: color })}
                      className={cn('w-10 h-10 rounded-full transition-all active:scale-90', current.avatarColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-[#0F0F14] scale-110')}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>

            {/* Actions */}
            <div className="px-6 pb-8 pt-2 flex gap-3">
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 rounded-2xl font-semibold text-gray-300 bg-[#1A1A28] border border-[#2a2a44] transition-transform active:scale-95"
              >
                Atrás
              </button>
              <button
                onClick={() => step === 2 ? handleFinish() : setStep(2)}
                disabled={current.name.trim().length === 0 || loading}
                className="flex-2 flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
              >
                {loading ? (
                  <span className="animate-spin text-xl">⟳</span>
                ) : step === 2 ? (
                  <><Heart size={18} fill="white" /> ¡Listo!</>
                ) : (
                  <>Siguiente <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
