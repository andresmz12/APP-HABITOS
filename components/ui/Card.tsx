import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#1A1A24] rounded-2xl p-4',
        onClick && 'cursor-pointer hover:bg-[#1e1e2a] transition-colors active:scale-[0.99]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
