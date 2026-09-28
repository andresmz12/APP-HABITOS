'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Clock, CalendarDays, Check, Repeat } from 'lucide-react';
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
import { createWeeklyTask, deleteWeeklyTask, setWeeklyTaskDone } from '@/lib/firebase/weeklyTasks';
import { useMonthTasks } from '@/lib/hooks/useWeeklyTasks';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

interface Participant {
  id: string;
  name: string;
  avatarColor: string;
}

interface SharedCalendarPlannerProps {
  /** The signed-in user's id — used to tell "mine" apart from "theirs" */
  viewerId: string;
  /** 'personal' hides everyone else's items entirely; 'couple' shows both with a filter */
  mode?: 'personal' | 'couple';
  participants?: Participant[];
}

export function SharedCalendarPlanner({ viewerId, mode = 'personal', participants }: SharedCalendarPlannerProps) {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const { tasks: allTasks } = useMonthTasks(monthKey);
  const todayKey = getCurrentDayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'partner'>('all');

  const partner = participants?.find((p) => p.id !== viewerId);

  const tasks = useMemo(() => {
    if (mode === 'personal') return allTasks.filter((t) => t.userId === viewerId);
    if (filter === 'mine') return allTasks.filter((t) => t.userId === viewerId);
    if (filter === 'partner') return allTasks.filter((t) => t.userId !== viewerId);
    return allTasks;
  }, [allTasks, mode, filter, viewerId]);

  const days = useMemo(() => getMonthGridDays(monthKey), [monthKey]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, WeeklyTask[]>();
    for (const t of tasks) {
      const list = map.get(t.dateKey) ?? [];
      list.push(t);
      map.set(t.dateKey, list);
    }
    return map;
  }, [tasks]);

  const agendaDays = useMemo(() => Array.from(tasksByDay.keys()).sort(), [tasksByDay]);
  const currentMonthNum = Number(monthKey.split('-')[1]);
  const selectedDate = new Date(selectedDay + 'T00:00:00Z');

  return (
    <div className="space-y-5">
      {/* Couple filter tabs */}
      {mode === 'couple' && participants && participants.length > 0 && (
        <div className="flex items-center gap-1.5 bg-[#13131b] rounded-xl p-1">
          {([
            { key: 'all' as const, label: 'Ambos' },
            { key: 'mine' as const, label: participants.find((p) => p.id === viewerId)?.name ?? 'Yo' },
            ...(partner ? [{ key: 'partner' as const, label: partner.name }] : []),
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-all truncate px-2',
                filter === tab.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Month header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthKey(getPrevMonthKey(monthKey))}
          className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 flex-shrink-0"
        >
          <ChevronLeft size={15} />
        </button>
        <p className="text-[15px] font-bold text-white capitalize tracking-tight">{formatMonthLabel(monthKey)}</p>
        <button
          onClick={() => setMonthKey(getNextMonthKey(monthKey))}
          className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 flex-shrink-0"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Month grid — fixed-size circular day cells, safe at any viewport width */}
      <div className="max-w-[340px] mx-auto w-full">
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-gray-600 pb-2 tracking-wide">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5">
          {days.map((day) => {
            const dateKey = getDayKey(day);
            const inMonth = day.getUTCMonth() + 1 === currentMonthNum;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDay;
            const dayTasks = tasksByDay.get(dateKey) ?? [];

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDay(dateKey)}
                className="flex flex-col items-center justify-center gap-1 py-0.5"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold tabular-nums transition-all',
                    isSelected
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-600/30 scale-105'
                      : isToday
                      ? 'bg-violet-600/15 text-violet-300 ring-1 ring-inset ring-violet-500/60'
                      : inMonth
                      ? 'text-gray-300 hover:bg-white/[0.06]'
                      : 'text-gray-800'
                  )}
                >
                  {day.getUTCDate()}
                </div>
                <div className="h-1.5 flex items-center justify-center gap-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isSelected ? '#fff' : t.user?.avatarColor ?? '#8B85FF' }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add button for the selected day */}
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-violet-200 text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        <Plus size={16} />
        Agregar para {WEEKDAY_SHORT[selectedDate.getUTCDay()]} {selectedDate.getUTCDate()}
      </button>

      {/* Agenda list — every day this month with pending items, in order */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <CalendarDays size={12} className="text-gray-600" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Agenda del mes</p>
        </div>

        {agendaDays.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">Sin pendientes este mes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendaDays.map((dateKey) => {
              const dayTasks = tasksByDay.get(dateKey) ?? [];
              const date = new Date(dateKey + 'T00:00:00Z');
              const isToday = dateKey === todayKey;

              return (
                <div key={dateKey} className="flex gap-3">
                  {/* Date badge */}
                  <div className="flex flex-col items-center flex-shrink-0 w-11 pt-1">
                    <span className={cn('text-[9px] font-bold uppercase tracking-wide', isToday ? 'text-violet-400' : 'text-gray-600')}>
                      {WEEKDAY_SHORT[date.getUTCDay()]}
                    </span>
                    <span
                      className={cn(
                        'text-lg font-black leading-none mt-1 w-8 h-8 flex items-center justify-center rounded-full',
                        isToday ? 'bg-violet-600 text-white' : 'text-white'
                      )}
                    >
                      {date.getUTCDate()}
                    </span>
                  </div>

                  {/* Tasks for that day */}
                  <div className="flex-1 min-w-0 space-y-1.5 pt-1">
                    {dayTasks.map((task) => {
                      const isMine = task.userId === viewerId;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'group flex items-start gap-2.5 bg-[#1A1A24] hover:bg-[#1e1e2a] rounded-2xl px-3.5 py-3 transition-colors',
                            task.done && 'opacity-50'
                          )}
                          style={{ borderLeft: `2.5px solid ${task.user?.avatarColor ?? '#6C63FF'}` }}
                        >
                          <button
                            onClick={() => isMine && setWeeklyTaskDone(task.id, !task.done)}
                            disabled={!isMine}
                            className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                              task.done ? 'bg-green-500 border-green-500' : 'border-gray-600'
                            )}
                          >
                            {task.done && <Check size={11} color="white" strokeWidth={3} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm break-words leading-snug font-medium', task.done ? 'text-gray-500 line-through' : 'text-gray-100')}>
                              {task.text}
                            </p>
                            <div className="flex items-center gap-2.5 mt-1">
                              {task.time && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                  <Clock size={10} />
                                  {task.time}
                                </span>
                              )}
                              {task.seriesId && (
                                <Repeat size={10} className="text-gray-600" />
                              )}
                              {mode === 'couple' && task.user && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                  <Avatar color={task.user.avatarColor} name={task.user.name} size="sm" className="!w-4 !h-4 !text-[8px]" />
                                  {task.user.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {isMine && (
                            <button
                              onClick={() => deleteWeeklyTask(task.id)}
                              className="text-gray-500 hover:text-red-400 active:text-red-400 transition-colors flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addOpen && (
        <AddTaskModal
          dateKey={selectedDay}
          weekdayLabel={WEEKDAY_NAMES[selectedDate.getUTCDay()]}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function AddTaskModal({
  dateKey,
  weekdayLabel,
  onClose,
}: {
  dateKey: string;
  weekdayLabel: string;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await createWeeklyTask(dateKey, text.trim(), time, repeat ? repeatWeeks : 1);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const [y, m, d] = dateKey.split('-');

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
          className="w-full max-w-lg mx-auto bg-[#1A1A24] rounded-t-3xl p-6 space-y-4"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-base">Nuevo pendiente</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {weekdayLabel} {Number(d)} de {MONTH_SHORT[Number(m) - 1]} de {y}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#22223A] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué debes hacer ese día?"
            maxLength={140}
            autoFocus
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">Hora (opcional)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          <div className="bg-[#22223A] rounded-xl px-4 py-3 space-y-3">
            <button
              type="button"
              onClick={() => setRepeat((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
                <Repeat size={14} className={repeat ? 'text-violet-400' : 'text-gray-500'} />
                Repetir cada semana
              </span>
              <span
                className={cn(
                  'w-10 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0',
                  repeat ? 'bg-violet-600 justify-end' : 'bg-[#33334a] justify-start'
                )}
              >
                <span className="w-5 h-5 rounded-full bg-white" />
              </span>
            </button>
            {repeat && (
              <div className="flex items-center gap-3 pt-1 border-t border-white/5">
                <span className="text-gray-400 text-sm flex-1 pt-3">Durante cuántas semanas:</span>
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setRepeatWeeks((w) => Math.max(2, w - 1))}
                    className="w-7 h-7 rounded-lg bg-[#2a2a44] text-white flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-white font-bold w-4 text-center">{repeatWeeks}</span>
                  <button
                    type="button"
                    onClick={() => setRepeatWeeks((w) => Math.min(26, w + 1))}
                    className="w-7 h-7 rounded-lg bg-[#2a2a44] text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#22223A] text-white text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim() || saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold disabled:opacity-40"
            >
              {saving ? '...' : 'Agregar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
