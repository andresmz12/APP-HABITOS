'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/stores/appStore';
import { updatePartner } from '@/lib/firebase/appConfig';
import { Partner } from '@/lib/types/models';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { Modal } from '@/components/ui/Modal';
import { AVATAR_COLORS, HABIT_EMOJIS } from '@/lib/utils/constants';
import { Bell, BellOff, Pencil } from 'lucide-react';
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
      setAppConfig({ ...appConfig, [partner.id]: partner });
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
      <div className="px-4 pt-12 pb-4 space-y-5">
        <h1 className="text-white text-2xl font-black">Ajustes</h1>

        {/* Partner profile cards */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">
            Perfiles
          </p>
          {([appConfig.partner1, appConfig.partner2] as Partner[]).map((partner) => (
            <button
              key={partner.id}
              onClick={() => setEditPartner({ ...partner })}
              className="w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
              style={{ border: `1px solid ${partner.avatarColor}30` }}
            >
              {/* Gradient header band */}
              <div
                className="px-5 py-4 flex items-center gap-4"
                style={{
                  background: `linear-gradient(135deg, ${partner.avatarColor}30 0%, ${partner.avatarColor}10 100%)`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                  style={{
                    backgroundColor: partner.avatarColor + '22',
                    border: `2px solid ${partner.avatarColor}`,
                    boxShadow: `0 0 16px ${partner.avatarColor}44`,
                  }}
                >
                  {partner.avatarEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-lg leading-tight truncate">
                    {partner.name}
                  </p>
                  {/* Notification badge */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {partner.notificationsEnabled ? (
                      <>
                        <Bell size={11} style={{ color: partner.avatarColor }} />
                        <span className="text-xs font-medium" style={{ color: partner.avatarColor }}>
                          {partner.notificationTime}
                        </span>
                      </>
                    ) : (
                      <>
                        <BellOff size={11} className="text-gray-600" />
                        <span className="text-xs text-gray-600">Sin recordatorio</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: partner.avatarColor + '20', color: partner.avatarColor }}
                >
                  <Pencil size={11} />
                  Editar
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Reset onboarding */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">
            Datos
          </p>
          <button
            onClick={() => {
              if (confirm('¿Ir al onboarding de nuevo? Los datos existentes se conservarán.'))
                router.push('/onboarding');
            }}
            className="w-full bg-[#1A1A24] rounded-2xl px-5 py-4 text-left border border-white/5 active:scale-[0.98] transition-transform"
          >
            <p className="text-gray-300 text-sm font-semibold">Cambiar nombres y avatares</p>
            <p className="text-gray-600 text-xs mt-0.5">Vuelve a la pantalla inicial</p>
          </button>
        </div>
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
    <Modal open title={`Editar perfil`} onClose={onClose}>
      <div className="space-y-5">
        {/* Live preview */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 transition-all duration-200"
            style={{
              backgroundColor: partner.avatarColor + '22',
              borderColor: partner.avatarColor,
              boxShadow: `0 0 24px ${partner.avatarColor}55`,
            }}
          >
            {partner.avatarEmoji}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
            Nombre
          </label>
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
          <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
            Avatar
          </label>
          <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onChange({ ...partner, avatarEmoji: e })}
                className={cn(
                  'h-11 rounded-xl text-xl flex items-center justify-center transition-all',
                  partner.avatarEmoji === e
                    ? 'scale-110 ring-2'
                    : 'bg-[#22223A] hover:bg-[#2a2a44]'
                )}
                style={
                  partner.avatarEmoji === e
                    ? { backgroundColor: partner.avatarColor + '30', outlineColor: partner.avatarColor }
                    : {}
                }
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-3 block uppercase tracking-wider">
            Color
          </label>
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
          <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
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
        <div className="flex items-center justify-between bg-[#22223A] rounded-xl px-4 py-3">
          <div>
            <p className="text-white text-sm font-semibold">Notificaciones</p>
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
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              partner.notificationsEnabled
                ? 'text-white'
                : 'bg-[#2a2a44] text-gray-400'
            )}
            style={
              partner.notificationsEnabled
                ? { backgroundColor: partner.avatarColor, color: 'white' }
                : {}
            }
          >
            {partner.notificationsEnabled ? (
              <><Bell size={14} /> On</>
            ) : (
              <><BellOff size={14} /> Off</>
            )}
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            loading={saving}
            disabled={!partner.name.trim()}
            className="flex-1"
            style={{ backgroundColor: partner.avatarColor }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
