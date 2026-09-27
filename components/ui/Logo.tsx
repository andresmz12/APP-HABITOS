import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const sizeClasses = {
  md: 'w-14 h-14 rounded-2xl',
  lg: 'w-20 h-20 rounded-[28px]',
};

interface LogoProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)',
        boxShadow: '0 8px 24px rgba(108,99,255,0.35)',
      }}
    >
      <Heart
        size={size === 'lg' ? 34 : 24}
        color="white"
        fill="white"
        strokeWidth={0}
      />
    </div>
  );
}
