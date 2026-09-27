'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { WeeklyTask } from '@/lib/types/models';
import { getWeekDays, getDayKey, getCurrentDayKey } from '@/lib/utils/dates';
import { createWeeklyTask, deleteWeeklyTask } from '@/lib/firebase/weeklyTasks';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface SharedWeekPlannerProps {
  weekKey: string;
  tasks: WeeklyTask[];
}

export function SharedWeekPlanner({ weekKey, tasks }: SharedWeekPlannerProps) {
  const days = useMemo(() => getWeekDays(weekKey), [weekKey]);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, WeeklyTask[]>();
    for (const t of tasks) {
      const list = map.get(t.dateKey) ?? [];
      list.push(t);
      map.set(t.dateKey, list);
    }
    return map;
  }, [tasks]);

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dateKey = getDayKey(day);
        const dayTasks = tasksByDay.get(dateKey) ?? [];
        const today = dateKey === getCurrentDayKey();
        const label = DAY_LABELS[day.getUTCDay()];

        return (
          <div
            key={dateKey}
            className={cn(
              'rounded-xl px-3 py-2.5',
              today ? 'bg-violet-600/10 border border-violet-500/30' : 'bg-[#1A1A24]'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn('text-xs font-bold', today ? 'text-violet-300' : 'text-gray-400')}>
                {label} <span className="text-gray-600 font-normal">{dateKey.slice(8)}</span>
              </span>
              <button
                onClick={() => setOpenDay(dateKey)}
                className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>

            {dayTasks.length === 0 ? (
              <p className="text-gray-700 text-xs">Sin pendientes</p>
            ) : (
              <div className="space-y-1.5">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 bg-[#22223A]/60 rounded-lg px-2.5 py-1.5"
                  >
                    {task.user && (
                      <Avatar
                        color={task.user.avatarColor}
                        name={task.user.name}
                        size="sm"
                        className="!w-5 !h-5 !text-[9px]"
                      />
                    )}
                    <span className="text-gray-200 text-xs flex-1 min-w-0 break-words">{task.text}</span>
                    <button
                      onClick={() => deleteWeeklyTask(task.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {openDay && (
        <AddTaskModal dateKey={openDay} weekKey={weekKey} onClose={() => setOpenDay(null)} />
      )}
    </div>
  );
}

function AddTaskModal({
  dateKey,
  weekKey,
  onClose,
}: {
  dateKey: string;
  weekKey: string;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await createWeeklyTask(weekKey, dateKey, text.trim());
      onClose();
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
          className="w-full bg-[#1A1A24] rounded-t-3xl p-6 space-y-4"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-white font-bold text-base">Nuevo pendiente · {dateKey}</h2>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué debes hacer ese día?"
            maxLength={140}
            autoFocus
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#22223A] text-white text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-40"
            >
              {saving ? '...' : 'Agregar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
