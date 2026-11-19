'use client';

import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';

interface NavbarProps {
  activeView: 'public' | 'admin';
  onSwitchView: (view: 'public' | 'admin') => void;
  onJumpToSection: (sectionId: string) => void;
}

const NAV_LINKS = [
  { label: 'Home', id: 'hero' },
  { label: 'Our Work', id: 'portfolio' },
  { label: 'Packages', id: 'packages' },
  { label: 'About', id: 'studio-story' },
  { label: 'Contact', id: 'contact' },
] as const;

const TRACKED_SECTIONS = ['hero', 'portfolio', 'packages', 'studio-story', 'availability', 'contact'];

export function Navbar({ activeView, onSwitchView, onJumpToSection }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 36);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeView !== 'public') return;

    const elements = TRACKED_SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const topId = visible[0].target.id;
          setActiveSection(topId === 'availability' ? 'contact' : topId);
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeView]);

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

  const isTransparent = activeView === 'public' && !isScrolled && !mobileOpen;

  return (
    <header
      className={`${
        activeView === 'public' ? 'fixed inset-x-0 top-0' : 'sticky top-0'
      } z-40 transition-all duration-300 ${
        isTransparent
          ? 'bg-gradient-to-b from-[#061E1C]/80 via-[#061E1C]/35 to-transparent border-b border-transparent'
          : 'bg-[#092E2B]/95 backdrop-blur-md border-b border-[#C5B378]/20 shadow-[0_8px_30px_rgba(4,20,18,0.35)]'
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-[72px] max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLink('hero')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] rounded-sm py-1"
        >
          <GKCameraMark className="h-7 w-10 shrink-0" />
          <span className="text-base sm:text-lg font-bold tracking-[0.2em] text-white whitespace-nowrap shrink-0">
            GK STUDIOS
          </span>
        </button>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeView === 'public' && activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLink(link.id)}
                className={`relative whitespace-nowrap shrink-0 py-1.5 tracking-[0.02em] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] rounded-sm ${
                  isActive ? 'text-white' : 'text-[#E6ECEB]/80 hover:text-white'
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#D8C78E] transition-transform duration-200 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            onClick={() => handleLink('availability')}
            className="hidden sm:inline-flex"
          >
            Check Availability
          </Button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-sm border border-[#C5B378]/35 bg-[#092E2B]/70 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-[#C5B378]/20 bg-[#072421]/98 backdrop-blur-lg px-4 py-5"
          >
            <nav aria-label="Mobile navigation" className="space-y-1">
              {NAV_LINKS.map((item) => {
                const isActive = activeView === 'public' && activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLink(item.id)}
                    className={`flex w-full items-center justify-between rounded-sm px-3.5 py-3 text-base font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0E423E] text-[#D8C78E]'
                        : 'text-[#E6ECEB] hover:bg-[#0E423E]/70 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#D8C78E]" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-[#C5B378]/15">
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleLink('availability')}
              >
                Check Availability
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
