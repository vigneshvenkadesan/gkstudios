'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useStudio } from '@/src/context/StudioContext';
import { StudioPackage } from '@/src/types/studio';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { localizePackage, translate } from '@/src/i18n/translations';

interface PackagesSectionProps {
  selectedPackageId: string;
  onSelectPackage: (pkg: StudioPackage) => void;
}

export function PackagesSection({ selectedPackageId, onSelectPackage }: PackagesSectionProps) {
  const { packages } = useStudio();
  const { locale } = usePublicPreferences();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <section
      id="packages"
      className="scroll-mt-16 sm:scroll-mt-[72px] bg-[#072421] py-20 sm:py-28 border-b border-[#C5B378]/18"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Minimal Editorial Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#D8C78E]">
              {t('packages.eyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-[-0.015em] text-white leading-[1.06]">
              {t('packages.heading')}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#E6ECEB]/72 lg:pb-1">
            {t('packages.included')}
          </p>
        </motion.div>

        {/* Clean 4-Column Collection Grid — All Prices & Deliverables Intact */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg, idx) => {
            const copy = localizePackage(locale, pkg);
            const isSelected = selectedPackageId === pkg.id;
            const isComprehensive = pkg.id === 'pkg-royal';
            const isElevated = isComprehensive || isSelected;

            return (
              <motion.article
                key={pkg.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group relative flex flex-col justify-between rounded-sm border transition-all duration-300 ${
                  isSelected
                    ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_18px_45px_rgba(4,20,18,0.45)]'
                    : isComprehensive
                    ? 'border-[#C5B378]/55 bg-[#0E423E] hover:border-[#D8C78E]'
                    : 'border-[#C5B378]/18 bg-[#092E2B] hover:border-[#C5B378]/45 hover:bg-[#0C3935]'
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`h-[2px] w-full transition-colors duration-300 ${
                    isSelected
                      ? 'bg-[#D8C78E]'
                      : isComprehensive
                      ? 'bg-[#C5B378]/80'
                      : 'bg-transparent group-hover:bg-[#C5B378]/35'
                  }`}
                />

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono tabular-nums text-[#D8C78E]/70">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {isComprehensive ? (
                      <span className="font-medium tracking-[0.12em] text-[#D8C78E]">
                        {t('packages.flagship')}
                      </span>
                    ) : pkg.highlighted ? (
                      <span className="font-medium tracking-[0.08em] text-[#E6ECEB]/70">
                        {t('packages.popular')}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-1">
                    <h3 className="font-serif text-2xl font-semibold text-white leading-snug">
                      {copy.name}
                    </h3>
                    <p className="text-xs text-[#D8C78E]/90">{copy.audience}</p>
                  </div>

                  <div className="mt-5 pb-5 border-b border-[#C5B378]/16">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-4xl font-semibold text-white tabular-nums tracking-tight">
                        {formatINR(pkg.price)}
                      </span>
                      <span className="text-xs text-[#E6ECEB]/60">{t('packages.starting')}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#E6ECEB]/75">{copy.duration}</p>
                  </div>

                  <ul className="mt-5 flex-1 space-y-3">
                    {copy.deliverables.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] sm:text-sm text-[#E6ECEB]/86"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D8C78E]" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 pt-3">
                    <Button
                      className="w-full justify-between"
                      variant={isElevated ? 'default' : 'outline'}
                      onClick={() => onSelectPackage(pkg)}
                    >
                      <span>{t(isSelected ? 'packages.selected' : 'packages.select')}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
