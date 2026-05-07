import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

interface AppLayoutProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function AppLayout({ children, allowedRoles }: AppLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
