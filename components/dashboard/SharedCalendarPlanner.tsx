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
  getMonthKey,
  formatMonthLabel,
  getWeekKey,
  getCurrentWeekKey,
  getWeekDays,
  getPrevWeekKey,
  getNextWeekKey,
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

const HOUR_START = 5; // 5 AM
const HOUR_END = 23; // 11 PM (last labeled hour)
const SUBROWS_PER_HOUR = 4; // 15-minute increments
const TOTAL_HOURS = HOUR_END - HOUR_START + 1;
const TOTAL_SUBROWS = TOTAL_HOURS * SUBROWS_PER_HOUR;

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
}

function formatTimeRange(task: Pick<WeeklyTask, 'time' | 'endTime'>): string {
  if (!task.time) return '';
  return task.endTime ? `${task.time} - ${task.endTime}` : task.time;
}

// Absolute 15-min subrow index since HOUR_START:00, clamped to the grid's visible range.
function timeToSubrow(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const rawMinutes = (h - HOUR_START) * 60 + (m || 0);
  return Math.min(Math.max(Math.round(rawMinutes / 15), 0), TOTAL_SUBROWS);
}

function TaskChip({
  task,
  viewerId,
  showTime = true,
  showDelete = false,
}: {
  task: WeeklyTask;
  viewerId: string;
  showTime?: boolean;
  showDelete?: boolean;
}) {
  const isMine = task.userId === viewerId;
  const color = task.user?.avatarColor ?? '#8B85FF';
  return (
    <div
      className={cn(
        'group/chip flex items-center gap-1 rounded px-1 py-[2px] md:px-1.5 md:py-[3px] text-left overflow-hidden',
        task.done && 'opacity-50'
      )}
      style={{ backgroundColor: `${color}26` }}
    >
      <button
        onClick={() => isMine && setWeeklyTaskDone(task.id, !task.done)}
        disabled={!isMine}
        className={cn(
          'font-semibold truncate flex-1 min-w-0 text-left leading-tight',
          task.done ? 'line-through text-gray-500' : ''
        )}
        style={{ color: task.done ? undefined : color, fontSize: 'var(--chip-text)' }}
        title={task.time ? `${formatTimeRange(task)} ${task.text}` : task.text}
      >
        {showTime && task.time && <span className="tabular-nums mr-1">{task.time}</span>}
        {task.text}
      </button>
      {isMine && showDelete && (
        <button
          onClick={() => deleteWeeklyTask(task.id)}
          className="text-gray-500 hover:text-red-400 flex-shrink-0"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export function SharedCalendarPlanner({ viewerId, mode = 'personal', participants }: SharedCalendarPlannerProps) {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey());
  const todayKey = getCurrentDayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'partner'>('all');

  const weekDays = useMemo(() => getWeekDays(weekKey), [weekKey]);
  const weekStartMonth = getMonthKey(weekDays[0]);
  const weekEndMonth = getMonthKey(weekDays[6]);

  const { tasks: monthTasksA } = useMonthTasks(view === 'month' ? monthKey : weekStartMonth);
  const { tasks: monthTasksB } = useMonthTasks(weekEndMonth);

  const allTasks = useMemo(() => {
    if (view === 'month' || weekStartMonth === weekEndMonth) return monthTasksA;
    const map = new Map<string, WeeklyTask>();
    for (const t of monthTasksA) map.set(t.id, t);
    for (const t of monthTasksB) map.set(t.id, t);
    return Array.from(map.values());
  }, [view, weekStartMonth, weekEndMonth, monthTasksA, monthTasksB]);

  const partner = participants?.find((p) => p.id !== viewerId);

  const tasks = useMemo(() => {
    if (mode === 'personal') return allTasks.filter((t) => t.userId === viewerId);
    if (filter === 'mine') return allTasks.filter((t) => t.userId === viewerId);
    if (filter === 'partner') return allTasks.filter((t) => t.userId !== viewerId);
    return allTasks;
  }, [allTasks, mode, filter, viewerId]);

  const monthDays = useMemo(() => getMonthGridDays(monthKey), [monthKey]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, WeeklyTask[]>();
    for (const t of tasks) {
      const list = map.get(t.dateKey) ?? [];
      list.push(t);
      map.set(t.dateKey, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
    }
    return map;
  }, [tasks]);

  const currentMonthNum = Number(monthKey.split('-')[1]);
  const selectedDate = new Date(selectedDay + 'T00:00:00Z');

  const agendaDays = useMemo(() => {
    if (view === 'week') {
      return weekDays.map(getDayKey).filter((k) => (tasksByDay.get(k) ?? []).length > 0);
    }
    return Array.from(tasksByDay.keys())
      .filter((k) => k.startsWith(monthKey))
      .sort();
  }, [view, weekDays, tasksByDay, monthKey]);

  return (
    <div
      className={cn(
        'space-y-5',
        '[--cell-min:64px] [--chip-text:8px] [--daynum:20px] [--daynum-text:11px]',
        '[--hourcol:28px] [--subrow:15px] [--hour-text:7px] [--block-text:9px] [--dayhead-text:9px] [--daynum2:24px]',
        'md:[--cell-min:110px] md:[--chip-text:11px] md:[--daynum:28px] md:[--daynum-text:13px]',
        'md:[--hourcol:52px] md:[--subrow:24px] md:[--hour-text:11px] md:[--block-text:12px] md:[--dayhead-text:11px] md:[--daynum2:30px]',
        'lg:[--cell-min:130px] lg:[--chip-text:13px] lg:[--daynum:32px] lg:[--daynum-text:15px]',
        'lg:[--hourcol:60px] lg:[--subrow:26px] lg:[--hour-text:12px] lg:[--block-text:13px] lg:[--dayhead-text:12px] lg:[--daynum2:36px]'
      )}
    >
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

      {/* View toggle */}
      <div className="flex items-center gap-1.5 bg-[#13131b] rounded-xl p-1 w-fit mx-auto">
        {([{ key: 'month' as const, label: 'Mes' }, { key: 'week' as const, label: 'Semana' }]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'week') setWeekKey(getWeekKey(selectedDate));
              if (tab.key === 'month') setMonthKey(getMonthKey(selectedDate));
              setView(tab.key);
            }}
            className={cn(
              'px-5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              view === tab.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'month' ? (
        <>
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

          {/* Month grid — Google Calendar style, tasks shown inline in each day cell */}
          <div className="w-full border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 bg-white/[0.02]">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-gray-600 py-2 tracking-wide">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dateKey = getDayKey(day);
                const inMonth = day.getUTCMonth() + 1 === currentMonthNum;
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDay;
                const dayTasks = tasksByDay.get(dateKey) ?? [];
                const visibleTasks = dayTasks.slice(0, 2);
                const overflow = dayTasks.length - visibleTasks.length;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(dateKey)}
                    className={cn(
                      'flex flex-col items-stretch gap-0.5 p-1 md:p-1.5 border-t border-l border-white/[0.05] text-left',
                      (i + 1) % 7 === 0 && 'border-r',
                      isSelected && 'bg-violet-600/10'
                    )}
                    style={{ minHeight: 'var(--cell-min)' }}
                  >
                    <span
                      className={cn(
                        'font-semibold tabular-nums flex items-center justify-center rounded-full flex-shrink-0',
                        isToday
                          ? 'bg-violet-600 text-white'
                          : inMonth
                          ? 'text-gray-300'
                          : 'text-gray-700'
                      )}
                      style={{ width: 'var(--daynum)', height: 'var(--daynum)', fontSize: 'var(--daynum-text)' }}
                    >
                      {day.getUTCDate()}
                    </span>
                    <div className="space-y-0.5 md:space-y-1 min-w-0">
                      {visibleTasks.map((t) => (
                        <TaskChip key={t.id} task={t} viewerId={viewerId} showTime={false} />
                      ))}
                      {overflow > 0 && (
                        <p className="text-gray-500 pl-1 font-medium" style={{ fontSize: 'var(--chip-text)' }}>+{overflow} más</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Week header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekKey(getPrevWeekKey(weekKey))}
              className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 flex-shrink-0"
            >
              <ChevronLeft size={15} />
            </button>
            <p className="text-[13px] font-bold text-white capitalize tracking-tight">
              {MONTH_SHORT[weekDays[0].getUTCMonth()]} {weekDays[0].getUTCDate()} – {MONTH_SHORT[weekDays[6].getUTCMonth()]} {weekDays[6].getUTCDate()}, {weekDays[6].getUTCFullYear()}
            </p>
            <button
              onClick={() => setWeekKey(getNextWeekKey(weekKey))}
              className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 flex-shrink-0"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Week grid — hourly, Google Calendar style */}
          <div className="border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <div
                className="grid w-full min-w-[290px] md:min-w-[640px]"
                style={{
                  gridTemplateColumns: `var(--hourcol) repeat(7, minmax(0, 1fr))`,
                  gridTemplateRows: `auto auto repeat(${TOTAL_SUBROWS}, var(--subrow))`,
                }}
              >
                {/* Day headers */}
                <div className="bg-white/[0.02] border-b border-white/[0.06]" style={{ gridColumn: 1, gridRow: 1 }} />
                {weekDays.map((day, i) => {
                  const dateKey = getDayKey(day);
                  const isToday = dateKey === todayKey;
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDay(dateKey)}
                      className="flex flex-col items-center justify-center gap-0.5 py-1.5 md:py-2.5 bg-white/[0.02] border-b border-l border-white/[0.06]"
                      style={{ gridColumn: i + 2, gridRow: 1 }}
                    >
                      <span
                        className={cn('font-bold uppercase', isToday ? 'text-violet-400' : 'text-gray-500')}
                        style={{ fontSize: 'var(--dayhead-text)' }}
                      >
                        {WEEKDAY_SHORT[day.getUTCDay()]}
                      </span>
                      <span
                        className={cn(
                          'font-bold flex items-center justify-center rounded-full',
                          isToday ? 'bg-violet-600 text-white' : dateKey === selectedDay ? 'ring-1 ring-violet-500 text-white' : 'text-gray-300'
                        )}
                        style={{ width: 'var(--daynum2)', height: 'var(--daynum2)', fontSize: 'var(--dayhead-text)' }}
                      >
                        {day.getUTCDate()}
                      </span>
                    </button>
                  );
                })}

                {/* Untimed tasks strip */}
                <div className="bg-white/[0.02] border-b border-white/[0.06]" style={{ gridColumn: 1, gridRow: 2 }} />
                {weekDays.map((day, i) => {
                  const dateKey = getDayKey(day);
                  const untimed = (tasksByDay.get(dateKey) ?? []).filter((t) => !t.time);
                  return (
                    <div
                      key={dateKey}
                      className="border-b border-l border-white/[0.06] bg-white/[0.02] p-0.5 space-y-0.5 min-h-[4px]"
                      style={{ gridColumn: i + 2, gridRow: 2 }}
                    >
                      {untimed.map((t) => (
                        <TaskChip key={t.id} task={t} viewerId={viewerId} showDelete />
                      ))}
                    </div>
                  );
                })}

                {/* Hour labels + gridlines */}
                {Array.from({ length: TOTAL_HOURS }, (_, hourIdx) => {
                  const hour = HOUR_START + hourIdx;
                  const rowStart = 3 + hourIdx * SUBROWS_PER_HOUR;
                  return (
                    <span
                      key={`label-${hour}`}
                      className="text-gray-600 font-medium block -translate-y-1/2 pr-0.5 md:pr-1.5 text-right leading-none"
                      style={{
                        gridColumn: 1,
                        gridRow: `${rowStart} / span ${SUBROWS_PER_HOUR}`,
                        fontSize: 'var(--hour-text)',
                      }}
                    >
                      {formatHourLabel(hour)}
                    </span>
                  );
                })}
                {Array.from({ length: TOTAL_HOURS }, (_, hourIdx) =>
                  weekDays.map((_, dayIdx) => (
                    <div
                      key={`line-${hourIdx}-${dayIdx}`}
                      className="border-t border-l border-white/[0.05]"
                      style={{
                        gridColumn: dayIdx + 2,
                        gridRow: `${3 + hourIdx * SUBROWS_PER_HOUR} / span ${SUBROWS_PER_HOUR}`,
                      }}
                    />
                  ))
                )}

                {/* Timed tasks positioned by hour/minute */}
                {weekDays.map((day, dayIdx) => {
                  const dateKey = getDayKey(day);
                  const timed = (tasksByDay.get(dateKey) ?? []).filter((t) => t.time);
                  return timed.map((t) => {
                    const startSubrow = timeToSubrow(t.time as string);
                    const endSubrow = t.endTime ? timeToSubrow(t.endTime) : startSubrow + 3;
                    const rowStart = 3 + startSubrow;
                    const rowSpan = Math.min(TOTAL_SUBROWS - startSubrow, Math.max(1, endSubrow - startSubrow));
                    const color = t.user?.avatarColor ?? '#8B85FF';
                    return (
                      <div
                        key={t.id}
                        className="relative mx-[1px] md:mx-[2px] rounded-md px-1 py-0.5 md:px-1.5 md:py-1 cursor-pointer group/block"
                        style={{
                          gridColumn: dayIdx + 2,
                          gridRow: `${rowStart} / span ${Math.max(1, rowSpan)}`,
                          backgroundColor: `${color}33`,
                          borderLeft: `2px solid ${color}`,
                        }}
                        onClick={() => t.userId === viewerId && setWeeklyTaskDone(t.id, !t.done)}
                      >
                        <p
                          className={cn('font-semibold leading-tight truncate', t.done && 'line-through text-gray-500')}
                          style={{ color: t.done ? undefined : color, fontSize: 'var(--block-text)' }}
                        >
                          {formatTimeRange(t)} {t.text}
                        </p>
                        {t.userId === viewerId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWeeklyTask(t.id);
                            }}
                            className="absolute top-0 right-0 text-gray-400 hover:text-red-400 opacity-0 group-hover/block:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add button for the selected day */}
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-violet-200 text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        <Plus size={16} />
        Agregar para {WEEKDAY_SHORT[selectedDate.getUTCDay()]} {selectedDate.getUTCDate()}
      </button>

      {/* Agenda list */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <CalendarDays size={12} className="text-gray-600" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            {view === 'week' ? 'Agenda de la semana' : 'Agenda del mes'}
          </p>
        </div>

        {agendaDays.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">Sin pendientes {view === 'week' ? 'esta semana' : 'este mes'}</p>
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
                                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium tabular-nums">
                                  <Clock size={10} />
                                  {formatTimeRange(task)}
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
  const [endTime, setEndTime] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const timeRangeInvalid = !!time && !!endTime && endTime <= time;

  async function handleAdd() {
    if (!text.trim() || timeRangeInvalid) return;
    setSaving(true);
    setError('');
    try {
      await createWeeklyTask(dateKey, text.trim(), time, repeat ? repeatWeeks : 1, time ? endTime : '');
      onClose();
    } catch (err) {
      setError((err as Error).message || 'No se pudo agregar el pendiente.');
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

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-400 mb-2 block">Hora de inicio</label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (!e.target.value) setEndTime('');
                }}
                className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-400 mb-2 block">Hora de fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!time}
                className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-40"
              />
            </div>
          </div>

          {timeRangeInvalid && (
            <p className="text-red-400 text-xs -mt-2">La hora de fin debe ser después de la hora de inicio.</p>
          )}

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

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#22223A] text-white text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim() || saving || timeRangeInvalid}
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
