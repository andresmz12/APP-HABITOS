'use client';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  className?: string;
  label?: string;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  color,
  className,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(100, Math.max(0, percentage));
  const dashOffset = circumference - (filled / 100) * circumference;
  const center = size / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {label && (
        <span
          className="absolute text-xs font-bold"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
