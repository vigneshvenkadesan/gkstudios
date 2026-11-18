'use client';

import React from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { EVENT_CATEGORIES } from '@/src/types/studio';
import { buildWhatsAppUrl } from '@/src/lib/utils';
import { GKCameraMark } from '@/src/components/MandalaAccents';

interface FooterProps {
  onJumpToSection: (sectionId: string) => void;
  onHiddenAdminTrigger: () => void;
}

export function Footer({ onJumpToSection, onHiddenAdminTrigger }: FooterProps) {
  const whatsappUrl = buildWhatsAppUrl(
    STUDIO_INFO.phone,
    'Hello GK Studios! I would like to inquire about event photography & videography.'
  );

  return (
    <footer className="bg-[#061E1C] border-t border-[#C5B378]/20 text-[#E6ECEB]/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand & Address */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <GKCameraMark className="h-8 w-11" />
              <div>
                <p className="text-lg font-bold tracking-[0.16em] text-white">
                  {STUDIO_INFO.name}
                </p>
                <p className="text-[11px] font-medium tracking-[0.22em] text-[#D8C78E]">
                  {STUDIO_INFO.tagline}
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#E6ECEB]/75 max-w-md">
              Wedding, ceremonial, and milestone photography &amp; 4K cinema studio serving
              families in Panruti, Villupuram, Chennai, and across Tamil Nadu.
            </p>

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-[#D8C78E] shrink-0" />
                <span>{STUDIO_INFO.address}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`tel:+91${STUDIO_INFO.phone}`}
                  className="inline-flex items-center gap-2 rounded-md border border-[#C5B378]/35 bg-[#092E2B] px-3.5 py-2 text-xs font-medium text-white hover:border-[#D8C78E] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#D8C78E]" />
                  <span className="font-mono tabular-nums">{STUDIO_INFO.phone}</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#C5B378]/35 bg-[#092E2B] px-3.5 py-2 text-xs font-medium text-white hover:border-[#D8C78E] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#D8C78E]" />
                  <span>WhatsApp Studio</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links: Specializations */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-[#D8C78E]">
              EVENT SPECIALIZATIONS
            </h3>
            <ul className="space-y-2 text-sm">
              {EVENT_CATEGORIES.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => onJumpToSection('portfolio')}
                    className="text-[#E6ECEB]/75 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Public Studio Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-[#D8C78E]">
              STUDIO LINKS
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('packages')}
                  className="text-[#E6ECEB]/75 hover:text-white transition-colors cursor-pointer"
                >
                  Photography Packages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('availability')}
                  className="text-[#E6ECEB]/75 hover:text-white transition-colors cursor-pointer"
                >
                  Check Live Availability
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('studio-story')}
                  className="text-[#E6ECEB]/75 hover:text-white transition-colors cursor-pointer"
                >
                  Contact G Krishna
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C5B378]/15 pt-6 text-xs text-[#E6ECEB]/60">
          <p onDoubleClick={onHiddenAdminTrigger} className="select-none">
            © {new Date().getFullYear()} GK STUDIOS · Creating Memories. All rights reserved.
          </p>
          <p>{STUDIO_INFO.address} · {STUDIO_INFO.email}</p>
        </div>
      </div>
    </footer>
  );
}
