'use client';

import React from 'react';

export function PackageCardSkeleton() {
  return (
    <div className="mt-8 flex flex-wrap justify-center items-stretch gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[320px] max-w-[360px] flex flex-col justify-between overflow-hidden rounded-sm border border-[#C5B378]/15 bg-[#092E2B] p-6 animate-pulse"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-8 rounded bg-[#C5B378]/20" />
              <div className="h-4 w-16 rounded bg-[#C5B378]/20" />
            </div>

            <div className="space-y-2 pt-2">
              <div className="h-6 w-3/4 rounded bg-[#E6ECEB]/15" />
              <div className="h-3 w-full rounded bg-[#E6ECEB]/10" />
              <div className="h-3 w-1/2 rounded bg-[#E6ECEB]/10" />
            </div>

            <div className="pt-4 border-b border-[#C5B378]/10 pb-4">
              <div className="h-8 w-1/2 rounded bg-[#C5B378]/25" />
            </div>

            <div className="space-y-2.5 pt-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-[#C5B378]/20 shrink-0" />
                  <div className="h-3 w-4/5 rounded bg-[#E6ECEB]/10" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-2">
            <div className="h-10 w-full rounded bg-[#C5B378]/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
