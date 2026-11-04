import { AppShell } from "@/components/layout/app-shell";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return (
    <AppShell workspaceId={workspaceId}>
      {children}
    </AppShell>
  );
}
