import React from 'react';
import { cn } from '../../lib/utils';
import { TransactionStatus } from '../../types/api';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  status?: TransactionStatus;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  children,
  ...props
}) => {
  let computedVariant = variant;
  let displayContent = children;

  if (status) {
    switch (status) {
      case 'CONFIRMED':
        computedVariant = 'success';
        displayContent = children || 'Confirmed';
        break;
      case 'PENDING_CONFIRMATION':
        computedVariant = 'warning';
        displayContent = children || 'Pending Review';
        break;
      case 'MANUAL':
        computedVariant = 'info';
        displayContent = children || 'Manual';
        break;
    }
  }

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700/70',
    neutral: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    info: 'bg-sky-950/60 text-sky-300 border-sky-800/50',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variantStyles[computedVariant],
        className
      )}
      {...props}
    >
      {/* Subtle indicator dot for status badges */}
      {status === 'CONFIRMED' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
      {status === 'PENDING_CONFIRMATION' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      {status === 'MANUAL' && (
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
      )}
      {displayContent}
    </span>
  );
};
