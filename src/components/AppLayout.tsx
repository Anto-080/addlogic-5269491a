import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useAppData";
import { Search, Layers, LayoutDashboard } from "lucide-react";
import { RoundVault } from "@/components/icons/RoundVault";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { useAdBlockDetector } from "@/hooks/useAdBlockDetector";
import { AdBlockConsentSlide } from "@/components/AdBlockConsentSlide";

const QUICK_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/research", label: "Research", icon: Search },
  { to: "/tiers", label: "Tiers & Sponsors", icon: Layers },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: stats } = useUserStats();
  const location = useLocation();
  const vaultBalance = stats?.earnings_all_time ?? 0;
  const { cookieAutoAccept } = useSettings();
  const blocked = useAdBlockDetector(cookieAutoAccept ? 5000 : 0);
  const [gateDismissed, setGateDismissed] = useState(false);
  const showAdBlockGate = cookieAutoAccept && blocked === true && !gateDismissed;

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

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {/* Quick-access icon shortcuts (always visible, icon-only on small) */}
              <nav className="flex items-center gap-0.5">
                {QUICK_LINKS.map((l) => {
                  const active = location.pathname.startsWith(l.to);
                  return (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      aria-label={l.label}
                      title={l.label}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <l.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{l.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <NavLink
                to="/earnings"
                className="flex items-center gap-1.5 bg-secondary/50 hover:bg-secondary rounded-full px-2.5 py-1.5 transition-colors"
                aria-label="Open Vault"
                title="Vault"
              >
                <RoundVault size={16} style={{ color: "#B0903D" }} />
                <span className="text-xs sm:text-sm font-semibold text-money">T${vaultBalance.toFixed(2)}</span>
              </NavLink>

              <NavLink
                to="/settings"
                aria-label="Open Settings"
                title="Settings"
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 hover:ring-2 hover:ring-primary/40 transition-all"
              >
                {user?.email?.charAt(0).toUpperCase() || "R"}
              </NavLink>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <AdBlockConsentSlide
        open={showAdBlockGate}
        onSatisfied={() => setGateDismissed(true)}
      />
    </SidebarProvider>
  );
}
