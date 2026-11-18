import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#092E2B] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]',
        outline:
          'border border-[#C5B378]/45 bg-transparent text-[#E6ECEB] hover:border-[#D8C78E] hover:bg-[#C5B378]/10 hover:text-white',
        secondary:
          'bg-[#134E49] text-[#E6ECEB] border border-[#C5B378]/20 hover:bg-[#195E58] hover:text-white',
        ghost: 'text-[#E6ECEB] hover:bg-[#134E49]/70 hover:text-white',
        destructive: 'bg-red-700/90 text-white hover:bg-red-600',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-3.5 text-xs',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
