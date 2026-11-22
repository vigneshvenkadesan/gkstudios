'use client';

import React from 'react';
import { Zap, Clock, ShieldCheck, HardDriveDownload, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const SLA_GUARANTEES = [
  {
    id: 'sneak-peeks',
    title: '48-Hour Sneak Peeks',
    badge: 'Express Highlights',
    tamilTitle: '48 மணிநேர முன்னோட்டம்',
    description: '25+ signature color-graded high-resolution photos delivered in 2 days ready for WhatsApp and Instagram sharing.',
    icon: <Zap className="h-5 w-5 text-[#D8C78E]" />,
  },
  {
    id: 'gallery-backup',
    title: '7-Day Full Gallery & Raw Backup',
    badge: '100% Uncompressed Data',
    tamilTitle: '7 நாட்களில் முழு புகைப்படங்கள்',
    description: 'Full high-res digital stills uploaded to private cloud + complete raw uncompressed footage handed over on hard drive.',
    icon: <HardDriveDownload className="h-5 w-5 text-[#D8C78E]" />,
  },
  {
    id: 'album-delivery',
    title: '30-Day Album & Film Delivery',
    badge: 'Guaranteed Turnaround',
    tamilTitle: '30 நாட்களில் ஆல்பம் & படம்',
    description: 'Layflat Karizma album printing, velvet presentation box, and 4K cinematic film delivered within 30 days of client photo selection.',
    icon: <Clock className="h-5 w-5 text-[#D8C78E]" />,
  },
  {
    id: 'safety-backup',
    title: 'Dual-Card Backup & Zero Hidden Fees',
    badge: 'Safety & Transparency',
    tamilTitle: 'பாதுகாப்பு & வெளிப்படையான கட்டணம்',
    description: 'Simultaneous dual-card recording ensures zero data loss risk. Transparent per-hour overtime terms stated clearly upfront.',
    icon: <ShieldCheck className="h-5 w-5 text-[#D8C78E]" />,
  },
];

export function StudioTrustSlaStrip() {
  return (
    <div className="rounded-sm border border-[#C5B378]/30 bg-gradient-to-br from-[#0E423E] via-[#092E2B] to-[#072421] p-6 sm:p-8 space-y-6 shadow-[0_12px_36px_rgba(4,20,18,0.35)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C5B378]/20 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D8C78E]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>GK Studios Commitment</span>
          </div>
          <h4 className="font-serif text-2xl font-semibold text-white">
            Studio Trust & Delivery Guarantees
          </h4>
        </div>
        <span className="text-xs text-[#D8C78E] font-medium self-start sm:self-auto bg-[#061E1C]/60 border border-[#C5B378]/30 px-3 py-1 rounded-full">
          Standard across all packages
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SLA_GUARANTEES.map((sla, idx) => (
          <div
            key={sla.id}
            className="flex flex-col justify-between rounded-sm bg-[#061E1C]/60 border border-[#C5B378]/15 p-4 space-y-3 transition-colors hover:border-[#D8C78E]/40"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#0E423E] border border-[#C5B378]/30">
                  {sla.icon}
                </div>
                <span className="text-[10px] font-bold text-[#D8C78E] uppercase tracking-wider">
                  {sla.badge}
                </span>
              </div>

              <div>
                <h5 className="font-serif text-base font-semibold text-white">
                  {sla.title}
                </h5>
                <p className="text-[11px] text-[#D8C78E] font-medium">{sla.tamilTitle}</p>
              </div>

              <p className="text-xs text-[#E6ECEB]/75 leading-relaxed">
                {sla.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[#C5B378]/10 flex items-center gap-1.5 text-[11px] text-[#D8C78E]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Contract SLA Guarantee</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
