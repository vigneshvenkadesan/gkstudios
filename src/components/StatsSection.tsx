'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

interface StatItem {
  targetNumber?: number;
  suffix?: string;
  staticDisplay?: string;
  label: string;
}

const STUDIO_STATS: StatItem[] = [
  {
    targetNumber: 250,
    suffix: '+',
    label: 'Celebrations',
  },
  {
    targetNumber: 7,
    suffix: '+',
    label: 'Years',
  },
  {
    targetNumber: 4,
    suffix: 'K',
    label: 'Cinema',
  },
  {
    staticDisplay: 'Karizma',
    label: 'Albums',
  },
];

function AnimatedStatValue({
  item,
  inView,
  reducedMotion,
}: {
  item: StatItem;
  inView: boolean;
  reducedMotion: boolean;
}) {
  const [displayCount, setDisplayCount] = useState<number>(item.targetNumber ?? 0);

  useEffect(() => {
    if (item.targetNumber === undefined) return;
    if (!inView || reducedMotion) {
      setDisplayCount(item.targetNumber);
      return;
    }

    const durationMs = 1000;
    const startTime = performance.now();
    const target = item.targetNumber;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.max(1, Math.round(eased * target)));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    setDisplayCount(0);
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, reducedMotion, item.targetNumber]);

  if (item.staticDisplay) {
    return (
      <span className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-[#D8C78E] leading-none">
        {item.staticDisplay}
      </span>
    );
  }

  return (
    <span className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-[#D8C78E] leading-none tabular-nums">
      {displayCount}
      {item.suffix}
    </span>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.25 });
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <section
      ref={sectionRef}
      aria-label="Studio highlights"
      className="bg-[#072421] border-b border-[#C5B378]/18"
    >
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="grid grid-cols-2 gap-y-8 gap-x-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#C5B378]/18">
          {STUDIO_STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="lg:px-8 first:lg:pl-0 last:lg:pr-0 space-y-1"
            >
              <div>
                <AnimatedStatValue
                  item={stat}
                  inView={isInView}
                  reducedMotion={prefersReducedMotion}
                />
              </div>
              <p className="text-xs sm:text-sm font-medium tracking-[0.08em] text-[#E6ECEB]/80">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
