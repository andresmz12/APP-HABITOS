'use client';

import { useState } from 'react';
import { Habit, PartnerId } from '@/lib/types/models';
import { createHabit, updateHabit, deleteHabit } from '@/lib/firebase/habits';
import { HABIT_EMOJIS } from '@/lib/utils/constants';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils/cn';
import { Trash2 } from 'lucide-react';

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  partnerId: PartnerId;
  editHabit?: Habit;
}

export function HabitForm({ open, onClose, partnerId, editHabit }: HabitFormProps) {
  const isEdit = !!editHabit;
  const [name, setName] = useState(editHabit?.name ?? '');
  const [icon, setIcon] = useState(editHabit?.icon ?? '🏃');
  const [frequencyType, setFrequencyType] = useState(editHabit?.frequencyType ?? 'daily');
  const [frequencyDays, setFrequencyDays] = useState(editHabit?.frequencyDays ?? 7);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function reset() {
    if (!isEdit) {
      setName('');
      setIcon('🏃');
      setFrequencyType('daily');
      setFrequencyDays(7);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateHabit(editHabit.id, {
          name: name.trim(),
          icon,
          frequencyType,
          frequencyDays: frequencyType === 'daily' ? 7 : frequencyDays,
        });
      } else {
        await createHabit(partnerId, {
          name: name.trim(),
          icon,
          frequencyType,
          frequencyDays: frequencyType === 'daily' ? 7 : frequencyDays,
        });
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!editHabit || !confirm('¿Eliminar este hábito?')) return;
    setDeleting(true);
    try {
      await deleteHabit(editHabit.id);
      handleClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar hábito' : 'Nuevo hábito'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emoji picker */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Ícono</label>
          <div className="grid grid-cols-10 gap-1.5">
            {HABIT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={cn(
                  'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                  icon === e
                    ? 'bg-violet-600/40 ring-2 ring-violet-500 scale-110'
                    : 'bg-[#22223A] hover:bg-[#2a2a44]'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Ejercicio matutino"
            maxLength={40}
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            autoFocus={!isEdit}
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Frecuencia</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['daily', 'custom'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFrequencyType(type);
                  if (type === 'daily') setFrequencyDays(7);
                }}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium transition-all',
                  frequencyType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#22223A] text-gray-400 hover:bg-[#2a2a44]'
                )}
              >
                {type === 'daily' ? 'Todos los días' : 'X días/semana'}
              </button>
            ))}
          </div>

          {frequencyType === 'custom' && (
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm flex-1">Días por semana:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFrequencyDays(Math.max(1, frequencyDays - 1))}
                  className="w-8 h-8 rounded-lg bg-[#22223A] text-white text-lg flex items-center justify-center hover:bg-[#2a2a44]"
                >
                  -
                </button>
                <span className="text-white font-bold w-4 text-center">{frequencyDays}</span>
                <button
                  type="button"
                  onClick={() => setFrequencyDays(Math.min(6, frequencyDays + 1))}
                  className="w-8 h-8 rounded-lg bg-[#22223A] text-white text-lg flex items-center justify-center hover:bg-[#2a2a44]"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {isEdit && (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleDelete}
              loading={deleting}
              className="flex-shrink-0"
            >
              <Trash2 size={14} />
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!name.trim()}
            className="flex-1"
          >
            {isEdit ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
