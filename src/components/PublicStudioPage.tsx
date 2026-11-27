"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { EventCategory, StudioPackage } from "@/src/types/studio";
import { Navbar } from "@/src/components/Navbar";
import { HeroSection } from "@/src/components/HeroSection";
import { MandalaPageLoader } from "@/src/components/MandalaLoader";
import { StatsSection } from "@/src/components/StatsSection";
import { PromiseTimeline } from "@/src/components/PromiseTimeline";
import { PortfolioSection } from "@/src/components/PortfolioSection";
import { PackagesSection } from "@/src/components/PackagesSection";
import { StudioAboutSection } from "@/src/components/StudioAboutSection";
import { Footer } from "@/src/components/Footer";
import { TermsAndConditionsModal } from "@/src/components/TermsAndConditionsModal";
import {
  PublicPreferencesProvider,
  usePublicPreferences,
} from "@/src/context/PublicPreferencesContext";
import {
  getPackageCopy,
  translate,
  translateCategory,
} from "@/src/i18n/translations";

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
  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate(locale, key, params);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | null>(null);
  const [portfolioFilterCategory, setPortfolioFilterCategory] =
    useState<EventCategory | null>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPageLoaderVisible, setIsPageLoaderVisible] = useState(true);

  // Safety timeout so the Mandala curtain never blocks longer than 1.4s even on slow networks
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsPageLoaderVisible(false);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const proposalHref = (eventId?: string, pkg?: StudioPackage) => {
    const params = new URLSearchParams({
      event: eventId || pkg?.eventId || "wedding",
      plan: "half",
      guests: "classic",
      inquiry: "1",
    });
    if (pkg) {
      params.set("package", pkg.id);
      params.set("tier", String(pkg.sortOrder ?? 2));
    }
    return `/packages/proposal?${params.toString()}`;
  };

  // Support legacy #/admin hash navigation seamlessly
  useEffect(() => {
    if (window.location.hash === "#/admin") {
      router.push("/admin");
    }
    const onHashChange = () => {
      if (window.location.hash === "#/admin") {
        router.push("/admin");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [router]);

  // Hidden staff shortcut Ctrl+Shift+A / Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "a"
      ) {
        e.preventDefault();
        router.push("/admin");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const jumpToSection = (sectionId: string) => {
    if (sectionId === "availability") {
      router.push(
        proposalHref(
          selectedEventId || (selectedCategory ? String(selectedCategory) : undefined),
        ),
      );
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const handleSelectPackage = (pkg: StudioPackage, eventId?: string) => {
    setSelectedPackageId(pkg.id);
    if (eventId) {
      setSelectedEventId(eventId);
    } else if (pkg.eventId) {
      setSelectedEventId(pkg.eventId);
    }
    toast.success(
      t("packages.selectedToast", { name: getPackageCopy(pkg).name }),
    );
    router.push(proposalHref(eventId || pkg.eventId, pkg));
  };

  const handleBookCategory = (category: EventCategory) => {
    setSelectedCategory(category);
    toast.info(
      t("portfolio.eventTypeToast", {
        category: translateCategory(locale, category),
      }),
    );
    router.push(proposalHref(String(category)));
  };

  const handleFilterPortfolioFromFooter = (category: EventCategory) => {
    setPortfolioFilterCategory(category);
    jumpToSection("portfolio");
  };

  return (
    <MotionConfig reducedMotion="user">
      <MandalaPageLoader visible={isPageLoaderVisible} />
      <div className="min-h-screen flex flex-col bg-[#092E2B] text-[#E6ECEB]">
        <Navbar
          activeView="public"
          onSwitchView={(view) => {
            if (view === "admin") router.push("/admin");
          }}
          onJumpToSection={jumpToSection}
        />

        <main className="flex-1">
          <HeroSection
            onViewPackages={() => jumpToSection("packages")}
            onExploreWork={() => jumpToSection("portfolio")}
            onHeroReady={() => setIsPageLoaderVisible(false)}
          />

          <PortfolioSection
            onBookCategory={handleBookCategory}
            externalCategoryFilter={portfolioFilterCategory}
          />
          <PromiseTimeline />
          <PackagesSection
            selectedPackageId={selectedPackageId}
            onSelectPackage={handleSelectPackage}
          />
          <StudioAboutSection onMeetStudio={() => jumpToSection("contact")} />
        </main>

        <Footer
          onJumpToSection={jumpToSection}
          onSelectCategory={handleFilterPortfolioFromFooter}
          onHiddenAdminTrigger={() => router.push("/admin")}
          onOpenTerms={() => setIsTermsModalOpen(true)}
        />

        <TermsAndConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          isBookingFlow={false}
        />
      </div>
    </MotionConfig>
  );
}
