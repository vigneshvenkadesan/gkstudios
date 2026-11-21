import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProposalPageClient } from './ProposalPageClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tailored Photography Proposal & Customizer | GK STUDIOS',
  description:
    'Interactive educational proposal and custom photography package builder for your wedding, temple ceremony, or milestone celebration with GK Studios.',
};

export const dynamic = 'force-dynamic';

export default function ProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#072421] flex flex-col items-center justify-center text-[#D8C78E] gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold text-[#E6ECEB]/70">
            Generating Your Tailored Proposal...
          </p>
        </div>
      }
    >
      <ProposalPageClient />
    </Suspense>
  );
}
