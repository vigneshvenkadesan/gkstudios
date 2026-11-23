'use client';

import React from 'react';
import { Home, Users, Crown, ShieldCheck, Heart, Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import {
  SCALE_OPTIONS,
  PRIORITY_OPTIONS,
  ScaleOption,
  PriorityOption,
} from '@/src/data/packageAdvisorConfig';
import { StudioEvent } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';

interface AdvisorScalePriorityStepProps {
  event: StudioEvent | undefined;
  scale: ScaleOption['id'];
  onChangeScale: (scale: ScaleOption['id']) => void;
  priority: PriorityOption['id'];
  onChangePriority: (priority: PriorityOption['id']) => void;
  onRevealSolution: () => void;
}

const SCALE_ICONS = {
  Home: <Home className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Crown: <Crown className="h-5 w-5" />,
};

const PRIORITY_ICONS = {
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
};

export function AdvisorScalePriorityStep({
  event,
  scale,
  onChangeScale,
  priority,
  onChangePriority,
  onRevealSolution,
}: AdvisorScalePriorityStepProps) {
  return (
    <div className="space-y-10">
      {/* Step Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-[#D8C78E] uppercase">
          Step 2 · Celebration Profile
        </p>
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
          Tell us a bit about the celebration
        </h3>
        <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
          For <strong className="text-white font-medium">{event?.name || 'your event'}</strong>, we
          calibrate the ideal photographer-to-guest ratio so every touching moment is preserved without
          cluttering the venue.
        </p>
      </div>

      {/* Question 1: Guest Count / Scale */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold tracking-wide text-white uppercase text-xs flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0E423E] text-[#D8C78E] text-[11px] font-bold border border-[#C5B378]/30">
              1
            </span>
            Guest Count & Event Scale
          </label>
          <span className="text-xs text-[#D8C78E]">Choose celebration size</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SCALE_OPTIONS.map((opt) => {
            const isSelected = scale === opt.id;
            const icon = SCALE_ICONS[opt.iconName];

            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => onChangeScale(opt.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex flex-col justify-between text-left p-4 sm:p-5 rounded-sm border transition-all duration-200 ${
                  isSelected
                    ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_8px_24px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                    : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-sm transition-colors ${
                        isSelected
                          ? 'bg-[#D8C78E] text-[#061E1C]'
                          : 'bg-[#0E423E] text-[#D8C78E] border border-[#C5B378]/30 group-hover:bg-[#114A45]'
                      }`}
                    >
                      {icon}
                    </div>

                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#D8C78E] bg-[#D8C78E] text-[#061E1C]'
                          : 'border-[#C5B378]/40 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <h4 className="font-serif text-lg font-semibold text-white group-hover:text-[#F4E8C1] transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-xs font-semibold text-[#D8C78E]">
                      {opt.subtitle} · {opt.guestCount}
                    </p>
                  </div>

                  <p className="mt-2.5 text-xs text-[#E6ECEB]/70 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Question 2: Primary Priority (The Problem Solver) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold tracking-wide text-white uppercase text-xs flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0E423E] text-[#D8C78E] text-[11px] font-bold border border-[#C5B378]/30">
              2
            </span>
            What is your primary coverage priority?
          </label>
          <span className="text-xs text-[#D8C78E]">What matters most to you?</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {PRIORITY_OPTIONS.map((opt) => {
            const isSelected = priority === opt.id;
            const icon = PRIORITY_ICONS[opt.iconName];

            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => onChangePriority(opt.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex flex-col justify-between text-left p-4 sm:p-5 rounded-sm border transition-all duration-200 ${
                  isSelected
                    ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_8px_24px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                    : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-sm transition-colors ${
                        isSelected
                          ? 'bg-[#D8C78E] text-[#061E1C]'
                          : 'bg-[#0E423E] text-[#D8C78E] border border-[#C5B378]/30 group-hover:bg-[#114A45]'
                      }`}
                    >
                      {icon}
                    </div>

                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#D8C78E] bg-[#D8C78E] text-[#061E1C]'
                          : 'border-[#C5B378]/40 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <h4 className="font-serif text-lg font-semibold text-white group-hover:text-[#F4E8C1] transition-colors leading-snug">
                      {opt.title}
                    </h4>
                    <p className="text-xs font-semibold text-[#D8C78E]">
                      {opt.tagline}
                    </p>
                  </div>

                  <p className="mt-2.5 text-xs text-[#E6ECEB]/70 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Action to Step 3 */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C5B378]/20">
        <p className="text-xs text-[#E6ECEB]/70">
          Ready to review your tailored plan and customize add-ons live.
        </p>

        <Button
          type="button"
          onClick={onRevealSolution}
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold hover:brightness-105 shadow-[0_4px_16px_rgba(216,199,142,0.3)] px-7 py-2.5"
        >
          <span>Reveal Your Tailored Solution</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
