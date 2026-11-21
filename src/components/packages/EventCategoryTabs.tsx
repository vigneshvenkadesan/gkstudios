'use client';

import React from 'react';
import {
  Heart,
  Baby,
  Cake,
  Flame,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { EVENT_CATEGORY_GROUPS, StudioEvent, StudioPackage } from '@/src/types/studio';

interface EventCategoryTabsProps {
  events: StudioEvent[];
  packages: StudioPackage[];
  selectedCategoryId: string;
  onSelectCategory: (catId: string) => void;
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  isLoading?: boolean;
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  wedding: <Heart className="h-4 w-4" />,
  'baby-maternity': <Baby className="h-4 w-4" />,
  'birthday-kids': <Cake className="h-4 w-4" />,
  'family-traditional': <Flame className="h-4 w-4" />,
  'corporate-business': <Briefcase className="h-4 w-4" />,
};

/**
 * Robust category matching that handles kebab-case, display names, and aliases
 */
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

export function EventCategoryTabs({
  events,
  packages,
  selectedCategoryId,
  onSelectCategory,
  selectedEventId,
  onSelectEvent,
  isLoading = false,
}: EventCategoryTabsProps) {
  // Map of eventId -> package count (active and displayOnPortfolio)
  const packageCountByEvent = React.useMemo(() => {
    const map = new Map<string, number>();
    packages
      .filter((p) => (p.status ?? 'active') === 'active' && p.displayOnPortfolio !== false)
      .forEach((p) => {
        const eid = p.eventId || 'wedding';
        map.set(eid, (map.get(eid) || 0) + 1);
      });
    return map;
  }, [packages]);

  // Active events for current category
  const currentCategoryEvents = React.useMemo(() => {
    return events
      .filter((e) => (e.status ?? 'active') === 'active')
      .filter((e) => matchesCategory(e.category, selectedCategoryId))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [events, selectedCategoryId]);

  return (
    <div className="space-y-6">
      {/* ─── Level 1: Category Navigation Bar (Counts show number of EVENTS) ─── */}
      <div className="relative border-b border-[#C5B378]/20 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
          {EVENT_CATEGORY_GROUPS.map((group) => {
            const isActive = selectedCategoryId === group.id;

            // Dynamically calculate the count of matching EVENTS belonging to this category
            const categoryEvents = events.filter(
              (e) => (e.status ?? 'active') === 'active' && matchesCategory(e.category, group.id)
            );
            const eventCount = categoryEvents.length;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  onSelectCategory(group.id);
                  // Auto-select first event in category if current selected event is not in this category
                  const firstEv = categoryEvents[0];
                  if (firstEv) {
                    onSelectEvent(firstEv.id);
                  }
                }}
                className={`group relative flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] cursor-pointer ${
                  isActive
                    ? 'bg-[#0E423E] text-[#D8C78E] border border-[#D8C78E]/60 shadow-[0_0_16px_rgba(216,199,142,0.18)]'
                    : 'bg-[#072421]/80 text-[#E6ECEB]/70 border border-[#C5B378]/15 hover:border-[#C5B378]/40 hover:text-white hover:bg-[#0A332F]'
                }`}
              >
                <span
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-[#D8C78E]' : 'text-[#C5B378]/70 group-hover:text-[#D8C78E]'
                  }`}
                >
                  {CATEGORY_ICON_MAP[group.id] || <Sparkles className="h-4 w-4" />}
                </span>

                <div className="flex flex-col text-left leading-tight">
                  <span className="font-semibold tracking-wide">{group.label}</span>
                  {group.tamilLabel && (
                    <span className="text-[10px] text-[#E6ECEB]/50 font-normal">
                      {group.tamilLabel}
                    </span>
                  )}
                </div>

                {/* Event count badge */}
                {eventCount > 0 && (
                  <span
                    title={`${eventCount} ${eventCount === 1 ? 'event' : 'events'}`}
                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
                      isActive
                        ? 'bg-[#D8C78E]/25 text-[#D8C78E]'
                        : 'bg-white/10 text-[#E6ECEB]/70 group-hover:text-white'
                    }`}
                  >
                    {eventCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Level 2: Specific Event Chips within Category ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#E6ECEB]/60 px-1">
          <span className="tracking-wider uppercase text-[11px] font-medium text-[#D8C78E]">
            Select Specific Ceremony
          </span>
          <span className="text-[11px] text-[#E6ECEB]/70">
            {currentCategoryEvents.length} {currentCategoryEvents.length === 1 ? 'ceremony' : 'ceremonies'} available
          </span>
        </div>

        {currentCategoryEvents.length === 0 ? (
          <div className="rounded-sm border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 text-center text-xs text-[#E6ECEB]/60">
            No ceremonies listed under this category yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {currentCategoryEvents.map((ev) => {
              const isSelected = selectedEventId === ev.id;
              const count = packageCountByEvent.get(ev.id) || 0;

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev.id)}
                  className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold shadow-[0_4px_14px_rgba(216,199,142,0.3)] ring-2 ring-[#D8C78E]/50'
                      : 'bg-[#092E2B] text-[#E6ECEB]/85 border border-[#C5B378]/25 hover:border-[#D8C78E]/60 hover:text-white hover:bg-[#0E423E]'
                  }`}
                >
                  <span className="leading-snug">{ev.name}</span>

                  {ev.tamilName && (
                    <span
                      className={`text-[10px] transition-colors ${
                        isSelected ? 'text-[#061E1C]/75 font-normal' : 'text-[#D8C78E]/70 font-normal'
                      }`}
                    >
                      • {ev.tamilName}
                    </span>
                  )}

                  {count > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums ${
                        isSelected
                          ? 'bg-[#061E1C]/20 text-[#061E1C]'
                          : 'bg-[#D8C78E]/15 text-[#D8C78E]'
                      }`}
                    >
                      {count} {count === 1 ? 'pkg' : 'pkgs'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
