'use client';

import React from 'react';
import { ArrowUpRight, LockKeyhole, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { EventCategory } from '@/src/types/studio';
import { buildWhatsAppUrl } from '@/src/lib/utils';
import { GKCameraMark } from '@/src/components/MandalaAccents';

interface FooterProps {
  onJumpToSection: (sectionId: string) => void;
  onSelectCategory?: (category: EventCategory) => void;
  onHiddenAdminTrigger: () => void;
}

const EXPLORE_LINKS = [
  { label: 'Our Stories', sectionId: 'portfolio' },
  { label: 'Packages', sectionId: 'packages' },
  { label: 'About', sectionId: 'studio-story' },
  { label: 'Availability', sectionId: 'availability' },
] as const;

const CELEBRATION_LINKS: ReadonlyArray<{ label: string; category: EventCategory }> = [
  { label: 'Weddings', category: 'Weddings' },
  { label: 'Traditional Ceremonies', category: 'Traditional Ceremonies' },
  { label: 'Family Celebrations', category: 'Family Celebrations' },
  { label: 'Portraits & Outdoor Shoots', category: 'Portraits & Outdoor Shoots' },
  { label: 'Corporate Events', category: 'Corporate Events' },
];

export function Footer({
  onJumpToSection,
  onSelectCategory,
  onHiddenAdminTrigger,
}: FooterProps) {
  const whatsappUrl = buildWhatsAppUrl(
    STUDIO_INFO.phone,
    'Vanakkam GK Studios! I would like to inquire about wedding photography & cinematography.'
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${STUDIO_INFO.address}, Tamil Nadu`
  )}`;

  return (
    <footer id="contact" className="scroll-mt-16 bg-[#061E1C] text-[#E6ECEB]/80 sm:scroll-mt-[72px]">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-14 sm:pb-9 lg:px-8">
        {/* Balanced 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8 lg:gap-12">
          {/* Column 1 — Brand Identity & Primary Studio Contact */}
          <div className="md:col-span-5 space-y-5">
            <h2 className="text-[10px] font-semibold tracking-[0.22em] text-[#D8C78E]/75">
              BRAND &amp; CONTACT
            </h2>
            <button
              type="button"
              onClick={() => onJumpToSection('hero')}
              className="group flex items-center gap-3.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] rounded-sm"
            >
              <GKCameraMark className="h-9 w-12 shrink-0" />
              <div>
                <p className="font-serif text-2xl sm:text-[1.7rem] font-semibold tracking-[0.14em] text-white leading-none">
                  {STUDIO_INFO.name}
                </p>
                <p className="mt-1.5 text-xs font-medium tracking-[0.2em] text-[#D8C78E]">
                  Creating Memories.
                </p>
              </div>
            </button>

            <div className="space-y-2.5 pt-1 text-sm">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-start gap-2.5 text-[#E6ECEB]/82 hover:text-white transition-colors"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D8C78E]" />
                <span>{STUDIO_INFO.address}</span>
              </a>

              <div>
                <a
                  href={`mailto:${STUDIO_INFO.email}`}
                  className="inline-flex items-center gap-2.5 text-[#E6ECEB]/82 hover:text-white transition-colors break-all"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#D8C78E]" />
                  <span>{STUDIO_INFO.email}</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                <a
                  href={`tel:+91${STUDIO_INFO.phone}`}
                  className="inline-flex items-center gap-2 font-mono text-sm tabular-nums text-white hover:text-[#D8C78E] transition-colors py-1"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[#D8C78E]" />
                  <span>{STUDIO_INFO.phoneFormatted}</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#D8C78E] hover:text-white transition-colors py-1"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>WhatsApp</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div className="md:col-span-3 md:col-start-6 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#D8C78E]">
              EXPLORE
            </h3>
            <ul className="space-y-3 text-sm">
              {EXPLORE_LINKS.map((item) => (
                <li key={item.sectionId}>
                  <button
                    type="button"
                    onClick={() => onJumpToSection(item.sectionId)}
                    className="text-[#E6ECEB]/75 hover:text-white transition-colors duration-200 cursor-pointer text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Celebrations */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#D8C78E]">
              CELEBRATIONS
            </h3>
            <ul className="space-y-3 text-sm">
              {CELEBRATION_LINKS.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(item.category);
                      } else {
                        onJumpToSection('portfolio');
                      }
                    }}
                    className="text-[#E6ECEB]/75 hover:text-white transition-colors duration-200 cursor-pointer text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="mt-9 flex flex-col items-start justify-between gap-3 border-t border-[#C5B378]/15 pt-5 text-xs text-[#E6ECEB]/58 sm:flex-row sm:items-center">
          <p onDoubleClick={onHiddenAdminTrigger} className="select-none">
            © 2026 GK STUDIOS. All rights reserved.
          </p>
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
            <p className="text-[#E6ECEB]/65">Designed with passion. Creating memories.</p>
            <button
              type="button"
              onClick={onHiddenAdminTrigger}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#C5B378]/15 bg-[#092E2B]/25 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-[#E6ECEB]/50 transition-colors hover:border-[#C5B378]/35 hover:text-[#D8C78E]/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D8C78E]"
              aria-label="Open studio admin"
            >
              <LockKeyhole className="h-3 w-3" />
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
