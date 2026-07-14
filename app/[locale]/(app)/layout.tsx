import { AppShell } from "@/components/layout/app-shell";

// TODO(Phase 1): replace placeholder user/role with the real session.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell userName="Admin" role="ADMIN">
      {children}
    </AppShell>
  );
}
