'use client';

import { useMemo } from 'react';
import { HabitCompletion, Habit } from '@/lib/types/models';
import { getWeekDays, getDayKey } from '@/lib/utils/dates';
import { DAY_NAMES_SHORT } from '@/lib/utils/constants';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface WeeklyCalendarProps {
  weekKey: string;
  habits: Habit[];
  completions: HabitCompletion[];
  color: string;
}

export function WeeklyCalendar({ weekKey, habits, completions, color }: WeeklyCalendarProps) {
  const days = useMemo(() => getWeekDays(weekKey), [weekKey]);

  const completionByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of completions) {
      map.set(c.dateKey, (map.get(c.dateKey) ?? 0) + 1);
    }
    return map;
  }, [completions]);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day, i) => {
        const key = getDayKey(day);
        const count = completionByDay.get(key) ?? 0;
        const total = habits.length;
        const pct = total > 0 ? count / total : 0;
        const allDone = pct === 1 && total > 0;
        const today = isToday(day);
        const future = day > new Date();

        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'text-[9px] font-bold',
                today ? 'text-white' : 'text-gray-600'
              )}
            >
              {DAY_NAMES_SHORT[i]}
            </span>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all',
                today && 'ring-2 ring-offset-1 ring-offset-[#1A1A24]'
              )}
              style={{
                backgroundColor: future
                  ? '#1A1A24'
                  : pct === 0
                  ? 'rgba(255,255,255,0.06)'
                  : color + Math.round(pct * 0xff).toString(16).padStart(2, '0'),
                ...(today ? { '--tw-ring-color': color } as React.CSSProperties : {}),
              }}
              title={`${format(day, 'EEE dd/MM')}: ${count}/${total}`}
            >
              {!future && allDone && (
                <span className="text-white text-xs font-black">✓</span>
              )}
              {!future && !allDone && count > 0 && (
                <span className="text-[10px]" style={{ color }}>{count}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
