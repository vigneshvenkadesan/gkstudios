'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { EventCategory, StudioPackage } from '@/src/types/studio';
import { Navbar } from '@/src/components/Navbar';
import { HeroSection } from '@/src/components/HeroSection';
import { StatsSection } from '@/src/components/StatsSection';
import { DeliveryPromiseSection } from '@/src/components/DeliveryPromiseSection';
import { PortfolioSection } from '@/src/components/PortfolioSection';
import { PackagesSection } from '@/src/components/PackagesSection';
import { StudioAboutSection } from '@/src/components/StudioAboutSection';
import { BookingSection } from '@/src/components/BookingSection';
import { Footer } from '@/src/components/Footer';
import { PublicPreferencesProvider, usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { getPackageCopy, translate, translateCategory } from '@/src/i18n/translations';

export function PublicStudioPage() {
  return (
    <PublicPreferencesProvider>
      <PublicStudioContent />
    </PublicPreferencesProvider>
  );
}

function PublicStudioContent() {
  const router = useRouter();
  const { locale } = usePublicPreferences();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-grand');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [portfolioFilterCategory, setPortfolioFilterCategory] = useState<EventCategory | null>(
    null
  );

  // Support legacy #/admin hash navigation seamlessly
  useEffect(() => {
    if (window.location.hash === '#/admin') {
      router.push('/admin');
    }
    const onHashChange = () => {
      if (window.location.hash === '#/admin') {
        router.push('/admin');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [router]);

  // Hidden staff shortcut Ctrl+Shift+A / Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        router.push('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const jumpToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const handleSelectPackage = (pkg: StudioPackage) => {
    setSelectedPackageId(pkg.id);
    toast.success(t('packages.selectedToast', { name: getPackageCopy(pkg).name }));
    jumpToSection('availability');
  };

  const handleBookCategory = (category: EventCategory) => {
    setSelectedCategory(category);
    toast.info(t('portfolio.eventTypeToast', { category: translateCategory(locale, category) }));
    jumpToSection('availability');
  };

  const handleFilterPortfolioFromFooter = (category: EventCategory) => {
    setPortfolioFilterCategory(category);
    jumpToSection('portfolio');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#092E2B] text-[#E6ECEB]">
        <Navbar
          activeView="public"
          onSwitchView={(view) => {
            if (view === 'admin') router.push('/admin');
          }}
          onJumpToSection={jumpToSection}
        />

        <main className="flex-1">
          <HeroSection
            onCheckAvailability={() => jumpToSection('availability')}
            onExploreWork={() => jumpToSection('portfolio')}
          />
          <DeliveryPromiseSection />
          <StatsSection />
          <PortfolioSection
            onBookCategory={handleBookCategory}
            externalCategoryFilter={portfolioFilterCategory}
          />
          <PackagesSection
            selectedPackageId={selectedPackageId}
            onSelectPackage={handleSelectPackage}
          />
          <StudioAboutSection
            onMeetStudio={() => jumpToSection('contact')}
          />
          <BookingSection
            preselectedPackageId={selectedPackageId}
            preselectedCategory={selectedCategory}
          />
        </main>

        <Footer
          onJumpToSection={jumpToSection}
          onSelectCategory={handleFilterPortfolioFromFooter}
          onHiddenAdminTrigger={() => router.push('/admin')}
        />
      </div>
    </MotionConfig>
  );
}
