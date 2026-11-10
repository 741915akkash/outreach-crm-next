import { AppShell } from '@/components/layout/app-shell';
import { Suspense } from 'react';

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

async function WorkspaceContent({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return <AppShell workspaceId={workspaceId}>{children}</AppShell>;
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <WorkspaceContent params={params}>{children}</WorkspaceContent>
    </Suspense>
  );
}
