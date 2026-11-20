'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Home, BookImage } from 'lucide-react';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { translate, type TranslationKey } from '@/src/i18n/translations';
import styles from './PromiseTimeline.module.css';

/* ─── Types ─────────────────────────────────────────────── */
interface Step {
  icon: React.ReactNode;
  labelKey: TranslationKey;
  titleKey: TranslationKey;
}

const STEPS: Step[] = [
  {
    icon: <Camera size={26} strokeWidth={1.6} aria-hidden="true" />,
    labelKey: 'promise.tl.step1.label',
    titleKey: 'promise.tl.step1.title',
  },
  {
    icon: <Home size={26} strokeWidth={1.6} aria-hidden="true" />,
    labelKey: 'promise.tl.step2.label',
    titleKey: 'promise.tl.step2.title',
  },
  {
    icon: <BookImage size={26} strokeWidth={1.6} aria-hidden="true" />,
    labelKey: 'promise.tl.step3.label',
    titleKey: 'promise.tl.step3.title',
  },
];

/* Delays in ms */
const HEADER_DELAY = 100;
const LINE_START = 350;
const STEP_BASE = 700;
const STEP_GAP = 850;
const BADGE_DELAY = 450; // relative to its step fading in
const TRUST_DELAY = STEP_BASE + STEP_GAP * (STEPS.length - 1) + 650;

/* ─── Component ─────────────────────────────────────────── */
export function PromiseTimeline() {
  const { locale } = usePublicPreferences();
  const t = (key: TranslationKey) => translate(locale, key);

  const sectionRef = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);

  // Visibility states
  const [headerVisible, setHeaderVisible] = useState(false);
  const [lineVisible, setLineVisible] = useState(false);
  const [stepsVisible, setStepsVisible] = useState<boolean[]>([false, false, false]);
  const [iconsVisible, setIconsVisible] = useState<boolean[]>([false, false, false]);
  const [badgesVisible, setBadgesVisible] = useState<boolean[]>([false, false, false]);
  const [trustVisible, setTrustVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setHeaderVisible(true);
      setLineVisible(true);
      setStepsVisible([true, true, true]);
      setIconsVisible([true, true, true]);
      setBadgesVisible([true, true, true]);
      setTrustVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);

          // Header
          setTimeout(() => setHeaderVisible(true), HEADER_DELAY);

          // Line draw
          setTimeout(() => setLineVisible(true), LINE_START);

          // Steps, icons, badges staggered
          STEPS.forEach((_, i) => {
            const stepDelay = STEP_BASE + STEP_GAP * i;
            setTimeout(() => {
              setStepsVisible((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
              setIconsVisible((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, stepDelay);

            setTimeout(() => {
              setBadgesVisible((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, stepDelay + BADGE_DELAY);
          });

          // Trust strip
          setTimeout(() => setTrustVisible(true), TRUST_DELAY);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggered]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="promise-heading"
      className={styles.section}
    >
      <div className={styles.inner}>
        {/* Header matching site typography and text */}
        <header
          className={[styles.header, headerVisible ? styles.headerVisible : ''].join(' ')}
        >
          <p className={styles.eyebrow}>
            {t('promise.eyebrow')}
          </p>

          <h2 id="promise-heading" className={styles.heading}>
            {t('promise.heading')}
          </h2>

          <p className={styles.subtitle}>
            {t('promise.subtitle')}
          </p>
        </header>

        {/* Steps container */}
        <div className={styles.stepsRow} role="presentation">
          {/* Desktop horizontal connector line */}
          <div className={styles.lineTrack} aria-hidden="true">
            <span
              className={[styles.lineFill, lineVisible ? styles.lineFillVisible : ''].join(' ')}
            />
          </div>

          {/* Mobile vertical connector line */}
          <div className={styles.mobileLineTrack} aria-hidden="true">
            <span
              className={[
                styles.mobileLineFill,
                lineVisible ? styles.mobileLineFillVisible : '',
              ].join(' ')}
            />
          </div>

          {/* Ordered list for accessibility */}
          <ol
            style={{ display: 'contents' }}
            aria-label={t('promise.eyebrow')}
          >
            {STEPS.map((step, i) => (
              <li
                key={i}
                className={[
                  styles.step,
                  stepsVisible[i] ? styles.stepVisible : '',
                ].join(' ')}
                aria-label={`${t(step.labelKey)}: ${t(step.titleKey)}`}
              >
                {/* Icon circle */}
                <div
                  className={[
                    styles.iconWrap,
                    iconsVisible[i] ? styles.iconWrapVisible : '',
                  ].join(' ')}
                >
                  {step.icon}
                  <span
                    className={[
                      styles.checkBadge,
                      badgesVisible[i] ? styles.checkBadgeVisible : '',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </div>

                {/* Text */}
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>{t(step.labelKey)}</span>
                  <strong className={styles.stepTitle}>{t(step.titleKey)}</strong>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Trust strip */}
        <div
          className={[styles.trustStrip, trustVisible ? styles.trustStripVisible : ''].join(' ')}
          aria-label="Studio highlights"
        >
          <div className={styles.trustItem}>
            <span className={styles.trustValue}>250+</span>
            <span className={styles.trustLabel}>{t('promise.tl.trust.celebrations')}</span>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustValue}>7+</span>
            <span className={styles.trustLabel}>{t('promise.tl.trust.experience')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
