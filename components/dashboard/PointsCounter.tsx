'use client';

import { useEffect, useState } from 'react';

interface PointsCounterProps {
  value: number;
  color: string;
  label?: string;
  className?: string;
}

export function PointsCounter({ value, color, label, className }: PointsCounterProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === displayed) return;
    const diff = value - displayed;
    const step = Math.sign(diff);
    const delay = Math.max(16, 500 / Math.abs(diff));

    const timer = setInterval(() => {
      setDisplayed((prev) => {
        const next = prev + step;
        if (step > 0 && next >= value) { clearInterval(timer); return value; }
        if (step < 0 && next <= value) { clearInterval(timer); return value; }
        return next;
      });
    }, delay);

    return () => clearInterval(timer);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex flex-col items-center ${className ?? ''}`}>
      <span
        className="text-5xl font-black tabular-nums"
        style={{ color }}
      >
        {displayed}
      </span>
      {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
    </div>
  );
}
