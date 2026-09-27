import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  emoji?: string;
  color: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function Avatar({ color, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-black text-white flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
        boxShadow: `0 2px 10px ${color}55`,
      }}
      title={name}
    >
      <span>{getInitial(name)}</span>
    </div>
  );
}
