import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_EARNINGS } from "@/lib/mockData";
import { Wallet } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:block">Welcome back, Researcher</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">${MOCK_EARNINGS.allTime.toFixed(2)}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase() || "R"}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
