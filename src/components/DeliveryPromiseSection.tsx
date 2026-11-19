
'use client';

import {
  BookOpen,
  Camera,
  House,
  Images,
  PackageCheck,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { translate, type TranslationKey } from '@/src/i18n/translations';

const PROMISES: {
  icon: LucideIcon;
  timeframeKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  homeVisit?: boolean;
}[] = [
  {
    icon: Images,
    timeframeKey: 'promise.selectionTimeframe',
    titleKey: 'promise.selectionTitle',
    descriptionKey: 'promise.selectionDescription',
    homeVisit: true,
  },
  {
    icon: PackageCheck,
    timeframeKey: 'promise.deliveryTimeframe',
    titleKey: 'promise.deliveryTitle',
    descriptionKey: 'promise.deliveryDescription',
  },
];

const STAGES: {
  icon: LucideIcon;
  titleKey: TranslationKey;
}[] = [
  {
    icon: Camera,
    titleKey: 'promise.stageCaptureTitle',
  },
  {
    icon: Images,
    titleKey: 'promise.stageSelectionTitle',
  },
  {
    icon: BookOpen,
    titleKey: 'promise.stageDesignTitle',
  },
  {
    icon: PackageCheck,
    titleKey: 'promise.stageDeliveryTitle',
  },
];

export function DeliveryPromiseSection() {
  const { locale } = usePublicPreferences();
  const t = (key: TranslationKey) => translate(locale, key);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const reveal = {
    initial: prefersReducedMotion ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  };

  return (
    <section
      aria-labelledby="promise-heading"
      className="relative overflow-hidden border-b border-[#C5B378]/15 bg-[#072421] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.header
          {...reveal}
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
        >
          <p className="mb-3 text-[10px] font-semibold tracking-[0.3em] text-[#D8C78E] sm:text-xs">
            {t('promise.eyebrow')}
          </p>

          <h2
            id="promise-heading"
            className="font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl"
          >
            {t('promise.heading')}
          </h2>

          <p className="mt-3 text-sm text-[#E6ECEB]/65 sm:text-base">
            {t('promise.subtitle')}
          </p>
        </motion.header>

        {/* Delivery promises */}
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-5">
          {PROMISES.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.titleKey}
                {...reveal}
                transition={{
                  ...reveal.transition,
                  delay: index * 0.12,
                }}
                className="group relative overflow-hidden rounded-xl border border-[#C5B378]/20 bg-[#0E423E]/55 p-6 transition-colors duration-300 hover:border-[#C5B378]/45 sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C5B378]/25 bg-[#D8C78E]/10 text-[#D8C78E]">
                    <Icon size={21} strokeWidth={1.5} />
                  </div>

                  {item.homeVisit && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5B378]/25 px-3 py-1.5 text-[10px] font-medium text-[#D8C78E]">
                      <House size={12} />
                      {t('promise.homeVisit')}
                    </span>
                  )}
                </div>

                <p className="mt-7 font-serif text-3xl font-semibold text-[#D8C78E] sm:text-4xl">
                  {t(item.timeframeKey)}
                </p>

                <h3 className="mt-2 text-sm font-semibold tracking-wide text-white sm:text-base">
                  {t(item.titleKey)}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#E6ECEB]/65">
                  {t(item.descriptionKey)}
                </p>

                <div className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full border border-[#C5B378]/10 transition-transform duration-500 group-hover:scale-125" />
              </motion.article>
            );
          })}
        </div>

        {/* Workflow */}
        <motion.div
          {...reveal}
          className="mb-10 mt-16 text-center sm:mt-20"
        >
          <p className="text-[10px] font-semibold tracking-[0.3em] text-[#D8C78E] sm:text-xs">
            {t('promise.workflowEyebrow')}
          </p>
          <h3 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">
            {t('promise.workflowHeading')}
          </h3>
        </motion.div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-4">
            {STAGES.map(({ icon: Icon, titleKey }, index) => (
              <motion.div
                key={titleKey}
                {...reveal}
                transition={{
                  ...reveal.transition,
                  delay: index * 0.1,
                }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C5B378]/35 bg-[#0E423E] text-[#D8C78E] transition-all duration-300 hover:border-[#D8C78E] hover:bg-[#15544D] sm:h-20 sm:w-20">
                  <Icon size={27} strokeWidth={1.4} />

                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#D8C78E] text-[10px] font-bold text-[#072421]">
                    {index + 1}
                  </span>
                </div>

                <h4 className="font-serif text-base font-semibold text-white sm:text-lg">
                  {t(titleKey)}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <motion.div
          {...reveal}
          className="mt-16 border-t border-[#C5B378]/15 pt-9 text-center sm:mt-20"
        >
          <p className="font-serif text-xl italic text-white sm:text-2xl">
            &ldquo;{t('promise.closing')}&rdquo;
          </p>

          <p className="mt-3 text-[10px] font-semibold tracking-[0.25em] text-[#D8C78E]">
            {t('promise.signature')}
          </p>
        </motion.div>

      </div>
    </section>
  );
}
