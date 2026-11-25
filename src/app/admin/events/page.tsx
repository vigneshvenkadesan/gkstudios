'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/src/components/Navbar';
import { AdminDashboard } from '@/src/components/admin/AdminDashboard';

export default function AdminEventsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#072421] text-[#E6ECEB]">
      <Navbar
        activeView="admin"
        onSwitchView={(view) => {
          if (view === 'public') router.push('/');
        }}
        onJumpToSection={(sectionId) => router.push(`/#${sectionId}`)}
      />
      <div className="flex-1">
        <AdminDashboard initialTab="events" onExitAdmin={() => router.push('/')} />
      </div>
    </div>
  );
}
