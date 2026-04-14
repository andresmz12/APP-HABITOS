'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check } from 'lucide-react';

interface PhotoModalProps {
  habitName: string;
  color: string;
  onConfirm: (photoUrl: string) => void;
  onCancel: () => void;
}

async function compressImage(file: File): Promise<string> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
  URL.revokeObjectURL(url);

  const MAX = 400;
  let w = img.width;
  let h = img.height;
  if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
  else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.7);
}

export function PhotoModal({ habitName, color, onConfirm, onCancel }: PhotoModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

        {/* Sheet */}
        <motion.div
          className="relative bg-[#111118] rounded-t-3xl p-6 space-y-5"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1" />

          <div className="text-center space-y-1">
            <p className="text-white font-bold text-lg">Sube una foto</p>
            <p className="text-gray-500 text-sm">
              Comprueba que completaste{' '}
              <span className="font-semibold" style={{ color }}>{habitName}</span>
            </p>
          </div>

          {/* Preview or picker */}
          {preview ? (
            <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border-2"
              style={{ borderColor: color }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X size={14} color="white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-3 transition-colors"
              style={{ borderColor: color + '60', backgroundColor: color + '10' }}
            >
              {loading ? (
                <span className="text-2xl animate-spin">⟳</span>
              ) : (
                <>
                  <Camera size={32} style={{ color }} />
                  <span className="text-sm font-medium" style={{ color }}>
                    Tomar foto o elegir de galería
                  </span>
                </>
              )}
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-gray-400 bg-white/5 border border-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={() => preview && onConfirm(preview)}
              disabled={!preview}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-30"
              style={{ backgroundColor: color }}
            >
              <Check size={18} /> Confirmar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
