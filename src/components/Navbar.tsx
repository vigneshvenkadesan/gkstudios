'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';

interface NavbarProps {
  activeView: 'public' | 'admin';
  onSwitchView: (view: 'public' | 'admin') => void;
  onJumpToSection: (sectionId: string) => void;
}

export function Navbar({ activeView, onSwitchView, onJumpToSection }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLink = (sectionId: string) => {
    setMobileOpen(false);
    if (activeView !== 'public') {
      onSwitchView('public');
      setTimeout(() => {
        onJumpToSection(sectionId);
      }, 60);
    } else {
      onJumpToSection(sectionId);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#C5B378]/20 bg-[#092E2B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLink('hero')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] rounded-md"
        >
          <GKCameraMark className="h-7 w-10 shrink-0" />
          <span className="text-lg font-bold tracking-[0.16em] text-white whitespace-nowrap shrink-0">
            GK STUDIOS
          </span>
        </button>

        {/* Zone 2: Clean public-only single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#E6ECEB]/85">
          <button
            type="button"
            onClick={() => handleLink('portfolio')}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
          >
            Portfolio
          </button>
          <button
            type="button"
            onClick={() => handleLink('packages')}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
          >
            Packages
          </button>
          <button
            type="button"
            onClick={() => handleLink('studio-story')}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
          >
            Studio
          </button>
          <button
            type="button"
            onClick={() => handleLink('availability')}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
          >
            Availability
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            onClick={() => handleLink('availability')}
            className="hidden sm:inline-flex"
          >
            Check Dates
          </Button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-md border border-[#C5B378]/30 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Public links only) */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#C5B378]/20 bg-[#072421] px-4 py-4 space-y-1">
          {[
            { label: 'Portfolio', id: 'portfolio' },
            { label: 'Packages', id: 'packages' },
            { label: 'Studio & Contact', id: 'studio-story' },
            { label: 'Availability & Booking', id: 'availability' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLink(item.id)}
              className="block w-full text-left rounded-md px-3 py-2.5 text-sm font-medium text-[#E6ECEB] hover:bg-[#0E423E] hover:text-white cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
