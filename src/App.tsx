import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { StudioProvider } from '@/src/context/StudioContext';
import { EventCategory, StudioPackage } from '@/src/types/studio';
import { Navbar } from '@/src/components/Navbar';
import { HeroSection } from '@/src/components/HeroSection';
import { PortfolioSection } from '@/src/components/PortfolioSection';
import { PackagesSection } from '@/src/components/PackagesSection';
import { StudioAboutSection } from '@/src/components/StudioAboutSection';
import { BookingSection } from '@/src/components/BookingSection';
import { Footer } from '@/src/components/Footer';
import { AdminDashboard } from '@/src/components/admin/AdminDashboard';

function isAdminLocation(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash === '#/admin' ||
    window.location.pathname === '/admin' ||
    window.location.pathname.endsWith('/admin')
  );
}

function GKStudiosAppShell() {
  const [activeView, setActiveView] = useState<'public' | 'admin'>(() =>
    isAdminLocation() ? 'admin' : 'public'
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-grand');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);

  useEffect(() => {
    const syncFromUrl = () => {
      setActiveView(isAdminLocation() ? 'admin' : 'public');
    };
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  // Hidden keyboard shortcut Ctrl+Shift+A (or Cmd+Shift+A) for studio staff
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        switchView(activeView === 'admin' ? 'public' : 'admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const switchView = (nextView: 'public' | 'admin') => {
    setActiveView(nextView);
    if (typeof window !== 'undefined') {
      if (nextView === 'admin') {
        window.location.hash = '#/admin';
      } else {
        window.history.replaceState(null, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToSection = (sectionId: string) => {
    if (activeView !== 'public') {
      switchView('public');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPackage = (pkg: StudioPackage) => {
    setSelectedPackageId(pkg.id);
    toast.success(`${pkg.name} selected — complete your date inquiry below.`);
    jumpToSection('availability');
  };

  const handleBookCategory = (category: EventCategory) => {
    setSelectedCategory(category);
    toast.info(`Event type set to ${category}. Choose an open date below.`);
    jumpToSection('availability');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#092E2B] text-[#E6ECEB]">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0E423E',
            color: '#FFFFFF',
            border: '1px solid rgba(197, 179, 120, 0.45)',
          },
        }}
      />

      <Navbar
        activeView={activeView}
        onSwitchView={switchView}
        onJumpToSection={jumpToSection}
      />

      {activeView === 'admin' ? (
        <div className="flex-1">
          <AdminDashboard onExitAdmin={() => switchView('public')} />
        </div>
      ) : (
        <main className="flex-1">
          <HeroSection
            onCheckAvailability={() => jumpToSection('availability')}
            onExplorePackages={() => jumpToSection('packages')}
          />
          <PortfolioSection onBookCategory={handleBookCategory} />
          <PackagesSection
            selectedPackageId={selectedPackageId}
            onSelectPackage={handleSelectPackage}
          />
          <StudioAboutSection />
          <BookingSection
            preselectedPackageId={selectedPackageId}
            preselectedCategory={selectedCategory}
          />
          <Footer
            onJumpToSection={jumpToSection}
            onHiddenAdminTrigger={() => switchView('admin')}
          />
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <GKStudiosAppShell />
    </StudioProvider>
  );
}
