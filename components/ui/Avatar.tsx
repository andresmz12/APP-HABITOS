import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  emoji: string;
  color: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-3xl',
};

export function Avatar({ emoji, color, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color + '33', border: `2px solid ${color}` }}
      title={name}
    >
      <span>{emoji}</span>
    </div>
  );
}
