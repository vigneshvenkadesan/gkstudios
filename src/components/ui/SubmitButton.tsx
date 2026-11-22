'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

/**
 * Reusable Submit/Action Button with loading spinner, dynamic loading text,
 * and automatic double-click prevention (disabled + aria-busy + pointer-events-none).
 */
export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      icon,
      disabled,
      className,
      type = 'submit',
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          isLoading && 'pointer-events-none opacity-80 cursor-not-allowed select-none',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || 'Saving...'}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </Button>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';
