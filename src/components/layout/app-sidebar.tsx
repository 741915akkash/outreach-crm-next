'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Activity,
  Building2,
  CheckSquare,
  Handshake,
  LayoutDashboard,
  Settings,
  Users,
  ChevronDown,
} from 'lucide-react';

type AppSidebarProps = {
  workspaceId: string;
  onNavigate?: () => void;
};

export function AppSidebar({ workspaceId, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  const basePath = `/workspaces/${workspaceId}`;

  const navigationItems = [
    {
      label: 'Dashboard',
      href: `${basePath}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: 'Leads',
      href: `${basePath}/leads`,
      icon: Users,
    },
    {
      label: 'Companies',
      href: `${basePath}/companies`,
      icon: Building2,
    },
    {
      label: 'Deals',
      href: `${basePath}/deals`,
      icon: Handshake,
    },
    {
      label: 'Tasks',
      href: `${basePath}/tasks`,
      icon: CheckSquare,
    },
    {
      label: 'Activities',
      href: `${basePath}/activities`,
      icon: Activity,
    },
  ];

  return (
    <aside className="flex h-screen w-[250px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-[68px] items-center border-b border-gray-100 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Activity className="size-5" />
          </div>

          <span className="text-[17px] font-bold tracking-tight text-gray-900">
            Outreach<span className="text-emerald-600">CRM</span>
          </span>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="border-b border-gray-100 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:bg-gray-50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
            A
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              Acme Workspace
            </p>
            <p className="text-xs text-gray-500">Free plan</p>
          </div>

          <ChevronDown className="size-4 shrink-0 text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7 px-3 py-5">
        <div>
          <p className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-gray-400">
            GENERAL
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  onClick={onNavigate}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-50 font-semibold text-emerald-700'
                      : 'font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="size-[18px] shrink-0" />

                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div>
          <p className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-gray-400">
            PREFERENCES
          </p>

          <Link
            href={`${basePath}/settings`}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith(`${basePath}/settings`)
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Settings className="size-[18px]" />
            Settings
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            AS
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              Akash Saini
            </p>

            <p className="truncate text-xs text-gray-500">Workspace member</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
