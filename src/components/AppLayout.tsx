import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_EARNINGS } from "@/lib/mockData";
import { Wallet, Search, Layers, Lock, ChevronUp } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { to: "/research", label: "Research", icon: Search },
  { to: "/tiers", label: "Tiers & Sponsors", icon: Layers },
  { to: "/investments", label: "Investments", icon: Lock },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-2 sm:px-4 bg-card/50 backdrop-blur-sm gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden lg:block whitespace-nowrap">Welcome back</span>
            </div>

            {/* Quick-access nav (sm+) */}
            <nav className="hidden sm:flex items-center gap-1">
              {QUICK_LINKS.map((l) => {
                const active = location.pathname.startsWith(l.to);
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary border-b-2 border-primary rounded-b-none"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <l.icon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{l.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <NavLink
                to="/earnings"
                className="relative flex items-center gap-2 bg-secondary/50 hover:bg-secondary rounded-full px-3 py-1.5 transition-colors"
                aria-label="Open Earnings"
              >
                <ChevronUp className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 text-primary" />
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">${MOCK_EARNINGS.allTime.toFixed(2)}</span>
              </NavLink>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
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
