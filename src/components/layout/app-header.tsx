'use client';

import { Menu, Plus } from 'lucide-react';

type AppHeaderProps = {
  onMenuClick: () => void;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AppHeader({
  onMenuClick,
  title = 'Dashboard',
  actionLabel,
  onAction,
}: AppHeaderProps) {
  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 sm:hidden"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 ml-3">
          <h1 className="truncate text-2xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition hover:bg-emerald-700 sm:px-4"
          >
            <Plus className="size-4" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
