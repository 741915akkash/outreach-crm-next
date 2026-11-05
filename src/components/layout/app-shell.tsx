'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';

type AppShellProps = {
  children: React.ReactNode;
  workspaceId: string;
};

export function AppShell({ children, workspaceId }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();

  let pageTitle = 'Dashboard';
  let actionLabel: string | undefined;

  switch (true) {
    case pathname.endsWith('/leads'):
      pageTitle = 'Leads';
      actionLabel = 'Add lead';
      break;

    case pathname.endsWith('/companies'):
      pageTitle = 'Companies';
      actionLabel = 'Add company';
      break;

    case pathname.endsWith('/deals'):
      pageTitle = 'Deals';
      actionLabel = 'Add deal';
      break;

    case pathname.endsWith('/tasks'):
      pageTitle = 'Tasks';
      actionLabel = 'Add task';
      break;

    case pathname.endsWith('/activities'):
      pageTitle = 'Activities';
      break;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen sm:pl-[250px]">
        {/* Desktop sidebar */}
        <div className="fixed inset-y-0 left-0 z-40 hidden w-[250px] sm:block">
          <AppSidebar workspaceId={workspaceId} />
        </div>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/40"
            />

            {/* Drawer */}
            <div className="absolute inset-y-0 left-0">
              <AppSidebar workspaceId={workspaceId} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onMenuClick={() => setMobileOpen(true)} title={pageTitle} actionLabel={actionLabel} />

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px] min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
