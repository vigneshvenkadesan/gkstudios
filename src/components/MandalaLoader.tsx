'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface MandalaCrestSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Intricate South Indian Mandala SVG spinner in antique & champagne gold.
 */
export function MandalaCrestSpinner({
  size = 'md',
  className = '',
}: MandalaCrestSpinnerProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const dimension =
    size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-16 w-16';

  return (
    <div
      className={`gk-mandala-crest relative inline-flex items-center justify-center ${dimension} ${className}`}
      aria-hidden="true"
    >
      {/* Subtle radial gold glow */}
      <div className="gk-mandala-glow absolute inset-1 rounded-full bg-[#D8C78E]/10 blur-md" />

      {/* Outer counter-clockwise mandala ring */}
      <motion.svg
        viewBox="0 0 120 120"
        fill="none"
        className="absolute inset-0 h-full w-full"
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 18, repeat: Infinity, ease: 'linear' }
        }
      >
        <circle
          cx="60"
          cy="60"
          r="56"
          stroke="#C5B378"
          strokeWidth="0.9"
          strokeOpacity="0.35"
          strokeDasharray="3 4"
          className="gk-mandala-stroke"
        />
        <circle
          cx="60"
          cy="60"
          r="48"
          stroke="#D8C78E"
          strokeWidth="1.1"
          strokeOpacity="0.5"
          className="gk-mandala-stroke"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 60 60)`}>
            <path
              d="M60 6 L63.5 14 L60 18 L56.5 14 Z"
              fill="#D8C78E"
              fillOpacity="0.72"
              className="gk-mandala-fill"
            />
            <circle cx="60" cy="4" r="1.3" fill="#F3D999" fillOpacity="0.8" className="gk-mandala-fill" />
          </g>
        ))}
      </motion.svg>

      {/* Inner clockwise lotus petal ring */}
      <motion.svg
        viewBox="0 0 120 120"
        fill="none"
        className="absolute inset-0 h-full w-full"
        animate={prefersReducedMotion ? undefined : { rotate: -360 }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 12, repeat: Infinity, ease: 'linear' }
        }
      >
        <circle
          cx="60"
          cy="60"
          r="34"
          stroke="#C5B378"
          strokeWidth="1"
          strokeOpacity="0.6"
          className="gk-mandala-stroke"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path
            key={deg}
            d="M60 22 C65 30, 65 36, 60 44 C55 36, 55 30, 60 22 Z"
            fill="#C5B378"
            fillOpacity="0.22"
            stroke="#D8C78E"
            strokeWidth="0.9"
            strokeOpacity="0.7"
            transform={`rotate(${deg} 60 60)`}
            className="gk-mandala-petal"
          />
        ))}
      </motion.svg>

      {/* Center pulsing core */}
      <motion.svg
        viewBox="0 0 40 40"
        fill="none"
        className="relative z-10 h-[32%] w-[32%]"
        animate={prefersReducedMotion ? undefined : { scale: [0.94, 1.06, 0.94] }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="#072421"
          stroke="#D8C78E"
          strokeWidth="1.4"
          className="gk-mandala-core-bg"
        />
        <path
          d="M20 9 L24.5 20 L20 31 L15.5 20 Z"
          fill="#D8C78E"
          fillOpacity="0.85"
          className="gk-mandala-fill"
        />
        <circle cx="20" cy="20" r="3" fill="#072421" className="gk-mandala-core-dot" />
      </motion.svg>
    </div>
  );
}

interface MandalaPageLoaderProps {
  visible: boolean;
}

/**
 * Full-viewport heritage Mandala curtain that fades out smoothly
 * as soon as the hero photograph is ready.
 */
export function MandalaPageLoader({ visible }: MandalaPageLoaderProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Loading GK Studios"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="gk-mandala-page-loader fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#051C1A] px-6 text-center"
        >
          {/* Ambient radial warmth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,199,142,0.12),transparent_55%)]"
          />

          <div className="relative z-10 flex flex-col items-center space-y-5">
            <MandalaCrestSpinner size="lg" />

            <div className="space-y-1.5">
              <p className="font-serif text-2xl sm:text-3xl font-semibold tracking-[0.26em] text-white">
                GK STUDIOS
              </p>
              <p className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.34em] text-[#D8C78E] uppercase">
                Creating Memories
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Lightweight inline Mandala placeholder shown behind photos while streaming in.
 */
export function MandalaImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`gk-mandala-inline absolute inset-0 flex items-center justify-center bg-[#072421] ${className}`}
    >
      <MandalaCrestSpinner size="sm" className="opacity-75" />
    </div>
  );
}
