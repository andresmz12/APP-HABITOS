'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircleHeart } from 'lucide-react';
import { useNotes } from '@/lib/hooks/useNotes';
import { createNote, deleteNote } from '@/lib/firebase/notes';
import { Avatar } from '@/components/ui/Avatar';

interface CoupleNotesProps {
  viewerId: string;
}

function timeAgo(dateStr: string | Date): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function CoupleNotes({ viewerId }: CoupleNotesProps) {
  const { notes } = useNotes();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await createNote(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Déjale un mensaje a tu pareja..."
          maxLength={280}
          className="flex-1 bg-[#1A1A24] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6">
          <MessageCircleHeart size={22} className="text-gray-700 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Sin mensajes todavía</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {notes.map((note) => {
              const isMine = note.authorId === viewerId;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="group flex items-start gap-2.5 bg-[#1A1A24] rounded-2xl px-3.5 py-3"
                >
                  {note.author && <Avatar color={note.author.avatarColor} name={note.author.name} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs font-semibold">{note.author?.name}</span>
                      <span className="text-gray-700 text-[10px]">{timeAgo(note.createdAt)}</span>
                    </div>
                    <p className="text-gray-100 text-sm mt-0.5 break-words">{note.text}</p>
                  </div>
                  {isMine && (
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
