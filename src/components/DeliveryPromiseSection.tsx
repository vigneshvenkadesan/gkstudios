'use client';

import {
  BookOpen,
  Camera,
  House,
  Images,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { translate, type TranslationKey } from '@/src/i18n/translations';

const DELIVERY_PROMISES: {
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

const WORKFLOW_STAGES: {
  icon: LucideIcon;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    icon: Camera,
    titleKey: 'promise.stageCaptureTitle',
    descriptionKey: 'promise.stageCaptureDescription',
  },
  {
    icon: Images,
    titleKey: 'promise.stageSelectionTitle',
    descriptionKey: 'promise.stageSelectionDescription',
  },
  {
    icon: BookOpen,
    titleKey: 'promise.stageDesignTitle',
    descriptionKey: 'promise.stageDesignDescription',
  },
  {
    icon: PackageCheck,
    titleKey: 'promise.stageDeliveryTitle',
    descriptionKey: 'promise.stageDeliveryDescription',
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-center sm:mb-10"
        >
          <p className="mb-3 text-[10px] font-semibold tracking-[0.28em] text-[#D8C78E] sm:text-xs">
            {t('promise.eyebrow')}
          </p>
          <h2
            id="promise-heading"
            className="font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl"
          >
            {t('promise.heading')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#E6ECEB]/75 sm:text-base">
            {t('promise.subtitle')}
          </p>
        </motion.header>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-6">
          {DELIVERY_PROMISES.map(
            ({ icon: Icon, timeframeKey, titleKey, descriptionKey, homeVisit }, index) => (
              <motion.article
                key={titleKey}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-sm border border-[#C5B378]/22 bg-[#0E423E]/70 p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <Icon
                    aria-hidden="true"
                    className="mt-1 h-5 w-5 shrink-0 text-[#D8C78E]"
                    strokeWidth={1.6}
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-2xl font-semibold leading-tight text-[#D8C78E] sm:text-3xl">
                      {t(timeframeKey)}
                    </p>
                    <h3 className="mt-1 text-xs font-semibold tracking-[0.16em] text-white">
                      {t(titleKey)}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#E6ECEB]/80 sm:text-base">
                      {t(descriptionKey)}
                    </p>
                    {homeVisit && (
                      <p className="mt-4 inline-flex items-center gap-2 border-t border-[#C5B378]/18 pt-3 text-xs font-medium tracking-[0.04em] text-[#D8C78E]">
                        <House aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                        {t('promise.homeVisit')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          )}
        </div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-7 mt-12 max-w-5xl text-center sm:mb-9 sm:mt-16"
        >
          <p className="text-[10px] font-semibold tracking-[0.24em] text-[#D8C78E] sm:text-xs">
            {t('promise.workflowEyebrow')}
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-6 left-6 top-6 w-px origin-top bg-[#C5B378]/35 md:hidden"
          />
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px origin-left bg-[#C5B378]/35 md:block"
          />
          <ol className="relative grid gap-6 md:grid-cols-4 md:gap-5">
            {WORKFLOW_STAGES.map(({ icon: Icon, titleKey, descriptionKey }, index) => (
              <motion.li
                key={titleKey}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex items-start gap-4 md:flex-col md:items-center md:gap-4 md:text-center"
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C5B378]/45 bg-[#072421] text-[#D8C78E]">
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1 pb-1 md:px-1">
                  <p className="mb-1 text-[10px] font-medium tracking-[0.18em] text-[#D8C78E]/70">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="font-serif text-lg font-semibold leading-snug text-white sm:text-xl">
                    {t(titleKey)}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#E6ECEB]/70 sm:text-sm">
                    {t(descriptionKey)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 border-t border-[#C5B378]/18 pt-7 text-center sm:mt-14 sm:pt-9"
        >
          <p className="font-serif text-xl italic text-white sm:text-2xl">
            &ldquo;{t('promise.closing')}&rdquo;
          </p>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.18em] text-[#D8C78E] sm:text-xs">
            {t('promise.signature')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
