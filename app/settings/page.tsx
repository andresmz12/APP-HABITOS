'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { updateProfile, logout, getRecoveryCode } from '@/lib/firebase/auth';
import { User } from '@/lib/types/models';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { Modal } from '@/components/ui/Modal';
import { AVATAR_COLORS } from '@/lib/utils/constants';
import { Bell, BellOff, Pencil, Mail, Heart, LogOut, Copy, Check, KeyRound } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';

export default function SettingsPage() {
  const router = useRouter();
  const { user, partner, loading: sessionLoading } = useSession();
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [loadingRecovery, setLoadingRecovery] = useState(false);

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

  function openEdit() {
    setDraft({ ...user! });
    setSaveError('');
    setEditOpen(true);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile({
        name: draft.name,
        avatarColor: draft.avatarColor,
        notificationEmail: draft.notificationEmail,
        reminderTime: draft.reminderTime,
        notificationsEnabled: draft.notificationsEnabled,
      });
      setEditOpen(false);
    } catch {
      setSaveError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function requestNotificationPermission() {
    if (!draft) return;
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setDraft({ ...draft, notificationsEnabled: true });
    } else {
      alert('Para recibir notificaciones, permite el permiso en tu navegador.');
    }
  }

  function handleCopyCode() {
    if (!user?.pairCode) return;
    navigator.clipboard?.writeText(user.pairCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleLogout() {
    if (!confirm('¿Cerrar sesión en este dispositivo?')) return;
    await logout();
    router.push('/onboarding');
  }

  async function handleShowRecoveryCode() {
    if (recoveryCode) {
      setRecoveryCode(null);
      return;
    }
    setLoadingRecovery(true);
    try {
      const code = await getRecoveryCode();
      setRecoveryCode(code);
    } finally {
      setLoadingRecovery(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-4 space-y-5">
        <h1 className="text-white text-2xl font-black">Ajustes</h1>

        {/* My profile card */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">
            Mi perfil
          </p>
          <button
            onClick={openEdit}
            className="w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
            style={{ border: `1px solid ${user.avatarColor}30` }}
          >
            <div
              className="px-5 py-4 flex items-center gap-4"
              style={{ background: `linear-gradient(135deg, ${user.avatarColor}30 0%, ${user.avatarColor}10 100%)` }}
            >
              <Avatar color={user.avatarColor} name={user.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {user.notificationsEnabled && user.notificationEmail ? (
                    <>
                      <Bell size={11} style={{ color: user.avatarColor }} />
                      <span className="text-xs font-medium" style={{ color: user.avatarColor }}>
                        {user.reminderTime}
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
                style={{ backgroundColor: user.avatarColor + '20', color: user.avatarColor }}
              >
                <Pencil size={11} />
                Editar
              </div>
            </div>
          </button>
        </div>

        {/* Pairing status */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">
            Pareja
          </p>
          {partner ? (
            <div className="bg-[#1A1A24] rounded-2xl px-5 py-4 flex items-center gap-3 border border-white/5">
              <Avatar color={partner.avatarColor} name={partner.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Vinculado con {partner.name}</p>
                <p className="text-gray-600 text-xs">Comparten hábitos y plan semanal</p>
              </div>
              <Heart size={16} className="text-pink-400" fill="currentColor" />
            </div>
          ) : (
            <div className="bg-[#1A1A24] rounded-2xl px-5 py-4 space-y-3 border border-violet-500/20">
              <p className="text-gray-300 text-sm">Comparte este código con tu pareja para vincularla</p>
              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#0F0F14]"
              >
                <span className="text-2xl font-black text-white tracking-[0.3em]">{user.pairCode}</span>
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={14} className="text-gray-500" />}
              </button>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">
            Cuenta
          </p>
          <button
            onClick={handleShowRecoveryCode}
            disabled={loadingRecovery}
            className="w-full bg-[#1A1A24] rounded-2xl px-5 py-4 text-left border border-white/5 active:scale-[0.98] transition-transform flex items-center gap-3"
          >
            <KeyRound size={16} className="text-violet-400" />
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                {loadingRecovery ? 'Cargando...' : recoveryCode ? 'Ocultar código' : 'Ver código de recuperación'}
              </p>
              <p className="text-gray-600 text-xs mt-0.5">Úsalo si pierdes este dispositivo</p>
            </div>
          </button>
          {recoveryCode && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(recoveryCode).then(() => {
                  setRecoveryCopied(true);
                  setTimeout(() => setRecoveryCopied(false), 1500);
                });
              }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#1A1A24] border border-violet-500/30"
            >
              <span className="text-base font-black text-white tracking-widest">{recoveryCode}</span>
              {recoveryCopied ? <Check size={16} className="text-green-400" /> : <Copy size={14} className="text-gray-500" />}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-[#1A1A24] rounded-2xl px-5 py-4 text-left border border-white/5 active:scale-[0.98] transition-transform flex items-center gap-3"
          >
            <LogOut size={16} className="text-red-400" />
            <div>
              <p className="text-gray-300 text-sm font-semibold">Cerrar sesión</p>
              <p className="text-gray-600 text-xs mt-0.5">Salir de este perfil en este dispositivo</p>
            </div>
          </button>
        </div>
      </div>

      {/* Edit profile modal */}
      {editOpen && draft && (
        <ProfileEditModal
          draft={draft}
          onChange={setDraft}
          onSave={handleSave}
          onRequestNotif={requestNotificationPermission}
          saving={saving}
          saveError={saveError}
          onClose={() => setEditOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

function ProfileEditModal({
  draft,
  onChange,
  onSave,
  onRequestNotif,
  saving,
  saveError,
  onClose,
}: {
  draft: User;
  onChange: (u: User) => void;
  onSave: () => void;
  onRequestNotif: () => void;
  saving: boolean;
  saveError: string;
  onClose: () => void;
}) {
  return (
    <Modal open title="Editar perfil" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex justify-center">
          <Avatar color={draft.avatarColor} name={draft.name || '?'} size="xl" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
            Nombre
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            maxLength={20}
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 mb-3 block uppercase tracking-wider">
            Color
          </label>
          <div className="flex gap-3 flex-wrap">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ ...draft, avatarColor: color })}
                className={cn(
                  'w-9 h-9 rounded-full transition-all',
                  draft.avatarColor === color &&
                    'ring-2 ring-white ring-offset-2 ring-offset-[#1A1A24] scale-110'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
            Email para recordatorios
          </label>
          <div className="flex items-center gap-2 bg-[#22223A] rounded-xl px-4 py-3">
            <Mail size={14} className="text-gray-500 flex-shrink-0" />
            <input
              type="email"
              value={draft.notificationEmail ?? ''}
              onChange={(e) => onChange({ ...draft, notificationEmail: e.target.value })}
              placeholder="correo@ejemplo.com"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
            Hora de recordatorio
          </label>
          <input
            type="time"
            value={draft.reminderTime}
            onChange={(e) => onChange({ ...draft, reminderTime: e.target.value })}
            className="w-full bg-[#22223A] rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center justify-between bg-[#22223A] rounded-xl px-4 py-3">
          <div>
            <p className="text-white text-sm font-semibold">Notificaciones</p>
            <p className="text-gray-500 text-xs">Recordatorio diario</p>
          </div>
          <button
            onClick={() => {
              if (!draft.notificationsEnabled) onRequestNotif();
              else onChange({ ...draft, notificationsEnabled: false });
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              draft.notificationsEnabled ? 'text-white' : 'bg-[#2a2a44] text-gray-400'
            )}
            style={draft.notificationsEnabled ? { backgroundColor: draft.avatarColor, color: 'white' } : {}}
          >
            {draft.notificationsEnabled ? (
              <><Bell size={14} /> On</>
            ) : (
              <><BellOff size={14} /> Off</>
            )}
          </button>
        </div>

        {saveError && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            {saveError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            loading={saving}
            disabled={!draft.name.trim()}
            className="flex-1"
            style={{ backgroundColor: draft.avatarColor }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
