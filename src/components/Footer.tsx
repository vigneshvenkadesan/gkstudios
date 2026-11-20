'use client';

import React from 'react';
import { ArrowUpRight, LockKeyhole, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { EventCategory } from '@/src/types/studio';
import { buildWhatsAppUrl } from '@/src/lib/utils';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { translate, translateCategory, TranslationKey } from '@/src/i18n/translations';

interface FooterProps {
  onJumpToSection: (sectionId: string) => void;
  onSelectCategory?: (category: EventCategory) => void;
  onHiddenAdminTrigger: () => void;
  onOpenTerms?: () => void;
}

const EXPLORE_LINKS = [
  { key: 'footer.stories', sectionId: 'portfolio' },
  { key: 'nav.packages', sectionId: 'packages' },
  { key: 'footer.about', sectionId: 'studio-story' },
  { key: 'footer.availability', sectionId: 'availability' },
] as const;

const CELEBRATION_LINKS: ReadonlyArray<{ category: EventCategory }> = [
  { category: 'Weddings' },
  { category: 'Traditional Ceremonies' },
  { category: 'Family Celebrations' },
  { category: 'Portraits & Outdoor Shoots' },
  { category: 'Corporate Events' },
];

export function Footer({
  onJumpToSection,
  onSelectCategory,
  onHiddenAdminTrigger,
  onOpenTerms,
}: FooterProps) {
  const { locale } = usePublicPreferences();
  const t = (key: TranslationKey) => translate(locale, key);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const whatsappUrl = buildWhatsAppUrl(
    STUDIO_INFO.phone,
    locale === 'ta'
      ? 'வணக்கம் GK STUDIOS! திருமணப் புகைப்படம் மற்றும் சினிமா படப்பிடிப்பு குறித்து விவரம் அறிய விரும்புகிறேன்.'
      : 'Vanakkam GK Studios! I would like to inquire about wedding photography & cinematography.'
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${STUDIO_INFO.address}, Tamil Nadu`
  )}`;

  return (
    <motion.footer
      id="contact"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="scroll-mt-16 bg-[#061E1C] text-[#E6ECEB]/80 sm:scroll-mt-[72px]"
    >
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-14 sm:pb-9 lg:px-8">
        {/* Balanced 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8 lg:gap-12">
          {/* Column 1 — Brand Identity & Primary Studio Contact */}
          <div className="md:col-span-5 space-y-5">
            <h2 className="text-[10px] font-semibold tracking-[0.22em] text-[#D8C78E]/75">
              {t('footer.brandContact')}
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
                  {t('footer.tagline')}
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
                  <span>{t('footer.whatsapp')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div className="md:col-span-3 md:col-start-6 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#D8C78E]">
              {t('footer.explore')}
            </h3>
            <ul className="space-y-3 text-sm">
              {EXPLORE_LINKS.map((item) => (
                <li key={item.sectionId}>
                  <button
                    type="button"
                    onClick={() => onJumpToSection(item.sectionId)}
                    className="text-[#E6ECEB]/75 hover:text-white transition-colors duration-200 cursor-pointer text-left"
                  >
                    {t(item.key)}
                  </button>
                </li>
              ))}
              {onOpenTerms && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-[#E6ECEB]/75 hover:text-white transition-colors duration-200 cursor-pointer text-left"
                  >
                    {t('footer.terms')}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3 — Celebrations */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#D8C78E]">
              {t('footer.celebrations')}
            </h3>
            <ul className="space-y-3 text-sm">
              {CELEBRATION_LINKS.map((item) => (
                <li key={item.category}>
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
                    {translateCategory(locale, item.category)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="mt-9 flex flex-col items-start justify-between gap-3 border-t border-[#C5B378]/15 pt-5 text-xs text-[#E6ECEB]/58 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p onDoubleClick={onHiddenAdminTrigger} className="select-none">
              {t('footer.copyright')}
            </p>
            {onOpenTerms && (
              <>
                <span className="text-[#C5B378]/40 select-none">·</span>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-[#E6ECEB]/70 hover:text-[#D8C78E] underline-offset-4 hover:underline transition-colors cursor-pointer"
                >
                  {t('footer.terms')}
                </button>
              </>
            )}
          </div>
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
            <p className="text-[#E6ECEB]/65">{t('footer.credit')}</p>
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
    </motion.footer>
  );
}
