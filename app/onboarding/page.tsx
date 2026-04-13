'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { createAppConfig } from '@/lib/firebase/appConfig';
import { ensureWeeklyStat } from '@/lib/firebase/weeklyStats';
import { getCurrentWeekKey } from '@/lib/utils/dates';
import { Partner, PartnerId } from '@/lib/types/models';
import { AVATAR_COLORS, HABIT_EMOJIS } from '@/lib/utils/constants';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const STEP_EMOJIS = ['🧑', '👩', '🧑‍🤝‍🧑', '🐱', '🐶', '🦊', '🐼', '🦁', '🐙', '🌟'];

interface PartnerDraft {
  name: string;
  avatarEmoji: string;
  avatarColor: string;
}

const defaultPartner = (): PartnerDraft => ({
  name: '',
  avatarEmoji: '🧑',
  avatarColor: AVATAR_COLORS[0],
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=welcome, 1=partner1, 2=partner2, 3=done
  const [p1, setP1] = useState<PartnerDraft>({ ...defaultPartner(), avatarEmoji: '🧑', avatarColor: AVATAR_COLORS[0] });
  const [p2, setP2] = useState<PartnerDraft>({ ...defaultPartner(), avatarEmoji: '👩', avatarColor: AVATAR_COLORS[1] });
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F14] flex flex-col">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6"
          >
            <div className="text-7xl mb-2">💑</div>
            <h1 className="text-3xl font-black text-white leading-tight">
              Hábitos en pareja
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs">
              Construyan rutinas juntos. Cada hábito cumplido da un punto.
              Compite con amor cada semana.
            </p>
            <Button
              size="lg"
              onClick={() => setStep(1)}
              className="w-full max-w-xs mt-4"
            >
              Comenzar <ChevronRight size={18} />
            </Button>
          </motion.div>
        )}

        {(step === 1 || step === 2) && (
          <motion.div
            key={`partner-${step}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col p-6 gap-6"
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-4">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    s === step ? 'w-6 bg-violet-500' : 'w-1.5 bg-[#22223A]'
                  )}
                />
              ))}
            </div>

            <h2 className="text-xl font-bold text-white text-center">
              {step === 1 ? 'Persona 1' : 'Persona 2'}
            </h2>

            <PartnerEditor
              value={step === 1 ? p1 : p2}
              onChange={step === 1 ? setP1 : setP2}
              colorExclude={step === 2 ? p1.avatarColor : undefined}
            />

            <div className="flex gap-3 mt-auto">
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                onClick={() => {
                  if (step === 2) handleFinish();
                  else setStep(2);
                }}
                disabled={(step === 1 ? p1.name : p2.name).trim().length === 0}
                loading={loading}
                className="flex-1"
              >
                {step === 2 ? '¡Listo!' : 'Siguiente'}
                {step === 1 && <ChevronRight size={16} />}
                {step === 2 && <Check size={16} />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PartnerEditor({
  value,
  onChange,
  colorExclude,
}: {
  value: PartnerDraft;
  onChange: (v: PartnerDraft) => void;
  colorExclude?: string;
}) {
  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 transition-all"
          style={{
            backgroundColor: value.avatarColor + '33',
            borderColor: value.avatarColor,
          }}
        >
          {value.avatarEmoji}
        </div>
        <p className="text-white font-semibold text-lg">{value.name || 'Tu nombre'}</p>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Nombre</label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="¿Cómo te llamas?"
          maxLength={20}
          className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Emoji */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Emoji</label>
        <div className="grid grid-cols-5 gap-2">
          {STEP_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange({ ...value, avatarEmoji: e })}
              className={cn(
                'h-12 rounded-xl text-2xl flex items-center justify-center transition-all',
                value.avatarEmoji === e
                  ? 'bg-violet-600/40 ring-2 ring-violet-500 scale-105'
                  : 'bg-[#22223A] hover:bg-[#2a2a44]'
              )}
            >
              {e}
            </button>
          ))}
          {HABIT_EMOJIS.slice(0, 10).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange({ ...value, avatarEmoji: e })}
              className={cn(
                'h-12 rounded-xl text-2xl flex items-center justify-center transition-all',
                value.avatarEmoji === e
                  ? 'bg-violet-600/40 ring-2 ring-violet-500 scale-105'
                  : 'bg-[#22223A] hover:bg-[#2a2a44]'
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Color</label>
        <div className="flex gap-3 flex-wrap">
          {AVATAR_COLORS.filter((c) => c !== colorExclude).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...value, avatarColor: color })}
              className={cn(
                'w-9 h-9 rounded-full transition-all',
                value.avatarColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-[#0F0F14] scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
