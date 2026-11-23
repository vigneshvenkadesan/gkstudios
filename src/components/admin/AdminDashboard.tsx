'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  EyeOff,
  GitCommitHorizontal,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Package as PackageIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { AdminBookingModule } from '@/src/components/admin/AdminBookingModule';
import { AdminScheduleModule } from '@/src/components/admin/AdminScheduleModule';
import { AdminEventsTimelineModule } from '@/src/components/admin/AdminEventsTimelineModule';
import { AdminGalleryModule } from '@/src/components/admin/AdminGalleryModule';
import { AdminPackagesModule } from '@/src/components/admin/AdminPackagesModule';
import { AdminServicesModule } from '@/src/components/admin/AdminServicesModule';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

type AdminTab = 'bookings' | 'schedule' | 'timeline' | 'gallery' | 'packages' | 'services';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export function AdminDashboard({ onExitAdmin }: AdminDashboardProps) {
  const {
    bookings,
    calendarEntries,
    portfolio,
    packages,
    eventProjects,
    isLoading,
    refreshStudio,
  } = useStudio();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [alertedInquiryIds, setAlertedInquiryIds] = useState<string[]>([]);
  const hasInitializedInquiryAlerts = useRef(false);
  const observedInquiryIds = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data: { authenticated?: boolean }) => {
        if (active && data.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // Ignore
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = window.setInterval(() => {
      void refreshStudio();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(refreshInterval);
  }, [isAuthenticated, refreshStudio]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    if (!hasInitializedInquiryAlerts.current) {
      hasInitializedInquiryAlerts.current = true;
      const pendingInquiries = bookings.filter((booking) => booking.status === 'Pending');
      setAlertedInquiryIds(pendingInquiries.map((booking) => booking.id));
      bookings.forEach((booking) => observedInquiryIds.current.add(booking.id));
      return;
    }

    const newPendingInquiries = bookings.filter(
      (booking) =>
        booking.status === 'Pending' && !observedInquiryIds.current.has(booking.id)
    );
    bookings.forEach((booking) => observedInquiryIds.current.add(booking.id));

    if (newPendingInquiries.length > 0) {
      setAlertedInquiryIds((currentIds) => [
        ...new Set([...currentIds, ...newPendingInquiries.map((booking) => booking.id)]),
      ]);
    }
  }, [bookings, isAuthenticated, isLoading]);

  const activeLeadsCount = bookings.filter(
    (b) => b.status === 'Pending' || b.status === 'In Discussion'
  ).length;
  const activeEventsCount = eventProjects.filter((p) => p.currentStage !== 'Delivered').length;
  const blockedDatesCount = calendarEntries.length;
  const visiblePhotosCount = portfolio.filter((p) => p.isVisible).length;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = (await res.json()) as { authenticated?: boolean; error?: string };
      if (!res.ok || !data.authenticated) {
        toast.error(data.error || 'Invalid six-digit PIN.');
        return;
      }
      setIsAuthenticated(true);
      toast.success('Signed in to GK Studios Admin Portal.');
    } catch {
      toast.error('Unable to verify PIN right now.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setIsAuthenticated(false);
    setPinInput('');
    toast.info('Signed out of Studio Admin.');
  };

  if (checkingSession) {
    return (
      <section className="min-h-screen bg-[#072421] flex items-center justify-center p-6">
        <p className="text-sm text-[#D8C78E]">Verifying studio session...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="min-h-screen bg-[#072421] py-16 px-4 flex items-center justify-center studio-pattern-bg">
        <Card className="w-full max-w-md border-[#C5B378]/35 bg-[#092E2B] shadow-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-16 items-center justify-center rounded-xl border border-[#C5B378]/30 bg-[#0E423E]">
              <GKCameraMark className="h-9 w-12" />
            </div>
            <CardTitle className="text-2xl tracking-wide text-white">
              GK STUDIOS · Studio Staff Portal
            </CardTitle>
            <CardDescription className="text-[#E6ECEB]/80">
              Restricted studio workspace for managing booking requests, schedule calendar, event
              delivery timelines, and payment records.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="adminPin" className="block text-xs font-medium text-[#D8C78E]">
                  Six-digit studio PIN
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D8C78E]" />
                  <input
                    id="adminPin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    minLength={6}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    placeholder="Enter six digits"
                    className="h-11 w-full rounded-md border border-[#C5B378]/35 bg-[#072421] pl-10 pr-3 font-mono text-sm tracking-widest text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={authSubmitting || pinInput.length !== 6}
              >
                <KeyRound className="h-4 w-4" />
                {authSubmitting ? 'Verifying...' : 'Unlock Studio Admin'}
              </Button>
            </form>

            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full text-center text-xs text-[#E6ECEB]/70 hover:text-white transition-colors pt-1 cursor-pointer"
            >
              Return to Public Website
            </button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'bookings', label: 'Leads & Inquiries', icon: Inbox, badgeCount: activeLeadsCount },
    { id: 'schedule', label: 'Schedule & Calendar', icon: CalendarDays, badgeCount: blockedDatesCount },
    { id: 'timeline', label: 'Event Timeline & Payments', icon: GitCommitHorizontal, badgeCount: activeEventsCount },
    { id: 'gallery', label: 'Gallery Manager', icon: ImageIcon, badgeCount: visiblePhotosCount },
    { id: 'packages', label: 'Packages Manager', icon: PackageIcon, badgeCount: packages.length },
    { id: 'services', label: 'Service Pricing', icon: SlidersHorizontal, badgeCount: undefined },
  ];

  const activeTitle =
    activeTab === 'bookings'
      ? 'Leads & Booking Inquiries'
      : activeTab === 'schedule'
      ? 'Studio Schedule & Master Calendar'
      : activeTab === 'timeline'
      ? 'Event Delivery Timeline & Payment Ledger'
      : activeTab === 'gallery'
      ? 'Live Gallery & Portfolio Manager'
      : activeTab === 'packages'
      ? 'Photography Packages & Collections Manager'
      : 'Master Service & Pricing Manager';

  return (
    <div className="min-h-screen bg-[#072421] text-[#E6ECEB]">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col lg:flex-row">
        {/* Left Workspace Sidebar */}
        <aside
          className={`${isSidebarHidden ? 'lg:hidden' : ''} w-full shrink-0 border-b border-[#C5B378]/20 bg-[#092E2B] p-3 sm:p-4 flex flex-col justify-between gap-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r ${
            isSidebarCollapsed ? 'lg:w-[4.5rem] lg:p-2' : 'lg:w-64 lg:p-3'
          }`}
        >
          <div className="space-y-3">
            <div className={`flex items-center justify-between gap-2 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
              <div className={`space-y-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-[9px] font-semibold tracking-[0.14em] text-[#D8C78E]">
                  STUDIO OPERATIONS
                </p>
                <h2 className="text-sm font-bold text-white">G Krishna Workspace</h2>
              </div>
              <div className="hidden items-center gap-0.5 lg:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${isSidebarCollapsed ? 'h-6 w-6' : 'h-8 w-8'} shrink-0 text-[#D8C78E] hover:bg-[#0E423E] hover:text-white`}
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-expanded={!isSidebarCollapsed}
                  aria-controls="admin-workspace-navigation"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${isSidebarCollapsed ? 'h-6 w-6' : 'h-8 w-8'} shrink-0 text-[#D8C78E] hover:bg-[#0E423E] hover:text-white`}
                  aria-label="Hide sidebar"
                  title="Hide sidebar"
                  onClick={() => setIsSidebarHidden(true)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <nav
              id="admin-workspace-navigation"
              aria-label="Studio operations"
              className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer lg:w-full ${
                      isActive
                        ? 'bg-[#C5B378] text-[#072421] font-semibold'
                        : 'text-[#E6ECEB]/85 hover:bg-[#0E423E] hover:text-white'
                    }`}
                  >
                    <span className={`inline-flex items-center gap-2 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    </span>
                    {typeof item.badgeCount === 'number' && (
                      <span
                        className={`font-mono text-[10px] tabular-nums ${
                          isActive ? 'text-[#072421]' : 'text-[#D8C78E]'
                        } ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={`hidden lg:flex flex-col gap-1.5 border-t border-[#C5B378]/15 pt-3 ${isSidebarCollapsed ? 'items-center' : ''}`}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title={isSidebarCollapsed ? 'Lock Admin Session' : undefined}
              className={isSidebarCollapsed ? 'justify-center px-2' : 'justify-start'}
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className={isSidebarCollapsed ? 'sr-only' : ''}>Lock Admin Session</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              title={isSidebarCollapsed ? 'Exit to Public Site' : undefined}
              className={isSidebarCollapsed ? 'justify-center px-2' : 'justify-start'}
              onClick={onExitAdmin}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className={isSidebarCollapsed ? 'sr-only' : ''}>Exit to Public Site</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-5 sm:px-8 sm:py-6 lg:px-10 xl:px-14 2xl:px-16 space-y-6 min-w-0">
          {/* Top Breadcrumb Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C5B378]/15 pb-5">
            <div className="flex items-start gap-3">
              {isSidebarHidden && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="hidden h-8 w-8 shrink-0 lg:inline-flex"
                  aria-label="Show sidebar"
                  title="Show sidebar"
                  onClick={() => setIsSidebarHidden(false)}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <div>
                <p className="text-xs text-[#D8C78E]">
                  GK Studios / Admin Portal /{' '}
                  <span className="text-white">{navItems.find((n) => n.id === activeTab)?.label}</span>
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{activeTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button type="button" variant="outline" size="sm" onClick={onExitAdmin}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Public Site
              </Button>
            </div>
          </div>

          {alertedInquiryIds.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start justify-between gap-4 rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-amber-100"
            >
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <p className="font-semibold">
                    {alertedInquiryIds.length === 1
                      ? 'New inquiry needs your attention'
                      : `${alertedInquiryIds.length} inquiries need your attention`}
                  </p>
                  <p className="mt-1 text-sm text-amber-100/80">
                    Review them in Leads &amp; Inquiries. This alert stays here until you close it.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-amber-300/40 text-amber-100 hover:bg-amber-400/10"
                  onClick={() => setActiveTab('bookings')}
                >
                  Review inquiries
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-amber-100 hover:bg-amber-400/10 hover:text-white"
                  aria-label="Close inquiry notification"
                  title="Close notification"
                  onClick={() => setAlertedInquiryIds([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Active Module Viewport */}
          {activeTab === 'bookings' && <AdminBookingModule />}
          {activeTab === 'schedule' && <AdminScheduleModule />}
          {activeTab === 'timeline' && <AdminEventsTimelineModule />}
          {activeTab === 'gallery' && <AdminGalleryModule />}
          {activeTab === 'packages' && <AdminPackagesModule />}
          {activeTab === 'services' && <AdminServicesModule />}
        </main>
      </div>
    </div>
  );
}
