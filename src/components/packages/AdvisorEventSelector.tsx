'use client';

import React, { useMemo } from 'react';
import {
  Heart,
  Baby,
  Cake,
  Flame,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { EVENT_CATEGORY_GROUPS, StudioEvent, StudioPackage } from '@/src/types/studio';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

interface AdvisorEventSelectorProps {
  events: StudioEvent[];
  packages: StudioPackage[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  onNext: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wedding: <Heart className="h-4 w-4" />,
  'baby-maternity': <Baby className="h-4 w-4" />,
  'birthday-kids': <Cake className="h-4 w-4" />,
  'family-traditional': <Flame className="h-4 w-4" />,
  'corporate-business': <Briefcase className="h-4 w-4" />,
};

function matchesCategory(eventCategory?: string, groupId?: string): boolean {
  if (!eventCategory || !groupId) return false;
  const evCat = eventCategory.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const grp = groupId.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (evCat === grp) return true;

  if (grp.includes('wedding') && evCat.includes('wedding')) return true;
  if (
    (grp.includes('baby') || grp.includes('maternity')) &&
    (evCat.includes('baby') || evCat.includes('maternity'))
  )
    return true;
  if (
    (grp.includes('birthday') || grp.includes('kid')) &&
    (evCat.includes('birthday') || evCat.includes('kid'))
  )
    return true;
  if (
    (grp.includes('family') || grp.includes('traditional')) &&
    (evCat.includes('family') || evCat.includes('traditional'))
  )
    return true;
  if (
    (grp.includes('corporate') || grp.includes('business')) &&
    (evCat.includes('corporate') || evCat.includes('business'))
  )
    return true;

  return false;
}

export function AdvisorEventSelector({
  events,
  packages,
  selectedCategoryId,
  onSelectCategory,
  selectedEventId,
  onSelectEvent,
  onNext,
}: AdvisorEventSelectorProps) {
  // Count active events per category group
  const eventCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    EVENT_CATEGORY_GROUPS.forEach((group) => {
      const count = events
        .filter((e) => (e.status ?? 'active') === 'active')
        .filter((e) => matchesCategory(e.category, group.id)).length;
      map.set(group.id, count);
    });
    return map;
  }, [events]);

  // Active events for current selected category
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => (e.status ?? 'active') === 'active')
      .filter((e) => matchesCategory(e.category, selectedCategoryId))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [events, selectedCategoryId]);

  // Starting price map for events
  const startingPriceByEvent = useMemo(() => {
    const map = new Map<string, number>();
    packages
      .filter((p) => (p.status ?? 'active') === 'active' && p.displayOnPortfolio !== false)
      .forEach((p) => {
        const eid = p.eventId || 'wedding';
        const currentMin = map.get(eid);
        if (currentMin === undefined || p.price < currentMin) {
          map.set(eid, p.price);
        }
      });
    return map;
  }, [packages]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || filteredEvents[0];

  return (
    <div className="space-y-8">
      {/* Question Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-[#D8C78E] uppercase">
          Step 1 · Milestone Selection
        </p>
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
          What milestone are we capturing?
        </h3>
        <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
          Choose your celebration type below. We customize lens choices and crew size to match each ritual’s unique rhythm.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
        {EVENT_CATEGORY_GROUPS.map((group) => {
          const isSelected = selectedCategoryId === group.id;
          const count = eventCountByCategory.get(group.id) ?? 0;
          const icon = CATEGORY_ICONS[group.id] || <Sparkles className="h-4 w-4" />;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => {
                onSelectCategory(group.id);
                // Also select the first event of this category if needed
                const firstInCat = events.find(
                  (e) => (e.status ?? 'active') === 'active' && matchesCategory(e.category, group.id)
                );
                if (firstInCat) {
                  onSelectEvent(firstInCat.id);
                }
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow-[0_4px_16px_rgba(216,199,142,0.3)] ring-1 ring-[#F4E8C1]'
                  : 'bg-[#0E423E]/80 text-[#E6ECEB]/80 border border-[#C5B378]/25 hover:border-[#D8C78E]/60 hover:text-white hover:bg-[#114A45]'
              }`}
            >
              <span className={isSelected ? 'text-[#061E1C]' : 'text-[#D8C78E]'}>
                {icon}
              </span>
              <span>{group.label}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected
                    ? 'bg-[#061E1C]/20 text-[#061E1C]'
                    : 'bg-[#072421] text-[#D8C78E]/80 border border-[#C5B378]/20'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Event Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredEvents.map((event) => {
          const isSelected = selectedEventId === event.id;
          const minPrice = startingPriceByEvent.get(event.id);

          return (
            <motion.button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent(event.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex flex-col justify-between text-left p-4 rounded-sm border transition-all duration-200 ${
                isSelected
                  ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_8px_24px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                  : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif text-base sm:text-lg font-semibold text-white group-hover:text-[#F4E8C1] transition-colors leading-snug">
                    {event.name}
                  </h4>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[#D8C78E] shrink-0" />
                  )}
                </div>

              </div>

              <div className="mt-4 pt-3 border-t border-[#C5B378]/15 flex items-center justify-between text-xs">
                {minPrice ? (
                  <span className="text-[#E6ECEB]/70">
                    From <span className="font-semibold text-white">{formatINR(minPrice)}</span>
                  </span>
                ) : (
                  <span className="text-[#D8C78E]/80 text-[11px] font-medium">
                    Bespoke Pricing
                  </span>
                )}
                <span
                  className={`text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                    isSelected ? 'text-[#D8C78E]' : 'text-[#E6ECEB]/50 group-hover:text-[#D8C78E]'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Step Advance Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C5B378]/20">
        <div className="text-xs text-[#E6ECEB]/70">
          Selected Milestone:{' '}
          <strong className="text-white font-medium">
            {selectedEvent?.name || 'Wedding'}
          </strong>
        </div>

        <Button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold hover:brightness-105 shadow-[0_4px_16px_rgba(216,199,142,0.3)] px-6"
        >
          <span>Next: Celebration Scale & Focus</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
