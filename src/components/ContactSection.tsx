'use client';

import React from 'react';
import { Calendar, MessageCircle, Phone } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { buildWhatsAppUrl } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

interface ContactSectionProps {
  onReserveDate: () => void;
}

export function ContactSection({ onReserveDate }: ContactSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  const whatsappUrl = buildWhatsAppUrl(
    STUDIO_INFO.phone,
    'Vanakkam GK Studios! I would like to discuss wedding photography & cinematography.'
  );

  return (
    <section
      id="contact"
      className="scroll-mt-16 sm:scroll-mt-[72px] bg-[#092E2B] py-16 sm:py-20 border-b border-[#C5B378]/18"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#D8C78E]">
              DIRECT CONSULTATION
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-[-0.01em] text-white leading-tight">
              Speak With {STUDIO_INFO.leadPhotographer}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onReserveDate}>
              <Calendar className="h-4 w-4" />
              Check Availability
            </Button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                <MessageCircle className="h-4 w-4 text-[#D8C78E]" />
                WhatsApp
              </Button>
            </a>
            <a href={`tel:+91${STUDIO_INFO.phone}`}>
              <Button size="lg" variant="secondary">
                <Phone className="h-4 w-4 text-[#D8C78E]" />
                <span className="font-mono tabular-nums">{STUDIO_INFO.phone}</span>
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
