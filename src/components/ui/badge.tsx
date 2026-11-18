import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[#C5B378]/40 bg-[#C5B378]/15 text-[#D8C78E]',
        pending: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
        acknowledged: 'border-sky-400/40 bg-sky-500/15 text-sky-200',
        confirmed: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
        declined: 'border-red-400/40 bg-red-500/15 text-red-200',
        neutral: 'border-white/15 bg-white/5 text-[#E6ECEB]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
