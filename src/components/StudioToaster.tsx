'use client';

import { Toaster } from 'sonner';

export function StudioToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0E423E',
          color: '#FFFFFF',
          border: '1px solid rgba(197, 179, 120, 0.45)',
        },
      }}
    />
  );
}
