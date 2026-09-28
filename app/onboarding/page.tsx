'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProfile, joinWithCode, login } from '@/lib/firebase/auth';
import { AVATAR_COLORS } from '@/lib/utils/constants';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Check, Copy, ArrowLeft, LogIn } from 'lucide-react';

type Mode = 'choose' | 'create' | 'join' | 'login' | 'created';

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2.5 flex-wrap justify-center">
      {AVATAR_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-8 h-8 rounded-full transition-all duration-150"
          style={{
            backgroundColor: c,
            transform: value === c ? 'scale(1.25)' : 'scale(1)',
            outline: value === c ? '2px solid white' : 'none',
            outlineOffset: '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [myPairCode, setMyPairCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPair, setCopiedPair] = useState(false);

  const canSubmitCreate = name.trim().length > 0 && username.trim().length >= 3 && password.length >= 6 && !loading;
  const canSubmitJoin = canSubmitCreate && code.trim().length >= 4;
  const canSubmitLogin = username.trim().length > 0 && password.length > 0 && !loading;

  async function handleCreate() {
    if (!canSubmitCreate) return;
    setLoading(true);
    setError('');
    try {
      const user = await createProfile(name.trim(), color, username.trim(), password);
      setMyPairCode(user.pairCode ?? '');
      setMode('created');
    } catch (err) {
      setError((err as Error).message || 'No se pudo crear tu perfil. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!canSubmitJoin) return;
    setLoading(true);
    setError('');
    try {
      await joinWithCode(name.trim(), color, username.trim(), password, code.trim());
      router.push('/home');
    } catch (err) {
      setError((err as Error).message || 'No se pudo vincular. Revisa el código.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!canSubmitLogin) return;
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      router.push('/home');
    } catch (err) {
      setError((err as Error).message || 'Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  function copyPairCode() {
    navigator.clipboard?.writeText(myPairCode).then(() => {
      setCopiedPair(true);
      setTimeout(() => setCopiedPair(false), 1500);
    });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-5 py-10 gap-8">
      <div className="text-center space-y-2 flex flex-col items-center">
        <Logo size="lg" />
        <h1 className="text-3xl font-black text-white tracking-tight mt-3">Hábitos en Pareja</h1>
        <p className="text-gray-500 text-sm">Construyan rutinas juntos, compitan con amor</p>
      </div>

      {mode === 'choose' && (
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => setMode('create')}
            className="w-full py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-br from-violet-600 to-pink-500 active:scale-95 transition-transform"
          >
            Crear mi perfil
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full py-4 rounded-2xl font-bold text-gray-200 text-base bg-[#1A1A24] border border-white/10 active:scale-95 transition-transform"
          >
            Ya tengo un código de pareja
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            <LogIn size={13} />
            Ya tengo cuenta, iniciar sesión
          </button>
        </div>
      )}

      {mode === 'login' && (
        <div className="w-full max-w-sm space-y-5">
          <button
            onClick={() => { setMode('choose'); setError(''); }}
            className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={14} /> Volver
          </button>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              autoFocus
              autoCapitalize="none"
              className="w-full bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={!canSubmitLogin}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 disabled:opacity-30 bg-gradient-to-br from-violet-600 to-pink-500"
          >
            {loading ? <span className="inline-block animate-spin">⟳</span> : 'Iniciar sesión'}
          </button>
        </div>
      )}

      {(mode === 'create' || mode === 'join') && (
        <div className="w-full max-w-sm space-y-5">
          <button
            onClick={() => { setMode('choose'); setError(''); }}
            className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={14} /> Volver
          </button>

          <div className="flex justify-center">
            <Avatar color={color} name={name || '?'} size="xl" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
              Tu nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              maxLength={20}
              autoFocus
              className="w-full bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
              Color
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              autoCapitalize="none"
              className="w-full bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <p className="text-gray-600 text-xs mt-1.5">Con esto entras desde cualquier dispositivo</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          {mode === 'join' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
                Código de tu pareja
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:ring-1 focus:ring-violet-500 transition-all tracking-[0.3em] text-center font-bold uppercase"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
              {error}
            </p>
          )}

          <button
            onClick={mode === 'create' ? handleCreate : handleJoin}
            disabled={mode === 'create' ? !canSubmitCreate : !canSubmitJoin}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${color}, #FF6B9D)` }}
          >
            {loading ? <span className="inline-block animate-spin">⟳</span> : mode === 'create' ? 'Crear perfil' : 'Vincular con mi pareja'}
          </button>
        </div>
      )}

      {mode === 'created' && (
        <div className="w-full max-w-sm space-y-5 text-center">
          <p className="text-gray-400 text-sm">
            ¡Listo, {name.trim()}! Comparte este código con tu pareja para que se vincule contigo.
          </p>

          <button
            onClick={copyPairCode}
            className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl bg-[#1A1A24] border border-violet-500/30"
          >
            <span className="text-4xl font-black text-white tracking-[0.3em]">{myPairCode}</span>
            {copiedPair ? <Check size={20} className="text-green-400" /> : <Copy size={18} className="text-gray-500" />}
          </button>

          <p className="text-gray-600 text-xs px-2">
            Con tu usuario y contraseña puedes entrar desde cualquier celular o computador, al mismo tiempo si quieres.
          </p>

          <button
            onClick={() => router.push('/home')}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-br from-violet-600 to-pink-500 active:scale-95 transition-transform"
          >
            Ir a la app
          </button>
        </div>
      )}
    </div>
  );
}
