'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { WeeklyTask } from '@/lib/types/models';
import {
  getMonthGridDays,
  getDayKey,
  getCurrentDayKey,
  getCurrentMonthKey,
  getPrevMonthKey,
  getNextMonthKey,
  formatMonthLabel,
} from '@/lib/utils/dates';
import { createWeeklyTask, deleteWeeklyTask } from '@/lib/firebase/weeklyTasks';
import { useMonthTasks } from '@/lib/hooks/useWeeklyTasks';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export function SharedCalendarPlanner() {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const { tasks } = useMonthTasks(monthKey);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo(() => getMonthGridDays(monthKey), [monthKey]);
  const todayKey = getCurrentDayKey();

  const tasksByDay = useMemo(() => {
    const map = new Map<string, WeeklyTask[]>();
    for (const t of tasks) {
      const list = map.get(t.dateKey) ?? [];
      list.push(t);
      map.set(t.dateKey, list);
    }
    return map;
  }, [tasks]);

  const currentMonthNum = Number(monthKey.split('-')[1]);

  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthKey(getPrevMonthKey(monthKey))}
          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm font-bold text-white capitalize">{formatMonthLabel(monthKey)}</p>
        <button
          onClick={() => setMonthKey(getNextMonthKey(monthKey))}
          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-gray-600">
            {label}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = getDayKey(day);
          const inMonth = day.getUTCMonth() + 1 === currentMonthNum;
          const isToday = dateKey === todayKey;
          const dayTasks = tasksByDay.get(dateKey) ?? [];

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(dateKey)}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 p-0.5 transition-colors',
                isToday
                  ? 'bg-violet-600/25 ring-1 ring-violet-500'
                  : inMonth
                  ? 'bg-[#1A1A24] hover:bg-[#22223A]'
                  : 'bg-transparent'
              )}
            >
              <span
                className={cn(
                  'text-[11px] font-semibold tabular-nums',
                  !inMonth ? 'text-gray-800' : isToday ? 'text-violet-300' : 'text-gray-400'
                )}
              >
                {day.getUTCDate()}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.user?.avatarColor ?? '#6C63FF' }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <DayModal
          dateKey={selectedDay}
          tasks={tasksByDay.get(selectedDay) ?? []}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

function DayModal({
  dateKey,
  tasks,
  onClose,
}: {
  dateKey: string;
  tasks: WeeklyTask[];
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await createWeeklyTask(dateKey, text.trim());
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-40 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full bg-[#1A1A24] rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base">{dateKey}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#22223A] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-600 text-sm">Sin pendientes este día</p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 bg-[#22223A]/60 rounded-lg px-2.5 py-2"
                >
                  {task.user && (
                    <Avatar color={task.user.avatarColor} name={task.user.name} size="sm" />
                  )}
                  <span className="text-gray-200 text-sm flex-1 min-w-0 break-words">{task.text}</span>
                  <button
                    onClick={() => deleteWeeklyTask(task.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué debes hacer ese día?"
              maxLength={140}
              autoFocus
              className="flex-1 bg-[#22223A] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={!text.trim() || saving}
              className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
