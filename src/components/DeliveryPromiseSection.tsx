'use client';

import { Images, PackageCheck, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { translate, type TranslationKey } from '@/src/i18n/translations';

const DELIVERY_PROMISES: {
  icon: LucideIcon;
  descriptionKey: TranslationKey;
  days: string;
}[] = [
  {
    icon: Images,
    descriptionKey: 'promise.selectionDescription',
    days: '15',
  },
  {
    icon: PackageCheck,
    descriptionKey: 'promise.deliveryDescription',
    days: '90',
  },
];

export function DeliveryPromiseSection() {
  const { locale } = usePublicPreferences();
  const t = (key: TranslationKey) => translate(locale, key);
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <section
      aria-labelledby="promise-heading"
      className="scroll-mt-16 relative overflow-hidden border-b border-[#C5B378]/18 bg-[#072421] py-12 sm:scroll-mt-[72px] sm:py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#C5B378]/[0.035] to-transparent"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-9 text-center sm:mb-12"
        >
          <p className="mb-3 text-[10px] font-semibold tracking-[0.28em] text-[#D8C78E] sm:text-xs">
            {t('promise.eyebrow')}
          </p>
          <h2
            id="promise-heading"
            className="font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl"
          >
            {t('promise.heading')}
          </h2>
        </motion.header>

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-6 left-6 top-6 w-px origin-top bg-gradient-to-b from-[#D8C78E]/80 via-[#C5B378]/45 to-[#D8C78E]/80 md:hidden"
          />
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/4 right-1/4 top-6 hidden h-px origin-left bg-gradient-to-r from-[#D8C78E]/80 via-[#C5B378]/45 to-[#D8C78E]/80 md:block"
          />
          <ol className="relative grid gap-6 md:grid-cols-2 md:gap-10">
            {DELIVERY_PROMISES.map(({ icon: Icon, descriptionKey, days }, index) => (
              <motion.li
                key={descriptionKey}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex items-start gap-4 md:flex-col md:items-center md:gap-5 md:text-center"
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D8C78E]/60 bg-[#072421] shadow-[0_0_0_5px_#072421]">
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5 text-[#D8C78E]"
                    strokeWidth={1.6}
                  />
                </div>
                <div className="min-w-0 flex-1 rounded-sm border border-[#C5B378]/24 bg-[#0E423E] p-5 shadow-[0_12px_30px_rgba(4,20,18,0.18)] sm:p-6 md:w-full md:max-w-md md:flex-none">
                  <p className="font-serif text-3xl font-semibold leading-none tabular-nums text-[#D8C78E] sm:text-4xl">
                    {days}{' '}
                    <span className="text-[11px] tracking-[0.16em] sm:text-xs">
                      {t('promise.days')}
                    </span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#E6ECEB]/82 sm:text-base">
                    {t(descriptionKey)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
