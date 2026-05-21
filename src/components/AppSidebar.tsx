import { Users, Lock, LogOut, Tag, Heart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import addlogicMark from "@/assets/addlogic-mark-square.jpg";
import lovableBanner from "@/assets/lovable-banner.jpg";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const LOVABLE_REF_URL = "https://lovable.dev/?utm_source=addlogic&utm_medium=sidebar&utm_campaign=self_referral";

const secondaryItems = [
  { title: "Connections", url: "/connections", icon: Users },
  { title: "Investments", url: "/investments", icon: Lock },
  { title: "Offers", url: "/offers", icon: Tag },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-primary/40 shrink-0">
            <img
              src={addlogicMark}
              alt="AddLogic"
              className="brand-asset h-full w-full object-cover"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gradient-gold">AddLogic</h1>
              <p className="text-xs text-muted-foreground">Earn while you learn</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* Built-with-Lovable native co-promotion banner */}
        <a
          href={LOVABLE_REF_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Built with Lovable — create your own app"
          title="Built with Lovable — make your own"
          className={
            collapsed
              ? "flex items-center justify-center rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors py-2"
              : "block rounded-md border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:from-primary/20 hover:via-primary/10 transition-colors px-2.5 py-2"
          }
        >
          {collapsed ? (
            <div className="relative">
              <Sparkles className="h-4 w-4 text-primary" />
              <Heart className="h-2.5 w-2.5 absolute -bottom-1 -right-1 text-[hsl(var(--crimson))] fill-[hsl(var(--crimson))]" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
                  Built with
                </p>
                <p className="text-xs font-semibold text-gradient-gold leading-tight flex items-center gap-1">
                  Lovable
                  <Heart className="h-3 w-3 text-[hsl(var(--crimson))] fill-[hsl(var(--crimson))]" />
                </p>
              </div>
              <span className="text-[9px] text-muted-foreground/70 shrink-0">Make&nbsp;yours</span>
            </div>
          )}
        </a>

        {!collapsed && user && (
          <div className="text-xs text-muted-foreground truncate px-2">
            {user.email}
          </div>
        )}
        <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
