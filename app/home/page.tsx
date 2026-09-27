'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useHabits } from '@/lib/hooks/useHabits';
import { useTodayCompletions } from '@/lib/hooks/useCompletions';
import { PartnerHeader } from '@/components/dashboard/PartnerHeader';
import { HabitList } from '@/components/habits/HabitList';
import { HabitForm } from '@/components/habits/HabitForm';
import { SharedCalendarPlanner } from '@/components/dashboard/SharedCalendarPlanner';
import { Card } from '@/components/ui/Card';
import { Habit } from '@/lib/types/models';
import { BottomNav } from '@/components/ui/BottomNav';

export default function HomePage() {
  const router = useRouter();
  const { user, partner, loading: sessionLoading } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const { habits, loading: habitsLoading, weeklyLimitReached, streak, weeklyPoints } = useHabits();
  const { completions } = useTodayCompletions();

  useEffect(() => {
    if (!sessionLoading && !user) router.replace('/onboarding');
  }, [sessionLoading, user, router]);

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accentColor = user.avatarColor;

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{
          background: `radial-gradient(ellipse 100% 180px at 50% 0%, ${accentColor}1a 0%, transparent 100%)`,
        }}
      >
        <div className="mb-4">
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">
            Hábitos de
          </p>
          <h1 className="text-white text-2xl font-black mt-0.5 leading-none">
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
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Hábitos de hoy
          </h2>
          <div className="flex items-center gap-2.5">
            {habits.length > 0 && (
              <span className="text-xs text-gray-600 tabular-nums">
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

        <HabitList
          habits={habits}
          completions={completions}
          onEdit={(h) => setEditHabit(h)}
          loading={habitsLoading}
          partnerColor={accentColor}
        />
      </div>

      {/* Shared plan calendar */}
      <div className="px-4 mt-4">
        <Card className="space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Plan del mes
            </p>
            <p className="text-gray-600 text-xs mt-0.5">
              {partner ? 'Anoten lo que cada uno debe hacer cada día' : 'Anota lo que debes hacer cada día'}
            </p>
          </div>
          <SharedCalendarPlanner
            participants={[
              { id: user.id, name: user.name, avatarColor: user.avatarColor },
              ...(partner ? [{ id: partner.id, name: partner.name, avatarColor: partner.avatarColor }] : []),
            ]}
          />
        </Card>
      </div>

      {/* Add habit modal */}
      <HabitForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        weeklyLimitReached={weeklyLimitReached}
      />

      {/* Edit habit modal — key forces remount when editing a different habit */}
      <HabitForm
        key={editHabit?.id ?? 'edit'}
        open={!!editHabit}
        onClose={() => setEditHabit(null)}
        editHabit={editHabit ?? undefined}
        weeklyLimitReached={weeklyLimitReached}
      />

      <BottomNav />
    </div>
  );
}
