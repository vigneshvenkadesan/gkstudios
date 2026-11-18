import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  GitCommitHorizontal,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { AdminBookingModule } from '@/src/components/admin/AdminBookingModule';
import { AdminScheduleModule } from '@/src/components/admin/AdminScheduleModule';
import { AdminEventsTimelineModule } from '@/src/components/admin/AdminEventsTimelineModule';
import { AdminGalleryModule } from '@/src/components/admin/AdminGalleryModule';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

type AdminTab = 'bookings' | 'schedule' | 'timeline' | 'gallery';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

const DEMO_PIN = '1234';

export function AdminDashboard({ onExitAdmin }: AdminDashboardProps) {
  const { bookings, calendarEntries, portfolio, eventProjects, resetDemoData } = useStudio();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');

  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const activeEventsCount = eventProjects.filter((p) => p.currentStage !== 'Delivered').length;
  const blockedDatesCount = calendarEntries.length;
  const visiblePhotosCount = portfolio.filter((p) => p.isVisible).length;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEMO_PIN) {
      setIsAuthenticated(true);
      toast.success('Signed in to GK Studios Admin Portal.');
    } else {
      toast.error('Incorrect PIN. Use 1234 or click Demo Admin Login.');
    }
  };

  const handleDemoLogin = () => {
    setPinInput(DEMO_PIN);
    setIsAuthenticated(true);
    toast.success('Signed in via Demo Admin Access.');
  };

  if (!isAuthenticated) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-[#072421] py-16 px-4 flex items-center justify-center studio-pattern-bg">
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
                  Studio PIN (Demo PIN: <span className="font-mono">1234</span>)
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D8C78E]" />
                  <input
                    id="adminPin"
                    type="password"
                    inputMode="numeric"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter 4-digit studio PIN"
                    className="h-11 w-full rounded-md border border-[#C5B378]/35 bg-[#072421] pl-10 pr-3 font-mono text-sm tracking-widest text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <KeyRound className="h-4 w-4" />
                Unlock Studio Admin
              </Button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="h-px w-full bg-[#C5B378]/20" />
              <span className="bg-[#092E2B] px-3 text-xs text-[#E6ECEB]/60 whitespace-nowrap">
                Quick Testing
              </span>
              <div className="h-px w-full bg-[#C5B378]/20" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleDemoLogin}
            >
              One-Click Demo Admin Login
            </Button>

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
    { id: 'bookings', label: 'Booking Inbox', icon: Inbox, badgeCount: pendingCount },
    { id: 'schedule', label: 'Schedule & Calendar', icon: CalendarDays, badgeCount: blockedDatesCount },
    { id: 'timeline', label: 'Event Timeline & Payments', icon: GitCommitHorizontal, badgeCount: activeEventsCount },
    { id: 'gallery', label: 'Gallery Manager', icon: ImageIcon, badgeCount: visiblePhotosCount },
  ];

  const activeTitle =
    activeTab === 'bookings'
      ? 'Booking Requests & Acknowledgement Workflow'
      : activeTab === 'schedule'
      ? 'Studio Schedule & Master Calendar'
      : activeTab === 'timeline'
      ? 'Event Delivery Timeline & Payment Ledger'
      : 'Live Gallery & Portfolio Manager';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#072421] text-[#E6ECEB]">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Left Workspace Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#C5B378]/20 bg-[#092E2B] p-4 sm:p-5 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#D8C78E]">
                STUDIO OPERATIONS
              </p>
              <h2 className="text-base font-bold text-white">G Krishna Workspace</h2>
            </div>

            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#C5B378] text-[#072421] font-semibold'
                        : 'text-[#E6ECEB]/85 hover:bg-[#0E423E] hover:text-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.badgeCount === 'number' && (
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          isActive ? 'text-[#072421]' : 'text-[#D8C78E]'
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:flex flex-col gap-2 border-t border-[#C5B378]/15 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => {
                resetDemoData();
                toast.info('Demo studio bookings, calendar, timeline, and gallery restored.');
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Demo Data
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={onExitAdmin}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit to Public Site
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
          {/* Top Breadcrumb Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C5B378]/15 pb-5">
            <div>
              <p className="text-xs text-[#D8C78E]">
                GK Studios / Admin Portal /{' '}
                <span className="text-white">{navItems.find((n) => n.id === activeTab)?.label}</span>
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{activeTitle}</h1>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetDemoData();
                  toast.info('Demo data restored.');
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onExitAdmin}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Public Site
              </Button>
            </div>
          </div>

          {/* Active Module Viewport */}
          {activeTab === 'bookings' && <AdminBookingModule />}
          {activeTab === 'schedule' && <AdminScheduleModule />}
          {activeTab === 'timeline' && <AdminEventsTimelineModule />}
          {activeTab === 'gallery' && <AdminGalleryModule />}
        </main>
      </div>
    </div>
  );
}
