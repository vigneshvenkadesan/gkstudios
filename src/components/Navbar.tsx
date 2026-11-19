'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import { useOptionalPublicPreferences } from '@/src/context/PublicPreferencesContext';
import { PublicLocale, TranslationKey, translate } from '@/src/i18n/translations';

interface NavbarProps {
  activeView: 'public' | 'admin';
  onSwitchView: (view: 'public' | 'admin') => void;
  onJumpToSection: (sectionId: string) => void;
}

const NAV_LINKS = [
  { key: 'nav.home', id: 'hero' },
  { key: 'nav.work', id: 'portfolio' },
  { key: 'nav.packages', id: 'packages' },
  { key: 'nav.about', id: 'studio-story' },
  { key: 'nav.contact', id: 'contact' },
] as const;

const TRACKED_SECTIONS = ['hero', 'portfolio', 'packages', 'studio-story', 'availability', 'contact'];

export function Navbar({ activeView, onSwitchView, onJumpToSection }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const preferences = useOptionalPublicPreferences();
  const locale: PublicLocale = preferences?.locale ?? 'en';
  const t = (key: TranslationKey) => translate(locale, key);

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
      <div
        className={`mx-auto flex h-16 sm:h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${
          activeView === 'public'
            ? 'gap-2 sm:gap-3 lg:gap-4'
            : 'gap-8'
        }`}
      >
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLink('hero')}
          className="flex items-center gap-1.5 sm:gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] rounded-sm py-1"
        >
          <GKCameraMark className="h-6 w-8 sm:h-7 sm:w-10 shrink-0" />
          <span className="text-sm sm:text-lg font-bold tracking-[0.12em] sm:tracking-[0.2em] text-white whitespace-nowrap shrink-0">
            GK STUDIOS
          </span>
        </button>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav
          aria-label={activeView === 'public' ? t('nav.primary') : 'Primary navigation'}
          className={`hidden ${activeView === 'public' ? 'lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm' : 'md:flex items-center gap-7 text-sm'} font-medium`}
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
                {activeView === 'public' ? t(link.key) : translate('en', link.key)}
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

        <div className={`flex items-center shrink-0 ${activeView === 'public' ? 'gap-2' : 'gap-3'}`}>
          <Button
            size="sm"
            onClick={() => handleLink('availability')}
            className={activeView === 'public' ? 'hidden xl:inline-flex' : 'hidden sm:inline-flex'}
          >
            {activeView === 'public' ? t('nav.checkAvailability') : 'Check Availability'}
          </Button>
          {activeView === 'public' && preferences && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={preferences.toggleTheme}
                aria-label={t(preferences.theme === 'dark' ? 'nav.switchToLight' : 'nav.switchToDark')}
                title={t(preferences.theme === 'dark' ? 'nav.switchToLight' : 'nav.switchToDark')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C5B378]/30 bg-[#092E2B]/70 text-[#D8C78E] transition-colors hover:border-[#D8C78E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E]"
              >
                {preferences.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div role="group" aria-label={t('nav.language')} className="flex items-center gap-1 text-[10px] sm:text-xs">
                <button
                  type="button"
                  aria-pressed={locale === 'en'}
                  onClick={() => preferences.setLocale('en')}
                  className={`rounded-sm px-1 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D8C78E] ${locale === 'en' ? 'font-semibold text-[#D8C78E]' : 'text-[#E6ECEB]/70 hover:text-white'}`}
                >
                  EN
                </button>
                <span aria-hidden="true" className="text-[#C5B378]/55">|</span>
                <button
                  type="button"
                  aria-pressed={locale === 'ta'}
                  onClick={() => preferences.setLocale('ta')}
                  className={`whitespace-nowrap rounded-sm px-1 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D8C78E] ${locale === 'ta' ? 'font-semibold text-[#D8C78E]' : 'text-[#E6ECEB]/70 hover:text-white'}`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            aria-label={activeView === 'public'
              ? t(mobileOpen ? 'nav.closeMenu' : 'nav.openMenu')
              : mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`inline-flex items-center justify-center rounded-sm border border-[#C5B378]/35 bg-[#092E2B]/70 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer ${
              activeView === 'public' ? 'lg:hidden h-10 w-10' : 'md:hidden h-11 w-11'
            }`}
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
            className={`${activeView === 'public' ? 'lg:hidden' : 'md:hidden'} border-t border-[#C5B378]/20 bg-[#072421]/98 backdrop-blur-lg px-4 py-5`}
          >
            <nav aria-label={activeView === 'public' ? t('nav.mobile') : 'Mobile navigation'} className="space-y-1">
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
                    <span>{activeView === 'public' ? t(item.key) : translate('en', item.key)}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#D8C78E]" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-[#C5B378]/15">
              <Button className="w-full" size="lg" onClick={() => handleLink('availability')}>
                {activeView === 'public' ? t('nav.checkAvailability') : 'Check Availability'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
