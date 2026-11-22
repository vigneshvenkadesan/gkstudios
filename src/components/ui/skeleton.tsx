import React from 'react';
import { cn } from '@/src/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-sm bg-[#0E423E]/60 border border-[#C5B378]/10',
        className
      )}
      {...props}
    />
  );
}

export function PackageCardSkeleton() {
  return (
    <div className="rounded-sm border border-[#C5B378]/20 bg-[#061E1C]/90 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-5/6 rounded" />
        <Skeleton className="h-3 w-4/6 rounded" />
        <Skeleton className="h-3 w-3/6 rounded" />
      </div>
      <div className="pt-4 border-t border-[#C5B378]/10 flex items-center justify-between">
        <Skeleton className="h-7 w-28 rounded" />
        <Skeleton className="h-9 w-24 rounded" />
      </div>
    </div>
  );
}
