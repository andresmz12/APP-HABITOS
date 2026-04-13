'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/stores/appStore';
import { updatePartner } from '@/lib/firebase/appConfig';
import { Partner } from '@/lib/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BottomNav } from '@/components/ui/BottomNav';
import { Modal } from '@/components/ui/Modal';
import { AVATAR_COLORS, HABIT_EMOJIS } from '@/lib/utils/constants';
import { Bell, BellOff, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STEP_EMOJIS = ['🧑', '👩', '🧑‍🤝‍🧑', '🐱', '🐶', '🦊', '🐼', '🦁', '🐙', '🌟'];

export default function SettingsPage() {
  const { appConfig, setAppConfig } = useAppStore();
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleSavePartner(partner: Partner) {
    if (!appConfig) return;
    setSaving(true);
    try {
      await updatePartner(partner.id, {
        name: partner.name,
        avatarEmoji: partner.avatarEmoji,
        avatarColor: partner.avatarColor,
        notificationTime: partner.notificationTime,
        notificationsEnabled: partner.notificationsEnabled,
      });
      // Update local config optimistically
      setAppConfig({
        ...appConfig,
        [partner.id]: partner,
      });
      setEditPartner(null);
    } finally {
      setSaving(false);
    }
  }

  async function requestNotificationPermission(partner: Partner) {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await handleSavePartner({ ...partner, notificationsEnabled: true });
    } else {
      alert('Para recibir notificaciones, permite el permiso en tu navegador.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      <div className="px-4 pt-12 pb-4 space-y-4">
        <h1 className="text-white text-xl font-bold">Ajustes</h1>

        {/* Partners */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            Perfiles
          </p>
          {([appConfig.partner1, appConfig.partner2] as Partner[]).map((partner) => (
            <Card
              key={partner.id}
              onClick={() => setEditPartner({ ...partner })}
              className="flex items-center gap-3"
            >
              <Avatar
                emoji={partner.avatarEmoji}
                color={partner.avatarColor}
                name={partner.name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{partner.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {partner.notificationsEnabled
                    ? `Recordatorio a las ${partner.notificationTime}`
                    : 'Sin notificaciones'}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </Card>
          ))}
        </div>

        {/* About */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            Acerca de
          </p>
          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                <Info size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Hábitos en Pareja</p>
                <p className="text-gray-500 text-xs">v1.0.0</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Para que las notificaciones push funcionen, necesitas configurar Firebase Cloud
              Messaging en tu proyecto. Los recordatorios locales funcionan sin configuración
              adicional en Chrome.
            </p>
          </Card>
        </div>

        {/* Onboarding reset (for dev) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('¿Ir al onboarding de nuevo?')) router.push('/onboarding');
          }}
          className="w-full text-gray-600 text-xs"
        >
          Reiniciar onboarding
        </Button>
      </div>

      {/* Edit partner modal */}
      {editPartner && (
        <PartnerEditModal
          partner={editPartner}
          onChange={setEditPartner}
          onSave={() => handleSavePartner(editPartner)}
          onRequestNotif={() => requestNotificationPermission(editPartner)}
          saving={saving}
          onClose={() => setEditPartner(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

function PartnerEditModal({
  partner,
  onChange,
  onSave,
  onRequestNotif,
  saving,
  onClose,
}: {
  partner: Partner;
  onChange: (p: Partner) => void;
  onSave: () => void;
  onRequestNotif: () => void;
  saving: boolean;
  onClose: () => void;
}) {
  const EMOJIS = [...STEP_EMOJIS, ...HABIT_EMOJIS.slice(0, 10)];

  return (
    <Modal open title={`Editar ${partner.name}`} onClose={onClose}>
      <div className="space-y-5">
        {/* Preview */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4"
            style={{ backgroundColor: partner.avatarColor + '33', borderColor: partner.avatarColor }}
          >
            {partner.avatarEmoji}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Nombre</label>
          <input
            type="text"
            value={partner.name}
            onChange={(e) => onChange({ ...partner, name: e.target.value })}
            maxLength={20}
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Emoji */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Emoji</label>
          <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onChange({ ...partner, avatarEmoji: e })}
                className={cn(
                  'h-11 rounded-xl text-xl flex items-center justify-center transition-all',
                  partner.avatarEmoji === e
                    ? 'bg-violet-600/40 ring-2 ring-violet-500'
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
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ ...partner, avatarColor: color })}
                className={cn(
                  'w-9 h-9 rounded-full transition-all',
                  partner.avatarColor === color &&
                    'ring-2 ring-white ring-offset-2 ring-offset-[#1A1A24] scale-110'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Notification time */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            Hora de recordatorio
          </label>
          <input
            type="time"
            value={partner.notificationTime}
            onChange={(e) => onChange({ ...partner, notificationTime: e.target.value })}
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Notificaciones</p>
            <p className="text-gray-500 text-xs">Recordatorio diario</p>
          </div>
          <button
            onClick={() => {
              if (!partner.notificationsEnabled) {
                onRequestNotif();
              } else {
                onChange({ ...partner, notificationsEnabled: false });
              }
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              partner.notificationsEnabled
                ? 'bg-violet-600/20 text-violet-400'
                : 'bg-[#22223A] text-gray-400'
            )}
          >
            {partner.notificationsEnabled ? (
              <>
                <Bell size={14} /> Activadas
              </>
            ) : (
              <>
                <BellOff size={14} /> Desactivadas
              </>
            )}
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            loading={saving}
            disabled={!partner.name.trim()}
            className="flex-1"
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
