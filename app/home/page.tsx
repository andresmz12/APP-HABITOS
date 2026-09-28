'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Sparkles } from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useHabits } from '@/lib/hooks/useHabits';
import { useTodayCompletions } from '@/lib/hooks/useCompletions';
import { PartnerHeader } from '@/components/dashboard/PartnerHeader';
import { HabitList } from '@/components/habits/HabitList';
import { HabitForm } from '@/components/habits/HabitForm';
import { SharedCalendarPlanner } from '@/components/dashboard/SharedCalendarPlanner';
import { AchievementsPanel } from '@/components/dashboard/AchievementsPanel';
import { Card } from '@/components/ui/Card';
import { Habit } from '@/lib/types/models';
import { BottomNav } from '@/components/ui/BottomNav';

function greeting(): string {
  const hour = new Date().getUTCHours() - 5; // Colombia UTC-5
  const h = ((hour % 24) + 24) % 24;
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const { habits, loading: habitsLoading, streak, weeklyPoints } = useHabits();
  const { completions } = useTodayCompletions();
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (!sessionLoading && !user) router.replace('/onboarding');
  }, [sessionLoading, user, router]);

  useEffect(() => {
    const allDone = habits.length > 0 && completions.length >= habits.length;
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#8B85FF', '#FF6B9D', '#4ADE80'] });
    } else if (!allDone) {
      celebratedRef.current = false;
    }
  }, [completions.length, habits.length]);

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accentColor = user.avatarColor;

  return (
    <div className="min-h-screen bg-[#0B0B10] pb-28">
      <div className="max-w-lg lg:max-w-2xl mx-auto">
        {/* Header */}
        <div
          className="px-5 pt-14 pb-6"
          style={{
            background: `radial-gradient(ellipse 120% 220px at 50% -10%, ${accentColor}22 0%, transparent 70%)`,
          }}
        >
          <div className="mb-5">
            <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-[0.15em]">
              {greeting()}
            </p>
            <h1 className="text-white text-[28px] font-black mt-0.5 leading-none tracking-tight">
              {user.name}
            </h1>
          </div>

          {/* Stats card */}
          <PartnerHeader
            user={user}
            completedToday={completions.length}
            totalHabits={habits.length}
            weeklyPoints={weeklyPoints}
            streak={streak}
          />
        </div>

        {/* Habits section */}
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">
              Hábitos de hoy
            </h2>
            <div className="flex items-center gap-2.5">
              {habits.length > 0 && (
                <span className="text-xs text-gray-600 tabular-nums font-medium">
                  {completions.length}/{habits.length}
                </span>
              )}
              <button
                onClick={() => setAddOpen(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                style={{ backgroundColor: accentColor + '25', color: accentColor }}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {!habitsLoading && habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-8 flex flex-col items-center text-center gap-4"
              style={{
                background: `linear-gradient(160deg, ${accentColor}14 0%, #14141c 70%)`,
                border: `1px solid ${accentColor}25`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`, boxShadow: `0 8px 24px ${accentColor}40` }}
              >
                <Sparkles size={28} color="white" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Crea tu primer hábito</p>
                <p className="text-gray-500 text-sm mt-1 max-w-[240px] mx-auto leading-relaxed">
                  Rutinas pequeñas, constantes cada día. Empieza con una.
                </p>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="px-6 py-3 rounded-2xl font-bold text-white text-sm active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, boxShadow: `0 8px 20px ${accentColor}45` }}
              >
                + Nuevo hábito
              </button>
            </motion.div>
          ) : (
            <HabitList
              habits={habits}
              completions={completions}
              onEdit={(h) => setEditHabit(h)}
              loading={habitsLoading}
              partnerColor={accentColor}
            />
          )}
        </div>

        {/* Achievements */}
        <div className="px-5 mt-5">
          <Card className="space-y-3 !bg-[#121218] !rounded-3xl border border-white/[0.04]">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">
              Logros
            </p>
            <AchievementsPanel />
          </Card>
        </div>
      </div>

      {/* Personal plan calendar — breaks out wider on desktop */}
      <div className="max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-4">
        <Card className="space-y-4 !bg-[#121218] !rounded-3xl border border-white/[0.04]">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">
              Mi calendario
            </p>
            <p className="text-gray-600 text-xs mt-0.5">
              Anota lo que debes hacer cada día
            </p>
          </div>
          <SharedCalendarPlanner viewerId={user.id} mode="personal" />
        </Card>
      </div>

      {/* Add habit modal */}
      <HabitForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />

      {/* Edit habit modal — key forces remount when editing a different habit */}
      <HabitForm
        key={editHabit?.id ?? 'edit'}
        open={!!editHabit}
        onClose={() => setEditHabit(null)}
        editHabit={editHabit ?? undefined}
      />

      <BottomNav />
    </div>
  );
}
