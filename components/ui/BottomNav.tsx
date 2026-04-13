'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/home', icon: Home, label: 'Hoy' },
  { href: '/together', icon: Users, label: 'Juntos' },
  { href: '/settings', icon: Settings, label: 'Ajustes' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0F0F14]/95 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                active ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon
                size={22}
                className={active ? 'text-violet-400' : ''}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn('text-[10px] font-medium', active ? 'text-violet-400' : '')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
