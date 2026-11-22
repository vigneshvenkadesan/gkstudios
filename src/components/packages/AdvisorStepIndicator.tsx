'use client';

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface AdvisorStepIndicatorProps {
  currentStep: number; // 1, 2, or 3
  totalSteps?: number;
  onStepClick: (step: number) => void;
  onBack?: () => void;
  stepLabels?: string[];
}

export function AdvisorStepIndicator({
  currentStep,
  totalSteps = 3,
  onStepClick,
  onBack,
  stepLabels = ['Select Milestone', 'Scale & Focus', 'Tailored Solution'],
}: AdvisorStepIndicatorProps) {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Top row: Back button and Step Counter */}
      <div className="flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D8C78E] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back</span>
          </button>
        ) : (
          <span className="text-[11px] font-semibold tracking-widest text-[#D8C78E]/70 uppercase">
            Interactive Package Advisor
          </span>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[#D8C78E] font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-[#E6ECEB]/40">·</span>
          <span className="text-[#E6ECEB]/80 font-medium">
            {stepLabels[currentStep - 1]}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#0E423E]/90 border border-[#C5B378]/20">
        <motion.div
          className="h-full bg-gradient-to-r from-[#C5B378] via-[#D8C78E] to-[#F4E8C1]"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Step Pills on Desktop */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-2 pt-1">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;
          const canNavigate = stepNum < currentStep;

          return (
            <button
              key={idx}
              type="button"
              disabled={!canNavigate}
              onClick={() => canNavigate && onStepClick(stepNum)}
              className={`flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors ${
                isCurrent
                  ? 'bg-[#0E423E] border border-[#D8C78E]/60 text-white font-medium'
                  : isDone
                  ? 'text-[#D8C78E] hover:bg-[#0E423E]/60 cursor-pointer'
                  : 'text-[#E6ECEB]/45 cursor-default'
              }`}
            >
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isDone
                    ? 'bg-[#D8C78E] text-[#061E1C]'
                    : isCurrent
                    ? 'border border-[#D8C78E] text-[#D8C78E]'
                    : 'border border-white/20 text-white/40'
                }`}
              >
                {isDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : stepNum}
              </div>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
